"""
Game data constants and rule definitions for the Vitality System.
"""

from src.models import AttackType, Upgrade, Limit
from typing import List, Tuple


# Attack Types
ATTACK_TYPES = {
    'melee_ac': AttackType('melee_ac', 0),  # Melee with +Tier accuracy bonus
    'melee_dg': AttackType('melee_dg', 0),  # Melee with +Tier damage bonus
    'ranged': AttackType('ranged', 0),
    'area': AttackType('area', 0, accuracy_mod=-1, damage_mod=-1, is_area=True),
    'direct_damage': AttackType('direct_damage', 0, is_direct=True, direct_damage_base=15),
    'direct_area_damage': AttackType('direct_area_damage', 0, is_direct=True, direct_damage_base=15, is_area=True)
}

# Upgrades - Costs updated 2025-10-05
UPGRADES = {
    'power_attack': Upgrade('power_attack', 1, damage_mod=1, accuracy_penalty=1),
    'high_impact': Upgrade('high_impact', 2, special_effect="flat_15"),
    'critical_effect': Upgrade('critical_effect', 1, damage_penalty=2, special_effect="explode_5_6"),
    'armor_piercing': Upgrade('armor_piercing', 3, special_effect="ignore_endurance"),
    'brutal': Upgrade('brutal', 2, special_effect="brutal_10"),
    'quick_strikes': Upgrade('quick_strikes', 2, special_effect="quick_strikes_2", damage_penalty=1, accuracy_penalty=1),
    'bleed': Upgrade('bleed', 3, special_effect="bleed_2_turns"),
    'critical_accuracy': Upgrade('critical_accuracy', 1, special_effect="crit_15_20"),
    'powerful_critical': Upgrade('powerful_critical', 2, special_effect="powerful_crit"),
    'double_tap': Upgrade('double_tap', 3, special_effect="double_tap"),
    'finishing_blow_1': Upgrade('finishing_blow_1', 1, special_effect="finishing_5"),
    'finishing_blow_2': Upgrade('finishing_blow_2', 2, special_effect="finishing_10"),
    'finishing_blow_3': Upgrade('finishing_blow_3', 4, special_effect="finishing_15"),
    'extra_attack': Upgrade('extra_attack', 3, special_effect="extra_attack"),
    'barrage': Upgrade('barrage', 2, special_effect="barrage_chain", damage_penalty=1, accuracy_penalty=1),
    'minion_slayer_acc': Upgrade('minion_slayer_acc', 1, special_effect="slayer_minion_acc"),
    'minion_slayer_dmg': Upgrade('minion_slayer_dmg', 1, special_effect="slayer_minion_dmg"),
    'captain_slayer_acc': Upgrade('captain_slayer_acc', 1, special_effect="slayer_captain_acc"),
    'captain_slayer_dmg': Upgrade('captain_slayer_dmg', 1, special_effect="slayer_captain_dmg"),
    'elite_slayer_acc': Upgrade('elite_slayer_acc', 1, special_effect="slayer_elite_acc"),
    'elite_slayer_dmg': Upgrade('elite_slayer_dmg', 1, special_effect="slayer_elite_dmg"),
    'boss_slayer_acc': Upgrade('boss_slayer_acc', 1, special_effect="slayer_boss_acc"),
    'boss_slayer_dmg': Upgrade('boss_slayer_dmg', 1, special_effect="slayer_boss_dmg"),
    'accurate_attack': Upgrade('accurate_attack', 1, accuracy_mod=1, damage_penalty=1),
    'reliable_accuracy': Upgrade('reliable_accuracy', 1, accuracy_penalty=3, special_effect="advantage"),
    'overhit': Upgrade('overhit', 2, special_effect="overhit"),
    'explosive_critical': Upgrade('explosive_critical', 3, special_effect="explosive_critical"),
    'culling_strike': Upgrade('culling_strike', 1, special_effect="culling_strike"),
    'splinter': Upgrade('splinter', 4, special_effect="splinter"),
    'ricochet': Upgrade('ricochet', 1, special_effect="ricochet"),
    'channeled': Upgrade('channeled', 2, special_effect="channeled"),
    'leech': Upgrade('leech', 3, accuracy_penalty=1, damage_penalty=1, special_effect="leech"),
}

# Limits - Costs updated 2025-10-05
LIMITS = {
    # Reliability/Turn Timing Limits
    'unreliable_1': Limit('unreliable_1', 2, 1, 5),
    'unreliable_2': Limit('unreliable_2', 3, 3, 10),
    'unreliable_3': Limit('unreliable_3', 2, 6, 15),
    'quickdraw': Limit('quickdraw', 2, 3, 0),
    'patient': Limit('patient', 4, 1, 0),
    'finale': Limit('finale', 4, 2, 0),
    'charge_up': Limit('charge_up', 4, 3, 0),
    'charge_up_2': Limit('charge_up_2', 4, 5, 0),
    'cooldown': Limit('cooldown', 2, 3, 0),
    # HP-Based Limits
    'charges_1': Limit('charges_1', 1, 4, 0),
    'charges_2': Limit('charges_2', 2, 2, 0),
    'near_death': Limit('near_death', 2, 2, 0),
    'bloodied': Limit('bloodied', 3, 1, 0),
    'timid': Limit('timid', 2, 2, 0),
    'attrition': Limit('attrition', 2, 2, 0),
    # Turn/Combat State Limits
    'slaughter': Limit('slaughter', 2, 4, 0),
    'relentless': Limit('relentless', 2, 1, 0),
    'combo_move': Limit('combo_move', 4, 1, 0),
    'revenge': Limit('revenge', 3, 1, 0),
    'vengeful': Limit('vengeful', 4, 1, 0),
    'untouchable': Limit('untouchable', 2, 2, 0),
    'unbreakable': Limit('unbreakable', 1, 4, 0),
    'passive': Limit('passive', 2, 2, 0),
    'careful': Limit('careful', 3, 2, 0),
}

