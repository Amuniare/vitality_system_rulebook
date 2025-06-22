// modernApp/core/CharacterManager.js
import { Logger } from '../utils/Logger.js';
import { Storage } from '../utils/Storage.js';
import { EventBus } from './EventBus.js';
import { DataMigration } from './DataMigration.js';
import { ValidationSystem } from './ValidationSystem.js';
import { SchemaSystem } from './SchemaSystem.js';

/**
 * Enhanced CharacterManager with validation, change detection, and migration support
 * Manages multiple characters with complete data integrity
 */
export class CharacterManager {
    static instance = null;
    
    static getInstance() {
        if (!CharacterManager.instance) {
            CharacterManager.instance = new CharacterManager();
        }
        return CharacterManager.instance;
    }
    
    constructor() {
        if (CharacterManager.instance) {
            return CharacterManager.instance;
        }
        
        this.characters = new Map();
        this.activeCharacterId = null;
        this.initialized = false;
        this.lastSaveState = new Map(); // For change detection
        this.validationEnabled = true;
        this.migrationLog = [];
        
        // Storage keys
        this.STORAGE_KEYS = {
            CHARACTER_LIST: 'vitality_character_list',
            ACTIVE_CHARACTER: 'vitality_active_character',
            CHARACTER_PREFIX: 'vitality_character_',
            MIGRATION_LOG: 'vitality_migration_log'
        };
        
        // Character schema for validation
        this.characterSchema = {
            id: { type: 'string', required: true },
            name: { type: 'string', required: true, default: 'New Character' },
            tier: { type: 'number', required: true, default: 4, min: 1, max: 10 },
            schemaVersion: { type: 'number', required: true, default: DataMigration.CURRENT_VERSION },
            characterType: { type: 'string', default: 'standard' },
            archetypes: { type: 'object', default: () => ({}) },
            combatAttributes: { type: 'object', default: () => ({}) },
            utilityAttributes: { type: 'object', default: () => ({}) },
            traits: { type: 'array', default: () => [] },
            flaws: { type: 'array', default: () => [] },
            boons: { type: 'array', default: () => [] },
            features: { type: 'array', default: () => [] },
            action_upgrades: { type: 'array', default: () => [] },
            unique_abilities: { type: 'array', default: () => [] },
            special_attacks: { type: 'array', default: () => [] },
            custom_abilities: { type: 'array', default: () => [] },
            talents: { type: 'object', default: () => ({}) },
            notes: { type: 'string', default: '' },
            createdAt: { type: 'number', required: true },
            updatedAt: { type: 'number', required: true }
        };
        
        Logger.info('[CharacterManager] Enhanced instance created with validation and migration support.');
    }
    
    async init() {
        if (this.initialized) {
            Logger.warn('[CharacterManager] Already initialized.');
            return;
        }
        
        Logger.info('[CharacterManager] Initializing with enhanced features...');
        
        try {
            // Load migration log
            await this.loadMigrationLog();
            
            // Load character list with validation and migration
            await this.loadCharacterListWithMigration();
            
            // Load active character
            const activeId = Storage.getItem(this.STORAGE_KEYS.ACTIVE_CHARACTER);
            if (activeId && this.characters.has(activeId)) {
                await this.setActiveCharacter(activeId);
            } else if (this.characters.size === 0) {
                Logger.info('[CharacterManager] No characters found. Creating a new default character.');
                await this.createNewCharacter('New Character');
            } else {
                const firstId = Array.from(this.characters.keys())[0];
                await this.setActiveCharacter(firstId);
            }
            
            this.initialized = true;
            Logger.info('[CharacterManager] Enhanced initialization complete.');
            
        } catch (error) {
            Logger.error('[CharacterManager] Enhanced initialization failed:', error);
            throw error;
        }
    }

    // MISSING METHOD - Get all characters as metadata array
    getAllCharacters() {
        const charactersArray = Array.from(this.characters.values()).map(char => ({
            id: char.id,
            name: char.name,
            tier: char.tier,
            characterType: char.characterType,
            createdAt: char.createdAt,
            updatedAt: char.updatedAt
        }));
        
        Logger.debug(`[CharacterManager] getAllCharacters() returning ${charactersArray.length} characters`);
        return charactersArray;
    }

