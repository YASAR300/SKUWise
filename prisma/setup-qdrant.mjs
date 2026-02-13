import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";

dotenv.config();

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

async function setup() {
    const collections = ["products", "reviews", "sales"];

    for (const name of collections) {
        try {
            const exists = await client.getCollections();
            const collectionExists = exists.collections.some(c => c.name === name);

            if (!collectionExists) {
                console.log(`Creating collection: ${name}`);
                await client.createCollection(name, {
                    vectors: { size: 3072, distance: "Cosine" },
                });
            } else {
                console.log(`Collection ${name} already exists. Recreating for 3072 dims...`);
                await client.deleteCollection(name);
                await client.createCollection(name, {
                    vectors: { size: 3072, distance: "Cosine" },
                });
            }
        } catch (e) {
            console.error(`Error with ${name}:`, e.message);
        }
    }
}

setup();
