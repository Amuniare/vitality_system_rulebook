// rulebook/character-builder/ui/tabs/AttributeTab.js
import { AttributeSystem } from '../../systems/AttributeSystem.js';
import { RenderUtils } from '../shared/RenderUtils.js';

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

        console.log('🔍 AttributeTab.render() - Current attributes:', JSON.stringify(character.attributes));

        const pools = this.builder.calculatePointPools();

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

    onCharacterUpdate() {
        console.log('🔄 AttributeTab.onCharacterUpdate called');
        
        if (!this.builder.currentCharacter) {
            console.log('⚪ No current character, skipping update');
            return;
        }
        
        console.log('🔍 Current attributes during update:', JSON.stringify(this.builder.currentCharacter.attributes));
        
        // Update all attribute displays without full re-render
        const character = this.builder.currentCharacter;
        
        // Update attribute values in the UI
        Object.keys(character.attributes).forEach(attrId => {
            const value = character.attributes[attrId] || 0;
            
            // Update the displayed value
            const valueDisplay = document.querySelector(`.attribute-item[data-attr="${attrId}"] .attribute-value`);
            if (valueDisplay) {
                valueDisplay.textContent = value;
            }
            
            // Update the slider
            const slider = document.getElementById(`slider-${attrId}`);
            if (slider && parseInt(slider.value) !== value) { // FIX: Parse slider value for comparison
                slider.value = value;
            }
            
            // Update slider ticks
            const ticksContainer = document.querySelector(`#slider-${attrId} + .slider-ticks`);
            if (ticksContainer) {
                const ticks = ticksContainer.querySelectorAll('.tick');
                ticks.forEach((tick, index) => {
                    tick.classList.toggle('filled', index <= value);
                });
            }
            
            // Update button states
            const minusBtn = document.querySelector(`[data-attr="${attrId}"][data-change="-1"]`);
            const plusBtn = document.querySelector(`[data-attr="${attrId}"][data-change="1"]`);
            if (minusBtn) minusBtn.disabled = value <= 0;
            if (plusBtn) plusBtn.disabled = value >= character.tier;
        });
        
        // FIX: Also update point pool displays within this tab
        const pools = this.builder.calculatePointPools();
        
        // Update combat attributes pool status
        const combatPoolStatus = document.querySelector('.combatAttributes .pool-status');
        if (combatPoolStatus) {
            const combatSpent = pools.totalSpent.combatAttributes || 0;
            const combatAvailable = pools.totalAvailable.combatAttributes || 0;
            const combatRemaining = pools.remaining.combatAttributes || 0;
            
            combatPoolStatus.className = `pool-status ${combatRemaining < 0 ? 'over-budget' : combatRemaining === 0 && combatSpent > 0 ? 'fully-used' : ''}`;
            combatPoolStatus.innerHTML = `
                Points: <span class="points-display">${combatSpent}/${combatAvailable}</span>
                ${combatRemaining < 0 ? `<span class="error-text"> (OVER BUDGET by ${Math.abs(combatRemaining)})</span>` : ''}
            `;
        }
        
        // Update utility attributes pool status
        const utilityPoolStatus = document.querySelector('.utilityAttributes .pool-status');
        if (utilityPoolStatus) {
            const utilitySpent = pools.totalSpent.utilityAttributes || 0;
            const utilityAvailable = pools.totalAvailable.utilityAttributes || 0;
            const utilityRemaining = pools.remaining.utilityAttributes || 0;
            
            utilityPoolStatus.className = `pool-status ${utilityRemaining < 0 ? 'over-budget' : utilityRemaining === 0 && utilitySpent > 0 ? 'fully-used' : ''}`;
            utilityPoolStatus.innerHTML = `
                Points: <span class="points-display">${utilitySpent}/${utilityAvailable}</span>
                ${utilityRemaining < 0 ? `<span class="error-text"> (OVER BUDGET by ${Math.abs(utilityRemaining)})</span>` : ''}
            `;
        }
    }

    // ADD a method to force a visual refresh if needed:
    refreshAttributeDisplays() {
        console.log('🔄 AttributeTab.refreshAttributeDisplays called');
        this.onCharacterUpdate();
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
            titleTag: 'label',
            description: description,
            dataAttributes: { attr: attrId }, // Add data-attr to card itself
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

    changeAttribute(attrId, change) {
        const character = this.builder.currentCharacter;
        if (!character) return;

        const currentValue = character.attributes[attrId] || 0;
        const newValue = Math.max(0, Math.min(character.tier, currentValue + change));
        this.updateAttributeValue(attrId, newValue);
    }

    setAttributeViaSlider(attrId, newValue) {
        this.updateAttributeValue(attrId, parseInt(newValue));
    }

    updateAttributeValue(attrId, newValue) {
        const character = this.builder.currentCharacter;
        if (!character) {
            console.error('❌ No current character in updateAttributeValue');
            return;
        }
        
        const oldValue = character.attributes[attrId] || 0;
        console.log(`🔄 Updating ${attrId}: ${oldValue} → ${newValue}`);

        if (oldValue === newValue) {
            console.log(`⚪ No change for ${attrId}`);
            return; // No change
        }

        const validation = AttributeSystem.validateAttributeAssignment(character, attrId, newValue);
        if (!validation.isValid) {
            console.error(`❌ Validation failed for ${attrId}:`, validation.errors);
            this.builder.showNotification(validation.errors.join(', '), 'error');
            // Re-render to show previous valid state
            this.render();
            return;
        }

        // EXPLICITLY save the value
        character.attributes[attrId] = newValue;
        character.touch(); // Ensure lastModified is updated
        
        console.log(`✅ Saved ${attrId} = ${newValue}`);
        console.log('🔍 Current character attributes:', JSON.stringify(character.attributes));
        
        this.builder.updateCharacter(); // This triggers re-render and point pool updates
    }
}