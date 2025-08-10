import discord
import asyncio
from datetime import datetime, timezone, timedelta
import os
from pathlib import Path
import json
from collections import defaultdict
import re
import argparse
import time
import logging
from typing import Dict, List, Optional
from ai_processors import ProcessingPipeline
from test_utils import SessionTester
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Campaign Configuration
CAMPAIGN_NAME = "rogue_trader"
TOKEN = os.getenv('DISCORD_TOKEN')
CHANNEL_ID = 1388237799567654973
SESSION_GAP_HOURS = 12

class SessionTranscriber:
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.guild_messages = True
        self.client = discord.Client(intents=intents)
        self.ready = asyncio.Event()
        
        # Smart path detection
        current_dir = Path.cwd()
        
        if (current_dir / "rulebook").exists():
            base_dir = current_dir
            print(f"📁 Running from root: {base_dir}")
        elif (current_dir.parent / "rulebook").exists():
            base_dir = current_dir.parent
            print(f"📁 Running from tools/, using parent: {base_dir}")
        else:
            base_dir = current_dir
            print(f"⚠️ Rulebook folder not found, using current dir: {base_dir}")
        
        # Set up directory structure
        self.data_dir = base_dir / "all_data" / CAMPAIGN_NAME
        self.sessions_dir = self.data_dir / "sessions"
        self.raw_dir = self.sessions_dir / "raw"
        self.cleaned_dir = self.sessions_dir / "cleaned"
        self.timeline_dir = self.sessions_dir / "timelines"
        self.notes_dir = self.sessions_dir / "notes"
        self.summary_dir = self.sessions_dir / "test"
        
        # Create directories
        for directory in [self.data_dir, self.sessions_dir, self.raw_dir, 
                         self.cleaned_dir, self.timeline_dir, self.notes_dir, self.summary_dir]:
            directory.mkdir(parents=True, exist_ok=True)
        
        self.tracker_file = self.data_dir / "session_tracker.json"
        self.logger = logging.getLogger(__name__)
        
        # Set up Discord event handlers
        @self.client.event
        async def on_ready():
            print(f'✅ Logged in as {self.client.user}')
            self.ready.set()
    
    def load_session_tracker(self) -> dict:
        """Load session tracking data"""
        if self.tracker_file.exists():
            try:
                with open(self.tracker_file, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                pass
        
        return {
            "last_session": 0,
            "last_message_timestamp": None,
            "total_sessions": 0
        }
    
    def save_session_tracker(self, tracker_data: dict):
        """Save session tracking data"""
        with open(self.tracker_file, 'w') as f:
            json.dump(tracker_data, f, indent=2)
    
    async def get_channel_messages(self, since_timestamp: Optional[datetime] = None) -> List[dict]:
        """Fetch messages from Discord channel"""
        await self.ready.wait()
        
        try:
            channel = self.client.get_channel(CHANNEL_ID)
            if not channel:
                raise ValueError(f"Channel {CHANNEL_ID} not found")
            
            messages = []
            
            async for message in channel.history(
                limit=None, 
                after=since_timestamp,
                oldest_first=True
            ):
                if message.author.bot:
                    continue
                
                messages.append({
                    'timestamp': message.created_at,
                    'author': message.author.display_name.lower(),
                    'content': message.content,
                    'id': message.id
                })
            
            return messages
            
        except Exception as e:
            self.logger.error(f"Error fetching messages: {e}")
            return []
    
    def group_messages_into_sessions(self, messages: List[dict]) -> dict:
        """Group messages into sessions based on time gaps"""
        if not messages:
            return {}
        
        sessions = {}
        current_session_messages = []
        current_session_num = None
        last_message_time = None
        
        tracker = self.load_session_tracker()
        session_counter = tracker.get("last_session", 0)
        
        for message in messages:
            message_time = message['timestamp']
            
            # Check for session break
            if (last_message_time and 
                message_time - last_message_time > timedelta(hours=SESSION_GAP_HOURS)):
                
                # Save previous session
                if current_session_messages and current_session_num:
                    sessions[current_session_num] = current_session_messages
                
                # Start new session
                session_counter += 1
                current_session_num = session_counter
                current_session_messages = []
            
            elif not current_session_num:
                # First session
                session_counter += 1
                current_session_num = session_counter
            
            current_session_messages.append(message)
            last_message_time = message_time
        
        # Save final session
        if current_session_messages and current_session_num:
            sessions[current_session_num] = current_session_messages
        
        # Update tracker
        if sessions:
            tracker["last_session"] = max(sessions.keys())
            tracker["total_sessions"] = len(sessions) + tracker.get("total_sessions", 0) - len(sessions)
            tracker["last_message_timestamp"] = messages[-1]['timestamp'].isoformat()
            self.save_session_tracker(tracker)
        
        return sessions
    
    def format_session_transcript(self, messages: List[dict]) -> str:
        """Format messages into readable transcript"""
        transcript_lines = []
        
        for message in messages:
            author = message['author']
            content = message['content']
            
            # Clean up content
            content = re.sub(r'<@\d+>', '[mention]', content)
            content = re.sub(r'<:\w+:\d+>', '[emoji]', content)
            
            if content.strip():
                transcript_lines.append(f"{author}: {content}")
        
        return '\n'.join(transcript_lines)
    
    def save_session_transcript(self, session_number: int, transcript: str) -> bool:
        """Save session transcript to file"""
        try:
            session_file = self.raw_dir / f"session-{session_number:02d}-raw.txt"
            with open(session_file, 'w', encoding='utf-8') as f:
                f.write(transcript)
            
            print(f"💾 Saved session {session_number}: {session_file.name}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to save session {session_number}: {e}")
            return False
    
    async def transcribe_new_sessions(self) -> List[int]:
        """Transcribe new sessions from Discord"""
        tracker = self.load_session_tracker()
        last_timestamp = tracker.get("last_message_timestamp")
        
        since_timestamp = None
        if last_timestamp:
            try:
                since_timestamp = datetime.fromisoformat(last_timestamp.replace('Z', '+00:00'))
            except ValueError:
                since_timestamp = None
        
        print(f"🔍 Fetching messages since: {since_timestamp or 'beginning'}")
        
        messages = await self.get_channel_messages(since_timestamp)
        if not messages:
            print("📭 No new messages found")
            return []
        
        print(f"📨 Found {len(messages)} new messages")
        
        sessions = self.group_messages_into_sessions(messages)
        saved_sessions = []
        
        for session_num, session_messages in sessions.items():
            transcript = self.format_session_transcript(session_messages)
            if self.save_session_transcript(session_num, transcript):
                saved_sessions.append(session_num)
        
        return saved_sessions
    
    async def import_historical_sessions(self) -> List[int]:
        """Import all historical sessions"""
        print("📚 Importing all historical sessions...")
        
        messages = await self.get_channel_messages()
        if not messages:
            print("📭 No messages found")
            return []
        
        print(f"📨 Processing {len(messages)} historical messages")
        
        sessions = self.group_messages_into_sessions(messages)
        saved_sessions = []
        
        for session_num, session_messages in sessions.items():
            transcript = self.format_session_transcript(session_messages)
            if self.save_session_transcript(session_num, transcript):
                saved_sessions.append(session_num)
        
        return saved_sessions
    
    def get_available_raw_sessions(self) -> List[int]:
        """Get list of available raw session numbers"""
        session_files = list(self.raw_dir.glob("session-*-raw.txt"))
        session_numbers = []
        
        for file in session_files:
            match = re.match(r'session-(\d+)-raw\.txt', file.name)
            if match:
                session_numbers.append(int(match.group(1)))
        
        return sorted(session_numbers)
    
    def batch_process_sessions(self, session_numbers: List[int], stages: List[str]) -> Dict[int, bool]:
        """Process multiple sessions with AI pipeline and diagnostic tracking"""
        if not session_numbers:
            print("❌ No sessions to process")
            return {}
        
        # Initialize pipeline
        try:
            config_path = Path(__file__).parent
            pipeline = ProcessingPipeline(str(config_path), campaign_name=CAMPAIGN_NAME)
        except Exception as e:
            print(f"❌ Failed to initialize pipeline: {e}")
            return {}
        
        results = {}
        successful_sessions = 0
        content_loss_warnings = 0
        
        print(f"🤖 Processing {len(session_numbers)} sessions through stages: {', '.join(stages)}")
        
        for i, session_number in enumerate(session_numbers, 1):
            print(f"\n📝 Processing session {session_number} ({i}/{len(session_numbers)})")
            
            # Load raw session
            raw_file = self.raw_dir / f"session-{session_number:02d}-raw.txt"
            if not raw_file.exists():
                print(f"❌ Raw session file not found: {raw_file}")
                results[session_number] = False
                continue
            
            try:
                with open(raw_file, 'r', encoding='utf-8') as f:
                    raw_content = f.read()
            except Exception as e:
                print(f"❌ Failed to read raw session: {e}")
                results[session_number] = False
                continue
            
            # Get previous session summary for context
            previous_summary = ""
            if session_number > 1:
                prev_summary_file = self.summary_dir / f"session-{session_number-1:02d}-summary.md"
                if prev_summary_file.exists():
                    try:
                        with open(prev_summary_file, 'r', encoding='utf-8') as f:
                            previous_summary = f.read()
                    except Exception:
                        pass
            
            # Process session
            try:
                session_results = pipeline.process_session(
                    raw_content, 
                    session_number, 
                    stages, 
                    previous_summary
                )
                
                # Validate results
                validation = pipeline.validate_results(session_results)
                
                # Save results
                success = self._save_session_results(session_number, session_results, stages, validation)
                results[session_number] = success
                
                if success:
                    successful_sessions += 1
                    print(f"✅ Session {session_number} processed successfully")
                else:
                    print(f"❌ Session {session_number} processing failed")
                
                # Check for content loss warnings in validation
                if not validation.get('timeline', True) or not validation.get('notes', True):
                    content_loss_warnings += 1
                
            except Exception as e:
                print(f"❌ Error processing session {session_number}: {e}")
                results[session_number] = False
        
        # Summary report
        total_sessions = len(session_numbers)
        success_rate = (successful_sessions / total_sessions) * 100 if total_sessions > 0 else 0
        
        print(f"\n📊 BATCH PROCESSING SUMMARY:")
        print(f"   Sessions processed: {total_sessions}")
        print(f"   Successful: {successful_sessions}")
        print(f"   Failed: {total_sessions - successful_sessions}")
        print(f"   Quality warnings: {content_loss_warnings}")
        print(f"   Success rate: {success_rate:.1f}%")
        
        return results
    
    def _save_session_results(self, session_number: int, results: Dict[str, Optional[str]], 
                             stages: List[str], validation: Dict[str, bool]) -> bool:
        """Save processing results to appropriate files"""
        success = True
        session_date = f"Session {session_number}"
        
        # Save cleaned
        if 'cleanup' in stages and results.get('cleaned'):
            cleaned_file = self.cleaned_dir / f"session-{session_number:02d}-cleaned.txt"
            try:
                header = f"**{CAMPAIGN_NAME.replace('_', ' ').title()} Campaign: Session {session_number} Transcript**\n\n"
                with open(cleaned_file, 'w', encoding='utf-8') as f:
                    f.write(header + results['cleaned'])
                print(f"✅ Saved cleaned: {cleaned_file.name}")
            except Exception as e:
                print(f"❌ Failed to save cleaned transcript: {e}")
                success = False
        
        # Save timeline
        if 'timeline' in stages and results.get('timeline'):
            timeline_file = self.timeline_dir / f"session-{session_number:02d}-timeline.md"
            try:
                header = f"# Session {session_number} Timeline - {session_date}\n\n## {CAMPAIGN_NAME.replace('_', ' ').title()} Campaign\n\n"
                with open(timeline_file, 'w', encoding='utf-8') as f:
                    f.write(header + results['timeline'])
                print(f"✅ Saved timeline: {timeline_file.name}")
            except Exception as e:
                print(f"❌ Failed to save timeline: {e}")
                success = False
        
        # Save notes
        if 'notes' in stages and results.get('notes'):
            notes_file = self.notes_dir / f"session-{session_number:02d}-notes.md"
            try:
                header = f"# Session {session_number} GM Notes - {session_date}\n\n## Key Developments\n\n"
                with open(notes_file, 'w', encoding='utf-8') as f:
                    f.write(header + results['notes'])
                print(f"✅ Saved notes: {notes_file.name}")
            except Exception as e:
                print(f"❌ Failed to save notes: {e}")
                success = False
        
        # Save summary
        if 'summary' in stages and results.get('summary'):
            summary_file = self.summary_dir / f"session-{session_number:02d}-summary.md"
            try:
                header = f"# Session {session_number} Summary - {session_date}\n\n## {CAMPAIGN_NAME.replace('_', ' ').title()} Campaign\n\n"
                with open(summary_file, 'w', encoding='utf-8') as f:
                    f.write(header + results['summary'])
                print(f"✅ Saved summary: {summary_file.name}")
            except Exception as e:
                print(f"❌ Failed to save summary: {e}")
                success = False
        
        # Report validation results
        self._report_validation(session_number, validation)
        
        return success
    
    def _report_validation(self, session_number: int, validation: Dict[str, bool]):
        """Report validation results"""
        print(f"📋 Validation Results for Session {session_number}:")
        for stage, valid in validation.items():
            status = "✅ Pass" if valid else "⚠️  Warning"
            print(f"   {stage.title()}: {status}")


def main():
    parser = argparse.ArgumentParser(description="Enhanced Discord Session Transcriber with AI Processing")
    
    # Transcription options
    parser.add_argument('--historical', action='store_true', help='Import all historical messages')
    parser.add_argument('--no-transcribe', action='store_true', help='Skip transcription, only do AI processing')
    
    # AI Processing options
    parser.add_argument('--process-all', action='store_true', help='Process through all AI stages')
    parser.add_argument('--clean-only', action='store_true', help='Only run cleanup stage')
    parser.add_argument('--timeline-only', action='store_true', help='Only run timeline stage')
    parser.add_argument('--notes-only', action='store_true', help='Only run notes stage')
    parser.add_argument('--summary-only', action='store_true', help='Only run summary stage')
    parser.add_argument('--sessions', type=str, help='Specific sessions to process (e.g., "1,3,5-8" or "all")')
    
    # Diagnostic and testing options
    parser.add_argument('--test-mode', action='store_true', help='Run in test mode with manual verification')
    parser.add_argument('--test-session', type=int, help='Specific session number to test')
    parser.add_argument('--diagnostic', action='store_true', help='Enable detailed diagnostic logging')
    parser.add_argument('--validate-only', action='store_true', help='Only validate existing processed sessions')
    parser.add_argument('--chunk-size', type=int, default=8000, help='Maximum chunk size for large sessions (words)')
    
    args = parser.parse_args()
    
    # Configure logging
    log_level = logging.DEBUG if args.diagnostic else logging.INFO
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Initialize transcriber
    transcriber = SessionTranscriber()
    
    # Test mode
    if args.test_mode:
        tester = SessionTester(transcriber.data_dir)
        if args.test_session:
            tester.manual_verification_mode(args.test_session)
        else:
            print("Please specify --test-session NUMBER for test mode")
        return
    
    # Validate only mode
    if args.validate_only:
        # TODO: Implement validation of existing sessions
        print("Validation mode not yet implemented")
        return
    
    # Determine AI processing stages
    stages = []
    if args.process_all:
        stages = ['cleanup', 'timeline', 'notes', 'summary']
    elif args.clean_only:
        stages = ['cleanup']
    elif args.timeline_only:
        stages = ['timeline']
    elif args.notes_only:
        stages = ['notes']
    elif args.summary_only:
        stages = ['summary']
    
    # Parse session numbers
    session_numbers = None
    if args.sessions:
        try:
            session_numbers = parse_session_range(args.sessions)
        except ValueError as e:
            print(f"❌ Invalid session range: {e}")
            return
    
    # Run transcription if not skipped
    if not args.no_transcribe:
        async def run_transcription():
            if args.historical:
                print("📚 Starting historical import...")
                sessions = await transcriber.import_historical_sessions()
            else:
                print("🔍 Checking for new sessions...")
                sessions = await transcriber.transcribe_new_sessions()
            
            if sessions:
                print(f"✅ Transcribed {len(sessions)} sessions: {sessions}")
            else:
                print("📭 No sessions to transcribe")
            
            return sessions
        
        # Run transcription
        try:
            loop = asyncio.get_event_loop()
            transcribed_sessions = loop.run_until_complete(run_transcription())
        except KeyboardInterrupt:
            print("\n👋 Transcription cancelled by user")
            return
        except Exception as e:
            print(f"❌ Transcription failed: {e}")
            return
        finally:
            try:
                loop.run_until_complete(transcriber.client.close())
            except:
                pass
    
    # Run AI processing if requested
    if stages:
        print(f"\n🤖 Starting AI processing...")
        print(f"Stages: {', '.join(stages)}")
        
        if not session_numbers:
            session_numbers = transcriber.get_available_raw_sessions()
            if not session_numbers:
                print("❌ No raw sessions found for processing")
                return
            print(f"📋 Processing all available sessions: {session_numbers}")
        else:
            print(f"📋 Processing specified sessions: {session_numbers}")
        
        results = transcriber.batch_process_sessions(session_numbers, stages)
        print(f"\n🎉 AI processing complete!")
    
    if not args.no_transcribe or stages:
        input("Press Enter to close...")


def parse_session_range(session_str: str) -> List[int]:
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


if __name__ == "__main__":
    main()