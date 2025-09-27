// ConditionalBonusPurchaseSection.js - New simplified conditional bonus system
import { TraitFlawSystem } from '../../../systems/TraitFlawSystem.js';
import { PointPoolCalculator } from '../../../calculators/PointPoolCalculator.js';
import { EventManager } from '../../../shared/utils/EventManager.js';
import { RenderUtils } from '../../../shared/utils/RenderUtils.js';

export class ConditionalBonusPurchaseSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.currentConditionalBonusData = this.resetCurrentConditionalBonusData();
    }

    resetCurrentConditionalBonusData() {
        return {
            conditionalBonusId: null, // single conditional bonus ID
            statBonuses: [] // array of exactly 2 stat IDs
        };
    }

    render(character, pointInfo) {
        const conditionalBonuses = TraitFlawSystem.getConditionalBonuses();
        const statOptionsData = TraitFlawSystem.getConditionalBonusStatOptions();

        return `
            <div class="conditional-bonus-purchase-section-content">
                ${this.renderSectionHeader(pointInfo)}
                ${this.renderSectionDescription()}
                ${this.renderPurchasedConditionalBonuses(character)}

                <div class="conditional-bonus-builder">
                    <h5>Create New Conditional Bonus</h5>
                    ${this.renderConditionalBonusBuilderContent(conditionalBonuses, statOptionsData, pointInfo)}
                </div>
            </div>
        `;
    }

    renderSectionHeader(pointInfo) {
        return `
            <div class="section-header">
                <h4>Conditional Bonuses (Cost ${TraitFlawSystem.getTraitCost()}p Each)</h4>
                <div class="points-remaining">
                   Main Pool: ${pointInfo.remaining}p
                   ${pointInfo.remaining < TraitFlawSystem.getTraitCost() && pointInfo.remaining >= 0 ? '<span class="warning">(Low)</span>' : ''}
                   ${pointInfo.remaining < 0 ? '<span class="error">(Over Budget!)</span>' : ''}
                </div>
            </div>
        `;
    }

    renderSectionDescription() {
        return `
            <p class="category-description">
                Conditional Bonuses cost ${TraitFlawSystem.getTraitCost()} point and provide +Tier bonus to TWO stats when the condition is met.
                Choose 1 conditional bonus and 2 stats to benefit. Same stacking penalties apply.
            </p>
        `;
    }

    renderPurchasedConditionalBonuses(character) {
        if (!character.mainPoolPurchases.conditionalBonuses || character.mainPoolPurchases.conditionalBonuses.length === 0) {
            return '<div class="no-purchases">No conditional bonuses purchased yet.</div>';
        }

        return `
            <div class="purchased-conditional-bonuses">
                <h5>Purchased Conditional Bonuses</h5>
                ${character.mainPoolPurchases.conditionalBonuses.map((conditionalBonus, index) =>
                    this.renderPurchasedConditionalBonus(conditionalBonus, index, character)
                ).join('')}
            </div>
        `;
    }

    renderPurchasedConditionalBonus(conditionalBonus, index, character) {
        return `
            <div class="purchased-item conditional-bonus-card-horizontal">
                <div class="item-info">
                    <div class="conditional-bonus-stats">
                        <strong>Bonuses:</strong> +${character.tier} ${conditionalBonus.statBonuses.map(s => this.getStatName(s)).join(`, +${character.tier} `)}
                    </div>
                    <div class="conditional-bonus-condition">
                        <strong>When:</strong> ${conditionalBonus.name} - ${conditionalBonus.description}
                    </div>
                    <span class="item-cost conditional-bonus-item-cost">-${conditionalBonus.cost}p</span>
                </div>
                ${RenderUtils.renderButton({
                    text: 'Remove',
                    variant: 'danger',
                    size: 'small',
                    dataAttributes: { action: 'remove-conditional-bonus', index: index }
                })}
            </div>
        `;
    }

    getStatName(statId) {
        const opt = TraitFlawSystem.getConditionalBonusStatOptions().find(s => s.id === statId);
        return opt ? opt.name : statId;
    }

    renderConditionalBonusBuilderContent(conditionalBonuses, statOptionsData, pointInfo) {
        const conditionalBonusCost = TraitFlawSystem.getTraitCost();

        const canPurchase = this.currentConditionalBonusData.conditionalBonusId &&
                           this.currentConditionalBonusData.statBonuses.length === 2;

        return `
            <div class="conditional-bonus-builder-content">
                ${this.renderConditionalBonusSelectionStep(conditionalBonuses, false)}
                ${this.renderStatSelectionStep(statOptionsData, false)}
                ${this.renderBuilderActions(canPurchase, true, conditionalBonusCost)}
            </div>
        `;
    }

    renderConditionalBonusSelectionStep(conditionalBonuses, disabled) {
        return `
            <div class="builder-step">
                <h6>Step 1: Choose Conditional Bonus (Exactly 1 required)</h6>
                <div class="conditional-bonus-grid grid-layout grid-columns-auto-fit-300">
                    ${conditionalBonuses.map(bonus => this.renderConditionalBonusCard(bonus, disabled)).join('')}
                </div>
                <div class="selection-summary">
                    Selected Conditional Bonus: ${this.getSelectedConditionalBonusName() || 'None'}
                </div>
            </div>
        `;
    }

    renderConditionalBonusCard(bonus, sectionDisabled) {
        const isSelected = this.currentConditionalBonusData.conditionalBonusId === bonus.id;
        const disabled = sectionDisabled;

        return `
            <div class="card conditional-bonus-card clickable ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}"
                 data-action="conditional-bonus-toggle"
                 data-conditional-bonus-id="${bonus.id}"
                 data-selected="${isSelected}">
                <div class="card-header">
                    <h4 class="card-title">${bonus.name}</h4>
                    <div class="selection-indicator">
                        ${isSelected ? '✓ Selected' : 'Click to Select'}
                    </div>
                </div>
                <div class="card-description">${bonus.description}</div>
            </div>
        `;
    }

    renderStatSelectionStep(statOptionsData, disabled) {
        return `
            <div class="builder-step">
                <h6>Step 2: Choose Stat Bonuses (Exactly 2 required)</h6>
                <div class="conditional-bonus-stat-grid grid-layout grid-columns-auto-fit-250">
                    ${statOptionsData.map(stat => this.renderStatCard(stat, disabled)).join('')}
                </div>
                <div class="selection-summary">
                    Selected Stats: ${this.currentConditionalBonusData.statBonuses.map(s => this.getStatName(s)).join(', ') || 'None'}
                    (${this.currentConditionalBonusData.statBonuses.length}/2)
                </div>
            </div>
        `;
    }

    renderStatCard(stat, sectionDisabled) {
        const isSelected = this.currentConditionalBonusData.statBonuses.includes(stat.id);
        const isDisabledByLimit = this.currentConditionalBonusData.statBonuses.length >= 2 && !isSelected;
        const disabled = sectionDisabled || isDisabledByLimit;

        return `
            <div class="card conditional-bonus-stat-card clickable ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}"
                 data-action="conditional-bonus-stat-toggle"
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

    renderBuilderActions(canPurchase, canAffordConditionalBonus, conditionalBonusCost) {
        return `
            <div class="builder-actions">
                ${RenderUtils.renderButton({
                    text: 'Clear Selections',
                    variant: 'secondary',
                    dataAttributes: { action: 'clear-conditional-bonus-builder' }
                })}
                ${RenderUtils.renderButton({
                    text: `Purchase Conditional Bonus (-${conditionalBonusCost}p)`,
                    variant: 'primary',
                    disabled: !canPurchase,
                    dataAttributes: {
                        action: 'purchase-conditional-bonus',
                        purchase: 'conditional-bonus',
                        cost: conditionalBonusCost
                    }
                })}
            </div>
        `;
    }

    getSelectedConditionalBonusName() {
        if (!this.currentConditionalBonusData.conditionalBonusId) {
            return null;
        }
        const bonus = TraitFlawSystem.getConditionalBonuses().find(cb => cb.id === this.currentConditionalBonusData.conditionalBonusId);
        return bonus ? bonus.name : this.currentConditionalBonusData.conditionalBonusId;
    }

    setupEventListeners() {
        console.log('✅ ConditionalBonusPurchaseSection: Event delegation active, no direct listeners needed');
    }

    handleConditionalBonusToggle(card) {
        const conditionalBonusId = card.dataset.conditionalBonusId;
        const isSelected = card.dataset.selected === 'true';

        console.log('🔍 Conditional bonus card clicked:', conditionalBonusId, 'currently selected:', isSelected);

        if (!isSelected) {
            // Selecting new conditional bonus (only one allowed)
            this.currentConditionalBonusData.conditionalBonusId = conditionalBonusId;
            console.log('✅ Selected conditional bonus:', conditionalBonusId);
        } else {
            // Deselecting current conditional bonus
            this.currentConditionalBonusData.conditionalBonusId = null;
            console.log('✅ Deselected conditional bonus:', conditionalBonusId);
        }

        this.refreshBuilderUI();
    }

    handleStatToggle(card) {
        const statId = card.dataset.statId;
        const isSelected = card.dataset.selected === 'true';

        console.log('🔍 Stat card clicked:', statId, 'currently selected:', isSelected);

        card.dataset.selected = (!isSelected).toString();

        if (!isSelected) {
            // Adding stat
            if (this.currentConditionalBonusData.statBonuses.length < 2) {
                this.currentConditionalBonusData.statBonuses.push(statId);
                console.log('✅ Added stat:', statId, 'Current stats:', this.currentConditionalBonusData.statBonuses);
                this.refreshBuilderUI();
            } else {
                card.dataset.selected = isSelected.toString();
                this.builder.showNotification('Maximum 2 stat bonuses allowed.', 'warning');
            }
        } else {
            // Removing stat
            this.currentConditionalBonusData.statBonuses = this.currentConditionalBonusData.statBonuses.filter(s => s !== statId);
            console.log('✅ Removed stat:', statId, 'Current stats:', this.currentConditionalBonusData.statBonuses);
            this.refreshBuilderUI();
        }
    }

    refreshBuilderUI() {
        const builderContainer = document.querySelector('.conditional-bonus-builder');
        if (builderContainer && this.builder.currentCharacter) {
            const pointInfo = PointPoolCalculator.calculateAllPools(this.builder.currentCharacter).remaining;
            const mainPoolRemaining = pointInfo.mainPool || 0;
            const conditionalBonuses = TraitFlawSystem.getConditionalBonuses();
            const statOptionsData = TraitFlawSystem.getConditionalBonusStatOptions();

            builderContainer.innerHTML = `
                <h5>Create New Conditional Bonus</h5>
                ${this.renderConditionalBonusBuilderContent(conditionalBonuses, statOptionsData, {remaining: mainPoolRemaining})}
            `;
        }
    }

    handleClearBuilder() {
        this.currentConditionalBonusData = this.resetCurrentConditionalBonusData();
        this.refreshBuilderUI();
    }

    handleConditionalBonusPurchase() {
        console.log('Attempting conditional bonus purchase with data:', JSON.stringify(this.currentConditionalBonusData));

        const character = this.builder.currentCharacter;
        const pools = PointPoolCalculator.calculateAllPools(character);
        const remainingPoints = pools.remaining.mainPool;
        const itemCost = TraitFlawSystem.getTraitCost();

        // Budget validation with detailed warnings
        if (itemCost > remainingPoints) {
            const deficit = itemCost - remainingPoints;
            this.builder.showNotification(
                `⚠️ Over Budget: This conditional bonus costs ${itemCost}p but you only have ${remainingPoints}p remaining (${deficit}p over budget). The purchase will proceed but your character will be over budget.`,
                "warning"
            );
        }

        // Clear the builder state BEFORE the purchase
        const conditionalBonusDataCopy = JSON.parse(JSON.stringify(this.currentConditionalBonusData));
        this.currentConditionalBonusData = this.resetCurrentConditionalBonusData();

        try {
            TraitFlawSystem.purchaseConditionalBonus(character, conditionalBonusDataCopy);
            this.builder.showNotification('Conditional bonus purchased successfully!', 'success');
            this.builder.updateCharacter();
        } catch (error) {
            // Restore state if purchase failed
            this.currentConditionalBonusData = conditionalBonusDataCopy;
            console.log('❌ Conditional bonus purchase failed:', error.message, 'with data:', JSON.stringify(conditionalBonusDataCopy));
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
            this.refreshBuilderUI();
        }
    }

    handleConditionalBonusRemoval(index) {
        console.log('🔍 Conditional bonus removal requested for index:', index);
        const character = this.builder.currentCharacter;

        if (!character || !character.mainPoolPurchases || !character.mainPoolPurchases.conditionalBonuses) {
            console.log('❌ Invalid character data for conditional bonus removal');
            this.builder.showNotification('Invalid character data.', 'error');
            return;
        }

        const conditionalBonus = character.mainPoolPurchases.conditionalBonuses[index];
        console.log('🔍 Found conditional bonus at index:', conditionalBonus);

        if (!conditionalBonus) {
            console.log('❌ Conditional bonus not found at index:', index, 'Total conditional bonuses:', character.mainPoolPurchases.conditionalBonuses.length);
            this.builder.showNotification('Conditional bonus not found.', 'error');
            return;
        }

        try {
            const conditionalBonusSummary = this.getConditionalBonusSummary(conditionalBonus, character);
            if (confirm(`Remove conditional bonus "${conditionalBonusSummary}"? This refunds ${conditionalBonus.cost}p.`)) {
                TraitFlawSystem.removeConditionalBonus(character, index);
                this.builder.updateCharacter();
                this.builder.showNotification('Conditional bonus removed.', 'success');
            }
        } catch (error) {
            console.log('❌ Error in conditional bonus removal:', error);
            this.builder.showNotification(`Failed to remove conditional bonus: ${error.message}`, 'error');
        }
    }

    getConditionalBonusSummary(conditionalBonus, character) {
        return `+${character.tier} ${conditionalBonus.statBonuses.map(s => this.getStatName(s)).join('/')} when ${conditionalBonus.name}`;
    }
}