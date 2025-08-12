"""
Session statistics analyzer using shared character mapping
"""
from pathlib import Path
import json
from collections import defaultdict
import re
from processing.speaker_mapper import ROGUE_TRADER_PLAYER_MAPPING

# Configuration
CAMPAIGN_NAME = "rogue_trader"

# Convert character mapping to legacy format for stats
PLAYER_MAPPING = {k: v['canonical_name'] for k, v in ROGUE_TRADER_PLAYER_MAPPING.items()}

class StatsAnalyzer:
    def __init__(self):
        """Initialize analyzer and find correct paths"""
        current_dir = Path.cwd()
        if (current_dir / "all_data").exists():
            base_dir = current_dir
        elif (current_dir.parent / "all_data").exists():
            base_dir = current_dir.parent
        else:
            base_dir = current_dir
            print(f"⚠️ Could not find 'all_data' directory. Using current directory as base: {base_dir}")
        
        self.campaign_dir = base_dir / "all_data" / CAMPAIGN_NAME
        self.sessions_dir = self.campaign_dir / "sessions"
        
        print(f"📊 Stats Analyzer for campaign: {CAMPAIGN_NAME}")
        print(f"📂 Looking for session files in: {self.sessions_dir}")

    def analyze_all_sessions(self):
        """Find all session files, analyze them, and save stats"""
        session_files = sorted(self.sessions_dir.glob("session-*.txt"))
        
        if not session_files:
            print("❌ No session files found to analyze.")
            return

        print(f"📈 Found {len(session_files)} session files. Analyzing...")

        session_stats = defaultdict(lambda: defaultdict(lambda: {'messages': 0, 'words': 0}))
        
        for file_path in session_files:
            session_name = file_path.stem 
            print(f"   -> Processing {session_name}...")
            
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    parts = line.strip().split(': ', 1)
                    if len(parts) == 2:
                        raw_author, content = parts
                        
                        # Apply player mapping
                        player_name = PLAYER_MAPPING.get(raw_author, raw_author)
                        
                        session_stats[session_name][player_name]['messages'] += 1
                        session_stats[session_name][player_name]['words'] += len(content.split())
        
        overall_stats = self._calculate_overall_stats(session_stats)
        engagement_stats = self._calculate_engagement_stats(overall_stats, session_stats)
        
        self.display_stats(session_stats, overall_stats, engagement_stats)
        self.save_stats_to_tracker(session_stats, overall_stats, engagement_stats)

    def _calculate_overall_stats(self, session_stats):
        """Aggregate stats from all sessions"""
        overall = defaultdict(lambda: {'messages': 0, 'words': 0})
        for session_data in session_stats.values():
            for author, data in session_data.items():
                overall[author]['messages'] += data['messages']
                overall[author]['words'] += data['words']
        return dict(overall)

    def _calculate_engagement_stats(self, overall_stats, session_stats):
        """Calculate sessions attended and average contributions"""
        engagement = {}
        total_sessions = len(session_stats)
        
        for player in overall_stats:
            sessions_attended = sum(1 for session in session_stats.values() if player in session)
            avg_messages = overall_stats[player]['messages'] / sessions_attended if sessions_attended > 0 else 0
            avg_words = overall_stats[player]['words'] / sessions_attended if sessions_attended > 0 else 0
            
            engagement[player] = {
                'sessions_attended': sessions_attended,
                'attendance_rate': (sessions_attended / total_sessions) * 100 if total_sessions > 0 else 0,
                'avg_messages_per_session': avg_messages,
                'avg_words_per_session': avg_words
            }
        
        return engagement

    def display_stats(self, session_stats, overall_stats, engagement_stats):
        """Display comprehensive statistics"""
        print(f"\n" + "="*80)
        print(f"📊 SESSION STATISTICS REPORT - {CAMPAIGN_NAME.upper()}")
        print(f"="*80)
        
        print(f"\n📋 OVERALL STATISTICS:")
        print(f"{'Player':<40} {'Messages':<10} {'Words':<10} {'Avg Words/Msg':<15}")
        print("-" * 80)
        
        sorted_players = sorted(overall_stats.items(), key=lambda x: x[1]['messages'], reverse=True)
        
        for player, stats in sorted_players:
            avg_words_per_msg = stats['words'] / stats['messages'] if stats['messages'] > 0 else 0
            print(f"{player:<40} {stats['messages']:<10} {stats['words']:<10} {avg_words_per_msg:<15.1f}")
        
        print(f"\n📈 ENGAGEMENT STATISTICS:")
        print(f"{'Player':<40} {'Sessions':<10} {'Attendance':<12} {'Avg Msg/Session':<16}")
        print("-" * 80)
        
        for player, stats in sorted_players:
            engagement = engagement_stats[player]
            print(f"{player:<40} {engagement['sessions_attended']:<10} "
                  f"{engagement['attendance_rate']:<11.1f}% {engagement['avg_messages_per_session']:<16.1f}")
        
        print(f"\n📝 SESSION BREAKDOWN:")
        for session_name in sorted(session_stats.keys()):
            print(f"\n{session_name}:")
            session_data = session_stats[session_name]
            session_sorted = sorted(session_data.items(), key=lambda x: x[1]['messages'], reverse=True)
            
            for player, stats in session_sorted:
                print(f"  {player:<35} {stats['messages']:>3} messages, {stats['words']:>4} words")

    def save_stats_to_tracker(self, session_stats, overall_stats, engagement_stats):
        """Save statistics to the session tracker file"""
        tracker_file = self.campaign_dir / "session_tracker.json"
        
        # Load existing tracker or create new
        if tracker_file.exists():
            with open(tracker_file, 'r') as f:
                tracker_data = json.load(f)
        else:
            tracker_data = {}
        
        # Add statistics
        tracker_data['statistics'] = {
            'overall_stats': overall_stats,
            'engagement_stats': engagement_stats,
            'total_sessions_analyzed': len(session_stats),
            'last_analysis': str(Path().cwd())
        }
        
        # Save updated tracker
        with open(tracker_file, 'w') as f:
            json.dump(tracker_data, f, indent=2)
        
        print(f"\n💾 Statistics saved to: {tracker_file}")

def main():
    analyzer = StatsAnalyzer()
    analyzer.analyze_all_sessions()

if __name__ == "__main__":
    main()