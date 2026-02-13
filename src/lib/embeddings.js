import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

/**
 * Generates an embedding for a given text.
 * @param {string} text 
 * @returns {Promise<Array<number>>}
 */
export async function getEmbedding(text) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }

    try {
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error("Embedding generation failed:", error);
        throw error;
    }
}

/**
 * Creates a semantic string representation of various data types for embedding.
 * @param {Object} item 
 * @param {string} type - 'product', 'review', 'sales'
 * @returns {string}
 */
export function createContentString(item, type) {
    if (type === 'product') {
        return `Product Name: ${item.name}. Category: ${item.category}. Price: ₹${item.price}. Stock Level: ${item.stock}. Rating: ${item.rating}/5.`;
    }

    if (type === 'review') {
        return `Customer Review for ${item.productName}. Rating: ${item.rating}/5. Comment: ${item.comment}`;
    }

    if (type === 'sales') {
        return `Sales Record for ${item.productName}. Units Sold: ${item.unitsSold}. Revenue generated: ₹${item.revenue}. Date: ${item.date}`;
    }

    return JSON.stringify(item);
}
