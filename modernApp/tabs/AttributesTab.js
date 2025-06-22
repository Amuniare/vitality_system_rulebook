// modernApp/tabs/AttributesTab.js
import { StateManager } from '../core/StateManager.js';
import { EventBus } from '../core/EventBus.js';
import { Logger } from '../utils/Logger.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { PointPoolDisplay } from '../components/PointPoolDisplay.js'; // Existing Component

export class AttributesTab {
    constructor(container) {
        this.container = container;
        this.attributeDefinitions = {
            combat: [],
            utility: []
        };
        this.characterCache = null; 

        this.combatPoolDisplay = null;
        this.utilityPoolDisplay = null;

        this._boundHandleCharacterUpdate = this.handleCharacterStateUpdate.bind(this);
    }

    async init() {
        await this.loadAttributeDefinitions();
        EventBus.on('CHARACTER_LOADED', this._boundHandleCharacterUpdate);
        EventBus.on('CHARACTER_CHANGED', this._boundHandleCharacterUpdate);

        const character = StateManager.getCharacter();
        this.characterCache = JSON.stringify(this.extractRelevantData(character));

        Logger.info('[AttributesTab] Initialized.');
    }

    async loadAttributeDefinitions() {
        const allAttributes = EntityLoader.getEntitiesByType('attribute');
        allAttributes.forEach(attr => {
            // Assuming attributes.json ui.category is 'combat' or 'utility'
            if (attr.ui?.category === 'combat') {
                this.attributeDefinitions.combat.push(attr);
            } else if (attr.ui?.category === 'utility') {
                this.attributeDefinitions.utility.push(attr);
            }
        });
        Logger.debug('[AttributesTab] Attribute definitions loaded:', this.attributeDefinitions);
    }
    
    extractRelevantData(character) {
        return {
            attributes: character.attributes,
            tier: character.tier // Tier influences available points
        };
    }

    handleCharacterStateUpdate(data) {
        const character = data.character || data;
        const newRelevantData = JSON.stringify(this.extractRelevantData(character));

        if (newRelevantData !== this.characterCache) {
            this.characterCache = newRelevantData;
            if (this.container && this.container.style.display !== 'none') {
                Logger.debug('[AttributesTab] Relevant character data changed, re-rendering.');
                this.render();
            }
        } else if (this.container && this.container.style.display !== 'none' && (!this.combatPoolDisplay || !this.utilityPoolDisplay)) {
            // If tab becomes visible and displays haven't been initialized, render.
            this.render();
        }
    }

    render() {
        if (!this.container) {
            Logger.error("[AttributesTab] Cannot render, container is not set.");
            return;
        }
        const character = StateManager.getCharacter();
        this.characterCache = JSON.stringify(this.extractRelevantData(character));

        this.container.innerHTML = `
            <div class="tab-header"> {/* Existing: modernApp/css/partials/06-tab-content.css (though mostly for animation) & global h2/p */}
                <h2>Attributes</h2>
                <p>Allocate points to your Combat and Utility attributes. These form the core of your character's capabilities.</p>
            </div>

            {/* Using existing .section-content for consistent section appearance from modernApp/css/partials/08-section-content.css */}
            <div class="section-content">
                {/* Assuming h3 picks up global or .section-header h3 styles from modernApp/css/partials/08-section-content.css */}
                <div class="section-header"><h3>Combat Attributes</h3></div>
                <div id="combat-attributes-pool-display"></div>
                {/* Using existing .purchase-grid for layout if attributes are card-like modernApp/css/partials/09-purchase-cards.css */}
                <div id="combat-attributes-list" class="purchase-grid"></div>
            </div>

            <div class="section-content">
                <div class="section-header"><h3>Utility Attributes</h3></div>
                <div id="utility-attributes-pool-display"></div>
                <div id="utility-attributes-list" class="purchase-grid"></div>
            </div>
        `;

        const combatPoolContainer = this.container.querySelector('#combat-attributes-pool-display');
        if (combatPoolContainer) {
            if (this.combatPoolDisplay) this.combatPoolDisplay.cleanup();
            this.combatPoolDisplay = new PointPoolDisplay({
                showMainPool: false, showCombatAttr: true, showUtilityAttr: false,
                showValidation: false, compact: false // Using full display for clarity here
            });
            this.combatPoolDisplay.init(combatPoolContainer); // PointPoolDisplay handles its own styling
        }

        const utilityPoolContainer = this.container.querySelector('#utility-attributes-pool-display');
        if (utilityPoolContainer) {
            if (this.utilityPoolDisplay) this.utilityPoolDisplay.cleanup();
            this.utilityPoolDisplay = new PointPoolDisplay({
                showMainPool: false, showCombatAttr: false, showUtilityAttr: true,
                showValidation: false, compact: false
            });
            this.utilityPoolDisplay.init(utilityPoolContainer);
        }
        
        this.renderAttributeControls(character);
        this.setupEventListeners();
        Logger.info('[AttributesTab] Rendered.');
    }

