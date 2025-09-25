"""
Combat simulation logic for the Vitality System.
"""

from typing import List, Tuple
from models import Character, AttackBuild
from combat import make_attack, make_aoe_attack


def simulate_combat_verbose(attacker: Character, build: AttackBuild, target_hp: int = 100,
                          log_file=None, defender: Character = None, num_enemies: int = 1,
                          enemy_hp: int = None) -> int:
    """Simulate combat until all targets die, return number of turns"""

    # Use provided defender or create dummy defender for the test case
    if defender is None:
        defender = Character(focus=0, power=0, mobility=3, endurance=0, tier=attacker.tier)

    # Set enemy HP - use target_hp if enemy_hp not specified
    if enemy_hp is None:
        enemy_hp = target_hp

    # Initialize multiple enemies
    enemies = [{'hp': enemy_hp, 'max_hp': enemy_hp, 'bleed_stacks': []} for _ in range(num_enemies)]

    if log_file:
        log_file.write(f"\n{'='*80}\n")
        log_file.write(f"COMBAT SIMULATION - DETAILED ANALYSIS\n")
        log_file.write(f"{'='*80}\n")
        log_file.write(f"ATTACKER STATS:\n")
        log_file.write(f"  Focus: {attacker.focus} | Power: {attacker.power} | Mobility: {attacker.mobility} | Endurance: {attacker.endurance} | Tier: {attacker.tier}\n")
        log_file.write(f"DEFENDER STATS:\n")
        log_file.write(f"  Focus: {defender.focus} | Power: {defender.power} | Mobility: {defender.mobility} | Endurance: {defender.endurance} | Tier: {defender.tier}\n")
        log_file.write(f"  Avoidance: {defender.avoidance} | Durability: {defender.durability} | Max HP: {defender.max_hp}\n")
        log_file.write(f"BUILD CONFIGURATION:\n")
        log_file.write(f"  Attack Type: {build.attack_type}")
        if build.attack_type == 'melee':
            # In original, melee_choice was hardcoded to 'damage'
            log_file.write(f" (choosing +{attacker.tier} damage)")
        log_file.write(f"\n  Upgrades: {', '.join(build.upgrades) if build.upgrades else 'None'}\n")
        log_file.write(f"  Limits: {', '.join(build.limits) if build.limits else 'None'}\n")
        log_file.write(f"  Total Cost: {build.total_cost} points\n")
        log_file.write(f"COMBAT PARAMETERS:\n")
        log_file.write(f"  Number of Enemies: {num_enemies}\n")
        log_file.write(f"  Enemy HP: {enemy_hp} each\n")
        log_file.write(f"  Total HP Pool: {num_enemies * enemy_hp}\n")
        log_file.write(f"  Combat Length Limit: 100 turns\n")
        log_file.write(f"{'='*80}\n\n")

    turns = 0
    charge_history = []  # Track charging actions: True = charged, False = attacked

    while any(enemy['hp'] > 0 for enemy in enemies) and turns < 100:  # Safety limit
        turns += 1
        if log_file:
            log_file.write(f"\n{'='*60}\n")
            log_file.write(f"TURN {turns} - START\n")
            log_file.write(f"{'='*60}\n")
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

            total_bleed_damage = 0
            new_bleed_stacks = []

            for bleed_damage, turns_left in enemy['bleed_stacks']:
                if turns_left > 0:
                    total_bleed_damage += bleed_damage
                    new_bleed_stacks.append((bleed_damage, turns_left - 1))
                    if log_file:
                        log_file.write(f"  Enemy {i+1} bleed: {bleed_damage} damage ({turns_left} -> {turns_left-1} turns remaining)\n")

            enemy['bleed_stacks'] = new_bleed_stacks
            enemy['hp'] -= total_bleed_damage

            if log_file and total_bleed_damage > 0:
                log_file.write(f"  Enemy {i+1} takes {total_bleed_damage} bleed damage: {enemy['hp'] + total_bleed_damage} -> {enemy['hp']} HP\n")

            if enemy['hp'] <= 0:
                enemies_killed_by_bleed.append(i+1)

        if enemies_killed_by_bleed:
            if log_file:
                log_file.write(f"\n💀 ENEMIES {', '.join(map(str, enemies_killed_by_bleed))} DIE FROM BLEED DAMAGE!\n")

        # Check if all enemies are dead
        if not any(enemy['hp'] > 0 for enemy in enemies):
            break

        # Make attack
        if log_file:
            log_file.write(f"\nATTACK PHASE:\n")

        # Determine if this is an AOE attack
        is_aoe = build.attack_type in ['area', 'direct_area_damage']

        if is_aoe:
            # AOE attacks hit all alive enemies
            alive_enemies = [(i, enemy) for i, enemy in enumerate(enemies) if enemy['hp'] > 0]

            # Use the AOE attack function for proper shared damage rolls
            attack_results, total_damage_dealt = make_aoe_attack(
                attacker, defender, build, alive_enemies, log_file=log_file,
                turn_number=turns, charge_history=charge_history
            )

            enemies_hit = []

            # Apply results to each target
            for target_idx, damage, conditions in attack_results:
                enemy = enemies[target_idx]
                enemy['hp'] -= damage

                if damage > 0:
                    enemies_hit.append(target_idx+1)

                # Apply conditions to this enemy
                if 'bleed' in conditions:
                    old_bleed_count = len(enemy['bleed_stacks'])
                    enemy['bleed_stacks'] = [(damage, 2)]  # Same damage for 2 more turns
                    if log_file:
                        log_file.write(f"    🩸 BLEED APPLIED to Enemy {target_idx+1}: {damage} damage for 2 turns\n")
                        if old_bleed_count > 0:
                            log_file.write(f"      (Replaced {old_bleed_count} existing bleed stacks)\n")

            if log_file:
                log_file.write(f"\n  AOE ATTACK SUMMARY:\n")
                log_file.write(f"    Enemies hit: {enemies_hit if enemies_hit else 'None'}\n")
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
                                                turn_number=turns, charge_history=charge_history)

                target_enemy['hp'] -= damage

                if log_file:
                    log_file.write(f"\n  ATTACK RESULT:\n")
                    log_file.write(f"    Damage dealt to Enemy {target_idx+1}: {damage}\n")
                    log_file.write(f"    Enemy {target_idx+1} HP: {target_enemy['hp'] + damage} -> {target_enemy['hp']}\n")

                # Apply conditions to target
                if 'bleed' in conditions:
                    old_bleed_count = len(target_enemy['bleed_stacks'])
                    target_enemy['bleed_stacks'] = [(damage, 2)]  # Same damage for 2 more turns
                    if log_file:
                        log_file.write(f"    🩸 BLEED APPLIED to Enemy {target_idx+1}: {damage} damage for 2 turns\n")
                        if old_bleed_count > 0:
                            log_file.write(f"      (Replaced {old_bleed_count} existing bleed stacks)\n")

        if log_file:
            log_file.write(f"\nTURN {turns} SUMMARY:\n")
            total_bleed_damage = sum(sum(bleed_dmg for bleed_dmg, _ in enemy['bleed_stacks']) for enemy in enemies)
            total_attack_damage = total_damage_dealt if is_aoe else (damage if 'damage' in locals() else 0)
            log_file.write(f"  Total bleed damage: {total_bleed_damage}\n")
            log_file.write(f"  Total attack damage: {total_attack_damage}\n")
            log_file.write(f"  Total damage this turn: {total_bleed_damage + total_attack_damage}\n")

            alive_count = sum(1 for enemy in enemies if enemy['hp'] > 0)
            log_file.write(f"  Enemies remaining: {alive_count}/{num_enemies}\n")

            for i, enemy in enumerate(enemies):
                if enemy['hp'] <= 0 and enemy['max_hp'] > 0:  # Recently killed
                    log_file.write(f"  💀 Enemy {i+1} DEFEATED!\n")
                    enemy['max_hp'] = 0  # Mark as logged

    if log_file:
        log_file.write(f"\nCombat ended in {turns} turns\n")
        log_file.write(f"All {num_enemies} enemies defeated!\n")
        log_file.write("="*50 + "\n")

    return turns


def run_simulation_batch(attacker: Character, build: AttackBuild, num_runs: int = 10,
                        target_hp: int = 100, defender: Character = None,
                        num_enemies: int = 1, enemy_hp: int = None) -> Tuple[List[int], float, float]:
    """Run multiple combat simulations and return results

    Returns:
        Tuple of (individual_results, average_turns, damage_per_turn)
    """
    results = []

    for _ in range(num_runs):
        turns = simulate_combat_verbose(attacker, build, target_hp, defender=defender,
                                      num_enemies=num_enemies, enemy_hp=enemy_hp)
        results.append(turns)

    avg_turns = sum(results) / len(results)
    total_hp_pool = (enemy_hp if enemy_hp else target_hp) * num_enemies
    dpt = total_hp_pool / avg_turns if avg_turns > 0 else 0

    return results, avg_turns, dpt