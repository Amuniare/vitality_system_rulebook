// modernApp/components/CharacterListPanel.js
import { Logger } from '../utils/Logger.js';
import { EventBus } from '../core/EventBus.js';

export class CharacterListPanel {
    constructor(listContainerId, controlsContainerId, characterManager) {
        this.listContainer = document.getElementById(listContainerId);
        this.controlsContainer = document.getElementById(controlsContainerId);
        this.characterManager = characterManager;

        // FIXED: Better error handling for missing containers
        if (!this.listContainer) {
            Logger.error(`[CharacterListPanel] List container '#${listContainerId}' not found.`);
            throw new Error(`Required list container '#${listContainerId}' not found.`);
        }
        
        if (!this.controlsContainer) {
            Logger.error(`[CharacterListPanel] Controls container '#${controlsContainerId}' not found.`);
            throw new Error(`Required controls container '#${controlsContainerId}' not found.`);
        }

        if (!this.characterManager) {
            Logger.error('[CharacterListPanel] CharacterManager instance is required.');
            throw new Error('CharacterManager instance is required.');
        }
        
        // Store handler references
        this.listContainerClickHandler = null;
        this.controlsContainerClickHandler = null;

        Logger.info('[CharacterListPanel] Constructor completed successfully.');
    }

    async init() {
        this.renderControls();
        this.renderList();
        
        // Set up event listeners
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

            const action = actionButton ? actionButton.dataset.action : 'load-character';

            switch (action) {
                case 'load-character':
                    this.characterManager.setActiveCharacter(charId);
                    break;
                case 'delete-character':
                    if (confirm('Are you sure you want to delete this character?')) {
                        this.characterManager.deleteCharacter(charId);
                    }
                    break;
            }
        };
        
        // Add the new listener
        this.listContainer.addEventListener('click', this.listContainerClickHandler);
    }

    handleImport() {
        // Create a temporary file input for importing
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const characterData = JSON.parse(text);
                
                // Import the character via CharacterManager
                await this.characterManager.importCharacter(characterData);
                Logger.info('[CharacterListPanel] Character imported successfully.');
                
            } catch (error) {
                Logger.error('[CharacterListPanel] Failed to import character:', error);
                alert('Failed to import character. Please check the file format.');
            }
        };
        
        input.click();
    }

    cleanup() {
        // Remove event listeners
        if (this.controlsContainerClickHandler) {
            this.controlsContainer.removeEventListener('click', this.controlsContainerClickHandler);
        }
        if (this.listContainerClickHandler) {
            this.listContainer.removeEventListener('click', this.listContainerClickHandler);
        }
        
        // Clean up EventBus listeners
        EventBus.off('CHARACTER_LIST_UPDATED', this.renderList);
        EventBus.off('CHARACTER_SWITCHED', this.renderList);
        
        Logger.info('[CharacterListPanel] Cleanup completed.');
    }
}