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
    'direct_damage': AttackType('direct_damage', 0, is_direct=True, direct_damage_base=15, damage_mod=-1),
    'direct_area_damage': AttackType('direct_area_damage', 0, is_direct=True, direct_damage_base=15, is_area=True, damage_mod=-2)
}

# Upgrades - Costs updated 2025-10-07
UPGRADES = {
    'power_attack': Upgrade('power_attack', 1, damage_mod=1, accuracy_penalty=1),
    'high_impact': Upgrade('high_impact', 3, special_effect="flat_15"),
    'critical_effect': Upgrade('critical_effect', 2, damage_penalty=3, special_effect="explode_5_6"),
    'armor_piercing': Upgrade('armor_piercing', 3, accuracy_penalty=1, special_effect="ignore_endurance"),
    'brutal': Upgrade('brutal', 2, special_effect="brutal_tier"),
    'bleed': Upgrade('bleed', 3, damage_penalty=1, special_effect="bleed_1_turn"),
    'powerful_critical': Upgrade('powerful_critical', 2, special_effect="powerful_crit"),
    'double_tap': Upgrade('double_tap', 3, special_effect="double_tap"),
    'finishing_blow_1': Upgrade('finishing_blow_1', 2, special_effect="finishing_5"),
    'extra_attack': Upgrade('extra_attack', 2, accuracy_penalty=1, damage_penalty=1, special_effect="extra_attack"),
    'barrage': Upgrade('barrage', 2, special_effect="barrage_chain", damage_penalty=2, accuracy_penalty=2),
    # Slayer upgrades - unified system (give both accuracy and damage bonuses)
    'minion_slayer': Upgrade('minion_slayer', 2, special_effect="slayer_minion"),
    'captain_slayer': Upgrade('captain_slayer', 2, special_effect="slayer_captain"),
    'elite_slayer': Upgrade('elite_slayer', 2, special_effect="slayer_elite"),
    'boss_slayer': Upgrade('boss_slayer', 2, special_effect="slayer_boss"),
    'accurate_attack': Upgrade('accurate_attack', 1, accuracy_mod=1, damage_penalty=1),
    'reliable_accuracy': Upgrade('reliable_accuracy', 2, accuracy_penalty=3, special_effect="advantage"),
    'overhit': Upgrade('overhit', 3, special_effect="overhit"),
    'explosive_critical': Upgrade('explosive_critical', 1, accuracy_penalty=2, damage_penalty=2, special_effect="explosive_critical"),
    'culling_strike': Upgrade('culling_strike', 3, special_effect="culling_strike"),
    'splinter': Upgrade('splinter', 3, accuracy_penalty=2, damage_penalty=2, special_effect="splinter"),
    'ricochet': Upgrade('ricochet', 2, special_effect="ricochet"),
    'channeled': Upgrade('channeled', 3, special_effect="channeled"),
}

# Limits - Costs updated 2025-10-18
LIMITS = {
    # Reliability/Turn Timing Limits
    'unreliable_1': Limit('unreliable_1', 2, 1, 5),
    'unreliable_2': Limit('unreliable_2', 3, 3, 10),
    'unreliable_3': Limit('unreliable_3', 2, 6, 15),
    'quickdraw': Limit('quickdraw', 3, 4, 0),
    'patient': Limit('patient', 2, 1, 0),
    'finale': Limit('finale', 2, 2, 0),
    'charge_up': Limit('charge_up', 3, 3, 0),
    'charge_up_2': Limit('charge_up_2', 2, 4, 0),
    'cooldown': Limit('cooldown', 1, 3, 0),
    # HP-Based Limits
    'charges_1': Limit('charges_1', 1, 6, 0),
    'charges_2': Limit('charges_2', 1, 3, 0),
    'near_death': Limit('near_death', 1, 6, 0),
    'bloodied': Limit('bloodied', 2, 3, 0),
    'timid': Limit('timid', 1, 4, 0),
    # 'attrition': Limit('attrition', 2, 2, 0),  # REMOVED: HP cost mechanic not suitable for simulation
    # Turn/Combat State Limits
    'slaughter': Limit('slaughter', 2, 3, 0),  # NOTE: Activates after defeating an enemy on the previous turn
    'relentless': Limit('relentless', 3, 1, 0),
    'combo_move': Limit('combo_move', 2, 1, 0),
    # 'infected': Limit('infected', 2, 1, 0),  # REMOVED: Requires Condition system (not yet implemented)
    'revenge': Limit('revenge', 3, 2, 0),
    'vengeful': Limit('vengeful', 2, 1, 0),
    'untouchable': Limit('untouchable', 1, 2, 0),
    'unbreakable': Limit('unbreakable', 1, 6, 0),
    'passive': Limit('passive', 1, 1, 0),
    'careful': Limit('careful', 1, 2, 0),
}

# Rule Validation System
PREREQUISITES = {
}

