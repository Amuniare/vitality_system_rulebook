# src/backend/character/mapper.py

import logging
from typing import Dict, Any, List
import time
import math
import json # Import json for loading skill data

logger = logging.getLogger(__name__)

# --- HELPER DATA (This should ideally be managed by a data loader) ---
# For now, we'll load it directly in the mapper for simplicity.
# This maps skill IDs from the web builder to their parent attribute.
SKILL_TO_ATTRIBUTE_MAP = {}
try:
    # This assumes you are running main.py from the project root.
    with open('frontend/character-builder/data/expertise.json', 'r') as f:
        expertise_data = json.load(f)
        categories = expertise_data.get("Expertises", {}).get("types", {}).get("activityBased", {}).get("categories", {})
        for attribute, skills in categories.items():
            for skill in skills:
                skill_id = skill.get("name", "").lower().replace(" ", "")
                SKILL_TO_ATTRIBUTE_MAP[skill_id] = attribute.lower()
    logger.info("Successfully loaded skill-to-attribute map.")
except Exception as e:
    logger.error(f"Could not load expertise.json to build skill map: {e}")
# --- END HELPER DATA ---


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

        attributes["char_avoidance"] = str(10 + tier + mobility)
        attributes["char_durability"] = str(tier + math.ceil(endurance * 1.5))
        attributes["char_resolve"] = str(10 + tier + focus)
        attributes["char_stability"] = str(10 + tier + power)
        attributes["char_vitality"] = str(10 + tier + endurance)
        attributes["char_accuracy"] = str(tier + focus)
        attributes["char_damage"] = str(tier + math.ceil(power * 1.5))
        attributes["char_conditions"] = str(tier * 2)
        attributes["char_movement"] = str(max(mobility + 6, mobility + tier))
        attributes["char_initiative"] = str(tier + mobility + focus + awareness)
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
                "metadata": { "characterId": web_data.get("id"), "extractedAt": web_data.get("lastModified"), "name": char_name_web, "attributeCount": 0 },
                "attributes": {},
                "repeating_sections": { "traits": {}, "attacks": {}, "uniqueabilities": {}, "features": {} },
                "abilities": [],
                "permissions": {"see_by": "all", "edit_by": "all"}
            }

            r20_attrs = roll20_data["attributes"]
            
            # --- 1. Map Core Attributes & Archetypes ---
            r20_attrs["character_name"] = char_name_web
            r20_attrs["character_realname"] = web_data.get("realName", "")
            r20_attrs["char_tier"] = str(web_data.get("tier", 0))
            for key, value in web_data.get("attributes", {}).items():
                r20_attrs[f"char_{key}"] = str(value)
            for key, value in web_data.get("archetypes", {}).items():
                if value: r20_attrs[f"char_archetype_{key}"] = str(value)
            
            # --- 2. Calculate Derived Stats ---
            r20_attrs = CharacterMapper._calculate_derived_stats(r20_attrs)

            # --- 3. Map Biography Details ---
            bio_details = web_data.get("biographyDetails", {})
            if bio_details:
                bio_text = [f"**{key.replace('_', ' ').title()}:**\n{value}\n" for key, value in bio_details.items()]
                r20_attrs["char_bio"] = "\n".join(bio_text)
            
            # --- 4. Map Utility Archetype Selections (Expertise) ---
            utility_archetype = web_data.get("archetypes", {}).get("utility")
            selections = web_data.get("utilityArchetypeSelections", {})
            
            if utility_archetype == 'practical' and selections.get('practicalSkills'):
                for skill_id in selections['practicalSkills']:
                    attribute = SKILL_TO_ATTRIBUTE_MAP.get(skill_id)
                    if attribute:
                        section_name = f"repeating_{attribute}expertises"
                        field_prefix = f"{attribute}Expertise"
                        if section_name not in roll20_data["repeating_sections"]:
                            roll20_data["repeating_sections"][section_name] = {}
                        
                        row_id = f"-N{int(time.time() * 1000)}_{len(roll20_data['repeating_sections'][section_name])}"
                        skill_name = skill_id.replace("of", " of ").title() # Simple formatting
                        roll20_data["repeating_sections"][section_name][row_id] = {
                            f"{field_prefix}Active": "on",
                            f"{field_prefix}Name": skill_name
                        }
            
            # --- 5. Map Main Pool Purchases ---
            main_pool = web_data.get("mainPoolPurchases", {})
            # (Your existing logic for traits, boons, etc. can be added here)

            # --- 6. Map Utility Purchases (Generic Features) ---
            feature_section = roll20_data["repeating_sections"]["features"]
            if web_data.get("utilityPurchases", {}).get("features"):
                for i, feature in enumerate(web_data["utilityPurchases"]["features"]):
                    row_id = f"-N{int(time.time() * 1000)}_{i}_genfeature"
                    feature_section[row_id] = {
                        "char_features": feature.get("name", "Unnamed Feature"),
                        "featuresDesc": feature.get("description", "")
                    }

            # --- Finalize ---
            roll20_data["attributes"] = r20_attrs
            roll20_data["metadata"]["attributeCount"] = len(r20_attrs)
            logger.info(f"Successfully transformed '{char_name_web}' with all sections.")
            return roll20_data

        except Exception as e:
            logger.error(f"Error transforming web builder data: {e}", exc_info=True)
            return None

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