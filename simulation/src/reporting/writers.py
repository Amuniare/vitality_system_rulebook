"""
Report writers for the Vitality System combat simulator.

This module contains functions that write report data to files.
"""

import statistics
from typing import Dict, List, Tuple
from src.models import Character, AttackBuild, SimulationConfig, MultiAttackBuild
from src.simulation import run_simulation_batch


def get_build_description(build, include_enhancements=True):
    """Get a string description of a build that works for both AttackBuild and MultiAttackBuild"""
    if isinstance(build, MultiAttackBuild):
        desc = f"{build.archetype} ({len(build.builds)} attacks)"
        if include_enhancements:
            for i, attack_build in enumerate(build.builds, 1):
                attack_desc = f"{attack_build.attack_type}"
                if attack_build.upgrades:
                    attack_desc += f" + {', '.join(attack_build.upgrades)}"
                if attack_build.limits:
                    attack_desc += f" + {', '.join(attack_build.limits)}"
                desc += f"\n  Attack {i}: {attack_desc}"
        return desc
    else:
        # Regular AttackBuild
        desc = f"{build.attack_type}"
        if include_enhancements and build.upgrades:
            desc += f" + {', '.join(build.upgrades)}"
        if include_enhancements and build.limits:
            desc += f" + {', '.join(build.limits)}"
        return desc


def write_upgrade_performance_report(enhancement_results: Dict, config: SimulationConfig, reports_dir: str = "reports"):
    """Write comprehensive enhancement (upgrade and limit) performance report to file"""
    with open(f'{reports_dir}/enhancement_performance_summary.md', 'w', encoding='utf-8') as f:
        f.write("# VITALITY SYSTEM - INDIVIDUAL ENHANCEMENT PERFORMANCE ANALYSIS\n\n")
        f.write("This report shows how each enhancement (upgrade or limit) performs individually compared to base attacks.\n")
        f.write("Improvements are measured in Damage Per Turn (DPT) increases across all enemy scenarios.\n\n")

        # Sort by cost effectiveness
        sorted_enhancements = sorted(enhancement_results.values(), key=lambda x: x['cost_effectiveness'], reverse=True)

        f.write("## ENHANCEMENT COST-EFFECTIVENESS RANKING\n\n")
        f.write("| Rank | Enhancement | Cost | Avg DPT+ | Avg %+ | DPT/Cost |\n")
        f.write("|------|-------------|------|----------|--------|----------|\n")

        for i, enhancement_data in enumerate(sorted_enhancements, 1):
            f.write(f"| {i} | {enhancement_data['name']} | {enhancement_data['cost']}p | "
                   f"{enhancement_data['overall_avg_improvement']:.1f} | "
                   f"{(enhancement_data['overall_avg_improvement']/enhancement_data['overall_avg_dpt']*100) if enhancement_data['overall_avg_dpt'] > 0 else 0:.1f}% | "
                   f"{enhancement_data['cost_effectiveness']:.2f} |\n")

        # Sort by absolute DPT improvement
        sorted_by_dpt = sorted(enhancement_results.values(), key=lambda x: x['overall_avg_improvement'], reverse=True)

        f.write(f"\n## ENHANCEMENT ABSOLUTE DPT IMPROVEMENT RANKING\n\n")
        f.write("| Rank | Enhancement | Cost | Avg DPT+ | Best Attack Type |\n")
        f.write("|------|-------------|------|----------|------------------|\n")

        for i, enhancement_data in enumerate(sorted_by_dpt, 1):
            # Find best attack type for this enhancement
            best_attack_type = ""
            best_improvement = 0
            for attack_type, results in enhancement_data['attack_type_results'].items():
                if results['avg_improvement'] > best_improvement:
                    best_improvement = results['avg_improvement']
                    best_attack_type = f"{attack_type} (+{best_improvement:.1f})"

            f.write(f"| {i} | {enhancement_data['name']} | {enhancement_data['cost']}p | "
                   f"{enhancement_data['overall_avg_improvement']:.1f} | {best_attack_type} |\n")

        # Detailed per-enhancement analysis
        f.write(f"\n## DETAILED ENHANCEMENT ANALYSIS\n\n")

        for enhancement_name, enhancement_data in sorted(enhancement_results.items()):
            f.write(f"### {enhancement_data['name'].upper()}\n\n")
            f.write(f"**Cost:** {enhancement_data['cost']} points | **Overall Avg DPT Improvement:** {enhancement_data['overall_avg_improvement']:.1f} | **Cost Effectiveness:** {enhancement_data['cost_effectiveness']:.2f}\n\n")
            f.write("| Attack Type | Base DPT | Enhanced DPT | Improvement | % Improvement |\n")
            f.write("|-------------|----------|--------------|-------------|---------------|\n")

            for attack_type, results in enhancement_data['attack_type_results'].items():
                # Handle both upgrade and limit result keys
                enhanced_dpt_key = 'avg_upgrade_dpt' if 'avg_upgrade_dpt' in results else 'avg_limit_dpt'
                f.write(f"| {attack_type.title()} | {results['avg_base_dpt']:.1f} | {results[enhanced_dpt_key]:.1f} | "
                       f"+{results['avg_improvement']:.1f} | {results['avg_percent_improvement']:+.1f}% |\n")
            f.write("\n")


    print(f"Enhancement performance report saved to {reports_dir}/enhancement_performance_summary.md")



