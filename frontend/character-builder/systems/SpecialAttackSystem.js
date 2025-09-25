// frontend/character-builder/systems/SpecialAttackSystem.js
import { GameConstants } from '../core/GameConstants.js';
import { TierSystem } from '../core/TierSystem.js';
import { ArchetypeSystem } from './ArchetypeSystem.js';
import { AttackTypeSystem } from './AttackTypeSystem.js';
import { gameDataManager } from '../core/GameDataManager.js';
import { IdGenerator } from '../shared/utils/IdGenerator.js';

export class SpecialAttackSystem {
    // Create a new special attack
    static createSpecialAttack(character, name = null) {
        if (!character) {
            throw new Error('Character is required to create special attack');
        }
        
        const validation = this.validateCanCreateAttack(character);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const attack = {
            id: IdGenerator.generateId(),
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
        
        if (!character) {
            errors.push('No character provided');
            return { isValid: false, errors, warnings };
        }
        
        if (!character.archetypes) {
            errors.push('Character has no archetypes defined');
            return { isValid: false, errors, warnings };
        }
        
        const archetype = character.archetypes.specialAttack;
        
        // Check archetype restrictions

        
        if (archetype === 'oneTrick' && character.specialAttacks.length >= 1) {
            errors.push('One Trick archetype allows only one special attack');
        }
        
        if (archetype === 'dualNatured' && character.specialAttacks.length >= 2) {
            errors.push('Dual-Natured archetype allows only two special attacks');
        }
        
        // Check build order
        if (!character.buildState?.mainPoolComplete) {
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
        
        let actualCost = limitData.cost;
        if (typeof actualCost === 'string' && actualCost.toLowerCase() === 'variable') {
            actualCost = 0;
        }
        
        attack.limits.push({
            id: limitData.id,
            points: actualCost,
            category: limitData.category,
            name: limitData.name,
            description: limitData.description,
            type: limitData.type,
            parent: limitData.parent || null,
            originalCost: limitData.cost
        });
        
        this.recalculateAttackPoints(character, attack);
        return attack;
    }
    
    static recalculateAttackPoints(character, attack) {
        const archetype = character.archetypes.specialAttack;
        const pointMethod = ArchetypeSystem.getSpecialAttackPointMethod(character);
        
        attack.limitPointsTotal = attack.limits.reduce((total, limit) => total + (Number(limit.points) || 0), 0);
        
        // Handle SharedUses archetype with resource-cost model
        if (archetype === 'sharedUses') {
            attack.upgradePointsFromLimits = 0; // SharedUses doesn't use limits
            attack.upgradePointsFromArchetype = 0; // Reset archetype points
            
            // Calculate points based on use cost: tier * 5 * useCost
            if (attack.useCost && attack.useCost > 0) {
                attack.upgradePointsAvailable = character.tier * 5 * attack.useCost;
            } else {
                attack.upgradePointsAvailable = 0; // No points until use cost is selected
            }
        } else {
            // Original logic for all other archetypes
            if (pointMethod.method === 'limits') {
                const calculationResult = TierSystem.calculateLimitScaling(attack.limitPointsTotal, character.tier, archetype);
                attack.upgradePointsFromLimits = calculationResult.finalPoints;
            } else {
                attack.upgradePointsFromLimits = 0;
            }
            
            if (pointMethod.method === 'fixed') {
                attack.upgradePointsFromArchetype = pointMethod.points;
            } else {
                attack.upgradePointsFromArchetype = 0;
            }
            
            attack.upgradePointsAvailable = attack.upgradePointsFromLimits + attack.upgradePointsFromArchetype;
        }
        
        // Recalculate upgrade points spent based on actual upgrades and their specialty status
        this._recalculateUpgradePointsSpent(character, attack);
    }

    // Helper method to recalculate upgrade points spent
    static _recalculateUpgradePointsSpent(character, attack) {
        let totalSpent = 0;
        
        // 1. Explicit upgrade costs (already working)
        if (attack.upgrades) {
            for (const upgrade of attack.upgrades) {
                const upgradeData = this.getUpgradeById(upgrade.id);
                if (upgradeData) {
                    totalSpent += this._getActualUpgradeCost(upgradeData, character, upgrade.isSpecialty, upgrade);
                }
            }
        }
        
        // 2. Attack type and effect type costs (NEW - this is what was missing)
        totalSpent += AttackTypeSystem.calculateAttackTypeCosts(character, attack);
        
        
        attack.upgradePointsSpent = totalSpent;
    }

    // NEW HELPER: Centralize cost calculation
    static _getActualUpgradeCost(upgradeData, character, isSpecialty = false, purchasedUpgrade = null) {
        if (!upgradeData) return 0;
        let actualCost = upgradeData.cost;
        
        if (typeof actualCost === 'string') {
            if (actualCost.includes('per tier')) {
                const baseAmount = parseInt(actualCost.match(/\d+/)[0] || '0');
                actualCost = baseAmount * (character.tier || 1);
            } else if (actualCost === 'variable') {
                // For variable cost upgrades, use the stored cost or default to 0
                actualCost = purchasedUpgrade?.cost || 0;
            } else {
                actualCost = parseInt(actualCost) || 0;
            }
        }
        
        // Apply specialty discount (half cost, rounded down)
        if (isSpecialty) {
            actualCost = Math.floor(actualCost / 2);
        }
        
        return actualCost;
    }
    
    // Add upgrade to attack (MODIFIED to use helper)
    static addUpgradeToAttack(character, attackIndex, upgradeId) {
        const attack = character.specialAttacks[attackIndex];
        if (!attack) throw new Error('Attack not found');
        
        const upgradeData = this.getUpgradeById(upgradeId);
        if (!upgradeData) throw new Error('Upgrade not found');
        
        const validation = this.validateUpgradeAddition(character, attack, upgradeData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const actualCost = this._getActualUpgradeCost(upgradeData, character);
        
        attack.upgrades.push({
            id: upgradeData.id,
            name: upgradeData.name,
            cost: actualCost, // Use the calculated cost
            category: upgradeData.category,
            subcategory: upgradeData.subcategory,
            effect: upgradeData.effect,
            restriction: upgradeData.restriction,
            exclusion: upgradeData.exclusion,
            originalCost: upgradeData.cost,
            isSpecialty: false // Default to not specialty
        });
        
        // Recalculate points will be handled by recalculateAttackPoints
        this.recalculateAttackPoints(character, attack);
        return attack;
    }
    
    // Validate adding an upgrade (MODIFIED to use helper)
    static validateUpgradeAddition(character, attack, upgradeData) {
        const errors = [];
        const warnings = [];
        
        // Allow Enhanced Scale to be purchased multiple times
        if (upgradeData.name !== 'Enhanced Scale' && attack.upgrades.some(upgrade => upgrade.id === upgradeData.id)) {
            errors.push('Already purchased');
        }
        
        const conflicts = this.checkUpgradeConflicts(attack, upgradeData);
        if (conflicts.length > 0) {
            errors.push(`Conflicts with: ${conflicts.join(', ')}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    // Check for upgrade conflicts (MODIFIED to return a simple array of conflicting names)
    static checkUpgradeConflicts(attack, newUpgrade) {
        const allUpgrades = this.getAvailableUpgrades();
        const bannedData = gameDataManager.getUpgrades()?.bannedCombinations || [];
        const existingUpgradeIds = attack.upgrades.map(u => u.id);
        const conflictingNames = [];

        bannedData.forEach(bannedPair => {
            // Find the full upgrade objects to get their generated IDs
            const upgrade1 = allUpgrades.find(u => u.name === bannedPair[0]);
            const upgrade2 = allUpgrades.find(u => u.name === bannedPair[1]);

            if (upgrade1 && upgrade2) {
                const id1 = upgrade1.id;
                const id2 = upgrade2.id;

                if ((newUpgrade.id === id1 && existingUpgradeIds.includes(id2)) ||
                    (newUpgrade.id === id2 && existingUpgradeIds.includes(id1))) {
                        const conflictingUpgradeName = newUpgrade.id === id1 ? upgrade2.name : upgrade1.name;
                        conflictingNames.push(conflictingUpgradeName);
                }
            }
        });
        
        return conflictingNames;
    }
    
    // Remove upgrade from attack
    static removeUpgradeFromAttack(character, attackIndex, upgradeId) {
        const attack = character.specialAttacks[attackIndex];
        if (!attack) throw new Error('Attack not found');
        
        const upgradeIndex = attack.upgrades.findIndex(u => u.id === upgradeId);
        if (upgradeIndex === -1) throw new Error('Upgrade not found');
        
        attack.upgrades.splice(upgradeIndex, 1);
        
        // Recalculate points spent
        this.recalculateAttackPoints(character, attack);
        
        return attack;
    }
    
    // Delete entire special attack
    static deleteSpecialAttack(character, attackIndex) {
        if (attackIndex < 0 || attackIndex >= character.specialAttacks.length) {
            throw new Error('Invalid attack index');
        }
        
        character.specialAttacks.splice(attackIndex, 1);
        
        character.specialAttacks.forEach((attack, index) => {
            if (!attack.name || attack.name.startsWith('Special Attack')) {
                attack.name = `Special Attack ${index + 1}`;
            }
        });
    }
    
    // Get available limits from limits.json (returns hierarchical structure for UI)
    static getAvailableLimitsHierarchy() {
        return gameDataManager.getLimits();
    }

    // Get available limits as flat array for system logic
    static getAvailableLimits() {
        const hierarchicalData = this.getAvailableLimitsHierarchy();
        const flatLimits = [];
        
        Object.entries(hierarchicalData).forEach(([categoryKey, categoryData]) => {
            if (categoryData.cost !== undefined) {
                flatLimits.push({ id: categoryKey, name: categoryKey, ...categoryData, type: 'main', category: categoryKey });
            }
            if (categoryData.variants) {
                Object.entries(categoryData.variants).forEach(([variantKey, variantData]) => {
                    const variantId = `${categoryKey}_${variantKey}`;
                    flatLimits.push({ id: variantId, name: variantKey, ...variantData, type: 'variant', category: categoryKey, parent: categoryKey });
                    if (variantData.modifiers) {
                        Object.entries(variantData.modifiers).forEach(([modifierKey, modifierData]) => {
                            const modifierId = `${categoryKey}_${variantKey}_${modifierKey}`;
                            flatLimits.push({ id: modifierId, name: modifierKey, ...modifierData, type: 'modifier', category: categoryKey, parent: variantId });
                        });
                    }
                });
            }
        });
        return flatLimits;
    }

    // Get limit by ID
    static getLimitById(limitId) {
        return this.getAvailableLimits().find(limit => limit.id === limitId);
    }

    // Validate limit selection based on rules
    static validateLimitSelection(character, attack, limitId) {
        const limit = this.getLimitById(limitId);
        if (!limit) return { isValid: false, errors: ['Limit not found'] };

        const errors = [];
        if (!this.canArchetypeUseLimits(character)) {
            errors.push(`${character.archetypes.specialAttack} archetype cannot use limits`);
        }
        if (attack.limits.some(existing => existing.id === limitId)) {
            errors.push('Limit already applied');
        }
        if (limit.type === 'modifier' && !attack.limits.some(l => l.id === limit.parent)) {
            const parentVariant = this.getLimitById(limit.parent);
            errors.push(`Requires parent limit: ${parentVariant?.name || limit.parent}`);
        }
        
        return { isValid: errors.length === 0, errors, warnings: [] };
    }

    // Add custom limit to attack
    static addCustomLimitToAttack(character, attackIndex, limitData) {
        const attack = character.specialAttacks[attackIndex];
        if (!attack) {
            throw new Error('Attack not found');
        }
        
        const validation = this.validateCustomLimitData(limitData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        if (!this.canArchetypeUseLimits(character)) {
            throw new Error(`${character.archetypes.specialAttack} archetype cannot use limits`);
        }
        
        const customLimit = {
            id: `custom_${Date.now()}`,
            name: limitData.name,
            description: limitData.description,
            points: Number(limitData.points),
            isCustom: true,
            category: 'custom',
            type: 'custom'
        };
        
        attack.limits.push(customLimit);
        this.recalculateAttackPoints(character, attack);
        
        return attack;
    }
    
    // Validate custom limit data
    static validateCustomLimitData(limitData) {
        const errors = [];
        const warnings = [];
        
        if (!limitData) {
            errors.push('Limit data is required');
            return { isValid: false, errors, warnings };
        }
        
        if (!limitData.name || typeof limitData.name !== 'string' || limitData.name.trim() === '') {
            errors.push('Name is required and must be a non-empty string');
        }
        
        if (!limitData.description || typeof limitData.description !== 'string' || limitData.description.trim() === '') {
            errors.push('Description is required and must be a non-empty string');
        }
        
        const points = Number(limitData.points);
        if (isNaN(points) || points <= 0) {
            errors.push('Point value must be a positive number');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Remove limit from attack
    static removeLimitFromAttack(character, attackIndex, limitId) {
        const attack = character.specialAttacks[attackIndex];
        if (!attack) throw new Error('Attack not found');
        
        const limitToRemove = attack.limits.find(l => l.id === limitId);
        if (!limitToRemove) throw new Error('Limit not found on attack');
        
        const idsToRemove = [limitId];
        const findDependents = (parentId) => {
            attack.limits.forEach(l => {
                if (l.parent === parentId) {
                    idsToRemove.push(l.id);
                    findDependents(l.id);
                }
            });
        };
        findDependents(limitId);
        
        attack.limits = attack.limits.filter(l => !idsToRemove.includes(l.id));
        this.recalculateAttackPoints(character, attack);
        return attack;
    }

    // Get available upgrades from upgrades.json
    static getAvailableUpgrades() {
        const upgradesData = gameDataManager.getUpgrades();
        const upgrades = [];
        if (upgradesData && upgradesData.Upgrades) {
            Object.entries(upgradesData.Upgrades).forEach(([mainCategory, categoryData]) => {
                if (Array.isArray(categoryData)) {
                    categoryData.forEach(upgrade => {
                        upgrades.push({ ...upgrade, id: `${mainCategory}_${upgrade.name}`.replace(/\s+/g, '_'), category: mainCategory, subcategory: null });
                    });
                } else {
                    Object.entries(categoryData).forEach(([subCategory, subData]) => {
                        if (Array.isArray(subData)) {
                            subData.forEach(upgrade => {
                                upgrades.push({ ...upgrade, id: `${mainCategory}_${subCategory}_${upgrade.name}`.replace(/\s+/g, '_'), category: mainCategory, subcategory: subCategory });
                            });
                        }
                    });
                }
            });
        }
        return upgrades;
    }

    static getUpgradeById(upgradeId) {
        return this.getAvailableUpgrades().find(upgrade => upgrade.id === upgradeId);
    }
    
    static canArchetypeUseLimits(character) {
        if (!character || !character.archetypes) return false;
        const archetype = character.archetypes.specialAttack;
        const noLimitsArchetypes = ['paragon', 'oneTrick', 'dualNatured', 'basic'];
        return !noLimitsArchetypes.includes(archetype);
    }

    static toggleUpgradeSpecialty(character, attackIndex, upgradeId) {
        const attack = character.specialAttacks[attackIndex];
        if (!attack) {
            throw new Error('Attack not found');
        }

        const upgrade = attack.upgrades?.find(u => u.id === upgradeId);
        if (!upgrade) {
            throw new Error('Upgrade not found');
        }

        // Special handling for Enhanced Scale - toggle ALL instances
        if (upgrade.name === 'Enhanced Scale') {
            const newSpecialtyStatus = !upgrade.isSpecialty;
            attack.upgrades.forEach(u => {
                if (u.name === 'Enhanced Scale') {
                    u.isSpecialty = newSpecialtyStatus;
                }
            });
        } else {
            // Toggle the specialty status for regular upgrades
            upgrade.isSpecialty = !upgrade.isSpecialty;
        }

        // Recalculate points spent
        this.recalculateAttackPoints(character, attack);
        
        return character;
    }

    static addCustomUpgrade(character, attackIndex, upgradeData) {
        const attack = character.specialAttacks[attackIndex];
        if (!attack) {
            throw new Error('Attack not found');
        }

        // Validate the custom upgrade
        const validation = this.validateCustomUpgrade(character, attack, upgradeData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        // Add the custom upgrade to the attack
        if (!attack.upgrades) {
            attack.upgrades = [];
        }

        const upgrade = {
            ...upgradeData,
            purchased: new Date().toISOString()
        };

        attack.upgrades.push(upgrade);

        // Recalculate points
        this.recalculateAttackPoints(character, attack);

        return character;
    }

    static validateCustomUpgrade(character, attack, upgradeData) {
        const errors = [];
        const warnings = [];

        if (!upgradeData) {
            errors.push('Upgrade data is required');
            return { isValid: false, errors, warnings };
        }

        // Check if upgrade with same name already exists
        if (attack.upgrades?.some(u => u.name === upgradeData.name)) {
            errors.push('An upgrade with this name already exists on this attack');
        }

        // Basic validation
        if (!upgradeData.name || typeof upgradeData.name !== 'string' || upgradeData.name.trim() === '') {
            errors.push('Upgrade name is required');
        }

        if (!upgradeData.effect || typeof upgradeData.effect !== 'string' || upgradeData.effect.trim() === '') {
            errors.push('Upgrade effect is required');
        }

        const cost = Number(upgradeData.cost);
        if (isNaN(cost) || cost < 5) {
            errors.push('Upgrade cost must be at least 5 points');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}