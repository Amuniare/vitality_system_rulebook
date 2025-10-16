"""
Stage 2: Attack Pairing with Intelligent Selection for Simulation V3

Loads pruned attacks from Stage 1, generates all pairs, and tests them
with intelligent attack selection based on combat state.
"""

import sys
import os
import json
import time
import psutil
import multiprocessing
import gc
import pickle
import tempfile
import random
from datetime import datetime
from typing import List, Dict, Tuple
from collections import defaultdict
import statistics
import itertools
from numba import njit

# Add parent simulation directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'simulation_v2'))

from src.models import Character, AttackBuild, MultiAttackBuild
from combat_with_buffs import BuffConfig, apply_defender_buffs
from stage1_pruning import Stage1Config


class Stage2Config:
    """Configuration for Stage 2 pairing."""

    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = os.path.join(os.path.dirname(__file__), 'config.json')

        with open(config_path, 'r') as f:
            data = json.load(f)

        self.tier = data['tier']
        self.archetype = data['archetype']

        # Stage 2 settings
        stage2 = data['stage2']
        self.simulation_runs = stage2['simulation_runs']
        self.max_turns = stage2['max_turns']
        self.max_pairs = stage2.get('max_pairs', None)  # None = test all, int = sample limit
        self.pair_sample_percent = stage2.get('pair_sample_percent', None)  # None = all pairs, float = % of partners per attack

        # Performance settings
        perf = data.get('performance', {})
        self.use_threading = perf.get('use_threading', False)
        self.num_workers = perf.get('num_workers', 0)  # 0 = auto (CPU count)
        self.chunk_size = perf.get('chunk_size', 500)

        # Character config
        self.attacker_stats = data['character_config']['attacker']

        # Defensive profiles
        self.defensive_profiles = []
        for profile in data['defensive_profiles']:
            self.defensive_profiles.append({
                'name': profile['name'],
                'stats': profile['stats'],
                'description': profile['description']
            })

        # Buff configurations
        self.buff_configs = []
        for buff in data['buff_configurations']:
            self.buff_configs.append(BuffConfig.from_dict(buff))

        # Scenarios
        self.scenarios = data['scenarios']


def load_pruned_attacks(cache_path: str = None) -> List[AttackBuild]:
    """
    Load pruned attacks from Stage 1 cache.

    Args:
        cache_path: Path to pruned attacks JSON file

    Returns:
        List of AttackBuild objects
    """
    if cache_path is None:
        cache_path = os.path.join(os.path.dirname(__file__), 'cache', 'pruned_attacks.json')

    print(f"\n=== Loading Pruned Attacks ===")
    print(f"  Cache file: {cache_path}")

    with open(cache_path, 'r') as f:
        data = json.load(f)

    attacks = []
    for item in data:
        build = AttackBuild(
            attack_type=item['attack_type'],
            upgrades=item['upgrades'],
            limits=item['limits']
        )
        attacks.append(build)

    print(f"  Loaded {len(attacks)} pruned attacks")
    return attacks


def precompute_attack_characteristics(attack: AttackBuild) -> dict:
    """
    Pre-compute attack characteristics for O(1) lookup during scoring.
    This is called ONCE when the pair test starts, not every turn.

    Returns:
        Dictionary with attack features for fast lookup
    """
    upgrades_set = set(attack.upgrades)
    limits_set = set(attack.limits)

    return {
        # Attack type
        'is_aoe': attack.attack_type in ('area', 'direct_area_damage'),

        # Upgrades (as booleans for O(1) lookup)
        'accurate_attack': 'accurate_attack' in upgrades_set,
        'reliable_accuracy': 'reliable_accuracy' in upgrades_set,
        'critical_accuracy': 'critical_accuracy' in upgrades_set,
        'power_attack': 'power_attack' in upgrades_set,
        'critical_effect': 'critical_effect' in upgrades_set,
        'armor_piercing': 'armor_piercing' in upgrades_set,
        'brutal': 'brutal' in upgrades_set,
        'high_impact': 'high_impact' in upgrades_set,
        'boss_slayer': 'boss_slayer_acc' in upgrades_set or 'boss_slayer_dmg' in upgrades_set,
        'minion_slayer': 'minion_slayer_acc' in upgrades_set or 'minion_slayer_dmg' in upgrades_set,
        'culling_strike': 'culling_strike' in upgrades_set,
        'finishing_blow': any(u.startswith('finishing_blow') for u in upgrades_set),
        'channeled': 'channeled' in upgrades_set,
        'splinter_ricochet': 'splinter' in upgrades_set or 'ricochet' in upgrades_set,
        'overhit': 'overhit' in upgrades_set,
        'explosive_critical': 'explosive_critical' in upgrades_set,

        # Limits
        'charge_limit': 'charge_up' in limits_set or 'charge_up_2' in limits_set,
        'hp_limit': 'near_death' in limits_set or 'bloodied' in limits_set,

        # Profile bonuses (precomputed)
        'evasive_bonus': (
            (30 if 'accurate_attack' in upgrades_set else 0) +
            (40 if 'reliable_accuracy' in upgrades_set else 0) +
            (20 if 'critical_accuracy' in upgrades_set else 0) -
            (20 if 'power_attack' in upgrades_set else 0) -
            (15 if 'critical_effect' in upgrades_set else 0)),

        'tanky_bonus': (
            (50 if 'armor_piercing' in upgrades_set else 0) +
            (30 if 'power_attack' in upgrades_set else 0) +
            (25 if 'brutal' in upgrades_set else 0) +
            (20 if 'high_impact' in upgrades_set else 0) -
            (15 if 'accurate_attack' in upgrades_set else 0)),

        'elite_bonus': (
            (40 if 'armor_piercing' in upgrades_set else 0) +
            (25 if 'accurate_attack' in upgrades_set else 0) +
            (30 if 'reliable_accuracy' in upgrades_set else 0) -
            (10 if ('power_attack' in upgrades_set and 'accurate_attack' not in upgrades_set) else 0)),
    }


