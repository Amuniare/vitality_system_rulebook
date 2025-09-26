"""
Consolidated game rules and mechanics for the Vitality System.

This module contains all authoritative rule definitions, mechanics, and validation logic
for the Vitality System TTRPG combat simulation.
"""

from typing import List, Tuple, Dict, Any
from dataclasses import dataclass


@dataclass
class GameMechanics:
    """Core game mechanics constants"""
    # Base stats and calculations
    BASE_AVOIDANCE = 5
    BASE_DICE_COUNT = 3
    BASE_DICE_SIDES = 6
    EXPLODING_DICE_THRESHOLD = 6
    CRITICAL_EXPLODING_THRESHOLD = 5  # With Critical Effect

    # Direct damage formulas
    DIRECT_DAMAGE_BASE = 13  # 13 - Tier for direct damage
    DIRECT_AREA_DAMAGE_BASE = 13  # 13 - 2×Tier for direct area damage

    # Critical hit mechanics
    NATURAL_CRITICAL = 20
    ENHANCED_CRITICAL_RANGE = 15  # 15-20 with Critical Accuracy

    # Bleed mechanics
    BLEED_DURATION = 2  # turns

    # Brutal damage threshold
    BRUTAL_THRESHOLD = 10  # Damage must exceed DR by 10+
    BRUTAL_MULTIPLIER = 0.5  # 50% of excess damage


@dataclass
class AttackTypeRules:
    """Attack type definitions and mechanics"""

    MELEE_ACCURACY_BONUS = True  # melee_ac gets +Tier accuracy
    MELEE_DAMAGE_BONUS = True    # melee_dg gets +Tier damage
    RANGED_ADJACENT_PENALTY = True  # ranged gets -Tier if adjacent
    AREA_ACCURACY_PENALTY = 1    # area attacks get -Tier accuracy

    # Attack type compatibility
    TRIPLE_ATTACK_COMPATIBLE = ['melee_ac', 'melee_dg', 'ranged', 'direct_damage']
    AOE_TYPES = ['area', 'direct_area_damage']
    DIRECT_TYPES = ['direct_damage', 'direct_area_damage']


@dataclass
class UpgradeRules:
    """Upgrade definitions and mechanics"""

    # Core Combat Upgrades
    POWER_ATTACK = {'cost': 10, 'damage_mod': 1, 'accuracy_penalty': 1}
    HIGH_IMPACT = {'cost': 20, 'flat_damage': 15}
    CRITICAL_EFFECT = {'cost': 20, 'damage_penalty': 2, 'explode_threshold': 5}
    ARMOR_PIERCING = {'cost': 20, 'ignore_endurance': True}
    BRUTAL = {'cost': 40, 'brutal_threshold': 10, 'brutal_multiplier': 0.5}
    ACCURATE_ATTACK = {'cost': 10, 'accuracy_mod': 1, 'damage_penalty': 1}

    # Multi-Attack Upgrades
    QUICK_STRIKES = {'cost': 60, 'attacks': 3, 'damage_penalty': 1, 'accuracy_penalty': 1}
    EXTRA_ATTACK = {'cost': 70, 'trigger': 'hit_and_effect'}
    DOUBLE_TAP = {'cost': 30, 'trigger': 'critical_hit'}

    # Condition & Effect Upgrades
    BLEED = {'cost': 80, 'duration': 2, 'damage_penalty': 1}
    CRITICAL_ACCURACY = {'cost': 30, 'crit_range': [15, 16, 17, 18, 19, 20]}
    POWERFUL_CRITICAL = {'cost': 20, 'requires': ['critical_accuracy'], 'bonus_on_crit': True}
    RELIABLE_ACCURACY = {'cost': 20, 'advantage': True, 'accuracy_penalty': 3}
    OVERHIT = {'cost': 30, 'bonus_per_2_over_5': 1}

    # Finishing Blow Upgrades
    FINISHING_BLOW_1 = {'cost': 20, 'threshold': 5}
    FINISHING_BLOW_2 = {'cost': 30, 'threshold': 10}
    FINISHING_BLOW_3 = {'cost': 40, 'threshold': 15}

    # Slayer Upgrades (all cost 20p, +Tier bonus vs specific HP thresholds)
    MINION_SLAYER_ACC = {'cost': 20, 'hp_threshold': 10, 'bonus_type': 'accuracy'}
    MINION_SLAYER_DMG = {'cost': 20, 'hp_threshold': 10, 'bonus_type': 'damage'}
    CAPTAIN_SLAYER_ACC = {'cost': 20, 'hp_threshold': 25, 'bonus_type': 'accuracy'}
    CAPTAIN_SLAYER_DMG = {'cost': 20, 'hp_threshold': 25, 'bonus_type': 'damage'}
    ELITE_SLAYER_ACC = {'cost': 20, 'hp_threshold': 50, 'bonus_type': 'accuracy'}
    ELITE_SLAYER_DMG = {'cost': 20, 'hp_threshold': 50, 'bonus_type': 'damage'}
    BOSS_SLAYER_ACC = {'cost': 20, 'hp_threshold': 100, 'bonus_type': 'accuracy'}
    BOSS_SLAYER_DMG = {'cost': 20, 'hp_threshold': 100, 'bonus_type': 'damage'}


