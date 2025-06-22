from pathlib import Path

file_path = Path("modernApp/components/CharacterListPanel.js")

# The code block to be modified
new_code_block = """// modernApp/components/CharacterListPanel.js
import { Logger } from '../utils/Logger.js';
import { EventBus } from '../core/EventBus.js';
// CharacterManager will be accessed via a global instance or passed in app.js

export class CharacterListPanel {
    constructor(listContainerId, controlsContainerId, characterManager) {
        this.listContainer = document.getElementById(listContainerId);
        this.controlsContainer = document.getElementById(controlsContainerId);
        this.characterManager = characterManager; // Instance of CharacterManager

        if (!this.listContainer || !this.controlsContainer) {
            Logger.error('[CharacterListPanel] Required container elements not found.');
            return;
        }
        
        // Store handler references
        this.listContainerClickHandler = null;
        this.controlsContainerClickHandler = null;

        this.init();
    }

    init() {
        this.renderControls();
        this.renderList();
        
        // CORRECTED EVENT NAMES
        EventBus.on('CHARACTER_LIST_UPDATED', () => this.renderList());
        EventBus.on('CHARACTER_SWITCHED', () => this.renderList()); // Re-render to update active state
        Logger.info('[CharacterListPanel] Initialized.');
    }

    renderControls() {
        this.controlsContainer.innerHTML = `
            <button class="btn btn-primary btn-block" data-action="new-character">New Character</button>
            <button class="btn btn-secondary btn-block" data-action="import-character">Import</button>
            <!-- Add Export All later if needed -->
        `;
        this.setupControlEventListeners();
    }

    renderList() {
        const charactersMetadata = this.characterManager.getAllCharacters();
        const activeCharId = this.characterManager.activeCharacterId;

        if (charactersMetadata.length === 0) {
            this.listContainer.innerHTML = '<p class="text-muted text-center">No characters yet. Create one!</p>';
            return;
        }

        this.listContainer.innerHTML = `
            <ul class="character-list">
                ${charactersMetadata.map(char => `
                    <li class="character-list-item ${char.id === activeCharId ? 'active' : ''}" data-char-id="${char.id}">
                        <span class="char-name">${char.name || 'Unnamed Character'} (T${char.tier || 'N/A'})</span>
                        <div class="char-actions">
                            <button class="btn-icon" data-action="load-character" title="Load ${char.name}"><i class="icon-load">➔</i></button>
                            <button class="btn-icon btn-danger" data-action="delete-character" title="Delete ${char.name}"><i class="icon-delete">🗑</i></button>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
        this.setupListEventListeners();
    }

    setupControlEventListeners() {
        // Remove previous listener if it exists
        if (this.controlsContainerClickHandler) {
            this.controlsContainer.removeEventListener('click', this.controlsContainerClickHandler);
        }

        // Define the new handler
        this.controlsContainerClickHandler = (e) => {
            const action = e.target.closest('button')?.dataset.action;
            if (!action) return;

            switch (action) {
                case 'new-character':
                    this.characterManager.createNewCharacter('New Character ' + (this.characterManager.getAllCharacters().length + 1));
                    // Active character and list will update via events
                    break;
                case 'import-character':
                    this.handleImport();
                    break;
            }
        };
        
        // Add the new listener
        this.controlsContainer.addEventListener('click', this.controlsContainerClickHandler);
    }
    
    setupListEventListeners() {
        // Remove previous listener if it exists
        if (this.listContainerClickHandler) {
            this.listContainer.removeEventListener('click', this.listContainerClickHandler);
        }

        // Define the new handler
        this.listContainerClickHandler = (e) => {
            const listItem = e.target.closest('.character-list-item');
            const actionButton = e.target.closest('button[data-action]');
            
            if (!listItem && !actionButton) return;

            const charId = actionButton ? actionButton.closest('.character-list-item')?.dataset.charId : listItem?.dataset.charId;
            if (!charId) return;

            const action = actionButton ? actionButton.dataset.action : 'load-character'; // Default to load if clicking item body

            switch (action) {
                case 'load-character':
                    if (charId !== this.characterManager.activeCharacterId) {
                        this.characterManager.setActiveCharacter(charId);
                    }
                    break;
                case 'delete-character':
                    this.handleDelete(charId);
                    break;
            }
        };

        // Add the new listener
        this.listContainer.addEventListener('click', this.listContainerClickHandler);
    }

    async handleDelete(charId) {
        const charMeta = this.characterManager.characters.get(charId);
        // Assuming Modal component is available globally or via an import
        // For now, using simple confirm
        if (confirm(`Are you sure you want to delete "${charMeta?.name || 'this character'}"? This cannot be undone.`)) {
            this.characterManager.deleteCharacter(charId);
        }
    }

    async handleImport() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const text = await file.text();
                    this.characterManager.importCharacter(text);
                    // UI updates via events
                }
            };
            input.click();
        } catch (error) {
            Logger.error('[CharacterListPanel] Error during import:', error);
            // NotificationSystem.show('Failed to import character.', 'error'); // If NotificationSystem is globally accessible
            alert('Failed to import character. See console for details.');
        }
    }
}
"""

# Read the original file content
try:
    original_content = file_path.read_text(encoding='utf-8')

    # For a full file replacement, this is simpler
    new_content = new_code_block

    # Write the updated content back to the file
    file_path.write_text(new_content, encoding='utf-8')
    print(f"Successfully updated {file_path} with corrected event names.")

except FileNotFoundError:
    print(f"Error: File not found at {file_path}")
except Exception as e:
    print(f"An error occurred: {e}")