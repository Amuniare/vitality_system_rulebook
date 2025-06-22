
// modernApp/core/Component.js
import { Logger } from '../utils/Logger.js';
import { PropsManager } from './PropsManager.js';
import { RenderQueue } from './RenderQueue.js'; // Import RenderQueue
// import { EventBus } from './EventBus.js';
// import { StateManager } from './StateManager.js';

/**
 * Base class for all UI components in the ModernApp.
 * Provides standardized lifecycle methods, state handling, event listener management,
 * and integration with the rendering pipeline.
 */
export class Component {
    static propSchema = {};

    constructor(initialProps = {}, container = null) {
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

        Logger.debug(`[Component] Constructor for ${this.constructor.name} with processed props:`, this.props);
    }

    async init() {
        Logger.debug(`[Component] init() for ${this.constructor.name}`);
    }

    render() {
        Logger.debug(`[Component] render() for ${this.constructor.name}`);
        if (!this.container) {
            Logger.warn(`[Component] No container for ${this.constructor.name} to render into.`);
            return;
        }
    }

    setState(newStateOrFn) {
        const oldState = { ...this.state };
        const newState = typeof newStateOrFn === 'function'
            ? newStateOrFn(oldState, this.props)
            : newStateOrFn;

        // Only update and request render if state actually changed
        if (!PropsManager.shallowCompare(this.state, { ...oldState, ...newState })) {
            this.state = { ...oldState, ...newState };
            Logger.debug(`[Component] setState() for ${this.constructor.name}`, { oldState, newState: this.state });
            this._requestRender();
        } else {
            Logger.debug(`[Component] setState() called for ${this.constructor.name}, but state did not change.`, { oldState, newState });
        }
    }

    update(nextProps) {
        Logger.debug(`[Component] update() for ${this.constructor.name} with incoming nextProps:`, nextProps);
        
        const oldProps = this.props;
        this.props = PropsManager.processProps(
            this.constructor.name,
            nextProps,
            this.constructor.propSchema
        );
        Logger.debug(`[Component] ${this.constructor.name} - Old props:`, oldProps, `New processed props:`, this.props);

        if (!PropsManager.shallowCompare(oldProps, this.props)) {
            Logger.debug(`[Component] Props changed for ${this.constructor.name}, requesting render.`);
            this._requestRender();
        } else {
            Logger.debug(`[Component] Props did not change for ${this.constructor.name}, no render requested from update().`);
        }
    }

    destroy() {
        Logger.debug(`[Component] destroy() for ${this.constructor.name}`);
        RenderQueue.cancel(this); // Cancel any pending render for this component
        this._removeDOMEventListeners();
        this._unsubscribeAll();
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.isMounted = false;
    }

    mount(container) {
        if (container) {
            this.container = container;
        }
        if (!this.container) {
            Logger.error(`[Component] Cannot mount ${this.constructor.name}: no container provided or set.`);
            return;
        }
        this.isMounted = true;
        Logger.debug(`[Component] ${this.constructor.name} mounted into`, this.container);
        // Initial render upon mounting
        this._requestRender(); 
    }

    /**
     * Schedules the component for re-rendering via the RenderQueue.
     */
    _requestRender() {
        Logger.debug(`[Component] _requestRender() called for ${this.constructor.name}.`);
        if (this.isMounted && this.container) {
            RenderQueue.schedule(this); // Use RenderQueue
        } else {
            Logger.debug(`[Component] Render request for ${this.constructor.name} skipped: not mounted or no container.`);
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
        // Logger.debug(`[Component] Removed DOM event listeners for ${this.constructor.name}`); // Less noisy
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
        // Logger.debug(`[Component] Unsubscribed all for ${this.constructor.name}`); // Less noisy
    }
}
