// frontend/character-builder/features/special-attacks/components/UpgradeSelection.js
import { SpecialAttackSystem } from '../../../systems/SpecialAttackSystem.js';
import { RenderUtils } from '../../../shared/utils/RenderUtils.js';

export class UpgradeSelection {
    constructor(parentTab) {
        this.parentTab = parentTab;
        this.attackIndex = 0;
        this.expandedCategories = new Set();
    }

    setAttackIndex(index) {
        this.attackIndex = index;
    }

    render(attack, character) {
        const remainingPoints = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);
        const spentPoints = attack.upgradePointsSpent || 0;
        const archetype = character.archetypes.specialAttack;
        const isLimitsBased = ['normal', 'specialist', 'straightforward', 'sharedUses'].includes(archetype);
        
        return `
            <div class="upgrades-section section-block">
                <div class="section-header">
                    <h4>Upgrades</h4>
                    <div class="points-remaining ${remainingPoints < 0 ? 'error-text' : ''}">
                        Points: ${spentPoints} / ${attack.upgradePointsAvailable || 0}
                    </div>
                </div>
                
                ${this.renderGuidanceMessage(attack, archetype, isLimitsBased)}
                ${RenderUtils.renderPurchasedList(
                    this.groupPurchasedUpgrades(attack.upgrades || []),
                    (upgrade, index) => this.renderPurchasedUpgrade(upgrade),
                    { title: `Purchased Upgrades (${attack.upgrades?.length || 0})`, emptyMessage: 'No upgrades purchased.' }
                )}
                ${this.renderAvailableUpgrades(character, attack)}
            </div>
        `;
    }

    renderGuidanceMessage(attack, archetype, isLimitsBased) {
        if ((attack.upgradePointsAvailable || 0) === 0 && isLimitsBased) {
            return `<div class="upgrade-guidance">Add limits to generate upgrade points.</div>`;
        }
        return '';
    }

    groupPurchasedUpgrades(upgrades) {
        const grouped = [];
        const enhancedScales = upgrades.filter(u => u.name === 'Enhanced Scale');
        const otherUpgrades = upgrades.filter(u => u.name !== 'Enhanced Scale');
        
        // Add Enhanced Scale as a single grouped item if any exist
        if (enhancedScales.length > 0) {
            const firstEnhancedScale = enhancedScales[0];
            grouped.push({
                ...firstEnhancedScale,
                isGrouped: true,
                groupCount: enhancedScales.length,
                // Use the specialty status of the first one (they should all be the same now)
                isSpecialty: firstEnhancedScale.isSpecialty
            });
        }
        
        // Add all other upgrades individually
        grouped.push(...otherUpgrades);
        
        return grouped;
    }

    renderPurchasedUpgrade(upgrade) {
        const baseCost = upgrade.cost === 0 ? 0 : upgrade.cost;
        const isSpecialty = upgrade.isSpecialty || false;
        const isCustom = upgrade.isCustom || false;
        const isGrouped = upgrade.isGrouped || false;
        const groupCount = upgrade.groupCount || 1;
        
        // For grouped Enhanced Scale, calculate total cost
        const totalBaseCost = isGrouped ? baseCost * groupCount : baseCost;
        const displayCost = isSpecialty ? Math.floor(totalBaseCost / 2) : totalBaseCost;
        
        const nameWithCount = isGrouped && groupCount > 1 ? `${upgrade.name} (${groupCount})` : upgrade.name;
        const costText = displayCost === 0 ? 'Free' : `${displayCost}p${isSpecialty ? ' (Specialty)' : ''}${isCustom ? ' (Custom)' : ''}`;
        
        return `
            <div class="purchased-item purchased-upgrade ${isCustom ? 'custom-upgrade' : ''}">
                <div class="item-info">
                    <span class="item-name">${nameWithCount}</span>
                    <span class="item-details">${costText}</span>
                    ${isCustom && upgrade.effect ? `<span class="item-description">${upgrade.effect}</span>` : ''}
                </div>
                <div class="item-actions">
                    ${RenderUtils.renderButton({
                        text: isSpecialty ? 'Specialty' : 'Make Specialty',
                        variant: isSpecialty ? 'success' : 'secondary',
                        size: 'small',
                        dataAttributes: { action: 'toggle-specialty', 'upgrade-id': upgrade.id }
                    })}
                    ${RenderUtils.renderButton({
                        text: '×',
                        variant: 'danger',
                        size: 'small',
                        dataAttributes: { action: 'remove-upgrade', 'upgrade-id': upgrade.id }
                    })}
                </div>
            </div>
        `;
    }

    renderAvailableUpgrades(character, attack) {
        const allUpgrades = SpecialAttackSystem.getAvailableUpgrades();
        const upgradesByCategory = this.groupUpgradesByCategory(allUpgrades);

        return `
            <div class="available-upgrades-section">
                <h4>Available Upgrades</h4>
                <div class="upgrade-categories grid-layout grid-columns-2fr">
                    ${Object.entries(upgradesByCategory).map(([category, upgrades]) =>
                        this.renderUpgradeCategory(category, upgrades, attack, character)
                    ).join('')}
                </div>
            </div>
        `;
    }

    groupUpgradesByCategory(upgrades) {
        return upgrades.reduce((acc, upgrade) => {
            const category = upgrade.category || 'Other';
            if (!acc[category]) acc[category] = [];
            acc[category].push(upgrade);
            return acc;
        }, {});
    }

    renderUpgradeCategory(category, upgrades, attack, character) {
        const isExpanded = this.expandedCategories.has(category);
        return `
            <div class="upgrade-category">
                <div class="limit-category-header" data-action="toggle-upgrade-category" data-category="${category}">
                    <span class="category-expand-icon">${isExpanded ? '▼' : '▶'}</span>
                    <h5 class="category-name">${this.formatCategoryName(category)}</h5>
                </div>
                ${isExpanded ? `
                    <div class="limit-category-content">
                        ${RenderUtils.renderGrid(
                            upgrades,
                            upgrade => this.renderUpgradeCard(upgrade, attack, character),
                            { gridContainerClass: 'grid-layout', gridSpecificClass: 'grid-columns-auto-fit-280' }
                        )}
                        ${category === 'Variable Bonuses' ? this.renderCustomUpgradeCard(attack, character) : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderUpgradeCard(upgrade, attack, character) {
        const validation = SpecialAttackSystem.validateUpgradeAddition(character, attack, upgrade);
        const alreadyPurchased = attack.upgrades?.some(u => u.id === upgrade.id);
        
        // Special handling for Enhanced Scale - show count if multiple purchases
        let enhancedScaleCount = 0;
        const isEnhancedScale = upgrade.name === 'Enhanced Scale';
        if (isEnhancedScale) {
            enhancedScaleCount = attack.upgrades?.filter(u => u.name === 'Enhanced Scale').length || 0;
        }
        
        let status = 'available';
        if (alreadyPurchased && !isEnhancedScale) status = 'purchased';
        else if (!validation.isValid) status = 'conflict';
        
        const actualCost = SpecialAttackSystem._getActualUpgradeCost(upgrade, character);
        
        // Only disable if already purchased or has conflicts (not affordability)
        const hasConflicts = validation.errors.some(e => !e.startsWith('Insufficient points'));
        
        // For Enhanced Scale, show count and allow multiple purchases
        const displayTitle = isEnhancedScale && enhancedScaleCount > 0 
            ? `${upgrade.name} (${enhancedScaleCount})`
            : upgrade.name;
        
        const shouldDisable = isEnhancedScale 
            ? hasConflicts  // Enhanced Scale only disabled by conflicts, not by already being purchased
            : alreadyPurchased || hasConflicts;
        
        // Special handling for Enhanced Scale - add quantity controls
        let quantityControls = '';
        if (isEnhancedScale) {
            quantityControls = `
                <div class="quantity-controls">
                    <button type="button" class="quantity-btn quantity-decrease" 
                            data-action="remove-upgrade" data-upgrade-id="${upgrade.id}"
                            ${enhancedScaleCount === 0 ? 'disabled' : ''}>-</button>
                    <span class="quantity-display">${enhancedScaleCount}</span>
                    <button type="button" class="quantity-btn quantity-increase" 
                            data-action="purchase-upgrade" data-upgrade-id="${upgrade.id}"
                            ${shouldDisable ? 'disabled' : ''}>+</button>
                </div>
            `;
        }
        
        return RenderUtils.renderCard({
            title: displayTitle,
            cost: actualCost,
            description: upgrade.effect || upgrade.description,
            clickable: !isEnhancedScale && !shouldDisable, // Enhanced Scale uses quantity controls instead
            disabled: !isEnhancedScale && shouldDisable,
            dataAttributes: !isEnhancedScale ? { action: 'purchase-upgrade', 'upgrade-id': upgrade.id } : {},
            additionalContent: `
                ${upgrade.restriction ? `<small class="upgrade-restriction">Restriction: ${upgrade.restriction}</small>` : ''}
                ${upgrade.limit ? `<small class="upgrade-limit">Limit: ${upgrade.limit}</small>` : ''}
                ${upgrade.penalty ? `<small class="upgrade-penalty">Penalty: ${upgrade.penalty}</small>` : ''}
                ${upgrade.chainPenalty ? `<small class="upgrade-chainpenalty">Chain Penalty: ${upgrade.chainPenalty}</small>` : ''}
                ${upgrade.usage ? `<small class="upgrade-usage">Usage: ${upgrade.usage}</small>` : ''}
                ${upgrade.frequency ? `<small class="upgrade-frequency">Frequency: ${upgrade.frequency}</small>` : ''}
                ${hasConflicts && !alreadyPurchased ? `<small class="error-text">${validation.errors.find(e => !e.startsWith('Insufficient points'))}</small>` : ''}
                ${quantityControls}
            `
        }, { cardClass: 'upgrade-card' });
    }

    renderCustomUpgradeCard(attack, character) {
        const remainingPoints = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);
        
        return `
            <div class="custom-upgrade-card upgrade-card">
                <div class="card available">
                    <div class="card-header">
                        <h4 class="card-title">Create Custom Upgrade</h4>
                        <span class="card-cost">Variable Cost</span>
                    </div>
                    <div class="card-description">
                        Design your own upgrade with custom name, description, and cost (minimum 5 points).
                    </div>
                    
                    <div class="custom-upgrade-form" style="display: none;">
                        <div class="form-group">
                            <label for="custom-upgrade-name-${this.attackIndex}">Upgrade Name:</label>
                            <input type="text" id="custom-upgrade-name-${this.attackIndex}" class="custom-upgrade-input" placeholder="Enter upgrade name" maxlength="50">
                        </div>
                        
                        <div class="form-group">
                            <label for="custom-upgrade-description-${this.attackIndex}">Effect Description:</label>
                            <textarea id="custom-upgrade-description-${this.attackIndex}" class="custom-upgrade-input" rows="3" placeholder="Describe the upgrade's effects" maxlength="300"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="custom-upgrade-cost-${this.attackIndex}">Point Cost:</label>
                            <input type="number" id="custom-upgrade-cost-${this.attackIndex}" class="custom-upgrade-input" placeholder="Enter cost" min="5" max="100" value="5">
                            <small class="form-help">Cost: 5-100 points (will show budget warning if needed)</small>
                        </div>
                        
                        <div class="form-actions">
                            ${RenderUtils.renderButton({
                                text: 'Add Custom Upgrade',
                                variant: 'primary',
                                size: 'small',
                                dataAttributes: { action: 'add-custom-upgrade-special-attack' },
                                id: `add-custom-upgrade-btn-${this.attackIndex}`
                            })}
                            ${RenderUtils.renderButton({
                                text: 'Cancel',
                                variant: 'secondary',
                                size: 'small',
                                dataAttributes: { action: 'cancel-custom-upgrade-special-attack' }
                            })}
                        </div>
                    </div>
                    
                    <div class="card-action">
                        ${RenderUtils.renderButton({
                            text: 'Create Custom Upgrade',
                            variant: 'primary',
                            size: 'small',
                            dataAttributes: { action: 'show-custom-upgrade-form' }
                        })}
                    </div>
                </div>
            </div>
        `;
    }

    formatCategoryName(category) {
        return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    toggleCategory(categoryKey) {
        if (this.expandedCategories.has(categoryKey)) {
            this.expandedCategories.delete(categoryKey);
        } else {
            this.expandedCategories.add(categoryKey);
        }
        this.parentTab.render();
    }

    showCustomUpgradeForm() {
        const form = document.querySelector('.custom-upgrade-form');
        const createButton = document.querySelector('[data-action="show-custom-upgrade-form"]');
        
        if (form) {
            form.style.display = 'block';
        }
        if (createButton) {
            createButton.style.display = 'none';
        }
    }

    cancelCustomUpgradeForm() {
        const form = document.querySelector('.custom-upgrade-form');
        const createButton = document.querySelector('[data-action="show-custom-upgrade-form"]');
        
        if (form) {
            form.style.display = 'none';
            // Clear form fields
            const nameInput = document.getElementById(`custom-upgrade-name-${this.attackIndex}`);
            const descInput = document.getElementById(`custom-upgrade-description-${this.attackIndex}`);
            const costInput = document.getElementById(`custom-upgrade-cost-${this.attackIndex}`);
            
            if (nameInput) nameInput.value = '';
            if (descInput) descInput.value = '';
            if (costInput) costInput.value = '5';
        }
        if (createButton) {
            createButton.style.display = 'block';
        }
    }

    handleAddCustomUpgrade() {
        const nameInput = document.getElementById(`custom-upgrade-name-${this.attackIndex}`);
        const descriptionInput = document.getElementById(`custom-upgrade-description-${this.attackIndex}`);
        const costInput = document.getElementById(`custom-upgrade-cost-${this.attackIndex}`);

        if (!nameInput || !descriptionInput || !costInput) {
            this.parentTab.builder.showNotification('Custom upgrade form not found', 'error');
            return;
        }

        const upgradeData = {
            id: `custom_upgrade_${Date.now()}`,
            name: nameInput.value.trim(),
            effect: descriptionInput.value.trim(),
            cost: Number(costInput.value),
            category: 'Variable Bonuses',
            subcategory: 'Custom',
            isCustom: true
        };

        // Validate the custom upgrade data
        const validation = this.validateCustomUpgradeData(upgradeData);
        if (!validation.isValid) {
            this.parentTab.builder.showNotification(validation.errors.join(', '), 'error');
            return;
        }

        const character = this.parentTab.builder.currentCharacter;
        const attack = character.specialAttacks[this.attackIndex];

        try {
            SpecialAttackSystem.addCustomUpgrade(character, this.attackIndex, upgradeData);
            this.parentTab.builder.updateCharacter();
            this.parentTab.builder.showNotification(`Added custom upgrade: ${upgradeData.name}!`, 'success');
            
            // Clear form and hide it
            this.cancelCustomUpgradeForm();
            
            // Re-render the tab to show the new upgrade
            this.parentTab.render();

        } catch (error) {
            this.parentTab.builder.showNotification(`Failed to add custom upgrade: ${error.message}`, 'error');
        }
    }

    validateCustomUpgradeData(upgradeData) {
        const errors = [];

        if (!upgradeData.name || upgradeData.name.length < 1) {
            errors.push('Upgrade name is required');
        }

        if (upgradeData.name && upgradeData.name.length > 50) {
            errors.push('Upgrade name must be 50 characters or less');
        }

        if (!upgradeData.effect || upgradeData.effect.length < 1) {
            errors.push('Upgrade effect description is required');
        }

        if (upgradeData.effect && upgradeData.effect.length > 300) {
            errors.push('Upgrade effect description must be 300 characters or less');
        }

        if (!upgradeData.cost || isNaN(upgradeData.cost) || upgradeData.cost < 5) {
            errors.push('Upgrade cost must be at least 5 points');
        }

        const character = this.parentTab.builder.currentCharacter;
        const attack = character.specialAttacks[this.attackIndex];
        const remainingPoints = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);

        if (upgradeData.cost && upgradeData.cost > remainingPoints) {
            errors.push(`Upgrade cost cannot exceed available points (${remainingPoints})`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}