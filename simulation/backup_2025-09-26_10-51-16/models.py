"""
Core data models for the Vitality System combat simulator.
"""

from dataclasses import dataclass
from typing import List, Tuple


@dataclass
class Character:
    focus: int
    power: int
    mobility: int
    endurance: int
    tier: int
    max_hp: int = 100  # Actual maximum HP for slayer calculations

    @property
    def avoidance(self):
        return 5 + self.tier + self.mobility

    @property
    def durability(self):
        return self.tier + self.endurance


@dataclass
class AttackType:
    name: str
    cost: int
    accuracy_mod: int = 0
    damage_mod: int = 0
    is_direct: bool = False
    direct_damage_base: int = 0
    is_area: bool = False


@dataclass
class Upgrade:
    name: str
    cost: int
    accuracy_mod: int = 0
    damage_mod: int = 0
    damage_penalty: int = 0
    accuracy_penalty: int = 0
    special_effect: str = ""


@dataclass
class Limit:
    name: str
    cost: int
    damage_bonus: int
    dc: int


@dataclass
class SimulationConfig:
    """Configuration settings for simulation runs"""
    # Execution mode control
    execution_mode: str = "both"  # "individual", "build", or "both"

    # Core simulation settings
    num_runs: int = 10
    target_hp: int = 100
    max_points: int = 60
    use_threading: bool = True
    min_dpt_threshold: float = 0.0

    # Simulation run counts
    simulation_runs: dict = None

    # Individual testing configuration
    individual_testing: dict = None

    # Build testing configuration
    build_testing: dict = None

    # Reports configuration
    reports: dict = None

    # Attacker/Defender configurations
    attacker_configs: List[Tuple[int, int, int, int, int]] = None
    defender_configs: List[Tuple[int, int, int, int, int]] = None

    # Filter options
    attack_types_filter: List[str] = None
    upgrades_filter: List[str] = None
    limits_filter: List[str] = None

    # Legacy options (for backward compatibility)
    verbose_logging: bool = True
    show_top_builds: int = 10
    generate_individual_logs: bool = False
    test_single_upgrades: bool = True
    test_two_upgrade_combinations: bool = True
    test_three_upgrade_combinations: bool = True
    test_slayers: bool = True
    test_limits: bool = True

    # Logging configuration
    logging: dict = None

    # Combat configuration
    combat: dict = None

    def __post_init__(self):
        """Set default configurations if not provided"""
        if self.attacker_configs is None:
            self.attacker_configs = [
                (3, 3, 3, 3, 3),  # Balanced Tier 3
                (4, 4, 2, 2, 3),  # High Focus/Power
                (2, 2, 4, 4, 3),  # High Mobility/Endurance
                (5, 1, 1, 5, 3),  # Extreme Focus/Endurance
            ]

        if self.defender_configs is None:
            self.defender_configs = [
                (3, 3, 3, 3, 3),  # Balanced Tier 3 defender
            ]

        if self.individual_testing is None:
            self.individual_testing = {
                "enabled": True,
                "test_base_attacks": True,
                "test_upgrades": True,
                "test_limits": True,
                "test_specific_combinations": [
                    "critical_accuracy + powerful_critical",
                    "critical_accuracy + double_tap"
                ],
                "single_run_per_test": True,
                "detailed_combat_logs": True
            }

        if self.build_testing is None:
            self.build_testing = {
                "enabled": True,
                "test_single_upgrades": True,
                "test_two_upgrade_combinations": True,
                "test_three_upgrade_combinations": True,
                "test_slayers": True,
                "test_limits": True,
                "statistical_analysis": True
            }

        if self.reports is None:
            self.reports = {
                "individual_reports": {
                    "enabled": True,
                    "attack_type_table": True,
                    "upgrade_limit_table": True,
                    "mechanics_verification": True,
                    "scenario_breakdown": True
                },
                "build_reports": {
                    "enabled": True,
                    "build_rankings": True,
                    "upgrade_analysis": True,
                    "cost_effectiveness": True,
                    "percentile_analysis": True
                }
            }

        if self.simulation_runs is None:
            self.simulation_runs = {
                "build_testing_runs": 10,
                "individual_testing_runs": 5
            }

        if self.logging is None:
            self.logging = {
                "level": "summary",
                "separate_files": True,
                "log_top_builds_only": True,
                "top_builds_for_detailed_log": 50,
                "sample_rate": 1,
                "scenarios_to_log": ["1x100", "2x50", "4x25", "10x10"],
                "generate_individual_build_logs": False,
                "verbose_logging": False
            }

        if self.combat is None:
            self.combat = {
                "max_turns": 20,
                "safety_limit": 100
            }

    @property
    def max_combat_turns(self) -> int:
        """Get maximum combat turns before timeout"""
        return self.combat.get('max_turns', 20) if self.combat else 20

    @property
    def build_testing_runs(self) -> int:
        """Get number of simulation runs for build testing"""
        return self.simulation_runs.get('build_testing_runs', 10)

    @property
    def individual_testing_runs(self) -> int:
        """Get number of simulation runs for individual testing"""
        return self.simulation_runs.get('individual_testing_runs', 5)


