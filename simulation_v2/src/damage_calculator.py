"""
Expected damage calculation for intelligent attack selection in combat simulation.

This module provides simple math-based damage calculations without running full simulations.
Used for per-turn attack selection in dual_natured builds.
"""

from typing import List
from src.models import Character, AttackBuild


def calculate_expected_damage(
    attacker: Character,
    build: AttackBuild,
    defender: Character,
    num_alive_targets: int = 1,
    tier_bonus: int = 0
) -> float:
    """
    Calculate expected damage output for a build using average dice values.

    Args:
        attacker: The attacking character
        build: The attack build to calculate damage for
        defender: The defending character
        num_alive_targets: Number of alive enemies (for AOE calculations)
        tier_bonus: Bonus to accuracy and damage from fallback system

    Returns:
        Expected damage per attack (float)
    """
    from src.game_data import ATTACK_TYPES, UPGRADES, LIMITS

    # Get attack type data
    attack_type_data = ATTACK_TYPES.get(build.attack_type)
    if not attack_type_data:
        return 0.0

    # Calculate base accuracy (d20 average = 10.5, using 10 for simplicity)
    base_accuracy = 10 + attacker.tier + attacker.focus
    accuracy_mod = attack_type_data.accuracy_mod

    # Add upgrade accuracy modifiers
    for upgrade_name in build.upgrades:
        if upgrade_name in UPGRADES:
            accuracy_mod += UPGRADES[upgrade_name].accuracy_mod
            accuracy_mod -= UPGRADES[upgrade_name].accuracy_penalty

    # Add limit accuracy bonuses (ALL limits apply to both accuracy and damage)
    limit_bonus = 0
    for limit_name in build.limits:
        if limit_name in LIMITS:
            limit_bonus += LIMITS[limit_name].damage_bonus * attacker.tier

    total_accuracy = base_accuracy + accuracy_mod + tier_bonus + limit_bonus

    # Calculate base damage (3d6 exploding average ≈ 10.5)
    base_damage = 10.5 + attacker.tier + attacker.power
    damage_mod = attack_type_data.damage_mod

    # Add upgrade damage modifiers
    for upgrade_name in build.upgrades:
        if upgrade_name in UPGRADES:
            damage_mod += UPGRADES[upgrade_name].damage_mod
            damage_mod -= UPGRADES[upgrade_name].damage_penalty

    # Add limit damage bonuses (ALL limits apply to both accuracy and damage)
    limit_bonus = 0
    for limit_name in build.limits:
        if limit_name in LIMITS:
            limit_bonus += LIMITS[limit_name].damage_bonus * attacker.tier

    total_damage = base_damage + damage_mod + tier_bonus + limit_bonus

    # Calculate hit chance (simplified d20 probability)
    # hit_chance = (21 - (defender.avoidance - total_accuracy)) / 20
    # Clamped between 5% (natural 1 always misses) and 95% (natural 20 always hits)
    defender_avoidance = defender.avoidance
    hit_chance = max(0.05, min(0.95, (21 - (defender_avoidance - total_accuracy)) / 20))

    # Calculate damage after soak (defender durability reduces damage)
    damage_after_soak = max(0, total_damage - defender.durability)

    # Calculate expected damage for single target
    expected_single_target = hit_chance * damage_after_soak

    # Apply complexity multiplier for upgrades (1.2x per upgrade for special effects)
    num_upgrades = len(build.upgrades)
    upgrade_multiplier = 1.2 ** num_upgrades
    expected_single_target *= upgrade_multiplier

    # For AOE attacks, multiply by number of alive targets
    is_aoe = build.attack_type in ['area', 'direct_area_damage']
    if is_aoe:
        expected_damage = expected_single_target * num_alive_targets
    else:
        expected_damage = expected_single_target

    return expected_damage


def calculate_all_expected_damages(
    builds: List[AttackBuild],
    attacker: Character,
    defender: Character,
    tier_bonus: int = 0
) -> List[float]:
    """
    Pre-calculate expected damage for all attacks in a MultiAttackBuild.

    This is called once before combat starts to avoid recalculating static values.
    The values are used for per-turn attack selection.

    Args:
        builds: List of AttackBuild objects (from MultiAttackBuild.builds)
        attacker: The attacking character
        defender: The defending character
        tier_bonus: Bonus to accuracy and damage from fallback system

    Returns:
        List of expected damage values (one per build)
    """
    expected_damages = []

    for build in builds:
        # Calculate with num_alive_targets=1 as baseline
        # Actual damage will be recalculated per-turn for AOE based on current enemy count
        expected_dmg = calculate_expected_damage(
            attacker,
            build,
            defender,
            num_alive_targets=1,
            tier_bonus=tier_bonus
        )
        expected_damages.append(expected_dmg)

    return expected_damages


def is_aoe_attack(build: AttackBuild) -> bool:
    """
    Check if an attack build is AOE (area of effect).

    Args:
        build: The attack build to check

    Returns:
        True if the attack is AOE, False otherwise
    """
    return build.attack_type in ['area', 'direct_area_damage']
