// rulebook/character-builder/ui/components/UniqueAbilitySection.js
import { UniqueAbilitySystem } from '../../systems/UniqueAbilitySystem.js';
import { RenderUtils } from '../shared/RenderUtils.js'; // Added

export class UniqueAbilitySection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.selectedUpgrades = {};
    }

    render(character, pointInfo) {
        const uniqueAbilities = UniqueAbilitySystem.getComplexUniqueAbilities();
        const purchasedAbilities = character.mainPoolPurchases.boons.filter(b => b.type === 'unique');

        const containerHtml = `
            <div class="main-pool-category">
                <h3>Unique Abilities (Complex)</h3>
                <p class="category-description">
                    Powerful abilities with customizable upgrades. Purchase the base ability first,
                    then add upgrades to customize its effects and power.
                </p>

                ${RenderUtils.renderPurchasedList(
                    purchasedAbilities,
                    (ability, index) => this.renderPurchasedAbility(ability, index),
                    { title: `Purchased Unique Abilities (${purchasedAbilities.length})`, emptyMessage: 'No unique abilities purchased' }
                )}

                <div class="available-items">
                    <h4>Available Unique Abilities</h4>
                    ${RenderUtils.renderGrid(
                        uniqueAbilities,
                        (ability) => this.renderUniqueAbilityOption(ability, character, pointInfo),
                        { gridContainerClass: 'grid-layout ability-grid', gridSpecificClass: 'grid-columns-auto-fit-320' }
                    )}
                </div>
            </div>
        `;
        return containerHtml;
    }

    renderPurchasedAbility(ability, index) {
        const upgradeCount = ability.upgrades?.length || 0;
        const upgradeText = upgradeCount > 0 ? ` (${upgradeCount} upgrades)` : '';

        return `
            <div class="purchased-item">
                <div class="item-info">
                    <span class="item-name">${ability.name}${upgradeText}</span>
                    <span class="item-details">${ability.cost}p - ${ability.category}</span>
                </div>
                <div class="item-actions">
                     ${RenderUtils.renderButton({ text: 'Modify', variant: 'secondary', size: 'small', classes: ['modify-ability'], dataAttributes: { index: index, 'boon-id': ability.boonId, action: 'modify-unique-ability' }})}
                     ${RenderUtils.renderButton({ text: 'Remove', variant: 'danger', size: 'small', classes: ['remove-ability'], dataAttributes: { index: index, 'boon-id': ability.boonId, action: 'remove-unique-ability' }})}
                </div>
            </div>
        `;
    }

    renderUniqueAbilityOption(ability, character, pointInfo) {
        const alreadyPurchased = character.mainPoolPurchases.boons.some(b => b.boonId === ability.id && b.type === 'unique');
        const canAffordBase = pointInfo.remaining >= ability.baseCost;

        let status = 'available';
        if (alreadyPurchased) status = 'purchased';
        else if (!canAffordBase) status = 'unaffordable';

        const upgradeCount = ability.upgrades?.length || 0;
        let additionalContent = `<div class="item-category">Category: ${ability.category}</div>`;
        additionalContent += `<div class="upgrade-info">${upgradeCount} upgrades available</div>`;

        if (!alreadyPurchased && canAffordBase) {
            additionalContent += `
                <div class="upgrade-preview">
                    <div class="upgrade-selector" data-ability-id="${ability.id}">
                        <h6>Select Upgrades (Optional)</h6>
                        <div class="upgrade-list">
                            ${this.renderUpgradeOptions(ability, ability.id)}
                        </div>
                        <div class="total-cost">
                            Total Cost: <span id="total-cost-${ability.id}">${ability.baseCost}</span>p
                        </div>
                    </div>
                    ${RenderUtils.renderButton({
                        text: 'Purchase Ability',
                        variant: 'primary',
                        classes: ['purchase-ability'], // Keep specific class if JS relies on it
                        dataAttributes: { 'ability-id': ability.id, action: 'purchase-unique-ability' }
                    })}
                </div>
            `;
        }
        
        return RenderUtils.renderCard({
            title: ability.name,
            cost: ability.baseCost, // Base cost shown on card
            description: ability.description,
            status: status, // status for the base ability purchase
            clickable: false, // Click handling is on the purchase button inside
            disabled: alreadyPurchased || !canAffordBase, // Card disabled if purchased or can't afford base
            dataAttributes: { 'ability-id': ability.id },
            additionalContent: additionalContent
        }, { cardClass: 'ability-card complex', showStatus: !(!alreadyPurchased && canAffordBase) }); // Only show card status if not showing purchase UI
    }

    renderUpgradeOptions(ability, abilityId) {
        if (!ability.upgrades) return '<p class="empty-state">No upgrades for this ability.</p>';
        return ability.upgrades.map(upgrade => `
            <div class="upgrade-option">
                <label class="upgrade-label">
                    <input type="checkbox"
                           class="upgrade-checkbox"
                           data-ability-id="${abilityId}"
                           data-upgrade-id="${upgrade.id}"
                           data-upgrade-cost="${upgrade.cost}">
                    <span class="upgrade-name">${upgrade.name}</span>
                    <span class="upgrade-cost">${upgrade.cost}p${upgrade.per ? `/${upgrade.per}` : ''}</span>
                </label>
                <div class="upgrade-description">${upgrade.description}</div>
                ${upgrade.per ? `
                    <div class="upgrade-quantity">
                        <label for="qty-${abilityId}-${upgrade.id}">Quantity:</label>
                        <input type="number"
                               id="qty-${abilityId}-${upgrade.id}"
                               class="upgrade-qty"
                               data-ability-id="${abilityId}"
                               data-upgrade-id="${upgrade.id}"
                               min="1" max="10" value="1" disabled>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }


    setupEventListeners() {
        // Handled by MainPoolTab's EventManager using data-action for purchase/remove
        // Internal listeners for checkboxes and quantity need to be setup if this component manages its own re-render
        // or if MainPoolTab delegates these specific input changes.
        // For now, assuming MainPoolTab will re-render this section, which re-attaches.
        // If this component re-renders itself on upgrade selection, then:
        const container = document.querySelector('.unique-ability-section'); // This selector needs to be more specific if used
        if (container) {
             container.querySelectorAll('.upgrade-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => this.handleUpgradeSelectionChange(e.target));
            });
            container.querySelectorAll('.upgrade-qty').forEach(input => {
                input.addEventListener('input', (e) => this.handleUpgradeQuantityChange(e.target));
            });
        }
    }
    
    handleUpgradeSelectionChange(checkboxElement) {
        const abilityId = checkboxElement.dataset.abilityId;
        const upgradeId = checkboxElement.dataset.upgradeId;
        const isChecked = checkboxElement.checked;

        const qtyInput = document.querySelector(`input.upgrade-qty[data-ability-id="${abilityId}"][data-upgrade-id="${upgradeId}"]`);
        if (qtyInput) {
            qtyInput.disabled = !isChecked;
            if (!isChecked) qtyInput.value = 1; // Reset quantity if unchecked
        }
        this.updateAbilityCostDisplay(abilityId);
    }

    handleUpgradeQuantityChange(quantityInputElement) {
         const abilityId = quantityInputElement.dataset.abilityId;
         this.updateAbilityCostDisplay(abilityId);
    }


    updateAbilityCostDisplay(abilityId) {
        const abilityDef = UniqueAbilitySystem.getComplexUniqueAbilities().find(a => a.id === abilityId);
        if (!abilityDef) return;

        let currentTotalCost = abilityDef.baseCost;
        const currentSelectedUpgrades = [];

        document.querySelectorAll(`input.upgrade-checkbox[data-ability-id="${abilityId}"]:checked`).forEach(checkbox => {
            const upgradeId = checkbox.dataset.upgradeId;
            const upgradeDef = abilityDef.upgrades.find(u => u.id === upgradeId);
            if (upgradeDef) {
                let quantity = 1;
                if (upgradeDef.per) {
                    const qtyInput = document.querySelector(`input.upgrade-qty[data-ability-id="${abilityId}"][data-upgrade-id="${upgradeId}"]`);
                    quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
                    currentTotalCost += upgradeDef.cost * quantity;
                } else {
                    currentTotalCost += upgradeDef.cost;
                }
                currentSelectedUpgrades.push({ id: upgradeId, quantity: upgradeDef.per ? quantity : undefined });
            }
        });

        const costElement = document.getElementById(`total-cost-${abilityId}`);
        if (costElement) {
            costElement.textContent = currentTotalCost;
        }
        this.selectedUpgrades[abilityId] = currentSelectedUpgrades; // Store for purchase
    }

    purchaseUniqueAbility(abilityId) {
        const character = this.builder.currentCharacter;
        const upgradesToPurchase = this.selectedUpgrades[abilityId] || []; // Get the currently selected upgrades
        try {
            UniqueAbilitySystem.purchaseUniqueAbility(character, abilityId, upgradesToPurchase);
            this.builder.updateCharacter();
            this.builder.showNotification(`Purchased unique ability!`, 'success');
            delete this.selectedUpgrades[abilityId]; // Clear selection after purchase
             // Force re-render of this section to update display
            const mainPoolTab = this.builder.tabs.mainPool;
            if(mainPoolTab && mainPoolTab.activeSection === 'uniqueAbilities') {
                mainPoolTab.updateActiveSection();
            }

        } catch (error) {
            this.builder.showNotification(`Failed to purchase ability: ${error.message}`, 'error');
        }
    }

    removeAbility(abilityIdToRemove) { // Changed to use boonId
        const character = this.builder.currentCharacter;
        try {
            const ability = character.mainPoolPurchases.boons.find(b => b.boonId === abilityIdToRemove && b.type === 'unique');
            if(ability){
                UniqueAbilitySystem.removeUniqueAbility(character, ability.boonId);
                this.builder.updateCharacter();
                this.builder.showNotification(`Removed ${ability.name}`, 'info');
            } else {
                this.builder.showNotification(`Could not find unique ability to remove.`, 'error');
            }
        } catch (error) {
            this.builder.showNotification(`Failed to remove ability: ${error.message}`, 'error');
        }
    }

    // Placeholder for modify ability - might open a modal or inline editor
    modifyAbility(abilityIdToModify) {
        this.builder.showNotification(`Modify functionality for ${abilityIdToModify} not yet implemented.`, 'info');
        // This would involve pre-populating the upgrade selector with existing upgrades
        // and then calling an update method instead of purchase.
    }
}