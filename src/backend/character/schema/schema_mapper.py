"""
Schema Mapper - Complete Web Builder to Roll20 conversion
Implements all formulas from data-formats.md and patterns from roll20_character_sheet_attribute_list.md
"""

import math
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from .roll20_schema import Roll20Character, ATTACK_UPGRADE_MAPPINGS, REPEATING_SECTION_MAPPINGS
from ...utils.id_generator import Roll20IDGenerator

logger = logging.getLogger(__name__)

class SchemaMapper:
    """Complete mapping system from Web Builder to Roll20 format"""
    
    def __init__(self):
        self.existing_ids = set()
        logger.info("SchemaMapper initialized with complete Roll20 specification")
    
    def web_builder_to_roll20(self, web_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Convert web builder character to complete Roll20 format
        Implements ALL documented fields and formulas
        """
        logger.info("=== SCHEMA DEBUG: web_builder_to_roll20 called ===")
        logger.info(f"=== SCHEMA DEBUG: Input data type: {type(web_data)} ===")
        logger.info(f"=== SCHEMA DEBUG: Input data keys: {list(web_data.keys()) if isinstance(web_data, dict) else 'NOT_DICT'} ===")
        
        try:
            character_name = web_data.get('name', 'Unknown')
            logger.info(f"=== SCHEMA DEBUG: Converting character: {character_name} ===")
            
            # Initialize with basic info
            logger.info(f"=== SCHEMA DEBUG: Initializing Roll20Character object ===")
            roll20_char = Roll20Character()
            
            # Map basic character information
            logger.info(f"=== SCHEMA DEBUG: Mapping basic info ===")
            self._map_basic_info(web_data, roll20_char)
            
            # Map core attributes
            logger.info(f"=== SCHEMA DEBUG: Mapping core attributes ===")
            self._map_core_attributes(web_data, roll20_char)
            
            # Map archetypes
            logger.info(f"=== SCHEMA DEBUG: Mapping archetypes ===")
            self._map_archetypes(web_data, roll20_char)
            
            # Calculate ALL derived stats (the critical missing piece)
            logger.info(f"=== SCHEMA DEBUG: Starting calculated stats mapping - THE CRITICAL PART ===")
            self._map_calculated_stats(web_data, roll20_char)
            logger.info(f"=== SCHEMA DEBUG: Calculated stats mapping completed ===")
            
            # Map expertise and talents
            self._map_expertise_and_talents(web_data, roll20_char)
            
            # Map special attacks
            self._map_special_attacks(web_data, roll20_char)
            
            # Map main pool purchases
            self._map_main_pool_purchases(web_data, roll20_char)
            
            # Map utility purchases
            self._map_utility_purchases(web_data, roll20_char)
            
            # Map biography
            self._map_biography(web_data, roll20_char)
            
            # Map permissions
            self._map_permissions(web_data, roll20_char)
            
            # Map abilities - generate macro buttons for attacks
            self._map_abilities(web_data, roll20_char)
            
            # Convert to final format
            logger.info(f"=== SCHEMA DEBUG: Building final result structure ===")
            field_count = roll20_char.get_field_count()
            logger.info(f"=== SCHEMA DEBUG: Roll20 character has {field_count} total fields ===")
            
            flat_dict = roll20_char.to_flat_dict()
            logger.info(f"=== SCHEMA DEBUG: Flat dict has {len(flat_dict)} attributes ===")
            
            # Check for critical stats in the flat dict
            critical_stats = ['char_avoidance', 'char_durability', 'char_resolve', 'char_accuracy', 'char_damage']
            for stat in critical_stats:
                value = flat_dict.get(stat, 'MISSING')
                logger.info(f"=== SCHEMA DEBUG: {stat} = {value} ===")
            
            result = {
                "metadata": {
                    "characterId": web_data.get('id', 'unknown'),
                    "extractedAt": datetime.now().isoformat(),
                    "name": web_data.get('name', ''),
                    "attributeCount": field_count
                },
                "attributes": flat_dict,
                "repeating_sections": roll20_char.repeating_sections,
                "abilities": roll20_char.abilities,
                "permissions": roll20_char.permissions
            }
            
            logger.info(f"=== SCHEMA DEBUG: Final result structure keys: {list(result.keys())} ===")
            logger.info(f"=== SCHEMA DEBUG: Attributes count: {len(result['attributes'])} ===")
            logger.info(f"=== SCHEMA DEBUG: Repeating sections count: {len(result['repeating_sections'])} ===")
            
            # Validate result
            validation_errors = roll20_char.validate_required_fields()
            if validation_errors:
                logger.warning(f"Validation warnings for {web_data.get('name', 'Unknown')}: {validation_errors}")
            
            logger.info(f"=== SCHEMA DEBUG: Conversion complete: {field_count} total fields ===")
            return result
            
        except Exception as e:
            logger.error(f"Error transforming web builder data: {e}", exc_info=True)
            return None
    
    def _map_basic_info(self, web_data: Dict[str, Any], roll20_char: Roll20Character):
        """Map basic character information"""
        roll20_char.character_name = web_data.get('name', '')
        roll20_char.character_realname = web_data.get('realName', '')
        roll20_char.char_tier = str(web_data.get('tier', 4))
        roll20_char.char_efforts = "2"  # Default value
        roll20_char.char_hp = "100"
        roll20_char.char_hp_max = "100"
        roll20_char.sheet_tab = "character"
        
        logger.debug(f"Mapped basic info: {roll20_char.character_name} (Tier {roll20_char.char_tier})")
    
    def _map_core_attributes(self, web_data: Dict[str, Any], roll20_char: Roll20Character):
        """Map core attributes from web builder"""
        attributes = web_data.get('attributes', {})
        
        roll20_char.char_focus = str(attributes.get('focus', 0))
        roll20_char.char_mobility = str(attributes.get('mobility', 0))
        roll20_char.char_power = str(attributes.get('power', 0))
        roll20_char.char_endurance = str(attributes.get('endurance', 0))
        roll20_char.char_awareness = str(attributes.get('awareness', 0))
        roll20_char.char_communication = str(attributes.get('communication', 0))
        roll20_char.char_intelligence = str(attributes.get('intelligence', 0))
        
        logger.debug(f"Mapped core attributes: {attributes}")
    
    def _map_archetypes(self, web_data: Dict[str, Any], roll20_char: Roll20Character):
        """Map archetype selections"""
        archetypes = web_data.get('archetypes', {})
        
        roll20_char.char_archetype_movement = archetypes.get('movement', '')
        roll20_char.char_archetype_attackType = archetypes.get('attackType', '')
        roll20_char.char_archetype_effectType = archetypes.get('effectType', '')
        roll20_char.char_archetype_uniqueAbility = archetypes.get('uniqueAbility', '')
        roll20_char.char_archetype_defensive = archetypes.get('defensive', '')
        roll20_char.char_archetype_specialAttack = archetypes.get('specialAttack', '')
        roll20_char.char_archetype_utility = archetypes.get('utility', '')
        
        logger.debug(f"Mapped archetypes: {archetypes}")
    
    def _map_calculated_stats(self, web_data: Dict[str, Any], roll20_char: Roll20Character):
        """
        THE CRITICAL MISSING PIECE: Calculate ALL derived stats using documented formulas
        Implements formulas from data-formats.md
        """
        logger.info("=== COMBAT STATS DEBUG: _map_calculated_stats called ===")
        
        # Get base values
        logger.info(f"=== COMBAT STATS DEBUG: Getting base values from roll20_char ===")
        tier = int(roll20_char.char_tier)
        focus = int(roll20_char.char_focus)
        mobility = int(roll20_char.char_mobility)
        power = int(roll20_char.char_power)
        endurance = int(roll20_char.char_endurance)
        awareness = int(roll20_char.char_awareness)
        communication = int(roll20_char.char_communication)
        intelligence = int(roll20_char.char_intelligence)
        
        logger.info(f"=== COMBAT STATS DEBUG: BASE VALUES ===")
        logger.info(f"=== COMBAT STATS DEBUG: Tier: {tier} ===")
        logger.info(f"=== COMBAT STATS DEBUG: Focus: {focus} ===")
        logger.info(f"=== COMBAT STATS DEBUG: Mobility: {mobility} ===")
        logger.info(f"=== COMBAT STATS DEBUG: Power: {power} ===")
        logger.info(f"=== COMBAT STATS DEBUG: Endurance: {endurance} ===")
        logger.info(f"=== COMBAT STATS DEBUG: Awareness: {awareness} ===")
        logger.info(f"=== COMBAT STATS DEBUG: Communication: {communication} ===")
        logger.info(f"=== COMBAT STATS DEBUG: Intelligence: {intelligence} ===")
        
        # DEFENSE STATS (implement exact formulas)
        logger.info(f"=== COMBAT STATS DEBUG: Calculating DEFENSE stats ===")
        avoidance = 10 + tier + mobility
        logger.info(f"=== COMBAT STATS DEBUG: Avoidance = 10 + {tier} + {mobility} = {avoidance} ===")
        
        durability = tier + math.ceil(endurance * 1.5)
        logger.info(f"=== COMBAT STATS DEBUG: Durability = {tier} + ceil({endurance} * 1.5) = {tier} + {math.ceil(endurance * 1.5)} = {durability} ===")
        
        resolve = 10 + tier + focus
        logger.info(f"=== COMBAT STATS DEBUG: Resolve = 10 + {tier} + {focus} = {resolve} ===")
        
        stability = 10 + tier + power
        logger.info(f"=== COMBAT STATS DEBUG: Stability = 10 + {tier} + {power} = {stability} ===")
        
        vitality = 10 + tier + endurance
        logger.info(f"=== COMBAT STATS DEBUG: Vitality = 10 + {tier} + {endurance} = {vitality} ===")
        
        # COMBAT STATS (implement exact formulas)
        logger.info(f"=== COMBAT STATS DEBUG: Calculating COMBAT stats ===")
        accuracy = tier + focus
        logger.info(f"=== COMBAT STATS DEBUG: Accuracy = {tier} + {focus} = {accuracy} ===")
        
        damage = tier + math.ceil(power * 1.5)
        logger.info(f"=== COMBAT STATS DEBUG: Damage = {tier} + ceil({power} * 1.5) = {tier} + {math.ceil(power * 1.5)} = {damage} ===")
        
        conditions = tier * 2
        logger.info(f"=== COMBAT STATS DEBUG: Conditions = {tier} * 2 = {conditions} ===")
        
        movement = max(mobility + 6, mobility + tier)
        logger.info(f"=== COMBAT STATS DEBUG: Movement = max({mobility} + 6, {mobility} + {tier}) = max({mobility + 6}, {mobility + tier}) = {movement} ===")
        
        initiative = tier + mobility + focus + awareness
        logger.info(f"=== COMBAT STATS DEBUG: Initiative = {tier} + {mobility} + {focus} + {awareness} = {initiative} ===")
        
        # Generate complete 4-field pattern for each stat
        logger.info(f"=== COMBAT STATS DEBUG: Setting stat fields in Roll20 character ===")
        self._set_stat_fields(roll20_char, 'avoidance', avoidance)
        logger.info(f"=== COMBAT STATS DEBUG: Set avoidance fields ===")
        
        self._set_stat_fields(roll20_char, 'durability', durability)
        logger.info(f"=== COMBAT STATS DEBUG: Set durability fields ===")
        
        self._set_stat_fields(roll20_char, 'resolve', resolve)
        logger.info(f"=== COMBAT STATS DEBUG: Set resolve fields ===")
        
        self._set_stat_fields(roll20_char, 'stability', stability)
        logger.info(f"=== COMBAT STATS DEBUG: Set stability fields ===")
        
        self._set_stat_fields(roll20_char, 'vitality', vitality)
        logger.info(f"=== COMBAT STATS DEBUG: Set vitality fields ===")
        
        self._set_stat_fields(roll20_char, 'accuracy', accuracy)
        logger.info(f"=== COMBAT STATS DEBUG: Set accuracy fields ===")
        
        self._set_stat_fields(roll20_char, 'damage', damage)
        logger.info(f"=== COMBAT STATS DEBUG: Set damage fields ===")
        
        self._set_stat_fields(roll20_char, 'conditions', conditions)
        logger.info(f"=== COMBAT STATS DEBUG: Set conditions fields ===")
        
        self._set_stat_fields(roll20_char, 'movement', movement)
        logger.info(f"=== COMBAT STATS DEBUG: Set movement fields ===")
        
        self._set_stat_fields(roll20_char, 'initiative', initiative)
        logger.info(f"=== COMBAT STATS DEBUG: Set initiative fields ===")
        
        # Verify the fields were actually set by checking the object
        logger.info(f"=== COMBAT STATS DEBUG: VERIFICATION - checking roll20_char values ===")
        logger.info(f"=== COMBAT STATS DEBUG: roll20_char.char_avoidance = {getattr(roll20_char, 'char_avoidance', 'NOT_SET')} ===")
        logger.info(f"=== COMBAT STATS DEBUG: roll20_char.char_durability = {getattr(roll20_char, 'char_durability', 'NOT_SET')} ===")
        logger.info(f"=== COMBAT STATS DEBUG: roll20_char.char_accuracy = {getattr(roll20_char, 'char_accuracy', 'NOT_SET')} ===")
        logger.info(f"=== COMBAT STATS DEBUG: roll20_char.char_damage = {getattr(roll20_char, 'char_damage', 'NOT_SET')} ===")
        
        logger.info(f"=== COMBAT STATS DEBUG: FINAL CALCULATED VALUES ===")
        logger.info(f"=== COMBAT STATS DEBUG: Avoidance: {avoidance}, Durability: {durability}, Resolve: {resolve}, Stability: {stability}, Vitality: {vitality} ===")
        logger.info(f"=== COMBAT STATS DEBUG: Accuracy: {accuracy}, Damage: {damage}, Conditions: {conditions}, Movement: {movement}, Initiative: {initiative} ===")
    
    def _set_stat_fields(self, roll20_char: Roll20Character, stat_name: str, calculated_value: int):
        """Generate the complete 4-field pattern for a stat using correct Roll20 field names"""
        logger.info(f"=== SET_STAT_FIELDS DEBUG: Setting fields for {stat_name} = {calculated_value} ===")
        
        # Mapping of stat names to their abbreviated modifier field names
        modifier_mapping = {
            'avoidance': 'av',
            'durability': 'dr', 
            'resolve': 'rs',
            'stability': 'sb',
            'vitality': 'vt',
            'movement': 'movement',  # movement uses full name
            'accuracy': 'ac',
            'damage': 'dg',
            'conditions': 'cn',
            'initiative': 'initiative'  # initiative uses full name
        }
        
        modifier_suffix = modifier_mapping.get(stat_name, stat_name)
        logger.info(f"=== SET_STAT_FIELDS DEBUG: Modifier suffix for {stat_name}: {modifier_suffix} ===")
        
        # Set the 4 fields for this stat
        field1 = f'char_{stat_name}'
        field2 = f'display_{stat_name}'
        field3 = f'char_{modifier_suffix}Mod'
        field4 = f'char_{modifier_suffix}PrimaryAction'
        
        logger.info(f"=== SET_STAT_FIELDS DEBUG: Setting {field1} = {str(calculated_value)} ===")
        setattr(roll20_char, field1, str(calculated_value))
        
        logger.info(f"=== SET_STAT_FIELDS DEBUG: Setting {field2} = {str(calculated_value)} ===")
        setattr(roll20_char, field2, str(calculated_value))
        
        logger.info(f"=== SET_STAT_FIELDS DEBUG: Setting {field3} = 0 ===")
        setattr(roll20_char, field3, "0")
        
        logger.info(f"=== SET_STAT_FIELDS DEBUG: Setting {field4} = '' ===")
        setattr(roll20_char, field4, "")
        
        # Verify the fields were set correctly
        actual_value = getattr(roll20_char, field1, 'ERROR')
        logger.info(f"=== SET_STAT_FIELDS DEBUG: Verification - {field1} = {actual_value} ===")
        
        if actual_value != str(calculated_value):
            logger.error(f"=== SET_STAT_FIELDS DEBUG: ERROR! Expected {calculated_value}, got {actual_value} ===")
        else:
            logger.info(f"=== SET_STAT_FIELDS DEBUG: SUCCESS - {field1} correctly set to {actual_value} ===")
    
    def _map_expertise_and_talents(self, web_data: Dict[str, Any], roll20_char: Roll20Character):
        """Map talents to expertise sections and calculate totals"""
        talents = web_data.get('talents', [])
        tier = int(roll20_char.char_tier)
        
        # Initialize expertise totals
        expertise_totals = {
            'awareness': 0,
            'communication': 0,
            'intelligence': 0,
            'focus': 0,
            'mobility': 0,
            'endurance': 0,
            'power': 0
        }
        
        # Map talents to appropriate expertise sections
        for talent in talents:
            talent_name = talent if isinstance(talent, str) else talent.get('name', '')
            
            # Determine which attribute this talent belongs to
            attribute = self._determine_talent_attribute(talent_name)
            
            if attribute:
                # Add to expertise repeating section
                section_name = f'{attribute}expertises'
                row_id = self._generate_unique_row_id(f'{attribute}_expertise')
                
                if section_name not in roll20_char.repeating_sections:
                    roll20_char.repeating_sections[section_name] = {}
                
                roll20_char.repeating_sections[section_name][row_id] = {
                    f'{attribute}ExpertiseActive': '@{char_tier}',
                    f'{attribute}ExpertiseName': talent_name
                }
                
                # Add to total
                expertise_totals[attribute] += tier
                
                logger.debug(f"Mapped talent '{talent_name}' to {attribute} expertise")
        
        # Set expertise totals
        roll20_char.awarenessTotal = str(expertise_totals['awareness'])
        roll20_char.communicationTotal = str(expertise_totals['communication'])
        roll20_char.intelligenceTotal = str(expertise_totals['intelligence'])
        roll20_char.focusTotal = str(expertise_totals['focus'])
        roll20_char.mobilityTotal = str(expertise_totals['mobility'])
        roll20_char.enduranceTotal = str(expertise_totals['endurance'])
        roll20_char.powerTotal = str(expertise_totals['power'])
        
        logger.info(f"Mapped {len(talents)} talents to expertise sections")
    
    def _determine_talent_attribute(self, talent_name: str) -> Optional[str]:
        """Determine which attribute a talent belongs to"""
        talent_lower = talent_name.lower()
        
        # Communication talents
        if any(word in talent_lower for word in ['inspiring', 'leadership', 'persuasion', 'diplomacy']):
            return 'communication'
        
        # Intelligence talents  
        if any(word in talent_lower for word in ['history', 'knowledge', 'research', 'analysis']):
            return 'intelligence'
        
        # Focus talents
        if any(word in talent_lower for word in ['meditation', 'concentration', 'discipline']):
            return 'focus'
        
        # Awareness talents
        if any(word in talent_lower for word in ['perception', 'tracking', 'investigation']):
            return 'awareness'
        
        # Mobility talents
        if any(word in talent_lower for word in ['acrobatics', 'stealth', 'athletics']):
            return 'mobility'
        
        # Endurance talents
        if any(word in talent_lower for word in ['survival', 'resilience', 'fortitude']):
            return 'endurance'
        
        # Power talents
        if any(word in talent_lower for word in ['intimidation', 'might', 'strength']):
            return 'power'
        
        # Default to intelligence for unknown talents
        logger.warning(f"Unknown talent attribute for '{talent_name}', defaulting to intelligence")
        return 'intelligence'

    def _map_special_attacks(self, web_data: Dict[str, Any], roll20_char: Roll20Character):
        """Map special attacks with complete upgrade system"""
        special_attacks = web_data.get('specialAttacks', [])
        
        if 'attacks' not in roll20_char.repeating_sections:
            roll20_char.repeating_sections['attacks'] = {}
        
        for attack in special_attacks:
            row_id = self._generate_unique_row_id('attack')
            
            # Basic attack info
            attack_data = {
                'AttackName': attack.get('name', ''),
                'leftsub': self._determine_attack_subtitle(attack),
                'AttackType': self._map_attack_type(attack.get('attackTypes', [])),
                'EffectType': self._map_effect_type_from_conditions(attack),  # CHANGED
                'Hybrid': self._map_hybrid(attack),  # CHANGED
                'RollCN': self._map_roll_cn(attack)  # CHANGED
            }
            
            # Map all attack upgrades using the complete mapping system
            upgrades = attack.get('upgrades', [])
            for upgrade in upgrades:
                upgrade_id = upgrade.get('id', '')
                upgrade_name = self._extract_upgrade_name(upgrade_id)
                
                if upgrade_name in ATTACK_UPGRADE_MAPPINGS:
                    roll20_field = ATTACK_UPGRADE_MAPPINGS[upgrade_name]
                    attack_data[roll20_field] = "1"
                    logger.debug(f"Mapped upgrade {upgrade_name} -> {roll20_field}")
                else:
                    logger.warning(f"Unknown attack upgrade: {upgrade_name}")
            
            # Add string modifiers
            attack_data.update({
                'AttackDetails': attack.get('description', ''),
                'AccuracyStringModifiers': '',
                'DamageStringModifiers': '',
                'ConditionsStringModifiers': ''
            })
            
            roll20_char.repeating_sections['attacks'][row_id] = attack_data
            logger.debug(f"Mapped attack: {attack.get('name', 'Unknown')}")
        
        logger.info(f"Mapped {len(special_attacks)} special attacks")

    def _map_attack_type(self, attack_types: List[str]) -> str:
        """Map attack types to Roll20 format"""
        if 'melee_ac' in attack_types:
            return "0"  # Melee (AC)
        elif 'melee_dg' in attack_types:
            return "1"  # Melee (DG/CN)
        elif 'ranged' in attack_types:
            return "2"  # Ranged
        elif 'direct' in attack_types:
            return "3"  # Direct
        elif 'area' in attack_types:  # FIXED: was 'aoe'
            return "4"  # AOE
        elif 'aoe_direct' in attack_types:
            return "5"  # AOE Direct
        
        return "0"  # Default to melee

    def _map_effect_type_from_conditions(self, attack: Dict[str, Any]) -> str:
        """Map specific conditions to Roll20 EffectType"""
        # Get all conditions from both arrays
        basic_conditions = attack.get('basicConditions', [])
        advanced_conditions = attack.get('advancedConditions', [])
        all_conditions = basic_conditions + advanced_conditions
        
        # Condition to Roll20 EffectType mapping
        condition_mapping = {
            'disarm': "1",
            'grab': "2", 
            'shove': "3",
            'daze': "4",
            'blind': "5",
            'taunt': "6",
            'setup': "7",
            'control': "8",
            'stun': "9",
            'weaken': "10",
            'disable': "11"
        }
        
        # Return first matching condition
        for condition in all_conditions:
            if condition in condition_mapping:
                return condition_mapping[condition]
        
        return "0"  # None

    def _map_roll_cn(self, attack: Dict[str, Any]) -> str:
        """Map RollCN based on attack effect types"""
        effect_types = attack.get('effectTypes', [])
        
        # If pure damage, no condition roll needed
        if effect_types == ['damage']:
            return "0"  # OFF
        
        # If hybrid or condition, default to resolve
        if 'hybrid' in effect_types or 'condition' in effect_types:
            return "1"  # Resolve
        
        return "0"  # Default OFF

    def _map_hybrid(self, attack: Dict[str, Any]) -> str:
        """Map Hybrid field based on hybridOrder"""
        effect_types = attack.get('effectTypes', [])
        
        # Only applies to hybrid attacks
        if 'hybrid' not in effect_types:
            return "0"  # OFF
        
        hybrid_order = attack.get('hybridOrder', '')
        
        if hybrid_order == 'conditions-first':
            return "2"  # CN → Damage
        elif hybrid_order == 'damage-first':
            return "1"  # Damage → CN
        
        return "0"  # Default OFF

    def _extract_upgrade_name(self, upgrade_id: str) -> str:
        """Extract upgrade name from complex ID format"""
        # Handle IDs like "Specialized_Combat_Melee_Specialization_Heavy_Strike"
        parts = upgrade_id.split('_')
        
        # Common patterns to extract the actual upgrade name
        if 'Heavy_Strike' in upgrade_id:
            return 'Heavy_Strike'
        elif 'Enhanced_Effect' in upgrade_id:
            return 'Enhanced_Effect'
        elif 'High_Impact' in upgrade_id:
            return 'High_Impact'
        elif 'Accurate_Attack' in upgrade_id:
            return 'Accurate_Attack'
        elif 'Pounce' in upgrade_id:
            return 'Pounce'
        elif 'Bully' in upgrade_id:
            return 'Bully'
        
        # For other cases, take the last meaningful parts
        if len(parts) >= 2:
            return '_'.join(parts[-2:])
        
        return upgrade_id
    
    def _determine_attack_subtitle(self, attack: Dict[str, Any]) -> str:
        """Determine attack subtitle based on attack types"""
        attack_types = attack.get('attackTypes', [])
        
        if 'melee_ac' in attack_types or 'melee_dg' in attack_types:
            return 'Melee'
        elif 'ranged' in attack_types:
            return 'Ranged'
        elif 'aoe' in attack_types:
            return 'AOE'
        elif 'direct' in attack_types:
            return 'Direct'
        
        return 'Special'
    

    def _map_main_pool_purchases(self, web_data: Dict[str, Any], roll20_char: Roll20Character):
        """Map main pool purchases (boons, traits, unique abilities)"""
        main_pool = web_data.get('mainPoolPurchases', {})
        
        # Map traits with proper condition/bonus handling
        traits = main_pool.get('traits', [])
        if traits:
            if 'traits' not in roll20_char.repeating_sections:
                roll20_char.repeating_sections['traits'] = {}
            
            for trait in traits:
                row_id = self._generate_unique_row_id('trait')
                
                # Build trait name from conditions
                conditions = trait.get('conditions', [])
                trait_name = " / ".join([c.title() for c in conditions]) if conditions else "Custom Trait"
                
                # Get stat bonuses and tier
                stat_bonuses = trait.get('statBonuses', [])
                tier = int(web_data.get('tier', 4))
                
                # Initialize all bonuses to 0
                trait_data = {
                    'traitActive': "1",
                    'traitName': trait_name,  # FIXED: build from conditions
                    'traitAcBonus': "0",
                    'traitDgBonus': "0", 
                    'traitCnBonus': "0",
                    'traitAvBonus': "0",
                    'traitDrBonus': "0",
                    'traitRsBonus': "0",
                    'traitSbBonus': "0",
                    'traitVtBonus': "0",
                    'traitMBonus': "0"
                }
                
                # FIXED: Set bonuses based on statBonuses array
                for bonus_type in stat_bonuses:
                    if bonus_type == 'accuracy':
                        trait_data['traitAcBonus'] = str(tier)
                    elif bonus_type == 'damage':
                        trait_data['traitDgBonus'] = str(tier)
                    elif bonus_type == 'conditions':
                        trait_data['traitCnBonus'] = str(tier)
                    elif bonus_type == 'avoidance':
                        trait_data['traitAvBonus'] = str(tier)
                    # Add other mappings as needed
                
                roll20_char.repeating_sections['traits'][row_id] = trait_data
                logger.debug(f"Mapped trait: {trait_name} with bonuses: {stat_bonuses}")

    def _map_utility_purchases(self, web_data: Dict[str, Any], roll20_char: Roll20Character):
        """Map utility purchases (features, senses, descriptors)"""
        utility = web_data.get('utilityPurchases', {})
        
        # Combine all utility items into features
        all_features = []
        
        # Add features
        features = utility.get('features', [])
        all_features.extend(features)
        
        # Add senses as features
        senses = utility.get('senses', [])
        all_features.extend(senses)
        
        # Add descriptors as features
        descriptors = utility.get('descriptors', [])
        all_features.extend(descriptors)
        
        # Add movement abilities as features
        movement = utility.get('movement', [])
        all_features.extend(movement)
        
        if all_features:
            if 'features' not in roll20_char.repeating_sections:
                roll20_char.repeating_sections['features'] = {}
            
            for feature in all_features:
                row_id = self._generate_unique_row_id('feature')
                
                feature_name = feature.get('name', '') if isinstance(feature, dict) else str(feature)
                feature_cost = feature.get('cost', 0) if isinstance(feature, dict) else 0
                
                description = f"Cost: {feature_cost} points" if feature_cost > 0 else ""
                
                roll20_char.repeating_sections['features'][row_id] = {
                    'char_features': feature_name,
                    'featuresDesc': description
                }
                
                logger.debug(f"Mapped utility feature: {feature_name}")
        
        logger.info(f"Mapped {len(all_features)} utility features")
    
    def _map_biography(self, web_data: Dict[str, Any], roll20_char: Roll20Character):
        """Map biography information"""
        bio_details = web_data.get('biographyDetails', {})
        
        # Build formatted biography
        bio_parts = []
        
        if bio_details.get('player_name'):
            bio_parts.append(f"**Player Name:**\n{bio_details['player_name']}")
        
        if bio_details.get('heir_ambition'):
            bio_parts.append(f"**Heir Ambition:**\n{bio_details['heir_ambition']}")
        
        if bio_details.get('mandate_focus'):
            bio_parts.append(f"**Mandate Focus:**\n{bio_details['mandate_focus']}")
        
        if bio_details.get('background_motivation'):
            bio_parts.append(f"**Background Motivation:**\n{bio_details['background_motivation']}")
        
        if bio_details.get('authority_handling'):
            bio_parts.append(f"**Authority Handling:**\n{bio_details['authority_handling']}")
        
        if bio_details.get('others_perception'):
            bio_parts.append(f"**Others Perception:**\n{bio_details['others_perception']}")
        
        if bio_details.get('bond_with_trader'):
            bio_parts.append(f"**Bond With Trader:**\n{bio_details['bond_with_trader']}")
        
        if bio_details.get('character_bio'):
            bio_parts.append(f"**Character Bio:**\n{bio_details['character_bio']}")
        
        if bio_details.get('gm_notes'):
            bio_parts.append(f"**GM Notes:**\n{bio_details['gm_notes']}")
        
        roll20_char.char_bio = "\n\n".join(bio_parts)
        
        logger.debug(f"Mapped biography: {len(bio_parts)} sections")
    
    def _map_permissions(self, web_data: Dict[str, Any], roll20_char: Roll20Character):
        """Map character permissions"""
        roll20_char.permissions = {
            "see_by": "all",
            "edit_by": "all"
        }
    
    def _map_abilities(self, web_data: Dict[str, Any], roll20_char: Roll20Character):
        """Generate ability macros for attacks and other character actions"""
        # Clear existing abilities
        roll20_char.abilities = []
        
        # Generate abilities for each attack in the attacks repeating section
        attacks = roll20_char.repeating_sections.get('attacks', {})
        
        # Sort attacks by row_id to ensure consistent indexing
        sorted_attacks = sorted(attacks.items())
        
        # Roll20 always expects exactly 6 abilities (0-5)
        for index in range(6):
            if index < len(sorted_attacks):
                # Use actual attack name
                row_id, attack_data = sorted_attacks[index]
                attack_name = attack_data.get('AttackName', f'Attack {index + 1}')
            else:
                # Use placeholder name for unused slots
                attack_name = f'New Ability {index}'
            
            # Create ability macro
            ability = {
                "name": attack_name,
                "type": "indexed",
                "content": index,
                "showInMacroBar": False,
                "isTokenAction": False,
                "template_ref": None
            }
            
            roll20_char.abilities.append(ability)
            logger.debug(f"Generated ability macro: {attack_name} (index {index})")
        
        logger.info(f"Generated {len(roll20_char.abilities)} ability macros")
    
    def _generate_unique_row_id(self, prefix: str) -> str:
        """Generate unique Row ID for repeating sections using Roll20IDGenerator"""
        # Use the updated Roll20IDGenerator for clean 16-character random IDs
        row_id = Roll20IDGenerator.generate_unique_id(self.existing_ids)
        self.existing_ids.add(row_id)
        return row_id

logger.info("SchemaMapper loaded with complete Roll20 specification implementation")