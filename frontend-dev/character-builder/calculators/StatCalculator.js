// frontend/character-builder/calculators/StatCalculator.js - REFACTORED with incremental updates and caching
import { GameConstants } from '../core/GameConstants.js';
import { TierSystem } from '../core/TierSystem.js';

export class StatCalculator {
    static cache = new Map();
    static lastCharacterHash = null;
    
    // Calculate all derived stats for a character with caching
    static calculateAllStats(character) {
        const characterHash = this.getCharacterHash(character);
        
        // Return cached result if character hasn't changed
        if (this.lastCharacterHash === characterHash && this.cache.has('allStats')) {
            return this.cache.get('allStats');
        }
        
        console.log('🔄 Calculating character stats (cache miss)');
        
        const baseStats = this.calculateBaseStats(character);
        const archetypeStats = this.applyArchetypeBonuses(character, baseStats);
        const boonStats = this.applyBoonEffects(character, archetypeStats);
        const traitFlawStats = this.applyTraitFlawBonuses(character, boonStats);
        const finalStats = this.applyFinalModifications(character, traitFlawStats);
        
        const result = {
            base: baseStats,
            withArchetypes: archetypeStats,
            withBoons: boonStats,
            withTraitsFlaws: traitFlawStats,
            final: finalStats,
            breakdown: this.generateStatBreakdown(character, baseStats, finalStats)
        };
        
        // Cache results
        this.cache.set('allStats', result);
        this.lastCharacterHash = characterHash;
        
        return result;
    }
    
