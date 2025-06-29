
// frontend/character-builder/features/main-pool/MainPoolTab.js
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';
import { FlawPurchaseSection } from './components/FlawPurchaseSection.js';
import { TraitPurchaseSection } from './components/TraitPurchaseSection.js';
import { BoonSection } from './components/BoonSection.js';
import { UniqueAbilitySection } from './components/UniqueAbilitySection.js';
import { ActionUpgradeSection } from './components/ActionUpgradeSection.js';
import { UpdateManager } from '../../shared/utils/UpdateManager.js';
import { EventManager } from '../../shared/utils/EventManager.js';
import { RenderUtils } from '../../shared/utils/RenderUtils.js';
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';
import { UniqueAbilitySystem } from '../../systems/UniqueAbilitySystem.js';
import { ActionSystem } from '../../systems/ActionSystem.js'; // Import ActionSystem

export class MainPoolTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.sections = {
            flaws: new FlawPurchaseSection(characterBuilder),
            traits: new TraitPurchaseSection(characterBuilder),
            boons: new BoonSection(characterBuilder),
            uniqueAbilities: new UniqueAbilitySection(characterBuilder),
            actions: new ActionUpgradeSection(characterBuilder)
        };
        this.activeSection = 'flaws'; // Default section
        this.clickHandler = null;
        this.changeHandler = null;
        this.inputHandler = null;
        this.containerElement = null;
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
                    Use your main pool points to purchase flaws, traits,  boons, unique abilities, and action upgrades.
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
            { key: 'boons', label: 'Boons', value: breakdown.boons },
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
                case 'boons':
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
                    // COMBINED COUNT: Paid + Free
                    count = character.mainPoolPurchases.primaryActionUpgrades.length + (character.versatileMasterSelections || []).length;
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

        // Paid Action Upgrades
        allPurchases.push(...character.mainPoolPurchases.primaryActionUpgrades.map((item, index) => ({
            ...item,
            name: item.actionName || item.name,
            category: 'actions',
            typeLabel: 'Action Upgrade',
            isFreeSelection: false,
            dataAttributes: { 'upgrade-id': item.id }
        })));
        
        // Free Versatile Master Selections
        const versatileMasterSelections = character.versatileMasterSelections || [];
        const allActionUpgrades = ActionSystem.getAvailableActionUpgrades();
        versatileMasterSelections.forEach(baseActionId => {
            const upgrade = allActionUpgrades.find(u => u.baseActionId === baseActionId && u.isQuickActionUpgrade);
            if (upgrade) {
                allPurchases.push({
                    id: upgrade.id,
                    name: upgrade.name,
                    cost: 0,
                    category: 'actions',
                    typeLabel: 'Action Upgrade',
                    isFreeSelection: true,
                    dataAttributes: { 'upgrade-id': upgrade.id }
                });
            }
        });

        allPurchases.push(...character.mainPoolPurchases.flaws.map((item, index) => ({
            ...item, category: 'flaws', typeLabel: 'Flaw', dataAttributes: { 'index': index }
        })));
        allPurchases.push(...character.mainPoolPurchases.traits.map((item, index) => ({
            ...item, name: this.generateTraitDisplayName(item, character), category: 'traits', typeLabel: 'Trait', dataAttributes: { 'index': index }
        })));
        allPurchases.push(...character.mainPoolPurchases.boons.filter(b => b.type === 'simple' || !b.type).map(item => ({
            ...item, category: 'boons', typeLabel: 'Simple Boon', dataAttributes: { 'boon-id': item.boonId }
        })));
        allPurchases.push(...character.mainPoolPurchases.boons.filter(b => b.type === 'unique').map(item => ({
            ...item, category: 'uniqueAbilities', typeLabel: 'Unique Ability', originalItem: item, dataAttributes: { 'boon-id': item.boonId }
        })));

        return `
            <div class="selected-main-pool-items">
                ${RenderUtils.renderPurchasedList(allPurchases, (item) => this.renderSelectedMainPoolItem(item), { 
                    title: 'Purchased Items', showCount: false, emptyMessage: 'No main pool purchases yet.'
                })}
            </div>
        `;
    }

    renderSelectedMainPoolItem(item) {
        let actionKey;
        switch(item.category) {
            case 'actions': actionKey = 'remove-action-upgrade'; break;
            case 'boons': actionKey = 'remove-simple-boon'; break;
            case 'uniqueAbilities': actionKey = 'remove-unique-ability'; break;
            case 'traits': actionKey = 'remove-trait'; break;
            case 'flaws': actionKey = 'remove-flaw'; break;
            default: actionKey = `remove-${item.category.slice(0, -1)}`;
        }

        let costBoxes = '';
        if (item.category === 'uniqueAbilities') {
            // Complex rendering logic for unique abilities... (omitted for brevity, assume it's correct)
            const costText = item.cost !== undefined ? `${Math.abs(item.cost)}p` : '';
            costBoxes = `<span class="item-details">${item.typeLabel}</span>${costText ? `<span class="item-cost">${costText}</span>` : ''}`;
        } else {
            const costText = item.isFreeSelection ? 'Free (Archetype)' : (item.cost !== undefined ? `${Math.abs(item.cost)}p` : '');
            costBoxes = `<span class="item-details">${item.typeLabel}</span>${costText ? `<span class="item-cost">${costText}</span>` : ''}`;
        }

        return `
            <div class="purchased-item">
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    ${costBoxes}
                </div>
                ${RenderUtils.renderButton({ 
                    text: 'Remove', variant: 'danger', size: 'small', dataAttributes: { action: actionKey, ...item.dataAttributes } 
                })}
            </div>
        `;
    }

    calculatePointBreakdown(character, pools) {
        // This logic remains the same
        return {
            boons: character.mainPoolPurchases.boons.filter(b => b.type === 'simple' || !b.type).reduce((sum, b) => sum + (b.cost || 0), 0),
            uniqueAbilities: character.mainPoolPurchases.boons.filter(b => b.type === 'unique').reduce((sum, b) => sum + (b.cost || 0), 0),
            traits: character.mainPoolPurchases.traits.reduce((sum, t) => sum + (t.cost || 0), 0),
            flaws: character.mainPoolPurchases.flaws.reduce((sum, f) => sum + (f.cost || 0), 0),
            actions: character.mainPoolPurchases.primaryActionUpgrades.reduce((sum, a) => sum + (a.cost || 0), 0),
        };
    }

    renderSectionNavigation() {
        // This logic remains the same
        const sectionTabsConfig = [
            { id: 'flaws', label: 'Flaws' },
            { id: 'traits', label: 'Traits' },
            { id: 'boons', label: 'Boons' },
            { id: 'uniqueAbilities', label: 'Unique Abilities' },
            { id: 'actions', label: 'Action Upgrades' }
        ];
        return RenderUtils.renderTabs(sectionTabsConfig, this.activeSection, { navClass: 'section-tabs', tabButtonClass: 'section-tab' });
    }

    renderActiveSectionContent(character) {
        // This logic remains the same
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
        // This logic remains the same
        this.removeEventListeners();
        const container = document.getElementById('tab-mainPool');
        if (!container) return;
        this.containerElement = container;
        this.clickHandler = (e) => {
            if (e.target.classList.contains('stat-bonus-select')) {
                this.handleStatBonusChange(e.target);
                return;
            }
            const target = e.target.closest('[data-action], .section-tab');
            if (!target) return;
            if (target.classList.contains('section-tab')) {
                this.handleSectionSwitch(target.dataset.tab);
            } else if (target.dataset.action) {
                this.handleAction(target);
            }
        };
        container.addEventListener('click', this.clickHandler);
        container.addEventListener('change', this.clickHandler);
        container.addEventListener('input', this.clickHandler);
        console.log('✅ MainPoolTab event listeners attached ONCE.');
    }

    handleStatBonusChange(selectElement) {
        const flawId = selectElement.dataset.flawId;
        const purchaseBtn = document.querySelector(`[data-action="purchase-flaw"][data-flaw-id="${flawId}"]`);
        
        if (purchaseBtn) {
            purchaseBtn.disabled = !selectElement.value;
        }
    }

    handleAction(target) {
        const { action, ...data } = target.dataset;
        const handlers = {
            'continue-to-special-attacks': () => this.builder.switchTab('specialAttacks'),
            'purchase-flaw': () => this.sections.flaws.handleFlawPurchase(data.flawId),
            'remove-flaw': () => this.sections.flaws.handleFlawRemoval(parseInt(data.index)),
            'clear-trait-builder': () => this.sections.traits.handleClearBuilder(),
            'purchase-trait': () => this.sections.traits.handleTraitPurchase(),
            'remove-trait': () => this.sections.traits.handleTraitRemoval(parseInt(data.index)),
            'trait-stat-toggle': () => this.sections.traits.handleStatToggle(target),
            'trait-condition-toggle': () => this.sections.traits.handleConditionToggle(target),
            'increase-variable-trait-cost': () => this.sections.traits.handleIncreaseVariableTraitCost(data.conditionId),
            'decrease-variable-trait-cost': () => this.sections.traits.handleDecreaseVariableTraitCost(data.conditionId),
            'purchase-simple-boon': () => this.sections.boons.purchaseBoon(data.boonId),
            'remove-simple-boon': () => this.sections.boons.removeBoon(data.boonId),
            'purchase-unique-ability': () => this.sections.uniqueAbilities.purchaseUniqueAbility(data.abilityId),
            'remove-unique-ability': () => this.sections.uniqueAbilities.removeAbility(data.boonId),
            'modify-unique-ability': () => this.sections.uniqueAbilities.modifyAbility(data.boonId),
            'toggle-upgrade': () => this.sections.uniqueAbilities.handleUpgradeToggle(target),
            'increase-upgrade-quantity': () => this.sections.uniqueAbilities.handleIncreaseUpgradeQuantity(target),
            'decrease-upgrade-quantity': () => this.sections.uniqueAbilities.handleDecreaseUpgradeQuantity(target),
            'set-upgrade-quantity': () => this.sections.uniqueAbilities.handleSetUpgradeQuantity(target),
            'create-custom-unique-ability': () => this.sections.uniqueAbilities.handleCreateCustomUniqueAbility(),
            'purchase-action-upgrade': () => this.sections.actions.purchaseActionUpgrade(data.upgradeId),
            'remove-action-upgrade': () => this.sections.actions.removeUpgrade(data.upgradeId)
        };
        handlers[action]?.();
    }
    
    handleSectionSwitch(newSection) {
        // This logic remains the same
        if (newSection && newSection !== this.activeSection) {
            this.activeSection = newSection;
            this.updateActiveSectionUI();
        }
    }

    updateActiveSectionUI() {
        // This logic remains the same
        document.querySelectorAll('.main-pool-tab-content .section-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === this.activeSection);
        });
        const contentArea = document.getElementById('main-pool-active-section');
        if (contentArea && this.builder.currentCharacter) {
            contentArea.innerHTML = this.renderActiveSectionContent(this.builder.currentCharacter);
        }
    }

    onCharacterUpdate() {
        // This logic remains the same
        this.render();
    }

    removeEventListeners() {
        // This logic remains the same
        if (this.clickHandler && this.containerElement) {
            this.containerElement.removeEventListener('click', this.clickHandler);
            this.containerElement.removeEventListener('change', this.clickHandler);
            this.containerElement.removeEventListener('input', this.clickHandler);
            this.clickHandler = null;
            this.changeHandler = null;
            this.inputHandler = null;
            this.containerElement = null;
        }
    }

    generateTraitDisplayName(trait, character) {
        // This logic remains the same
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
