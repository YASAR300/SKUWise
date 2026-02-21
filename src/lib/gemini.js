import { GoogleGenerativeAI } from "@google/generative-ai";

const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
].filter(Boolean);

/**
 * Returns a Gemini model instance based on a provided index (retry attempt).
 * This enables API key rotation to bypass per-key quota limits.
 * @param {number} attemptIndex - The current retry attempt number
 * @returns {import("@google/generative-ai").GenerativeModel}
 */
export function getGeminiModel(attemptIndex = 0) {
    // Select key based on attempt number (rotation)
    const key = keys[attemptIndex % keys.length];

    if (!key) {
        throw new Error("No Gemini API keys found in environment variables.");
    }

    const genAI = new GoogleGenerativeAI(key);

    // Strictly enforcing gemini-2.5-flash as requested
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * Returns a Gemini Embedding model instance with rotation support.
 */
export function getGeminiEmbeddingModel(attemptIndex = 0) {
    const key = keys[attemptIndex % keys.length];
    if (!key) throw new Error("No Gemini API keys found.");

    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({ model: "text-embedding-004" });
}
