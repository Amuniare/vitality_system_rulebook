
// modernApp/core/CharacterManager.js
import { Logger } from '../utils/Logger.js';
import { Storage } from '../utils/Storage.js';
import { EventBus } from './EventBus.js';
import { StateManager } from './StateManager.js'; // To set active character
import { DataMigration } from './DataMigration.js';
import { SchemaSystem } from './SchemaSystem.js';

const CHARACTER_LIST_KEY = 'characterList';
const CHARACTER_PREFIX = 'char_'; // Prefix for individual character storage keys

export class CharacterManager {
    constructor() {
        this.storage = new Storage('vitality-char-manager-'); // Specific prefix for manager's own data
        this.characterStorage = new Storage('vitality-character-'); // Prefix for individual characters (matches StateManager)
        
        this.characters = new Map(); // Stores { id: {id, name, lastModified} }
        this.activeCharacterId = null;
        this._loadCharacterList();
        Logger.info('[CharacterManager] Initialized.');
    }

    _loadCharacterList() {
        const list = this.storage.getItem(CHARACTER_LIST_KEY);
        if (list && Array.isArray(list)) {
            list.forEach(charMeta => this.characters.set(charMeta.id, charMeta));
            Logger.info(`[CharacterManager] Loaded ${this.characters.size} characters from list.`);
        } else {
            Logger.info('[CharacterManager] No character list found or list is invalid.');
        }
    }

    _saveCharacterList() {
        this.storage.setItem(CHARACTER_LIST_KEY, Array.from(this.characters.values()));
        EventBus.emit('character-list-updated', this.getAllCharactersMetadata());
        Logger.debug('[CharacterManager] Character list saved and event emitted.');
    }

