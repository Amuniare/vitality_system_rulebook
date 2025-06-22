// modernApp/core/StateManager.js
import { Logger } from '../utils/Logger.js';
import { Storage } from '../utils/Storage.js';
import { EventBus } from './EventBus.js';
import { DataMigration } from './DataMigration.js';
import { SchemaSystem } from './SchemaSystem.js';

const storage = new Storage('vitality-character-');

/**
 * A pure state container and dispatcher for the character object.
 * It contains no business logic. It is the single source of truth.
 */
export class StateManager {
    static _character = null;
    static _isInitialized = false;

    /**
     * Initializes the state by loading from storage or creating a new character.
     */
    static init() {
        if (this._isInitialized) return;

        Logger.info('[StateManager] Initializing...');
        let characterData = storage.getItem('activeCharacter');

        if (characterData) {
            Logger.info('[StateManager] Found character in storage. Migrating...');
            characterData = DataMigration.migrate(characterData);
        } else {
            Logger.info('[StateManager] No character in storage. Creating a new one.');
            const validation = SchemaSystem.validate('character', {
                id: `char_${Date.now()}`,
                name: 'New Character',
                schemaVersion: DataMigration.CURRENT_VERSION
            });
            characterData = validation.data;
        }

        this._character = characterData;
        this._isInitialized = true;
        Logger.info('[StateManager] Initialized successfully.', this._character);
        EventBus.emit('character-updated', this._character);
    }

    /**
     * Returns a deep copy of the current character state.
     * @returns {Object} The character object.
     */
    static getCharacter() {
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
            const errorMsg = 'StateManager not initialized.';
            Logger.error(`[StateManager] ${errorMsg}`);
            return { success: false, error: errorMsg };
        }

        Logger.debug(`[StateManager] Dispatching action: ${actionType}`, payload);
        const currentState = this.getCharacter();
        let newState;

        try {
            switch (actionType) {
                case 'PURCHASE_ENTITY':
                    newState = this._purchaseEntity(currentState, payload);
                    break;
                case 'REMOVE_ENTITY':
                    newState = this._removeEntity(currentState, payload);
                    break;
                case 'UPDATE_BASIC_INFO':
                    newState = this._updateBasicInfo(currentState, payload);
                    break;
                case 'UPDATE_ARCHETYPES':
                    newState = this._updateArchetypes(currentState, payload);
                    break;
                default:
                    throw new Error(`Unknown action type: ${actionType}`);
            }

            this._character = newState;
            storage.setItem('activeCharacter', this._character);
            EventBus.emit('character-updated', this.getCharacter());
            Logger.debug(`[StateManager] State updated for ${actionType}.`, this._character);
            return { success: true };

        } catch (error) {
            Logger.error(`[StateManager] Failed to dispatch ${actionType}:`, error);
            return { success: false, error: error.message };
        }
    }

    // --- Private Reducer-like Functions ---

    static _purchaseEntity(state, { entityId, entityType }) {
        const arrayName = `${entityType}s`; // e.g., 'flaws', 'traits'
        if (!state[arrayName]) {
            state[arrayName] = [];
        }
        const newPurchase = {
            id: entityId,
            purchaseId: `purch_${Date.now()}` // Unique ID for this specific instance
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
        state.name = name;
        state.tier = tier;
        return state;
    }

    static _updateArchetypes(state, { category, archetypeId }) {
        if (!state.archetypes) {
            state.archetypes = {};
        }
        state.archetypes[category] = archetypeId;
        return state;
    }
}