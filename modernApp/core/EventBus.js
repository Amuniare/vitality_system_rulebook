// modernApp/core/EventBus.js
import { Logger } from '../utils/Logger.js';

/**
 * Enhanced EventBus with component tracking and automatic cleanup
 */
export class EventBus {
    static listeners = new Map(); // Map<string, Map<string, Set<Function>>>
    static componentSubscriptions = new Map(); // Map<componentId, Set<{event, callback}>>
    
    /**
     * Subscribe with component tracking
     * @param {string} eventName 
     * @param {Function} callback 
     * @param {string} componentId - Optional component ID for automatic cleanup
     */
    static on(eventName, callback, componentId = null) {
        if (typeof eventName !== 'string' || !eventName.trim()) {
            Logger.warn('[EventBus] Attempted to subscribe to an invalid event name (empty or not a string).');
            return () => {}; // Return a no-op unsubscribe function
        }
        if (typeof callback !== 'function') {
            Logger.warn(`[EventBus] Attempted to subscribe to event "${eventName}" with a non-function callback.`);
            return () => {}; // Return a no-op unsubscribe function
        }

        // Track by component if ID provided
        if (componentId) {
            if (!this.componentSubscriptions.has(componentId)) {
                this.componentSubscriptions.set(componentId, new Set());
            }
            this.componentSubscriptions.get(componentId).add({ eventName, callback });
        }

        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName).add(callback);
        Logger.debug(`[EventBus] Listener added for event: "${eventName}". Total for event: ${this.listeners.get(eventName).size}`);
        
        // Return an unsubscribe function specific to this listener
        return () => EventBus.off(eventName, callback);
    }
    
    /**
     * Unregisters a callback for a specific event.
     * @param {string} eventName - The name of the event.
     * @param {Function} callback - The callback function to remove.
     */
    static off(eventName, callback) {
        if (typeof eventName !== 'string' || !eventName.trim()) {
            return;
        }
        if (typeof callback !== 'function') {
            return;
        }

        if (!this.listeners.has(eventName)) {
            return;
        }
        
        const eventListeners = this.listeners.get(eventName);
        if (eventListeners.has(callback)) {
            eventListeners.delete(callback);
            Logger.debug(`[EventBus] Listener removed for event: "${eventName}". Remaining for event: ${eventListeners.size}`);
            if (eventListeners.size === 0) {
                this.listeners.delete(eventName);
                Logger.debug(`[EventBus] All listeners removed for event: "${eventName}". Event key deleted.`);
            }
        }
    }

    /**
     * Unsubscribe all events for a component
     * @param {string} componentId 
     */
    static offByComponent(componentId) {
        const subscriptions = this.componentSubscriptions.get(componentId);
        if (subscriptions) {
            subscriptions.forEach(({ eventName, callback }) => {
                this.off(eventName, callback);
            });
            this.componentSubscriptions.delete(componentId);
        }
    }
    
    /**
     * Emit with payload validation and event merging
     * @param {string} eventName 
     * @param {*} data 
     * @param {Object} schema - Optional schema for validation
     */
    static emit(eventName, data, schema = null) {
        if (typeof eventName !== 'string' || !eventName.trim()) {
            Logger.warn('[EventBus] Attempted to emit an event with an invalid name.');
            return;
        }

        if (schema && !this.validatePayload(data, schema)) {
            Logger.error(`[EventBus] Invalid payload for event "${eventName}"`);
            return;
        }
        
        // Merge redundant events
        if (eventName === 'ENTITY_PURCHASED' || eventName === 'ENTITY_REMOVED') {
            // Also emit CHARACTER_CHANGED for backward compatibility
            this.emit('CHARACTER_CHANGED', data);
        }

        if (!this.listeners.has(eventName)) {
            return;
        }
        
        Logger.debug(`[EventBus] Emitting event: "${eventName}" with data:`, data !== undefined ? data : '<no data>');
        // Iterate over a copy of the set in case a callback modifies the original set
        const listenersToCall = new Set(this.listeners.get(eventName));
        
        listenersToCall.forEach(callback => {
            try {
                if (this.listeners.has(eventName) && this.listeners.get(eventName).has(callback)) {
                    callback(data);
                }
            } catch (error) {
                Logger.error(`[EventBus] Error in event listener for "${eventName}":`, error);
            }
        });
    }

    static validatePayload(data, schema) {
        // Simple validation implementation
        return true; // Implement as needed
    }
    
    /**
     * Clears all listeners for a specific event, or all listeners for all events.
     * @param {string} [eventName] - Optional. The name of the event to clear listeners for.
     */
    static clear(eventName) {
        if (eventName) {
            if (typeof eventName !== 'string' || !eventName.trim()) {
                Logger.warn('[EventBus] Attempted to clear listeners for an invalid event name.');
                return;
            }
            if (this.listeners.has(eventName)) {
                this.listeners.delete(eventName);
                Logger.debug(`[EventBus] All listeners cleared for event: "${eventName}".`);
            }
        } else {
            this.listeners.clear();
            this.componentSubscriptions.clear();
            Logger.debug('[EventBus] All listeners cleared for all events.');
        }
    }
}