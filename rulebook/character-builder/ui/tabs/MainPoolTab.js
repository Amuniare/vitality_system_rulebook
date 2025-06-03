// MainPoolTab.js - Main pool purchases with corrected imports and economics
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';
import { UniqueAbilitySystem } from '../../systems/UniqueAbilitySystem.js';
import { ActionSystem } from '../../systems/ActionSystem.js';
import { FlawPurchaseSection } from '../components/FlawPurchaseSection.js';
import { TraitPurchaseSection } from '../components/TraitPurchaseSection.js';
import { BoonPurchaseSection } from '../components/BoonPurchaseSection.js';
import { ActionUpgradeSection } from '../components/ActionUpgradeSection.js';

export class MainPoolTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.sections = {
            flaws: new FlawPurchaseSection(characterBuilder),
            traits: new TraitPurchaseSection(characterBuilder),
            boons: new BoonPurchaseSection(characterBuilder),
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
                    Use your main pool points to purchase flaws (which now COST points but provide bonuses), 
                    traits, boons, and action upgrades. Note: Flaws have reversed economics - they cost points but provide benefits.
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
        const mainPoolAvailable = TraitFlawSystem.calculateMainPoolAvailable(character);
        const mainPoolSpent = TraitFlawSystem.calculateMainPoolSpent(character);
        const remaining = mainPoolAvailable - mainPoolSpent;
        
        const breakdown = this.calculatePointBreakdown(character);

        return `
            <div class="point-pool-display">
                <div class="pool-summary ${remaining < 0 ? 'over-budget' : remaining === 0 ? 'fully-used' : ''}">
                    <h3>Main Pool</h3>
                    <div class="pool-main">
                        <span>Available: ${mainPoolAvailable}</span>
                        <span>Spent: ${mainPoolSpent}</span>
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
                        ${breakdown.boons > 0 ? `
                            <div class="spending-item">
                                <span>Boons:</span>
                                <span>-${breakdown.boons}</span>
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
                                <span>Flaws (NEW: Cost Points):</span>
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

    calculatePointBreakdown(character) {
        return {
            boons: character.mainPoolPurchases.boons.reduce((sum, boon) => sum + (boon.cost || 0), 0),
            traits: character.mainPoolPurchases.traits.reduce((sum, trait) => sum + (trait.cost || 0), 0),
            flaws: character.mainPoolPurchases.flaws.reduce((sum, flaw) => sum + (flaw.cost || 0), 0), // Now costs points
            actions: character.mainPoolPurchases.primaryActionUpgrades.length * 30
        };
    }

    renderSectionTabs() {
        return `
            <div class="section-tabs">
                <button class="section-tab ${this.activeSection === 'flaws' ? 'active' : ''}" data-section="flaws">
                    Flaws (COST Points)
                </button>
                <button class="section-tab ${this.activeSection === 'traits' ? 'active' : ''}" data-section="traits">
                    Traits
                </button>
                <button class="section-tab ${this.activeSection === 'boons' ? 'active' : ''}" data-section="boons">
                    Boons
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

        const pointInfo = {
            available: TraitFlawSystem.calculateMainPoolAvailable(character),
            spent: TraitFlawSystem.calculateMainPoolSpent(character),
            remaining: TraitFlawSystem.calculateMainPoolAvailable(character) - TraitFlawSystem.calculateMainPoolSpent(character)
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