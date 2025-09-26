"""
Comprehensive upgrade balance analysis for the Vitality System combat simulator.

This module provides multi-dimensional analysis to identify overpowered, underpowered,
and situationally imbalanced upgrades across different combat scenarios.
"""

import json
import os
import statistics
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
from models import Character, AttackBuild, SimulationConfig
from simulation import run_simulation_batch
from game_data import UPGRADES, LIMITS, ATTACK_TYPES
from reporting import generate_upgrade_performance_report


class BalanceTier(Enum):
    """Balance tier classifications for upgrades"""
    S_TIER = "S"  # Overpowered - dominates multiple scenarios
    A_TIER = "A"  # Strong - good across most metrics
    B_TIER = "B"  # Balanced - moderate performance with clear use cases
    C_TIER = "C"  # Niche - strong in specific scenarios but weak overall
    D_TIER = "D"  # Underpowered - poor across most metrics


@dataclass
class ScenarioWeights:
    """Configurable weights for different combat scenarios"""
    single_target: float = 0.30    # 1×100 HP Boss
    medium_group: float = 0.30     # 2×50 HP Enemies
    large_group: float = 0.25      # 4×25 HP Enemies
    swarm: float = 0.15           # 10×10 HP Enemies

    def __post_init__(self):
        total = self.single_target + self.medium_group + self.large_group + self.swarm
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Scenario weights must sum to 1.0, got {total}")


@dataclass
class PerformanceMetrics:
    """Core performance metrics for an upgrade"""
    cost: int
    avg_dpt_improvement: float
    cost_efficiency: float  # DPT improvement per point
    scenario_dpts: Dict[str, float]  # DPT improvement by scenario
    attack_type_dpts: Dict[str, float]  # DPT improvement by attack type
    consistency_index: float  # Lower = more consistent across scenarios
    versatility_score: float  # How well it performs across different contexts
    peak_performance: float  # Best-case scenario DPT improvement
    usage_rate: float  # Appearance rate in top builds
    percentile_rank: float  # Average build ranking percentile


@dataclass
class BalanceAnalysis:
    """Comprehensive balance analysis results for an upgrade"""
    name: str
    metrics: PerformanceMetrics
    balance_score: float  # Unified 0-100 balance score
    tier: BalanceTier
    balance_issues: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)


