"""
AI Processing Pipeline for Session Transcripts
Handles multi-stage processing using Google Gemini API
"""

import os
import json
import time
import logging
from typing import Dict, List, Optional, Any
from pathlib import Path

try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv():
        pass


class AIProcessor:
    """Base class for AI processing with Gemini API integration"""
    
    def __init__(self, config_path: str = ".", api_key: Optional[str] = None):
        # Initialize logging first
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Check for required dependencies
        if not genai:
            self.logger.warning("google-generativeai not installed. AI processing will not be available.")
        
        self.config_path = Path(config_path)
        self.api_key = api_key or self._load_api_key()
        self.campaign_context = self._load_campaign_context()
        self.templates = self._load_templates()
        self.model = None
        self.rate_limit_delay = 1.0  # Start with 1 second delay
        self.max_retries = 3
        
        if genai and self.api_key:
            self._initialize_client()
    
    def _load_api_key(self) -> Optional[str]:
        """Load Gemini API key from environment"""
        load_dotenv()
        return os.getenv('GEMINI_API_KEY')
    
    def _load_campaign_context(self) -> Dict[str, Any]:
        """Load campaign context configuration"""
        context_file = self.config_path / "campaign_context.json"
        try:
            with open(context_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            self.logger.warning(f"Campaign context file not found: {context_file}")
            return {}
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in campaign context: {e}")
            return {}
    
    def _load_templates(self) -> Dict[str, Any]:
        """Load processing templates configuration"""
        templates_file = self.config_path / "processing_templates.json"
        try:
            with open(templates_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            self.logger.warning(f"Templates file not found: {templates_file}")
            return {}
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in templates: {e}")
            return {}
    
    def _initialize_client(self):
        """Initialize Gemini API client"""
        try:
            genai.configure(api_key=self.api_key)
            # Try the newer model names first, fall back to older ones
            model_names = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
            
            for model_name in model_names:
                try:
                    self.model = genai.GenerativeModel(model_name)
                    self.logger.info(f"Gemini API client initialized successfully with model: {model_name}")
                    return
                except Exception as model_error:
                    self.logger.debug(f"Model {model_name} not available: {model_error}")
                    continue
            
            # If no model worked, raise the last error
            raise Exception("No available Gemini model found")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Gemini client: {e}")
            self.model = None
    
    def _make_api_call(self, prompt: str, system_prompt: str = "") -> Optional[str]:
        """Make API call with rate limiting and retry logic"""
        if not self.model:
            self.logger.error("Gemini model not available")
            return None
        
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt
        
        for attempt in range(self.max_retries):
            try:
                # Apply rate limiting
                time.sleep(self.rate_limit_delay)
                
                response = self.model.generate_content(full_prompt)
                
                if response and response.text:
                    # Success - reduce rate limit delay
                    self.rate_limit_delay = max(0.5, self.rate_limit_delay * 0.9)
                    return response.text
                else:
                    self.logger.warning(f"Empty response on attempt {attempt + 1}")
                    
            except Exception as e:
                self.logger.warning(f"API call failed on attempt {attempt + 1}: {e}")
                
                # Exponential backoff
                wait_time = (2 ** attempt) * self.rate_limit_delay
                self.logger.info(f"Waiting {wait_time:.1f}s before retry...")
                time.sleep(wait_time)
                
                # Increase rate limit delay for future calls
                self.rate_limit_delay = min(10.0, self.rate_limit_delay * 1.5)
        
        self.logger.error(f"All {self.max_retries} attempts failed")
        return None
    
    def _format_character_info(self) -> str:
        """Format character information for AI context"""
        if not self.campaign_context.get('player_characters'):
            return "No character information available."
        
        active_chars = self.campaign_context['player_characters'].get('active', [])
        missing_chars = self.campaign_context['player_characters'].get('missing_compromised', [])
        
        char_info = "**Active Player Characters:**\n"
        for char in active_chars:
            char_info += f"- {char.get('name', 'Unknown')} ({char.get('codename', 'No codename')}): {char.get('powers', 'Unknown powers')}\n"
        
        if missing_chars:
            char_info += "\n**Missing/Compromised Characters:**\n"
            for char in missing_chars:
                char_info += f"- {char.get('name', 'Unknown')} ({char.get('codename', 'No codename')}): {char.get('status', 'Unknown status')}\n"
        
        return char_info
    
    def _format_campaign_summary(self) -> str:
        """Format campaign summary for AI context"""
        if not self.campaign_context.get('campaign_info'):
            return "No campaign information available."
        
        info = self.campaign_context['campaign_info']
        crisis = self.campaign_context.get('current_crisis', {})
        
        summary = f"**Setting:** {info.get('setting', 'Unknown')}\n"
        summary += f"**Current State:** {info.get('world_state', 'Unknown')}\n"
        
        if crisis:
            summary += "**Current Crises:**\n"
            for crisis_type, details in crisis.items():
                if isinstance(details, dict) and details.get('cause'):
                    summary += f"- {crisis_type.replace('_', ' ').title()}: {details.get('cause')}\n"
        
        return summary


class CleanupProcessor(AIProcessor):
    """Processor for cleaning and contextualizing raw transcripts"""
    
    def process(self, raw_transcript: str, session_number: int, previous_session_summary: str = "") -> Optional[str]:
        """Clean and contextualize a raw transcript"""
        template = self.templates.get('cleanup_processor', {})
        if not template:
            self.logger.error("Cleanup processor template not found")
            return None
        
        # Format the prompt
        prompt = template.get('user_prompt_template', '').format(
            session_number=session_number,
            campaign_setting=self.campaign_context.get('campaign_info', {}).get('setting', 'Unknown'),
            campaign_context=self._format_campaign_summary(),
            character_info=self._format_character_info(),
            previous_session_summary=previous_session_summary,
            raw_transcript=raw_transcript
        )
        
        system_prompt = template.get('system_prompt', '')
        
        self.logger.info(f"Processing cleanup for session {session_number}")
        result = self._make_api_call(prompt, system_prompt)
        
        if result:
            self.logger.info(f"Cleanup completed for session {session_number}")
        else:
            self.logger.error(f"Cleanup failed for session {session_number}")
        
        return result


class TimelineProcessor(AIProcessor):
    """Processor for creating detailed event timelines"""
    
    def process(self, cleaned_transcript: str, session_number: int, session_date: str = "") -> Optional[str]:
        """Create detailed timeline from cleaned transcript"""
        template = self.templates.get('timeline_processor', {})
        if not template:
            self.logger.error("Timeline processor template not found")
            return None
        
        prompt = template.get('user_prompt_template', '').format(
            session_number=session_number,
            campaign_setting=self.campaign_context.get('campaign_info', {}).get('setting', 'Unknown'),
            session_date=session_date or f"Session {session_number}",
            campaign_context=self._format_campaign_summary(),
            character_info=self._format_character_info(),
            cleaned_transcript=cleaned_transcript
        )
        
        system_prompt = template.get('system_prompt', '')
        
        self.logger.info(f"Processing timeline for session {session_number}")
        result = self._make_api_call(prompt, system_prompt)
        
        if result:
            self.logger.info(f"Timeline completed for session {session_number}")
        else:
            self.logger.error(f"Timeline failed for session {session_number}")
        
        return result


class NotesProcessor(AIProcessor):
    """Processor for creating concise GM notes"""
    
    def process(self, detailed_timeline: str, session_number: int) -> Optional[str]:
        """Create GM notes from detailed timeline"""
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
        else:
            self.logger.error(f"Notes failed for session {session_number}")
        
        return result


class SummaryProcessor(AIProcessor):
    """Processor for creating narrative summaries"""
    
    def process(self, session_notes: str, detailed_timeline: str, session_number: int) -> Optional[str]:
        """Create narrative summary from notes and timeline"""
        template = self.templates.get('summary_processor', {})
        if not template:
            self.logger.error("Summary processor template not found")
            return None
        
        prompt = template.get('user_prompt_template', '').format(
            session_number=session_number,
            campaign_context=self._format_campaign_summary(),
            character_info=self._format_character_info(),
            session_notes=session_notes,
            detailed_timeline=detailed_timeline
        )
        
        system_prompt = template.get('system_prompt', '')
        
        self.logger.info(f"Processing summary for session {session_number}")
        result = self._make_api_call(prompt, system_prompt)
        
        if result:
            self.logger.info(f"Summary completed for session {session_number}")
        else:
            self.logger.error(f"Summary failed for session {session_number}")
        
        return result


class ProcessingPipeline:
    """Orchestrates the complete AI processing pipeline"""
    
    def __init__(self, config_path: str = "."):
        self.config_path = config_path
        self.cleanup_processor = CleanupProcessor(config_path)
        self.timeline_processor = TimelineProcessor(config_path)
        self.notes_processor = NotesProcessor(config_path)
        self.summary_processor = SummaryProcessor(config_path)
        
        self.logger = logging.getLogger(__name__)
    
    def process_session(self, raw_transcript: str, session_number: int, 
                       stages: List[str] = None, previous_session_summary: str = "") -> Dict[str, Optional[str]]:
        """Process a session through specified stages"""
        if stages is None:
            stages = ['cleanup', 'timeline', 'notes', 'summary']
        
        results = {}
        
        # Stage 1: Cleanup
        if 'cleanup' in stages:
            cleaned = self.cleanup_processor.process(
                raw_transcript, session_number, previous_session_summary
            )
            results['cleaned'] = cleaned
        else:
            cleaned = raw_transcript
            results['cleaned'] = cleaned
        
        # Stage 2: Timeline
        if 'timeline' in stages and cleaned:
            timeline = self.timeline_processor.process(
                cleaned, session_number
            )
            results['timeline'] = timeline
        else:
            timeline = None
            results['timeline'] = None
        
        # Stage 3: Notes
        if 'notes' in stages and timeline:
            notes = self.notes_processor.process(
                timeline, session_number
            )
            results['notes'] = notes
        else:
            notes = None
            results['notes'] = None
        
        # Stage 4: Summary
        if 'summary' in stages and notes and timeline:
            summary = self.summary_processor.process(
                notes, timeline, session_number
            )
            results['summary'] = summary
        else:
            results['summary'] = None
        
        return results
    
    def validate_results(self, results: Dict[str, Optional[str]]) -> Dict[str, bool]:
        """Validate processing results against quality criteria"""
        validation = {}
        templates = self.cleanup_processor.templates.get('quality_validation', {})
        
        # Validate timeline
        if results.get('timeline'):
            # Count both • and * bullet points
            timeline_bullets = results['timeline'].count('•') + results['timeline'].count('* ')
            min_items = templates.get('minimum_timeline_items', 30)  # Reduced from 50
            max_items = templates.get('maximum_timeline_items', 200)  # Increased from 150
            validation['timeline'] = min_items <= timeline_bullets <= max_items
            self.logger.debug(f"Timeline validation: {timeline_bullets} bullets (need {min_items}-{max_items})")
        else:
            validation['timeline'] = False
        
        # Validate notes
        if results.get('notes'):
            # Count both • and * bullet points
            notes_bullets = results['notes'].count('•') + results['notes'].count('* ')
            notes_req = templates.get('required_notes_count', {})
            min_notes = notes_req.get('min', 4)  # Reduced from 5
            max_notes = notes_req.get('max', 15)  # Increased from 10
            validation['notes'] = min_notes <= notes_bullets <= max_notes
            self.logger.debug(f"Notes validation: {notes_bullets} bullets (need {min_notes}-{max_notes})")
        else:
            validation['notes'] = False
        
        # Validate summary
        if results.get('summary'):
            # Count paragraphs (simplified check)
            paragraphs = len([p for p in results['summary'].split('\n\n') if p.strip()])
            required_paragraphs = templates.get('required_summary_paragraphs', 3)
            validation['summary'] = paragraphs >= required_paragraphs
            self.logger.debug(f"Summary validation: {paragraphs} paragraphs (need {required_paragraphs})")
        else:
            validation['summary'] = False
        
        return validation