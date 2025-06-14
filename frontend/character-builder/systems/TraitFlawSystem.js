// TraitFlawSystem.js - REFACTORED to use PointPoolCalculator and gameDataManager
import { PointPoolCalculator } from '../calculators/PointPoolCalculator.js';
import { GameConstants } from '../core/GameConstants.js';
import { gameDataManager } from '../core/GameDataManager.js'; // ADDED

export class TraitFlawSystem {
    // Get all available flaws with their restrictions
    static getAvailableFlaws() {
        return gameDataManager.getAvailableFlaws() || []; // MODIFIED
    }

    // Get available stat bonuses for flaws
    static getFlawStatOptions() {
        return gameDataManager.getGenericStatOptions() || []; // MODIFIED
    }

    // Get trait condition tiers
    static getTraitConditionTiers() {
        return gameDataManager.getTraitConditionTiers() || {}; // MODIFIED
    }

    // Get trait stat options (same as flaws)
    static getTraitStatOptions() {
        return gameDataManager.getGenericStatOptions() || []; // MODIFIED
    }
    
    static getTraitCost() {
        return GameConstants.TRAIT_COST; // Assuming this is still in GameConstants
    }

    // Validate flaw purchase
    static validateFlawPurchase(character, flawId, statBonus) {
        const errors = [];
        const warnings = [];
        
        const flaw = (gameDataManager.getAvailableFlaws() || []).find(f => f.id === flawId); // MODIFIED
        if (!flaw) {
            errors.push('Invalid flaw selected');
            return { isValid: false, errors, warnings };
        }

        // Check if flaw already purchased
        if (character.mainPoolPurchases.flaws.some(f => f.flawId === flawId)) {
            errors.push('Flaw already purchased');
        }

        // Validate stat bonus selection
        if (statBonus && !(gameDataManager.getGenericStatOptions() || []).some(opt => opt.id === statBonus)) { // MODIFIED
            errors.push('Invalid stat bonus selection');
        }

        // Check for flaw-specific conflicts
        const conflictCheck = this.checkFlawConflicts(character, flawId);
        errors.push(...conflictCheck.errors);
        warnings.push(...conflictCheck.warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Validate trait purchase
    static validateTraitPurchase(character, traitData) {
        const errors = [];
        const warnings = [];

        // Validate condition tier total
        const totalTierCost = this.calculateTraitConditionCost(traitData.conditions, traitData.variableCosts);
        if (totalTierCost > 3) {
            errors.push(`Condition combination exceeds 3 tier limit (currently ${totalTierCost})`);
        } else if (totalTierCost <= 0 && traitData.conditions.length > 0) {
            // This implies conditions were selected but their costs weren't found/summed correctly.
            warnings.push('Trait conditions selected, but total tier cost is zero. Check condition definitions.');
        }


        // Validate stat selections
        if (!traitData.statBonuses || traitData.statBonuses.length !== 2) {
            errors.push('Must select exactly 2 stat bonuses');
        }

        const validStats = (gameDataManager.getGenericStatOptions() || []).map(s => s.id); // MODIFIED
        traitData.statBonuses?.forEach((stat, index) => {
            if (!validStats.includes(stat)) {
                errors.push(`Invalid stat bonus ${index + 1}: ${stat}`);
            }
        });

        // Validate conditions
        if (!traitData.conditions || traitData.conditions.length === 0) {
            errors.push('Must select at least one condition');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Purchase flaw with corrected economics
    static purchaseFlaw(character, flawId, statBonus) {
        const validation = this.validateFlawPurchase(character, flawId, statBonus);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }

        const flaw = (gameDataManager.getAvailableFlaws() || []).find(f => f.id === flawId); // MODIFIED
        if (!flaw) throw new Error(`Flaw definition for ${flawId} not found.`);
        
        character.mainPoolPurchases.flaws.push({
            flawId,
            name: flaw.name,
            cost: flaw.cost, // Flaws cost points now
            statBonus: statBonus || null,
            purchasedAt: new Date().toISOString()
        });

        return character;
    }

    // Purchase trait
    static purchaseTrait(character, traitData) {
        const validation = this.validateTraitPurchase(character, traitData);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        const traitCost = this.getTraitCost();

        character.mainPoolPurchases.traits.push({
            id: Date.now().toString(),
            conditions: traitData.conditions,
            statBonuses: traitData.statBonuses,
            variableCosts: traitData.variableCosts || {},
            cost: traitCost,
            purchasedAt: new Date().toISOString()
        });

        return character;
    }

    // Calculate trait condition tier cost
    static calculateTraitConditionCost(conditions, variableCosts = {}) {
        const tiers = gameDataManager.getTraitConditionTiers() || {}; // MODIFIED
        let totalCost = 0;

        conditions.forEach(conditionId => {
            for (const tier of Object.values(tiers)) {
                if (tier.conditions && tier.conditions.some(c => c.id === conditionId)) { // Added tier.conditions check
                    // Check if this is a variable cost condition
                    if (tier.cost === "Variable") {
                        totalCost += variableCosts[conditionId] || 1; // Default to 1 if not specified
                    } else {
                        totalCost += tier.cost;
                    }
                    break;
                }
            }
        });

        return totalCost;
    }

    // Check flaw-specific conflicts
    static checkFlawConflicts(character, flawId) {
        const errors = [];
        const warnings = []; // Changed from errors to warnings
    
        switch(flawId) {
            case 'slow':
                // CHANGED: Convert to warning instead of error
                if (character.archetypes.movement && character.archetypes.movement !== 'none') {
                    warnings.push('Slow flaw may conflict with movement archetype. Consider the narrative implications.');
                }
                break;
            case 'weak':
                // Keep this validation as it affects point pools
                break;
            case 'combatFocused':
                // CHANGED: Convert to warning
                if (character.utilityPurchases ) {
                    warnings.push('Combat Focused flaw may limit utility options. Consider the implications.');
                }
                break;
        }
    
        return { errors, warnings };
    }

    // Remove flaw
    static removeFlaw(character, flawIndex) {
        if (flawIndex >= 0 && flawIndex < character.mainPoolPurchases.flaws.length) {
            character.mainPoolPurchases.flaws.splice(flawIndex, 1);
        }
        return character;
    }

    // Remove trait
    static removeTrait(character, traitIndex) {
        if (traitIndex >= 0 && traitIndex < character.mainPoolPurchases.traits.length) {
            character.mainPoolPurchases.traits.splice(traitIndex, 1);
        }
        return character;
    }

    // Calculate stat bonuses from flaws (for character sheet)
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
                
                // Each flaw provides a +Tier bonus, but stacking reduces it.
                // The *first* flaw giving a bonus to a stat gives +Tier.
                // The *second* flaw giving a bonus to the *same* stat gives +Tier-1, etc. min 1.
                const bonusValue = Math.max(1, character.tier - stackingPenalty[statId]);
                bonuses[statId] += bonusValue;
                stackingPenalty[statId]++;
            }
        });

        return bonuses;
    }

    // Calculate stat bonuses from traits (when conditions are met)
    static calculateTraitBonuses(character, currentConditions = []) {
        const bonuses = {};
        const stackingPenalty = {}; // Tracks how many times a stat has been picked for penalty

        character.mainPoolPurchases.traits.forEach(trait => {
            // A trait's conditions are an array of condition IDs.
            // Check if ALL conditions for this trait are met.
            const conditionsMet = trait.conditions.every(conditionId => 
                currentConditions.includes(conditionId) // currentConditions is an array of active condition IDs.
            );

            if (conditionsMet) {
                // A trait provides bonus to TWO stats.
                trait.statBonuses.forEach(statId => {
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