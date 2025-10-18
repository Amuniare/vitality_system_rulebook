"""
Format Adapter - Converts between different web builder formats
Handles the new website format that uses 'level', 'boons', 'attacks', etc.
"""

import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class FormatAdapter:
    """Adapter to convert between different web builder character formats"""

    @staticmethod
    def detect_format(web_data: Dict[str, Any]) -> str:
        """
        Detect which format version the data is in

        Returns:
            "new" - New format with 'level', 'boons', 'attacks'
            "old" - Old format with 'tier', 'mainPoolPurchases', 'specialAttacks'
        """
        # Check for distinguishing fields
        has_level = 'level' in web_data
        has_tier = 'tier' in web_data
        has_boons = 'boons' in web_data
        has_attacks = 'attacks' in web_data
        has_main_pool = 'mainPoolPurchases' in web_data
        has_special_attacks = 'specialAttacks' in web_data

        if has_level or has_boons or (has_attacks and not has_special_attacks):
            return "new"
        elif has_tier or has_main_pool or has_special_attacks:
            return "old"
        else:
            logger.warning("Cannot determine format version, defaulting to 'new'")
            return "new"

    @staticmethod
    def new_to_old_format(new_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert new website format to old format that schema mapper expects

        New format uses: level, boons, attacks, utility_attribute_selections
        Old format uses: tier, mainPoolPurchases, specialAttacks, archetypes
        """
        logger.info(f"Converting new format to old format for character: {new_data.get('name', 'Unknown')}")

        old_data = {}

        # Basic mappings
        old_data['id'] = new_data.get('id', '')
        old_data['name'] = new_data.get('name', '')
        old_data['tier'] = new_data.get('level', 4)  # level -> tier

        # Copy attributes directly (same structure)
        old_data['attributes'] = new_data.get('attributes', {})

        # Convert archetypes structure
        old_data['archetypes'] = FormatAdapter._convert_archetypes(new_data.get('archetypes', {}))

        # Convert boons to mainPoolPurchases
        old_data['mainPoolPurchases'] = FormatAdapter._convert_boons_to_main_pool(new_data.get('boons', []))

        # Convert attacks to specialAttacks
        old_data['specialAttacks'] = FormatAdapter._convert_attacks(new_data.get('attacks', []))

        # Convert utilities
        old_data['utilityPurchases'] = FormatAdapter._convert_utilities(new_data.get('utilities', []))

        # Add utility attribute selections if present
        if 'utility_attribute_selections' in new_data:
            old_data['utilityAttributeSelections'] = new_data['utility_attribute_selections']

        # Copy biography/description fields if present
        old_data['biographyDetails'] = {
            'character_bio': new_data.get('description', ''),
            'appearance_description': new_data.get('appearance_description', ''),
            'public_backstory': new_data.get('public_backstory', ''),
            'private_backstory': new_data.get('private_backstory', ''),
            'personality': new_data.get('personality', ''),
        }

        # Add talents if present
        old_data['talents'] = new_data.get('talents', [])

        logger.info(f"Converted new format to old format successfully")
        return old_data

    @staticmethod
    def _convert_archetypes(new_archetypes: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert new archetype structure to old structure

        New: { "attack": "focused_attacker", "defensive": "iron_will", "movement": "swift", "utility": "practical" }
        Old: { "attackType": "...", "effectType": "...", "defensive": "...", "movement": "...", ... }
        """
        old_archetypes = {}

        # Direct mappings
        if 'defensive' in new_archetypes:
            old_archetypes['defensive'] = new_archetypes['defensive']

        if 'movement' in new_archetypes:
            old_archetypes['movement'] = new_archetypes['movement']

        if 'utility' in new_archetypes:
            old_archetypes['utility'] = new_archetypes['utility']

        # Map 'attack' archetype to old structure
        # The new format has a single 'attack' field, old format has attackType/effectType/uniqueAbility/specialAttack
        attack_archetype = new_archetypes.get('attack', '')

        # This is a simplified mapping - you may need to adjust based on actual archetype values
        if attack_archetype:
            old_archetypes['attackType'] = attack_archetype
            # Set reasonable defaults for other attack-related archetypes
            old_archetypes['effectType'] = 'damage'  # Default
            old_archetypes['uniqueAbility'] = ''
            old_archetypes['specialAttack'] = ''

        return old_archetypes

    @staticmethod
    def _convert_boons_to_main_pool(boons: list) -> Dict[str, Any]:
        """
        Convert boons array to mainPoolPurchases structure

        New: [ { "boon_id": "...", "name": "...", "type": "...", "stat_bonuses": {...} } ]
        Old: { "traits": [...], "uniqueAbilities": [...] }
        """
        main_pool = {
            'traits': [],
            'uniqueAbilities': []
        }

        for boon in boons:
            boon_type = boon.get('type', '')

            if boon_type == 'trait':
                # Convert to trait format
                trait = {
                    'name': boon.get('name', ''),
                    'conditions': boon.get('conditions', []),
                    'statBonuses': FormatAdapter._parse_stat_bonuses(boon.get('stat_bonuses', {}))
                }
                main_pool['traits'].append(trait)

            elif boon_type in ['unique_ability', 'unique_ability_upgrade']:
                # Convert to unique ability format
                ability = {
                    'id': boon.get('boon_id', ''),
                    'name': boon.get('name', ''),
                    'description': boon.get('description', '')
                }
                main_pool['uniqueAbilities'].append(ability)

        return main_pool

    @staticmethod
    def _parse_stat_bonuses(stat_bonuses: Dict[str, Any]) -> list:
        """
        Convert stat_bonuses dict to array of stat names

        New: { "accuracy": 4, "damage": 2 }
        Old: ["accuracy", "damage"]
        """
        # Return list of stats that have non-zero bonuses
        return [stat for stat, value in stat_bonuses.items() if value != 0]

    @staticmethod
    def _convert_attacks(attacks: list) -> list:
        """
        Convert attacks array to specialAttacks format

        New: [ { "name": "...", "attack_type": "melee_accuracy", "effect_type": "damage", "upgrades": [...], "limits": [...] } ]
        Old: [ { "name": "...", "attackTypes": [...], "effectTypes": [...], "upgrades": [...] } ]
        """
        special_attacks = []

        for attack in attacks:
            # Convert attack_type (singular) to attackTypes (array)
            attack_type = attack.get('attack_type', 'melee_accuracy')
            attack_types = [attack_type] if attack_type else []

            # Convert effect_type (singular) to effectTypes (array)
            effect_type = attack.get('effect_type', 'damage')
            effect_types = [effect_type] if effect_type else []

            special_attack = {
                'name': attack.get('name', ''),
                'attackTypes': attack_types,
                'effectTypes': effect_types,
                'upgrades': FormatAdapter._convert_attack_upgrades(attack.get('upgrades', [])),
                'limits': attack.get('limits', []),
                'conditions': attack.get('conditions', []),
                'description': attack.get('description', '')
            }

            # Add hybrid order if present
            if 'hybrid_order' in attack:
                special_attack['hybridOrder'] = attack['hybrid_order']

            # Add basic/advanced conditions if present
            if 'basic_conditions' in attack:
                special_attack['basicConditions'] = attack['basic_conditions']
            if 'advanced_conditions' in attack:
                special_attack['advancedConditions'] = attack['advanced_conditions']

            special_attacks.append(special_attack)

        return special_attacks

    @staticmethod
    def _convert_attack_upgrades(upgrades: list) -> list:
        """
        Convert upgrade strings to upgrade objects if needed

        New: ["bleed", "powerful_critical", "overhit"]
        Old: [{"id": "Bleed"}, {"id": "Powerful_Critical"}, {"id": "Overhit"}]

        The schema mapper expects Title_Case with underscores
        """
        converted_upgrades = []

        for upgrade in upgrades:
            if isinstance(upgrade, str):
                # Convert lowercase_snake_case to Title_Case
                normalized = FormatAdapter._normalize_upgrade_name(upgrade)
                converted_upgrades.append({'id': normalized})
            elif isinstance(upgrade, dict) and 'id' in upgrade:
                # Normalize the ID if it exists
                upgrade_id = upgrade['id']
                normalized = FormatAdapter._normalize_upgrade_name(upgrade_id)
                converted_upgrades.append({'id': normalized})
            else:
                logger.warning(f"Unknown upgrade format: {upgrade}")

        return converted_upgrades

    @staticmethod
    def _normalize_upgrade_name(name: str) -> str:
        """
        Normalize upgrade name from lowercase_snake_case to Title_Case

        Examples:
            "bleed" -> "Bleed"
            "powerful_critical" -> "Powerful_Critical"
            "reliable_accuracy" -> "Reliable_Accuracy"
        """
        # Split by underscores and capitalize each word
        parts = name.split('_')
        title_case = '_'.join(word.capitalize() for word in parts)
        return title_case

    @staticmethod
    def _convert_utilities(utilities: list) -> Dict[str, Any]:
        """
        Convert utilities array to utilityPurchases structure

        New: [ { "name": "...", "cost": 1, "type": "..." } ]
        Old: { "features": [...], "senses": [...], "descriptors": [...], "movement": [...] }
        """
        utility_purchases = {
            'features': [],
            'senses': [],
            'descriptors': [],
            'movement': []
        }

        for utility in utilities:
            utility_type = utility.get('type', 'feature')
            utility_obj = {
                'name': utility.get('name', ''),
                'cost': utility.get('cost', 0)
            }

            # Categorize by type
            if utility_type == 'sense':
                utility_purchases['senses'].append(utility_obj)
            elif utility_type == 'descriptor':
                utility_purchases['descriptors'].append(utility_obj)
            elif utility_type == 'movement':
                utility_purchases['movement'].append(utility_obj)
            else:
                # Default to features
                utility_purchases['features'].append(utility_obj)

        return utility_purchases

    @staticmethod
    def convert_if_needed(web_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Automatically detect format and convert if needed

        Args:
            web_data: Character data in either old or new format

        Returns:
            Character data in old format (ready for schema mapper)
        """
        format_version = FormatAdapter.detect_format(web_data)

        if format_version == "new":
            logger.info("Detected new format, converting to old format")
            return FormatAdapter.new_to_old_format(web_data)
        else:
            logger.info("Detected old format, no conversion needed")
            return web_data


logger.info("FormatAdapter loaded - supports new and old web builder formats")
