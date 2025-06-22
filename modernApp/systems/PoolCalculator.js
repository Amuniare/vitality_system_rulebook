// modernApp/systems/PoolCalculator.js - COMPLETE FIX
import { StateManager } from '../core/StateManager.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { Logger } from '../utils/Logger.js'; // ✅ Import Logger

export class PoolCalculator {
    static calculatePools(character) {
        const tier = character.tier || 1;
        const pools = {
            main: this.calculateMainPool(character),
            limit: this.calculateLimitPool(character),
            combat: tier * 2,  // tier × 2 points for combat attributes
            utility: tier,     // tier points for utility attributes
            combatUsed: this.calculateCombatUsed(character),
            utilityUsed: this.calculateUtilityUsed(character)
        };

        pools.mainUsed = this.calculateMainPoolUsed(character);
        pools.mainRemaining = pools.main - pools.mainUsed;
        pools.combatRemaining = pools.combat - pools.combatUsed;
        pools.utilityRemaining = pools.utility - pools.utilityUsed;

        return pools;
    }

    // ✅ FIXED: Correct main pool formula (tier-2) × 15
    static calculateMainPool(character) {
        const tier = character.tier || 1;
        
        // ✅ CORRECT FORMULA: (tier-2) × 15, minimum 0
        let basePool = Math.max(0, (tier - 2) * 15);

        // Check for special archetypes that modify pool
        const uniqueAbility = character.archetypes?.uniqueAbility;
        if (uniqueAbility) {
            const archetype = EntityLoader.getEntity(uniqueAbility);
            if (archetype?.effects) {
                archetype.effects.forEach(effect => {
                    if (effect.type === 'pool_mod' && effect.target === 'main') {
                        if (typeof effect.value === 'string') {
                            const formula = effect.value.replace(/tier/g, tier);
                            try {
                                const modifier = eval(formula);
                                basePool += modifier;
                            } catch (e) {
                                // ✅ Use Logger
                                Logger.error('[PoolCalculator] Error evaluating pool formula:', e);
                            }
                        } else {
                            basePool += effect.value;
                        }
                    }
                });
            }
        }

        return basePool;
    }

    static calculateMainPoolUsed(character) {
        let used = 0;

        // Flaws COST 30 points each
        if (character.flaws) {
            used += character.flaws.length * 30;
        }

        // Traits COST 30 points each
        if (character.traits) {
            used += character.traits.length * 30;
        }

        // Boons cost variable amounts
        if (character.boons) {
            character.boons.forEach(boon => {
                const entity = EntityLoader.getEntity(boon.id);
                used += entity?.cost?.value || 0;
            });
        }

        // Actions cost variable amounts
        if (character.actions) {
            character.actions.forEach(action => {
                const entity = EntityLoader.getEntity(action.id);
                used += entity?.cost?.value || 0;
            });
        }

        return used;
    }

    static calculateCombatUsed(character) {
        const combatAttributes = ['focus', 'mobility', 'power', 'endurance'];
        return combatAttributes.reduce((total, attr) => 
            total + (character.attributes?.[attr] || 0), 0
        );
    }

    static calculateUtilityUsed(character) {
        const utilityAttributes = ['awareness', 'communication', 'intelligence'];
        return utilityAttributes.reduce((total, attr) => 
            total + (character.attributes?.[attr] || 0), 0
        );
    }

    static calculateLimitPool(character) {
        // Placeholder for limit pool calculation
        return 0;
    }
}