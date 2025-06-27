
// modernApp/tabs/BasicInfoTab.js
import { Component } from '../core/Component.js';
import { StateManager } from '../core/StateManager.js'; // Still needed for dispatching actions
import { Logger } from '../utils/Logger.js';
import { connectToState } from '../core/StateConnector.js'; // Import StateConnector

// This is the "Dumb" presentational component
class BasicInfoTab extends Component {
    static propSchema = {
        characterName: { type: 'string', default: 'New Character' },
        characterTier: { type: 'number', default: 4 },
        character: { type: 'object', default: {} }
    };

    constructor(container, initialProps = {}) {
        // Props are now fully managed by the Component base class via propSchema
        // and passed by the ConnectedComponent wrapper.
        super(initialProps, container); 
        Logger.info(`[BasicInfoTab][Dumb] Constructed with props:`, this.props);
    }

    async init() {
        // No direct subscriptions needed here anymore for prop updates.
        // StateConnector handles subscribing to StateManager and calling `this.update()`.
        Logger.info('[BasicInfoTab][Dumb] Initialized.');
    }
    
    onRender() {
        const name = this.props.characterName;
        const tier = this.props.characterTier;

        this.container.innerHTML = ` 
            <div class="tab-header">
                <h2>Basic Information</h2>
                <p>Set your character's fundamental details.</p>
            </div>
            
            <div class="form-group">
                <label for="basic-info-character-name-${this.props.id || 'default'}">Character Name</label>
                <input type="text" 
                       id="basic-info-character-name-${this.props.id || 'default'}" 
                       class="form-input"
                       value="${name || ''}"
                       placeholder="Enter character name">
            </div>
            
            <div class="form-group">
                <label for="basic-info-character-tier-${this.props.id || 'default'}">Tier</label>
                <select id="basic-info-character-tier-${this.props.id || 'default'}" class="form-select">
                    ${this.renderTierOptions(tier)}
                </select>
            </div>
            
            <button class="btn btn-primary" data-action="save-basic-info">
                Save Basic Info
            </button>
        `;
        
        this.attachLocalEventListeners();
        Logger.info('[BasicInfoTab][Dumb] Rendered with props:', this.props);
    }
    
    renderTierOptions(currentTier) {
        const tiers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        return tiers.map(tier => `
            <option value="${tier}" ${tier === currentTier ? 'selected' : ''}>
                Tier ${tier}
            </option>
        `).join('');
    }
    
    attachLocalEventListeners() {
        // DOM listeners are still managed by the Component base class methods
        const saveButton = this.container.querySelector('[data-action="save-basic-info"]');
        if (saveButton) {
            this._addEventListener(saveButton, 'click', this.handleSaveBasicInfo);
        }
        
        const nameInput = this.container.querySelector(`#basic-info-character-name-${this.props.id || 'default'}`);
        if (nameInput) {
            this._addEventListener(nameInput, 'keyup', (e) => {
                if (e.key === 'Enter') this.handleSaveBasicInfo();
            });
        }
    }
    
    async handleSaveBasicInfo() {
        if (!this.container) return; 
        const nameInput = this.container.querySelector(`#basic-info-character-name-${this.props.id || 'default'}`);
        const tierSelect = this.container.querySelector(`#basic-info-character-tier-${this.props.id || 'default'}`);

        if (!nameInput || !tierSelect) {
            Logger.warn('[BasicInfoTab][Dumb] Could not find form elements to save.');
            return;
        }

        const name = nameInput.value.trim();
        const tier = parseInt(tierSelect.value);
        
        Logger.debug(`[BasicInfoTab][Dumb] Saving basic info: Name - ${name}, Tier - ${tier}`);
        
        try {
            // Use character from props (passed by StateConnector)
            const character = this.props.character || {};
            
            // Update the specific fields
            const updatedCharacter = {
                ...character,
                name: name,
                tier: tier
            };
            
            // Save to StateManager
            await StateManager.updateState(updatedCharacter, `Updated basic info: ${name}, Tier ${tier}`);
            
            Logger.info('[BasicInfoTab][Dumb] Basic info saved successfully');
        } catch (error) {
            Logger.error('[BasicInfoTab][Dumb] Error saving basic info:', error);
        }
    }
    
    // `update(nextProps)` is inherited from Component.
    // StateConnector will call this method on the dumb component instance
    // when the mapped props change.

    destroy() {
        Logger.info(`[BasicInfoTab][Dumb] Destroying...`);
        super.destroy(); 
    }
}

// mapStateToProps function: Extracts relevant data from global state for this component
const mapStateToPropsBasicInfo = (globalState, ownProps) => {
    // ownProps are props passed directly to the ConnectedComponent instance, not used here yet
    if (!globalState) {
        Logger.warn('[BasicInfoTab][mapStateToProps] Global state is null, returning default props.');
        return {
            characterName: BasicInfoTab.propSchema.characterName.default,
            characterTier: BasicInfoTab.propSchema.characterTier.default,
            character: {}
        };
    }
    return {
        characterName: globalState.name || BasicInfoTab.propSchema.characterName.default,
        characterTier: globalState.tier || BasicInfoTab.propSchema.characterTier.default,
        character: globalState // Pass complete character for save operations
    };
};

// Create and export the "Connected" component with explicit debugging options
const ConnectedBasicInfoTab = connectToState(mapStateToPropsBasicInfo, {
    memoize: false,  // Disable memoization for debugging
    debugMode: true, // Enable enhanced debugging
    displayName: 'BasicInfoTab'
})(BasicInfoTab);

export { ConnectedBasicInfoTab as BasicInfoTab }; // Export connected component as the default for this module
// For testing or advanced usage, you might also export the dumb component:
// export { BasicInfoTab as DumbBasicInfoTab, ConnectedBasicInfoTab as BasicInfoTab };