@njit(cache=True)
def score_attack_for_situation_numba(
    is_aoe: bool,
    evasive_bonus: float,
    tanky_bonus: float,
    elite_bonus: float,
    power_attack: bool,
    accurate_attack: bool,
    reliable_accuracy: bool,
    armor_piercing: bool,
    brutal: bool,
    boss_slayer: bool,
    minion_slayer: bool,
    culling_strike: bool,
    finishing_blow: bool,
    channeled: bool,
    splinter_ricochet: bool,
    overhit: bool,
    explosive_critical: bool,
    charge_limit: bool,
    hp_limit: bool,
    num_alive: int,
    avg_hp_per_enemy: float,
    max_hp: int,
    wounded_count: int,
    profile_idx: int,  # 0=Balanced, 1=Evasive, 2=Tanky, 3=Elite
    buff_idx: int,  # 0=None, 1=Offensive, 2=Defensive
    buff_has_avoidance: bool,
    buff_has_durability: bool
) -> float:
    """
    Numba-compiled scoring function for maximum performance.

    This is called every turn and compiled to native code with no GIL.
    """
    score = 0.0

    # Attack type scoring based on scenario
    if num_alive >= 5:
        score += 100.0 if is_aoe else -50.0
    elif num_alive >= 3:
        score += 50.0 if is_aoe else 0.0
    elif num_alive == 1:
        score += -30.0 if is_aoe else 50.0
    else:
        score += 10.0 if is_aoe else 20.0

    # Defensive profile adaptations
    if profile_idx == 1:  # Evasive
        score += evasive_bonus
    elif profile_idx == 2:  # Tanky
        score += tanky_bonus
    elif profile_idx == 3:  # Elite
        score += elite_bonus

    # Buff configuration adaptations
    if buff_idx == 1:  # Offensive Buff
        score += 15.0 if power_attack else 0.0
        score -= 5.0 if accurate_attack else 0.0
    elif buff_idx == 2:  # Defensive Buff
        if buff_has_avoidance:
            score += 20.0 if reliable_accuracy else 0.0
            score += 15.0 if accurate_attack else 0.0
        if buff_has_durability:
            score += 20.0 if armor_piercing else 0.0
            score += 15.0 if brutal else 0.0

    # Upgrade synergies with scenario
    if boss_slayer:
        if num_alive == 1 and max_hp >= 80:
            score += 40.0
        elif num_alive <= 2:
            score += 20.0
        else:
            score -= 10.0

    if minion_slayer:
        if num_alive >= 4 and avg_hp_per_enemy <= 30.0:
            score += 35.0
        elif num_alive >= 2:
            score += 15.0

    if culling_strike:
        if num_alive >= 3 and avg_hp_per_enemy < 40.0:
            score += 30.0
        elif num_alive >= 2:
            score += 15.0

    if finishing_blow:
        if wounded_count >= 2:
            score += 25.0
        elif wounded_count >= 1:
            score += 15.0

    if channeled:
        if num_alive == 1:
            score += 25.0
        elif num_alive <= 2:
            score += 10.0
        else:
            score -= 15.0

    if splinter_ricochet:
        if num_alive >= 3:
            score += 20.0
        elif num_alive >= 2:
            score += 10.0

    if overhit and num_alive >= 3:
        score += 15.0

    if explosive_critical and num_alive >= 3:
        score += 20.0

    # Limit penalties
    if charge_limit:
        if num_alive >= 4:
            score -= 20.0
        elif num_alive >= 2:
            score -= 10.0

    if hp_limit:
        score -= 5.0

    return score


def score_attack_for_situation(
    attack_chars: dict,
    num_alive: int,
    avg_hp_per_enemy: float,
    max_hp: int,
    wounded_count: int,
    profile_name: str,
    buff_config_name: str,
    buff_has_avoidance: bool,
    buff_has_durability: bool
) -> float:
    """
    Wrapper for Numba-compiled scoring function.
    Converts dict to individual parameters for Numba compatibility.
    """
    # Map profile name to index
    profile_map = {"Balanced": 0, "Evasive": 1, "Tanky": 2, "Elite": 3}
    profile_idx = profile_map.get(profile_name, 0)

    # Map buff name to index
    if buff_config_name == "Offensive Buff":
        buff_idx = 1
    elif buff_config_name.startswith("Defensive Buff"):
        buff_idx = 2
    else:
        buff_idx = 0

    return score_attack_for_situation_numba(
        attack_chars['is_aoe'],
        attack_chars['evasive_bonus'],
        attack_chars['tanky_bonus'],
        attack_chars['elite_bonus'],
        attack_chars['power_attack'],
        attack_chars['accurate_attack'],
        attack_chars['reliable_accuracy'],
        attack_chars['armor_piercing'],
        attack_chars['brutal'],
        attack_chars['boss_slayer'],
        attack_chars['minion_slayer'],
        attack_chars['culling_strike'],
        attack_chars['finishing_blow'],
        attack_chars['channeled'],
        attack_chars['splinter_ricochet'],
        attack_chars['overhit'],
        attack_chars['explosive_critical'],
        attack_chars['charge_limit'],
        attack_chars['hp_limit'],
        num_alive,
        avg_hp_per_enemy,
        max_hp,
        wounded_count,
        profile_idx,
        buff_idx,
        buff_has_avoidance,
        buff_has_durability
    )


