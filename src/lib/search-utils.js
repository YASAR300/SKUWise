import qdrantClient from "./qdrant";
import { getEmbedding } from "./embeddings";

/**
 * Searches across all relevant collections in Qdrant for context.
 * @param {string} queryText 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function getContext(queryText, limit = 5) {
    const vector = await getEmbedding(queryText);
    const collections = ["products", "reviews", "sales"];
    const results = [];

    for (const collection of collections) {
        try {
            const searchResult = await qdrantClient.search(collection, {
                vector: vector,
                limit: limit,
                with_payload: true,
            });

            searchResult.forEach(res => {
                results.push({
                    collection,
                    score: res.score,
                    content: res.payload.content,
                    id: res.id,
                    original: res.payload
                });
            });
        } catch (err) {
            console.warn(`Search failed for collection ${collection}:`, err.message);
        }
    }

    // Sort by relevance score across all sources
    return results.sort((a, b) => b.score - a.score).slice(0, limit * 2);
}

/**
 * Enhanced retrieval for Deep Research mode.
 * Fetches more data and attempts to group related entities.
 */
export async function getDeepContext(queryText) {
    const vector = await getEmbedding(queryText);
    const collections = ["products", "reviews", "sales"];
    const rawResults = [];

    // 1. Fetch deep context from all silos
    await Promise.all(collections.map(async (collection) => {
        try {
            const searchResult = await qdrantClient.search(collection, {
                vector: vector,
                limit: 15, // Higher limit for deep research
                with_payload: true,
            });

            searchResult.forEach(res => {
                rawResults.push({
                    collection,
                    score: res.score,
                    content: res.payload.content,
                    payload: res.payload
                });
            });
        } catch (err) {
            console.warn(`Deep Search failed for ${collection}:`, err.message);
        }
    }));

    // 2. Synthesis Logic: Group results by Product Name to allow "Full Picture" analysis
    const productProfiles = {};

    rawResults.forEach(res => {
        const pName = res.payload.productName || res.payload.name || "Global";
        if (!productProfiles[pName]) {
            productProfiles[pName] = { product: null, reviews: [], sales: [], general: [] };
        }

        if (res.collection === "products") productProfiles[pName].product = res.content;
        else if (res.collection === "reviews") productProfiles[pName].reviews.push(res.content);
        else if (res.collection === "sales") productProfiles[pName].sales.push(res.content);
        else productProfiles[pName].general.push(res.content);
    });

    // 3. Flatten into a highly semantic context string
    let contextString = "";
    for (const [name, profile] of Object.entries(productProfiles)) {
        if (name === "Global") continue;
        contextString += `### PRODUCT: ${name}\n`;
        if (profile.product) contextString += `- BASE SPECS: ${profile.product}\n`;
        if (profile.sales.length > 0) contextString += `- SALES HISTORY: ${profile.sales.join("; ")}\n`;
        if (profile.reviews.length > 0) contextString += `- CUSTOMER SENTIMENT: ${profile.reviews.join("; ")}\n`;
        contextString += `\n`;
    }

    return {
        contextString,
        rawResults: rawResults.sort((a, b) => b.score - a.score).slice(0, 20)
    };
}
