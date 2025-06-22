// modernApp/core/StateConnector.js
import { StateManager } from './StateManager.js';
import { PropsManager } from './PropsManager.js';
import { Logger } from '../utils/Logger.js';

/**
 * Enhanced StateConnector with memoization, subscription management, and prop optimization
 * Connects "dumb" UI components to the global StateManager with advanced features.
 */

// Memoization utilities
class PropsMemoizer {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 100; // Prevent memory leaks
    }

    getCacheKey(state, ownProps) {
        // Create a stable cache key from state and props
        try {
            return JSON.stringify({ state, ownProps });
        } catch (error) {
            // Fallback for circular references
            return `${Date.now()}_${Math.random()}`;
        }
    }

    memoize(mapStateToProps) {
        return (state, ownProps) => {
            const cacheKey = this.getCacheKey(state, ownProps);
            
            if (this.cache.has(cacheKey)) {
                Logger.debug('[PropsMemoizer] Cache hit for state mapping');
                return this.cache.get(cacheKey);
            }

            const result = mapStateToProps(state, ownProps);
            
            // Manage cache size
            if (this.cache.size >= this.maxCacheSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            this.cache.set(cacheKey, result);
            Logger.debug('[PropsMemoizer] Cached new state mapping result');
            return result;
        };
    }

    clear() {
        this.cache.clear();
        Logger.debug('[PropsMemoizer] Cache cleared');
    }

    getStats() {
        return {
            cacheSize: this.cache.size,
            maxCacheSize: this.maxCacheSize
        };
    }
}

// Subscription manager for efficient state updates
class SubscriptionManager {
    constructor() {
        this.subscriptions = new Map();
        this.subscriptionId = 0;
    }

    subscribe(callback, componentId) {
        const id = ++this.subscriptionId;
        const subscription = {
            id,
            callback,
            componentId,
            lastCallTime: 0,
            callCount: 0
        };

        this.subscriptions.set(id, subscription);
        Logger.debug(`[SubscriptionManager] Added subscription ${id} for component ${componentId}`);
        
        return () => this.unsubscribe(id);
    }

    unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription) {
            this.subscriptions.delete(subscriptionId);
            Logger.debug(`[SubscriptionManager] Removed subscription ${subscriptionId} for component ${subscription.componentId}`);
        }
    }

    notify(state) {
        const startTime = performance.now();
        let notifiedCount = 0;

        for (const [id, subscription] of this.subscriptions) {
            try {
                subscription.lastCallTime = Date.now();
                subscription.callCount++;
                subscription.callback(state);
                notifiedCount++;
            } catch (error) {
                Logger.error(`[SubscriptionManager] Error in subscription ${id}:`, error);
            }
        }

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
            lastCallTime: sub.lastCallTime
        }));
        return stats;
    }

    cleanup() {
        this.subscriptions.clear();
        Logger.debug('[SubscriptionManager] All subscriptions cleared');
    }
}

// Global instances
const globalPropsMemoizer = new PropsMemoizer();
const globalSubscriptionManager = new SubscriptionManager();

/**
 * connectToState - Enhanced Higher-Order Component (HOC) factory
 * @param {Function} mapStateToProps - Function to map state to props
 * @param {Object} options - Configuration options
 * @param {boolean} options.memoize - Whether to memoize props (default: true)
 * @param {Function} options.shouldUpdate - Custom comparison function for updates
 * @param {string} options.displayName - Custom display name for debugging
 * @returns {Function} Enhanced connected component factory
 */
