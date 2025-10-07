#!/usr/bin/env python3
"""
Verbose damage optimization calculator with detailed combat logging
"""

import os
import time
import multiprocessing
import gc
from concurrent.futures import ProcessPoolExecutor
from src.models import Character, AttackBuild, MultiAttackBuild, SimulationConfig
from src.build_generator import generate_valid_builds, generate_valid_builds_chunked, generate_archetype_builds_chunked
from src.simulation import simulate_combat_verbose, run_simulation_batch
from src.reporting import (load_config, save_config, print_configuration_report,
                      generate_upgrade_performance_report, write_upgrade_performance_report,
                      generate_combo_performance_report, write_combo_performance_report,
                      write_build_summary, generate_upgrade_ranking_report, generate_upgrade_pairing_report,
                      generate_diagnostic_report, write_attack_type_enhancement_ranking_report,
                      create_timestamped_reports_directory, generate_reports_by_mode,
                      print_simulation_stats_receipt)
from src.logging_manager import LoggingManager

def test_single_build(args):
    """Test a single build across all test cases and scenarios"""
    build_idx, build, test_cases, config, logger, print_progress = args

    # For multiprocessing, logger object can't be passed directly
    # Instead, we'll disable detailed logging in worker processes
    should_log = False

    # Collect ALL raw turn results (not pre-averaged) for true average calculation
    all_raw_turns = []
    total_dpt = 0
    total_configs = 0

    # Skip logging in worker processes for multiprocessing compatibility

    for case_name, attacker, defender in test_cases:

        # Load fight scenarios from config (with fallback to defaults)
        if hasattr(config, 'fight_scenarios') and config.fight_scenarios.get('enabled', True):
            # Read from config
            config_scenarios = config.fight_scenarios.get('scenarios', [])
            fight_scenarios = [
                (s['name'], s.get('enemy_hp_list'), s.get('num_enemies'), s.get('enemy_hp'))
                for s in config_scenarios
            ]
        else:
            # Fallback to defaults (8 scenarios: 4 homogeneous + 4 mixed)
            fight_scenarios = [
                ("Fight 1: 1x100 HP Boss", None, 1, 100),
                ("Fight 2: 2x50 HP Enemies", None, 2, 50),
                ("Fight 3: 4x25 HP Enemies", None, 4, 25),
                ("Fight 4: 10x10 HP Enemies", None, 10, 10),
                ("Fight 5: 1x100 + 2x50 HP (Boss+Elites)", [100, 50, 50], None, None),
                ("Fight 6: 1x25 + 6x10 HP (Captain+Swarm)", [25, 10, 10, 10, 10, 10, 10], None, None),
                ("Fight 7: 1x50 + 6x10 HP (Elite+Swarm)", [50, 10, 10, 10, 10, 10, 10], None, None),
                ("Fight 8: 1x100 + 4x25 HP (Boss+Captains)", [100, 25, 25, 25, 25], None, None)
            ]

        case_total_dpt = 0
        scenario_count = 0

        for scenario_data in fight_scenarios:
            # Handle scenario data format
            scenario_name, enemy_hp_list, num_enemies, enemy_hp = scenario_data

            # Run batch simulation
            results, avg_turns, dpt, outcome_stats = run_simulation_batch(
                attacker, build, config.build_testing_runs, config.target_hp, defender,
                num_enemies=num_enemies if num_enemies else 0, enemy_hp=enemy_hp,
                enemy_hp_list=enemy_hp_list)

            # Skip scenario logging in worker processes

            # Store raw turn results instead of pre-averaged value
            all_raw_turns.extend(results)
            case_total_dpt += dpt
            scenario_count += 1

        # Average dpt across all scenarios for this case
        case_avg_dpt = case_total_dpt / scenario_count if scenario_count > 0 else 0

        # Skip case logging in worker processes

        total_dpt += case_avg_dpt
        total_configs += 1

    # Calculate true average from ALL raw turn counts (not average of averages)
    avg_turns = sum(all_raw_turns) / len(all_raw_turns) if all_raw_turns else 0
    avg_dpt = total_dpt / total_configs if total_configs > 0 else 0

    # Return build, average dpt, and average turns
    return (build, avg_dpt, avg_turns)


