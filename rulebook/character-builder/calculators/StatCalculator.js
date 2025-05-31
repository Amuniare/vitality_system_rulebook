// StatCalculator.js - Calculate derived stats and combat values
import { GameConstants } from '../core/GameConstants.js';
import { TierSystem } from '../core/TierSystem.js';

export class StatCalculator {
    // Calculate all derived stats for a character
    static calculateAllStats(character) {
        const baseStats = this.calculateBaseStats(character);
        const archetypeStats = this.applyArchetypeBonuses(character, baseStats);
        const boonStats = this.applyBoonEffects(character, archetypeStats);
        const traitFlawStats = this.applyTraitFlawBonuses(character, boonStats);
        const finalStats = this.applyFinalModifications(character, traitFlawStats);
        
        return {
            base: baseStats,
            withArchetypes: archetypeStats,
            withBoons: boonStats,
            withTraitsFlaws: traitFlawStats,
            final: finalStats,
            breakdown: this.generateStatBreakdown(character, baseStats, finalStats)
        };
    }
    
    // Calculate base stats from tier and attributes
    static calculateBaseStats(character) {
        const tier = character.tier;
        const attrs = character.attributes;
        
        return {
            // Combat Stats
            accuracy: tier + attrs.focus,
            damage: tier + (attrs.power * GameConstants.POWER_DAMAGE_MULTIPLIER),
            conditions: tier + attrs.power,
            initiative: tier + attrs.mobility + attrs.focus + attrs.awareness,
            movement: TierSystem.calculateBaseMovement(tier, attrs.mobility),
            hp: TierSystem.calculateBaseHP(tier),
            
            // Defense Stats
            avoidance: GameConstants.AVOIDANCE_BASE + tier + attrs.mobility,
            durability: tier + (attrs.endurance * GameConstants.ENDURANCE_DURABILITY_MULTIPLIER),
            resolve: GameConstants.RESOLVE_BASE + tier + attrs.focus,
            stability: GameConstants.STABILITY_BASE + tier + attrs.power,
            vitality: GameConstants.VITALITY_BASE + tier + attrs.endurance,
            
            // Utility Stats
            skillBonus: tier, // Base bonus to all skill checks
            expertiseBonus: 0, // Modified by archetype
            
            // Resource Stats
            reactions: 1, // Base reactions per turn
            quickActions: 1, // Base quick actions per turn
            primaryActions: 1 // Base primary actions per turn
        };
    }
    
