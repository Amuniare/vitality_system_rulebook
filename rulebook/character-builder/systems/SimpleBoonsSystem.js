// SimpleBoonsSystem.js - Simple boon purchases (split from UniqueAbilitySystem)
import { GameConstants } from '../core/GameConstants.js';

export class SimpleBoonsSystem {
    // Get simple boons (one-time purchases with fixed effects)
    static getAvailableBoons() {
        return [
            {
                id: 'psychic',
                name: 'Psychic',
                cost: 0,
                description: 'All conditions you inflict target Resolve resistance',
                effect: 'condition_targeting_resolve',
                category: 'supernatural'
            },
            {
                id: 'robot',
                name: 'Robot',
                cost: 30,
                description: 'Immune to most Vitality and Resolve conditions, vulnerable to Hacking/Electricity',
                effect: 'condition_immunity_tech_vulnerability',
                category: 'construct'
            },
            {
                id: 'telekinetic',
                name: 'Telekinetic',
                cost: 0,
                description: 'All conditions you inflict target Stability resistance',
                effect: 'condition_targeting_stability',
                category: 'supernatural'
            },
            {
                id: 'biohacker',
                name: 'Biohacker',
                cost: 0,
                description: 'All conditions you inflict target Vitality resistance',
                effect: 'condition_targeting_vitality',
                category: 'supernatural'
            },
            {
                id: 'utilitarian',
                name: 'Utilitarian',
                cost: 15,
                description: 'Gain 10 extra points for Expertise, Features, Senses, and Descriptors',
                effect: 'utility_point_bonus',
                category: 'enhancement',
                bonus: { utilityPoints: 10 }
            },
            {
                id: 'speedOfThought',
                name: 'Speed of Thought',
                cost: 15,
                description: 'Use 2 × Intelligence instead of Awareness for Initiative',
                effect: 'initiative_intelligence',
                category: 'enhancement'
            },
            {
                id: 'perfectionist',
                name: 'Perfectionist',
                cost: 15,
                description: 'Reroll any natural 1s on d20 rolls',
                effect: 'reroll_ones',
                category: 'enhancement'
            },
            {
                id: 'combatReflexes',
                name: 'Combat Reflexes',
                cost: 15,
                description: 'Gain additional Reaction per turn',
                effect: 'extra_reaction',
                category: 'enhancement'
            }
        ];
    }

    // Validate simple boon purchase
    static validateBoonPurchase(character, boonId) {
        const errors = [];
        const warnings = [];
        
        const boon = this.getAvailableBoons().find(b => b.id === boonId);
        if (!boon) {
            errors.push(`Invalid boon: ${boonId}`);
            return { isValid: false, errors, warnings };
        }
        
        // Check if already purchased
        if (character.mainPoolPurchases.boons.some(b => b.boonId === boonId)) {
            errors.push('Boon already purchased');
        }
        
        // Check point cost
        const availablePoints = this.calculateAvailableMainPoolPoints(character);
        
        if (boon.cost > availablePoints) {
            errors.push(`Insufficient main pool points (need ${boon.cost}, have ${availablePoints})`);
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
            const hasHeal = character.mainPoolPurchases.boons.some(b => b.boonId === 'heal');
            const hasRegeneration = character.mainPoolPurchases.boons.some(b => b.boonId === 'regeneration');
            
            if (hasHeal || hasRegeneration) {
                warnings.push('Robot status affects how healing works');
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
        
        const boon = this.getAvailableBoons().find(b => b.id === boonId);
        
        character.mainPoolPurchases.boons.push({
            boonId: boonId,
            name: boon.name,
            cost: boon.cost,
            category: boon.category,
            effect: boon.effect,
            type: 'simple',
            purchased: new Date().toISOString()
        });
        
        return character;
    }

    // Calculate available main pool points
    static calculateAvailableMainPoolPoints(character) {
        const basePools = character.tier > 2 ? (character.tier - 2) * 15 : 0;
        const flawBonus = character.mainPoolPurchases.flaws.length * GameConstants.FLAW_BONUS;
        const extraordinaryBonus = character.archetypes.uniqueAbility === 'extraordinary' ? 
            Math.max(0, (character.tier - 2) * 15) : 0;
        
        const totalAvailable = basePools + flawBonus + extraordinaryBonus;
        
        // Calculate spent
        const spentOnBoons = character.mainPoolPurchases.boons.reduce((total, boon) => total + boon.cost, 0);
        const spentOnTraits = character.mainPoolPurchases.traits.reduce((total, trait) => total + trait.cost, 0);
        const spentOnFlaws = character.mainPoolPurchases.flaws.reduce((total, flaw) => total + flaw.cost, 0);
        const spentOnUpgrades = character.mainPoolPurchases.primaryActionUpgrades.length * GameConstants.PRIMARY_TO_QUICK_COST;
        
        const totalSpent = spentOnBoons + spentOnTraits + spentOnFlaws + spentOnUpgrades;
        
        return totalAvailable - totalSpent;
    }

    // Remove simple boon
    static removeBoon(character, boonId) {
        const index = character.mainPoolPurchases.boons.findIndex(b => b.boonId === boonId);
        if (index === -1) {
            throw new Error('Boon not found');
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
        
        character.mainPoolPurchases.boons.forEach(boon => {
            if (boon.type !== 'simple') return; // Only process simple boons
            
            switch(boon.boonId) {
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
                    effects.utilityPointBonus += 10;
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