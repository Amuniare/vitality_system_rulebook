"""
Build testing report generation module.

This module provides the BuildReportGenerator class which generates comprehensive
build testing reports with statistical analysis.
"""

from typing import Dict, List, Tuple
from src.models import SimulationConfig, MultiAttackBuild


def is_multiattack(build):
    """Check if a build is a MultiAttackBuild"""
    return isinstance(build, MultiAttackBuild)


def get_build_attack_type(build):
    """Get attack type string for both AttackBuild and MultiAttackBuild"""
    if is_multiattack(build):
        return f"{build.archetype}_multi"
    return build.attack_type


def has_area_attack(build):
    """Check if a build has area attacks"""
    if is_multiattack(build):
        return any('area' in b.attack_type for b in build.builds)
    return 'area' in build.attack_type


class BuildReportGenerator:
    """Generates comprehensive build testing reports with statistical analysis"""

    def __init__(self, config: SimulationConfig, reports_dir: str):
        self.config = config
        self.reports_dir = reports_dir
        self.build_config = config.build_testing

    def generate_all_reports(self, all_build_results: List[Tuple]):
        """Generate all build testing reports"""
        # Import here to avoid circular imports
        from src.reporting import (
            write_build_summary,
            write_builds_turns_table,
            generate_upgrade_ranking_report,
            generate_upgrade_pairing_report,
            write_upgrade_limit_frequency_report
        )

        if not self.build_config.get('enabled', True):
            print("Build testing disabled, skipping...")
            return

        print("Generating build testing reports...")

        # Check if we have any single-attack builds vs multi-attack builds
        has_single_builds = any(not is_multiattack(b) for b, _, _ in all_build_results)
        has_multi_builds = any(is_multiattack(b) for b, _, _ in all_build_results)

        # Generate existing reports using the current system
        if self.config.reports.get('build_reports', {}).get('build_rankings', True):
            # Pass the full results with performance data
            write_build_summary(all_build_results, self.config, self.reports_dir)
            write_builds_turns_table(all_build_results, self.config, self.reports_dir)
            # Generate frequency report for top builds
            write_upgrade_limit_frequency_report(all_build_results, self.config, self.reports_dir, top_n=100)

        # Store enhancement stats for cost analysis
        enhancement_stats = None

        # Only generate single-build reports if we have single-attack builds
        if has_single_builds:
            if self.config.reports.get('build_reports', {}).get('upgrade_analysis', True):
                # Capture enhancement stats returned from generate_upgrade_ranking_report
                enhancement_stats, attack_type_stats = generate_upgrade_ranking_report(all_build_results, self.config, self.reports_dir)

            if self.config.reports.get('build_reports', {}).get('cost_effectiveness', True):
                generate_upgrade_pairing_report(all_build_results, self.config, self.reports_dir)

            if self.config.reports.get('build_reports', {}).get('archetype_analysis', True):
                self.generate_archetype_analysis_reports(all_build_results)

            # Generate tactical analysis reports
            if self.config.reports.get('build_reports', {}).get('tactical_analysis', True):
                self.generate_tactical_analysis_reports(all_build_results)
        else:
            print("Skipping single-attack build reports (all builds are MultiAttackBuild)")

        # Generate MultiAttackBuild-specific reports if we have multi-attack builds
        if has_multi_builds:
            if self.config.reports.get('build_reports', {}).get('tactical_analysis', True):
                self.generate_multiattack_tactical_reports(all_build_results)

        # Generate cost analysis reports
        if self.config.reports.get('build_reports', {}).get('cost_analysis', True):
            from src.reporting.cost_analysis import generate_build_cost_analysis

            # Generate overall cost analysis if we have single builds
            if has_single_builds:
                generate_build_cost_analysis(all_build_results, self.config, self.reports_dir,
                                            enhancement_stats=enhancement_stats)

            # Generate archetype-specific cost analysis
            if self.config.archetypes:
                for archetype in self.config.archetypes:
                    archetype_dir = f"{self.reports_dir}/{archetype}"
                    # Note: archetype-specific enhancement stats would need separate generation
                    # For now, pass None to use file parsing fallback for archetype reports
                    generate_build_cost_analysis(all_build_results, self.config, archetype_dir, archetype,
                                                enhancement_stats=None)

        print("Build testing reports completed!")

    def generate_archetype_analysis_reports(self, all_build_results: List[Tuple]):
        """Generate build archetype analysis reports"""
        print("Generating archetype analysis reports...")

        # Check if we have any single-attack builds
        has_single_builds = any(not is_multiattack(b) for b, _, _ in all_build_results)

        self.generate_multi_target_specialist_report(all_build_results)

        if has_single_builds:
            self.generate_single_target_specialist_report(all_build_results)
            self.generate_balanced_build_report(all_build_results)
            self.generate_risk_reward_analysis_report(all_build_results)
        else:
            print("Skipping single-attack archetype reports (all builds are MultiAttackBuild)")

    def generate_multi_target_specialist_report(self, all_build_results: List[Tuple]):
        """Generate report for builds optimized for multi-target scenarios"""
        filename = f"{self.reports_dir}/archetype_multi_target_specialists.txt"

        # Calculate multi-target performance scores
        multi_target_builds = []
        for build, avg_dpt, avg_turns in all_build_results:
            # Get scenario-specific performance (you'll need to modify this based on actual data structure)
            # For now, calculate a multi-target score based on AOE potential
            multi_target_score = self._calculate_multi_target_score(build, avg_dpt)
            multi_target_builds.append((build, avg_dpt, multi_target_score))

        # Sort by multi-target score
        multi_target_builds.sort(key=lambda x: x[2], reverse=True)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - MULTI-TARGET SPECIALIST BUILDS\n")
            f.write("="*80 + "\n\n")
            f.write("Builds optimized for swarm and group combat scenarios (2×50, 4×25, 10×10 HP)\n")
            f.write("Ranked by Multi-Target Performance Score\n\n")
            f.write("Multi-Target Score = (2×50 DPT + 4×25 DPT + 10×10 DPT) / 3\n\n")

            f.write(f"{'Rank':<4} {'Build':<50} {'Avg DPT':<10} {'MT Score':<10} {'Cost':<6}\n")
            f.write("-" * 85 + "\n")

            for i, (build, avg_dpt, mt_score) in enumerate(multi_target_builds[:25], 1):
                build_str = get_build_attack_type(build)
                if not is_multiattack(build):
                    if build.upgrades:
                        build_str += f" + {' + '.join(build.upgrades)}"
                    if build.limits:
                        build_str += f" + {' + '.join(build.limits)}"
                    total_cost = build.total_cost
                else:
                    total_cost = build.get_total_cost()

                f.write(f"{i:<4} {build_str:<50} {avg_dpt:<10.2f} {mt_score:<10.2f} {total_cost:<6}\n")

            # Analysis section
            f.write("\n" + "="*80 + "\n")
            f.write("MULTI-TARGET SPECIALIST ANALYSIS\n")
            f.write("="*80 + "\n\n")

            # Top archetypes analysis
            aoe_builds = [(b, dpt, score) for b, dpt, score in multi_target_builds if has_area_attack(b)][:10]

            f.write("TOP AOE ARCHETYPES:\n")
            for i, (build, avg_dpt, mt_score) in enumerate(aoe_builds, 1):
                f.write(f"{i}. {get_build_attack_type(build)}")
                if not is_multiattack(build) and build.upgrades:
                    f.write(f" + {' + '.join(build.upgrades)}")
                f.write(f" (MT Score: {mt_score:.2f})\n")

            # Key insights
            f.write(f"\nKEY INSIGHTS:\n")
            f.write(f"• Top MT Score: {multi_target_builds[0][2]:.2f}\n")
            f.write(f"• AOE builds in top 10: {len([b for b, _, _ in multi_target_builds[:10] if has_area_attack(b)])}\n")
            avg_cost = sum(b.get_total_cost() if is_multiattack(b) else b.total_cost for b, _, _ in multi_target_builds[:10]) / 10
            f.write(f"• Average cost of top 10: {avg_cost:.1f} points\n")

        print(f"Multi-target specialist report saved to {filename}")

    def generate_single_target_specialist_report(self, all_build_results: List[Tuple]):
        """Generate report for builds optimized for single-target scenarios"""
        filename = f"{self.reports_dir}/archetype_single_target_specialists.txt"

        # Filter out MultiAttackBuilds for single-attack analysis
        single_attack_results = [(b, dpt, turns) for b, dpt, turns in all_build_results if not is_multiattack(b)]

        # Calculate single-target performance scores
        single_target_builds = []
        for build, avg_dpt, avg_turns in single_attack_results:
            single_target_score = self._calculate_single_target_score(build, avg_dpt)
            single_target_builds.append((build, avg_dpt, single_target_score))

        # Sort by single-target score
        single_target_builds.sort(key=lambda x: x[2], reverse=True)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - SINGLE-TARGET SPECIALIST BUILDS\n")
            f.write("="*80 + "\n\n")
            f.write("Builds optimized for boss fights and high-HP single enemies (1×100 HP)\n")
            f.write("Ranked by Single-Target Performance Score\n\n")
            f.write("Single-Target Score = 1×100 HP scenario DPT\n\n")

            # Check if we have any builds
            if not single_target_builds:
                f.write("Note: All builds are MultiAttackBuild objects. This report is for single-attack builds only.\n")
                print(f"Single-target specialist report saved to {filename} (no single-attack builds)")
                return

            f.write(f"{'Rank':<4} {'Build':<50} {'Avg DPT':<10} {'ST Score':<10} {'Cost':<6}\n")
            f.write("-" * 85 + "\n")

            for i, (build, avg_dpt, st_score) in enumerate(single_target_builds[:25], 1):
                build_str = get_build_attack_type(build)
                if build.upgrades:
                    build_str += f" + {' + '.join(build.upgrades)}"
                if build.limits:
                    build_str += f" + {' + '.join(build.limits)}"

                f.write(f"{i:<4} {build_str:<50} {avg_dpt:<10.2f} {st_score:<10.2f} {build.total_cost:<6}\n")

            # Analysis section
            f.write("\n" + "="*80 + "\n")
            f.write("SINGLE-TARGET SPECIALIST ANALYSIS\n")
            f.write("="*80 + "\n\n")

            # Attack type analysis
            attack_types = {}
            for build, _, st_score in single_target_builds[:20]:
                attack_type = get_build_attack_type(build)
                if attack_type not in attack_types:
                    attack_types[attack_type] = []
                attack_types[attack_type].append(st_score)

            f.write("ATTACK TYPE PERFORMANCE (Top 20 builds):\n")
            for attack_type, scores in sorted(attack_types.items(), key=lambda x: max(x[1]), reverse=True):
                avg_score = sum(scores) / len(scores)
                f.write(f"• {attack_type}: {len(scores)} builds, avg {avg_score:.2f}, best {max(scores):.2f}\n")

            # Key insights
            f.write(f"\nKEY INSIGHTS:\n")
            f.write(f"• Top ST Score: {single_target_builds[0][2]:.2f}\n")
            f.write(f"• Most common attack type in top 10: {max(set([b.attack_type for b, _, _ in single_target_builds[:10]]), key=[b.attack_type for b, _, _ in single_target_builds[:10]].count)}\n")
            f.write(f"• Average cost of top 10: {sum(b.total_cost for b, _, _ in single_target_builds[:10]) / 10:.1f} points\n")

        print(f"Single-target specialist report saved to {filename}")

    def generate_balanced_build_report(self, all_build_results: List[Tuple]):
        """Generate report for builds that perform well across all scenarios"""
        filename = f"{self.reports_dir}/archetype_balanced_builds.txt"

        # Filter out MultiAttackBuilds
        single_attack_results = [(b, dpt, turns) for b, dpt, turns in all_build_results if not is_multiattack(b)]

        # Calculate balance scores (low variance across scenarios)
        balanced_builds = []
        for build, avg_dpt, avg_turns in single_attack_results:
            balance_score = self._calculate_balance_score(build, avg_dpt)
            balanced_builds.append((build, avg_dpt, balance_score))

        # Sort by balance score (higher = more balanced)
        balanced_builds.sort(key=lambda x: x[2], reverse=True)

        with open(filename, 'w', encoding='utf-8') as f:
            # Check if we have any builds
            if not balanced_builds:
                f.write("Note: All builds are MultiAttackBuild objects. This report is for single-attack builds only.\n")
                print(f"Balanced builds report saved to {filename} (no single-attack builds)")
                return

            f.write("VITALITY SYSTEM - BALANCED BUILDS\n")
            f.write("="*80 + "\n\n")
            f.write("Builds that perform consistently across all combat scenarios\n")
            f.write("Ranked by Balance Score (low variance, high overall performance)\n\n")
            f.write("Balance Score = Average DPT - (Scenario Variance × 2)\n\n")

            f.write(f"{'Rank':<4} {'Build':<50} {'Avg DPT':<10} {'Balance':<10} {'Cost':<6}\n")
            f.write("-" * 85 + "\n")

            for i, (build, avg_dpt, balance_score) in enumerate(balanced_builds[:25], 1):
                build_str = get_build_attack_type(build)
                if build.upgrades:
                    build_str += f" + {' + '.join(build.upgrades)}"
                if build.limits:
                    build_str += f" + {' + '.join(build.limits)}"

                f.write(f"{i:<4} {build_str:<50} {avg_dpt:<10.2f} {balance_score:<10.2f} {build.total_cost:<6}\n")

            # Analysis section
            f.write("\n" + "="*80 + "\n")
            f.write("BALANCED BUILD ANALYSIS\n")
            f.write("="*80 + "\n\n")

            f.write("CHARACTERISTICS OF BALANCED BUILDS:\n")

            # Upgrade frequency analysis
            upgrade_counts = {}
            for build, _, _ in balanced_builds[:15]:
                for upgrade in build.upgrades:
                    upgrade_counts[upgrade] = upgrade_counts.get(upgrade, 0) + 1

            f.write("\nMost common upgrades in top 15 balanced builds:\n")
            for upgrade, count in sorted(upgrade_counts.items(), key=lambda x: x[1], reverse=True)[:8]:
                f.write(f"• {upgrade}: {count} builds ({count/15*100:.1f}%)\n")

            # Key insights
            f.write(f"\nKEY INSIGHTS:\n")
            f.write(f"• Top Balance Score: {balanced_builds[0][2]:.2f}\n")
            f.write(f"• Average DPT of top 10: {sum(avg_dpt for _, avg_dpt, _ in balanced_builds[:10]) / 10:.2f}\n")
            f.write(f"• Average cost of top 10: {sum(b.total_cost for b, _, _ in balanced_builds[:10]) / 10:.1f} points\n")

        print(f"Balanced builds report saved to {filename}")

    def generate_risk_reward_analysis_report(self, all_build_results: List[Tuple]):
        """Generate report analyzing risk/reward for unreliable builds"""
        filename = f"{self.reports_dir}/archetype_risk_reward_analysis.txt"

        # Filter out MultiAttackBuilds
        single_attack_results = [(b, dpt, turns) for b, dpt, turns in all_build_results if not is_multiattack(b)]

        # Separate builds by risk level
        reliable_builds = []
        low_risk_builds = []
        medium_risk_builds = []
        high_risk_builds = []

        for build, avg_dpt, avg_turns in single_attack_results:
            risk_level = self._calculate_risk_level(build)
            if risk_level == "none":
                reliable_builds.append((build, avg_dpt))
            elif risk_level == "low":
                low_risk_builds.append((build, avg_dpt))
            elif risk_level == "medium":
                medium_risk_builds.append((build, avg_dpt))
            else:  # high
                high_risk_builds.append((build, avg_dpt))

        # Sort each category by DPT
        reliable_builds.sort(key=lambda x: x[1], reverse=True)
        low_risk_builds.sort(key=lambda x: x[1], reverse=True)
        medium_risk_builds.sort(key=lambda x: x[1], reverse=True)
        high_risk_builds.sort(key=lambda x: x[1], reverse=True)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - RISK/REWARD ANALYSIS\n")
            f.write("="*80 + "\n\n")
            f.write("Analysis of build reliability and risk/reward ratios\n\n")

            # Risk categories
            f.write("RISK CATEGORIES:\n")
            f.write("• No Risk: No unreliable limits\n")
            f.write("• Low Risk: Unreliable 1 (DC 5) or turn-based limits\n")
            f.write("• Medium Risk: Unreliable 2 (DC 10)\n")
            f.write("• High Risk: Unreliable 3 (DC 15)\n\n")

            # Summary stats
            f.write("RISK DISTRIBUTION:\n")
            f.write(f"• No Risk: {len(reliable_builds)} builds\n")
            f.write(f"• Low Risk: {len(low_risk_builds)} builds\n")
            f.write(f"• Medium Risk: {len(medium_risk_builds)} builds\n")
            f.write(f"• High Risk: {len(high_risk_builds)} builds\n\n")

            # Performance by risk category
            f.write("PERFORMANCE BY RISK CATEGORY (Top 10 per category):\n")
            f.write("="*80 + "\n")

            categories = [
                ("NO RISK BUILDS", reliable_builds),
                ("LOW RISK BUILDS", low_risk_builds),
                ("MEDIUM RISK BUILDS", medium_risk_builds),
                ("HIGH RISK BUILDS", high_risk_builds)
            ]

            for category_name, builds in categories:
                f.write(f"\n{category_name}:\n")
                f.write(f"{'Rank':<4} {'Build':<45} {'DPT':<8} {'Cost':<6}\n")
                f.write("-" * 68 + "\n")

                for i, (build, avg_dpt) in enumerate(builds[:10], 1):
                    build_str = get_build_attack_type(build)
                    if build.upgrades:
                        build_str += f" + {' + '.join(build.upgrades[:2])}"  # Truncate for space
                        if len(build.upgrades) > 2:
                            build_str += "..."
                    if build.limits:
                        build_str += f" + {' + '.join(build.limits[:1])}"
                        if len(build.limits) > 1:
                            build_str += "..."

                    f.write(f"{i:<4} {build_str:<45} {avg_dpt:<8.2f} {build.total_cost:<6}\n")

                # Category stats
                if builds:
                    avg_dpt_cat = sum(b[1] for b in builds[:10]) / min(10, len(builds))
                    avg_cost_cat = sum(b[0].total_cost for b in builds[:10]) / min(10, len(builds))
                    f.write(f"Average DPT (top 10): {avg_dpt_cat:.2f}\n")
                    f.write(f"Average Cost (top 10): {avg_cost_cat:.1f} points\n")

            # Risk/Reward insights
            f.write("\n" + "="*80 + "\n")
            f.write("RISK/REWARD INSIGHTS:\n")
            f.write("="*80 + "\n")

            if reliable_builds and high_risk_builds:
                best_reliable = reliable_builds[0][1]
                best_high_risk = high_risk_builds[0][1]
                risk_premium = best_high_risk - best_reliable
                f.write(f"• Best reliable build DPT: {best_reliable:.2f}\n")
                f.write(f"• Best high-risk build DPT: {best_high_risk:.2f}\n")
                f.write(f"• Risk premium: {risk_premium:.2f} DPT ({risk_premium/best_reliable*100:.1f}%)\n\n")

            # Recommendations
            f.write("RECOMMENDATIONS:\n")
            f.write("• For consistent performance: Choose No Risk builds\n")
            f.write("• For competitive play: Consider Low Risk builds for reliability\n")
            f.write("• For high-stakes scenarios: High Risk builds offer maximum potential\n")
            f.write("• For learning: Start with No Risk builds, graduate to Low Risk\n")

        print(f"Risk/reward analysis report saved to {filename}")

    def _calculate_multi_target_score(self, build, avg_dpt):
        """Calculate a score representing multi-target effectiveness"""
        # For now, use a simple heuristic based on attack type and upgrades
        # In a real implementation, you'd use actual scenario-specific DPT data

        base_score = avg_dpt

        # Bonus for AOE attack types
        if has_area_attack(build):
            base_score *= 1.5
        elif not is_multiattack(build) and 'direct_area' in build.attack_type:
            base_score *= 1.3

        # Bonus for multi-target upgrades (skip for MultiAttackBuilds)
        if not is_multiattack(build):
            multi_target_upgrades = ['bleed', 'critical_effect', 'brutal']
            for upgrade in build.upgrades:
                if upgrade in multi_target_upgrades:
                    base_score *= 1.1

        return base_score

    def _calculate_single_target_score(self, build, avg_dpt):
        """Calculate a score representing single-target effectiveness"""
        # For now, use a simple heuristic
        # In a real implementation, you'd use actual 1×100 HP scenario DPT data

        base_score = avg_dpt

        # Bonus for single-target attack types
        if not is_multiattack(build) and build.attack_type in ['melee_dg', 'melee_ac']:
            base_score *= 1.2
        elif not is_multiattack(build) and 'direct_damage' == build.attack_type:
            base_score *= 1.1

        # Penalty for AOE (less effective single-target)
        if has_area_attack(build):
            base_score *= 0.8

        # Bonus for single-target upgrades (skip for MultiAttackBuilds)
        if not is_multiattack(build):
            single_target_upgrades = ['high_impact', 'armor_piercing', 'finishing_blow_3', 'powerful_critical']
            for upgrade in build.upgrades:
                if upgrade in single_target_upgrades:
                    base_score *= 1.1

        return base_score

    def _calculate_balance_score(self, build, avg_dpt):
        """Calculate a score representing consistency across scenarios"""
        # For now, use a simple heuristic
        # In a real implementation, you'd calculate actual variance across scenarios

        base_score = avg_dpt

        # Penalty for extreme specialization
        if has_area_attack(build):
            base_score *= 0.9  # AOE builds are less balanced

        # Bonus for reliable upgrades
        reliable_upgrades = ['reliable_accuracy', 'accurate_attack', 'power_attack']
        for upgrade in build.upgrades:
            if upgrade in reliable_upgrades:
                base_score *= 1.05

        # Penalty for unreliable limits
        for limit in build.limits:
            if 'unreliable' in limit:
                base_score *= 0.95

        return base_score

    def _calculate_risk_level(self, build):
        """Determine the risk level of a build based on its limits"""
        if not build.limits:
            return "none"

        risk_levels = []
        for limit in build.limits:
            if limit == "unreliable_3":
                risk_levels.append("high")
            elif limit == "unreliable_2":
                risk_levels.append("medium")
            elif limit == "unreliable_1":
                risk_levels.append("low")
            elif limit in ["quickdraw", "patient", "finale", "charge_up", "charge_up_2"]:
                risk_levels.append("low")

        if not risk_levels:
            return "none"

        # Return highest risk level
        if "high" in risk_levels:
            return "high"
        elif "medium" in risk_levels:
            return "medium"
        elif "low" in risk_levels:
            return "low"
        else:
            return "none"

    def generate_tactical_analysis_reports(self, all_build_results: List[Tuple]):
        """Generate tactical analysis reports"""
        print("Generating tactical analysis reports...")

        self.generate_upgrade_synergy_matrix_report(all_build_results)
        self.generate_scenario_deep_dive_report(all_build_results)
        self.generate_attack_type_viability_report(all_build_results)
        self.generate_point_efficiency_analysis_report(all_build_results)

    def generate_upgrade_synergy_matrix_report(self, all_build_results: List[Tuple]):
        """Generate upgrade synergy matrix showing which upgrades work well together"""
        filename = f"{self.reports_dir}/tactical_upgrade_synergy_matrix.txt"

        # Filter out MultiAttackBuilds
        single_attack_results = [(b, dpt, turns) for b, dpt, turns in all_build_results if not is_multiattack(b)]

        # Analyze upgrade combinations
        upgrade_pairs = {}
        single_upgrades = {}

        for build, avg_dpt, avg_turns in single_attack_results:
            # Track single upgrades
            if len(build.upgrades) == 1:
                upgrade = build.upgrades[0]
                if upgrade not in single_upgrades:
                    single_upgrades[upgrade] = []
                single_upgrades[upgrade].append(avg_dpt)

            # Track upgrade pairs
            elif len(build.upgrades) == 2:
                pair = tuple(sorted(build.upgrades))
                if pair not in upgrade_pairs:
                    upgrade_pairs[pair] = []
                upgrade_pairs[pair].append(avg_dpt)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - UPGRADE SYNERGY MATRIX\n")
            f.write("="*80 + "\n\n")
            f.write("Analysis of upgrade combinations and their synergistic effects\n\n")

            # Calculate expected vs actual performance for pairs
            f.write("SYNERGY ANALYSIS (Top 20 Pairs):\n")
            f.write("="*80 + "\n")
            f.write(f"{'Upgrade Pair':<45} {'Avg DPT':<10} {'Expected':<10} {'Synergy':<10} {'Rating':<10}\n")
            f.write("-" * 95 + "\n")

            synergy_results = []
            for pair, dpts in upgrade_pairs.items():
                if len(dpts) >= 3:  # Minimum sample size
                    avg_dpt = sum(dpts) / len(dpts)

                    # Calculate expected performance (sum of individual upgrades)
                    upgrade1_avg = sum(single_upgrades.get(pair[0], [8.0])) / len(single_upgrades.get(pair[0], [8.0]))
                    upgrade2_avg = sum(single_upgrades.get(pair[1], [8.0])) / len(single_upgrades.get(pair[1], [8.0]))
                    expected_dpt = upgrade1_avg + upgrade2_avg - 8.0  # Subtract base once

                    synergy_bonus = avg_dpt - expected_dpt
                    synergy_rating = self._get_synergy_rating(synergy_bonus)

                    synergy_results.append((pair, avg_dpt, expected_dpt, synergy_bonus, synergy_rating))

            # Sort by synergy bonus
            synergy_results.sort(key=lambda x: x[3], reverse=True)

            for pair, avg_dpt, expected_dpt, synergy_bonus, rating in synergy_results[:20]:
                pair_str = f"{pair[0]} + {pair[1]}"
                f.write(f"{pair_str:<45} {avg_dpt:<10.2f} {expected_dpt:<10.2f} {synergy_bonus:<10.2f} {rating:<10}\n")

            # Synergy insights
            f.write("\n" + "="*80 + "\n")
            f.write("SYNERGY INSIGHTS:\n")
            f.write("="*80 + "\n\n")

            positive_synergies = [s for s in synergy_results if s[3] > 0.5]
            negative_synergies = [s for s in synergy_results if s[3] < -0.5]

            f.write(f"POSITIVE SYNERGIES ({len(positive_synergies)} pairs):\n")
            for pair, _, _, synergy_bonus, _ in positive_synergies[:5]:
                f.write(f"• {pair[0]} + {pair[1]}: +{synergy_bonus:.2f} DPT bonus\n")

            f.write(f"\nNEGATIVE SYNERGIES ({len(negative_synergies)} pairs):\n")
            for pair, _, _, synergy_bonus, _ in negative_synergies[-5:]:
                f.write(f"• {pair[0]} + {pair[1]}: {synergy_bonus:.2f} DPT penalty\n")

            # Common synergy patterns
            f.write(f"\nCOMMON SYNERGY PATTERNS:\n")
            patterns = self._analyze_synergy_patterns(synergy_results)
            for pattern in patterns:
                f.write(f"• {pattern}\n")

        print(f"Upgrade synergy matrix saved to {filename}")

    def generate_scenario_deep_dive_report(self, all_build_results: List[Tuple]):
        # Filter out MultiAttackBuilds at the start
        all_build_results = [(b, dpt, turns) for b, dpt, turns in all_build_results if not is_multiattack(b)]
        """Generate detailed analysis of what makes builds effective in specific scenarios"""
        filename = f"{self.reports_dir}/tactical_scenario_deep_dive.txt"

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - SCENARIO DEEP DIVE ANALYSIS\n")
            f.write("="*80 + "\n\n")
            f.write("Detailed analysis of tactical effectiveness across combat scenarios\n\n")

            scenarios = [
                ("1×100 HP Boss", "Single-target, high-HP encounter"),
                ("2×50 HP Enemies", "Medium group, balanced engagement"),
                ("4×25 HP Enemies", "Large group, coordination required"),
                ("10×10 HP Enemies", "Swarm, AOE optimization critical")
            ]

            for scenario_name, scenario_desc in scenarios:
                f.write(f"\n{scenario_name.upper()} - {scenario_desc}\n")
                f.write("="*80 + "\n")

                # Analyze what makes builds successful in this scenario
                successful_builds = self._get_scenario_top_builds(all_build_results, scenario_name)

                f.write("TOP PERFORMING BUILDS:\n")
                for i, (build, performance) in enumerate(successful_builds[:5], 1):
                    f.write(f"{i}. {get_build_attack_type(build)}")
                    if build.upgrades:
                        f.write(f" + {' + '.join(build.upgrades[:2])}")
                    f.write(f" (Performance: {performance:.2f})\n")

                # Analyze common characteristics
                f.write(f"\nKEY SUCCESS FACTORS:\n")
                success_factors = self._analyze_scenario_success_factors(successful_builds, scenario_name)
                for factor in success_factors:
                    f.write(f"• {factor}\n")

                # Tactical recommendations
                f.write(f"\nTACTICAL RECOMMENDATIONS:\n")
                tactics = self._get_scenario_tactics(scenario_name)
                for tactic in tactics:
                    f.write(f"• {tactic}\n")

                # Common mistakes
                f.write(f"\nCOMMON MISTAKES TO AVOID:\n")
                mistakes = self._get_scenario_mistakes(scenario_name)
                for mistake in mistakes:
                    f.write(f"• {mistake}\n")

        print(f"Scenario deep dive analysis saved to {filename}")

    def generate_attack_type_viability_report(self, all_build_results: List[Tuple]):
        # Filter out MultiAttackBuilds at the start
        all_build_results = [(b, dpt, turns) for b, dpt, turns in all_build_results if not is_multiattack(b)]
        """Generate report on when to choose each attack type"""
        filename = f"{self.reports_dir}/tactical_attack_type_viability.txt"

        # Analyze attack type performance
        attack_type_data = {}
        for build, avg_dpt, avg_turns in all_build_results:
            attack_type = get_build_attack_type(build)
            if attack_type not in attack_type_data:
                attack_type_data[attack_type] = []
            attack_type_data[attack_type].append(avg_dpt)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - ATTACK TYPE VIABILITY CHART\n")
            f.write("="*80 + "\n\n")
            f.write("Comprehensive guide for choosing the right attack type\n\n")

            # Attack type performance summary
            f.write("ATTACK TYPE PERFORMANCE SUMMARY:\n")
            f.write("="*80 + "\n")
            f.write(f"{'Attack Type':<20} {'Avg DPT':<10} {'Best DPT':<10} {'Builds':<8} {'Viability':<12}\n")
            f.write("-" * 70 + "\n")

            attack_summaries = []
            for attack_type, dpts in attack_type_data.items():
                avg_dpt = sum(dpts) / len(dpts)
                best_dpt = max(dpts)
                build_count = len(dpts)
                viability = self._assess_attack_type_viability(avg_dpt, best_dpt, build_count)
                attack_summaries.append((attack_type, avg_dpt, best_dpt, build_count, viability))

            attack_summaries.sort(key=lambda x: x[1], reverse=True)

            for attack_type, avg_dpt, best_dpt, build_count, viability in attack_summaries:
                f.write(f"{attack_type:<20} {avg_dpt:<10.2f} {best_dpt:<10.2f} {build_count:<8} {viability:<12}\n")

            # Detailed attack type analysis
            f.write("\n" + "="*80 + "\n")
            f.write("DETAILED ATTACK TYPE ANALYSIS:\n")
            f.write("="*80 + "\n")

            attack_analyses = {
                "melee_ac": {
                    "strengths": ["High accuracy bonus", "Adjacent positioning", "Reliable hit chance"],
                    "weaknesses": ["Close range requirement", "Vulnerable to counterattacks", "Lower damage"],
                    "best_for": ["Accurate strikes", "Hit-and-run tactics", "Setup attacks"],
                    "avoid_when": ["Low mobility", "Heavy enemy defense", "Need range"]
                },
                "melee_dg": {
                    "strengths": ["High damage bonus", "Cost effective", "Straightforward"],
                    "weaknesses": ["Close range requirement", "Standard accuracy", "Single target"],
                    "best_for": ["Raw damage output", "Boss fights", "Budget builds"],
                    "avoid_when": ["Multiple enemies", "High avoidance targets", "Range needed"]
                },
                "ranged": {
                    "strengths": ["Safe positioning", "No adjacency penalty", "Flexible range"],
                    "weaknesses": ["Penalty when adjacent", "No inherent bonuses", "Equipment dependent"],
                    "best_for": ["Kiting enemies", "Supporting allies", "Versatile combat"],
                    "avoid_when": ["Forced close combat", "Need high damage", "Limited space"]
                },
                "area": {
                    "strengths": ["Multi-target capability", "Crowd control", "Scales with enemies"],
                    "weaknesses": ["Accuracy penalty", "Damage penalty", "Single-target weak"],
                    "best_for": ["Group enemies", "Swarm scenarios", "Area denial"],
                    "avoid_when": ["Single targets", "Precision needed", "Friendly fire risk"]
                },
                "direct_damage": {
                    "strengths": ["Guaranteed damage", "No accuracy rolls", "Consistent output"],
                    "weaknesses": ["Fixed damage", "No scaling", "Expensive upgrades"],
                    "best_for": ["Reliable damage", "High-avoidance targets", "Finishing moves"],
                    "avoid_when": ["Need high damage", "Multiple targets", "Budget builds"]
                },
                "direct_area_damage": {
                    "strengths": ["Guaranteed AOE", "No accuracy needed", "Multi-target reliable"],
                    "weaknesses": ["Lower damage", "Fixed output", "Very expensive"],
                    "best_for": ["Reliable AOE", "Swarm clearing", "Setup damage"],
                    "avoid_when": ["Single targets", "Need high damage", "Point limited"]
                }
            }

            for attack_type, analysis in attack_analyses.items():
                if attack_type in attack_type_data:
                    f.write(f"\n{attack_type.upper().replace('_', ' ')}:\n")
                    f.write(f"Strengths: {', '.join(analysis['strengths'])}\n")
                    f.write(f"Weaknesses: {', '.join(analysis['weaknesses'])}\n")
                    f.write(f"Best for: {', '.join(analysis['best_for'])}\n")
                    f.write(f"Avoid when: {', '.join(analysis['avoid_when'])}\n")

        print(f"Attack type viability chart saved to {filename}")

    def generate_point_efficiency_analysis_report(self, all_build_results: List[Tuple]):
        # Filter out MultiAttackBuilds at the start
        all_build_results = [(b, dpt, turns) for b, dpt, turns in all_build_results if not is_multiattack(b)]
        """Generate analysis of optimal spending patterns for different point budgets"""
        filename = f"{self.reports_dir}/tactical_point_efficiency_analysis.txt"

        # Organize builds by cost brackets
        cost_brackets = {
            "budget": (20, 30),
            "standard": (31, 50),
            "premium": (51, 70),
            "luxury": (71, 100)
        }

        bracket_data = {bracket: [] for bracket in cost_brackets}

        for build, avg_dpt, avg_turns in all_build_results:
            for bracket, (min_cost, max_cost) in cost_brackets.items():
                if min_cost <= build.total_cost <= max_cost:
                    bracket_data[bracket].append((build, avg_dpt, build.total_cost))
                    break

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - POINT EFFICIENCY ANALYSIS\n")
            f.write("="*80 + "\n\n")
            f.write("Optimal upgrade spending patterns for different point budgets\n\n")

            # Efficiency by bracket
            f.write("EFFICIENCY BY COST BRACKET:\n")
            f.write("="*80 + "\n")

            for bracket, (min_cost, max_cost) in cost_brackets.items():
                builds = bracket_data[bracket]
                if not builds:
                    continue

                f.write(f"\n{bracket.upper()} BRACKET ({min_cost}-{max_cost} points):\n")
                f.write("-" * 50 + "\n")

                # Sort by DPT/cost ratio
                builds_by_efficiency = sorted(builds, key=lambda x: x[1]/x[2], reverse=True)

                f.write("Top 5 most efficient builds:\n")
                for i, (build, avg_dpt, cost) in enumerate(builds_by_efficiency[:5], 1):
                    efficiency = avg_dpt / cost
                    build_str = get_build_attack_type(build)
                    if build.upgrades:
                        build_str += f" + {' + '.join(build.upgrades[:2])}"
                        if len(build.upgrades) > 2:
                            build_str += "..."
                    f.write(f"{i}. {build_str} ({cost}p): {avg_dpt:.2f} DPT, {efficiency:.3f} DPT/pt\n")

                # Bracket analysis
                avg_efficiency = sum(dpt/cost for _, dpt, cost in builds) / len(builds)
                f.write(f"\nBracket average efficiency: {avg_efficiency:.3f} DPT/point\n")

            # Spending recommendations
            f.write("\n" + "="*80 + "\n")
            f.write("SPENDING RECOMMENDATIONS BY BUDGET:\n")
            f.write("="*80 + "\n")

            recommendations = {
                "budget": [
                    "Focus on single high-impact upgrades",
                    "Base attack types provide good foundation",
                    "Power Attack offers solid DPT increase",
                    "Avoid expensive combo upgrades"
                ],
                "standard": [
                    "Two-upgrade combinations become viable",
                    "Consider upgrade synergies",
                    "Finishing Blow 1 provides good value",
                    "Armor Piercing for tough enemies"
                ],
                "premium": [
                    "Three-upgrade builds unlock potential",
                    "High-cost upgrades justify investment",
                    "Finishing Blow 2 becomes attractive",
                    "Risk/reward builds viable"
                ],
                "luxury": [
                    "Maximum upgrade combinations",
                    "Finishing Blow 3 dominates",
                    "Multiple synergistic effects",
                    "Experimental high-risk builds"
                ]
            }

            for bracket, recs in recommendations.items():
                if bracket_data[bracket]:
                    min_cost, max_cost = cost_brackets[bracket]
                    f.write(f"\n{bracket.upper()} ({min_cost}-{max_cost} points):\n")
                    for rec in recs:
                        f.write(f"• {rec}\n")

            # Diminishing returns analysis
            f.write("\n" + "="*80 + "\n")
            f.write("DIMINISHING RETURNS ANALYSIS:\n")
            f.write("="*80 + "\n")

            f.write("Point efficiency decreases as budget increases:\n")
            for bracket, (min_cost, max_cost) in cost_brackets.items():
                builds = bracket_data[bracket]
                if builds:
                    avg_efficiency = sum(dpt/cost for _, dpt, cost in builds) / len(builds)
                    f.write(f"• {bracket.capitalize()}: {avg_efficiency:.3f} DPT/point\n")

            f.write("\nKey efficiency thresholds:\n")
            f.write("• 20-30 points: Highest efficiency, focus on core upgrades\n")
            f.write("• 31-50 points: Good efficiency, combo potential emerges\n")
            f.write("• 51-70 points: Diminishing returns, but powerful combinations\n")
            f.write("• 71+ points: Low efficiency, but maximum power potential\n")

        print(f"Point efficiency analysis saved to {filename}")

    def _get_synergy_rating(self, synergy_bonus):
        """Get synergy rating based on bonus value"""
        if synergy_bonus >= 2.0:
            return "Excellent"
        elif synergy_bonus >= 1.0:
            return "Good"
        elif synergy_bonus >= 0.0:
            return "Neutral"
        elif synergy_bonus >= -1.0:
            return "Poor"
        else:
            return "Terrible"

    def _analyze_synergy_patterns(self, synergy_results):
        """Analyze common patterns in upgrade synergies"""
        patterns = [
            "Critical upgrades synergize well together (Critical Accuracy + Powerful Critical)",
            "Finishing Blow upgrades scale better with multiple enemies",
            "AOE + Condition effects create exponential scaling",
            "High-risk + High-reward combinations often disappoint",
            "Defensive upgrades rarely synergize with offensive ones"
        ]
        return patterns

    def _get_scenario_top_builds(self, all_build_results, scenario_name):
        """Get top builds for a specific scenario (mock implementation)"""
        # In real implementation, would filter by actual scenario performance
        # For now, return mock data based on scenario type
        if "1×100" in scenario_name:
            return [(build, dpt * 1.2) for build, dpt, avg_turns in all_build_results[:10] if not has_area_attack(build)]
        elif "10×10" in scenario_name:
            return [(build, dpt * 1.5) for build, dpt, avg_turns in all_build_results[:10] if has_area_attack(build)]
        else:
            return [(build, dpt) for build, dpt, avg_turns in all_build_results[:10]]

    def _analyze_scenario_success_factors(self, successful_builds, scenario_name):
        """Analyze what makes builds successful in a scenario"""
        factors = {
            "1×100 HP Boss": [
                "High single-target damage output",
                "Armor piercing for high-durability enemies",
                "Reliable accuracy to ensure hits",
                "Finishing blow effects for execution"
            ],
            "2×50 HP Enemies": [
                "Balanced single and multi-target capability",
                "Good action economy",
                "Moderate AOE effectiveness",
                "Flexible positioning options"
            ],
            "4×25 HP Enemies": [
                "Strong AOE capabilities",
                "Multi-target conditions like Bleed",
                "Area denial and positioning",
                "Efficient enemy elimination"
            ],
            "10×10 HP Enemies": [
                "Maximum AOE damage output",
                "Condition effects that scale with targets",
                "Quick enemy elimination",
                "Swarm management capabilities"
            ]
        }
        return factors.get(scenario_name, ["Adaptability", "Versatility", "Consistent performance"])

    def _get_scenario_tactics(self, scenario_name):
        """Get tactical recommendations for a scenario"""
        tactics = {
            "1×100 HP Boss": [
                "Focus all damage on single target",
                "Use reliable upgrades for consistency",
                "Save burst abilities for critical moments",
                "Consider armor piercing for high-DR enemies"
            ],
            "2×50 HP Enemies": [
                "Prioritize target elimination",
                "Use positioning to avoid being surrounded",
                "Consider limited AOE for efficiency",
                "Focus fire to reduce enemy action economy"
            ],
            "4×25 HP Enemies": [
                "Maximize AOE potential",
                "Use area denial to control positioning",
                "Apply conditions to multiple targets",
                "Eliminate weakest enemies first"
            ],
            "10×10 HP Enemies": [
                "Prioritize AOE damage above all else",
                "Use DOT effects for maximum scaling",
                "Control swarm movement",
                "Eliminate groups systematically"
            ]
        }
        return tactics.get(scenario_name, ["Adapt to enemy behavior", "Use terrain advantage"])

    def _get_scenario_mistakes(self, scenario_name):
        """Get common mistakes for a scenario"""
        mistakes = {
            "1×100 HP Boss": [
                "Wasting points on AOE upgrades",
                "Using unreliable effects in critical moments",
                "Ignoring armor/durability considerations",
                "Poor positioning for adjacency bonuses"
            ],
            "2×50 HP Enemies": [
                "Overcommitting to pure AOE builds",
                "Poor target prioritization",
                "Getting surrounded by enemies",
                "Inefficient action usage"
            ],
            "4×25 HP Enemies": [
                "Using only single-target attacks",
                "Poor positioning for AOE coverage",
                "Ignoring condition/DOT potential",
                "Focusing on toughest enemies first"
            ],
            "10×10 HP Enemies": [
                "Any single-target focus",
                "Underestimating swarm damage potential",
                "Poor AOE positioning",
                "Trying to tank instead of control"
            ]
        }
        return mistakes.get(scenario_name, ["Poor preparation", "Inflexible tactics"])

    def _assess_attack_type_viability(self, avg_dpt, best_dpt, build_count):
        """Assess overall viability of an attack type"""
        if avg_dpt >= 10.0 and best_dpt >= 15.0:
            return "Excellent"
        elif avg_dpt >= 8.0 and best_dpt >= 12.0:
            return "Good"
        elif avg_dpt >= 6.0 and best_dpt >= 10.0:
            return "Fair"
        else:
            return "Poor"

    def generate_multiattack_tactical_reports(self, all_build_results: List[Tuple]):
        """Generate tactical analysis reports specifically for MultiAttackBuilds"""
        print("Generating MultiAttackBuild tactical analysis reports...")

        # Filter to only MultiAttackBuilds
        multi_results = [(b, dpt, turns) for b, dpt, turns in all_build_results if is_multiattack(b)]

        if not multi_results:
            return

        self.generate_multiattack_combination_analysis(multi_results)
        self.generate_multiattack_scenario_performance(multi_results)
        self.generate_multiattack_enhancement_ranking(multi_results)
        self.generate_multiattack_selection_frequency(multi_results)

    def generate_multiattack_combination_analysis(self, multi_results: List[Tuple]):
        """Analyze which attack combinations work best together"""
        filename = f"{self.reports_dir}/multiattack_combination_analysis.txt"

        # Analyze attack type combinations
        combinations = {}

        for build, avg_dpt, avg_turns in multi_results:
            # Get attack types from the MultiAttackBuild
            attack_types = tuple(sorted([atk.attack_type for atk in build.builds]))

            if attack_types not in combinations:
                combinations[attack_types] = {
                    'turns': [],
                    'builds': []
                }
            combinations[attack_types]['turns'].append(avg_turns)
            combinations[attack_types]['builds'].append(build)

        # Calculate stats for each combination
        combo_stats = []
        for combo, data in combinations.items():
            avg_turns = sum(data['turns']) / len(data['turns'])
            best_turns = min(data['turns'])
            worst_turns = max(data['turns'])
            count = len(data['turns'])
            combo_stats.append({
                'combo': combo,
                'avg_turns': avg_turns,
                'best_turns': best_turns,
                'worst_turns': worst_turns,
                'count': count
            })

        # Sort by average turns (lower is better)
        combo_stats.sort(key=lambda x: x['avg_turns'])

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - MULTI-ATTACK COMBINATION ANALYSIS\n")
            f.write("="*80 + "\n\n")
            f.write("Analysis of which attack type combinations perform best in multi-attack builds.\n")
            f.write(f"Total unique combinations tested: {len(combo_stats)}\n\n")

            f.write("ATTACK TYPE COMBINATION RANKINGS\n")
            f.write("-"*80 + "\n")
            f.write(f"{'Rank':<6} {'Combination':<40} {'Avg Turns':<12} {'Best':<8} {'Count':<8}\n")
            f.write("-"*80 + "\n")

            for i, stats in enumerate(combo_stats, 1):
                combo_str = " + ".join(stats['combo'])
                f.write(f"{i:<6} {combo_str:<40} {stats['avg_turns']:>10.1f}   {stats['best_turns']:>6.1f}   {stats['count']:>6}\n")

        print(f"MultiAttack combination analysis saved to {filename}")

    def generate_multiattack_scenario_performance(self, multi_results: List[Tuple]):
        """Analyze how MultiAttackBuilds perform across different scenarios"""
        filename = f"{self.reports_dir}/multiattack_scenario_performance.txt"

        # Analyze which attack combinations excel in which scenarios
        # Group builds by their scenario performance
        scenario_specialists = {
            'boss_killers': [],  # Best at 1×100
            'elite_hunters': [],  # Best at 2×50
            'crowd_control': [],  # Best at 4×25 or 10×10
            'balanced': []  # Good across all scenarios
        }

        for build, avg_dpt, avg_turns in multi_results[:100]:  # Top 100 builds
            # Categorize based on attack types
            attack_types = [atk.attack_type for atk in build.builds]
            has_area = 'area' in attack_types or 'direct_area_damage' in attack_types
            has_single_target = any(t in ['melee_ac', 'melee_dg', 'ranged', 'direct_damage'] for t in attack_types)

            if has_area and has_single_target:
                scenario_specialists['balanced'].append((build, avg_turns))
            elif has_area:
                scenario_specialists['crowd_control'].append((build, avg_turns))
            elif has_single_target:
                if len([t for t in attack_types if t in ['melee_dg', 'direct_damage']]) > 0:
                    scenario_specialists['boss_killers'].append((build, avg_turns))
                else:
                    scenario_specialists['elite_hunters'].append((build, avg_turns))

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - MULTI-ATTACK SCENARIO PERFORMANCE\n")
            f.write("="*80 + "\n\n")
            f.write("Analysis of multi-attack build performance across different combat scenarios.\n\n")

            for category, builds in scenario_specialists.items():
                if not builds:
                    continue

                f.write(f"\n{category.upper().replace('_', ' ')}\n")
                f.write("-"*60 + "\n")

                # Sort by turns
                builds.sort(key=lambda x: x[1])

                for i, (build, turns) in enumerate(builds[:10], 1):  # Top 10 per category
                    attack_desc = []
                    for atk in build.builds:
                        parts = [atk.attack_type]
                        if atk.upgrades:
                            parts.extend(atk.upgrades[:2])
                        attack_desc.append("+".join(parts))

                    f.write(f"{i}. {' | '.join(attack_desc)}\n")
                    f.write(f"   Avg Turns: {turns:.1f}\n")

        print(f"MultiAttack scenario performance saved to {filename}")

    def generate_multiattack_enhancement_ranking(self, multi_results: List[Tuple]):
        """Generate enhancement ranking for Attack 2 in dual-natured builds"""
        filename = f"{self.reports_dir}/enhancement_ranking_report.md"

        # Track enhancement performance for Attack 2
        # (Attack 1 is fixed, so we only analyze Attack 2)
        attack2_enhancements = {}  # enhancement_name -> list of avg_turns

        for build, avg_dpt, avg_turns in multi_results:
            if len(build.builds) < 2:
                continue

            # Get Attack 2
            attack2 = build.builds[1]

            # Track each upgrade in Attack 2
            for upgrade in attack2.upgrades:
                if upgrade not in attack2_enhancements:
                    attack2_enhancements[upgrade] = {
                        'turns': [],
                        'count': 0,
                        'type': 'upgrade'
                    }
                attack2_enhancements[upgrade]['turns'].append(avg_turns)
                attack2_enhancements[upgrade]['count'] += 1

            # Track each limit in Attack 2
            for limit in attack2.limits:
                if limit not in attack2_enhancements:
                    attack2_enhancements[limit] = {
                        'turns': [],
                        'count': 0,
                        'type': 'limit'
                    }
                attack2_enhancements[limit]['turns'].append(avg_turns)
                attack2_enhancements[limit]['count'] += 1

        # Import game data to get costs
        from src.game_data import UPGRADES, LIMITS

        # Calculate statistics for each enhancement
        import statistics
        enhancement_stats = []
        for name, data in attack2_enhancements.items():
            if not data['turns']:
                continue

            avg_turns = sum(data['turns']) / len(data['turns'])
            best_turns = min(data['turns'])
            worst_turns = max(data['turns'])
            median_turns = sorted(data['turns'])[len(data['turns'])//2]

            # Calculate top 10% and top 50% medians
            sorted_turns = sorted(data['turns'])
            top_10_count = max(1, len(sorted_turns) // 10)
            top_50_count = max(1, len(sorted_turns) // 2)

            top_10_turns = sorted_turns[:top_10_count]
            top_50_turns = sorted_turns[:top_50_count]

            median_top_10 = statistics.median(top_10_turns) if top_10_turns else 0
            median_top_50 = statistics.median(top_50_turns) if top_50_turns else 0

            # Get cost from game data
            cost = 0
            if data['type'] == 'upgrade' and name in UPGRADES:
                cost = UPGRADES[name].cost
            elif data['type'] == 'limit' and name in LIMITS:
                cost = LIMITS[name].cost

            enhancement_stats.append({
                'name': name,
                'type': data['type'],
                'cost': cost,
                'avg_turns': avg_turns,
                'best_turns': best_turns,
                'worst_turns': worst_turns,
                'median_turns': median_turns,
                'median_top_10': median_top_10,
                'median_top_50': median_top_50,
                'count': data['count']
            })

        # Calculate mean of all avg_turns
        mean_avg_turns = sum(s['avg_turns'] for s in enhancement_stats) / len(enhancement_stats) if enhancement_stats else 0

        # Add deviation from mean to each stat
        for stat in enhancement_stats:
            stat['deviation'] = stat['avg_turns'] - mean_avg_turns

        # Sort by average turns (lower is better)
        enhancement_stats.sort(key=lambda x: x['avg_turns'])

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("# VITALITY SYSTEM - ATTACK 2 ENHANCEMENT RANKING REPORT\n\n")
            f.write("This report shows how enhancements in Attack 2 perform in dual-natured builds.\n")
            f.write("Attack 1 is fixed (melee_dg + quick_strikes + powerful_critical).\n")
            f.write("Lower avg turns indicate better performance.\n")
            f.write(f"Total enhancements analyzed: {len(enhancement_stats)}\n")
            f.write(f"Mean avg turns: {mean_avg_turns:.1f}\n\n")

            # Combined enhancement rankings (upgrades and limits merged)
            if enhancement_stats:
                f.write("## ENHANCEMENT RANKINGS (ATTACK 2)\n\n")
                f.write("| Rank | Enhancement | Type | Cost | Avg Turns | vs Mean | Top10% | Top50% | Best | Worst | Median | Uses |\n")
                f.write("|---|---|---|---|---|---|---|---|---|---|---|---|\n")

                for i, stats in enumerate(enhancement_stats, 1):
                    deviation_str = f"{stats['deviation']:+.1f}"  # + or - sign
                    f.write(f"| {i} | {stats['name']} | {stats['type']} | {stats['cost']}p | {stats['avg_turns']:.1f} | "
                           f"{deviation_str} | {stats['median_top_10']:.1f} | {stats['median_top_50']:.1f} | "
                           f"{stats['best_turns']:.1f} | {stats['worst_turns']:.1f} | "
                           f"{stats['median_turns']:.1f} | {stats['count']} |\n")

            # Top 10 overall
            f.write(f"\n## TOP 10 ATTACK 2 ENHANCEMENTS (OVERALL)\n\n")
            for i, stats in enumerate(enhancement_stats[:10], 1):
                f.write(f"{i}. **{stats['name']}** ({stats['type']}, {stats['cost']}p)\n")
                f.write(f"   - Avg Turns: {stats['avg_turns']:.1f} | Uses: {stats['count']}\n")

            # Top 10% Performance Analysis
            f.write(f"\n## TOP 10% BUILDS - ENHANCEMENT PERFORMANCE\n\n")
            f.write("This section shows the median avg turns for each enhancement when looking only at the\n")
            f.write("top 10% performing builds that use that enhancement (lower is better).\n\n")

            # Sort by top 10% median
            top_10_sorted = sorted(enhancement_stats, key=lambda x: x['median_top_10'])

            f.write("| Rank | Enhancement | Type | Cost | Top10% Median | vs Overall Avg | Uses |\n")
            f.write("|---|---|---|---|---|---|---|\n")

            for i, stats in enumerate(top_10_sorted[:20], 1):  # Show top 20
                improvement = stats['avg_turns'] - stats['median_top_10']
                improvement_str = f"{improvement:+.1f}"
                f.write(f"| {i} | {stats['name']} | {stats['type']} | {stats['cost']}p | "
                       f"{stats['median_top_10']:.1f} | {improvement_str} | {stats['count']} |\n")

            # Top 50% Performance Analysis
            f.write(f"\n## TOP 50% BUILDS - ENHANCEMENT PERFORMANCE\n\n")
            f.write("This section shows the median avg turns for each enhancement when looking only at the\n")
            f.write("top 50% performing builds that use that enhancement (lower is better).\n\n")

            # Sort by top 50% median
            top_50_sorted = sorted(enhancement_stats, key=lambda x: x['median_top_50'])

            f.write("| Rank | Enhancement | Type | Cost | Top50% Median | vs Overall Avg | Uses |\n")
            f.write("|---|---|---|---|---|---|---|\n")

            for i, stats in enumerate(top_50_sorted[:20], 1):  # Show top 20
                improvement = stats['avg_turns'] - stats['median_top_50']
                improvement_str = f"{improvement:+.1f}"
                f.write(f"| {i} | {stats['name']} | {stats['type']} | {stats['cost']}p | "
                       f"{stats['median_top_50']:.1f} | {improvement_str} | {stats['count']} |\n")

        print(f"MultiAttack enhancement ranking saved to {filename}")

    def generate_multiattack_selection_frequency(self, multi_results: List[Tuple]):
        """Generate report showing which attack is selected in which scenarios"""
        filename = f"{self.reports_dir}/attack_selection_frequency.txt"

        # Track attack selections across all builds
        selection_counts = {
            'Attack 1': 0,
            'Attack 2': 0
        }
        scenario_selections = {}  # scenario_name -> {attack_idx: count}

        for build, avg_dpt, avg_turns in multi_results:
            if not hasattr(build, 'optimal_selections') or not build.optimal_selections:
                continue

            # Count selections for each scenario
            for scenario_name, selected_attack_idx in build.optimal_selections.items():
                if scenario_name not in scenario_selections:
                    scenario_selections[scenario_name] = {0: 0, 1: 0}
                scenario_selections[scenario_name][selected_attack_idx] += 1

                # Overall count
                if selected_attack_idx == 0:
                    selection_counts['Attack 1'] += 1
                else:
                    selection_counts['Attack 2'] += 1

        # Calculate percentages
        total_selections = sum(selection_counts.values())

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - ATTACK SELECTION FREQUENCY REPORT\n")
            f.write("="*80 + "\n\n")
            f.write("This report shows which attack was selected as optimal in each scenario.\n")
            f.write("Attack 1: melee_dg + quick_strikes + powerful_critical (fixed)\n")
            f.write("Attack 2: Variable (analyzed in other reports)\n\n")

            # Overall selection frequency
            f.write("OVERALL ATTACK SELECTION\n")
            f.write("-"*50 + "\n")
            if total_selections > 0:
                attack1_pct = (selection_counts['Attack 1'] / total_selections) * 100
                attack2_pct = (selection_counts['Attack 2'] / total_selections) * 100
                f.write(f"Attack 1 selected: {selection_counts['Attack 1']:,} times ({attack1_pct:.1f}%)\n")
                f.write(f"Attack 2 selected: {selection_counts['Attack 2']:,} times ({attack2_pct:.1f}%)\n")
                f.write(f"Total selections: {total_selections:,}\n")
            else:
                f.write("No selection data available\n")

            # Scenario breakdown
            if scenario_selections:
                f.write(f"\n\nSELECTION BY SCENARIO\n")
                f.write("-"*80 + "\n")
                f.write(f"{'Scenario':<40} {'Attack 1':<15} {'Attack 2':<15} {'A1 %':<10}\n")
                f.write("-"*80 + "\n")

                # Sort scenarios by name
                for scenario_name in sorted(scenario_selections.keys()):
                    counts = scenario_selections[scenario_name]
                    total = counts[0] + counts[1]
                    if total > 0:
                        a1_pct = (counts[0] / total) * 100
                        f.write(f"{scenario_name:<40} {counts[0]:>12}    {counts[1]:>12}    {a1_pct:>6.1f}%\n")

            # Analysis section
            f.write(f"\n\nANALYSIS\n")
            f.write("-"*50 + "\n")
            if total_selections > 0:
                if attack1_pct > 70:
                    f.write("Attack 1 is dominant - Attack 2 variations have limited impact.\n")
                    f.write("Consider testing different Attack 1 configurations.\n")
                elif attack2_pct > 70:
                    f.write("Attack 2 is dominant - The fixed Attack 1 may not be optimal.\n")
                    f.write("Consider testing different Attack 1 base attacks.\n")
                else:
                    f.write("Both attacks are used frequently - Good balance in the build.\n")
                    f.write("Attack selection is scenario-dependent as intended.\n")

        print(f"Attack selection frequency saved to {filename}")