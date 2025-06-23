// modernApp/core/RenderQueue.js
import { Logger } from '../utils/Logger.js';

/**
 * Enhanced RenderQueue with comprehensive debugging and performance monitoring
 * Manages component rendering using requestAnimationFrame for optimal performance.
 */
export class RenderQueue {
    static _queue = new Set();
    static _isFrameRequested = false;
    static _processingCount = 0;
    static _totalRenderTime = 0;
    static _renderHistory = [];
    static _maxHistorySize = 100;

    /**
     * Schedules a component for rendering in the next animation frame.
     * @param {Component} componentInstance - The component instance to render.
     */
    static schedule(componentInstance) {
        if (!componentInstance) {
            Logger.error('[RenderQueue] Cannot schedule null component for render');
            return;
        }

        if (!componentInstance.constructor || !componentInstance.constructor.name) {
            Logger.error('[RenderQueue] Component missing constructor name:', componentInstance);
            return;
        }

        const componentName = componentInstance.constructor.name;
        const wasInQueue = this._queue.has(componentInstance);
        
        this._queue.add(componentInstance);
        
        if (wasInQueue) {
            Logger.debug(`[RenderQueue] Component ${componentName} already in queue, skipping duplicate`);
        } else {
            Logger.debug(`[RenderQueue] Scheduled ${componentName} for render. Queue size: ${this._queue.size}`);
        }

        if (!this._isFrameRequested) {
            this._isFrameRequested = true;
            Logger.debug('[RenderQueue] Requesting animation frame for processing queue');
            
            try {
                requestAnimationFrame(() => this._processQueue());
            } catch (error) {
                Logger.error('[RenderQueue] Error requesting animation frame:', error);
                // Fallback to setTimeout if requestAnimationFrame fails
                setTimeout(() => this._processQueue(), 16); // ~60fps
            }
        } else {
            Logger.debug('[RenderQueue] Animation frame already requested, queue will be processed');
        }
    }

    /**
     * Processes all components currently in the queue with enhanced debugging
     * @private
     */
    static _processQueue() {
        const startTime = performance.now();
        this._processingCount++;
        
        if (this._queue.size === 0) {
            this._isFrameRequested = false;
            Logger.debug('[RenderQueue] Process queue called, but queue is empty');
            return;
        }
        
        Logger.info(`[RenderQueue] Processing ${this._queue.size} components for render (batch #${this._processingCount})`);
        
        // Create a copy of the queue to iterate over
        const componentsToRender = new Set(this._queue);
        this._queue.clear();
        this._isFrameRequested = false;

        const renderResults = [];
        let successCount = 0;
        let errorCount = 0;

        componentsToRender.forEach(component => {
            const componentName = component.constructor.name;
            const componentStartTime = performance.now();
            
            try {
                Logger.debug(`[RenderQueue] Rendering ${componentName}...`);
                
                // Verify component is still valid
                if (!component.isMounted) {
                    Logger.warn(`[RenderQueue] Skipping render for unmounted component: ${componentName}`);
                    return;
                }
                
                if (!component.container) {
                    Logger.warn(`[RenderQueue] Skipping render for component without container: ${componentName}`);
                    return;
                }
                
                // Call the component's render method
                component.render();
                
                const componentDuration = performance.now() - componentStartTime;
                successCount++;
                
                renderResults.push({
                    componentName,
                    duration: componentDuration,
                    success: true,
                    timestamp: Date.now()
                });
                
                Logger.debug(`[RenderQueue] Successfully rendered ${componentName} in ${componentDuration.toFixed(2)}ms`);
                
            } catch (error) {
                const componentDuration = performance.now() - componentStartTime;
                errorCount++;
                
                renderResults.push({
                    componentName,
                    duration: componentDuration,
                    success: false,
                    error: error.message,
                    timestamp: Date.now()
                });
                
                Logger.error(`[RenderQueue] Error rendering component ${componentName}:`, error);
            }
        });

        const totalDuration = performance.now() - startTime;
        this._totalRenderTime += totalDuration;
        
        // Store render batch in history
        const batchInfo = {
            batchNumber: this._processingCount,
            componentCount: componentsToRender.size,
            successCount,
            errorCount,
            totalDuration,
            averageDuration: totalDuration / componentsToRender.size,
            results: renderResults,
            timestamp: Date.now()
        };
        
        this._renderHistory.push(batchInfo);
        
        // Limit history size
        if (this._renderHistory.length > this._maxHistorySize) {
            this._renderHistory.shift();
        }
        
        Logger.info(`[RenderQueue] Render batch #${this._processingCount} complete:`, {
            totalComponents: componentsToRender.size,
            successful: successCount,
            errors: errorCount,
            totalDuration: `${totalDuration.toFixed(2)}ms`,
            averageDuration: `${(totalDuration / componentsToRender.size).toFixed(2)}ms`
        });
        
        // If components were added during rendering, schedule another frame
        if (this._queue.size > 0) {
            Logger.debug(`[RenderQueue] ${this._queue.size} components added during rendering, scheduling another frame`);
            if (!this._isFrameRequested) {
                this._isFrameRequested = true;
                requestAnimationFrame(() => this._processQueue());
            }
        }
    }

