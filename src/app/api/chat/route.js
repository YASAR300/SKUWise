import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { getContext, getDeepContext } from "@/lib/search-utils";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { query, mode = "quick", persona = "growth", conversationId } = await request.json();

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
                    .map(r => `[Source: ${r.collection}] ${r.content}`)
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
                        take: 100,
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
${products.slice(0, 10).map(p => `- ${p.name}: ${p.stock} units, ₹${p.price}`).join("\n")}`;
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
Provide professional strategic advice. Append CLARIFYING_QUESTIONS section if needed.`;

        let text = "";
        try {
            const result = await geminiModel.generateContent(systemPrompt);
            text = result.response.text();
        } catch (geminiError) {
            console.warn("Gemini failing, using OpenAI...");
            if (openai) {
                const oaResult = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: query }],
                });
                text = oaResult.choices[0].message.content;
            } else throw geminiError;
        }

        // 4. Extract Clarifications
        let answerText = text;
        let clarifications = [];
        if (text.includes("CLARIFYING_QUESTIONS:")) {
            const parts = text.split("CLARIFYING_QUESTIONS:");
            answerText = parts[0].trim();
            clarifications = parts[1].trim().split("\n").map(q => q.replace(/^[-\d.]+\s*/, "").trim()).filter(q => q.length > 0);
        }

        // 5. Save and Validate
        let userMessageId = null;
        let aiMessageId = null;

        if (conversationId) {
            const conversation = await prisma.conversation.findFirst({
                where: { id: conversationId, userId: session.user.id }
            });

            if (conversation) {
                const [uMsg, aMsg] = await Promise.all([
                    prisma.message.create({ data: { conversationId, role: "user", content: query } }),
                    prisma.message.create({ data: { conversationId, role: "assistant", content: answerText, sources: contextResults.map(r => ({ id: r.id, type: r.collection })), clarifications } })
                ]);
                userMessageId = uMsg.id;
                aiMessageId = aMsg.id;
                await prisma.conversation.update({ where: { id: conversationId }, data: { totalQueries: { increment: 1 }, updatedAt: new Date() } });
            }
        }

        return NextResponse.json({ answer: answerText, clarifications, userMessageId, aiMessageId });
    } catch (error) {
        console.error("Chat API Critical Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
