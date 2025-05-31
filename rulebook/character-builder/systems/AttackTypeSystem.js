// AttackTypeSystem.js - Attack and Effect Type management
import { GameConstants } from '../core/GameConstants.js';

export class AttackTypeSystem {
    // Get all attack type definitions
    static getAttackTypeDefinitions() {
        return {
            melee: {
                id: 'melee',
                name: 'Melee Attack',
                range: GameConstants.MELEE_RANGE,
                description: 'Adjacent targets only',
                benefit: 'Add Tier to either ALL Melee Accuracy rolls OR ALL Melee Damage/Condition rolls',
                cost: GameConstants.ATTACK_TYPE_COSTS.melee,
                restrictions: [],
                bonuses: { tierToAccuracyOrDamage: true }
            },
            ranged: {
                id: 'ranged',
                name: 'Ranged Attack',
                range: GameConstants.RANGED_RANGE,
                description: '15 spaces base range',
                benefit: 'Standard ranged combat',
                penalty: '-Tier to Accuracy if adjacent to hostile character',
                cost: GameConstants.ATTACK_TYPE_COSTS.ranged,
                restrictions: ['adjacency_penalty'],
                bonuses: {}
            },
            direct: {
                id: 'direct',
                name: 'Direct Attack',
                range: GameConstants.DIRECT_RANGE,
                description: '30 spaces, auto-hit (no Accuracy roll needed)',
                benefit: 'Cannot be dodged',
                penalty: '-Tier to all Damage and Condition rolls',
                cost: GameConstants.ATTACK_TYPE_COSTS.direct,
                restrictions: ['condition_only', 'accuracy_penalty'],
                bonuses: { autoHit: true }
            },
            area: {
                id: 'area',
                name: 'Area Attack',
                range: 'self',
                description: 'Affects multiple targets in area',
                areaOptions: [
                    { type: 'radius', size: GameConstants.AOE_RADIUS, description: '3sp Radius Burst' },
                    { type: 'cone', size: GameConstants.AOE_CONE, description: '6sp Cone' },
                    { type: 'line', size: GameConstants.AOE_LINE, description: '12sp Line' }
                ],
                penalty: '-Tier to all Damage and Condition rolls',
                cost: GameConstants.ATTACK_TYPE_COSTS.area,
                restrictions: ['area_penalty'],
                bonuses: { multiTarget: true }
            }
        };
    }
    
    // Get effect type definitions
    static getEffectTypeDefinitions() {
        return {
            damage: {
                id: 'damage',
                name: 'Damage Only',
                description: 'Pure damage dealing',
                benefit: 'Maximum damage potential',
                cost: 0,
                restrictions: [],
                bonuses: { maxDamage: true }
            },
            condition: {
                id: 'condition',
                name: 'Condition Only',
                description: 'Status effect application',
                benefit: 'Apply conditions without damage',
                cost: 0,
                restrictions: [],
                bonuses: { conditionFocus: true }
            },
            hybrid: {
                id: 'hybrid',
                name: 'Hybrid (Damage + Condition)',
                description: 'Both damage and condition in single attack',
                benefit: 'Versatile attack combining effects',
                penalty: '-Tier to ALL Damage and Condition rolls',
                cost: GameConstants.ATTACK_TYPE_COSTS.hybrid,
                restrictions: ['hybrid_penalty'],
                bonuses: { bothEffects: true }
            }
        };
    }
    
