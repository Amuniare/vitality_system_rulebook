// frontend/character-builder/features/main-pool/components/UniqueAbilitySection.js
import { UniqueAbilitySystem } from '../../../systems/UniqueAbilitySystem.js';
import { PointPoolCalculator } from '../../../calculators/PointPoolCalculator.js';
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
                    { gridContainerClass: 'grid-layout ability-grid', gridSpecificClass: 'grid-columns-2fr' }
                )}

                ${this.renderCustomUniqueAbilityCreation(character, pointInfo)}
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

        let status = 'available';
        if (alreadyPurchased) status = 'purchased';

        const upgradeCount = ability.upgrades?.length || 0;
        let additionalContent = `<div class="item-category">Category: ${ability.category}</div>`;
        additionalContent += `<div class="upgrade-info">${upgradeCount} upgrades available</div>`;

        if (!alreadyPurchased) {
            additionalContent += `
                <div class="upgrade-preview">
                    <div class="upgrade-selector" data-ability-id="${ability.id}">
                        <h6>Select Upgrades (Optional)</h6>
                        <div class="upgrade-list">
                            ${this.renderUpgradeOptions(ability, ability.id)}
                        </div>
                        <div class="purchase-actions">
                            <div class="total-cost">
                                Total Cost: <span id="total-cost-${ability.id}">${ability.baseCost}</span>p
                            </div>
                            ${RenderUtils.renderButton({
                                text: 'Purchase Ability',
                                variant: 'primary',
                                classes: ['purchase-ability'], // Keep specific class if JS relies on it
                                dataAttributes: { 
                                    'ability-id': ability.id, 
                                    action: 'purchase-unique-ability',
                                    purchase: 'unique-ability',
                                    cost: ability.baseCost
                                }
                            })}
                        </div>
                    </div>
                </div>
            `;
        }
        
        return RenderUtils.renderCard({
            title: ability.name,
            cost: ability.baseCost, // Base cost shown on card
            description: ability.description,
            status: status, // status for the base ability purchase
            clickable: false, // Click handling is on the purchase button inside
            disabled: alreadyPurchased, // Card disabled only if purchased
            dataAttributes: { 'ability-id': ability.id },
            additionalContent: additionalContent
        }, { cardClass: 'ability-card complex', showStatus: alreadyPurchased }); // Only show card status if already purchased
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
        const hasQuantity = upgrade.per || upgrade.cost === "variable";
        const isSelected = this.selectedUpgrades[abilityId]?.some(u => u.id === upgrade.id) || false;
        const selectedQuantity = hasQuantity ? (this.selectedUpgrades[abilityId]?.find(u => u.id === upgrade.id)?.quantity || 0) : 0;
        
        // Handle cost display for different types
        let costDisplay;
        let actualCost = upgrade.cost;
        if (upgrade.cost === "variable") {
            costDisplay = "Variable cost";
            actualCost = selectedQuantity; // For variable cost, the quantity IS the cost
        } else if (hasQuantity) {
            costDisplay = `${upgrade.cost}p/${upgrade.per}`;
        } else {
            costDisplay = `${upgrade.cost}p`;
        }
        
        if (hasQuantity) {
            // Render quantifiable upgrade with +/- controls and number input
            return `
                <div class="card upgrade-card quantifiable ${selectedQuantity > 0 ? 'selected' : ''}" 
                     data-ability-id="${abilityId}" 
                     data-upgrade-id="${upgrade.id}"
                     data-upgrade-cost="${actualCost}">
                    <div class="card-header">
                        <h4 class="card-title">${upgrade.name}</h4>
                        <span class="card-cost">${costDisplay}</span>
                    </div>
                    <div class="card-description">${upgrade.description}</div>
                    
                    <div class="quantity-controls">
                        <button class="quantity-btn minus" 
                                data-action="decrease-upgrade-quantity"
                                data-ability-id="${abilityId}"
                                data-upgrade-id="${upgrade.id}"
                                ${selectedQuantity <= 0 ? 'disabled' : ''}>−</button>
                        <input type="number" 
                               class="quantity-input"
                               value="${selectedQuantity}"
                               min="0"
                               data-action="set-upgrade-quantity"
                               data-ability-id="${abilityId}"
                               data-upgrade-id="${upgrade.id}">
                        <button class="quantity-btn plus" 
                                data-action="increase-upgrade-quantity"
                                data-ability-id="${abilityId}"
                                data-upgrade-id="${upgrade.id}">+</button>
                    </div>
                    
                    <div class="quantity-info">
                        ${this.renderQuantityInfo(upgrade, selectedQuantity)}
                    </div>
                </div>
            `;
        } else {
            // Render toggle upgrade with click to select
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
                    
                    <div class="selection-indicator">
                        ${isSelected ? '✓ Selected' : 'Click to Select'}
                    </div>
                </div>
            `;
        }
    }

    renderQuantityInfo(upgrade, selectedQuantity) {
        if (selectedQuantity <= 0) {
            return 'None selected';
        }
        
        if (upgrade.cost === "variable") {
            return `Selected: ${selectedQuantity} (${selectedQuantity}p total)`;
        } else {
            return `Selected: ${selectedQuantity} (${selectedQuantity * upgrade.cost}p total)`;
        }
    }

    renderCustomUniqueAbilityCreation(character, pointInfo) {
        const minimumCost = 5; // Minimum cost for a custom unique ability

        const formContent = `
            <div class="custom-ability-form">
                <div class="form-group">
                    <label for="custom-ability-name">Ability Name:</label>
                    <input type="text" id="custom-ability-name" class="custom-ability-input" placeholder="Enter ability name" maxlength="50">
                </div>
                
                <div class="form-group">
                    <label for="custom-ability-category">Category:</label>
                    <select id="custom-ability-category" class="custom-ability-input">
                        <option value="offensive">Offensive</option>
                        <option value="defensive">Defensive</option>
                        <option value="utility">Utility</option>
                        <option value="movement">Movement</option>
                        <option value="social">Social</option>
                        <option value="mental">Mental</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="custom-ability-description">Description:</label>
                    <textarea id="custom-ability-description" class="custom-ability-input" rows="3" placeholder="Describe the ability's effects and mechanics" maxlength="500"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="custom-ability-cost">Point Cost:</label>
                    <input type="number" id="custom-ability-cost" class="custom-ability-input" placeholder="Enter cost" min="${minimumCost}" max="100" value="${minimumCost}">
                    <small class="form-help">Minimum cost: ${minimumCost} points</small>
                </div>
                
                <div class="form-actions">
                    ${RenderUtils.renderButton({
                        text: 'Create Custom Ability',
                        variant: 'primary',
                        size: 'medium',
                        dataAttributes: { action: 'create-custom-unique-ability' },
                        id: 'create-custom-ability-btn'
                    })}
                </div>
            </div>
        `;

        return RenderUtils.renderCard({
            title: 'Create Custom Unique Ability',
            description: 'Design your own unique ability with a custom name, description, and cost.',
            additionalContent: formContent,
            clickable: false,
            disabled: false
        }, { cardClass: 'ability-card custom-ability-card' });
    }

    // Event handlers called by main event delegation system
    
    handleUpgradeToggle(card) {
        const abilityId = card.dataset.abilityId;
        const upgradeId = card.dataset.upgradeId;
        const isSelected = card.dataset.selected === 'true';
        
        console.log('🔍 Upgrade card clicked:', upgradeId, 'currently selected:', isSelected);
        
        // Only handle toggle upgrades (not quantifiable ones)
        const abilityDef = UniqueAbilitySystem.getComplexUniqueAbilities().find(a => a.id === abilityId);
        if (!abilityDef) return;
        
        const upgradeDef = abilityDef.upgrades.find(u => u.id === upgradeId);
        if (!upgradeDef || upgradeDef.per) return; // Skip quantifiable upgrades
        
        // Immediately update the card to prevent duplicate processing
        card.dataset.selected = (!isSelected).toString();
        
        // Initialize selected upgrades for this ability if needed
        if (!this.selectedUpgrades[abilityId]) {
            this.selectedUpgrades[abilityId] = [];
        }
        
        if (!isSelected) {
            // Adding toggle upgrade
            this.selectedUpgrades[abilityId].push({ id: upgradeId });
            console.log('✅ Added upgrade:', upgradeId, 'Current upgrades:', this.selectedUpgrades[abilityId]);
        } else {
            // Removing toggle upgrade
            this.selectedUpgrades[abilityId] = this.selectedUpgrades[abilityId].filter(u => u.id !== upgradeId);
            console.log('✅ Removed upgrade:', upgradeId, 'Current upgrades:', this.selectedUpgrades[abilityId]);
        }
        
        this.updateAbilityCostDisplay(abilityId);
        this.updateCardVisualState(card, !isSelected, upgradeDef);
    }

    handleIncreaseUpgradeQuantity(button) {
        const abilityId = button.dataset.abilityId;
        const upgradeId = button.dataset.upgradeId;
        
        console.log('🔍 Increasing quantity for upgrade:', upgradeId);
        
        // Initialize selected upgrades for this ability if needed
        if (!this.selectedUpgrades[abilityId]) {
            this.selectedUpgrades[abilityId] = [];
        }
        
        const existingUpgrade = this.selectedUpgrades[abilityId].find(u => u.id === upgradeId);
        if (existingUpgrade) {
            existingUpgrade.quantity = (existingUpgrade.quantity || 0) + 1;
        } else {
            this.selectedUpgrades[abilityId].push({ id: upgradeId, quantity: 1 });
        }
        
        console.log('✅ Increased quantity:', upgradeId, 'Current upgrades:', this.selectedUpgrades[abilityId]);
        
        this.updateAbilityCostDisplay(abilityId);
        this.refreshUpgradeUI(abilityId);
    }

    handleDecreaseUpgradeQuantity(button) {
        const abilityId = button.dataset.abilityId;
        const upgradeId = button.dataset.upgradeId;
        
        console.log('🔍 Decreasing quantity for upgrade:', upgradeId);
        
        if (!this.selectedUpgrades[abilityId]) return;
        
        const existingUpgrade = this.selectedUpgrades[abilityId].find(u => u.id === upgradeId);
        if (existingUpgrade && existingUpgrade.quantity > 1) {
            existingUpgrade.quantity--;
        } else if (existingUpgrade) {
            // Remove completely if quantity would go to 0
            this.selectedUpgrades[abilityId] = this.selectedUpgrades[abilityId].filter(u => u.id !== upgradeId);
        }
        
        console.log('✅ Decreased quantity:', upgradeId, 'Current upgrades:', this.selectedUpgrades[abilityId]);
        
        this.updateAbilityCostDisplay(abilityId);
        this.refreshUpgradeUI(abilityId);
    }

    handleSetUpgradeQuantity(input) {
        const abilityId = input.dataset.abilityId;
        const upgradeId = input.dataset.upgradeId;
        const newQuantity = parseInt(input.value) || 0;
        
        console.log('🔍 Setting quantity for upgrade:', upgradeId, 'to:', newQuantity);
        
        // Initialize selected upgrades for this ability if needed
        if (!this.selectedUpgrades[abilityId]) {
            this.selectedUpgrades[abilityId] = [];
        }
        
        const existingUpgrade = this.selectedUpgrades[abilityId].find(u => u.id === upgradeId);
        
        if (newQuantity <= 0) {
            // Remove upgrade if quantity is 0 or negative
            if (existingUpgrade) {
                this.selectedUpgrades[abilityId] = this.selectedUpgrades[abilityId].filter(u => u.id !== upgradeId);
            }
        } else {
            // Set or update the quantity
            if (existingUpgrade) {
                existingUpgrade.quantity = newQuantity;
            } else {
                this.selectedUpgrades[abilityId].push({ id: upgradeId, quantity: newQuantity });
            }
        }
        
        console.log('✅ Set quantity:', upgradeId, 'to:', newQuantity, 'Current upgrades:', this.selectedUpgrades[abilityId]);
        
        this.updateAbilityCostDisplay(abilityId);
        this.refreshUpgradeUI(abilityId);
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
                if (upgradeDef.cost === "variable") {
                    // Variable cost upgrade - the quantity IS the cost
                    currentTotalCost += selectedUpgrade.quantity || 0;
                } else if (selectedUpgrade.quantity) {
                    // Quantity-based upgrade with fixed cost per unit
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
        // 1. Get current point balance
        const character = this.builder.currentCharacter;
        const pools = PointPoolCalculator.calculateAllPools(character);
        const remainingPoints = pools.remaining.mainPool;
        
        // 2. Get the cost of the item (including upgrades)
        const upgradesToPurchase = this.selectedUpgrades[abilityId] || [];
        const ability = UniqueAbilitySystem.getComplexUniqueAbilities().find(a => a.id === abilityId);
        const itemCost = ability ? UniqueAbilitySystem.calculateUniqueAbilityTotalCost(ability, upgradesToPurchase) : 0;
        
        // 3. Check if this purchase will go over budget
        if (itemCost > remainingPoints) {
            // 4. Show a non-blocking notification
            this.builder.showNotification("This purchase puts you over budget.", "warning");
        }

        // 5. Proceed with the purchase REGARDLESS of the check.
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
            // This will now only catch hard rule validation errors.
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
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

    handleCreateCustomUniqueAbility() {
        const nameInput = document.getElementById('custom-ability-name');
        const categorySelect = document.getElementById('custom-ability-category');
        const descriptionInput = document.getElementById('custom-ability-description');
        const costInput = document.getElementById('custom-ability-cost');

        if (!nameInput || !categorySelect || !descriptionInput || !costInput) {
            this.builder.showNotification('Custom ability form not found', 'error');
            return;
        }

        const abilityData = {
            id: `custom_${Date.now()}`,
            name: nameInput.value.trim(),
            category: categorySelect.value,
            description: descriptionInput.value.trim(),
            baseCost: Number(costInput.value),
            cost: Number(costInput.value), // For compatibility with existing system
            upgrades: [], // Custom abilities start with no upgrades
            isCustom: true
        };

        // Validate the custom ability data
        const validation = this.validateCustomAbilityData(abilityData);
        if (!validation.isValid) {
            this.builder.showNotification(validation.errors.join(', '), 'error');
            return;
        }

        // 1. Get current point balance
        const character = this.builder.currentCharacter;
        const pools = PointPoolCalculator.calculateAllPools(character);
        const remainingPoints = pools.remaining.mainPool;
        
        // 2. Get the cost of the item
        const itemCost = abilityData.cost;
        
        // 3. Check if this purchase will go over budget
        if (itemCost > remainingPoints) {
            // 4. Show a non-blocking notification
            this.builder.showNotification("This purchase puts you over budget.", "warning");
        }

        // 5. Proceed with the purchase REGARDLESS of the check.
        try {
            UniqueAbilitySystem.purchaseCustomUniqueAbility(character, abilityData);
            this.builder.updateCharacter();
            this.builder.showNotification(`Created and purchased custom ability: ${abilityData.name}!`, 'success');
            
            // Clear the form
            nameInput.value = '';
            categorySelect.value = 'offensive';
            descriptionInput.value = '';
            costInput.value = '5';
            
            // Force re-render of this section to update display
            const mainPoolTab = this.builder.tabs.mainPool;
            if(mainPoolTab && mainPoolTab.activeSection === 'uniqueAbilities') {
                mainPoolTab.updateActiveSectionUI();
            }

        } catch (error) {
            // This will now only catch hard rule validation errors.
            this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
        }
    }

    validateCustomAbilityData(abilityData) {
        const errors = [];

        if (!abilityData.name || abilityData.name.length < 1) {
            errors.push('Ability name is required');
        }

        if (abilityData.name && abilityData.name.length > 50) {
            errors.push('Ability name must be 50 characters or less');
        }

        if (!abilityData.description || abilityData.description.length < 1) {
            errors.push('Ability description is required');
        }

        if (abilityData.description && abilityData.description.length > 500) {
            errors.push('Ability description must be 500 characters or less');
        }

        if (!abilityData.baseCost || isNaN(abilityData.baseCost) || abilityData.baseCost < 5) {
            errors.push('Ability cost must be at least 5 points');
        }

        if (abilityData.baseCost && abilityData.baseCost > 100) {
            errors.push('Ability cost cannot exceed 100 points');
        }

        if (!abilityData.category) {
            errors.push('Ability category is required');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}