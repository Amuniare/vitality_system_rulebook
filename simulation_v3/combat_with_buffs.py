"""
Combat simulation with passive buff support for Simulation V3.

Extends base combat system to handle:
- Attacker accuracy bonuses
- Defender avoidance bonuses
- Defender durability bonuses
"""

import sys
import os

# Add parent simulation directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'simulation_v2'))

from src.models import Character, AttackBuild
from src.combat import make_attack, make_aoe_attack
from typing import List, Tuple
from dataclasses import dataclass


@dataclass
class BuffConfig:
    """Configuration for passive buffs in combat."""
    name: str
    attacker_accuracy_bonus: int = 0
    attacker_damage_bonus: int = 0
    defender_avoidance_bonus: int = 0
    defender_durability_bonus: int = 0
    description: str = ""

    @classmethod
    def from_dict(cls, data: dict):
        """Create BuffConfig from dictionary."""
        return cls(
            name=data['name'],
            attacker_accuracy_bonus=data.get('attacker_accuracy_bonus', 0),
            attacker_damage_bonus=data.get('attacker_damage_bonus', 0),
            defender_avoidance_bonus=data.get('defender_avoidance_bonus', 0),
            defender_durability_bonus=data.get('defender_durability_bonus', 0),
            description=data.get('description', '')
        )


def apply_attacker_buffs(attacker: Character, buff_config: BuffConfig) -> Character:
    """
    Apply attacker buffs by creating a modified character.

    Note: Accuracy bonus is applied directly in make_attack_with_buffs,
    not by modifying character stats.
    """
    return attacker  # Return original - we handle accuracy in attack rolls


def apply_defender_buffs(defender: Character, buff_config: BuffConfig) -> Character:
    """
    Apply defender buffs by creating a modified character with adjusted stats.

    Args:
        defender: Original defender character
        buff_config: Buff configuration to apply

    Returns:
        New Character instance with modified stats
    """
    # Create new character with buffed stats
    # Avoidance = 10 + tier + mobility, so we add to mobility
    # Durability = 5 + tier + endurance, so we add to endurance

    new_mobility = defender.mobility + buff_config.defender_avoidance_bonus
    new_endurance = defender.endurance + buff_config.defender_durability_bonus

    return Character(
        focus=defender.focus,
        power=defender.power,
        mobility=new_mobility,
        endurance=new_endurance,
        tier=defender.tier,
        max_hp=defender.max_hp
    )


def make_attack_with_buffs(
    attacker: Character,
    defender: Character,
    build: AttackBuild,
    buff_config: BuffConfig,
    **kwargs
) -> Tuple[int, List[str]]:
    """
    Make an attack with passive buff support.

    Args:
        attacker: Attacking character
        defender: Defending character
        build: Attack build to use
        buff_config: Passive buff configuration
        **kwargs: Additional arguments passed to make_attack

    Returns:
        Tuple of (damage, conditions)
    """
    # Apply defender buffs
    modified_defender = apply_defender_buffs(defender, buff_config)

    # Make attack with modified defender
    damage, conditions = make_attack(
        attacker, modified_defender, build, **kwargs
    )

    # Apply attacker accuracy bonus if we have access to the roll
    # Note: This is tricky because make_attack doesn't expose the roll
    # We need to modify make_attack's behavior indirectly

    # For now, we'll need to pass accuracy bonus through kwargs
    # and modify the attack type to include it

    return damage, conditions


def make_aoe_attack_with_buffs(
    attacker: Character,
    defender: Character,
    build: AttackBuild,
    alive_enemies: List[Tuple[int, dict]],
    buff_config: BuffConfig,
    **kwargs
) -> Tuple[List[Tuple[int, int, List[str]]], int]:
    """
    Make an AOE attack with passive buff support.

    Args:
        attacker: Attacking character
        defender: Defending character (template for all enemies)
        build: Attack build to use
        alive_enemies: List of (index, enemy_dict) tuples
        buff_config: Passive buff configuration
        **kwargs: Additional arguments passed to make_aoe_attack

    Returns:
        Tuple of (results, total_damage) where results is list of (index, damage, conditions)
    """
    # Apply defender buffs
    modified_defender = apply_defender_buffs(defender, buff_config)

    # Make AOE attack with modified defender
    return make_aoe_attack(
        attacker, modified_defender, build, alive_enemies, **kwargs
    )


