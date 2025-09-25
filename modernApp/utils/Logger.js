// modernApp/utils/Logger.js

/**
 * Enhanced Logger with comprehensive debugging capabilities
 * Provides different log levels and specialized debugging for StateConnector issues
 */
export class Logger {
    static LOG_LEVELS = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3,
        TRACE: 4
    };

    static currentLevel = this.LOG_LEVELS.DEBUG; // Default to DEBUG level
    static enabledCategories = new Set(['*']); // All categories enabled by default
    static logHistory = [];
    static maxHistorySize = 1000;
    static debugMode = false;

    // Performance monitoring
    static performanceTimers = new Map();
    static performanceHistory = [];

    /**
     * Set the logging level
     */
    static setLevel(level) {
        if (typeof level === 'string') {
            level = this.LOG_LEVELS[level.toUpperCase()];
        }
        
        if (level !== undefined) {
            this.currentLevel = level;
            console.log(`[Logger] Log level set to: ${this.getLevelName(level)}`);
        }
    }

    /**
     * Enable specific logging categories
     */
    static enableCategories(...categories) {
        this.enabledCategories.clear();
        categories.forEach(category => this.enabledCategories.add(category));
        console.log(`[Logger] Enabled categories:`, Array.from(this.enabledCategories));
    }

    /**
     * Enable debug mode with enhanced logging
     */
    static enableDebugMode() {
        this.debugMode = true;
        this.setLevel('TRACE');
        console.log(`[Logger] Debug mode enabled`);
    }

    /**
     * Disable debug mode
     */
    static disableDebugMode() {
        this.debugMode = false;
        this.setLevel('INFO');
        console.log(`[Logger] Debug mode disabled`);
    }

    static getLevelName(level) {
        return Object.keys(this.LOG_LEVELS).find(key => this.LOG_LEVELS[key] === level) || 'UNKNOWN';
    }

    static shouldLog(level, category = null) {
        // Check log level
        if (level > this.currentLevel) {
            return false;
        }

        // Check category filter
        if (category && this.enabledCategories.size > 0 && !this.enabledCategories.has('*')) {
            return this.enabledCategories.has(category);
        }

        return true;
    }

    static formatMessage(level, category, message, ...args) {
        const timestamp = new Date().toISOString();
        const levelName = this.getLevelName(level);
        const categoryStr = category ? `[${category}] ` : '';
        
        return {
            timestamp,
            level: levelName,
            category,
            message: `${timestamp} [${levelName}] ${categoryStr}${message}`,
            args
        };
    }

    static addToHistory(logEntry) {
        this.logHistory.push({
            ...logEntry,
            timestamp: Date.now()
        });

        // Limit history size
        if (this.logHistory.length > this.maxHistorySize) {
            this.logHistory.shift();
        }
    }

    static error(message, ...args) {
        if (!this.shouldLog(this.LOG_LEVELS.ERROR)) return;
        
        const formatted = this.formatMessage(this.LOG_LEVELS.ERROR, null, message, ...args);
        console.error(formatted.message, ...formatted.args);
        this.addToHistory(formatted);
    }

    static warn(message, ...args) {
        if (!this.shouldLog(this.LOG_LEVELS.WARN)) return;
        
        const formatted = this.formatMessage(this.LOG_LEVELS.WARN, null, message, ...args);
        console.warn(formatted.message, ...formatted.args);
        this.addToHistory(formatted);
    }

    static info(message, ...args) {
        if (!this.shouldLog(this.LOG_LEVELS.INFO)) return;
        
        const formatted = this.formatMessage(this.LOG_LEVELS.INFO, null, message, ...args);
        console.info(formatted.message, ...formatted.args);
        this.addToHistory(formatted);
    }

    static debug(message, ...args) {
        if (!this.shouldLog(this.LOG_LEVELS.DEBUG)) return;
        
        const formatted = this.formatMessage(this.LOG_LEVELS.DEBUG, null, message, ...args);
        console.log(formatted.message, ...formatted.args);
        this.addToHistory(formatted);
    }

    static trace(message, ...args) {
        if (!this.shouldLog(this.LOG_LEVELS.TRACE)) return;
        
        const formatted = this.formatMessage(this.LOG_LEVELS.TRACE, null, message, ...args);
        console.log(formatted.message, ...formatted.args);
        this.addToHistory(formatted);
    }

    // Specialized logging for different categories
    static stateConnector(message, ...args) {
        if (!this.shouldLog(this.LOG_LEVELS.DEBUG, 'StateConnector')) return;
        
        const formatted = this.formatMessage(this.LOG_LEVELS.DEBUG, 'StateConnector', message, ...args);
        console.log(`🔗 ${formatted.message}`, ...formatted.args);
        this.addToHistory(formatted);
    }

    static renderQueue(message, ...args) {
        if (!this.shouldLog(this.LOG_LEVELS.DEBUG, 'RenderQueue')) return;
        
        const formatted = this.formatMessage(this.LOG_LEVELS.DEBUG, 'RenderQueue', message, ...args);
        console.log(`🎨 ${formatted.message}`, ...formatted.args);
        this.addToHistory(formatted);
    }

    static stateManager(message, ...args) {
        if (!this.shouldLog(this.LOG_LEVELS.DEBUG, 'StateManager')) return;
        
        const formatted = this.formatMessage(this.LOG_LEVELS.DEBUG, 'StateManager', message, ...args);
        console.log(`🏪 ${formatted.message}`, ...formatted.args);
        this.addToHistory(formatted);
    }

    static eventBus(message, ...args) {
        if (!this.shouldLog(this.LOG_LEVELS.DEBUG, 'EventBus')) return;
        
        const formatted = this.formatMessage(this.LOG_LEVELS.DEBUG, 'EventBus', message, ...args);
        console.log(`📡 ${formatted.message}`, ...formatted.args);
        this.addToHistory(formatted);
    }

    // Performance monitoring
    static startTimer(label) {
        this.performanceTimers.set(label, {
            startTime: performance.now(),
            label
        });
        
        if (this.debugMode) {
            this.trace(`Timer started: ${label}`);
        }
    }

    static endTimer(label) {
        const timer = this.performanceTimers.get(label);
        if (!timer) {
            this.warn(`Timer not found: ${label}`);
            return null;
        }

        const duration = performance.now() - timer.startTime;
        this.performanceTimers.delete(label);

        const perfEntry = {
            label,
            duration,
            timestamp: Date.now()
        };

        this.performanceHistory.push(perfEntry);

        // Limit performance history
        if (this.performanceHistory.length > 100) {
            this.performanceHistory.shift();
        }

        if (this.debugMode) {
            this.debug(`Timer ${label}: ${duration.toFixed(2)}ms`);
        }

        return duration;
    }

    // Event flow tracing
    static traceEvent(eventName, phase, data = null) {
        if (!this.shouldLog(this.LOG_LEVELS.TRACE, 'EventTrace')) return;
        
        const traceMessage = `Event: ${eventName} | Phase: ${phase}`;
        const formatted = this.formatMessage(this.LOG_LEVELS.TRACE, 'EventTrace', traceMessage, data);
        console.log(`🚀 ${formatted.message}`, data || '');
        this.addToHistory(formatted);
    }

    // Stack trace logging
    static logStackTrace(message = 'Stack trace') {
        if (!this.shouldLog(this.LOG_LEVELS.DEBUG)) return;
        
        const stack = new Error().stack;
        console.log(`📍 ${message}:`);
        console.log(stack);
    }

    // Utility methods for debugging
    static getLogHistory(filter = {}) {
        let filtered = this.logHistory;

        if (filter.level) {
            filtered = filtered.filter(entry => entry.level === filter.level);
        }

        if (filter.category) {
            filtered = filtered.filter(entry => entry.category === filter.category);
        }

        if (filter.since) {
            filtered = filtered.filter(entry => entry.timestamp >= filter.since);
        }

        return filtered;
    }

    static getPerformanceStats() {
        if (this.performanceHistory.length === 0) {
            return { message: 'No performance data available' };
        }

        const durations = this.performanceHistory.map(entry => entry.duration);
        const total = durations.reduce((sum, d) => sum + d, 0);
        const average = total / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);

        return {
            totalEntries: this.performanceHistory.length,
            totalTime: total,
            averageTime: average,
            minTime: min,
            maxTime: max,
            recentEntries: this.performanceHistory.slice(-10)
        };
    }

    static clearHistory() {
        this.logHistory = [];
        this.performanceHistory = [];
        this.info('[Logger] History cleared');
    }

    // Debug utility to dump all logs to console
    static dumpLogs(filter = {}) {
        const logs = this.getLogHistory(filter);
        console.group('📋 Logger Dump');
        logs.forEach(entry => {
            console.log(`[${entry.level}] ${entry.message}`, ...(entry.args || []));
        });
        console.groupEnd();
    }

    // Export logs as JSON
    static exportLogs() {
        return {
            timestamp: Date.now(),
            logHistory: this.logHistory,
            performanceHistory: this.performanceHistory,
            currentLevel: this.currentLevel,
            enabledCategories: Array.from(this.enabledCategories),
            debugMode: this.debugMode
        };
    }
}

// Set up global debugging utilities
if (typeof window !== 'undefined') {
    window.LoggerDebug = {
        enableDebug: () => Logger.enableDebugMode(),
        disableDebug: () => Logger.disableDebugMode(),
        setLevel: (level) => Logger.setLevel(level),
        enableCategories: (...categories) => Logger.enableCategories(...categories),
        dumpLogs: (filter) => Logger.dumpLogs(filter),
        getStats: () => Logger.getPerformanceStats(),
        export: () => Logger.exportLogs(),
        clear: () => Logger.clearHistory()
    };
}