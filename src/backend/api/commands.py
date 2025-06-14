"""
Roll20 API command builders for ChatSetAttr and other scripts
"""
from typing import Dict, List, Any, Optional


class Roll20Commands:
    """Builds commands for Roll20 API scripts"""
    
    @staticmethod
    def set_attribute(char_name: str, attribute: str, value: Any) -> str:
        """Build command to set a single attribute"""
        return f"!setattr --name {char_name} --{attribute}|{value}"
    
    @staticmethod
    def set_multiple_attributes(char_name: str, attributes: Dict[str, Any]) -> str:
        """Build command to set multiple attributes at once"""
        attrs = " ".join([f"--{k}|{v}" for k, v in attributes.items()])
        return f"!setattr --name {char_name} {attrs}"
    
    @staticmethod
    def create_repeating_item(char_name: str, section: str, fields: Dict[str, Any]) -> str:
        """Create a new repeating section item"""
        # ChatSetAttr syntax for creating repeating items
        attrs = []
        for field, value in fields.items():
            attrs.append(f"--repeating_{section}_-CREATE_{field}|{value}")
        
        attrs_str = " ".join(attrs)
        return f"!setattr --name {char_name} {attrs_str}"
    
    @staticmethod
    def delete_repeating_section(char_name: str, section: str) -> str:
        """Delete all items in a repeating section"""
        return f"!setattr --name {char_name} --deleteall:repeating_{section}"
    
    @staticmethod
    def list_characters() -> str:
        """List all characters (using PlayerCharacters script)"""
        return "!playercharacters"
    
    @staticmethod
    def get_character_id(char_name: str) -> str:
        """Get character ID by name"""
        return f"!charsheet --name {char_name} --show id"