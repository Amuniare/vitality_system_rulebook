"""
Report generators for the Vitality System combat simulator.

This module contains functions that generate report data and analysis.
"""

import statistics
from typing import Dict, List, Tuple
from src.models import Character, AttackBuild, SimulationConfig
from src.simulation import run_simulation_batch
from src.game_data import UPGRADES, LIMITS, RuleValidator
from src.reporting.individual import IndividualReportGenerator
from src.reporting.builds import BuildReportGenerator


def generate_combo_performance_report(config: SimulationConfig) -> Dict:
    """Generate performance analysis for specific two-upgrade combinations"""
    print(f"\nGenerating combo performance analysis...")

    # Define specific upgrade combos to test
    combo_definitions = [
        ("Critical Accuracy + Reliable Accuracy", ["critical_accuracy", "reliable_accuracy"]),
        ("Critical Accuracy + Powerful Critical", ["critical_accuracy", "powerful_critical"]),
        ("Critical Accuracy + Double Tap", ["critical_accuracy", "double_tap"])
    ]

    # Create test cases from config
    test_cases = []
    for i, att_config in enumerate(config.attacker_configs):
        for j, def_config in enumerate(config.defender_configs):
            attacker = Character(*att_config)
            defender = Character(*def_config)
            case_name = f"Att{i+1}_Def{j+1}"
            test_cases.append((case_name, attacker, defender))

    combo_results = {}

    # Determine which attack types to test
    attack_types = config.attack_types_filter if config.attack_types_filter else ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    # Test each combo
    for combo_name, combo_upgrades in combo_definitions:
        print(f"  Testing {combo_name}...")

        # Check total cost
        combo_cost = sum(UPGRADES[upgrade].cost for upgrade in combo_upgrades)
        if combo_cost > config.max_points_per_attack("focused"):
            continue

        combo_data = {
            'name': combo_name,
            'upgrades': combo_upgrades,
            'cost': combo_cost,
            'attack_type_results': {},
            'overall_avg_dpt': 0,
            'overall_avg_improvement': 0,
            'cost_effectiveness': 0
        }

        attack_type_results = []

        # Test combo with each attack type it's compatible with
        for attack_type in attack_types:
            # Check compatibility
            is_valid, errors = RuleValidator.validate_combination(attack_type, combo_upgrades)
            if not is_valid:
                continue

            if combo_cost > config.max_points_per_attack("focused"):
                continue

            # Test base attack vs combo attack for each test case
            case_results = []
            for case_name, attacker, defender in test_cases:
                # Base attack performance
                base_build = AttackBuild(attack_type, [], [])
                combo_build = AttackBuild(attack_type, combo_upgrades, [])

                # Run simulations for base build across all scenarios
                base_total_dpt = 0
                scenario_count = 0
                fight_scenarios = [
                    (1, 100),  # 1×100 HP Boss
                    (2, 50),   # 2×50 HP Enemies
                    (4, 25),   # 4×25 HP Enemies
                    (10, 10)   # 10×10 HP Enemies
                ]

                for num_enemies, enemy_hp in fight_scenarios:
                    base_results, base_avg_turns, base_dpt = run_simulation_batch(
                        attacker, base_build, config.individual_testing_runs, config.target_hp, defender,
                        num_enemies=num_enemies, enemy_hp=enemy_hp)
                    base_total_dpt += base_dpt
                    scenario_count += 1

                base_avg_dpt = base_total_dpt / scenario_count

                # Run simulations for combo build across all scenarios
                combo_total_dpt = 0
                scenario_count = 0

                for num_enemies, enemy_hp in fight_scenarios:
                    combo_results_batch, combo_avg_turns, combo_dpt = run_simulation_batch(
                        attacker, combo_build, config.individual_testing_runs, config.target_hp, defender,
                        num_enemies=num_enemies, enemy_hp=enemy_hp)
                    combo_total_dpt += combo_dpt
                    scenario_count += 1

                combo_avg_dpt = combo_total_dpt / scenario_count

                # Calculate improvement
                dpt_improvement = combo_avg_dpt - base_avg_dpt
                percent_improvement = (dpt_improvement / base_avg_dpt * 100) if base_avg_dpt > 0 else 0

                case_results.append({
                    'case': case_name,
                    'base_dpt': base_avg_dpt,
                    'combo_dpt': combo_avg_dpt,
                    'improvement': dpt_improvement,
                    'percent_improvement': percent_improvement
                })

            # Calculate average for this attack type
            if case_results:
                avg_base_dpt = sum(r['base_dpt'] for r in case_results) / len(case_results)
                avg_combo_dpt = sum(r['combo_dpt'] for r in case_results) / len(case_results)
                avg_improvement = sum(r['improvement'] for r in case_results) / len(case_results)
                avg_percent_improvement = sum(r['percent_improvement'] for r in case_results) / len(case_results)

                combo_data['attack_type_results'][attack_type] = {
                    'avg_base_dpt': avg_base_dpt,
                    'avg_combo_dpt': avg_combo_dpt,
                    'avg_improvement': avg_improvement,
                    'avg_percent_improvement': avg_percent_improvement,
                    'case_results': case_results
                }

                attack_type_results.append({
                    'attack_type': attack_type,
                    'avg_combo_dpt': avg_combo_dpt,
                    'avg_improvement': avg_improvement,
                    'avg_percent_improvement': avg_percent_improvement
                })

        # Calculate overall averages
        if attack_type_results:
            combo_data['overall_avg_dpt'] = sum(r['avg_combo_dpt'] for r in attack_type_results) / len(attack_type_results)
            combo_data['overall_avg_improvement'] = sum(r['avg_improvement'] for r in attack_type_results) / len(attack_type_results)
            combo_data['cost_effectiveness'] = combo_data['overall_avg_improvement'] / combo_data['cost'] if combo_data['cost'] > 0 else 0

            combo_results[combo_name] = combo_data

    return combo_results



