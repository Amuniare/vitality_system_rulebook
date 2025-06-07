// rulebook/character-builder/ui/tabs/UtilityTab.js
import { EventManager } from '../../shared/utils/EventManager.js';
import { RenderUtils } from '../../shared/utils/RenderUtils.js';
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';
import { UtilitySystem } from '../../systems/UtilitySystem.js';

export class UtilityTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.activeCategory = 'expertise';
    }

    render() {
        const tabContent = document.getElementById('tab-utility');
        if (!tabContent) return;
        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character loaded.</p>";
            return;
        }
        tabContent.innerHTML = `
            <div class="utility-tab-content">
                <h2>Utility Abilities</h2>
                <p class="section-description">Purchase abilities using your utility pool points.</p>
                ${this.renderPointPoolInfo(character)}
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

    renderPointPoolInfo(character) {
        const pools = PointPoolCalculator.calculateAllPools(character);
        const utilityPool = pools.remaining.utilityPool || 0;
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
        const tabConfigs = categories.map(cat => ({ id: cat.id, label: `${cat.label} <small class="tab-description">(${cat.description})</small>` }));
        return RenderUtils.renderTabs(tabConfigs, this.activeCategory, { navClass: 'section-tabs utility-section-tabs', tabButtonClass: 'section-tab' });
    }

    renderActiveCategoryContent(character) {
        const renderers = {
            expertise: () => this.renderExpertiseSection(character),
            features: () => this.renderGenericUtilitySection(character, 'features', UtilitySystem.getAvailableFeatures()),
            senses: () => this.renderGenericUtilitySection(character, 'senses', UtilitySystem.getAvailableSenses()),
            movement: () => this.renderGenericUtilitySection(character, 'movement', UtilitySystem.getMovementFeatures()),
            descriptors: () => this.renderGenericUtilitySection(character, 'descriptors', UtilitySystem.getDescriptors())
        };
        return renderers[this.activeCategory]?.() ?? `<div class="empty-state">Select a utility category.</div>`;
    }

    renderExpertiseSection(character) {
        const expertiseCategories = UtilitySystem.getExpertiseCategories();
        const content = Object.entries(expertiseCategories).map(([attrKey, attrData]) =>
            this.renderAttributeExpertiseBlock(attrKey, attrData, character)
        ).join('');
        return `<div class="expertise-main-grid grid-layout grid-columns-auto-fit-300">${content}</div>`;
    }

    renderAttributeExpertiseBlock(attrKey, attrData, character) {
        const costs = UtilitySystem.getExpertiseCosts();
        const renderOptions = (type, options) => {
            if (!options || options.length === 0) return '<p class="empty-state-small">None available.</p>';
            return `<div class="expertise-cards-grid">${options.map(ex => this.renderSingleExpertiseOption(ex, attrKey, type, character)).join('')}</div>`;
        };
        return RenderUtils.renderCard({
            title: `${attrKey} Expertise`, titleTag: 'h4',
            additionalContent: `
                <div class="expertise-subsection"><h5>Activity-Based (Basic: ${costs.activityBased.basic.cost}p / Mastered: ${costs.activityBased.mastered.cost}p)</h5>${renderOptions('activity', attrData.activities)}</div>
                <div class="expertise-subsection"><h5>Situational (Basic: ${costs.situational.basic.cost}p / Mastered: ${costs.situational.mastered.cost}p)</h5>${renderOptions('situational', attrData.situational)}</div>`
        }, { cardClass: 'expertise-attribute-card' });
    }

    renderSingleExpertiseOption(expertise, attribute, type, character) {
        const costs = UtilitySystem.getExpertiseCosts();
        const basicCost = costs[type === 'activity' ? 'activityBased' : 'situational'].basic.cost;
        const masteredCost = costs[type === 'activity' ? 'activityBased' : 'situational'].mastered.cost;
        const currentExpertise = character.utilityPurchases.expertise[attribute] || { basic: [], mastered: [] };
        const expertiseId = expertise.id || expertise.name;
        const isBasic = currentExpertise.basic.includes(expertiseId);
        const isMastered = currentExpertise.mastered.includes(expertiseId);

        return `
            <div class="expertise-card">
                <div class="expertise-card-header"><div class="expertise-name">${expertise.name}</div><div class="expertise-description">${expertise.description}</div></div>
                <div class="expertise-card-footer">
                    <div class="expertise-basic-section">
                        <div class="expertise-cost-value">${basicCost}p</div>
                        ${RenderUtils.renderButton({ text: isBasic ? '✓ Basic' : 'Purchase', variant: isBasic ? 'success' : 'primary', size: 'small', disabled: isBasic, dataAttributes: { action: 'purchase-expertise', attribute, 'expertise-id': expertiseId, 'expertise-type': type, level: 'basic' } })}
                    </div>
                    <div class="expertise-mastered-section">
                        <div class="expertise-cost-value">${masteredCost}p</div>
                        ${RenderUtils.renderButton({ text: isMastered ? '✓ Mastered' : 'Master', variant: isMastered ? 'success' : 'primary', size: 'small', disabled: !isBasic || isMastered, dataAttributes: { action: 'purchase-expertise', attribute, 'expertise-id': expertiseId, 'expertise-type': type, level: 'mastered' } })}
                    </div>
                </div>
            </div>`;
    }

    renderGenericUtilitySection(character, categoryKey, categoryData) {
        const title = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
        const purchasedItems = character.utilityPurchases[categoryKey] || [];
        const pools = PointPoolCalculator.calculateAllPools(character);
        const remainingUtilityPoints = pools.remaining.utilityPool;
        let allItems = [];
        Object.values(categoryData).forEach(tier => {
            const itemsToAdd = tier.features || tier.senses || tier.movement || tier.descriptors;
            if (Array.isArray(itemsToAdd)) {
                allItems = allItems.concat(itemsToAdd.map(item => ({ ...item, cost: tier.cost ?? item.cost })));
            }
        });
        const availableItems = allItems.filter(item => !purchasedItems.some(p => p.id === item.id));

        return `
            <div class="utility-generic-section">
                <h3>${title}</h3>
                ${RenderUtils.renderPurchasedList(purchasedItems, (item, index) => this.renderPurchasedUtilityItem(item, categoryKey), { title: `Purchased ${title} (${purchasedItems.length})` })}
                <h4>Available ${title}</h4>
                ${RenderUtils.renderGrid(
                    availableItems,
                    (item) => {
                        const canAfford = remainingUtilityPoints >= item.cost;
                        return RenderUtils.renderCard({
                            title: item.name, cost: item.cost, description: item.description,
                            status: canAfford ? 'available' : 'unaffordable',
                            clickable: canAfford, disabled: !canAfford,
                            dataAttributes: { action: `purchase-${categoryKey.slice(0, -1)}`, 'item-id': item.id }
                        }, { cardClass: `${categoryKey.slice(0, -1)}-card`, showStatus: true });
                    }, { gridContainerClass: 'grid-layout utility-item-grid', gridSpecificClass: 'grid-columns-auto-fit-280' }
                )}
            </div>`;
    }

    renderPurchasedUtilityItem(item, categoryKey) {
        return `<div class="purchased-item"><div class="item-info"><span class="item-name">${item.name}</span><span class="item-cost">${item.cost}p</span></div>${RenderUtils.renderButton({ text: 'Remove', variant: 'danger', size: 'small', dataAttributes: { action: `remove-${categoryKey.slice(0, -1)}`, 'item-id': item.id } })}</div>`;
    }

    setupEventListeners() {
        const container = document.querySelector('.utility-tab-content');
        if (!container) return;
        EventManager.delegateEvents(container, {
            click: {
                '.section-tab': (e, el) => this.handleCategorySwitch(el.dataset.tab),
                '[data-action="purchase-expertise"]': (e, el) => { e.stopPropagation(); this.handleExpertisePurchase(el); },
                '[data-action^="purchase-"]': (e, el) => { if (el.dataset.action !== 'purchase-expertise') { e.stopPropagation(); this.handleGenericPurchase(el); }},
                '[data-action^="remove-"]': (e, el) => this.handleGenericRemove(el),
                '[data-action="continue-to-summary"]': () => this.builder.switchTab('summary'),
            }
        });
    }

    handleCategorySwitch(newCategory) {
        if (newCategory && newCategory !== this.activeCategory) {
            this.activeCategory = newCategory;
            this.updateActiveCategoryContentUI();
        }
    }
    
    handleExpertisePurchase(element) {
        element.disabled = true;
        const { attribute, expertiseId, expertiseType, level } = element.dataset;
        try {
            UtilitySystem.purchaseExpertise(this.builder.currentCharacter, attribute, expertiseId, expertiseType, level);
            this.builder.updateCharacter();
            this.builder.showNotification(`${expertiseId} ${level} expertise purchased!`, 'success');
        } catch (error) {
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
            this.render(); // Re-render to fix button state on failure
        }
    }

    handleGenericPurchase(element) {
        element.disabled = true;
        const categoryKey = element.dataset.action.split('-')[1] + 's';
        const itemId = element.dataset.itemId;
        try {
            UtilitySystem.purchaseItem(this.builder.currentCharacter, categoryKey, itemId);
            this.builder.updateCharacter();
            this.builder.showNotification(`${this.capitalizeFirst(categoryKey.slice(0,-1))} purchased.`, 'success');
        } catch (error) {
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
            this.render(); // Re-render to fix button state on failure
        }
    }
    
    handleGenericRemove(element) {
        const categoryKey = element.dataset.action.split('-')[1] + 's';
        const itemId = element.dataset.itemId;
        if (confirm(`Remove this ${categoryKey.slice(0,-1)}?`)) {
            try {
                UtilitySystem.removeItem(this.builder.currentCharacter, categoryKey, itemId);
                this.builder.updateCharacter();
                this.builder.showNotification(`${this.capitalizeFirst(categoryKey.slice(0,-1))} removed.`, 'info');
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
        // Granular updates instead of full re-render
        this.updatePointPoolDisplay();
        this.updateActiveCategoryContentUI();
    }
    
    // Granular update method for point pool
    updatePointPoolDisplay() {
        const character = this.builder.currentCharacter;
        if (!character) return;
        
        const pools = PointPoolCalculator.calculateAllPools(character);
        const utilityPool = pools.remaining.utilityPool || 0;
        const available = pools.totalAvailable.utilityPool || 0;
        const spent = pools.totalSpent.utilityPool || 0;
        
        const pointDisplay = document.querySelector('.utility-tab-content .point-display');
        if (pointDisplay) {
            pointDisplay.className = `point-display ${utilityPool < 0 ? 'error' : (utilityPool === 0 && spent > 0 ? 'warning' : 'default')}`;
            pointDisplay.innerHTML = RenderUtils.renderPointDisplay(spent, available, 'Utility Pool', {
                showRemaining: true,
                variant: utilityPool < 0 ? 'error' : (utilityPool === 0 && spent > 0 ? 'warning' : 'default')
            });
        }
    }
    capitalizeFirst(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
}