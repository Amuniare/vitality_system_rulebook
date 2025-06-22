
// modernApp/core/Component.js
import { Logger } from '../utils/Logger.js';
import { PropsManager } from './PropsManager.js'; // Import PropsManager
// import { EventBus } from './EventBus.js';
// import { StateManager } from './StateManager.js';
// import { RenderQueue } from './RenderQueue.js';

/**
 * Base class for all UI components in the ModernApp.
 * Provides standardized lifecycle methods, state handling, event listener management,
 * and integration with the rendering pipeline.
 */
export class Component {
    /**
     * Defines the expected props, their types, defaults, and requirements.
     * Subclasses should override this.
     * Example:
     * static propSchema = {
     *     title: { type: 'string', required: true, default: 'Default Title' },
     *     count: { type: 'number', default: 0 },
     *     items: { type: 'array', default: () => [] }
     * };
     */
    static propSchema = {};

    /**
     * @param {Object} [initialProps={}] - Initial properties for the component.
     * @param {HTMLElement} [container=null] - The DOM element to render the component into.
     */
    constructor(initialProps = {}, container = null) {
        // Process props using PropsManager against the component's static propSchema
        this.props = PropsManager.processProps(
            this.constructor.name,
            initialProps,
            this.constructor.propSchema // Access static property via constructor
        );
        
        this.state = {}; // Internal component state
        this.container = container; // The DOM element this component manages/renders into
        this._listeners = new Map(); // For tracking DOM event listeners
        this._subscriptions = []; // For tracking StateManager or EventBus subscriptions
        this.isMounted = false;

        Logger.debug(`[Component] Constructor for ${this.constructor.name} with processed props:`, this.props);
    }

    /**
     * Initializes the component. Called after the constructor.
     * Typically used for setting up initial state based on props,
     * loading initial data, or setting up non-DOM event listeners.
     * @async
     */
    async init() {
        Logger.debug(`[Component] init() for ${this.constructor.name}`);
        // Override in subclasses for specific initialization logic
    }

    /**
     * Renders the component's UI into its container.
     * This method should generate the HTML and attach necessary DOM event listeners.
     * It's typically called after init or when state/props change significantly.
     */
    render() {
        Logger.debug(`[Component] render() for ${this.constructor.name}`);
        if (!this.container) {
            Logger.warn(`[Component] No container for ${this.constructor.name} to render into.`);
            return;
        }
        // Subclasses must implement this to provide their UI.
    }

    /**
     * Updates the component's internal state and triggers a re-render.
     * @param {Object|Function} newStateOrFn - An object with new state values or a function that returns new state.
     */
    setState(newStateOrFn) {
        const oldState = { ...this.state };
        const newState = typeof newStateOrFn === 'function'
            ? newStateOrFn(oldState, this.props)
            : newStateOrFn;

        this.state = { ...oldState, ...newState };
        Logger.debug(`[Component] setState() for ${this.constructor.name}`, { oldState, newState: this.state });
        
        this._requestRender();
    }

    /**
     * Called when the component receives new props.
     * Processes the new props and re-renders if they have changed.
     * @param {Object} nextProps - The new properties being passed to the component.
     */
    update(nextProps) {
        Logger.debug(`[Component] update() for ${this.constructor.name} with incoming nextProps:`, nextProps);
        
        const oldProps = this.props;
        // Process incoming props (apply defaults, validate against schema)
        this.props = PropsManager.processProps(
            this.constructor.name,
            nextProps,
            this.constructor.propSchema
        );
        Logger.debug(`[Component] ${this.constructor.name} - Old props:`, oldProps, `New processed props:`, this.props);

        // Re-render only if props have shallowly changed
        if (!PropsManager.shallowCompare(oldProps, this.props)) {
            Logger.debug(`[Component] Props changed for ${this.constructor.name}, requesting render.`);
            this._requestRender();
        } else {
            Logger.debug(`[Component] Props did not change for ${this.constructor.name}, no render requested from update().`);
        }
        // Subclasses can override to perform specific actions on prop changes,
        // but should call super.update(nextProps) if they want this default behavior.
    }

    /**
     * Cleans up the component. Called before the component is removed or replaced.
     * Should remove all event listeners and subscriptions.
     */
    destroy() {
        Logger.debug(`[Component] destroy() for ${this.constructor.name}`);
        this._removeDOMEventListeners();
        this._unsubscribeAll();
        if (this.container) {
            this.container.innerHTML = ''; // Clear the container
        }
        this.isMounted = false;
    }

    /**
     * Marks the component as mounted. Typically called after the first render.
     */
    mount() {
        this.isMounted = true;
        Logger.debug(`[Component] ${this.constructor.name} mounted.`);
    }

    /**
     * Placeholder for requesting a render. In a full system, this would
     * interact with a RenderQueue.
     */
    _requestRender() {
        Logger.debug(`[Component] _requestRender() called for ${this.constructor.name}.`);
        if (this.isMounted && this.container) {
            this.render();
        } else {
            Logger.debug(`[Component] Render skipped for ${this.constructor.name}: not mounted or no container.`);
        }
    }

    // --- Event Listener Management ---
    _addEventListener(element, eventType, handler, options) {
        if (!element) {
            Logger.warn(`[Component] Attempted to add listener to null element in ${this.constructor.name} for event ${eventType}`);
            return;
        }
        const boundHandler = handler.bind(this);
        element.addEventListener(eventType, boundHandler, options);
        this._listeners.set({ element, eventType, originalHandler: handler }, boundHandler);
    }

    _removeDOMEventListeners() {
        this._listeners.forEach((boundHandler, key) => {
            key.element.removeEventListener(key.eventType, boundHandler);
        });
        this._listeners.clear();
        Logger.debug(`[Component] Removed DOM event listeners for ${this.constructor.name}`);
    }

    // --- Subscription Management (for StateManager, EventBus) ---
    _addSubscription(subscribeFn) {
        try {
            const unsubscribeFn = subscribeFn();
            if (typeof unsubscribeFn === 'function') {
                this._subscriptions.push(unsubscribeFn);
            } else {
                Logger.warn(`[Component] Subscription function in ${this.constructor.name} did not return an unsubscribe function.`);
            }
        } catch (error) {
            Logger.error(`[Component] Error during subscription in ${this.constructor.name}:`, error);
        }
    }

    _unsubscribeAll() {
        this._subscriptions.forEach(unsubscribe => unsubscribe());
        this._subscriptions = [];
        Logger.debug(`[Component] Unsubscribed all for ${this.constructor.name}`);
    }
}
