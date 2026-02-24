import qdrantClient from "./qdrant";
import { getEmbedding, createContentString } from "./embeddings";
import crypto from "crypto";

/**
 * Searches across all relevant collections in Qdrant for context.
 * @param {string} userId
 * @param {string} queryText 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function getContext(userId, queryText, limit = 5) {
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
                    filter: {
                        must: [{ key: "userId", match: { value: userId } }]
                    },
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
 * @param {string} userId
 * @param {string} queryText
 */
export async function getDeepContext(userId, queryText) {
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
                    filter: {
                        must: [{ key: "userId", match: { value: userId } }]
                    },
                    with_payload: true,
                });

                searchResult.forEach(res => {
                    rawResults.push({
                        id: res.id,
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
            if (profile.product) contextString += `Product Info: ${profile.product.content} [Source: ${profile.product.id}]\n`;
            if (profile.reviews.length) {
                contextString += `Reviews: ${profile.reviews.map(r => `${r.content} [Source: ${r.id}]`).join("; ")}\n`;
            }
            if (profile.sales.length) {
                contextString += `Sales: ${profile.sales.map(s => `${s.content} [Source: ${s.id}]`).join("; ")}\n`;
            }
        }

        return { contextString, rawResults };
    } catch (error) {
        console.error("getDeepContext error:", error.message);
        return { contextString: "", rawResults: [] };
    }
}

/**
 * Indexes a single item into Qdrant.
 * @param {Object} item The Prisma model instance
 * @param {string} type 'product' | 'review' | 'sales'
 */
export async function indexToQdrant(item, type) {
    if (!qdrantClient) return;

    try {
        const collectionMap = { product: "products", review: "reviews", sales: "sales" };
        const collection = collectionMap[type];
        if (!collection) throw new Error(`Invalid type: ${type}`);

        const content = createContentString(item, type);
        const vector = await getEmbedding(content);

        // Generate a deterministic ID if not provided
        const pointId = item.id.includes("-") ? item.id :
            crypto.createHash('sha256').update(`${type}_${item.id}`).digest('hex').slice(0, 32);

        await qdrantClient.upsert(collection, {
            points: [{
                id: pointId,
                vector,
                payload: {
                    ...item,
                    dbId: item.id,
                    content,
                    type,
                    indexedAt: new Date().toISOString()
                }
            }]
        });

        console.log(`✅ Indexed ${type} into Qdrant:`, item.id);
    } catch (error) {
        console.error(`❌ Failed to index ${type} to Qdrant:`, error.message);
    }
}
