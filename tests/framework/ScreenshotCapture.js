
// tests/framework/ScreenshotCapture.js
import path from 'node:path'; // Using node: prefix for clarity
import fs from 'node:fs/promises';
const Logger = { // Simple logger for framework
    info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
};
import { OUTPUT_DIR_BASE } from '../utils/constants.js';
import { TestHelpers } from '../utils/helpers.js';

export class ScreenshotCapture {
    constructor(page, testRunIdentifier = 'general') {
        if (!page) {
            throw new Error("ScreenshotCapture requires a Playwright page object.");
        }
        this.page = page;
        // Sanitize testRunIdentifier for use in file paths
        const sanitizedIdentifier = testRunIdentifier.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
        this.baseScreenshotDir = path.join(OUTPUT_DIR_BASE, TestHelpers.getTimestamp(), sanitizedIdentifier, 'screenshots');
    }

    async initialize() {
        try {
            await fs.mkdir(this.baseScreenshotDir, { recursive: true });
            Logger.info(`[ScreenshotCapture] Screenshot directory ensured: ${this.baseScreenshotDir}`);
        } catch (error) {
            Logger.error('[ScreenshotCapture] Error creating screenshot directory:', error);
            throw error; // Critical if we can't save screenshots
        }
    }

    async capturePage(nameSuffix, options = {}) {
        const sanitizedName = nameSuffix.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
        const filePath = path.join(this.baseScreenshotDir, `${sanitizedName}.png`);

        try {
            await this.page.screenshot({
                path: filePath,
                fullPage: options.fullPage !== undefined ? options.fullPage : true,
                timeout: options.timeout || 5000, // 5s timeout for screenshot
                ...options
            });
            Logger.info(`[ScreenshotCapture] Page screenshot saved: ${filePath}`);
            return filePath;
        } catch (error) {
            Logger.error(`[ScreenshotCapture] Error capturing page screenshot "${nameSuffix}":`, error);
            // Don't re-throw, allow test to continue if screenshot fails
            return null;
        }
    }

    async captureElement(selector, nameSuffix, options = {}) {
        const sanitizedName = nameSuffix.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
        const filePath = path.join(this.baseScreenshotDir, `${sanitizedName}_element.png`);

        try {
            const element = this.page.locator(selector).first(); // Ensure we target one element
            await element.waitFor({ state: 'visible', timeout: options.timeout || 5000 });
            await element.screenshot({
                path: filePath,
                timeout: options.timeout || 5000,
                ...options
            });
            Logger.info(`[ScreenshotCapture] Element screenshot saved: ${filePath} (selector: ${selector})`);
            return filePath;
        } catch (error) {
            Logger.error(`[ScreenshotCapture] Error capturing element screenshot "${nameSuffix}" for selector "${selector}":`, error);
            return null;
        }
    }

    getScreenshotDirectory() {
        return this.baseScreenshotDir;
    }
}
