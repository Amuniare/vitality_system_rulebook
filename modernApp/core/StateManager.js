// modernApp/core/StateManager.js
import { Logger } from '../utils/Logger.js';
import { EventBus } from './EventBus.js';
import { DataMigration } from './DataMigration.js';

/**
 * StateManager - Central state management for the character builder
 * Now works with CharacterManager for multi-character support
 */
export class StateManager {
    static instance = null;
    static characterManager = null;
    static character = null;
    static history = [];
    static historyIndex = -1;
    static maxHistorySize = 50;
    static autoSaveTimeout = null;
    static initialized = false;
    
    static async init(characterManager) {
        if (this.initialized) {
            Logger.warn('[StateManager] Already initialized');
            return;
        }
        
        Logger.info('[StateManager] Initializing...');
        
        this.characterManager = characterManager;
        
        // Load active character from CharacterManager
        await this.loadActiveCharacter();
        
        // Set up auto-save
        this.setupAutoSave();
        
        // Listen for character switches
        EventBus.on('CHARACTER_SWITCHED', async () => {
            await this.loadActiveCharacter();
        });
        
        this.initialized = true;
        Logger.info('[StateManager] Initialized');
    }
    
    static async loadActiveCharacter() {
        try {
            const characterData = this.characterManager.getActiveCharacter();
            
            if (!characterData) {
                Logger.error('[StateManager] No active character to load');
                this.character = this.createDefaultCharacter();
                return;
            }
            
            // Migrate if needed
            const migrated = await DataMigration.migrate(characterData);
            
            this.character = migrated;
            this.clearHistory();
            
            Logger.info('[StateManager] Loaded character:', characterData.name);
            
            EventBus.emit('CHARACTER_LOADED', { character: this.character });
            
        } catch (error) {
            Logger.error('[StateManager] Failed to load character:', error);
            this.character = this.createDefaultCharacter();
        }
    }
    
    static createDefaultCharacter() {
        return {
            id: 'temp_' + Date.now(),
            name: 'New Character',
            tier: 4,
            version: DataMigration.CURRENT_VERSION,
            archetypes: {},
            attributes: {},
            traits: [],
            flaws: [],
            features: [],
            actions: [],
            limits: [],
            skills: [],
            specialAttacks: [],
            mainPool: {
                available: 30, // (4-2) * 15
                spent: 0
            },
            combatAttr: {
                available: 6, // floor(4/2) + 4
                spent: 0
            },
            utilityAttr: {
                available: 4,
                spent: 0
            }
        };
    }
    
    static getCharacter() {
        if (!this.initialized || !this.character) {
            Logger.warn('[StateManager] getCharacter called before initialized or character is null. Returning default structure.');
            return this.createDefaultCharacter();
        }
        return this.character;
    }
    
    static updateCharacter(updates, addToHistory = true) {
        if (!this.initialized) {
            Logger.error('[StateManager] Cannot update - not initialized');
            return;
        }
        
        if (addToHistory) {
            this.addToHistory();
        }
        
        // Apply updates
        this.character = { ...this.character, ...updates };
        
        // Save to CharacterManager
        this.saveCharacter();
        
        // Emit change event
        EventBus.emit('CHARACTER_CHANGED', {
            character: this.character,
            updates
        });
        
        Logger.debug('[StateManager] Character updated');
    }
    
    static saveCharacter() {
        if (!this.initialized || !this.characterManager) {
            Logger.error('[StateManager] Cannot save - not initialized');
            return;
        }
        
        // Clear auto-save timeout
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        // Save through CharacterManager
        this.characterManager.saveActiveCharacter(this.character);
        
        Logger.debug('[StateManager] Character saved');
    }
    
    static setupAutoSave() {
        // Auto-save on any change after a delay
        EventBus.on('CHARACTER_CHANGED', () => {
            if (this.autoSaveTimeout) {
                clearTimeout(this.autoSaveTimeout);
            }
            
            this.autoSaveTimeout = setTimeout(() => {
                this.saveCharacter();
            }, 2000); // 2 second delay
        });
    }
    
    // Purchase management
    static purchaseEntity(entity, context = {}) {
        Logger.info(`[StateManager] Purchasing entity: ${entity.name} (${entity.id})`);
        
        const updates = this._purchaseEntity(entity, context);
        
        if (updates) {
            this.updateCharacter(updates);
            
            EventBus.emit('ENTITY_PURCHASED', {
                entity,
                context,
                character: this.character
            });
            
            return true;
        }
        
        return false;
    }
    
    static _purchaseEntity(entity, context = {}) {
        const updates = {};
        
        switch (entity.type) {
            case 'trait':
            case 'flaw':
                const category = entity.type + 's';
                updates[category] = [...(this.character[category] || []), entity.id];
                break;
                
            case 'feature':
            case 'action':
            case 'limit':
            case 'skill':
                const pluralCategory = entity.type + 's';
                updates[pluralCategory] = [...(this.character[pluralCategory] || []), entity.id];
                break;
                
            default:
                Logger.warn(`[StateManager] Unknown entity type: ${entity.type}`);
                return null;
        }
        
        return updates;
    }
    
    static removeEntity(entityId, entityType) {
        Logger.info(`[StateManager] Removing entity: ${entityId} (${entityType})`);
        
        const updates = {};
        const category = entityType + 's';
        
        if (this.character[category]) {
            updates[category] = this.character[category].filter(id => id !== entityId);
            
            this.updateCharacter(updates);
            
            EventBus.emit('ENTITY_REMOVED', {
                entityId,
                entityType,
                character: this.character
            });
            
            return true;
        }
        
        return false;
    }
    
    // Archetype management
    static updateArchetypes(archetypes) {
        Logger.info('[StateManager] Updating archetypes');
        
        this.updateCharacter({ archetypes });
        
        EventBus.emit('ARCHETYPES_UPDATED', {
            archetypes,
            character: this.character
        });
    }
    
    // Attribute management
    static updateAttribute(attribute, value) {
        Logger.info(`[StateManager] Updating attribute: ${attribute} = ${value}`);
        
        const attributes = { ...this.character.attributes };
        attributes[attribute] = value;
        
        this.updateCharacter({ attributes });
        
        EventBus.emit('ATTRIBUTE_CHANGED', {
            attribute,
            value,
            character: this.character
        });
    }
    
    // History management
    static addToHistory() {
        // Remove any states after current index
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add current state
        this.history.push(JSON.stringify(this.character));
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }
    
    static clearHistory() {
        this.history = [];
        this.historyIndex = -1;
    }
    
    static undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.character = JSON.parse(this.history[this.historyIndex]);
            this.saveCharacter();
            
            EventBus.emit('CHARACTER_CHANGED', {
                character: this.character,
                source: 'undo'
            });
            
            Logger.info('[StateManager] Undo performed');
            return true;
        }
        
        return false;
    }
    
    static redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.character = JSON.parse(this.history[this.historyIndex]);
            this.saveCharacter();
            
            EventBus.emit('CHARACTER_CHANGED', {
                character: this.character,
                source: 'redo'
            });
            
            Logger.info('[StateManager] Redo performed');
            return true;
        }
        
        return false;
    }
    
    static canUndo() {
        return this.historyIndex > 0;
    }
    
    static canRedo() {
        return this.historyIndex < this.history.length - 1;
    }
}