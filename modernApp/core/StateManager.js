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
    static character = null;
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
        
        // Load active character from CharacterManager
        // CharacterManager's init should ensure an active character is available or created.
        await this.loadActiveCharacter();
        
        // Set up auto-save
        this.setupAutoSave();
        
        // Listen for character switches
        EventBus.on('CHARACTER_SWITCHED', async (data) => { // data might contain { characterId, metadata }
            await this.loadActiveCharacter();
        });
        
        this.initialized = true;
        Logger.info('[StateManager] Initialized');
    }

    static dispatch(actionType, payload) {
        Logger.debug(`[StateManager] Dispatching action: ${actionType}`, payload);
        let updates;
        let success = true; 
        let error = null;   
    
        switch (actionType) {
            case 'UPDATE_BASIC_INFO':
                // Payload: { name, tier }
                this.updateCharacter(payload); 
                break;
            case 'UPDATE_ARCHETYPES':
                // Payload should be the new archetypes object e.g., { movement: "id1", attackType: "id2", ... }
                this.updateCharacter({ archetypes: payload }); 
                EventBus.emit('ARCHETYPES_UPDATED', { // Emit specific event for archetypes
                    archetypes: payload,
                    character: this.character
                });
                break;
            case 'PURCHASE_ENTITY':
                // Payload: { entityId, entityType, context (optional) }
                const entityToPurchase = EntityLoader.getEntity(payload.entityId);
                if (entityToPurchase) {
                    updates = this._internalPurchaseEntity(entityToPurchase, payload.entityType, payload.context || {});
                    if (updates) {
                        this.updateCharacter(updates);
                        EventBus.emit('ENTITY_PURCHASED', { entity: entityToPurchase, character: this.character });
                    }
                } else {
                    const errorMessage = `Entity not found for purchase: ${payload.entityId}`;
                    Logger.error(`[StateManager] ${errorMessage}`);
                    success = false;
                    error = errorMessage;
                }
                break;
            case 'REMOVE_ENTITY':
                // Payload: { purchaseId, entityType }
                updates = this._internalRemoveEntity(payload.purchaseId, payload.entityType);
                if (updates) {
                    this.updateCharacter(updates);
                    EventBus.emit('ENTITY_REMOVED', { purchaseId: payload.purchaseId, entityType: payload.entityType, character: this.character });
                }
                // If updates is null (entity not found for removal), it's not necessarily a dispatch error,
                // _internalRemoveEntity would have logged a warning.
                break;
            default:
                const unknownActionMessage = `Unknown action type: ${actionType}`;
                Logger.warn(`[StateManager] ${unknownActionMessage}`);
                success = false;
                error = unknownActionMessage;
                break; 
        }
        return { success, error }; // Return consistent object
    }
    
    // Helper for generating unique IDs for purchases
    static generatePurchaseId() {
        return `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Internal method to handle the logic of adding an entity
    static _internalPurchaseEntity(entity, entityType, context = {}) {
        const updates = {};
        const category = entityType + 's'; // e.g., flaws, traits
    
        const purchaseObject = {
            id: entity.id, // The ID of the entity definition
            purchaseId: this.generatePurchaseId(), // A unique ID for this specific purchase instance
            ...(context.config || {}) // Include any specific configuration for this purchase instance
        };
    
        updates[category] = [...(this.character[category] || []), purchaseObject];
        Logger.info(`[StateManager] Prepared purchase for ${entity.name} (ID: ${entity.id}) in ${category}`);
        return updates;
    }
    
    // Internal method to handle removal by purchaseId
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
                return null; // No change
            }
        }
        Logger.warn(`[StateManager] Category ${category} not found on character for removal.`);
        return null; // Category doesn't exist
    }


    static async loadActiveCharacter() {
        try {
            const characterData = this.characterManager.getActiveCharacter(); // This comes from CharacterManager's internal state
            
            if (!characterData) {
                // This case should ideally be handled by CharacterManager.init() ensuring a character always exists.
                // If CharacterManager.getActiveCharacter() can return null (e.g., no characters at all and none created yet),
                // then StateManager needs a robust default.
                Logger.info('[StateManager] No active character found by CharacterManager, creating default for StateManager internal use.');
                this.character = this.createDefaultCharacter();
                // Potentially, if CharacterManager reports NO active character, StateManager might need to inform CharacterManager
                // to create and set one, or this default character is temporary until CM provides one.
                // For now, StateManager will just use this default.
            } else {
                // Migrate if needed
                const migrated = await DataMigration.migrate(characterData);
                this.character = migrated;
            }
            
            this.clearHistory(); // Clear history for the newly loaded character
            
            Logger.info('[StateManager] Loaded character:', this.character.name);
            
            EventBus.emit('CHARACTER_LOADED', { character: this.character });
            
        } catch (error) {
            Logger.error('[StateManager] Failed to load character, creating default:', error);
            this.character = this.createDefaultCharacter();
            EventBus.emit('CHARACTER_LOADED', { character: this.character }); // Emit even with default
        }
    }
    
    static createDefaultCharacter() {
        // This should align with CharacterManager's default creation
        return {
            id: 'default_' + Date.now(), // Temporary ID if not yet saved by CharacterManager
            name: 'New Character',
            tier: 4,
            schemaVersion: DataMigration.CURRENT_VERSION, // Important for future migrations
            archetypes: {},
            attributes: {}, // Should initialize with base values if any
            traits: [],
            flaws: [],
            boons: [], // Example of another purchase array
            features: [],
            actions: [],
            limits: [],
            skills: [],
            specialAttacks: [], // Consider renaming to special_attacks_created if it stores full attack objects
            mainPool: { // Default pool values for a Tier 4 character
                available: (4 - 2) * 15, // (Tier-2) * 15
                spent: 0
            },
            combatAttr: {
                available: Math.floor(4 / 2) + 4, // Tier/2 + 4
                spent: 0
            },
            utilityAttr: {
                available: 4, // Tier (for Tier 4)
                spent: 0
            },
            created: Date.now(),
            lastModified: Date.now()
            // Ensure all expected top-level properties are present as per character schema
        };
    }
    
    static getCharacter() {
        if (!this.initialized || !this.character) {
            Logger.warn('[StateManager] getCharacter called before initialized or character is null. Returning new default structure.');
            return this.createDefaultCharacter(); // Always return a valid structure
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
            updates // Pass along what specifically changed
        });
        
        Logger.debug('[StateManager] Character updated:', this.character); // Log the full updated character for debug
    }
    
    static saveCharacter() {
        if (!this.initialized || !this.characterManager || !this.character) {
            Logger.error('[StateManager] Cannot save - StateManager not initialized, or CharacterManager/character is null.');
            return;
        }
        
        // Clear auto-save timeout if one was pending
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        // Save through CharacterManager
        this.characterManager.saveActiveCharacter(this.character);
        
        Logger.debug('[StateManager] Character save request sent to CharacterManager');
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
    
    // Attribute management
    static updateAttribute(attribute, value) {
        Logger.info(`[StateManager] Updating attribute: ${attribute} = ${value}`);
        
        const attributes = { ...(this.character.attributes || {}), [attribute]: value }; // Ensure attributes object exists
        
        this.updateCharacter({ attributes }); // This will also trigger CHARACTER_CHANGED
        
        // Emitting a specific ATTRIBUTE_CHANGED might be redundant if CHARACTER_CHANGED is sufficient
        // and components can derive changes from the 'updates' payload of CHARACTER_CHANGED.
        // EventBus.emit('ATTRIBUTE_CHANGED', {
        //     attribute,
        //     value,
        //     character: this.character
        // });
    }
    
    // History management
    static addToHistory() {
        if (!this.character) return; // Don't add null character to history
        // Remove any states after current index (if undo was used)
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add current state (deep copy)
        this.history.push(JSON.stringify(this.character));
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift(); // Remove oldest state
        } else {
            this.historyIndex++; // Only increment if not trimming
        }
    }
    
    static clearHistory() {
        this.history = [];
        this.historyIndex = -1;
    }
    
    static undo() {
        if (this.historyIndex > 0) { // Can't undo the initial state (index 0) this way
            this.historyIndex--;
            this.character = JSON.parse(this.history[this.historyIndex]);
            this.saveCharacter(); // Save undone state
            
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
            this.saveCharacter(); // Save redone state
            
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