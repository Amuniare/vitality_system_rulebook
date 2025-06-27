// IdGenerator.js - Utility for generating random IDs
export class IdGenerator {
    /**
     * Generate a Roll20-compatible random ID (dash + 16 alphanumeric characters)
     * No underscores, spaces, or special characters
     * @returns {string} Roll20-compatible ID string
     */
    static generateId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `-${result}`;
    }
}