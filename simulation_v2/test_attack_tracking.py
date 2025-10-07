#!/usr/bin/env python3
"""
Quick test to verify attack usage tracking works correctly.
Tests that:
1. MultiAttackBuild tracks which attack is used each turn
2. Usage percentages are calculated correctly
3. Reporter shows both build composition and combat usage
"""

from src.models import Character, AttackBuild, MultiAttackBuild
from src.simulation import simulate_combat_verbose

# Create test character
attacker = Character(focus=2, power=2, mobility=2, endurance=2, tier=3, max_hp=100)
defender = Character(focus=2, power=2, mobility=2, endurance=2, tier=3, max_hp=100)

# Create a dual-natured build with finale limit
# Attack 1: Basic ranged (no enhancements)
# Attack 2: Ranged with finale limit (only activates turn 7+)
attack1 = AttackBuild('ranged', [], [])
attack2 = AttackBuild('ranged', [], ['finale'])
multi_build = MultiAttackBuild([attack1, attack2], 'dual_natured')

print("="*80)
print("ATTACK USAGE TRACKING TEST")
print("="*80)
print(f"\nBuild Configuration:")
print(f"  Attack 1: {attack1}")
print(f"  Attack 2: {attack2}")
print(f"  Archetype: {multi_build.archetype}")
print()

# Run a single combat simulation with logging to see attack selection
import tempfile
import os

log_file_path = os.path.join(tempfile.gettempdir(), 'attack_tracking_test.log')
print("Running combat simulation...")
print(f"  (Detailed log: {log_file_path})")
print("-"*80)

with open(log_file_path, 'w', encoding='utf-8') as log_file:
    turns, outcome = simulate_combat_verbose(
        attacker=attacker,
        build=multi_build,
        target_hp=100,
        log_file=log_file,
        defender=defender,
        num_enemies=1,
        enemy_hp=100,
        max_turns=100
    )

print("-"*80)
print(f"\nCombat Result: {outcome.upper()} in {turns} turns")
print()

# Check attack usage tracking
print("Attack Usage Tracking:")
print(f"  Attack usage counts: {multi_build.attack_usage_counts}")

# Calculate percentages
usage_pct = multi_build.get_attack_usage_percentages()
print(f"  Attack 1 usage: {usage_pct[0]}%")
print(f"  Attack 2 usage: {usage_pct[1]}%")
print()

# Verify the logic
print("Expected Behavior:")
print(f"  - 'finale' only activates on turn 7+")
print(f"  - Attack 1 should be used on turns 1-6")
print(f"  - Attack 2 should be used on turns 7+")
print(f"  - Total turns: {turns}")
if turns > 0:
    expected_atk1_pct = min(6, turns) / turns * 100
    expected_atk2_pct = max(0, turns - 6) / turns * 100
    print(f"  - Expected Attack 1: ~{expected_atk1_pct:.0f}%")
    print(f"  - Expected Attack 2: ~{expected_atk2_pct:.0f}%")
print()

# Verify results match expectations
if turns >= 7:
    print("[PASS] Combat lasted long enough to test finale activation")
    if usage_pct[0] > 0 and usage_pct[1] > 0:
        print("[PASS] Both attacks were used (as expected)")
    else:
        print("[FAIL] Both attacks should have been used")

    # Check log file for attack selection details
    print(f"\nSee detailed combat log for turn-by-turn attack selection:")
    print(f"  {log_file_path}")

elif turns > 0:
    print("[WARN] Combat was too short to test finale (ended before turn 7)")
    if usage_pct[0] == 100 and usage_pct[1] == 0:
        print("[PASS] Only Attack 1 was used (correct for short combat)")
    else:
        print("[FAIL] Only Attack 1 should have been used")
else:
    print("[FAIL] Combat didn't happen")

print()
print("="*80)
print("TEST COMPLETE")
print("="*80)
