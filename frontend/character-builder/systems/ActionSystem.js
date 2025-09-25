// frontend/character-builder/systems/ActionSystem.js
import { gameDataManager } from '../core/GameDataManager.js';

export class ActionSystem {
    // Get all available action upgrades as a flat list
    static getAvailableActionUpgrades() {
        return gameDataManager.getActions() || [];
    }

    // Get the number of free Quick Action selections for Versatile Master
    static getVersatileMasterSlots(character) {
        if (character.archetypes.uniqueAbility === 'versatileMaster') {
            // The rule is "half your Tier rounded up"
            return Math.ceil((character.tier || 0) / 2);
        }
        return 0;
    }

    // Validate if an upgrade can be purchased or selected
    static validateActionUpgrade(character, upgradeId) {
        const errors = [];
        const upgrade = this.getAvailableActionUpgrades().find(u => u.id === upgradeId);
        if (!upgrade) {
            errors.push(`Invalid action upgrade: ${upgradeId}`);
            return { isValid: false, errors };
        }

        // Check if already owned (either as a free selection or a paid purchase)
        const isAlreadyOwnedAsFree = upgrade.isQuickActionUpgrade && character.versatileMasterSelections?.includes(upgrade.baseActionId);
        const isAlreadyPurchased = character.mainPoolPurchases.primaryActionUpgrades.some(p => p.id === upgrade.id);

        if (isAlreadyOwnedAsFree) {
            errors.push('Already selected for free by Versatile Master.');
        } else if (isAlreadyPurchased) {
            errors.push('Upgrade already purchased.');
        }

        return { isValid: errors.length === 0, errors };
    }

    // Purchase an action upgrade
    static purchaseActionUpgrade(character, upgradeId) {
        const validation = this.validateActionUpgrade(character, upgradeId);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const upgrade = this.getAvailableActionUpgrades().find(u => u.id === upgradeId);
        if (!upgrade) throw new Error('Upgrade definition not found.');

        // Handle Versatile Master logic for free Quick Action upgrades
        if (upgrade.isQuickActionUpgrade && character.archetypes.uniqueAbility === 'versatileMaster') {
            const totalSlots = this.getVersatileMasterSlots(character);
            const usedSlots = character.versatileMasterSelections.length;

            if (usedSlots < totalSlots) {
                // This is a free selection
                character.versatileMasterSelections.push(upgrade.baseActionId);
                return character; // No points spent, no item added to purchases
            }
        }
        
        // If not a free selection, it's a paid purchase
        const purchaseRecord = {
            id: upgrade.id,
            name: upgrade.name,
            cost: upgrade.cost,
            isQuickActionUpgrade: upgrade.isQuickActionUpgrade,
            baseActionId: upgrade.baseActionId,
            purchasedAt: new Date().toISOString()
        };
        character.mainPoolPurchases.primaryActionUpgrades.push(purchaseRecord);
        
        return character;
    }

    // Remove an action upgrade
    static removeActionUpgrade(character, upgradeId) {
        const upgrade = this.getAvailableActionUpgrades().find(u => u.id === upgradeId);
        if (!upgrade) throw new Error('Upgrade definition not found.');

        // If it was a free selection from Versatile Master
        if (upgrade.isQuickActionUpgrade && character.versatileMasterSelections?.includes(upgrade.baseActionId)) {
            character.versatileMasterSelections = character.versatileMasterSelections.filter(id => id !== upgrade.baseActionId);
            return character;
        }

        // If it was a paid purchase
        const index = character.mainPoolPurchases.primaryActionUpgrades.findIndex(u => u.id === upgradeId);
        if (index > -1) {
            character.mainPoolPurchases.primaryActionUpgrades.splice(index, 1);
            return character;
        }

        throw new Error('Action upgrade not found on character.');
    }
}