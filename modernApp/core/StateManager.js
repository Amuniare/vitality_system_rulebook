// modernApp/core/StateManager.js
import { Logger } from '../utils/Logger.js';
import { EventBus } from './EventBus.js';
import { DataMigration } from './DataMigration.js';

/**
 * StateManager - Central state management for the character builder with enhanced debugging
 * Manages the active character's state, history, and persistence.
 */
export class StateManager {
    static characterManager = null; 
    static _internalCharacterState = null; 
    static _subscribers = new Set(); 
    static _previousState = null; // For debugging state changes
    
    static history = [];
    static historyIndex = -1;
    static maxHistorySize = 50;
    static autoSaveTimeout = null;
    static initialized = false;
    static updateCount = 0;
    
    // Accept characterManager instance during initialization
    static async init(characterManagerInstance) {
        if (this.initialized) {
            Logger.warn('[StateManager] Already initialized.');
            return;
        }
        
        Logger.info('[StateManager] Initializing...');
        
        // Set characterManager before using it
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
        Logger.info('[StateManager] Initialization complete. Initial state:', this._internalCharacterState);
    }
    
    static async loadActiveCharacter() {
        Logger.info('[StateManager] Loading active character...');
        
        try {
            const character = await this.characterManager.getActiveCharacter();
            
            if (character) {
                // Store previous state for debugging
                this._previousState = this._internalCharacterState ? 
                    JSON.parse(JSON.stringify(this._internalCharacterState)) : null;
                
                this._internalCharacterState = character;
                this.updateCount++;
                
                Logger.info('[StateManager] Active character loaded successfully:', {
                    name: character.name,
                    id: character.id,
                    tier: character.tier,
                    updateCount: this.updateCount
                });
                
                // Emit event with debugging info
                Logger.debug('[StateManager] Emitting CHARACTER_CHANGED event...');
                EventBus.emit('CHARACTER_CHANGED', { 
                    character: this._internalCharacterState,
                    updateCount: this.updateCount,
                    timestamp: Date.now()
                });
                Logger.debug('[StateManager] CHARACTER_CHANGED event emitted successfully');
            } else {
                Logger.warn('[StateManager] No active character found');
                this._internalCharacterState = null;
            }
        } catch (error) {
            Logger.error('[StateManager] Failed to load active character:', error);
            throw error;
        }
    }
    
    static getState() {
        if (!this.initialized) {
            Logger.warn('[StateManager] getState() called before initialization');
            return null;
        }
        
        if (!this._internalCharacterState) {
            Logger.debug('[StateManager] getState() returning null - no active character');
            return null;
        }
        
        // Return a deep copy to prevent external modifications
        const state = JSON.parse(JSON.stringify(this._internalCharacterState));
        Logger.debug('[StateManager] getState() returning state for:', state.name);
        return state;
    }
    
    static async updateState(newState, description = 'State update') {
        if (!this.initialized) {
            Logger.error('[StateManager] updateState() called before initialization');
            throw new Error('StateManager not initialized');
        }
        
        if (!newState) {
            Logger.error('[StateManager] updateState() called with null state');
            throw new Error('Cannot update state with null value');
        }
        
        Logger.info(`[StateManager] updateState() called: ${description}`, {
            updateCount: this.updateCount + 1,
            newStateName: newState.name,
            newStateId: newState.id
        });
        
        try {
            // Store previous state for debugging and history
            this._previousState = this._internalCharacterState ? 
                JSON.parse(JSON.stringify(this._internalCharacterState)) : null;
            
            // Validate the new state
            if (!newState.id || !newState.name) {
                Logger.error('[StateManager] Invalid state structure:', newState);
                throw new Error('State must have id and name properties');
            }
            
            // Add to history before updating
            if (this._internalCharacterState) {
                this.addToHistory(this._internalCharacterState, description);
            }
            
            // Update internal state
            this._internalCharacterState = JSON.parse(JSON.stringify(newState));
            this.updateCount++;
            
            Logger.info('[StateManager] Internal state updated successfully:', {
                updateCount: this.updateCount,
                characterName: this._internalCharacterState.name
            });
            
            // Save to character manager
            try {
                await this.characterManager.updateCharacter(this._internalCharacterState.id, this._internalCharacterState);
                Logger.debug('[StateManager] Character saved to CharacterManager');
            } catch (saveError) {
                Logger.error('[StateManager] Failed to save character to CharacterManager:', saveError);
                // Don't throw here - the state update succeeded, save failure is secondary
            }
            
            // Emit change event with debugging info
            Logger.info('[StateManager] Emitting CHARACTER_CHANGED event...', {
                description,
                updateCount: this.updateCount,
                timestamp: Date.now()
            });
            
            EventBus.emit('CHARACTER_CHANGED', { 
                character: this._internalCharacterState,
                previousCharacter: this._previousState,
                description,
                updateCount: this.updateCount,
                timestamp: Date.now()
            });
            
            Logger.info('[StateManager] CHARACTER_CHANGED event emitted successfully');
            
            // Schedule auto-save
            this.scheduleAutoSave();
            
        } catch (error) {
            Logger.error('[StateManager] updateState() failed:', error);
            throw error;
        }
    }
    
    static addToHistory(state, description) {
        const historyEntry = {
            state: JSON.parse(JSON.stringify(state)),
            description,
            timestamp: Date.now()
        };
        
        // Remove any future history entries (if we're not at the latest state)
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(historyEntry);
        this.historyIndex = this.history.length - 1;
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
        
        Logger.debug(`[StateManager] Added to history: ${description}. History size: ${this.history.length}`);
    }
    
