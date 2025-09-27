// UpdateManager.js - Manages component update lifecycle and batching
export class UpdateManager {
    constructor() {
        this.updateQueue = new Map();
        this.isProcessing = false;
        this.dirtyComponents = new Set();
        this.updateCallbacks = new Map();
        this.batchTimeout = null;
    }
    
    // Mark component as needing update
    static markDirty(component, reason = 'unknown') {
        if (!this.instance) {
            this.instance = new UpdateManager();
        }
        
        console.log(`🟡 Marking ${component.constructor.name} dirty: ${reason}`);
        this.instance.dirtyComponents.add(component);
        this.instance.scheduleUpdate();
    }
    
    // Schedule batched update
    static scheduleUpdate(component, method = 'render', priority = 'normal') {
        if (!this.instance) {
            this.instance = new UpdateManager();
        }
        
        const key = `${component.constructor.name}.${method}`;
        this.instance.updateQueue.set(key, {
            component,
            method,
            priority,
            timestamp: Date.now()
        });
        
        this.instance.scheduleProcessing();
    }
    
    // Batch multiple updates together
    static batchUpdates(updates) {
        if (!this.instance) {
            this.instance = new UpdateManager();
        }
        
        console.log(`🟡 Batching ${updates.length} updates`);
        
        updates.forEach(update => {
            const { component, method = 'render', priority = 'normal' } = update;
            this.scheduleUpdate(component, method, priority);
        });
    }
    
    // Process update queue
    scheduleProcessing() {
        if (this.isProcessing) return;
        
        // Debounce updates to avoid rapid-fire changes
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        
        this.batchTimeout = setTimeout(() => {
            this.processUpdateQueue();
        }, 16); // ~60fps
    }
    
    // Process all queued updates
    async processUpdateQueue() {
        if (this.isProcessing || this.updateQueue.size === 0) return;
        
        this.isProcessing = true;
        console.log(`🟡 Processing ${this.updateQueue.size} queued updates`);
        
        try {
            // Sort by priority
            const updates = Array.from(this.updateQueue.values()).sort((a, b) => {
                const priorities = { high: 3, normal: 2, low: 1 };
                return priorities[b.priority] - priorities[a.priority];
            });
            
            // Process updates
            for (const update of updates) {
                try {
                    await this.executeUpdate(update);
                } catch (error) {
                    console.error(`❌ Update failed for ${update.component.constructor.name}:`, error);
                }
            }
            
            // Clear processed updates
            this.updateQueue.clear();
            this.dirtyComponents.clear();
            
            console.log(`✅ Update queue processed`);
            
        } finally {
            this.isProcessing = false;
        }
    }
    
    // Execute individual update
    async executeUpdate(update) {
        const { component, method } = update;
        
        if (typeof component[method] === 'function') {
            console.log(`🔄 Updating ${component.constructor.name}.${method}()`);
            await component[method]();
        } else {
            console.warn(`⚠️ Method ${method} not found on ${component.constructor.name}`);
        }
    }
    
    // Register update callback
    static onUpdate(component, callback) {
        if (!this.instance) {
            this.instance = new UpdateManager();
        }
        
        const key = component.constructor.name;
        if (!this.instance.updateCallbacks.has(key)) {
            this.instance.updateCallbacks.set(key, []);
        }
        
        this.instance.updateCallbacks.get(key).push(callback);
    }
    
    // Clear all queued updates for component
    static clearUpdates(component) {
        if (!this.instance) return;
        
        const componentName = component.constructor.name;
        const keysToRemove = [];
        
        for (const [key, update] of this.instance.updateQueue) {
            if (update.component === component) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => this.instance.updateQueue.delete(key));
        this.instance.dirtyComponents.delete(component);
        
        console.log(`🗑️ Cleared updates for ${componentName}`);
    }
    
    // Check if component needs update
    static isDirty(component) {
        if (!this.instance) return false;
        return this.instance.dirtyComponents.has(component);
    }
    
    // Force immediate update (bypass batching)
    static forceUpdate(component, method = 'render') {
        console.log(`⚡ Force updating ${component.constructor.name}.${method}()`);
        
        try {
            if (typeof component[method] === 'function') {
                component[method]();
            }
        } catch (error) {
            console.error(`❌ Force update failed:`, error);
        }
    }
    
    // Get update queue status
    static getStatus() {
        if (!this.instance) {
            return { queueSize: 0, dirtyCount: 0, isProcessing: false };
        }
        
        return {
            queueSize: this.instance.updateQueue.size,
            dirtyCount: this.instance.dirtyComponents.size,
            isProcessing: this.instance.isProcessing
        };
    }
}