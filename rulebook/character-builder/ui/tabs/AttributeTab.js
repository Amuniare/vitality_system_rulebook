// rulebook/character-builder/ui/tabs/AttributeTab.js
import { AttributeSystem } from '../../systems/AttributeSystem.js';
import { RenderUtils } from '../shared/RenderUtils.js'; // Added

export class AttributeTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render() {
        const tabContent = document.getElementById('tab-attributes');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character selected or archetypes incomplete.</p>";
            return;
        }

        const pools = this.builder.calculatePointPools(); // Get fresh pool data

        tabContent.innerHTML = `
            <div class="attributes-section">
                <h2>Assign Attributes</h2>
                <p class="section-description">
                    Allocate your attribute points across combat and utility attributes.
                    Each attribute cannot exceed your tier (${character.tier}).
                </p>

                ${this.renderAttributePoolSection('Combat', 'combatAttributes', ['focus', 'mobility', 'power', 'endurance'], character, pools)}
                ${this.renderAttributePoolSection('Utility', 'utilityAttributes', ['awareness', 'communication', 'intelligence'], character, pools)}
                ${this.renderAttributeRecommendations(character)}

                <div class="next-step">
                    <p><strong>Next Step:</strong> Purchase abilities from your main pool.</p>
                    ${RenderUtils.renderButton({
                        text: 'Continue to Main Pool →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-mainpool' }
                    })}
                </div>
            </div>
        `;
        this.setupEventListeners();
    }

    renderAttributePoolSection(title, poolKey, attributeIds, character, pools) {
        const poolData = pools.totalAvailable[poolKey] !== undefined ? {
            spent: pools.totalSpent[poolKey] || 0,
            available: pools.totalAvailable[poolKey] || 0,
            remaining: pools.remaining[poolKey] || 0
        } : { spent: 0, available: 0, remaining: 0 };


        const attributeDefinitions = AttributeSystem.getAttributeDefinitions();

        return `
            <div class="attribute-pool ${poolKey}">
                <h3>${title} Attributes</h3>
                <div class="pool-status ${poolData.remaining < 0 ? 'over-budget' : poolData.remaining === 0 && poolData.spent > 0 ? 'fully-used' : ''}">
                    Points: <span class="points-display">${poolData.spent}/${poolData.available}</span>
                    ${poolData.remaining < 0 ? `<span class="error-text"> (OVER BUDGET by ${Math.abs(poolData.remaining)})</span>` : ''}
                </div>

                ${RenderUtils.renderGrid(
                    attributeIds,
                    (attrId) => this.renderAttributeControl(
                        attrId,
                        attributeDefinitions[attrId].name,
                        attributeDefinitions[attrId].description,
                        character
                    ),
                    { gridContainerClass: 'grid-layout attribute-grid', gridSpecificClass: 'grid-columns-auto-fit-250' }
                )}
            </div>
        `;
    }

    renderAttributeControl(attrId, name, description, character) {
        const value = character.attributes[attrId] || 0;
        const max = character.tier;

        // Using card base for attribute items
        return RenderUtils.renderCard({
            title: name,
            titleTag: 'label', // Use label for better accessibility with slider
            description: description,
            additionalContent: `
                <div class="attribute-controls">
                    ${RenderUtils.renderButton({ text: '-', classes: ['attr-btn', 'minus'], dataAttributes: { attr: attrId, change: -1, action: 'change-attribute-btn' }, disabled: value <= 0 })}
                    <span class="attribute-value">${value}</span>
                    ${RenderUtils.renderButton({ text: '+', classes: ['attr-btn', 'plus'], dataAttributes: { attr: attrId, change: 1, action: 'change-attribute-btn' }, disabled: value >= max })}
                </div>
                <div class="attribute-limit">Max: ${max}</div>
                <div class="attribute-slider form-group">
                     <input type="range"
                           id="slider-${attrId}"
                           min="0"
                           max="${max}"
                           value="${value}"
                           data-attr="${attrId}"
                           data-action="change-attribute-slider">
                    <div class="slider-ticks">
                        ${Array.from({length: max + 1}, (_, i) => `<span class="tick ${i <= value ? 'filled' : ''}">${i}</span>`).join('')}
                    </div>
                </div>
            `
        }, { cardClass: 'attribute-item', showCost: false, showStatus: false });
    }


    renderAttributeRecommendations(character) {
        const recommendations = AttributeSystem.getAttributeRecommendations(character);
        if (recommendations.length === 0) return '';
        return `
            <div class="attribute-recommendations">
                <h4>Archetype Recommendations</h4>
                <ul>
                    ${recommendations.map(rec => `
                        <li><strong>${AttributeSystem.getAttributeDefinitions()[rec.attribute]?.name || rec.attribute}:</strong> ${rec.reason}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    setupEventListeners() {
        // EventManager at CharacterBuilder will handle data-action clicks/inputs.
    }

    changeAttribute(attrId, change) { // Called by CharacterBuilder's EventManager
        const character = this.builder.currentCharacter;
        if (!character) return;

        const currentValue = character.attributes[attrId] || 0;
        const newValue = Math.max(0, Math.min(character.tier, currentValue + change));
        this.updateAttributeValue(attrId, newValue);
    }

    setAttributeViaSlider(attrId, newValue) { // Called by CharacterBuilder's EventManager
        this.updateAttributeValue(attrId, parseInt(newValue));
    }

    updateAttributeValue(attrId, newValue) {
        const character = this.builder.currentCharacter;
        const oldValue = character.attributes[attrId] || 0;

        if (oldValue === newValue) return; // No change

        const validation = AttributeSystem.validateAttributeAssignment(character, attrId, newValue);
        if (!validation.isValid) {
            this.builder.showNotification(validation.errors.join(', '), 'error');
            // Re-render to show previous valid state (or current invalid state if it was already invalid)
            this.render(); // This might be too broad, ideally just update the specific attribute UI
            return;
        }

        character.attributes[attrId] = newValue;
        this.builder.updateCharacter(); // Triggers re-render of this tab and PointPoolDisplay
    }

    // onCharacterUpdate will be called by CharacterBuilder, triggering a re-render
    // of this tab if it's active, which will update all values.
}
