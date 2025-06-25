// modernApp/components/CharacterListPanel.js
import { Component } from '../core/Component.js';
import { Logger } from '../utils/Logger.js';
import { EventBus } from '../core/EventBus.js';
import { TemplateEngine } from '../core/TemplateEngine.js';

/**
 * Universal CharacterListPanel component following the architecture pattern
 * Displays character list with controls for character management
 */
export class CharacterListPanel extends Component {
    static propSchema = {
        characterManager: { type: 'object', required: true },
        activeCharacterId: { type: 'string', default: null },
        showControls: { type: 'boolean', default: true },
        allowDelete: { type: 'boolean', default: true },
        allowCreate: { type: 'boolean', default: true },
        allowImport: { type: 'boolean', default: true }
    };

    constructor(props = {}, container = null) {
        super(props, container);
        
        this.listContainer = null;
        this.controlsContainer = null;
        this.templateEngine = new TemplateEngine();
        
        // Register templates specific to this component
        this.registerTemplates();
        
        Logger.debug(`[CharacterListPanel] Created with ID ${this.componentId}`);
    }

    registerTemplates() {
        // Character list item template
        this.templateEngine.registerTemplate('characterListItem', (data) => `
            <li class="character-list-item ${data.isActive ? 'active' : ''}" 
                data-character-id="${data.id}">
                <div class="character-info" data-action="select-character">
                    <span class="character-name">${data.name}</span>
                    <div class="character-meta">
                        <span class="character-tier">T${data.tier}</span>
                        <span class="character-type">${data.type}</span>
                    </div>
                </div>
                <div class="character-actions">
                    <button class="btn-icon btn-edit" 
                            data-action="edit-character" 
                            title="Edit Character"
                            aria-label="Edit ${data.name}">
                        ✏️
                    </button>
                    ${data.allowDelete ? `
                        <button class="btn-icon btn-delete btn-danger" 
                                data-action="delete-character"
                                title="Delete Character"
                                aria-label="Delete ${data.name}">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </li>
        `);

        // Control button template
        this.templateEngine.registerTemplate('controlButton', (data) => `
            <button class="btn ${data.className || 'btn-secondary'} btn-block" 
                    data-action="${data.action}"
                    ${data.disabled ? 'disabled' : ''}>
                ${data.icon ? `<i class="${data.icon}"></i> ` : ''}
                ${data.label}
            </button>
        `);

        // Empty state template
        this.templateEngine.registerTemplate('emptyState', (data) => `
            <div class="character-list-empty">
                <div class="empty-icon">${data.icon || '👤'}</div>
                <div class="empty-message">${data.message}</div>
                ${data.action ? `
                    <button class="btn btn-primary" data-action="${data.action.action}">
                        ${data.action.label}
                    </button>
                ` : ''}
            </div>
        `);
    }

    async onInit() {
        this.setupContainers();
        this.render();
        this.attachEventListeners();
        
        // Listen for character-related events
        this.subscribe('CHARACTER_LIST_UPDATED', () => this.renderList());
        this.subscribe('CHARACTER_SWITCHED', () => this.renderList());
        this.subscribe('CHARACTER_CHANGED', (data) => {
            this.updateProps({ activeCharacterId: data.character?.id });
        });
        
        Logger.info(`[CharacterListPanel] Initialized ${this.componentId}`);
    }

    setupContainers() {
        if (!this.container) {
            throw new Error('CharacterListPanel requires a container element');
        }

        // Create or find sub-containers
        this.controlsContainer = this.container.querySelector('.character-list-controls');
        this.listContainer = this.container.querySelector('.character-list-content');
        
        // Create containers if they don't exist
        if (!this.controlsContainer && this.props.showControls) {
            this.controlsContainer = document.createElement('div');
            this.controlsContainer.className = 'character-list-controls';
            this.container.appendChild(this.controlsContainer);
        }
        
        if (!this.listContainer) {
            this.listContainer = document.createElement('div');
            this.listContainer.className = 'character-list-content';
            this.container.appendChild(this.listContainer);
        }
    }

    render() {
        if (!this.container) {
            Logger.warn(`[CharacterListPanel] No container provided for ${this.componentId}`);
            return;
        }

        this.renderControls();
        this.renderList();
        
        this.performanceMetrics.renderCount++;
        Logger.debug(`[CharacterListPanel] Rendered ${this.componentId}`);
    }

    renderControls() {
        if (!this.controlsContainer || !this.props.showControls) return;
        
        const buttons = [];
        
        if (this.props.allowCreate) {
            buttons.push(this.templateEngine.render('controlButton', {
                action: 'new-character',
                label: 'New Character',
                className: 'btn-primary',
                icon: null
            }));
        }
        
        if (this.props.allowImport) {
            buttons.push(this.templateEngine.render('controlButton', {
                action: 'import-character',
                label: 'Import',
                className: 'btn-secondary',
                icon: null
            }));
        }
        
        this.controlsContainer.innerHTML = buttons.join('');
    }

    renderList() {
        if (!this.listContainer) return;
        
        const characterManager = this.props.characterManager;
        if (!characterManager) {
            this.listContainer.innerHTML = this.templateEngine.render('emptyState', {
                message: 'No character manager available',
                icon: '⚠️'
            });
            return;
        }

        const characters = characterManager.getAllCharacters();
        
        if (!characters || characters.length === 0) {
            this.listContainer.innerHTML = this.templateEngine.render('emptyState', {
                message: 'No characters found. Create your first character!',
                icon: '👤',
                action: this.props.allowCreate ? {
                    action: 'new-character',
                    label: 'Create Character'
                } : null
            });
            return;
        }

        const characterItems = characters.map(character => 
            this.templateEngine.render('characterListItem', {
                id: character.id,
                name: character.name || 'Unnamed Character',
                tier: character.tier || 'N/A',
                type: character.characterType || 'standard',
                isActive: character.id === this.props.activeCharacterId,
                allowDelete: this.props.allowDelete
            })
        ).join('');
        
        this.listContainer.innerHTML = `
            <ul class="character-list">
                ${characterItems}
            </ul>
        `;
    }


    attachEventListeners() {
        // Controls event handling
        if (this.controlsContainer) {
            this.addEventListener(this.controlsContainer, 'click', (e) => {
                const action = e.target.dataset.action;
                
                switch (action) {
                    case 'new-character':
                        this.handleNewCharacter();
                        break;
                    case 'import-character':
                        this.handleImportCharacter();
                        break;
                }
            });
        }

        // List event handling
        if (this.listContainer) {
            this.addEventListener(this.listContainer, 'click', (e) => {
                Logger.debug(`[CharacterListPanel] Click event received on:`, e.target);
                
                // Find the nearest element with a data-action attribute
                const actionElement = e.target.closest('[data-action]');
                const action = actionElement?.dataset.action;
                const listItem = e.target.closest('.character-list-item');
                
                Logger.debug(`[CharacterListPanel] Action found:`, action);
                Logger.debug(`[CharacterListPanel] List item found:`, listItem);
                
                if (!listItem) {
                    Logger.debug(`[CharacterListPanel] No list item found, ignoring click`);
                    return;
                }
                
                const characterId = listItem.dataset.characterId;
                Logger.info(`[CharacterListPanel] Character list action: ${action} for character: ${characterId}`);
                
                switch (action) {
                    case 'select-character':
                        this.handleSelectCharacter(characterId);
                        break;
                    case 'edit-character':
                        this.handleEditCharacter(characterId);
                        break;
                    case 'delete-character':
                        this.handleDeleteCharacter(characterId);
                        break;
                    default:
                        Logger.debug(`[CharacterListPanel] Unknown action: ${action}`);
                }
            });
        }
    }

    handleNewCharacter() {
        Logger.debug(`[CharacterListPanel] New character requested`);
        this.emitComponentEvent('character-create-requested');
    }

    handleImportCharacter() {
        Logger.debug(`[CharacterListPanel] Import character requested`);
        this.emitComponentEvent('character-import-requested');
    }

    handleSelectCharacter(characterId) {
        Logger.debug(`[CharacterListPanel] Character selection requested: ${characterId}`);
        this.emitComponentEvent('character-select-requested', { characterId });
    }

    handleEditCharacter(characterId) {
        Logger.debug(`[CharacterListPanel] Character edit requested: ${characterId}`);
        this.emitComponentEvent('character-edit-requested', { characterId });
    }

    handleDeleteCharacter(characterId) {
        if (!this.props.allowDelete) return;
        
        Logger.debug(`[CharacterListPanel] Character deletion requested: ${characterId}`);
        
        const character = this.props.characterManager.getCharacter(characterId);
        const characterName = character?.name || 'Unknown Character';
        
        // Emit delete request with confirmation data
        this.emitComponentEvent('character-delete-requested', { 
            characterId, 
            characterName,
            requireConfirmation: true 
        });
    }

    /**
     * Legacy support methods for backward compatibility
     */
    async init() {
        return this.onInit();
    }
}