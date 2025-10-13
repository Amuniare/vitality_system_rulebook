"""
Comprehensive Game Rules Verification Script

This script verifies that all rules from RULES.md are correctly implemented
in the codebase (game_data.py, combat.py, simulation.py).
"""

import sys
from typing import List, Tuple, Dict
from src.game_data import ATTACK_TYPES, UPGRADES, LIMITS, MUTUAL_EXCLUSIONS, ATTACK_TYPE_RESTRICTIONS, AOE_RESTRICTIONS
from src.models import Character, AttackBuild
from src.combat import make_attack, can_activate_limit


class RuleVerifier:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []

    def check(self, test_name: str, condition: bool, expected: str, actual: str):
        """Record a test result"""
        if condition:
            self.passed.append(f"[PASS] {test_name}")
        else:
            self.failed.append(f"[FAIL] {test_name}: Expected {expected}, Got {actual}")

    def warn(self, message: str):
        """Record a warning"""
        self.warnings.append(f"[WARN] {message}")

    def print_report(self):
        """Print the verification report"""
        print("\n" + "="*80)
        print("GAME RULES VERIFICATION REPORT")
        print("="*80)

        print(f"\nSummary: {len(self.passed)} passed, {len(self.failed)} failed, {len(self.warnings)} warnings")

        if self.failed:
            print("\n" + "="*80)
            print("FAILED CHECKS")
            print("="*80)
            for failure in self.failed:
                print(failure)

        if self.warnings:
            print("\n" + "="*80)
            print("WARNINGS")
            print("="*80)
            for warning in self.warnings:
                print(warning)

        if self.passed:
            print("\n" + "="*80)
            print("PASSED CHECKS")
            print("="*80)
            for success in self.passed:
                print(success)

        print("\n" + "="*80)
        if not self.failed:
            print("SUCCESS: ALL CRITICAL CHECKS PASSED!")
        else:
            print(f"WARNING: {len(self.failed)} ISSUES FOUND - REVIEW REQUIRED")
        print("="*80 + "\n")


def verify_attack_types(verifier: RuleVerifier):
    """Verify all 6 attack types"""
    print("\n[VERIFYING] Attack Types...")

    # Check melee_ac
    melee_ac = ATTACK_TYPES['melee_ac']
    verifier.check("melee_ac exists", 'melee_ac' in ATTACK_TYPES, "exists", "exists")
    verifier.check("melee_ac cost", melee_ac.cost == 0, "0", str(melee_ac.cost))
    # Note: melee_ac bonus is applied in combat.py, not in AttackType

    # Check melee_dg
    melee_dg = ATTACK_TYPES['melee_dg']
    verifier.check("melee_dg exists", 'melee_dg' in ATTACK_TYPES, "exists", "exists")
    verifier.check("melee_dg cost", melee_dg.cost == 0, "0", str(melee_dg.cost))
    # Note: melee_dg bonus is applied in combat.py, not in AttackType

    # Check ranged
    ranged = ATTACK_TYPES['ranged']
    verifier.check("ranged exists", 'ranged' in ATTACK_TYPES, "exists", "exists")
    verifier.check("ranged cost", ranged.cost == 0, "0", str(ranged.cost))
    verifier.check("ranged accuracy_mod", ranged.accuracy_mod == 0, "0", str(ranged.accuracy_mod))
    verifier.check("ranged damage_mod", ranged.damage_mod == 0, "0", str(ranged.damage_mod))

    # Check area
    area = ATTACK_TYPES['area']
    verifier.check("area exists", 'area' in ATTACK_TYPES, "exists", "exists")
    verifier.check("area accuracy_mod", area.accuracy_mod == -1, "-1", str(area.accuracy_mod))
    verifier.check("area damage_mod", area.damage_mod == -1, "-1", str(area.damage_mod))
    verifier.check("area is_area flag", area.is_area == True, "True", str(area.is_area))

    # Check direct_damage
    dd = ATTACK_TYPES['direct_damage']
    verifier.check("direct_damage exists", 'direct_damage' in ATTACK_TYPES, "exists", "exists")
    verifier.check("direct_damage is_direct", dd.is_direct == True, "True", str(dd.is_direct))
    verifier.check("direct_damage base", dd.direct_damage_base == 15, "15", str(dd.direct_damage_base))
    verifier.check("direct_damage damage_mod", dd.damage_mod == -1, "-1 (for 15-Tier)", str(dd.damage_mod))

    # Check direct_area_damage
    dad = ATTACK_TYPES['direct_area_damage']
    verifier.check("direct_area_damage exists", 'direct_area_damage' in ATTACK_TYPES, "exists", "exists")
    verifier.check("direct_area_damage is_direct", dad.is_direct == True, "True", str(dad.is_direct))
    verifier.check("direct_area_damage is_area", dad.is_area == True, "True", str(dad.is_area))
    verifier.check("direct_area_damage base", dad.direct_damage_base == 15, "15", str(dad.direct_damage_base))
    verifier.check("direct_area_damage damage_mod", dad.damage_mod == -2, "-2 (for 15-2×Tier)", str(dad.damage_mod))


