// SpecialAttackValidator.js - Special attack validation
export class SpecialAttackValidator {
    // Validate all special attacks
    static validateSpecialAttacks(character) {
        const errors = [];
        const warnings = [];

        // Check archetype restrictions
        const archetypeValidation = this.validateArchetypeRestrictions(character);
        errors.push(...archetypeValidation.errors);
        warnings.push(...archetypeValidation.warnings);

        // Validate each individual attack
        character.specialAttacks.forEach((attack, index) => {
            const attackValidation = this.validateSpecialAttack(character, attack, index);
            
            if (!attackValidation.isValid) {
                errors.push(...attackValidation.errors.map(error => 
                    `Attack ${index + 1}: ${error}`));
            }
            warnings.push(...attackValidation.warnings.map(warning => 
                `Attack ${index + 1}: ${warning}`));
        });

        // Check banned upgrade combinations
        const combinationValidation = this.validateUpgradeCombinations(character);
        errors.push(...combinationValidation.errors);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Validate archetype restrictions
    static validateArchetypeRestrictions(character) {
        const errors = [];
        const warnings = [];
        const archetype = character.archetypes.specialAttack;
        const attackCount = character.specialAttacks.length;

        if (!archetype) {
            return { errors, warnings };
        }

        switch(archetype) {
            case 'basic':
                if (attackCount > 0) {
                    errors.push('Basic archetype cannot create special attacks');
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
                break;

            case 'paragon':
            case 'oneTrick':
            case 'dualNatured':
            case 'basic':
                // These archetypes don't use limits
                character.specialAttacks.forEach((attack, index) => {
                    if (attack.limits && attack.limits.length > 0) {
                        errors.push(`Attack ${index + 1}: ${archetype} archetype cannot use limits`);
                    }
                });
                break;
        }

        return { errors, warnings };
    }

    // Validate individual special attack
    static validateSpecialAttack(character, attack, index) {
        const errors = [];
        const warnings = [];

        // Check basic attack structure
        if (!attack.name || attack.name.trim() === '') {
            warnings.push('Attack needs a name');
        }

        // Check point spending
        if (attack.upgradePointsSpent > attack.upgradePointsAvailable) {
            errors.push(`Over budget: ${attack.upgradePointsSpent}/${attack.upgradePointsAvailable} points`);
        }

        // Check limits validity
        const limitValidation = this.validateAttackLimits(character, attack);
        errors.push(...limitValidation.errors);
        warnings.push(...limitValidation.warnings);

        // Check upgrade validity
        const upgradeValidation = this.validateAttackUpgrades(character, attack);
        errors.push(...upgradeValidation.errors);
        warnings.push(...upgradeValidation.warnings);

        // Check attack type requirements
        if (attack.attackTypes.length === 0) {
            warnings.push('Attack needs at least one attack type');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Validate attack limits
    static validateAttackLimits(character, attack) {
        const errors = [];
        const warnings = [];
        const archetype = character.archetypes.specialAttack;

        // Check if archetype allows limits
        const noLimitsArchetypes = ['paragon', 'oneTrick', 'dualNatured', 'basic'];
        if (noLimitsArchetypes.includes(archetype) && attack.limits.length > 0) {
            errors.push(`${archetype} archetype cannot use limits`);
        }

        // Check Behemoth conflicts
        if (character.archetypes.movement === 'behemoth') {
            attack.limits.forEach(limit => {
                if (limit.restrictions && limit.restrictions.includes('behemoth')) {
                    errors.push(`${limit.name} conflicts with Behemoth movement archetype`);
                }
            });
        }

        // Check straightforward archetype limit restriction
        if (archetype === 'straightforward' && attack.limits.length > 1) {
            errors.push('Straightforward archetype allows only one limit per attack');
        }

        return { errors, warnings };
    }

    // Validate attack upgrades
    static validateAttackUpgrades(character, attack) {
        const errors = [];
        const warnings = [];

        // Check upgrade point costs
        let calculatedCost = 0;
        
        // Attack type costs
        const freeTypes = this.getFreeAttackTypes(character);
        attack.attackTypes.forEach(type => {
            if (!freeTypes.includes(type)) {
                calculatedCost += this.getAttackTypeCost(type);
            }
        });

        // Upgrade costs
        attack.upgrades.forEach(upgradeId => {
            const upgradeCost = this.getUpgradeCost(upgradeId);
            calculatedCost += upgradeCost;
        });

        if (calculatedCost !== attack.upgradePointsSpent) {
            errors.push(`Point calculation mismatch: expected ${calculatedCost}, recorded ${attack.upgradePointsSpent}`);
        }

        return { errors, warnings };
    }

    // Get free attack types from archetypes
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

    // Get attack type cost
    static getAttackTypeCost(type) {
        const costs = {
            melee: 20,
            ranged: 20,
            direct: 30,
            area: 30
        };
        return costs[type] || 0;
    }

    // Get upgrade cost (simplified)
    static getUpgradeCost(upgradeId) {
        // This would need to lookup from upgrade data
        // For now, return placeholder values
        const commonCosts = {
            powerAttack: 10,
            accurateAttack: 10,
            heavyStrike: 40,
            quickStrikes: 40,
            // Add more as needed
        };
        return commonCosts[upgradeId] || 15; // Default cost
    }

    // Validate banned upgrade combinations
    static validateUpgradeCombinations(character) {
        const errors = [];
        
        const bannedCombinations = [
            ['brutal', 'heavyStrike'],
            ['brutal', 'headshot'],
            ['superiorEffect', 'reliableEffect'],
            ['criticalEffect', 'consistentEffect']
        ];

        character.specialAttacks.forEach((attack, attackIndex) => {
            bannedCombinations.forEach(bannedCombo => {
                const hasAll = bannedCombo.every(upgrade => 
                    attack.upgrades.includes(upgrade));
                
                if (hasAll) {
                    errors.push(`Attack ${attackIndex + 1}: Cannot combine ${bannedCombo.join(' and ')}`);
                }
            });
        });

        return { errors };
    }

    // Validate single upgrade addition
    static validateUpgradeAddition(character, attack, upgradeId) {
        const errors = [];
        const warnings = [];

        // Check if upgrade already exists
        if (attack.upgrades.includes(upgradeId)) {
            errors.push('Upgrade already applied to this attack');
        }

        // Check if can afford
        const cost = this.getUpgradeCost(upgradeId);
        const remainingPoints = attack.upgradePointsAvailable - attack.upgradePointsSpent;
        
        if (cost > remainingPoints) {
            errors.push(`Insufficient points: need ${cost}, have ${remainingPoints}`);
        }

        // Check banned combinations
        const bannedCombinations = [
            ['brutal', 'heavyStrike'],
            ['brutal', 'headshot'],
            ['superiorEffect', 'reliableEffect'],
            ['criticalEffect', 'consistentEffect']
        ];

        bannedCombinations.forEach(bannedCombo => {
            if (bannedCombo.includes(upgradeId)) {
                const conflicting = bannedCombo.filter(id => 
                    id !== upgradeId && attack.upgrades.includes(id));
                
                if (conflicting.length > 0) {
                    errors.push(`Cannot combine with: ${conflicting.join(', ')}`);
                }
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}