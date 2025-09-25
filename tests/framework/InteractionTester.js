
// tests/framework/InteractionTester.js
const Logger = { // Simple logger for framework
    info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
};
import { DEFAULT_TIMEOUT } from '../utils/constants.js';
import { expect } from '@playwright/test';

export class InteractionTester {
    constructor(page) {
        if (!page) {
            throw new Error("InteractionTester requires a Playwright page object.");
        }
        this.page = page;
    }

    async click(selector, options = {}) {
        const { timeout = DEFAULT_TIMEOUT, force = false, trial = false, waitForNav = false } = options;
        const description = options.description || `element with selector "${selector}"`;
        Logger.info(`[InteractionTester] Clicking ${description}`);
        try {
            const element = this.page.locator(selector).first();
            await element.waitFor({ state: 'visible', timeout });
            await element.waitFor({ state: 'enabled', timeout });

            if (waitForNav) {
                await Promise.all([
                    this.page.waitForNavigation({ timeout, waitUntil: 'domcontentloaded', ...options.navigationOptions }),
                    element.click({ force, trial, timeout })
                ]);
            } else {
                await element.click({ force, trial, timeout });
            }
            Logger.info(`[InteractionTester] Successfully clicked ${description}`);
        } catch (error) {
            Logger.error(`[InteractionTester] Error clicking ${description}:`, error);
            throw error;
        }
    }

    async type(selector, text, options = {}) {
        const { timeout = DEFAULT_TIMEOUT, delay = 50, clearFirst = false } = options;
        const description = `input field with selector "${selector}"`;
        Logger.info(`[InteractionTester] Typing "${text}" into ${description}`);
        try {
            const element = this.page.locator(selector).first();
            await element.waitFor({ state: 'visible', timeout });
            await element.waitFor({ state: 'enabled', timeout });
            if (clearFirst) {
                await element.fill(''); // Clear the input field
            }
            await element.type(text, { delay, timeout });
            Logger.info(`[InteractionTester] Successfully typed into ${description}`);
        } catch (error) {
            Logger.error(`[InteractionTester] Error typing into ${description}:`, error);
            throw error;
        }
    }

    async fill(selector, text, options = {}) {
        const { timeout = DEFAULT_TIMEOUT } = options;
        const description = `input field with selector "${selector}"`;
        Logger.info(`[InteractionTester] Filling "${text}" into ${description}`);
        try {
            const element = this.page.locator(selector).first();
            await element.waitFor({ state: 'visible', timeout });
            await element.waitFor({ state: 'enabled', timeout });
            await element.fill(text, { timeout });
            Logger.info(`[InteractionTester] Successfully filled ${description}`);
        } catch (error) {
            Logger.error(`[InteractionTester] Error filling ${description}:`, error);
            throw error;
        }
    }

    async selectOption(selector, valueOrLabel, options = {}) {
        const { timeout = DEFAULT_TIMEOUT, byValue = true } = options;
        const description = `select dropdown with selector "${selector}"`;
        Logger.info(`[InteractionTester] Selecting option "${valueOrLabel}" in ${description}`);
        try {
            const element = this.page.locator(selector).first();
            await element.waitFor({ state: 'visible', timeout });
            if (byValue) {
                await element.selectOption({ value: valueOrLabel }, { timeout });
            } else {
                await element.selectOption({ label: valueOrLabel }, { timeout });
            }
            Logger.info(`[InteractionTester] Successfully selected option in ${description}`);
        } catch (error) {
            Logger.error(`[InteractionTester] Error selecting option in ${description}:`, error);
            throw error;
        }
    }

    async check(selector, options = {}) {
        const { timeout = DEFAULT_TIMEOUT } = options;
        const description = `checkbox/radio with selector "${selector}"`;
        Logger.info(`[InteractionTester] Checking ${description}`);
        try {
            const element = this.page.locator(selector).first();
            await element.waitFor({ state: 'visible', timeout });
            await element.check({ timeout });
            Logger.info(`[InteractionTester] Successfully checked ${description}`);
        } catch (error) {
            Logger.error(`[InteractionTester] Error checking ${description}:`, error);
            throw error;
        }
    }

    async uncheck(selector, options = {}) {
        const { timeout = DEFAULT_TIMEOUT } = options;
        const description = `checkbox with selector "${selector}"`;
        Logger.info(`[InteractionTester] Unchecking ${description}`);
        try {
            const element = this.page.locator(selector).first();
            await element.waitFor({ state: 'visible', timeout });
            await element.uncheck({ timeout });
            Logger.info(`[InteractionTester] Successfully unchecked ${description}`);
        } catch (error) {
            Logger.error(`[InteractionTester] Error unchecking ${description}:`, error);
            throw error;
        }
    }
    
    async hover(selector, options = {}) {
        const { timeout = DEFAULT_TIMEOUT } = options;
        const description = `element with selector "${selector}"`;
        Logger.info(`[InteractionTester] Hovering over ${description}`);
        try {
            const element = this.page.locator(selector).first();
            await element.waitFor({ state: 'visible', timeout });
            await element.hover({ timeout });
            Logger.info(`[InteractionTester] Successfully hovered over ${description}`);
        } catch (error) {
            Logger.error(`[InteractionTester] Error hovering over ${description}:`, error);
            throw error;
        }
    }

    async expectElementToBeVisible(selector, timeout = DEFAULT_TIMEOUT) {
        Logger.info(`[InteractionTester] Expecting element "${selector}" to be visible.`);
        await expect(this.page.locator(selector).first()).toBeVisible({ timeout });
    }
    
    async expectElementToHaveText(selector, expectedText, timeout = DEFAULT_TIMEOUT) {
        Logger.info(`[InteractionTester] Expecting element "${selector}" to have text "${expectedText}".`);
        await expect(this.page.locator(selector).first()).toHaveText(expectedText, { timeout });
    }
}
