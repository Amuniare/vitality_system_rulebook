// CharacterTree.js - Character list in sidebar
export class CharacterTree {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    
    render() {
        const container = document.getElementById('character-tree');
        if (!container) return;
    
        const characters = Object.values(this.builder.characters);
        
        if (characters.length === 0) {
            container.innerHTML = `
                <div class="character-list">
                    <div class="load-character-section" style="margin-bottom: 1rem;">
                        <input type="file" 
                               id="load-character-file" 
                               accept=".json"
                               style="display: none;">
                        <button id="load-character-btn" class="btn-secondary" style="width: 100%; margin-bottom: 0.5rem;">Load Character File</button>
                        <small style="color: var(--text-muted); font-size: 0.8em;">Load .json files from characters_data/web_exports/</small>
                    </div>
                    ${this.renderEmpty()}
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="character-list">
                    <div class="load-character-section" style="margin-bottom: 1rem;">
                        <input type="file" 
                               id="load-character-file" 
                               accept=".json"
                               style="display: none;">
                        <button id="load-character-btn" class="btn-secondary" style="width: 100%; margin-bottom: 0.5rem;">Load Character File</button>
                        <small style="color: var(--text-muted); font-size: 0.8em;">Load .json files from characters_data/web_exports/</small>
                    </div>
                    ${characters.map(character => this.renderCharacterItem(character)).join('')}
                </div>
            `;
        }
    
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Load character file functionality
        const loadBtn = document.getElementById('load-character-btn');
        const fileInput = document.getElementById('load-character-file');
        
        if (loadBtn && fileInput) {
            loadBtn.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.loadCharacterFromFile(file);
                }
                // Reset input so same file can be loaded again
                e.target.value = '';
            });
        }
    
        // Character selection
        document.querySelectorAll('.character-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking action buttons
                if (e.target.classList.contains('btn-small')) return;
                
                const characterId = item.dataset.characterId;
                this.builder.loadCharacter(characterId);
            });
        });
    
        // Character actions
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const action = btn.dataset.action;
                const characterId = btn.dataset.characterId;
                
                if (action === 'duplicate') {
                    this.duplicateCharacter(characterId);
                } else if (action === 'delete') {
                    this.deleteCharacter(characterId);
                }
            });
        });
    }

    loadCharacterFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const characterData = JSON.parse(e.target.result);
                
                // Validate it's a valid character file
                if (!characterData.id || !characterData.name || typeof characterData.tier !== 'number') {
                    throw new Error('Invalid character file format - missing required fields');
                }
                
                // Validate tier range
                if (characterData.tier < 1 || characterData.tier > 10) {
                    throw new Error('Invalid tier value - must be between 1 and 10');
                }
                
                // Ensure required structure exists
                if (!characterData.archetypes || !characterData.attributes) {
                    throw new Error('Invalid character file format - missing archetypes or attributes');
                }
                
                // Add to builder characters
                this.builder.characters[characterData.id] = characterData;
                this.builder.loadCharacter(characterData.id);
                this.render();
                
                this.builder.showNotification(`Loaded ${characterData.name} (Tier ${characterData.tier})!`, 'success');
                
            } catch (error) {
                console.error('Failed to load character file:', error);
                this.builder.showNotification(`Failed to load character: ${error.message}`, 'error');
            }
        };
        
        reader.onerror = () => {
            this.builder.showNotification('Failed to read file', 'error');
        };
        
        reader.readAsText(file);
    }



    renderCharacterItem(character) {
        const isActive = this.builder.currentCharacter?.id === character.id;
        const validation = this.builder.validateCharacter();
        const hasIssues = this.builder.currentCharacter?.id === character.id && !validation.isValid;
        
        return `
            <div class="character-item ${isActive ? 'active' : ''} ${hasIssues ? 'has-issues' : ''}" 
                 data-character-id="${character.id}">
                <div class="character-info">
                    <div class="character-name">${character.name}</div>
                    <div class="character-details">
                        <span class="character-tier">Tier ${character.tier}</span>
                        ${this.renderCharacterStatus(character)}
                    </div>
                </div>
                <div class="character-actions">
                    <button class="btn-small btn-secondary" 
                            data-action="duplicate" 
                            data-character-id="${character.id}"
                            title="Duplicate Character">⧉</button>
                    <button class="btn-small btn-danger" 
                            data-action="delete" 
                            data-character-id="${character.id}"
                            title="Delete Character">✕</button>
                </div>
            </div>
        `;
    }

    renderCharacterStatus(character) {
        // Quick validation check
        const archetypeCount = Object.values(character.archetypes).filter(arch => arch !== null).length;
        const hasAttributes = Object.values(character.attributes).some(val => val > 0);
        
        if (archetypeCount < 7) {
            return `<span class="status incomplete">Incomplete (${archetypeCount}/7 archetypes)</span>`;
        } else if (!hasAttributes) {
            return `<span class="status needs-attributes">Ready for attributes</span>`;
        } else {
            return `<span class="status ready">Ready</span>`;
        }
    }

    renderEmpty() {
        const container = document.getElementById('character-tree');
        if (!container) return;

        container.innerHTML = `
            <div class="empty-character-list">
                <p>No characters created yet.</p>
                <p>Click "New Character" to begin.</p>
            </div>
        `;
    }

    setupEventListeners() {
        // Character selection
        document.querySelectorAll('.character-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if clicking action buttons
                if (e.target.classList.contains('btn-small')) return;
                
                const characterId = item.dataset.characterId;
                this.builder.loadCharacter(characterId);
            });
        });

        // Character actions
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const action = btn.dataset.action;
                const characterId = btn.dataset.characterId;
                
                if (action === 'duplicate') {
                    this.duplicateCharacter(characterId);
                } else if (action === 'delete') {
                    this.deleteCharacter(characterId);
                }
            });
        });
    }

    duplicateCharacter(characterId) {
        const original = this.builder.characters[characterId];
        if (!original) return;

        const duplicate = JSON.parse(JSON.stringify(original));
        duplicate.id = Date.now().toString();
        duplicate.name = `${original.name} (Copy)`;
        duplicate.created = new Date().toISOString();
        duplicate.lastModified = new Date().toISOString();

        this.builder.characters[duplicate.id] = duplicate;
        this.builder.saveCharacters();
        this.render();
        
        this.builder.showNotification('Character duplicated successfully!', 'success');
    }

    deleteCharacter(characterId) {
        const character = this.builder.characters[characterId];
        if (!character) return;

        if (confirm(`Delete "${character.name}"? This cannot be undone.`)) {
            delete this.builder.characters[characterId];
            this.builder.saveCharacters();
            
            // If this was the current character, clear it
            if (this.builder.currentCharacter?.id === characterId) {
                this.builder.currentCharacter = null;
                this.builder.showWelcomeScreen();
            }
            
            this.render();
            this.builder.showNotification('Character deleted', 'info');
        }
    }
}