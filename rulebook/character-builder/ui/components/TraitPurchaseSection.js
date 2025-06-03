// TraitPurchaseSection.js - Trait purchase with tier condition system
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';

export class TraitPurchaseSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.currentTraitData = {
            conditions: [],
            statBonuses: [],
            tierCost: 0
        };
    }

    render() {
        const character = this.builder.currentCharacter;
        if (!character) return '';

        const conditionTiers = TraitFlawSystem.getTraitConditionTiers();
        const statOptions = TraitFlawSystem.getTraitStatOptions();
        const pools = PointPoolCalculator.calculateAllPools(character);
        const mainPoolAvailable = pools.totalAvailable.mainPool;
        const mainPoolSpent = pools.totalSpent.mainPool;
        const remainingPoints = mainPoolAvailable - mainPoolSpent;

        return `
            <div class="trait-purchase-section">
                <div class="section-header">
                    <h4>Traits</h4>
                    <div class="points-remaining">
                        Remaining Points: <span class="${remainingPoints < 0 ? 'over-budget' : ''}">${remainingPoints}</span>
                    </div>
                </div>
                
                <div class="section-description">
                    Traits cost 30 points and provide +Tier bonus to TWO stats when conditions are met.
                    Choose conditions totaling up to 3 tiers. Same stacking penalties apply.
                </div>
                
                <div class="purchased-traits">
                    <h5>Purchased Traits (${character.mainPoolPurchases.traits.length})</h5>
                    ${this.renderPurchasedTraits(character)}
                </div>
                
                <div class="trait-builder">
                    <h5>Create New Trait</h5>
                    ${this.renderTraitBuilder(conditionTiers, statOptions, remainingPoints)}
                </div>
            </div>
        `;
    }

    renderPurchasedTraits(character) {
        if (character.mainPoolPurchases.traits.length === 0) {
            return '<div class="empty-state">No traits purchased yet</div>';
        }

        return `
            <div class="purchased-list">
                ${character.mainPoolPurchases.traits.map((trait, index) => `
                    <div class="purchased-trait-card">
                        <div class="trait-info">
                            <div class="trait-stats">
                                <strong>Bonuses:</strong> +${character.tier} ${trait.statBonuses.join(`, +${character.tier} `)}
                            </div>
                            <div class="trait-conditions">
                                <strong>When:</strong> ${this.getConditionNames(trait.conditions).join(' AND ')}
                            </div>
                            <span class="trait-cost">-30p</span>
                        </div>
                        <button class="btn-small btn-danger" data-action="remove-trait" data-index="${index}">Remove</button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderTraitBuilder(conditionTiers, statOptions, remainingPoints) {
        const canAfford = remainingPoints >= 30;
        const tierCostRemaining = 3 - this.currentTraitData.tierCost;
        const canPurchase = canAfford && 
                           this.currentTraitData.statBonuses.length === 2 && 
                           this.currentTraitData.conditions.length > 0 &&
                           this.currentTraitData.tierCost <= 3;

        return `
            <div class="trait-builder-content ${!canAfford ? 'disabled' : ''}">
                <div class="builder-step">
                    <h6>Step 1: Choose Stat Bonuses (2 required)</h6>
                    <div class="stat-selection">
                        ${statOptions.map(stat => `
                            <div class="stat-option">
                                <label>
                                    <input type="checkbox" 
                                           class="stat-checkbox" 
                                           data-stat-id="${stat.id}"
                                           ${this.currentTraitData.statBonuses.includes(stat.id) ? 'checked' : ''}
                                           ${this.currentTraitData.statBonuses.length >= 2 && !this.currentTraitData.statBonuses.includes(stat.id) ? 'disabled' : ''}>
                                    ${stat.name}
                                </label>
                                <small>${stat.description}</small>
                            </div>
                        `).join('')}
                    </div>
                    <div class="selection-summary">
                        Selected: ${this.currentTraitData.statBonuses.join(', ') || 'None'} 
                        (${this.currentTraitData.statBonuses.length}/2)
                    </div>
                </div>
                
                <div class="builder-step">
                    <h6>Step 2: Choose Conditions (max 3 tier points)</h6>
                    <div class="tier-budget">
                        Tier points used: ${this.currentTraitData.tierCost}/3
                        ${tierCostRemaining > 0 ? `(${tierCostRemaining} remaining)` : ''}
                    </div>
                    
                    ${Object.entries(conditionTiers).map(([tierKey, tier]) => `
                        <div class="condition-tier">
                            <h7>${tier.name} (${tier.cost} point${tier.cost > 1 ? 's' : ''} each)</h7>
                            <div class="condition-grid">
                                ${tier.conditions.map(condition => `
                                    <div class="condition-option">
                                        <label>
                                            <input type="checkbox" 
                                                   class="condition-checkbox" 
                                                   data-condition-id="${condition.id}"
                                                   data-tier-cost="${tier.cost}"
                                                   ${this.currentTraitData.conditions.includes(condition.id) ? 'checked' : ''}
                                                   ${this.currentTraitData.tierCost + tier.cost > 3 && !this.currentTraitData.conditions.includes(condition.id) ? 'disabled' : ''}>
                                            ${condition.name}
                                        </label>
                                        <small>${condition.description}</small>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="builder-actions">
                    <button class="btn-secondary" id="clear-trait-builder">Clear All</button>
                    <button class="btn-primary" 
                            id="purchase-trait-btn" 
                            ${!canPurchase ? 'disabled' : ''}>
                        Purchase Trait (30p)
                    </button>
                </div>
                
                ${!canAfford ? '<div class="cannot-afford">Insufficient points to purchase trait</div>' : ''}
            </div>
        `;
    }

    setupEventListeners() {
        // Stat selection
        document.querySelectorAll('.stat-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const statId = e.target.dataset.statId;
                
                if (e.target.checked) {
                    if (this.currentTraitData.statBonuses.length < 2) {
                        this.currentTraitData.statBonuses.push(statId);
                    } else {
                        e.target.checked = false;
                        this.builder.showNotification('Maximum 2 stat bonuses allowed', 'warning');
                    }
                } else {
                    this.currentTraitData.statBonuses = this.currentTraitData.statBonuses.filter(s => s !== statId);
                }
                
                this.updateTraitBuilder();
            });
        });

        // Condition selection
        document.querySelectorAll('.condition-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const conditionId = e.target.dataset.conditionId;
                const tierCost = parseInt(e.target.dataset.tierCost);
                
                if (e.target.checked) {
                    if (this.currentTraitData.tierCost + tierCost <= 3) {
                        this.currentTraitData.conditions.push(conditionId);
                        this.currentTraitData.tierCost += tierCost;
                    } else {
                        e.target.checked = false;
                        this.builder.showNotification('Would exceed 3 tier point limit', 'warning');
                    }
                } else {
                    this.currentTraitData.conditions = this.currentTraitData.conditions.filter(c => c !== conditionId);
                    this.currentTraitData.tierCost -= tierCost;
                }
                
                this.updateTraitBuilder();
            });
        });

        // Clear builder
        const clearBtn = document.getElementById('clear-trait-builder');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearTraitBuilder();
            });
        }

        // Purchase trait
        const purchaseBtn = document.getElementById('purchase-trait-btn');
        if (purchaseBtn) {
            purchaseBtn.addEventListener('click', () => {
                this.purchaseTrait();
            });
        }

        // Remove trait
        document.querySelectorAll('[data-action="remove-trait"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeTrait(index);
            });
        });
    }

    updateTraitBuilder() {
        // Re-render the trait builder section
        const builderElement = document.querySelector('.trait-builder');
        if (builderElement) {
            const conditionTiers = TraitFlawSystem.getTraitConditionTiers();
            const statOptions = TraitFlawSystem.getTraitStatOptions();
            const character = this.builder.currentCharacter;
            const pools = PointPoolCalculator.calculateAllPools(character);
            const mainPoolAvailable = pools.totalAvailable.mainPool;
            const mainPoolSpent = pools.totalSpent.mainPool;
            const remainingPoints = mainPoolAvailable - mainPoolSpent;
            
            builderElement.innerHTML = `
                <h5>Create New Trait</h5>
                ${this.renderTraitBuilder(conditionTiers, statOptions, remainingPoints)}
            `;
            
            this.setupEventListeners();
        }
    }

    clearTraitBuilder() {
        this.currentTraitData = {
            conditions: [],
            statBonuses: [],
            tierCost: 0
        };
        this.updateTraitBuilder();
    }

    purchaseTrait() {
        try {
            const character = this.builder.currentCharacter;
            TraitFlawSystem.purchaseTrait(character, this.currentTraitData);
            this.clearTraitBuilder();
            this.builder.updateCharacter();
            this.builder.showNotification('Trait purchased successfully', 'success');
        } catch (error) {
            this.builder.showNotification(error.message, 'error');
        }
    }

    removeTrait(index) {
        const character = this.builder.currentCharacter;
        const trait = character.mainPoolPurchases.traits[index];
        
        if (confirm('Remove this trait? This will refund 30 points.')) {
            TraitFlawSystem.removeTrait(character, index);
            this.builder.updateCharacter();
            this.builder.showNotification('Trait removed', 'success');
        }
    }

    getConditionNames(conditionIds) {
        const conditionTiers = TraitFlawSystem.getTraitConditionTiers();
        const names = [];
        
        conditionIds.forEach(id => {
            for (const tier of Object.values(conditionTiers)) {
                const condition = tier.conditions.find(c => c.id === id);
                if (condition) {
                    names.push(condition.name);
                    break;
                }
            }
        });
        
        return names;
    }
}