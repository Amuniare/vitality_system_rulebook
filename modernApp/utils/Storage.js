
// modernApp/utils/Storage.js
import { Logger } from './Logger.js';

/**
 * A robust wrapper for localStorage that provides versioning.
 */
export class Storage {
    constructor(prefix = 'vitality-app-', version = '1.0') {
        this.prefix = prefix;
        this.version = version;
        this.storage = window.localStorage;
    }

    _getPrefixedKey(key) {
        return `${this.prefix}${key}`;
    }

    /**
     * Stores an item in localStorage, wrapped with version info.
     * @param {string} key - The key for the item.
     * @param {*} value - The value to store. Will be JSON stringified.
     */
    setItem(key, value) {
        const prefixedKey = this._getPrefixedKey(key);
        const dataToStore = {
            version: this.version,
            payload: value,
            timestamp: Date.now()
        };

        try {
            this.storage.setItem(prefixedKey, JSON.stringify(dataToStore));
        } catch (error) {
            Logger.error(`[Storage] Failed to set item "${key}":`, error);
        }
    }

    /**
     * Retrieves an item from localStorage.
     * @param {string} key - The key of the item to retrieve.
     * @returns {*} The stored value, or null if not found, invalid, or version mismatch.
     */
    getItem(key) {
        const prefixedKey = this._getPrefixedKey(key);
        try {
            const rawData = this.storage.getItem(prefixedKey);
            if (!rawData) {
                return null;
            }

            const storedData = JSON.parse(rawData);

            if (storedData.version !== this.version) {
                Logger.warn(`[Storage] Version mismatch for key "${key}". Expected ${this.version}, found ${storedData.version}. Data will be ignored.`);
                // Here, you could implement migration logic in a real app.
                // For now, we'll just discard the old data.
                this.removeItem(key);
                return null;
            }

            return storedData.payload;
        } catch (error) {
            Logger.error(`[Storage] Failed to get or parse item "${key}":`, error);
            return null;
        }
    }

    /**
     * Removes an item from localStorage.
     * @param {string} key - The key of the item to remove.
     */
    removeItem(key) {
        const prefixedKey = this._getPrefixedKey(key);
        this.storage.removeItem(prefixedKey);
    }

    /**
     * Clears all items from localStorage that have the configured prefix.
     */
    clear() {
        for (let i = this.storage.length - 1; i >= 0; i--) {
            const key = this.storage.key(i);
            if (key && key.startsWith(this.prefix)) {
                this.storage.removeItem(key);
            }
        }
        Logger.info(`[Storage] Cleared all items with prefix "${this.prefix}".`);
    }
}

