// LimitCalculator.js - Limit point calculations and scaling
import { GameConstants } from '../core/GameConstants.js';
import { TierSystem } from '../core/TierSystem.js';

export class LimitCalculator {
    // Get all available limits by category
    static getAllLimits() {
        return {
            usage: [
                { id: 'oncePerSession', name: 'Once Per Session', points: 60, traitBonuses: 4, description: 'Can only be used once per gaming session' },
                { id: 'oncePerScene', name: 'Once Per Scene', points: 40, traitBonuses: 2, description: 'Can only be used once per combat or major scene' },
                { id: 'limitedUses', name: 'Limited Uses', points: 20, traitBonuses: 1, description: 'Can be used X times per session', variable: 'uses_per_session' },
                { id: 'cooldown', name: 'Cooldown', points: 15, traitBonuses: 1, description: 'Must wait X rounds between uses', variable: 'rounds_cooldown' }
            ],
            activation: [
                { id: 'requiresSetup', name: 'Requires Setup', points: 25, traitBonuses: 1, description: 'Must spend an action preparing before use' },
                { id: 'channeling', name: 'Channeling', points: 30, traitBonuses: 2, description: 'Must maintain concentration, can be interrupted' },
                { id: 'ritualCasting', name: 'Ritual Casting', points: 50, traitBonuses: 3, description: 'Takes 10 minutes to activate outside combat' }
            ],
            targeting: [
                { id: 'friendlyFire', name: 'Friendly Fire', points: 35, traitBonuses: 2, description: 'Cannot distinguish between allies and enemies' },
                { id: 'lineOfSight', name: 'Line of Sight', points: 15, traitBonuses: 1, description: 'Requires clear line of sight to target' },
                { id: 'touchRange', name: 'Touch Range', points: 20, traitBonuses: 1, description: 'Must be adjacent to target' }
            ],
            environmental: [
                { id: 'outdoorsOnly', name: 'Outdoors Only', points: 25, traitBonuses: 1, description: 'Cannot be used indoors or underground' },
                { id: 'waterRequired', name: 'Water Required', points: 30, traitBonuses: 2, description: 'Requires access to significant water source' },
                { id: 'specificTerrain', name: 'Specific Terrain', points: 35, traitBonuses: 2, description: 'Only works in chosen terrain type' }
            ],
            physical: [
                { id: 'exhausting', name: 'Exhausting', points: 20, traitBonuses: 1, description: 'Causes fatigue after use' },
                { id: 'selfDamage', name: 'Self Damage', points: 40, traitBonuses: 2, description: 'Deals damage to user when activated' },
                { id: 'immobilized', name: 'Immobilized', points: 25, traitBonuses: 1, description: 'Cannot move while effect is active', restrictions: ['behemoth'] }
            ],
            mental: [
                { id: 'emotionalTrigger', name: 'Emotional Trigger', points: 20, traitBonuses: 1, description: 'Only usable when experiencing strong emotion' },
                { id: 'berserk', name: 'Berserk', points: 45, traitBonuses: 3, description: 'Cannot distinguish friend from foe while active' },
                { id: 'concentration', name: 'Concentration', points: 30, traitBonuses: 2, description: 'Ends if you take damage or are distracted' }
            ]
        };
    }
    
    // Calculate upgrade points from limit points using the canonical TierSystem method
    static calculateUpgradePointsFromLimits(limitPoints, tier, archetype) {
        // This now returns an object { totalValue, finalPoints }
        return TierSystem.calculateLimitScaling(limitPoints, tier, archetype);
    }
    
    // Calculate trait bonuses from limits
    static calculateTraitBonuses(limits) {
        const allLimits = this.getAllLimits();
        let totalBonuses = 0;
        
        limits.forEach(limitSelection => {
            // Find the limit definition
            let limitDef = null;
            for (const category of Object.values(allLimits)) {
                limitDef = category.find(l => l.id === limitSelection.id);
                if (limitDef) break;
            }
            
            if (limitDef) {
                totalBonuses += limitDef.traitBonuses || 0;
            }
        });
        
        return Math.floor(totalBonuses / 2); // 2 trait bonuses per 15 limit points equivalent
    }
    
