"""Individual enhancement testing for Simulation V2."""

from dataclasses import dataclass
from typing import Dict, List
from src.game_data import UPGRADES, LIMITS, ATTACK_TYPES, RuleValidator, PREREQUISITES
from src.models import Character, AttackBuild
from src.simulation import run_simulation_batch, simulate_combat_verbose
from core.config import SimConfigV2
import os


@dataclass
class IndividualResult:
    """Result from testing an individual enhancement."""
    enhancement_name: str
    enhancement_type: str  # 'upgrade' or 'limit'
    cost: int
    avg_turns: float
    attack_type_turns: Dict[str, float]
    attack_usage: Dict[int, int] = None  # Maps attack_idx -> count of scenarios where it was used


class IndividualTester:
    """Tests individual enhancements in isolation."""

    def __init__(self, config: SimConfigV2, archetype: str, combat_logs_dir: str = None):
        self.config = config
        self.archetype = archetype
        self.attacker = Character(*config.attacker_stats)
        self.defender = Character(*config.defender_stats)
        self.max_points = config.max_points_per_attack(archetype)
        self.combat_logs_dir = combat_logs_dir

        # Create combat logs directory if specified
        if self.combat_logs_dir:
            os.makedirs(self.combat_logs_dir, exist_ok=True)

    def test_all_enhancements(self) -> List[IndividualResult]:
        """Test all upgrades and limits individually."""
        results = []

        print(f"\n=== Testing Individual Enhancements ({self.archetype}) ===")

        # Test upgrades
        for upgrade_name, upgrade_data in UPGRADES.items():
            print(f"  Testing {upgrade_name}...")
            result = self._test_upgrade(upgrade_name, upgrade_data.cost)
            if result:
                results.append(result)

        # Test limits
        for limit_name, limit_data in LIMITS.items():
            print(f"  Testing {limit_name}...")
            result = self._test_limit(limit_name, limit_data.cost)
            if result:
                results.append(result)

        return results

    def _test_upgrade(self, upgrade_name: str, upgrade_cost: int) -> IndividualResult:
        """Test a single upgrade with compatible attack types."""
        # Build upgrade list with prerequisites
        upgrades_to_test = [upgrade_name]
        if upgrade_name in PREREQUISITES:
            upgrades_to_test = PREREQUISITES[upgrade_name] + [upgrade_name]

        # Calculate total cost including prerequisites
        total_cost = sum(UPGRADES[u].cost for u in upgrades_to_test)

        if total_cost > self.max_points:
            return None

        attack_type_turns = {}
        all_turns = []

        # Test with each compatible attack type
        for attack_type_name in self.config.attack_types:
            is_valid, errors = RuleValidator.validate_combination(attack_type_name, upgrades_to_test)
            if not is_valid:
                continue

            # Test across all scenarios
            scenario_turns = []
            for scenario in self.config.scenarios:
                if scenario.enemy_hp_list:
                    results, avg_turns, dpt, win_rate = run_simulation_batch(
                        self.attacker,
                        AttackBuild(attack_type_name, upgrades_to_test, []),
                        self.config.simulation_runs,
                        100,  # target_hp (not used in multi-enemy)
                        self.defender,
                        enemy_hp_list=scenario.enemy_hp_list
                    )
                else:
                    results, avg_turns, dpt, win_rate = run_simulation_batch(
                        self.attacker,
                        AttackBuild(attack_type_name, upgrades_to_test, []),
                        self.config.simulation_runs,
                        100,
                        self.defender,
                        num_enemies=scenario.num_enemies,
                        enemy_hp=scenario.enemy_hp
                    )
                scenario_turns.append(avg_turns)

            # Average across scenarios
            avg_attack_type_turns = sum(scenario_turns) / len(scenario_turns)
            attack_type_turns[attack_type_name] = avg_attack_type_turns
            all_turns.append(avg_attack_type_turns)

        if not all_turns:
            return None

        # Overall average across all attack types
        overall_avg = sum(all_turns) / len(all_turns)

        # Generate combat log if directory specified (use first compatible attack type)
        if self.combat_logs_dir and attack_type_turns:
            first_attack_type = list(attack_type_turns.keys())[0]
            self._log_single_combat(upgrade_name, 'upgrade', AttackBuild(first_attack_type, upgrades_to_test, []), total_cost)

        return IndividualResult(
            enhancement_name=upgrade_name,
            enhancement_type='upgrade',
            cost=total_cost,
            avg_turns=overall_avg,
            attack_type_turns=attack_type_turns
        )

    def _test_limit(self, limit_name: str, limit_cost: int) -> IndividualResult:
        """Test a single limit with all attack types."""
        if limit_cost > self.max_points:
            return None

        attack_type_turns = {}
        all_turns = []

        # Test with each attack type (limits work with all)
        for attack_type_name in self.config.attack_types:
            # Test across all scenarios
            scenario_turns = []
            for scenario in self.config.scenarios:
                if scenario.enemy_hp_list:
                    results, avg_turns, dpt, win_rate = run_simulation_batch(
                        self.attacker,
                        AttackBuild(attack_type_name, [], [limit_name]),
                        self.config.simulation_runs,
                        100,
                        self.defender,
                        enemy_hp_list=scenario.enemy_hp_list
                    )
                else:
                    results, avg_turns, dpt, win_rate = run_simulation_batch(
                        self.attacker,
                        AttackBuild(attack_type_name, [], [limit_name]),
                        self.config.simulation_runs,
                        100,
                        self.defender,
                        num_enemies=scenario.num_enemies,
                        enemy_hp=scenario.enemy_hp
                    )
                scenario_turns.append(avg_turns)

            # Average across scenarios
            avg_attack_type_turns = sum(scenario_turns) / len(scenario_turns)
            attack_type_turns[attack_type_name] = avg_attack_type_turns
            all_turns.append(avg_attack_type_turns)

        # Overall average across all attack types
        overall_avg = sum(all_turns) / len(all_turns)

        # Generate combat log if directory specified
        if self.combat_logs_dir:
            self._log_single_combat(limit_name, 'limit', AttackBuild(self.config.attack_types[0], [], [limit_name]), limit_cost)

        return IndividualResult(
            enhancement_name=limit_name,
            enhancement_type='limit',
            cost=limit_cost,
            avg_turns=overall_avg,
            attack_type_turns=attack_type_turns
        )

    def _log_single_combat(self, enhancement_name: str, enhancement_type: str, build: AttackBuild, cost: int):
        """Generate a single combat log for an enhancement.

        Args:
            enhancement_name: Name of the enhancement
            enhancement_type: 'upgrade' or 'limit'
            build: AttackBuild to use for the combat
            cost: Point cost of the enhancement
        """
        from io import StringIO

        if not self.combat_logs_dir:
            return

        log_path = os.path.join(self.combat_logs_dir, f"{enhancement_name}_combat.txt")

        # Use first scenario for combat log
        scenario = self.config.scenarios[0]

        # Use StringIO buffer for better performance
        buffer = StringIO()

        buffer.write(f"{'='*80}\n")
        buffer.write(f"COMBAT LOG - {enhancement_name.upper()}\n")
        buffer.write(f"{'='*80}\n")
        buffer.write(f"Enhancement Type: {enhancement_type.title()}\n")
        buffer.write(f"Cost: {cost} points\n")
        buffer.write(f"Archetype: {self.archetype}\n")
        buffer.write(f"Scenario: {scenario.name}\n")
        buffer.write(f"{'='*80}\n\n")

        # Run a single verbose combat simulation
        if scenario.enemy_hp_list:
            turns, outcome = simulate_combat_verbose(
                self.attacker,
                build,
                100,  # target_hp
                buffer,
                self.defender,
                enemy_hp_list=scenario.enemy_hp_list
            )
        else:
            turns, outcome = simulate_combat_verbose(
                self.attacker,
                build,
                100,  # target_hp
                buffer,
                self.defender,
                num_enemies=scenario.num_enemies,
                enemy_hp=scenario.enemy_hp
            )

        buffer.write(f"\n{'='*80}\n")
        buffer.write(f"COMBAT RESULT\n")
        buffer.write(f"{'='*80}\n")
        buffer.write(f"Outcome: {outcome.upper()}\n")
        buffer.write(f"Turns: {turns}\n")
        buffer.write(f"{'='*80}\n")

        # Write buffer to file in one operation
        with open(log_path, 'w', encoding='utf-8', buffering=8192) as f:
            f.write(buffer.getvalue())
