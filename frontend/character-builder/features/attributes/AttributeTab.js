// frontend/character-builder/features/attributes/AttributeTab.js
import { AttributeSystem } from '../../systems/AttributeSystem.js';
import { RenderUtils } from '../../shared/utils/RenderUtils.js';
import { EventManager } from '../../shared/utils/EventManager.js';
import { gameDataManager } from '../../core/GameDataManager.js';

export class AttributeTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.clickHandler = null;
        this.inputHandler = null;
        this.containerElement = null;
    }

    render() {
        this.listenersAttached = false;
        
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

        // Get the correct tier value from level data (same as BasicInfoTab)
        const levels = gameDataManager.getTiers();
        const levelData = levels.levels?.[character.tier];
        const tierBonus = levelData?.tierBonus || character.tier;

        tabContent.innerHTML = `
            <div class="attributes-section">
                <h2>Assign Attributes ${RenderUtils.renderInfoIcon(RenderUtils.getTooltipText('attributes'))}</h2>
                <p class="section-description">
                    Allocate your attribute points across combat and utility attributes.
                    Each attribute cannot exceed your tier (${tierBonus}).
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
        // Just call render - it will handle the state reset
        this.render();
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

        // Get the correct tier value from level data (same as BasicInfoTab)
        const levels = gameDataManager.getTiers();
        const levelData = levels.levels?.[character.tier];
        const tierBonus = levelData?.tierBonus || character.tier;
        const max = tierBonus;

        // Map current attribute names to test-expected names for backwards compatibility
        const testAttributeMap = {
            'power': 'might',
            'mobility': 'agility', 
            'intelligence': 'intellect',
            'awareness': 'awareness'
        };
        const testAttrName = testAttributeMap[attrId] || attrId;

        return RenderUtils.renderCard({
            title: `${attributeData.name} ${RenderUtils.renderInfoIcon(RenderUtils.getTooltipText(attrId))}`,
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
                    <input type="number" class="attribute-value" data-attribute="${testAttrName}" value="${value}" min="0" max="${max}" style="width: 60px; text-align: center;">
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

    removeEventListeners() {
        if (this.clickHandler && this.containerElement) {
            this.containerElement.removeEventListener('click', this.clickHandler);
            this.containerElement.removeEventListener('input', this.inputHandler);
            this.clickHandler = null;
            this.inputHandler = null;
            this.containerElement = null;
        }
    }

    setupEventListeners() {
        // First, remove any old listeners to prevent duplication
        this.removeEventListeners();
        
        const container = document.getElementById('tab-attributes');
        if (!container) return;
        
        // Store the handlers and container so they can be removed later
        this.clickHandler = (e) => {
            const element = e.target.closest('[data-action]');
            if (!element) return;
            
            const action = element.dataset.action;
            
            if (action === 'change-attribute-btn') {
                const attrId = element.dataset.attr;
                const change = parseInt(element.dataset.change);
                if (attrId !== undefined && change !== undefined) {
                    console.log(`🎯 Attribute button: ${attrId} ${change > 0 ? '+' : ''}${change}`);
                    this.changeAttribute(attrId, change);
                }
            } else if (action === 'continue-to-mainpool') {
                this.builder.switchTab('mainPool');
            }
        };
        
        this.inputHandler = (e) => {
            const element = e.target;
            
            if (element.matches('[data-action="change-attribute-slider"]')) {
                const attrId = element.dataset.attr;
                const newValue = element.value;
                if (attrId !== undefined && newValue !== undefined) {
                    console.log(`🎯 Attribute slider: ${attrId} = ${newValue}`);
                    this.setAttributeViaSlider(attrId, newValue);
                }
            } else if (element.matches('[data-attribute]')) {
                // Handle direct input on attribute number fields for tests
                const testAttrName = element.dataset.attribute;
                const newValue = parseInt(element.value) || 0;
                
                // Map test attribute names back to system attribute names
                const reverseMap = {
                    'might': 'power',
                    'agility': 'mobility', 
                    'intellect': 'intelligence',
                    'awareness': 'awareness'
                };
                
                const systemAttrName = reverseMap[testAttrName] || testAttrName;
                console.log(`🎯 Direct attribute input: ${testAttrName} -> ${systemAttrName} = ${newValue}`);
                this.setAttributeDirectly(systemAttrName, newValue);
            }
        };
        
        this.containerElement = container;
        this.containerElement.addEventListener('click', this.clickHandler);
        this.containerElement.addEventListener('input', this.inputHandler);
        
        console.log('✅ AttributeTab event listeners attached.');
    }

    changeAttribute(attrId, change) {
        this.builder.changeAttribute(attrId, change);
    }

    setAttributeViaSlider(attrId, newValue) {
        this.builder.setAttribute(attrId, newValue);
    }

    setAttributeDirectly(attrId, newValue) {
        this.builder.setAttribute(attrId, newValue);
    }

    updateAttributeValue(attrId, newValue) {
        this.builder.setAttribute(attrId, newValue);
    }

    updateSingleAttributeDisplay(attrId, newValue) {
        const character = this.builder.currentCharacter;

        // Get the correct tier value from level data (same as BasicInfoTab)
        const levels = gameDataManager.getTiers();
        const levelData = levels.levels?.[character.tier];
        const tierBonus = levelData?.tierBonus || character.tier;

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
        if (plusBtn) plusBtn.disabled = newValue >= tierBonus;
        
        console.log(`🎨 Updated display for ${attrId} = ${newValue}`);
    }
}