"""
Schema Uploader - Upload Roll20 Schema to Roll20

This module handles uploading the Roll20 schema to Roll20 servers
via the API, with proper error handling and validation.
"""

import json
import requests
from typing import Dict, Any, Optional, List
from .roll20_schema import Roll20Schema
import logging


class SchemaUploader:
    """Handles uploading Roll20 schemas to Roll20."""
    
    def __init__(self, api_base_url: str = None):
        """Initialize uploader with API configuration."""
        self.api_base_url = api_base_url or "https://roll20.net/api"
        self.session = requests.Session()
        self.logger = logging.getLogger(__name__)

    def upload_character(self, schema: Roll20Schema, character_id: Optional[str] = None) -> Dict[str, Any]:
        """Upload character schema to Roll20."""
        
        # Validate schema before upload
        validation_errors = schema.validate()
        if validation_errors:
            raise ValueError(f"Schema validation failed: {validation_errors}")
        
        # Convert schema to Roll20 format
        character_data = schema.to_dict()
        
        # Add metadata
        upload_data = {
            "character_data": character_data,
            "character_id": character_id,
            "update_timestamp": self._get_timestamp()
        }
        
        self.logger.info(f"Uploading character: {schema.character_name}")
        
        try:
            if character_id:
                # Update existing character
                return self._update_character(character_id, upload_data)
            else:
                # Create new character
                return self._create_character(upload_data)
                
        except requests.RequestException as e:
            self.logger.error(f"Upload failed: {e}")
            raise

    def _create_character(self, upload_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new character on Roll20."""
        endpoint = f"{self.api_base_url}/characters"
        
        response = self.session.post(
            endpoint,
            json=upload_data,
            headers=self._get_headers()
        )
        
        response.raise_for_status()
        return response.json()

    def _update_character(self, character_id: str, upload_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing character on Roll20."""
        endpoint = f"{self.api_base_url}/characters/{character_id}"
        
        response = self.session.put(
            endpoint,
            json=upload_data,
            headers=self._get_headers()
        )
        
        response.raise_for_status()
        return response.json()

    def _get_headers(self) -> Dict[str, str]:
        """Get standard headers for API requests."""
        return {
            "Content-Type": "application/json",
            "User-Agent": "VitalitySystem-SchemaUploader/1.0"
        }

    def _get_timestamp(self) -> str:
        """Get current timestamp for upload tracking."""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"

    def upload_from_file(self, schema_file_path: str, character_id: Optional[str] = None) -> Dict[str, Any]:
        """Load schema from file and upload to Roll20."""
        with open(schema_file_path, 'r', encoding='utf-8') as f:
            schema_data = json.load(f)
        
        schema = Roll20Schema.from_dict(schema_data)
        return self.upload_character(schema, character_id)

    def batch_upload(self, schemas: List[Roll20Schema]) -> List[Dict[str, Any]]:
        """Upload multiple characters in batch."""
        results = []
        
        for i, schema in enumerate(schemas):
            try:
                self.logger.info(f"Uploading character {i+1}/{len(schemas)}: {schema.character_name}")
                result = self.upload_character(schema)
                results.append({
                    "success": True,
                    "character_name": schema.character_name,
                    "result": result
                })
            except Exception as e:
                self.logger.error(f"Failed to upload {schema.character_name}: {e}")
                results.append({
                    "success": False,
                    "character_name": schema.character_name,
                    "error": str(e)
                })
        
        return results

    def validate_upload(self, schema: Roll20Schema) -> Dict[str, Any]:
        """Validate schema for upload without actually uploading."""
        validation_result = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "character_name": schema.character_name
        }
        
        # Run schema validation
        errors = schema.validate()
        if errors:
            validation_result["valid"] = False
            validation_result["errors"].extend(errors)
        
        # Check for common issues
        if not schema.repeating_attacks:
            validation_result["warnings"].append("No attacks defined")
        
        if not any([schema.repeating_features, schema.repeating_traits, 
                   schema.repeating_uniqueabilities]):
            validation_result["warnings"].append("No features, traits, or unique abilities defined")
        
        return validation_result
