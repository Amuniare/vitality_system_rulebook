
// modernApp/core/RenderQueue.js
import { Logger } from '../utils/Logger.js';

/**
 * RenderQueue - Manages and batches component render requests.
 * This helps to optimize rendering performance by:
 *  - Deduplicating render requests for the same component within a frame.
 *  - Batching all renders to occur together using requestAnimationFrame.
 */
export class RenderQueue {
    static _queue = new Set(); // Stores components scheduled for render. A Set naturally handles deduplication.
    static _isFrameRequested = false;

    /**
     * Schedules a component to be re-rendered in the next animation frame.
     * If the component is already scheduled, this call will be ignored.
     * @param {Component} componentInstance - The component instance that needs to be re-rendered.
     *                                        It must have a `render()` method.
     */
    static schedule(componentInstance) {
        if (!componentInstance || typeof componentInstance.render !== 'function') {
            Logger.warn('[RenderQueue] Attempted to schedule an invalid component or component without a render method:', componentInstance);
            return;
        }

        if (!this._queue.has(componentInstance)) {
            this._queue.add(componentInstance);
            Logger.debug(`[RenderQueue] Scheduled ${componentInstance.constructor.name} for render. Queue size: ${this._queue.size}`);
        }

        if (!this._isFrameRequested) {
            this._isFrameRequested = true;
            requestAnimationFrame(() => this._processQueue());
            Logger.debug('[RenderQueue] Animation frame requested for processing queue.');
        }
    }

    /**
     * Processes all components currently in the queue, calling their render method.
     * This is typically called by requestAnimationFrame.
     * @private
     */
    static _processQueue() {
        if (this._queue.size === 0) {
            this._isFrameRequested = false; // Reset flag if queue was empty
            Logger.debug('[RenderQueue] Process queue called, but queue is empty.');
            return;
        }
        
        Logger.info(`[RenderQueue] Processing ${this._queue.size} components for render.`);
        
        // Create a copy of the queue to iterate over, as components might re-schedule themselves during render
        const componentsToRender = new Set(this._queue);
        this._queue.clear(); // Clear the original queue immediately
        this._isFrameRequested = false; // Reset the flag

        componentsToRender.forEach(component => {
            try {
                Logger.debug(`[RenderQueue] Rendering ${component.constructor.name}...`);
                component.render(); // Call the component's render method
            } catch (error) {
                Logger.error(`[RenderQueue] Error rendering component ${component.constructor.name}:`, error);
                // Optionally, implement error handling for individual component render failures
            }
        });

        Logger.info('[RenderQueue] Render queue processing complete.');
    }

    /**
     * Immediately cancels a scheduled render for a specific component.
     * @param {Component} componentInstance - The component instance to remove from the queue.
     */
    static cancel(componentInstance) {
        if (this._queue.has(componentInstance)) {
            this._queue.delete(componentInstance);
            Logger.debug(`[RenderQueue] Cancelled render for ${componentInstance.constructor.name}. Queue size: ${this._queue.size}`);
        }
    }

    /**
     * Clears the entire render queue.
     */
    static clearQueue() {
        this._queue.clear();
        // If a frame was requested, it will still fire, but the queue will be empty.
        // To cancel the frame, one would need to use cancelAnimationFrame if its ID was stored.
        // For simplicity, we'll let the empty queue process.
        Logger.info('[RenderQueue] Render queue cleared.');
    }
}