    // MISSING METHOD - Create new character
    async createNewCharacter(name = 'New Character') {
        const characterId = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newCharacter = {
            ...this.createDefaultCharacter(),
            id: characterId,
            name: name
        };
        
        this.characters.set(characterId, newCharacter);
        await this.saveCharacter(newCharacter);
        await this.setActiveCharacter(characterId);
        await this.updateCharacterList();
        
        Logger.info(`[CharacterManager] Created new character: ${name} (${characterId})`);
        return newCharacter;
    }

    // MISSING METHOD - Delete character
    async deleteCharacter(characterId) {
        if (!this.characters.has(characterId)) {
            Logger.warn(`[CharacterManager] Cannot delete character ${characterId}: not found`);
            return false;
        }
        
        const character = this.characters.get(characterId);
        
        // Remove from storage
        Storage.removeItem(`${this.STORAGE_KEYS.CHARACTER_PREFIX}${characterId}`);
        
        // Remove from memory
        this.characters.delete(characterId);
        this.lastSaveState.delete(characterId);
        
        // If this was the active character, switch to another one
        if (this.activeCharacterId === characterId) {
            if (this.characters.size > 0) {
                const firstId = Array.from(this.characters.keys())[0];
                await this.setActiveCharacter(firstId);
            } else {
                // No characters left, create a default one
                await this.createNewCharacter('New Character');
            }
        }
        
        await this.updateCharacterList();
        Logger.info(`[CharacterManager] Deleted character: ${character.name} (${characterId})`);
        return true;
    }

    // MISSING METHOD - Import character
    async importCharacter(characterData) {
        try {
            // Ensure the character has a unique ID
            let importedCharacter = await this.ensureCompleteCharacter(characterData);
            
            // Generate new ID if one already exists
            if (this.characters.has(importedCharacter.id)) {
                const originalId = importedCharacter.id;
                importedCharacter.id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                Logger.info(`[CharacterManager] Character ID collision. Changed ${originalId} to ${importedCharacter.id}`);
            }
            
            // Update timestamps
            importedCharacter.updatedAt = Date.now();
            if (!importedCharacter.createdAt) {
                importedCharacter.createdAt = Date.now();
            }
            
            this.characters.set(importedCharacter.id, importedCharacter);
            await this.saveCharacter(importedCharacter);
            await this.setActiveCharacter(importedCharacter.id);
            await this.updateCharacterList();
            
            Logger.info(`[CharacterManager] Imported character: ${importedCharacter.name} (${importedCharacter.id})`);
            return importedCharacter;
            
        } catch (error) {
            Logger.error('[CharacterManager] Failed to import character:', error);
            throw new Error(`Import failed: ${error.message}`);
        }
    }

    // MISSING METHOD - Save character to storage
    async saveCharacter(character) {
        try {
            const characterToSave = await this.ensureCompleteCharacter(character);
            characterToSave.updatedAt = Date.now();
            
            Storage.setItem(`${this.STORAGE_KEYS.CHARACTER_PREFIX}${characterToSave.id}`, characterToSave);
            this.characters.set(characterToSave.id, characterToSave);
            this.lastSaveState.set(characterToSave.id, this.createStateSnapshot(characterToSave));
            
            Logger.debug(`[CharacterManager] Saved character: ${characterToSave.name} (${characterToSave.id})`);
            
        } catch (error) {
            Logger.error(`[CharacterManager] Failed to save character ${character.id}:`, error);
            throw error;
        }
    }

    // MISSING METHOD - Save active character
    async saveActiveCharacter(characterData) {
        if (this.activeCharacterId && characterData) {
            await this.saveCharacter(characterData);
        }
    }

    // Enhanced initialization methods
    async loadMigrationLog() {
        try {
            this.migrationLog = Storage.getItem(this.STORAGE_KEYS.MIGRATION_LOG) || [];
            Logger.debug(`[CharacterManager] Loaded migration log with ${this.migrationLog.length} entries`);
        } catch (error) {
            Logger.error('[CharacterManager] Failed to load migration log:', error);
            this.migrationLog = [];
        }
    }