    renderAttributeControls(character) {
        const combatList = this.container.querySelector('#combat-attributes-list');
        const utilityList = this.container.querySelector('#utility-attributes-list');

        if (!combatList || !utilityList) {
            Logger.error('[AttributesTab] Attribute list containers not found.');
            return;
        }

        combatList.innerHTML = this.attributeDefinitions.combat
            .map(attrDef => this.renderSingleAttributeControl(attrDef, character.attributes?.[attrDef.id] || 0))
            .join('');

        utilityList.innerHTML = this.attributeDefinitions.utility
            .map(attrDef => this.renderSingleAttributeControl(attrDef, character.attributes?.[attrDef.id] || 0))
            .join('');
    }

    renderSingleAttributeControl(attrDef, currentValue) {
        const descriptionHtml = attrDef.description.replace(/\\n/g, '<br>');

        // Using .purchase-card as the main wrapper for each attribute item.
        // .purchase-card is display:flex, flex-direction:column.
        // Its direct children (.card-header, .card-description, and the .char-actions div) will stack vertically.
        return `
            <div class="purchase-card" data-attr-id="${attrDef.id}">
                {/* .card-header is display:flex, justify-content:space-between. Good for name and current value. */}
                <div class="card-header">
                    <h4>${attrDef.name}</h4>
                    {/* Using .pool-value for consistent styling of the attribute number */}
                    <span class="pool-value">${currentValue}</span>
                </div>

                {/* .card-description for the text */}
                <p class="card-description">${descriptionHtml}</p>
                
                {/* .char-actions is display:flex. Adding inline style to push to right if needed. */}
                {/* margin-top: auto pushes this block to the bottom of the flex-column .purchase-card */}
                <div class="char-actions" style="margin-top: auto; align-self: flex-end;">
                    {/* Using existing .btn-icon for +/- buttons. Their styling is in 04-layout-structure.css */}
                    <button class="btn-icon" data-action="decrease" aria-label="Decrease ${attrDef.name}">
                        <i class="icon-minus">−</i> {/* Ensure you have .icon-minus or style for i tags */}
                    </button>
                    {/* The value is already in the header, so not repeated here with buttons unless preferred */}
                    <button class="btn-icon" data-action="increase" aria-label="Increase ${attrDef.name}">
                        <i class="icon-plus">+</i> {/* Ensure you have .icon-plus */}
                    </button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        if (!this.container) return;

        // Remove previous listener to prevent multiple attachments
        if (this.container._attributeClickListener) {
            this.container.removeEventListener('click', this.container._attributeClickListener);
        }

        this.container._attributeClickListener = (event) => {
            // Target the button itself, assuming .btn-icon is specific enough for these controls
            const button = event.target.closest('.char-actions .btn-icon');
            if (!button) return;

            // Find the parent .purchase-card to get the attribute ID
            const controlDiv = button.closest('.purchase-card');
            if (!controlDiv) return;

            const attributeId = controlDiv.dataset.attrId;
            const action = button.dataset.action;
            const change = action === 'increase' ? 1 : -1;

            this.handleAttributeChange(attributeId, change);
        };
        this.container.addEventListener('click', this.container._attributeClickListener);
    }

    handleAttributeChange(attributeId, change) {
        const character = StateManager.getCharacter();
        const currentAttributes = character.attributes || {};
        const currentValue = currentAttributes[attributeId] || 0;
        const newValue = currentValue + change;

        if (newValue < 0) {
            Logger.debug(`[AttributesTab] Attribute ${attributeId} cannot be less than 0.`);
            return; 
        }

        Logger.debug(`[AttributesTab] Updating attribute: ${attributeId} from ${currentValue} to ${newValue}`);
        StateManager.updateAttribute(attributeId, newValue);
    }

    cleanup() {
        EventBus.off('CHARACTER_LOADED', this._boundHandleCharacterUpdate);
        EventBus.off('CHARACTER_CHANGED', this._boundHandleCharacterUpdate);

        if (this.container && this.container._attributeClickListener) {
            this.container.removeEventListener('click', this.container._attributeClickListener);
            delete this.container._attributeClickListener; // Clean up the stored reference
        }
        if (this.combatPoolDisplay) {
            this.combatPoolDisplay.cleanup();
            this.combatPoolDisplay = null;
        }
        if (this.utilityPoolDisplay) {
            this.utilityPoolDisplay.cleanup();
            this.utilityPoolDisplay = null;
        }
        Logger.info('[AttributesTab] Cleanup called.');
    }
}