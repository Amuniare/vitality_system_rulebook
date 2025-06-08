// rulebook/character-builder/ui/components/TraitPurchaseSection.js
import { TraitFlawSystem } from '../../../systems/TraitFlawSystem.js';
import { PointPoolCalculator } from '../../../calculators/PointPoolCalculator.js'; // Ensure this is used
import { EventManager } from '../../../shared/utils/EventManager.js';
import { RenderUtils } from '../../../shared/utils/RenderUtils.js';

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
                <div class="trait-stat-grid grid-layout grid-columns-auto-fit-250">
                    ${statOptionsData.map(stat => this.renderStatCard(stat, disabled)).join('')}
                </div>
                <div class="selection-summary">
                    Selected Stats: ${this.currentTraitData.statBonuses.map(s => this.getStatName(s)).join(', ') || 'None'}
                    (${this.currentTraitData.statBonuses.length}/2)
                </div>
            </div>
        `;
    }

    renderStatCard(stat, sectionDisabled) {
        const isSelected = this.currentTraitData.statBonuses.includes(stat.id);
        const isDisabledByLimit = this.currentTraitData.statBonuses.length >= 2 && !isSelected;
        const disabled = sectionDisabled || isDisabledByLimit;
        
        return `
            <div class="card trait-stat-card clickable ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}"
                 data-stat-id="${stat.id}">
                <div class="card-header">
                    <h4 class="card-title">${stat.name}</h4>
                    <div class="stat-toggle-controls">
                        <button type="button" 
                                class="btn btn-small stat-toggle" 
                                data-stat-id="${stat.id}"
                                data-selected="${isSelected}"
                                ${disabled ? 'disabled' : ''}>
                            ${isSelected ? 'Remove' : 'Add'}
                        </button>
                    </div>
                </div>
                <div class="card-description">${stat.description}</div>
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
                <div class="trait-condition-grid grid-layout grid-columns-auto-fit-280">
                    ${tierData.conditions.map(condition => this.renderConditionCard(condition, tierData.cost, sectionDisabled)).join('')}
                </div>
            </div>
        `;
    }

    renderConditionCard(condition, cost, sectionDisabled) {
        const isSelected = this.currentTraitData.conditions.includes(condition.id);
        const wouldExceed = !isSelected && (this.currentTraitData.tierCost + cost > 3);
        const disabled = sectionDisabled || wouldExceed;
        
        return `
            <div class="card trait-condition-card clickable ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}"
                 data-condition-id="${condition.id}"
                 data-tier-cost="${cost}">
                <div class="card-header">
                    <h4 class="card-title">${condition.name}</h4>
                    <span class="card-cost">${cost}pt</span>
                </div>
                <div class="card-description">${condition.description}</div>
                <div class="condition-toggle-controls">
                    <button type="button" 
                            class="btn btn-small condition-toggle" 
                            data-condition-id="${condition.id}"
                            data-tier-cost="${cost}"
                            data-selected="${isSelected}"
                            ${disabled ? 'disabled' : ''}>
                        ${isSelected ? 'Remove' : 'Add'}
                    </button>
                </div>
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
        // Event listeners for trait builder controls
        const container = document.querySelector('.trait-purchase-section-content');
        if (container) {
            // Handle stat toggle buttons
            container.querySelectorAll('.stat-toggle').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleStatToggle(e.target);
                });
            });
            
            // Handle condition toggle buttons
            container.querySelectorAll('.condition-toggle').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.handleConditionToggle(e.target);
                });
            });
            
            // Handle stat card clicks
            container.querySelectorAll('.trait-stat-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('button')) {
                        this.handleStatCardClick(card);
                    }
                });
            });
            
            // Handle condition card clicks
            container.querySelectorAll('.trait-condition-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (!e.target.closest('button')) {
                        this.handleConditionCardClick(card);
                    }
                });
            });
        }
    }

    handleStatToggle(button) {
        const statId = button.dataset.statId;
        const isSelected = button.dataset.selected === 'true';
        
        if (!isSelected) {
            // Adding stat
            if (this.currentTraitData.statBonuses.length < 2) {
                this.currentTraitData.statBonuses.push(statId);
                this.refreshBuilderUI();
            } else {
                this.builder.showNotification('Maximum 2 stat bonuses allowed.', 'warning');
            }
        } else {
            // Removing stat
            this.currentTraitData.statBonuses = this.currentTraitData.statBonuses.filter(s => s !== statId);
            this.refreshBuilderUI();
        }
    }

    handleConditionToggle(button) {
        const conditionId = button.dataset.conditionId;
        const tierCost = parseInt(button.dataset.tierCost);
        const isSelected = button.dataset.selected === 'true';
        
        if (!isSelected) {
            // Adding condition
            if (this.currentTraitData.tierCost + tierCost <= 3) {
                this.currentTraitData.conditions.push(conditionId);
                this.currentTraitData.tierCost += tierCost;
                this.refreshBuilderUI();
            } else {
                this.builder.showNotification('Condition tier limit (3 points) exceeded.', 'warning');
            }
        } else {
            // Removing condition
            this.currentTraitData.conditions = this.currentTraitData.conditions.filter(c => c !== conditionId);
            this.currentTraitData.tierCost -= tierCost;
            this.refreshBuilderUI();
        }
    }

    handleStatCardClick(card) {
        const statId = card.dataset.statId;
        const isSelected = this.currentTraitData.statBonuses.includes(statId);
        
        if (!isSelected && this.currentTraitData.statBonuses.length < 2) {
            this.currentTraitData.statBonuses.push(statId);
            this.refreshBuilderUI();
        } else if (isSelected) {
            this.currentTraitData.statBonuses = this.currentTraitData.statBonuses.filter(s => s !== statId);
            this.refreshBuilderUI();
        } else {
            this.builder.showNotification('Maximum 2 stat bonuses allowed.', 'warning');
        }
    }

    handleConditionCardClick(card) {
        const conditionId = card.dataset.conditionId;
        const tierCost = parseInt(card.dataset.tierCost);
        const isSelected = this.currentTraitData.conditions.includes(conditionId);
        
        if (!isSelected) {
            if (this.currentTraitData.tierCost + tierCost <= 3) {
                this.currentTraitData.conditions.push(conditionId);
                this.currentTraitData.tierCost += tierCost;
                this.refreshBuilderUI();
            } else {
                this.builder.showNotification('Condition tier limit (3 points) exceeded.', 'warning');
            }
        } else {
            this.currentTraitData.conditions = this.currentTraitData.conditions.filter(c => c !== conditionId);
            this.currentTraitData.tierCost -= tierCost;
            this.refreshBuilderUI();
        }
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
        console.log('🔍 Trait purchase attempted with data:', this.currentTraitData);
        
        try {
            const character = this.builder.currentCharacter;
            const pools = PointPoolCalculator.calculateAllPools(character);
            console.log('🔍 Current point pools:', pools);
            
            const updatedCharacter = TraitFlawSystem.purchaseTrait(character, this.currentTraitData);
            this.currentTraitData = this.resetCurrentTraitData(); // Clear builder after purchase
            this.builder.updateCharacter(); // This will trigger re-render of MainPoolTab
            this.builder.showNotification('Trait purchased!', 'success');
        } catch (error) {
            console.log('❌ Trait purchase failed:', error.message);
            this.builder.showNotification(`Failed to purchase trait: ${error.message}`, 'error');
            // Do NOT clear the trait data or update character on error
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
