// StatCalculator.js - Simplified formula calculations
// Based on current rulebook (not archive) - Clean slate implementation

export class StatCalculator {

    // Calculate all combat and utility stats for a character
    static calculateAllStats(character, gameData = {}) {
        const tier = character.tier;
        const attributes = character.attributes;
        const archetypes = character.archetypes;
        const boons = character.boons || [];

        // Base movement calculation (simplified from archive)
        const baseMovement = Math.max(
            attributes.mobility + 6,
            attributes.mobility + tier
        );

        // Basic combat stats with NEW SIMPLIFIED formulas
        const baseStats = {
            // Attack formulas (SIMPLIFIED)
            accuracy: tier + attributes.focus, // Was: tier + focus + Power × 1.5
            damage: tier + attributes.power,   // Was: tier + (power × 1.5)
            conditions: tier + attributes.power,

            // Defense formulas (SIMPLIFIED)
            avoidance: 5 + tier + attributes.mobility,  // Was: 10 + tier + mobility
            durability: tier + attributes.endurance,    // Was: tier + (endurance × 1.5)

            // Secondary resistances (unchanged)
            resolve: 10 + tier + attributes.focus,
            stability: 10 + tier + attributes.power,
            vitality: 10 + tier + attributes.endurance,

            // Other stats
            initiative: tier + attributes.focus + attributes.mobility + attributes.awareness,
            movement: baseMovement,
            capacity: attributes.power, // Can be modified by boons
            maxHP: 100, // Base health
            maxEfforts: 2 // Default efforts
        };

        // Apply archetype bonuses
        const archetypeStats = this.applyArchetypeBonuses(baseStats, archetypes, tier, attributes);

        // Apply boon bonuses
        const finalStats = this.applyBoonBonuses(archetypeStats, boons, tier, attributes, gameData);

        return {
            base: baseStats,
            withArchetypes: archetypeStats,
            final: finalStats,
            breakdown: this.generateStatBreakdown(baseStats, archetypeStats, finalStats, character)
        };
    }

    // Apply simplified archetype effects to stats
    static applyArchetypeBonuses(stats, archetypes, tier, attributes) {
        const bonusedStats = { ...stats };

        // Movement archetype bonuses
        switch(archetypes.movement) {
            case 'swift':
                bonusedStats.movement += Math.ceil(tier / 2);
                break;
            case 'skirmisher':
                // Immunity to punish attacks + reach bonus handled elsewhere
                bonusedStats.reach = 1;
                bonusedStats.immunities = (bonusedStats.immunities || []).concat(['punish_attacks_movement']);
                break;
            case 'behemoth':
                bonusedStats.immunities = (bonusedStats.immunities || []).concat(['grabbed', 'moved', 'prone', 'stunned']);
                break;
            case 'vanguard':
                bonusedStats.doubleMovementTurn1 = true;
                bonusedStats.enhancedPunishAttacks = true;
                break;
            case 'teleportation':
                bonusedStats.movement -= 2; // Penalty for teleportation
                bonusedStats.movementType = 'teleportation';
                break;
            case 'flight':
                bonusedStats.movementType = 'flight';
                break;
            case 'portal':
                bonusedStats.movementType = 'portal';
                break;
        }

        // Defensive archetype bonuses
        switch(archetypes.defensive) {
            case 'iron_will':
                bonusedStats.resolve += tier * 2;
                break;
            case 'immovable':
                bonusedStats.stability += tier * 2;
                break;
            case 'resilient':
                bonusedStats.vitality += tier * 2;
                break;
        }

        // Attack archetype bonuses (only certain ones get special attacks)
        switch(archetypes.attack) {
            case 'focused_attacker':
                bonusedStats.specialAttackCount = 1;
                bonusedStats.specialAttackPoints = tier * 20;
                break;
            case 'dual_natured':
                bonusedStats.specialAttackCount = 2;
                bonusedStats.specialAttackPoints = tier * 15;
                break;
            case 'versatile_master':
                bonusedStats.specialAttackCount = 5;
                bonusedStats.specialAttackPoints = tier * 10;
                break;
            case 'shared_charges':
                bonusedStats.specialAttackCount = 3;
                bonusedStats.specialAttackPoints = tier * 10;
                bonusedStats.sharedCharges = 10;
                break;
            case 'specialist':
                bonusedStats.extraBoons = Math.max(0, tier - 2);
                bonusedStats.restrictions = (bonusedStats.restrictions || []).concat(['no_attack_upgrades']);
                break;
        }

        // Utility archetype bonuses (simplified skill system)
        switch(archetypes.utility) {
            case 'specialized':
                bonusedStats.specializedAttribute = true; // Will need to store choice
                bonusedStats.specializedBonus = tier * 3;
                break;
            case 'practical':
                bonusedStats.practicalAttributes = true; // Will need to store choices
                bonusedStats.practicalBonus = tier * 2;
                break;
            case 'jack_of_all_trades':
                bonusedStats.jackOfAllTradesBonus = tier;
                break;
        }

        return bonusedStats;
    }

