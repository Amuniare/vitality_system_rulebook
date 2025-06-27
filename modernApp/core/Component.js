// modernApp/core/Component.js
import { Logger } from '../utils/Logger.js';
import { PropsManager } from './PropsManager.js';
import { RenderQueue } from './RenderQueue.js';
import { EventBus } from './EventBus.js';

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

        // Validate required props early
        this.validateRequiredProps();
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

    /**
     * Validate required props based on the propSchema
     */
    validateRequiredProps() {
        if (!this.constructor.propSchema) {
            return; // No schema to validate against
        }

        const schema = this.constructor.propSchema;
        const componentName = this.constructor.name;
        let hasErrors = false;

        Logger.debug(`[Component][${componentName}] Validating required props for ${this.componentId}`);
        Logger.debug(`[Component][${componentName}] PropSchema:`, schema);
        Logger.debug(`[Component][${componentName}] Current props:`, this.props);

        Object.entries(schema).forEach(([propName, propConfig]) => {
            if (propConfig.required) {
                const propValue = this.props[propName];
                
                if (propValue === undefined || propValue === null) {
                    Logger.error(`[Component][${componentName}] MISSING REQUIRED PROP: "${propName}" for ${this.componentId}`);
                    hasErrors = true;
                } else {
                    Logger.debug(`[Component][${componentName}] Required prop "${propName}" is present:`, propValue);
                    
                    // Special validation for TabNavigation tabs array
                    if (componentName === 'TabNavigation' && propName === 'tabs') {
                        if (!Array.isArray(propValue) || propValue.length === 0) {
                            Logger.error(`[Component][${componentName}] INVALID TABS PROP: Expected non-empty array, got:`, propValue);
                            hasErrors = true;
                        } else {
                            Logger.debug(`[Component][${componentName}] Tabs prop validation passed: ${propValue.length} tabs`);
                        }
                    }
                }
            }
        });

        if (hasErrors) {
            Logger.error(`[Component][${componentName}] Props validation failed for ${this.componentId}`);
            // In development, we might want to throw an error
            // throw new Error(`Required props validation failed for ${componentName}`);
        } else {
            Logger.debug(`[Component][${componentName}] Props validation passed for ${this.componentId}`);
        }
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

        Logger.info(`[Component][${this.constructor.name}] STATE PROPAGATION VERIFICATION: Update called for ${this.componentId}:`, {
            nextProps,
            prevProps,
            componentName: this.constructor.name,
            timestamp: Date.now()
        });
        
        const oldProps = this.props;
        this.props = PropsManager.processProps(
            this.constructor.name,
            nextProps,
            this.constructor.propSchema
        );

        // Check if props actually changed
        if (!PropsManager.shallowCompare(oldProps, this.props)) {
            Logger.info(`[Component][${this.constructor.name}] STATE PROPAGATION VERIFICATION: Props changed for ${this.componentId}, requesting render`, {
                oldProps,
                newProps: this.props,
                componentName: this.constructor.name
            });
            
            // Call lifecycle method
            this.onPropsUpdate(this.props, oldProps);
            
            this._requestRender();
            Logger.info(`[Component][${this.constructor.name}] STATE PROPAGATION VERIFICATION: Render requested for ${this.componentId}`);
        } else {
            Logger.info(`[Component][${this.constructor.name}] STATE PROPAGATION VERIFICATION: Props did not change for ${this.componentId}, no render requested`, {
                props: this.props
            });
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
            
            // Clean up component event listeners
            if (this._componentEventListeners) {
                this._componentEventListeners.clear();
            }
            
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

    // --- Public API for Universal Components ---
    
    /**
     * Public method to add event listeners with automatic cleanup
     * @param {Element} element - DOM element to attach listener to
     * @param {string} eventType - Event type (e.g., 'click', 'change')
     * @param {Function} handler - Event handler function
     * @param {Object} options - Event listener options
     */
    addEventListener(element, eventType, handler, options) {
        this._addEventListener(element, eventType, handler, options);
    }

    /**
     * Subscribe to EventBus events with automatic cleanup
     * @param {string} eventName - Name of the EventBus event
     * @param {Function} handler - Event handler function
     */
    subscribe(eventName, handler) {
        this._addSubscription(() => {
            EventBus.on(eventName, handler);
            Logger.debug(`[Component][${this.constructor.name}] Subscribed to ${eventName} in ${this.componentId}`);
            return () => EventBus.off(eventName, handler);
        });
    }

    /**
     * Emit events through EventBus
     * @param {string} eventName - Name of the event to emit
     * @param {*} data - Data to send with the event
     */
    emit(eventName, data) {
        EventBus.emit(eventName, data);
        Logger.debug(`[Component][${this.constructor.name}] Emitted ${eventName} from ${this.componentId}:`, data);
    }

    /**
     * Update component props and trigger re-render if changed
     * @param {Object} newProps - New props to merge with existing props
     */
    updateProps(newProps) {
        if (this.isDestroyed) {
            Logger.warn(`[Component][${this.constructor.name}] Cannot updateProps on destroyed component ${this.componentId}`);
            return;
        }

        const oldProps = this.props;
        const updatedProps = PropsManager.processProps(
            this.constructor.name,
            { ...oldProps, ...newProps },
            this.constructor.propSchema
        );

        // Only update and re-render if props actually changed
        if (!PropsManager.shallowCompare(this.props, updatedProps)) {
            Logger.debug(`[Component][${this.constructor.name}] Props updated for ${this.componentId}:`, {
                oldProps,
                newProps: updatedProps
            });
            
            const prevProps = this.props;
            this.props = updatedProps;
            
            // Call lifecycle method directly (don't call update() to avoid circular dependency)
            this.onPropsUpdate(this.props, prevProps);
            
            // Request re-render
            this._requestRender();
        } else {
            Logger.debug(`[Component][${this.constructor.name}] updateProps called for ${this.componentId}, but props did not change`);
        }
    }

    /**
     * Allow external objects to listen to component events
     * This creates a simple event system for components
     * @param {string} eventName - Name of the event to listen to
     * @param {Function} handler - Event handler function
     */
    on(eventName, handler) {
        if (!this._componentEventListeners) {
            this._componentEventListeners = new Map();
        }
        
        if (!this._componentEventListeners.has(eventName)) {
            this._componentEventListeners.set(eventName, []);
        }
        
        this._componentEventListeners.get(eventName).push(handler);
        
        Logger.debug(`[Component][${this.constructor.name}] External listener added for ${eventName} on ${this.componentId}`);
        
        // Return unsubscribe function
        return () => {
            const handlers = this._componentEventListeners.get(eventName);
            if (handlers) {
                const index = handlers.indexOf(handler);
                if (index > -1) {
                    handlers.splice(index, 1);
                    Logger.debug(`[Component][${this.constructor.name}] External listener removed for ${eventName} on ${this.componentId}`);
                }
            }
        };
    }

    /**
     * Emit component-specific events to external listeners
     * @param {string} eventName - Name of the event to emit
     * @param {*} data - Data to send with the event
     */
    emitComponentEvent(eventName, data) {
        if (this._componentEventListeners && this._componentEventListeners.has(eventName)) {
            const handlers = this._componentEventListeners.get(eventName);
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    Logger.error(`[Component][${this.constructor.name}] Error in external event handler for ${eventName} on ${this.componentId}:`, error);
                }
            });
            
            Logger.debug(`[Component][${this.constructor.name}] Component event ${eventName} emitted from ${this.componentId} to ${handlers.length} listeners`);
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

    // --- Self-Contained Architecture Utilities ---
    
    /**
     * Create a child container element - promotes self-contained architecture
     * Components should create their own DOM structure rather than depending on external setup
     * @param {string} id - ID for the container
     * @param {string} className - CSS class(es) for the container
     * @param {HTMLElement} parent - Parent element (defaults to this.container)
     * @param {Object} options - Additional options
     * @returns {HTMLElement} The created container
     */
    createChildContainer(id, className = '', parent = null, options = {}) {
        const parentElement = parent || this.container;
        if (!parentElement) {
            Logger.error(`[Component][${this.constructor.name}] Cannot create child container - no parent for ${this.componentId}`);
            return null;
        }

        // Check if container already exists
        let container = document.getElementById(id);
        if (container) {
            Logger.debug(`[Component][${this.constructor.name}] Child container ${id} already exists`);
            return container;
        }

        // Create new container
        container = document.createElement(options.tagName || 'div');
        container.id = id;
        if (className) {
            container.className = className;
        }

        // Apply styles
        if (options.style) {
            Object.assign(container.style, options.style);
        }

        // Apply attributes
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                container.setAttribute(key, value);
            });
        }

        // Append to parent
        if (options.insertBefore) {
            parentElement.insertBefore(container, options.insertBefore);
        } else {
            parentElement.appendChild(container);
        }

        Logger.debug(`[Component][${this.constructor.name}] Created child container: ${id} in ${this.componentId}`);
        return container;
    }

    /**
     * Create multiple related containers at once
     * Useful for components that need multiple content areas (like tabs)
     * @param {Array} containerConfigs - Array of container configurations
     * @param {HTMLElement} parent - Parent element (defaults to this.container)
     * @returns {Map} Map of container ID to container element
     */
    createMultipleContainers(containerConfigs, parent = null) {
        const containers = new Map();
        const parentElement = parent || this.container;

        if (!parentElement) {
            Logger.error(`[Component][${this.constructor.name}] Cannot create containers - no parent for ${this.componentId}`);
            return containers;
        }

        containerConfigs.forEach(config => {
            const container = this.createChildContainer(
                config.id,
                config.className || '',
                parentElement,
                config.options || {}
            );
            if (container) {
                containers.set(config.id, container);
            }
        });

        Logger.info(`[Component][${this.constructor.name}] Created ${containers.size} containers for ${this.componentId}`);
        return containers;
    }

    /**
     * Ensure a container exists or create it - promotes resilient architecture
     * @param {string} id - Container ID
     * @param {Object} fallbackConfig - Configuration for creating if not found
     * @returns {HTMLElement} The found or created container
     */
    ensureContainer(id, fallbackConfig = {}) {
        let container = document.getElementById(id);
        
        if (!container) {
            Logger.debug(`[Component][${this.constructor.name}] Container ${id} not found, creating fallback`);
            container = this.createChildContainer(
                id,
                fallbackConfig.className || '',
                fallbackConfig.parent || this.container,
                fallbackConfig.options || {}
            );
        }

        return container;
    }
}