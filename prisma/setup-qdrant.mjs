import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";

dotenv.config();

const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    https: true,
    checkCompatibility: false,
});

async function setup() {
    console.log("🚀 Starting Qdrant setup...");
    console.log("📡 Qdrant URL:", process.env.QDRANT_URL);

    try {
        // Test connection first
        console.log("\n✅ Testing Qdrant connection...");
        const collections = await client.getCollections();
        console.log("✅ Connection successful!");
        console.log("📦 Existing collections:", collections.collections.map(c => c.name).join(", ") || "None");
    } catch (error) {
        console.error("❌ Failed to connect to Qdrant:", error.message);
        console.error("\n🔍 Troubleshooting:");
        console.error("1. Check if QDRANT_URL is correct in .env");
        console.error("2. Check if QDRANT_API_KEY is valid");
        console.error("3. Check if Qdrant Cloud instance is active (not sleeping)");
        console.error("4. Try accessing Qdrant dashboard: https://cloud.qdrant.io/");
        process.exit(1);
    }

    const collectionNames = ["products", "reviews", "sales"];
    const vectorSize = 3072; // Gemini embedding-001 returns 3072 in this env

    for (const name of collectionNames) {
        try {
            const exists = await client.getCollections();
            const collectionExists = exists.collections.some(c => c.name === name);

            if (collectionExists) {
                console.log(`\n📦 Collection "${name}" already exists`);

                // Get collection info
                const info = await client.getCollection(name);
                console.log(`   Vector size: ${info.config.params.vectors.size}`);
                console.log(`   Points count: ${info.points_count || 0}`);

                // Check if vector size matches
                if (info.config.params.vectors.size !== vectorSize) {
                    console.log(`   ⚠️  Vector size mismatch! Recreating with size ${vectorSize}...`);
                    await client.deleteCollection(name);
                    await client.createCollection(name, {
                        vectors: { size: vectorSize, distance: "Cosine" },
                    });
                    console.log(`   ✅ Collection "${name}" recreated`);
                } else {
                    console.log(`   ✅ Collection "${name}" is properly configured`);
                }
            } else {
                console.log(`\n📦 Creating collection: ${name}`);
                await client.createCollection(name, {
                    vectors: { size: vectorSize, distance: "Cosine" },
                });
                console.log(`   ✅ Collection "${name}" created with vector size ${vectorSize}`);
            }
        } catch (e) {
            console.error(`❌ Error with collection "${name}":`, e.message);
        }
    }

    console.log("\n✅ Qdrant setup complete!");
    console.log("\n📊 Summary:");
    try {
        const finalCollections = await client.getCollections();
        finalCollections.collections.forEach(c => {
            console.log(`   - ${c.name}`);
        });
    } catch (e) {
        console.error("Failed to get final collections:", e.message);
    }
}

setup().catch(console.error);
