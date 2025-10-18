"""
New Website Format Adapter - Converts new website format to old format
Created specifically for the new website that uses 'level', 'boons', attack_type values like 'direct_damage', etc.
"""

import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)


# Attack type mappings: new format -> old format
ATTACK_TYPE_MAPPINGS = {
    "melee_accuracy": "melee_ac",
    "melee_damage": "melee_dg",
    "ranged": "ranged",
    "direct_damage": "direct",
    "direct_area_damage": "aoe_direct",
    "area_damage": "aoe",
    "area": "aoe",
}

# Stat name mappings: new format (capitalized) -> old format (lowercase)
STAT_NAME_MAPPINGS = {
    "Accuracy": "accuracy",
    "Damage": "damage",
    "Conditions": "conditions",
    "Avoidance": "avoidance",
    "Durability": "durability",
    "Resolve": "resolve",
    "Stability": "stability",
    "Vitality": "vitality",
    "Movement": "movement",
    "Speed": "movement",
    "Speed (Tier × 2)": "movement",
    "Initiative": "initiative",
}


class NewFormatAdapter:
    """Adapter specifically for the new website format"""

    @staticmethod
    def is_new_format(data: Dict[str, Any]) -> bool:
        """
        Detect if this is the new website format

        New format characteristics:
        - Has 'level' field (not 'tier')
        - Has 'boons' array (not 'mainPoolPurchases')
        - Has 'attacks' array with 'attack_type' like 'direct_damage'
        """
        has_level = 'level' in data
        has_boons = 'boons' in data

        # Check if attacks have the new attack_type format
        has_new_attack_format = False
        if 'attacks' in data and len(data['attacks']) > 0:
            first_attack = data['attacks'][0]
            if 'attack_type' in first_attack:
                attack_type = first_attack['attack_type']
                # New format has values like 'direct_damage', 'melee_accuracy'
                has_new_attack_format = attack_type in ATTACK_TYPE_MAPPINGS or '_' in attack_type

        return (has_level or has_boons) and has_new_attack_format

    @staticmethod
    def convert_to_old_format(new_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert new website format to old format

        This is a complete, clean conversion specifically for the new website
        """
        logger.info(f"Converting NEW website format to old format for: {new_data.get('name', 'Unknown')}")

        old_data = {}

        # Basic info
        old_data['id'] = new_data.get('id', '')
        old_data['name'] = new_data.get('name', '')
        old_data['tier'] = new_data.get('level', 4)

        # Copy attributes directly (same structure)
        old_data['attributes'] = new_data.get('attributes', {})

        # Convert archetypes
        old_data['archetypes'] = NewFormatAdapter._convert_archetypes(new_data.get('archetypes', {}))

        # Convert boons to mainPoolPurchases
        old_data['mainPoolPurchases'] = NewFormatAdapter._convert_boons(
            new_data.get('boons', []),
            new_data.get('level', 4)
        )

        # Convert attacks
        old_data['specialAttacks'] = NewFormatAdapter._convert_attacks(new_data.get('attacks', []))

        # Convert utilities
        old_data['utilityPurchases'] = NewFormatAdapter._convert_utilities(new_data.get('utilities', []))

        # Add utility attribute selections if present
        if 'utility_attribute_selections' in new_data:
            old_data['utilityAttributeSelections'] = new_data['utility_attribute_selections']

        # Biography details
        old_data['biographyDetails'] = {
            'character_bio': new_data.get('description', ''),
            'appearance_description': new_data.get('appearance_description', ''),
            'public_backstory': new_data.get('public_backstory', ''),
            'private_backstory': new_data.get('private_backstory', ''),
            'personality': new_data.get('personality', ''),
        }

        # Talents (empty for now, new format doesn't have them)
        old_data['talents'] = []

        logger.info(f"Successfully converted new format to old format")
        return old_data

    @staticmethod
    def _convert_archetypes(new_archetypes: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert new archetype structure to old structure

        New: {"attack": "dual_natured", "defensive": "iron_will", "movement": "flight", "utility": "practical"}
        Old: {"attackType": "...", "effectType": "...", "defensive": "...", "movement": "...", ...}
        """
        old_archetypes = {}

        # Direct mappings
        if 'defensive' in new_archetypes:
            old_archetypes['defensive'] = new_archetypes['defensive']

        if 'movement' in new_archetypes:
            old_archetypes['movement'] = new_archetypes['movement']

        if 'utility' in new_archetypes:
            old_archetypes['utility'] = new_archetypes['utility']

        # Map 'attack' archetype to old attackType field
        if 'attack' in new_archetypes:
            old_archetypes['attackType'] = new_archetypes['attack']

        # Set reasonable defaults for missing fields
        if 'effectType' not in old_archetypes:
            old_archetypes['effectType'] = 'damage'

        old_archetypes['uniqueAbility'] = ''
        old_archetypes['specialAttack'] = ''

        return old_archetypes

    @staticmethod
    def _convert_boons(boons: List[Dict[str, Any]], tier: int) -> Dict[str, Any]:
        """
        Convert boons array to mainPoolPurchases structure

        New boons have types: 'passive', 'conditional', 'unique_ability', 'unique_ability_upgrade'
        Old format has: traits, uniqueAbilities
        """
        main_pool = {
            'traits': [],
            'uniqueAbilities': []
        }

        for boon in boons:
            boon_type = boon.get('type', '')

            if boon_type in ['passive', 'conditional']:
                # Convert to trait format
                trait = NewFormatAdapter._boon_to_trait(boon, tier)
                if trait:
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
    def _boon_to_trait(boon: Dict[str, Any], tier: int) -> Optional[Dict[str, Any]]:
        """
        Convert a boon (passive or conditional) to a trait

        New format:
        {
            "name": "Peaked",
            "type": "passive",
            "stat_bonuses": {"Accuracy": "tier"},
            "drawback": "Cannot use Efforts",
            "conditions": []
        }

        Old format:
        {
            "name": "Peaked - Cannot use Efforts",
            "conditions": [],
            "statBonuses": ["accuracy"]
        }
        """
        stat_bonuses_dict = boon.get('stat_bonuses', {})

        # Parse stat bonuses - convert capitalized keys to lowercase
        stat_bonuses = []
        for stat_name, bonus_value in stat_bonuses_dict.items():
            # Map capitalized stat name to lowercase
            lowercase_stat = STAT_NAME_MAPPINGS.get(stat_name, stat_name.lower())

            # Only add if the bonus value is not empty/zero
            # In new format, bonus_value is usually "tier" string or a number
            if bonus_value:
                stat_bonuses.append(lowercase_stat)

        # Build trait name: "TraitName - Drawback/Condition"
        base_name = boon.get('name', '')
        if not base_name:
            logger.warning(f"Skipping boon with no name: {boon}")
            return None

        # Get drawback (for passive traits) or conditions (for conditional traits)
        drawback = boon.get('drawback', '')
        conditions = boon.get('conditions', [])

        # Build full trait name
        if drawback:
            # Passive trait with drawback
            trait_name = f"{base_name} - {drawback}"
        elif conditions:
            # Conditional trait
            condition_text = ", ".join(conditions)
            trait_name = f"{base_name} - {condition_text}"
        else:
            # No drawback or conditions (shouldn't happen, but fallback)
            trait_name = base_name

        trait = {
            'name': trait_name,
            'conditions': conditions,
            'statBonuses': stat_bonuses
        }

        logger.debug(f"Converted boon '{trait_name}' to trait with bonuses: {stat_bonuses}")
        return trait

    @staticmethod
    def _convert_attacks(attacks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Convert attacks array to specialAttacks format

        New format:
        {
            "name": "Ignition",
            "attack_type": "direct_damage",
            "effect_type": "damage",
            "upgrades": ["bleed", "brutal"],
            "limits": ["charge_up", "passive"]
        }

        Old format:
        {
            "name": "Ignition",
            "attackTypes": ["direct"],
            "effectTypes": ["damage"],
            "upgrades": [{"id": "Bleed"}, {"id": "Brutal"}],
            "limits": ["charge_up", "passive"]
        }
        """
        special_attacks = []

        for attack in attacks:
            # Convert attack_type (singular string) to attackTypes (array)
            attack_type_raw = attack.get('attack_type', '')

            # Map the attack type using our mappings
            attack_type_mapped = ATTACK_TYPE_MAPPINGS.get(attack_type_raw, attack_type_raw)
            attack_types = [attack_type_mapped] if attack_type_mapped else []

            # Convert effect_type (singular string) to effectTypes (array)
            effect_type = attack.get('effect_type', 'damage')
            effect_types = [effect_type] if effect_type else []

            # Convert upgrades - normalize names
            upgrades = NewFormatAdapter._convert_attack_upgrades(attack.get('upgrades', []))

            special_attack = {
                'name': attack.get('name', ''),
                'attackTypes': attack_types,
                'effectTypes': effect_types,
                'upgrades': upgrades,
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

            logger.debug(f"Converted attack '{attack.get('name', 'Unknown')}': "
                        f"type={attack_type_raw}->{attack_type_mapped}, "
                        f"upgrades={len(upgrades)}")

        return special_attacks

    @staticmethod
    def _convert_attack_upgrades(upgrades: List[str]) -> List[Dict[str, str]]:
        """
        Convert upgrade strings to upgrade objects with normalized names

        New format: ["bleed", "powerful_critical", "enhanced_scale"]
        Old format: [{"id": "Bleed"}, {"id": "Powerful_Critical"}, {"id": "Enhanced_Scale"}]
        """
        converted_upgrades = []

        for upgrade in upgrades:
            if isinstance(upgrade, str):
                # Normalize: lowercase_snake_case -> Title_Case
                normalized = NewFormatAdapter._normalize_upgrade_name(upgrade)
                converted_upgrades.append({'id': normalized})
            elif isinstance(upgrade, dict) and 'id' in upgrade:
                # Already in object format, but still normalize
                normalized = NewFormatAdapter._normalize_upgrade_name(upgrade['id'])
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
            "enhanced_scale" -> "Enhanced_Scale"
        """
        parts = name.split('_')
        return '_'.join(word.capitalize() for word in parts)

    @staticmethod
    def _convert_utilities(utilities: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Convert utilities array to utilityPurchases structure

        New format:
        [
            {"utility_id": "feature_glyph_of_warding", "name": "Glyph of Warding", "cost": 3, "type": "feature"},
            {"utility_id": "descriptor_fire", "name": "Fire", "cost": 5, "type": "descriptor"}
        ]

        Old format:
        {
            "features": [{"id": "glyph_of_warding", "name": "Glyph of Warding", "cost": 3}],
            "descriptors": [{"id": "fire", "name": "Fire", "cost": 5}],
            "senses": [],
            "movement": []
        }
        """
        utility_purchases = {
            'features': [],
            'senses': [],
            'descriptors': [],
            'movement': []
        }

        for utility in utilities:
            utility_type = utility.get('type', 'feature')
            utility_id = utility.get('utility_id', '')

            # Extract the actual ID from utility_id (e.g., "feature_glyph_of_warding" -> "glyph_of_warding")
            if '_' in utility_id:
                parts = utility_id.split('_', 1)
                clean_id = parts[1] if len(parts) > 1 else utility_id
            else:
                clean_id = utility_id

            utility_obj = {
                'id': clean_id,
                'name': utility.get('name', ''),
                'cost': utility.get('cost', 0),
                'description': utility.get('description', '')
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


logger.info("NewFormatAdapter loaded - specifically for new website format")
