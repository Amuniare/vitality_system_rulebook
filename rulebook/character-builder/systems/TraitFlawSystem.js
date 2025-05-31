// TraitFlawSystem.js - Traits and Flaws management
import { GameConstants } from '../core/GameConstants.js';

export class TraitFlawSystem {
    // Get all available traits
    static getAvailableTraits() {
        return [
            {
                id: 'rooted',
                name: 'Rooted',
                cost: GameConstants.TRAIT_COST,
                tier: 1,
                description: 'Cannot move this turn',
                condition: 'no_movement',
                bonusCount: 2
            },
            {
                id: 'vengeful',
                name: 'Vengeful',
                cost: GameConstants.TRAIT_COST,
                tier: 1,
                description: 'Must have been hit since last turn',
                condition: 'took_damage',
                bonusCount: 2
            },
            {
                id: 'bloodied',
                name: 'Bloodied',
                cost: 25,
                tier: 2,
                description: 'Below half health',
                condition: 'half_hp',
                bonusCount: 2
            },
            {
                id: 'desperate',
                name: 'Desperate',
                cost: 35,
                tier: 3,
                description: 'Below quarter health',
                condition: 'quarter_hp',
                bonusCount: 2
            },
            {
                id: 'overwhelmed',
                name: 'Overwhelmed',
                cost: 20,
                tier: 1,
                description: 'Outnumbered 2:1 or more',
                condition: 'outnumbered',
                bonusCount: 2
            },
            {
                id: 'focused',
                name: 'Focused',
                cost: 15,
                tier: 1,
                description: 'Targeting same enemy as last turn',
                condition: 'same_target',
                bonusCount: 2
            },
            {
                id: 'protected',
                name: 'Protected',
                cost: 25,
                tier: 2,
                description: 'Ally is adjacent',
                condition: 'ally_adjacent',
                bonusCount: 2
            },
            {
                id: 'isolated',
                name: 'Isolated',
                cost: 30,
                tier: 2,
                description: 'No allies within 2 spaces',
                condition: 'no_nearby_allies',
                bonusCount: 2
            },
            {
                id: 'elevated',
                name: 'Elevated',
                cost: 10,
                tier: 1,
                description: 'Higher ground than target',
                condition: 'higher_ground',
                bonusCount: 2
            },
            {
                id: 'charging',
                name: 'Charging',
                cost: 20,
                tier: 1,
                description: 'Moved at least 2 spaces this turn',
                condition: 'moved_distance',
                bonusCount: 2
            }
        ];
    }
    
    // Get all available flaws
    static getAvailableFlaws() {
        return [
            {
                id: 'balanced',
                name: 'Balanced',
                bonus: GameConstants.FLAW_BONUS,
                description: 'Must have half Tier in each Combat Attribute',
                effect: 'attribute_restriction',
                restriction: 'minimum_combat_attributes'
            },
            {
                id: 'slow',
                name: 'Slow',
                bonus: GameConstants.FLAW_BONUS,
                description: 'No movement archetype allowed',
                effect: 'archetype_restriction',
                restriction: 'no_movement_archetype'
            },
            {
                id: 'combatFocused',
                name: 'Combat Focused',
                bonus: GameConstants.FLAW_BONUS,
                description: 'No Utility abilities',
                effect: 'utility_restriction',
                restriction: 'no_utility_purchases'
            },
            {
                id: 'sickly',
                name: 'Sickly',
                bonus: GameConstants.FLAW_BONUS,
                description: 'Maximum Health Pool reduced by 30',
                effect: 'health_reduction',
                restriction: 'hp_penalty'
            },
            {
                id: 'unresponsive',
                name: 'Unresponsive',
                bonus: GameConstants.FLAW_BONUS,
                description: 'Cannot take Reactions, no Tier to Initiative, no Surprise rounds',
                effect: 'reaction_restriction',
                restriction: 'no_reactions'
            },
            {
                id: 'peaked',
                name: 'Peaked',
                bonus: GameConstants.FLAW_BONUS,
                description: 'Cannot use Efforts',
                effect: 'effort_restriction',
                restriction: 'no_efforts'
            },
            {
                id: 'weak',
                name: 'Weak',
                bonus: GameConstants.FLAW_BONUS,
                description: '1 fewer Combat Attribute Points',
                effect: 'point_reduction',
                restriction: 'combat_point_penalty'
            },
            {
                id: 'powerLoss',
                name: 'Power Loss',
                bonus: GameConstants.FLAW_BONUS,
                description: 'Lose powers under specific circumstances',
                effect: 'conditional_disability',
                restriction: 'situational_power_loss'
            },
            {
                id: 'singleTargetSpecialist',
                name: 'Single Target Specialist',
                bonus: GameConstants.FLAW_BONUS,
                description: 'Choose Melee OR Ranged attacks only',
                effect: 'attack_restriction',
                restriction: 'single_attack_type'
            },
            {
                id: 'equipmentDependent',
                name: 'Equipment Dependent',
                bonus: GameConstants.FLAW_BONUS,
                description: 'Lose archetype benefit without specific item',
                effect: 'equipment_dependency',
                restriction: 'requires_equipment'
            },
            {
                id: 'stubborn',
                name: 'Stubborn',
                bonus: GameConstants.FLAW_BONUS,
                description: 'Cannot benefit from Assist actions or ally bonuses',
                effect: 'assistance_restriction',
                restriction: 'no_ally_benefits'
            }
        ];
    }
    
