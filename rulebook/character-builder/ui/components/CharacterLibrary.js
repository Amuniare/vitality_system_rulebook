// CharacterLibrary.js - Core character library management
export class CharacterLibrary {
    constructor() {
        this.characters = new Map();
        this.folders = new Map();
        this.libraryIndex = null;
        this.isInitialized = false;
    }

    async init() {
        console.log('Initializing Character Library...');
        
        try {
            await this.loadLibraryIndex();
            await this.initializeFolders();
            this.isInitialized = true;
            console.log('✅ Character Library initialized');
        } catch (error) {
            console.error('❌ Character Library initialization failed:', error);
            this.createDefaultStructure();
        }
    }

    async loadLibraryIndex() {
        // For now, we'll use localStorage for the index until API is ready
        const saved = localStorage.getItem('vitality-character-library-v2');
        if (saved) {
            this.libraryIndex = JSON.parse(saved);
        } else {
            this.libraryIndex = this.createDefaultIndex();
        }
    }

    createDefaultIndex() {
        return {
            version: "2.0",
            lastUpdated: new Date().toISOString(),
            folders: {
                "web_exports": { 
                    name: "Web Created", 
                    count: 0,
                    description: "Characters created in the web builder"
                },
                "roll20_imports": { 
                    name: "From Roll20", 
                    count: 0,
                    description: "Characters imported from Roll20"
                },
                "templates": { 
                    name: "Templates", 
                    count: 0,
                    description: "Character templates and presets"
                },
                "campaigns/mutants": { 
                    name: "Mutants Campaign", 
                    count: 0,
                    description: "Characters from the Mutants campaign"
                }
            },
            characters: {},
            settings: {
                defaultFolder: "web_exports",
                autoScan: true,
                backupEnabled: true
            }
        };
    }

    initializeFolders() {
        this.folders.clear();
        
        for (const [folderId, folderData] of Object.entries(this.libraryIndex.folders)) {
            this.folders.set(folderId, {
                id: folderId,
                name: folderData.name,
                count: folderData.count || 0,
                description: folderData.description || '',
                characters: []
            });
        }
    }

