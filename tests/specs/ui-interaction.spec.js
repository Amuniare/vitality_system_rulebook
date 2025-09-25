
// tests/specs/ui-interaction.spec.js
import { test, expect } from '@playwright/test';
import { TestRunner } from '../framework/TestRunner.js';
import { BASE_URL, TAB_IDS, CHARACTER_NAME_INPUT, CHARACTER_TIER_SELECT, SAVE_BASIC_INFO_BUTTON, APP_LOAD_TIMEOUT } from '../utils/constants.js';
import { TestHelpers } from '../utils/helpers.js';
import { DataGenerators } from '../utils/data-generators.js';


test.describe('UI Interactions on Basic Info Tab', () => {
    let runner;
    let page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        runner = new TestRunner('UIInteractionTest_BasicInfo');
        runner.page = page;
        runner.tabNavigator = new (await import('../framework/TabNavigator.js')).TabNavigator(page);
        runner.screenshotCapture = new (await import('../framework/ScreenshotCapture.js')).ScreenshotCapture(page, runner.testName);
        await runner.screenshotCapture.initialize();
        runner.consoleLogger = new (await import('../framework/ConsoleLogger.js')).ConsoleLogger(page, runner.testName);
        await runner.consoleLogger.initialize();
        runner.consoleLogger.startListening();
        runner.stateValidator = new (await import('../framework/StateValidator.js')).StateValidator(page);
        runner.interactionTester = new (await import('../framework/InteractionTester.js')).InteractionTester(page);
        runner.testResults.startTime = new Date();

        await runner.runStep('Initial Page Load and Navigate to Basic Info', async () => {
            await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: APP_LOAD_TIMEOUT });
            await TestHelpers.waitForAppReady(page);
            // Basic Info is the default tab, but explicit navigation is good practice if it weren't
            // await runner.tabNavigator.navigateToTab(TAB_IDS.BASIC_INFO);
            await runner.stateValidator.expectElementToBeVisible(CHARACTER_NAME_INPUT);
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

    test('should allow updating character name and tier', async () => {
        const testData = DataGenerators.generateBasicCharacterInfo();
        const newName = testData.name;
        const newTier = String(testData.tier); // Select options are typically strings

        await runner.runStep('Fill Character Name', async () => {
            await runner.interactionTester.fill(CHARACTER_NAME_INPUT, newName);
            await runner.stateValidator.expectInputValueToMatch(CHARACTER_NAME_INPUT, newName);
        });

        await runner.runStep('Select Character Tier', async () => {
            await runner.interactionTester.selectOption(CHARACTER_TIER_SELECT, newTier, { byValue: true });
            // To verify selection, check the value of the select element
            await expect(page.locator(CHARACTER_TIER_SELECT)).toHaveValue(newTier);
        });

        await runner.runStep('Click Save Basic Info Button', async () => {
            await runner.interactionTester.click(SAVE_BASIC_INFO_BUTTON);
            // Add a small pause or wait for a notification if your app provides one
            await TestHelpers.pause(page, 500); // Wait for state update and potential re-render
        });

        await runner.runStep('Verify StateManager Update for Name and Tier', async () => {
            await runner.stateValidator.expectCharacterNameToBe(newName);
            await runner.stateValidator.expectCharacterTierToBe(testData.tier); // Compare as number
        });

        await runner.runStep('Verify Input Fields Retain Values', async () => {
            // This step is important if the component re-renders after save
            await runner.stateValidator.expectInputValueToMatch(CHARACTER_NAME_INPUT, newName);
            await expect(page.locator(CHARACTER_TIER_SELECT)).toHaveValue(newTier);
        });
        
        await runner.runStep('Check for Console Errors during Interaction', async () => {
            const errors = runner.consoleLogger.getMessages('error');
            // Allow for specific, known errors if any, otherwise expect 0
            expect(errors.length).toBe(0);
        });
    });
});