    // Get basic conditions available to all characters
    static getBasicConditions() {
        return [
            {
                id: 'disarm',
                name: 'Disarm',
                resistance: 'stability',
                duration: 'end_of_your_next_turn',
                description: 'Drop held item, launch (Condition roll - Resistance) spaces',
                cost: 0
            },
            {
                id: 'grab',
                name: 'Grab',
                resistance: 'stability',
                duration: 'until_broken',
                description: 'Cannot move unless dragging grabber, contested Capacity to break free',
                cost: 0
            },
            {
                id: 'shove',
                name: 'Shove',
                resistance: 'stability',
                duration: 'instant',
                description: 'Push/pull (Condition roll - Resistance) spaces, 5 spaces = Prone',
                cost: 0
            },
            {
                id: 'prone',
                name: 'Prone',
                resistance: 'stability',
                duration: 'until_stood_up',
                description: 'Adjacent attacks +5 Accuracy, Ranged attacks -5 Accuracy, costs 3 Movement to stand',
                cost: 0
            },
            {
                id: 'blind',
                name: 'Blind',
                resistance: 'vitality',
                duration: 'end_of_your_next_turn',
                description: 'Treat all others as Hidden, attackers ignore base Tier Avoidance bonus',
                cost: 0
            },
            {
                id: 'daze',
                name: 'Daze',
                resistance: 'vitality',
                duration: 'end_of_your_next_turn',
                description: 'Lose Quick Actions and Reactions',
                cost: 0
            },
            {
                id: 'misdirect',
                name: 'Misdirect',
                resistance: 'resolve',
                duration: 'end_of_your_next_turn',
                description: 'Cannot attack the caster',
                cost: 0
            },
            {
                id: 'setup',
                name: 'Setup',
                resistance: 'resolve',
                duration: 'next_attack',
                description: 'Next Accuracy roll vs target gains double Tier bonus',
                cost: 0
            },
            {
                id: 'taunt',
                name: 'Taunt',
                resistance: 'resolve',
                duration: 'end_of_your_next_turn',
                description: '-2×Tier Accuracy against anyone except caster',
                cost: 0
            }
        ];
    }
    
    // Get advanced conditions (require special purchase)
    static getAdvancedConditions() {
        return [
            {
                id: 'control',
                name: 'Control',
                resistance: 'resolve',
                duration: 'start_of_your_next_turn',
                description: 'Take over target\'s next turn completely',
                cost: GameConstants.ADVANCED_CONDITION_COSTS.control
            },
            {
                id: 'capture',
                name: 'Capture',
                resistance: 'stability',
                duration: 'start_of_your_next_turn',
                description: 'Prevent all movement, Avoidance reduced to 10',
                cost: GameConstants.ADVANCED_CONDITION_COSTS.capture
            },
            {
                id: 'stun',
                name: 'Stun',
                resistance: 'resolve_or_vitality',
                duration: 'start_of_your_next_turn',
                description: 'No actions, Avoidance = 0, all attacks auto-hit and crit',
                cost: GameConstants.ADVANCED_CONDITION_COSTS.stun
            },
            {
                id: 'weaken',
                name: 'Weaken',
                resistance: 'vitality',
                duration: 'permanent',
                description: 'Reduce chosen stat by Tier: Accuracy/Damage/Conditions/Avoidance/Durability/All Resistances',
                cost: GameConstants.ADVANCED_CONDITION_COSTS.weaken,
                requiresChoice: true,
                choices: ['accuracy', 'damage', 'conditions', 'avoidance', 'durability', 'allResistances']
            },
            {
                id: 'disableSpecials',
                name: 'Disable Specials',
                resistance: 'resolve_or_vitality',
                duration: 'start_of_your_next_turn',
                description: 'Cannot use Special Attacks',
                cost: GameConstants.ADVANCED_CONDITION_COSTS.disableSpecials
            },
            {
                id: 'mimic',
                name: 'Mimic',
                resistance: 'resolve_or_vitality',
                duration: 'start_of_your_next_turn',
                description: 'Gain use of disabled Special Attacks',
                cost: GameConstants.ADVANCED_CONDITION_COSTS.mimic,
                requires: 'disableSpecials'
            },
            {
                id: 'frighten',
                name: 'Frighten',
                resistance: 'resolve',
                duration: 'start_of_your_next_turn',
                description: 'Move away, defensive actions only',
                cost: GameConstants.ADVANCED_CONDITION_COSTS.frighten
            },
            {
                id: 'enthrall',
                name: 'Enthrall',
                resistance: 'resolve',
                duration: 'start_of_your_next_turn',
                description: 'Must defend caster',
                cost: GameConstants.ADVANCED_CONDITION_COSTS.enthrall
            },
            {
                id: 'frenzy',
                name: 'Frenzy',
                resistance: 'resolve',
                duration: 'start_of_your_next_turn',
                description: 'Attack nearest character randomly',
                cost: GameConstants.ADVANCED_CONDITION_COSTS.frenzy
            }
        ];
    }
    
