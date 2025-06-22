
// tests/specs/visual-regression.spec.js
import { test, expect } from '@playwright/test';
import { TestRunner } from '../framework/TestRunner.js';
import { BASE_URL, TAB_IDS, APP_LOAD_TIMEOUT } from '../utils/constants.js';
import { TestHelpers } from '../utils/helpers.js';

// Note: This spec focuses on CAPTURING screenshots for visual comparison.
// Actual visual diffing often uses Playwright's built-in `expect(page).toHaveScreenshot()`
// or third-party tools. This setup is for generating baseline images.

test.describe('Visual Regression Screenshot Capture', () => {
    let runner;
    let page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        runner = new TestRunner('VisualRegressionCapture');
        runner.page = page;
        runner.tabNavigator = new (await import('../framework/TabNavigator.js')).TabNavigator(page);
        runner.screenshotCapture = new (await import('../framework/ScreenshotCapture.js')).ScreenshotCapture(page, runner.testName);
        await runner.screenshotCapture.initialize();
        // Console logger might not be strictly needed for visual tests but good for debugging
        runner.consoleLogger = new (await import('../framework/ConsoleLogger.js')).ConsoleLogger(page, runner.testName);
        await runner.consoleLogger.initialize();
        runner.consoleLogger.startListening();
        runner.testResults.startTime = new Date();

        await runner.runStep('Initial Page Load for Visual Test', async () => {
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
        await page.close();
    });

    // Iterate over all defined tabs and capture a screenshot for each
    for (const tabKey in TAB_IDS) {
        const tabId = TAB_IDS[tabKey];

        test(`should capture screenshot of ${tabId} tab`, async () => {
            // Dynamically import TAB_BUTTON_SELECTORS inside the async test function
            const { TAB_BUTTON_SELECTORS } = await import('../utils/constants.js');
            const tabButtonSelector = TAB_BUTTON_SELECTORS[tabId];
            if (!tabButtonSelector) {
                console.warn(`Visual test for tab ID "${tabId}" skipped: button selector not defined.`);
                return;
            }

            await runner.runStep(`Navigate to ${tabId} for Screenshot`, async () => {
                await runner.tabNavigator.navigateToTab(tabId, { waitForContentLoaded: true });
                // Add a small delay for any final rendering/animations
                await TestHelpers.pause(page, 500); 
            });

            await runner.runStep(`Capture Full Page Screenshot - ${tabId}`, async () => {
                const screenshotPath = await runner.screenshotCapture.capturePage(`visual_tab_${tabId}_full`);
                expect(screenshotPath).not.toBeNull(); // Check that screenshot was taken
            });

            // Example: Capture a specific element screenshot if needed
            // if (tabId === TAB_IDS.BASIC_INFO) {
            //     await runner.runStep(`Capture Element Screenshot - Character Name Input`, async () => {
            //         const { CHARACTER_NAME_INPUT } = await import('../utils/constants.js');
            //         await runner.screenshotCapture.captureElement(CHARACTER_NAME_INPUT, `visual_element_char_name`);
            //     });
            // }
        });
    }
});
