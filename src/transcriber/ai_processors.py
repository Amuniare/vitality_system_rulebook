"""
AI-powered processors for session analysis and cleaning
Enhanced with character mapping, chunking, and diagnostic capabilities
"""
import re
import google.generativeai as genai
import json
import logging
import time
from pathlib import Path
from typing import Dict, List, Optional
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Import new utilities
from character_mapping import CharacterMapper
from diagnostic_utils import ContentAnalyzer
from chunking_utils import SessionChunker

class AIProcessor:
    """Base class for AI-powered session processors"""
    
    def __init__(self, config_path: str = ".", api_key: Optional[str] = None, campaign_name: Optional[str] = None):
        self.logger = logging.getLogger(__name__)
        self.logger.info("Starting AIProcessor initialization...")
        
        self.config_path = Path(config_path)
        self.campaign_name = campaign_name or "rogue_trader"
        
        self.logger.info(f"Config path: {self.config_path}")
        self.logger.info(f"Campaign name: {self.campaign_name}")
        
        # Initialize API
        try:
            self.logger.info("Checking for GEMINI_API_KEY...")
            api_key = api_key or os.getenv('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
            
            self.logger.info("GEMINI_API_KEY found, configuring Google AI...")
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-pro')
            self.logger.info("Google AI model initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Google AI: {e}")
            raise
        
        # Load templates and campaign context
        try:
            self.logger.info("Loading processing templates...")
            self._load_templates()
            
            self.logger.info("Loading campaign context...")
            self._load_campaign_context()
            
            # Initialize character mapper - FIX: Only pass campaign_name
            self.logger.info("Initializing character mapper...")
            self.character_mapper = CharacterMapper(self.campaign_name)
            
            # Initialize content analyzer
            self.logger.info("Initializing content analyzer...")
            self.content_analyzer = ContentAnalyzer()
            
            self.logger.info("AIProcessor initialization completed successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize AIProcessor: {e}")
            import traceback
            self.logger.error(f"Full traceback: {traceback.format_exc()}")
            raise
    
    def _load_templates(self):
        """Load processing templates from JSON file"""
        templates_file = self.config_path / "processing_templates.json"
        self.logger.info(f"Looking for templates file: {templates_file}")
        
        try:
            if not templates_file.exists():
                self.logger.error(f"Templates file not found: {templates_file}")
                # Create default templates if missing
                self._create_default_templates(templates_file)
                return
                
            with open(templates_file, 'r', encoding='utf-8') as f:
                self.templates = json.load(f)
            self.logger.info(f"Loaded {len(self.templates)} template sections")
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in templates file: {e}")
            self.templates = {}
        except Exception as e:
            self.logger.error(f"Unexpected error loading templates: {e}")
            self.templates = {}
    
    def _create_default_templates(self, templates_file: Path):
        """Create default processing templates if missing"""
        default_templates = {
            "cleanup_processor": {
                "system_prompt": "You are an expert at cleaning and organizing tabletop RPG session transcripts. Your job is to take raw Discord chat logs and convert them into clean, well-formatted session transcripts.",
                "user_prompt_template": "Clean and format this raw session transcript from session {session_number}.\n\nCampaign Context: {campaign_context}\n\nCharacter Info: {character_info}\n\nRaw Transcript:\n{raw_transcript}\n\nPlease provide a clean, well-formatted version with proper speaker names and organized dialogue."
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
    
    def _load_campaign_context(self):
        """Load campaign context from JSON file"""
        context_file = self.config_path / f"{self.campaign_name}_campaign_context.json"
        self.logger.info(f"Looking for campaign context file: {context_file}")
        
        try:
            if not context_file.exists():
                self.logger.error(f"Campaign context file not found: {context_file}")
                # Create default campaign context if missing
                self._create_default_campaign_context(context_file)
                return
                
            with open(context_file, 'r', encoding='utf-8') as f:
                self.campaign_context = json.load(f)
            self.logger.info("Campaign context loaded successfully")
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in campaign context file: {e}")
            self.campaign_context = {}
        except Exception as e:
            self.logger.error(f"Unexpected error loading campaign context: {e}")
            self.campaign_context = {}
    
    def _create_default_campaign_context(self, context_file: Path):
        """Create default campaign context if missing"""
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
    
    def _make_api_call(self, prompt: str, system_prompt: str = "", max_retries: int = 3, 
                      rate_limit_delay: float = 1.0) -> Optional[str]:
        """Make API call with retries and rate limiting"""
        
        for attempt in range(max_retries):
            try:
                # Prepare the full prompt
                if system_prompt:
                    full_prompt = f"{system_prompt}\n\n{prompt}"
                else:
                    full_prompt = prompt
                
                # Make the API call
                response = self.model.generate_content(full_prompt)
                
                if response.text:
                    return response.text.strip()
                else:
                    self.logger.warning(f"Empty response on attempt {attempt + 1}")
                    
            except Exception as e:
                self.logger.warning(f"API call failed on attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    time.sleep(rate_limit_delay * (2 ** attempt))  # Exponential backoff
                
        self.logger.error(f"All {max_retries} API call attempts failed")
        return None
    
    def _format_character_info(self) -> str:
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
    
    def _format_campaign_summary(self) -> str:
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


class CleanupProcessor(AIProcessor):
    """Processor for cleaning raw Discord transcripts with chunking support"""
    
    def __init__(self, config_path: str = ".", api_key: Optional[str] = None, campaign_name: Optional[str] = None):
        # Initialize parent class first
        super().__init__(config_path, api_key, campaign_name)
        
        # Initialize chunker with progress callback
        self.logger.info("Initializing session chunker with enhanced safety features...")
        try:
            def progress_callback(progress, chunk_id, current_pos, total_words, elapsed_time):
                self.logger.info(f"📊 Chunking progress: {progress:.1f}% (chunk {chunk_id}, {current_pos}/{total_words} words, {elapsed_time:.1f}s)")
            
            self.chunker = SessionChunker(
                max_chunk_size=8000,
                overlap_size=200, 
                timeout_seconds=600,  # 10 minute timeout
                progress_callback=progress_callback
            )
            self.logger.info("Enhanced session chunker initialized successfully")
        except Exception as e:
            self.logger.error(f"Failed to initialize session chunker: {e}")
            raise
    
    def process(self, raw_transcript: str, session_number: int, previous_session_summary: str = "") -> Optional[str]:
        """Process raw transcript with intelligent chunking for large sessions"""
        
        self.logger.info(f"Starting cleanup processing for session {session_number}")
        
        # Diagnostic logging - input metrics
        raw_lines = len(raw_transcript.split('\n'))
        raw_words = len(raw_transcript.split())
        raw_speakers = len(set(re.findall(r'^([^:]+):', raw_transcript, re.MULTILINE)))
        
        self.logger.info(f"INPUT METRICS - Session {session_number}: {raw_lines} lines, {raw_words} words, {raw_speakers} speakers")
        
        # Check if session needs chunking
        if self.chunker.should_chunk_session(raw_transcript):
            self.logger.info(f"Large session detected ({raw_words} words), using chunking strategy")
            result = self._process_large_session(raw_transcript, session_number, previous_session_summary)
        else:
            result = self._process_single_session(raw_transcript, session_number, previous_session_summary)
        
        # Diagnostic logging - output metrics and analysis
        if result:
            self._log_processing_results(raw_transcript, result, session_number)
        
        return result
    
    def _process_single_session(self, raw_transcript: str, session_number: int, previous_session_summary: str = "") -> Optional[str]:
        """Process session as single unit"""
        template = self.templates.get('cleanup_processor', {})
        if not template:
            self.logger.error("Cleanup processor template not found")
            return None
        
        # Detect and map speakers
        detected_speakers = self.character_mapper.detect_speakers_in_text(raw_transcript)
        speaker_mapping_info = self.character_mapper.generate_speaker_mapping_text(detected_speakers)
        
        self.logger.info(f"Detected speakers: {[s['character_name'] for s in detected_speakers]}")
        
        # Build enhanced prompt
        prompt = template.get('user_prompt_template', '').format(
            session_number=session_number,
            campaign_setting=self.campaign_context.get('campaign_info', {}).get('setting', 'Unknown'),
            campaign_context=self._format_campaign_summary(),
            character_info=self._format_character_info(),
            previous_session_summary=previous_session_summary or "No previous session summary available.",
            raw_transcript=raw_transcript
        )
        
        system_prompt = template.get('system_prompt', '')
        
        self.logger.info(f"Processing cleanup for session {session_number}")
        result = self._make_api_call(prompt, system_prompt)
        
        if result:
            self.logger.info(f"Cleanup completed for session {session_number}")
        
        return result
    
    def _process_large_session(self, raw_transcript: str, session_number: int, previous_session_summary: str = "") -> Optional[str]:
        """Process large session using enhanced chunking strategy with validation"""
        self.logger.info(f"Processing large session with enhanced chunking for session {session_number}...")
        
        try:
            # Generate chunks with enhanced algorithm
            self.logger.info("🔄 Starting intelligent session chunking...")
            chunks = self.chunker.chunk_session_intelligently(raw_transcript, session_number)
            
            # Validate chunks before processing
            validation = self.chunker.validate_chunks_before_processing(chunks)
            if not validation['valid']:
                self.logger.error(f"Chunk validation failed: {validation['issues']}")
                # Continue with processing but log warnings
                for issue in validation['issues']:
                    self.logger.warning(f"⚠️ Chunk validation issue: {issue}")
            else:
                self.logger.info(f"✅ Chunk validation passed: {validation['chunk_count']} chunks, {validation['total_chunk_words']} total words")
            
            # Process chunks with progress tracking
            processed_chunks = []
            failed_chunks = []
            
            for i, chunk in enumerate(chunks, 1):
                self.logger.info(f"🧩 Processing chunk {i}/{len(chunks)} (words: {len(chunk['content'].split())})")
                
                try:
                    # Extract 'content' from chunk dictionary
                    chunk_content = chunk['content']
                    chunk_result = self._process_single_session(chunk_content, session_number, previous_session_summary)
                    
                    if chunk_result:
                        processed_chunks.append(chunk_result)
                        self.logger.info(f"✅ Successfully processed chunk {i}")
                    else:
                        failed_chunks.append(i)
                        self.logger.warning(f"⚠️ Chunk {i} processing returned no result")
                        
                except Exception as e:
                    failed_chunks.append(i)
                    self.logger.error(f"❌ Failed to process chunk {i}: {e}")
            
            # Report processing results
            success_rate = len(processed_chunks) / len(chunks) * 100
            self.logger.info(f"📊 Chunk processing complete: {len(processed_chunks)}/{len(chunks)} successful ({success_rate:.1f}%)")
            
            if failed_chunks:
                self.logger.warning(f"⚠️ Failed chunks: {failed_chunks}")
            
            if processed_chunks:
                # Stitch chunks back together
                self.logger.info("🧩 Stitching processed chunks together...")
                merged_result = self.chunker.stitch_chunks_together(processed_chunks)
                
                # Validate final result
                completeness = self.chunker.validate_chunk_completeness(raw_transcript, merged_result)
                
                if completeness['quality_acceptable']:
                    self.logger.info(f"✅ Chunking quality validation passed: {completeness['word_retention']:.1%} word retention")
                else:
                    self.logger.warning(f"⚠️ Chunking quality concerns: {completeness['warnings']}")
                
                self.logger.info(f"🎉 Successfully merged {len(processed_chunks)} chunks with {completeness['word_retention']:.1%} content retention")
                return merged_result
            else:
                self.logger.error("❌ No chunks were successfully processed")
                return None
                
        except Exception as e:
            self.logger.error(f"❌ Large session processing failed: {e}")
            import traceback
            self.logger.error(f"Full traceback: {traceback.format_exc()}")
            return None
    
    def _log_processing_results(self, raw_transcript: str, result: str, session_number: int):
        """Log processing results and quality metrics"""
        cleaned_lines = len(result.split('\n'))
        cleaned_words = len(result.split())
        cleaned_speakers = len(set(re.findall(r'^([^:]+):', result, re.MULTILINE)))
        
        # Calculate processing metrics
        raw_words = len(raw_transcript.split())
        compression_ratio = cleaned_words / raw_words if raw_words > 0 else 0
        
        self.logger.info(f"OUTPUT METRICS - Session {session_number}: {cleaned_lines} lines, {cleaned_words} words, {cleaned_speakers} speakers")
        self.logger.info(f"PROCESSING METRICS - Compression: {compression_ratio:.2f}, Quality: {'Good' if 0.7 <= compression_ratio <= 1.0 else 'Check'}")


class TimelineProcessor(AIProcessor):
    """Processor for creating detailed timelines"""
    
    def process(self, cleaned_transcript: str, session_number: int) -> Optional[str]:
        template = self.templates.get('timeline_processor', {})
        if not template:
            self.logger.error("Timeline processor template not found")
            return None
        
        prompt = template.get('user_prompt_template', '').format(
            session_number=session_number,
            campaign_context=self._format_campaign_summary(),
            character_info=self._format_character_info(),
            cleaned_transcript=cleaned_transcript
        )
        
        system_prompt = template.get('system_prompt', '')
        
        self.logger.info(f"Processing timeline for session {session_number}")
        result = self._make_api_call(prompt, system_prompt)
        
        if result:
            self.logger.info(f"Timeline completed for session {session_number}")
        
        return result


class NotesProcessor(AIProcessor):
    """Processor for creating concise bullet-point notes"""
    
    def process(self, detailed_timeline: str, session_number: int) -> Optional[str]:
        template = self.templates.get('notes_processor', {})
        if not template:
            self.logger.error("Notes processor template not found")
            return None
        
        prompt = template.get('user_prompt_template', '').format(
            session_number=session_number,
            campaign_context=self._format_campaign_summary(),
            character_info=self._format_character_info(),
            detailed_timeline=detailed_timeline
        )
        
        system_prompt = template.get('system_prompt', '')
        
        self.logger.info(f"Processing notes for session {session_number}")
        result = self._make_api_call(prompt, system_prompt)
        
        if result:
            self.logger.info(f"Notes completed for session {session_number}")
        
        return result


class SummaryProcessor(AIProcessor):
    """Processor for creating narrative summaries"""
    
    def process(self, notes: str, timeline: str, session_number: int) -> Optional[str]:
        template = self.templates.get('summary_processor', {})
        if not template:
            self.logger.error("Summary processor template not found")
            return None
        
        prompt = template.get('user_prompt_template', '').format(
            session_number=session_number,
            campaign_context=self._format_campaign_summary(),
            character_info=self._format_character_info(),
            session_notes=notes,
            detailed_timeline=timeline
        )
        
        system_prompt = template.get('system_prompt', '')
        
        self.logger.info(f"Processing summary for session {session_number}")
        result = self._make_api_call(prompt, system_prompt)
        
        if result:
            self.logger.info(f"Summary completed for session {session_number}")
        
        return result


class ProcessingPipeline:
    """Main pipeline for processing sessions through all stages"""
    
    def __init__(self, config_path: str = ".", api_key: Optional[str] = None, campaign_name: Optional[str] = None):
        self.logger = logging.getLogger(__name__)
        self.logger.info("Initializing ProcessingPipeline...")
        
        try:
            # Create individual processors
            self.logger.info("Creating cleanup processor...")
            self.cleanup_processor = CleanupProcessor(config_path, api_key, campaign_name)
            
            self.logger.info("Creating timeline processor...")
            self.timeline_processor = TimelineProcessor(config_path, api_key, campaign_name)
            
            self.logger.info("Creating notes processor...")
            self.notes_processor = NotesProcessor(config_path, api_key, campaign_name)
            
            self.logger.info("Creating summary processor...")
            self.summary_processor = SummaryProcessor(config_path, api_key, campaign_name)
            
            self.logger.info("ProcessingPipeline initialization completed successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize ProcessingPipeline: {e}")
            raise
    
    def process_session(self, raw_transcript: str, session_number: int, 
                       stages: List[str] = None, previous_session_summary: str = "") -> Dict[str, Optional[str]]:
        """Process a session through specified stages"""
        
        if stages is None:
            stages = ['cleanup', 'timeline', 'notes', 'summary']
        
        results = {}
        
        # Stage 1: Cleanup (always required)
        if 'cleanup' in stages:
            self.logger.info(f"Processing cleanup stage for session {session_number}")
            cleaned = self.cleanup_processor.process(raw_transcript, session_number, previous_session_summary)
            results['cleanup'] = cleaned
        else:
            cleaned = raw_transcript  # Use raw if cleanup skipped
            results['cleanup'] = None
        
        # Stage 2: Timeline
        if 'timeline' in stages and cleaned:
            self.logger.info(f"Processing timeline stage for session {session_number}")
            timeline = self.timeline_processor.process(cleaned, session_number)
            results['timeline'] = timeline
        else:
            timeline = None
            results['timeline'] = None
        
        # Stage 3: Notes
        if 'notes' in stages and timeline:
            self.logger.info(f"Processing notes stage for session {session_number}")
            notes = self.notes_processor.process(timeline, session_number)
            results['notes'] = notes
        else:
            notes = None
            results['notes'] = None
        
        # Stage 4: Summary
        if 'summary' in stages and notes and timeline:
            self.logger.info(f"Processing summary stage for session {session_number}")
            summary = self.summary_processor.process(notes, timeline, session_number)
            results['summary'] = summary
        else:
            results['summary'] = None
        
        return results
    
    def validate_results(self, results: Dict[str, Optional[str]]) -> Dict[str, bool]:
        """Validate processing results for quality and completeness"""
        validation = {}
        
        for stage, content in results.items():
            if content is None:
                validation[stage] = False
                continue
            
            # Basic validation checks
            words = len(content.split())
            lines = len(content.split('\n'))
            
            if stage == 'cleanup':
                # Cleaned transcript should be substantial
                validation[stage] = words > 50 and lines > 5
            elif stage == 'timeline':
                # Timeline should have bullet points
                bullet_count = content.count('•') + content.count('-') + content.count('*')
                validation[stage] = bullet_count >= 5 and words > 100
            elif stage == 'notes':
                # Notes should be concise but meaningful
                validation[stage] = words > 30 and words < 1000 and lines >= 3
            elif stage == 'summary':
                # Summary should be prose format
                validation[stage] = words > 100 and words < 2000
            else:
                validation[stage] = words > 10  # Default minimum
        
        return validation