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
        if (!ability) return 0;
        let totalCost = ability.baseCost;
        
        if (upgrades.length > 0) {
            upgrades.forEach(upgradeSelection => {
                if (ability.upgrades) {
                    const upgradeDef = ability.upgrades.find(u => u.id === upgradeSelection.id);
                    if (upgradeDef) {
                        if (upgradeDef.cost === "variable") {
                            // Variable cost upgrade - the quantity IS the cost
                            totalCost += upgradeSelection.quantity || 0;
                        } else if (upgradeDef.per) {
                            totalCost += upgradeDef.cost * (upgradeSelection.quantity || 1);
                        } else {
                            totalCost += upgradeDef.cost;
                        }
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
        
        upgrades.forEach(upgradeSelection => {
            // Handle standard upgrades only
            if (!ability || !ability.upgrades) {
                errors.push('This ability does not support standard upgrades or ability definition is missing.');
                return;
            }
            
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

    // Purchase custom unique ability
    static purchaseCustomUniqueAbility(character, abilityData) {
        const validation = this.validateCustomUniqueAbility(character, abilityData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        character.mainPoolPurchases.boons.push({
            boonId: abilityData.id,
            name: abilityData.name,
            cost: abilityData.cost,
            category: abilityData.category,
            type: 'unique',
            baseCost: abilityData.baseCost,
            description: abilityData.description,
            upgrades: [], // Custom abilities start with no upgrades
            isCustom: true, // Mark as custom
            purchased: new Date().toISOString()
        });
        
        return character;
    }

    // Validate custom unique ability data
    static validateCustomUniqueAbility(character, abilityData) {
        const errors = [];
        const warnings = [];
        
        if (!abilityData) {
            errors.push('Ability data is required');
            return { isValid: false, errors, warnings };
        }
        
        // Check if already purchased (by name for custom abilities)
        if (character.mainPoolPurchases.boons.some(b => b.name === abilityData.name && b.type === 'unique')) {
            errors.push('An ability with this name already exists');
        }
        
        if (!abilityData.name || typeof abilityData.name !== 'string' || abilityData.name.trim() === '') {
            errors.push('Ability name is required and must be a non-empty string');
        }
        
        if (abilityData.name && abilityData.name.length > 50) {
            errors.push('Ability name must be 50 characters or less');
        }
        
        if (!abilityData.description || typeof abilityData.description !== 'string' || abilityData.description.trim() === '') {
            errors.push('Ability description is required and must be a non-empty string');
        }
        
        if (abilityData.description && abilityData.description.length > 500) {
            errors.push('Ability description must be 500 characters or less');
        }
        
        const cost = Number(abilityData.baseCost || abilityData.cost);
        if (isNaN(cost) || cost < 5) {
            errors.push('Ability cost must be at least 5 points');
        }
        
        if (cost > 100) {
            errors.push('Ability cost cannot exceed 100 points');
        }
        
        if (!abilityData.category || typeof abilityData.category !== 'string') {
            errors.push('Ability category is required');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
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