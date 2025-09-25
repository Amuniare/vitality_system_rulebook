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
    num_runs: int = 10
    target_hp: int = 100
    max_points: int = 60
    test_single_upgrades: bool = True
    test_two_upgrade_combinations: bool = True
    test_three_upgrade_combinations: bool = True
    test_slayers: bool = True
    test_limits: bool = True

    # Attacker/Defender configurations
    attacker_configs: List[Tuple[int, int, int, int, int]] = None
    defender_configs: List[Tuple[int, int, int, int, int]] = None

    # Filter options
    attack_types_filter: List[str] = None
    upgrades_filter: List[str] = None
    limits_filter: List[str] = None
    min_dpt_threshold: float = 0.0

    # Output options
    verbose_logging: bool = True
    show_top_builds: int = 10
    generate_individual_logs: bool = False

    # Logging configuration
    logging: dict = None

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

        for upgrade in self.upgrades:
            if upgrade in UPGRADES:
                cost += UPGRADES[upgrade].cost

        for limit in self.limits:
            if limit in LIMITS:
                cost += LIMITS[limit].cost

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