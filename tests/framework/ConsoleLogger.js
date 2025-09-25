
// tests/framework/ConsoleLogger.js
import path from 'node:path';
import fs from 'node:fs/promises';
const Logger = { // Simple logger for framework
    info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
};
import { OUTPUT_DIR_BASE } from '../utils/constants.js';
import { TestHelpers } from '../utils/helpers.js';

export class ConsoleLogger {
    constructor(page, testRunIdentifier = 'general') {
        if (!page) {
            throw new Error("ConsoleLogger requires a Playwright page object.");
        }
        this.page = page;
        const sanitizedIdentifier = testRunIdentifier.replace(/[^a-z0-9_.-]/gi, '_').toLowerCase();
        this.logDir = path.join(OUTPUT_DIR_BASE, TestHelpers.getTimestamp(), sanitizedIdentifier, 'logs');
        this.logFilePath = path.join(this.logDir, 'console.txt');
        this.consoleMessages = [];
        this.isListening = false;
        this._consoleHandler = null; // To store the bound handler for removal
    }

    async initialize() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
            const initialMessage = `Console Log for Test Run: ${this.testRunIdentifier} - Timestamp: ${TestHelpers.getTimestamp()}\nPage URL: ${this.page.url()}\n\n`;
            await fs.writeFile(this.logFilePath, initialMessage);
            Logger.info(`[ConsoleLogger] Log file initialized: ${this.logFilePath}`);
        } catch (error) {
            Logger.error('[ConsoleLogger] Error initializing log file:', error);
            throw error;
        }
    }

    startListening() {
        if (this.isListening) {
            Logger.warn('[ConsoleLogger] Already listening to console events.');
            return;
        }

        this._consoleHandler = async (msg) => {
            const type = msg.type();
            const text = msg.text();
            const location = msg.location(); // { url, lineNumber, columnNumber }
            const timestamp = new Date().toISOString();

            const logEntry = {
                timestamp,
                type,
                text,
                location: `${location.url || 'N/A'}:${location.lineNumber || 'N/A'}:${location.columnNumber || 'N/A'}`,
                args: [],
            };

            // Attempt to serialize arguments, handling potential errors
            try {
                for (const arg of msg.args()) {
                    // jsonValue() can throw if the value is not serializable (e.g. DOM node)
                    // We'll try to convert to string as a fallback.
                    try {
                        const jsonVal = await arg.jsonValue();
                        logEntry.args.push(JSON.stringify(jsonVal));
                    } catch (jsonError) {
                        logEntry.args.push(String(arg)); // Fallback to string representation
                    }
                }
            } catch (e) {
                logEntry.args.push(`[Error serializing args: ${e.message}]`);
            }
            
            this.consoleMessages.push(logEntry);

            const formattedLog = `${logEntry.timestamp} [${logEntry.type.toUpperCase()}] ${logEntry.text}\n  Args: ${logEntry.args.join(', ')}\n  Location: ${logEntry.location}\n---\n`;
            
            try {
                await fs.appendFile(this.logFilePath, formattedLog);
            } catch (fileError) {
                // Log to actual console if file writing fails
                console.error('[ConsoleLogger] CRITICAL: Failed to append to log file:', fileError);
            }

            // Optionally, mirror important messages to the test runner's console
            if (type === 'error' || type === 'warn') {
                console.warn(`[BROWSER ${type.toUpperCase()}] ${text} (at ${logEntry.location})`);
            }
        };

        this.page.on('console', this._consoleHandler);
        this.isListening = true;
        Logger.info('[ConsoleLogger] Started listening to browser console events.');
    }

    stopListening() {
        if (this.isListening && this._consoleHandler) {
            this.page.off('console', this._consoleHandler);
            this.isListening = false;
            Logger.info('[ConsoleLogger] Stopped listening to browser console events.');
            this._consoleHandler = null;
        }
    }

    getMessages(filterType = null) {
        if (filterType) {
            return this.consoleMessages.filter(msg => msg.type === filterType);
        }
        return [...this.consoleMessages]; // Return a copy
    }

    getLogFilePath() {
        return this.logFilePath;
    }

    async writeSummary() {
        if (!this.logFilePath) return;
        const errorCount = this.getMessages('error').length;
        const warningCount = this.getMessages('warn').length;
        const summary = `\n--- CONSOLE LOG SUMMARY ---\nTotal Messages: ${this.consoleMessages.length}\nErrors: ${errorCount}\nWarnings: ${warningCount}\n--- END OF LOG ---\n`;
        try {
            await fs.appendFile(this.logFilePath, summary);
            Logger.info(`[ConsoleLogger] Log summary written to ${this.logFilePath}`);
        } catch (error) {
            console.error('[ConsoleLogger] CRITICAL: Failed to write log summary:', error);
        }
    }
}
