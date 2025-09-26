"""
Configuration management for the Vitality System simulation.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from core.models import SimulationConfig


def load_config(config_path: str = "config/simulation.json") -> SimulationConfig:
    """Load simulation configuration from JSON file"""
    try:
        with open(config_path, 'r') as f:
            config_data = json.load(f)
        return SimulationConfig(**config_data)
    except FileNotFoundError:
        print(f"Config file {config_path} not found, using defaults")
        return SimulationConfig()
    except Exception as e:
        print(f"Error loading config: {e}, using defaults")
        return SimulationConfig()


def save_config(config: SimulationConfig, config_path: str = "config/simulation.json") -> bool:
    """Save simulation configuration to JSON file"""
    try:
        Path(config_path).parent.mkdir(parents=True, exist_ok=True)

        # Convert config to dict for JSON serialization
        config_dict = {
            "num_runs": config.num_runs,
            "max_points": config.max_points,
            "test_single_upgrades": config.test_single_upgrades,
            "test_two_upgrade_combinations": config.test_two_upgrade_combinations,
            "test_three_upgrade_combinations": config.test_three_upgrade_combinations,
            "test_slayers": config.test_slayers,
            "test_limits": config.test_limits,
            "use_threading": config.use_threading,
            "verbose_logging": config.verbose_logging,
            "top_builds_count": config.show_top_builds,
            "min_dpt_threshold": config.min_dpt_threshold,
            "attacker_configs": config.attacker_configs,
            "defender_configs": config.defender_configs,
            "logging": config.logging
        }

        with open(config_path, 'w') as f:
            json.dump(config_dict, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving config: {e}")
        return False


def get_default_config() -> SimulationConfig:
    """Get default simulation configuration"""
    return SimulationConfig(
        num_runs=25,
        max_points=80,
        test_single_upgrades=True,
        test_two_upgrade_combinations=True,
        test_three_upgrade_combinations=True,
        test_slayers=True,
        test_limits=True,
        use_threading=True,
        verbose_logging=False,
        show_top_builds=20,
        min_dpt_threshold=0.0,
        attacker_configs=[
            [4, 0, 0, 0, 4],
            [0, 4, 0, 0, 4]
        ],
        defender_configs=[
            [0, 0, 4, 0, 4],
            [0, 0, 0, 4, 4]
        ]
    )