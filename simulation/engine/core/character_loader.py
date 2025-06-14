"""
Character Loader - Parses character JSON files for simulation

This module handles loading and parsing character data from JSON files,
converting them into simulation-ready objects with accessible stats and abilities.
"""

import json
import os
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field


@dataclass
class SimulationCharacter:
    """
    Simulation-ready character object with combat-relevant data.
    """
    # Basic Info
    name: str
    tier: int = 1
    character_type: str = "hero"
    
    # Combat Stats (extracted from attributes)
    accuracy: int = 0
    damage: int = 0
    defense: int = 0
    
    # Health and Resources
    max_hp: int = 20
    current_hp: int = 20
    max_stress: int = 10
    current_stress: int = 0
    
    # Special Abilities
    special_attacks: List[Dict[str, Any]] = field(default_factory=list)
    utility_abilities: List[Dict[str, Any]] = field(default_factory=list)
    
    # Combat State
    initiative: int = 0
    status_effects: List[Dict[str, Any]] = field(default_factory=list)
    actions_remaining: int = 1
    
    # Metadata
    is_player: bool = True
    source_file: str = ""
    raw_data: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            'name': self.name,
            'tier': self.tier,
            'character_type': self.character_type,
            'accuracy': self.accuracy,
            'damage': self.damage,
            'defense': self.defense,
            'max_hp': self.max_hp,
            'current_hp': self.current_hp,
            'max_stress': self.max_stress,
            'current_stress': self.current_stress,
            'special_attacks': self.special_attacks,
            'utility_abilities': self.utility_abilities,
            'initiative': self.initiative,
            'status_effects': self.status_effects,
            'actions_remaining': self.actions_remaining,
            'is_player': self.is_player,
            'source_file': self.source_file
        }


