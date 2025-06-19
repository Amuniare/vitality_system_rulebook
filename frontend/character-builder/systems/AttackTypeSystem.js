
// AttackTypeSystem.js - Attack and Effect Type management
import { GameConstants } from '../core/GameConstants.js';
import { gameDataManager } from '../core/GameDataManager.js'; // ADDED
import { ArchetypeSystem } from './ArchetypeSystem.js'; // For getFreeAttackTypesFromArchetype

export class AttackTypeSystem {
    static getAttackTypeDefinition(typeId, character = null) {
        const definitions = gameDataManager.getAttackTypeDefinitions() || {};
        const def = definitions[typeId];
        if (!def) return null;
        
        // Calculate base cost
        let cost = def.costKey ? GameConstants.ATTACK_TYPE_COSTS[def.costKey] : def.cost;
        
        // Apply archetype discounts if character is provided
        if (character && def.discounts) {
            const attackArchetype = character.archetypes?.attackType;
            if (attackArchetype && def.discounts[attackArchetype]) {
                // Get the discount reference cost (e.g., "area" or "direct")
                const discountKey = def.discounts[attackArchetype];
                const discountCost = GameConstants.ATTACK_TYPE_COSTS[discountKey];
                if (discountCost !== undefined) {
                    cost = discountCost; // Apply 50% discount (30p instead of 60p)
                }
            }
        }
        
        // Resolve keys from GameConstants
        return {
            ...def,
            range: def.rangeKey ? GameConstants[def.rangeKey] : def.range,
            cost: cost,
            areaOptions: def.areaOptions ? def.areaOptions.map(opt => ({
                ...opt,
                size: opt.sizeKey ? GameConstants[opt.sizeKey] : opt.size
            })) : undefined
        };
    }

    static getEffectTypeDefinition(typeId) {
        const definitions = gameDataManager.getEffectTypeDefinitions() || {};
        const def = definitions[typeId];
        if (!def) return null;
        return {
            ...def,
            cost: def.costKey ? GameConstants.ATTACK_TYPE_COSTS[def.costKey] : def.cost
        };
    }
    
    static getBasicConditionDefinition(conditionId) {
        const conditions = gameDataManager.getBasicConditions() || [];
        const cond = conditions.find(c => c.id === conditionId);
        if (!cond) return null;
        return {
            ...cond,
            duration: cond.durationKey ? GameConstants[cond.durationKey] : cond.duration
        };
    }

    static getAdvancedConditionDefinition(conditionId) {
        const conditions = gameDataManager.getAdvancedConditions() || [];
        const cond = conditions.find(c => c.id === conditionId);
        if (!cond) return null;
        return {
            ...cond,
            duration: cond.durationKey ? GameConstants[cond.durationKey] : cond.duration,
            cost: cond.costKey ? GameConstants.ADVANCED_CONDITION_COSTS[cond.costKey] : cond.cost
        };
    }


    // Get all attack type definitions
    static getAttackTypeDefinitions(character = null) { // Now returns resolved definitions with optional character for discounts
        const definitions = gameDataManager.getAttackTypeDefinitions() || {};
        const resolved = {};
        for (const key in definitions) {
            resolved[key] = this.getAttackTypeDefinition(key, character);
        }
        return resolved;
    }
    
    // Get effect type definitions
    static getEffectTypeDefinitions() { // Now returns resolved definitions
        const definitions = gameDataManager.getEffectTypeDefinitions() || {};
        const resolved = {};
        for (const key in definitions) {
            resolved[key] = this.getEffectTypeDefinition(key);
        }
        return resolved;
    }
    
    // Get basic conditions available to all characters
    static getBasicConditions() { // Now returns resolved definitions
        const conditions = gameDataManager.getBasicConditions() || [];
        return conditions.map(c => this.getBasicConditionDefinition(c.id)).filter(Boolean);
    }
    
    // Get advanced conditions (require special purchase)
    static getAdvancedConditions() { // Now returns resolved definitions
        const conditions = gameDataManager.getAdvancedConditions() || [];
        return conditions.map(c => this.getAdvancedConditionDefinition(c.id)).filter(Boolean);
    }
    
