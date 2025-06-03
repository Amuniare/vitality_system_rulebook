// ActionSystem.js - Primary action upgrade management
import { GameConstants } from '../core/GameConstants.js';

export class ActionSystem {
    // Get all available primary actions
    static getAvailableActions() {
        return [
            { id: 'base_attack', name: 'Base Attack', description: 'Your basic attack action' },
            { id: 'dodge', name: 'Dodge Action', description: 'Add Tier to Avoidance for one turn' },
            { id: 'brace', name: 'Brace Action', description: 'Add Tier to Durability for one turn' },
            { id: 'fortify', name: 'Fortify Action', description: 'Add Tier to all Resistances for one turn' },
            { id: 'aim', name: 'Aim Action', description: 'Add Tier to next Accuracy Check' },
            { id: 'empower', name: 'Empower Action', description: 'Add Tier to next Damage Roll' },
            { id: 'refine', name: 'Refine Action', description: 'Add Tier to next Condition Check' },
            { id: 'assist', name: 'Assist Action', description: 'Give ally Tier bonus to their next roll' },
            { id: 'carry', name: 'Carry Action', description: 'Move character or heavy object' },
            { id: 'protect', name: 'Protect Action', description: 'Redirect attacks to yourself' },
            { id: 'use', name: 'Use Action', description: 'Interact with complex objects' },
            { id: 'hasten', name: 'Hasten Action', description: 'Move again at full speed' },
            { id: 'hide', name: 'Hide Action', description: 'Attempt to conceal yourself' },
            { id: 'prepare', name: 'Prepare Action', description: 'Delay action until trigger' }
        ];
    }

    // Validate action upgrade purchase
    static validateActionUpgrade(character, actionId) {
        const errors = [];
        const warnings = [];

        const action = this.getAvailableActions().find(a => a.id === actionId);
        if (!action) {
            errors.push(`Invalid action: ${actionId}`);
            return { isValid: false, errors, warnings };
        }

        // Check if already purchased
        if (character.mainPoolPurchases.primaryActionUpgrades.some(u => u.actionId === actionId)) {
            errors.push('Action upgrade already purchased');
        }

        // Check point cost
        const availablePoints = this.calculateAvailableMainPoolPoints(character);
        if (GameConstants.PRIMARY_TO_QUICK_COST > availablePoints) {
            errors.push(`Insufficient main pool points (need ${GameConstants.PRIMARY_TO_QUICK_COST}, have ${availablePoints})`);
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

        const action = this.getAvailableActions().find(a => a.id === actionId);

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

    // Calculate available main pool points
    static calculateAvailableMainPoolPoints(character) {
        const tier = character.tier;
        let basePool = Math.max(0, (tier - GameConstants.MAIN_POOL_BASE_TIER) * GameConstants.MAIN_POOL_MULTIPLIER);
        
        // Extraordinary archetype doubles main pool
        if (character.archetypes.uniqueAbility === 'extraordinary') {
            basePool += Math.max(0, (tier - GameConstants.MAIN_POOL_BASE_TIER) * GameConstants.MAIN_POOL_MULTIPLIER);
        }
        
        // Add flaw bonuses
        const flawBonus = character.mainPoolPurchases.flaws.length * GameConstants.FLAW_BONUS;
        const totalAvailable = basePool + flawBonus;

        // Calculate spent
        const spentOnTraits = character.mainPoolPurchases.traits.reduce((total, trait) => total + (trait.cost || GameConstants.TRAIT_COST), 0);
        const spentOnBoons = character.mainPoolPurchases.boons.reduce((total, boon) => total + (boon.cost || 0), 0);
        const spentOnUpgrades = character.mainPoolPurchases.primaryActionUpgrades.length * GameConstants.PRIMARY_TO_QUICK_COST;

        const totalSpent = spentOnTraits + spentOnBoons + spentOnUpgrades;
        return totalAvailable - totalSpent;
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