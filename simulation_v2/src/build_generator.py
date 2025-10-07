"""
Build generation and validation for the Vitality System.
"""

import itertools
from typing import List, Generator
from src.models import AttackBuild
from src.game_data import UPGRADES, LIMITS, RuleValidator, MUTUAL_EXCLUSIONS


class BuildGenerator:
    """Systematic build generation with rule compliance"""

    def __init__(self, max_points: int = 60):
        self.max_points = max_points

    def generate_all_valid_builds(self, attack_types: List[str] = None) -> List[AttackBuild]:
        """Generate all valid build combinations within point budget"""
        return list(self.generate_builds_chunked(attack_types))

    def generate_builds_chunked(self, attack_types: List[str] = None, chunk_size: int = None) -> Generator[AttackBuild, None, None]:
        """Generate valid builds as a chunked generator to reduce memory usage"""
        if attack_types is None:
            attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

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
                            yield build

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


def generate_valid_builds_chunked(max_points: int = 60, attack_types: List[str] = None, chunk_size: int = 1000) -> Generator[AttackBuild, None, None]:
    """Generate all valid build combinations as a chunked generator for memory efficiency"""
    generator = BuildGenerator(max_points)
    return generator.generate_builds_chunked(attack_types, chunk_size)


def generate_single_upgrade_builds(max_points: int = 60, attack_types: List[str] = None) -> List[AttackBuild]:
    """Generate builds with exactly one upgrade for testing individual upgrade effectiveness"""
    valid_builds = []
    if attack_types is None:
        attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

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
        attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

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
        attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    for attack_type in attack_types:
        for limit_name in LIMITS.keys():
            build = AttackBuild(attack_type, [], [limit_name])
            if build.is_valid(max_points):
                valid_builds.append(build)

    return valid_builds


def generate_archetype_builds_chunked(archetype: str, tier: int, attack_types: List[str] = None, chunk_size: int = 1000, max_points_per_attack: int = None, config=None) -> Generator:
    """
    Generate builds for a specific archetype as a chunked generator

    Args:
        archetype: "focused", "dual_natured", or "versatile_master"
        tier: Character tier (determines points per attack)
        attack_types: List of attack types to consider
        chunk_size: Size of chunks for memory efficiency
        max_points_per_attack: Override max points calculation (if None, calculated from tier+archetype)
        config: Optional SimConfigV2 config object for pruning

    Yields:
        For focused: AttackBuild objects
        For dual_natured/versatile_master: MultiAttackBuild objects
    """
    from src.models import MultiAttackBuild

    # Calculate max points per attack if not provided
    if max_points_per_attack is None:
        tier_archetype_levels = {
            3: {"focused": 6, "dual_natured": 4, "versatile_master": 2},
            4: {"focused": 8, "dual_natured": 6, "versatile_master": 4},
            5: {"focused": 10, "dual_natured": 8, "versatile_master": 6},
        }
        max_points_per_attack = tier_archetype_levels.get(tier, {}).get(archetype, 2)

    if archetype == "focused":
        # For focused archetype, just generate single builds
        yield from generate_valid_builds_chunked(max_points_per_attack, attack_types, chunk_size)

    elif archetype == "dual_natured":
        # Generate all pairs of builds
        yield from _generate_dual_natured_builds(max_points_per_attack, attack_types)

    elif archetype == "versatile_master":
        # Generate all sets of 5 builds (with optional pruning)
        yield from _generate_versatile_master_builds(max_points_per_attack, attack_types, config)


def _prune_builds_by_performance(
    builds: List[AttackBuild],
    attacker_stats: List[int],
    defender_stats: List[int],
    scenarios,
    simulation_runs: int,
    top_percent: float
) -> List[AttackBuild]:
    """
    Test builds quickly and return only top performers.

    Args:
        builds: List of AttackBuild objects to test
        attacker_stats: Attacker character stats [focus, power, mobility, endurance, tier]
        defender_stats: Defender character stats
        scenarios: List of ScenarioConfig objects to test against
        simulation_runs: Number of simulation runs per scenario
        top_percent: Fraction of builds to keep (0.05 = top 5%)

    Returns:
        List of top performing builds sorted by avg_turns (ascending)
    """
    from src.models import Character
    from src.simulation import run_simulation_batch

    attacker = Character(*attacker_stats)
    defender = Character(*defender_stats)

    print(f"  Pruning {len(builds)} builds (keeping top {top_percent*100:.1f}%)...")
    print(f"    Quick testing with {simulation_runs} runs per scenario across {len(scenarios)} scenarios")

    # Test each build
    results = []
    for i, build in enumerate(builds):
        if (i + 1) % 100 == 0:
            print(f"    Progress: {i + 1}/{len(builds)} builds tested")

        # Run simulation against all scenarios and average the results
        scenario_turns = []
        for scenario in scenarios:
            if scenario.enemy_hp_list:
                _, avg_turns, _, _ = run_simulation_batch(
                    attacker, build, simulation_runs, 100, defender,
                    enemy_hp_list=scenario.enemy_hp_list
                )
            else:
                _, avg_turns, _, _ = run_simulation_batch(
                    attacker, build, simulation_runs, 100, defender,
                    num_enemies=scenario.num_enemies,
                    enemy_hp=scenario.enemy_hp
                )
            scenario_turns.append(avg_turns)

        # Average performance across all scenarios
        overall_avg_turns = sum(scenario_turns) / len(scenario_turns)
        results.append((build, overall_avg_turns))

    # Sort by avg_turns (lower is better)
    results.sort(key=lambda x: x[1])

    # Keep top N%
    keep_count = max(1, int(len(results) * top_percent))
    pruned_builds = [build for build, _ in results[:keep_count]]

    print(f"    Pruned to {len(pruned_builds)} builds (from {len(builds)})")
    print(f"    Best: {results[0][1]:.2f} turns, Worst kept: {results[keep_count-1][1]:.2f} turns")

    return pruned_builds


