// modernApp/core/EventBus.js
import { Logger } from '../utils/Logger.js';

/**
 * Enhanced EventBus with comprehensive debugging and event tracking
 * Handles cross-component communication with detailed logging
 */
export class EventBus {
    static _listeners = new Map();
    static _eventHistory = [];
    static _maxHistorySize = 200;
    static _debugMode = false;
    static _eventCounts = new Map();
    static _performanceMetrics = new Map();

    /**
     * Enable debug mode for detailed event logging
     */
    static enableDebugMode() {
        this._debugMode = true;
        Logger.info('[EventBus] Debug mode enabled');
    }

    /**
     * Disable debug mode
     */
    static disableDebugMode() {
        this._debugMode = false;
        Logger.info('[EventBus] Debug mode disabled');
    }

    /**
     * Subscribe to an event with enhanced debugging
     */
    static on(eventName, callback, options = {}) {
        if (typeof eventName !== 'string' || typeof callback !== 'function') {
            Logger.error('[EventBus] Invalid parameters for event subscription:', { eventName, callback });
            throw new Error('EventBus.on requires a string event name and function callback');
        }

        if (!this._listeners.has(eventName)) {
            this._listeners.set(eventName, []);
            this._eventCounts.set(eventName, 0);
        }

        const listenerId = `${eventName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const listener = {
            id: listenerId,
            callback,
            options,
            subscribedAt: Date.now(),
            callCount: 0,
            lastCalled: null,
            totalExecutionTime: 0
        };

        this._listeners.get(eventName).push(listener);

        if (this._debugMode) {
            Logger.eventBus(`Subscribed to "${eventName}" with ID ${listenerId}`, options);
        }

        // Return unsubscribe function
        return () => this.off(eventName, listenerId);
    }

    /**
     * Unsubscribe from an event
     */
    static off(eventName, listenerId) {
        if (!this._listeners.has(eventName)) {
            Logger.warn(`[EventBus] Attempted to unsubscribe from non-existent event: ${eventName}`);
            return false;
        }

        const listeners = this._listeners.get(eventName);
        const initialLength = listeners.length;
        
        const updatedListeners = listeners.filter(listener => listener.id !== listenerId);
        this._listeners.set(eventName, updatedListeners);

        const wasRemoved = updatedListeners.length < initialLength;

        if (this._debugMode && wasRemoved) {
            Logger.eventBus(`Unsubscribed from "${eventName}" with ID ${listenerId}`);
        } else if (!wasRemoved) {
            Logger.warn(`[EventBus] Listener ID ${listenerId} not found for event ${eventName}`);
        }

        // Clean up empty event listeners
        if (updatedListeners.length === 0) {
            this._listeners.delete(eventName);
            this._eventCounts.delete(eventName);
        }

        return wasRemoved;
    }

    /**
     * Emit an event with enhanced debugging and performance monitoring
     */
    static emit(eventName, data = null) {
        if (typeof eventName !== 'string') {
            Logger.error('[EventBus] Invalid event name for emit:', eventName);
            return false;
        }

        const startTime = performance.now();
        
        // Log event emission
        if (this._debugMode) {
            Logger.eventBus(`Emitting "${eventName}"`, data);
            Logger.traceEvent(eventName, 'EMIT', data);
        }

        // Add to event history
        const eventEntry = {
            eventName,
            data,
            timestamp: Date.now(),
            listenerCount: this._listeners.has(eventName) ? this._listeners.get(eventName).length : 0
        };
        
        this._eventHistory.push(eventEntry);
        
        // Limit history size
        if (this._eventHistory.length > this._maxHistorySize) {
            this._eventHistory.shift();
        }

        // Update event count
        const currentCount = this._eventCounts.get(eventName) || 0;
        this._eventCounts.set(eventName, currentCount + 1);

        // Execute listeners
        if (!this._listeners.has(eventName)) {
            if (this._debugMode) {
                Logger.eventBus(`No listeners for "${eventName}"`);
            }
            return true;
        }

        const listeners = this._listeners.get(eventName);
        let successCount = 0;
        let errorCount = 0;

        listeners.forEach(listener => {
            try {
                const listenerStartTime = performance.now();
                
                listener.callback(data);
                
                const listenerDuration = performance.now() - listenerStartTime;
                listener.callCount++;
                listener.lastCalled = Date.now();
                listener.totalExecutionTime += listenerDuration;
                
                successCount++;

                if (this._debugMode) {
                    Logger.eventBus(`Listener ${listener.id} executed for "${eventName}" in ${listenerDuration.toFixed(2)}ms`);
                }

            } catch (error) {
                errorCount++;
                Logger.error(`[EventBus] Error in listener ${listener.id} for event "${eventName}":`, error);
                
                // Add error details to event history
                eventEntry.errors = eventEntry.errors || [];
                eventEntry.errors.push({
                    listenerId: listener.id,
                    error: error.message,
                    stack: error.stack
                });
            }
        });

        const totalDuration = performance.now() - startTime;
        
        // Store performance metrics
        if (!this._performanceMetrics.has(eventName)) {
            this._performanceMetrics.set(eventName, {
                totalEmissions: 0,
                totalTime: 0,
                averageTime: 0,
                minTime: Infinity,
                maxTime: 0
            });
        }

        const metrics = this._performanceMetrics.get(eventName);
        metrics.totalEmissions++;
        metrics.totalTime += totalDuration;
        metrics.averageTime = metrics.totalTime / metrics.totalEmissions;
        metrics.minTime = Math.min(metrics.minTime, totalDuration);
        metrics.maxTime = Math.max(metrics.maxTime, totalDuration);

        // Log completion
        if (this._debugMode) {
            Logger.eventBus(`Event "${eventName}" completed: ${successCount} success, ${errorCount} errors in ${totalDuration.toFixed(2)}ms`);
            Logger.traceEvent(eventName, 'COMPLETE', { successCount, errorCount, duration: totalDuration });
        }

        // Update event history with results
        eventEntry.successCount = successCount;
        eventEntry.errorCount = errorCount;
        eventEntry.duration = totalDuration;

        return errorCount === 0;
    }

    /**
     * Emit an event once, then remove all listeners
     */
    static once(eventName, callback, options = {}) {
        const unsubscribe = this.on(eventName, (data) => {
            callback(data);
            unsubscribe();
        }, { ...options, once: true });

        return unsubscribe;
    }

    /**
     * Remove all listeners for an event
     */
    static removeAllListeners(eventName = null) {
        if (eventName) {
            const listenerCount = this._listeners.has(eventName) ? this._listeners.get(eventName).length : 0;
            this._listeners.delete(eventName);
            this._eventCounts.delete(eventName);
            
            if (this._debugMode) {
                Logger.eventBus(`Removed ${listenerCount} listeners for "${eventName}"`);
            }
        } else {
            const totalListeners = Array.from(this._listeners.values()).reduce((sum, listeners) => sum + listeners.length, 0);
            this._listeners.clear();
            this._eventCounts.clear();
            
            if (this._debugMode) {
                Logger.eventBus(`Removed all ${totalListeners} listeners for all events`);
            }
        }
    }

    /**
     * Get detailed statistics about the event system
     */
    static getStats() {
        const eventNames = Array.from(this._listeners.keys());
        const totalListeners = Array.from(this._listeners.values()).reduce((sum, listeners) => sum + listeners.length, 0);
        
        const eventStats = eventNames.map(eventName => {
            const listeners = this._listeners.get(eventName);
            const emissionCount = this._eventCounts.get(eventName) || 0;
            const metrics = this._performanceMetrics.get(eventName);
            
            return {
                eventName,
                listenerCount: listeners.length,
                emissionCount,
                totalExecutionTime: listeners.reduce((sum, l) => sum + l.totalExecutionTime, 0),
                averageListenerCalls: listeners.length > 0 ? listeners.reduce((sum, l) => sum + l.callCount, 0) / listeners.length : 0,
                performanceMetrics: metrics
            };
        });

        return {
            totalEvents: eventNames.length,
            totalListeners,
            totalEmissions: Array.from(this._eventCounts.values()).reduce((sum, count) => sum + count, 0),
            eventStats,
            historySize: this._eventHistory.length,
            debugMode: this._debugMode
        };
    }

    /**
     * Get event history with optional filtering
     */
    static getEventHistory(filter = {}) {
        let filtered = [...this._eventHistory];

        if (filter.eventName) {
            filtered = filtered.filter(entry => entry.eventName === filter.eventName);
        }

        if (filter.since) {
            filtered = filtered.filter(entry => entry.timestamp >= filter.since);
        }

        if (filter.hasErrors) {
            filtered = filtered.filter(entry => entry.errorCount > 0);
        }

        return filtered.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Get listener information for debugging
     */
    static getListenerInfo(eventName = null) {
        if (eventName) {
            if (!this._listeners.has(eventName)) {
                return { eventName, listeners: [] };
            }

            const listeners = this._listeners.get(eventName);
            return {
                eventName,
                listeners: listeners.map(listener => ({
                    id: listener.id,
                    subscribedAt: listener.subscribedAt,
                    callCount: listener.callCount,
                    lastCalled: listener.lastCalled,
                    totalExecutionTime: listener.totalExecutionTime,
                    averageExecutionTime: listener.callCount > 0 ? listener.totalExecutionTime / listener.callCount : 0
                }))
            };
        } else {
            return Array.from(this._listeners.keys()).map(eventName => this.getListenerInfo(eventName));
        }
    }

    /**
     * Clear all history and reset metrics
     */
    static clearHistory() {
        this._eventHistory = [];
        this._performanceMetrics.clear();
        Logger.info('[EventBus] History and metrics cleared');
    }

    /**
     * Export debug information
     */
    static exportDebugInfo() {
        return {
            timestamp: Date.now(),
            stats: this.getStats(),
            eventHistory: this.getEventHistory(),
            listenerInfo: this.getListenerInfo(),
            performanceMetrics: Object.fromEntries(this._performanceMetrics)
        };
    }
}

// Global debugging utilities
if (typeof window !== 'undefined') {
    window.EventBusDebug = {
        enableDebug: () => EventBus.enableDebugMode(),
        disableDebug: () => EventBus.disableDebugMode(),
        getStats: () => EventBus.getStats(),
        getHistory: (filter) => EventBus.getEventHistory(filter),
        getListeners: (eventName) => EventBus.getListenerInfo(eventName),
        clearHistory: () => EventBus.clearHistory(),
        export: () => EventBus.exportDebugInfo()
    };
}