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
                const deep = await getDeepContext(query);
                contextString = deep.contextString;
                contextResults = deep.rawResults;
            } else {
                contextResults = await getContext(query);
                contextString = contextResults
                    .map(r => `[Source: ${r.id}] ${r.content}`)
                    .join("\n\n");
            }
        } catch (searchError) {
            console.error("Search Context Failed:", searchError.message);
            contextString = "";
        }

        // 2. Fallback: Fetch user-specific inventory stats
        if (contextResults.length === 0 || !contextString) {
            try {
                const inventoryKeywords = ["inventory", "product", "stock", "item", "sku", "how many", "count", "total"];
                const isInventoryQuery = inventoryKeywords.some(keyword => query.toLowerCase().includes(keyword));

                if (isInventoryQuery) {
                    const products = await prisma.product.findMany({
                        where: { userId: session.user.id },
                        take: 10,
                    });

                    // Add to contextResults so metadata matches
                    products.forEach(p => {
                        contextResults.push({
                            id: p.id,
                            collection: "products",
                            content: `${p.name} (${p.category}): ${p.stock} in stock, price ₹${p.price}`,
                            score: 1.0,
                            original: p
                        });
                    });

                    const totalProducts = await prisma.product.count({ where: { userId: session.user.id } });
                    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
                    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

                    contextString = `INVENTORY SUMMARY (User Data):
- Total Products: ${totalProducts}
- Total Stock Units: ${totalStock}
- Categories: ${categories.join(", ")}
- Low Stock Items: ${products.filter(p => p.reorderPoint && p.stock <= p.reorderPoint).length}

TOP PRODUCTS:
${products.map(p => `- ${p.name}: ${p.stock} units, ₹${p.price} [Source: ${p.id}]`).join("\n")}`;
                }
            } catch (dbError) {
                console.error("Database fallback failed:", dbError);
            }
        }

        // 3. Build Prompt
        const activePersonaPrompt = persona === "margin" ? "MARGIN OPTIMIZATION MODE" : "AGGRESSIVE GROWTH MODE";
        const systemPrompt = `You are SKUWise AI in ${activePersonaPrompt}. 
CONTEXT: ${contextString || "No data found."}
QUERY: ${query}

Provide professional strategic advice. 

CRITICAL: When you use information from the CONTEXT, you MUST cite it using the format [Source: ID] where ID is the source ID provided in the context. 
Example: "Your current stock levels for iPhone 15 are healthy [Source: prod_123]."

Append CLARIFYING_QUESTIONS section if needed.`;

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

            // Build multimodal message parts
            const promptPart = { text: systemPrompt };
            const parts = [promptPart, ...attachments];

            const result = await generateWithRetry(getGeminiModel, parts);
            text = result.response.text();

            // Extract usage metadata from Gemini
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

        // Calculate cost for this request
        const estimatedCost = calculateCost(usageData.model, usageData.promptTokens, usageData.completionTokens);

        // 4. Extract Clarifications
        let answerText = text;
        let clarifications = [];
        if (text.includes("CLARIFYING_QUESTIONS:")) {
            const parts = text.split("CLARIFYING_QUESTIONS:");
            answerText = parts[0].trim();
            clarifications = parts[1].trim().split("\n").map(q => q.replace(/^[-\d.]+\s*/, "").trim()).filter(q => q.length > 0);
        }

        // 5. Format Sources for Frontend
        const sources = contextResults.map(r => ({
            id: r.id,
            type: r.collection,
            content: r.content,
            score: r.score,
            metadata: r.original || {}
        }));

        // 6. Save and Validate
        let userMessageId = null;
        let aiMessageId = null;

        // Perform parallel saves for message and usage record
        const saveOperations = [
            // Save usage record
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
            const conversation = await prisma.conversation.findFirst({
                where: { id: conversationId, userId: session.user.id }
            });

            if (conversation) {
                const msgsPromise = Promise.all([
                    prisma.message.create({ data: { conversationId, role: "user", content: query } }),
                    prisma.message.create({ data: { conversationId, role: "assistant", content: answerText, sources, clarifications } })
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
        }

        await Promise.all(saveOperations);

        return NextResponse.json({ answer: answerText, clarifications, sources, userMessageId, aiMessageId });
    } catch (error) {
        console.error("Chat API Critical Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
