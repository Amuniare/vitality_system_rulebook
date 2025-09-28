// frontend/character-builder/features/utility/UtilityTab.js
// FINAL FIX: Using the main builder update path for all state changes to ensure UI consistency.
import { EventManager } from '../../shared/utils/EventManager.js';
import { RenderUtils } from '../../shared/utils/RenderUtils.js';
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';
import { UtilitySystem } from '../../systems/UtilitySystem.js';
import { gameDataManager } from '../../core/GameDataManager.js';
import { GenericUtilitySection } from './components/GenericUtilitySection.js';
import { UtilityOverviewSection } from './components/UtilityOverviewSection.js';

export class UtilityTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.genericUtilitySection = new GenericUtilitySection(characterBuilder);
        this.utilityOverviewSection = new UtilityOverviewSection(characterBuilder);
        this.activePurchaseCategory = 'features';
        this.listenersAttached = false;
        this.containerElement = null;
    }

    render() {
        this.listenersAttached = false;
        const tabContent = document.getElementById('tab-utility');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character loaded.</p>";
            return;
        }

        const pools = PointPoolCalculator.calculateAllPools(character);
        const utilityPool = {
            spent: pools.totalSpent.utilityPool || 0,
            available: pools.totalAvailable.utilityPool || 0,
            remaining: pools.remaining.utilityPool || 0,
        };

        tabContent.innerHTML = `
            <div class="utility-tab-content">
                <h2>Utility</h2>
                <p class="section-description">Define your character's specialized skills and purchase unique non-combat abilities.</p>
                ${this.renderUtilityArchetypeSection(character)}
                
                ${this.utilityOverviewSection.render(character)}
                
                <div class="utility-pool-purchases card">
                    <h3>Utility Pool Purchases</h3>
                    <p class="section-description">Spend your Utility Points (${utilityPool.available} available) on a variety of features, senses, and other abilities.</p>
                    ${RenderUtils.renderPointDisplay(utilityPool.spent, utilityPool.available, 'Utility Pool', { showRemaining: true })}
                    
                    ${this.renderPurchaseCategoryNavigation()}
                    <div class="utility-purchase-content" id="utility-purchase-content">
                        ${this.renderActivePurchaseCategoryContent(character)}
                    </div>
                </div>

                <div class="next-step">
                    ${RenderUtils.renderButton({ text: 'Continue to Summary →', variant: 'primary', dataAttributes: { action: 'continue-to-summary' } })}
                </div>
            </div>
        `;
        this.setupEventListeners();
    }


    renderUtilityArchetypeSection(character) {
        const archetypeId = character.archetypes.utility;
        const archetype = (gameDataManager.getArchetypesForCategory('utility') || []).find(a => a.id === archetypeId);

        return `
            <div class="utility-section card">
                <h3>Utility Archetype Configuration</h3>
                ${!archetypeId ? 
                    `<p class="archetype-config-info">Please select a Utility Archetype on the Archetypes tab to configure it here.</p>` :
                    `
                    <div class="archetype-display">
                        <h4>${archetype.name}</h4>
                        <p>${archetype.description}</p>
                    </div>
                    <div id="utility-archetype-config" class="archetype-config-section">
                        ${this.renderArchetypeConfig(character)}
                    </div>
                    `
                }
            </div>
        `;
    }

    renderArchetypeConfig(character) {
        const selectedArchetype = character.archetypes.utility;
        switch (selectedArchetype) {
            case 'practical':
                return this.renderPracticalConfig(character);
            case 'specialized':
                return this.renderSpecializedConfig(character);
            case 'jackOfAllTrades':
                return `<p class="archetype-config-info"><strong>Jack of All Trades:</strong> Adds your Tier to all skill checks. No further configuration needed.</p>`;
            default:
                return ``;
        }
    }

    renderPracticalConfig(character) {
        const skills = UtilitySystem.getSkills();
        const selectedSkills = character.utilityArchetypeSelections.practicalSkills || [];
        return `
            <h5>Select Skills (up to 3)</h5>
            <p>You will add Tier x 2 to checks using these skills.</p>
            <div class="skill-selection-grid grid-layout grid-columns-auto-fit-280">
                ${skills.map(skill => {
                    const isSelected = selectedSkills.includes(skill.id);
                    const isDisabled = !isSelected && selectedSkills.length >= 3;
                    return RenderUtils.renderCard({
                        title: skill.name,
                        description: skill.description,
                        clickable: !isDisabled,
                        selected: isSelected,
                        disabled: isDisabled,
                        dataAttributes: {
                            action: 'toggle-practical-skill',
                            'skill-id': skill.id
                        }
                    }, { cardClass: 'skill-card', showCost: false });
                }).join('')}
            </div>
            <p>Selected: ${selectedSkills.length}/3</p>
        `;
    }

    renderSpecializedConfig(character) {
        const attributes = UtilitySystem.getAttributes();
        const selectedAttribute = character.utilityArchetypeSelections.specializedAttribute;
        return `
            <h5>Choose Specialized Attribute</h5>
            <p>You will add Tier x 2 to all skill checks using this attribute.</p>
            ${RenderUtils.renderFormGroup({
                label: 'Specialized Attribute',
                inputHtml: RenderUtils.renderSelect({
                    options: attributes.map(attr => ({ value: attr.id, label: attr.name })),
                    value: selectedAttribute,
                    dataAttributes: { action: 'select-specialized-attribute' }
                })
            })}
        `;
    }

    renderPurchaseCategoryNavigation() {
        const categories = [
            { id: 'features', label: 'Features' },
            { id: 'senses', label: 'Senses' },
            { id: 'movement', label: 'Movement' },
            { id: 'descriptors', label: 'Descriptors' }
        ];
        return RenderUtils.renderTabs(categories, this.activePurchaseCategory, { navClass: 'section-tabs utility-purchase-tabs', tabButtonClass: 'section-tab' });
    }

    renderActivePurchaseCategoryContent(character) {
        const dataSources = {
            features: UtilitySystem.getAvailableFeatures(),
            senses: UtilitySystem.getAvailableSenses(),
            movement: UtilitySystem.getMovementFeatures(),
            descriptors: UtilitySystem.getDescriptors()
        };
        const categoryData = dataSources[this.activePurchaseCategory];
        if (!categoryData) return '<p>Select a category to view items.</p>';

        return this.genericUtilitySection.render(character, this.activePurchaseCategory, categoryData);
    }

    setupEventListeners() {
        if (this.listenersAttached) return;

        this.removeEventListeners();
        const container = document.querySelector('.utility-tab-content');
        if (!container) return;
        
        this.containerElement = container;

        const handler = (e) => {
            const target = e.target;
            const action = target.dataset.action || target.closest('[data-action]')?.dataset.action;

            if (target.matches('.section-tab') || target.closest('.section-tab')) {
                const tab = target.closest('.section-tab');
                this.handleCategorySwitch(tab.dataset.tab);
                return;
            }

            if (!action) return;

            switch (action) {
                case 'toggle-practical-skill':
                    this.handlePracticalSkillToggle(target.closest('.card').dataset.skillId);
                    break;
                case 'select-specialized-attribute':
                    this.handleSpecializedAttributeSelect(target.value);
                    break;
                case 'purchase-item':
                    this.handleGenericPurchase(target.closest('.card'));
                    break;
                case 'remove-utility-item':
                    this.handleRemoveUtilityItem(target);
                    break;
                case 'continue-to-summary':
                    this.builder.switchTab('summary');
                    break;
            }
        };

        this.clickHandler = handler;
        container.addEventListener('click', handler);
        container.addEventListener('input', handler);
        container.addEventListener('change', handler);
        this.listenersAttached = true;
    }

    removeEventListeners() {
        if (this.clickHandler && this.containerElement) {
            this.containerElement.removeEventListener('click', this.clickHandler);
            this.containerElement.removeEventListener('input', this.clickHandler);
            this.containerElement.removeEventListener('change', this.clickHandler);
            this.clickHandler = null;
            this.containerElement = null;
        }
    }
    

    handlePracticalSkillToggle(skillId) {
        try {
            UtilitySystem.togglePracticalSkill(this.builder.currentCharacter, skillId);
            this.builder.updateCharacter();
        } catch (error) {
            this.builder.showNotification(error.message, 'error');
        }
    }
    
    handleSpecializedAttributeSelect(attributeId) {
        UtilitySystem.setSpecializedAttribute(this.builder.currentCharacter, attributeId);
        this.builder.updateCharacter();
    }
    
    handleCategorySwitch(newCategory) {
        if (this.activePurchaseCategory !== newCategory) {
            this.activePurchaseCategory = newCategory;
            this.updateActivePurchaseCategoryContentUI();
        }
    }

    handleGenericPurchase(element) {
        element.disabled = true;
        const { categoryKey, itemId } = element.dataset;
        
        const pools = PointPoolCalculator.calculateAllPools(this.builder.currentCharacter);
        const remainingPoints = pools.remaining.utilityPool;
        
        const itemDef = UtilitySystem._findItemDefinition(categoryKey, itemId);
        const itemCost = itemDef ? itemDef.cost : 0;
        
        if (itemCost > remainingPoints) {
            this.builder.showNotification("This purchase puts you over budget.", "warning");
        }

        try {
            UtilitySystem.purchaseItem(this.builder.currentCharacter, categoryKey, itemId);
            this.builder.updateCharacter();
        } catch (error) {
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
            element.disabled = false;
        }
    }

    handleRemoveUtilityItem(element) {
        const { categoryKey, itemId } = element.dataset;
        
        try {
            UtilitySystem.removeItem(this.builder.currentCharacter, categoryKey, itemId);
            this.builder.updateCharacter();
        } catch (error) {
            this.builder.showNotification(`Remove failed: ${error.message}`, 'error');
        }
    }

    updateActivePurchaseCategoryContentUI() {
        document.querySelectorAll('.utility-purchase-tabs .section-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === this.activePurchaseCategory);
        });
        const contentArea = document.getElementById('utility-purchase-content');
        if (contentArea) {
            contentArea.innerHTML = this.renderActivePurchaseCategoryContent(this.builder.currentCharacter);
        }
    }

    onCharacterUpdate() {
        this.render();
    }
}