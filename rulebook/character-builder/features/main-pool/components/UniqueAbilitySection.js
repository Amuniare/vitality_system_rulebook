// rulebook/character-builder/ui/components/UniqueAbilitySection.js
import { UniqueAbilitySystem } from '../../../systems/UniqueAbilitySystem.js';
import { RenderUtils } from '../../../shared/utils/RenderUtils.js';

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
                <h3>Available Unique Abilities</h3>
                <p class="category-description">
                    Powerful abilities with customizable upgrades. Purchase the base ability first,
                    then add upgrades to customize its effects and power.
                </p>

                ${RenderUtils.renderGrid(
                    uniqueAbilities,
                    (ability) => this.renderUniqueAbilityOption(ability, character, pointInfo),
                    { gridContainerClass: 'grid-layout ability-grid', gridSpecificClass: 'grid-columns-1fr' }
                )}
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
        
        return `
            <div class="upgrade-grid grid-layout grid-columns-auto-fit-300">
                ${ability.upgrades.map(upgrade => this.renderUpgradeCard(upgrade, abilityId)).join('')}
            </div>
        `;
    }

    renderUpgradeCard(upgrade, abilityId) {
        const hasQuantity = upgrade.per;
        const costDisplay = hasQuantity ? `${upgrade.cost}p/${upgrade.per}` : `${upgrade.cost}p`;
        
        return `
            <div class="card upgrade-card clickable" 
                 data-ability-id="${abilityId}" 
                 data-upgrade-id="${upgrade.id}"
                 data-upgrade-cost="${upgrade.cost}">
                <div class="card-header">
                    <h4 class="card-title">${upgrade.name}</h4>
                    <span class="card-cost">${costDisplay}</span>
                </div>
                <div class="card-description">${upgrade.description}</div>
                
                ${hasQuantity ? `
                    <div class="upgrade-quantity-controls">
                        <button type="button" 
                                class="btn btn-small upgrade-decrease" 
                                data-ability-id="${abilityId}" 
                                data-upgrade-id="${upgrade.id}"
                                disabled>-</button>
                        <span class="quantity-display" 
                              id="qty-display-${abilityId}-${upgrade.id}">0</span>
                        <button type="button" 
                                class="btn btn-small upgrade-increase" 
                                data-ability-id="${abilityId}" 
                                data-upgrade-id="${upgrade.id}">+</button>
                    </div>
                ` : `
                    <div class="upgrade-toggle-controls">
                        <button type="button" 
                                class="btn btn-small upgrade-toggle" 
                                data-ability-id="${abilityId}" 
                                data-upgrade-id="${upgrade.id}"
                                data-selected="false">Add Upgrade</button>
                    </div>
                `}
            </div>
        `;
    }


    // Event handlers called by main event delegation system
    
    handleUpgradeIncrease(button) {
        const abilityId = button.dataset.abilityId;
        const upgradeId = button.dataset.upgradeId;
        const displayElement = document.getElementById(`qty-display-${abilityId}-${upgradeId}`);
        const decreaseBtn = button.parentElement.querySelector('.upgrade-decrease');
        
        if (displayElement) {
            let currentQty = parseInt(displayElement.textContent) || 0;
            currentQty++;
            displayElement.textContent = currentQty;
            
            // Enable decrease button
            decreaseBtn.disabled = false;
            
            // Update card selection state
            this.updateUpgradeCardState(abilityId, upgradeId, currentQty > 0);
            this.updateAbilityCostDisplay(abilityId);
        }
    }

    handleUpgradeDecrease(button) {
        const abilityId = button.dataset.abilityId;
        const upgradeId = button.dataset.upgradeId;
        const displayElement = document.getElementById(`qty-display-${abilityId}-${upgradeId}`);
        
        if (displayElement) {
            let currentQty = parseInt(displayElement.textContent) || 0;
            if (currentQty > 0) {
                currentQty--;
                displayElement.textContent = currentQty;
                
                // Disable decrease button if quantity is 0
                if (currentQty === 0) {
                    button.disabled = true;
                }
                
                // Update card selection state
                this.updateUpgradeCardState(abilityId, upgradeId, currentQty > 0);
                this.updateAbilityCostDisplay(abilityId);
            }
        }
    }

    handleUpgradeToggle(button) {
        const abilityId = button.dataset.abilityId;
        const upgradeId = button.dataset.upgradeId;
        const isSelected = button.dataset.selected === 'true';
        
        button.dataset.selected = (!isSelected).toString();
        button.textContent = isSelected ? 'Add Upgrade' : 'Remove Upgrade';
        
        // Update card selection state
        this.updateUpgradeCardState(abilityId, upgradeId, !isSelected);
        this.updateAbilityCostDisplay(abilityId);
    }

    handleUpgradeCardClick(card) {
        const abilityId = card.dataset.abilityId;
        const upgradeId = card.dataset.upgradeId;
        
        // Check if this is a quantity-based upgrade
        const quantityControls = card.querySelector('.upgrade-quantity-controls');
        const toggleControls = card.querySelector('.upgrade-toggle-controls');
        
        if (quantityControls) {
            // For quantity upgrades, clicking the card acts like the + button
            const increaseBtn = quantityControls.querySelector('.upgrade-increase');
            if (increaseBtn) {
                this.handleUpgradeIncrease(increaseBtn);
            }
        } else if (toggleControls) {
            // For toggle upgrades, clicking the card acts like the toggle button
            const toggleBtn = toggleControls.querySelector('.upgrade-toggle');
            if (toggleBtn) {
                this.handleUpgradeToggle(toggleBtn);
            }
        }
    }

    updateUpgradeCardState(abilityId, upgradeId, isSelected) {
        const card = document.querySelector(`[data-ability-id="${abilityId}"][data-upgrade-id="${upgradeId}"]`);
        if (card) {
            if (isSelected) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        }
    }


    updateAbilityCostDisplay(abilityId) {
        const abilityDef = UniqueAbilitySystem.getComplexUniqueAbilities().find(a => a.id === abilityId);
        if (!abilityDef) return;

        let currentTotalCost = abilityDef.baseCost;
        const currentSelectedUpgrades = [];

        // Check quantity-based upgrades
        document.querySelectorAll(`[data-ability-id="${abilityId}"] .quantity-display`).forEach(display => {
            const card = display.closest('.upgrade-card');
            const upgradeId = card.dataset.upgradeId;
            const quantity = parseInt(display.textContent) || 0;
            
            if (quantity > 0) {
                const upgradeDef = abilityDef.upgrades.find(u => u.id === upgradeId);
                if (upgradeDef) {
                    currentTotalCost += upgradeDef.cost * quantity;
                    currentSelectedUpgrades.push({ id: upgradeId, quantity: quantity });
                }
            }
        });

        // Check toggle-based upgrades
        document.querySelectorAll(`[data-ability-id="${abilityId}"] .upgrade-toggle[data-selected="true"]`).forEach(button => {
            const card = button.closest('.upgrade-card');
            const upgradeId = card.dataset.upgradeId;
            const upgradeDef = abilityDef.upgrades.find(u => u.id === upgradeId);
            
            if (upgradeDef) {
                currentTotalCost += upgradeDef.cost;
                currentSelectedUpgrades.push({ id: upgradeId });
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