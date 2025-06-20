// CharacterLibrary.js - Character library management
import { IdGenerator } from '../utils/IdGenerator.js';

export class CharacterLibrary {
    constructor() {
        this.characters = new Map();
        this.folders = new Map();
        this.storageKey = 'vitality-character-library-v2';
        this.initialized = false;
    }
    
    async init() {
        console.log('🟡 Initializing Character Library...');
        
        try {
            await this.loadFromStorage();
            this.initialized = true;
            console.log('✅ Character Library initialized');
        } catch (error) {
            console.error('❌ Character Library initialization failed:', error);
            throw error;
        }
    }
    
    // Load characters from localStorage
    async loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                
                // Load characters
                if (data.characters) {
                    Object.entries(data.characters).forEach(([id, character]) => {
                        this.characters.set(id, character);
                    });
                }
                
                // Load folders
                if (data.folders) {
                    Object.entries(data.folders).forEach(([id, folder]) => {
                        this.folders.set(id, folder);
                    });
                }
                
                console.log(`✅ Loaded ${this.characters.size} characters and ${this.folders.size} folders`);
            }
        } catch (error) {
            console.error('❌ Failed to load character library:', error);
            // Initialize empty library on error
            this.characters.clear();
            this.folders.clear();
        }
    }
    
    // Save to localStorage
    async saveToStorage() {
        try {
            const data = {
                characters: Object.fromEntries(this.characters),
                folders: Object.fromEntries(this.folders),
                lastModified: new Date().toISOString()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            console.log(`✅ Saved library with ${this.characters.size} characters`);
        } catch (error) {
            console.error('❌ Failed to save character library:', error);
            throw error;
        }
    }
    
    // Save character to library
    saveCharacter(character) {
        if (!character || !character.id) {
            throw new Error('Invalid character: missing ID');
        }
        
        character.lastModified = new Date().toISOString();
        this.characters.set(character.id, character);
        this.saveToStorage();
        
        console.log(`✅ Saved character: ${character.name}`);
        return character;
    }
    
    // Get character by ID
    getCharacter(id) {
        return this.characters.get(id);
    }
    
    // Get all characters
    getAllCharacters() {
        return Array.from(this.characters.values());
    }
    
    // Delete character
    deleteCharacter(id) {
        const character = this.characters.get(id);
        if (character) {
            this.characters.delete(id);
            this.saveToStorage();
            console.log(`🗑️ Deleted character: ${character.name}`);
            return true;
        }
        return false;
    }
    
    // Create folder
    createFolder(name, parentId = null) {
        const folder = {
            id: IdGenerator.generateId(),
            name,
            parentId,
            created: new Date().toISOString(),
            characterIds: []
        };
        
        this.folders.set(folder.id, folder);
        this.saveToStorage();
        
        console.log(`📁 Created folder: ${name}`);
        return folder;
    }
    
    // Move character to folder
    moveCharacterToFolder(characterId, folderId) {
        const character = this.characters.get(characterId);
        if (!character) {
            throw new Error('Character not found');
        }
        
        // Remove from old folder
        if (character.folderId) {
            const oldFolder = this.folders.get(character.folderId);
            if (oldFolder) {
                oldFolder.characterIds = oldFolder.characterIds.filter(id => id !== characterId);
            }
        }
        
        // Add to new folder
        if (folderId) {
            const newFolder = this.folders.get(folderId);
            if (!newFolder) {
                throw new Error('Folder not found');
            }
            
            if (!newFolder.characterIds.includes(characterId)) {
                newFolder.characterIds.push(characterId);
            }
        }
        
        character.folderId = folderId;
        this.saveToStorage();
        
        console.log(`📁 Moved character ${character.name} to folder`);
    }
    
    // Get characters in folder
    getCharactersInFolder(folderId) {
        if (!folderId) {
            // Return characters not in any folder
            return this.getAllCharacters().filter(char => !char.folderId);
        }
        
        const folder = this.folders.get(folderId);
        if (!folder) return [];
        
        return folder.characterIds
            .map(id => this.characters.get(id))
            .filter(Boolean);
    }
    
    // Search characters
    searchCharacters(query) {
        const searchTerm = query.toLowerCase();
        return this.getAllCharacters().filter(character => {
            return character.name.toLowerCase().includes(searchTerm) ||
                   character.realName?.toLowerCase().includes(searchTerm) ||
                   character.tier.toString().includes(searchTerm);
        });
    }
    
    // Export character to JSON
    exportCharacter(id) {
        const character = this.characters.get(id);
        if (!character) {
            throw new Error('Character not found');
        }
        
        const exportData = {
            ...character,
            exportedAt: new Date().toISOString(),
            version: '2.0'
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    // Import character from JSON
    importCharacter(jsonData) {
        try {
            const character = JSON.parse(jsonData);
            
            // Validate required fields
            if (!character.name) {
                throw new Error('Character must have a name');
            }
            
            // Generate new ID to avoid conflicts
            character.id = Date.now().toString();
            character.imported = new Date().toISOString();
            
            return this.saveCharacter(character);
        } catch (error) {
            console.error('❌ Import failed:', error);
            throw new Error(`Failed to import character: ${error.message}`);
        }
    }
    
    // Get library statistics
    getStatistics() {
        const characters = this.getAllCharacters();
        const tierCounts = {};
        
        characters.forEach(char => {
            tierCounts[char.tier] = (tierCounts[char.tier] || 0) + 1;
        });
        
        return {
            totalCharacters: characters.length,
            totalFolders: this.folders.size,
            tierDistribution: tierCounts,
            lastModified: Math.max(...characters.map(c => new Date(c.lastModified || c.created).getTime()))
        };
    }
    
    // Clear all data
    clear() {
        this.characters.clear();
        this.folders.clear();
        localStorage.removeItem(this.storageKey);
        console.log('🗑️ Character library cleared');
    }
}