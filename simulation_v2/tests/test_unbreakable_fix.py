"""Test script to verify unbreakable limit fix"""
import sys
sys.path.insert(0, '..')

from src.models import Character, AttackBuild
from src.combat import make_attack

def test_unbreakable_tracking():
    """Test that was_hit_no_damage_last_turn is set correctly"""

    # Create characters with high durability for attacker (so hits deal 0 damage)
    # Attacker has high endurance = high durability (will absorb damage)
    # Durability = 5 + tier + endurance, so 5 + 4 + 15 = 24 (will absorb max damage)
    # Defender has high focus but very low mobility (easy to hit) and low power (low damage)
    attacker = Character(focus=0, power=2, mobility=0, endurance=15, tier=4)  # Durability = 24
    defender = Character(focus=5, power=0, mobility=0, endurance=0, tier=4)  # Max damage = 4+18 = 22

    # Create a basic attack (no upgrades/limits)
    basic_attack = AttackBuild('melee_dg', [], [])

    # Initialize combat_state
    combat_state = {
        'was_hit_last_turn': False,
        'was_damaged_last_turn': False,
        'was_hit_no_damage_last_turn': False,
        'all_attacks_missed_last_turn': False,
    }

    print("Testing unbreakable tracking fix...")
    print("=" * 60)

    # Test 1: Make an attack (defender attacks attacker with high durability)
    print("\nTest 1: Attack that hits but deals 0 damage (high durability)")
    damage, conditions, did_hit = make_attack(defender, attacker, basic_attack,
                                             log_file=None, attacker_hp=100, attacker_max_hp=100)

    print(f"  Damage: {damage}")
    print(f"  Did hit: {did_hit}")

    # Simulate combat_state tracking (from simulation.py logic)
    attacks_made = 1
    defender_hits = 1 if did_hit else 0
    total_defender_damage = damage

    if attacks_made > 0:
        combat_state['was_attacked_last_turn'] = True
        if defender_hits > 0:
            combat_state['was_hit_last_turn'] = True
            combat_state['all_attacks_missed_last_turn'] = False
            if total_defender_damage > 0:
                combat_state['was_damaged_last_turn'] = True
                combat_state['was_hit_no_damage_last_turn'] = False
            else:
                combat_state['was_damaged_last_turn'] = False
                combat_state['was_hit_no_damage_last_turn'] = True  # THIS IS THE FIX!
        else:
            combat_state['was_hit_last_turn'] = False
            combat_state['was_damaged_last_turn'] = False
            combat_state['all_attacks_missed_last_turn'] = True
            combat_state['was_hit_no_damage_last_turn'] = False

    print(f"\n  Combat State:")
    print(f"    was_hit_last_turn: {combat_state['was_hit_last_turn']}")
    print(f"    was_damaged_last_turn: {combat_state['was_damaged_last_turn']}")
    print(f"    was_hit_no_damage_last_turn: {combat_state['was_hit_no_damage_last_turn']}")
    print(f"    all_attacks_missed_last_turn: {combat_state['all_attacks_missed_last_turn']}")

    # Test unbreakable limit activation
    print("\n\nTest 2: Unbreakable limit should activate after hit-with-no-damage")
    unbreakable_attack = AttackBuild('melee_dg', [], ['unbreakable'])

    # This should succeed because was_hit_no_damage_last_turn is True
    damage2, conditions2, did_hit2 = make_attack(attacker, defender, unbreakable_attack,
                                                 log_file=None, turn_number=2,
                                                 attacker_hp=100, attacker_max_hp=100,
                                                 combat_state=combat_state)

    print(f"  Damage: {damage2}")
    print(f"  Conditions: {conditions2}")
    print(f"  Did hit: {did_hit2}")

    if 'basic_attack' not in conditions2:
        print("\n  SUCCESS! Unbreakable activated (not basic attack)")
        return True
    else:
        print("\n  FAILED! Unbreakable should have activated but fell back to basic attack")
        return False

if __name__ == '__main__':
    success = test_unbreakable_tracking()
    sys.exit(0 if success else 1)
