"""Configuration loader for Simulation V2."""

import json
import os
from dataclasses import dataclass
from typing import List, Dict


@dataclass
class ScenarioConfig:
    """Combat scenario configuration."""
    name: str
    num_enemies: int = None
    enemy_hp: int = None
    enemy_hp_list: List[int] = None

    def get_enemy_count(self) -> int:
        """Get total number of enemies."""
        if self.enemy_hp_list:
            return len(self.enemy_hp_list)
        return self.num_enemies

    def get_hp_list(self) -> List[int]:
        """Get list of enemy HP values."""
        if self.enemy_hp_list:
            return self.enemy_hp_list
        return [self.enemy_hp] * self.num_enemies


@dataclass
class SimConfigV2:
    """Simplified simulation configuration."""
    tier: int
    archetypes: List[str]
    simulation_runs: int
    use_threading: bool
    use_gpu: bool  # Enable GPU acceleration for dice rolling and batch operations
    build_chunk_size: int
    attacker_stats: List[int]
    defender_stats: List[int]
    scenarios: List[ScenarioConfig]

    @classmethod
    def load(cls, config_path: str = None):
        """Load configuration from JSON file."""
        if config_path is None:
            # Default to config.json in configs directory
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            config_path = os.path.join(base_dir, 'configs', 'config.json')

        with open(config_path, 'r') as f:
            data = json.load(f)

        # Parse scenarios
        scenarios = []
        for scenario_data in data['scenarios']:
            scenarios.append(ScenarioConfig(
                name=scenario_data['name'],
                num_enemies=scenario_data.get('num_enemies'),
                enemy_hp=scenario_data.get('enemy_hp'),
                enemy_hp_list=scenario_data.get('enemy_hp_list')
            ))

        return cls(
            tier=data['tier'],
            archetypes=data['archetypes'],
            simulation_runs=data['simulation_runs'],
            use_threading=data['use_threading'],
            use_gpu=data.get('use_gpu', True),  # Default to True if not specified
            build_chunk_size=data['build_chunk_size'],
            attacker_stats=data['character_config']['attacker'],
            defender_stats=data['character_config']['defender'],
            scenarios=scenarios
        )

    def max_points_per_attack(self, archetype: str) -> int:
        """
        Calculate max points per attack based on archetype and tier.

        Points available per attack for each archetype tier:
        Tier 3: focused=6, dual=4, versatile=2
        Tier 4: focused=8, dual=6, versatile=4
        Tier 5: focused=10, dual=8, versatile=6
        """
        tier_archetype_levels = {
            3: {"focused": 6, "dual_natured": 4, "versatile_master": 2},
            4: {"focused": 8, "dual_natured": 6, "versatile_master": 4},
            5: {"focused": 10, "dual_natured": 8, "versatile_master": 6},
        }

        if self.tier in tier_archetype_levels and archetype in tier_archetype_levels[self.tier]:
            return tier_archetype_levels[self.tier][archetype]

        # Fallback for other tiers
        return 6 if archetype == "focused" else (4 if archetype == "dual_natured" else 2)
