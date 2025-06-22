// file: modernApp/systems/RequirementSystem.js
import { StateManager } from '../core/StateManager.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { Logger } from '../utils/Logger.js'; // ✅ Import Logger

export class RequirementSystem {

    /**
     * Checks if a list of requirements are met by the character.
     * @param {Array<Object>} requirements - The array of requirement objects from an entity.
     * @param {Object} character - The character object from StateManager.
     * @returns {{areMet: boolean, unmet: Array<string>}} - An object indicating if all requirements are met and a list of unmet requirement display texts.
     */
    static check(requirements, character) {
        if (!requirements || requirements.length === 0) {
            return { areMet: true, unmet: [] };
        }

        const unmet = [];

        for (const req of requirements) {
            if (!this.isMet(req, character)) {
                unmet.push(req.display || `Requires ${req.type}: ${req.value}`);
            }
        }

        return {
            areMet: unmet.length === 0,
            unmet: unmet
        };
    }

    /**
     * Checks a single requirement object.
     * @param {Object} requirement - The requirement object.
     * @param {Object} character - The character object.
     * @returns {boolean} - True if the requirement is met, false otherwise.
     */
    static isMet(requirement, character) {
        switch (requirement.type) {
            case 'tier':
                return character.tier >= (requirement.min || requirement.value);

            case 'archetype':
                // Checks if the character has a specific archetype selected in a category.
                return character.archetypes[requirement.category] === requirement.value;

            case 'upgrade':
            case 'entity':
                // Checks if the character has purchased a specific entity/upgrade.
                // This requires searching through all purchase arrays.
                const allPurchases = [
                    ...(character.traits || []),
                    ...(character.flaws || []),
                    ...(character.boons || []),
                    ...(character.actions || []),
                    ...(character.features || []),
                    ...(character.senses || []),
                    // Note: This needs to be expanded as more purchase types are added.
                ];
                return allPurchases.some(p => p.id === requirement.value);

            case 'rule':
                // For complex, non-standard rules. These are often informational for the player.
                // The system is advisory, so these don't block purchase but are important for UI display.
                return true;
            
            case 'archetype_discount':
                 // This is not a blocking requirement, but a cost modifier. Handled by purchase system.
                return true;

            default:
                // ✅ Use Logger
                Logger.warn(`[RequirementSystem] Unknown requirement type encountered: ${requirement.type}`);
                return true; // Default to true to avoid blocking valid purchases unnecessarily.
        }
    }
}