def simulate_pair_with_intelligent_selection(
    attacker: Character,
    defender: Character,
    attack1: AttackBuild,
    attack2: AttackBuild,
    buff_config: BuffConfig,
    defensive_profile: dict,
    scenario: dict,
    max_turns: int = 100
) -> Tuple[int, str, Dict]:
    """
    Simulate combat with intelligent attack selection between two attacks.

    Args:
        attacker: Attacking character
        defender: Defending character (template)
        attack1: First attack option
        attack2: Second attack option
        buff_config: Buff configuration
        defensive_profile: Defensive profile being tested
        scenario: Scenario configuration
        max_turns: Maximum combat turns

    Returns:
        Tuple of (turns, outcome, usage_stats) where usage_stats tracks attack usage
    """
    from src.combat import make_attack, make_aoe_attack

    # PRE-COMPUTE ATTACK CHARACTERISTICS (ONCE, NOT EVERY TURN)
    attack1_chars = precompute_attack_characteristics(attack1)
    attack2_chars = precompute_attack_characteristics(attack2)

    # Pre-compute buff config characteristics
    profile_name = defensive_profile['name']
    buff_config_name = buff_config.name
    buff_has_avoidance = buff_config.defender_avoidance_bonus > 0
    buff_has_durability = buff_config.defender_durability_bonus > 0

    # Apply buffs
    modified_defender = apply_defender_buffs(defender, buff_config)

    if buff_config.attacker_accuracy_bonus != 0:
        modified_attacker = Character(
            focus=attacker.focus + buff_config.attacker_accuracy_bonus,
            power=attacker.power,
            mobility=attacker.mobility,
            endurance=attacker.endurance,
            tier=attacker.tier,
            max_hp=attacker.max_hp
        )
    else:
        modified_attacker = attacker

    # Initialize enemies
    if scenario.get('enemy_hp_list'):
        enemies = [{'hp': hp, 'max_hp': hp, 'bleed_stacks': []} for hp in scenario['enemy_hp_list']]
    else:
        enemy_hp = scenario.get('enemy_hp', 100)
        num_enemies = scenario.get('num_enemies', 1)
        enemies = [{'hp': enemy_hp, 'max_hp': enemy_hp, 'bleed_stacks': []} for _ in range(num_enemies)]

    # Track attack usage
    attack_usage = {1: 0, 2: 0}

    # Combat state
    attacker_hp = modified_attacker.max_hp
    attacker_max_hp = modified_attacker.max_hp
    turns = 0
    charge_history = []
    cooldown_history = {}
    combat_state = {
        'last_target_hit': None,
        'defeated_enemy_last_turn': False,
        'dealt_damage_last_turn': False,
        'was_hit_last_turn': False,
        'was_damaged_last_turn': False,
        'all_attacks_missed_last_turn': False,
        'was_hit_no_damage_last_turn': False,
        'was_attacked_last_turn': False,
        'channeled_turns': 0,
        'charges_used': {},
        'leech_hp': 0,
        'attrition_cost': 0,
        'hit_same_target_last_turn': False,
    }

    while any(e['hp'] > 0 for e in enemies) and turns < max_turns:
        turns += 1

        # Apply bleed damage
        for enemy in enemies:
            if enemy['hp'] <= 0 or not enemy['bleed_stacks']:
                continue

            total_bleed = 0
            active_bleeds = []
            for bleed_dmg, turns_left in enemy['bleed_stacks']:
                if turns_left > 0:
                    total_bleed += bleed_dmg
                    active_bleeds.append((bleed_dmg, turns_left - 1))

            enemy['bleed_stacks'] = active_bleeds
            enemy['hp'] = max(0, enemy['hp'] - total_bleed)

        # Check if combat is over
        if not any(e['hp'] > 0 for e in enemies):
            break

        # Calculate dynamic combat metrics
        alive_enemies = [e for e in enemies if e['hp'] > 0]
        num_alive = len(alive_enemies)

        if num_alive == 0:
            break

        total_hp = sum(e['hp'] for e in alive_enemies)
        avg_hp_per_enemy = total_hp / num_alive
        max_hp = max(e['max_hp'] for e in alive_enemies)
        wounded_count = sum(1 for e in alive_enemies if e['hp'] < e['max_hp'] * 0.5)

        # INTELLIGENT ATTACK SELECTION (OPTIMIZED)
        score1 = score_attack_for_situation(
            attack1_chars, num_alive, avg_hp_per_enemy, max_hp, wounded_count,
            profile_name, buff_config_name, buff_has_avoidance, buff_has_durability
        )
        score2 = score_attack_for_situation(
            attack2_chars, num_alive, avg_hp_per_enemy, max_hp, wounded_count,
            profile_name, buff_config_name, buff_has_avoidance, buff_has_durability
        )

        # Select attack with higher score
        if score1 >= score2:
            selected_attack = attack1
            attack_idx = 1
        else:
            selected_attack = attack2
            attack_idx = 2

        attack_usage[attack_idx] += 1

        # Execute attack
        is_aoe = selected_attack.attack_type in ['area', 'direct_area_damage']

        if is_aoe:
            # AOE attack
            alive_targets = [(i, e) for i, e in enumerate(enemies) if e['hp'] > 0]
            attack_results, _ = make_aoe_attack(
                modified_attacker, modified_defender, selected_attack, alive_targets,
                turn_number=turns, charge_history=charge_history,
                cooldown_history=cooldown_history,
                attacker_hp=attacker_hp, attacker_max_hp=attacker_max_hp,
                combat_state=combat_state
            )

            # Apply damage
            for target_idx, damage, conditions in attack_results:
                enemies[target_idx]['hp'] = max(0, enemies[target_idx]['hp'] - damage)
                if 'bleed' in conditions:
                    bleed_dmg = max(0, damage - modified_attacker.tier)
                    enemies[target_idx]['bleed_stacks'] = [(bleed_dmg, 2)]
        else:
            # Single target attack
            target_idx = None
            for i, e in enumerate(enemies):
                if e['hp'] > 0:
                    target_idx = i
                    break

            if target_idx is not None:
                damage, conditions = make_attack(
                    modified_attacker, modified_defender, selected_attack,
                    turn_number=turns, charge_history=charge_history,
                    cooldown_history=cooldown_history,
                    attacker_hp=attacker_hp, attacker_max_hp=attacker_max_hp,
                    combat_state=combat_state,
                    enemy_max_hp=enemies[target_idx]['max_hp']
                )

                enemies[target_idx]['hp'] = max(0, enemies[target_idx]['hp'] - damage)
                if 'bleed' in conditions:
                    bleed_dmg = max(0, damage - modified_attacker.tier)
                    enemies[target_idx]['bleed_stacks'] = [(bleed_dmg, 2)]

        # Update charge history
        charge_history.append(False)  # Simplified - not tracking charges in Stage 2
        if len(charge_history) > 2:
            charge_history.pop(0)

        # Defender attacks back (simplified)
        # Skipping for Stage 2 to focus on attack comparison

    # Determine outcome
    if all(e['hp'] <= 0 for e in enemies):
        outcome = "win"
    else:
        outcome = "timeout"

    # Calculate usage percentages
    total_attacks = attack_usage[1] + attack_usage[2]
    usage_stats = {
        'attack1_uses': attack_usage[1],
        'attack2_uses': attack_usage[2],
        'attack1_percent': (attack_usage[1] / total_attacks * 100) if total_attacks > 0 else 0,
        'attack2_percent': (attack_usage[2] / total_attacks * 100) if total_attacks > 0 else 0,
    }

    return turns, outcome, usage_stats


