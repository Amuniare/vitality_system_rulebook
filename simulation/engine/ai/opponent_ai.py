"""
Opponent AI - Deterministic AI system for enemy behavior

This module provides deterministic AI for enemy characters in combat simulations.
All decisions are rule-based and repeatable for consistent testing.
"""

from typing import Dict, List, Any, Optional, Tuple
from enum import Enum


class AIPersonality(Enum):
    """Different AI personality types with distinct behaviors."""
    AGGRESSIVE = "aggressive"
    DEFENSIVE = "defensive"
    TACTICAL = "tactical"
    BERSERKER = "berserker"
    SUPPORT = "support"
    BALANCED = "balanced"


class OpponentAI:
    """
    Deterministic AI system for controlling enemy characters in combat.
    """
    
    def __init__(self, personality: AIPersonality = AIPersonality.BALANCED):
        """
        Initialize AI with a specific personality.
        
        Args:
            personality: AI behavior pattern to use
        """
        self.personality = personality
        self.decision_log = []  # For debugging and analysis
    
    def choose_target(self, available_targets: List[Dict[str, Any]], 
                     ai_character: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Choose a target from available enemies.
        
        Args:
            available_targets: List of potential target characters
            ai_character: The AI character making the decision
            
        Returns:
            Selected target character or None if no valid targets
        """
        if not available_targets:
            return None
        
        # Filter out dead targets
        valid_targets = [target for target in available_targets 
                        if target.get('current_hp', 0) > 0]
        
        if not valid_targets:
            return None
        
        # Choose based on personality
        target = None
        reason = ""
        
        if self.personality == AIPersonality.AGGRESSIVE:
            # Target lowest HP enemy (finish them off)
            target = min(valid_targets, key=lambda t: t.get('current_hp', 0))
            reason = "aggressive_lowest_hp"
            
        elif self.personality == AIPersonality.DEFENSIVE:
            # Target highest damage enemy (eliminate threats)
            target = max(valid_targets, key=lambda t: t.get('damage', 0))
            reason = "defensive_highest_damage"
            
        elif self.personality == AIPersonality.TACTICAL:
            # Target based on threat assessment (damage * hp remaining)
            def threat_score(t):
                return t.get('damage', 0) * (t.get('current_hp', 0) / max(t.get('max_hp', 1), 1))
            target = max(valid_targets, key=threat_score)
            reason = "tactical_threat_assessment"
            
        elif self.personality == AIPersonality.BERSERKER:
            # Target highest HP enemy (big fights)
            target = max(valid_targets, key=lambda t: t.get('current_hp', 0))
            reason = "berserker_highest_hp"
            
        elif self.personality == AIPersonality.SUPPORT:
            # Target closest enemy (simple distance heuristic)
            target = valid_targets[0]  # First in list (closest)
            reason = "support_closest"
            
        else:  # BALANCED
            # Balanced approach - target with best hp/threat ratio
            def balanced_score(t):
                hp_ratio = 1.0 - (t.get('current_hp', 0) / max(t.get('max_hp', 1), 1))
                threat = t.get('damage', 0) + t.get('accuracy', 0)
                return hp_ratio * 0.6 + threat * 0.4
            target = max(valid_targets, key=balanced_score)
            reason = "balanced_hp_threat"
        
        # Log decision
        self._log_decision(
            action="target_selection",
            character=ai_character.get('name', 'Unknown'),
            target=target.get('name', 'Unknown'),
            reason=reason,
            options_count=len(valid_targets)
        )
        
        return target
    
    def choose_action(self, ai_character: Dict[str, Any], 
                     combat_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Choose an action for the AI character to take.
        
        Args:
            ai_character: The AI character data
            combat_state: Current state of combat
            
        Returns:
            Dictionary describing the chosen action
        """
        available_actions = self._get_available_actions(ai_character, combat_state)
        
        if not available_actions:
            return {'type': 'pass', 'name': 'No Action'}
        
        # Choose action based on personality
        action = None
        reason = ""
        
        current_hp_ratio = ai_character.get('current_hp', 0) / max(ai_character.get('max_hp', 1), 1)
        
        if self.personality == AIPersonality.AGGRESSIVE:
            # Always attack with strongest available attack
            attacks = [a for a in available_actions if a['type'] == 'attack']
            if attacks:
                action = max(attacks, key=lambda a: a.get('base_damage', 0))
                reason = "aggressive_max_damage"
            else:
                action = available_actions[0]
                reason = "aggressive_fallback"
                
        elif self.personality == AIPersonality.DEFENSIVE:
            # Use defensive abilities when hurt, attack when healthy
            if current_hp_ratio < 0.5:
                defensive_actions = [a for a in available_actions 
                                   if 'heal' in a.get('name', '').lower() or 'defend' in a.get('name', '').lower()]
                if defensive_actions:
                    action = defensive_actions[0]
                    reason = "defensive_heal_low_hp"
                else:
                    # Attack conservatively
                    attacks = [a for a in available_actions if a['type'] == 'attack']
                    if attacks:
                        action = min(attacks, key=lambda a: a.get('base_damage', 0))
                        reason = "defensive_conservative_attack"
            else:
                attacks = [a for a in available_actions if a['type'] == 'attack']
                if attacks:
                    action = attacks[0]
                    reason = "defensive_healthy_attack"
                    
        elif self.personality == AIPersonality.BERSERKER:
            # Use most damaging attack, prefer AoE if available
            attacks = [a for a in available_actions if a['type'] == 'attack']
            if attacks:
                # Prefer area attacks
                aoe_attacks = [a for a in attacks if a.get('area_effect', False)]
                if aoe_attacks:
                    action = max(aoe_attacks, key=lambda a: a.get('base_damage', 0))
                    reason = "berserker_aoe_attack"
                else:
                    action = max(attacks, key=lambda a: a.get('base_damage', 0))
                    reason = "berserker_max_damage"
            else:
                action = available_actions[0]
                reason = "berserker_fallback"
                
        elif self.personality == AIPersonality.TACTICAL:
            # Choose action based on battlefield analysis
            action = self._tactical_action_selection(available_actions, ai_character, combat_state)
            reason = "tactical_analysis"
            
        else:  # BALANCED or SUPPORT
            # Simple balanced approach
            attacks = [a for a in available_actions if a['type'] == 'attack']
            if attacks:
                # Choose attack with best damage/accuracy ratio
                def effectiveness_score(a):
                    damage = a.get('base_damage', 1)
                    accuracy_mod = a.get('accuracy_modifier', 0)
                    return damage + accuracy_mod * 0.5
                action = max(attacks, key=effectiveness_score)
                reason = "balanced_effectiveness"
            else:
                action = available_actions[0]
                reason = "balanced_fallback"
        
        # Fallback to first available action
        if action is None:
            action = available_actions[0]
            reason = "default_fallback"
        
        # Log decision
        self._log_decision(
            action="action_selection",
            character=ai_character.get('name', 'Unknown'),
            chosen_action=action.get('name', 'Unknown'),
            reason=reason,
            options_count=len(available_actions)
        )
        
        return action
    
    def _get_available_actions(self, character: Dict[str, Any], 
                              combat_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get list of available actions for the character."""
        actions = []
        
        # Basic attack is always available
        actions.append({
            'type': 'attack',
            'name': 'Basic Attack',
            'base_damage': 3,
            'accuracy_modifier': 0,
            'area_effect': False,
            'stress_cost': 0
        })
        
        # Add special attacks if available
        special_attacks = character.get('special_attacks', [])
        for attack in special_attacks:
            if self._can_use_attack(character, attack, combat_state):
                actions.append({
                    'type': 'attack',
                    'name': attack.get('name', 'Special Attack'),
                    'base_damage': attack.get('base_damage', 3),
                    'accuracy_modifier': attack.get('accuracy_modifier', 0),
                    'area_effect': attack.get('area_effect', False),
                    'stress_cost': attack.get('stress_cost', 1),
                    'status_effects': attack.get('status_effects', [])
                })
        
        # Add utility actions if available
        utility_abilities = character.get('utility_abilities', [])
        for ability in utility_abilities:
            if ability.get('combat_relevant', False) and self._can_use_ability(character, ability, combat_state):
                actions.append({
                    'type': 'utility',
                    'name': ability.get('name', 'Utility'),
                    'effect': ability.get('effect', {}),
                    'cost': ability.get('cost', 0)
                })
        
        return actions
    
    def _can_use_attack(self, character: Dict[str, Any], attack: Dict[str, Any], 
                       combat_state: Dict[str, Any]) -> bool:
        """Check if character can use a specific attack."""
        # Check stress cost
        stress_cost = attack.get('stress_cost', 1)
        current_stress = character.get('current_stress', 0)
        max_stress = character.get('max_stress', 10)
        
        if current_stress + stress_cost > max_stress:
            return False
        
        # Check if stunned
        status_effects = character.get('status_effects', [])
        for effect in status_effects:
            if effect.get('type') == 'stunned':
                return False
        
        return True
    
    def _can_use_ability(self, character: Dict[str, Any], ability: Dict[str, Any], 
                        combat_state: Dict[str, Any]) -> bool:
        """Check if character can use a specific utility ability."""
        # Simple check - can use if not stunned and has resources
        status_effects = character.get('status_effects', [])
        for effect in status_effects:
            if effect.get('type') == 'stunned':
                return False
        
        return True
    
    def _tactical_action_selection(self, available_actions: List[Dict[str, Any]], 
                                  character: Dict[str, Any], 
                                  combat_state: Dict[str, Any]) -> Dict[str, Any]:
        """Advanced tactical action selection."""
        attacks = [a for a in available_actions if a['type'] == 'attack']
        
        if not attacks:
            return available_actions[0] if available_actions else None
        
        # Analyze battlefield situation
        enemies_count = len([t for t in combat_state.get('targets', []) if t.get('current_hp', 0) > 0])
        character_hp_ratio = character.get('current_hp', 0) / max(character.get('max_hp', 1), 1)
        
        # Tactical decision matrix
        if enemies_count > 2 and character_hp_ratio > 0.7:
            # Multiple enemies, healthy - prefer AoE
            aoe_attacks = [a for a in attacks if a.get('area_effect', False)]
            if aoe_attacks:
                return max(aoe_attacks, key=lambda a: a.get('base_damage', 0))
        
        if character_hp_ratio < 0.3:
            # Low health - prefer accurate attacks
            return max(attacks, key=lambda a: a.get('accuracy_modifier', 0))
        
        # Default to highest damage
        return max(attacks, key=lambda a: a.get('base_damage', 0))
    
    def _log_decision(self, **kwargs):
        """Log an AI decision for analysis."""
        self.decision_log.append(kwargs)
    
    def get_decision_log(self) -> List[Dict[str, Any]]:
        """Get the complete decision log."""
        return self.decision_log.copy()
    
    def reset_log(self):
        """Clear the decision log."""
        self.decision_log.clear()


def create_ai_for_character_type(character_type: str, character_data: Dict[str, Any]) -> OpponentAI:
    """
    Create an appropriate AI personality based on character type and data.
    
    Args:
        character_type: Type of character (tank, damage, support, etc.)
        character_data: Character stats and abilities
        
    Returns:
        OpponentAI configured for the character
    """
    # Analyze character stats to determine personality
    stats = character_data.get('attributes', {}).get('combat', {})
    damage = stats.get('damage', 0)
    defense = stats.get('defense', 0)
    accuracy = stats.get('accuracy', 0)
    
    # Simple heuristics for personality selection
    if defense > damage and defense > accuracy:
        return OpponentAI(AIPersonality.DEFENSIVE)
    elif damage > defense and damage > accuracy:
        return OpponentAI(AIPersonality.AGGRESSIVE)
    elif accuracy > damage and accuracy > defense:
        return OpponentAI(AIPersonality.TACTICAL)
    else:
        return OpponentAI(AIPersonality.BALANCED)


def get_ai_personality_description(personality: AIPersonality) -> str:
    """Get a human-readable description of an AI personality."""
    descriptions = {
        AIPersonality.AGGRESSIVE: "Focuses on dealing maximum damage, targets weak enemies",
        AIPersonality.DEFENSIVE: "Prioritizes survival, targets dangerous enemies",
        AIPersonality.TACTICAL: "Makes calculated decisions based on battlefield analysis",
        AIPersonality.BERSERKER: "Prefers high-damage attacks, especially area effects",
        AIPersonality.SUPPORT: "Focuses on utility and assisting other AI characters",
        AIPersonality.BALANCED: "Uses a mix of strategies based on the situation"
    }
    return descriptions.get(personality, "Unknown AI personality")