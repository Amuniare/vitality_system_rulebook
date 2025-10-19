"""
Combat simulation logic for the Vitality System.
"""

from typing import List, Tuple
from src.models import Character, AttackBuild, MultiAttackBuild
from src.combat import make_attack, make_aoe_attack


def rank_attacks_by_scenario(builds: List[AttackBuild], enemies: List[dict]) -> List[int]:
    """
    Rank attacks for versatile_master based on current combat scenario.

    Returns:
        List of attack indices in priority order (best to worst)
    """
    num_alive = sum(1 for e in enemies if e['hp'] > 0)
    total_hp = sum(e['hp'] for e in enemies if e['hp'] > 0)
    avg_hp_per_enemy = total_hp / num_alive if num_alive > 0 else 0

    scores = []
    for idx, build in enumerate(builds):
        score = 0

        # Score based on attack type match
        is_aoe = build.attack_type in ['area', 'direct_area_damage']

        if num_alive >= 5:
            # Swarm scenario - heavily prefer AOE
            score += 100 if is_aoe else -50
        elif num_alive >= 3:
            # Multi-target - prefer AOE
            score += 50 if is_aoe else 0
        elif num_alive == 1:
            # Boss/single target - prefer single-target attacks
            score += 50 if not is_aoe else -30
        else:
            # 2 enemies - slight preference for single-target
            score += 20 if not is_aoe else 10

        # Score based on upgrade synergies
        for upgrade in build.upgrades:
            # Boss slayer upgrades
            if upgrade in ['boss_slayer_acc', 'boss_slayer_dmg']:
                if num_alive == 1 and avg_hp_per_enemy > 50:
                    score += 40  # Great for single high-HP targets
                elif num_alive <= 2:
                    score += 20  # Still good for focused targets
                else:
                    score -= 10  # Not ideal for swarms

            # Culling strike - good for multiple lower HP enemies
            elif upgrade == 'culling_strike':
                if num_alive >= 3 and avg_hp_per_enemy < 40:
                    score += 30  # Excellent for cleaning up wounded enemies
                elif num_alive >= 2:
                    score += 15

            # Channeled - good for sustained single-target damage
            elif upgrade == 'channeled':
                if num_alive == 1:
                    score += 25  # Great for boss fights
                elif num_alive <= 2:
                    score += 10
                else:
                    score -= 15  # Bad for swarms (need to switch targets)

            # Powerful/deadly critical - generally good
            elif upgrade in ['powerful_critical', 'deadly_critical']:
                score += 10

            # Area enhancers (already covered by is_aoe scoring)
            elif upgrade in ['wide_area', 'devastating_area']:
                pass  # Already scored via is_aoe

        # Slight penalty for limits (they may restrict usage)
        if build.limits:
            score -= 5 * len(build.limits)

        scores.append((idx, score))

    # Sort by score descending, return indices
    scores.sort(key=lambda x: x[1], reverse=True)
    return [idx for idx, _ in scores]


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

    # Pre-calculate expected damages for dual_natured intelligent attack selection
    expected_damages = None
    if isinstance(build, MultiAttackBuild) and build.archetype == 'dual_natured':
        from src.damage_calculator import calculate_all_expected_damages
        expected_damages = calculate_all_expected_damages(build.builds, attacker, defender, build.tier_bonus)

    # Initialize combat state for new limit mechanics
    combat_state = {
        'last_target_hit': None,
        'defeated_enemy_last_turn': False,
        'dealt_damage_last_turn': False,
        'was_hit_last_turn': False,
        'was_damaged_last_turn': False,
        'all_attacks_missed_last_turn': False,
        'was_hit_no_damage_last_turn': False,
        'was_attacked_last_turn': False,
        'channeled_turns': 0,
        'charges_used': {},
        'leech_hp': 0,
        'attrition_cost': 0,
        'hit_same_target_last_turn': False,
    }

    while any(enemy['hp'] > 0 for enemy in enemies) and turns < max_turns:
        turns += 1
        if log_file:
            log_file.write(f"\n{'='*60}\n")
            log_file.write(f"TURN {turns} - START\n")
            log_file.write(f"{'='*60}\n")
            log_file.write(f"Attacker HP: {attacker_hp}/{attacker_max_hp} ({attacker_hp/attacker_max_hp*100:.1f}%)\n")
            alive_enemies = [i for i, enemy in enumerate(enemies) if enemy['hp'] > 0]
            total_hp = sum(enemy['hp'] for enemy in enemies)
            max_total_hp = sum(enemy['max_hp'] for enemy in enemies)
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
            enemy['hp'] = max(0, enemy['hp'] - total_bleed_damage)

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

        # Determine which attack build to use (handle MultiAttackBuild with intelligent fallback)
        active_build = build
        active_build_idx = None  # Track which attack index is being used
        tier_bonus = 0  # Tier bonus for fallback attacks

        if isinstance(build, MultiAttackBuild):
            # MultiAttackBuild - implement intelligent attack selection
            if build.archetype == 'dual_natured' and len(build.builds) == 2:
                from src.combat import can_activate_limit
                from src.damage_calculator import is_aoe_attack

                # Dual natured: primary (index 0) with upgrades/limits, fallback (index 1) basic attack
                primary_build = build.builds[0]
                fallback_build = build.builds[1]
                tier_bonus = build.tier_bonus  # Apply tier bonus to fallback

                # Check if primary can activate (all limit conditions met)
                can_use_primary = all(
                    can_activate_limit(limit, turns, attacker_hp, attacker_max_hp, combat_state, charge_history, cooldown_history)
                    for limit in primary_build.limits
                )

                # Calculate current enemy state
                num_alive = sum(1 for e in enemies if e['hp'] > 0)

                # Choose attack based on expected damage + availability
                if can_use_primary:
                    # Compare primary vs fallback using pre-calculated expected damages
                    primary_exp = expected_damages[0]
                    # For AOE fallback, scale by number of alive enemies
                    fallback_exp = expected_damages[1]
                    if is_aoe_attack(fallback_build):
                        fallback_exp *= num_alive

                    # Choose higher expected damage
                    if primary_exp >= fallback_exp:
                        active_build = primary_build
                        active_build_idx = 0
                        tier_bonus = 0  # No tier bonus for primary
                        if log_file:
                            log_file.write(f"  Using primary attack (exp dmg: {primary_exp:.1f} vs fallback: {fallback_exp:.1f})\n")
                    else:
                        active_build = fallback_build
                        active_build_idx = 1
                        if log_file:
                            log_file.write(f"  Using fallback attack (exp dmg: {fallback_exp:.1f} vs primary: {primary_exp:.1f})\n")
                else:
                    # Primary unavailable - use fallback
                    active_build = fallback_build
                    active_build_idx = 1
                    if log_file:
                        log_file.write(f"  Primary unavailable this turn, using fallback\n")
            else:
                # For versatile_master - use intelligent scenario-based attack selection
                attack_priority = rank_attacks_by_scenario(build.builds, enemies)

                # Try attacks in priority order, falling back if unavailable
                active_build = None
                for priority_idx in attack_priority:
                    candidate_build = build.builds[priority_idx]

                    # Test if this attack can be used this turn
                    try:
                        test_damage, test_conditions = make_attack(
                            attacker, defender, candidate_build, allow_multi=False, log_file=None,
                            turn_number=turns, charge_history=charge_history if charge_history is not None else [],
                            cooldown_history=cooldown_history if cooldown_history is not None else {},
                            attacker_hp=attacker_hp, attacker_max_hp=attacker_max_hp, combat_state=combat_state
                        )
                    except Exception as e:
                        # If test fails, try next attack
                        test_damage = 0
                        test_conditions = []

                    # If attack succeeds (or would charge), use it
                    if test_damage > 0 or 'charge' in test_conditions:
                        active_build = candidate_build
                        active_build_idx = priority_idx
                        if log_file:
                            if priority_idx == attack_priority[0]:
                                log_file.write(f"  Using Attack {priority_idx+1} (optimal for scenario)\n")
                            else:
                                log_file.write(f"  Using Attack {priority_idx+1} (fallback - higher priority attacks unavailable)\n")
                        break

                # If no attack worked (shouldn't happen), use first as last resort
                if active_build is None:
                    active_build = build.builds[0]
                    active_build_idx = 0
                    if log_file:
                        log_file.write(f"  Using Attack 1 (emergency fallback)\n")

            # Record which attack was used for tracking
            build.record_attack_usage(active_build_idx)

        # Determine if this is an AOE attack
        if hasattr(active_build, 'attack_type'):
            is_aoe = active_build.attack_type in ['area', 'direct_area_damage']
        else:
            is_aoe = False

        # Initialize turn tracking variables
        charged_this_turn = False
        total_damage_dealt = 0

        if is_aoe:
            # AOE attacks hit all alive enemies
            alive_enemies = [(i, enemy) for i, enemy in enumerate(enemies) if enemy['hp'] > 0]

            # Use the AOE attack function for proper shared damage rolls
            attack_results, total_damage_dealt = make_aoe_attack(
                attacker, defender, active_build, alive_enemies, log_file=log_file,
                turn_number=turns, charge_history=charge_history, cooldown_history=cooldown_history,
                attacker_hp=attacker_hp, attacker_max_hp=attacker_max_hp, combat_state=combat_state,
                tier_bonus=tier_bonus
            )

            # Check if we got a charge condition instead of attack results
            if attack_results and attack_results[0][1] == 0 and 'charge' in attack_results[0][2]:
                charged_this_turn = True
                total_damage_dealt = 0
                if log_file:
                    log_file.write(f"  CHARGING UP instead of attacking!\n")
            # Check if we need to fallback to basic attack
            elif attack_results and attack_results[0][1] == 0 and 'basic_attack' in attack_results[0][2]:
                if log_file:
                    log_file.write(f"  Limit failed - falling back to BASIC ATTACK (no upgrades/limits)\n")
                # Create a basic attack build with same attack type but no upgrades/limits
                from src.models import AttackBuild
                basic_build = AttackBuild(active_build.attack_type, [], [])
                # Re-run attack with basic build
                attack_results, total_damage_dealt = make_aoe_attack(
                    attacker, defender, basic_build, alive_enemies, log_file=log_file,
                    turn_number=turns, charge_history=charge_history, cooldown_history=cooldown_history,
                    attacker_hp=attacker_hp, attacker_max_hp=attacker_max_hp, combat_state=combat_state,
                    tier_bonus=tier_bonus
                )
                # Apply damage from basic attack
                enemies_hit = []
                for enemy_idx, damage, conditions in attack_results:
                    if damage > 0:
                        enemies[enemy_idx]['hp'] = max(0, enemies[enemy_idx]['hp'] - damage)
                        enemies_hit.append(enemy_idx)
                        if enemies[enemy_idx]['hp'] <= 0:
                            enemies[enemy_idx]['defeated_this_turn'] = True
            else:
                enemies_hit = []

                # Apply results to each target
                for target_idx, damage, conditions in attack_results:
                    enemy = enemies[target_idx]
                    enemy['hp'] = max(0, enemy['hp'] - damage)

                    if damage > 0:
                        enemies_hit.append(target_idx+1)

                    # Check for finishing blow after damage is applied
                    finishing_conditions = [c for c in conditions if c.startswith('finishing_')]
                    if finishing_conditions and enemy['hp'] > 0:  # Only check if enemy still alive
                        threshold = int(finishing_conditions[0].split('_')[1])
                        if enemy['hp'] <= threshold:
                            if log_file:
                                log_file.write(f"     FINISHING BLOW! Enemy {target_idx+1} at {enemy['hp']} HP (<={threshold}) - DEFEATED!\n")
                            enemy['hp'] = 0  # Enemy is defeated

                    # Check for culling strike after damage is applied
                    if 'culling_strike' in conditions and enemy['hp'] > 0:  # Only check if enemy still alive
                        culling_threshold = enemy['max_hp'] // 5  # 1/5 of maximum HP
                        if enemy['hp'] <= culling_threshold:
                            if log_file:
                                log_file.write(f"     CULLING STRIKE! Enemy {target_idx+1} at {enemy['hp']} HP (<={culling_threshold}, 1/5 of {enemy['max_hp']}) - DEFEATED!\n")
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
                            splinter_damage, splinter_conditions = make_attack(attacker, defender, active_build, log_file=log_file,
                                                                              turn_number=turns, charge_history=charge_history, cooldown_history=cooldown_history,
                                                                              attacker_hp=attacker_hp, attacker_max_hp=attacker_max_hp, combat_state=combat_state,
                                                                              tier_bonus=tier_bonus)
                            next_target['hp'] = max(0, next_target['hp'] - splinter_damage)
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

                damage, conditions = make_attack(attacker, defender, active_build, log_file=log_file,
                                                turn_number=turns, charge_history=charge_history, cooldown_history=cooldown_history,
                                                attacker_hp=attacker_hp, attacker_max_hp=attacker_max_hp, combat_state=combat_state,
                                                enemy_max_hp=target_enemy['max_hp'], tier_bonus=tier_bonus)

                # Check if we got a charge condition instead of doing damage
                if damage == 0 and 'charge' in conditions:
                    charged_this_turn = True
                    total_damage_dealt = 0
                    if log_file:
                        log_file.write(f"  CHARGING UP instead of attacking!\n")
                # Check if we need to fallback to basic attack
                elif damage == 0 and 'basic_attack' in conditions:
                    if log_file:
                        log_file.write(f"  Limit failed - falling back to BASIC ATTACK (no upgrades/limits)\n")
                    # Create a basic attack build with same attack type but no upgrades/limits
                    from src.models import AttackBuild
                    basic_build = AttackBuild(active_build.attack_type, [], [])
                    # Re-run attack with basic build
                    damage, conditions = make_attack(attacker, defender, basic_build, log_file=log_file,
                                                    turn_number=turns, charge_history=charge_history, cooldown_history=cooldown_history,
                                                    attacker_hp=attacker_hp, attacker_max_hp=attacker_max_hp, combat_state=combat_state,
                                                    enemy_max_hp=target_enemy['max_hp'], tier_bonus=tier_bonus)
                    # Apply damage from basic attack
                    target_enemy['hp'] = max(0, target_enemy['hp'] - damage)
                    total_damage_dealt = damage
                    if log_file:
                        log_file.write(f"\n  BASIC ATTACK RESULT:\n")
                        log_file.write(f"    Damage dealt to Enemy {target_idx+1}: {damage}\n")
                        log_file.write(f"    Enemy {target_idx+1} HP: {target_enemy['hp'] + damage} -> {target_enemy['hp']}\n")
                    if target_enemy['hp'] <= 0:
                        target_enemy['defeated_this_turn'] = True
                else:
                    target_enemy['hp'] = max(0, target_enemy['hp'] - damage)
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
                                log_file.write(f"     FINISHING BLOW! Enemy {target_idx+1} at {target_enemy['hp']} HP (<={threshold}) - DEFEATED!\n")
                            target_enemy['hp'] = 0  # Enemy is defeated

                    # Check for culling strike after damage is applied
                    if 'culling_strike' in conditions and target_enemy['hp'] > 0:  # Only check if enemy still alive
                        culling_threshold = target_enemy['max_hp'] // 5  # 1/5 of maximum HP
                        if target_enemy['hp'] <= culling_threshold:
                            if log_file:
                                log_file.write(f"     CULLING STRIKE! Enemy {target_idx+1} at {target_enemy['hp']} HP (<={culling_threshold}, 1/5 of {target_enemy['max_hp']}) - DEFEATED!\n")
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
                            splinter_damage, splinter_conditions = make_attack(attacker, defender, active_build, log_file=log_file,
                                                                              turn_number=turns, charge_history=charge_history, cooldown_history=cooldown_history,
                                                                              attacker_hp=attacker_hp, attacker_max_hp=attacker_max_hp, combat_state=combat_state,
                                                                              tier_bonus=tier_bonus)
                            next_target['hp'] = max(0, next_target['hp'] - splinter_damage)
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
        total_defender_damage = 0
        if any(enemy['hp'] > 0 for enemy in enemies):
            if log_file:
                log_file.write(f"\nDEFENDER ATTACK PHASE:\n")

            # Create a basic ranged attack build for defenders (no upgrades, no limits)
            from src.models import AttackBuild
            defender_build = AttackBuild('ranged', [], [])

            # Count alive enemies and limit attacks to 1 per turn
            alive_enemies_count = sum(1 for enemy in enemies if enemy['hp'] > 0)
            attacks_made = 0
            max_attacks_per_turn = 1

            for i, enemy in enumerate(enemies):
                if enemy['hp'] <= 0:
                    continue  # Dead enemies don't attack

                # Limit to 1 attack per turn when there are multiple enemies
                if attacks_made >= max_attacks_per_turn:
                    if log_file and alive_enemies_count > max_attacks_per_turn:
                        remaining_enemies = alive_enemies_count - attacks_made
                        log_file.write(f"  Remaining {remaining_enemies} enemy(ies) cannot attack (max {max_attacks_per_turn} attacks per turn)\n")
                    break

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

                # Make the attack (enemy attacking player, so pass player's max_hp)
                damage, _ = make_attack(enemy_attacker, attacker, defender_build, log_file=log_file,
                                       turn_number=turns, charge_history=[], cooldown_history={},
                                       attacker_hp=attacker_hp, attacker_max_hp=attacker_max_hp,
                                       combat_state=combat_state, enemy_max_hp=attacker_max_hp)

                attacker_hp -= damage
                total_defender_damage += damage
                attacks_made += 1

                if log_file:
                    log_file.write(f"    Damage dealt to Attacker: {damage}\n")
                    log_file.write(f"    Attacker HP: {attacker_hp + damage} -> {attacker_hp}\n")

                # Log if attacker is defeated (but continue combat)
                if attacker_hp <= 0:
                    if log_file:
                        log_file.write(f"\n  ATTACKER DEFEATED (but combat continues)!\n")

            if log_file:
                log_file.write(f"  Total defender damage this turn: {total_defender_damage}\n")

        # Apply HP costs and recovery from combat_state
        if combat_state.get('attrition_cost', 0) > 0:
            attacker_hp -= combat_state['attrition_cost']
            if log_file:
                log_file.write(f"\n  Attrition cost: -{combat_state['attrition_cost']} HP\n")
                log_file.write(f"  Attacker HP: {attacker_hp + combat_state['attrition_cost']} -> {attacker_hp}\n")
            combat_state['attrition_cost'] = 0

        if combat_state.get('leech_hp', 0) > 0:
            attacker_hp = min(attacker_hp + combat_state['leech_hp'], attacker_max_hp)
            if log_file:
                log_file.write(f"\n  Leech recovery: +{combat_state['leech_hp']} HP (capped at max)\n")
                log_file.write(f"  Attacker HP: {attacker_hp - combat_state['leech_hp']} -> {attacker_hp}\n")
            combat_state['leech_hp'] = 0

        # Update combat state for next turn (track what happened this turn)
        # Reset "last turn" trackers
        combat_state['defeated_enemy_last_turn'] = any(enemy['hp'] <= 0 and enemy.get('defeated_this_turn', False) for enemy in enemies)
        combat_state['dealt_damage_last_turn'] = total_damage_dealt > 0 and not charged_this_turn

        # Track if same target was hit (simplified: single target attacks only)
        current_target = None
        if not is_aoe and target_idx is not None:
            current_target = target_idx
        combat_state['hit_same_target_last_turn'] = (current_target is not None and
                                                      current_target == combat_state.get('last_target_hit'))
        combat_state['last_target_hit'] = current_target

        # Defender attack tracking (simplified - assuming all attacks that can hit, did)
        if total_defender_damage > 0:
            combat_state['was_attacked_last_turn'] = True
            combat_state['was_hit_last_turn'] = True
            combat_state['was_damaged_last_turn'] = True
            combat_state['all_attacks_missed_last_turn'] = False
            combat_state['was_hit_no_damage_last_turn'] = False
        else:
            # Check if there were any attacks (alive enemies)
            alive_count = sum(1 for enemy in enemies if enemy['hp'] > 0)
            if alive_count > 0:
                combat_state['was_attacked_last_turn'] = True
                combat_state['all_attacks_missed_last_turn'] = True
                combat_state['was_hit_last_turn'] = False
                combat_state['was_damaged_last_turn'] = False
                combat_state['was_hit_no_damage_last_turn'] = False
            else:
                combat_state['was_attacked_last_turn'] = False
                combat_state['all_attacks_missed_last_turn'] = False
                combat_state['was_hit_last_turn'] = False
                combat_state['was_damaged_last_turn'] = False
                combat_state['was_hit_no_damage_last_turn'] = False

        # Increment channeled turns if using channeled upgrade
        if hasattr(active_build, 'upgrades') and 'channeled' in active_build.upgrades:
            combat_state['channeled_turns'] += 1
        else:
            combat_state['channeled_turns'] = 0

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