@dataclass
class LimitRules:
    """Limit (unreliable) upgrade definitions and mechanics"""

    # Unreliable Limits (DC-based activation)
    UNRELIABLE_1 = {'cost': 30, 'tier_multiplier': 1, 'dc': 5}
    UNRELIABLE_2 = {'cost': 20, 'tier_multiplier': 2, 'dc': 10}
    UNRELIABLE_3 = {'cost': 20, 'tier_multiplier': 3, 'dc': 15, 'affects': ['accuracy', 'damage']}

    # Turn-Based Limits
    QUICKDRAW = {'cost': 10, 'tier_multiplier': 1, 'turns': [1, 2]}
    STEADY = {'cost': 40, 'tier_multiplier': 1, 'min_turn': 4}
    PATIENT = {'cost': 20, 'tier_multiplier': 1, 'min_turn': 5}
    FINALE = {'cost': 10, 'tier_multiplier': 1, 'min_turn': 8}

    # Charge Limits
    CHARGE_UP = {'cost': 10, 'tier_multiplier': 1, 'charge_turns': 1}
    CHARGE_UP_2 = {'cost': 10, 'tier_multiplier': 2, 'charge_turns': 2, 'affects': ['accuracy', 'damage']}


class RuleValidation:
    """Rule validation and compatibility checking"""

    PREREQUISITES = {
        'powerful_critical': ['critical_accuracy'],
    }

    MUTUAL_EXCLUSIONS = [
        ['double_tap', 'ricochet', 'explosive_critical'],
        ['unreliable_1', 'unreliable_2', 'unreliable_3'],
        ['quickdraw', 'steady', 'patient', 'finale'],
        ['charge_up', 'charge_up_2'],
        # Slayer upgrades - can only pick one type per slayer level
        ['minion_slayer_acc', 'minion_slayer_dmg'],
        ['captain_slayer_acc', 'captain_slayer_dmg'],
        ['elite_slayer_acc', 'elite_slayer_dmg'],
        ['boss_slayer_acc', 'boss_slayer_dmg'],
    ]

    ATTACK_TYPE_RESTRICTIONS = {
        'quick_strikes': ['melee_ac', 'melee_dg', 'ranged', 'direct_damage'],
    }

    AOE_RESTRICTIONS = [
        'finishing_blow_1', 'finishing_blow_2', 'finishing_blow_3',
        'culling_strike', 'leech', 'critical_accuracy', 'critical_condition'
    ]

    @staticmethod
    def check_prerequisites(upgrades: List[str]) -> Tuple[bool, List[str]]:
        """Check if all prerequisites are met for the given upgrades"""
        errors = []
        upgrade_set = set(upgrades)

        for upgrade in upgrades:
            if upgrade in RuleValidation.PREREQUISITES:
                required = RuleValidation.PREREQUISITES[upgrade]
                missing = [req for req in required if req not in upgrade_set]
                if missing:
                    errors.append(f"{upgrade} requires {', '.join(missing)}")

        return len(errors) == 0, errors

    @staticmethod
    def check_mutual_exclusions(upgrades: List[str]) -> Tuple[bool, List[str]]:
        """Check if any mutually exclusive upgrades are combined"""
        errors = []
        upgrade_set = set(upgrades)

        for exclusion_group in RuleValidation.MUTUAL_EXCLUSIONS:
            present = [upgrade for upgrade in exclusion_group if upgrade in upgrade_set]
            if len(present) > 1:
                errors.append(f"Mutually exclusive upgrades: {', '.join(present)}")

        return len(errors) == 0, errors

    @staticmethod
    def check_attack_type_restrictions(attack_type: str, upgrades: List[str]) -> Tuple[bool, List[str]]:
        """Check if upgrades are compatible with the attack type"""
        errors = []

        for upgrade in upgrades:
            if upgrade in RuleValidation.ATTACK_TYPE_RESTRICTIONS:
                allowed_types = RuleValidation.ATTACK_TYPE_RESTRICTIONS[upgrade]
                if attack_type not in allowed_types:
                    errors.append(f"{upgrade} can only be used with {', '.join(allowed_types)} attacks")

        return len(errors) == 0, errors

    @staticmethod
    def check_aoe_restrictions(attack_type: str, upgrades: List[str]) -> Tuple[bool, List[str]]:
        """Check if AOE-restricted upgrades are used with non-AOE attacks"""
        errors = []
        is_aoe = attack_type in AttackTypeRules.AOE_TYPES

        if is_aoe:
            forbidden = [upgrade for upgrade in upgrades if upgrade in RuleValidation.AOE_RESTRICTIONS]
            if forbidden:
                errors.append(f"These upgrades cannot apply to AOE attacks: {', '.join(forbidden)}")

        return len(errors) == 0, errors

    @staticmethod
    def validate_combination(attack_type: str, upgrades: List[str]) -> Tuple[bool, List[str]]:
        """Validate entire upgrade combination against all rules"""
        all_errors = []

        valid, errors = RuleValidation.check_prerequisites(upgrades)
        all_errors.extend(errors)

        valid, errors = RuleValidation.check_mutual_exclusions(upgrades)
        all_errors.extend(errors)

        valid, errors = RuleValidation.check_attack_type_restrictions(attack_type, upgrades)
        all_errors.extend(errors)

        valid, errors = RuleValidation.check_aoe_restrictions(attack_type, upgrades)
        all_errors.extend(errors)

        return len(all_errors) == 0, all_errors


