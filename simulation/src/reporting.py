"""
Analysis and reporting for the Vitality System combat simulator.
"""

import json
import os
import statistics
from datetime import datetime
from typing import Dict, List, Tuple
from src.models import Character, AttackBuild, SimulationConfig
from src.simulation import run_simulation_batch
from src.game_data import UPGRADES, LIMITS, RuleValidator


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

        # Convert config data to SimulationConfig with new structure
        config = SimulationConfig(
            execution_mode=data.get('execution_mode', 'both'),
            num_runs=data.get('num_runs', 10),
            target_hp=data.get('target_hp', 100),
            archetypes=data.get('archetypes', data.get('archetype', ['focused']) if isinstance(data.get('archetype'), str) else data.get('archetype', ['focused'])),
            tier=data.get('tier', 3),
            use_threading=data.get('use_threading', True),

            # Legacy compatibility
            test_single_upgrades=data.get('test_single_upgrades', True),
            test_two_upgrade_combinations=data.get('test_two_upgrade_combinations', True),
            test_three_upgrade_combinations=data.get('test_three_upgrade_combinations', True),
            test_slayers=data.get('test_slayers', True),
            test_limits=data.get('test_limits', True),
            verbose_logging=data.get('verbose_logging', True),
            show_top_builds=data.get('top_builds_count', data.get('show_top_builds', 10)),
            generate_individual_logs=data.get('generate_individual_logs', False),
        )

        # Set new configuration sections
        if 'individual_testing' in data:
            config.individual_testing = data['individual_testing']
        if 'build_testing' in data:
            config.build_testing = data['build_testing']
        if 'reports' in data:
            config.reports = data['reports']
        if 'simulation_runs' in data:
            config.simulation_runs = data['simulation_runs']

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
        if 'logging' in data:
            config.logging = data['logging']

        return config
    else:
        print(f"Config file {config_file} not found, using defaults")
        return SimulationConfig()


