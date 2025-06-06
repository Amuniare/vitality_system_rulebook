// CombatCalculator.js - Combat resolution and damage calculations
import { DiceSystem } from '../core/DiceSystem.js';
import { GameConstants } from '../core/GameConstants.js';
import { StatCalculator } from './StatCalculator.js';

export class CombatCalculator {
    // Calculate attack resolution
    static resolveAttack(attacker, defender, attack, options = {}) {
        const attackerStats = StatCalculator.calculateAllStats(attacker).final;
        const defenderStats = StatCalculator.calculateAllStats(defender).final;
        
        const resolution = {
            attacker: attacker.name,
            defender: defender.name,
            attack: attack.name,
            steps: [],
            results: {
                hit: false,
                damage: 0,
                conditions: [],
                critical: false
            }
        };
        
        // Step 1: Accuracy Check
        const accuracyCheck = this.resolveAccuracy(attackerStats, defenderStats, attack, options);
        resolution.steps.push(accuracyCheck);
        resolution.results.hit = accuracyCheck.success;
        resolution.results.critical = accuracyCheck.critical;
        
        if (!accuracyCheck.success) {
            resolution.steps.push({ type: 'miss', message: 'Attack missed' });
            return resolution;
        }
        
        // Step 2: Damage Resolution (if applicable)
        if (attack.effectTypes.includes('damage') || attack.effectTypes.includes('hybrid')) {
            const damageCheck = this.resolveDamage(attackerStats, defenderStats, attack, accuracyCheck.critical, options);
            resolution.steps.push(damageCheck);
            resolution.results.damage = damageCheck.finalDamage;
        }
        
        // Step 3: Condition Resolution (if applicable)
        if (attack.effectTypes.includes('condition') || attack.effectTypes.includes('hybrid')) {
            const conditionCheck = this.resolveConditions(attackerStats, defenderStats, attack, accuracyCheck.critical, options);
            resolution.steps.push(conditionCheck);
            resolution.results.conditions = conditionCheck.appliedConditions;
        }
        
        // Step 4: Special Effects (upgrades, critical effects, etc.)
        const specialEffects = this.resolveSpecialEffects(attacker, defender, attack, resolution.results, options);
        resolution.steps.push(...specialEffects);
        
        return resolution;
    }
    
    // Resolve accuracy check
    static resolveAccuracy(attackerStats, defenderStats, attack, options = {}) {
        const baseAccuracy = attackerStats.accuracy;
        const targetAvoidance = defenderStats.avoidance;
        
        // Apply attack type bonuses/penalties
        let accuracyBonus = 0;
        let accuracyPenalty = 0;
        
        // Melee bonus (if applicable)
        if (attack.attackTypes.includes('melee_ac') || attack.attackTypes.includes('melee_dg_cn')) {
            if (attack.attackTypes.includes('melee_ac')) {
                accuracyBonus += attackerStats.tier; // Melee AC bonus
            }
        }
        
        // Ranged penalty (if adjacent)
        if (attack.attackTypes.includes('ranged') && options.isAdjacent) {
            accuracyPenalty += attackerStats.tier;
        }
        
        // Direct attacks auto-hit
        if (attack.attackTypes.includes('direct')) {
            return {
                type: 'accuracy',
                success: true,
                autoHit: true,
                critical: false,
                message: 'Direct attack auto-hits'
            };
        }
        
        // Area attack penalty
        if (attack.attackTypes.includes('area')) {
            accuracyPenalty += attackerStats.tier;
        }
        
        // Hybrid penalty
        if (attack.isHybrid) {
            accuracyPenalty += attackerStats.tier;
        }
        
        // Apply upgrade bonuses
        const upgradeBonus = this.calculateUpgradeBonuses(attack, 'accuracy');
        
        // Roll accuracy
        const roll = DiceSystem.rollD20();
        const totalAccuracy = baseAccuracy + accuracyBonus + upgradeBonus - accuracyPenalty;
        const finalRoll = roll + totalAccuracy;
        
        const success = finalRoll >= targetAvoidance;
        const critical = roll === 20;
        
        return {
            type: 'accuracy',
            roll,
            baseAccuracy,
            bonuses: accuracyBonus + upgradeBonus,
            penalties: accuracyPenalty,
            totalAccuracy,
            finalRoll,
            targetAvoidance,
            success,
            critical,
            message: success ? 
                (critical ? 'Critical hit!' : 'Attack hits') : 
                'Attack misses'
        };
    }
    