    // Save character with proper organization
    async saveCharacter(character, targetFolder = 'web_exports') {
        try {
            character.touch(); // Update last modified
            
            const filename = this.generateFilename(character);
            const characterId = character.id;
            
            // Add to library index
            this.libraryIndex.characters[characterId] = {
                id: characterId,
                name: character.name,
                realName: character.realName || '',
                tier: character.tier,
                folder: targetFolder,
                filename: filename,
                lastModified: character.lastModified,
                created: character.created,
                tags: this.generateTags(character),
                version: character.version || "2.0"
            };

            // Update folder count
            if (this.libraryIndex.folders[targetFolder]) {
                this.libraryIndex.folders[targetFolder].count = 
                    Object.values(this.libraryIndex.characters)
                        .filter(char => char.folder === targetFolder).length;
            }

            // Update library timestamp
            this.libraryIndex.lastUpdated = new Date().toISOString();

            // Save index
            await this.saveLibraryIndex();

            // Download the character file
            await this.downloadCharacterFile(character, filename);

            return {
                success: true,
                filename: filename,
                folder: targetFolder,
                message: `Character saved as ${filename}`,
                instructions: `Place file in characters_data/${targetFolder}/`
            };

        } catch (error) {
            console.error('Failed to save character:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    generateFilename(character) {
        const safeName = character.name.replace(/[^a-z0-9]/gi, '_');
        const safeRealName = character.realName ? 
            `_${character.realName.replace(/[^a-z0-9]/gi, '_')}` : '';
        
        return `${safeName}${safeRealName}_tier${character.tier}_${character.id}.json`;
    }

    generateTags(character) {
        const tags = [];
        
        // Add tier-based tags
        if (character.tier <= 3) tags.push('low-tier');
        else if (character.tier <= 6) tags.push('mid-tier');
        else tags.push('high-tier');
        
        // Add archetype tags
        Object.values(character.archetypes).forEach(archetype => {
            if (archetype) tags.push(archetype);
        });
        
        // Add role tags based on archetypes
        if (character.archetypes.defensive?.includes('fortress') || 
            character.archetypes.defensive?.includes('stalwart')) {
            tags.push('tank');
        }
        
        if (character.archetypes.attackType === 'aoeSpecialist') {
            tags.push('crowd-control');
        }
        
        return tags;
    }

    async downloadCharacterFile(character, filename) {
        const dataStr = JSON.stringify(character, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Bulk import characters
    async importCharacters(files, targetFolder = 'roll20_imports') {
        const results = {
            successful: [],
            failed: [],
            duplicates: [],
            total: files.length
        };

        for (const file of files) {
            try {
                const characterData = await this.readFileAsJSON(file);
                const result = await this.importSingleCharacter(characterData, targetFolder, file.name);
                
                if (result.success) {
                    if (result.duplicate) {
                        results.duplicates.push(file.name);
                    } else {
                        results.successful.push(file.name);
                    }
                } else {
                    results.failed.push(`${file.name}: ${result.error}`);
                }
            } catch (error) {
                results.failed.push(`${file.name}: ${error.message}`);
            }
        }

        await this.saveLibraryIndex();
        return results;
    }

    async importSingleCharacter(characterData, targetFolder, originalFilename) {
        try {
            // Validate character data
            if (!this.validateCharacterData(characterData)) {
                return { success: false, error: 'Invalid character format' };
            }

            const characterId = characterData.id || Date.now().toString();
            
            // Check for duplicates
            if (this.libraryIndex.characters[characterId]) {
                return { success: true, duplicate: true };
            }

            // Ensure required structure
            this.normalizeCharacterData(characterData);

            // Add to library
            this.libraryIndex.characters[characterId] = {
                id: characterId,
                name: characterData.name,
                realName: characterData.realName || '',
                tier: characterData.tier,
                folder: targetFolder,
                filename: originalFilename,
                lastModified: characterData.lastModified || new Date().toISOString(),
                created: characterData.created || new Date().toISOString(),
                tags: this.generateTags(characterData),
                version: characterData.version || "2.0",
                imported: true,
                importDate: new Date().toISOString()
            };

            // Update folder count
            if (this.libraryIndex.folders[targetFolder]) {
                this.libraryIndex.folders[targetFolder].count++;
            }

            return { success: true, duplicate: false };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    validateCharacterData(data) {
        return data && 
               typeof data.name === 'string' && 
               typeof data.tier === 'number' && 
               data.tier >= 1 && data.tier <= 10 &&
               data.archetypes && 
               data.attributes;
    }

    normalizeCharacterData(characterData) {
        // Ensure all required fields exist
        if (!characterData.id) characterData.id = Date.now().toString();
        if (!characterData.version) characterData.version = "2.0";
        if (!characterData.created) characterData.created = new Date().toISOString();
        if (!characterData.lastModified) characterData.lastModified = new Date().toISOString();
        if (!characterData.realName) characterData.realName = '';
        
        // Ensure archetype structure
        if (!characterData.archetypes) {
            characterData.archetypes = {
                movement: null, attackType: null, effectType: null,
                uniqueAbility: null, defensive: null, specialAttack: null, utility: null
            };
        }
        
        // Ensure attribute structure
        if (!characterData.attributes) {
            characterData.attributes = {
                focus: 0, mobility: 0, power: 0, endurance: 0,
                awareness: 0, communication: 0, intelligence: 0
            };
        }
    }

    readFileAsJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(new Error(`Invalid JSON: ${error.message}`));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Get characters by folder
    getCharactersByFolder(folderId = 'all') {
        const characters = Object.values(this.libraryIndex.characters);
        
        if (folderId === 'all') {
            return characters;
        }
        
        return characters.filter(char => char.folder === folderId);
    }

    // Get folder information
    getFolders() {
        return Array.from(this.folders.values());
    }

    getFolderInfo(folderId) {
        return this.folders.get(folderId);
    }

    // Search functionality
    searchCharacters(query, folderId = 'all') {
        const characters = this.getCharactersByFolder(folderId);
        const searchTerm = query.toLowerCase();
        
        return characters.filter(char => 
            char.name.toLowerCase().includes(searchTerm) ||
            char.realName.toLowerCase().includes(searchTerm) ||
            char.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    // Statistics
    getLibraryStats() {
        const characters = Object.values(this.libraryIndex.characters);
        
        return {
            totalCharacters: characters.length,
            byTier: this.groupByTier(characters),
            byFolder: this.groupByFolder(characters),
            recentlyModified: characters
                .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
                .slice(0, 5)
        };
    }

    groupByTier(characters) {
        const groups = {};
        for (let tier = 1; tier <= 10; tier++) {
            groups[tier] = characters.filter(char => char.tier === tier).length;
        }
        return groups;
    }

    groupByFolder(characters) {
        const groups = {};
        Object.keys(this.libraryIndex.folders).forEach(folderId => {
            groups[folderId] = characters.filter(char => char.folder === folderId).length;
        });
        return groups;
    }

    // Save/load library index
    async saveLibraryIndex() {
        localStorage.setItem('vitality-character-library-v2', JSON.stringify(this.libraryIndex));
    }

    // Export library for backup
    exportLibrary() {
        const exportData = {
            ...this.libraryIndex,
            exportDate: new Date().toISOString(),
            exportVersion: "2.0"
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vitality_character_library_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Create new folder
    createFolder(folderId, name, description = '') {
        this.libraryIndex.folders[folderId] = {
            name: name,
            count: 0,
            description: description
        };
        
        this.folders.set(folderId, {
            id: folderId,
            name: name,
            count: 0,
            description: description,
            characters: []
        });
        
        this.saveLibraryIndex();
    }
}