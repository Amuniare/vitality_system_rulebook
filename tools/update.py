from pathlib import Path

# Content for tests/framework/BrowserManager.js
browser_manager_js_content = r"""
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
"""

# Content for tests/framework/TabNavigator.js
tab_navigator_js_content = r"""
// tests/framework/TabNavigator.js
const Logger = { // Simple logger for framework
    info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
};
import { TAB_BUTTON_SELECTORS, DEFAULT_TIMEOUT } from '../utils/constants.js';
import { TestHelpers } from '../utils/helpers.js';

export class TabNavigator {
    constructor(page) {
        if (!page) {
            throw new Error("TabNavigator requires a Playwright page object.");
        }
        this.page = page;
    }

    async navigateToTab(tabId, options = {}) {
        const { timeout = DEFAULT_TIMEOUT, waitForContentLoaded = true } = options;
        const tabSelector = TAB_BUTTON_SELECTORS[tabId];

        if (!tabSelector) {
            const errorMsg = `[TabNavigator] No selector found for tab ID: ${tabId}. Available selectors: ${Object.keys(TAB_BUTTON_SELECTORS).join(', ')}`;
            Logger.error(errorMsg);
            throw new Error(errorMsg);
        }

        Logger.info(`[TabNavigator] Navigating to tab: ${tabId}`);
        try {
            await this.page.waitForSelector(tabSelector, { state: 'visible', timeout });
            await this.page.click(tabSelector);
            
            // ModernApp's app.js clears #tab-content and then the tab's render() populates it.
            // We wait for a specific signal or a known element of the target tab if possible.
            // As a generic approach, we wait for the tab button to be marked active
            // and for some content to appear in the main tab area.
            await this.page.waitForSelector(`${tabSelector}.active`, { state: 'attached', timeout });

            if (waitForContentLoaded) {
                // Wait for some child element to be present in #tab-content
                // This assumes #tab-content is immediately populated by the tab's render method.
                await this.page.waitForSelector('#tab-content > div', { state: 'attached', timeout });
                // A more robust wait would be for a specific, known element in the target tab.
                // For example, if BasicInfoTab always has a '.basic-info-tab' div:
                // await this.page.waitForSelector(`#tab-content .${tabId}-tab`, { state: 'visible', timeout });
            }
            
            Logger.info(`[TabNavigator] Successfully navigated to tab: ${tabId}`);
        } catch (error) {
            Logger.error(`[TabNavigator] Error navigating to tab ${tabId}:`, error);
            const currentURL = this.page.url();
            Logger.error(`[TabNavigator] Current URL: ${currentURL}`);
            const content = await this.page.content();
            // Logger.error(`[TabNavigator] Page content: ${content.substring(0, 500)}...`);
            throw error;
        }
    }

    async getCurrentTabId() {
        try {
            // Find the button with class 'tab-btn' and 'active'
            const activeTabButton = this.page.locator('button.tab-btn.active');
            const count = await activeTabButton.count();
            if (count > 0) {
                return await activeTabButton.first().getAttribute('data-tab');
            }
            Logger.warn('[TabNavigator] Could not determine current active tab from button states.');
            // Fallback: Inspect #tab-content's first child if it has a class indicating the tab
            const tabContentFirstChild = this.page.locator('#tab-content > div:first-child');
            if (await tabContentFirstChild.count() > 0) {
                const classAttribute = await tabContentFirstChild.first().getAttribute('class');
                if (classAttribute) {
                    const match = classAttribute.match(/(\S+)-tab/); // e.g. "basic-info-tab"
                    if (match && match[1]) {
                        Logger.info(`[TabNavigator] Inferred active tab from content: ${match[1]}`);
                        return match[1];
                    }
                }
            }
            return null;
        } catch (error) {
            Logger.error('[TabNavigator] Error getting current tab ID:', error);
            return null;
        }
    }
}
"""

# Content for tests/framework/ScreenshotCapture.js
screenshot_capture_js_content = r"""
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
"""

