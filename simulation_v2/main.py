#!/usr/bin/env python3
"""
Main entry point for Simulation V2.

Simplified, focused simulation with only the most valuable reports:
- Enhancement ranking report
- Cost analysis report
"""

import sys
import os
import multiprocessing
from datetime import datetime

from core.config import SimConfigV2
from core.individual_tester import IndividualTester
from core.build_tester import BuildTester
from core.reporter import ReporterV2
from src.models import Character, AttackBuild, MultiAttackBuild
from src.simulation import simulate_combat_verbose
import shutil


def cleanup_old_reports(reports_base_dir: str, max_folders: int = 5):
    """Delete oldest report folders if there are more than max_folders.

    Args:
        reports_base_dir: Path to the reports directory
        max_folders: Maximum number of report folders to keep (default: 5)
    """
    if not os.path.exists(reports_base_dir):
        return

    # Get all subdirectories in reports folder
    folders = []
    for item in os.listdir(reports_base_dir):
        item_path = os.path.join(reports_base_dir, item)
        if os.path.isdir(item_path):
            folders.append((item_path, os.path.getctime(item_path)))

    # If we have more than max_folders, delete the oldest ones
    if len(folders) > max_folders:
        # Sort by creation time (oldest first)
        folders.sort(key=lambda x: x[1])

        # Delete oldest folders
        num_to_delete = len(folders) - max_folders
        for folder_path, _ in folders[:num_to_delete]:
            folder_name = os.path.basename(folder_path)
            print(f"  Deleting old report folder: {folder_name}")
            try:
                shutil.rmtree(folder_path, ignore_errors=True)
            except (PermissionError, OSError) as e:
                print(f"    WARNING: Could not delete {folder_name}: {e}")
                print(f"    (OneDrive or file locks may prevent deletion - skipping)")


def format_build_name(build: AttackBuild | MultiAttackBuild, rank: int) -> str:
    """Generate a descriptive name for a build."""
    if hasattr(build, 'attack_type'):
        # Single attack build
        parts = [f"rank{rank:02d}"]
        parts.append(build.attack_type)
        if build.upgrades:
            parts.extend(build.upgrades)
        if build.limits:
            parts.extend(build.limits)
        return "_".join(parts)
    else:
        # Multi-attack build
        parts = [f"rank{rank:02d}", build.archetype]
        return "_".join(parts)


def format_build_description(build: AttackBuild | MultiAttackBuild) -> str:
    """Generate a human-readable description of a build."""
    if hasattr(build, 'attack_type'):
        desc = f"{build.attack_type}"
        if build.upgrades:
            desc += f" + Upgrades: {', '.join(build.upgrades)}"
        if build.limits:
            desc += f" + Limits: {', '.join(build.limits)}"
        desc += f" (Cost: {build.total_cost}p)"
        return desc
    else:
        desc = f"Multi-Attack ({build.archetype}) - {len(build.builds)} attacks"
        desc += f" (Total Cost: {build.get_total_cost()}p)"
        return desc


def generate_combat_log_for_build(
    build: AttackBuild | MultiAttackBuild,
    rank: int,
    avg_turns: float,
    config: SimConfigV2,
    output_dir: str
):
    """Generate a detailed combat log for a specific build."""
    from io import StringIO

    attacker = Character(*config.attacker_stats)
    defender = Character(*config.defender_stats)

    # Create output file
    build_name = format_build_name(build, rank)
    output_file = os.path.join(output_dir, f"{build_name}.txt")

    build_desc = format_build_description(build)

    # Use StringIO buffer for better performance
    buffer = StringIO()

    # Write to buffer instead of direct file writes (don't use 'with' - it closes the buffer)
    buffer.write(f"{'='*80}\n")
    buffer.write(f"TOP 50 BUILD COMBAT LOG - DETAILED MECHANICS ANALYSIS\n")
    buffer.write(f"{'='*80}\n")
    buffer.write(f"Rank: #{rank}\n")
    buffer.write(f"Build: {build_desc}\n")
    buffer.write(f"Average Turns: {avg_turns:.2f}\n")
    buffer.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    buffer.write(f"{'='*80}\n\n")

    # Run simulation for each scenario
    for scenario_idx, scenario in enumerate(config.scenarios, 1):
        buffer.write(f"\n{'='*80}\n")
        buffer.write(f"SCENARIO {scenario_idx}: ")

        if scenario.enemy_hp_list:
            buffer.write(f"Mixed Enemy Group - HP: {scenario.enemy_hp_list}\n")
            buffer.write(f"{'='*80}\n")

            turns, outcome = simulate_combat_verbose(
                attacker=attacker,
                build=build,
                target_hp=100,
                log_file=buffer,
                defender=defender,
                enemy_hp_list=scenario.enemy_hp_list,
                max_turns=100
            )
        else:
            buffer.write(f"{scenario.num_enemies} Enemies x {scenario.enemy_hp} HP\n")
            buffer.write(f"{'='*80}\n")

            turns, outcome = simulate_combat_verbose(
                attacker=attacker,
                build=build,
                target_hp=100,
                log_file=buffer,
                defender=defender,
                num_enemies=scenario.num_enemies,
                enemy_hp=scenario.enemy_hp,
                max_turns=100
            )

        buffer.write(f"\n{'='*60}\n")
        buffer.write(f"SCENARIO {scenario_idx} RESULT: {outcome.upper()} in {turns} turns\n")
        buffer.write(f"{'='*60}\n\n")

    # Write buffer to file in one operation
    with open(output_file, 'w', encoding='utf-8', buffering=8192) as f:
        f.write(buffer.getvalue())

    # Close buffer after use
    buffer.close()


