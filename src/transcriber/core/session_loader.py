"""
Core module for loading and managing session data from Discord
No AI dependencies - pure Python processing
"""
import asyncio
from datetime import datetime, timezone, timedelta
from pathlib import Path
import json
from typing import Dict, List, Optional
import logging

try:
    import discord
    DISCORD_AVAILABLE = True
except ImportError:
    discord = None
    DISCORD_AVAILABLE = False


class SessionLoader:
    """Handles loading session data from Discord and file system"""
    
    def __init__(self, token: str, channel_id: int, data_dir: Path, session_gap_hours: int = 12):
        self.token = token
        self.channel_id = channel_id
        self.data_dir = data_dir
        self.session_gap_hours = session_gap_hours
        self.logger = logging.getLogger(__name__)
        
        # Set up Discord client only if discord is available
        if DISCORD_AVAILABLE:
            intents = discord.Intents.default()
            intents.message_content = True
            intents.guild_messages = True
            self.client = discord.Client(intents=intents)
            self.ready = asyncio.Event()
            
            # Set up Discord event handlers
            @self.client.event
            async def on_ready():
                self.logger.info(f'Discord client logged in as {self.client.user}')
                self.ready.set()
        else:
            self.client = None
            self.ready = None
            self.logger.warning("Discord library not available - Discord functionality disabled")
    
    def setup_directories(self):
        """Create necessary directory structure"""
        directories = [
            self.data_dir,
            self.data_dir / "sessions",
            self.data_dir / "sessions" / "raw",
            self.data_dir / "sessions" / "cleaned", 
            self.data_dir / "sessions" / "timelines",
            self.data_dir / "sessions" / "notes",
            self.data_dir / "sessions" / "summaries"
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
    
    def load_session_tracker(self) -> dict:
        """Load session tracking data from filesystem"""
        tracker_file = self.data_dir / "session_tracker.json"
        if tracker_file.exists():
            try:
                with open(tracker_file, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, FileNotFoundError):
                self.logger.warning("Failed to load session tracker, using defaults")
        
        return {
            "last_session": 0,
            "last_message_timestamp": None,
            "total_sessions": 0
        }
    
    def save_session_tracker(self, tracker_data: dict):
        """Save session tracking data to filesystem"""
        tracker_file = self.data_dir / "session_tracker.json"
        with open(tracker_file, 'w') as f:
            json.dump(tracker_data, f, indent=2)
    
    async def fetch_messages_from_discord(self, since_timestamp: Optional[datetime] = None) -> List[dict]:
        """Fetch messages from Discord channel"""
        if not DISCORD_AVAILABLE:
            self.logger.error("Discord library not available - cannot fetch messages")
            return []
        
        if not self.client or not self.ready:
            self.logger.error("Discord client not initialized")
            return []
        
        await self.ready.wait()
        
        try:
            channel = self.client.get_channel(self.channel_id)
            if not channel:
                raise ValueError(f"Channel {self.channel_id} not found")
            
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
                message_time - last_message_time > timedelta(hours=self.session_gap_hours)):
                
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
    
    def load_raw_session(self, session_number: int) -> Optional[str]:
        """Load raw session content from file"""
        raw_file = self.data_dir / "sessions" / "raw" / f"session-{session_number:02d}-raw.txt"
        if not raw_file.exists():
            self.logger.error(f"Raw session file not found: {raw_file}")
            return None
        
        try:
            with open(raw_file, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            self.logger.error(f"Failed to read raw session {session_number}: {e}")
            return None
    
    def save_raw_session(self, session_number: int, content: str) -> bool:
        """Save raw session content to file"""
        try:
            raw_file = self.data_dir / "sessions" / "raw" / f"session-{session_number:02d}-raw.txt"
            with open(raw_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            self.logger.info(f"Saved raw session {session_number}: {raw_file.name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save raw session {session_number}: {e}")
            return False
    
    def get_available_raw_sessions(self) -> List[int]:
        """Get list of available raw session numbers"""
        raw_dir = self.data_dir / "sessions" / "raw"
        if not raw_dir.exists():
            return []
        
        session_files = list(raw_dir.glob("session-*-raw.txt"))
        session_numbers = []
        
        for file in session_files:
            try:
                # Extract session number from filename
                parts = file.stem.split('-')
                if len(parts) >= 2:
                    session_numbers.append(int(parts[1]))
            except ValueError:
                continue
        
        return sorted(session_numbers)
    
    async def close_discord_connection(self):
        """Close Discord client connection"""
        if DISCORD_AVAILABLE and self.client:
            try:
                await self.client.close()
            except Exception as e:
                self.logger.error(f"Error closing Discord connection: {e}")
        else:
            self.logger.debug("No Discord connection to close")