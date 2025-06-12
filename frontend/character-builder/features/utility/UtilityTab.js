// frontend/character-builder/features/utility/UtilityTab.js
// REFACTORED to use component-based architecture
import { EventManager } from '../../shared/utils/EventManager.js';
import { RenderUtils } from '../../shared/utils/RenderUtils.js';
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';
import { UtilitySystem } from '../../systems/UtilitySystem.js';
import { UtilityOverviewSection } from './components/UtilityOverviewSection.js';
import { ExpertiseSection } from './components/ExpertiseSection.js';
import { GenericUtilitySection } from './components/GenericUtilitySection.js';
import { CustomUtilityForm } from './components/CustomUtilityForm.js';

export class UtilityTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.activeCategory = 'activity-expertise';
        this.listenersAttached = false;
        this.containerElement = null; // Track container for proper cleanup
        
        this.overviewSection = new UtilityOverviewSection(characterBuilder);
        this.expertiseSection = new ExpertiseSection(characterBuilder);
        this.genericUtilitySection = new GenericUtilitySection(characterBuilder);
        this.customUtilityForm = new CustomUtilityForm(characterBuilder);
    }

    render() {
        // Reset listener state at the beginning of render
        this.listenersAttached = false;
        
        const tabContent = document.getElementById('tab-utility');
        if (!tabContent) return;
        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character loaded.</p>";
            return;
        }

        // Main layout has been restructured
        tabContent.innerHTML = `
            <div class="utility-tab-content">
                <h2>Utility Abilities</h2>
                <p class="section-description">Purchase abilities using your utility pool points.</p>
                
                <!-- Utility Overview Box -->
                ${this.overviewSection.render(character)}

                <!-- Category sections for PURCHASING ONLY -->
                ${this.renderCategoryNavigation()}
                <div class="utility-category-content" id="utility-active-category-content">
                    ${this.renderActiveCategoryContent(character)}
                </div>
                <div class="next-step">
                    ${RenderUtils.renderButton({ text: 'Continue to Summary →', variant: 'primary', dataAttributes: { action: 'continue-to-summary' }})}
                </div>
            </div>`;
        this.setupEventListeners();
    }

    
    renderCategoryNavigation() {
        const categories = [
            { id: 'activity-expertise', label: 'Activity Expertise', description: 'Skills & Professions' },
            { id: 'situational-expertise', label: 'Situational Expertise', description: 'Circumstantial Training' },
            { id: 'features', label: 'Features', description: 'Supernatural Abilities' },
            { id: 'senses', label: 'Senses', description: 'Enhanced Perception' },
            { id: 'movement', label: 'Movement', description: 'Enhanced Locomotion' },
            { id: 'descriptors', label: 'Descriptors', description: 'Reality Manipulation' }
        ];
        const tabConfigs = categories.map(cat => ({ id: cat.id, label: `${cat.label} <small class="tab-description">(${cat.description})</small>` }));
        return RenderUtils.renderTabs(tabConfigs, this.activeCategory, { navClass: 'section-tabs utility-section-tabs', tabButtonClass: 'section-tab' });
    }

    renderActiveCategoryContent(character) {
        const renderers = {
            'activity-expertise': () => this.expertiseSection.renderActivityExpertise(character),
            'situational-expertise': () => this.expertiseSection.renderSituationalExpertise(character),
            features: () => this.genericUtilitySection.render(character, 'features', UtilitySystem.getAvailableFeatures()),
            senses: () => this.genericUtilitySection.render(character, 'senses', UtilitySystem.getAvailableSenses()),
            movement: () => this.genericUtilitySection.render(character, 'movement', UtilitySystem.getMovementFeatures()),
            descriptors: () => this.genericUtilitySection.render(character, 'descriptors', UtilitySystem.getDescriptors())
        };
        return renderers[this.activeCategory]?.() ?? `<div class="empty-state">Select a utility category.</div>`;
    }


    setupEventListeners() {
        if (this.listenersAttached) return;
        
        // First remove any existing listeners
        this.removeEventListeners();
        
        const container = document.querySelector('.utility-tab-content');
        if (!container) return;

        // Create a single click handler that we can properly remove
        this.clickHandler = (e) => {
            const handlers = {
                '.section-tab': (el) => this.handleCategorySwitch(el.dataset.tab),
                '[data-action="purchase-expertise"]': (el) => { e.stopPropagation(); this.handleExpertisePurchase(el); },
                '[data-action="purchase-item"]': (el) => { e.stopPropagation(); this.handleGenericPurchase(el); },
                '[data-action="remove-utility-item"]': (el) => { e.stopPropagation(); this.handleGenericRemove(el); },
                '[data-action="show-custom-utility-form"]': (el) => { e.stopPropagation(); this.customUtilityForm.showForm(el.dataset.categoryKey); },
                '[data-action="cancel-custom-utility"]': (el) => { e.stopPropagation(); this.customUtilityForm.cancelForm(el.dataset.categoryKey); },
                '[data-action="create-custom-utility"]': (el) => { e.stopPropagation(); this.handleCreateCustomUtility(el.dataset.categoryKey); },
                '[data-action="continue-to-summary"]': () => this.builder.switchTab('summary'),
            };

            // Handle event delegation manually
            for (const [selector, handler] of Object.entries(handlers)) {
                const target = e.target.matches?.(selector) ? e.target : e.target.closest?.(selector);
                if (target) {
                    try {
                        handler(target);
                        break; // Only handle the first match
                    } catch (error) {
                        console.error(`❌ UtilityTab error for ${selector}:`, error);
                    }
                }
            }
        };

        container.addEventListener('click', this.clickHandler);
        this.containerElement = container;
        this.listenersAttached = true;
        console.log('✅ UtilityTab event listeners attached ONCE.');
    }

    removeEventListeners() {
        if (this.clickHandler && this.containerElement) {
            this.containerElement.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
            this.containerElement = null;
        }
    }
    
    handleCategorySwitch(newCategory) {
        if (newCategory && newCategory !== this.activeCategory) {
            this.activeCategory = newCategory;
            this.updateActiveCategoryContentUI();
        }
    }
    
    handleExpertisePurchase(element) {
        element.disabled = true; // Prevent double-clicks
        const { attribute, expertiseId, expertiseType, level } = element.dataset;
        
        // 1. Get current point balance
        const character = this.builder.currentCharacter;
        const pools = PointPoolCalculator.calculateAllPools(character);
        const remainingPoints = pools.remaining.utilityPool;
        
        // 2. Get the cost of the item
        const itemCost = UtilitySystem.getExpertiseCost(expertiseType, level);
        let actualCost = itemCost;
        if (level === 'mastered') {
            // Cost of mastering is the difference if basic is already owned
            if (character.utilityPurchases.expertise[attribute]?.basic.includes(expertiseId)) {
                actualCost -= UtilitySystem.getExpertiseCost(expertiseType, 'basic');
            }
        }
        
        // 3. Check if this purchase will go over budget
        if (actualCost > remainingPoints) {
            // 4. Show a non-blocking notification
            this.builder.showNotification("This purchase puts you over budget.", "warning");
        }

        // 5. Proceed with the purchase REGARDLESS of the check.
        try {
            UtilitySystem.purchaseExpertise(character, attribute, expertiseId, expertiseType, level);
            this.builder.updateCharacter();
            this.builder.showNotification(`${expertiseId} ${level} expertise purchased!`, 'success');
        } catch (error) {
            // This will now only catch hard rule validation errors.
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
            // Don't call onCharacterUpdate here as it can cause render loops
            element.disabled = false; // Just re-enable the button
        }
    }

    handleGenericPurchase(element) {
        element.disabled = true; // Prevent double-clicks
        const { categoryKey, itemId } = element.dataset;
        
        // 1. Get current point balance
        const character = this.builder.currentCharacter;
        const pools = PointPoolCalculator.calculateAllPools(character);
        const remainingPoints = pools.remaining.utilityPool;
        
        // 2. Get the cost of the item
        const itemDef = UtilitySystem._findItemDefinition(categoryKey, itemId);
        const itemCost = itemDef ? itemDef.cost : 0;
        
        // 3. Check if this purchase will go over budget
        if (itemCost > remainingPoints) {
            // 4. Show a non-blocking notification
            this.builder.showNotification("This purchase puts you over budget.", "warning");
        }

        // 5. Proceed with the purchase REGARDLESS of the check.
        try {
            UtilitySystem.purchaseItem(character, categoryKey, itemId);
            this.builder.updateCharacter();
            this.builder.showNotification(`${this.capitalizeFirst(categoryKey.slice(0,-1))} purchased.`, 'success');
        } catch (error) {
            // This will now only catch hard rule validation errors.
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
            // Don't call onCharacterUpdate here as it can cause render loops
            element.disabled = false; // Just re-enable the button
        }
    }
    
    // NEW: Universal removal handler
    handleGenericRemove(element) {
        const { categoryKey, itemId, attribute, level } = element.dataset;
        const itemName = (UtilitySystem._findItemDefinition(categoryKey, itemId) || {name: itemId}).name;
        
        if (confirm(`Remove "${itemName}"?`)) {
            try {
                if (categoryKey === 'expertise') {
                    UtilitySystem.removeExpertise(this.builder.currentCharacter, attribute, itemId, level);
                } else {
                    UtilitySystem.removeItem(this.builder.currentCharacter, categoryKey, itemId);
                }
                this.builder.updateCharacter();
                this.builder.showNotification(`${itemName} removed.`, 'info');
            } catch (error) {
                this.builder.showNotification(`Removal failed: ${error.message}`, 'error');
            }
        }
    }

    updateActiveCategoryContentUI() {
        document.querySelectorAll('.utility-tab-content .section-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === this.activeCategory);
        });
        const contentArea = document.getElementById('utility-active-category-content');
        if (contentArea && this.builder.currentCharacter) {
            contentArea.innerHTML = this.renderActiveCategoryContent(this.builder.currentCharacter);
        }
    }
    
    onCharacterUpdate() {
        // Just call render - it will handle the state reset
        this.render();
    }
    
    updateOverviewSection() {
        const overviewContainer = document.querySelector('.utility-overview-box');
        if (overviewContainer && this.builder.currentCharacter) {
            overviewContainer.outerHTML = this.overviewSection.render(this.builder.currentCharacter);
        }
    }


    handleCreateCustomUtility(categoryKey) {
        let customItemData;
        try {
            customItemData = this.customUtilityForm.getFormData(categoryKey);
        } catch (error) {
            this.builder.showNotification(error.message, 'error');
            return;
        }

        // 1. Get current point balance
        const character = this.builder.currentCharacter;
        const pools = PointPoolCalculator.calculateAllPools(character);
        const remainingPoints = pools.remaining.utilityPool;
        
        // 2. Get the cost of the item
        const itemCost = customItemData.cost;
        
        // 3. Check if this purchase will go over budget
        if (itemCost > remainingPoints) {
            // 4. Show a non-blocking notification
            this.builder.showNotification("This purchase puts you over budget.", "warning");
        }

        // 5. Proceed with the purchase REGARDLESS of the check.
        try {
            UtilitySystem.purchaseCustomItem(character, customItemData);
            this.builder.updateCharacter();
            this.builder.showNotification(`Created custom ${categoryKey.slice(0, -1)}: ${customItemData.name}!`, 'success');
            
            // Clear form and hide it
            this.customUtilityForm.cancelForm(categoryKey);

        } catch (error) {
            // This will now only catch hard rule validation errors.
            this.builder.showNotification(`Creation failed: ${error.message}`, 'error');
        }
    }
    
    capitalizeFirst(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
}