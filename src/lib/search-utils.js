import qdrantClient from "./qdrant";
import { getEmbedding } from "./embeddings";

/**
 * Searches across all relevant collections in Qdrant for context.
 * @param {string} queryText 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function getContext(queryText, limit = 5) {
    // Skip if Qdrant is not available
    if (!qdrantClient) {
        console.warn("⚠️ Qdrant not available, returning empty results");
        return [];
    }

    try {
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
    } catch (error) {
        console.error("getContext error:", error.message);
        return [];
    }
}

/**
 * Enhanced retrieval for Deep Research mode.
 * Fetches more data and attempts to group related entities.
 */
export async function getDeepContext(queryText) {
    // Skip if Qdrant is not available
    if (!qdrantClient) {
        console.warn("⚠️ Qdrant not available for deep context");
        return { contextString: "", rawResults: [] };
    }

    try {
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

            if (res.collection === "products") productProfiles[pName].product = res;
            else if (res.collection === "reviews") productProfiles[pName].reviews.push(res);
            else if (res.collection === "sales") productProfiles[pName].sales.push(res);
            else productProfiles[pName].general.push(res);
        });

        // 3. Build Contextual String
        let contextString = "";
        for (const [productName, profile] of Object.entries(productProfiles)) {
            contextString += `\n=== ${productName} ===\n`;
            if (profile.product) contextString += `Product Info: ${profile.product.content}\n`;
            if (profile.reviews.length) contextString += `Reviews: ${profile.reviews.map(r => r.content).join("; ")}\n`;
            if (profile.sales.length) contextString += `Sales: ${profile.sales.map(s => s.content).join("; ")}\n`;
        }

        return { contextString, rawResults };
    } catch (error) {
        console.error("getDeepContext error:", error.message);
        return { contextString: "", rawResults: [] };
    }
}
