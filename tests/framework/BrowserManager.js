
// tests/framework/BrowserManager.js
import { chromium } from '@playwright/test';
// Assuming a simple console logger for framework messages, or adapt as needed.
const Logger = {
    info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
};
import { DEFAULT_TIMEOUT } from '../utils/constants.js';

export class BrowserManager {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
    }

    async launchBrowser(options = {}) {
        try {
            this.browser = await chromium.launch({
                headless: options.headless !== undefined ? options.headless : true,
                slowMo: options.slowMo || 0, // milliseconds
                ...(options.launchOptions || {})
            });
            Logger.info('[BrowserManager] Browser launched.');
        } catch (error) {
            Logger.error('[BrowserManager] Error launching browser:', error);
            throw error;
        }
    }

    async newPage(options = {}) {
        if (!this.browser) {
            Logger.error('[BrowserManager] Browser not launched. Call launchBrowser() first.');
            throw new Error('Browser not launched.');
        }
        try {
            this.context = await this.browser.newContext(options.contextOptions || {});
            this.page = await this.context.newPage();
            this.page.setDefaultTimeout(options.defaultTimeout || DEFAULT_TIMEOUT);
            Logger.info('[BrowserManager] New page created.');
            return this.page;
        } catch (error) {
            Logger.error('[BrowserManager] Error creating new page:', error);
            throw error;
        }
    }

    async closeBrowser() {
        try {
            if (this.page) {
                await this.page.close();
                this.page = null;
            }
            if (this.context) {
                await this.context.close();
                this.context = null;
            }
            if (this.browser) {
                await this.browser.close();
                Logger.info('[BrowserManager] Browser closed.');
                this.browser = null;
            }
        } catch (error) {
            Logger.error('[BrowserManager] Error closing browser resources:', error);
            // Do not re-throw, as this might happen during cleanup
        }
    }

    getPage() {
        if (!this.page) {
            Logger.warn('[BrowserManager] Page not available. Call newPage() first.');
        }
        return this.page;
    }
}
