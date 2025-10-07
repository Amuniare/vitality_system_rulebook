"""Configuration loader for Simulation V2."""

import json
import os
from dataclasses import dataclass
from typing import List, Dict


@dataclass
class ProgressiveEliminationRound:
    """Configuration for a single progressive elimination round."""
    simulation_runs: int  # Number of simulation runs for this round (-1 = use config.simulation_runs)
    keep_percent: float   # Fraction of builds to keep (0.0-1.0)


@dataclass
class ProgressiveEliminationConfig:
    """Progressive elimination configuration for build testing optimization."""
    enabled: bool
    rounds: List[ProgressiveEliminationRound]


@dataclass
class PruningConfig:
    """Pruning configuration for build optimization (used for versatile_master pre-generation)."""
    enabled: bool
    top_percent: float
    simulation_runs: int
    scenario_index: int = 0  # Deprecated - now tests all scenarios


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
    pruning: PruningConfig
    progressive_elimination: ProgressiveEliminationConfig

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

        # Parse pruning config (with defaults if not specified)
        pruning_data = data.get('pruning', {})
        pruning = PruningConfig(
            enabled=pruning_data.get('enabled', False),
            top_percent=pruning_data.get('top_percent', 0.05),
            simulation_runs=pruning_data.get('simulation_runs', 5),
            scenario_index=pruning_data.get('scenario_index', 0)
        )

        # Parse progressive elimination config (with defaults if not specified)
        prog_elim_data = data.get('progressive_elimination', {})
        if prog_elim_data.get('enabled', False):
            rounds_data = prog_elim_data.get('rounds', [])
            rounds = [
                ProgressiveEliminationRound(
                    simulation_runs=round_data['simulation_runs'],
                    keep_percent=round_data['keep_percent']
                )
                for round_data in rounds_data
            ]
            progressive_elimination = ProgressiveEliminationConfig(enabled=True, rounds=rounds)
        else:
            # Default: disabled with empty rounds
            progressive_elimination = ProgressiveEliminationConfig(enabled=False, rounds=[])

        return cls(
            tier=data['tier'],
            archetypes=data['archetypes'],
            simulation_runs=data['simulation_runs'],
            use_threading=data['use_threading'],
            use_gpu=data.get('use_gpu', True),  # Default to True if not specified
            build_chunk_size=data['build_chunk_size'],
            attacker_stats=data['character_config']['attacker'],
            defender_stats=data['character_config']['defender'],
            scenarios=scenarios,
            pruning=pruning,
            progressive_elimination=progressive_elimination
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
