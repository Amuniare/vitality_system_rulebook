// modernApp/core/StateManager.js
import { Logger } from '../utils/Logger.js';
import { EventBus } from './EventBus.js';
import { DataMigration } from './DataMigration.js';
import { EntityLoader } from './EntityLoader.js'; // Ensure EntityLoader is imported

/**
 * StateManager - Central state management for the character builder
 * Now works with CharacterManager for multi-character support
 */
export class StateManager {
    static instance = null; // Not used as a typical singleton, but methods are static
    static characterManager = null;
    static character = null; // Canonical property for current character state
    static history = [];
    static historyIndex = -1;
    static maxHistorySize = 50;
    static autoSaveTimeout = null;
    static initialized = false;
    
    static async init(characterManagerInstance) { // Accept instance
        if (this.initialized) {
            Logger.warn('[StateManager] Already initialized');
            return;
        }
        
        Logger.info('[StateManager] Initializing...');
        
        this.characterManager = characterManagerInstance; // Use passed instance
        
        await this.loadActiveCharacter();
        
        this.setupAutoSave();
        
        EventBus.on('CHARACTER_SWITCHED', async (data) => {
            await this.loadActiveCharacter();
        });
        
        this.initialized = true;
        Logger.info('[StateManager] Initialized');
    }

    static dispatch(action, payload = {}) {
        Logger.info(`[StateManager] Dispatching action: ${action}`, payload);
        
        // Create a deep clone of the character to ensure immutability
        // FIX 1 APPLIED HERE: Robust cloning, assumes this.character is the canonical state
        const oldCharacterState = this.character; // State *before* this dispatch
        let character; // This will be the mutable clone for this dispatch
        if (oldCharacterState === undefined) {
            Logger.warn("[StateManager] current character state (this.character) is undefined during dispatch. Initializing to an empty object for this operation. This might indicate an issue with character loading or initialization.");
            character = {};
        } else {
            // oldCharacterState can be null here, JSON.stringify(null) results in "null", which JSON.parse("null") correctly parses to null.
            character = JSON.parse(JSON.stringify(oldCharacterState));
        }
        // END OF FIX 1 APPLICATION
        
        let result = { success: false, error: 'Unknown action' };
        
        switch (action) {
            case 'CREATE_CHARACTER':
                const newChar = {
                    id: `char_${Date.now()}`,
                    schemaVersion: '4.0',
                    name: payload.name || 'New Character',
                    playerName: payload.playerName || '',
                    tier: payload.tier || 1,
                    characterType: payload.characterType || 'hero',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    attributes: {
                        power: 0,
                        endurance: 0,
                        mobility: 0,
                        focus: 0,
                        awareness: 0,
                        communication: 0,
                        intelligence: 0
                    },
                    archetypes: {},
                    traits: [],
                    flaws: [],
                    boons: [],
                    features: [],
                    action_upgrades: [],
                    unique_abilities: [],
                    special_attacks: [],
                    baseAttacks: {
                        melee: null,
                        ranged: null
                    }
                };
                // Note: this.character (canonical state) is updated below after history
                result = { success: true, character: newChar }; // 'character' here is the new state
                break;
                
            case 'UPDATE_BASIC_INFO':
                Object.assign(character, payload); // Modify the clone
                character.updatedAt = Date.now();
                result = { success: true, character };
                break;
                
            case 'UPDATE_ARCHETYPES':
                character.archetypes = { ...payload }; // Modify the clone
                character.updatedAt = Date.now();
                result = { success: true, character };
                break;
                
            case 'UPDATE_ATTRIBUTES':
                character.attributes = { ...character.attributes, ...payload }; // Modify the clone
                character.updatedAt = Date.now();
                result = { success: true, character };
                break;
                
            case 'PURCHASE_ENTITY':
                const { entityType, purchaseData } = payload;
                const arrayName = `${entityType}s`;
                
                if (!character[arrayName]) {
                    character[arrayName] = [];
                }
                
                character[arrayName] = [...character[arrayName], purchaseData]; // Modify the clone
                character.updatedAt = Date.now();
                result = { success: true, character, purchaseData };
                break;
                
            case 'REMOVE_ENTITY':
                const { purchaseId, entityType: removeType } = payload;
                const removeArrayName = `${removeType}s`;
                
                if (character[removeArrayName]) {
                    character[removeArrayName] = character[removeArrayName].filter(
                        p => p.purchaseId !== purchaseId
                    ); // Modify the clone
                    character.updatedAt = Date.now();
                    result = { success: true, character };
                } else {
                    result = { success: false, error: 'Entity array not found' };
                }
                break;
                
            case 'LOAD_CHARACTER': // This action might be redundant if CHARACTER_SWITCHED handles loading
                if (payload.character) {
                    // 'character' here is the payload, not the clone from above
                    // This action directly sets the state.
                    result = { success: true, character: JSON.parse(JSON.stringify(payload.character)) };
                }
                break;
                
            default:
                Logger.warn(`[StateManager] Unknown action: ${action}`);
        }
        
        // Only update canonical state and history if action was successful and state changed
        if (result.success && result.character && JSON.stringify(result.character) !== JSON.stringify(oldCharacterState)) {
            this.character = result.character; // Update the canonical this.character
            this._addToHistory(oldCharacterState); // Add the state *before* this dispatch
            this._saveToLocalStorage(); // Persist the new canonical state
            
            EventBus.emit('CHARACTER_CHANGED', { 
                character: this.character,
                action,
                payload 
            });
            
            if (action === 'PURCHASE_ENTITY') {
                EventBus.emit('ENTITY_PURCHASED', {
                    character: this.character,
                    entityType: payload.entityType,
                    purchaseData: result.purchaseData // Ensure purchaseData is in result if needed
                });
            } else if (action === 'REMOVE_ENTITY') {
                EventBus.emit('ENTITY_REMOVED', {
                    character: this.character,
                    entityType: payload.entityType,
                    purchaseId: payload.purchaseId
                });
            }
        } else if (result.success && action === 'LOAD_CHARACTER') {
            // Special case for LOAD_CHARACTER: even if the content is the same,
            // it's a load operation, so update canonical state and emit.
            this.character = result.character;
            this.clearHistory(); // Clear history for a newly loaded character
            this._saveToLocalStorage();
            EventBus.emit('CHARACTER_LOADED', { character: this.character });
        }
        
        return result;
    }

