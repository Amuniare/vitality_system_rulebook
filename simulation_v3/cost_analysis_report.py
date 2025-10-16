"""
Cost analysis report for Simulation V3.

Groups enhancements by cost and analyzes efficiency (performance / cost).
"""

import sys
import os
from typing import List, Dict
from collections import defaultdict
import statistics

# Add parent simulation directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'simulation_v2'))

from src.game_data import UPGRADES, LIMITS


def calculate_cost_efficiency(
    results: List,  # List of AttackTestResult objects
    percentile: float = 0.20
) -> Dict:
    """
    Calculate cost efficiency statistics for enhancements.

    Args:
        results: List of AttackTestResult objects (sorted by performance)
        percentile: Percentile of builds to analyze

    Returns:
        Dictionary with cost efficiency data
    """
    # Calculate overall median
    all_turns = [r.overall_avg for r in results]
    overall_median = statistics.median(all_turns) if all_turns else 0

    # Define percentiles to calculate
    percentiles = {
        'top_1': 0.01,
        'top_5': 0.05,
        'top_10': 0.10,
        'top_20': 0.20,
        'top_50': 0.50,
    }

    percentile_medians = {}
    for name, pct in percentiles.items():
        count = max(1, int(len(results) * pct))
        subset_turns = [r.overall_avg for r in results[:count]]
        percentile_medians[name] = statistics.median(subset_turns) if subset_turns else 0

    # Track enhancement occurrences in different percentiles
    enhancement_data = {}

    # Initialize enhancement data structures
    for upgrade_name, upgrade_obj in UPGRADES.items():
        enhancement_data[upgrade_name] = {
            'name': upgrade_name,
            'type': 'upgrade',
            'cost': upgrade_obj.cost,
            'appearances': [],
            'percentile_appearances': {pname: [] for pname in percentiles.keys()},
        }

    for limit_name, limit_obj in LIMITS.items():
        enhancement_data[limit_name] = {
            'name': limit_name,
            'type': 'limit',
            'cost': limit_obj.cost,  # Limits add cost (restrictions/drawbacks)
            'appearances': [],
            'percentile_appearances': {pname: [] for pname in percentiles.keys()},
        }

    # Collect data from results
    for rank, result in enumerate(results, 1):
        # Determine which percentiles this build belongs to
        belongs_to = set()
        for pname, pct in percentiles.items():
            cutoff = max(1, int(len(results) * pct))
            if rank <= cutoff:
                belongs_to.add(pname)

        # Track upgrades
        for upgrade in result.build.upgrades:
            if upgrade in enhancement_data:
                enhancement_data[upgrade]['appearances'].append(result.overall_avg)
                for pname in belongs_to:
                    enhancement_data[upgrade]['percentile_appearances'][pname].append(result.overall_avg)

        # Track limits
        for limit in result.build.limits:
            if limit in enhancement_data:
                enhancement_data[limit]['appearances'].append(result.overall_avg)
                for pname in belongs_to:
                    enhancement_data[limit]['percentile_appearances'][pname].append(result.overall_avg)

    # Calculate statistics
    enhancement_stats = []
    for name, data in enhancement_data.items():
        if not data['appearances']:
            continue  # Skip enhancements that don't appear in any builds

        # Overall statistics
        avg_turns = statistics.mean(data['appearances'])
        vs_median = avg_turns - overall_median
        cost = data['cost']
        efficiency = vs_median / cost if cost != 0 else 0

        stats = {
            'name': name,
            'type': data['type'],
            'cost': cost,
            'avg_turns': avg_turns,
            'vs_median': vs_median,
            'efficiency': efficiency,
            'count': len(data['appearances']),
        }

        # Calculate percentile statistics
        for pname in percentiles.keys():
            appearances = data['percentile_appearances'][pname]
            if appearances:
                percentile_avg = statistics.mean(appearances)
                percentile_vs_median = percentile_avg - percentile_medians[pname]
                percentile_efficiency = percentile_vs_median / cost if cost != 0 else 0

                stats[f'{pname}_avg'] = percentile_avg
                stats[f'{pname}_vs_median'] = percentile_vs_median
                stats[f'{pname}_efficiency'] = percentile_efficiency
                stats[f'{pname}_count'] = len(appearances)
            else:
                stats[f'{pname}_avg'] = 0
                stats[f'{pname}_vs_median'] = 0
                stats[f'{pname}_efficiency'] = 0
                stats[f'{pname}_count'] = 0

        enhancement_stats.append(stats)

    return {
        'enhancement_stats': enhancement_stats,
        'overall_median': overall_median,
        'percentile_medians': percentile_medians,
        'total_builds': len(results),
    }


