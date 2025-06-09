// rulebook/character-builder/systems/ActionSystem.js
import { PointPoolCalculator } from '../calculators/PointPoolCalculator.js';
import { GameConstants } from '../core/GameConstants.js';
import { gameDataManager } from '../core/GameDataManager.js'; // ADDED

export class ActionSystem {
    // Get all available primary actions
    static getAvailableActions() {
        return gameDataManager.getActions() || []; // MODIFIED
    }

    // Validate action upgrade purchase
    static validateActionUpgrade(character, actionId) {
        const errors = [];
        const warnings = [];

        const action = (gameDataManager.getActions() || []).find(a => a.id === actionId); // MODIFIED
        if (!action) {
            errors.push(`Invalid action: ${actionId}`);
            return { isValid: false, errors, warnings };
        }

        // Check if already purchased
        if (character.mainPoolPurchases.primaryActionUpgrades.some(u => u.actionId === actionId)) {
            errors.push('Action upgrade already purchased');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Purchase action upgrade
    static purchaseActionUpgrade(character, actionId) {
        const validation = this.validateActionUpgrade(character, actionId);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const action = (gameDataManager.getActions() || []).find(a => a.id === actionId); // MODIFIED

        const upgrade = {
            actionId: actionId,
            actionName: action.name,
            cost: GameConstants.PRIMARY_TO_QUICK_COST,
            purchased: new Date().toISOString()
        };

        character.mainPoolPurchases.primaryActionUpgrades.push(upgrade);
        return character;
    }

    // Remove action upgrade
    static removeActionUpgrade(character, actionId) {
        const index = character.mainPoolPurchases.primaryActionUpgrades.findIndex(u => u.actionId === actionId);
        if (index === -1) {
            throw new Error('Action upgrade not found');
        }

        character.mainPoolPurchases.primaryActionUpgrades.splice(index, 1);
        return character;
    }

    // Get action upgrade summary
    static getActionUpgradeSummary(character) {
        return character.mainPoolPurchases.primaryActionUpgrades.map(upgrade => ({
            actionId: upgrade.actionId,
            actionName: upgrade.actionName,
            cost: upgrade.cost,
            purchased: upgrade.purchased
        }));
    }
}