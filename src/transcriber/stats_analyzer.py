# <<< MODIFIED SCRIPT: stats_analyzer.py >>>
# This script analyzes existing session transcripts to generate statistics.
# It now includes player mapping for "amuniare" and derived engagement stats.

from pathlib import Path
import json
from collections import defaultdict
import re

# --- Configuration ---
# This should match the CAMPAIGN_NAME in your transcriber.py
CAMPAIGN_NAME = "mutants"

# --- Player Mapping ---
# Map Discord usernames (from the logs) to a canonical player name.
# This handles cases where players change names or have multiple accounts.
# Any author name from the logs NOT in this map will be treated as their own player.
PLAYER_MAPPING = {
    "bipolarfrenchie": "Nick",
    "syrjayko": "Synth",
    "sexissinful": "Pandora",
    "diegoslowing02": "Marquis",
    "jubbuh": "Jubb",
    "amuniare": "Trent" # <<< ADDED THIS MAPPING
    # "SeaVoice" and "uristmcvoice" are not in the map and will appear as themselves.
}

class StatsAnalyzer:
    def __init__(self):
        """Initializes the analyzer and finds the correct paths."""
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
        """Finds all session files, analyzes them, and saves the stats."""
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
        """Aggregates stats from all sessions into a total."""
        overall = defaultdict(lambda: {'messages': 0, 'words': 0})
        for session_data in session_stats.values():
            for author, data in session_data.items():
                overall[author]['messages'] += data['messages']
                overall[author]['words'] += data['words']
        return dict(overall)

    def _calculate_engagement_stats(self, overall_stats, session_stats):
        """Calculates sessions attended and average contributions."""
        engagement = defaultdict(dict)
        player_sessions = defaultdict(set)

        # First, find out which sessions each player participated in
        for session_name, authors in session_stats.items():
            for author in authors.keys():
                player_sessions[author].add(session_name)
        
        # Now calculate the derived stats for each player
        for player, total_data in overall_stats.items():
            sessions_attended = len(player_sessions.get(player, []))
            
            if sessions_attended > 0:
                avg_messages = total_data['messages'] / sessions_attended
                avg_words = total_data['words'] / sessions_attended
            else: # Avoid division by zero
                avg_messages = 0
                avg_words = 0
            
            engagement[player] = {
                "sessions_attended": sessions_attended,
                "avg_messages_per_session": round(avg_messages, 1),
                "avg_words_per_session": round(avg_words, 1)
            }
        return dict(engagement)

    def display_stats(self, session_stats, overall_stats, engagement_stats):
        """Prints all collected statistics in formatted tables."""
        print("\n" + "="*60)
        print("📊 OVERALL CAMPAIGN STATISTICS")
        print("="*60)
        
        if not overall_stats:
            print("No data to generate stats.")
            return

        sorted_players = sorted(overall_stats.items(), key=lambda item: item[1]['messages'], reverse=True)

        print(f"{'Player':<25} | {'Total Messages':>15} | {'Total Words':>15}")
        print("-" * 60)
        
        total_messages = 0
        total_words = 0

        for player, data in sorted_players:
            print(f"{player:<25} | {data['messages']:>15,} | {data['words']:>15,}")
            total_messages += data['messages']
            total_words += data['words']

        print("-" * 60)
        print(f"{'TOTAL':<25} | {total_messages:>15,} | {total_words:>15,}")
        
        # --- New Player Engagement Section ---
        print("\n" + "="*85)
        print("PLAYER ENGAGEMENT (AVERAGES PER SESSION ATTENDED)")
        print("="*85)
        
        print(f"{'Player':<25} | {'Sessions Attended':>20} | {'Avg Msgs/Session':>18} | {'Avg Words/Session':>18}")
        print("-" * 85)

        for player, data in sorted_players:
            eng_data = engagement_stats.get(player, {})
            sessions = eng_data.get('sessions_attended', 0)
            avg_msgs = eng_data.get('avg_messages_per_session', 0)
            avg_words = eng_data.get('avg_words_per_session', 0)
            print(f"{player:<25} | {sessions:>20,} | {avg_msgs:>18,.1f} | {avg_words:>18,.1f}")

        print("-" * 85)
        
        # --- Per Session Breakdown ---
        for session_name, author_stats in session_stats.items():
            print(f"\n--- {session_name.replace('-', ' ').title()} Statistics ---")
            
            sorted_authors = sorted(author_stats.items(), key=lambda item: item[1]['messages'], reverse=True)
            
            print(f"{'Player':<25} | {'Messages':>10} | {'Words':>10}")
            print("-" * 50)

            session_total_messages = 0
            session_total_words = 0
            for author, data in sorted_authors:
                print(f"{author:<25} | {data['messages']:>10,} | {data['words']:>10,}")
                session_total_messages += data['messages']
                session_total_words += data['words']

            print("-" * 50)
            print(f"{'SESSION TOTAL':<25} | {session_total_messages:>10,} | {session_total_words:>10,}")
        print("\n" + "="*60)

    def save_stats_to_tracker(self, session_stats, overall_stats, engagement_stats):
        """Loads the tracker, adds all stats, and saves it back."""
        tracker_file = self.campaign_dir / "session_tracker.json"
        
        if not tracker_file.exists():
            print(f"⚠️ Tracker file not found at {tracker_file}. Creating a new one with stats.")
            data = {}
        else:
            try:
                with open(tracker_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except json.JSONDecodeError:
                print(f"⚠️ Could not decode JSON from {tracker_file}. Creating a new one.")
                data = {}

        data['statistics'] = session_stats
        data['overall_stats'] = overall_stats
        data['engagement_stats'] = engagement_stats
        
        try:
            with open(tracker_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, sort_keys=True)
            print(f"✅ Statistics successfully saved to {tracker_file}")
        except Exception as e:
            print(f"❌ Error saving stats to tracker file: {e}")


if __name__ == "__main__":
    analyzer = StatsAnalyzer()
    analyzer.analyze_all_sessions()
    print("\n🏁 Analysis complete!")
    input("Press Enter to close...")