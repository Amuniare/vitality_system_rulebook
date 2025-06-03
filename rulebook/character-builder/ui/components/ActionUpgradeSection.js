// ActionUpgradeSection.js - Action upgrade purchase UI component
import { ActionSystem } from '../../systems/ActionSystem.js';
import { GameConstants } from '../../core/GameConstants.js';

export class ActionUpgradeSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render(character, pointInfo) {
        const availableActions = ActionSystem.getAvailableActions();
        const purchasedUpgrades = character.mainPoolPurchases.primaryActionUpgrades;

        const containerHtml = `
            <div class="main-pool-category">
                <h3>Primary Action Upgrades (${GameConstants.PRIMARY_TO_QUICK_COST}p each)</h3>
                <p class="category-description">
                    Convert any Primary Action to a Quick Action. This allows you to perform the action 
                    as part of your Quick Action instead of using your Primary Action.
                </p>
                
                <div class="purchased-items">
                    <h4>Purchased Upgrades (${purchasedUpgrades.length})</h4>
                    ${purchasedUpgrades.length > 0 ? `
                        <div class="item-list">
                            ${purchasedUpgrades.map((upgrade, index) => this.renderPurchasedUpgrade(upgrade, index)).join('')}
                        </div>
                    ` : '<p class="empty-state">No upgrades purchased</p>'}
                </div>
                
                <div class="available-items">
                    <h4>Available Actions</h4>
                    <div class="action-grid">
                        ${availableActions.map(action => this.renderActionOption(action, character, pointInfo)).join('')}
                    </div>
                </div>
            </div>
        `;

        return containerHtml;
    }

    renderPurchasedUpgrade(upgrade, index) {
        return `
            <div class="purchased-item">
                <div class="item-info">
                    <span class="item-name">${upgrade.actionName} → Quick Action</span>
                    <span class="item-details">${GameConstants.PRIMARY_TO_QUICK_COST}p</span>
                </div>
                <button class="btn-danger btn-small remove-upgrade" data-index="${index}">Remove</button>
            </div>
        `;
    }

    renderActionOption(action, character, pointInfo) {
        const canAfford = pointInfo.remaining >= GameConstants.PRIMARY_TO_QUICK_COST;
        const alreadyPurchased = character.mainPoolPurchases.primaryActionUpgrades.some(u => u.actionId === action.id);
        const canPurchase = canAfford && !alreadyPurchased;

        return `
            <div class="action-card ${canPurchase ? 'clickable' : 'disabled'}" data-action-id="${action.id}">
                <h5>${action.name}</h5>
                <p class="item-cost"><strong>Cost: ${GameConstants.PRIMARY_TO_QUICK_COST}p</strong></p>
                <p class="item-description">${action.description}</p>
                <div class="upgrade-effect">Upgrade: Use as Quick Action</div>
                ${alreadyPurchased ? 
                    '<div class="status-badge">Already Purchased</div>' : 
                    canAfford ? '<div class="status-badge success">Click to Purchase</div>' :
                    '<div class="status-badge error">Cannot Afford</div>'
                }
            </div>
        `;
    }

    setupEventListeners() {
        // Action card clicks
        document.querySelectorAll('.action-card.clickable').forEach(card => {
            card.addEventListener('click', () => {
                const actionId = card.dataset.actionId;
                this.purchaseActionUpgrade(actionId);
            });
        });

        // Remove upgrade buttons
        document.querySelectorAll('.remove-upgrade').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.removeUpgrade(index);
            });
        });
    }

    purchaseActionUpgrade(actionId) {
        const character = this.builder.currentCharacter;
        
        try {
            // Use system to handle purchase
            ActionSystem.purchaseActionUpgrade(character, actionId);
            
            this.builder.updateCharacter();
            this.builder.showNotification(`Purchased action upgrade for ${GameConstants.PRIMARY_TO_QUICK_COST}p!`, 'success');
            
        } catch (error) {
            this.builder.showNotification(`Failed to purchase upgrade: ${error.message}`, 'error');
        }
    }

    removeUpgrade(index) {
        const character = this.builder.currentCharacter;
        
        try {
            if (index >= 0 && index < character.mainPoolPurchases.primaryActionUpgrades.length) {
                const upgrade = character.mainPoolPurchases.primaryActionUpgrades[index];
                character.mainPoolPurchases.primaryActionUpgrades.splice(index, 1);
                
                this.builder.updateCharacter();
                this.builder.showNotification(`Removed ${upgrade.actionName} upgrade`, 'info');
            }
        } catch (error) {
            this.builder.showNotification(`Failed to remove upgrade: ${error.message}`, 'error');
        }
    }
}