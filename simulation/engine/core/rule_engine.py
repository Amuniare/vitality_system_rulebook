"""
Vitality RPG Rule Engine - Pure functions for combat calculations

This module contains deterministic functions that implement the actual Vitality System
combat mechanics: D20 accuracy checks, 3D6 damage rolls, and proper attribute formulas.
"""

from typing import Dict, List, Any, Tuple, Optional
import random


def roll_d20() -> int:
    """Roll a single d20."""
    return random.randint(1, 20)


def roll_3d6_exploding() -> int:
    """
    Roll 3d6 with exploding 6s (when you roll a 6, roll an additional d6).
    
    Returns:
        Total of all dice rolled
    """
    total = 0
    dice_to_roll = 3
    
    while dice_to_roll > 0:
        roll = random.randint(1, 6)
        total += roll
        
        if roll == 6:
            dice_to_roll += 1  # Add another die for the 6
        
        dice_to_roll -= 1
    
    return total


def calculate_vitality_stats(character: Dict[str, Any]) -> Dict[str, int]:
    """
    Calculate all Vitality system combat stats from character attributes.
    
    Vitality System Formulas:
    - Avoidance Score: 10 + Tier + Mobility
    - Durability Score: Tier + (Endurance × 1.5) 
    - Resolve Score: 10 + Tier + Focus
    - Stability Score: 10 + Tier + Power
    - Vitality Score: 10 + Tier + Endurance
    
    Args:
        character: Character dictionary with tier and attributes
        
    Returns:
        Dictionary of calculated combat stats
    """
    tier = character.get('tier', 4)
    attributes = character.get('attributes', {})
    
    # Get base attributes (default to 0 if missing)
    focus = attributes.get('focus', 0)
    mobility = attributes.get('mobility', 0) 
    power = attributes.get('power', 0)
    endurance = attributes.get('endurance', 0)
    
    return {
        'avoidance': 10 + tier + mobility,
        'durability': tier + int(endurance * 1.5),
        'resolve': 10 + tier + focus,
        'stability': 10 + tier + power,
        'vitality': 10 + tier + endurance,
        'tier': tier,
        'focus': focus,
        'mobility': mobility,
        'power': power,
        'endurance': endurance
    }


def check_accuracy_vs_avoidance(attacker_stats: Dict[str, int], target_stats: Dict[str, int],
                               modifiers: Dict[str, int] = None) -> Tuple[bool, int, int]:
    """
    Perform Vitality system accuracy check: 1d20 + Tier + Focus vs Target's Avoidance
    
    Args:
        attacker_stats: Attacker's calculated stats including tier and focus
        target_stats: Target's calculated stats including avoidance
        modifiers: Optional accuracy modifiers
        
    Returns:
        Tuple of (hit_success, attack_roll, target_avoidance)
    """
    if modifiers is None:
        modifiers = {}
    
    # Accuracy Check: 1d20 + Tier + Focus
    d20_roll = roll_d20()
    attack_roll = d20_roll + attacker_stats.get('tier', 0) + attacker_stats.get('focus', 0)
    
    # Apply modifiers
    accuracy_bonus = modifiers.get('accuracy_bonus', 0)
    attack_roll += accuracy_bonus
    
    # Target's Avoidance Score
    target_avoidance = target_stats.get('avoidance', 10)
    
    # Natural 20 is auto-hit
    if d20_roll == 20:
        return True, attack_roll, target_avoidance
    
    # Natural 1 is auto-miss
    if d20_roll == 1:
        return False, attack_roll, target_avoidance
    
    # Normal comparison
    return attack_roll >= target_avoidance, attack_roll, target_avoidance


def calculate_damage_roll(attacker_stats: Dict[str, int], target_stats: Dict[str, int],
                         was_natural_20: bool = False, modifiers: Dict[str, int] = None) -> Tuple[int, int]:
    """
    Perform Vitality system damage roll: 3d6 + Tier + (Power × 1.5) - Target's Durability
    
    Args:
        attacker_stats: Attacker's calculated stats including tier and power
        target_stats: Target's calculated stats including durability  
        was_natural_20: If the accuracy check was a natural 20 (adds tier to damage)
        modifiers: Optional damage modifiers
        
    Returns:
        Tuple of (final_damage, raw_damage_roll)
    """
    if modifiers is None:
        modifiers = {}
    
    # Damage Roll: 3d6 + Tier + (Power × 1.5)
    dice_roll = roll_3d6_exploding()
    tier = attacker_stats.get('tier', 0)
    power = attacker_stats.get('power', 0)
    
    raw_damage = dice_roll + tier + int(power * 1.5)
    
    # Natural 20 bonus: add tier to damage
    if was_natural_20:
        raw_damage += tier
    
    # Apply modifiers  
    damage_bonus = modifiers.get('damage_bonus', 0)
    raw_damage += damage_bonus
    
    # Subtract target's durability
    target_durability = target_stats.get('durability', 0)
    final_damage = raw_damage - target_durability
    
    # Minimum damage is always 1
    final_damage = max(1, final_damage)
    
    return final_damage, raw_damage


