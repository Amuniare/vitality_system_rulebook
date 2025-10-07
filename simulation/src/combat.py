"""
Combat mechanics and attack resolution for the Vitality System.
"""

import random
from typing import List, Tuple, Optional
from src.models import Character, AttackBuild
from src.game_data import ATTACK_TYPES, UPGRADES, LIMITS

# Pre-generate random number cache for performance
_DICE_CACHE_SIZE = 10000

# Try to use GPU-accelerated dice generation if available
try:
    import sys
    import os
    # Add simulation_v2 to path to import GPU module
    sim_v2_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'simulation_v2')
    if os.path.exists(sim_v2_path) and sim_v2_path not in sys.path:
        sys.path.insert(0, sim_v2_path)

    from src.combat_gpu import generate_dice_cache_gpu, is_gpu_available
    _d20_cache, _d6_cache = generate_dice_cache_gpu(_DICE_CACHE_SIZE)
    if is_gpu_available():
        print(f"Dice cache generated on GPU ({_DICE_CACHE_SIZE} rolls)")
except Exception as e:
    # Fall back to CPU generation
    _d20_cache = [random.randint(1, 20) for _ in range(_DICE_CACHE_SIZE)]
    _d6_cache = [random.randint(1, 6) for _ in range(_DICE_CACHE_SIZE)]

_cache_index = [0]  # Use list to allow modification in nested scope


def _get_cached_d20() -> int:
    """Get a cached d20 roll"""
    idx = _cache_index[0]
    _cache_index[0] = (idx + 1) % _DICE_CACHE_SIZE
    return _d20_cache[idx]


def _get_cached_d6() -> int:
    """Get a cached d6 roll"""
    idx = _cache_index[0]
    _cache_index[0] = (idx + 1) % _DICE_CACHE_SIZE
    return _d6_cache[idx]


def roll_d20() -> int:
    """Roll a single d20"""
    return _get_cached_d20()


def roll_3d6_exploding() -> Tuple[int, List[str]]:
    """Roll 3d6 with exploding 6s"""
    total = 0
    dice_detail = []
    for _ in range(3):
        die_total = 0
        die = _get_cached_d6()
        die_total += die
        dice_detail.append(str(die))
        while die == 6:
            die = _get_cached_d6()
            die_total += die
            dice_detail[-1] += f"+{die}"
        total += die_total
    return total, dice_detail


def can_activate_limit(limit_name: str, turn_number: int, attacker_hp: int, attacker_max_hp: int,
                       combat_state: dict, charge_history: List[bool] = None,
                       cooldown_history: dict = None) -> bool:
    """
    Check if a limit's conditions are met for activation on this turn.

    Args:
        limit_name: Name of the limit to check
        turn_number: Current turn number (1-indexed)
        attacker_hp: Current HP of the attacker
        attacker_max_hp: Maximum HP of the attacker
        combat_state: Dictionary tracking combat state (last turn events, charges, etc.)
        charge_history: List of charging actions (for charge_up limits)
        cooldown_history: Dictionary tracking cooldown timers

    Returns:
        True if the limit can activate, False otherwise
    """
    if limit_name not in LIMITS:
        return True  # Not a limit, allow activation

    if charge_history is None:
        charge_history = []
    if cooldown_history is None:
        cooldown_history = {}
    if combat_state is None:
        combat_state = {}

    # Initialize combat_state fields if missing
    if 'charges_used' not in combat_state:
        combat_state['charges_used'] = {}

    # Check HP-based limits
    if limit_name == 'near_death' and attacker_hp > 25:
        return False
    elif limit_name == 'bloodied' and attacker_hp > 50:
        return False
    elif limit_name == 'timid' and attacker_hp < attacker_max_hp:
        return False
    elif limit_name == 'attrition' and attacker_hp < 20:
        return False  # Not enough HP to pay cost

    # Check charge limits
    elif limit_name in ['charges_1', 'charges_2']:
        max_charges = 1 if limit_name == 'charges_1' else 2
        charges_used = combat_state['charges_used'].get(limit_name, 0)
        if charges_used >= max_charges:
            return False

    # Check turn-tracking limits
    elif limit_name == 'slaughter' and not combat_state.get('defeated_enemy_last_turn', False):
        return False
    elif limit_name == 'relentless' and not combat_state.get('dealt_damage_last_turn', False):
        return False
    elif limit_name == 'combo_move' and not combat_state.get('hit_same_target_last_turn', False):
        return False
    elif limit_name == 'revenge' and not combat_state.get('was_damaged_last_turn', False):
        return False
    elif limit_name == 'vengeful' and not combat_state.get('was_hit_last_turn', False):
        return False
    elif limit_name == 'untouchable' and not combat_state.get('all_attacks_missed_last_turn', False):
        return False
    elif limit_name == 'unbreakable' and not combat_state.get('was_hit_no_damage_last_turn', False):
        return False
    elif limit_name == 'passive' and combat_state.get('was_attacked_last_turn', False):
        return False
    elif limit_name == 'careful' and combat_state.get('was_damaged_last_turn', False):
        return False

    # Check turn-based limits
    elif limit_name == 'quickdraw' and turn_number > 1:
        return False  # Only first turn
    elif limit_name == 'patient' and turn_number < 5:
        return False  # Turn 5 or later
    elif limit_name == 'finale' and turn_number < 8:
        return False  # Turn 8 or later

    # Check charge_up limits
    elif limit_name == 'charge_up':
        # Need to have charged on previous turn
        if len(charge_history) < 1 or not charge_history[-1]:
            return False
    elif limit_name == 'charge_up_2':
        # Need to have charged on previous two turns
        if len(charge_history) < 2 or not (charge_history[-1] and charge_history[-2]):
            return False

    # Check cooldown limit
    elif limit_name == 'cooldown':
        # Check if still on cooldown
        last_used_turn = cooldown_history.get(limit_name, -999)
        if turn_number - last_used_turn <= 3:  # 3-turn cooldown
            return False

    # All checks passed
    return True