def test_pair_across_profiles(
    attack1: AttackBuild,
    attack2: AttackBuild,
    config: Stage2Config,
    attack1_individual_results: Dict,
    attack2_individual_results: Dict
) -> Dict:
    """
    Test an attack pair across all profiles and scenarios.

    Args:
        attack1: First attack
        attack2: Second attack
        config: Stage 2 configuration
        attack1_individual_results: Individual performance data for attack1
        attack2_individual_results: Individual performance data for attack2

    Returns:
        Dictionary with comprehensive test results
    """
    attacker = Character(*config.attacker_stats)

    results = {
        'attack1': attack1,
        'attack2': attack2,
        'overall_turns': [],
        'profile_results': defaultdict(list),
        'buff_results': defaultdict(list),
        'scenario_results': defaultdict(list),
        'usage_by_profile': defaultdict(lambda: {'attack1': 0, 'attack2': 0}),
        'usage_by_scenario': defaultdict(lambda: {'attack1': 0, 'attack2': 0}),
        'outcomes': {'win': 0, 'timeout': 0}
    }

    # Test across all combinations
    for profile in config.defensive_profiles:
        defender = Character(*profile['stats'])

        for buff_config in config.buff_configs:
            for scenario in config.scenarios:
                # Run multiple simulations
                for _ in range(config.simulation_runs):
                    turns, outcome, usage = simulate_pair_with_intelligent_selection(
                        attacker, defender, attack1, attack2,
                        buff_config, profile, scenario,
                        max_turns=config.max_turns
                    )

                    # Record results
                    results['overall_turns'].append(turns)
                    results['profile_results'][profile['name']].append(turns)
                    results['buff_results'][buff_config.name].append(turns)
                    results['scenario_results'][scenario['name']].append(turns)
                    results['outcomes'][outcome] += 1

                    # Record usage
                    results['usage_by_profile'][profile['name']]['attack1'] += usage['attack1_uses']
                    results['usage_by_profile'][profile['name']]['attack2'] += usage['attack2_uses']
                    results['usage_by_scenario'][scenario['name']]['attack1'] += usage['attack1_uses']
                    results['usage_by_scenario'][scenario['name']]['attack2'] += usage['attack2_uses']

    # Calculate aggregates
    results['overall_avg'] = statistics.mean(results['overall_turns'])

    for profile_name, turns_list in results['profile_results'].items():
        results['profile_results'][profile_name] = statistics.mean(turns_list)

    for buff_name, turns_list in results['buff_results'].items():
        results['buff_results'][buff_name] = statistics.mean(turns_list)

    for scenario_name, turns_list in results['scenario_results'].items():
        results['scenario_results'][scenario_name] = statistics.mean(turns_list)

    # Calculate usage percentages
    for profile_name, usage in results['usage_by_profile'].items():
        total = usage['attack1'] + usage['attack2']
        if total > 0:
            results['usage_by_profile'][profile_name] = {
                'attack1_percent': usage['attack1'] / total * 100,
                'attack2_percent': usage['attack2'] / total * 100
            }

    for scenario_name, usage in results['usage_by_scenario'].items():
        total = usage['attack1'] + usage['attack2']
        if total > 0:
            results['usage_by_scenario'][scenario_name] = {
                'attack1_percent': usage['attack1'] / total * 100,
                'attack2_percent': usage['attack2'] / total * 100
            }

    # Calculate synergy score
    attack1_overall = attack1_individual_results.get('overall_avg', results['overall_avg'])
    attack2_overall = attack2_individual_results.get('overall_avg', results['overall_avg'])
    avg_individual = (attack1_overall + attack2_overall) / 2

    if avg_individual > 0:
        # Synergy: (individual_avg - paired_performance) / individual_avg
        # Positive = pair performs better than individual average
        results['synergy_score'] = (avg_individual - results['overall_avg']) / avg_individual * 100
    else:
        results['synergy_score'] = 0

    return results