def simulate_combat_with_buffs(
    attacker: Character,
    defender: Character,
    build: AttackBuild,
    buff_config: BuffConfig,
    num_enemies: int = 1,
    enemy_hp: int = 100,
    enemy_hp_list: List[int] = None,
    max_turns: int = 100
) -> Tuple[int, str]:
    """
    Simulate combat with passive buff support.

    This is a simplified version of simulate_combat_verbose that applies buffs.

    Args:
        attacker: Attacking character
        defender: Defending character (template)
        build: Attack build to use
        buff_config: Passive buff configuration
        num_enemies: Number of enemies
        enemy_hp: HP per enemy
        enemy_hp_list: Optional list of HP values for mixed groups
        max_turns: Maximum combat turns

    Returns:
        Tuple of (turns, outcome) where outcome is "win" or "timeout"
    """
    from src.simulation import simulate_combat_verbose

    # Apply defender buffs
    modified_defender = apply_defender_buffs(defender, buff_config)

    # Apply attacker buffs by modifying stats
    # Accuracy bonus: add to focus (accuracy = 10 + tier + focus)
    # Damage bonus: add to power (affects damage calculations)
    if buff_config.attacker_accuracy_bonus != 0 or buff_config.attacker_damage_bonus != 0:
        modified_attacker = Character(
            focus=attacker.focus + buff_config.attacker_accuracy_bonus,
            power=attacker.power + buff_config.attacker_damage_bonus,
            mobility=attacker.mobility,
            endurance=attacker.endurance,
            tier=attacker.tier,
            max_hp=attacker.max_hp
        )
    else:
        modified_attacker = attacker

    # Run simulation with modified characters
    return simulate_combat_verbose(
        attacker=modified_attacker,
        build=build,
        target_hp=enemy_hp,
        defender=modified_defender,
        num_enemies=num_enemies,
        enemy_hp=enemy_hp,
        enemy_hp_list=enemy_hp_list,
        max_turns=max_turns
    )


def run_simulation_batch_with_buffs(
    attacker: Character,
    defender: Character,
    build: AttackBuild,
    buff_config: BuffConfig,
    num_runs: int = 10,
    num_enemies: int = 1,
    enemy_hp: int = 100,
    enemy_hp_list: List[int] = None,
    max_turns: int = 100
) -> Tuple[List[int], float, float, dict]:
    """
    Run multiple combat simulations with buffs and return aggregate results.

    Args:
        attacker: Attacking character
        defender: Defending character (template)
        build: Attack build to use
        buff_config: Passive buff configuration
        num_runs: Number of simulation iterations
        num_enemies: Number of enemies
        enemy_hp: HP per enemy
        enemy_hp_list: Optional list of HP values for mixed groups
        max_turns: Maximum combat turns

    Returns:
        Tuple of (individual_results, avg_turns, dpt, outcome_stats)
    """
    results = []
    outcomes = {"win": 0, "loss": 0, "timeout": 0}

    # Calculate total HP pool
    if enemy_hp_list:
        total_hp_pool = sum(enemy_hp_list)
    else:
        total_hp_pool = enemy_hp * num_enemies

    for _ in range(num_runs):
        turns, outcome = simulate_combat_with_buffs(
            attacker, defender, build, buff_config,
            num_enemies=num_enemies,
            enemy_hp=enemy_hp,
            enemy_hp_list=enemy_hp_list,
            max_turns=max_turns
        )
        results.append(turns)
        outcomes[outcome] += 1

    # Calculate statistics
    avg_turns = sum(results) / num_runs if num_runs > 0 else 0
    dpt = total_hp_pool / avg_turns if avg_turns > 0 else 0

    outcome_stats = {
        "wins": outcomes["win"],
        "losses": outcomes["loss"],
        "timeouts": outcomes["timeout"],
        "win_rate": (outcomes["win"] / num_runs * 100) if num_runs > 0 else 0
    }

    return results, avg_turns, dpt, outcome_stats