    async loadCharacterListWithMigration() {
        try {
            const characterList = Storage.getItem(this.STORAGE_KEYS.CHARACTER_LIST) || [];
            Logger.info(`[CharacterManager] Loading ${characterList.length} characters with validation and migration...`);
            
            for (const characterSummary of characterList) {
                try {
                    // Load full character data
                    const rawCharacterData = Storage.getItem(`${this.STORAGE_KEYS.CHARACTER_PREFIX}${characterSummary.id}`);
                    
                    if (rawCharacterData) {
                        // Ensure complete character object with migration support
                        const completeCharacter = await this.ensureCompleteCharacter(rawCharacterData);
                        
                        // Validate before storing
                        if (this.validationEnabled) {
                            const validationResult = await this.validateCharacter(completeCharacter);
                            if (!validationResult.isValid) {
                                Logger.warn(`[CharacterManager] Character ${completeCharacter.id} has validation issues:`, validationResult.errors);
                                // Fix validation issues automatically where possible
                                const fixedCharacter = this.fixValidationIssues(completeCharacter, validationResult);
                                this.characters.set(fixedCharacter.id, fixedCharacter);
                            } else {
                                this.characters.set(completeCharacter.id, completeCharacter);
                            }
                        } else {
                            this.characters.set(completeCharacter.id, completeCharacter);
                        }
                        
                        // Store clean state for change detection
                        this.lastSaveState.set(completeCharacter.id, this.createStateSnapshot(completeCharacter));
                        
                        Logger.debug(`[CharacterManager] Loaded and validated character: ${completeCharacter.name} (${completeCharacter.id})`);
                    } else {
                        Logger.warn(`[CharacterManager] Character data not found for ID: ${characterSummary.id}`);
                    }
                } catch (error) {
                    Logger.error(`[CharacterManager] Failed to load character ${characterSummary.id}:`, error);
                }
            }
            
            Logger.info(`[CharacterManager] Successfully loaded ${this.characters.size} characters.`);
        } catch (error) {
            Logger.error('[CharacterManager] Failed to load character list:', error);
            throw error;
        }
    }

    // Ensure complete character object with all required fields
    async ensureCompleteCharacter(characterData) {
        try {
            // Start with a complete default character
            let completeCharacter = this.createDefaultCharacter();
            
            // Apply migration if needed
            const migratedData = await DataMigration.migrate(characterData);
            if (!migratedData) {
                Logger.warn('[CharacterManager] Migration failed, using provided data as-is');
                completeCharacter = { ...completeCharacter, ...characterData };
            } else {
                completeCharacter = { ...completeCharacter, ...migratedData };
            }
            
            // Ensure all required fields exist with proper defaults
            for (const [field, schema] of Object.entries(this.characterSchema)) {
                if (completeCharacter[field] === undefined || completeCharacter[field] === null) {
                    if (schema.default !== undefined) {
                        completeCharacter[field] = typeof schema.default === 'function' 
                            ? schema.default() 
                            : schema.default;
                    }
                }
            }
            
            Logger.debug(`[CharacterManager] Ensured complete character object for: ${completeCharacter.name}`);
            return completeCharacter;
            
        } catch (error) {
            Logger.error('[CharacterManager] Failed to ensure complete character:', error);
            throw error;
        }
    }

