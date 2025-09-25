"""
Analysis and reporting for the Vitality System combat simulator.
"""

import json
import os
from typing import Dict, List, Tuple
from models import Character, AttackBuild, SimulationConfig
from simulation import run_simulation_batch
from game_data import UPGRADES, LIMITS, RuleValidator


def load_config(config_file: str = 'config.json') -> SimulationConfig:
    """Load configuration from JSON file"""
    if os.path.exists(config_file):
        with open(config_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Convert config data to SimulationConfig
        config = SimulationConfig(
            num_runs=data.get('num_runs', 10),
            target_hp=data.get('target_hp', 100),
            max_points=data.get('max_points', 60),
            test_single_upgrades=data.get('test_single_upgrades', True),
            test_two_upgrade_combinations=data.get('test_two_upgrade_combinations', True),
            test_three_upgrade_combinations=data.get('test_three_upgrade_combinations', True),
            test_slayers=data.get('test_slayers', True),
            test_limits=data.get('test_limits', True),
            verbose_logging=data.get('verbose_logging', True),
            show_top_builds=data.get('show_top_builds', 10),
            generate_individual_logs=data.get('generate_individual_logs', False),
            min_dpt_threshold=data.get('min_dpt_threshold', 0.0),
        )

        # Set configurations from the loaded data
        if 'attacker_configs' in data:
            config.attacker_configs = [tuple(cfg) for cfg in data['attacker_configs']]
        if 'defender_configs' in data:
            config.defender_configs = [tuple(cfg) for cfg in data['defender_configs']]
        if 'attack_types_filter' in data:
            config.attack_types_filter = data['attack_types_filter']
        if 'upgrades_filter' in data:
            config.upgrades_filter = data['upgrades_filter']
        if 'limits_filter' in data:
            config.limits_filter = data['limits_filter']

        return config
    else:
        print(f"Config file {config_file} not found, using defaults")
        return SimulationConfig()


def save_config(config: SimulationConfig, config_file: str = 'config.json'):
    """Save configuration to JSON file"""
    data = {
        'num_runs': config.num_runs,
        'target_hp': config.target_hp,
        'max_points': config.max_points,
        'test_single_upgrades': config.test_single_upgrades,
        'test_two_upgrade_combinations': config.test_two_upgrade_combinations,
        'test_three_upgrade_combinations': config.test_three_upgrade_combinations,
        'test_slayers': config.test_slayers,
        'test_limits': config.test_limits,
        'attacker_configs': list(config.attacker_configs),
        'defender_configs': list(config.defender_configs),
        'attack_types_filter': config.attack_types_filter,
        'upgrades_filter': config.upgrades_filter,
        'limits_filter': config.limits_filter,
        'min_dpt_threshold': config.min_dpt_threshold,
        'verbose_logging': config.verbose_logging,
        'show_top_builds': config.show_top_builds,
        'generate_individual_logs': config.generate_individual_logs,
    }

    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print(f"Configuration saved to {config_file}")


def print_configuration_report(config: SimulationConfig):
    """Print the current configuration settings"""
    print("SIMULATION CONFIGURATION")
    print("=" * 50)
    print(f"Simulation runs per build: {config.num_runs}")
    print(f"Target HP: {config.target_hp}")
    print(f"Max build points: {config.max_points}")
    print()

    print("Test Categories:")
    print(f"  - Single upgrades: {config.test_single_upgrades}")
    print(f"  - Two-upgrade combinations: {config.test_two_upgrade_combinations}")
    print(f"  - Three-upgrade combinations: {config.test_three_upgrade_combinations}")
    print(f"  - Slayer upgrades: {config.test_slayers}")
    print(f"  - Limit upgrades: {config.test_limits}")
    print()

    print("Filters:")
    if config.attack_types_filter:
        print(f"  - Attack types: {', '.join(config.attack_types_filter)}")
    if config.upgrades_filter:
        print(f"  - Upgrades: {', '.join(config.upgrades_filter)}")
    if config.limits_filter:
        print(f"  - Limits: {', '.join(config.limits_filter)}")
    if config.min_dpt_threshold > 0:
        print(f"  - Minimum DPT threshold: {config.min_dpt_threshold}")
    print()

    print("Output Settings:")
    print(f"  - Show top builds: {config.show_top_builds}")
    print(f"  - Verbose logging: {config.verbose_logging}")
    print(f"  - Generate individual logs: {config.generate_individual_logs}")
    print()

    print("Test Configurations:")
    print("  Attacker configurations:")
    for i, att_config in enumerate(config.attacker_configs):
        att_val = {'focus': att_config[0], 'power': att_config[1], 'mobility': att_config[2], 'endurance': att_config[3], 'tier': att_config[4]}
        print(f"     {i+1}: F:{att_val['focus']} P:{att_val['power']} M:{att_val['mobility']} E:{att_val['endurance']} T:{att_val['tier']}")

    print("  Defender configurations:")
    for i, def_config in enumerate(config.defender_configs):
        def_val = {'focus': def_config[0], 'power': def_config[1], 'mobility': def_config[2], 'endurance': def_config[3], 'tier': def_config[4]}
        print(f"     {i+1}: F:{def_val['focus']} P:{def_val['power']} M:{def_val['mobility']} E:{def_val['endurance']} T:{def_val['tier']}")

    print("\n" + "="*80 + "\n")


def generate_upgrade_performance_report(config: SimulationConfig) -> Dict:
    """Generate comprehensive individual upgrade performance analysis"""
    print(f"\nGenerating upgrade performance analysis...")

    # Create test cases from config
    test_cases = []
    for i, att_config in enumerate(config.attacker_configs):
        for j, def_config in enumerate(config.defender_configs):
            attacker = Character(*att_config)
            defender = Character(*def_config)
            case_name = f"Att{i+1}_Def{j+1}"
            test_cases.append((case_name, attacker, defender))

    upgrade_results = {}

    # Determine which attack types to test
    attack_types = config.attack_types_filter if config.attack_types_filter else ['melee', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    # Test each upgrade individually
    for upgrade_name in UPGRADES.keys():
        if config.upgrades_filter and upgrade_name not in config.upgrades_filter:
            continue

        print(f"  Testing {upgrade_name}...")
        upgrade_data = {
            'name': upgrade_name,
            'cost': UPGRADES[upgrade_name].cost,
            'attack_type_results': {},
            'overall_avg_dpt': 0,
            'overall_avg_improvement': 0,
            'cost_effectiveness': 0
        }

        attack_type_results = []

        # Test upgrade with each attack type it's compatible with
        for attack_type in attack_types:
            # Check compatibility
            is_valid, errors = RuleValidator.validate_combination(attack_type, [upgrade_name])
            if not is_valid:
                continue

            upgrade_cost = UPGRADES[upgrade_name].cost
            if upgrade_cost > config.max_points:
                continue

            # Test base attack vs upgrade attack for each test case
            case_results = []
            for case_name, attacker, defender in test_cases:
                # Base attack performance
                base_build = AttackBuild(attack_type, [], [])
                upgrade_build = AttackBuild(attack_type, [upgrade_name], [])

                # Run simulations for base build
                base_results, base_avg_turns, base_dpt = run_simulation_batch(
                    attacker, base_build, config.num_runs, config.target_hp, defender)

                # Run simulations for upgrade build
                upgrade_results_batch, upgrade_avg_turns, upgrade_dpt = run_simulation_batch(
                    attacker, upgrade_build, config.num_runs, config.target_hp, defender)

                # Calculate improvement
                dpt_improvement = upgrade_dpt - base_dpt
                percent_improvement = (dpt_improvement / base_dpt * 100) if base_dpt > 0 else 0

                case_results.append({
                    'case': case_name,
                    'base_dpt': base_dpt,
                    'upgrade_dpt': upgrade_dpt,
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

            upgrade_results[upgrade_name] = upgrade_data

    return upgrade_results


def write_upgrade_performance_report(upgrade_results: Dict, config: SimulationConfig):
    """Write comprehensive upgrade performance report to file"""
    with open('reports/upgrade_performance_summary.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - INDIVIDUAL UPGRADE PERFORMANCE ANALYSIS\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows how each upgrade performs individually compared to base attacks.\n")
        f.write("Improvements are measured in Damage Per Turn (DPT) increases.\n\n")

        # Sort by cost effectiveness
        sorted_upgrades = sorted(upgrade_results.values(), key=lambda x: x['cost_effectiveness'], reverse=True)

        f.write("UPGRADE COST-EFFECTIVENESS RANKING\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Upgrade':<25} {'Cost':<6} {'Avg DPT+':<10} {'Avg %+':<10} {'DPT/Cost':<10}\n")
        f.write("-" * 80 + "\n")

        for i, upgrade_data in enumerate(sorted_upgrades, 1):
            f.write(f"{i:<4} {upgrade_data['name']:<25} {upgrade_data['cost']:>4}p "
                   f"{upgrade_data['overall_avg_improvement']:>8.1f} "
                   f"{(upgrade_data['overall_avg_improvement']/upgrade_data['overall_avg_dpt']*100) if upgrade_data['overall_avg_dpt'] > 0 else 0:>8.1f}% "
                   f"{upgrade_data['cost_effectiveness']:>8.2f}\n")

        # Sort by absolute DPT improvement
        sorted_by_dpt = sorted(upgrade_results.values(), key=lambda x: x['overall_avg_improvement'], reverse=True)

        f.write(f"\n\nUPGRADE ABSOLUTE DPT IMPROVEMENT RANKING\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Upgrade':<25} {'Cost':<6} {'Avg DPT+':<10} {'Best Attack Type':<15}\n")
        f.write("-" * 80 + "\n")

        for i, upgrade_data in enumerate(sorted_by_dpt, 1):
            # Find best attack type for this upgrade
            best_attack_type = ""
            best_improvement = 0
            for attack_type, results in upgrade_data['attack_type_results'].items():
                if results['avg_improvement'] > best_improvement:
                    best_improvement = results['avg_improvement']
                    best_attack_type = f"{attack_type} (+{best_improvement:.1f})"

            f.write(f"{i:<4} {upgrade_data['name']:<25} {upgrade_data['cost']:>4}p "
                   f"{upgrade_data['overall_avg_improvement']:>8.1f} {best_attack_type:<15}\n")

        # Detailed per-upgrade analysis
        f.write(f"\n\nDETAILED UPGRADE ANALYSIS\n")
        f.write("="*80 + "\n")

        for upgrade_name, upgrade_data in sorted(upgrade_results.items()):
            f.write(f"\n{upgrade_data['name'].upper()}\n")
            f.write(f"Cost: {upgrade_data['cost']} points | Overall Avg DPT Improvement: {upgrade_data['overall_avg_improvement']:.1f} | Cost Effectiveness: {upgrade_data['cost_effectiveness']:.2f}\n")
            f.write("-" * 60 + "\n")

            for attack_type, results in upgrade_data['attack_type_results'].items():
                f.write(f"{attack_type.title()}: Base {results['avg_base_dpt']:.1f} DPT → {results['avg_upgrade_dpt']:.1f} DPT "
                       f"(+{results['avg_improvement']:.1f}, {results['avg_percent_improvement']:+.1f}%)\n")

    print(f"Upgrade performance report saved to reports/upgrade_performance_summary.txt")


def generate_upgrade_ranking_report(all_build_results: List[Tuple], config: SimulationConfig):
    """Generate upgrade ranking report based on average build rank positions with percentile rankings"""
    print("Generating upgrade ranking report...")

    # Track upgrade appearances and their ranking positions
    upgrade_rankings = {}  # upgrade_name -> list of ranking positions
    attack_type_rankings = {}  # attack_type -> list of ranking positions

    # Process each build result to track upgrade positions
    for rank, (build, dpt) in enumerate(all_build_results, 1):
        # Track attack type rankings
        if build.attack_type not in attack_type_rankings:
            attack_type_rankings[build.attack_type] = []
        attack_type_rankings[build.attack_type].append(rank)

        # Track upgrade rankings
        for upgrade in build.upgrades:
            if upgrade not in upgrade_rankings:
                upgrade_rankings[upgrade] = []
            upgrade_rankings[upgrade].append(rank)

    total_builds = len(all_build_results)

    # Calculate statistics for upgrades
    upgrade_stats = []
    for upgrade_name, positions in upgrade_rankings.items():
        avg_position = sum(positions) / len(positions)
        percentile = (avg_position / total_builds) * 100
        upgrade_stats.append({
            'name': upgrade_name,
            'avg_rank': avg_position,
            'percentile': percentile,
            'appearances': len(positions),
            'best_rank': min(positions),
            'worst_rank': max(positions)
        })

    # Calculate statistics for attack types
    attack_type_stats = []
    for attack_type, positions in attack_type_rankings.items():
        avg_position = sum(positions) / len(positions)
        percentile = (avg_position / total_builds) * 100
        attack_type_stats.append({
            'name': attack_type,
            'avg_rank': avg_position,
            'percentile': percentile,
            'appearances': len(positions),
            'best_rank': min(positions),
            'worst_rank': max(positions)
        })

    # Sort by average rank (lower is better)
    upgrade_stats.sort(key=lambda x: x['avg_rank'])
    attack_type_stats.sort(key=lambda x: x['avg_rank'])

    # Write the report
    with open('reports/upgrade_ranking_report.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - UPGRADE RANKING REPORT\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows upgrade and attack type performance based on average ranking\n")
        f.write("positions across all tested builds. Lower percentiles indicate better performance.\n")
        f.write(f"Total builds tested: {total_builds}\n\n")

        # Upgrade Rankings Section
        f.write("UPGRADE RANKINGS BY AVERAGE POSITION\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Upgrade':<25} {'Avg Rank':<10} {'Percentile':<12} {'Uses':<6} {'Best':<6} {'Worst':<6}\n")
        f.write("-" * 80 + "\n")

        for i, stats in enumerate(upgrade_stats, 1):
            f.write(f"{i:<4} {stats['name']:<25} {stats['avg_rank']:>8.1f} "
                   f"{stats['percentile']:>9.1f}% {stats['appearances']:>4} "
                   f"{stats['best_rank']:>4} {stats['worst_rank']:>5}\n")

        # Attack Type Rankings Section
        f.write(f"\n\nATTACK TYPE RANKINGS BY AVERAGE POSITION\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Attack Type':<25} {'Avg Rank':<10} {'Percentile':<12} {'Uses':<6} {'Best':<6} {'Worst':<6}\n")
        f.write("-" * 80 + "\n")

        for i, stats in enumerate(attack_type_stats, 1):
            f.write(f"{i:<4} {stats['name']:<25} {stats['avg_rank']:>8.1f} "
                   f"{stats['percentile']:>9.1f}% {stats['appearances']:>4} "
                   f"{stats['best_rank']:>4} {stats['worst_rank']:>5}\n")

        # Percentile Explanation
        f.write(f"\n\nPERCENTILE EXPLANATION\n")
        f.write("-" * 40 + "\n")
        f.write("Percentile shows where the upgrade/attack type ranks on average:\n")
        f.write("- 0-25%: Top quartile (excellent performance)\n")
        f.write("- 25-50%: Above average performance\n")
        f.write("- 50-75%: Below average performance\n")
        f.write("- 75-100%: Bottom quartile (poor performance)\n")

    print("Upgrade ranking report saved to reports/upgrade_ranking_report.txt")
    return upgrade_stats, attack_type_stats


def generate_upgrade_pairing_report(all_build_results: List[Tuple], config: SimulationConfig):
    """Generate upgrade pairing analysis showing top 3 builds for each upgrade and common pairings"""
    print("Generating upgrade pairing analysis report...")

    # Track upgrade data
    upgrade_data = {}  # upgrade_name -> {'top_builds': [(build, rank, dpt)], 'pairings': {other_upgrade: count}}

    # Initialize upgrade data structure
    from game_data import UPGRADES
    for upgrade_name in UPGRADES.keys():
        upgrade_data[upgrade_name] = {
            'top_builds': [],
            'pairings': {},
            'all_appearances': []  # Track all builds containing this upgrade
        }

    # Process each build result to collect upgrade appearance data
    for rank, (build, dpt) in enumerate(all_build_results, 1):
        # For each upgrade in this build
        for upgrade in build.upgrades:
            if upgrade in upgrade_data:
                # Track this build appearance
                upgrade_data[upgrade]['all_appearances'].append((build, rank, dpt))

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
    with open('reports/upgrade_pairing_analysis.txt', 'w', encoding='utf-8') as f:
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
            for i, (build, rank, dpt) in enumerate(data['top_builds'], 1):
                f.write(f"{i}. Rank #{rank}: {build} (DPT: {dpt:.1f})\n")

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

    print("Upgrade pairing analysis report saved to reports/upgrade_pairing_analysis.txt")


def generate_diagnostic_report(config: SimulationConfig):
    """Generate diagnostic report showing base attack types and individual upgrades with detailed calculations"""
    print("Generating diagnostic mechanics report...")

    from game_data import UPGRADES, ATTACK_TYPES
    from simulation import simulate_combat_verbose

    with open('reports/diagnostic_mechanics_report.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - DIAGNOSTIC MECHANICS REPORT\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows detailed combat mechanics calculations for verification.\n")
        f.write("Single combat simulation per test case to demonstrate core mechanics.\n\n")

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

        attack_types = ['melee', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

        for attack_type in attack_types:
            f.write(f"{attack_type.upper()} ATTACK\n")
            f.write("-" * 40 + "\n")

            base_build = AttackBuild(attack_type, [], [])

            for case_name, attacker, defender in test_cases:
                f.write(f"\nTest Case: {case_name}\n")
                f.write(f"Attacker: F:{attacker.focus} P:{attacker.power} M:{attacker.mobility} E:{attacker.endurance} T:{attacker.tier}\n")
                f.write(f"Defender: F:{defender.focus} P:{defender.power} M:{defender.mobility} E:{defender.endurance} T:{defender.tier}\n")
                f.write(f"Defender Avoidance: {defender.avoidance}, Durability: {defender.durability}\n")

                # Run single detailed simulation
                turns = simulate_combat_verbose(attacker, base_build, config.target_hp, f, defender,
                                             num_enemies=1, enemy_hp=100)
                f.write(f"Combat completed in {turns} turns\n")

            f.write("\n" + "="*60 + "\n\n")

        # Test individual upgrades
        f.write("INDIVIDUAL UPGRADES\n")
        f.write("="*80 + "\n\n")

        for upgrade_name, upgrade_data in UPGRADES.items():
            f.write(f"{upgrade_name.upper()} ({upgrade_data.cost} points)\n")
            f.write("-" * 50 + "\n")

            # Test with compatible attack types
            compatible_attacks = []
            for attack_type in attack_types:
                from game_data import RuleValidator
                is_valid, errors = RuleValidator.validate_combination(attack_type, [upgrade_name])
                if is_valid:
                    compatible_attacks.append(attack_type)

            if not compatible_attacks:
                f.write("No compatible attack types found.\n\n")
                continue

            # Test with first compatible attack type for simplicity
            test_attack = compatible_attacks[0]
            f.write(f"Testing with {test_attack} attack\n")

            upgrade_build = AttackBuild(test_attack, [upgrade_name], [])

            for case_name, attacker, defender in test_cases:
                f.write(f"\nTest Case: {case_name}\n")
                f.write(f"Attacker: F:{attacker.focus} P:{attacker.power} M:{attacker.mobility} E:{attacker.endurance} T:{attacker.tier}\n")
                f.write(f"Defender: F:{defender.focus} P:{defender.power} M:{defender.mobility} E:{defender.endurance} T:{defender.tier}\n")
                f.write(f"Defender Avoidance: {defender.avoidance}, Durability: {defender.durability}\n")

                # Run single detailed simulation
                turns = simulate_combat_verbose(attacker, upgrade_build, config.target_hp, f, defender,
                                             num_enemies=1, enemy_hp=100)
                f.write(f"Combat completed in {turns} turns\n")

            f.write("\n" + "="*60 + "\n\n")

    print("Diagnostic mechanics report saved to reports/diagnostic_mechanics_report.txt")


def generate_individual_report(build: AttackBuild, config: SimulationConfig):
    """Generate detailed individual build report"""
    print(f"\nGenerating individual report for: {build}")

    filename = f"individual_build_{build.attack_type}"
    if build.upgrades:
        filename += "_" + "_".join(build.upgrades)
    if build.limits:
        filename += "_" + "_".join(build.limits)
    filename += ".txt"

    with open(f'reports/{filename}', 'w', encoding='utf-8') as f:
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
                    attacker, build, config.num_runs, config.target_hp, defender)

                f.write(f"Individual results: {results}\n")
                f.write(f"Average turns to kill: {avg_turns:.1f}\n")
                f.write(f"Damage per turn: {dpt:.1f}\n\n")

    print(f"Individual build report saved to reports/{filename}")


def write_build_summary(builds: List[AttackBuild], config: SimulationConfig):
    """Write a summary of the top builds to file"""
    if not builds:
        print("No builds to summarize.")
        return

    # Calculate DPT for each build
    build_results = []
    for build in builds[:50]:  # Show top 50 builds
        total_dpt = 0
        total_configs = 0

        for att_config in config.attacker_configs:
            for def_config in config.defender_configs:
                attacker = Character(*att_config)
                defender = Character(*def_config)

                _, avg_turns, dpt = run_simulation_batch(
                    attacker, build, config.num_runs, config.target_hp, defender)

                total_dpt += dpt
                total_configs += 1

        avg_dpt = total_dpt / total_configs if total_configs > 0 else 0
        build_results.append((build, avg_dpt))

    # Sort by average DPT
    build_results.sort(key=lambda x: x[1], reverse=True)

    # Calculate attack type statistics
    attack_type_results = {}
    for build, avg_dpt in build_results:
        attack_type = build.attack_type
        if attack_type not in attack_type_results:
            attack_type_results[attack_type] = []
        attack_type_results[attack_type].append(avg_dpt)

    attack_type_summary = []
    for attack_type, dpts in attack_type_results.items():
        avg_dpt = sum(dpts) / len(dpts)
        best_dpt = max(dpts)
        worst_dpt = min(dpts)
        count = len(dpts)
        attack_type_summary.append({
            'type': attack_type,
            'avg_dpt': avg_dpt,
            'best_dpt': best_dpt,
            'worst_dpt': worst_dpt,
            'count': count
        })

    attack_type_summary.sort(key=lambda x: x['avg_dpt'], reverse=True)

    with open('reports/build_summary.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - BUILD PERFORMANCE SUMMARY\n")
        f.write("="*80 + "\n\n")
        f.write(f"Top {len(build_results)} builds ranked by average DPT across all test configurations:\n\n")

        for i, (build, avg_dpt) in enumerate(build_results, 1):
            f.write(f"{i:2d}. {build} | Avg DPT: {avg_dpt:.1f}\n")

        # Attack Type Performance Summary
        f.write(f"\n\nATTACK TYPE PERFORMANCE SUMMARY\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Attack Type':<20} {'Avg DPT':<10} {'Best DPT':<10} {'Worst DPT':<11} {'Count':<6}\n")
        f.write("-" * 80 + "\n")

        for i, stats in enumerate(attack_type_summary, 1):
            f.write(f"{i:<4} {stats['type']:<20} {stats['avg_dpt']:>7.1f} "
                   f"{stats['best_dpt']:>8.1f} {stats['worst_dpt']:>9.1f} "
                   f"{stats['count']:>4}\n")

    print(f"Build summary saved to reports/build_summary.txt")