def roll_3d6_exploding_5_6() -> Tuple[int, List[str]]:
    """Roll 3d6 with exploding 5s and 6s"""
    total = 0
    dice_detail = []
    for _ in range(3):
        die_total = 0
        die = _get_cached_d6()
        die_total += die
        dice_detail.append(str(die))
        while die >= 5:
            die = _get_cached_d6()
            die_total += die
            dice_detail[-1] += f"+{die}"
        total += die_total
    return total, dice_detail


def make_aoe_attack(attacker: Character, defender: Character, build: AttackBuild,
                   targets: List[Tuple[int, dict]], log_file=None, turn_number: int = 1,
                   charge_history: List[bool] = None, cooldown_history: dict = None,
                   attacker_hp: int = None, attacker_max_hp: int = 100, combat_state: dict = None) -> Tuple[List[Tuple[int, int, List[str]]], int]:
    """Make an AOE attack against multiple targets with shared damage roll

    Returns:
        List of (target_index, damage_dealt, conditions_applied) for each target,
        and total damage dealt
    """
    attack_type = ATTACK_TYPES[build.attack_type]
    results = []
    total_damage = 0
    shared_dice_roll = None

    if log_file:
        log_file.write(f"  AOE Attack targeting {len(targets)} enemies\n")

    # Check charge up limits first (before doing any attack work)
    # Do a test attack to see if we need to charge instead
    test_damage, test_conditions = make_attack(attacker, defender, build, log_file=None,
                                             turn_number=turn_number, charge_history=charge_history,
                                             is_aoe=False, aoe_damage_roll=None, cooldown_history=cooldown_history,
                                             attacker_hp=attacker_hp, attacker_max_hp=attacker_max_hp, combat_state=combat_state)

    # If we got a charge condition, return it for all targets
    if test_damage == 0 and 'charge' in test_conditions:
        # Return charge condition for all targets
        for target_idx, enemy_data in targets:
            results.append((target_idx, 0, ['charge']))
        return results, 0

    # Pre-roll damage dice once for all targets (if not direct attack)
    if not attack_type.is_direct:
        use_high_impact = 'high_impact' in build.upgrades
        use_critical_effect = 'critical_effect' in build.upgrades

        if use_high_impact:
            shared_dice_roll = (15, ["15 (flat)"])
        elif use_critical_effect:
            shared_dice_roll = roll_3d6_exploding_5_6()
        else:
            shared_dice_roll = roll_3d6_exploding()

        if log_file:
            dice_damage, dice_detail = shared_dice_roll
            log_file.write(f"  Shared damage roll: {dice_detail} = {dice_damage}\n")

    for i, (target_idx, enemy_data) in enumerate(targets):
        if log_file:
            log_file.write(f"\n  --- Targeting Enemy {target_idx+1} ---\n")

        # All targets use the shared dice roll
        damage, conditions = make_attack(attacker, defender, build, log_file=log_file,
                                       turn_number=turn_number, charge_history=charge_history,
                                       is_aoe=True, aoe_damage_roll=shared_dice_roll, cooldown_history=cooldown_history,
                                       attacker_hp=attacker_hp, attacker_max_hp=attacker_max_hp, combat_state=combat_state)

        results.append((target_idx, damage, conditions))
        total_damage += damage

    return results, total_damage


