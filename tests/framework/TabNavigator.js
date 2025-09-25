
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