    static setupAutoSave() {
        Logger.debug('[StateManager] Setting up auto-save...');
        // Auto-save is handled by scheduleAutoSave() called after each update
    }
    
    static scheduleAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(async () => {
            try {
                if (this._internalCharacterState) {
                    Logger.debug('[StateManager] Auto-saving character...');
                    await this.characterManager.saveActiveCharacter(this._internalCharacterState);
                    Logger.debug('[StateManager] Auto-save completed');
                }
            } catch (error) {
                Logger.error('[StateManager] Auto-save failed:', error);
            }
        }, 1000); // Auto-save after 1 second of inactivity
    }
    
    static async undo() {
        if (this.historyIndex <= 0) {
            Logger.warn('[StateManager] Cannot undo: No previous state available.');
            return false;
        }
        
        this.historyIndex--;
        const historyEntry = this.history[this.historyIndex];
        
        Logger.info(`[StateManager] Undoing to: ${historyEntry.description}`);
        
        // Update state without adding to history
        this._previousState = this._internalCharacterState ? 
            JSON.parse(JSON.stringify(this._internalCharacterState)) : null;
        this._internalCharacterState = JSON.parse(JSON.stringify(historyEntry.state));
        this.updateCount++;
        
        // Save and emit change
        await this.characterManager.updateCharacter(this._internalCharacterState.id, this._internalCharacterState);
        EventBus.emit('CHARACTER_CHANGED', { 
            character: this._internalCharacterState,
            description: `Undo: ${historyEntry.description}`,
            updateCount: this.updateCount,
            timestamp: Date.now()
        });
        
        Logger.info(`[StateManager] Undo completed. History index: ${this.historyIndex}`);
        return true;
    }
    
    static async redo() {
        if (this.historyIndex >= this.history.length - 1) {
            Logger.warn('[StateManager] Cannot redo: No future state available.');
            return false;
        }
        
        this.historyIndex++;
        const historyEntry = this.history[this.historyIndex];
        
        Logger.info(`[StateManager] Redoing to: ${historyEntry.description}`);
        
        // Update state without adding to history
        this._previousState = this._internalCharacterState ? 
            JSON.parse(JSON.stringify(this._internalCharacterState)) : null;
        this._internalCharacterState = JSON.parse(JSON.stringify(historyEntry.state));
        this.updateCount++;
        
        // Save and emit change
        await this.characterManager.updateCharacter(this._internalCharacterState.id, this._internalCharacterState);
        EventBus.emit('CHARACTER_CHANGED', { 
            character: this._internalCharacterState,
            description: `Redo: ${historyEntry.description}`,
            updateCount: this.updateCount,
            timestamp: Date.now()
        });
        
        Logger.info(`[StateManager] Redo completed. History index: ${this.historyIndex}`);
        return true;
    }

    // Load a specific character by ID and set as active
    static async loadCharacter(characterId) {
        if (!this.initialized) {
            Logger.error('[StateManager] loadCharacter() called before initialization');
            throw new Error('StateManager not initialized');
        }
        
        if (!characterId) {
            Logger.error('[StateManager] loadCharacter() called with null/undefined characterId');
            throw new Error('Character ID is required');
        }
        
        Logger.info(`[StateManager] Loading character: ${characterId}`);
        
        try {
            // Get character from CharacterManager
            const character = this.characterManager.getCharacter(characterId);
            if (!character) {
                Logger.error(`[StateManager] Character not found: ${characterId}`);
                throw new Error(`Character not found: ${characterId}`);
            }
            
            Logger.info(`[StateManager] Found character: ${character.name} (${characterId})`);
            
            // Set as active character in CharacterManager
            await this.characterManager.setActiveCharacter(characterId);
            
            // Update StateManager's internal state
            await this.updateState(character, `Character loaded: ${character.name}`);
            
            Logger.info(`[StateManager] Successfully loaded character: ${character.name} (${characterId})`);
            return character;
            
        } catch (error) {
            Logger.error(`[StateManager] Failed to load character ${characterId}:`, error);
            throw error;
        }
    }

    // Helper method to get character info
    static getCharacter() {
        return this.getState();
    }

    // Enhanced debug methods
    static getDebugInfo() {
        return {
            initialized: this.initialized,
            hasCharacterManager: !!this.characterManager,
            hasState: !!this._internalCharacterState,
            subscriberCount: this._subscribers.size,
            historyLength: this.history.length,
            historyIndex: this.historyIndex,
            updateCount: this.updateCount,
            currentCharacterName: this._internalCharacterState?.name || 'None',
            currentCharacterId: this._internalCharacterState?.id || 'None'
        };
    }
    
    static getStateHistory() {
        return this.history.map((entry, index) => ({
            index,
            description: entry.description,
            timestamp: entry.timestamp,
            isCurrent: index === this.historyIndex,
            characterName: entry.state.name
        }));
    }
    
    // Force state change notification (for debugging)
    static forceNotifyStateChange() {
        if (this._internalCharacterState) {
            Logger.info('[StateManager] Force notifying state change');
            EventBus.emit('CHARACTER_CHANGED', { 
                character: this._internalCharacterState,
                description: 'Force notification',
                updateCount: this.updateCount,
                timestamp: Date.now()
            });
        } else {
            Logger.warn('[StateManager] Cannot force notify - no state available');
        }
    }
}