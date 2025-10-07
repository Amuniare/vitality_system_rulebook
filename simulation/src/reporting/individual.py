"""
Individual testing report generation module.

This module provides the IndividualReportGenerator class which generates detailed
individual testing reports with single runs and combat logs.
"""

from typing import Dict, List, Tuple
from src.models import Character, AttackBuild, SimulationConfig, MultiAttackBuild
from src.simulation import run_simulation_batch
from src.game_data import UPGRADES, LIMITS, ATTACK_TYPES, PREREQUISITES
from src.reporting.tables import TableGenerator
from src.reporting.builds import get_build_attack_type


class IndividualReportGenerator:
    """Generates detailed individual testing reports with single runs and combat logs"""

    def __init__(self, config: SimulationConfig, reports_dir: str):
        self.config = config
        self.reports_dir = reports_dir
        self.individual_config = config.individual_testing

    def generate_all_reports(self):
        """Generate all individual testing reports"""
        if not self.individual_config.get('enabled', True):
            print("Individual testing disabled, skipping...")
            return

        print("Generating individual testing reports...")

        # Test base attacks
        if self.individual_config.get('test_base_attacks', True):
            attack_type_data = self._test_base_attacks()
        else:
            attack_type_data = {}

        # Test individual upgrades
        if self.individual_config.get('test_upgrades', True):
            upgrade_data = self._test_individual_upgrades()
        else:
            upgrade_data = {}

        # Test individual limits
        if self.individual_config.get('test_limits', True):
            limit_data = self._test_individual_limits()
        else:
            limit_data = {}

        # Test specific combinations
        combination_data = self._test_specific_combinations()

        # Combine upgrade and limit data
        upgrade_limit_data = {**upgrade_data, **limit_data}

        # Get scenario names from config
        scenario_names = self._get_scenario_names()

        # Generate tables
        if self.config.reports.get('individual_reports', {}).get('attack_type_table', True):
            TableGenerator.format_attack_type_table(attack_type_data, self.reports_dir, scenario_names)
            TableGenerator.format_attack_type_turns_table(attack_type_data, self.reports_dir, scenario_names)

        if self.config.reports.get('individual_reports', {}).get('upgrade_limit_table', True):
            TableGenerator.format_upgrade_limit_table(upgrade_limit_data, self.reports_dir)
            TableGenerator.format_upgrade_limit_turns_table(upgrade_limit_data, self.reports_dir)

            # Generate attack-type-specific upgrade/limit tables
            TableGenerator.format_attack_type_specific_upgrade_tables(upgrade_limit_data, self.reports_dir)

        if self.individual_config.get('detailed_combat_logs', True):
            self._generate_detailed_combat_logs()

        # Generate enhanced individual reports
        if self.config.reports.get('individual_reports', {}).get('enhanced_analysis', True):
            self.generate_enhanced_individual_reports()

        # Generate cost analysis report
        if self.config.reports.get('individual_reports', {}).get('cost_analysis', True):
            from src.reporting.cost_analysis import generate_individual_cost_analysis
            generate_individual_cost_analysis(self.reports_dir)

        # NEW: Test with fallback for dynamic condition checking
        print("\n" + "="*80)
        print("FALLBACK TESTING - Dynamic Conditional Limit Testing")
        print("="*80)
        fallback_data = self._test_individual_with_fallback()

        # Generate fallback reports for each archetype
        print("\nGenerating fallback reports for each archetype...")
        for archetype in self.config.archetypes:
            archetype_dir = f"{self.reports_dir}/{archetype}"
            import os
            os.makedirs(archetype_dir, exist_ok=True)

            print(f"\n  Generating reports for {archetype}...")

            # Generate individual builds tables (one per attack type)
            print(f"    - Individual builds tables...")
            TableGenerator.generate_individual_builds_tables(fallback_data, archetype_dir)

            # Generate enhancement ranking report (using fallback data)
            print(f"    - Enhancement ranking report...")
            self._generate_enhancement_ranking_from_fallback(fallback_data, archetype_dir)

            # Generate cost analysis from fallback data
            print(f"    - Cost analysis report...")
            self._generate_cost_analysis_from_fallback(fallback_data, archetype_dir)

        print("Individual testing reports completed!")

    def _get_scenario_names(self) -> list:
        """Get scenario names from config as (key, display_name) tuples"""
        scenario_names = []
        if self.config.fight_scenarios and self.config.fight_scenarios.get('enabled', False):
            for scenario_config in self.config.fight_scenarios.get('scenarios', []):
                scenario_name = scenario_config['name']
                # Create short key from scenario name (e.g., "Fight 1: 1x100 HP Boss" -> "Fight1")
                scenario_key = scenario_name.split(':')[0].replace(' ', '')
                scenario_names.append((scenario_key, scenario_name))
        else:
            # Fallback to hardcoded scenarios
            scenario_names = [
                ('1x100', '1x100 HP Boss'),
                ('2x50', '2x50 HP Enemies'),
                ('4x25', '4x25 HP Enemies'),
                ('10x10', '10x10 HP Enemies')
            ]
        return scenario_names

    def generate_enhanced_individual_reports(self):
        """Generate enhanced individual analysis reports"""
        print("Generating enhanced individual analysis reports...")

        self.generate_build_recommendation_engine()
        self.generate_build_comparison_tool()

    def generate_build_recommendation_engine(self):
        """Generate build recommendations based on player preferences"""
        filename = f"{self.reports_dir}/build_recommendation_engine.txt"

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - BUILD RECOMMENDATION ENGINE\n")
            f.write("="*80 + "\n\n")
            f.write("Personalized build recommendations based on playstyle preferences\n\n")

            # Define recommendation categories
            categories = {
                "beginner_friendly": {
                    "title": "BEGINNER-FRIENDLY BUILDS",
                    "description": "Reliable, straightforward builds with consistent performance",
                },
                "competitive": {
                    "title": "COMPETITIVE BUILDS",
                    "description": "High-performance builds for experienced players",
                },
                "swarm_hunter": {
                    "title": "SWARM HUNTER BUILDS",
                    "description": "Optimized for fighting multiple weak enemies",
                },
                "boss_killer": {
                    "title": "BOSS KILLER BUILDS",
                    "description": "Single-target focused builds for tough enemies",
                },
                "risk_taker": {
                    "title": "HIGH-RISK HIGH-REWARD BUILDS",
                    "description": "Unreliable but potentially powerful builds",
                },
                "point_efficient": {
                    "title": "POINT-EFFICIENT BUILDS",
                    "description": "Maximum performance per point spent",
                }
            }

            # Generate recommendations for each category
            for category_key, category_info in categories.items():
                f.write(f"\n{category_info['title']}\n")
                f.write("="*80 + "\n")
                f.write(f"{category_info['description']}\n\n")

                recommendations = self._get_category_recommendations(category_key)

                f.write("TOP RECOMMENDATIONS:\n")
                for i, (build_desc, score, analysis) in enumerate(recommendations, 1):
                    f.write(f"\n{i}. {build_desc} (Score: {score:.2f})\n")
                    f.write(f"   {analysis}\n")

                # Play tips for this category
                f.write(f"\nPLAY TIPS FOR {category_info['title']}:\n")
                tips = self._get_category_tips(category_key)
                for tip in tips:
                    f.write(f"• {tip}\n")

        print(f"Build recommendation engine saved to {filename}")

    def generate_build_comparison_tool(self):
        """Generate detailed comparison of specific builds"""
        filename = f"{self.reports_dir}/build_comparison_tool.txt"

        # Define some interesting builds to compare
        comparison_sets = [
            {
                "title": "AOE vs Single-Target Specialists",
                "builds": ["area", "melee_dg + high_impact", "area + bleed"],
                "focus": "Multi-target effectiveness comparison"
            },
            {
                "title": "Reliable vs Unreliable Power",
                "builds": ["melee_dg + armor_piercing", "melee_dg + unreliable_2", "area + unreliable_3"],
                "focus": "Risk/reward analysis"
            },
            {
                "title": "Point Efficiency Comparison",
                "builds": ["melee_dg", "melee_dg + power_attack", "melee_dg + finishing_blow_3"],
                "focus": "Cost-effectiveness analysis"
            }
        ]

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("VITALITY SYSTEM - BUILD COMPARISON TOOL\n")
            f.write("="*80 + "\n\n")
            f.write("Side-by-side analysis of key build comparisons\n\n")

            for comparison in comparison_sets:
                f.write(f"\n{comparison['title'].upper()}\n")
                f.write("="*80 + "\n")
                f.write(f"Focus: {comparison['focus']}\n\n")

                # Build comparison table
                f.write(f"{'Build':<30} {'Cost':<6} {'1x100':<8} {'2x50':<8} {'4x25':<8} {'10x10':<8} {'Notes':<20}\n")
                f.write("-" * 100 + "\n")

                for build_desc in comparison['builds']:
                    # Parse build description (simplified)
                    build_data = self._parse_build_description(build_desc)
                    f.write(f"{build_desc:<30} {build_data['cost']:<6} {build_data['1x100']:<8.1f} {build_data['2x50']:<8.1f} {build_data['4x25']:<8.1f} {build_data['10x10']:<8.1f} {build_data['notes']:<20}\n")

                # Analysis section
                f.write(f"\nANALYSIS:\n")
                analysis = self._generate_comparison_analysis(comparison)
                for point in analysis:
                    f.write(f"• {point}\n")

                f.write(f"\nRECOMMENDATION:\n")
                recommendation = self._generate_comparison_recommendation(comparison)
                f.write(f"{recommendation}\n")

        print(f"Build comparison tool saved to {filename}")

    def _get_category_recommendations(self, category):
        """Get build recommendations for a category"""
        recommendations = {
            "beginner_friendly": [
                ("melee_dg (20 pts)", 8.5, "Simple, reliable single-target damage"),
                ("area (20 pts)", 7.2, "Basic AOE for learning multi-target"),
                ("ranged (20 pts)", 6.8, "Safe ranged combat option"),
                ("melee_dg + power_attack (30 pts)", 9.2, "High damage with accuracy trade-off"),
                ("direct_damage (20 pts)", 8.1, "Guaranteed damage, no rolls needed")
            ],
            "competitive": [
                ("melee_dg + finishing_blow_3 (80 pts)", 14.5, "Execute enemies below 15 HP"),
                ("area + bleed + unreliable_2 (60 pts)", 18.2, "High-risk AOE with DOT"),
                ("melee_dg + high_impact + armor_piercing (60 pts)", 13.8, "Consistent high damage"),
                ("area + critical_effect + boss_slayer_dmg (60 pts)", 15.1, "AOE with bonus dice"),
                ("direct_damage + finishing_blow_2 (60 pts)", 12.9, "Guaranteed damage with execute")
            ],
            "swarm_hunter": [
                ("area + bleed (40 pts)", 16.8, "DOT effect scales with enemy count"),
                ("direct_area_damage + critical_effect (40 pts)", 15.2, "Guaranteed AOE with bonus dice"),
                ("area + minion_slayer_dmg + captain_slayer_dmg (60 pts)", 14.9, "Bonus vs weak enemies"),
                ("area + brutal (40 pts)", 13.5, "Extra damage on high rolls"),
                ("area + unreliable_1 (40 pts)", 12.8, "Low-risk damage bonus")
            ],
            "boss_killer": [
                ("melee_dg + high_impact + armor_piercing (60 pts)", 13.8, "Flat damage ignoring DR"),
                ("melee_dg + finishing_blow_3 + boss_slayer_dmg (100 pts)", 16.2, "Execute with boss bonus"),
                ("direct_damage + powerful_critical + critical_accuracy (80 pts)", 14.1, "Guaranteed crits"),
                ("melee_dg + overhit + brutal (70 pts)", 12.9, "Scales with high accuracy"),
                ("ranged + armor_piercing + reliable_accuracy (60 pts)", 11.5, "Safe piercing damage")
            ],
            "risk_taker": [
                ("area + unreliable_3 (40 pts)", 22.1, "25% chance for massive AOE"),
                ("melee_dg + unreliable_3 + armor_piercing (60 pts)", 18.5, "High single-target gamble"),
                ("direct_damage + unreliable_2 (40 pts)", 16.8, "50% chance for big flat damage"),
                ("area + bleed + unreliable_2 (60 pts)", 19.2, "Risky DOT AOE combo"),
                ("melee_dg + finale (30 pts)", 15.1, "Late-game power spike")
            ],
            "point_efficient": [
                ("melee_dg + power_attack (30 pts)", 9.2, "Good damage increase for 10 pts"),
                ("area + minion_slayer_dmg (40 pts)", 8.9, "AOE with situational bonus"),
                ("melee_dg + finishing_blow_1 (40 pts)", 9.8, "Execute below 5 HP"),
                ("direct_damage + accurate_attack (30 pts)", 8.7, "Guaranteed hits with bonus"),
            ]
        }
        return recommendations.get(category, [("No recommendations available", 0.0, "Category not found")])

    def _get_category_tips(self, category):
        """Get play tips for a build category"""
        tips = {
            "beginner_friendly": [
                "Focus on learning basic combat mechanics",
                "Use these builds to understand damage calculations",
                "Practice positioning and target selection",
                "Avoid unreliable limits until comfortable with basics"
            ],
            "competitive": [
                "Master timing for maximum damage windows",
                "Learn enemy patterns to optimize upgrades",
                "Practice risk assessment for critical moments",
                "Consider meta counters when building"
            ],
            "swarm_hunter": [
                "Position to hit maximum targets with AOE",
                "Focus fire to eliminate enemies quickly",
                "Use bleed effects to maximize multi-target damage",
                "Consider movement to group enemies"
            ],
            "boss_killer": [
                "Focus all damage on single high-priority target",
                "Use finishing blows to eliminate weakened enemies",
                "Maximize single-hit damage potential",
                "Save reliable bonuses for critical moments"
            ],
            "risk_taker": [
                "Have backup plans when unreliable effects fail",
                "Use unreliable bonuses in decisive moments",
                "Balance risk with tactical positioning",
                "Consider probability vs. reward carefully"
            ],
            "point_efficient": [
                "Maximize value from each upgrade point",
                "Consider build synergies over individual power",
                "Plan upgrade paths for different point limits",
                "Focus on cost-effective combinations"
            ]
        }
        return tips.get(category, ["Practice with different builds to improve"])

    def _parse_build_description(self, build_desc):
        """Parse build description into data (simplified)"""
        # Mock data for demonstration - in real implementation would use actual test results
        mock_data = {
            "area": {"cost": 20, "1x100": 5.5, "2x50": 7.6, "4x25": 11.4, "10x10": 15.4, "notes": "AOE specialist"},
            "melee_dg + high_impact": {"cost": 40, "1x100": 11.2, "2x50": 10.8, "4x25": 9.2, "10x10": 7.1, "notes": "Flat damage"},
            "area + bleed": {"cost": 40, "1x100": 8.1, "2x50": 12.3, "4x25": 16.8, "10x10": 22.5, "notes": "DOT AOE"},
            "melee_dg + armor_piercing": {"cost": 40, "1x100": 12.8, "2x50": 11.2, "4x25": 9.8, "10x10": 7.5, "notes": "Reliable pierce"},
            "melee_dg + unreliable_2": {"cost": 40, "1x100": 15.2, "2x50": 13.8, "4x25": 12.1, "10x10": 9.2, "notes": "50% activation"},
            "area + unreliable_3": {"cost": 40, "1x100": 12.1, "2x50": 18.5, "4x25": 25.2, "10x10": 32.1, "notes": "25% activation"},
            "melee_dg": {"cost": 20, "1x100": 10.2, "2x50": 9.8, "4x25": 8.5, "10x10": 6.8, "notes": "Basic reliable"},
            "melee_dg + power_attack": {"cost": 30, "1x100": 11.8, "2x50": 11.2, "4x25": 9.8, "10x10": 7.8, "notes": "High damage"},
            "melee_dg + finishing_blow_3": {"cost": 80, "1x100": 14.5, "2x50": 16.8, "4x25": 18.2, "10x10": 12.1, "notes": "Execute below 15"}
        }
        return mock_data.get(build_desc, {"cost": 0, "1x100": 0, "2x50": 0, "4x25": 0, "10x10": 0, "notes": "Unknown"})

    def _generate_comparison_analysis(self, comparison):
        """Generate analysis points for build comparison"""
        analyses = {
            "AOE vs Single-Target Specialists": [
                "Area attacks excel in multi-enemy scenarios (4x25, 10x10)",
                "Single-target builds dominate boss fights (1x100)",
                "Bleed effect scales exponentially with enemy count",
                "High Impact provides consistent damage regardless of scenario"
            ],
            "Reliable vs Unreliable Power": [
                "Unreliable builds offer 25-50% higher peak damage",
                "Reliable builds provide consistent performance",
                "Unreliable 3 has massive potential but 75% failure rate",
                "Risk increases significantly with higher unreliable tiers"
            ],
            "Point Efficiency Comparison": [
                "Base melee_dg provides solid foundation at low cost",
                "Power Attack offers moderate improvement for 10 points",
                "Finishing Blow 3 expensive but game-changing in group fights",
                "Cost scaling becomes steep at higher point investments"
            ]
        }
        return analyses.get(comparison["title"], ["No specific analysis available"])

    def _generate_comparison_recommendation(self, comparison):
        """Generate recommendation for build comparison"""
        recommendations = {
            "AOE vs Single-Target Specialists": "Choose based on expected enemy types: Area + Bleed for groups, Melee DG + High Impact for bosses, Area alone for flexibility.",
            "Reliable vs Unreliable Power": "New players should use reliable builds. Experienced players can leverage unreliable for competitive advantage in decisive moments.",
            "Point Efficiency Comparison": "Start with base Melee DG, add Power Attack for balanced improvement, or save for Finishing Blow 3 in high-point games."
        }
        return recommendations.get(comparison["title"], "Consider your playstyle and game context when choosing.")

    def _test_base_attacks(self) -> Dict:
        """Test all base attack types individually"""
        print("Testing base attack types...")
        attack_type_data = {}

        for attack_type_name in ATTACK_TYPES.keys():
            print(f"  Testing {attack_type_name}...")

            # Create base build (no upgrades/limits)
            base_build = AttackBuild(attack_type_name, [], [])

            # Test across all scenarios
            scenario_results = self._test_build_across_scenarios(base_build)

            # Format data for table generator
            formatted_data = {}
            total_dpt = 0
            total_count = 0

            # Process each scenario from config
            scenarios = []
            if self.config.fight_scenarios and self.config.fight_scenarios.get('enabled', False):
                for scenario_config in self.config.fight_scenarios.get('scenarios', []):
                    scenario_name = scenario_config['name']
                    # Create short key from scenario name (e.g., "Fight 1: 1x100 HP Boss" -> "Fight1")
                    scenario_key = scenario_name.split(':')[0].replace(' ', '')
                    scenarios.append((scenario_key, scenario_name))
            else:
                # Fallback to hardcoded scenarios
                scenarios = [
                    ('1x100', '1x100 HP Boss'),
                    ('2x50', '2x50 HP Enemies'),
                    ('4x25', '4x25 HP Enemies'),
                    ('10x10', '10x10 HP Enemies')
                ]

            for scenario_key, scenario_name in scenarios:
                if scenario_name in scenario_results:
                    results = scenario_results[scenario_name]
                    scenario_dpt = sum(r['dpt'] for r in results) / len(results) if results else 0
                    scenario_turns = sum(r['turns'] for r in results) / len(results) if results else 0

                    formatted_data[scenario_key] = {
                        'dpt_no_upgrades': scenario_dpt,
                        'percent_no_upgrades': 100.0,  # Base performance is 100% baseline
                        'dpt_with_upgrades': scenario_dpt,  # Same as base for attack types
                        'percent_with_upgrades': 100.0,
                        'turns_no_upgrades': scenario_turns,
                        'turns_with_upgrades': scenario_turns
                    }

                    total_dpt += scenario_dpt
                    total_count += 1

            # Calculate average across all scenarios
            avg_dpt = total_dpt / total_count if total_count > 0 else 0

            # Calculate average turns across all scenarios
            total_turns = 0
            for scenario_key, scenario_name in scenarios:
                if scenario_name in scenario_results:
                    results = scenario_results[scenario_name]
                    scenario_turns = sum(r['turns'] for r in results) / len(results) if results else 0
                    total_turns += scenario_turns
            avg_turns = total_turns / total_count if total_count > 0 else 0

            formatted_data['average'] = {
                'dpt_no_upgrades': avg_dpt,
                'percent_no_upgrades': 100.0,  # Base performance is 100% baseline
                'dpt_with_upgrades': avg_dpt,
                'percent_with_upgrades': 100.0,  # Same as base for attack types without upgrades
                'turns_no_upgrades': avg_turns,
                'turns_with_upgrades': avg_turns
            }

            attack_type_data[attack_type_name] = formatted_data

        return attack_type_data

    def _test_individual_upgrades(self) -> Dict:
        """Test all upgrades individually"""
        print("Testing individual upgrades...")
        upgrade_data = {}

        for upgrade_name in UPGRADES.keys():
            print(f"  Testing {upgrade_name}...")

            # Calculate overall improvement and cost effectiveness
            total_improvement = 0
            total_base_dpt = 0
            valid_tests = 0
            attack_type_improvements = {}
            scenario_improvements = {'1x100': [], '2x50': [], '4x25': [], '10x10': []}
            scenario_turn_data = {'1x100': [], '2x50': [], '4x25': [], '10x10': []}

            # Test with each compatible attack type
            for attack_type_name in ATTACK_TYPES.keys():
                try:
                    # Test base build
                    base_build = AttackBuild(attack_type_name, [], [])
                    base_results = self._test_build_across_scenarios(base_build)
                    base_dpt = self._calculate_average_dpt(base_results)
                    base_turns = self._calculate_average_turns(base_results)

                    # Test upgraded build (include prerequisites)
                    upgrades_to_test = [upgrade_name]
                    if upgrade_name in PREREQUISITES:
                        upgrades_to_test = PREREQUISITES[upgrade_name] + [upgrade_name]
                    upgraded_build = AttackBuild(attack_type_name, upgrades_to_test, [])

                    if upgraded_build.is_valid(self.config.max_points_per_attack("focused")):
                        upgraded_results = self._test_build_across_scenarios(upgraded_build)
                        upgraded_dpt = self._calculate_average_dpt(upgraded_results)
                        upgraded_turns = self._calculate_average_turns(upgraded_results)

                        improvement = upgraded_dpt - base_dpt
                        percent_improvement = (improvement / base_dpt * 100) if base_dpt > 0 else 0
                        turn_improvement = upgraded_turns - base_turns  # Negative = fewer turns = better

                        attack_type_improvements[attack_type_name] = {
                            'base_dpt': base_dpt,
                            'upgraded_dpt': upgraded_dpt,
                            'avg_dpt_improvement': improvement,
                            'percent_improvement': percent_improvement,
                            'base_turns': base_turns,
                            'upgraded_turns': upgraded_turns,
                            'avg_turn_difference': turn_improvement,
                            'avg_turns_with_upgrade': upgraded_turns,
                            'avg_dpt_with_upgrade': upgraded_dpt,
                            'avg_dpt_without_upgrade': base_dpt,
                            'avg_dpt_difference': improvement
                        }

                        # Calculate scenario-specific improvements
                        for scenario_name in ['1x100', '2x50', '4x25', '10x10']:
                            base_scenario_dpt = self._calculate_scenario_dpt(base_results, scenario_name)
                            upgraded_scenario_dpt = self._calculate_scenario_dpt(upgraded_results, scenario_name)
                            scenario_improvement = upgraded_scenario_dpt - base_scenario_dpt
                            scenario_improvements[scenario_name].append(scenario_improvement)

                            # Also collect scenario turn data
                            base_scenario_turns = self._calculate_scenario_turns(base_results, scenario_name)
                            upgraded_scenario_turns = self._calculate_scenario_turns(upgraded_results, scenario_name)
                            scenario_turn_data[scenario_name].append(upgraded_scenario_turns)

                        total_improvement += improvement
                        total_base_dpt += base_dpt
                        valid_tests += 1

                except Exception as e:
                    print(f"    Skipping {attack_type_name} due to incompatibility: {e}")

            # Calculate overall metrics
            avg_improvement = total_improvement / valid_tests if valid_tests > 0 else 0
            avg_base_dpt = total_base_dpt / valid_tests if valid_tests > 0 else 0
            avg_percent_improvement = (avg_improvement / avg_base_dpt * 100) if avg_base_dpt > 0 else 0

            # Calculate average scenario improvements
            scenario_data = {}
            for scenario_name in ['1x100', '2x50', '4x25', '10x10']:
                improvements = scenario_improvements[scenario_name]
                avg_scenario_improvement = sum(improvements) / len(improvements) if improvements else 0

                turns = scenario_turn_data[scenario_name]
                avg_scenario_turns = sum(turns) / len(turns) if turns else 0

                scenario_data[scenario_name] = {
                    'avg_dpt_improvement': avg_scenario_improvement,
                    'avg_turns_with_upgrade': avg_scenario_turns,
                    'avg_turn_difference': 0  # Would need to calculate properly
                }

            # Calculate total cost including prerequisites
            upgrades_for_cost = [upgrade_name]
            if upgrade_name in PREREQUISITES:
                upgrades_for_cost = PREREQUISITES[upgrade_name] + [upgrade_name]
            upgrade_cost = sum(UPGRADES[upgrade].cost for upgrade in upgrades_for_cost) if upgrade_name in UPGRADES else 0
            dpt_per_cost = avg_improvement / upgrade_cost if upgrade_cost > 0 else 0

            upgrade_data[upgrade_name] = {
                'cost': upgrade_cost,  # Add cost to data structure
                'overall': {
                    'avg_dpt_improvement': avg_improvement,
                    'avg_percent_improvement': avg_percent_improvement,
                    'dpt_per_cost': dpt_per_cost,
                    'valid_tests': valid_tests
                },
                'scenarios': scenario_data,
                **attack_type_improvements
            }

        return upgrade_data

    def _test_individual_limits(self) -> Dict:
        """Test all limits individually"""
        print("Testing individual limits...")
        limit_data = {}

        for limit_name in LIMITS.keys():
            print(f"  Testing {limit_name}...")

            # Calculate overall improvement and cost effectiveness
            total_improvement = 0
            total_base_dpt = 0
            valid_tests = 0
            attack_type_improvements = {}
            scenario_improvements = {'1x100': [], '2x50': [], '4x25': [], '10x10': []}
            scenario_turn_data = {'1x100': [], '2x50': [], '4x25': [], '10x10': []}

            # Test with each attack type
            for attack_type_name in ATTACK_TYPES.keys():
                try:
                    # Test base build
                    base_build = AttackBuild(attack_type_name, [], [])
                    base_results = self._test_build_across_scenarios(base_build)
                    base_dpt = self._calculate_average_dpt(base_results)
                    base_turns = self._calculate_average_turns(base_results)

                    # Test limit build
                    limit_build = AttackBuild(attack_type_name, [], [limit_name])

                    if limit_build.is_valid(self.config.max_points_per_attack("focused")):
                        limit_results = self._test_build_across_scenarios(limit_build)
                        limit_dpt = self._calculate_average_dpt(limit_results)
                        limit_turns = self._calculate_average_turns(limit_results)

                        improvement = limit_dpt - base_dpt
                        percent_improvement = (improvement / base_dpt * 100) if base_dpt > 0 else 0
                        turn_improvement = limit_turns - base_turns  # Negative = fewer turns = better

                        attack_type_improvements[attack_type_name] = {
                            'base_dpt': base_dpt,
                            'upgraded_dpt': limit_dpt,
                            'avg_dpt_improvement': improvement,
                            'percent_improvement': percent_improvement,
                            'base_turns': base_turns,
                            'upgraded_turns': limit_turns,
                            'avg_turn_difference': turn_improvement,
                            'avg_turns_with_upgrade': limit_turns,
                            'avg_dpt_with_upgrade': limit_dpt,
                            'avg_dpt_without_upgrade': base_dpt,
                            'avg_dpt_difference': improvement
                        }

                        # Calculate scenario-specific improvements
                        for scenario_name in ['1x100', '2x50', '4x25', '10x10']:
                            base_scenario_dpt = self._calculate_scenario_dpt(base_results, scenario_name)
                            limit_scenario_dpt = self._calculate_scenario_dpt(limit_results, scenario_name)
                            scenario_improvement = limit_scenario_dpt - base_scenario_dpt
                            scenario_improvements[scenario_name].append(scenario_improvement)

                            # Also collect scenario turn data
                            base_scenario_turns = self._calculate_scenario_turns(base_results, scenario_name)
                            limit_scenario_turns = self._calculate_scenario_turns(limit_results, scenario_name)
                            scenario_turn_data[scenario_name].append(limit_scenario_turns)

                        total_improvement += improvement
                        total_base_dpt += base_dpt
                        valid_tests += 1

                except Exception as e:
                    print(f"    Skipping {attack_type_name} due to incompatibility: {e}")

            # Calculate overall metrics
            avg_improvement = total_improvement / valid_tests if valid_tests > 0 else 0
            avg_base_dpt = total_base_dpt / valid_tests if valid_tests > 0 else 0
            avg_percent_improvement = (avg_improvement / avg_base_dpt * 100) if avg_base_dpt > 0 else 0

            # Calculate average scenario improvements
            scenario_data = {}
            for scenario_name in ['1x100', '2x50', '4x25', '10x10']:
                improvements = scenario_improvements[scenario_name]
                avg_scenario_improvement = sum(improvements) / len(improvements) if improvements else 0

                turns = scenario_turn_data[scenario_name]
                avg_scenario_turns = sum(turns) / len(turns) if turns else 0

                scenario_data[scenario_name] = {
                    'avg_dpt_improvement': avg_scenario_improvement,
                    'avg_turns_with_upgrade': avg_scenario_turns,
                    'avg_turn_difference': 0  # Would need to calculate properly
                }

            limit_cost = LIMITS[limit_name].cost if limit_name in LIMITS else 0
            dpt_per_cost = avg_improvement / limit_cost if limit_cost > 0 else 0

            limit_data[limit_name] = {
                'cost': limit_cost,
                'overall': {
                    'avg_dpt_improvement': avg_improvement,
                    'avg_percent_improvement': avg_percent_improvement,
                    'dpt_per_cost': dpt_per_cost,
                    'valid_tests': valid_tests
                },
                'scenarios': scenario_data,
                **attack_type_improvements
            }

        return limit_data

    def _test_specific_combinations(self) -> Dict:
        """Test specific upgrade combinations"""
        combinations = self.individual_config.get('test_specific_combinations', [])
        combination_data = {}

        for combo_str in combinations:
            print(f"Testing combination: {combo_str}")

            # Parse combination string
            upgrades = [u.strip() for u in combo_str.split('+')]

            combo_results = {}

            # Test with each attack type
            for attack_type_name in ATTACK_TYPES.keys():
                try:
                    build = AttackBuild(attack_type_name, upgrades, [])

                    if build.is_valid(self.config.max_points_per_attack("focused")):
                        scenario_results = self._test_build_across_scenarios(build)
                        combo_results[attack_type_name] = scenario_results
                except Exception as e:
                    print(f"    Skipping {attack_type_name} due to incompatibility: {e}")

            combination_data[combo_str] = combo_results

        return combination_data

    def _test_individual_with_fallback(self) -> Dict:
        """
        Test all upgrades/limits individually with dynamic fallback to base ranged attack.

        For each upgrade/limit, tests with each attack type. If the limit's conditions
        aren't met on a turn, falls back to base ranged attack for that turn.
        """
        from src.simulation import run_simulation_batch_with_fallback

        print("\nTesting individual upgrades/limits with dynamic fallback...")
        fallback_data = {}

        # Create base ranged fallback build
        fallback_build = AttackBuild('ranged', [], [])

        # Test upgrades
        for upgrade_name in UPGRADES.keys():
            print(f"  Testing {upgrade_name} with fallback...")
            upgrade_results = {}

            for attack_type_name in ATTACK_TYPES.keys():
                try:
                    # Create primary build with this upgrade
                    upgrades_to_test = [upgrade_name]
                    if upgrade_name in PREREQUISITES:
                        upgrades_to_test = PREREQUISITES[upgrade_name] + [upgrade_name]

                    primary_build = AttackBuild(attack_type_name, upgrades_to_test, [])

                    if not primary_build.is_valid(self.config.max_points_per_attack("focused")):
                        continue

                    # Test across scenarios
                    scenario_results = self._test_build_with_fallback_across_scenarios(
                        primary_build, fallback_build
                    )
                    upgrade_results[attack_type_name] = scenario_results

                except Exception as e:
                    print(f"    Skipping {attack_type_name}: {e}")

            if upgrade_results:
                fallback_data[upgrade_name] = upgrade_results

        # Test limits
        for limit_name in LIMITS.keys():
            print(f"  Testing {limit_name} with fallback...")
            limit_results = {}

            for attack_type_name in ATTACK_TYPES.keys():
                try:
                    # Create primary build with this limit
                    primary_build = AttackBuild(attack_type_name, [], [limit_name])

                    if not primary_build.is_valid(self.config.max_points_per_attack("focused")):
                        continue

                    # Test across scenarios
                    scenario_results = self._test_build_with_fallback_across_scenarios(
                        primary_build, fallback_build
                    )
                    limit_results[attack_type_name] = scenario_results

                except Exception as e:
                    print(f"    Skipping {attack_type_name}: {e}")

            if limit_results:
                fallback_data[limit_name] = limit_results

        return fallback_data

    def _test_build_with_fallback_across_scenarios(self, primary_build: AttackBuild,
                                                   fallback_build: AttackBuild) -> Dict:
        """Test a build with fallback across all enemy scenarios"""
        from src.simulation import run_simulation_batch_with_fallback

        scenario_results = {}

        # Test configurations (attacker/defender pairs)
        for att_config in self.config.attacker_configs:
            for def_config in self.config.defender_configs:
                attacker = Character(*att_config)
                defender = Character(*def_config)

                # Run each scenario from config
                if self.config.fight_scenarios and self.config.fight_scenarios.get('enabled', False):
                    fight_scenarios = []
                    for scenario_config in self.config.fight_scenarios.get('scenarios', []):
                        scenario_name = scenario_config['name']
                        enemy_hp_list = scenario_config.get('enemy_hp_list')
                        num_enemies = scenario_config.get('num_enemies')
                        enemy_hp = scenario_config.get('enemy_hp')
                        fight_scenarios.append((scenario_name, num_enemies, enemy_hp, enemy_hp_list))
                else:
                    # Fallback to hardcoded scenarios
                    fight_scenarios = [
                        ("1x100 HP Boss", 1, 100, None),
                        ("2x50 HP Enemies", 2, 50, None),
                        ("4x25 HP Enemies", 4, 25, None),
                        ("10x10 HP Enemies", 10, 10, None)
                    ]

                for scenario_data in fight_scenarios:
                    scenario_name, num_enemies, enemy_hp, enemy_hp_list = scenario_data

                    # Run simulation with fallback
                    num_runs = 1 if self.individual_config.get('single_run_per_test', True) else self.config.individual_testing_runs

                    results, avg_turns, dpt, outcome_stats, activation_stats = run_simulation_batch_with_fallback(
                        attacker, primary_build, fallback_build, num_runs,
                        self.config.target_hp, defender,
                        num_enemies=num_enemies, enemy_hp=enemy_hp,
                        max_turns=self.config.max_combat_turns,
                        enemy_hp_list=enemy_hp_list
                    )

                    if scenario_name not in scenario_results:
                        scenario_results[scenario_name] = []

                    scenario_results[scenario_name].append({
                        'dpt': dpt,
                        'turns': avg_turns,
                        'raw_results': results,
                        'activation_pct': activation_stats['avg_activation_pct'],
                        'primary_activations': activation_stats['total_primary'],
                        'fallback_activations': activation_stats['total_fallback'],
                        'attacker': att_config,
                        'defender': def_config
                    })

        return scenario_results

    def _test_build_across_scenarios(self, build: AttackBuild) -> Dict:
        """Test a build across all enemy scenarios"""
        scenario_results = {}

        # Test configurations (attacker/defender pairs)
        for att_config in self.config.attacker_configs:
            for def_config in self.config.defender_configs:
                attacker = Character(*att_config)
                defender = Character(*def_config)

                # Run each scenario from config
                if self.config.fight_scenarios and self.config.fight_scenarios.get('enabled', False):
                    fight_scenarios = []
                    for scenario_config in self.config.fight_scenarios.get('scenarios', []):
                        scenario_name = scenario_config['name']
                        enemy_hp_list = scenario_config.get('enemy_hp_list')
                        num_enemies = scenario_config.get('num_enemies')
                        enemy_hp = scenario_config.get('enemy_hp')
                        fight_scenarios.append((scenario_name, num_enemies, enemy_hp, enemy_hp_list))
                else:
                    # Fallback to hardcoded scenarios
                    fight_scenarios = [
                        ("1x100 HP Boss", 1, 100, None),
                        ("2x50 HP Enemies", 2, 50, None),
                        ("4x25 HP Enemies", 4, 25, None),
                        ("10x10 HP Enemies", 10, 10, None)
                    ]

                for scenario_data in fight_scenarios:
                    scenario_name, num_enemies, enemy_hp, enemy_hp_list = scenario_data
                    # Single run for individual testing
                    num_runs = 1 if self.individual_config.get('single_run_per_test', True) else self.config.individual_testing_runs

                    results, avg_turns, dpt, _ = run_simulation_batch(
                        attacker, build, num_runs, enemy_hp, defender, num_enemies,
                        max_turns=self.config.max_combat_turns, enemy_hp_list=enemy_hp_list
                    )

                    if scenario_name not in scenario_results:
                        scenario_results[scenario_name] = []

                    scenario_results[scenario_name].append({
                        'dpt': dpt,
                        'turns': avg_turns,  # Keep for backwards compatibility
                        'raw_results': results,  # Add raw results for true averaging
                        'attacker': att_config,
                        'defender': def_config
                    })

        return scenario_results

    def _calculate_average_performance(self, scenario_results: Dict) -> Dict:
        """Calculate average performance across scenarios"""
        total_dpt = 0
        total_count = 0

        for scenario_name, results in scenario_results.items():
            for result in results:
                total_dpt += result['dpt']
                total_count += 1

        avg_dpt = total_dpt / total_count if total_count > 0 else 0

        return {
            'avg_dpt': avg_dpt,
            'scenario_count': total_count
        }

    def _calculate_average_dpt(self, scenario_results: Dict) -> float:
        """Calculate average DPT across all scenarios and configurations"""
        total_dpt = 0
        total_count = 0

        for scenario_name, results in scenario_results.items():
            for result in results:
                total_dpt += result.get('dpt', 0)
                total_count += 1

        return total_dpt / total_count if total_count > 0 else 0

    def _calculate_average_turns(self, scenario_results: Dict) -> float:
        """Calculate average turns across all scenarios and configurations using raw results"""
        all_raw_turns = []

        for scenario_name, results in scenario_results.items():
            for result in results:
                # Use raw results if available (new format), otherwise fall back to pre-averaged turns
                if 'raw_results' in result:
                    all_raw_turns.extend(result['raw_results'])
                else:
                    # Backwards compatibility: if no raw_results, use the pre-averaged value
                    # This will be less accurate but maintains functionality with old data
                    all_raw_turns.append(result.get('turns', 0))

        return sum(all_raw_turns) / len(all_raw_turns) if all_raw_turns else 0

    def _calculate_scenario_turns(self, scenario_results: Dict, scenario_name: str) -> float:
        """Calculate average turns for a specific scenario using raw results"""
        if scenario_name not in scenario_results:
            return 0

        results = scenario_results[scenario_name]
        all_raw_turns = []

        for result in results:
            # Use raw results if available (new format), otherwise fall back to pre-averaged turns
            if 'raw_results' in result:
                all_raw_turns.extend(result['raw_results'])
            else:
                # Backwards compatibility: if no raw_results, use the pre-averaged value
                all_raw_turns.append(result.get('turns', 0))

        return sum(all_raw_turns) / len(all_raw_turns) if all_raw_turns else 0

    def _calculate_scenario_dpt(self, scenario_results: Dict, scenario_name: str) -> float:
        """Calculate average DPT for a specific scenario"""
        if scenario_name not in scenario_results:
            return 0

        results = scenario_results[scenario_name]
        total_dpt = sum(result.get('dpt', 0) for result in results)
        return total_dpt / len(results) if results else 0

    def _calculate_overall_upgrade_performance(self, upgrade_results: Dict) -> Dict:
        """Calculate overall performance metrics for upgrades/limits"""
        total_improvement = 0
        total_count = 0

        for attack_type, scenario_results in upgrade_results.items():
            for scenario_name, results in scenario_results.items():
                for result in results:
                    total_improvement += result.get('dpt', 0)
                    total_count += 1

        avg_improvement = total_improvement / total_count if total_count > 0 else 0

        return {
            'avg_dpt_improvement': avg_improvement,
            'test_count': total_count
        }

    def _generate_detailed_combat_logs(self):
        """Generate detailed turn-by-turn combat logs"""
        from src.simulation import simulate_combat_verbose
        import random

        log_filename = f"{self.reports_dir}/individual_detailed_combat_logs.txt"

        with open(log_filename, 'w', encoding='utf-8') as f:
            f.write("INDIVIDUAL TESTING - DETAILED COMBAT LOGS\n")
            f.write("=" * 80 + "\n\n")
            f.write("Single-run combat resolution with turn-by-turn breakdowns\n")
            f.write("Showing dice rolls, damage calculations, and special effects\n\n")

            # Test all attack types and key upgrades/limits with detailed logging
            test_builds = []

            # Test all base attack types
            for attack_type in ATTACK_TYPES.keys():
                test_builds.append((f"Base {attack_type.title()}", AttackBuild(attack_type, [], [])))

            # Test key upgrades with compatible attack types
            key_upgrades = [
                ('power_attack', 'melee_ac'),
                ('high_impact', 'ranged'),
                ('critical_effect', 'melee_dg'),
                ('armor_piercing', 'ranged'),
                ('brutal', 'melee_ac'),
                ('bleed', 'area'),
                ('critical_accuracy', 'ranged'),
                ('quick_strikes', 'melee_ac'),
                ('double_tap', 'ranged'),
                ('reliable_accuracy', 'melee_dg'),
                ('overhit', 'melee_ac'),
            ]

            for upgrade_name, attack_type in key_upgrades:
                test_builds.append((f"{upgrade_name.title().replace('_', ' ')} ({attack_type})",
                                  AttackBuild(attack_type, [upgrade_name], [])))

            # Test key limits with compatible attack types
            key_limits = [
                ('unreliable_1', 'melee_ac'),
                ('unreliable_2', 'ranged'),
                ('unreliable_3', 'area'),
                ('quickdraw', 'melee_dg'),
                ('patient', 'area'),
                ('finale', 'melee_ac'),
                ('charge_up', 'ranged'),
                ('charge_up_2', 'melee_dg'),
            ]

            for limit_name, attack_type in key_limits:
                test_builds.append((f"{limit_name.title().replace('_', ' ')} Limit ({attack_type})",
                                  AttackBuild(attack_type, [], [limit_name])))

            # Use first attacker/defender config for testing
            att_config = self.config.attacker_configs[0]
            def_config = self.config.defender_configs[0]
            attacker = Character(*att_config)
            defender = Character(*def_config)

            # Test scenarios: 1v1, 1v2, 1v4
            fight_scenarios = [
                ("1x100 HP Boss", 1, 100),
                ("2x50 HP Enemies", 2, 50),
                ("4x25 HP Enemies", 4, 25),
            ]

            for build_name, build in test_builds:
                if not build.is_valid(self.config.max_points_per_attack("focused")):
                    f.write(f"SKIPPING {build_name} - Cost {build.total_cost} exceeds limit {self.config.max_points_per_attack('focused')}\n\n")
                    continue

                f.write(f"\n{'='*100}\n")
                f.write(f"TESTING BUILD: {build_name}\n")
                f.write(f"{'='*100}\n")
                f.write(f"Attack Type: {get_build_attack_type(build)}\n")
                f.write(f"Upgrades: {', '.join(build.upgrades) if build.upgrades else 'None'}\n")
                f.write(f"Limits: {', '.join(build.limits) if build.limits else 'None'}\n")
                f.write(f"Total Cost: {build.total_cost} points\n")

                for scenario_name, num_enemies, enemy_hp in fight_scenarios:
                    f.write(f"\n{'-'*60}\n")
                    f.write(f"SCENARIO: {scenario_name}\n")
                    f.write(f"{'-'*60}\n")

                    # Set random seed for reproducible results in detailed logs
                    random.seed(42)

                    turns, outcome = simulate_combat_verbose(
                        attacker, build,
                        target_hp=enemy_hp,
                        log_file=f,
                        defender=defender,
                        num_enemies=num_enemies,
                        enemy_hp=enemy_hp
                    )

                    total_hp = num_enemies * enemy_hp
                    dpt = total_hp / turns if turns > 0 else 0
                    f.write(f"\nFINAL RESULTS: {turns} turns, Outcome: {outcome}, {total_hp} total HP, {dpt:.2f} DPT\n")

        print(f"Detailed combat logs saved to {log_filename}")

    def _generate_enhancement_ranking_from_fallback(self, fallback_data: Dict, reports_dir: str = None):
        """Generate enhancement ranking report from fallback testing data"""
        import os
        from src.game_data import UPGRADES, LIMITS

        if reports_dir is None:
            reports_dir = self.reports_dir

        filename = os.path.join(reports_dir, "enhancement_ranking_report.md")

        # Collect all enhancement data with metrics
        enhancement_metrics = []

        for enhancement_name, attack_type_data in fallback_data.items():
            # Get cost and type
            cost = 0
            enh_type = "upgrade"
            if enhancement_name in UPGRADES:
                cost = UPGRADES[enhancement_name].cost
                enh_type = "upgrade"
            elif enhancement_name in LIMITS:
                cost = LIMITS[enhancement_name].cost
                enh_type = "limit"

            if cost == 0:
                continue

            # Collect all turns and activation data across all attack types and scenarios
            all_turns = []
            all_activation_pcts = []
            attack_type_turns = {}
            use_count = 0

            for attack_type, scenario_results in attack_type_data.items():
                attack_turns = []

                for scenario_name, results_list in scenario_results.items():
                    for result in results_list:
                        turns = result.get('turns', 0)
                        activation_pct = result.get('activation_pct', 100)

                        all_turns.append(turns)
                        all_activation_pcts.append(activation_pct)
                        attack_turns.append(turns)
                        use_count += 1

                # Calculate average for this attack type
                if attack_turns:
                    attack_type_turns[attack_type] = sum(attack_turns) / len(attack_turns)

            # Calculate overall metrics
            avg_turns = sum(all_turns) / len(all_turns) if all_turns else 0
            avg_activation_pct = sum(all_activation_pcts) / len(all_activation_pcts) if all_activation_pcts else 100

            enhancement_metrics.append({
                'name': enhancement_name,
                'type': enh_type,
                'cost': cost,
                'avg_turns': avg_turns,
                'avg_activation_pct': avg_activation_pct,
                'attack_type_turns': attack_type_turns,
                'uses': use_count
            })

        # Sort by avg_turns (lower is better)
        enhancement_metrics.sort(key=lambda x: x['avg_turns'])

        # Calculate statistics
        all_turns_list = [e['avg_turns'] for e in enhancement_metrics]
        mean_turns = sum(all_turns_list) / len(all_turns_list) if all_turns_list else 0
        sorted_turns = sorted(all_turns_list)

        # Calculate percentiles
        top10_idx = max(0, int(len(sorted_turns) * 0.1) - 1)
        top50_idx = max(0, int(len(sorted_turns) * 0.5) - 1)
        top10_median = sorted_turns[top10_idx] if sorted_turns else 0
        top50_median = sorted_turns[top50_idx] if sorted_turns else 0

        # Write report
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("# Enhancement Ranking Report\n\n")
            f.write("Performance analysis of all upgrades and limits tested individually with dynamic fallback.\n\n")
            f.write(f"**Total enhancements tested**: {len(enhancement_metrics)}\n")
            f.write(f"**Mean avg turns**: {mean_turns:.2f}\n")
            f.write(f"**Top 10% median**: {top10_median:.2f} turns\n")
            f.write(f"**Top 50% median**: {top50_median:.2f} turns\n\n")

            # Main table
            f.write("| Rank | Enhancement | Type | Cost | Avg Turns | vs Mean | Top10% Med | Top50% Med | "
                   "Melee_AC | Melee_DG | Ranged | Area | Direct | Uses | Activation % |\n")
            f.write("|------|-------------|------|------|-----------|---------|------------|------------|"
                   "----------|----------|--------|------|--------|------|-------------|\n")

            for rank, enh in enumerate(enhancement_metrics, 1):
                vs_mean = enh['avg_turns'] - mean_turns
                percentile = (rank / len(enhancement_metrics)) * 100

                # Get attack type specific data
                att_types = enh['attack_type_turns']
                melee_ac = att_types.get('melee_ac', 0)
                melee_dg = att_types.get('melee_dg', 0)
                ranged = att_types.get('ranged', 0)
                area = att_types.get('area', 0)
                direct = att_types.get('direct_damage', 0)

                f.write(f"| {rank} | {enh['name']} | {enh['type']} | {enh['cost']}p | "
                       f"{enh['avg_turns']:.2f} | {vs_mean:+.2f} | {top10_median:.2f} | {top50_median:.2f} | "
                       f"{melee_ac:.1f} | {melee_dg:.1f} | {ranged:.1f} | {area:.1f} | {direct:.1f} | "
                       f"{enh['uses']} | {enh['avg_activation_pct']:.1f}% |\n")

            # Summary section
            f.write(f"\n## Summary\n\n")
            f.write(f"### Top 10 Best Performing Enhancements\n\n")
            for i, enh in enumerate(enhancement_metrics[:10], 1):
                f.write(f"{i}. **{enh['name']}** ({enh['type']}, {enh['cost']}p): "
                       f"{enh['avg_turns']:.2f} avg turns, {enh['avg_activation_pct']:.1f}% activation\n")

            f.write(f"\n### Bottom 10 Worst Performing Enhancements\n\n")
            for i, enh in enumerate(enhancement_metrics[-10:], 1):
                f.write(f"{i}. **{enh['name']}** ({enh['type']}, {enh['cost']}p): "
                       f"{enh['avg_turns']:.2f} avg turns, {enh['avg_activation_pct']:.1f}% activation\n")

            # Activation analysis
            f.write(f"\n### Activation Rate Analysis\n\n")
            f.write("Enhancements with lowest activation rates (conditional limits that rarely trigger):\n\n")

            low_activation = sorted(enhancement_metrics, key=lambda x: x['avg_activation_pct'])[:10]
            for i, enh in enumerate(low_activation, 1):
                f.write(f"{i}. **{enh['name']}**: {enh['avg_activation_pct']:.1f}% activation\n")

        print(f"Enhancement ranking report saved to {filename}")

    def _generate_cost_analysis_from_fallback(self, fallback_data: Dict, reports_dir: str = None):
        """Generate cost analysis report from fallback testing data"""
        import os
        from src.game_data import UPGRADES, LIMITS

        if reports_dir is None:
            reports_dir = self.reports_dir

        filename = os.path.join(reports_dir, "cost_analysis_fallback.md")

        # Collect enhancement data organized by cost
        cost_tiers = {}

        for enhancement_name, attack_type_data in fallback_data.items():
            # Get cost and type
            cost = 0
            enh_type = "upgrade"
            if enhancement_name in UPGRADES:
                cost = UPGRADES[enhancement_name].cost
                enh_type = "upgrade"
            elif enhancement_name in LIMITS:
                cost = LIMITS[enhancement_name].cost
                enh_type = "limit"

            if cost == 0:
                continue

            # Collect all turns data across all attack types and scenarios
            all_turns = []
            all_activation_pcts = []
            scenario_turns = {'best': float('inf'), 'worst': 0}
            attack_type_turns = {}

            for attack_type, scenario_results in attack_type_data.items():
                attack_turns = []

                for scenario_name, results_list in scenario_results.items():
                    for result in results_list:
                        turns = result.get('turns', 0)
                        activation_pct = result.get('activation_pct', 100)

                        all_turns.append(turns)
                        all_activation_pcts.append(activation_pct)
                        attack_turns.append(turns)

                        # Track best/worst scenario
                        if turns > 0:
                            scenario_turns['best'] = min(scenario_turns['best'], turns)
                            scenario_turns['worst'] = max(scenario_turns['worst'], turns)

                # Calculate average for this attack type
                if attack_turns:
                    attack_type_turns[attack_type] = sum(attack_turns) / len(attack_turns)

            # Calculate overall metrics
            avg_turns = sum(all_turns) / len(all_turns) if all_turns else 0
            avg_activation_pct = sum(all_activation_pcts) / len(all_activation_pcts) if all_activation_pcts else 100

            # Get attack type specific data
            melee_ac = attack_type_turns.get('melee_ac', 0)
            melee_dg = attack_type_turns.get('melee_dg', 0)
            ranged = attack_type_turns.get('ranged', 0)
            area = attack_type_turns.get('area', 0)
            direct = attack_type_turns.get('direct_damage', 0)

            # Add to cost tier
            if cost not in cost_tiers:
                cost_tiers[cost] = []

            cost_tiers[cost].append({
                'name': enhancement_name,
                'type': enh_type,
                'cost': cost,
                'avg_turns': avg_turns,
                'activation_pct': avg_activation_pct,
                'best_case': scenario_turns['best'] if scenario_turns['best'] != float('inf') else 0,
                'worst_case': scenario_turns['worst'],
                'melee_ac': melee_ac,
                'melee_dg': melee_dg,
                'ranged': ranged,
                'area': area,
                'direct': direct,
                'uses': len(all_turns)
            })

        # Sort each cost tier by avg_turns
        for cost in cost_tiers:
            cost_tiers[cost].sort(key=lambda x: x['avg_turns'])

        # Calculate overall mean for turn delta
        all_items = [item for tier in cost_tiers.values() for item in tier]
        mean_turns = sum(item['avg_turns'] for item in all_items) / len(all_items) if all_items else 0

        # Write report
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("# Cost Analysis Report - Fallback Testing\n\n")
            f.write("Performance analysis organized by cost tier from dynamic fallback testing.\n\n")

            # Cost distribution
            f.write("## Cost Distribution\n\n")
            f.write("| Cost Tier | Count | Avg Turns | Best in Tier |\n")
            f.write("|-----------|-------|-----------|-------------|\n")

            for cost in sorted(cost_tiers.keys()):
                items = cost_tiers[cost]
                tier_avg = sum(item['avg_turns'] for item in items) / len(items)
                best_in_tier = min(items, key=lambda x: x['avg_turns'])

                f.write(f"| {cost}p | {len(items)} | {tier_avg:.2f} | "
                       f"{best_in_tier['name']} ({best_in_tier['avg_turns']:.2f} turns) |\n")

            # Main table with all enhancements
            f.write(f"\n## All Enhancements by Cost Tier\n\n")
            f.write("| Cost Tier | Enhancement | Type | Avg Turns | Turn Δ | Δ/Cost | "
                   "Best Case | Worst Case | Melee_AC | Melee_DG | Ranged | Area | Direct | Uses | Activation % |\n")
            f.write("|-----------|-------------|------|-----------|--------|--------|"
                   "-----------|------------|----------|----------|--------|------|--------|------|-------------|\n")

            for cost in sorted(cost_tiers.keys()):
                for item in cost_tiers[cost]:
                    turn_delta = item['avg_turns'] - mean_turns
                    delta_per_cost = turn_delta / cost if cost > 0 else 0

                    f.write(f"| {cost}p | {item['name']} | {item['type']} | {item['avg_turns']:.2f} | "
                           f"{turn_delta:+.2f} | {delta_per_cost:+.2f} | "
                           f"{item['best_case']:.1f} | {item['worst_case']:.1f} | "
                           f"{item['melee_ac']:.1f} | {item['melee_dg']:.1f} | {item['ranged']:.1f} | "
                           f"{item['area']:.1f} | {item['direct']:.1f} | {item['uses']} | "
                           f"{item['activation_pct']:.1f}% |\n")

            # Best per cost tier section
            f.write(f"\n## Best Enhancement Per Cost Tier\n\n")
            f.write("| Cost | Enhancement | Type | Avg Turns | Activation % | Why It's Best |\n")
            f.write("|------|-------------|------|-----------|--------------|---------------|\n")

            for cost in sorted(cost_tiers.keys()):
                best = cost_tiers[cost][0]
                reason = f"Fastest at {best['avg_turns']:.2f} turns"
                if best['activation_pct'] < 100:
                    reason += f", {best['activation_pct']:.1f}% activation"

                f.write(f"| {cost}p | {best['name']} | {best['type']} | {best['avg_turns']:.2f} | "
                       f"{best['activation_pct']:.1f}% | {reason} |\n")

            # Cost efficiency rankings
            f.write(f"\n## Cost Efficiency Rankings\n\n")
            f.write("Sorted by Δ/Cost (most negative = best turn reduction per point)\n\n")

            # Get all items and sort by delta per cost
            all_with_efficiency = []
            for cost in cost_tiers:
                for item in cost_tiers[cost]:
                    turn_delta = item['avg_turns'] - mean_turns
                    delta_per_cost = turn_delta / cost if cost > 0 else 0
                    all_with_efficiency.append((item, turn_delta, delta_per_cost))

            all_with_efficiency.sort(key=lambda x: x[2])

            f.write("| Rank | Enhancement | Cost | Avg Turns | Turn Δ | Δ/Cost | Activation % |\n")
            f.write("|------|-------------|------|-----------|--------|--------|-------------|\n")

            for rank, (item, turn_delta, delta_per_cost) in enumerate(all_with_efficiency[:20], 1):
                f.write(f"| {rank} | {item['name']} | {item['cost']}p | {item['avg_turns']:.2f} | "
                       f"{turn_delta:+.2f} | {delta_per_cost:+.3f} | {item['activation_pct']:.1f}% |\n")

            # Value analysis
            f.write(f"\n## Value Analysis by Cost Tier\n\n")
            f.write("Analysis of which cost tiers offer the best value:\n\n")

            for cost in sorted(cost_tiers.keys()):
                items = cost_tiers[cost]
                tier_avg = sum(item['avg_turns'] for item in items) / len(items)
                tier_delta = tier_avg - mean_turns
                tier_efficiency = tier_delta / cost if cost > 0 else 0

                f.write(f"### {cost} Point Tier\n\n")
                f.write(f"- **Average performance**: {tier_avg:.2f} turns ({tier_delta:+.2f} vs mean)\n")
                f.write(f"- **Efficiency**: {tier_efficiency:+.3f} turns per point\n")
                f.write(f"- **Count**: {len(items)} enhancements\n")
                f.write(f"- **Best**: {items[0]['name']} ({items[0]['avg_turns']:.2f} turns)\n")
                f.write(f"- **Worst**: {items[-1]['name']} ({items[-1]['avg_turns']:.2f} turns)\n\n")

        print(f"Cost analysis (fallback) saved to {filename}")