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
        const ids = this.indexes.byType.get(type);
        if (!ids) {
            Logger.warn(`[EntityLoader] No entities found for type: ${type}`);
            return [];
        }
        return Array.from(ids).map(id => this.entities.get(id)).filter(Boolean);
    }

    static getAvailableEntities(type, character = null) {
        const entities = this.getEntitiesByType(type);
        
        // For unique abilities, filter out already purchased upgrades
        if (type === 'unique_ability' && character) {
            const purchasedIds = new Set(
                (character.unique_abilities || []).map(p => p.id)
            );
            
            return entities.filter(entity => {
                // Show base abilities and unpurchased upgrades
                if (!entity.parentId) return true;
                return !purchasedIds.has(entity.id);
            });
        }
        
        return entities;
    }

    static getEntitiesByCategory(category) {
        const ids = this.indexes.byCategory.get(category);
        if (!ids) return [];
        return Array.from(ids).map(id => this.entities.get(id)).filter(Boolean);
    }

    static getEntitiesByTag(tag) {
        const ids = this.indexes.byTag.get(tag);
        if (!ids) return [];
        return Array.from(ids).map(id => this.entities.get(id)).filter(Boolean);
    }

    static searchEntities(query) {
        const lowerQuery = query.toLowerCase();
        const results = [];
        
        for (const [id, entity] of this.entities) {
            if (entity.name?.toLowerCase().includes(lowerQuery) ||
                entity.description?.toLowerCase().includes(lowerQuery)) {
                results.push(entity);
            }
        }
        
        return results;
    }

}