# cython: language_level=3, boundscheck=False, wraparound=False, cdivision=True

"""
Attack scoring system compiled to C for maximum performance.
"""

from src.models cimport (
    Attack, Upgrade,
    POWER_ATTACK, ACCURATE_ATTACK, RELIABLE_ACCURACY, ARMOR_PIERCING,
    BRUTAL, HIGH_IMPACT, BLEED, CULLING_STRIKE, FINISHING_BLOW_1, FINISHING_BLOW_2
)


cdef struct AttackCharacteristics:
    # Attack type flags
    unsigned char is_aoe
    unsigned char is_direct_damage
    unsigned char is_melee
    unsigned char is_ranged

    # Upgrade flags (for quick checks)
    unsigned char has_power_attack
    unsigned char has_accurate_attack
    unsigned char has_armor_piercing
    unsigned char has_bleed
    unsigned char has_culling_strike
    unsigned char has_finishing_blow

    # Scoring bonuses
    float accuracy_bonus
    float damage_bonus
    float multi_target_bonus
    float single_target_bonus


cdef void extract_attack_characteristics(Attack* attack, AttackCharacteristics* chars) noexcept nogil:
    """
    Extract characteristics from attack for fast scoring.
    """
    # Attack type
    chars.is_aoe = 1 if attack.attack_type == 3 else 0  # 3 = area
    chars.is_direct_damage = 1 if attack.attack_type >= 4 else 0  # 4+ = direct damage
    chars.is_melee = 1 if attack.attack_type <= 1 else 0  # 0-1 = melee
    chars.is_ranged = 1 if attack.attack_type == 2 else 0  # 2 = ranged

    # Upgrade flags
    chars.has_power_attack = 1 if attack.upgrades & POWER_ATTACK else 0
    chars.has_accurate_attack = 1 if attack.upgrades & ACCURATE_ATTACK else 0
    chars.has_armor_piercing = 1 if attack.upgrades & ARMOR_PIERCING else 0
    chars.has_bleed = 1 if attack.upgrades & BLEED else 0
    chars.has_culling_strike = 1 if attack.upgrades & CULLING_STRIKE else 0
    chars.has_finishing_blow = 1 if (attack.upgrades & FINISHING_BLOW_1) or (attack.upgrades & FINISHING_BLOW_2) else 0

    # Calculate bonuses
    chars.accuracy_bonus = 0.0
    if chars.has_accurate_attack:
        chars.accuracy_bonus += 2.0
    if chars.has_power_attack:
        chars.accuracy_bonus -= 2.0

    chars.damage_bonus = 0.0
    if chars.has_power_attack:
        chars.damage_bonus += 2.0
    if chars.has_armor_piercing:
        chars.damage_bonus += 1.5  # Approximate bonus
    if attack.upgrades & BRUTAL:
        chars.damage_bonus += 1.0
    if attack.upgrades & HIGH_IMPACT:
        chars.damage_bonus += 1.0

    chars.multi_target_bonus = 10.0 if chars.is_aoe else 0.0
    chars.single_target_bonus = 5.0 if not chars.is_aoe else 0.0


