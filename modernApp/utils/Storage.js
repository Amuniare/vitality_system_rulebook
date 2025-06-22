// modernApp/utils/Storage.js
import { Logger } from './Logger.js';

/**
 * Storage utility for localStorage operations with JSON support
 */
export class Storage {
    static prefix = 'vitality_';
    
    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @returns {*} Parsed value or null
     */
    static getItem(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (item === null) {
                return null;
            }
            
            // Try to parse as JSON, fallback to raw string
            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        } catch (error) {
            Logger.error(`[Storage] Failed to get item ${key}:`, error);
            return null;
        }
    }
    
    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store (will be JSON stringified)
     * @returns {boolean} Success status
     */
    static setItem(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serialized);
            return true;
        } catch (error) {
            Logger.error(`[Storage] Failed to set item ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    static removeItem(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            Logger.error(`[Storage] Failed to remove item ${key}:`, error);
            return false;
        }
    }
    
    /**
     * Clear all items with our prefix
     * @returns {boolean} Success status
     */
    static clear() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            Logger.info(`[Storage] Cleared ${keysToRemove.length} items`);
            return true;
        } catch (error) {
            Logger.error('[Storage] Failed to clear storage:', error);
            return false;
        }
    }
    
    /**
     * Check if a key exists
     * @param {string} key - Storage key
     * @returns {boolean} Exists status
     */
    static hasItem(key) {
        return localStorage.getItem(this.prefix + key) !== null;
    }
    
    /**
     * Get all keys with our prefix
     * @returns {string[]} Array of keys (without prefix)
     */
    static getAllKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keys.push(key.substring(this.prefix.length));
            }
        }
        return keys;
    }
    
    /**
     * Get storage size info
     * @returns {Object} Size information
     */
    static getStorageInfo() {
        let totalSize = 0;
        let itemCount = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                const value = localStorage.getItem(key);
                totalSize += key.length + (value ? value.length : 0);
                itemCount++;
            }
        }
        
        return {
            itemCount,
            totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
        };
    }
}