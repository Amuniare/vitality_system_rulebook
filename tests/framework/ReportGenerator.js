
// tests/framework/ReportGenerator.js
import fs from 'node:fs/promises';
import path from 'node:path';
const Logger = { // Simple logger for framework
    info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
};
import { OUTPUT_DIR_BASE } from '../utils/constants.js';
import { TestHelpers } from '../utils/helpers.js';


// Note: Playwright has excellent built-in HTML, JSON, JUnit reporters.
// This custom ReportGenerator would typically be for:
// 1. Consolidating custom artifacts (like console logs, specific screenshots not tied to failures).
// 2. Generating a very specific report format not covered by Playwright.
// For most use cases, Playwright's built-in reporters are sufficient and preferred.

export class ReportGenerator {
    constructor(testResults, screenshotDir, consoleLogPath, testRunIdentifier = 'general') {
        this.testResults = testResults; // Expected to be the object from TestRunner
        this.screenshotDir = screenshotDir;
        this.consoleLogPath = consoleLogPath;
        const sanitizedIdentifier = testRunIdentifier.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
        this.reportDir = path.join(OUTPUT_DIR_BASE, TestHelpers.getTimestamp(), sanitizedIdentifier, 'custom_reports');
        this.reportFilePath = path.join(this.reportDir, 'custom_test_report.html');
    }

    async initialize() {
        try {
            await fs.mkdir(this.reportDir, { recursive: true });
            Logger.info(`[ReportGenerator] Custom report directory ensured: ${this.reportDir}`);
        } catch (error) {
            Logger.error('[ReportGenerator] Error creating custom report directory:', error);
            // Non-critical, report generation might just fail
        }
    }

    async generate() {
        await this.initialize();
        let htmlContent = `<html><head><title>Custom Test Report: ${this.testResults.name}</title>`;
        htmlContent += `<style>
            body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; color: #333; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #555; }
            .summary { background-color: #fff; padding: 15px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.1); margin-bottom: 20px;}
            .summary p { margin: 5px 0; }
            .status-passed { color: green; font-weight: bold; }
            .status-failed { color: red; font-weight: bold; }
            .steps { list-style-type: none; padding: 0; }
            .step { background-color: #fff; padding: 10px; border-radius: 5px; margin-bottom: 10px; box-shadow: 0 0 5px rgba(0,0,0,0.05); }
            .step-passed { border-left: 5px solid green; }
            .step-failed { border-left: 5px solid red; }
            .step-skipped { border-left: 5px solid orange; }
            .step-name { font-weight: bold; }
            .step-message { margin-top: 5px; }
            .step-details { background-color: #eee; padding: 8px; margin-top: 8px; border-radius: 3px; white-space: pre-wrap; font-family: monospace;}
            a { color: #007bff; text-decoration: none; }
            a:hover { text-decoration: underline; }
        </style></head><body>`;
        htmlContent += `<h1>Test Report: ${this.testResults.name}</h1>`;

        // Summary Section
        htmlContent += `<div class="summary"><h2>Summary</h2>`;
        htmlContent += `<p><strong>Status:</strong> <span class="status-${this.testResults.status}">${this.testResults.status.toUpperCase()}</span></p>`;
        htmlContent += `<p><strong>Start Time:</strong> ${new Date(this.testResults.startTime).toLocaleString()}</p>`;
        htmlContent += `<p><strong>End Time:</strong> ${new Date(this.testResults.endTime).toLocaleString()}</p>`;
        htmlContent += `<p><strong>Duration:</strong> ${this.testResults.duration !== null ? this.testResults.duration.toFixed(2) + 's' : 'N/A'}</p>`;
        if (this.testResults.error) {
            htmlContent += `<p><strong>Overall Error:</strong> <span class="status-failed">${this.testResults.error}</span></p>`;
        }
        if (this.consoleLogPath) {
             htmlContent += `<p><strong>Console Log:</strong> <a href="${path.relative(this.reportDir, this.consoleLogPath)}" target="_blank">${path.basename(this.consoleLogPath)}</a></p>`;
        }
        if (this.screenshotDir) {
            // This part is tricky as we don't have a list of screenshots here.
            // A more advanced version would list screenshots taken.
            htmlContent += `<p><strong>Screenshots Path:</strong> ${this.screenshotDir} (View files manually)</p>`;
        }
        htmlContent += `</div>`;

        // Steps Section
        htmlContent += `<h2>Test Steps (${this.testResults.steps.length})</h2><ul class="steps">`;
        this.testResults.steps.forEach(step => {
            htmlContent += `<li class="step step-${step.status}">`;
            htmlContent += `<p class="step-name">${step.name} - <span class="status-${step.status}">${step.status.toUpperCase()}</span></p>`;
            htmlContent += `<p class="step-message"><em>${step.message}</em></p>`;
            if (step.details && Object.keys(step.details).length > 0) {
                htmlContent += `<div class="step-details">${JSON.stringify(step.details, null, 2)}</div>`;
            }
            htmlContent += `<p><small>Timestamp: ${new Date(step.timestamp).toLocaleString()}</small></p>`;
            htmlContent += `</li>`;
        });
        htmlContent += `</ul>`;

        htmlContent += `</body></html>`;

        try {
            await fs.writeFile(this.reportFilePath, htmlContent);
            Logger.info(`[ReportGenerator] Custom HTML report generated: ${this.reportFilePath}`);
        } catch (error) {
            Logger.error('[ReportGenerator] Error generating custom HTML report:', error);
        }
    }
}
