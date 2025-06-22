
// tests/framework/TestRunner.js
import { BrowserManager } from './BrowserManager.js';
import { TabNavigator } from './TabNavigator.js';
import { ScreenshotCapture } from './ScreenshotCapture.js';
import { ConsoleLogger } from './ConsoleLogger.js';
import { StateValidator } from './StateValidator.js';
import { InteractionTester } from './InteractionTester.js';
// Assuming a simple console logger for framework messages
const Logger = {
    info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
    group: (label) => console.group(label),
    groupEnd: () => console.groupEnd(),
};

export class TestRunner {
    constructor(testName = 'UnnamedTest') {
        this.testName = testName;
        this.browserManager = new BrowserManager();
        this.page = null;
        this.tabNavigator = null;
        this.screenshotCapture = null;
        this.consoleLogger = null;
        this.stateValidator = null;
        this.interactionTester = null;
        this.testResults = {
            name: testName,
            status: 'pending', // pending, passed, failed
            steps: [],
            startTime: null,
            endTime: null,
            duration: null,
            error: null,
        };
    }

    async setup(browserOptions = {}, pageOptions = {}) {
        this.testResults.startTime = new Date();
        Logger.group(`Setting up test: ${this.testName}`);
        try {
            await this.browserManager.launchBrowser(browserOptions);
            this.page = await this.browserManager.newPage(pageOptions);

            this.tabNavigator = new TabNavigator(this.page);
            this.screenshotCapture = new ScreenshotCapture(this.page, this.testName);
            await this.screenshotCapture.initialize(); // Create directories
            this.consoleLogger = new ConsoleLogger(this.page, this.testName);
            await this.consoleLogger.initialize();
            this.consoleLogger.startListening();
            this.stateValidator = new StateValidator(this.page);
            this.interactionTester = new InteractionTester(this.page);

            Logger.info('[TestRunner] Setup complete.');
            this.addStep('Setup', 'passed', 'Test environment initialized successfully.');
        } catch (error) {
            Logger.error('[TestRunner] Setup failed:', error);
            this.testResults.status = 'failed';
            this.testResults.error = error.message;
            this.addStep('Setup', 'failed', `Setup error: ${error.message}`);
            await this.teardown(); // Attempt cleanup even if setup fails
            throw error;
        } finally {
            Logger.groupEnd();
        }
    }

    addStep(name, status, message = '', details = {}) {
        this.testResults.steps.push({
            name,
            status, // 'passed', 'failed', 'skipped'
            message,
            timestamp: new Date().toISOString(),
            details,
        });
    }

    async runStep(name, stepFunction) {
        Logger.group(`Running step: ${name}`);
        let status = 'passed';
        let message = `${name} completed successfully.`;
        let error = null;
        try {
            await stepFunction();
        } catch (e) {
            status = 'failed';
            message = `${name} failed: ${e.message}`;
            error = e;
            Logger.error(`[TestRunner] Step "${name}" failed:`, e);
            this.testResults.status = 'failed'; // Mark overall test as failed
            this.testResults.error = this.testResults.error || e.message; // Store first error
            // Capture screenshot on failure
            if (this.screenshotCapture) {
                await this.screenshotCapture.capturePage(`failure_${name.replace(/\s+/g, '_')}`);
            }
        } finally {
            this.addStep(name, status, message, error ? { stack: error.stack } : {});
            Logger.groupEnd();
            if (error) throw error; // Re-throw to stop test execution if desired by Playwright's test structure
        }
    }
    
    async teardown() {
        Logger.group(`Tearing down test: ${this.testName}`);
        this.testResults.endTime = new Date();
        if (this.testResults.startTime) {
            this.testResults.duration = (this.testResults.endTime - this.testResults.startTime) / 1000; // seconds
        }

        if (this.testResults.status === 'pending') {
            this.testResults.status = 'passed'; // If no steps failed, mark as passed
        }

        try {
            if (this.consoleLogger) {
                this.consoleLogger.stopListening();
                await this.consoleLogger.writeSummary();
            }
        } catch (e) {
            Logger.error('[TestRunner] Error during console logger teardown:', e);
        }
        
        try {
            if (this.browserManager) {
                await this.browserManager.closeBrowser();
            }
            Logger.info('[TestRunner] Teardown complete.');
            this.addStep('Teardown', 'passed', 'Test environment cleaned up.');
        } catch (error) {
            Logger.error('[TestRunner] Teardown failed:', error);
            this.addStep('Teardown', 'failed', `Teardown error: ${error.message}`);
            // Don't re-throw in teardown
        } finally {
            Logger.groupEnd();
            // Here you might use a ReportGenerator to output testResults
            // For example:
            // const reportGenerator = new ReportGenerator(this.testResults, this.screenshotCapture?.getScreenshotDirectory(), this.consoleLogger?.getLogFilePath());
            // await reportGenerator.generate();
            console.log(`Test "${this.testName}" finished with status: ${this.testResults.status}. Duration: ${this.testResults.duration || 'N/A'}s`);
            console.log('Final Test Results:', JSON.stringify(this.testResults, null, 2));
        }
    }

    // Expose framework components
    getPage() { return this.page; }
    getTabNavigator() { return this.tabNavigator; }
    getScreenshotCapture() { return this.screenshotCapture; }
    getConsoleLogger() { return this.consoleLogger; }
    getStateValidator() { return this.stateValidator; }
    getInteractionTester() { return this.interactionTester; }
}