def test_multi_attack_build(args):
    """Test a multi-attack build using fallback logic (try Attack 2, fall back to Attack 1 if unavailable)

    The simulation now handles attack selection automatically:
    - Each turn, it tries the preferred attack (Attack 2 for dual_natured)
    - If that attack can't be used due to limits, it falls back to Attack 1
    - This simulates intelligent combat behavior where players use their best available attack
    """
    build_idx, multi_build, test_cases, config, logger, print_progress = args

    # Collect ALL raw turn results (not pre-averaged) for true average calculation
    all_raw_turns = []
    total_configs = 0

    for case_name, attacker, defender in test_cases:
        # Load fight scenarios from config
        if hasattr(config, 'fight_scenarios') and config.fight_scenarios.get('enabled', True):
            config_scenarios = config.fight_scenarios.get('scenarios', [])
            fight_scenarios = [
                (s['name'], s.get('enemy_hp_list'), s.get('num_enemies'), s.get('enemy_hp'))
                for s in config_scenarios
            ]
        else:
            fight_scenarios = [
                ("Fight 1: 1x100 HP Boss", None, 1, 100),
                ("Fight 2: 2x50 HP Enemies", None, 2, 50),
                ("Fight 3: 4x25 HP Enemies", None, 4, 25),
                ("Fight 4: 10x10 HP Enemies", None, 10, 10),
                ("Fight 5: 1x100 + 2x50 HP (Boss+Elites)", [100, 50, 50], None, None),
                ("Fight 6: 1x25 + 6x10 HP (Captain+Swarm)", [25, 10, 10, 10, 10, 10, 10], None, None),
                ("Fight 7: 1x50 + 6x10 HP (Elite+Swarm)", [50, 10, 10, 10, 10, 10, 10], None, None),
                ("Fight 8: 1x100 + 4x25 HP (Boss+Captains)", [100, 25, 25, 25, 25], None, None)
            ]

        for scenario_data in fight_scenarios:
            scenario_name, enemy_hp_list, num_enemies, enemy_hp = scenario_data

            # Run batch simulation with the full multi-attack build
            # The simulation will handle fallback logic automatically
            results, avg_turns, dpt, outcome_stats = run_simulation_batch(
                attacker, multi_build, config.build_testing_runs, config.target_hp, defender,
                num_enemies=num_enemies if num_enemies else 0, enemy_hp=enemy_hp,
                enemy_hp_list=enemy_hp_list)

            # Store raw turn results instead of pre-averaged value
            all_raw_turns.extend(results)

        total_configs += 1

    # Calculate true average from ALL raw turn counts (not average of averages)
    avg_turns = sum(all_raw_turns) / len(all_raw_turns) if all_raw_turns else float('inf')
    avg_dpt = 0  # Placeholder for multi-attack builds
    return (multi_build, avg_dpt, avg_turns)


