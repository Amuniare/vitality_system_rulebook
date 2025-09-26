#!/usr/bin/env python3
"""
Verbose damage optimization calculator with detailed combat logging
"""

import time
import multiprocessing
import gc
from concurrent.futures import ProcessPoolExecutor
from models import Character, AttackBuild, SimulationConfig
from build_generator import generate_valid_builds, generate_valid_builds_chunked
from simulation import simulate_combat_verbose, run_simulation_batch
from reporting import (load_config, save_config, print_configuration_report,
                      generate_upgrade_performance_report, write_upgrade_performance_report,
                      generate_combo_performance_report, write_combo_performance_report,
                      write_build_summary, generate_upgrade_ranking_report, generate_upgrade_pairing_report,
                      generate_diagnostic_report, write_attack_type_enhancement_ranking_report,
                      create_timestamped_reports_directory)
from balance_analysis import BalanceAnalyzer, ScenarioWeights
from logging_manager import LoggingManager

def test_single_build(args):
    """Test a single build across all test cases and scenarios"""
    build_idx, build, test_cases, config, logger, print_progress = args

    # For multiprocessing, logger object can't be passed directly
    # Instead, we'll disable detailed logging in worker processes
    should_log = False

    total_dpt = 0
    total_configs = 0

    # Skip logging in worker processes for multiprocessing compatibility

    for case_name, attacker, defender in test_cases:

        # Run 4 different fight scenarios per case
        fight_scenarios = [
            ("Fight 1: 1x100 HP Boss", 1, 100),
            ("Fight 2: 2x50 HP Enemies", 2, 50),
            ("Fight 3: 4x25 HP Enemies", 4, 25),
            ("Fight 4: 10x10 HP Enemies", 10, 10)
        ]

        case_total_dpt = 0
        scenario_count = 0

        for scenario_name, num_enemies, enemy_hp in fight_scenarios:
            # Run batch simulation
            results, avg_turns, dpt = run_simulation_batch(
                attacker, build, config.num_runs, config.target_hp, defender,
                num_enemies=num_enemies, enemy_hp=enemy_hp)

            # Skip scenario logging in worker processes

            case_total_dpt += dpt
            scenario_count += 1

        # Average DPT across the 4 scenarios for this case
        case_avg_dpt = case_total_dpt / scenario_count if scenario_count > 0 else 0

        # Skip case logging in worker processes

        total_dpt += case_avg_dpt
        total_configs += 1

    avg_dpt = total_dpt / total_configs if total_configs > 0 else 0

    # Return build and average DPT
    return (build, avg_dpt)


