"""
Test to verify charge_up/charge_up_2 work correctly in dual_natured archetype after bug fix.
"""

from src.models import Character, AttackBuild, MultiAttackBuild
from src.simulation import simulate_combat_verbose

# Create test character
attacker = Character(focus=3, power=3, mobility=2, endurance=2, tier=4)
defender = Character(focus=2, power=2, mobility=2, endurance=2, tier=4)

print("="*60)
print("TEST 1: Dual Natured with charge_up (should charge)")
print("="*60)

# Create dual_natured build with charge_up
primary = AttackBuild('melee_ac', upgrades=['power_attack'], limits=['charge_up'])
fallback = AttackBuild('melee_ac', upgrades=[], limits=[])
build = MultiAttackBuild([primary, fallback], 'dual_natured', fallback_type='melee_ac', tier_bonus=4)

# Run simulation with logging
with open('test_charge_output.txt', 'w') as log:
    turns, outcome = simulate_combat_verbose(
        attacker, build, 100, log_file=log, defender=defender,
        num_enemies=1, enemy_hp=100, archetype='dual_natured'
    )

print(f"\nResult: {outcome} in {turns} turns")
print("\nChecking log for charging behavior...")

# Check log for charging
with open('test_charge_output.txt', 'r') as log:
    log_content = log.read()

    # Look for charge indicators
    charge_count = log_content.count("CHARGING UP instead of attacking")
    charge_needed_count = log_content.count("Primary needs to charge")

    print(f"  Found {charge_count} 'CHARGING UP' messages")
    print(f"  Found {charge_needed_count} 'Primary needs to charge' messages")

    if charge_count > 0 or charge_needed_count > 0:
        print("  [PASS] Charging is working!")
    else:
        print("  [FAIL] No charging detected - build is broken!")

print("\n" + "="*60)
print("TEST 2: Dual Natured with charge_up_2 (should charge twice)")
print("="*60)

# Create dual_natured build with charge_up_2
primary2 = AttackBuild('melee_ac', upgrades=['power_attack'], limits=['charge_up_2'])
fallback2 = AttackBuild('melee_ac', upgrades=[], limits=[])
build2 = MultiAttackBuild([primary2, fallback2], 'dual_natured', fallback_type='melee_ac', tier_bonus=4)

# Run simulation with logging
with open('test_charge2_output.txt', 'w') as log:
    turns, outcome = simulate_combat_verbose(
        attacker, build2, 100, log_file=log, defender=defender,
        num_enemies=1, enemy_hp=100, archetype='dual_natured'
    )

print(f"\nResult: {outcome} in {turns} turns")
print("\nChecking log for charging behavior...")

# Check log for charging
with open('test_charge2_output.txt', 'r') as log:
    log_content = log.read()

    # Look for charge indicators
    charge_count = log_content.count("CHARGING UP instead of attacking")
    charge_needed_count = log_content.count("Primary needs to charge")

    print(f"  Found {charge_count} 'CHARGING UP' messages")
    print(f"  Found {charge_needed_count} 'Primary needs to charge' messages")

    if charge_count >= 2 or charge_needed_count >= 2:
        print("  [PASS] Charging twice is working!")
    elif charge_count > 0 or charge_needed_count > 0:
        print("  [PARTIAL] Some charging detected but not enough")
    else:
        print("  [FAIL] No charging detected - build is broken!")

print("\n" + "="*60)
print("TEST 3: Dual Natured with slaughter (should activate)")
print("="*60)

# Create dual_natured build with slaughter
primary3 = AttackBuild('melee_ac', upgrades=['power_attack'], limits=['slaughter'])
fallback3 = AttackBuild('melee_ac', upgrades=[], limits=[])
build3 = MultiAttackBuild([primary3, fallback3], 'dual_natured', fallback_type='melee_ac', tier_bonus=4)

# Run simulation against multiple weak enemies
with open('test_slaughter_output.txt', 'w') as log:
    turns, outcome = simulate_combat_verbose(
        attacker, build3, 100, log_file=log, defender=defender,
        num_enemies=4, enemy_hp=25, archetype='dual_natured'
    )

print(f"\nResult: {outcome} in {turns} turns")
print("\nChecking log for slaughter activation...")

# Check log for slaughter
with open('test_slaughter_output.txt', 'r') as log:
    log_content = log.read()

    # Look for defeated enemy indicators
    defeated_count = log_content.count("DEFEATED")
    primary_usage = log_content.count("Using primary attack")

    print(f"  Found {defeated_count} enemy defeats")
    print(f"  Found {primary_usage} primary attack uses")

    if primary_usage > 1:
        print("  [PASS] Primary used multiple times (slaughter likely activated)")
    else:
        print("  [WARNING] Primary only used once or not at all")

print("\n" + "="*60)
print("ALL TESTS COMPLETE")
print("="*60)
print("\nCheck test_charge_output.txt, test_charge2_output.txt, and test_slaughter_output.txt for detailed logs")
