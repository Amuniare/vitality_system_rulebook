// PointPoolCalculator.js - Calculate all point pools and spending
import { GameConstants } from '../core/GameConstants.js';
import { TierSystem } from '../core/TierSystem.js';

export class PointPoolCalculator {
    // Calculate all point pools for a character
    static calculateAllPools(character) {
        const tier = character.tier;
        const archetypes = character.archetypes;
        
        const pools = {
            // Base pools
            combatAttributes: this.calculateCombatAttributePool(tier),
            utilityAttributes: this.calculateUtilityAttributePool(tier),
            mainPool: this.calculateMainPool(tier, archetypes.uniqueAbility),
            utilityPool: this.calculateUtilityPool(tier, archetypes.utility),
            
            // Special attack pools (calculated per attack)
            specialAttackPools: this.calculateSpecialAttackPools(character),
            
            // Flaw bonuses
            flawBonuses: this.calculateFlawBonuses(character),
            
            // Total available
            totalAvailable: {},
            totalSpent: {},
            remaining: {}
        };
        
        // Calculate totals
        pools.totalAvailable = {
            combatAttributes: pools.combatAttributes,
            utilityAttributes: pools.utilityAttributes,
            mainPool: pools.mainPool + pools.flawBonuses,
            utilityPool: pools.utilityPool,
            specialAttacks: pools.specialAttackPools.totalAvailable
        };
        
        pools.totalSpent = this.calculateTotalSpent(character);
        
        pools.remaining = {
            combatAttributes: pools.totalAvailable.combatAttributes - pools.totalSpent.combatAttributes,
            utilityAttributes: pools.totalAvailable.utilityAttributes - pools.totalSpent.utilityAttributes,
            mainPool: pools.totalAvailable.mainPool - pools.totalSpent.mainPool,
            utilityPool: pools.totalAvailable.utilityPool - pools.totalSpent.utilityPool,
            specialAttacks: pools.totalAvailable.specialAttacks - pools.totalSpent.specialAttacks
        };
        
        return pools;
    }
    
    // Combat attribute pool calculation
    static calculateCombatAttributePool(tier) {
        return tier * GameConstants.COMBAT_ATTRIBUTES_MULTIPLIER;
    }
    
    // Utility attribute pool calculation
    static calculateUtilityAttributePool(tier) {
        return tier * GameConstants.UTILITY_ATTRIBUTES_MULTIPLIER;
    }
    
    // Main pool calculation with archetype bonuses
    static calculateMainPool(tier, uniqueAbilityArchetype) {
        let basePool = Math.max(0, (tier - GameConstants.MAIN_POOL_BASE_TIER) * GameConstants.MAIN_POOL_MULTIPLIER);
        
        // Extraordinary archetype doubles main pool
        if (uniqueAbilityArchetype === 'extraordinary') {
            basePool += Math.max(0, (tier - GameConstants.MAIN_POOL_BASE_TIER) * GameConstants.MAIN_POOL_MULTIPLIER);
        }
        
        return basePool;
    }
    
    // Utility pool calculation based on archetype
    static calculateUtilityPool(tier, utilityArchetype) {
        switch(utilityArchetype) {
            case 'specialized':
            case 'jackOfAllTrades':
                return Math.max(0, GameConstants.UTILITY_POOL_MULTIPLIER * (tier - GameConstants.UTILITY_POOL_SPECIALIZED_BASE));
            case 'practical':
            default:
                return Math.max(0, GameConstants.UTILITY_POOL_MULTIPLIER * (tier - GameConstants.UTILITY_POOL_PRACTICAL_BASE));
        }
    }
    
    // Calculate special attack pools for all attacks
    static calculateSpecialAttackPools(character) {
        const tier = character.tier;
        const archetype = character.archetypes.specialAttack;
        
        let totalAvailable = 0;
        const attackPools = [];
        
        character.specialAttacks.forEach((attack, index) => {
            const pool = this.calculateSingleAttackPool(character, attack, index);
            attackPools.push(pool);
            totalAvailable += pool.available;
        });
        
        return {
            totalAvailable,
            attackPools,
            archetype,
            method: this.getPoolCalculationMethod(archetype)
        };
    }
    