    // Get available stat bonus targets
    static getStatBonusTargets() {
        return [
            { id: 'accuracy', name: 'Accuracy', description: 'Bonus to hit with attacks' },
            { id: 'damage', name: 'Damage', description: 'Bonus to damage rolls' },
            { id: 'conditions', name: 'Conditions', description: 'Bonus to condition rolls' },
            { id: 'avoidance', name: 'Avoidance', description: 'Bonus to avoid attacks' },
            { id: 'durability', name: 'Durability', description: 'Damage reduction' },
            { id: 'speed', name: 'Speed', description: 'Movement bonus' },
            { id: 'allResistances', name: 'All Resistances', description: 'Bonus to Resolve, Stability, Vitality' }
        ];
    }
    
    // Validate trait purchase
    static validateTraitPurchase(character, traitId, statBonuses) {
        const errors = [];
        const warnings = [];
        
        const trait = this.getAvailableTraits().find(t => t.id === traitId);
        if (!trait) {
            errors.push('Invalid trait');
            return { isValid: false, errors, warnings };
        }
        
        // Check if already purchased
        if (character.mainPoolPurchases.traits.some(t => t.traitId === traitId)) {
            errors.push('Trait already purchased');
        }
        
        // Check stat bonus count
        if (statBonuses.length !== trait.bonusCount) {
            errors.push(`Trait requires exactly ${trait.bonusCount} stat bonuses`);
        }
        
        // Check valid stat targets
        const validStats = this.getStatBonusTargets().map(s => s.id);
        const invalidStats = statBonuses.filter(stat => !validStats.includes(stat));
        if (invalidStats.length > 0) {
            errors.push(`Invalid stat bonuses: ${invalidStats.join(', ')}`);
        }
        
        // Check point cost
        const pointsAvailable = this.calculateAvailableMainPoolPoints(character);
        if (trait.cost > pointsAvailable) {
            errors.push(`Insufficient main pool points (need ${trait.cost}, have ${pointsAvailable})`);
        }
        
        // Check trait tier limit (up to 3 tiers total)
        const currentTierTotal = character.mainPoolPurchases.traits.reduce((total, t) => {
            const traitData = this.getAvailableTraits().find(tr => tr.id === t.traitId);
            return total + (traitData ? traitData.tier : 0);
        }, 0);
        
        if (currentTierTotal + trait.tier > 3) {
            errors.push(`Total trait tiers cannot exceed 3 (current: ${currentTierTotal}, adding: ${trait.tier})`);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    // Purchase a trait
    static purchaseTrait(character, traitId, statBonuses) {
        const validation = this.validateTraitPurchase(character, traitId, statBonuses);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const trait = this.getAvailableTraits().find(t => t.id === traitId);
        
        character.mainPoolPurchases.traits.push({
            traitId: traitId,
            name: trait.name,
            cost: trait.cost,
            tier: trait.tier,
            condition: trait.condition,
            statBonuses: statBonuses,
            purchased: new Date().toISOString()
        });
        
        return character;
    }
    
    // Validate flaw purchase
    static validateFlawPurchase(character, flawId, statBonus) {
        const errors = [];
        const warnings = [];
        
        const flaw = this.getAvailableFlaws().find(f => f.id === flawId);
        if (!flaw) {
            errors.push('Invalid flaw');
            return { isValid: false, errors, warnings };
        }
        
        // Check if already purchased
        if (character.mainPoolPurchases.flaws.some(f => f.flawId === flawId)) {
            errors.push('Flaw already purchased');
        }
        
        // Check valid stat target
        const validStats = this.getStatBonusTargets().map(s => s.id);
        if (statBonus && !validStats.includes(statBonus)) {
            errors.push(`Invalid stat bonus: ${statBonus}`);
        }
        
        // Check flaw-specific restrictions
        const restrictionCheck = this.validateFlawRestrictions(character, flawId);
        errors.push(...restrictionCheck.errors);
        warnings.push(...restrictionCheck.warnings);
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    
    // Validate flaw restrictions against current build
    static validateFlawRestrictions(character, flawId) {
        const errors = [];
        const warnings = [];
        
        switch(flawId) {
            case 'balanced':
                // Check if combat attributes can meet minimum requirement
                const minRequired = Math.floor(character.tier / 2);
                const combatAttrCount = 4; // focus, mobility, power, endurance
                const totalRequired = minRequired * combatAttrCount;
                const availablePoints = character.tier * 2; // combat attribute pool
                
                if (totalRequired > availablePoints) {
                    errors.push(`Balanced flaw impossible: need ${totalRequired} points, have ${availablePoints}`);
                }
                break;
                
            case 'slow':
                if (character.archetypes.movement && character.archetypes.movement !== 'none') {
                    warnings.push('Slow flaw will remove movement archetype');
                }
                break;
                
            case 'combatFocused':
                if (character.utilityPurchases && Object.values(character.utilityPurchases).some(cat => 
                    Array.isArray(cat) ? cat.length > 0 : Object.values(cat).some(arr => arr.length > 0)
                )) {
                    warnings.push('Combat Focused flaw will remove utility purchases');
                }
                break;
                
            case 'singleTargetSpecialist':
                const hasMultipleAttackTypes = character.specialAttacks.some(attack => 
                    attack.attackTypes.includes('melee') && attack.attackTypes.includes('ranged')
                );
                if (hasMultipleAttackTypes) {
                    warnings.push('Single Target Specialist will restrict existing attack types');
                }
                break;
        }
        
        return { errors, warnings };
    }
    
    // Purchase a flaw
    static purchaseFlaw(character, flawId, statBonus = null) {
        const validation = this.validateFlawPurchase(character, flawId, statBonus);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const flaw = this.getAvailableFlaws().find(f => f.id === flawId);
        
        character.mainPoolPurchases.flaws.push({
            flawId: flawId,
            name: flaw.name,
            bonus: flaw.bonus,
            effect: flaw.effect,
            restriction: flaw.restriction,
            statBonus: statBonus,
            purchased: new Date().toISOString()
        });
        
        // Apply flaw effects immediately
        this.applyFlawEffects(character, flawId);
        
        return character;
    }
    
    // Apply flaw effects to character
    static applyFlawEffects(character, flawId) {
        switch(flawId) {
            case 'slow':
                character.archetypes.movement = null;
                break;
                
            case 'combatFocused':
                // Clear utility purchases
                character.utilityPurchases = {
                    expertise: {
                        awareness: { basic: [], mastered: [] },
                        communication: { basic: [], mastered: [] },
                        intelligence: { basic: [], mastered: [] },
                        focus: { basic: [], mastered: [] },
                        mobility: { basic: [], mastered: [] },
                        endurance: { basic: [], mastered: [] },
                        power: { basic: [], mastered: [] }
                    },
                    features: [],
                    senses: [],
                    movement: [],
                    descriptors: []
                };
                break;
                
            case 'weak':
                // This affects point pool calculation, handled in PointPoolCalculator
                break;
        }
    }
    
    // Calculate stacking bonuses (reduce by 1 for each additional bonus to same stat)
    static calculateStackingBonuses(character) {
        const bonuses = {};
        
        // Collect all stat bonuses from traits and flaws
        character.mainPoolPurchases.traits.forEach(trait => {
            trait.statBonuses.forEach(stat => {
                if (!bonuses[stat]) bonuses[stat] = [];
                bonuses[stat].push({
                    source: 'trait',
                    name: trait.name,
                    baseValue: character.tier
                });
            });
        });
        
        character.mainPoolPurchases.flaws.forEach(flaw => {
            if (flaw.statBonus) {
                if (!bonuses[flaw.statBonus]) bonuses[flaw.statBonus] = [];
                bonuses[flaw.statBonus].push({
                    source: 'flaw',
                    name: flaw.name,
                    baseValue: character.tier
                });
            }
        });
        
        // Apply stacking reduction
        const finalBonuses = {};
        Object.entries(bonuses).forEach(([stat, bonusArray]) => {
            let total = 0;
            bonusArray.forEach((bonus, index) => {
                const stackingPenalty = index; // 0 for first, 1 for second, etc.
                const actualValue = Math.max(0, bonus.baseValue - stackingPenalty);
                total += actualValue;
            });
            finalBonuses[stat] = total;
        });
        
        return finalBonuses;
    }
    
    // Calculate available main pool points considering flaws
    static calculateAvailableMainPoolPoints(character) {
        const basePools = character.tier > 2 ? (character.tier - 2) * 15 : 0;
        const flawBonus = character.mainPoolPurchases.flaws.length * GameConstants.FLAW_BONUS;
        const extraordinaryBonus = character.archetypes.uniqueAbility === 'extraordinary' ? 
            Math.max(0, (character.tier - 2) * 15) : 0;
        
        const totalAvailable = basePools + flawBonus + extraordinaryBonus;
        
        // Calculate spent
        const spentOnTraits = character.mainPoolPurchases.traits.reduce((total, trait) => total + trait.cost, 0);
        const spentOnBoons = character.mainPoolPurchases.boons.reduce((total, boon) => total + boon.cost, 0);
        const spentOnUpgrades = character.mainPoolPurchases.primaryActionUpgrades.length * GameConstants.PRIMARY_TO_QUICK_COST;
        
        const totalSpent = spentOnTraits + spentOnBoons + spentOnUpgrades;
        
        return totalAvailable - totalSpent;
    }
    
    // Remove trait
    static removeTrait(character, traitId) {
        const index = character.mainPoolPurchases.traits.findIndex(t => t.traitId === traitId);
        if (index === -1) {
            throw new Error('Trait not found');
        }
        
        character.mainPoolPurchases.traits.splice(index, 1);
        return character;
    }
    
    // Remove flaw
    static removeFlaw(character, flawId) {
        const index = character.mainPoolPurchases.flaws.findIndex(f => f.flawId === flawId);
        if (index === -1) {
            throw new Error('Flaw not found');
        }
        
        character.mainPoolPurchases.flaws.splice(index, 1);
        
        // Remove flaw effects
        this.removeFlawEffects(character, flawId);
        
        return character;
    }
    
    // Remove flaw effects
    static removeFlawEffects(character, flawId) {
        switch(flawId) {
            case 'slow':
                // Don't automatically restore movement archetype
                break;
                
            case 'combatFocused':
                // Don't automatically restore utility purchases
                break;
        }
    }
    
    // Get trait/flaw summary for display
    static getTraitFlawSummary(character) {
        const traits = character.mainPoolPurchases.traits.map(trait => ({
            name: trait.name,
            cost: trait.cost,
            tier: trait.tier,
            bonuses: trait.statBonuses.join(', ')
        }));
        
        const flaws = character.mainPoolPurchases.flaws.map(flaw => ({
            name: flaw.name,
            bonus: flaw.bonus,
            statBonus: flaw.statBonus || 'None'
        }));
        
        const stackingBonuses = this.calculateStackingBonuses(character);
        
        return {
            traits,
            flaws,
            stackingBonuses,
            totalFlawBonus: flaws.length * GameConstants.FLAW_BONUS,
            totalTraitCost: traits.reduce((total, trait) => total + trait.cost, 0)
        };
    }
}