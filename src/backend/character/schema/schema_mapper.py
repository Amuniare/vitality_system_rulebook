"""
Schema Mapper - Convert Web Builder JSON to Roll20 Schema

This module handles the conversion from web builder character JSON
to the Roll20 schema format with proper field mapping.
"""

import json
from typing import Dict, Any, List, Optional
from .roll20_schema import Roll20Schema
import re


class SchemaMapper:
    """Converts web builder character JSON to Roll20 schema."""
    
    # Mapping from web builder upgrade IDs to Roll20 fields
    UPGRADE_FIELD_MAPPING = {
        # Accuracy Bonuses
        "Accurate_Attack": "AccurateAttack",
        "Power_Attack": "PowerAttack", 
        "Quick_Attack": "QuickAttack",
        
        # Damage Bonuses - Core
        "Enhanced_Effect": "EnhancedEffect",
        "High_Impact": "HighImpact",
        "Bonus_Damage": "BonusDamage",
        
        # Damage Bonuses - Elemental
        "Elemental_Damage": "ElementalDamage",
        "Cold_Damage": "ColdDamage",
        "Fire_Damage": "FireDamage",
        "Lightning_Damage": "LightningDamage",
        
        # Specialized Combat - Melee
        "Heavy_Strike": "HeavyStrike",
        "Cleave": "Cleave",
        "Whirlwind": "Whirlwind", 
        "Melee_Expertise": "MeleeExpertise",
        
        # Specialized Combat - Ranged
        "Ranged_Expertise": "RangedExpertise",
        "Multishot": "Multishot",
        "Pinpoint_Accuracy": "PinpointAccuracy",
        "Ricochet": "Ricochet",
        
        # Specialized Combat - Universal
        "Pounce": "Pounce",
        "Follow_Through": "FollowThrough",
        "Opportunist": "Opportunist",
        
        # Combat Control
        "Bully": "Bully",
        "Disarm": "Disarm",
        "Knockdown": "Knockdown",
        "Entangle": "Entangle",
        
        # Area Attack Bonuses
        "Area_Expertise": "AreaExpertise",
        "Precise_AOE": "PreciseAOE",
        "Lingering_Effect": "LingeringEffect",
        
        # Condition Bonuses
        "Condition_Expertise": "ConditionExpertise",
        "Condition_Amplification": "ConditionAmplification",
        "Multiple_Conditions": "MultipleConditions",
        
        # Defensive Bonuses
        "Counter_Attack": "CounterAttack",
        "Retribution": "Retribution",
        "Defensive_Stance": "DefensiveStance",
        
        # Utility Bonuses
        "Non_Lethal": "NonLethal",
        "Stealth": "Stealth",
        "Intimidation": "Intimidation"
    }
    
    # Mapping attack types from web builder to Roll20
    ATTACK_TYPE_MAPPING = {
        "melee_ac": ("Melee", "1"),
        "ranged": ("Ranged", "2"),
        "area_direct": ("Area Direct", "3"),
        "area_burst": ("Area Burst", "4")
    }
    
    # Mapping talents to attribute expertise sections
    TALENT_TO_ATTRIBUTE_MAPPING = {
        # Communication expertise examples
        "inspiring loyalty": "communication",
        "persuasion": "communication", 
        "intimidation": "communication",
        "leadership": "communication",
        
        # Intelligence expertise examples  
        "history": "intelligence",
        "investigation": "intelligence",
        "medicine": "intelligence",
        "technology": "intelligence",
        
        # Awareness expertise examples
        "perception": "awareness",
        "insight": "awareness",
        "survival": "awareness",
        
        # Focus expertise examples
        "crafting": "focus",
        "engineering": "focus",
        "artistry": "focus",
        
        # Mobility expertise examples
        "piloting": "mobility",
        "athletics": "mobility", 
        "acrobatics": "mobility",
        
        # Endurance expertise examples
        "survival": "endurance",
        "resilience": "endurance",
        
        # Power expertise examples
        "athletics": "power",
        "intimidation": "power"
    }

    def __init__(self):
        self.schema = Roll20Schema()

    def map_character(self, character_json: Dict[str, Any]) -> Roll20Schema:
        """Main mapping function - convert character JSON to schema."""
        self.schema = Roll20Schema()
        
        # Map basic information
        self._map_basic_info(character_json)
        
        # Map attributes
        self._map_attributes(character_json)
        
        # Map archetypes
        self._map_archetypes(character_json)
        
        # Map calculated stats
        self._map_calculated_stats(character_json)
        
        # Map special attacks
        self._map_special_attacks(character_json)
        
        # Map talents to expertise
        self._map_talents(character_json)
        
        # Map utility purchases
        self._map_utility_purchases(character_json)
        
        # Map main pool purchases
        self._map_main_pool_purchases(character_json)
        
        return self.schema

    def _map_basic_info(self, character_json: Dict[str, Any]) -> None:
        """Map basic character information."""
        self.schema.character_name = character_json.get("name", "")
        self.schema.character_realname = character_json.get("realName", "")
        self.schema.char_tier = str(character_json.get("tier", 1))
        
        # Build bio from biographyDetails
        bio_details = character_json.get("biographyDetails", {})
        bio_parts = []
        
        if bio_details.get("player_name"):
            bio_parts.append(f"**Player Name:**\n{bio_details['player_name']}")
        if bio_details.get("heir_ambition"):
            bio_parts.append(f"**Heir Ambition:**\n{bio_details['heir_ambition']}")
        if bio_details.get("mandate_focus"):
            bio_parts.append(f"**Mandate Focus:**\n{bio_details['mandate_focus']}")
        if bio_details.get("background_motivation"):
            bio_parts.append(f"**Background Motivation:**\n{bio_details['background_motivation']}")
        if bio_details.get("authority_handling"):
            bio_parts.append(f"**Authority Handling:**\n{bio_details['authority_handling']}")
        if bio_details.get("others_perception"):
            bio_parts.append(f"**Others Perception:**\n{bio_details['others_perception']}")
        if bio_details.get("bond_with_trader"):
            bio_parts.append(f"**Bond With Trader:**\n{bio_details['bond_with_trader']}")
        if bio_details.get("character_bio"):
            bio_parts.append(f"**Character Bio:**\n{bio_details['character_bio']}")
        if bio_details.get("gm_notes"):
            bio_parts.append(f"**Gm Notes:**\n{bio_details['gm_notes']}")
            
        self.schema.char_bio = "\n\n".join(bio_parts)

    def _map_attributes(self, character_json: Dict[str, Any]) -> None:
        """Map character attributes."""
        attributes = character_json.get("attributes", {})
        
        self.schema.char_focus = str(attributes.get("focus", 0))
        self.schema.char_mobility = str(attributes.get("mobility", 0))
        self.schema.char_power = str(attributes.get("power", 0))
        self.schema.char_endurance = str(attributes.get("endurance", 0))
        self.schema.char_awareness = str(attributes.get("awareness", 0))
        self.schema.char_communication = str(attributes.get("communication", 0))
        self.schema.char_intelligence = str(attributes.get("intelligence", 0))

    def _map_archetypes(self, character_json: Dict[str, Any]) -> None:
        """Map archetype selections."""
        archetypes = character_json.get("archetypes", {})
        
        self.schema.char_archetype_movement = archetypes.get("movement", "")
        self.schema.char_archetype_attackType = archetypes.get("attackType", "")
        self.schema.char_archetype_effectType = archetypes.get("effectType", "")
        self.schema.char_archetype_uniqueAbility = archetypes.get("uniqueAbility", "")
        self.schema.char_archetype_defensive = archetypes.get("defensive", "")
        self.schema.char_archetype_specialAttack = archetypes.get("specialAttack", "")
        self.schema.char_archetype_utility = archetypes.get("utility", "")

    def _map_calculated_stats(self, character_json: Dict[str, Any]) -> None:
        """Map calculated stats. Web builder should provide these."""
        calculated = character_json.get("calculatedStats", {})
        
        # If web builder provides calculated stats, use them
        # Otherwise, we could calculate here, but web builder should handle this
        self.schema.char_avoidance = str(calculated.get("avoidance", "0"))
        self.schema.char_durability = str(calculated.get("durability", "0"))
        self.schema.char_resolve = str(calculated.get("resolve", "0"))
        self.schema.char_stability = str(calculated.get("stability", "0"))
        self.schema.char_vitality = str(calculated.get("vitality", "0"))
        self.schema.char_accuracy = str(calculated.get("accuracy", "0"))
        self.schema.char_damage = str(calculated.get("damage", "0"))
        self.schema.char_conditions = str(calculated.get("conditions", "0"))
        self.schema.char_movement = str(calculated.get("movement", "0"))
        self.schema.char_initiative = str(calculated.get("initiative", "0"))
        
        # Default HP to 100/100 if not provided
        self.schema.char_hp = calculated.get("hp", "100/100")

    def _map_special_attacks(self, character_json: Dict[str, Any]) -> None:
        """Map special attacks with proper upgrade field mapping."""
        special_attacks = character_json.get("specialAttacks", [])
        
        for i, attack in enumerate(special_attacks):
            # Generate Roll20 ID
            roll20_id = f"-N{abs(hash(attack['name'] + str(i))) % 1000000000000}"
            
            # Get attack type mapping
            attack_types = attack.get("attackTypes", [])
            if attack_types:
                attack_type_key = attack_types[0]
                if attack_type_key in self.ATTACK_TYPE_MAPPING:
                    leftsub, attack_type_num = self.ATTACK_TYPE_MAPPING[attack_type_key]
                else:
                    leftsub, attack_type_num = "Unknown", "1"
            else:
                leftsub, attack_type_num = "Melee", "1"
            
            # Create attack entry
            attack_entry = Roll20Schema.create_attack_entry(
                attack.get("name", "Unnamed Attack"),
                leftsub,
                attack_type_num
            )
            
            # Map upgrades to correct fields
            upgrades = attack.get("upgrades", [])
            for upgrade in upgrades:
                upgrade_id = upgrade.get("id", "")
                
                # Find matching field from our mapping
                for pattern, field_name in self.UPGRADE_FIELD_MAPPING.items():
                    if pattern in upgrade_id:
                        attack_entry[field_name] = "1"
                        break
            
            self.schema.repeating_attacks[roll20_id] = attack_entry

    def _map_talents(self, character_json: Dict[str, Any]) -> None:
        """Map talents to appropriate expertise sections."""
        talents = character_json.get("talents", [])
        
        for i, talent in enumerate(talents):
            talent_lower = talent.lower()
            
            # Find which attribute this talent belongs to
            attribute = None
            for talent_key, attr in self.TALENT_TO_ATTRIBUTE_MAPPING.items():
                if talent_key in talent_lower:
                    attribute = attr
                    break
            
            if attribute:
                # Generate Roll20 ID
                roll20_id = f"-N{abs(hash(talent + str(i))) % 1000000000000}"
                
                # Create expertise entry
                expertise_entry = {
                    f"{attribute}ExpertiseActive": "on",
                    f"{attribute}ExpertiseName": talent
                }
                
                # Add to appropriate repeating section
                section_name = f"repeating_{attribute}expertises"
                if hasattr(self.schema, section_name):
                    getattr(self.schema, section_name)[roll20_id] = expertise_entry

    def _map_utility_purchases(self, character_json: Dict[str, Any]) -> None:
        """Map utility purchases to features."""
        utility_purchases = character_json.get("utilityPurchases", {})
        
        # Map features
        features = utility_purchases.get("features", [])
        for i, feature in enumerate(features):
            roll20_id = f"-N{abs(hash(feature['name'] + str(i))) % 1000000000000}"
            
            feature_entry = Roll20Schema.create_feature_entry(
                feature.get("name", ""),
                f"Cost: {feature.get('cost', 0)} points"
            )
            
            self.schema.repeating_features[roll20_id] = feature_entry
        
        # Map senses to features as well  
        senses = utility_purchases.get("senses", [])
        for i, sense in enumerate(senses):
            roll20_id = f"-N{abs(hash(sense['name'] + 'sense' + str(i))) % 1000000000000}"
            
            sense_entry = Roll20Schema.create_feature_entry(
                sense.get("name", ""),
                f"Cost: {sense.get('cost', 0)} points (Sense)"
            )
            
            self.schema.repeating_features[roll20_id] = sense_entry

    def _map_main_pool_purchases(self, character_json: Dict[str, Any]) -> None:
        """Map main pool purchases to appropriate sections."""
        main_pool = character_json.get("mainPoolPurchases", {})
        
        # Map boons to unique abilities (Shield goes here)
        boons = main_pool.get("boons", [])
        for i, boon in enumerate(boons):
            roll20_id = f"-N{abs(hash(boon['name'] + str(i))) % 1000000000000}"
            
            # Build description from cost and upgrades
            description_parts = [f"Cost: {boon.get('cost', 0)} points"]
            
            upgrades = boon.get("upgrades", [])
            if upgrades:
                upgrade_names = [upgrade.get("id", "").replace("_", " ").title() 
                               for upgrade in upgrades]
                description_parts.append(f"Upgrades: {', '.join(upgrade_names)}")
            
            unique_entry = Roll20Schema.create_unique_ability_entry(
                boon.get("name", ""),
                ". ".join(description_parts) + "."
            )
            
            self.schema.repeating_uniqueabilities[roll20_id] = unique_entry
        
        # Map traits to traits section (currently empty in Brother Rainard)
        traits = main_pool.get("traits", [])
        for i, trait in enumerate(traits):
            roll20_id = f"-N{abs(hash(trait['name'] + str(i))) % 1000000000000}"
            
            trait_entry = Roll20Schema.create_trait_entry(
                trait.get("name", ""),
                True
            )
            
            # TODO: Map trait bonuses from web builder data
            # This would require the web builder to specify stat bonuses
            
            self.schema.repeating_traits[roll20_id] = trait_entry

    @classmethod
    def map_from_file(cls, file_path: str) -> Roll20Schema:
        """Load character JSON from file and convert to schema."""
        with open(file_path, 'r', encoding='utf-8') as f:
            character_data = json.load(f)
        
        mapper = cls()
        return mapper.map_character(character_data)

    @classmethod  
    def map_from_json_string(cls, json_string: str) -> Roll20Schema:
        """Load character JSON from string and convert to schema."""
        character_data = json.loads(json_string)
        
        mapper = cls()
        return mapper.map_character(character_data)
