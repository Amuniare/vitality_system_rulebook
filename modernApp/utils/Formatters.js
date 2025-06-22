
// modernApp/utils/Formatters.js

/**
 * A collection of utility functions for formatting data for display.
 */
export class Formatters {

    /**
     * Capitalizes the first letter of a string.
     * @param {string} str - The input string.
     * @returns {string}
     */
    static capitalize(str) {
        if (typeof str !== 'string' || str.length === 0) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Converts a camelCase string to a Title Case string.
     * e.g., "specialAttack" -> "Special Attack"
     * @param {string} camelCase - The input string in camelCase.
     * @returns {string}
     */
    static camelToTitle(camelCase) {
        if (typeof camelCase !== 'string' || camelCase.length === 0) return '';
        const result = camelCase.replace(/([A-Z])/g, ' $1');
        return this.capitalize(result);
    }

    /**
     * Truncates a string to a maximum length and adds an ellipsis.
     * @param {string} str - The input string.
     * @param {number} maxLength - The maximum length before truncating.
     * @returns {string}
     */
    static truncate(str, maxLength) {
        if (typeof str !== 'string' || str.length <= maxLength) return str;
        return str.slice(0, maxLength) + '...';
    }

    /**
     * Formats a cost object into a displayable string.
     * @param {object} cost - The cost object, e.g., { value: 30, pool: 'main', display: '30p' }
     * @returns {string} - A formatted string like "30p" or "Free".
     */
    static formatCost(cost) {
        if (!cost) return 'Free';
        if (cost.display) return cost.display;
        if (cost.value === 0) return 'Free';
        if (cost.value) return `${cost.value}p`;
        return 'Variable';
    }

    /**
     * Formats a number with commas as thousands separators.
     * @param {number} num - The number to format.
     * @returns {string}
     */
    static formatNumber(num) {
        if (typeof num !== 'number') return '';
        return num.toLocaleString('en-US');
    }
}
