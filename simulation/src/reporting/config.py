"""
Configuration management for the Vitality System combat simulator.
"""

import json
import os
from datetime import datetime
from src.models import SimulationConfig


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
            build_chunk_size=data.get('build_chunk_size', 2000),

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
        if 'fight_scenarios' in data:
            config.fight_scenarios = data['fight_scenarios']

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

    # Print actual scenarios from config
    if hasattr(config, 'fight_scenarios') and config.fight_scenarios.get('enabled', True):
        scenario_names = [s['name'].replace('Fight ', '').replace(': ', '') for s in config.fight_scenarios.get('scenarios', [])]
        print(f"Enemy Scenarios: {', '.join(scenario_names)}")
    else:
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