// rulebook/character-builder/features/utility/UtilityTab.js
// REWRITTEN to include a unified "Selected Utilities" display
import { EventManager } from '../../shared/utils/EventManager.js';
import { RenderUtils } from '../../shared/utils/RenderUtils.js';
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';
import { UtilitySystem } from '../../systems/UtilitySystem.js';

export class UtilityTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.activeCategory = 'activity-expertise';
        this.listenersAttached = false;
    }

    render() {
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
                
                <!-- NEW: Utility Overview Box -->
                ${this.renderUtilityOverviewBox(character)}

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

    renderUtilityOverviewBox(character) {
        const pools = PointPoolCalculator.calculateAllPools(character);
        const utilityPool = pools.remaining.utilityPool || 0;
        const available = pools.totalAvailable.utilityPool || 0;
        const spent = pools.totalSpent.utilityPool || 0;
        
        return `
            <div class="utility-overview-box">
                <div class="utility-overview-header">
                    <h3>Utility Pool Overview</h3>
                    ${RenderUtils.renderPointDisplay(spent, available, 'Utility Pool', {
                        showRemaining: true,
                        variant: utilityPool < 0 ? 'error' : (utilityPool === 0 && spent > 0 ? 'warning' : 'default')
                    })}
                </div>
                
                ${this.renderUtilityCategoryBreakdown(character)}
                ${this.renderSelectedUtilities(character)}
            </div>
        `;
    }

    renderUtilityCategoryBreakdown(character) {
        const categories = [
            { key: 'expertise', label: 'Expertise', type: 'expertise' },
            { key: 'features', label: 'Features', type: 'simple' },
            { key: 'senses', label: 'Senses', type: 'simple' },
            { key: 'movement', label: 'Movement', type: 'simple' },
            { key: 'descriptors', label: 'Descriptors', type: 'simple' }
        ];

        const breakdown = categories.map(category => {
            let count = 0;
            let cost = 0;

            if (category.type === 'expertise') {
                const expertise = character.utilityPurchases.expertise || {};
                Object.values(expertise).forEach(levels => {
                    count += (levels.basic || []).length + (levels.mastered || []).length;
                    cost += (levels.basic || []).length * 2 + (levels.mastered || []).length * 4;
                });
            } else {
                const items = character.utilityPurchases[category.key] || [];
                count = items.length;
                cost = items.reduce((sum, item) => sum + (item.cost || 0), 0);
            }

            return { ...category, count, cost };
        });

        const totalItems = breakdown.reduce((sum, cat) => sum + cat.count, 0);

        return `
            <div class="utility-breakdown">
                <h4>Category Breakdown (${totalItems} abilities)</h4>
                <div class="breakdown-grid">
                    ${breakdown.map(cat => `
                        <div class="breakdown-item">
                            <span class="breakdown-label">${cat.label}</span>
                            <span class="breakdown-count">${cat.count}</span>
                            <span class="breakdown-cost">${cat.cost}p</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // NEW: Renders the unified list of all purchased utilities
    renderSelectedUtilities(character) {
        const allPurchases = [];

        // Gather all purchased items into a single array with type labels
        allPurchases.push(...(character.utilityPurchases.features || []).map(item => ({...item, category: 'features', typeLabel: 'Feature'})));
        allPurchases.push(...(character.utilityPurchases.senses || []).map(item => ({...item, category: 'senses', typeLabel: 'Sense'})));
        allPurchases.push(...(character.utilityPurchases.movement || []).map(item => ({...item, category: 'movement', typeLabel: 'Movement'})));
        allPurchases.push(...(character.utilityPurchases.descriptors || []).map(item => ({...item, category: 'descriptors', typeLabel: 'Descriptor'})));

        // Handle the nested structure of expertise
        Object.entries(character.utilityPurchases.expertise || {}).forEach(([attribute, levels]) => {
            (levels.basic || []).forEach(id => allPurchases.push({ id, name: id, cost: UtilitySystem.getExpertiseCost('activity', 'basic'), category: 'expertise', typeLabel: 'Expertise (Basic)', attribute, level: 'basic' }));
            (levels.mastered || []).forEach(id => allPurchases.push({ id, name: id, cost: UtilitySystem.getExpertiseCost('activity', 'mastered'), category: 'expertise', typeLabel: 'Expertise (Mastered)', attribute, level: 'mastered' }));
        });

        if (allPurchases.length === 0) {
            return `
                <div class="selected-utilities">
                    <h4>Selected Utilities</h4>
                    <div class="empty-state">No utility abilities purchased yet. Browse the categories below to add some.</div>
                </div>
            `;
        }
        
        return `
            <div class="selected-utilities">
                <h4>Selected Utilities (${allPurchases.length})</h4>
                ${RenderUtils.renderPurchasedList(allPurchases, (item) => this.renderSelectedItem(item))}
            </div>
        `;
    }

    // NEW: Renders a single item in the unified list
    renderSelectedItem(item) {
        const removeData = {
            action: 'remove-utility-item',
            'category-key': item.category,
            'item-id': item.id,
            ...(item.category === 'expertise' && { 'attribute': item.attribute, 'level': item.level })
        };
        const costText = item.cost !== undefined ? `${item.cost}p` : '';

        return `
            <div class="purchased-item">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-details">${item.typeLabel}</span>
                    ${costText ? `<span class="item-cost">${costText}</span>` : ''}
                </div>
                ${RenderUtils.renderButton({ text: 'Remove', variant: 'danger', size: 'small', dataAttributes: removeData })}
            </div>
        `;
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
            'activity-expertise': () => this.renderActivityExpertiseSection(character),
            'situational-expertise': () => this.renderSituationalExpertiseSection(character),
            features: () => this.renderGenericUtilitySection(character, 'features', UtilitySystem.getAvailableFeatures()),
            senses: () => this.renderGenericUtilitySection(character, 'senses', UtilitySystem.getAvailableSenses()),
            movement: () => this.renderGenericUtilitySection(character, 'movement', UtilitySystem.getMovementFeatures()),
            descriptors: () => this.renderGenericUtilitySection(character, 'descriptors', UtilitySystem.getDescriptors())
        };
        return renderers[this.activeCategory]?.() ?? `<div class="empty-state">Select a utility category.</div>`;
    }

    renderActivityExpertiseSection(character) {
        const expertiseCategories = UtilitySystem.getExpertiseCategories();
        const availableContent = Object.entries(expertiseCategories).map(([attrKey, attrData]) =>
            this.renderAttributeActivityExpertiseBlock(attrKey, attrData, character)
        ).join('');
        
        return `
            <div class="expertise-section">
                <h4>Available Activity-Based Expertise</h4>
                <p class="section-description">Skills and professions that enhance your capabilities. Basic adds your Tier to checks, Mastered adds twice your Tier.</p>
                <div class="expertise-main-grid grid-layout grid-columns-auto-fit-300">${availableContent}</div>
            </div>
        `;
    }

    renderSituationalExpertiseSection(character) {
        const expertiseCategories = UtilitySystem.getExpertiseCategories();
        const availableContent = Object.entries(expertiseCategories).map(([attrKey, attrData]) =>
            this.renderAttributeSituationalExpertiseBlock(attrKey, attrData, character)
        ).join('');
        
        return `
            <div class="expertise-section">
                <h4>Available Situational Expertise</h4>
                <p class="section-description">Circumstantial training that helps in specific situations. Basic adds your Tier to checks, Mastered adds twice your Tier.</p>
                <div class="expertise-main-grid grid-layout grid-columns-auto-fit-300">${availableContent}</div>
            </div>
        `;
    }

    renderAttributeActivityExpertiseBlock(attrKey, attrData, character) {
        const costs = UtilitySystem.getExpertiseCosts();
        const activities = attrData.activities || [];
        
        if (activities.length === 0) {
            return RenderUtils.renderCard({
                title: `${attrKey} Activity Expertise`, titleTag: 'h4',
                additionalContent: '<p class="empty-state-small">No activity-based expertise available for this attribute.</p>'
            }, { cardClass: 'expertise-attribute-card' });
        }

        return RenderUtils.renderCard({
            title: `${attrKey} Activity Expertise`, titleTag: 'h4',
            additionalContent: `
                <div class="expertise-subsection">
                    <h5>Basic: ${costs.activityBased.basic.cost}p / Mastered: ${costs.activityBased.mastered.cost}p</h5>
                    <div class="expertise-cards-grid">${activities.map(ex => this.renderSingleExpertiseOption(ex, attrKey, 'activity', character)).join('')}</div>
                </div>`
        }, { cardClass: 'expertise-attribute-card' });
    }

    renderAttributeSituationalExpertiseBlock(attrKey, attrData, character) {
        const costs = UtilitySystem.getExpertiseCosts();
        const situational = attrData.situational || [];
        
        if (situational.length === 0) {
            return RenderUtils.renderCard({
                title: `${attrKey} Situational Expertise`, titleTag: 'h4',
                additionalContent: '<p class="empty-state-small">No situational expertise available for this attribute.</p>'
            }, { cardClass: 'expertise-attribute-card' });
        }

        return RenderUtils.renderCard({
            title: `${attrKey} Situational Expertise`, titleTag: 'h4',
            additionalContent: `
                <div class="expertise-subsection">
                    <h5>Basic: ${costs.situational.basic.cost}p / Mastered: ${costs.situational.mastered.cost}p</h5>
                    <div class="expertise-cards-grid">${situational.map(ex => this.renderSingleExpertiseOption(ex, attrKey, 'situational', character)).join('')}</div>
                </div>`
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

    // SIMPLIFIED: No longer renders purchased list
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
                <h3>Available ${title}</h3>
                ${RenderUtils.renderGrid(
                    availableItems,
                    (item) => {
                        const canAfford = remainingUtilityPoints >= item.cost;
                        return RenderUtils.renderCard({
                            title: item.name, cost: item.cost, description: item.description,
                            status: canAfford ? 'available' : 'unaffordable',
                            clickable: canAfford, disabled: !canAfford,
                            dataAttributes: { action: `purchase-item`, 'category-key': categoryKey, 'item-id': item.id }
                        }, { cardClass: `${categoryKey.slice(0, -1)}-card`, showStatus: true });
                    }, { gridContainerClass: 'grid-layout utility-item-grid', gridSpecificClass: 'grid-columns-auto-fit-280' }
                )}
            </div>`;
    }

    setupEventListeners() {
        if (this.listenersAttached) return;
        
        const container = document.querySelector('.utility-tab-content');
        if (!container) return;

        EventManager.delegateEvents(container, {
            click: {
                '.section-tab': (e, el) => this.handleCategorySwitch(el.dataset.tab),
                '[data-action="purchase-expertise"]': (e, el) => { e.stopPropagation(); this.handleExpertisePurchase(el); },
                '[data-action="purchase-item"]': (e, el) => { e.stopPropagation(); this.handleGenericPurchase(el); },
                '[data-action="remove-utility-item"]': (e, el) => { e.stopPropagation(); this.handleGenericRemove(el); },
                '[data-action="continue-to-summary"]': () => this.builder.switchTab('summary'),
            }
        });
        
        this.listenersAttached = true;
        console.log('✅ UtilityTab event listeners attached ONCE.');
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
        try {
            UtilitySystem.purchaseExpertise(this.builder.currentCharacter, attribute, expertiseId, expertiseType, level);
            this.builder.updateCharacter();
            this.builder.showNotification(`${expertiseId} ${level} expertise purchased!`, 'success');
        } catch (error) {
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
            this.onCharacterUpdate(); // Re-render to fix button state on failure
        }
    }

    handleGenericPurchase(element) {
        element.disabled = true; // Prevent double-clicks
        const { categoryKey, itemId } = element.dataset;
        try {
            UtilitySystem.purchaseItem(this.builder.currentCharacter, categoryKey, itemId);
            this.builder.updateCharacter();
            this.builder.showNotification(`${this.capitalizeFirst(categoryKey.slice(0,-1))} purchased.`, 'success');
        } catch (error) {
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
            this.onCharacterUpdate(); // Re-render to fix button state on failure
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
        // Reset listeners flag since we're doing a full re-render
        this.listenersAttached = false;
        this.render(); // Full re-render is simplest for this tab after updates
    }
    
    capitalizeFirst(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
}