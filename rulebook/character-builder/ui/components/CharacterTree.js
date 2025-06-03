// CharacterTree.js - Enhanced character list with library integration
export class CharacterTree {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.library = null; // Will be set from builder
        this.currentFolder = 'all';
        this.searchQuery = '';
        this.isInitialized = false;
    }

    async init() {
        this.library = this.builder.library;
        this.isInitialized = true;
        this.render();
    }

    render() {
        const container = document.getElementById('character-tree');
        if (!container) return;

        if (!this.isInitialized || !this.library) {
            container.innerHTML = '<div class="loading">Loading character library...</div>';
            return;
        }

        const characters = this.getFilteredCharacters();
        const stats = this.library.getLibraryStats();

        container.innerHTML = `
            <div class="character-library">
                ${this.renderQuickActions()}
                ${this.renderSearchAndFilter()}
                ${this.renderFolderNavigation(stats)}
                ${this.renderCharacterList(characters)}
                ${this.renderLibraryStats(stats)}
            </div>
        `;

        this.setupEventListeners();
    }

    renderQuickActions() {
        return `
            <div class="quick-actions">
                <div class="action-buttons" style="display: flex; gap: 0.25rem;">
                    <button id="bulk-import-btn" class="btn-secondary" style="flex: 1; font-size: 0.8em;">
                        Import
                    </button>
                    <button id="scan-library-btn" class="btn-secondary" style="flex: 1; font-size: 0.8em;">
                        Scan
                    </button>
                    <button id="export-library-btn" class="btn-secondary" style="flex: 1; font-size: 0.8em;">
                        Export
                    </button>
                </div>
                <input type="file" id="bulk-import-input" multiple accept=".json" style="display: none;">
            </div>
        `;
    }

    renderSearchAndFilter() {
        return `
            <div class="search-filter">
                <input type="text" 
                       id="character-search" 
                       placeholder="Search characters..." 
                       value="${this.searchQuery}"
                       style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; 
                              background: var(--bg-primary); border: 1px solid var(--accent-secondary); 
                              color: var(--text-light); border-radius: 4px;">
            </div>
        `;
    }

    renderFolderNavigation(stats) {
        const folders = this.library.getFolders();
        
        return `
            <div class="folder-navigation">
                <h4 style="margin-bottom: 0.5rem;">Folders</h4>
                <div class="folder-list">
                    <div class="folder-item ${this.currentFolder === 'all' ? 'active' : ''}" 
                         data-folder="all">
                        <span class="folder-name">All Characters</span>
                        <span class="folder-count">${stats.totalCharacters}</span>
                    </div>
                    ${folders.map(folder => `
                        <div class="folder-item ${this.currentFolder === folder.id ? 'active' : ''}" 
                             data-folder="${folder.id}">
                            <span class="folder-name">${folder.name}</span>
                            <span class="folder-count">${folder.count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderCharacterList(characters) {
        if (characters.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="character-list">
                <h4 style="margin: 1rem 0 0.5rem 0;">
                    Characters ${this.currentFolder !== 'all' ? `(${this.library.getFolderInfo(this.currentFolder)?.name})` : ''}
                    <span class="character-count">(${characters.length})</span>
                </h4>
                ${characters.map(character => this.renderCharacterItem(character)).join('')}
            </div>
        `;
    }

    renderCharacterItem(character) {
        const isLoaded = this.builder.currentCharacter?.id === character.id;
        const hasIssues = false; // We'll implement validation later
        
        return `
            <div class="character-item ${isLoaded ? 'active' : ''} ${hasIssues ? 'has-issues' : ''}" 
                 data-character-id="${character.id}">
                <div class="character-info">
                    <div class="character-name">${character.name}</div>
                    <div class="character-details">
                        <span class="character-tier">Tier ${character.tier}</span>
                        ${character.realName ? `<span class="character-real-name">• ${character.realName}</span>` : ''}
                        ${this.renderCharacterStatus(character)}
                    </div>
                    ${character.tags.length > 0 ? `
                        <div class="character-tags">
                            ${character.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                            ${character.tags.length > 3 ? `<span class="tag-more">+${character.tags.length - 3}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="character-actions">
                    <button class="btn-small btn-secondary" 
                            data-action="duplicate" 
                            data-character-id="${character.id}"
                            title="Duplicate Character">⧉</button>
                    <button class="btn-small btn-secondary" 
                            data-action="move" 
                            data-character-id="${character.id}"
                            title="Move to Folder">📁</button>
                    <button class="btn-small btn-danger" 
                            data-action="delete" 
                            data-character-id="${character.id}"
                            title="Remove from Library">✕</button>
                </div>
            </div>
        `;
    }

    renderCharacterStatus(character) {
        if (character.imported) {
            return `<span class="status imported">Imported ${new Date(character.importDate).toLocaleDateString()}</span>`;
        }
        
        const modifiedDate = new Date(character.lastModified);
        const isRecent = (Date.now() - modifiedDate.getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 days
        
        if (isRecent) {
            return `<span class="status recent">Modified ${modifiedDate.toLocaleDateString()}</span>`;
        }
        
        return `<span class="status ready">Ready</span>`;
    }

    renderEmptyState() {
        const folderName = this.currentFolder === 'all' ? 'library' : this.library.getFolderInfo(this.currentFolder)?.name || 'folder';
        
        return `
            <div class="empty-character-list">
                <p>No characters in ${folderName}.</p>
                ${this.currentFolder === 'all' ? `
                    <p>Click "New Character" to create one, or "Import" to load existing characters.</p>
                ` : `
                    <p>Import characters or move existing ones to this folder.</p>
                `}
            </div>
        `;
    }

    renderLibraryStats(stats) {
        return `
            <div class="library-stats">
                <h5>Library Stats</h5>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span>Total:</span>
                        <span>${stats.totalCharacters}</span>
                    </div>
                    <div class="stat-item">
                        <span>Avg Tier:</span>
                        <span>${this.calculateAverageTier(stats.byTier)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    calculateAverageTier(tierStats) {
        let total = 0;
        let count = 0;
        
        Object.entries(tierStats).forEach(([tier, charCount]) => {
            total += parseInt(tier) * charCount;
            count += charCount;
        });
        
        return count > 0 ? (total / count).toFixed(1) : '0';
    }

    getFilteredCharacters() {
        let characters = this.library.getCharactersByFolder(this.currentFolder);
        
        if (this.searchQuery) {
            characters = this.library.searchCharacters(this.searchQuery, this.currentFolder);
        }
        
        // Sort by last modified (most recent first)
        return characters.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    }

    setupEventListeners() {
        // New character button
        const newCharacterBtn = document.getElementById('new-character-btn');
        if (newCharacterBtn) {
            newCharacterBtn.addEventListener('click', () => this.builder.createNewCharacter());
        }

        // Bulk import
        const bulkImportBtn = document.getElementById('bulk-import-btn');
        const fileInput = document.getElementById('bulk-import-input');
        
        if (bulkImportBtn && fileInput) {
            bulkImportBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.handleBulkImport(e.target.files));
        }

        // Export library
        const exportBtn = document.getElementById('export-library-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.library.exportLibrary());
        }

        // Search
        const searchInput = document.getElementById('character-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.render();
            });
        }

        // Folder navigation
        document.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', () => {
                this.currentFolder = item.dataset.folder;
                this.render();
            });
        });

        // Character selection
        document.querySelectorAll('.character-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-small')) return;
                
                const characterId = item.dataset.characterId;
                this.loadCharacterFromLibrary(characterId);
            });
        });

        // Character actions
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const action = btn.dataset.action;
                const characterId = btn.dataset.characterId;
                
                this.handleCharacterAction(action, characterId);
            });
        });
    }

    async handleBulkImport(files) {
        if (!files || files.length === 0) return;

        const importBtn = document.getElementById('bulk-import-btn');
        const originalText = importBtn.textContent;
        
        importBtn.textContent = 'Importing...';
        importBtn.disabled = true;

        try {
            const results = await this.library.importCharacters(files, 'roll20_imports');
            
            this.showImportResults(results);
            this.render(); // Refresh the display
            
        } catch (error) {
            this.builder.showNotification(`Import failed: ${error.message}`, 'error');
        } finally {
            importBtn.textContent = originalText;
            importBtn.disabled = false;
        }
    }

    showImportResults(results) {
        const total = results.total;
        const successful = results.successful.length;
        const failed = results.failed.length;
        const duplicates = results.duplicates.length;

        let message = `Import completed: ${successful}/${total} successful`;
        if (duplicates > 0) message += `, ${duplicates} duplicates skipped`;
        if (failed > 0) message += `, ${failed} failed`;

        const type = failed > successful ? 'warning' : 'success';
        this.builder.showNotification(message, type);

        if (failed > 0) {
            console.log('Failed imports:', results.failed);
        }
    }

    async loadCharacterFromLibrary(characterId) {
        const characterMeta = this.library.libraryIndex.characters[characterId];
        if (!characterMeta) {
            this.builder.showNotification('Character not found in library', 'error');
            return;
        }

        // For now, we'll ask user to load the file manually
        // Later this will be automatic with API integration
        this.builder.showNotification(
            `Please load the character file: ${characterMeta.filename} from characters_data/${characterMeta.folder}/`, 
            'info'
        );
        
        // Trigger file picker for the specific character
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file && file.name === characterMeta.filename) {
                await this.loadCharacterFromFile(file);
            } else {
                this.builder.showNotification('Selected file does not match expected character file', 'warning');
            }
        };
        fileInput.click();
    }

    async loadCharacterFromFile(file) {
        try {
            const characterData = await this.library.readFileAsJSON(file);
            
            // Validate and normalize
            if (!this.library.validateCharacterData(characterData)) {
                throw new Error('Invalid character file format');
            }
            
            this.library.normalizeCharacterData(characterData);
            
            // Load into builder
            this.builder.currentCharacter = characterData;
            this.builder.loadCharacter(characterData.id);
            
            this.render(); // Refresh to show active character
            this.builder.showNotification(`Loaded ${characterData.name}!`, 'success');
            
        } catch (error) {
            this.builder.showNotification(`Failed to load character: ${error.message}`, 'error');
        }
    }

    handleCharacterAction(action, characterId) {
        switch(action) {
            case 'duplicate':
                this.duplicateCharacter(characterId);
                break;
            case 'move':
                this.moveCharacterToFolder(characterId);
                break;
            case 'delete':
                this.deleteCharacterFromLibrary(characterId);
                break;
        }
    }

    duplicateCharacter(characterId) {
        this.builder.showNotification('Duplicate functionality coming soon!', 'info');
    }

    moveCharacterToFolder(characterId) {
        this.builder.showNotification('Move to folder functionality coming soon!', 'info');
    }

    deleteCharacterFromLibrary(characterId) {
        const character = this.library.libraryIndex.characters[characterId];
        if (!character) return;

        if (confirm(`Remove "${character.name}" from library? The file will remain in your folders.`)) {
            delete this.library.libraryIndex.characters[characterId];
            
            // Update folder count
            if (this.library.libraryIndex.folders[character.folder]) {
                this.library.libraryIndex.folders[character.folder].count--;
            }
            
            this.library.saveLibraryIndex();
            
            // If this was the current character, clear it
            if (this.builder.currentCharacter?.id === characterId) {
                this.builder.currentCharacter = null;
                this.builder.showWelcomeScreen();
            }
            
            this.render();
            this.builder.showNotification('Character removed from library', 'info');
        }
    }

    // Public method to refresh the display
    refresh() {
        this.render();
    }
}