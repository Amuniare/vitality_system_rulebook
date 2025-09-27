"""
Game data constants and rule definitions for the Vitality System.
"""

from models import AttackType, Upgrade, Limit
from typing import List, Tuple


# Attack Types
ATTACK_TYPES = {
    'melee_ac': AttackType('melee_ac', 0),  # Melee with +Tier accuracy bonus
    'melee_dg': AttackType('melee_dg', 0),  # Melee with +Tier damage bonus
    'ranged': AttackType('ranged', 0),
    'area': AttackType('area', 0, accuracy_mod=-1, damage_mod=-1),
    'direct_damage': AttackType('direct_damage', 0, is_direct=True, direct_damage_base=14),
    'direct_area_damage': AttackType('direct_area_damage', 0, is_direct=True, direct_damage_base=14)
}

# Key damage-focused upgrades
UPGRADES = {
    'power_attack': Upgrade('power_attack', 10, damage_mod=1, accuracy_penalty=1),
    'high_impact': Upgrade('high_impact', 20, special_effect="flat_15"),
    'critical_effect': Upgrade('critical_effect', 20, damage_penalty=2, special_effect="explode_5_6"),
    'armor_piercing': Upgrade('armor_piercing', 20, special_effect="ignore_endurance"),
    'brutal': Upgrade('brutal', 20, special_effect="brutal_10"),
    'quick_strikes': Upgrade('quick_strikes', 40, special_effect="double_attack", damage_penalty=1, accuracy_penalty=1),
    'bleed': Upgrade('bleed', 20, special_effect="bleed_2_turns", damage_penalty=1),
    'critical_accuracy': Upgrade('critical_accuracy', 20, special_effect="crit_15_20"),
    'powerful_critical': Upgrade('powerful_critical', 20, special_effect="powerful_crit"),
    'double_tap': Upgrade('double_tap', 30, special_effect="double_tap"),
    'finishing_blow_1': Upgrade('finishing_blow_1', 20, special_effect="finishing_5"),
    'finishing_blow_2': Upgrade('finishing_blow_2', 40, special_effect="finishing_10"),
    'finishing_blow_3': Upgrade('finishing_blow_3', 60, special_effect="finishing_15"),
    'extra_attack': Upgrade('extra_attack', 40, special_effect="extra_attack"),
    'barrage': Upgrade('barrage', 60, special_effect="barrage_chain", damage_penalty=1, accuracy_penalty=1),
    'minion_slayer_acc': Upgrade('minion_slayer_acc', 20, special_effect="slayer_minion_acc"),
    'minion_slayer_dmg': Upgrade('minion_slayer_dmg', 20, special_effect="slayer_minion_dmg"),
    'captain_slayer_acc': Upgrade('captain_slayer_acc', 20, special_effect="slayer_captain_acc"),
    'captain_slayer_dmg': Upgrade('captain_slayer_dmg', 20, special_effect="slayer_captain_dmg"),
    'elite_slayer_acc': Upgrade('elite_slayer_acc', 20, special_effect="slayer_elite_acc"),
    'elite_slayer_dmg': Upgrade('elite_slayer_dmg', 20, special_effect="slayer_elite_dmg"),
    'boss_slayer_acc': Upgrade('boss_slayer_acc', 20, special_effect="slayer_boss_acc"),
    'boss_slayer_dmg': Upgrade('boss_slayer_dmg', 20, special_effect="slayer_boss_dmg"),
    'accurate_attack': Upgrade('accurate_attack', 10, accuracy_mod=1, damage_penalty=1),
    'reliable_accuracy': Upgrade('reliable_accuracy', 20, accuracy_penalty=3, special_effect="advantage"),
    'overhit': Upgrade('overhit', 30, special_effect="overhit"),
}

LIMITS = {
    'unreliable_1': Limit('unreliable_1', 20, 1, 5),   # Cost 20p, +Tier to Accuracy and Damage, DC 5
    'unreliable_2': Limit('unreliable_2', 20, 3, 10),  # Cost 20p, +3×Tier to Accuracy and Damage, DC 10
    'unreliable_3': Limit('unreliable_3', 20, 5, 15),  # Cost 40p, +5×Tier to Accuracy and Damage, DC 15+
    'quickdraw': Limit('quickdraw', 20, 2, 0),          # Cost 20p, +2×Tier to Accuracy and Damage, turns 1-2
    'steady': Limit('steady', 20, 1, 0),                # Cost 20p, +Tier to Accuracy and Damage, turn 3 or later
    'patient': Limit('patient', 20, 1, 0),              # Cost 20p, +Tier to Accuracy and Damage, turn 5 or later
    'finale': Limit('finale', 10, 3, 0),                # Cost 10p, +3×Tier to Accuracy and Damage, turn 8 or later
    'charge_up': Limit('charge_up', 10, 2, 0),          # Cost 10p, +2×Tier to Accuracy and Damage, spend action on previous turn
    'charge_up_2': Limit('charge_up_2', 10, 3, 0),     # Cost 10p, +3×Tier to Accuracy and Damage, spend actions on previous two turns
}

# Rule Validation System
PREREQUISITES = {
}

MUTUAL_EXCLUSIONS = [
    ['double_tap', 'ricochet', 'explosive_critical', 'critical_accuracy'],
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
    'barrage': ['melee_ac', 'melee_dg', 'ranged', 'direct_damage'],
    'extra_attack': ['melee_ac', 'melee_dg', 'ranged', 'direct_damage'],
}

AOE_RESTRICTIONS = [
    'finishing_blow_1', 'finishing_blow_2', 'finishing_blow_3',
    'culling_strike', 'leech', 'critical_accuracy', 'critical_condition'
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