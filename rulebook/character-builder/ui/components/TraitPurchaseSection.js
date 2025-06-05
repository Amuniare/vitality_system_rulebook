// rulebook/character-builder/ui/components/TraitPurchaseSection.js
import { TraitFlawSystem } from '../../systems/TraitFlawSystem.js';
import { PointPoolCalculator } from '../../calculators/PointPoolCalculator.js'; // Ensure this is used
import { EventManager } from '../shared/EventManager.js';
import { RenderUtils } from '../shared/RenderUtils.js';

export class TraitPurchaseSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.currentTraitData = this.resetCurrentTraitData();
    }

    resetCurrentTraitData() {
        return {
            conditions: [], // array of condition IDs
            statBonuses: [], // array of stat IDs
            tierCost: 0 // sum of selected condition tier costs
        };
    }

    render(character, pointInfo) { // pointInfo is for Main Pool
        const conditionTiersData = TraitFlawSystem.getTraitConditionTiers();
        const statOptionsData = TraitFlawSystem.getTraitStatOptions();

        return `
            <div class="trait-purchase-section-content">
                ${this.renderSectionHeader(pointInfo)}
                ${this.renderSectionDescription()}

                ${RenderUtils.renderPurchasedList(
                    character.mainPoolPurchases.traits,
                    (trait, index) => this.renderPurchasedTrait(trait, index, character),
                    { title: `Purchased Traits (${character.mainPoolPurchases.traits.length})`, emptyMessage: 'No traits purchased yet' }
                )}

                <div class="trait-builder">
                    <h5>Create New Trait</h5>
                    ${this.renderTraitBuilderContent(conditionTiersData, statOptionsData, pointInfo)}
                </div>
            </div>
        `;
    }

    renderSectionHeader(pointInfo) {
        return `
            <div class="section-header">
                <h4>Traits (Cost ${TraitFlawSystem.getTraitCost ? TraitFlawSystem.getTraitCost() : 30}p Each)</h4>
                <div class="points-remaining">
                   Main Pool: ${pointInfo.remaining}p
                   ${pointInfo.remaining < (TraitFlawSystem.getTraitCost ? TraitFlawSystem.getTraitCost() : 30) && pointInfo.remaining >=0 ? '<span class="warning">(Low)</span>' : ''}
                   ${pointInfo.remaining < 0 ? '<span class="error">(Over Budget!)</span>' : ''}
                </div>
            </div>
        `;
    }

    renderSectionDescription() {
        return `
            <p class="category-description">
                Traits cost ${TraitFlawSystem.getTraitCost ? TraitFlawSystem.getTraitCost() : 30} points and provide +Tier bonus to TWO stats when conditions are met.
                Choose conditions totaling up to 3 tier points. Same stacking penalties apply.
            </p>
        `;
    }

    renderPurchasedTrait(trait, index, character) {
        return `
            <div class="purchased-item trait-card-horizontal">
                <div class="item-info">
                    <div class="trait-stats">
                        <strong>Bonuses:</strong> +${character.tier} ${trait.statBonuses.map(s => this.getStatName(s)).join(`, +${character.tier} `)}
                    </div>
                    <div class="trait-conditions">
                        <strong>When:</strong> ${this.getConditionNames(trait.conditions).join(' AND ')}
                    </div>
                    <span class="item-cost trait-item-cost">-${trait.cost}p</span>
                </div>
                ${RenderUtils.renderButton({
                    text: 'Remove',
                    variant: 'danger',
                    size: 'small',
                    dataAttributes: { action: 'remove-trait', index: index }
                })}
            </div>
        `;
    }
    getStatName(statId) {
        const opt = TraitFlawSystem.getTraitStatOptions().find(s => s.id === statId);
        return opt ? opt.name : statId;
    }


    renderTraitBuilderContent(conditionTiersData, statOptionsData, pointInfo) {
        const traitCost = TraitFlawSystem.getTraitCost ? TraitFlawSystem.getTraitCost() : 30;
        const canAffordTrait = pointInfo.remaining >= traitCost;
        const builderDisabled = !canAffordTrait;

        const canPurchase = canAffordTrait &&
                           this.currentTraitData.statBonuses.length === 2 &&
                           this.currentTraitData.conditions.length > 0 &&
                           this.currentTraitData.tierCost > 0 && this.currentTraitData.tierCost <= 3;

        return `
            <div class="trait-builder-content ${builderDisabled ? 'disabled-section' : ''}">
                ${this.renderStatSelectionStep(statOptionsData, builderDisabled)}
                ${this.renderConditionSelectionStep(conditionTiersData, builderDisabled)}
                ${this.renderBuilderActions(canPurchase, canAffordTrait, traitCost)}
                ${!canAffordTrait ? RenderUtils.renderStatusIndicator('error', `Insufficient points to purchase trait (need ${traitCost}p).`, {absolutePosition:false}) : ''}
            </div>
        `;
    }

    renderStatSelectionStep(statOptionsData, disabled) {
        return `
            <div class="builder-step">
                <h6>Step 1: Choose Stat Bonuses (Exactly 2 required)</h6>
                ${RenderUtils.renderGrid(
                    statOptionsData,
                    (stat) => this.renderStatOption(stat, disabled),
                    { gridContainerClass: 'grid-layout stat-selection', gridSpecificClass: 'grid-columns-auto-fit-200' }
                )}
                <div class="selection-summary">
                    Selected Stats: ${this.currentTraitData.statBonuses.map(s => this.getStatName(s)).join(', ') || 'None'}
                    (${this.currentTraitData.statBonuses.length}/2)
                </div>
            </div>
        `;
    }

    renderStatOption(stat, sectionDisabled) {
        const isSelected = this.currentTraitData.statBonuses.includes(stat.id);
        const isDisabledByLimit = this.currentTraitData.statBonuses.length >= 2 && !isSelected;
        return `
            <div class="stat-option form-group">
                <label>
                    <input type="checkbox"
                           class="stat-checkbox"
                           data-stat-id="${stat.id}"
                           ${isSelected ? 'checked' : ''}
                           ${sectionDisabled || isDisabledByLimit ? 'disabled' : ''}>
                    ${stat.name}
                </label>
                <small>${stat.description}</small>
            </div>
        `;
    }

    renderConditionSelectionStep(conditionTiersData, disabled) {
        const tierCostRemaining = 3 - this.currentTraitData.tierCost;
        return `
            <div class="builder-step">
                <h6>Step 2: Choose Conditions (Max 3 tier points total)</h6>
                <div class="tier-budget">
                    Tier Points Used: ${this.currentTraitData.tierCost}/3
                    (${tierCostRemaining < 0 ? '<span class="error">Over Limit!</span>' : `${tierCostRemaining} remaining`})
                </div>
                ${Object.entries(conditionTiersData).map(([tierKey, tierData]) =>
                    this.renderConditionTier(tierData, disabled)
                ).join('')}
                 <div class="selection-summary">
                    Selected Conditions: ${this.getConditionNames(this.currentTraitData.conditions).join(', ') || 'None'}
                </div>
            </div>
        `;
    }

    renderConditionTier(tierData, sectionDisabled) {
        return `
            <div class="condition-tier">
                <h7>${tierData.name} (${tierData.cost} point${tierData.cost !== 1 ? 's' : ''} each)</h7>
                ${RenderUtils.renderGrid(
                    tierData.conditions,
                    (condition) => this.renderConditionOption(condition, tierData.cost, sectionDisabled),
                    { gridContainerClass: 'grid-layout condition-grid', gridSpecificClass: 'grid-columns-auto-fit-250' }
                )}
            </div>
        `;
    }

    renderConditionOption(condition, cost, sectionDisabled) {
        const isSelected = this.currentTraitData.conditions.includes(condition.id);
        const wouldExceed = !isSelected && (this.currentTraitData.tierCost + cost > 3);
        return `
            <div class="condition-option form-group">
                <label>
                    <input type="checkbox"
                           class="condition-checkbox"
                           data-condition-id="${condition.id}"
                           data-tier-cost="${cost}"
                           ${isSelected ? 'checked' : ''}
                           ${sectionDisabled || wouldExceed ? 'disabled' : ''}>
                    ${condition.name}
                </label>
                <small>${condition.description}</small>
            </div>
        `;
    }

    renderBuilderActions(canPurchase, canAffordTrait, traitCost) {
        return `
            <div class="builder-actions">
                ${RenderUtils.renderButton({
                    text: 'Clear Selections',
                    variant: 'secondary',
                    dataAttributes: { action: 'clear-trait-builder' }
                })}
                ${RenderUtils.renderButton({
                    text: `Purchase Trait (-${traitCost}p)`,
                    variant: 'primary',
                    disabled: !canPurchase,
                    dataAttributes: { action: 'purchase-trait' }
                })}
            </div>
        `;
    }

    setupEventListeners() {
        // Delegated to MainPoolTab
        // Internal listeners for builder UI state updates:
        const container = document.querySelector('.trait-purchase-section-content');
        if (container) {
            // Stat checkboxes
            container.addEventListener('change', (e) => {
                if (e.target.matches('.stat-checkbox')) {
                    this.handleStatSelection(e.target);
                } else if (e.target.matches('.condition-checkbox')) {
                    this.handleConditionSelection(e.target);
                }
            });
        }
    }

    handleStatSelection(checkboxElement) {
        const statId = checkboxElement.dataset.statId;
        if (checkboxElement.checked) {
            if (this.currentTraitData.statBonuses.length < 2) {
                this.currentTraitData.statBonuses.push(statId);
            } else {
                checkboxElement.checked = false; // Revert if limit exceeded
                this.builder.showNotification('Maximum 2 stat bonuses allowed.', 'warning');
            }
        } else {
            this.currentTraitData.statBonuses = this.currentTraitData.statBonuses.filter(s => s !== statId);
        }
        this.refreshBuilderUI();
    }

    handleConditionSelection(checkboxElement) {
        const conditionId = checkboxElement.dataset.conditionId;
        const tierCost = parseInt(checkboxElement.dataset.tierCost);
        if (checkboxElement.checked) {
            if (this.currentTraitData.tierCost + tierCost <= 3) {
                this.currentTraitData.conditions.push(conditionId);
                this.currentTraitData.tierCost += tierCost;
            } else {
                checkboxElement.checked = false; // Revert
                this.builder.showNotification('Condition tier limit (3 points) exceeded.', 'warning');
            }
        } else {
            this.currentTraitData.conditions = this.currentTraitData.conditions.filter(c => c !== conditionId);
            this.currentTraitData.tierCost -= tierCost;
        }
        this.refreshBuilderUI();
    }
    
    refreshBuilderUI() {
        // Re-render only the trait builder part
        const builderContainer = document.querySelector('.trait-builder');
        if (builderContainer && this.builder.currentCharacter) {
            const pointInfo = PointPoolCalculator.calculateAllPools(this.builder.currentCharacter).remaining;
            const mainPoolRemaining = pointInfo.mainPool || 0;
            const conditionTiersData = TraitFlawSystem.getTraitConditionTiers();
            const statOptionsData = TraitFlawSystem.getTraitStatOptions();
            
            builderContainer.innerHTML = `
                <h5>Create New Trait</h5>
                ${this.renderTraitBuilderContent(conditionTiersData, statOptionsData, {remaining: mainPoolRemaining})}
            `;
            // Note: Event listeners for checkboxes within builder will be re-bound by MainPoolTab if it re-renders the whole section,
            // or need to be re-attached here if this component manages its own complete re-render.
            // The current setup assumes MainPoolTab handles delegation or re-renders this whole section.
            // For isolated refreshBuilderUI, we'd need to re-call this.setupEventListeners() on the builderContainer.
             this.setupEventListeners(); // Re-attach to the new DOM for checkboxes
        }
    }


    handleClearBuilder() {
        this.currentTraitData = this.resetCurrentTraitData();
        this.refreshBuilderUI();
    }

    handleTraitPurchase() {
        try {
            const character = this.builder.currentCharacter;
            TraitFlawSystem.purchaseTrait(character, this.currentTraitData);
            this.currentTraitData = this.resetCurrentTraitData(); // Clear builder after purchase
            this.builder.updateCharacter(); // This will trigger re-render of MainPoolTab
            this.builder.showNotification('Trait purchased!', 'success');
        } catch (error) {
            this.builder.showNotification(`Failed to purchase trait: ${error.message}`, 'error');
        }
    }

    handleTraitRemoval(index) {
        const character = this.builder.currentCharacter;
        const trait = character.mainPoolPurchases.traits[index];
        if (confirm(`Remove trait "${this.getTraitSummary(trait, character)}"? This refunds ${trait.cost}p.`)) {
            try {
                TraitFlawSystem.removeTrait(character, index);
                this.builder.updateCharacter();
                this.builder.showNotification('Trait removed.', 'success');
            } catch (error) {
                this.builder.showNotification(`Failed to remove trait: ${error.message}`, 'error');
            }
        }
    }
    
    getTraitSummary(trait, character) {
        return `+${character.tier} ${trait.statBonuses.map(s => this.getStatName(s)).join('/')} when ${this.getConditionNames(trait.conditions, 1)}...`;
    }

    getConditionNames(conditionIds, limit = Infinity) {
        const conditionTiersData = TraitFlawSystem.getTraitConditionTiers();
        const names = [];
        for (const id of conditionIds) {
            if (names.length >= limit) break;
            for (const tier of Object.values(conditionTiersData)) {
                const cond = tier.conditions.find(c => c.id === id);
                if (cond) {
                    names.push(cond.name);
                    break;
                }
            }
        }
        return names;
    }
}
