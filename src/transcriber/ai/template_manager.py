"""
Template management for AI processing prompts
Centralized management of all AI prompt templates
"""
import json
import logging
from pathlib import Path
from typing import Dict, Optional, List


class TemplateManager:
    """Manages AI prompt templates and campaign context"""
    
    def __init__(self, config_path: str = ".", campaign_name: str = "rogue_trader"):
        self.logger = logging.getLogger(__name__)
        self.config_path = Path(config_path)
        self.campaign_name = campaign_name
        
        # Load templates and context
        self.templates = {}
        self.campaign_context = {}
        
        self._load_processing_templates()
        self._load_campaign_context()
        
        self.logger.info("Template manager initialized successfully")
    
    def _load_processing_templates(self):
        """Load AI processing templates from JSON file"""
        templates_file = self.config_path / "processing_templates.json"
        self.logger.info(f"Loading templates from: {templates_file}")
        
        try:
            if not templates_file.exists():
                self.logger.warning(f"Templates file not found: {templates_file}")
                self._create_default_templates(templates_file)
                return
                
            with open(templates_file, 'r', encoding='utf-8') as f:
                self.templates = json.load(f)
            self.logger.info(f"Loaded {len(self.templates)} template sections")
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in templates file: {e}")
            self._create_default_templates(templates_file)
        except Exception as e:
            self.logger.error(f"Unexpected error loading templates: {e}")
            self.templates = {}
    
    def _load_campaign_context(self):
        """Load campaign context from JSON file"""
        context_file = self.config_path / f"{self.campaign_name}_campaign_context.json"
        self.logger.info(f"Loading campaign context from: {context_file}")
        
        try:
            if not context_file.exists():
                self.logger.warning(f"Campaign context file not found: {context_file}")
                self._create_default_campaign_context(context_file)
                return
                
            with open(context_file, 'r', encoding='utf-8') as f:
                self.campaign_context = json.load(f)
            self.logger.info("Campaign context loaded successfully")
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in campaign context file: {e}")
            self._create_default_campaign_context(context_file)
        except Exception as e:
            self.logger.error(f"Unexpected error loading campaign context: {e}")
            self.campaign_context = {}
    
    def _create_default_templates(self, templates_file: Path):
        """Create default processing templates"""
        default_templates = {
            "cleanup_processor": {
                "system_prompt": "You are an expert at cleaning and organizing tabletop RPG session transcripts. Your job is to take raw Discord chat logs and convert them into clean, well-formatted session transcripts.",
                "user_prompt_template": "Clean and format this raw session transcript from session {session_number}.\n\nCampaign Context: {campaign_context}\n\nCharacter Info: {character_info}\n\nRaw Transcript:\n{raw_transcript}\n\nIMPORTANT: Replace Discord usernames with the canonical character names from the Character Info mappings (format: discord_username [Character Name]). For example, if you see 'trent:' or 'Trent:' in the raw transcript, replace it with 'amuniare [GM/Cinder]:' based on the character mappings provided.\n\nPlease provide a clean, well-formatted version with proper canonical speaker names and organized dialogue."
            },
            "timeline_processor": {
                "system_prompt": "You are an expert at creating detailed timelines from RPG session transcripts. Create comprehensive bullet-point timelines.",
                "user_prompt_template": "Create a detailed timeline for session {session_number}.\n\nCampaign Context: {campaign_context}\n\nCharacter Info: {character_info}\n\nCleaned Transcript:\n{cleaned_transcript}\n\nProvide a detailed timeline with bullet points for each major event."
            },
            "notes_processor": {
                "system_prompt": "You are an expert at creating concise session notes from detailed timelines. Focus on key events, decisions, and outcomes.",
                "user_prompt_template": "Create concise session notes for session {session_number}.\n\nCampaign Context: {campaign_context}\n\nCharacter Info: {character_info}\n\nDetailed Timeline:\n{detailed_timeline}\n\nProvide 5-10 key bullet points covering the most important events."
            },
            "summary_processor": {
                "system_prompt": "You are an expert at writing narrative summaries of RPG sessions. Create engaging prose that captures the essence of the session.",
                "user_prompt_template": "Write a narrative summary for session {session_number}.\n\nCampaign Context: {campaign_context}\n\nCharacter Info: {character_info}\n\nSession Notes:\n{session_notes}\n\nDetailed Timeline:\n{detailed_timeline}\n\nWrite an engaging 3-paragraph narrative summary."
            }
        }
        
        try:
            templates_file.parent.mkdir(parents=True, exist_ok=True)
            with open(templates_file, 'w', encoding='utf-8') as f:
                json.dump(default_templates, f, indent=2)
            self.templates = default_templates
            self.logger.info(f"Created default templates file: {templates_file}")
        except Exception as e:
            self.logger.error(f"Failed to create default templates: {e}")
            self.templates = default_templates
    
    def _create_default_campaign_context(self, context_file: Path):
        """Create default campaign context"""
        default_context = {
            "campaign_info": {
                "name": "Rogue Trader Campaign",
                "setting": "Warhammer 40,000 universe, Rogue Trader setting",
                "current_date": "Unknown",
                "world_state": "The Imperium of Man in the grim darkness of the far future",
                "themes": ["Space exploration", "Imperial politics", "Xenos encounters", "Chaos threats"]
            },
            "player_characters": {
                "active": [
                    {
                        "character_name": "Cinder (Celestine Vex)",
                        "discord_username": "amuniare", 
                        "role": "GM / Unsanctioned Pyromancer Psyker",
                        "powers": "Pyromancer abilities, GM control"
                    },
                    {
                        "character_name": "Dame Venecia Delatorae",
                        "discord_username": "emperor's favorite princess",
                        "role": "Rogue Trader",
                        "powers": "Erratic warp presence, powerful psychic abilities"
                    },
                    {
                        "character_name": "Faust Gray",
                        "discord_username": ".phan10m",
                        "role": "Nascent Psyker", 
                        "powers": "Telekinesis, Time manipulation, Mental abilities"
                    },
                    {
                        "character_name": "Sister Inés (Maria Inés Matamoros de los Colmenares)",
                        "discord_username": "burn baby burn",
                        "role": "Sister of Battle",
                        "powers": "Faith-based abilities, combat expertise"
                    },
                    {
                        "character_name": "Brother Rainard",
                        "discord_username": "bipolarfrenchie",
                        "role": "Ancient Warrior (Space Marine)",
                        "powers": "Superhuman combat abilities, ancient knowledge"
                    },
                    {
                        "character_name": "Sagoire",
                        "discord_username": "roathus",
                        "role": "Tech Priest Explorator",
                        "powers": "Tech manipulation, augmented abilities"
                    },
                    {
                        "character_name": "Vale (Valekh'da)",
                        "discord_username": "jubb",
                        "role": "Drukhari Harlequin",
                        "powers": "Harlequin abilities, xenos knowledge"
                    }
                ]
            },
            "major_npcs": {
                "imperial": [
                    {
                        "name": "Various Imperial Officials",
                        "role": "Government and Military",
                        "status": "Active"
                    }
                ],
                "xenos": [
                    {
                        "name": "Various Alien Species",
                        "role": "Threats and Allies",
                        "status": "Encountered"
                    }
                ]
            }
        }
        
        try:
            context_file.parent.mkdir(parents=True, exist_ok=True)
            with open(context_file, 'w', encoding='utf-8') as f:
                json.dump(default_context, f, indent=2)
            self.campaign_context = default_context
            self.logger.info(f"Created default campaign context file: {context_file}")
        except Exception as e:
            self.logger.error(f"Failed to create default campaign context: {e}")
            self.campaign_context = default_context
    
    def get_template(self, processor_name: str) -> Optional[Dict]:
        """Get template configuration for a specific processor"""
        return self.templates.get(processor_name)
    
    def format_prompt(self, processor_name: str, **kwargs) -> Optional[str]:
        """Format a prompt template with provided parameters"""
        template = self.get_template(processor_name)
        if not template:
            self.logger.error(f"Template not found: {processor_name}")
            return None
        
        try:
            prompt_template = template.get('user_prompt_template', '')
            
            # Add default context formatting
            if 'campaign_context' not in kwargs:
                kwargs['campaign_context'] = self.format_campaign_summary()
            if 'character_info' not in kwargs:
                kwargs['character_info'] = self.format_character_info()
            
            return prompt_template.format(**kwargs)
            
        except KeyError as e:
            self.logger.error(f"Missing template parameter: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Error formatting template: {e}")
            return None
    
    def get_system_prompt(self, processor_name: str) -> Optional[str]:
        """Get system prompt for a specific processor"""
        template = self.get_template(processor_name)
        return template.get('system_prompt') if template else None
    
    def format_campaign_summary(self) -> str:
        """Format campaign summary for prompts"""
        if not self.campaign_context.get('campaign_info'):
            return "No campaign information available."
        
        info = self.campaign_context['campaign_info']
        summary = f"**Campaign: {info.get('name', 'Unknown')}**\n"
        summary += f"Setting: {info.get('setting', 'Unknown')}\n"
        summary += f"Current Date: {info.get('current_date', 'Unknown')}\n"
        summary += f"World State: {info.get('world_state', 'Unknown')}\n"
        
        if 'themes' in info:
            summary += f"Themes: {', '.join(info['themes'])}\n"
        
        return summary
    
    def format_character_info(self) -> str:
        """Format character information for prompts"""
        if not self.campaign_context.get('player_characters'):
            return "No character information available."
        
        characters = self.campaign_context['player_characters'].get('active', [])
        if not characters:
            return "No active characters defined."
        
        char_text = "**Active Player Characters:**\n"
        for char in characters:
            char_text += f"- {char.get('character_name', 'Unknown')}"
            if char.get('discord_username'):
                char_text += f" (Discord: {char['discord_username']})"
            char_text += f": {char.get('powers', 'No powers listed')}\n"
        
        return char_text
    
    def list_available_processors(self) -> List[str]:
        """List all available processor templates"""
        return list(self.templates.keys())
    
    def validate_template(self, processor_name: str) -> Dict:
        """Validate that a template has all required components"""
        template = self.get_template(processor_name)
        if not template:
            return {'valid': False, 'error': 'Template not found'}
        
        required_fields = ['system_prompt', 'user_prompt_template']
        missing_fields = [field for field in required_fields if field not in template]
        
        if missing_fields:
            return {
                'valid': False, 
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }
        
        return {'valid': True, 'error': None}