    // Resolve damage
    static resolveDamage(attackerStats, defenderStats, attack, isCritical, options = {}) {
        const baseDamage = attackerStats.damage;
        const targetDurability = defenderStats.durability;
        
        // Apply attack type bonuses/penalties
        let damageBonus = 0;
        let damagePenalty = 0;
        
        // Melee bonus (if applicable - alternative to accuracy bonus)
        if ((attack.attackTypes.includes('melee_ac') || attack.attackTypes.includes('melee_dg_cn')) && !options.meleeAccuracyBonus) {
            if (attack.attackTypes.includes('melee_dg_cn')) {
                damageBonus += attackerStats.tier; // Melee DG/CN bonus
            }
        }
        
        // Direct attack penalty
        if (attack.attackTypes.includes('direct')) {
            damagePenalty += attackerStats.tier;
        }
        
        // Area attack penalty
        if (attack.attackTypes.includes('area')) {
            damagePenalty += attackerStats.tier;
        }
        
        // Hybrid penalty
        if (attack.isHybrid) {
            damagePenalty += attackerStats.tier;
        }
        
        // Apply upgrade bonuses
        const upgradeBonus = this.calculateUpgradeBonuses(attack, 'damage');
        
        // Roll damage
        const diceRoll = DiceSystem.rollDamage();
        let totalDamage = diceRoll + baseDamage + damageBonus + upgradeBonus - damagePenalty;
        
        // Critical hit bonus
        if (isCritical) {
            totalDamage += attackerStats.tier; // Add tier again for critical
        }
        
        // Apply damage reduction
        const finalDamage = Math.max(0, totalDamage - targetDurability);
        
        return {
            type: 'damage',
            diceRoll,
            baseDamage,
            bonuses: damageBonus + upgradeBonus + (isCritical ? attackerStats.tier : 0),
            penalties: damagePenalty,
            totalDamage,
            targetDurability,
            finalDamage,
            message: `Deals ${finalDamage} damage (${totalDamage} - ${targetDurability} DR)`
        };
    }
    
    // Resolve conditions
    static resolveConditions(attackerStats, defenderStats, attack, isCritical, options = {}) {
        const baseConditions = attackerStats.conditions;
        const appliedConditions = [];
        
        // Apply attack type penalties
        let conditionPenalty = 0;
        
        if (attack.attackTypes.includes('direct') || attack.attackTypes.includes('area')) {
            conditionPenalty += attackerStats.tier;
        }
        
        if (attack.isHybrid) {
            conditionPenalty += attackerStats.tier;
        }
        
        // Apply upgrade bonuses
        const upgradeBonus = this.calculateUpgradeBonuses(attack, 'condition');
        
        // Resolve each condition
        const allConditions = [...(attack.basicConditions || []), ...(attack.advancedConditions || [])];
        
        allConditions.forEach(conditionId => {
            const conditionData = this.getConditionData(conditionId);
            if (!conditionData) return;
            
            // Get target resistance
            const targetResistance = this.getTargetResistance(defenderStats, conditionData.resistance, attackerStats);
            
            // Roll condition
            const roll = DiceSystem.rollD20();
            const totalCondition = roll + baseConditions + upgradeBonus - conditionPenalty;
            
            // Critical condition bonus
            if (isCritical) {
                totalCondition += attackerStats.tier;
            }
            
            const success = totalCondition >= targetResistance;
            
            if (success) {
                appliedConditions.push({
                    id: conditionId,
                    name: conditionData.name,
                    roll,
                    total: totalCondition,
                    resistance: targetResistance,
                    success: true
                });
            }
        });
        
        return {
            type: 'conditions',
            baseConditions,
            bonuses: upgradeBonus + (isCritical ? attackerStats.tier : 0),
            penalties: conditionPenalty,
            appliedConditions,
            message: appliedConditions.length > 0 ? 
                `Applied: ${appliedConditions.map(c => c.name).join(', ')}` :
                'No conditions applied'
        };
    }
    
