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
