import { EventBus } from './EventBus.js';
import { SchemaSystem } from './SchemaSystem.js';


export class StateManager {
    static character = null;
    static history = [];
    static maxHistory = 50;
    
    static init() {
        // Create default character
        const defaultCharacter = {
            id: Date.now().toString(),
            name: 'New Character',
            tier: 4,
            archetypes: {},
            traits: [],
            flaws: [],
            boons: [],
            pools: {
                main: { totalAvailable: 0, totalSpent: 0, remaining: 0 },
                utility: { totalAvailable: 15, totalSpent: 0, remaining: 15 },
                special: { totalAvailable: 30, totalSpent: 0, remaining: 30 }
            }
        };
        
        const validation = SchemaSystem.validate('character', defaultCharacter);
        this.character = validation.data;
    }
    
    static getCharacter() {
        return this.character;
    }
    
    static dispatch(action, payload = {}) {
        console.log(`[StateManager] Dispatching: ${action}`, payload);
        
        try {
            // Save to history
            this.saveToHistory();
            
            // Process action
            let result;
            switch (action) {
                case 'UPDATE_BASIC_INFO':
                    result = this.updateBasicInfo(payload);
                    break;
                case 'SELECT_ARCHETYPE':
                    result = this.selectArchetype(payload);
                    break;
                case 'PURCHASE_ENTITY':
                    result = this.purchaseEntity(payload);
                    break;
                case 'REMOVE_ENTITY':
                    result = this.removeEntity(payload);
                    break;
                default:
                    throw new Error(`Unknown action: ${action}`);
            }



            // Validate new state
            const validation = SchemaSystem.validate('character', this.character);
            if (!validation.isValid) {
                this.rollback();
                throw new Error(`Invalid character state: ${validation.errors.join(', ')}`);
            }

            
            // Notify listeners
            EventBus.emit('character-updated', {
                character: this.character,
                action,
                changes: result.changes || []
            });



            return { success: true, ...result };
            
        } catch (error) {
            console.error(`[StateManager] Error in ${action}:`, error);
            EventBus.emit('action-failed', { action, error: error.message });
            return { success: false, error: error.message };
        }
    }
    
    static updateBasicInfo({ name, tier }) {
        if (name !== undefined) this.character.name = name;
        if (tier !== undefined) this.character.tier = tier;
        
        return { 
            changes: ['basicInfo'],
            message: 'Basic info updated'
        };
    }
    
    static selectArchetype({ category, archetypeId }) {
        if (!category) throw new Error('Category required');
        
        this.character.archetypes[category] = archetypeId;
        
        return {
            changes: ['archetypes', category],
            message: `Selected ${archetypeId} for ${category}`
        };
    }
    
    static purchaseEntity({ entityId, entityType, cost, options = {} }) {
        const arrayName = this.getArrayForType(entityType);
        if (!arrayName) throw new Error(`Invalid entity type: ${entityType}`);
        
        // Add to character
        const purchase = {
            id: entityId,
            purchaseId: Date.now().toString(),
            cost: cost,
            options: options,
            purchaseDate: new Date().toISOString()
        };
        
        this.character[arrayName].push(purchase);
        
        // Update pool
        if (cost && cost.pool) {
            this.updatePool(cost.pool, cost.value || 0);
        }
        
        return {
            changes: [arrayName, 'pools'],
            message: `Purchased ${entityId}`
        };
    }
    
    static removeEntity({ purchaseId, entityType }) {
        const arrayName = this.getArrayForType(entityType);
        if (!arrayName) throw new Error(`Invalid entity type: ${entityType}`);
        
        const index = this.character[arrayName].findIndex(p => p.purchaseId === purchaseId);
        if (index === -1) throw new Error('Purchase not found');
        
        const removed = this.character[arrayName].splice(index, 1)[0];
        
        // Refund cost
        if (removed.cost && removed.cost.pool) {
            this.updatePool(removed.cost.pool, -(removed.cost.value || 0));
        }
        
        return {
            changes: [arrayName, 'pools'],
            message: `Removed ${removed.id}`
        };
    }
    
    static getArrayForType(entityType) {
        const typeMap = {
            'trait': 'traits',
            'flaw': 'flaws',
            'boon': 'boons',
            'action': 'actions',
            'feature': 'features',
            'sense': 'senses'
        };
        return typeMap[entityType];
    }
    
    static updatePool(poolName, spent) {
        const pool = this.character.pools[poolName];
        if (!pool) return;
        
        pool.totalSpent += spent;
        pool.remaining = pool.totalAvailable - pool.totalSpent;
    }
    
    static saveToHistory() {
        this.history.push(JSON.stringify(this.character));
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }
    
    static rollback() {
        if (this.history.length === 0) return;
        
        const previous = this.history.pop();
        this.character = JSON.parse(previous);
    }
}

