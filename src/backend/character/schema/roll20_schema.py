"""
Roll20 Character Sheet Schema Definition
Complete implementation based on roll20_character_sheet_attribute_list.md
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

@dataclass
class Roll20Character:
    """Complete Roll20 character sheet schema with all documented fields"""
    
    # Basic Character Information
    character_name: str = ""
    character_realname: str = ""
    char_tier: str = "4"
    char_efforts: str = "2"
    
    # Core Stats (Attributes)
    char_focus: str = "0"
    char_mobility: str = "0"
    char_power: str = "0"
    char_endurance: str = "0"
    char_awareness: str = "0"
    char_communication: str = "0"
    char_intelligence: str = "0"
    
    # Attribute Totals (Calculated from expertises)
    awarenessTotal: str = "0"
    communicationTotal: str = "0"
    intelligenceTotal: str = "0"
    focusTotal: str = "0"
    mobilityTotal: str = "0"
    enduranceTotal: str = "0"
    powerTotal: str = "0"
    
    # Defense Stats (Calculated + Manual Modifiers) - 5 stats × 4 fields = 20 fields
    char_avoidance: str = "0"
    display_avoidance: str = "0"
    char_avMod: str = "0"
    char_avPrimaryAction: str = ""
    
    char_durability: str = "0"
    display_durability: str = "0"
    char_drMod: str = "0"
    char_drPrimaryAction: str = ""
    
    char_resolve: str = "0"
    display_resolve: str = "0"
    char_rsMod: str = "0"
    char_rsPrimaryAction: str = ""
    
    char_stability: str = "0"
    display_stability: str = "0"
    char_sbMod: str = "0"
    char_sbPrimaryAction: str = ""
    
    char_vitality: str = "0"
    display_vitality: str = "0"
    char_vtMod: str = "0"
    char_vtPrimaryAction: str = ""
    
    # Combat Stats (Calculated + Manual Modifiers) - 5 stats × 4 fields = 20 fields
    char_movement: str = "0"
    display_movement: str = "0"
    char_movementMod: str = "0"
    char_movementPrimaryAction: str = ""
    
    char_accuracy: str = "0"
    display_accuracy: str = "0"
    char_acMod: str = "0"
    char_acPrimaryAction: str = ""
    
    char_damage: str = "0"
    display_damage: str = "0"
    char_dgMod: str = "0"
    char_dgPrimaryAction: str = ""
    
    char_conditions: str = "0"
    display_conditions: str = "0"
    char_cnMod: str = "0"
    char_cnPrimaryAction: str = ""
    
    char_initiative: str = "0"
    display_initiative: str = "0"
    char_initiativeMod: str = "0"
    char_initiativePrimaryAction: str = ""
    
    # Hit Points
    char_hp: str = "100"
    char_hp_max: str = "100"
    
    # Sheet Navigation
    sheet_tab: str = "character"
    
    # Archetype Fields
    char_archetype_movement: str = ""
    char_archetype_attackType: str = ""
    char_archetype_effectType: str = ""
    char_archetype_uniqueAbility: str = ""
    char_archetype_defensive: str = ""
    char_archetype_specialAttack: str = ""
    char_archetype_utility: str = ""
    
    # Biography
    char_bio: str = ""
    
    # Repeating Sections
    repeating_sections: Dict[str, Dict[str, Dict[str, str]]] = field(default_factory=dict)
    
    # Abilities
    abilities: List[Dict[str, Any]] = field(default_factory=list)
    
    # Permissions
    permissions: Dict[str, str] = field(default_factory=dict)

    def to_flat_dict(self) -> Dict[str, str]:
        """Convert to flat dictionary for Roll20 upload"""
        result = {}
        
        # Add all regular fields
        for field_name, field_value in self.__dict__.items():
            if field_name not in ['repeating_sections', 'abilities', 'permissions']:
                result[field_name] = str(field_value)
        
        # Add repeating sections with Roll20 naming convention
        for section_name, section_data in self.repeating_sections.items():
            for row_id, row_data in section_data.items():
                for field_name, field_value in row_data.items():
                    full_key = f"repeating_{section_name}_{row_id}_{field_name}"
                    result[full_key] = str(field_value)
        
        return result

    def get_field_count(self) -> int:
        """Get total number of fields in this character"""
        flat_dict = self.to_flat_dict()
        return len(flat_dict)

    def validate_required_fields(self) -> List[str]:
        """Validate all required fields are present"""
        errors = []
        
        required_fields = [
            'char_tier', 'char_avoidance', 'char_durability', 'char_resolve',
            'char_stability', 'char_vitality', 'char_accuracy', 'char_damage',
            'char_conditions', 'char_movement', 'char_initiative'
        ]
        
        for field_name in required_fields:
            if not getattr(self, field_name) or getattr(self, field_name) == "0":
                errors.append(f"Required field {field_name} is missing or zero")
        
        return errors

class Roll20SchemaFactory:
    """Factory for creating Roll20 character schemas"""
    
    @staticmethod
    def create_from_web_builder(web_data: Dict[str, Any]) -> Roll20Character:
        """Create Roll20 schema from web builder data"""
        return Roll20Character(
            character_name=web_data.get('name', ''),
            character_realname=web_data.get('realName', ''),
            char_tier=str(web_data.get('tier', 4)),
            # Additional fields will be populated by SchemaMapper
        )
    
    @staticmethod
    def create_empty() -> Roll20Character:
        """Create empty Roll20 character schema"""
        return Roll20Character()

# Field mapping for repeating sections
REPEATING_SECTION_MAPPINGS = {
    # Traits section
    'traits': {
        'name_field': 'traitName',
        'description_field': 'traitDesc',
        'active_field': 'traitActive',
        'bonus_fields': [
            'traitAcBonus', 'traitDgBonus', 'traitCnBonus',
            'traitAvBonus', 'traitDrBonus', 'traitRsBonus',
            'traitSbBonus', 'traitVtBonus', 'traitMBonus'
        ]
    },
    
    # Unique Abilities section
    'uniqueabilities': {
        'name_field': 'char_uniqueAbilities',
        'description_field': 'uniqueAbilitiesDesc'
    },
    
    # Features section
    'features': {
        'name_field': 'char_features',
        'description_field': 'featuresDesc'
    },
    
    # Notes section
    'notes': {
        'name_field': 'char_notes',
        'description_field': 'notesDesc'
    },
    
    # Expertise sections (7 different attribute types)
    'awarenessexpertises': {
        'active_field': 'awarenessExpertiseActive',
        'name_field': 'awarenessExpertiseName'
    },
    'communicationexpertises': {
        'active_field': 'communicationExpertiseActive', 
        'name_field': 'communicationExpertiseName'
    },
    'intelligenceexpertises': {
        'active_field': 'intelligenceExpertiseActive',
        'name_field': 'intelligenceExpertiseName'
    },
    'focusexpertises': {
        'active_field': 'focusExpertiseActive',
        'name_field': 'focusExpertiseName'
    },
    'mobilityexpertises': {
        'active_field': 'mobilityExpertiseActive',
        'name_field': 'mobilityExpertiseName'
    },
    'enduranceexpertises': {
        'active_field': 'enduranceExpertiseActive',
        'name_field': 'enduranceExpertiseName'
    },
    'powerexpertises': {
        'active_field': 'powerExpertiseActive',
        'name_field': 'powerExpertiseName'
    },
    
    # Attacks section (most complex)
    'attacks': {
        'name_field': 'AttackName',
        'subtitle_field': 'leftsub',
        'type_field': 'AttackType',
        'effect_field': 'EffectType',
        'hybrid_field': 'Hybrid',
        'roll_cn_field': 'RollCN',
        # Attack upgrade fields will be added dynamically
    }
}

# Attack upgrade field mappings (based on successful schema system testing)
ATTACK_UPGRADE_MAPPINGS = {
    # Accuracy Upgrades
    "Accurate_Attack": "AccurateAttack",
    "Reliable_Accuracy": "ReliableAccuracy", 
    "Accuracy_Critical_Range": "AccuracyCriticalRange",
    "Powerful_Critical": "PowerfulCritical",
    "Overhit": "Overhit",
    "Blitz": "Blitz",
    "Ricochet": "Ricochet",
    "Double_Tap": "DoubleTap",
    "Explosive_Critical": "ExplosiveCritical",
    
    # Damage Upgrades
    "Power_Attack": "PowerAttack",
    "High_Impact": "HighImpact",
    "Enhanced_Effect": "EnhancedEffect",
    "Reliable_Effect": "ReliableEffect",
    "Consistent_Effect": "ConsistentEffect",
    "ConsistentEffect": "ConsistentEffect",
    "Critical_Effect": "CriticalEffect",
    "Armor_Piercing": "ArmorPiercing",
    "Brutal": "Brutal",
    "Splash_Damage": "SplashDamage",
    "Bleed": "Bleed",
    "Environmental": "Environmental",
    "Shatter": "Shatter",
    "Leech": "Leech",
    "Finishing_Blow": "FinishingBlow",
    "Culling_Strike": "CullingStrike",
    
    # Condition Upgrades
    "Condition_Critical_Range": "ConditionCriticalRange",
    "Lasting_Condition": "LastingCondition",
    "LastingCondition": "LastingCondition",
    "Mass_Effect": "MassEffect",
    "Collateral_Condition": "CollateralCondition",
    "Contagious": "Contagious",
    "Cursed": "Cursed",
    "Overwhelming_Affliction": "OverwhelmingAffliction",
    
    # Specialized Upgrades
    "Heavy_Strike": "HeavyStrike",
    "Quick_Strikes": "QuickStrikes", 
    "Whirlwind_Strike": "WhirlwindStrike",
    "Headshot": "Headshot",
    "Barrage": "Barrage",
    "Scatter_Shot": "ScatterShot",
    "Flurry_of_Blows": "FlurryOfBlows",
    "Pounce": "Pounce",
    "Splinter": "Splinter",
    "Analyzing_Strike": "AnalyzingStrike",
    "Follow_Up_Strike": "FollowUpStrike",
    "Counterattack": "Counterattack",
    "Exploit": "Exploit",
    "Priority_Target": "PriorityTarget",
    "Bully": "Bully",
    "Martial_Artist": "MartialArtist",
    "Grappler": "Grappler",
    "Menacing": "Menacing",
    "Disengage": "Disengage",
    "Extra_Attack": "ExtraAttack",
    
    # Slayer Upgrades
    "Minion_Slayer": "MinionSlayer",
    "Captain_Slayer": "CaptainSlayer",
    "Elite_Slayer": "EliteSlayer",
    "Boss_Slayer": "BossSlayer",
    
    # Variable Upgrades
    "Lucky_Strike": "LuckyStrike",
    "Compressed_Release": "CompressedRelease",
    "Domain": "Domain",
    "Tower_Defense": "TowerDefense",
    "Channeled": "Channeled",
    "Focused": "Focused"
}

logger.info(f"Roll20 schema loaded with {len(ATTACK_UPGRADE_MAPPINGS)} attack upgrade mappings")