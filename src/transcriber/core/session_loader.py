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
    
    async def connect_to_discord(self, timeout: int = 30) -> bool:
        """Establish connection to Discord with timeout"""
        if not DISCORD_AVAILABLE:
            self.logger.error("Discord library not available - cannot connect")
            return False
        
        if not self.client or not self.ready:
            self.logger.error("Discord client not initialized")
            return False
        
        if not self.token:
            self.logger.error("Discord token is not set. Please set the DISCORD_TOKEN environment variable.")
            return False
        
        try:
            self.logger.info("Connecting to Discord...")
            
            # Start the client connection in background
            client_task = asyncio.create_task(self.client.start(self.token))
            
            # Wait for ready event with timeout
            try:
                await asyncio.wait_for(self.ready.wait(), timeout=timeout)
                self.logger.info("Successfully connected to Discord")
                return True
            except asyncio.TimeoutError:
                self.logger.error(f"Discord connection timed out after {timeout} seconds")
                # Cancel the client task and close connection
                client_task.cancel()
                try:
                    await asyncio.wait_for(client_task, timeout=5)
                except (asyncio.TimeoutError, asyncio.CancelledError):
                    pass
                return False
                
        except Exception as e:
            self.logger.error(f"Failed to connect to Discord: {e}")
            return False

    async def fetch_messages_from_discord(self, since_timestamp: Optional[datetime] = None, include_bots: bool = False, debug_authors: bool = False) -> List[dict]:
        """Fetch messages from Discord channel"""
        if not DISCORD_AVAILABLE:
            self.logger.error("Discord library not available - cannot fetch messages")
            return []
        
        if not self.client or not self.ready:
            self.logger.error("Discord client not initialized")
            return []
        
        # Ensure we're connected (ready event should already be set by connect_to_discord)
        if not self.ready.is_set():
            self.logger.error("Discord client not connected - call connect_to_discord() first")
            return []
        
        try:
            
            if self.channel_id is None:
                raise ValueError("Discord channel_id is not configured. Please set the DISCORD_CHANNEL_ID environment variable.")
            
            channel = self.client.get_channel(self.channel_id)
            if not channel:
                raise ValueError(f"Channel {self.channel_id} not found. Check if the channel ID is correct and the bot has access to it.")
            
            self.logger.info(f"Fetching messages from channel: {channel.name} (ID: {self.channel_id})")
            if since_timestamp:
                self.logger.info(f"Looking for messages after: {since_timestamp}")
            else:
                self.logger.info("Looking for all messages (no timestamp filter)")
            
            messages = []
            message_count = 0
            bot_message_count = 0
            last_progress_report = 0
            
            self.logger.info("Starting to iterate through channel history...")
            if include_bots:
                self.logger.info("⚠️ Including bot/webhook messages in this run")
            
            async for message in channel.history(
                limit=None, 
                after=since_timestamp,
                oldest_first=True
            ):
                message_count += 1
                
                # Progress reporting every 400 messages
                if message_count % 400 == 0:
                    self.logger.info(f"Processing message {message_count}... Latest: {message.created_at}")
                    last_progress_report = message_count
                
                # Debug author information for first 20 messages
                if debug_authors and message_count <= 20:
                    self.logger.info(f"Message {message_count}: Author='{message.author.display_name}' ID={message.author.id} Bot={message.author.bot} Type={type(message.author).__name__}")
                
                if message.author.bot and not include_bots:
                    bot_message_count += 1
                    self.logger.debug(f"Skipping bot message from: {message.author.display_name} (ID: {message.author.id})")
                    continue
                
                # Debug: Log the first few messages to see what we're getting
                if len(messages) < 5:
                    author_type = "BOT" if message.author.bot else "USER"
                    self.logger.info(f"[{author_type}] Message from: {message.author.display_name} (ID: {message.author.id})")
                
                self.logger.debug(f"Found message from {message.author.display_name} at {message.created_at}")
                messages.append({
                    'timestamp': message.created_at,
                    'author': message.author.display_name.lower(),
                    'content': message.content,
                    'id': message.id,
                    'author_id': message.author.id,
                    'is_bot': message.author.bot
                })
                
                # Progress for collected messages every 50
                if len(messages) % 50 == 0:
                    self.logger.info(f"Collected {len(messages)} messages so far...")
            
            self.logger.info(f"Finished processing channel history!")
            self.logger.info(f"Processed {message_count} total messages, {bot_message_count} bot messages, {len(messages)} collected messages")
            return messages
            
        except Exception as e:
            self.logger.error(f"Error fetching messages: {e}")
            return []
    
    def group_messages_into_sessions(self, messages: List[dict]) -> dict:
        """Group messages into sessions based on time gaps"""
        if not messages:
            self.logger.info("No messages to group into sessions")
            return {}
        
        self.logger.info(f"Starting to group {len(messages)} messages into sessions...")
        
        sessions = {}
        current_session_messages = []
        current_session_num = None
        last_message_time = None
        
        tracker = self.load_session_tracker()
        session_counter = tracker.get("last_session", 0)
        self.logger.info(f"Starting from session counter: {session_counter}")
        
        message_count = 0
        for message in messages:
            message_count += 1
            message_time = message['timestamp']
            
            # Progress reporting for long operations
            if message_count % 500 == 0:
                self.logger.info(f"Grouping progress: {message_count}/{len(messages)} messages processed")
            
            # Check for session break
            if (last_message_time and 
                message_time - last_message_time > timedelta(hours=self.session_gap_hours)):
                
                # Save previous session
                if current_session_messages and current_session_num:
                    sessions[current_session_num] = current_session_messages
                    self.logger.info(f"Completed session {current_session_num} with {len(current_session_messages)} messages")
                
                # Start new session
                session_counter += 1
                current_session_num = session_counter
                current_session_messages = []
                self.logger.info(f"Starting new session {current_session_num} due to {self.session_gap_hours}h gap")
            
            elif not current_session_num:
                # First session
                session_counter += 1
                current_session_num = session_counter
                self.logger.info(f"Starting first session {current_session_num}")
            
            current_session_messages.append(message)
            last_message_time = message_time
        
        # Save final session
        if current_session_messages and current_session_num:
            sessions[current_session_num] = current_session_messages
            self.logger.info(f"Completed final session {current_session_num} with {len(current_session_messages)} messages")
        
        self.logger.info(f"Session grouping complete! Created {len(sessions)} sessions: {list(sessions.keys())}")
        
        # Update tracker
        if sessions:
            tracker["last_session"] = max(sessions.keys())
            tracker["total_sessions"] = len(sessions) + tracker.get("total_sessions", 0) - len(sessions)
            tracker["last_message_timestamp"] = messages[-1]['timestamp'].isoformat()
            self.logger.info(f"Updating session tracker: last_session={tracker['last_session']}, last_timestamp={tracker['last_message_timestamp']}")
            self.save_session_tracker(tracker)
        else:
            self.logger.warning("No sessions created - not updating tracker")
        
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
                if not self.client.is_closed():
                    self.logger.info("Closing Discord connection...")
                    await self.client.close()
                else:
                    self.logger.debug("Discord connection already closed")
            except Exception as e:
                self.logger.error(f"Error closing Discord connection: {e}")
        else:
            self.logger.debug("No Discord connection to close")