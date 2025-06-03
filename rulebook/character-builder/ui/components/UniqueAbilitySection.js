// UniqueAbilitySection.js - Complex unique ability purchase with upgrade system
import { UniqueAbilitySystem } from '../../systems/UniqueAbilitySystem.js';

export class UniqueAbilitySection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.selectedUpgrades = {}; // Track upgrades for each ability
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
                
                <div class="purchased-items">
                    <h4>Purchased Unique Abilities (${purchasedAbilities.length})</h4>
                    ${purchasedAbilities.length > 0 ? `
                        <div class="item-list">
                            ${purchasedAbilities.map((ability, index) => this.renderPurchasedAbility(ability, index)).join('')}
                        </div>
                    ` : '<p class="empty-state">No unique abilities purchased</p>'}
                </div>
                
                <div class="available-items">
                    <h4>Available Unique Abilities</h4>
                    <div class="ability-grid">
                        ${uniqueAbilities.map(ability => this.renderUniqueAbilityOption(ability, character, pointInfo)).join('')}
                    </div>
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
                    <button class="btn-secondary btn-small modify-ability" data-index="${index}">Modify</button>
                    <button class="btn-danger btn-small remove-ability" data-index="${index}">Remove</button>
                </div>
            </div>
        `;
    }

    renderUniqueAbilityOption(ability, character, pointInfo) {
        const canAfford = pointInfo.remaining >= ability.baseCost;
        const alreadyPurchased = character.mainPoolPurchases.boons.some(b => b.boonId === ability.id && b.type === 'unique');
        const canPurchase = canAfford && !alreadyPurchased;

        const upgradeCount = ability.upgrades?.length || 0;

        return `
            <div class="ability-card complex ${canPurchase ? 'clickable' : 'disabled'}" 
                 data-ability-id="${ability.id}">
                <h5>${ability.name}</h5>
                <p class="item-cost"><strong>Base Cost: ${ability.baseCost}p</strong></p>
                <p class="item-description">${ability.description}</p>
                <div class="item-category">Category: ${ability.category}</div>
                <div class="upgrade-info">${upgradeCount} upgrades available</div>
                
                ${!alreadyPurchased && canPurchase ? `
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
                        <button class="btn-primary purchase-ability" data-ability-id="${ability.id}">
                            Purchase Ability
                        </button>
                    </div>
                ` : ''}
                
                ${alreadyPurchased ? 
                    '<div class="status-badge">Already Purchased</div>' : 
                    !canAfford ? '<div class="status-badge error">Cannot Afford</div>' : ''
                }
            </div>
        `;
    }

    renderUpgradeOptions(ability, abilityId) {
        if (!ability.upgrades) return '';
        
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
                        <label>Quantity:</label>
                        <input type="number" 
                               class="upgrade-qty" 
                               data-ability-id="${abilityId}"
                               data-upgrade-id="${upgrade.id}"
                               min="1" 
                               max="10" 
                               value="1" 
                               disabled>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Upgrade selection
        document.querySelectorAll('.upgrade-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const abilityId = e.target.dataset.abilityId;
                const upgradeId = e.target.dataset.upgradeId;
                const isChecked = e.target.checked;
                
                // Enable/disable quantity input
                const qtyInput = document.querySelector(`input.upgrade-qty[data-ability-id="${abilityId}"][data-upgrade-id="${upgradeId}"]`);
                if (qtyInput) {
                    qtyInput.disabled = !isChecked;
                    if (!isChecked) qtyInput.value = 1;
                }
                
                this.updateAbilityCost(abilityId);
            });
        });

        // Quantity changes
        document.querySelectorAll('.upgrade-qty').forEach(input => {
            input.addEventListener('input', (e) => {
                const abilityId = e.target.dataset.abilityId;
                this.updateAbilityCost(abilityId);
            });
        });

        // Purchase ability
        document.querySelectorAll('.purchase-ability').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const abilityId = e.target.dataset.abilityId;
                this.purchaseUniqueAbility(abilityId);
            });
        });

        // Remove ability
        document.querySelectorAll('.remove-ability').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.removeAbility(index);
            });
        });
    }

    updateAbilityCost(abilityId) {
        const ability = UniqueAbilitySystem.getComplexUniqueAbilities().find(a => a.id === abilityId);
        if (!ability) return;

        let totalCost = ability.baseCost;
        const selectedUpgrades = [];

        document.querySelectorAll(`input.upgrade-checkbox[data-ability-id="${abilityId}"]:checked`).forEach(checkbox => {
            const upgradeId = checkbox.dataset.upgradeId;
            const upgradeCost = parseInt(checkbox.dataset.upgradeCost);
            
            const upgrade = ability.upgrades.find(u => u.id === upgradeId);
            const qtyInput = document.querySelector(`input.upgrade-qty[data-ability-id="${abilityId}"][data-upgrade-id="${upgradeId}"]`);
            const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
            
            if (upgrade) {
                if (upgrade.per) {
                    totalCost += upgradeCost * quantity;
                } else {
                    totalCost += upgradeCost;
                }
                
                selectedUpgrades.push({ id: upgradeId, quantity: upgrade.per ? quantity : undefined });
            }
        });

        // Update display
        const costElement = document.getElementById(`total-cost-${abilityId}`);
        if (costElement) {
            costElement.textContent = totalCost;
        }

        // Store selected upgrades
        this.selectedUpgrades[abilityId] = selectedUpgrades;
    }

    purchaseUniqueAbility(abilityId) {
        const character = this.builder.currentCharacter;
        const upgrades = this.selectedUpgrades[abilityId] || [];
        
        try {
            UniqueAbilitySystem.purchaseUniqueAbility(character, abilityId, upgrades);
            
            this.builder.updateCharacter();
            this.builder.showNotification(`Purchased unique ability!`, 'success');
            
            // Clear selected upgrades
            delete this.selectedUpgrades[abilityId];
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase ability: ${error.message}`, 'error');
        }
    }

    removeAbility(index) {
        const character = this.builder.currentCharacter;
        const uniqueAbilities = character.mainPoolPurchases.boons.filter(b => b.type === 'unique');
        
        try {
            if (index >= 0 && index < uniqueAbilities.length) {
                const ability = uniqueAbilities[index];
                UniqueAbilitySystem.removeUniqueAbility(character, ability.boonId);
                
                this.builder.updateCharacter();
                this.builder.showNotification(`Removed ${ability.name}`, 'info');
            }
        } catch (error) {
            this.builder.showNotification(`Failed to remove ability: ${error.message}`, 'error');
        }
    }
}