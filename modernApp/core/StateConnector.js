// modernApp/core/StateConnector.js
import { StateManager } from './StateManager.js';
import { PropsManager } from './PropsManager.js';
import { EventBus } from './EventBus.js';
import { Logger } from '../utils/Logger.js';

/**
 * Enhanced StateConnector with comprehensive debugging and memoization
 * Connects "dumb" UI components to the global StateManager with advanced features.
 */

class PropsMemoizer {
    constructor() {
        this.cache = new Map();
        this.hitCount = 0;
        this.missCount = 0;
    }

    memoize(mapStateToProps) {
        return (state, ownProps) => {
            const cacheKey = JSON.stringify({ state, ownProps });
            
            if (this.cache.has(cacheKey)) {
                this.hitCount++;
                Logger.debug('[PropsMemoizer] Cache hit');
                return this.cache.get(cacheKey);
            }
            
            this.missCount++;
            const result = mapStateToProps(state, ownProps);
            this.cache.set(cacheKey, result);
            Logger.debug('[PropsMemoizer] Cache miss, computed new props:', result);
            return result;
        };
    }

    clear() {
        this.cache.clear();
        this.hitCount = 0;
        this.missCount = 0;
        Logger.debug('[PropsMemoizer] Cache cleared');
    }

    getStats() {
        return {
            cacheSize: this.cache.size,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRate: this.hitCount / (this.hitCount + this.missCount) || 0
        };
    }
}

class SubscriptionManager {
    constructor() {
        this.subscriptions = new Map();
        this.eventCounts = new Map();
    }