def main():
    """Main execution function for the damage optimizer"""
    # Load configuration
    config = load_config()

    # Create timestamped reports directory
    reports_dir = create_timestamped_reports_directory()
    print(f"Reports will be saved to: {reports_dir}")

    # Print configuration report
    print_configuration_report(config)

    # Generate builds to test using chunked approach
    attack_types = config.attack_types_filter or ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    # Get chunk size from config, default to 1000
    chunk_size = getattr(config, 'build_chunk_size', 1000)

    # Use chunked generator for memory efficiency
    builds_generator = generate_valid_builds_chunked(config.max_points, attack_types, chunk_size)

    # Count total builds for progress tracking without loading all into memory
    print("Counting total builds for progress tracking...")
    total_builds = sum(1 for _ in generate_valid_builds_chunked(config.max_points, attack_types, chunk_size))
    print(f"Testing {total_builds} builds in chunks of {chunk_size}...")

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

        # Process builds in chunks for memory efficiency
        builds_generator = generate_valid_builds_chunked(config.max_points, attack_types, chunk_size)

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
                        futures = [executor.submit(test_single_build, args) for args in current_chunk]

                        # Process completed futures with progress tracking
                        for future in futures:
                            build, avg_dpt = future.result()
                            completed_count += 1

                            # Filter by minimum DPT threshold
                            if avg_dpt >= config.min_dpt_threshold:
                                build_results.append((build, avg_dpt))

                            # Progress update every 100 builds
                            if completed_count % 100 == 0:
                                print(f"Progress: {completed_count}/{total_builds} builds tested")

                            # Time estimation every 1000 builds
                            if completed_count > 0 and completed_count % 1000 == 0:
                                current_time = time.time()
                                time_for_last_1000 = current_time - last_checkpoint_time
                                total_elapsed = current_time - start_time
                                avg_time_per_build = total_elapsed / completed_count
                                remaining_builds = total_builds - completed_count
                                estimated_remaining_seconds = remaining_builds * avg_time_per_build

                                print(f"Time Analysis - Build {completed_count}/{total_builds}:")
                                print(f"  Last 1000 builds: {format_time(time_for_last_1000)}")
                                print(f"  Average per build: {avg_time_per_build:.3f}s")
                                print(f"  Estimated time remaining: {format_time(estimated_remaining_seconds)}")
                                print(f"  Total elapsed: {format_time(total_elapsed)}")
                                last_checkpoint_time = current_time

                    # Clear chunk and force garbage collection
                    current_chunk.clear()
                    gc.collect()

            # Process any remaining builds in the final chunk
            if current_chunk:
                chunk_count += 1
                print(f"Processing final chunk {chunk_count} ({len(current_chunk)} builds)...")

                with ProcessPoolExecutor(max_workers=max_workers) as executor:
                    futures = [executor.submit(test_single_build, args) for args in current_chunk]

                    for future in futures:
                        build, avg_dpt = future.result()
                        completed_count += 1

                        if avg_dpt >= config.min_dpt_threshold:
                            build_results.append((build, avg_dpt))

                        if completed_count % 100 == 0:
                            print(f"Progress: {completed_count}/{total_builds} builds tested")

                current_chunk.clear()
                gc.collect()
        else:
            print("Starting sequential build testing...")

            # Process builds sequentially in chunks for memory efficiency
            current_chunk = []
            chunk_count = 0

            for build_idx, build in enumerate(builds_generator):
                current_chunk.append((build_idx, build, test_cases, config, None, True))

                # When chunk is full, process it
                if len(current_chunk) >= chunk_size:
                    chunk_count += 1
                    print(f"Processing chunk {chunk_count} ({len(current_chunk)} builds) sequentially...")

                    for args in current_chunk:
                        build, avg_dpt = test_single_build(args)
                        completed_count += 1

                        # Filter by minimum DPT threshold
                        if avg_dpt >= config.min_dpt_threshold:
                            build_results.append((build, avg_dpt))

                        # Progress update every 100 builds
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
                    build, avg_dpt = test_single_build(args)
                    completed_count += 1

                    if avg_dpt >= config.min_dpt_threshold:
                        build_results.append((build, avg_dpt))

                    if completed_count % 100 == 0:
                        current_time = time.time()
                        elapsed = current_time - start_time
                        avg_time_per_build = elapsed / completed_count
                        remaining_builds = total_builds - completed_count
                        estimated_remaining = remaining_builds * avg_time_per_build
                        print(f"Progress: {completed_count}/{total_builds} builds tested - Est. remaining: {format_time(estimated_remaining)}")

                current_chunk.clear()
                gc.collect()

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

        # Sort by DPT
        build_results.sort(key=lambda x: x[1], reverse=True)

        # Process top builds for detailed logging
        logger.process_top_builds(build_results, config.__dict__)

        # Log final summary
        logger.log_final_summary(build_results, config.__dict__)

    # Generate reports
    print("\nGenerating reports...")

    # Generate diagnostic mechanics report first
    generate_diagnostic_report(config, reports_dir)

    # Write build summary
    top_builds = [build for build, _ in build_results[:config.show_top_builds]]
    write_build_summary(top_builds, config, reports_dir)

    # Generate upgrade ranking report
    generate_upgrade_ranking_report(build_results, config, reports_dir)

    # Generate upgrade pairing analysis report
    generate_upgrade_pairing_report(build_results, config, reports_dir)

    # Generate enhancement performance report if requested
    if config.test_single_upgrades:
        enhancement_results = generate_upgrade_performance_report(config)
        write_upgrade_performance_report(enhancement_results, config, reports_dir)

        # Generate attack-type-specific ranking reports
        write_attack_type_enhancement_ranking_report(build_results, enhancement_results, config, reports_dir)

    # Generate combo performance report
    combo_results = generate_combo_performance_report(config)
    write_combo_performance_report(combo_results, config, reports_dir)

    # Generate comprehensive balance analysis report
    print("Generating comprehensive balance analysis...")
    balance_analyzer = BalanceAnalyzer(config, None, reports_dir)
    balance_analyses = balance_analyzer.analyze_all_components(build_results)
    balance_analyzer.generate_balance_health_report(balance_analyses)

    print(f"\nSimulation complete!")
    print(f"- Tested {len(build_results)} builds")
    print(f"- Diagnostic reports saved to {reports_dir}/diagnostic_*_report.txt")
    print(f"- Balance Health Report saved to {reports_dir}/balance_health_report.txt")

    # Report on generated log files based on configuration
    if config.logging.get('separate_files', True):
        print(f"- Summary results saved to {reports_dir}/summary_combat_log.txt")
        if config.logging.get('log_top_builds_only', True):
            print(f"- Top {config.logging.get('top_builds_for_detailed_log', 50)} builds detailed log saved to {reports_dir}/top_builds_combat_log.txt")
        print(f"- Diagnostic mechanics log saved to {reports_dir}/diagnostic_combat_log.txt")
        if config.logging.get('generate_individual_build_logs', False):
            print(f"- Individual build logs saved to {reports_dir}/individual_builds/")
    else:
        print(f"- Results saved to {reports_dir}/combat_log.txt")

    print(f"- Summary saved to {reports_dir}/build_summary.txt")
    print(f"- Upgrade ranking analysis saved to {reports_dir}/upgrade_ranking_report.txt")
    print(f"- Upgrade pairing analysis saved to {reports_dir}/upgrade_pairing_analysis.txt")
    print(f"- Combo performance analysis saved to {reports_dir}/combo_performance_summary.txt")
    if config.test_single_upgrades:
        print(f"- Upgrade & Limit analysis saved to {reports_dir}/upgrade_performance_summary.txt")
        print(f"- Attack-type-specific upgrade rankings saved to {reports_dir}/upgrade_ranking_by_attack_type.txt")
        print(f"- Attack-type-specific limit rankings saved to {reports_dir}/limit_ranking_by_attack_type.txt")

    # Show top results
    print(f"\nTop {min(20, len(build_results))} builds by average DPT:")
    for i, (build, avg_dpt) in enumerate(build_results[:20], 1):
        print(f"{i:2d}. {build} | DPT: {avg_dpt:.1f}")


if __name__ == "__main__":
    # Required for multiprocessing on Windows
    multiprocessing.freeze_support()
    main()