    // Apply boon effects to stats
    static applyBoonBonuses(stats, boons, tier, attributes, gameData) {
        const bonusedStats = { ...stats };

        // Get boon data from gameData if available
        const boonData = gameData.boons || [];

        for (const boonId of boons) {
            const boon = boonData.find(b => b.id === boonId);
            if (!boon) continue;

            if (boon.effects) {
                for (const effect of boon.effects) {
                    switch(effect.type) {
                        case 'stat_bonus':
                            const bonus = this.evaluateBonus(effect.bonus, tier, attributes);
                            switch(effect.stat) {
                                case 'accuracy':
                                    bonusedStats.accuracy += bonus;
                                    break;
                                case 'damage':
                                    bonusedStats.damage += bonus;
                                    break;
                                case 'conditions':
                                    bonusedStats.conditions += bonus;
                                    break;
                                case 'avoidance':
                                    bonusedStats.avoidance += bonus;
                                    break;
                                case 'durability':
                                    bonusedStats.durability += bonus;
                                    break;
                                case 'movement':
                                    bonusedStats.movement += bonus;
                                    break;
                                case 'all_resistances':
                                    bonusedStats.resolve += bonus;
                                    bonusedStats.stability += bonus;
                                    bonusedStats.vitality += bonus;
                                    break;
                                case 'max_efforts':
                                    bonusedStats.maxEfforts += bonus;
                                    break;
                            }
                            break;

                        case 'aura':
                            if (effect.damage) {
                                const auraDamage = this.evaluateBonus(effect.damage, tier, attributes);
                                bonusedStats.auraDamage = auraDamage;
                                bonusedStats.auraRadius = effect.radius;
                            }
                            break;

                        case 'support_aura':
                            bonusedStats.supportAuraBonus = this.evaluateBonus(effect.bonus, tier, attributes);
                            bonusedStats.supportAuraRadius = effect.radius;
                            break;

                        case 'immunity':
                            if (effect.value) {
                                bonusedStats.immunities = (bonusedStats.immunities || []).concat(effect.value);
                            }
                            break;

                        case 'vulnerability':
                            if (effect.value) {
                                bonusedStats.vulnerabilities = (bonusedStats.vulnerabilities || []).concat(effect.value);
                            }
                            break;

                        case 'special':
                            // Handle special abilities
                            switch(effect.value) {
                                case 'lucky_rerolls':
                                    bonusedStats.luckyRerolls = effect.count || 3;
                                    break;
                                case 'perfectionist_reroll':
                                    bonusedStats.perfectionistReroll = true;
                                    break;
                                case 'regeneration':
                                    bonusedStats.regeneration = effect.healing || 20;
                                    break;
                                case 'heal':
                                    bonusedStats.healAbility = {
                                        healing: effect.healing || 25,
                                        uses: effect.uses || 5,
                                        range: effect.range || 'adjacent'
                                    };
                                    break;
                                case 'create_wall':
                                    bonusedStats.createWall = {
                                        uses: effect.uses || 3
                                    };
                                    break;
                                case 'invisibility':
                                    bonusedStats.invisibility = true;
                                    break;
                            }
                            break;
                    }
                }
            }

            // Apply drawback effects for passive bonuses
            if (boon.drawback) {
                switch(boon.drawback) {
                    case 'sickly':
                        bonusedStats.maxHP -= 30;
                        break;
                    case 'peaked':
                        bonusedStats.maxEfforts = 0;
                        break;
                    case 'slow':
                        bonusedStats.restrictions = (bonusedStats.restrictions || []).concat(['no_movement_archetype']);
                        break;
                    case 'frail':
                        bonusedStats.restrictions = (bonusedStats.restrictions || []).concat(['no_defensive_archetype']);
                        break;
                    case 'combat_focused':
                        bonusedStats.restrictions = (bonusedStats.restrictions || []).concat(['no_utility_abilities']);
                        break;
                }
            }
        }

        return bonusedStats;
    }

