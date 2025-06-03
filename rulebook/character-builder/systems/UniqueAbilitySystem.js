// UniqueAbilitySystem.js - REFACTORED to remove duplicate point calculations  
import { PointPoolCalculator } from '../calculators/PointPoolCalculator.js'; // USE UNIFIED CALCULATOR
import { GameConstants } from '../core/GameConstants.js';

export class UniqueAbilitySystem {
    // Get complex unique abilities (multi-stage purchases with upgrades)
    static getComplexUniqueAbilities() {
        return [
            {
                id: 'aura',
                name: 'Aura',
                baseCost: 30,
                description: 'Passive field around you affecting enemies or allies',
                category: 'area_effect',
                baseProperties: {
                    radius: 1,
                    activation: 'quick_action',
                    maintenance: 'quick_action_per_turn'
                },
                upgrades: this.getAuraUpgrades()
            },
            {
                id: 'barrier',
                name: 'Barrier',
                baseCost: 30,
                description: 'Temporary protective field summoning',
                category: 'defensive',
                baseProperties: {
                    radius: 1,
                    hp: 50,
                    avoidance: 0,
                    durability: '10 + tier',
                    uses: 2,
                    activation: 'quick_action'
                },
                upgrades: this.getBarrierUpgrades()
            },
            {
                id: 'shield',
                name: 'Shield',
                baseCost: 30,
                description: 'Personal protective energy field',
                category: 'defensive',
                baseProperties: {
                    shieldHp: 'tier × 3',
                    recovery: 'tier × 3 per turn',
                    restriction: 'cannot_buy_avoidance_durability_bonuses'
                },
                upgrades: this.getShieldUpgrades()
            },
            {
                id: 'summon',
                name: 'Summon',
                baseCost: 10,
                description: 'Create allied creatures',
                category: 'summoning',
                baseProperties: {
                    tier: 'character_tier',
                    hp: 10,
                    type: 'minion',
                    stats: 'standard',
                    initiative: 'your_initiative'
                },
                upgrades: this.getSummonUpgrades()
            },
            {
                id: 'heal',
                name: 'Heal',
                baseCost: 30,
                description: 'Restore others\' health',
                category: 'healing',
                baseProperties: {
                    healing: '5 × tier HP',
                    uses: 5,
                    range: 'touch',
                    action: 'action'
                },
                upgrades: this.getHealUpgrades()
            }
        ];
    }
    
    // Upgrade definitions (keeping existing implementations)
    static getAuraUpgrades() {
        return [
            { id: 'increasedRadius', name: 'Increased Radius', cost: 5, per: 'space', description: '+X radius' },
            { id: 'rangedOrigin', name: 'Ranged Origin', cost: 10, description: 'Originate from visible point' },
            { id: 'variableSize', name: 'Variable Size', cost: 10, description: 'Change size each activation' },
            { id: 'additionalEffect', name: 'Additional Effect', cost: 30, description: 'Second aura type active' },
            { id: 'conditionEffect', name: 'Condition Effect', cost: 0, description: 'Basic Condition instead of damage' },
            { id: 'directEffect', name: 'Direct Effect', cost: 30, description: 'Auto-hits without Accuracy roll' },
            { id: 'precise', name: 'Precise', cost: 15, description: 'Only attacks chosen targets' },
            { id: 'clairvoyance', name: 'Clairvoyance', cost: 15, description: 'See through your own aura' },
            { id: 'passiveBuff', name: 'Passive Buff', cost: 30, per: 'action', description: 'Always under effect of X Fighting Actions' }
        ];
    }
    
