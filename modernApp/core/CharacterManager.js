// modernApp/core/CharacterManager.js
import { Logger } from '../utils/Logger.js';
import { Storage } from '../utils/Storage.js';
import { EventBus } from './EventBus.js';
import { DataMigration } from './DataMigration.js';
import { Validators } from '../utils/Validators.js';

/**
 * CharacterManager - Manages multiple characters and character switching
 * Singleton pattern implementation
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
        
        // Storage keys
        this.STORAGE_KEYS = {
            CHARACTER_LIST: 'vitality_character_list',
            ACTIVE_CHARACTER: 'vitality_active_character',
            CHARACTER_PREFIX: 'vitality_character_'
        };
        
        Logger.info('[CharacterManager] Instance created.');
    }
    
    async init() {
        if (this.initialized) {
            Logger.warn('[CharacterManager] Already initialized.');
            return;
        }
        
        Logger.info('[CharacterManager] Initializing...');
        
        try {
            // Load character list from storage
            await this.loadCharacterList();
            
            // Load active character
            const activeId = Storage.getItem(this.STORAGE_KEYS.ACTIVE_CHARACTER);
            if (activeId && this.characters.has(activeId)) {
                await this.setActiveCharacter(activeId);
            } else if (this.characters.size === 0) {
                // No characters exist, create a default one
                Logger.info('[CharacterManager] No characters found. Creating a new default character.');
                await this.createNewCharacter('New Character');
            } else {
                // Set first character as active
                const firstId = Array.from(this.characters.keys())[0];
                await this.setActiveCharacter(firstId);
            }
            
            this.initialized = true;
            Logger.info('[CharacterManager] Initialization complete.');
            
        } catch (error) {
            Logger.error('[CharacterManager] Failed to initialize:', error);
            throw error;
        }
    }
    
    async loadCharacterList() {
        try {
            const listData = Storage.getItem(this.STORAGE_KEYS.CHARACTER_LIST);
            
            if (!listData || !Array.isArray(listData)) {
                Logger.info('[CharacterManager] No character metadata list found or list is invalid.');
                this.characters.clear();
                return;
            }
            
            Logger.info(`[CharacterManager] Loading ${listData.length} character metadata entries.`);
            
            // Load metadata for each character
            for (const metadata of listData) {
                if (metadata && metadata.id) {
                    this.characters.set(metadata.id, {
                        id: metadata.id,
                        name: metadata.name || 'Unnamed Character',
                        tier: metadata.tier || 4,
                        lastModified: metadata.lastModified || Date.now(),
                        created: metadata.created || Date.now()
                    });
                }
            }
            
            Logger.info(`[CharacterManager] Loaded ${this.characters.size} characters.`);
            
        } catch (error) {
            Logger.error('[CharacterManager] Failed to load character list:', error);
            this.characters.clear();
        }
    }
    
    saveCharacterList() {
        try {
            const listData = Array.from(this.characters.values());
            Storage.setItem(this.STORAGE_KEYS.CHARACTER_LIST, listData);
            Logger.debug('[CharacterManager] Character metadata list saved and event emitted.');
            EventBus.emit('CHARACTER_LIST_UPDATED', { characters: listData });
        } catch (error) {
            Logger.error('[CharacterManager] Failed to save character list:', error);
        }
    }
    
    async createNewCharacter(name = 'New Character', tier = 4) {
        try {
            // Generate unique ID
            const id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            Logger.info(`[CharacterManager] Creating new character: "${name}" with ID: ${id}`);
            
            // Create character metadata
            const metadata = {
                id,
                name,
                tier,
                created: Date.now(),
                lastModified: Date.now()
            };
            
            // Create character data
            const characterData = {
                id,
                name,
                tier,
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
                    available: (tier - 2) * 15,
                    spent: 0
                },
                combatAttr: {
                    available: Math.floor(tier / 2) + 4,
                    spent: 0
                },
                utilityAttr: {
                    available: 4,
                    spent: 0
                },
                created: metadata.created,
                lastModified: metadata.lastModified
            };
            
            // Save character data
            Storage.setItem(this.STORAGE_KEYS.CHARACTER_PREFIX + id, characterData);
            
            // Add to character list
            this.characters.set(id, metadata);
            this.saveCharacterList();
            
            // Set as active character
            await this.setActiveCharacter(id);
            
            Logger.info(`[CharacterManager] Character created successfully: ${id}`);
            
            EventBus.emit('CHARACTER_CREATED', { id, metadata });
            
            return id;
            
        } catch (error) {
            Logger.error('[CharacterManager] Failed to create character:', error);
            throw error;
        }
    }
    
    async setActiveCharacter(characterId) {
        if (!this.characters.has(characterId)) {
            Logger.error(`[CharacterManager] Character not found: ${characterId}`);
            return false;
        }
        
        Logger.info(`[CharacterManager] Setting active character: ${characterId}`);
        
        this.activeCharacterId = characterId;
        Storage.setItem(this.STORAGE_KEYS.ACTIVE_CHARACTER, characterId);
        
        // Update metadata
        const metadata = this.characters.get(characterId);
        Logger.info(`[CharacterManager] Active character set to: ${metadata.name} (ID: ${characterId})`);
        
        EventBus.emit('CHARACTER_SWITCHED', {
            characterId,
            metadata
        });
        
        return true;
    }
    
    getActiveCharacter() {
        if (!this.activeCharacterId) {
            return null;
        }
        
        try {
            const characterData = Storage.getItem(
                this.STORAGE_KEYS.CHARACTER_PREFIX + this.activeCharacterId
            );
            
            if (!characterData) {
                Logger.error(`[CharacterManager] Active character data not found: ${this.activeCharacterId}`);
                return null;
            }
            
            return characterData;
            
        } catch (error) {
            Logger.error('[CharacterManager] Failed to get active character:', error);
            return null;
        }
    }
    
    saveActiveCharacter(characterData) {
        if (!this.activeCharacterId) {
            Logger.error('[CharacterManager] No active character to save.');
            return false;
        }
        
        try {
            // Update last modified
            characterData.lastModified = Date.now();
            
            // Save character data
            Storage.setItem(
                this.STORAGE_KEYS.CHARACTER_PREFIX + this.activeCharacterId,
                characterData
            );
            
            // Update metadata
            const metadata = this.characters.get(this.activeCharacterId);
            if (metadata) {
                metadata.name = characterData.name || metadata.name;
                metadata.tier = characterData.tier || metadata.tier;
                metadata.lastModified = characterData.lastModified;
                this.saveCharacterList();
            }
            
            Logger.debug(`[CharacterManager] Character saved: ${this.activeCharacterId}`);
            
            EventBus.emit('CHARACTER_SAVED', {
                characterId: this.activeCharacterId,
                metadata
            });
            
            return true;
            
        } catch (error) {
            Logger.error('[CharacterManager] Failed to save character:', error);
            return false;
        }
    }
    
    async duplicateCharacter(characterId, newName = null) {
        if (!this.characters.has(characterId)) {
            Logger.error(`[CharacterManager] Cannot duplicate - character not found: ${characterId}`);
            return null;
        }
        
        try {
            // Load source character
            const sourceData = Storage.getItem(
                this.STORAGE_KEYS.CHARACTER_PREFIX + characterId
            );
            
            if (!sourceData) {
                throw new Error('Source character data not found');
            }
            
            // Generate new ID
            const newId = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Create duplicate with new ID and name
            const duplicateData = {
                ...sourceData,
                id: newId,
                name: newName || `${sourceData.name} (Copy)`,
                created: Date.now(),
                lastModified: Date.now()
            };
            
            // Save duplicate
            Storage.setItem(this.STORAGE_KEYS.CHARACTER_PREFIX + newId, duplicateData);
            
            // Add to character list
            const metadata = {
                id: newId,
                name: duplicateData.name,
                tier: duplicateData.tier,
                created: duplicateData.created,
                lastModified: duplicateData.lastModified
            };
            
            this.characters.set(newId, metadata);
            this.saveCharacterList();
            
            Logger.info(`[CharacterManager] Character duplicated: ${characterId} → ${newId}`);
            
            EventBus.emit('CHARACTER_DUPLICATED', {
                sourceId: characterId,
                newId,
                metadata
            });
            
            return newId;
            
        } catch (error) {
            Logger.error('[CharacterManager] Failed to duplicate character:', error);
            return null;
        }
    }
    
    async deleteCharacter(characterId) {
        if (!this.characters.has(characterId)) {
            Logger.error(`[CharacterManager] Cannot delete - character not found: ${characterId}`);
            return false;
        }
        
        try {
            // Remove character data
            Storage.removeItem(this.STORAGE_KEYS.CHARACTER_PREFIX + characterId);
            
            // Remove from character list
            const metadata = this.characters.get(characterId);
            this.characters.delete(characterId);
            this.saveCharacterList();
            
            Logger.info(`[CharacterManager] Character deleted: ${characterId}`);
            
            // If this was the active character, switch to another
            if (this.activeCharacterId === characterId) {
                this.activeCharacterId = null;
                
                if (this.characters.size > 0) {
                    // Switch to first available character
                    const firstId = Array.from(this.characters.keys())[0];
                    await this.setActiveCharacter(firstId);
                } else {
                    // No characters left, create a new one
                    await this.createNewCharacter();
                }
            }
            
            EventBus.emit('CHARACTER_DELETED', {
                characterId,
                metadata
            });
            
            return true;
            
        } catch (error) {
            Logger.error('[CharacterManager] Failed to delete character:', error);
            return false;
        }
    }
    
    getAllCharacters() {
        return Array.from(this.characters.values());
    }
    
    getCharacterMetadata(characterId) {
        return this.characters.get(characterId) || null;
    }
    
    exportCharacter(characterId) {
        if (!this.characters.has(characterId)) {
            Logger.error(`[CharacterManager] Cannot export - character not found: ${characterId}`);
            return null;
        }
        
        try {
            const characterData = Storage.getItem(
                this.STORAGE_KEYS.CHARACTER_PREFIX + characterId
            );
            
            if (!characterData) {
                throw new Error('Character data not found');
            }
            
            // Create export object with metadata
            const exportData = {
                version: DataMigration.CURRENT_VERSION,
                exported: Date.now(),
                character: characterData
            };
            
            Logger.info(`[CharacterManager] Character exported: ${characterId}`);
            
            return exportData;
            
        } catch (error) {
            Logger.error('[CharacterManager] Failed to export character:', error);
            return null;
        }
    }
    
    async importCharacter(exportData, overwriteId = null) {
        try {
            // Validate export data
            if (!exportData || !exportData.character) {
                throw new Error('Invalid export data format');
            }
            
            let characterData = exportData.character;
            
            // Migrate if needed
            if (exportData.version !== DataMigration.CURRENT_VERSION) {
                characterData = await DataMigration.migrate(characterData);
            }
            
            // Generate new ID or use overwrite ID
            const id = overwriteId || `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Update character data
            characterData.id = id;
            characterData.lastModified = Date.now();
            
            if (!overwriteId) {
                characterData.created = Date.now();
                characterData.name = `${characterData.name} (Imported)`;
            }
            
            // Save character
            Storage.setItem(this.STORAGE_KEYS.CHARACTER_PREFIX + id, characterData);
            
            // Update character list
            const metadata = {
                id,
                name: characterData.name,
                tier: characterData.tier || 4,
                created: characterData.created,
                lastModified: characterData.lastModified
            };
            
            this.characters.set(id, metadata);
            this.saveCharacterList();
            
            Logger.info(`[CharacterManager] Character imported: ${id}`);
            
            EventBus.emit('CHARACTER_IMPORTED', {
                characterId: id,
                metadata
            });
            
            return id;
            
        } catch (error) {
            Logger.error('[CharacterManager] Failed to import character:', error);
            throw error;
        }
    }
}