def write_combo_performance_report(combo_results: Dict, config: SimulationConfig, reports_dir: str = "reports"):
    """Write comprehensive combo performance report to file"""
    with open(f'{reports_dir}/combo_performance_summary.md', 'w', encoding='utf-8') as f:
        f.write("# VITALITY SYSTEM - SPECIFIC UPGRADE COMBO PERFORMANCE ANALYSIS\n\n")
        f.write("This report shows how specific two-upgrade combinations perform compared to base attacks.\n")
        f.write("Focus on cheap, synergistic combinations that work well together.\n")
        f.write("Improvements are measured in Damage Per Turn (DPT) increases across all enemy scenarios.\n\n")

        # Sort by cost effectiveness
        sorted_combos = sorted(combo_results.values(), key=lambda x: x['cost_effectiveness'], reverse=True)

        f.write("## COMBO COST-EFFECTIVENESS RANKING\n\n")
        f.write("| Rank | Combo | Cost | Avg DPT+ | Avg %+ | DPT/Cost |\n")
        f.write("|------|-------|------|----------|--------|----------|\n")

        for i, combo_data in enumerate(sorted_combos, 1):
            f.write(f"| {i} | {combo_data['name']} | {combo_data['cost']}p | "
                   f"{combo_data['overall_avg_improvement']:.1f} | "
                   f"{(combo_data['overall_avg_improvement']/combo_data['overall_avg_dpt']*100) if combo_data['overall_avg_dpt'] > 0 else 0:.1f}% | "
                   f"{combo_data['cost_effectiveness']:.2f} |\n")

        # Sort by absolute DPT improvement
        sorted_by_dpt = sorted(combo_results.values(), key=lambda x: x['overall_avg_improvement'], reverse=True)

        f.write(f"\n## COMBO ABSOLUTE DPT IMPROVEMENT RANKING\n\n")
        f.write("| Rank | Combo | Cost | Avg DPT+ | Best Attack Type |\n")
        f.write("|------|-------|------|----------|------------------|\n")

        for i, combo_data in enumerate(sorted_by_dpt, 1):
            # Find best attack type for this combo
            best_attack_type = ""
            best_improvement = 0
            for attack_type, results in combo_data['attack_type_results'].items():
                if results['avg_improvement'] > best_improvement:
                    best_improvement = results['avg_improvement']
                    best_attack_type = f"{attack_type} (+{best_improvement:.1f})"

            f.write(f"| {i} | {combo_data['name']} | {combo_data['cost']}p | "
                   f"{combo_data['overall_avg_improvement']:.1f} | {best_attack_type} |\n")

        # Detailed per-combo analysis
        f.write(f"\n## DETAILED COMBO ANALYSIS\n\n")

        for combo_name, combo_data in sorted(combo_results.items()):
            f.write(f"### {combo_data['name'].upper()}\n\n")
            f.write(f"**Upgrades:** {', '.join(combo_data['upgrades'])}\n\n")
            f.write(f"**Cost:** {combo_data['cost']} points | **Overall Avg DPT Improvement:** {combo_data['overall_avg_improvement']:.1f} | **Cost Effectiveness:** {combo_data['cost_effectiveness']:.2f}\n\n")
            f.write("| Attack Type | Base DPT | Combo DPT | Improvement | % Improvement |\n")
            f.write("|-------------|----------|-----------|-------------|---------------|\n")

            for attack_type, results in combo_data['attack_type_results'].items():
                f.write(f"| {attack_type.title()} | {results['avg_base_dpt']:.1f} | {results['avg_combo_dpt']:.1f} | "
                       f"+{results['avg_improvement']:.1f} | {results['avg_percent_improvement']:+.1f}% |\n")
            f.write("\n")

    print(f"Combo performance report saved to {reports_dir}/combo_performance_summary.md")



