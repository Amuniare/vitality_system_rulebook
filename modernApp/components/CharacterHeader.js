
// modernApp/components/CharacterHeader.js
import { Component } from '../core/Component.js';
import { Logger } from '../utils/Logger.js';
import { Formatters } from '../utils/Formatters.js';
import { EventBus } from '../core/EventBus.js';

/**
 * Universal CharacterHeader component following the architecture pattern
 * Displays character name, tier, and type with editable functionality
 */
export class CharacterHeader extends Component {
    static propSchema = {
        character: { type: 'object', default: null },
        editable: { type: 'boolean', default: true },
        showType: { type: 'boolean', default: true },
        showTier: { type: 'boolean', default: true }
    };

    constructor(props = {}, container = null) {
        super(props, container);
        
        this.editMode = false;
        this.originalName = '';
        
        Logger.debug(`[CharacterHeader] Created with ID ${this.componentId}`);
    }

    async onInit() {
        this.render();
        this.attachEventListeners();
        
        Logger.info(`[CharacterHeader] Initialized ${this.componentId}`);
    }

    render() {
        if (!this.container) {
            Logger.warn(`[CharacterHeader] No container provided for ${this.componentId}`);
            return;
        }

        const character = this.props.character;
        
        if (!character) {
            this.container.innerHTML = '<div class="character-header-empty">No character loaded</div>';
            return;
        }

        const name = character.name || 'Unnamed Character';
        const tier = character.tier || 'N/A';
        const type = character.characterType || 'standard';

        this.container.innerHTML = `
            <div class="character-header-main">
                ${this.renderNameSection(name)}
                ${this.renderMetaSection(tier, type)}
            </div>
        `;
        
        this.performanceMetrics.renderCount++;
        Logger.debug(`[CharacterHeader] Rendered ${this.componentId} for character: "${name}"`);
    }

    renderNameSection(name) {
        if (this.props.editable) {
            return `
                <div class="character-name-section">
                    <h1 class="character-name" data-action="edit-name" title="Click to edit">${name}</h1>
                    <input type="text" class="character-name-input" value="${name}" style="display: none;">
                    <div class="character-name-controls" style="display: none;">
                        <button class="btn btn-sm btn-primary" data-action="save-name">Save</button>
                        <button class="btn btn-sm btn-secondary" data-action="cancel-name">Cancel</button>
                    </div>
                </div>
            `;
        } else {
            return `<h1 class="character-name">${name}</h1>`;
        }
    }

    renderMetaSection(tier, type) {
        const items = [];
        
        if (this.props.showTier) {
            items.push(`<span class="meta-item"><strong>Tier:</strong> ${tier}</span>`);
        }
        
        if (this.props.showType) {
            items.push(`<span class="meta-item"><strong>Type:</strong> ${Formatters.camelToTitle(type)}</span>`);
        }
        
        if (items.length === 0) return '';
        
        return `
            <div class="character-meta">
                ${items.join('')}
            </div>
        `;
    }

    attachEventListeners() {
        if (!this.props.editable) return;
        
        this.addEventListener(this.container, 'click', (e) => {
            const action = e.target.dataset.action;
            
            switch (action) {
                case 'edit-name':
                    this.enterEditMode();
                    break;
                case 'save-name':
                    this.saveName();
                    break;
                case 'cancel-name':
                    this.cancelEdit();
                    break;
            }
        });

        this.addEventListener(this.container, 'keydown', (e) => {
            if (this.editMode && e.target.classList.contains('character-name-input')) {
                if (e.key === 'Enter') {
                    this.saveName();
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            }
        });
    }

    enterEditMode() {
        if (!this.props.character) return;
        
        this.editMode = true;
        this.originalName = this.props.character.name;
        
        const nameElement = this.container.querySelector('.character-name');
        const inputElement = this.container.querySelector('.character-name-input');
        const controlsElement = this.container.querySelector('.character-name-controls');
        
        if (nameElement && inputElement && controlsElement) {
            nameElement.style.display = 'none';
            inputElement.style.display = 'block';
            controlsElement.style.display = 'block';
            inputElement.focus();
            inputElement.select();
        }
    }

    saveName() {
        const inputElement = this.container.querySelector('.character-name-input');
        if (!inputElement) return;
        
        const newName = inputElement.value.trim();
        if (!newName) {
            this.cancelEdit();
            return;
        }
        
        // Emit character name change event
        this.emitComponentEvent('character-name-changed', {
            characterId: this.props.character.id,
            oldName: this.originalName,
            newName: newName
        });
        
        this.exitEditMode();
    }

    cancelEdit() {
        const inputElement = this.container.querySelector('.character-name-input');
        if (inputElement) {
            inputElement.value = this.originalName;
        }
        this.exitEditMode();
    }

    exitEditMode() {
        this.editMode = false;
        
        const nameElement = this.container.querySelector('.character-name');
        const inputElement = this.container.querySelector('.character-name-input');
        const controlsElement = this.container.querySelector('.character-name-controls');
        
        if (nameElement && inputElement && controlsElement) {
            nameElement.style.display = 'block';
            inputElement.style.display = 'none';
            controlsElement.style.display = 'none';
        }
    }

    /**
     * Public method for backward compatibility
     * Note: Props should be updated through StateConnector, not directly
     */
    updateCharacter(character) {
        Logger.warn(`[CharacterHeader] updateCharacter called directly - props should be updated through StateConnector`);
        // Removed direct updateProps call to prevent infinite recursion
    }
}