    generateNewCharacterId() {
        return `${CHARACTER_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    createCharacter(name = 'New Character', template = null) {
        const id = this.generateNewCharacterId();
        Logger.info(`[CharacterManager] Creating new character: "${name}" with ID: ${id}`);
        
        let newCharData;
        if (template) {
            newCharData = JSON.parse(JSON.stringify(template)); // Deep copy template
            newCharData.id = id;
            newCharData.name = name;
            newCharData.schemaVersion = DataMigration.CURRENT_VERSION; // Ensure current version
            newCharData.lastModified = Date.now();
        } else {
            // Create a fresh character using SchemaSystem defaults
            const validationResult = SchemaSystem.validate('character', {
                id: id,
                name: name,
                schemaVersion: DataMigration.CURRENT_VERSION,
                lastModified: Date.now()
                // Other fields will get defaults from SchemaSystem
            });
            newCharData = validationResult.data;
        }

        this.characters.set(id, { 
            id: newCharData.id, 
            name: newCharData.name, 
            tier: newCharData.tier || 1, // Ensure tier is present in metadata
            lastModified: newCharData.lastModified 
        });
        this.characterStorage.setItem(id, newCharData); // Save full character data
        this._saveCharacterList();
        
        this.setActiveCharacter(id); // Automatically set the new character as active
        return newCharData;
    }

    setActiveCharacter(id) {
        if (!this.characters.has(id)) {
            Logger.error(`[CharacterManager] Character with ID "${id}" not found.`);
            return false;
        }
        const characterData = this.characterStorage.getItem(id);
        if (characterData) {
            this.activeCharacterId = id;
            // StateManager should be re-initialized or have a method to load a character
            // For now, we'll assume StateManager.init() can be called or it handles this.
            // This is a simplification; a more robust app might have StateManager.loadCharacter(data).
            StateManager._character = DataMigration.migrate(characterData); // Directly set for now, ideally through a StateManager method
            StateManager._isInitialized = true; // Ensure it's marked as initialized
            EventBus.emit('active-character-changed', id);
            EventBus.emit('character-updated', StateManager.getCharacter()); // Notify app of new char data
            Logger.info(`[CharacterManager] Active character set to: ${id}`);
            return true;
        }
        Logger.error(`[CharacterManager] Failed to load character data for ID "${id}".`);
        return false;
    }
    
    getActiveCharacterId() {
        return this.activeCharacterId;
    }

    saveCharacter(characterData) {
        if (!characterData || !characterData.id) {
            Logger.error('[CharacterManager] Cannot save character: ID is missing.');
            return false;
        }
        characterData.lastModified = Date.now();
        
        this.characterStorage.setItem(characterData.id, characterData);
        this.characters.set(characterData.id, {
            id: characterData.id,
            name: characterData.name,
            tier: characterData.tier || 1,
            lastModified: characterData.lastModified
        });
        this._saveCharacterList();
        Logger.info(`[CharacterManager] Character "${characterData.name}" (ID: ${characterData.id}) saved.`);
        
        // If this is the active character, ensure StateManager is also updated
        if (this.activeCharacterId === characterData.id) {
             StateManager._character = characterData; // Or a safer update method
             EventBus.emit('character-updated', StateManager.getCharacter());
        }
        return true;
    }
    
    getCharacterData(id) {
        if (!this.characters.has(id)) {
            Logger.warn(`[CharacterManager] Character with ID "${id}" not found in metadata list.`);
            return null;
        }
        const charData = this.characterStorage.getItem(id);
        if (!charData) {
             Logger.warn(`[CharacterManager] Character data for ID "${id}" not found in storage, but was in list. Cleaning up.`);
             this.characters.delete(id);
             this._saveCharacterList();
             return null;
        }
        return DataMigration.migrate(charData);
    }

    deleteCharacter(id) {
        if (!this.characters.has(id)) {
            Logger.warn(`[CharacterManager] Cannot delete: Character with ID "${id}" not found.`);
            return false;
        }
        this.characterStorage.removeItem(id);
        this.characters.delete(id);
        this._saveCharacterList();
        Logger.info(`[CharacterManager] Character with ID "${id}" deleted.`);

        if (this.activeCharacterId === id) {
            this.activeCharacterId = null;
            // Potentially load another character or clear StateManager
            const charList = this.getAllCharactersMetadata();
            if (charList.length > 0) {
                this.setActiveCharacter(charList[0].id); // Load first available
            } else {
                StateManager._character = null; // Or create new
                StateManager._isInitialized = false; // Force re-init or clear
                EventBus.emit('active-character-cleared');
                EventBus.emit('character-updated', null);
            }
        }
        return true;
    }

    getAllCharactersMetadata() {
        return Array.from(this.characters.values()).sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
    }

    // --- Stubs for future implementation ---
    exportCharacter(id, format = 'json') {
        const character = this.getCharacterData(id);
        if (!character) {
            Logger.error(`[CharacterManager] Cannot export. Character ID "${id}" not found.`);
            return null;
        }
        if (format === 'json') {
            Logger.info(`[CharacterManager] Exporting character ID "${id}" as JSON.`);
            return JSON.stringify(character, null, 2);
        }
        // Add other formats like Roll20 later
        Logger.warn(`[CharacterManager] Export format "${format}" not supported yet.`);
        return null;
    }

    importCharacter(jsonData, format = 'json') {
        try {
            const data = JSON.parse(jsonData);
            // Basic validation, could be more thorough
            if (!data.id || !data.name) {
                throw new Error('Imported data missing ID or name.');
            }
            // Ensure it's not a duplicate ID from current manager perspective
            if (this.characters.has(data.id)) {
                 data.id = this.generateNewCharacterId(); // Assign new ID if duplicate
                 Logger.warn(`[CharacterManager] Imported character had duplicate ID. Assigned new ID: ${data.id}`);
            }
            
            const migratedData = DataMigration.migrate(data);
            migratedData.lastModified = Date.now(); // Update timestamp
            
            this.saveCharacter(migratedData); // This will add to list and save to storage
            this.setActiveCharacter(migratedData.id);
            Logger.info(`[CharacterManager] Character "${migratedData.name}" imported successfully with ID: ${migratedData.id}.`);
            return migratedData;
        } catch (error) {
            Logger.error('[CharacterManager] Failed to import character:', error);
            return null;
        }
    }

    organize(characterId, folderId) {
        Logger.warn('[CharacterManager] organize() not implemented yet.');
        // TODO: Implement folder logic
    }

    search(query) {
        Logger.warn('[CharacterManager] search() not implemented yet.');
        // TODO: Implement search logic across character metadata
        return this.getAllCharactersMetadata();
    }
}
