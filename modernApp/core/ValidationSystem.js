
// modernApp/core/ValidationSystem.js
import { Logger } from '../utils/Logger.js';
import { PoolCalculator } from '../systems/PoolCalculator.js';
import { RequirementSystem } from '../systems/RequirementSystem.js';
import { EntityLoader } from './EntityLoader.js';

export class ValidationSystem {

    /**
     * Performs advisory validation on the entire character.
     * @param {Object} character - The character object from StateManager.
     * @returns {Array<Object>} - An array of warning objects, e.g., { type: 'budget', pool: 'main', message: '...' }
     */
    static validateCharacter(character) {
        if (!character) {
            Logger.warn('[ValidationSystem] validateCharacter called with no character data.');
            return [];
        }
        Logger.debug('[ValidationSystem] Starting character validation for:', character.name);
        const warnings = [];

        // 1. Validate Point Pools
        const pools = PoolCalculator.calculatePools(character);
        for (const poolKey of ['main', 'combat', 'utility']) {
            if (pools[poolKey + 'Remaining'] < 0) {
                warnings.push({
                    type: 'budget',
                    pool: poolKey,
                    message: `You are over budget by ${Math.abs(pools[poolKey + 'Remaining'])} points in the ${poolKey} pool.`
                });
            }
        }
        // TODO: Add limit pool validation if/when it's implemented

        // 2. Validate Purchased Entities' Requirements
        const purchaseCategories = ['flaws', 'traits', 'boons', 'action_upgrades', 'features', 'senses', 'movement_features', 'descriptors', 'unique_abilities_purchased']; 
        // Add 'special_attacks_created' if they have requirements
        
        purchaseCategories.forEach(categoryKey => {
            if (character[categoryKey] && Array.isArray(character[categoryKey])) {
                character[categoryKey].forEach(purchase => {
                    const entity = EntityLoader.getEntity(purchase.id);
                    if (entity && entity.requirements) {
                        const reqCheck = RequirementSystem.check(entity.requirements, character);
                        if (!reqCheck.areMet) {
                            warnings.push({
                                type: 'requirement',
                                entityName: entity.name,
                                entityId: entity.id,
                                message: `Purchased item "${entity.name}" no longer meets requirements: ${reqCheck.unmet.join(', ')}.`
                            });
                        }
                    }
                });
            }
        });
        
        // 3. Validate Archetype Constraints (Example - can be expanded)
        const specialAttackArchetypeId = character.archetypes?.specialAttack;
        if (specialAttackArchetypeId) {
            const saArchetype = EntityLoader.getEntity(specialAttackArchetypeId);
            if (saArchetype?.id === 'archetype_specialAttack_paragon' && (character.limits_selected?.length > 0)) { // Assuming 'limits_selected' array
                 warnings.push({
                    type: 'archetype_constraint',
                    archetypeName: saArchetype.name,
                    message: `Paragon archetype selected, but Limits are also taken. Paragons cannot take Limits.`
                });
            }
            // Add more archetype specific rule checks here
        }


        if (warnings.length > 0) {
            Logger.warn('[ValidationSystem] Character validation found warnings:', warnings);
        } else {
            Logger.info('[ValidationSystem] Character validation passed with no warnings.');
        }
        return warnings;
    }
}