def build_turns_table(all_build_results: List[Tuple], config: SimulationConfig, reports_dir: str = "reports"):
    """Generate table of builds sorted by average turns (ascending)"""
    print("Generating build turns table report...")

    # Extract build data with turns - all_build_results now contains (build, avg_dpt, avg_turns)
    build_data = []
    for rank, (build, avg_dpt, avg_turns) in enumerate(all_build_results, 1):
        build_data.append({
            'original_rank': rank,
            'build': build,
            'avg_turns': avg_turns
        })

    # Sort by average turns (ascending - lower turns is better)
    build_data.sort(key=lambda x: x['avg_turns'])

    # Write the report
    with open(f'{reports_dir}/build_turns_table.md', 'w', encoding='utf-8') as f:
        f.write("# VITALITY SYSTEM - BUILD RANKING BY AVERAGE TURNS\n\n")
        f.write("Builds ranked by average turns to complete combat (lower is better).\n")
        f.write(f"Total builds: {len(build_data)}\n\n")

        # Table header
        f.write("| Rank | Avg Turns | Orig Rank | Build Description |\n")
        f.write("|------|-----------|-----------|-------------------|\n")

        # Write top 50 builds by turns
        for i, data in enumerate(build_data[:50], 1):
            build = data['build']
            build_desc = get_build_description(build, include_enhancements=True)

            f.write(f"| {i} | {data['avg_turns']:.1f} | "
                   f"{data['original_rank']} | {build_desc} |\n")

        # Summary statistics
        f.write(f"\n## SUMMARY STATISTICS\n\n")
        all_turns = [data['avg_turns'] for data in build_data]
        f.write(f"- **Best (lowest) turns:** {min(all_turns):.1f}\n")
        f.write(f"- **Worst (highest) turns:** {max(all_turns):.1f}\n")
        f.write(f"- **Average turns:** {sum(all_turns)/len(all_turns):.1f}\n")
        f.write(f"- **Median turns:** {sorted(all_turns)[len(all_turns)//2]:.1f}\n")

    print(f"Build turns table saved to {reports_dir}/build_turns_table.md")
    return build_data