export function connectToState(mapStateToProps, options = {}) {
    if (typeof mapStateToProps !== 'function') {
        throw new Error('[StateConnector] mapStateToProps must be a function.');
    }

    const {
        memoize = true,
        shouldUpdate = null,
        displayName = null
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
                this.unsubscribeFromStateManager = null;
                this.lastMappedProps = null;
                this.componentId = `${WrappedComponent.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                this.updateCount = 0;
                this.lastUpdateTime = 0;

                Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Constructor. Component ID: ${this.componentId}`);
                this._initialize();
            }

            _initialize() {
                try {
                    // Get initial state and map to props
                    const initialState = StateManager.getState();
                    this.lastMappedProps = optimizedMapStateToProps(initialState, this.ownProps);
                    
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Initial mappedProps:`, this.lastMappedProps);

                    // Create the instance of the wrapped component
                    this.wrappedInstance = new WrappedComponent(this.container, this.lastMappedProps);

                    // Subscribe to StateManager changes with enhanced subscription management
                    this.unsubscribeFromStateManager = globalSubscriptionManager.subscribe(
                        this._handleStateChange.bind(this),
                        this.componentId
                    );

                    // Also subscribe to StateManager directly for compatibility
                    this.stateManagerUnsubscribe = StateManager.subscribe(this._handleStateChange.bind(this));

                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Initialized with subscription management`);
                } catch (error) {
                    Logger.error(`[ConnectedComponent][${WrappedComponent.name}] Initialization error:`, error);
                    throw error;
                }
            }

            async init() {
                if (this.wrappedInstance && typeof this.wrappedInstance.init === 'function') {
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Calling wrapped init.`);
                    await this.wrappedInstance.init();
                }
            }
            
            mount() {
                if (this.wrappedInstance && typeof this.wrappedInstance.mount === 'function') {
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Calling wrapped mount.`);
                    this.wrappedInstance.mount(this.container);
                } else {
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Wrapped component has no mount method.`);
                }
            }

            render() {
                if (this.wrappedInstance && typeof this.wrappedInstance.render === 'function') {
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Calling wrapped render.`);
                    this.wrappedInstance.render();
                } else {
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Wrapped component has no render method.`);
                }
            }

            // Enhanced state change handling with proper change detection
            _handleStateChange(newState) {
                if (!newState) {
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] State change with null state, skipping update.`);
                    return;
                }

                try {
                    const newMappedProps = optimizedMapStateToProps(newState, this.ownProps);
                    
                    // Implement proper change detection
                    if (this._shouldComponentUpdate(newMappedProps)) {
                        Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Props changed, updating component.`);
                        
                        const oldProps = this.lastMappedProps;
                        this.lastMappedProps = newMappedProps;
                        this.updateCount++;
                        this.lastUpdateTime = Date.now();

                        // Update the wrapped component
                        if (this.wrappedInstance && typeof this.wrappedInstance.update === 'function') {
                            this.wrappedInstance.update(newMappedProps, oldProps);
                        } else {
                            // Fallback: recreate props and render
                            if (this.wrappedInstance) {
                                Object.assign(this.wrappedInstance.props || {}, newMappedProps);
                                if (typeof this.wrappedInstance.render === 'function') {
                                    this.wrappedInstance.render();
                                }
                            }
                        }
                        
                        Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Update #${this.updateCount} completed.`);
                    } else {
                        Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Props unchanged, skipping update.`);
                    }
                } catch (error) {
                    Logger.error(`[ConnectedComponent][${WrappedComponent.name}] Error handling state change:`, error);
                }
            }

            // Enhanced change detection with custom shouldUpdate function
            _shouldComponentUpdate(newMappedProps) {
                if (!this.lastMappedProps) {
                    return true; // First update
                }

                // Use custom shouldUpdate function if provided
                if (shouldUpdate && typeof shouldUpdate === 'function') {
                    return shouldUpdate(this.lastMappedProps, newMappedProps, this.ownProps);
                }

                // Default shallow comparison
                return !this._shallowEqual(this.lastMappedProps, newMappedProps);
            }

            // Efficient shallow comparison for props
            _shallowEqual(obj1, obj2) {
                if (obj1 === obj2) return true;
                
                if (!obj1 || !obj2) return false;
                
                const keys1 = Object.keys(obj1);
                const keys2 = Object.keys(obj2);
                
                if (keys1.length !== keys2.length) return false;
                
                for (let key of keys1) {
                    if (obj1[key] !== obj2[key]) return false;
                }
                
                return true;
            }

            // Update own props (useful for parent-child communication)
            updateOwnProps(newOwnProps) {
                if (!this._shallowEqual(this.ownProps, newOwnProps)) {
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Own props updated, re-mapping state.`);
                    this.ownProps = newOwnProps;
                    
                    // Re-map state with new own props
                    const currentState = StateManager.getState();
                    if (currentState) {
                        this._handleStateChange(currentState);
                    }
                }
            }

            // Get component statistics for debugging
            getStats() {
                return {
                    componentId: this.componentId,
                    componentName: WrappedComponent.name,
                    updateCount: this.updateCount,
                    lastUpdateTime: this.lastUpdateTime,
                    hasWrappedInstance: !!this.wrappedInstance,
                    subscriptionStats: globalSubscriptionManager.getSubscriptionStats().find(s => s.componentId === this.componentId)
                };
            }

            destroy() {
                Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Destroying component ${this.componentId}...`);
                
                try {
                    // Unsubscribe from enhanced subscription manager
                    if (this.unsubscribeFromStateManager) {
                        this.unsubscribeFromStateManager();
                        this.unsubscribeFromStateManager = null;
                    }

                    // Unsubscribe from StateManager directly
                    if (this.stateManagerUnsubscribe) {
                        this.stateManagerUnsubscribe();
                        this.stateManagerUnsubscribe = null;
                    }

                    // Destroy wrapped instance
                    if (this.wrappedInstance && typeof this.wrappedInstance.destroy === 'function') {
                        this.wrappedInstance.destroy();
                    }
                    
                    this.wrappedInstance = null;
                    this.container = null;
                    this.lastMappedProps = null;
                    this.ownProps = null;
                    
                    Logger.debug(`[ConnectedComponent][${WrappedComponent.name}] Component ${this.componentId} destroyed successfully.`);
                } catch (error) {
                    Logger.error(`[ConnectedComponent][${WrappedComponent.name}] Error during destruction:`, error);
                }
            }
        }
        
        // Copy static properties and enhance with debugging info
        Object.keys(WrappedComponent).forEach(key => {
            if (Object.prototype.hasOwnProperty.call(WrappedComponent, key)) {
                ConnectedComponent[key] = WrappedComponent[key];
            }
        });
        
        // Enhanced display name for better debugging
        const componentDisplayName = displayName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
        ConnectedComponent.displayName = `Connected(${componentDisplayName})`;
        
        // Add debugging helpers
        ConnectedComponent.getGlobalStats = () => ({
            subscriptionCount: globalSubscriptionManager.getSubscriptionCount(),
            memoizerStats: globalPropsMemoizer.getStats(),
            subscriptionStats: globalSubscriptionManager.getSubscriptionStats()
        });
        
        return ConnectedComponent;
    };
}

// Export utilities for advanced usage
export const StateConnectorUtils = {
    // Clear all memoization caches
    clearMemoizationCache: () => {
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
    }
};

// For compatibility with existing code
export { connectToState as default };