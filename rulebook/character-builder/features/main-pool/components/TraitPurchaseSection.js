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
                 data-action="trait-stat-toggle"
                 data-stat-id="${stat.id}"
                 data-selected="${isSelected}">
                <div class="card-header">
                    <h4 class="card-title">${stat.name}</h4>
                    <div class="selection-indicator">
                        ${isSelected ? '✓ Selected' : 'Click to Select'}
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
                 data-action="trait-condition-toggle"
                 data-condition-id="${condition.id}"
                 data-tier-cost="${cost}"
                 data-selected="${isSelected}">
                <div class="card-header">
                    <h4 class="card-title">${condition.name}</h4>
                    <span class="card-cost">${cost}pt</span>
                </div>
                <div class="card-description">${condition.description}</div>
                <div class="selection-indicator">
                    ${isSelected ? '✓ Selected' : 'Click to Select'}
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
        // Event listeners are now handled by MainPoolTab's event delegation
        // No direct listeners needed - this method is kept for compatibility but does nothing
        console.log('✅ TraitPurchaseSection: Event delegation active, no direct listeners attached');
    }

    handleStatToggle(card) {
        const statId = card.dataset.statId;
        const isSelected = card.dataset.selected === 'true';
        
        console.log('🔍 Stat card clicked:', statId, 'currently selected:', isSelected);
        
        if (!isSelected) {
            // Adding stat
            if (this.currentTraitData.statBonuses.length < 2) {
                this.currentTraitData.statBonuses.push(statId);
                console.log('✅ Added stat:', statId, 'Current stats:', this.currentTraitData.statBonuses);
                this.refreshBuilderUI();
            } else {
                this.builder.showNotification('Maximum 2 stat bonuses allowed.', 'warning');
            }
        } else {
            // Removing stat
            this.currentTraitData.statBonuses = this.currentTraitData.statBonuses.filter(s => s !== statId);
            console.log('✅ Removed stat:', statId, 'Current stats:', this.currentTraitData.statBonuses);
            this.refreshBuilderUI();
        }
    }

    handleConditionToggle(card) {
        const conditionId = card.dataset.conditionId;
        const tierCost = parseInt(card.dataset.tierCost);
        const isSelected = card.dataset.selected === 'true';
        
        console.log('🔍 Condition card clicked:', conditionId, 'cost:', tierCost, 'currently selected:', isSelected);
        
        if (!isSelected) {
            // Adding condition
            if (this.currentTraitData.tierCost + tierCost <= 3) {
                this.currentTraitData.conditions.push(conditionId);
                this.currentTraitData.tierCost += tierCost;
                console.log('✅ Added condition:', conditionId, 'Current conditions:', this.currentTraitData.conditions, 'Total cost:', this.currentTraitData.tierCost);
                this.refreshBuilderUI();
            } else {
                this.builder.showNotification('Condition tier limit (3 points) exceeded.', 'warning');
            }
        } else {
            // Removing condition
            this.currentTraitData.conditions = this.currentTraitData.conditions.filter(c => c !== conditionId);
            this.currentTraitData.tierCost -= tierCost;
            console.log('✅ Removed condition:', conditionId, 'Current conditions:', this.currentTraitData.conditions, 'Total cost:', this.currentTraitData.tierCost);
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
            // Event listeners are handled by MainPoolTab's event delegation - no need to re-attach
        }
    }


    handleClearBuilder() {
        this.currentTraitData = this.resetCurrentTraitData();
        this.refreshBuilderUI();
    }

    handleTraitPurchase() {
        console.log('🔍 Trait purchase attempted with data:', this.currentTraitData);
        console.log('🔍 Current trait stats:', this.currentTraitData.statBonuses);
        console.log('🔍 Current trait conditions:', this.currentTraitData.conditions);
        console.log('🔍 Current trait tierCost:', this.currentTraitData.tierCost);
        
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
        console.log('🔍 Trait removal requested for index:', index);
        const character = this.builder.currentCharacter;
        
        if (!character || !character.mainPoolPurchases || !character.mainPoolPurchases.traits) {
            console.log('❌ Invalid character data for trait removal');
            this.builder.showNotification('Invalid character data.', 'error');
            return;
        }
        
        const trait = character.mainPoolPurchases.traits[index];
        console.log('🔍 Found trait at index:', trait);
        
        if (!trait) {
            console.log('❌ Trait not found at index:', index, 'Total traits:', character.mainPoolPurchases.traits.length);
            this.builder.showNotification('Trait not found.', 'error');
            return;
        }
        
        try {
            const traitSummary = this.getTraitSummary(trait, character);
            if (confirm(`Remove trait "${traitSummary}"? This refunds ${trait.cost}p.`)) {
                TraitFlawSystem.removeTrait(character, index);
                this.builder.updateCharacter();
                this.builder.showNotification('Trait removed.', 'success');
            }
        } catch (error) {
            console.log('❌ Error in trait removal:', error);
            this.builder.showNotification(`Failed to remove trait: ${error.message}`, 'error');
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
