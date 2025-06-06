// UpgradeSelection.js - Manages the display and purchasing of upgrades for special attacks
import { SpecialAttackSystem } from '../../systems/SpecialAttackSystem.js';
import { RenderUtils } from '../shared/RenderUtils.js';

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
        const isLimitsBased = ['normal', 'specialist', 'straightforward'].includes(archetype);
        
        return `
            <div class="upgrades-section section-block">
                <div class="section-header">
                    <h4>Upgrades</h4>
                    <div class="points-remaining">
                        Upgrade Points: <span class="${remainingPoints < 0 ? 'error-text' : ''}">${remainingPoints}</span> / ${attack.upgradePointsAvailable || 0}
                    </div>
                </div>
                
                ${this.renderGuidanceMessage(attack, archetype, isLimitsBased)}
                ${this.renderPurchasedUpgrades(attack)}
                ${this.renderAvailableUpgrades(character, attack)}
            </div>
        `;
    }

    renderGuidanceMessage(attack, archetype, isLimitsBased) {
        if ((attack.upgradePointsAvailable || 0) === 0 && isLimitsBased) {
            return `
                <div class="upgrade-guidance">
                    <p><strong>${this.formatArchetypeName(archetype)} archetype:</strong> Add limits below to generate upgrade points.</p>
                </div>
            `;
        }
        return '';
    }

    renderPurchasedUpgrades(attack) {
        return RenderUtils.renderPurchasedList(
            attack.upgrades || [],
            (upgrade, index) => this.renderPurchasedUpgrade(upgrade, index),
            { 
                listContainerClass: 'upgrades-list selected-items-list', 
                title: `Purchased Upgrades (${attack.upgrades?.length || 0})`, 
                showCount: false, 
                emptyMessage: 'No upgrades purchased yet.' 
            }
        );
    }

    renderPurchasedUpgrade(upgrade, index) {
        return `
            <div class="selected-item purchased-upgrade" data-upgrade-index="${index}">
                <div class="item-header">
                    <span class="item-name">${upgrade.name}</span>
                    <span class="item-value">${upgrade.cost}p</span>
                </div>
                <div class="item-description">${upgrade.description || upgrade.effect || 'Effect details missing.'}</div>
                ${RenderUtils.renderButton({
                    text: '×', 
                    variant: 'danger', 
                    size: 'small', 
                    dataAttributes: {action: 'remove-upgrade', index: index}
                })}
            </div>
        `;
    }

    renderAvailableUpgrades(character, attack) {
        const availableUpgrades = SpecialAttackSystem.getAvailableUpgrades ? 
                                  SpecialAttackSystem.getAvailableUpgrades(character, attack) : 
                                  [];

        if (availableUpgrades.length === 0) {
            return '<div class="empty-state">No upgrades available for this attack type and archetype combination.</div>';
        }

        // Group upgrades by category for better organization
        const upgradesByCategory = this.groupUpgradesByCategory(availableUpgrades);

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
        const categories = {};
        upgrades.forEach(upgrade => {
            const category = upgrade.category || 'other';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(upgrade);
        });
        return categories;
    }

    renderUpgradeCategory(category, upgrades, attack, character) {
        const isExpanded = this.expandedCategories.has(category);
        const formattedCategoryName = this.formatCategoryName(category);

        return `
            <div class="upgrade-category">
                <div class="category-header" data-action="toggle-upgrade-category" data-category="${category}">
                    <span class="category-toggle ${isExpanded ? 'expanded' : ''}">${isExpanded ? '▼' : '▶'}</span>
                    <h5>${formattedCategoryName}</h5>
                </div>
                <div class="category-content ${isExpanded ? 'expanded' : 'collapsed'}">
                    ${RenderUtils.renderGrid(
                        upgrades,
                        upgrade => this.renderUpgradeCard(upgrade, attack, character),
                        { gridClass: 'upgrade-options-grid', showCount: false }
                    )}
                </div>
            </div>
        `;
    }

    renderUpgradeCard(upgrade, attack, character) {
        const canAfford = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0) >= upgrade.cost;
        const alreadyPurchased = attack.upgrades?.some(purchased => purchased.id === upgrade.id);
        const canPurchase = canAfford && !alreadyPurchased;

        // Check for any other restrictions
        const validationResult = this.validateUpgradePurchase(upgrade, attack, character);

        return RenderUtils.renderCard({
            title: upgrade.name,
            content: `
                <div class="upgrade-details">
                    <p class="upgrade-cost"><strong>Cost:</strong> ${upgrade.cost} points</p>
                    ${upgrade.description ? `<p class="upgrade-description">${upgrade.description}</p>` : ''}
                    ${upgrade.effect ? `<p class="upgrade-effect"><em>Effect:</em> ${upgrade.effect}</p>` : ''}
                    ${upgrade.restrictions ? `<p class="upgrade-restrictions"><small>Restrictions: ${upgrade.restrictions}</small></p>` : ''}
                    ${!validationResult.isValid ? `<p class="upgrade-validation-error error-text">${validationResult.errors[0]}</p>` : ''}
                </div>
            `,
            footer: this.renderUpgradeFooter(upgrade, canPurchase, alreadyPurchased, validationResult),
            cardClass: `upgrade-option ${alreadyPurchased ? 'purchased' : ''} ${canPurchase ? 'available' : 'unavailable'}`,
            showStatus: true
        });
    }

    renderUpgradeFooter(upgrade, canPurchase, alreadyPurchased, validationResult) {
        if (alreadyPurchased) {
            return '<span class="upgrade-status purchased">Already purchased</span>';
        }

        if (!validationResult.isValid) {
            return `<span class="upgrade-status error">${validationResult.errors[0]}</span>`;
        }

        if (canPurchase) {
            return RenderUtils.renderButton({
                text: `Buy (${upgrade.cost}p)`,
                variant: 'primary',
                size: 'small',
                dataAttributes: { action: 'purchase-upgrade', upgradeId: upgrade.id }
            });
        }

        return '<span class="upgrade-status unavailable">Cannot afford</span>';
    }

    validateUpgradePurchase(upgrade, attack, character) {
        // Implement upgrade validation logic here
        // This is a placeholder - you'd add real validation based on your game rules
        const errors = [];
        const warnings = [];

        // Example validations:
        // - Check for conflicting upgrades
        // - Check archetype restrictions
        // - Check attack type compatibility

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Granular update methods for improved performance
    updatePurchasedUpgrades(attack) {
        const purchasedContainer = document.querySelector('.upgrades-list');
        if (purchasedContainer) {
            // Update the purchased list
            const newContent = this.renderPurchasedUpgrades(attack);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newContent;
            const newList = tempDiv.querySelector('.upgrades-list');
            if (newList) {
                purchasedContainer.replaceWith(newList);
            }
        }

        // Update points display
        const pointsDisplay = document.querySelector('.points-remaining');
        if (pointsDisplay) {
            const remainingPoints = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);
            pointsDisplay.innerHTML = `Upgrade Points: <span class="${remainingPoints < 0 ? 'error-text' : ''}">${remainingPoints}</span> / ${attack.upgradePointsAvailable || 0}`;
        }
    }

    updateUpgradeCard(upgradeId, attack, character) {
        const upgradeCard = document.querySelector(`[data-upgrade-id="${upgradeId}"]`);
        if (upgradeCard) {
            const upgrade = this.findUpgradeById(upgradeId);
            if (upgrade) {
                const newCard = this.renderUpgradeCard(upgrade, attack, character);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = newCard;
                upgradeCard.replaceWith(tempDiv.firstElementChild);
            }
        }
    }

    // Helper methods
    formatArchetypeName(archetype) {
        return archetype ? archetype.charAt(0).toUpperCase() + archetype.slice(1) : '';
    }

    formatCategoryName(category) {
        return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    findUpgradeById(upgradeId) {
        // This would typically call the system to find the upgrade by ID
        return SpecialAttackSystem.getUpgradeById ? SpecialAttackSystem.getUpgradeById(upgradeId) : null;
    }

    toggleCategory(categoryKey) {
        if (this.expandedCategories.has(categoryKey)) {
            this.expandedCategories.delete(categoryKey);
        } else {
            this.expandedCategories.add(categoryKey);
        }
    }

    // Event handling
    handleEvent(event) {
        const action = event.target.dataset.action;

        switch (action) {
            case 'purchase-upgrade':
                this.parentTab.purchaseUpgrade(event.target.dataset.upgradeId);
                break;
            case 'remove-upgrade':
                this.parentTab.removeUpgrade(parseInt(event.target.dataset.index));
                break;
            case 'toggle-upgrade-category':
                this.toggleCategory(event.target.dataset.category || event.target.closest('[data-category]').dataset.category);
                this.parentTab.render();
                break;
        }
    }

    // Cleanup
    destroy() {
        this.expandedCategories.clear();
    }
}