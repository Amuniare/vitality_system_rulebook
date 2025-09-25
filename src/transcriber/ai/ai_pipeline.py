"""
AI Processing Pipeline - Stage 3 of the transcriber architecture
Handles all AI-dependent processing tasks with rate limiting and chunking support
"""
from typing import Dict, List, Optional, Callable
import logging
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from ai.template_manager import TemplateManager
from ai.api_client import APIClient
from core.chunking_engine import SessionChunker


class AIProcessor:
    """Base class for individual AI processing stages"""
    
    def __init__(self, processor_name: str, template_manager: TemplateManager, api_client: APIClient):
        self.processor_name = processor_name
        self.template_manager = template_manager
        self.api_client = api_client
        self.logger = logging.getLogger(__name__)
    
    def process(self, content: str, session_number: int, **context) -> Optional[str]:
        """Process content through AI with proper templating"""
        self.logger.info(f"Starting {self.processor_name} processing for session {session_number}")
        
        # Format prompt using template manager
        prompt = self.template_manager.format_prompt(
            self.processor_name,
            session_number=session_number,
            **context
        )
        
        if not prompt:
            self.logger.error(f"Failed to format prompt for {self.processor_name}")
            return None
        
        # Get system prompt
        system_prompt = self.template_manager.get_system_prompt(self.processor_name)
        
        # Make API request
        result = self.api_client.make_request(prompt, system_prompt or "")
        
        if result:
            self.logger.info(f"{self.processor_name} processing completed for session {session_number}")
        else:
            self.logger.error(f"{self.processor_name} processing failed for session {session_number}")
        
        return result


class CleanupProcessor(AIProcessor):
    """AI processor for cleaning raw transcripts with chunking support"""
    
    def __init__(self, template_manager: TemplateManager, api_client: APIClient):
        super().__init__('cleanup_processor', template_manager, api_client)
        self.chunker = SessionChunker(max_chunk_size=8000, overlap_size=200)
    
    def process(self, raw_transcript: str, session_number: int, **context) -> Optional[str]:
        """Process raw transcript with intelligent chunking for large sessions"""
        
        # Check if chunking is needed
        if self.chunker.should_chunk_session(raw_transcript):
            self.logger.info(f"Large session detected, using chunking strategy for session {session_number}")
            return self._process_large_session(raw_transcript, session_number, **context)
        else:
            # Process as single session
            return self._process_single_session(raw_transcript, session_number, **context)
    
    def _process_single_session(self, raw_transcript: str, session_number: int, **context) -> Optional[str]:
        """Process session as single unit"""
        return super().process(raw_transcript, session_number, raw_transcript=raw_transcript, **context)
    
    def _process_large_session(self, raw_transcript: str, session_number: int, **context) -> Optional[str]:
        """Process large session using chunking strategy"""
        try:
            # Generate chunks
            chunks = self.chunker.chunk_session_intelligently(raw_transcript, session_number)
            
            # Validate chunks
            validation = self.chunker.validate_chunks_before_processing(chunks)
            if not validation['valid']:
                self.logger.error(f"Chunk validation failed: {validation['issues']}")
                # Continue but log warnings
                for issue in validation['issues']:
                    self.logger.warning(f"Chunk validation issue: {issue}")
            
            # Process each chunk
            processed_chunks = []
            failed_chunks = []
            
            for i, chunk in enumerate(chunks, 1):
                self.logger.info(f"Processing chunk {i}/{len(chunks)} (words: {len(chunk['content'].split())})")
                
                try:
                    chunk_result = self._process_single_session(
                        chunk['content'], session_number, **context
                    )
                    
                    if chunk_result:
                        processed_chunks.append(chunk_result)
                        self.logger.info(f"Successfully processed chunk {i}")
                    else:
                        failed_chunks.append(i)
                        self.logger.warning(f"Chunk {i} processing returned no result")
                        
                except Exception as e:
                    failed_chunks.append(i)
                    error_str = str(e)
                    self.logger.error(f"Failed to process chunk {i}: {e}")
                    
                    # Check if it's a quota error that should pause processing
                    if "quota" in error_str.lower() or "429" in error_str:
                        self.logger.warning("Quota exceeded during chunk processing, stopping")
                        break
            
            # Report processing results
            success_rate = len(processed_chunks) / len(chunks) * 100
            self.logger.info(f"Chunk processing complete: {len(processed_chunks)}/{len(chunks)} successful ({success_rate:.1f}%)")
            
            if failed_chunks:
                self.logger.warning(f"Failed chunks: {failed_chunks}")
            
            if processed_chunks:
                # Stitch chunks back together
                merged_result = self.chunker.stitch_chunks_together(processed_chunks)
                
                # Validate final result
                completeness = self.chunker.validate_chunk_completeness(raw_transcript, merged_result)
                
                if completeness['quality_acceptable']:
                    self.logger.info(f"Chunking quality validation passed: {completeness['word_retention']:.1%} word retention")
                else:
                    self.logger.warning(f"Chunking quality concerns: {completeness['warnings']}")
                
                return merged_result
            else:
                self.logger.error("No chunks were successfully processed")
                return None
                
        except Exception as e:
            self.logger.error(f"Large session processing failed: {e}")
            return None


class TimelineProcessor(AIProcessor):
    """AI processor for creating detailed timelines"""
    
    def __init__(self, template_manager: TemplateManager, api_client: APIClient):
        super().__init__('timeline_processor', template_manager, api_client)
    
    def process(self, cleaned_transcript: str, session_number: int, **context) -> Optional[str]:
        return super().process(cleaned_transcript, session_number, cleaned_transcript=cleaned_transcript, **context)