    subscribe(componentId, callback) {
        const subscriptionId = `${componentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const subscription = {
            id: subscriptionId,
            componentId,
            callback,
            callCount: 0,
            lastCallTime: null,
            createdAt: Date.now()
        };

        // Enhanced EventBus subscription with debugging
        const unsubscribe = EventBus.on('CHARACTER_CHANGED', (data) => {
            const startTime = performance.now();
            Logger.debug(`[SubscriptionManager] CHARACTER_CHANGED event received by ${componentId}`, data);
            
            subscription.callCount++;
            subscription.lastCallTime = Date.now();
            
            try {
                callback(data);
                const duration = performance.now() - startTime;
                Logger.debug(`[SubscriptionManager] Callback completed for ${componentId} in ${duration.toFixed(2)}ms`);
            } catch (error) {
                Logger.error(`[SubscriptionManager] Error in callback for ${componentId}:`, error);
            }
        });

        subscription.unsubscribe = unsubscribe;
        this.subscriptions.set(subscriptionId, subscription);
        
        Logger.info(`[SubscriptionManager] Subscribed ${componentId} with ID ${subscriptionId}`);
        return subscriptionId;
    }

    unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(subscriptionId);
            Logger.info(`[SubscriptionManager] Unsubscribed ${subscription.componentId} (${subscriptionId})`);
        } else {
            Logger.warn(`[SubscriptionManager] Attempted to unsubscribe non-existent subscription: ${subscriptionId}`);
        }
    }

    notifyAll(data) {
        const startTime = performance.now();
        let notifiedCount = 0;
        
        this.subscriptions.forEach(subscription => {
            try {
                subscription.callback(data);
                subscription.callCount++;
                subscription.lastCallTime = Date.now();
                notifiedCount++;
            } catch (error) {
                Logger.error(`[SubscriptionManager] Error notifying ${subscription.componentId}:`, error);
            }
        });

        const duration = performance.now() - startTime;
        Logger.debug(`[SubscriptionManager] Notified ${notifiedCount} subscriptions in ${duration.toFixed(2)}ms`);
    }

    getSubscriptionCount() {
        return this.subscriptions.size;
    }

    getSubscriptionStats() {
        const stats = Array.from(this.subscriptions.values()).map(sub => ({
            id: sub.id,
            componentId: sub.componentId,
            callCount: sub.callCount,
            lastCallTime: sub.lastCallTime,
            createdAt: sub.createdAt
        }));
        return stats;
    }

    cleanup() {
        this.subscriptions.forEach(subscription => {
            subscription.unsubscribe();
        });
        this.subscriptions.clear();
        Logger.debug('[SubscriptionManager] All subscriptions cleaned up');
    }
}

// Global instances
const globalPropsMemoizer = new PropsMemoizer();
const globalSubscriptionManager = new SubscriptionManager();

/**
 * connectToState - Enhanced Higher-Order Component (HOC) factory with comprehensive debugging
 */
export function connectToState(mapStateToProps, options = {}) {
    if (typeof mapStateToProps !== 'function') {
        throw new Error('[StateConnector] mapStateToProps must be a function.');
    }

    const {
        memoize = false, // TEMPORARILY DISABLED FOR DEBUGGING
        shouldUpdate = null,
        displayName = null,
        debugMode = false
    } = options;

    // Apply memoization if enabled
    const optimizedMapStateToProps = memoize 
        ? globalPropsMemoizer.memoize(mapStateToProps)
        : mapStateToProps;

    return function wrapWithConnect(WrappedComponent) {
        if (!WrappedComponent || typeof WrappedComponent !== 'function') {
            throw new Error('[StateConnector] WrappedComponent must be a valid component class.');
        }

        class ConnectedComponent {
            constructor(container, initialOwnProps = {}) {
                this.container = container;
                this.ownProps = initialOwnProps;
                this.wrappedInstance = null;
                this.subscriptionId = null;
                this.lastMappedProps = null;
                this.componentId = `${WrappedComponent.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                this.updateCount = 0;
                this.lastUpdateTime = 0;
                this.debugMode = debugMode;

                Logger.info(`[ConnectedComponent][${WrappedComponent.name}] Constructor with ID ${this.componentId}`, {
                    container,
                    initialOwnProps,
                    debugMode: this.debugMode
                });
            }

            async init() {
                Logger.info(`[ConnectedComponent][${WrappedComponent.name}] Initializing...`);
                
                try {
                    // Get initial state and map to props
                    const currentState = StateManager.getState();
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Initial state:`, currentState);
                    
                    const initialMappedProps = optimizedMapStateToProps(currentState, this.ownProps);
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Initial mapped props:`, initialMappedProps);

                    // Create wrapped component instance
                    this.wrappedInstance = new WrappedComponent(this.container, {
                        ...this.ownProps,
                        ...initialMappedProps
                    });

                    // Store initial props for comparison
                    this.lastMappedProps = initialMappedProps;

                    // Initialize wrapped component
                    if (typeof this.wrappedInstance.init === 'function') {
                        await this.wrappedInstance.init();
                    }

                    // Subscribe to state changes
                    this.subscriptionId = globalSubscriptionManager.subscribe(
                        this.componentId,
                        this._handleStateChange.bind(this)
                    );

                    Logger.info(`[ConnectedComponent][${WrappedComponent.name}] Initialization complete`);
                } catch (error) {
                    Logger.error(`[ConnectedComponent][${WrappedComponent.name}] Initialization failed:`, error);
                    throw error;
                }
            }