def _test_pair_worker(args):
    """
    Worker function for testing a single pair (must be picklable for multiprocessing).

    Args:
        args: Tuple of (attack1, attack2, config_dict, individual_results_dict)

    Returns:
        Dictionary with test results
    """
    import time as worker_time
    worker_start = worker_time.time()

    attack1, attack2, config_dict, individual_results_dict = args

    # Reconstruct config from dict
    setup_start = worker_time.time()
    attacker = Character(*config_dict['attacker_stats'])
    setup_time = worker_time.time() - setup_start

    results = {
        'attack1': attack1,
        'attack2': attack2,
        'overall_turns': [],
        'profile_results': {},
        'buff_results': {},
        'scenario_results': {},
        'usage_by_profile': {},
        'usage_by_scenario': {},
        'outcomes': {'win': 0, 'timeout': 0}
    }

    # Initialize usage dicts for all profiles/scenarios (avoid lambda for pickling)
    for profile in config_dict['defensive_profiles']:
        results['usage_by_profile'][profile['name']] = {'attack1': 0, 'attack2': 0}
        results['profile_results'][profile['name']] = []

    for buff_dict in config_dict['buff_configs']:
        buff_name = buff_dict.get('name', 'Unknown')
        results['buff_results'][buff_name] = []

    for scenario in config_dict['scenarios']:
        results['usage_by_scenario'][scenario['name']] = {'attack1': 0, 'attack2': 0}
        results['scenario_results'][scenario['name']] = []

    # Test across all combinations
    for profile in config_dict['defensive_profiles']:
        defender = Character(*profile['stats'])

        for buff_dict in config_dict['buff_configs']:
            buff_config = BuffConfig(**buff_dict)

            for scenario in config_dict['scenarios']:
                # Run multiple simulations
                for _ in range(config_dict['simulation_runs']):
                    turns, outcome, usage = simulate_pair_with_intelligent_selection(
                        attacker, defender, attack1, attack2,
                        buff_config, profile, scenario,
                        max_turns=config_dict['max_turns']
                    )

                    # Record results
                    results['overall_turns'].append(turns)
                    results['profile_results'][profile['name']].append(turns)
                    results['buff_results'][buff_config.name].append(turns)
                    results['scenario_results'][scenario['name']].append(turns)
                    results['outcomes'][outcome] += 1

                    # Record usage
                    results['usage_by_profile'][profile['name']]['attack1'] += usage['attack1_uses']
                    results['usage_by_profile'][profile['name']]['attack2'] += usage['attack2_uses']
                    results['usage_by_scenario'][scenario['name']]['attack1'] += usage['attack1_uses']
                    results['usage_by_scenario'][scenario['name']]['attack2'] += usage['attack2_uses']

    # Calculate aggregates
    results['overall_avg'] = statistics.mean(results['overall_turns'])

    for profile_name, turns_list in results['profile_results'].items():
        results['profile_results'][profile_name] = statistics.mean(turns_list)

    for buff_name, turns_list in results['buff_results'].items():
        results['buff_results'][buff_name] = statistics.mean(turns_list)

    for scenario_name, turns_list in results['scenario_results'].items():
        results['scenario_results'][scenario_name] = statistics.mean(turns_list)

    # Calculate usage percentages
    for profile_name, usage in results['usage_by_profile'].items():
        total = usage['attack1'] + usage['attack2']
        if total > 0:
            results['usage_by_profile'][profile_name] = {
                'attack1_percent': usage['attack1'] / total * 100,
                'attack2_percent': usage['attack2'] / total * 100
            }

    for scenario_name, usage in results['usage_by_scenario'].items():
        total = usage['attack1'] + usage['attack2']
        if total > 0:
            results['usage_by_scenario'][scenario_name] = {
                'attack1_percent': usage['attack1'] / total * 100,
                'attack2_percent': usage['attack2'] / total * 100
            }

    # Calculate synergy score
    attack1_key = (attack1.attack_type, tuple(attack1.upgrades), tuple(attack1.limits))
    attack2_key = (attack2.attack_type, tuple(attack2.upgrades), tuple(attack2.limits))

    attack1_overall = individual_results_dict.get(attack1_key, {}).get('overall_avg', results['overall_avg'])
    attack2_overall = individual_results_dict.get(attack2_key, {}).get('overall_avg', results['overall_avg'])
    avg_individual = (attack1_overall + attack2_overall) / 2

    if avg_individual > 0:
        results['synergy_score'] = (avg_individual - results['overall_avg']) / avg_individual * 100
    else:
        results['synergy_score'] = 0

    return results


def generate_all_pairs(attacks: List[AttackBuild]) -> List[Tuple[AttackBuild, AttackBuild]]:
    """
    Generate all unique pairs of attacks.

    Args:
        attacks: List of pruned attacks

    Returns:
        List of (attack1, attack2) tuples
    """
    print(f"\n=== Generating Attack Pairs ===")
    pairs = list(itertools.combinations(attacks, 2))
    print(f"  Generated {len(pairs):,} unique pairs")
    return pairs


def generate_sampled_pairs(attacks: List[AttackBuild], sample_percent: float) -> List[Tuple[AttackBuild, AttackBuild]]:
    """
    Generate pairs by sampling a percentage of potential partners for each attack.

    Instead of generating all N*(N-1)/2 combinations, for each attack we randomly
    sample X% of the other attacks to pair with. This avoids memory issues with
    very large pairing spaces.

    Args:
        attacks: List of pruned attacks
        sample_percent: Percentage of partners to sample (0.0-1.0)

    Returns:
        List of (attack1, attack2) tuples
    """
    print(f"\n=== Generating Sampled Attack Pairs ===")
    print(f"  Total attacks: {len(attacks):,}")
    print(f"  Sample percent: {sample_percent * 100:.1f}%")

    # Use fixed seed for reproducibility
    random.seed(42)

    pairs = []
    for i, attack1 in enumerate(attacks):
        # Get all potential partners (attacks after this one to avoid duplicates)
        potential_partners = attacks[i+1:]

        if len(potential_partners) == 0:
            continue

        # Calculate sample size
        if sample_percent >= 1.0:
            # Test with all partners
            sampled_partners = potential_partners
        else:
            # Sample a percentage of partners
            sample_size = max(1, int(len(potential_partners) * sample_percent))
            sample_size = min(sample_size, len(potential_partners))  # Don't exceed available
            sampled_partners = random.sample(potential_partners, sample_size)

        # Create pairs with sampled partners
        for attack2 in sampled_partners:
            pairs.append((attack1, attack2))

    print(f"  Generated {len(pairs):,} sampled pairs")
    print(f"  Reduction: {len(pairs) / (len(attacks) * (len(attacks) - 1) / 2) * 100:.1f}% of all possible pairs")

    return pairs


