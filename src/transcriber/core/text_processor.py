"""
Core module for text processing and Discord artifact removal
No AI dependencies - pure Python text manipulation
"""
import re
from typing import List
import logging


class TextProcessor:
    """Handles Discord artifact removal and text formatting"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def format_session_transcript(self, messages: List[dict]) -> str:
        """Format messages into readable transcript"""
        transcript_lines = []
        
        for message in messages:
            author = message['author']
            content = message['content']
            
            # Clean up content
            content = self.remove_discord_artifacts(content)
            
            if content.strip():
                # Check if this is a seavoice bot message with embedded speakers
                if author.lower() == 'seavoice' and '**' in content:
                    # Extract embedded speaker: "**Name**: message content"
                    embedded_match = re.match(r'\*\*([^*]+)\*\*:\s*(.+)', content)
                    if embedded_match:
                        embedded_author = embedded_match.group(1).strip()
                        embedded_content = embedded_match.group(2).strip()
                        transcript_lines.append(f"{embedded_author}: {embedded_content}")
                    else:
                        # Fallback to original format if pattern doesn't match
                        transcript_lines.append(f"{author}: {content}")
                else:
                    # Normal Discord message
                    transcript_lines.append(f"{author}: {content}")
        
        return '\n'.join(transcript_lines)
    
    def remove_discord_artifacts(self, text: str) -> str:
        """Remove Discord-specific artifacts from text"""
        # Remove user mentions
        text = re.sub(r'<@\d+>', '[mention]', text)
        
        # Remove custom emojis
        text = re.sub(r'<:\w+:\d+>', '[emoji]', text)
        
        # Remove animated emojis
        text = re.sub(r'<a:\w+:\d+>', '[animated_emoji]', text)
        
        # Remove channel mentions
        text = re.sub(r'<#\d+>', '[channel]', text)
        
        # Remove role mentions
        text = re.sub(r'<@&\d+>', '[role]', text)
        
        # Clean up excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def detect_system_messages(self, text: str) -> List[str]:
        """Detect Discord system messages that should be filtered out"""
        lines = text.split('\n')
        system_messages = []
        
        system_patterns = [
            r'^\[\d{4}-\d{2}-\d{2}',  # Timestamps
            r'joined the voice channel',
            r'left the voice channel',
            r'started a call',
            r'ended the call',
            r'Bot#\d+',  # Bot messages
            r'^$',  # Empty lines
        ]
        
        for line in lines:
            line = line.strip()
            for pattern in system_patterns:
                if re.search(pattern, line):
                    system_messages.append(line)
                    break
        
        return system_messages
    
    def clean_transcript_content(self, text: str) -> str:
        """Clean transcript content by removing system messages and artifacts"""
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines
            if not line:
                continue
            
            # Skip system messages
            if self._is_system_message(line):
                continue
            
            # Clean Discord artifacts
            cleaned_line = self.remove_discord_artifacts(line)
            
            if cleaned_line:
                cleaned_lines.append(cleaned_line)
        
        return '\n'.join(cleaned_lines)
    
    def _is_system_message(self, line: str) -> bool:
        """Check if a line is a Discord system message"""
        if not line.strip():
            return True
        
        system_patterns = [
            r'^\[\d{4}-\d{2}-\d{2}',  # Timestamps
            r'joined the voice channel',
            r'left the voice channel', 
            r'started a call',
            r'ended the call',
            r'Bot#\d+',  # Bot messages
        ]
        
        for pattern in system_patterns:
            if re.search(pattern, line):
                return True
        
        return False
    
    def extract_speaker_from_line(self, line: str) -> str:
        """Extract speaker name from a dialogue line"""
        match = re.match(r'^([^:]+):\s*', line.strip())
        return match.group(1).strip() if match else ""
    
    def get_text_metrics(self, text: str) -> dict:
        """Get basic text metrics for quality analysis"""
        lines = text.split('\n')
        words = text.split()
        
        # Count dialogue lines (lines with speaker pattern)
        dialogue_lines = []
        speakers = set()
        
        for line in lines:
            speaker = self.extract_speaker_from_line(line)
            if speaker:
                dialogue_lines.append(line)
                speakers.add(speaker)
        
        return {
            'total_lines': len(lines),
            'total_words': len(words),
            'dialogue_lines': len(dialogue_lines),
            'unique_speakers': len(speakers),
            'speakers': speakers,
            'avg_words_per_line': len(words) / len(lines) if lines else 0
        }