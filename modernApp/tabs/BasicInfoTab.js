
// modernApp/tabs/BasicInfoTab.js
import { StateManager } from '../core/StateManager.js';
import { EventBus } from '../core/EventBus.js';
import { Logger } from '../utils/Logger.js'; // Import Logger

export class BasicInfoTab {
    constructor() {
        this.container = null; // Will be set in init
        this.characterCache = null; // Cache to compare for changes

        EventBus.on('character-updated', (characterData) => {
            // Check if this tab is currently active and container is set
            if (this.container && this.container.querySelector('.basic-info-tab')) {
                 this.updateDisplay(characterData);
                 Logger.debug('[BasicInfoTab] Display updated via character-updated event.');
            }
        });
    }

    async init() {
        // BasicInfoTab expects its content to be in a div with id 'basic-info-tab'
        this.container = document.getElementById('basic-info-tab'); 
        if (!this.container) {
            Logger.error('[BasicInfoTab] Specific container #basic-info-tab not found.');
            // Attempt to use the generic tab content div if the specific one isn't found.
            this.container = document.getElementById('tab-content'); 
            if (!this.container) {
                 Logger.error('[BasicInfoTab] Fallback container #tab-content also not found. Cannot initialize.');
                 return; // Cannot render or init further
            }
        }
        
        this.render(); // Render content into its designated container
        Logger.info('[BasicInfoTab] Initialized and rendered.');
    }
    
    render() {
        if (!this.container) {
            Logger.error("[BasicInfoTab] Cannot render, container is not set.");
            return;
        }
        const character = StateManager.getCharacter();
        this.characterCache = { ...character }; // Initialize cache on render
        
        this.container.innerHTML = `
            <div class="tab-content basic-info-tab">
                <h2>Basic Information</h2>
                
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
            </div>
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
        if (!this.container) return; // Guard against null container
        const saveButton = this.container.querySelector('[data-action="save-basic-info"]');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.saveBasicInfo();
            });
        }
        
        const nameInput = this.container.querySelector('#character-name');
        if (nameInput) {
            nameInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this.saveBasicInfo();
                }
            });
        }
    }
    
    saveBasicInfo() {
        if (!this.container) return; // Guard
        const nameInput = this.container.querySelector('#character-name');
        const tierSelect = this.container.querySelector('#character-tier');

        if (!nameInput || !tierSelect) {
            Logger.warn('[BasicInfoTab] Could not find form elements to save.');
            return;
        }

        const name = nameInput.value.trim();
        const tier = parseInt(tierSelect.value);
        
        Logger.debug(`[BasicInfoTab] Saving basic info: Name - ${name}, Tier - ${tier}`);
        StateManager.dispatch('UPDATE_BASIC_INFO', { name, tier }); // Assuming StateManager has a dispatch method
    }
    
    updateDisplay(characterData) {
        if (!this.container) return; // Guard
        // If characterData is not passed, get it from StateManager
        const character = characterData || StateManager.getCharacter();
        this.characterCache = { ...character }; // Update cache

        const nameInput = this.container.querySelector('#character-name');
        const tierSelect = this.container.querySelector('#character-tier');
        
        if (nameInput && nameInput.value !== character.name) {
            nameInput.value = character.name || '';
        }
        
        if (tierSelect && parseInt(tierSelect.value) !== character.tier) {
            tierSelect.value = character.tier;
        }
        Logger.debug('[BasicInfoTab] Display fields updated.');
    }
}
