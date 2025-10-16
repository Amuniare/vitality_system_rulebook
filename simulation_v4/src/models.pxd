# cython: language_level=3

"""
Cython header file (.pxd) for data structures.

This defines C structs and functions that can be shared across modules.
"""

# Character struct (pure C)
cdef struct Character:
    int focus
    int power
    int mobility
    int endurance
    int tier
    int max_hp


# Attack struct (pure C)
cdef struct Attack:
    int attack_type      # 0=melee_dg, 1=melee_ac, 2=ranged, 3=area, 4=direct_damage
    unsigned int upgrades  # Bit flags for upgrades (up to 32 upgrades)
    unsigned int limits    # Bit flags for limits (up to 32 limits)
    int cost             # Point cost


# Upgrade bit flags
cdef enum Upgrade:
    POWER_ATTACK = 1 << 0
    ACCURATE_ATTACK = 1 << 1
    RELIABLE_ACCURACY = 1 << 2
    ARMOR_PIERCING = 1 << 3
    BRUTAL = 1 << 4
    HIGH_IMPACT = 1 << 5
    BLEED = 1 << 6
    CULLING_STRIKE = 1 << 7
    FINISHING_BLOW_1 = 1 << 8
    FINISHING_BLOW_2 = 1 << 9
    BOSS_SLAYER_ACC = 1 << 10
    BOSS_SLAYER_DMG = 1 << 11
    MINION_SLAYER_ACC = 1 << 12
    MINION_SLAYER_DMG = 1 << 13
    ELITE_SLAYER_ACC = 1 << 14
    ELITE_SLAYER_DMG = 1 << 15
    CAPTAIN_SLAYER_ACC = 1 << 16
    CAPTAIN_SLAYER_DMG = 1 << 17
    CHANNELED = 1 << 18
    SPLINTER = 1 << 19
    RICOCHET = 1 << 20
    OVERHIT = 1 << 21
    EXPLOSIVE_CRITICAL = 1 << 22
    CRITICAL_ACCURACY = 1 << 23
    CRITICAL_EFFECT = 1 << 24
    EXTRA_ATTACK = 1 << 25
    QUICK_STRIKES = 1 << 26
    BARRAGE = 1 << 27


# Limit bit flags
cdef enum Limit:
    UNRELIABLE_1 = 1 << 0
    UNRELIABLE_2 = 1 << 1
    UNRELIABLE_3 = 1 << 2
    CHARGE_UP = 1 << 3
    CHARGE_UP_2 = 1 << 4
    CHARGES_1 = 1 << 5
    CHARGES_2 = 1 << 6
    NEAR_DEATH = 1 << 7
    BLOODIED = 1 << 8
    RELENTLESS = 1 << 9


# Accessor functions (defined in models.pyx, implemented as inline)
# noexcept means these functions never raise Python exceptions
cdef int get_accuracy(Character* char) noexcept nogil
cdef int get_avoidance(Character* char) noexcept nogil
cdef int get_damage(Character* char) noexcept nogil
cdef int get_durability(Character* char) noexcept nogil