class NotesProcessor(AIProcessor):
    """AI processor for creating concise bullet-point notes"""
    
    def __init__(self, template_manager: TemplateManager, api_client: APIClient):
        super().__init__('notes_processor', template_manager, api_client)
    
    def process(self, detailed_timeline: str, session_number: int, **context) -> Optional[str]:
        return super().process(detailed_timeline, session_number, detailed_timeline=detailed_timeline, **context)


class SummaryProcessor(AIProcessor):
    """AI processor for creating narrative summaries"""
    
    def __init__(self, template_manager: TemplateManager, api_client: APIClient):
        super().__init__('summary_processor', template_manager, api_client)
    
    def process(self, notes: str, timeline: str, session_number: int, **context) -> Optional[str]:
        return super().process(
            notes, session_number, 
            session_notes=notes, 
            detailed_timeline=timeline, 
            **context
        )


class AIPipeline:
    """Main AI processing pipeline coordinator"""
    
    def __init__(self, config_path: str = ".", campaign_name: str = "rogue_trader", 
                 api_key: Optional[str] = None, progress_callback: Optional[Callable] = None,
                 enable_queue: bool = True):
        self.logger = logging.getLogger(__name__)
        self.config_path = Path(config_path)
        self.campaign_name = campaign_name
        self.progress_callback = progress_callback
        
        # Initialize components
        try:
            self.logger.info("Initializing AI Pipeline components...")
            
            self.template_manager = TemplateManager(config_path, campaign_name)
            # Pass cache directory to API client for intelligent caching
            cache_dir = self.config_path / 'cache'
            # Start with fastest model for initial processing
            self.api_client = APIClient(api_key, model_name='gemini-1.5-flash', cache_dir=cache_dir)
            
            # Initialize processors
            self.cleanup_processor = CleanupProcessor(self.template_manager, self.api_client)
            self.timeline_processor = TimelineProcessor(self.template_manager, self.api_client)
            self.notes_processor = NotesProcessor(self.template_manager, self.api_client)
            self.summary_processor = SummaryProcessor(self.template_manager, self.api_client)
            
            self.logger.info("AI Pipeline initialization completed successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize AI Pipeline: {e}")
            raise
    
    def process_session(self, session_data: Dict, stages: List[str] = None) -> Dict[str, Optional[str]]:
        """Process a session through specified AI stages"""
        
        if stages is None:
            stages = ['cleanup', 'timeline', 'notes', 'summary']
        
        session_number = session_data['session_number']
        results = {}
        
        self.logger.info(f"Starting AI processing for session {session_number} with stages: {', '.join(stages)}")
        
        # Estimate processing time
        total_stages = len(stages)
        estimated_time = self.api_client.estimate_processing_time(total_stages)
        self.logger.info(f"Estimated processing time: {estimated_time/60:.1f} minutes")
        
        # Progress tracking
        current_stage = 0
        
        try:
            # Stage 1: Cleanup (always required as input for other stages)
            if 'cleanup' in stages:
                current_stage += 1
                self._report_progress(current_stage, total_stages, "cleanup")
                
                cleaned = self.cleanup_processor.process(
                    session_data['cleaned_content'],
                    session_number,
                    character_info=session_data.get('speaker_mapping', ''),
                    previous_session_summary=session_data.get('previous_session_summary', '')
                )
                results['cleaned'] = cleaned
            else:
                # Use existing cleaned content
                cleaned = session_data.get('cleaned_content')
                results['cleaned'] = None
            
            # Stage 2: Timeline
            if 'timeline' in stages and cleaned:
                current_stage += 1
                self._report_progress(current_stage, total_stages, "timeline")
                
                timeline = self.timeline_processor.process(
                    cleaned, 
                    session_number,
                    character_info=session_data.get('speaker_mapping', '')
                )
                results['timeline'] = timeline
            else:
                timeline = None
                results['timeline'] = None
            
            # Stage 3: Notes
            if 'notes' in stages and timeline:
                current_stage += 1
                self._report_progress(current_stage, total_stages, "notes")
                
                notes = self.notes_processor.process(
                    timeline, 
                    session_number,
                    character_info=session_data.get('speaker_mapping', '')
                )
                results['notes'] = notes
            else:
                notes = None
                results['notes'] = None
            
            # Stage 4: Summary
            if 'summary' in stages and notes and timeline:
                current_stage += 1
                self._report_progress(current_stage, total_stages, "summary")
                
                summary = self.summary_processor.process(
                    notes, 
                    timeline, 
                    session_number,
                    character_info=session_data.get('speaker_mapping', '')
                )
                results['summary'] = summary
            else:
                results['summary'] = None
            
            self.logger.info(f"AI processing completed for session {session_number}")
            
        except Exception as e:
            self.logger.error(f"AI processing failed for session {session_number}: {e}")
            # Fill remaining results with None
            for stage in stages:
                if stage not in results:
                    results[stage] = None
        
        return results
    
    def _report_progress(self, current: int, total: int, stage_name: str):
        """Report processing progress"""
        progress = (current / total) * 100
        self.logger.info(f"AI Progress: {progress:.1f}% - Starting {stage_name} processing")
        
        if self.progress_callback:
            self.progress_callback(progress, f"AI Processing: {stage_name}")
    
    def validate_results(self, results: Dict[str, Optional[str]]) -> Dict[str, bool]:
        """Validate AI processing results for quality and completeness"""
        validation = {}
        
        for stage, content in results.items():
            if content is None:
                validation[stage] = False
                continue
            
            # Basic validation checks
            words = len(content.split())
            lines = len(content.split('\n'))
            
            if stage == 'cleaned':
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
    
    def test_api_connection(self) -> bool:
        """Test API connection"""
        return self.api_client.test_connection()
    
    def get_rate_limit_status(self) -> Dict:
        """Get current rate limiting status"""
        return self.api_client.get_rate_limit_status()