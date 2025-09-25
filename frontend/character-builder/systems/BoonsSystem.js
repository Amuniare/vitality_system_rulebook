// BoonsSystem.js - Simple boon purchases (split from UniqueAbilitySystem)
import { PointPoolCalculator } from '../calculators/PointPoolCalculator.js';
import { GameConstants } from '../core/GameConstants.js';
import { gameDataManager } from '../core/GameDataManager.js'; // ADDED

export class BoonsSystem {
    // Get boons (one-time purchases with fixed effects)
    static getAvailableBoons() {
        return gameDataManager.getBoons() || []; // MODIFIED
    }

    // Validate simple boon purchase
    static validateBoonPurchase(character, boonId) {
        const errors = [];
        const warnings = [];
        
        const boon = (gameDataManager.getBoons() || []).find(b => b.id === boonId); // MODIFIED
        if (!boon) {
            errors.push(`Invalid boon: ${boonId}`);
            return { isValid: false, errors, warnings };
        }
        
        // Check if already purchased
        if (character.mainPoolPurchases.boons.some(b => b.boonId === boonId)) {
            errors.push('Boon already purchased');
        }
        
        // Check conflicts with other abilities
        const conflictCheck = this.checkBoonConflicts(character, boonId);
        errors.push(...conflictCheck.errors);
        warnings.push(...conflictCheck.warnings);
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Check for conflicts with other abilities
    static checkBoonConflicts(character, boonId) {
        const errors = [];
        const warnings = [];
        
        // Robot conflicts with biological healing
        if (boonId === 'robot') {
            // Check against complex unique abilities (Heal, Regeneration)
            const complexAbilities = gameDataManager.getComplexUniqueAbilities() || [];
            const healAbility = complexAbilities.find(ab => ab.id === 'heal');
            const regenerationAbility = complexAbilities.find(ab => ab.id === 'regeneration'); // Assuming 'regeneration' is an ID

            const hasHeal = character.mainPoolPurchases.boons.some(b => b.boonId === healAbility?.id && b.type === 'unique');
            const hasRegeneration = character.mainPoolPurchases.boons.some(b => b.boonId === regenerationAbility?.id && b.type === 'unique');
            
            if (hasHeal || hasRegeneration) {
                warnings.push('Robot status affects how healing and regeneration works');
            }
        }
        
        return { errors, warnings };
    }

    // Purchase a simple boon
    static purchaseBoon(character, boonId) {
        const validation = this.validateBoonPurchase(character, boonId);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const boon = (gameDataManager.getBoons() || []).find(b => b.id === boonId); // MODIFIED
        
        character.mainPoolPurchases.boons.push({
            boonId: boonId,
            name: boon.name,
            cost: boon.cost,
            category: boon.category,
            effect: boon.effect,
            type: 'simple', // Ensure type is marked as simple
            purchased: new Date().toISOString()
        });
        
        return character;
    }

    // Remove simple boon
    static removeBoon(character, boonId) {
        const index = character.mainPoolPurchases.boons.findIndex(b => b.boonId === boonId && (b.type === 'simple' || !b.type)); // MODIFIED check for simple
        if (index === -1) {
            throw new Error('Simple boon not found');
        }
        
        character.mainPoolPurchases.boons.splice(index, 1);
        return character;
    }

    // Get boon effects for stat calculations
    static getBoonEffects(character) {
        const effects = {
            conditionTargeting: null,
            utilityPointBonus: 0,
            initiativeModification: null,
            rerollOnes: false,
            extraReactions: 0,
            immunities: [],
            vulnerabilities: []
        };
        
        character.mainPoolPurchases.boons.forEach(boonPurchase => {
            if (boonPurchase.type !== 'boon' && boonPurchase.type !== undefined) return; // Only process boons (or untyped assumed simple)
            
            const boonDef = (gameDataManager.getBoons() || []).find(b => b.id === boonPurchase.boonId); // Get definition
            if (!boonDef) return;

            switch(boonDef.id) { // Use ID from definition
                case 'psychic':
                    effects.conditionTargeting = 'resolve';
                    break;
                case 'telekinetic':
                    effects.conditionTargeting = 'stability';
                    break;
                case 'biohacker':
                    effects.conditionTargeting = 'vitality';
                    break;
                case 'utilitarian':
                    effects.utilityPointBonus += (boonDef.bonus?.utilityPoints || 5); // Use bonus from definition
                    break;
                case 'speedOfThought':
                    effects.initiativeModification = 'intelligence_double';
                    break;
                case 'perfectionist':
                    effects.rerollOnes = true;
                    break;
                case 'combatReflexes':
                    effects.extraReactions += 1;
                    break;
                case 'robot':
                    effects.immunities.push('vitality_conditions', 'resolve_conditions');
                    effects.vulnerabilities.push('electricity', 'hacking');
                    break;
            }
        });
        
        return effects;
    }
}