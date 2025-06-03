// CharacterTree.js - Character tree navigation and management
import { RenderUtils } from '../shared/RenderUtils.js';
import { EventManager } from '../shared/EventManager.js';

export class CharacterTree {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.library = null;
        this.expandedFolders = new Set();
        this.selectedCharacterId = null;
    }
    
    init() {
        console.log('🟡 Initializing CharacterTree...');
        this.render();
        this.setupEventListeners();
    }
    
    render() {
        const container = document.getElementById('character-tree');
        if (!container) return;
        
        const characters = this.library ? this.library.getAllCharacters() : [];
        const folders = this.library ? Array.from(this.library.folders.values()) : [];
        
        container.innerHTML = `
            <div class="character-tree-header">
                <button id="new-character-btn" class="btn-primary">
                    + New Character
                </button>
                <button id="import-character-btn" class="btn-secondary">
                    Import JSON
                </button>
            </div>
            
            <div class="character-search">
                <input type="text" 
                       id="character-search-input" 
                       placeholder="Search characters..."
                       class="search-input">
            </div>
            
            <div class="character-tree-content">
                ${this.renderCharacterTree(characters, folders)}
            </div>
            
            <div class="character-tree-footer">
                ${this.renderLibraryStats()}
            </div>
        `;
    }
    
    renderCharacterTree(characters, folders) {
        // Group characters by folder
        const charactersByFolder = this.groupCharactersByFolder(characters);
        const rootFolders = folders.filter(f => !f.parentId);
        const unorganizedCharacters = charactersByFolder.get(null) || [];
        
        return `
            <div class="character-tree-list">
                ${rootFolders.map(folder => this.renderFolder(folder, charactersByFolder, folders)).join('')}
                ${unorganizedCharacters.length > 0 ? `
                    <div class="folder-section">
                        <div class="folder-header unorganized">
                            <span class="folder-name">Unorganized</span>
                            <span class="folder-count">(${unorganizedCharacters.length})</span>
                        </div>
                        <div class="folder-characters">
                            ${unorganizedCharacters.map(char => this.renderCharacterItem(char)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderFolder(folder, charactersByFolder, allFolders) {
        const isExpanded = this.expandedFolders.has(folder.id);
        const folderCharacters = charactersByFolder.get(folder.id) || [];
        const subFolders = allFolders.filter(f => f.parentId === folder.id);
        
        return `
            <div class="folder-section">
                <div class="folder-header ${isExpanded ? 'expanded' : 'collapsed'}" 
                     data-folder-id="${folder.id}">
                    <span class="folder-icon">${isExpanded ? '📂' : '📁'}</span>
                    <span class="folder-name">${folder.name}</span>
                    <span class="folder-count">(${folderCharacters.length})</span>
                    <div class="folder-actions">
                        <button class="btn-small" data-action="rename-folder" data-folder-id="${folder.id}">✏️</button>
                        <button class="btn-small" data-action="delete-folder" data-folder-id="${folder.id}">🗑️</button>
                    </div>
                </div>
                
                ${isExpanded ? `
                    <div class="folder-content">
                        ${subFolders.map(subFolder => this.renderFolder(subFolder, charactersByFolder, allFolders)).join('')}
                        <div class="folder-characters">
                            ${folderCharacters.map(char => this.renderCharacterItem(char)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    renderCharacterItem(character) {
        const isSelected = this.selectedCharacterId === character.id;
        const validation = this.builder.validateCharacter ? this.builder.validateCharacter() : { isValid: true };
        
        return `
            <div class="character-item ${isSelected ? 'active' : ''} ${!validation.isValid ? 'has-issues' : ''}" 
                 data-character-id="${character.id}">
                <div class="character-main">
                    <div class="character-name">${character.name}</div>
                    <div class="character-details">
                        Tier ${character.tier}
                        ${character.realName ? ` • ${character.realName}` : ''}
                    </div>
                </div>
                <div class="character-actions">
                    <button class="btn-small" data-action="duplicate-character" data-character-id="${character.id}">📋</button>
                    <button class="btn-small" data-action="export-character" data-character-id="${character.id}">💾</button>
                    <button class="btn-small btn-danger" data-action="delete-character" data-character-id="${character.id}">🗑️</button>
                </div>
            </div>
        `;
    }
    
    renderLibraryStats() {
        if (!this.library) return '';
        
        const stats = this.library.getStatistics();
        
        return `
            <div class="library-stats">
                <div class="stat-item">
                    <span class="stat-value">${stats.totalCharacters}</span>
                    <span class="stat-label">Characters</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${stats.totalFolders}</span>
                    <span class="stat-label">Folders</span>
                </div>
            </div>
        `;
    }
    
    groupCharactersByFolder(characters) {
        const groups = new Map();
        
        characters.forEach(character => {
            const folderId = character.folderId || null;
            if (!groups.has(folderId)) {
                groups.set(folderId, []);
            }
            groups.get(folderId).push(character);
        });
        
        return groups;
    }
    
    setupEventListeners() {
        const container = document.getElementById('character-tree');
        if (!container) return;
        
        EventManager.setupStandardListeners(container, {
            clickHandlers: {
                '#new-character-btn': () => this.createNewCharacter(),
                '#import-character-btn': () => this.importCharacter(),
                '.character-item': (e, element) => this.selectCharacter(element.dataset.characterId),
                '.folder-header': (e, element) => this.toggleFolder(element.dataset.folderId),
                '[data-action="duplicate-character"]': (e, element) => {
                    e.stopPropagation();
                    this.duplicateCharacter(element.dataset.characterId);
                },
                '[data-action="export-character"]': (e, element) => {
                    e.stopPropagation();
                    this.exportCharacter(element.dataset.characterId);
                },
                '[data-action="delete-character"]': (e, element) => {
                    e.stopPropagation();
                    this.deleteCharacter(element.dataset.characterId);
                },
                '[data-action="rename-folder"]': (e, element) => {
                    e.stopPropagation();
                    this.renameFolder(element.dataset.folderId);
                },
                '[data-action="delete-folder"]': (e, element) => {
                    e.stopPropagation();
                    this.deleteFolder(element.dataset.folderId);
                }
            },
            inputHandlers: {
                '#character-search-input': EventManager.debounce((e) => this.searchCharacters(e.target.value), 300)
            }
        });
    }
    
    createNewCharacter() {
        console.log('🎉 CharacterTree new character button clicked!');
        
        if (this.builder && this.builder.createNewCharacter) {
            this.builder.createNewCharacter();
        } else {
            console.error('❌ CharacterBuilder not available');
        }
    }
    
    selectCharacter(characterId) {
        if (!this.library) return;
        
        const character = this.library.getCharacter(characterId);
        if (!character) return;
        
        this.selectedCharacterId = characterId;
        
        if (this.builder) {
            this.builder.currentCharacter = character;
            this.builder.showCharacterBuilder();
            this.builder.updateAllDisplays();
        }
        
        this.refresh();
        console.log(`✅ Selected character: ${character.name}`);
    }
    
    duplicateCharacter(characterId) {
        if (!this.library) return;
        
        const original = this.library.getCharacter(characterId);
        if (!original) return;
        
        const duplicate = {
            ...original,
            id: Date.now().toString(),
            name: `${original.name} (Copy)`,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        this.library.saveCharacter(duplicate);
        this.refresh();
        
        console.log(`📋 Duplicated character: ${duplicate.name}`);
    }
    
    exportCharacter(characterId) {
        if (!this.library) return;
        
        const character = this.library.getCharacter(characterId);
        if (!character) return;
        
        try {
            const jsonData = this.library.exportCharacter(characterId);
            this.downloadFile(`${character.name}_character.json`, jsonData);
            console.log(`💾 Exported character: ${character.name}`);
        } catch (error) {
            console.error('❌ Export failed:', error);
        }
    }
    
    deleteCharacter(characterId) {
        if (!this.library) return;
        
        const character = this.library.getCharacter(characterId);
        if (!character) return;
        
        if (confirm(`Delete character "${character.name}"? This cannot be undone.`)) {
            this.library.deleteCharacter(characterId);
            
            if (this.selectedCharacterId === characterId) {
                this.selectedCharacterId = null;
                if (this.builder) {
                    this.builder.currentCharacter = null;
                    this.builder.showWelcomeScreen();
                }
            }
            
            this.refresh();
            console.log(`🗑️ Deleted character: ${character.name}`);
        }
    }
    
    importCharacter() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const character = this.library.importCharacter(event.target.result);
                    this.refresh();
                    console.log(`📥 Imported character: ${character.name}`);
                } catch (error) {
                    console.error('❌ Import failed:', error);
                    alert('Failed to import character: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    toggleFolder(folderId) {
        if (this.expandedFolders.has(folderId)) {
            this.expandedFolders.delete(folderId);
        } else {
            this.expandedFolders.add(folderId);
        }
        
        this.refresh();
    }
    
    renameFolder(folderId) {
        if (!this.library) return;
        
        const folder = this.library.folders.get(folderId);
        if (!folder) return;
        
        const newName = prompt('Folder name:', folder.name);
        if (newName && newName.trim() !== '') {
            folder.name = newName.trim();
            this.library.saveToStorage();
            this.refresh();
            console.log(`✏️ Renamed folder to: ${newName}`);
        }
    }
    
    deleteFolder(folderId) {
        if (!this.library) return;
        
        const folder = this.library.folders.get(folderId);
        if (!folder) return;
        
        const characters = this.library.getCharactersInFolder(folderId);
        
        if (characters.length > 0) {
            if (!confirm(`Delete folder "${folder.name}" and move ${characters.length} character(s) to Unorganized?`)) {
                return;
            }
            
            // Move characters to unorganized
            characters.forEach(char => {
                char.folderId = null;
            });
        }
        
        this.library.folders.delete(folderId);
        this.library.saveToStorage();
        this.refresh();
        
        console.log(`🗑️ Deleted folder: ${folder.name}`);
    }
    
    searchCharacters(query) {
        if (!this.library) return;
        
        if (!query.trim()) {
            this.render();
            return;
        }
        
        const results = this.library.searchCharacters(query);
        const container = document.querySelector('.character-tree-content');
        
        container.innerHTML = `
            <div class="search-results">
                <div class="search-header">Search Results (${results.length})</div>
                ${results.length > 0 ? `
                    <div class="search-character-list">
                        ${results.map(char => this.renderCharacterItem(char)).join('')}
                    </div>
                ` : '<div class="empty-state">No characters found</div>'}
            </div>
        `;
    }
    
    downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
    
    refresh() {
        this.render();
        this.setupEventListeners();
    }
}