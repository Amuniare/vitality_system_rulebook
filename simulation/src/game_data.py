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

# Key damage-focused upgrades - COSTS UPDATED 2025-10-04 (divided by 20, min 1)
UPGRADES = {
    'power_attack': Upgrade('power_attack', 1, damage_mod=1, accuracy_penalty=1),  # was 10p
    'high_impact': Upgrade('high_impact', 2, special_effect="flat_15"),  # was 20p, updated to 2p on 2025-10-05
    'critical_effect': Upgrade('critical_effect', 1, damage_penalty=2, special_effect="explode_5_6"),  # was 10p
    'armor_piercing': Upgrade('armor_piercing', 3, special_effect="ignore_endurance"),  # was 70p
    'brutal': Upgrade('brutal', 2, special_effect="brutal_10"),  # was 40p
    'quick_strikes': Upgrade('quick_strikes', 2, special_effect="quick_strikes_2", damage_penalty=1, accuracy_penalty=1),  # was 40p
    'bleed': Upgrade('bleed', 3, special_effect="bleed_2_turns"),  # was 60p
    'critical_accuracy': Upgrade('critical_accuracy', 1, special_effect="crit_15_20"),  # was 20p
    'powerful_critical': Upgrade('powerful_critical', 2, special_effect="powerful_crit"),  # was 40p
    'double_tap': Upgrade('double_tap', 3, special_effect="double_tap"),  # was 60p
    'finishing_blow_1': Upgrade('finishing_blow_1', 1, special_effect="finishing_5"),  # was 20p
    'finishing_blow_2': Upgrade('finishing_blow_2', 2, special_effect="finishing_10"),  # was 40p
    'finishing_blow_3': Upgrade('finishing_blow_3', 4, special_effect="finishing_15"),  # was 90p, updated to 4p on 2025-10-05
    'extra_attack': Upgrade('extra_attack', 3, special_effect="extra_attack"),  # was 80p, updated to 3p on 2025-10-05
    'barrage': Upgrade('barrage', 2, special_effect="barrage_chain", damage_penalty=1, accuracy_penalty=1),  # was 60p, updated to 2p on 2025-10-06
    'minion_slayer_acc': Upgrade('minion_slayer_acc', 1, special_effect="slayer_minion_acc"),  # was 20p
    'minion_slayer_dmg': Upgrade('minion_slayer_dmg', 1, special_effect="slayer_minion_dmg"),  # was 20p
    'minion_slayer_cond': Upgrade('minion_slayer_cond', 1, special_effect="slayer_minion_cond"),  # added 2025-10-07
    'captain_slayer_acc': Upgrade('captain_slayer_acc', 1, special_effect="slayer_captain_acc"),  # was 20p
    'captain_slayer_dmg': Upgrade('captain_slayer_dmg', 1, special_effect="slayer_captain_dmg"),  # was 20p
    'captain_slayer_cond': Upgrade('captain_slayer_cond', 1, special_effect="slayer_captain_cond"),  # added 2025-10-07
    'elite_slayer_acc': Upgrade('elite_slayer_acc', 1, special_effect="slayer_elite_acc"),  # was 20p
    'elite_slayer_dmg': Upgrade('elite_slayer_dmg', 1, special_effect="slayer_elite_dmg"),  # was 20p
    'elite_slayer_cond': Upgrade('elite_slayer_cond', 1, special_effect="slayer_elite_cond"),  # added 2025-10-07
    'boss_slayer_acc': Upgrade('boss_slayer_acc', 1, special_effect="slayer_boss_acc"),  # was 20p
    'boss_slayer_dmg': Upgrade('boss_slayer_dmg', 1, special_effect="slayer_boss_dmg"),  # was 20p
    'boss_slayer_cond': Upgrade('boss_slayer_cond', 1, special_effect="slayer_boss_cond"),  # added 2025-10-07
    'accurate_attack': Upgrade('accurate_attack', 1, accuracy_mod=1, damage_penalty=1),  # was 10p
    'reliable_accuracy': Upgrade('reliable_accuracy', 1, accuracy_penalty=3, special_effect="advantage"),  # was 20p
    'overhit': Upgrade('overhit', 2, special_effect="overhit"),  # was 40p
    'explosive_critical': Upgrade('explosive_critical', 3, special_effect="explosive_critical"),  # was 60p
    'culling_strike': Upgrade('culling_strike', 1, special_effect="culling_strike"),  # was 20p
    'splinter': Upgrade('splinter', 4, special_effect="splinter"),  # was 80p, updated to 4p on 2025-10-05
    # NEW UPGRADES - ADDED 2025-10-04
    'ricochet': Upgrade('ricochet', 1, special_effect="ricochet"),  # was 30p
    'channeled': Upgrade('channeled', 2, accuracy_penalty=2, damage_penalty=2, special_effect="channeled"),  # Cost 2p, -2×Tier penalty (updated 2025-10-07)
    'leech': Upgrade('leech', 3, accuracy_penalty=1, damage_penalty=1, special_effect="leech"),  # was 60p
}