def verify_upgrade_costs(verifier: RuleVerifier):
    """Verify upgrade costs match RULES.md"""
    print("\n[VERIFYING] Upgrade Costs...")

    # Expected costs from RULES.md
    expected_costs = {
        'accurate_attack': 1, 'power_attack': 1, 'reliable_accuracy': 1,
        'overhit': 2, 'high_impact': 2, 'critical_effect': 1,
        'armor_piercing': 3, 'brutal': 2,
        'quick_strikes': 2, 'barrage': 2, 'extra_attack': 2,
        'critical_accuracy': 1, 'powerful_critical': 2, 'ricochet': 2,
        'double_tap': 3, 'explosive_critical': 2,
        'bleed': 3,
        'finishing_blow_1': 1, 'finishing_blow_2': 2, 'finishing_blow_3': 3,
        'culling_strike': 1, 'splinter': 3,
        'minion_slayer_acc': 1, 'minion_slayer_dmg': 1,
        'captain_slayer_acc': 1, 'captain_slayer_dmg': 1,
        'elite_slayer_acc': 1, 'elite_slayer_dmg': 1,
        'boss_slayer_acc': 1, 'boss_slayer_dmg': 1,
        'channeled': 2, 'leech': 3,
    }

    for upgrade_name, expected_cost in expected_costs.items():
        if upgrade_name in UPGRADES:
            actual_cost = UPGRADES[upgrade_name].cost
            verifier.check(f"Upgrade '{upgrade_name}' cost",
                          actual_cost == expected_cost,
                          str(expected_cost), str(actual_cost))
        else:
            verifier.failed.append(f"[FAIL] Upgrade '{upgrade_name}' not found in UPGRADES")


def verify_limit_costs(verifier: RuleVerifier):
    """Verify limit costs match RULES.md"""
    print("\n[VERIFYING] Limit Costs...")

    # Expected costs from RULES.md
    expected_costs = {
        'unreliable_1': 2, 'unreliable_2': 2, 'unreliable_3': 1,
        'quickdraw': 2, 'patient': 3, 'finale': 3,
        'charge_up': 2, 'charge_up_2': 2, 'cooldown': 1,
        'timid': 2, 'near_death': 3, 'bloodied': 2, 'attrition': 2,
        'charges_1': 1, 'charges_2': 2,
        'vengeful': 3, 'revenge': 3, 'unbreakable': 1, 'untouchable': 1,
        'passive': 1, 'careful': 3,
        'combo_move': 3, 'infected': 2, 'relentless': 2, 'slaughter': 1,
    }

    for limit_name, expected_cost in expected_costs.items():
        if limit_name in LIMITS:
            actual_cost = LIMITS[limit_name].cost
            verifier.check(f"Limit '{limit_name}' cost",
                          actual_cost == expected_cost,
                          str(expected_cost), str(actual_cost))
        else:
            verifier.failed.append(f"[FAIL] Limit '{limit_name}' not found in LIMITS")


