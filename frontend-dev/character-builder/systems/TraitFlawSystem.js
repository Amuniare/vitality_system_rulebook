// TraitFlawSystem.js - REFACTORED to use PointPoolCalculator and gameDataManager
import { PointPoolCalculator } from '../calculators/PointPoolCalculator.js';
import { GameConstants } from '../core/GameConstants.js';
import { gameDataManager } from '../core/GameDataManager.js'; // ADDED

export class TraitFlawSystem {
    // Get all available passive bonuses with their restrictions
    static getAvailablePassiveBonuses() {
        return gameDataManager.getAvailablePassiveBonuses() || [];
    }

    // Backward compatibility method
    static getAvailableFlaws() {
        return this.getAvailablePassiveBonuses();
    }

    // Get available stat bonuses for passive bonuses
    static getPassiveBonusStatOptions() {
        return gameDataManager.getGenericStatOptions() || [];
    }

    // Backward compatibility method
    static getFlawStatOptions() {
        return this.getPassiveBonusStatOptions();
    }


    // New conditional bonus system
    static getConditionalBonuses() {
        return gameDataManager.getConditionalBonuses() || [];
    }

    static getConditionalBonusStatOptions() {
        return gameDataManager.getGenericStatOptions() || [];
    }
    

    // Validate passive bonus purchase
    static validatePassiveBonusPurchase(character, passiveBonusId, statBonus) {
        return this.validateFlawPurchase(character, passiveBonusId, statBonus);
    }

