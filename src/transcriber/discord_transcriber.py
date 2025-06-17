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
from typing import List, Optional
from ai_processors import ProcessingPipeline
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Campaign Configuration - EDIT THESE
CAMPAIGN_NAME = "mutants"  # Current active campaign
TOKEN = os.getenv('DISCORD_TOKEN')
CHANNEL_ID = 1335070851015639113

# Session Detection Settings
SESSION_GAP_HOURS = 12  # Hours of silence = new session

class SessionTranscriber:
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.guild_messages = True
        self.client = discord.Client(intents=intents)
        self.ready = asyncio.Event()
        
        # Smart path detection - works whether run from root or tools/
        current_dir = Path.cwd()
        
        # Check if we're in root (has rulebook folder) or tools folder
        if (current_dir / "rulebook").exists():
            # Running from root
            base_dir = current_dir
            print(f"📁 Running from root: {base_dir}")
        elif (current_dir.parent / "rulebook").exists():
            # Running from tools folder
            base_dir = current_dir.parent
            print(f"📁 Running from tools, using root: {base_dir}")
        else:
            # Fallback - assume we're in root
            base_dir = current_dir
            print(f"📁 Fallback to current dir: {base_dir}")
        
        self.campaign_dir = base_dir / "all_data" / CAMPAIGN_NAME
        self.sessions_dir = self.campaign_dir / "sessions"
        self.sessions_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize AI processing pipeline
        tools_dir = base_dir / "src" / "transcriber"
        self.ai_pipeline = ProcessingPipeline(str(tools_dir))
        
        # Setup structured session directories
        self.raw_dir = self.sessions_dir / "raw"
        self.cleaned_dir = self.sessions_dir / "cleaned" 
        self.timeline_dir = self.sessions_dir / "timelines"
        self.notes_dir = self.sessions_dir / "notes"
        self.summary_dir = self.sessions_dir / "summaries"
        
        # Create directories if they don't exist
        for directory in [self.raw_dir, self.cleaned_dir, self.timeline_dir, self.notes_dir, self.summary_dir]:
            directory.mkdir(parents=True, exist_ok=True)
        
        print(f"🎯 Campaign: {CAMPAIGN_NAME}")
        print(f"📂 Sessions folder: {self.sessions_dir}")

        # <<< MODIFIED SECTION START >>>
        # This mapping handles the new bot format seen in session-17
        # It maps the name the bot uses back to the actual username
        self.bot_author_map = {
            'a fucking synth': 'syrjayko',
            'marquis (diego)': 'diegoslowing02',
            'trent': 'amuniare',
            'nick': 'bipolarfrenchie',
            'pandora': 'sexissinful',
        }
        self.bot_message_pattern = re.compile(r'^\*\*(.*?)\*\*:\s*(.*)', re.DOTALL)
        # <<< MODIFIED SECTION END >>>
        
        self.setup_events()


    def get_tracker_file_path(self):
        """Get path to the session tracker file"""
        return self.campaign_dir / "session_tracker.json"

    def load_session_tracker(self):
        """Load the session tracker data"""
        tracker_file = self.get_tracker_file_path()
        
        if not tracker_file.exists():
            print("📊 No session tracker found, creating new one")
            return {
                "last_session": 0,
                "last_message_timestamp": None,
                "total_sessions": 0
            }
        
        try:
            with open(tracker_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            print(f"📊 Loaded tracker: Session {data['last_session']}, {data['total_sessions']} total")
            return data
        except Exception as e:
            print(f"⚠️ Error loading tracker, creating new one: {e}")
            return {
                "last_session": 0,
                "last_message_timestamp": None,
                "total_sessions": 0
            }

    def save_session_tracker(self, last_session, last_timestamp, total_sessions):
        """Save updated session tracker data"""
        tracker_file = self.get_tracker_file_path()
        
        data = {
            "last_session": last_session,
            "last_message_timestamp": last_timestamp.isoformat() if last_timestamp else None,
            "total_sessions": total_sessions
        }
        
        try:
            with open(tracker_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            print(f"💾 Updated tracker: Session {last_session}")
        except Exception as e:
            print(f"❌ Error saving tracker: {e}")


    def setup_events(self):
        @self.client.event
        async def on_ready():
            print(f"✅ Logged in as {self.client.user}")
            self.ready.set()

    async def detect_and_transcribe_all_sessions(self):
        """Detect all sessions and transcribe them"""
        print("🔍 Scanning channel for sessions...")
        
        channel = await self.client.fetch_channel(CHANNEL_ID)
        
        # Get all messages
        all_messages = []
        print("📥 Fetching all messages...")
        
        async for message in channel.history(
            limit=None, 
            oldest_first=False  # Start from newest
        ):
            all_messages.append(message)
            if len(all_messages) % 100 == 0:
                print(f"   Retrieved {len(all_messages)} messages...")
        
        print(f"✅ Retrieved {len(all_messages)} total messages")
        
        # Group messages into sessions
        sessions = self.group_messages_into_sessions(all_messages)
        
        # Check what we already have
        existing_sessions = self.get_existing_sessions()
        
        # Transcribe each session
        new_sessions = 0
        for session_num, messages in sessions.items():
            session_file = f"session-{session_num:02d}.txt"
            
            if session_file in existing_sessions:
                print(f"⏭️  Session {session_num} already exists, skipping...")
                continue
                
            print(f"✍️  Transcribing Session {session_num} ({len(messages)} messages)...")
            self.save_session(session_num, messages)
            new_sessions += 1
        
        # Save tracker data after historical import
        if sessions:
            latest_session = max(sessions.keys())
            # Use current time as rough timestamp 
            current_time = datetime.now(timezone.utc)
            self.save_session_tracker(latest_session, current_time, len(sessions))
        
        print(f"🎉 Completed! Found {len(sessions)} total sessions, created {new_sessions} new transcripts")

    def group_messages_into_sessions(self, messages):
        """Group messages into sessions based on time gaps"""
        if not messages:
            return {}
            
        # Sort messages by timestamp (oldest first for processing)
        messages.sort(key=lambda m: m.created_at)
        
        sessions = defaultdict(list)
        current_session = 1
        session_gap = timedelta(hours=SESSION_GAP_HOURS)
        
        last_message_time = None
        
        for message in messages:
            # Check if this message starts a new session
            if last_message_time and (message.created_at - last_message_time) > session_gap:
                current_session += 1
                print(f"📅 New session {current_session} detected at {message.created_at.strftime('%Y-%m-%d %H:%M')}")
            
            # <<< MODIFIED SECTION START >>>
            # Parse author and content, handling the new bot format
            raw_author = message.author.name.replace('[Scriptly] ', '')
            raw_content = message.clean_content.strip()

            author = raw_author
            content = raw_content

            # Check for messages from the "SeaVoice" bot which contain the real speaker
            if raw_author.lower() == 'seavoice':
                match = self.bot_message_pattern.match(raw_content)
                if match:
                    # Extract the speaker and the actual message from the bot's content
                    bot_speaker_name = match.group(1).strip().lower()
                    content = match.group(2).strip()
                    
                    # Use the map to get the canonical username for the stats analyzer
                    # Fallback to the parsed name if not in our specific map
                    author = self.bot_author_map.get(bot_speaker_name, bot_speaker_name)
            
            # Final cleanup of author name, just in case
            final_author = author.replace('[Scriptly] ', '')
            # <<< MODIFIED SECTION END >>>

            # Apply filtering
            if self.should_include_message(content):
                sessions[current_session].append(f"{final_author}: {content}")
            
            last_message_time = message.created_at
        
        return dict(sessions)

    def should_include_message(self, content):
        """Apply message filtering logic"""
        filler_responses = {
            'yeah', 'okay', 'ok', 'oh', 'um', 'ah', 'mhm', 'right', 'hmm', 'uh', '',
            'thanks', 'thank you', 'cool', 'nice', 'yep', 'nope', 'ye', 'k',
            'yup', 'nah', 'meh', 'uhh', 'umm', 'err', 'ehh', 'huh', 'mmm',
            'sure', 'alright', 'kk', 'kay', 'gotcha', 'got it', 'indeed',
            'lol', 'lmao', 'haha', 'hehe', 'wow', 'wtf', 'omg', 'bruh',
            'same', 'true', 'false', 'maybe', 'idk', 'dunno',
            '1', '2', '3', '4', '5', 'a', 'b', 'c', 'x', 'y', 'z',
            'gg', 'afk', 'brb', 'gtg', 'sup', 'hi', 'hey', 'bye',
            'yeahhh', 'okayy', 'okayyy', 'yepp', 'yupp', 'nahh',
            'uhhh', 'ummm', 'errr', 'hmmm', 'welp', 'yeet',
            'well', 'like', 'just', 'so', 'what', 'wait', 'now',
            'here', 'there', 'this', 'that', 'these', 'those'
        }
        
        return (content and 
                content.lower() not in filler_responses and
                not all(c in '.,!?' for c in content) and
                len(content) > 1 and
                not content.startswith('/') and
                not content.startswith('!'))

    def get_existing_sessions(self):
        """Get list of existing session files"""
        return [f.name for f in self.sessions_dir.glob("session-*.txt")]

    def save_session(self, session_num, messages):
        """Save session to file in both legacy and raw locations"""
        # Save to legacy location for backward compatibility
        legacy_file = self.sessions_dir / f"session-{session_num:02d}.txt"
        
        # Save to new raw location for AI processing
        raw_file = self.raw_dir / f"session-{session_num:02d}-raw.txt"
        
        content = '\n'.join(messages)
        
        with open(legacy_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        with open(raw_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"💾 Saved {legacy_file} and {raw_file} ({len(messages)} messages)")

    async def transcribe_latest_session_only(self):
        """Just get the most recent session (for regular use)"""
        print("🔍 Looking for latest session...")
        
        channel = await self.client.fetch_channel(CHANNEL_ID)
        
        # Get recent messages (last 2 weeks should be enough)
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=14)
        recent_messages = []
        
        async for message in channel.history(
            limit=None,
            after=cutoff_date,
            oldest_first=False
        ):
            recent_messages.append(message)
        
        if not recent_messages:
            print("❌ No recent messages found")
            return
        
        # Group and find sessions
        sessions = self.group_messages_into_sessions(recent_messages)
        
        if not sessions:
            print("❌ No sessions detected")
            return
            
        latest_session_num = max(sessions.keys())
        
        # Check if we already have this session
        existing_sessions = self.get_existing_sessions()
        session_file = f"session-{latest_session_num:02d}.txt"
        
        if session_file in existing_sessions:
            print(f"✅ Latest session ({latest_session_num}) already exists")
            return
            
        # Save the latest session
        messages = sessions[latest_session_num]
        self.save_session(latest_session_num, messages)
        print(f"✅ Transcribed latest session {latest_session_num}")

    async def transcribe_new_sessions_only(self, tracker_data):
        """Transcribe only new sessions since last run"""
        channel = await self.client.fetch_channel(CHANNEL_ID)
        
        # Get cutoff time - if we have a last timestamp, use it, otherwise go back 7 days
        if tracker_data["last_message_timestamp"]:
            cutoff_date = datetime.fromisoformat(tracker_data["last_message_timestamp"].replace('Z', '+00:00'))
            print(f"🕐 Looking for messages after {cutoff_date.strftime('%Y-%m-%d %H:%M')}")
        else:
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
            print(f"🕐 No previous timestamp, looking back 7 days to {cutoff_date.strftime('%Y-%m-%d %H:%M')}")
        
        # Get messages after cutoff
        new_messages = []
        async for message in channel.history(
            limit=None,
            after=cutoff_date,
            oldest_first=False
        ):
            new_messages.append(message)
        
        if not new_messages:
            print("✅ No new messages found")
            return
            
        print(f"📥 Found {len(new_messages)} new messages")
        
        # Group into sessions
        sessions = self.group_messages_into_sessions(new_messages)
        
        if not sessions:
            print("✅ No new sessions detected")
            return
        
        # Process each new session
        new_sessions_count = 0
        last_timestamp = None
        
        for session_num, messages in sorted(sessions.items()):
            # Adjust session numbers to continue from where we left off
            actual_session_num = tracker_data["last_session"] + session_num
            
            print(f"✍️ Transcribing Session {actual_session_num} ({len(messages)} messages)...")
            self.save_session(actual_session_num, messages)
            new_sessions_count += 1
            
            # Track the last message timestamp for next run
            if messages:
                # We need to get the actual timestamp - this is rough but workable
                last_timestamp = datetime.now(timezone.utc)
        
        # Update tracker
        final_session = tracker_data["last_session"] + len(sessions)
        total_sessions = tracker_data["total_sessions"] + new_sessions_count
        
        self.save_session_tracker(final_session, last_timestamp, total_sessions)
        
        print(f"🎉 Completed! Processed {new_sessions_count} new sessions")

    def process_session_with_ai(self, session_number: int, stages: List[str] = None, 
                               previous_summary: str = "") -> bool:
        """Process a single session through AI pipeline"""
        if stages is None:
            stages = ['cleanup', 'timeline', 'notes', 'summary']
        
        # Read raw transcript
        raw_file = self.raw_dir / f"session-{session_number:02d}-raw.txt"
        if not raw_file.exists():
            print(f"❌ Raw transcript not found: {raw_file}")
            return False
        
        try:
            with open(raw_file, 'r', encoding='utf-8') as f:
                raw_content = f.read()
        except Exception as e:
            print(f"❌ Error reading raw transcript: {e}")
            return False
        
        print(f"🤖 Processing session {session_number} with AI...")
        print(f"   Stages: {', '.join(stages)}")
        
        # Process through AI pipeline
        try:
            results = self.ai_pipeline.process_session(
                raw_content, session_number, stages, previous_summary
            )
        except Exception as e:
            print(f"❌ AI processing failed: {e}")
            return False
        
        # Save results
        success = self._save_ai_results(session_number, results, stages)
        
        if success:
            # Validate results
            validation = self.ai_pipeline.validate_results(results)
            self._report_validation(session_number, validation)
        
        return success
    
    def _save_ai_results(self, session_number: int, results: dict, stages: List[str]) -> bool:
        """Save AI processing results to appropriate files"""
        session_date = datetime.now().strftime("%Y-%m-%d")
        success = True
        
        # Save cleaned transcript
        if 'cleanup' in stages and results.get('cleaned'):
            cleaned_file = self.cleaned_dir / f"session-{session_number:02d}-cleaned.txt"
            try:
                with open(cleaned_file, 'w', encoding='utf-8') as f:
                    f.write(results['cleaned'])
                print(f"✅ Saved cleaned transcript: {cleaned_file.name}")
            except Exception as e:
                print(f"❌ Failed to save cleaned transcript: {e}")
                success = False
        
        # Save timeline
        if 'timeline' in stages and results.get('timeline'):
            timeline_file = self.timeline_dir / f"session-{session_number:02d}-timeline.md"
            try:
                header = f"# Session {session_number} Timeline - {session_date}\n\n## Mutants Campaign\n\n"
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
                header = f"# Session {session_number} Summary - {session_date}\n\n## Mutants Campaign\n\n"
                with open(summary_file, 'w', encoding='utf-8') as f:
                    f.write(header + results['summary'])
                print(f"✅ Saved summary: {summary_file.name}")
            except Exception as e:
                print(f"❌ Failed to save summary: {e}")
                success = False
        
        return success
    
    def _report_validation(self, session_number: int, validation: dict):
        """Report validation results"""
        print(f"📋 Validation Results for Session {session_number}:")
        for stage, is_valid in validation.items():
            status = "✅ PASS" if is_valid else "❌ FAIL"
            print(f"   {stage.title()}: {status}")
    
    def batch_process_sessions(self, session_numbers: List[int], stages: List[str] = None) -> dict:
        """Process multiple sessions with context continuity"""
        if stages is None:
            stages = ['cleanup', 'timeline', 'notes', 'summary']
        
        results = {}
        previous_summary = ""
        
        for session_num in sorted(session_numbers):
            print(f"\n{'='*60}")
            print(f"Processing Session {session_num}")
            print(f"{'='*60}")
            
            success = self.process_session_with_ai(session_num, stages, previous_summary)
            results[session_num] = success
            
            # Update previous summary for continuity
            if success and 'summary' in stages:
                summary_file = self.summary_dir / f"session-{session_num:02d}-summary.md"
                if summary_file.exists():
                    try:
                        with open(summary_file, 'r', encoding='utf-8') as f:
                            # Skip header lines and get content
                            content = f.read()
                            lines = content.split('\n')
                            summary_content = '\n'.join(lines[4:])  # Skip header
                            previous_summary = summary_content[:500] + "..." if len(summary_content) > 500 else summary_content
                    except Exception as e:
                        print(f"⚠️ Could not read summary for continuity: {e}")
            
            # Brief pause between sessions
            if session_num != session_numbers[-1]:
                print("⏳ Brief pause before next session...")
                time.sleep(2)
        
        # Report results
        print(f"\n{'='*60}")
        print("BATCH PROCESSING COMPLETE")
        print(f"{'='*60}")
        
        successful = sum(1 for success in results.values() if success)
        total = len(results)
        
        print(f"✅ Successfully processed: {successful}/{total} sessions")
        
        if successful < total:
            failed_sessions = [num for num, success in results.items() if not success]
            print(f"❌ Failed sessions: {failed_sessions}")
        
        return results
    
    def get_available_raw_sessions(self) -> List[int]:
        """Get list of available raw session numbers"""
        session_files = list(self.raw_dir.glob("session-*-raw.txt"))
        session_numbers = []
        
        for file in session_files:
            try:
                # Extract session number from filename
                name = file.stem  # e.g., "session-01-raw"
                parts = name.split('-')
                if len(parts) >= 2 and parts[1].isdigit():
                    session_numbers.append(int(parts[1]))
            except (ValueError, IndexError):
                continue
        
        return sorted(session_numbers)

    async def run(self, force_historical=False):
        """Main run method with smart session detection"""
        try:
            print("🚀 Starting Discord transcriber...")
            
            asyncio.create_task(self.client.start(TOKEN))
            await self.ready.wait()
            
            # Load session tracker
            tracker_data = self.load_session_tracker()
            
            # Determine mode
            if force_historical or tracker_data["last_session"] == 0:
                print("📚 Running historical import...")
                await self.detect_and_transcribe_all_sessions()
            else:
                print("🔄 Running incremental session check...")
                await self.transcribe_new_sessions_only(tracker_data)
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            raise
        finally:
            try:
                await self.client.close()
            except:
                pass


def main():
    """Main function with command-line argument parsing"""
    parser = argparse.ArgumentParser(description="Discord Session Transcriber with AI Processing")
    
    # Transcription options
    parser.add_argument("--historical", action="store_true", 
                       help="Force historical import of all sessions")
    
    # AI Processing options
    parser.add_argument("--process-all", action="store_true",
                       help="Process all available sessions through full AI pipeline")
    parser.add_argument("--clean-only", action="store_true",
                       help="Process sessions through cleanup stage only")
    parser.add_argument("--timeline-only", action="store_true", 
                       help="Process sessions through timeline generation only")
    parser.add_argument("--notes-only", action="store_true",
                       help="Process sessions through notes generation only")
    parser.add_argument("--summary-only", action="store_true",
                       help="Process sessions through summary generation only")
    
    # Session selection
    parser.add_argument("--sessions", type=str,
                       help="Comma-separated list of session numbers to process (e.g., '1,3,5-8')")
    
    # Processing options
    parser.add_argument("--no-transcribe", action="store_true",
                       help="Skip Discord transcription, only run AI processing")
    
    args = parser.parse_args()
    
    transcriber = SessionTranscriber()
    
    # Determine processing stages
    stages = []
    if args.clean_only:
        stages = ['cleanup']
    elif args.timeline_only:
        stages = ['cleanup', 'timeline']
    elif args.notes_only:
        stages = ['cleanup', 'timeline', 'notes']
    elif args.summary_only:
        stages = ['cleanup', 'timeline', 'notes', 'summary']
    elif args.process_all:
        stages = ['cleanup', 'timeline', 'notes', 'summary']
    
    # Parse session numbers
    session_numbers = []
    if args.sessions:
        try:
            parsed_sessions = parse_session_range(args.sessions)
            if parsed_sessions is not None:
                session_numbers = parsed_sessions
            # If None (from "all"), leave session_numbers empty to be filled later
        except ValueError as e:
            print(f"❌ Error parsing session numbers: {e}")
            return
    
    # Run transcription if not skipped
    if not args.no_transcribe:
        if args.historical:
            print("📚 Forcing historical import via --historical flag")
        
        asyncio.run(transcriber.run(force_historical=args.historical))
        print("\n🏁 Transcription complete!")
    
    # Run AI processing if requested
    if stages:
        print(f"\n🤖 Starting AI processing...")
        print(f"Stages: {', '.join(stages)}")
        
        if not session_numbers:
            # Get all available sessions
            session_numbers = transcriber.get_available_raw_sessions()
            if not session_numbers:
                print("❌ No raw sessions found for processing")
                return
            print(f"📋 Processing all available sessions: {session_numbers}")
        else:
            print(f"📋 Processing specified sessions: {session_numbers}")
        
        # Process sessions
        results = transcriber.batch_process_sessions(session_numbers, stages)
        
        print(f"\n🎉 AI processing complete!")
    
    if not args.no_transcribe or stages:
        input("Press Enter to close...")

def parse_session_range(session_str: str) -> List[int]:
    """Parse session range string like '1,3,5-8' or 'all' into list of integers"""
    # Handle special case for "all"
    if session_str.strip().lower() == "all":
        return None  # Will be handled by caller to use all available sessions
    
    session_numbers = []
    
    for part in session_str.split(','):
        part = part.strip()
        if '-' in part:
            # Handle range like '5-8'
            try:
                start, end = part.split('-', 1)
                start, end = int(start.strip()), int(end.strip())
                session_numbers.extend(range(start, end + 1))
            except ValueError:
                raise ValueError(f"Invalid range format: {part}")
        else:
            # Handle single number
            try:
                session_numbers.append(int(part))
            except ValueError:
                raise ValueError(f"Invalid session number: {part}")
    
    return sorted(list(set(session_numbers)))  # Remove duplicates and sort

if __name__ == "__main__":
    main()