    // OPTIMIZED: Calculate only specific stat category
    static calculateSpecificStats(character, category) {
        const cacheKey = `${category}_${this.getCharacterHash(character)}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        let result;
        switch(category) {
            case 'combat':
                result = this.calculateCombatStats(character);
                break;
            case 'defense':
                result = this.calculateDefenseStats(character);
                break;
            case 'utility':
                result = this.calculateUtilityStats(character);
                break;
            default:
                result = this.calculateAllStats(character);
        }
        
        this.cache.set(cacheKey, result);
        return result;
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
    
    // OPTIMIZED: Calculate only combat stats
    static calculateCombatStats(character) {
        const tier = character.tier;
        const attrs = character.attributes;
        
        const base = {
            accuracy: tier + attrs.focus,
            damage: tier + (attrs.power * GameConstants.POWER_DAMAGE_MULTIPLIER),
            conditions: tier + attrs.power,
            initiative: tier + attrs.mobility + attrs.focus + attrs.awareness,
            movement: TierSystem.calculateBaseMovement(tier, attrs.mobility),
            hp: TierSystem.calculateBaseHP(tier)
        };
        
        // Apply archetype bonuses to combat stats only
        return this.applyCombatArchetypeBonuses(character, base);
    }
    
    // OPTIMIZED: Calculate only defense stats
    static calculateDefenseStats(character) {
        const tier = character.tier;
        const attrs = character.attributes;
        
        const base = {
            avoidance: GameConstants.AVOIDANCE_BASE + tier + attrs.mobility,
            durability: tier + (attrs.endurance * GameConstants.ENDURANCE_DURABILITY_MULTIPLIER),
            resolve: GameConstants.RESOLVE_BASE + tier + attrs.focus,
            stability: GameConstants.STABILITY_BASE + tier + attrs.power,
            vitality: GameConstants.VITALITY_BASE + tier + attrs.endurance
        };
        
        // Apply archetype bonuses to defense stats only
        return this.applyDefenseArchetypeBonuses(character, base);
    }
    
    // OPTIMIZED: Calculate only utility stats
    static calculateUtilityStats(character) {
        const tier = character.tier;
        
        return {
            skillBonus: tier + this.getUtilityArchetypeBonus(character),
            expertiseBonus: 0 // Old expertise system removed
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
                stats.reach = 1;
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
                stats.movement -= 2;
                break;
        }
        
        // Attack Type Archetype Bonuses
        switch(archetypes.attackType) {
            case 'singleTarget':
                stats.freeAttackTypes = ['melee_ac', 'melee_dg_cn', 'ranged'];
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
                stats.damage -= tier;
                stats.freeAdvancedConditions = 2;
                break;
            case 'hybridSpecialist':
                stats.mandatoryHybrid = true;
                break;
        }
        
        // Unique Ability Archetype Bonuses
        switch(archetypes.uniqueAbility) {
            case 'versatileMaster':
                stats.quickActions = tier >= 8 ? 3 : 2;
                break;
            case 'cutAbove':
                const bonus = tier <= 4 ? 1 : tier <= 7 ? 2 : 3;
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
        }
        
        // Defensive Archetype Bonuses
        switch(archetypes.defensive) {
            case 'stalwart':
                stats.avoidance -= tier;
                stats.damageResistance = 'chosen_type_half';
                break;
            case 'fortress':
                stats.durability += tier;
                break;
            case 'resilient':
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
        
        // Utility Archetype Bonuses are now GM adjudicated and do not affect calculated stats.
        // The old logic has been removed.
        
        return stats;
    }
    
    // OPTIMIZED: Apply only combat archetype bonuses
    static applyCombatArchetypeBonuses(character, baseStats) {
        const stats = { ...baseStats };
        const archetypes = character.archetypes;
        const tier = character.tier;
        
        // Only movement bonuses that affect combat stats
        if (archetypes.movement === 'swift') {
            stats.movement += Math.ceil(tier / 2);
        } else if (archetypes.movement === 'vanguard') {
            stats.movement += character.attributes.endurance;
        } else if (archetypes.movement === 'teleportation') {
            stats.movement -= 2;
        }
        
        // Effect type bonuses that affect combat
        if (archetypes.effectType === 'crowdControl') {
            stats.damage -= tier;
        }
        
        // Unique ability bonuses that affect combat
        if (archetypes.uniqueAbility === 'versatileMaster') {
            stats.quickActions = tier >= 8 ? 3 : 2;
        } else if (archetypes.uniqueAbility === 'cutAbove') {
            const bonus = tier <= 4 ? 1 : tier <= 7 ? 2 : 3;
            stats.accuracy += bonus;
            stats.damage += bonus;
            stats.conditions += bonus;
            stats.initiative += bonus;
            stats.movement += bonus;
        }
        
        return stats;
    }
    
    // OPTIMIZED: Apply only defense archetype bonuses
    static applyDefenseArchetypeBonuses(character, baseStats) {
        const stats = { ...baseStats };
        const archetypes = character.archetypes;
        const tier = character.tier;
        
        // Defensive archetype bonuses
        switch(archetypes.defensive) {
            case 'stalwart':
                stats.avoidance -= tier;
                break;
            case 'fortress':
                stats.durability += tier;
                break;
            case 'resilient':
                stats.resolve += tier;
                stats.stability += tier;
                stats.vitality += tier;
                break;
            case 'juggernaut':
                // HP bonus would be calculated separately
                break;
        }
        
        // Cut Above affects all stats including defenses
        if (archetypes.uniqueAbility === 'cutAbove') {
            const bonus = tier <= 4 ? 1 : tier <= 7 ? 2 : 3;
            stats.avoidance += bonus;
            stats.durability += bonus;
            stats.resolve += bonus;
            stats.stability += bonus;
            stats.vitality += bonus;
        }
        
        return stats;
    }
    
    // Get utility archetype bonus
    static getUtilityArchetypeBonus(character) {
        // This is for the "Jack of All Trades" bonus.
        // It's a general skill bonus, not tied to expertise.
        if (character.archetypes.utility === 'jackOfAllTrades') {
            return character.tier; // Additional tier bonus to all skill checks
        }
        return 0;
    }
    
    // Apply boon effects to stats
    static applyBoonEffects(character, baseStats) {
        const stats = { ...baseStats };
        
        character.mainPoolPurchases.boons.forEach(boon => {
            switch(boon.boonId) {
                case 'speedOfThought':
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
            }
        });
        
        return stats;
    }
    
    // Apply trait and flaw bonuses with stacking reduction
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
    
    // OPTIMIZED: Calculate stacking bonuses with reduction (improved algorithm)
    static calculateStackingBonuses(character) {
        const bonuses = {};
        
        // Collect all stat bonuses by type
        character.mainPoolPurchases.traits.forEach(trait => {
            trait.statBonuses.forEach(stat => {
                if (!bonuses[stat]) bonuses[stat] = [];
                bonuses[stat].push({
                    source: 'trait',
                    name: trait.name || 'Trait',
                    baseValue: character.tier
                });
            });
        });
        
        // NEW ECONOMICS: Flaws give stat bonuses (not point bonuses)
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
        
        // Apply stacking reduction (each additional bonus to same stat -1)
        const finalBonuses = {};
        Object.entries(bonuses).forEach(([stat, bonusArray]) => {
            let total = 0;
            bonusArray.forEach((bonus, index) => {
                const stackingPenalty = index; // 0 for first, 1 for second, etc.
                const actualValue = Math.max(1, bonus.baseValue - stackingPenalty); // Minimum 1
                total += actualValue;
            });
            finalBonuses[stat] = total;
        });
        
        return finalBonuses;
    }
    
    // Apply final modifications (flaw effects)
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
                    stats.initiative -= character.tier;
                    stats.noSurpriseRounds = true;
                    break;
                case 'weak':
                    // This affects point pools, not final stats
                    break;
            }
        });
        
        // Ensure minimums
        stats.hp = Math.max(1, stats.hp);
        stats.reactions = Math.max(0, stats.reactions);
        stats.avoidance = Math.max(0, stats.avoidance);
        
        return stats;
    }
    
    // Generate detailed stat breakdown for Summary Tab
    static generateStatBreakdown(character, baseStats, finalStats) {
        const breakdown = {};
        
        // Focus on calculated stats that need detailed breakdowns
        const calculatedStats = ['hp', 'avoidance', 'durability', 'resolve', 'stability', 'vitality', 
                                'accuracy', 'damage', 'conditions', 'initiative', 'movement'];
        
        calculatedStats.forEach(stat => {
            if (finalStats[stat] !== undefined) {
                breakdown[stat] = this.generateDetailedStatBreakdown(character, stat, baseStats, finalStats);
            }
        });
        
        return breakdown;
    }
    
    // Generate detailed breakdown for a single stat
    static generateDetailedStatBreakdown(character, statName, baseStats, finalStats) {
        const breakdown = [];
        const tier = character.tier;
        const attrs = character.attributes;
        
        // Base calculation components
        switch(statName) {
            case 'hp':
                breakdown.push({ source: 'Base', value: TierSystem.calculateBaseHP(tier) });
                break;
                
            case 'avoidance':
                breakdown.push({ source: 'Base', value: GameConstants.AVOIDANCE_BASE });
                breakdown.push({ source: 'Tier', value: tier });
                breakdown.push({ source: 'Mobility', value: attrs.mobility });
                break;
                
            case 'durability':
                breakdown.push({ source: 'Tier', value: tier });
                breakdown.push({ source: 'Endurance', value: attrs.endurance * GameConstants.ENDURANCE_DURABILITY_MULTIPLIER });
                break;
                
            case 'resolve':
                breakdown.push({ source: 'Base', value: GameConstants.RESOLVE_BASE });
                breakdown.push({ source: 'Tier', value: tier });
                breakdown.push({ source: 'Focus', value: attrs.focus });
                break;
                
            case 'stability':
                breakdown.push({ source: 'Base', value: GameConstants.STABILITY_BASE });
                breakdown.push({ source: 'Tier', value: tier });
                breakdown.push({ source: 'Power', value: attrs.power });
                break;
                
            case 'vitality':
                breakdown.push({ source: 'Base', value: GameConstants.VITALITY_BASE });
                breakdown.push({ source: 'Tier', value: tier });
                breakdown.push({ source: 'Endurance', value: attrs.endurance });
                break;
                
            case 'accuracy':
                breakdown.push({ source: 'Tier', value: tier });
                breakdown.push({ source: 'Focus', value: attrs.focus });
                break;
                
            case 'damage':
                breakdown.push({ source: 'Tier', value: tier });
                breakdown.push({ source: 'Power', value: attrs.power * GameConstants.POWER_DAMAGE_MULTIPLIER });
                break;
                
            case 'conditions':
                breakdown.push({ source: 'Tier', value: tier });
                breakdown.push({ source: 'Power', value: attrs.power });
                break;
                
            case 'initiative':
                breakdown.push({ source: 'Tier', value: tier });
                breakdown.push({ source: 'Mobility', value: attrs.mobility });
                breakdown.push({ source: 'Focus', value: attrs.focus });
                breakdown.push({ source: 'Awareness', value: attrs.awareness });
                break;
                
            case 'movement':
                breakdown.push({ source: 'Base', value: TierSystem.calculateBaseMovement(tier, attrs.mobility) });
                break;
        }
        
        // Add archetype bonuses
        const archetypeBonuses = this.getArchetypeStatBonuses(character, statName);
        breakdown.push(...archetypeBonuses);
        
        // Add boon bonuses
        const boonBonuses = this.getBoonStatBonuses(character, statName);
        breakdown.push(...boonBonuses);
        
        // Add trait/flaw bonuses
        const traitFlawBonuses = this.getTraitFlawStatBonuses(character, statName);
        breakdown.push(...traitFlawBonuses);
        
        // Add flaw penalties
        const flawPenalties = this.getFlawPenalties(character, statName);
        breakdown.push(...flawPenalties);
        
        // Filter out zero values and return
        return breakdown.filter(item => item.value !== 0);
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
                    bonuses.push({ source: 'Swift Archetype', value: Math.ceil(tier / 2) });
                    break;
                case 'vanguard':
                    bonuses.push({ source: 'Vanguard Archetype', value: character.attributes.endurance });
                    break;
                case 'teleportation':
                    bonuses.push({ source: 'Teleportation Penalty', value: -2 });
                    break;
            }
        }
        
        // Defensive archetype contributions
        if (archetypes.defensive) {
            switch(archetypes.defensive) {
                case 'stalwart':
                    if (stat === 'avoidance') {
                        bonuses.push({ source: 'Stalwart Penalty', value: -tier });
                    }
                    break;
                case 'fortress':
                    if (stat === 'durability') {
                        bonuses.push({ source: 'Fortress Archetype', value: tier });
                    }
                    break;
                case 'resilient':
                    if (stat === 'resolve') {
                        bonuses.push({ source: 'Resilient Archetype', value: tier });
                    } else if (stat === 'stability') {
                        bonuses.push({ source: 'Resilient Archetype', value: tier });
                    } else if (stat === 'vitality') {
                        bonuses.push({ source: 'Resilient Archetype', value: tier });
                    }
                    break;
                case 'juggernaut':
                    if (stat === 'hp') {
                        bonuses.push({ source: 'Juggernaut Archetype', value: tier * 5 });
                    }
                    break;
            }
        }
        
        // Unique ability archetype contributions
        if (archetypes.uniqueAbility === 'cutAbove') {
            const cutAboveBonus = tier <= 3 ? 1 : tier <= 6 ? 2 : 3;
            const cutAboveStats = ['accuracy', 'damage', 'conditions', 'avoidance', 'durability', 'resolve', 'stability', 'vitality', 'initiative', 'movement'];
            if (cutAboveStats.includes(stat)) {
                bonuses.push({ source: 'Cut Above Archetype', value: cutAboveBonus });
            }
        }
        
        // Effect type archetype contributions
        if (archetypes.effectType === 'crowdControl' && stat === 'damage') {
            bonuses.push({ source: 'Crowd Control Penalty', value: -tier });
        }
        
        return bonuses;
    }
    
    // Get boon contributions to a stat
    static getBoonStatBonuses(character, stat) {
        const bonuses = [];
        
        character.mainPoolPurchases.boons.forEach(boon => {
            switch(boon.boonId) {
                case 'combatReflexes':
                    if (stat === 'reactions') {
                        bonuses.push({ source: 'Combat Reflexes Boon', value: 1 });
                    }
                    break;
                case 'speedOfThought':
                    if (stat === 'initiative') {
                        // Initiative change: -awareness + (intelligence * 2)
                        const awarenessLoss = -character.attributes.awareness;
                        const intelligenceGain = character.attributes.intelligence * 2;
                        const netChange = awarenessLoss + intelligenceGain;
                        if (netChange !== 0) {
                            bonuses.push({ source: 'Speed of Thought Boon', value: netChange });
                        }
                    }
                    break;
            }
        });
        
        return bonuses;
    }
    
    // Get trait/flaw contributions to a stat
    static getTraitFlawStatBonuses(character, stat) {
        const bonuses = [];
        const stackingBonuses = this.calculateStackingBonuses(character);
        
        if (stackingBonuses[stat]) {
            // Get detailed breakdown of trait/flaw contributions
            const traitCount = character.mainPoolPurchases.traits.filter(trait => 
                trait.statBonuses && trait.statBonuses.includes(stat)
            ).length;
            
            const flawCount = character.mainPoolPurchases.flaws.filter(flaw => 
                flaw.statBonus === stat
            ).length;
            
            if (traitCount > 0 || flawCount > 0) {
                let sourceName = '';
                if (traitCount > 0 && flawCount > 0) {
                    sourceName = `Traits & Flaws (${traitCount + flawCount} total)`;
                } else if (traitCount > 0) {
                    sourceName = `Traits (${traitCount} total)`;
                } else {
                    sourceName = `Flaws (${flawCount} total)`;
                }
                
                bonuses.push({ source: sourceName, value: stackingBonuses[stat] });
            }
        }
        
        return bonuses;
    }
    
    // Get flaw penalties to a stat
    static getFlawPenalties(character, stat) {
        const penalties = [];
        
        character.mainPoolPurchases.flaws.forEach(flaw => {
            switch(flaw.flawId) {
                case 'sickly':
                    if (stat === 'hp') {
                        penalties.push({ source: 'Sickly Flaw', value: -30 });
                    }
                    break;
                case 'unresponsive':
                    if (stat === 'initiative') {
                        penalties.push({ source: 'Unresponsive Flaw', value: -character.tier });
                    }
                    break;
            }
        });
        
        return penalties;
    }
    
    // CACHING UTILITIES
    
    // Generate hash for character to detect changes
    static getCharacterHash(character) {
        const relevantData = {
            tier: character.tier,
            archetypes: character.archetypes,
            attributes: character.attributes,
            mainPoolPurchases: character.mainPoolPurchases,
            utilityPurchases: character.utilityPurchases
        };
        
        return JSON.stringify(relevantData);
    }
    
    // Clear cache
    static clearCache() {
        this.cache.clear();
        this.lastCharacterHash = null;
        console.log('🗑️ Stat calculator cache cleared');
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
        
        const benchmarks = {
            accuracy: tier + (tier * 0.5),
            damage: tier + (tier * 0.75),
            conditions: tier + (tier * 0.5),
            avoidance: 10 + tier + (tier * 0.5),
            durability: tier + (tier * 0.75),
            hp: 100 + (tier * 7),
            movement: tier + 8
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
}