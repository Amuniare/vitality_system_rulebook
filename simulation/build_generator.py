"""
Build generation and validation for the Vitality System.
"""

import itertools
from typing import List
from models import AttackBuild
from game_data import UPGRADES, LIMITS, RuleValidator, MUTUAL_EXCLUSIONS


class BuildGenerator:
    """Systematic build generation with rule compliance"""

    def __init__(self, max_points: int = 60):
        self.max_points = max_points

    def generate_all_valid_builds(self, attack_types: List[str] = None) -> List[AttackBuild]:
        """Generate all valid build combinations within point budget"""
        valid_builds = []
        if attack_types is None:
            attack_types = ['melee', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

        # Generate builds for each attack type
        for attack_type in attack_types:
            # Generate upgrade combinations of varying sizes (0 to 3 upgrades)
            for max_upgrade_count in range(0, 4):  # 0, 1, 2, 3 upgrades
                upgrade_combinations = self._generate_upgrade_combinations(
                    attack_type, max_upgrade_count
                )

                for upgrades in upgrade_combinations:
                    # Generate all valid limit combinations for this upgrade set
                    limit_combinations = self._generate_limit_combinations(upgrades)

                    for limits in limit_combinations:
                        build = AttackBuild(attack_type, upgrades, limits)
                        if build.is_valid(self.max_points):
                            valid_builds.append(build)

        return valid_builds

    def _generate_upgrade_combinations(self, attack_type: str, max_count: int) -> List[List[str]]:
        """Generate all valid upgrade combinations for given attack type"""
        available_upgrades = list(UPGRADES.keys())
        combinations = []

        # Generate combinations of specified size or smaller
        for r in range(0, max_count + 1):
            for combo in itertools.combinations(available_upgrades, r):
                upgrades = list(combo)

                # Check if this combination is valid according to rules
                is_valid, errors = RuleValidator.validate_combination(attack_type, upgrades)
                if is_valid:
                    # Quick cost check to avoid expensive builds early
                    total_cost = sum(UPGRADES[u].cost for u in upgrades)
                    if total_cost <= self.max_points:
                        combinations.append(upgrades)

        return combinations

    def _generate_limit_combinations(self, upgrades: List[str]) -> List[List[str]]:
        """Generate all valid limit combinations that fit within budget"""
        # Calculate remaining points after upgrades
        upgrade_cost = sum(UPGRADES[u].cost for u in upgrades)
        remaining_points = self.max_points - upgrade_cost

        if remaining_points < 0:
            return [[]]  # No limits possible

        limit_combinations = [[]]  # Always include no limits option

        # Generate single limit combinations
        for limit_name, limit in LIMITS.items():
            if limit.cost <= remaining_points:
                limit_combinations.append([limit_name])

        # Generate two-limit combinations (with mutual exclusion rules)
        limit_names = list(LIMITS.keys())
        for limit1, limit2 in itertools.combinations(limit_names, 2):
            # Skip mutually exclusive limits
            if self._are_limits_mutually_exclusive(limit1, limit2):
                continue

            cost1, cost2 = LIMITS[limit1].cost, LIMITS[limit2].cost
            if cost1 + cost2 <= remaining_points:
                limit_combinations.append([limit1, limit2])

        return limit_combinations

    def _are_limits_mutually_exclusive(self, limit1: str, limit2: str) -> bool:
        """Check if two limits are mutually exclusive"""
        # Check if they're in the same mutual exclusion group
        for exclusion_group in MUTUAL_EXCLUSIONS:
            if limit1 in exclusion_group and limit2 in exclusion_group:
                return True
        return False


def generate_valid_builds(max_points: int = 60, attack_types: List[str] = None) -> List[AttackBuild]:
    """Generate all valid build combinations within point limit"""
    generator = BuildGenerator(max_points)
    return generator.generate_all_valid_builds(attack_types)


def generate_single_upgrade_builds(max_points: int = 60, attack_types: List[str] = None) -> List[AttackBuild]:
    """Generate builds with exactly one upgrade for testing individual upgrade effectiveness"""
    valid_builds = []
    if attack_types is None:
        attack_types = ['melee', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    for attack_type in attack_types:
        for upgrade_name in UPGRADES.keys():
            # Check if upgrade is compatible with attack type
            is_valid, _ = RuleValidator.validate_combination(attack_type, [upgrade_name])
            if is_valid:
                build = AttackBuild(attack_type, [upgrade_name], [])
                if build.is_valid(max_points):
                    valid_builds.append(build)

    return valid_builds


def generate_slayer_builds(max_points: int = 60, attack_types: List[str] = None) -> List[AttackBuild]:
    """Generate builds focused on slayer upgrades for analysis"""
    valid_builds = []
    if attack_types is None:
        attack_types = ['melee', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    slayer_upgrades = [u for u in UPGRADES.keys() if 'slayer' in u]

    for attack_type in attack_types:
        for slayer_upgrade in slayer_upgrades:
            # Check if slayer upgrade is compatible with attack type
            is_valid, _ = RuleValidator.validate_combination(attack_type, [slayer_upgrade])
            if is_valid:
                build = AttackBuild(attack_type, [slayer_upgrade], [])
                if build.is_valid(max_points):
                    valid_builds.append(build)

    return valid_builds


def generate_limit_builds(max_points: int = 60, attack_types: List[str] = None) -> List[AttackBuild]:
    """Generate builds with different limit combinations for analysis"""
    valid_builds = []
    if attack_types is None:
        attack_types = ['melee', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    for attack_type in attack_types:
        for limit_name in LIMITS.keys():
            build = AttackBuild(attack_type, [], [limit_name])
            if build.is_valid(max_points):
                valid_builds.append(build)

    return valid_builds