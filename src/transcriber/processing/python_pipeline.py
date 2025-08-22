"""
Python-only processing pipeline - Stage 2 of the transcriber architecture
Handles deterministic processing tasks without AI dependencies
"""
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import logging

# Import modules when needed to avoid dependency issues
import sys
from pathlib import Path

# Add parent directory to path for relative imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from processing.speaker_mapper import CharacterMapper
from processing.content_analyzer import ContentAnalyzer


class PythonPipeline:
    """Coordinates all Python-only processing tasks before AI stage"""
    
    def __init__(self, config_path: str = ".", campaign_name: str = "rogue_trader"):
        self.logger = logging.getLogger(__name__)
        self.config_path = Path(config_path)
        self.campaign_name = campaign_name
        
        # Initialize components (lazy-load core components to avoid dependencies)
        self._text_processor = None
        self.character_mapper = CharacterMapper(campaign_name)
        self.content_analyzer = ContentAnalyzer()
        self._chunker = None
        
        self.logger.info(f"Initialized Python pipeline for campaign: {campaign_name}")
    
    @property
    def text_processor(self):
        """Lazy-load text processor to avoid import dependencies"""
        if self._text_processor is None:
            from core.text_processor import TextProcessor
            self._text_processor = TextProcessor()
        return self._text_processor
    
    @property
    def chunker(self):
        """Lazy-load chunker to avoid import dependencies"""
        if self._chunker is None:
            from core.chunking_engine import SessionChunker
            self._chunker = SessionChunker()
        return self._chunker
    
    def process_raw_session(self, raw_content: str, session_number: int) -> Dict:
        """Complete Python processing of a raw session"""
        self.logger.info(f"Starting Python processing for session {session_number}")
        
        results = {
            'session_number': session_number,
            'original_content': raw_content,
            'processing_stages': [],
            'metrics': {},
            'warnings': [],
            'ready_for_ai': False
        }
        
        try:
            # Stage 1: Text cleaning and artifact removal
            self.logger.info("Stage 1: Text cleaning and Discord artifact removal")
            cleaned_content = self.text_processor.clean_transcript_content(raw_content)
            
            # Get initial metrics
            raw_metrics = self.text_processor.get_text_metrics(raw_content)
            cleaned_metrics = self.text_processor.get_text_metrics(cleaned_content)
            
            results['cleaned_content'] = cleaned_content
            results['processing_stages'].append('text_cleaning')
            results['metrics']['raw'] = raw_metrics
            results['metrics']['cleaned'] = cleaned_metrics
            
            # Stage 2: Speaker detection and mapping
            self.logger.info("Stage 2: Speaker detection and character mapping")
            detected_speakers = self.character_mapper.detect_speakers_in_text(cleaned_content)
            speaker_mapping_info = self.character_mapper.generate_speaker_mapping_text(detected_speakers)
            
            # Stage 2b: Replace speaker names in content
            self.logger.info("Stage 2b: Replacing Discord usernames with canonical names")
            cleaned_content = self._replace_speaker_names(cleaned_content, detected_speakers)
            results['cleaned_content'] = cleaned_content  # Update with name-replaced content
            
            results['detected_speakers'] = detected_speakers
            results['speaker_mapping'] = speaker_mapping_info
            results['processing_stages'].append('speaker_mapping')
            
            # Stage 3: Content analysis and validation
            self.logger.info("Stage 3: Content quality analysis")
            content_analysis = self.content_analyzer.analyze_session_content(raw_content, cleaned_content)
            speaker_validation = self.content_analyzer.validate_speaker_preservation(raw_content, cleaned_content)
            content_loss_patterns = self.content_analyzer.detect_content_loss_patterns(raw_content, cleaned_content)
            
            results['content_analysis'] = content_analysis
            results['speaker_validation'] = speaker_validation
            results['content_loss_patterns'] = content_loss_patterns
            results['processing_stages'].append('content_analysis')
            
            # Stage 4: Chunking assessment (if needed)
            self.logger.info("Stage 4: Chunking assessment")
            needs_chunking = self.chunker.should_chunk_session(cleaned_content)
            results['needs_chunking'] = needs_chunking
            
            if needs_chunking:
                self.logger.info("Session requires chunking for AI processing")
                # Generate chunking metadata without actual chunking
                word_count = len(cleaned_content.split())
                estimated_chunks = max(1, word_count // self.chunker.max_chunk_size)
                
                results['chunking_info'] = {
                    'word_count': word_count,
                    'estimated_chunks': estimated_chunks,
                    'max_chunk_size': self.chunker.max_chunk_size,
                    'overlap_size': self.chunker.overlap_size
                }
                results['processing_stages'].append('chunking_assessment')
            
            # Stage 5: Quality validation and readiness check
            self.logger.info("Stage 5: Final validation")
            validation_results = self._validate_processing_quality(results)
            results.update(validation_results)
            results['processing_stages'].append('final_validation')
            
            # Final assessment
            results['ready_for_ai'] = self._assess_ai_readiness(results)
            
            self.logger.info(f"Python processing completed for session {session_number}")
            self.logger.info(f"Ready for AI: {results['ready_for_ai']}")
            
        except Exception as e:
            self.logger.error(f"Python processing failed for session {session_number}: {e}")
            results['error'] = str(e)
            results['ready_for_ai'] = False
        
        return results
    
    def _validate_processing_quality(self, results: Dict) -> Dict:
        """Validate the quality of Python processing results"""
        validation = {
            'quality_score': 0.0,
            'quality_issues': [],
            'quality_warnings': []
        }
        
        self.logger.debug(f"Starting quality validation for session {results.get('session_number')}")
        
        # Check content retention
        if 'content_analysis' in results:
            retention = results['content_analysis']['retention_rates']
            word_retention = retention['words']
            speaker_retention = retention['speakers']
            
            self.logger.debug(f"Word retention: {word_retention:.1f}%, Speaker retention: {speaker_retention:.1f}%")
            
            if word_retention < 50:
                validation['quality_issues'].append(f"Poor word retention: {word_retention:.1f}%")
            elif word_retention < 70:
                validation['quality_warnings'].append(f"Low word retention: {word_retention:.1f}%")
            
            if speaker_retention < 60:
                validation['quality_issues'].append(f"Poor speaker retention: {speaker_retention:.1f}%")
            elif speaker_retention < 80:
                validation['quality_warnings'].append(f"Low speaker retention: {speaker_retention:.1f}%")
            
            # Calculate quality score (0-100)
            validation['quality_score'] = (word_retention * 0.6 + speaker_retention * 0.4)
            self.logger.debug(f"Calculated quality score: {validation['quality_score']:.1f}")
        else:
            self.logger.warning("No content_analysis found in results - setting default quality score")
            validation['quality_score'] = 100.0  # Default to high score if analysis is missing
        
        # Check for unmapped speakers
        if 'detected_speakers' in results:
            unmapped_speakers = [s for s in results['detected_speakers'] if not s['mapped']]
            if unmapped_speakers:
                unmapped_names = [s['discord_name'] for s in unmapped_speakers]
                validation['quality_warnings'].append(f"Unmapped speakers: {', '.join(unmapped_names)}")
                self.logger.debug(f"Found {len(unmapped_speakers)} unmapped speakers: {unmapped_names}")
        
        self.logger.debug(f"Quality validation complete: score={validation['quality_score']:.1f}, issues={len(validation['quality_issues'])}, warnings={len(validation['quality_warnings'])}")
        return validation
    
    def _assess_ai_readiness(self, results: Dict) -> bool:
        """Assess if the session is ready for AI processing"""
        session_num = results.get('session_number', 'unknown')
        self.logger.debug(f"Assessing AI readiness for session {session_num}")
        
        # Must have completed all processing stages
        required_stages = ['text_cleaning', 'speaker_mapping', 'content_analysis', 'final_validation']
        completed_stages = results.get('processing_stages', [])
        
        self.logger.debug(f"Required stages: {required_stages}")
        self.logger.debug(f"Completed stages: {completed_stages}")
        
        missing_stages = [stage for stage in required_stages if stage not in completed_stages]
        if missing_stages:
            self.logger.warning(f"Missing required processing stages: {missing_stages}")
            return False
        
        # Must have cleaned content
        cleaned_content = results.get('cleaned_content')
        if not cleaned_content:
            self.logger.warning("No cleaned content available")
            return False
        
        self.logger.debug(f"Cleaned content length: {len(cleaned_content)} characters")
        
        # Quality score must be acceptable
        quality_score = results.get('quality_score', 0)
        self.logger.debug(f"Quality score from results: {quality_score}")
        
        if quality_score < 30:  # Very lenient threshold
            self.logger.warning(f"Quality score too low: {quality_score}")
            return False
        
        # Must not have critical quality issues
        quality_issues = results.get('quality_issues', [])
        if quality_issues:
            self.logger.warning(f"Critical quality issues present: {quality_issues}")
            return False
        
        self.logger.info(f"Session {session_num} is ready for AI processing")
        return True
    
    def prepare_for_ai_processing(self, results: Dict) -> Dict:
        """Prepare processed session data for AI pipeline"""
        if not results.get('ready_for_ai', False):
            raise ValueError("Session not ready for AI processing")
        
        ai_ready_data = {
            'session_number': results['session_number'],
            'cleaned_content': results['cleaned_content'],
            'speaker_mapping': results['speaker_mapping'],
            'detected_speakers': results['detected_speakers'],
            'needs_chunking': results.get('needs_chunking', False),
            'chunking_info': results.get('chunking_info'),
            'quality_score': results.get('quality_score', 0),
            'quality_warnings': results.get('quality_warnings', []),
            'processing_metadata': {
                'stages_completed': results['processing_stages'],
                'word_count': len(results['cleaned_content'].split()),
                'speaker_count': len(results.get('detected_speakers', [])),
                'campaign_name': self.campaign_name
            }
        }
        
        self.logger.info(f"Session {results['session_number']} prepared for AI processing")
        return ai_ready_data
    
    def generate_processing_report(self, results: Dict) -> str:
        """Generate a human-readable processing report"""
        session_num = results['session_number']
        report = f"\n=== PYTHON PROCESSING REPORT: Session {session_num} ===\n"
        
        # Processing stages
        stages = results.get('processing_stages', [])
        report += f"Completed Stages: {', '.join(stages)}\n"
        
        # Metrics
        if 'metrics' in results:
            raw = results['metrics']['raw']
            cleaned = results['metrics']['cleaned']
            report += f"Content: {raw['total_words']} → {cleaned['total_words']} words\n"
            report += f"Speakers: {raw['unique_speakers']} → {cleaned['unique_speakers']} detected\n"
        
        # Quality
        quality_score = results.get('quality_score', 0)
        report += f"Quality Score: {quality_score:.1f}/100\n"
        
        # Warnings and issues
        if results.get('quality_warnings'):
            report += f"Warnings: {', '.join(results['quality_warnings'])}\n"
        if results.get('quality_issues'):
            report += f"Issues: {', '.join(results['quality_issues'])}\n"
        
        # AI readiness
        ready = results.get('ready_for_ai', False)
        report += f"AI Ready: {'✅ Yes' if ready else '❌ No'}\n"
        
        return report
    
    def _replace_speaker_names(self, content: str, detected_speakers: List[Dict]) -> str:
        """Replace Discord usernames with canonical character names in content"""
        import re
        
        modified_content = content
        replacements_made = 0
        
        # Process each detected speaker
        for speaker in detected_speakers:
            if speaker['mapped']:
                discord_name = speaker['discord_name']
                
                # Get canonical name from character mapper
                char_info = self.character_mapper.map_discord_to_character(discord_name)
                if char_info and 'canonical_name' in char_info:
                    canonical_name = char_info['canonical_name']
                    
                    # Find all speaker occurrences in content (case-insensitive)
                    # Pattern: start of line, speaker name, colon
                    pattern = rf'^({re.escape(discord_name)}):(.*)$'
                    
                    lines = modified_content.split('\n')
                    for i, line in enumerate(lines):
                        match = re.match(pattern, line.strip(), re.IGNORECASE)
                        if match:
                            rest_of_line = match.group(2)
                            lines[i] = line.replace(match.group(0), f"{canonical_name}:{rest_of_line}")
                            replacements_made += 1
                            self.logger.debug(f"Replaced '{match.group(1)}:' with '{canonical_name}:'")
                    
                    modified_content = '\n'.join(lines)
        
        self.logger.info(f"Made {replacements_made} speaker name replacements")
        return modified_content