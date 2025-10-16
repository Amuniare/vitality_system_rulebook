# cython: language_level=3, boundscheck=False, wraparound=False, cdivision=True

"""
Core combat calculations in pure C with no GIL.

This module contains the hot path code that runs thousands of times per simulation.
"""

from src.dice cimport roll_d20_c, roll_3d6_exploding_c
from src.models cimport (
    Character, Attack, Upgrade, Limit,
    get_accuracy, get_avoidance, get_damage, get_durability,
    POWER_ATTACK, ACCURATE_ATTACK, RELIABLE_ACCURACY, ARMOR_PIERCING,
    BRUTAL, HIGH_IMPACT, BLEED
)


cdef int calculate_hit(Character* attacker, Character* defender, Attack* attack) nogil:
    """
    Calculate if an attack hits.

    Args:
        attacker: Attacking character
        defender: Defending character
        attack: Attack being used

    Returns: 1 if hit, 0 if miss
    """
    cdef int accuracy = get_accuracy(attacker)
    cdef int avoidance = get_avoidance(defender)

    # Apply attack modifiers
    if attack.upgrades & POWER_ATTACK:
        accuracy -= 2
    if attack.upgrades & ACCURATE_ATTACK:
        accuracy += 2
    if attack.upgrades & RELIABLE_ACCURACY:
        accuracy += 1

    # Roll to hit
    cdef int roll = roll_d20_c()
    cdef int total = accuracy + roll

    return 1 if total >= avoidance else 0


cdef int calculate_damage(Character* attacker, Character* defender, Attack* attack) nogil:
    """
    Calculate damage dealt by an attack.

    Args:
        attacker: Attacking character
        defender: Defending character
        attack: Attack being used

    Returns: Damage amount (can be 0)
    """
    cdef int base_damage = get_damage(attacker)
    cdef int durability = get_durability(defender)

    # Apply attack modifiers to base damage
    if attack.upgrades & POWER_ATTACK:
        base_damage += 2
    if attack.upgrades & BRUTAL:
        base_damage += 1
    if attack.upgrades & HIGH_IMPACT:
        base_damage += 1

    # Roll damage dice
    cdef int damage_roll = roll_3d6_exploding_c()
    cdef int total_damage = base_damage + damage_roll

    # Apply armor piercing to durability
    if attack.upgrades & ARMOR_PIERCING:
        durability = durability // 2  # Integer division in C

    # Final damage calculation
    cdef int final_damage = total_damage - durability

    return final_damage if final_damage > 0 else 0


# Python wrappers for testing
def calculate_hit_py(attacker_dict, defender_dict, attack_dict):
    """Python wrapper for calculate_hit (for testing)."""
    cdef Character attacker, defender
    cdef Attack attack

    # Convert dicts to structs
    attacker.focus = attacker_dict['focus']
    attacker.power = attacker_dict['power']
    attacker.mobility = attacker_dict['mobility']
    attacker.endurance = attacker_dict['endurance']
    attacker.tier = attacker_dict['tier']
    attacker.max_hp = attacker_dict.get('max_hp', 100)

    defender.focus = defender_dict['focus']
    defender.power = defender_dict['power']
    defender.mobility = defender_dict['mobility']
    defender.endurance = defender_dict['endurance']
    defender.tier = defender_dict['tier']
    defender.max_hp = defender_dict.get('max_hp', 100)

    attack.attack_type = attack_dict['attack_type']
    attack.upgrades = attack_dict['upgrades']
    attack.limits = attack_dict['limits']
    attack.cost = attack_dict.get('cost', 0)

    return calculate_hit(&attacker, &defender, &attack)


def calculate_damage_py(attacker_dict, defender_dict, attack_dict):
    """Python wrapper for calculate_damage (for testing)."""
    cdef Character attacker, defender
    cdef Attack attack

    # Convert dicts to structs
    attacker.focus = attacker_dict['focus']
    attacker.power = attacker_dict['power']
    attacker.mobility = attacker_dict['mobility']
    attacker.endurance = attacker_dict['endurance']
    attacker.tier = attacker_dict['tier']
    attacker.max_hp = attacker_dict.get('max_hp', 100)

    defender.focus = defender_dict['focus']
    defender.power = defender_dict['power']
    defender.mobility = defender_dict['mobility']
    defender.endurance = defender_dict['endurance']
    defender.tier = defender_dict['tier']
    defender.max_hp = defender_dict.get('max_hp', 100)

    attack.attack_type = attack_dict['attack_type']
    attack.upgrades = attack_dict['upgrades']
    attack.limits = attack_dict['limits']
    attack.cost = attack_dict.get('cost', 0)

    return calculate_damage(&attacker, &defender, &attack)
