"""
Combat log generation for Simulation V3.

Generates detailed turn-by-turn combat logs for top-performing builds.
"""

import sys
import os
from io import StringIO
from datetime import datetime

# Add parent simulation directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'simulation_v2'))

from src.models import Character, AttackBuild
from src.simulation import simulate_combat_verbose


def format_attack_name(attack: AttackBuild, rank: int) -> str:
    """Generate a filename-safe name for an attack."""
    parts = [f"rank{rank:02d}"]
    parts.append(attack.attack_type)

    # Add first 2 upgrades
    if attack.upgrades:
        parts.extend(attack.upgrades[:2])
        if len(attack.upgrades) > 2:
            parts.append("more")

    # Add first limit
    if attack.limits:
        parts.append(attack.limits[0])

    return "_".join(parts)


def format_attack_description(attack: AttackBuild) -> str:
    """Generate a human-readable description of an attack."""
    desc = f"{attack.attack_type}"
    if attack.upgrades:
        desc += f" + Upgrades: {', '.join(attack.upgrades)}"
    if attack.limits:
        desc += f" + Limits: {', '.join(attack.limits)}"
    desc += f" (Cost: {attack.total_cost}p)"
    return desc


def generate_attack_combat_log(
    attack: AttackBuild,
    rank: int,
    avg_turns: float,
    attacker_stats: list,
    defensive_profiles: list,
    scenarios: list,
    output_dir: str
):
    """
    Generate a detailed combat log for a single attack across all profiles and scenarios.

    Args:
        attack: AttackBuild to log
        rank: Rank of this attack (for filename)
        avg_turns: Average turns for this attack
        attacker_stats: [focus, power, mobility, endurance, tier]
        defensive_profiles: List of defensive profile dicts
        scenarios: List of scenario dicts
        output_dir: Directory to save log file
    """
    attacker = Character(*attacker_stats)

    # Create output file
    attack_name = format_attack_name(attack, rank)
    output_file = os.path.join(output_dir, f"{attack_name}.txt")

    attack_desc = format_attack_description(attack)

    # Use StringIO buffer for better performance
    buffer = StringIO()

    # Write header
    buffer.write(f"{'='*80}\n")
    buffer.write(f"TOP 50 ATTACK COMBAT LOG - DETAILED MECHANICS ANALYSIS\n")
    buffer.write(f"{'='*80}\n")
    buffer.write(f"Rank: #{rank}\n")
    buffer.write(f"Attack: {attack_desc}\n")
    buffer.write(f"Average Turns: {avg_turns:.2f}\n")
    buffer.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    buffer.write(f"{'='*80}\n\n")

    # Run simulation for each profile × scenario combination
    test_num = 0
    for profile in defensive_profiles:
        defender = Character(*profile['stats'])

        for scenario_idx, scenario in enumerate(scenarios, 1):
            test_num += 1
            buffer.write(f"\n{'='*80}\n")
            buffer.write(f"TEST {test_num}: vs {profile['name']} - ")

            if scenario.get('enemy_hp_list'):
                buffer.write(f"Mixed Enemy Group - HP: {scenario['enemy_hp_list']}\n")
                buffer.write(f"{'='*80}\n")

                turns, outcome = simulate_combat_verbose(
                    attacker=attacker,
                    build=attack,
                    target_hp=100,
                    log_file=buffer,
                    defender=defender,
                    enemy_hp_list=scenario['enemy_hp_list'],
                    max_turns=100
                )
            else:
                buffer.write(f"{scenario['num_enemies']} Enemies x {scenario['enemy_hp']} HP\n")
                buffer.write(f"{'='*80}\n")

                turns, outcome = simulate_combat_verbose(
                    attacker=attacker,
                    build=attack,
                    target_hp=100,
                    log_file=buffer,
                    defender=defender,
                    num_enemies=scenario['num_enemies'],
                    enemy_hp=scenario['enemy_hp'],
                    max_turns=100
                )

            buffer.write(f"\n{'='*60}\n")
            buffer.write(f"TEST {test_num} RESULT: {outcome.upper()} in {turns} turns\n")
            buffer.write(f"{'='*60}\n\n")

    # Write buffer to file in one operation
    with open(output_file, 'w', encoding='utf-8', buffering=8192) as f:
        f.write(buffer.getvalue())

    # Close buffer
    buffer.close()


def generate_top_attack_logs(
    pruned_results: list,  # List of AttackTestResult objects
    attacker_stats: list,
    defensive_profiles: list,
    scenarios: list,
    output_dir: str,
    top_n: int = 50
):
    """
    Generate combat logs for top N attacks.

    Args:
        pruned_results: List of AttackTestResult objects (sorted by performance)
        attacker_stats: [focus, power, mobility, endurance, tier]
        defensive_profiles: List of defensive profile dicts
        scenarios: List of scenario dicts
        output_dir: Directory to save log files
        top_n: Number of top attacks to generate logs for
    """
    print(f"\n=== Generating Top {top_n} Attack Combat Logs ===")

    os.makedirs(output_dir, exist_ok=True)

    top_attacks = pruned_results[:top_n]

    for rank, result in enumerate(top_attacks, 1):
        print(f"  [{rank}/{len(top_attacks)}] {format_attack_description(result.build)} - Avg Turns: {result.overall_avg:.2f}")

        try:
            generate_attack_combat_log(
                attack=result.build,
                rank=rank,
                avg_turns=result.overall_avg,
                attacker_stats=attacker_stats,
                defensive_profiles=defensive_profiles,
                scenarios=scenarios,
                output_dir=output_dir
            )
        except Exception as e:
            print(f"    ERROR: {e}")
            import traceback
            traceback.print_exc()

    print(f"  Generated {len(top_attacks)} combat logs")


if __name__ == "__main__":
    print("This module should be imported and used by stage1_pruning.py")
    print("Run: python main.py --stage 1")
