// rulebook/character-builder/ui/components/CharacterTree.js
import { RenderUtils } from '../shared/RenderUtils.js';
import { EventManager } from '../shared/EventManager.js';

export class CharacterTree {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.library = null; // Will be set by CharacterBuilder
        this.expandedFolders = new Set();
        this.selectedCharacterId = null;
        this.searchTerm = '';
    }

    init() {
        console.log('🟡 Initializing CharacterTree...');
        // Library is expected to be initialized by CharacterBuilder before this
        this.render();
        // Event listeners are setup once by CharacterBuilder, or need to be specific to this component's container
    }

    render() {
        const container = document.getElementById('character-tree');
        if (!container) {
            console.error("Character tree container not found!");
            return;
        }
        if (!this.library || !this.library.initialized) {
            container.innerHTML = '<p>Loading library...</p>';
            return;
        }

        const characters = this.searchTerm ?
                           this.library.searchCharacters(this.searchTerm) :
                           this.library.getAllCharacters();
        const folders = Array.from(this.library.folders.values());

        container.innerHTML = `
            <div class="character-tree-header">
                ${RenderUtils.renderButton({
                    text: '+ New Character',
                    variant: 'primary',
                    dataAttributes: { action: 'new-character' }, // For EventManager
                    classes: ['new-character-btn-tree'] // More specific if needed
                })}
                ${RenderUtils.renderButton({
                    text: 'Import JSON',
                    variant: 'secondary',
                    dataAttributes: { action: 'import-character' } // For EventManager
                })}
            </div>

            <div class="character-search form-group">
                <input type="text"
                       id="character-search-input"
                       placeholder="Search characters..."
                       class="search-input"
                       value="${this.searchTerm}">
            </div>

            <div class="character-tree-content">
                ${this.searchTerm ?
                    this.renderSearchResults(characters) :
                    this.renderCharacterTree(characters, folders)
                }
            </div>

            <div class="character-tree-footer">
                ${this.renderLibraryStats()}
            </div>
        `;
        this.setupTreeSpecificListeners(container); // Re-attach listeners for dynamic content
    }

    renderSearchResults(characters) {
        return `
            <div class="search-results">
                <div class="search-header">Search Results (${characters.length})</div>
                ${characters.length > 0 ? `
                    <div class="search-character-list">
                        ${characters.map(char => this.renderCharacterItem(char)).join('')}
                    </div>
                ` : '<div class="empty-state">No characters found for your search.</div>'}
            </div>
        `;
    }

    renderCharacterTree(characters, folders) {
        const charactersByFolder = this.groupCharactersByFolder(characters);
        const rootFolders = folders.filter(f => !f.parentId);
        const unorganizedCharacters = charactersByFolder.get(null) || []; // Use null for root

        return `
            <div class="character-tree-list">
                ${rootFolders.map(folder => this.renderFolder(folder, charactersByFolder, folders)).join('')}
                ${unorganizedCharacters.length > 0 || rootFolders.length === 0 && characters.length > 0 ? `
                    <div class="folder-section">
                        <div class="folder-header unorganized">
                            <span class="folder-name">Unorganized</span>
                            <span class="folder-count">(${unorganizedCharacters.length})</span>
                        </div>
                        <div class="folder-characters">
                            ${unorganizedCharacters.map(char => this.renderCharacterItem(char)).join('')}
                        </div>
                    </div>
                ` : (characters.length === 0 ? '<div class="empty-state">No characters yet. Click "New Character" to start.</div>' : '')}
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
                     data-folder-id="${folder.id}" data-action="toggle-folder">
                    <span class="folder-icon">${isExpanded ? '📂' : '📁'}</span>
                    <span class="folder-name">${folder.name}</span>
                    <span class="folder-count">(${folderCharacters.length + subFolders.length})</span>
                    <div class="folder-actions">
                        ${RenderUtils.renderButton({ text: '✏️', variant: 'secondary', size: 'small', dataAttributes: { action: 'rename-folder', 'folder-id': folder.id }})}
                        ${RenderUtils.renderButton({ text: '🗑️', variant: 'danger', size: 'small', dataAttributes: { action: 'delete-folder', 'folder-id': folder.id }})}
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
        // Validation would typically be done by CharacterBuilder and passed or re-validated
        // For simplicity, let's assume a way to check issues if needed
        const hasIssues = character.validationResults && !character.validationResults.isValid;


        return `
            <div class="character-item ${isSelected ? 'active' : ''} ${hasIssues ? 'has-issues' : ''}"
                 data-character-id="${character.id}" data-action="select-character">
                <div class="character-main">
                    <div class="character-name">${character.name}</div>
                    <div class="character-details">
                        Tier ${character.tier}
                        ${character.realName ? ` • ${character.realName}` : ''}
                    </div>
                </div>
                <div class="character-actions">
                    ${RenderUtils.renderButton({ text: '📋', variant: 'secondary', size: 'small', dataAttributes: { action: 'duplicate-character', 'character-id': character.id }})}
                    ${RenderUtils.renderButton({ text: '💾', variant: 'secondary', size: 'small', dataAttributes: { action: 'export-character-item', 'character-id': character.id }})}
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
            const folderId = character.folderId || null; // null for root/unorganized
            if (!groups.has(folderId)) {
                groups.set(folderId, []);
            }
            groups.get(folderId).push(character);
        });
        return groups;
    }

    setupTreeSpecificListeners(container) { // Changed from setupEventListeners to be more specific
        EventManager.delegateEvents(container, {
            click: {
                '[data-action="new-character"]': () => this.builder.createNewCharacter(),
                '[data-action="import-character"]': () => this.importCharacter(),
                '[data-action="select-character"]': (e, el) => this.selectCharacter(el.closest('.character-item').dataset.characterId),
                '[data-action="toggle-folder"]': (e, el) => this.toggleFolder(el.closest('.folder-header').dataset.folderId),
                '[data-action="duplicate-character"]': (e, el) => { e.stopPropagation(); this.duplicateCharacter(el.dataset.characterId); },
                '[data-action="export-character-item"]': (e, el) => { e.stopPropagation(); this.exportCharacter(el.dataset.characterId); },
                // Note: CharacterBuilder handles its own delete button; this tree doesn't have a top-level one.
                '[data-action="rename-folder"]': (e, el) => { e.stopPropagation(); this.renameFolder(el.dataset.folderId); },
                '[data-action="delete-folder"]': (e, el) => { e.stopPropagation(); this.deleteFolder(el.dataset.folderId); }
            },
            input: {
                '#character-search-input': EventManager.debounce((e) => this.handleSearch(e.target.value), 300)
            }
        });
    }
    
    handleSearch(query) {
        this.searchTerm = query;
        this.refresh(); // Re-render with search term
    }

    selectCharacter(characterId) {
        if (!this.library) return;
        const character = this.library.getCharacter(characterId);
        if (!character) return;

        this.selectedCharacterId = characterId;
        this.builder.loadCharacter(characterId); // Use builder's load method
        this.refresh(); // Re-render to show selection
    }

    duplicateCharacter(characterId) {
        if (!this.library) return;
        const original = this.library.getCharacter(characterId);
        if (!original) return;

        const duplicate = JSON.parse(JSON.stringify(original)); // Deep clone
        duplicate.id = Date.now().toString();
        duplicate.name = `${original.name} (Copy)`;
        duplicate.created = new Date().toISOString();
        duplicate.lastModified = new Date().toISOString();

        this.library.saveCharacter(duplicate);
        this.refresh();
        this.builder.showNotification(`Duplicated character: ${duplicate.name}`, 'success');
    }

    exportCharacter(characterId) {
        if (!this.library) return;
        const character = this.library.getCharacter(characterId);
        if (!character) return;

        try {
            const jsonData = this.library.exportCharacter(characterId);
            this.downloadFile(`${character.name.replace(/[^a-z0-9]/gi, '_')}_character.json`, jsonData, 'application/json');
            this.builder.showNotification(`Exported ${character.name}`, 'success');
        } catch (error) {
            this.builder.showNotification(`Export failed: ${error.message}`, 'error');
        }
    }
    
    importCharacter() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const importedCharacter = await this.library.importCharacter(event.target.result);
                    this.refresh();
                    this.builder.showNotification(`Imported character: ${importedCharacter.name}`, 'success');
                    this.selectCharacter(importedCharacter.id); // Optionally select imported character
                } catch (error) {
                    this.builder.showNotification(`Import failed: ${error.message}`, 'error');
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

        const newName = prompt('Enter new folder name:', folder.name);
        if (newName && newName.trim() !== '') {
            folder.name = newName.trim();
            this.library.saveToStorage(); // Make sure library saves folder changes
            this.refresh();
            this.builder.showNotification(`Folder renamed to: ${newName}`, 'success');
        }
    }

    deleteFolder(folderId) {
        if (!this.library) return;
        const folder = this.library.folders.get(folderId);
        if (!folder) return;

        const charactersInFolder = this.library.getCharactersInFolder(folderId);
        let confirmMessage = `Delete folder "${folder.name}"?`;
        if (charactersInFolder.length > 0) {
            confirmMessage += ` This will move ${charactersInFolder.length} character(s) to Unorganized.`;
        }

        if (confirm(confirmMessage)) {
            charactersInFolder.forEach(char => {
                const characterToUpdate = this.library.getCharacter(char.id);
                if (characterToUpdate) {
                    characterToUpdate.folderId = null; // Move to unorganized (root)
                    this.library.saveCharacter(characterToUpdate); // Save change
                }
            });
            this.library.folders.delete(folderId);
            this.library.saveToStorage(); // Save folder deletion
            this.refresh();
            this.builder.showNotification(`Deleted folder: ${folder.name}`, 'success');
        }
    }

    downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    refresh() {
        // This method is called when the tree needs to re-render itself,
        // e.g., after library changes or search.
        if(this.library && this.library.initialized) {
            this.render();
        }
    }
}