    static generatePurchaseId() {
        return `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    static _internalPurchaseEntity(entity, entityType, context = {}) {
        const updates = {};
        const category = entityType + 's'; 
    
        const purchaseObject = {
            id: entity.id, 
            purchaseId: this.generatePurchaseId(), 
            ...(context.config || {}) 
        };
    
        updates[category] = [...(this.character[category] || []), purchaseObject];
        Logger.info(`[StateManager] Prepared purchase for ${entity.name} (ID: ${entity.id}) in ${category}`);
        return updates;
    }
    
    static _internalRemoveEntity(purchaseId, entityType) {
        const updates = {};
        const category = entityType + 's';
    
        if (this.character[category]) {
            const originalLength = this.character[category].length;
            updates[category] = this.character[category].filter(p => p.purchaseId !== purchaseId);
            if (updates[category].length < originalLength) {
                Logger.info(`[StateManager] Prepared removal for purchaseId ${purchaseId} from ${category}`);
                return updates;
            } else {
                Logger.warn(`[StateManager] PurchaseId ${purchaseId} not found in ${category} for removal.`);
                return null; 
            }
        }
        Logger.warn(`[StateManager] Category ${category} not found on character for removal.`);
        return null; 
    }

    static async loadActiveCharacter() {
        try {
            const characterData = this.characterManager.getActiveCharacter(); 
            
            if (!characterData) {
                Logger.info('[StateManager] No active character found by CharacterManager, creating default for StateManager internal use.');
                this.character = this.createDefaultCharacter();
            } else {
                // FIX 2 APPLIED HERE: Robust handling of migration result
                const migrated = await DataMigration.migrate(characterData);
                this.character = migrated;
                // If migration resulted in null from a non-null characterData, it's an issue.
                if (this.character === null && characterData !== null) { 
                     Logger.warn('[StateManager] Character data migration resulted in null. Using default character to ensure a valid state.');
                     this.character = this.createDefaultCharacter();
                }
                // END OF FIX 2 APPLICATION
            }
            
            this.clearHistory(); 
            
            Logger.info('[StateManager] Loaded character:', this.character.name);
            
            EventBus.emit('CHARACTER_LOADED', { character: this.character });
            
        } catch (error) {
            Logger.error('[StateManager] Failed to load character, creating default:', error);
            this.character = this.createDefaultCharacter();
            EventBus.emit('CHARACTER_LOADED', { character: this.character }); 
        }
    }
    
    static createDefaultCharacter() {
        return {
            id: 'default_' + Date.now(), 
            name: 'New Character',
            tier: 4,
            schemaVersion: DataMigration.CURRENT_VERSION, 
            archetypes: {},
            attributes: {}, 
            traits: [],
            flaws: [],
            boons: [], 
            features: [],
            actions: [],
            limits: [],
            skills: [],
            specialAttacks: [], 
            mainPool: { 
                available: (4 - 2) * 15, 
                spent: 0
            },
            combatAttr: {
                available: Math.floor(4 / 2) + 4, 
                spent: 0
            },
            utilityAttr: {
                available: 4, 
                spent: 0
            },
            created: Date.now(),
            lastModified: Date.now()
        };
    }
    
    static getCharacter() {
        if (!this.initialized || !this.character) {
            Logger.warn('[StateManager] getCharacter called before initialized or character is null. Returning new default structure.');
            return this.createDefaultCharacter(); 
        }
        return this.character;
    }
    
    static updateCharacter(updates, addToHistory = true) {
        if (!this.initialized) {
            Logger.error('[StateManager] Cannot update - not initialized');
            return;
        }
        
        const stateBeforeUpdate = this.character; // Capture state before applying updates

        if (addToHistory) {
            this._addToHistory(stateBeforeUpdate); // Add the state *before* this specific update
        }
        
        this.character = { ...this.character, ...updates };
        
        this.saveCharacter(); // This now calls CharacterManager
        
        EventBus.emit('CHARACTER_CHANGED', {
            character: this.character,
            updates 
        });
        
        Logger.debug('[StateManager] Character updated:', this.character);
    }
    
    static saveCharacter() {
        if (!this.initialized || !this.characterManager || !this.character) {
            Logger.error('[StateManager] Cannot save - StateManager not initialized, or CharacterManager/character is null.');
            return;
        }
        
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.characterManager.saveActiveCharacter(this.character);
        Logger.debug('[StateManager] Character save request sent to CharacterManager');
    }

    static _saveToLocalStorage() { // Renamed for clarity, as it saves the current `this.character`
        if (!this.initialized || !this.characterManager || !this.character) {
            Logger.warn('[StateManager] Cannot _saveToLocalStorage - not fully initialized or character is null.');
            return;
        }
        this.characterManager.saveActiveCharacter(this.character);
        Logger.debug('[StateManager] (_saveToLocalStorage) Character data persisted via CharacterManager.');
    }
    
    static setupAutoSave() {
        EventBus.on('CHARACTER_CHANGED', () => {
            if (this.autoSaveTimeout) {
                clearTimeout(this.autoSaveTimeout);
            }
            
            this.autoSaveTimeout = setTimeout(() => {
                this.saveCharacter();
            }, 2000); 
        });
    }
    
    static updateAttribute(attribute, value) {
        Logger.info(`[StateManager] Updating attribute: ${attribute} = ${value}`);
        
        const attributes = { ...(this.character.attributes || {}), [attribute]: value }; 
        
        this.updateCharacter({ attributes });
    }
    
    static _addToHistory(characterState) { // Parameter renamed for clarity
        if (!characterState) return; 
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(JSON.stringify(characterState)); // Push the passed state
        
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
        Logger.info('[StateManager] Cannot undo: at oldest state or no history.');
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
        Logger.info('[StateManager] Cannot redo: at newest state.');
        return false;
    }
    
    static canUndo() {
        return this.historyIndex > 0;
    }
    
    static canRedo() {
        return this.historyIndex < this.history.length - 1;
    }
}