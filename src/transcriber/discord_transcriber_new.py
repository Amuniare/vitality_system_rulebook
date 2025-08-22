"""
Enhanced Discord Session Transcriber with modular architecture
Main entry point for the 3-stage transcriber system
"""
import argparse
import asyncio
import logging
from pathlib import Path
import time
from typing import List, Dict, Optional

# Import only modules without heavy dependencies at startup
import sys
from pathlib import Path

try:
    from .core.session_loader import SessionLoader
    from .core.text_processor import TextProcessor
    from .utils.file_utils import FileManager
    from .utils.logging_utils import TranscriberLogger
except ImportError:
    from core.session_loader import SessionLoader
    from core.text_processor import TextProcessor
    from utils.file_utils import FileManager
    from utils.logging_utils import TranscriberLogger

# Add the parent directory to sys.path for imports
sys.path.insert(0, str(Path(__file__).parent))

from processing.python_pipeline import PythonPipeline


class ModularTranscriber:
    """Main transcriber coordinator using modular architecture"""
    
    def __init__(self, config_path: str = "."):
        self.config_path = Path(config_path)
        
        # Set up logging first
        self._setup_logging()
        self.logger = logging.getLogger('ModularTranscriber')
        
        # Lazy-load heavy components
        self._config = None
        self._session_loader = None
        self._text_processor = None
        self._file_manager = None
        self._ai_pipeline = None
        
        # Initialize lightweight components
        self.python_pipeline = PythonPipeline(str(self.config_path), "rogue_trader")
        
        print("Modular transcriber initialized successfully")
    
    @property
    def config(self):
        """Lazy-load configuration manager"""
        if self._config is None:
            from utils.config_manager import ConfigManager
            self._config = ConfigManager(self.config_path)
        return self._config
    
    @property
    def session_loader(self):
        """Lazy-load session loader"""
        if self._session_loader is None:
            from core.session_loader import SessionLoader
            discord_config = self.config.get_discord_config()
            self._session_loader = SessionLoader(
                token=discord_config['token'],
                channel_id=discord_config['channel_id'],
                data_dir=self.data_dir,
                session_gap_hours=discord_config['session_gap_hours']
            )
        return self._session_loader
    
    @property
    def text_processor(self):
        """Lazy-load text processor"""
        if self._text_processor is None:
            from core.text_processor import TextProcessor
            self._text_processor = TextProcessor()
        return self._text_processor
    
    @property
    def file_manager(self):
        """Lazy-load file manager"""
        if self._file_manager is None:
            from utils.file_utils import FileManager
            self._file_manager = FileManager(self.data_dir)
        return self._file_manager
    
    @property
    def ai_pipeline(self):
        """Lazy-load AI pipeline"""
        if self._ai_pipeline is None:
            from ai.ai_pipeline import AIPipeline
            self._ai_pipeline = AIPipeline(str(self.config_path), "rogue_trader")
        return self._ai_pipeline
    
    @property
    def data_dir(self):
        """Get data directory"""
        return self.config_path / 'all_data' / 'rogue_trader'
    
    def _setup_logging(self):
        """Set up logging system"""
        # Use info level for normal output
        log_level = logging.INFO
        log_file = self.config_path / 'logs' / 'transcriber.log'
        
        TranscriberLogger.setup_logging(
            level=log_level,
            log_file=log_file,
            console_output=True
        )
    
    def _setup_data_directories(self):
        """Set up data directory structure"""
        self.directories = self.config.setup_data_directories(self.config_path)
        self.data_dir = self.directories['raw'].parent.parent
        
        # Create log directory
        log_dir = self.data_dir / 'logs'
        log_dir.mkdir(exist_ok=True)
        
        self.logger.info(f"Data directories set up in: {self.data_dir}")
    
    def _initialize_components(self):
        """Initialize all system components"""
        try:
            # Get configuration
            discord_config = self.config.get_discord_config()
            
            # Initialize core components
            self.session_loader = SessionLoader(
                token=discord_config['token'],
                channel_id=discord_config['channel_id'],
                data_dir=self.data_dir,
                session_gap_hours=discord_config['session_gap_hours']
            )
            
            self.text_processor = TextProcessor()
            self.file_manager = FileManager(self.data_dir)
            
            # Initialize processing pipeline
            self.python_pipeline = PythonPipeline(
                str(self.config_path),
                self.config.get('files.campaign_name')
            )
            
            # Initialize AI pipeline (lazy loading)
            self._ai_pipeline = None
            
            self.logger.info("All components initialized successfully")
            
        except Exception as e:
            self.logger.error(f"Component initialization failed: {e}")
            raise
    
    @property
    def ai_pipeline(self):
        """Lazy-loaded AI pipeline"""
        if self._ai_pipeline is None:
            try:
                from ai.ai_pipeline import AIPipeline
                ai_config = self.config.get_ai_config()
                self._ai_pipeline = AIPipeline(
                    str(self.config_path),
                    self.config.get('files.campaign_name'),
                    ai_config['api_key']
                )
                self.logger.info("AI pipeline initialized")
            except Exception as e:
                self.logger.error(f"AI pipeline initialization failed: {e}")
                raise
        
        return self._ai_pipeline
    
    async def transcribe_sessions(self, historical: bool = False) -> List[int]:
        """Transcribe sessions from Discord (Stage 1)"""
        self.logger.info("Starting session transcription from Discord")
        
        
        try:
            self.session_loader.setup_directories()
            
            # Establish Discord connection first
            self.logger.info("Establishing Discord connection...")
            connected = await self.session_loader.connect_to_discord(timeout=30)
            
            if not connected:
                self.logger.error("Failed to connect to Discord - aborting transcription")
                return []
            
            if historical:
                self.logger.info("Importing all historical sessions...")
                sessions = await self._import_all_sessions()
            else:
                self.logger.info("Checking for new sessions...")
                sessions = await self._transcribe_new_sessions()
            
            if sessions:
                self.logger.info(f"Transcribed {len(sessions)} sessions: {sessions}")
            else:
                self.logger.info("No sessions to transcribe")
            
            return sessions
            
        except Exception as e:
            self.logger.error(f"Session transcription failed: {e}")
            return []
        finally:
            await self.session_loader.close_discord_connection()
    
    async def _import_all_sessions(self) -> List[int]:
        """Import all historical sessions"""
        self.logger.info("Starting import of all historical sessions...")
        
        try:
            # Add timeout for message fetching (10 minutes)
            messages = await asyncio.wait_for(
                self.session_loader.fetch_messages_from_discord(
                    include_bots=getattr(self, '_include_bots', False),
                    debug_authors=getattr(self, '_debug_authors', False)
                ), 
                timeout=600.0
            )
            self.logger.info(f"Successfully fetched {len(messages)} messages from Discord")
        except asyncio.TimeoutError:
            self.logger.error("Message fetching timed out after 10 minutes")
            return []
        except Exception as e:
            self.logger.error(f"Error fetching messages: {e}")
            return []
            
        if not messages:
            self.logger.info("No messages found to import")
            return []
        
        self.logger.info("Grouping messages into sessions...")
        sessions = self.session_loader.group_messages_into_sessions(messages)
        self.logger.info(f"Found {len(sessions)} sessions to save: {list(sessions.keys())}")
        
        saved_sessions = []
        
        for session_num, session_messages in sessions.items():
            self.logger.info(f"Processing session {session_num} with {len(session_messages)} messages...")
            transcript = self.text_processor.format_session_transcript(session_messages)
            self.logger.info(f"Generated transcript for session {session_num}: {len(transcript)} characters")
            
            if self.session_loader.save_raw_session(session_num, transcript):
                saved_sessions.append(session_num)
                self.logger.info(f"✅ Successfully saved session {session_num}")
            else:
                self.logger.error(f"❌ Failed to save session {session_num}")
        
        self.logger.info(f"Import complete! Saved {len(saved_sessions)} sessions: {saved_sessions}")
        return saved_sessions
    
    async def _transcribe_new_sessions(self) -> List[int]:
        """Transcribe new sessions only"""
        tracker = self.session_loader.load_session_tracker()
        last_timestamp = tracker.get("last_message_timestamp")
        
        since_timestamp = None
        if last_timestamp:
            from datetime import datetime
            try:
                since_timestamp = datetime.fromisoformat(last_timestamp.replace('Z', '+00:00'))
                self.logger.info(f"Looking for Discord messages after: {since_timestamp}")
            except ValueError:
                since_timestamp = None
                self.logger.warning(f"Failed to parse last timestamp: {last_timestamp}")
        else:
            self.logger.info("No previous timestamp found - looking for all messages")
        
        messages = await self.session_loader.fetch_messages_from_discord(
            since_timestamp,
            include_bots=getattr(self, '_include_bots', False),
            debug_authors=getattr(self, '_debug_authors', False)
        )
        self.logger.info(f"Found {len(messages)} new messages from Discord")
        if not messages:
            return []
        
        sessions = self.session_loader.group_messages_into_sessions(messages)
        saved_sessions = []
        
        for session_num, session_messages in sessions.items():
            transcript = self.text_processor.format_session_transcript(session_messages)
            if self.session_loader.save_raw_session(session_num, transcript):
                saved_sessions.append(session_num)
        
        return saved_sessions
    
    def process_python_stages(self, session_numbers: List[int]) -> Dict[int, Dict]:
        """Process sessions through Python-only stages (Stage 2)"""
        self.logger.info(f"Starting Python processing for {len(session_numbers)} sessions")
        
        results = {}
        
        for session_number in session_numbers:
            self.logger.info(f"Processing session {session_number} through Python pipeline")
            
            # Load raw session content
            raw_content = self.session_loader.load_raw_session(session_number)
            if not raw_content:
                self.logger.error(f"Failed to load raw session {session_number}")
                results[session_number] = {'error': 'Failed to load raw session'}
                continue
            
            # Process through Python pipeline
            try:
                python_results = self.python_pipeline.process_raw_session(raw_content, session_number)
                results[session_number] = python_results
                
                # Save Python processing results
                self._save_python_results(session_number, python_results)
                
                # Generate and log processing report
                report = self.python_pipeline.generate_processing_report(python_results)
                self.logger.info(report)
                
            except Exception as e:
                self.logger.error(f"Python processing failed for session {session_number}: {e}")
                results[session_number] = {'error': str(e)}
        
        return results
    
    def process_ai_stages(self, python_results: Dict[int, Dict], stages: List[str]) -> Dict[int, Dict]:
        """Process sessions through AI stages (Stage 3)"""
        self.logger.info(f"Starting AI processing for {len(python_results)} sessions with stages: {', '.join(stages)}")
        
        ai_results = {}
        
        for session_number, python_result in python_results.items():
            if not python_result.get('ready_for_ai', False):
                self.logger.warning(f"Session {session_number} not ready for AI processing")
                ai_results[session_number] = {'error': 'Session not ready for AI processing'}
                continue
            
            try:
                # Prepare session data for AI
                session_data = self.python_pipeline.prepare_for_ai_processing(python_result)
                
                # Process through AI pipeline
                stage_results = self.ai_pipeline.process_session(session_data, stages)
                
                # Validate results
                validation = self.ai_pipeline.validate_results(stage_results)
                
                ai_results[session_number] = {
                    'stages': stage_results,
                    'validation': validation
                }
                
                # Save results to files
                self._save_ai_results(session_number, stage_results, stages)
                
            except Exception as e:
                self.logger.error(f"AI processing failed for session {session_number}: {e}")
                ai_results[session_number] = {'error': str(e)}
        
        return ai_results
    
    def _save_python_results(self, session_number: int, results: Dict):
        """Save Python processing results to files"""
        try:
            # Save cleaned content if available
            if results.get('cleaned_content') and results.get('ready_for_ai', False):
                success = self.file_manager.save_session_result(
                    session_number, 'cleaned', results['cleaned_content']
                )
                
                if success:
                    self.logger.info(f"✅ Saved cleaned content for session {session_number}")
                else:
                    self.logger.error(f"❌ Failed to save cleaned content for session {session_number}")
            else:
                if not results.get('cleaned_content'):
                    self.logger.warning(f"No cleaned content to save for session {session_number}")
                if not results.get('ready_for_ai', False):
                    self.logger.warning(f"Session {session_number} not ready for AI - not saving cleaned content")
                
        except Exception as e:
            self.logger.error(f"Error saving Python results for session {session_number}: {e}")
    
    def _save_ai_results(self, session_number: int, results: Dict[str, str], stages: List[str]):
        """Save AI processing results to files"""
        stage_mapping = {
            'cleanup': 'cleaned',
            'timeline': 'timeline',
            'notes': 'notes', 
            'summary': 'summary'
        }
        
        for stage in stages:
            if stage in results and results[stage]:
                file_stage = stage_mapping.get(stage, stage)
                success = self.file_manager.save_session_result(
                    session_number, file_stage, results[stage]
                )
                
                if success:
                    self.logger.info(f"Saved {stage} for session {session_number}")
                else:
                    self.logger.error(f"Failed to save {stage} for session {session_number}")
    
    def run_test_mode(self, session_number: int):
        """Run test mode for manual verification of a specific session"""
        print(f"Running test mode for session {session_number}")
        
        try:
            # Check if required dependencies are available
            import google.generativeai as genai
            import discord
            
            # Full test mode with all dependencies
            from tests.test_utils import SessionTester
            tester = SessionTester(self.data_dir)
            tester.manual_verification_mode(session_number)
            
        except ImportError as e:
            print(f"Missing dependencies for full test mode: {e}")
            print("Running simplified test mode...")
            self._run_simplified_test_mode(session_number)
        except Exception as e:
            print(f"Test mode failed: {e}")
    
    def _run_simplified_test_mode(self, session_number: int):
        """Run simplified test mode without AI dependencies"""
        print(f"📝 Testing basic components for session {session_number}")
        
        # Test data directory structure
        sessions_dir = self.data_dir / "sessions" 
        raw_dir = sessions_dir / "raw"
        raw_file = raw_dir / f"session-{session_number:02d}-raw.txt"
        
        if not raw_file.exists():
            print(f"❌ Raw session file not found: {raw_file}")
            print(f"Expected location: {raw_file}")
            return
        
        print(f"✅ Found raw session file: {raw_file}")
        
        # Load and analyze the raw content
        try:
            with open(raw_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            lines = content.split('\n')
            words = content.split()
            
            print(f"📊 Session {session_number} statistics:")
            print(f"   - Lines: {len(lines)}")
            print(f"   - Words: {len(words)}")
            print(f"   - Characters: {len(content)}")
            
            # Test Python pipeline components
            try:
                pipeline = self.python_pipeline
                print(f"✅ PythonPipeline initialized successfully")
                
                # Test text processing
                text_processor = pipeline.text_processor
                print(f"✅ TextProcessor loaded successfully") 
                
                # Test content analyzer
                analyzer = pipeline.content_analyzer
                print(f"✅ ContentAnalyzer loaded successfully")
                
                print(f"✅ All Python components working correctly")
                
            except Exception as e:
                print(f"❌ Python pipeline test failed: {e}")
                
        except Exception as e:
            print(f"❌ Failed to read session file: {e}")
    
    def run_full_pipeline(self, session_numbers: Optional[List[int]] = None, 
                         stages: List[str] = None, skip_transcription: bool = False) -> Dict:
        """Run the complete 3-stage processing pipeline"""
        if stages is None:
            stages = ['cleanup', 'timeline', 'notes', 'summary']
        
        results = {
            'transcribed_sessions': [],
            'python_results': {},
            'ai_results': {},
            'summary': {}
        }
        
        try:
            # Stage 1: Transcription (if not skipped)
            if not skip_transcription:
                transcribed = asyncio.run(self.transcribe_sessions())
                results['transcribed_sessions'] = transcribed
            
            # Determine sessions to process
            if session_numbers is None:
                session_numbers = self.session_loader.get_available_raw_sessions()
            
            if not session_numbers:
                self.logger.warning("No sessions available for processing")
                return results
            
            # Stage 2: Python processing
            python_results = self.process_python_stages(session_numbers)
            results['python_results'] = python_results
            
            # Stage 3: AI processing (only for sessions ready for AI)
            ready_sessions = {
                k: v for k, v in python_results.items() 
                if v.get('ready_for_ai', False)
            }
            
            if ready_sessions:
                ai_results = self.process_ai_stages(ready_sessions, stages)
                results['ai_results'] = ai_results
            else:
                self.logger.warning("No sessions ready for AI processing")
            
            # Generate summary
            results['summary'] = self._generate_pipeline_summary(results)
            
        except Exception as e:
            self.logger.error(f"Full pipeline execution failed: {e}")
            results['error'] = str(e)
        
        return results
    
    def _generate_pipeline_summary(self, results: Dict) -> Dict:
        """Generate summary of pipeline execution"""
        summary = {
            'transcribed_count': len(results['transcribed_sessions']),
            'python_processed': len(results['python_results']),
            'ai_processed': len(results['ai_results']),
            'success_rate': 0.0
        }
        
        # Calculate success rates
        if summary['python_processed'] > 0:
            python_success = sum(1 for r in results['python_results'].values() 
                               if r.get('ready_for_ai', False))
            python_success_rate = (python_success / summary['python_processed']) * 100
            summary['python_success_rate'] = python_success_rate
        
        if summary['ai_processed'] > 0:
            ai_success = sum(1 for r in results['ai_results'].values() 
                           if 'stages' in r)
            ai_success_rate = (ai_success / summary['ai_processed']) * 100
            summary['ai_success_rate'] = ai_success_rate
        
        return summary


def parse_session_range(session_str: str) -> Optional[List[int]]:
    """Parse session range string like '1,3,5-8' or 'all' into list of integers"""
    if session_str.strip().lower() == "all":
        return None
    
    session_numbers = []
    
    for part in session_str.split(','):
        part = part.strip()
        if '-' in part:
            try:
                start, end = part.split('-', 1)
                start, end = int(start.strip()), int(end.strip())
                session_numbers.extend(range(start, end + 1))
            except ValueError:
                raise ValueError(f"Invalid range format: {part}")
        else:
            try:
                session_numbers.append(int(part))
            except ValueError:
                raise ValueError(f"Invalid session number: {part}")
    
    return sorted(list(set(session_numbers)))


def main():
    parser = argparse.ArgumentParser(description="Modular Discord Session Transcriber")
    
    # Transcription options
    parser.add_argument('--historical', action='store_true', help='Import all historical messages')
    parser.add_argument('--no-transcribe', action='store_true', help='Skip transcription stage')
    
    # Processing options
    parser.add_argument('--python-only', action='store_true', help='Run Python processing only')
    parser.add_argument('--ai-only', action='store_true', help='Run AI processing only')
    parser.add_argument('--stages', type=str, help='AI stages to run (cleanup,timeline,notes,summary)')
    parser.add_argument('--sessions', type=str, help='Specific sessions to process (e.g., "1,3,5-8" or "all")')
    
    # Configuration options
    parser.add_argument('--config', type=str, default='.', help='Configuration directory path')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    
    # Validation options
    parser.add_argument('--validate-config', action='store_true', help='Validate configuration only')
    parser.add_argument('--test-api', action='store_true', help='Test API connection only')
    parser.add_argument('--reset-tracker', action='store_true', help='Reset session tracker to force import of all messages')
    
    # Test mode options
    parser.add_argument('--test-mode', action='store_true', help='Run in test mode with manual verification')
    parser.add_argument('--test-session', type=int, help='Specific session number to test')
    parser.add_argument('--include-bots', action='store_true', help='Include bot/webhook messages (for debugging)')
    parser.add_argument('--debug-authors', action='store_true', help='Show detailed author information for first 20 messages')
    
    args = parser.parse_args()
    
    try:
        # Initialize transcriber
        transcriber = ModularTranscriber(args.config)
        
        # Default behaviors: debug on, include bots, show authors
        transcriber._include_bots = True  # Always include bot messages 
        transcriber._debug_authors = True  # Always show author info
        
        # Always enable debug mode
        from utils.logging_utils import set_debug_mode
        set_debug_mode(True)
        
        # Reset session tracker automatically if using --historical
        if args.historical:
            print("🔄 Auto-resetting session tracker for historical import...")
            tracker_file = transcriber.data_dir / "session_tracker.json"
            if tracker_file.exists():
                tracker_file.unlink()
                print(f"✅ Deleted {tracker_file}")
            else:
                print("ℹ️ No session tracker found to reset")
        
        # Configuration validation
        if args.validate_config:
            print("Validating configuration...")
            discord_valid = transcriber.config.validate_discord_config()
            ai_valid = transcriber.config.validate_ai_config()
            
            if discord_valid and ai_valid:
                print("✅ Configuration is valid")
                transcriber.config.print_config_summary()
            else:
                print("❌ Configuration has issues")
            return
        
        # API connection test
        if args.test_api:
            print("Testing AI API connection...")
            if transcriber.ai_pipeline.test_api_connection():
                print("✅ API connection successful")
            else:
                print("❌ API connection failed")
            return
        
        # Test mode
        if args.test_mode:
            if args.test_session:
                print(f"Running test mode for session {args.test_session}...")
                transcriber.run_test_mode(args.test_session)
            else:
                print("Please specify --test-session NUMBER for test mode")
            return
        
        # Determine stages to run
        stages = ['cleanup', 'timeline', 'notes', 'summary']
        if args.stages:
            stages = [s.strip() for s in args.stages.split(',')]
        
        # Parse session numbers
        session_numbers = None
        if args.sessions:
            try:
                session_numbers = parse_session_range(args.sessions)
            except ValueError as e:
                print(f"❌ Invalid session range: {e}")
                return
        
        # Execute pipeline based on arguments
        if args.python_only:
            # Python processing only
            if not session_numbers:
                session_numbers = transcriber.session_loader.get_available_raw_sessions()
            
            results = transcriber.process_python_stages(session_numbers)
            print(f"Python processing completed for {len(results)} sessions")
            
        elif args.ai_only:
            # AI processing only - load existing cleaned files
            if not session_numbers:
                session_numbers = transcriber.file_manager.list_available_sessions('cleaned')
            
            # Load cleaned content for each session
            ready_sessions = {}
            for session_num in session_numbers:
                cleaned_content = transcriber.file_manager.load_session_file(session_num, 'cleaned')
                if cleaned_content:
                    ready_sessions[session_num] = {
                        'session_number': session_num,
                        'cleaned_content': cleaned_content,
                        'ready_for_ai': True,
                        'speaker_mapping': '',  # Could load from metadata if available
                        'detected_speakers': [],  # Empty list since we don't have this data
                        'needs_chunking': len(cleaned_content.split()) > 15000,
                        'processing_stages': ['text_cleaning', 'speaker_mapping', 'content_analysis', 'final_validation'],
                        'processing_metadata': {
                            'word_count': len(cleaned_content.split()),
                            'campaign_name': transcriber.config.get('files.campaign_name', 'rogue_trader')
                        }
                    }
            
            if ready_sessions:
                ai_results = transcriber.process_ai_stages(ready_sessions, stages)
                print(f"AI processing completed for {len(ai_results)} sessions")
            else:
                print("No cleaned sessions found for AI processing")
            
        else:
            # Full pipeline
            results = transcriber.run_full_pipeline(
                session_numbers=session_numbers,
                stages=stages,
                skip_transcription=args.no_transcribe
            )
            
            # Print summary
            summary = results['summary']
            print(f"\n📊 PIPELINE EXECUTION SUMMARY:")
            print(f"   Transcribed: {summary['transcribed_count']} sessions")
            print(f"   Python processed: {summary['python_processed']} sessions")
            print(f"   AI processed: {summary['ai_processed']} sessions")
            
            if 'python_success_rate' in summary:
                print(f"   Python success rate: {summary['python_success_rate']:.1f}%")
            if 'ai_success_rate' in summary:
                print(f"   AI success rate: {summary['ai_success_rate']:.1f}%")
        
        print("\n✅ Processing complete!")
        
    except KeyboardInterrupt:
        print("\n👋 Processing cancelled by user")
        # Ensure any Discord connections are properly closed
        try:
            if hasattr(transcriber, 'session_loader'):
                asyncio.run(transcriber.session_loader.close_discord_connection())
        except Exception:
            pass
    except Exception as e:
        print(f"\n❌ Processing failed: {e}")
        if args.debug:
            import traceback
            traceback.print_exc()
        # Ensure any Discord connections are properly closed on error
        try:
            if hasattr(transcriber, 'session_loader'):
                asyncio.run(transcriber.session_loader.close_discord_connection())
        except Exception:
            pass


if __name__ == "__main__":
    main()