def apply_status_effects(character: Dict[str, Any], effects: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Apply status effects to a character.
    
    Args:
        character: Character data dictionary
        effects: List of status effect dictionaries
    
    Returns:
        Updated character data with effects applied
    """
    # Create a copy to avoid mutating the original
    updated_character = character.copy()
    
    # Initialize status effects if not present
    if 'status_effects' not in updated_character:
        updated_character['status_effects'] = []
    
    current_effects = updated_character['status_effects'].copy()
    
    for effect in effects:
        effect_type = effect.get('type')
        duration = effect.get('duration', 1)
        magnitude = effect.get('magnitude', 0)
        
        # Check if effect already exists
        existing_effect = None
        for i, existing in enumerate(current_effects):
            if existing.get('type') == effect_type:
                existing_effect = i
                break
        
        if existing_effect is not None:
            # Update existing effect (take higher magnitude, longer duration)
            current = current_effects[existing_effect]
            current_effects[existing_effect] = {
                'type': effect_type,
                'duration': max(current.get('duration', 0), duration),
                'magnitude': max(current.get('magnitude', 0), magnitude)
            }
        else:
            # Add new effect
            current_effects.append({
                'type': effect_type,
                'duration': duration,
                'magnitude': magnitude
            })
    
    updated_character['status_effects'] = current_effects
    return updated_character


def process_status_effects_turn_end(character: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
    """
    Process status effects at the end of a character's turn.
    
    Args:
        character: Character data dictionary
    
    Returns:
        Tuple of (updated_character, list_of_effect_messages)
    """
    updated_character = character.copy()
    messages = []
    
    if 'status_effects' not in updated_character:
        return updated_character, messages
    
    current_effects = updated_character['status_effects'].copy()
    remaining_effects = []
    
    for effect in current_effects:
        effect_type = effect.get('type')
        duration = effect.get('duration', 0)
        magnitude = effect.get('magnitude', 0)
        
        # Apply effect
        if effect_type == 'poison':
            damage = magnitude
            current_hp = updated_character.get('current_hp', 0)
            updated_character['current_hp'] = max(0, current_hp - damage)
            messages.append(f"{character.get('name', 'Character')} takes {damage} poison damage")
        
        elif effect_type == 'regeneration':
            healing = magnitude
            current_hp = updated_character.get('current_hp', 0)
            max_hp = updated_character.get('max_hp', 100)
            new_hp = min(max_hp, current_hp + healing)
            updated_character['current_hp'] = new_hp
            actual_healing = new_hp - current_hp
            if actual_healing > 0:
                messages.append(f"{character.get('name', 'Character')} regenerates {actual_healing} HP")
        
        elif effect_type == 'stunned':
            messages.append(f"{character.get('name', 'Character')} is stunned and loses their action")
        
        # Reduce duration
        new_duration = duration - 1
        if new_duration > 0:
            effect_copy = effect.copy()
            effect_copy['duration'] = new_duration
            remaining_effects.append(effect_copy)
        else:
            messages.append(f"{character.get('name', 'Character')}'s {effect_type} effect ends")
    
    updated_character['status_effects'] = remaining_effects
    return updated_character, messages


def initialize_character_hp(character: Dict[str, Any]) -> Dict[str, Any]:
    """
    Initialize character HP to Vitality system standard (100 HP for all characters).
    
    Args:
        character: Character dictionary
        
    Returns:
        Character with properly initialized HP
    """
    character = character.copy()
    
    # Vitality system: All players have 100 HP 
    character['max_hp'] = 100
    if 'current_hp' not in character:
        character['current_hp'] = 100
    
    return character


def check_survival(character: Dict[str, Any]) -> Tuple[Dict[str, Any], str]:
    """
    Handle Vitality system survival checks when at 0 or below HP.
    
    Survival Check: 1d20 + Endurance vs (HP below 0)
    - Success: Can choose to remain conscious  
    - Failure: Fall unconscious
    - Failure by 20+: Death
    - Natural 20: Return to 1 HP
    - Natural 1: Additional -5 to result
    
    Args:
        character: Character at 0 or below HP
        
    Returns:
        Tuple of (updated_character, result_message)
    """
    character = character.copy()
    current_hp = character.get('current_hp', 0)
    
    if current_hp > 0:
        return character, ""
    
    # Determine how far below 0 the character is
    hp_below_zero = abs(current_hp)
    
    # Roll survival check: 1d20 + Endurance
    d20_roll = roll_d20()
    endurance = character.get('attributes', {}).get('endurance', 0)
    survival_roll = d20_roll + endurance
    
    # Natural 1: additional -5
    if d20_roll == 1:
        survival_roll -= 5
    
    # Natural 20: return to 1 HP
    if d20_roll == 20:
        character['current_hp'] = 1
        character['conscious'] = True
        return character, f"{character.get('name', 'Character')} rolls Natural 20 and returns to 1 HP!"
    
    # Check result
    if survival_roll >= hp_below_zero:
        # Success - can choose to remain conscious
        character['conscious'] = True
        return character, f"{character.get('name', 'Character')} passes survival check and remains conscious"
    
    # Failure - check if death
    failure_margin = hp_below_zero - survival_roll
    if failure_margin >= 20:
        character['conscious'] = False
        character['dead'] = True
        return character, f"{character.get('name', 'Character')} fails survival check by 20+ and dies"
    
    # Regular failure - unconscious
    character['conscious'] = False
    return character, f"{character.get('name', 'Character')} fails survival check and falls unconscious"


def check_victory_conditions(combatants: List[Dict[str, Any]]) -> Optional[str]:
    """
    Check if victory conditions have been met using Vitality system rules.
    
    Args:
        combatants: List of all combatants in the fight
    
    Returns:
        'player_victory', 'enemy_victory', or None if fight continues
    """
    players_alive = 0
    enemies_alive = 0
    
    for combatant in combatants:
        is_conscious = combatant.get('conscious', True)
        is_dead = combatant.get('dead', False)
        is_player = combatant.get('is_player', False)
        
        # Character is alive if conscious and not dead
        if is_conscious and not is_dead:
            if is_player:
                players_alive += 1
            else:
                enemies_alive += 1
    
    if players_alive == 0:
        return 'enemy_victory'
    elif enemies_alive == 0:
        return 'player_victory'
    else:
        return None


def calculate_initiative(character: Dict[str, Any]) -> int:
    """
    Calculate initiative for turn order.
    
    Args:
        character: Character data dictionary
    
    Returns:
        Initiative value (higher goes first)
    """
    # Base initiative from relevant attributes
    base_initiative = 0
    
    # Use perception or agility if available
    attributes = character.get('attributes', {})
    if isinstance(attributes, dict):
        utility_attrs = attributes.get('utility', {})
        if isinstance(utility_attrs, dict):
            base_initiative += utility_attrs.get('perception', 0)
            base_initiative += utility_attrs.get('athletics', 0)  # Agility substitute
    
    # Add any initiative modifiers
    modifiers = character.get('initiative_modifiers', 0)
    
    return base_initiative + modifiers


def get_combat_stats(character: Dict[str, Any]) -> Dict[str, int]:
    """
    Extract combat-relevant stats from character data.
    
    Args:
        character: Character data dictionary
    
    Returns:
        Dictionary of combat stats (accuracy, damage, defense, etc.)
    """
    stats = {
        'accuracy': 0,
        'damage': 0,
        'defense': 0,
        'damage_resistance': 0
    }
    
    # Extract from character attributes
    attributes = character.get('attributes', {})
    if isinstance(attributes, dict):
        combat_attrs = attributes.get('combat', {})
        if isinstance(combat_attrs, dict):
            stats['accuracy'] = combat_attrs.get('accuracy', 0)
            stats['damage'] = combat_attrs.get('damage', 0)
            stats['defense'] = combat_attrs.get('defense', 0)
    
    # Add equipment or other bonuses if available
    equipment_bonus = character.get('equipment_bonus', {})
    for stat in stats:
        stats[stat] += equipment_bonus.get(stat, 0)
    
    return stats


def validate_attack_action(attacker: Dict[str, Any], target: Dict[str, Any], 
                          attack_data: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Validate that an attack action is legal.
    
    Args:
        attacker: Attacking character
        target: Target character
        attack_data: Attack details
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check attacker is alive
    if attacker.get('current_hp', 0) <= 0:
        return False, "Attacker is unconscious"
    
    # Check target is alive
    if target.get('current_hp', 0) <= 0:
        return False, "Target is already unconscious"
    
    # Check attacker is not stunned
    status_effects = attacker.get('status_effects', [])
    for effect in status_effects:
        if effect.get('type') == 'stunned':
            return False, "Attacker is stunned and cannot act"
    
    # Check if attacker and target are on different sides
    attacker_is_player = attacker.get('is_player', False)
    target_is_player = target.get('is_player', False)
    
    if attacker_is_player == target_is_player:
        return False, "Cannot attack allies"
    
    # Attack is valid
    return True, ""


def calculate_special_attack_effects(attack_data: Dict[str, Any], 
                                   attacker_stats: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate effects of special attacks (area damage, status effects, etc.).
    
    Args:
        attack_data: Special attack configuration
        attacker_stats: Attacker's combat stats
    
    Returns:
        Dictionary containing calculated effects
    """
    effects = {
        'base_damage': attack_data.get('base_damage', 3),
        'area_effect': attack_data.get('area_effect', False),
        'status_effects': attack_data.get('status_effects', []),
        'accuracy_modifier': attack_data.get('accuracy_modifier', 0),
        'damage_modifier': attack_data.get('damage_modifier', 0)
    }
    
    # Scale damage with attacker's damage stat
    damage_scaling = attack_data.get('damage_scaling', 1.0)
    attacker_damage = attacker_stats.get('damage', 0)
    effects['base_damage'] += int(attacker_damage * damage_scaling)
    
    return effects