    // Evaluate bonus expressions like "tier * 2" or "10 + tier + focus + power"
    static evaluateBonus(bonusExpression, tier, attributes) {
        if (typeof bonusExpression === 'number') {
            return bonusExpression;
        }

        if (typeof bonusExpression === 'string') {
            // Simple expression evaluation
            const expression = bonusExpression
                .replace(/tier/g, tier)
                .replace(/focus/g, attributes.focus || 0)
                .replace(/power/g, attributes.power || 0)
                .replace(/mobility/g, attributes.mobility || 0)
                .replace(/endurance/g, attributes.endurance || 0)
                .replace(/awareness/g, attributes.awareness || 0)
                .replace(/communication/g, attributes.communication || 0)
                .replace(/intelligence/g, attributes.intelligence || 0)
                .replace(/ceil\(/g, 'Math.ceil(')
                .replace(/max\(/g, 'Math.max(');

            try {
                return eval(expression);
            } catch (e) {
                console.warn(`Failed to evaluate bonus expression: ${bonusExpression}`, e);
                return 0;
            }
        }

        return 0;
    }

    // Calculate attribute allocation status
    static calculateAttributeAllocation(character) {
        const tier = character.tier;
        const attributes = character.attributes;

        const combatSpent = attributes.focus + attributes.power +
                           attributes.mobility + attributes.endurance;
        const utilitySpent = attributes.awareness + attributes.communication +
                            attributes.intelligence;

        return {
            combat: {
                spent: combatSpent,
                available: tier * 2,
                remaining: (tier * 2) - combatSpent
            },
            utility: {
                spent: utilitySpent,
                available: tier,
                remaining: tier - utilitySpent
            }
        };
    }

    // Calculate boon allocation status
    static calculateBoonAllocation(character) {
        const maxBoons = character.level;
        const currentBoons = character.boons.length;

        return {
            used: currentBoons,
            available: maxBoons,
            remaining: maxBoons - currentBoons
        };
    }

    // Calculate level progression info
    static calculateLevelProgression(level) {
        const tierTable = {
            1: { tier: 3, boons: 1 },
            2: { tier: 3, boons: 2 },
            3: { tier: 4, boons: 3 },
            4: { tier: 4, boons: 4 },
            5: { tier: 5, boons: 5 }
        };

        return tierTable[level] || { tier: 4, boons: 4 };
    }

    // Generate detailed stat breakdown for display
    static generateStatBreakdown(baseStats, archetypeStats, finalStats, character) {
        const breakdown = {};
        const mainStats = ['accuracy', 'damage', 'conditions', 'avoidance', 'durability',
                          'resolve', 'stability', 'vitality', 'movement', 'maxHP'];

        for (const stat of mainStats) {
            breakdown[stat] = {
                base: baseStats[stat] || 0,
                archetype: (archetypeStats[stat] || 0) - (baseStats[stat] || 0),
                boons: (finalStats[stat] || 0) - (archetypeStats[stat] || 0),
                total: finalStats[stat] || 0
            };
        }

        return breakdown;
    }

    // Get detailed stat breakdown with source information
    static getDetailedBreakdown(character, stat, gameData = {}) {
        const tier = character.tier;
        const attributes = character.attributes;
        const sources = [];

        // Base calculation components
        switch(stat) {
            case 'accuracy':
                sources.push({ source: 'Tier', value: tier });
                sources.push({ source: 'Focus', value: attributes.focus });
                break;
            case 'damage':
                sources.push({ source: 'Tier', value: tier });
                sources.push({ source: 'Power', value: attributes.power });
                break;
            case 'conditions':
                sources.push({ source: 'Tier', value: tier });
                sources.push({ source: 'Power', value: attributes.power });
                break;
            case 'avoidance':
                sources.push({ source: 'Base', value: 5 });
                sources.push({ source: 'Tier', value: tier });
                sources.push({ source: 'Mobility', value: attributes.mobility });
                break;
            case 'durability':
                sources.push({ source: 'Tier', value: tier });
                sources.push({ source: 'Endurance', value: attributes.endurance });
                break;
            case 'resolve':
                sources.push({ source: 'Base', value: 10 });
                sources.push({ source: 'Tier', value: tier });
                sources.push({ source: 'Focus', value: attributes.focus });
                break;
            case 'stability':
                sources.push({ source: 'Base', value: 10 });
                sources.push({ source: 'Tier', value: tier });
                sources.push({ source: 'Power', value: attributes.power });
                break;
            case 'vitality':
                sources.push({ source: 'Base', value: 10 });
                sources.push({ source: 'Tier', value: tier });
                sources.push({ source: 'Endurance', value: attributes.endurance });
                break;
            case 'movement':
                const baseMovement = Math.max(attributes.mobility + 6, attributes.mobility + tier);
                sources.push({ source: 'Base Movement', value: baseMovement });
                break;
            case 'maxHP':
                sources.push({ source: 'Base HP', value: 100 });
                break;
        }

        // Add archetype bonuses
        const archetypeBonuses = this.getArchetypeStatBonus(character, stat);
        if (archetypeBonuses.length > 0) {
            sources.push(...archetypeBonuses);
        }

        // Add boon bonuses
        const boonBonuses = this.getBoonStatBonus(character, stat, gameData);
        if (boonBonuses.length > 0) {
            sources.push(...boonBonuses);
        }

        return sources.filter(s => s.value !== 0);
    }

    // Get archetype contributions to a specific stat
    static getArchetypeStatBonus(character, stat) {
        const bonuses = [];
        const archetypes = character.archetypes;
        const tier = character.tier;

        // Movement archetype bonuses
        if (stat === 'movement') {
            switch(archetypes.movement) {
                case 'swift':
                    bonuses.push({ source: 'Swift Archetype', value: Math.ceil(tier / 2) });
                    break;
                case 'teleportation':
                    bonuses.push({ source: 'Teleportation Penalty', value: -2 });
                    break;
            }
        }

        // Defensive archetype bonuses
        switch(archetypes.defensive) {
            case 'iron_will':
                if (stat === 'resolve') {
                    bonuses.push({ source: 'Iron Will Archetype', value: tier * 2 });
                }
                break;
            case 'immovable':
                if (stat === 'stability') {
                    bonuses.push({ source: 'Immovable Archetype', value: tier * 2 });
                }
                break;
            case 'resilient':
                if (stat === 'vitality') {
                    bonuses.push({ source: 'Resilient Archetype', value: tier * 2 });
                }
                break;
        }

        return bonuses;
    }

    // Get boon contributions to a specific stat
    static getBoonStatBonus(character, stat, gameData = {}) {
        const bonuses = [];
        const boonData = gameData.boons || [];

        for (const boonId of character.boons) {
            const boon = boonData.find(b => b.id === boonId);
            if (!boon) continue;

            // Check for stat bonuses in boon effects
            if (boon.effects) {
                for (const effect of boon.effects) {
                    if (effect.type === 'stat_bonus' && effect.stat === stat) {
                        const bonus = this.evaluateBonus(effect.bonus, character.tier, character.attributes);
                        bonuses.push({ source: boon.name, value: bonus });
                    } else if (effect.type === 'stat_bonus' && effect.stat === 'all_resistances' &&
                              ['resolve', 'stability', 'vitality'].includes(stat)) {
                        const bonus = this.evaluateBonus(effect.bonus, character.tier, character.attributes);
                        bonuses.push({ source: `${boon.name} (All Resistances)`, value: bonus });
                    }
                }
            }

            // Check for drawback penalties
            if (boon.drawback) {
                if (boon.drawback === 'sickly' && stat === 'maxHP') {
                    bonuses.push({ source: `${boon.name} (Drawback)`, value: -30 });
                }
            }
        }

        return bonuses;
    }
}