    // Get condition data
    static getConditionData(conditionId) {
        // This would pull from a conditions database
        const basicConditions = {
            disarm: { name: 'Disarm', resistance: 'stability', duration: 'end_of_next_turn' },
            grab: { name: 'Grab', resistance: 'stability', duration: 'until_broken' },
            shove: { name: 'Shove', resistance: 'stability', duration: 'instant' },
            prone: { name: 'Prone', resistance: 'stability', duration: 'until_stood_up' },
            blind: { name: 'Blind', resistance: 'vitality', duration: 'end_of_next_turn' },
            daze: { name: 'Daze', resistance: 'vitality', duration: 'end_of_next_turn' },
            misdirect: { name: 'Misdirect', resistance: 'resolve', duration: 'end_of_next_turn' },
            setup: { name: 'Setup', resistance: 'resolve', duration: 'next_attack' },
            taunt: { name: 'Taunt', resistance: 'resolve', duration: 'end_of_next_turn' }
        };
        
        const advancedConditions = {
            control: { name: 'Control', resistance: 'resolve', duration: 'start_of_next_turn' },
            capture: { name: 'Capture', resistance: 'stability', duration: 'start_of_next_turn' },
            stun: { name: 'Stun', resistance: 'resolve_or_vitality', duration: 'start_of_next_turn' },
            weaken: { name: 'Weaken', resistance: 'vitality', duration: 'permanent' },
            disableSpecials: { name: 'Disable Specials', resistance: 'resolve_or_vitality', duration: 'start_of_next_turn' },
            frighten: { name: 'Frighten', resistance: 'resolve', duration: 'start_of_next_turn' },
            enthrall: { name: 'Enthrall', resistance: 'resolve', duration: 'start_of_next_turn' },
            frenzy: { name: 'Frenzy', resistance: 'resolve', duration: 'start_of_next_turn' }
        };
        
        return basicConditions[conditionId] || advancedConditions[conditionId];
    }
    
    // Get target resistance value
    static getTargetResistance(defenderStats, resistanceType, attackerStats) {
        // Handle boon effects that change targeting
        if (attackerStats.conditionTargeting) {
            resistanceType = attackerStats.conditionTargeting;
        }
        
        switch(resistanceType) {
            case 'resolve':
                return defenderStats.resolve;
            case 'stability':
                return defenderStats.stability;
            case 'vitality':
                return defenderStats.vitality;
            case 'resolve_or_vitality':
                return Math.min(defenderStats.resolve, defenderStats.vitality);
            default:
                return defenderStats.resolve; // Default fallback
        }
    }
    
    // Calculate upgrade bonuses for specific type
    static calculateUpgradeBonuses(attack, type) {
        let bonus = 0;
        
        // This would need to check the actual upgrades on the attack
        // and calculate their bonuses based on type
        
        attack.upgrades?.forEach(upgrade => {
            const upgradeData = this.getUpgradeData(upgrade.id);
            if (upgradeData && upgradeData.affects === type) {
                bonus += upgradeData.bonus || 0;
            }
        });
        
        return bonus;
    }
    
    // Get upgrade data (simplified)
    static getUpgradeData(upgradeId) {
        // This would pull from upgrades database
        const upgrades = {
            accurateAttack: { affects: 'accuracy', bonus: 'tier_half' },
            powerAttack: { affects: 'damage', bonus: 'tier' },
            enhancedCondition: { affects: 'condition', bonus: 2 }
            // Add more upgrade definitions
        };
        
        return upgrades[upgradeId];
    }
    
    // Resolve special effects from upgrades
    static resolveSpecialEffects(attacker, defender, attack, results, options) {
        const effects = [];
        
        // Check for special upgrade effects
        attack.upgrades?.forEach(upgrade => {
            const effect = this.resolveUpgradeEffect(upgrade.id, attacker, defender, attack, results, options);
            if (effect) {
                effects.push(effect);
            }
        });
        
        return effects;
    }
    
