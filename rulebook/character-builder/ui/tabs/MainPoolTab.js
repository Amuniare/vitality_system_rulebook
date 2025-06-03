// MainPoolTab.js - REFACTORED to use UpdateManager for coordination
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
                <div class="section-content" id="main-pool-section-content">
                    ${this.renderActiveSection(character)}
                </div>
                
                ${this.renderNextStep()}
            </div>
        `;

        this.setupEventListeners();
    }

    renderPointPoolDisplay(character) {
        const pools = PointPoolCalculator.calculateAllPools(character);
        const remaining = pools.remaining.mainPool;
        const breakdown = this.calculatePointBreakdown(character, pools);

        return `
            <div class="point-pool-display">
                ${RenderUtils.renderPointDisplay(
                    pools.totalSpent.mainPool,
                    pools.totalAvailable.mainPool,
                    'Main Pool',
                    { showRemaining: true, showPercentage: false }
                )}
                
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

                ${this.renderPointSpending(breakdown)}
            </div>
        `;
    }

    renderPointSpending(breakdown) {
        if (Object.values(breakdown).every(val => val === 0)) {
            return '<div class="empty-spending">No points spent yet</div>';
        }

        return `
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
        const tabs = [
            { id: 'flaws', name: 'Flaws' },
            { id: 'traits', name: 'Traits' },
            { id: 'simpleBoons', name: 'Simple Boons' },
            { id: 'uniqueAbilities', name: 'Unique Abilities' },
            { id: 'actions', name: 'Action Upgrades' }
        ];

        return `
            <div class="section-tabs">
                ${tabs.map(tab => `
                    <button class="section-tab ${this.activeSection === tab.id ? 'active' : ''}" 
                            data-section="${tab.id}">
                        ${tab.name}
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderActiveSection(character) {
        const section = this.sections[this.activeSection];
        if (!section) return '<div class="error">Section not found</div>';

        const pools = PointPoolCalculator.calculateAllPools(character);
        const pointInfo = {
            available: pools.totalAvailable.mainPool,
            spent: pools.totalSpent.mainPool,
            remaining: pools.remaining.mainPool
        };

        return section.render(character, pointInfo);
    }

    renderNextStep() {
        return `
            <div class="next-step">
                <p><strong>Next Step:</strong> Create your special attacks using limits and upgrades.</p>
                ${RenderUtils.renderButton({
                    text: 'Continue to Special Attacks →',
                    variant: 'primary',
                    dataAttributes: { action: 'continue-to-special-attacks' }
                })}
            </div>
        `;
    }

    setupEventListeners() {
        const container = document.querySelector('.main-pool-section');
        if (!container) {
            console.error('Main pool section container not found');
            return;
        }

        EventManager.setupStandardListeners(container, {
            clickHandlers: {
                '.section-tab': this.handleSectionChange.bind(this),
                '[data-action="continue-to-special-attacks"]': this.handleContinue.bind(this)
            }
        });

        // Setup active section listeners
        this.setupActiveSectionListeners();
    }

    setupActiveSectionListeners() {
        const activeSection = this.sections[this.activeSection];
        if (activeSection && activeSection.setupEventListeners) {
            try {
                activeSection.setupEventListeners();
            } catch (error) {
                console.error(`Failed to setup listeners for ${this.activeSection} section:`, error);
            }
        }
    }

    handleSectionChange(e, element) {
        const newSection = element.dataset.section;
        if (newSection === this.activeSection) return;

        this.activeSection = newSection;
        
        // Use UpdateManager for efficient section switching
        UpdateManager.batchUpdates([
            { component: this, method: 'updateSectionTabs' },
            { component: this, method: 'updateActiveSection' }
        ]);
    }

    handleContinue() {
        this.builder.switchTab('specialAttacks');
    }

    // Optimized update methods for UpdateManager
    updateSectionTabs() {
        const tabs = document.querySelectorAll('.section-tab');
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.section === this.activeSection);
        });
    }

    updateActiveSection() {
        const character = this.builder.currentCharacter;
        const contentContainer = document.getElementById('main-pool-section-content');
        
        if (contentContainer && character) {
            contentContainer.innerHTML = this.renderActiveSection(character);
            this.setupActiveSectionListeners();
        }
    }

    updatePointPoolDisplay() {
        const character = this.builder.currentCharacter;
        const poolDisplay = document.querySelector('.point-pool-display');
        
        if (poolDisplay && character) {
            poolDisplay.innerHTML = this.renderPointPoolDisplay(character);
        }
    }

    // Public method for external updates
    onCharacterUpdate() {
        UpdateManager.scheduleUpdate(this, 'updatePointPoolDisplay', 'high');
        UpdateManager.scheduleUpdate(this, 'updateActiveSection', 'normal');
    }
}