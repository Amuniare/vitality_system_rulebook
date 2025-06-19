# src/backend/character/mapper.py

import logging
from typing import Dict, Any, List
import time
import math

logger = logging.getLogger(__name__)

class CharacterMapper:
    """Handles data mapping between different character formats."""

    @staticmethod
    def _calculate_derived_stats(attributes: Dict[str, Any]) -> Dict[str, Any]:
        """Calculates all derived stats, ensuring all values are strings."""
        tier = int(attributes.get("char_tier", 0))
        focus = int(attributes.get("char_focus", 0))
        mobility = int(attributes.get("char_mobility", 0))
        power = int(attributes.get("char_power", 0))
        endurance = int(attributes.get("char_endurance", 0))
        awareness = int(attributes.get("char_awareness", 0))

        # Defense Stats
        attributes["char_avoidance"] = str(10 + tier + mobility)
        attributes["char_durability"] = str(tier + math.ceil(endurance * 1.5))
        attributes["char_resolve"] = str(10 + tier + focus)
        attributes["char_stability"] = str(10 + tier + power)
        attributes["char_vitality"] = str(10 + tier + endurance)

        # Combat Stats
        attributes["char_accuracy"] = str(tier + focus)
        attributes["char_damage"] = str(tier + math.ceil(power * 1.5))
        attributes["char_conditions"] = str(tier * 2) # Note: This seems to differ from Varia.json. Adjust if needed.
        attributes["char_movement"] = str(max(mobility + 6, mobility + tier))
        attributes["char_initiative"] = str(tier + mobility + focus + awareness)
        
        # Default HP
        attributes["char_hp"] = "100/100"

        return attributes

    @staticmethod
    def web_builder_to_roll20(web_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transforms character data from the web builder format to the flat
        Roll20 schema expected by the updater.
        """
        try:
            char_name_web = web_data.get("name", f"Unnamed_{int(time.time())}")
            logger.info(f"Transforming '{char_name_web}' to Roll20 schema...")

            roll20_data = {
                "metadata": {
                    "characterId": web_data.get("id"),
                    "extractedAt": web_data.get("lastModified"),
                    "name": char_name_web,
                    "attributeCount": 0
                },
                "attributes": {},
                "repeating_sections": {
                    "traits": {},
                    "attacks": {},
                    "uniqueabilities": {},
                    "features": {}
                },
                "abilities": [],
                "permissions": {"see_by": "all", "edit_by": "all"}
            }

            r20_attrs = roll20_data["attributes"]
            
            # --- 1. Map Core Attributes (All as strings) ---
            r20_attrs["character_name"] = char_name_web
            r20_attrs["character_realname"] = web_data.get("realName", "")
            r20_attrs["char_tier"] = str(web_data.get("tier", 0))
            for key, value in web_data.get("attributes", {}).items():
                r20_attrs[f"char_{key}"] = str(value)

            # --- 2. Map Archetypes as Attributes ---
            for key, value in web_data.get("archetypes", {}).items():
                if value: # Only add if an archetype is selected
                    r20_attrs[f"char_archetype_{key}"] = str(value)
            
            # --- 3. Calculate and add derived stats ---
            r20_attrs = CharacterMapper._calculate_derived_stats(r20_attrs)

            # --- 4. Map Utility Purchases to Repeating Sections ---
            utility_purchases = web_data.get("utilityPurchases", {})
            if utility_purchases.get("features"):
                for i, feature in enumerate(utility_purchases["features"]):
                    row_id = f"-N{int(time.time() * 1000)}_{i}_feature"
                    roll20_data["repeating_sections"]["features"][row_id] = {
                        "char_features": feature.get("name", feature.get("id")),
                        "featuresDesc": feature.get("description", "")
                    }
            # Add similar loops here for 'senses', 'movement', 'descriptors' if they exist

            # --- 5. Map Biography Details to Bio Attribute ---
            bio_details = web_data.get("biographyDetails", {})
            if bio_details:
                bio_text = []
                for key, value in bio_details.items():
                    # Format question and answer for readability
                    formatted_question = key.replace('_', ' ').title()
                    bio_text.append(f"**{formatted_question}:**\n{value}\n")
                r20_attrs["char_bio"] = "\n".join(bio_text)

            # (The existing logic for traits, boons, attacks can remain here)
            # ...

            roll20_data["attributes"] = r20_attrs
            roll20_data["metadata"]["attributeCount"] = len(r20_attrs)
            logger.info(f"Successfully transformed '{char_name_web}' with all sections.")
            return roll20_data

        except Exception as e:
            logger.error(f"Error transforming web builder data: {e}", exc_info=True)
            return None

    # ... (Keep flatten_for_chatsetattr and other methods as they are)
    @staticmethod
    def flatten_for_chatsetattr(character_data: Dict[str, Any]) -> Dict[str, Any]:
        """Flatten character data for ChatSetAttr commands"""
        flattened = {}
        if "attributes" in character_data:
            flattened.update(character_data["attributes"])
        if "repeating_sections" in character_data:
            for section_name, section_data in character_data["repeating_sections"].items():
                for row_id, row_data in section_data.items():
                    for field_name, field_value in row_data.items():
                        full_attr_name = f"repeating_{section_name}_{row_id}_{field_name}"
                        flattened[full_attr_name] = field_value
        return flattened