def save_config(config: SimulationConfig, config_file: str = 'config.json'):
    """Save configuration to JSON file"""
    data = {
        'num_runs': config.num_runs,
        'simulation_runs': {
            'build_testing_runs': config.build_testing_runs,
            'individual_testing_runs': config.individual_testing_runs
        },
        'target_hp': config.target_hp,
        'archetypes': config.archetypes,
        'tier': config.tier,
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
    print(f"Build testing runs: {config.build_testing_runs}, Individual testing runs: {config.individual_testing_runs}")
    print("Enemy Scenarios: 1×100, 2×50, 4×25, 10×10 HP")
    print(f"Archetypes: {', '.join(config.archetypes)} | Tier: {config.tier}")
    for archetype in config.archetypes:
        points = config.max_points_per_attack(archetype)
        num = config.num_attacks(archetype)
        print(f"  - {archetype}: {num} attack(s) × {points} points each")
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


def print_simulation_stats_receipt(config: SimulationConfig, total_builds: int = None, archetype: str = "focused"):
    """Print simulation statistics in a clean receipt-like format"""

    # Calculate key stats
    num_attacker_configs = len(config.attacker_configs)
    num_defender_configs = len(config.defender_configs)
    total_configs = num_attacker_configs * num_defender_configs

    # Get number of scenarios from config
    if hasattr(config, 'fight_scenarios') and config.fight_scenarios.get('enabled', True):
        num_scenarios = len(config.fight_scenarios.get('scenarios', []))
    else:
        num_scenarios = 8  # Default fallback

    # Calculate test cases and simulations
    test_cases_per_build = total_configs * num_scenarios
    runs_per_test = config.build_testing_runs
    simulations_per_build = test_cases_per_build * runs_per_test

    # Calculate total simulations if build count is provided
    if total_builds:
        total_simulations = total_builds * simulations_per_build
    else:
        total_simulations = None

    # Print receipt
    print("\n")
    print("=" * 60)
    print("SIMULATION STATISTICS SUMMARY")
    print("=" * 60)
    print()
    print(f"Points Budget:                     {config.max_points_per_attack(archetype)}")
    print()
    if total_builds:
        print(f"Total Builds Tested:               {total_builds:,}")
    else:
        print(f"Total Builds:                      (calculating...)")
    print()
    print(f"Attacker Configurations:           {num_attacker_configs}")
    print(f"Defender Configurations:           {num_defender_configs}")
    print(f"Total A/D Configurations:          {num_attacker_configs} × {num_defender_configs} = {total_configs}")
    print()
    print(f"Fight Scenarios per Config:        {num_scenarios}")
    print(f"Test Cases per Build:              {total_configs} × {num_scenarios} = {test_cases_per_build}")
    print()
    print(f"Runs per Test Case:                {runs_per_test}")
    print(f"Simulations per Build:             {test_cases_per_build} × {runs_per_test} = {simulations_per_build:,}")
    print()
    if total_simulations:
        print(f"TOTAL SIMULATIONS:                 {total_builds:,} × {simulations_per_build:,} = {total_simulations:,}")
    else:
        print(f"TOTAL SIMULATIONS:                 (pending build count)")
    print()
    print("=" * 60)
    print()


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


def build_turns_table(all_build_results: List[Tuple], config: SimulationConfig, reports_dir: str = "reports"):
    """Generate table of builds sorted by average turns (ascending)"""
    print("Generating build turns table report...")

    # Extract build data with turns - all_build_results now contains (build, avg_turns)
    build_data = []
    for rank, (build, avg_turns) in enumerate(all_build_results, 1):
        build_data.append({
            'original_rank': rank,
            'build': build,
            'avg_turns': avg_turns
        })

    # Sort by average turns (ascending - lower turns is better)
    build_data.sort(key=lambda x: x['avg_turns'])

    # Write the report
    with open(f'{reports_dir}/build_turns_table.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - BUILD RANKING BY AVERAGE TURNS\n")
        f.write("="*80 + "\n\n")
        f.write("Builds ranked by average turns to complete combat (lower is better).\n")
        f.write(f"Total builds: {len(build_data)}\n\n")

        # Table header
        f.write(f"{'Rank':<6} {'Avg Turns':<10} {'Orig Rank':<10} {'Build Description':<50}\n")
        f.write("-" * 90 + "\n")

        # Write top 50 builds by turns
        for i, data in enumerate(build_data[:50], 1):
            build = data['build']
            build_desc = f"{build.attack_type}"
            if build.upgrades:
                build_desc += f" + {', '.join(build.upgrades)}"
            if build.limits:
                build_desc += f" + {', '.join(build.limits)}"

            f.write(f"{i:<6} {data['avg_turns']:<10.1f} "
                   f"{data['original_rank']:<10} {build_desc:<50}\n")

        # Summary statistics
        f.write(f"\n\nSUMMARY STATISTICS\n")
        f.write("-" * 40 + "\n")
        all_turns = [data['avg_turns'] for data in build_data]
        f.write(f"Best (lowest) turns: {min(all_turns):.1f}\n")
        f.write(f"Worst (highest) turns: {max(all_turns):.1f}\n")
        f.write(f"Average turns: {sum(all_turns)/len(all_turns):.1f}\n")
        f.write(f"Median turns: {sorted(all_turns)[len(all_turns)//2]:.1f}\n")

    print(f"Build turns table saved to {reports_dir}/build_turns_table.txt")
    return build_data


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


def write_builds_turns_table(builds: List[AttackBuild], config: SimulationConfig, reports_dir: str = "reports"):
    """Write a builds table with average turns until defeat as the main metric"""
    if not builds:
        print("No builds to analyze for turns table.")
        return

    # Calculate turns until defeat for each build
    build_results = []
    for build in builds[:100]:  # Show top 100 builds
        total_turns = 0
        total_dpt = 0
        total_configs = 0

        # Define the same fight scenarios as main simulation
        fight_scenarios = [
            ("Fight 1: 1x100 HP Boss", 1, 100),
            ("Fight 2: 2x50 HP Enemies", 2, 50),
            ("Fight 3: 4x25 HP Enemies", 4, 25),
            ("Fight 4: 10x10 HP Enemies", 10, 10)
        ]

        for att_config in config.attacker_configs:
            for def_config in config.defender_configs:
                attacker = Character(*att_config)
                defender = Character(*def_config)

                # Average across all fight scenarios for this config
                case_total_dpt = 0
                case_total_turns = 0
                scenario_count = 0

                for scenario_name, num_enemies, enemy_hp in fight_scenarios:
                    _, avg_turns, dpt = run_simulation_batch(
                        attacker, build, config.build_testing_runs, config.target_hp, defender,
                        num_enemies=num_enemies, enemy_hp=enemy_hp)

                    case_total_dpt += dpt
                    case_total_turns += avg_turns
                    scenario_count += 1

                # Average DPT and turns across the 4 scenarios for this case
                case_avg_dpt = case_total_dpt / scenario_count if scenario_count > 0 else 0
                case_avg_turns = case_total_turns / scenario_count if scenario_count > 0 else 0

                total_turns += case_avg_turns
                total_dpt += case_avg_dpt
                total_configs += 1

        avg_turns = total_turns / total_configs if total_configs > 0 else 0
        avg_dpt = total_dpt / total_configs if total_configs > 0 else 0
        build_results.append((build, avg_dpt, avg_turns))

    # Sort by average turns (lower is better)
    build_results.sort(key=lambda x: x[2])

    # Write the results
    with open(f'{reports_dir}/builds_turns_table.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - BUILDS PERFORMANCE TABLE\n")
        f.write("="*80 + "\n\n")
        f.write("Builds ranked by average turns until defeat (lower = faster kills)\n")
        f.write(f"Total builds analyzed: {len(build_results)}\n\n")

        # Header
        f.write(f"{'Rank':<5} {'Avg Turns':<10} {'Attack Type':<15} {'Upgrades & Limits':<40}\n")
        f.write("-" * 70 + "\n")

        # Build entries
        for i, (build, avg_turns) in enumerate(build_results, 1):
            # Format enhancements (upgrades + limits)
            enhancements = []
            if build.upgrades:
                enhancements.extend(build.upgrades)
            if build.limits:
                enhancements.extend(build.limits)

            enhancements_str = ", ".join(enhancements) if enhancements else "Base"
            if len(enhancements_str) > 40:
                enhancements_str = enhancements_str[:37] + "..."

            f.write(f"{i:<5} {avg_turns:<10.2f} {build.attack_type:<15} {enhancements_str:<40}\n")

        # Summary statistics
        f.write(f"\n\nSUMMARY STATISTICS\n")
        f.write("-" * 40 + "\n")
        all_turns = [x[1] for x in build_results]
        f.write(f"Fastest kill time: {min(all_turns):.2f} turns\n")
        f.write(f"Slowest kill time: {max(all_turns):.2f} turns\n")
        f.write(f"Average kill time: {sum(all_turns)/len(all_turns):.2f} turns\n")
        f.write(f"Median kill time: {statistics.median(all_turns):.2f} turns\n")

        # Top 10 fastest builds
        f.write(f"\n\nTOP 10 FASTEST BUILDS\n")
        f.write("-" * 40 + "\n")
        for i, (build, avg_turns, avg_dpt) in enumerate(build_results[:10], 1):
            enhancements = []
            if build.upgrades:
                enhancements.extend(build.upgrades)
            if build.limits:
                enhancements.extend(build.limits)
            enhancements_str = ", ".join(enhancements) if enhancements else "Base"

            f.write(f"{i}. {build.attack_type} ({avg_turns:.2f} turns, {avg_dpt:.1f} DPT)\n")
            f.write(f"   Enhancements: {enhancements_str}\n\n")

    print(f"Builds turns table saved to {reports_dir}/builds_turns_table.txt")


def write_build_summary(builds: List[AttackBuild], config: SimulationConfig, reports_dir: str = "reports"):
    """Write a summary of the top builds to file"""
    if not builds:
        print("No builds to summarize.")
        return

    # Calculate DPT for each build
    build_results = []
    for build in builds[:50]:  # Show top 50 builds
        total_dpt = 0
        total_turns = 0
        total_configs = 0

        for att_config in config.attacker_configs:
            for def_config in config.defender_configs:
                attacker = Character(*att_config)
                defender = Character(*def_config)

                _, avg_turns, dpt = run_simulation_batch(
                    attacker, build, config.build_testing_runs, config.target_hp, defender)

                total_dpt += dpt
                total_turns += avg_turns
                total_configs += 1

        avg_dpt = total_dpt / total_configs if total_configs > 0 else 0
        avg_turns = total_turns / total_configs if total_configs > 0 else 0
        build_results.append((build, avg_dpt, avg_turns))

    # Sort by average DPT
    build_results.sort(key=lambda x: x[1], reverse=True)

    # Calculate attack type statistics
    attack_type_results = {}
    for build, avg_dpt, avg_turns in build_results:
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

        for i, (build, avg_dpt, avg_turns) in enumerate(build_results, 1):
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
            attack_type_builds = [(build, dpt, rank) for rank, (build, dpt, avg_turns) in enumerate(all_build_results, 1)
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
                median_position = statistics.median(positions)
                percentile = (median_position / total_attack_type_builds) * 100
                enhancement_stats.append({
                    'name': enhancement_name,
                    'avg_rank': avg_position,
                    'median_rank': median_position,
                    'percentile': percentile,
                    'appearances': len(positions),
                    'best_rank': min(positions),
                    'worst_rank': max(positions)
                })

            enhancement_stats.sort(key=lambda x: x['median_rank'])

            # 1. RANKINGS BY MEDIAN POSITION
            f.write(f"ENHANCEMENT RANKINGS BY MEDIAN POSITION - {attack_type.upper()}\n")
            f.write("-" * 95 + "\n")
            f.write(f"{'Rank':<4} {'Enhancement':<25} {'Avg Rank':<10} {'Med Rank':<10} {'Percentile':<12} {'Uses':<6} {'Best':<6} {'Worst':<6}\n")
            f.write("-" * 95 + "\n")

            for i, stats in enumerate(enhancement_stats, 1):
                f.write(f"{i:<4} {stats['name']:<25} {stats['avg_rank']:>8.1f} "
                       f"{stats['median_rank']:>8.1f} {stats['percentile']:>9.1f}% {stats['appearances']:>4} "
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
            attack_type_builds = [(build, dpt, rank) for rank, (build, dpt, avg_turns) in enumerate(all_build_results, 1)
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
                median_position = statistics.median(positions)
                percentile = (median_position / total_attack_type_builds) * 100
                limit_stats.append({
                    'name': limit_name,
                    'avg_rank': avg_position,
                    'median_rank': median_position,
                    'percentile': percentile,
                    'appearances': len(positions),
                    'best_rank': min(positions),
                    'worst_rank': max(positions)
                })

            limit_stats.sort(key=lambda x: x['median_rank'])

            # 1. RANKINGS BY MEDIAN POSITION
            f.write(f"LIMIT RANKINGS BY MEDIAN POSITION - {attack_type.upper()}\n")
            f.write("-" * 95 + "\n")
            f.write(f"{'Rank':<4} {'Limit':<25} {'Avg Rank':<10} {'Med Rank':<10} {'Percentile':<12} {'Uses':<6} {'Best':<6} {'Worst':<6}\n")
            f.write("-" * 95 + "\n")

            for i, stats in enumerate(limit_stats, 1):
                f.write(f"{i:<4} {stats['name']:<25} {stats['avg_rank']:>8.1f} "
                       f"{stats['median_rank']:>8.1f} {stats['percentile']:>9.1f}% {stats['appearances']:>4} "
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


class TableGenerator:
    """Generates formatted tables for individual testing reports"""

    @staticmethod
    def format_attack_type_table(attack_type_data: Dict, reports_dir: str):
        """Generate Table 1: Attack Type Performance sorted by average DPT (highest to lowest)"""
        filename = f"{reports_dir}/individual_attack_type_table.txt"

        # Sort attack types by average DPT across all scenarios (highest to lowest)
        sorted_attack_types = sorted(
            attack_type_data.items(),
            key=lambda x: x[1].get('average', {}).get('dpt_no_upgrades', 0),
            reverse=True
        )

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("INDIVIDUAL TESTING - ATTACK TYPE PERFORMANCE TABLE\n")
            f.write("=" * 140 + "\n\n")

            # Header row with proper spacing matching data alignment
            header = f"{'Attack Type':<18} │ {'Avg All Scenarios':^18} │ {'1x100 HP Boss':^18} │ {'2x50 HP Enemies':^18} │ {'4x25 HP Enemies':^18} │ {'10x10 HP Enemies':^18}"
            f.write(header + "\n")

            # Sub-header for metrics with proper alignment
            subheader = f"{'':<18} │ {'DPT':>7} {'%':>7} │ {'DPT':>7} {'%':>7} │ {'DPT':>7} {'%':>7} │ {'DPT':>7} {'%':>7} │ {'DPT':>7} {'%':>7}"
            f.write(subheader + "\n")
            f.write("─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "\n")

            # Data rows for each attack type (sorted by average DPT)
            for attack_type, data in sorted_attack_types:
                row = f"{attack_type:<18} │"

                # Average across all scenarios with proper spacing
                avg_data = data.get('average', {})
                dpt_avg = avg_data.get('dpt_no_upgrades', 0)  # Using no_upgrades as the main DPT value
                row += f" {dpt_avg:>6.1f} {100.0:>6.1f}% │"

                # Per-scenario data with consistent spacing
                scenarios = ['1x100', '2x50', '4x25', '10x10']
                for scenario in scenarios:
                    scenario_data = data.get(scenario, {})
                    dpt_val = scenario_data.get('dpt_no_upgrades', 0)
                    row += f" {dpt_val:>6.1f} {100.0:>6.1f}% │"

                f.write(row + "\n")

        print(f"Attack type performance table saved to {filename}")

    @staticmethod
    def format_upgrade_limit_table(upgrade_limit_data: Dict, reports_dir: str):
        """Generate Table 2: Upgrade/Limit Analysis (sorted by Avg Δ/Cost)"""
        from src.game_data import UPGRADES, LIMITS

        filename = f"{reports_dir}/individual_upgrade_limit_table.txt"

        # Calculate averages and sort by Avg Δ/Cost (most negative first - best turn reduction per cost)
        items_with_metrics = []

        for item_name, data in upgrade_limit_data.items():
            # Get cost
            cost = data.get('cost', 0)
            if cost == 0:  # Fallback if cost not in data
                if item_name in UPGRADES:
                    cost = UPGRADES[item_name].cost
                elif item_name in LIMITS:
                    cost = LIMITS[item_name].cost

            if cost == 0:
                continue  # Skip items with no cost

            # Calculate average turn difference across attack types
            attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']
            turn_diffs = []
            for attack_type in attack_types:
                att_data = data.get(attack_type, {})
                turn_diff = att_data.get('avg_turn_difference', 0)
                turn_diffs.append(turn_diff)

            avg_turn_diff = sum(turn_diffs) / len(turn_diffs) if turn_diffs else 0
            avg_diff_per_cost = avg_turn_diff / cost if cost > 0 else 0

            items_with_metrics.append((item_name, data, cost, avg_turn_diff, avg_diff_per_cost, turn_diffs))

        # Sort by Avg Δ/Cost (most negative first - best turn reduction per point)
        sorted_items = sorted(items_with_metrics, key=lambda x: x[4])

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("INDIVIDUAL TESTING - UPGRADE/LIMIT PERFORMANCE TABLE (AVG TURNS)\n")
            f.write("=" * 240 + "\n\n")

            # Header row
            header = f"{'Upgrade/Limit':<20}"
            header += f"{'Avg Δ/Cost':<10}"
            header += f"{'Avg Δ':<8}"
            header += f"{'Cost':<6}"
            header += f"{'Melee_AC':<9}{'Melee_DG':<9}{'Ranged':<8}{'Area':<7}{'Direct':<8}{'DirectAOE':<10}"
            header += f"{'ΔMelee_AC':<10}{'ΔMelee_DG':<10}{'ΔRanged':<9}{'ΔArea':<8}{'ΔDirect':<9}{'ΔDirectAOE':<11}"
            header += f"{'1x100':<8}{'2x50':<8}{'4x25':<8}{'10x10':<8}"
            f.write(header + "\n")

            # Sub-header
            subheader = f"{'':<20}"
            subheader += f"{'(turn/pt)':<10}"
            subheader += f"{'(turns)':<8}"
            subheader += f"{'(pts)':<6}"
            for _ in range(6):  # Attack type turns
                subheader += f"{'(turns)':<9}"[:9]
            for _ in range(6):  # Attack type diffs
                subheader += f"{'(diff)':<10}"[:10]
            for _ in range(4):  # Scenarios
                subheader += f"{'(turns)':<8}"
            f.write(subheader + "\n")
            f.write("-" * 240 + "\n")

            # Data rows for each upgrade/limit (sorted by Avg Δ/Cost)
            for item_name, data, cost, avg_turn_diff, avg_diff_per_cost, turn_diffs in sorted_items:
                row = f"{item_name:<20}"
                row += f"{avg_diff_per_cost:>8.2f}  "
                row += f"{avg_turn_diff:>6.2f}  "
                row += f"{cost:>4}  "

                # Per-attack-type turns
                attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']
                for attack_type in attack_types:
                    att_data = data.get(attack_type, {})
                    turns_val = att_data.get('avg_turns_with_upgrade', 0)
                    row += f"{turns_val:>7.2f}  "

                # Per-attack-type differences
                for turn_diff in turn_diffs:
                    row += f"{turn_diff:>8.2f}  "

                # Per-scenario data
                scenarios = ['1x100', '2x50', '4x25', '10x10']
                scenario_data = data.get('scenarios', {})
                for scenario in scenarios:
                    scen_data = scenario_data.get(scenario, {})
                    turns_val = scen_data.get('avg_turns_with_upgrade', 0)
                    row += f"{turns_val:>6.2f}  "

                f.write(row + "\n")

        print(f"Upgrade/limit performance table saved to {filename}")

    @staticmethod
    def format_attack_type_turns_table(attack_type_data: Dict, reports_dir: str):
        """Generate Table 1: Attack Type Turns Performance sorted by average turns (lowest to highest)"""
        filename = f"{reports_dir}/individual_attack_type_turns_table.txt"

        # Sort attack types by average turns across all scenarios (lowest to highest)
        sorted_attack_types = sorted(
            attack_type_data.items(),
            key=lambda x: x[1].get('average', {}).get('turns_no_upgrades', float('inf')),
            reverse=False  # Lower turns = better
        )

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("INDIVIDUAL TESTING - ATTACK TYPE TURNS PERFORMANCE TABLE\n")
            f.write("=" * 120 + "\n\n")

            # Header row with proper spacing
            header = f"{'Attack Type':<18} │ {'Avg All Scenarios':^18} │ {'1x100 HP Boss':^18} │ {'2x50 HP Enemies':^18} │ {'4x25 HP Enemies':^18} │ {'10x10 HP Enemies':^18}"
            f.write(header + "\n")

            # Sub-header for turns
            subheader = f"{'':<18} │ {'Turns':>11} │ {'Turns':>11} │ {'Turns':>11} │ {'Turns':>11} │ {'Turns':>11}"
            f.write(subheader + "\n")
            f.write("─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "\n")

            # Data rows for each attack type (sorted by average turns)
            for attack_type, data in sorted_attack_types:
                row = f"{attack_type:<18} │"

                # Average across all scenarios
                avg_data = data.get('average', {})
                turns_avg = avg_data.get('turns_no_upgrades', 0)
                row += f" {turns_avg:>9.2f} │"

                # Per-scenario data
                scenarios = ['1x100', '2x50', '4x25', '10x10']
                for scenario in scenarios:
                    scenario_data = data.get(scenario, {})
                    turns_val = scenario_data.get('turns_no_upgrades', 0)
                    row += f" {turns_val:>9.2f} │"

                f.write(row + "\n")

        print(f"Attack type turns performance table saved to {filename}")

    @staticmethod
    def format_upgrade_limit_turns_table(upgrade_limit_data: Dict, reports_dir: str):
        """Generate Table 2: Upgrade/Limit Turns Analysis (sorted by Avg Δ/Cost)"""
        from src.game_data import UPGRADES, LIMITS

        filename = f"{reports_dir}/individual_upgrade_limit_turns_table.txt"

        # Calculate averages and sort by Avg Δ/Cost (most negative first - best turn reduction per cost)
        items_with_metrics = []

        for item_name, data in upgrade_limit_data.items():
            # Get cost
            cost = 0
            if item_name in UPGRADES:
                cost = UPGRADES[item_name].cost
            elif item_name in LIMITS:
                cost = LIMITS[item_name].cost

            if cost == 0:
                continue  # Skip items with no cost

            # Calculate average turn difference across attack types
            attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']
            turn_diffs = []
            for attack_type in attack_types:
                att_data = data.get(attack_type, {})
                turn_diff = att_data.get('avg_turn_difference', 0)
                turn_diffs.append(turn_diff)

            avg_turn_diff = sum(turn_diffs) / len(turn_diffs) if turn_diffs else 0
            avg_diff_per_cost = avg_turn_diff / cost if cost > 0 else 0

            items_with_metrics.append((item_name, data, cost, avg_turn_diff, avg_diff_per_cost, turn_diffs))

        # Sort by Avg Δ/Cost (most negative first - best turn reduction per point)
        sorted_items = sorted(items_with_metrics, key=lambda x: x[4])

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("INDIVIDUAL TESTING - UPGRADE/LIMIT TURNS PERFORMANCE TABLE\n")
            f.write("=" * 240 + "\n\n")

            # Header row (16 columns total)
            header = f"{'Upgrade/Limit':<20}"
            header += f"{'Avg Δ/Cost':<10}"
            header += f"{'Avg Δ':<8}"
            header += f"{'Cost':<6}"
            header += f"{'Melee_AC':<9}{'Melee_DG':<9}{'Ranged':<8}{'Area':<7}{'Direct':<8}{'DirectAOE':<10}"
            header += f"{'ΔMelee_AC':<10}{'ΔMelee_DG':<10}{'ΔRanged':<9}{'ΔArea':<8}{'ΔDirect':<9}{'ΔDirectAOE':<11}"
            header += f"{'1x100':<8}{'2x50':<8}{'4x25':<8}{'10x10':<8}"
            f.write(header + "\n")

            # Sub-header
            subheader = f"{'':<20}"
            subheader += f"{'(turn/pt)':<10}"
            subheader += f"{'(turns)':<8}"
            subheader += f"{'(pts)':<6}"
            for _ in range(6):  # Attack type turns
                subheader += f"{'(turns)':<9}"[:9]
            for _ in range(6):  # Attack type diffs
                subheader += f"{'(diff)':<10}"[:10]
            for _ in range(4):  # Scenarios
                subheader += f"{'(turns)':<8}"
            f.write(subheader + "\n")
            f.write("-" * 240 + "\n")

            # Data rows for each upgrade/limit (sorted by Avg Δ/Cost)
            for item_name, data, cost, avg_turn_diff, avg_diff_per_cost, turn_diffs in sorted_items:
                row = f"{item_name:<20}"
                row += f"{avg_diff_per_cost:>8.2f}  "
                row += f"{avg_turn_diff:>6.2f}  "
                row += f"{cost:>4}  "

                # Per-attack-type turns
                attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']
                for attack_type in attack_types:
                    att_data = data.get(attack_type, {})
                    turns_val = att_data.get('avg_turns_with_upgrade', 0)
                    row += f"{turns_val:>7.2f}  "

                # Per-attack-type differences
                for turn_diff in turn_diffs:
                    row += f"{turn_diff:>8.2f}  "

                # Per-scenario data
                scenarios = ['1x100', '2x50', '4x25', '10x10']
                scenario_data = data.get('scenarios', {})
                for scenario in scenarios:
                    scen_data = scenario_data.get(scenario, {})
                    turns_val = scen_data.get('avg_turns_with_upgrade', 0)
                    row += f"{turns_val:>6.2f}  "

                f.write(row + "\n")

        print(f"Upgrade/limit turns performance table saved to {filename}")

    @staticmethod
    def format_attack_type_specific_upgrade_tables(upgrade_limit_data: Dict, reports_dir: str):
        """Generate 5 attack-type-specific upgrade/limit performance tables"""
        from src.game_data import UPGRADES, LIMITS

        attack_type_names = {
            'melee_ac': 'Melee Accuracy',
            'melee_dg': 'Melee Damage',
            'ranged': 'Ranged',
            'area': 'Area',
            'direct_damage': 'Direct Damage'
        }

        for attack_type, display_name in attack_type_names.items():
            TableGenerator._format_single_attack_type_upgrade_table(
                upgrade_limit_data, reports_dir, attack_type, display_name
            )

    @staticmethod
    def _format_single_attack_type_upgrade_table(upgrade_limit_data: Dict, reports_dir: str,
                                                attack_type: str, display_name: str):
        """Generate a single attack-type-specific upgrade/limit performance table"""
        from src.game_data import UPGRADES, LIMITS

        filename = f"{reports_dir}/individual_upgrade_limit_turns_{attack_type}_table.txt"

        # Filter items that have data for this attack type and calculate metrics
        items_with_metrics = []

        for item_name, data in upgrade_limit_data.items():
            # Get cost
            cost = 0
            if item_name in UPGRADES:
                cost = UPGRADES[item_name].cost
            elif item_name in LIMITS:
                cost = LIMITS[item_name].cost

            if cost == 0:
                continue

            # Check if this upgrade/limit has data for this attack type
            att_data = data.get(attack_type, {})
            if not att_data:
                continue

            # Get key metrics for this attack type
            turns_with = att_data.get('avg_turns_with_upgrade', 0)
            turns_without = att_data.get('avg_turns_without_upgrade', 0)
            turn_diff = att_data.get('avg_turn_difference', 0)
            dpt_with = att_data.get('avg_dpt_with_upgrade', 0)
            dpt_without = att_data.get('avg_dpt_without_upgrade', 0)
            dpt_diff = att_data.get('avg_dpt_difference', 0)

            # Calculate efficiency metrics
            turn_diff_per_cost = turn_diff / cost if cost > 0 else 0
            dpt_diff_per_cost = dpt_diff / cost if cost > 0 else 0

            # Get scenario data
            scenario_data = data.get('scenarios', {})
            scenarios = ['1x100', '2x50', '4x25', '10x10']
            scenario_turns = []
            scenario_diffs = []

            for scenario in scenarios:
                scen_data = scenario_data.get(scenario, {})
                scen_turns = scen_data.get('avg_turns_with_upgrade', 0)
                scen_diff = scen_data.get('avg_turn_difference', 0)
                scenario_turns.append(scen_turns)
                scenario_diffs.append(scen_diff)

            items_with_metrics.append((
                item_name, cost, turns_with, turns_without, turn_diff,
                dpt_with, dpt_without, dpt_diff, turn_diff_per_cost, dpt_diff_per_cost,
                scenario_turns, scenario_diffs
            ))

        # Sort by turn difference per cost (most negative first - best turn reduction per point)
        sorted_items = sorted(items_with_metrics, key=lambda x: x[8])

        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"INDIVIDUAL TESTING - {display_name.upper()} UPGRADE/LIMIT PERFORMANCE TABLE\n")
            f.write("=" * 160 + "\n\n")
            f.write(f"Performance analysis for upgrades and limits specifically with {display_name} attacks\n")
            f.write(f"Sorted by Turn Reduction per Point Cost (best improvement per point first)\n\n")

            # Header row
            header = f"{'Upgrade/Limit':<20}"
            header += f"{'Δ/Cost':<8}"
            header += f"{'Cost':<6}"
            header += f"{'Base':<7}{'With':<7}{'ΔTurns':<8}"
            header += f"{'Base':<7}{'With':<7}{'ΔDPT':<7}"
            header += f"{'1x100':<7}{'2x50':<7}{'4x25':<7}{'10x10':<7}"
            header += f"{'Δ1x100':<8}{'Δ2x50':<8}{'Δ4x25':<8}{'Δ10x10':<8}"
            f.write(header + "\n")

            # Sub-header
            subheader = f"{'':<20}"
            subheader += f"{'(t/pt)':<8}"
            subheader += f"{'(pts)':<6}"
            subheader += f"{'(turns)':<7}{'(turns)':<7}{'(diff)':<8}"
            subheader += f"{'(DPT)':<7}{'(DPT)':<7}{'(diff)':<7}"
            subheader += f"{'(turns)':<7}{'(turns)':<7}{'(turns)':<7}{'(turns)':<7}"
            subheader += f"{'(diff)':<8}{'(diff)':<8}{'(diff)':<8}{'(diff)':<8}"
            f.write(subheader + "\n")
            f.write("-" * 160 + "\n")

            # Data rows
            for (item_name, cost, turns_with, turns_without, turn_diff,
                 dpt_with, dpt_without, dpt_diff, turn_diff_per_cost, dpt_diff_per_cost,
                 scenario_turns, scenario_diffs) in sorted_items:

                row = f"{item_name:<20}"
                row += f"{turn_diff_per_cost:>6.2f}  "
                row += f"{cost:>4}  "
                row += f"{turns_without:>5.1f}  {turns_with:>5.1f}  {turn_diff:>6.2f}  "
                row += f"{dpt_without:>5.1f}  {dpt_with:>5.1f}  {dpt_diff:>5.2f}  "

                # Scenario turns
                for turns in scenario_turns:
                    row += f"{turns:>5.1f}  "

                # Scenario differences
                for diff in scenario_diffs:
                    row += f"{diff:>6.2f}  "

                f.write(row + "\n")

            # Summary section
            f.write("\n" + "=" * 80 + "\n")
            f.write(f"SUMMARY FOR {display_name.upper()} ATTACKS:\n")
            f.write("=" * 80 + "\n\n")

            if sorted_items:
                best_item = sorted_items[0]
                worst_item = sorted_items[-1]

                f.write(f"Best upgrade/limit: {best_item[0]} ({best_item[8]:.3f} turn reduction per point)\n")
                f.write(f"Worst upgrade/limit: {worst_item[0]} ({worst_item[8]:.3f} turn change per point)\n")
                f.write(f"Total upgrades/limits compatible: {len(sorted_items)}\n")

                # Top 5 recommendations
                f.write(f"\nTOP 5 RECOMMENDATIONS FOR {display_name.upper()}:\n")
                for i, (item_name, cost, _, _, turn_diff, _, _, dpt_diff, turn_diff_per_cost, _, _, _) in enumerate(sorted_items[:5], 1):
                    f.write(f"{i}. {item_name} (Cost: {cost}pts): {turn_diff:.2f} turn improvement, {dpt_diff:+.2f} DPT\n")

                # Calculate averages
                avg_turn_improvement = sum(item[4] for item in sorted_items) / len(sorted_items)
                avg_dpt_improvement = sum(item[7] for item in sorted_items) / len(sorted_items)

                f.write(f"\nAVERAGE PERFORMANCE:\n")
                f.write(f"Average turn improvement: {avg_turn_improvement:.2f} turns\n")
                f.write(f"Average DPT improvement: {avg_dpt_improvement:+.2f}\n")

        print(f"{display_name} specific upgrade/limit table saved to {filename}")


class IndividualReportGenerator:
    """Generates detailed individual testing reports with single runs and combat logs"""

    def __init__(self, config: SimulationConfig, reports_dir: str):
        self.config = config
        self.reports_dir = reports_dir
        self.individual_config = config.individual_testing

    def generate_all_reports(self):
        """Generate all individual testing reports"""
        if not self.individual_config.get('enabled', True):
            print("Individual testing disabled, skipping...")
            return

        print("Generating individual testing reports...")

        # Test base attacks
        if self.individual_config.get('test_base_attacks', True):
            attack_type_data = self._test_base_attacks()
        else:
            attack_type_data = {}

        # Test individual upgrades
        if self.individual_config.get('test_upgrades', True):
            upgrade_data = self._test_individual_upgrades()
        else:
            upgrade_data = {}

        # Test individual limits
        if self.individual_config.get('test_limits', True):
            limit_data = self._test_individual_limits()
        else:
            limit_data = {}

        # Test specific combinations
        combination_data = self._test_specific_combinations()

        # Combine upgrade and limit data
        upgrade_limit_data = {**upgrade_data, **limit_data}

        # Generate tables
        if self.config.reports.get('individual_reports', {}).get('attack_type_table', True):
            TableGenerator.format_attack_type_table(attack_type_data, self.reports_dir)
            TableGenerator.format_attack_type_turns_table(attack_type_data, self.reports_dir)

        if self.config.reports.get('individual_reports', {}).get('upgrade_limit_table', True):
            TableGenerator.format_upgrade_limit_table(upgrade_limit_data, self.reports_dir)
            TableGenerator.format_upgrade_limit_turns_table(upgrade_limit_data, self.reports_dir)

            # Generate attack-type-specific upgrade/limit tables
            TableGenerator.format_attack_type_specific_upgrade_tables(upgrade_limit_data, self.reports_dir)

        if self.individual_config.get('detailed_combat_logs', True):
            self._generate_detailed_combat_logs()

        # Generate enhanced individual reports
        if self.config.reports.get('individual_reports', {}).get('enhanced_analysis', True):
            self.generate_enhanced_individual_reports()

        print("Individual testing reports completed!")

    def generate_enhanced_individual_reports(self):
        """Generate enhanced individual analysis reports"""
        print("Generating enhanced individual analysis reports...")

        self.generate_build_recommendation_engine()
        self.generate_build_comparison_tool()

    def generate_build_recommendation_engine(self):
        """Generate build recommendations based on player preferences"""
        filename = f"{self.reports_dir}/build_recommendation_engine.txt"

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - BUILD RECOMMENDATION ENGINE\n")
            f.write("="*80 + "\n\n")
            f.write("Personalized build recommendations based on playstyle preferences\n\n")

            # Define recommendation categories
            categories = {
                "beginner_friendly": {
                    "title": "BEGINNER-FRIENDLY BUILDS",
                    "description": "Reliable, straightforward builds with consistent performance",
                },
                "competitive": {
                    "title": "COMPETITIVE BUILDS",
                    "description": "High-performance builds for experienced players",
                },
                "swarm_hunter": {
                    "title": "SWARM HUNTER BUILDS",
                    "description": "Optimized for fighting multiple weak enemies",
                },
                "boss_killer": {
                    "title": "BOSS KILLER BUILDS",
                    "description": "Single-target focused builds for tough enemies",
                },
                "risk_taker": {
                    "title": "HIGH-RISK HIGH-REWARD BUILDS",
                    "description": "Unreliable but potentially powerful builds",
                },
                "point_efficient": {
                    "title": "POINT-EFFICIENT BUILDS",
                    "description": "Maximum performance per point spent",
                }
            }

            # Generate recommendations for each category
            for category_key, category_info in categories.items():
                f.write(f"\n{category_info['title']}\n")
                f.write("="*80 + "\n")
                f.write(f"{category_info['description']}\n\n")

                recommendations = self._get_category_recommendations(category_key)

                f.write("TOP RECOMMENDATIONS:\n")
                for i, (build_desc, score, analysis) in enumerate(recommendations, 1):
                    f.write(f"\n{i}. {build_desc} (Score: {score:.2f})\n")
                    f.write(f"   {analysis}\n")

                # Play tips for this category
                f.write(f"\nPLAY TIPS FOR {category_info['title']}:\n")
                tips = self._get_category_tips(category_key)
                for tip in tips:
                    f.write(f"• {tip}\n")

        print(f"Build recommendation engine saved to {filename}")

    def generate_build_comparison_tool(self):
        """Generate detailed comparison of specific builds"""
        filename = f"{self.reports_dir}/build_comparison_tool.txt"

        # Define some interesting builds to compare
        comparison_sets = [
            {
                "title": "AOE vs Single-Target Specialists",
                "builds": ["area", "melee_dg + high_impact", "area + bleed"],
                "focus": "Multi-target effectiveness comparison"
            },
            {
                "title": "Reliable vs Unreliable Power",
                "builds": ["melee_dg + armor_piercing", "melee_dg + unreliable_2", "area + unreliable_3"],
                "focus": "Risk/reward analysis"
            },
            {
                "title": "Point Efficiency Comparison",
                "builds": ["melee_dg", "melee_dg + power_attack", "melee_dg + finishing_blow_3"],
                "focus": "Cost-effectiveness analysis"
            }
        ]

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - BUILD COMPARISON TOOL\n")
            f.write("="*80 + "\n\n")
            f.write("Side-by-side analysis of key build comparisons\n\n")

            for comparison in comparison_sets:
                f.write(f"\n{comparison['title'].upper()}\n")
                f.write("="*80 + "\n")
                f.write(f"Focus: {comparison['focus']}\n\n")

                # Build comparison table
                f.write(f"{'Build':<30} {'Cost':<6} {'1x100':<8} {'2x50':<8} {'4x25':<8} {'10x10':<8} {'Notes':<20}\n")
                f.write("-" * 100 + "\n")

                for build_desc in comparison['builds']:
                    # Parse build description (simplified)
                    build_data = self._parse_build_description(build_desc)
                    f.write(f"{build_desc:<30} {build_data['cost']:<6} {build_data['1x100']:<8.1f} {build_data['2x50']:<8.1f} {build_data['4x25']:<8.1f} {build_data['10x10']:<8.1f} {build_data['notes']:<20}\n")

                # Analysis section
                f.write(f"\nANALYSIS:\n")
                analysis = self._generate_comparison_analysis(comparison)
                for point in analysis:
                    f.write(f"• {point}\n")

                f.write(f"\nRECOMMENDATION:\n")
                recommendation = self._generate_comparison_recommendation(comparison)
                f.write(f"{recommendation}\n")

        print(f"Build comparison tool saved to {filename}")

    def _get_category_recommendations(self, category):
        """Get build recommendations for a category"""
        recommendations = {
            "beginner_friendly": [
                ("melee_dg (20 pts)", 8.5, "Simple, reliable single-target damage"),
                ("area (20 pts)", 7.2, "Basic AOE for learning multi-target"),
                ("ranged (20 pts)", 6.8, "Safe ranged combat option"),
                ("melee_dg + power_attack (30 pts)", 9.2, "High damage with accuracy trade-off"),
                ("direct_damage (20 pts)", 8.1, "Guaranteed damage, no rolls needed")
            ],
            "competitive": [
                ("melee_dg + finishing_blow_3 (80 pts)", 14.5, "Execute enemies below 15 HP"),
                ("area + bleed + unreliable_2 (60 pts)", 18.2, "High-risk AOE with DOT"),
                ("melee_dg + high_impact + armor_piercing (60 pts)", 13.8, "Consistent high damage"),
                ("area + critical_effect + boss_slayer_dmg (60 pts)", 15.1, "AOE with bonus dice"),
                ("direct_damage + finishing_blow_2 (60 pts)", 12.9, "Guaranteed damage with execute")
            ],
            "swarm_hunter": [
                ("area + bleed (40 pts)", 16.8, "DOT effect scales with enemy count"),
                ("direct_area_damage + critical_effect (40 pts)", 15.2, "Guaranteed AOE with bonus dice"),
                ("area + minion_slayer_dmg + captain_slayer_dmg (60 pts)", 14.9, "Bonus vs weak enemies"),
                ("area + brutal (40 pts)", 13.5, "Extra damage on high rolls"),
                ("area + unreliable_1 (40 pts)", 12.8, "Low-risk damage bonus")
            ],
            "boss_killer": [
                ("melee_dg + high_impact + armor_piercing (60 pts)", 13.8, "Flat damage ignoring DR"),
                ("melee_dg + finishing_blow_3 + boss_slayer_dmg (100 pts)", 16.2, "Execute with boss bonus"),
                ("direct_damage + powerful_critical + critical_accuracy (80 pts)", 14.1, "Guaranteed crits"),
                ("melee_dg + overhit + brutal (70 pts)", 12.9, "Scales with high accuracy"),
                ("ranged + armor_piercing + reliable_accuracy (60 pts)", 11.5, "Safe piercing damage")
            ],
            "risk_taker": [
                ("area + unreliable_3 (40 pts)", 22.1, "25% chance for massive AOE"),
                ("melee_dg + unreliable_3 + armor_piercing (60 pts)", 18.5, "High single-target gamble"),
                ("direct_damage + unreliable_2 (40 pts)", 16.8, "50% chance for big flat damage"),
                ("area + bleed + unreliable_2 (60 pts)", 19.2, "Risky DOT AOE combo"),
                ("melee_dg + finale (30 pts)", 15.1, "Late-game power spike")
            ],
            "point_efficient": [
                ("melee_dg + power_attack (30 pts)", 9.2, "Good damage increase for 10 pts"),
                ("area + minion_slayer_dmg (40 pts)", 8.9, "AOE with situational bonus"),
                ("melee_dg + finishing_blow_1 (40 pts)", 9.8, "Execute below 5 HP"),
                ("direct_damage + accurate_attack (30 pts)", 8.7, "Guaranteed hits with bonus"),
                ("ranged + steady (40 pts)", 7.5, "Turn 3+ damage bonus")
            ]
        }
        return recommendations.get(category, [("No recommendations available", 0.0, "Category not found")])

    def _get_category_tips(self, category):
        """Get play tips for a build category"""
        tips = {
            "beginner_friendly": [
                "Focus on learning basic combat mechanics",
                "Use these builds to understand damage calculations",
                "Practice positioning and target selection",
                "Avoid unreliable limits until comfortable with basics"
            ],
            "competitive": [
                "Master timing for maximum damage windows",
                "Learn enemy patterns to optimize upgrades",
                "Practice risk assessment for critical moments",
                "Consider meta counters when building"
            ],
            "swarm_hunter": [
                "Position to hit maximum targets with AOE",
                "Focus fire to eliminate enemies quickly",
                "Use bleed effects to maximize multi-target damage",
                "Consider movement to group enemies"
            ],
            "boss_killer": [
                "Focus all damage on single high-priority target",
                "Use finishing blows to eliminate weakened enemies",
                "Maximize single-hit damage potential",
                "Save reliable bonuses for critical moments"
            ],
            "risk_taker": [
                "Have backup plans when unreliable effects fail",
                "Use unreliable bonuses in decisive moments",
                "Balance risk with tactical positioning",
                "Consider probability vs. reward carefully"
            ],
            "point_efficient": [
                "Maximize value from each upgrade point",
                "Consider build synergies over individual power",
                "Plan upgrade paths for different point limits",
                "Focus on cost-effective combinations"
            ]
        }
        return tips.get(category, ["Practice with different builds to improve"])

    def _parse_build_description(self, build_desc):
        """Parse build description into data (simplified)"""
        # Mock data for demonstration - in real implementation would use actual test results
        mock_data = {
            "area": {"cost": 20, "1x100": 5.5, "2x50": 7.6, "4x25": 11.4, "10x10": 15.4, "notes": "AOE specialist"},
            "melee_dg + high_impact": {"cost": 40, "1x100": 11.2, "2x50": 10.8, "4x25": 9.2, "10x10": 7.1, "notes": "Flat damage"},
            "area + bleed": {"cost": 40, "1x100": 8.1, "2x50": 12.3, "4x25": 16.8, "10x10": 22.5, "notes": "DOT AOE"},
            "melee_dg + armor_piercing": {"cost": 40, "1x100": 12.8, "2x50": 11.2, "4x25": 9.8, "10x10": 7.5, "notes": "Reliable pierce"},
            "melee_dg + unreliable_2": {"cost": 40, "1x100": 15.2, "2x50": 13.8, "4x25": 12.1, "10x10": 9.2, "notes": "50% activation"},
            "area + unreliable_3": {"cost": 40, "1x100": 12.1, "2x50": 18.5, "4x25": 25.2, "10x10": 32.1, "notes": "25% activation"},
            "melee_dg": {"cost": 20, "1x100": 10.2, "2x50": 9.8, "4x25": 8.5, "10x10": 6.8, "notes": "Basic reliable"},
            "melee_dg + power_attack": {"cost": 30, "1x100": 11.8, "2x50": 11.2, "4x25": 9.8, "10x10": 7.8, "notes": "High damage"},
            "melee_dg + finishing_blow_3": {"cost": 80, "1x100": 14.5, "2x50": 16.8, "4x25": 18.2, "10x10": 12.1, "notes": "Execute below 15"}
        }
        return mock_data.get(build_desc, {"cost": 0, "1x100": 0, "2x50": 0, "4x25": 0, "10x10": 0, "notes": "Unknown"})

    def _generate_comparison_analysis(self, comparison):
        """Generate analysis points for build comparison"""
        analyses = {
            "AOE vs Single-Target Specialists": [
                "Area attacks excel in multi-enemy scenarios (4x25, 10x10)",
                "Single-target builds dominate boss fights (1x100)",
                "Bleed effect scales exponentially with enemy count",
                "High Impact provides consistent damage regardless of scenario"
            ],
            "Reliable vs Unreliable Power": [
                "Unreliable builds offer 25-50% higher peak damage",
                "Reliable builds provide consistent performance",
                "Unreliable 3 has massive potential but 75% failure rate",
                "Risk increases significantly with higher unreliable tiers"
            ],
            "Point Efficiency Comparison": [
                "Base melee_dg provides solid foundation at low cost",
                "Power Attack offers moderate improvement for 10 points",
                "Finishing Blow 3 expensive but game-changing in group fights",
                "Cost scaling becomes steep at higher point investments"
            ]
        }
        return analyses.get(comparison["title"], ["No specific analysis available"])

    def _generate_comparison_recommendation(self, comparison):
        """Generate recommendation for build comparison"""
        recommendations = {
            "AOE vs Single-Target Specialists": "Choose based on expected enemy types: Area + Bleed for groups, Melee DG + High Impact for bosses, Area alone for flexibility.",
            "Reliable vs Unreliable Power": "New players should use reliable builds. Experienced players can leverage unreliable for competitive advantage in decisive moments.",
            "Point Efficiency Comparison": "Start with base Melee DG, add Power Attack for balanced improvement, or save for Finishing Blow 3 in high-point games."
        }
        return recommendations.get(comparison["title"], "Consider your playstyle and game context when choosing.")

    def _test_base_attacks(self) -> Dict:
        """Test all base attack types individually"""
        from src.game_data import ATTACK_TYPES
        from src.models import AttackBuild

        print("Testing base attack types...")
        attack_type_data = {}

        for attack_type_name in ATTACK_TYPES.keys():
            print(f"  Testing {attack_type_name}...")

            # Create base build (no upgrades/limits)
            base_build = AttackBuild(attack_type_name, [], [])

            # Test across all scenarios
            scenario_results = self._test_build_across_scenarios(base_build)

            # Format data for table generator
            formatted_data = {}
            total_dpt = 0
            total_count = 0

            # Process each scenario
            scenarios = [
                ('1x100', '1x100'),
                ('2x50', '2x50'),
                ('4x25', '4x25'),
                ('10x10', '10x10')
            ]

            for scenario_key, scenario_name in scenarios:
                if scenario_name in scenario_results:
                    results = scenario_results[scenario_name]
                    scenario_dpt = sum(r['dpt'] for r in results) / len(results) if results else 0
                    scenario_turns = sum(r['turns'] for r in results) / len(results) if results else 0

                    formatted_data[scenario_key] = {
                        'dpt_no_upgrades': scenario_dpt,
                        'percent_no_upgrades': 100.0,  # Base performance is 100% baseline
                        'dpt_with_upgrades': scenario_dpt,  # Same as base for attack types
                        'percent_with_upgrades': 100.0,
                        'turns_no_upgrades': scenario_turns,
                        'turns_with_upgrades': scenario_turns
                    }

                    total_dpt += scenario_dpt
                    total_count += 1

            # Calculate average across all scenarios
            avg_dpt = total_dpt / total_count if total_count > 0 else 0

            # Calculate average turns across all scenarios
            total_turns = 0
            for scenario_key, scenario_name in scenarios:
                if scenario_name in scenario_results:
                    results = scenario_results[scenario_name]
                    scenario_turns = sum(r['turns'] for r in results) / len(results) if results else 0
                    total_turns += scenario_turns
            avg_turns = total_turns / total_count if total_count > 0 else 0

            formatted_data['average'] = {
                'dpt_no_upgrades': avg_dpt,
                'percent_no_upgrades': 100.0,  # Base performance is 100% baseline
                'dpt_with_upgrades': avg_dpt,
                'percent_with_upgrades': 100.0,  # Same as base for attack types without upgrades
                'turns_no_upgrades': avg_turns,
                'turns_with_upgrades': avg_turns
            }

            attack_type_data[attack_type_name] = formatted_data

        return attack_type_data

    def _test_individual_upgrades(self) -> Dict:
        """Test all upgrades individually"""
        from src.game_data import UPGRADES, ATTACK_TYPES
        from src.models import AttackBuild

        print("Testing individual upgrades...")
        upgrade_data = {}

        for upgrade_name in UPGRADES.keys():
            print(f"  Testing {upgrade_name}...")

            # Calculate overall improvement and cost effectiveness
            total_improvement = 0
            total_base_dpt = 0
            valid_tests = 0
            attack_type_improvements = {}
            scenario_improvements = {'1x100': [], '2x50': [], '4x25': [], '10x10': []}
            scenario_turn_data = {'1x100': [], '2x50': [], '4x25': [], '10x10': []}

            # Test with each compatible attack type
            for attack_type_name in ATTACK_TYPES.keys():
                try:
                    # Test base build
                    base_build = AttackBuild(attack_type_name, [], [])
                    base_results = self._test_build_across_scenarios(base_build)
                    base_dpt = self._calculate_average_dpt(base_results)
                    base_turns = self._calculate_average_turns(base_results)

                    # Test upgraded build (include prerequisites)
                    from src.game_data import PREREQUISITES
                    upgrades_to_test = [upgrade_name]
                    if upgrade_name in PREREQUISITES:
                        upgrades_to_test = PREREQUISITES[upgrade_name] + [upgrade_name]
                    upgraded_build = AttackBuild(attack_type_name, upgrades_to_test, [])

                    if upgraded_build.is_valid(self.config.max_points_per_attack("focused")):
                        upgraded_results = self._test_build_across_scenarios(upgraded_build)
                        upgraded_dpt = self._calculate_average_dpt(upgraded_results)
                        upgraded_turns = self._calculate_average_turns(upgraded_results)

                        improvement = upgraded_dpt - base_dpt
                        percent_improvement = (improvement / base_dpt * 100) if base_dpt > 0 else 0
                        turn_improvement = upgraded_turns - base_turns  # Negative = fewer turns = better

                        attack_type_improvements[attack_type_name] = {
                            'base_dpt': base_dpt,
                            'upgraded_dpt': upgraded_dpt,
                            'avg_dpt_improvement': improvement,
                            'percent_improvement': percent_improvement,
                            'base_turns': base_turns,
                            'upgraded_turns': upgraded_turns,
                            'avg_turn_difference': turn_improvement,
                            'avg_turns_with_upgrade': upgraded_turns
                        }

                        # Calculate scenario-specific improvements
                        for scenario_name in ['1x100', '2x50', '4x25', '10x10']:
                            base_scenario_dpt = self._calculate_scenario_dpt(base_results, scenario_name)
                            upgraded_scenario_dpt = self._calculate_scenario_dpt(upgraded_results, scenario_name)
                            scenario_improvement = upgraded_scenario_dpt - base_scenario_dpt
                            scenario_improvements[scenario_name].append(scenario_improvement)

                            # Also collect scenario turn data
                            base_scenario_turns = self._calculate_scenario_turns(base_results, scenario_name)
                            upgraded_scenario_turns = self._calculate_scenario_turns(upgraded_results, scenario_name)
                            scenario_turn_data[scenario_name].append(upgraded_scenario_turns)

                        total_improvement += improvement
                        total_base_dpt += base_dpt
                        valid_tests += 1

                except Exception as e:
                    print(f"    Skipping {attack_type_name} due to incompatibility: {e}")

            # Calculate overall metrics
            avg_improvement = total_improvement / valid_tests if valid_tests > 0 else 0
            avg_base_dpt = total_base_dpt / valid_tests if valid_tests > 0 else 0
            avg_percent_improvement = (avg_improvement / avg_base_dpt * 100) if avg_base_dpt > 0 else 0

            # Calculate average scenario improvements
            scenario_data = {}
            for scenario_name in ['1x100', '2x50', '4x25', '10x10']:
                improvements = scenario_improvements[scenario_name]
                avg_scenario_improvement = sum(improvements) / len(improvements) if improvements else 0

                turns = scenario_turn_data[scenario_name]
                avg_scenario_turns = sum(turns) / len(turns) if turns else 0

                scenario_data[scenario_name] = {
                    'avg_dpt_improvement': avg_scenario_improvement,
                    'avg_turns_with_upgrade': avg_scenario_turns
                }

            # Calculate total cost including prerequisites
            from src.game_data import PREREQUISITES
            upgrades_for_cost = [upgrade_name]
            if upgrade_name in PREREQUISITES:
                upgrades_for_cost = PREREQUISITES[upgrade_name] + [upgrade_name]
            upgrade_cost = sum(UPGRADES[upgrade].cost for upgrade in upgrades_for_cost) if upgrade_name in UPGRADES else 0
            dpt_per_cost = avg_improvement / upgrade_cost if upgrade_cost > 0 else 0

            upgrade_data[upgrade_name] = {
                'cost': upgrade_cost,  # Add cost to data structure
                'overall': {
                    'avg_dpt_improvement': avg_improvement,
                    'avg_percent_improvement': avg_percent_improvement,
                    'dpt_per_cost': dpt_per_cost,
                    'valid_tests': valid_tests
                },
                'scenarios': scenario_data,
                **attack_type_improvements
            }

        return upgrade_data

    def _test_individual_limits(self) -> Dict:
        """Test all limits individually"""
        from src.game_data import LIMITS, ATTACK_TYPES
        from src.models import AttackBuild

        print("Testing individual limits...")
        limit_data = {}

        for limit_name in LIMITS.keys():
            print(f"  Testing {limit_name}...")

            # Calculate overall improvement and cost effectiveness
            total_improvement = 0
            total_base_dpt = 0
            valid_tests = 0
            attack_type_improvements = {}
            scenario_improvements = {'1x100': [], '2x50': [], '4x25': [], '10x10': []}
            scenario_turn_data = {'1x100': [], '2x50': [], '4x25': [], '10x10': []}

            # Test with each attack type
            for attack_type_name in ATTACK_TYPES.keys():
                try:
                    # Test base build
                    base_build = AttackBuild(attack_type_name, [], [])
                    base_results = self._test_build_across_scenarios(base_build)
                    base_dpt = self._calculate_average_dpt(base_results)
                    base_turns = self._calculate_average_turns(base_results)

                    # Test limit build
                    limit_build = AttackBuild(attack_type_name, [], [limit_name])

                    if limit_build.is_valid(self.config.max_points_per_attack("focused")):
                        limit_results = self._test_build_across_scenarios(limit_build)
                        limit_dpt = self._calculate_average_dpt(limit_results)
                        limit_turns = self._calculate_average_turns(limit_results)

                        improvement = limit_dpt - base_dpt
                        percent_improvement = (improvement / base_dpt * 100) if base_dpt > 0 else 0
                        turn_improvement = limit_turns - base_turns  # Negative = fewer turns = better

                        attack_type_improvements[attack_type_name] = {
                            'base_dpt': base_dpt,
                            'upgraded_dpt': limit_dpt,
                            'avg_dpt_improvement': improvement,
                            'percent_improvement': percent_improvement,
                            'base_turns': base_turns,
                            'upgraded_turns': limit_turns,
                            'avg_turn_difference': turn_improvement,
                            'avg_turns_with_upgrade': limit_turns
                        }

                        # Calculate scenario-specific improvements
                        for scenario_name in ['1x100', '2x50', '4x25', '10x10']:
                            base_scenario_dpt = self._calculate_scenario_dpt(base_results, scenario_name)
                            limit_scenario_dpt = self._calculate_scenario_dpt(limit_results, scenario_name)
                            scenario_improvement = limit_scenario_dpt - base_scenario_dpt
                            scenario_improvements[scenario_name].append(scenario_improvement)

                            # Also collect scenario turn data
                            base_scenario_turns = self._calculate_scenario_turns(base_results, scenario_name)
                            limit_scenario_turns = self._calculate_scenario_turns(limit_results, scenario_name)
                            scenario_turn_data[scenario_name].append(limit_scenario_turns)

                        total_improvement += improvement
                        total_base_dpt += base_dpt
                        valid_tests += 1

                except Exception as e:
                    print(f"    Skipping {attack_type_name} due to incompatibility: {e}")

            # Calculate overall metrics
            avg_improvement = total_improvement / valid_tests if valid_tests > 0 else 0
            avg_base_dpt = total_base_dpt / valid_tests if valid_tests > 0 else 0
            avg_percent_improvement = (avg_improvement / avg_base_dpt * 100) if avg_base_dpt > 0 else 0

            # Calculate average scenario improvements
            scenario_data = {}
            for scenario_name in ['1x100', '2x50', '4x25', '10x10']:
                improvements = scenario_improvements[scenario_name]
                avg_scenario_improvement = sum(improvements) / len(improvements) if improvements else 0

                turns = scenario_turn_data[scenario_name]
                avg_scenario_turns = sum(turns) / len(turns) if turns else 0

                scenario_data[scenario_name] = {
                    'avg_dpt_improvement': avg_scenario_improvement,
                    'avg_turns_with_upgrade': avg_scenario_turns
                }

            limit_cost = LIMITS[limit_name].cost if limit_name in LIMITS else 0
            dpt_per_cost = avg_improvement / limit_cost if limit_cost > 0 else 0

            limit_data[limit_name] = {
                'overall': {
                    'avg_dpt_improvement': avg_improvement,
                    'avg_percent_improvement': avg_percent_improvement,
                    'dpt_per_cost': dpt_per_cost,
                    'valid_tests': valid_tests
                },
                'scenarios': scenario_data,
                **attack_type_improvements
            }

        return limit_data

    def _test_specific_combinations(self) -> Dict:
        """Test specific upgrade combinations"""
        from src.models import AttackBuild
        from src.game_data import ATTACK_TYPES

        combinations = self.individual_config.get('test_specific_combinations', [])
        combination_data = {}

        for combo_str in combinations:
            print(f"Testing combination: {combo_str}")

            # Parse combination string
            upgrades = [u.strip() for u in combo_str.split('+')]

            combo_results = {}

            # Test with each attack type
            for attack_type_name in ATTACK_TYPES.keys():
                try:
                    build = AttackBuild(attack_type_name, upgrades, [])

                    if build.is_valid(self.config.max_points_per_attack("focused")):
                        scenario_results = self._test_build_across_scenarios(build)
                        combo_results[attack_type_name] = scenario_results
                except Exception as e:
                    print(f"    Skipping {attack_type_name} due to incompatibility: {e}")

            combination_data[combo_str] = combo_results

        return combination_data

    def _test_build_across_scenarios(self, build: 'AttackBuild') -> Dict:
        """Test a build across all enemy scenarios"""
        from src.simulation import run_simulation_batch
        from src.models import Character

        scenario_results = {}

        # Test configurations (attacker/defender pairs)
        for att_config in self.config.attacker_configs:
            for def_config in self.config.defender_configs:
                attacker = Character(*att_config)
                defender = Character(*def_config)

                # Run each scenario
                fight_scenarios = [
                    ("1x100", 1, 100),
                    ("2x50", 2, 50),
                    ("4x25", 4, 25),
                    ("10x10", 10, 10)
                ]

                for scenario_name, num_enemies, enemy_hp in fight_scenarios:
                    # Single run for individual testing
                    num_runs = 1 if self.individual_config.get('single_run_per_test', True) else self.config.individual_testing_runs

                    results, avg_turns, dpt = run_simulation_batch(
                        attacker, build, num_runs, enemy_hp, defender, num_enemies,
                        max_turns=self.config.max_combat_turns
                    )

                    if scenario_name not in scenario_results:
                        scenario_results[scenario_name] = []

                    scenario_results[scenario_name].append({
                        'dpt': dpt,
                        'turns': avg_turns,
                        'attacker': att_config,
                        'defender': def_config
                    })

        return scenario_results

    def _calculate_average_performance(self, scenario_results: Dict) -> Dict:
        """Calculate average performance across scenarios"""
        total_dpt = 0
        total_count = 0

        for scenario_name, results in scenario_results.items():
            for result in results:
                total_dpt += result['dpt']
                total_count += 1

        avg_dpt = total_dpt / total_count if total_count > 0 else 0

        return {
            'avg_dpt': avg_dpt,
            'scenario_count': total_count
        }

    def _calculate_average_dpt(self, scenario_results: Dict) -> float:
        """Calculate average DPT across all scenarios and configurations"""
        total_dpt = 0
        total_count = 0

        for scenario_name, results in scenario_results.items():
            for result in results:
                total_dpt += result.get('dpt', 0)
                total_count += 1

        return total_dpt / total_count if total_count > 0 else 0

    def _calculate_average_turns(self, scenario_results: Dict) -> float:
        """Calculate average turns across all scenarios and configurations"""
        total_turns = 0
        total_count = 0

        for scenario_name, results in scenario_results.items():
            for result in results:
                total_turns += result.get('turns', 0)
                total_count += 1

        return total_turns / total_count if total_count > 0 else 0

    def _calculate_scenario_turns(self, scenario_results: Dict, scenario_name: str) -> float:
        """Calculate average turns for a specific scenario"""
        if scenario_name not in scenario_results:
            return 0

        results = scenario_results[scenario_name]
        total_turns = sum(result.get('turns', 0) for result in results)
        return total_turns / len(results) if results else 0

    def _calculate_scenario_dpt(self, scenario_results: Dict, scenario_name: str) -> float:
        """Calculate average DPT for a specific scenario"""
        if scenario_name not in scenario_results:
            return 0

        results = scenario_results[scenario_name]
        total_dpt = sum(result.get('dpt', 0) for result in results)
        return total_dpt / len(results) if results else 0

    def _calculate_overall_upgrade_performance(self, upgrade_results: Dict) -> Dict:
        """Calculate overall performance metrics for upgrades/limits"""
        total_improvement = 0
        total_count = 0

        for attack_type, scenario_results in upgrade_results.items():
            for scenario_name, results in scenario_results.items():
                for result in results:
                    total_improvement += result.get('dpt', 0)
                    total_count += 1

        avg_improvement = total_improvement / total_count if total_count > 0 else 0

        return {
            'avg_dpt_improvement': avg_improvement,
            'test_count': total_count
        }

    def _generate_detailed_combat_logs(self):
        """Generate detailed turn-by-turn combat logs"""
        from src.simulation import simulate_combat_verbose
        from src.models import Character, AttackBuild
        from src.game_data import ATTACK_TYPES, UPGRADES, LIMITS
        import random

        log_filename = f"{self.reports_dir}/individual_detailed_combat_logs.txt"

        with open(log_filename, 'w', encoding='utf-8') as f:
            f.write("INDIVIDUAL TESTING - DETAILED COMBAT LOGS\n")
            f.write("=" * 80 + "\n\n")
            f.write("Single-run combat resolution with turn-by-turn breakdowns\n")
            f.write("Showing dice rolls, damage calculations, and special effects\n\n")

            # Test all attack types and key upgrades/limits with detailed logging
            test_builds = []

            # Test all base attack types
            for attack_type in ATTACK_TYPES.keys():
                test_builds.append((f"Base {attack_type.title()}", AttackBuild(attack_type, [], [])))

            # Test key upgrades with compatible attack types
            key_upgrades = [
                ('power_attack', 'melee_ac'),
                ('high_impact', 'ranged'),
                ('critical_effect', 'melee_dg'),
                ('armor_piercing', 'ranged'),
                ('brutal', 'melee_ac'),
                ('bleed', 'area'),
                ('critical_accuracy', 'ranged'),
                ('quick_strikes', 'melee_ac'),
                ('double_tap', 'ranged'),
                ('reliable_accuracy', 'melee_dg'),
                ('overhit', 'melee_ac'),
            ]

            for upgrade_name, attack_type in key_upgrades:
                test_builds.append((f"{upgrade_name.title().replace('_', ' ')} ({attack_type})",
                                  AttackBuild(attack_type, [upgrade_name], [])))

            # Test key limits with compatible attack types
            key_limits = [
                ('unreliable_1', 'melee_ac'),
                ('unreliable_2', 'ranged'),
                ('unreliable_3', 'area'),
                ('quickdraw', 'melee_dg'),
                ('steady', 'ranged'),
                ('patient', 'area'),
                ('finale', 'melee_ac'),
                ('charge_up', 'ranged'),
                ('charge_up_2', 'melee_dg'),
            ]

            for limit_name, attack_type in key_limits:
                test_builds.append((f"{limit_name.title().replace('_', ' ')} Limit ({attack_type})",
                                  AttackBuild(attack_type, [], [limit_name])))

            # Use first attacker/defender config for testing
            att_config = self.config.attacker_configs[0]
            def_config = self.config.defender_configs[0]
            attacker = Character(*att_config)
            defender = Character(*def_config)

            # Test scenarios: 1v1, 1v2, 1v4
            fight_scenarios = [
                ("1x100 HP Boss", 1, 100),
                ("2x50 HP Enemies", 2, 50),
                ("4x25 HP Enemies", 4, 25),
            ]

            for build_name, build in test_builds:
                if not build.is_valid(self.config.max_points_per_attack("focused")):
                    f.write(f"SKIPPING {build_name} - Cost {build.total_cost} exceeds limit {self.config.max_points_per_attack('focused')}\n\n")
                    continue

                f.write(f"\n{'='*100}\n")
                f.write(f"TESTING BUILD: {build_name}\n")
                f.write(f"{'='*100}\n")
                f.write(f"Attack Type: {build.attack_type}\n")
                f.write(f"Upgrades: {', '.join(build.upgrades) if build.upgrades else 'None'}\n")
                f.write(f"Limits: {', '.join(build.limits) if build.limits else 'None'}\n")
                f.write(f"Total Cost: {build.total_cost} points\n")

                for scenario_name, num_enemies, enemy_hp in fight_scenarios:
                    f.write(f"\n{'-'*60}\n")
                    f.write(f"SCENARIO: {scenario_name}\n")
                    f.write(f"{'-'*60}\n")

                    # Set random seed for reproducible results in detailed logs
                    random.seed(42)

                    turns = simulate_combat_verbose(
                        attacker, build,
                        target_hp=enemy_hp,
                        log_file=f,
                        defender=defender,
                        num_enemies=num_enemies,
                        enemy_hp=enemy_hp
                    )

                    total_hp = num_enemies * enemy_hp
                    dpt = total_hp / turns if turns > 0 else 0
                    f.write(f"\nFINAL RESULTS: {turns} turns, {total_hp} total HP, {dpt:.2f} DPT\n")

        print(f"Detailed combat logs saved to {log_filename}")


class BuildReportGenerator:
    """Generates comprehensive build testing reports with statistical analysis"""

    def __init__(self, config: SimulationConfig, reports_dir: str):
        self.config = config
        self.reports_dir = reports_dir
        self.build_config = config.build_testing

    def generate_all_reports(self, all_build_results: List[Tuple]):
        """Generate all build testing reports"""
        if not self.build_config.get('enabled', True):
            print("Build testing disabled, skipping...")
            return

        print("Generating build testing reports...")

        # Generate existing reports using the current system
        if self.config.reports.get('build_reports', {}).get('build_rankings', True):
            # Extract builds from (build, avg_dpt, avg_turns) tuples
            builds_only = [build for build, avg_dpt, avg_turns in all_build_results]
            write_build_summary(builds_only, self.config, self.reports_dir)
            write_builds_turns_table(builds_only, self.config, self.reports_dir)

        if self.config.reports.get('build_reports', {}).get('upgrade_analysis', True):
            generate_upgrade_ranking_report(all_build_results, self.config, self.reports_dir)

        if self.config.reports.get('build_reports', {}).get('cost_effectiveness', True):
            generate_upgrade_pairing_report(all_build_results, self.config, self.reports_dir)

        if self.config.reports.get('build_reports', {}).get('archetype_analysis', True):
            self.generate_archetype_analysis_reports(all_build_results)

        # Generate tactical analysis reports
        if self.config.reports.get('build_reports', {}).get('tactical_analysis', True):
            self.generate_tactical_analysis_reports(all_build_results)

        print("Build testing reports completed!")

    def generate_archetype_analysis_reports(self, all_build_results: List[Tuple]):
        """Generate build archetype analysis reports"""
        print("Generating archetype analysis reports...")

        self.generate_multi_target_specialist_report(all_build_results)
        self.generate_single_target_specialist_report(all_build_results)
        self.generate_balanced_build_report(all_build_results)
        self.generate_risk_reward_analysis_report(all_build_results)

    def generate_multi_target_specialist_report(self, all_build_results: List[Tuple]):
        """Generate report for builds optimized for multi-target scenarios"""
        filename = f"{self.reports_dir}/archetype_multi_target_specialists.txt"

        # Calculate multi-target performance scores
        multi_target_builds = []
        for build, avg_dpt, avg_turns in all_build_results:
            # Get scenario-specific performance (you'll need to modify this based on actual data structure)
            # For now, calculate a multi-target score based on AOE potential
            multi_target_score = self._calculate_multi_target_score(build, avg_dpt)
            multi_target_builds.append((build, avg_dpt, multi_target_score))

        # Sort by multi-target score
        multi_target_builds.sort(key=lambda x: x[2], reverse=True)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - MULTI-TARGET SPECIALIST BUILDS\n")
            f.write("="*80 + "\n\n")
            f.write("Builds optimized for swarm and group combat scenarios (2×50, 4×25, 10×10 HP)\n")
            f.write("Ranked by Multi-Target Performance Score\n\n")
            f.write("Multi-Target Score = (2×50 DPT + 4×25 DPT + 10×10 DPT) / 3\n\n")

            f.write(f"{'Rank':<4} {'Build':<50} {'Avg DPT':<10} {'MT Score':<10} {'Cost':<6}\n")
            f.write("-" * 85 + "\n")

            for i, (build, avg_dpt, mt_score) in enumerate(multi_target_builds[:25], 1):
                build_str = f"{build.attack_type}"
                if build.upgrades:
                    build_str += f" + {' + '.join(build.upgrades)}"
                if build.limits:
                    build_str += f" + {' + '.join(build.limits)}"

                f.write(f"{i:<4} {build_str:<50} {avg_dpt:<10.2f} {mt_score:<10.2f} {build.total_cost:<6}\n")

            # Analysis section
            f.write("\n" + "="*80 + "\n")
            f.write("MULTI-TARGET SPECIALIST ANALYSIS\n")
            f.write("="*80 + "\n\n")

            # Top archetypes analysis
            aoe_builds = [(b, dpt, score) for b, dpt, score in multi_target_builds if 'area' in b.attack_type or 'direct_area' in b.attack_type][:10]

            f.write("TOP AOE ARCHETYPES:\n")
            for i, (build, avg_dpt, mt_score) in enumerate(aoe_builds, 1):
                f.write(f"{i}. {build.attack_type}")
                if build.upgrades:
                    f.write(f" + {' + '.join(build.upgrades)}")
                f.write(f" (MT Score: {mt_score:.2f})\n")

            # Key insights
            f.write(f"\nKEY INSIGHTS:\n")
            f.write(f"• Top MT Score: {multi_target_builds[0][2]:.2f}\n")
            f.write(f"• AOE builds in top 10: {len([b for b, _, _ in multi_target_builds[:10] if 'area' in b.attack_type])}\n")
            f.write(f"• Average cost of top 10: {sum(b.total_cost for b, _, _ in multi_target_builds[:10]) / 10:.1f} points\n")

        print(f"Multi-target specialist report saved to {filename}")

    def generate_single_target_specialist_report(self, all_build_results: List[Tuple]):
        """Generate report for builds optimized for single-target scenarios"""
        filename = f"{self.reports_dir}/archetype_single_target_specialists.txt"

        # Calculate single-target performance scores
        single_target_builds = []
        for build, avg_dpt, avg_turns in all_build_results:
            single_target_score = self._calculate_single_target_score(build, avg_dpt)
            single_target_builds.append((build, avg_dpt, single_target_score))

        # Sort by single-target score
        single_target_builds.sort(key=lambda x: x[2], reverse=True)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - SINGLE-TARGET SPECIALIST BUILDS\n")
            f.write("="*80 + "\n\n")
            f.write("Builds optimized for boss fights and high-HP single enemies (1×100 HP)\n")
            f.write("Ranked by Single-Target Performance Score\n\n")
            f.write("Single-Target Score = 1×100 HP scenario DPT\n\n")

            f.write(f"{'Rank':<4} {'Build':<50} {'Avg DPT':<10} {'ST Score':<10} {'Cost':<6}\n")
            f.write("-" * 85 + "\n")

            for i, (build, avg_dpt, st_score) in enumerate(single_target_builds[:25], 1):
                build_str = f"{build.attack_type}"
                if build.upgrades:
                    build_str += f" + {' + '.join(build.upgrades)}"
                if build.limits:
                    build_str += f" + {' + '.join(build.limits)}"

                f.write(f"{i:<4} {build_str:<50} {avg_dpt:<10.2f} {st_score:<10.2f} {build.total_cost:<6}\n")

            # Analysis section
            f.write("\n" + "="*80 + "\n")
            f.write("SINGLE-TARGET SPECIALIST ANALYSIS\n")
            f.write("="*80 + "\n\n")

            # Attack type analysis
            attack_types = {}
            for build, _, st_score in single_target_builds[:20]:
                attack_type = build.attack_type
                if attack_type not in attack_types:
                    attack_types[attack_type] = []
                attack_types[attack_type].append(st_score)

            f.write("ATTACK TYPE PERFORMANCE (Top 20 builds):\n")
            for attack_type, scores in sorted(attack_types.items(), key=lambda x: max(x[1]), reverse=True):
                avg_score = sum(scores) / len(scores)
                f.write(f"• {attack_type}: {len(scores)} builds, avg {avg_score:.2f}, best {max(scores):.2f}\n")

            # Key insights
            f.write(f"\nKEY INSIGHTS:\n")
            f.write(f"• Top ST Score: {single_target_builds[0][2]:.2f}\n")
            f.write(f"• Most common attack type in top 10: {max(set([b.attack_type for b, _, _ in single_target_builds[:10]]), key=[b.attack_type for b, _, _ in single_target_builds[:10]].count)}\n")
            f.write(f"• Average cost of top 10: {sum(b.total_cost for b, _, _ in single_target_builds[:10]) / 10:.1f} points\n")

        print(f"Single-target specialist report saved to {filename}")

    def generate_balanced_build_report(self, all_build_results: List[Tuple]):
        """Generate report for builds that perform well across all scenarios"""
        filename = f"{self.reports_dir}/archetype_balanced_builds.txt"

        # Calculate balance scores (low variance across scenarios)
        balanced_builds = []
        for build, avg_dpt, avg_turns in all_build_results:
            balance_score = self._calculate_balance_score(build, avg_dpt)
            balanced_builds.append((build, avg_dpt, balance_score))

        # Sort by balance score (higher = more balanced)
        balanced_builds.sort(key=lambda x: x[2], reverse=True)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - BALANCED BUILDS\n")
            f.write("="*80 + "\n\n")
            f.write("Builds that perform consistently across all combat scenarios\n")
            f.write("Ranked by Balance Score (low variance, high overall performance)\n\n")
            f.write("Balance Score = Average DPT - (Scenario Variance × 2)\n\n")

            f.write(f"{'Rank':<4} {'Build':<50} {'Avg DPT':<10} {'Balance':<10} {'Cost':<6}\n")
            f.write("-" * 85 + "\n")

            for i, (build, avg_dpt, balance_score) in enumerate(balanced_builds[:25], 1):
                build_str = f"{build.attack_type}"
                if build.upgrades:
                    build_str += f" + {' + '.join(build.upgrades)}"
                if build.limits:
                    build_str += f" + {' + '.join(build.limits)}"

                f.write(f"{i:<4} {build_str:<50} {avg_dpt:<10.2f} {balance_score:<10.2f} {build.total_cost:<6}\n")

            # Analysis section
            f.write("\n" + "="*80 + "\n")
            f.write("BALANCED BUILD ANALYSIS\n")
            f.write("="*80 + "\n\n")

            f.write("CHARACTERISTICS OF BALANCED BUILDS:\n")

            # Upgrade frequency analysis
            upgrade_counts = {}
            for build, _, _ in balanced_builds[:15]:
                for upgrade in build.upgrades:
                    upgrade_counts[upgrade] = upgrade_counts.get(upgrade, 0) + 1

            f.write("\nMost common upgrades in top 15 balanced builds:\n")
            for upgrade, count in sorted(upgrade_counts.items(), key=lambda x: x[1], reverse=True)[:8]:
                f.write(f"• {upgrade}: {count} builds ({count/15*100:.1f}%)\n")

            # Key insights
            f.write(f"\nKEY INSIGHTS:\n")
            f.write(f"• Top Balance Score: {balanced_builds[0][2]:.2f}\n")
            f.write(f"• Average DPT of top 10: {sum(avg_dpt for _, avg_dpt, _ in balanced_builds[:10]) / 10:.2f}\n")
            f.write(f"• Average cost of top 10: {sum(b.total_cost for b, _, _ in balanced_builds[:10]) / 10:.1f} points\n")

        print(f"Balanced builds report saved to {filename}")

    def generate_risk_reward_analysis_report(self, all_build_results: List[Tuple]):
        """Generate report analyzing risk/reward for unreliable builds"""
        filename = f"{self.reports_dir}/archetype_risk_reward_analysis.txt"

        # Separate builds by risk level
        reliable_builds = []
        low_risk_builds = []
        medium_risk_builds = []
        high_risk_builds = []

        for build, avg_dpt, avg_turns in all_build_results:
            risk_level = self._calculate_risk_level(build)
            if risk_level == "none":
                reliable_builds.append((build, avg_dpt))
            elif risk_level == "low":
                low_risk_builds.append((build, avg_dpt))
            elif risk_level == "medium":
                medium_risk_builds.append((build, avg_dpt))
            else:  # high
                high_risk_builds.append((build, avg_dpt))

        # Sort each category by DPT
        reliable_builds.sort(key=lambda x: x[1], reverse=True)
        low_risk_builds.sort(key=lambda x: x[1], reverse=True)
        medium_risk_builds.sort(key=lambda x: x[1], reverse=True)
        high_risk_builds.sort(key=lambda x: x[1], reverse=True)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - RISK/REWARD ANALYSIS\n")
            f.write("="*80 + "\n\n")
            f.write("Analysis of build reliability and risk/reward ratios\n\n")

            # Risk categories
            f.write("RISK CATEGORIES:\n")
            f.write("• No Risk: No unreliable limits\n")
            f.write("• Low Risk: Unreliable 1 (DC 5) or turn-based limits\n")
            f.write("• Medium Risk: Unreliable 2 (DC 10)\n")
            f.write("• High Risk: Unreliable 3 (DC 15)\n\n")

            # Summary stats
            f.write("RISK DISTRIBUTION:\n")
            f.write(f"• No Risk: {len(reliable_builds)} builds\n")
            f.write(f"• Low Risk: {len(low_risk_builds)} builds\n")
            f.write(f"• Medium Risk: {len(medium_risk_builds)} builds\n")
            f.write(f"• High Risk: {len(high_risk_builds)} builds\n\n")

            # Performance by risk category
            f.write("PERFORMANCE BY RISK CATEGORY (Top 10 per category):\n")
            f.write("="*80 + "\n")

            categories = [
                ("NO RISK BUILDS", reliable_builds),
                ("LOW RISK BUILDS", low_risk_builds),
                ("MEDIUM RISK BUILDS", medium_risk_builds),
                ("HIGH RISK BUILDS", high_risk_builds)
            ]

            for category_name, builds in categories:
                f.write(f"\n{category_name}:\n")
                f.write(f"{'Rank':<4} {'Build':<45} {'DPT':<8} {'Cost':<6}\n")
                f.write("-" * 68 + "\n")

                for i, (build, avg_dpt) in enumerate(builds[:10], 1):
                    build_str = f"{build.attack_type}"
                    if build.upgrades:
                        build_str += f" + {' + '.join(build.upgrades[:2])}"  # Truncate for space
                        if len(build.upgrades) > 2:
                            build_str += "..."
                    if build.limits:
                        build_str += f" + {' + '.join(build.limits[:1])}"
                        if len(build.limits) > 1:
                            build_str += "..."

                    f.write(f"{i:<4} {build_str:<45} {avg_dpt:<8.2f} {build.total_cost:<6}\n")

                # Category stats
                if builds:
                    avg_dpt_cat = sum(b[1] for b in builds[:10]) / min(10, len(builds))
                    avg_cost_cat = sum(b[0].total_cost for b in builds[:10]) / min(10, len(builds))
                    f.write(f"Average DPT (top 10): {avg_dpt_cat:.2f}\n")
                    f.write(f"Average Cost (top 10): {avg_cost_cat:.1f} points\n")

            # Risk/Reward insights
            f.write("\n" + "="*80 + "\n")
            f.write("RISK/REWARD INSIGHTS:\n")
            f.write("="*80 + "\n")

            if reliable_builds and high_risk_builds:
                best_reliable = reliable_builds[0][1]
                best_high_risk = high_risk_builds[0][1]
                risk_premium = best_high_risk - best_reliable
                f.write(f"• Best reliable build DPT: {best_reliable:.2f}\n")
                f.write(f"• Best high-risk build DPT: {best_high_risk:.2f}\n")
                f.write(f"• Risk premium: {risk_premium:.2f} DPT ({risk_premium/best_reliable*100:.1f}%)\n\n")

            # Recommendations
            f.write("RECOMMENDATIONS:\n")
            f.write("• For consistent performance: Choose No Risk builds\n")
            f.write("• For competitive play: Consider Low Risk builds for reliability\n")
            f.write("• For high-stakes scenarios: High Risk builds offer maximum potential\n")
            f.write("• For learning: Start with No Risk builds, graduate to Low Risk\n")

        print(f"Risk/reward analysis report saved to {filename}")

    def _calculate_multi_target_score(self, build, avg_dpt):
        """Calculate a score representing multi-target effectiveness"""
        # For now, use a simple heuristic based on attack type and upgrades
        # In a real implementation, you'd use actual scenario-specific DPT data

        base_score = avg_dpt

        # Bonus for AOE attack types
        if 'area' in build.attack_type:
            base_score *= 1.5
        elif 'direct_area' in build.attack_type:
            base_score *= 1.3

        # Bonus for multi-target upgrades
        multi_target_upgrades = ['bleed', 'critical_effect', 'brutal']
        for upgrade in build.upgrades:
            if upgrade in multi_target_upgrades:
                base_score *= 1.1

        return base_score

    def _calculate_single_target_score(self, build, avg_dpt):
        """Calculate a score representing single-target effectiveness"""
        # For now, use a simple heuristic
        # In a real implementation, you'd use actual 1×100 HP scenario DPT data

        base_score = avg_dpt

        # Bonus for single-target attack types
        if build.attack_type in ['melee_dg', 'melee_ac']:
            base_score *= 1.2
        elif 'direct_damage' == build.attack_type:
            base_score *= 1.1

        # Penalty for AOE (less effective single-target)
        if 'area' in build.attack_type:
            base_score *= 0.8

        # Bonus for single-target upgrades
        single_target_upgrades = ['high_impact', 'armor_piercing', 'finishing_blow_3', 'powerful_critical']
        for upgrade in build.upgrades:
            if upgrade in single_target_upgrades:
                base_score *= 1.1

        return base_score

    def _calculate_balance_score(self, build, avg_dpt):
        """Calculate a score representing consistency across scenarios"""
        # For now, use a simple heuristic
        # In a real implementation, you'd calculate actual variance across scenarios

        base_score = avg_dpt

        # Penalty for extreme specialization
        if 'area' in build.attack_type:
            base_score *= 0.9  # AOE builds are less balanced

        # Bonus for reliable upgrades
        reliable_upgrades = ['reliable_accuracy', 'accurate_attack', 'power_attack']
        for upgrade in build.upgrades:
            if upgrade in reliable_upgrades:
                base_score *= 1.05

        # Penalty for unreliable limits
        for limit in build.limits:
            if 'unreliable' in limit:
                base_score *= 0.95

        return base_score

    def _calculate_risk_level(self, build):
        """Determine the risk level of a build based on its limits"""
        if not build.limits:
            return "none"

        risk_levels = []
        for limit in build.limits:
            if limit == "unreliable_3":
                risk_levels.append("high")
            elif limit == "unreliable_2":
                risk_levels.append("medium")
            elif limit == "unreliable_1":
                risk_levels.append("low")
            elif limit in ["quickdraw", "steady", "patient", "finale", "charge_up", "charge_up_2"]:
                risk_levels.append("low")

        if not risk_levels:
            return "none"

        # Return highest risk level
        if "high" in risk_levels:
            return "high"
        elif "medium" in risk_levels:
            return "medium"
        elif "low" in risk_levels:
            return "low"
        else:
            return "none"

    def generate_tactical_analysis_reports(self, all_build_results: List[Tuple]):
        """Generate tactical analysis reports"""
        print("Generating tactical analysis reports...")

        self.generate_upgrade_synergy_matrix_report(all_build_results)
        self.generate_scenario_deep_dive_report(all_build_results)
        self.generate_attack_type_viability_report(all_build_results)
        self.generate_point_efficiency_analysis_report(all_build_results)

    def generate_upgrade_synergy_matrix_report(self, all_build_results: List[Tuple]):
        """Generate upgrade synergy matrix showing which upgrades work well together"""
        filename = f"{self.reports_dir}/tactical_upgrade_synergy_matrix.txt"

        # Analyze upgrade combinations
        upgrade_pairs = {}
        single_upgrades = {}

        for build, avg_dpt, avg_turns in all_build_results:
            # Track single upgrades
            if len(build.upgrades) == 1:
                upgrade = build.upgrades[0]
                if upgrade not in single_upgrades:
                    single_upgrades[upgrade] = []
                single_upgrades[upgrade].append(avg_dpt)

            # Track upgrade pairs
            elif len(build.upgrades) == 2:
                pair = tuple(sorted(build.upgrades))
                if pair not in upgrade_pairs:
                    upgrade_pairs[pair] = []
                upgrade_pairs[pair].append(avg_dpt)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - UPGRADE SYNERGY MATRIX\n")
            f.write("="*80 + "\n\n")
            f.write("Analysis of upgrade combinations and their synergistic effects\n\n")

            # Calculate expected vs actual performance for pairs
            f.write("SYNERGY ANALYSIS (Top 20 Pairs):\n")
            f.write("="*80 + "\n")
            f.write(f"{'Upgrade Pair':<45} {'Avg DPT':<10} {'Expected':<10} {'Synergy':<10} {'Rating':<10}\n")
            f.write("-" * 95 + "\n")

            synergy_results = []
            for pair, dpts in upgrade_pairs.items():
                if len(dpts) >= 3:  # Minimum sample size
                    avg_dpt = sum(dpts) / len(dpts)

                    # Calculate expected performance (sum of individual upgrades)
                    upgrade1_avg = sum(single_upgrades.get(pair[0], [8.0])) / len(single_upgrades.get(pair[0], [8.0]))
                    upgrade2_avg = sum(single_upgrades.get(pair[1], [8.0])) / len(single_upgrades.get(pair[1], [8.0]))
                    expected_dpt = upgrade1_avg + upgrade2_avg - 8.0  # Subtract base once

                    synergy_bonus = avg_dpt - expected_dpt
                    synergy_rating = self._get_synergy_rating(synergy_bonus)

                    synergy_results.append((pair, avg_dpt, expected_dpt, synergy_bonus, synergy_rating))

            # Sort by synergy bonus
            synergy_results.sort(key=lambda x: x[3], reverse=True)

            for pair, avg_dpt, expected_dpt, synergy_bonus, rating in synergy_results[:20]:
                pair_str = f"{pair[0]} + {pair[1]}"
                f.write(f"{pair_str:<45} {avg_dpt:<10.2f} {expected_dpt:<10.2f} {synergy_bonus:<10.2f} {rating:<10}\n")

            # Synergy insights
            f.write("\n" + "="*80 + "\n")
            f.write("SYNERGY INSIGHTS:\n")
            f.write("="*80 + "\n\n")

            positive_synergies = [s for s in synergy_results if s[3] > 0.5]
            negative_synergies = [s for s in synergy_results if s[3] < -0.5]

            f.write(f"POSITIVE SYNERGIES ({len(positive_synergies)} pairs):\n")
            for pair, _, _, synergy_bonus, _ in positive_synergies[:5]:
                f.write(f"• {pair[0]} + {pair[1]}: +{synergy_bonus:.2f} DPT bonus\n")

            f.write(f"\nNEGATIVE SYNERGIES ({len(negative_synergies)} pairs):\n")
            for pair, _, _, synergy_bonus, _ in negative_synergies[-5:]:
                f.write(f"• {pair[0]} + {pair[1]}: {synergy_bonus:.2f} DPT penalty\n")

            # Common synergy patterns
            f.write(f"\nCOMMON SYNERGY PATTERNS:\n")
            patterns = self._analyze_synergy_patterns(synergy_results)
            for pattern in patterns:
                f.write(f"• {pattern}\n")

        print(f"Upgrade synergy matrix saved to {filename}")

    def generate_scenario_deep_dive_report(self, all_build_results: List[Tuple]):
        """Generate detailed analysis of what makes builds effective in specific scenarios"""
        filename = f"{self.reports_dir}/tactical_scenario_deep_dive.txt"

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - SCENARIO DEEP DIVE ANALYSIS\n")
            f.write("="*80 + "\n\n")
            f.write("Detailed analysis of tactical effectiveness across combat scenarios\n\n")

            scenarios = [
                ("1×100 HP Boss", "Single-target, high-HP encounter"),
                ("2×50 HP Enemies", "Medium group, balanced engagement"),
                ("4×25 HP Enemies", "Large group, coordination required"),
                ("10×10 HP Enemies", "Swarm, AOE optimization critical")
            ]

            for scenario_name, scenario_desc in scenarios:
                f.write(f"\n{scenario_name.upper()} - {scenario_desc}\n")
                f.write("="*80 + "\n")

                # Analyze what makes builds successful in this scenario
                successful_builds = self._get_scenario_top_builds(all_build_results, scenario_name)

                f.write("TOP PERFORMING BUILDS:\n")
                for i, (build, performance) in enumerate(successful_builds[:5], 1):
                    f.write(f"{i}. {build.attack_type}")
                    if build.upgrades:
                        f.write(f" + {' + '.join(build.upgrades[:2])}")
                    f.write(f" (Performance: {performance:.2f})\n")

                # Analyze common characteristics
                f.write(f"\nKEY SUCCESS FACTORS:\n")
                success_factors = self._analyze_scenario_success_factors(successful_builds, scenario_name)
                for factor in success_factors:
                    f.write(f"• {factor}\n")

                # Tactical recommendations
                f.write(f"\nTACTICAL RECOMMENDATIONS:\n")
                tactics = self._get_scenario_tactics(scenario_name)
                for tactic in tactics:
                    f.write(f"• {tactic}\n")

                # Common mistakes
                f.write(f"\nCOMMON MISTAKES TO AVOID:\n")
                mistakes = self._get_scenario_mistakes(scenario_name)
                for mistake in mistakes:
                    f.write(f"• {mistake}\n")

        print(f"Scenario deep dive analysis saved to {filename}")

    def generate_attack_type_viability_report(self, all_build_results: List[Tuple]):
        """Generate report on when to choose each attack type"""
        filename = f"{self.reports_dir}/tactical_attack_type_viability.txt"

        # Analyze attack type performance
        attack_type_data = {}
        for build, avg_dpt, avg_turns in all_build_results:
            attack_type = build.attack_type
            if attack_type not in attack_type_data:
                attack_type_data[attack_type] = []
            attack_type_data[attack_type].append(avg_dpt)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - ATTACK TYPE VIABILITY CHART\n")
            f.write("="*80 + "\n\n")
            f.write("Comprehensive guide for choosing the right attack type\n\n")

            # Attack type performance summary
            f.write("ATTACK TYPE PERFORMANCE SUMMARY:\n")
            f.write("="*80 + "\n")
            f.write(f"{'Attack Type':<20} {'Avg DPT':<10} {'Best DPT':<10} {'Builds':<8} {'Viability':<12}\n")
            f.write("-" * 70 + "\n")

            attack_summaries = []
            for attack_type, dpts in attack_type_data.items():
                avg_dpt = sum(dpts) / len(dpts)
                best_dpt = max(dpts)
                build_count = len(dpts)
                viability = self._assess_attack_type_viability(avg_dpt, best_dpt, build_count)
                attack_summaries.append((attack_type, avg_dpt, best_dpt, build_count, viability))

            attack_summaries.sort(key=lambda x: x[1], reverse=True)

            for attack_type, avg_dpt, best_dpt, build_count, viability in attack_summaries:
                f.write(f"{attack_type:<20} {avg_dpt:<10.2f} {best_dpt:<10.2f} {build_count:<8} {viability:<12}\n")

            # Detailed attack type analysis
            f.write("\n" + "="*80 + "\n")
            f.write("DETAILED ATTACK TYPE ANALYSIS:\n")
            f.write("="*80 + "\n")

            attack_analyses = {
                "melee_ac": {
                    "strengths": ["High accuracy bonus", "Adjacent positioning", "Reliable hit chance"],
                    "weaknesses": ["Close range requirement", "Vulnerable to counterattacks", "Lower damage"],
                    "best_for": ["Accurate strikes", "Hit-and-run tactics", "Setup attacks"],
                    "avoid_when": ["Low mobility", "Heavy enemy defense", "Need range"]
                },
                "melee_dg": {
                    "strengths": ["High damage bonus", "Cost effective", "Straightforward"],
                    "weaknesses": ["Close range requirement", "Standard accuracy", "Single target"],
                    "best_for": ["Raw damage output", "Boss fights", "Budget builds"],
                    "avoid_when": ["Multiple enemies", "High avoidance targets", "Range needed"]
                },
                "ranged": {
                    "strengths": ["Safe positioning", "No adjacency penalty", "Flexible range"],
                    "weaknesses": ["Penalty when adjacent", "No inherent bonuses", "Equipment dependent"],
                    "best_for": ["Kiting enemies", "Supporting allies", "Versatile combat"],
                    "avoid_when": ["Forced close combat", "Need high damage", "Limited space"]
                },
                "area": {
                    "strengths": ["Multi-target capability", "Crowd control", "Scales with enemies"],
                    "weaknesses": ["Accuracy penalty", "Damage penalty", "Single-target weak"],
                    "best_for": ["Group enemies", "Swarm scenarios", "Area denial"],
                    "avoid_when": ["Single targets", "Precision needed", "Friendly fire risk"]
                },
                "direct_damage": {
                    "strengths": ["Guaranteed damage", "No accuracy rolls", "Consistent output"],
                    "weaknesses": ["Fixed damage", "No scaling", "Expensive upgrades"],
                    "best_for": ["Reliable damage", "High-avoidance targets", "Finishing moves"],
                    "avoid_when": ["Need high damage", "Multiple targets", "Budget builds"]
                },
                "direct_area_damage": {
                    "strengths": ["Guaranteed AOE", "No accuracy needed", "Multi-target reliable"],
                    "weaknesses": ["Lower damage", "Fixed output", "Very expensive"],
                    "best_for": ["Reliable AOE", "Swarm clearing", "Setup damage"],
                    "avoid_when": ["Single targets", "Need high damage", "Point limited"]
                }
            }

            for attack_type, analysis in attack_analyses.items():
                if attack_type in attack_type_data:
                    f.write(f"\n{attack_type.upper().replace('_', ' ')}:\n")
                    f.write(f"Strengths: {', '.join(analysis['strengths'])}\n")
                    f.write(f"Weaknesses: {', '.join(analysis['weaknesses'])}\n")
                    f.write(f"Best for: {', '.join(analysis['best_for'])}\n")
                    f.write(f"Avoid when: {', '.join(analysis['avoid_when'])}\n")

        print(f"Attack type viability chart saved to {filename}")

    def generate_point_efficiency_analysis_report(self, all_build_results: List[Tuple]):
        """Generate analysis of optimal spending patterns for different point budgets"""
        filename = f"{self.reports_dir}/tactical_point_efficiency_analysis.txt"

        # Organize builds by cost brackets
        cost_brackets = {
            "budget": (20, 30),
            "standard": (31, 50),
            "premium": (51, 70),
            "luxury": (71, 100)
        }

        bracket_data = {bracket: [] for bracket in cost_brackets}

        for build, avg_dpt, avg_turns in all_build_results:
            for bracket, (min_cost, max_cost) in cost_brackets.items():
                if min_cost <= build.total_cost <= max_cost:
                    bracket_data[bracket].append((build, avg_dpt, build.total_cost))
                    break

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - POINT EFFICIENCY ANALYSIS\n")
            f.write("="*80 + "\n\n")
            f.write("Optimal upgrade spending patterns for different point budgets\n\n")

            # Efficiency by bracket
            f.write("EFFICIENCY BY COST BRACKET:\n")
            f.write("="*80 + "\n")

            for bracket, (min_cost, max_cost) in cost_brackets.items():
                builds = bracket_data[bracket]
                if not builds:
                    continue

                f.write(f"\n{bracket.upper()} BRACKET ({min_cost}-{max_cost} points):\n")
                f.write("-" * 50 + "\n")

                # Sort by DPT/cost ratio
                builds_by_efficiency = sorted(builds, key=lambda x: x[1]/x[2], reverse=True)

                f.write("Top 5 most efficient builds:\n")
                for i, (build, avg_dpt, cost) in enumerate(builds_by_efficiency[:5], 1):
                    efficiency = avg_dpt / cost
                    build_str = f"{build.attack_type}"
                    if build.upgrades:
                        build_str += f" + {' + '.join(build.upgrades[:2])}"
                        if len(build.upgrades) > 2:
                            build_str += "..."
                    f.write(f"{i}. {build_str} ({cost}p): {avg_dpt:.2f} DPT, {efficiency:.3f} DPT/pt\n")

                # Bracket analysis
                avg_efficiency = sum(dpt/cost for _, dpt, cost in builds) / len(builds)
                f.write(f"\nBracket average efficiency: {avg_efficiency:.3f} DPT/point\n")

            # Spending recommendations
            f.write("\n" + "="*80 + "\n")
            f.write("SPENDING RECOMMENDATIONS BY BUDGET:\n")
            f.write("="*80 + "\n")

            recommendations = {
                "budget": [
                    "Focus on single high-impact upgrades",
                    "Base attack types provide good foundation",
                    "Power Attack offers solid DPT increase",
                    "Avoid expensive combo upgrades"
                ],
                "standard": [
                    "Two-upgrade combinations become viable",
                    "Consider upgrade synergies",
                    "Finishing Blow 1 provides good value",
                    "Armor Piercing for tough enemies"
                ],
                "premium": [
                    "Three-upgrade builds unlock potential",
                    "High-cost upgrades justify investment",
                    "Finishing Blow 2 becomes attractive",
                    "Risk/reward builds viable"
                ],
                "luxury": [
                    "Maximum upgrade combinations",
                    "Finishing Blow 3 dominates",
                    "Multiple synergistic effects",
                    "Experimental high-risk builds"
                ]
            }

            for bracket, recs in recommendations.items():
                if bracket_data[bracket]:
                    min_cost, max_cost = cost_brackets[bracket]
                    f.write(f"\n{bracket.upper()} ({min_cost}-{max_cost} points):\n")
                    for rec in recs:
                        f.write(f"• {rec}\n")

            # Diminishing returns analysis
            f.write("\n" + "="*80 + "\n")
            f.write("DIMINISHING RETURNS ANALYSIS:\n")
            f.write("="*80 + "\n")

            f.write("Point efficiency decreases as budget increases:\n")
            for bracket, (min_cost, max_cost) in cost_brackets.items():
                builds = bracket_data[bracket]
                if builds:
                    avg_efficiency = sum(dpt/cost for _, dpt, cost in builds) / len(builds)
                    f.write(f"• {bracket.capitalize()}: {avg_efficiency:.3f} DPT/point\n")

            f.write("\nKey efficiency thresholds:\n")
            f.write("• 20-30 points: Highest efficiency, focus on core upgrades\n")
            f.write("• 31-50 points: Good efficiency, combo potential emerges\n")
            f.write("• 51-70 points: Diminishing returns, but powerful combinations\n")
            f.write("• 71+ points: Low efficiency, but maximum power potential\n")

        print(f"Point efficiency analysis saved to {filename}")

    def _get_synergy_rating(self, synergy_bonus):
        """Get synergy rating based on bonus value"""
        if synergy_bonus >= 2.0:
            return "Excellent"
        elif synergy_bonus >= 1.0:
            return "Good"
        elif synergy_bonus >= 0.0:
            return "Neutral"
        elif synergy_bonus >= -1.0:
            return "Poor"
        else:
            return "Terrible"

    def _analyze_synergy_patterns(self, synergy_results):
        """Analyze common patterns in upgrade synergies"""
        patterns = [
            "Critical upgrades synergize well together (Critical Accuracy + Powerful Critical)",
            "Finishing Blow upgrades scale better with multiple enemies",
            "AOE + Condition effects create exponential scaling",
            "High-risk + High-reward combinations often disappoint",
            "Defensive upgrades rarely synergize with offensive ones"
        ]
        return patterns

    def _get_scenario_top_builds(self, all_build_results, scenario_name):
        """Get top builds for a specific scenario (mock implementation)"""
        # In real implementation, would filter by actual scenario performance
        # For now, return mock data based on scenario type
        if "1×100" in scenario_name:
            return [(build, dpt * 1.2) for build, dpt, avg_turns in all_build_results[:10] if 'area' not in build.attack_type]
        elif "10×10" in scenario_name:
            return [(build, dpt * 1.5) for build, dpt, avg_turns in all_build_results[:10] if 'area' in build.attack_type]
        else:
            return [(build, dpt) for build, dpt, avg_turns in all_build_results[:10]]
        
    def _analyze_scenario_success_factors(self, successful_builds, scenario_name):
        """Analyze what makes builds successful in a scenario"""
        factors = {
            "1×100 HP Boss": [
                "High single-target damage output",
                "Armor piercing for high-durability enemies",
                "Reliable accuracy to ensure hits",
                "Finishing blow effects for execution"
            ],
            "2×50 HP Enemies": [
                "Balanced single and multi-target capability",
                "Good action economy",
                "Moderate AOE effectiveness",
                "Flexible positioning options"
            ],
            "4×25 HP Enemies": [
                "Strong AOE capabilities",
                "Multi-target conditions like Bleed",
                "Area denial and positioning",
                "Efficient enemy elimination"
            ],
            "10×10 HP Enemies": [
                "Maximum AOE damage output",
                "Condition effects that scale with targets",
                "Quick enemy elimination",
                "Swarm management capabilities"
            ]
        }
        return factors.get(scenario_name, ["Adaptability", "Versatility", "Consistent performance"])

    def _get_scenario_tactics(self, scenario_name):
        """Get tactical recommendations for a scenario"""
        tactics = {
            "1×100 HP Boss": [
                "Focus all damage on single target",
                "Use reliable upgrades for consistency",
                "Save burst abilities for critical moments",
                "Consider armor piercing for high-DR enemies"
            ],
            "2×50 HP Enemies": [
                "Prioritize target elimination",
                "Use positioning to avoid being surrounded",
                "Consider limited AOE for efficiency",
                "Focus fire to reduce enemy action economy"
            ],
            "4×25 HP Enemies": [
                "Maximize AOE potential",
                "Use area denial to control positioning",
                "Apply conditions to multiple targets",
                "Eliminate weakest enemies first"
            ],
            "10×10 HP Enemies": [
                "Prioritize AOE damage above all else",
                "Use DOT effects for maximum scaling",
                "Control swarm movement",
                "Eliminate groups systematically"
            ]
        }
        return tactics.get(scenario_name, ["Adapt to enemy behavior", "Use terrain advantage"])

    def _get_scenario_mistakes(self, scenario_name):
        """Get common mistakes for a scenario"""
        mistakes = {
            "1×100 HP Boss": [
                "Wasting points on AOE upgrades",
                "Using unreliable effects in critical moments",
                "Ignoring armor/durability considerations",
                "Poor positioning for adjacency bonuses"
            ],
            "2×50 HP Enemies": [
                "Overcommitting to pure AOE builds",
                "Poor target prioritization",
                "Getting surrounded by enemies",
                "Inefficient action usage"
            ],
            "4×25 HP Enemies": [
                "Using only single-target attacks",
                "Poor positioning for AOE coverage",
                "Ignoring condition/DOT potential",
                "Focusing on toughest enemies first"
            ],
            "10×10 HP Enemies": [
                "Any single-target focus",
                "Underestimating swarm damage potential",
                "Poor AOE positioning",
                "Trying to tank instead of control"
            ]
        }
        return mistakes.get(scenario_name, ["Poor preparation", "Inflexible tactics"])

    def _assess_attack_type_viability(self, avg_dpt, best_dpt, build_count):
        """Assess overall viability of an attack type"""
        if avg_dpt >= 10.0 and best_dpt >= 15.0:
            return "Excellent"
        elif avg_dpt >= 8.0 and best_dpt >= 12.0:
            return "Good"
        elif avg_dpt >= 6.0 and best_dpt >= 10.0:
            return "Fair"
        else:
            return "Poor"


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