def generate_upgrade_performance_report(config: SimulationConfig) -> Dict:
    """Generate comprehensive individual enhancement (upgrade and limit) performance analysis"""
    print(f"\nGenerating enhancement performance analysis...")

    # Create test cases from config
    test_cases = []
    for i, att_config in enumerate(config.attacker_configs):
        for j, def_config in enumerate(config.defender_configs):
            attacker = Character(*att_config)
            defender = Character(*def_config)
            case_name = f"Att{i+1}_Def{j+1}"
            test_cases.append((case_name, attacker, defender))

    enhancement_results = {}

    # Determine which attack types to test
    attack_types = config.attack_types_filter if config.attack_types_filter else ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    # Test each upgrade individually
    for upgrade_name in UPGRADES.keys():
        if config.upgrades_filter and upgrade_name not in config.upgrades_filter:
            continue

        print(f"  Testing {upgrade_name}...")
        # Build upgrade list with prerequisites
        from src.game_data import PREREQUISITES
        upgrades_to_test = [upgrade_name]

        # Add prerequisites if they exist
        if upgrade_name in PREREQUISITES:
            upgrades_to_test = PREREQUISITES[upgrade_name] + [upgrade_name]

        # Calculate total cost including prerequisites
        total_cost = sum(UPGRADES[upgrade].cost for upgrade in upgrades_to_test)

        upgrade_data = {
            'name': upgrade_name,
            'type': 'upgrade',
            'cost': total_cost,  # Use total cost including prerequisites
            'attack_type_results': {},
            'overall_avg_dpt': 0,
            'overall_avg_improvement': 0,
            'cost_effectiveness': 0
        }

        attack_type_results = []

        # Test upgrade with each attack type it's compatible with
        for attack_type in attack_types:
            # Check compatibility with full upgrade list
            is_valid, errors = RuleValidator.validate_combination(attack_type, upgrades_to_test)
            if not is_valid:
                continue

            # Check if total cost is within budget
            if total_cost > config.max_points_per_attack("focused"):
                continue

            # Test base attack vs upgrade attack for each test case
            case_results = []
            for case_name, attacker, defender in test_cases:
                # Base attack performance
                base_build = AttackBuild(attack_type, [], [])
                upgrade_build = AttackBuild(attack_type, upgrades_to_test, [])

                # Run simulations for base build across all scenarios
                base_total_dpt = 0
                scenario_count = 0
                fight_scenarios = [
                    (1, 100),  # 1×100 HP Boss
                    (2, 50),   # 2×50 HP Enemies
                    (4, 25),   # 4×25 HP Enemies
                    (10, 10)   # 10×10 HP Enemies
                ]

                for num_enemies, enemy_hp in fight_scenarios:
                    base_results, base_avg_turns, base_dpt = run_simulation_batch(
                        attacker, base_build, config.individual_testing_runs, config.target_hp, defender,
                        num_enemies=num_enemies, enemy_hp=enemy_hp)
                    base_total_dpt += base_dpt
                    scenario_count += 1

                base_avg_dpt = base_total_dpt / scenario_count

                # Run simulations for upgrade build across all scenarios
                upgrade_total_dpt = 0
                scenario_count = 0

                for num_enemies, enemy_hp in fight_scenarios:
                    upgrade_results_batch, upgrade_avg_turns, upgrade_dpt = run_simulation_batch(
                        attacker, upgrade_build, config.individual_testing_runs, config.target_hp, defender,
                        num_enemies=num_enemies, enemy_hp=enemy_hp)
                    upgrade_total_dpt += upgrade_dpt
                    scenario_count += 1

                upgrade_avg_dpt = upgrade_total_dpt / scenario_count

                # Calculate improvement
                dpt_improvement = upgrade_avg_dpt - base_avg_dpt
                percent_improvement = (dpt_improvement / base_avg_dpt * 100) if base_avg_dpt > 0 else 0

                case_results.append({
                    'case': case_name,
                    'base_dpt': base_avg_dpt,
                    'upgrade_dpt': upgrade_avg_dpt,
                    'improvement': dpt_improvement,
                    'percent_improvement': percent_improvement
                })

            # Calculate average for this attack type
            if case_results:
                avg_base_dpt = sum(r['base_dpt'] for r in case_results) / len(case_results)
                avg_upgrade_dpt = sum(r['upgrade_dpt'] for r in case_results) / len(case_results)
                avg_improvement = sum(r['improvement'] for r in case_results) / len(case_results)
                avg_percent_improvement = sum(r['percent_improvement'] for r in case_results) / len(case_results)

                upgrade_data['attack_type_results'][attack_type] = {
                    'avg_base_dpt': avg_base_dpt,
                    'avg_upgrade_dpt': avg_upgrade_dpt,
                    'avg_improvement': avg_improvement,
                    'avg_percent_improvement': avg_percent_improvement,
                    'case_results': case_results
                }

                attack_type_results.append({
                    'attack_type': attack_type,
                    'avg_upgrade_dpt': avg_upgrade_dpt,
                    'avg_improvement': avg_improvement,
                    'avg_percent_improvement': avg_percent_improvement
                })

        # Calculate overall averages
        if attack_type_results:
            upgrade_data['overall_avg_dpt'] = sum(r['avg_upgrade_dpt'] for r in attack_type_results) / len(attack_type_results)
            upgrade_data['overall_avg_improvement'] = sum(r['avg_improvement'] for r in attack_type_results) / len(attack_type_results)
            upgrade_data['cost_effectiveness'] = upgrade_data['overall_avg_improvement'] / upgrade_data['cost'] if upgrade_data['cost'] > 0 else 0

            enhancement_results[upgrade_name] = upgrade_data

    # Test each limit individually
    for limit_name in LIMITS.keys():
        if config.limits_filter and limit_name not in config.limits_filter:
            continue

        print(f"  Testing {limit_name}...")
        limit_data = {
            'name': limit_name,
            'type': 'limit',
            'cost': LIMITS[limit_name].cost,
            'attack_type_results': {},
            'overall_avg_dpt': 0,
            'overall_avg_improvement': 0,
            'cost_effectiveness': 0
        }

        attack_type_results = []

        # Test limit with each attack type
        for attack_type in attack_types:
            # All limits are compatible with all attack types
            limit_cost = LIMITS[limit_name].cost
            if limit_cost > config.max_points_per_attack("focused"):
                continue

            # Test base attack vs limit attack for each test case
            case_results = []
            for case_name, attacker, defender in test_cases:
                # Base attack performance
                base_build = AttackBuild(attack_type, [], [])
                limit_build = AttackBuild(attack_type, [], [limit_name])

                # Run simulations for base build across all scenarios
                base_total_dpt = 0
                scenario_count = 0
                fight_scenarios = [
                    (1, 100),  # 1×100 HP Boss
                    (2, 50),   # 2×50 HP Enemies
                    (4, 25),   # 4×25 HP Enemies
                    (10, 10)   # 10×10 HP Enemies
                ]

                for num_enemies, enemy_hp in fight_scenarios:
                    base_results_batch, base_avg_turns, base_dpt = run_simulation_batch(
                        attacker, base_build, config.individual_testing_runs, config.target_hp, defender,
                        num_enemies=num_enemies, enemy_hp=enemy_hp)
                    base_total_dpt += base_dpt
                    scenario_count += 1

                base_avg_dpt = base_total_dpt / scenario_count

                # Run simulations for limit build across all scenarios
                limit_total_dpt = 0
                scenario_count = 0

                for num_enemies, enemy_hp in fight_scenarios:
                    limit_results_batch, limit_avg_turns, limit_dpt = run_simulation_batch(
                        attacker, limit_build, config.individual_testing_runs, config.target_hp, defender,
                        num_enemies=num_enemies, enemy_hp=enemy_hp)
                    limit_total_dpt += limit_dpt
                    scenario_count += 1

                limit_avg_dpt = limit_total_dpt / scenario_count

                # Calculate improvement
                dpt_improvement = limit_avg_dpt - base_avg_dpt
                percent_improvement = (dpt_improvement / base_avg_dpt * 100) if base_avg_dpt > 0 else 0

                case_results.append({
                    'case': case_name,
                    'base_dpt': base_avg_dpt,
                    'limit_dpt': limit_avg_dpt,
                    'improvement': dpt_improvement,
                    'percent_improvement': percent_improvement
                })

            # Calculate average for this attack type
            if case_results:
                avg_base_dpt = sum(r['base_dpt'] for r in case_results) / len(case_results)
                avg_limit_dpt = sum(r['limit_dpt'] for r in case_results) / len(case_results)
                avg_improvement = sum(r['improvement'] for r in case_results) / len(case_results)
                avg_percent_improvement = sum(r['percent_improvement'] for r in case_results) / len(case_results)

                limit_data['attack_type_results'][attack_type] = {
                    'avg_base_dpt': avg_base_dpt,
                    'avg_limit_dpt': avg_limit_dpt,
                    'avg_improvement': avg_improvement,
                    'avg_percent_improvement': avg_percent_improvement,
                    'case_results': case_results
                }

                attack_type_results.append({
                    'attack_type': attack_type,
                    'avg_limit_dpt': avg_limit_dpt,
                    'avg_improvement': avg_improvement,
                    'avg_percent_improvement': avg_percent_improvement
                })

        # Calculate overall averages
        if attack_type_results:
            limit_data['overall_avg_dpt'] = sum(r['avg_limit_dpt'] for r in attack_type_results) / len(attack_type_results)
            limit_data['overall_avg_improvement'] = sum(r['avg_improvement'] for r in attack_type_results) / len(attack_type_results)
            limit_data['cost_effectiveness'] = limit_data['overall_avg_improvement'] / limit_data['cost'] if limit_data['cost'] > 0 else 0

            enhancement_results[limit_name] = limit_data

    return enhancement_results



