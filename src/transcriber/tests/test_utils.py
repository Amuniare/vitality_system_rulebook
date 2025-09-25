"""
Testing utilities for session processing validation
"""
from pathlib import Path
from typing import Dict, List, Optional
import json
import logging
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from ai.ai_pipeline import AIPipeline
from processing.content_analyzer import ContentAnalyzer

class SessionTester:
    """Utilities for testing and validating session processing"""
    
    def __init__(self, campaign_dir: Path):
        self.campaign_dir = campaign_dir
        self.sessions_dir = campaign_dir / "sessions"
        self.analyzer = ContentAnalyzer()
        self.logger = logging.getLogger(__name__)
    
    def create_test_session(self, session_number: int, max_lines: int = 100) -> Optional[str]:
        """Extract first N lines of a session for testing"""
        raw_file = self.sessions_dir / "raw" / f"session-{session_number:02d}-raw.txt"
        
        if not raw_file.exists():
            self.logger.error(f"Raw session file not found: {raw_file}")
            return None
        
        with open(raw_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        test_content = ''.join(lines[:max_lines])
        
        # Save test session
        test_file = self.sessions_dir / "raw" / f"session-{session_number:02d}-test.txt"
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write(test_content)
        
        self.logger.info(f"Created test session: {test_file} ({max_lines} lines)")
        return test_content
    
    def manual_verification_mode(self, session_number: int):
        """Step-by-step processing with manual verification"""
        print(f"\n🧪 MANUAL VERIFICATION MODE - Session {session_number}")
        print("=" * 60)
        
        # Check if raw session exists
        raw_file = self.sessions_dir / "raw" / f"session-{session_number:02d}-raw.txt"
        if not raw_file.exists():
            print(f"❌ Raw session file not found: {raw_file}")
            return
        
        # Load raw content
        with open(raw_file, 'r', encoding='utf-8') as f:
            raw_content = f.read()
        
        print(f"📄 Raw session loaded: {len(raw_content.split())} words, {len(raw_content.split(chr(10)))} lines")
        
        # Initialize pipeline
        try:
            pipeline = AIPipeline(str(self.campaign_dir.parent), campaign_name="rogue_trader")
        except Exception as e:
            print(f"❌ Failed to initialize pipeline: {e}")
            return
        
        # Step 1: Test cleanup
        print(f"\n🧹 Step 1: Testing cleanup stage...")
        input("Press Enter to continue...")
        
        cleaned = pipeline.cleanup_processor.process(raw_content, session_number)
        if cleaned:
            print(f"✅ Cleanup successful: {len(cleaned.split())} words")
            analysis = self.analyzer.analyze_session_content(raw_content, cleaned)
            print(self.analyzer.generate_quality_report(session_number, analysis))
        else:
            print(f"❌ Cleanup failed")
            return
        
        # Step 2: Test timeline
        print(f"\n📅 Step 2: Testing timeline stage...")
        input("Press Enter to continue...")
        
        timeline = pipeline.timeline_processor.process(cleaned, session_number)
        if timeline:
            bullet_count = timeline.count('•') + timeline.count('* ')
            print(f"✅ Timeline successful: {bullet_count} bullet points")
        else:
            print(f"❌ Timeline failed")
            return
        
        # Step 3: Test notes
        print(f"\n📝 Step 3: Testing notes stage...")
        input("Press Enter to continue...")
        
        notes = pipeline.notes_processor.process(timeline, session_number)
        if notes:
            notes_count = notes.count('•') + notes.count('* ')
            print(f"✅ Notes successful: {notes_count} bullet points")
        else:
            print(f"❌ Notes failed")
            return
        
        # Step 4: Test summary
        print(f"\n📋 Step 4: Testing summary stage...")
        input("Press Enter to continue...")
        
        summary = pipeline.summary_processor.process(notes, timeline, session_number)
        if summary:
            paragraph_count = len([p for p in summary.split('\n\n') if p.strip()])
            print(f"✅ Summary successful: {paragraph_count} paragraphs")
        else:
            print(f"❌ Summary failed")
            return
        
        # Final validation
        print(f"\n✅ ALL STAGES COMPLETED SUCCESSFULLY!")
        self._save_test_results(session_number, {
            'cleaned': cleaned,
            'timeline': timeline,
            'notes': notes,
            'summary': summary
        })
    
    def _save_test_results(self, session_number: int, results: Dict[str, str]):
        """Save test results for comparison"""
        test_dir = self.sessions_dir / "test"
        test_dir.mkdir(exist_ok=True)
        
        for stage, content in results.items():
            if content:
                test_file = test_dir / f"session-{session_number:02d}-{stage}-test.txt"
                with open(test_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"💾 Saved test {stage}: {test_file.name}")
    
    def compare_processing_stages(self, session_number: int) -> Dict:
        """Compare all processing stages for a session"""
        stages = ['raw', 'cleaned', 'timeline', 'notes', 'summary']
        results = {}
        
        for stage in stages:
            stage_dir = "raw" if stage == "raw" else stage + "s"  # Handle pluralization
            file_path = self.sessions_dir / stage_dir / f"session-{session_number:02d}-{stage}.txt"
            if stage != "raw":
                file_path = file_path.with_suffix('.md')  # Most stages use .md
            
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                results[stage] = {
                    'path': str(file_path),
                    'words': len(content.split()),
                    'lines': len(content.split('\n')),
                    'exists': True
                }
            else:
                results[stage] = {'exists': False}
        
        return results
    
    def validate_character_mapping(self, session_number: int) -> Dict:
        """Test character mapping accuracy"""
        from processing.speaker_mapper import CharacterMapper
        
        mapper = CharacterMapper("rogue_trader")
        
        # Load cleaned session
        cleaned_file = self.sessions_dir / "cleaned" / f"session-{session_number:02d}-cleaned.txt"
        if not cleaned_file.exists():
            return {'error': 'Cleaned session not found'}
        
        with open(cleaned_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        detected_speakers = mapper.detect_speakers_in_text(content)
        all_known = mapper.get_all_known_characters()
        
        return {
            'detected_speakers': len(detected_speakers),
            'known_characters': len(all_known),
            'mapping_coverage': len(detected_speakers) / len(all_known) if all_known else 0,
            'speakers': [s['character_name'] for s in detected_speakers]
        }