def main():
    """Main execution function for the damage optimizer"""
    # Load configuration
    config = load_config()

    # Create timestamped reports directory
    reports_dir = create_timestamped_reports_directory()
    print(f"Reports will be saved to: {reports_dir}")

    # Print configuration report
    print_configuration_report(config)

    # Check execution mode and run appropriate testing
    print(f"\nExecution Mode: {config.execution_mode}")

    if config.execution_mode == "individual":
        print("Running individual testing only...")
        generate_reports_by_mode(config, reports_dir)
        print("\nIndividual testing complete!")
        return

    elif config.execution_mode == "build":
        print("Running build testing only...")
        all_archetype_results = {}
        for archetype in config.archetypes:
            print(f"\n{'='*80}")
            print(f"TESTING ARCHETYPE: {archetype.upper()}")
            print(f"{'='*80}\n")
            archetype_dir = f"{reports_dir}/{archetype}"
            os.makedirs(archetype_dir, exist_ok=True)
            build_results = run_build_testing(config, archetype, archetype_dir)
            all_archetype_results[archetype] = build_results
            generate_reports_by_mode(config, archetype_dir, build_results)
        print("\nBuild testing complete for all archetypes!")
        return

    elif config.execution_mode == "both":
        print("Running both individual and build testing...")
        # Run individual testing first
        generate_reports_by_mode(config, reports_dir)
        # Then run build testing for all archetypes
        all_archetype_results = {}
        for archetype in config.archetypes:
            print(f"\n{'='*80}")
            print(f"TESTING ARCHETYPE: {archetype.upper()}")
            print(f"{'='*80}\n")
            archetype_dir = f"{reports_dir}/{archetype}"
            os.makedirs(archetype_dir, exist_ok=True)
            build_results = run_build_testing(config, archetype, archetype_dir)
            all_archetype_results[archetype] = build_results
            generate_reports_by_mode(config, archetype_dir, build_results)
        print("\nBoth testing modes complete for all archetypes!")
        return

    else:
        print(f"Unknown execution mode: {config.execution_mode}")
        print("Valid modes: 'individual', 'build', 'both'")
        return


