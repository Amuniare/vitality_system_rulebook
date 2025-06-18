// ArchetypeSystem.js - Archetype selection and validation
import { GameConstants } from '../core/GameConstants.js';
import { gameDataManager } from '../core/GameDataManager.js'; // ADDED

export class ArchetypeSystem {
    // Get all archetype categories
    static getArchetypeCategories() {
        // Could also get this from Object.keys(gameDataManager.getArchetypes()) if that's more dynamic
        return [
            'movement',
            'attackType', 
            'effectType',
            'uniqueAbility',
            'defensive',
            'specialAttack',
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
        
        // One Trick conflicts with multiple special attacks
        if (category === 'specialAttack' && archetypeId === 'oneTrick') {
            if (character.specialAttacks.length > 1) {
                errors.push('One Trick archetype allows only one special attack');
            }
        }
        
        // Dual-Natured conflicts with more than two attacks
        if (category === 'specialAttack' && archetypeId === 'dualNatured') {
            if (character.specialAttacks.length > 2) {
                errors.push('Dual-Natured archetype allows only two special attacks');
            }
        }
        
        // Basic conflicts with any special attacks
        if (category === 'specialAttack' && archetypeId === 'basic') {
            if (character.specialAttacks.length > 0) {
                warnings.push('Basic archetype enhances base attacks only - special attacks will be removed if this archetype is selected');
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
        
        // Unique Ability bonuses
        if (character.archetypes.uniqueAbility === 'extraordinary') {
            bonuses.pointPools.mainPoolBonus = Math.max(0, (character.tier - GameConstants.MAIN_POOL_BASE_TIER) * GameConstants.MAIN_POOL_MULTIPLIER);
        }
        
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
    
    // Get free attack/effect types from archetypes
    static getFreeAttackTypes(character) {
        const free = [];
        
        switch(character.archetypes.attackType) {
            case 'aoeSpecialist':
                free.push('area');
                break;
            case 'directSpecialist':
                free.push('direct');
                break;
            case 'singleTarget':
                free.push('melee_ac', 'melee_dg_cn', 'ranged');
                break;
        }
        
        return free;
    }
    
    // Get special attack point calculation method
    static getSpecialAttackPointMethod(character) {
        const archetype = character.archetypes.specialAttack;
        // GameConstants.ARCHETYPE_MULTIPLIERS holds the numeric values.
        // This method could return a more descriptive object if needed.
        
        const pointMethodConfig = {
            normal: { method: 'limits', multiplierKey: 'normal' },
            specialist: { method: 'limits', multiplierKey: 'specialist' },
            straightforward: { method: 'limits', multiplierKey: 'straightforward' },
            paragon: { method: 'fixed', pointsPerTierKey: 'paragon' },
            oneTrick: { method: 'fixed', pointsPerTierKey: 'oneTrick' },
            dualNatured: { method: 'fixed', pointsPerTierKey: 'dualNatured', perAttack: true },
            basic: { method: 'fixed', pointsPerTierKey: 'basic', baseOnly: true },
            sharedUses: { method: 'shared', uses: 10 } // 'sharedUses' usually gets limits applied 1:1
        };

        const config = pointMethodConfig[archetype];
        if (!config) return { method: 'limits', multiplier: 0 }; // Default or error

        if (config.method === 'limits') {
            return { method: 'limits', multiplier: GameConstants.ARCHETYPE_MULTIPLIERS[config.multiplierKey] || 0 };
        }
        if (config.method === 'fixed') {
            return { 
                method: 'fixed', 
                points: character.tier * (GameConstants.ARCHETYPE_MULTIPLIERS[config.pointsPerTierKey] || 0),
                perAttack: config.perAttack || false,
                baseOnly: config.baseOnly || false
            };
        }
        return config; // For 'sharedUses' or other types
    }
    
    // Get free advanced conditions from archetype
    static getFreeAdvancedConditions(character) {
        if (character.archetypes.effectType === 'crowdControl') {
            return 2; // Crowd Control grants 2 free advanced conditions
        }
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