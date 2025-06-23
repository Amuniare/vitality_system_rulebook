// modernApp/core/Component.js
import { Logger } from '../utils/Logger.js';
import { PropsManager } from './PropsManager.js';
import { RenderQueue } from './RenderQueue.js';

/**
 * Enhanced Component base class with comprehensive debugging and lifecycle management
 * Provides standardized lifecycle methods, state handling, and event listener management
 */
export class Component {
    static propSchema = {};

    constructor(initialProps = {}, container = null) {
        // Generate unique component ID for debugging
        this.componentId = `${this.constructor.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Process props through PropsManager
        this.props = PropsManager.processProps(
            this.constructor.name,
            initialProps,
            this.constructor.propSchema
        );
        
        this.state = {};
        this.container = container;
        this._listeners = new Map();
        this._subscriptions = [];
        this.isMounted = false;
        this.isDestroyed = false;
        
        // Performance tracking
        this.performanceMetrics = {
            renderCount: 0,
            totalRenderTime: 0,
            averageRenderTime: 0,
            lastRenderTime: 0,
            initTime: 0,
            createdAt: Date.now()
        };

        Logger.debug(`[Component][${this.constructor.name}] Constructor with ID ${this.componentId}:`, {
            props: this.props,
            container: !!container
        });
    }

    async init() {
        if (this.isDestroyed) {
            Logger.error(`[Component][${this.constructor.name}] Cannot init destroyed component ${this.componentId}`);
            return;
        }

        const startTime = performance.now();
        Logger.debug(`[Component][${this.constructor.name}] Initializing ${this.componentId}...`);
        
        try {
            // Subclasses should override this method
            await this.onInit();
            
            this.performanceMetrics.initTime = performance.now() - startTime;
            Logger.debug(`[Component][${this.constructor.name}] Initialization complete for ${this.componentId} in ${this.performanceMetrics.initTime.toFixed(2)}ms`);
            
        } catch (error) {
            Logger.error(`[Component][${this.constructor.name}] Initialization failed for ${this.componentId}:`, error);
            throw error;
        }
    }

    /**
     * Override this method in subclasses for custom initialization
     */
    async onInit() {
        // Default implementation - can be overridden
    }

    render() {
        if (this.isDestroyed) {
            Logger.warn(`[Component][${this.constructor.name}] Cannot render destroyed component ${this.componentId}`);
            return;
        }

        if (!this.container) {
            Logger.warn(`[Component][${this.constructor.name}] No container for ${this.componentId} to render into`);
            return;
        }

        const startTime = performance.now();
        Logger.debug(`[Component][${this.constructor.name}] Rendering ${this.componentId}...`);
        
        try {
            // Call the actual render implementation
            this.onRender();
            
            // Update performance metrics
            const renderTime = performance.now() - startTime;
            this.performanceMetrics.renderCount++;
            this.performanceMetrics.totalRenderTime += renderTime;
            this.performanceMetrics.averageRenderTime = this.performanceMetrics.totalRenderTime / this.performanceMetrics.renderCount;
            this.performanceMetrics.lastRenderTime = renderTime;
            
            Logger.debug(`[Component][${this.constructor.name}] Render complete for ${this.componentId} in ${renderTime.toFixed(2)}ms (render #${this.performanceMetrics.renderCount})`);
            
        } catch (error) {
            Logger.error(`[Component][${this.constructor.name}] Render error for ${this.componentId}:`, error);
            
            // Show error in container instead of failing silently
            if (this.container) {
                this.container.innerHTML = `
                    <div class="component-error">
                        <h4>Component Error: ${this.constructor.name}</h4>
                        <p>Error: ${error.message}</p>
                        <p><small>Component ID: ${this.componentId}</small></p>
                    </div>
                `;
            }
        }
    }

    /**
     * Override this method in subclasses for custom rendering
     */
    onRender() {
        Logger.debug(`[Component][${this.constructor.name}] Default render for ${this.componentId} - should be overridden`);
    }

    setState(newStateOrFn) {
        if (this.isDestroyed) {
            Logger.warn(`[Component][${this.constructor.name}] Cannot setState on destroyed component ${this.componentId}`);
            return;
        }

        const oldState = { ...this.state };
        const newState = typeof newStateOrFn === 'function'
            ? newStateOrFn(oldState, this.props)
            : newStateOrFn;

        // Only update and request render if state actually changed
        if (!PropsManager.shallowCompare(this.state, { ...oldState, ...newState })) {
            this.state = { ...oldState, ...newState };
            Logger.debug(`[Component][${this.constructor.name}] setState for ${this.componentId}:`, {
                oldState,
                newState: this.state
            });
            this._requestRender();
        } else {
            Logger.debug(`[Component][${this.constructor.name}] setState called for ${this.componentId}, but state did not change`);
        }
    }

