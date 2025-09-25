"""
Combat mechanics and attack resolution for the Vitality System.
"""

import random
from typing import List, Tuple, Optional
from models import Character, AttackBuild
from game_data import ATTACK_TYPES, UPGRADES, LIMITS


def roll_d20() -> int:
    """Roll a single d20"""
    return random.randint(1, 20)


def roll_3d6_exploding() -> Tuple[int, List[str]]:
    """Roll 3d6 with exploding 6s"""
    total = 0
    dice_detail = []
    for _ in range(3):
        die_total = 0
        die = random.randint(1, 6)
        die_total += die
        dice_detail.append(str(die))
        while die == 6:
            die = random.randint(1, 6)
            die_total += die
            dice_detail[-1] += f"+{die}"
        total += die_total
    return total, dice_detail


def roll_3d6_exploding_5_6() -> Tuple[int, List[str]]:
    """Roll 3d6 with exploding 5s and 6s"""
    total = 0
    dice_detail = []
    for _ in range(3):
        die_total = 0
        die = random.randint(1, 6)
        die_total += die
        dice_detail.append(str(die))
        while die >= 5:
            die = random.randint(1, 6)
            die_total += die
            dice_detail[-1] += f"+{die}"
        total += die_total
    return total, dice_detail


def make_aoe_attack(attacker: Character, defender: Character, build: AttackBuild,
                   targets: List[Tuple[int, dict]], log_file=None, turn_number: int = 1,
                   charge_history: List[bool] = None) -> Tuple[List[Tuple[int, int, List[str]]], int]:
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
                                       is_aoe=True, aoe_damage_roll=shared_dice_roll)

        results.append((target_idx, damage, conditions))
        total_damage += damage

    return results, total_damage


def make_single_attack_damage(attacker: Character, defender: Character, build: AttackBuild,
                             log_file, turn_number: int = 1, charge_history: List[bool] = None) -> int:
    """Make a single attack and return only damage (for multi-attacks)"""
    damage, _ = make_attack(attacker, defender, build, allow_multi=False,
                           log_file=log_file, turn_number=turn_number, charge_history=charge_history,
                           is_aoe=False, aoe_damage_roll=None)
    return damage


