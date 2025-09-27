// frontend/character-builder/calculators/PointPoolCalculator.js - REFACTORED with caching and unified calculations
import { GameConstants } from '../core/GameConstants.js';
import { TierSystem } from '../core/TierSystem.js';
import { gameDataManager } from '../core/GameDataManager.js';

export class PointPoolCalculator {
    static cache = new Map();
    static lastCharacterHash = null;
    
    // Calculate all point pools for a character with caching
    static calculateAllPools(character) {
        const characterHash = this.getCharacterHash(character);
        
        // Return cached result if character hasn't changed
        if (this.lastCharacterHash === characterHash && this.cache.has('allPools')) {
            return this.cache.get('allPools');
        }
        
        console.log('🔄 Calculating point pools (cache miss)');

        const tier = character.tier;
        const level = character.level;
        const archetypes = character.archetypes;

        // Get the correct tier value from level data for attribute calculations
        const levels = gameDataManager.getTiers();
        const levelData = levels.levels?.[tier];
        const effectiveTier = levelData?.tierBonus || tier;

        const pools = {
            // Base pools
            combatAttributes: this.calculateCombatAttributePool(effectiveTier),
            utilityAttributes: this.calculateUtilityAttributePool(effectiveTier),
            mainPool: this.calculateMainPool(level, null), // uniqueAbility archetype removed
            utilityPool: this.calculateUtilityPool(effectiveTier, archetypes.utility),
            
            // Special attack pools (calculated per attack)
            specialAttackPools: this.calculateSpecialAttackPools(character),
            
            // Flaw bonuses - UPDATED FOR NEW ECONOMICS
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
        
        // Cache results
        this.cache.set('allPools', pools);
        this.lastCharacterHash = characterHash;
        
        return pools;
    }
    
    // UNIFIED: Main pool calculation (replaces duplicates in other systems)
    static calculateMainPoolAvailable(character) {
        const level = character.level;
        // Main pool points equal level directly (no formula)
        let available = level;

        // No archetype bonuses to main pool in new system

        return available;
    }
    
    // UNIFIED: Main pool spending calculation (replaces duplicates)
    static calculateMainPoolSpent(character) {
        let spent = 0;
        
        // Boons cost points
        spent += character.mainPoolPurchases.boons.reduce((sum, boon) => sum + (boon.cost || 0), 0);
        
        // Traits cost points
        spent += character.mainPoolPurchases.traits.reduce((sum, trait) => sum + (trait.cost || 0), 0);
        
        // NEW ECONOMICS: Flaws now COST points (major change)
        spent += character.mainPoolPurchases.flaws.reduce((sum, flaw) => sum + (flaw.cost || 30), 0);
        
        
        return spent;
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
    static calculateMainPool(level, uniqueAbilityArchetype) {
        // Main pool points equal level directly (no formula)
        let basePool = level;

        // No archetype bonuses in new system

        return basePool;
    }
    
    // Utility pool calculation based on the new universal formula
    static calculateUtilityPool(tier, utilityArchetype) {
        // The new rule is a universal formula: 5 * (Tier - 2)
        // This is independent of the selected utility archetype.
        // GameConstants.UTILITY_POOL_SPECIALIZED_BASE is 2, so we can use that.
        return Math.max(0, GameConstants.UTILITY_POOL_MULTIPLIER * (tier - GameConstants.UTILITY_POOL_SPECIALIZED_BASE));
    }
    
    // Calculate special attack pools for all attacks
    static calculateSpecialAttackPools(character) {
        const tier = character.tier;
        const archetype = character.archetypes.attack;
        
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
        const archetype = character.archetypes.attack;
        
        let available = 0;
        let fromLimits = 0;
        let fromArchetype = 0;
        let method = 'none';
        
        switch(archetype) {
            case 'normal':
            case 'specialist':
            case 'straightforward':
                const limitCalcResult = TierSystem.calculateLimitScaling(attack.limitPointsTotal || 0, tier, archetype);
                fromLimits = limitCalcResult.totalValue;
                available = limitCalcResult.finalPoints;
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
                const sharedCalcResult = TierSystem.calculateLimitScaling(attack.limitPointsTotal || 0, tier, archetype);
                fromLimits = sharedCalcResult.totalValue;
                available = sharedCalcResult.finalPoints;
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
    static calculateLimitPoints(limitPoints, tier, archetype = null) {
        const result = TierSystem.calculateLimitScaling(limitPoints, tier, archetype);
        return result.finalPoints;
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
    
    // NEW ECONOMICS: Flaw bonuses calculation (flaws now cost points but give stat bonuses)
    static calculateFlawBonuses(character) {
        // In new economics, flaws don't give point bonuses - they give stat bonuses instead
        // This method now returns 0 but we keep it for backwards compatibility
        return 0;
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
    
    // Calculate utility pool spent
    static calculateUtilityPoolSpent(character) {
        let spent = 0;

        // This method now only calculates spending for generic utility items,
        // as the old expertise system is being removed.
        ['features', 'senses', 'movement', 'descriptors'].forEach(categoryKey => {
            (character.utilityPurchases[categoryKey] || []).forEach(purchase => {
                spent += purchase.cost || 0;
            });
        });
        
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
    
    // CACHING UTILITIES
    
    // Generate hash for character to detect changes
    static getCharacterHash(character) {
        const relevantData = {
            tier: character.tier,
            archetypes: character.archetypes,
            attributes: character.attributes,
            mainPoolPurchases: character.mainPoolPurchases,
            specialAttacks: character.specialAttacks.map(attack => ({
                limitPointsTotal: attack.limitPointsTotal,
                upgradePointsSpent: attack.upgradePointsSpent
            })),
            utilityPurchases: character.utilityPurchases
        };
        
        return JSON.stringify(relevantData);
    }
    
    // Clear cache
    static clearCache() {
        this.cache.clear();
        this.lastCharacterHash = null;
        console.log('🗑️ Point pool cache cleared');
    }
    
    // Get incremental update for specific pool
    static updateSpecificPool(character, poolType) {
        switch(poolType) {
            case 'mainPool':
                return this.calculateMainPoolSpent(character);
            case 'combatAttributes':
                return this.calculateCombatAttributesSpent(character);
            case 'utilityAttributes':
                return this.calculateUtilityAttributesSpent(character);
            case 'specialAttacks':
                return this.calculateSpecialAttacksSpent(character);
            default:
                return this.calculateAllPools(character);
        }
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