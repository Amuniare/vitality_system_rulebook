// MainPoolTab.js - Main pool purchases with 5 sections (FIXED for Phase 2)
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js'; // ✅ FIXED IMPORT
import { FlawPurchaseSection } from '../components/FlawPurchaseSection.js';
import { TraitPurchaseSection } from '../components/TraitPurchaseSection.js';
import { SimpleBoonSection } from '../components/SimpleBoonSection.js';
import { UniqueAbilitySection } from '../components/UniqueAbilitySection.js';
import { ActionUpgradeSection } from '../components/ActionUpgradeSection.js';

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
        this.activeSection = 'flaws';
    }

    render() {
        const tabContent = document.getElementById('tab-mainPool');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) return;

        tabContent.innerHTML = `
            <div class="main-pool-section">
                <h2>Main Pool Purchases</h2>
                <p class="section-description">
                    Use your main pool points to purchase flaws, traits, simple boons, unique abilities, and action upgrades. 
                </p>
                
                ${this.renderPointPoolDisplay(character)}
                ${this.renderSectionTabs()}
                ${this.renderActiveSection(character)}
                
                <div class="next-step">
                    <p><strong>Next Step:</strong> Create your special attacks using limits and upgrades.</p>
                    <button id="continue-to-special-attacks" class="btn-primary">Continue to Special Attacks →</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderPointPoolDisplay(character) {
        // ✅ FIXED: Use PointPoolCalculator instead of removed TraitFlawSystem methods
        const pools = PointPoolCalculator.calculateAllPools(character);
        const remaining = pools.remaining.mainPool;
        
        const breakdown = this.calculatePointBreakdown(character, pools);

        return `
            <div class="point-pool-display">
                <div class="pool-summary ${remaining < 0 ? 'over-budget' : remaining === 0 ? 'fully-used' : ''}">
                    <h3>Main Pool</h3>
                    <div class="pool-main">
                        <span>Available: ${pools.totalAvailable.mainPool}</span>
                        <span>Spent: ${pools.totalSpent.mainPool}</span>
                        <span class="remaining">Remaining: ${remaining}</span>
                    </div>
                </div>
                
                <div class="pool-breakdown">
                    <h4>Point Sources</h4>
                    <div class="breakdown-grid">
                        <div class="breakdown-item">
                            <span>Base (Tier-2)×15:</span>
                            <span>${Math.max(0, (character.tier - 2) * 15)}</span>
                        </div>
                        ${character.archetypes.uniqueAbility === 'extraordinary' ? `
                            <div class="breakdown-item">
                                <span>Extraordinary Bonus:</span>
                                <span>+${Math.max(0, (character.tier - 2) * 15)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="pool-spending">
                    <h4>Point Usage</h4>
                    <div class="spending-grid">
                        ${breakdown.simpleBoons > 0 ? `
                            <div class="spending-item">
                                <span>Simple Boons:</span>
                                <span>-${breakdown.simpleBoons}</span>
                            </div>
                        ` : ''}
                        ${breakdown.uniqueAbilities > 0 ? `
                            <div class="spending-item">
                                <span>Unique Abilities:</span>
                                <span>-${breakdown.uniqueAbilities}</span>
                            </div>
                        ` : ''}
                        ${breakdown.traits > 0 ? `
                            <div class="spending-item">
                                <span>Traits:</span>
                                <span>-${breakdown.traits}</span>
                            </div>
                        ` : ''}
                        ${breakdown.flaws > 0 ? `
                            <div class="spending-item flaw-cost">
                                <span>Flaws:</span>
                                <span>-${breakdown.flaws}</span>
                            </div>
                        ` : ''}
                        ${breakdown.actions > 0 ? `
                            <div class="spending-item">
                                <span>Action Upgrades:</span>
                                <span>-${breakdown.actions}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    calculatePointBreakdown(character, pools) {
        const simpleBoons = character.mainPoolPurchases.boons
            .filter(b => b.type === 'simple' || !b.type)
            .reduce((sum, boon) => sum + (boon.cost || 0), 0);
            
        const uniqueAbilities = character.mainPoolPurchases.boons
            .filter(b => b.type === 'unique')
            .reduce((sum, boon) => sum + (boon.cost || 0), 0);

        return {
            simpleBoons,
            uniqueAbilities,
            traits: character.mainPoolPurchases.traits.reduce((sum, trait) => sum + (trait.cost || 0), 0),
            flaws: character.mainPoolPurchases.flaws.reduce((sum, flaw) => sum + (flaw.cost || 0), 0),
            actions: character.mainPoolPurchases.primaryActionUpgrades.length * 30
        };
    }

    renderSectionTabs() {
        return `
            <div class="section-tabs">
                <button class="section-tab ${this.activeSection === 'flaws' ? 'active' : ''}" data-section="flaws">
                    Flaws
                </button>
                <button class="section-tab ${this.activeSection === 'traits' ? 'active' : ''}" data-section="traits">
                    Traits
                </button>
                <button class="section-tab ${this.activeSection === 'simpleBoons' ? 'active' : ''}" data-section="simpleBoons">
                    Simple Boons
                </button>
                <button class="section-tab ${this.activeSection === 'uniqueAbilities' ? 'active' : ''}" data-section="uniqueAbilities">
                    Unique Abilities
                </button>
                <button class="section-tab ${this.activeSection === 'actions' ? 'active' : ''}" data-section="actions">
                    Action Upgrades
                </button>
            </div>
        `;
    }

    renderActiveSection(character) {
        const section = this.sections[this.activeSection];
        if (!section) return '';

        // ✅ FIXED: Use PointPoolCalculator instead of removed TraitFlawSystem methods
        const pools = PointPoolCalculator.calculateAllPools(character);
        const pointInfo = {
            available: pools.totalAvailable.mainPool,
            spent: pools.totalSpent.mainPool,
            remaining: pools.remaining.mainPool
        };

        return `
            <div class="section-content">
                ${section.render(character, pointInfo)}
            </div>
        `;
    }

    setupEventListeners() {
        // Section tabs
        document.querySelectorAll('.section-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.activeSection = e.target.dataset.section;
                this.render();
            });
        });

        // Setup section-specific event listeners
        const activeSection = this.sections[this.activeSection];
        if (activeSection && activeSection.setupEventListeners) {
            activeSection.setupEventListeners();
        }

        // Continue button
        const continueBtn = document.getElementById('continue-to-special-attacks');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.builder.switchTab('specialAttacks');
            });
        }
    }
}