def simulate_combat_with_fallback(attacker: Character, primary_build: AttackBuild, fallback_build: AttackBuild,
                                  target_hp: int = 100, log_file=None, defender: Character = None,
                                  num_enemies: int = 1, enemy_hp: int = None, max_turns: int = 100,
                                  enemy_hp_list: List[int] = None) -> Tuple[int, str, dict]:
    """
    Simulate combat with dynamic build switching based on limit conditions.

    On each turn, checks if the primary_build's limits can activate. If not, uses fallback_build.

    Args:
        attacker: The attacking character
        primary_build: The build to use when limit conditions are met
        fallback_build: The build to use when limit conditions are NOT met
        target_hp: Target HP for enemies (legacy parameter)
        log_file: Optional file handle for logging
        defender: The defending character
        num_enemies: Number of enemies to fight
        enemy_hp: HP per enemy
        max_turns: Maximum combat turns before timeout
        enemy_hp_list: Optional list of HP values for mixed enemy groups

    Returns:
        Tuple of (turns, outcome, stats) where stats includes:
            - primary_activations: Number of turns primary build was used
            - fallback_activations: Number of turns fallback build was used
            - activation_percentage: % of turns primary build was active
    """
    from src.combat import can_activate_limit, make_attack, make_aoe_attack

    # Use provided defender or create dummy defender
    if defender is None:
        defender = Character(focus=0, power=0, mobility=3, endurance=0, tier=attacker.tier)

    # Initialize enemies - support both homogeneous and mixed HP groups
    if enemy_hp_list is not None:
        enemies = [{'hp': hp, 'max_hp': hp, 'bleed_stacks': []} for hp in enemy_hp_list]
        num_enemies = len(enemy_hp_list)
    else:
        if enemy_hp is None:
            enemy_hp = target_hp
        enemies = [{'hp': enemy_hp, 'max_hp': enemy_hp, 'bleed_stacks': []} for _ in range(num_enemies)]

    # Track attacker HP
    attacker_hp = attacker.max_hp
    attacker_max_hp = attacker.max_hp

    turns = 0
    charge_history = []
    cooldown_history = {}

    # Initialize combat state
    combat_state = {
        'last_target_hit': None,
        'defeated_enemy_last_turn': False,
        'dealt_damage_last_turn': False,
        'was_hit_last_turn': False,
        'was_damaged_last_turn': False,
        'all_attacks_missed_last_turn': False,
        'was_hit_no_damage_last_turn': False,
        'was_attacked_last_turn': False,
        'channeled_turns': 0,
        'charges_used': {},
        'leech_hp': 0,
        'attrition_cost': 0,
        'hit_same_target_last_turn': False,
    }

    # Track activation stats
    primary_activations = 0
    fallback_activations = 0

    while any(enemy['hp'] > 0 for enemy in enemies) and turns < max_turns:
        turns += 1

        # Apply bleed damage to all enemies
        enemies_killed_by_bleed = []
        for i, enemy in enumerate(enemies):
            if enemy['hp'] <= 0:
                continue

            bleed_stacks = enemy['bleed_stacks']
            if not bleed_stacks:
                continue

            total_bleed_damage = 0
            active_bleeds = 0

            for j in range(len(bleed_stacks)):
                bleed_damage, turns_left = bleed_stacks[j]
                if turns_left > 0:
                    total_bleed_damage += bleed_damage
                    bleed_stacks[active_bleeds] = (bleed_damage, turns_left - 1)
                    active_bleeds += 1

            # Remove expired bleeds
            del bleed_stacks[active_bleeds:]

            enemy['hp'] = max(0, enemy['hp'] - total_bleed_damage)
            if enemy['hp'] <= 0:
                enemies_killed_by_bleed.append(i)
                enemy['defeated_this_turn'] = True

        # DECIDE WHICH BUILD TO USE THIS TURN
        can_use_primary = True

        # Check each limit in primary build
        for limit_name in primary_build.limits:
            if not can_activate_limit(limit_name, turns, attacker_hp, attacker_max_hp,
                                     combat_state, charge_history, cooldown_history):
                # For charge_up limits, we still want to use primary build (it will charge)
                # For other limits, use fallback
                if limit_name not in ['charge_up', 'charge_up_2']:
                    can_use_primary = False
                    break

        # Select the build to use this turn
        if can_use_primary:
            active_build = primary_build
            primary_activations += 1
        else:
            active_build = fallback_build
            fallback_activations += 1

        # Execute attack with the selected build
        charged_this_turn = False
        total_damage_dealt = 0
        target_idx = None
        is_aoe = 'area' in active_build.attack_type

        if is_aoe:
            # AOE attack - hit all alive enemies
            # Build targets list: (index, enemy_dict) for alive enemies
            alive_enemies = [(i, enemy) for i, enemy in enumerate(enemies) if enemy['hp'] > 0]

            # Use the AOE attack function for proper shared damage rolls
            attack_results, total_damage_dealt = make_aoe_attack(
                attacker, defender, active_build, alive_enemies,
                turn_number=turns, charge_history=charge_history, cooldown_history=cooldown_history,
                attacker_hp=attacker_hp, attacker_max_hp=attacker_max_hp, combat_state=combat_state
            )

            # Process results
            for target_idx, damage, conditions in attack_results:
                enemy = enemies[target_idx]
                enemy['hp'] = max(0, enemy['hp'] - damage)

                # Apply bleed
                if 'bleed' in conditions:
                    bleed_damage = max(0, damage - attacker.tier)
                    enemy['bleed_stacks'] = [(bleed_damage, 2)]

                if enemy['hp'] <= 0:
                    enemy['defeated_this_turn'] = True
        else:
            # Single target attack
            target_enemy = None
            for i, enemy in enumerate(enemies):
                if enemy['hp'] > 0:
                    target_enemy = enemy
                    target_idx = i
                    break

            if target_enemy:
                damage, conditions = make_attack(attacker, defender, active_build,
                                                turn_number=turns,
                                                charge_history=charge_history,
                                                cooldown_history=cooldown_history,
                                                attacker_hp=attacker_hp,
                                                attacker_max_hp=attacker_max_hp,
                                                combat_state=combat_state)

                # Check for charge
                if damage == 0 and 'charge' in conditions:
                    charged_this_turn = True
                else:
                    target_enemy['hp'] = max(0, target_enemy['hp'] - damage)
                    total_damage_dealt = damage

                    # Apply bleed
                    if 'bleed' in conditions:
                        bleed_damage = max(0, damage - attacker.tier)
                        target_enemy['bleed_stacks'] = [(bleed_damage, 2)]

                    if target_enemy['hp'] <= 0:
                        target_enemy['defeated_this_turn'] = True

        # Update charge history
        charge_history.append(charged_this_turn)
        if len(charge_history) > 2:
            charge_history.pop(0)

        # DEFENDER ATTACK PHASE
        total_defender_damage = 0
        if any(enemy['hp'] > 0 for enemy in enemies):
            from src.models import AttackBuild as AB
            defender_build = AB('ranged', [], [])

            # Count alive enemies and limit attacks to 1 per turn
            attacks_made = 0
            max_attacks_per_turn = 1

            for i, enemy in enumerate(enemies):
                if enemy['hp'] <= 0:
                    continue

                # Limit to 1 attack per turn when there are multiple enemies
                if attacks_made >= max_attacks_per_turn:
                    break

                enemy_attacker = Character(
                    focus=defender.focus,
                    power=defender.power,
                    mobility=defender.mobility,
                    endurance=defender.endurance,
                    tier=defender.tier,
                    max_hp=enemy['max_hp']
                )

                damage, _ = make_attack(enemy_attacker, attacker, defender_build,
                                       turn_number=turns, charge_history=[], cooldown_history={})

                attacker_hp -= damage
                total_defender_damage += damage
                attacks_made += 1

        # Apply HP costs and recovery
        if combat_state.get('attrition_cost', 0) > 0:
            attacker_hp -= combat_state['attrition_cost']
            combat_state['attrition_cost'] = 0

        if combat_state.get('leech_hp', 0) > 0:
            attacker_hp = min(attacker_hp + combat_state['leech_hp'], attacker_max_hp)
            combat_state['leech_hp'] = 0

        # Update combat state for next turn
        combat_state['defeated_enemy_last_turn'] = any(enemy.get('defeated_this_turn', False) for enemy in enemies)
        combat_state['dealt_damage_last_turn'] = total_damage_dealt > 0 and not charged_this_turn

        # Track target hits
        current_target = None
        if not is_aoe and target_idx is not None:
            current_target = target_idx
        combat_state['hit_same_target_last_turn'] = (current_target is not None and
                                                      current_target == combat_state.get('last_target_hit'))
        combat_state['last_target_hit'] = current_target

        # Defender attack tracking
        if total_defender_damage > 0:
            combat_state['was_attacked_last_turn'] = True
            combat_state['was_hit_last_turn'] = True
            combat_state['was_damaged_last_turn'] = True
            combat_state['all_attacks_missed_last_turn'] = False
            combat_state['was_hit_no_damage_last_turn'] = False
        else:
            alive_count = sum(1 for enemy in enemies if enemy['hp'] > 0)
            if alive_count > 0:
                combat_state['was_attacked_last_turn'] = True
                combat_state['all_attacks_missed_last_turn'] = True
                combat_state['was_hit_last_turn'] = False
                combat_state['was_damaged_last_turn'] = False
                combat_state['was_hit_no_damage_last_turn'] = False
            else:
                combat_state['was_attacked_last_turn'] = False
                combat_state['all_attacks_missed_last_turn'] = False
                combat_state['was_hit_last_turn'] = False
                combat_state['was_damaged_last_turn'] = False
                combat_state['was_hit_no_damage_last_turn'] = False

        # Clear defeated_this_turn flags
        for enemy in enemies:
            if 'defeated_this_turn' in enemy:
                del enemy['defeated_this_turn']

    # Determine outcome
    if all(enemy['hp'] <= 0 for enemy in enemies):
        outcome = "win"
    else:
        outcome = "timeout"

    # Calculate activation stats
    total_turns = primary_activations + fallback_activations
    activation_percentage = (primary_activations / total_turns * 100) if total_turns > 0 else 0

    stats = {
        'primary_activations': primary_activations,
        'fallback_activations': fallback_activations,
        'activation_percentage': activation_percentage
    }

    return turns, outcome, stats


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


