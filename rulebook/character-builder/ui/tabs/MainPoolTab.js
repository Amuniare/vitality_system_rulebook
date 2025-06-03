// rulebook/character-builder/ui/tabs/MainPoolTab.js
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';
import { FlawPurchaseSection } from '../components/FlawPurchaseSection.js';
import { TraitPurchaseSection } from '../components/TraitPurchaseSection.js';
import { SimpleBoonSection } from '../components/SimpleBoonSection.js';
import { UniqueAbilitySection } from '../components/UniqueAbilitySection.js';
import { ActionUpgradeSection } from '../components/ActionUpgradeSection.js';
import { UpdateManager } from '../shared/UpdateManager.js';
import { EventManager } from '../shared/EventManager.js';
import { RenderUtils } from '../shared/RenderUtils.js';

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

                ${this.renderPointPoolInfo(character)}
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

    renderPointPoolInfo(character) {
        const pools = PointPoolCalculator.calculateAllPools(character);
        const mainPoolInfo = {
            spent: pools.totalSpent.mainPool || 0,
            available: pools.totalAvailable.mainPool || 0,
            remaining: pools.remaining.mainPool || 0
        };
        const breakdown = this.calculatePointBreakdown(character, pools); // Pass full pools

        return `
            <div class="point-pool-display main-pool-specific-display">
                ${RenderUtils.renderPointDisplay(
                    mainPoolInfo.spent,
                    mainPoolInfo.available,
                    'Main Pool',
                    { showRemaining: true, variant: mainPoolInfo.remaining < 0 ? 'error' : mainPoolInfo.remaining === 0 && mainPoolInfo.spent > 0 ? 'warning' : 'default' }
                )}
                <div class="pool-sources">
                    <small>Base: ${Math.max(0, (character.tier - 2) * 15)}
                    ${character.archetypes.uniqueAbility === 'extraordinary' ? ` (+${Math.max(0, (character.tier - 2) * 15)} from Extraordinary)` : ''}
                    </small>
                </div>
                ${this.renderPointUsageBreakdown(breakdown)}
            </div>
        `;
    }

    renderPointUsageBreakdown(breakdown) {
        // Only render if there's something spent
        if (Object.values(breakdown).every(val => val === 0)) {
            return '<div class="empty-state-small">No Main Pool points spent yet.</div>';
        }

        const items = [
            { label: 'Simple Boons', value: breakdown.simpleBoons, class: 'boon-cost' },
            { label: 'Unique Abilities', value: breakdown.uniqueAbilities, class: 'ability-cost' },
            { label: 'Traits', value: breakdown.traits, class: 'trait-cost' },
            { label: 'Flaws (Cost)', value: breakdown.flaws, class: 'flaw-item-cost' }, // Flaws cost points
            { label: 'Action Upgrades', value: breakdown.actions, class: 'action-cost' },
        ].filter(item => item.value > 0);

        return `
            <div class="pool-spending-details">
                <h6>Point Usage Breakdown:</h6>
                <div class="spending-grid grid-layout grid-columns-auto-fit-200">
                    ${items.map(item => `
                        <div class="spending-item ${item.class || ''}">
                            <span>${item.label}:</span>
                            <span>-${item.value}p</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    calculatePointBreakdown(character, pools) { // pools might not be needed if we recalculate from character.mainPoolPurchases
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
        const container = document.querySelector('.main-pool-tab-content');
        if (!container) return;

        EventManager.delegateEvents(container, {
            click: {
                '.section-tab': (e, el) => this.handleSectionSwitch(el.dataset.section),
                '[data-action="continue-to-special-attacks"]': () => this.builder.switchTab('specialAttacks'),
                // Delegate actions for children components
                '[data-action="purchase-flaw"]': (e, el) => this.sections.flaws.handleFlawPurchase(el.dataset.flawId),
                '[data-action="remove-flaw"]': (e, el) => this.sections.flaws.handleFlawRemoval(parseInt(el.dataset.index)),
                '[data-action="clear-trait-builder"]': () => this.sections.traits.handleClearBuilder(),
                '[data-action="purchase-trait"]': () => this.sections.traits.handleTraitPurchase(),
                '[data-action="remove-trait"]': (e, el) => this.sections.traits.handleTraitRemoval(parseInt(el.dataset.index)),
                '[data-action="purchase-simple-boon"]': (e, el) => this.sections.simpleBoons.purchaseSimpleBoon(el.dataset.boonId),
                '[data-action="remove-simple-boon"]': (e, el) => this.sections.simpleBoons.removeBoon(el.dataset.boonId),
                '[data-action="purchase-unique-ability"]': (e, el) => this.sections.uniqueAbilities.purchaseUniqueAbility(el.dataset.abilityId),
                '[data-action="remove-unique-ability"]': (e, el) => this.sections.uniqueAbilities.removeAbility(el.dataset.boonId),
                '[data-action="modify-unique-ability"]': (e, el) => this.sections.uniqueAbilities.modifyAbility(el.dataset.boonId),
                '[data-action="purchase-action-upgrade"]': (e, el) => this.sections.actions.purchaseActionUpgrade(el.dataset.actionId),
                '[data-action="remove-action-upgrade"]': (e, el) => this.sections.actions.removeUpgrade(parseInt(el.dataset.index))
            },
            change: { // For trait builder internal updates
                '.stat-checkbox': (e, el) => { if (this.activeSection === 'traits') this.sections.traits.handleStatSelection(el);},
                '.condition-checkbox': (e, el) => { if (this.activeSection === 'traits') this.sections.traits.handleConditionSelection(el);},
                '.flaw-purchase-section-content .stat-bonus-select': (e, el) => { // Specific to flaw section select
                     if (this.activeSection === 'flaws' && this.sections.flaws.handleStatBonusChange) {
                        this.sections.flaws.handleStatBonusChange(e, el);
                    }
                },
                '.unique-ability-section .upgrade-checkbox': (e, el) => { // Specific to unique ability section
                    if (this.activeSection === 'uniqueAbilities' && this.sections.uniqueAbilities.handleUpgradeSelectionChange) {
                        this.sections.uniqueAbilities.handleUpgradeSelectionChange(el);
                    }
                }
            },
            input: {
                 '.unique-ability-section .upgrade-qty': (e, el) => { // Specific to unique ability section
                    if (this.activeSection === 'uniqueAbilities' && this.sections.uniqueAbilities.handleUpgradeQuantityChange) {
                        this.sections.uniqueAbilities.handleUpgradeQuantityChange(el);
                    }
                }
            }
        });
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
            tab.classList.toggle('active', tab.dataset.section === this.activeSection);
        });
        // Re-render the content of the active section
        const contentArea = document.getElementById('main-pool-active-section');
        if (contentArea && this.builder.currentCharacter) {
            contentArea.innerHTML = this.renderActiveSectionContent(this.builder.currentCharacter);
            // Re-run setupEventListeners for the *newly rendered content of the active section* if it has complex needs
            this.sections[this.activeSection]?.setupEventListeners?.();
        }
    }

    onCharacterUpdate() { // Called by CharacterBuilder
        // Re-render the point pool display and the currently active section
        const pointPoolContainer = document.querySelector('.main-pool-specific-display');
        if (pointPoolContainer && this.builder.currentCharacter) {
            pointPoolContainer.innerHTML = this.renderPointPoolInfo(this.builder.currentCharacter);
        }
        this.updateActiveSectionUI();
    }
}

