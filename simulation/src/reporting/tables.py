"""
Table generation module for individual testing reports.

This module provides the TableGenerator class which generates formatted tables
for attack type performance and upgrade/limit analysis.
"""

from typing import Dict


class TableGenerator:
    """Generates formatted tables for individual testing reports"""

    @staticmethod
    def format_attack_type_table(attack_type_data: Dict, reports_dir: str):
        """Generate Table 1: Attack Type Performance sorted by average DPT (highest to lowest)"""
        filename = f"{reports_dir}/individual_attack_type_table.txt"

        # Sort attack types by average DPT across all scenarios (highest to lowest)
        sorted_attack_types = sorted(
            attack_type_data.items(),
            key=lambda x: x[1].get('average', {}).get('dpt_no_upgrades', 0),
            reverse=True
        )

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("INDIVIDUAL TESTING - ATTACK TYPE PERFORMANCE TABLE\n")
            f.write("=" * 140 + "\n\n")

            # Header row with proper spacing matching data alignment
            header = f"{'Attack Type':<18} │ {'Avg All Scenarios':^18} │ {'1x100 HP Boss':^18} │ {'2x50 HP Enemies':^18} │ {'4x25 HP Enemies':^18} │ {'10x10 HP Enemies':^18}"
            f.write(header + "\n")

            # Sub-header for metrics with proper alignment
            subheader = f"{'':<18} │ {'DPT':>7} {'%':>7} │ {'DPT':>7} {'%':>7} │ {'DPT':>7} {'%':>7} │ {'DPT':>7} {'%':>7} │ {'DPT':>7} {'%':>7}"
            f.write(subheader + "\n")
            f.write("─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "\n")

            # Data rows for each attack type (sorted by average DPT)
            for attack_type, data in sorted_attack_types:
                row = f"{attack_type:<18} │"

                # Average across all scenarios with proper spacing
                avg_data = data.get('average', {})
                dpt_avg = avg_data.get('dpt_no_upgrades', 0)  # Using no_upgrades as the main DPT value
                row += f" {dpt_avg:>6.1f} {100.0:>6.1f}% │"

                # Per-scenario data with consistent spacing
                scenarios = ['1x100', '2x50', '4x25', '10x10']
                for scenario in scenarios:
                    scenario_data = data.get(scenario, {})
                    dpt_val = scenario_data.get('dpt_no_upgrades', 0)
                    row += f" {dpt_val:>6.1f} {100.0:>6.1f}% │"

                f.write(row + "\n")

        print(f"Attack type performance table saved to {filename}")

    @staticmethod
    def format_upgrade_limit_table(upgrade_limit_data: Dict, reports_dir: str):
        """Generate Table 2: Upgrade/Limit Analysis (sorted by Avg Δ/Cost)"""
        from src.game_data import UPGRADES, LIMITS

        filename = f"{reports_dir}/individual_upgrade_limit_table.txt"

        # Calculate averages and sort by Avg Δ/Cost (most negative first - best turn reduction per cost)
        items_with_metrics = []

        for item_name, data in upgrade_limit_data.items():
            # Get cost
            cost = data.get('cost', 0)
            if cost == 0:  # Fallback if cost not in data
                if item_name in UPGRADES:
                    cost = UPGRADES[item_name].cost
                elif item_name in LIMITS:
                    cost = LIMITS[item_name].cost

            if cost == 0:
                continue  # Skip items with no cost

            # Calculate average turn difference across attack types
            attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']
            turn_diffs = []
            for attack_type in attack_types:
                att_data = data.get(attack_type, {})
                turn_diff = att_data.get('avg_turn_difference', 0)
                turn_diffs.append(turn_diff)

            avg_turn_diff = sum(turn_diffs) / len(turn_diffs) if turn_diffs else 0
            avg_diff_per_cost = avg_turn_diff / cost if cost > 0 else 0

            items_with_metrics.append((item_name, data, cost, avg_turn_diff, avg_diff_per_cost, turn_diffs))

        # Sort by Avg Δ/Cost (most negative first - best turn reduction per point)
        sorted_items = sorted(items_with_metrics, key=lambda x: x[4])

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("INDIVIDUAL TESTING - UPGRADE/LIMIT PERFORMANCE TABLE (AVG TURNS)\n")
            f.write("=" * 240 + "\n\n")

            # Header row
            header = f"{'Upgrade/Limit':<20}"
            header += f"{'Avg Δ/Cost':<10}"
            header += f"{'Avg Δ':<8}"
            header += f"{'Cost':<6}"
            header += f"{'Melee_AC':<9}{'Melee_DG':<9}{'Ranged':<8}{'Area':<7}{'Direct':<8}{'DirectAOE':<10}"
            header += f"{'ΔMelee_AC':<10}{'ΔMelee_DG':<10}{'ΔRanged':<9}{'ΔArea':<8}{'ΔDirect':<9}{'ΔDirectAOE':<11}"
            header += f"{'1x100':<8}{'2x50':<8}{'4x25':<8}{'10x10':<8}"
            f.write(header + "\n")

            # Sub-header
            subheader = f"{'':<20}"
            subheader += f"{'(turn/pt)':<10}"
            subheader += f"{'(turns)':<8}"
            subheader += f"{'(pts)':<6}"
            for _ in range(6):  # Attack type turns
                subheader += f"{'(turns)':<9}"[:9]
            for _ in range(6):  # Attack type diffs
                subheader += f"{'(diff)':<10}"[:10]
            for _ in range(4):  # Scenarios
                subheader += f"{'(turns)':<8}"
            f.write(subheader + "\n")
            f.write("-" * 240 + "\n")

            # Data rows for each upgrade/limit (sorted by Avg Δ/Cost)
            for item_name, data, cost, avg_turn_diff, avg_diff_per_cost, turn_diffs in sorted_items:
                row = f"{item_name:<20}"
                row += f"{avg_diff_per_cost:>8.2f}  "
                row += f"{avg_turn_diff:>6.2f}  "
                row += f"{cost:>4}  "

                # Per-attack-type turns
                attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']
                for attack_type in attack_types:
                    att_data = data.get(attack_type, {})
                    turns_val = att_data.get('avg_turns_with_upgrade', 0)
                    row += f"{turns_val:>7.2f}  "

                # Per-attack-type differences
                for turn_diff in turn_diffs:
                    row += f"{turn_diff:>8.2f}  "

                # Per-scenario data
                scenarios = ['1x100', '2x50', '4x25', '10x10']
                scenario_data = data.get('scenarios', {})
                for scenario in scenarios:
                    scen_data = scenario_data.get(scenario, {})
                    turns_val = scen_data.get('avg_turns_with_upgrade', 0)
                    row += f"{turns_val:>6.2f}  "

                f.write(row + "\n")

        print(f"Upgrade/limit performance table saved to {filename}")

    @staticmethod
    def format_attack_type_turns_table(attack_type_data: Dict, reports_dir: str):
        """Generate Table 1: Attack Type Turns Performance sorted by average turns (lowest to highest)"""
        filename = f"{reports_dir}/individual_attack_type_turns_table.txt"

        # Sort attack types by average turns across all scenarios (lowest to highest)
        sorted_attack_types = sorted(
            attack_type_data.items(),
            key=lambda x: x[1].get('average', {}).get('turns_no_upgrades', float('inf')),
            reverse=False  # Lower turns = better
        )

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("INDIVIDUAL TESTING - ATTACK TYPE TURNS PERFORMANCE TABLE\n")
            f.write("=" * 120 + "\n\n")

            # Header row with proper spacing
            header = f"{'Attack Type':<18} │ {'Avg All Scenarios':^18} │ {'1x100 HP Boss':^18} │ {'2x50 HP Enemies':^18} │ {'4x25 HP Enemies':^18} │ {'10x10 HP Enemies':^18}"
            f.write(header + "\n")

            # Sub-header for turns
            subheader = f"{'':<18} │ {'Turns':>11} │ {'Turns':>11} │ {'Turns':>11} │ {'Turns':>11} │ {'Turns':>11}"
            f.write(subheader + "\n")
            f.write("─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "─┼─" + "─" * 18 + "\n")

            # Data rows for each attack type (sorted by average turns)
            for attack_type, data in sorted_attack_types:
                row = f"{attack_type:<18} │"

                # Average across all scenarios
                avg_data = data.get('average', {})
                turns_avg = avg_data.get('turns_no_upgrades', 0)
                row += f" {turns_avg:>9.2f} │"

                # Per-scenario data
                scenarios = ['1x100', '2x50', '4x25', '10x10']
                for scenario in scenarios:
                    scenario_data = data.get(scenario, {})
                    turns_val = scenario_data.get('turns_no_upgrades', 0)
                    row += f" {turns_val:>9.2f} │"

                f.write(row + "\n")

        print(f"Attack type turns performance table saved to {filename}")

    @staticmethod
    def format_upgrade_limit_turns_table(upgrade_limit_data: Dict, reports_dir: str):
        """Generate Table 2: Upgrade/Limit Turns Analysis (sorted by Avg Δ/Cost)"""
        from src.game_data import UPGRADES, LIMITS

        filename = f"{reports_dir}/individual_upgrade_limit_turns_table.txt"

        # Calculate averages and sort by Avg Δ/Cost (most negative first - best turn reduction per cost)
        items_with_metrics = []

        for item_name, data in upgrade_limit_data.items():
            # Get cost
            cost = 0
            if item_name in UPGRADES:
                cost = UPGRADES[item_name].cost
            elif item_name in LIMITS:
                cost = LIMITS[item_name].cost

            if cost == 0:
                continue  # Skip items with no cost

            # Calculate average turn difference across attack types
            attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']
            turn_diffs = []
            for attack_type in attack_types:
                att_data = data.get(attack_type, {})
                turn_diff = att_data.get('avg_turn_difference', 0)
                turn_diffs.append(turn_diff)

            avg_turn_diff = sum(turn_diffs) / len(turn_diffs) if turn_diffs else 0
            avg_diff_per_cost = avg_turn_diff / cost if cost > 0 else 0

            items_with_metrics.append((item_name, data, cost, avg_turn_diff, avg_diff_per_cost, turn_diffs))

        # Sort by Avg Δ/Cost (most negative first - best turn reduction per point)
        sorted_items = sorted(items_with_metrics, key=lambda x: x[4])

        with open(filename, 'w', encoding='utf-8') as f:
            f.write("INDIVIDUAL TESTING - UPGRADE/LIMIT TURNS PERFORMANCE TABLE\n")
            f.write("=" * 240 + "\n\n")

            # Header row (16 columns total)
            header = f"{'Upgrade/Limit':<20}"
            header += f"{'Avg Δ/Cost':<10}"
            header += f"{'Avg Δ':<8}"
            header += f"{'Cost':<6}"
            header += f"{'Melee_AC':<9}{'Melee_DG':<9}{'Ranged':<8}{'Area':<7}{'Direct':<8}{'DirectAOE':<10}"
            header += f"{'ΔMelee_AC':<10}{'ΔMelee_DG':<10}{'ΔRanged':<9}{'ΔArea':<8}{'ΔDirect':<9}{'ΔDirectAOE':<11}"
            header += f"{'1x100':<8}{'2x50':<8}{'4x25':<8}{'10x10':<8}"
            f.write(header + "\n")

            # Sub-header
            subheader = f"{'':<20}"
            subheader += f"{'(turn/pt)':<10}"
            subheader += f"{'(turns)':<8}"
            subheader += f"{'(pts)':<6}"
            for _ in range(6):  # Attack type turns
                subheader += f"{'(turns)':<9}"[:9]
            for _ in range(6):  # Attack type diffs
                subheader += f"{'(diff)':<10}"[:10]
            for _ in range(4):  # Scenarios
                subheader += f"{'(turns)':<8}"
            f.write(subheader + "\n")
            f.write("-" * 240 + "\n")

            # Data rows for each upgrade/limit (sorted by Avg Δ/Cost)
            for item_name, data, cost, avg_turn_diff, avg_diff_per_cost, turn_diffs in sorted_items:
                row = f"{item_name:<20}"
                row += f"{avg_diff_per_cost:>8.2f}  "
                row += f"{avg_turn_diff:>6.2f}  "
                row += f"{cost:>4}  "

                # Per-attack-type turns
                attack_types = ['melee_ac', 'melee_dg', 'ranged', 'area', 'direct_damage', 'direct_area_damage']
                for attack_type in attack_types:
                    att_data = data.get(attack_type, {})
                    turns_val = att_data.get('avg_turns_with_upgrade', 0)
                    row += f"{turns_val:>7.2f}  "

                # Per-attack-type differences
                for turn_diff in turn_diffs:
                    row += f"{turn_diff:>8.2f}  "

                # Per-scenario data
                scenarios = ['1x100', '2x50', '4x25', '10x10']
                scenario_data = data.get('scenarios', {})
                for scenario in scenarios:
                    scen_data = scenario_data.get(scenario, {})
                    turns_val = scen_data.get('avg_turns_with_upgrade', 0)
                    row += f"{turns_val:>6.2f}  "

                f.write(row + "\n")

        print(f"Upgrade/limit turns performance table saved to {filename}")

    @staticmethod
    def format_attack_type_specific_upgrade_tables(upgrade_limit_data: Dict, reports_dir: str):
        """Generate 5 attack-type-specific upgrade/limit performance tables"""
        from src.game_data import UPGRADES, LIMITS

        attack_type_names = {
            'melee_ac': 'Melee Accuracy',
            'melee_dg': 'Melee Damage',
            'ranged': 'Ranged',
            'area': 'Area',
            'direct_damage': 'Direct Damage'
        }

        for attack_type, display_name in attack_type_names.items():
            TableGenerator._format_single_attack_type_upgrade_table(
                upgrade_limit_data, reports_dir, attack_type, display_name
            )

    @staticmethod
    def _format_single_attack_type_upgrade_table(upgrade_limit_data: Dict, reports_dir: str,
                                                attack_type: str, display_name: str):
        """Generate a single attack-type-specific upgrade/limit performance table"""
        from src.game_data import UPGRADES, LIMITS

        filename = f"{reports_dir}/individual_upgrade_limit_turns_{attack_type}_table.txt"

        # Filter items that have data for this attack type and calculate metrics
        items_with_metrics = []

        for item_name, data in upgrade_limit_data.items():
            # Get cost
            cost = 0
            if item_name in UPGRADES:
                cost = UPGRADES[item_name].cost
            elif item_name in LIMITS:
                cost = LIMITS[item_name].cost

            if cost == 0:
                continue

            # Check if this upgrade/limit has data for this attack type
            att_data = data.get(attack_type, {})
            if not att_data:
                continue

            # Get key metrics for this attack type
            turns_with = att_data.get('avg_turns_with_upgrade', 0)
            turns_without = att_data.get('avg_turns_without_upgrade', 0)
            turn_diff = att_data.get('avg_turn_difference', 0)
            dpt_with = att_data.get('avg_dpt_with_upgrade', 0)
            dpt_without = att_data.get('avg_dpt_without_upgrade', 0)
            dpt_diff = att_data.get('avg_dpt_difference', 0)

            # Calculate efficiency metrics
            turn_diff_per_cost = turn_diff / cost if cost > 0 else 0
            dpt_diff_per_cost = dpt_diff / cost if cost > 0 else 0

            # Get scenario data
            scenario_data = data.get('scenarios', {})
            scenarios = ['1x100', '2x50', '4x25', '10x10']
            scenario_turns = []
            scenario_diffs = []

            for scenario in scenarios:
                scen_data = scenario_data.get(scenario, {})
                scen_turns = scen_data.get('avg_turns_with_upgrade', 0)
                scen_diff = scen_data.get('avg_turn_difference', 0)
                scenario_turns.append(scen_turns)
                scenario_diffs.append(scen_diff)

            items_with_metrics.append((
                item_name, cost, turns_with, turns_without, turn_diff,
                dpt_with, dpt_without, dpt_diff, turn_diff_per_cost, dpt_diff_per_cost,
                scenario_turns, scenario_diffs
            ))

        # Sort by turn difference per cost (most negative first - best turn reduction per point)
        sorted_items = sorted(items_with_metrics, key=lambda x: x[8])

        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"INDIVIDUAL TESTING - {display_name.upper()} UPGRADE/LIMIT PERFORMANCE TABLE\n")
            f.write("=" * 160 + "\n\n")
            f.write(f"Performance analysis for upgrades and limits specifically with {display_name} attacks\n")
            f.write(f"Sorted by Turn Reduction per Point Cost (best improvement per point first)\n\n")

            # Header row
            header = f"{'Upgrade/Limit':<20}"
            header += f"{'Δ/Cost':<8}"
            header += f"{'Cost':<6}"
            header += f"{'Base':<7}{'With':<7}{'ΔTurns':<8}"
            header += f"{'Base':<7}{'With':<7}{'ΔDPT':<7}"
            header += f"{'1x100':<7}{'2x50':<7}{'4x25':<7}{'10x10':<7}"
            header += f"{'Δ1x100':<8}{'Δ2x50':<8}{'Δ4x25':<8}{'Δ10x10':<8}"
            f.write(header + "\n")

            # Sub-header
            subheader = f"{'':<20}"
            subheader += f"{'(t/pt)':<8}"
            subheader += f"{'(pts)':<6}"
            subheader += f"{'(turns)':<7}{'(turns)':<7}{'(diff)':<8}"
            subheader += f"{'(DPT)':<7}{'(DPT)':<7}{'(diff)':<7}"
            subheader += f"{'(turns)':<7}{'(turns)':<7}{'(turns)':<7}{'(turns)':<7}"
            subheader += f"{'(diff)':<8}{'(diff)':<8}{'(diff)':<8}{'(diff)':<8}"
            f.write(subheader + "\n")
            f.write("-" * 160 + "\n")

            # Data rows
            for (item_name, cost, turns_with, turns_without, turn_diff,
                 dpt_with, dpt_without, dpt_diff, turn_diff_per_cost, dpt_diff_per_cost,
                 scenario_turns, scenario_diffs) in sorted_items:

                row = f"{item_name:<20}"
                row += f"{turn_diff_per_cost:>6.2f}  "
                row += f"{cost:>4}  "
                row += f"{turns_without:>5.1f}  {turns_with:>5.1f}  {turn_diff:>6.2f}  "
                row += f"{dpt_without:>5.1f}  {dpt_with:>5.1f}  {dpt_diff:>5.2f}  "

                # Scenario turns
                for turns in scenario_turns:
                    row += f"{turns:>5.1f}  "

                # Scenario differences
                for diff in scenario_diffs:
                    row += f"{diff:>6.2f}  "

                f.write(row + "\n")

            # Summary section
            f.write("\n" + "=" * 80 + "\n")
            f.write(f"SUMMARY FOR {display_name.upper()} ATTACKS:\n")
            f.write("=" * 80 + "\n\n")

            if sorted_items:
                best_item = sorted_items[0]
                worst_item = sorted_items[-1]

                f.write(f"Best upgrade/limit: {best_item[0]} ({best_item[8]:.3f} turn reduction per point)\n")
                f.write(f"Worst upgrade/limit: {worst_item[0]} ({worst_item[8]:.3f} turn change per point)\n")
                f.write(f"Total upgrades/limits compatible: {len(sorted_items)}\n")

                # Top 5 recommendations
                f.write(f"\nTOP 5 RECOMMENDATIONS FOR {display_name.upper()}:\n")
                for i, (item_name, cost, _, _, turn_diff, _, _, dpt_diff, turn_diff_per_cost, _, _, _) in enumerate(sorted_items[:5], 1):
                    f.write(f"{i}. {item_name} (Cost: {cost}pts): {turn_diff:.2f} turn improvement, {dpt_diff:+.2f} DPT\n")

                # Calculate averages
                avg_turn_improvement = sum(item[4] for item in sorted_items) / len(sorted_items)
                avg_dpt_improvement = sum(item[7] for item in sorted_items) / len(sorted_items)

                f.write(f"\nAVERAGE PERFORMANCE:\n")
                f.write(f"Average turn improvement: {avg_turn_improvement:.2f} turns\n")
                f.write(f"Average DPT improvement: {avg_dpt_improvement:+.2f}\n")

        print(f"{display_name} specific upgrade/limit table saved to {filename}")