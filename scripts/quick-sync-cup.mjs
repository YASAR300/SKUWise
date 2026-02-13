import { QdrantClient } from "@qdrant/js-client-rest";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const prisma = new PrismaClient();

function generateDeterministicId(input) {
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

async function getEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent({
        content: { role: "user", parts: [{ text }] },
        model: "models/gemini-embedding-001"
    });
    return result.embedding.values;
}

async function quickSync() {
    console.log("=== QUICK SYNC: Black Aluminium Cup ===");

    try {
        // Find product in Postgres
        const product = await prisma.product.findFirst({
            where: { name: "Black Aluminium Cup" }
        });

        if (!product) {
            console.log("❌ Product not found in Postgres");
            return;
        }

        console.log("✅ Found in Postgres:", JSON.stringify(product, null, 2));

        // Create updated content with stock
        const content = `Product: ${product.name}. Category: ${product.category}. Price: $${product.price}. Stock: ${product.stock} units available. Rating: ${product.rating}/5.`;
        console.log("\n📝 Updated Content:", content);

        // Generate embedding
        console.log("\n🧠 Generating embedding...");
        const vector = await getEmbedding(content);

        // Generate deterministic ID
        const pointId = generateDeterministicId(`prod_${product.id}_${content}`);

        // Upsert to Qdrant
        console.log("\n🛰️ Syncing to Qdrant...");
        await qdrant.upsert("products", {
            points: [{
                id: pointId,
                vector: vector,
                payload: {
                    ...product,
                    dbId: product.id,
                    content,
                    type: "product"
                }
            }]
        });

        console.log("✅ SYNC COMPLETE!");
        console.log("\n🧪 Now test with: 'Black Aluminium Cup kitni price hai and kitne hai stocks me'");

    } catch (e) {
        console.error("❌ Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

quickSync();