    update(nextProps, prevProps) {
        if (this.isDestroyed) {
            Logger.warn(`[Component][${this.constructor.name}] Cannot update destroyed component ${this.componentId}`);
            return;
        }

        Logger.debug(`[Component][${this.constructor.name}] Update called for ${this.componentId}:`, {
            nextProps,
            prevProps
        });
        
        const oldProps = this.props;
        this.props = PropsManager.processProps(
            this.constructor.name,
            nextProps,
            this.constructor.propSchema
        );

        // Check if props actually changed
        if (!PropsManager.shallowCompare(oldProps, this.props)) {
            Logger.debug(`[Component][${this.constructor.name}] Props changed for ${this.componentId}, requesting render`);
            
            // Call lifecycle method
            this.onPropsUpdate(this.props, oldProps);
            
            this._requestRender();
        } else {
            Logger.debug(`[Component][${this.constructor.name}] Props did not change for ${this.componentId}, no render requested`);
        }
    }

    /**
     * Override this method in subclasses to handle prop updates
     */
    onPropsUpdate(nextProps, prevProps) {
        // Default implementation - can be overridden
    }

    destroy() {
        if (this.isDestroyed) {
            Logger.debug(`[Component][${this.constructor.name}] Component ${this.componentId} already destroyed`);
            return;
        }

        Logger.debug(`[Component][${this.constructor.name}] Destroying ${this.componentId}...`);
        
        try {
            // Cancel any pending renders
            RenderQueue.cancel(this);
            
            // Call lifecycle method
            this.onDestroy();
            
            // Clean up event listeners
            this._removeDOMEventListeners();
            
            // Clean up subscriptions
            this._unsubscribeAll();
            
            // Clear container
            if (this.container) {
                this.container.innerHTML = '';
            }
            
            // Mark as destroyed
            this.isMounted = false;
            this.isDestroyed = true;
            
            Logger.debug(`[Component][${this.constructor.name}] Destroyed ${this.componentId}`);
            
        } catch (error) {
            Logger.error(`[Component][${this.constructor.name}] Error during destroy for ${this.componentId}:`, error);
        }
    }

    /**
     * Override this method in subclasses for custom cleanup
     */
    onDestroy() {
        // Default implementation - can be overridden
    }

    mount(container) {
        if (this.isDestroyed) {
            Logger.error(`[Component][${this.constructor.name}] Cannot mount destroyed component ${this.componentId}`);
            return;
        }

        if (container) {
            this.container = container;
        }
        
        if (!this.container) {
            Logger.error(`[Component][${this.constructor.name}] Cannot mount ${this.componentId}: no container provided or set`);
            return;
        }
        
        this.isMounted = true;
        Logger.debug(`[Component][${this.constructor.name}] Mounted ${this.componentId} into container`);
        
        // Call lifecycle method
        this.onMount();
        
        // Initial render upon mounting
        this._requestRender();
    }

    /**
     * Override this method in subclasses to handle mounting
     */
    onMount() {
        // Default implementation - can be overridden
    }

    unmount() {
        if (this.isDestroyed) {
            Logger.debug(`[Component][${this.constructor.name}] Component ${this.componentId} already destroyed`);
            return;
        }

        Logger.debug(`[Component][${this.constructor.name}] Unmounting ${this.componentId}...`);
        
        // Call lifecycle method
        this.onUnmount();
        
        this.isMounted = false;
        
        // Cancel any pending renders
        RenderQueue.cancel(this);
    }

    /**
     * Override this method in subclasses to handle unmounting
     */
    onUnmount() {
        // Default implementation - can be overridden
    }

    /**
     * Schedules the component for re-rendering via the RenderQueue
     */
    _requestRender() {
        if (this.isDestroyed) {
            Logger.debug(`[Component][${this.constructor.name}] Render request ignored for destroyed component ${this.componentId}`);
            return;
        }

        Logger.debug(`[Component][${this.constructor.name}] Render requested for ${this.componentId}`);
        
        if (this.isMounted && this.container) {
            RenderQueue.schedule(this);
        } else {
            Logger.debug(`[Component][${this.constructor.name}] Render request for ${this.componentId} skipped: not mounted or no container`);
        }
    }

