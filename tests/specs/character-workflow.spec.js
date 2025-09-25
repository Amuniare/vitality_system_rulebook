
// tests/specs/character-workflow.spec.js
import { test, expect } from '@playwright/test';
import { TestRunner } from '../framework/TestRunner.js';
import { BASE_URL, TAB_IDS, CHARACTER_NAME_INPUT, CHARACTER_TIER_SELECT, SAVE_BASIC_INFO_BUTTON, APP_LOAD_TIMEOUT } from '../utils/constants.js';
import { TestHelpers } from '../utils/helpers.js';
import { DataGenerators } from '../utils/data-generators.js';

test.describe('Simplified Character Creation Workflow', () => {
    let runner;
    let page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        runner = new TestRunner('CharacterWorkflowTest');
        runner.page = page;
        // Initialize all framework components for the runner
        runner.tabNavigator = new (await import('../framework/TabNavigator.js')).TabNavigator(page);
        runner.screenshotCapture = new (await import('../framework/ScreenshotCapture.js')).ScreenshotCapture(page, runner.testName);
        await runner.screenshotCapture.initialize();
        runner.consoleLogger = new (await import('../framework/ConsoleLogger.js')).ConsoleLogger(page, runner.testName);
        await runner.consoleLogger.initialize();
        runner.consoleLogger.startListening();
        runner.stateValidator = new (await import('../framework/StateValidator.js')).StateValidator(page);
        runner.interactionTester = new (await import('../framework/InteractionTester.js')).InteractionTester(page);
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
        await page.close();
    });

    test('should complete a basic character creation flow', async () => {
        const charInfo = DataGenerators.generateBasicCharacterInfo();
        
        // Step 1: Basic Info
        await runner.runStep('Fill Basic Info', async () => {
            await runner.interactionTester.fill(CHARACTER_NAME_INPUT, charInfo.name);
            await runner.interactionTester.selectOption(CHARACTER_TIER_SELECT, String(charInfo.tier));
            await runner.interactionTester.click(SAVE_BASIC_INFO_BUTTON);
            await TestHelpers.pause(page, 200); // Wait for state to propagate
            await runner.stateValidator.expectCharacterNameToBe(charInfo.name);
            await runner.stateValidator.expectCharacterTierToBe(charInfo.tier);
        });

        // Step 2: Archetypes
        await runner.runStep('Select Archetypes', async () => {
            await runner.tabNavigator.navigateToTab(TAB_IDS.ARCHETYPES);
            // Example: Select the first available movement archetype
            // This requires knowing the actual IDs and structure of archetype selectors
            const movementArchetypeSelector = '#archetype-select-movement'; // From ArchetypeTab.js
            await runner.stateValidator.expectElementToBeVisible(movementArchetypeSelector);
            const firstMovementArchetypeOption = await page.locator(`${movementArchetypeSelector} option >> nth=1`).inputValue();
             if(firstMovementArchetypeOption){
                await runner.interactionTester.selectOption(movementArchetypeSelector, firstMovementArchetypeOption);
                await TestHelpers.pause(page, 200);
                const state = await runner.stateValidator.getCharacterState();
                expect(state.archetypes.movement).toBe(firstMovementArchetypeOption);
            } else {
                console.warn("No movement archetypes found to select for test.");
            }
        });

        // Step 3: Main Pool (Simplified: Purchase one flaw)
        await runner.runStep('Purchase from Main Pool', async () => {
            await runner.tabNavigator.navigateToTab(TAB_IDS.MAIN_POOL);
            // Assume Flaws is the default section or navigate to it
            // This requires knowing the actual ID or selector of a purchasable flaw
            const flawCardSelector = '.purchase-card[data-entity-type="flaw"]'; // Generic
            await runner.stateValidator.expectElementToBeVisible(flawCardSelector); // Wait for cards to render
            
            const firstFlawCard = page.locator(flawCardSelector).first();
            const flawEntityId = await firstFlawCard.getAttribute('data-entity-id');
            
            if (flawEntityId) {
                const purchaseButton = firstFlawCard.locator('button[data-action="purchase"]');
                await purchaseButton.click();
                await TestHelpers.pause(page, 200); // Wait for state update
                const state = await runner.stateValidator.getCharacterState();
                expect(state.flaws.some(f => f.id === flawEntityId)).toBe(true);
            } else {
                console.warn("No flaw card found to purchase for test.");
            }
        });

        // Step 4: Verify Summary (Very basic check)
        await runner.runStep('Verify Summary Tab (Basic Check)', async () => {
            // The SummaryTab is not yet implemented, so we check the sidebar summary
            await runner.stateValidator.expectElementToContainText('#summary-content', charInfo.name);
            // A more thorough check would involve navigating to a Summary tab if it existed
            // and validating all displayed data matches the character state.
        });
        
        await runner.runStep('Final Screenshot', async () => {
            await runner.screenshotCapture.capturePage('character_workflow_complete');
        });
    });
});