def _apply_stratified_sampling(builds: List[AttackBuild], top_n_per_type: int) -> List[AttackBuild]:
    """
    Apply stratified sampling to ensure diversity across attack types and upgrade combinations.

    Groups builds by attack_type, then ensures diverse upgrade/limit combinations
    within each attack type by selecting the best performer for each unique
    enhancement pattern.

    Args:
        builds: List of AttackBuild objects (assumed to be pre-sorted by performance)
        top_n_per_type: Maximum number of builds to keep per attack type

    Returns:
        Curated list with diverse attack type and upgrade representation
    """
    from collections import defaultdict

    # Group builds by attack type
    builds_by_type = defaultdict(list)
    for build in builds:
        builds_by_type[build.attack_type].append(build)

    # Take top N from each group, ensuring upgrade/limit diversity
    curated = []
    for attack_type, type_builds in builds_by_type.items():
        # Group by upgrade/limit signature within this attack type
        signature_to_builds = defaultdict(list)
        for build in type_builds:
            # Create signature from upgrades and limits
            upgrade_sig = tuple(sorted(build.upgrades))
            limit_sig = tuple(sorted(build.limits))
            signature = (upgrade_sig, limit_sig)
            signature_to_builds[signature].append(build)

        # Take the best build from each signature group
        diverse_builds = []
        for signature, sig_builds in signature_to_builds.items():
            # First build in group is best (builds pre-sorted by performance)
            diverse_builds.append(sig_builds[0])

        # Take top N diverse builds (or all if fewer than N)
        selected = diverse_builds[:min(top_n_per_type, len(diverse_builds))]
        curated.extend(selected)

        print(f"    {attack_type}: {len(selected)} builds with {len(selected)} unique patterns "
              f"(from {len(type_builds)} total, {len(signature_to_builds)} unique patterns)")

    return curated


def _generate_dual_natured_builds(max_points_per_attack: int, attack_types: List[str] = None) -> Generator:
    """Generate dual-natured builds with fixed first attack (ranged only)

    For performance optimization, the first attack is standardized and only the second attack varies.
    """
    from src.models import MultiAttackBuild, AttackBuild

    if attack_types is None:
        attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    # Fixed first attack: ranged with no upgrades
    fixed_attack = AttackBuild('melee_dg', [], [])

    # Generate all valid builds for the second attack slot
    for build2 in generate_valid_builds_chunked(max_points_per_attack, attack_types, chunk_size=10000):
        # Create multi-attack build with fixed first attack and generated second attack
        multi_build = MultiAttackBuild([fixed_attack, build2], "dual_natured")
        yield multi_build


def _generate_versatile_master_builds(max_points_per_attack: int, attack_types: List[str] = None, config=None) -> Generator:
    """Generate all valid sets of 3 builds for versatile master archetype

    Args:
        max_points_per_attack: Maximum points per attack
        attack_types: List of attack types to consider
        config: Optional SimConfigV2 config object for pruning
    """
    from src.models import MultiAttackBuild

    if attack_types is None:
        attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    # Generate all valid single builds first
    all_builds = list(generate_valid_builds_chunked(max_points_per_attack, attack_types, chunk_size=10000))

    print(f"  Generated {len(all_builds)} single builds for versatile_master")

    # Apply pruning if enabled
    if config and hasattr(config, 'pruning') and config.pruning.enabled:
        print(f"  Pruning enabled - reducing build set before combination generation")
        all_builds = _prune_builds_by_performance(
            builds=all_builds,
            attacker_stats=config.attacker_stats,
            defender_stats=config.defender_stats,
            scenarios=config.scenarios,
            simulation_runs=config.pruning.simulation_runs,
            top_percent=config.pruning.top_percent
        )

    # Apply stratified sampling for diversity
    curated_builds = _apply_stratified_sampling(all_builds, top_n_per_type=50)
    print(f"  After diversity-aware curation: {len(curated_builds)} builds (from {len(all_builds)})")

    # Calculate expected number of combinations
    import itertools
    n = len(curated_builds)
    expected_combos = (n + 2) * (n + 1) * n // 6  # Formula for C(n+2, 3)
    print(f"  Generating combinations of 3 from {n} builds...")
    print(f"  Expected total combinations: {expected_combos:,}")

    combo_count = 0
    progress_interval = 50000
    for build_combo in itertools.combinations_with_replacement(curated_builds, 3):
        multi_build = MultiAttackBuild(list(build_combo), "versatile_master")
        combo_count += 1

        if combo_count % progress_interval == 0:
            progress_pct = (combo_count / expected_combos) * 100
            print(f"    Progress: {combo_count:,}/{expected_combos:,} ({progress_pct:.1f}%)")

        yield multi_build

    print(f"  Generated {combo_count:,} versatile_master combinations")