    // Backward compatibility method
    static validateFlawPurchase(character, flawId, statBonus) {
        const errors = [];
        const warnings = [];
        
        const flaw = (gameDataManager.getAvailableFlaws() || []).find(f => f.id === flawId); // MODIFIED
        if (!flaw) {
            errors.push('Invalid passive bonus selected');
            return { isValid: false, errors, warnings };
        }

        // Check if passive bonus already purchased
        if (character.mainPoolPurchases.flaws.some(f => f.flawId === flawId)) {
            errors.push('Passive bonus already purchased');
        }

        // Validate stat bonus selection
        if (statBonus && !(gameDataManager.getGenericStatOptions() || []).some(opt => opt.id === statBonus)) { // MODIFIED
            errors.push('Invalid stat bonus selection');
        }

        // Check for passive bonus conflicts
        const conflictCheck = this.checkFlawConflicts(character, flawId);
        errors.push(...conflictCheck.errors);
        warnings.push(...conflictCheck.warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Validate conditional bonus purchase (new system)
    static validateConditionalBonusPurchase(character, conditionalBonusData) {
        const errors = [];
        const warnings = [];

        // Validate conditional bonus selection
        if (!conditionalBonusData.conditionalBonusId) {
            errors.push('Must select a conditional bonus');
        } else {
            const availableConditionalBonuses = this.getConditionalBonuses();
            const selectedBonus = availableConditionalBonuses.find(cb => cb.id === conditionalBonusData.conditionalBonusId);
            if (!selectedBonus) {
                errors.push('Invalid conditional bonus selected');
            }
        }

        // Validate stat selections
        if (!conditionalBonusData.statBonuses || conditionalBonusData.statBonuses.length !== 2) {
            errors.push('Must select exactly 2 stat bonuses');
        }

        const validStats = (gameDataManager.getGenericStatOptions() || []).map(s => s.id);
        conditionalBonusData.statBonuses?.forEach((stat, index) => {
            if (!validStats.includes(stat)) {
                errors.push(`Invalid stat bonus ${index + 1}: ${stat}`);
            }
        });

        // Check for duplicate conditional bonus
        if (character.mainPoolPurchases.conditionalBonuses?.some(cb => cb.conditionalBonusId === conditionalBonusData.conditionalBonusId)) {
            errors.push('Conditional bonus already purchased');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }


    // Purchase passive bonus
    static purchasePassiveBonus(character, passiveBonusId, statBonus) {
        return this.purchaseFlaw(character, passiveBonusId, statBonus);
    }

    // Backward compatibility method - Purchase flaw with corrected economics
    static purchaseFlaw(character, flawId, statBonus) {
        const validation = this.validateFlawPurchase(character, flawId, statBonus);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const flaw = (gameDataManager.getAvailableFlaws() || []).find(f => f.id === flawId); // MODIFIED
        if (!flaw) throw new Error(`Passive bonus definition for ${flawId} not found.`);

        character.mainPoolPurchases.flaws.push({
            flawId,
            name: flaw.name,
            cost: flaw.cost, // Passive bonuses cost points now
            statBonus: statBonus || null,
            purchasedAt: new Date().toISOString()
        });

        return character;
    }

    // Purchase conditional bonus (new system)
    static purchaseConditionalBonus(character, conditionalBonusData) {
        const validation = this.validateConditionalBonusPurchase(character, conditionalBonusData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const conditionalBonus = this.getConditionalBonuses().find(cb => cb.id === conditionalBonusData.conditionalBonusId);
        if (!conditionalBonus) {
            throw new Error(`Conditional bonus definition for ${conditionalBonusData.conditionalBonusId} not found.`);
        }

        // Initialize conditionalBonuses array if it doesn't exist
        if (!character.mainPoolPurchases.conditionalBonuses) {
            character.mainPoolPurchases.conditionalBonuses = [];
        }

        character.mainPoolPurchases.conditionalBonuses.push({
            id: Date.now().toString(),
            conditionalBonusId: conditionalBonusData.conditionalBonusId,
            name: conditionalBonus.name,
            description: conditionalBonus.description,
            statBonuses: conditionalBonusData.statBonuses,
            cost: GameConstants.CONDITIONAL_BONUS_COST || 1, // Conditional bonuses cost 1 point
            purchasedAt: new Date().toISOString()
        });

        return character;
    }



    // Check passive bonus conflicts
    static checkPassiveBonusConflicts(character, passiveBonusId) {
        return this.checkFlawConflicts(character, passiveBonusId);
    }

    // Backward compatibility method - Check flaw-specific conflicts
    static checkFlawConflicts(character, flawId) {
        const errors = [];
        const warnings = []; // Changed from errors to warnings
    
        switch(flawId) {
            case 'slow':
                // CHANGED: Convert to warning instead of error
                if (character.archetypes.movement && character.archetypes.movement !== 'none') {
                    warnings.push('Slow passive bonus may conflict with movement archetype. Consider the narrative implications.');
                }
                break;
            case 'weak':
                // Keep this validation as it affects point pools
                break;
            case 'combatFocused':
                // CHANGED: Convert to warning
                if (character.utilityPurchases ) {
                    warnings.push('Combat Focused passive bonus may limit utility options. Consider the implications.');
                }
                break;
        }
    
        return { errors, warnings };
    }

    // Remove passive bonus
    static removePassiveBonus(character, passiveBonusIndex) {
        return this.removeFlaw(character, passiveBonusIndex);
    }

    // Backward compatibility method - Remove flaw
    static removeFlaw(character, flawIndex) {
        if (flawIndex >= 0 && flawIndex < character.mainPoolPurchases.flaws.length) {
            character.mainPoolPurchases.flaws.splice(flawIndex, 1);
        }
        return character;
    }

    // Remove conditional bonus (new system)
    static removeConditionalBonus(character, conditionalBonusIndex) {
        if (!character.mainPoolPurchases.conditionalBonuses) {
            return character;
        }
        if (conditionalBonusIndex >= 0 && conditionalBonusIndex < character.mainPoolPurchases.conditionalBonuses.length) {
            character.mainPoolPurchases.conditionalBonuses.splice(conditionalBonusIndex, 1);
        }
        return character;
    }


    // Calculate stat bonuses from passive bonuses (for character sheet)
    static calculatePassiveBonusBonuses(character) {
        return this.calculateFlawBonuses(character);
    }

    // Backward compatibility method - Calculate stat bonuses from flaws (for character sheet)
    static calculateFlawBonuses(character) {
        const bonuses = {};
        const stackingPenalty = {}; // Tracks how many times a stat has been picked for penalty

        character.mainPoolPurchases.flaws.forEach(flawPurchase => {
            const flawDef = (gameDataManager.getAvailableFlaws() || []).find(f => f.id === flawPurchase.flawId);
            if (flawDef && flawPurchase.statBonus) {
                const statId = flawPurchase.statBonus;
                if (!bonuses[statId]) {
                    bonuses[statId] = 0;
                    stackingPenalty[statId] = 0;
                }
                
                // Each passive bonus provides a +Tier bonus, but stacking reduces it.
                // The *first* passive bonus giving a bonus to a stat gives +Tier.
                // The *second* passive bonus giving a bonus to the *same* stat gives +Tier-1, etc. min 1.
                const bonusValue = Math.max(1, character.tier - stackingPenalty[statId]);
                bonuses[statId] += bonusValue;
                stackingPenalty[statId]++;
            }
        });

        return bonuses;
    }

    // Calculate stat bonuses from conditional bonuses (new system)
    static calculateConditionalBonusBonuses(character, currentConditions = []) {
        const bonuses = {};
        const stackingPenalty = {};

        if (!character.mainPoolPurchases.conditionalBonuses) {
            return bonuses;
        }

        character.mainPoolPurchases.conditionalBonuses.forEach(conditionalBonus => {
            // Check if the conditional bonus's condition is met
            const conditionMet = currentConditions.includes(conditionalBonus.conditionalBonusId);

            if (conditionMet) {
                // A conditional bonus provides bonus to TWO stats
                conditionalBonus.statBonuses.forEach(statId => {
                    if (!bonuses[statId]) {
                        bonuses[statId] = 0;
                        stackingPenalty[statId] = 0;
                    }

                    const bonusValue = Math.max(1, character.tier - stackingPenalty[statId]);
                    bonuses[statId] += bonusValue;
                    stackingPenalty[statId]++;
                });
            }
        });

        return bonuses;
    }

}