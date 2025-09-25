// file: modernApp/systems/EffectSystem.js
import { StateManager } from '../core/StateManager.js';
import { EntityLoader } from '../core/EntityLoader.js';

export class EffectSystem {

    /**
     * Gathers all active effects from a character's purchases.
     * @param {Object} character - The character object.
     * @returns {Array<Object>} - A flat array of all effect objects.
     */
    static getAllEffects(character) {
        const effects = [];

        // 1. Archetypes
        if (character.archetypes) {
            Object.values(character.archetypes).forEach(archetypeId => {
                if (!archetypeId) return;
                const entity = EntityLoader.getEntity(archetypeId);
                if (entity && entity.effects) {
                    effects.push(...entity.effects);
                }
            });
        }

        // 2. Traits, Flaws, Boons, etc.
        const purchaseArrays = ['traits', 'flaws', 'boons', 'features'];
        purchaseArrays.forEach(arrayName => {
            if (character[arrayName]) {
                character[arrayName].forEach(purchase => {
                    const entity = EntityLoader.getEntity(purchase.id);
                    if (entity && entity.effects) {
                        effects.push(...entity.effects);
                    }
                });
            }
        });

        // This can be expanded to include effects from special attacks, items, etc.

        return effects;
    }

    /**
     * Calculates the total modifier for a specific stat.
     * @param {string} statName - The name of the stat to calculate (e.g., 'movement', 'damage').
     * @param {Object} character - The character object.
     * @returns {number} - The total calculated modifier for the stat.
     */
    static calculateStatModifier(statName, character) {
        const allEffects = this.getAllEffects(character);
        let modifier = 0;

        allEffects.forEach(effect => {
            if (effect.type === 'stat_bonus' || effect.type === 'stat_penalty') {
                const isPenalty = effect.type === 'stat_penalty';
                let applies = false;
                
                if (Array.isArray(effect.target)) {
                    applies = effect.target.includes(statName);
                } else {
                    applies = effect.target === statName || effect.target === 'all_core_stats';
                }

                if (applies) {
                    let value = 0;
                    if (typeof effect.value === 'string') {
                        // Handle dynamic values like 'tier' or 'ceil(tier/2)'
                        value = this.evaluateDynamicValue(effect.value, character);
                    } else {
                        value = effect.value || 0;
                    }
                    
                    modifier += isPenalty ? -value : value;
                }
            }
        });

        return modifier;
    }

    /**
     * Evaluates a dynamic string value from an effect object.
     * @param {string} stringValue - The string to evaluate (e.g., 'tier', 'tier*5').
     * @param {Object} character - The character object for context.
     * @returns {number} - The calculated numeric value.
     */
    static evaluateDynamicValue(stringValue, character) {
        const { tier } = character;
        
        // Simple replacements
        stringValue = stringValue.replace(/tier/g, tier);

        try {
            // Use a safe evaluation method. For now, we'll handle simple cases.
            // A more robust solution might use a dedicated math expression parser.
            if (stringValue.includes('ceil')) {
                 // Handle something like 'ceil(tier/2)' -> 'Math.ceil(4/2)'
                return Math.ceil(eval(stringValue.replace(/ceil\((.*)\)/, '$1')));
            }
            if (stringValue.includes('*') || stringValue.includes('/') || stringValue.includes('+') || stringValue.includes('-')) {
                return eval(stringValue);
            }
            return parseFloat(stringValue) || 0;
        } catch (e) {
            console.error(`Could not evaluate dynamic value: ${stringValue}`, e);
            return 0;
        }
    }
}