# Rule Validation System
PREREQUISITES = {
}

MUTUAL_EXCLUSIONS = [
    ['double_tap', 'powerful_critical'],  # Both include critical accuracy, can't stack
    ['double_tap', 'explosive_critical'],  # Explosive Critical cannot trigger from Double-Tap
    ['double_tap', 'ricochet'],  # Can't combine multiple critical trigger effects
    ['powerful_critical', 'explosive_critical'],
    ['powerful_critical', 'ricochet'],
    ['explosive_critical', 'ricochet'],

    ['unreliable_1', 'unreliable_2', 'unreliable_3'],
    ['quickdraw', 'patient', 'finale', 'cooldown'],
    ['charge_up', 'charge_up_2'],
    ['charges_1', 'charges_2'],  # Can only have one charge limit
    # Slayer upgrades - can only pick one type per slayer level
    ['minion_slayer_acc', 'minion_slayer_dmg'],
    ['captain_slayer_acc', 'captain_slayer_dmg'],
    ['elite_slayer_acc', 'elite_slayer_dmg'],
    ['boss_slayer_acc', 'boss_slayer_dmg'],
    # HP-based limits - can only have one HP condition
    ['near_death', 'bloodied', 'timid'],
    # Turn tracking limits - can only have one per category
    ['slaughter', 'relentless', 'combo_move'],  # Last turn offensive actions
    ['revenge', 'vengeful', 'untouchable', 'unbreakable', 'passive', 'careful'],  # Last turn defensive states
]

ATTACK_TYPE_RESTRICTIONS = {
    'quick_strikes': ['melee_ac', 'melee_dg', 'ranged', 'direct_damage'],
    'barrage': ['melee_ac', 'melee_dg', 'ranged', 'direct_damage'],
    'extra_attack': ['melee_ac', 'melee_dg', 'ranged', 'direct_damage'],
    'explosive_critical': ['melee_ac', 'melee_dg', 'ranged', 'direct_damage'],  # Cannot apply to AOE attacks
    'splinter': ['melee_ac', 'melee_dg', 'ranged', 'direct_damage'],  # Cannot apply to AOE attacks
    'ricochet': ['melee_ac', 'melee_dg', 'ranged', 'direct_damage'],  # Cannot apply to AOE attacks
}

AOE_RESTRICTIONS = [
    'finishing_blow_1', 'finishing_blow_2', 'finishing_blow_3',
    'culling_strike', 'leech', 'critical_accuracy', 'critical_condition',
    'explosive_critical', 'splinter', 'ricochet'
]


class RuleValidator:
    """Validates upgrade combinations according to Vitality System rules"""

    @staticmethod
    def check_prerequisites(upgrades: List[str]) -> Tuple[bool, List[str]]:
        """Check if all prerequisites are met for the given upgrades"""
        errors = []
        upgrade_set = set(upgrades)

        for upgrade in upgrades:
            if upgrade in PREREQUISITES:
                required = PREREQUISITES[upgrade]
                missing = [req for req in required if req not in upgrade_set]
                if missing:
                    errors.append(f"{upgrade} requires {', '.join(missing)}")

        return len(errors) == 0, errors

    @staticmethod
    def check_mutual_exclusions(upgrades: List[str]) -> Tuple[bool, List[str]]:
        """Check if any mutually exclusive upgrades are combined"""
        errors = []
        upgrade_set = set(upgrades)

        for exclusion_group in MUTUAL_EXCLUSIONS:
            present = [upgrade for upgrade in exclusion_group if upgrade in upgrade_set]
            if len(present) > 1:
                errors.append(f"Mutually exclusive upgrades: {', '.join(present)}")

        return len(errors) == 0, errors

    @staticmethod
    def check_attack_type_restrictions(attack_type: str, upgrades: List[str]) -> Tuple[bool, List[str]]:
        """Check if upgrades are compatible with the attack type"""
        errors = []

        for upgrade in upgrades:
            if upgrade in ATTACK_TYPE_RESTRICTIONS:
                allowed_types = ATTACK_TYPE_RESTRICTIONS[upgrade]
                if attack_type not in allowed_types:
                    errors.append(f"{upgrade} can only be used with {', '.join(allowed_types)} attacks")

        return len(errors) == 0, errors

    @staticmethod
    def check_aoe_restrictions(attack_type: str, upgrades: List[str]) -> Tuple[bool, List[str]]:
        """Check if AOE-restricted upgrades are used with non-AOE attacks"""
        errors = []
        is_aoe = attack_type in ['area', 'direct_area_damage']

        if is_aoe:
            forbidden = [upgrade for upgrade in upgrades if upgrade in AOE_RESTRICTIONS]
            if forbidden:
                errors.append(f"These upgrades cannot apply to AOE attacks: {', '.join(forbidden)}")

        return len(errors) == 0, errors

    @staticmethod
    def validate_combination(attack_type: str, upgrades: List[str]) -> Tuple[bool, List[str]]:
        """Validate entire upgrade combination against all rules"""
        all_errors = []

        valid, errors = RuleValidator.check_prerequisites(upgrades)
        all_errors.extend(errors)

        valid, errors = RuleValidator.check_mutual_exclusions(upgrades)
        all_errors.extend(errors)

        valid, errors = RuleValidator.check_attack_type_restrictions(attack_type, upgrades)
        all_errors.extend(errors)

        valid, errors = RuleValidator.check_aoe_restrictions(attack_type, upgrades)
        all_errors.extend(errors)

        return len(all_errors) == 0, all_errors
