"""
Enhancement Ranking Report Generator for Simulation V3 Stage 2

Generates enhancement ranking reports split by performance tier:
- Top 50%, 20%, 5%, 1%, 0.1%

Shows which upgrades/limits perform best in top-tier pairs.
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


def generate_enhancement_ranking_reports(
    results: List[Dict],
    config,
    output_dir: str
):
    """
    Generate enhancement ranking reports for multiple performance tiers.

    Args:
        results: List of pair test results (sorted by overall_avg)
        config: Stage2Config object
        output_dir: Directory to save reports
    """
    print(f"\n=== Generating Enhancement Ranking Reports ===")

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

        report_path = os.path.join(output_dir, f'enhancement_ranking_{tier_key}.md')
        _generate_single_tier_report(tier_results, tier_name, config, report_path)
        print(f"  + {tier_name} enhancement ranking: {os.path.basename(report_path)}")


def _generate_single_tier_report(
    tier_results: List[Dict],
    tier_name: str,
    config,
    output_path: str
):
    """Generate enhancement ranking report for a single tier."""

    # Calculate tier median
    tier_turns = [r['overall_avg'] for r in tier_results]
    tier_median = statistics.median(tier_turns)

    # Track enhancement statistics
    enhancement_data = defaultdict(lambda: {
        'appearances': 0,
        'total_turns': 0,
        'attack1_appearances': 0,
        'attack2_appearances': 0,
        'attack1_usage': 0,
        'attack2_usage': 0,
        'by_attack_type': defaultdict(list),
        'by_profile': defaultdict(list),
    })

    # Collect enhancement statistics
    for result in tier_results:
        attack1 = result['attack1']
        attack2 = result['attack2']
        overall_avg = result['overall_avg']

        # Track usage percentages
        usage_by_profile = result.get('usage_by_profile', {})
        avg_attack1_usage = 0
        avg_attack2_usage = 0
        if usage_by_profile:
            attack1_usages = [u.get('attack1_percent', 0) for u in usage_by_profile.values()]
            attack2_usages = [u.get('attack2_percent', 0) for u in usage_by_profile.values()]
            avg_attack1_usage = statistics.mean(attack1_usages) if attack1_usages else 0
            avg_attack2_usage = statistics.mean(attack2_usages) if attack2_usages else 0

        # Process attack1 enhancements
        for upgrade in attack1.upgrades:
            enhancement_data[upgrade]['appearances'] += 1
            enhancement_data[upgrade]['total_turns'] += overall_avg
            enhancement_data[upgrade]['attack1_appearances'] += 1
            enhancement_data[upgrade]['attack1_usage'] += avg_attack1_usage
            enhancement_data[upgrade]['by_attack_type'][attack1.attack_type].append(overall_avg)

            # By profile
            for profile_name, profile_avg in result['profile_results'].items():
                enhancement_data[upgrade]['by_profile'][profile_name].append(profile_avg)

        for limit in attack1.limits:
            enhancement_data[limit]['appearances'] += 1
            enhancement_data[limit]['total_turns'] += overall_avg
            enhancement_data[limit]['attack1_appearances'] += 1
            enhancement_data[limit]['attack1_usage'] += avg_attack1_usage
            enhancement_data[limit]['by_attack_type'][attack1.attack_type].append(overall_avg)

            # By profile
            for profile_name, profile_avg in result['profile_results'].items():
                enhancement_data[limit]['by_profile'][profile_name].append(profile_avg)

        # Process attack2 enhancements
        for upgrade in attack2.upgrades:
            enhancement_data[upgrade]['appearances'] += 1
            enhancement_data[upgrade]['total_turns'] += overall_avg
            enhancement_data[upgrade]['attack2_appearances'] += 1
            enhancement_data[upgrade]['attack2_usage'] += avg_attack2_usage
            enhancement_data[upgrade]['by_attack_type'][attack2.attack_type].append(overall_avg)

            # By profile
            for profile_name, profile_avg in result['profile_results'].items():
                enhancement_data[upgrade]['by_profile'][profile_name].append(profile_avg)

        for limit in attack2.limits:
            enhancement_data[limit]['appearances'] += 1
            enhancement_data[limit]['total_turns'] += overall_avg
            enhancement_data[limit]['attack2_appearances'] += 1
            enhancement_data[limit]['attack2_usage'] += avg_attack2_usage
            enhancement_data[limit]['by_attack_type'][attack2.attack_type].append(overall_avg)

            # By profile
            for profile_name, profile_avg in result['profile_results'].items():
                enhancement_data[limit]['by_profile'][profile_name].append(profile_avg)

    # Calculate statistics for each enhancement
    enhancement_stats = []
    for name, data in enhancement_data.items():
        if data['appearances'] == 0:
            continue

        avg_turns = data['total_turns'] / data['appearances']
        vs_median = avg_turns - tier_median

        # Determine type and cost
        if name in UPGRADES:
            enh_type = 'upgrade'
            cost = UPGRADES[name].cost
        elif name in LIMITS:
            enh_type = 'limit'
            cost = LIMITS[name].cost
        else:
            continue  # Unknown enhancement

        efficiency = vs_median / cost if cost > 0 else 0

        # Calculate usage percentages
        total_appearances = data['attack1_appearances'] + data['attack2_appearances']
        slot1_pct = (data['attack1_appearances'] / total_appearances * 100) if total_appearances > 0 else 0
        slot2_pct = (data['attack2_appearances'] / total_appearances * 100) if total_appearances > 0 else 0

        used1_pct = data['attack1_usage'] / data['attack1_appearances'] if data['attack1_appearances'] > 0 else 0
        used2_pct = data['attack2_usage'] / data['attack2_appearances'] if data['attack2_appearances'] > 0 else 0

        # By attack type
        attack_type_avgs = {}
        for attack_type in ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage']:
            if attack_type in data['by_attack_type']:
                attack_type_avgs[attack_type] = statistics.mean(data['by_attack_type'][attack_type])
            else:
                attack_type_avgs[attack_type] = 0

        # By profile
        profile_avgs = {}
        for profile in config.defensive_profiles:
            profile_name = profile['name']
            if profile_name in data['by_profile']:
                profile_avgs[profile_name] = statistics.mean(data['by_profile'][profile_name])
            else:
                profile_avgs[profile_name] = 0

        enhancement_stats.append({
            'name': name,
            'type': enh_type,
            'cost': cost,
            'appearances': data['appearances'],
            'appearance_rate': data['appearances'] / len(tier_results) * 100,
            'avg_turns': avg_turns,
            'vs_median': vs_median,
            'efficiency': efficiency,
            'slot1_pct': slot1_pct,
            'slot2_pct': slot2_pct,
            'used1_pct': used1_pct,
            'used2_pct': used2_pct,
            **attack_type_avgs,
            **{f'profile_{k}': v for k, v in profile_avgs.items()}
        })

    # Sort by efficiency (ascending = better)
    enhancement_stats.sort(key=lambda x: x['efficiency'])

    # Write report
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"# Simulation V3 - Enhancement Ranking Report ({tier_name})\n\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

        # Summary
        f.write("## Summary\n\n")
        f.write(f"- **Tier**: {tier_name} of all pairs ({len(tier_results):,} pairs)\n")
        f.write(f"- **Tier median turns**: {tier_median:.2f}\n")
        f.write(f"- **Unique enhancements found**: {len(enhancement_stats)}\n\n")

        # Methodology
        f.write("## Methodology\n\n")
        f.write(f"This report analyzes enhancement performance in the {tier_name} of all tested pairs.\n\n")
        f.write("**Key Metrics**:\n")
        f.write("1. **Appearance Rate**: % of pairs in this tier containing the enhancement\n")
        f.write("2. **Avg Turns**: Average turns for pairs containing this enhancement\n")
        f.write("3. **vs Median**: Deviation from tier median (negative = better)\n")
        f.write("4. **Efficiency**: (vs Median) / cost - cost-normalized performance\n")
        f.write("5. **Slot1/Slot2**: % of appearances in Attack1 vs Attack2 slot\n")
        f.write("6. **Used1/Used2**: Average % of combat turns where Attack1 vs Attack2 was used\n")
        f.write("7. **Attack Type Columns**: Avg turns when paired with each attack type (0 = not seen)\n")
        f.write("8. **Profile Columns**: Avg turns against each defensive profile\n\n")

        # Main table
        f.write("## Enhancement Rankings\n\n")
        f.write("Sorted by efficiency (lower = better).\n\n")

        # Build header dynamically
        header = "| Rank | Enhancement | Type | Cost | Apps | App% | Avg Turns | vs Med | Eff | "
        header += "Slot1 | Slot2 | Used1 | Used2 | "
        header += "Melee_AC | Melee_DG | Ranged | Area | Direct | "
        for profile in config.defensive_profiles:
            header += f"{profile['name']} | "
        header += "\n"

        separator = "|" + "---|" * (13 + 5 + len(config.defensive_profiles)) + "\n"

        f.write(header)
        f.write(separator)

        # Table rows
        for rank, stats in enumerate(enhancement_stats, 1):
            row = f"| {rank} | {stats['name']} | {stats['type']} | {stats['cost']}p | "
            row += f"{stats['appearances']} | {stats['appearance_rate']:.1f}% | "
            row += f"{stats['avg_turns']:.2f} | {stats['vs_median']:+.2f} | {stats['efficiency']:.3f} | "
            row += f"{stats['slot1_pct']:.0f}% | {stats['slot2_pct']:.0f}% | "
            row += f"{stats['used1_pct']:.0f}% | {stats['used2_pct']:.0f}% | "
            row += f"{stats['melee_ac']:.2f} | {stats['melee_dg']:.2f} | "
            row += f"{stats['ranged']:.2f} | {stats['area']:.2f} | {stats['direct_damage']:.2f} | "

            for profile in config.defensive_profiles:
                profile_key = f"profile_{profile['name']}"
                row += f"{stats[profile_key]:.2f} | "

            row += "\n"
            f.write(row)

        # Column definitions
        f.write("\n## Column Definitions\n\n")
        f.write("- **Apps**: Number of pairs containing this enhancement\n")
        f.write("- **App%**: Appearance rate (% of tier containing this enhancement)\n")
        f.write("- **Avg Turns**: Average turns for pairs with this enhancement\n")
        f.write("- **vs Med**: Deviation from tier median (negative = better)\n")
        f.write("- **Eff**: Efficiency = (vs Median) / cost (lower = better value)\n")
        f.write("- **Slot1/Slot2**: % of appearances in Attack1 vs Attack2\n")
        f.write("- **Used1/Used2**: Avg % of combat where Attack1 vs Attack2 was selected\n")
        f.write("- **Attack Type Columns**: Avg turns when used with that attack type (0 = not seen)\n")
        f.write("- **Profile Columns**: Avg turns against that defensive profile\n")
