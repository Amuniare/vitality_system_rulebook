"""
Enhancement Saturation Report Generator for Simulation V3 Stage 2

Generates enhancement saturation reports split by performance tier:
- Top 50%, 20%, 5%, 1%, 0.1%

Shows which upgrades/limits saturate top-tier pairs (high appearance rates).
"""

import os
import statistics
from typing import List, Dict
from collections import defaultdict
from datetime import datetime

# Import from parent simulation_v2
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'simulation_v2'))
from src.game_data import UPGRADES, LIMITS


def generate_enhancement_saturation_reports(
    results: List[Dict],
    config,
    output_dir: str
):
    """
    Generate enhancement saturation reports for multiple performance tiers.

    Args:
        results: List of pair test results (sorted by overall_avg)
        config: Stage2Config object
        output_dir: Directory to save reports
    """
    print(f"\n=== Generating Enhancement Saturation Reports ===")

    # Define tier thresholds
    tiers = {
        'top_50': (0.50, 'Top 50%'),
        'top_20': (0.20, 'Top 20%'),
        'top_5': (0.05, 'Top 5%'),
        'top_1': (0.01, 'Top 1%'),
        'top_0.1': (0.001, 'Top 0.1%')
    }

    for tier_key, (threshold, tier_name) in tiers.items():
        tier_count = max(1, int(len(results) * threshold))
        tier_results = results[:tier_count]

        report_path = os.path.join(output_dir, f'enhancement_saturation_{tier_key}.md')
        _generate_single_tier_report(tier_results, tier_name, report_path)
        print(f"  + {tier_name} enhancement saturation: {os.path.basename(report_path)}")


