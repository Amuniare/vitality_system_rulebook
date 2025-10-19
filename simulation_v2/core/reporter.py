"""Streamlined reporting for Simulation V2."""

import os
import statistics
from datetime import datetime
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

        # Build individual results dictionary for synergy calculation
        individual_results_dict = None
        if individual_results:
            individual_results_dict = {result.enhancement_name: result for result in individual_results}

        # Calculate enhancement stats from build results
        enhancement_stats = self._calculate_enhancement_stats(build_results, individual_results_dict)

        # Calculate overall median and percentile medians for all reports
        all_turns = [avg_turns for _, _, avg_turns in build_results]
        overall_median = statistics.median(all_turns) if all_turns else 0

        # Calculate percentile medians (top builds by rank)
        sorted_builds = sorted(build_results, key=lambda x: x[2])  # Sort by avg_turns (ascending = better)
        total_builds = len(sorted_builds)

        if total_builds > 0:
            top_1_count = max(1, int(total_builds * 0.01))
            top_5_count = max(1, int(total_builds * 0.05))
            top_10_count = max(1, int(total_builds * 0.10))
            top_20_count = max(1, int(total_builds * 0.20))
            top_50_count = max(1, int(total_builds * 0.50))

            top_1_median = statistics.median([turns for _, _, turns in sorted_builds[:top_1_count]])
            top_5_median = statistics.median([turns for _, _, turns in sorted_builds[:top_5_count]])
            top_10_median = statistics.median([turns for _, _, turns in sorted_builds[:top_10_count]])
            top_20_median = statistics.median([turns for _, _, turns in sorted_builds[:top_20_count]])
            top_50_median = statistics.median([turns for _, _, turns in sorted_builds[:top_50_count]])
        else:
            top_1_median = top_5_median = top_10_median = top_20_median = top_50_median = 0

        # Generate reports
        self._generate_enhancement_ranking_report(
            enhancement_stats, len(build_results), overall_median,
            top_50_median, top_20_median, top_10_median, top_5_median, top_1_median
        )
        self._generate_cost_analysis_report(
            enhancement_stats, overall_median,
            top_50_median, top_20_median, top_10_median, top_5_median, top_1_median
        )
        self._generate_performance_tier_analysis(
            build_results, overall_median,
            top_50_median, top_20_median, top_10_median, top_5_median, top_1_median
        )
        self._generate_top_1000_builds_report(
            build_results, overall_median
        )

        # Generate balance assessment report if individual results provided
        if individual_results_dict:
            self._generate_balance_assessment_report(enhancement_stats, overall_median)

        # Generate multi-tier reports (saturation and ranking)
        print(f"\n  Generating multi-tier reports...")
        self._generate_enhancement_saturation_report(build_results, overall_median)
        self._generate_enhancement_ranking_tiers_report(build_results, overall_median)

        # Generate top N reports (attack type distribution and enhancement saturation)
        print(f"\n  Generating top N analysis reports...")
        self._generate_top_n_attack_type_reports(build_results, overall_median)
        self._generate_top_n_saturation_reports(build_results, overall_median)

        print(f"\n  Reports saved to {self.reports_dir}")

    def _calculate_enhancement_stats(
        self,
        build_results: List[Tuple],
        individual_results_dict: Dict[str, IndividualResult] = None
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

            # Top 0.02%, Top 0.05%, Top 0.2%, Top 0.5%, Top 1%, Top 5%, Top 10%, Top 20%, and Top 50% statistics
            sorted_appearances = sorted(appearances, key=lambda x: x[0])  # Sort by rank
            top_0_02_count = max(1, len(sorted_appearances) // 5000)  # Top 0.02%
            top_0_05_count = max(1, len(sorted_appearances) // 2000)  # Top 0.05%
            top_0_2_count = max(1, len(sorted_appearances) // 500)   # Top 0.2%
            top_0_5_count = max(1, len(sorted_appearances) // 200)   # Top 0.5%
            top_1_count = max(1, len(sorted_appearances) // 100)
            top_5_count = max(1, len(sorted_appearances) // 20)
            top_10_count = max(1, len(sorted_appearances) // 10)
            top_20_count = max(1, len(sorted_appearances) // 5)
            top_50_count = max(1, len(sorted_appearances) // 2)

            top_0_02_turns = [turns for _, turns in sorted_appearances[:top_0_02_count]]
            top_0_05_turns = [turns for _, turns in sorted_appearances[:top_0_05_count]]
            top_0_2_turns = [turns for _, turns in sorted_appearances[:top_0_2_count]]
            top_0_5_turns = [turns for _, turns in sorted_appearances[:top_0_5_count]]
            top_1_turns = [turns for _, turns in sorted_appearances[:top_1_count]]
            top_5_turns = [turns for _, turns in sorted_appearances[:top_5_count]]
            top_10_turns = [turns for _, turns in sorted_appearances[:top_10_count]]
            top_20_turns = [turns for _, turns in sorted_appearances[:top_20_count]]
            top_50_turns = [turns for _, turns in sorted_appearances[:top_50_count]]

            median_top_0_02 = statistics.median(top_0_02_turns) if top_0_02_turns else 0
            median_top_0_05 = statistics.median(top_0_05_turns) if top_0_05_turns else 0
            median_top_0_2 = statistics.median(top_0_2_turns) if top_0_2_turns else 0
            median_top_0_5 = statistics.median(top_0_5_turns) if top_0_5_turns else 0
            median_top_1 = statistics.median(top_1_turns) if top_1_turns else 0
            median_top_5 = statistics.median(top_5_turns) if top_5_turns else 0
            median_top_10 = statistics.median(top_10_turns) if top_10_turns else 0
            median_top_20 = statistics.median(top_20_turns) if top_20_turns else 0
            median_top_50 = statistics.median(top_50_turns) if top_50_turns else 0

            top0_02_vs_median = median_top_0_02 - median_turns
            top0_05_vs_median = median_top_0_05 - median_turns
            top0_2_vs_median = median_top_0_2 - median_turns
            top0_5_vs_median = median_top_0_5 - median_turns
            top1_vs_median = median_top_1 - median_turns
            top5_vs_median = median_top_5 - median_turns
            top10_vs_median = median_top_10 - median_turns
            top20_vs_median = median_top_20 - median_turns
            top50_vs_median = median_top_50 - median_turns

            cost = data['cost']
            top0_02_efficiency = top0_02_vs_median / cost if cost > 0 else 0
            top0_05_efficiency = top0_05_vs_median / cost if cost > 0 else 0
            top0_2_efficiency = top0_2_vs_median / cost if cost > 0 else 0
            top0_5_efficiency = top0_5_vs_median / cost if cost > 0 else 0
            top1_efficiency = top1_vs_median / cost if cost > 0 else 0
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

            # === NEW BALANCE METRICS ===

            # 1. Median Rank Percentile (0-100, where 0=best, 100=worst)
            # Only consider top 50% of builds for median rank calculation
            total_builds = len(build_results)
            top_50_count_global = max(1, int(total_builds * 0.50))
            top_50_ranks = [rank for rank, _ in appearances if rank <= top_50_count_global]
            median_rank_val = statistics.median(top_50_ranks) if top_50_ranks else None
            median_rank_percentile = (median_rank_val / total_builds) * 100 if median_rank_val else 100

            # 2. Top 10% Saturation (% of top 10% builds that contain this enhancement)
            top_10_count_global = max(1, int(total_builds * 0.10))
            appearances_in_top_10 = len([r for r, _ in sorted_appearances if r <= top_10_count_global])
            top_10_saturation = (appearances_in_top_10 / top_10_count_global) * 100 if top_10_count_global > 0 else 0

            # 3. Synergy Dependence Score (Top 50% builds only)
            # Negative = better in builds, positive = worse in builds
            synergy_score = 0.0
            if individual_results_dict and name in individual_results_dict:
                # Get top 50% builds with this enhancement (by global rank, not local)
                top_50_count_global = max(1, int(total_builds * 0.50))
                top_50_appearances = [turns for rank, turns in sorted_appearances if rank <= top_50_count_global]

                if top_50_appearances:
                    top_50_avg_turns = statistics.mean(top_50_appearances)
                    individual_avg_turns = individual_results_dict[name].avg_turns

                    # Calculate synergy: negative = better in builds, positive = worse in builds
                    synergy_score = ((top_50_avg_turns - individual_avg_turns) / individual_avg_turns) * 100

            # 4. Balance Flags
            is_overpowered = median_rank_percentile < 20 and top_10_saturation > 60
            is_underpowered = median_rank_percentile > 70 and top_10_saturation < 5
            is_synergy_dependent = synergy_score < -15  # Performs 15%+ better in builds
            is_anti_synergy = synergy_score > 15  # Performs 15%+ worse in builds

            balance_flags = []
            if is_overpowered:
                balance_flags.append("OP")
            if is_underpowered:
                balance_flags.append("UP")
            if is_synergy_dependent:
                balance_flags.append("SYNERGY")
            if is_anti_synergy:
                balance_flags.append("ANTI-SYN")

            enhancement_stats.append({
                'name': name,
                'type': data['type'],
                'cost': cost,
                'avg_turns': avg_turns,
                'vs_median': vs_median,
                'median_top_0_02': median_top_0_02,
                'top0_02_vs_median': top0_02_vs_median,
                'top0_02_efficiency': top0_02_efficiency,
                'median_top_0_05': median_top_0_05,
                'top0_05_vs_median': top0_05_vs_median,
                'top0_05_efficiency': top0_05_efficiency,
                'median_top_0_2': median_top_0_2,
                'top0_2_vs_median': top0_2_vs_median,
                'top0_2_efficiency': top0_2_efficiency,
                'median_top_0_5': median_top_0_5,
                'top0_5_vs_median': top0_5_vs_median,
                'top0_5_efficiency': top0_5_efficiency,
                'median_top_1': median_top_1,
                'top1_vs_median': top1_vs_median,
                'top1_efficiency': top1_efficiency,
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
                'median_rank': median_rank_val if median_rank_val else 0,  # Already calculated above using top 50%
                'slot1_pct': slot1_pct,
                'slot2_pct': slot2_pct,
                'used1_pct': used1_pct,
                'used2_pct': used2_pct,
                'has_multi_attack': total_attack_uses > 0,
                # New balance metrics
                'median_rank_percentile': median_rank_percentile,
                'top_10_saturation': top_10_saturation,
                'synergy_score': synergy_score,
                'balance_flags': balance_flags,
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
        top_5_median: float,
        top_1_median: float
    ):
        """Generate enhancement ranking report."""
        report_path = os.path.join(self.reports_dir, f'enhancement_ranking_{self.archetype}.md')

        # Check if this is a multi-attack archetype
        has_multi_attack = any(stats.get('has_multi_attack', False) for stats in enhancement_stats)

        # Sort by Top20% efficiency (descending = better)
        enhancement_stats_sorted = sorted(enhancement_stats, key=lambda x: x['top20_efficiency'])

        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(f"# VITALITY SYSTEM - ENHANCEMENT RANKING REPORT ({self.archetype.upper()})\n\n")
            f.write("Enhancement performance ranked by Top20% vs Med / cost.\n")
            f.write("Lower (more negative) = better efficiency.\n\n")

            # Add overall statistics
            f.write("## Overall Build Statistics\n\n")
            f.write(f"- **Total builds tested**: {total_builds}\n")
            f.write(f"- **Overall median turns**: {overall_median:.1f}\n")
            f.write(f"- **Top 50% median turns**: {top_50_median:.1f}\n")
            f.write(f"- **Top 20% median turns**: {top_20_median:.1f}\n")
            f.write(f"- **Top 10% median turns**: {top_10_median:.1f}\n")
            f.write(f"- **Top 5% median turns**: {top_5_median:.1f}\n")
            f.write(f"- **Top 1% median turns**: {top_1_median:.1f}\n\n")

            # Add methodology explanation
            f.write("## Methodology\n\n")
            f.write("This report ranks enhancements by their cost-efficiency in top 20% builds:\n\n")
            f.write("**Key Metrics**:\n")
            f.write("1. **Avg Turns**: Mean turns across all builds containing this enhancement\n")
            f.write("2. **vs Median**: Deviation from overall median (negative = better than median)\n")
            f.write("3. **Top0.02%/0.05%/0.2%/0.5%/1%/5%/10%/20%/50% Turns**: Median turns for the top X% of builds (by rank) containing this enhancement\n")
            f.write("4. **TopX% vs Median**: How much better/worse the top X% performs vs overall median\n")
            f.write("5. **TopX% Efficiency**: (TopX% vs Median) / cost - efficiency metric normalized by cost\n")
            f.write("6. **Attack Type Breakdown**: Average turns when used with each attack type (0 = incompatible)\n")
            if has_multi_attack:
                f.write("7. **Slot1/Slot2**: % of builds where enhancement appears in Attack Slot 1 vs 2 (build composition)\n")
                f.write("8. **Used1/Used2**: % of combat where Attack 1 vs 2 was actually used (combat behavior)\n")
            f.write("\n**Primary Ranking**: Top20% vs Med / cost (lower = better efficiency in top 20% builds)\n\n")
            f.write("**Data Source**: All valid builds within point budget, tested across multiple combat scenarios.\n\n")
            f.write("**NOTE**: This report ranks individual enhancements in isolation. For synergy analysis and build archetypes, see `performance_tier_analysis_{}.md`.\n\n".format(self.archetype))

            # Table header - conditional based on archetype
            if has_multi_attack:
                f.write("| Rank | Enhancement | Cost | Top20% vs Med / cost | Avg Turns | vs Median | Top0.02% | Top0.02% vs Med | Top0.02% Eff | Top0.05% | Top0.05% vs Med | Top0.05% Eff | Top0.2% | Top0.2% vs Med | Top0.2% Eff | Top0.5% | Top0.5% vs Med | Top0.5% Eff | Top1% | Top1% vs Med | Top1% Eff | Top5% | Top5% vs Med | Top5% Eff | Top10% | Top10% vs Med | Top10% Eff | Top20% | Top20% vs Med | Top20% Eff | Top50% | Top50% vs Med | Top50% Eff | Melee_AC | Melee_DG | Ranged | Area | Direct | Slot1 | Slot2 | Used1 | Used2 | Uses | Med Rank |\n")
                f.write("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n")
            else:
                f.write("| Rank | Enhancement | Cost | Top20% vs Med / cost | Avg Turns | vs Median | Top0.02% | Top0.02% vs Median | Top0.02% Eff | Top0.05% | Top0.05% vs Median | Top0.05% Eff | Top0.2% | Top0.2% vs Median | Top0.2% Eff | Top0.5% | Top0.5% vs Median | Top0.5% Eff | Top1% | Top1% vs Median | Top1% Eff | Top5% | Top5% vs Median | Top5% Eff | Top10% | Top10% vs Median | Top10% Eff | Top20% | Top20% vs Median | Top20% Eff | Top50% | Top50% vs Median | Top50% Eff | Melee_AC | Melee_DG | Ranged | Area | Direct | Uses | Med Rank |\n")
                f.write("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n")

            # Table rows
            for i, stats in enumerate(enhancement_stats_sorted, 1):
                row = (
                    f"| {i} | {stats['name']} | {stats['cost']}p | {stats['top20_efficiency']:.2f} | "
                    f"{stats['avg_turns']:.1f} | {stats['vs_median']:+.1f} | "
                    f"{stats['median_top_0_02']:.1f} | {stats['top0_02_vs_median']:+.1f} | {stats['top0_02_efficiency']:.2f} | "
                    f"{stats['median_top_0_05']:.1f} | {stats['top0_05_vs_median']:+.1f} | {stats['top0_05_efficiency']:.2f} | "
                    f"{stats['median_top_0_2']:.1f} | {stats['top0_2_vs_median']:+.1f} | {stats['top0_2_efficiency']:.2f} | "
                    f"{stats['median_top_0_5']:.1f} | {stats['top0_5_vs_median']:+.1f} | {stats['top0_5_efficiency']:.2f} | "
                    f"{stats['median_top_1']:.1f} | {stats['top1_vs_median']:+.1f} | {stats['top1_efficiency']:.2f} | "
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
            f.write("- **Top20% vs Med / cost**: (Top20% vs Median) / cost - primary ranking metric (lower = better)\n")
            f.write("- **Avg Turns**: Average turns to kill across all builds with this enhancement\n")
            f.write("- **vs Median**: Deviation from median (negative = better than median)\n")
            f.write("- **Top0.02%**: Median turns for top 0.02% of builds with this enhancement (ultra-elite tier)\n")
            f.write("- **Top0.02% vs Median**: Top 0.02% deviation from overall median\n")
            f.write("- **Top0.02% Eff**: (Top0.02% vs Median) / cost (efficiency metric)\n")
            f.write("- **Top0.05%**: Median turns for top 0.05% of builds with this enhancement (ultra-elite tier)\n")
            f.write("- **Top0.05% vs Median**: Top 0.05% deviation from overall median\n")
            f.write("- **Top0.05% Eff**: (Top0.05% vs Median) / cost (efficiency metric)\n")
            f.write("- **Top0.2%**: Median turns for top 0.2% of builds with this enhancement (elite tier)\n")
            f.write("- **Top0.2% vs Median**: Top 0.2% deviation from overall median\n")
            f.write("- **Top0.2% Eff**: (Top0.2% vs Median) / cost (efficiency metric)\n")
            f.write("- **Top0.5%**: Median turns for top 0.5% of builds with this enhancement (elite tier)\n")
            f.write("- **Top0.5% vs Median**: Top 0.5% deviation from overall median\n")
            f.write("- **Top0.5% Eff**: (Top0.5% vs Median) / cost (efficiency metric)\n")
            f.write("- **Top1%**: Median turns for top 1% of builds with this enhancement\n")
            f.write("- **Top1% vs Median**: Top 1% deviation from overall median\n")
            f.write("- **Top1% Eff**: (Top1% vs Median) / cost (efficiency metric)\n")
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
            f.write("- **Med Rank**: Median rank position of builds with this enhancement (considers only top 50% of builds)\n")

        print(f"  + Enhancement ranking report: enhancement_ranking_{self.archetype}.md")

    def _generate_cost_analysis_report(
        self,
        enhancement_stats: List[Dict],
        overall_median: float,
        top_50_median: float,
        top_20_median: float,
        top_10_median: float,
        top_5_median: float,
        top_1_median: float
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
            f.write(f"- **Top 5% median turns**: {top_5_median:.1f}\n")
            f.write(f"- **Top 1% median turns**: {top_1_median:.1f}\n\n")

            # Add methodology explanation
            f.write("## Methodology\n\n")
            f.write("This report groups enhancements by point cost to identify best value options at each tier:\n\n")
            f.write("**Key Metrics**:\n")
            f.write("1. **Avg Turns**: Mean turns across all builds containing this enhancement\n")
            f.write("2. **vs Median**: Deviation from overall median (negative = better than median)\n")
            f.write("3. **Efficiency**: (vs Median) / cost - raw cost efficiency across all builds\n")
            f.write("4. **Top0.02%/0.05%/0.2%/0.5%/1%/5%/10%/20%/50% Metrics**: Performance and efficiency in top-performing builds\n")
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
            f.write("| Enhancement | Cost | Avg Turns | vs Median | Efficiency | Top0.02% | Top0.02% vs Med | Top0.02% Eff | Top0.05% | Top0.05% vs Med | Top0.05% Eff | Top0.2% | Top0.2% vs Med | Top0.2% Eff | Top0.5% | Top0.5% vs Med | Top0.5% Eff | Top1% | Top1% vs Med | Top1% Eff | Top5% | Top5% vs Med | Top5% Eff | Top10% | Top10% vs Med | Top10% Eff | Top20% | Top20% vs Med | Top20% Eff | Top50% | Top50% vs Med | Top50% Eff |\n")
            f.write("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n")

            for cost in sorted(cost_groups.keys()):
                f.write(f"| **COST {cost}** |\n")
                for stats in cost_groups[cost]:
                    efficiency = stats['vs_median'] / cost if cost > 0 else 0
                    f.write(
                        f"| {stats['name']} | {cost} | {stats['avg_turns']:.1f} | "
                        f"{stats['vs_median']:+.1f} | {efficiency:.2f} | "
                        f"{stats['median_top_0_02']:.1f} | {stats['top0_02_vs_median']:+.1f} | "
                        f"{stats['top0_02_efficiency']:.2f} | "
                        f"{stats['median_top_0_05']:.1f} | {stats['top0_05_vs_median']:+.1f} | "
                        f"{stats['top0_05_efficiency']:.2f} | "
                        f"{stats['median_top_0_2']:.1f} | {stats['top0_2_vs_median']:+.1f} | "
                        f"{stats['top0_2_efficiency']:.2f} | "
                        f"{stats['median_top_0_5']:.1f} | {stats['top0_5_vs_median']:+.1f} | "
                        f"{stats['top0_5_efficiency']:.2f} | "
                        f"{stats['median_top_1']:.1f} | {stats['top1_vs_median']:+.1f} | "
                        f"{stats['top1_efficiency']:.2f} | "
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
            f.write("- **Top0.02%**: Median turns for top 0.02% performing builds (ultra-elite tier)\n")
            f.write("- **Top0.02% vs Med**: Top 0.02% deviation from overall median\n")
            f.write("- **Top0.02% Eff**: (Top0.02% vs Median) / cost\n")
            f.write("- **Top0.05%**: Median turns for top 0.05% performing builds (ultra-elite tier)\n")
            f.write("- **Top0.05% vs Med**: Top 0.05% deviation from overall median\n")
            f.write("- **Top0.05% Eff**: (Top0.05% vs Median) / cost\n")
            f.write("- **Top0.2%**: Median turns for top 0.2% performing builds (elite tier)\n")
            f.write("- **Top0.2% vs Med**: Top 0.2% deviation from overall median\n")
            f.write("- **Top0.2% Eff**: (Top0.2% vs Median) / cost\n")
            f.write("- **Top0.5%**: Median turns for top 0.5% performing builds (elite tier)\n")
            f.write("- **Top0.5% vs Med**: Top 0.5% deviation from overall median\n")
            f.write("- **Top0.5% Eff**: (Top0.5% vs Median) / cost\n")
            f.write("- **Top1%**: Median turns for top 1% performing builds\n")
            f.write("- **Top1% vs Med**: Top 1% deviation from overall median\n")
            f.write("- **Top1% Eff**: (Top1% vs Median) / cost\n")
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
        top_5_median: float,
        top_1_median: float
    ):
        """Generate performance tier analysis report showing build distribution and enhancement representation.

        Args:
            build_results: List of (build, avg_dpt, avg_turns) tuples
            overall_median: Median turns across all builds
            top_50_median: Median turns for top 50% of builds
            top_20_median: Median turns for top 20% of builds
            top_10_median: Median turns for top 10% of builds
            top_5_median: Median turns for top 5% of builds
            top_1_median: Median turns for top 1% of builds
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

    def _generate_top_1000_builds_report(
        self,
        build_results: List[Tuple],
        overall_median: float
    ):
        """Generate top 1000 builds report showing ranked list of best builds.

        Args:
            build_results: List of (build, avg_dpt, avg_turns) tuples, already sorted by performance
            overall_median: Median turns across all builds
        """
        report_path = os.path.join(self.reports_dir, f'top_1000_builds_{self.archetype}.md')

        # Deduplicate builds - keep best performance for each unique build
        seen_builds = {}
        for build, avg_dpt, avg_turns in build_results:
            # Create a hashable key for the build
            if isinstance(build, MultiAttackBuild):
                # For multi-attack, hash all sub-builds
                build_key = tuple(
                    (sub.attack_type, tuple(sorted(sub.upgrades)), tuple(sorted(sub.limits)))
                    for sub in build.builds
                )
            else:
                # For single attack
                build_key = (build.attack_type, tuple(sorted(build.upgrades)), tuple(sorted(build.limits)))

            # Keep the best (lowest avg_turns) for each unique build
            if build_key not in seen_builds or avg_turns < seen_builds[build_key][2]:
                seen_builds[build_key] = (build, avg_dpt, avg_turns)

        # Convert back to list and sort by performance
        deduplicated_results = sorted(seen_builds.values(), key=lambda x: x[2])

        # Take top 1000 builds (or all if less than 1000)
        top_builds = deduplicated_results[:1000]
        total_analyzed = len(top_builds)
        total_before_dedup = len(build_results[:1000]) if len(build_results) >= 1000 else len(build_results)
        duplicates_removed = total_before_dedup - total_analyzed

        # Calculate statistics
        turns_values = [turns for _, _, turns in top_builds]
        costs = []
        for build, _, _ in top_builds:
            if isinstance(build, MultiAttackBuild):
                costs.append(build.get_total_cost())
            else:
                costs.append(build.total_cost)

        best_turns = min(turns_values)
        worst_turns = max(turns_values)
        median_turns = statistics.median(turns_values)
        mean_turns = statistics.mean(turns_values)
        std_dev = statistics.stdev(turns_values) if len(turns_values) >= 2 else 0

        min_cost = min(costs)
        max_cost = max(costs)
        median_cost = statistics.median(costs)
        mean_cost = statistics.mean(costs)

        # Calculate detailed statistics
        from collections import Counter

        # Enhancement representation analysis
        enhancement_counts = Counter()
        cost_by_point = {1: [], 2: [], 3: []}  # Track counts of 1pt, 2pt, 3pt enhancements per build
        attack_type_counts = Counter()
        synergy_pairs = Counter()  # Track 2-enhancement combinations
        synergy_triples = Counter()  # Track 3-enhancement combinations

        for build, _, _ in top_builds:
            if isinstance(build, MultiAttackBuild):
                # Multi-attack build
                if build.archetype == 'dual_natured' and hasattr(build, 'fallback_type'):
                    # Show as "primary (FB: fallback)"
                    attack_type_pattern = f"{build.builds[0].attack_type} (FB: {build.fallback_type})"
                else:
                    # Show all attacks joined
                    attack_type_pattern = " + ".join([sub.attack_type for sub in build.builds])
                attack_type_counts[attack_type_pattern] += 1

                # Collect all enhancements
                all_enhancements = []
                for sub_build in build.builds:
                    all_enhancements.extend(sub_build.upgrades)
                    all_enhancements.extend(sub_build.limits)

                # Count enhancements and costs
                cost_breakdown = {1: 0, 2: 0, 3: 0}
                for enh in all_enhancements:
                    enhancement_counts[enh] += 1
                    # Track cost breakdown
                    if enh in UPGRADES:
                        cost = UPGRADES[enh].cost
                    else:
                        cost = LIMITS[enh].cost
                    cost_breakdown[cost] += 1

                cost_by_point[1].append(cost_breakdown[1])
                cost_by_point[2].append(cost_breakdown[2])
                cost_by_point[3].append(cost_breakdown[3])

                # Track synergies
                unique_enhancements = set(all_enhancements)
                from itertools import combinations
                for pair in combinations(sorted(unique_enhancements), 2):
                    synergy_pairs[pair] += 1
                for triple in combinations(sorted(unique_enhancements), 3):
                    synergy_triples[triple] += 1
            else:
                # Single attack build
                attack_type_counts[build.attack_type] += 1

                # Collect enhancements
                all_enhancements = list(build.upgrades) + list(build.limits)

                # Count enhancements and costs
                cost_breakdown = {1: 0, 2: 0, 3: 0}
                for enh in all_enhancements:
                    enhancement_counts[enh] += 1
                    # Track cost breakdown
                    if enh in UPGRADES:
                        cost = UPGRADES[enh].cost
                    else:
                        cost = LIMITS[enh].cost
                    cost_breakdown[cost] += 1

                cost_by_point[1].append(cost_breakdown[1])
                cost_by_point[2].append(cost_breakdown[2])
                cost_by_point[3].append(cost_breakdown[3])

                # Track synergies
                unique_enhancements = set(all_enhancements)
                from itertools import combinations
                for pair in combinations(sorted(unique_enhancements), 2):
                    synergy_pairs[pair] += 1
                for triple in combinations(sorted(unique_enhancements), 3):
                    synergy_triples[triple] += 1

        # Calculate diversity metrics
        unique_combinations = set()
        for build, _, _ in top_builds:
            if isinstance(build, MultiAttackBuild):
                combo = tuple(sorted(
                    enh for sub in build.builds
                    for enh in list(sub.upgrades) + list(sub.limits)
                ))
            else:
                combo = tuple(sorted(list(build.upgrades) + list(build.limits)))
            unique_combinations.add(combo)

        diversity_index = (len(unique_combinations) / len(top_builds)) * 100

        # Calculate percentile benchmarks
        percentiles = [10, 25, 50, 75, 90]
        percentile_values = {}
        for p in percentiles:
            idx = int((p / 100) * len(turns_values))
            percentile_values[p] = turns_values[idx] if idx < len(turns_values) else turns_values[-1]

        # Calculate cost efficiency (performance per point)
        cost_efficiency_data = []
        for (build, _, avg_turns), cost in zip(top_builds, costs):
            if cost > 0:
                efficiency = avg_turns / cost  # Lower is better
                cost_efficiency_data.append((cost, efficiency, avg_turns))

        # Find efficiency sweet spots (best performance/cost ratios)
        cost_efficiency_data.sort(key=lambda x: x[1])  # Sort by efficiency
        top_efficiency = cost_efficiency_data[:10] if len(cost_efficiency_data) >= 10 else cost_efficiency_data

        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(f"# {self.archetype.upper()} - TOP 1000 BUILDS REPORT\n\n")
            f.write("Comprehensive ranked list of the best performing builds with detailed statistical analysis.\n\n")

            # Overall Statistics section
            f.write("## Overall Statistics\n\n")
            f.write(f"**Total builds analyzed**: {total_analyzed}\n")
            if duplicates_removed > 0:
                f.write(f"**Duplicates removed**: {duplicates_removed}\n")
            f.write("\n")

            f.write("**Performance Metrics**:\n")
            f.write(f"- Best performance: {best_turns:.1f} turns\n")
            f.write(f"- Worst performance: {worst_turns:.1f} turns\n")
            f.write(f"- Performance gap: {worst_turns - best_turns:.1f} turns\n")
            f.write(f"- Median: {median_turns:.1f} turns\n")
            f.write(f"- Mean: {mean_turns:.1f} turns\n")
            f.write(f"- Std Dev: {std_dev:.2f} turns\n")
            f.write(f"- vs Overall Median: {median_turns - overall_median:+.1f} turns\n\n")

            f.write("**Cost Distribution**:\n")
            f.write(f"- Min cost: {min_cost}p\n")
            f.write(f"- Max cost: {max_cost}p\n")
            f.write(f"- Median cost: {median_cost:.1f}p\n")
            f.write(f"- Mean cost: {mean_cost:.1f}p\n\n")

            # Detailed Statistics section
            f.write("## Detailed Statistics\n\n")

            # 1. Enhancement Representation
            f.write("### 1. Enhancement Representation Analysis\n\n")
            f.write("Shows which enhancements appear most frequently in top 1000 builds.\n\n")

            # Top 10 most common
            top_10_enhancements = enhancement_counts.most_common(10)
            f.write("**Top 10 Most Common Enhancements**:\n\n")
            f.write("| Rank | Enhancement | Appearances | % of Top 1000 | Cost |\n")
            f.write("|---|---|---|---|---|\n")
            for i, (enh, count) in enumerate(top_10_enhancements, 1):
                pct = (count / len(top_builds)) * 100
                cost = UPGRADES[enh].cost if enh in UPGRADES else LIMITS[enh].cost
                f.write(f"| {i} | {enh} | {count} | {pct:.1f}% | {cost}p |\n")
            f.write("\n")

            # Least common (< 5% representation)
            rare_enhancements = [(enh, count) for enh, count in enhancement_counts.items()
                                if (count / len(top_builds)) * 100 < 5]
            rare_enhancements.sort(key=lambda x: x[1])

            if rare_enhancements:
                f.write(f"**Rare Enhancements** (<5% representation): {len(rare_enhancements)} enhancements\n\n")
                f.write("| Enhancement | Appearances | % of Top 1000 | Cost |\n")
                f.write("|---|---|---|---|\n")
                for enh, count in rare_enhancements[:15]:  # Show top 15 rarest
                    pct = (count / len(top_builds)) * 100
                    cost = UPGRADES[enh].cost if enh in UPGRADES else LIMITS[enh].cost
                    f.write(f"| {enh} | {count} | {pct:.1f}% | {cost}p |\n")
                f.write("\n")

            # 2. Attack Type Distribution
            f.write("### 2. Attack Type Distribution\n\n")
            f.write("Shows distribution of attack types/combinations in top 1000 builds.\n\n")
            f.write("| Attack Type / Pattern | Count | % of Top 1000 |\n")
            f.write("|---|---|---|\n")
            for attack_pattern, count in attack_type_counts.most_common():
                pct = (count / len(top_builds)) * 100
                f.write(f"| {attack_pattern} | {count} | {pct:.1f}% |\n")
            f.write("\n")

            # 3. Cost Distribution Analysis
            f.write("### 3. Cost Distribution Analysis\n\n")

            # Build cost histogram
            cost_histogram = Counter(costs)
            f.write("**Builds by Total Cost**:\n\n")
            f.write("| Total Cost | Count | % of Top 1000 |\n")
            f.write("|---|---|---|\n")
            for cost in sorted(cost_histogram.keys()):
                count = cost_histogram[cost]
                pct = (count / len(top_builds)) * 100
                f.write(f"| {cost}p | {count} | {pct:.1f}% |\n")
            f.write("\n")

            # Enhancement cost breakdown
            avg_1pt = statistics.mean(cost_by_point[1]) if cost_by_point[1] else 0
            avg_2pt = statistics.mean(cost_by_point[2]) if cost_by_point[2] else 0
            avg_3pt = statistics.mean(cost_by_point[3]) if cost_by_point[3] else 0

            f.write("**Average Enhancement Composition**:\n")
            f.write(f"- Average 1pt enhancements per build: {avg_1pt:.2f}\n")
            f.write(f"- Average 2pt enhancements per build: {avg_2pt:.2f}\n")
            f.write(f"- Average 3pt enhancements per build: {avg_3pt:.2f}\n\n")

            # 4. Build Diversity Metrics
            f.write("### 4. Build Diversity Metrics\n\n")
            f.write(f"- **Unique enhancement combinations**: {len(unique_combinations)}\n")
            f.write(f"- **Diversity index**: {diversity_index:.1f}%\n")
            f.write(f"  - 100% = every build is unique\n")
            f.write(f"  - 0% = all builds are identical\n\n")

            # Most common synergies
            top_synergy_pairs = synergy_pairs.most_common(10)
            f.write("**Top 10 Most Common 2-Enhancement Synergies**:\n\n")
            f.write("| Rank | Enhancement Pair | Occurrences | % of Top 1000 |\n")
            f.write("|---|---|---|---|\n")
            for i, (pair, count) in enumerate(top_synergy_pairs, 1):
                pct = (count / len(top_builds)) * 100
                pair_str = " + ".join(pair)
                f.write(f"| {i} | {pair_str} | {count} | {pct:.1f}% |\n")
            f.write("\n")

            top_synergy_triples = synergy_triples.most_common(10)
            f.write("**Top 10 Most Common 3-Enhancement Synergies**:\n\n")
            f.write("| Rank | Enhancement Triple | Occurrences | % of Top 1000 |\n")
            f.write("|---|---|---|---|\n")
            for i, (triple, count) in enumerate(top_synergy_triples, 1):
                pct = (count / len(top_builds)) * 100
                triple_str = " + ".join(triple)
                f.write(f"| {i} | {triple_str} | {count} | {pct:.1f}% |\n")
            f.write("\n")

            # 5. Performance Benchmarks
            f.write("### 5. Performance Benchmarks\n\n")
            f.write("**Percentile Performance**:\n\n")
            f.write("| Percentile | Avg Turns |\n")
            f.write("|---|---|\n")
            for p in percentiles:
                f.write(f"| {p}th | {percentile_values[p]:.2f} |\n")
            f.write("\n")

            f.write("**Cost Efficiency Analysis** (Top 10 by turns/cost ratio):\n\n")
            f.write("| Rank | Total Cost | Efficiency (turns/point) | Avg Turns |\n")
            f.write("|---|---|---|---|\n")
            for i, (cost, efficiency, avg_turns) in enumerate(top_efficiency, 1):
                f.write(f"| {i} | {cost}p | {efficiency:.2f} | {avg_turns:.2f} |\n")
            f.write("\n")
            f.write("*Note: Lower efficiency ratio = better performance per point spent*\n\n")

            # Determine if we have multi-attack builds
            has_multi_attack = any(isinstance(build, MultiAttackBuild) for build, _, _ in top_builds)

            # Detailed builds table
            f.write("## Top Builds (Ranked by Performance)\n\n")

            if has_multi_attack:
                f.write("| Rank | Avg Turns | Attack Type(s) | Enhancements | Cost |\n")
                f.write("|---|---|---|---|---|\n")
            else:
                f.write("| Rank | Avg Turns | Attack Type | Enhancements | Cost |\n")
                f.write("|---|---|---|---|---|\n")

            for rank, (build, _, avg_turns) in enumerate(top_builds, 1):
                if isinstance(build, MultiAttackBuild):
                    # Multi-attack build formatting
                    attack_types = []
                    enhancements = []

                    # For dual_natured, only show the primary attack (builds[0])
                    # The fallback (builds[1]) is shown via FB metadata
                    if build.archetype == 'dual_natured':
                        builds_to_show = [build.builds[0]]  # Only primary
                    else:
                        builds_to_show = build.builds  # All attacks for other archetypes

                    for idx, sub_build in enumerate(builds_to_show, 1):
                        attack_types.append(f"Atk{idx}: {sub_build.attack_type}")

                        # Combine upgrades and limits
                        sub_enhancements = []
                        if sub_build.upgrades:
                            sub_enhancements.extend(sub_build.upgrades)
                        if sub_build.limits:
                            sub_enhancements.extend(sub_build.limits)

                        if sub_enhancements:
                            enhancements.append(f"Atk{idx}: {', '.join(sub_enhancements)}")
                        else:
                            enhancements.append(f"Atk{idx}: (none)")

                    attack_type_str = "; ".join(attack_types)
                    # Add fallback type for dual_natured builds
                    if hasattr(build, 'fallback_type') and build.fallback_type:
                        attack_type_str += f" | FB: {build.fallback_type}+{build.tier_bonus}"
                    enhancements_str = " &#124; ".join(enhancements)  # Use HTML entity for pipe
                    cost = build.get_total_cost()
                else:
                    # Single attack build formatting
                    attack_type_str = build.attack_type

                    # Combine upgrades and limits
                    all_enhancements = []
                    if build.upgrades:
                        all_enhancements.extend(build.upgrades)
                    if build.limits:
                        all_enhancements.extend(build.limits)

                    enhancements_str = ", ".join(all_enhancements) if all_enhancements else "(none)"
                    cost = build.total_cost

                f.write(f"| {rank} | {avg_turns:.2f} | {attack_type_str} | {enhancements_str} | {cost}p |\n")

            # Notes section
            f.write("\n## Notes\n\n")
            f.write("- **Rank**: Position from 1-1000 (or fewer if less than 1000 valid builds)\n")
            f.write("- **Avg Turns**: Average turns to kill across all scenarios (lower is better)\n")
            f.write("- **Attack Type(s)**: \n")
            if has_multi_attack:
                f.write("  - Single builds: `melee_ac`, `ranged`, etc.\n")
                f.write("  - Multi-attack: `Atk1: melee_ac; Atk2: ranged`\n")
            else:
                f.write("  - `melee_ac`, `melee_dg`, `ranged`, `area`, `direct_damage`\n")
            f.write("- **Enhancements**: All upgrades and limits\n")
            if has_multi_attack:
                f.write("  - Single builds: `upgrade1, upgrade2, limit1`\n")
                f.write("  - Multi-attack: `Atk1: enhancement_list | Atk2: enhancement_list`\n")
            else:
                f.write("  - Format: `upgrade1, upgrade2, limit1, limit2`\n")
            f.write("- **Cost**: Total point cost of all enhancements\n")
            f.write(f"- **Archetype**: {self.archetype.title()}\n")

        print(f"  + Top 1000 builds report: top_1000_builds_{self.archetype}.md")

    def _generate_balance_assessment_report(
        self,
        enhancement_stats: List[Dict],
        overall_median: float
    ):
        """Generate balance assessment report with new metrics.

        Args:
            enhancement_stats: List of enhancement statistics dictionaries
            overall_median: Median turns across all builds
        """
        report_path = os.path.join(self.reports_dir, f'balance_assessment_{self.archetype}.md')

        # Separate upgrades and limits for analysis
        upgrades = [s for s in enhancement_stats if s['type'] == 'upgrade']
        limits = [s for s in enhancement_stats if s['type'] == 'limit']

        # Sort by median rank percentile (ascending = better)
        sorted_by_rank_pct = sorted(enhancement_stats, key=lambda x: x['median_rank_percentile'])

        # Sort by top 10% saturation (descending = more meta-defining)
        sorted_by_saturation = sorted(enhancement_stats, key=lambda x: x['top_10_saturation'], reverse=True)

        # Sort by synergy score (ascending = most synergy-dependent)
        sorted_by_synergy = sorted(enhancement_stats, key=lambda x: x['synergy_score'])

        # Count balance flags
        flag_counts = {'OP': 0, 'UP': 0, 'SYNERGY': 0, 'ANTI-SYN': 0}
        flagged_enhancements = {'OP': [], 'UP': [], 'SYNERGY': [], 'ANTI-SYN': []}

        for stats in enhancement_stats:
            for flag in stats['balance_flags']:
                flag_counts[flag] += 1
                flagged_enhancements[flag].append(stats['name'])

        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(f"# {self.archetype.upper()} - BALANCE ASSESSMENT REPORT\n\n")
            f.write("Comprehensive balance analysis using advanced metrics.\n")
            f.write("Focus: Power level, synergy dependencies, and meta-defining characteristics.\n\n")

            # Overall statistics
            f.write("## Overall Statistics\n\n")
            f.write(f"- **Total enhancements analyzed**: {len(enhancement_stats)}\n")
            f.write(f"  - Upgrades: {len(upgrades)}\n")
            f.write(f"  - Limits: {len(limits)}\n")
            f.write(f"- **Overall median turns**: {overall_median:.1f}\n")
            f.write(f"- **Balance flags detected**: {sum(flag_counts.values())}\n")
            f.write(f"  - OP: {flag_counts['OP']}\n")
            f.write(f"  - UP: {flag_counts['UP']}\n")
            f.write(f"  - SYNERGY: {flag_counts['SYNERGY']}\n")
            f.write(f"  - ANTI-SYN: {flag_counts['ANTI-SYN']}\n\n")

            # Section 1: Overall Balance Rankings
            f.write("## 1. Overall Balance Rankings\n\n")
            f.write("Enhancements sorted by median rank percentile (0=best, 100=worst).\n\n")
            f.write("| Rank | Enhancement | Cost | Med Rank % | Top10% Sat | Synergy | Flags |\n")
            f.write("|---|---|---|---|---|---|---|\n")

            for i, stats in enumerate(sorted_by_rank_pct, 1):
                flags_str = ", ".join(stats['balance_flags']) if stats['balance_flags'] else "-"
                f.write(
                    f"| {i} | {stats['name']} | {stats['cost']}p | "
                    f"{stats['median_rank_percentile']:.1f}% | {stats['top_10_saturation']:.1f}% | "
                    f"{stats['synergy_score']:+.1f}% | {flags_str} |\n"
                )

            # Section 2: Saturation Analysis
            f.write("\n## 2. Saturation Analysis\n\n")
            f.write("**Top 10% Saturation**: % of top 10% builds containing each enhancement.\n")
            f.write("Higher saturation = more meta-defining.\n\n")

            # High saturation enhancements (>50%)
            high_sat = [s for s in sorted_by_saturation if s['top_10_saturation'] > 50]
            f.write(f"### Meta-Defining Enhancements (>50% saturation)\n\n")
            if high_sat:
                f.write("| Rank | Enhancement | Cost | Top10% Sat | Med Rank % | Flags |\n")
                f.write("|---|---|---|---|---|---|\n")
                for i, stats in enumerate(high_sat, 1):
                    flags_str = ", ".join(stats['balance_flags']) if stats['balance_flags'] else "-"
                    f.write(
                        f"| {i} | {stats['name']} | {stats['cost']}p | "
                        f"{stats['top_10_saturation']:.1f}% | {stats['median_rank_percentile']:.1f}% | "
                        f"{flags_str} |\n"
                    )
            else:
                f.write("*No enhancements found with >50% saturation.*\n")

            f.write("\n")

            # Low saturation enhancements (<10%)
            low_sat = [s for s in sorted_by_saturation if s['top_10_saturation'] < 10]
            f.write(f"### Niche/Situational Enhancements (<10% saturation)\n\n")
            if low_sat:
                f.write("| Rank | Enhancement | Cost | Top10% Sat | Med Rank % | Flags |\n")
                f.write("|---|---|---|---|---|---|\n")
                for i, stats in enumerate(low_sat, 1):
                    flags_str = ", ".join(stats['balance_flags']) if stats['balance_flags'] else "-"
                    f.write(
                        f"| {i} | {stats['name']} | {stats['cost']}p | "
                        f"{stats['top_10_saturation']:.1f}% | {stats['median_rank_percentile']:.1f}% | "
                        f"{flags_str} |\n"
                    )
            else:
                f.write("*No enhancements found with <10% saturation.*\n")

            # Section 3: Synergy Analysis
            f.write("\n## 3. Synergy Analysis\n\n")
            f.write("**Synergy Score**: Compares performance in top 50% builds vs isolation.\n")
            f.write("- Negative score = better in builds (synergy-dependent)\n")
            f.write("- Positive score = worse in builds (anti-synergy)\n")
            f.write("- Zero score = no synergy data available\n\n")

            # Synergy-dependent enhancements (score < -15%)
            synergy_dependent = [s for s in sorted_by_synergy if s['synergy_score'] < -15]
            f.write(f"### Combo-Dependent Enhancements (score < -15%)\n\n")
            if synergy_dependent:
                f.write("These perform significantly better in builds than in isolation.\n\n")
                f.write("| Rank | Enhancement | Cost | Synergy | Top10% Sat | Med Rank % | Flags |\n")
                f.write("|---|---|---|---|---|---|---|\n")
                for i, stats in enumerate(synergy_dependent, 1):
                    flags_str = ", ".join(stats['balance_flags']) if stats['balance_flags'] else "-"
                    f.write(
                        f"| {i} | {stats['name']} | {stats['cost']}p | "
                        f"{stats['synergy_score']:+.1f}% | {stats['top_10_saturation']:.1f}% | "
                        f"{stats['median_rank_percentile']:.1f}% | {flags_str} |\n"
                    )
            else:
                f.write("*No enhancements found with strong positive synergy.*\n")

            f.write("\n")

            # Anti-synergy enhancements (score > 15%)
            anti_synergy = [s for s in sorted_by_synergy if s['synergy_score'] > 15]
            anti_synergy.reverse()  # Highest anti-synergy first
            f.write(f"### Standalone-Strong Enhancements (score > 15%)\n\n")
            if anti_synergy:
                f.write("These perform worse in builds than in isolation (diluted by other enhancements).\n\n")
                f.write("| Rank | Enhancement | Cost | Synergy | Top10% Sat | Med Rank % | Flags |\n")
                f.write("|---|---|---|---|---|---|---|\n")
                for i, stats in enumerate(anti_synergy, 1):
                    flags_str = ", ".join(stats['balance_flags']) if stats['balance_flags'] else "-"
                    f.write(
                        f"| {i} | {stats['name']} | {stats['cost']}p | "
                        f"{stats['synergy_score']:+.1f}% | {stats['top_10_saturation']:.1f}% | "
                        f"{stats['median_rank_percentile']:.1f}% | {flags_str} |\n"
                    )
            else:
                f.write("*No enhancements found with strong anti-synergy.*\n")

            # Section 4: Balance Flags Summary
            f.write("\n## 4. Balance Flags Summary\n\n")

            if flag_counts['OP'] > 0:
                f.write(f"### Overpowered (OP) - {flag_counts['OP']} enhancements\n\n")
                f.write("*Criteria: Med Rank % < 20 AND Top10% Sat > 60*\n\n")
                for name in flagged_enhancements['OP']:
                    stats = next(s for s in enhancement_stats if s['name'] == name)
                    f.write(
                        f"- **{name}** ({stats['cost']}p): {stats['median_rank_percentile']:.1f}% rank, "
                        f"{stats['top_10_saturation']:.1f}% saturation\n"
                    )
                f.write("\n")

            if flag_counts['UP'] > 0:
                f.write(f"### Underpowered (UP) - {flag_counts['UP']} enhancements\n\n")
                f.write("*Criteria: Med Rank % > 70 AND Top10% Sat < 5*\n\n")
                for name in flagged_enhancements['UP']:
                    stats = next(s for s in enhancement_stats if s['name'] == name)
                    f.write(
                        f"- **{name}** ({stats['cost']}p): {stats['median_rank_percentile']:.1f}% rank, "
                        f"{stats['top_10_saturation']:.1f}% saturation\n"
                    )
                f.write("\n")

            if flag_counts['SYNERGY'] > 0:
                f.write(f"### Synergy-Dependent (SYNERGY) - {flag_counts['SYNERGY']} enhancements\n\n")
                f.write("*Criteria: Synergy score < -15% (performs 15%+ better in builds)*\n\n")
                for name in flagged_enhancements['SYNERGY']:
                    stats = next(s for s in enhancement_stats if s['name'] == name)
                    f.write(
                        f"- **{name}** ({stats['cost']}p): {stats['synergy_score']:+.1f}% synergy\n"
                    )
                f.write("\n")

            if flag_counts['ANTI-SYN'] > 0:
                f.write(f"### Anti-Synergy (ANTI-SYN) - {flag_counts['ANTI-SYN']} enhancements\n\n")
                f.write("*Criteria: Synergy score > 15% (performs 15%+ worse in builds)*\n\n")
                for name in flagged_enhancements['ANTI-SYN']:
                    stats = next(s for s in enhancement_stats if s['name'] == name)
                    f.write(
                        f"- **{name}** ({stats['cost']}p): {stats['synergy_score']:+.1f}% synergy\n"
                    )
                f.write("\n")

            if sum(flag_counts.values()) == 0:
                f.write("*No balance flags detected. All enhancements appear reasonably balanced.*\n\n")

            # Section 5: Methodology
            f.write("## 5. Methodology\n\n")
            f.write("### Median Rank Percentile\n")
            f.write("- Formula: `(median_rank / total_builds) * 100` (considers only top 50% of builds)\n")
            f.write("- Range: 0-100 (0 = best, 100 = worst)\n")
            f.write("- Shows typical rank position for builds containing this enhancement\n")
            f.write("- Only includes builds in the top 50% to exclude clearly inferior builds\n\n")

            f.write("### Top 10% Saturation\n")
            f.write("- Formula: `(appearances_in_top_10% / top_10%_count) * 100`\n")
            f.write("- Range: 0-100%\n")
            f.write("- High saturation (>50%) = meta-defining\n")
            f.write("- Low saturation (<10%) = niche/situational\n\n")

            f.write("### Synergy Score\n")
            f.write("- Formula: `((top_50%_avg_turns - individual_avg_turns) / individual_avg_turns) * 100`\n")
            f.write("- **CRITICAL**: Only uses top 50% builds to avoid noise from bad combinations\n")
            f.write("- Negative = better in builds (synergy-dependent)\n")
            f.write("- Positive = worse in builds (anti-synergy)\n")
            f.write("- Zero = no individual testing data available\n\n")

            f.write("### Balance Flags\n")
            f.write("- **OP**: Med Rank % < 20 AND Top10% Sat > 60\n")
            f.write("- **UP**: Med Rank % > 70 AND Top10% Sat < 5\n")
            f.write("- **SYNERGY**: Synergy score < -15%\n")
            f.write("- **ANTI-SYN**: Synergy score > 15%\n\n")

            f.write("### Data Sources\n")
            f.write("- **Build testing**: All valid builds within point budget, tested across multiple scenarios\n")
            f.write("- **Individual testing**: Each enhancement tested in isolation (baseline + enhancement only)\n")
            f.write("- **Synergy calculation**: Compares top 50% build performance vs individual testing\n")

        print(f"  + Balance assessment report: balance_assessment_{self.archetype}.md")

    def _generate_enhancement_saturation_report(
        self,
        build_results: List[Tuple],
        overall_median: float
    ):
        """Generate multi-tier enhancement saturation reports (Top 50%, 20%, 5%, 1%, 0.5%, 0.2%, 0.1%, 0.05%, 0.02%, 0.01%).

        Shows what % of builds in each performance tier contain each enhancement.
        Counts each enhancement once per build (no double-counting).

        Args:
            build_results: List of (build, avg_dpt, avg_turns) tuples, already sorted by performance
            overall_median: Median turns across all builds
        """
        from collections import defaultdict

        # Define tier thresholds
        tiers = {
            'top_50': (0.50, 'Top 50%'),
            'top_20': (0.20, 'Top 20%'),
            'top_5': (0.05, 'Top 5%'),
            'top_1': (0.01, 'Top 1%'),
            'top_0_5': (0.005, 'Top 0.5%'),
            'top_0_2': (0.002, 'Top 0.2%'),
            'top_0_1': (0.001, 'Top 0.1%'),
            'top_0_05': (0.0005, 'Top 0.05%'),
            'top_0_02': (0.0002, 'Top 0.02%'),
            'top_0_01': (0.0001, 'Top 0.01%')
        }

        for tier_key, (threshold, tier_name) in tiers.items():
            tier_count = max(1, int(len(build_results) * threshold))
            tier_results = build_results[:tier_count]

            # Track enhancement appearances
            enhancement_counts = defaultdict(int)
            enhancement_types = {}
            enhancement_costs = {}

            for build, _, _ in tier_results:
                # Track unique enhancements per build (avoid double counting)
                enhancements_in_build = set()

                if isinstance(build, MultiAttackBuild):
                    # Process each sub-build
                    for sub_build in build.builds:
                        for upgrade in sub_build.upgrades:
                            enhancements_in_build.add(upgrade)
                            if upgrade not in enhancement_types:
                                enhancement_types[upgrade] = 'upgrade'
                                enhancement_costs[upgrade] = UPGRADES[upgrade].cost

                        for limit in sub_build.limits:
                            enhancements_in_build.add(limit)
                            if limit not in enhancement_types:
                                enhancement_types[limit] = 'limit'
                                enhancement_costs[limit] = LIMITS[limit].cost
                else:
                    # Single attack build
                    for upgrade in build.upgrades:
                        enhancements_in_build.add(upgrade)
                        if upgrade not in enhancement_types:
                            enhancement_types[upgrade] = 'upgrade'
                            enhancement_costs[upgrade] = UPGRADES[upgrade].cost

                    for limit in build.limits:
                        enhancements_in_build.add(limit)
                        if limit not in enhancement_types:
                            enhancement_types[limit] = 'limit'
                            enhancement_costs[limit] = LIMITS[limit].cost

                # Count each unique enhancement once per build
                for enh in enhancements_in_build:
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
            report_path = os.path.join(self.reports_dir, f'enhancement_saturation_{tier_key}.md')
            with open(report_path, 'w', encoding='utf-8') as f:
                f.write(f"# {self.archetype.upper()} - Enhancement Saturation Report ({tier_name})\n\n")
                f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

                # Summary
                f.write("## Summary\n\n")
                f.write(f"- **Tier**: {tier_name} of all builds ({len(tier_results):,} builds)\n")
                f.write(f"- **Unique enhancements found**: {len(saturation_data)}\n")
                if saturation_data:
                    f.write(f"- **Average saturation rate**: {statistics.mean([d['saturation_rate'] for d in saturation_data]):.1f}%\n")
                    f.write(f"- **Median saturation rate**: {statistics.median([d['saturation_rate'] for d in saturation_data]):.1f}%\n\n")
                else:
                    f.write("- **Average saturation rate**: N/A\n")
                    f.write("- **Median saturation rate**: N/A\n\n")

                # Methodology
                f.write("## Methodology\n\n")
                f.write(f"This report shows saturation rates for enhancements in the {tier_name} of all tested builds.\n\n")
                f.write("**Key Metrics**:\n")
                f.write("1. **Saturation Rate**: % of builds containing this enhancement (counts once per build)\n")
                f.write("2. **Appearances**: Number of builds containing this enhancement\n")
                f.write("3. **Type**: upgrade or limit\n")
                f.write("4. **Cost**: Point cost of enhancement\n\n")
                f.write("**Interpretation**:\n")
                f.write("- **High saturation (>60%)**: Core enhancement, appears in most top builds\n")
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
                if saturation_data:
                    f.write(f"| High (>60%) | {high_sat} | {high_sat / len(saturation_data) * 100:.1f}% |\n")
                    f.write(f"| Medium (30-60%) | {medium_sat} | {medium_sat / len(saturation_data) * 100:.1f}% |\n")
                    f.write(f"| Low (<30%) | {low_sat} | {low_sat / len(saturation_data) * 100:.1f}% |\n")
                else:
                    f.write(f"| High (>60%) | 0 | 0.0% |\n")
                    f.write(f"| Medium (30-60%) | 0 | 0.0% |\n")
                    f.write(f"| Low (<30%) | 0 | 0.0% |\n")

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
                f.write("- **Saturation Rate**: Calculated as (builds with enhancement / total builds in tier) × 100\n")
                f.write("- **Each enhancement counted once per build**: If an enhancement appears in multiple attacks, it's still counted as one appearance\n")
                f.write("- **High saturation indicates meta-defining enhancements**: Core to successful builds in this tier\n")
                f.write("- **Low saturation doesn't mean weak**: May be situational or niche but powerful in specific contexts\n")

            print(f"  + {tier_name} saturation report: enhancement_saturation_{tier_key}.md")

    def _generate_enhancement_ranking_tiers_report(
        self,
        build_results: List[Tuple],
        overall_median: float
    ):
        """Generate multi-tier enhancement ranking reports with detailed performance metrics.

        Shows performance statistics for enhancements in each performance tier (Top 50%, 20%, 5%, 1%, 0.5%, 0.2%, 0.1%, 0.05%, 0.02%, 0.01%).
        Includes slot positions, usage percentages, and attack type breakdowns.

        Args:
            build_results: List of (build, avg_dpt, avg_turns) tuples, already sorted by performance
            overall_median: Median turns across all builds
        """
        from collections import defaultdict

        # Define tier thresholds
        tiers = {
            'top_50': (0.50, 'Top 50%'),
            'top_20': (0.20, 'Top 20%'),
            'top_5': (0.05, 'Top 5%'),
            'top_1': (0.01, 'Top 1%'),
            'top_0_5': (0.005, 'Top 0.5%'),
            'top_0_2': (0.002, 'Top 0.2%'),
            'top_0_1': (0.001, 'Top 0.1%'),
            'top_0_05': (0.0005, 'Top 0.05%'),
            'top_0_02': (0.0002, 'Top 0.02%'),
            'top_0_01': (0.0001, 'Top 0.01%')
        }

        for tier_key, (threshold, tier_name) in tiers.items():
            tier_count = max(1, int(len(build_results) * threshold))
            tier_results = build_results[:tier_count]

            # Calculate tier median
            tier_turns = [avg_turns for _, _, avg_turns in tier_results]
            tier_median = statistics.median(tier_turns)

            # Track enhancement statistics
            enhancement_data = defaultdict(lambda: {
                'appearances': 0,
                'total_turns': 0,
                'slot_positions': defaultdict(int),  # Which attack slot (0, 1, 2, etc.)
                'by_attack_type': defaultdict(list),
            })

            # Collect enhancement statistics
            for build, _, avg_turns in tier_results:
                if isinstance(build, MultiAttackBuild):
                    # Process each sub-build
                    for slot_idx, sub_build in enumerate(build.builds):
                        for upgrade in sub_build.upgrades:
                            enhancement_data[upgrade]['appearances'] += 1
                            enhancement_data[upgrade]['total_turns'] += avg_turns
                            enhancement_data[upgrade]['slot_positions'][slot_idx] += 1
                            enhancement_data[upgrade]['by_attack_type'][sub_build.attack_type].append(avg_turns)

                        for limit in sub_build.limits:
                            enhancement_data[limit]['appearances'] += 1
                            enhancement_data[limit]['total_turns'] += avg_turns
                            enhancement_data[limit]['slot_positions'][slot_idx] += 1
                            enhancement_data[limit]['by_attack_type'][sub_build.attack_type].append(avg_turns)
                else:
                    # Single attack build - always slot 0
                    for upgrade in build.upgrades:
                        enhancement_data[upgrade]['appearances'] += 1
                        enhancement_data[upgrade]['total_turns'] += avg_turns
                        enhancement_data[upgrade]['slot_positions'][0] += 1
                        enhancement_data[upgrade]['by_attack_type'][build.attack_type].append(avg_turns)

                    for limit in build.limits:
                        enhancement_data[limit]['appearances'] += 1
                        enhancement_data[limit]['total_turns'] += avg_turns
                        enhancement_data[limit]['slot_positions'][0] += 1
                        enhancement_data[limit]['by_attack_type'][build.attack_type].append(avg_turns)

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
                    continue

                efficiency = vs_median / cost if cost > 0 else 0

                # Calculate slot percentages
                slot_positions = data['slot_positions']
                total_slot_appearances = sum(slot_positions.values())
                slot1_pct = (slot_positions.get(0, 0) / total_slot_appearances * 100) if total_slot_appearances > 0 else 0
                slot2_pct = (slot_positions.get(1, 0) / total_slot_appearances * 100) if total_slot_appearances > 0 else 0
                slot3_pct = (slot_positions.get(2, 0) / total_slot_appearances * 100) if total_slot_appearances > 0 else 0

                # Calculate appearance rate (% of builds in tier)
                appearance_rate = (data['appearances'] / len(tier_results)) * 100

                # Attack type breakdown (average turns when paired with each attack type)
                attack_type_turns = {}
                for attack_type in ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage']:
                    if attack_type in data['by_attack_type']:
                        attack_type_turns[attack_type] = statistics.mean(data['by_attack_type'][attack_type])
                    else:
                        attack_type_turns[attack_type] = None

                enhancement_stats.append({
                    'name': name,
                    'type': enh_type,
                    'cost': cost,
                    'appearances': data['appearances'],
                    'appearance_rate': appearance_rate,
                    'avg_turns': avg_turns,
                    'vs_median': vs_median,
                    'efficiency': efficiency,
                    'slot1_pct': slot1_pct,
                    'slot2_pct': slot2_pct,
                    'slot3_pct': slot3_pct,
                    'has_multi_slots': total_slot_appearances > data['appearances'],  # Appears in multiple slots
                    **attack_type_turns
                })

            # Sort by efficiency (ascending = better)
            enhancement_stats.sort(key=lambda x: x['efficiency'])

            # Write report
            report_path = os.path.join(self.reports_dir, f'enhancement_ranking_{tier_key}.md')
            with open(report_path, 'w', encoding='utf-8') as f:
                f.write(f"# {self.archetype.upper()} - Enhancement Ranking Report ({tier_name})\n\n")
                f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

                # Summary
                f.write("## Summary\n\n")
                f.write(f"- **Tier**: {tier_name} of all builds ({len(tier_results):,} builds)\n")
                f.write(f"- **Tier Median**: {tier_median:.2f} turns\n")
                f.write(f"- **Overall Median**: {overall_median:.2f} turns\n")
                f.write(f"- **Unique enhancements**: {len(enhancement_stats)}\n\n")

                # Methodology
                f.write("## Methodology\n\n")
                f.write(f"This report ranks enhancements by their performance in the {tier_name} of all tested builds.\n\n")
                f.write("**Key Metrics**:\n")
                f.write("1. **Appearance Rate**: % of builds in tier containing this enhancement\n")
                f.write("2. **Avg Turns**: Average turns for builds with this enhancement\n")
                f.write("3. **vs Median**: Deviation from tier median (negative = better)\n")
                f.write("4. **Efficiency**: (vs Median) / cost - cost-normalized performance (lower = better value)\n")
                f.write("5. **Slot1/Slot2/Slot3**: % of appearances in each attack slot\n")
                f.write("6. **Attack Type Columns**: Average turns when paired with each attack type\n\n")
                f.write("**Sorting**: By efficiency (lower = better value)\n\n")

                # Main table
                f.write("## Enhancement Performance Rankings\n\n")
                f.write("| Rank | Enhancement | Type | Cost | Appearances | App % | Avg Turns | vs Median | Efficiency |\n")
                f.write("|------|-------------|------|------|-------------|-------|-----------|-----------|------------|\n")

                for rank, stat in enumerate(enhancement_stats, 1):
                    f.write(
                        f"| {rank} | {stat['name']} | {stat['type']} | {stat['cost']}p | "
                        f"{stat['appearances']:,} | {stat['appearance_rate']:.1f}% | "
                        f"{stat['avg_turns']:.2f} | {stat['vs_median']:+.2f} | {stat['efficiency']:.3f} |\n"
                    )

                # Slot Distribution (only for multi-attack archetypes)
                has_multi_attack = any(stat['slot2_pct'] > 0 or stat['slot3_pct'] > 0 for stat in enhancement_stats)
                if has_multi_attack:
                    f.write("\n## Slot Distribution\n\n")
                    f.write("Shows which attack slot each enhancement typically appears in.\n\n")
                    f.write("| Enhancement | Type | Slot 1 | Slot 2 | Slot 3 |\n")
                    f.write("|-------------|------|--------|--------|--------|\n")

                    for stat in enhancement_stats:
                        if stat['slot2_pct'] > 0 or stat['slot3_pct'] > 0:
                            f.write(
                                f"| {stat['name']} | {stat['type']} | "
                                f"{stat['slot1_pct']:.0f}% | {stat['slot2_pct']:.0f}% | {stat['slot3_pct']:.0f}% |\n"
                            )

                # Attack Type Breakdown
                f.write("\n## Attack Type Performance Breakdown\n\n")
                f.write("Average turns when paired with each attack type.\n\n")
                f.write("| Enhancement | Type | Melee AC | Melee DG | Ranged | Area | Direct DMG |\n")
                f.write("|-------------|------|----------|----------|--------|------|------------|\n")

                for stat in enhancement_stats[:20]:  # Top 20 only to keep readable
                    melee_ac = f"{stat['melee_ac']:.2f}" if stat['melee_ac'] is not None else "—"
                    melee_dg = f"{stat['melee_dg']:.2f}" if stat['melee_dg'] is not None else "—"
                    ranged = f"{stat['ranged']:.2f}" if stat['ranged'] is not None else "—"
                    area = f"{stat['area']:.2f}" if stat['area'] is not None else "—"
                    direct_damage = f"{stat['direct_damage']:.2f}" if stat['direct_damage'] is not None else "—"

                    f.write(
                        f"| {stat['name']} | {stat['type']} | {melee_ac} | {melee_dg} | "
                        f"{ranged} | {area} | {direct_damage} |\n"
                    )

                # Top 10 by efficiency
                f.write("\n## Top 10 Best Value Enhancements\n\n")
                f.write("Ranked by efficiency (cost-normalized performance).\n\n")
                f.write("| Enhancement | Type | Cost | Efficiency | vs Median |\n")
                f.write("|-------------|------|------|------------|----------|\n")

                for stat in enhancement_stats[:10]:
                    f.write(
                        f"| {stat['name']} | {stat['type']} | {stat['cost']}p | "
                        f"{stat['efficiency']:.3f} | {stat['vs_median']:+.2f} |\n"
                    )

                # Bottom 10 by efficiency (worst value)
                if len(enhancement_stats) > 10:
                    f.write("\n## Bottom 10 Worst Value Enhancements\n\n")
                    f.write("Lowest efficiency in this tier.\n\n")
                    f.write("| Enhancement | Type | Cost | Efficiency | vs Median |\n")
                    f.write("|-------------|------|------|------------|----------|\n")

                    for stat in enhancement_stats[-10:]:
                        f.write(
                            f"| {stat['name']} | {stat['type']} | {stat['cost']}p | "
                            f"{stat['efficiency']:.3f} | {stat['vs_median']:+.2f} |\n"
                        )

                # Notes
                f.write("\n## Notes\n\n")
                f.write("- **Efficiency**: (vs Median) / cost - lower is better (more negative = better value)\n")
                f.write("- **Appearance Rate**: % of builds in this tier containing the enhancement\n")
                f.write("- **Slot Distribution**: Shows which attack position the enhancement typically occupies\n")
                f.write("- **Attack Type Breakdown**: Average performance when paired with specific attack types\n")
                f.write("- **'—' in tables**: Enhancement not compatible or not tested with that attack type\n")

            print(f"  + {tier_name} ranking report: enhancement_ranking_{tier_key}.md")

    def _generate_top_n_attack_type_reports(
        self,
        build_results: List[Tuple],
        overall_median: float,
        archetype_label: str = None
    ):
        """Generate attack type distribution reports for fixed top N builds.

        Shows which attack types appear most frequently in top N builds.
        For MultiAttackBuilds, counts only primary attacks (excludes fallback attacks).

        Args:
            build_results: List of (build, avg_dpt, avg_turns, [archetype]) tuples, already sorted by performance
            overall_median: Median turns across all builds
            archetype_label: Optional label for combined reports (e.g., "COMBINED (FOCUSED + DUAL_NATURED)")
        """
        from collections import defaultdict

        # Create top_n_analysis subdirectory
        top_n_dir = os.path.join(self.reports_dir, 'top_n_analysis')
        os.makedirs(top_n_dir, exist_ok=True)

        # Define top N thresholds
        thresholds = [10, 50, 100, 200, 500, 1000]

        for n in thresholds:
            # Skip if not enough builds
            if len(build_results) < n:
                print(f"  Skipping Top {n} attack type report (only {len(build_results)} builds)")
                continue

            top_n_results = build_results[:n]

            # Track attack type appearances and archetype distribution
            attack_type_counts = defaultdict(int)
            attack_type_turns = defaultdict(list)
            archetype_counts = defaultdict(int)  # Track builds by archetype
            archetype_attack_types = defaultdict(lambda: defaultdict(int))  # Track attack types per archetype
            total_attacks = 0

            for result in top_n_results:
                # Handle both 3-tuple and 4-tuple formats (with/without archetype)
                if len(result) == 4:
                    build, _, avg_turns, source_archetype = result
                elif len(result) == 3:
                    build, _, avg_turns = result
                    source_archetype = self.archetype if hasattr(self, 'archetype') else None
                else:
                    continue

                # Track archetype if available
                if source_archetype:
                    archetype_counts[source_archetype] += 1

                if isinstance(build, MultiAttackBuild):
                    # For dual_natured builds, only count primary attack (builds[0]), skip fallback (builds[1])
                    if build.fallback_type:
                        # Only count the primary attack (first build)
                        primary_build = build.builds[0]
                        attack_type = primary_build.attack_type
                        attack_type_counts[attack_type] += 1
                        attack_type_turns[attack_type].append(avg_turns)
                        if source_archetype:
                            archetype_attack_types[source_archetype][attack_type] += 1
                        total_attacks += 1
                    else:
                        # For other multi-attack builds (versatile_master), count all attacks
                        for sub_build in build.builds:
                            attack_type = sub_build.attack_type
                            attack_type_counts[attack_type] += 1
                            attack_type_turns[attack_type].append(avg_turns)
                            if source_archetype:
                                archetype_attack_types[source_archetype][attack_type] += 1
                            total_attacks += 1
                else:
                    # Single attack build (focused)
                    attack_type = build.attack_type
                    attack_type_counts[attack_type] += 1
                    attack_type_turns[attack_type].append(avg_turns)
                    if source_archetype:
                        archetype_attack_types[source_archetype][attack_type] += 1
                    total_attacks += 1

            # Calculate statistics
            attack_type_data = []
            for attack_type, count in attack_type_counts.items():
                saturation_rate = (count / total_attacks) * 100
                avg_turns = statistics.mean(attack_type_turns[attack_type])

                attack_type_data.append({
                    'attack_type': attack_type,
                    'appearances': count,
                    'saturation_rate': saturation_rate,
                    'avg_turns': avg_turns
                })

            # Sort by saturation rate (descending)
            attack_type_data.sort(key=lambda x: x['saturation_rate'], reverse=True)

            # Write report
            report_path = os.path.join(top_n_dir, f'attack_type_distribution_top{n}.md')
            with open(report_path, 'w', encoding='utf-8') as f:
                # Header - use archetype_label if provided, otherwise use self.archetype
                header_archetype = archetype_label if archetype_label else self.archetype.upper()
                f.write(f"# {header_archetype} - Attack Type Distribution Report (Top {n})\n\n")
                f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

                # Summary
                f.write("## Summary\n\n")
                f.write(f"- **Analyzed Builds**: Top {n} builds by performance\n")
                f.write(f"- **Total Attack Slots**: {total_attacks:,}\n")
                f.write(f"- **Unique Attack Types**: {len(attack_type_data)}\n")
                f.write(f"- **Overall Median Turns**: {overall_median:.2f}\n")

                # Add archetype distribution if we have that data
                if archetype_counts:
                    f.write(f"\n**Archetype Distribution**:\n")
                    total_builds = sum(archetype_counts.values())
                    for arch in sorted(archetype_counts.keys()):
                        count = archetype_counts[arch]
                        pct = (count / total_builds) * 100
                        f.write(f"- {arch.replace('_', ' ').title()}: {count} builds ({pct:.1f}%)\n")
                f.write("\n")

                # Methodology
                f.write("## Methodology\n\n")
                f.write(f"This report shows which attack types appear most frequently in the top {n} builds.\n\n")
                f.write("**Key Metrics**:\n")
                f.write("1. **Saturation Rate**: % of attack slots using this type\n")
                f.write("2. **Appearances**: Number of times this attack type appears\n")
                f.write("3. **Avg Turns**: Average turns for builds using this attack type\n\n")
                f.write("**Important**: For dual_natured builds, only the primary attack is counted (fallback attacks are excluded).\n")
                f.write("For versatile_master builds, all attack slots are counted.\n\n")

                # Main table
                f.write("## Attack Type Distribution\n\n")
                f.write("Sorted by saturation rate (descending).\n\n")
                f.write("| Rank | Attack Type | Appearances | Saturation Rate | Avg Turns |\n")
                f.write("|------|-------------|-------------|----------------|-----------|")

                for rank, data in enumerate(attack_type_data, 1):
                    f.write(
                        f"\n| {rank} | {data['attack_type']} | {data['appearances']:,} | "
                        f"{data['saturation_rate']:.1f}% | {data['avg_turns']:.2f} |"
                    )

                # Distribution analysis
                f.write("\n\n## Distribution Analysis\n\n")

                if attack_type_data:
                    most_common = attack_type_data[0]
                    f.write(f"**Most Common**: {most_common['attack_type']} appears in {most_common['saturation_rate']:.1f}% of attack slots\n\n")

                    if len(attack_type_data) > 1:
                        least_common = attack_type_data[-1]
                        f.write(f"**Least Common**: {least_common['attack_type']} appears in {least_common['saturation_rate']:.1f}% of attack slots\n\n")

                # Archetype breakdown section (only if we have archetype data)
                if archetype_attack_types:
                    f.write("\n## Archetype Breakdown\n\n")
                    f.write("Attack type distribution by archetype:\n\n")

                    for arch in sorted(archetype_attack_types.keys()):
                        f.write(f"### {arch.replace('_', ' ').title()}\n\n")
                        arch_attack_types = archetype_attack_types[arch]
                        total_arch_attacks = sum(arch_attack_types.values())

                        f.write("| Attack Type | Appearances | % of Archetype Attacks |\n")
                        f.write("|-------------|-------------|------------------------|\n")

                        # Sort by appearances (descending)
                        sorted_arch_attacks = sorted(arch_attack_types.items(), key=lambda x: x[1], reverse=True)
                        for attack_type, count in sorted_arch_attacks:
                            pct = (count / total_arch_attacks) * 100 if total_arch_attacks > 0 else 0
                            f.write(f"| {attack_type} | {count} | {pct:.1f}% |\n")
                        f.write("\n")

                # Notes
                f.write("\n## Notes\n\n")
                f.write("- Attack types sorted by how frequently they appear in top builds\n")
                f.write("- Higher saturation rate indicates more popular/effective attack type\n")
                f.write("- Avg Turns shows overall build performance, not attack type performance in isolation\n")
                f.write("- Fallback attacks in dual_natured builds are excluded from all counts\n")

            print(f"  + Top {n} attack type distribution report: attack_type_distribution_top{n}.md")

    def _generate_top_n_saturation_reports(
        self,
        build_results: List[Tuple],
        overall_median: float,
        archetype_label: str = None
    ):
        """Generate enhancement saturation reports for fixed top N builds.

        Shows which enhancements appear most frequently in top N builds.
        Counts each enhancement once per build (no double-counting).
        For dual_natured builds, only counts enhancements from primary attack (excludes fallback).

        Args:
            build_results: List of (build, avg_dpt, avg_turns, [archetype]) tuples, already sorted by performance
            overall_median: Median turns across all builds
            archetype_label: Optional label for combined reports (e.g., "COMBINED (FOCUSED + DUAL_NATURED)")
        """
        from collections import defaultdict

        # Create top_n_analysis subdirectory
        top_n_dir = os.path.join(self.reports_dir, 'top_n_analysis')
        os.makedirs(top_n_dir, exist_ok=True)

        # Define top N thresholds
        thresholds = [10, 50, 100, 200, 500, 1000]

        for n in thresholds:
            # Skip if not enough builds
            if len(build_results) < n:
                print(f"  Skipping Top {n} saturation report (only {len(build_results)} builds)")
                continue

            top_n_results = build_results[:n]

            # Track enhancement appearances and archetype distribution
            enhancement_counts = defaultdict(int)
            enhancement_types = {}
            enhancement_costs = {}
            enhancement_turns = defaultdict(list)
            archetype_counts = defaultdict(int)  # Track builds by archetype
            archetype_enhancement_counts = defaultdict(lambda: defaultdict(int))  # Track enhancements per archetype

            for result in top_n_results:
                # Handle both 3-tuple and 4-tuple formats (with/without archetype)
                if len(result) == 4:
                    build, _, avg_turns, source_archetype = result
                elif len(result) == 3:
                    build, _, avg_turns = result
                    source_archetype = self.archetype if hasattr(self, 'archetype') else None
                else:
                    continue

                # Track archetype if available
                if source_archetype:
                    archetype_counts[source_archetype] += 1

                # Track unique enhancements per build (avoid double counting)
                enhancements_in_build = set()

                if isinstance(build, MultiAttackBuild):
                    # For dual_natured builds, only count enhancements from primary attack (builds[0])
                    if build.fallback_type:
                        # Only process primary attack
                        primary_build = build.builds[0]
                        for upgrade in primary_build.upgrades:
                            enhancements_in_build.add(upgrade)
                            if upgrade not in enhancement_types:
                                enhancement_types[upgrade] = 'upgrade'
                                enhancement_costs[upgrade] = UPGRADES[upgrade].cost

                        for limit in primary_build.limits:
                            enhancements_in_build.add(limit)
                            if limit not in enhancement_types:
                                enhancement_types[limit] = 'limit'
                                enhancement_costs[limit] = LIMITS[limit].cost
                    else:
                        # For other multi-attack builds (versatile_master), process all sub-builds
                        for sub_build in build.builds:
                            for upgrade in sub_build.upgrades:
                                enhancements_in_build.add(upgrade)
                                if upgrade not in enhancement_types:
                                    enhancement_types[upgrade] = 'upgrade'
                                    enhancement_costs[upgrade] = UPGRADES[upgrade].cost

                            for limit in sub_build.limits:
                                enhancements_in_build.add(limit)
                                if limit not in enhancement_types:
                                    enhancement_types[limit] = 'limit'
                                    enhancement_costs[limit] = LIMITS[limit].cost
                else:
                    # Single attack build (focused)
                    for upgrade in build.upgrades:
                        enhancements_in_build.add(upgrade)
                        if upgrade not in enhancement_types:
                            enhancement_types[upgrade] = 'upgrade'
                            enhancement_costs[upgrade] = UPGRADES[upgrade].cost

                    for limit in build.limits:
                        enhancements_in_build.add(limit)
                        if limit not in enhancement_types:
                            enhancement_types[limit] = 'limit'
                            enhancement_costs[limit] = LIMITS[limit].cost

                # Count each unique enhancement once per build
                for enh in enhancements_in_build:
                    enhancement_counts[enh] += 1
                    enhancement_turns[enh].append(avg_turns)
                    if source_archetype:
                        archetype_enhancement_counts[source_archetype][enh] += 1

            # Calculate saturation rates
            saturation_data = []
            for name, count in enhancement_counts.items():
                saturation_rate = (count / n) * 100
                avg_turns = statistics.mean(enhancement_turns[name])

                saturation_data.append({
                    'name': name,
                    'type': enhancement_types[name],
                    'cost': enhancement_costs[name],
                    'appearances': count,
                    'saturation_rate': saturation_rate,
                    'avg_turns': avg_turns
                })

            # Sort by saturation rate (descending), then by avg_turns (ascending)
            saturation_data.sort(key=lambda x: (-x['saturation_rate'], x['avg_turns']))

            # Write report
            report_path = os.path.join(top_n_dir, f'enhancement_saturation_top{n}.md')
            with open(report_path, 'w', encoding='utf-8') as f:
                # Header - use archetype_label if provided, otherwise use self.archetype
                header_archetype = archetype_label if archetype_label else self.archetype.upper()
                f.write(f"# {header_archetype} - Enhancement Saturation Report (Top {n})\n\n")
                f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

                # Summary
                f.write("## Summary\n\n")
                f.write(f"- **Analyzed Builds**: Top {n} builds by performance\n")
                f.write(f"- **Unique Enhancements Found**: {len(saturation_data)}\n")
                f.write(f"- **Overall Median Turns**: {overall_median:.2f}\n")

                # Add archetype distribution if we have that data
                if archetype_counts:
                    f.write(f"\n**Archetype Distribution**:\n")
                    total_builds = sum(archetype_counts.values())
                    for arch in sorted(archetype_counts.keys()):
                        count = archetype_counts[arch]
                        pct = (count / total_builds) * 100
                        f.write(f"- {arch.replace('_', ' ').title()}: {count} builds ({pct:.1f}%)\n")
                f.write("\n")

                if saturation_data:
                    f.write(f"- **Average Saturation Rate**: {statistics.mean([d['saturation_rate'] for d in saturation_data]):.1f}%\n")
                    f.write(f"- **Median Saturation Rate**: {statistics.median([d['saturation_rate'] for d in saturation_data]):.1f}%\n\n")
                else:
                    f.write("- **Average Saturation Rate**: N/A\n")
                    f.write("- **Median Saturation Rate**: N/A\n\n")

                # Methodology
                f.write("## Methodology\n\n")
                f.write(f"This report shows saturation rates for enhancements in the top {n} builds.\n\n")
                f.write("**Key Metrics**:\n")
                f.write("1. **Saturation Rate**: % of builds containing this enhancement (counts once per build)\n")
                f.write("2. **Appearances**: Number of builds containing this enhancement\n")
                f.write("3. **Type**: upgrade or limit\n")
                f.write("4. **Cost**: Point cost of enhancement\n")
                f.write("5. **Avg Turns**: Average turns for builds containing this enhancement\n\n")
                f.write("**Important**: For dual_natured builds, only enhancements from the primary attack are counted (fallback attack enhancements are excluded).\n\n")
                f.write("**Interpretation**:\n")
                f.write("- **High saturation (>60%)**: Core enhancement, appears in most top builds\n")
                f.write("- **Medium saturation (30-60%)**: Common enhancement, frequently used\n")
                f.write("- **Low saturation (<30%)**: Niche enhancement, situational use\n\n")

                # Main table
                f.write("## Enhancement Saturation Rankings\n\n")
                f.write("Sorted by saturation rate (descending), then by average turns (ascending).\n\n")
                f.write("| Rank | Enhancement | Type | Cost | Appearances | Saturation Rate | Avg Turns |\n")
                f.write("|------|-------------|------|------|-------------|----------------|-----------|")

                for rank, data in enumerate(saturation_data, 1):
                    f.write(
                        f"\n| {rank} | {data['name']} | {data['type']} | {data['cost']}p | "
                        f"{data['appearances']:,} | {data['saturation_rate']:.1f}% | {data['avg_turns']:.2f} |"
                    )

                # Distribution analysis
                f.write("\n\n## Saturation Distribution\n\n")

                # Count by saturation bracket
                high_sat = sum(1 for d in saturation_data if d['saturation_rate'] > 60)
                medium_sat = sum(1 for d in saturation_data if 30 <= d['saturation_rate'] <= 60)
                low_sat = sum(1 for d in saturation_data if d['saturation_rate'] < 30)

                f.write("| Saturation Level | Count | % of Enhancements |\n")
                f.write("|-----------------|-------|------------------|")
                if saturation_data:
                    f.write(f"\n| High (>60%) | {high_sat} | {high_sat / len(saturation_data) * 100:.1f}% |")
                    f.write(f"\n| Medium (30-60%) | {medium_sat} | {medium_sat / len(saturation_data) * 100:.1f}% |")
                    f.write(f"\n| Low (<30%) | {low_sat} | {low_sat / len(saturation_data) * 100:.1f}% |")
                else:
                    f.write("\n| High (>60%) | 0 | 0.0% |")
                    f.write("\n| Medium (30-60%) | 0 | 0.0% |")
                    f.write("\n| Low (<30%) | 0 | 0.0% |")

                # Top 10 saturated enhancements
                f.write("\n\n## Top 10 Most Saturated Enhancements\n\n")
                f.write("| Enhancement | Type | Cost | Saturation Rate | Avg Turns |\n")
                f.write("|-------------|------|------|----------------|-----------|")

                for data in saturation_data[:10]:
                    f.write(
                        f"\n| {data['name']} | {data['type']} | {data['cost']}p | "
                        f"{data['saturation_rate']:.1f}% | {data['avg_turns']:.2f} |"
                    )

                # Archetype breakdown section (only if we have archetype data)
                if archetype_enhancement_counts:
                    f.write("\n\n## Archetype Breakdown\n\n")
                    f.write("Enhancement saturation by archetype (top 10 per archetype):\n\n")

                    for arch in sorted(archetype_enhancement_counts.keys()):
                        f.write(f"### {arch.replace('_', ' ').title()}\n\n")
                        arch_enhancements = archetype_enhancement_counts[arch]
                        arch_build_count = archetype_counts[arch]

                        # Calculate saturation rates for this archetype
                        arch_sat_data = []
                        for enh_name, count in arch_enhancements.items():
                            sat_rate = (count / arch_build_count) * 100 if arch_build_count > 0 else 0
                            arch_sat_data.append({
                                'name': enh_name,
                                'type': enhancement_types.get(enh_name, 'unknown'),
                                'cost': enhancement_costs.get(enh_name, 0),
                                'saturation_rate': sat_rate,
                                'appearances': count
                            })

                        # Sort by saturation rate (descending)
                        arch_sat_data.sort(key=lambda x: x['saturation_rate'], reverse=True)

                        f.write("| Enhancement | Type | Cost | Appearances | Saturation Rate |\n")
                        f.write("|-------------|------|------|-------------|----------------|\n")

                        # Show top 10 for each archetype
                        for data in arch_sat_data[:10]:
                            f.write(
                                f"| {data['name']} | {data['type']} | {data['cost']}p | "
                                f"{data['appearances']} | {data['saturation_rate']:.1f}% |\n"
                            )
                        f.write("\n")

                # Notes
                f.write("\n## Notes\n\n")
                f.write("- Enhancements sorted by saturation rate (most common first)\n")
                f.write("- Each enhancement counted once per build (no double-counting)\n")
                f.write("- High saturation indicates core enhancements for optimal builds\n")
                f.write("- Avg Turns shows performance of builds containing the enhancement\n")
                f.write("- Fallback attack enhancements in dual_natured builds are excluded from all counts\n")

            print(f"  + Top {n} enhancement saturation report: enhancement_saturation_top{n}.md")

    def _stratified_sample_top_n(
        self,
        archetype_results: Dict[str, List[Tuple]],
        n: int
    ) -> List[Tuple]:
        """
        Create a stratified sample of top N builds with equal representation from each archetype.

        Takes top N/2 from each archetype (or N/num_archetypes for more than 2 archetypes).
        Tags each result with its source archetype as 4th tuple element.

        Args:
            archetype_results: Dict mapping archetype name -> list of (build, avg_dpt, avg_turns) tuples
            n: Total number of builds to sample

        Returns:
            List of (build, avg_dpt, avg_turns, archetype) tuples, sorted by avg_turns
        """
        num_archetypes = len(archetype_results)
        if num_archetypes == 0:
            return []

        # Calculate how many to take from each archetype
        per_archetype = n // num_archetypes
        remainder = n % num_archetypes

        stratified_results = []
        archetype_names = sorted(archetype_results.keys())  # Sort for deterministic ordering

        for idx, archetype_name in enumerate(archetype_names):
            results = archetype_results[archetype_name]

            # Give remainder to first archetypes (deterministic)
            count_from_this = per_archetype + (1 if idx < remainder else 0)

            # Take top count_from_this results (already sorted by avg_turns)
            for build, avg_dpt, avg_turns in results[:count_from_this]:
                stratified_results.append((build, avg_dpt, avg_turns, archetype_name))

        # Sort combined results by performance for display
        stratified_results.sort(key=lambda x: x[2])  # x[2] is avg_turns

        return stratified_results

    def _generate_top_n_attack_type_reports_stratified(
        self,
        archetype_results: Dict[str, List[Tuple]],
        overall_median: float,
        archetype_label: str = None
    ):
        """Generate attack type distribution reports using stratified sampling from multiple archetypes.

        Takes top N/2 from each archetype to ensure equal representation.
        Identical logic to _generate_top_n_attack_type_reports but with stratified sampling.

        Args:
            archetype_results: Dict mapping archetype name -> list of (build, avg_dpt, avg_turns) tuples
            overall_median: Median turns across all builds
            archetype_label: Optional label for combined reports
        """
        from collections import defaultdict

        # Create top_n_analysis subdirectory
        top_n_dir = os.path.join(self.reports_dir, 'top_n_analysis')
        os.makedirs(top_n_dir, exist_ok=True)

        # Define top N thresholds
        thresholds = [10, 50, 100, 200, 500, 1000]

        num_archetypes = len(archetype_results)
        per_archetype_text = f"top {{}}/{num_archetypes} from each archetype"

        for n in thresholds:
            # Get stratified sample (top N/2 from each archetype)
            stratified_sample = self._stratified_sample_top_n(archetype_results, n)

            if len(stratified_sample) < n:
                print(f"  Skipping Top {n} attack type report (only {len(stratified_sample)} builds available)")
                continue

            top_n_results = stratified_sample[:n]  # Ensure exactly n builds

            # Track attack type appearances and archetype distribution
            attack_type_counts = defaultdict(int)
            attack_type_turns = defaultdict(list)
            archetype_counts = defaultdict(int)
            archetype_attack_types = defaultdict(lambda: defaultdict(int))
            total_attacks = 0

            for result in top_n_results:
                # All results from stratified sample have 4-tuple format
                build, _, avg_turns, source_archetype = result

                # Track archetype
                archetype_counts[source_archetype] += 1

                if isinstance(build, MultiAttackBuild):
                    # For dual_natured builds, only count primary attack
                    if build.fallback_type:
                        primary_build = build.builds[0]
                        attack_type = primary_build.attack_type
                        attack_type_counts[attack_type] += 1
                        attack_type_turns[attack_type].append(avg_turns)
                        archetype_attack_types[source_archetype][attack_type] += 1
                        total_attacks += 1
                    else:
                        # For other multi-attack builds, count all attacks
                        for sub_build in build.builds:
                            attack_type = sub_build.attack_type
                            attack_type_counts[attack_type] += 1
                            attack_type_turns[attack_type].append(avg_turns)
                            archetype_attack_types[source_archetype][attack_type] += 1
                            total_attacks += 1
                else:
                    # Single attack build (focused)
                    attack_type = build.attack_type
                    attack_type_counts[attack_type] += 1
                    attack_type_turns[attack_type].append(avg_turns)
                    archetype_attack_types[source_archetype][attack_type] += 1
                    total_attacks += 1

            # Calculate statistics
            attack_type_data = []
            for attack_type, count in attack_type_counts.items():
                saturation_rate = (count / total_attacks) * 100 if total_attacks > 0 else 0
                avg_turns_val = statistics.mean(attack_type_turns[attack_type])

                attack_type_data.append({
                    'attack_type': attack_type,
                    'appearances': count,
                    'saturation_rate': saturation_rate,
                    'avg_turns': avg_turns_val
                })

            # Sort by saturation rate (descending)
            attack_type_data.sort(key=lambda x: x['saturation_rate'], reverse=True)

            # Write report
            report_path = os.path.join(top_n_dir, f'attack_type_distribution_top{n}.md')
            with open(report_path, 'w', encoding='utf-8') as f:
                # Header
                header_archetype = archetype_label if archetype_label else "COMBINED"
                f.write(f"# {header_archetype} - Attack Type Distribution Report (Top {n})\n\n")
                f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

                # Summary
                f.write("## Summary\n\n")
                f.write(f"- **Analyzed Builds**: Top {n} builds by performance\n")
                f.write(f"- **Total Attack Slots**: {total_attacks:,}\n")
                f.write(f"- **Unique Attack Types**: {len(attack_type_data)}\n")
                f.write(f"- **Overall Median Turns**: {overall_median:.2f}\n")
                f.write(f"- **Sampling Method**: Stratified ({per_archetype_text.format(n // num_archetypes)})\n")

                # Add archetype distribution
                if archetype_counts:
                    f.write(f"\n**Archetype Distribution**:\n")
                    total_builds = sum(archetype_counts.values())
                    for arch in sorted(archetype_counts.keys()):
                        count = archetype_counts[arch]
                        pct = (count / total_builds) * 100
                        f.write(f"- {arch.replace('_', ' ').title()}: {count} builds ({pct:.1f}%)\n")
                f.write("\n")

                # Methodology
                f.write("## Methodology\n\n")
                f.write(f"This report shows which attack types appear most frequently in the top {n} builds.\n\n")
                f.write("**Sampling Strategy**:\n")
                f.write(f"- Stratified sampling ensures equal representation from each archetype\n")
                f.write(f"- Takes {per_archetype_text.format(n // num_archetypes)} to guarantee balanced comparison\n")
                f.write(f"- Total of {n} builds analyzed ({' + '.join([f'{n // num_archetypes} {arch}' for arch in sorted(archetype_results.keys())])})\n\n")
                f.write("**Key Metrics**:\n")
                f.write("1. **Saturation Rate**: % of attack slots using this type\n")
                f.write("2. **Appearances**: Number of times this attack type appears\n")
                f.write("3. **Avg Turns**: Average turns for builds using this attack type\n\n")
                f.write("**Important**: For dual_natured builds, only the primary attack is counted (fallback attacks are excluded).\n")
                f.write("For versatile_master builds, all attack slots are counted.\n\n")

                # Main table
                f.write("## Attack Type Distribution\n\n")
                f.write("Sorted by saturation rate (descending).\n\n")
                f.write("| Rank | Attack Type | Appearances | Saturation Rate | Avg Turns |\n")
                f.write("|------|-------------|-------------|----------------|-----------|")

                for rank, data in enumerate(attack_type_data, 1):
                    f.write(
                        f"\n| {rank} | {data['attack_type']} | {data['appearances']:,} | "
                        f"{data['saturation_rate']:.1f}% | {data['avg_turns']:.2f} |"
                    )

                # Distribution analysis
                f.write("\n\n## Distribution Analysis\n\n")

                if attack_type_data:
                    most_common = attack_type_data[0]
                    f.write(f"**Most Common**: {most_common['attack_type']} appears in {most_common['saturation_rate']:.1f}% of attack slots\n\n")

                    if len(attack_type_data) > 1:
                        least_common = attack_type_data[-1]
                        f.write(f"**Least Common**: {least_common['attack_type']} appears in {least_common['saturation_rate']:.1f}% of attack slots\n\n")

                # Archetype breakdown section
                if archetype_attack_types:
                    f.write("\n## Archetype Breakdown\n\n")
                    f.write("Attack type distribution by archetype:\n\n")

                    for arch in sorted(archetype_attack_types.keys()):
                        f.write(f"### {arch.replace('_', ' ').title()}\n\n")
                        arch_attack_types = archetype_attack_types[arch]
                        total_arch_attacks = sum(arch_attack_types.values())

                        f.write("| Attack Type | Appearances | % of Archetype Attacks |\n")
                        f.write("|-------------|-------------|------------------------|\n")

                        # Sort by appearances (descending)
                        sorted_arch_attacks = sorted(arch_attack_types.items(), key=lambda x: x[1], reverse=True)
                        for attack_type, count in sorted_arch_attacks:
                            pct = (count / total_arch_attacks) * 100 if total_arch_attacks > 0 else 0
                            f.write(f"| {attack_type} | {count} | {pct:.1f}% |\n")
                        f.write("\n")

                # Notes
                f.write("\n## Notes\n\n")
                f.write("- **Stratified sampling** ensures both archetypes are represented equally\n")
                f.write("- Attack types sorted by how frequently they appear in top builds\n")
                f.write("- Higher saturation rate indicates more popular/effective attack type\n")
                f.write("- Avg Turns shows overall build performance, not attack type performance in isolation\n")
                f.write("- Fallback attacks in dual_natured builds are excluded from all counts\n")

            print(f"  + Top {n} attack type distribution report: attack_type_distribution_top{n}.md")

    def _generate_top_n_saturation_reports_stratified(
        self,
        archetype_results: Dict[str, List[Tuple]],
        overall_median: float,
        archetype_label: str = None
    ):
        """Generate enhancement saturation reports using stratified sampling from multiple archetypes.

        Takes top N/2 from each archetype to ensure equal representation.
        Identical logic to _generate_top_n_saturation_reports but with stratified sampling.

        Args:
            archetype_results: Dict mapping archetype name -> list of (build, avg_dpt, avg_turns) tuples
            overall_median: Median turns across all builds
            archetype_label: Optional label for combined reports
        """
        from collections import defaultdict

        # Create top_n_analysis subdirectory
        top_n_dir = os.path.join(self.reports_dir, 'top_n_analysis')
        os.makedirs(top_n_dir, exist_ok=True)

        # Define top N thresholds
        thresholds = [10, 50, 100, 200, 500, 1000]

        num_archetypes = len(archetype_results)
        per_archetype_text = f"top {{}}/{num_archetypes} from each archetype"

        for n in thresholds:
            # Get stratified sample (top N/2 from each archetype)
            stratified_sample = self._stratified_sample_top_n(archetype_results, n)

            if len(stratified_sample) < n:
                print(f"  Skipping Top {n} saturation report (only {len(stratified_sample)} builds available)")
                continue

            top_n_results = stratified_sample[:n]  # Ensure exactly n builds

            # Track enhancement appearances and archetype distribution
            enhancement_counts = defaultdict(int)
            enhancement_types = {}
            enhancement_costs = {}
            enhancement_turns = defaultdict(list)
            archetype_counts = defaultdict(int)
            archetype_enhancement_counts = defaultdict(lambda: defaultdict(int))

            for result in top_n_results:
                # All results from stratified sample have 4-tuple format
                build, _, avg_turns, source_archetype = result

                # Track archetype
                archetype_counts[source_archetype] += 1

                # Track unique enhancements per build (avoid double counting)
                enhancements_in_build = set()

                if isinstance(build, MultiAttackBuild):
                    # For dual_natured builds, only count enhancements from primary attack
                    if build.fallback_type:
                        primary_build = build.builds[0]
                        for upgrade in primary_build.upgrades:
                            enhancements_in_build.add(upgrade)
                            if upgrade not in enhancement_types:
                                enhancement_types[upgrade] = 'upgrade'
                                enhancement_costs[upgrade] = UPGRADES[upgrade].cost

                        for limit in primary_build.limits:
                            enhancements_in_build.add(limit)
                            if limit not in enhancement_types:
                                enhancement_types[limit] = 'limit'
                                enhancement_costs[limit] = LIMITS[limit].cost
                    else:
                        # For other multi-attack builds, process all sub-builds
                        for sub_build in build.builds:
                            for upgrade in sub_build.upgrades:
                                enhancements_in_build.add(upgrade)
                                if upgrade not in enhancement_types:
                                    enhancement_types[upgrade] = 'upgrade'
                                    enhancement_costs[upgrade] = UPGRADES[upgrade].cost

                            for limit in sub_build.limits:
                                enhancements_in_build.add(limit)
                                if limit not in enhancement_types:
                                    enhancement_types[limit] = 'limit'
                                    enhancement_costs[limit] = LIMITS[limit].cost
                else:
                    # Single attack build (focused)
                    for upgrade in build.upgrades:
                        enhancements_in_build.add(upgrade)
                        if upgrade not in enhancement_types:
                            enhancement_types[upgrade] = 'upgrade'
                            enhancement_costs[upgrade] = UPGRADES[upgrade].cost

                    for limit in build.limits:
                        enhancements_in_build.add(limit)
                        if limit not in enhancement_types:
                            enhancement_types[limit] = 'limit'
                            enhancement_costs[limit] = LIMITS[limit].cost

                # Count each unique enhancement once per build
                for enh in enhancements_in_build:
                    enhancement_counts[enh] += 1
                    enhancement_turns[enh].append(avg_turns)
                    archetype_enhancement_counts[source_archetype][enh] += 1

            # Calculate saturation rates
            saturation_data = []
            for name, count in enhancement_counts.items():
                saturation_rate = (count / n) * 100
                avg_turns_val = statistics.mean(enhancement_turns[name])

                saturation_data.append({
                    'name': name,
                    'type': enhancement_types[name],
                    'cost': enhancement_costs[name],
                    'appearances': count,
                    'saturation_rate': saturation_rate,
                    'avg_turns': avg_turns_val
                })

            # Sort by saturation rate (descending), then by avg_turns (ascending)
            saturation_data.sort(key=lambda x: (-x['saturation_rate'], x['avg_turns']))

            # Write report
            report_path = os.path.join(top_n_dir, f'enhancement_saturation_top{n}.md')
            with open(report_path, 'w', encoding='utf-8') as f:
                # Header
                header_archetype = archetype_label if archetype_label else "COMBINED"
                f.write(f"# {header_archetype} - Enhancement Saturation Report (Top {n})\n\n")
                f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")

                # Summary
                f.write("## Summary\n\n")
                f.write(f"- **Analyzed Builds**: Top {n} builds by performance\n")
                f.write(f"- **Unique Enhancements Found**: {len(saturation_data)}\n")
                f.write(f"- **Overall Median Turns**: {overall_median:.2f}\n")
                f.write(f"- **Sampling Method**: Stratified ({per_archetype_text.format(n // num_archetypes)})\n")

                # Add archetype distribution
                if archetype_counts:
                    f.write(f"\n**Archetype Distribution**:\n")
                    total_builds = sum(archetype_counts.values())
                    for arch in sorted(archetype_counts.keys()):
                        count = archetype_counts[arch]
                        pct = (count / total_builds) * 100
                        f.write(f"- {arch.replace('_', ' ').title()}: {count} builds ({pct:.1f}%)\n")
                f.write("\n")

                if saturation_data:
                    f.write(f"- **Average Saturation Rate**: {statistics.mean([d['saturation_rate'] for d in saturation_data]):.1f}%\n")
                    f.write(f"- **Median Saturation Rate**: {statistics.median([d['saturation_rate'] for d in saturation_data]):.1f}%\n\n")
                else:
                    f.write("- **Average Saturation Rate**: N/A\n")
                    f.write("- **Median Saturation Rate**: N/A\n\n")

                # Methodology
                f.write("## Methodology\n\n")
                f.write(f"This report shows saturation rates for enhancements in the top {n} builds.\n\n")
                f.write("**Sampling Strategy**:\n")
                f.write(f"- Stratified sampling ensures equal representation from each archetype\n")
                f.write(f"- Takes {per_archetype_text.format(n // num_archetypes)} to guarantee balanced comparison\n")
                f.write(f"- Total of {n} builds analyzed ({' + '.join([f'{n // num_archetypes} {arch}' for arch in sorted(archetype_results.keys())])})\n\n")
                f.write("**Key Metrics**:\n")
                f.write("1. **Saturation Rate**: % of builds containing this enhancement (counts once per build)\n")
                f.write("2. **Appearances**: Number of builds containing this enhancement\n")
                f.write("3. **Type**: upgrade or limit\n")
                f.write("4. **Cost**: Point cost of enhancement\n")
                f.write("5. **Avg Turns**: Average turns for builds containing this enhancement\n\n")
                f.write("**Important**: For dual_natured builds, only enhancements from the primary attack are counted (fallback attack enhancements are excluded).\n\n")
                f.write("**Interpretation**:\n")
                f.write("- **High saturation (>60%)**: Core enhancement, appears in most top builds\n")
                f.write("- **Medium saturation (30-60%)**: Common enhancement, frequently used\n")
                f.write("- **Low saturation (<30%)**: Niche enhancement, situational use\n\n")

                # Main table
                f.write("## Enhancement Saturation Rankings\n\n")
                f.write("Sorted by saturation rate (descending), then by average turns (ascending).\n\n")
                f.write("| Rank | Enhancement | Type | Cost | Appearances | Saturation Rate | Avg Turns |\n")
                f.write("|------|-------------|------|------|-------------|----------------|-----------|")

                for rank, data in enumerate(saturation_data, 1):
                    f.write(
                        f"\n| {rank} | {data['name']} | {data['type']} | {data['cost']}p | "
                        f"{data['appearances']:,} | {data['saturation_rate']:.1f}% | {data['avg_turns']:.2f} |"
                    )

                # Distribution analysis
                f.write("\n\n## Saturation Distribution\n\n")

                # Count by saturation bracket
                high_sat = sum(1 for d in saturation_data if d['saturation_rate'] > 60)
                medium_sat = sum(1 for d in saturation_data if 30 <= d['saturation_rate'] <= 60)
                low_sat = sum(1 for d in saturation_data if d['saturation_rate'] < 30)

                f.write("| Saturation Level | Count | % of Enhancements |\n")
                f.write("|-----------------|-------|------------------|")
                if saturation_data:
                    f.write(f"\n| High (>60%) | {high_sat} | {high_sat / len(saturation_data) * 100:.1f}% |")
                    f.write(f"\n| Medium (30-60%) | {medium_sat} | {medium_sat / len(saturation_data) * 100:.1f}% |")
                    f.write(f"\n| Low (<30%) | {low_sat} | {low_sat / len(saturation_data) * 100:.1f}% |")
                else:
                    f.write("\n| High (>60%) | 0 | 0.0% |")
                    f.write("\n| Medium (30-60%) | 0 | 0.0% |")
                    f.write("\n| Low (<30%) | 0 | 0.0% |")

                # Top 10 saturated enhancements
                f.write("\n\n## Top 10 Most Saturated Enhancements\n\n")
                f.write("| Enhancement | Type | Cost | Saturation Rate | Avg Turns |\n")
                f.write("|-------------|------|------|----------------|-----------|")

                for data in saturation_data[:10]:
                    f.write(
                        f"\n| {data['name']} | {data['type']} | {data['cost']}p | "
                        f"{data['saturation_rate']:.1f}% | {data['avg_turns']:.2f} |"
                    )

                # Archetype breakdown section
                if archetype_enhancement_counts:
                    f.write("\n\n## Archetype Breakdown\n\n")
                    f.write("Enhancement saturation by archetype (top 10 per archetype):\n\n")

                    for arch in sorted(archetype_enhancement_counts.keys()):
                        f.write(f"### {arch.replace('_', ' ').title()}\n\n")
                        arch_enhancements = archetype_enhancement_counts[arch]
                        arch_build_count = archetype_counts[arch]

                        # Calculate saturation rates for this archetype
                        arch_sat_data = []
                        for enh_name, count in arch_enhancements.items():
                            sat_rate = (count / arch_build_count) * 100 if arch_build_count > 0 else 0
                            arch_sat_data.append({
                                'name': enh_name,
                                'type': enhancement_types.get(enh_name, 'unknown'),
                                'cost': enhancement_costs.get(enh_name, 0),
                                'saturation_rate': sat_rate,
                                'appearances': count
                            })

                        # Sort by saturation rate (descending)
                        arch_sat_data.sort(key=lambda x: x['saturation_rate'], reverse=True)

                        f.write("| Enhancement | Type | Cost | Appearances | Saturation Rate |\n")
                        f.write("|-------------|------|------|-------------|----------------|\n")

                        # Show top 10 for each archetype
                        for data in arch_sat_data[:10]:
                            f.write(
                                f"| {data['name']} | {data['type']} | {data['cost']}p | "
                                f"{data['appearances']} | {data['saturation_rate']:.1f}% |\n"
                            )
                        f.write("\n")

                # Notes
                f.write("\n## Notes\n\n")
                f.write("- **Stratified sampling** ensures both archetypes are represented equally\n")
                f.write("- Enhancements sorted by saturation rate (most common first)\n")
                f.write("- Each enhancement counted once per build (no double-counting)\n")
                f.write("- High saturation indicates core enhancements for optimal builds\n")
                f.write("- Avg Turns shows performance of builds containing the enhancement\n")
                f.write("- Fallback attack enhancements in dual_natured builds are excluded from all counts\n")

            print(f"  + Top {n} enhancement saturation report: enhancement_saturation_top{n}.md")