    // Apply archetype bonuses to base stats
    static applyArchetypeBonuses(character, baseStats) {
        const stats = { ...baseStats };
        const archetypes = character.archetypes;
        const tier = character.tier;
        const attrs = character.attributes;
        
        // Movement Archetype Bonuses
        switch(archetypes.movement) {
            case 'swift':
                stats.movement += Math.ceil(tier / 2);
                break;
            case 'skirmisher':
                stats.reach = 1; // Special property
                stats.opportunityImmunity = true;
                break;
            case 'behemoth':
                stats.immunities = ['grabbed', 'moved', 'prone', 'stunned'];
                break;
            case 'bulwark':
                stats.adjacentEnemyPenalty = 'half_movement';
                break;
            case 'vanguard':
                stats.movement += attrs.endurance;
                break;
            case 'flight':
                stats.movementType = 'flight';
                break;
            case 'teleportation':
                stats.movementType = 'teleportation';
                stats.movement -= 2; // Penalty
                break;
            // Add other movement archetypes
        }
        
        // Attack Type Archetype Bonuses
        switch(archetypes.attackType) {
            case 'singleTarget':
                stats.freeAttackTypes = ['melee', 'ranged'];
                break;
            case 'aoeSpecialist':
                stats.freeAttackTypes = ['area'];
                break;
            case 'directSpecialist':
                stats.freeAttackTypes = ['direct'];
                break;
        }
        
        // Effect Type Archetype Bonuses
        switch(archetypes.effectType) {
            case 'crowdControl':
                stats.damage -= tier; // Penalty to damage
                stats.freeAdvancedConditions = 2;
                break;
            case 'hybridSpecialist':
                stats.mandatoryHybrid = true;
                break;
            // damageSpecialist has no stat modifications
        }
        
        // Unique Ability Archetype Bonuses
        switch(archetypes.uniqueAbility) {
            case 'versatileMaster':
                stats.quickActions = tier >= 8 ? 3 : 2;
                break;
            case 'cutAbove':
                const bonus = tier <= 3 ? 1 : tier <= 6 ? 2 : 3;
                stats.accuracy += bonus;
                stats.damage += bonus;
                stats.conditions += bonus;
                stats.avoidance += bonus;
                stats.durability += bonus;
                stats.resolve += bonus;
                stats.stability += bonus;
                stats.vitality += bonus;
                stats.initiative += bonus;
                stats.movement += bonus;
                break;
            // extraordinary affects point pools, not stats directly
        }
        
        // Defensive Archetype Bonuses
        switch(archetypes.defensive) {
            case 'stalwart':
                stats.avoidance -= tier;
                stats.damageResistance = 'chosen_type_half';
                break;
            case 'resilient':
                stats.durability += tier;
                break;
            case 'fortress':
                stats.resolve += tier;
                stats.stability += tier;
                stats.vitality += tier;
                break;
            case 'immutable':
                stats.immunity = 'chosen_resistance_category';
                break;
            case 'juggernaut':
                stats.hp += tier * 5;
                break;
        }
        
        // Utility Archetype Bonuses
        switch(archetypes.utility) {
            case 'specialized':
                stats.chosenStatDoubleBonus = tier * 2; // Applied to chosen stat
                break;
            case 'jackOfAllTrades':
                stats.skillBonus += tier; // Additional tier bonus to all checks
                break;
            // practical has no special bonuses
        }
        
        return stats;
    }
    
    // Apply boon effects to stats
    static applyBoonEffects(character, baseStats) {
        const stats = { ...baseStats };
        
        character.mainPoolPurchases.boons.forEach(boon => {
            switch(boon.boonId) {
                case 'speedOfThought':
                    // Replace awareness with intelligence*2 for initiative
                    stats.initiative = stats.initiative - character.attributes.awareness + (character.attributes.intelligence * 2);
                    break;
                case 'combatReflexes':
                    stats.reactions += 1;
                    break;
                case 'perfectionist':
                    stats.rerollOnes = true;
                    break;
                case 'robot':
                    stats.immunities = (stats.immunities || []).concat(['vitality_conditions', 'resolve_conditions']);
                    stats.vulnerabilities = (stats.vulnerabilities || []).concat(['electricity', 'hacking']);
                    stats.noPerMinuteHealing = true;
                    break;
                case 'psychic':
                    stats.conditionTargeting = 'resolve';
                    break;
                case 'telekinetic':
                    stats.conditionTargeting = 'stability';
                    break;
                case 'biohacker':
                    stats.conditionTargeting = 'vitality';
                    break;
                // Add other boon effects
            }
        });
        
        return stats;
    }
    
    // Apply trait and flaw bonuses
    static applyTraitFlawBonuses(character, baseStats) {
        const stats = { ...baseStats };
        
        // Calculate stacking bonuses from traits and flaws
        const stackingBonuses = this.calculateStackingBonuses(character);
        
        // Apply bonuses to stats
        Object.entries(stackingBonuses).forEach(([stat, bonus]) => {
            if (stats[stat] !== undefined) {
                stats[stat] += bonus;
            }
        });
        
        return stats;
    }
    
