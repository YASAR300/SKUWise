import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";

dotenv.config();

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

async function peek() {
    console.log("=== QDRANT DETAILED PEEK ===");
    try {
        const cols = await qdrant.getCollections();
        for (const c of cols.collections) {
            const info = await qdrant.getCollection(c.name);
            console.log(`\n--- Collection: ${c.name} (${info.points_count} points) ---`);

            const points = await qdrant.scroll(c.name, { limit: 3, with_payload: true });
            points.points.forEach(p => {
                console.log(`- [${p.id}] ${p.payload.productName || p.payload.name || "No Name"}: ${p.payload.content?.substring(0, 100)}...`);
            });

            // Specific check for the missing product
            console.log(`\n🔍 Searching for "Black Aluminium Cup" in ${c.name}...`);
            const search = await qdrant.scroll(c.name, {
                filter: {
                    must: [{ key: "content", match: { text: "Black Aluminium Cup" } }]
                },
                limit: 1
            });
            if (search.points.length > 0) {
                console.log(`✅ FOUND: ${JSON.stringify(search.points[0].payload)}`);
            } else {
                console.log(`❌ NOT FOUND`);
            }
        }
    } catch (e) {
        console.error("Peek failed:", e.message);
    }
}

peek();
