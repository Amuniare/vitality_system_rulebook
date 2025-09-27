
// GameConstants.js - All game constants and formulas
export const GameConstants = {
    // Tier System (for combat, attributes, special attacks)
    TIER_MIN: 2,
    TIER_MAX: 5,
    STARTING_TIER: 2,

    // Level System (for main pool calculations only)
    LEVEL_MIN: 0,
    LEVEL_MAX: 5,
    STARTING_LEVEL: 1,

    // Level-to-Tier Bonus Mapping
    LEVEL_BONUS_LOOKUP: {
        0: 2,  // Level 0: +2 Tier Bonus, 0 Boons
        1: 3,  // Level 1: +3 Tier Bonus, 1 Boon
        2: 3,  // Level 2: +3 Tier Bonus, 2 Boons
        3: 4,  // Level 3: +4 Tier Bonus, 3 Boons
        4: 4,  // Level 4: +4 Tier Bonus, 4 Boons
        5: 5   // Level 5: +5 Tier Bonus, 5 Boons
    },
    
    // Point Pool Formulas
    COMBAT_ATTRIBUTES_MULTIPLIER: 2,
    UTILITY_ATTRIBUTES_MULTIPLIER: 1,
    MAIN_POOL_BASE_TIER: 2,
    MAIN_POOL_MULTIPLIER: 15,
    UTILITY_POOL_PRACTICAL_BASE: 1,
    UTILITY_POOL_SPECIALIZED_BASE: 2,
    UTILITY_POOL_MULTIPLIER: 5,
    
    // Base Health and Movement
    BASE_HP: 100,
    BASE_MOVEMENT_BONUS: 6,
    
    // Defense Formulas
    AVOIDANCE_BASE: 5,
    RESOLVE_BASE: 10,
    STABILITY_BASE: 10,
    VITALITY_BASE: 10,
    ENDURANCE_DURABILITY_MULTIPLIER: 1.5,
    POWER_DAMAGE_MULTIPLIER: 1.5,
    
    // Attack Ranges
    MELEE_RANGE: 1,
    RANGED_RANGE: 15,
    DIRECT_RANGE: 30,
    
    // Area Attack Sizes
    AOE_RADIUS: 2,
    AOE_CONE: 4,
    AOE_LINE: 8,
    
    // Dice
    ACCURACY_DICE: 'd20',
    DAMAGE_DICE: '3d6',
    SKILL_DICE: '3d6',
    EXPLODING_THRESHOLD: 6,
    CRITICAL_NATURAL: 20,
    
    // Limit Point Scaling
    LIMIT_FIRST_TIER_MULTIPLIER: 10,
    LIMIT_SECOND_TIER_MULTIPLIER: 20,
    LIMIT_FIRST_VALUE: 1.0,
    LIMIT_SECOND_VALUE: 0.5,
    LIMIT_THIRD_VALUE: 0.25,
    
    // Special Attack Archetype Multipliers
    ARCHETYPE_MULTIPLIERS: {
        normal: 1/6,
        specialist: 1/3,
        straightforward: 1/2,
        paragon: 10,
        oneTrick: 20,
        dualNatured: 15,
        basic: 10
    },
    
    // Attack Type Costs
    ATTACK_TYPE_COSTS: {
        melee: 20,
        ranged: 20,
        direct: 30,
        area: 30,
        hybrid: 30,
        direct_area: 60
    },
    
    // Condition Costs
    BASIC_CONDITIONS: [
        'disarm', 'grab', 'shove', 'prone', 
        'blind', 'daze', 'misdirect', 'setup', 'taunt'
    ],
    
    ADVANCED_CONDITION_COSTS: {
        control: 30,
        capture: 20,
        stun: 20,
        weaken: 20,
        disableSpecials: 10,
        mimic: 20,
        frighten: 10,
        enthrall: 10,
        frenzy: 10
    },
    
    // Ability Costs
    TRAIT_COST: 30,
    FLAW_BONUS: 30,
    
    // Utility Costs
    EXPERTISE_ACTIVITY_BASIC: 2,
    EXPERTISE_ACTIVITY_MASTERED: 4,
    EXPERTISE_SITUATIONAL_BASIC: 1,
    EXPERTISE_SITUATIONAL_MASTERED: 2,
    
    // Banned Combinations
    BANNED_UPGRADE_COMBINATIONS: [
        ['brutal', 'headshot'],
        ['brutal', 'heavyStrike'],
        ['superiorEffect', 'reliableEffect'],
        ['criticalEffect', 'consistentEffect']
    ],
    
    // Status Effect Durations
    BASIC_CONDITION_DURATION: 'end_of_your_next_turn',
    ADVANCED_CONDITION_DURATION: 'start_of_your_next_turn',
    
    // Recovery Rates
    RECOVERY_RATES: {
        gritty: { hp: 50, period: 'day' },
        grounded: { hp: 20, period: 'hour' },
        heroic: { hp: 5, period: 'minute' }
    }
};