def make_single_attack_damage(attacker: Character, defender: Character, build: AttackBuild,
                             log_file, turn_number: int = 1, charge_history: List[bool] = None, cooldown_history: dict = None,
                             attacker_hp: int = None, attacker_max_hp: int = 100, combat_state: dict = None) -> int:
    """Make a single attack and return only damage (for multi-attacks)"""
    damage, _ = make_attack(attacker, defender, build, allow_multi=False,
                           log_file=log_file, turn_number=turn_number, charge_history=charge_history,
                           is_aoe=False, aoe_damage_roll=None, cooldown_history=cooldown_history,
                           attacker_hp=attacker_hp, attacker_max_hp=attacker_max_hp, combat_state=combat_state)
    return damage


def make_attack(attacker: Character, defender: Character, build: AttackBuild,
               allow_multi: bool = True, log_file=None, turn_number: int = 1,
               charge_history: List[bool] = None, is_aoe: bool = False,
               aoe_damage_roll: Tuple[int, List[str]] = None, cooldown_history: dict = None,
               attacker_hp: int = None, attacker_max_hp: int = 100,
               combat_state: dict = None) -> Tuple[int, List[str]]:
    """Make one attack and return damage dealt and conditions applied

    For AOE attacks:
    - is_aoe: True if this is part of an AOE attack
    - aoe_damage_roll: Shared damage roll result (dice_total, dice_detail) for all AOE targets

    For new limits:
    - attacker_hp: Current HP of attacker (for HP-based limits)
    - attacker_max_hp: Max HP of attacker (for HP-based limits)
    - combat_state: Dict tracking combat state for turn-based limits
      - 'last_target_hit': Index of last enemy hit
      - 'defeated_enemy_last_turn': bool
      - 'dealt_damage_last_turn': bool
      - 'was_hit_last_turn': bool
      - 'was_damaged_last_turn': bool
      - 'attacks_missed_last_turn': bool (all attacks missed)
      - 'was_hit_no_damage_last_turn': bool
      - 'was_attacked_last_turn': bool
      - 'channeled_turns': int (consecutive turns using same attack)
      - 'charges_used': dict of limit_name -> uses_count
    """

    attack_type = ATTACK_TYPES[build.attack_type]

    if log_file:
        log_file.write(f"    Making {build.attack_type} attack with {build.upgrades}\n")

    # Initialize combat state if not provided
    if combat_state is None:
        combat_state = {}
    if 'charges_used' not in combat_state:
        combat_state['charges_used'] = {}
    if 'channeled_turns' not in combat_state:
        combat_state['channeled_turns'] = 0

    # Set attacker_hp to max if not provided
    if attacker_hp is None:
        attacker_hp = attacker_max_hp

    # Check limits first
    for limit_name in build.limits:
        limit = LIMITS[limit_name]

        # Check HP-based limits
        if limit_name == 'near_death' and attacker_hp > 25:
            if log_file:
                log_file.write(f"      {limit_name} failed: HP too high ({attacker_hp} > 25)\n")
            return 0, []
        elif limit_name == 'bloodied' and attacker_hp > 50:
            if log_file:
                log_file.write(f"      {limit_name} failed: HP too high ({attacker_hp} > 50)\n")
            return 0, []
        elif limit_name == 'timid' and attacker_hp < attacker_max_hp:
            if log_file:
                log_file.write(f"      {limit_name} failed: not at max HP ({attacker_hp} < {attacker_max_hp})\n")
            return 0, []
        elif limit_name == 'attrition':
            # Costs 20 HP to use
            if attacker_hp < 20:
                if log_file:
                    log_file.write(f"      {limit_name} failed: not enough HP ({attacker_hp} < 20)\n")
                return 0, []
            # HP cost will be tracked in combat_state for simulation to apply
            if log_file:
                log_file.write(f"      {limit_name} activated: will cost 20 HP\n")
            if 'attrition_cost' not in combat_state:
                combat_state['attrition_cost'] = 0
            combat_state['attrition_cost'] += 20

        # Check charge limits
        elif limit_name in ['charges_1', 'charges_2']:
            max_charges = 1 if limit_name == 'charges_1' else 2
            charges_used = combat_state['charges_used'].get(limit_name, 0)
            if charges_used >= max_charges:
                if log_file:
                    log_file.write(f"      {limit_name} failed: all charges used ({charges_used}/{max_charges})\n")
                return 0, []
            # Track charge use
            combat_state['charges_used'][limit_name] = charges_used + 1
            if log_file:
                log_file.write(f"      {limit_name} activated: charge {charges_used + 1}/{max_charges} used\n")

        # Check turn-tracking limits
        elif limit_name == 'slaughter' and not combat_state.get('defeated_enemy_last_turn', False):
            if log_file:
                log_file.write(f"      {limit_name} failed: did not defeat enemy last turn\n")
            return 0, []
        elif limit_name == 'relentless' and not combat_state.get('dealt_damage_last_turn', False):
            if log_file:
                log_file.write(f"      {limit_name} failed: did not deal damage last turn\n")
            return 0, []
        elif limit_name == 'combo_move' and not combat_state.get('hit_same_target_last_turn', False):
            if log_file:
                log_file.write(f"      {limit_name} failed: did not hit same target last turn\n")
            return 0, []
        elif limit_name == 'revenge' and not combat_state.get('was_damaged_last_turn', False):
            if log_file:
                log_file.write(f"      {limit_name} failed: was not damaged last turn\n")
            return 0, []
        elif limit_name == 'vengeful' and not combat_state.get('was_hit_last_turn', False):
            if log_file:
                log_file.write(f"      {limit_name} failed: was not hit last turn\n")
            return 0, []
        elif limit_name == 'untouchable' and not combat_state.get('all_attacks_missed_last_turn', False):
            if log_file:
                log_file.write(f"      {limit_name} failed: not all attacks missed last turn\n")
            return 0, []
        elif limit_name == 'unbreakable' and not combat_state.get('was_hit_no_damage_last_turn', False):
            if log_file:
                log_file.write(f"      {limit_name} failed: was not hit without damage last turn\n")
            return 0, []
        elif limit_name == 'passive' and combat_state.get('was_attacked_last_turn', False):
            if log_file:
                log_file.write(f"      {limit_name} failed: was attacked last turn\n")
            return 0, []
        elif limit_name == 'careful' and combat_state.get('was_damaged_last_turn', False):
            if log_file:
                log_file.write(f"      {limit_name} failed: was damaged last turn\n")
            return 0, []

        # Check turn-based limits first
        if limit_name == 'quickdraw' and turn_number > 1:
            if log_file:
                log_file.write(f"      {limit_name} failed: not first round (turn {turn_number})\n")
            return 0, []  # Attack fails - not first round (turn 1 only)
        elif limit_name == 'patient' and turn_number < 5:
            if log_file:
                log_file.write(f"      {limit_name} failed: too early (turn {turn_number}, need turn 5+)\n")
            return 0, []  # Attack fails - too early
        elif limit_name == 'finale' and turn_number < 8:
            if log_file:
                log_file.write(f"      {limit_name} failed: too early (turn {turn_number}, need turn 8+)\n")
            return 0, []  # Attack fails - too early
        elif limit_name == 'cooldown':
            # Check if cooldown is still active
            if cooldown_history is None:
                cooldown_history = {}
            last_used = cooldown_history.get('cooldown', -999)
            turns_since_use = turn_number - last_used
            if turns_since_use <= 3:
                if log_file:
                    log_file.write(f"      {limit_name} failed: still on cooldown (used on turn {last_used}, need 3 turns, currently turn {turn_number})\n")
                return 0, []  # Attack fails - still on cooldown
            else:
                # Mark that cooldown was used this turn
                cooldown_history['cooldown'] = turn_number
                if log_file:
                    log_file.write(f"      {limit_name} activated (last used on turn {last_used}, now used on turn {turn_number})\n")

        # Check charge up limits
        elif limit_name == 'charge_up':
            # Need to have charged on previous turn
            if charge_history is None or len(charge_history) == 0 or not charge_history[-1]:
                if log_file:
                    log_file.write(f"      {limit_name} failed: need to charge on previous turn (charging instead)\n")
                return 0, ['charge']  # Return special 'charge' condition instead of attacking
        elif limit_name == 'charge_up_2':
            # Need to have charged on previous 2 turns
            if (charge_history is None or len(charge_history) < 2 or
                not charge_history[-1] or not charge_history[-2]):
                if log_file:
                    log_file.write(f"      {limit_name} failed: need to charge on previous 2 turns (charging instead)\n")
                return 0, ['charge']  # Return special 'charge' condition instead of attacking

        # Handle unreliable DC checks
        elif limit.dc > 0:
            limit_roll = roll_d20()
            if log_file:
                log_file.write(f"      {limit_name} check: rolled {limit_roll} vs DC {limit.dc}\n")
            if limit_roll < limit.dc:
                if log_file:
                    log_file.write(f"      Attack failed due to {limit_name}!\n")
                return 0, []  # Attack fails due to unreliability

    # Calculate accuracy
    base_accuracy = attacker.tier + attacker.focus
    accuracy_mod = attack_type.accuracy_mod * attacker.tier



    # Apply upgrade modifiers (optimized with set checks)
    upgrades_set = set(build.upgrades)  # Convert to set for O(1) membership testing
    for upgrade_name in build.upgrades:
        upgrade = UPGRADES[upgrade_name]
        accuracy_mod += upgrade.accuracy_mod * attacker.tier
        # Reliable Accuracy has flat accuracy penalty, not tier-scaled
        if upgrade_name == 'reliable_accuracy':
            accuracy_mod -= upgrade.accuracy_penalty
        else:
            accuracy_mod -= upgrade.accuracy_penalty * attacker.tier

    # Apply slayer bonuses to accuracy (optimized with cached set)
    slayer_accuracy_bonus = 0
    slayer_upgrades = {'minion_slayer_acc', 'captain_slayer_acc', 'elite_slayer_acc', 'boss_slayer_acc'}
    if upgrades_set & slayer_upgrades:  # Fast set intersection
        if 'minion_slayer_acc' in upgrades_set and defender.max_hp == 10:
            slayer_accuracy_bonus += attacker.tier
        elif 'captain_slayer_acc' in upgrades_set and defender.max_hp == 25:
            slayer_accuracy_bonus += attacker.tier
        elif 'elite_slayer_acc' in upgrades_set and defender.max_hp == 50:
            slayer_accuracy_bonus += attacker.tier
        elif 'boss_slayer_acc' in upgrades_set and defender.max_hp == 100:
            slayer_accuracy_bonus += attacker.tier

    # Apply melee accuracy bonus for melee_ac variant
    melee_accuracy_bonus = 0
    if build.attack_type == 'melee_ac':
        melee_accuracy_bonus = attacker.tier

    # Apply limit bonuses to accuracy (ALL limits now apply to both accuracy and damage)
    limit_accuracy_bonus = 0
    for limit_name in build.limits:
        limit = LIMITS[limit_name]
        limit_accuracy_bonus += limit.damage_bonus * attacker.tier

    total_accuracy = base_accuracy + accuracy_mod + slayer_accuracy_bonus + melee_accuracy_bonus + limit_accuracy_bonus

    # Hit check (unless direct attack)
    is_critical = False
    accuracy_roll = 0
    if not attack_type.is_direct:
        # Handle advantage from reliable accuracy - optimized with cached set
        if 'reliable_accuracy' in upgrades_set:
            roll1 = roll_d20()
            roll2 = roll_d20()
            accuracy_roll = max(roll1, roll2)
            if log_file:
                log_file.write(f"      Reliable Accuracy: rolled {roll1} and {roll2}, taking {accuracy_roll}\n")
        else:
            accuracy_roll = roll_d20()

        # Check for critical hit (optimized with cached set)
        crit_upgrades = {'critical_accuracy', 'double_tap', 'powerful_critical', 'explosive_critical', 'ricochet'}
        has_crit_accuracy = bool(upgrades_set & crit_upgrades)
        if has_crit_accuracy and accuracy_roll >= 15:
            is_critical = True
        elif accuracy_roll == 20:  # Natural 20 is always critical
            is_critical = True

        if log_file:
            # Build detailed accuracy breakdown
            accuracy_parts = [f"{accuracy_roll} [Roll]", f"{attacker.tier} [Tier]", f"{attacker.focus} [Focus]"]

            # Add attack type modifier
            if attack_type.accuracy_mod != 0:
                mod_value = attack_type.accuracy_mod * attacker.tier
                accuracy_parts.append(f"{mod_value:+d} [{build.attack_type.title()}]")

            # Add upgrade modifiers
            for upgrade_name in build.upgrades:
                upgrade = UPGRADES[upgrade_name]
                if upgrade.accuracy_mod != 0:
                    mod_value = upgrade.accuracy_mod * attacker.tier
                    accuracy_parts.append(f"{mod_value:+d} [{upgrade_name}]")
                if upgrade.accuracy_penalty != 0:
                    # Reliable Accuracy has flat penalty, others are tier-scaled
                    if upgrade_name == 'reliable_accuracy':
                        penalty_value = -upgrade.accuracy_penalty
                    else:
                        penalty_value = -(upgrade.accuracy_penalty * attacker.tier)
                    accuracy_parts.append(f"{penalty_value:+d} [{upgrade_name}]")

            # Add slayer bonus
            if slayer_accuracy_bonus > 0:
                accuracy_parts.append(f"+{slayer_accuracy_bonus} [Slayer]")

            # Add melee accuracy bonus
            if melee_accuracy_bonus > 0:
                accuracy_parts.append(f"+{melee_accuracy_bonus} [Melee]")

            # Add limit accuracy bonus (ALL limits now apply to accuracy)
            if limit_accuracy_bonus > 0:
                for limit_name in build.limits:
                    limit = LIMITS[limit_name]
                    bonus_value = limit.damage_bonus * attacker.tier
                    accuracy_parts.append(f"+{bonus_value} [{limit_name}]")

            accuracy_breakdown = " + ".join(accuracy_parts).replace(" + -", " - ")
            log_file.write(f"      Accuracy: {accuracy_breakdown} = {accuracy_roll + total_accuracy} vs {defender.avoidance}\n")

            if is_critical:
                log_file.write(f"      CRITICAL HIT! (rolled {accuracy_roll})\n")

        # Check if this attack hits
        attack_hits = accuracy_roll + total_accuracy >= defender.avoidance
        if not attack_hits:
            if log_file:
                log_file.write(f"      Miss!\n")
            # For Quick Strikes, continue to make additional attacks even on miss - optimized with cached set
            if not allow_multi or not ('quick_strikes' in upgrades_set):
                return 0, []  # Early return for non-multi-attack misses

    # For missed attacks, set damage to 0 but continue for multi-attacks
    damage_dealt = 0
    conditions_applied = []

    if attack_type.is_direct or attack_hits:
        # Calculate overhit bonus (only if attack hit) - optimized with cached set
        overhit_bonus = 0
        if not attack_type.is_direct and 'overhit' in upgrades_set:
            total_attack_roll = accuracy_roll + total_accuracy
            if total_attack_roll >= defender.avoidance + 5:
                overhit_bonus = (total_attack_roll - defender.avoidance) // 2
                if log_file:
                    log_file.write(f"      Overhit! Exceeded avoidance by {total_attack_roll - defender.avoidance}, adding {overhit_bonus} to damage\n")

        # Calculate damage
        if attack_type.is_direct:
            if build.attack_type == 'direct_area_damage':
                damage = attack_type.direct_damage_base - (attacker.tier * 2)
            else:
                damage = attack_type.direct_damage_base - attacker.tier
            dice_detail = []
        else:
            # Roll damage dice (use shared roll for AOE) - optimized with cached set
            use_high_impact = 'high_impact' in upgrades_set
            use_critical_effect = 'critical_effect' in upgrades_set

            if is_aoe and aoe_damage_roll is not None:
                # Use shared AOE damage roll
                dice_damage, dice_detail = aoe_damage_roll
            else:
                # Roll new damage dice
                if use_high_impact:
                    dice_damage = 15  # Flat 15
                    dice_detail = ["15 (flat)"]
                elif use_critical_effect:
                    dice_damage, dice_detail = roll_3d6_exploding_5_6()
                else:
                    dice_damage, dice_detail = roll_3d6_exploding()

            # Add flat bonuses
            flat_bonus = attacker.tier + attacker.power
            flat_bonus += attack_type.damage_mod * attacker.tier

            # Melee damage bonus for melee_dg variant
            if build.attack_type in ['melee_dg']:
                flat_bonus += attacker.tier

            # 10×tier bonus for melee and ranged attacks removed - replaced with AOE limit cost penalty

            # Apply upgrade bonuses/penalties
            for upgrade_name in build.upgrades:
                upgrade = UPGRADES[upgrade_name]
                flat_bonus += upgrade.damage_mod * attacker.tier
                # Critical Effect has flat damage penalty, not tier-scaled
                if upgrade_name == 'critical_effect':
                    flat_bonus -= upgrade.damage_penalty
                else:
                    flat_bonus -= upgrade.damage_penalty * attacker.tier

            # Apply limit bonuses
            for limit_name in build.limits:
                limit = LIMITS[limit_name]
                flat_bonus += limit.damage_bonus * attacker.tier

            # Apply channeled bonus (optimized with cached set)
            channeled_bonus = 0
            if 'channeled' in upgrades_set:
                channeled_turns = combat_state.get('channeled_turns', 0)
                # Starts at -2×Tier penalty, gains +Tier per turn, max +6×Tier total (updated 2025-10-05)
                # Turn 0: -2, Turn 1: -1, Turn 2: 0, Turn 3: +1, ..., Turn 8+: +6
                channeled_bonus = min(channeled_turns - 2, 6) * attacker.tier
                flat_bonus += channeled_bonus
                if log_file:
                    log_file.write(f"      Channeled: turn {channeled_turns}, bonus {channeled_bonus:+d}\n")

            # Apply slayer damage bonuses (optimized with cached set)
            slayer_damage_bonus = 0
            slayer_damage_upgrades = {'minion_slayer_dmg', 'captain_slayer_dmg', 'elite_slayer_dmg', 'boss_slayer_dmg'}
            if upgrades_set & slayer_damage_upgrades:
                if 'minion_slayer_dmg' in upgrades_set and defender.max_hp == 10:
                    slayer_damage_bonus += attacker.tier
                elif 'captain_slayer_dmg' in upgrades_set and defender.max_hp == 25:
                    slayer_damage_bonus += attacker.tier
                elif 'elite_slayer_dmg' in upgrades_set and defender.max_hp == 50:
                    slayer_damage_bonus += attacker.tier
                elif 'boss_slayer_dmg' in upgrades_set and defender.max_hp == 100:
                    slayer_damage_bonus += attacker.tier

            # Apply critical hit damage bonus (optimized with cached set)
            critical_damage_bonus = 0
            if is_critical:
                # Base critical hit bonus
                critical_damage_bonus = attacker.tier
                # Additional bonus if they have powerful critical (which includes critical_accuracy)
                if 'powerful_critical' in upgrades_set:
                    critical_damage_bonus += attacker.tier

            damage = dice_damage + flat_bonus + slayer_damage_bonus + critical_damage_bonus + overhit_bonus

            if log_file:
                log_file.write(f"      Damage dice: {dice_detail} = {dice_damage}\n")

                # Enhanced flat bonus breakdown
                flat_parts = [f"{attacker.tier} [Tier]", f"{attacker.power} [Power]"]
                if attack_type.damage_mod != 0:
                    mod_value = attack_type.damage_mod * attacker.tier
                    flat_parts.append(f"{mod_value:+d} [{build.attack_type.title()}]")

                # Melee damage bonus
                if build.attack_type in ['melee_dg']:
                    flat_parts.append(f"+{attacker.tier} [Melee]")

                # 10×tier bonus for melee and ranged attacks removed

                # Upgrade damage modifiers
                for upgrade_name in build.upgrades:
                    upgrade = UPGRADES[upgrade_name]
                    if upgrade.damage_mod != 0:
                        mod_value = upgrade.damage_mod * attacker.tier
                        flat_parts.append(f"{mod_value:+d} [{upgrade_name}]")
                    if upgrade.damage_penalty != 0:
                        # Critical Effect has flat penalty, others are tier-scaled
                        if upgrade_name == 'critical_effect':
                            penalty_value = -upgrade.damage_penalty
                        else:
                            penalty_value = -(upgrade.damage_penalty * attacker.tier)
                        flat_parts.append(f"{penalty_value:+d} [{upgrade_name}]")

                # Limit damage bonuses
                for limit_name in build.limits:
                    limit = LIMITS[limit_name]
                    if limit.damage_bonus > 0:
                        bonus_value = limit.damage_bonus * attacker.tier
                        flat_parts.append(f"+{bonus_value} [{limit_name}]")

                flat_breakdown = " + ".join(flat_parts).replace(" + -", " - ")
                log_file.write(f"      Flat bonus: {flat_breakdown} = {flat_bonus}\n")

                if slayer_damage_bonus > 0:
                    slayer_type = ""
                    for upgrade_name in build.upgrades:
                        if 'slayer' in upgrade_name and 'dmg' in upgrade_name:
                            slayer_type = upgrade_name.replace('_slayer_dmg', '').title()
                            break
                    log_file.write(f"      Slayer bonus: +{slayer_damage_bonus} [{slayer_type} vs {defender.max_hp}HP]\n")

                if critical_damage_bonus > 0:
                    if 'powerful_critical' in build.upgrades:
                        log_file.write(f"      Critical bonus: +{critical_damage_bonus} [Critical Hit +{attacker.tier} + Powerful Critical +{attacker.tier}]\n")
                    else:
                        log_file.write(f"      Critical bonus: +{critical_damage_bonus} [Critical Hit]\n")

                if overhit_bonus > 0:
                    log_file.write(f"      Overhit bonus: +{overhit_bonus} [Exceeded avoidance by {accuracy_roll + total_accuracy - defender.avoidance}]\n")

                log_file.write(f"      Total damage: {damage}\n")

        # Apply durability (ALL attacks subtract durability) - optimized with cached set
        effective_durability = defender.durability
        if 'armor_piercing' in upgrades_set:
            effective_durability = defender.tier  # Ignore endurance bonus
            if log_file:
                log_file.write(f"      Armor piercing: reducing durability from {defender.durability} to {effective_durability}\n")

        damage_dealt = max(0, damage - effective_durability)

        if log_file:
            if attack_type.is_direct:
                log_file.write(f"      Direct attack: {damage} - durability {effective_durability} = {damage_dealt} damage\n")
            else:
                log_file.write(f"      After durability ({effective_durability}): {damage_dealt} damage\n")

        # Handle brutal (only for non-direct attacks) - optimized with cached set
        if not attack_type.is_direct and 'brutal' in upgrades_set and damage > effective_durability + 10:
            brutal_bonus = int((damage - effective_durability - 10) * 0.5)
            damage_dealt += brutal_bonus
            if log_file:
                log_file.write(f"      Brutal bonus: +{brutal_bonus} damage\n")

        # Handle leech (HP recovery) - optimized with cached set
        if 'leech' in upgrades_set and damage_dealt > 0:
            leech_hp = damage_dealt // 2
            if 'leech_hp' not in combat_state:
                combat_state['leech_hp'] = 0
            combat_state['leech_hp'] += leech_hp
            if log_file:
                log_file.write(f"      Leech: recover {leech_hp} HP (half of {damage_dealt} damage)\n")

        # Handle conditions for successful attacks - optimized with cached set
        if 'bleed' in upgrades_set:
            conditions_applied.append('bleed')
            if log_file:
                log_file.write(f"      Applied bleed condition\n")

        # Handle finishing blow threshold - optimized with cached set
        finishing_threshold = 0
        if 'finishing_blow_1' in upgrades_set:
            finishing_threshold = 5
        elif 'finishing_blow_2' in upgrades_set:
            finishing_threshold = 10
        elif 'finishing_blow_3' in upgrades_set:
            finishing_threshold = 15

        if finishing_threshold > 0:
            conditions_applied.append(f'finishing_{finishing_threshold}')

        # Handle culling strike (defeat if below 1/5 max HP) - optimized with cached set
        if 'culling_strike' in upgrades_set:
            conditions_applied.append('culling_strike')

        # Handle splinter (triggers another attack if enemy is defeated) - optimized with cached set
        if 'splinter' in upgrades_set:
            conditions_applied.append('splinter')

    # Handle multiple attacks - Quick Strikes makes all attacks regardless of hit/miss - optimized with cached set
    # Handle Quick Strikes (make 2 attacks total regardless of success)
    if allow_multi and ('quick_strikes' in upgrades_set):
        # Make 1 more attack (already made 1) - happens regardless of first attack result
        upgrade_name = 'quick_strikes'
        if log_file:
            log_file.write(f"      Quick Strikes - making second attack (2 attacks total, regardless of first attack result):\n")
        extra_damage = 0
        if log_file:
            log_file.write(f"        Second attack:\n")
        extra = make_single_attack_damage(attacker, defender, build, log_file, turn_number, charge_history, cooldown_history,
                                         attacker_hp, attacker_max_hp, combat_state)
        extra_damage += extra
        damage_dealt += extra_damage
        if log_file:
            log_file.write(f"      Total with quick strikes (2 attacks): {damage_dealt} damage\n")


    # Handle explosive critical (15-20 triggers attack against all enemies in range) - optimized with cached set
    if allow_multi and 'explosive_critical' in upgrades_set and accuracy_roll >= 15:
        if log_file:
            log_file.write(f"      Explosive Critical triggered! (explosive attacks not implemented in single-target context)\n")
        # Note: Explosive Critical mechanics would need multi-enemy context to fully implement
        # For now, we mark that it triggered but don't apply area damage in single-target simulation

    # Handle double-tap (15-20 triggers same attack again) - double_tap includes critical_accuracy - optimized with cached set
    if allow_multi and 'double_tap' in upgrades_set and accuracy_roll >= 15:
        if log_file:
            log_file.write(f"      Double-Tap triggered! Making identical attack:\n")
        extra_damage = make_single_attack_damage(attacker, defender, build, log_file, turn_number, charge_history, cooldown_history,
                                                attacker_hp, attacker_max_hp, combat_state)
        damage_dealt += extra_damage
        if log_file:
            log_file.write(f"      Total with double-tap: {damage_dealt} damage\n")

    # Handle ricochet (15-20 triggers attack on different target) - optimized with cached set
    if allow_multi and 'ricochet' in upgrades_set and accuracy_roll >= 15:
        # Mark for ricochet - actual targeting handled by simulation layer
        conditions_applied.append('ricochet')
        if log_file:
            log_file.write(f"      Ricochet triggered! (will attack different target)\n")

    # Handle extra attack (successful hit + effect allows identical attack) - optimized with cached set
    if allow_multi and 'extra_attack' in upgrades_set and damage_dealt > 0 and len(conditions_applied) > 0:
        if log_file:
            log_file.write(f"      Extra Attack triggered! (hit + effect success)\n")
        extra_damage = make_single_attack_damage(attacker, defender, build, log_file, turn_number, charge_history, cooldown_history,
                                                attacker_hp, attacker_max_hp, combat_state)
        damage_dealt += extra_damage
        if log_file:
            log_file.write(f"      Total with extra attack: {damage_dealt} damage\n")

    # Handle barrage (chained attacks - hit + effect on each attack enables the next) - optimized with cached set
    if allow_multi and 'barrage' in upgrades_set and damage_dealt > 0 and len(conditions_applied) > 0:
        if log_file:
            log_file.write(f"      Barrage - first attack succeeded, attempting second attack:\n")
        # Second attack
        second_damage = make_single_attack_damage(attacker, defender, build, log_file, turn_number, charge_history, cooldown_history,
                                                 attacker_hp, attacker_max_hp, combat_state)
        damage_dealt += second_damage

        # If second attack also hit and caused an effect, attempt third attack
        if second_damage > 0:  # Simplified: if damage was dealt, assume hit + effect
            if log_file:
                log_file.write(f"      Barrage - second attack succeeded, attempting third attack:\n")
            third_damage = make_single_attack_damage(attacker, defender, build, log_file, turn_number, charge_history, cooldown_history,
                                                    attacker_hp, attacker_max_hp, combat_state)
            damage_dealt += third_damage
            if log_file:
                log_file.write(f"      Total with barrage (3 attacks): {damage_dealt} damage\n")
        else:
            if log_file:
                log_file.write(f"      Total with barrage (2 attacks): {damage_dealt} damage\n")

    return damage_dealt, conditions_applied