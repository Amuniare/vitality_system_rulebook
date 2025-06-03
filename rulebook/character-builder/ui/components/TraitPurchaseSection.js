// TraitPurchaseSection.js - REFACTORED to use EventManager and RenderUtils
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js';
import { EventManager } from '../shared/EventManager.js';
import { RenderUtils } from '../shared/RenderUtils.js';

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
        const remainingPoints = pools.remaining.mainPool;

        return `
            <div class="trait-purchase-section">
                ${this.renderSectionHeader(remainingPoints)}
                ${this.renderSectionDescription()}
                ${RenderUtils.renderPurchasedList(
                    character.mainPoolPurchases.traits,
                    (trait, index) => this.renderPurchasedTrait(trait, index, character),
                    { title: 'Purchased Traits', emptyMessage: 'No traits purchased yet' }
                )}
                ${this.renderTraitBuilder(conditionTiers, statOptions, remainingPoints)}
            </div>
        `;
    }

    renderSectionHeader(remainingPoints) {
        return `
            <div class="section-header">
                <h4>Traits</h4>
                ${RenderUtils.renderPointDisplay(
                    30, remainingPoints, 'Points Needed',
                    { showRemaining: true }
                )}
            </div>
        `;
    }

    renderSectionDescription() {
        return `
            <div class="section-description">
                Traits cost 30 points and provide +Tier bonus to TWO stats when conditions are met.
                Choose conditions totaling up to 3 tiers. Same stacking penalties apply.
            </div>
        `;
    }

    renderPurchasedTrait(trait, index, character) {
        return `
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
                ${RenderUtils.renderButton({
                    text: 'Remove',
                    variant: 'danger',
                    classes: ['btn-small'],
                    dataAttributes: { action: 'remove-trait', index: index }
                })}
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
            <div class="trait-builder">
                <h5>Create New Trait</h5>
                <div class="trait-builder-content ${!canAfford ? 'disabled' : ''}">
                    ${this.renderStatSelection(statOptions)}
                    ${this.renderConditionSelection(conditionTiers, tierCostRemaining)}
                    ${this.renderBuilderActions(canPurchase, canAfford)}
                </div>
            </div>
        `;
    }

    renderStatSelection(statOptions) {
        return `
            <div class="builder-step">
                <h6>Step 1: Choose Stat Bonuses (2 required)</h6>
                <div class="stat-selection">
                    ${RenderUtils.renderGrid(
                        statOptions,
                        (stat) => this.renderStatOption(stat),
                        { gridClass: 'stat-grid', columns: 'auto-fit', minWidth: '200px' }
                    )}
                </div>
                <div class="selection-summary">
                    Selected: ${this.currentTraitData.statBonuses.join(', ') || 'None'} 
                    (${this.currentTraitData.statBonuses.length}/2)
                </div>
            </div>
        `;
    }

    renderStatOption(stat) {
        const isSelected = this.currentTraitData.statBonuses.includes(stat.id);
        const isDisabled = this.currentTraitData.statBonuses.length >= 2 && !isSelected;

        return `
            <div class="stat-option">
                <label>
                    <input type="checkbox" 
                           class="stat-checkbox" 
                           data-stat-id="${stat.id}"
                           ${isSelected ? 'checked' : ''}
                           ${isDisabled ? 'disabled' : ''}>
                    ${stat.name}
                </label>
                <small>${stat.description}</small>
            </div>
        `;
    }

    renderConditionSelection(conditionTiers, tierCostRemaining) {
        return `
            <div class="builder-step">
                <h6>Step 2: Choose Conditions (max 3 tier points)</h6>
                <div class="tier-budget">
                    Tier points used: ${this.currentTraitData.tierCost}/3
                    ${tierCostRemaining > 0 ? `(${tierCostRemaining} remaining)` : ''}
                </div>
                ${Object.entries(conditionTiers).map(([tierKey, tier]) => this.renderConditionTier(tier)).join('')}
            </div>
        `;
    }

    renderConditionTier(tier) {
        return `
            <div class="condition-tier">
                <h7>${tier.name} (${tier.cost} point${tier.cost > 1 ? 's' : ''} each)</h7>
                ${RenderUtils.renderGrid(
                    tier.conditions,
                    (condition) => this.renderConditionOption(condition, tier.cost),
                    { gridClass: 'condition-grid', columns: 'auto-fit', minWidth: '250px' }
                )}
            </div>
        `;
    }

    renderConditionOption(condition, tierCost) {
        const isSelected = this.currentTraitData.conditions.includes(condition.id);
        const wouldExceedLimit = this.currentTraitData.tierCost + tierCost > 3 && !isSelected;

        return `
            <div class="condition-option">
                <label>
                    <input type="checkbox" 
                           class="condition-checkbox" 
                           data-condition-id="${condition.id}"
                           data-tier-cost="${tierCost}"
                           ${isSelected ? 'checked' : ''}
                           ${wouldExceedLimit ? 'disabled' : ''}>
                    ${condition.name}
                </label>
                <small>${condition.description}</small>
            </div>
        `;
    }

    renderBuilderActions(canPurchase, canAfford) {
        return `
            <div class="builder-actions">
                ${RenderUtils.renderButton({
                    text: 'Clear All',
                    variant: 'secondary',
                    dataAttributes: { action: 'clear-trait-builder' }
                })}
                ${RenderUtils.renderButton({
                    text: 'Purchase Trait (30p)',
                    variant: 'primary',
                    disabled: !canPurchase,
                    dataAttributes: { action: 'purchase-trait' }
                })}
            </div>
            ${!canAfford ? '<div class="cannot-afford">Insufficient points to purchase trait</div>' : ''}
        `;
    }

    setupEventListeners() {
        const container = document.querySelector('.trait-purchase-section');
        if (!container) {
            console.error('Trait purchase section container not found');
            return;
        }

        EventManager.setupStandardListeners(container, {
            changeHandlers: {
                '.stat-checkbox': this.handleStatSelection.bind(this),
                '.condition-checkbox': this.handleConditionSelection.bind(this)
            },
            clickHandlers: {
                '[data-action="clear-trait-builder"]': this.handleClearBuilder.bind(this),
                '[data-action="purchase-trait"]': this.handleTraitPurchase.bind(this),
                '[data-action="remove-trait"]': this.handleTraitRemoval.bind(this)
            }
        });
    }

    handleStatSelection(e, element) {
        const statId = element.dataset.statId;
        
        if (element.checked) {
            if (this.currentTraitData.statBonuses.length < 2) {
                this.currentTraitData.statBonuses.push(statId);
            } else {
                element.checked = false;
                this.builder.showNotification('Maximum 2 stat bonuses allowed', 'warning');
            }
        } else {
            this.currentTraitData.statBonuses = this.currentTraitData.statBonuses.filter(s => s !== statId);
        }
        
        this.updateTraitBuilder();
    }

    handleConditionSelection(e, element) {
        const conditionId = element.dataset.conditionId;
        const tierCost = parseInt(element.dataset.tierCost);
        
        if (element.checked) {
            if (this.currentTraitData.tierCost + tierCost <= 3) {
                this.currentTraitData.conditions.push(conditionId);
                this.currentTraitData.tierCost += tierCost;
            } else {
                element.checked = false;
                this.builder.showNotification('Would exceed 3 tier point limit', 'warning');
            }
        } else {
            this.currentTraitData.conditions = this.currentTraitData.conditions.filter(c => c !== conditionId);
            this.currentTraitData.tierCost -= tierCost;
        }
        
        this.updateTraitBuilder();
    }

    handleClearBuilder() {
        this.currentTraitData = {
            conditions: [],
            statBonuses: [],
            tierCost: 0
        };
        this.updateTraitBuilder();
    }

    handleTraitPurchase() {
        try {
            const character = this.builder.currentCharacter;
            TraitFlawSystem.purchaseTrait(character, this.currentTraitData);
            this.handleClearBuilder();
            this.builder.updateCharacter();
            this.builder.showNotification('Trait purchased successfully', 'success');
        } catch (error) {
            console.error('Failed to purchase trait:', error);
            this.builder.showNotification(error.message, 'error');
        }
    }

    handleTraitRemoval(e, element) {
        const index = parseInt(element.dataset.index);
        
        if (confirm('Remove this trait? This will refund 30 points.')) {
            try {
                TraitFlawSystem.removeTrait(this.builder.currentCharacter, index);
                this.builder.updateCharacter();
                this.builder.showNotification('Trait removed', 'success');
            } catch (error) {
                console.error('Failed to remove trait:', error);
                this.builder.showNotification('Failed to remove trait', 'error');
            }
        }
    }

    updateTraitBuilder() {
        // Force re-render of the trait builder section
        const builderElement = document.querySelector('.trait-builder');
        if (builderElement) {
            const character = this.builder.currentCharacter;
            const conditionTiers = TraitFlawSystem.getTraitConditionTiers();
            const statOptions = TraitFlawSystem.getTraitStatOptions();
            const pools = PointPoolCalculator.calculateAllPools(character);
            const remainingPoints = pools.remaining.mainPool;
            
            builderElement.innerHTML = `
                <h5>Create New Trait</h5>
                ${this.renderTraitBuilder(conditionTiers, statOptions, remainingPoints)}
            `;
            
            this.setupEventListeners();
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