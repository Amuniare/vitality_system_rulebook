"""
Enhancement saturation analysis for Simulation V3.

Analyzes which upgrades and limits appear most frequently in top-performing builds.
"""

import sys
import os
from typing import List, Dict, Tuple
from collections import defaultdict

# Add parent simulation directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'simulation_v2'))

from src.game_data import UPGRADES, LIMITS


def analyze_enhancement_saturation(
    results: List,  # List of AttackTestResult objects
    top_percent: float = 0.20
) -> Tuple[Dict, Dict]:
    """
    Analyze upgrade and limit saturation in top-performing builds.

    Args:
        results: List of AttackTestResult objects (sorted by performance)
        top_percent: Percentage of top builds to analyze (e.g., 0.20 = top 20%)

    Returns:
        Tuple of (upgrade_stats, limit_stats) dictionaries
    """
    # Determine cutoff for top builds
    cutoff_count = max(1, int(len(results) * top_percent))
    top_builds = results[:cutoff_count]

    # Count upgrade occurrences
    upgrade_counts = defaultdict(int)
    for result in top_builds:
        for upgrade in result.build.upgrades:
            upgrade_counts[upgrade] += 1

    # Count limit occurrences
    limit_counts = defaultdict(int)
    for result in top_builds:
        for limit in result.build.limits:
            limit_counts[limit] += 1

    # Calculate statistics for upgrades
    upgrade_stats = {}
    for upgrade_name, upgrade_obj in UPGRADES.items():
        count = upgrade_counts.get(upgrade_name, 0)
        saturation = (count / cutoff_count) * 100 if cutoff_count > 0 else 0
        upgrade_stats[upgrade_name] = {
            'name': upgrade_name,
            'cost': upgrade_obj.cost,
            'count': count,
            'saturation': saturation,
            'total_builds': cutoff_count
        }

    # Calculate statistics for limits
    limit_stats = {}
    for limit_name, limit_obj in LIMITS.items():
        count = limit_counts.get(limit_name, 0)
        saturation = (count / cutoff_count) * 100 if cutoff_count > 0 else 0
        limit_stats[limit_name] = {
            'name': limit_name,
            'cost': limit_obj.cost,
            'count': count,
            'saturation': saturation,
            'total_builds': cutoff_count
        }

    return upgrade_stats, limit_stats


