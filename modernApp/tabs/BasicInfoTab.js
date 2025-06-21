import { StateManager } from '../core/StateManager.js';
import { EventBus } from '../core/EventBus.js';

export class BasicInfoTab {
    constructor(container) {
        this.container = container;
        
        EventBus.on('character-updated', (data) => {
            if (data.changes.includes('basicInfo')) {
                this.updateDisplay();
            }
        });
    }
    
    render() {
        const character = StateManager.getCharacter();
        
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
        // Save button
        this.container.querySelector('[data-action="save-basic-info"]').addEventListener('click', () => {
            this.saveBasicInfo();
        });
        
        // Enter key in name field
        this.container.querySelector('#character-name').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.saveBasicInfo();
            }
        });
    }
    
    saveBasicInfo() {
        const name = this.container.querySelector('#character-name').value.trim();
        const tier = parseInt(this.container.querySelector('#character-tier').value);
        
        StateManager.dispatch('UPDATE_BASIC_INFO', { name, tier });
    }
    
    updateDisplay() {
        // Update only the values, not the whole form
        const character = StateManager.getCharacter();
        const nameInput = this.container.querySelector('#character-name');
        const tierSelect = this.container.querySelector('#character-tier');
        
        if (nameInput && nameInput.value !== character.name) {
            nameInput.value = character.name;
        }
        
        if (tierSelect && parseInt(tierSelect.value) !== character.tier) {
            tierSelect.value = character.tier;
        }
    }
}