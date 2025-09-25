// modernApp/systems/PoolCalculator.js - COMPLETE FIX
import { StateManager } from '../core/StateManager.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { Logger } from '../utils/Logger.js'; // ✅ Import Logger

export class PoolCalculator {
    static calculatePools() { // Parameter 'character' removed
        const character = StateManager.getCharacter(); // Fetch character internally
        
        // Add a robust guard to handle cases where character might be null or missing tier
        // This can happen if StateManager.getCharacter() returns a default/empty structure
        // or if the character object isn't fully populated yet.
        if (!character || typeof character.tier === 'undefined') { 
            Logger.warn('[PoolCalculator] Character data not fully available or tier is undefined for pool calculation. Using defaults.');
            // Return a default structure to prevent further errors
            return { 
                main: 0, mainUsed: 0, mainRemaining: 0,
                limit: 0, 
                combat: 0, combatUsed: 0, combatRemaining: 0,
                utility: 0, utilityUsed: 0, utilityRemaining: 0
            };
        }

        const tier = character.tier; // No need for `|| 1` due to the guard above
        const pools = {
            main: this.calculateMainPool(character), // Pass character to sub-methods
            limit: this.calculateLimitPool(character), // Pass character to sub-methods
            combat: tier * 2,
            utility: tier,
            combatUsed: this.calculateCombatUsed(character), // Pass character to sub-methods
            utilityUsed: this.calculateUtilityUsed(character) // Pass character to sub-methods
        };

        pools.mainUsed = this.calculateMainPoolUsed(character); // Pass character to sub-methods
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



        if (character.action_upgrades) {
            character.action_upgrades.forEach(upgrade => {
                const entity = EntityLoader.getEntity(upgrade.id); // Assuming 'upgrade.id' is the entity definition ID
                if (entity && entity.cost && entity.cost.pool === 'main') { // Ensure it's a main pool cost
                    used += entity.cost.value || 0;
                }
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