    /**
     * Force immediate render (bypasses render queue)
     */
    forceRender() {
        if (this.isDestroyed) {
            Logger.warn(`[Component][${this.constructor.name}] Cannot force render destroyed component ${this.componentId}`);
            return;
        }

        Logger.debug(`[Component][${this.constructor.name}] Force render for ${this.componentId}`);
        this.render();
    }

    // --- Event Listener Management ---
    _addEventListener(element, eventType, handler, options) {
        if (!element) {
            Logger.warn(`[Component][${this.constructor.name}] Attempted to add listener to null element in ${this.componentId} for event ${eventType}`);
            return;
        }
        
        const boundHandler = handler.bind(this);
        element.addEventListener(eventType, boundHandler, options);
        
        const listenerKey = { element, eventType, originalHandler: handler };
        this._listeners.set(listenerKey, boundHandler);
        
        Logger.debug(`[Component][${this.constructor.name}] Added ${eventType} listener for ${this.componentId}`);
    }

    _removeDOMEventListeners() {
        let removedCount = 0;
        
        this._listeners.forEach((boundHandler, key) => {
            try {
                key.element.removeEventListener(key.eventType, boundHandler);
                removedCount++;
            } catch (error) {
                Logger.warn(`[Component][${this.constructor.name}] Error removing event listener for ${this.componentId}:`, error);
            }
        });
        
        this._listeners.clear();
        
        if (removedCount > 0) {
            Logger.debug(`[Component][${this.constructor.name}] Removed ${removedCount} event listeners for ${this.componentId}`);
        }
    }

    // --- Subscription Management (for StateManager, EventBus) ---
    _addSubscription(subscribeFn) {
        try {
            const unsubscribeFn = subscribeFn();
            if (typeof unsubscribeFn === 'function') {
                this._subscriptions.push(unsubscribeFn);
                Logger.debug(`[Component][${this.constructor.name}] Added subscription for ${this.componentId}`);
            } else {
                Logger.warn(`[Component][${this.constructor.name}] Subscription function in ${this.componentId} did not return an unsubscribe function`);
            }
        } catch (error) {
            Logger.error(`[Component][${this.constructor.name}] Error during subscription in ${this.componentId}:`, error);
        }
    }

    _unsubscribeAll() {
        let unsubscribedCount = 0;
        
        this._subscriptions.forEach(unsubscribe => {
            try {
                unsubscribe();
                unsubscribedCount++;
            } catch (error) {
                Logger.warn(`[Component][${this.constructor.name}] Error during unsubscribe for ${this.componentId}:`, error);
            }
        });
        
        this._subscriptions = [];
        
        if (unsubscribedCount > 0) {
            Logger.debug(`[Component][${this.constructor.name}] Unsubscribed ${unsubscribedCount} subscriptions for ${this.componentId}`);
        }
    }

    // --- Debugging and Utilities ---
    getDebugInfo() {
        return {
            componentId: this.componentId,
            componentName: this.constructor.name,
            isMounted: this.isMounted,
            isDestroyed: this.isDestroyed,
            hasContainer: !!this.container,
            propsCount: Object.keys(this.props).length,
            stateCount: Object.keys(this.state).length,
            listenersCount: this._listeners.size,
            subscriptionsCount: this._subscriptions.length,
            performanceMetrics: this.performanceMetrics
        };
    }

    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    // Utility method to find child elements safely
    findElement(selector) {
        if (!this.container) {
            Logger.warn(`[Component][${this.constructor.name}] Cannot find element - no container for ${this.componentId}`);
            return null;
        }
        
        try {
            return this.container.querySelector(selector);
        } catch (error) {
            Logger.error(`[Component][${this.constructor.name}] Error finding element "${selector}" in ${this.componentId}:`, error);
            return null;
        }
    }

    // Utility method to find multiple child elements safely
    findElements(selector) {
        if (!this.container) {
            Logger.warn(`[Component][${this.constructor.name}] Cannot find elements - no container for ${this.componentId}`);
            return [];
        }
        
        try {
            return Array.from(this.container.querySelectorAll(selector));
        } catch (error) {
            Logger.error(`[Component][${this.constructor.name}] Error finding elements "${selector}" in ${this.componentId}:`, error);
            return [];
        }
    }
}