            _handleStateChange(eventData) {
                const startTime = performance.now();
                Logger.info(`[ConnectedComponent][${WrappedComponent.name}] STATE CHANGE VERIFICATION: _handleStateChange called`, {
                    eventData,
                    componentId: this.componentId,
                    timestamp: Date.now()
                });

                try {
                    // Get current state
                    const currentState = StateManager.getState();
                    Logger.info(`[ConnectedComponent][${WrappedComponent.name}] STATE VERIFICATION: Current state retrieved:`, {
                        hasState: !!currentState,
                        stateName: currentState?.name,
                        stateId: currentState?.id,
                        updateCount: eventData?.updateCount
                    });

                    // Map state to props
                    const newMappedProps = optimizedMapStateToProps(currentState, this.ownProps);
                    Logger.info(`[ConnectedComponent][${WrappedComponent.name}] STATE VERIFICATION: New mapped props:`, {
                        newMappedProps,
                        hasNewProps: !!newMappedProps,
                        propsKeys: newMappedProps ? Object.keys(newMappedProps) : []
                    });

                    // Check if update is needed
                    const shouldComponentUpdate = this._shouldComponentUpdate(newMappedProps);
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Should update:`, shouldComponentUpdate);

                    if (shouldComponentUpdate) {
                        const oldProps = this.lastMappedProps;
                        this.lastMappedProps = newMappedProps;
                        this.updateCount++;
                        this.lastUpdateTime = Date.now();

                        Logger.info(`[ConnectedComponent][${WrappedComponent.name}] STATE VERIFICATION: Update #${this.updateCount} - Props changed:`, {
                            oldProps,
                            newProps: newMappedProps,
                            updateCount: this.updateCount,
                            eventUpdateCount: eventData?.updateCount
                        });

                        // Update the wrapped component
                        if (this.wrappedInstance && typeof this.wrappedInstance.update === 'function') {
                            Logger.info(`[ConnectedComponent][${WrappedComponent.name}] STATE VERIFICATION: Calling wrapped instance update method`);
                            this.wrappedInstance.update(newMappedProps, oldProps);
                            Logger.info(`[ConnectedComponent][${WrappedComponent.name}] STATE VERIFICATION: Wrapped instance update completed`);
                        } else {
                            Logger.info(`[ConnectedComponent][${WrappedComponent.name}] STATE VERIFICATION: Using fallback - updating props and rendering`);
                            // Fallback: recreate props and render
                            if (this.wrappedInstance) {
                                Object.assign(this.wrappedInstance.props || {}, newMappedProps);
                                if (typeof this.wrappedInstance.render === 'function') {
                                    this.wrappedInstance.render();
                                }
                                Logger.info(`[ConnectedComponent][${WrappedComponent.name}] STATE VERIFICATION: Fallback update completed`);
                            }
                        }
                        
