#!/usr/bin/env python3
"""
Performance Analyzer - Processes simulation results for game balance insights

This script analyzes the CSV output from gauntlet runs to generate comprehensive
reports about character performance, game balance, and statistical outliers.
"""

import argparse
import csv
import json
import os
import sys
from collections import defaultdict, Counter
from pathlib import Path
from typing import Dict, List, Any, Tuple
import statistics

# Optional imports for visualization (graceful degradation)
try:
    import matplotlib.pyplot as plt
    import matplotlib.patches as patches
    import seaborn as sns
    VISUALIZATION_AVAILABLE = True
except ImportError:
    VISUALIZATION_AVAILABLE = False
    print("Warning: matplotlib/seaborn not available. Visualizations will be skipped.")

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("Warning: pandas not available. Some advanced analysis features will be limited.")


class PerformanceAnalyzer:
    """
    Analyzes simulation results to generate game balance insights.
    """
    
    def __init__(self, verbose: bool = False):
        """
        Initialize the analyzer.
        
        Args:
            verbose: Enable detailed progress reporting
        """
        self.verbose = verbose
        self.data = []
        self.analysis_results = {}
        self.report_dir = Path(__file__).parent / "reports"
        self.report_dir.mkdir(exist_ok=True)
    
    def load_data(self, csv_file: str) -> int:
        """
        Load simulation results from CSV file.
        
        Args:
            csv_file: Path to CSV file containing simulation results
            
        Returns:
            Number of records loaded
        """
        if not os.path.exists(csv_file):
            raise FileNotFoundError(f"CSV file not found: {csv_file}")
        
        self.data = []
        
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Convert numeric fields
                numeric_fields = [
                    'character_tier', 'rounds_completed', 'turns_completed',
                    'total_damage_dealt', 'total_damage_taken', 
                    'player_hp_remaining', 'player_hp_max',
                    'combat_accuracy', 'combat_damage', 'combat_defense',
                    'special_attacks_count'
                ]
                
                for field in numeric_fields:
                    if field in row and row[field]:
                        try:
                            row[field] = int(row[field]) if row[field].isdigit() else float(row[field])
                        except (ValueError, TypeError):
                            row[field] = 0
                
                self.data.append(row)
        
        if self.verbose:
            print(f"📊 Loaded {len(self.data)} simulation records")
        
        return len(self.data)
    
    def analyze_win_rates(self) -> Dict[str, Any]:
        """Analyze win rates by various categories."""
        if self.verbose:
            print("🏆 Analyzing win rates...")
        
        # Overall win rate
        total_battles = len(self.data)
        player_victories = len([r for r in self.data if r['victory_result'] == 'player_victory'])
        overall_win_rate = player_victories / total_battles if total_battles > 0 else 0
        
        # Win rates by scenario
        scenario_stats = defaultdict(lambda: {'wins': 0, 'total': 0})
        for record in self.data:
            scenario = record['scenario_name']
            scenario_stats[scenario]['total'] += 1
            if record['victory_result'] == 'player_victory':
                scenario_stats[scenario]['wins'] += 1
        
        scenario_win_rates = {}
        for scenario, stats in scenario_stats.items():
            scenario_win_rates[scenario] = {
                'win_rate': stats['wins'] / stats['total'] if stats['total'] > 0 else 0,
                'wins': stats['wins'],
                'total': stats['total']
            }
        
        # Win rates by character tier
        tier_stats = defaultdict(lambda: {'wins': 0, 'total': 0})
        for record in self.data:
            tier = record.get('character_tier', 1)
            tier_stats[tier]['total'] += 1
            if record['victory_result'] == 'player_victory':
                tier_stats[tier]['wins'] += 1
        
        tier_win_rates = {}
        for tier, stats in tier_stats.items():
            tier_win_rates[tier] = {
                'win_rate': stats['wins'] / stats['total'] if stats['total'] > 0 else 0,
                'wins': stats['wins'],
                'total': stats['total']
            }
        
        results = {
            'overall_win_rate': overall_win_rate,
            'total_battles': total_battles,
            'player_victories': player_victories,
            'scenario_win_rates': scenario_win_rates,
            'tier_win_rates': tier_win_rates
        }
        
        self.analysis_results['win_rates'] = results
        return results
    
    def analyze_damage_metrics(self) -> Dict[str, Any]:
        """Analyze damage dealing and taking patterns."""
        if self.verbose:
            print("⚔️ Analyzing damage metrics...")
        
        # Filter out battles with no damage data
        valid_records = [r for r in self.data if r.get('total_damage_dealt', 0) > 0]
        
        if not valid_records:
            return {'error': 'No valid damage data found'}
        
        # Damage dealt statistics
        damage_dealt = [r['total_damage_dealt'] for r in valid_records]
        damage_taken = [r['total_damage_taken'] for r in valid_records]
        
        # Calculate DPR (Damage Per Round)
        dpr_values = []
        for record in valid_records:
            rounds = record.get('rounds_completed', 1)
            if rounds > 0:
                dpr = record['total_damage_dealt'] / rounds
                dpr_values.append(dpr)
        
        # Damage by scenario
        scenario_damage = defaultdict(list)
        for record in valid_records:
            scenario = record['scenario_name']
            scenario_damage[scenario].append(record['total_damage_dealt'])
        
        scenario_avg_damage = {}
        for scenario, damages in scenario_damage.items():
            scenario_avg_damage[scenario] = {
                'avg_damage': statistics.mean(damages),
                'median_damage': statistics.median(damages),
                'min_damage': min(damages),
                'max_damage': max(damages),
                'sample_size': len(damages)
            }
        
        results = {
            'damage_dealt_stats': {
                'mean': statistics.mean(damage_dealt),
                'median': statistics.median(damage_dealt),
                'stdev': statistics.stdev(damage_dealt) if len(damage_dealt) > 1 else 0,
                'min': min(damage_dealt),
                'max': max(damage_dealt)
            },
            'damage_taken_stats': {
                'mean': statistics.mean(damage_taken),
                'median': statistics.median(damage_taken),
                'stdev': statistics.stdev(damage_taken) if len(damage_taken) > 1 else 0,
                'min': min(damage_taken),
                'max': max(damage_taken)
            },
            'dpr_stats': {
                'mean': statistics.mean(dpr_values) if dpr_values else 0,
                'median': statistics.median(dpr_values) if dpr_values else 0,
                'stdev': statistics.stdev(dpr_values) if len(dpr_values) > 1 else 0,
                'sample_size': len(dpr_values)
            },
            'scenario_damage_analysis': scenario_avg_damage
        }
        
        self.analysis_results['damage_metrics'] = results
        return results
    
    def identify_outliers(self, threshold: float = 2.0) -> Dict[str, Any]:
        """Identify statistical outliers in performance."""
        if self.verbose:
            print("🔍 Identifying performance outliers...")
        
        outliers = {
            'high_performers': [],
            'low_performers': [],
            'unusual_patterns': []
        }
        
        # Calculate z-scores for damage dealt
        damage_values = [r.get('total_damage_dealt', 0) for r in self.data]
        if len(damage_values) > 1:
            mean_damage = statistics.mean(damage_values)
            stdev_damage = statistics.stdev(damage_values)
            
            if stdev_damage > 0:
                for record in self.data:
                    damage = record.get('total_damage_dealt', 0)
                    z_score = (damage - mean_damage) / stdev_damage
                    
                    if abs(z_score) > threshold:
                        outlier_info = {
                            'character_name': record.get('character_name', 'Unknown'),
                            'scenario_name': record.get('scenario_name', 'Unknown'),
                            'damage_dealt': damage,
                            'z_score': z_score,
                            'victory_result': record.get('victory_result', 'unknown')
                        }
                        
                        if z_score > threshold:
                            outliers['high_performers'].append(outlier_info)
                        else:
                            outliers['low_performers'].append(outlier_info)
        
        # Find characters with unusual win/loss patterns
        character_performance = defaultdict(lambda: {'wins': 0, 'total': 0})
        for record in self.data:
            char_name = record.get('character_name', 'Unknown')
            character_performance[char_name]['total'] += 1
            if record['victory_result'] == 'player_victory':
                character_performance[char_name]['wins'] += 1
        
        for char_name, perf in character_performance.items():
            if perf['total'] >= 3:  # Only consider characters with multiple battles
                win_rate = perf['wins'] / perf['total']
                if win_rate == 0.0 or win_rate == 1.0:
                    outliers['unusual_patterns'].append({
                        'character_name': char_name,
                        'win_rate': win_rate,
                        'wins': perf['wins'],
                        'total': perf['total'],
                        'pattern': 'perfect_record' if win_rate == 1.0 else 'no_wins'
                    })
        
        self.analysis_results['outliers'] = outliers
        return outliers
    
    def generate_balance_report(self) -> str:
        """Generate a comprehensive game balance report."""
        if self.verbose:
            print("📝 Generating balance report...")
        
        timestamp = self.data[0]['simulation_timestamp'] if self.data else 'unknown'
        report_file = self.report_dir / f"balance_report_{timestamp}.md"
        
        # Run all analyses if not already done
        if 'win_rates' not in self.analysis_results:
            self.analyze_win_rates()
        if 'damage_metrics' not in self.analysis_results:
            self.analyze_damage_metrics()
        if 'outliers' not in self.analysis_results:
            self.identify_outliers()
        
        # Generate report content
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(f"# Vitality Game Balance Report\n\n")
            f.write(f"**Generated:** {timestamp}  \n")
            f.write(f"**Total Simulations:** {len(self.data)}  \n")
            f.write(f"**Analysis Tool:** Performance Analyzer v1.0\n\n")
            
            # Executive Summary
            f.write("## Executive Summary\n\n")
            win_rate = self.analysis_results['win_rates']['overall_win_rate']
            f.write(f"- **Overall Player Win Rate:** {win_rate:.1%}\n")
            
            if win_rate < 0.4:
                f.write("- **🔴 CONCERN:** Player win rate is below 40% - scenarios may be too difficult\n")
            elif win_rate > 0.7:
                f.write("- **🔴 CONCERN:** Player win rate is above 70% - scenarios may be too easy\n")
            else:
                f.write("- **🟢 GOOD:** Player win rate is in healthy range (40-70%)\n")
            
            # Win Rate Analysis
            f.write("\n## Win Rate Analysis\n\n")
            f.write("### By Scenario\n\n")
            scenario_rates = self.analysis_results['win_rates']['scenario_win_rates']
            for scenario, stats in sorted(scenario_rates.items()):
                win_rate = stats['win_rate']
                f.write(f"- **{scenario}:** {win_rate:.1%} ({stats['wins']}/{stats['total']})\n")
            
            f.write("\n### By Character Tier\n\n")
            tier_rates = self.analysis_results['win_rates']['tier_win_rates']
            for tier, stats in sorted(tier_rates.items()):
                win_rate = stats['win_rate']
                f.write(f"- **Tier {tier}:** {win_rate:.1%} ({stats['wins']}/{stats['total']})\n")
            
            # Damage Analysis
            f.write("\n## Damage Analysis\n\n")
            damage_stats = self.analysis_results['damage_metrics']
            
            if 'error' not in damage_stats:
                dealt_stats = damage_stats['damage_dealt_stats']
                f.write(f"**Average Damage Dealt:** {dealt_stats['mean']:.1f} ± {dealt_stats['stdev']:.1f}  \n")
                f.write(f"**Damage Range:** {dealt_stats['min']} - {dealt_stats['max']}  \n")
                
                dpr_stats = damage_stats['dpr_stats']
                f.write(f"**Average DPR:** {dpr_stats['mean']:.2f} ± {dpr_stats['stdev']:.2f}  \n")
            
            # Outlier Analysis
            f.write("\n## Performance Outliers\n\n")
            outliers = self.analysis_results['outliers']
            
            f.write(f"### High Performers ({len(outliers['high_performers'])})\n\n")
            for outlier in outliers['high_performers'][:5]:  # Top 5
                f.write(f"- {outlier['character_name']} vs {outlier['scenario_name']}: ")
                f.write(f"{outlier['damage_dealt']} damage (z-score: {outlier['z_score']:.2f})\n")
            
            f.write(f"\n### Low Performers ({len(outliers['low_performers'])})\n\n")
            for outlier in outliers['low_performers'][:5]:  # Bottom 5
                f.write(f"- {outlier['character_name']} vs {outlier['scenario_name']}: ")
                f.write(f"{outlier['damage_dealt']} damage (z-score: {outlier['z_score']:.2f})\n")
            
            # Recommendations
            f.write("\n## Recommendations\n\n")
            
            # Win rate recommendations
            problematic_scenarios = []
            for scenario, stats in scenario_rates.items():
                if stats['win_rate'] < 0.3 or stats['win_rate'] > 0.8:
                    problematic_scenarios.append((scenario, stats['win_rate']))
            
            if problematic_scenarios:
                f.write("### Scenario Balance Issues\n\n")
                for scenario, win_rate in problematic_scenarios:
                    if win_rate < 0.3:
                        f.write(f"- **{scenario}**: Consider reducing difficulty (win rate: {win_rate:.1%})\n")
                    else:
                        f.write(f"- **{scenario}**: Consider increasing difficulty (win rate: {win_rate:.1%})\n")
            
            # Tier progression recommendations
            tier_progression = []
            for tier in sorted(tier_rates.keys()):
                tier_progression.append((tier, tier_rates[tier]['win_rate']))
            
            f.write("\n### Character Progression\n\n")
            if len(tier_progression) > 1:
                for i in range(len(tier_progression) - 1):
                    current_tier, current_rate = tier_progression[i]
                    next_tier, next_rate = tier_progression[i + 1]
                    
                    if next_rate <= current_rate:
                        f.write(f"- **Tier {next_tier}** should outperform Tier {current_tier} ")
                        f.write(f"(currently {next_rate:.1%} vs {current_rate:.1%})\n")
            
            f.write("\n---\n")
            f.write("*Report generated by Vitality Performance Analyzer*\n")
        
        if self.verbose:
            print(f"📄 Report saved to: {report_file}")
        
        return str(report_file)
    
    def create_visualizations(self) -> List[str]:
        """Create data visualizations (if matplotlib is available)."""
        if not VISUALIZATION_AVAILABLE:
            if self.verbose:
                print("⚠️ Skipping visualizations - matplotlib not available")
            return []
        
        if self.verbose:
            print("📊 Creating visualizations...")
        
        plots_created = []
        
        # Win rate by scenario
        if 'win_rates' in self.analysis_results:
            scenario_rates = self.analysis_results['win_rates']['scenario_win_rates']
            
            plt.figure(figsize=(10, 6))
            scenarios = list(scenario_rates.keys())
            win_rates = [scenario_rates[s]['win_rate'] for s in scenarios]
            
            bars = plt.bar(scenarios, win_rates, alpha=0.7)
            plt.title('Player Win Rate by Scenario')
            plt.ylabel('Win Rate')
            plt.xticks(rotation=45, ha='right')
            plt.ylim(0, 1)
            
            # Color bars based on balance
            for i, bar in enumerate(bars):
                rate = win_rates[i]
                if rate < 0.4 or rate > 0.7:
                    bar.set_color('red')
                else:
                    bar.set_color('green')
            
            plt.tight_layout()
            plot_file = self.report_dir / "win_rates_by_scenario.png"
            plt.savefig(plot_file, dpi=150, bbox_inches='tight')
            plt.close()
            plots_created.append(str(plot_file))
        
        # Damage distribution
        if 'damage_metrics' in self.analysis_results and 'error' not in self.analysis_results['damage_metrics']:
            damage_values = [r.get('total_damage_dealt', 0) for r in self.data if r.get('total_damage_dealt', 0) > 0]
            
            plt.figure(figsize=(10, 6))
            plt.hist(damage_values, bins=20, alpha=0.7, edgecolor='black')
            plt.title('Distribution of Total Damage Dealt')
            plt.xlabel('Total Damage')
            plt.ylabel('Frequency')
            plt.grid(True, alpha=0.3)
            
            plot_file = self.report_dir / "damage_distribution.png"
            plt.savefig(plot_file, dpi=150, bbox_inches='tight')
            plt.close()
            plots_created.append(str(plot_file))
        
        if self.verbose and plots_created:
            print(f"📈 Created {len(plots_created)} visualizations")
        
        return plots_created


