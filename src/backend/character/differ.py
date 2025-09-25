"""
Character difference detection system
"""
import logging
from typing import Dict, Any, List, Optional, Set
import json

logger = logging.getLogger(__name__)


class CharacterDiffer:
    """Deep comparison system for character data to detect changes"""
    
    def __init__(self):
        self.differences = {}
        self.change_summary = {}
    
    def compare_characters(self, current_data: Dict[str, Any], template_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compare current character data with template data
        Returns comprehensive differences dictionary
        """
        logger.debug("Starting character comparison...")
        
        differences = {
            "has_changes": False,
            "sections_changed": [],
            "summary": {
                "attributes": {"changed": 0, "added": 0, "removed": 0},
                "repeating_sections": {"changed": 0, "added": 0, "removed": 0},
                "abilities": {"changed": 0, "added": 0, "removed": 0}
            },
            "details": {
                "attributes": {},
                "repeating_sections": {},
                "abilities": {}
            }
        }
        
        # Compare attributes
        attr_changes = self._compare_attributes(
            current_data.get("attributes", {}), 
            template_data.get("attributes", {})
        )
        if attr_changes["has_changes"]:
            differences["has_changes"] = True
            differences["sections_changed"].append("attributes")
            differences["details"]["attributes"] = attr_changes
            differences["summary"]["attributes"] = attr_changes["summary"]
        
        # Compare repeating sections
        repeating_changes = self._compare_repeating_sections(
            current_data.get("repeating_sections", {}),
            template_data.get("repeating_sections", {})
        )
        if repeating_changes["has_changes"]:
            differences["has_changes"] = True
            differences["sections_changed"].append("repeating_sections")
            differences["details"]["repeating_sections"] = repeating_changes
            differences["summary"]["repeating_sections"] = repeating_changes["summary"]
        
        # Compare abilities
        ability_changes = self._compare_abilities(
            current_data.get("abilities", []),
            template_data.get("abilities", [])
        )
        if ability_changes["has_changes"]:
            differences["has_changes"] = True
            differences["sections_changed"].append("abilities")
            differences["details"]["abilities"] = ability_changes
            differences["summary"]["abilities"] = ability_changes["summary"]
        
        # Compare permissions
        permission_changes = self._compare_permissions(
            current_data.get("permissions", {}),
            template_data.get("permissions", {})
        )
        if permission_changes["has_changes"]:
            differences["has_changes"] = True
            differences["sections_changed"].append("permissions")
            differences["details"]["permissions"] = permission_changes
        
        logger.info(f"Comparison complete: {'Changes detected' if differences['has_changes'] else 'No changes'}")
        return differences
    
    def _compare_attributes(self, current: Dict[str, Any], template: Dict[str, Any]) -> Dict[str, Any]:
        """Compare regular attributes"""
        changes = {
            "has_changes": False,
            "summary": {"changed": 0, "added": 0, "removed": 0},
            "changed": {},
            "added": {},
            "removed": {}
        }
        
        # Find changed and added attributes
        for attr_name, template_value in template.items():
            current_value = current.get(attr_name)
            
            if current_value is None:
                # New attribute
                changes["added"][attr_name] = template_value
                changes["summary"]["added"] += 1
                changes["has_changes"] = True
            elif str(current_value) != str(template_value):
                # Changed attribute
                changes["changed"][attr_name] = {
                    "old": current_value,
                    "new": template_value
                }
                changes["summary"]["changed"] += 1
                changes["has_changes"] = True
        
        # Find removed attributes (in current but not in template)
        for attr_name, current_value in current.items():
            if attr_name not in template:
                changes["removed"][attr_name] = current_value
                changes["summary"]["removed"] += 1
                changes["has_changes"] = True
        
        return changes
    
    def _compare_repeating_sections(self, current: Dict[str, Any], template: Dict[str, Any]) -> Dict[str, Any]:
        """Compare repeating sections"""
        changes = {
            "has_changes": False,
            "summary": {"changed": 0, "added": 0, "removed": 0},
            "sections": {}
        }
        
        # Get all section names
        all_sections = set(current.keys()) | set(template.keys())
        
        for section_name in all_sections:
            current_section = current.get(section_name, {})
            template_section = template.get(section_name, {})
            
            section_changes = self._compare_section_rows(current_section, template_section)
            
            if section_changes["has_changes"]:
                changes["sections"][section_name] = section_changes
                changes["summary"]["changed"] += section_changes["summary"]["changed"]
                changes["summary"]["added"] += section_changes["summary"]["added"] 
                changes["summary"]["removed"] += section_changes["summary"]["removed"]
                changes["has_changes"] = True
        
        return changes
    
    def _compare_section_rows(self, current_rows: Dict[str, Any], template_rows: Dict[str, Any]) -> Dict[str, Any]:
        """Compare rows within a repeating section"""
        changes = {
            "has_changes": False,
            "summary": {"changed": 0, "added": 0, "removed": 0},
            "rows": {}
        }
        
        # Get all row IDs
        all_row_ids = set(current_rows.keys()) | set(template_rows.keys())
        
        for row_id in all_row_ids:
            current_row = current_rows.get(row_id, {})
            template_row = template_rows.get(row_id, {})
            
            if not current_row and template_row:
                # Added row
                changes["rows"][row_id] = {"action": "add", "data": template_row}
                changes["summary"]["added"] += 1
                changes["has_changes"] = True
            elif current_row and not template_row:
                # Removed row
                changes["rows"][row_id] = {"action": "remove", "data": current_row}
                changes["summary"]["removed"] += 1
                changes["has_changes"] = True
            elif current_row != template_row:
                # Changed row
                field_changes = {}
                all_fields = set(current_row.keys()) | set(template_row.keys())
                
                for field in all_fields:
                    current_val = current_row.get(field)
                    template_val = template_row.get(field)
                    
                    if str(current_val) != str(template_val):
                        field_changes[field] = {
                            "old": current_val,
                            "new": template_val
                        }
                
                if field_changes:
                    changes["rows"][row_id] = {"action": "change", "fields": field_changes}
                    changes["summary"]["changed"] += 1
                    changes["has_changes"] = True
        
        return changes
    
    def _compare_abilities(self, current: List[Dict[str, Any]], template: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compare abilities arrays"""
        changes = {
            "has_changes": False,
            "summary": {"changed": 0, "added": 0, "removed": 0},
            "abilities": {}
        }
        
        # Create lookup dictionaries by name
        current_by_name = {ability.get("name"): ability for ability in current}
        template_by_name = {ability.get("name"): ability for ability in template}
        
        # Get all ability names
        all_names = set(current_by_name.keys()) | set(template_by_name.keys())
        
        for ability_name in all_names:
            current_ability = current_by_name.get(ability_name)
            template_ability = template_by_name.get(ability_name)
            
            if not current_ability and template_ability:
                # Added ability
                changes["abilities"][ability_name] = {"action": "add", "data": template_ability}
                changes["summary"]["added"] += 1
                changes["has_changes"] = True
            elif current_ability and not template_ability:
                # Removed ability
                changes["abilities"][ability_name] = {"action": "remove", "data": current_ability}
                changes["summary"]["removed"] += 1
                changes["has_changes"] = True
            elif current_ability != template_ability:
                # Changed ability
                ability_changes = {}
                all_fields = set(current_ability.keys()) | set(template_ability.keys())
                
                for field in all_fields:
                    current_val = current_ability.get(field)
                    template_val = template_ability.get(field)
                    
                    # Special handling for content field
                    if field == "content":
                        if str(current_val) != str(template_val):
                            ability_changes[field] = {
                                "old": current_val,
                                "new": template_val
                            }
                    elif current_val != template_val:
                        ability_changes[field] = {
                            "old": current_val,
                            "new": template_val
                        }
                
                if ability_changes:
                    changes["abilities"][ability_name] = {"action": "change", "fields": ability_changes}
                    changes["summary"]["changed"] += 1
                    changes["has_changes"] = True
        
        return changes
    
    def _compare_permissions(self, current: Dict[str, Any], template: Dict[str, Any]) -> Dict[str, Any]:
        """Compare permission settings"""
        changes = {
            "has_changes": False,
            "changed": {}
        }
        
        for perm_name, template_value in template.items():
            current_value = current.get(perm_name)
            if str(current_value) != str(template_value):
                changes["changed"][perm_name] = {
                    "old": current_value,
                    "new": template_value
                }
                changes["has_changes"] = True
        
        return changes
    
    def generate_change_set(self, differences: Dict[str, Any]) -> List[str]:
        """Generate human-readable change summary"""
        if not differences.get("has_changes", False):
            return ["No changes detected"]
        
        change_lines = []
        summary = differences.get("summary", {})
        
        # Attribute changes
        attr_summary = summary.get("attributes", {})
        if any(attr_summary.values()):
            change_lines.append(f"Attributes: {attr_summary['changed']} changed, {attr_summary['added']} added, {attr_summary['removed']} removed")
        
        # Repeating section changes
        repeat_summary = summary.get("repeating_sections", {})
        if any(repeat_summary.values()):
            change_lines.append(f"Repeating Sections: {repeat_summary['changed']} changed, {repeat_summary['added']} added, {repeat_summary['removed']} removed")
        
        # Ability changes
        ability_summary = summary.get("abilities", {})
        if any(ability_summary.values()):
            change_lines.append(f"Abilities: {ability_summary['changed']} changed, {ability_summary['added']} added, {ability_summary['removed']} removed")
        
        # Sections changed
        sections = differences.get("sections_changed", [])
        if sections:
            change_lines.append(f"Sections with changes: {', '.join(sections)}")
        
        return change_lines
    
    def should_update_section(self, section_name: str, differences: Dict[str, Any]) -> bool:
        """Determine if a specific section needs updating"""
        return section_name in differences.get("sections_changed", [])
    
    def get_changed_attributes(self, differences: Dict[str, Any]) -> Dict[str, Any]:
        """Extract only the changed attributes for updating"""
        if not self.should_update_section("attributes", differences):
            return {}
        
        attr_details = differences.get("details", {}).get("attributes", {})
        changed_attrs = {}
        
        # Add changed attributes
        for attr_name, change_info in attr_details.get("changed", {}).items():
            changed_attrs[attr_name] = change_info["new"]
        
        # Add new attributes  
        for attr_name, value in attr_details.get("added", {}).items():
            changed_attrs[attr_name] = value
        
        return changed_attrs
    
    def get_changed_repeating_sections(self, differences: Dict[str, Any]) -> Dict[str, Any]:
        """Extract only the changed repeating sections for updating"""
        if not self.should_update_section("repeating_sections", differences):
            return {}
        
        repeating_details = differences.get("details", {}).get("repeating_sections", {})
        return repeating_details.get("sections", {})
    
    def get_changed_abilities(self, differences: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract only the changed abilities for updating"""
        if not self.should_update_section("abilities", differences):
            return []
        
        ability_details = differences.get("details", {}).get("abilities", {})
        changed_abilities = []
        
        for ability_name, change_info in ability_details.get("abilities", {}).items():
            if change_info["action"] in ["add", "change"]:
                if change_info["action"] == "add":
                    changed_abilities.append(change_info["data"])
                else:  # change
                    # For changed abilities, we need to reconstruct the full ability
                    # This would require getting the original ability and applying changes
                    # For now, we'll mark this as needing a full abilities update
                    pass
        
        return changed_abilities