class CombatScenarios:
    """Multi-enemy combat scenario definitions"""

    SCENARIOS = [
        ("1×100 HP Boss", 1, 100),      # Traditional single-target
        ("2×50 HP Enemies", 2, 50),     # Medium group tactical
        ("4×25 HP Enemies", 4, 25),     # Large group tactical
        ("10×10 HP Enemies", 10, 10)    # Swarm scenario
    ]

    @staticmethod
    def get_total_hp(scenario_index: int) -> int:
        """Get total HP for a scenario"""
        _, count, hp_per = CombatScenarios.SCENARIOS[scenario_index]
        return count * hp_per

    @staticmethod
    def get_scenario_name(scenario_index: int) -> str:
        """Get descriptive name for a scenario"""
        return CombatScenarios.SCENARIOS[scenario_index][0]


class CharacterStats:
    """Character stat calculations and formulas"""

    @staticmethod
    def calculate_avoidance(tier: int, mobility: int) -> int:
        """Calculate avoidance: 5 + tier + mobility"""
        return GameMechanics.BASE_AVOIDANCE + tier + mobility

    @staticmethod
    def calculate_durability(tier: int, endurance: int) -> int:
        """Calculate durability: tier + endurance"""
        return tier + endurance

    @staticmethod
    def calculate_direct_damage(tier: int, is_area: bool = False) -> int:
        """Calculate direct damage: 13-Tier or 13-2×Tier for area"""
        if is_area:
            return GameMechanics.DIRECT_AREA_DAMAGE_BASE - (2 * tier)
        else:
            return GameMechanics.DIRECT_DAMAGE_BASE - tier


# Export consolidated rules for easy access
GAME_MECHANICS = GameMechanics()
ATTACK_TYPE_RULES = AttackTypeRules()
UPGRADE_RULES = UpgradeRules()
LIMIT_RULES = LimitRules()
RULE_VALIDATION = RuleValidation()
COMBAT_SCENARIOS = CombatScenarios()
CHARACTER_STATS = CharacterStats()