    // Calculate pool for a single special attack
    static calculateSingleAttackPool(character, attack, attackIndex) {
        const tier = character.tier;
        const archetype = character.archetypes.specialAttack;
        
        let available = 0;
        let fromLimits = 0;
        let fromArchetype = 0;
        let method = 'none';
        
        switch(archetype) {
            case 'normal':
                fromLimits = this.calculateLimitPoints(attack.limitPointsTotal || 0, tier);
                available = Math.floor(fromLimits * (tier / 6));
                method = 'limits_scaled';
                break;
                
            case 'specialist':
                fromLimits = this.calculateLimitPoints(attack.limitPointsTotal || 0, tier);
                available = Math.floor(fromLimits * (tier / 3));
                method = 'limits_scaled';
                break;
                
            case 'straightforward':
                fromLimits = this.calculateLimitPoints(attack.limitPointsTotal || 0, tier);
                available = Math.floor(fromLimits * (tier / 2));
                method = 'limits_scaled';
                break;
                
            case 'paragon':
                fromArchetype = tier * 10;
                available = fromArchetype;
                method = 'fixed_archetype';
                break;
                
            case 'oneTrick':
                fromArchetype = tier * 20;
                available = fromArchetype;
                method = 'fixed_archetype';
                break;
                
            case 'dualNatured':
                fromArchetype = tier * 15;
                available = fromArchetype;
                method = 'fixed_archetype';
                break;
                
            case 'basic':
                fromArchetype = tier * 10;
                available = fromArchetype;
                method = 'base_attack_only';
                break;
                
            case 'sharedUses':
                fromLimits = this.calculateLimitPoints(attack.limitPointsTotal || 0, tier);
                available = fromLimits; // No multiplier for shared uses
                method = 'shared_resource';
                break;
                
            default:
                method = 'none';
                break;
        }
        
        return {
            attackIndex,
            attackName: attack.name,
            available,
            spent: attack.upgradePointsSpent || 0,
            remaining: available - (attack.upgradePointsSpent || 0),
            fromLimits,
            fromArchetype,
            method,
            limitPoints: attack.limitPointsTotal || 0
        };
    }
    
    // Calculate upgrade points from limit points using scaling formula
    static calculateLimitPoints(limitPoints, tier) {
        return TierSystem.calculateLimitScaling(limitPoints, tier);
    }
    
    // Get the calculation method description for an archetype
    static getPoolCalculationMethod(archetype) {
        const methods = {
            normal: 'Limits × (Tier ÷ 6)',
            specialist: 'Limits × (Tier ÷ 3)',
            straightforward: 'Limits × (Tier ÷ 2)',
            paragon: 'Fixed: Tier × 10 per attack',
            oneTrick: 'Fixed: Tier × 20 for single attack',
            dualNatured: 'Fixed: Tier × 15 per attack (max 2)',
            basic: 'Fixed: Tier × 10 for base attack enhancement',
            sharedUses: 'Limits with 10 shared uses'
        };
        
        return methods[archetype] || 'Unknown method';
    }
    
    // Calculate flaw bonuses to main pool
    static calculateFlawBonuses(character) {
        return character.mainPoolPurchases.flaws.length * GameConstants.FLAW_BONUS;
    }
    
    // Calculate total points spent across all categories
    static calculateTotalSpent(character) {
        return {
            combatAttributes: this.calculateCombatAttributesSpent(character),
            utilityAttributes: this.calculateUtilityAttributesSpent(character),
            mainPool: this.calculateMainPoolSpent(character),
            utilityPool: this.calculateUtilityPoolSpent(character),
            specialAttacks: this.calculateSpecialAttacksSpent(character)
        };
    }
    
    // Calculate combat attributes spent
    static calculateCombatAttributesSpent(character) {
        const combatAttributes = ['focus', 'mobility', 'power', 'endurance'];
        return combatAttributes.reduce((total, attr) => total + (character.attributes[attr] || 0), 0);
    }
    
    // Calculate utility attributes spent
    static calculateUtilityAttributesSpent(character) {
        const utilityAttributes = ['awareness', 'communication', 'intelligence'];
        return utilityAttributes.reduce((total, attr) => total + (character.attributes[attr] || 0), 0);
    }
    