class CharacterLoader:
    """
    Loads and parses character JSON files into simulation-ready objects.
    """
    
    def __init__(self):
        self.validation_errors = []
    
    def load_character(self, json_file_path: str) -> SimulationCharacter:
        """
        Load a character from a JSON file.
        
        Args:
            json_file_path: Path to the character JSON file
            
        Returns:
            SimulationCharacter object ready for simulation
            
        Raises:
            FileNotFoundError: If the file doesn't exist
            ValueError: If the JSON is invalid or missing required data
        """
        if not os.path.exists(json_file_path):
            raise FileNotFoundError(f"Character file not found: {json_file_path}")
        
        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                raw_data = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in {json_file_path}: {e}")
        
        return self._parse_character_data(raw_data, json_file_path)
    
    def load_multiple_characters(self, directory_path: str) -> List[SimulationCharacter]:
        """
        Load all character JSON files from a directory.
        
        Args:
            directory_path: Path to directory containing character files
            
        Returns:
            List of SimulationCharacter objects
        """
        characters = []
        
        if not os.path.exists(directory_path):
            raise FileNotFoundError(f"Directory not found: {directory_path}")
        
        for filename in os.listdir(directory_path):
            if filename.endswith('.json'):
                try:
                    file_path = os.path.join(directory_path, filename)
                    character = self.load_character(file_path)
                    characters.append(character)
                except Exception as e:
                    print(f"Warning: Failed to load {filename}: {e}")
                    continue
        
        return characters
    
    def _parse_character_data(self, raw_data: Dict[str, Any], source_file: str) -> SimulationCharacter:
        """
        Parse raw Vitality system character data into a SimulationCharacter.
        
        Handles both Roll20 exported format and character builder format.
        
        Args:
            raw_data: Raw character data from JSON
            source_file: Source file path for reference
            
        Returns:
            SimulationCharacter object with proper Vitality system stats
        """
        self.validation_errors = []
        
        # Detect format: Roll20 export vs Character Builder
        if 'attributes' in raw_data and 'char_tier' in raw_data.get('attributes', {}):
            # Roll20 exported character format
            return self._parse_roll20_character(raw_data, source_file)
        elif 'tier' in raw_data and 'attributes' in raw_data:
            # Character Builder format
            return self._parse_builder_character(raw_data, source_file)
        else:
            # Try to extract whatever we can
            return self._parse_generic_character(raw_data, source_file)
    
    def _parse_roll20_character(self, raw_data: Dict[str, Any], source_file: str) -> SimulationCharacter:
        """Parse Roll20 exported character data."""
        attributes = raw_data.get('attributes', {})
        metadata = raw_data.get('metadata', {})
        
        # Extract basic info
        name = metadata.get('name', attributes.get('character_realname', 'Unknown Character'))
        tier = int(attributes.get('char_tier', 4))
        
        # Extract Vitality system attributes (with safe defaults)
        focus = int(attributes.get('char_focus', 0))
        mobility = int(attributes.get('char_mobility', attributes.get('mobilityTotal', 0)))
        power = int(attributes.get('char_power', 0)) 
        endurance = int(attributes.get('char_endurance', 0))
        awareness = int(attributes.get('char_awareness', 0))
        communication = int(attributes.get('char_communication', 0))
        intelligence = int(attributes.get('char_intelligence', 0))
        
        # Create full Vitality character for calculations
        vitality_character = {
            'name': name,
            'tier': tier,
            'attributes': {
                'focus': focus,
                'mobility': mobility, 
                'power': power,
                'endurance': endurance,
                'awareness': awareness,
                'communication': communication,
                'intelligence': intelligence
            },
            'is_player': True
        }
        
        # Extract special attacks from repeating sections
        special_attacks = self._parse_roll20_attacks(raw_data.get('repeating_sections', {}).get('attacks', {}))
        
        return self._create_simulation_character(vitality_character, special_attacks, source_file)
    
    def _parse_builder_character(self, raw_data: Dict[str, Any], source_file: str) -> SimulationCharacter:
        """Parse Character Builder format data."""
        name = raw_data.get('name', 'Unknown Character')
        tier = raw_data.get('tier', 4)
        attributes = raw_data.get('attributes', {})
        
        vitality_character = {
            'name': name,
            'tier': tier,
            'attributes': attributes,
            'is_player': True
        }
        
        special_attacks = self._parse_builder_attacks(raw_data.get('specialAttacks', []))
        
        return self._create_simulation_character(vitality_character, special_attacks, source_file)
    
    def _parse_generic_character(self, raw_data: Dict[str, Any], source_file: str) -> SimulationCharacter:
        """Parse character data in unknown format with best guesses."""
        name = raw_data.get('name', raw_data.get('character_name', 'Unknown Character'))
        tier = raw_data.get('tier', raw_data.get('level', 4))
        
        # Try to find attributes in various locations
        attributes = raw_data.get('attributes', {})
        if not attributes:
            # Look for flat attribute names
            attributes = {
                'focus': raw_data.get('focus', 0),
                'mobility': raw_data.get('mobility', 0),
                'power': raw_data.get('power', 0),
                'endurance': raw_data.get('endurance', 0),
                'awareness': raw_data.get('awareness', 0),
                'communication': raw_data.get('communication', 0),
                'intelligence': raw_data.get('intelligence', 0)
            }
        
        vitality_character = {
            'name': name,
            'tier': tier,
            'attributes': attributes,
            'is_player': True
        }
        
        special_attacks = []
        
        return self._create_simulation_character(vitality_character, special_attacks, source_file)
    
    def _create_simulation_character(self, vitality_character: Dict[str, Any], 
                                   special_attacks: List[Dict[str, Any]], source_file: str) -> SimulationCharacter:
        """Create SimulationCharacter from standardized Vitality character data."""
        
        # Import and use the rule engine to calculate proper stats
        from .rule_engine import calculate_vitality_stats, initialize_character_hp
        
        # Calculate all Vitality system stats
        combat_stats = calculate_vitality_stats(vitality_character)
        vitality_character_with_hp = initialize_character_hp(vitality_character)
        
        # Create character with proper Vitality system values
        character = SimulationCharacter(
            name=vitality_character['name'],
            tier=vitality_character['tier'],
            character_type="Player Character",
            
            # Store calculated stats for easy access in combat
            accuracy=combat_stats['tier'] + combat_stats['focus'],  # For accuracy rolls  
            damage=combat_stats['tier'] + int(combat_stats['power'] * 1.5),  # For damage rolls
            defense=combat_stats['avoidance'],  # Target number for enemy attacks
            
            # Vitality system: 100 HP for all characters
            max_hp=100,
            current_hp=100,
            max_stress=0,  # Not used in Vitality system
            current_stress=0,
            
            special_attacks=special_attacks,
            utility_abilities=[],  # Could be expanded later
            initiative=combat_stats['tier'] + combat_stats['mobility'] + vitality_character['attributes']['awareness'],
            is_player=vitality_character.get('is_player', True),
            source_file=source_file,
            raw_data=vitality_character
        )
        
        # Store full combat stats in raw_data for rule engine
        character.raw_data['combat_stats'] = combat_stats
        
        return character
    
    def _parse_roll20_attacks(self, attacks_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse Roll20 attacks into simulation format."""
        special_attacks = []
        
        for attack_id, attack_data in attacks_data.items():
            attack_name = attack_data.get('AttackName', 'Unknown Attack')
            attack_type = attack_data.get('AttackType', '0')
            
            # Skip basic attacks - they're handled by the combat engine
            if 'Basic Attack' in attack_name:
                continue
            
            special_attack = {
                'name': attack_name,
                'base_damage': 3,  # Default base damage for special attacks
                'accuracy_modifier': 0,
                'area_effect': False,
                'range': attack_data.get('leftsub', 'Melee').lower(),
                'stress_cost': 0,
                'description': '',
                'effects': [],
                'upgrades': [],
                'limits': []
            }
            
            special_attacks.append(special_attack)
        
        return special_attacks
    
    def _parse_builder_attacks(self, attacks_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parse Character Builder attacks into simulation format."""
        special_attacks = []
        
        for attack_data in attacks_data:
            if not isinstance(attack_data, dict):
                continue
            
            special_attack = {
                'name': attack_data.get('name', 'Unknown Attack'),
                'base_damage': attack_data.get('baseDamage', 3),
                'accuracy_modifier': attack_data.get('accuracyModifier', 0),
                'area_effect': attack_data.get('areaEffect', False),
                'range': attack_data.get('range', 'close'),
                'stress_cost': 0,  # Vitality system doesn't use stress
                'description': attack_data.get('description', ''),
                'effects': attack_data.get('effects', []),
                'upgrades': attack_data.get('upgrades', []),
                'limits': attack_data.get('limits', [])
            }
            
            special_attacks.append(special_attack)
        
        return special_attacks
    
    def _calculate_max_hp(self, tier: int, combat_attrs: Dict[str, Any], 
                         utility_attrs: Dict[str, Any]) -> int:
        """Calculate maximum HP based on tier and attributes."""
        base_hp = 20  # Base HP for tier 1
        tier_bonus = (tier - 1) * 5  # +5 HP per tier above 1
        
        # Bonus from defense and constitution-like attributes
        defense_bonus = combat_attrs.get('defense', 0) * 2
        athletics_bonus = utility_attrs.get('athletics', 0)
        
        return base_hp + tier_bonus + defense_bonus + athletics_bonus
    
    def _calculate_max_stress(self, tier: int, utility_attrs: Dict[str, Any]) -> int:
        """Calculate maximum stress based on tier and attributes."""
        base_stress = 10  # Base stress for tier 1
        tier_bonus = (tier - 1) * 2  # +2 stress per tier above 1
        
        # Bonus from mental attributes
        focus_bonus = utility_attrs.get('focus', 0)
        presence_bonus = utility_attrs.get('presence', 0)
        
        return base_stress + tier_bonus + focus_bonus + presence_bonus
    
    def _calculate_initiative(self, utility_attrs: Dict[str, Any]) -> int:
        """Calculate initiative modifier."""
        perception = utility_attrs.get('perception', 0)
        athletics = utility_attrs.get('athletics', 0)
        return perception + athletics
    
    def _parse_special_attacks(self, special_attacks_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parse special attacks into simulation format."""
        parsed_attacks = []
        
        for attack_data in special_attacks_data:
            if not isinstance(attack_data, dict):
                continue
            
            # Extract key combat data
            parsed_attack = {
                'name': attack_data.get('name', 'Unknown Attack'),
                'base_damage': attack_data.get('baseDamage', 3),
                'accuracy_modifier': attack_data.get('accuracyModifier', 0),
                'area_effect': attack_data.get('areaEffect', False),
                'range': attack_data.get('range', 'close'),
                'stress_cost': attack_data.get('stressCost', 1),
                'description': attack_data.get('description', ''),
                'effects': attack_data.get('effects', []),
                'upgrades': attack_data.get('upgrades', []),
                'limits': attack_data.get('limits', [])
            }
            
            # Parse status effects from upgrades/limits
            status_effects = []
            for upgrade in parsed_attack.get('upgrades', []):
                if 'effect' in str(upgrade).lower():
                    # Simple parsing - could be enhanced
                    status_effects.append({
                        'type': 'unknown_effect',
                        'duration': 1,
                        'magnitude': 1
                    })
            
            parsed_attack['status_effects'] = status_effects
            parsed_attacks.append(parsed_attack)
        
        return parsed_attacks
    
    def _parse_utility_abilities(self, utility_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parse utility abilities into simulation format."""
        parsed_abilities = []
        
        for ability_data in utility_data:
            if not isinstance(ability_data, dict):
                continue
            
            parsed_ability = {
                'name': ability_data.get('name', 'Unknown Ability'),
                'type': ability_data.get('type', 'passive'),
                'description': ability_data.get('description', ''),
                'combat_relevant': self._is_combat_relevant(ability_data),
                'effect': ability_data.get('effect', {}),
                'cost': ability_data.get('cost', 0)
            }
            
            parsed_abilities.append(parsed_ability)
        
        return parsed_abilities
    
    def _is_combat_relevant(self, ability_data: Dict[str, Any]) -> bool:
        """Determine if a utility ability affects combat."""
        combat_keywords = ['damage', 'attack', 'defense', 'hp', 'health', 'armor', 
                          'resist', 'initiative', 'accuracy', 'combat']
        
        text_to_check = str(ability_data).lower()
        return any(keyword in text_to_check for keyword in combat_keywords)
    
    def _validate_character(self, character: SimulationCharacter) -> None:
        """Validate character data for simulation requirements."""
        
        # Check required fields
        if not character.name:
            self.validation_errors.append("Character name is required")
        
        if character.tier < 1 or character.tier > 5:
            self.validation_errors.append(f"Invalid tier: {character.tier} (must be 1-5)")
        
        if character.max_hp <= 0:
            self.validation_errors.append(f"Invalid max HP: {character.max_hp}")
        
        if character.max_stress < 0:
            self.validation_errors.append(f"Invalid max stress: {character.max_stress}")
        
        # Check combat stats are reasonable
        total_combat_stats = character.accuracy + character.damage + character.defense
        expected_max = character.tier * 8  # Rough estimate based on point buy
        
        if total_combat_stats > expected_max * 1.5:  # Allow some leeway
            self.validation_errors.append(f"Combat stats seem too high: {total_combat_stats}")
    
    def create_enemy_character(self, name: str, tier: int, archetype: str = "balanced") -> SimulationCharacter:
        """
        Create a basic enemy character for testing.
        
        Args:
            name: Enemy name
            tier: Enemy tier level
            archetype: Enemy type (balanced, tank, damage, etc.)
            
        Returns:
            SimulationCharacter configured as an enemy
        """
        # Base stats by archetype
        archetypes = {
            'balanced': {'accuracy': 2, 'damage': 2, 'defense': 2},
            'tank': {'accuracy': 1, 'damage': 1, 'defense': 4},
            'damage': {'accuracy': 3, 'damage': 3, 'defense': 0},
            'artillery': {'accuracy': 4, 'damage': 2, 'defense': 0},
            'minion': {'accuracy': 1, 'damage': 1, 'defense': 1}
        }
        
        stats = archetypes.get(archetype, archetypes['balanced'])
        
        # Scale stats by tier
        tier_multiplier = tier
        accuracy = stats['accuracy'] * tier_multiplier
        damage = stats['damage'] * tier_multiplier
        defense = stats['defense'] * tier_multiplier
        
        # Calculate HP (enemies typically have more HP than players)
        base_hp = 20 if archetype != 'minion' else 10
        max_hp = base_hp + (tier - 1) * 8 + defense * 2
        
        # Basic special attack
        special_attacks = [{
            'name': f'{archetype.title()} Strike',
            'base_damage': 3 + damage,
            'accuracy_modifier': 0,
            'area_effect': False,
            'range': 'close',
            'stress_cost': 0,  # Enemies don't use stress
            'status_effects': []
        }]
        
        return SimulationCharacter(
            name=name,
            tier=tier,
            character_type="enemy",
            accuracy=accuracy,
            damage=damage,
            defense=defense,
            max_hp=max_hp,
            current_hp=max_hp,
            max_stress=0,  # Enemies don't use stress
            current_stress=0,
            special_attacks=special_attacks,
            utility_abilities=[],
            initiative=accuracy,  # Use accuracy for enemy initiative
            is_player=False,
            source_file="generated_enemy"
        )