def run_simulation_v2(config_path: str = None):
    """Run the complete simulation pipeline.

    Args:
        config_path: Optional path to config file. If None, uses default (configs/config.json)
    """
    print("="*80)
    print("VITALITY SYSTEM - SIMULATION V2")
    print("="*80)

    # Load configuration
    print("\nLoading configuration...")
    if config_path:
        print(f"  Using config: {config_path}")
    config = SimConfigV2.load(config_path)
    print(f"  Tier: {config.tier}")
    print(f"  Archetypes: {', '.join(config.archetypes)}")
    print(f"  Simulation runs: {config.simulation_runs}")
    print(f"  Scenarios: {len(config.scenarios)}")
    print(f"  Threading: {'enabled' if config.use_threading else 'disabled'}")

    # Initialize GPU if enabled
    if config.use_gpu:
        try:
            from src.combat_gpu import initialize_gpu, is_gpu_available
            initialize_gpu()
            if is_gpu_available():
                print(f"  GPU: enabled (DirectML detected)")
            else:
                print(f"  GPU: requested but unavailable (falling back to CPU)")
        except ImportError:
            print(f"  GPU: requested but torch-directml not installed (run: pip install torch-directml)")
    else:
        print(f"  GPU: disabled in config")

    # Cleanup old reports if needed
    reports_parent_dir = os.path.join(os.path.dirname(__file__), 'reports')
    print("\nCleaning up old reports...")
    cleanup_old_reports(reports_parent_dir, max_folders=5)

    # Create timestamped reports directory
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    base_reports_dir = os.path.join(reports_parent_dir, timestamp)
    os.makedirs(base_reports_dir, exist_ok=True)
    print(f"\nReports will be saved to: {base_reports_dir}")

    # Process each archetype
    for archetype in config.archetypes:
        print("\n" + "="*80)
        print(f"PROCESSING ARCHETYPE: {archetype.upper()}")
        print("="*80)

        archetype_reports_dir = os.path.join(base_reports_dir, archetype)
        os.makedirs(archetype_reports_dir, exist_ok=True)

        # Create combat logs directory
        combat_logs_dir = os.path.join(archetype_reports_dir, 'combat_logs')
        os.makedirs(combat_logs_dir, exist_ok=True)

        # Step 1: Individual testing (generates combat logs)
        print("\n--- Individual Enhancement Testing ---")
        individual_tester = IndividualTester(config, archetype, combat_logs_dir)
        individual_results = individual_tester.test_all_enhancements()
        print(f"  Generated {len(individual_results)} combat logs")

        # Step 2: Build testing
        build_tester = BuildTester(config, archetype)
        build_results = build_tester.test_all_builds()

        # Sort results by avg_turns (ascending = better)
        build_results.sort(key=lambda x: x[2])  # x[2] is avg_turns

        # Step 3: Generate top 50 combat logs
        print("\n--- Generating Top 50 Combat Logs ---")
        top50_logs_dir = os.path.join(archetype_reports_dir, 'top50_logs')
        os.makedirs(top50_logs_dir, exist_ok=True)

        top_50_results = build_results[:50]
        for rank, (build, _avg_dpt, avg_turns) in enumerate(top_50_results, 1):
            print(f"  [{rank}/50] {format_build_description(build)} - Avg Turns: {avg_turns:.2f}")
            try:
                generate_combat_log_for_build(
                    build=build,
                    rank=rank,
                    avg_turns=avg_turns,
                    config=config,
                    output_dir=top50_logs_dir
                )
            except Exception as e:
                print(f"    ERROR: {e}")
                import traceback
                traceback.print_exc()

        print(f"  Generated {len(top_50_results)} top 50 combat logs")

        # Step 4: Generate reports
        reporter = ReporterV2(archetype_reports_dir, archetype)
        reporter.generate_all_reports(build_results, individual_results)

    print("\n" + "="*80)
    print("SIMULATION V2 COMPLETE")
    print("="*80)
    print(f"\nReports saved to: {base_reports_dir}")


def main():
    """Entry point with multiprocessing support."""
    # Required for multiprocessing on Windows
    multiprocessing.freeze_support()

    # Parse command line arguments
    config_path = sys.argv[1] if len(sys.argv) > 1 else None

    try:
        run_simulation_v2(config_path)
    except KeyboardInterrupt:
        print("\n\nSimulation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