def generate_upgrade_ranking_report(all_build_results: List[Tuple], config: SimulationConfig, reports_dir: str = "reports"):
    """Generate enhancement ranking report based on average build rank positions with percentile rankings"""
    print("Generating enhancement ranking report...")

    # Define specific upgrade combos to track
    combo_definitions = [
        ("Critical Accuracy + Reliable Accuracy", ["critical_accuracy", "reliable_accuracy"]),
        ("Critical Accuracy + Powerful Critical", ["critical_accuracy", "powerful_critical"]),
        ("Critical Accuracy + Double Tap", ["critical_accuracy", "double_tap"])
    ]

    # Track enhancement appearances and their ranking positions
    enhancement_rankings = {}  # enhancement_name -> list of ranking positions
    enhancement_turns = {}     # enhancement_name -> list of avg_turns values
    enhancement_attack_types = {}  # enhancement_name -> {attack_type: [avg_turns]}
    attack_type_rankings = {}  # attack_type -> list of ranking positions
    combo_rankings = {}    # combo_name -> list of ranking positions

    # Process each build result to track enhancement positions
    for rank, (build, avg_turns) in enumerate(all_build_results, 1):
        # Track attack type rankings
        if build.attack_type not in attack_type_rankings:
            attack_type_rankings[build.attack_type] = []
        attack_type_rankings[build.attack_type].append(rank)

        # Track upgrade rankings (upgrades are enhancements)
        for upgrade in build.upgrades:
            if upgrade not in enhancement_rankings:
                enhancement_rankings[upgrade] = []
                enhancement_turns[upgrade] = []
                enhancement_attack_types[upgrade] = {}
            enhancement_rankings[upgrade].append(rank)
            enhancement_turns[upgrade].append(avg_turns)

            # Track turns by attack type for this enhancement
            if build.attack_type not in enhancement_attack_types[upgrade]:
                enhancement_attack_types[upgrade][build.attack_type] = []
            enhancement_attack_types[upgrade][build.attack_type].append(avg_turns)

        # Track limit rankings (limits are enhancements)
        for limit in build.limits:
            if limit not in enhancement_rankings:
                enhancement_rankings[limit] = []
                enhancement_turns[limit] = []
                enhancement_attack_types[limit] = {}
            enhancement_rankings[limit].append(rank)
            enhancement_turns[limit].append(avg_turns)

            # Track turns by attack type for this enhancement
            if build.attack_type not in enhancement_attack_types[limit]:
                enhancement_attack_types[limit][build.attack_type] = []
            enhancement_attack_types[limit][build.attack_type].append(avg_turns)

        # Track combo rankings - check if build contains any of our specific combos
        for combo_name, combo_upgrades in combo_definitions:
            if all(upgrade in build.upgrades for upgrade in combo_upgrades):
                if combo_name not in combo_rankings:
                    combo_rankings[combo_name] = []
                combo_rankings[combo_name].append(rank)

    total_builds = len(all_build_results)

    # Calculate statistics for enhancements (both upgrades and limits)
    enhancement_stats = []
    for enhancement_name, positions in enhancement_rankings.items():
        avg_position = sum(positions) / len(positions)
        median_position = statistics.median(positions)
        percentile = (median_position / total_builds) * 100

        # Calculate avg_turns statistics
        turns_data = enhancement_turns[enhancement_name]
        avg_turns = sum(turns_data) / len(turns_data)

        # Calculate top 10% and top 50% medians (based on rank positions)
        sorted_data = sorted(zip(positions, turns_data))  # Sort by rank
        top_10_count = max(1, len(sorted_data) // 10)
        top_50_count = max(1, len(sorted_data) // 2)

        top_10_turns = [turns for rank, turns in sorted_data[:top_10_count]]
        top_50_turns = [turns for rank, turns in sorted_data[:top_50_count]]

        median_top_10 = statistics.median(top_10_turns) if top_10_turns else 0
        median_top_50 = statistics.median(top_50_turns) if top_50_turns else 0

        # Calculate avg turns per attack type
        attack_type_turns = {}
        for attack_type in ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage']:
            if attack_type in enhancement_attack_types[enhancement_name]:
                attack_type_data = enhancement_attack_types[enhancement_name][attack_type]
                attack_type_turns[attack_type] = sum(attack_type_data) / len(attack_type_data)
            else:
                attack_type_turns[attack_type] = 0

        enhancement_stats.append({
            'name': enhancement_name,
            'avg_rank': avg_position,
            'median_rank': median_position,
            'percentile': percentile,
            'appearances': len(positions),
            'best_rank': min(positions),
            'worst_rank': max(positions),
            'avg_turns': avg_turns,
            'median_top_10': median_top_10,
            'median_top_50': median_top_50,
            'melee_ac_turns': attack_type_turns['melee_ac'],
            'melee_dg_turns': attack_type_turns['melee_dg'],
            'ranged_turns': attack_type_turns['ranged'],
            'area_turns': attack_type_turns['area'],
            'direct_damage_turns': attack_type_turns['direct_damage']
        })

    # Calculate statistics for attack types
    attack_type_stats = []
    for attack_type, positions in attack_type_rankings.items():
        avg_position = sum(positions) / len(positions)
        median_position = statistics.median(positions)
        percentile = (median_position / total_builds) * 100
        attack_type_stats.append({
            'name': attack_type,
            'avg_rank': avg_position,
            'median_rank': median_position,
            'percentile': percentile,
            'appearances': len(positions),
            'best_rank': min(positions),
            'worst_rank': max(positions)
        })

    # Calculate statistics for combos
    combo_stats = []
    for combo_name, positions in combo_rankings.items():
        avg_position = sum(positions) / len(positions)
        median_position = statistics.median(positions)
        percentile = (median_position / total_builds) * 100
        combo_stats.append({
            'name': combo_name,
            'avg_rank': avg_position,
            'median_rank': median_position,
            'percentile': percentile,
            'appearances': len(positions),
            'best_rank': min(positions),
            'worst_rank': max(positions)
        })

    # Sort by avg_turns (lower is better), then by median rank
    enhancement_stats.sort(key=lambda x: x['avg_turns'])
    attack_type_stats.sort(key=lambda x: x['median_rank'])
    combo_stats.sort(key=lambda x: x['median_rank'])

    # Write the report
    with open(f'{reports_dir}/enhancement_ranking_report.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - ENHANCEMENT & ATTACK TYPE RANKING REPORT\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows enhancement (upgrade & limit) and attack type performance ranked by average turns.\n")
        f.write("Lower avg turns indicate better performance. Includes top 10%/50% medians and per-attack-type data.\n")
        f.write(f"Total builds tested: {total_builds}\n\n")

        # Enhancement Rankings Section
        f.write("ENHANCEMENT RANKINGS BY AVERAGE TURNS\n")
        f.write("-" * 180 + "\n")
        f.write(f"{'Rank':<4} {'Enhancement':<20} {'Avg Turns':<10} {'Top10%':<8} {'Top50%':<8} {'Melee_AC':<9} {'Melee_DG':<9} {'Ranged':<8} {'Area':<8} {'Direct':<8} {'Uses':<6} {'Med Rank':<9}\n")
        f.write("-" * 180 + "\n")

        for i, stats in enumerate(enhancement_stats, 1):
            f.write(f"{i:<4} {stats['name']:<20} {stats['avg_turns']:>8.1f} "
                   f"{stats['median_top_10']:>6.1f} {stats['median_top_50']:>6.1f} "
                   f"{stats['melee_ac_turns']:>7.1f} {stats['melee_dg_turns']:>7.1f} "
                   f"{stats['ranged_turns']:>6.1f} {stats['area_turns']:>6.1f} "
                   f"{stats['direct_damage_turns']:>6.1f} {stats['appearances']:>4} "
                   f"{stats['median_rank']:>7.1f}\n")

        # Attack Type Rankings Section
        f.write(f"\n\nATTACK TYPE RANKINGS BY MEDIAN POSITION\n")
        f.write("-" * 95 + "\n")
        f.write(f"{'Rank':<4} {'Attack Type':<25} {'Avg Rank':<10} {'Med Rank':<10} {'Percentile':<12} {'Uses':<6} {'Best':<6} {'Worst':<6}\n")
        f.write("-" * 95 + "\n")

        for i, stats in enumerate(attack_type_stats, 1):
            f.write(f"{i:<4} {stats['name']:<25} {stats['avg_rank']:>8.1f} "
                   f"{stats['median_rank']:>8.1f} {stats['percentile']:>9.1f}% {stats['appearances']:>4} "
                   f"{stats['best_rank']:>4} {stats['worst_rank']:>5}\n")

        # Combo Rankings Section (if any combos found)
        if combo_stats:
            f.write(f"\n\nSPECIFIC UPGRADE COMBO RANKINGS BY MEDIAN POSITION\n")
            f.write("-" * 105 + "\n")
            f.write(f"{'Rank':<4} {'Upgrade Combo':<35} {'Avg Rank':<10} {'Med Rank':<10} {'Percentile':<12} {'Uses':<6} {'Best':<6} {'Worst':<6}\n")
            f.write("-" * 105 + "\n")

            for i, stats in enumerate(combo_stats, 1):
                f.write(f"{i:<4} {stats['name']:<35} {stats['avg_rank']:>8.1f} "
                       f"{stats['median_rank']:>8.1f} {stats['percentile']:>9.1f}% {stats['appearances']:>4} "
                       f"{stats['best_rank']:>4} {stats['worst_rank']:>5}\n")

        # Percentile Explanation
        f.write(f"\n\nPERCENTILE EXPLANATION\n")
        f.write("-" * 40 + "\n")
        f.write("Percentile shows where the upgrade/limit/attack type ranks on average:\n")
        f.write("- 0-25%: Top quartile (excellent performance)\n")
        f.write("- 25-50%: Above average performance\n")
        f.write("- 50-75%: Below average performance\n")
        f.write("- 75-100%: Bottom quartile (poor performance)\n")

    print(f"Enhancement & Attack Type ranking report saved to {reports_dir}/enhancement_ranking_report.txt")
    return enhancement_stats, attack_type_stats



def generate_upgrade_pairing_report(all_build_results: List[Tuple], config: SimulationConfig, reports_dir: str = "reports"):
    """Generate upgrade pairing analysis showing top 3 builds for each upgrade and common pairings"""
    print("Generating upgrade pairing analysis report...")

    # Track upgrade data
    upgrade_data = {}  # upgrade_name -> {'top_builds': [(build, rank, dpt)], 'pairings': {other_upgrade: count}}

    # Initialize upgrade data structure
    from src.game_data import UPGRADES
    for upgrade_name in UPGRADES.keys():
        upgrade_data[upgrade_name] = {
            'top_builds': [],
            'pairings': {},
            'all_appearances': []  # Track all builds containing this upgrade
        }

    # Process each build result to collect upgrade appearance data
    for rank, (build, avg_turns) in enumerate(all_build_results, 1):
        # For each upgrade in this build
        for upgrade in build.upgrades:
            if upgrade in upgrade_data:
                # Track this build appearance
                upgrade_data[upgrade]['all_appearances'].append((build, rank, avg_turns))

                # Track pairings with other upgrades in this build
                for other_upgrade in build.upgrades:
                    if other_upgrade != upgrade:
                        if other_upgrade not in upgrade_data[upgrade]['pairings']:
                            upgrade_data[upgrade]['pairings'][other_upgrade] = 0
                        upgrade_data[upgrade]['pairings'][other_upgrade] += 1

    # Process the data to get top 3 builds and most common pairings
    for upgrade_name, data in upgrade_data.items():
        # Sort all appearances by rank (lower rank = better performance)
        data['all_appearances'].sort(key=lambda x: x[1])  # Sort by rank

        # Get top 3 builds
        data['top_builds'] = data['all_appearances'][:3]

        # Get top 10 builds for pairing analysis
        top_10_builds = data['all_appearances'][:10]

        # Count pairings only within top 10 builds
        top_10_pairings = {}
        for build, rank, dpt in top_10_builds:
            for other_upgrade in build.upgrades:
                if other_upgrade != upgrade_name:
                    if other_upgrade not in top_10_pairings:
                        top_10_pairings[other_upgrade] = 0
                    top_10_pairings[other_upgrade] += 1

        # Sort pairings by frequency and take top 5
        data['common_pairings'] = sorted(top_10_pairings.items(), key=lambda x: x[1], reverse=True)[:5]

    # Write the report
    with open(f'{reports_dir}/upgrade_pairing_analysis.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - UPGRADE PAIRING ANALYSIS REPORT\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows each upgrade's top 3 performing builds and their most\n")
        f.write("common pairings within the top 10 builds containing that upgrade.\n\n")

        # Sort upgrades by their best performing build (lowest rank number)
        sorted_upgrades = []
        for upgrade_name, data in upgrade_data.items():
            if data['top_builds']:
                best_rank = data['top_builds'][0][1]  # Rank of best build
                sorted_upgrades.append((upgrade_name, best_rank, data))
            else:
                # Upgrades with no appearances go to the end
                sorted_upgrades.append((upgrade_name, float('inf'), data))

        sorted_upgrades.sort(key=lambda x: x[1])

        for upgrade_name, best_rank, data in sorted_upgrades:
            f.write(f"{upgrade_name.upper()}\n")
            f.write("=" * len(upgrade_name) + "\n")

            if not data['top_builds']:
                f.write("No builds found containing this upgrade.\n\n")
                continue

            # Top 3 builds section
            f.write("Top 3 Builds:\n")
            f.write("-" * 40 + "\n")
            for i, (build, rank, avg_turns) in enumerate(data['top_builds'], 1):
                f.write(f"{i}. Rank #{rank}: {build} (Avg Turns: {avg_turns:.1f})\n")

            # Common pairings section
            f.write(f"\nMost Common Pairings (within top 10 builds):\n")
            f.write("-" * 40 + "\n")
            if data['common_pairings']:
                for i, (paired_upgrade, count) in enumerate(data['common_pairings'], 1):
                    f.write(f"{i}. {paired_upgrade}: {count} times\n")
            else:
                f.write("No common pairings found (appears only in single-upgrade builds).\n")

            f.write(f"\nTotal appearances in ranked builds: {len(data['all_appearances'])}\n")
            f.write("\n" + "-" * 80 + "\n\n")

    print(f"Upgrade pairing analysis report saved to {reports_dir}/upgrade_pairing_analysis.txt")



def generate_diagnostic_base_attacks_report(config: SimulationConfig, reports_dir: str = "reports"):
    """Generate diagnostic report for base attack types across all scenarios"""
    print("Generating base attacks diagnostic report...")

    from src.game_data import ATTACK_TYPES
    from src.simulation import simulate_combat_verbose

    with open(f'{reports_dir}/diagnostic_base_attacks_report.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - BASE ATTACK TYPES DIAGNOSTIC REPORT\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows detailed combat mechanics for base attack types across all scenarios.\n")
        f.write("Tests 1×100, 2×50, 4×25, and 10×10 HP enemy configurations for each attack type.\n\n")

        # Test cases from config
        test_cases = []
        for i, att_config in enumerate(config.attacker_configs):
            for j, def_config in enumerate(config.defender_configs):
                attacker = Character(*att_config)
                defender = Character(*def_config)
                test_cases.append((f"Att{i+1}_Def{j+1}", attacker, defender))

        # Test base attack types first
        f.write("BASE ATTACK TYPES (NO UPGRADES)\n")
        f.write("="*80 + "\n\n")

        attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

        for attack_type in attack_types:
            f.write(f"{attack_type.upper()} ATTACK\n")
            f.write("-" * 40 + "\n")

            base_build = AttackBuild(attack_type, [], [])

            for case_name, attacker, defender in test_cases:
                f.write(f"\nTest Case: {case_name}\n")
                f.write(f"Attacker: F:{attacker.focus} P:{attacker.power} M:{attacker.mobility} E:{attacker.endurance} T:{attacker.tier}\n")
                f.write(f"Defender: F:{defender.focus} P:{defender.power} M:{defender.mobility} E:{defender.endurance} T:{defender.tier}\n")
                f.write(f"Defender Avoidance: {defender.avoidance}, Durability: {defender.durability}\n")

                # Test all four scenarios
                fight_scenarios = [
                    ("1×100 HP Boss", 1, 100),
                    ("2×50 HP Enemies", 2, 50),
                    ("4×25 HP Enemies", 4, 25),
                    ("10×10 HP Enemies", 10, 10)
                ]

                for scenario_name, num_enemies, enemy_hp in fight_scenarios:
                    f.write(f"\n  {scenario_name}:\n")
                    turns = simulate_combat_verbose(attacker, base_build, config.target_hp, f, defender,
                                                 num_enemies=num_enemies, enemy_hp=enemy_hp)
                    f.write(f"  Combat completed in {turns} turns\n")

            f.write("\n" + "="*60 + "\n\n")

    print(f"Base attacks diagnostic report saved to {reports_dir}/diagnostic_base_attacks_report.txt")



def generate_diagnostic_upgrades_report(config: SimulationConfig, reports_dir: str = "reports"):
    """Generate diagnostic report for individual upgrades across all scenarios"""
    print("Generating upgrades diagnostic report...")

    from src.game_data import UPGRADES, RuleValidator
    from src.simulation import simulate_combat_verbose

    with open(f'{reports_dir}/diagnostic_upgrades_report.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - UPGRADES DIAGNOSTIC REPORT\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows detailed combat mechanics for individual upgrades across all scenarios.\n")
        f.write("Tests 1×100, 2×50, 4×25, and 10×10 HP enemy configurations for each upgrade.\n\n")

        # Test cases from config
        test_cases = []
        for i, att_config in enumerate(config.attacker_configs):
            for j, def_config in enumerate(config.defender_configs):
                attacker = Character(*att_config)
                defender = Character(*def_config)
                case_name = f"Att{i+1}_Def{j+1}"
                test_cases.append((case_name, attacker, defender))

        attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

        for upgrade_name, upgrade_data in UPGRADES.items():
            f.write(f"{upgrade_name.upper()} ({upgrade_data.cost} points)\n")
            f.write("-" * 50 + "\n")

            # Build upgrade list including prerequisites
            from src.game_data import PREREQUISITES
            upgrade_list = [upgrade_name]
            if upgrade_name in PREREQUISITES:
                prerequisite_upgrades = PREREQUISITES[upgrade_name]
                upgrade_list = prerequisite_upgrades + [upgrade_name]
                f.write(f"Note: Testing with prerequisites: {', '.join(prerequisite_upgrades)}\n")

            # Test with compatible attack types
            compatible_attacks = []
            for attack_type in attack_types:
                is_valid, errors = RuleValidator.validate_combination(attack_type, upgrade_list)
                if is_valid:
                    compatible_attacks.append(attack_type)

            if not compatible_attacks:
                f.write("No compatible attack types found.\n\n")
                continue

            # Test with first compatible attack type for simplicity
            test_attack = compatible_attacks[0]
            f.write(f"Testing with {test_attack} attack\n")

            upgrade_build = AttackBuild(test_attack, upgrade_list, [])

            for case_name, attacker, defender in test_cases:
                f.write(f"\nTest Case: {case_name}\n")
                f.write(f"Attacker: F:{attacker.focus} P:{attacker.power} M:{attacker.mobility} E:{attacker.endurance} T:{attacker.tier}\n")
                f.write(f"Defender: F:{defender.focus} P:{defender.power} M:{defender.mobility} E:{defender.endurance} T:{defender.tier}\n")
                f.write(f"Defender Avoidance: {defender.avoidance}, Durability: {defender.durability}\n")

                # Test all four scenarios
                fight_scenarios = [
                    ("1×100 HP Boss", 1, 100),
                    ("2×50 HP Enemies", 2, 50),
                    ("4×25 HP Enemies", 4, 25),
                    ("10×10 HP Enemies", 10, 10)
                ]

                for scenario_name, num_enemies, enemy_hp in fight_scenarios:
                    f.write(f"\n  {scenario_name}:\n")
                    turns = simulate_combat_verbose(attacker, upgrade_build, config.target_hp, f, defender,
                                                 num_enemies=num_enemies, enemy_hp=enemy_hp)
                    f.write(f"  Combat completed in {turns} turns\n")

            f.write("\n" + "="*60 + "\n\n")

    print(f"Upgrades diagnostic report saved to {reports_dir}/diagnostic_upgrades_report.txt")



def generate_diagnostic_limits_report(config: SimulationConfig, reports_dir: str = "reports"):
    """Generate diagnostic report for individual limits across all scenarios"""
    print("Generating limits diagnostic report...")

    from src.game_data import LIMITS
    from src.simulation import simulate_combat_verbose

    with open(f'{reports_dir}/diagnostic_limits_report.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - LIMITS DIAGNOSTIC REPORT\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows detailed combat mechanics for individual limits across all scenarios.\n")
        f.write("Tests 1×100, 2×50, and 4×25 HP enemy configurations for each limit.\n\n")

        # Test cases from config
        test_cases = []
        for i, att_config in enumerate(config.attacker_configs):
            for j, def_config in enumerate(config.defender_configs):
                attacker = Character(*att_config)
                defender = Character(*def_config)
                case_name = f"Att{i+1}_Def{j+1}"
                test_cases.append((case_name, attacker, defender))

        attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

        for limit_name, limit_data in LIMITS.items():
            f.write(f"{limit_name.upper()} ({limit_data.cost} points)\n")
            f.write("-" * 50 + "\n")

            # Test with first attack type (all limits work with all attack types)
            test_attack = attack_types[0]
            f.write(f"Testing with {test_attack} attack\n")

            limit_build = AttackBuild(test_attack, [], [limit_name])

            for case_name, attacker, defender in test_cases:
                f.write(f"\nTest Case: {case_name}\n")
                f.write(f"Attacker: F:{attacker.focus} P:{attacker.power} M:{attacker.mobility} E:{attacker.endurance} T:{attacker.tier}\n")
                f.write(f"Defender: F:{defender.focus} P:{defender.power} M:{defender.mobility} E:{defender.endurance} T:{defender.tier}\n")
                f.write(f"Defender Avoidance: {defender.avoidance}, Durability: {defender.durability}\n")

                # Test all four scenarios
                fight_scenarios = [
                    ("1×100 HP Boss", 1, 100),
                    ("2×50 HP Enemies", 2, 50),
                    ("4×25 HP Enemies", 4, 25),
                    ("10×10 HP Enemies", 10, 10)
                ]

                for scenario_name, num_enemies, enemy_hp in fight_scenarios:
                    f.write(f"\n  {scenario_name}:\n")
                    turns = simulate_combat_verbose(attacker, limit_build, config.target_hp, f, defender,
                                                 num_enemies=num_enemies, enemy_hp=enemy_hp)
                    f.write(f"  Combat completed in {turns} turns\n")

            f.write("\n" + "="*60 + "\n\n")

    print(f"Limits diagnostic report saved to {reports_dir}/diagnostic_limits_report.txt")



def generate_scenario_breakdown_report(config: SimulationConfig, reports_dir: str = "reports"):
    """Generate comprehensive upgrade and limit performance analysis broken down by scenario and attack type"""
    print("Generating scenario breakdown reports...")

    from src.game_data import UPGRADES, LIMITS, RuleValidator

    # Create test cases from config
    test_cases = []
    for i, att_config in enumerate(config.attacker_configs):
        for j, def_config in enumerate(config.defender_configs):
            attacker = Character(*att_config)
            defender = Character(*def_config)
            case_name = f"Att{i+1}_Def{j+1}"
            test_cases.append((case_name, attacker, defender))

    attack_types = config.attack_types_filter if config.attack_types_filter else ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    fight_scenarios = [
        ("1×100 HP Boss", 1, 100),
        ("2×50 HP Enemies", 2, 50),
        ("4×25 HP Enemies", 4, 25),
        ("10×10 HP Enemies", 10, 10)
    ]

    # Generate upgrade scenario breakdown report
    with open(f'{reports_dir}/scenario_breakdown_upgrades_report.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - UPGRADE PERFORMANCE BY SCENARIO AND ATTACK TYPE\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows detailed upgrade performance broken down by enemy scenario and attack type.\n")
        f.write("Performance shown as average DPT improvement over base attacks.\n\n")

        # Test each upgrade
        for upgrade_name in UPGRADES.keys():
            if config.upgrades_filter and upgrade_name not in config.upgrades_filter:
                continue

            f.write(f"\n{'='*60}\n")
            f.write(f"UPGRADE: {upgrade_name.upper()}\n")
            f.write(f"Cost: {UPGRADES[upgrade_name].cost} points\n")
            f.write(f"{'='*60}\n")

            upgrade_has_data = False

            # Test with each compatible attack type
            for attack_type in attack_types:
                # Check compatibility
                is_valid, errors = RuleValidator.validate_combination(attack_type, [upgrade_name])
                if not is_valid:
                    continue

                upgrade_cost = UPGRADES[upgrade_name].cost
                if upgrade_cost > config.max_points_per_attack("focused"):
                    continue

                f.write(f"\nATTACK TYPE: {attack_type.upper()}\n")
                f.write(f"{'-'*40}\n")

                # Test across all scenarios for this attack type
                scenario_results = {}

                for scenario_name, num_enemies, enemy_hp in fight_scenarios:
                    scenario_improvements = []

                    for case_name, attacker, defender in test_cases:
                        base_build = AttackBuild(attack_type, [], [])
                        upgrade_build = AttackBuild(attack_type, [upgrade_name], [])

                        # Test base performance
                        base_results, base_avg_turns, base_dpt = run_simulation_batch(
                            attacker, base_build, config.individual_testing_runs, config.target_hp, defender,
                            num_enemies=num_enemies, enemy_hp=enemy_hp)

                        # Test upgrade performance
                        upgrade_results, upgrade_avg_turns, upgrade_dpt = run_simulation_batch(
                            attacker, upgrade_build, config.individual_testing_runs, config.target_hp, defender,
                            num_enemies=num_enemies, enemy_hp=enemy_hp)

                        improvement = upgrade_dpt - base_dpt
                        percent_improvement = (improvement / base_dpt * 100) if base_dpt > 0 else 0
                        scenario_improvements.append({
                            'case': case_name,
                            'base_dpt': base_dpt,
                            'upgrade_dpt': upgrade_dpt,
                            'improvement': improvement,
                            'percent_improvement': percent_improvement
                        })

                    # Calculate averages for this scenario
                    if scenario_improvements:
                        avg_base_dpt = sum(r['base_dpt'] for r in scenario_improvements) / len(scenario_improvements)
                        avg_upgrade_dpt = sum(r['upgrade_dpt'] for r in scenario_improvements) / len(scenario_improvements)
                        avg_improvement = sum(r['improvement'] for r in scenario_improvements) / len(scenario_improvements)
                        avg_percent = sum(r['percent_improvement'] for r in scenario_improvements) / len(scenario_improvements)

                        scenario_results[scenario_name] = {
                            'avg_base_dpt': avg_base_dpt,
                            'avg_upgrade_dpt': avg_upgrade_dpt,
                            'avg_improvement': avg_improvement,
                            'avg_percent': avg_percent
                        }

                # Display scenario results for this attack type
                if scenario_results:
                    upgrade_has_data = True
                    f.write(f"{'Scenario':<20} {'Base DPT':<10} {'Upgrade DPT':<12} {'Improvement':<12} {'% Improvement':<12}\n")
                    f.write(f"{'-'*70}\n")

                    for scenario_name, results in scenario_results.items():
                        f.write(f"{scenario_name:<20} {results['avg_base_dpt']:>7.1f} "
                               f"{results['avg_upgrade_dpt']:>10.1f} {results['avg_improvement']:>10.1f} "
                               f"{results['avg_percent']:>10.1f}%\n")

            if not upgrade_has_data:
                f.write(f"\nNo compatible attack types found for {upgrade_name}\n")

    # Generate limit scenario breakdown report
    with open(f'{reports_dir}/scenario_breakdown_limits_report.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - LIMIT PERFORMANCE BY SCENARIO AND ATTACK TYPE\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows detailed limit performance broken down by enemy scenario and attack type.\n")
        f.write("Performance shown as average DPT improvement over base attacks.\n\n")

        # Test each limit
        for limit_name in LIMITS.keys():
            if config.limits_filter and limit_name not in config.limits_filter:
                continue

            f.write(f"\n{'='*60}\n")
            f.write(f"LIMIT: {limit_name.upper()}\n")
            f.write(f"Cost: {LIMITS[limit_name].cost} points\n")
            f.write(f"{'='*60}\n")

            # Test with each attack type (all limits work with all attack types)
            for attack_type in attack_types:
                limit_cost = LIMITS[limit_name].cost
                if limit_cost > config.max_points_per_attack("focused"):
                    continue

                f.write(f"\nATTACK TYPE: {attack_type.upper()}\n")
                f.write(f"{'-'*40}\n")

                # Test across all scenarios for this attack type
                scenario_results = {}

                for scenario_name, num_enemies, enemy_hp in fight_scenarios:
                    scenario_improvements = []

                    for case_name, attacker, defender in test_cases:
                        base_build = AttackBuild(attack_type, [], [])
                        limit_build = AttackBuild(attack_type, [], [limit_name])

                        # Test base performance
                        base_results, base_avg_turns, base_dpt = run_simulation_batch(
                            attacker, base_build, config.individual_testing_runs, config.target_hp, defender,
                            num_enemies=num_enemies, enemy_hp=enemy_hp)

                        # Test limit performance
                        limit_results, limit_avg_turns, limit_dpt = run_simulation_batch(
                            attacker, limit_build, config.individual_testing_runs, config.target_hp, defender,
                            num_enemies=num_enemies, enemy_hp=enemy_hp)

                        improvement = limit_dpt - base_dpt
                        percent_improvement = (improvement / base_dpt * 100) if base_dpt > 0 else 0
                        scenario_improvements.append({
                            'case': case_name,
                            'base_dpt': base_dpt,
                            'limit_dpt': limit_dpt,
                            'improvement': improvement,
                            'percent_improvement': percent_improvement
                        })

                    # Calculate averages for this scenario
                    if scenario_improvements:
                        avg_base_dpt = sum(r['base_dpt'] for r in scenario_improvements) / len(scenario_improvements)
                        avg_limit_dpt = sum(r['limit_dpt'] for r in scenario_improvements) / len(scenario_improvements)
                        avg_improvement = sum(r['improvement'] for r in scenario_improvements) / len(scenario_improvements)
                        avg_percent = sum(r['percent_improvement'] for r in scenario_improvements) / len(scenario_improvements)

                        scenario_results[scenario_name] = {
                            'avg_base_dpt': avg_base_dpt,
                            'avg_limit_dpt': avg_limit_dpt,
                            'avg_improvement': avg_improvement,
                            'avg_percent': avg_percent
                        }

                # Display scenario results for this attack type
                if scenario_results:
                    f.write(f"{'Scenario':<20} {'Base DPT':<10} {'Limit DPT':<12} {'Improvement':<12} {'% Improvement':<12}\n")
                    f.write(f"{'-'*70}\n")

                    for scenario_name, results in scenario_results.items():
                        f.write(f"{scenario_name:<20} {results['avg_base_dpt']:>7.1f} "
                               f"{results['avg_limit_dpt']:>10.1f} {results['avg_improvement']:>10.1f} "
                               f"{results['avg_percent']:>10.1f}%\n")

    print("Scenario breakdown reports saved:")
    print(f"  - {reports_dir}/scenario_breakdown_upgrades_report.txt")
    print(f"  - {reports_dir}/scenario_breakdown_limits_report.txt")



def generate_diagnostic_report(config: SimulationConfig, reports_dir: str = "reports"):
    """Generate all diagnostic reports"""
    print("Generating comprehensive diagnostic reports...")
    generate_diagnostic_base_attacks_report(config, reports_dir)
    generate_diagnostic_upgrades_report(config, reports_dir)
    generate_diagnostic_limits_report(config, reports_dir)
    generate_scenario_breakdown_report(config, reports_dir)



def generate_individual_report(build: AttackBuild, config: SimulationConfig, reports_dir: str = "reports"):
    """Generate detailed individual build report"""
    print(f"\nGenerating individual report for: {build}")

    filename = f"individual_build_{build.attack_type}"
    if build.upgrades:
        filename += "_" + "_".join(build.upgrades)
    if build.limits:
        filename += "_" + "_".join(build.limits)
    filename += ".txt"

    with open(f'{reports_dir}/{filename}', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - INDIVIDUAL BUILD ANALYSIS\n")
        f.write("="*80 + "\n\n")
        f.write(f"BUILD: {build}\n")
        f.write(f"Total Cost: {build.total_cost} points\n\n")

        # Test with all configurations
        for i, att_config in enumerate(config.attacker_configs):
            for j, def_config in enumerate(config.defender_configs):
                attacker = Character(*att_config)
                defender = Character(*def_config)

                f.write(f"TEST CASE: Attacker {i+1} vs Defender {j+1}\n")
                f.write("-" * 40 + "\n")

                results, avg_turns, dpt = run_simulation_batch(
                    attacker, build, config.build_testing_runs, config.target_hp, defender)

                f.write(f"Individual results: {results}\n")
                f.write(f"Average turns to kill: {avg_turns:.1f}\n")
                f.write(f"Damage per turn: {dpt:.1f}\n\n")

    print(f"Individual build report saved to {reports_dir}/{filename}")



def enhancement_comparison(all_build_results: List[Tuple], enhancement_results: Dict, config: SimulationConfig, reports_dir: str = "reports"):
    """Generate enhancement comparison table showing build vs individual performance differences"""
    print("Generating enhancement comparison report...")

    # Build comparison data structure
    comparison_data = {}

    # Get all enhancement names from both upgrades and limits
    from src.game_data import UPGRADES, LIMITS
    all_enhancements = list(UPGRADES.keys()) + list(LIMITS.keys())

    # Initialize comparison data
    for enhancement in all_enhancements:
        comparison_data[enhancement] = {
            'all_attack_types': [],  # For overall average
            'melee_ac': [],
            'melee_dg': [],
            'ranged': [],
            'area': [],
            'direct_damage': []
        }

    # Process build results to get enhancement performance in builds
    for rank, (build, dpt, avg_turns) in enumerate(all_build_results, 1):
        # For each enhancement in this build
        for enhancement in build.upgrades + build.limits:
            if enhancement in comparison_data:
                # Store avg_turns for this enhancement in this attack type
                attack_type = build.attack_type
                if attack_type in comparison_data[enhancement]:
                    comparison_data[enhancement][attack_type].append(avg_turns)
                comparison_data[enhancement]['all_attack_types'].append(avg_turns)

    # Calculate averages for builds
    build_averages = {}
    for enhancement, data in comparison_data.items():
        build_averages[enhancement] = {}
        for attack_type, turns_list in data.items():
            if turns_list:
                build_averages[enhancement][attack_type] = sum(turns_list) / len(turns_list)
            else:
                build_averages[enhancement][attack_type] = 0

    # Get individual enhancement performance data
    individual_averages = {}
    for enhancement, enhancement_data in enhancement_results.items():
        individual_averages[enhancement] = {}

        # Calculate overall average from attack type results
        all_attack_turns = []
        for attack_type in ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage']:
            if attack_type in enhancement_data.get('attack_type_results', {}):
                attack_results = enhancement_data['attack_type_results'][attack_type]
                # Calculate avg_turns from DPT (assuming total HP = 100 for individual tests)
                dpt = attack_results.get('enhanced_dpt', 0)
                if dpt > 0:
                    avg_turns = 100 / dpt  # Assuming 100 HP total for individual tests
                    individual_averages[enhancement][attack_type] = avg_turns
                    all_attack_turns.append(avg_turns)
                else:
                    individual_averages[enhancement][attack_type] = 0
            else:
                individual_averages[enhancement][attack_type] = 0

        # Overall average
        if all_attack_turns:
            individual_averages[enhancement]['all_attack_types'] = sum(all_attack_turns) / len(all_attack_turns)
        else:
            individual_averages[enhancement]['all_attack_types'] = 0

    # Calculate differences (build - individual)
    differences = {}
    for enhancement in all_enhancements:
        if enhancement in build_averages and enhancement in individual_averages:
            differences[enhancement] = {}
            for attack_type in ['all_attack_types', 'melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage']:
                build_avg = build_averages[enhancement].get(attack_type, 0)
                individual_avg = individual_averages[enhancement].get(attack_type, 0)
                if build_avg > 0 and individual_avg > 0:
                    differences[enhancement][attack_type] = build_avg - individual_avg
                else:
                    differences[enhancement][attack_type] = 0

    # Write the report
    with open(f'{reports_dir}/enhancement_comparison.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - ENHANCEMENT COMPARISON: BUILD vs INDIVIDUAL PERFORMANCE\n")
        f.write("="*90 + "\n\n")
        f.write("This table compares average turns for enhancements in builds vs individual testing.\n")
        f.write("Values = avg_turns_in_builds - avg_turns_individual\n")
        f.write("Negative values = enhancement performs better in builds than individually\n")
        f.write("Positive values = enhancement performs worse in builds than individually\n\n")

        # Table header
        f.write(f"{'Enhancement':<25} {'All Types':<10} {'Melee_AC':<10} {'Melee_DG':<10} {'Ranged':<10} {'Area':<10} {'Direct':<10}\n")
        f.write("-" * 95 + "\n")

        # Sort by overall difference (all attack types)
        sorted_enhancements = sorted(differences.items(), key=lambda x: x[1].get('all_attack_types', 0))

        for enhancement, diff_data in sorted_enhancements:
            if any(abs(v) > 0.1 for v in diff_data.values()):  # Only show meaningful differences
                f.write(f"{enhancement:<25} "
                       f"{diff_data.get('all_attack_types', 0):>8.1f} "
                       f"{diff_data.get('melee_ac', 0):>8.1f} "
                       f"{diff_data.get('melee_dg', 0):>8.1f} "
                       f"{diff_data.get('ranged', 0):>8.1f} "
                       f"{diff_data.get('area', 0):>8.1f} "
                       f"{diff_data.get('direct_damage', 0):>8.1f}\n")

        # Summary analysis
        f.write(f"\n\nSUMMARY ANALYSIS\n")
        f.write("-" * 40 + "\n")

        better_in_builds = [enh for enh, data in differences.items()
                           if data.get('all_attack_types', 0) < -0.5]
        worse_in_builds = [enh for enh, data in differences.items()
                          if data.get('all_attack_types', 0) > 0.5]

        f.write(f"Enhancements performing better in builds ({len(better_in_builds)}):\n")
        for enh in better_in_builds[:10]:  # Top 10
            f.write(f"  - {enh}\n")

        f.write(f"\nEnhancements performing worse in builds ({len(worse_in_builds)}):\n")
        for enh in worse_in_builds[:10]:  # Top 10
            f.write(f"  - {enh}\n")

    print(f"Enhancement comparison report saved to {reports_dir}/enhancement_comparison.txt")
    return differences



def generate_reports_by_mode(config: SimulationConfig, reports_dir: str, all_build_results: List[Tuple] = None):
    """Generate reports based on execution mode"""

    if config.execution_mode in ['individual', 'both']:
        if config.reports.get('individual_reports', {}).get('enabled', True):
            individual_generator = IndividualReportGenerator(config, reports_dir)
            individual_generator.generate_all_reports()

    if config.execution_mode in ['build', 'both']:
        if config.reports.get('build_reports', {}).get('enabled', True) and all_build_results:
            build_generator = BuildReportGenerator(config, reports_dir)
            build_generator.generate_all_reports(all_build_results)


