// ArchetypeSystem.js - Archetype selection and validation
import { GameConstants } from '../core/GameConstants.js';

export class ArchetypeSystem {
    // Get all archetype categories
    static getArchetypeCategories() {
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
        const archetypeData = {
            movement: [
                { id: 'swift', name: 'Swift', description: 'Increased movement speed by half Tier (round up)' },
                { id: 'skirmisher', name: 'Skirmisher', description: 'Immune to opportunity attacks, +1 space attack reach' },
                { id: 'behemoth', name: 'Behemoth', description: 'Cannot be Grabbed, Moved, knocked Prone, or Stunned' },
                { id: 'bulwark', name: 'Bulwark', description: 'Enemies starting adjacent have half movement speed' },
                { id: 'vanguard', name: 'Vanguard', description: 'Add Endurance to movement speed' },
                { id: 'mole', name: 'Mole', description: 'Move through earth and stone at full/half speed' },
                { id: 'flight', name: 'Flight', description: 'Move in any direction, ignore obstacles' },
                { id: 'teleportation', name: 'Teleportation', description: 'Instant movement to visible locations, -2 Sp penalty' },
                { id: 'portal', name: 'Portal', description: 'Create linked portals for team movement' },
                { id: 'swinging', name: 'Swinging', description: 'Requires anchor points, +1-2 Sp bonus' },
                { id: 'superJump', name: 'Super Jump', description: 'Jump distance equals full movement, +1-2 Sp bonus' }
            ],
            
            attackType: [
                { id: 'aoeSpecialist', name: 'AOE Specialist', description: 'Free AOE attack type, crowd control focus' },
                { id: 'directSpecialist', name: 'Direct Specialist', description: 'Free Direct attack type, reliable delivery' },
                { id: 'singleTarget', name: 'Single Target', description: 'Free Melee and Ranged attack types' }
            ],
            
            effectType: [
                { id: 'damageSpecialist', name: 'Damage Specialist', description: 'Maximum damage potential, Basic Conditions separate' },
                { id: 'hybridSpecialist', name: 'Hybrid Specialist', description: 'All attacks combine damage and conditions' },
                { id: 'crowdControl', name: 'Crowd Control', description: 'Free 2 Advanced conditions, -Tier to Damage' }
            ],
            
            uniqueAbility: [
                { id: 'versatileMaster', name: 'Versatile Master', description: '2 Quick Actions per turn, extra at Tier 8' },
                { id: 'extraordinary', name: 'Extraordinary', description: 'Additional (Tier-2)×15 points for complex builds' },
                { id: 'cutAbove', name: 'Cut Above', description: '+1-3 to all core stats based on Tier' }
            ],
            
            defensive: [
                { id: 'stalwart', name: 'Stalwart', description: '-Tier Avoidance, half damage from chosen type' },
                { id: 'resilient', name: 'Resilient', description: '+Tier to Durability against all damage' },
                { id: 'fortress', name: 'Fortress', description: '+Tier to all Secondary Resistances' },
                { id: 'immutable', name: 'Immutable', description: 'Immunity to chosen resistance category' },
                { id: 'juggernaut', name: 'Juggernaut', description: '+5×Tier maximum Health Pool' }
            ],
            
            specialAttack: [
                { id: 'normal', name: 'Normal', description: '3 Specialty Upgrades at half cost, flexible limits' },
                { id: 'specialist', name: 'Specialist', description: '3 specific Limits, higher returns, focused style' },
                { id: 'paragon', name: 'Paragon', description: '10×Tier points per attack, no Limits' },
                { id: 'oneTrick', name: 'One Trick', description: 'Single attack with Tier×20 points, no Limits' },
                { id: 'straightforward', name: 'Straightforward', description: 'Single Limit, simple but effective' },
                { id: 'sharedUses', name: 'Shared Uses', description: '10 shared uses, resource management focus' },
                { id: 'dualNatured', name: 'Dual-Natured', description: 'Two attacks with 15×Tier points each' },
                { id: 'basic', name: 'Basic', description: 'Enhances base attacks, Tier×10 points' }
            ],
            
            utility: [
                { id: 'specialized', name: 'Specialized', description: 'Double Tier bonus for one stat, no additional Expertise' },
                { id: 'practical', name: 'Practical', description: 'Balanced access, standard point pool' },
                { id: 'jackOfAllTrades', name: 'Jack of All Trades', description: 'Tier bonus to ALL checks, no specialized Expertise' }
            ]
        };
        
        return archetypeData[category] || [];
    }
    
    // Check for archetype conflicts
    static checkArchetypeConflicts(character, category, archetypeId) {
        const errors = [];
        const warnings = [];
        
        // Behemoth conflicts with movement-restricting limits
        if (category === 'movement' && archetypeId === 'behemoth') {
            const hasMovementLimits = character.specialAttacks.some(attack => 
                attack.limits.some(limitId => 
                    this.isMovementRestrictingLimit(limitId)
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
                warnings.push('Basic archetype enhances base attacks only - special attacks will be removed');
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
        const movementLimits = [
            'immobilized', 'rooted', 'anchored', 'stationary'
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
            bonuses.pointPools.mainPoolBonus = Math.max(0, (character.tier - 2) * 15);
        }
        
        // Utility archetype bonuses
        if (character.archetypes.utility === 'specialized' || 
            character.archetypes.utility === 'jackOfAllTrades') {
            bonuses.pointPools.utilityPoolReduction = true;
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
                free.push('melee', 'ranged');
                break;
        }
        
        return free;
    }
    
    // Get special attack point calculation method
    static getSpecialAttackPointMethod(character) {
        const archetype = character.archetypes.specialAttack;
        
        switch(archetype) {
            case 'normal':
                return { method: 'limits', multiplier: 1/6 };
            case 'specialist':
                return { method: 'limits', multiplier: 1/3 };
            case 'straightforward':
                return { method: 'limits', multiplier: 1/2 };
            case 'paragon':
                return { method: 'fixed', points: character.tier * 10 };
            case 'oneTrick':
                return { method: 'fixed', points: character.tier * 20 };
            case 'dualNatured':
                return { method: 'fixed', points: character.tier * 15, perAttack: true };
            case 'basic':
                return { method: 'fixed', points: character.tier * 10, baseOnly: true };
            case 'sharedUses':
                return { method: 'shared', uses: 10 };
            default:
                return { method: 'limits', multiplier: 0 };
        }
    }
    
    // Check if archetype selection is complete
    static isArchetypeSelectionComplete(character) {
        const categories = this.getArchetypeCategories();
        return categories.every(category => character.archetypes[category] !== null);
    }
    
    // Get required next archetype category
    static getNextRequiredArchetype(character) {
        const categories = this.getArchetypeCategories();
        return categories.find(category => character.archetypes[category] === null);
    }
}