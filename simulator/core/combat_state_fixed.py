"""
Combat State Machine - Manages turn-based combat simulation with proper Vitality system rules

This module handles the core combat loop using actual Vitality system mechanics:
- D20 + Tier + Focus vs Avoidance for accuracy
- 3D6 + Tier + (Power × 1.5) - Durability for damage  
- 100 HP for all characters
- Proper survival checks
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
import copy
from .rule_engine import (
    check_accuracy_vs_avoidance, calculate_damage_roll, apply_status_effects,
    process_status_effects_turn_end, check_victory_conditions,
    calculate_vitality_stats, initialize_character_hp,
    check_survival, roll_d20, roll_3d6_exploding
)
from .character_loader import SimulationCharacter


@dataclass
class CombatEvent:
    """Represents a single event in combat for logging."""
    round_number: int
    turn_number: int
    actor: str
    action: str
    target: Optional[str] = None
    result: str = ""
    damage_dealt: int = 0
    damage_taken: int = 0
    hit: bool = False
    details: Dict[str, Any] = field(default_factory=dict)


class CombatStateMachine:
    """
    Manages the state and flow of turn-based combat simulation using Vitality system rules.
    """
    
    def __init__(self, player_characters: List[SimulationCharacter], 
                 enemy_characters: List[SimulationCharacter], 
                 max_rounds: int = 50):
        """
        Initialize combat with the given combatants.
        
        Args:
            player_characters: List of player characters
            enemy_characters: List of enemy characters  
            max_rounds: Maximum combat rounds before declaring a draw
        """
        self.player_characters = player_characters
        self.enemy_characters = enemy_characters
        self.max_rounds = max_rounds
        
        # Combat state
        self.current_round = 0
        self.current_turn = 0
        self.combat_log: List[CombatEvent] = []
        self.victory_condition: Optional[str] = None
        
        # Initialize all characters with proper Vitality system stats
        for char in self.player_characters + self.enemy_characters:
            if 'combat_stats' not in char.raw_data:
                char.raw_data['combat_stats'] = calculate_vitality_stats(char.raw_data)
            char = initialize_character_hp(char.raw_data)
        
        # Calculate initiative order
        self.turn_order = self._calculate_initiative_order()
        
    def _calculate_initiative_order(self) -> List[SimulationCharacter]:
        """Calculate initiative order using Vitality system: Tier + Mobility + Awareness."""
        all_characters = self.player_characters + self.enemy_characters
        
        def get_initiative(char: SimulationCharacter) -> int:
            stats = char.raw_data.get('combat_stats', {})
            return stats.get('tier', 0) + stats.get('mobility', 0) + char.raw_data.get('attributes', {}).get('awareness', 0)
        
        # Sort by initiative (highest first)
        return sorted(all_characters, key=get_initiative, reverse=True)
    
    def run_combat(self) -> Dict[str, Any]:
        """
        Run the full combat simulation.
        
        Returns:
            Dictionary containing combat results and statistics
        """
        self._log_event(
            CombatEvent(
                round_number=0,
                turn_number=0,
                actor="SYSTEM",
                action="COMBAT_START",
                result="Combat begins"
            )
        )
        
        while self.current_round < self.max_rounds and not self.victory_condition:
            self.current_round += 1
            self._process_round()
            
            # Check victory conditions
            self.victory_condition = check_victory_conditions(
                [char.to_dict() for char in self.player_characters + self.enemy_characters]
            )
        
        # Combat ended
        if not self.victory_condition:
            self.victory_condition = 'draw'
        
        self._log_event(
            CombatEvent(
                round_number=self.current_round,
                turn_number=999,
                actor="SYSTEM",
                action="COMBAT_END",
                result=f"Combat ends: {self.victory_condition}"
            )
        )
        
        return self._generate_combat_results()
    
    def _process_round(self):
        """Process a single combat round."""
        self.current_turn = 0
        
        self._log_event(
            CombatEvent(
                round_number=self.current_round,
                turn_number=0,
                actor="SYSTEM",
                action="ROUND_START",
                result=f"Round {self.current_round} begins"
            )
        )
        
        # Process each character's turn in initiative order
        for character in self.turn_order:
            if self.victory_condition:
                break
                
            self.current_turn += 1
            self._process_character_turn(character)
            
            # Check victory after each action
            self.victory_condition = check_victory_conditions(
                [char.to_dict() for char in self.player_characters + self.enemy_characters]
            )
        
        # End of round processing
        self._process_end_of_round()
    
    def _process_character_turn(self, character: SimulationCharacter):
        """Process a single character's turn."""
        # Check if character is conscious
        if character.current_hp <= 0 or character.raw_data.get('dead', False):
            return
        
        if not character.raw_data.get('conscious', True):
            self._log_event(
                CombatEvent(
                    round_number=self.current_round,
                    turn_number=self.current_turn,
                    actor=character.name,
                    action="UNCONSCIOUS",
                    result=f"{character.name} is unconscious"
                )
            )
            return
        
        # Check if stunned (lose turn)
        is_stunned = any(effect.get('type') == 'stunned' for effect in character.status_effects)
        if is_stunned:
            self._log_event(
                CombatEvent(
                    round_number=self.current_round,
                    turn_number=self.current_turn,
                    actor=character.name,
                    action="STUNNED",
                    result=f"{character.name} is stunned and loses their turn"
                )
            )
            return
        
        # Character takes their action
        if character.is_player:
            self._process_player_turn(character)
        else:
            self._process_enemy_turn(character)
    
    def _process_player_turn(self, character: SimulationCharacter):
        """Process a player character's turn using simple AI."""
        # Simple AI: attack the first living enemy
        targets = [enemy for enemy in self.enemy_characters 
                  if enemy.current_hp > 0 and not enemy.raw_data.get('dead', False)]
        
        if not targets:
            return
        
        target = targets[0]  # Pick first available target
        
        # Choose best available attack
        if character.special_attacks:
            attack = character.special_attacks[0]  # Use first special attack
        else:
            # Basic attack
            attack = {
                'name': 'Basic Attack',
                'base_damage': 3,
                'accuracy_modifier': 0,
                'status_effects': []
            }
        
        self._execute_attack(character, target, attack)
    
    def _process_enemy_turn(self, character: SimulationCharacter):
        """Process an enemy character's turn using simple AI."""
        # Simple AI: attack the player with lowest HP
        targets = [player for player in self.player_characters 
                  if player.current_hp > 0 and not player.raw_data.get('dead', False)]
        
        if not targets:
            return
        
        # Target player with lowest current HP
        target = min(targets, key=lambda p: p.current_hp)
        
        # Choose attack
        if character.special_attacks:
            attack = character.special_attacks[0]
        else:
            attack = {
                'name': 'Basic Attack',
                'base_damage': 3,
                'accuracy_modifier': 0,
                'status_effects': []
            }
        
        self._execute_attack(character, target, attack)
    
    def _execute_attack(self, attacker: SimulationCharacter, target: SimulationCharacter, 
                       attack: Dict[str, Any]):
        """Execute an attack using proper Vitality system rules."""
        
        # Get Vitality system combat stats
        attacker_stats = attacker.raw_data.get('combat_stats', {})
        target_stats = target.raw_data.get('combat_stats', {})
        
        # If no combat stats calculated, calculate them now
        if not attacker_stats:
            attacker_stats = calculate_vitality_stats(attacker.raw_data)
            attacker.raw_data['combat_stats'] = attacker_stats
        if not target_stats:
            target_stats = calculate_vitality_stats(target.raw_data)
            target.raw_data['combat_stats'] = target_stats
        
        # Apply attack modifiers
        modifiers = {
            'accuracy_bonus': attack.get('accuracy_modifier', 0),
            'damage_bonus': attack.get('damage_modifier', 0)
        }
        
        # Vitality System Accuracy Check: 1d20 + Tier + Focus vs Target's Avoidance
        hit_success, attack_roll, target_avoidance = check_accuracy_vs_avoidance(
            attacker_stats, target_stats, modifiers
        )
        
        # Check if it was a natural 20 (before modifiers)
        base_roll = attack_roll - attacker_stats.get('tier', 0) - attacker_stats.get('focus', 0) - modifiers.get('accuracy_bonus', 0)
        was_natural_20 = base_roll == 20
        
        attack_event = CombatEvent(
            round_number=self.current_round,
            turn_number=self.current_turn,
            actor=attacker.name,
            action=f"ATTACK:{attack['name']}",
            target=target.name,
            hit=hit_success,
            details={
                'attack_roll': attack_roll,
                'target_avoidance': target_avoidance,
                'natural_20': was_natural_20
            }
        )
        
        if hit_success:
            # Vitality System Damage Roll: 3d6 + Tier + (Power × 1.5) - Target's Durability
            final_damage, raw_damage = calculate_damage_roll(
                attacker_stats, target_stats, was_natural_20, modifiers
            )
            
            # Apply damage
            target.current_hp = max(0, target.current_hp - final_damage)
            
            attack_event.damage_dealt = final_damage
            result_text = f"{attacker.name} hits {target.name} for {final_damage} damage"
            
            if was_natural_20:
                result_text += " (Natural 20!)"
            
            attack_event.result = result_text
            
            # Apply status effects from attack
            if attack.get('status_effects'):
                target_dict = target.to_dict()
                target_dict = apply_status_effects(target_dict, attack['status_effects'])
                target.status_effects = target_dict['status_effects']
                
                effect_names = [effect.get('type', 'unknown') for effect in attack['status_effects']]
                attack_event.result += f" (applies {', '.join(effect_names)})"
            
        else:
            attack_event.result = f"{attacker.name} misses {target.name} ({attack_roll} vs {target_avoidance})"
        
        self._log_event(attack_event)
        
        # Handle survival check if target reaches 0 or below HP
        if target.current_hp <= 0:
            target_dict = target.to_dict()
            target_dict.update(target.raw_data)
            updated_target, survival_message = check_survival(target_dict)
            
            # Update character status
            target.current_hp = updated_target.get('current_hp', target.current_hp)
            if 'conscious' in updated_target:
                target.raw_data['conscious'] = updated_target['conscious']
            if 'dead' in updated_target:
                target.raw_data['dead'] = updated_target['dead']
            
            # Log survival result
            if survival_message:
                self._log_event(
                    CombatEvent(
                        round_number=self.current_round,
                        turn_number=self.current_turn,
                        actor=target.name,
                        action="SURVIVAL_CHECK",
                        result=survival_message
                    )
                )
    
    def _process_end_of_round(self):
        """Process end-of-round effects."""
        self._log_event(
            CombatEvent(
                round_number=self.current_round,
                turn_number=999,
                actor="SYSTEM",
                action="ROUND_END",
                result=f"Round {self.current_round} ends"
            )
        )
        
        # Process end-of-round status effects for all characters
        all_chars = self.player_characters + self.enemy_characters
        for char in all_chars:
            if char.current_hp > 0:
                char_dict = char.to_dict()
                updated_char, effect_messages = process_status_effects_turn_end(char_dict)
                char.current_hp = updated_char['current_hp']
                char.status_effects = updated_char['status_effects']
    
    def _log_event(self, event: CombatEvent):
        """Add an event to the combat log."""
        self.combat_log.append(event)
    
    def _generate_combat_results(self) -> Dict[str, Any]:
        """Generate final combat results for analysis."""
        # Calculate statistics
        total_damage_dealt = {}
        total_damage_taken = {}
        actions_taken = {}
        
        for event in self.combat_log:
            if event.action.startswith('ATTACK:'):
                actor = event.actor
                target = event.target or 'None'
                
                # Track damage dealt
                if actor not in total_damage_dealt:
                    total_damage_dealt[actor] = 0
                total_damage_dealt[actor] += event.damage_dealt
                
                # Track damage taken
                if target not in total_damage_taken:
                    total_damage_taken[target] = 0
                total_damage_taken[target] += event.damage_dealt
                
                # Track actions
                if actor not in actions_taken:
                    actions_taken[actor] = 0
                actions_taken[actor] += 1
        
        # Get final character states
        final_character_states = {}
        for char in self.player_characters + self.enemy_characters:
            status = "Alive"
            if char.raw_data.get('dead', False):
                status = "Dead"
            elif not char.raw_data.get('conscious', True):
                status = "Unconscious"
            elif char.current_hp <= 0:
                status = "Defeated"
            
            final_character_states[char.name] = {
                'status': status,
                'current_hp': char.current_hp,
                'max_hp': char.max_hp
            }
        
        return {
            'victory_condition': self.victory_condition,
            'rounds': self.current_round,
            'total_damage_dealt': total_damage_dealt,
            'total_damage_taken': total_damage_taken,
            'actions_taken': actions_taken,
            'final_character_states': final_character_states,
            'combat_log': [
                {
                    'round': event.round_number,
                    'turn': event.turn_number,
                    'actor': event.actor,
                    'action': event.action,
                    'target': event.target,
                    'result': event.result,
                    'damage_dealt': event.damage_dealt,
                    'hit': event.hit,
                    'details': event.details
                }
                for event in self.combat_log
            ]
        }