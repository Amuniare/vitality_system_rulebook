// rulebook/character-builder/ui/tabs/UtilityTab.js
import { EventManager } from '../shared/EventManager.js';
import { RenderUtils } from '../shared/RenderUtils.js';
import { UpdateManager } from '../shared/UpdateManager.js'; // If complex internal updates needed
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';
import { UtilitySystem } from '../../systems/UtilitySystem.js'; // Main system for data

export class UtilityTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.activeCategory = 'expertise'; // Default category
    }

    render() {
        const tabContent = document.getElementById('tab-utility');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character selected or prerequisites not met.</p>";
            return;
        }

        tabContent.innerHTML = `
            <div class="utility-tab-content">
                <h2>Utility Abilities</h2>
                <p class="section-description">
                    Purchase expertise, features, senses, movement, and descriptors using your utility pool points.
                </p>

                ${this.renderPointPoolInfo(character)}
                ${this.renderCategoryNavigation()}
                <div class="utility-category-content" id="utility-active-category-content">
                    ${this.renderActiveCategoryContent(character)}
                </div>
                ${this.renderPurchasedSummary(character)}

                <div class="next-step">
                    ${RenderUtils.renderButton({
                        text: 'Continue to Summary →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-summary' }
                    })}
                </div>
            </div>
        `;
        this.setupEventListeners(); // For category switching and internal interactions
    }

    renderPointPoolInfo(character) {
        const pools = PointPoolCalculator.calculateAllPools(character);
        const utilityPool = pools.remaining.utilityPool || 0; // Ensure fallback if undefined
        const available = pools.totalAvailable.utilityPool || 0;
        const spent = pools.totalSpent.utilityPool || 0;

        return RenderUtils.renderPointDisplay(spent, available, 'Utility Pool', {
            showRemaining: true,
            variant: utilityPool < 0 ? 'error' : (utilityPool === 0 && spent > 0 ? 'warning' : 'default')
        });
    }

    renderCategoryNavigation() {
        const categories = [
            { id: 'expertise', label: 'Expertise', description: 'Skills & Training' },
            { id: 'features', label: 'Features', description: 'Supernatural Abilities' },
            { id: 'senses', label: 'Senses', description: 'Enhanced Perception' },
            { id: 'movement', label: 'Movement', description: 'Enhanced Locomotion' },
            { id: 'descriptors', label: 'Descriptors', description: 'Reality Manipulation' }
        ];
        // Making labels more descriptive by including the description in a smaller tag
        const tabConfigs = categories.map(cat => ({
            id: cat.id,
            label: `${cat.label} <small class="tab-description">(${cat.description})</small>`,
            disabled: false // Add logic if some tabs should be disabled
        }));
        return RenderUtils.renderTabs(tabConfigs, this.activeCategory, { navClass: 'section-tabs utility-section-tabs', tabButtonClass: 'section-tab' });
    }

    renderActiveCategoryContent(character) {
        const sectionRenderers = {
            expertise: () => this.renderExpertiseSection(character),
            features: () => this.renderGenericUtilitySection(character, 'features', UtilitySystem.getAvailableFeatures()),
            senses: () => this.renderGenericUtilitySection(character, 'senses', UtilitySystem.getAvailableSenses()),
            movement: () => this.renderGenericUtilitySection(character, 'movement', UtilitySystem.getMovementFeatures()),
            descriptors: () => this.renderGenericUtilitySection(character, 'descriptors', UtilitySystem.getDescriptors())
        };
        const renderer = sectionRenderers[this.activeCategory];
        return renderer ? renderer() : `<div class="empty-state">Select a utility category.</div>`;
    }

    renderExpertiseSection(character) {
        const expertiseCategories = UtilitySystem.getExpertiseCategories();
        const content = Object.entries(expertiseCategories).map(([attrKey, attrData]) =>
            this.renderAttributeExpertiseBlock(attrKey, attrData, character)
        ).join('');
        return `<div class="expertise-main-grid grid-layout grid-columns-auto-fit-300">${content}</div>`;
    }

    renderAttributeExpertiseBlock(attrKey, attrData, character) {
        const currentExpertise = character.utilityPurchases.expertise[attrKey] || { basic: [], mastered: [] };
        const costs = UtilitySystem.getExpertiseCosts();
        
        const renderOptions = (type, options) => {
            if (!options || options.length === 0) return '<p class="empty-state-small">None available.</p>';
            return `<div class="expertise-cards-grid">${options.map(ex => this.renderSingleExpertiseOption(ex, attrKey, type, currentExpertise)).join('')}</div>`;
        };

        const activityBasicCost = costs.activityBased?.basic?.cost || 2;
        const activityMasteredCost = costs.activityBased?.mastered?.cost || 6;
        const situationalBasicCost = costs.situational?.basic?.cost || 1;
        const situationalMasteredCost = costs.situational?.mastered?.cost || 3;

        return RenderUtils.renderCard({
            title: `${attrKey} Expertise`,
            titleTag: 'h4',
            additionalContent: `
                <div class="expertise-subsection">
                    <h5>Activity-Based (Basic: ${activityBasicCost}p / Mastered: ${activityMasteredCost}p)</h5>
                    <div class="expertise-options-list">${renderOptions('activity', attrData.activities)}</div>
                </div>
                <div class="expertise-subsection">
                    <h5>Situational (Basic: ${situationalBasicCost}p / Mastered: ${situationalMasteredCost}p)</h5>
                    <div class="expertise-options-list">${renderOptions('situational', attrData.situational)}</div>
                </div>`
        }, { cardClass: 'expertise-attribute-card', showCost: false, showStatus: false });
    }

    renderSingleExpertiseOption(expertise, attribute, type, currentExpertise) {
        const costs = UtilitySystem.getExpertiseCosts();
        const basicCost = costs[type === 'activity' ? 'activityBased' : 'situational']?.basic?.cost || (type === 'activity' ? 2 : 1);
        const masteredCost = costs[type === 'activity' ? 'activityBased' : 'situational']?.mastered?.cost || (type === 'activity' ? 6 : 3);

        const isBasic = currentExpertise.basic.includes(expertise.id || expertise.name);
        const isMastered = currentExpertise.mastered.includes(expertise.id || expertise.name);

        const canAffordBasic = !isBasic; // Can purchase if not already owned
        const canAffordMastered = isBasic && !isMastered; // Can only master if basic is owned

        return `
            <div class="expertise-card">
                <div class="expertise-card-header">
                    <div class="expertise-name">${expertise.name}</div>
                    <div class="expertise-description">${expertise.description || 'No description available'}</div>
                </div>
                <div class="expertise-card-footer">
                    <div class="expertise-basic-section">
                        <div class="expertise-cost-label">Basic:</div>
                        <div class="expertise-cost-value">${basicCost}p</div>
                        ${RenderUtils.renderButton({
                            text: isBasic ? 'Purchased' : 'Purchase',
                            variant: isBasic ? 'success' : (canAffordBasic ? 'primary' : 'secondary'),
                            size: 'small',
                            disabled: !canAffordBasic,
                            dataAttributes: {
                                action: isBasic ? 'remove-expertise' : 'purchase-expertise',
                                attribute: attribute,
                                'expertise-id': expertise.id || expertise.name,
                                'expertise-type': type,
                                level: 'basic'
                            }
                        })}
                    </div>
                    <div class="expertise-mastered-section">
                        <div class="expertise-cost-label">Mastered:</div>
                        <div class="expertise-cost-value">${masteredCost}p</div>
                        ${RenderUtils.renderButton({
                            text: isMastered ? 'Mastered' : 'Master',
                            variant: isMastered ? 'success' : (canAffordMastered ? 'primary' : 'secondary'),
                            size: 'small',
                            disabled: !canAffordMastered,
                            dataAttributes: {
                                action: isMastered ? 'remove-expertise' : 'purchase-expertise',
                                attribute: attribute,
                                'expertise-id': expertise.id || expertise.name,
                                'expertise-type': type,
                                level: 'mastered'
                            }
                        })}
                    </div>
                </div>
            </div>
        `;
    }


    renderGenericUtilitySection(character, categoryKey, categoryData) {
        const title = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
        const purchasedItems = character.utilityPurchases[categoryKey] || [];
        const pools = PointPoolCalculator.calculateAllPools(character);
        const remainingUtilityPoints = pools.remaining.utilityPool;

        let allItems = [];
        Object.values(categoryData).forEach(tierOrGroup => {
            const itemsToAdd = tierOrGroup.features || tierOrGroup.senses || tierOrGroup.descriptors || tierOrGroup; // Adapt to data structure
            if (Array.isArray(itemsToAdd)) {
                allItems = allItems.concat(itemsToAdd.map(item => ({ ...item, cost: tierOrGroup.cost !== undefined ? tierOrGroup.cost : item.cost })));
            }
        });
        // Filter out items that are already purchased for the available list
        const availableItems = allItems.filter(item => !purchasedItems.some(pItem => pItem.id === item.id));


        return `
            <div class="utility-generic-section">
                <h3>${title}</h3>
                <p class="category-description">${this.getCategoryDescription(categoryKey)}</p>
                ${RenderUtils.renderPurchasedList(
                    purchasedItems,
                    (item, index) => this.renderPurchasedUtilityItem(item, categoryKey, index),
                    { title: `Purchased ${title} (${purchasedItems.length})`, emptyMessage: `No ${categoryKey} purchased.`}
                )}
                <h4>Available ${title}</h4>
                ${RenderUtils.renderGrid(
                    availableItems,
                    (item) => {
                        const canAfford = remainingUtilityPoints >= item.cost;
                        return RenderUtils.renderCard({
                            title: item.name,
                            cost: item.cost,
                            description: item.description + (item.applications ? `<br><small><strong>Apps:</strong> ${item.applications.join(', ')}</small>` : ''),
                            status: canAfford ? 'available' : 'unaffordable',
                            clickable: canAfford,
                            disabled: !canAfford,
                            dataAttributes: { action: `purchase-${categoryKey.slice(0,-1)}`, 'item-id': item.id, cost: item.cost } // e.g. purchase-feature
                        }, { cardClass: `${categoryKey.slice(0,-1)}-card`, showStatus: true });
                    },
                    { gridContainerClass: 'grid-layout utility-item-grid', gridSpecificClass: 'grid-columns-auto-fit-280', emptyMessage: `All available ${categoryKey} purchased or none defined.` }
                )}
            </div>
        `;
    }
    getCategoryDescription(categoryKey) {
        const descs = {
            features: 'Supernatural abilities that enable new types of actions and checks.',
            senses: 'Enhanced perceptual capabilities for detecting what normal senses cannot.',
            movement: 'Enhanced locomotion capabilities for combat and exploration.',
            descriptors: 'Reality manipulation abilities tied to specific concepts or elements.'
        };
        return descs[categoryKey] || 'Select items from this category.';
    }

    renderPurchasedUtilityItem(item, categoryKey, index) {
        return `
            <div class="purchased-item">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-cost">${item.cost}p</span>
                </div>
                ${RenderUtils.renderButton({text: 'Remove', variant: 'danger', size: 'small', dataAttributes: {action: `remove-${categoryKey.slice(0,-1)}`, index: index, 'item-id': item.id }})}
            </div>
        `;
    }


    renderPurchasedSummary(character) {
        // This could show a count of purchased items per category or be removed if too verbose
        return '';
    }
    renderNextStep() { /* same as before */
        return ` <div class="next-step"> ${RenderUtils.renderButton({ text: 'Continue to Summary →', variant: 'primary', dataAttributes: { action: 'continue-to-summary' } })} </div> `;
    }


    setupEventListeners() {
        const container = document.querySelector('.utility-tab-content');
        if (!container) return;

        EventManager.delegateEvents(container, {
            click: {
                '.section-tab': (e, el) => this.handleCategorySwitch(el.dataset.tab), // Ensure data-tab used in renderTabs
                '[data-action="continue-to-summary"]': () => this.builder.switchTab('summary'),
                '[data-action^="purchase-"]': (e, el) => this.handleGenericPurchase(el),
                '[data-action^="remove-"]': (e, el) => this.handleGenericRemove(el)
            },
            change: {
                '[data-action="toggle-expertise"]': (e, el) => this.handleExpertiseToggle(el)
            }
        });
    }


    handleCategorySwitch(newCategory) {
        if (newCategory && newCategory !== this.activeCategory) {
            this.activeCategory = newCategory;
            this.updateActiveCategoryContentUI();
        }
    }
    
    handleExpertiseToggle(checkbox) {
        const { attribute, expertiseId, expertiseType, level } = checkbox.dataset;
        const isChecked = checkbox.checked;
        const character = this.builder.currentCharacter;
        try {
            UtilitySystem.toggleExpertise(character, attribute, expertiseId, expertiseType, level, isChecked);
            this.builder.updateCharacter(); // This will trigger re-render of points and this section
             this.builder.showNotification(`Expertise ${expertiseId} ${level} ${isChecked ? 'added' : 'removed'}.`, 'success');
        } catch (error) {
            this.builder.showNotification(`Expertise update failed: ${error.message}`, 'error');
            checkbox.checked = !isChecked; // Revert UI on failure
        }
    }

    handleExpertisePurchase(element) {
        const { attribute, expertiseId, expertiseType, level } = element.dataset;
        const character = this.builder.currentCharacter;
        
        try {
            UtilitySystem.purchaseExpertise(character, attribute, expertiseId, expertiseType, level);
            this.builder.updateCharacter();
            this.render(); // Re-render to update button states
            this.builder.showNotification(`${expertiseId} ${level} expertise purchased!`, 'success');
        } catch (error) {
            this.builder.showNotification(`Expertise purchase failed: ${error.message}`, 'error');
        }
    }

    handleExpertiseRemoval(element) {
        const { attribute, expertiseId, expertiseType, level } = element.dataset;
        const character = this.builder.currentCharacter;
        
        try {
            UtilitySystem.removeExpertise(character, attribute, expertiseId, expertiseType, level);
            this.builder.updateCharacter();
            this.render(); // Re-render to update button states
            this.builder.showNotification(`${expertiseId} ${level} expertise removed!`, 'info');
        } catch (error) {
            this.builder.showNotification(`Expertise removal failed: ${error.message}`, 'error');
        }
    }

    handleGenericPurchase(element) {
        const action = element.dataset.action; // e.g., "purchase-feature"
        const categoryKey = action.split('-')[1] + 's'; // "features"
        const itemId = element.dataset.itemId;
        const itemCost = parseInt(element.dataset.cost);
        
        const character = this.builder.currentCharacter;
        try {
            UtilitySystem.purchaseItem(character, categoryKey, itemId, itemCost);
            this.builder.updateCharacter();
            this.builder.showNotification(`${this.capitalizeFirst(categoryKey.slice(0,-1))} purchased.`, 'success');
        } catch (error) {
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
        }
    }
    handleGenericRemove(element) {
        const action = element.dataset.action; // e.g., "remove-feature"
        const categoryKey = action.split('-')[1] + 's'; // "features"
        const itemId = element.dataset.itemId; // Make sure this is present on remove buttons
        
        const character = this.builder.currentCharacter;
        if (confirm(`Remove this ${categoryKey.slice(0,-1)}?`)) {
            try {
                UtilitySystem.removeItem(character, categoryKey, itemId);
                this.builder.updateCharacter();
                this.builder.showNotification(`${this.capitalizeFirst(categoryKey.slice(0,-1))} removed.`, 'info');
            } catch (error) {
                 this.builder.showNotification(`Removal failed: ${error.message}`, 'error');
            }
        }
    }


    updateActiveCategoryContentUI() {
        // Update tab button active states
        document.querySelectorAll('.utility-tab-content .section-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === this.activeCategory);
        });
        // Re-render the content of the active section
        const contentArea = document.getElementById('utility-active-category-content');
        if (contentArea && this.builder.currentCharacter) {
            contentArea.innerHTML = this.renderActiveCategoryContent(this.builder.currentCharacter);
            // Event listeners are delegated, so new content will be covered.
        }
    }
    
    onCharacterUpdate() { // Called by CharacterBuilder
        const pointPoolContainer = document.querySelector('.utility-tab-content .point-display');
        if (pointPoolContainer && this.builder.currentCharacter) {
            pointPoolContainer.outerHTML = this.renderPointPoolInfo(this.builder.currentCharacter);
        }
        this.updateActiveCategoryContentUI();
    }

    capitalizeFirst(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
}