    // Validate attack type selection for special attack
    static validateAttackTypeSelection(character, attack, attackTypeId) {
        const errors = [];
        const warnings = [];
        
        const attackType = this.getAttackTypeDefinitions()[attackTypeId];
        if (!attackType) {
            errors.push(`Invalid attack type: ${attackTypeId}`);
            return { isValid: false, errors, warnings };
        }
        
        // Check if already selected
        if (attack.attackTypes.includes(attackTypeId)) {
            errors.push('Attack type already selected');
        }
        
        // Check if free from archetype
        const freeTypes = this.getFreeAttackTypesFromArchetype(character);
        const cost = freeTypes.includes(attackTypeId) ? 0 : attackType.cost;
        
        // Check if can afford
        const remainingPoints = attack.upgradePointsAvailable - attack.upgradePointsSpent;
        if (cost > remainingPoints) {
            errors.push(`Insufficient upgrade points (need ${cost}, have ${remainingPoints})`);
        }
        
        // Check restrictions
        const restrictionCheck = this.validateAttackTypeRestrictions(character, attack, attackTypeId);
        errors.push(...restrictionCheck.errors);
        warnings.push(...restrictionCheck.warnings);
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            cost
        };
    }
    
    // Get free attack types from character's archetypes
    static getFreeAttackTypesFromArchetype(character) {
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
    
    // Validate attack type restrictions
    static validateAttackTypeRestrictions(character, attack, attackTypeId) {
        const errors = [];
        const warnings = [];
        
        // Direct attacks must be condition only
        if (attackTypeId === 'direct') {
            if (attack.effectTypes.includes('damage') || attack.effectTypes.includes('hybrid')) {
                errors.push('Direct attacks must be condition only');
            }
        }
        
        // Check archetype conflicts
        const archetype = character.archetypes.specialAttack;
        if (archetype === 'basic' && attackTypeId !== 'melee' && attackTypeId !== 'ranged') {
            errors.push('Basic archetype only allows melee and ranged attacks');
        }
        
        return { errors, warnings };
    }
    
    // Add attack type to special attack
    static addAttackTypeToAttack(character, attack, attackTypeId) {
        const validation = this.validateAttackTypeSelection(character, attack, attackTypeId);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        attack.attackTypes.push(attackTypeId);
        attack.upgradePointsSpent += validation.cost;
        
        return attack;
    }
    
    // Remove attack type from special attack
    static removeAttackTypeFromAttack(character, attack, attackTypeId) {
        const index = attack.attackTypes.indexOf(attackTypeId);
        if (index === -1) {
            throw new Error('Attack type not found');
        }
        
        attack.attackTypes.splice(index, 1);
        
        // Refund cost
        const freeTypes = this.getFreeAttackTypesFromArchetype(character);
        if (!freeTypes.includes(attackTypeId)) {
            const attackType = this.getAttackTypeDefinitions()[attackTypeId];
            attack.upgradePointsSpent -= attackType.cost;
        }
        
        return attack;
    }
    
    // Add effect type to special attack
    static addEffectTypeToAttack(character, attack, effectTypeId) {
        const effectType = this.getEffectTypeDefinitions()[effectTypeId];
        if (!effectType) {
            throw new Error(`Invalid effect type: ${effectTypeId}`);
        }
        
        // Check if already selected
        if (attack.effectTypes.includes(effectTypeId)) {
            throw new Error('Effect type already selected');
        }
        
        // Check cost
        const remainingPoints = attack.upgradePointsAvailable - attack.upgradePointsSpent;
        if (effectType.cost > remainingPoints) {
            throw new Error(`Insufficient upgrade points (need ${effectType.cost}, have ${remainingPoints})`);
        }
        
        attack.effectTypes.push(effectTypeId);
        attack.upgradePointsSpent += effectType.cost;
        
        // Update hybrid flag
        if (effectTypeId === 'hybrid') {
            attack.isHybrid = true;
        }
        
        return attack;
    }
    
    // Add condition to special attack
    static addConditionToAttack(character, attack, conditionId, isAdvanced = false) {
        const condition = isAdvanced ? 
            this.getAdvancedConditions().find(c => c.id === conditionId) :
            this.getBasicConditions().find(c => c.id === conditionId);
            
        if (!condition) {
            throw new Error(`Invalid condition: ${conditionId}`);
        }
        
        // Check if already selected
        const targetArray = isAdvanced ? attack.advancedConditions : attack.basicConditions;
        if (targetArray.includes(conditionId)) {
            throw new Error('Condition already selected');
        }
        
        // Check cost for advanced conditions
        if (isAdvanced && condition.cost > 0) {
            const remainingPoints = attack.upgradePointsAvailable - attack.upgradePointsSpent;
            if (condition.cost > remainingPoints) {
                throw new Error(`Insufficient upgrade points (need ${condition.cost}, have ${remainingPoints})`);
            }
            attack.upgradePointsSpent += condition.cost;
        }
        
        targetArray.push(conditionId);
        
        return attack;
    }
    
    // Calculate total attack type costs for an attack
    static calculateAttackTypeCosts(character, attack) {
        const freeTypes = this.getFreeAttackTypesFromArchetype(character);
        let totalCost = 0;
        
        attack.attackTypes.forEach(typeId => {
            if (!freeTypes.includes(typeId)) {
                const attackType = this.getAttackTypeDefinitions()[typeId];
                totalCost += attackType.cost;
            }
        });
        
        attack.effectTypes.forEach(typeId => {
            const effectType = this.getEffectTypeDefinitions()[typeId];
            totalCost += effectType.cost;
        });
        
        return totalCost;
    }
    
    // Get attack summary with all types and modifiers
    static getAttackSummary(character, attack) {
        const attackTypes = attack.attackTypes.map(id => {
            const def = this.getAttackTypeDefinitions()[id];
            return {
                id,
                name: def.name,
                range: def.range,
                penalties: def.penalty || null
            };
        });
        
        const effectTypes = attack.effectTypes.map(id => {
            const def = this.getEffectTypeDefinitions()[id];
            return {
                id,
                name: def.name,
                penalties: def.penalty || null
            };
        });
        
        const basicConditions = attack.basicConditions.map(id => {
            const def = this.getBasicConditions().find(c => c.id === id);
            return { id, name: def.name };
        });
        
        const advancedConditions = attack.advancedConditions.map(id => {
            const def = this.getAdvancedConditions().find(c => c.id === id);
            return { id, name: def.name };
        });
        
        return {
            attackTypes,
            effectTypes,
            basicConditions,
            advancedConditions,
            isHybrid: attack.isHybrid,
            totalPenalty: this.calculateTotalPenalty(attack)
        };
    }
    
    // Calculate total penalty from all attack/effect types
    static calculateTotalPenalty(attack) {
        let totalPenalty = 0;
        const tier = 1; // Will be passed from character
        
        // Direct and Area attacks have -Tier penalty
        if (attack.attackTypes.includes('direct') || attack.attackTypes.includes('area')) {
            totalPenalty += tier;
        }
        
        // Hybrid attacks have -Tier penalty
        if (attack.isHybrid) {
            totalPenalty += tier;
        }
        
        // Note: Penalties don't stack from multiple sources of same type
        // Most restrictive rule applies
        
        return totalPenalty;
    }
}