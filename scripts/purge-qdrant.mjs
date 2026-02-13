import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";

dotenv.config();

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

async function purge() {
    console.log("=== QDRANT PURGE ===");
    try {
        const collections = ["products", "reviews", "sales"];
        for (const col of collections) {
            console.log(`🧹 Clearing collection: ${col}...`);
            // We delete the collection and recreate it to ensure a clean slate
            // BUT wait, recreate needs the configuration. 
            // Better to delete all points.
            await qdrant.delete(col, {
                filter: {
                    must: [] // Empty filter match all
                }
            });
            console.log(`✅ ${col} cleared.`);
        }
    } catch (e) {
        console.error("Purge failed:", e.message);
    }
}

purge();
