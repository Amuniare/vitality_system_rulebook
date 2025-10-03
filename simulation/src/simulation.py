"""
Combat simulation logic for the Vitality System.
"""

from typing import List, Tuple
from src.models import Character, AttackBuild
from src.combat import make_attack, make_aoe_attack


def simulate_combat_verbose(attacker: Character, build: AttackBuild, target_hp: int = 100,
                          log_file=None, defender: Character = None, num_enemies: int = 1,
                          enemy_hp: int = None, max_turns: int = 100, enemy_hp_list: List[int] = None) -> Tuple[int, str]:
    """Simulate combat with defender attacks, return turns and outcome

    Args:
        enemy_hp_list: Optional list of HP values for mixed enemy groups.
                       If provided, overrides num_enemies and enemy_hp.

    Returns:
        Tuple of (turns, outcome) where outcome is "win", "loss", or "timeout"
    """

    # Use provided defender or create dummy defender for the test case
    if defender is None:
        defender = Character(focus=0, power=0, mobility=3, endurance=0, tier=attacker.tier)

    # Initialize enemies - support both homogeneous and mixed HP groups
    # Optimization: Avoid dictionary copies by creating separate dictionaries
    if enemy_hp_list is not None:
        # Mixed enemy groups - each enemy can have different HP
        enemies = [{'hp': hp, 'max_hp': hp, 'bleed_stacks': []} for hp in enemy_hp_list]
        num_enemies = len(enemy_hp_list)
    else:
        # Homogeneous enemy groups - all enemies have same HP (backward compatible)
        if enemy_hp is None:
            enemy_hp = target_hp
        # Create each dictionary separately to avoid .copy() overhead
        enemies = [{'hp': enemy_hp, 'max_hp': enemy_hp, 'bleed_stacks': []} for _ in range(num_enemies)]

    # Track attacker HP for win/loss determination
    attacker_hp = attacker.max_hp
    attacker_max_hp = attacker.max_hp

    if log_file:
        log_file.write(f"\n{'='*80}\n")
        log_file.write(f"COMBAT SIMULATION - DETAILED ANALYSIS\n")
        log_file.write(f"{'='*80}\n")
        log_file.write(f"ATTACKER STATS:\n")
        log_file.write(f"  Focus: {attacker.focus} | Power: {attacker.power} | Mobility: {attacker.mobility} | Endurance: {attacker.endurance} | Tier: {attacker.tier}\n")
        log_file.write(f"  Avoidance: {attacker.avoidance} | Durability: {attacker.durability} | Max HP: {attacker.max_hp}\n")
        log_file.write(f"DEFENDER STATS:\n")
        log_file.write(f"  Focus: {defender.focus} | Power: {defender.power} | Mobility: {defender.mobility} | Endurance: {defender.endurance} | Tier: {defender.tier}\n")
        log_file.write(f"  Avoidance: {defender.avoidance} | Durability: {defender.durability} | Max HP: {defender.max_hp}\n")
        log_file.write(f"BUILD CONFIGURATION:\n")
        # Handle both AttackBuild and MultiAttackBuild
        if hasattr(build, 'attack_type'):
            log_file.write(f"  Attack Type: {build.attack_type}")
            if build.attack_type == 'melee_ac':
                log_file.write(f" (choosing +{attacker.tier} accuracy)")
            elif build.attack_type == 'melee_dg':
                log_file.write(f" (choosing +{attacker.tier} damage)")
            log_file.write(f"\n  Upgrades: {', '.join(build.upgrades) if build.upgrades else 'None'}\n")
            log_file.write(f"  Limits: {', '.join(build.limits) if build.limits else 'None'}\n")
            log_file.write(f"  Total Cost: {build.total_cost} points\n")
        else:
            # MultiAttackBuild
            log_file.write(f"  Archetype: {build.archetype}\n")
            log_file.write(f"  Number of Attacks: {len(build.builds)}\n")
            for i, attack in enumerate(build.builds):
                log_file.write(f"  Attack {i+1}: {attack.attack_type}")
                if attack.upgrades:
                    log_file.write(f" (Upgrades: {', '.join(attack.upgrades)})")
                if attack.limits:
                    log_file.write(f" (Limits: {', '.join(attack.limits)})")
                log_file.write(f" [Cost: {attack.total_cost}]\n")
            log_file.write(f"  Total Cost: {build.get_total_cost()} points\n")
        log_file.write(f"COMBAT PARAMETERS:\n")
        log_file.write(f"  Number of Enemies: {num_enemies}\n")
        if enemy_hp_list:
            log_file.write(f"  Enemy HP: {enemy_hp_list} (mixed)\n")
            log_file.write(f"  Total HP Pool: {sum(enemy_hp_list)}\n")
        else:
            log_file.write(f"  Enemy HP: {enemy_hp} each\n")
            log_file.write(f"  Total HP Pool: {num_enemies * enemy_hp}\n")
        log_file.write(f"  Combat Length Limit: 100 turns\n")
        log_file.write(f"{'='*80}\n\n")

    turns = 0
    charge_history = []  # Track charging actions: True = charged, False = attacked
    cooldown_history = {}  # Track when limits with cooldowns were last used

    while any(enemy['hp'] > 0 for enemy in enemies) and turns < max_turns:
        turns += 1
        if log_file:
            log_file.write(f"\n{'='*60}\n")
            log_file.write(f"TURN {turns} - START\n")
            log_file.write(f"{'='*60}\n")
            log_file.write(f"Attacker HP: {attacker_hp}/{attacker_max_hp} ({attacker_hp/attacker_max_hp*100:.1f}%)\n")
            alive_enemies = [i for i, enemy in enumerate(enemies) if enemy['hp'] > 0]
            total_hp = sum(enemy['hp'] for enemy in enemies)
            max_total_hp = num_enemies * enemy_hp
            log_file.write(f"Alive Enemies: {len(alive_enemies)}/{num_enemies}\n")
            log_file.write(f"Total HP: {total_hp}/{max_total_hp} ({total_hp/max_total_hp*100:.1f}%)\n")
            for i, enemy in enumerate(enemies):
                if enemy['hp'] > 0:
                    log_file.write(f"  Enemy {i+1}: {enemy['hp']}/{enemy['max_hp']} HP")
                    if enemy['bleed_stacks']:
                        log_file.write(f" ({len(enemy['bleed_stacks'])} bleed stacks)")
                    log_file.write(f"\n")

        # Apply bleed damage to all enemies
        if log_file and any(enemy['bleed_stacks'] for enemy in enemies):
            log_file.write(f"\nBLEED PHASE:\n")

        enemies_killed_by_bleed = []
        for i, enemy in enumerate(enemies):
            if enemy['hp'] <= 0:
                continue

            bleed_stacks = enemy['bleed_stacks']
            if not bleed_stacks:
                continue

            total_bleed_damage = 0
            # Process bleed in-place to avoid creating new lists
            active_bleeds = 0

            for j in range(len(bleed_stacks)):
                bleed_damage, turns_left = bleed_stacks[j]
                if turns_left > 0:
                    total_bleed_damage += bleed_damage
                    bleed_stacks[active_bleeds] = (bleed_damage, turns_left - 1)
                    active_bleeds += 1
                    if log_file:
                        log_file.write(f"  Enemy {i+1} bleed: {bleed_damage} damage ({turns_left} -> {turns_left-1} turns remaining)\n")

            # Trim the list to active bleeds only
            bleed_stacks[:] = bleed_stacks[:active_bleeds]
            enemy['hp'] -= total_bleed_damage

            if log_file and total_bleed_damage > 0:
                log_file.write(f"  Enemy {i+1} takes {total_bleed_damage} bleed damage: {enemy['hp'] + total_bleed_damage} -> {enemy['hp']} HP\n")

            if enemy['hp'] <= 0:
                enemies_killed_by_bleed.append(i+1)

        if enemies_killed_by_bleed:
            if log_file:
                log_file.write(f"\n ENEMIES {', '.join(map(str, enemies_killed_by_bleed))} DIE FROM BLEED DAMAGE!\n")

        # Check if all enemies are dead
        if not any(enemy['hp'] > 0 for enemy in enemies):
            break

        # Make attack
        if log_file:
            log_file.write(f"\nATTACK PHASE:\n")

        # Determine if this is an AOE attack
        # Handle both AttackBuild and MultiAttackBuild
        if hasattr(build, 'attack_type'):
            is_aoe = build.attack_type in ['area', 'direct_area_damage']
        else:
            # MultiAttackBuild - check if any of its builds are AOE
            is_aoe = any(b.attack_type in ['area', 'direct_area_damage'] for b in build.builds)

        # Initialize turn tracking variables
        charged_this_turn = False
        total_damage_dealt = 0

        if is_aoe:
            # AOE attacks hit all alive enemies
            alive_enemies = [(i, enemy) for i, enemy in enumerate(enemies) if enemy['hp'] > 0]

            # Use the AOE attack function for proper shared damage rolls
            attack_results, total_damage_dealt = make_aoe_attack(
                attacker, defender, build, alive_enemies, log_file=log_file,
                turn_number=turns, charge_history=charge_history, cooldown_history=cooldown_history
            )

            # Check if we got a charge condition instead of attack results
            if attack_results and attack_results[0][1] == 0 and 'charge' in attack_results[0][2]:
                charged_this_turn = True
                total_damage_dealt = 0
                if log_file:
                    log_file.write(f"  CHARGING UP instead of attacking!\n")
            else:
                enemies_hit = []

                # Apply results to each target
                for target_idx, damage, conditions in attack_results:
                    enemy = enemies[target_idx]
                    enemy['hp'] -= damage

                    if damage > 0:
                        enemies_hit.append(target_idx+1)

                    # Check for finishing blow after damage is applied
                    finishing_conditions = [c for c in conditions if c.startswith('finishing_')]
                    if finishing_conditions and enemy['hp'] > 0:  # Only check if enemy still alive
                        threshold = int(finishing_conditions[0].split('_')[1])
                        if enemy['hp'] <= threshold:
                            if log_file:
                                log_file.write(f"     FINISHING BLOW! Enemy {target_idx+1} at {enemy['hp']} HP (≤{threshold}) - DEFEATED!\n")
                            enemy['hp'] = 0  # Enemy is defeated

                    # Check for culling strike after damage is applied
                    if 'culling_strike' in conditions and enemy['hp'] > 0:  # Only check if enemy still alive
                        culling_threshold = enemy['max_hp'] // 5  # 1/5 of maximum HP
                        if enemy['hp'] <= culling_threshold:
                            if log_file:
                                log_file.write(f"     CULLING STRIKE! Enemy {target_idx+1} at {enemy['hp']} HP (≤{culling_threshold}, 1/5 of {enemy['max_hp']}) - DEFEATED!\n")
                            enemy['hp'] = 0  # Enemy is defeated

                    # Apply conditions to this enemy
                    if 'bleed' in conditions:
                        old_bleed_count = len(enemy['bleed_stacks'])
                        bleed_damage = max(0, damage - attacker.tier)  # Reduce by tier
                        enemy['bleed_stacks'] = [(bleed_damage, 2)]  # Same damage for 2 more turns
                        if log_file:
                            log_file.write(f"     BLEED APPLIED to Enemy {target_idx+1}: {bleed_damage} damage for 2 turns (reduced from {damage} by tier {attacker.tier})\n")
                            if old_bleed_count > 0:
                                log_file.write(f"      (Replaced {old_bleed_count} existing bleed stacks)\n")

                # Check for splinter effects after all damage processing
                splinter_attacks = 0
                max_splinter_attacks = attacker.tier // 2 if attacker.tier % 2 == 0 else (attacker.tier + 1) // 2  # Tier/2 rounded up
                enemies_defeated_this_attack = [i for i, enemy in enumerate(enemies) if enemy['hp'] <= 0 and enemy['max_hp'] > 0]

                for target_idx, damage, conditions in attack_results:
                    if 'splinter' in conditions and target_idx in enemies_defeated_this_attack and splinter_attacks < max_splinter_attacks:
                        # Find next alive enemy for splinter attack
                        next_target = None
                        next_target_idx = None
                        for i, enemy in enumerate(enemies):
                            if enemy['hp'] > 0 and i != target_idx:
                                next_target = enemy
                                next_target_idx = i
                                break

                        if next_target:
                            splinter_attacks += 1
                            if log_file:
                                log_file.write(f"     SPLINTER! Enemy {target_idx+1} defeated, attacking Enemy {next_target_idx+1} (attack {splinter_attacks}/{max_splinter_attacks})\n")

                            # Make splinter attack (single target, not AOE)
                            splinter_damage, splinter_conditions = make_attack(attacker, defender, build, log_file=log_file,
                                                                              turn_number=turns, charge_history=charge_history, cooldown_history=cooldown_history)
                            next_target['hp'] -= splinter_damage
                            total_damage_dealt += splinter_damage

                            # Apply splinter attack conditions
                            if 'bleed' in splinter_conditions:
                                old_bleed_count = len(next_target['bleed_stacks'])
                                bleed_damage = max(0, splinter_damage - attacker.tier)
                                next_target['bleed_stacks'] = [(bleed_damage, 2)]
                                if log_file:
                                    log_file.write(f"     BLEED APPLIED to Enemy {next_target_idx+1}: {bleed_damage} damage for 2 turns\n")

                if log_file:
                    log_file.write(f"\n  AOE ATTACK SUMMARY:\n")
                    log_file.write(f"    Enemies hit: {enemies_hit if enemies_hit else 'None'}\n")
                    log_file.write(f"    Splinter attacks: {splinter_attacks}\n")
                    log_file.write(f"    Total damage dealt: {total_damage_dealt}\n")

        else:
            # Single target attack - target first alive enemy
            target_enemy = None
            target_idx = None
            for i, enemy in enumerate(enemies):
                if enemy['hp'] > 0:
                    target_enemy = enemy
                    target_idx = i
                    break

            if target_enemy:
                if log_file:
                    log_file.write(f"  Single target attack on Enemy {target_idx+1}\n")

                damage, conditions = make_attack(attacker, defender, build, log_file=log_file,
                                                turn_number=turns, charge_history=charge_history, cooldown_history=cooldown_history)

                # Check if we got a charge condition instead of doing damage
                if damage == 0 and 'charge' in conditions:
                    charged_this_turn = True
                    total_damage_dealt = 0
                    if log_file:
                        log_file.write(f"  CHARGING UP instead of attacking!\n")
                else:
                    target_enemy['hp'] -= damage
                    total_damage_dealt = damage

                    if log_file:
                        log_file.write(f"\n  ATTACK RESULT:\n")
                        log_file.write(f"    Damage dealt to Enemy {target_idx+1}: {damage}\n")
                        log_file.write(f"    Enemy {target_idx+1} HP: {target_enemy['hp'] + damage} -> {target_enemy['hp']}\n")

                    # Check for finishing blow after damage is applied
                    finishing_conditions = [c for c in conditions if c.startswith('finishing_')]
                    if finishing_conditions and target_enemy['hp'] > 0:  # Only check if enemy still alive
                        threshold = int(finishing_conditions[0].split('_')[1])
                        if target_enemy['hp'] <= threshold:
                            if log_file:
                                log_file.write(f"     FINISHING BLOW! Enemy {target_idx+1} at {target_enemy['hp']} HP (≤{threshold}) - DEFEATED!\n")
                            target_enemy['hp'] = 0  # Enemy is defeated

                    # Check for culling strike after damage is applied
                    if 'culling_strike' in conditions and target_enemy['hp'] > 0:  # Only check if enemy still alive
                        culling_threshold = target_enemy['max_hp'] // 5  # 1/5 of maximum HP
                        if target_enemy['hp'] <= culling_threshold:
                            if log_file:
                                log_file.write(f"     CULLING STRIKE! Enemy {target_idx+1} at {target_enemy['hp']} HP (≤{culling_threshold}, 1/5 of {target_enemy['max_hp']}) - DEFEATED!\n")
                            target_enemy['hp'] = 0  # Enemy is defeated

                    # Apply conditions to target
                    if 'bleed' in conditions:
                        old_bleed_count = len(target_enemy['bleed_stacks'])
                        bleed_damage = max(0, damage - attacker.tier)  # Reduce by tier
                        target_enemy['bleed_stacks'] = [(bleed_damage, 2)]  # Same damage for 2 more turns
                        if log_file:
                            log_file.write(f"     BLEED APPLIED to Enemy {target_idx+1}: {bleed_damage} damage for 2 turns (reduced from {damage} by tier {attacker.tier})\n")
                            if old_bleed_count > 0:
                                log_file.write(f"      (Replaced {old_bleed_count} existing bleed stacks)\n")

                    # Check for splinter effects if target was defeated
                    if 'splinter' in conditions and target_enemy['hp'] <= 0:
                        splinter_attacks = 0
                        max_splinter_attacks = attacker.tier // 2 if attacker.tier % 2 == 0 else (attacker.tier + 1) // 2  # Tier/2 rounded up

                        while splinter_attacks < max_splinter_attacks:
                            # Find next alive enemy for splinter attack
                            next_target = None
                            next_target_idx = None
                            for i, enemy in enumerate(enemies):
                                if enemy['hp'] > 0:
                                    next_target = enemy
                                    next_target_idx = i
                                    break

                            if not next_target:
                                break  # No more alive enemies

                            splinter_attacks += 1
                            if log_file:
                                log_file.write(f"     SPLINTER! Enemy {target_idx+1} defeated, attacking Enemy {next_target_idx+1} (attack {splinter_attacks}/{max_splinter_attacks})\n")

                            # Make splinter attack
                            splinter_damage, splinter_conditions = make_attack(attacker, defender, build, log_file=log_file,
                                                                              turn_number=turns, charge_history=charge_history, cooldown_history=cooldown_history)
                            next_target['hp'] -= splinter_damage
                            total_damage_dealt += splinter_damage

                            # Apply splinter attack conditions
                            if 'bleed' in splinter_conditions:
                                old_bleed_count = len(next_target['bleed_stacks'])
                                bleed_damage = max(0, splinter_damage - attacker.tier)
                                next_target['bleed_stacks'] = [(bleed_damage, 2)]
                                if log_file:
                                    log_file.write(f"     BLEED APPLIED to Enemy {next_target_idx+1}: {bleed_damage} damage for 2 turns\n")

                            # Check if this splinter attack also defeated an enemy (recursive splinter)
                            if next_target['hp'] <= 0:
                                if log_file:
                                    log_file.write(f"     Splinter attack defeated Enemy {next_target_idx+1}!\n")
                                # Continue the loop to potentially trigger more splinter attacks
                            else:
                                break  # Splinter chain ends if enemy not defeated

        # Update charge history: True if charged this turn, False if attacked
        charge_history.append(charged_this_turn)
        # Keep only last 2 entries for charge_up_2 tracking
        if len(charge_history) > 2:
            charge_history.pop(0)

        # DEFENDER ATTACK PHASE - Enemies attack back
        if any(enemy['hp'] > 0 for enemy in enemies):
            if log_file:
                log_file.write(f"\nDEFENDER ATTACK PHASE:\n")

            # Create a basic ranged attack build for defenders (no upgrades, no limits)
            from src.models import AttackBuild
            defender_build = AttackBuild('ranged', [], [])

            total_defender_damage = 0
            for i, enemy in enumerate(enemies):
                if enemy['hp'] <= 0:
                    continue  # Dead enemies don't attack

                if log_file:
                    log_file.write(f"  Enemy {i+1} attacks attacker:\n")

                # Create a character for this enemy using defender stats
                enemy_attacker = Character(
                    focus=defender.focus,
                    power=defender.power,
                    mobility=defender.mobility,
                    endurance=defender.endurance,
                    tier=defender.tier,
                    max_hp=enemy['max_hp']
                )

                # Make the attack
                damage, _ = make_attack(enemy_attacker, attacker, defender_build, log_file=log_file,
                                       turn_number=turns, charge_history=[], cooldown_history={})

                attacker_hp -= damage
                total_defender_damage += damage

                if log_file:
                    log_file.write(f"    Damage dealt to Attacker: {damage}\n")
                    log_file.write(f"    Attacker HP: {attacker_hp + damage} -> {attacker_hp}\n")

                # Log if attacker is defeated (but continue combat)
                if attacker_hp <= 0:
                    if log_file:
                        log_file.write(f"\n  ATTACKER DEFEATED (but combat continues)!\n")

            if log_file:
                log_file.write(f"  Total defender damage this turn: {total_defender_damage}\n")

        if log_file:
            log_file.write(f"\nTURN {turns} SUMMARY:\n")
            total_bleed_damage = sum(sum(bleed_dmg for bleed_dmg, _ in enemy['bleed_stacks']) for enemy in enemies)
            total_attack_damage = total_damage_dealt
            if charged_this_turn:
                log_file.write(f"  Action taken: CHARGED UP\n")
            log_file.write(f"  Total bleed damage: {total_bleed_damage}\n")
            log_file.write(f"  Total attack damage: {total_attack_damage}\n")
            log_file.write(f"  Total damage this turn: {total_bleed_damage + total_attack_damage}\n")

            alive_count = sum(1 for enemy in enemies if enemy['hp'] > 0)
            log_file.write(f"  Enemies remaining: {alive_count}/{num_enemies}\n")

            for i, enemy in enumerate(enemies):
                if enemy['hp'] <= 0 and enemy['max_hp'] > 0:  # Recently killed
                    log_file.write(f"   Enemy {i+1} DEFEATED!\n")
                    enemy['max_hp'] = 0  # Mark as logged

    # Determine combat outcome (only win or timeout - attacker can go negative)
    if all(enemy['hp'] <= 0 for enemy in enemies):
        outcome = "win"
        if log_file:
            log_file.write(f"\nCombat ended in {turns} turns\n")
            log_file.write(f"All {num_enemies} enemies defeated - Combat Won!\n")
            if attacker_hp <= 0:
                log_file.write(f"Attacker HP at end: {attacker_hp}/{attacker_max_hp} (went negative but still won)\n")
            else:
                log_file.write(f"Attacker HP at end: {attacker_hp}/{attacker_max_hp}\n")
            log_file.write("="*50 + "\n")
    else:
        outcome = "timeout"
        if log_file:
            log_file.write(f"\nCombat timed out after {turns} turns\n")
            log_file.write(f"Attacker HP: {attacker_hp}/{attacker_max_hp}")
            if attacker_hp <= 0:
                log_file.write(f" (went negative)")
            log_file.write(f"\n")
            alive_count = sum(1 for enemy in enemies if enemy['hp'] > 0)
            log_file.write(f"Enemies remaining: {alive_count}/{num_enemies}\n")
            log_file.write("="*50 + "\n")

    return turns, outcome


