
// modernApp/utils/Logger.js

/**
 * A simple logger utility for consistent console output.
 * Provides log levels, performance timing, and formatted messages.
 */
export class Logger {
    static levels = {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
    };

    // Set the default log level. Can be changed dynamically.
    static currentLevel = 'debug';
    static timers = new Map();

    static _log(level, messages) {
        if (this.levels[level] > this.levels[this.currentLevel]) {
            return;
        }

        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        switch (level) {
            case 'error':
                console.error(prefix, ...messages);
                break;
            case 'warn':
                console.warn(prefix, ...messages);
                break;
            case 'info':
                console.info(prefix, ...messages);
                break;
            case 'debug':
                console.log(prefix, ...messages);
                break;
            default:
                console.log(prefix, ...messages);
        }
    }

    static info(...messages) {
        this._log('info', messages);
    }

    static warn(...messages) {
        this._log('warn', messages);
    }

    static error(...messages) {
        this._log('error', messages);
    }
    
    static debug(...messages) {
        this._log('debug', messages);
    }

    /**
     * Starts a performance timer.
     * @param {string} label - A unique label for the timer.
     */
    static time(label) {
        if (this.timers.has(label)) {
            this.warn(`Timer "${label}" already exists. Overwriting.`);
        }
        this.timers.set(label, performance.now());
    }

    /**
     * Ends a performance timer and logs the elapsed time.
     * @param {string} label - The label of the timer to end.
     */
    static timeEnd(label) {
        if (!this.timers.has(label)) {
            this.warn(`Timer "${label}" does not exist.`);
            return;
        }
        const startTime = this.timers.get(label);
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        this.info(`Timer "${label}": ${duration}ms`);
        this.timers.delete(label);
    }
}
