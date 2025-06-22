
// tests/framework/StateValidator.js
const Logger = { // Simple logger for framework
    info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
};
import { expect } from '@playwright/test'; // Using Playwright's expect for assertions

export class StateValidator {
    constructor(page) {
        if (!page) {
            throw new Error("StateValidator requires a Playwright page object.");
        }
        this.page = page;
    }

    async getCharacterState() {
        try {
            // This assumes StateManager is globally accessible or on window.modernCharacterBuilder.app.stateManager
            // Adjust the path as necessary based on your app.js
            const state = await this.page.evaluate(() => {
                if (window.modernCharacterBuilder && window.modernCharacterBuilder.stateManager) {
                    return window.modernCharacterBuilder.stateManager.getCharacter();
                }
                if (window.modernCharacterBuilder && window.modernCharacterBuilder.app && window.modernCharacterBuilder.app.stateManager) {
                    return window.modernCharacterBuilder.app.stateManager.getCharacter();
                }
                 if (window.StateManager) { // If StateManager is directly on window
                    return window.StateManager.getCharacter();
                }
                throw new Error('StateManager not found on window.modernCharacterBuilder or window.StateManager');
            });
            return state;
        } catch (error) {
            Logger.error('[StateValidator] Error getting character state from browser:', error);
            throw new Error(`Failed to retrieve character state: ${error.message}`);
        }
    }

    async expectCharacterNameToBe(expectedName) {
        const state = await this.getCharacterState();
        expect(state.name).toBe(expectedName);
        Logger.info(`[StateValidator] PASSED: Character name is "${expectedName}".`);
    }

    async expectCharacterTierToBe(expectedTier) {
        const state = await this.getCharacterState();
        expect(state.tier).toBe(expectedTier);
        Logger.info(`[StateValidator] PASSED: Character tier is ${expectedTier}.`);
    }

    async expectPoolPointsToBe(poolName, expectedPoints, totalOrRemaining = 'remaining') {
        // Example: poolName = 'main', 'combat', 'utility'
        // totalOrRemaining = 'total', 'remaining', 'used'
        const state = await this.getCharacterState();
        // This assumes PoolCalculator is accessible or its results are on character.pools
        // For now, let's assume the summary display is the source of truth for validation
        
        // This is a placeholder. In a real scenario, you'd either:
        // 1. Evaluate PoolCalculator.calculatePools(state) in the browser context.
        // 2. Or, check UI elements that display these pool points.
        // For example, if #summary-point-pools-section contains the text:
        // await expect(this.page.locator('#summary-point-pools-section'))
        //     .toContainText(`${poolName.toUpperCase()}: ${expectedPoints}`, { timeout: 5000 });
        
        Logger.info(`[StateValidator] (Placeholder) Expecting ${poolName} ${totalOrRemaining} points to be ${expectedPoints}.`);
        // Actual validation logic would go here.
        // For instance, to check the Main Pool display from app.js summary:
        if (poolName === 'main' && totalOrRemaining === 'remaining') {
             const displayLocator = this.page.locator('#main-pool-points-display'); // Assuming this ID exists in MainPoolTab
             await expect(displayLocator).toContainText(String(expectedPoints), {timeout: 2000});
        } else if (poolName === 'main' && totalOrRemaining === 'total') {
             const displayLocator = this.page.locator('#main-pool-points-display');
             await expect(displayLocator).toContainText(` / ${expectedPoints}`, {timeout: 2000});
        } else {
            Logger.warn(`[StateValidator] Validation for pool '${poolName}' and type '${totalOrRemaining}' not fully implemented.`);
        }
    }

    async expectElementToHaveText(selector, expectedText) {
        const element = this.page.locator(selector);
        await expect(element).toHaveText(expectedText);
        Logger.info(`[StateValidator] PASSED: Element "${selector}" has text "${expectedText}".`);
    }

    async expectElementToContainText(selector, expectedText) {
        const element = this.page.locator(selector);
        await expect(element).toContainText(expectedText);
        Logger.info(`[StateValidator] PASSED: Element "${selector}" contains text "${expectedText}".`);
    }
    
    async expectElementToBeVisible(selector) {
        const element = this.page.locator(selector);
        await expect(element).toBeVisible();
        Logger.info(`[StateValidator] PASSED: Element "${selector}" is visible.`);
    }

    async expectElementToBeHidden(selector) {
        const element = this.page.locator(selector);
        await expect(element).toBeHidden();
         Logger.info(`[StateValidator] PASSED: Element "${selector}" is hidden.`);
    }

    async expectInputValueToMatch(selector, expectedValue) {
        const element = this.page.locator(selector);
        await expect(element).toHaveValue(expectedValue);
        Logger.info(`[StateValidator] PASSED: Input "${selector}" has value "${expectedValue}".`);
    }

    async expectCheckboxToBeChecked(selector) {
        const element = this.page.locator(selector);
        await expect(element).toBeChecked();
        Logger.info(`[StateValidator] PASSED: Checkbox "${selector}" is checked.`);
    }

    async expectCheckboxToBeUnchecked(selector) {
        const element = this.page.locator(selector);
        await expect(element).not.toBeChecked();
        Logger.info(`[StateValidator] PASSED: Checkbox "${selector}" is unchecked.`);
    }
}