def run_simulation_batch_with_fallback(attacker: Character, primary_build: AttackBuild, fallback_build: AttackBuild,
                                       num_runs: int = 10, target_hp: int = 100, defender: Character = None,
                                       num_enemies: int = 1, enemy_hp: int = None, max_turns: int = 100,
                                       enemy_hp_list: List[int] = None) -> Tuple[List[int], float, float, dict, dict]:
    """
    Run multiple combat simulations with fallback build switching.

    Args:
        attacker: The attacking character
        primary_build: The build to use when limit conditions are met
        fallback_build: The build to use when limit conditions are NOT met
        num_runs: Number of simulation runs
        target_hp: Target HP for enemies (legacy parameter)
        defender: The defending character
        num_enemies: Number of enemies to fight
        enemy_hp: HP per enemy
        max_turns: Maximum combat turns before timeout
        enemy_hp_list: Optional list of HP values for mixed enemy groups

    Returns:
        Tuple of (individual_results, average_turns, damage_per_turn, outcome_stats, activation_stats)
        where activation_stats = {"avg_activation_pct": float, "total_primary": int, "total_fallback": int}
    """
    # Pre-allocate results list
    results = [0] * num_runs
    result_outcomes = []
    outcomes = {"win": 0, "loss": 0, "timeout": 0}

    # Track activation statistics
    total_primary_activations = 0
    total_fallback_activations = 0

    # Calculate total HP pool once
    if enemy_hp_list:
        total_hp_pool = sum(enemy_hp_list)
    else:
        total_hp_pool = (enemy_hp if enemy_hp else target_hp) * num_enemies

    for i in range(num_runs):
        turns, outcome, stats = simulate_combat_with_fallback(
            attacker, primary_build, fallback_build, target_hp,
            defender=defender, num_enemies=num_enemies, enemy_hp=enemy_hp,
            max_turns=max_turns, enemy_hp_list=enemy_hp_list
        )
        results[i] = turns
        result_outcomes.append(outcome)
        outcomes[outcome] += 1

        # Accumulate activation stats
        total_primary_activations += stats['primary_activations']
        total_fallback_activations += stats['fallback_activations']

    # Calculate stats
    avg_turns = sum(results) / num_runs if num_runs > 0 else 0
    dpt = total_hp_pool / avg_turns if avg_turns > 0 else 0

    # Prepare outcome statistics
    outcome_stats = {
        "wins": outcomes["win"],
        "losses": outcomes["loss"],
        "timeouts": outcomes["timeout"],
        "win_rate": (outcomes["win"] / num_runs * 100) if num_runs > 0 else 0
    }

    # Prepare activation statistics
    total_turns = total_primary_activations + total_fallback_activations
    avg_activation_pct = (total_primary_activations / total_turns * 100) if total_turns > 0 else 0

    activation_stats = {
        "avg_activation_pct": avg_activation_pct,
        "total_primary": total_primary_activations,
        "total_fallback": total_fallback_activations
    }

    return results, avg_turns, dpt, outcome_stats, activation_stats