def make_attack(attacker: Character, defender: Character, build: AttackBuild,
               allow_multi: bool = True, log_file=None, turn_number: int = 1,
               charge_history: List[bool] = None, is_aoe: bool = False,
               aoe_damage_roll: Tuple[int, List[str]] = None) -> Tuple[int, List[str]]:
    """Make one attack and return damage dealt and conditions applied

    For AOE attacks:
    - is_aoe: True if this is part of an AOE attack
    - aoe_damage_roll: Shared damage roll result (dice_total, dice_detail) for all AOE targets
    """

    attack_type = ATTACK_TYPES[build.attack_type]

    if log_file:
        log_file.write(f"    Making {build.attack_type} attack with {build.upgrades}\n")

    # Check limits first
    for limit_name in build.limits:
        limit = LIMITS[limit_name]

        # Check turn-based limits first
        if limit_name == 'quickdraw' and turn_number > 1:
            if log_file:
                log_file.write(f"      {limit_name} failed: not first round (turn {turn_number})\n")
            return 0, []  # Attack fails - not first round
        elif limit_name == 'steady' and turn_number < 3:
            if log_file:
                log_file.write(f"      {limit_name} failed: too early (turn {turn_number}, need turn 3+)\n")
            return 0, []  # Attack fails - too early
        elif limit_name == 'patient' and turn_number < 5:
            if log_file:
                log_file.write(f"      {limit_name} failed: too early (turn {turn_number}, need turn 5+)\n")
            return 0, []  # Attack fails - too early
        elif limit_name == 'finale' and turn_number < 8:
            if log_file:
                log_file.write(f"      {limit_name} failed: too early (turn {turn_number}, need turn 8+)\n")
            return 0, []  # Attack fails - too early

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

    # Ranged attacks have -Tier penalty when adjacent (assume always adjacent for simulation)
    if build.attack_type == 'ranged':
        accuracy_mod -= attacker.tier

    # Apply upgrade modifiers
    for upgrade_name in build.upgrades:
        upgrade = UPGRADES[upgrade_name]
        accuracy_mod += upgrade.accuracy_mod * attacker.tier
        if upgrade_name == 'armor_piercing':
            # Armor piercing penalty is -Tier/2, rounded up
            accuracy_mod -= (attacker.tier + 1) // 2
        else:
            accuracy_mod -= upgrade.accuracy_penalty * attacker.tier

    # Apply slayer bonuses to accuracy
    slayer_accuracy_bonus = 0
    if any(upgrade in build.upgrades for upgrade in ['minion_slayer_acc', 'captain_slayer_acc', 'elite_slayer_acc', 'boss_slayer_acc']):
        if 'minion_slayer_acc' in build.upgrades and defender.max_hp <= 10:
            slayer_accuracy_bonus += attacker.tier
        elif 'captain_slayer_acc' in build.upgrades and defender.max_hp <= 25:
            slayer_accuracy_bonus += attacker.tier
        elif 'elite_slayer_acc' in build.upgrades and defender.max_hp <= 50:
            slayer_accuracy_bonus += attacker.tier
        elif 'boss_slayer_acc' in build.upgrades and defender.max_hp <= 100:
            slayer_accuracy_bonus += attacker.tier

    # Apply melee accuracy bonus for melee_ac variant
    melee_accuracy_bonus = 0
    if build.attack_type == 'melee_ac':
        melee_accuracy_bonus = attacker.tier

    total_accuracy = base_accuracy + accuracy_mod + slayer_accuracy_bonus + melee_accuracy_bonus

    # Hit check (unless direct attack)
    is_critical = False
    accuracy_roll = 0
    if not attack_type.is_direct:
        # Handle advantage from reliable accuracy
        if 'reliable_accuracy' in build.upgrades:
            roll1 = roll_d20()
            roll2 = roll_d20()
            accuracy_roll = max(roll1, roll2)
            if log_file:
                log_file.write(f"      Reliable Accuracy: rolled {roll1} and {roll2}, taking {accuracy_roll}\n")
        else:
            accuracy_roll = roll_d20()

        # Check for critical hit
        if 'critical_accuracy' in build.upgrades and accuracy_roll >= 15:
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
                    if upgrade_name == 'armor_piercing':
                        # Armor piercing penalty is -Tier/2, rounded up
                        penalty_value = -((attacker.tier + 1) // 2)
                    else:
                        penalty_value = -(upgrade.accuracy_penalty * attacker.tier)
                    accuracy_parts.append(f"{penalty_value:+d} [{upgrade_name}]")

            # Add slayer bonus
            if slayer_accuracy_bonus > 0:
                accuracy_parts.append(f"+{slayer_accuracy_bonus} [Slayer]")

            # Add melee accuracy bonus
            if melee_accuracy_bonus > 0:
                accuracy_parts.append(f"+{melee_accuracy_bonus} [Melee]")

            accuracy_breakdown = " + ".join(accuracy_parts).replace(" + -", " - ")
            log_file.write(f"      Accuracy: {accuracy_breakdown} = {accuracy_roll + total_accuracy} vs {defender.avoidance}\n")

            if is_critical:
                log_file.write(f"      CRITICAL HIT! (rolled {accuracy_roll})\n")

        if accuracy_roll + total_accuracy < defender.avoidance:
            if log_file:
                log_file.write(f"      Miss!\n")
            return 0, []  # Miss

    # Calculate overhit bonus
    overhit_bonus = 0
    if not attack_type.is_direct and 'overhit' in build.upgrades:
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
        # Roll damage dice (use shared roll for AOE)
        use_high_impact = 'high_impact' in build.upgrades
        use_critical_effect = 'critical_effect' in build.upgrades

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

        # Melee damage bonus for original melee and melee_dg variant
        if build.attack_type in ['melee', 'melee_dg']:
            flat_bonus += attacker.tier

        # Apply upgrade bonuses/penalties
        for upgrade_name in build.upgrades:
            upgrade = UPGRADES[upgrade_name]
            flat_bonus += upgrade.damage_mod * attacker.tier
            flat_bonus -= upgrade.damage_penalty * attacker.tier

        # Apply limit bonuses
        for limit_name in build.limits:
            limit = LIMITS[limit_name]
            flat_bonus += limit.damage_bonus * attacker.tier

        # Apply slayer damage bonuses
        slayer_damage_bonus = 0
        if any(upgrade in build.upgrades for upgrade in ['minion_slayer_dmg', 'captain_slayer_dmg', 'elite_slayer_dmg', 'boss_slayer_dmg']):
            if 'minion_slayer_dmg' in build.upgrades and defender.max_hp <= 10:
                slayer_damage_bonus += attacker.tier
            elif 'captain_slayer_dmg' in build.upgrades and defender.max_hp <= 25:
                slayer_damage_bonus += attacker.tier
            elif 'elite_slayer_dmg' in build.upgrades and defender.max_hp <= 50:
                slayer_damage_bonus += attacker.tier
            elif 'boss_slayer_dmg' in build.upgrades and defender.max_hp <= 100:
                slayer_damage_bonus += attacker.tier

        # Apply powerful condition critical bonus
        critical_damage_bonus = 0
        if is_critical and 'powerful_condition_critical' in build.upgrades and 'critical_accuracy' in build.upgrades:
            critical_damage_bonus = attacker.tier

        damage = dice_damage + flat_bonus + slayer_damage_bonus + critical_damage_bonus + overhit_bonus

        if log_file:
            log_file.write(f"      Damage dice: {dice_detail} = {dice_damage}\n")

            # Enhanced flat bonus breakdown
            flat_parts = [f"{attacker.tier} [Tier]", f"{attacker.power} [Power]"]
            if attack_type.damage_mod != 0:
                mod_value = attack_type.damage_mod * attacker.tier
                flat_parts.append(f"{mod_value:+d} [{build.attack_type.title()}]")

            # Melee damage bonus
            if build.attack_type in ['melee', 'melee_dg']:
                flat_parts.append(f"+{attacker.tier} [Melee]")

            # Upgrade damage modifiers
            for upgrade_name in build.upgrades:
                upgrade = UPGRADES[upgrade_name]
                if upgrade.damage_mod != 0:
                    mod_value = upgrade.damage_mod * attacker.tier
                    flat_parts.append(f"{mod_value:+d} [{upgrade_name}]")
                if upgrade.damage_penalty != 0:
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
                log_file.write(f"      Critical bonus: +{critical_damage_bonus} [Powerful Condition Critical]\n")

            if overhit_bonus > 0:
                log_file.write(f"      Overhit bonus: +{overhit_bonus} [Exceeded avoidance by {accuracy_roll + total_accuracy - defender.avoidance}]\n")

            log_file.write(f"      Total damage: {damage}\n")

    # Apply durability (direct attacks bypass durability completely)
    if attack_type.is_direct:
        damage_dealt = damage
        if log_file:
            log_file.write(f"      Direct attack: ignores durability, final damage: {damage_dealt}\n")
    else:
        effective_durability = defender.durability
        if 'armor_piercing' in build.upgrades:
            effective_durability = defender.tier  # Ignore endurance bonus
            if log_file:
                log_file.write(f"      Armor piercing: reducing durability from {defender.durability} to {effective_durability}\n")

        damage_dealt = max(0, damage - effective_durability)

        if log_file:
            log_file.write(f"      After durability ({effective_durability}): {damage_dealt} damage\n")

        # Handle brutal (only for non-direct attacks)
        if 'brutal' in build.upgrades and damage > effective_durability + 10:
            brutal_bonus = int((damage - effective_durability - 10) * 0.5)
            damage_dealt += brutal_bonus
            if log_file:
                log_file.write(f"      Brutal bonus: +{brutal_bonus} damage\n")

    # Handle multiple attacks
    conditions_applied = []
    if allow_multi and 'triple_attack' in [UPGRADES[u].special_effect for u in build.upgrades]:
        # Check triple attack restrictions
        skip_triple_attack = False
        if 'quick_strikes' in build.upgrades and build.attack_type not in ['melee', 'melee_ac', 'melee_dg']:
            if log_file:
                log_file.write(f"      Quick strikes only works with melee attacks - skipping triple attack\n")
            skip_triple_attack = True
        elif 'barrage' in build.upgrades and build.attack_type != 'ranged':
            if log_file:
                log_file.write(f"      Barrage only works with ranged attacks - skipping triple attack\n")
            skip_triple_attack = True

        if not skip_triple_attack:
            # Make 2 more attacks (already made 1)
            if log_file:
                log_file.write(f"      Triple attack - making 2 additional attacks:\n")
            extra_damage = 0
            for i in range(2):
                if log_file:
                    log_file.write(f"        Additional attack {i+1}:\n")
                extra = make_single_attack_damage(attacker, defender, build, log_file, turn_number, charge_history)
                extra_damage += extra
            damage_dealt += extra_damage
            if log_file:
                log_file.write(f"      Total with triple attack: {damage_dealt} damage\n")

    # Handle finishing blow
    finishing_threshold = 0
    if 'finishing_blow_1' in build.upgrades:
        finishing_threshold = 5
    elif 'finishing_blow_2' in build.upgrades:
        finishing_threshold = 10
    elif 'finishing_blow_3' in build.upgrades:
        finishing_threshold = 15

    # Check if finishing blow applies (this would need target's current HP, using damage as proxy)
    if finishing_threshold > 0 and damage_dealt >= finishing_threshold:
        if log_file:
            log_file.write(f"      Finishing Blow activated (threshold: {finishing_threshold})!\n")
        # In actual implementation, would need to check target's remaining HP
        conditions_applied.append(f'finishing_{finishing_threshold}')

    # Handle bleed
    if 'bleed' in build.upgrades:
        conditions_applied.append('bleed')
        if log_file:
            log_file.write(f"      Applied bleed condition\n")

    # Handle double-tap (15-20 triggers same attack again)
    if allow_multi and 'double_tap' in build.upgrades and 'critical_accuracy' in build.upgrades and accuracy_roll >= 15:
        if log_file:
            log_file.write(f"      Double-Tap triggered! Making identical attack:\n")
        extra_damage = make_single_attack_damage(attacker, defender, build, log_file, turn_number, charge_history)
        damage_dealt += extra_damage
        if log_file:
            log_file.write(f"      Total with double-tap: {damage_dealt} damage\n")

    # Handle extra attack (successful hit + effect allows identical attack)
    if allow_multi and 'extra_attack' in build.upgrades and damage_dealt > 0 and len(conditions_applied) > 0:
        if log_file:
            log_file.write(f"      Extra Attack triggered! (hit + effect success)\n")
        extra_damage = make_single_attack_damage(attacker, defender, build, log_file, turn_number, charge_history)
        damage_dealt += extra_damage
        if log_file:
            log_file.write(f"      Total with extra attack: {damage_dealt} damage\n")

    return damage_dealt, conditions_applied