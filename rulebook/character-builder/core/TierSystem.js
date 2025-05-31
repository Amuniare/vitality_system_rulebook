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
            1: "Novice - Learning the basics",
            2: "Developing - Gaining experience", 
            3: "Competent - Reliable performer",
            4: "Professional - Starting expertise",
            5: "Veteran - Seasoned professional",
            6: "Expert - Highly skilled",
            7: "Elite - Top tier performer",
            8: "Master - Peak human ability",
            9: "Legendary - Beyond normal limits",
            10: "World-class Expert - Absolute pinnacle"
        };
        return descriptions[tier] || "Unknown";
    }
    
    // Calculate tier bonus to all actions
    static getTierBonus(tier) {
        return this.isValidTier(tier) ? tier : 0;
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
        return GameConstants.BASE_HP + (tier * 5);
    }
    
    // Calculate limit scaling points
    static calculateLimitScaling(limitPoints, tier) {
        const firstTier = tier * GameConstants.LIMIT_FIRST_TIER_MULTIPLIER;
        const secondTier = tier * GameConstants.LIMIT_SECOND_TIER_MULTIPLIER;
        
        let upgradePoints = 0;
        
        if (limitPoints <= firstTier) {
            upgradePoints = limitPoints * GameConstants.LIMIT_FIRST_VALUE;
        } else if (limitPoints <= firstTier + secondTier) {
            upgradePoints = firstTier + 
                           (limitPoints - firstTier) * GameConstants.LIMIT_SECOND_VALUE;
        } else {
            upgradePoints = firstTier + 
                           secondTier * GameConstants.LIMIT_SECOND_VALUE + 
                           (limitPoints - firstTier - secondTier) * GameConstants.LIMIT_THIRD_VALUE;
        }
        
        return Math.floor(upgradePoints);
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
        return {
            bonusToAllActions: tier,
            maxAttributeRank: tier,
            combatAttributePoints: tier * 2,
            utilityAttributePoints: tier,
            mainPoolPoints: Math.max(0, (tier - 2) * 15),
            utilityPoolPoints: Math.max(0, 5 * (tier - 1)),
            baseHP: this.calculateBaseHP(tier),
            initiativeBonus: tier
        };
    }
}