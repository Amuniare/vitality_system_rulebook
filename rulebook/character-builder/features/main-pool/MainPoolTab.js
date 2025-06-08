// rulebook/character-builder/ui/tabs/MainPoolTab.js
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';
import { FlawPurchaseSection } from './components/FlawPurchaseSection.js';
import { TraitPurchaseSection } from './components/TraitPurchaseSection.js';
import { SimpleBoonSection } from './components/SimpleBoonSection.js';
import { UniqueAbilitySection } from './components/UniqueAbilitySection.js';
import { ActionUpgradeSection } from './components/ActionUpgradeSection.js';
import { UpdateManager } from '../../shared/utils/UpdateManager.js';
import { EventManager } from '../../shared/utils/EventManager.js';
import { RenderUtils } from '../../shared/utils/RenderUtils.js';
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';

export class MainPoolTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.sections = {
            flaws: new FlawPurchaseSection(characterBuilder),
            traits: new TraitPurchaseSection(characterBuilder),
            simpleBoons: new SimpleBoonSection(characterBuilder),
            uniqueAbilities: new UniqueAbilitySection(characterBuilder),
            actions: new ActionUpgradeSection(characterBuilder)
        };
        this.activeSection = 'flaws'; // Default section
        this.listenersAttached = false;
    }

    render() {
        const tabContent = document.getElementById('tab-mainPool');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = "<p>No character selected or previous steps incomplete.</p>";
            return;
        }

        tabContent.innerHTML = `
            <div class="main-pool-tab-content">
                <h2>Main Pool Purchases</h2>
                <p class="section-description">
                    Use your main pool points to purchase flaws, traits, simple boons, unique abilities, and action upgrades.
                </p>

                <!-- NEW: Main Pool Overview Box -->
                ${this.renderMainPoolOverviewBox(character)}

                <!-- Category sections for PURCHASING ONLY -->
                ${this.renderSectionNavigation()}
                <div class="section-content-area" id="main-pool-active-section">
                    ${this.renderActiveSectionContent(character)}
                </div>

                <div class="next-step">
                    <p><strong>Next Step:</strong> Create your special attacks using limits and upgrades.</p>
                    ${RenderUtils.renderButton({
                        text: 'Continue to Special Attacks →',
                        variant: 'primary',
                        dataAttributes: { action: 'continue-to-special-attacks' }
                    })}
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderMainPoolOverviewBox(character) {
        const pools = PointPoolCalculator.calculateAllPools(character);
        const mainPoolInfo = {
            spent: pools.totalSpent.mainPool || 0,
            available: pools.totalAvailable.mainPool || 0,
            remaining: pools.remaining.mainPool || 0
        };
        const breakdown = this.calculatePointBreakdown(character, pools);

        return `
            <div class="main-pool-overview-box">
                <div class="main-pool-overview-header">
                    <h3>Main Pool Overview</h3>
                    ${RenderUtils.renderPointDisplay(
                        mainPoolInfo.spent,
                        mainPoolInfo.available,
                        'Main Pool',
                        { showRemaining: true, variant: mainPoolInfo.remaining < 0 ? 'error' : mainPoolInfo.remaining === 0 && mainPoolInfo.spent > 0 ? 'warning' : 'default' }
                    )}
                </div>
                <div class="pool-sources">
                    <small>Base: ${Math.max(0, (character.tier - 2) * 15)}
                    ${character.archetypes.uniqueAbility === 'extraordinary' ? ` (+${Math.max(0, (character.tier - 2) * 15)} from Extraordinary)` : ''}
                    </small>
                </div>
                
                ${this.renderMainPoolCategoryBreakdown(breakdown)}
                ${this.renderSelectedMainPoolItems(character)}
            </div>
        `;
    }

    renderMainPoolCategoryBreakdown(breakdown) {
        const categories = [
            { key: 'simpleBoons', label: 'Simple Boons', value: breakdown.simpleBoons },
            { key: 'uniqueAbilities', label: 'Unique Abilities', value: breakdown.uniqueAbilities },
            { key: 'traits', label: 'Traits', value: breakdown.traits },
            { key: 'flaws', label: 'Flaws', value: breakdown.flaws },
            { key: 'actions', label: 'Action Upgrades', value: breakdown.actions }
        ];

        // Calculate counts for each category
        const character = this.builder.currentCharacter;
        const categoryData = categories.map(category => {
            let count = 0;
            switch(category.key) {
                case 'simpleBoons':
                    count = character.mainPoolPurchases.boons.filter(b => b.type === 'simple' || !b.type).length;
                    break;
                case 'uniqueAbilities':
                    count = character.mainPoolPurchases.boons.filter(b => b.type === 'unique').length;
                    break;
                case 'traits':
                    count = character.mainPoolPurchases.traits.length;
                    break;
                case 'flaws':
                    count = character.mainPoolPurchases.flaws.length;
                    break;
                case 'actions':
                    count = character.mainPoolPurchases.primaryActionUpgrades.length;
                    break;
            }
            return { ...category, count };
        });

        const totalItems = categoryData.reduce((sum, cat) => sum + cat.count, 0);

        if (totalItems === 0) {
            return `
                <div class="main-pool-breakdown">
                    <h4>Category Breakdown</h4>
                    <div class="empty-state">No main pool purchases yet.</div>
                </div>
            `;
        }

        return `
            <div class="main-pool-breakdown">
                <h4>Category Breakdown (${totalItems} items)</h4>
                <div class="breakdown-grid">
                    ${categoryData.map(cat => `
                        <div class="breakdown-item ${cat.count === 0 ? 'empty' : ''}">
                            <span class="breakdown-label">${cat.label}</span>
                            <span class="breakdown-count">${cat.count}</span>
                            <span class="breakdown-cost">${cat.value > 0 ? '-' : ''}${cat.value}p</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderSelectedMainPoolItems(character) {
        const allPurchases = [];

        // Gather all purchased items into a single array with type labels
        allPurchases.push(...character.mainPoolPurchases.flaws.map((item, index) => ({
            ...item,
            category: 'flaws',
            typeLabel: 'Flaw',
            dataAttributes: {
                'index': index
            }
        })));

        allPurchases.push(...character.mainPoolPurchases.traits.map((item, index) => ({
            ...item,
            name: this.generateTraitDisplayName(item, character),
            category: 'traits',
            typeLabel: 'Trait',
            dataAttributes: {
                'index': index
            }
        })));

        allPurchases.push(...character.mainPoolPurchases.boons.filter(b => b.type === 'simple' || !b.type).map(item => ({
            ...item,
            category: 'simpleBoons',
            typeLabel: 'Simple Boon',
            dataAttributes: {
                'boon-id': item.boonId
            }
        })));

        allPurchases.push(...character.mainPoolPurchases.boons.filter(b => b.type === 'unique').map(item => ({
            ...item,
            category: 'uniqueAbilities',
            typeLabel: 'Unique Ability',
            dataAttributes: {
                'boon-id': item.boonId
            }
        })));

        allPurchases.push(...character.mainPoolPurchases.primaryActionUpgrades.map((item, index) => ({
            ...item,
            name: item.actionName || item.name, // Fix for action upgrades that use actionName
            category: 'actions',
            typeLabel: 'Action Upgrade',
            dataAttributes: {
                'index': index
            }
        })));

        if (allPurchases.length === 0) {
            return `
                <div class="selected-main-pool-items">
                    ${RenderUtils.renderPurchasedList([], (item) => this.renderSelectedMainPoolItem(item), { 
                        title: 'Purchased Items',
                        showCount: false,
                        emptyMessage: 'No main pool purchases yet. Browse the categories below to add items.'
                    })}
                </div>
            `;
        }

        return `
            <div class="selected-main-pool-items">
                ${RenderUtils.renderPurchasedList(allPurchases, (item) => this.renderSelectedMainPoolItem(item), { 
                    title: 'Purchased Items',
                    showCount: false
                })}
            </div>
        `;
    }

    renderSelectedMainPoolItem(item) {
        // Map the correct action for each category based on existing event handlers
        let actionKey;
        switch(item.category) {
            case 'simpleBoons':
                actionKey = 'remove-simple-boon';
                break;
            case 'uniqueAbilities':
                actionKey = 'remove-unique-ability';
                break;
            case 'traits':
                actionKey = 'remove-trait';
                break;
            case 'flaws':
                actionKey = 'remove-flaw';
                break;
            case 'actions':
                actionKey = 'remove-action-upgrade';
                break;
            default:
                actionKey = `remove-${item.category.slice(0, -1)}`;
        }

        const costText = item.cost !== undefined ? `${Math.abs(item.cost)}p` : '';

        return `
            <div class="purchased-item">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-details">${item.typeLabel}</span>
                    ${costText ? `<span class="item-cost">${costText}</span>` : ''}
                </div>
                ${RenderUtils.renderButton({ 
                    text: 'Remove', 
                    variant: 'danger', 
                    size: 'small', 
                    dataAttributes: { 
                        action: actionKey,
                        ...item.dataAttributes
                    } 
                })}
            </div>
        `;
    }

    calculatePointBreakdown(character, pools) {
        return {
            simpleBoons: character.mainPoolPurchases.boons.filter(b => b.type === 'simple' || !b.type).reduce((sum, b) => sum + (b.cost || 0), 0),
            uniqueAbilities: character.mainPoolPurchases.boons.filter(b => b.type === 'unique').reduce((sum, b) => sum + (b.cost || 0), 0),
            traits: character.mainPoolPurchases.traits.reduce((sum, t) => sum + (t.cost || 0), 0),
            flaws: character.mainPoolPurchases.flaws.reduce((sum, f) => sum + (f.cost || 0), 0),
            actions: character.mainPoolPurchases.primaryActionUpgrades.reduce((sum, a) => sum + (a.cost || 0), 0),
        };
    }

    renderSectionNavigation() {
        const sectionTabsConfig = [
            { id: 'flaws', label: 'Flaws' },
            { id: 'traits', label: 'Traits' },
            { id: 'simpleBoons', label: 'Simple Boons' },
            { id: 'uniqueAbilities', label: 'Unique Abilities' },
            { id: 'actions', label: 'Action Upgrades' }
        ];
        return RenderUtils.renderTabs(sectionTabsConfig, this.activeSection, { navClass: 'section-tabs', tabButtonClass: 'section-tab' });
    }

    renderActiveSectionContent(character) {
        const sectionComponent = this.sections[this.activeSection];
        if (!sectionComponent) return '<p class="error-text">Error: Selected section not found.</p>';

        const pools = PointPoolCalculator.calculateAllPools(character);
        const mainPoolInfo = {
            spent: pools.totalSpent.mainPool || 0,
            available: pools.totalAvailable.mainPool || 0,
            remaining: pools.remaining.mainPool || 0
        };
        return sectionComponent.render(character, mainPoolInfo);
    }

    setupEventListeners() {
        if (this.listenersAttached) {
            return;
        }
        
        const container = document.getElementById('tab-mainPool');
        if (!container) return;

        EventManager.delegateEvents(container, {
            click: {
                // FIX: Change from data-section to data-tab to match RenderUtils.renderTabs()
                '.section-tab': (e, el) => this.handleSectionSwitch(el.dataset.tab),
                '[data-action="continue-to-special-attacks"]': () => this.builder.switchTab('specialAttacks'),
                // Delegate actions for children components
                '[data-action="purchase-flaw"]': (e, el) => this.sections.flaws.handleFlawPurchase(el.dataset.flawId),
                '[data-action="remove-flaw"]': (e, el) => this.sections.flaws.handleFlawRemoval(parseInt(el.dataset.index)),
                '[data-action="clear-trait-builder"]': () => this.sections.traits.handleClearBuilder(),
                '[data-action="purchase-trait"]': () => this.sections.traits.handleTraitPurchase(),
                '[data-action="remove-trait"]': (e, el) => this.sections.traits.handleTraitRemoval(parseInt(el.dataset.index)),
                '[data-action="trait-stat-toggle"]': (e, el) => {
                    console.log('🔍 MainPoolTab caught trait-stat-toggle event', el);
                    this.sections.traits.handleStatToggle(el);
                },
                '[data-action="trait-condition-toggle"]': (e, el) => {
                    console.log('🔍 MainPoolTab caught trait-condition-toggle event', el);
                    this.sections.traits.handleConditionToggle(el);
                },
                '[data-action="purchase-simple-boon"]': (e, el) => this.sections.simpleBoons.purchaseSimpleBoon(el.dataset.boonId),
                '[data-action="remove-simple-boon"]': (e, el) => this.sections.simpleBoons.removeBoon(el.dataset.boonId),
                '[data-action="purchase-unique-ability"]': (e, el) => this.sections.uniqueAbilities.purchaseUniqueAbility(el.dataset.abilityId),
                '[data-action="remove-unique-ability"]': (e, el) => this.sections.uniqueAbilities.removeAbility(el.dataset.boonId),
                '[data-action="modify-unique-ability"]': (e, el) => this.sections.uniqueAbilities.modifyAbility(el.dataset.boonId),
                '[data-action="toggle-upgrade"]': (e, el) => this.sections.uniqueAbilities.handleUpgradeToggle(el),
                '[data-action="purchase-action-upgrade"]': (e, el) => this.sections.actions.purchaseActionUpgrade(el.dataset.actionId),
                '[data-action="remove-action-upgrade"]': (e, el) => this.sections.actions.removeUpgrade(parseInt(el.dataset.index))
            },
            change: {
                '.stat-checkbox': (e, el) => { if (this.activeSection === 'traits') this.sections.traits.handleStatSelection(el);},
                '.condition-checkbox': (e, el) => { if (this.activeSection === 'traits') this.sections.traits.handleConditionSelection(el);},
                '.flaw-purchase-section-content .stat-bonus-select': (e, el) => {
                     if (this.activeSection === 'flaws' && this.sections.flaws.handleStatBonusChange) {
                        this.sections.flaws.handleStatBonusChange(e, el);
                    }
                }
            },
            input: {
                // Input handlers removed for unique abilities since we're using card-based selection
            }
        });
        
        this.listenersAttached = true;
        console.log('✅ MainPoolTab event listeners attached ONCE.');
        
        // Call setup for the currently active section if it has its own more complex listeners
        this.sections[this.activeSection]?.setupEventListeners?.();
    }

    handleSectionSwitch(newSection) {
        if (newSection && newSection !== this.activeSection) {
            this.activeSection = newSection;
            this.updateActiveSectionUI();
        }
    }

    updateActiveSectionUI() {
        // Update tab button active states
        document.querySelectorAll('.main-pool-tab-content .section-tab').forEach(tab => {
            // FIX: Change from data-section to data-tab
            tab.classList.toggle('active', tab.dataset.tab === this.activeSection);
        });
        // Re-render the content of the active section
        const contentArea = document.getElementById('main-pool-active-section');
        if (contentArea && this.builder.currentCharacter) {
            contentArea.innerHTML = this.renderActiveSectionContent(this.builder.currentCharacter);
            // Re-run setupEventListeners for the *newly rendered content of the active section* if it has complex needs
            this.sections[this.activeSection]?.setupEventListeners?.();
        }
    }

    onCharacterUpdate() {
        // Reset listeners flag since we're doing a full re-render
        this.listenersAttached = false;
        this.render(); // Full re-render is simplest for this tab after updates
    }

    generateTraitDisplayName(trait, character) {
        // Generate a descriptive name for the trait based on its stats and conditions
        const statNames = trait.statBonuses?.map(statId => {
            const statOptions = TraitFlawSystem.getTraitStatOptions();
            const stat = statOptions.find(s => s.id === statId);
            return stat ? stat.name : statId;
        }) || [];

        const conditionNames = trait.conditions?.map(conditionId => {
            const tiers = TraitFlawSystem.getTraitConditionTiers();
            for (const tier of Object.values(tiers)) {
                const condition = tier.conditions?.find(c => c.id === conditionId);
                if (condition) return condition.name;
            }
            return conditionId;
        }) || [];

        const statsText = statNames.length > 0 ? statNames.join('/') : 'Unknown Stats';
        const conditionsText = conditionNames.length > 0 ? conditionNames.slice(0, 2).join(' & ') : 'Unknown Conditions';
        
        return `+${character.tier} ${statsText} when ${conditionsText}${conditionNames.length > 2 ? '...' : ''}`;
    }

}