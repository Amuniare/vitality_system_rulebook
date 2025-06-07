// rulebook/character-builder/systems/SpecialAttackSystem.js
import { GameConstants } from '../core/GameConstants.js';
import { TierSystem } from '../core/TierSystem.js';
import { ArchetypeSystem } from './ArchetypeSystem.js';
import { gameDataManager } from '../core/GameDataManager.js';

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

    // NEW HELPER: Centralize cost calculation
    static _getActualUpgradeCost(upgradeData, character) {
        if (!upgradeData) return 0;
        let actualCost = upgradeData.cost;
        if (typeof actualCost === 'string') {
            if (actualCost.includes('per tier')) {
                const baseAmount = parseInt(actualCost.match(/\d+/)[0] || '0');
                actualCost = baseAmount * (character.tier || 1);
            } else {
                actualCost = parseInt(actualCost) || 0;
            }
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
            originalCost: upgradeData.cost
        });
        
        attack.upgradePointsSpent += actualCost;
        return attack;
    }
    
    // Validate adding an upgrade (MODIFIED to use helper)
    static validateUpgradeAddition(character, attack, upgradeData) {
        const errors = [];
        const warnings = [];
        
        const actualCost = this._getActualUpgradeCost(upgradeData, character);
        const remainingPoints = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);

        if (actualCost > remainingPoints) {
            errors.push(`Insufficient points (need ${actualCost}, have ${remainingPoints})`);
        }
        
        if (attack.upgrades.some(upgrade => upgrade.id === upgradeData.id)) {
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
}