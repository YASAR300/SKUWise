import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { getContext, getDeepContext } from "@/lib/search-utils";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

export async function POST(request) {
    try {
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
            console.error("Search Context Failed (Likely Quota):", searchError.message);
            // Non-critical: proceed with empty context
            contextString = "";
        }

        // 2. Fallback: If no vector results, fetch basic inventory stats directly from database
        if (contextResults.length === 0 || !contextString) {
            try {
                // Check if query is about inventory/products
                const inventoryKeywords = ["inventory", "product", "stock", "item", "sku", "how many", "count", "total"];
                const isInventoryQuery = inventoryKeywords.some(keyword =>
                    query.toLowerCase().includes(keyword)
                );

                if (isInventoryQuery) {
                    const products = await prisma.product.findMany({
                        take: 100, // Limit for performance
                    });

                    const totalProducts = await prisma.product.count();
                    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
                    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
                    const lowStock = products.filter(p => p.reorderPoint && p.stock <= p.reorderPoint);
                    const outOfStock = products.filter(p => p.stock === 0);

                    contextString = `
INVENTORY DATABASE SUMMARY:
- Total Products: ${totalProducts}
- Total Stock Units: ${totalStock}
- Categories: ${categories.join(", ")}
- Low Stock Items: ${lowStock.length}
- Out of Stock Items: ${outOfStock.length}

TOP PRODUCTS:
${products.slice(0, 10).map(p => `- ${p.name} (SKU: ${p.sku}): ${p.stock} units, $${p.price}`).join("\n")}
                    `.trim();

                    console.log("✅ Using direct database fallback for inventory query");
                }
            } catch (dbError) {
                console.error("Database fallback failed:", dbError);
            }
        }

        // 2. Build Persona-Specific Guidance
        const activePersonaPrompt = persona === "margin" ? `
        FOCUS: MARGIN OPTIMIZATION
        - Prioritize high-profitability SKUs.
        - Look for cost-reduction opportunities and pricing premiumization strategies.
        - Analyze Customer Lifetime Value (LTV) vs Acquisition Cost.
        - Provide advice that protects the bottom line, even at the cost of slower volume growth.
      ` : `
        FOCUS: AGGRESSIVE GROWTH
        - Prioritize market share expansion and volume.
        - Look for customer acquisition strategies and competitive pricing moves.
        - Analyze inventory turnover and aggressive replenishment.
        - Provide advice that scales the brand, prioritizing top-line revenue and market dominance.
      `;

        // 3. Build Final System Prompt
        const systemPrompt = `
      You are SKUWise AI, a elite e-commerce strategic analyst operating in ${persona.toUpperCase()} mode.
      Your goal is to provide deep, actionable insights based on the provided data context.
      
      ${activePersonaPrompt}
      
      CONTEXT FROM DATABASE:
      ${contextString || "No specific data found in database for this query."}
      
      USER QUERY:
      ${query}
      
      CRITICAL INSTRUCTION:
      If the user query is too broad, ambiguous, or requires clarification, you MUST append a section called "CLARIFYING_QUESTIONS" at the end of your response.
      
      FORMAT:
      ---
      CLARIFYING_QUESTIONS:
      - Question 1?
      - Question 2?
      
      INSTRUCTIONS:
      - Cite data if available.
      - If data is missing (e.g. quota limited), admit it but provide top-tier strategic advice.
      - professional, direct, alpha-focused tone.
    `;

        let text = "";

        // 4. Generate Response (Gemini -> OpenAI fallback)
        try {
            const result = await geminiModel.generateContent(systemPrompt);
            const response = await result.response;
            text = response.text();
        } catch (geminiError) {
            console.warn("⚠️ Gemini Chat failed. Trying OpenAI fallback...");
            if (openai) {
                const oaResult = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: query }],
                });
                text = oaResult.choices[0].message.content;
            } else {
                throw geminiError;
            }
        }

        // 5. Extraction of Clarifying Questions
        let answerText = text;
        let clarifications = [];

        if (text.includes("CLARIFYING_QUESTIONS:")) {
            const parts = text.split("CLARIFYING_QUESTIONS:");
            answerText = parts[0].replace("---", "").trim();
            clarifications = parts[1]
                .trim()
                .split("\n")
                .map(q => q.replace(/^[-\d.]+\s*/, "").trim())
                .filter(q => q.length > 0);
        }

        // 6. Save messages to database (if conversationId provided)
        let userMessageId = null;
        let aiMessageId = null;

        if (conversationId) {
            try {
                // Save user message
                const userMessage = await prisma.message.create({
                    data: {
                        conversationId,
                        role: "user",
                        content: query,
                    }
                });
                userMessageId = userMessage.id;

                // Save AI response
                const aiMessage = await prisma.message.create({
                    data: {
                        conversationId,
                        role: "assistant",
                        content: answerText,
                        sources: contextResults.map(r => ({ id: r.id, type: r.collection })),
                        clarifications: clarifications,
                    }
                });
                aiMessageId = aiMessage.id;

                // Update conversation metadata
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: {
                        totalQueries: { increment: 1 },
                        updatedAt: new Date(),
                    }
                });

                console.log(`✅ Messages saved to database: User=${userMessageId}, AI=${aiMessageId}`);
            } catch (dbError) {
                console.error("❌ Failed to save messages to database:", dbError);
                // Continue without failing - messages still returned to user
            }
        }

        return NextResponse.json({
            answer: answerText,
            clarifications: clarifications,
            sources: contextResults.map(r => ({ id: r.id, type: r.collection })),
            userMessageId,
            aiMessageId,
        });

    } catch (error) {
        console.error("Chat API Critical Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
