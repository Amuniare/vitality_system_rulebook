
// tests/utils/data-generators.js

/**
 * Utility functions for generating test data.
 */
export class DataGenerators {
  /**
   * Generates a random string of a given length.
   * @param {number} length - The desired length of the string.
   * @returns {string} - A random alphanumeric string.
   */
  static randomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generates a random character name.
   * @returns {string}
   */
  static randomCharacterName() {
    const prefixes = ['Captain', 'Commander', 'Lord', 'Lady', 'Ser', 'Agent', 'Doctor'];
    const names = ['Alex', 'Jordan', 'Morgan', 'Riley', 'Casey', 'Skyler', 'Phoenix'];
    const suffixes = ['the Bold', 'the Wise', 'of the Void', 'Shadowclaw', 'Ironheart'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix} ${name} ${suffix} ${this.randomString(3)}`; // Add random chars for uniqueness
  }

  /**
   * Generates basic character info.
   * @returns {{name: string, tier: number}}
   */
  static generateBasicCharacterInfo() {
    return {
      name: this.randomCharacterName(),
      tier: Math.floor(Math.random() * 10) + 1, // Tier 1-10
    };
  }

  // Add more data generators as needed:
  // - Function to generate a complete valid character object
  // - Function to generate specific archetype selections
  // - Function to generate attribute distributions
}