def verify_limit_bonuses(verifier: RuleVerifier):
    """Verify limit bonuses match RULES.md"""
    print("\n[VERIFYING] Limit Bonuses...")

    # Expected bonuses (multiplier of Tier)
    expected_bonuses = {
        'unreliable_1': 1, 'unreliable_2': 3, 'unreliable_3': 7,
        'quickdraw': 3, 'patient': 1, 'finale': 2,
        'charge_up': 3, 'charge_up_2': 6, 'cooldown': 2,
        'timid': 2, 'near_death': 2, 'bloodied': 1, 'attrition': 2,
        'charges_1': 5, 'charges_2': 2,
        'vengeful': 1, 'revenge': 1, 'unbreakable': 4, 'untouchable': 2,
        'passive': 2, 'careful': 2,
        'combo_move': 1, 'infected': 1, 'relentless': 1, 'slaughter': 4,
    }

    for limit_name, expected_bonus in expected_bonuses.items():
        if limit_name in LIMITS:
            actual_bonus = LIMITS[limit_name].damage_bonus
            verifier.check(f"Limit '{limit_name}' bonus",
                          actual_bonus == expected_bonus,
                          f"{expected_bonus}×Tier", f"{actual_bonus}×Tier")
        else:
            verifier.failed.append(f"[FAIL] Limit '{limit_name}' not found in LIMITS")


def verify_limit_activation(verifier: RuleVerifier):
    """Verify limit activation conditions are implemented"""
    print("\n[VERIFYING] Limit Activation Logic...")

    # Read combat.py to check which limits are implemented
    import os
    combat_file = os.path.join(os.path.dirname(__file__), 'src', 'combat.py')
    with open(combat_file, 'r') as f:
        combat_code = f.read()

    # Check for each limit's activation check
    limits_to_check = [
        ('near_death', 'near_death'),
        ('bloodied', 'bloodied'),
        ('timid', 'timid'),
        ('attrition', 'attrition'),
        ('charges_1', 'charges_1'),
        ('charges_2', 'charges_2'),
        ('slaughter', 'slaughter'),
        ('relentless', 'relentless'),
        ('combo_move', 'combo_move'),
        ('infected', 'infected'),  # This one is likely missing
        ('revenge', 'revenge'),
        ('vengeful', 'vengeful'),
        ('untouchable', 'untouchable'),
        ('unbreakable', 'unbreakable'),
        ('passive', 'passive'),
        ('careful', 'careful'),
        ('quickdraw', 'quickdraw'),
        ('patient', 'patient'),
        ('finale', 'finale'),
        ('charge_up', 'charge_up'),
        ('charge_up_2', 'charge_up_2'),
        ('cooldown', 'cooldown'),
        ('unreliable_1', 'unreliable_1'),
        ('unreliable_2', 'unreliable_2'),
        ('unreliable_3', 'unreliable_3'),
    ]

    for limit_display, limit_search in limits_to_check:
        # Check if limit is mentioned in combat.py
        if f"'{limit_search}'" in combat_code or f'"{limit_search}"' in combat_code:
            verifier.check(f"Limit '{limit_display}' activation implemented", True, "implemented", "implemented")
        else:
            verifier.failed.append(f"[FAIL] Limit '{limit_display}' activation NOT IMPLEMENTED in combat.py")


def verify_finale_turn_number(verifier: RuleVerifier):
    """Verify finale limit requires Turn 8+ (not Turn 7+)"""
    print("\n[VERIFYING] Finale Turn Number...")

    import os
    combat_file = os.path.join(os.path.dirname(__file__), 'src', 'combat.py')
    with open(combat_file, 'r') as f:
        combat_lines = f.readlines()

    # Find the finale check
    for i, line in enumerate(combat_lines):
        if 'finale' in line.lower() and 'turn_number' in line:
            # Check the condition
            if 'turn_number < 8' in line:
                verifier.check("Finale requires Turn 8+", True, "Turn 8+", "Turn 8+ (code checks < 8)")
            elif 'turn_number < 7' in line:
                verifier.failed.append(f"[FAIL] Finale turn check: RULES.md says 'Turn 8+' but code line {i+1} checks 'turn_number < 7'")
            break


