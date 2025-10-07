"""
Cost analysis report generation module.

This module generates reports analyzing upgrades and limits by cost tier,
showing cost distribution and efficiency metrics.
"""

from typing import Dict, List, Tuple
from src.models import SimulationConfig
from src.game_data import UPGRADES, LIMITS


def generate_individual_cost_analysis(reports_dir: str):
    """
    Generate cost analysis report for individual testing mode.

    Uses game_data to get costs and parses individual_upgrade_limit_table.txt
    for performance data to generate cost-based analysis with efficiency metrics.
    """
    import os

    output_file = os.path.join(reports_dir, "cost_analysis_individual.txt")
    perf_file = os.path.join(reports_dir, "individual_upgrade_limit_table.txt")

    # Get all upgrades and limits from game_data
    enhancements = []

    for name, upgrade in UPGRADES.items():
        enhancements.append({
            'name': name,
            'cost': upgrade.cost,
            'type': 'upgrade',
            'avg_delta': None,
            'avg_delta_per_cost': None
        })

    for name, limit in LIMITS.items():
        enhancements.append({
            'name': name,
            'cost': limit.cost,
            'type': 'limit',
            'avg_delta': None,
            'avg_delta_per_cost': None
        })

    # Parse performance data if available
    if os.path.exists(perf_file):
        performance_data = {}
        with open(perf_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        in_data = False
        for line in lines:
            if line.startswith('---'):
                in_data = True
                continue
            if not in_data or not line.strip():
                continue

            # Split on whitespace and parse
            parts = line.split()
            if len(parts) >= 4:
                try:
                    name = parts[0]
                    avg_delta_per_cost = float(parts[1])
                    avg_delta = float(parts[2])
                    performance_data[name] = {
                        'avg_delta': avg_delta,
                        'avg_delta_per_cost': avg_delta_per_cost
                    }
                except (ValueError, IndexError):
                    continue

        # Match performance data to enhancements
        for e in enhancements:
            if e['name'] in performance_data:
                e['avg_delta'] = performance_data[e['name']]['avg_delta']
                e['avg_delta_per_cost'] = performance_data[e['name']]['avg_delta_per_cost']

    # Count by cost tier
    cost_counts = {}
    for e in enhancements:
        cost = e['cost']
        cost_counts[cost] = cost_counts.get(cost, 0) + 1

    # Sort enhancements by cost then avg_delta (performance)
    enhancements.sort(key=lambda x: (x['cost'], x['avg_delta'] if x['avg_delta'] is not None else 999))

    # Group by cost
    cost_groups = {}
    for e in enhancements:
        cost = e['cost']
        if cost not in cost_groups:
            cost_groups[cost] = []
        cost_groups[cost].append(e)

    # Find best per cost tier (if performance data available)
    best_per_cost = {}
    for cost, group in cost_groups.items():
        # Only include items with performance data
        with_perf = [e for e in group if e['avg_delta'] is not None]
        if with_perf:
            best = min(with_perf, key=lambda x: x['avg_delta_per_cost'])
            best_per_cost[cost] = best

    # Write report
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# INDIVIDUAL TESTING - COST ANALYSIS REPORT\n\n")

        # Cost distribution table
        f.write("## Cost Distribution\n\n")
        f.write("| Cost | Count |\n")
        f.write("|---|---|\n")
        for cost in sorted(cost_counts.keys()):
            point_label = "point" if cost == 1 else "points"
            f.write(f"| {cost} {point_label} | {cost_counts[cost]} |\n")
        f.write(f"| **Total** | **{len(enhancements)}** |\n\n")

        # All upgrades/limits sorted by cost and performance
        f.write("## All Upgrades/Limits by Cost and Performance\n\n")
        f.write("Sorted by: Cost (ascending), then Avg Turns (ascending)\n\n")
        f.write("| Upgrade/Limit | Cost | Avg Turns | vs Mean | Type |\n")
        f.write("|---|---|---|---|---|\n")

        for cost in sorted(cost_groups.keys()):
            f.write(f"| **COST {cost}** |\n")
            for e in cost_groups[cost]:
                if e['avg_delta'] is not None:
                    f.write(f"| {e['name']} | {cost} | {e['avg_delta']:.2f} | {e['avg_delta_per_cost']:.2f} | {e['type']} |\n")
                else:
                    f.write(f"| {e['name']} | {cost} | N/A | N/A | {e['type']} |\n")

        # Notes section
        f.write("\n### Notes\n\n")
        f.write("- **Avg Turns**: Average change in turns to kill (negative = faster/better)\n")
        f.write("- **vs Mean**: Avg Turns divided by cost (efficiency metric)\n")
        f.write("- Individual testing shows performance in isolation against baseline attacks\n")
        f.write("- N/A indicates no performance data available (not tested in individual mode)\n\n")

        if best_per_cost:
            f.write("**Best Efficiency per Cost Tier:**\n")
            for cost in sorted(best_per_cost.keys()):
                best = best_per_cost[cost]
                point_label = "point" if cost == 1 else "point"
                f.write(f"- {cost}-{point_label}: {best['name']} ({best['avg_delta_per_cost']:.2f} efficiency, {best['avg_delta']:.2f} avg turns)\n")

    print(f"  Individual cost analysis saved to {output_file}")


def generate_build_cost_analysis(all_build_results: List[Tuple], config: SimulationConfig,
                                  reports_dir: str, archetype: str = None, enhancement_stats: List[Dict] = None):
    """
    Generate cost analysis report for build testing mode.

    Analyzes upgrades/limits from enhancement_stats data or falls back to parsing
    enhancement_ranking_report.md file if data not provided.

    Args:
        all_build_results: List of (build, avg_dpt, avg_turns) tuples
        config: Simulation configuration
        reports_dir: Directory for reports
        archetype: Optional archetype name for archetype-specific reports
        enhancement_stats: Optional list of enhancement stat dicts from generate_upgrade_ranking_report()
    """
    import os

    # Determine output path based on archetype
    if archetype:
        output_file = os.path.join(reports_dir, f"cost_analysis_{archetype}.md")
        title_suffix = archetype.replace('_', ' ').upper()
    else:
        output_file = os.path.join(reports_dir, "cost_analysis_builds.md")
        title_suffix = "BUILD TESTING"

    enhancements = []

    # Use provided enhancement_stats if available (preferred method)
    if enhancement_stats is not None:
        for stats in enhancement_stats:
            enhancements.append({
                'rank': stats.get('avg_rank', 0),
                'name': stats['name'],
                'cost': stats['cost'],
                'avg_turns': stats['avg_turns'],
                'top10': stats.get('median_top_10'),
                'top50': stats.get('median_top_50')
            })
    else:
        # Fallback to file parsing if no data provided
        # reports_dir is already the archetype directory when archetype is provided (passed from builds.py)
        input_file = os.path.join(reports_dir, "enhancement_ranking_report.md")

        if not os.path.exists(input_file):
            print(f"  Warning: {input_file} not found, skipping cost analysis for {archetype or 'builds'}")
            return

        # Parse enhancement ranking report
        with open(input_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        in_table = False
        for line in lines:
            if '| Rank' in line and 'Enhancement' in line:
                in_table = True
                continue
            if in_table and line.startswith('##'):
                break
            if in_table and line.strip().startswith('|') and not line.startswith('|---'):
                parts = [p.strip() for p in line.split('|')]
                if len(parts) > 4 and parts[1] and parts[1].isdigit():
                    try:
                        rank = int(parts[1])
                        name = parts[2]
                        cost_str = parts[3]
                        cost = int(cost_str.replace('p', ''))
                        avg_turns = float(parts[4])
                        top10 = float(parts[5]) if len(parts) > 5 and parts[5] else None
                        top50 = float(parts[6]) if len(parts) > 6 and parts[6] else None
                        enhancements.append({
                            'rank': rank,
                            'name': name,
                            'cost': cost,
                            'avg_turns': avg_turns,
                            'top10': top10,
                            'top50': top50
                        })
                    except (ValueError, IndexError):
                        continue

        # If no enhancements found in focused format, try dual_natured format
        if not enhancements and archetype == 'dual_natured':
            enhancements = _parse_dual_natured_enhancements(input_file)

    if not enhancements:
        print(f"  Warning: No enhancement data available for cost analysis")
        return

    # Count by cost tier
    cost_counts = {}
    for e in enhancements:
        cost = e['cost']
        cost_counts[cost] = cost_counts.get(cost, 0) + 1

    # Sort by cost then avg_turns
    enhancements.sort(key=lambda x: (x['cost'], x['avg_turns']))

    # Group by cost
    cost_groups = {}
    for e in enhancements:
        cost = e['cost']
        if cost not in cost_groups:
            cost_groups[cost] = []
        cost_groups[cost].append(e)

    # Find best per cost tier
    best_per_cost = {}
    for cost, group in cost_groups.items():
        best = min(group, key=lambda x: x['avg_turns'])
        best_per_cost[cost] = best

    # Write report
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"# {title_suffix} - COST ANALYSIS REPORT\n\n")

        # Cost distribution table
        f.write("## Cost Distribution\n\n")
        f.write("| Cost | Count |\n")
        f.write("|---|---|\n")
        for cost in sorted(cost_counts.keys()):
            point_label = "point" if cost == 1 else "points"
            f.write(f"| {cost} {point_label} | {cost_counts[cost]} |\n")
        f.write(f"| **Total** | **{len(enhancements)}** |\n\n")

        # All upgrades/limits sorted by cost and performance
        f.write("## All Upgrades/Limits by Cost and Performance\n\n")
        f.write("Sorted by: Cost (ascending), then Avg Turns (ascending)\n\n")
        f.write("| Upgrade/Limit | Cost | Avg Turns | vs Mean | Top10% | Top10% vs Mean | Top50% | Top50% vs Mean |\n")
        f.write("|---|---|---|---|---|---|---|---|\n")

        for cost in sorted(cost_groups.keys()):
            f.write(f"| **COST {cost}** |\n")
            for e in cost_groups[cost]:
                vs_mean = e['avg_turns'] / cost
                top10_str = f"{e['top10']:.1f}" if e.get('top10') is not None else "N/A"
                top10_vs_mean = f"{e['top10']/cost:.1f}" if e.get('top10') is not None else "N/A"
                top50_str = f"{e['top50']:.1f}" if e.get('top50') is not None else "N/A"
                top50_vs_mean = f"{e['top50']/cost:.1f}" if e.get('top50') is not None else "N/A"
                f.write(f"| {e['name']} | {cost} | {e['avg_turns']:.1f} | {vs_mean:.1f} | {top10_str} | {top10_vs_mean} | {top50_str} | {top50_vs_mean} |\n")

        # Notes section
        f.write("\n### Notes\n\n")
        f.write("- **Avg Turns**: Average turns to kill across all tested builds with this enhancement\n")
        f.write("- **vs Mean**: Avg Turns divided by cost (efficiency metric)\n")
        f.write("- **Top10%**: Average turns for builds in the top 10% (best performing builds)\n")
        f.write("- **Top10% vs Mean**: Top10% divided by cost (best-case efficiency)\n")
        f.write("- **Top50%**: Average turns for builds in the top 50% (above-average builds)\n")
        f.write("- **Top50% vs Mean**: Top50% divided by cost (typical-case efficiency)\n")

        if archetype == 'dual_natured':
            f.write("- Dual natured testing: Attack 1 fixed as melee_dg + quick_strikes + powerful_critical\n")
        else:
            f.write(f"- {title_suffix.title()} testing shows performance in complete builds (not isolation)\n")

        f.write("- Lower turns = better performance\n")

        # Best overall efficiency
        if enhancements:
            best_overall = min(enhancements, key=lambda x: x['avg_turns'] / x['cost'])
            f.write(f"- Best overall efficiency: {best_overall['name']} ({best_overall['avg_turns']:.1f} turns avg, {best_overall['avg_turns']/best_overall['cost']:.1f} efficiency)\n")

        # Best per cost tier
        for cost in sorted(best_per_cost.keys()):
            best = best_per_cost[cost]
            point_label = "point" if cost == 1 else "point"
            f.write(f"- Best {cost}-{point_label}: {best['name']} ({best['avg_turns']:.1f} turns")
            if cost > 1:
                f.write(f", {best['avg_turns']/cost:.1f} efficiency")
            f.write(")\n")

    print(f"  Cost analysis saved to {output_file}")


def _parse_dual_natured_enhancements(input_file: str) -> List[Dict]:
    """
    Parse dual_natured enhancement data from Attack 2 rankings.

    Returns list of dicts with name, cost, avg_turns.
    """
    enhancements = []

    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_upgrades = False
    in_limits = False

    for line in lines:
        if 'UPGRADE RANKINGS (ATTACK 2)' in line:
            in_upgrades = True
            in_limits = False
            continue
        elif 'LIMIT RANKINGS (ATTACK 2)' in line:
            in_upgrades = False
            in_limits = True
            continue
        elif line.startswith('TOP 10') or line.startswith('##'):
            in_upgrades = False
            in_limits = False
            continue

        if (in_upgrades or in_limits) and line.strip().startswith('|') and not line.startswith('|---') and not line.startswith('| Rank'):
            parts = [p.strip() for p in line.split('|')]
            if len(parts) > 4 and parts[1] and parts[1].isdigit():
                try:
                    rank = int(parts[1])
                    name = parts[2]
                    avg_turns = float(parts[3])
                    best = float(parts[4]) if len(parts) > 4 and parts[4] else None
                    median = float(parts[6]) if len(parts) > 6 and parts[6] else None

                    # Get cost from game_data
                    if in_upgrades and name in UPGRADES:
                        cost = UPGRADES[name].cost
                        enhancements.append({
                            'name': name,
                            'cost': cost,
                            'avg_turns': avg_turns,
                            'top10': best,  # "Best" is equivalent to top performers
                            'top50': median  # "Median" is the 50th percentile
                        })
                    elif in_limits and name in LIMITS:
                        cost = LIMITS[name].cost
                        enhancements.append({
                            'name': name,
                            'cost': cost,
                            'avg_turns': avg_turns,
                            'top10': best,
                            'top50': median
                        })
                except (ValueError, IndexError, KeyError):
                    continue

    return enhancements