    // Calculate stacking bonuses with reduction
    static calculateStackingBonuses(character) {
        const bonuses = {};
        
        // Collect all stat bonuses
        character.mainPoolPurchases.traits.forEach(trait => {
            trait.statBonuses.forEach(stat => {
                if (!bonuses[stat]) bonuses[stat] = [];
                bonuses[stat].push({
                    source: 'trait',
                    name: trait.name,
                    baseValue: character.tier
                });
            });
        });
        
        character.mainPoolPurchases.flaws.forEach(flaw => {
            if (flaw.statBonus) {
                if (!bonuses[flaw.statBonus]) bonuses[flaw.statBonus] = [];
                bonuses[flaw.statBonus].push({
                    source: 'flaw',
                    name: flaw.name,
                    baseValue: character.tier
                });
            }
        });
        
        // Apply stacking reduction
        const finalBonuses = {};
        Object.entries(bonuses).forEach(([stat, bonusArray]) => {
            let total = 0;
            bonusArray.forEach((bonus, index) => {
                const stackingPenalty = index; // 0 for first, 1 for second, etc.
                const actualValue = Math.max(0, bonus.baseValue - stackingPenalty);
                total += actualValue;
            });
            finalBonuses[stat] = total;
        });
        
        return finalBonuses;
    }
    
    // Apply final modifications (flaws that affect stats)
    static applyFinalModifications(character, baseStats) {
        const stats = { ...baseStats };
        
        // Apply flaw effects
        character.mainPoolPurchases.flaws.forEach(flaw => {
            switch(flaw.flawId) {
                case 'sickly':
                    stats.hp -= 30;
                    break;
                case 'unresponsive':
                    stats.reactions = 0;
                    stats.initiative -= character.tier; // Remove tier bonus
                    stats.noSurpriseRounds = true;
                    break;
                case 'weak':
                    // This affects point pools, not final stats
                    break;
                // Add other flaw effects
            }
        });
        
        // Ensure minimums
        stats.hp = Math.max(1, stats.hp);
        stats.reactions = Math.max(0, stats.reactions);
        stats.avoidance = Math.max(0, stats.avoidance);
        
        return stats;
    }
    
    // Generate detailed stat breakdown
    static generateStatBreakdown(character, baseStats, finalStats) {
        const breakdown = {};
        
        Object.keys(finalStats).forEach(stat => {
            const base = baseStats[stat] || 0;
            const final = finalStats[stat] || 0;
            const difference = final - base;
            
            breakdown[stat] = {
                base,
                final,
                difference,
                sources: this.getStatSources(character, stat, difference)
            };
        });
        
        return breakdown;
    }
    
    // Get sources of stat modifications
    static getStatSources(character, stat, totalDifference) {
        const sources = [];
        
        // Check archetype bonuses
        const archetypeBonuses = this.getArchetypeStatBonuses(character, stat);
        if (archetypeBonuses.length > 0) {
            sources.push(...archetypeBonuses);
        }
        
        // Check boon bonuses
        const boonBonuses = this.getBoonStatBonuses(character, stat);
        if (boonBonuses.length > 0) {
            sources.push(...boonBonuses);
        }
        
        // Check trait/flaw bonuses
        const traitFlawBonuses = this.getTraitFlawStatBonuses(character, stat);
        if (traitFlawBonuses.length > 0) {
            sources.push(...traitFlawBonuses);
        }
        
        return sources;
    }
    
    // Get archetype contributions to a stat
    static getArchetypeStatBonuses(character, stat) {
        const bonuses = [];
        const archetypes = character.archetypes;
        const tier = character.tier;
        
        // Movement archetype contributions
        if (stat === 'movement') {
            switch(archetypes.movement) {
                case 'swift':
                    bonuses.push({ source: 'Swift archetype', value: Math.ceil(tier / 2) });
                    break;
                case 'vanguard':
                    bonuses.push({ source: 'Vanguard archetype', value: character.attributes.endurance });
                    break;
                case 'teleportation':
                    bonuses.push({ source: 'Teleportation penalty', value: -2 });
                    break;
            }
        }
        
        // Add other archetype contributions for other stats
        
        return bonuses;
    }
    
    // Get boon contributions to a stat
    static getBoonStatBonuses(character, stat) {
        const bonuses = [];
        
        character.mainPoolPurchases.boons.forEach(boon => {
            switch(boon.boonId) {
                case 'combatReflexes':
                    if (stat === 'reactions') {
                        bonuses.push({ source: 'Combat Reflexes', value: 1 });
                    }
                    break;
                // Add other boon contributions
            }
        });
        
        return bonuses;
    }
    
