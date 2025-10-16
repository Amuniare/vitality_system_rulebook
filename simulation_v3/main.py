#!/usr/bin/env python3
"""
Main entry point for Simulation V3: Dual-Natured Attack Pairing with Intelligent Selection

Runs both Stage 1 (attack pruning) and Stage 2 (pairing with intelligent selection).
"""

import sys
import os
import argparse
import shutil
from datetime import datetime


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


def run_simulation_v3(config_path: str = None, stage: str = "both"):
    """
    Run Simulation V3 pipeline.

    Args:
        config_path: Path to configuration file (optional)
        stage: Which stage to run ("1", "2", or "both")
    """
    print("=" * 80)
    print("VITALITY SYSTEM - SIMULATION V3")
    print("Dual-Natured Attack Pairing with Intelligent Selection")
    print("=" * 80)
    print(f"\nStarted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    start_time = datetime.now()

    # Setup timestamped reports directory
    reports_base_dir = os.path.join(os.path.dirname(__file__), 'reports')

    print("Cleaning up old reports...")
    cleanup_old_reports(reports_base_dir, max_folders=5)

    # Create timestamped directory for this run
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    reports_dir = os.path.join(reports_base_dir, timestamp)
    os.makedirs(reports_dir, exist_ok=True)

    print(f"Reports will be saved to: {reports_dir}\n")

    if stage in ["1", "both"]:
        print("\n" + "=" * 80)
        print("STAGE 1: ATTACK PRUNING")
        print("=" * 80)

        from stage1_pruning import run_stage1

        try:
            pruned_results, pruning_stats = run_stage1(config_path, reports_dir)
            print(f"\n✓ Stage 1 complete")
            print(f"  Kept {pruning_stats['total_kept']} of {pruning_stats['total_tested']} attacks")
        except Exception as e:
            print(f"\n✗ Stage 1 failed: {e}")
            import traceback
            traceback.print_exc()
            if stage == "both":
                print("\nAborting Stage 2 due to Stage 1 failure")
                return
            sys.exit(1)

    if stage in ["2", "both"]:
        print("\n" + "=" * 80)
        print("STAGE 2: ATTACK PAIRING")
        print("=" * 80)

        from stage2_pairing import run_stage2

        try:
            results = run_stage2(config_path, reports_dir)
            print(f"\n✓ Stage 2 complete")
            print(f"  Tested {len(results):,} attack pairs")
            print(f"  Best pair: {results[0]['overall_avg']:.2f} avg turns")
        except Exception as e:
            print(f"\n✗ Stage 2 failed: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

    end_time = datetime.now()
    elapsed = end_time - start_time
    elapsed_mins = int(elapsed.total_seconds() / 60)
    elapsed_secs = int(elapsed.total_seconds() % 60)

    print("\n" + "=" * 80)
    print("SIMULATION V3 COMPLETE")
    print("=" * 80)
    print(f"Finished: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Elapsed time: {elapsed_mins}m {elapsed_secs}s")
    print(f"\nReports saved to: {reports_dir}")


def main():
    """Entry point with argument parsing."""
    # Required for multiprocessing on Windows
    import multiprocessing
    multiprocessing.freeze_support()

    parser = argparse.ArgumentParser(
        description="Simulation V3: Dual-Natured Attack Pairing with Intelligent Selection",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                  # Run both stages with default config
  python main.py --stage 1        # Run only Stage 1 (attack pruning)
  python main.py --stage 2        # Run only Stage 2 (pairing)
  python main.py --config custom.json  # Use custom configuration
        """
    )

    parser.add_argument(
        '--config',
        '-c',
        type=str,
        default=None,
        help='Path to configuration file (default: config.json)'
    )

    parser.add_argument(
        '--stage',
        '-s',
        type=str,
        choices=['1', '2', 'both'],
        default='both',
        help='Which stage to run: 1 (pruning), 2 (pairing), or both (default: both)'
    )

    args = parser.parse_args()

    try:
        run_simulation_v3(config_path=args.config, stage=args.stage)
    except KeyboardInterrupt:
        print("\n\nSimulation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nFATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
