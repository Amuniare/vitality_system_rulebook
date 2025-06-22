// modernApp/tabs/BasicInfoTab.js
import { StateManager } from '../core/StateManager.js';
import { EventBus } from '../core/EventBus.js';
import { Logger } from '../utils/Logger.js';

export class BasicInfoTab {
    constructor(container) {
        this.container = container;
        this.characterCache = null; 

        // Store bound handlers to properly remove them later
        this._boundUpdateHandler = this.handleCharacterStateUpdate.bind(this);

        EventBus.on('CHARACTER_LOADED', this._boundUpdateHandler);
        EventBus.on('CHARACTER_CHANGED', this._boundUpdateHandler);
    }

    async init() {
        const character = StateManager.getCharacter();
        this.characterCache = JSON.stringify(this.extractRelevantData(character)); // Cache relevant parts as string
        Logger.info('[BasicInfoTab] Initialized.');
        // Render will be called by app.js when tab is made active or on first load if default.
    }
    
    extractRelevantData(character) {
        // Only cache data that this tab directly displays/modifies
        return {
            name: character.name,
            tier: character.tier
        };
    }

    handleCharacterStateUpdate(data) { // data can be { character } or { character, updates }
        const character = data.character || data; // Get the full character object
        const newRelevantData = JSON.stringify(this.extractRelevantData(character));

        // Only re-render if relevant data changed AND tab is visible
        if (newRelevantData !== this.characterCache) {
            this.characterCache = newRelevantData; // Update cache
            if (this.container && this.container.style.display !== 'none') {
                Logger.debug('[BasicInfoTab] Relevant character data changed, re-rendering.');
                this.render(); 
            }
        }
    }
    
    render() {
        if (!this.container) {
            Logger.error("[BasicInfoTab] Cannot render, container is not set.");
            return;
        }
        const character = StateManager.getCharacter();
        // Update cache with the character data being rendered
        this.characterCache = JSON.stringify(this.extractRelevantData(character)); 
        
        this.container.innerHTML = ` 
            <div class="tab-header">
                <h2>Basic Information</h2>
            </div>
            
            <div class="form-group">
                <label for="character-name">Character Name</label>
                <input type="text" 
                       id="character-name" 
                       class="form-input"
                       value="${character.name || ''}"
                       placeholder="Enter character name">
            </div>
            
            <div class="form-group">
                <label for="character-tier">Tier</label>
                <select id="character-tier" class="form-select">
                    ${this.renderTierOptions(character.tier)}
                </select>
            </div>
            
            <button class="btn btn-primary" data-action="save-basic-info">
                Save Changes
            </button>
        `;
        
        this.setupEventListeners();
        Logger.info('[BasicInfoTab] Rendered.');
    }
    
    renderTierOptions(currentTier) {
        const tiers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        return tiers.map(tier => `
            <option value="${tier}" ${tier === currentTier ? 'selected' : ''}>
                Tier ${tier}
            </option>
        `).join('');
    }
    
    setupEventListeners() {
        if (!this.container) return; 
        const saveButton = this.container.querySelector('[data-action="save-basic-info"]');
        if (saveButton) {
            if (saveButton._clickHandler) { // Remove old if exists
                saveButton.removeEventListener('click', saveButton._clickHandler);
            }
            saveButton._clickHandler = () => this.saveBasicInfo(); // Store ref
            saveButton.addEventListener('click', saveButton._clickHandler);
        }
        
        const nameInput = this.container.querySelector('#character-name');
        if (nameInput) {
             if (nameInput._keyUpHandler) {
                nameInput.removeEventListener('keyup', nameInput._keyUpHandler);
            }
            nameInput._keyUpHandler = (e) => {
                if (e.key === 'Enter') this.saveBasicInfo();
            };
            nameInput.addEventListener('keyup', nameInput._keyUpHandler);
        }
    }
    
    saveBasicInfo() {
        if (!this.container) return; 
        const nameInput = this.container.querySelector('#character-name');
        const tierSelect = this.container.querySelector('#character-tier');

        if (!nameInput || !tierSelect) {
            Logger.warn('[BasicInfoTab] Could not find form elements to save.');
            return;
        }

        const name = nameInput.value.trim();
        const tier = parseInt(tierSelect.value);
        
        Logger.debug(`[BasicInfoTab] Saving basic info: Name - ${name}, Tier - ${tier}`);
        StateManager.dispatch('UPDATE_BASIC_INFO', { name, tier }); 
        // The CHARACTER_CHANGED event from dispatch will trigger handleCharacterStateUpdate,
        // which will update the cache and, if necessary, re-render (though likely not needed if inputs match).
    }
    
    // updateDisplay is effectively replaced by the logic in handleCharacterStateUpdate calling render()
    // if relevant data changes.

    cleanup() {
        // Remove specific listeners
        EventBus.off('CHARACTER_LOADED', this._boundUpdateHandler);
        EventBus.off('CHARACTER_CHANGED', this._boundUpdateHandler);

        // Remove listeners from DOM elements if container might persist
        if (this.container) {
            const saveButton = this.container.querySelector('[data-action="save-basic-info"]');
            if (saveButton && saveButton._clickHandler) {
                saveButton.removeEventListener('click', saveButton._clickHandler);
                delete saveButton._clickHandler;
            }
            const nameInput = this.container.querySelector('#character-name');
            if (nameInput && nameInput._keyUpHandler) {
                nameInput.removeEventListener('keyup', nameInput._keyUpHandler);
                delete nameInput._keyUpHandler;
            }
        }
        Logger.info('[BasicInfoTab] Cleanup called.');
    }
}