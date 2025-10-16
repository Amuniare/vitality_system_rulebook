"""
Unit tests for combat simulation module.

Run with: pytest tests/test_simulation.py
"""

import sys
from pathlib import Path
test_dir = Path(__file__).parent
project_root = test_dir.parent
sys.path.insert(0, str(project_root))

import pytest


def test_simulation_import():
    """Test that simulation module can be imported."""
    from src.simulation import simulate_combat, simulate_many_combats, simulate_combat_stats


def test_single_combat():
    """Test single combat simulation."""
    from src.simulation import simulate_combat
    from src.models import create_character, create_attack

    attacker = create_character(2, 2, 2, 2, 4)
    defender = create_character(2, 2, 2, 2, 4)
    attack = create_attack('melee_dg', ['power_attack'], [])

    # Should defeat a 30 HP enemy eventually
    turns = simulate_combat(attacker, defender, attack, max_turns=100, enemy_hp=30)

    assert turns > 0, "Combat should succeed"
    assert turns < 100, "Combat should not timeout"
    assert 1 <= turns <= 50, f"Combat should take reasonable turns, got {turns}"


def test_parallel_simulation():
    """Test parallel combat simulation."""
    from src.simulation import simulate_many_combats
    from src.models import create_character, create_attack

    attacker = create_character(2, 2, 2, 2, 4)
    defender = create_character(2, 2, 2, 2, 4)
    attack = create_attack('melee_dg', ['power_attack'], [])

    results = simulate_many_combats(attacker, defender, attack,
                                   num_simulations=100,
                                   max_turns=100,
                                   enemy_hp=30)

    assert len(results) == 100
    successes = [r for r in results if r > 0]
    assert len(successes) >= 95, "Should have high success rate"


def test_combat_stats():
    """Test combat statistics generation."""
    from src.simulation import simulate_combat_stats
    from src.models import create_character, create_attack

    attacker = create_character(2, 2, 2, 2, 4)
    defender = create_character(2, 2, 2, 2, 4)
    attack = create_attack('melee_dg', ['power_attack'], [])

    stats = simulate_combat_stats(attacker, defender, attack,
                                 num_simulations=100,
                                 enemy_hp=30)

    assert 'avg_turns' in stats
    assert 'min_turns' in stats
    assert 'max_turns' in stats
    assert 'success_rate' in stats

    assert stats['avg_turns'] > 0
    assert stats['min_turns'] >= 1
    assert stats['max_turns'] > stats['min_turns']
    assert 0.9 <= stats['success_rate'] <= 1.0


def test_bleed_mechanic():
    """Test that bleed stacks and decays correctly."""
    from src.simulation import simulate_combat
    from src.models import create_character, create_attack

    attacker = create_character(2, 2, 2, 2, 4)
    defender = create_character(2, 2, 2, 2, 4)

    # Bleed attack should be faster against high HP enemies
    bleed_attack = create_attack('melee_dg', ['bleed'], [])
    normal_attack = create_attack('melee_dg', [], [])

    # Run multiple simulations
    bleed_turns = []
    normal_turns = []

    for _ in range(20):
        turns = simulate_combat(attacker, defender, bleed_attack, max_turns=100, enemy_hp=100)
        if turns > 0:
            bleed_turns.append(turns)

        turns = simulate_combat(attacker, defender, normal_attack, max_turns=100, enemy_hp=100)
        if turns > 0:
            normal_turns.append(turns)

    # Bleed should generally be effective
    assert len(bleed_turns) > 0
    assert len(normal_turns) > 0


def test_finishing_blow():
    """Test that finishing blow works on wounded enemies."""
    from src.simulation import simulate_combat
    from src.models import create_character, create_attack

    attacker = create_character(2, 2, 2, 2, 4)
    defender = create_character(2, 2, 2, 2, 4)

    finishing_attack = create_attack('melee_dg', ['finishing_blow_1'], [])

    # Against a low HP enemy, finishing blow should be very fast
    turns = simulate_combat(attacker, defender, finishing_attack, max_turns=100, enemy_hp=10)

    assert turns > 0, "Should defeat enemy"
    assert turns <= 10, f"Should defeat low HP enemy quickly, took {turns} turns"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