    // Get trait/flaw contributions to a stat
    static getTraitFlawStatBonuses(character, stat) {
        const bonuses = [];
        const stackingBonuses = this.calculateStackingBonuses(character);
        
        if (stackingBonuses[stat]) {
            bonuses.push({ source: 'Traits/Flaws (with stacking)', value: stackingBonuses[stat] });
        }
        
        return bonuses;
    }
    
    // Calculate combat effectiveness metrics
    static calculateCombatEffectiveness(character) {
        const stats = this.calculateAllStats(character).final;
        
        return {
            offensive: {
                accuracy: stats.accuracy,
                damage: stats.damage,
                conditions: stats.conditions,
                initiative: stats.initiative,
                actions: stats.primaryActions + stats.quickActions
            },
            defensive: {
                avoidance: stats.avoidance,
                durability: stats.durability,
                hp: stats.hp,
                resistances: {
                    resolve: stats.resolve,
                    stability: stats.stability,
                    vitality: stats.vitality
                }
            },
            mobility: {
                movement: stats.movement,
                movementType: stats.movementType || 'standard',
                reactions: stats.reactions
            },
            utility: {
                skillBonus: stats.skillBonus,
                expertiseBonus: stats.expertiseBonus
            }
        };
    }
    
    // Compare stats against tier benchmarks
    static compareToBenchmarks(character) {
        const stats = this.calculateAllStats(character).final;
        const tier = character.tier;
        
        // Define tier benchmarks
        const benchmarks = {
            accuracy: tier + (tier * 0.5), // Expect about 1.5x tier
            damage: tier + (tier * 0.75), // Expect about 1.75x tier
            conditions: tier + (tier * 0.5), // Expect about 1.5x tier
            avoidance: 10 + tier + (tier * 0.5), // Expect mobility investment
            durability: tier + (tier * 0.75), // Expect endurance investment
            hp: 100 + (tier * 7), // Expect slightly above base
            movement: tier + 8 // Expect some mobility investment
        };
        
        const comparison = {};
        Object.entries(benchmarks).forEach(([stat, benchmark]) => {
            const actual = stats[stat] || 0;
            const ratio = benchmark > 0 ? actual / benchmark : 0;
            
            comparison[stat] = {
                actual,
                benchmark,
                ratio,
                rating: this.getRating(ratio)
            };
        });
        
        return comparison;
    }
    
    // Get performance rating
    static getRating(ratio) {
        if (ratio >= 1.2) return 'excellent';
        if (ratio >= 1.0) return 'good';
        if (ratio >= 0.8) return 'adequate';
        if (ratio >= 0.6) return 'weak';
        return 'poor';
    }
    
    // Get stat optimization suggestions
    static getOptimizationSuggestions(character) {
        const comparison = this.compareToBenchmarks(character);
        const suggestions = [];
        
        Object.entries(comparison).forEach(([stat, data]) => {
            if (data.rating === 'poor' || data.rating === 'weak') {
                suggestions.push({
                    type: 'stat_improvement',
                    stat,
                    current: data.actual,
                    target: data.benchmark,
                    priority: data.rating === 'poor' ? 'high' : 'medium',
                    suggestion: this.getStatImprovementSuggestion(stat, character)
                });
            }
        });
        
        return suggestions;
    }
    
    // Get specific improvement suggestion for a stat
    static getStatImprovementSuggestion(stat, character) {
        switch(stat) {
            case 'accuracy':
                return 'Consider increasing Focus attribute or taking accuracy-boosting traits';
            case 'damage':
                return 'Consider increasing Power attribute or damage-focused upgrades';
            case 'conditions':
                return 'Consider increasing Power attribute for condition effectiveness';
            case 'avoidance':
                return 'Consider increasing Mobility attribute';
            case 'durability':
                return 'Consider increasing Endurance attribute';
            case 'hp':
                return 'Consider Juggernaut defensive archetype or health-boosting boons';
            case 'movement':
                return 'Consider movement-focused archetype or Mobility investment';
            default:
                return 'Consider archetype synergy and attribute allocation';
        }
    }
}