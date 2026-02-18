/**
 * Simple In-Memory TTL Cache
 * Used for server-side response caching.
 */

const cache = new Map();

/**
 * Get from cache
 * @param {string} key 
 */
export function get(key) {
    const entry = cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
        cache.delete(key);
        return null;
    }

    return entry.value;
}

/**
 * Set in cache
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttl - Time to live in milliseconds (default 5 mins)
 */
export function set(key, value, ttl = 300000) {
    cache.set(key, {
        value,
        expiry: Date.now() + ttl
    });
}

/**
 * Clear specific key or whole cache
 * @param {string} key 
 */
export function clear(key) {
    if (key) {
        cache.delete(key);
    } else {
        cache.clear();
    }
}