                        const duration = performance.now() - startTime;
                        Logger.info(`[ConnectedComponent][${WrappedComponent.name}] STATE VERIFICATION: Update #${this.updateCount} completed in ${duration.toFixed(2)}ms`);
                    } else {
                        Logger.info(`[ConnectedComponent][${WrappedComponent.name}] STATE VERIFICATION: Props unchanged, skipping update`, {
                            lastProps: this.lastMappedProps,
                            newProps: newMappedProps
                        });
                    }
                } catch (error) {
                    Logger.error(`[ConnectedComponent][${WrappedComponent.name}] Error handling state change:`, error);
                }
            }

            // Enhanced change detection with debugging
            _shouldComponentUpdate(newMappedProps) {
                if (!this.lastMappedProps) {
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] First update, should update: true`);
                    return true;
                }

                // Use custom shouldUpdate function if provided
                if (shouldUpdate && typeof shouldUpdate === 'function') {
                    const customResult = shouldUpdate(this.lastMappedProps, newMappedProps);
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Custom shouldUpdate result:`, customResult);
                    return customResult;
                }

                // ENHANCED DEBUGGING - Check for reference equality issue
                const isExactSameReference = this.lastMappedProps === newMappedProps;
                Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Reference comparison:`, {
                    'lastMappedProps === newMappedProps': isExactSameReference,
                    'lastMappedProps reference': this.lastMappedProps,
                    'newMappedProps reference': newMappedProps,
                    'lastMappedProps values': this.lastMappedProps,
                    'newMappedProps values': newMappedProps
                });

                if (isExactSameReference) {
                    Logger.warn(`[ConnectedComponent][${WrappedComponent.name}] MEMOIZATION ISSUE: Same object reference returned for different states!`);
                }

                // Default shallow comparison
                const propsEqual = PropsManager.shallowCompare(this.lastMappedProps, newMappedProps);
                const shouldUpdateComponent = !propsEqual;
                
                Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Props comparison:`, {
                    lastProps: this.lastMappedProps,
                    newProps: newMappedProps,
                    propsEqual,
                    shouldUpdate: shouldUpdateComponent,
                    referenceEqual: isExactSameReference
                });
                
                return shouldUpdateComponent;
            }

            // Expose wrapped instance methods
            render() {
                if (this.wrappedInstance && typeof this.wrappedInstance.render === 'function') {
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Render called`);
                    return this.wrappedInstance.render();
                }
                Logger.warn(`[ConnectedComponent][${WrappedComponent.name}] Render called but no render method available`);
            }

            mount(container) {
                if (this.wrappedInstance && typeof this.wrappedInstance.mount === 'function') {
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Mount called`);
                    return this.wrappedInstance.mount(container);
                }
                Logger.warn(`[ConnectedComponent][${WrappedComponent.name}] Mount called but no mount method available`);
            }

            unmount() {
                if (this.wrappedInstance && typeof this.wrappedInstance.unmount === 'function') {
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Unmount called`);
                    return this.wrappedInstance.unmount();
                }
                Logger.warn(`[ConnectedComponent][${WrappedComponent.name}] Unmount called but no unmount method available`);
            }

            destroy() {
                Logger.info(`[ConnectedComponent][${WrappedComponent.name}] Destroying...`);
                
                // Unsubscribe from state changes
                if (this.subscriptionId) {
                    globalSubscriptionManager.unsubscribe(this.subscriptionId);
                    this.subscriptionId = null;
                }

                // Destroy wrapped instance
                if (this.wrappedInstance && typeof this.wrappedInstance.destroy === 'function') {
                    this.wrappedInstance.destroy();
                }

                this.wrappedInstance = null;
                this.lastMappedProps = null;
                
                Logger.info(`[ConnectedComponent][${WrappedComponent.name}] Destroyed`);
            }

            // Debugging utilities
            getDebugInfo() {
                return {
                    componentId: this.componentId,
                    updateCount: this.updateCount,
                    lastUpdateTime: this.lastUpdateTime,
                    lastMappedProps: this.lastMappedProps,
                    hasWrappedInstance: !!this.wrappedInstance,
                    subscriptionId: this.subscriptionId
                };
            }

            // Force update for debugging
            forceUpdate() {
                Logger.info(`[ConnectedComponent][${WrappedComponent.name}] Force update requested`);
                const currentState = StateManager.getState();
                const newMappedProps = optimizedMapStateToProps(currentState, this.ownProps);
                this._handleStateChange({ character: currentState });
            }
        }

        // Set display name for debugging
        ConnectedComponent.displayName = displayName || `Connected(${WrappedComponent.name})`;
        
        return ConnectedComponent;
    };
}

// Global utilities for debugging and management
export const StateConnectorUtils = {
    // Clear memoization cache
    clearCache: () => {
        globalPropsMemoizer.clear();
        Logger.info('[StateConnector] Memoization cache cleared');
    },
    
    // Get global connection statistics
    getGlobalStats: () => ({
        subscriptionCount: globalSubscriptionManager.getSubscriptionCount(),
        memoizerStats: globalPropsMemoizer.getStats(),
        subscriptionStats: globalSubscriptionManager.getSubscriptionStats()
    }),
    
    // Cleanup all connections (useful for testing)
    cleanup: () => {
        globalSubscriptionManager.cleanup();
        globalPropsMemoizer.clear();
        Logger.info('[StateConnector] Global cleanup completed');
    },
    
    // Create a custom shouldUpdate function for specific use cases
    createShouldUpdate: (keys) => {
        return (prevProps, nextProps) => {
            for (const key of keys) {
                if (prevProps[key] !== nextProps[key]) {
                    return true;
                }
            }
            return false;
        };
    },

    // Force update all connected components (debugging only)
    forceUpdateAll: () => {
        Logger.info('[StateConnector] Force updating all connected components');
        const currentState = StateManager.getState();
        globalSubscriptionManager.notifyAll({ character: currentState });
    }
};

// For compatibility with existing code
export { connectToState as default };