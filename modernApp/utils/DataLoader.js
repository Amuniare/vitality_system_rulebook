
// modernApp/utils/DataLoader.js
import { Logger } from './Logger.js';

/**
 * A utility for fetching and caching JSON data.
 */
export class DataLoader {
    static cache = new Map();

    /**
     * Fetches a JSON file, using a cache to avoid redundant requests.
     * @param {string} url - The URL of the JSON file to load.
     * @param {object} [options={}] - Optional fetch options.
     * @returns {Promise<any>} - The parsed JSON data.
     */
    static async loadJSON(url, options = {}) {
        if (this.cache.has(url)) {
            Logger.debug(`[DataLoader] Returning cached data for ${url}`);
            return this.cache.get(url);
        }

        Logger.debug(`[DataLoader] Fetching data from ${url}`);
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${url}`);
            }

            const data = await response.json();
            this.cache.set(url, data);
            return data;
        } catch (error) {
            Logger.error(`[DataLoader] Failed to load JSON from ${url}:`, error);
            throw error; // Re-throw the error so the caller can handle it
        }
    }

    /**
     * Clears the entire cache or a specific entry.
     * @param {string} [url] - The URL to remove from the cache. If omitted, clears the entire cache.
     */
    static clearCache(url) {
        if (url) {
            this.cache.delete(url);
            Logger.info(`[DataLoader] Cache cleared for ${url}`);
        } else {
            this.cache.clear();
            Logger.info('[DataLoader] Entire cache cleared.');
        }
    }
}