class BalanceAnalyzer:
    """Main class for performing comprehensive balance analysis"""

    def __init__(self, config: SimulationConfig, scenario_weights: Optional[ScenarioWeights] = None, reports_dir: str = "reports"):
        self.config = config
        self.reports_dir = reports_dir
        self.weights = scenario_weights or ScenarioWeights()
        self.scenario_names = [
            "1×100 HP Boss",
            "2×50 HP Enemies",
            "4×25 HP Enemies",
            "10×10 HP Enemies"
        ]
        self.fight_scenarios = [
            (1, 100),   # Single target
            (2, 50),    # Medium group
            (4, 25),    # Large group
            (10, 10)    # Swarm
        ]

    def analyze_all_components(self, build_results: List[Tuple] = None,
                           scenario_data: Dict[str, Dict] = None) -> Dict[str, BalanceAnalysis]:
        """Perform comprehensive analysis of all upgrades and limits"""
        print("Starting comprehensive balance analysis...")

        # Get enhancement performance data
        enhancement_results = generate_upgrade_performance_report(self.config)

        # Parse scenario breakdown data if not provided
        if scenario_data is None:
            scenario_data = self._parse_scenario_breakdown_data()

        # Calculate usage rates if build results provided
        usage_rates = {}
        percentile_ranks = {}
        if build_results:
            usage_rates, percentile_ranks = self._calculate_usage_and_percentiles(build_results)

        analyses = {}

        # Analyze enhancements (both upgrades and limits)
        for enhancement_name, enhancement_data in enhancement_results.items():
            print(f"  Analyzing {enhancement_name}...")

            # Calculate performance metrics with scenario data
            metrics = self._calculate_performance_metrics(
                enhancement_name,
                enhancement_data,
                usage_rates.get(enhancement_name, 0.0),
                percentile_ranks.get(enhancement_name, 50.0),
                scenario_data.get(enhancement_name, {})
            )

            # Perform balance analysis
            analysis = self._analyze_upgrade_balance(enhancement_name, metrics)
            analyses[enhancement_name] = analysis

        return analyses

    def _calculate_performance_metrics(self, component_name: str, component_data: Dict,
                                     usage_rate: float, percentile_rank: float,
                                     scenario_data: Dict = None) -> PerformanceMetrics:
        """Calculate comprehensive performance metrics for an upgrade or limit"""

        # Extract attack type performance data
        attack_type_dpts = {}
        for attack_type, attack_data in component_data['attack_type_results'].items():
            attack_type_dpts[attack_type] = attack_data['avg_improvement']

        # Extract scenario performance data if available
        scenario_dpts = {}
        scenario_values = []

        if scenario_data:
            # Parse scenario data for this upgrade
            for scenario_name, scenario_value in scenario_data.items():
                if isinstance(scenario_value, (int, float)):
                    scenario_dpts[scenario_name] = scenario_value
                    scenario_values.append(scenario_value)
        else:
            # Fall back to attack type data for scenario analysis
            scenario_values = list(attack_type_dpts.values())

        # Calculate scenario-weighted DPT improvement
        weighted_dpt = self._calculate_weighted_scenario_performance(scenario_dpts)

        # Calculate consistency index (standard deviation of performance across scenarios/attack types)
        consistency_index = statistics.stdev(scenario_values) if len(scenario_values) > 1 else 0.0

        # Calculate versatility score (fraction of attack types that benefit significantly)
        positive_improvements = sum(1 for dpt in attack_type_dpts.values() if dpt > 0.5)
        versatility_score = positive_improvements / len(attack_type_dpts) if attack_type_dpts else 0.0

        # Peak performance is the best single scenario/attack type combination
        all_values = list(attack_type_dpts.values()) + list(scenario_dpts.values())
        peak_performance = max(all_values) if all_values else 0.0

        # Enhanced cost efficiency using weighted performance if available
        effective_improvement = weighted_dpt if weighted_dpt != 0 else component_data['overall_avg_improvement']
        cost_efficiency = effective_improvement / component_data['cost'] if component_data['cost'] > 0 else 0.0

        return PerformanceMetrics(
            cost=component_data['cost'],
            avg_dpt_improvement=component_data['overall_avg_improvement'],
            cost_efficiency=cost_efficiency,
            scenario_dpts=scenario_dpts,
            attack_type_dpts=attack_type_dpts,
            consistency_index=consistency_index,
            versatility_score=versatility_score,
            peak_performance=peak_performance,
            usage_rate=usage_rate,
            percentile_rank=percentile_rank
        )

    def _analyze_upgrade_balance(self, component_name: str, metrics: PerformanceMetrics) -> BalanceAnalysis:
        """Perform comprehensive balance analysis for a single upgrade or limit"""

        # Calculate unified balance score (0-100 scale)
        balance_score = self._calculate_balance_score(metrics)

        # Determine balance tier
        tier = self._classify_balance_tier(metrics, balance_score)

        # Identify balance issues
        issues = self._detect_balance_issues(component_name, metrics)

        # Generate recommendations
        recommendations = self._generate_recommendations(metrics, tier, issues)

        # Identify strengths and weaknesses
        strengths, weaknesses = self._analyze_strengths_weaknesses(metrics)

        return BalanceAnalysis(
            name=component_name,
            metrics=metrics,
            balance_score=balance_score,
            tier=tier,
            balance_issues=issues,
            recommendations=recommendations,
            strengths=strengths,
            weaknesses=weaknesses
        )

    def _calculate_balance_score(self, metrics: PerformanceMetrics) -> float:
        """Calculate unified balance score from 0-100"""

        # Normalize individual components (0-100 scale)
        cost_efficiency_score = min(100, max(0, metrics.cost_efficiency * 1000))  # Scale up small values
        versatility_score = metrics.versatility_score * 100
        consistency_score = max(0, 100 - (metrics.consistency_index * 20))  # Lower consistency index = higher score
        usage_score = metrics.usage_rate * 100
        percentile_score = 100 - metrics.percentile_rank  # Lower percentile = higher score

        # Weighted combination
        balance_score = (
            cost_efficiency_score * 0.30 +
            versatility_score * 0.25 +
            consistency_score * 0.20 +
            usage_score * 0.15 +
            percentile_score * 0.10
        )

        return min(100, max(0, balance_score))

    def _classify_balance_tier(self, metrics: PerformanceMetrics, balance_score: float) -> BalanceTier:
        """Classify upgrade into balance tiers"""

        # S-Tier: Dominant performance
        if (balance_score >= 80 and
            metrics.cost_efficiency > 0.10 and
            metrics.versatility_score > 0.6):
            return BalanceTier.S_TIER

        # A-Tier: Strong performance
        elif (balance_score >= 65 and
              metrics.cost_efficiency > 0.05 and
              metrics.versatility_score > 0.4):
            return BalanceTier.A_TIER

        # B-Tier: Balanced
        elif (balance_score >= 40 and
              metrics.cost_efficiency > 0.01):
            return BalanceTier.B_TIER

        # C-Tier: Niche/Situational
        elif (metrics.peak_performance > 2.0 or
              metrics.cost_efficiency > 0.01):
            return BalanceTier.C_TIER

        # D-Tier: Underpowered
        else:
            return BalanceTier.D_TIER

    def _detect_balance_issues(self, component_name: str, metrics: PerformanceMetrics) -> List[str]:
        """Detect specific balance issues"""
        issues = []

        # False Positive: High percentile but poor cost-efficiency
        if metrics.percentile_rank < 25 and metrics.cost_efficiency < 0.05:
            issues.append("False Positive: High ranking but poor cost-efficiency")

        # Hidden Gem: Low usage but high performance potential
        if metrics.usage_rate < 0.05 and metrics.cost_efficiency > 0.08:
            issues.append("Hidden Gem: Underutilized despite strong performance")

        # Power Creep: Expensive but dominates cheaper alternatives
        if metrics.cost >= 50 and metrics.cost_efficiency > 0.12:
            issues.append("Power Creep: High-cost upgrade outperforming cheaper options")

        # Dead Option: Never used and poor performance
        if metrics.usage_rate == 0.0 and metrics.cost_efficiency < 0.01:
            issues.append("Dead Option: Unused and underperforming")

        # Inconsistent Performance: High variance across scenarios
        if metrics.consistency_index > 3.0:
            issues.append("Inconsistent Performance: Highly variable across scenarios")

        # Overpowered Peak: Extreme performance in best case
        if metrics.peak_performance > 10.0:
            issues.append("Overpowered Peak: Extremely high performance in optimal scenario")

        return issues

    def _generate_recommendations(self, metrics: PerformanceMetrics, tier: BalanceTier, issues: List[str]) -> List[str]:
        """Generate balance recommendations"""
        recommendations = []

        if tier == BalanceTier.S_TIER:
            recommendations.append("Consider moderate nerf to cost or effectiveness")

        elif tier == BalanceTier.D_TIER:
            recommendations.append("Needs significant buff or cost reduction")

        elif "Power Creep" in ' '.join(issues):
            recommendations.append("Reduce effectiveness or increase cost")

        elif "Hidden Gem" in ' '.join(issues):
            recommendations.append("Consider slight cost reduction to increase adoption")

        elif "Inconsistent Performance" in ' '.join(issues):
            recommendations.append("Stabilize performance across scenarios")

        elif "Overpowered Peak" in ' '.join(issues):
            recommendations.append("Cap maximum effectiveness in optimal scenarios")

        if metrics.cost_efficiency < 0.01:
            recommendations.append("Major cost reduction needed")
        elif metrics.cost_efficiency > 0.15:
            recommendations.append("Cost increase or effectiveness reduction needed")

        return recommendations

    def _analyze_strengths_weaknesses(self, metrics: PerformanceMetrics) -> Tuple[List[str], List[str]]:
        """Identify upgrade strengths and weaknesses"""
        strengths = []
        weaknesses = []

        # Analyze cost efficiency
        if metrics.cost_efficiency > 0.10:
            strengths.append("Excellent cost efficiency")
        elif metrics.cost_efficiency < 0.02:
            weaknesses.append("Poor cost efficiency")

        # Analyze versatility
        if metrics.versatility_score > 0.7:
            strengths.append("Works well with most attack types")
        elif metrics.versatility_score < 0.3:
            weaknesses.append("Limited attack type compatibility")

        # Analyze consistency
        if metrics.consistency_index < 1.0:
            strengths.append("Consistent performance across scenarios")
        elif metrics.consistency_index > 3.0:
            weaknesses.append("Highly variable performance")

        # Analyze peak performance
        if metrics.peak_performance > 5.0:
            strengths.append("Exceptional peak performance")
        elif metrics.peak_performance < 1.0:
            weaknesses.append("Limited peak effectiveness")

        # Analyze usage
        if metrics.usage_rate > 0.10:
            strengths.append("Popular in competitive builds")
        elif metrics.usage_rate < 0.01:
            weaknesses.append("Rarely used in practice")

        return strengths, weaknesses

    def _calculate_usage_and_percentiles(self, build_results: List[Tuple]) -> Tuple[Dict[str, float], Dict[str, float]]:
        """Calculate usage rates and percentile rankings from build results for both upgrades and limits"""
        usage_counts = {}
        component_ranks = {}
        total_builds = len(build_results)

        # Count upgrade and limit usage and track rankings
        for rank, (build, dpt) in enumerate(build_results, 1):
            # Count upgrades
            for upgrade in build.upgrades:
                if upgrade not in usage_counts:
                    usage_counts[upgrade] = 0
                    component_ranks[upgrade] = []
                usage_counts[upgrade] += 1
                component_ranks[upgrade].append(rank)

            # Count limits
            for limit in build.limits:
                if limit not in usage_counts:
                    usage_counts[limit] = 0
                    component_ranks[limit] = []
                usage_counts[limit] += 1
                component_ranks[limit].append(rank)

        # Calculate usage rates
        usage_rates = {component: count / total_builds for component, count in usage_counts.items()}

        # Calculate average percentile rankings
        percentile_ranks = {}
        for component, ranks in component_ranks.items():
            avg_rank = sum(ranks) / len(ranks)
            percentile = (avg_rank / total_builds) * 100
            percentile_ranks[component] = percentile

        return usage_rates, percentile_ranks

    def _calculate_weighted_scenario_performance(self, scenario_dpts: Dict[str, float]) -> float:
        """Calculate scenario-weighted DPT improvement using configurable weights"""
        if not scenario_dpts:
            return 0.0

        # Map scenario names to weights
        scenario_weight_map = {
            "1×100 HP Boss": self.weights.single_target,
            "2×50 HP Enemies": self.weights.medium_group,
            "4×25 HP Enemies": self.weights.large_group,
            "10×10 HP Enemies": self.weights.swarm
        }

        weighted_sum = 0.0
        total_weight = 0.0

        for scenario_name, dpt_improvement in scenario_dpts.items():
            weight = scenario_weight_map.get(scenario_name, 0.25)  # Default weight if unknown scenario
            weighted_sum += dpt_improvement * weight
            total_weight += weight

        return weighted_sum / total_weight if total_weight > 0 else 0.0

    def _parse_scenario_breakdown_data(self) -> Dict[str, Dict]:
        """Parse scenario breakdown data from existing reports for both upgrades and limits"""
        scenario_data = {}

        # Parse upgrade scenario data
        upgrade_file_path = f'{self.reports_dir}/scenario_breakdown_upgrades_report.txt'
        if os.path.exists(upgrade_file_path):
            upgrade_data = self._parse_single_scenario_file(upgrade_file_path, "UPGRADE: ")
            scenario_data.update(upgrade_data)
        else:
            print(f"Warning: Upgrade scenario breakdown report not found at {upgrade_file_path}")

        # Parse limit scenario data
        limit_file_path = f'{self.reports_dir}/scenario_breakdown_limits_report.txt'
        if os.path.exists(limit_file_path):
            limit_data = self._parse_single_scenario_file(limit_file_path, "LIMIT: ")
            scenario_data.update(limit_data)
        else:
            print(f"Warning: Limit scenario breakdown report not found at {limit_file_path}")

        return scenario_data

    def _parse_single_scenario_file(self, file_path: str, section_prefix: str) -> Dict[str, Dict]:
        """Parse a single scenario breakdown file"""
        scenario_data = {}

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            current_component = None
            current_attack_type = None
            parsing_scenarios = False

            for line in lines:
                line = line.strip()

                # Find component sections (upgrade or limit)
                if line.startswith(section_prefix):
                    current_component = line.replace(section_prefix, "").lower()
                    scenario_data[current_component] = {}
                    parsing_scenarios = False

                # Find attack type sections
                elif line.startswith("ATTACK TYPE: ") and current_component:
                    current_attack_type = line.replace("ATTACK TYPE: ", "").lower()
                    parsing_scenarios = False

                # Find scenario data tables
                elif line.startswith("Scenario") and "Base DPT" in line and current_component:
                    parsing_scenarios = True
                    continue

                # Parse scenario data
                elif parsing_scenarios and current_component and current_attack_type:
                    if "HP" in line and "%" in line:
                        # Parse scenario performance line
                        parts = line.split()
                        if len(parts) >= 5:
                            scenario_name = " ".join(parts[:3])  # "1×100 HP Boss"
                            try:
                                improvement = float(parts[4])  # Improvement column

                                # Store by scenario for this component (average across attack types)
                                if scenario_name not in scenario_data[current_component]:
                                    scenario_data[current_component][scenario_name] = []
                                scenario_data[current_component][scenario_name].append(improvement)
                            except (ValueError, IndexError):
                                continue

            # Average scenario performance across attack types for each component
            for component_name, component_scenarios in scenario_data.items():
                for scenario_name, improvements in component_scenarios.items():
                    if isinstance(improvements, list) and improvements:
                        scenario_data[component_name][scenario_name] = sum(improvements) / len(improvements)

        except Exception as e:
            print(f"Error parsing scenario breakdown data from {file_path}: {e}")

        return scenario_data

    def generate_balance_health_report(self, analyses: Dict[str, BalanceAnalysis]) -> str:
        """Generate comprehensive balance health report"""
        print("Generating Balance Health Report...")

        report_path = f'{self.reports_dir}/balance_health_report.txt'

        # Sort analyses by balance score
        sorted_analyses = sorted(analyses.values(), key=lambda x: x.balance_score, reverse=True)

        # Count by tier
        tier_counts = {}
        for analysis in sorted_analyses:
            tier = analysis.tier
            tier_counts[tier] = tier_counts.get(tier, 0) + 1

        # Identify major issues
        major_issues = []
        for analysis in sorted_analyses:
            if analysis.tier in [BalanceTier.S_TIER, BalanceTier.D_TIER]:
                major_issues.append(analysis)

        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - COMPREHENSIVE BALANCE HEALTH REPORT\n")
            f.write("="*80 + "\n\n")
            f.write("This report provides multi-dimensional balance analysis identifying overpowered,\n")
            f.write("underpowered, and situationally imbalanced upgrades and limits across all combat scenarios.\n\n")

            # Executive Summary
            f.write("EXECUTIVE SUMMARY\n")
            f.write("-" * 40 + "\n")
            f.write(f"Total Components Analyzed: {len(analyses)} (upgrades and limits)\n")
            f.write(f"Balance Distribution:\n")
            for tier in BalanceTier:
                count = tier_counts.get(tier, 0)
                f.write(f"  {tier.value}-Tier: {count} components\n")
            f.write(f"Major Balance Issues: {len(major_issues)} components\n\n")

            # Tier Rankings
            f.write("UPGRADE & LIMIT BALANCE TIER RANKINGS\n")
            f.write("-" * 80 + "\n")
            f.write(f"{'Rank':<4} {'Component':<25} {'Tier':<6} {'Score':<8} {'Cost Eff':<10} {'Issues':<10}\n")
            f.write("-" * 80 + "\n")

            for i, analysis in enumerate(sorted_analyses, 1):
                issues_count = len(analysis.balance_issues)
                f.write(f"{i:<4} {analysis.name:<25} {analysis.tier.value:<6} "
                       f"{analysis.balance_score:>6.1f} {analysis.metrics.cost_efficiency:>8.3f} "
                       f"{issues_count:>6}\n")

            # Major Balance Issues
            if major_issues:
                f.write(f"\n\nMAJOR BALANCE ISSUES\n")
                f.write("="*80 + "\n")

                for analysis in major_issues:
                    f.write(f"\n{analysis.name.upper()} ({analysis.tier.value}-Tier)\n")
                    f.write("-" * 60 + "\n")
                    f.write(f"Balance Score: {analysis.balance_score:.1f}\n")
                    f.write(f"Cost: {analysis.metrics.cost} points\n")
                    f.write(f"Cost Efficiency: {analysis.metrics.cost_efficiency:.3f}\n")
                    f.write(f"Versatility: {analysis.metrics.versatility_score:.2f}\n")
                    f.write(f"Peak Performance: {analysis.metrics.peak_performance:.1f} DPT\n")
                    f.write(f"Usage Rate: {analysis.metrics.usage_rate:.3f}\n")

                    if analysis.balance_issues:
                        f.write("\nIssues Detected:\n")
                        for issue in analysis.balance_issues:
                            f.write(f"  • {issue}\n")

                    if analysis.recommendations:
                        f.write("\nRecommendations:\n")
                        for rec in analysis.recommendations:
                            f.write(f"  → {rec}\n")

            # Detailed Analysis by Tier
            f.write(f"\n\nDETAILED TIER ANALYSIS\n")
            f.write("="*80 + "\n")

            for tier in BalanceTier:
                tier_components = [a for a in sorted_analyses if a.tier == tier]
                if not tier_components:
                    continue

                f.write(f"\n{tier.value}-TIER COMPONENTS ({len(tier_components)} total)\n")
                f.write("-" * 40 + "\n")

                tier_description = {
                    BalanceTier.S_TIER: "Overpowered - dominates multiple scenarios",
                    BalanceTier.A_TIER: "Strong - good across most metrics",
                    BalanceTier.B_TIER: "Balanced - moderate performance with clear use cases",
                    BalanceTier.C_TIER: "Niche - strong in specific scenarios but weak overall",
                    BalanceTier.D_TIER: "Underpowered - poor across most metrics"
                }
                f.write(f"Description: {tier_description[tier]}\n\n")

                for analysis in tier_components:
                    f.write(f"{analysis.name}: Score {analysis.balance_score:.1f}, "
                           f"Cost Eff {analysis.metrics.cost_efficiency:.3f}\n")

                    if analysis.strengths:
                        f.write(f"  Strengths: {', '.join(analysis.strengths[:2])}\n")
                    if analysis.weaknesses:
                        f.write(f"  Weaknesses: {', '.join(analysis.weaknesses[:2])}\n")
                    f.write("\n")

        print(f"Balance Health Report saved to {report_path}")
        return report_path


def main():
    """Test the balance analysis system"""
    from reporting import load_config

    config = load_config()
    analyzer = BalanceAnalyzer(config)

    # Run analysis
    analyses = analyzer.analyze_all_components()

    # Generate report
    analyzer.generate_balance_health_report(analyses)

    print("Balance analysis complete!")


if __name__ == "__main__":
    main()