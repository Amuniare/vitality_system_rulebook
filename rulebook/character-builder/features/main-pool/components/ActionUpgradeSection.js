// rulebook/character-builder/ui/components/ActionUpgradeSection.js
import { ActionSystem } from '../../../systems/ActionSystem.js';
import { GameConstants } from '../../../core/GameConstants.js';
import { RenderUtils } from '../../../shared/utils/RenderUtils.js';

export class ActionUpgradeSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render(character, pointInfo) {
        const availableActions = ActionSystem.getAvailableActions();
        const purchasedUpgrades = character.mainPoolPurchases.primaryActionUpgrades;

        const containerHtml = `
            <div class="main-pool-category">
                <h3>Available Primary Action Upgrades</h3>
                <p class="category-description">
                    Convert any Primary Action to a Quick Action (${GameConstants.PRIMARY_TO_QUICK_COST}p each). This allows you to perform the action
                    as part of your Quick Action instead of using your Primary Action.
                </p>

                ${RenderUtils.renderGrid(
                    availableActions,
                    (action) => this.renderActionOption(action, character, pointInfo),
                    { gridContainerClass: 'grid-layout action-grid', gridSpecificClass: 'grid-columns-auto-fit-250' }
                )}
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
                ${RenderUtils.renderButton({
                    text: 'Remove',
                    variant: 'danger',
                    size: 'small',
                    classes: ['remove-upgrade'], // Keep specific class if JS relies on it
                    dataAttributes: { index: index, action: 'remove-action-upgrade' } // Added data-action
                })}
            </div>
        `;
    }

    renderActionOption(action, character, pointInfo) {
        const alreadyPurchased = character.mainPoolPurchases.primaryActionUpgrades.some(u => u.actionId === action.id);
        const canAfford = pointInfo.remaining >= GameConstants.PRIMARY_TO_QUICK_COST;
        
        let status = 'available';
        if (alreadyPurchased) status = 'purchased';
        else if (!canAfford) status = 'unaffordable';

        return RenderUtils.renderCard({
            title: action.name,
            cost: GameConstants.PRIMARY_TO_QUICK_COST,
            description: action.description,
            status: status,
            clickable: !alreadyPurchased && canAfford,
            disabled: alreadyPurchased || !canAfford,
            dataAttributes: { 'action-id': action.id, action: 'purchase-action-upgrade' }, // Added data-action
            additionalContent: `<div class="upgrade-effect">Upgrade: Use as Quick Action</div>`
        }, { cardClass: 'action-card', showStatus: true }); // Ensure status text is shown via RenderUtils
    }


    setupEventListeners() {
        // EventManager will handle this based on data-action attributes
        // No specific querySelectors needed here if EventManager is used at a higher level (e.g., MainPoolTab)
        // If this section is rendered into a container that MainPoolTab then sets listeners on,
        // ensure data-action attributes are correctly used.
    }

    purchaseActionUpgrade(actionId) {
        const character = this.builder.currentCharacter;
        try {
            ActionSystem.purchaseActionUpgrade(character, actionId);
            this.builder.updateCharacter(); // This will trigger re-render via MainPoolTab/CharacterBuilder
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
                ActionSystem.removeActionUpgrade(character, upgrade.actionId); // Assuming system handles by ID
                this.builder.updateCharacter();
                this.builder.showNotification(`Removed ${upgrade.actionName} upgrade`, 'info');
            }
        } catch (error) {
            this.builder.showNotification(`Failed to remove upgrade: ${error.message}`, 'error');
        }
    }
}