def generate_enhancement_report(
    results: List,
    top_percent: float,
    output_path: str
):
    """
    Generate enhancement saturation report in markdown format.

    Args:
        results: List of AttackTestResult objects (sorted by performance)
        top_percent: Percentage of top builds analyzed
        output_path: Path to output markdown file
    """
    from datetime import datetime

    upgrade_stats, limit_stats = analyze_enhancement_saturation(results, top_percent)

    # Sort by saturation (descending)
    sorted_upgrades = sorted(upgrade_stats.values(), key=lambda x: x['saturation'], reverse=True)
    sorted_limits = sorted(limit_stats.values(), key=lambda x: x['saturation'], reverse=True)

    print(f"\n=== Generating Enhancement Report ===")
    print(f"  Output file: {output_path}")
    print(f"  Analyzing top {top_percent * 100:.0f}% of builds ({sorted_upgrades[0]['total_builds']} builds)")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# Enhancement Saturation Report\n\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

        # Summary
        f.write("## Summary\n\n")
        f.write(f"- **Analysis scope**: Top {top_percent * 100:.0f}% of builds\n")
        f.write(f"- **Total builds analyzed**: {sorted_upgrades[0]['total_builds']:,}\n")
        f.write(f"- **Total upgrades tracked**: {len(upgrade_stats)}\n")
        f.write(f"- **Total limits tracked**: {len(limit_stats)}\n\n")

        # Upgrades section
        f.write("## Upgrade Saturation\n\n")
        f.write("Shows how frequently each upgrade appears in the top-performing builds.\n\n")
        f.write("| Rank | Upgrade | Cost | Count | Saturation | Bar |\n")
        f.write("|------|---------|------|-------|------------|-----|\n")

        for i, upgrade in enumerate(sorted_upgrades, 1):
            # Create visual bar (each █ = 5% saturation)
            bar_length = int(upgrade['saturation'] / 5)
            bar = "█" * bar_length

            f.write(f"| {i} | {upgrade['name']} | {upgrade['cost']}p | ")
            f.write(f"{upgrade['count']} | {upgrade['saturation']:.1f}% | {bar} |\n")

        # Limits section
        f.write("\n## Limit Saturation\n\n")
        f.write("Shows how frequently each limit appears in the top-performing builds.\n\n")
        f.write("| Rank | Limit | Cost | Count | Saturation | Bar |\n")
        f.write("|------|-------|------|-------|------------|-----|\n")

        for i, limit in enumerate(sorted_limits, 1):
            # Create visual bar (each █ = 5% saturation)
            bar_length = int(limit['saturation'] / 5)
            bar = "█" * bar_length

            f.write(f"| {i} | {limit['name']} | {limit['cost']}p | ")
            f.write(f"{limit['count']} | {limit['saturation']:.1f}% | {bar} |\n")

        # Cost efficiency analysis
        f.write("\n## Cost Efficiency Analysis\n\n")

        # Upgrades by cost tier
        f.write("### Upgrades by Cost\n\n")

        # Group by cost
        upgrades_by_cost = defaultdict(list)
        for upgrade in sorted_upgrades:
            upgrades_by_cost[upgrade['cost']].append(upgrade)

        for cost in sorted(upgrades_by_cost.keys()):
            upgrades_at_cost = upgrades_by_cost[cost]
            avg_saturation = sum(u['saturation'] for u in upgrades_at_cost) / len(upgrades_at_cost)

            f.write(f"#### {cost}-Point Upgrades (Avg: {avg_saturation:.1f}% saturation)\n\n")
            f.write("| Upgrade | Saturation | Count |\n")
            f.write("|---------|------------|-------|\n")

            for upgrade in upgrades_at_cost:
                f.write(f"| {upgrade['name']} | {upgrade['saturation']:.1f}% | {upgrade['count']} |\n")

            f.write("\n")

        # Limits by cost value
        f.write("### Limits by Cost Value\n\n")

        # Group by cost
        limits_by_cost = defaultdict(list)
        for limit in sorted_limits:
            limits_by_cost[limit['cost']].append(limit)

        for cost in sorted(limits_by_cost.keys(), reverse=True):
            limits_at_cost = limits_by_cost[cost]
            avg_saturation = sum(l['saturation'] for l in limits_at_cost) / len(limits_at_cost)

            f.write(f"#### {cost}-Point Cost Limits (Avg: {avg_saturation:.1f}% saturation)\n\n")
            f.write("| Limit | Saturation | Count |\n")
            f.write("|-------|------------|-------|\n")

            for limit in limits_at_cost:
                f.write(f"| {limit['name']} | {limit['saturation']:.1f}% | {limit['count']} |\n")

            f.write("\n")

        # High saturation highlights
        f.write("## Key Insights\n\n")

        # Top 5 upgrades
        f.write("### Most Popular Upgrades (Top 5)\n\n")
        for i, upgrade in enumerate(sorted_upgrades[:5], 1):
            f.write(f"{i}. **{upgrade['name']}** ({upgrade['cost']}p) - {upgrade['saturation']:.1f}% saturation ({upgrade['count']} builds)\n")

        f.write("\n")

        # Top 5 limits
        f.write("### Most Popular Limits (Top 5)\n\n")
        for i, limit in enumerate(sorted_limits[:5], 1):
            f.write(f"{i}. **{limit['name']}** ({limit['cost']}p cost) - {limit['saturation']:.1f}% saturation ({limit['count']} builds)\n")

        f.write("\n")

        # Underutilized enhancements
        f.write("### Underutilized Enhancements (<5% saturation)\n\n")

        underused_upgrades = [u for u in sorted_upgrades if u['saturation'] < 5.0]
        underused_limits = [l for l in sorted_limits if l['saturation'] < 5.0]

        if underused_upgrades:
            f.write("**Upgrades:**\n")
            for upgrade in underused_upgrades:
                f.write(f"- {upgrade['name']} ({upgrade['cost']}p): {upgrade['saturation']:.1f}%\n")
            f.write("\n")

        if underused_limits:
            f.write("**Limits:**\n")
            for limit in underused_limits:
                f.write(f"- {limit['name']} ({limit['cost']}p cost): {limit['saturation']:.1f}%\n")

    print(f"  Enhancement report generated")


if __name__ == "__main__":
    print("This module should be imported and used by stage1_pruning.py")
    print("Run: python main.py --stage 1")
