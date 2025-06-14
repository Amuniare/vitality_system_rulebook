// DiceSystem.js - Dice rolling and mechanics
import { GameConstants } from './GameConstants.js';

export class DiceSystem {
    // Roll d20 for accuracy, conditions, skills
    static rollD20() {
        return Math.floor(Math.random() * 20) + 1;
    }
    
    // Roll d6 with exploding 6s for damage
    static rollD6Exploding() {
        let total = 0;
        let roll;
        
        do {
            roll = Math.floor(Math.random() * 6) + 1;
            total += roll;
        } while (roll === GameConstants.EXPLODING_THRESHOLD);
        
        return total;
    }
    
    // Roll 3d6 damage with exploding
    static rollDamage() {
        return this.rollD6Exploding() + 
               this.rollD6Exploding() + 
               this.rollD6Exploding();
    }
    
    // Calculate accuracy roll
    static calculateAccuracy(character, bonuses = {}) {
        const roll = this.rollD20();
        const base = character.tier + character.attributes.focus;
        const total = roll + base + (bonuses.accuracy || 0);
        
        return {
            roll: roll,
            base: base,
            bonuses: bonuses.accuracy || 0,
            total: total,
            isCritical: roll === GameConstants.CRITICAL_NATURAL,
            isNaturalOne: roll === 1
        };
    }
    
    // Calculate damage roll
    static calculateDamage(character, bonuses = {}) {
        const roll = this.rollDamage();
        const base = character.tier + (character.attributes.power * GameConstants.POWER_DAMAGE_MULTIPLIER);
        const total = roll + base + (bonuses.damage || 0);
        
        return {
            roll: roll,
            base: base,
            bonuses: bonuses.damage || 0,
            total: total
        };
    }
    
    // Calculate condition roll
    static calculateCondition(character, bonuses = {}) {
        const roll = this.rollD20();
        const base = character.tier + character.attributes.power;
        const total = roll + base + (bonuses.condition || 0);
        
        return {
            roll: roll,
            base: base,
            bonuses: bonuses.condition || 0,
            total: total,
            isCritical: roll === GameConstants.CRITICAL_NATURAL
        };
    }
    
    // Skill check (3d6 + attribute + tier)
    static skillCheck(character, attribute, bonuses = {}) {
        const roll = this.rollDamage(); // 3d6 with exploding
        const attributeValue = character.attributes[attribute] || 0;
        const base = character.tier + attributeValue;
        const total = roll + base + (bonuses.skill || 0);
        
        return {
            roll: roll,
            base: base,
            attribute: attributeValue,
            tier: character.tier,
            bonuses: bonuses.skill || 0,
            total: total
        };
    }
    
    // Initiative calculation
    static calculateInitiative(character, bonuses = {}) {
        const roll = this.rollD20();
        const base = character.tier + 
                    character.attributes.mobility + 
                    character.attributes.focus + 
                    character.attributes.awareness;
        const total = roll + base + (bonuses.initiative || 0);
        
        return {
            roll: roll,
            base: base,
            bonuses: bonuses.initiative || 0,
            total: total
        };
    }
    
    // Survival check when reaching 0 HP
    static survivalCheck(excessDamage) {
        const roll = this.rollD20();
        const dc = excessDamage;
        
        return {
            roll: roll,
            dc: dc,
            success: roll >= dc,
            criticalFailure: roll === 1 || (roll + 20 < dc) // Fail by 20+ = death
        };
    }
}