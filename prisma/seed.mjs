import { PrismaClient } from "@prisma/client";
import { QdrantClient } from "@qdrant/js-client-rest";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const prisma = new PrismaClient();
const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const currentModelName = "gemini-embedding-001";

/**
 * Deterministic UUID generator (UUID v5 style using crypto)
 * This ensures the same data always gets the same Qdrant ID.
 */
function generateDeterministicId(input) {
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    // Format as UUID: 8-4-4-4-12
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

/**
 * Robust embedding with retry and backoff
 */
async function getBatchEmbeddings(texts, retries = 3, delay = 20000) {
    try {
        const model = genAI.getGenerativeModel({ model: currentModelName });
        const result = await model.batchEmbedContents({
            requests: texts.map((t) => ({
                content: { role: "user", parts: [{ text: t }] },
                model: `models/${currentModelName}`,
            })),
        });
        return result.embeddings.map((e) => e.values);
    } catch (e) {
        if (retries > 0 && (e.message.includes("429") || e.message.includes("quota"))) {
            console.warn(`⏳ API Quota Pressure. Waiting ${delay / 1000}s...`);
            await new Promise((r) => setTimeout(r, delay));
            return getBatchEmbeddings(texts, retries - 1, delay + 10000);
        }
        console.error("Batch embedding error:", e.message);
        return null;
    }
}

async function main() {
    console.log("🚀 Starting SMART REAL-API Seed (DummyJSON Mode)...");

    // Check Qdrant Health
    let qdrantHealthy = false;
    try {
        await qdrant.getCollections();
        qdrantHealthy = true;
        console.log("✨ Qdrant is ONLINE.");
    } catch (e) {
        console.warn("⚠️ Qdrant is OFFLINE. Proceeding with SQL-only.");
    }

    // 1. PRODUCTS
    console.log("🌐 Fetching real products from DummyJSON...");
    const pResponse = await fetch("https://dummyjson.com/products?limit=50");
    const { products } = await pResponse.json();
    const createdProducts = [];
    const productBatch = [];

    for (const p of products) {
        const dbP = await prisma.product.upsert({
            where: { id: `dj_${p.id}` },
            update: {
                price: p.price,
                cost: p.price * 0.7,
                stock: p.stock,
                imageUrl: p.thumbnail,
                reorderPoint: Math.floor(Math.random() * 41) + 10,
            },
            create: {
                id: `dj_${p.id}`,
                name: p.title,
                category: p.category,
                price: p.price,
                cost: p.price * 0.7, // Simulated cost
                imageUrl: p.thumbnail,
                rating: p.rating,
                stock: p.stock,
                reorderPoint: Math.floor(Math.random() * 41) + 10, // 10-50
            }
        });
        createdProducts.push(dbP);

        if (qdrantHealthy) {
            const content = `Product: ${p.title}. Category: ${p.category}. Description: ${p.description} Price: $${p.price}. Stock: ${p.stock} units available. Rating: ${p.rating}/5.`;
            // DETERMINISTIC ID based on product content
            const pointId = generateDeterministicId(`prod_${dbP.id}_${content}`);
            productBatch.push({ id: pointId, payload: { ...dbP, dbId: dbP.id, content, type: "product" }, content });
        }
    }

    // 2. REVIEWS
    console.log("🗣️ Fetching real comments as reviews...");
    const cResponse = await fetch("https://dummyjson.com/comments?limit=100");
    const { comments } = await cResponse.json();
    const reviewBatch = [];

    for (let i = 0; i < comments.length; i++) {
        const c = comments[i];
        const product = createdProducts[i % createdProducts.length];

        try {
            const review = await prisma.review.upsert({
                where: { id: `rev_${c.id}` },
                update: {},
                create: {
                    id: `rev_${c.id}`,
                    productId: product.id,
                    rating: Math.floor(Math.random() * 2) + 4,
                    comment: c.body,
                    date: new Date()
                }
            });

            if (qdrantHealthy) {
                const content = `Review for ${product.name}: ${c.body}`;
                const pointId = generateDeterministicId(`rev_${review.id}_${content}`);
                reviewBatch.push({ id: pointId, payload: { productId: product.id, rating: review.rating, comment: c.body, dbId: review.id, content, type: "review" }, content });
            }
        } catch (e) { }
    }

    // 3. SALES
    console.log("📈 Fetching carts as sales records...");
    const cartResponse = await fetch("https://dummyjson.com/carts?limit=20");
    const { carts } = await cartResponse.json();
    const salesBatch = [];

    for (const cart of carts) {
        for (const item of cart.products) {
            const targetProductId = createdProducts.find(p => p.id === `dj_${item.id}`)?.id || createdProducts[0].id;
            const saleId = `sale_${cart.id}_${item.id}`;

            const sale = await prisma.salesData.upsert({
                where: { id: saleId },
                update: {},
                create: {
                    id: saleId,
                    productId: targetProductId,
                    unitsSold: item.quantity,
                    revenue: item.total,
                    date: new Date()
                }
            });

            if (qdrantHealthy) {
                const content = `Sale record: ${item.title} sold ${item.quantity} units. Total Revenue: $${item.total}.`;
                const pointId = generateDeterministicId(`sale_${sale.id}_${content}`);
                salesBatch.push({ id: pointId, payload: { productId: targetProductId, unitsSold: item.quantity, revenue: item.total, dbId: sale.id, content, type: "sales" }, content });
            }
        }
    }

    console.log("✅ PostgreSQL matches latest real data.");

    // 4. SMART NEURAL SYNC (Resumable)
    if (qdrantHealthy) {
        console.log("📡 Starting Smart Neural Sync to Qdrant Cloud...");
        const allItems = [...productBatch, ...reviewBatch, ...salesBatch];
        console.log(`📊 Candidates for sync: ${allItems.length}`);

        const typeMap = { "product": "products", "review": "reviews", "sales": "sales" };

        // We'll process in chunks but check existence first
        for (let i = 0; i < allItems.length; i += 10) {
            const candidates = allItems.slice(i, i + 10);
            const toSync = [];

            for (const item of candidates) {
                const collection = typeMap[item.payload.type];
                try {
                    // Quick check if point exists
                    const existing = await qdrant.retrieve(collection, { ids: [item.id] });
                    if (existing.length === 0) {
                        toSync.push(item);
                    }
                } catch (e) {
                    toSync.push(item); // Assume missing if check fails
                }
            }

            if (toSync.length === 0) {
                console.log(`⏩ Skipping chunk ${Math.floor(i / 10) + 1}/${Math.ceil(allItems.length / 10)} (All items already synced)`);
                continue;
            }

            // Sync only the missing items in small batches to respect rate limits
            for (let j = 0; j < toSync.length; j += 5) {
                const chunk = toSync.slice(j, j + 5);
                console.log(`🛰️ Syncing ${chunk.length} NEW items...`);

                const vectors = await getBatchEmbeddings(chunk.map(c => c.content));

                if (!vectors) {
                    console.warn("🛑 Quota limit reached for today. Next run will resume from here!");
                    return; // Graceful exit
                }

                for (let k = 0; k < chunk.length; k++) {
                    const item = chunk[k];
                    const collection = typeMap[item.payload.type];
                    await qdrant.upsert(collection, {
                        points: [{ id: item.id, vector: vectors[k], payload: item.payload }]
                    });
                }
                await new Promise(r => setTimeout(r, 10000));
            }
        }
    }

    console.log("🎉 Smart Seed Complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
