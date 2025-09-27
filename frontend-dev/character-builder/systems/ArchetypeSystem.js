// ArchetypeSystem.js - Archetype selection and validation
import { GameConstants } from '../core/GameConstants.js';
import { gameDataManager } from '../core/GameDataManager.js'; // ADDED

export class ArchetypeSystem {
    // Get all archetype categories
    static getArchetypeCategories() {
        // Updated to match new 4-category structure
        return [
            'movement',
            'attack',
            'defensive',
            'utility'
        ];
    }
    
    // Validate archetype selection
    static validateArchetypeSelection(character, category, archetypeId) {
        const errors = [];
        const warnings = [];
        
        // Check if archetype exists
        if (!this.isValidArchetype(category, archetypeId)) {
            errors.push(`Invalid archetype ${archetypeId} for category ${category}`);
            return { isValid: false, errors, warnings };
        }
        
        // Check for conflicts with existing selections
        const conflicts = this.checkArchetypeConflicts(character, category, archetypeId);
        errors.push(...conflicts.errors);
        warnings.push(...conflicts.warnings);
        
        // Check for conflicts with current build state
        const buildConflicts = this.checkBuildStateConflicts(character, category, archetypeId);
        errors.push(...buildConflicts.errors);
        warnings.push(...buildConflicts.warnings);
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    // Check if archetype ID is valid for category
    static isValidArchetype(category, archetypeId) {
        const archetypes = this.getArchetypesForCategory(category);
        return archetypes.some(arch => arch.id === archetypeId);
    }
    
    // Get archetypes for a specific category
    static getArchetypesForCategory(category) {
        return gameDataManager.getArchetypesForCategory(category) || []; // MODIFIED
    }
    
    // Check for archetype conflicts
    static checkArchetypeConflicts(character, category, archetypeId) {
        const errors = [];
        const warnings = [];
        
        // Behemoth conflicts with movement-restricting limits
        if (category === 'movement' && archetypeId === 'behemoth') {
            const hasMovementLimits = character.specialAttacks.some(attack => 
                attack.limits.some(limit => // limit is an object with id, name etc.
                    this.isMovementRestrictingLimit(limit.id) // Pass limit.id
                )
            );
            
            if (hasMovementLimits) {
                errors.push('Behemoth archetype conflicts with existing movement-restricting limits');
            }
        }
        
        // Focused Attacker conflicts with multiple special attacks
        if (category === 'attack' && archetypeId === 'focusedAttacker') {
            if (character.specialAttacks.length > 1) {
                errors.push('Focused Attacker archetype allows only one special attack');
            }
        }

        // Dual-Natured conflicts with more than two attacks
        if (category === 'attack' && archetypeId === 'dualNatured') {
            if (character.specialAttacks.length > 2) {
                errors.push('Dual-Natured archetype allows only two special attacks');
            }
        }

        // Versatile Master conflicts with more than five attacks
        if (category === 'attack' && archetypeId === 'versatileMaster') {
            if (character.specialAttacks.length > 5) {
                errors.push('Versatile Master archetype allows only five special attacks');
            }
        }

        // Shared Charges conflicts with more than three attacks
        if (category === 'attack' && archetypeId === 'sharedCharges') {
            if (character.specialAttacks.length > 3) {
                errors.push('Shared Charges archetype allows only three special attacks');
            }
        }

        // Specialist conflicts with any special attacks
        if (category === 'attack' && archetypeId === 'specialist') {
            if (character.specialAttacks.length > 0) {
                warnings.push('Specialist archetype enhances base attacks only - special attacks will be removed if this archetype is selected');
            }
        }
        
        return { errors, warnings };
    }
    
    // Check for conflicts with current build state
    static checkBuildStateConflicts(character, category, archetypeId) {
        const errors = [];
        const warnings = [];
        
        // Warn if changing archetype after build has progressed
        if (character.archetypes[category] && character.archetypes[category] !== archetypeId) {
            const hasAttributes = Object.values(character.attributes).some(val => val > 0);
            const hasMainPool = character.mainPoolPurchases.boons.length > 0 || 
                               character.mainPoolPurchases.traits.length > 0 ||
                               character.mainPoolPurchases.flaws.length > 0;
            
            if (hasAttributes || hasMainPool) {
                warnings.push('Changing archetypes may invalidate existing character choices');
            }
        }
        
        return { errors, warnings };
    }
    
    // Check if a limit restricts movement (for Behemoth conflicts)
    static isMovementRestrictingLimit(limitId) {
        // This data could also be externalized if limits become more complex
        // For now, keeping it here as it's specific to this conflict check.
        const movementLimits = [
            'immobilized', // from LimitCalculator.js
            'rooted', 
            'anchored', 
            'stationary'
        ];
        return movementLimits.includes(limitId);
    }
    
    // Get archetype bonuses
    static getArchetypeBonuses(character) {
        const bonuses = {
            pointPools: {},
            stats: {},
            special: []
        };
        
        // No longer relevant - uniqueAbility category removed
        
        // Utility archetype bonuses
        if (character.archetypes.utility === 'specialized' || 
            character.archetypes.utility === 'jackOfAllTrades') {
            // This implies a reduction from the 'practical' base pool
            // Actual calculation is handled by PointPoolCalculator based on archetype.
            // This method might be more for descriptive bonuses if needed.
            // For now, let PointPoolCalculator handle the numeric pool changes.
        }
        
        return bonuses;
    }
    
    // Get free attack/effect types from archetypes - no longer relevant with new system
    static getFreeAttackTypes(character) {
        // Attack archetype no longer grants free attack types
        // Instead, it determines the number of attacks and points per attack
        return [];
    }
    
    // Get special attack point calculation method
    static getSpecialAttackPointMethod(character) {
        const archetype = character.archetypes.attack;

        const pointMethodConfig = {
            focusedAttacker: { method: 'fixed', attacks: 1, pointsPerAttack: 20 },
            dualNatured: { method: 'fixed', attacks: 2, pointsPerAttack: 15 },
            versatileMaster: { method: 'fixed', attacks: 5, pointsPerAttack: 10 },
            sharedCharges: { method: 'shared_resource', attacks: 3, charges: 10, pointsPerUse: 10 },
            specialist: { method: 'boons', extraBoons: character.level }
        };

        const config = pointMethodConfig[archetype];
        if (!config) return { method: 'fixed', attacks: 1, pointsPerAttack: 0 };

        if (config.method === 'fixed') {
            return {
                method: 'fixed',
                attacks: config.attacks,
                pointsPerAttack: character.tier * config.pointsPerAttack
            };
        }

        if (config.method === 'shared_resource') {
            return {
                method: 'shared_resource',
                attacks: config.attacks,
                charges: config.charges,
                pointsPerUse: character.tier * config.pointsPerUse
            };
        }

        if (config.method === 'boons') {
            return {
                method: 'boons',
                extraBoons: Math.max(0, config.extraBoons)
            };
        }

        return config;
    }
    
    // Get free advanced conditions from archetype - no longer relevant
    static getFreeAdvancedConditions(character) {
        // effectType category removed, no archetype grants free advanced conditions
        return 0;
    }
    
    // Count used free advanced conditions across all attacks
    static countUsedFreeAdvancedConditions(character) {
        let usedCount = 0;
        
        // Count advanced conditions used in all special attacks
        character.specialAttacks.forEach(attack => {
            if (attack.advancedConditions) {
                usedCount += attack.advancedConditions.length;
            }
        });
        
        return usedCount;
    }
    
    // Check if character has unused free advanced condition slots
    static hasUnusedFreeAdvancedConditions(character) {
        const freeConditions = this.getFreeAdvancedConditions(character);
        const usedConditions = this.countUsedFreeAdvancedConditions(character);
        return usedConditions < freeConditions;
    }
    
    // Check if archetype selection is complete
    static isArchetypeSelectionComplete(character) {
        const categories = this.getArchetypeCategories();
        return categories.every(category => character.archetypes[category] !== null && character.archetypes[category] !== undefined);
    }
    
    // Get required next archetype category
    static getNextRequiredArchetype(character) {
        const categories = this.getArchetypeCategories();
        return categories.find(category => !character.archetypes[category]);
    }
}