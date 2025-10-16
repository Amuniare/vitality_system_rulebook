"""
Synergy Deep Dive Report Generator for Simulation V3 Stage 2

Focuses on pairs with exceptional synergy scores (>15% or <-15%).
Analyzes what makes synergistic vs anti-synergistic pairings.
"""

import os
import statistics
from typing import List, Dict
from datetime import datetime


def generate_synergy_analysis_report(
    results: List[Dict],
    config,
    output_path: str
):
    """
    Generate synergy deep dive report.

    Args:
        results: List of pair test results (sorted by overall_avg)
        config: Stage2Config object
        output_path: Path to output markdown file
    """
    print(f"\n=== Generating Synergy Analysis Report ===")

    # Split into positive and negative synergy
    positive_synergy = [r for r in results if r.get('synergy_score', 0) > 15]
    negative_synergy = [r for r in results if r.get('synergy_score', 0) < -15]

    # Sort by absolute synergy score
    positive_synergy.sort(key=lambda r: r.get('synergy_score', 0), reverse=True)
    negative_synergy.sort(key=lambda r: r.get('synergy_score', 0))

    # Distribution of synergy scores
    all_synergy_scores = [r.get('synergy_score', 0) for r in results]
    synergy_median = statistics.median(all_synergy_scores)
    synergy_mean = statistics.mean(all_synergy_scores)
    synergy_stdev = statistics.stdev(all_synergy_scores) if len(all_synergy_scores) > 1 else 0

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("# Simulation V3 - Synergy Deep Dive Report\n\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

        # Summary
        f.write("## Summary\n\n")
        f.write(f"- **Total pairs analyzed**: {len(results):,}\n")
        f.write(f"- **Pairs with strong positive synergy (>15%)**: {len(positive_synergy)}\n")
        f.write(f"- **Pairs with strong negative synergy (<-15%)**: {len(negative_synergy)}\n")
        f.write(f"- **Synergy score median**: {synergy_median:+.1f}%\n")
        f.write(f"- **Synergy score mean**: {synergy_mean:+.1f}%\n")
        f.write(f"- **Synergy score std dev**: {synergy_stdev:.1f}%\n\n")

        # Methodology
        f.write("## Methodology\n\n")
        f.write("**Synergy Score Calculation:**\n")
        f.write("```\n")
        f.write("synergy_score = (avg_individual - paired_performance) / avg_individual × 100\n")
        f.write("```\n\n")
        f.write("Where `avg_individual = (attack1_avg + attack2_avg) / 2`\n\n")
        f.write("**Interpretation:**\n")
        f.write("- **Positive synergy (>0%)**: Pair performs better than average of individuals (complementary)\n")
        f.write("- **Negative synergy (<0%)**: Pair performs worse than individuals (redundant/anti-synergy)\n")
        f.write("- **Strong positive (>15%)**: Exceptional complementary pairing\n")
        f.write("- **Strong negative (<-15%)**: Severe anti-synergy (avoid pairing)\n\n")

        # Synergy distribution
        f.write("## Synergy Distribution\n\n")

        # Create histogram buckets
        buckets = {
            'Strong Positive (>30%)': sum(1 for s in all_synergy_scores if s > 30),
            'Moderate Positive (15-30%)': sum(1 for s in all_synergy_scores if 15 < s <= 30),
            'Slight Positive (5-15%)': sum(1 for s in all_synergy_scores if 5 < s <= 15),
            'Neutral (-5 to 5%)': sum(1 for s in all_synergy_scores if -5 <= s <= 5),
            'Slight Negative (-15 to -5%)': sum(1 for s in all_synergy_scores if -15 <= s < -5),
            'Moderate Negative (-30 to -15%)': sum(1 for s in all_synergy_scores if -30 <= s < -15),
            'Strong Negative (<-30%)': sum(1 for s in all_synergy_scores if s < -30),
        }

        f.write("| Synergy Range | Count | % of Pairs |\n")
        f.write("|--------------|-------|------------|\n")
        for bucket_name, count in buckets.items():
            pct = count / len(results) * 100
            f.write(f"| {bucket_name} | {count} | {pct:.1f}% |\n")

        # Top 50 positive synergy pairs
        f.write("\n## Top 50 Positive Synergy Pairs (Complementary)\n\n")
        f.write("These pairs perform significantly better together than individually.\n\n")

        for rank, result in enumerate(positive_synergy[:50], 1):
            attack1 = result['attack1']
            attack2 = result['attack2']
            synergy = result.get('synergy_score', 0)

            f.write(f"### Rank {rank}: {synergy:+.1f}% Synergy\n\n")
            f.write(f"**Performance:** {result['overall_avg']:.2f} avg turns\n\n")

            # Attack descriptions
            f.write(f"**Attack 1:** `{attack1.attack_type}`")
            if attack1.upgrades:
                f.write(f" + `{', '.join(attack1.upgrades)}`")
            if attack1.limits:
                f.write(f" [Limits: `{', '.join(attack1.limits)}`]")
            f.write(f" (Cost: {attack1.total_cost}p)\n\n")

            f.write(f"**Attack 2:** `{attack2.attack_type}`")
            if attack2.upgrades:
                f.write(f" + `{', '.join(attack2.upgrades)}`")
            if attack2.limits:
                f.write(f" [Limits: `{', '.join(attack2.limits)}`]")
            f.write(f" (Cost: {attack2.total_cost}p)\n\n")

            # Why synergy works
            f.write("**Why it works:**\n")
            _analyze_synergy_reason(attack1, attack2, result, config, f)
            f.write("\n---\n\n")

        # Top 50 negative synergy pairs
        f.write("\n## Top 50 Negative Synergy Pairs (Anti-Synergy)\n\n")
        f.write("These pairs perform worse together than individually - avoid these combinations.\n\n")

        for rank, result in enumerate(negative_synergy[:50], 1):
            attack1 = result['attack1']
            attack2 = result['attack2']
            synergy = result.get('synergy_score', 0)

            f.write(f"### Rank {rank}: {synergy:+.1f}% Synergy\n\n")
            f.write(f"**Performance:** {result['overall_avg']:.2f} avg turns\n\n")

            # Attack descriptions
            f.write(f"**Attack 1:** `{attack1.attack_type}`")
            if attack1.upgrades:
                f.write(f" + `{', '.join(attack1.upgrades)}`")
            if attack1.limits:
                f.write(f" [Limits: `{', '.join(attack1.limits)}`]")
            f.write(f" (Cost: {attack1.total_cost}p)\n\n")

            f.write(f"**Attack 2:** `{attack2.attack_type}`")
            if attack2.upgrades:
                f.write(f" + `{', '.join(attack2.upgrades)}`")
            if attack2.limits:
                f.write(f" [Limits: `{', '.join(attack2.limits)}`]")
            f.write(f" (Cost: {attack2.total_cost}p)\n\n")

            # Why anti-synergy exists
            f.write("**Why it fails:**\n")
            _analyze_antisynergy_reason(attack1, attack2, result, config, f)
            f.write("\n---\n\n")

    print(f"  + Synergy analysis report: {os.path.basename(output_path)}")


def _analyze_synergy_reason(attack1, attack2, result, config, f):
    """Analyze why a pair has positive synergy."""
    reasons = []

    # Attack type diversity
    if attack1.attack_type != attack2.attack_type:
        is_aoe1 = attack1.attack_type in ['area', 'direct_area_damage']
        is_aoe2 = attack2.attack_type in ['area', 'direct_area_damage']
        if is_aoe1 != is_aoe2:
            reasons.append("- **Attack type diversity**: One AOE, one single-target (scenario adaptability)")

    # Usage split analysis
    usage_by_profile = result.get('usage_by_profile', {})
    if usage_by_profile:
        for profile_name, usage in usage_by_profile.items():
            if usage.get('attack1_percent', 0) > 70 or usage.get('attack2_percent', 0) > 70:
                reasons.append(f"- **Specialization vs {profile_name}**: Clear role differentiation")

    usage_by_scenario = result.get('usage_by_scenario', {})
    if usage_by_scenario:
        for scenario_name, usage in usage_by_scenario.items():
            if usage.get('attack1_percent', 0) > 70 or usage.get('attack2_percent', 0) > 70:
                reasons.append(f"- **Scenario specialization ({scenario_name})**: One attack dominates")

    if not reasons:
        reasons.append("- **Complementary enhancements**: Attacks cover different combat needs")

    for reason in reasons[:3]:  # Show top 3 reasons
        f.write(f"{reason}\n")


def _analyze_antisynergy_reason(attack1, attack2, result, config, f):
    """Analyze why a pair has negative synergy."""
    reasons = []

    # Same attack type
    if attack1.attack_type == attack2.attack_type:
        reasons.append(f"- **Redundant attack types**: Both are `{attack1.attack_type}`")

    # Usage split - check for balanced usage (indicates redundancy)
    usage_by_profile = result.get('usage_by_profile', {})
    if usage_by_profile:
        balanced_count = sum(1 for usage in usage_by_profile.values()
                           if 40 <= usage.get('attack1_percent', 0) <= 60)
        if balanced_count == len(usage_by_profile):
            reasons.append("- **No clear role differentiation**: Both attacks used equally across all contexts")

    # Overlapping upgrades
    overlap = set(attack1.upgrades) & set(attack2.upgrades)
    if len(overlap) > 2:
        reasons.append(f"- **Overlapping upgrades**: Shared enhancements = redundancy")

    if not reasons:
        reasons.append("- **Poor complementarity**: Attacks don't cover each other's weaknesses")

    for reason in reasons[:3]:  # Show top 3 reasons
        f.write(f"{reason}\n")
