"""
Character data format converter.
Maps web builder format to Roll20 schema.
"""
from typing import Dict, Any, List
import logging
import time
import math

logger = logging.getLogger(__name__)


class CharacterMapper:
    """Handles data mapping between different character formats."""

    @staticmethod
    def _calculate_derived_stats(attributes: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates all derived stats based on core attributes, replicating the
        Roll20 character sheet's auto-calculation logic.
        """
        # Ensure all base attributes are integers, default to 0 if missing
        tier = int(attributes.get("char_tier", 0))
        focus = int(attributes.get("char_focus", 0))
        mobility = int(attributes.get("char_mobility", 0))
        power = int(attributes.get("char_power", 0))
        endurance = int(attributes.get("char_endurance", 0))
        awareness = int(attributes.get("char_awareness", 0))

        # Defense Stats (based on docs/data-formats.md)
        attributes["char_avoidance"] = 10 + tier + mobility
        attributes["char_durability"] = tier + math.ceil(endurance * 1.5)
        attributes["char_resolve"] = 10 + tier + focus
        attributes["char_stability"] = 10 + tier + power
        attributes["char_vitality"] = 10 + tier + endurance

        # Combat Stats
        attributes["char_accuracy"] = tier + focus
        attributes["char_damage"] = tier + math.ceil(power * 1.5)
        attributes["char_conditions"] = tier * 2
        attributes["char_movement"] = max(mobility + 6, mobility + tier)
        attributes["char_initiative"] = tier + mobility + focus + awareness
        
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

            # Base structure for Roll20
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

            # 1. Map top-level and simple attributes
            r20_attrs = roll20_data["attributes"]
            r20_attrs["character_name"] = char_name_web
            r20_attrs["character_realname"] = web_data.get("realName", "")
            r20_attrs["char_tier"] = int(web_data.get("tier", 0))
            for key, value in web_data.get("attributes", {}).items():
                r20_attrs[f"char_{key}"] = int(value)

            # 2. Calculate and add derived stats
            r20_attrs = CharacterMapper._calculate_derived_stats(r20_attrs)
            roll20_data["attributes"] = r20_attrs

            # 3. Map Main Pool Purchases
            main_pool = web_data.get("mainPoolPurchases", {})
            
            # Map Traits
            for i, trait in enumerate(main_pool.get("traits", [])):
                row_id = f"-M{int(time.time() * 1000)}_{i}_trait"
                r20_trait = {"traitActive": "1", "traitName": f"Custom Trait {i+1}"}
                for bonus in trait.get("statBonuses", []):
                    # This requires a mapping from 'damage' -> 'traitDgBonus' etc.
                    bonus_map = {
                        "damage": "traitDgBonus", "accuracy": "traitAcBonus",
                        "conditions": "traitCnBonus", "avoidance": "traitAvBonus",
                        "durability": "traitDrBonus", "resolve": "traitRsBonus",
                        "stability": "traitSbBonus", "vitality": "traitVtBonus",
                        "movement": "traitMBonus"
                    }
                    if bonus in bonus_map:
                        r20_trait[bonus_map[bonus]] = web_data.get("tier")
                roll20_data["repeating_sections"]["traits"][row_id] = r20_trait

            # Map Boons (as features or unique abilities)
            for i, boon in enumerate(main_pool.get("boons", [])):
                row_id = f"-M{int(time.time() * 1000)}_{i}_boon"
                if boon.get("type") == "unique":
                     roll20_data["repeating_sections"]["uniqueabilities"][row_id] = {
                        "char_uniqueAbilities": boon.get("name"),
                        "uniqueAbilitiesDesc": boon.get("effect", "")
                     }
                else:
                    roll20_data["repeating_sections"]["features"][row_id] = {
                        "char_features": boon.get("name"),
                        "featuresDesc": boon.get("effect", "")
                    }

            # 4. Map Special Attacks
            for i, attack in enumerate(web_data.get("specialAttacks", [])):
                row_id = f"-M{int(time.time() * 1000)}_{i}_attack"
                attack_name = attack.get("name", f"Special Attack {i+1}")
                r20_attack = {"AttackName": attack_name}
                
                # Map upgrades
                for upgrade in attack.get("upgrades", []):
                    # Convert upgrade name 'Armor Piercing' to 'ArmorPiercing'
                    attr_name = upgrade.get("id", "").title().replace(" ", "")
                    if attr_name:
                        r20_attack[attr_name] = "1"

                roll20_data["repeating_sections"]["attacks"][row_id] = r20_attack
                
                # Create corresponding ability for macro button
                roll20_data["abilities"].append({
                    "name": attack_name,
                    "type": "indexed",
                    "content": i, # Index of the attack
                    "showInMacroBar": True,
                    "isTokenAction": True
                })

            # Finalize attribute count
            roll20_data["metadata"]["attributeCount"] = len(r20_attrs)
            logger.info(f"Successfully transformed '{char_name_web}' with calculated stats.")
            return roll20_data

        except Exception as e:
            logger.error(f"Error transforming web builder data: {e}", exc_info=True)
            return None

    @staticmethod
    def flatten_for_chatsetattr(character_data: Dict[str, Any]) -> Dict[str, Any]:
        """Flatten character data for ChatSetAttr commands"""
        # ... (rest of the file is unchanged)
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