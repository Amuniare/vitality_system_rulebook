// modernApp/core/EntityLoader.js
import { DataLoader } from '../utils/DataLoader.js';
import { Logger } from '../utils/Logger.js';

export class EntityLoader {
    static entities = new Map();
    static indexes = {
        byType: new Map(),
        byCategory: new Map(),
        byTag: new Map()
    };
    
    static async init() {
        try {
            // ✅ Use DataLoader to fetch data, enabling caching
            const data = await DataLoader.loadJSON('data/unified-game-data.json');
            
            // Load all entities
            Object.entries(data.entities).forEach(([id, entity]) => {
                entity.id = id; // Ensure ID is set
                this.entities.set(id, entity);
                
                // Build indexes
                this.indexEntity(entity);
            });
            
            // ✅ Use Logger for consistent output
            Logger.info(`[EntityLoader] Loaded and indexed ${this.entities.size} entities.`);
        } catch (error) {
            // ✅ Use Logger for error handling
            Logger.error('[EntityLoader] Failed to load entities:', error);
            throw error;
        }
    }
    
    static indexEntity(entity) {
        // Index by type
        if (entity.type) {
            if (!this.indexes.byType.has(entity.type)) {
                this.indexes.byType.set(entity.type, new Set());
            }
            this.indexes.byType.get(entity.type).add(entity.id);
        }
        
        // Index by category
        if (entity.category) {
            if (!this.indexes.byCategory.has(entity.category)) {
                this.indexes.byCategory.set(entity.category, new Set());
            }
            this.indexes.byCategory.get(entity.category).add(entity.id);
        }
        
        // Index by tags
        if (entity.tags) {
            entity.tags.forEach(tag => {
                if (!this.indexes.byTag.has(tag)) {
                    this.indexes.byTag.set(tag, new Set());
                }
                this.indexes.byTag.get(tag).add(entity.id);
            });
        }
    }
    
    static getEntity(id) {
        return this.entities.get(id);
    }
    
    static getEntitiesByType(type) {
        const ids = this.indexes.byType.get(type) || new Set();
        return Array.from(ids).map(id => this.entities.get(id));
    }
    
    static getEntitiesByCategory(category) {
        const ids = this.indexes.byCategory.get(category) || new Set();
        return Array.from(ids).map(id => this.entities.get(id));
    }
    
    static getEntitiesByFilter(filter) {
        let results = Array.from(this.entities.values());
        
        if (filter.type) {
            results = results.filter(e => e.type === filter.type);
        }
        
        if (filter.category) {
            results = results.filter(e => e.category === filter.category);
        }
        
        if (filter.tags) {
            results = results.filter(e => 
                e.tags && filter.tags.some(tag => e.tags.includes(tag))
            );
        }
        
        if (filter.custom) {
            results = results.filter(filter.custom);
        }
        
        return results;
    }
}