# cython: language_level=3, boundscheck=False, wraparound=False, cdivision=True

"""
Character and attack data structures with fast accessor functions.
"""

# Import the struct definitions
from src.models cimport Character, Attack, Upgrade, Limit

# Inline accessor functions for Character stats
cdef inline int get_accuracy(Character* char) noexcept nogil:
    """Calculate accuracy stat from character."""
    return 10 + char.tier + char.focus


cdef inline int get_avoidance(Character* char) noexcept nogil:
    """Calculate avoidance stat from character."""
    return 10 + char.tier + char.mobility


cdef inline int get_damage(Character* char) noexcept nogil:
    """Calculate damage stat from character."""
    return char.tier + char.power


cdef inline int get_durability(Character* char) noexcept nogil:
    """Calculate durability stat from character."""
    return 5 + char.tier + char.endurance


# Python wrappers for creating structs from dicts
def create_character(int focus, int power, int mobility, int endurance, int tier, int max_hp=100):
    """
    Create a Character struct from Python integers.

    Returns: Dictionary representation (for now, until we return structs directly)
    """
    cdef Character char
    char.focus = focus
    char.power = power
    char.mobility = mobility
    char.endurance = endurance
    char.tier = tier
    char.max_hp = max_hp

    return {
        'focus': char.focus,
        'power': char.power,
        'mobility': char.mobility,
        'endurance': char.endurance,
        'tier': char.tier,
        'max_hp': char.max_hp,
        'accuracy': get_accuracy(&char),
        'avoidance': get_avoidance(&char),
        'damage': get_damage(&char),
        'durability': get_durability(&char),
    }


def create_attack(str attack_type, list upgrades, list limits):
    """
    Create an Attack struct from Python lists.

    Args:
        attack_type: String like "melee_dg", "area", etc.
        upgrades: List of upgrade names
        limits: List of limit names

    Returns: Dictionary representation
    """
    cdef Attack attack
    cdef unsigned int upgrade_flags = 0
    cdef unsigned int limit_flags = 0

    # Map attack type string to enum
    type_map = {
        "melee_dg": 0,
        "melee_ac": 1,
        "ranged": 2,
        "area": 3,
        "direct_damage": 4,
        "direct_area_damage": 5,
    }
    attack.attack_type = type_map.get(attack_type, 0)

    # Convert upgrade names to bit flags
    upgrade_map = {
        "power_attack": POWER_ATTACK,
        "accurate_attack": ACCURATE_ATTACK,
        "reliable_accuracy": RELIABLE_ACCURACY,
        "armor_piercing": ARMOR_PIERCING,
        "brutal": BRUTAL,
        "high_impact": HIGH_IMPACT,
        "bleed": BLEED,
        "culling_strike": CULLING_STRIKE,
        "finishing_blow_1": FINISHING_BLOW_1,
        "finishing_blow_2": FINISHING_BLOW_2,
        "boss_slayer_acc": BOSS_SLAYER_ACC,
        "boss_slayer_dmg": BOSS_SLAYER_DMG,
        "minion_slayer_acc": MINION_SLAYER_ACC,
        "minion_slayer_dmg": MINION_SLAYER_DMG,
        "elite_slayer_acc": ELITE_SLAYER_ACC,
        "elite_slayer_dmg": ELITE_SLAYER_DMG,
        "captain_slayer_acc": CAPTAIN_SLAYER_ACC,
        "captain_slayer_dmg": CAPTAIN_SLAYER_DMG,
        "channeled": CHANNELED,
        "splinter": SPLINTER,
        "ricochet": RICOCHET,
        "overhit": OVERHIT,
        "explosive_critical": EXPLOSIVE_CRITICAL,
        "critical_accuracy": CRITICAL_ACCURACY,
        "critical_effect": CRITICAL_EFFECT,
        "extra_attack": EXTRA_ATTACK,
        "quick_strikes": QUICK_STRIKES,
        "barrage": BARRAGE,
    }

    for upgrade_name in upgrades:
        if upgrade_name in upgrade_map:
            upgrade_flags |= upgrade_map[upgrade_name]

    # Convert limit names to bit flags
    limit_map = {
        "unreliable_1": UNRELIABLE_1,
        "unreliable_2": UNRELIABLE_2,
        "unreliable_3": UNRELIABLE_3,
        "charge_up": CHARGE_UP,
        "charge_up_2": CHARGE_UP_2,
        "charges_1": CHARGES_1,
        "charges_2": CHARGES_2,
        "near_death": NEAR_DEATH,
        "bloodied": BLOODIED,
        "relentless": RELENTLESS,
    }

    for limit_name in limits:
        if limit_name in limit_map:
            limit_flags |= limit_map[limit_name]

    attack.upgrades = upgrade_flags
    attack.limits = limit_flags
    attack.cost = len(upgrades) - len(limits)  # Simplified cost

    return {
        'attack_type': attack.attack_type,
        'upgrades': attack.upgrades,
        'limits': attack.limits,
        'cost': attack.cost,
    }