    createDefaultCharacter() {
        return {
            id: 'default_' + Date.now(),
            name: 'New Character',
            tier: 4,
            schemaVersion: DataMigration.CURRENT_VERSION,
            characterType: 'standard',
            archetypes: {},
            combatAttributes: {
                power: 0,
                endurance: 0,
                mobility: 0,
                focus: 0
            },
            utilityAttributes: {
                awareness: 0,
                communication: 0,
                intelligence: 0
            },
            traits: [],
            flaws: [],
            boons: [],
            features: [],
            action_upgrades: [],
            unique_abilities: [],
            special_attacks: [],
            custom_abilities: [],
            talents: {},
            notes: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    // Enhanced getter that always returns complete character objects
    getActiveCharacter() {
        if (!this.activeCharacterId || !this.characters.has(this.activeCharacterId)) {
            Logger.warn('[CharacterManager] No active character or character not found');
            return null;
        }
        
        const character = this.characters.get(this.activeCharacterId);
        
        // Ensure the returned character is complete
        try {
            const completeCharacter = this.createCompleteCharacter(character);
            
            // Update in-memory version if it was incomplete
            if (!this.deepEqual(character, completeCharacter)) {
                Logger.debug('[CharacterManager] Updated incomplete character in memory');
                this.characters.set(this.activeCharacterId, completeCharacter);
            }
            
            return completeCharacter;
        } catch (error) {
            Logger.error('[CharacterManager] Failed to ensure complete character:', error);
            return character; // Return original if completion fails
        }
    }

    createCompleteCharacter(character) {
        const complete = this.createDefaultCharacter();
        return { ...complete, ...character };
    }

    // Validation methods
    async validateCharacter(character) {
        const errors = [];
        const warnings = [];
        
        // Type validation
        for (const [field, schema] of Object.entries(this.characterSchema)) {
            const value = character[field];
            
            if (schema.required && (value === undefined || value === null)) {
                errors.push(`Required field '${field}' is missing`);
            }
            
            if (value !== undefined && value !== null) {
                if (schema.type === 'string' && typeof value !== 'string') {
                    errors.push(`Field '${field}' should be of type 'string', got '${typeof value}'`);
                }
                if (schema.type === 'number' && typeof value !== 'number') {
                    errors.push(`Field '${field}' should be of type 'number', got '${typeof value}'`);
                }
                if (schema.type === 'array' && !Array.isArray(value)) {
                    errors.push(`Field '${field}' should be an array, got '${typeof value}'`);
                }
                if (schema.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
                    errors.push(`Field '${field}' should be an object, got '${typeof value}'`);
                }
            }
        }
        
        Logger.debug(`[CharacterManager] Character validation completed:`, { isValid: errors.length === 0, errors, warnings });
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    fixValidationIssues(character, validationResult) {
        const fixed = { ...character };
        
        for (const error of validationResult.errors) {
            // Auto-fix type mismatches
            if (error.includes("should be of type 'number'")) {
                const field = error.match(/'(\w+)'/)[1];
                if (typeof fixed[field] === 'string' && !isNaN(fixed[field])) {
                    fixed[field] = Number(fixed[field]);
                    Logger.debug(`[CharacterManager] Auto-fixed type mismatch for field: ${field}`);
                }
            }
        }
        
        return fixed;
    }

    // Utility methods
    createStateSnapshot(character) {
        return JSON.parse(JSON.stringify(character));
    }

    detectChanges(character) {
        const lastState = this.lastSaveState.get(character.id);
        if (!lastState) return true;
        
        return !this.deepEqual(character, lastState);
    }

    deepEqual(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    // Existing methods (updated to work with enhanced features)
    async setActiveCharacter(characterId) {
        if (!this.characters.has(characterId)) {
            throw new Error(`Character not found: ${characterId}`);
        }
        
        // Save current character if there are changes
        if (this.activeCharacterId && this.characters.has(this.activeCharacterId)) {
            const currentCharacter = this.characters.get(this.activeCharacterId);
            if (this.detectChanges(currentCharacter)) {
                await this.saveActiveCharacter(currentCharacter);
            }
        }
        
        this.activeCharacterId = characterId;
        Storage.setItem(this.STORAGE_KEYS.ACTIVE_CHARACTER, characterId);
        
        const character = this.getActiveCharacter(); // This ensures completeness
        EventBus.emit('CHARACTER_SWITCHED', { character });
        
        Logger.info(`[CharacterManager] Set active character: ${character.name} (${characterId})`);
    }

    async updateCharacterList() {
        try {
            const characterList = Array.from(this.characters.values()).map(char => ({
                id: char.id,
                name: char.name,
                tier: char.tier,
                characterType: char.characterType,
                createdAt: char.createdAt,
                updatedAt: char.updatedAt
            }));
            
            Storage.setItem(this.STORAGE_KEYS.CHARACTER_LIST, characterList);
            EventBus.emit('CHARACTER_LIST_UPDATED', { characters: characterList });
            
            Logger.debug('[CharacterManager] Character list updated');
        } catch (error) {
            Logger.error('[CharacterManager] Failed to update character list:', error);
        }
    }

    // Debug and utility methods
    getCharacterStats() {
        return {
            totalCharacters: this.characters.size,
            activeCharacterId: this.activeCharacterId,
            initialized: this.initialized,
            validationEnabled: this.validationEnabled
        };
    }

    setValidationEnabled(enabled) {
        this.validationEnabled = enabled;
        Logger.info(`[CharacterManager] Validation ${enabled ? 'enabled' : 'disabled'}`);
    }

    cleanup() {
        try {
            // Save any pending changes
            if (this.activeCharacterId && this.characters.has(this.activeCharacterId)) {
                const currentCharacter = this.characters.get(this.activeCharacterId);
                if (this.detectChanges(currentCharacter)) {
                    this.saveActiveCharacter(currentCharacter);
                }
            }
            
            this.characters.clear();
            this.lastSaveState.clear();
            this.activeCharacterId = null;
            this.initialized = false;
            
            Logger.info('[CharacterManager] Cleanup completed.');
        } catch (error) {
            Logger.error('[CharacterManager] Error during cleanup:', error);
        }
    }
}