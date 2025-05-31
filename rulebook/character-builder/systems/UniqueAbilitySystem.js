// UniqueAbilitySystem.js - Boons and unique abilities management
import { GameConstants } from '../core/GameConstants.js';

export class UniqueAbilitySystem {
    // Get all available boons
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
    
    // Get complex unique abilities (Aura, Barrier, etc.)
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
                id: 'createWall',
                name: 'Create Wall',
                baseCost: 30,
                description: 'Temporary battlefield structure creation',
                category: 'battlefield_control',
                baseProperties: {
                    size: '10 Sp long × 4 Sp high',
                    hp: 50,
                    durability: '10 + tier',
                    uses: 2,
                    activation: 'quick_action'
                },
                upgrades: this.getWallUpgrades()
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
                id: 'backlash',
                name: 'Backlash',
                baseCost: 30,
                description: 'Automatic counterattack system',
                category: 'reactive',
                baseProperties: {
                    trigger: 'hit_by_melee_attack',
                    effect: 'base_attack_against_attacker',
                    uses: 'tier_uses_per_turn'
                },
                upgrades: this.getBacklashUpgrades()
            },
            {
                id: 'boost',
                name: 'Boost',
                baseCost: 60,
                description: 'Temporary power enhancement',
                category: 'enhancement',
                baseProperties: {
                    effect: 'increase_tier_by_half',
                    activation: 'free_action',
                    duration: '3_turns_once_per_fight'
                },
                upgrades: this.getBoostUpgrades()
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
                id: 'invisibility',
                name: 'Invisibility',
                baseCost: 30,
                description: 'Advanced concealment ability',
                category: 'stealth',
                baseProperties: {
                    effect: 'hide_action_in_line_of_sight',
                    immunity: 'sight_based_abilities'
                }
            },
            {
                id: 'regeneration',
                name: 'Regeneration',
                baseCost: 60,
                description: 'Rapid healing ability',
                category: 'healing',
                baseProperties: {
                    healing: 'tier_based_hp_per_turn',
                    unconscious: 'wake_up_at_full_hp',
                    restriction: 'cannot_buy_avoidance_durability_bonuses'
                }
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
            },
            {
                id: 'counter',
                name: 'Counter',
                baseCost: 'variable',
                description: 'Nullify enemy actions',
                category: 'control',
                baseProperties: {
                    range: 30,
                    targeting: 'declare_on_your_turn',
                    roll: 'focus_or_power_vs_resistance',
                    cost: 'consumes_reaction'
                },
                upgrades: this.getCounterUpgrades()
            }
        ];
    }
    
    // Upgrade definitions for complex abilities
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
    
    static getWallUpgrades() {
        return [
            { id: 'increasedSize', name: 'Increased Size', cost: 10, per: 'segment', description: '+10 Sp length OR +4 Sp height' },
            { id: 'shapeable', name: 'Shapeable', cost: 10, per: 'bend', description: 'Add X 90-degree bends' },
            { id: 'damaging', name: 'Damaging', cost: 30, description: 'Touching triggers Direct base attack' },
            { id: 'tough', name: 'Tough', cost: 30, description: '100 HP instead of 50 HP' },
            { id: 'heavilyArmored', name: 'Heavily Armored', cost: 30, per: 'tier', description: '+Tier DR per purchase' },
            { id: 'moveable', name: 'Moveable', cost: 20, description: 'Move wall Tier spaces per turn' },
            { id: 'transparent', name: 'Transparent', cost: 10, description: 'Wall is see-through' },
            { id: 'variableSize', name: 'Variable Size', cost: 20, description: 'Change size each activation' },
            { id: 'rapidSummon', name: 'Rapid Summon', cost: 20, description: 'Add Tier twice to placement roll' }
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
    
    static getBacklashUpgrades() {
        return [
            { id: 'passive', name: 'Passive', cost: 30, description: 'Doesn\'t consume Reaction, unlimited times' },
            { id: 'distantResponse', name: 'Distant Response', cost: 30, description: 'Triggered by any attack type' },
            { id: 'explosiveResponse', name: 'Explosive Response', cost: 30, description: 'Base attack becomes 3sp AOE Burst' }
        ];
    }
    
    static getBoostUpgrades() {
        return [
            { id: 'affectsOthers', name: 'Affects Others', cost: 15, description: 'Can target other creatures instead' }
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
    
    static getCounterUpgrades() {
        return [
            { id: 'stunningCounter', name: 'Stunning Counter', cost: 15, description: 'Success stuns target until end of turn' },
            { id: 'disablingCounter', name: 'Disabling Counter', cost: 15, description: 'Target cannot use attempted action until next turn' },
            { id: 'extraCounter', name: 'Extra Counter', cost: 15, per: 'target', description: 'Target X additional enemies' },
            { id: 'source', name: 'Source', cost: 'negative', description: 'Can only disable specific power types' }
        ];
    }
    
    // Validate boon purchase
    static validateBoonPurchase(character, boonId, upgrades = []) {
        const errors = [];
        const warnings = [];
        
        const boon = this.getAvailableBoons().find(b => b.id === boonId) || 
                    this.getComplexUniqueAbilities().find(b => b.id === boonId);
                    
        if (!boon) {
            errors.push(`Invalid boon: ${boonId}`);
            return { isValid: false, errors, warnings };
        }
        
        // Check if already purchased
        if (character.mainPoolPurchases.boons.some(b => b.boonId === boonId)) {
            errors.push('Boon already purchased');
        }
        
        // Check point cost
        const totalCost = this.calculateBoonTotalCost(boon, upgrades);
        const availablePoints = this.calculateAvailableMainPoolPoints(character);
        
        if (totalCost > availablePoints) {
            errors.push(`Insufficient main pool points (need ${totalCost}, have ${availablePoints})`);
        }
        
        // Check upgrade validity
        if (upgrades.length > 0) {
            const upgradeValidation = this.validateBoonUpgrades(boon, upgrades);
            errors.push(...upgradeValidation.errors);
            warnings.push(...upgradeValidation.warnings);
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
    
    // Calculate total cost including upgrades
    static calculateBoonTotalCost(boon, upgrades = []) {
        let totalCost = boon.baseCost || boon.cost;
        
        if (upgrades.length > 0 && boon.upgrades) {
            upgrades.forEach(upgradeSelection => {
                const upgrade = boon.upgrades.find(u => u.id === upgradeSelection.id);
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
    
    // Validate upgrades for a boon
    static validateBoonUpgrades(boon, upgrades) {
        const errors = [];
        const warnings = [];
        
        if (!boon.upgrades) {
            if (upgrades.length > 0) {
                errors.push('This ability does not support upgrades');
            }
            return { errors, warnings };
        }
        
        upgrades.forEach(upgradeSelection => {
            const upgrade = boon.upgrades.find(u => u.id === upgradeSelection.id);
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
    
    // Check for conflicts with other abilities
    static checkBoonConflicts(character, boonId) {
        const errors = [];
        const warnings = [];
        
        // Shield and Regeneration cannot buy Avoidance/Durability bonuses
        if ((boonId === 'shield' || boonId === 'regeneration')) {
            // This would be checked during attribute/upgrade purchases
            warnings.push('This ability restricts purchasing Avoidance or Durability bonuses');
        }
        
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
    
    // Purchase a boon
    static purchaseBoon(character, boonId, upgrades = [], customizations = {}) {
        const validation = this.validateBoonPurchase(character, boonId, upgrades);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        const boon = this.getAvailableBoons().find(b => b.id === boonId) || 
                    this.getComplexUniqueAbilities().find(b => b.id === boonId);
        
        const totalCost = this.calculateBoonTotalCost(boon, upgrades);
        
        character.mainPoolPurchases.boons.push({
            boonId: boonId,
            name: boon.name,
            cost: totalCost,
            category: boon.category,
            effect: boon.effect,
            upgrades: upgrades,
            customizations: customizations,
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
        const spentOnUpgrades = character.mainPoolPurchases.primaryActionUpgrades.length * GameConstants.PRIMARY_TO_QUICK_COST;
        
        const totalSpent = spentOnBoons + spentOnTraits + spentOnUpgrades;
        
        return totalAvailable - totalSpent;
    }
    
    // Remove boon
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
    
    // Get summary of all purchased boons
    static getBoonSummary(character) {
        return character.mainPoolPurchases.boons.map(boon => ({
            name: boon.name,
            cost: boon.cost,
            category: boon.category,
            upgradeCount: boon.upgrades?.length || 0,
            totalCost: boon.cost
        }));
    }
}