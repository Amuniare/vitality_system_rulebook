"""
Top 1000 Pairs List Report Generator for Simulation V3 Stage 2

Generates a simple ranked list of top 1000 pairs with key stats.
Quick reference for finding specific pair performance.
"""

import os
from typing import List, Dict
from datetime import datetime


def generate_top_1000_pairs_report(
    results: List[Dict],
    output_path: str
):
    """
    Generate top 1000 pairs list report.

    Args:
        results: List of pair test results (sorted by overall_avg)
        output_path: Path to output markdown file
    """
    print(f"\n=== Generating Top 1000 Pairs List ===")

    # Take top 1000
    top_results = results[:min(1000, len(results))]

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# Simulation V3 - Top 1000 Pairs List\n\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

        # Summary
        f.write("## Summary\n\n")
        f.write(f"- **Total pairs ranked**: {len(top_results):,}\n")
        f.write(f"- **Best avg turns**: {top_results[0]['overall_avg']:.2f}\n")
        f.write(f"- **Worst in top 1000**: {top_results[-1]['overall_avg']:.2f}\n\n")

        # Methodology
        f.write("## Methodology\n\n")
        f.write("Simple ranked list of top 1000 attack pairs by average turns to defeat enemies.\n")
        f.write("Lower turns = better performance.\n\n")
        f.write("**Key Columns**:\n")
        f.write("1. **Rank**: Position in top 1000\n")
        f.write("2. **Attack 1**: First attack type + upgrades (abbreviated)\n")
        f.write("3. **Cost1**: Point cost of attack 1\n")
        f.write("4. **Attack 2**: Second attack type + upgrades (abbreviated)\n")
        f.write("5. **Cost2**: Point cost of attack 2\n")
        f.write("6. **Total Cost**: Combined point cost\n")
        f.write("7. **Avg Turns**: Average turns across all test scenarios\n")
        f.write("8. **Synergy**: Synergy score (positive = complementary)\n\n")

        # Main table
        f.write("## Top 1000 Pairs\n\n")
        f.write("| Rank | Attack 1 | Cost1 | Attack 2 | Cost2 | Total | Avg Turns | Synergy |\n")
        f.write("|------|----------|-------|----------|-------|-------|-----------|--------|\n")

        for rank, result in enumerate(top_results, 1):
            attack1 = result['attack1']
            attack2 = result['attack2']

            # Abbreviate attack descriptions
            attack1_desc = _abbreviate_attack(attack1)
            attack2_desc = _abbreviate_attack(attack2)

            total_cost = attack1.total_cost + attack2.total_cost
            synergy = result.get('synergy_score', 0)

            f.write(
                f"| {rank} | {attack1_desc} | {attack1.total_cost}p | "
                f"{attack2_desc} | {attack2.total_cost}p | {total_cost}p | "
                f"{result['overall_avg']:.2f} | {synergy:+.1f}% |\n"
            )

        # Notes
        f.write("\n## Notes\n\n")
        f.write("- **Avg Turns**: Lower is better (faster enemy defeat)\n")
        f.write("- **Synergy**: Positive = pair performs better than individual averages (complementary)\n")
        f.write("- **Synergy**: Negative = pair performs worse than individuals (redundant/anti-synergy)\n")
        f.write("- **Attack abbreviations**: First 3 upgrades shown, '...' indicates more\n")
        f.write("- **Limits shown in brackets**: [limit_name]\n")

    print(f"  + Top 1000 pairs list: {os.path.basename(output_path)}")


def _abbreviate_attack(attack) -> str:
    """Create abbreviated attack description."""
    desc = attack.attack_type

    if attack.upgrades:
        # Show first 3 upgrades
        upgrades_shown = attack.upgrades[:3]
        desc += "+" + "+".join(upgrades_shown)
        if len(attack.upgrades) > 3:
            desc += "..."

    if attack.limits:
        # Show first limit in brackets
        desc += f" [{attack.limits[0]}]"
        if len(attack.limits) > 1:
            desc += "..."

    return desc