    /**
     * Immediately cancels a scheduled render for a specific component.
     * @param {Component} componentInstance - The component instance to remove from the queue.
     */
    static cancel(componentInstance) {
        if (!componentInstance) {
            Logger.warn('[RenderQueue] Cannot cancel render for null component');
            return;
        }
        
        const componentName = componentInstance.constructor?.name || 'Unknown';
        
        if (this._queue.has(componentInstance)) {
            this._queue.delete(componentInstance);
            Logger.debug(`[RenderQueue] Cancelled render for ${componentName}. Queue size: ${this._queue.size}`);
        } else {
            Logger.debug(`[RenderQueue] Attempted to cancel render for ${componentName}, but it was not in queue`);
        }
    }

    /**
     * Clears the entire render queue.
     */
    static clearQueue() {
        const queueSize = this._queue.size;
        this._queue.clear();
        
        if (queueSize > 0) {
            Logger.info(`[RenderQueue] Render queue cleared - removed ${queueSize} components`);
        } else {
            Logger.debug('[RenderQueue] Render queue cleared - was already empty');
        }
    }

    /**
     * Forces immediate processing of the render queue (bypasses animation frame)
     * Should only be used for debugging or testing
     */
    static forceProcess() {
        Logger.warn('[RenderQueue] Force processing render queue (bypassing animation frame)');
        this._processQueue();
    }

    /**
     * Gets comprehensive statistics about the render queue
     */
    static getStats() {
        const recentBatches = this._renderHistory.slice(-10);
        const avgBatchDuration = recentBatches.length > 0 
            ? recentBatches.reduce((sum, batch) => sum + batch.totalDuration, 0) / recentBatches.length
            : 0;

        return {
            currentQueueSize: this._queue.size,
            isFrameRequested: this._isFrameRequested,
            totalBatches: this._processingCount,
            totalRenderTime: this._totalRenderTime,
            averageBatchDuration: avgBatchDuration,
            recentBatches: recentBatches.map(batch => ({
                batchNumber: batch.batchNumber,
                componentCount: batch.componentCount,
                duration: batch.totalDuration,
                successRate: batch.successCount / batch.componentCount
            }))
        };
    }

    /**
     * Gets detailed render history
     */
    static getRenderHistory() {
        return [...this._renderHistory];
    }

    /**
     * Gets components currently in the queue (for debugging)
     */
    static getQueueContents() {
        return Array.from(this._queue).map(component => ({
            name: component.constructor?.name || 'Unknown',
            isMounted: component.isMounted,
            hasContainer: !!component.container
        }));
    }

    /**
     * Resets all statistics (useful for testing)
     */
    static resetStats() {
        this._processingCount = 0;
        this._totalRenderTime = 0;
        this._renderHistory = [];
        Logger.info('[RenderQueue] Statistics reset');
    }
}