// modernApp/core/StateManager.js
import { Logger } from '../utils/Logger.js';
// Storage is no longer directly used by StateManager for loading active character
import { EventBus } from './EventBus.js';
import { DataMigration } from './DataMigration.js'; // For default character schemaVersion
// SchemaSystem might be needed if we want a truly schema-valid default empty char
// import { SchemaSystem } from './SchemaSystem.js';

export class StateManager {
    static _character = null;
    static _isInitialized = false;

    /**
     * Loads a character into the state. This is the primary way to set/change the active character.
     * @param {Object} characterData - The full character data object.
     */
    static loadCharacter(characterData) {
        if (!characterData || !characterData.id) {
            Logger.error('[StateManager] loadCharacter called with invalid or missing character data.');
            // Set a minimal error state to prevent cascading failures
            this._character = { 
                id: 'error_char_load', 
                name: 'Character Loading Error', 
                tier: 1, 
                schemaVersion: DataMigration.CURRENT_VERSION, 
                archetypes: {}, flaws:[], traits:[], attributes:{}, pools:{},
                // Add other essential empty arrays/objects based on character schema
                boons: [], action_upgrades: [], features: [], senses: [], 
                descriptors: [], movement_features: [], 
                unique_abilities_purchased: [], special_attacks_created: []
            };
            this._isInitialized = true; // Mark as initialized even if with an error state
            EventBus.emit('character-updated', this.getCharacter()); // Notify UI
            return;
        }

        Logger.info(`[StateManager] Loading character: ${characterData.name} (ID: ${characterData.id})`);
        this._character = characterData; // Assume data is already migrated if necessary
        this._isInitialized = true;
        EventBus.emit('character-updated', this.getCharacter());
    }

    /**
     * Returns a deep copy of the current character state.
     * Returns a default empty structure if not initialized.
     * @returns {Object} The character object.
     */
    static getCharacter() {
        if (!this._isInitialized || !this._character) {
            Logger.warn('[StateManager] getCharacter called before initialized or character is null. Returning default structure.');
            return {
                id: null, name: 'No Character Loaded', tier: 1, schemaVersion: DataMigration.CURRENT_VERSION,
                archetypes: {}, flaws: [], traits: [], boons: [], action_upgrades: [],
                features: [], senses: [], descriptors: [], movement_features: [],
                unique_abilities_purchased: [], special_attacks_created: [],
                attributes: { focus: 0, mobility: 0, power: 0, endurance: 0, awareness: 0, communication: 0, intelligence: 0 }, // Default attributes
                pools: {} // Pools are typically calculated, so empty is fine
            };
        }
        return JSON.parse(JSON.stringify(this._character));
    }

    /**
     * The single entry point for all state mutations.
     * @param {string} actionType - The type of action to perform.
     * @param {Object} payload - The data for the action.
     * @returns {{success: boolean, error?: string}}
     */
    static dispatch(actionType, payload) {
        if (!this._isInitialized) {
            const errorMsg = 'StateManager not initialized. Cannot dispatch action.';
            Logger.error(`[StateManager] ${errorMsg}`);
            return { success: false, error: errorMsg };
        }
        if (!this._character) {
            const errorMsg = 'StateManager has no active character. Cannot dispatch action.';
            Logger.error(`[StateManager] ${errorMsg}`);
            return { success: false, error: errorMsg };
        }


        Logger.debug(`[StateManager] Dispatching action: ${actionType}`, payload);
        // Operate on a copy for mutation, then assign back
        let newState = this.getCharacter(); // Gets a deep copy

        try {
            switch (actionType) {
                case 'PURCHASE_ENTITY':
                    newState = this._purchaseEntity(newState, payload);
                    break;
                case 'REMOVE_ENTITY':
                    newState = this._removeEntity(newState, payload);
                    break;
                case 'UPDATE_BASIC_INFO':
                    newState = this._updateBasicInfo(newState, payload);
                    break;
                case 'UPDATE_ARCHETYPES':
                    newState = this._updateArchetypes(newState, payload);
                    break;
                default:
                    throw new Error(`Unknown action type: ${actionType}`);
            }

            this._character = newState;
            // Persisting the active character is now CharacterManager's responsibility
            // when it saves the character after changes.
            // For immediate feedback, StateManager still emits.
            EventBus.emit('character-updated', this.getCharacter());
            Logger.debug(`[StateManager] State updated for ${actionType}.`);
            return { success: true };

        } catch (error) {
            Logger.error(`[StateManager] Failed to dispatch ${actionType}:`, error);
            return { success: false, error: error.message };
        }
    }

    // --- Private Reducer-like Functions ---
    // (These remain largely the same but operate on the passed 'state' copy)

    static _purchaseEntity(state, { entityId, entityType }) {
        const arrayName = `${entityType}s`; 
        if (!state[arrayName]) {
            state[arrayName] = [];
        }
        // Ensure purchaseId is truly unique if rapidly clicking
        const purchaseId = `purch_${entityId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const newPurchase = {
            id: entityId,
            purchaseId: purchaseId 
        };
        state[arrayName].push(newPurchase);
        return state;
    }

    static _removeEntity(state, { purchaseId, entityType }) {
        const arrayName = `${entityType}s`;
        if (state[arrayName]) {
            state[arrayName] = state[arrayName].filter(p => p.purchaseId !== purchaseId);
        }
        return state;
    }
    
    static _updateBasicInfo(state, { name, tier }) {
        if (name !== undefined) state.name = name;
        if (tier !== undefined) state.tier = tier;
        return state;
    }

    static _updateArchetypes(state, { category, archetypeId }) {
        if (!state.archetypes) {
            state.archetypes = {};
        }
        state.archetypes[category] = archetypeId; // archetypeId can be null to clear selection
        return state;
    }
}