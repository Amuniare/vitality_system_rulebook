
// tests/specs/tab-navigation.spec.js
import { test, expect } from '@playwright/test';
import { TestRunner } from '../framework/TestRunner.js';
import { BASE_URL, TAB_IDS, TAB_BUTTON_SELECTORS, APP_LOAD_TIMEOUT } from '../utils/constants.js';
import { TestHelpers } from '../utils/helpers.js';

test.describe('Tab Navigation', () => {
    let runner;
    let page; // Keep page instance for direct use

    test.beforeEach(async ({ browser }) => { // Use browser fixture to create context and page
        page = await browser.newPage(); // Create page for each test
        runner = new TestRunner('TabNavigationTest');
        runner.page = page;
        runner.tabNavigator = new (await import('../framework/TabNavigator.js')).TabNavigator(page);
        runner.screenshotCapture = new (await import('../framework/ScreenshotCapture.js')).ScreenshotCapture(page, runner.testName);
        await runner.screenshotCapture.initialize();
        runner.consoleLogger = new (await import('../framework/ConsoleLogger.js')).ConsoleLogger(page, runner.testName);
        await runner.consoleLogger.initialize();
        runner.consoleLogger.startListening();
        runner.stateValidator = new (await import('../framework/StateValidator.js')).StateValidator(page);
        runner.testResults.startTime = new Date();

        await runner.runStep('Initial Page Load', async () => {
            await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: APP_LOAD_TIMEOUT });
            await TestHelpers.waitForAppReady(page);
        });
    });

    test.afterEach(async () => {
        if (runner) {
            runner.consoleLogger.stopListening();
            await runner.consoleLogger.writeSummary();
            runner.testResults.endTime = new Date();
             if (runner.testResults.startTime) {
                 runner.testResults.duration = (runner.testResults.endTime - runner.testResults.startTime) / 1000;
            }
            if (runner.testResults.status === 'pending') runner.testResults.status = 'passed';
            console.log(`Test "${runner.testName}" finished with status: ${runner.testResults.status}.`);
        }
        await page.close(); // Close the page after each test
    });

    // Dynamically create tests for each tab
    for (const tabKey in TAB_IDS) {
        const tabId = TAB_IDS[tabKey];
        const tabButtonSelector = TAB_BUTTON_SELECTORS[tabId];

        if (!tabButtonSelector) {
            console.warn(`Skipping test for tab ID "${tabId}" as its button selector is not defined in constants.js`);
            continue;
        }
        
        test(`should navigate to ${tabId} tab and verify content`, async () => {
            await runner.runStep(`Navigate to ${tabId} Tab`, async () => {
                await runner.tabNavigator.navigateToTab(tabId);
                const currentTab = await runner.tabNavigator.getCurrentTabId();
                expect(currentTab).toBe(tabId);
            });

            await runner.runStep(`Verify ${tabId} Tab is Active and Content Loaded`, async () => {
                await expect(page.locator(tabButtonSelector)).toHaveClass(/active/);
                // Add a simple check for #tab-content having some child elements
                const tabContentChildren = await page.locator('#tab-content > *').count();
                expect(tabContentChildren).toBeGreaterThan(0);
                 // A more specific check for a unique element within that tab would be better
                 // e.g. await runner.stateValidator.expectElementToBeVisible(`#${tabId}-specific-element`);
            });

            await runner.runStep(`Capture Screenshot of ${tabId} Tab`, async () => {
                await runner.screenshotCapture.capturePage(`tab_${tabId}`);
            });
        });
    }
});
