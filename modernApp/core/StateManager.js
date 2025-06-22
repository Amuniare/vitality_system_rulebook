// modernApp/core/StateManager.js
import { Logger } from '../utils/Logger.js';
import { EventBus } from './EventBus.js';
import { DataMigration } from './DataMigration.js';

/**
 * StateManager - Central state management for the character builder.
 * Manages the active character's state, history, and persistence.
 */
export class StateManager {
    static characterManager = null; 
    static _internalCharacterState = null; 
    static _subscribers = new Set(); 
    
    static history = [];
    static historyIndex = -1;
    static maxHistorySize = 50;
    static autoSaveTimeout = null;
    static initialized = false;
    
    // FIXED: Accept characterManager instance during initialization
    static async init(characterManagerInstance) {
        if (this.initialized) {
            Logger.warn('[StateManager] Already initialized.');
            return;
        }
        
        Logger.info('[StateManager] Initializing...');
        
        // FIXED: Set characterManager before using it
        if (!characterManagerInstance) {
            throw new Error('StateManager requires a CharacterManager instance');
        }
        this.characterManager = characterManagerInstance;
        
        await this.loadActiveCharacter(); 
        
        this.setupAutoSave();
        
        EventBus.on('CHARACTER_SWITCHED', async (data) => {
            Logger.info('[StateManager] CHARACTER_SWITCHED event received. Loading new active character.');
            await this.loadActiveCharacter();
        });
        
        this.initialized = true;
        Logger.info('[StateManager] Initialization complete.');
    }

    static getState() {
        if (!this._internalCharacterState) {
            return null;
        }
        try {
            return JSON.parse(JSON.stringify(this._internalCharacterState));
        } catch (e) {
            Logger.error('[StateManager] Error deep cloning state in getState():', e, this._internalCharacterState);
            return null; 
        }
    }

    static subscribe(callback) {
        if (typeof callback !== 'function') {
            Logger.warn('[StateManager] Attempted to subscribe with a non-function.');
            return () => {}; 
        }
        this._subscribers.add(callback);
        Logger.debug('[StateManager] New subscriber added. Total:', this._subscribers.size);
        return () => this.unsubscribe(callback);
    }

    static unsubscribe(callback) {
        this._subscribers.delete(callback);
        Logger.debug('[StateManager] Subscriber removed. Total:', this._subscribers.size);
    }

    static _notifySubscribers() {
        Logger.debug(`[StateManager] Notifying ${this._subscribers.size} subscribers.`);
        const currentState = this.getState();
        
        this._subscribers.forEach(callback => {
            try {
                callback(currentState);
            } catch (error) {
                Logger.error('[StateManager] Error in subscriber callback:', error);
            }
        });
    }

    static async updateState(updates, actionDescription = 'Unknown update') {
        if (!this._internalCharacterState) {
            Logger.error('[StateManager] Cannot update state: No active character.');
            return { success: false, error: 'No active character loaded.' };
        }

        try {
            this._addToHistory(JSON.parse(JSON.stringify(this._internalCharacterState)));

            const updatedState = { ...this._internalCharacterState };
            
            for (const [key, value] of Object.entries(updates)) {
                updatedState[key] = value;
            }
            
            updatedState.updatedAt = Date.now();
            this._internalCharacterState = updatedState;

            this._notifySubscribers();
            this._persistCharacterState();
            
            EventBus.emit('CHARACTER_CHANGED', { 
                character: this.getState(), 
                updates, 
                description: actionDescription 
            });

            Logger.debug(`[StateManager] State updated: ${actionDescription}`);
            return { success: true };
            
        } catch (error) {
            Logger.error('[StateManager] Failed to update state:', error);
            return { success: false, error: error.message };
        }
    }

