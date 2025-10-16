"""
Quick performance test to profile one pair and see where time is spent.
"""
import time
from stage2_pairing import _test_pair_worker, precompute_attack_characteristics
from src.models import AttackBuild
from combat_with_buffs import BuffConfig

# Create simple test pair
attack1 = AttackBuild(
    attack_type='melee_dg',
    upgrades=['power_attack', 'brutal'],
    limits=[]
)

attack2 = AttackBuild(
    attack_type='area',
    upgrades=['reliable_accuracy'],
    limits=['unreliable_1']
)

# Simple config
config_dict = {
    'attacker_stats': [2, 2, 2, 2, 4],
    'defensive_profiles': [
        {'name': 'Evasive', 'stats': [2, 2, 4, 2, 4]}
    ],
    'buff_configs': [{'name': 'No Buffs', 'attacker_accuracy_bonus': 0, 'attacker_damage_bonus': 0,
                       'defender_avoidance_bonus': 0, 'defender_durability_bonus': 0}],
    'scenarios': [{'name': 'Boss', 'num_enemies': 1, 'enemy_hp': 100}],
    'simulation_runs': 2,
    'max_turns': 25,
}

print("Testing single pair performance...")
print(f"Attack 1: {attack1.attack_type} + {attack1.upgrades}")
print(f"Attack 2: {attack2.attack_type} + {attack2.upgrades}")
print()

# Time the worker function
start = time.time()
result = _test_pair_worker((attack1, attack2, config_dict, {}))
elapsed = time.time() - start

print(f"TOTAL TIME: {elapsed:.3f} seconds")
print(f"Result: {result['overall_avg']:.2f} avg turns")
print()
print(f"At this rate:")
print(f"  500 pairs (1 chunk): {elapsed * 500:.1f} seconds ({elapsed * 500 / 60:.1f} minutes)")
print(f"  50,000 pairs: {elapsed * 50000 / 60:.1f} minutes ({elapsed * 50000 / 3600:.1f} hours)")
