"""
Diagnostic utilities for analyzing content loss and processing quality
"""
from typing import Dict, List, Tuple, Set
import re
from collections import Counter
import logging

class ContentAnalyzer:
    """Analyzes session content to track processing quality and loss patterns"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def analyze_session_content(self, raw_text: str, cleaned_text: str) -> Dict:
        """Comprehensive analysis of content changes between raw and cleaned sessions"""
        raw_metrics = self._extract_metrics(raw_text)
        cleaned_metrics = self._extract_metrics(cleaned_text)
        
        return {
            'raw': raw_metrics,
            'cleaned': cleaned_metrics,
            'retention_rates': {
                'lines': (cleaned_metrics['lines'] / raw_metrics['lines']) * 100 if raw_metrics['lines'] > 0 else 0,
                'words': (cleaned_metrics['words'] / raw_metrics['words']) * 100 if raw_metrics['words'] > 0 else 0,
                'speakers': (len(cleaned_metrics['speakers']) / len(raw_metrics['speakers'])) * 100 if raw_metrics['speakers'] else 0,
                'dialogue_lines': (cleaned_metrics['dialogue_lines'] / raw_metrics['dialogue_lines']) * 100 if raw_metrics['dialogue_lines'] > 0 else 0
            }
        }
    
    def _extract_metrics(self, text: str) -> Dict:
        """Extract key metrics from session text"""
        lines = text.split('\n')
        words = text.split()
        
        # Find dialogue lines (lines with speaker pattern)
        dialogue_pattern = r'^([^:]+):\s*(.+)$'
        dialogue_lines = []
        speakers = set()
        
        for line in lines:
            match = re.match(dialogue_pattern, line.strip())
            if match:
                speaker, content = match.groups()
                dialogue_lines.append(line)
                speakers.add(speaker.strip())
        
        # Detect system messages (timestamps, joins, etc.)
        system_messages = [line for line in lines if self._is_system_message(line)]
        
        return {
            'lines': len(lines),
            'words': len(words),
            'speakers': speakers,
            'dialogue_lines': len(dialogue_lines),
            'system_messages': len(system_messages),
            'average_words_per_line': len(words) / len(lines) if lines else 0
        }
    
    def _is_system_message(self, line: str) -> bool:
        """Detect Discord system messages that should be removed"""
        line = line.strip()
        if not line:
            return True
        
        # Common Discord artifacts
        system_patterns = [
            r'^\[\d{4}-\d{2}-\d{2}',  # Timestamps
            r'<@\d+>',  # User mentions
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
    
    def detect_content_loss_patterns(self, raw_text: str, cleaned_text: str) -> List[str]:
        """Identify specific patterns of content loss"""
        patterns = []
        
        raw_speakers = self._extract_metrics(raw_text)['speakers']
        cleaned_speakers = self._extract_metrics(cleaned_text)['speakers']
        
        missing_speakers = raw_speakers - cleaned_speakers
        if missing_speakers:
            patterns.append(f"Missing speakers: {', '.join(missing_speakers)}")
        
        # Check for specific content types
        content_checks = {
            'combat_actions': r'\[.*(?:attack|damage|roll|dice)\.*\]',
            'out_of_character': r'\(\(.*\)\)|\[OOC.*\]',
            'dice_rolls': r'\d+d\d+|\+\d+|\-\d+',
            'game_mechanics': r'(?:HP|stress|condition|ability|power)',
        }
        
        for content_type, pattern in content_checks.items():
            raw_count = len(re.findall(pattern, raw_text, re.IGNORECASE))
            cleaned_count = len(re.findall(pattern, cleaned_text, re.IGNORECASE))
            
            if raw_count > 0:
                retention = (cleaned_count / raw_count) * 100
                if retention < 50:
                    patterns.append(f"Low {content_type} retention: {retention:.0f}% ({cleaned_count}/{raw_count})")
        
        return patterns
    
    def validate_speaker_preservation(self, raw_text: str, cleaned_text: str) -> Dict:
        """Validate that all speakers are preserved during cleaning"""
        raw_speakers = self._extract_metrics(raw_text)['speakers']
        cleaned_speakers = self._extract_metrics(cleaned_text)['speakers']
        
        missing_speakers = list(raw_speakers - cleaned_speakers)
        new_speakers = list(cleaned_speakers - raw_speakers)
        
        return {
            'total_raw_speakers': len(raw_speakers),
            'total_cleaned_speakers': len(cleaned_speakers),
            'missing_speakers': missing_speakers,
            'new_speakers': new_speakers,
            'speaker_retention_rate': (len(cleaned_speakers) / len(raw_speakers)) * 100 if raw_speakers else 0
        }
    
    def generate_quality_report(self, session_number: int, analysis: Dict) -> str:
        """Generate a human-readable quality report"""
        retention = analysis['retention_rates']
        
        report = f"\n=== QUALITY REPORT: Session {session_number} ===\n"
        report += f"Content Retention: {retention['words']:.1f}% words, {retention['lines']:.1f}% lines\n"
        report += f"Speaker Retention: {retention['speakers']:.1f}% ({len(analysis['cleaned']['speakers'])}/{len(analysis['raw']['speakers'])})\n"
        report += f"Dialogue Retention: {retention['dialogue_lines']:.1f}%\n"
        
        # Quality assessment
        if retention['words'] >= 70 and retention['speakers'] >= 90:
            report += "✅ QUALITY: Good\n"
        elif retention['words'] >= 50 and retention['speakers'] >= 80:
            report += "⚠️  QUALITY: Acceptable\n"
        else:
            report += "❌ QUALITY: Poor - Review needed\n"
        
        return report