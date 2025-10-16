"""
Cost Analysis Report Generator for Simulation V3 Stage 2

Groups pairs by total cost to identify best value combinations at each budget tier.
"""

import os
import statistics
from typing import List, Dict
from collections import defaultdict
from datetime import datetime


def generate_pair_cost_analysis_report(
    results: List[Dict],
    output_path: str
):
    """
    Generate cost analysis report.

    Args:
        results: List of pair test results (sorted by overall_avg)
        output_path: Path to output markdown file
    """
    print(f"\n=== Generating Pair Cost Analysis Report ===")

    # Group pairs by total cost
    cost_groups = defaultdict(list)
    for result in results:
        total_cost = result['attack1'].total_cost + result['attack2'].total_cost
        cost_groups[total_cost].append(result)

    # Sort each cost group by performance
    for cost in cost_groups:
        cost_groups[cost].sort(key=lambda r: r['overall_avg'])

    # Calculate overall median
    all_turns = [r['overall_avg'] for r in results]
    overall_median = statistics.median(all_turns)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# Simulation V3 - Pair Cost Analysis Report\n\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

        # Summary
        f.write("## Summary\n\n")
        f.write(f"- **Total pairs analyzed**: {len(results):,}\n")
        f.write(f"- **Cost tiers found**: {len(cost_groups)}\n")
        f.write(f"- **Overall median turns**: {overall_median:.2f}\n")
        f.write(f"- **Cheapest total cost**: {min(cost_groups.keys())}p\n")
        f.write(f"- **Most expensive total cost**: {max(cost_groups.keys())}p\n\n")

        # Methodology
        f.write("## Methodology\n\n")
        f.write("This report groups attack pairs by total point cost (attack1 + attack2) to identify ")
        f.write("best value combinations at each budget tier.\n\n")
        f.write("**Key Metrics**:\n")
        f.write("1. **Total Cost**: Combined point cost of both attacks\n")
        f.write("2. **Best Avg Turns**: Best performance in this cost tier\n")
        f.write("3. **Median Avg Turns**: Median performance in this cost tier\n")
        f.write("4. **vs Overall Median**: How cost tier median compares to overall median\n")
        f.write("5. **Efficiency**: (Median vs Overall) / cost (lower = better value)\n")
        f.write("6. **Pairs in Tier**: Number of pairs at this cost level\n\n")

        # Cost tier summary table
        f.write("## Cost Tier Summary\n\n")
        f.write("| Cost | Pairs | Best | Median | vs Overall | Efficiency | Top 3 |\n")
        f.write("|------|-------|------|--------|-----------|------------|-------|\n")

        for cost in sorted(cost_groups.keys()):
            pairs = cost_groups[cost]
            best = pairs[0]['overall_avg']
            median = statistics.median([p['overall_avg'] for p in pairs])
            vs_overall = median - overall_median
            efficiency = vs_overall / cost if cost > 0 else 0

            # Top 3 at this cost
            top_3 = pairs[:3]
            top_3_desc = "<br>".join([
                f"{i+1}. {_abbreviate_pair(p)}"
                for i, p in enumerate(top_3)
            ])

            f.write(
                f"| {cost}p | {len(pairs)} | {best:.2f} | {median:.2f} | "
                f"{vs_overall:+.2f} | {efficiency:.3f} | {top_3_desc} |\n"
            )

        # Detailed breakdown by cost tier
        f.write("\n## Detailed Breakdown by Cost Tier\n\n")

        for cost in sorted(cost_groups.keys()):
            pairs = cost_groups[cost]
            median = statistics.median([p['overall_avg'] for p in pairs])

            f.write(f"### {cost} Points\n\n")
            f.write(f"**Pairs at this cost**: {len(pairs)}\n")
            f.write(f"**Median performance**: {median:.2f} avg turns\n\n")

            f.write("**Top 10 pairs at this cost:**\n\n")
            f.write("| Rank | Attack 1 | Attack 2 | Avg Turns | Synergy |\n")
            f.write("|------|----------|----------|-----------|--------|\n")

            for i, result in enumerate(pairs[:10], 1):
                attack1_desc = _abbreviate_attack(result['attack1'])
                attack2_desc = _abbreviate_attack(result['attack2'])
                synergy = result.get('synergy_score', 0)

                f.write(
                    f"| {i} | {attack1_desc} | {attack2_desc} | "
                    f"{result['overall_avg']:.2f} | {synergy:+.1f}% |\n"
                )

            f.write("\n")

        # Value analysis
        f.write("## Value Analysis\n\n")
        f.write("Best efficiency (performance per point spent) at each cost tier:\n\n")
        f.write("| Cost | Best Pair | Avg Turns | Efficiency |\n")
        f.write("|------|-----------|-----------|------------|\n")

        for cost in sorted(cost_groups.keys()):
            best_pair = cost_groups[cost][0]
            best_turns = best_pair['overall_avg']
            vs_overall = best_turns - overall_median
            efficiency = vs_overall / cost if cost > 0 else 0

            pair_desc = _abbreviate_pair(best_pair)

            f.write(f"| {cost}p | {pair_desc} | {best_turns:.2f} | {efficiency:.3f} |\n")

        # Notes
        f.write("\n## Notes\n\n")
        f.write("- **Lower avg turns = better performance**\n")
        f.write("- **Efficiency = (median - overall_median) / cost**: Lower is better (more negative = good value)\n")
        f.write("- **Best value tiers**: Look for high efficiency (most negative) with good median performance\n")
        f.write("- **Synergy scores**: Positive = complementary pairing, negative = redundant\n")

    print(f"  + Pair cost analysis report: {os.path.basename(output_path)}")


def _abbreviate_attack(attack) -> str:
    """Create abbreviated attack description."""
    desc = attack.attack_type
    if attack.upgrades:
        desc += "+" + "+".join(attack.upgrades[:2])
        if len(attack.upgrades) > 2:
            desc += "..."
    if attack.limits:
        desc += f"[{attack.limits[0]}]"
    return desc


def _abbreviate_pair(result: Dict) -> str:
    """Create abbreviated pair description."""
    a1 = _abbreviate_attack(result['attack1'])
    a2 = _abbreviate_attack(result['attack2'])
    return f"{a1} + {a2}"
