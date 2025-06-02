// MainPoolTab.js - Main pool coordinator (simplified)
import { GameConstants } from '../../core/GameConstants.js';
import { FlawPurchaseSection } from '../components/FlawPurchaseSection.js';
import { TraitPurchaseSection } from '../components/TraitPurchaseSection.js';
import { BoonPurchaseSection } from '../components/BoonPurchaseSection.js';
import { ActionUpgradeSection } from '../components/ActionUpgradeSection.js';

export class MainPoolTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        
        // Initialize sections
        this.flawSection = new FlawPurchaseSection(characterBuilder);
        this.traitSection = new TraitPurchaseSection(characterBuilder);
        this.boonSection = new BoonPurchaseSection(characterBuilder);
        this.actionSection = new ActionUpgradeSection(characterBuilder);
    }

    render() {
        const tabContent = document.getElementById('tab-mainPool');
        if (!tabContent) return;

        const character = this.builder.currentCharacter;
        if (!character) {
            tabContent.innerHTML = '<div class="empty-state">No character selected</div>';
            return;
        }

        const pointInfo = this.calculatePointInfo(character);

        tabContent.innerHTML = `
            <div class="main-pool-section">
                <h2>Main Pool Purchases</h2>
                <p class="section-description">
                    Purchase traits, flaws, boons, and action upgrades using your main pool points.
                    Flaws give you extra points, traits provide conditional bonuses, and boons grant unique abilities.
                </p>
                
                ${this.renderPointPoolStatus(pointInfo)}
                
                <div id="flaw-section">
                    ${this.flawSection.render(character, pointInfo)}
                </div>
                
                <div id="trait-section">
                    ${this.traitSection.render(character, pointInfo)}
                </div>
                
                <div id="boon-section">
                    ${this.boonSection.render(character, pointInfo)}
                </div>
                
                <div id="action-section">
                    ${this.actionSection.render(character, pointInfo)}
                </div>
                
                <div class="next-step">
                    <p><strong>Next Step:</strong> Create your special attacks based on your archetype.</p>
                    <button id="continue-to-special-attacks" class="btn-primary">Continue to Special Attacks →</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    calculatePointInfo(character) {
        const tier = character.tier;
        
        // Base main pool
        let basePool = Math.max(0, (tier - GameConstants.MAIN_POOL_BASE_TIER) * GameConstants.MAIN_POOL_MULTIPLIER);
        
        // Extraordinary archetype doubles main pool
        if (character.archetypes.uniqueAbility === 'extraordinary') {
            basePool += Math.max(0, (tier - GameConstants.MAIN_POOL_BASE_TIER) * GameConstants.MAIN_POOL_MULTIPLIER);
        }
        
        // Flaw bonuses
        const flawBonus = character.mainPoolPurchases.flaws.length * GameConstants.FLAW_BONUS;
        const totalAvailable = basePool + flawBonus;
        
        // Calculate spent
        const spentOnTraits = character.mainPoolPurchases.traits.reduce((total, trait) => total + (trait.cost || GameConstants.TRAIT_COST), 0);
        const spentOnBoons = character.mainPoolPurchases.boons.reduce((total, boon) => total + (boon.cost || 0), 0);
        const spentOnUpgrades = character.mainPoolPurchases.primaryActionUpgrades.length * GameConstants.PRIMARY_TO_QUICK_COST;
        
        const totalSpent = spentOnTraits + spentOnBoons + spentOnUpgrades;
        
        return {
            basePool,
            flawBonus,
            totalAvailable,
            spent: totalSpent,
            remaining: totalAvailable - totalSpent,
            breakdown: {
                traits: spentOnTraits,
                boons: spentOnBoons,
                upgrades: spentOnUpgrades
            }
        };
    }

    renderPointPoolStatus(pointInfo) {
        const status = pointInfo.remaining < 0 ? 'over-budget' : 
                      pointInfo.remaining === 0 ? 'fully-used' : '';

        return `
            <div class="main-pool-status ${status}">
                <h3>Main Pool Points</h3>
                <div class="pool-summary">
                    <div class="pool-item">
                        <span>Base Pool: ${pointInfo.basePool}p</span>
                    </div>
                    <div class="pool-item">
                        <span>Flaw Bonus: +${pointInfo.flawBonus}p</span>
                    </div>
                    <div class="pool-item">
                        <span><strong>Total Available: ${pointInfo.totalAvailable}p</strong></span>
                    </div>
                    <div class="pool-item">
                        <span>Spent: ${pointInfo.spent}p</span>
                    </div>
                    <div class="pool-item ${pointInfo.remaining < 0 ? 'over-budget' : ''}">
                        <span><strong>Remaining: ${pointInfo.remaining}p</strong></span>
                    </div>
                </div>
                
                <div class="spending-breakdown">
                    <div class="breakdown-item">Traits: ${pointInfo.breakdown.traits}p</div>
                    <div class="breakdown-item">Boons: ${pointInfo.breakdown.boons}p</div>
                    <div class="breakdown-item">Upgrades: ${pointInfo.breakdown.upgrades}p</div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Continue button
        const continueBtn = document.getElementById('continue-to-special-attacks');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.builder.switchTab('specialAttacks');
            });
        }

        // Setup event listeners for each section
        this.flawSection.setupEventListeners();
        this.traitSection.setupEventListeners();
        this.boonSection.setupEventListeners();
        this.actionSection.setupEventListeners();
    }
}