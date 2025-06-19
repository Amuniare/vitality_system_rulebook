"""
Schema Validator - Validate Roll20 Schemas

This module provides comprehensive validation for Roll20 schemas
to ensure data integrity before upload.
"""

from typing import Dict, Any, List, Optional, Tuple
from .roll20_schema import Roll20Schema
import re


class SchemaValidator:
    """Comprehensive validation for Roll20 schemas."""
    
    def __init__(self):
        self.errors = []
        self.warnings = []

    def validate_schema(self, schema: Roll20Schema) -> Tuple[bool, List[str], List[str]]:
        """Perform complete validation of a schema."""
        self.errors = []
        self.warnings = []
        
        # Basic validation
        self._validate_basic_info(schema)
        self._validate_attributes(schema)
        self._validate_archetypes(schema)
        self._validate_calculated_stats(schema)
        
        # Advanced validation
        self._validate_attacks(schema)
        self._validate_repeating_sections(schema)
        self._validate_data_consistency(schema)
        
        return len(self.errors) == 0, self.errors, self.warnings

    def _validate_basic_info(self, schema: Roll20Schema) -> None:
        """Validate basic character information."""
        if not schema.character_name or not schema.character_name.strip():
            self.errors.append("Character name is required")
        
        if not schema.char_tier.isdigit() or int(schema.char_tier) < 1:
            self.errors.append("Tier must be a positive integer")
        
        if len(schema.character_name) > 50:
            self.warnings.append("Character name is very long (>50 characters)")

    def _validate_attributes(self, schema: Roll20Schema) -> None:
        """Validate attribute values."""
        attributes = {
            "focus": schema.char_focus,
            "mobility": schema.char_mobility, 
            "power": schema.char_power,
            "endurance": schema.char_endurance,
            "awareness": schema.char_awareness,
            "communication": schema.char_communication,
            "intelligence": schema.char_intelligence
        }
        
        for attr_name, attr_value in attributes.items():
            if not attr_value.isdigit():
                self.errors.append(f"Attribute {attr_name} must be numeric")
            elif int(attr_value) < 0:
                self.errors.append(f"Attribute {attr_name} cannot be negative")
            elif int(attr_value) > 10:
                self.warnings.append(f"Attribute {attr_name} is very high (>10)")

    def _validate_archetypes(self, schema: Roll20Schema) -> None:
        """Validate archetype selections."""
        required_archetypes = [
            "char_archetype_movement",
            "char_archetype_attackType", 
            "char_archetype_effectType",
            "char_archetype_uniqueAbility",
            "char_archetype_defensive",
            "char_archetype_specialAttack",
            "char_archetype_utility"
        ]
        
        for archetype_field in required_archetypes:
            value = getattr(schema, archetype_field, "")
            if not value:
                archetype_name = archetype_field.replace("char_archetype_", "")
                self.warnings.append(f"No {archetype_name} archetype selected")

    def _validate_calculated_stats(self, schema: Roll20Schema) -> None:
        """Validate calculated stat values."""
        calculated_stats = {
            "avoidance": schema.char_avoidance,
            "durability": schema.char_durability,
            "resolve": schema.char_resolve,
            "stability": schema.char_stability,
            "vitality": schema.char_vitality,
            "accuracy": schema.char_accuracy,
            "damage": schema.char_damage,
            "conditions": schema.char_conditions,
            "movement": schema.char_movement,
            "initiative": schema.char_initiative
        }
        
        for stat_name, stat_value in calculated_stats.items():
            if not stat_value.isdigit():
                self.errors.append(f"Calculated stat {stat_name} must be numeric")
            elif int(stat_value) < 0:
                self.errors.append(f"Calculated stat {stat_name} cannot be negative")

    def _validate_attacks(self, schema: Roll20Schema) -> None:
        """Validate attack entries."""
        if not schema.repeating_attacks:
            self.warnings.append("No attacks defined")
            return
        
        for attack_id, attack_data in schema.repeating_attacks.items():
            self._validate_single_attack(attack_id, attack_data)

    def _validate_single_attack(self, attack_id: str, attack_data: Dict[str, str]) -> None:
        """Validate a single attack entry."""
        # Check required fields
        required_fields = ["AttackName", "leftsub", "AttackType"]
        for field in required_fields:
            if field not in attack_data or not attack_data[field]:
                self.errors.append(f"Attack {attack_id} missing required field: {field}")
        
        # Check attack type is valid
        attack_type = attack_data.get("AttackType", "")
        if attack_type and not attack_type.isdigit():
            self.errors.append(f"Attack {attack_id} has invalid AttackType: {attack_type}")
        
        # Check for upgrade conflicts or invalid combinations
        self._validate_attack_upgrades(attack_id, attack_data)

    def _validate_attack_upgrades(self, attack_id: str, attack_data: Dict[str, str]) -> None:
        """Validate attack upgrade combinations."""
        # Get all upgrade fields that are set to "1"
        active_upgrades = []
        for field, value in attack_data.items():
            if field in Roll20Schema.get_all_attack_upgrade_fields() and value == "1":
                active_upgrades.append(field)
        
        # Check for conflicting upgrades
        conflicts = [
            (["AccurateAttack", "PowerAttack"], "Accurate Attack and Power Attack are mutually exclusive"),
            (["HighImpact", "EnhancedEffect"], "High Impact and Enhanced Effect may be redundant")
        ]
        
        for conflict_group, message in conflicts:
            active_in_group = [upgrade for upgrade in active_upgrades if upgrade in conflict_group]
            if len(active_in_group) > 1:
                self.warnings.append(f"Attack {attack_id}: {message}")

    def _validate_repeating_sections(self, schema: Roll20Schema) -> None:
        """Validate repeating section entries."""
        # Validate traits
        for trait_id, trait_data in schema.repeating_traits.items():
            if "traitName" not in trait_data or not trait_data["traitName"]:
                self.errors.append(f"Trait {trait_id} missing name")
        
        # Validate features
        for feature_id, feature_data in schema.repeating_features.items():
            if "char_features" not in feature_data or not feature_data["char_features"]:
                self.errors.append(f"Feature {feature_id} missing name")
        
        # Validate unique abilities
        for ability_id, ability_data in schema.repeating_uniqueabilities.items():
            if "char_uniqueAbilities" not in ability_data or not ability_data["char_uniqueAbilities"]:
                self.errors.append(f"Unique ability {ability_id} missing name")

    def _validate_data_consistency(self, schema: Roll20Schema) -> None:
        """Validate data consistency across sections."""
        # Check that tier is consistent with calculated stats
        tier = int(schema.char_tier) if schema.char_tier.isdigit() else 1
        
        # High tier characters should have reasonable stats
        if tier >= 5:
            total_attributes = sum(int(getattr(schema, f"char_{attr}", 0)) 
                                 for attr in ["focus", "mobility", "power", "endurance", 
                                            "awareness", "communication", "intelligence"])
            if total_attributes < tier * 2:
                self.warnings.append(f"Tier {tier} character has low total attributes ({total_attributes})")
        
        # Check HP format
        if schema.char_hp and "/" not in schema.char_hp:
            self.warnings.append("HP should be in format 'current/max' (e.g., '100/100')")

    def generate_report(self, schema: Roll20Schema) -> str:
        """Generate a detailed validation report."""
        is_valid, errors, warnings = self.validate_schema(schema)
        
        report_lines = [
            f"Validation Report for: {schema.character_name}",
            f"Overall Status: {'VALID' if is_valid else 'INVALID'}",
            ""
        ]
        
        if errors:
            report_lines.append("ERRORS:")
            for error in errors:
                report_lines.append(f"  ? {error}")
            report_lines.append("")
        
        if warnings:
            report_lines.append("WARNINGS:")
            for warning in warnings:
                report_lines.append(f"  ??  {warning}")
            report_lines.append("")
        
        # Add summary statistics
        report_lines.extend([
            "SUMMARY:",
            f"  Character Name: {schema.character_name}",
            f"  Tier: {schema.char_tier}",
            f"  Attacks: {len(schema.repeating_attacks)}",
            f"  Features: {len(schema.repeating_features)}",
            f"  Traits: {len(schema.repeating_traits)}",
            f"  Unique Abilities: {len(schema.repeating_uniqueabilities)}",
        ])
        
        return "\n".join(report_lines)
