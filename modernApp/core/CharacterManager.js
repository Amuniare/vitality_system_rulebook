// modernApp/core/CharacterManager.js
import { Logger } from '../utils/Logger.js';
import { Storage } from '../utils/Storage.js';
import { EventBus } from './EventBus.js';
import { StateManager } from './StateManager.js';
import { DataMigration } from './DataMigration.js';
import { SchemaSystem } from './SchemaSystem.js';

const CHARACTER_LIST_KEY = 'characterList';
const LAST_ACTIVE_CHAR_ID_KEY = 'lastActiveCharacterId';
// CHARACTER_PREFIX is not strictly needed here if IDs are self-contained

export class CharacterManager {
    constructor() {
        this.storage = new Storage('vitality-char-manager-');
        this.characterStorage = new Storage('vitality-character-'); // For individual char data
        
        this.characters = new Map(); // Stores { id: {id, name, lastModified, tier} } metadata
        this.activeCharacterId = null;
        // _loadCharacterList is called by init now
        Logger.info('[CharacterManager] Instance created.');
    }

    async init() { // Made async for potential future async operations
        Logger.info('[CharacterManager] Initializing...');
        this._loadCharacterList();

        let charIdToLoad = this.storage.getItem(LAST_ACTIVE_CHAR_ID_KEY);

        if (!charIdToLoad || !this.characters.has(charIdToLoad)) {
            if (this.characters.size > 0) {
                // Get the most recently modified character
                charIdToLoad = this.getAllCharactersMetadata()[0].id; 
                Logger.info(`[CharacterManager] No valid last active ID, loading most recent: ${charIdToLoad}`);
            } else {
                Logger.info('[CharacterManager] No characters found. Creating a new default character.');
                const newChar = this.createCharacter('New Character'); // This calls setActiveCharacter
                if (newChar) {
                    // setActiveCharacter already handles StateManager.loadCharacter,
                    // sets this.activeCharacterId, and saves LAST_ACTIVE_CHAR_ID_KEY.
                    // It also emits 'active-character-changed'.
                } else {
                    Logger.error('[CharacterManager] CRITICAL: Failed to create initial default character.');
                    // Fallback: Load a very basic structure into StateManager to prevent total app failure
                    const fallbackChar = { 
                        id: 'fallback_char_error', name: 'Fallback Character (Error)', tier: 1, 
                        schemaVersion: DataMigration.CURRENT_VERSION, archetypes: {}, flaws: [], traits: [], 
                        attributes: {}, pools: {} 
                    };
                    StateManager.loadCharacter(fallbackChar);
                    // Not emitting active-character-changed for fallback to avoid confusion.
                }
                return; // Exit as createCharacter pathway handles the StateManager loading
            }
        }
        
        // If we have a charIdToLoad (either from storage or by picking most recent)
        Logger.info(`[CharacterManager] Attempting to set active character to: ${charIdToLoad}`);
        this.setActiveCharacter(charIdToLoad); // This will load data into StateManager
    }

    _loadCharacterList() {
        const list = this.storage.getItem(CHARACTER_LIST_KEY);
        if (list && Array.isArray(list)) {
            this.characters.clear(); // Clear before loading to avoid duplicates if init is called multiple times
            list.forEach(charMeta => this.characters.set(charMeta.id, charMeta));
            Logger.info(`[CharacterManager] Loaded ${this.characters.size} characters from metadata list.`);
        } else {
            Logger.info('[CharacterManager] No character metadata list found or list is invalid.');
        }
    }

    _saveCharacterList() {
        this.storage.setItem(CHARACTER_LIST_KEY, Array.from(this.characters.values()));
        EventBus.emit('character-list-updated', this.getAllCharactersMetadata());
        Logger.debug('[CharacterManager] Character metadata list saved and event emitted.');
    }

