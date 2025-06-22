
// tests/utils/helpers.js

/**
 * Common helper functions for Playwright tests.
 */
export class TestHelpers {
  /**
   * Waits for a specific amount of time.
   * @param {Page} page - The Playwright page object.
   * @param {number} ms - Milliseconds to wait.
   */
  static async pause(page, ms) {
    await page.waitForTimeout(ms);
  }

  /**
   * Waits for the application to signal it's fully loaded.
   * This might involve checking for a specific element or class.
   * @param {Page} page - The Playwright page object.
   */
  static async waitForAppReady(page) {
    // Example: Wait for a specific class on the body or a key element to be visible
    await page.waitForSelector('body.loaded', { timeout: 10000 });
    // Or wait for a specific element that indicates app readiness
    // await page.waitForSelector('#app-ready-indicator', { state: 'visible', timeout: 10000 });
    console.log('App is ready.');
  }

  /**
   * Generates a timestamp string for unique file/folder names.
   * @returns {string} - Formatted timestamp (e.g., YYYYMMDD_HHMMSS).
   */
  static getTimestamp() {
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const HH = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const SS = String(now.getSeconds()).padStart(2, '0');
    return `${YYYY}${MM}${DD}_${HH}${mm}${SS}`;
  }

  // Add more helper functions as needed:
  // - Function to login if your app has auth
  // - Function to set up specific test states
  // - Function to interact with complex UI components
}
