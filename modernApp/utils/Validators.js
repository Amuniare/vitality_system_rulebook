
// modernApp/utils/Validators.js

/**
 * A collection of simple, reusable validation functions.
 */
export class Validators {

    static isString(value) {
        return typeof value === 'string';
    }

    static isNumber(value) {
        return typeof value === 'number' && !isNaN(value);
    }

    static isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    static isArray(value) {
        return Array.isArray(value);
    }

    /**
     * Checks if a value is "empty".
     * For strings, it checks for non-zero length after trimming.
     * For arrays, it checks for non-zero length.
     * For objects, it checks for having at least one own property.
     * For null or undefined, it returns true.
     * @param {*} value - The value to check.
     * @returns {boolean} - True if the value is considered empty, false otherwise.
     */
    static isEmpty(value) {
        if (value === null || typeof value === 'undefined') return true;
        if (this.isString(value)) return value.trim().length === 0;
        if (this.isArray(value)) return value.length === 0;
        if (this.isObject(value)) return Object.keys(value).length === 0;
        return false;
    }

    /**
     * Checks if a number is within a given range (inclusive).
     * @param {number} num - The number to check.
     * @param {number} min - The minimum value.
     * @param {number} max - The maximum value.
     * @returns {boolean}
     */
    static isWithinRange(num, min, max) {
        return this.isNumber(num) && num >= min && num <= max;
    }

    /**
     * Performs a basic validation for an email format.
     * @param {string} email - The email string to validate.
     * @returns {boolean}
     */
    static isValidEmail(email) {
        if (!this.isString(email)) return false;
        // A simple regex, not exhaustive but good for basic checks.
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