def generate_cost_analysis_report(
    results: List,  # List of AttackTestResult objects
    output_path: str
):
    """
    Generate cost analysis report in markdown format.

    Args:
        results: List of AttackTestResult objects (sorted by performance)
        output_path: Path to output markdown file
    """
    from datetime import datetime

    print(f"\n=== Generating Cost Analysis Report ===")
    print(f"  Output file: {output_path}")

    # Calculate cost efficiency data
    data = calculate_cost_efficiency(results)
    enhancement_stats = data['enhancement_stats']
    overall_median = data['overall_median']
    percentile_medians = data['percentile_medians']
    total_builds = data['total_builds']

    # Group by cost
    upgrades_by_cost = defaultdict(list)
    limits_by_cost = defaultdict(list)

    for stats in enhancement_stats:
        if stats['type'] == 'upgrade':
            upgrades_by_cost[stats['cost']].append(stats)
        else:
            limits_by_cost[stats['cost']].append(stats)

    # Sort each group by efficiency
    for cost in upgrades_by_cost:
        upgrades_by_cost[cost].sort(key=lambda x: x['efficiency'])

    for cost in limits_by_cost:
        limits_by_cost[cost].sort(key=lambda x: x['efficiency'])

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# Cost Analysis Report\n\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

        # Summary
        f.write("## Summary\n\n")
        f.write(f"- **Total builds analyzed**: {total_builds:,}\n")
        f.write(f"- **Overall median turns**: {overall_median:.2f}\n\n")

        f.write("**Percentile Medians:**\n")
        for pname, pct in [('top_1', 0.01), ('top_5', 0.05), ('top_10', 0.10), ('top_20', 0.20), ('top_50', 0.50)]:
            count = max(1, int(total_builds * pct))
            f.write(f"- Top {int(pct * 100)}% ({count} builds): {percentile_medians[pname]:.2f} avg turns\n")
        f.write("\n")

        # Methodology
        f.write("## Methodology\n\n")
        f.write("This report groups enhancements by point cost to identify best value options at each tier.\n\n")
        f.write("**Key Metrics:**\n")
        f.write("- **Avg Turns**: Mean turns across all builds containing this enhancement\n")
        f.write("- **vs Median**: Deviation from overall median (negative = better than median)\n")
        f.write("- **Efficiency**: (vs Median) / cost - more negative = better value\n")
        f.write("- **TopX% Metrics**: Performance in top-performing builds only\n\n")

        # Upgrades by cost
        f.write("## Upgrades by Cost\n\n")

        for cost in sorted(upgrades_by_cost.keys()):
            upgrades = upgrades_by_cost[cost]
            avg_efficiency = statistics.mean([u['efficiency'] for u in upgrades])

            f.write(f"### {cost}-Point Upgrades\n\n")
            f.write(f"**Average Efficiency at this cost tier**: {avg_efficiency:.3f}\n\n")

            f.write("| Upgrade | Avg Turns | vs Median | Efficiency | Top20% | Top20% vs Med | Top20% Eff | Count | Top20% Count |\n")
            f.write("|---------|-----------|-----------|------------|--------|---------------|------------|-------|-------------|\n")

            for stats in upgrades:
                f.write(
                    f"| {stats['name']} | {stats['avg_turns']:.2f} | "
                    f"{stats['vs_median']:+.2f} | {stats['efficiency']:.3f} | "
                    f"{stats['top_20_avg']:.2f} | {stats['top_20_vs_median']:+.2f} | "
                    f"{stats['top_20_efficiency']:.3f} | "
                    f"{stats['count']} | {stats['top_20_count']} |\n"
                )

            f.write("\n")

        # Limits by cost value
        f.write("## Limits by Cost Value\n\n")

        for cost in sorted(limits_by_cost.keys(), reverse=True):
            limits = limits_by_cost[cost]
            avg_efficiency = statistics.mean([l['efficiency'] for l in limits])

            f.write(f"### {cost}-Point Cost Limits\n\n")
            f.write(f"**Average Efficiency at this cost tier**: {avg_efficiency:.3f}\n\n")

            f.write("| Limit | Avg Turns | vs Median | Efficiency | Top20% | Top20% vs Med | Top20% Eff | Count | Top20% Count |\n")
            f.write("|-------|-----------|-----------|------------|--------|---------------|------------|-------|-------------|\n")

            for stats in limits:
                f.write(
                    f"| {stats['name']} | {stats['avg_turns']:.2f} | "
                    f"{stats['vs_median']:+.2f} | {stats['efficiency']:.3f} | "
                    f"{stats['top_20_avg']:.2f} | {stats['top_20_vs_median']:+.2f} | "
                    f"{stats['top_20_efficiency']:.3f} | "
                    f"{stats['count']} | {stats['top_20_count']} |\n"
                )

            f.write("\n")

        # Best value insights
        f.write("## Best Value By Cost Tier\n\n")

        f.write("### Most Efficient Upgrades Per Cost\n\n")
        for cost in sorted(upgrades_by_cost.keys()):
            best = upgrades_by_cost[cost][0]  # Already sorted by efficiency
            f.write(f"- **{cost}p**: `{best['name']}` (Efficiency: {best['efficiency']:.3f}, Top20%: {best['top_20_efficiency']:.3f})\n")

        f.write("\n### Most Efficient Limits Per Cost Value\n\n")
        for cost in sorted(limits_by_cost.keys(), reverse=True):
            best = limits_by_cost[cost][0]  # Already sorted by efficiency
            f.write(f"- **{cost}p cost**: `{best['name']}` (Efficiency: {best['efficiency']:.3f}, Top20%: {best['top_20_efficiency']:.3f})\n")

    print(f"  Cost analysis report generated")


if __name__ == "__main__":
    print("This module should be imported and used by stage1_pruning.py")
    print("Run: python main.py --stage 1")
