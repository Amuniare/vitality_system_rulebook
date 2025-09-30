"""
Report writers for the Vitality System combat simulator.

This module contains functions that write report data to files.
"""

import statistics
from typing import Dict, List, Tuple
from src.models import Character, AttackBuild, SimulationConfig
from src.simulation import run_simulation_batch


def write_upgrade_performance_report(enhancement_results: Dict, config: SimulationConfig, reports_dir: str = "reports"):
    """Write comprehensive enhancement (upgrade and limit) performance report to file"""
    with open(f'{reports_dir}/enhancement_performance_summary.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - INDIVIDUAL ENHANCEMENT PERFORMANCE ANALYSIS\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows how each enhancement (upgrade or limit) performs individually compared to base attacks.\n")
        f.write("Improvements are measured in Damage Per Turn (DPT) increases across all enemy scenarios.\n\n")

        # Sort by cost effectiveness
        sorted_enhancements = sorted(enhancement_results.values(), key=lambda x: x['cost_effectiveness'], reverse=True)

        f.write("ENHANCEMENT COST-EFFECTIVENESS RANKING\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Enhancement':<25} {'Cost':<6} {'Avg DPT+':<10} {'Avg %+':<10} {'DPT/Cost':<10}\n")
        f.write("-" * 80 + "\n")

        for i, enhancement_data in enumerate(sorted_enhancements, 1):
            f.write(f"{i:<4} {enhancement_data['name']:<25} {enhancement_data['cost']:>4}p "
                   f"{enhancement_data['overall_avg_improvement']:>8.1f} "
                   f"{(enhancement_data['overall_avg_improvement']/enhancement_data['overall_avg_dpt']*100) if enhancement_data['overall_avg_dpt'] > 0 else 0:>8.1f}% "
                   f"{enhancement_data['cost_effectiveness']:>8.2f}\n")

        # Sort by absolute DPT improvement
        sorted_by_dpt = sorted(enhancement_results.values(), key=lambda x: x['overall_avg_improvement'], reverse=True)

        f.write(f"\n\nENHANCEMENT ABSOLUTE DPT IMPROVEMENT RANKING\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Enhancement':<25} {'Cost':<6} {'Avg DPT+':<10} {'Best Attack Type':<15}\n")
        f.write("-" * 80 + "\n")

        for i, enhancement_data in enumerate(sorted_by_dpt, 1):
            # Find best attack type for this enhancement
            best_attack_type = ""
            best_improvement = 0
            for attack_type, results in enhancement_data['attack_type_results'].items():
                if results['avg_improvement'] > best_improvement:
                    best_improvement = results['avg_improvement']
                    best_attack_type = f"{attack_type} (+{best_improvement:.1f})"

            f.write(f"{i:<4} {enhancement_data['name']:<25} {enhancement_data['cost']:>4}p "
                   f"{enhancement_data['overall_avg_improvement']:>8.1f} {best_attack_type:<15}\n")

        # Detailed per-enhancement analysis
        f.write(f"\n\nDETAILED ENHANCEMENT ANALYSIS\n")
        f.write("="*80 + "\n")

        for enhancement_name, enhancement_data in sorted(enhancement_results.items()):
            f.write(f"\n{enhancement_data['name'].upper()}\n")
            f.write(f"Cost: {enhancement_data['cost']} points | Overall Avg DPT Improvement: {enhancement_data['overall_avg_improvement']:.1f} | Cost Effectiveness: {enhancement_data['cost_effectiveness']:.2f}\n")
            f.write("-" * 60 + "\n")

            for attack_type, results in enhancement_data['attack_type_results'].items():
                # Handle both upgrade and limit result keys
                enhanced_dpt_key = 'avg_upgrade_dpt' if 'avg_upgrade_dpt' in results else 'avg_limit_dpt'
                f.write(f"{attack_type.title()}: Base {results['avg_base_dpt']:.1f} DPT → {results[enhanced_dpt_key]:.1f} DPT "
                       f"(+{results['avg_improvement']:.1f}, {results['avg_percent_improvement']:+.1f}%)\n")


    print(f"Enhancement performance report saved to {reports_dir}/enhancement_performance_summary.txt")



def write_combo_performance_report(combo_results: Dict, config: SimulationConfig, reports_dir: str = "reports"):
    """Write comprehensive combo performance report to file"""
    with open(f'{reports_dir}/combo_performance_summary.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - SPECIFIC UPGRADE COMBO PERFORMANCE ANALYSIS\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows how specific two-upgrade combinations perform compared to base attacks.\n")
        f.write("Focus on cheap, synergistic combinations that work well together.\n")
        f.write("Improvements are measured in Damage Per Turn (DPT) increases across all enemy scenarios.\n\n")

        # Sort by cost effectiveness
        sorted_combos = sorted(combo_results.values(), key=lambda x: x['cost_effectiveness'], reverse=True)

        f.write("COMBO COST-EFFECTIVENESS RANKING\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Combo':<35} {'Cost':<6} {'Avg DPT+':<10} {'Avg %+':<10} {'DPT/Cost':<10}\n")
        f.write("-" * 80 + "\n")

        for i, combo_data in enumerate(sorted_combos, 1):
            f.write(f"{i:<4} {combo_data['name']:<35} {combo_data['cost']:>4}p "
                   f"{combo_data['overall_avg_improvement']:>8.1f} "
                   f"{(combo_data['overall_avg_improvement']/combo_data['overall_avg_dpt']*100) if combo_data['overall_avg_dpt'] > 0 else 0:>8.1f}% "
                   f"{combo_data['cost_effectiveness']:>8.2f}\n")

        # Sort by absolute DPT improvement
        sorted_by_dpt = sorted(combo_results.values(), key=lambda x: x['overall_avg_improvement'], reverse=True)

        f.write(f"\n\nCOMBO ABSOLUTE DPT IMPROVEMENT RANKING\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Combo':<35} {'Cost':<6} {'Avg DPT+':<10} {'Best Attack Type':<15}\n")
        f.write("-" * 80 + "\n")

        for i, combo_data in enumerate(sorted_by_dpt, 1):
            # Find best attack type for this combo
            best_attack_type = ""
            best_improvement = 0
            for attack_type, results in combo_data['attack_type_results'].items():
                if results['avg_improvement'] > best_improvement:
                    best_improvement = results['avg_improvement']
                    best_attack_type = f"{attack_type} (+{best_improvement:.1f})"

            f.write(f"{i:<4} {combo_data['name']:<35} {combo_data['cost']:>4}p "
                   f"{combo_data['overall_avg_improvement']:>8.1f} {best_attack_type:<15}\n")

        # Detailed per-combo analysis
        f.write(f"\n\nDETAILED COMBO ANALYSIS\n")
        f.write("="*80 + "\n")

        for combo_name, combo_data in sorted(combo_results.items()):
            f.write(f"\n{combo_data['name'].upper()}\n")
            f.write(f"Upgrades: {', '.join(combo_data['upgrades'])}\n")
            f.write(f"Cost: {combo_data['cost']} points | Overall Avg DPT Improvement: {combo_data['overall_avg_improvement']:.1f} | Cost Effectiveness: {combo_data['cost_effectiveness']:.2f}\n")
            f.write("-" * 60 + "\n")

            for attack_type, results in combo_data['attack_type_results'].items():
                f.write(f"{attack_type.title()}: Base {results['avg_base_dpt']:.1f} DPT → {results['avg_combo_dpt']:.1f} DPT "
                       f"(+{results['avg_improvement']:.1f}, {results['avg_percent_improvement']:+.1f}%)\n")

    print(f"Combo performance report saved to {reports_dir}/combo_performance_summary.txt")



def build_turns_table(all_build_results: List[Tuple], config: SimulationConfig, reports_dir: str = "reports"):
    """Generate table of builds sorted by average turns (ascending)"""
    print("Generating build turns table report...")

    # Extract build data with turns - all_build_results now contains (build, avg_turns)
    build_data = []
    for rank, (build, avg_turns) in enumerate(all_build_results, 1):
        build_data.append({
            'original_rank': rank,
            'build': build,
            'avg_turns': avg_turns
        })

    # Sort by average turns (ascending - lower turns is better)
    build_data.sort(key=lambda x: x['avg_turns'])

    # Write the report
    with open(f'{reports_dir}/build_turns_table.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - BUILD RANKING BY AVERAGE TURNS\n")
        f.write("="*80 + "\n\n")
        f.write("Builds ranked by average turns to complete combat (lower is better).\n")
        f.write(f"Total builds: {len(build_data)}\n\n")

        # Table header
        f.write(f"{'Rank':<6} {'Avg Turns':<10} {'Orig Rank':<10} {'Build Description':<50}\n")
        f.write("-" * 90 + "\n")

        # Write top 50 builds by turns
        for i, data in enumerate(build_data[:50], 1):
            build = data['build']
            build_desc = f"{build.attack_type}"
            if build.upgrades:
                build_desc += f" + {', '.join(build.upgrades)}"
            if build.limits:
                build_desc += f" + {', '.join(build.limits)}"

            f.write(f"{i:<6} {data['avg_turns']:<10.1f} "
                   f"{data['original_rank']:<10} {build_desc:<50}\n")

        # Summary statistics
        f.write(f"\n\nSUMMARY STATISTICS\n")
        f.write("-" * 40 + "\n")
        all_turns = [data['avg_turns'] for data in build_data]
        f.write(f"Best (lowest) turns: {min(all_turns):.1f}\n")
        f.write(f"Worst (highest) turns: {max(all_turns):.1f}\n")
        f.write(f"Average turns: {sum(all_turns)/len(all_turns):.1f}\n")
        f.write(f"Median turns: {sorted(all_turns)[len(all_turns)//2]:.1f}\n")

    print(f"Build turns table saved to {reports_dir}/build_turns_table.txt")
    return build_data



def write_builds_turns_table(builds: List[AttackBuild], config: SimulationConfig, reports_dir: str = "reports"):
    """Write a builds table with average turns until defeat as the main metric"""
    if not builds:
        print("No builds to analyze for turns table.")
        return

    # Calculate turns until defeat for each build
    build_results = []
    for build in builds[:100]:  # Show top 100 builds
        total_turns = 0
        total_dpt = 0
        total_configs = 0

        # Define the same fight scenarios as main simulation
        fight_scenarios = [
            ("Fight 1: 1x100 HP Boss", 1, 100),
            ("Fight 2: 2x50 HP Enemies", 2, 50),
            ("Fight 3: 4x25 HP Enemies", 4, 25),
            ("Fight 4: 10x10 HP Enemies", 10, 10)
        ]

        for att_config in config.attacker_configs:
            for def_config in config.defender_configs:
                attacker = Character(*att_config)
                defender = Character(*def_config)

                # Average across all fight scenarios for this config
                case_total_dpt = 0
                case_total_turns = 0
                scenario_count = 0

                for scenario_name, num_enemies, enemy_hp in fight_scenarios:
                    _, avg_turns, dpt = run_simulation_batch(
                        attacker, build, config.build_testing_runs, config.target_hp, defender,
                        num_enemies=num_enemies, enemy_hp=enemy_hp)

                    case_total_dpt += dpt
                    case_total_turns += avg_turns
                    scenario_count += 1

                # Average DPT and turns across the 4 scenarios for this case
                case_avg_dpt = case_total_dpt / scenario_count if scenario_count > 0 else 0
                case_avg_turns = case_total_turns / scenario_count if scenario_count > 0 else 0

                total_turns += case_avg_turns
                total_dpt += case_avg_dpt
                total_configs += 1

        avg_turns = total_turns / total_configs if total_configs > 0 else 0
        avg_dpt = total_dpt / total_configs if total_configs > 0 else 0
        build_results.append((build, avg_dpt, avg_turns))

    # Sort by average turns (lower is better)
    build_results.sort(key=lambda x: x[2])

    # Write the results
    with open(f'{reports_dir}/builds_turns_table.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - BUILDS PERFORMANCE TABLE\n")
        f.write("="*80 + "\n\n")
        f.write("Builds ranked by average turns until defeat (lower = faster kills)\n")
        f.write(f"Total builds analyzed: {len(build_results)}\n\n")

        # Header
        f.write(f"{'Rank':<5} {'Avg Turns':<10} {'Attack Type':<15} {'Upgrades & Limits':<40}\n")
        f.write("-" * 70 + "\n")

        # Build entries
        for i, (build, avg_turns) in enumerate(build_results, 1):
            # Format enhancements (upgrades + limits)
            enhancements = []
            if build.upgrades:
                enhancements.extend(build.upgrades)
            if build.limits:
                enhancements.extend(build.limits)

            enhancements_str = ", ".join(enhancements) if enhancements else "Base"
            if len(enhancements_str) > 40:
                enhancements_str = enhancements_str[:37] + "..."

            f.write(f"{i:<5} {avg_turns:<10.2f} {build.attack_type:<15} {enhancements_str:<40}\n")

        # Summary statistics
        f.write(f"\n\nSUMMARY STATISTICS\n")
        f.write("-" * 40 + "\n")
        all_turns = [x[1] for x in build_results]
        f.write(f"Fastest kill time: {min(all_turns):.2f} turns\n")
        f.write(f"Slowest kill time: {max(all_turns):.2f} turns\n")
        f.write(f"Average kill time: {sum(all_turns)/len(all_turns):.2f} turns\n")
        f.write(f"Median kill time: {statistics.median(all_turns):.2f} turns\n")

        # Top 10 fastest builds
        f.write(f"\n\nTOP 10 FASTEST BUILDS\n")
        f.write("-" * 40 + "\n")
        for i, (build, avg_turns, avg_dpt) in enumerate(build_results[:10], 1):
            enhancements = []
            if build.upgrades:
                enhancements.extend(build.upgrades)
            if build.limits:
                enhancements.extend(build.limits)
            enhancements_str = ", ".join(enhancements) if enhancements else "Base"

            f.write(f"{i}. {build.attack_type} ({avg_turns:.2f} turns, {avg_dpt:.1f} DPT)\n")
            f.write(f"   Enhancements: {enhancements_str}\n\n")

    print(f"Builds turns table saved to {reports_dir}/builds_turns_table.txt")



def write_build_summary(builds: List[AttackBuild], config: SimulationConfig, reports_dir: str = "reports"):
    """Write a summary of the top builds to file"""
    if not builds:
        print("No builds to summarize.")
        return

    # Calculate DPT for each build
    build_results = []
    for build in builds[:50]:  # Show top 50 builds
        total_dpt = 0
        total_turns = 0
        total_configs = 0

        for att_config in config.attacker_configs:
            for def_config in config.defender_configs:
                attacker = Character(*att_config)
                defender = Character(*def_config)

                _, avg_turns, dpt = run_simulation_batch(
                    attacker, build, config.build_testing_runs, config.target_hp, defender)

                total_dpt += dpt
                total_turns += avg_turns
                total_configs += 1

        avg_dpt = total_dpt / total_configs if total_configs > 0 else 0
        avg_turns = total_turns / total_configs if total_configs > 0 else 0
        build_results.append((build, avg_dpt, avg_turns))

    # Sort by average DPT
    build_results.sort(key=lambda x: x[1], reverse=True)

    # Calculate attack type statistics
    attack_type_results = {}
    for build, avg_dpt, avg_turns in build_results:
        attack_type = build.attack_type
        if attack_type not in attack_type_results:
            attack_type_results[attack_type] = []
        attack_type_results[attack_type].append(avg_dpt)

    attack_type_summary = []
    for attack_type, dpts in attack_type_results.items():
        avg_dpt = sum(dpts) / len(dpts)
        best_dpt = max(dpts)
        worst_dpt = min(dpts)
        count = len(dpts)
        attack_type_summary.append({
            'type': attack_type,
            'avg_dpt': avg_dpt,
            'best_dpt': best_dpt,
            'worst_dpt': worst_dpt,
            'count': count
        })

    attack_type_summary.sort(key=lambda x: x['avg_dpt'], reverse=True)

    with open(f'{reports_dir}/build_summary.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - BUILD PERFORMANCE SUMMARY\n")
        f.write("="*80 + "\n\n")
        f.write(f"Top {len(build_results)} builds ranked by average DPT across all test configurations:\n\n")

        for i, (build, avg_dpt, avg_turns) in enumerate(build_results, 1):
            f.write(f"{i:2d}. {build} | Avg DPT: {avg_dpt:.1f}\n")

        # Attack Type Performance Summary
        f.write(f"\n\nATTACK TYPE PERFORMANCE SUMMARY\n")
        f.write("-" * 80 + "\n")
        f.write(f"{'Rank':<4} {'Attack Type':<20} {'Avg DPT':<10} {'Best DPT':<10} {'Worst DPT':<11} {'Count':<6}\n")
        f.write("-" * 80 + "\n")

        for i, stats in enumerate(attack_type_summary, 1):
            f.write(f"{i:<4} {stats['type']:<20} {stats['avg_dpt']:>7.1f} "
                   f"{stats['best_dpt']:>8.1f} {stats['worst_dpt']:>9.1f} "
                   f"{stats['count']:>4}\n")

    print(f"Build summary saved to {reports_dir}/build_summary.txt")



def write_attack_type_enhancement_ranking_report(all_build_results: List[Tuple], enhancement_results: Dict, config: SimulationConfig, reports_dir: str = "reports"):
    """Generate comprehensive enhancement ranking reports broken down by attack type"""
    print("Generating attack-type-specific enhancement ranking report...")

    # Get all attack types
    attack_types = config.attack_types_filter if config.attack_types_filter else ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    with open(f'{reports_dir}/enhancement_ranking_by_attack_type.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - ENHANCEMENT RANKINGS BROKEN DOWN BY ATTACK TYPE\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows enhancement (upgrade & limit) performance rankings specifically for each attack type.\n")
        f.write("Three ranking methods are provided for each attack type:\n")
        f.write("1. Rankings by Average Position - based on build rank positions\n")
        f.write("2. Cost-Effectiveness Rankings - DPT improvement per point cost\n")
        f.write("3. Absolute DPT Improvement Rankings - raw DPT increases\n\n")

        for attack_type in attack_types:
            f.write(f"{'='*80}\n")
            f.write(f"ATTACK TYPE: {attack_type.upper()}\n")
            f.write(f"{'='*80}\n\n")

            # Filter builds for this attack type and track enhancement positions
            attack_type_builds = [(build, dpt, rank) for rank, (build, dpt, avg_turns) in enumerate(all_build_results, 1)
                                 if build.attack_type == attack_type]

            if not attack_type_builds:
                f.write(f"No builds found for attack type: {attack_type}\n\n")
                continue

            # Calculate enhancement rankings by average position for this attack type
            enhancement_rankings = {}
            for build, dpt, rank in attack_type_builds:
                # Track both upgrades and limits as enhancements
                for upgrade in build.upgrades:
                    if upgrade not in enhancement_rankings:
                        enhancement_rankings[upgrade] = []
                    enhancement_rankings[upgrade].append(rank)
                for limit in build.limits:
                    if limit not in enhancement_rankings:
                        enhancement_rankings[limit] = []
                    enhancement_rankings[limit].append(rank)

            # Calculate statistics for each enhancement
            enhancement_stats = []
            total_attack_type_builds = len(attack_type_builds)
            for enhancement_name, positions in enhancement_rankings.items():
                avg_position = sum(positions) / len(positions)
                median_position = statistics.median(positions)
                percentile = (median_position / total_attack_type_builds) * 100
                enhancement_stats.append({
                    'name': enhancement_name,
                    'avg_rank': avg_position,
                    'median_rank': median_position,
                    'percentile': percentile,
                    'appearances': len(positions),
                    'best_rank': min(positions),
                    'worst_rank': max(positions)
                })

            enhancement_stats.sort(key=lambda x: x['median_rank'])

            # 1. RANKINGS BY MEDIAN POSITION
            f.write(f"ENHANCEMENT RANKINGS BY MEDIAN POSITION - {attack_type.upper()}\n")
            f.write("-" * 95 + "\n")
            f.write(f"{'Rank':<4} {'Enhancement':<25} {'Avg Rank':<10} {'Med Rank':<10} {'Percentile':<12} {'Uses':<6} {'Best':<6} {'Worst':<6}\n")
            f.write("-" * 95 + "\n")

            for i, stats in enumerate(enhancement_stats, 1):
                f.write(f"{i:<4} {stats['name']:<25} {stats['avg_rank']:>8.1f} "
                       f"{stats['median_rank']:>8.1f} {stats['percentile']:>9.1f}% {stats['appearances']:>4} "
                       f"{stats['best_rank']:>4} {stats['worst_rank']:>5}\n")

            # 2. COST-EFFECTIVENESS RANKINGS
            f.write(f"\n\nENHANCEMENT COST-EFFECTIVENESS RANKING - {attack_type.upper()}\n")
            f.write("-" * 80 + "\n")
            f.write(f"{'Rank':<4} {'Enhancement':<25} {'Cost':<6} {'Avg DPT+':<10} {'Avg %+':<10} {'DPT/Cost':<10}\n")
            f.write("-" * 80 + "\n")

            # Get cost-effectiveness data for this attack type
            cost_eff_data = []
            for enhancement_name, enhancement_data in enhancement_results.items():
                if attack_type in enhancement_data['attack_type_results']:
                    attack_results = enhancement_data['attack_type_results'][attack_type]
                    cost = enhancement_data['cost']
                    improvement = attack_results['avg_improvement']
                    cost_effectiveness = improvement / cost if cost > 0 else 0
                    percent_improvement = attack_results['avg_percent_improvement']

                    cost_eff_data.append({
                        'name': enhancement_name,
                        'cost': cost,
                        'improvement': improvement,
                        'percent_improvement': percent_improvement,
                        'cost_effectiveness': cost_effectiveness
                    })

            cost_eff_data.sort(key=lambda x: x['cost_effectiveness'], reverse=True)

            for i, data in enumerate(cost_eff_data, 1):
                f.write(f"{i:<4} {data['name']:<25} {data['cost']:>4}p "
                       f"{data['improvement']:>8.1f} "
                       f"{data['percent_improvement']:>8.1f}% "
                       f"{data['cost_effectiveness']:>8.2f}\n")

            # 3. ABSOLUTE DPT IMPROVEMENT RANKINGS
            f.write(f"\n\nENHANCEMENT ABSOLUTE DPT IMPROVEMENT RANKING - {attack_type.upper()}\n")
            f.write("-" * 80 + "\n")
            f.write(f"{'Rank':<4} {'Enhancement':<25} {'Cost':<6} {'Avg DPT+':<10} {'% Improvement':<12}\n")
            f.write("-" * 80 + "\n")

            # Sort by absolute DPT improvement
            abs_improvement_data = sorted(cost_eff_data, key=lambda x: x['improvement'], reverse=True)

            for i, data in enumerate(abs_improvement_data, 1):
                f.write(f"{i:<4} {data['name']:<25} {data['cost']:>4}p "
                       f"{data['improvement']:>8.1f} "
                       f"{data['percent_improvement']:>10.1f}%\n")

            f.write(f"\n{'-'*80}\n\n")

    print(f"Attack-type-specific enhancement ranking report saved to {reports_dir}/enhancement_ranking_by_attack_type.txt")



def write_attack_type_limit_ranking_report(all_build_results: List[Tuple], limit_results: Dict, config: SimulationConfig, reports_dir: str = "reports"):
    """Generate comprehensive limit ranking reports broken down by attack type"""
    print("Generating attack-type-specific limit ranking report...")

    # Get all attack types
    attack_types = config.attack_types_filter if config.attack_types_filter else ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    with open(f'{reports_dir}/limit_ranking_by_attack_type.txt', 'w', encoding='utf-8') as f:
        f.write("VITALITY SYSTEM - LIMIT RANKINGS BROKEN DOWN BY ATTACK TYPE\n")
        f.write("="*80 + "\n\n")
        f.write("This report shows limit performance rankings specifically for each attack type.\n")
        f.write("Three ranking methods are provided for each attack type:\n")
        f.write("1. Rankings by Average Position - based on build rank positions\n")
        f.write("2. Cost-Effectiveness Rankings - DPT improvement per point cost\n")
        f.write("3. Absolute DPT Improvement Rankings - raw DPT increases\n\n")

        for attack_type in attack_types:
            f.write(f"{'='*80}\n")
            f.write(f"ATTACK TYPE: {attack_type.upper()}\n")
            f.write(f"{'='*80}\n\n")

            # Filter builds for this attack type and track limit positions
            attack_type_builds = [(build, dpt, rank) for rank, (build, dpt, avg_turns) in enumerate(all_build_results, 1)
                                 if build.attack_type == attack_type]

            if not attack_type_builds:
                f.write(f"No builds found for attack type: {attack_type}\n\n")
                continue

            # Calculate limit rankings by average position for this attack type
            limit_rankings = {}
            for build, dpt, rank in attack_type_builds:
                for limit in build.limits:
                    if limit not in limit_rankings:
                        limit_rankings[limit] = []
                    limit_rankings[limit].append(rank)

            # Calculate statistics for each limit
            limit_stats = []
            total_attack_type_builds = len(attack_type_builds)
            for limit_name, positions in limit_rankings.items():
                avg_position = sum(positions) / len(positions)
                median_position = statistics.median(positions)
                percentile = (median_position / total_attack_type_builds) * 100
                limit_stats.append({
                    'name': limit_name,
                    'avg_rank': avg_position,
                    'median_rank': median_position,
                    'percentile': percentile,
                    'appearances': len(positions),
                    'best_rank': min(positions),
                    'worst_rank': max(positions)
                })

            limit_stats.sort(key=lambda x: x['median_rank'])

            # 1. RANKINGS BY MEDIAN POSITION
            f.write(f"LIMIT RANKINGS BY MEDIAN POSITION - {attack_type.upper()}\n")
            f.write("-" * 95 + "\n")
            f.write(f"{'Rank':<4} {'Limit':<25} {'Avg Rank':<10} {'Med Rank':<10} {'Percentile':<12} {'Uses':<6} {'Best':<6} {'Worst':<6}\n")
            f.write("-" * 95 + "\n")

            for i, stats in enumerate(limit_stats, 1):
                f.write(f"{i:<4} {stats['name']:<25} {stats['avg_rank']:>8.1f} "
                       f"{stats['median_rank']:>8.1f} {stats['percentile']:>9.1f}% {stats['appearances']:>4} "
                       f"{stats['best_rank']:>4} {stats['worst_rank']:>5}\n")

            # 2. COST-EFFECTIVENESS RANKINGS
            f.write(f"\n\nLIMIT COST-EFFECTIVENESS RANKING - {attack_type.upper()}\n")
            f.write("-" * 80 + "\n")
            f.write(f"{'Rank':<4} {'Limit':<25} {'Cost':<6} {'Avg DPT+':<10} {'Avg %+':<10} {'DPT/Cost':<10}\n")
            f.write("-" * 80 + "\n")

            # Get cost-effectiveness data for this attack type
            cost_eff_data = []
            for limit_name, limit_data in limit_results.items():
                if attack_type in limit_data['attack_type_results']:
                    attack_results = limit_data['attack_type_results'][attack_type]
                    cost = limit_data['cost']
                    improvement = attack_results['avg_improvement']
                    cost_effectiveness = improvement / cost if cost > 0 else 0
                    percent_improvement = attack_results['avg_percent_improvement']

                    cost_eff_data.append({
                        'name': limit_name,
                        'cost': cost,
                        'improvement': improvement,
                        'percent_improvement': percent_improvement,
                        'cost_effectiveness': cost_effectiveness
                    })

            cost_eff_data.sort(key=lambda x: x['cost_effectiveness'], reverse=True)

            for i, data in enumerate(cost_eff_data, 1):
                f.write(f"{i:<4} {data['name']:<25} {data['cost']:>4}p "
                       f"{data['improvement']:>8.1f} "
                       f"{data['percent_improvement']:>8.1f}% "
                       f"{data['cost_effectiveness']:>8.2f}\n")

            # 3. ABSOLUTE DPT IMPROVEMENT RANKINGS
            f.write(f"\n\nLIMIT ABSOLUTE DPT IMPROVEMENT RANKING - {attack_type.upper()}\n")
            f.write("-" * 80 + "\n")
            f.write(f"{'Rank':<4} {'Limit':<25} {'Cost':<6} {'Avg DPT+':<10} {'% Improvement':<12}\n")
            f.write("-" * 80 + "\n")

            # Sort by absolute DPT improvement
            abs_improvement_data = sorted(cost_eff_data, key=lambda x: x['improvement'], reverse=True)

            for i, data in enumerate(abs_improvement_data, 1):
                f.write(f"{i:<4} {data['name']:<25} {data['cost']:>4}p "
                       f"{data['improvement']:>8.1f} "
                       f"{data['percent_improvement']:>10.1f}%\n")

            f.write(f"\n{'-'*80}\n\n")

    print(f"Attack-type-specific limit ranking report saved to {reports_dir}/limit_ranking_by_attack_type.txt")



