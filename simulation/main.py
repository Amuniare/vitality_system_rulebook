#!/usr/bin/env python3
"""
Main entry point for the Vitality System combat damage optimizer.

This is the refactored entry point that orchestrates the simulation with the new
organized folder structure.
"""

import sys
import os
from pathlib import Path

# Add the current directory to Python path to support imports
sys.path.insert(0, str(Path(__file__).parent))

from data.config import load_config, get_default_config
from reporting.base import create_timestamped_reports_directory
from analysis.optimizer import main as run_optimizer


def main():
    """Main entry point for the simulation"""
    print("=== Vitality System Combat Damage Optimizer ===")
    print("Refactored version with organized structure")
    print()

    # Load configuration
    try:
        config = load_config("config/simulation.json")
        print("[OK] Loaded configuration from config/simulation.json")
    except Exception as e:
        print(f"! Could not load config: {e}")
        print("! Using default configuration")
        config = get_default_config()

    # Create reports directory
    reports_dir = create_timestamped_reports_directory()
    print(f"[OK] Created reports directory: {reports_dir}")

    # Run the optimizer
    print("\n[START] Starting simulation...")
    try:
        run_optimizer()
        print("[OK] Simulation completed successfully!")
        print(f"[OK] Reports saved to: {reports_dir}")
    except Exception as e:
        print(f"[ERROR] Simulation failed: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())