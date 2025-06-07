// rulebook/character-builder/features/special-attacks/components/UpgradeSelection.js
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
        const archetype = character.archetypes.specialAttack;
        const isLimitsBased = ['normal', 'specialist', 'straightforward', 'sharedUses'].includes(archetype);
        
        return `
            <div class="upgrades-section section-block">
                <div class="section-header">
                    <h4>Upgrades</h4>
                    <div class="points-remaining ${remainingPoints < 0 ? 'error-text' : ''}">
                        Points: ${remainingPoints} / ${attack.upgradePointsAvailable || 0}
                    </div>
                </div>
                
                ${this.renderGuidanceMessage(attack, archetype, isLimitsBased)}
                ${RenderUtils.renderPurchasedList(
                    attack.upgrades || [],
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

    renderPurchasedUpgrade(upgrade) {
        return `
            <div class="purchased-item purchased-upgrade">
                <div class="item-info">
                    <span class="item-name">${upgrade.name}</span>
                    <span class="item-details">${upgrade.cost}p</span>
                </div>
                ${RenderUtils.renderButton({
                    text: '×',
                    variant: 'danger',
                    size: 'small',
                    dataAttributes: { action: 'remove-upgrade', 'upgrade-id': upgrade.id }
                })}
            </div>
        `;
    }

    renderAvailableUpgrades(character, attack) {
        const allUpgrades = SpecialAttackSystem.getAvailableUpgrades();
        const upgradesByCategory = this.groupUpgradesByCategory(allUpgrades);

        return `
            <div class="available-upgrades-section">
                <h4>Available Upgrades</h4>
                <div class="upgrade-categories">
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
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderUpgradeCard(upgrade, attack, character) {
        const validation = SpecialAttackSystem.validateUpgradeAddition(character, attack, upgrade);
        const alreadyPurchased = attack.upgrades?.some(u => u.id === upgrade.id);
        const canAfford = !validation.errors.some(e => e.startsWith('Insufficient points'));
        
        let status = 'available';
        if (alreadyPurchased) status = 'purchased';
        else if (!validation.isValid && !canAfford) status = 'unaffordable';
        else if (!validation.isValid) status = 'conflict';
        
        const actualCost = SpecialAttackSystem._getActualUpgradeCost(upgrade, character);
        
        return RenderUtils.renderCard({
            title: upgrade.name,
            cost: actualCost,
            description: upgrade.effect || upgrade.description,
            clickable: validation.isValid && !alreadyPurchased,
            disabled: !validation.isValid || alreadyPurchased,
            dataAttributes: { action: 'purchase-upgrade', 'upgrade-id': upgrade.id },
            additionalContent: `
                ${upgrade.restriction ? `<small class="upgrade-restriction">Restriction: ${upgrade.restriction}</small>` : ''}
                ${!validation.isValid && !alreadyPurchased ? `<small class="error-text">${validation.errors[0]}</small>` : ''}
            `
        }, { cardClass: 'upgrade-card' });
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
}