// CharacterValidator.js - Master validation orchestrator
import { ArchetypeValidator } from './ArchetypeValidator.js';
import { AttributeValidator } from './AttributeValidator.js';
import { BuildOrderValidator } from './BuildOrderValidator.js';
import { SpecialAttackValidator } from './SpecialAttackValidator.js';

export class CharacterValidator {
    // Master validation that checks all aspects
    static validateCharacter(character) {
        const results = {
            isValid: true,
            errors: [],
            warnings: [],
            sections: {
                buildOrder: { isValid: true, errors: [], warnings: [] },
                archetypes: { isValid: true, errors: [], warnings: [] },
                attributes: { isValid: true, errors: [], warnings: [] },
                specialAttacks: { isValid: true, errors: [], warnings: [] },
                pointPools: { isValid: true, errors: [], warnings: [] }
            }
        };

        // 1. Build Order Validation (most important)
        const buildOrderResults = BuildOrderValidator.validateBuildOrder(character);
        results.sections.buildOrder = buildOrderResults;
        if (!buildOrderResults.isValid) {
            results.isValid = false;
            results.errors.push(...buildOrderResults.errors);
        }

        // 2. Archetype Validation
        const archetypeResults = ArchetypeValidator.validateArchetypes(character);
        results.sections.archetypes = archetypeResults;
        if (!archetypeResults.isValid) {
            results.isValid = false;
            results.errors.push(...archetypeResults.errors);
        }
        results.warnings.push(...archetypeResults.warnings);

        // 3. Attribute Validation
        const attributeResults = AttributeValidator.validateAttributes(character);
        results.sections.attributes = attributeResults;
        if (!attributeResults.isValid) {
            results.isValid = false;
            results.errors.push(...attributeResults.errors);
        }
        results.warnings.push(...attributeResults.warnings);

        // 4. Special Attack Validation
        const specialAttackResults = SpecialAttackValidator.validateSpecialAttacks(character);
        results.sections.specialAttacks = specialAttackResults;
        if (!specialAttackResults.isValid) {
            results.isValid = false;
            results.errors.push(...specialAttackResults.errors);
        }
        results.warnings.push(...specialAttackResults.warnings);

        // 5. Point Pool Validation
        const pointPoolResults = this.validatePointPools(character);
        results.sections.pointPools = pointPoolResults;
        if (!pointPoolResults.isValid) {
            results.isValid = false;
            results.errors.push(...pointPoolResults.errors);
        }
        results.warnings.push(...pointPoolResults.warnings);

        return results;
    }

    // Validate all point pools are within limits
    static validatePointPools(character) {
        const errors = [];
        const warnings = [];
        const tier = character.tier;

        // Combat Attributes Pool
        const combatSpent = Object.entries(character.attributes)
            .filter(([attr]) => ['focus', 'mobility', 'power', 'endurance'].includes(attr))
            .reduce((sum, [, value]) => sum + value, 0);
        const combatAvailable = tier * 2;
        
        if (combatSpent > combatAvailable) {
            errors.push(`Combat attributes over budget: ${combatSpent}/${combatAvailable}`);
        }

        // Utility Attributes Pool
        const utilitySpent = Object.entries(character.attributes)
            .filter(([attr]) => ['awareness', 'communication', 'intelligence'].includes(attr))
            .reduce((sum, [, value]) => sum + value, 0);
        const utilityAvailable = tier;
        
        if (utilitySpent > utilityAvailable) {
            errors.push(`Utility attributes over budget: ${utilitySpent}/${utilityAvailable}`);
        }

        // Main Pool
        const mainPoolSpent = this.calculateMainPoolSpent(character);
        const mainPoolAvailable = this.calculateMainPoolAvailable(character);
        
        if (mainPoolSpent > mainPoolAvailable) {
            errors.push(`Main pool over budget: ${mainPoolSpent}/${mainPoolAvailable}`);
        }

        // Special Attack Validation
        character.specialAttacks.forEach((attack, index) => {
            if (attack.upgradePointsSpent > attack.upgradePointsAvailable) {
                errors.push(`Special Attack ${index + 1} over budget: ${attack.upgradePointsSpent}/${attack.upgradePointsAvailable}`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Calculate main pool points spent
    static calculateMainPoolSpent(character) {
        let spent = 0;
        
        // Boons
        spent += character.mainPoolPurchases.boons.reduce((sum, boon) => sum + (boon.cost || 0), 0);
        
        // Traits
        spent += character.mainPoolPurchases.traits.reduce((sum, trait) => sum + (trait.cost || 0), 0);
        
        // Primary action upgrades
        spent += character.mainPoolPurchases.primaryActionUpgrades.length * 30;
        
        return spent;
    }

    // Calculate main pool points available
    static calculateMainPoolAvailable(character) {
        const tier = character.tier;
        let available = Math.max(0, (tier - 2) * 15);
        
        // Extraordinary archetype doubles main pool
        if (character.archetypes.uniqueAbility === 'extraordinary') {
            available += Math.max(0, (tier - 2) * 15);
        }
        
        // Flaws give bonus points
        available += character.mainPoolPurchases.flaws.length * 30;
        
        return available;
    }


    
    // Quick validation for UI feedback
    static validateSection(character, sectionName) {
        switch(sectionName) {
            case 'archetypes':
                return ArchetypeValidator.validateArchetypes(character);
            case 'attributes':
                return AttributeValidator.validateAttributes(character);
            case 'specialAttacks':
                return SpecialAttackValidator.validateSpecialAttacks(character);
            case 'buildOrder':
                return BuildOrderValidator.validateBuildOrder(character);
            default:
                return { isValid: true, errors: [], warnings: [] };
        }
    }

    // Check if character is ready for export
    static validateForExport(character) {
        const validation = this.validateCharacter(character);
        
        // Additional export-specific checks
        if (!character.name || character.name.trim() === '') {
            validation.errors.push('Character must have a name');
            validation.isValid = false;
        }

        if (character.tier < 1 || character.tier > 10) {
            validation.errors.push('Character tier must be between 1 and 10');
            validation.isValid = false;
        }

        return validation;
    }
}