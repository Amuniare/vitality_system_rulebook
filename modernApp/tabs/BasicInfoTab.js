// modernApp/tabs/BasicInfoTab.js
import { StateManager } from '../core/StateManager.js';
import { EventBus } from '../core/EventBus.js';
import { Logger } from '../utils/Logger.js'; // Import Logger

export class BasicInfoTab {
    constructor(container) { // Accept container
        this.container = container; // Store it
        this.characterCache = null; // Cache to compare for changes

        EventBus.on('CHARACTER_LOADED', (data) => { // Listen for initial load or switch
            if (this.container && this.container.style.display !== 'none') { // Check if tab is active
                 this.updateDisplay(data.character);
                 Logger.debug('[BasicInfoTab] Display updated via CHARACTER_LOADED event.');
            }
        });
        EventBus.on('CHARACTER_CHANGED', (data) => { // Listen for updates
            if (this.container && this.container.style.display !== 'none') {
                 this.updateDisplay(data.character);
                 Logger.debug('[BasicInfoTab] Display updated via CHARACTER_CHANGED event.');
            }
        });
    }

    async init() {
        // Container is now passed in constructor, no need to find it here.
        // this.render() will be called by app.js when the tab is switched to.
        // However, for initial load if this is the default tab, app.js will call render.
        // We can pre-populate characterCache here if needed or rely on first render.
        const character = StateManager.getCharacter();
        this.characterCache = { ...character };
        Logger.info('[BasicInfoTab] Initialized.');
    }
    
    render() {
        if (!this.container) {
            Logger.error("[BasicInfoTab] Cannot render, container is not set.");
            return;
        }
        const character = StateManager.getCharacter();
        this.characterCache = { ...character }; // Update cache on render
        
        // The content itself, no longer querying for #basic-info-tab
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
            // Prevent duplicate listeners if render is called multiple times
            if (!saveButton.hasAttribute('data-listener-attached')) {
                saveButton.addEventListener('click', () => {
                    this.saveBasicInfo();
                });
                saveButton.setAttribute('data-listener-attached', 'true');
            }
        }
        
        const nameInput = this.container.querySelector('#character-name');
        if (nameInput) {
            if (!nameInput.hasAttribute('data-listener-attached')) {
                nameInput.addEventListener('keyup', (e) => {
                    if (e.key === 'Enter') {
                        this.saveBasicInfo();
                    }
                });
                nameInput.setAttribute('data-listener-attached', 'true');
            }
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
        // Use the new StateManager.dispatch method
        StateManager.dispatch('UPDATE_BASIC_INFO', { name, tier }); 
    }
    
    updateDisplay(characterData) {
        if (!this.container) return; 
        const character = characterData || StateManager.getCharacter();
        this.characterCache = { ...character }; 

        const nameInput = this.container.querySelector('#character-name');
        const tierSelect = this.container.querySelector('#character-tier');
        
        if (nameInput && nameInput.value !== character.name) {
            nameInput.value = character.name || '';
        }
        
        if (tierSelect && parseInt(tierSelect.value) !== character.tier) {
            tierSelect.value = character.tier || 4; // Default to tier 4 if undefined
        }
        Logger.debug('[BasicInfoTab] Display fields updated.');
    }

    cleanup() {
        // If EventBus listeners were added with specific bound functions, remove them here.
        // For now, assuming global listeners or listeners that don't need specific cleanup here
        // beyond what app.js might do for the tab instance itself.
        // If delegated listeners were added to this.container, they should be removed if the
        // container itself is not destroyed.
        Logger.info('[BasicInfoTab] Cleanup called.');
    }
}