    // FIXED: Add error handling for missing characterManager
    static async loadActiveCharacter() {
        Logger.info('[StateManager] Attempting to load active character data via CharacterManager...');
        try {
            // FIXED: Check if characterManager exists before using it
            if (!this.characterManager) {
                Logger.error('[StateManager] CharacterManager not available. Using default character.');
                this._internalCharacterState = this.createDefaultCharacter();
                this.clearHistory();
                this._notifySubscribers();
                EventBus.emit('CHARACTER_LOADED', { character: this.getState() });
                return;
            }

            const characterDataFromManager = this.characterManager.getActiveCharacter(); 
            
            if (!characterDataFromManager) {
                Logger.warn('[StateManager] CharacterManager returned no active character. StateManager will use a default structure.');
                this._internalCharacterState = this.createDefaultCharacter();
                Logger.info('[StateManager] Initialized with a default character structure.');
            } else {
                const migratedData = await DataMigration.migrate(characterDataFromManager);
                if (migratedData === null && characterDataFromManager !== null) {
                     Logger.error('[StateManager] CRITICAL: Character data migration resulted in null. Falling back to default.');
                     this._internalCharacterState = this.createDefaultCharacter();
                } else {
                    this._internalCharacterState = migratedData;
                }
                Logger.info(`[StateManager] Loaded character: ${this._internalCharacterState?.name} (ID: ${this._internalCharacterState?.id})`);
            }
            
            this.clearHistory(); 
            this._notifySubscribers(); 
            EventBus.emit('CHARACTER_LOADED', { character: this.getState() });
            
        } catch (error) {
            Logger.error('[StateManager] Failed to load character, using default:', error);
            this._internalCharacterState = this.createDefaultCharacter();
            this.clearHistory();
            this._notifySubscribers();
            EventBus.emit('CHARACTER_LOADED', { character: this.getState() });
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
            action_upgrades: [], 
            unique_abilities: [], 
            special_attacks: [],
            createdAt: Date.now(), 
            updatedAt: Date.now()
        };
    }
        
    static _persistCharacterState() {
        if (!this.initialized || !this.characterManager || !this._internalCharacterState) {
            Logger.warn('[StateManager] Cannot persist state: Not fully initialized or character state is null.');
            return;
        }
        
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
            if (this.characterManager && this._internalCharacterState) {
                this.characterManager.saveActiveCharacter(this._internalCharacterState);
                Logger.debug('[StateManager] Character state persisted via CharacterManager (debounced).');
            }
        }, 500); 
    }
    
    static setupAutoSave() {
        Logger.info('[StateManager] Auto-save behavior integrated into state persistence logic.');
    }
        
    static _addToHistory(stateSnapshot) {
        if (!stateSnapshot) {
            Logger.warn('[StateManager] Attempted to add null/undefined state to history.');
            return;
        }
        
        // Remove future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(stateSnapshot);
        this.historyIndex = this.history.length - 1;
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            const excess = this.history.length - this.maxHistorySize;
            this.history = this.history.slice(excess);
            this.historyIndex -= excess;
        }
        
        Logger.debug(`[StateManager] Added to history. Total entries: ${this.history.length}, Index: ${this.historyIndex}`);
    }
    
    static clearHistory() {
        this.history = [];
        this.historyIndex = -1;
        Logger.info('[StateManager] History cleared.');
    }

    static undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this._internalCharacterState = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this._notifySubscribers();
            this._persistCharacterState();
            EventBus.emit('CHARACTER_CHANGED', { 
                character: this.getState(), 
                updates: {}, 
                description: 'Undo' 
            });
            Logger.info(`[StateManager] Undo performed. History index: ${this.historyIndex}`);
            return true;
        }
        Logger.warn('[StateManager] Cannot undo: No previous state available.');
        return false;
    }

    static redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this._internalCharacterState = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this._notifySubscribers();
            this._persistCharacterState();
            EventBus.emit('CHARACTER_CHANGED', { 
                character: this.getState(), 
                updates: {}, 
                description: 'Redo' 
            });
            Logger.info(`[StateManager] Redo performed. History index: ${this.historyIndex}`);
            return true;
        }
        Logger.warn('[StateManager] Cannot redo: No future state available.');
        return false;
    }

    // Helper method to get character info
    static getCharacter() {
        return this.getState();
    }

    // Debug methods
    static getDebugInfo() {
        return {
            initialized: this.initialized,
            hasCharacterManager: !!this.characterManager,
            hasState: !!this._internalCharacterState,
            subscriberCount: this._subscribers.size,
            historyLength: this.history.length,
            historyIndex: this.historyIndex
        };
    }
}