    // Validate attack type selection for special attack
    static validateAttackTypeSelection(character, attack, attackTypeId) {
        const errors = [];
        const warnings = [];
        
        const attackType = this.getAttackTypeDefinition(attackTypeId, character); // Pass character for discount calculation
        if (!attackType) {
            errors.push(`Invalid attack type: ${attackTypeId}`);
            return { isValid: false, errors, warnings };
        }
        
        // Check if already selected
        if (attack.attackTypes.includes(attackTypeId)) {
            errors.push('Attack type already selected');
        }
        
        // Check if free from archetype
        const freeTypes = ArchetypeSystem.getFreeAttackTypes(character); // Using ArchetypeSystem
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
    
    // Get free attack types from character's archetypes (moved to ArchetypeSystem but can be proxied or re-imported)
    static getFreeAttackTypesFromArchetype(character) {
        return ArchetypeSystem.getFreeAttackTypes(character); // DELEGATE
    }
    
    // Get free effect types from character's archetypes
    static getFreeEffectTypesFromArchetype(character) {
        if (!character?.archetypes?.effectType) return [];
        
        switch (character.archetypes.effectType) {
            case 'hybridSpecialist':
                return ['hybrid'];
            case 'damageSpecialist':
                return ['damage'];
            case 'crowdControl':
                return ['condition'];
            default:
                return [];
        }
    }
    
    // Validate attack type restrictions
    static validateAttackTypeRestrictions(character, attack, attackTypeId) {
        const errors = [];
        const warnings = [];
        
        // Direct attacks must be condition only
        if (attackTypeId === 'direct') {
            // Check the effect types chosen for the *current* attack object
            if (attack.effectTypes.includes('damage') || attack.effectTypes.includes('hybrid')) {
                errors.push('Direct attacks must be condition only (cannot have "damage" or "hybrid" effect types)');
            }
        }
        
        // Check archetype conflicts
        const archetype = character.archetypes.specialAttack;
        const meleeTypes = ['melee_ac', 'melee_dg_cn'];
        if (archetype === 'basic' && !meleeTypes.includes(attackTypeId) && attackTypeId !== 'ranged') {
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
        
        return attack;
    }
    
    // Remove attack type from special attack
    static removeAttackTypeFromAttack(character, attack, attackTypeId) {
        const index = attack.attackTypes.indexOf(attackTypeId);
        if (index === -1) {
            throw new Error('Attack type not found');
        }
        
        attack.attackTypes.splice(index, 1);
        
        return attack;
    }
    
    // Add effect type to special attack
    static addEffectTypeToAttack(character, attack, effectTypeId) {
        const effectType = this.getEffectTypeDefinition(effectTypeId); // MODIFIED
        if (!effectType) {
            throw new Error(`Invalid effect type: ${effectTypeId}`);
        }
        
        // Check if already selected
        if (attack.effectTypes.includes(effectTypeId)) {
            throw new Error('Effect type already selected');
        }
        
        // Check if free from archetype
        const freeEffectTypes = this.getFreeEffectTypesFromArchetype(character);
        const cost = freeEffectTypes.includes(effectTypeId) ? 0 : effectType.cost;
        
        // Check cost
        const remainingPoints = attack.upgradePointsAvailable - attack.upgradePointsSpent;
        if (cost > remainingPoints) {
            throw new Error(`Insufficient upgrade points (need ${cost}, have ${remainingPoints})`);
        }
        
        attack.effectTypes.push(effectTypeId);
        
        // Update hybrid flag
        if (effectTypeId === 'hybrid') {
            attack.isHybrid = true;
        }
        
        return attack;
    }
    
    // Add condition to special attack
    static addConditionToAttack(character, attack, conditionId, isAdvanced = false) {
        const condition = isAdvanced ?
            this.getAdvancedConditionDefinition(conditionId) :
            this.getBasicConditionDefinition(conditionId);

        if (!condition) {
            throw new Error(`Invalid condition: ${conditionId}`);
        }

        const targetArrayKey = isAdvanced ? 'advancedConditions' : 'basicConditions';
        if (!attack[targetArrayKey]) {
            attack[targetArrayKey] = [];
        }

        if (attack[targetArrayKey].includes(conditionId)) {
            throw new Error('Condition already selected');
        }

        // Ensure cost is applied for advanced conditions
        if (isAdvanced) {
            let cost = condition.cost || 0;
            
            // Check if this advanced condition should be free due to Crowd Control archetype
            const freeConditions = ArchetypeSystem.getFreeAdvancedConditions(character);
            const usedConditions = ArchetypeSystem.countUsedFreeAdvancedConditions(character);
            
            if (freeConditions > 0 && usedConditions < freeConditions) {
                // This advanced condition is free due to Crowd Control archetype
                cost = 0;
            }
            
            const remainingPoints = (attack.upgradePointsAvailable || 0) - (attack.upgradePointsSpent || 0);

            if (cost > 0 && cost > remainingPoints) {
                // We'll allow going over budget but warn the user.
                // The validation happens at a higher level.
                console.warn(`Purchasing ${condition.name} exceeds budget.`);
            }
            
            // Cost will be calculated by SpecialAttackSystem._recalculateUpgradePointsSpent
        }

        attack[targetArrayKey].push(conditionId);

        return attack;
    }
    
    // Remove condition from special attack
    static removeConditionFromAttack(character, attack, conditionId, isAdvanced = false) {
        const targetArrayKey = isAdvanced ? 'advancedConditions' : 'basicConditions';
        if (!attack[targetArrayKey]) {
            attack[targetArrayKey] = [];
        }

        const index = attack[targetArrayKey].indexOf(conditionId);
        if (index === -1) {
            throw new Error('Condition not found');
        }

        attack[targetArrayKey].splice(index, 1);

        // Refund cost for advanced conditions
        if (isAdvanced) {
            const condition = this.getAdvancedConditionDefinition(conditionId);
            if (condition) {
                // Need to check if this condition was purchased with free slots
                // For simplicity, we'll assume the most expensive conditions were purchased first
                // and free conditions were used first (FIFO approach)
                const freeConditions = ArchetypeSystem.getFreeAdvancedConditions(character);
                const remainingConditions = ArchetypeSystem.countUsedFreeAdvancedConditions(character) - 1; // After removal
                
                let refundCost = 0;
                if (remainingConditions >= freeConditions) {
                    // This was a paid condition, refund the cost
                    refundCost = condition.cost || 0;
                }
                
                // Cost will be recalculated by SpecialAttackSystem._recalculateUpgradePointsSpent
            }
        }

        return attack;
    }
    
    // Calculate total attack type costs for an attack
    static calculateAttackTypeCosts(character, attack) {
        const freeTypes = this.getFreeAttackTypesFromArchetype(character);
        let totalCost = 0;
        
        attack.attackTypes.forEach(typeId => {
            if (!freeTypes.includes(typeId)) {
                const attackTypeDef = this.getAttackTypeDefinition(typeId, character); // Pass character for discount calculation
                if (attackTypeDef) totalCost += attackTypeDef.cost;
            }
        });
        
        const freeEffectTypes = this.getFreeEffectTypesFromArchetype(character);
        attack.effectTypes.forEach(typeId => {
            if (!freeEffectTypes.includes(typeId)) {
                const effectTypeDef = this.getEffectTypeDefinition(typeId); // MODIFIED
                if (effectTypeDef) totalCost += effectTypeDef.cost;
            }
        });
        
        // Calculate advanced condition costs (accounting for free conditions from archetype)
        if (attack.advancedConditions && attack.advancedConditions.length > 0) {
            const freeAdvancedConditions = ArchetypeSystem.getFreeAdvancedConditions(character);
            
            if (freeAdvancedConditions > 0) {
                // Count all advanced conditions across all attacks to determine how many free slots are used
                let totalConditionsUsed = 0;
                let freeConditionsUsed = 0;
                
                // Count conditions in attacks that come before this one (by array index)
                const currentAttackIndex = character.specialAttacks.indexOf(attack);
                for (let i = 0; i < currentAttackIndex; i++) {
                    const otherAttack = character.specialAttacks[i];
                    if (otherAttack.advancedConditions) {
                        const conditionsInOtherAttack = otherAttack.advancedConditions.length;
                        totalConditionsUsed += conditionsInOtherAttack;
                        freeConditionsUsed += Math.min(conditionsInOtherAttack, Math.max(0, freeAdvancedConditions - freeConditionsUsed));
                    }
                }
                
                // Now calculate costs for this attack
                let freeConditionsRemainingForThisAttack = Math.max(0, freeAdvancedConditions - freeConditionsUsed);
                
                for (const conditionId of attack.advancedConditions) {
                    const conditionDef = this.getAdvancedConditionDefinition(conditionId);
                    if (conditionDef) {
                        if (freeConditionsRemainingForThisAttack > 0) {
                            // This condition is free
                            freeConditionsRemainingForThisAttack--;
                        } else {
                            // This condition costs points
                            totalCost += conditionDef.cost || 0;
                        }
                    }
                }
            } else {
                // No free conditions available, charge for all
                for (const conditionId of attack.advancedConditions) {
                    const conditionDef = this.getAdvancedConditionDefinition(conditionId);
                    if (conditionDef) {
                        totalCost += conditionDef.cost || 0;
                    }
                }
            }
        }
        
        return totalCost;
    }
    
    // Calculate enhanced area size based on Enhanced Scale upgrades
    static calculateEnhancedAreaSize(attack, baseSize) {
        const enhancedScaleCount = attack.upgrades?.filter(u => u.name === 'Enhanced Scale').length || 0;
        return baseSize * Math.pow(2, enhancedScaleCount);
    }
    
    // Get attack summary with all types and modifiers
    static getAttackSummary(character, attack) {
        const attackTypes = attack.attackTypes.map(id => {
            const def = this.getAttackTypeDefinition(id, character); // Pass character for discount calculation
            if (!def) return {id, name: id, range: 'N/A', penalties: null}; // Fallback
            
            // Calculate enhanced area sizes for area attacks
            let enhancedAreas = null;
            if (def.areaOptions) {
                enhancedAreas = def.areaOptions.map(option => ({
                    ...option,
                    enhancedSize: this.calculateEnhancedAreaSize(attack, option.size)
                }));
            }
            
            return {
                id,
                name: def.name,
                range: def.range,
                penalties: def.penalty || null,
                areaOptions: enhancedAreas
            };
        });
        
        const effectTypes = attack.effectTypes.map(id => {
            const def = this.getEffectTypeDefinition(id); // MODIFIED
            return def ? {
                id,
                name: def.name,
                penalties: def.penalty || null
            } : {id, name: id, penalties: null}; // Fallback
        });
        
        const basicConditions = attack.basicConditions.map(id => {
            const def = this.getBasicConditionDefinition(id); // MODIFIED
            return def ? { id, name: def.name } : {id, name: id}; // Fallback
        });
        
        const advancedConditions = attack.advancedConditions.map(id => {
            const def = this.getAdvancedConditionDefinition(id); // MODIFIED
            return def ? { id, name: def.name } : {id, name: id}; // Fallback
        });
        
        return {
            attackTypes,
            effectTypes,
            basicConditions,
            advancedConditions,
            isHybrid: attack.isHybrid,
            totalPenalty: this.calculateTotalPenalty(character, attack) // Pass character for tier
        };
    }
    
    // Calculate total penalty from all attack/effect types
    static calculateTotalPenalty(character, attack) { // Added character parameter
        let totalPenalty = 0;
        const tier = character.tier; // Get tier from character
        
        // Direct and Area attacks have -Tier penalty
        if (attack.attackTypes.includes('direct') || attack.attackTypes.includes('area')) {
            totalPenalty += tier;
        }
        
        // Hybrid attacks have -Tier penalty
        if (attack.isHybrid) {
            // Check if already penalized by direct/area to avoid double penalty from tier
            if (!(attack.attackTypes.includes('direct') || attack.attackTypes.includes('area'))) {
                totalPenalty += tier;
            }
        }
        //This logic might need refinement. The rule usually is "most restrictive applies" or a single -Tier for these.
        // If it's a single -Tier if ANY of these are true:
        if (attack.attackTypes.includes('direct') || attack.attackTypes.includes('area') || attack.isHybrid) {
            totalPenalty = tier; // Simplified: a single -Tier penalty if any apply
        } else {
            totalPenalty = 0;
        }
        
        return totalPenalty;
    }
    
    // Get free advanced conditions from archetype (for UI display)
    static getFreeAdvancedConditionsFromArchetype(character) {
        const freeConditions = ArchetypeSystem.getFreeAdvancedConditions(character);
        const usedConditions = ArchetypeSystem.countUsedFreeAdvancedConditions(character);
        
        if (freeConditions > 0 && usedConditions < freeConditions) {
            // Return all advanced condition IDs as potentially free
            // The actual cost calculation happens in addConditionToAttack
            return this.getAdvancedConditions().map(c => c.id);
        }
        return [];
    }
}
