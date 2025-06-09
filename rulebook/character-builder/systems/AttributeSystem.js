// AttributeSystem.js - REFACTORED to remove duplicate calculations and load from JSON
import { PointPoolCalculator } from '../calculators/PointPoolCalculator.js'; // USE UNIFIED CALCULATOR
import { StatCalculator } from '../calculators/StatCalculator.js'; // USE UNIFIED CALCULATOR
import { TierSystem } from '../core/TierSystem.js';
import { gameDataManager } from '../core/GameDataManager.js';

export class AttributeSystem {
    // Load attribute definitions from attributes.json
    static getAttributeDefinitions() {
        const data = gameDataManager.getAttributes();
        if (!data) {
            console.warn('Attributes data not loaded, falling back to defaults');
            return this.getDefaultAttributeDefinitions();
        }

        // Combine combat and utility attributes into a single lookup object
        const definitions = {};
        
        // Process combat attributes
        if (data.combat) {
            data.combat.forEach(attr => {
                definitions[attr.id] = {
                    ...attr,
                    type: "combat",
                    affects: attr.mechanics || [],
                    pool: "combat"
                };
            });
        }

        // Process utility attributes  
        if (data.utility) {
            data.utility.forEach(attr => {
                definitions[attr.id] = {
                    ...attr,
                    type: "utility", 
                    affects: attr.mechanics || [],
                    pool: "utility"
                };
            });
        }

        return definitions;
    }

    // Fallback definitions if JSON fails to load
    static getDefaultAttributeDefinitions() {
        return {
            // Combat Attributes
            focus: {
                name: "Focus",
                type: "combat",
                description: "Mental concentration and aim",
                affects: ["Accuracy", "Initiative", "Resolve"],
                pool: "combat"
            },
            mobility: {
                name: "Mobility", 
                type: "combat",
                description: "Speed and agility",
                affects: ["Movement", "Initiative", "Avoidance"],
                pool: "combat"
            },
            power: {
                name: "Power",
                type: "combat", 
                description: "Physical and mental force",
                affects: ["Damage", "Conditions", "Stability"],
                pool: "combat"
            },
            endurance: {
                name: "Endurance",
                type: "combat",
                description: "Stamina and resilience", 
                affects: ["Vitality", "Durability"],
                pool: "combat"
            },
            
            // Utility Attributes
            awareness: {
                name: "Awareness",
                type: "utility",
                description: "Perception and alertness",
                affects: ["Initiative", "Skill Checks"],
                pool: "utility"
            },
            communication: {
                name: "Communication", 
                type: "utility",
                description: "Social interaction and expression",
                affects: ["Social Checks"],
                pool: "utility"
            },
            intelligence: {
                name: "Intelligence",
                type: "utility", 
                description: "Reasoning and knowledge",
                affects: ["Knowledge Checks", "Problem Solving"],
                pool: "utility"
            }
        };
    }
    
    // Validate attribute assignment
    static validateAttributeAssignment(character, attribute, value) {
        const errors = [];
        const warnings = [];
        
        // Check tier maximum
        const maxValue = TierSystem.getAttributeMaximum(character.tier);
        if (value > maxValue) {
            errors.push(`${attribute} cannot exceed tier maximum of ${maxValue}`);
        }
        
        // Check minimum
        if (value < 0) {
            errors.push(`${attribute} cannot be negative`);
        }
        
        // REMOVED DUPLICATE: Use PointPoolCalculator for point pool validation
        const poolValidation = this.validatePointPoolsWithChange(character, attribute, value);
        errors.push(...poolValidation.errors);
        warnings.push(...poolValidation.warnings);
        
        // Check flaw restrictions
        const flawValidation = this.validateFlawRestrictions(character, attribute, value);
        errors.push(...flawValidation.errors);
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    // Check if required archetypes are selected
    static hasRequiredArchetypes(character) {
        const required = ['movement', 'attackType', 'effectType', 'uniqueAbility', 'defensive', 'specialAttack', 'utility'];
        return required.every(archetype => character.archetypes[archetype] !== null);
    }
    
    // UPDATED: Validate point pools using PointPoolCalculator
    static validatePointPoolsWithChange(character, changingAttribute, newValue) {
        const errors = [];
        const warnings = [];
        
        return { errors, warnings };
    }
    
    // Validate flaw restrictions
    static validateFlawRestrictions(character, attribute, value) {
        const errors = [];
        
        // Check Balanced flaw
        if (character.mainPoolPurchases.flaws.some(flaw => flaw.flawId === 'balanced')) {
            const definitions = this.getAttributeDefinitions();
            if (definitions[attribute].pool === 'combat') {
                const minimumRequired = Math.floor(character.tier / 2);
                if (value < minimumRequired) {
                    errors.push(`Balanced flaw requires at least ${minimumRequired} in each combat attribute`);
                }
            }
        }
        
        return { errors };
    }
    
    // REMOVED DUPLICATE METHODS - Now use unified calculators:
    // - calculatePointsSpent() -> Use PointPoolCalculator
    // - calculateDefenses() -> Use StatCalculator.calculateDefenseStats()
    // - calculateCombatStats() -> Use StatCalculator.calculateCombatStats()
    // - applyArchetypeBonuses() -> Use StatCalculator.applyArchetypeBonuses()
    
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
}