    static getBarrierUpgrades() {
        return [
            { id: 'increasedRadius', name: 'Increased Radius', cost: 5, per: 'space', description: '+X radius' },
            { id: 'permeable', name: 'Permeable', cost: 15, description: 'You/allies move through once per turn' },
            { id: 'slow', name: 'Slow', cost: 15, description: 'Non-you characters move half speed' },
            { id: 'shellOnly', name: 'Shell Only', cost: 0, description: 'Ranged attacks blocked only at edge' },
            { id: 'damaging', name: 'Damaging', cost: 30, description: 'Tier damage for entering/staying inside' },
            { id: 'firingPosition', name: 'Firing Position', cost: 30, description: 'Inside can target outside, not vice versa' },
            { id: 'tough', name: 'Tough', cost: 30, description: '100 HP instead of 50 HP' },
            { id: 'heavilyArmored', name: 'Heavily Armored', cost: 30, per: 'tier', description: '+Tier DR per purchase' },
            { id: 'moveable', name: 'Moveable', cost: 20, description: 'Move barrier Tier spaces per turn' },
            { id: 'transparent', name: 'Transparent', cost: 10, description: 'Barrier is see-through' },
            { id: 'variableSize', name: 'Variable Size', cost: 10, description: 'Change size each activation' }
        ];
    }
    
    static getShieldUpgrades() {
        return [
            { id: 'increasedShielding', name: 'Increased Shielding', cost: 15, per: 'tier', description: '+Tier×3 max shield HP' },
            { id: 'quickRecovery', name: 'Quick Recovery', cost: 15, per: 'tier', description: 'Recover additional Tier×3 HP per turn' },
            { id: 'heavyShield', name: 'Heavy Shield', cost: -15, description: 'Only recover Tier HP per turn' },
            { id: 'areaShield', name: 'Area Shield', cost: 30, description: 'Ranged/AOE vs adjacent hit your shield instead' }
        ];
    }
    
    static getSummonUpgrades() {
        return [
            { id: 'mobile', name: 'Mobile', cost: 5, description: 'Gets Movement archetype' },
            { id: 'extraPoints', name: 'Extra Points', cost: 'variable', description: 'Summon gains X points for abilities' },
            { id: 'minionHorde', name: 'Minion Horde', cost: 5, per: 'minion', description: 'Gain X additional 10 HP minions' },
            { id: 'alternateSummons', name: 'Alternate Summons', cost: 5, per: 'variant', description: 'Different stats when resummoned' },
            { id: 'resummon', name: 'Resummon', cost: 15, per: 'use', description: 'Can resummon X times after defeat' },
            { id: 'helpfulCompanion', name: 'Helpful Companion', cost: 15, description: 'Gets utility section' },
            { id: 'source', name: 'Source', cost: 15, per: 'condition', description: 'Require conditions, add Tier to chosen stat' },
            { id: 'captain', name: 'Captain', cost: 10, description: '25 HP instead of 10 HP', requires: 'base' },
            { id: 'elite', name: 'Elite', cost: 10, description: '50 HP instead of 25 HP', requires: 'captain' },
            { id: 'boss', name: 'Boss', cost: 10, description: '100 HP instead of 50 HP', requires: 'elite' },
            { id: 'heroic', name: 'Heroic', cost: 15, description: 'Gets Special Attacks archetype' },
            { id: 'unique', name: 'Unique', cost: 15, description: 'Gets Unique Abilities archetype' },
            { id: 'massSummoner', name: 'Mass Summoner', cost: 30, description: 'Summon all as single action' },
            { id: 'gameHunter', name: 'Game Hunter', cost: 40, description: 'Summon defeated enemies under conditions' }
        ];
    }
    
    static getHealUpgrades() {
        return [
            { id: 'increasedCharges', name: 'Increased Charges', cost: 15, per: 'double', description: 'Double charges per purchase' },
            { id: 'increasedHealing', name: 'Increased Healing', cost: 15, per: 'double', description: 'Double HP healed per purchase' },
            { id: 'greaterHealing', name: 'Greater Healing', cost: 10, description: 'Use additional charge on same target' },
            { id: 'restorativeOnly', name: 'Restorative Only', cost: 0, description: 'Removes Conditions instead of damage' },
            { id: 'restorative', name: 'Restorative', cost: 15, description: 'Also removes all Conditions' },
            { id: 'healsObjectsOnly', name: 'Heals Objects Only', cost: 0, description: 'Works on objects instead of living' },
            { id: 'healsObjects', name: 'Heals Objects', cost: 5, description: 'Works on both objects and living' },
            { id: 'ranged', name: 'Ranged', cost: 15, description: 'Target within 15 spaces' },
            { id: 'massHealing', name: 'Mass Healing', cost: 15, description: 'Additional target per action' },
            { id: 'quickHealing', name: 'Quick Healing', cost: 30, description: 'Heal as Quick Action' }
        ];
    }

