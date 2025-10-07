"""Streamlined reporting for Simulation V2."""

import os
import statistics
from typing import List, Tuple, Dict

from src.game_data import UPGRADES, LIMITS
from src.models import AttackBuild, MultiAttackBuild
from core.individual_tester import IndividualResult


class ReporterV2:
    """Generates enhancement ranking and cost analysis reports."""

    def __init__(self, reports_dir: str, archetype: str):
        self.reports_dir = reports_dir
        self.archetype = archetype
        os.makedirs(reports_dir, exist_ok=True)

    def generate_all_reports(
        self,
        build_results: List[Tuple[AttackBuild | MultiAttackBuild, float, float]],
        individual_results: List[IndividualResult] = None
    ):
        """Generate both enhancement ranking and cost analysis reports."""
        print(f"\n=== Generating Reports ({self.archetype}) ===")

        # Generate individual enhancement reports if results provided
        if individual_results:
            self._generate_individual_report(individual_results)
            self._generate_individual_cost_analysis(individual_results)

        # Calculate enhancement stats from build results
        enhancement_stats = self._calculate_enhancement_stats(build_results)

        # Calculate overall median and percentile medians for all reports
        all_turns = [avg_turns for _, _, avg_turns in build_results]
        overall_median = statistics.median(all_turns) if all_turns else 0

        # Calculate percentile medians (top builds by rank)
        sorted_builds = sorted(build_results, key=lambda x: x[2])  # Sort by avg_turns (ascending = better)
        total_builds = len(sorted_builds)

        if total_builds > 0:
            top_5_count = max(1, int(total_builds * 0.05))
            top_10_count = max(1, int(total_builds * 0.10))
            top_20_count = max(1, int(total_builds * 0.20))
            top_50_count = max(1, int(total_builds * 0.50))

            top_5_median = statistics.median([turns for _, _, turns in sorted_builds[:top_5_count]])
            top_10_median = statistics.median([turns for _, _, turns in sorted_builds[:top_10_count]])
            top_20_median = statistics.median([turns for _, _, turns in sorted_builds[:top_20_count]])
            top_50_median = statistics.median([turns for _, _, turns in sorted_builds[:top_50_count]])
        else:
            top_5_median = top_10_median = top_20_median = top_50_median = 0

        # Generate reports
        self._generate_enhancement_ranking_report(
            enhancement_stats, len(build_results), overall_median,
            top_50_median, top_20_median, top_10_median, top_5_median
        )
        self._generate_cost_analysis_report(
            enhancement_stats, overall_median,
            top_50_median, top_20_median, top_10_median, top_5_median
        )
        self._generate_performance_tier_analysis(
            build_results, overall_median,
            top_50_median, top_20_median, top_10_median, top_5_median
        )

        print(f"  Reports saved to {self.reports_dir}")

    def _calculate_enhancement_stats(
        self,
        build_results: List[Tuple]
    ) -> List[Dict]:
        """Calculate enhancement statistics from build results."""
        # Track enhancement appearances
        enhancement_data = {}  # enhancement_name -> list of (rank, avg_turns, attack_type)

        for rank, (build, avg_dpt, avg_turns) in enumerate(build_results, 1):
            # Handle both single and multi-attack builds
            if isinstance(build, MultiAttackBuild):
                # For MultiAttackBuilds, process each sub-build
                builds_to_process = enumerate(build.builds)
                # Get combat usage percentages from this build
                usage_pct = build.get_attack_usage_percentages()
            else:
                builds_to_process = enumerate([build])
                usage_pct = None

            # Process all builds (either the single build or all sub-builds)
            for build_idx, sub_build in builds_to_process:
                attack_type = sub_build.attack_type

                # Track upgrades
                for upgrade in sub_build.upgrades:
                    if upgrade not in enhancement_data:
                        enhancement_data[upgrade] = {
                            'type': 'upgrade',
                            'cost': UPGRADES[upgrade].cost,
                            'appearances': [],
                            'attack_types': {},
                            'attack_positions': {},  # Track which attack slot (0=Slot1, 1=Slot2)
                            'combat_usage_total': {0: 0, 1: 0},  # Track actual combat usage
                            'combat_usage_count': 0
                        }
                    enhancement_data[upgrade]['appearances'].append((rank, avg_turns))

                    if attack_type not in enhancement_data[upgrade]['attack_types']:
                        enhancement_data[upgrade]['attack_types'][attack_type] = []
                    enhancement_data[upgrade]['attack_types'][attack_type].append(avg_turns)

                    # Track attack position for multi-attack builds (which slot has it)
                    if build_idx not in enhancement_data[upgrade]['attack_positions']:
                        enhancement_data[upgrade]['attack_positions'][build_idx] = 0
                    enhancement_data[upgrade]['attack_positions'][build_idx] += 1

                    # Track combat usage (which attack was actually used)
                    if usage_pct is not None:
                        enhancement_data[upgrade]['combat_usage_total'][0] += usage_pct[0]
                        enhancement_data[upgrade]['combat_usage_total'][1] += usage_pct[1]
                        enhancement_data[upgrade]['combat_usage_count'] += 1

                # Track limits
                for limit in sub_build.limits:
                    if limit not in enhancement_data:
                        enhancement_data[limit] = {
                            'type': 'limit',
                            'cost': LIMITS[limit].cost,
                            'appearances': [],
                            'attack_types': {},
                            'attack_positions': {},  # Track which attack slot (0=Slot1, 1=Slot2)
                            'combat_usage_total': {0: 0, 1: 0},  # Track actual combat usage
                            'combat_usage_count': 0
                        }
                    enhancement_data[limit]['appearances'].append((rank, avg_turns))

                    if attack_type not in enhancement_data[limit]['attack_types']:
                        enhancement_data[limit]['attack_types'][attack_type] = []
                    enhancement_data[limit]['attack_types'][attack_type].append(avg_turns)

                    # Track attack position for multi-attack builds (which slot has it)
                    if build_idx not in enhancement_data[limit]['attack_positions']:
                        enhancement_data[limit]['attack_positions'][build_idx] = 0
                    enhancement_data[limit]['attack_positions'][build_idx] += 1

                    # Track combat usage (which attack was actually used)
                    if usage_pct is not None:
                        enhancement_data[limit]['combat_usage_total'][0] += usage_pct[0]
                        enhancement_data[limit]['combat_usage_total'][1] += usage_pct[1]
                        enhancement_data[limit]['combat_usage_count'] += 1

        # Calculate statistics
        all_turns = [avg_turns for _, _, avg_turns in build_results]
        median_turns = statistics.median(all_turns) if all_turns else 0

        enhancement_stats = []
        for name, data in enhancement_data.items():
            appearances = data['appearances']
            turns_values = [turns for _, turns in appearances]

            # Overall statistics
            avg_turns = statistics.mean(turns_values)
            vs_median = avg_turns - median_turns

            # Top 5%, Top 10%, Top 20%, and Top 50% statistics
            sorted_appearances = sorted(appearances, key=lambda x: x[0])  # Sort by rank
            top_5_count = max(1, len(sorted_appearances) // 20)
            top_10_count = max(1, len(sorted_appearances) // 10)
            top_20_count = max(1, len(sorted_appearances) // 5)
            top_50_count = max(1, len(sorted_appearances) // 2)

            top_5_turns = [turns for _, turns in sorted_appearances[:top_5_count]]
            top_10_turns = [turns for _, turns in sorted_appearances[:top_10_count]]
            top_20_turns = [turns for _, turns in sorted_appearances[:top_20_count]]
            top_50_turns = [turns for _, turns in sorted_appearances[:top_50_count]]

            median_top_5 = statistics.median(top_5_turns) if top_5_turns else 0
            median_top_10 = statistics.median(top_10_turns) if top_10_turns else 0
            median_top_20 = statistics.median(top_20_turns) if top_20_turns else 0
            median_top_50 = statistics.median(top_50_turns) if top_50_turns else 0

            top5_vs_median = median_top_5 - median_turns
            top10_vs_median = median_top_10 - median_turns
            top20_vs_median = median_top_20 - median_turns
            top50_vs_median = median_top_50 - median_turns

            cost = data['cost']
            top5_efficiency = top5_vs_median / cost if cost > 0 else 0
            top10_efficiency = top10_vs_median / cost if cost > 0 else 0
            top20_efficiency = top20_vs_median / cost if cost > 0 else 0
            top50_efficiency = top50_vs_median / cost if cost > 0 else 0

            # Attack type breakdown
            attack_type_turns = {}
            for attack_type in ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage']:
                if attack_type in data['attack_types']:
                    attack_type_turns[attack_type] = statistics.mean(data['attack_types'][attack_type])
                else:
                    attack_type_turns[attack_type] = 0

            # Calculate build slot percentages (which slot contains the enhancement)
            attack_positions = data.get('attack_positions', {})
            total_attack_uses = sum(attack_positions.values())
            slot1_pct = 0
            slot2_pct = 0
            if total_attack_uses > 0:
                slot1_pct = int((attack_positions.get(0, 0) / total_attack_uses) * 100)
                slot2_pct = int((attack_positions.get(1, 0) / total_attack_uses) * 100)

            # Calculate combat usage percentages (which attack was actually used)
            combat_usage_count = data.get('combat_usage_count', 0)
            combat_usage_total = data.get('combat_usage_total', {0: 0, 1: 0})
            used1_pct = 0
            used2_pct = 0
            if combat_usage_count > 0:
                used1_pct = int(combat_usage_total[0] / combat_usage_count)
                used2_pct = int(combat_usage_total[1] / combat_usage_count)

            enhancement_stats.append({
                'name': name,
                'type': data['type'],
                'cost': cost,
                'avg_turns': avg_turns,
                'vs_median': vs_median,
                'median_top_5': median_top_5,
                'top5_vs_median': top5_vs_median,
                'top5_efficiency': top5_efficiency,
                'median_top_10': median_top_10,
                'top10_vs_median': top10_vs_median,
                'top10_efficiency': top10_efficiency,
                'median_top_20': median_top_20,
                'top20_vs_median': top20_vs_median,
                'top20_efficiency': top20_efficiency,
                'median_top_50': median_top_50,
                'top50_vs_median': top50_vs_median,
                'top50_efficiency': top50_efficiency,
                'appearances': len(appearances),
                'median_rank': statistics.median([rank for rank, _ in appearances]),
                'slot1_pct': slot1_pct,
                'slot2_pct': slot2_pct,
                'used1_pct': used1_pct,
                'used2_pct': used2_pct,
                'has_multi_attack': total_attack_uses > 0,
                **attack_type_turns
            })

        # Sort by avg_turns (ascending = better)
        enhancement_stats.sort(key=lambda x: x['avg_turns'])

        return enhancement_stats

    def _get_enhancement_set(self, build) -> frozenset:
        """Extract all enhancements (upgrades + limits) from a build as a frozenset."""
        enhancements = []

        if isinstance(build, MultiAttackBuild):
            # For multi-attack builds, collect enhancements from all sub-builds
            for sub_build in build.builds:
                enhancements.extend(sub_build.upgrades)
                enhancements.extend(sub_build.limits)
        else:
            # For single attack builds
            enhancements.extend(build.upgrades)
            enhancements.extend(build.limits)

        return frozenset(enhancements)

    def _calculate_synergy_concentration(self, top_builds: List[Tuple], enhancement_name: str) -> float:
        """Calculate what % of top builds contain the 2-3 most common co-occurring enhancements.

        Instead of looking for exact matching sets, this counts individual enhancement
        co-occurrences and finds the most common partners.

        Args:
            top_builds: List of (rank, build, avg_turns) tuples
            enhancement_name: Name of enhancement to analyze

        Returns:
            Percentage (0-100) of top builds containing at least one of the top 2-3 partner enhancements
        """
        if not top_builds:
            return 0.0

        # Count individual enhancement co-occurrences
        partner_counts = {}
        for _, build, _ in top_builds:
            full_set = self._get_enhancement_set(build)
            # Count each other enhancement that appears with the target
            for other_enhancement in full_set:
                if other_enhancement != enhancement_name:
                    partner_counts[other_enhancement] = partner_counts.get(other_enhancement, 0) + 1

        if not partner_counts:
            return 0.0

        # Find top 2-3 most common partner enhancements
        sorted_partners = sorted(partner_counts.items(), key=lambda x: x[1], reverse=True)
        top_partners = [name for name, _ in sorted_partners[:3]]  # Top 3 partners

        # Calculate % of builds containing at least one of these top partners
        builds_with_top_partners = 0
        for _, build, _ in top_builds:
            full_set = self._get_enhancement_set(build)
            if any(partner in full_set for partner in top_partners):
                builds_with_top_partners += 1

        concentration_pct = (builds_with_top_partners / len(top_builds)) * 100 if top_builds else 0.0

        return concentration_pct

    def _calculate_diversity_index(self, builds: List[Tuple]) -> int:
        """Count unique enhancement combinations in the given builds.

        Args:
            builds: List of (rank, build, avg_turns) tuples

        Returns:
            Count of unique enhancement sets
        """
        if not builds:
            return 0

        unique_sets = set()
        for _, build, _ in builds:
            enhancement_set = self._get_enhancement_set(build)
            unique_sets.add(enhancement_set)

        return len(unique_sets)

    def _generate_enhancement_ranking_report(
        self,
        enhancement_stats: List[Dict],
        total_builds: int,
        overall_median: float,
        top_50_median: float,
        top_20_median: float,
        top_10_median: float,
        top_5_median: float
    ):
        """Generate enhancement ranking report."""
        report_path = os.path.join(self.reports_dir, f'enhancement_ranking_{self.archetype}.md')

        # Check if this is a multi-attack archetype
        has_multi_attack = any(stats.get('has_multi_attack', False) for stats in enhancement_stats)

        # Sort by Top50% efficiency (descending = better)
        enhancement_stats_sorted = sorted(enhancement_stats, key=lambda x: x['top50_efficiency'])

        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(f"# VITALITY SYSTEM - ENHANCEMENT RANKING REPORT ({self.archetype.upper()})\n\n")
            f.write("Enhancement performance ranked by Top50% vs Med / cost.\n")
            f.write("Lower (more negative) = better efficiency.\n\n")

            # Add overall statistics
            f.write("## Overall Build Statistics\n\n")
            f.write(f"- **Total builds tested**: {total_builds}\n")
            f.write(f"- **Overall median turns**: {overall_median:.1f}\n")
            f.write(f"- **Top 50% median turns**: {top_50_median:.1f}\n")
            f.write(f"- **Top 20% median turns**: {top_20_median:.1f}\n")
            f.write(f"- **Top 10% median turns**: {top_10_median:.1f}\n")
            f.write(f"- **Top 5% median turns**: {top_5_median:.1f}\n\n")

            # Add methodology explanation
            f.write("## Methodology\n\n")
            f.write("This report ranks enhancements by their cost-efficiency in above-average builds:\n\n")
            f.write("**Key Metrics**:\n")
            f.write("1. **Avg Turns**: Mean turns across all builds containing this enhancement\n")
            f.write("2. **vs Median**: Deviation from overall median (negative = better than median)\n")
            f.write("3. **Top5%/10%/20%/50% Turns**: Median turns for the top X% of builds (by rank) containing this enhancement\n")
            f.write("4. **TopX% vs Median**: How much better/worse the top X% performs vs overall median\n")
            f.write("5. **TopX% Efficiency**: (TopX% vs Median) / cost - efficiency metric normalized by cost\n")
            f.write("6. **Attack Type Breakdown**: Average turns when used with each attack type (0 = incompatible)\n")
            if has_multi_attack:
                f.write("7. **Slot1/Slot2**: % of builds where enhancement appears in Attack Slot 1 vs 2 (build composition)\n")
                f.write("8. **Used1/Used2**: % of combat where Attack 1 vs 2 was actually used (combat behavior)\n")
            f.write("\n**Primary Ranking**: Top50% vs Med / cost (lower = better efficiency in above-average builds)\n\n")
            f.write("**Data Source**: All valid builds within point budget, tested across multiple combat scenarios.\n\n")
            f.write("**NOTE**: This report ranks individual enhancements in isolation. For synergy analysis and build archetypes, see `performance_tier_analysis_{}.md`.\n\n".format(self.archetype))

            # Table header - conditional based on archetype
            if has_multi_attack:
                f.write("| Rank | Enhancement | Cost | Top50% vs Med / cost | Avg Turns | vs Median | Top5% | Top5% vs Med | Top5% Eff | Top10% | Top10% vs Med | Top10% Eff | Top20% | Top20% vs Med | Top20% Eff | Top50% | Top50% vs Med | Top50% Eff | Melee_AC | Melee_DG | Ranged | Area | Direct | Slot1 | Slot2 | Used1 | Used2 | Uses | Med Rank |\n")
                f.write("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n")
            else:
                f.write("| Rank | Enhancement | Cost | Top50% vs Med / cost | Avg Turns | vs Median | Top5% | Top5% vs Median | Top5% Eff | Top10% | Top10% vs Median | Top10% Eff | Top20% | Top20% vs Median | Top20% Eff | Top50% | Top50% vs Median | Top50% Eff | Melee_AC | Melee_DG | Ranged | Area | Direct | Uses | Med Rank |\n")
                f.write("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n")

            # Table rows
            for i, stats in enumerate(enhancement_stats_sorted, 1):
                row = (
                    f"| {i} | {stats['name']} | {stats['cost']}p | {stats['top50_efficiency']:.2f} | "
                    f"{stats['avg_turns']:.1f} | {stats['vs_median']:+.1f} | "
                    f"{stats['median_top_5']:.1f} | {stats['top5_vs_median']:+.1f} | {stats['top5_efficiency']:.2f} | "
                    f"{stats['median_top_10']:.1f} | {stats['top10_vs_median']:+.1f} | {stats['top10_efficiency']:.2f} | "
                    f"{stats['median_top_20']:.1f} | {stats['top20_vs_median']:+.1f} | {stats['top20_efficiency']:.2f} | "
                    f"{stats['median_top_50']:.1f} | {stats['top50_vs_median']:+.1f} | {stats['top50_efficiency']:.2f} | "
                    f"{stats['melee_ac']:.1f} | {stats['melee_dg']:.1f} | {stats['ranged']:.1f} | "
                    f"{stats['area']:.1f} | {stats['direct_damage']:.1f} | "
                )

                # Add build slot and combat usage columns for multi-attack archetypes
                if has_multi_attack:
                    if stats.get('has_multi_attack', False):
                        row += f"{stats['slot1_pct']}% | {stats['slot2_pct']}% | {stats['used1_pct']}% | {stats['used2_pct']}% | "
                    else:
                        row += "- | - | - | - | "

                row += f"{stats['appearances']} | {stats['median_rank']:.1f} |\n"
                f.write(row)

            # Notes
            f.write("\n## Column Definitions\n\n")
            f.write("- **Top50% vs Med / cost**: (Top50% vs Median) / cost - primary ranking metric (lower = better)\n")
            f.write("- **Avg Turns**: Average turns to kill across all builds with this enhancement\n")
            f.write("- **vs Median**: Deviation from median (negative = better than median)\n")
            f.write("- **Top5%**: Median turns for top 5% of builds with this enhancement\n")
            f.write("- **Top5% vs Median**: Top 5% deviation from overall median\n")
            f.write("- **Top5% Eff**: (Top5% vs Median) / cost (efficiency metric)\n")
            f.write("- **Top10%**: Median turns for top 10% of builds with this enhancement\n")
            f.write("- **Top10% vs Median**: Top 10% deviation from overall median\n")
            f.write("- **Top10% Eff**: (Top10% vs Median) / cost (efficiency metric)\n")
            f.write("- **Top20%**: Median turns for top 20% of builds with this enhancement\n")
            f.write("- **Top20% vs Median**: Top 20% deviation from overall median\n")
            f.write("- **Top20% Eff**: (Top20% vs Median) / cost (efficiency metric)\n")
            f.write("- **Top50%**: Median turns for top 50% of builds\n")
            f.write("- **Top50% vs Median**: Top 50% deviation from overall median\n")
            f.write("- **Top50% Eff**: (Top50% vs Median) / cost (efficiency metric)\n")
            f.write("- **Melee_AC/DG/Ranged/Area/Direct**: Avg turns by attack type (0 = not compatible)\n")
            if has_multi_attack:
                f.write("- **Slot1/Slot2**: Percentage of builds where this enhancement is in Attack Slot 1 vs Slot 2 (build composition)\n")
                f.write("- **Used1/Used2**: Percentage of combat turns where Attack 1 vs Attack 2 was actually used (combat behavior)\n")
            f.write("- **Uses**: Number of builds containing this enhancement\n")
            f.write("- **Med Rank**: Median rank position of builds with this enhancement\n")

        print(f"  + Enhancement ranking report: enhancement_ranking_{self.archetype}.md")

    def _generate_cost_analysis_report(
        self,
        enhancement_stats: List[Dict],
        overall_median: float,
        top_50_median: float,
        top_20_median: float,
        top_10_median: float,
        top_5_median: float
    ):
        """Generate cost analysis report."""
        report_path = os.path.join(self.reports_dir, f'cost_analysis_{self.archetype}.md')

        # Count enhancements by cost
        cost_counts = {}
        for stats in enhancement_stats:
            cost = stats['cost']
            cost_counts[cost] = cost_counts.get(cost, 0) + 1

        # Group by cost
        cost_groups = {}
        for stats in enhancement_stats:
            cost = stats['cost']
            if cost not in cost_groups:
                cost_groups[cost] = []
            cost_groups[cost].append(stats)

        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(f"# {self.archetype.upper()} - COST ANALYSIS REPORT\n\n")

            # Add overall statistics
            f.write("## Overall Build Statistics\n\n")
            f.write(f"- **Overall median turns**: {overall_median:.1f}\n")
            f.write(f"- **Top 50% median turns**: {top_50_median:.1f}\n")
            f.write(f"- **Top 20% median turns**: {top_20_median:.1f}\n")
            f.write(f"- **Top 10% median turns**: {top_10_median:.1f}\n")
            f.write(f"- **Top 5% median turns**: {top_5_median:.1f}\n\n")

            # Add methodology explanation
            f.write("## Methodology\n\n")
            f.write("This report groups enhancements by point cost to identify best value options at each tier:\n\n")
            f.write("**Key Metrics**:\n")
            f.write("1. **Avg Turns**: Mean turns across all builds containing this enhancement\n")
            f.write("2. **vs Median**: Deviation from overall median (negative = better than median)\n")
            f.write("3. **Efficiency**: (vs Median) / cost - raw cost efficiency across all builds\n")
            f.write("4. **Top5%/10%/20%/50% Metrics**: Performance and efficiency in top-performing builds\n")
            f.write("5. **TopX% Efficiency**: (TopX% vs Median) / cost - normalized efficiency in top builds\n\n")
            f.write("**Sorting**: Primary by cost (ascending), secondary by avg turns (ascending = better)\n\n")
            f.write("**Purpose**: Identify the best value enhancements at each cost tier for budget-constrained builds.\n\n")

            # Cost distribution
            f.write("## Cost Distribution\n\n")
            f.write("| Cost | Count |\n")
            f.write("|---|---|\n")
            for cost in sorted(cost_counts.keys()):
                point_label = "point" if cost == 1 else "points"
                f.write(f"| {cost} {point_label} | {cost_counts[cost]} |\n")
            f.write(f"| **Total** | **{len(enhancement_stats)}** |\n\n")

            # All enhancements by cost and performance
            f.write("## All Upgrades/Limits by Cost and Performance\n\n")
            f.write("Sorted by: Cost (ascending), then Avg Turns (ascending)\n\n")
            f.write("| Enhancement | Cost | Avg Turns | vs Median | Efficiency | Top5% | Top5% vs Med | Top5% Eff | Top10% | Top10% vs Med | Top10% Eff | Top20% | Top20% vs Med | Top20% Eff | Top50% | Top50% vs Med | Top50% Eff |\n")
            f.write("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n")

            for cost in sorted(cost_groups.keys()):
                f.write(f"| **COST {cost}** |\n")
                for stats in cost_groups[cost]:
                    efficiency = stats['vs_median'] / cost if cost > 0 else 0
                    f.write(
                        f"| {stats['name']} | {cost} | {stats['avg_turns']:.1f} | "
                        f"{stats['vs_median']:+.1f} | {efficiency:.2f} | "
                        f"{stats['median_top_5']:.1f} | {stats['top5_vs_median']:+.1f} | "
                        f"{stats['top5_efficiency']:.2f} | "
                        f"{stats['median_top_10']:.1f} | {stats['top10_vs_median']:+.1f} | "
                        f"{stats['top10_efficiency']:.2f} | "
                        f"{stats['median_top_20']:.1f} | {stats['top20_vs_median']:+.1f} | "
                        f"{stats['top20_efficiency']:.2f} | "
                        f"{stats['median_top_50']:.1f} | {stats['top50_vs_median']:+.1f} | "
                        f"{stats['top50_efficiency']:.2f} |\n"
                    )

            # Notes
            f.write("\n## Notes\n\n")
            f.write("- **Avg Turns**: Average turns to kill across all builds with this enhancement\n")
            f.write("- **vs Median**: Deviation from median turns (negative = better than median)\n")
            f.write("- **Efficiency**: (vs Median) / cost (lower is better)\n")
            f.write("- **Top5%**: Median turns for top 5% performing builds\n")
            f.write("- **Top5% vs Med**: Top 5% deviation from overall median\n")
            f.write("- **Top5% Eff**: (Top5% vs Median) / cost\n")
            f.write("- **Top10%**: Median turns for top 10% performing builds\n")
            f.write("- **Top10% vs Med**: Top 10% deviation from overall median\n")
            f.write("- **Top10% Eff**: (Top10% vs Median) / cost\n")
            f.write("- **Top20%**: Median turns for top 20% performing builds\n")
            f.write("- **Top20% vs Med**: Top 20% deviation from overall median\n")
            f.write("- **Top20% Eff**: (Top20% vs Median) / cost\n")
            f.write("- **Top50%**: Median turns for top 50% performing builds\n")
            f.write("- **Top50% vs Med**: Top 50% deviation from overall median\n")
            f.write("- **Top50% Eff**: (Top50% vs Median) / cost\n")
            f.write(f"- {self.archetype.title()} testing shows performance in complete builds (not isolation)\n")

        print(f"  + Cost analysis report: cost_analysis_{self.archetype}.md")

    def _generate_performance_tier_analysis(
        self,
        build_results: List[Tuple],
        overall_median: float,
        top_50_median: float,
        top_20_median: float,
        top_10_median: float,
        top_5_median: float
    ):
        """Generate performance tier analysis report showing build distribution and enhancement representation.

        Args:
            build_results: List of (build, avg_dpt, avg_turns) tuples
            overall_median: Median turns across all builds
            top_50_median: Median turns for top 50% of builds
            top_20_median: Median turns for top 20% of builds
            top_10_median: Median turns for top 10% of builds
            top_5_median: Median turns for top 5% of builds
        """
        report_path = os.path.join(self.reports_dir, f'performance_tier_analysis_{self.archetype}.md')

        # Sort builds by performance (ascending = better)
        sorted_builds = sorted(build_results, key=lambda x: x[2])
        total_builds = len(sorted_builds)

        # Calculate tier boundaries
        top_5_count = max(1, int(total_builds * 0.05))
        top_10_count = max(1, int(total_builds * 0.10))
        top_20_count = max(1, int(total_builds * 0.20))
        top_50_count = max(1, int(total_builds * 0.50))

        # Extract tier builds
        tiers = {
            'Top 5%': sorted_builds[:top_5_count],
            'Top 10%': sorted_builds[:top_10_count],
            'Top 20%': sorted_builds[:top_20_count],
            'Top 50%': sorted_builds[:top_50_count],
            'Bottom 50%': sorted_builds[top_50_count:]
        }

        # Calculate tier statistics
        tier_stats = {}
        for tier_name, tier_builds in tiers.items():
            turns_values = [turns for _, _, turns in tier_builds]
            median_turns = statistics.median(turns_values) if turns_values else 0
            std_dev = statistics.stdev(turns_values) if len(turns_values) >= 2 else 0
            vs_overall = median_turns - overall_median
            unique_builds = len(set(self._get_enhancement_set(build) for build, _, _ in tier_builds))

            tier_stats[tier_name] = {
                'median': median_turns,
                'std_dev': std_dev,
                'vs_overall': vs_overall,
                'unique_builds': unique_builds,
                'total_builds': len(tier_builds)
            }

        # Calculate skill expression (performance gap)
        skill_expression = tier_stats['Bottom 50%']['median'] - tier_stats['Top 5%']['median']

        # Track enhancement representation in each tier
        enhancement_tier_data = {}

        for tier_name, tier_builds in tiers.items():
            # Count enhancement appearances in this tier
            enhancement_counts = {}
            for build, _, _ in tier_builds:
                enhancement_set = self._get_enhancement_set(build)
                for enhancement in enhancement_set:
                    enhancement_counts[enhancement] = enhancement_counts.get(enhancement, 0) + 1

            # Store representation data
            for enhancement, count in enhancement_counts.items():
                if enhancement not in enhancement_tier_data:
                    enhancement_tier_data[enhancement] = {
                        'name': enhancement,
                        'cost': UPGRADES.get(enhancement, LIMITS.get(enhancement)).cost if enhancement in UPGRADES or enhancement in LIMITS else 0,
                        'tier_counts': {},
                        'tier_percentages': {}
                    }

                enhancement_tier_data[enhancement]['tier_counts'][tier_name] = count
                enhancement_tier_data[enhancement]['tier_percentages'][tier_name] = (count / len(tier_builds)) * 100

        # Calculate tier preference ratios and identify noob traps/elite picks
        enhancement_analysis = []
        for enhancement, data in enhancement_tier_data.items():
            top_5_pct = data['tier_percentages'].get('Top 5%', 0)
            bottom_50_pct = data['tier_percentages'].get('Bottom 50%', 0)

            # Calculate tier preference ratio (avoid division by zero)
            if bottom_50_pct > 0:
                tier_ratio = top_5_pct / bottom_50_pct
            else:
                tier_ratio = float('inf') if top_5_pct > 0 else 0

            # Identify noob traps (overrepresented in bottom tier)
            is_noob_trap = bottom_50_pct > (top_5_pct * 1.5) and bottom_50_pct > 10

            # Identify elite picks (overrepresented in top tier)
            is_elite_pick = top_5_pct > (bottom_50_pct * 1.5) and top_5_pct > 10

            enhancement_analysis.append({
                'name': enhancement,
                'cost': data['cost'],
                'top_5_pct': top_5_pct,
                'top_10_pct': data['tier_percentages'].get('Top 10%', 0),
                'top_20_pct': data['tier_percentages'].get('Top 20%', 0),
                'top_50_pct': data['tier_percentages'].get('Top 50%', 0),
                'bottom_50_pct': bottom_50_pct,
                'tier_ratio': tier_ratio,
                'is_noob_trap': is_noob_trap,
                'is_elite_pick': is_elite_pick
            })

        # Sort by tier ratio (descending = elite picks first)
        enhancement_analysis.sort(key=lambda x: x['tier_ratio'], reverse=True)

        # Find dominant build archetypes (common 2-3 enhancement combinations)
        def find_common_combinations(tier_builds, top_n=10):
            """Find most common 2-3 enhancement combinations in a tier."""
            from collections import Counter
            from itertools import combinations

            combo_counts = Counter()
            for build, _, _ in tier_builds:
                enhancement_set = self._get_enhancement_set(build)
                # Generate all 2-enhancement and 3-enhancement combinations
                for size in [2, 3]:
                    if len(enhancement_set) >= size:
                        for combo in combinations(sorted(enhancement_set), size):
                            combo_counts[combo] += 1

            # Get top N combinations
            return combo_counts.most_common(top_n)

        tier_archetypes = {}
        for tier_name in ['Top 5%', 'Top 10%', 'Top 20%']:
            tier_archetypes[tier_name] = find_common_combinations(tiers[tier_name], top_n=10)

        # Write report
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(f"# {self.archetype.upper()} - PERFORMANCE TIER ANALYSIS\n\n")
            f.write("Analysis of build performance distribution and enhancement representation across skill tiers.\n")
            f.write("Focus: What do good builds look like? What combinations dominate top-tier play?\n\n")

            # Section 1: Tier Performance Distribution
            f.write("## 1. Tier Performance Distribution\n\n")
            f.write("| Tier | Median Turns | Std Dev | vs Overall Median | Unique Builds | Total Builds |\n")
            f.write("|---|---|---|---|---|---|\n")

            for tier_name in ['Top 5%', 'Top 10%', 'Top 20%', 'Top 50%', 'Bottom 50%']:
                stats = tier_stats[tier_name]
                f.write(
                    f"| {tier_name} | {stats['median']:.1f} | {stats['std_dev']:.2f} | "
                    f"{stats['vs_overall']:+.1f} | {stats['unique_builds']} | {stats['total_builds']} |\n"
                )

            f.write(f"\n**Skill Expression**: {skill_expression:.1f} turns (Bottom 50% - Top 5%)\n")
            f.write(f"**Overall Median**: {overall_median:.1f} turns\n\n")

            # Section 2: Meta Diversity Analysis
            f.write("## 2. Meta Diversity Analysis\n\n")

            diversity_scores = {}
            for tier_name in ['Top 5%', 'Top 10%', 'Top 20%']:
                stats = tier_stats[tier_name]
                diversity_score = (stats['unique_builds'] / stats['total_builds']) * 100
                diversity_scores[tier_name] = diversity_score

            f.write("| Tier | Unique Builds | Total Builds | Diversity Score |\n")
            f.write("|---|---|---|---|\n")
            for tier_name in ['Top 5%', 'Top 10%', 'Top 20%']:
                stats = tier_stats[tier_name]
                f.write(
                    f"| {tier_name} | {stats['unique_builds']} | {stats['total_builds']} | "
                    f"{diversity_scores[tier_name]:.1f}% |\n"
                )

            f.write("\n**Interpretation**:\n")
            f.write("- **High Diversity Score** (>80%): Diverse meta with many viable strategies\n")
            f.write("- **Low Diversity Score** (<50%): Solved meta with few dominant builds\n\n")

            # Section 3: Enhancement Tier Representation
            f.write("## 3. Enhancement Tier Representation\n\n")
            f.write("Shows % of builds in each tier containing the enhancement.\n")
            f.write("Sorted by Tier Preference Ratio (Top 5% / Bottom 50%).\n\n")

            f.write("| Rank | Enhancement | Cost | Top 5% | Top 10% | Top 20% | Top 50% | Bottom 50% | Tier Ratio | Flag |\n")
            f.write("|---|---|---|---|---|---|---|---|---|---|\n")

            for i, data in enumerate(enhancement_analysis, 1):
                flag = ""
                if data['is_elite_pick']:
                    flag = "⭐ Elite"
                elif data['is_noob_trap']:
                    flag = "⚠️ Noob Trap"

                ratio_str = f"{data['tier_ratio']:.2f}" if data['tier_ratio'] != float('inf') else "∞"

                f.write(
                    f"| {i} | {data['name']} | {data['cost']}p | "
                    f"{data['top_5_pct']:.1f}% | {data['top_10_pct']:.1f}% | "
                    f"{data['top_20_pct']:.1f}% | {data['top_50_pct']:.1f}% | "
                    f"{data['bottom_50_pct']:.1f}% | {ratio_str} | {flag} |\n"
                )

            f.write("\n**Flag Definitions**:\n")
            f.write("- **⭐ Elite**: Overrepresented in Top 5% (appears 50%+ more frequently in top builds)\n")
            f.write("- **⚠️ Noob Trap**: Overrepresented in Bottom 50% (appears 50%+ more frequently in bad builds)\n\n")

            # Section 4: Dominant Build Archetypes
            f.write("## 4. Dominant Build Archetypes\n\n")
            f.write("Most common 2-3 enhancement combinations in top-performing builds.\n\n")

            for tier_name in ['Top 5%', 'Top 10%', 'Top 20%']:
                f.write(f"### {tier_name} Archetypes\n\n")
                f.write("| Rank | Enhancement Combination | Occurrences | % of Tier |\n")
                f.write("|---|---|---|---|\n")

                tier_total = tier_stats[tier_name]['total_builds']
                for i, (combo, count) in enumerate(tier_archetypes[tier_name], 1):
                    combo_str = " + ".join(combo)
                    pct = (count / tier_total) * 100
                    f.write(f"| {i} | {combo_str} | {count} | {pct:.1f}% |\n")

                f.write("\n")

            # Methodology
            f.write("## Methodology\n\n")
            f.write("**Tier Calculation**:\n")
            f.write("- Builds sorted by average turns (ascending = better)\n")
            f.write("- Top 5% = best 5% of all builds tested\n")
            f.write("- Bottom 50% = worst 50% of all builds tested\n\n")

            f.write("**Enhancement Representation**:\n")
            f.write("- For each tier, % = (builds with enhancement / total builds in tier) × 100\n")
            f.write("- Tier Ratio = Top 5% representation / Bottom 50% representation\n")
            f.write("- Higher ratio = more prevalent in elite builds\n\n")

            f.write("**Build Archetypes**:\n")
            f.write("- Analyzes all 2-enhancement and 3-enhancement combinations\n")
            f.write("- Shows which synergies actually dominate top-tier play\n")
            f.write("- Reveals real successful combinations vs theoretical rankings\n\n")

        print(f"  + Performance tier analysis report: performance_tier_analysis_{self.archetype}.md")

    def _generate_individual_report(self, individual_results: List[IndividualResult]):
        """Generate individual enhancement testing report."""
        report_path = os.path.join(self.reports_dir, f'individual_enhancements_{self.archetype}.md')

        # Sort by avg_turns (ascending = better)
        sorted_results = sorted(individual_results, key=lambda x: x.avg_turns)

        # Check if any results have attack usage data (dual_natured/versatile)
        has_attack_usage = any(result.attack_usage for result in individual_results)

        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(f"# {self.archetype.upper()} - INDIVIDUAL ENHANCEMENT TESTING\n\n")
            f.write("Performance of each enhancement tested in isolation (baseline attack + single enhancement).\n")
            f.write("Lower avg turns = better performance.\n\n")

            # Add methodology explanation
            f.write("## Methodology\n\n")
            f.write("This report measures each enhancement's raw power in isolation:\n\n")
            f.write("**Testing Method**:\n")
            f.write("- Each enhancement tested with baseline attack only (no other enhancements)\n")
            f.write("- Prerequisites added when required (e.g., critical_accuracy for powerful_critical)\n")
            f.write("- Tested across all compatible attack types and scenarios\n")
            f.write("- Results show standalone performance without synergies\n\n")
            f.write("**Key Metrics**:\n")
            f.write("1. **Avg Turns**: Mean across all compatible attack types and scenarios\n")
            f.write("2. **Attack Type Columns**: Performance with specific attack types (0 = incompatible)\n")
            if has_attack_usage:
                f.write("3. **Atk1/Atk2**: % of scenarios where Attack 1 vs 2 was chosen (multi-attack archetypes)\n")
            f.write("\n**Purpose**: Identify which enhancements are strongest on their own vs requiring synergies.\n\n")
            f.write("**Compare to Build Rankings**: Build rankings show enhancements in combination, not isolation.\n\n")

            f.write(f"**Total enhancements tested**: {len(individual_results)}\n\n")

            # Main table - conditional columns based on attack usage
            if has_attack_usage:
                f.write("| Rank | Enhancement | Type | Cost | Avg Turns | Melee_AC | Melee_DG | Ranged | Area | Direct | Atk1 | Atk2 |\n")
                f.write("|---|---|---|---|---|---|---|---|---|---|---|---|\n")
            else:
                f.write("| Rank | Enhancement | Type | Cost | Avg Turns | Melee_AC | Melee_DG | Ranged | Area | Direct |\n")
                f.write("|---|---|---|---|---|---|---|---|---|---|\n")

            for i, result in enumerate(sorted_results, 1):
                # Get attack type turns (or 0 if not compatible)
                melee_ac = result.attack_type_turns.get('melee_ac', 0)
                melee_dg = result.attack_type_turns.get('melee_dg', 0)
                ranged = result.attack_type_turns.get('ranged', 0)
                area = result.attack_type_turns.get('area', 0)
                direct = result.attack_type_turns.get('direct_damage', 0)

                row = (
                    f"| {i} | {result.enhancement_name} | {result.enhancement_type} | "
                    f"{result.cost}p | {result.avg_turns:.1f} | "
                    f"{melee_ac:.1f} | {melee_dg:.1f} | {ranged:.1f} | {area:.1f} | {direct:.1f} |"
                )

                # Add attack usage columns if available
                if has_attack_usage:
                    if result.attack_usage:
                        atk1_count = result.attack_usage.get(0, 0)
                        atk2_count = result.attack_usage.get(1, 0)
                        total = atk1_count + atk2_count
                        if total > 0:
                            atk1_pct = int((atk1_count / total) * 100)
                            atk2_pct = int((atk2_count / total) * 100)
                            row += f" {atk1_pct}% | {atk2_pct}% |"
                        else:
                            row += " - | - |"
                    else:
                        row += " - | - |"

                row += "\n"
                f.write(row)

            # Notes
            f.write("\n## Notes\n\n")
            f.write("- **Avg Turns**: Average across all compatible attack types and scenarios\n")
            f.write("- **Attack Type Columns**: Average turns for that specific attack type (0 = not compatible)\n")
            if has_attack_usage:
                f.write("- **Atk1/Atk2**: Percentage of scenarios where Attack 1 vs Attack 2 was chosen (dual-natured/versatile only)\n")
            f.write("- **Testing Method**: Each enhancement tested with baseline attack + prerequisites (if any)\n")
            f.write("- **Isolation Testing**: Shows raw enhancement power without synergies\n")
            f.write("- **Compare to Build Rankings**: Build rankings show enhancements in combination, not isolation\n")

        print(f"  + Individual enhancement report: individual_enhancements_{self.archetype}.md")

    def _generate_individual_cost_analysis(self, individual_results: List[IndividualResult]):
        """Generate cost analysis for individual enhancement testing."""
        report_path = os.path.join(self.reports_dir, f'individual_cost_analysis_{self.archetype}.md')

        # Group by cost
        cost_groups = {}
        for result in individual_results:
            cost = result.cost
            if cost not in cost_groups:
                cost_groups[cost] = []
            cost_groups[cost].append(result)

        # Sort each cost group by avg_turns
        for cost in cost_groups:
            cost_groups[cost].sort(key=lambda x: x.avg_turns)

        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(f"# {self.archetype.upper()} - INDIVIDUAL COST ANALYSIS\n\n")
            f.write("Individual enhancement performance grouped by cost.\n")
            f.write("Lower avg turns = better performance.\n\n")

            # Add methodology explanation
            f.write("## Methodology\n\n")
            f.write("This report groups individual enhancement tests by point cost:\n\n")
            f.write("**Testing Method**:\n")
            f.write("- Each enhancement tested in isolation (baseline attack + enhancement only)\n")
            f.write("- Prerequisites added when required\n")
            f.write("- Tested across all compatible attack types and scenarios\n\n")
            f.write("**Purpose**: Identify best value enhancements at each cost tier in isolation.\n\n")
            f.write("**Key Insight**: Compare same-cost enhancements to find most efficient standalone options.\n\n")

            # Cost distribution
            f.write("## Cost Distribution\n\n")
            f.write("| Cost | Count |\n")
            f.write("|---|---|\n")
            for cost in sorted(cost_groups.keys()):
                point_label = "point" if cost == 1 else "points"
                f.write(f"| {cost} {point_label} | {len(cost_groups[cost])} |\n")
            f.write(f"| **Total** | **{len(individual_results)}** |\n\n")

            # All enhancements by cost
            f.write("## All Enhancements by Cost\n\n")
            f.write("Sorted by: Cost (ascending), then Avg Turns (ascending)\n\n")

            for cost in sorted(cost_groups.keys()):
                point_label = "point" if cost == 1 else "points"
                f.write(f"### {cost} {point_label}\n\n")
                f.write("| Rank | Enhancement | Type | Avg Turns | Melee_AC | Melee_DG | Ranged | Area | Direct |\n")
                f.write("|---|---|---|---|---|---|---|---|---|\n")

                for i, result in enumerate(cost_groups[cost], 1):
                    melee_ac = result.attack_type_turns.get('melee_ac', 0)
                    melee_dg = result.attack_type_turns.get('melee_dg', 0)
                    ranged = result.attack_type_turns.get('ranged', 0)
                    area = result.attack_type_turns.get('area', 0)
                    direct = result.attack_type_turns.get('direct_damage', 0)

                    f.write(
                        f"| {i} | {result.enhancement_name} | {result.enhancement_type} | "
                        f"{result.avg_turns:.1f} | {melee_ac:.1f} | {melee_dg:.1f} | "
                        f"{ranged:.1f} | {area:.1f} | {direct:.1f} |\n"
                    )
                f.write("\n")

            # Notes
            f.write("## Notes\n\n")
            f.write("- **Avg Turns**: Average across all compatible attack types and scenarios\n")
            f.write("- **Attack Type Columns**: Average turns for that specific attack type\n")
            f.write("- **0.0**: Enhancement not compatible with that attack type\n")
            f.write("- **100.0**: Attack type exists but wasn't tested for this enhancement\n")
            f.write("- **Isolation Testing**: Each enhancement tested alone (baseline + enhancement only)\n")
            f.write("- **Cost Efficiency**: Lower cost + lower turns = better value\n")

        print(f"  + Individual cost analysis report: individual_cost_analysis_{self.archetype}.md")
