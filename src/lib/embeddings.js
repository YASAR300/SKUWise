import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

// Simple Cache Logic
const CACHE_FILE = path.join(process.cwd(), "src/lib/cache/embeddings.json");

function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
        }
    } catch (e) {
        console.warn("Cache load failed:", e.message);
    }
    return {};
}

function saveCache(cache) {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    } catch (e) {
        console.warn("Cache save failed:", e.message);
    }
}

/**
 * Generates an embedding for a given text with caching and multiple LLM fallbacks.
 * Fallback Chain: Gemini -> OpenAI -> Hugging Face
 * @param {string} text
 * @returns {Promise<Array<number>>}
 */
export async function getEmbedding(text) {
    const cache = loadCache();
    if (cache[text]) {
        console.log("💎 Cache Hit for embedding:", text.substring(0, 30) + "...");
        return cache[text];
    }

    console.log("📡 Fetching new embedding for:", text.substring(0, 30) + "...");

    // 1. Try Gemini (Primary)
    try {
        const result = await geminiModel.embedContent(text);
        const embedding = result.embedding.values;
        cache[text] = embedding;
        saveCache(cache);
        return embedding;
    } catch (error) {
        console.warn("⚠️ Gemini Embedding failed/quota hit. Trying OpenAI...");

        // 2. Try OpenAI (Secondary)
        if (openai) {
            try {
                const response = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: text,
                });
                const embedding = response.data[0].embedding;
                cache[text] = embedding;
                saveCache(cache);
                return embedding;
            } catch (oaError) {
                console.warn("⚠️ OpenAI Embedding failed. Trying Hugging Face...");
            }
        }

        // 3. Try Hugging Face (Tertiary/Last Resort)
        if (process.env.HUGGINGFACE_API_KEY) {
            try {
                const hfResponse = await fetch(
                    "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2",
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                            "Content-Type": "application/json"
                        },
                        method: "POST",
                        body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
                    }
                );

                if (!hfResponse.ok) throw new Error(`HF Status ${hfResponse.status}`);

                const result = await hfResponse.json();
                // HF returns [[emb]] for some models or [emb] for others.
                const embedding = Array.isArray(result[0]) ? result[0] : result;

                if (Array.isArray(embedding)) {
                    cache[text] = embedding;
                    saveCache(cache);
                    return embedding;
                }
            } catch (hfError) {
                console.error("❌ All Embedding fallbacks failed:", hfError.message);
                throw hfError;
            }
        }

        throw error; // Re-throw original if everything failed
    }
}

/**
 * Batch version with caching logic.
 */
export async function batchEmbedContents(texts) {
    // For simplicity in batching, we'll map to individual cached calls
    // Real-world: should optimize batching, but for SKUWise research this is safer.
    return Promise.all(texts.map(t => getEmbedding(t)));
}

/**
 * Creates content string... (unchanged)
 */
export function createContentString(item, type) {
    if (type === 'product') {
        return `Product Name: ${item.name}. Category: ${item.category}. Price: ₹${item.price}. Stock Level: ${item.stock}. Rating: ${item.rating}/5.`;
    }
    if (type === 'review') {
        return `Customer Review for ${item.productName}. Rating: ${item.rating}/5. Comment: ${item.comment}`;
    }
    if (type === 'sales') {
        return `Sales Record for ${item.productName}. Units Sold: ${item.unitsSold}. Revenue generated: ₹${item.revenue}. Date: ${item.date}`;
    }
    return JSON.stringify(item);
}