    // Resolve individual upgrade effect
    static resolveUpgradeEffect(upgradeId, attacker, defender, attack, results, options) {
        switch(upgradeId) {
            case 'doubleTap':
                if (results.hit && results.critical) {
                    return {
                        type: 'special',
                        upgrade: 'Double-Tap',
                        message: 'Critical hit triggers second attack',
                        secondaryAttack: true
                    };
                }
                break;
                
            case 'ricochet':
                if (results.hit && results.critical) {
                    return {
                        type: 'special',
                        upgrade: 'Ricochet',
                        message: 'Critical hit bounces to nearby enemy',
                        bounceAttack: true
                    };
                }
                break;
                
            case 'explosiveCritical':
                if (results.critical) {
                    return {
                        type: 'special',
                        upgrade: 'Explosive Critical',
                        message: 'Critical hit creates AOE explosion',
                        aoeExplosion: true
                    };
                }
                break;
                
            case 'leech':
                if (results.damage > 0) {
                    const healing = Math.floor(results.damage / 2);
                    return {
                        type: 'special',
                        upgrade: 'Leech',
                        message: `Heals ${healing} HP from damage dealt`,
                        healing
                    };
                }
                break;
                
            // Add more upgrade effects
        }
        
        return null;
    }
    
    // Calculate damage over time effects
    static calculateDamageOverTime(character, effect) {
        const effects = [];
        
        // Check for bleeding effects, poison, etc.
        if (effect.type === 'bleed') {
            effects.push({
                name: 'Bleed',
                damage: effect.damage,
                duration: effect.duration,
                source: effect.source
            });
        }
        
        return effects;
    }
    
    // Simulate combat round
    static simulateCombatRound(combatants, actions) {
        const results = {
            initiative: [],
            actions: [],
            endOfRound: []
        };
        
        // Step 1: Roll initiative
        combatants.forEach(combatant => {
            const initiativeRoll = DiceSystem.calculateInitiative(combatant);
            results.initiative.push({
                name: combatant.name,
                roll: initiativeRoll.roll,
                total: initiativeRoll.total,
                combatant
            });
        });
        
        // Sort by initiative
        results.initiative.sort((a, b) => b.total - a.total);
        
        // Step 2: Resolve actions in initiative order
        results.initiative.forEach(initiativeResult => {
            const combatant = initiativeResult.combatant;
            const action = actions[combatant.id];
            
            if (action) {
                const actionResult = this.resolveAction(combatant, action, combatants);
                results.actions.push(actionResult);
            }
        });
        
        // Step 3: End of round effects
        combatants.forEach(combatant => {
            const endOfRoundEffects = this.processEndOfRoundEffects(combatant);
            if (endOfRoundEffects.length > 0) {
                results.endOfRound.push({
                    combatant: combatant.name,
                    effects: endOfRoundEffects
                });
            }
        });
        
        return results;
    }
    
    // Resolve a single action
    static resolveAction(actor, action, allCombatants) {
        switch(action.type) {
            case 'attack':
                const target = allCombatants.find(c => c.id === action.targetId);
                if (target) {
                    return this.resolveAttack(actor, target, action.attack, action.options);
                }
                break;
                
            case 'move':
                return this.resolveMovement(actor, action.destination, action.options);
                
            case 'defend':
                return this.resolveDefensiveAction(actor, action.defensiveType);
                
            // Add other action types
        }
        
        return { type: 'unknown', message: 'Unknown action type' };
    }
    
    // Process end of round effects
    static processEndOfRoundEffects(combatant) {
        const effects = [];
        
        // Process ongoing conditions
        if (combatant.conditions) {
            combatant.conditions.forEach(condition => {
                if (condition.duration === 'end_of_round') {
                    effects.push({
                        type: 'condition_expires',
                        condition: condition.name
                    });
                }
            });
        }
        
        // Process damage over time
        if (combatant.damageOverTime) {
            combatant.damageOverTime.forEach(dot => {
                effects.push({
                    type: 'damage_over_time',
                    source: dot.source,
                    damage: dot.damage
                });
            });
        }
        
        return effects;
    }
}