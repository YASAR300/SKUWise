import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { getContext, getDeepContext } from "@/lib/search-utils";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

import { calculateCost, PROVIDERS, MODELS } from "@/lib/usage";
import { generateWithRetry } from "@/lib/api-utils";
import { getGeminiModel } from "@/lib/gemini";

// Strictly enforcing gemini-2.5-flash for the rotation factory

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { query, mode = "quick", persona = "growth", conversationId, attachments = [] } = await request.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        // 1. Get Context from Qdrant based on mode
        let contextString = "";
        let contextResults = [];

        try {
            if (mode === "deep") {
                const deep = await getDeepContext(session.user.id, query);
                contextString = deep.contextString;
                contextResults = deep.rawResults;
            } else {
                contextResults = await getContext(session.user.id, query);
                contextString = contextResults
                    .map(r => `[Source: ${r.id}] ${r.content}`)
                    .join("\n\n");
            }
        } catch (searchError) {
            console.error("Search Context Failed:", searchError.message);
            contextString = "";
        }

        // ── Smart Inventory Context ──────────────────────────────────────────
        // Always run a smart DB query. Vector search alone is unreliable for
        // price-sorted or "most expensive / cheapest" queries.
        try {
            const q = query.toLowerCase();

            // Detect query intent
            const isExpensiveQuery = /expensive|costly|highest price|most expensive|top price|pricey|dear/i.test(q);
            const isCheapQuery = /cheap|cheapest|lowest price|budget|affordable|inexpensive|least expensive/i.test(q);
            const isLowStockQuery = /low stock|running out|reorder|out of stock|critical|alert/i.test(q);
            const isInventoryQuery = /inventory|product|stock|item|sku|how many|count|total|price|list|catalog|show/i.test(q);
            const isStockSortQuery = /most stock|highest stock|most units|least stock|fewest units/i.test(q);

            // Determine sort order based on query intent
            let orderBy = { updatedAt: "desc" };
            if (isExpensiveQuery) orderBy = { price: "desc" };
            else if (isCheapQuery) orderBy = { price: "asc" };
            else if (isLowStockQuery) orderBy = { stock: "asc" };
            else if (isStockSortQuery) orderBy = { stock: "desc" };

            if (isInventoryQuery || isExpensiveQuery || isCheapQuery || isLowStockQuery || isStockSortQuery) {
                // Fetch ALL user products (no artificial limit) so sorted queries are always accurate
                const [allProducts, totalCount] = await Promise.all([
                    prisma.product.findMany({
                        where: { userId: session.user.id },
                        orderBy,
                    }),
                    prisma.product.count({ where: { userId: session.user.id } }),
                ]);

                if (allProducts.length > 0) {
                    // Keyword name-match targeting
                    const queryWords = query.split(/\s+/).filter(w => w.length > 3);
                    const nameMatches = allProducts.filter(p =>
                        queryWords.some(word => p.name.toLowerCase().includes(word.toLowerCase()))
                    );

                    // Build a concise, ordered context string
                    const sortLabel = isExpensiveQuery ? "Highest → Lowest Price"
                        : isCheapQuery ? "Lowest → Highest Price"
                            : isLowStockQuery ? "Lowest → Highest Stock"
                                : "Most Recently Updated";

                    const catalogLines = allProducts
                        .map((p, i) => `${i + 1}. ${p.name} [${p.category}] — ₹${p.price} | Stock: ${p.stock} units | ID: ${p.id}`)
                        .join("\n");

                    const matchSection = nameMatches.length > 0
                        ? `\nNAME MATCHES FOR QUERY:\n${nameMatches.map(p => `- ${p.name}: ₹${p.price} | Stock: ${p.stock}`).join("\n")}\n`
                        : "";

                    const dbSummary = `
LIVE DATABASE SNAPSHOT (sorted by: ${sortLabel}):
- Total Products on Catalog: ${totalCount}
- Low Stock (≤ reorder point): ${allProducts.filter(p => p.stock <= (p.reorderPoint || 10)).length} items
- Out of Stock: ${allProducts.filter(p => p.stock === 0).length} items
${matchSection}
FULL PRODUCT CATALOG (${totalCount} items):
${catalogLines}
`;
                    contextString = (contextString ? contextString + "\n\n" : "") + dbSummary;

                    // Populate context results for source metadata
                    allProducts.forEach(p => {
                        if (!contextResults.find(r => r.id === p.id)) {
                            contextResults.push({
                                id: p.id,
                                collection: "products",
                                content: `${p.name} (${p.category}): ₹${p.price}, ${p.stock} in stock`,
                                score: 1.0,
                                original: p,
                            });
                        }
                    });
                }
            }
        } catch (dbError) {
            console.error("Smart inventory context failed:", dbError);
        }

        // ── Real Sales & Reviews Context (NO FABRICATION) ────────────────────
        // Only include data actually entered by the user. If none = say so clearly.
        try {
            const isSalesQuery = /sale|revenue|sold|units|performance|earn/i.test(query);
            const isReviewQuery = /review|rating|feedback|sentiment|customer|opinion/i.test(query);

            if (isSalesQuery || isReviewQuery) {
                const [salesData, reviewData] = await Promise.all([
                    isSalesQuery ? prisma.salesData.findMany({
                        where: { product: { userId: session.user.id } },
                        include: { product: { select: { name: true, category: true } } },
                        orderBy: { date: "desc" },
                        take: 50,
                    }) : Promise.resolve([]),
                    isReviewQuery ? prisma.review.findMany({
                        where: { product: { userId: session.user.id } },
                        include: { product: { select: { name: true, category: true } } },
                        orderBy: { date: "desc" },
                        take: 50,
                    }) : Promise.resolve([]),
                ]);

                let dataSection = "";

                if (isSalesQuery) {
                    if (salesData.length === 0) {
                        dataSection += "\nSALES DATA: No sales records have been entered by the user yet. Do NOT fabricate any sales figures.\n";
                    } else {
                        const totalRev = salesData.reduce((s, d) => s + d.revenue, 0);
                        const totalUnits = salesData.reduce((s, d) => s + d.unitsSold, 0);
                        const byProduct = {};
                        salesData.forEach(d => {
                            const name = d.product?.name || d.productId;
                            if (!byProduct[name]) byProduct[name] = { revenue: 0, units: 0 };
                            byProduct[name].revenue += d.revenue;
                            byProduct[name].units += d.unitsSold;
                        });
                        dataSection += `\nSALES DATA (User-entered, ${salesData.length} records):
- Total Revenue Recorded: ₹${totalRev.toLocaleString()}
- Total Units Sold: ${totalUnits}
${Object.entries(byProduct).map(([name, d]) => `- ${name}: ₹${d.revenue.toLocaleString()} revenue, ${d.units} units sold`).join("\n")}
`;
                    }
                }

                if (isReviewQuery) {
                    if (reviewData.length === 0) {
                        dataSection += "\nCUSTOMER REVIEWS: No reviews have been entered by the user yet. Do NOT fabricate any ratings or feedback.\n";
                    } else {
                        const avgRating = (reviewData.reduce((s, r) => s + r.rating, 0) / reviewData.length).toFixed(1);
                        dataSection += `\nCUSTOMER REVIEWS (User-entered, ${reviewData.length} reviews):
- Average Rating: ${avgRating}/5
${reviewData.slice(0, 15).map(r => `- ${r.product?.name}: ${r.rating}/5${r.comment ? ` — "${r.comment}"` : ""}`).join("\n")}
`;
                    }
                }

                if (dataSection) {
                    contextString = (contextString ? contextString + "\n\n" : "") + dataSection;
                }
            }
        } catch (dbError) {
            console.error("Sales/Reviews context failed:", dbError);
        }

        // 5. Finalize Sources and Map to Simple IDs for AI
        const finalSources = [];
        const sourceMap = new Map(); // id -> index string

        // Helper to add/get source index
        const getSourceRef = (id, collection, content, original) => {
            if (!id) return "DB";
            if (sourceMap.has(id)) return sourceMap.get(id);
            const index = (finalSources.length + 1).toString();
            sourceMap.set(id, index);
            finalSources.push({
                id: index,
                originalId: id,
                type: collection,
                content: content,
                score: 0.95,
                metadata: original || {}
            });
            return index;
        };

        // Static DB Meta-Source
        finalSources.push({
            id: "DB",
            originalId: "DATABASE",
            type: "system",
            content: "SKUWise Internal Database - Live Inventory & Performance Records",
            score: 1.0,
            metadata: { name: "System Database" }
        });

        // Build the grounded context string for AI
        let currentGroundedContext = "";

        if (mode === "deep") {
            currentGroundedContext = contextString; // Deep mode handles its own identifiers usually
        } else {
            // Standard mode: Map context results to [Source: N]
            currentGroundedContext = (contextResults || []).map(r => {
                const ref = getSourceRef(r.id, r.collection, r.content, r.original);
                return `[Source: ${ref}] ${r.content}`;
            }).join("\n\n");
        }

        // Add DB Snapshot summary if present
        if (contextString.includes("LIVE DATABASE SNAPSHOT")) {
            currentGroundedContext += "\n\n=== OVERALL CATALOG PERFORMANCE ===\n" + contextString;
        }

        // 3. Build Advanced Prompt
        const activePersonaPrompt = persona === "margin"
            ? "MARGIN_OPTIMIZATION_SPECIALIST: Focus on profitability, cost reduction, and high-margin SKUs."
            : "GROWTH_CATALYST: Focus on inventory turnover, market share, and aggressive scaling.";

        const systemPrompt = `
SYSTEM_IDENTITY: You are SKUWise AI, a hyper-intelligent Autonomous E-Commerce Brain.
CURRENT_MODE: ${activePersonaPrompt}

GROUNDING_DATA (VITAL — treat this as absolute truth):
${currentGroundedContext || "NO_DIRECT_DATA_FOUND: Rely on general best practices but warn the user if data is missing."}

CRITICAL RULES (NEVER BREAK):
- SALES DATA: Use ONLY sales figures from GROUNDING_DATA above. If it says "No sales records entered", tell the user exactly that. DO NOT estimate, assume, or fabricate revenue/units numbers.
- REVIEWS: Use ONLY review ratings/comments from GROUNDING_DATA. If it says "No reviews entered", say so. DO NOT invent star ratings or feedback.
- PRODUCTS: Only reference products that appear in the FULL PRODUCT CATALOG above. Do not mention products not listed.

INSTRUCTION_SET:
1. Analyze the USER_QUERY against GROUNDING_DATA only.
2. Be extremely specific (names, stocks, prices, real sales numbers).
3. Cite sources using ONLY the short numerical IDs provided in brackets, e.g., [Source: 1], [Source: 2]. Use [Source: DB] for general database insights.
4. If data is missing for a specific question, say "No data recorded yet — add it via the Catalog page."
5. Provide actionable strategies grounded in real data.
6. If the query is ambiguous, use the CLARIFYING_QUESTIONS section.

USER_QUERY: ${query}

RESPONSE_FORMAT:
- Direct Answer
- Strategic Advice
- CLARIFYING_QUESTIONS (at the very end, separated by 'CLARIFYING_QUESTIONS:')
`;

        let text = "";
        let usageData = {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            model: MODELS.GEMINI_2_5_FLASH,
            provider: PROVIDERS.GOOGLE
        };

        try {
            console.log(`📡 Executing Gemini [${MODELS.GEMINI_2_5_FLASH}] Multimodal...`);
            const promptPart = { text: systemPrompt };
            const parts = [promptPart, ...attachments];
            const result = await generateWithRetry(getGeminiModel, parts);
            text = result.response.text();

            const metadata = result.response.usageMetadata;
            if (metadata) {
                usageData.promptTokens = metadata.promptTokenCount || 0;
                usageData.completionTokens = metadata.candidatesTokenCount || 0;
                usageData.totalTokens = metadata.totalTokenCount || 0;
            }
        } catch (geminiError) {
            console.error("❌ Gemini Call Failed:", geminiError.message);
            throw new Error(`Critical AI Error (Gemini): ${geminiError.message}`);
        }

        const estimatedCost = calculateCost(usageData.model, usageData.promptTokens, usageData.completionTokens);

        // 4. Extract Clarifications
        let answerText = text;
        let clarifications = [];
        if (text.includes("CLARIFYING_QUESTIONS:")) {
            const parts = text.split("CLARIFYING_QUESTIONS:");
            answerText = parts[0].trim();
            clarifications = parts[1].trim().split("\n").map(q => q.replace(/^[-\d.]+\s*/, "").trim()).filter(q => q.length > 0);
        }

        // 6. Save to DB — non-fatal
        let userMessageId = null;
        let aiMessageId = null;
        try {
            const saveOperations = [
                prisma.usageRecord.create({
                    data: {
                        userId: session.user.id,
                        type: "chat",
                        model: usageData.model,
                        promptTokens: usageData.promptTokens,
                        completionTokens: usageData.completionTokens,
                        totalTokens: usageData.totalTokens,
                        cost: estimatedCost,
                        provider: usageData.provider
                    }
                })
            ];

            if (conversationId) {
                const msgsPromise = Promise.all([
                    prisma.message.create({ data: { conversationId, role: "user", content: query } }),
                    prisma.message.create({ data: { conversationId, role: "assistant", content: answerText, sources: finalSources, clarifications } })
                ]).then(([uMsg, aMsg]) => {
                    userMessageId = uMsg.id;
                    aiMessageId = aMsg.id;
                    return [uMsg, aMsg];
                });
                saveOperations.push(msgsPromise);
                saveOperations.push(prisma.conversation.update({
                    where: { id: conversationId },
                    data: { totalQueries: { increment: 1 }, updatedAt: new Date() }
                }));
            }
            await Promise.all(saveOperations);
        } catch (saveError) {
            console.warn("⚠️ DB save failed (non-fatal):", saveError.message?.split("\n")[0]);
        }

        return NextResponse.json({ answer: answerText, clarifications, sources: finalSources, userMessageId, aiMessageId });
    } catch (error) {
        console.error("❌ Chat API Critical Error:", {
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 3).join('\n')
        });

        // Determine the likeliest cause
        let errorType = "General Error";
        let detail = error.message;

        if (error.message?.includes("Gemini") || error.message?.includes("Generative")) {
            errorType = "AI Provider Error";
            detail = "Gemini API rotation failed. Check your API keys and quotas.";
        } else if (error.message?.includes("Prisma") || error.code?.startsWith("P")) {
            errorType = "Database Error";
            detail = "Prisma connection failed. Ensure your database is migrated and reachable.";
        }

        return NextResponse.json({
            error: errorType,
            details: detail,
            raw: error.message
        }, { status: 500 });
    }
}