def run_build_testing(config: SimulationConfig, archetype: str, reports_dir: str):
    """Run the build testing portion of the simulator"""
    print(f"Starting build testing for {archetype}...")

    # Generate builds to test using chunked approach
    attack_types = config.attack_types_filter or ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    # Get chunk size from config
    chunk_size = config.build_chunk_size

    # Determine which test function to use based on archetype
    is_multi_attack = archetype in ['dual_natured', 'versatile_master']
    test_func = test_multi_attack_build if is_multi_attack else test_single_build

    # Use itertools.tee to avoid double generation
    from itertools import tee

    # Generate once and split into two iterators
    print("Generating builds for testing...")
    builds_gen_temp = generate_archetype_builds_chunked(archetype, config.tier, attack_types, chunk_size, config)
    builds_gen_count, builds_generator = tee(builds_gen_temp)

    # Count total builds for progress tracking
    print("Counting total builds for progress tracking...")
    total_builds = sum(1 for _ in builds_gen_count)
    max_points = config.max_points_per_attack(archetype)
    num_attacks = config.num_attacks(archetype)
    print(f"Testing {total_builds} {archetype} builds (Tier {config.tier}, {num_attacks} attack(s) × {max_points} points each)...")

    # Print simulation statistics receipt
    print_simulation_stats_receipt(config, total_builds, archetype)

    # Determine number of threads to use - use all available cores
    max_workers = multiprocessing.cpu_count()
    max_threads = multiprocessing.cpu_count()

    print(f"Using {max_workers} of {max_threads} threads for parallel processing")

    # Set up logging with new system
    with LoggingManager(config, reports_dir) as logger:
        # Build test cases from configuration
        test_cases = []
        for i, att_config in enumerate(config.attacker_configs):
            for j, def_config in enumerate(config.defender_configs):
                attacker = Character(*att_config)
                defender = Character(*def_config)
                test_cases.append((f"Att{i+1}_Def{j+1}", attacker, defender))

        # Test all builds and collect results using chunked processing
        build_results = []

        # Reset global progress counter
        global progress_counter
        progress_counter = 0

        # Add total_builds to config for progress tracking
        config.total_builds = total_builds

        # Time tracking
        start_time = time.time()

        # Use the already-generated builds_generator (no need to regenerate)

        # Execute builds using multiprocessing or sequential processing based on config
        completed_count = 0
        last_checkpoint_time = start_time

        # Helper function for time formatting
        def format_time(seconds):
            if seconds < 60:
                return f"{seconds:.1f}s"
            elif seconds < 3600:
                minutes = seconds / 60
                return f"{minutes:.1f}m"
            else:
                hours = seconds / 3600
                return f"{hours:.1f}h"

        if config.use_threading:
            print("Starting parallel build testing with multiprocessing...")

            # Process builds in chunks to reduce memory usage
            current_chunk = []
            chunk_count = 0

            for build_idx, build in enumerate(builds_generator):
                current_chunk.append((build_idx, build, test_cases, config, None, True))

                # When chunk is full or we've reached the end, process it
                if len(current_chunk) >= chunk_size:
                    chunk_count += 1
                    print(f"Processing chunk {chunk_count} ({len(current_chunk)} builds)...")

                    with ProcessPoolExecutor(max_workers=max_workers) as executor:
                        # Submit chunk tasks to executor
                        futures = [executor.submit(test_func, args) for args in current_chunk]

                        # Process completed futures with progress tracking
                        for future in futures:
                            build, avg_dpt, avg_turns = future.result()
                            completed_count += 1

                            # Store result
                            build_results.append((build, avg_dpt, avg_turns))

                            # Progress reporting every 100 builds
                            if completed_count % 100 == 0:
                                current_time = time.time()
                                elapsed = current_time - start_time
                                avg_time_per_build = elapsed / completed_count
                                remaining_builds = total_builds - completed_count
                                estimated_remaining = remaining_builds * avg_time_per_build
                                print(f"Progress: {completed_count}/{total_builds} builds tested - Est. remaining: {format_time(estimated_remaining)}")

                    # Clear chunk and force garbage collection
                    current_chunk.clear()
                    gc.collect()

            # Process any remaining builds in the final chunk
            if current_chunk:
                chunk_count += 1
                print(f"Processing final chunk {chunk_count} ({len(current_chunk)} builds) sequentially...")

                for args in current_chunk:
                    build, avg_dpt, avg_turns = test_func(args)
                    completed_count += 1

                    build_results.append((build, avg_dpt, avg_turns))

                    if completed_count % 100 == 0:
                        current_time = time.time()
                        elapsed = current_time - start_time
                        avg_time_per_build = elapsed / completed_count
                        remaining_builds = total_builds - completed_count
                        estimated_remaining = remaining_builds * avg_time_per_build
                        print(f"Progress: {completed_count}/{total_builds} builds tested - Est. remaining: {format_time(estimated_remaining)}")

                current_chunk.clear()
                gc.collect()

        else:
            print("Starting sequential build testing...")
            # Process builds sequentially
            for build_idx, build in enumerate(builds_generator):
                args = (build_idx, build, test_cases, config, None, False)
                build, avg_dpt, avg_turns = test_func(args)
                completed_count += 1

                build_results.append((build, avg_dpt, avg_turns))

                # Progress reporting
                if completed_count % 100 == 0:
                    current_time = time.time()
                    elapsed = current_time - start_time
                    avg_time_per_build = elapsed / completed_count
                    remaining_builds = total_builds - completed_count
                    estimated_remaining = remaining_builds * avg_time_per_build
                    print(f"Progress: {completed_count}/{total_builds} builds tested - Est. remaining: {format_time(estimated_remaining)}")

        # Final time summary
        total_simulation_time = time.time() - start_time

        execution_mode = "Multiprocessing" if config.use_threading else "Sequential"
        print(f"\n{execution_mode} Simulation Time Summary:")
        print(f"  Total builds tested: {completed_count}")
        print(f"  Total time: {format_time(total_simulation_time)}")
        if completed_count > 0:
            print(f"  Average time per build: {(total_simulation_time / completed_count):.3f}s")
        print(f"  Chunk size: {chunk_size} builds per chunk")
        if config.use_threading:
            print(f"  Processes used: {max_workers}")
        else:
            print(f"  Execution mode: Sequential (single-threaded)")

        # Sort by average turns (lower is better)
        build_results.sort(key=lambda x: x[2])

        # Process top builds for detailed logging
        logger.process_top_builds(build_results, config.__dict__)

        # Log final summary
        logger.log_final_summary(build_results, config.__dict__)

    print(f"Build testing completed! Tested {len(build_results)} builds.")
    return build_results


if __name__ == "__main__":
    # Required for multiprocessing on Windows
    multiprocessing.freeze_support()
    main()