def verify_mutual_exclusions(verifier: RuleVerifier):
    """Verify mutual exclusion groups match RULES.md"""
    print("\n[VERIFYING] Mutual Exclusions...")

    # Expected exclusion groups from RULES.md
    expected_groups = [
        # Critical Effect Upgrades
        {'double_tap', 'powerful_critical', 'explosive_critical', 'ricochet'},
        # Unreliable Limits
        {'unreliable_1', 'unreliable_2', 'unreliable_3'},
        # Turn-Based Limits
        {'quickdraw', 'patient', 'finale', 'cooldown'},
        # Charge Limits
        {'charge_up', 'charge_up_2'},
        {'charges_1', 'charges_2'},
        # Slayer Exclusions (all slayers mutually exclusive)
        {'minion_slayer_acc', 'minion_slayer_dmg', 'captain_slayer_acc', 'captain_slayer_dmg',
         'elite_slayer_acc', 'elite_slayer_dmg', 'boss_slayer_acc', 'boss_slayer_dmg'},
        # HP-Based Limits
        {'near_death', 'bloodied', 'timid'},
        # Offensive Turn Tracking
        {'slaughter', 'relentless', 'combo_move'},
        # Defensive Turn Tracking
        {'revenge', 'vengeful', 'untouchable', 'unbreakable', 'passive', 'careful'},
    ]

    # Convert actual exclusions to sets for comparison
    actual_groups = [set(group) for group in MUTUAL_EXCLUSIONS]

    for expected_group in expected_groups:
        found = False
        for actual_group in actual_groups:
            if expected_group == actual_group:
                found = True
                break

        if found:
            group_names = ', '.join(sorted(expected_group))
            verifier.check(f"Mutual exclusion group [{group_names[:50]}...]", True, "present", "present")
        else:
            verifier.failed.append(f"[FAIL] Mutual exclusion group {expected_group} not found in MUTUAL_EXCLUSIONS")


def verify_aoe_restrictions(verifier: RuleVerifier):
    """Verify AOE restrictions match RULES.md"""
    print("\n[VERIFYING] AOE Restrictions...")

    # Expected AOE restrictions from RULES.md
    expected_restricted = {
        'finishing_blow_1', 'finishing_blow_2', 'finishing_blow_3',
        'culling_strike', 'critical_accuracy', 'powerful_critical', 'double_tap',
        'explosive_critical', 'ricochet', 'splinter',
        'quick_strikes', 'barrage', 'extra_attack'
    }

    actual_restricted = set(AOE_RESTRICTIONS)

    # Check if all expected restrictions are present
    for upgrade in expected_restricted:
        verifier.check(f"AOE restriction for '{upgrade}'",
                      upgrade in actual_restricted,
                      "restricted", "restricted" if upgrade in actual_restricted else "NOT restricted")

    # Check for unexpected restrictions
    unexpected = actual_restricted - expected_restricted
    if unexpected:
        verifier.warn(f"Unexpected AOE restrictions found: {unexpected}")


def verify_aoe_cost_multiplier(verifier: RuleVerifier):
    """Verify AOE attacks pay 2× for upgrades and limits"""
    print("\n[VERIFYING] AOE Cost Multiplier...")

    # Create test builds
    test_upgrade = 'power_attack'  # 1 point upgrade
    test_limit = 'cooldown'  # 1 point limit

    # Non-AOE build
    regular_build = AttackBuild('ranged', [test_upgrade], [test_limit])
    regular_cost = regular_build.total_cost

    # AOE build
    aoe_build = AttackBuild('area', [test_upgrade], [test_limit])
    aoe_cost = aoe_build.total_cost

    # AOE should cost exactly 2× more for upgrades and limits
    expected_aoe_cost = 0 + (1 * 2) + (1 * 2)  # 0 (attack type) + 2 (upgrade) + 2 (limit) = 4
    expected_regular_cost = 0 + 1 + 1  # 0 + 1 + 1 = 2

    verifier.check("Regular build cost",
                  regular_cost == expected_regular_cost,
                  str(expected_regular_cost), str(regular_cost))
    verifier.check("AOE build cost (2× multiplier)",
                  aoe_cost == expected_aoe_cost,
                  str(expected_aoe_cost), str(aoe_cost))


def main():
    verifier = RuleVerifier()

    print("="*80)
    print("STARTING GAME RULES VERIFICATION")
    print("="*80)

    # Run all verification phases
    verify_attack_types(verifier)
    verify_upgrade_costs(verifier)
    verify_limit_costs(verifier)
    verify_limit_bonuses(verifier)
    verify_limit_activation(verifier)
    verify_finale_turn_number(verifier)
    verify_mutual_exclusions(verifier)
    verify_aoe_restrictions(verifier)
    verify_aoe_cost_multiplier(verifier)

    # Print final report
    verifier.print_report()

    # Return exit code based on failures
    return 1 if verifier.failed else 0


if __name__ == "__main__":
    sys.exit(main())