    // Validate limit selection for character/attack
    static validateLimitSelection(character, attack, limitId) {
        const errors = [];
        const warnings = [];
        
        // Find the limit definition
        const limitDef = this.findLimitById(limitId);
        if (!limitDef) {
            errors.push(`Invalid limit: ${limitId}`);
            return { isValid: false, errors, warnings };
        }
        
        // Check archetype restrictions
        const archetype = character.archetypes.specialAttack;
        const noLimitsArchetypes = ['paragon', 'oneTrick', 'dualNatured', 'basic'];
        
        if (noLimitsArchetypes.includes(archetype)) {
            errors.push(`${archetype} archetype cannot use limits`);
        }
        
        // Check if already applied
        if (attack.limits.some(limit => limit.id === limitId)) {
            errors.push('Limit already applied to this attack');
        }
        
        // Check restriction conflicts
        if (limitDef.restrictions) {
            const restrictionCheck = this.checkLimitRestrictions(character, limitDef);
            errors.push(...restrictionCheck.errors);
            warnings.push(...restrictionCheck.warnings);
        }
        
        // Check archetype-specific restrictions
        if (archetype === 'specialist') {
            // Specialist archetype has specific limit requirements
            warnings.push('Specialist archetype should use consistent limit types');
        }
        
        if (archetype === 'straightforward' && attack.limits.length >= 1) {
            errors.push('Straightforward archetype allows only one limit per attack');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    // Check limit restrictions against character
    static checkLimitRestrictions(character, limitDef) {
        const errors = [];
        const warnings = [];
        
        if (limitDef.restrictions) {
            limitDef.restrictions.forEach(restriction => {
                switch(restriction) {
                    case 'behemoth':
                        if (character.archetypes.movement === 'behemoth') {
                            errors.push(`${limitDef.name} conflicts with Behemoth movement archetype`);
                        }
                        break;
                    // Add other restriction checks as needed
                }
            });
        }
        
        return { errors, warnings };
    }
    
    // Find limit definition by ID
    static findLimitById(limitId) {
        const allLimits = this.getAllLimits();
        
        for (const category of Object.values(allLimits)) {
            const limit = category.find(l => l.id === limitId);
            if (limit) return limit;
        }
        
        return null;
    }
    
    // Calculate total limit points for an attack
    static calculateTotalLimitPoints(limits) {
        return limits.reduce((total, limitSelection) => {
            const limitDef = this.findLimitById(limitSelection.id);
            return total + (limitDef ? limitDef.points : 0);
        }, 0);
    }
    
    // Calculate complete limit-to-upgrade conversion
    static calculateCompleteConversion(character, attack) {
        const tier = character.tier;
        const archetype = character.archetypes.specialAttack;
        
        // Step 1: Calculate total limit points
        const totalLimitPoints = this.calculateTotalLimitPoints(attack.limits);
        
        // Step 2: Apply scaling formula with archetype multiplier built in
        const finalUpgradePoints = this.calculateUpgradePointsFromLimits(totalLimitPoints, tier, archetype);
        
        // Step 3: Calculate trait bonuses
        const traitBonuses = this.calculateTraitBonuses(attack.limits);
        
        return {
            totalLimitPoints,
            finalUpgradePoints,
            traitBonuses,
            archetype,
            tier,
            breakdown: this.getCalculationBreakdown(totalLimitPoints, tier, archetype)
        };
    }
    
    // Get detailed calculation breakdown for display
    static getCalculationBreakdown(limitPoints, tier, archetype) {
        const firstTierThreshold = tier * GameConstants.LIMIT_FIRST_TIER_MULTIPLIER;
        const secondTierThreshold = tier * GameConstants.LIMIT_SECOND_TIER_MULTIPLIER;

        const calculationResult = this.calculateUpgradePointsFromLimits(limitPoints, tier, archetype);
        const scaledLimitPoints = calculationResult.scaledLimitPoints;
        const archetypeMultiplier = calculationResult.archetypeMultiplier;
        const totalValue = calculationResult.totalValue;
        const finalPoints = calculationResult.finalPoints;

        const breakdown = {
            steps: [
                `1. Raw Limit Points: ${limitPoints}`,
                `2. Apply Archetype Scaling: ${limitPoints} × ${archetypeMultiplier.toFixed(2)} = ${scaledLimitPoints.toFixed(1)} effective points`,
                `3. Apply Diminishing Returns Buckets:`,
            ],
            totalValue: totalValue,
            finalPoints: finalPoints,
            scaledLimitPoints: scaledLimitPoints,
            archetypeMultiplier: archetypeMultiplier
        };

        let remainingPoints = scaledLimitPoints;
        let bucket1Points = 0, bucket2Points = 0, bucket3Points = 0;

        if (remainingPoints > 0) {
            bucket1Points = Math.min(remainingPoints, firstTierThreshold);
            breakdown.steps.push(`   • Bucket 1 (${firstTierThreshold} max): ${bucket1Points.toFixed(1)} × 100% = ${(bucket1Points * GameConstants.LIMIT_FIRST_VALUE).toFixed(1)}`);
            remainingPoints -= bucket1Points;
        }
        if (remainingPoints > 0) {
            bucket2Points = Math.min(remainingPoints, secondTierThreshold);
            breakdown.steps.push(`   • Bucket 2 (${secondTierThreshold} max): ${bucket2Points.toFixed(1)} × 50% = ${(bucket2Points * GameConstants.LIMIT_SECOND_VALUE).toFixed(1)}`);
            remainingPoints -= bucket2Points;
        }
        if (remainingPoints > 0) {
            bucket3Points = remainingPoints;
            breakdown.steps.push(`   • Bucket 3 (remainder): ${bucket3Points.toFixed(1)} × 25% = ${(bucket3Points * GameConstants.LIMIT_THIRD_VALUE).toFixed(1)}`);
        }
        
        breakdown.steps.push(`4. Sum and Round Up: ${totalValue.toFixed(1)} → ${finalPoints} Upgrade Points`);
        
        return breakdown;
    }
    
    // Get archetype multiplier value
    static getArchetypeMultiplier(tier, archetype) {
        switch(archetype) {
            case 'normal':
                return tier / 6;
            case 'specialist':
                return tier / 3;
            case 'straightforward':
                return tier / 2;
            case 'sharedUses':
                return 1.0;
            default:
                return 0;
        }
    }
    
    // Get limit recommendations based on character build
    static getLimitRecommendations(character, attack) {
        const recommendations = [];
        const archetype = character.archetypes.specialAttack;
        const tier = character.tier;
        
        // Archetype-specific recommendations
        switch(archetype) {
            case 'normal':
                recommendations.push({
                    category: 'general',
                    message: 'Normal archetype benefits from diverse limit combinations',
                    suggested: ['usage', 'targeting', 'activation']
                });
                break;
                
            case 'specialist':
                recommendations.push({
                    category: 'archetype',
                    message: 'Specialist should focus on 3 specific limit types',
                    suggested: ['usage', 'physical', 'mental']
                });
                break;
                
            case 'straightforward':
                recommendations.push({
                    category: 'archetype',
                    message: 'Straightforward allows only one limit - choose carefully',
                    suggested: ['oncePerScene', 'selfDamage', 'berserk']
                });
                break;
        }
        
        // Efficiency recommendations
        const currentPoints = this.calculateTotalLimitPoints(attack.limits);
        const efficiency = this.calculateEfficiencyAtPoints(currentPoints, tier, archetype);
        
        if (efficiency.isInFirstTier) {
            recommendations.push({
                category: 'efficiency',
                message: 'Currently in efficient range (full value per point)',
                nextThreshold: efficiency.firstTierMax
            });
        } else if (efficiency.isInSecondTier) {
            recommendations.push({
                category: 'efficiency',
                message: 'Currently in half-value range',
                nextThreshold: efficiency.secondTierMax
            });
        } else {
            recommendations.push({
                category: 'efficiency',
                message: 'Currently in quarter-value range - diminishing returns',
                suggestion: 'Consider spreading limits across multiple attacks'
            });
        }
        
        return recommendations;
    }
    
    // Calculate efficiency information for current limit points
    static calculateEfficiencyAtPoints(limitPoints, tier, archetype) {
        const firstTierMax = tier * GameConstants.LIMIT_FIRST_TIER_MULTIPLIER;
        const secondTierMax = firstTierMax + (tier * GameConstants.LIMIT_SECOND_TIER_MULTIPLIER);
        
        return {
            limitPoints,
            isInFirstTier: limitPoints <= firstTierMax,
            isInSecondTier: limitPoints > firstTierMax && limitPoints <= secondTierMax,
            isInThirdTier: limitPoints > secondTierMax,
            firstTierMax,
            secondTierMax,
            currentEfficiency: limitPoints <= firstTierMax ? 1.0 : 
                              limitPoints <= secondTierMax ? 0.5 : 0.25
        };
    }
    
    // Get optimal limit point targets for archetype
    static getOptimalTargets(tier, archetype) {
        const firstTier = tier * GameConstants.LIMIT_FIRST_TIER_MULTIPLIER;
        const secondTier = tier * GameConstants.LIMIT_SECOND_TIER_MULTIPLIER;
        
        const targets = {
            efficient: firstTier,
            breakeven: firstTier + secondTier,
            maximum: firstTier + secondTier + (tier * 40) // Arbitrary max for third tier
        };
        
        // Archetype-specific adjustments
        switch(archetype) {
            case 'specialist':
                targets.recommended = Math.floor(firstTier * 1.5); // Specialist gets better returns
                break;
            case 'straightforward':
                targets.recommended = Math.floor(firstTier * 0.75); // Single limit, choose wisely
                break;
            default:
                targets.recommended = firstTier;
                break;
        }
        
        return targets;
    }
    
    // Simulate limit point scenarios
    static simulateScenarios(tier, archetype, targetPoints) {
        const scenarios = [];
        
        for (let points = 0; points <= targetPoints; points += 10) {
            const finalPoints = this.calculateUpgradePointsFromLimits(points, tier, archetype);
            const efficiency = points > 0 ? finalPoints / points : 0;
            
            scenarios.push({
                limitPoints: points,
                upgradePoints: finalPoints,
                efficiency: efficiency.toFixed(3)
            });
        }
        
        return scenarios;
    }
}