# Content for tests/framework/ConsoleLogger.js
console_logger_js_content = r"""
// tests/framework/ConsoleLogger.js
import path from 'node:path';
import fs from 'node:fs/promises';
const Logger = { // Simple logger for framework
    info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
};
import { OUTPUT_DIR_BASE } from '../utils/constants.js';
import { TestHelpers } from '../utils/helpers.js';

export class ConsoleLogger {
    constructor(page, testRunIdentifier = 'general') {
        if (!page) {
            throw new Error("ConsoleLogger requires a Playwright page object.");
        }
        this.page = page;
        const sanitizedIdentifier = testRunIdentifier.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
        this.logDir = path.join(OUTPUT_DIR_BASE, TestHelpers.getTimestamp(), sanitizedIdentifier, 'logs');
        this.logFilePath = path.join(this.logDir, 'console.log');
        this.consoleMessages = [];
        this.isListening = false;
        this._consoleHandler = null; // To store the bound handler for removal
    }

    async initialize() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
            const initialMessage = `Console Log for Test Run: ${this.testRunIdentifier} - Timestamp: ${TestHelpers.getTimestamp()}\nPage URL: ${this.page.url()}\n\n`;
            await fs.writeFile(this.logFilePath, initialMessage);
            Logger.info(`[ConsoleLogger] Log file initialized: ${this.logFilePath}`);
        } catch (error) {
            Logger.error('[ConsoleLogger] Error initializing log file:', error);
            throw error;
        }
    }

    startListening() {
        if (this.isListening) {
            Logger.warn('[ConsoleLogger] Already listening to console events.');
            return;
        }

        this._consoleHandler = async (msg) => {
            const type = msg.type();
            const text = msg.text();
            const location = msg.location(); // { url, lineNumber, columnNumber }
            const timestamp = new Date().toISOString();

            const logEntry = {
                timestamp,
                type,
                text,
                location: `${location.url || 'N/A'}:${location.lineNumber || 'N/A'}:${location.columnNumber || 'N/A'}`,
                args: [],
            };

            // Attempt to serialize arguments, handling potential errors
            try {
                for (const arg of msg.args()) {
                    // jsonValue() can throw if the value is not serializable (e.g. DOM node)
                    // We'll try to convert to string as a fallback.
                    try {
                        const jsonVal = await arg.jsonValue();
                        logEntry.args.push(JSON.stringify(jsonVal));
                    } catch (jsonError) {
                        logEntry.args.push(String(arg)); // Fallback to string representation
                    }
                }
            } catch (e) {
                logEntry.args.push(`[Error serializing args: ${e.message}]`);
            }
            
            this.consoleMessages.push(logEntry);

            const formattedLog = `${logEntry.timestamp} [${logEntry.type.toUpperCase()}] ${logEntry.text}\n  Args: ${logEntry.args.join(', ')}\n  Location: ${logEntry.location}\n---\n`;
            
            try {
                await fs.appendFile(this.logFilePath, formattedLog);
            } catch (fileError) {
                // Log to actual console if file writing fails
                console.error('[ConsoleLogger] CRITICAL: Failed to append to log file:', fileError);
            }

            // Optionally, mirror important messages to the test runner's console
            if (type === 'error' || type === 'warn') {
                console.warn(`[BROWSER ${type.toUpperCase()}] ${text} (at ${logEntry.location})`);
            }
        };

        this.page.on('console', this._consoleHandler);
        this.isListening = true;
        Logger.info('[ConsoleLogger] Started listening to browser console events.');
    }

    stopListening() {
        if (this.isListening && this._consoleHandler) {
            this.page.off('console', this._consoleHandler);
            this.isListening = false;
            Logger.info('[ConsoleLogger] Stopped listening to browser console events.');
            this._consoleHandler = null;
        }
    }

    getMessages(filterType = null) {
        if (filterType) {
            return this.consoleMessages.filter(msg => msg.type === filterType);
        }
        return [...this.consoleMessages]; // Return a copy
    }

    getLogFilePath() {
        return this.logFilePath;
    }

    async writeSummary() {
        if (!this.logFilePath) return;
        const errorCount = this.getMessages('error').length;
        const warningCount = this.getMessages('warn').length;
        const summary = `\n--- CONSOLE LOG SUMMARY ---\nTotal Messages: ${this.consoleMessages.length}\nErrors: ${errorCount}\nWarnings: ${warningCount}\n--- END OF LOG ---\n`;
        try {
            await fs.appendFile(this.logFilePath, summary);
            Logger.info(`[ConsoleLogger] Log summary written to ${this.logFilePath}`);
        } catch (error) {
            console.error('[ConsoleLogger] CRITICAL: Failed to write log summary:', error);
        }
    }
}
"""

files_to_create = {
    "tests/framework/BrowserManager.js": browser_manager_js_content,
    "tests/framework/TabNavigator.js": tab_navigator_js_content,
    "tests/framework/ScreenshotCapture.js": screenshot_capture_js_content,
    "tests/framework/ConsoleLogger.js": console_logger_js_content,
}

def create_files():
    base_dir = Path(".") # Assuming script is run from vitality_system_rulebook root
    for file_path_str, content in files_to_create.items():
        file_path = base_dir / file_path_str
        try:
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(content, encoding='utf-8')
            print(f"Successfully created/updated {file_path}")
        except Exception as e:
            print(f"Error creating/updating {file_path}: {e}")

if __name__ == "__main__":
    create_files()
    print("\nPython script execution complete. Review the generated files.")