cdef float score_attack_c(AttackCharacteristics* attack_chars,
                         int num_enemies_alive,
                         float avg_enemy_hp_percent,
                         int num_wounded_enemies,
                         unsigned char enemy_has_high_avoidance,
                         unsigned char enemy_has_high_durability) noexcept nogil:
    """
    Score attack for current combat situation (pure C, no GIL).

    Args:
        attack_chars: Pre-computed attack characteristics
        num_enemies_alive: Number of enemies still alive
        avg_enemy_hp_percent: Average HP of enemies as percentage (0.0-1.0)
        num_wounded_enemies: Number of enemies below 50% HP
        enemy_has_high_avoidance: 1 if enemies have high avoidance
        enemy_has_high_durability: 1 if enemies have high durability

    Returns: Score as float (higher is better)
    """
    cdef float score = 0.0

    # 1. Multi-target vs single-target scoring
    if num_enemies_alive >= 5:
        # Many enemies - strongly prefer AOE
        score += 100.0 if attack_chars.is_aoe else -50.0
    elif num_enemies_alive >= 3:
        # Several enemies - prefer AOE
        score += 50.0 if attack_chars.is_aoe else 0.0
    elif num_enemies_alive == 2:
        # Two enemies - slight AOE preference
        score += 20.0 if attack_chars.is_aoe else 10.0
    else:
        # Single enemy - prefer single-target
        score += attack_chars.single_target_bonus

    # 2. Accuracy vs damage trade-off
    if enemy_has_high_avoidance:
        # High avoidance enemy - prefer accuracy
        score += attack_chars.accuracy_bonus * 5.0
    else:
        # Normal/low avoidance - prefer damage
        score += attack_chars.damage_bonus * 3.0

    # 3. Armor piercing vs high durability
    if enemy_has_high_durability:
        if attack_chars.has_armor_piercing:
            score += 30.0

    # 4. Bleed scoring (better against high HP enemies)
    if attack_chars.has_bleed:
        if avg_enemy_hp_percent > 0.7:
            # High HP enemies - bleed is valuable
            score += 25.0
        elif avg_enemy_hp_percent > 0.4:
            # Medium HP - bleed is okay
            score += 10.0

    # 5. Finishing blow scoring (better against wounded enemies)
    if attack_chars.has_finishing_blow:
        if num_wounded_enemies > 0:
            # Wounded enemies present - finishing blow is great
            score += 40.0 * (num_wounded_enemies / <float>num_enemies_alive)
        if avg_enemy_hp_percent < 0.3:
            # Low HP enemies - finishing blow is excellent
            score += 50.0

    # 6. Culling strike scoring (better against wounded enemies)
    if attack_chars.has_culling_strike:
        if num_wounded_enemies > 0:
            score += 25.0 * (num_wounded_enemies / <float>num_enemies_alive)

    # 7. Direct damage reliability
    if attack_chars.is_direct_damage:
        # Direct damage bypasses hit rolls - valuable against high avoidance
        if enemy_has_high_avoidance:
            score += 40.0
        else:
            score += 15.0

    return score


def score_attack_py(attack_dict, situation_dict):
    """
    Score an attack for a given situation (Python wrapper).

    Args:
        attack_dict: Dictionary with attack properties
        situation_dict: Dictionary with combat situation info

    Returns: Score (float)
    """
    cdef Attack attack
    cdef AttackCharacteristics chars

    # Convert attack dict to struct
    attack.attack_type = attack_dict['attack_type']
    attack.upgrades = attack_dict['upgrades']
    attack.limits = attack_dict['limits']
    attack.cost = attack_dict.get('cost', 0)

    # Extract characteristics
    extract_attack_characteristics(&attack, &chars)

    # Get situation info
    cdef int num_enemies_alive = situation_dict.get('num_enemies_alive', 1)
    cdef float avg_enemy_hp_percent = situation_dict.get('avg_enemy_hp_percent', 1.0)
    cdef int num_wounded_enemies = situation_dict.get('num_wounded_enemies', 0)
    cdef unsigned char enemy_has_high_avoidance = situation_dict.get('enemy_has_high_avoidance', 0)
    cdef unsigned char enemy_has_high_durability = situation_dict.get('enemy_has_high_durability', 0)

    return score_attack_c(&chars, num_enemies_alive, avg_enemy_hp_percent,
                         num_wounded_enemies, enemy_has_high_avoidance,
                         enemy_has_high_durability)


def compare_attacks(attack1_dict, attack2_dict, situation_dict):
    """
    Compare two attacks for a given situation.

    Returns: Tuple of (score1, score2, best_attack_index)
    """
    score1 = score_attack_py(attack1_dict, situation_dict)
    score2 = score_attack_py(attack2_dict, situation_dict)

    best_index = 0 if score1 >= score2 else 1

    return (score1, score2, best_index)


def score_many_attacks(attacks_list, situation_dict):
    """
    Score multiple attacks for a situation and return sorted by score.

    Returns: List of tuples (score, attack_index) sorted by score (descending)
    """
    scores = []
    for i, attack_dict in enumerate(attacks_list):
        score = score_attack_py(attack_dict, situation_dict)
        scores.append((score, i))

    # Sort by score descending
    scores.sort(reverse=True)
    return scores