def test_all_pairs_parallel(
    pairs: List[Tuple[AttackBuild, AttackBuild]],
    config: Stage2Config,
    individual_results_map: Dict
) -> List[Dict]:
    """
    Test all pairs in parallel using multiprocessing.

    Args:
        pairs: List of attack pairs
        config: Stage 2 configuration
        individual_results_map: Map of attack → individual performance data

    Returns:
        List of result dictionaries sorted by overall performance
    """
    print(f"\n=== Testing Attack Pairs (Parallel Mode) ===")
    print(f"  Total pairs to test: {len(pairs):,}")

    # Determine number of workers
    num_workers = config.num_workers if config.num_workers > 0 else multiprocessing.cpu_count()
    print(f"  Using {num_workers} worker processes")

    # Prepare config dict for workers (must be picklable)
    config_dict = {
        'attacker_stats': config.attacker_stats,
        'defensive_profiles': config.defensive_profiles,
        'buff_configs': [bc.__dict__ for bc in config.buff_configs],
        'scenarios': config.scenarios,
        'simulation_runs': config.simulation_runs,
        'max_turns': config.max_turns,
    }

    # Convert individual_results_map keys to ensure picklability
    individual_results_dict = {k: v for k, v in individual_results_map.items()}

    # Prepare work items
    work_items = [(attack1, attack2, config_dict, individual_results_dict)
                  for attack1, attack2 in pairs]

    # Use disk-based storage to avoid memory accumulation
    temp_dir = tempfile.mkdtemp(prefix='stage2_results_')
    result_files = []
    results_buffer = []
    disk_dump_interval = 20  # Write to disk every 20 chunks

    start_time = time.time()
    process = psutil.Process(os.getpid())
    chunk_times = []  # Track recent chunk processing times for better estimates

    print(f"  Using disk-based storage: {temp_dir}")
    print(f"  Memory dump interval: every {disk_dump_interval} chunks")

    with multiprocessing.Pool(processes=num_workers) as pool:
        chunk_size = config.chunk_size
        for chunk_idx, i in enumerate(range(0, len(work_items), chunk_size)):
            chunk_start = time.time()
            chunk = work_items[i:i + chunk_size]
            chunk_results = pool.map(_test_pair_worker, chunk)
            results_buffer.extend(chunk_results)

            # Free chunk memory
            del chunk_results

            # Periodically dump results to disk and free memory
            if (chunk_idx + 1) % disk_dump_interval == 0:
                # Write buffer to disk
                result_file = os.path.join(temp_dir, f'results_{chunk_idx + 1}.pkl')
                with open(result_file, 'wb') as f:
                    pickle.dump(results_buffer, f)
                result_files.append(result_file)

                # Clear buffer and force garbage collection
                results_buffer = []
                gc.collect()

            # Track chunk processing time
            chunk_time = time.time() - chunk_start
            chunk_times.append(chunk_time)
            if len(chunk_times) > 10:  # Keep last 10 chunks only
                chunk_times.pop(0)

            # Progress reporting
            pairs_done = min(i + chunk_size, len(pairs))
            elapsed = time.time() - start_time

            # Use recent chunk times for better time estimate
            if len(chunk_times) >= 3:
                # Average of recent chunks
                avg_chunk_time = sum(chunk_times) / len(chunk_times)
                remaining_chunks = (len(pairs) - pairs_done) / chunk_size
                est_remaining = avg_chunk_time * remaining_chunks
            else:
                # Fallback to overall average for first few chunks
                avg_time_per_pair = elapsed / pairs_done
                remaining_pairs = len(pairs) - pairs_done
                est_remaining = avg_time_per_pair * remaining_pairs

            # Format time
            if est_remaining < 60:
                time_str = f"~{int(est_remaining)}s remaining"
            else:
                mins = int(est_remaining / 60)
                secs = int(est_remaining % 60)
                time_str = f"~{mins}m {secs}s remaining"

            # Format elapsed time
            elapsed_mins = int(elapsed / 60)
            elapsed_secs = int(elapsed % 60)
            elapsed_str = f"{elapsed_mins}m {elapsed_secs}s"

            # Get memory usage
            mem_mb = process.memory_info().rss / 1024 / 1024

            # Get current time
            current_time = datetime.now().strftime("%H:%M:%S")

            print(f"  Testing pair {pairs_done}/{len(pairs)} ({pairs_done / len(pairs) * 100:.1f}%) | "
                  f"{time_str} | Elapsed: {elapsed_str} | Time: {current_time} | Memory: {mem_mb:.1f} MB")

    # Write any remaining results in buffer
    if results_buffer:
        result_file = os.path.join(temp_dir, f'results_final.pkl')
        with open(result_file, 'wb') as f:
            pickle.dump(results_buffer, f)
        result_files.append(result_file)
        results_buffer = []
        gc.collect()

    # Load results in streaming fashion and keep only top N to reduce memory
    print(f"\n  Loading and filtering results from disk ({len(result_files)} files)...")
    print(f"  Using aggressive streaming mode - keeping only top 5000 results")

    # Keep only top 5000 results (more than enough for reporting)
    top_n = 5000
    top_results = []
    total_processed = 0

    # Track memory usage
    process_mem = psutil.Process(os.getpid())

    for idx, result_file in enumerate(result_files, 1):
        # Load file
        mem_before = process_mem.memory_info().rss / 1024 / 1024
        with open(result_file, 'rb') as f:
            file_results = pickle.load(f)
        mem_after = process_mem.memory_info().rss / 1024 / 1024
        file_count = len(file_results)

        # Process each result with minimal memory footprint
        for result in file_results:
            total_processed += 1
            result_avg = result['overall_avg']

            if len(top_results) < top_n:
                # Still building up initial top-N
                top_results.append(result)
                if len(top_results) == top_n:
                    # Sort when we reach top_n for the first time
                    top_results.sort(key=lambda r: r['overall_avg'])
            else:
                # Check if this result is better than worst in top-N
                if result_avg < top_results[-1]['overall_avg']:
                    # Replace worst result
                    top_results[-1] = result
                    # Re-sort
                    top_results.sort(key=lambda r: r['overall_avg'])

        # Aggressively free memory after each file
        del file_results
        gc.collect()

        mem_after_gc = process_mem.memory_info().rss / 1024 / 1024

        # Progress reporting every 5 files
        if idx % 5 == 0 or idx == len(result_files):
            print(f"    File {idx}/{len(result_files)}: Processed {file_count:,} results | "
                  f"Loaded +{mem_after - mem_before:.0f}MB, freed -{mem_after - mem_after_gc:.0f}MB | "
                  f"Total: {total_processed:,} processed, {len(top_results):,} kept | "
                  f"Memory: {mem_after_gc:.0f}MB")

    final_mem = process_mem.memory_info().rss / 1024 / 1024
    print(f"\n  [OK] Processed {total_processed:,} total results")
    print(f"  [OK] Kept top {len(top_results):,} results")
    print(f"  [OK] Final memory usage: {final_mem:.0f}MB")

    # Clean up temporary files
    print(f"  Cleaning up temporary files...")
    for result_file in result_files:
        try:
            os.remove(result_file)
        except:
            pass
    try:
        os.rmdir(temp_dir)
    except:
        pass

    # Already sorted from streaming process
    print(f"  Testing complete")
    return top_results


