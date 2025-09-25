#!/usr/bin/env python3
"""
Verbose damage optimization calculator with detailed combat logging
"""

from models import Character, AttackBuild, SimulationConfig
from build_generator import generate_valid_builds
from simulation import simulate_combat_verbose, run_simulation_batch
from reporting import (load_config, save_config, print_configuration_report,
                      generate_upgrade_performance_report, write_upgrade_performance_report,
                      write_build_summary, generate_upgrade_ranking_report, generate_upgrade_pairing_report,
                      generate_diagnostic_report)


def main():
    """Main execution function for the damage optimizer"""
    # Load configuration
    config = load_config()

    # Print configuration report
    print_configuration_report(config)

    # Generate builds to test
    attack_types = config.attack_types_filter or ['melee', 'ranged', 'area', 'direct_damage', 'direct_area_damage']
    builds = generate_valid_builds(config.max_points, attack_types)

    # Filter builds if needed
    if config.upgrades_filter:
        builds = [b for b in builds if all(u in config.upgrades_filter for u in b.upgrades)]
    if config.limits_filter:
        builds = [b for b in builds if all(l in config.limits_filter for l in b.limits)]

    print(f"Testing {len(builds)} builds...")

    # Set up logging
    with open('reports/combat_log.txt', 'w', encoding='utf-8') as log_file:
        log_file.write("VITALITY SYSTEM - COMBAT SIMULATION LOG\n")
        log_file.write("="*80 + "\n\n")

        # Build test cases from configuration
        test_cases = []
        for i, att_config in enumerate(config.attacker_configs):
            for j, def_config in enumerate(config.defender_configs):
                attacker = Character(*att_config)
                defender = Character(*def_config)
                test_cases.append((f"Att{i+1}_Def{j+1}", attacker, defender))

        # Test all builds and collect results
        build_results = []

        for build_idx, build in enumerate(builds):
            if build_idx % 100 == 0:
                print(f"Progress: {build_idx}/{len(builds)} builds tested")

            total_dpt = 0
            total_configs = 0

            log_file.write(f"\n{'='*60}\n")
            log_file.write(f"Testing Build {build_idx + 1}: {build}\n")
            log_file.write(f"{'='*60}\n")

            for case_name, attacker, defender in test_cases:
                log_file.write(f"\n--- Test Case: {case_name} ---\n")

                # Run 3 different fight scenarios per case
                fight_scenarios = [
                    ("Fight 1: 1x100 HP Boss", 1, 100),
                    ("Fight 2: 2x50 HP Enemies", 2, 50),
                    ("Fight 3: 4x25 HP Enemies", 4, 25)
                ]

                case_total_dpt = 0
                scenario_count = 0

                for scenario_name, num_enemies, enemy_hp in fight_scenarios:
                    log_file.write(f"\n  {scenario_name}:\n")

                    # Run detailed simulation for first run only
                    if config.verbose_logging:
                        turns = simulate_combat_verbose(attacker, build, config.target_hp, log_file, defender,
                                                       num_enemies=num_enemies, enemy_hp=enemy_hp)
                        log_file.write(f"    First simulation result: {turns} turns\n")

                    # Run batch simulation
                    results, avg_turns, dpt = run_simulation_batch(
                        attacker, build, config.num_runs, config.target_hp, defender,
                        num_enemies=num_enemies, enemy_hp=enemy_hp)

                    log_file.write(f"    Batch results ({config.num_runs} runs): {results}\n")
                    log_file.write(f"    Average turns: {avg_turns:.1f}, DPT: {dpt:.1f}\n")

                    case_total_dpt += dpt
                    scenario_count += 1

                # Average DPT across the 3 scenarios for this case
                case_avg_dpt = case_total_dpt / scenario_count if scenario_count > 0 else 0
                log_file.write(f"\n  Case Average DPT: {case_avg_dpt:.1f}\n")

                total_dpt += case_avg_dpt
                total_configs += 1

            avg_dpt = total_dpt / total_configs if total_configs > 0 else 0

            # Filter by minimum DPT threshold if set
            if avg_dpt >= config.min_dpt_threshold:
                build_results.append((build, avg_dpt))

        # Sort by DPT
        build_results.sort(key=lambda x: x[1], reverse=True)

        # Write top builds to log
        log_file.write(f"\n\n{'='*80}\n")
        log_file.write("TOP PERFORMING BUILDS\n")
        log_file.write(f"{'='*80}\n")

        for i, (build, avg_dpt) in enumerate(build_results[:config.show_top_builds], 1):
            log_file.write(f"{i:2d}. {build} | DPT: {avg_dpt:.1f}\n")

    # Generate reports
    print("\nGenerating reports...")

    # Generate diagnostic mechanics report first
    generate_diagnostic_report(config)

    # Write build summary
    top_builds = [build for build, _ in build_results[:config.show_top_builds]]
    write_build_summary(top_builds, config)

    # Generate upgrade ranking report
    generate_upgrade_ranking_report(build_results, config)

    # Generate upgrade pairing analysis report
    generate_upgrade_pairing_report(build_results, config)

    # Generate upgrade performance report if requested
    if config.test_single_upgrades:
        upgrade_results = generate_upgrade_performance_report(config)
        write_upgrade_performance_report(upgrade_results, config)

    print(f"\nSimulation complete!")
    print(f"- Tested {len(builds)} builds")
    print(f"- Diagnostic mechanics report saved to reports/diagnostic_mechanics_report.txt")
    print(f"- Results saved to reports/combat_log.txt")
    print(f"- Summary saved to reports/build_summary.txt")
    print(f"- Upgrade ranking analysis saved to reports/upgrade_ranking_report.txt")
    print(f"- Upgrade pairing analysis saved to reports/upgrade_pairing_analysis.txt")
    if config.test_single_upgrades:
        print(f"- Upgrade analysis saved to reports/upgrade_performance_summary.txt")

    # Show top results
    print(f"\nTop {min(20, len(build_results))} builds by average DPT:")
    for i, (build, avg_dpt) in enumerate(build_results[:20], 1):
        print(f"{i:2d}. {build} | DPT: {avg_dpt:.1f}")


if __name__ == "__main__":
    main()