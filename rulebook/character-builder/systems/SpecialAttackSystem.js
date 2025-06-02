// SpecialAttackSystem.js - Special attack creation and management
import { GameConstants } from '../core/GameConstants.js';
import { TierSystem } from '../core/TierSystem.js';
import { ArchetypeSystem } from './ArchetypeSystem.js';

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
            attackTypes: [], // melee, ranged, direct, area
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
    static addLimitToAttack(character, attackIndex, limitData) {
        const attack = character.specialAttacks[attackIndex];
        if (!attack) {
            throw new Error('Attack not found');
        }
        
        const validation = this.validateLimitAddition(character, attack, limitData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        // Add the limit
        attack.limits.push({
            id: limitData.id,
            points: limitData.points,
            category: limitData.category,
            name: limitData.name,
            description: limitData.description,
            restrictions: limitData.restrictions || []
        });
        
        // Recalculate points
        this.recalculateAttackPoints(character, attack);
        
        return attack;
    }
    
    // Validate adding a limit to an attack
    static validateLimitAddition(character, attack, limitData) {
        const errors = [];
        const warnings = [];
        
        const archetype = character.archetypes.specialAttack;
        
        // Check if archetype allows limits
        const noLimitsArchetypes = ['paragon', 'oneTrick', 'dualNatured', 'basic'];
        if (noLimitsArchetypes.includes(archetype)) {
            errors.push(`${archetype} archetype cannot use limits`);
        }
        
        // Check for duplicate limits
        if (attack.limits.some(limit => limit.id === limitData.id)) {
            errors.push('Limit already applied to this attack');
        }
        
        // Check behemoth conflicts
        if (character.archetypes.movement === 'behemoth') {
            if (limitData.restrictions && limitData.restrictions.includes('behemoth')) {
                errors.push('Behemoth archetype conflicts with this limit');
            }
        }
        
        // Check specialist archetype specific limits
        if (archetype === 'specialist') {
            // TODO: Implement specific limit requirements for specialist
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    // Recalculate attack points from limits and archetype
    static recalculateAttackPoints(character, attack) {
        const archetype = character.archetypes.specialAttack;
        const pointMethod = ArchetypeSystem.getSpecialAttackPointMethod(character);
        
        // Calculate limit points total
        attack.limitPointsTotal = attack.limits.reduce((total, limit) => total + limit.points, 0);
        
        // Calculate upgrade points from limits (if applicable)
        if (pointMethod.method === 'limits') {
            const scaledPoints = TierSystem.calculateLimitScaling(attack.limitPointsTotal, character.tier);
            attack.upgradePointsFromLimits = Math.floor(scaledPoints * pointMethod.multiplier);
        } else {
            attack.upgradePointsFromLimits = 0;
        }
        
        // Calculate upgrade points from archetype
        if (pointMethod.method === 'fixed') {
            attack.upgradePointsFromArchetype = pointMethod.points;
        } else {
            attack.upgradePointsFromArchetype = 0;
        }
        
        // Total available points
        attack.upgradePointsAvailable = attack.upgradePointsFromLimits + attack.upgradePointsFromArchetype;
        
        // Ensure spent doesn't exceed available
        if (attack.upgradePointsSpent > attack.upgradePointsAvailable) {
            // Remove upgrades until under budget
            this.removeExcessUpgrades(attack);
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
    static addUpgradeToAttack(character, attackIndex, upgradeData) {
        const attack = character.specialAttacks[attackIndex];
        if (!attack) {
            throw new Error('Attack not found');
        }
        
        const validation = this.validateUpgradeAddition(character, attack, upgradeData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        // Add the upgrade
        attack.upgrades.push({
            id: upgradeData.id,
            name: upgradeData.name,
            cost: upgradeData.cost,
            category: upgradeData.category,
            effect: upgradeData.effect
        });
        
        attack.upgradePointsSpent += upgradeData.cost;
        
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
        const allTypes = ['melee', 'ranged', 'direct', 'area'];
        
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
}