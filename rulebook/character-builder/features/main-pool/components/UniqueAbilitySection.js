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
        const isSelected = this.selectedUpgrades[abilityId]?.some(u => u.id === upgrade.id) || false;
        const selectedQuantity = hasQuantity ? (this.selectedUpgrades[abilityId]?.find(u => u.id === upgrade.id)?.quantity || 0) : 0;
        
        return `
            <div class="card upgrade-card clickable ${isSelected ? 'selected' : ''}" 
                 data-ability-id="${abilityId}" 
                 data-upgrade-id="${upgrade.id}"
                 data-upgrade-cost="${upgrade.cost}"
                 data-action="toggle-upgrade"
                 data-selected="${isSelected}">
                <div class="card-header">
                    <h4 class="card-title">${upgrade.name}</h4>
                    <span class="card-cost">${costDisplay}</span>
                </div>
                <div class="card-description">${upgrade.description}</div>
                
                ${hasQuantity ? `
                    <div class="quantity-info">
                        Selected: ${selectedQuantity}
                    </div>
                ` : ''}
                
                <div class="selection-indicator">
                    ${isSelected ? '✓ Selected' : 'Click to Select'}
                </div>
            </div>
        `;
    }


    // Event handlers called by main event delegation system
    
    handleUpgradeToggle(card) {
        const abilityId = card.dataset.abilityId;
        const upgradeId = card.dataset.upgradeId;
        const isSelected = card.dataset.selected === 'true';
        
        console.log('🔍 Upgrade card clicked:', upgradeId, 'currently selected:', isSelected);
        
        // Immediately update the card to prevent duplicate processing
        card.dataset.selected = (!isSelected).toString();
        
        // Get the upgrade definition to check if it has quantity
        const abilityDef = UniqueAbilitySystem.getComplexUniqueAbilities().find(a => a.id === abilityId);
        if (!abilityDef) return;
        
        const upgradeDef = abilityDef.upgrades.find(u => u.id === upgradeId);
        if (!upgradeDef) return;
        
        // Initialize selected upgrades for this ability if needed
        if (!this.selectedUpgrades[abilityId]) {
            this.selectedUpgrades[abilityId] = [];
        }
        
        if (!isSelected) {
            // Adding upgrade
            if (upgradeDef.per) {
                // Quantity-based upgrade - add with quantity 1
                const existingUpgrade = this.selectedUpgrades[abilityId].find(u => u.id === upgradeId);
                if (existingUpgrade) {
                    existingUpgrade.quantity = (existingUpgrade.quantity || 0) + 1;
                } else {
                    this.selectedUpgrades[abilityId].push({ id: upgradeId, quantity: 1 });
                }
            } else {
                // Toggle-based upgrade - add without quantity
                this.selectedUpgrades[abilityId].push({ id: upgradeId });
            }
            console.log('✅ Added upgrade:', upgradeId, 'Current upgrades:', this.selectedUpgrades[abilityId]);
        } else {
            // Removing upgrade
            if (upgradeDef.per) {
                // For quantity upgrades, decrease quantity or remove if at 0
                const existingUpgrade = this.selectedUpgrades[abilityId].find(u => u.id === upgradeId);
                if (existingUpgrade && existingUpgrade.quantity > 1) {
                    existingUpgrade.quantity--;
                } else {
                    this.selectedUpgrades[abilityId] = this.selectedUpgrades[abilityId].filter(u => u.id !== upgradeId);
                }
            } else {
                // For toggle upgrades, remove completely
                this.selectedUpgrades[abilityId] = this.selectedUpgrades[abilityId].filter(u => u.id !== upgradeId);
            }
            console.log('✅ Removed/decreased upgrade:', upgradeId, 'Current upgrades:', this.selectedUpgrades[abilityId]);
        }
        
        this.updateAbilityCostDisplay(abilityId);
        this.updateCardVisualState(card, !isSelected, upgradeDef);
    }

    updateCardVisualState(card, newSelectedState, upgradeDef) {
        // Update the card's visual appearance
        if (newSelectedState) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
        
        // Update the selection indicator text
        const indicator = card.querySelector('.selection-indicator');
        if (indicator) {
            indicator.textContent = newSelectedState ? '✓ Selected' : 'Click to Select';
        }
        
        // Update quantity display for quantity-based upgrades
        if (upgradeDef.per) {
            const abilityId = card.dataset.abilityId;
            const upgradeId = card.dataset.upgradeId;
            const selectedUpgrade = this.selectedUpgrades[abilityId]?.find(u => u.id === upgradeId);
            const quantity = selectedUpgrade?.quantity || 0;
            
            const quantityInfo = card.querySelector('.quantity-info');
            if (quantityInfo) {
                quantityInfo.textContent = `Selected: ${quantity}`;
            }
        }
    }

    refreshUpgradeUI(abilityId) {
        // Re-render only the upgrade section for this ability
        const upgradeSelector = document.querySelector(`[data-ability-id="${abilityId}"] .upgrade-list`);
        if (upgradeSelector) {
            const abilityDef = UniqueAbilitySystem.getComplexUniqueAbilities().find(a => a.id === abilityId);
            if (abilityDef) {
                upgradeSelector.innerHTML = this.renderUpgradeOptions(abilityDef, abilityId);
            }
        }
    }


    updateAbilityCostDisplay(abilityId) {
        const abilityDef = UniqueAbilitySystem.getComplexUniqueAbilities().find(a => a.id === abilityId);
        if (!abilityDef) return;

        let currentTotalCost = abilityDef.baseCost;
        const selectedUpgrades = this.selectedUpgrades[abilityId] || [];

        // Calculate cost from selected upgrades
        selectedUpgrades.forEach(selectedUpgrade => {
            const upgradeDef = abilityDef.upgrades.find(u => u.id === selectedUpgrade.id);
            if (upgradeDef) {
                if (selectedUpgrade.quantity) {
                    // Quantity-based upgrade
                    currentTotalCost += upgradeDef.cost * selectedUpgrade.quantity;
                } else {
                    // Toggle-based upgrade
                    currentTotalCost += upgradeDef.cost;
                }
            }
        });

        const costElement = document.getElementById(`total-cost-${abilityId}`);
        if (costElement) {
            costElement.textContent = currentTotalCost;
        }
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
                mainPoolTab.updateActiveSectionUI();
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