def _generate_single_tier_report(
    tier_results: List[Dict],
    tier_name: str,
    output_path: str
):
    """Generate enhancement saturation report for a single tier."""

    # Track enhancement appearances
    enhancement_counts = defaultdict(int)
    enhancement_types = {}
    enhancement_costs = {}

    for result in tier_results:
        attack1 = result['attack1']
        attack2 = result['attack2']

        # Track unique enhancements per pair (avoid double counting)
        enhancements_in_pair = set()

        for upgrade in attack1.upgrades:
            enhancements_in_pair.add(upgrade)
            if upgrade not in enhancement_types:
                enhancement_types[upgrade] = 'upgrade'
                enhancement_costs[upgrade] = UPGRADES[upgrade].cost

        for limit in attack1.limits:
            enhancements_in_pair.add(limit)
            if limit not in enhancement_types:
                enhancement_types[limit] = 'limit'
                enhancement_costs[limit] = LIMITS[limit].cost

        for upgrade in attack2.upgrades:
            enhancements_in_pair.add(upgrade)
            if upgrade not in enhancement_types:
                enhancement_types[upgrade] = 'upgrade'
                enhancement_costs[upgrade] = UPGRADES[upgrade].cost

        for limit in attack2.limits:
            enhancements_in_pair.add(limit)
            if limit not in enhancement_types:
                enhancement_types[limit] = 'limit'
                enhancement_costs[limit] = LIMITS[limit].cost

        # Count each unique enhancement once per pair
        for enh in enhancements_in_pair:
            enhancement_counts[enh] += 1

    # Calculate saturation rates
    saturation_data = []
    for name, count in enhancement_counts.items():
        saturation_rate = (count / len(tier_results)) * 100

        saturation_data.append({
            'name': name,
            'type': enhancement_types[name],
            'cost': enhancement_costs[name],
            'appearances': count,
            'saturation_rate': saturation_rate
        })

    # Sort by saturation rate (descending)
    saturation_data.sort(key=lambda x: x['saturation_rate'], reverse=True)

    # Write report
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"# Simulation V3 - Enhancement Saturation Report ({tier_name})\n\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

        # Summary
        f.write("## Summary\n\n")
        f.write(f"- **Tier**: {tier_name} of all pairs ({len(tier_results):,} pairs)\n")
        f.write(f"- **Unique enhancements found**: {len(saturation_data)}\n")
        f.write(f"- **Average saturation rate**: {statistics.mean([d['saturation_rate'] for d in saturation_data]):.1f}%\n")
        f.write(f"- **Median saturation rate**: {statistics.median([d['saturation_rate'] for d in saturation_data]):.1f}%\n\n")

        # Methodology
        f.write("## Methodology\n\n")
        f.write(f"This report shows saturation rates for enhancements in the {tier_name} of all tested pairs.\n\n")
        f.write("**Key Metrics**:\n")
        f.write("1. **Saturation Rate**: % of pairs containing this enhancement (counts once per pair)\n")
        f.write("2. **Appearances**: Number of pairs containing this enhancement\n")
        f.write("3. **Type**: upgrade or limit\n")
        f.write("4. **Cost**: Point cost of enhancement\n\n")
        f.write("**Interpretation**:\n")
        f.write("- **High saturation (>60%)**: Core enhancement, appears in most top pairs\n")
        f.write("- **Medium saturation (30-60%)**: Common enhancement, frequently used\n")
        f.write("- **Low saturation (<30%)**: Niche enhancement, situational use\n\n")

        # Main table
        f.write("## Enhancement Saturation Rankings\n\n")
        f.write("Sorted by saturation rate (descending).\n\n")
        f.write("| Rank | Enhancement | Type | Cost | Appearances | Saturation Rate |\n")
        f.write("|------|-------------|------|------|-------------|----------------|\n")

        for rank, data in enumerate(saturation_data, 1):
            f.write(
                f"| {rank} | {data['name']} | {data['type']} | {data['cost']}p | "
                f"{data['appearances']:,} | {data['saturation_rate']:.1f}% |\n"
            )

        # Distribution analysis
        f.write("\n## Saturation Distribution\n\n")

        # Count by saturation bracket
        high_sat = sum(1 for d in saturation_data if d['saturation_rate'] > 60)
        medium_sat = sum(1 for d in saturation_data if 30 <= d['saturation_rate'] <= 60)
        low_sat = sum(1 for d in saturation_data if d['saturation_rate'] < 30)

        f.write("| Saturation Level | Count | % of Enhancements |\n")
        f.write("|-----------------|-------|------------------|\n")
        f.write(f"| High (>60%) | {high_sat} | {high_sat / len(saturation_data) * 100:.1f}% |\n")
        f.write(f"| Medium (30-60%) | {medium_sat} | {medium_sat / len(saturation_data) * 100:.1f}% |\n")
        f.write(f"| Low (<30%) | {low_sat} | {low_sat / len(saturation_data) * 100:.1f}% |\n")

        # Top 10 saturated enhancements
        f.write("\n## Top 10 Most Saturated Enhancements\n\n")
        f.write("| Enhancement | Type | Cost | Saturation Rate |\n")
        f.write("|-------------|------|------|----------------|\n")

        for data in saturation_data[:10]:
            f.write(
                f"| {data['name']} | {data['type']} | {data['cost']}p | "
                f"{data['saturation_rate']:.1f}% |\n"
            )

        # Bottom 10 least saturated enhancements
        if len(saturation_data) > 10:
            f.write("\n## Bottom 10 Least Saturated Enhancements\n\n")
            f.write("| Enhancement | Type | Cost | Saturation Rate |\n")
            f.write("|-------------|------|------|----------------|\n")

            for data in saturation_data[-10:]:
                f.write(
                    f"| {data['name']} | {data['type']} | {data['cost']}p | "
                    f"{data['saturation_rate']:.1f}% |\n"
                )

        # Notes
        f.write("\n## Notes\n\n")
        f.write("- **Saturation Rate**: Calculated as (pairs with enhancement / total pairs in tier) × 100\n")
        f.write("- **Each enhancement counted once per pair**: If an enhancement appears in both attacks, it's still counted as one appearance\n")
        f.write("- **High saturation indicates meta-defining enhancements**: Core to successful builds in this tier\n")
        f.write("- **Low saturation doesn't mean weak**: May be situational or niche but powerful in specific contexts\n")
