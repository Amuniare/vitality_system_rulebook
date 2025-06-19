"""
Roll20 Character Sheet Schema Definition

This module defines the complete Roll20 character sheet structure
based on the HTML sheet fields and API requirements.
"""

from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
import json


@dataclass
class Roll20Schema:
    """Complete Roll20 character sheet schema."""
    
    # Basic Character Information
    character_name: str = ""
    character_realname: str = ""
    char_tier: str = "1"
    char_bio: str = ""
    
    # Core Attributes
    char_focus: str = "0"
    char_mobility: str = "0"
    char_power: str = "0"
    char_endurance: str = "0"
    char_awareness: str = "0"
    char_communication: str = "0"
    char_intelligence: str = "0"
    
    # Archetype Selections
    char_archetype_movement: str = ""
    char_archetype_attackType: str = ""
    char_archetype_effectType: str = ""
    char_archetype_uniqueAbility: str = ""
    char_archetype_defensive: str = ""
    char_archetype_specialAttack: str = ""
    char_archetype_utility: str = ""
    
    # Calculated Stats
    char_avoidance: str = "0"
    char_durability: str = "0"
    char_resolve: str = "0"
    char_stability: str = "0"
    char_vitality: str = "0"
    char_accuracy: str = "0"
    char_damage: str = "0"
    char_conditions: str = "0"
    char_movement: str = "0"
    char_initiative: str = "0"
    char_hp: str = "100/100"
    
    # Damage Reduction (missing fields identified)
    char_drMod: str = "0"
    char_drPrimaryAction: str = "0"
    
    # Attribute Totals (for expertise bonuses)
    awarenessTotal: str = "0"
    communicationTotal: str = "0"
    intelligenceTotal: str = "0"
    focusTotal: str = "0"
    mobilityTotal: str = "0"
    enduranceTotal: str = "0"
    powerTotal: str = "0"
    
    # Sheet State
    sheet_tab: str = "other"
    
    # Repeating Sections
    repeating_attacks: Dict[str, Dict[str, str]] = field(default_factory=dict)
    repeating_traits: Dict[str, Dict[str, str]] = field(default_factory=dict)
    repeating_features: Dict[str, Dict[str, str]] = field(default_factory=dict)
    repeating_uniqueabilities: Dict[str, Dict[str, str]] = field(default_factory=dict)
    
    # Expertise Repeating Sections
    repeating_awarenessexpertises: Dict[str, Dict[str, str]] = field(default_factory=dict)
    repeating_communicationexpertises: Dict[str, Dict[str, str]] = field(default_factory=dict)
    repeating_intelligenceexpertises: Dict[str, Dict[str, str]] = field(default_factory=dict)
    repeating_focusexpertises: Dict[str, Dict[str, str]] = field(default_factory=dict)
    repeating_mobilityexpertises: Dict[str, Dict[str, str]] = field(default_factory=dict)
    repeating_enduranceexpertises: Dict[str, Dict[str, str]] = field(default_factory=dict)
    repeating_powerexpertises: Dict[str, Dict[str, str]] = field(default_factory=dict)
    
    # Roll20 Metadata
    abilities: List[Any] = field(default_factory=list)
    permissions: Dict[str, str] = field(default_factory=lambda: {"see_by": "all", "edit_by": "all"})

    @classmethod
    def get_all_attack_upgrade_fields(cls) -> List[str]:
        """Return all available attack upgrade fields from the HTML sheet."""
        return [
            # Accuracy Category
            "AccurateAttack", "PowerAttack", "QuickAttack",
            
            # Damage Category - Core
            "EnhancedEffect", "HighImpact", "BonusDamage",
            
            # Damage Category - Elemental
            "ElementalDamage", "ColdDamage", "FireDamage", "LightningDamage",
            
            # Specialized Combat - Melee
            "HeavyStrike", "Cleave", "Whirlwind", "MeleeExpertise",
            
            # Specialized Combat - Ranged
            "RangedExpertise", "Multishot", "PinpointAccuracy", "Ricochet",
            
            # Specialized Combat - Universal
            "Pounce", "FollowThrough", "Opportunist",
            
            # Combat Control
            "Bully", "Disarm", "Knockdown", "Entangle",
            
            # Area Attack Bonuses
            "AreaExpertise", "PreciseAOE", "LingeringEffect",
            
            # Condition Bonuses
            "ConditionExpertise", "ConditionAmplification", "MultipleConditions",
            
            # Defensive Bonuses
            "CounterAttack", "Retribution", "DefensiveStance",
            
            # Utility Bonuses
            "NonLethal", "Stealth", "Intimidation",
            
            # Legacy Fields (keep for compatibility)
            "ArmorPiercing", "Brutal", "ReliableEffect"
        ]

    @classmethod
    def create_attack_entry(cls, attack_name: str, attack_type: str, attack_type_num: str) -> Dict[str, str]:
        """Create a basic attack entry with all upgrade fields initialized."""
        entry = {
            "AttackName": attack_name,
            "leftsub": attack_type,
            "AttackType": attack_type_num,
        }
        
        # Initialize all upgrade fields to "0"
        for field in cls.get_all_attack_upgrade_fields():
            entry[field] = "0"
            
        return entry

    @classmethod
    def create_trait_entry(cls, trait_name: str, active: bool = True) -> Dict[str, str]:
        """Create a trait entry with all bonus fields."""
        return {
            "traitActive": "1" if active else "0",
            "traitName": trait_name,
            "traitAcBonus": "0",  # Accuracy bonus
            "traitDgBonus": "0",  # Damage bonus  
            "traitCnBonus": "0",  # Conditions bonus
            "traitAvBonus": "0",  # Avoidance bonus
            "traitDrBonus": "0",  # Damage Reduction bonus
            "traitRsBonus": "0",  # Resolve bonus
            "traitSbBonus": "0",  # Stability bonus
            "traitVtBonus": "0",  # Vitality bonus
            "traitMBonus": "0"    # Movement bonus
        }

    @classmethod
    def create_expertise_entry(cls, expertise_name: str, active: bool = True) -> Dict[str, str]:
        """Create an expertise entry."""
        # Extract the attribute from expertise_name for the field names
        # This assumes format like "awarenessExpertise" or similar
        return {
            f"awarenessExpertiseActive": "on" if active else "",
            f"awarenessExpertiseName": expertise_name
        }

    @classmethod
    def create_unique_ability_entry(cls, ability_name: str, description: str = "") -> Dict[str, str]:
        """Create a unique ability entry."""
        return {
            "char_uniqueAbilities": ability_name,
            "uniqueAbilitiesDesc": description
        }

    @classmethod
    def create_feature_entry(cls, feature_name: str, description: str = "") -> Dict[str, str]:
        """Create a feature entry."""
        return {
            "char_features": feature_name,
            "featuresDesc": description
        }

    def to_dict(self) -> Dict[str, Any]:
        """Convert schema to dictionary format for Roll20 upload."""
        result = {}
        
        # Add all simple fields
        for field_name, field_value in self.__dict__.items():
            if not field_name.startswith('repeating_') and not field_name in ['abilities', 'permissions']:
                result[field_name] = field_value
        
        # Add repeating sections
        for section_name, section_data in self.__dict__.items():
            if section_name.startswith('repeating_'):
                result[section_name] = section_data
        
        # Add metadata
        result['abilities'] = self.abilities
        result['permissions'] = self.permissions
        
        return result

    def to_json(self, indent: int = 2) -> str:
        """Convert schema to JSON string."""
        return json.dumps(self.to_dict(), indent=indent)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Roll20Schema':
        """Create schema from dictionary."""
        # Filter only fields that exist in the dataclass
        valid_fields = {f.name for f in cls.__dataclass_fields__}
        filtered_data = {k: v for k, v in data.items() if k in valid_fields}
        return cls(**filtered_data)

    def validate(self) -> List[str]:
        """Validate the schema and return any errors."""
        errors = []
        
        if not self.character_name:
            errors.append("character_name is required")
            
        if not self.char_tier.isdigit():
            errors.append("char_tier must be numeric")
            
        # Validate attribute values are numeric
        attributes = [
            self.char_focus, self.char_mobility, self.char_power,
            self.char_endurance, self.char_awareness, 
            self.char_communication, self.char_intelligence
        ]
        
        for i, attr in enumerate(attributes):
            if not attr.isdigit():
                attr_names = ["focus", "mobility", "power", "endurance", 
                             "awareness", "communication", "intelligence"]
                errors.append(f"char_{attr_names[i]} must be numeric")
        
        return errors
