// UniqueAbilitySystem.js - REFACTORED to use PointPoolCalculator and gameDataManager
import { PointPoolCalculator } from '../calculators/PointPoolCalculator.js';
import { GameConstants } from '../core/GameConstants.js';
import { gameDataManager } from '../core/GameDataManager.js'; // ADDED

export class UniqueAbilitySystem {
    // Get complex unique abilities (multi-stage purchases with upgrades)
    static getComplexUniqueAbilities() {
        return gameDataManager.getComplexUniqueAbilities() || []; // MODIFIED
    }
    
    // Individual getXyzUpgrades() methods are REMOVED as upgrades are nested in the JSON.

    // Validate unique ability purchase
    static validateUniqueAbilityPurchase(character, abilityId, upgrades = []) {
        const errors = [];
        const warnings = [];
        
        const ability = (gameDataManager.getComplexUniqueAbilities() || []).find(a => a.id === abilityId); // MODIFIED
        if (!ability) {
            errors.push(`Invalid unique ability: ${abilityId}`);
            return { isValid: false, errors, warnings };
        }
        
        // Check if already purchased
        if (character.mainPoolPurchases.boons.some(b => b.boonId === abilityId && b.type === 'unique')) {
            errors.push('Unique ability already purchased');
        }
        
        // Use unified point pool calculator
        const pools = PointPoolCalculator.calculateAllPools(character);
        const availablePoints = pools.remaining.mainPool;
        
        const totalCost = this.calculateUniqueAbilityTotalCost(ability, upgrades);
        
        if (totalCost > availablePoints) {
            errors.push(`Insufficient main pool points (need ${totalCost}, have ${availablePoints})`);
        }
        
        // Check upgrade validity
        if (upgrades.length > 0) {
            const upgradeValidation = this.validateUniqueAbilityUpgrades(ability, upgrades);
            errors.push(...upgradeValidation.errors);
            warnings.push(...upgradeValidation.warnings);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Calculate total cost including upgrades
    static calculateUniqueAbilityTotalCost(ability, upgrades = []) {
        if (!ability) return 0; // Should not happen if ability is validated first
        let totalCost = ability.baseCost;
        
        if (upgrades.length > 0 && ability.upgrades) {
            upgrades.forEach(upgradeSelection => {
                const upgradeDef = ability.upgrades.find(u => u.id === upgradeSelection.id);
                if (upgradeDef) {
                    if (upgradeDef.per) {
                        totalCost += upgradeDef.cost * (upgradeSelection.quantity || 1);
                    } else {
                        totalCost += upgradeDef.cost;
                    }
                }
            });
        }
        
        return totalCost;
    }

    // Validate upgrades for unique ability
    static validateUniqueAbilityUpgrades(ability, upgrades) {
        const errors = [];
        const warnings = [];
        
        if (!ability || !ability.upgrades) { // Added check for ability itself
            if (upgrades.length > 0) {
                errors.push('This ability does not support upgrades or ability definition is missing.');
            }
            return { errors, warnings };
        }
        
        upgrades.forEach(upgradeSelection => {
            const upgradeDef = ability.upgrades.find(u => u.id === upgradeSelection.id);
            if (!upgradeDef) {
                errors.push(`Invalid upgrade ID: ${upgradeSelection.id} for ability ${ability.name}`);
                return;
            }
            
            // Check requirements
            if (upgradeDef.requires && !upgrades.some(u => u.id === upgradeDef.requires)) {
                const requiredUpgradeDef = ability.upgrades.find(u => u.id === upgradeDef.requires);
                errors.push(`${upgradeDef.name} requires ${requiredUpgradeDef ? requiredUpgradeDef.name : upgradeDef.requires}`);
            }
            
            // Check quantity for per-purchase upgrades
            if (upgradeDef.per && (!upgradeSelection.quantity || upgradeSelection.quantity < 1)) {
                errors.push(`${upgradeDef.name} requires quantity specification (at least 1)`);
            }
        });
        
        return { errors, warnings };
    }

    // Purchase unique ability
    static purchaseUniqueAbility(character, abilityId, upgrades = []) {
        const validation = this.validateUniqueAbilityPurchase(character, abilityId, upgrades);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const ability = (gameDataManager.getComplexUniqueAbilities() || []).find(a => a.id === abilityId); // MODIFIED
        if (!ability) throw new Error(`Unique ability definition for ${abilityId} not found.`);

        const totalCost = this.calculateUniqueAbilityTotalCost(ability, upgrades);
        
        character.mainPoolPurchases.boons.push({
            boonId: abilityId,
            name: ability.name,
            cost: totalCost,
            category: ability.category,
            type: 'unique', // Mark as complex/unique
            baseCost: ability.baseCost,
            upgrades: upgrades, // Store selected upgrades
            purchased: new Date().toISOString()
        });
        
        return character;
    }

    // Remove unique ability
    static removeUniqueAbility(character, abilityId) {
        const index = character.mainPoolPurchases.boons.findIndex(b => b.boonId === abilityId && b.type === 'unique');
        if (index === -1) {
            throw new Error('Unique ability not found');
        }
        
        character.mainPoolPurchases.boons.splice(index, 1);
        return character;
    }
}