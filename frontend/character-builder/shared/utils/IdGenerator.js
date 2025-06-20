// IdGenerator.js - Utility for generating random IDs
export class IdGenerator {
    /**
     * Generate a random 16-character string using only letters and numbers
     * No underscores, spaces, or special characters
     * @returns {string} 16-character random string
     */
    static generateId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
}