"""
Character mapping utilities for Discord username to character name conversion
"""
from typing import Dict, List, Optional
import re
import logging

# Rogue Trader Campaign Character Mapping
ROGUE_TRADER_PLAYER_MAPPING = {
    'trent': {
        'canonical_name': 'Trent [GM/Cinder]',
        'character_name': 'Cinder (Celestine Vex)',
        'role': 'GM / Unsanctioned Pyromancer Psyker',
        'discord_username': 'amuniare',
        'powers': 'Pyromancer abilities, GM control'
    },
    'amuniare': {
        'canonical_name': 'Trent [GM/Cinder]',
        'character_name': 'Cinder (Celestine Vex)',
        'role': 'GM / Unsanctioned Pyromancer Psyker',
        'discord_username': 'amuniare',
        'powers': 'Pyromancer abilities, GM control'
    },
    'emperor\'s favorite princess': {
        'canonical_name': 'Emmanual [Dame Venecia Delatorae]',
        'character_name': 'Dame Venecia Delatorae',
        'role': 'Rogue Trader',
        'discord_username': 'emperor\'s favorite princess',
        'powers': 'Erratic warp presence, powerful psychic abilities'
    },
    'faust': {
        'canonical_name': 'Phantom [Faust Gray]',
        'character_name': 'Faust Gray',
        'role': 'Nascent Psyker',
        'discord_username': '.phan10m',
        'powers': 'Telekinesis, Time manipulation, Mental abilities'
    },
    'burn baby burn': {
        'canonical_name': 'Diego [Sister Inés]',
        'character_name': 'Sister Inés (Maria Inés Matamoros de los Colmenares)',
        'role': 'Sister of Battle',
        'discord_username': 'burn baby burn',
        'powers': 'Faith-based abilities, combat expertise'
    },
    'nick': {
        'canonical_name': 'Nick [Brother Rainard]',
        'character_name': 'Brother Rainard',
        'role': 'Ancient Warrior (Space Marine)',
        'discord_username': 'bipolarfrenchie',
        'powers': 'Superhuman combat abilities, ancient knowledge'
    },
    'bipolarfrenchie': {
        'canonical_name': 'Nick [Brother Rainard]',
        'character_name': 'Brother Rainard',
        'role': 'Ancient Warrior (Space Marine)',
        'discord_username': 'bipolarfrenchie',
        'powers': 'Superhuman combat abilities, ancient knowledge'
    },
    'deven': {
        'canonical_name': 'Deven [Sagoire]',
        'character_name': 'Sagoire',
        'role': 'Tech Priest Explorator',
        'discord_username': 'roathus',
        'powers': 'Tech manipulation, augmented abilities'
    },
    'jubb': {
        'canonical_name': 'jubb [Vale]',
        'character_name': 'Vale (Valekh\'da)',
        'role': 'Drukhari Harlequin',
        'discord_username': 'jubb',
        'powers': 'Harlequin abilities, xenos knowledge'
    },
    # Direct Discord username mappings (for mixed old/new format sessions)
    '.phan10m': {
        'canonical_name': 'Phantom [Faust Gray]',
        'character_name': 'Faust Gray',
        'role': 'Nascent Psyker',
        'discord_username': '.phan10m',
        'powers': 'Telekinesis, Time manipulation, Mental abilities'
    },
    'roathus': {
        'canonical_name': 'Deven [Sagoire]',
        'character_name': 'Sagoire',
        'role': 'Tech Priest Explorator',
        'discord_username': 'roathus',
        'powers': 'Tech manipulation, augmented abilities'
    },
}

class CharacterMapper:
    """Handles mapping between Discord usernames and character information"""
    
    def __init__(self, campaign_name: str):
        self.campaign_name = campaign_name
        self.logger = logging.getLogger(__name__)
        
        if campaign_name == "rogue_trader":
            self.mapping = ROGUE_TRADER_PLAYER_MAPPING
        else:
            self.mapping = {}
            self.logger.warning(f"No character mapping available for campaign: {campaign_name}")
    
    def map_discord_to_character(self, discord_name: str) -> Optional[Dict]:
        """Map Discord username to character info"""
        # Normalize the discord name for matching
        normalized_name = discord_name.lower().strip()
        
        # Remove bracketed content like [gm/cinder] or [brother rainard]
        # This handles cases where speakers include character names in brackets
        base_name = re.sub(r'\s*\[.*?\]', '', normalized_name).strip()
        
        # Try exact match with original name
        if normalized_name in self.mapping:
            return self.mapping[normalized_name]
            
        # Try exact match with base name (no brackets)
        if base_name in self.mapping:
            return self.mapping[base_name]
        
        # Try partial matching for name variations
        for mapped_name, char_info in self.mapping.items():
            # Check if mapped name is contained in the detected name or vice versa
            if mapped_name in normalized_name or normalized_name in mapped_name:
                return char_info
            # Also check base name without brackets
            if mapped_name in base_name or base_name in mapped_name:
                return char_info
        
        return None
    
    def get_all_known_characters(self) -> List[Dict]:
        """Get list of all known characters for this campaign"""
        return list(self.mapping.values())
    
    def detect_speakers_in_text(self, text: str) -> List[Dict]:
        """Detect and map all speakers found in text"""
        detected = []
        speaker_pattern = r'^([^:]+):\s*'
        
        speakers_found = set()
        for line in text.split('\n'):
            match = re.match(speaker_pattern, line.strip())
            if match:
                speaker_name = match.group(1).strip()
                speakers_found.add(speaker_name.lower())
        
        for speaker in speakers_found:
            char_info = self.map_discord_to_character(speaker)
            if char_info:
                detected.append({
                    'discord_name': speaker,
                    'character_name': char_info['character_name'],
                    'role': char_info['role'],
                    'powers': char_info.get('powers', 'Unknown'),
                    'mapped': True
                })
            else:
                detected.append({
                    'discord_name': speaker,
                    'character_name': speaker.title(),
                    'role': 'Unknown',
                    'powers': 'Unknown',
                    'mapped': False
                })
        
        return detected
    
    def generate_speaker_mapping_text(self, detected_speakers: List[Dict]) -> str:
        """Generate formatted text for AI prompts about speaker mappings"""
        if not detected_speakers:
            return "No speakers detected in this session."
        
        mapping_text = "**Speaker Mappings for this session:**\n"
        for speaker in detected_speakers:
            if speaker['mapped']:
                mapping_text += f"- {speaker['discord_name']} → {speaker['character_name']} ({speaker['role']})\n"
                mapping_text += f"  Powers/Abilities: {speaker['powers']}\n"
            else:
                mapping_text += f"- {speaker['discord_name']} → Unknown character (needs mapping)\n"
        
        return mapping_text
    
    def get_legacy_mapping_format(self) -> Dict[str, str]:
        """Get mapping in the format expected by stats_analyzer.py"""
        return {k: v['canonical_name'] for k, v in self.mapping.items()}