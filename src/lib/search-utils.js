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