def test_all_pairs(
    pairs: List[Tuple[AttackBuild, AttackBuild]],
    config: Stage2Config,
    individual_results_map: Dict
) -> List[Dict]:
    """
    Test all pairs and return sorted results.

    Args:
        pairs: List of attack pairs
        config: Stage 2 configuration
        individual_results_map: Map of attack → individual performance data

    Returns:
        List of result dictionaries sorted by overall performance
    """
    # Use parallel or sequential based on config
    if config.use_threading:
        return test_all_pairs_parallel(pairs, config, individual_results_map)

    print(f"\n=== Testing Attack Pairs (Sequential Mode) ===")
    print(f"  Total pairs to test: {len(pairs):,}")

    results = []
    start_time = time.time()
    process = psutil.Process(os.getpid())

    for i, (attack1, attack2) in enumerate(pairs):
        if (i + 1) % 100 == 0 or (i + 1) == len(pairs):
            # Calculate time estimates
            elapsed = time.time() - start_time
            pairs_done = i + 1

            avg_time_per_pair = elapsed / pairs_done
            remaining_pairs = len(pairs) - pairs_done
            est_remaining = avg_time_per_pair * remaining_pairs

            # Format time
            if est_remaining < 60:
                time_str = f"~{int(est_remaining)}s remaining"
            else:
                mins = int(est_remaining / 60)
                secs = int(est_remaining % 60)
                time_str = f"~{mins}m {secs}s remaining"

            # Format elapsed time
            elapsed_mins = int(elapsed / 60)
            elapsed_secs = int(elapsed % 60)
            elapsed_str = f"{elapsed_mins}m {elapsed_secs}s"

            # Get memory usage
            mem_mb = process.memory_info().rss / 1024 / 1024

            # Get current time
            current_time = datetime.now().strftime("%H:%M:%S")

            print(f"  Testing pair {i + 1}/{len(pairs)} ({(i + 1) / len(pairs) * 100:.1f}%) | "
                  f"{time_str} | Elapsed: {elapsed_str} | Time: {current_time} | Memory: {mem_mb:.1f} MB")

        # Get individual results
        attack1_key = (attack1.attack_type, tuple(attack1.upgrades), tuple(attack1.limits))
        attack2_key = (attack2.attack_type, tuple(attack2.upgrades), tuple(attack2.limits))

        attack1_individual = individual_results_map.get(attack1_key, {})
        attack2_individual = individual_results_map.get(attack2_key, {})

        # Test pair
        result = test_pair_across_profiles(
            attack1, attack2, config,
            attack1_individual, attack2_individual
        )
        results.append(result)

    # Sort by overall average (ascending = better)
    results.sort(key=lambda r: r['overall_avg'])

    print(f"  Testing complete")
    return results


def load_individual_results(cache_path: str = None) -> Dict:
    """
    Load individual attack results from Stage 1 for synergy calculations.

    Args:
        cache_path: Path to pruned attacks JSON

    Returns:
        Dictionary mapping attack key → performance data
    """
    if cache_path is None:
        cache_path = os.path.join(os.path.dirname(__file__), 'cache', 'pruned_attacks.json')

    with open(cache_path, 'r') as f:
        data = json.load(f)

    results_map = {}
    for item in data:
        key = (item['attack_type'], tuple(item['upgrades']), tuple(item['limits']))
        results_map[key] = {
            'overall_avg': item['overall_avg'],
            'profile_avgs': item['profile_avgs'],
            'buff_avgs': item['buff_avgs'],
            'scenario_avgs': item['scenario_avgs']
        }

    return results_map


