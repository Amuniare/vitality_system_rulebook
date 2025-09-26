"""
Analysis and reporting for the Vitality System combat simulator.
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Tuple
from models import Character, AttackBuild, SimulationConfig
from simulation import run_simulation_batch
from game_data import UPGRADES, LIMITS, RuleValidator


def create_timestamped_reports_directory() -> str:
    """Create and return a timestamped directory path for reports"""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    reports_dir = f"reports/{timestamp}"

    # Create the main timestamped directory
    os.makedirs(reports_dir, exist_ok=True)

    # Create subdirectories that might be needed
    os.makedirs(f"{reports_dir}/individual_builds", exist_ok=True)

    return reports_dir


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
            show_top_builds=data.get('top_builds_count', data.get('show_top_builds', 10)),
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
    print("Enemy Scenarios: 1×100, 2×50, 4×25, 10×10 HP")
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
        if combo_cost > config.max_points:
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

            if combo_cost > config.max_points:
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
                        attacker, base_build, config.num_runs, config.target_hp, defender,
                        num_enemies=num_enemies, enemy_hp=enemy_hp)
                    base_total_dpt += base_dpt
                    scenario_count += 1

                base_avg_dpt = base_total_dpt / scenario_count

                # Run simulations for combo build across all scenarios
                combo_total_dpt = 0
                scenario_count = 0

                for num_enemies, enemy_hp in fight_scenarios:
                    combo_results_batch, combo_avg_turns, combo_dpt = run_simulation_batch(
                        attacker, combo_build, config.num_runs, config.target_hp, defender,
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
        upgrade_data = {
            'name': upgrade_name,
            'type': 'upgrade',
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
                        attacker, base_build, config.num_runs, config.target_hp, defender,
                        num_enemies=num_enemies, enemy_hp=enemy_hp)
                    base_total_dpt += base_dpt
                    scenario_count += 1

                base_avg_dpt = base_total_dpt / scenario_count

                # Run simulations for upgrade build across all scenarios
                upgrade_total_dpt = 0
                scenario_count = 0

                for num_enemies, enemy_hp in fight_scenarios:
                    upgrade_results_batch, upgrade_avg_turns, upgrade_dpt = run_simulation_batch(
                        attacker, upgrade_build, config.num_runs, config.target_hp, defender,
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
            if limit_cost > config.max_points:
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
                        attacker, base_build, config.num_runs, config.target_hp, defender,
                        num_enemies=num_enemies, enemy_hp=enemy_hp)
                    base_total_dpt += base_dpt
                    scenario_count += 1

                base_avg_dpt = base_total_dpt / scenario_count

                # Run simulations for limit build across all scenarios
                limit_total_dpt = 0
                scenario_count = 0

                for num_enemies, enemy_hp in fight_scenarios:
                    limit_results_batch, limit_avg_turns, limit_dpt = run_simulation_batch(
                        attacker, limit_build, config.num_runs, config.target_hp, defender,
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


def write_upgrade_performance_report(enhancement_results: Dict, config: SimulationConfig, reports_dir: str = "reports"):
    """Write comprehensive enhancement (upgrade and limit) performance report to file"""
    with open(f'{reports_dir}/enhancement_performance_summary.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - INDIVIDUAL ENHANCEMENT PERFORMANCE ANALYSIS\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows how each enhancement (upgrade or limit) performs individually compared to base attacks.\n")
        f.write("Improvements are measured in Damage Per Turn (DPT) increases across all enemy scenarios.\n\n")

        # Sort by cost effectiveness
        sorted_enhancements = sorted(enhancement_results.values(), key=lambda x: x['cost_effectiveness'], reverse=True)

        f.write("ENHANCEMENT COST-EFFECTIVENESS RANKING\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Enhancement':<25} {'Cost':<6} {'Avg DPT+':<10} {'Avg %+':<10} {'DPT/Cost':<10}\n")
        f.write("-" * 80 + "\n")

        for i, enhancement_data in enumerate(sorted_enhancements, 1):
            f.write(f"{i:<4} {enhancement_data['name']:<25} {enhancement_data['cost']:>4}p "
                   f"{enhancement_data['overall_avg_improvement']:>8.1f} "
                   f"{(enhancement_data['overall_avg_improvement']/enhancement_data['overall_avg_dpt']*100) if enhancement_data['overall_avg_dpt'] > 0 else 0:>8.1f}% "
                   f"{enhancement_data['cost_effectiveness']:>8.2f}\n")

        # Sort by absolute DPT improvement
        sorted_by_dpt = sorted(enhancement_results.values(), key=lambda x: x['overall_avg_improvement'], reverse=True)

        f.write(f"\n\nENHANCEMENT ABSOLUTE DPT IMPROVEMENT RANKING\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Enhancement':<25} {'Cost':<6} {'Avg DPT+':<10} {'Best Attack Type':<15}\n")
        f.write("-" * 80 + "\n")

        for i, enhancement_data in enumerate(sorted_by_dpt, 1):
            # Find best attack type for this enhancement
            best_attack_type = ""
            best_improvement = 0
            for attack_type, results in enhancement_data['attack_type_results'].items():
                if results['avg_improvement'] > best_improvement:
                    best_improvement = results['avg_improvement']
                    best_attack_type = f"{attack_type} (+{best_improvement:.1f})"

            f.write(f"{i:<4} {enhancement_data['name']:<25} {enhancement_data['cost']:>4}p "
                   f"{enhancement_data['overall_avg_improvement']:>8.1f} {best_attack_type:<15}\n")

        # Detailed per-enhancement analysis
        f.write(f"\n\nDETAILED ENHANCEMENT ANALYSIS\n")
        f.write("="*80 + "\n")

        for enhancement_name, enhancement_data in sorted(enhancement_results.items()):
            f.write(f"\n{enhancement_data['name'].upper()}\n")
            f.write(f"Cost: {enhancement_data['cost']} points | Overall Avg DPT Improvement: {enhancement_data['overall_avg_improvement']:.1f} | Cost Effectiveness: {enhancement_data['cost_effectiveness']:.2f}\n")
            f.write("-" * 60 + "\n")

            for attack_type, results in enhancement_data['attack_type_results'].items():
                # Handle both upgrade and limit result keys
                enhanced_dpt_key = 'avg_upgrade_dpt' if 'avg_upgrade_dpt' in results else 'avg_limit_dpt'
                f.write(f"{attack_type.title()}: Base {results['avg_base_dpt']:.1f} DPT → {results[enhanced_dpt_key]:.1f} DPT "
                       f"(+{results['avg_improvement']:.1f}, {results['avg_percent_improvement']:+.1f}%)\n")


    print(f"Enhancement performance report saved to {reports_dir}/enhancement_performance_summary.txt")


def write_combo_performance_report(combo_results: Dict, config: SimulationConfig, reports_dir: str = "reports"):
    """Write comprehensive combo performance report to file"""
    with open(f'{reports_dir}/combo_performance_summary.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - SPECIFIC UPGRADE COMBO PERFORMANCE ANALYSIS\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows how specific two-upgrade combinations perform compared to base attacks.\n")
        f.write("Focus on cheap, synergistic combinations that work well together.\n")
        f.write("Improvements are measured in Damage Per Turn (DPT) increases across all enemy scenarios.\n\n")

        # Sort by cost effectiveness
        sorted_combos = sorted(combo_results.values(), key=lambda x: x['cost_effectiveness'], reverse=True)

        f.write("COMBO COST-EFFECTIVENESS RANKING\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Combo':<35} {'Cost':<6} {'Avg DPT+':<10} {'Avg %+':<10} {'DPT/Cost':<10}\n")
        f.write("-" * 80 + "\n")

        for i, combo_data in enumerate(sorted_combos, 1):
            f.write(f"{i:<4} {combo_data['name']:<35} {combo_data['cost']:>4}p "
                   f"{combo_data['overall_avg_improvement']:>8.1f} "
                   f"{(combo_data['overall_avg_improvement']/combo_data['overall_avg_dpt']*100) if combo_data['overall_avg_dpt'] > 0 else 0:>8.1f}% "
                   f"{combo_data['cost_effectiveness']:>8.2f}\n")

        # Sort by absolute DPT improvement
        sorted_by_dpt = sorted(combo_results.values(), key=lambda x: x['overall_avg_improvement'], reverse=True)

        f.write(f"\n\nCOMBO ABSOLUTE DPT IMPROVEMENT RANKING\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Combo':<35} {'Cost':<6} {'Avg DPT+':<10} {'Best Attack Type':<15}\n")
        f.write("-" * 80 + "\n")

        for i, combo_data in enumerate(sorted_by_dpt, 1):
            # Find best attack type for this combo
            best_attack_type = ""
            best_improvement = 0
            for attack_type, results in combo_data['attack_type_results'].items():
                if results['avg_improvement'] > best_improvement:
                    best_improvement = results['avg_improvement']
                    best_attack_type = f"{attack_type} (+{best_improvement:.1f})"

            f.write(f"{i:<4} {combo_data['name']:<35} {combo_data['cost']:>4}p "
                   f"{combo_data['overall_avg_improvement']:>8.1f} {best_attack_type:<15}\n")

        # Detailed per-combo analysis
        f.write(f"\n\nDETAILED COMBO ANALYSIS\n")
        f.write("="*80 + "\n")

        for combo_name, combo_data in sorted(combo_results.items()):
            f.write(f"\n{combo_data['name'].upper()}\n")
            f.write(f"Upgrades: {', '.join(combo_data['upgrades'])}\n")
            f.write(f"Cost: {combo_data['cost']} points | Overall Avg DPT Improvement: {combo_data['overall_avg_improvement']:.1f} | Cost Effectiveness: {combo_data['cost_effectiveness']:.2f}\n")
            f.write("-" * 60 + "\n")

            for attack_type, results in combo_data['attack_type_results'].items():
                f.write(f"{attack_type.title()}: Base {results['avg_base_dpt']:.1f} DPT → {results['avg_combo_dpt']:.1f} DPT "
                       f"(+{results['avg_improvement']:.1f}, {results['avg_percent_improvement']:+.1f}%)\n")

    print(f"Combo performance report saved to {reports_dir}/combo_performance_summary.txt")


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
    attack_type_rankings = {}  # attack_type -> list of ranking positions
    combo_rankings = {}    # combo_name -> list of ranking positions

    # Process each build result to track enhancement positions
    for rank, (build, dpt) in enumerate(all_build_results, 1):
        # Track attack type rankings
        if build.attack_type not in attack_type_rankings:
            attack_type_rankings[build.attack_type] = []
        attack_type_rankings[build.attack_type].append(rank)

        # Track upgrade rankings (upgrades are enhancements)
        for upgrade in build.upgrades:
            if upgrade not in enhancement_rankings:
                enhancement_rankings[upgrade] = []
            enhancement_rankings[upgrade].append(rank)

        # Track limit rankings (limits are enhancements)
        for limit in build.limits:
            if limit not in enhancement_rankings:
                enhancement_rankings[limit] = []
            enhancement_rankings[limit].append(rank)

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
        percentile = (avg_position / total_builds) * 100
        enhancement_stats.append({
            'name': enhancement_name,
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

    # Calculate statistics for combos
    combo_stats = []
    for combo_name, positions in combo_rankings.items():
        avg_position = sum(positions) / len(positions)
        percentile = (avg_position / total_builds) * 100
        combo_stats.append({
            'name': combo_name,
            'avg_rank': avg_position,
            'percentile': percentile,
            'appearances': len(positions),
            'best_rank': min(positions),
            'worst_rank': max(positions)
        })

    # Sort by average rank (lower is better)
    enhancement_stats.sort(key=lambda x: x['avg_rank'])
    attack_type_stats.sort(key=lambda x: x['avg_rank'])
    combo_stats.sort(key=lambda x: x['avg_rank'])

    # Write the report
    with open(f'{reports_dir}/enhancement_ranking_report.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - ENHANCEMENT & ATTACK TYPE RANKING REPORT\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows enhancement (upgrade & limit) and attack type performance based on average ranking\n")
        f.write("positions across all tested builds. Lower percentiles indicate better performance.\n")
        f.write(f"Total builds tested: {total_builds}\n\n")

        # Enhancement Rankings Section
        f.write("ENHANCEMENT RANKINGS BY AVERAGE POSITION\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Enhancement':<25} {'Avg Rank':<10} {'Percentile':<12} {'Uses':<6} {'Best':<6} {'Worst':<6}\n")
        f.write("-" * 80 + "\n")

        for i, stats in enumerate(enhancement_stats, 1):
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

        # Combo Rankings Section (if any combos found)
        if combo_stats:
            f.write(f"\n\nSPECIFIC UPGRADE COMBO RANKINGS BY AVERAGE POSITION\n")
            f.write("-" * 90 + "\n")
            f.write(f"{'Rank':<4} {'Upgrade Combo':<35} {'Avg Rank':<10} {'Percentile':<12} {'Uses':<6} {'Best':<6} {'Worst':<6}\n")
            f.write("-" * 90 + "\n")

            for i, stats in enumerate(combo_stats, 1):
                f.write(f"{i:<4} {stats['name']:<35} {stats['avg_rank']:>8.1f} "
                       f"{stats['percentile']:>9.1f}% {stats['appearances']:>4} "
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

    print(f"Upgrade pairing analysis report saved to {reports_dir}/upgrade_pairing_analysis.txt")


def generate_diagnostic_base_attacks_report(config: SimulationConfig, reports_dir: str = "reports"):
    """Generate diagnostic report for base attack types across all scenarios"""
    print("Generating base attacks diagnostic report...")

    from game_data import ATTACK_TYPES
    from simulation import simulate_combat_verbose

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

    from game_data import UPGRADES, RuleValidator
    from simulation import simulate_combat_verbose

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
            from game_data import PREREQUISITES
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

    from game_data import LIMITS
    from simulation import simulate_combat_verbose

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

    from game_data import UPGRADES, LIMITS, RuleValidator

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
                if upgrade_cost > config.max_points:
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
                            attacker, base_build, config.num_runs, config.target_hp, defender,
                            num_enemies=num_enemies, enemy_hp=enemy_hp)

                        # Test upgrade performance
                        upgrade_results, upgrade_avg_turns, upgrade_dpt = run_simulation_batch(
                            attacker, upgrade_build, config.num_runs, config.target_hp, defender,
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
                if limit_cost > config.max_points:
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
                            attacker, base_build, config.num_runs, config.target_hp, defender,
                            num_enemies=num_enemies, enemy_hp=enemy_hp)

                        # Test limit performance
                        limit_results, limit_avg_turns, limit_dpt = run_simulation_batch(
                            attacker, limit_build, config.num_runs, config.target_hp, defender,
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
                    attacker, build, config.num_runs, config.target_hp, defender)

                f.write(f"Individual results: {results}\n")
                f.write(f"Average turns to kill: {avg_turns:.1f}\n")
                f.write(f"Damage per turn: {dpt:.1f}\n\n")

    print(f"Individual build report saved to {reports_dir}/{filename}")


def write_build_summary(builds: List[AttackBuild], config: SimulationConfig, reports_dir: str = "reports"):
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

    with open(f'{reports_dir}/build_summary.txt', 'w', encoding='utf-8') as f:
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

    print(f"Build summary saved to {reports_dir}/build_summary.txt")


def write_attack_type_enhancement_ranking_report(all_build_results: List[Tuple], enhancement_results: Dict, config: SimulationConfig, reports_dir: str = "reports"):
    """Generate comprehensive enhancement ranking reports broken down by attack type"""
    print("Generating attack-type-specific enhancement ranking report...")

    # Get all attack types
    attack_types = config.attack_types_filter if config.attack_types_filter else ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    with open(f'{reports_dir}/enhancement_ranking_by_attack_type.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - ENHANCEMENT RANKINGS BROKEN DOWN BY ATTACK TYPE\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows enhancement (upgrade & limit) performance rankings specifically for each attack type.\n")
        f.write("Three ranking methods are provided for each attack type:\n")
        f.write("1. Rankings by Average Position - based on build rank positions\n")
        f.write("2. Cost-Effectiveness Rankings - DPT improvement per point cost\n")
        f.write("3. Absolute DPT Improvement Rankings - raw DPT increases\n\n")

        for attack_type in attack_types:
            f.write(f"{'='*80}\n")
            f.write(f"ATTACK TYPE: {attack_type.upper()}\n")
            f.write(f"{'='*80}\n\n")

            # Filter builds for this attack type and track enhancement positions
            attack_type_builds = [(build, dpt, rank) for rank, (build, dpt) in enumerate(all_build_results, 1)
                                 if build.attack_type == attack_type]

            if not attack_type_builds:
                f.write(f"No builds found for attack type: {attack_type}\n\n")
                continue

            # Calculate enhancement rankings by average position for this attack type
            enhancement_rankings = {}
            for build, dpt, rank in attack_type_builds:
                # Track both upgrades and limits as enhancements
                for upgrade in build.upgrades:
                    if upgrade not in enhancement_rankings:
                        enhancement_rankings[upgrade] = []
                    enhancement_rankings[upgrade].append(rank)
                for limit in build.limits:
                    if limit not in enhancement_rankings:
                        enhancement_rankings[limit] = []
                    enhancement_rankings[limit].append(rank)

            # Calculate statistics for each enhancement
            enhancement_stats = []
            total_attack_type_builds = len(attack_type_builds)
            for enhancement_name, positions in enhancement_rankings.items():
                avg_position = sum(positions) / len(positions)
                percentile = (avg_position / total_attack_type_builds) * 100
                enhancement_stats.append({
                    'name': enhancement_name,
                    'avg_rank': avg_position,
                    'percentile': percentile,
                    'appearances': len(positions),
                    'best_rank': min(positions),
                    'worst_rank': max(positions)
                })

            enhancement_stats.sort(key=lambda x: x['avg_rank'])

            # 1. RANKINGS BY AVERAGE POSITION
            f.write(f"ENHANCEMENT RANKINGS BY AVERAGE POSITION - {attack_type.upper()}\n")
            f.write("-" * 80 + "\n")
            f.write(f"{'Rank':<4} {'Enhancement':<25} {'Avg Rank':<10} {'Percentile':<12} {'Uses':<6} {'Best':<6} {'Worst':<6}\n")
            f.write("-" * 80 + "\n")

            for i, stats in enumerate(enhancement_stats, 1):
                f.write(f"{i:<4} {stats['name']:<25} {stats['avg_rank']:>8.1f} "
                       f"{stats['percentile']:>9.1f}% {stats['appearances']:>4} "
                       f"{stats['best_rank']:>4} {stats['worst_rank']:>5}\n")

            # 2. COST-EFFECTIVENESS RANKINGS
            f.write(f"\n\nENHANCEMENT COST-EFFECTIVENESS RANKING - {attack_type.upper()}\n")
            f.write("-" * 80 + "\n")
            f.write(f"{'Rank':<4} {'Enhancement':<25} {'Cost':<6} {'Avg DPT+':<10} {'Avg %+':<10} {'DPT/Cost':<10}\n")
            f.write("-" * 80 + "\n")

            # Get cost-effectiveness data for this attack type
            cost_eff_data = []
            for enhancement_name, enhancement_data in enhancement_results.items():
                if attack_type in enhancement_data['attack_type_results']:
                    attack_results = enhancement_data['attack_type_results'][attack_type]
                    cost = enhancement_data['cost']
                    improvement = attack_results['avg_improvement']
                    cost_effectiveness = improvement / cost if cost > 0 else 0
                    percent_improvement = attack_results['avg_percent_improvement']

                    cost_eff_data.append({
                        'name': enhancement_name,
                        'cost': cost,
                        'improvement': improvement,
                        'percent_improvement': percent_improvement,
                        'cost_effectiveness': cost_effectiveness
                    })

            cost_eff_data.sort(key=lambda x: x['cost_effectiveness'], reverse=True)

            for i, data in enumerate(cost_eff_data, 1):
                f.write(f"{i:<4} {data['name']:<25} {data['cost']:>4}p "
                       f"{data['improvement']:>8.1f} "
                       f"{data['percent_improvement']:>8.1f}% "
                       f"{data['cost_effectiveness']:>8.2f}\n")

            # 3. ABSOLUTE DPT IMPROVEMENT RANKINGS
            f.write(f"\n\nENHANCEMENT ABSOLUTE DPT IMPROVEMENT RANKING - {attack_type.upper()}\n")
            f.write("-" * 80 + "\n")
            f.write(f"{'Rank':<4} {'Enhancement':<25} {'Cost':<6} {'Avg DPT+':<10} {'% Improvement':<12}\n")
            f.write("-" * 80 + "\n")

            # Sort by absolute DPT improvement
            abs_improvement_data = sorted(cost_eff_data, key=lambda x: x['improvement'], reverse=True)

            for i, data in enumerate(abs_improvement_data, 1):
                f.write(f"{i:<4} {data['name']:<25} {data['cost']:>4}p "
                       f"{data['improvement']:>8.1f} "
                       f"{data['percent_improvement']:>10.1f}%\n")

            f.write(f"\n{'-'*80}\n\n")

    print(f"Attack-type-specific enhancement ranking report saved to {reports_dir}/enhancement_ranking_by_attack_type.txt")


def write_attack_type_limit_ranking_report(all_build_results: List[Tuple], limit_results: Dict, config: SimulationConfig, reports_dir: str = "reports"):
    """Generate comprehensive limit ranking reports broken down by attack type"""
    print("Generating attack-type-specific limit ranking report...")

    # Get all attack types
    attack_types = config.attack_types_filter if config.attack_types_filter else ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    with open(f'{reports_dir}/limit_ranking_by_attack_type.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - LIMIT RANKINGS BROKEN DOWN BY ATTACK TYPE\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows limit performance rankings specifically for each attack type.\n")
        f.write("Three ranking methods are provided for each attack type:\n")
        f.write("1. Rankings by Average Position - based on build rank positions\n")
        f.write("2. Cost-Effectiveness Rankings - DPT improvement per point cost\n")
        f.write("3. Absolute DPT Improvement Rankings - raw DPT increases\n\n")

        for attack_type in attack_types:
            f.write(f"{'='*80}\n")
            f.write(f"ATTACK TYPE: {attack_type.upper()}\n")
            f.write(f"{'='*80}\n\n")

            # Filter builds for this attack type and track limit positions
            attack_type_builds = [(build, dpt, rank) for rank, (build, dpt) in enumerate(all_build_results, 1)
                                 if build.attack_type == attack_type]

            if not attack_type_builds:
                f.write(f"No builds found for attack type: {attack_type}\n\n")
                continue

            # Calculate limit rankings by average position for this attack type
            limit_rankings = {}
            for build, dpt, rank in attack_type_builds:
                for limit in build.limits:
                    if limit not in limit_rankings:
                        limit_rankings[limit] = []
                    limit_rankings[limit].append(rank)

            # Calculate statistics for each limit
            limit_stats = []
            total_attack_type_builds = len(attack_type_builds)
            for limit_name, positions in limit_rankings.items():
                avg_position = sum(positions) / len(positions)
                percentile = (avg_position / total_attack_type_builds) * 100
                limit_stats.append({
                    'name': limit_name,
                    'avg_rank': avg_position,
                    'percentile': percentile,
                    'appearances': len(positions),
                    'best_rank': min(positions),
                    'worst_rank': max(positions)
                })

            limit_stats.sort(key=lambda x: x['avg_rank'])

            # 1. RANKINGS BY AVERAGE POSITION
            f.write(f"LIMIT RANKINGS BY AVERAGE POSITION - {attack_type.upper()}\n")
            f.write("-" * 80 + "\n")
            f.write(f"{'Rank':<4} {'Limit':<25} {'Avg Rank':<10} {'Percentile':<12} {'Uses':<6} {'Best':<6} {'Worst':<6}\n")
            f.write("-" * 80 + "\n")

            for i, stats in enumerate(limit_stats, 1):
                f.write(f"{i:<4} {stats['name']:<25} {stats['avg_rank']:>8.1f} "
                       f"{stats['percentile']:>9.1f}% {stats['appearances']:>4} "
                       f"{stats['best_rank']:>4} {stats['worst_rank']:>5}\n")

            # 2. COST-EFFECTIVENESS RANKINGS
            f.write(f"\n\nLIMIT COST-EFFECTIVENESS RANKING - {attack_type.upper()}\n")
            f.write("-" * 80 + "\n")
            f.write(f"{'Rank':<4} {'Limit':<25} {'Cost':<6} {'Avg DPT+':<10} {'Avg %+':<10} {'DPT/Cost':<10}\n")
            f.write("-" * 80 + "\n")

            # Get cost-effectiveness data for this attack type
            cost_eff_data = []
            for limit_name, limit_data in limit_results.items():
                if attack_type in limit_data['attack_type_results']:
                    attack_results = limit_data['attack_type_results'][attack_type]
                    cost = limit_data['cost']
                    improvement = attack_results['avg_improvement']
                    cost_effectiveness = improvement / cost if cost > 0 else 0
                    percent_improvement = attack_results['avg_percent_improvement']

                    cost_eff_data.append({
                        'name': limit_name,
                        'cost': cost,
                        'improvement': improvement,
                        'percent_improvement': percent_improvement,
                        'cost_effectiveness': cost_effectiveness
                    })

            cost_eff_data.sort(key=lambda x: x['cost_effectiveness'], reverse=True)

            for i, data in enumerate(cost_eff_data, 1):
                f.write(f"{i:<4} {data['name']:<25} {data['cost']:>4}p "
                       f"{data['improvement']:>8.1f} "
                       f"{data['percent_improvement']:>8.1f}% "
                       f"{data['cost_effectiveness']:>8.2f}\n")

            # 3. ABSOLUTE DPT IMPROVEMENT RANKINGS
            f.write(f"\n\nLIMIT ABSOLUTE DPT IMPROVEMENT RANKING - {attack_type.upper()}\n")
            f.write("-" * 80 + "\n")
            f.write(f"{'Rank':<4} {'Limit':<25} {'Cost':<6} {'Avg DPT+':<10} {'% Improvement':<12}\n")
            f.write("-" * 80 + "\n")

            # Sort by absolute DPT improvement
            abs_improvement_data = sorted(cost_eff_data, key=lambda x: x['improvement'], reverse=True)

            for i, data in enumerate(abs_improvement_data, 1):
                f.write(f"{i:<4} {data['name']:<25} {data['cost']:>4}p "
                       f"{data['improvement']:>8.1f} "
                       f"{data['percent_improvement']:>10.1f}%\n")

            f.write(f"\n{'-'*80}\n\n")

    print(f"Attack-type-specific limit ranking report saved to {reports_dir}/limit_ranking_by_attack_type.txt")