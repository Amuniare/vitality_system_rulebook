// TraitFlawSystem.js - Traits and Flaws purchase system with proper economics
import { GameConstants } from '../core/GameConstants.js';

export class TraitFlawSystem {
    // Get all available flaws with their restrictions
    static getAvailableFlaws() {
        return [
            {
                id: 'balanced',
                name: 'Balanced',
                cost: 30,
                description: 'Must have at least (Tier ÷ 2) in each Combat Attribute, can only add Tier bonus once to each stat',
                restriction: 'Must maintain minimum combat attribute requirements'
            },
            {
                id: 'slow',
                name: 'Slow',
                cost: 30,
                description: 'No Movement Archetype',
                restriction: 'Cannot select any movement archetype'
            },
            {
                id: 'combatFocused',
                name: 'Combat Focused',
                cost: 30,
                description: 'No Utility abilities',
                restriction: 'Cannot purchase utility abilities'
            },
            {
                id: 'sickly',
                name: 'Sickly',
                cost: 30,
                description: 'Maximum Health Pool reduced by 30',
                restriction: 'Permanent -30 HP reduction'
            },
            {
                id: 'unresponsive',
                name: 'Unresponsive',
                cost: 30,
                description: 'Cannot take Reactions, don\'t add Tier to Initiative, cannot benefit from Surprise rounds',
                restriction: 'No reactions or initiative bonus'
            },
            {
                id: 'peaked',
                name: 'Peaked',
                cost: 30,
                description: 'Cannot use Efforts',
                restriction: 'No effort system access'
            },
            {
                id: 'weak',
                name: 'Weak',
                cost: 30,
                description: '1 fewer Combat Attribute Points',
                restriction: 'Reduced combat attribute pool'
            },
            {
                id: 'powerLoss',
                name: 'Power Loss',
                cost: 30,
                description: 'Lose powers under specific circumstances (discuss with GM)',
                restriction: 'Conditional power loss'
            },
            {
                id: 'singleTargetSpecialist',
                name: 'Single Target Specialist',
                cost: 30,
                description: 'Choose Melee OR Ranged attacks only',
                restriction: 'Limited to one attack type'
            },
            {
                id: 'equipmentDependent',
                name: 'Equipment Dependent',
                cost: 30,
                description: 'Choose specific item; lose access to one Archetype benefit without it, it is noticeable and you can be disarmed of it',
                restriction: 'Archetype benefit tied to equipment'
            },
            {
                id: 'stubborn',
                name: 'Stubborn',
                cost: 30,
                description: 'Cannot benefit from Assist actions, healing, or any other ally bonuses (they can\'t block for you, or move you via carry)',
                restriction: 'No ally assistance benefits'
            }
        ];
    }

    // Get available stat bonuses for flaws
    static getFlawStatOptions() {
        return [
            { id: 'accuracy', name: 'Accuracy', description: 'Bonus to all attack rolls' },
            { id: 'damage', name: 'Damage', description: 'Bonus to all damage rolls' },
            { id: 'conditions', name: 'Conditions', description: 'Bonus to all condition rolls' },
            { id: 'avoidance', name: 'Avoidance', description: 'Bonus to defense against attacks' },
            { id: 'durability', name: 'Durability', description: 'Bonus to damage resistance' },
            { id: 'speed', name: 'Speed', description: 'Bonus to movement and initiative' },
            { id: 'allResistances', name: 'All Resistances', description: 'Bonus to Resolve, Stability, and Vitality' }
        ];
    }