def generate_stage2_report(
    results: List[Dict],
    config: Stage2Config,
    output_path: str
):
    """
    Generate Stage 2 markdown report with top pairs and detailed analysis.

    Args:
        results: List of pair test results (sorted)
        config: Stage 2 configuration
        output_path: Path to output markdown file
    """
    print(f"\n=== Generating Stage 2 Report ===")
    print(f"  Output file: {output_path}")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# Simulation V3 - Stage 2: Attack Pairing Results\n\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

        # Summary
        f.write("## Summary\n\n")
        f.write(f"- **Total pairs tested**: {len(results):,}\n")
        f.write(f"- **Simulation runs per pair**: {config.simulation_runs}\n")
        f.write(f"- **Test configurations**: {len(config.defensive_profiles)} profiles × {len(config.buff_configs)} buffs × {len(config.scenarios)} scenarios\n\n")

        # Top 50 pairs
        f.write("## Top 50 Attack Pairs\n\n")

        for rank, result in enumerate(results[:50], 1):
            attack1 = result['attack1']
            attack2 = result['attack2']

            f.write(f"### Rank {rank}: {attack1.attack_type} + {attack2.attack_type}\n\n")
            f.write(f"**Overall Performance:** {result['overall_avg']:.2f} avg turns\n\n")
            f.write(f"**Synergy Score:** {result['synergy_score']:+.1f}%\n\n")

            # Attack descriptions
            f.write(f"**Attack 1:** `{attack1.attack_type}`")
            if attack1.upgrades:
                f.write(f" + `{', '.join(attack1.upgrades)}`")
            if attack1.limits:
                f.write(f" [Limits: `{', '.join(attack1.limits)}`]")
            f.write(f" (Cost: {attack1.total_cost}p)\n\n")

            f.write(f"**Attack 2:** `{attack2.attack_type}`")
            if attack2.upgrades:
                f.write(f" + `{', '.join(attack2.upgrades)}`")
            if attack2.limits:
                f.write(f" [Limits: `{', '.join(attack2.limits)}`]")
            f.write(f" (Cost: {attack2.total_cost}p)\n\n")

            # Usage analysis
            f.write("**Usage Split:**\n\n")
            f.write("| Context | Attack 1 | Attack 2 |\n")
            f.write("|---------|----------|----------|\n")

            for profile in config.defensive_profiles:
                profile_name = profile['name']
                usage = result['usage_by_profile'].get(profile_name, {'attack1_percent': 0, 'attack2_percent': 0})
                f.write(f"| vs {profile_name} | {usage['attack1_percent']:.0f}% | {usage['attack2_percent']:.0f}% |\n")

            for scenario in config.scenarios:
                scenario_name = scenario['name']
                usage = result['usage_by_scenario'].get(scenario_name, {'attack1_percent': 0, 'attack2_percent': 0})
                f.write(f"| {scenario_name} | {usage['attack1_percent']:.0f}% | {usage['attack2_percent']:.0f}% |\n")

            # Performance breakdown
            f.write("\n**Performance by Profile:**\n\n")
            f.write("| Profile | Avg Turns |\n")
            f.write("|---------|----------|\n")
            for profile in config.defensive_profiles:
                avg_turns = result['profile_results'].get(profile['name'], 0)
                f.write(f"| {profile['name']} | {avg_turns:.2f} |\n")

            f.write("\n---\n\n")

    print(f"  Report generated with top {min(50, len(results))} pairs")


def run_stage2(config_path: str = None, reports_base_dir: str = None):
    """
    Run Stage 2: Load pruned attacks, generate pairs, test with intelligent selection.

    Args:
        config_path: Path to configuration file (optional)
        reports_base_dir: Base directory for reports (optional, uses timestamped folder if provided)
    """
    # Load configuration
    config = Stage2Config(config_path)

    # Load pruned attacks
    attacks = load_pruned_attacks()

    # Load individual results for synergy calculations
    individual_results_map = load_individual_results()

    # Generate pairs (using sampling if configured)
    if config.pair_sample_percent is not None:
        # Use per-attack sampling to avoid generating all pairs
        pairs = generate_sampled_pairs(attacks, config.pair_sample_percent)
    else:
        # Generate all pairs
        pairs = generate_all_pairs(attacks)

    # Apply additional absolute limit if max_pairs is set
    if config.max_pairs is not None and len(pairs) > config.max_pairs:
        print(f"\n=== Applying Additional Pair Limit ===")
        print(f"  Total pairs after sampling: {len(pairs):,}")
        print(f"  Limiting to: {config.max_pairs:,} pairs")
        random.seed(42)  # Reproducible sampling
        pairs = random.sample(pairs, config.max_pairs)
        print(f"  Final pair count: {len(pairs):,}")

    # Test pairs
    results = test_all_pairs(pairs, config, individual_results_map)

    # Set up output directory
    if reports_base_dir:
        output_dir = os.path.join(reports_base_dir, 'stage2')
    else:
        output_dir = os.path.join(os.path.dirname(__file__), 'reports', 'stage2')
    os.makedirs(output_dir, exist_ok=True)

    # Generate all reports
    print(f"\n=== Generating Stage 2 Reports ===")

    # Main pairing report (top 50 pairs with details)
    report_path = os.path.join(output_dir, 'stage2_pairing_report.md')
    generate_stage2_report(results, config, report_path)

    # Import report generators
    from enhancement_ranking_report import generate_enhancement_ranking_reports
    from enhancement_saturation_report import generate_enhancement_saturation_reports
    from top_1000_pairs_report import generate_top_1000_pairs_report
    from pair_cost_analysis_report import generate_pair_cost_analysis_report
    from synergy_analysis_report import generate_synergy_analysis_report

    # Enhancement ranking reports (5 tiers)
    generate_enhancement_ranking_reports(results, config, output_dir)

    # Enhancement saturation reports (5 tiers)
    generate_enhancement_saturation_reports(results, config, output_dir)

    # Top 1000 pairs list
    top_1000_path = os.path.join(output_dir, 'top_1000_pairs.md')
    generate_top_1000_pairs_report(results, top_1000_path)

    # Cost analysis
    cost_analysis_path = os.path.join(output_dir, 'pair_cost_analysis.md')
    generate_pair_cost_analysis_report(results, cost_analysis_path)

    # Synergy analysis
    synergy_path = os.path.join(output_dir, 'synergy_analysis.md')
    generate_synergy_analysis_report(results, config, synergy_path)

    print(f"\n=== Stage 2 Complete ===")
    print(f"  All reports saved to: {output_dir}")
    print(f"  Main report: {report_path}")

    return results


if __name__ == "__main__":
    import sys
    config_path = sys.argv[1] if len(sys.argv) > 1 else None
    run_stage2(config_path)
