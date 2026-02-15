import { QdrantClient } from '@qdrant/js-client-rest';

let qdrantClient = null;
let qdrantAvailable = false;

try {
    qdrantClient = new QdrantClient({
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        https: true,
        checkCompatibility: false,
        timeout: 5000, // 5 second timeout
    });

    // Test connection on initialization
    (async () => {
        try {
            await qdrantClient.getCollections();
            qdrantAvailable = true;
            console.log("✅ Qdrant client connected successfully");
        } catch (error) {
            qdrantAvailable = false;
            console.warn("⚠️ Qdrant connection failed:", error.message);
            console.warn("⚠️ Vector search disabled. Using direct database queries.");
            console.warn("💡 To fix: Wake up Qdrant Cloud instance at https://cloud.qdrant.io/");
        }
    })();

} catch (error) {
    console.error("❌ Qdrant client initialization failed:", error.message);
    qdrantClient = null;
}

export default qdrantClient;
export { qdrantAvailable };
