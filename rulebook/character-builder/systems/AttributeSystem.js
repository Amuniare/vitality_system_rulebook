// AttributeSystem.js - Attribute management and calculations
import { GameConstants } from '../core/GameConstants.js';
import { TierSystem } from '../core/TierSystem.js';

export class AttributeSystem {
    // Define all attributes and their purposes
    static getAttributeDefinitions() {
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
        
        // Check if archetypes are selected
        if (!this.hasRequiredArchetypes(character)) {
            errors.push("Must select all archetypes before assigning attributes");
        }
        
        // Check tier maximum
        const maxValue = TierSystem.getAttributeMaximum(character.tier);
        if (value > maxValue) {
            errors.push(`${attribute} cannot exceed tier maximum of ${maxValue}`);
        }
        
        // Check minimum
        if (value < 0) {
            errors.push(`${attribute} cannot be negative`);
        }
        
        // Check point pool limits
        const poolValidation = this.validatePointPools(character, attribute, value);
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
    
    // Validate point pool spending
    static validatePointPools(character, changingAttribute, newValue) {
        const errors = [];
        const warnings = [];
        const definitions = this.getAttributeDefinitions();
        const poolType = definitions[changingAttribute].pool;
        
        // Calculate current spending in this pool
        let currentSpent = 0;
        Object.entries(character.attributes).forEach(([attr, value]) => {
            if (definitions[attr].pool === poolType) {
                if (attr === changingAttribute) {
                    currentSpent += newValue; // Use new value for changing attribute
                } else {
                    currentSpent += value; // Current value for others
                }
            }
        });
        
        // Get available points for this pool
        const pools = TierSystem.calculatePointPools(character.tier);
        const available = poolType === 'combat' ? pools.combatAttributes : pools.utilityAttributes;
        
        if (currentSpent > available) {
            errors.push(`${poolType} attributes total (${currentSpent}) exceeds available points (${available})`);
        }
        
        if (currentSpent === available) {
            warnings.push(`${poolType} attribute pool fully spent`);
        }
        
        return { errors, warnings };
    }
    
    // Validate flaw restrictions
    static validateFlawRestrictions(character, attribute, value) {
        const errors = [];
        
        // Check Balanced flaw
        if (character.mainPoolPurchases.flaws.includes('balanced')) {
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
    
    // Calculate total points spent in each pool
    static calculatePointsSpent(character) {
        const definitions = this.getAttributeDefinitions();
        const spent = { combat: 0, utility: 0 };
        
        Object.entries(character.attributes).forEach(([attr, value]) => {
            const poolType = definitions[attr].pool;
            spent[poolType] += value;
        });
        
        return spent;
    }
    
    // Calculate derived defensive stats
    static calculateDefenses(character) {
        const tier = character.tier;
        const attrs = character.attributes;
        
        return {
            avoidance: GameConstants.AVOIDANCE_BASE + tier + attrs.mobility,
            durability: tier + (attrs.endurance * GameConstants.ENDURANCE_DURABILITY_MULTIPLIER),
            resolve: GameConstants.RESOLVE_BASE + tier + attrs.focus,
            stability: GameConstants.STABILITY_BASE + tier + attrs.power,
            vitality: GameConstants.VITALITY_BASE + tier + attrs.endurance
        };
    }
    
    // Calculate combat stats
    static calculateCombatStats(character) {
        const tier = character.tier;
        const attrs = character.attributes;
        
        return {
            accuracy: tier + attrs.focus,
            damage: tier + (attrs.power * GameConstants.POWER_DAMAGE_MULTIPLIER),
            conditions: tier + attrs.power,
            initiative: tier + attrs.mobility + attrs.focus + attrs.awareness,
            movement: TierSystem.calculateBaseMovement(tier, attrs.mobility),
            hp: TierSystem.calculateBaseHP(tier)
        };
    }
    
    // Apply archetype bonuses to attributes
    static applyArchetypeBonuses(character, baseStats) {
        const stats = { ...baseStats };
        const archetypes = character.archetypes;
        
        // Movement archetype bonuses
        switch(archetypes.movement) {
            case 'swift':
                stats.movement += Math.ceil(character.tier / 2);
                break;
            case 'vanguard':
                stats.movement += character.attributes.endurance;
                break;
            // Add other movement bonuses
        }
        
        // Defensive archetype bonuses
        switch(archetypes.defensive) {
            case 'stalwart':
                stats.avoidance -= character.tier;
                break;
            case 'resilient':
                stats.durability += character.tier;
                break;
            case 'fortress':
                stats.resolve += character.tier;
                stats.stability += character.tier;
                stats.vitality += character.tier;
                break;
            case 'juggernaut':
                stats.hp += character.tier * 5;
                break;
        }
        
        // Unique ability bonuses
        switch(archetypes.uniqueAbility) {
            case 'cutAbove':
                const bonus = character.tier <= 3 ? 1 : character.tier <= 6 ? 2 : 3;
                stats.accuracy += bonus;
                stats.damage += bonus;
                stats.conditions += bonus;
                stats.avoidance += bonus;
                stats.durability += bonus;
                // Apply to all resistances
                stats.resolve += bonus;
                stats.stability += bonus;
                stats.vitality += bonus;
                stats.initiative += bonus;
                stats.movement += bonus;
                break;
        }
        
        return stats;
    }
    
    // Get attribute recommendations based on archetypes
    static getAttributeRecommendations(character) {
        const recommendations = [];
        const archetypes = character.archetypes;
        
        // Movement recommendations
        if (archetypes.movement === 'swift' || archetypes.movement === 'skirmisher') {
            recommendations.push("Consider high Mobility for movement and initiative");
        }
        
        // Attack type recommendations
        if (archetypes.attackType === 'singleTarget') {
            recommendations.push("Focus and Power are both important for single target builds");
        }
        
        // Effect type recommendations
        if (archetypes.effectType === 'damageSpecialist') {
            recommendations.push("Maximize Power for damage output");
        } else if (archetypes.effectType === 'crowdControl') {
            recommendations.push("Power is crucial for condition success");
        }
        
        return recommendations;
    }
}