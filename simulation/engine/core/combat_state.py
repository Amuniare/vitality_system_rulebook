"""
Combat State Machine - Manages turn-based combat simulation

This module handles the core combat loop, turn order, resource tracking,
and state management for deterministic combat simulations.
"""

from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
import copy
from .rule_engine import (
    check_accuracy_vs_avoidance, calculate_damage_roll, apply_status_effects,
    process_status_effects_turn_end, check_victory_conditions,
    calculate_initiative, calculate_vitality_stats, initialize_character_hp,
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
    Manages the state and flow of a turn-based combat simulation.
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
        self.player_characters = [copy.deepcopy(char) for char in player_characters]
        self.enemy_characters = [copy.deepcopy(char) for char in enemy_characters]
        self.max_rounds = max_rounds
        
        # Combat state
        self.current_round = 1
        self.current_turn = 0
        self.turn_order = []
        self.combat_log = []
        self.is_combat_over = False
        self.victory_result = None
        
        # Initialize combat
        self._initialize_combat()
    
    def _initialize_combat(self):
        """Set up initial combat state."""
        # Combine all combatants
        all_combatants = self.player_characters + self.enemy_characters
        
        # Calculate initiative and create turn order
        initiative_list = []
        for char in all_combatants:
            initiative = calculate_initiative(char.to_dict())
            char.initiative = initiative
            initiative_list.append((char, initiative))
        
        # Sort by initiative (highest first), then by name for consistency
        initiative_list.sort(key=lambda x: (-x[1], x[0].name))
        self.turn_order = [char for char, _ in initiative_list]
        
        # Log combat start
        self._log_event(
            CombatEvent(
                round_number=1,
                turn_number=0,
                actor="SYSTEM",
                action="COMBAT_START",
                result=f"Combat begins! Turn order: {', '.join(char.name for char in self.turn_order)}"
            )
        )
    
    def run_combat_simulation(self) -> Dict[str, Any]:
        """
        Run the complete combat simulation.
        
        Returns:
            Dictionary containing simulation results
        """
        while not self.is_combat_over and self.current_round <= self.max_rounds:
            self._process_round()
        
        # Handle timeout
        if not self.is_combat_over:
            self.victory_result = 'draw'
            self._log_event(
                CombatEvent(
                    round_number=self.current_round,
                    turn_number=self.current_turn,
                    actor="SYSTEM",
                    action="TIMEOUT",
                    result=f"Combat ended after {self.max_rounds} rounds (draw)"
                )
            )
        
        return self._generate_combat_results()
    
    def _process_round(self):
        """Process a single round of combat."""
        self._log_event(
            CombatEvent(
                round_number=self.current_round,
                turn_number=0,
                actor="SYSTEM",
                action="ROUND_START",
                result=f"Round {self.current_round} begins"
            )
        )
        
        # Process each character's turn
        for turn_index, character in enumerate(self.turn_order):
            if self.is_combat_over:
                break
            
            self.current_turn = turn_index + 1
            
            # Skip dead characters
            if character.current_hp <= 0:
                continue
            
            # Reset actions for this turn
            character.actions_remaining = 1
            
            # Process turn
            self._process_character_turn(character)
            
            # Check victory conditions
            all_chars = self.player_characters + self.enemy_characters
            victory = check_victory_conditions([char.to_dict() for char in all_chars])
            
            if victory:
                self.is_combat_over = True
                self.victory_result = victory
                self._log_event(
                    CombatEvent(
                        round_number=self.current_round,
                        turn_number=self.current_turn,
                        actor="SYSTEM",
                        action="VICTORY",
                        result=f"Combat ends: {victory}"
                    )
                )
                break
        
        # End of round processing
        if not self.is_combat_over:
            self._process_end_of_round()
            self.current_round += 1
    
    def _process_character_turn(self, character: SimulationCharacter):
        """Process a single character's turn."""
        # Process status effects at start of turn
        char_dict = character.to_dict()
        updated_char, effect_messages = process_status_effects_turn_end(char_dict)
        
        # Update character with status effect results
        character.current_hp = updated_char['current_hp']
        character.status_effects = updated_char['status_effects']
        
        # Log status effects
        for message in effect_messages:
            self._log_event(
                CombatEvent(
                    round_number=self.current_round,
                    turn_number=self.current_turn,
                    actor=character.name,
                    action="STATUS_EFFECT",
                    result=message
                )
            )
        
        # Skip turn if character died from status effects
        if character.current_hp <= 0:
            self._log_event(
                CombatEvent(
                    round_number=self.current_round,
                    turn_number=self.current_turn,
                    actor=character.name,
                    action="DEATH",
                    result=f"{character.name} is defeated"
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
        targets = [enemy for enemy in self.enemy_characters if enemy.current_hp > 0]
        
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
        targets = [player for player in self.player_characters if player.current_hp > 0]
        
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
        """Execute an attack between two characters."""
        # Validate attack
        attacker_dict = attacker.to_dict()
        target_dict = target.to_dict()
        
        is_valid, error_msg = validate_attack_action(attacker_dict, target_dict, attack)
        if not is_valid:
            self._log_event(
                CombatEvent(
                    round_number=self.current_round,
                    turn_number=self.current_turn,
                    actor=attacker.name,
                    action="INVALID_ATTACK",
                    target=target.name,
                    result=error_msg
                )
            )
            return
        
        # Get combat stats
        attacker_stats = get_combat_stats(attacker_dict)
        target_stats = get_combat_stats(target_dict)
        
        # Apply attack modifiers
        modifiers = {
            'accuracy_bonus': attack.get('accuracy_modifier', 0),
            'damage_bonus': attack.get('damage_modifier', 0)
        }
        
        # Calculate hit probability (deterministic for testing)
        hit_chance = calculate_accuracy(attacker_stats, target_stats, modifiers)
        
        # Deterministic hit resolution based on stats
        # Higher accuracy vs defense = higher chance to hit
        net_accuracy = attacker_stats['accuracy'] - target_stats['defense']
        hits = net_accuracy >= 0  # Simple deterministic rule
        
        attack_event = CombatEvent(
            round_number=self.current_round,
            turn_number=self.current_turn,
            actor=attacker.name,
            action=f"ATTACK:{attack['name']}",
            target=target.name,
            hit=hits
        )
        
        if hits:
            # Calculate damage
            base_damage = attack.get('base_damage', 3)
            final_damage = calculate_damage(base_damage, attacker_stats, target_stats, modifiers)
            
            # Apply damage
            target.current_hp = max(0, target.current_hp - final_damage)
            
            attack_event.damage_dealt = final_damage
            attack_event.result = f"{attacker.name} hits {target.name} for {final_damage} damage"
            
            # Apply status effects from attack
            if attack.get('status_effects'):
                target_dict = apply_status_effects(target.to_dict(), attack['status_effects'])
                target.status_effects = target_dict['status_effects']
                
                effect_names = [effect.get('type', 'unknown') for effect in attack['status_effects']]
                attack_event.result += f" (applies {', '.join(effect_names)})"
            
        else:
            attack_event.result = f"{attacker.name} misses {target.name}"
        
        self._log_event(attack_event)
        
        # Check if target was defeated
        if target.current_hp <= 0:
            self._log_event(
                CombatEvent(
                    round_number=self.current_round,
                    turn_number=self.current_turn,
                    actor=target.name,
                    action="DEATH",
                    result=f"{target.name} is defeated"
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
        
        # Character final states
        character_states = {}
        for char in self.player_characters + self.enemy_characters:
            character_states[char.name] = {
                'final_hp': char.current_hp,
                'max_hp': char.max_hp,
                'is_alive': char.current_hp > 0,
                'is_player': char.is_player,
                'damage_dealt': total_damage_dealt.get(char.name, 0),
                'damage_taken': total_damage_taken.get(char.name, 0),
                'actions_taken': actions_taken.get(char.name, 0)
            }
        
        return {
            'victory_result': self.victory_result,
            'rounds_completed': self.current_round - (0 if self.is_combat_over else 1),
            'turns_completed': len([e for e in self.combat_log if e.action.startswith('ATTACK:')]),
            'character_states': character_states,
            'total_damage_dealt': sum(total_damage_dealt.values()),
            'total_damage_taken': sum(total_damage_taken.values()),
            'combat_log': [
                {
                    'round': event.round_number,
                    'turn': event.turn_number,
                    'actor': event.actor,
                    'action': event.action,
                    'target': event.target,
                    'result': event.result,
                    'damage': event.damage_dealt,
                    'hit': event.hit
                }
                for event in self.combat_log
            ]
        }
    
    def get_current_state(self) -> Dict[str, Any]:
        """Get current combat state for debugging."""
        return {
            'round': self.current_round,
            'turn': self.current_turn,
            'is_over': self.is_combat_over,
            'victory': self.victory_result,
            'players_alive': sum(1 for p in self.player_characters if p.current_hp > 0),
            'enemies_alive': sum(1 for e in self.enemy_characters if e.current_hp > 0),
            'turn_order': [char.name for char in self.turn_order]
        }