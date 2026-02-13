import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getContext } from "@/lib/search-utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(request) {
    try {
        const { query, mode = "quick" } = await request.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        // 1. Get Context from Qdrant
        const contextResults = await getContext(query);
        const contextString = contextResults
            .map(r => `[Source: ${r.collection}] ${r.content}`)
            .join("\n\n");

        // 2. Build Prompt
        const systemPrompt = `
      You are SKUWise AI, a elite e-commerce strategic analyst.
      Your goal is to provide deep, actionable insights based on the provided data context.
      
      CONTEXT FROM DATABASE:
      ${contextString || "No specific data found in database for this query."}
      
      USER QUERY:
      ${query}
      
      INSTRUCTIONS:
      - If data is available, cite it specifically.
      - If data is missing, admit it but provide general strategic advice based on e-commerce best practices.
      - Keep the tone professional, direct, and "alpha-focused" (growth and ROI oriented).
      - Use markdown for structure.
    `;

        // 3. Generate Response
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({
            answer: text,
            sources: contextResults.map(r => ({ id: r.id, type: r.collection }))
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
