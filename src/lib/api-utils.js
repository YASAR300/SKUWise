/**
 * fetchWithRetry
 * Utility to fetch with exponential backoff and retry logic.
 */
export async function fetchWithRetry(url, options = {}, retries = 3, backoff = 1000) {
    try {
        const response = await fetch(url, options);

        // Retry on 5xx errors or 429 Rate Limit
        if (!response.ok && (response.status >= 500 || response.status === 429) && retries > 0) {
            console.warn(`⚠️ Request failed with status ${response.status}. Retrying in ${backoff}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }

        return response;
    } catch (error) {
        if (retries > 0) {
            console.warn(`⚠️ Network error: ${error.message}. Retrying in ${backoff}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw error;
    }
}
/**
 * generateWithRetry
 * Specialized retry logic for Google Generative AI to handle 429 quota errors.
 * Now supports API Key Rotation by using a model factory.
 */
export async function generateWithRetry(modelFactory, content, retries = 3, backoffCount = 0) {
    // Determine attempt index for key rotation
    const attemptIndex = backoffCount;
    const model = typeof modelFactory === 'function' ? modelFactory(attemptIndex) : modelFactory;

    try {
        return await model.generateContent(content);
    } catch (error) {
        const isQuotaError = error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("Too Many Requests");

        if (isQuotaError && retries > 0) {
            const currentBackoff = 2000 * Math.pow(2, backoffCount);
            console.warn(`🚀 Gemini Quota Hit (Key Index: ${attemptIndex % 3}). Retrying with next key in ${currentBackoff}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, currentBackoff));
            return generateWithRetry(modelFactory, content, retries - 1, backoffCount + 1);
        }
        throw error;
    }
}

/**
 * embedWithRetry
 * Specialized retry logic for Gemini Embeddings with Key Rotation.
 */
export async function embedWithRetry(modelFactory, content, retries = 3, backoffCount = 0) {
    const attemptIndex = backoffCount;
    const model = typeof modelFactory === 'function' ? modelFactory(attemptIndex) : modelFactory;

    try {
        return await model.embedContent(content);
    } catch (error) {
        const isQuotaError = error.message?.includes("429") || error.message?.includes("quota");
        if (isQuotaError && retries > 0) {
            const currentBackoff = 2000 * Math.pow(2, backoffCount);
            console.warn(`🚀 Gemini Embedding Quota Hit. Rotating key and retrying in ${currentBackoff}ms...`);
            await new Promise(resolve => setTimeout(resolve, currentBackoff));
            return embedWithRetry(modelFactory, content, retries - 1, backoffCount + 1);
        }
        throw error;
    }
}
