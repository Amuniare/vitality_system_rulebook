"""
Schema Validator - Complete validation for Roll20 characters
Validates against complete specification
"""

import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

class SchemaValidator:
    """Complete validation system for Roll20 character data"""
    
    def __init__(self):
        self.required_attributes = self._get_required_attributes()
        self.combat_stats = self._get_combat_stats()
        self.stat_patterns = self._get_stat_patterns()
        
    def validate_character(self, character_data: Dict[str, Any]) -> Tuple[bool, List[str], List[str]]:
        """
        Complete character validation
        Returns: (is_valid, errors, warnings)
        """
        errors = []
        warnings = []
        
        try:
            # Validate structure
            struct_errors, struct_warnings = self._validate_structure(character_data)
            errors.extend(struct_errors)
            warnings.extend(struct_warnings)
            
            # Validate attributes
            attr_errors, attr_warnings = self._validate_attributes(character_data)
            errors.extend(attr_errors)
            warnings.extend(attr_warnings)
            
            # Validate combat stats
            combat_errors, combat_warnings = self._validate_combat_stats(character_data)
            errors.extend(combat_errors)
            warnings.extend(combat_warnings)
            
            # Validate field patterns
            pattern_errors, pattern_warnings = self._validate_field_patterns(character_data)
            errors.extend(pattern_errors)
            warnings.extend(pattern_warnings)
            
            # Validate repeating sections
            repeat_errors, repeat_warnings = self._validate_repeating_sections(character_data)
            errors.extend(repeat_errors)
            warnings.extend(repeat_warnings)
            
            # Overall validation result
            is_valid = len(errors) == 0
            
            character_name = character_data.get('metadata', {}).get('name', 'Unknown')
            logger.info(f"Validation complete for {character_name}: "
                       f"Valid={is_valid}, Errors={len(errors)}, Warnings={len(warnings)}")
            
            return is_valid, errors, warnings
            
        except Exception as e:
            logger.error(f"Error during validation: {e}", exc_info=True)
            return False, [f"Validation exception: {e}"], []
    
    def _validate_structure(self, character_data: Dict[str, Any]) -> Tuple[List[str], List[str]]:
        """Validate top-level data structure"""
        errors = []
        warnings = []
        
        # Required top-level keys
        required_keys = ['metadata', 'attributes', 'repeating_sections', 'abilities', 'permissions']
        
        for key in required_keys:
            if key not in character_data:
                errors.append(f"Missing required top-level key: {key}")
            elif not isinstance(character_data[key], (dict, list)):
                errors.append(f"Invalid type for {key}: expected dict/list, got {type(character_data[key])}")
        
        # Validate metadata structure
        metadata = character_data.get('metadata', {})
        if not metadata.get('name'):
            errors.append("Missing character name in metadata")
        if not metadata.get('characterId'):
            warnings.append("Missing character ID in metadata")
        
        return errors, warnings
    
    def _validate_attributes(self, character_data: Dict[str, Any]) -> Tuple[List[str], List[str]]:
        """Validate attribute fields and values"""
        errors = []
        warnings = []
        
        attributes = character_data.get('attributes', {})
        
        # Check required attributes
        for attr_name in self.required_attributes:
            if attr_name not in attributes:
                errors.append(f"Missing required attribute: {attr_name}")
            elif not isinstance(attributes[attr_name], str):
                errors.append(f"Attribute {attr_name} must be string, got {type(attributes[attr_name])}")
        
        # Validate tier
        tier = attributes.get('char_tier', '0')
        try:
            tier_val = int(tier)
            if tier_val < 1 or tier_val > 10:
                warnings.append(f"Unusual tier value: {tier_val} (expected 1-10)")
        except ValueError:
            errors.append(f"Invalid tier value: {tier} (must be numeric)")
        
        # Validate core attributes
        core_attrs = ['char_focus', 'char_mobility', 'char_power', 'char_endurance', 
                     'char_awareness', 'char_communication', 'char_intelligence']
        
        for attr in core_attrs:
            if attr in attributes:
                try:
                    val = int(attributes[attr])
                    if val < 0 or val > 10:
                        warnings.append(f"Unusual {attr} value: {val} (expected 0-10)")
                except ValueError:
                    errors.append(f"Invalid {attr} value: {attributes[attr]} (must be numeric)")
        
        return errors, warnings
    
    def _validate_combat_stats(self, character_data: Dict[str, Any]) -> Tuple[List[str], List[str]]:
        """Validate combat statistics"""
        errors = []
        warnings = []
        
        attributes = character_data.get('attributes', {})
        
        # Check all combat stats are present and non-zero
        zero_stats = []
        missing_stats = []
        
        for stat in self.combat_stats:
            if stat not in attributes:
                missing_stats.append(stat)
            elif attributes[stat] == "0":
                zero_stats.append(stat)
            else:
                try:
                    val = int(attributes[stat])
                    if val < 0:
                        warnings.append(f"Negative {stat}: {val}")
                    elif val > 100:
                        warnings.append(f"Very high {stat}: {val}")
                except ValueError:
                    errors.append(f"Invalid {stat} value: {attributes[stat]} (must be numeric)")
        
        if missing_stats:
            errors.extend([f"Missing combat stat: {stat}" for stat in missing_stats])
        
        if zero_stats:
            # Zero stats are critical errors - character will be unplayable
            errors.extend([f"Critical stat is zero: {stat}" for stat in zero_stats])
        
        return errors, warnings
    
    def _validate_field_patterns(self, character_data: Dict[str, Any]) -> Tuple[List[str], List[str]]:
        """Validate 4-field patterns for stats"""
        errors = []
        warnings = []
        
        attributes = character_data.get('attributes', {})
        
        # Check each stat has complete 4-field pattern
        for stat_base in self.stat_patterns:
            expected_fields = [
                f'char_{stat_base}',
                f'display_{stat_base}',
                f'char_{stat_base}Mod',
                f'char_{stat_base}PrimaryAction'
            ]
            
            missing_in_pattern = []
            for field in expected_fields:
                if field not in attributes:
                    missing_in_pattern.append(field)
            
            if missing_in_pattern:
                warnings.append(f"Incomplete {stat_base} pattern, missing: {missing_in_pattern}")
        
        return errors, warnings
    
    def _validate_repeating_sections(self, character_data: Dict[str, Any]) -> Tuple[List[str], List[str]]:
        """Validate repeating sections structure"""
        errors = []
        warnings = []
        
        repeating_sections = character_data.get('repeating_sections', {})
        
        # Validate section structure
        for section_name, section_data in repeating_sections.items():
            if not isinstance(section_data, dict):
                errors.append(f"Repeating section {section_name} must be dict, got {type(section_data)}")
                continue
            
            # Validate row structure
            for row_id, row_data in section_data.items():
                if not isinstance(row_data, dict):
                    errors.append(f"Row {row_id} in section {section_name} must be dict")
                    continue
                
                # Validate row ID format
                if not row_id.startswith('-N'):
                    warnings.append(f"Unusual row ID format: {row_id} (expected to start with -N)")
                
                # Validate field values are strings
                for field_name, field_value in row_data.items():
                    if not isinstance(field_value, str):
                        warnings.append(f"Field {field_name} in {section_name}.{row_id} should be string")
        
        return errors, warnings
    
    def _get_required_attributes(self) -> List[str]:
        """Get list of required attribute fields"""
        return [
            'character_name', 'char_tier',
            'char_focus', 'char_mobility', 'char_power', 'char_endurance',
            'char_awareness', 'char_communication', 'char_intelligence'
        ]
    
    def _get_combat_stats(self) -> List[str]:
        """Get list of critical combat statistics"""
        return [
            'char_avoidance', 'char_durability', 'char_resolve', 'char_stability', 'char_vitality',
            'char_accuracy', 'char_damage', 'char_conditions', 'char_movement', 'char_initiative'
        ]
    
    def _get_stat_patterns(self) -> List[str]:
        """Get list of stats that should have 4-field patterns"""
        return [
            'avoidance', 'durability', 'resolve', 'stability', 'vitality',
            'accuracy', 'damage', 'conditions', 'movement', 'initiative'
        ]
    
    def validate_field_coverage(self, character_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate field coverage against complete specification"""
        attributes = character_data.get('attributes', {})
        
        # Expected field counts based on documentation
        expected_counts = {
            'basic_info': 5,        # name, realname, tier, efforts, hp
            'core_attributes': 7,   # focus, mobility, power, endurance, awareness, communication, intelligence
            'attribute_totals': 7,  # 7 expertise totals
            'defense_stats': 20,    # 5 stats × 4 fields each
            'combat_stats': 20,     # 5 stats × 4 fields each  
            'archetypes': 7,        # 7 archetype selections
            'meta': 3               # sheet_tab, bio, etc.
        }
        
        total_expected = sum(expected_counts.values())  # ~69 fields
        actual_count = len(attributes)
        
        coverage_ratio = actual_count / total_expected if total_expected > 0 else 0
        
        return {
            'expected_total': total_expected,
            'actual_count': actual_count,
            'coverage_ratio': coverage_ratio,
            'is_complete': coverage_ratio >= 0.9,  # 90% coverage threshold
            'missing_estimated': max(0, total_expected - actual_count),
            'category_breakdown': expected_counts
        }

logger.info("SchemaValidator loaded with complete Roll20 specification validation")