    // Calculate main pool spent
    static calculateMainPoolSpent(character) {
        let spent = 0;
        
        // Boons
        spent += character.mainPoolPurchases.boons.reduce((total, boon) => total + (boon.cost || 0), 0);
        
        // Traits
        spent += character.mainPoolPurchases.traits.reduce((total, trait) => total + (trait.cost || 0), 0);
        
        // Primary action upgrades
        spent += character.mainPoolPurchases.primaryActionUpgrades.length * GameConstants.PRIMARY_TO_QUICK_COST;
        
        return spent;
    }
    
    // Calculate utility pool spent
    static calculateUtilityPoolSpent(character) {
        let spent = 0;
        
        // Expertise
        Object.values(character.utilityPurchases.expertise).forEach(category => {
            spent += category.basic.length * GameConstants.EXPERTISE_ACTIVITY_BASIC;
            spent += category.mastered.length * GameConstants.EXPERTISE_ACTIVITY_MASTERED;
        });
        
        // Features, senses, movement, descriptors
        // These would need to be calculated based on their individual costs
        // For now, simplified calculation
        spent += character.utilityPurchases.features.length * 3; // Average cost
        spent += character.utilityPurchases.senses.length * 3; // Average cost
        spent += character.utilityPurchases.movement.length * 7; // Average cost
        spent += character.utilityPurchases.descriptors.length * 7; // Average cost
        
        return spent;
    }
    
    // Calculate special attacks spent
    static calculateSpecialAttacksSpent(character) {
        return character.specialAttacks.reduce((total, attack) => total + (attack.upgradePointsSpent || 0), 0);
    }
    
    // Check if character is over budget in any category
    static validatePointSpending(character) {
        const pools = this.calculateAllPools(character);
        const errors = [];
        const warnings = [];
        
        // Check each pool for overspending
        Object.entries(pools.remaining).forEach(([pool, remaining]) => {
            if (remaining < 0) {
                errors.push(`${pool} over budget by ${Math.abs(remaining)} points`);
            } else if (remaining === 0) {
                warnings.push(`${pool} fully spent`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            pools
        };
    }
    
    // Get point efficiency metrics
    static calculateEfficiencyMetrics(character) {
        const pools = this.calculateAllPools(character);
        
        const totalAvailable = Object.values(pools.totalAvailable).reduce((sum, val) => sum + val, 0);
        const totalSpent = Object.values(pools.totalSpent).reduce((sum, val) => sum + val, 0);
        const totalRemaining = Object.values(pools.remaining).reduce((sum, val) => sum + val, 0);
        
        return {
            totalAvailable,
            totalSpent,
            totalRemaining,
            utilizationRate: totalAvailable > 0 ? (totalSpent / totalAvailable) * 100 : 0,
            efficiency: {
                combat: pools.totalSpent.combatAttributes / pools.totalAvailable.combatAttributes * 100,
                utility: pools.totalSpent.utilityAttributes / pools.totalAvailable.utilityAttributes * 100,
                mainPool: pools.totalSpent.mainPool / pools.totalAvailable.mainPool * 100,
                utilityPool: pools.totalSpent.utilityPool / pools.totalAvailable.utilityPool * 100,
                specialAttacks: pools.totalSpent.specialAttacks / pools.totalAvailable.specialAttacks * 100
            }
        };
    }
    
    // Get recommendations for point spending
    static getSpendingRecommendations(character) {
        const pools = this.calculateAllPools(character);
        const recommendations = [];
        
        // Check for unspent points
        Object.entries(pools.remaining).forEach(([pool, remaining]) => {
            if (remaining > 0) {
                recommendations.push({
                    type: 'unspent',
                    pool,
                    amount: remaining,
                    message: `${remaining} unspent points in ${pool}`
                });
            }
        });
        
        // Check for archetype synergy
        const archetypes = character.archetypes;
        if (archetypes.attackType === 'singleTarget' && character.attributes.focus < character.tier / 2) {
            recommendations.push({
                type: 'synergy',
                message: 'Consider higher Focus for Single Target archetype'
            });
        }
        
        if (archetypes.effectType === 'crowdControl' && character.attributes.power < character.tier / 2) {
            recommendations.push({
                type: 'synergy',
                message: 'Consider higher Power for Crowd Control archetype'
            });
        }
        
        return recommendations;
    }
}