"""
Schema Uploader - Enhanced for complete field volume
Handles ~50+ fields efficiently with validation
"""

import logging
import json
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class SchemaUploader:
    """Enhanced uploader for complete Roll20 schema"""
    
    def __init__(self, batch_size: int = 50):
        self.batch_size = batch_size
        self.validation_errors = []
        
    def upload_character(self, character_data: Dict[str, Any], character_name: str) -> bool:
        """
        Upload single character with complete field validation
        """
        try:
            logger.info(f"Uploading character: {character_name}")
            
            # Validate data structure
            if not self._validate_character_data(character_data, character_name):
                return False
            
            # Extract components
            attributes = character_data.get('attributes', {})
            repeating_sections = character_data.get('repeating_sections', {})
            abilities = character_data.get('abilities', [])
            permissions = character_data.get('permissions', {})
            
            # Log field counts
            total_fields = len(attributes) + sum(
                len(section_data) for section_data in repeating_sections.values()
            )
            
            logger.info(f"Character {character_name}: {len(attributes)} attributes, "
                       f"{len(repeating_sections)} sections, {len(abilities)} abilities, "
                       f"{total_fields} total fields")
            
            # Prepare for handout creation
            handout_data = self._prepare_handout_data(character_data)
            
            # Create upload handout
            success = self._create_upload_handout(character_name, handout_data)
            
            if success:
                logger.info(f"Successfully prepared {character_name} for upload")
                return True
            else:
                logger.error(f"Failed to prepare {character_name} for upload")
                return False
                
        except Exception as e:
            logger.error(f"Error uploading character {character_name}: {e}", exc_info=True)
            return False
    
    def bulk_upload_characters(self, characters_data: Dict[str, Dict[str, Any]]) -> Dict[str, bool]:
        """
        Upload multiple characters with enhanced batch processing
        """
        results = {}
        
        try:
            logger.info(f"Starting bulk upload of {len(characters_data)} characters")
            
            # Process in batches for better performance
            character_names = list(characters_data.keys())
            
            for i in range(0, len(character_names), self.batch_size):
                batch_names = character_names[i:i + self.batch_size]
                batch_data = {name: characters_data[name] for name in batch_names}
                
                logger.info(f"Processing batch {i//self.batch_size + 1}: {len(batch_data)} characters")
                
                # Create bulk handout for this batch
                success = self._create_bulk_handout(batch_data, i//self.batch_size + 1)
                
                # Record results
                for name in batch_names:
                    results[name] = success
                
                if success:
                    logger.info(f"Batch {i//self.batch_size + 1} prepared successfully")
                else:
                    logger.error(f"Batch {i//self.batch_size + 1} failed")
            
            return results
            
        except Exception as e:
            logger.error(f"Error in bulk upload: {e}", exc_info=True)
            return {name: False for name in characters_data.keys()}
    
    def _validate_character_data(self, character_data: Dict[str, Any], character_name: str) -> bool:
        """Enhanced validation for complete field coverage"""
        errors = []
        
        # Check required top-level keys
        required_keys = ['metadata', 'attributes', 'repeating_sections', 'abilities', 'permissions']
        for key in required_keys:
            if key not in character_data:
                errors.append(f"Missing required key: {key}")
        
        # Validate metadata
        metadata = character_data.get('metadata', {})
        if not metadata.get('name'):
            errors.append("Missing character name in metadata")
        
        # Validate attributes
        attributes = character_data.get('attributes', {})
        
        # Check critical combat stats
        critical_stats = [
            'char_tier', 'char_avoidance', 'char_durability', 'char_resolve',
            'char_stability', 'char_vitality', 'char_accuracy', 'char_damage',
            'char_conditions', 'char_movement', 'char_initiative'
        ]
        
        zero_stats = []
        for stat in critical_stats:
            if stat not in attributes:
                errors.append(f"Missing critical stat: {stat}")
            elif attributes[stat] == "0":
                zero_stats.append(stat)
        
        if zero_stats:
            errors.append(f"Critical stats are zero: {zero_stats}")
        
        # Check field count (should be ~50+ for complete character)
        total_fields = len(attributes)
        if total_fields < 30:
            errors.append(f"Suspiciously low field count: {total_fields} (expected ~50+)")
        
        # Log validation results
        if errors:
            logger.warning(f"Validation issues for {character_name}: {errors}")
            self.validation_errors.extend(errors)
            
            # Allow upload with warnings but log issues
            return True
        else:
            logger.debug(f"Validation passed for {character_name}")
            return True
    
    def _prepare_handout_data(self, character_data: Dict[str, Any]) -> str:
        """Prepare character data for handout creation"""
        try:
            # Create clean data structure for handout
            handout_data = {
                "metadata": character_data.get('metadata', {}),
                "attributes": character_data.get('attributes', {}),
                "repeating_sections": character_data.get('repeating_sections', {}),
                "abilities": character_data.get('abilities', []),
                "permissions": character_data.get('permissions', {})
            }
            
            # Convert to JSON with proper formatting
            json_content = json.dumps(handout_data, indent=2, ensure_ascii=False)
            
            # Wrap with markers
            wrapped_content = f"CHARACTER_DATA_START\n{json_content}\nCHARACTER_DATA_END"
            
            return wrapped_content
            
        except Exception as e:
            logger.error(f"Error preparing handout data: {e}")
            raise
    
    def _create_upload_handout(self, character_name: str, handout_content: str) -> bool:
        """Create handout for single character upload"""
        try:
            handout_name = f"CharacterUpdater_{character_name}"
            
            # For now, return True - actual handout creation happens in browser automation
            logger.debug(f"Prepared handout '{handout_name}' ({len(handout_content)} chars)")
            return True
            
        except Exception as e:
            logger.error(f"Error creating upload handout: {e}")
            return False
    
    def _create_bulk_handout(self, batch_data: Dict[str, Dict[str, Any]], batch_number: int) -> bool:
        """Create handout for bulk character upload"""
        try:
            handout_name = f"CharacterUpdater_BulkData_{batch_number}"
            
            # Prepare bulk data structure
            bulk_content = {}
            total_size = 0
            
            for character_name, character_data in batch_data.items():
                bulk_content[character_name] = {
                    "metadata": character_data.get('metadata', {}),
                    "attributes": character_data.get('attributes', {}),
                    "repeating_sections": character_data.get('repeating_sections', {}),
                    "abilities": character_data.get('abilities', []),
                    "permissions": character_data.get('permissions', {})
                }
            
            # Convert to JSON
            json_content = json.dumps(bulk_content, indent=2, ensure_ascii=False)
            total_size = len(json_content.encode('utf-8'))
            
            # Check size limits (Roll20 handout limit is ~10MB)
            max_size = 8 * 1024 * 1024  # 8MB safety margin
            if total_size > max_size:
                logger.warning(f"Batch {batch_number} size ({total_size/1024/1024:.1f}MB) exceeds safe limit")
                # Could implement compression or splitting here
            
            # Wrap with markers
            wrapped_content = f"BULK_UPDATE_START\n{json_content}\nBULK_UPDATE_END"
            
            logger.info(f"Prepared bulk handout '{handout_name}' ({total_size/1024:.1f}KB)")
            return True
            
        except Exception as e:
            logger.error(f"Error creating bulk handout: {e}")
            return False
    
    def get_validation_summary(self) -> Dict[str, Any]:
        """Get summary of validation issues"""
        return {
            "total_errors": len(self.validation_errors),
            "error_types": list(set(self.validation_errors)),
            "details": self.validation_errors
        }
    
    def clear_validation_errors(self):
        """Clear accumulated validation errors"""
        self.validation_errors.clear()

logger.info("SchemaUploader loaded with enhanced field volume support")