    _generateNewCharacterId() { // Renamed to be private-like
        return `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    createCharacter(name = 'New Character', template = null) {
        const id = this._generateNewCharacterId();
        Logger.info(`[CharacterManager] Creating new character: "${name}" with ID: ${id}`);
        
        let newCharData;
        if (template) {
            newCharData = JSON.parse(JSON.stringify(template));
            newCharData.id = id;
            newCharData.name = name;
            newCharData.schemaVersion = DataMigration.CURRENT_VERSION;
            newCharData.lastModified = Date.now();
        } else {
            const validationResult = SchemaSystem.validate('character', {
                id: id, name: name, schemaVersion: DataMigration.CURRENT_VERSION, lastModified: Date.now()
            });
            newCharData = validationResult.data;
            // Ensure tier is present, as it's used in metadata
            newCharData.tier = newCharData.tier || 1; 
        }

        this.characterStorage.setItem(id, newCharData); // Save full character data
        this.characters.set(id, { 
            id: newCharData.id, name: newCharData.name, 
            tier: newCharData.tier, lastModified: newCharData.lastModified 
        });
        this._saveCharacterList();
        
        this.setActiveCharacter(id); // Set as active, which also loads into StateManager
        return newCharData;
    }

    setActiveCharacter(id) {
        const currentSmCharacter = StateManager.getCharacter();
        if (id === this.activeCharacterId && currentSmCharacter && currentSmCharacter.id === id) {
            Logger.debug(`[CharacterManager] Character ${id} (${currentSmCharacter.name}) is already active. Skipping reload.`);
            return true;
        }

        if (!this.characters.has(id)) {
            Logger.error(`[CharacterManager] setActiveCharacter: Character with ID "${id}" not found in metadata list.`);
            return false;
        }

        const characterData = this.getCharacterData(id); // This method handles migration

        if (characterData) {
            StateManager.loadCharacter(characterData); // This will emit 'character-updated'
            this.activeCharacterId = id;
            this.storage.setItem(LAST_ACTIVE_CHAR_ID_KEY, this.activeCharacterId);
            EventBus.emit('active-character-changed', this.activeCharacterId);
            Logger.info(`[CharacterManager] Active character set to: ${characterData.name} (ID: ${id})`);
            return true;
        }
        
        Logger.error(`[CharacterManager] setActiveCharacter: Failed to load full character data for ID "${id}".`);
        return false;
    }
    
    getActiveCharacterId() {
        return this.activeCharacterId;
    }

    saveCurrentCharacter() {
        const characterData = StateManager.getCharacter();
        if (!characterData || !characterData.id) {
            Logger.error('[CharacterManager] Cannot save: No valid character in StateManager.');
            return false;
        }
        return this.saveCharacter(characterData);
    }
    
    saveCharacter(characterData) { // Can be used to save any character, not just active
        if (!characterData || !characterData.id) {
            Logger.error('[CharacterManager] Cannot save character: Data or ID is missing.');
            return false;
        }
        characterData.lastModified = Date.now();
        
        this.characterStorage.setItem(characterData.id, characterData);
        this.characters.set(characterData.id, {
            id: characterData.id, name: characterData.name,
            tier: characterData.tier || 1, lastModified: characterData.lastModified
        });
        this._saveCharacterList();
        Logger.info(`[CharacterManager] Character "${characterData.name}" (ID: ${characterData.id}) saved to storage.`);
        
        // If this saved character IS the active one, StateManager is already up-to-date.
        // If saving a non-active character, StateManager remains untouched.
        return true;
    }
    
    getCharacterData(id) {
        if (!this.characters.has(id)) {
            Logger.warn(`[CharacterManager] getCharacterData: Character with ID "${id}" not found in metadata list.`);
            return null;
        }
        const charData = this.characterStorage.getItem(id);
        if (!charData) {
             Logger.warn(`[CharacterManager] getCharacterData: Data for ID "${id}" not found in storage, but was in list. Cleaning up metadata.`);
             this.characters.delete(id);
             this._saveCharacterList();
             return null;
        }
        return DataMigration.migrate(charData); // Ensure data is up-to-date
    }

    deleteCharacter(id) {
        if (!this.characters.has(id)) {
            Logger.warn(`[CharacterManager] Cannot delete: Character with ID "${id}" not found.`);
            return false;
        }
        const characterName = this.characters.get(id)?.name || id;
        this.characterStorage.removeItem(id);
        this.characters.delete(id);
        this._saveCharacterList();
        Logger.info(`[CharacterManager] Character "${characterName}" (ID: ${id}) deleted.`);

        if (this.activeCharacterId === id) {
            this.activeCharacterId = null; // Clear current active
            this.storage.removeItem(LAST_ACTIVE_CHAR_ID_KEY); // Remove persistent last active
            
            const charList = this.getAllCharactersMetadata();
            if (charList.length > 0) {
                this.setActiveCharacter(charList[0].id); // Load most recent as new active
            } else {
                // No characters left, create a new one
                this.createCharacter('New Character'); 
            }
        }
        return true;
    }

    getAllCharactersMetadata() {
        return Array.from(this.characters.values()).sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0));
    }

    // --- Stubs for future implementation (remain mostly same) ---
    exportCharacter(id, format = 'json') {
        // ... (implementation as before)
        const character = this.getCharacterData(id);
        if (!character) {
            Logger.error(`[CharacterManager] Cannot export. Character ID "${id}" not found.`);
            return null;
        }
        if (format === 'json') {
            Logger.info(`[CharacterManager] Exporting character ID "${id}" as JSON.`);
            return JSON.stringify(character, null, 2);
        }
        Logger.warn(`[CharacterManager] Export format "${format}" not supported yet.`);
        return null;
    }

    importCharacter(jsonData, format = 'json') {
        // ... (implementation as before, but createCharacter now calls setActiveCharacter)
        try {
            const data = JSON.parse(jsonData);
            if (!data.id || !data.name) {
                throw new Error('Imported data missing ID or name.');
            }
            
            let importedId = data.id;
            if (this.characters.has(data.id)) {
                 importedId = this._generateNewCharacterId();
                 Logger.warn(`[CharacterManager] Imported character ID ${data.id} conflicted. Assigned new ID: ${importedId}`);
                 data.id = importedId; // Update data object with new ID
            }
            
            const migratedData = DataMigration.migrate(data);
            migratedData.lastModified = Date.now();
            
            // Save and set active
            // This is a slight change: createCharacter will handle saving to storage, list, and setting active.
            // Or, we can have a more direct save method that doesn't assume "new".
            // Let's refine: saveCharacter should just save. setActiveCharacter should load into state.
            
            this.characterStorage.setItem(migratedData.id, migratedData);
            this.characters.set(migratedData.id, { 
                id: migratedData.id, name: migratedData.name, 
                tier: migratedData.tier || 1, lastModified: migratedData.lastModified 
            });
            this._saveCharacterList();
            this.setActiveCharacter(migratedData.id); // This will load it into StateManager

            Logger.info(`[CharacterManager] Character "${migratedData.name}" imported successfully with ID: ${migratedData.id}.`);
            return migratedData;
        } catch (error) {
            Logger.error('[CharacterManager] Failed to import character:', error);
            return null;
        }
    }
    
    // organize and search remain stubs
    organize(characterId, folderId) { Logger.warn('[CharacterManager] organize() not implemented.'); }
    search(query) { Logger.warn('[CharacterManager] search() not implemented.'); return []; }
}