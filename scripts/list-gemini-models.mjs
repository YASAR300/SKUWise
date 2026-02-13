import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function listModels() {
    console.log("=== GEMINI MODELS LIST ===");
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // There isn't a direct listModels in the SDK easily, but we can try common ones
        const models = [
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash",
            "gemini-1.5-pro-latest",
            "gemini-2.5-flash",
            "gemini-2.5-pro",
            "gemini-embedding-001"
        ];

        for (const m of models) {
            try {
                const model = genAI.getGenerativeModel({ model: m });
                await model.generateContent({ contents: [{ role: 'user', parts: [{ text: 'hi' }] }], generationConfig: { maxOutputTokens: 1 } });
                console.log(`🟢 ${m}: Available`);
            } catch (e) {
                console.log(`🔴 ${m}: Failed (${e.message.substring(0, 50)})`);
            }
        }
    } catch (e) {
        console.log(`🔴 Error: ${e.message}`);
    }
}

listModels();