    // Get trait condition tiers
    static getTraitConditionTiers() {
        return {
            tier1: {
                cost: 1,
                name: 'Tier 1 Conditions (Easy to maintain)',
                conditions: [
                    { id: 'rooted', name: 'Rooted', description: 'Cannot move this turn' },
                    { id: 'longDistanceFighter', name: 'Long Distance Fighter', description: 'No enemies within 5 spaces' },
                    { id: 'unhealthy1', name: 'Unhealthy 1', description: '25+ points below max HP' },
                    { id: 'irregular1', name: 'Irregular 1', description: 'Roll d20, DC 5 to activate each turn' },
                    { id: 'vengeful', name: 'Vengeful', description: 'Been hit since last turn' },
                    { id: 'careful', name: 'Careful', description: 'Not damaged since last turn' },
                    { id: 'passive', name: 'Passive', description: 'Not attacked since last turn' },
                    { id: 'steady', name: 'Steady', description: 'Turn 3 or later' },
                    { id: 'relentless', name: 'Relentless', description: 'Dealt damage to enemy last turn' },
                    { id: 'overwhelm', name: 'Overwhelm', description: 'Dealt damage to enemy this turn' },
                    { id: 'infection', name: 'Infection', description: 'Applied Condition this turn' },
                    { id: 'infected', name: 'Infected', description: 'Applied Condition last turn' },
                    { id: 'temporary3', name: 'Temporary 3', description: 'Activate for 3 turns, recharges after 1 minute rest' }
                ]
            },
            tier2: {
                cost: 2,
                name: 'Tier 2 Conditions (Moderately difficult)',
                conditions: [
                    { id: 'timid', name: 'Timid', description: 'At max HP with no conditions' },
                    { id: 'revenge', name: 'Revenge', description: 'Been damaged since last turn' },
                    { id: 'unbreakable', name: 'Unbreakable', description: 'Been hit but took no damage since last turn' },
                    { id: 'unhealthy2', name: 'Unhealthy 2', description: '75+ points below max HP' },
                    { id: 'untouchable', name: 'Untouchable', description: 'All attacks missed since last turn' },
                    { id: 'slaughter', name: 'Slaughter', description: 'Defeated enemy last turn' },
                    { id: 'onslaught', name: 'Onslaught', description: 'Defeated enemy this turn' },
                    { id: 'patient', name: 'Patient', description: 'Turn 5 or later' },
                    { id: 'temporary2', name: 'Temporary 2', description: 'Activate for 2 turns, recharges after 1 minute rest' }
                ]
            },
            tier3: {
                cost: 3,
                name: 'Tier 3 Conditions (Hardest to maintain)',
                conditions: [
                    { id: 'quickdraw', name: 'Quickdraw', description: 'First 2 rounds of combat' },
                    { id: 'temporary1', name: 'Temporary 1', description: 'Activate for 1 turn, recharges after 1 minute rest' },
                    { id: 'irregular2', name: 'Irregular 2', description: 'Roll d20, DC 10 to activate each turn' },
                    { id: 'nearDeath', name: 'Near Death', description: 'At 0 Hit Points' },
                    { id: 'dangerous', name: 'Dangerous', description: 'No allies within 15 spaces, no civilians within 50 spaces' },
                    { id: 'avenger', name: 'Avenger', description: 'Ally unconscious or great peril occurred' },
                    { id: 'holdingBack', name: 'Holding Back', description: 'No allies within 15 spaces, no civilians within 30 spaces' }
                ]
            }
        };
    }

    // Get trait stat options (same as flaws)
    static getTraitStatOptions() {
        return this.getFlawStatOptions();
    }

