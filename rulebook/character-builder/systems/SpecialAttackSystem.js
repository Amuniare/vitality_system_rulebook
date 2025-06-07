// SpecialAttackSystem.js - Special attack creation and management
import { GameConstants } from '../core/GameConstants.js';
import { TierSystem } from '../core/TierSystem.js';
import { ArchetypeSystem } from './ArchetypeSystem.js';
import { gameDataManager } from '../core/GameDataManager.js';

export class SpecialAttackSystem {
    // Create a new special attack
    static createSpecialAttack(character, name = null) {
        const validation = this.validateCanCreateAttack(character);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const attack = {
            id: Date.now().toString() + Math.random(),
            name: name || `Special Attack ${character.specialAttacks.length + 1}`,
            description: "",
            
            // Attack configuration
            attackTypes: [], // melee_ac, melee_dg_cn, ranged, direct, area
            effectTypes: [], // damage, condition, hybrid
            isHybrid: false,
            
            // Limits system (per-attack)
            limits: [],
            limitPointsTotal: 0,
            upgradePointsFromLimits: 0,
            upgradePointsFromArchetype: 0,
            upgradePointsAvailable: 0,
            upgradePointsSpent: 0,
            
            // Purchased upgrades
            upgrades: [],
            
            // Conditions
            basicConditions: [],
            advancedConditions: [],
            
            // Special properties
            properties: {
                range: null,
                area: null,
                requirements: [],
                restrictions: []
            },
            
            // Archetype-specific data
            archetypeData: {}
        };
        
        // Calculate initial points based on archetype
        this.recalculateAttackPoints(character, attack);
        
        return attack;
    }
    
