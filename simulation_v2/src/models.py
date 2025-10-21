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
        return 10 + self.tier + self.mobility

    @property
    def durability(self):
        return 5 + self.tier + self.endurance


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


class AttackBuild:
    """Represents a complete attack build with type, upgrades, and limits"""

    def __init__(self, attack_type: str, upgrades: List[str] = None, limits: List[str] = None):
        self.attack_type = attack_type
        self.upgrades = upgrades or []
        self.limits = limits or []
        self.total_cost = self.calculate_total_cost()

    def calculate_total_cost(self) -> int:
        """Calculate the total point cost of this build"""
        from src.game_data import ATTACK_TYPES, UPGRADES, LIMITS

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
        from src.game_data import RuleValidator
        return RuleValidator.validate_combination(self.attack_type, self.upgrades, self.limits)

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


class MultiAttackBuild:
    """Represents a collection of attack builds for versatile archetypes"""

    def __init__(self, builds: List[AttackBuild], archetype: str, fallback_type: str = None, tier_bonus: int = 0):
        """
        Initialize a multi-attack build collection

        Args:
            builds: List of AttackBuild objects
            archetype: Type of archetype ("focused", "dual_natured", "versatile_master")
            fallback_type: For dual_natured, the attack type of the fallback attack (e.g., "melee_dg", "area")
            tier_bonus: Bonus to accuracy and damage for fallback attacks
        """
        self.builds = builds
        self.archetype = archetype
        self.fallback_type = fallback_type
        self.tier_bonus = tier_bonus
        self.scenario_results = {}  # Maps scenario_name -> {build_idx: avg_turns}
        self.optimal_selections = {}  # Maps scenario_name -> build_idx
        self.attack_usage_counts = {}  # Maps attack_idx -> usage_count (tracks actual combat usage)

    def record_scenario_result(self, scenario_name: str, build_idx: int, avg_turns: float):
        """Record the average turns for a specific build in a specific scenario"""
        if scenario_name not in self.scenario_results:
            self.scenario_results[scenario_name] = {}
        self.scenario_results[scenario_name][build_idx] = avg_turns

    def calculate_optimal_selections(self):
        """Calculate which build performs best (lowest turns) in each scenario"""
        for scenario_name, results in self.scenario_results.items():
            if results:
                # Find build with minimum average turns
                best_build_idx = min(results.keys(), key=lambda idx: results[idx])
                self.optimal_selections[scenario_name] = best_build_idx

    def get_overall_avg_turns(self) -> float:
        """Calculate overall average turns using optimal build selection per scenario"""
        if not self.optimal_selections:
            self.calculate_optimal_selections()

        if not self.optimal_selections:
            return float('inf')

        total_turns = 0
        for scenario_name, best_build_idx in self.optimal_selections.items():
            total_turns += self.scenario_results[scenario_name][best_build_idx]

        return total_turns / len(self.optimal_selections)

    def get_total_cost(self) -> int:
        """Get total cost across all builds"""
        return sum(build.total_cost for build in self.builds)

    def record_attack_usage(self, attack_idx: int):
        """Record that a specific attack was used in combat"""
        if attack_idx not in self.attack_usage_counts:
            self.attack_usage_counts[attack_idx] = 0
        self.attack_usage_counts[attack_idx] += 1

    def get_attack_usage_percentages(self) -> Tuple[int, int]:
        """
        Calculate percentage of combat turns each attack was used.

        Returns:
            Tuple of (attack1_pct, attack2_pct) as integers
        """
        total = sum(self.attack_usage_counts.values())
        if total == 0:
            return (0, 0)

        atk1_pct = int((self.attack_usage_counts.get(0, 0) / total) * 100)
        atk2_pct = int((self.attack_usage_counts.get(1, 0) / total) * 100)
        return (atk1_pct, atk2_pct)

    def __str__(self) -> str:
        """String representation of the multi-attack build"""
        parts = [f"{self.archetype.replace('_', ' ').title()} Build ({len(self.builds)} attacks)"]
        for i, build in enumerate(self.builds):
            parts.append(f"  Attack {i+1}: {build}")
        if self.fallback_type:
            parts.append(f"  Fallback: {self.fallback_type}+{self.tier_bonus}")
        if self.optimal_selections:
            parts.append(f"  Overall Avg Turns: {self.get_overall_avg_turns():.2f}")
        return "\n".join(parts)

    def __repr__(self) -> str:
        return f"MultiAttackBuild({len(self.builds)} builds, {self.archetype})"

    def __eq__(self, other) -> bool:
        """Check if two multi-attack builds are equivalent"""
        if not isinstance(other, MultiAttackBuild):
            return False
        return (self.archetype == other.archetype and
                set(self.builds) == set(other.builds) and
                self.fallback_type == other.fallback_type and
                self.tier_bonus == other.tier_bonus)

    def __hash__(self) -> int:
        """Make multi-attack builds hashable for use in sets/dicts"""
        return hash((self.archetype, tuple(sorted(self.builds, key=lambda b: hash(b))), self.fallback_type, self.tier_bonus))
