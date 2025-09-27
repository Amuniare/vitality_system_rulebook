// TierSystem.js - Tier progression and effects
import { GameConstants } from './GameConstants.js';

export class TierSystem {
    // Validate tier is within bounds
    static isValidTier(tier) {
        return tier >= GameConstants.TIER_MIN && tier <= GameConstants.TIER_MAX;
    }
    
    // Get tier description
    static getTierDescription(tier) {
        const descriptions = {
            0: "Untrained - Basic civilian capabilities",
            1: "Beginner - Just starting out",
            2: "Novice - Learning the basics",
            3: "Developing - Gaining experience",
            4: "Competent - Reliable performer",
            5: "Professional - Advanced expertise"
        };
        return descriptions[tier] || "Unknown";
    }
    
    // Calculate tier bonus to all actions using tier-to-tier bonus mapping
    static getTierBonus(tier) {
        if (!this.isValidTier(tier)) {
            return 0;
        }
        return GameConstants.LEVEL_BONUS_LOOKUP[tier] || 0;
    }
    
    // Calculate attribute maximums based on tier
    static getAttributeMaximum(tier) {
        return tier;
    }
    
    // Calculate point pools based on tier
    static calculatePointPools(tier) {
        if (!this.isValidTier(tier)) {
            throw new Error(`Invalid tier: ${tier}`);
        }
        
        return {
            combatAttributes: tier * GameConstants.COMBAT_ATTRIBUTES_MULTIPLIER,
            utilityAttributes: tier * GameConstants.UTILITY_ATTRIBUTES_MULTIPLIER,
            mainPool: Math.max(0, (tier - GameConstants.MAIN_POOL_BASE_TIER) * GameConstants.MAIN_POOL_MULTIPLIER),
            utilityPoolPractical: Math.max(0, GameConstants.UTILITY_POOL_MULTIPLIER * (tier - GameConstants.UTILITY_POOL_PRACTICAL_BASE)),
            utilityPoolSpecialized: Math.max(0, GameConstants.UTILITY_POOL_MULTIPLIER * (tier - GameConstants.UTILITY_POOL_SPECIALIZED_BASE))
        };
    }
    
    // Calculate base movement
    static calculateBaseMovement(tier, mobility) {
        return Math.max(
            mobility + GameConstants.BASE_MOVEMENT_BONUS,
            mobility + tier
        );
    }
    
    // Calculate base HP
    static calculateBaseHP(tier) {
        return GameConstants.BASE_HP;
    }
    
    // Calculate limit scaling points with archetype multiplier applied BEFORE diminishing buckets
    static calculateLimitScaling(limitPoints, tier, archetype = null) {
        const firstTierThreshold = tier * GameConstants.LIMIT_FIRST_TIER_MULTIPLIER;
        const secondTierThreshold = tier * GameConstants.LIMIT_SECOND_TIER_MULTIPLIER;

        // Step 1: Apply archetype scaling to get effective limit points
        let archetypeMultiplier = 1.0;
        if (archetype) {
            switch(archetype) {
                case 'normal':
                    archetypeMultiplier = tier / 6;
                    break;
                case 'specialist':
                    archetypeMultiplier = tier / 3;
                    break;
                case 'straightforward':
                    archetypeMultiplier = tier / 2;
                    break;
                case 'sharedUses':
                    archetypeMultiplier = 1.0; // No change for shared uses
                    break;
                default:
                    archetypeMultiplier = 0; // Archetypes that don't use limits
                    break;
            }
        }

        const scaledLimitPoints = limitPoints * archetypeMultiplier;

        // Step 2: Apply diminishing buckets to the scaled points
        const bucketRates = {
            first: GameConstants.LIMIT_FIRST_VALUE,    // 100%
            second: GameConstants.LIMIT_SECOND_VALUE,  // 50%  
            third: GameConstants.LIMIT_THIRD_VALUE     // 25%
        };

        let totalValue = 0;

        if (scaledLimitPoints <= firstTierThreshold) {
            totalValue = scaledLimitPoints * bucketRates.first;
        } else if (scaledLimitPoints <= firstTierThreshold + secondTierThreshold) {
            totalValue = (firstTierThreshold * bucketRates.first) +
                         ((scaledLimitPoints - firstTierThreshold) * bucketRates.second);
        } else {
            totalValue = (firstTierThreshold * bucketRates.first) +
                         (secondTierThreshold * bucketRates.second) +
                         ((scaledLimitPoints - firstTierThreshold - secondTierThreshold) * bucketRates.third);
        }

        // Round up to nearest 10 for the final points
        const finalPoints = Math.ceil(totalValue / 10) * 10;

        return {
            totalValue: totalValue, // The "before rounding" value
            finalPoints: finalPoints, // The final usable points
            scaledLimitPoints: scaledLimitPoints, // The effective limit points after archetype scaling
            archetypeMultiplier: archetypeMultiplier // The scaling factor used
        };
    }
    
    // Get archetype special attack points
    static getArchetypeSpecialAttackPoints(tier, archetype) {
        const multiplier = GameConstants.ARCHETYPE_MULTIPLIERS[archetype];
        
        if (!multiplier) {
            throw new Error(`Unknown special attack archetype: ${archetype}`);
        }
        
        if (typeof multiplier === 'number' && multiplier < 1) {
            // Fraction multipliers (normal, specialist, straightforward)
            return 0; // These use limits, not base points
        } else {
            // Fixed points (paragon, oneTrick, etc.)
            return tier * multiplier;
        }
    }
    
    // Check if tier change is valid
    static canChangeTierTo(currentTier, newTier) {
        if (!this.isValidTier(newTier)) {
            return { valid: false, reason: `Tier ${newTier} is outside valid range (${GameConstants.TIER_MIN}-${GameConstants.TIER_MAX})` };
        }
        
        // Allow any tier change during character creation
        return { valid: true };
    }
    
    // Get tier progression effects
    static getTierEffects(tier) {
        const tierBonus = this.getTierBonus(tier);
        return {
            bonusToAllActions: tierBonus,
            maxAttributeRank: tier,
            combatAttributePoints: tier * 2,
            utilityAttributePoints: tier,
            mainPoolPoints: tier,
            utilityPoolPoints: Math.max(0, 5 * (tier - 1)),
            baseHP: this.calculateBaseHP(tier),
            initiativeBonus: tierBonus
        };
    }
}