    // Validate if character can create another special attack
    static validateCanCreateAttack(character) {
        const errors = [];
        const warnings = [];
        
        const archetype = character.archetypes.specialAttack;
        
        // Check archetype restrictions
        if (archetype === 'basic') {
            errors.push('Basic archetype cannot create special attacks');
        }
        
        if (archetype === 'oneTrick' && character.specialAttacks.length >= 1) {
            errors.push('One Trick archetype allows only one special attack');
        }
        
        if (archetype === 'dualNatured' && character.specialAttacks.length >= 2) {
            errors.push('Dual-Natured archetype allows only two special attacks');
        }
        
        // Check build order
        if (!character.buildState.mainPoolComplete) {
            warnings.push('Consider completing main pool purchases before creating special attacks');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    // Add a limit to a specific attack
    static addLimitToAttack(character, attackIndex, limitId) {
        const attack = character.specialAttacks[attackIndex];
        if (!attack) {
            throw new Error('Attack not found');
        }
        
        const validation = this.validateLimitSelection(character, attack, limitId);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const limitData = this.getLimitById(limitId);
        if (!limitData) {
            throw new Error('Limit not found');
        }
        
        // Calculate actual point cost (handle "Variable" costs)
        let actualCost = limitData.cost;
        if (typeof actualCost === 'string' && actualCost.toLowerCase() === 'variable') {
            actualCost = 0; // Default to 0 for variable costs, would need UI input
        }
        
        // Add the limit
        attack.limits.push({
            id: limitData.id,
            points: actualCost,
            category: limitData.category,
            name: limitData.name,
            description: limitData.description,
            type: limitData.type,
            parent: limitData.parent || null,
            originalCost: limitData.cost // Keep original for reference
        });
        
        // Recalculate points
        this.recalculateAttackPoints(character, attack);
        
        return attack;
    }
    
    
    // Recalculate attack points from limits and archetype
    static recalculateAttackPoints(character, attack) {
        const archetype = character.archetypes.specialAttack;
        const pointMethod = ArchetypeSystem.getSpecialAttackPointMethod(character);
        
        // Calculate limit points total from the sum of selected limits
        attack.limitPointsTotal = attack.limits.reduce((total, limit) => total + (Number(limit.points) || 0), 0);
        
        // Calculate upgrade points from limits (if applicable) using the corrected logic
        if (pointMethod.method === 'limits') {
            const calculationResult = TierSystem.calculateLimitScaling(attack.limitPointsTotal, character.tier, archetype);
            attack.upgradePointsFromLimits = calculationResult.finalPoints;
        } else {
            attack.upgradePointsFromLimits = 0;
        }
        
        // Calculate upgrade points from archetype (for fixed-point archetypes)
        if (pointMethod.method === 'fixed') {
            attack.upgradePointsFromArchetype = pointMethod.points;
        } else {
            attack.upgradePointsFromArchetype = 0;
        }
        
        // Total available points is the sum of points from limits and archetype
        attack.upgradePointsAvailable = attack.upgradePointsFromLimits + attack.upgradePointsFromArchetype;
        
        // Ensure spent doesn't exceed available (can be enhanced later)
        if (attack.upgradePointsSpent > attack.upgradePointsAvailable) {
            // Placeholder for handling over-budget scenarios
            console.warn(`Attack "${attack.name}" is over budget. Spent: ${attack.upgradePointsSpent}, Available: ${attack.upgradePointsAvailable}`);
        }
    }
    
    // Remove upgrades when over budget
    static removeExcessUpgrades(attack) {
        while (attack.upgradePointsSpent > attack.upgradePointsAvailable && attack.upgrades.length > 0) {
            const removedUpgrade = attack.upgrades.pop();
            // Subtract the cost (would need upgrade cost lookup)
            // attack.upgradePointsSpent -= getUpgradeCost(removedUpgrade);
        }
    }
    
    // Add upgrade to attack
    static addUpgradeToAttack(character, attackIndex, upgradeId) {
        const attack = character.specialAttacks[attackIndex];
        if (!attack) {
            throw new Error('Attack not found');
        }
        
        const upgradeData = this.getUpgradeById(upgradeId);
        if (!upgradeData) {
            throw new Error('Upgrade not found');
        }
        
        const validation = this.validateUpgradeAddition(character, attack, upgradeData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        // Handle variable costs (e.g., "20 per tier")
        let actualCost = upgradeData.cost;
        if (typeof actualCost === 'string') {
            if (actualCost.includes('per tier')) {
                const baseAmount = parseInt(actualCost.match(/\d+/)[0]);
                actualCost = baseAmount * character.tier;
            } else {
                actualCost = parseInt(actualCost) || 0;
            }
        }
        
        // Add the upgrade
        attack.upgrades.push({
            id: upgradeData.id,
            name: upgradeData.name,
            cost: actualCost,
            category: upgradeData.category,
            subcategory: upgradeData.subcategory,
            effect: upgradeData.effect,
            restriction: upgradeData.restriction,
            exclusion: upgradeData.exclusion,
            originalCost: upgradeData.cost
        });
        
        attack.upgradePointsSpent += actualCost;
        
        return attack;
    }
    
    // Validate adding an upgrade
    static validateUpgradeAddition(character, attack, upgradeData) {
        const errors = [];
        const warnings = [];
        
        // Check if can afford
        const remainingPoints = attack.upgradePointsAvailable - attack.upgradePointsSpent;
        if (upgradeData.cost > remainingPoints) {
            errors.push(`Insufficient upgrade points (need ${upgradeData.cost}, have ${remainingPoints})`);
        }
        
        // Check for duplicate upgrades
        if (attack.upgrades.some(upgrade => upgrade.id === upgradeData.id)) {
            errors.push('Upgrade already applied to this attack');
        }
        
        // Check for banned combinations
        const conflicts = this.checkUpgradeConflicts(attack, upgradeData);
        errors.push(...conflicts.errors);
        warnings.push(...conflicts.warnings);
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    // Check for upgrade conflicts
    static checkUpgradeConflicts(attack, newUpgrade) {
        const errors = [];
        const warnings = [];
        
        // Check banned combinations from GameConstants
        const existingUpgradeIds = attack.upgrades.map(u => u.id);
        
        GameConstants.BANNED_UPGRADE_COMBINATIONS.forEach(bannedCombo => {
            if (bannedCombo.includes(newUpgrade.id)) {
                const conflictingUpgrades = bannedCombo.filter(id => 
                    id !== newUpgrade.id && existingUpgradeIds.includes(id)
                );
                
                if (conflictingUpgrades.length > 0) {
                    errors.push(`${newUpgrade.name} conflicts with: ${conflictingUpgrades.join(', ')}`);
                }
            }
        });
        
        return { errors, warnings };
    }
    
    // Remove upgrade from attack
    static removeUpgradeFromAttack(character, attackIndex, upgradeId) {
        const attack = character.specialAttacks[attackIndex];
        if (!attack) {
            throw new Error('Attack not found');
        }
        
        const upgradeIndex = attack.upgrades.findIndex(u => u.id === upgradeId);
        if (upgradeIndex === -1) {
            throw new Error('Upgrade not found');
        }
        
        const upgrade = attack.upgrades[upgradeIndex];
        attack.upgrades.splice(upgradeIndex, 1);
        attack.upgradePointsSpent -= upgrade.cost;
        
        return attack;
    }
    
    // Delete entire special attack
    static deleteSpecialAttack(character, attackIndex) {
        if (attackIndex < 0 || attackIndex >= character.specialAttacks.length) {
            throw new Error('Invalid attack index');
        }
        
        character.specialAttacks.splice(attackIndex, 1);
        
        // Renumber remaining attacks
        character.specialAttacks.forEach((attack, index) => {
            if (!attack.name || attack.name.startsWith('Special Attack')) {
                attack.name = `Special Attack ${index + 1}`;
            }
        });
    }
    
    // Get attack type costs for purchase
    static getAttackTypeCosts() {
        return GameConstants.ATTACK_TYPE_COSTS;
    }
    
    // Get available attack types (free from archetype + purchasable)
    static getAvailableAttackTypes(character) {
        const freeTypes = ArchetypeSystem.getFreeAttackTypes(character);
        const allTypes = ['melee_ac', 'melee_dg_cn', 'ranged', 'direct', 'area'];
        
        return allTypes.map(type => ({
            id: type,
            name: type.charAt(0).toUpperCase() + type.slice(1),
            cost: freeTypes.includes(type) ? 0 : GameConstants.ATTACK_TYPE_COSTS[type],
            isFree: freeTypes.includes(type)
        }));
    }
    
    // Calculate total special attack budget across all attacks
    static calculateTotalSpecialAttackBudget(character) {
        let totalBudget = 0;
        let totalSpent = 0;
        
        character.specialAttacks.forEach(attack => {
            totalBudget += attack.upgradePointsAvailable;
            totalSpent += attack.upgradePointsSpent;
        });
        
        return {
            total: totalBudget,
            spent: totalSpent,
            remaining: totalBudget - totalSpent
        };
    }
    
    // Get attack summary for display
    static getAttackSummary(attack) {
        return {
            name: attack.name,
            attackTypes: attack.attackTypes,
            effectTypes: attack.effectTypes,
            limitCount: attack.limits.length,
            limitPoints: attack.limitPointsTotal,
            upgradeCount: attack.upgrades.length,
            pointsUsed: `${attack.upgradePointsSpent}/${attack.upgradePointsAvailable}`,
            isComplete: this.isAttackComplete(attack)
        };
    }
    
    // Check if attack is complete
    static isAttackComplete(attack) {
        return attack.name.trim() !== '' && 
               attack.attackTypes.length > 0 &&
               (attack.effectTypes.length > 0 || attack.upgrades.length > 0);
    }

    // Get available limits from limits.json
    static getAvailableLimits() {
        const limitsData = gameDataManager.getLimits();
        const limits = [];

        Object.entries(limitsData).forEach(([mainCategory, categoryData]) => {
            // Add main category
            limits.push({
                id: mainCategory,
                category: mainCategory,
                name: mainCategory,
                description: categoryData.description,
                cost: categoryData.cost,
                type: 'main'
            });

            // Add variants
            if (categoryData.variants) {
                Object.entries(categoryData.variants).forEach(([variantName, variantData]) => {
                    limits.push({
                        id: `${mainCategory}_${variantName}`,
                        category: mainCategory,
                        name: variantName,
                        description: variantData.description,
                        cost: variantData.cost,
                        type: 'variant',
                        parent: mainCategory
                    });

                    // Add modifiers
                    if (variantData.modifiers) {
                        Object.entries(variantData.modifiers).forEach(([modifierName, modifierData]) => {
                            limits.push({
                                id: `${mainCategory}_${variantName}_${modifierName}`,
                                category: mainCategory,
                                name: modifierName,
                                description: modifierData.description,
                                cost: modifierData.cost,
                                type: 'modifier',
                                parent: `${mainCategory}_${variantName}`
                            });
                        });
                    }
                });
            }
        });

        return limits;
    }

    // Get limit by ID
    static getLimitById(limitId) {
        const limits = this.getAvailableLimits();
        return limits.find(limit => limit.id === limitId);
    }

    // Get limits by category
    static getLimitsByCategory(category) {
        const limits = this.getAvailableLimits();
        return limits.filter(limit => limit.category === category);
    }

    // Validate limit selection based on rules
    static validateLimitSelection(character, attack, limitId) {
        const limit = this.getLimitById(limitId);
        if (!limit) {
            return { isValid: false, errors: ['Limit not found'] };
        }

        const errors = [];
        const warnings = [];

        // Check archetype restrictions
        const archetype = character.archetypes.specialAttack;
        const noLimitsArchetypes = ['paragon', 'oneTrick', 'dualNatured', 'basic'];
        if (noLimitsArchetypes.includes(archetype)) {
            errors.push(`${archetype} archetype cannot use limits`);
        }

        // Check for duplicate limits
        if (attack.limits.some(existingLimit => existingLimit.id === limitId)) {
            errors.push('Limit already applied to this attack');
        }

        // Check for conflicting limits within same category
        const existingCategoryLimits = attack.limits.filter(l => l.category === limit.category);
        if (existingCategoryLimits.length > 0 && limit.type === 'main') {
            errors.push(`Cannot add main ${limit.category} limit when variants already exist`);
        }

        // Check parent-child relationships
        if (limit.type === 'variant') {
            const hasMainCategory = attack.limits.some(l => l.id === limit.category);
            if (!hasMainCategory) {
                errors.push(`Must add main ${limit.category} limit before adding variants`);
            }
        }

        if (limit.type === 'modifier') {
            const hasParentVariant = attack.limits.some(l => l.id === limit.parent);
            if (!hasParentVariant) {
                errors.push(`Must add ${limit.parent} limit before adding modifiers`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Remove limit from attack (handles cascading removals)
    static removeLimitFromAttack(character, attackIndex, limitId) {
        const attack = character.specialAttacks[attackIndex];
        if (!attack) {
            throw new Error('Attack not found');
        }
        
        const limitIndex = attack.limits.findIndex(l => l.id === limitId);
        if (limitIndex === -1) {
            throw new Error('Limit not found');
        }
        
        const limitToRemove = attack.limits[limitIndex];
        
        // Remove dependent limits first (modifiers and variants)
        const dependentLimits = attack.limits.filter(l => 
            l.parent === limitId || 
            (limitToRemove.type === 'main' && l.category === limitToRemove.category && l.id !== limitId)
        );
        
        // Remove dependents in reverse order (deepest first)
        dependentLimits.forEach(dependent => {
            const depIndex = attack.limits.findIndex(l => l.id === dependent.id);
            if (depIndex !== -1) {
                attack.limits.splice(depIndex, 1);
            }
        });
        
        // Remove the main limit
        const finalIndex = attack.limits.findIndex(l => l.id === limitId);
        if (finalIndex !== -1) {
            attack.limits.splice(finalIndex, 1);
        }
        
        // Recalculate points
        this.recalculateAttackPoints(character, attack);
        
        return attack;
    }

    // Get available upgrades from upgrades.json
    static getAvailableUpgrades() {
        const upgradesData = gameDataManager.getUpgrades();
        const upgrades = [];

        if (upgradesData.Upgrades) {
            Object.entries(upgradesData.Upgrades).forEach(([mainCategory, categoryData]) => {
                // Handle nested structure (e.g., "Damage Bonuses" -> "Core Damage Modifiers")
                if (Array.isArray(categoryData)) {
                    // Direct array of upgrades
                    categoryData.forEach(upgrade => {
                        upgrades.push({
                            ...upgrade,
                            id: `${mainCategory}_${upgrade.name}`.replace(/\s+/g, '_'),
                            category: mainCategory,
                            subcategory: null
                        });
                    });
                } else {
                    // Nested subcategories
                    Object.entries(categoryData).forEach(([subCategory, subData]) => {
                        if (Array.isArray(subData)) {
                            subData.forEach(upgrade => {
                                upgrades.push({
                                    ...upgrade,
                                    id: `${mainCategory}_${subCategory}_${upgrade.name}`.replace(/\s+/g, '_'),
                                    category: mainCategory,
                                    subcategory: subCategory
                                });
                            });
                        }
                    });
                }
            });
        }

        return upgrades;
    }

    // Get upgrades by category
    static getUpgradesByCategory(category) {
        const upgrades = this.getAvailableUpgrades();
        return upgrades.filter(upgrade => upgrade.category === category);
    }

    // Get upgrade by ID
    static getUpgradeById(upgradeId) {
        const upgrades = this.getAvailableUpgrades();
        return upgrades.find(upgrade => upgrade.id === upgradeId);
    }

    // Get all upgrade categories
    static getUpgradeCategories() {
        const upgrades = this.getAvailableUpgrades();
        const categories = new Set();
        upgrades.forEach(upgrade => categories.add(upgrade.category));
        return Array.from(categories);
    }

    // Check if archetype can use limits
    static canArchetypeUseLimits(character) {
        const archetype = character.archetypes.specialAttack;
        const noLimitsArchetypes = ['paragon', 'oneTrick', 'dualNatured', 'basic'];
        return !noLimitsArchetypes.includes(archetype);
    }

    // Calculate limit to upgrade points with proper scaling
    static calculateLimitToUpgradePoints(character, attack) {
        const limitPointsTotal = attack.limits?.reduce((total, limit) => total + (Number(limit.points) || 0), 0) || 0;
        const tier = character.tier;
        const archetype = character.archetypes.specialAttack;
        
        // Use TierSystem for proper calculation
        const calculationResult = TierSystem.calculateLimitScaling(limitPointsTotal, tier, archetype);
        
        return {
            totalValue: calculationResult.scaledPoints,
            finalPoints: calculationResult.finalPoints
        };
    }
}