LIMITS = {
    'unreliable_1': Limit('unreliable_1', 2, 1, 5),   # Cost 2p (was 40p), +Tier to Accuracy and Damage, DC 5
    'unreliable_2': Limit('unreliable_2', 3, 3, 10),  # Cost 3p (updated 2025-10-05), +3×Tier to Accuracy and Damage, DC 10
    'unreliable_3': Limit('unreliable_3', 2, 6, 15),  # Cost 2p (updated 2025-10-05), +6×Tier to Accuracy and Damage, DC 15+
    'quickdraw': Limit('quickdraw', 2, 3, 0),          # Cost 2p (updated 2025-10-05), +3×Tier to Accuracy and Damage, first round
    'patient': Limit('patient', 4, 1, 0),              # Cost 4p (updated 2025-10-05), +Tier to Accuracy and Damage, turn 5 or later
    'finale': Limit('finale', 4, 2, 0),                # Cost 4p (updated 2025-10-05), +2×Tier, turn 8 or later
    'charge_up': Limit('charge_up', 4, 3, 0),          # Cost 4p, +3×Tier to Accuracy and Damage, spend action on previous turn (updated 2025-10-07)
    'charge_up_2': Limit('charge_up_2', 4, 5, 0),     # Cost 4p, +5×Tier to Accuracy and Damage, spend actions on previous two turns (updated 2025-10-07)
    'cooldown': Limit('cooldown', 1, 3, 0),           # Cost 1p (updated 2025-10-06), +3×Tier to Accuracy and Damage, cannot use again for 3 turns after use
    # NEW LIMITS - ADDED 2025-10-04
    # HP-Based Limits
    'charges_1': Limit('charges_1', 1, 5, 0),          # Cost 1p, +5×Tier, 1 use per rest (updated 2025-10-06)
    'charges_2': Limit('charges_2', 2, 2, 0),          # Cost 2p (was 50p), +2×Tier, 2 uses per rest
    'near_death': Limit('near_death', 3, 2, 0),        # Cost 3p (updated 2025-10-06), +2×Tier, at ≤25 HP
    'bloodied': Limit('bloodied', 3, 1, 0),            # Cost 3p (updated 2025-10-05), +Tier, at ≤50 HP
    'timid': Limit('timid', 1, 2, 0),                  # Cost 1p (was 30p), +2×Tier, at max HP
    'attrition': Limit('attrition', 2, 2, 0),          # Cost 2p (updated 2025-10-06), +2×Tier, costs 20 HP per use
    # Turn/Combat State Limits
    'slaughter': Limit('slaughter', 2, 5, 0),          # Cost 2p (updated 2025-10-06), +5×Tier (updated 2025-10-06), defeated enemy last turn
    'relentless': Limit('relentless', 4, 2, 0),        # Cost 4p, +2×Tier, dealt damage last turn (updated 2025-10-06)
    'combo_move': Limit('combo_move', 4, 1, 0),        # Cost 4p (updated 2025-10-05), +Tier, hit same enemy last turn
    'revenge': Limit('revenge', 3, 1, 0),              # Cost 3p (updated 2025-10-05), +Tier, been damaged since last turn
    'vengeful': Limit('vengeful', 4, 1, 0),            # Cost 4p (updated 2025-10-05), +Tier, been hit since last turn
    'untouchable': Limit('untouchable', 2, 2, 0),      # Cost 2p, +2×Tier, all attacks missed last turn (updated 2025-10-06)
    'unbreakable': Limit('unbreakable', 1, 4, 0),      # Cost 1p, +4×Tier (updated 2025-10-05), hit but no damage last turn
    'passive': Limit('passive', 2, 2, 0),              # Cost 2p (was 50p), +2×Tier, not attacked since last turn
    'careful': Limit('careful', 3, 2, 0),              # Cost 3p (updated 2025-10-05), +2×Tier, not damaged since last turn
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
    ['minion_slayer_acc', 'minion_slayer_dmg', 'minion_slayer_cond'],
    ['captain_slayer_acc', 'captain_slayer_dmg', 'captain_slayer_cond'],
    ['elite_slayer_acc', 'elite_slayer_dmg', 'elite_slayer_cond'],
    ['boss_slayer_acc', 'boss_slayer_dmg', 'boss_slayer_cond'],
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