def run_simulation_batch(attacker: Character, build: AttackBuild, num_runs: int = 10,
                        target_hp: int = 100, defender: Character = None,
                        num_enemies: int = 1, enemy_hp: int = None, max_turns: int = 100,
                        enemy_hp_list: List[int] = None) -> Tuple[List[int], float, float, dict]:
    """Run multiple combat simulations and return results with win/loss tracking

    Args:
        enemy_hp_list: Optional list of HP values for mixed enemy groups.
                       If provided, overrides num_enemies and enemy_hp.

    Returns:
        Tuple of (individual_results, average_turns, damage_per_turn, outcome_stats)
        where outcome_stats = {"wins": int, "losses": int, "timeouts": int, "win_rate": float}
    """
    # Pre-allocate results list for better memory efficiency
    results = [0] * num_runs
    result_outcomes = []  # Track outcome for each run
    outcomes = {"win": 0, "loss": 0, "timeout": 0}

    # Calculate total HP pool once - support both homogeneous and mixed groups
    if enemy_hp_list:
        total_hp_pool = sum(enemy_hp_list)
    else:
        total_hp_pool = (enemy_hp if enemy_hp else target_hp) * num_enemies

    for i in range(num_runs):
        turns, outcome = simulate_combat_verbose(attacker, build, target_hp, defender=defender,
                                      num_enemies=num_enemies, enemy_hp=enemy_hp, max_turns=max_turns,
                                      enemy_hp_list=enemy_hp_list)
        results[i] = turns
        result_outcomes.append(outcome)
        outcomes[outcome] += 1

    # Calculate stats from ALL runs (not just wins) - attacker can go negative
    avg_turns = sum(results) / num_runs if num_runs > 0 else 0
    dpt = total_hp_pool / avg_turns if avg_turns > 0 else 0

    # Prepare outcome statistics
    outcome_stats = {
        "wins": outcomes["win"],
        "losses": outcomes["loss"],
        "timeouts": outcomes["timeout"],
        "win_rate": (outcomes["win"] / num_runs * 100) if num_runs > 0 else 0
    }

    return results, avg_turns, dpt, outcome_stats