// modernApp/tabs/BasicInfoTab.js
import { StateManager } from '../core/StateManager.js';
import { EventBus } from '../core/EventBus.js';
import { Logger } from '../utils/Logger.js'; // Import Logger

export class BasicInfoTab {
    constructor(container) {
        this.container = container;
        this.characterCache = null; // Cache to compare for changes

        // EventBus.on('character-updated', (characterData) => { // <-- MODIFIED: characterData is the full character object
        //     // Only update if relevant parts of basic info have actually changed
        //     // or if the cache is not set yet (initial load for this tab instance)
        //     if (!this.characterCache || 
        //         this.characterCache.name !== characterData.name || 
        //         this.characterCache.tier !== characterData.tier) {
        //         this.characterCache = { ...characterData }; // Update cache
        //         this.updateDisplay(characterData);
        //         Logger.debug('[BasicInfoTab] Display updated due to character change.');
        //     }
        // });
        // Simpler approach: always update display if the tab is active
        EventBus.on('character-updated', (characterData) => {
            // Check if this tab is currently active before re-rendering its view
            // This assumes a way to check active tab or that render() is only called when tab is shown
            // For simplicity, if container has content specific to this tab, we update.
            if (this.container.querySelector('.basic-info-tab')) {
                 this.updateDisplay(characterData);
                 Logger.debug('[BasicInfoTab] Display updated via character-updated event.');
            }
        });
    }
    
    render() {
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
    }
    
    updateDisplay(characterData) {
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