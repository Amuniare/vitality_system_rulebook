# cython: language_level=3, boundscheck=False, wraparound=False, cdivision=True

"""
Parallel combat simulation using Cython prange (no GIL, true multi-core).
"""

from libc.stdlib cimport malloc, free
from cython.parallel cimport prange

from src.dice cimport roll_d20_c, roll_3d6_exploding_c
from src.models cimport (
    Character, Attack, Upgrade, Limit,
    get_accuracy, get_avoidance, get_damage, get_durability,
    POWER_ATTACK, ACCURATE_ATTACK, RELIABLE_ACCURACY, ARMOR_PIERCING,
    BRUTAL, HIGH_IMPACT, BLEED, CULLING_STRIKE, FINISHING_BLOW_1, FINISHING_BLOW_2
)


cdef struct CombatState:
    int turn_number
    int attacker_hp
    int defender_hp
    int bleed_stacks
    int attacker_won  # 1 if attacker won, 0 if defender won or timeout


cdef int calculate_hit_internal(Character* attacker, Character* defender, Attack* attack) noexcept nogil:
    """
    Calculate if an attack hits (internal version with all modifiers).

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

    # Natural 20 always hits
    if roll == 20:
        return 1

    # Natural 1 always misses
    if roll == 1:
        return 0

    return 1 if total >= avoidance else 0


cdef int calculate_damage_internal(Character* attacker, Character* defender, Attack* attack, int defender_current_hp, int defender_max_hp) noexcept nogil:
    """
    Calculate damage dealt by an attack (internal version with all modifiers).

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

    # Culling Strike bonus against wounded enemies
    if attack.upgrades & CULLING_STRIKE:
        if defender_current_hp <= defender_max_hp // 2:  # Bloodied
            base_damage += 2

    # Finishing Blow bonuses
    if attack.upgrades & FINISHING_BLOW_1:
        if defender_current_hp <= defender_max_hp // 4:  # Under 25% HP
            base_damage += 3
    if attack.upgrades & FINISHING_BLOW_2:
        if defender_current_hp <= defender_max_hp // 4:  # Under 25% HP
            base_damage += 5

    # Roll damage dice
    cdef int damage_roll = roll_3d6_exploding_c()
    cdef int total_damage = base_damage + damage_roll

    # Apply armor piercing to durability
    if attack.upgrades & ARMOR_PIERCING:
        durability = durability // 2

    # Final damage calculation
    cdef int final_damage = total_damage - durability

    return final_damage if final_damage > 0 else 0


cdef int simulate_combat_c(Character* attacker, Character* defender, Attack* attack, int max_turns, int enemy_hp) noexcept nogil:
    """
    Simulate full combat until victory or timeout.

    Args:
        attacker: Attacking character
        defender: Defending character (stats for calculations)
        attack: Attack being used
        max_turns: Maximum number of turns before timeout
        enemy_hp: Starting HP of the enemy

    Returns: Number of turns to victory (or -1 if timeout/defeat)
    """
    cdef CombatState state
    state.turn_number = 0
    state.attacker_hp = attacker.max_hp
    state.defender_hp = enemy_hp
    state.bleed_stacks = 0
    state.attacker_won = 0

    cdef int hit, damage

    while state.defender_hp > 0 and state.turn_number < max_turns:
        state.turn_number += 1

        # Attacker's turn
        hit = calculate_hit_internal(attacker, defender, attack)
        if hit:
            damage = calculate_damage_internal(attacker, defender, attack, state.defender_hp, enemy_hp)
            state.defender_hp -= damage

            # Check for bleed
            if attack.upgrades & BLEED:
                state.bleed_stacks += 1

        # Apply bleed damage at end of turn
        if state.bleed_stacks > 0:
            state.defender_hp -= state.bleed_stacks
            # Bleed decays by half each turn (rounded down)
            state.bleed_stacks = state.bleed_stacks // 2

        # Check if enemy defeated
        if state.defender_hp <= 0:
            state.attacker_won = 1
            break

    # Return turns to victory, or -1 if timeout
    if state.attacker_won:
        return state.turn_number
    else:
        return -1


def simulate_combat(attacker_dict, defender_dict, attack_dict, int max_turns=100, int enemy_hp=100):
    """
    Simulate a single combat (Python wrapper).

    Args:
        attacker_dict: Dictionary with attacker stats
        defender_dict: Dictionary with defender stats
        attack_dict: Dictionary with attack properties
        max_turns: Maximum turns before timeout
        enemy_hp: Starting HP of enemy

    Returns: Number of turns to victory (or -1 if timeout)
    """
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

    return simulate_combat_c(&attacker, &defender, &attack, max_turns, enemy_hp)


def simulate_many_combats(attacker_dict, defender_dict, attack_dict,
                         int num_simulations, int max_turns=100, int enemy_hp=100,
                         int num_threads=8):
    """
    Simulate many combats in parallel with no GIL.

    Args:
        attacker_dict: Dictionary with attacker stats
        defender_dict: Dictionary with defender stats
        attack_dict: Dictionary with attack properties
        num_simulations: Number of simulations to run
        max_turns: Maximum turns per combat
        enemy_hp: Starting HP of enemy
        num_threads: Number of parallel threads

    Returns: List of turn counts (-1 for timeouts)
    """
    # Convert Python dicts to C structs (do this once outside nogil)
    cdef Character attacker, defender
    cdef Attack attack

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

    # Allocate results array
    cdef int* results = <int*>malloc(num_simulations * sizeof(int))
    if results == NULL:
        raise MemoryError("Could not allocate memory for simulation results")

    cdef int i

    try:
        # Parallel loop with NO GIL - true multi-core processing
        with nogil:
            for i in prange(num_simulations, schedule='dynamic', num_threads=num_threads):
                results[i] = simulate_combat_c(&attacker, &defender, &attack, max_turns, enemy_hp)

        # Convert back to Python list
        return [results[i] for i in range(num_simulations)]
    finally:
        free(results)


def simulate_combat_stats(attacker_dict, defender_dict, attack_dict,
                         int num_simulations=1000, int max_turns=100, int enemy_hp=100):
    """
    Run simulations and return statistics.

    Returns: Dictionary with avg_turns, min_turns, max_turns, success_rate
    """
    results = simulate_many_combats(attacker_dict, defender_dict, attack_dict,
                                   num_simulations, max_turns, enemy_hp)

    # Filter out timeouts (-1)
    successes = [r for r in results if r > 0]

    if not successes:
        return {
            'avg_turns': -1,
            'min_turns': -1,
            'max_turns': -1,
            'success_rate': 0.0,
            'num_simulations': num_simulations
        }

    return {
        'avg_turns': sum(successes) / len(successes),
        'min_turns': min(successes),
        'max_turns': max(successes),
        'success_rate': len(successes) / num_simulations,
        'num_simulations': num_simulations
    }
