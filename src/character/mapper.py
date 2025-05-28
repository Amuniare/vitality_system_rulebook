"""
Simplified mapper for flat JSON structure - minimal conversion needed
"""
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class CharacterMapper:
    """Minimal mapper for flat JSON structure"""
    
    @staticmethod
    def flatten_for_chatsetattr(character_data: Dict[str, Any]) -> Dict[str, Any]:
        """Flatten character data for ChatSetAttr commands"""
        flattened = {}
        
        # Add regular attributes directly
        if "attributes" in character_data:
            flattened.update(character_data["attributes"])
        
        # Convert repeating sections back to Roll20 format
        if "repeating_sections" in character_data:
            for section_name, section_data in character_data["repeating_sections"].items():
                for row_id, row_data in section_data.items():
                    for field_name, field_value in row_data.items():
                        full_attr_name = f"repeating_{section_name}_{row_id}_{field_name}"
                        flattened[full_attr_name] = field_value
        
        return flattened
    
    @staticmethod
    def extract_repeating_section_data(flattened_data: Dict[str, Any], section_name: str) -> Dict[str, Dict[str, Any]]:
        """Extract a specific repeating section from flattened data"""
        section_data = {}
        prefix = f"repeating_{section_name}_"
        
        for attr_name, attr_value in flattened_data.items():
            if attr_name.startswith(prefix):
                # Parse: repeating_sectionname_rowid_fieldname
                remainder = attr_name[len(prefix):]
                parts = remainder.split('_', 1)  # Split into rowid and fieldname
                
                if len(parts) == 2:
                    row_id, field_name = parts
                    
                    if row_id not in section_data:
                        section_data[row_id] = {}
                    
                    section_data[row_id][field_name] = attr_value
        
        return section_data
    
    @staticmethod
    def convert_old_format_to_new(old_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert old nested format to new flat format (migration helper)"""
        logger.info("Converting old format to new flat format")
        
        new_data = {
            "metadata": {
                "characterId": old_data.get("metadata", {}).get("characterId", ""),
                "extractedAt": old_data.get("metadata", {}).get("extractedAt", ""),
                "name": old_data.get("basic", {}).get("name", ""),
                "attributeCount": 0
            },
            "attributes": {},
            "repeating_sections": {},
            "abilities": [],
            "permissions": old_data.get("editSection", {}).get("permissions", {})
        }
        
        # Convert basic attributes
        if "basic" in old_data:
            basic = old_data["basic"]
            new_data["attributes"]["character_name"] = basic.get("name", "")
            new_data["attributes"]["character_realname"] = basic.get("realName", "")
            new_data["attributes"]["char_tier"] = basic.get("tier", "")
            new_data["attributes"]["char_efforts"] = basic.get("efforts", "")
        
        # Convert core stats
        if "coreStats" in old_data:
            core_stats = old_data["coreStats"]
            
            # Attributes
            if "attributes" in core_stats:
                for attr_name, attr_value in core_stats["attributes"].items():
                    new_data["attributes"][f"char_{attr_name}"] = attr_value
            
            # Attribute totals
            if "attributeTotals" in core_stats:
                new_data["attributes"].update(core_stats["attributeTotals"])
        
        # Convert repeating sections
        if "repeating" in old_data:
            for section_name, section_items in old_data["repeating"].items():
                if isinstance(section_items, list):
                    new_data["repeating_sections"][section_name] = {}
                    for item in section_items:
                        row_id = item.get("_rowId", f"generated_{len(new_data['repeating_sections'][section_name])}")
                        item_copy = item.copy()
                        item_copy.pop("_rowId", None)  # Remove _rowId from the data
                        new_data["repeating_sections"][section_name][row_id] = item_copy
        
        # Convert abilities
        if "abilities" in old_data:
            new_data["abilities"] = []
            for ability_name, ability_data in old_data["abilities"].items():
                new_data["abilities"].append({
                    "name": ability_name,
                    "content": ability_data.get("content", ""),
                    "showInMacroBar": ability_data.get("showInMacroBar", False),
                    "isTokenAction": ability_data.get("isTokenAction", False)
                })
        
        new_data["metadata"]["attributeCount"] = len(new_data["attributes"])
        
        return new_data
    
    