def main():
    """Main entry point for the performance analyzer."""
    parser = argparse.ArgumentParser(
        description="Vitality Performance Analyzer - Game balance analysis tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python analysis/analyzer.py --input gauntlet_results_20250611_123456.csv
  python analysis/analyzer.py -i results.csv --verbose --visualizations
  python analysis/analyzer.py --input results.csv --outlier-threshold 1.5
        """
    )
    
    parser.add_argument(
        '--input', '-i',
        required=True,
        help='Input CSV file containing simulation results'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Enable verbose output'
    )
    
    parser.add_argument(
        '--visualizations',
        action='store_true',
        help='Create data visualizations (requires matplotlib)'
    )
    
    parser.add_argument(
        '--outlier-threshold',
        type=float,
        default=2.0,
        help='Z-score threshold for outlier detection (default: 2.0)'
    )
    
    parser.add_argument(
        '--report-only',
        action='store_true',
        help='Only generate the balance report (skip individual analyses)'
    )
    
    args = parser.parse_args()
    
    try:
        # Initialize analyzer
        analyzer = PerformanceAnalyzer(verbose=args.verbose)
        
        # Load data
        record_count = analyzer.load_data(args.input)
        if record_count == 0:
            print("No data found in input file")
            return 1
        
        # Run analyses
        if not args.report_only:
            analyzer.analyze_win_rates()
            analyzer.analyze_damage_metrics()
            analyzer.identify_outliers(threshold=args.outlier_threshold)
        
        # Generate report
        report_file = analyzer.generate_balance_report()
        print(f"Balance report generated: {report_file}")
        
        # Create visualizations if requested
        if args.visualizations:
            plots = analyzer.create_visualizations()
            if plots:
                print(f"Visualizations created: {len(plots)} files")
        
        return 0
        
    except Exception as e:
        print(f"Error: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())