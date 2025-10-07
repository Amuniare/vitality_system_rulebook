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

        # Generate reports
        self._generate_enhancement_ranking_report(enhancement_stats, len(build_results))
        self._generate_cost_analysis_report(enhancement_stats)

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

            # Top 10%, Top 20%, and Top 50% statistics
            sorted_appearances = sorted(appearances, key=lambda x: x[0])  # Sort by rank
            top_10_count = max(1, len(sorted_appearances) // 10)
            top_20_count = max(1, len(sorted_appearances) // 5)
            top_50_count = max(1, len(sorted_appearances) // 2)

            top_10_turns = [turns for _, turns in sorted_appearances[:top_10_count]]
            top_20_turns = [turns for _, turns in sorted_appearances[:top_20_count]]
            top_50_turns = [turns for _, turns in sorted_appearances[:top_50_count]]

            median_top_10 = statistics.median(top_10_turns) if top_10_turns else 0
            median_top_20 = statistics.median(top_20_turns) if top_20_turns else 0
            median_top_50 = statistics.median(top_50_turns) if top_50_turns else 0

            top10_vs_median = median_top_10 - median_turns
            top20_vs_median = median_top_20 - median_turns
            top50_vs_median = median_top_50 - median_turns

            cost = data['cost']
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

    def _generate_enhancement_ranking_report(self, enhancement_stats: List[Dict], total_builds: int):
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
            f.write(f"**Total builds tested**: {total_builds}\n\n")

            # Table header - conditional based on archetype
            if has_multi_attack:
                f.write("| Rank | Enhancement | Cost | Top50% vs Med / cost | Avg Turns | vs Median | Top10% | Top10% vs Med | Top10% Eff | Top20% | Top20% vs Med | Top20% Eff | Top50% | Top50% vs Med | Top50% Eff | Melee_AC | Melee_DG | Ranged | Area | Direct | Slot1 | Slot2 | Used1 | Used2 | Uses | Med Rank |\n")
                f.write("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n")
            else:
                f.write("| Rank | Enhancement | Cost | Top50% vs Med / cost | Avg Turns | vs Median | Top10% | Top10% vs Median | Top10% Eff | Top20% | Top20% vs Median | Top20% Eff | Top50% | Top50% vs Median | Top50% Eff | Melee_AC | Melee_DG | Ranged | Area | Direct | Uses | Med Rank |\n")
                f.write("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n")

            # Table rows
            for i, stats in enumerate(enhancement_stats_sorted, 1):
                row = (
                    f"| {i} | {stats['name']} | {stats['cost']}p | {stats['top50_efficiency']:.2f} | "
                    f"{stats['avg_turns']:.1f} | {stats['vs_median']:+.1f} | "
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

    def _generate_cost_analysis_report(self, enhancement_stats: List[Dict]):
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
            f.write("| Enhancement | Cost | Avg Turns | vs Median | Efficiency | Top10% | Top10% vs Med | Top10% Eff | Top20% | Top20% vs Med | Top20% Eff | Top50% | Top50% vs Med | Top50% Eff |\n")
            f.write("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n")

            for cost in sorted(cost_groups.keys()):
                f.write(f"| **COST {cost}** |\n")
                for stats in cost_groups[cost]:
                    efficiency = stats['vs_median'] / cost if cost > 0 else 0
                    f.write(
                        f"| {stats['name']} | {cost} | {stats['avg_turns']:.1f} | "
                        f"{stats['vs_median']:+.1f} | {efficiency:.2f} | "
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
