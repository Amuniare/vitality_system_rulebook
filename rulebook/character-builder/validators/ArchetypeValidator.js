// ArchetypeValidator.js - Archetype selection and conflict validation
export class ArchetypeValidator {
    // Validate all archetype selections and conflicts
    static validateArchetypes(character) {
        const errors = [];
        const warnings = [];

        // Check for missing archetypes
        const missingArchetypes = this.getMissingArchetypes(character);
        if (missingArchetypes.length > 0) {
            warnings.push(`Missing archetype selections: ${missingArchetypes.join(', ')}`);
        }

        // Check archetype conflicts
        const conflicts = this.checkArchetypeConflicts(character);
        errors.push(...conflicts.errors);
        warnings.push(...conflicts.warnings);

        // Check special attack archetype rules
        const specialAttackValidation = this.validateSpecialAttackArchetype(character);
        errors.push(...specialAttackValidation.errors);
        warnings.push(...specialAttackValidation.warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Get missing archetype categories
    static getMissingArchetypes(character) {
        const requiredArchetypes = [
            'movement', 'attackType', 'effectType', 'uniqueAbility', 
            'defensive', 'specialAttack', 'utility'
        ];
        
        return requiredArchetypes.filter(category => 
            !character.archetypes[category]
        );
    }

    // Check for conflicts between archetype selections and character state
    static checkArchetypeConflicts(character) {
        const errors = [];
        const warnings = [];

        // Behemoth movement archetype conflicts
        if (character.archetypes.movement === 'behemoth') {
            const conflictingLimits = this.findBehemothConflictingLimits(character);
            if (conflictingLimits.length > 0) {
                errors.push(`Behemoth archetype conflicts with limits: ${conflictingLimits.join(', ')}`);
            }
        }

        // Slow flaw vs movement archetype
        const hasSlowFlaw = character.mainPoolPurchases.flaws.some(flaw => flaw.flawId === 'slow');
        if (hasSlowFlaw && character.archetypes.movement && character.archetypes.movement !== 'none') {
            errors.push('Slow flaw prevents having movement archetype');
        }

        // Balanced flaw validation
        const hasBalancedFlaw = character.mainPoolPurchases.flaws.some(flaw => flaw.flawId === 'balanced');
        if (hasBalancedFlaw) {
            const balancedValidation = this.validateBalancedFlaw(character);
            errors.push(...balancedValidation.errors);
            warnings.push(...balancedValidation.warnings);
        }

        return { errors, warnings };
    }

    // Find limits that conflict with Behemoth archetype
    static findBehemothConflictingLimits(character) {
        const conflictingLimits = [];
        
        character.specialAttacks.forEach(attack => {
            attack.limits.forEach(limit => {
                // Check if limit has behemoth restriction
                if (limit.restrictions && limit.restrictions.includes('behemoth')) {
                    conflictingLimits.push(limit.name || limit.id);
                }
            });
        });
        
        return conflictingLimits;
    }

    // Validate Balanced flaw requirements
    static validateBalancedFlaw(character) {
        const errors = [];
        const warnings = [];
        const tier = character.tier;
        const minimumRequired = Math.floor(tier / 2);
        
        const combatAttributes = ['focus', 'mobility', 'power', 'endurance'];
        
        combatAttributes.forEach(attr => {
            const value = character.attributes[attr] || 0;
            if (value < minimumRequired) {
                errors.push(`Balanced flaw requires at least ${minimumRequired} in ${attr} (currently ${value})`);
            }
        });

        return { errors, warnings };
    }

    // Validate special attack archetype rules
    static validateSpecialAttackArchetype(character) {
        const errors = [];
        const warnings = [];
        const archetype = character.archetypes.specialAttack;
        
        if (!archetype) {
            return { errors, warnings };
        }

        const attackCount = character.specialAttacks.length;

        switch(archetype) {
            case 'basic':
                if (attackCount > 0) {
                    errors.push('Basic archetype cannot have special attacks');
                }
                break;
                
            case 'oneTrick':
                if (attackCount > 1) {
                    errors.push('One Trick archetype allows only one special attack');
                }
                break;
                
            case 'dualNatured':
                if (attackCount > 2) {
                    errors.push('Dual-Natured archetype allows only two special attacks');
                }
                if (attackCount === 2) {
                    // Check that both attacks have proper points
                    const expectedPoints = character.tier * 15;
                    character.specialAttacks.forEach((attack, index) => {
                        if (attack.upgradePointsAvailable !== expectedPoints) {
                            warnings.push(`Dual-Natured attack ${index + 1} should have ${expectedPoints} points`);
                        }
                    });
                }
                break;
                
            case 'specialist':
                // Check that limits are consistent across attacks
                if (attackCount > 1) {
                    const firstAttackLimits = character.specialAttacks[0].limits.map(l => l.id).sort();
                    const inconsistentAttacks = character.specialAttacks.slice(1).filter((attack, index) => {
                        const attackLimits = attack.limits.map(l => l.id).sort();
                        return JSON.stringify(attackLimits) !== JSON.stringify(firstAttackLimits);
                    });
                    
                    if (inconsistentAttacks.length > 0) {
                        warnings.push('Specialist archetype works best with consistent limits across attacks');
                    }
                }
                break;
        }

        return { errors, warnings };
    }

    // Validate specific archetype selection
    static validateArchetypeSelection(character, category, archetypeId) {
        const errors = [];
        const warnings = [];

        // Check if this selection would create conflicts
        const tempCharacter = { ...character };
        tempCharacter.archetypes = { ...character.archetypes };
        tempCharacter.archetypes[category] = archetypeId;

        const conflicts = this.checkArchetypeConflicts(tempCharacter);
        errors.push(...conflicts.errors);
        warnings.push(...conflicts.warnings);

        // Warn about changing archetype after progression
        if (character.archetypes[category] && character.archetypes[category] !== archetypeId) {
            const hasProgression = this.hasCharacterProgression(character);
            if (hasProgression) {
                warnings.push('Changing archetypes may invalidate existing character choices');
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Check if character has made progress beyond archetype selection
    static hasCharacterProgression(character) {
        const hasAttributes = Object.values(character.attributes).some(val => val > 0);
        const hasMainPool = character.mainPoolPurchases.boons.length > 0 || 
                           character.mainPoolPurchases.traits.length > 0 ||
                           character.mainPoolPurchases.flaws.length > 0;
        const hasSpecialAttacks = character.specialAttacks.length > 0;
        
        return hasAttributes || hasMainPool || hasSpecialAttacks;
    }
}