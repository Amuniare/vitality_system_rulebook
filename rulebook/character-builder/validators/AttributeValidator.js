// AttributeValidator.js - Attribute assignment validation
export class AttributeValidator {
    // Validate all attribute assignments
    static validateAttributes(character) {
        const errors = [];
        const warnings = [];

        // Check tier maximums
        const tierValidation = this.validateTierMaximums(character);
        errors.push(...tierValidation.errors);

        // Check point pool spending
        const poolValidation = this.validatePointPools(character);
        errors.push(...poolValidation.errors);
        warnings.push(...poolValidation.warnings);

        // Check flaw restrictions
        const flawValidation = this.validateFlawRestrictions(character);
        errors.push(...flawValidation.errors);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Validate that no attribute exceeds tier
    static validateTierMaximums(character) {
        const errors = [];
        const tier = character.tier;

        Object.entries(character.attributes).forEach(([attribute, value]) => {
            if (value > tier) {
                errors.push(`${attribute} (${value}) cannot exceed tier maximum (${tier})`);
            }
            if (value < 0) {
                errors.push(`${attribute} cannot be negative`);
            }
        });

        return { errors };
    }

    // Validate point pool spending
    static validatePointPools(character) {
        const errors = [];
        const warnings = [];
        const tier = character.tier;

        // Combat attributes validation
        const combatAttributes = ['focus', 'mobility', 'power', 'endurance'];
        const combatSpent = combatAttributes.reduce((sum, attr) => 
            sum + (character.attributes[attr] || 0), 0);
        const combatAvailable = tier * 2;


        // Utility attributes validation
        const utilityAttributes = ['awareness', 'communication', 'intelligence'];
        const utilitySpent = utilityAttributes.reduce((sum, attr) => 
            sum + (character.attributes[attr] || 0), 0);
        const utilityAvailable = tier;

        return { errors, warnings };
    }

    // Validate flaw restrictions on attributes
    static validateFlawRestrictions(character) {
        const errors = [];

        // Check Balanced flaw
        const hasBalanced = character.mainPoolPurchases.flaws.some(flaw => flaw.flawId === 'balanced');
        if (hasBalanced) {
            const tier = character.tier;
            const minimumRequired = Math.floor(tier / 2);
            const combatAttributes = ['focus', 'mobility', 'power', 'endurance'];
            
            combatAttributes.forEach(attr => {
                const value = character.attributes[attr] || 0;
                if (value < minimumRequired) {
                    errors.push(`Balanced flaw requires at least ${minimumRequired} in ${attr}`);
                }
            });
        }

        // Check Weak flaw
        const hasWeak = character.mainPoolPurchases.flaws.some(flaw => flaw.flawId === 'weak');
        if (hasWeak) {
            const combatAttributes = ['focus', 'mobility', 'power', 'endurance'];
            const combatSpent = combatAttributes.reduce((sum, attr) => 
                sum + (character.attributes[attr] || 0), 0);
            const combatAvailable = (character.tier * 2) - 1; // -1 from Weak flaw
            
            if (combatSpent > combatAvailable) {
                errors.push(`Weak flaw reduces combat attributes by 1 point`);
            }
        }

        return { errors };
    }

    // Validate single attribute assignment
    static validateAttributeAssignment(character, attribute, newValue) {
        const errors = [];
        const warnings = [];

        // Check tier maximum
        if (newValue > character.tier) {
            errors.push(`${attribute} cannot exceed tier maximum of ${character.tier}`);
        }

        // Check minimum
        if (newValue < 0) {
            errors.push(`${attribute} cannot be negative`);
        }

        // Check point pool impact
        const tempCharacter = { ...character };
        tempCharacter.attributes = { ...character.attributes };
        tempCharacter.attributes[attribute] = newValue;

        const poolValidation = this.validatePointPools(tempCharacter);
        errors.push(...poolValidation.errors);

        // Check flaw restrictions
        const flawValidation = this.validateFlawRestrictions(tempCharacter);
        errors.push(...flawValidation.errors);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Get attribute recommendations based on archetypes
    static getAttributeRecommendations(character) {
        const recommendations = [];
        const archetypes = character.archetypes;

        // Movement archetype recommendations
        if (archetypes.movement === 'swift' || archetypes.movement === 'skirmisher') {
            recommendations.push({
                attribute: 'mobility',
                reason: 'Movement archetype benefits from high Mobility'
            });
        }

        // Attack type recommendations
        if (archetypes.attackType === 'singleTarget') {
            recommendations.push({
                attribute: 'focus',
                reason: 'Single Target benefits from Focus for accuracy'
            });
            recommendations.push({
                attribute: 'power',
                reason: 'Single Target benefits from Power for damage'
            });
        }

        // Effect type recommendations
        if (archetypes.effectType === 'damageSpecialist') {
            recommendations.push({
                attribute: 'power',
                reason: 'Damage Specialist should maximize Power'
            });
        } else if (archetypes.effectType === 'crowdControl') {
            recommendations.push({
                attribute: 'power',
                reason: 'Crowd Control needs Power for condition success'
            });
        }

        // Defensive archetype recommendations
        if (archetypes.defensive === 'resilient') {
            recommendations.push({
                attribute: 'endurance',
                reason: 'Resilient archetype stacks with Endurance'
            });
        }

        return recommendations;
    }

    // Check if attributes are efficiently allocated
    static analyzeAttributeEfficiency(character) {
        const analysis = {
            efficiency: 'good',
            suggestions: [],
            warnings: []
        };

        const tier = character.tier;
        const attrs = character.attributes;

        // Check for very low stats
        Object.entries(attrs).forEach(([attr, value]) => {
            if (value === 0 && tier >= 4) {
                analysis.suggestions.push(`Consider putting at least 1 point in ${attr}`);
            }
        });

        // Check for uneven distribution in combat stats
        const combatAttrs = [attrs.focus, attrs.mobility, attrs.power, attrs.endurance];
        const maxCombat = Math.max(...combatAttrs);
        const minCombat = Math.min(...combatAttrs);
        
        if (maxCombat - minCombat > tier) {
            analysis.warnings.push('Very uneven combat attribute distribution');
            analysis.efficiency = 'unbalanced';
        }

        return analysis;
    }
}