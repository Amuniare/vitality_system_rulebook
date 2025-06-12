// AttackTypeSystem.js - Attack and Effect Type management
import { GameConstants } from '../core/GameConstants.js';
import { gameDataManager } from '../core/GameDataManager.js'; // ADDED
import { ArchetypeSystem } from './ArchetypeSystem.js'; // For getFreeAttackTypesFromArchetype

export class AttackTypeSystem {
    static getAttackTypeDefinition(typeId) {
        const definitions = gameDataManager.getAttackTypeDefinitions() || {};
        const def = definitions[typeId];
        if (!def) return null;
        // Resolve keys from GameConstants
        return {
            ...def,
            range: def.rangeKey ? GameConstants[def.rangeKey] : def.range,
            cost: def.costKey ? GameConstants.ATTACK_TYPE_COSTS[def.costKey] : def.cost,
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
    static getAttackTypeDefinitions() { // Now returns resolved definitions
        const definitions = gameDataManager.getAttackTypeDefinitions() || {};
        const resolved = {};
        for (const key in definitions) {
            resolved[key] = this.getAttackTypeDefinition(key);
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
        
        const attackType = this.getAttackTypeDefinition(attackTypeId); // MODIFIED
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
    
    // Get all attack type definitions (for dropdowns)
    static getAttackTypeDefinitions() {
        const definitions = gameDataManager.getAttackTypeDefinitions() || {};
        const resolved = {};
        for (const [key, def] of Object.entries(definitions)) {
            resolved[key] = {
                ...def,
                id: key,
                range: def.rangeKey ? GameConstants[def.rangeKey] : def.range,
                cost: def.costKey ? GameConstants.ATTACK_TYPE_COSTS[def.costKey] : def.cost
            };
        }
        return resolved;
    }
    
    // Get all effect type definitions (for dropdowns)
    static getEffectTypeDefinitions() {
        const definitions = gameDataManager.getEffectTypeDefinitions() || {};
        const resolved = {};
        for (const [key, def] of Object.entries(definitions)) {
            resolved[key] = {
                ...def,
                id: key,
                cost: def.costKey ? GameConstants.ATTACK_TYPE_COSTS[def.costKey] : def.cost
            };
        }
        return resolved;
    }
    
    // Get basic conditions (for dropdowns)
    static getBasicConditions() {
        const conditions = gameDataManager.getBasicConditions() || [];
        return conditions.map(c => ({
            ...c,
            duration: c.durationKey ? GameConstants[c.durationKey] : c.duration
        }));
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
            const attackTypeDef = this.getAttackTypeDefinition(attackTypeId); // MODIFIED
            if (attackTypeDef) { // Check if def exists
                 attack.upgradePointsSpent -= attackTypeDef.cost;
            }
        }
        
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
            this.getAdvancedConditionDefinition(conditionId) : // MODIFIED
            this.getBasicConditionDefinition(conditionId);      // MODIFIED
            
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
                const attackTypeDef = this.getAttackTypeDefinition(typeId); // MODIFIED
                if (attackTypeDef) totalCost += attackTypeDef.cost;
            }
        });
        
        attack.effectTypes.forEach(typeId => {
            const effectTypeDef = this.getEffectTypeDefinition(typeId); // MODIFIED
            if (effectTypeDef) totalCost += effectTypeDef.cost;
        });
        
        return totalCost;
    }
    
    // Get attack summary with all types and modifiers
    static getAttackSummary(character, attack) {
        const attackTypes = attack.attackTypes.map(id => {
            const def = this.getAttackTypeDefinition(id); // MODIFIED
            return def ? {
                id,
                name: def.name,
                range: def.range,
                penalties: def.penalty || null
            } : {id, name: id, range: 'N/A', penalties: null}; // Fallback
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
}