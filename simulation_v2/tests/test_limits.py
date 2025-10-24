"""Quick test to verify charges and unreliable mechanics"""
import sys
sys.path.insert(0, 'c:\\Users\\Trent\\OneDrive\\Documents\\GitHub\\vitality_system_rulebook\\simulation')

from src.game_data import LIMITS
from src.models import Character, AttackBuild
from src.combat import make_attack

# Test charges_1
print("=== Testing Charges 1 ===")
charges_1_limit = LIMITS['charges_1']
print(f"Charges 1: cost={charges_1_limit.cost}, damage_bonus={charges_1_limit.damage_bonus}, dc={charges_1_limit.dc}")

# Test unreliables
print("\n=== Testing Unreliables ===")
for name in ['unreliable_1', 'unreliable_2', 'unreliable_3']:
    limit = LIMITS[name]
    print(f"{name}: cost={limit.cost}, damage_bonus={limit.damage_bonus}, dc={limit.dc}")

# Test actual combat with charges_1
print("\n=== Combat Test: charges_1 ===")
attacker = Character(tier=4, focus=3, power=2, mobility=1, endurance=0, max_hp=100)
defender = Character(tier=4, focus=0, power=0, mobility=3, endurance=2, max_hp=100)

build = AttackBuild(attack_type='melee_ac', upgrades=[], limits=['charges_1'])
combat_state = {}

# First attack - should work and consume charge
damage1, conditions1, hit1 = make_attack(attacker, defender, build, log_file=None, combat_state=combat_state)
print(f"Attack 1: damage={damage1}, hit={hit1}, charges_used={combat_state.get('charges_used', {})}")

# Second attack - should fail (no charges left) and return basic_attack
damage2, conditions2, hit2 = make_attack(attacker, defender, build, log_file=None, combat_state=combat_state)
print(f"Attack 2: damage={damage2}, hit={hit2}, conditions={conditions2}, charges_used={combat_state.get('charges_used', {})}")

# Test actual combat with unreliable_1
print("\n=== Combat Test: unreliable_1 (10 attempts) ===")
successes = 0
failures = 0
for i in range(10):
    build = AttackBuild(attack_type='melee_ac', upgrades=[], limits=['unreliable_1'])
    damage, conditions, hit = make_attack(attacker, defender, build, log_file=None, combat_state={})
    if damage > 0 or hit:
        successes += 1
    else:
        failures += 1

print(f"Unreliable 1: {successes} successes, {failures} failures (expected ~80% success)")
