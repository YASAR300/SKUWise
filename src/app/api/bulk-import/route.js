import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";
import { generateWithRetry } from "@/lib/api-utils";
import { getGeminiModel } from "@/lib/gemini";

// ── Helpers ────────────────────────────────────────────────────────────────
function normalize(str) {
    if (!str) return "";
    return String(str).toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function fileToContentPart(file) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const name = (file.name || "").toLowerCase();
    const mime = file.type || "";

    if (name.endsWith(".xlsx") || name.endsWith(".xls") || mime.includes("spreadsheet")) {
        const wb = XLSX.read(buffer, { type: "buffer" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        return { type: "text", text: XLSX.utils.sheet_to_csv(sheet) };
    }
    if (mime === "application/pdf") {
        return { type: "inline", inlineData: { data: buffer.toString("base64"), mimeType: "application/pdf" } };
    }
    return { type: "inline", inlineData: { data: buffer.toString("base64"), mimeType: mime || "image/jpeg" } };
}

async function extractWithAI(contentPart, schema, examples, referenceNames = []) {
    const refPrompt = referenceNames.length > 0
        ? `\nIMPORTANT: Use these exact Product Names or Reference IDs if you find matching items in the content: ${JSON.stringify(referenceNames)}. Prioritize these identifiers to ensure relational data (Sales/Reviews) links correctly to Products.`
        : "";

    const prompt = `
You are a data extraction assistant. Extract structured data from the provided content.
Return ONLY a valid JSON array matching this schema: ${schema}
Example: ${examples}${refPrompt}
If a field is missing, use null. Never add fields not in the schema.
`;
    const parts = [prompt];
    if (contentPart.type === "text") {
        parts.push(contentPart.text);
    } else {
        parts.push(contentPart.inlineData);
    }
    const result = await generateWithRetry(getGeminiModel, parts);
    const text = result.response.text();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("AI did not return a JSON array");
    return JSON.parse(match[0]);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bulk-import
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = session.user.id;

        const formData = await req.formData();
        const commitMode = formData.get("commit") === "true";

        // ── 1. Extract Products ──────────────────────────────────────────────
        let products = [];
        const productsJson = formData.get("productsJson");
        const productsFile = formData.get("productsFile");

        if (productsJson) {
            products = JSON.parse(productsJson);
        } else if (productsFile) {
            const part = await fileToContentPart(productsFile);
            products = await extractWithAI(
                part,
                `[{ "refId": string|null, "name": string, "category": string, "price": number, "stock": number, "cost": number|null, "reorderPoint": number|null }]`,
                `[{ "refId": "P001", "name": "Office Chair", "category": "Furniture", "price": 3499, "stock": 10, "cost": 2100, "reorderPoint": 5 }]`
            );
        } else if (!commitMode) {
            return NextResponse.json({ error: "productsFile is required" }, { status: 400 });
        }

        // Gather all known identifiers for smarter extraction
        const knownIdentifiers = products.map(p => p.refId || p.name).filter(Boolean);

        // ── 2. Extract Sales (optional) ──────────────────────────────────────
        let sales = [];
        const salesJson = formData.get("salesJson");
        const salesFile = formData.get("salesFile");

        if (salesJson) {
            sales = JSON.parse(salesJson);
        } else if (salesFile) {
            const part = await fileToContentPart(salesFile);
            sales = await extractWithAI(
                part,
                `[{ "productRef": string, "unitsSold": number, "revenue": number, "date": string|null }]`,
                `[{ "productRef": "P001", "unitsSold": 3, "revenue": 10497, "date": "2024-02-15" }]`,
                knownIdentifiers
            );
        }

        // ── 3. Extract Reviews (optional) ────────────────────────────────────
        let reviews = [];
        const reviewsJson = formData.get("reviewsJson");
        const reviewsFile = formData.get("reviewsFile");

        if (reviewsJson) {
            reviews = JSON.parse(reviewsJson);
        } else if (reviewsFile) {
            const part = await fileToContentPart(reviewsFile);
            reviews = await extractWithAI(
                part,
                `[{ "productRef": string, "rating": number, "comment": string|null, "date": string|null }]`,
                `[{ "productRef": "P001", "rating": 4, "comment": "Very comfortable", "date": "2024-02-20" }]`,
                knownIdentifiers
            );
        }

        if (!commitMode) {
            return NextResponse.json({ products, sales, reviews });
        }

        // ── 4. Commit to DB ──────────────────────────────────────────────────
        // Fetch existing products for this user to avoid duplicates and enable re-sync
        const existingProducts = await prisma.product.findMany({ where: { userId } });
        const existingProductMap = {}; // normalizedName -> product
        existingProducts.forEach(p => {
            existingProductMap[normalize(p.name)] = p;
        });

        const createdProducts = [];
        const idMap = {}; // source refId -> DB record
        const nameMap = {}; // normalized name -> DB record

        for (const p of products) {
            if (!p.name) continue;
            const normName = normalize(p.name);
            const normalizedCat = p.category
                ? p.category.charAt(0).toUpperCase() + p.category.slice(1).toLowerCase()
                : "General";

            try {
                let product = existingProductMap[normName];

                if (!product) {
                    product = await prisma.product.create({
                        data: {
                            userId,
                            name: String(p.name),
                            category: normalizedCat,
                            price: parseFloat(p.price) || 0,
                            stock: parseInt(p.stock) || 0,
                            cost: p.cost ? parseFloat(p.cost) : (parseFloat(p.price) || 0) * 0.7,
                            reorderPoint: p.reorderPoint ? parseInt(p.reorderPoint) : 10,
                            rating: 5.0,
                        },
                    });
                }
                createdProducts.push(product);

                // Map both original refId and normalized name for maximal connectivity
                if (p.refId) idMap[normalize(p.refId)] = product;
                nameMap[normName] = product;
            } catch (err) {
                console.warn(`⚠️ Skipping product "${p.name}":`, err.message);
            }
        }

        // ── 5. Save Sales (Match by ID first, then Name) ─────────────────────
        const savedSales = [];
        for (const s of sales) {
            if (!s.productRef || !s.unitsSold || !s.revenue) continue;
            const normRef = normalize(s.productRef);
            const product = idMap[normRef] || nameMap[normRef];

            if (!product) continue;
            try {
                const sale = await prisma.salesData.create({
                    data: {
                        productId: product.id,
                        unitsSold: parseInt(s.unitsSold),
                        revenue: parseFloat(s.revenue),
                        date: s.date ? new Date(s.date) : new Date(),
                    },
                });
                savedSales.push(sale);
            } catch (err) {
                console.warn(`⚠️ Sales failed for "${s.productRef}":`, err.message);
            }
        }

        // ── 6. Save Reviews (Match by ID first, then Name) ────────────────────
        const savedReviews = [];
        for (const r of reviews) {
            if (!r.productRef || !r.rating) continue;
            const normRef = normalize(r.productRef);
            const product = idMap[normRef] || nameMap[normRef];

            if (!product) continue;
            try {
                const review = await prisma.review.create({
                    data: {
                        productId: product.id,
                        rating: Math.min(5, Math.max(1, parseInt(r.rating))),
                        comment: r.comment || null,
                        date: r.date ? new Date(r.date) : new Date(),
                    },
                });
                savedReviews.push(review);
            } catch (err) {
                console.warn(`⚠️ Review failed for "${r.productRef}":`, err.message);
            }
        }

        return NextResponse.json({
            success: true,
            created: { products: createdProducts.length, sales: savedSales.length, reviews: savedReviews.length },
        });
    } catch (error) {
        console.error("Bulk Import Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
