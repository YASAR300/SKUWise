/**
 * Usage Tracking Utilities
 * Constants and functions for calculating API costs and tracking tokens.
 */

export const PROVIDERS = {
    GOOGLE: "google",
    OPENAI: "openai",
};

export const MODELS = {
    GEMINI_1_5_FLASH: "gemini-2.5-flash",
    GEMINI_2_FLASH: "gemini-2.5-flash",
    GEMINI_2_5_FLASH: "gemini-2.5-flash",
    GPT_4O_MINI: "gpt-4o-mini",
    EMBEDDING_004: "text-embedding-004",
};

// Current pricing per 1M tokens (USD) - Approximate values for estimation
// Flash 2.5: $0.10 / 1M prompt, $0.40 / 1M completion (Assuming same as 2.0)
// Flash 2.0: $0.10 / 1M prompt, $0.40 / 1M completion
// GPT-4o-mini: $0.15 / 1M prompt, $0.60 / 1M completion
export const PRICING = {
    [MODELS.GEMINI_1_5_FLASH]: {
        prompt: 0.075 / 1000000,
        completion: 0.30 / 1000000,
    },
    [MODELS.GEMINI_2_FLASH]: {
        prompt: 0.10 / 1000000,
        completion: 0.40 / 1000000,
    },
    [MODELS.GEMINI_2_5_FLASH]: {
        prompt: 0.10 / 1000000,
        completion: 0.40 / 1000000,
    },
    [MODELS.GPT_4O_MINI]: {
        prompt: 0.15 / 1000000,
        completion: 0.60 / 1000000,
    },
    [MODELS.EMBEDDING_004]: {
        prompt: 0.02 / 1000000,
        completion: 0,
    }
};

/**
 * Calculate the estimated cost of an API call.
 * @param {string} model - The model name.
 * @param {number} promptTokens - Number of prompt tokens.
 * @param {number} completionTokens - Number of completion tokens.
 * @returns {number} Estimated cost in USD.
 */
export function calculateCost(model, promptTokens, completionTokens = 0) {
    const pricing = PRICING[model] || { prompt: 0, completion: 0 };
    return (promptTokens * pricing.prompt) + (completionTokens * pricing.completion);
}