MUTUAL_EXCLUSIONS = [
    # Critical Effect Upgrades - explosive_critical conflicts with all others, but powerful_critical can pair with double_tap/ricochet
    ['double_tap', 'explosive_critical', 'ricochet'],
    ['powerful_critical', 'explosive_critical'],

    ['unreliable_1', 'unreliable_2', 'unreliable_3'],
    ['quickdraw', 'patient', 'finale', 'cooldown'],
    ['charge_up', 'charge_up_2'],
    ['charges_1', 'charges_2'],  # Can only have one charge limit
    # Slayer upgrades - can only have one slayer bonus per attack
    ['minion_slayer', 'captain_slayer', 'elite_slayer', 'boss_slayer'],
    # HP-based limits - can only have one HP condition
    ['near_death', 'bloodied', 'timid'],
    # Turn tracking limits - can only have one per category
    ['slaughter', 'relentless', 'combo_move'],  # Last turn offensive actions
    ['revenge', 'vengeful', 'untouchable', 'unbreakable', 'careful'],  # Last turn hit/damage tracking limits
    ['careful', 'timid'],  # Careful (not damaged) conflicts with Timid (max HP)
    # Cross-category incompatibilities
    ['quickdraw', 'timid', 'careful'],  # Quickdraw conflicts with defensive HP/turn conditions
    ['quickdraw', 'passive'],  # Quickdraw (early turn bonus) conflicts with passive (no offensive action)
    ['quickdraw', 'charges_1', 'charges_2'],  # Quickdraw conflicts with charges (per RULES.md Quickdraw restrictions)
    ['cooldown', 'charges_1', 'charges_2'],  # Cooldown (reuse restriction) conflicts with charge limits
    ['timid', 'charges_1', 'charges_2'],  # Timid (max HP) conflicts with limited-use charge abilities
    # Instant defeat mechanics
    ['culling_strike', 'splinter', 'explosive_critical'],  # Culling Strike conflicts with chain/splash effects
    # Channeled restrictions (upgrade-limit cross-category)
    ['channeled', 'charge_up', 'charge_up_2', 'charges_1', 'charges_2'],  # Channeled (consecutive turns) conflicts with charge mechanics
]

ATTACK_TYPE_RESTRICTIONS = {
    # Accuracy modifiers - cannot apply to direct attacks (auto-hit)
    'power_attack': ['melee_ac', 'melee_dg', 'ranged', 'area'],
    'accurate_attack': ['melee_ac', 'melee_dg', 'ranged', 'area'],
    'reliable_accuracy': ['melee_ac', 'melee_dg', 'ranged', 'area'],
    'overhit': ['melee_ac', 'melee_dg', 'ranged', 'area'],
    # Slayer upgrades - accuracy component requires accuracy roll
    'minion_slayer': ['melee_ac', 'melee_dg', 'ranged', 'area'],
    'captain_slayer': ['melee_ac', 'melee_dg', 'ranged', 'area'],
    'elite_slayer': ['melee_ac', 'melee_dg', 'ranged', 'area'],
    'boss_slayer': ['melee_ac', 'melee_dg', 'ranged', 'area'],

    # Dice roll modifiers - cannot apply to direct attacks (flat damage, no dice)
    'high_impact': ['melee_ac', 'melee_dg', 'ranged', 'area'],
    'critical_effect': ['melee_ac', 'melee_dg', 'ranged', 'area'],

    # Critical-based effects - require accuracy rolls (cannot apply to direct attacks)
    'powerful_critical': ['melee_ac', 'melee_dg', 'ranged', 'area'],
    'explosive_critical': ['melee_ac', 'melee_dg', 'ranged'],  # Also cannot apply to AOE
    'double_tap': ['melee_ac', 'melee_dg', 'ranged'],  # Also cannot apply to AOE
    'ricochet': ['melee_ac', 'melee_dg', 'ranged'],  # Also cannot apply to AOE
    'splinter': ['melee_ac', 'melee_dg', 'ranged'],  # Also cannot apply to AOE

    # Special mechanics that don't work with direct attacks
    'armor_piercing': ['melee_ac', 'melee_dg', 'ranged', 'area'],  # Direct attacks don't need armor piercing
    'combo_move': ['melee_ac', 'melee_dg', 'ranged', 'area'],  # Combo tracking doesn't work with direct attacks
    'extra_attack': ['melee_ac', 'melee_dg', 'ranged', 'area'],  # Extra attack requires hit/effect tracking

    # Instant defeat mechanics - cannot apply to AOE attacks
    'culling_strike': ['melee_ac', 'melee_dg', 'ranged', 'direct_damage'],  # Cannot apply to area or direct_area_damage
}

AOE_RESTRICTIONS = [
    'double_tap',
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
    def validate_combination(attack_type: str, upgrades: List[str], limits: List[str] = None) -> Tuple[bool, List[str]]:
        """Validate entire upgrade combination against all rules"""
        all_errors = []
        if limits is None:
            limits = []

        valid, errors = RuleValidator.check_prerequisites(upgrades)
        all_errors.extend(errors)

        # Check mutual exclusions with both upgrades and limits combined
        combined = upgrades + limits
        valid, errors = RuleValidator.check_mutual_exclusions(combined)
        all_errors.extend(errors)

        valid, errors = RuleValidator.check_attack_type_restrictions(attack_type, upgrades)
        all_errors.extend(errors)

        valid, errors = RuleValidator.check_aoe_restrictions(attack_type, upgrades)
        all_errors.extend(errors)

        return len(all_errors) == 0, all_errors