    // Validate flaw purchase
    static validateFlawPurchase(character, flawId, statBonus) {
        const errors = [];
        const warnings = [];
        
        const flaw = this.getAvailableFlaws().find(f => f.id === flawId);
        if (!flaw) {
            errors.push('Invalid flaw selected');
            return { isValid: false, errors, warnings };
        }

        // Check if flaw already purchased
        if (character.mainPoolPurchases.flaws.some(f => f.flawId === flawId)) {
            errors.push('Flaw already purchased');
        }

        // Check if can afford (flaws COST points)
        const mainPoolAvailable = this.calculateMainPoolAvailable(character);
        const mainPoolSpent = this.calculateMainPoolSpent(character);
        const remainingPoints = mainPoolAvailable - mainPoolSpent;
        
        if (flaw.cost > remainingPoints) {
            errors.push(`Insufficient main pool points (need ${flaw.cost}, have ${remainingPoints})`);
        }

        // Validate stat bonus selection
        if (statBonus && !this.getFlawStatOptions().some(opt => opt.id === statBonus)) {
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

        // Check cost
        const mainPoolAvailable = this.calculateMainPoolAvailable(character);
        const mainPoolSpent = this.calculateMainPoolSpent(character);
        const remainingPoints = mainPoolAvailable - mainPoolSpent;
        
        if (30 > remainingPoints) {
            errors.push(`Insufficient main pool points (need 30, have ${remainingPoints})`);
        }

        // Validate condition tier total
        const totalTierCost = this.calculateTraitConditionCost(traitData.conditions);
        if (totalTierCost > 3) {
            errors.push(`Condition combination exceeds 3 tier limit (currently ${totalTierCost})`);
        }

        // Validate stat selections
        if (!traitData.statBonuses || traitData.statBonuses.length !== 2) {
            errors.push('Must select exactly 2 stat bonuses');
        }

        const validStats = this.getTraitStatOptions().map(s => s.id);
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

        const flaw = this.getAvailableFlaws().find(f => f.id === flawId);
        
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

        character.mainPoolPurchases.traits.push({
            id: Date.now().toString(),
            conditions: traitData.conditions,
            statBonuses: traitData.statBonuses,
            cost: 30,
            purchasedAt: new Date().toISOString()
        });

        return character;
    }

    // Calculate trait condition tier cost
    static calculateTraitConditionCost(conditions) {
        const tiers = this.getTraitConditionTiers();
        let totalCost = 0;

        conditions.forEach(conditionId => {
            for (const tier of Object.values(tiers)) {
                if (tier.conditions.some(c => c.id === conditionId)) {
                    totalCost += tier.cost;
                    break;
                }
            }
        });

        return totalCost;
    }

    // Check flaw-specific conflicts
    static checkFlawConflicts(character, flawId) {
        const errors = [];
        const warnings = [];

        switch(flawId) {
            case 'slow':
                if (character.archetypes.movement && character.archetypes.movement !== 'none') {
                    errors.push('Slow flaw conflicts with selected movement archetype');
                }
                break;
            case 'weak':
                // Check if combat attributes would go over limit with reduced pool
                const currentCombatSpent = ['focus', 'mobility', 'power', 'endurance']
                    .reduce((sum, attr) => sum + (character.attributes[attr] || 0), 0);
                const reducedPool = (character.tier * 2) - 1;
                if (currentCombatSpent > reducedPool) {
                    errors.push('Current combat attributes exceed reduced pool from Weak flaw');
                }
                break;
            case 'combatFocused':
                if (character.utilityPurchases && Object.keys(character.utilityPurchases).some(key => 
                    character.utilityPurchases[key].length > 0)) {
                    warnings.push('Combat Focused flaw will remove existing utility purchases');
                }
                break;
        }

        return { errors, warnings };
    }

    // Calculate main pool points available
    static calculateMainPoolAvailable(character) {
        const tier = character.tier;
        let available = Math.max(0, (tier - 2) * 15);
        
        // Extraordinary archetype doubles main pool
        if (character.archetypes.uniqueAbility === 'extraordinary') {
            available += Math.max(0, (tier - 2) * 15);
        }
        
        return available;
    }

    // Calculate main pool points spent (flaws now COST points)
    static calculateMainPoolSpent(character) {
        let spent = 0;
        
        // Boons cost points
        spent += character.mainPoolPurchases.boons.reduce((sum, boon) => sum + (boon.cost || 0), 0);
        
        // Traits cost points
        spent += character.mainPoolPurchases.traits.reduce((sum, trait) => sum + (trait.cost || 0), 0);
        
        // Flaws now COST points (major change from previous economics)
        spent += character.mainPoolPurchases.flaws.reduce((sum, flaw) => sum + (flaw.cost || 30), 0);
        
        // Primary action upgrades cost points
        spent += character.mainPoolPurchases.primaryActionUpgrades.length * 30;
        
        return spent;
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
        const stackingPenalty = {};

        character.mainPoolPurchases.flaws.forEach(flaw => {
            if (flaw.statBonus) {
                if (!bonuses[flaw.statBonus]) {
                    bonuses[flaw.statBonus] = 0;
                    stackingPenalty[flaw.statBonus] = 0;
                }
                
                // Apply stacking penalty: each additional bonus to same stat reduces by 1
                const bonus = character.tier - stackingPenalty[flaw.statBonus];
                bonuses[flaw.statBonus] += Math.max(1, bonus);
                stackingPenalty[flaw.statBonus]++;
            }
        });

        return bonuses;
    }

    // Calculate stat bonuses from traits (when conditions are met)
    static calculateTraitBonuses(character, currentConditions = []) {
        const bonuses = {};
        const stackingPenalty = {};

        character.mainPoolPurchases.traits.forEach(trait => {
            // Check if all trait conditions are met
            const conditionsMet = trait.conditions.every(conditionId => 
                currentConditions.includes(conditionId));

            if (conditionsMet) {
                trait.statBonuses.forEach(stat => {
                    if (!bonuses[stat]) {
                        bonuses[stat] = 0;
                        stackingPenalty[stat] = 0;
                    }
                    
                    // Apply stacking penalty
                    const bonus = character.tier - stackingPenalty[stat];
                    bonuses[stat] += Math.max(1, bonus);
                    stackingPenalty[stat]++;
                });
            }
        });

        return bonuses;
    }
}