
// frontend/character-builder/features/main-pool/components/ActionUpgradeSection.js
import { ActionSystem } from '../../../systems/ActionSystem.js';
import { PointPoolCalculator } from '../../../calculators/PointPoolCalculator.js';
import { RenderUtils } from '../../../shared/utils/RenderUtils.js';

export class ActionUpgradeSection {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
    }

    render(character, pointInfo) {
        const availableUpgrades = ActionSystem.getAvailableActionUpgrades();
        const totalVMSlots = ActionSystem.getVersatileMasterSlots(character);
        const usedVMSlots = character.versatileMasterSelections?.length || 0;
        
        let versatileMasterInfo = '';
        if (totalVMSlots > 0) {
            versatileMasterInfo = `
                <div class="archetype-info-box">
                    <strong>Versatile Master:</strong> You have ${totalVMSlots - usedVMSlots} of ${totalVMSlots} free Quick Action selections remaining.
                </div>
            `;
        }

        const containerHtml = `
            <div class="main-pool-category">
                <h3>Available Action Upgrades</h3>
                <p class="category-description">
                    Purchase upgrades to enhance your character's standard actions. Some actions can be converted to Quick Actions, while others gain entirely new effects.
                </p>
                ${versatileMasterInfo}
                ${RenderUtils.renderGrid(
                    availableUpgrades,
                    (upgrade) => this.renderActionUpgradeCard(upgrade, character, pointInfo),
                    { gridContainerClass: 'grid-layout action-upgrade-grid', gridSpecificClass: 'grid-columns-auto-fit-320' }
                )}
            </div>
        `;
        return containerHtml;
    }

    _getActionCardState(upgrade, character) {
        const totalVMSlots = ActionSystem.getVersatileMasterSlots(character);
        const ownedVMSlots = character.versatileMasterSelections || [];
        const freeVMSlotsRemaining = totalVMSlots - ownedVMSlots.length;

        const isQuickAction = upgrade.isQuickActionUpgrade;
        const isOwnedAsFree = isQuickAction && ownedVMSlots.includes(upgrade.baseActionId);
        const isOwnedAsPaid = character.mainPoolPurchases.primaryActionUpgrades.some(p => p.id === upgrade.id);
        const isOwned = isOwnedAsFree || isOwnedAsPaid;

        if (isOwned) {
            return {
                isOwned: true,
                cost: isOwnedAsFree ? 0 : upgrade.cost,
                statusText: 'Click to Remove',
                action: 'remove-action-upgrade'
            };
        }

        if (isQuickAction && freeVMSlotsRemaining > 0) {
            return {
                isOwned: false,
                cost: 0,
                statusText: 'Click to Select for Free',
                action: 'purchase-action-upgrade'
            };
        }

        return {
            isOwned: false,
            cost: upgrade.cost,
            statusText: 'Click to Purchase',
            action: 'purchase-action-upgrade'
        };
    }

    renderActionUpgradeCard(upgrade, character, pointInfo) {
        const state = this._getActionCardState(upgrade, character);

        const descriptionContent = `
            <div class="base-action-context">
                <strong>Base Action: ${upgrade.baseActionName}</strong>
                <p><small>${upgrade.baseActionDescription}</small></p>
            </div>
            <div class="upgrade-description">
                <strong>Upgrade Effect:</strong> ${upgrade.description}
            </div>
        `;

        const additionalContent = `
            ${descriptionContent}
            <div class="selection-indicator">${state.statusText}</div>
        `;

        return RenderUtils.renderCard({
            title: upgrade.name,
            cost: state.cost, // Pass numeric cost
            description: '', 
            clickable: true,
            selected: state.isOwned,
            dataAttributes: { 
                action: state.action,
                'upgrade-id': upgrade.id 
            },
            additionalContent: additionalContent
        }, { cardClass: 'action-upgrade-card', showCost: true });
    }
    
    purchaseActionUpgrade(upgradeId) {
        const character = this.builder.currentCharacter;
        const upgrade = ActionSystem.getAvailableActionUpgrades().find(u => u.id === upgradeId);
        if (!upgrade) {
            this.builder.showNotification('Upgrade not found.', 'error');
            return;
        }
        
        const state = this._getActionCardState(upgrade, character);
        if (state.cost > 0) { // Only check budget for paid items
            const pools = PointPoolCalculator.calculateAllPools(character);
            const remainingPoints = pools.remaining.mainPool;
            if (upgrade.cost > remainingPoints) {
                this.builder.showNotification("This purchase puts you over budget.", "warning");
            }
        }

        try {
            ActionSystem.purchaseActionUpgrade(character, upgradeId);
            this.builder.updateCharacter();
            this.builder.showNotification(`Acquired upgrade: ${upgrade.name}!`, 'success');
        } catch (error) {
            this.builder.showNotification(`Failed to acquire upgrade: ${error.message}`, 'error');
        }
    }

    removeUpgrade(upgradeId) {
        const character = this.builder.currentCharacter;
        const upgrade = ActionSystem.getAvailableActionUpgrades().find(u => u.id === upgradeId);
        if (!upgrade) {
            this.builder.showNotification('Upgrade not found.', 'error');
            return;
        }

        try {
            ActionSystem.removeActionUpgrade(character, upgradeId);
            this.builder.updateCharacter();
            this.builder.showNotification(`Removed upgrade: ${upgrade.name}`, 'info');
        } catch (error) {
            this.builder.showNotification(`Failed to remove upgrade: ${error.message}`, 'error');
        }
    }
}
