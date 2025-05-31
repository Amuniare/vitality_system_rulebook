// BuildOrderValidator.js - Enforce creation order rules
export class BuildOrderValidator {
    // Validate that build order rules are followed
    static validateBuildOrder(character) {
        const errors = [];
        const warnings = [];

        // Check if archetypes are complete
        const archetypesComplete = this.areArchetypesComplete(character);
        
        // Check if attributes have been assigned
        const attributesAssigned = this.areAttributesAssigned(character);
        
        // Check if main pool purchases exist
        const mainPoolPurchases = this.hasMainPoolPurchases(character);
        
        // Check if special attacks exist
        const hasSpecialAttacks = character.specialAttacks.length > 0;

        // Rule 1: Cannot assign attributes without completing archetypes
        if (attributesAssigned && !archetypesComplete) {
            errors.push('Must complete all archetype selections before assigning attributes');
        }

        // Rule 2: Cannot make main pool purchases without attributes
        if (mainPoolPurchases && !attributesAssigned) {
            errors.push('Must assign attributes before making main pool purchases');
        }

        // Rule 3: Cannot create special attacks without main pool consideration
        if (hasSpecialAttacks && !archetypesComplete) {
            errors.push('Must complete archetypes before creating special attacks');
        }

        // Warnings for incomplete sections
        if (!archetypesComplete) {
            warnings.push('Complete all 7 archetype selections to proceed');
        } else if (!attributesAssigned) {
            warnings.push('Assign combat and utility attributes to continue build');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            buildState: {
                archetypesComplete,
                attributesAssigned,
                mainPoolPurchases,
                hasSpecialAttacks
            }
        };
    }

    // Check if all 7 archetype categories are selected
    static areArchetypesComplete(character) {
        const requiredArchetypes = [
            'movement', 'attackType', 'effectType', 'uniqueAbility', 
            'defensive', 'specialAttack', 'utility'
        ];
        
        return requiredArchetypes.every(category => 
            character.archetypes[category] !== null && 
            character.archetypes[category] !== undefined
        );
    }

    // Check if any attributes have been assigned
    static areAttributesAssigned(character) {
        return Object.values(character.attributes).some(value => value > 0);
    }

    // Check if any main pool purchases have been made
    static hasMainPoolPurchases(character) {
        return character.mainPoolPurchases.boons.length > 0 ||
               character.mainPoolPurchases.traits.length > 0 ||
               character.mainPoolPurchases.flaws.length > 0 ||
               character.mainPoolPurchases.primaryActionUpgrades.length > 0;
    }

    // Get next required step
    static getNextRequiredStep(character) {
        if (!this.areArchetypesComplete(character)) {
            return {
                step: 'archetypes',
                message: 'Complete all 7 archetype selections',
                missingArchetypes: this.getMissingArchetypes(character)
            };
        }
        
        if (!this.areAttributesAssigned(character)) {
            return {
                step: 'attributes',
                message: 'Assign combat and utility attribute points'
            };
        }
        
        return {
            step: 'complete',
            message: 'Basic character requirements complete'
        };
    }

    // Get list of missing archetype categories
    static getMissingArchetypes(character) {
        const requiredArchetypes = [
            'movement', 'attackType', 'effectType', 'uniqueAbility', 
            'defensive', 'specialAttack', 'utility'
        ];
        
        return requiredArchetypes.filter(category => 
            !character.archetypes[category]
        );
    }

    // Check if section can be modified based on build order
    static canModifySection(character, sectionName) {
        const buildState = this.validateBuildOrder(character).buildState;
        
        switch(sectionName) {
            case 'archetypes':
                return true; // Always can modify archetypes
            case 'attributes':
                return buildState.archetypesComplete;
            case 'mainPool':
                return buildState.attributesAssigned;
            case 'specialAttacks':
                return buildState.archetypesComplete; // Need archetype for SA rules
            case 'utility':
                return buildState.attributesAssigned; // Need attributes for utility pool
            default:
                return false;
        }
    }
}