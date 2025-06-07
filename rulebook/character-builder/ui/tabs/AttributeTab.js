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
            tabContent.innerHTML = "<p>No character selected.</p>";
            return;
        }

        console.log('🔍 AttributeTab.render() - Current attributes:', JSON.stringify(character.attributes));

        const pools = this.builder.calculatePointPools();
this.setupDebugFallbacks();
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
        this.setupDebugFallbacks();
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
            
            // Slider removed - using button-only interface
            
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
                        attributeDefinitions[attrId],
                        character
                    ),
                    { gridContainerClass: 'grid-layout attribute-grid', gridSpecificClass: 'grid-columns-auto-fit-250' }
                )}
            </div>
        `;
    }

    // Render attribute control with enhanced descriptions from attributes.json
    renderAttributeControl(attrId, attributeData, character) {
        const value = character.attributes[attrId] || 0;
        const max = character.tier;

        return RenderUtils.renderCard({
            title: attributeData.name,
            titleTag: 'label',
            description: `
                <div class="attribute-description">
                    <p class="flavor-text"><em>"${attributeData.flavor}"</em></p>
                    <p class="description-text">${attributeData.description}</p>
                    <div class="mechanics-list">
                        <strong>Game Effects:</strong>
                        <ul>
                            ${attributeData.mechanics.map(mechanic => `<li>${mechanic}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `,
            dataAttributes: { attr: attrId },
            additionalContent: `
                <div class="attribute-controls" style="pointer-events: auto;">
                    ${RenderUtils.renderButton({ 
                        text: '-', 
                        classes: ['attr-btn', 'minus'], 
                        dataAttributes: { attr: attrId, change: -1, action: 'change-attribute-btn' }, 
                        disabled: value <= 0
                    })}
                    <span class="attribute-value">${value}</span>
                    ${RenderUtils.renderButton({ 
                        text: '+', 
                        classes: ['attr-btn', 'plus'], 
                        dataAttributes: { attr: attrId, change: 1, action: 'change-attribute-btn' }, 
                        disabled: value >= max
                    })}
                </div>
                <div class="attribute-limit">Max: ${max}</div>
            `
        }, { cardClass: 'attribute-item', showCost: false, showStatus: false });
    }

    // Add debug methods to AttributeTab
    setupDebugFallbacks() {
        // Global fallback functions for debugging
        window.debugAttributeChange = (attrId, change) => {
            console.log(`🔧 DEBUG: Attribute ${attrId} change ${change}`);
            this.changeAttribute(attrId, change);
        };
        
        window.debugSliderChange = (attrId, newValue) => {
            console.log(`🔧 DEBUG: Slider ${attrId} = ${newValue}`);
            this.setAttributeViaSlider(attrId, newValue);
        };
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
        this.builder.changeAttribute(attrId, change);
    }

    // Slider method removed - using button-only interface

    updateAttributeValue(attrId, newValue) {
        this.builder.setAttribute(attrId, newValue);
    }

    updateSingleAttributeDisplay(attrId, newValue) {
        const character = this.builder.currentCharacter;
        
        // Update the displayed value
        const valueDisplay = document.querySelector(`.attribute-item[data-attr="${attrId}"] .attribute-value`);
        if (valueDisplay) {
            valueDisplay.textContent = newValue;
        }
        
        // Slider removed - using button-only interface
        
        // Update button states
        const minusBtn = document.querySelector(`[data-attr="${attrId}"][data-change="-1"]`);
        const plusBtn = document.querySelector(`[data-attr="${attrId}"][data-change="1"]`);
        if (minusBtn) minusBtn.disabled = newValue <= 0;
        if (plusBtn) plusBtn.disabled = newValue >= character.tier;
        
        console.log(`🎨 Updated display for ${attrId} = ${newValue}`);
    }
}