class AttackBuild:
    """Represents a complete attack build with type, upgrades, and limits"""

    def __init__(self, attack_type: str, upgrades: List[str] = None, limits: List[str] = None):
        self.attack_type = attack_type
        self.upgrades = upgrades or []
        self.limits = limits or []
        self.total_cost = self.calculate_total_cost()

    def calculate_total_cost(self) -> int:
        """Calculate the total point cost of this build"""
        from game_data import ATTACK_TYPES, UPGRADES, LIMITS

        cost = ATTACK_TYPES[self.attack_type].cost

        # AOE builds pay double for upgrades and limits
        is_aoe_build = self.attack_type in ['area', 'direct_area_damage']
        aoe_multiplier = 2 if is_aoe_build else 1

        for upgrade in self.upgrades:
            if upgrade in UPGRADES:
                cost += UPGRADES[upgrade].cost * aoe_multiplier

        for limit in self.limits:
            if limit in LIMITS:
                cost += LIMITS[limit].cost * aoe_multiplier

        return cost

    def is_valid_combination(self) -> Tuple[bool, List[str]]:
        """Check if upgrade combination follows all rules"""
        from game_data import RuleValidator
        return RuleValidator.validate_combination(self.attack_type, self.upgrades)

    def is_valid(self, max_points: int) -> bool:
        """Check if build is valid (within budget and follows rules)"""
        cost_valid = self.total_cost <= max_points and self.total_cost >= 0
        rule_valid, _ = self.is_valid_combination()
        return cost_valid and rule_valid

    def get_rule_errors(self) -> List[str]:
        """Get any rule validation errors for this build"""
        _, errors = self.is_valid_combination()
        return errors

    def __str__(self) -> str:
        """String representation of the build"""
        parts = [self.attack_type]
        if self.upgrades:
            parts.append(f"Upgrades: {', '.join(self.upgrades)}")
        if self.limits:
            parts.append(f"Limits: {', '.join(self.limits)}")
        parts.append(f"Cost: {self.total_cost}")
        return " | ".join(parts)

    def __repr__(self) -> str:
        return f"AttackBuild({self.attack_type}, {self.upgrades}, {self.limits})"

    def __eq__(self, other) -> bool:
        """Check if two builds are equivalent"""
        if not isinstance(other, AttackBuild):
            return False
        return (self.attack_type == other.attack_type and
                set(self.upgrades) == set(other.upgrades) and
                set(self.limits) == set(other.limits))

    def __hash__(self) -> int:
        """Make builds hashable for use in sets/dicts"""
        return hash((self.attack_type,
                    tuple(sorted(self.upgrades)),
                    tuple(sorted(self.limits))))