def write_builds_turns_table(builds: List[AttackBuild], config: SimulationConfig, reports_dir: str = "reports"):
    """Write a builds table with average turns until defeat as the main metric"""
    if not builds:
        print("No builds to analyze for turns table.")
        return

    # Calculate turns until defeat for each build
    build_results = []
    for build in builds[:100]:  # Show top 100 builds
        # Skip MultiAttackBuilds - they were already tested
        if isinstance(build, MultiAttackBuild):
            continue

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
                    _, avg_turns, dpt, _ = run_simulation_batch(
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
    with open(f'{reports_dir}/builds_turns_table.md', 'w', encoding='utf-8') as f:
        f.write("# VITALITY SYSTEM - BUILDS PERFORMANCE TABLE\n\n")
        f.write("Builds ranked by average turns until defeat (lower = faster kills)\n")
        f.write(f"Total builds analyzed: {len(build_results)}\n\n")

        # Check if we have any results after filtering
        if not build_results:
            f.write("Note: All builds in the top 100 are MultiAttackBuild objects which are tested separately.\n")
            f.write("See the individual archetype reports for multi-attack build analysis.\n")
            print(f"Builds turns table saved to {reports_dir}/builds_turns_table.md (no single-attack builds in top 100)")
            return

        # Header
        f.write("| Rank | Avg Turns | Attack Type | Upgrades & Limits |\n")
        f.write("|------|-----------|-------------|-------------------|\n")

        # Build entries
        for i, (build, avg_dpt, avg_turns) in enumerate(build_results, 1):
            # Format enhancements (upgrades + limits)
            enhancements = []
            if build.upgrades:
                enhancements.extend(build.upgrades)
            if build.limits:
                enhancements.extend(build.limits)

            enhancements_str = ", ".join(enhancements) if enhancements else "Base"

            build_type = get_build_description(build, include_enhancements=False)
            f.write(f"| {i} | {avg_turns:.2f} | {build_type} | {enhancements_str} |\n")

        # Summary statistics
        f.write(f"\n## SUMMARY STATISTICS\n\n")
        all_turns = [x[1] for x in build_results]
        f.write(f"- **Fastest kill time:** {min(all_turns):.2f} turns\n")
        f.write(f"- **Slowest kill time:** {max(all_turns):.2f} turns\n")
        f.write(f"- **Average kill time:** {sum(all_turns)/len(all_turns):.2f} turns\n")
        f.write(f"- **Median kill time:** {statistics.median(all_turns):.2f} turns\n")

        # Top 10 fastest builds
        f.write(f"\n## TOP 10 FASTEST BUILDS\n\n")
        for i, (build, avg_dpt, avg_turns) in enumerate(build_results[:10], 1):
            enhancements = []
            if not isinstance(build, MultiAttackBuild):
                if build.upgrades:
                    enhancements.extend(build.upgrades)
                if build.limits:
                    enhancements.extend(build.limits)
            enhancements_str = ", ".join(enhancements) if enhancements else "Base"

            build_type = get_build_description(build, include_enhancements=False)
            f.write(f"{i}. **{build_type}** ({avg_turns:.2f} turns, {avg_dpt:.1f} DPT)\n")
            f.write(f"   - Enhancements: {enhancements_str}\n\n")

    print(f"Builds turns table saved to {reports_dir}/builds_turns_table.md")



def write_build_summary(builds: List[AttackBuild], config: SimulationConfig, reports_dir: str = "reports"):
    """Write a summary of the top builds to file"""
    from src.models import MultiAttackBuild

    if not builds:
        print("No builds to summarize.")
        return

    # Calculate DPT for each build (skip MultiAttackBuilds as they were already tested)
    build_results = []
    for build in builds[:50]:  # Show top 50 builds
        # Skip MultiAttackBuilds - they don't have attack_type and were already tested
        if isinstance(build, MultiAttackBuild):
            continue

        total_dpt = 0
        total_turns = 0
        total_configs = 0

        for att_config in config.attacker_configs:
            for def_config in config.defender_configs:
                attacker = Character(*att_config)
                defender = Character(*def_config)

                _, avg_turns, dpt, _ = run_simulation_batch(
                    attacker, build, config.build_testing_runs, config.target_hp, defender)

                total_dpt += dpt
                total_turns += avg_turns
                total_configs += 1

        avg_dpt = total_dpt / total_configs if total_configs > 0 else 0
        avg_turns = total_turns / total_configs if total_configs > 0 else 0
        build_results.append((build, avg_dpt, avg_turns))

    # Sort by average DPT
    build_results.sort(key=lambda x: x[1], reverse=True)

    # Calculate attack type statistics (skip MultiAttackBuilds)
    attack_type_results = {}
    for build, avg_dpt, avg_turns in build_results:
        # Only calculate attack type stats for regular AttackBuilds
        if not isinstance(build, MultiAttackBuild):
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

    with open(f'{reports_dir}/build_summary.md', 'w', encoding='utf-8') as f:
        f.write("# VITALITY SYSTEM - BUILD PERFORMANCE SUMMARY\n\n")
        f.write(f"Top {len(build_results)} builds ranked by average DPT across all test configurations\n\n")

        # Write builds table
        f.write("| Rank | Attack Type | Upgrades | Limits | Cost | Avg DPT | Avg Turns |\n")
        f.write("|------|-------------|----------|--------|------|---------|-----------|\\n")

        for i, (build, avg_dpt, avg_turns) in enumerate(build_results, 1):
            if isinstance(build, MultiAttackBuild):
                attack_type = get_build_description(build, include_enhancements=False)
                upgrades_str = "—"
                limits_str = "—"
                total_cost = build.get_total_cost()
            else:
                attack_type = build.attack_type
                upgrades_str = ", ".join(build.upgrades) if build.upgrades else "—"
                limits_str = ", ".join(build.limits) if build.limits else "—"
                total_cost = build.total_cost

            f.write(f"| {i} | {attack_type} | {upgrades_str} | {limits_str} | "
                   f"{total_cost}p | {avg_dpt:.1f} | {avg_turns:.1f} |\n")

        # Attack Type Performance Summary (only if we have single-attack builds)
        if attack_type_summary:
            f.write(f"\n## ATTACK TYPE PERFORMANCE SUMMARY\n\n")
            f.write("| Rank | Attack Type | Avg DPT | Best DPT | Worst DPT | Count |\n")
            f.write("|------|-------------|---------|----------|-----------|-------|\n")

            for i, stats in enumerate(attack_type_summary, 1):
                f.write(f"| {i} | {stats['type']} | {stats['avg_dpt']:.1f} | "
                       f"{stats['best_dpt']:.1f} | {stats['worst_dpt']:.1f} | "
                       f"{stats['count']} |\n")
        else:
            f.write(f"\n## ATTACK TYPE PERFORMANCE SUMMARY\n\n")
            f.write("Note: All builds are MultiAttackBuild objects. Attack type statistics are not applicable.\n")

    print(f"Build summary saved to {reports_dir}/build_summary.md")



def write_attack_type_enhancement_ranking_report(all_build_results: List[Tuple], enhancement_results: Dict, config: SimulationConfig, reports_dir: str = "reports"):
    """Generate comprehensive enhancement ranking reports broken down by attack type"""
    print("Generating attack-type-specific enhancement ranking report...")

    # Get all attack types
    attack_types = config.attack_types_filter if config.attack_types_filter else ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    with open(f'{reports_dir}/enhancement_ranking_by_attack_type.md', 'w', encoding='utf-8') as f:
        f.write("# VITALITY SYSTEM - ENHANCEMENT RANKINGS BROKEN DOWN BY ATTACK TYPE\n\n")
        f.write("This report shows enhancement (upgrade & limit) performance rankings specifically for each attack type.\n\n")
        f.write("Three ranking methods are provided for each attack type:\n\n")
        f.write("1. Rankings by Average Position - based on build rank positions\n")
        f.write("2. Cost-Effectiveness Rankings - DPT improvement per point cost\n")
        f.write("3. Absolute DPT Improvement Rankings - raw DPT increases\n\n")

        for attack_type in attack_types:
            f.write(f"---\n\n")
            f.write(f"## ATTACK TYPE: {attack_type.upper()}\n\n")

            # Filter builds for this attack type and track enhancement positions (skip MultiAttackBuilds)
            attack_type_builds = [(build, dpt, rank) for rank, (build, dpt, avg_turns) in enumerate(all_build_results, 1)
                                 if not isinstance(build, MultiAttackBuild) and build.attack_type == attack_type]

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
            f.write(f"### ENHANCEMENT RANKINGS BY MEDIAN POSITION - {attack_type.upper()}\n\n")
            f.write("| Rank | Enhancement | Avg Rank | Med Rank | Percentile | Uses | Best | Worst |\n")
            f.write("|------|-------------|----------|----------|------------|------|------|-------|\n")

            for i, stats in enumerate(enhancement_stats, 1):
                f.write(f"| {i} | {stats['name']} | {stats['avg_rank']:.1f} | "
                       f"{stats['median_rank']:.1f} | {stats['percentile']:.1f}% | {stats['appearances']} | "
                       f"{stats['best_rank']} | {stats['worst_rank']} |\n")

            # 2. COST-EFFECTIVENESS RANKINGS
            f.write(f"\n### ENHANCEMENT COST-EFFECTIVENESS RANKING - {attack_type.upper()}\n\n")
            f.write("| Rank | Enhancement | Cost | Avg DPT+ | Avg %+ | DPT/Cost |\n")
            f.write("|------|-------------|------|----------|--------|----------|\n")

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
                f.write(f"| {i} | {data['name']} | {data['cost']}p | "
                       f"{data['improvement']:.1f} | "
                       f"{data['percent_improvement']:.1f}% | "
                       f"{data['cost_effectiveness']:.2f} |\n")

            # 3. ABSOLUTE DPT IMPROVEMENT RANKINGS
            f.write(f"\n### ENHANCEMENT ABSOLUTE DPT IMPROVEMENT RANKING - {attack_type.upper()}\n\n")
            f.write("| Rank | Enhancement | Cost | Avg DPT+ | % Improvement |\n")
            f.write("|------|-------------|------|----------|---------------|\n")

            # Sort by absolute DPT improvement
            abs_improvement_data = sorted(cost_eff_data, key=lambda x: x['improvement'], reverse=True)

            for i, data in enumerate(abs_improvement_data, 1):
                f.write(f"| {i} | {data['name']} | {data['cost']}p | "
                       f"{data['improvement']:.1f} | "
                       f"{data['percent_improvement']:.1f}% |\n")

            f.write(f"\n")

    print(f"Attack-type-specific enhancement ranking report saved to {reports_dir}/enhancement_ranking_by_attack_type.md")



def write_attack_type_limit_ranking_report(all_build_results: List[Tuple], limit_results: Dict, config: SimulationConfig, reports_dir: str = "reports"):
    """Generate comprehensive limit ranking reports broken down by attack type"""
    print("Generating attack-type-specific limit ranking report...")

    # Get all attack types
    attack_types = config.attack_types_filter if config.attack_types_filter else ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']

    with open(f'{reports_dir}/limit_ranking_by_attack_type.md', 'w', encoding='utf-8') as f:
        f.write("# VITALITY SYSTEM - LIMIT RANKINGS BROKEN DOWN BY ATTACK TYPE\n\n")
        f.write("This report shows limit performance rankings specifically for each attack type.\n\n")
        f.write("Three ranking methods are provided for each attack type:\n\n")
        f.write("1. Rankings by Average Position - based on build rank positions\n")
        f.write("2. Cost-Effectiveness Rankings - DPT improvement per point cost\n")
        f.write("3. Absolute DPT Improvement Rankings - raw DPT increases\n\n")

        for attack_type in attack_types:
            f.write(f"---\n\n")
            f.write(f"## ATTACK TYPE: {attack_type.upper()}\n\n")

            # Filter builds for this attack type and track limit positions (skip MultiAttackBuilds)
            attack_type_builds = [(build, dpt, rank) for rank, (build, dpt, avg_turns) in enumerate(all_build_results, 1)
                                 if not isinstance(build, MultiAttackBuild) and build.attack_type == attack_type]

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
            f.write(f"### LIMIT RANKINGS BY MEDIAN POSITION - {attack_type.upper()}\n\n")
            f.write("| Rank | Limit | Avg Rank | Med Rank | Percentile | Uses | Best | Worst |\n")
            f.write("|------|-------|----------|----------|------------|------|------|-------|\n")

            for i, stats in enumerate(limit_stats, 1):
                f.write(f"| {i} | {stats['name']} | {stats['avg_rank']:.1f} | "
                       f"{stats['median_rank']:.1f} | {stats['percentile']:.1f}% | {stats['appearances']} | "
                       f"{stats['best_rank']} | {stats['worst_rank']} |\n")

            # 2. COST-EFFECTIVENESS RANKINGS
            f.write(f"\n### LIMIT COST-EFFECTIVENESS RANKING - {attack_type.upper()}\n\n")
            f.write("| Rank | Limit | Cost | Avg DPT+ | Avg %+ | DPT/Cost |\n")
            f.write("|------|-------|------|----------|--------|----------|\n")

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
                f.write(f"| {i} | {data['name']} | {data['cost']}p | "
                       f"{data['improvement']:.1f} | "
                       f"{data['percent_improvement']:.1f}% | "
                       f"{data['cost_effectiveness']:.2f} |\n")

            # 3. ABSOLUTE DPT IMPROVEMENT RANKINGS
            f.write(f"\n### LIMIT ABSOLUTE DPT IMPROVEMENT RANKING - {attack_type.upper()}\n\n")
            f.write("| Rank | Limit | Cost | Avg DPT+ | % Improvement |\n")
            f.write("|------|-------|------|----------|---------------|\n")

            # Sort by absolute DPT improvement
            abs_improvement_data = sorted(cost_eff_data, key=lambda x: x['improvement'], reverse=True)

            for i, data in enumerate(abs_improvement_data, 1):
                f.write(f"| {i} | {data['name']} | {data['cost']}p | "
                       f"{data['improvement']:.1f} | "
                       f"{data['percent_improvement']:.1f}% |\n")

            f.write(f"\n")

    print(f"Attack-type-specific limit ranking report saved to {reports_dir}/limit_ranking_by_attack_type.md")