    // Validate unique ability purchase
    static validateUniqueAbilityPurchase(character, abilityId, upgrades = []) {
        const errors = [];
        const warnings = [];
        
        const ability = this.getComplexUniqueAbilities().find(a => a.id === abilityId);
        if (!ability) {
            errors.push(`Invalid unique ability: ${abilityId}`);
            return { isValid: false, errors, warnings };
        }
        
        // Check if already purchased
        if (character.mainPoolPurchases.boons.some(b => b.boonId === abilityId && b.type === 'unique')) {
            errors.push('Unique ability already purchased');
        }
        
        // REMOVED DUPLICATE: Use unified point pool calculator
        const pools = PointPoolCalculator.calculateAllPools(character);
        const availablePoints = pools.remaining.mainPool;
        
        const totalCost = this.calculateUniqueAbilityTotalCost(ability, upgrades);
        
        if (totalCost > availablePoints) {
            errors.push(`Insufficient main pool points (need ${totalCost}, have ${availablePoints})`);
        }
        
        // Check upgrade validity
        if (upgrades.length > 0) {
            const upgradeValidation = this.validateUniqueAbilityUpgrades(ability, upgrades);
            errors.push(...upgradeValidation.errors);
            warnings.push(...upgradeValidation.warnings);
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Calculate total cost including upgrades
    static calculateUniqueAbilityTotalCost(ability, upgrades = []) {
        let totalCost = ability.baseCost;
        
        if (upgrades.length > 0 && ability.upgrades) {
            upgrades.forEach(upgradeSelection => {
                const upgrade = ability.upgrades.find(u => u.id === upgradeSelection.id);
                if (upgrade) {
                    if (upgrade.per) {
                        totalCost += upgrade.cost * (upgradeSelection.quantity || 1);
                    } else {
                        totalCost += upgrade.cost;
                    }
                }
            });
        }
        
        return totalCost;
    }

    // Validate upgrades for unique ability
    static validateUniqueAbilityUpgrades(ability, upgrades) {
        const errors = [];
        const warnings = [];
        
        if (!ability.upgrades) {
            if (upgrades.length > 0) {
                errors.push('This ability does not support upgrades');
            }
            return { errors, warnings };
        }
        
        upgrades.forEach(upgradeSelection => {
            const upgrade = ability.upgrades.find(u => u.id === upgradeSelection.id);
            if (!upgrade) {
                errors.push(`Invalid upgrade: ${upgradeSelection.id}`);
                return;
            }
            
            // Check requirements
            if (upgrade.requires && !upgrades.some(u => u.id === upgrade.requires)) {
                errors.push(`${upgrade.name} requires ${upgrade.requires}`);
            }
            
            // Check quantity for per-purchase upgrades
            if (upgrade.per && (!upgradeSelection.quantity || upgradeSelection.quantity < 1)) {
                errors.push(`${upgrade.name} requires quantity specification`);
            }
        });
        
        return { errors, warnings };
    }

    // Purchase unique ability
    static purchaseUniqueAbility(character, abilityId, upgrades = []) {
        const validation = this.validateUniqueAbilityPurchase(character, abilityId, upgrades);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const ability = this.getComplexUniqueAbilities().find(a => a.id === abilityId);
        const totalCost = this.calculateUniqueAbilityTotalCost(ability, upgrades);
        
        character.mainPoolPurchases.boons.push({
            boonId: abilityId,
            name: ability.name,
            cost: totalCost,
            category: ability.category,
            type: 'unique',
            baseCost: ability.baseCost,
            upgrades: upgrades,
            purchased: new Date().toISOString()
        });
        
        return character;
    }

    // REMOVED DUPLICATE METHOD: calculateAvailableMainPoolPoints()
    // Now use: PointPoolCalculator.calculateAllPools(character).remaining.mainPool

    // Remove unique ability
    static removeUniqueAbility(character, abilityId) {
        const index = character.mainPoolPurchases.boons.findIndex(b => b.boonId === abilityId && b.type === 'unique');
        if (index === -1) {
            throw new Error('Unique ability not found');
        }
        
        character.mainPoolPurchases.boons.splice(index, 1);
        return character;
    }
}