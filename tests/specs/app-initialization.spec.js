
// tests/specs/app-initialization.spec.js
import { test, expect } from '@playwright/test';
import { TestRunner } from '../framework/TestRunner.js';
import { BASE_URL, APP_LOAD_TIMEOUT, TAB_IDS } from '../utils/constants.js';
import { TestHelpers } from '../utils/helpers.js';

test.describe('Application Initialization', () => {
    let runner;

    test.beforeEach(async ({ page }) => {
        runner = new TestRunner('AppInitializationTest');
        // Pass an empty object for browserOptions to use defaults,
        // and provide the page object directly if Playwright manages its creation.
        // For true TestRunner control, you'd call runner.setup() which creates its own page.
        // Let's assume Playwright's `page` fixture is used, and we adapt TestRunner.
        runner.page = page; // Assign Playwright's page to the runner
        runner.tabNavigator = new (await import('../framework/TabNavigator.js')).TabNavigator(page);
        runner.screenshotCapture = new (await import('../framework/ScreenshotCapture.js')).ScreenshotCapture(page, runner.testName);
        await runner.screenshotCapture.initialize();
        runner.consoleLogger = new (await import('../framework/ConsoleLogger.js')).ConsoleLogger(page, runner.testName);
        await runner.consoleLogger.initialize();
        runner.consoleLogger.startListening();
        runner.stateValidator = new (await import('../framework/StateValidator.js')).StateValidator(page);
        // testResults setup from TestRunner
        runner.testResults.startTime = new Date();
    });

    test.afterEach(async () => {
        if (runner) {
            // Simplified teardown as Playwright handles browser closing
            runner.consoleLogger.stopListening();
            await runner.consoleLogger.writeSummary();
            runner.testResults.endTime = new Date();
            if (runner.testResults.startTime) {
                 runner.testResults.duration = (runner.testResults.endTime - runner.testResults.startTime) / 1000;
            }
             if (runner.testResults.status === 'pending') {
                runner.testResults.status = 'passed';
            }
            console.log(`Test "${runner.testName}" finished with status: ${runner.testResults.status}.`);
        }
    });

    test('should load the application and display the main layout', async ({ page }) => {
        await runner.runStep('Navigate to Base URL and Wait for App Ready', async () => {
            await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: APP_LOAD_TIMEOUT });
            await TestHelpers.waitForAppReady(page); // Waits for body.loaded
            await expect(page).toHaveTitle(/Vitality Character Builder - Modern/);
            runner.addStep('Navigation and App Ready', 'passed', `Loaded ${BASE_URL}`);
        });

        await runner.runStep('Verify Main Layout Elements', async () => {
            await runner.stateValidator.expectElementToBeVisible('header.app-header');
            await runner.stateValidator.expectElementToBeVisible('nav.tab-navigation');
            await runner.stateValidator.expectElementToBeVisible('main.tab-container');
            await runner.stateValidator.expectElementToBeVisible('aside.character-summary');
            await runner.stateValidator.expectElementToBeVisible('#tab-content');
            await runner.stateValidator.expectElementToBeVisible('#summary-content');
            runner.addStep('Layout Verification', 'passed', 'Main layout elements are visible.');
        });
        
        await runner.runStep('Verify Initial Tab is Basic Info', async () => {
            const initialTabId = await runner.tabNavigator.getCurrentTabId();
            expect(initialTabId).toBe(TAB_IDS.BASIC_INFO);
            // Check if basic info tab specific content is visible
            await runner.stateValidator.expectElementToBeVisible('#character-name');
            runner.addStep('Initial Tab Check', 'passed', `Initial tab is '${TAB_IDS.BASIC_INFO}'.`);
        });

        await runner.runStep('Verify Initial Character State (Name and Tier)', async () => {
            // Default name in StateManager is "New Character"
            // Default tier in StateManager is 4 (after schema validation with default)
            await runner.stateValidator.expectCharacterNameToBe('New Character');
            await runner.stateValidator.expectCharacterTierToBe(4);
            runner.addStep('Initial State Check', 'passed', 'Default character name and tier are correct.');
        });

        await runner.runStep('Check for Console Errors on Load', async () => {
            const errors = runner.consoleLogger.getMessages('error');
            expect(errors.length).toBe(0);
            runner.addStep('Console Error Check', 'passed', 'No console errors on initial load.');
        });
    });
});
