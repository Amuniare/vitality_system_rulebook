"""
Unit tests for attack scoring module.

Run with: pytest tests/test_scoring.py
"""

import sys
from pathlib import Path
test_dir = Path(__file__).parent
project_root = test_dir.parent
sys.path.insert(0, str(project_root))

import pytest


def test_scoring_import():
    """Test that scoring module can be imported."""
    from src.scoring import score_attack_py, compare_attacks, score_many_attacks


def test_single_vs_multi_target():
    """Test that AOE is preferred against multiple enemies."""
    from src.scoring import score_attack_py
    from src.models import create_attack

    single_target = create_attack('melee_dg', ['power_attack'], [])
    aoe = create_attack('area', ['power_attack'], [])

    # Single enemy - prefer single target
    situation_single = {
        'num_enemies_alive': 1,
        'avg_enemy_hp_percent': 1.0,
        'num_wounded_enemies': 0,
        'enemy_has_high_avoidance': 0,
        'enemy_has_high_durability': 0
    }

    single_score = score_attack_py(single_target, situation_single)
    aoe_score = score_attack_py(aoe, situation_single)

    assert single_score > aoe_score, "Single target should score higher against one enemy"

    # Multiple enemies - prefer AOE
    situation_multi = {
        'num_enemies_alive': 5,
        'avg_enemy_hp_percent': 1.0,
        'num_wounded_enemies': 0,
        'enemy_has_high_avoidance': 0,
        'enemy_has_high_durability': 0
    }

    single_score = score_attack_py(single_target, situation_multi)
    aoe_score = score_attack_py(aoe, situation_multi)

    assert aoe_score > single_score, "AOE should score higher against multiple enemies"


def test_finishing_blow_vs_wounded():
    """Test that finishing blow is preferred against wounded enemies."""
    from src.scoring import score_attack_py
    from src.models import create_attack

    normal_attack = create_attack('melee_dg', ['power_attack'], [])
    finishing_attack = create_attack('melee_dg', ['finishing_blow_1'], [])

    # Full HP enemy - finishing blow not as good
    situation_full_hp = {
        'num_enemies_alive': 1,
        'avg_enemy_hp_percent': 1.0,
        'num_wounded_enemies': 0,
        'enemy_has_high_avoidance': 0,
        'enemy_has_high_durability': 0
    }

    normal_score = score_attack_py(normal_attack, situation_full_hp)
    finishing_score = score_attack_py(finishing_attack, situation_full_hp)

    # Low HP wounded enemy - finishing blow is great
    situation_wounded = {
        'num_enemies_alive': 1,
        'avg_enemy_hp_percent': 0.2,
        'num_wounded_enemies': 1,
        'enemy_has_high_avoidance': 0,
        'enemy_has_high_durability': 0
    }

    normal_score_wounded = score_attack_py(normal_attack, situation_wounded)
    finishing_score_wounded = score_attack_py(finishing_attack, situation_wounded)

    assert finishing_score_wounded > normal_score_wounded, "Finishing blow should be better against wounded enemies"
    assert finishing_score_wounded > finishing_score, "Finishing blow should score higher when enemies are wounded"


def test_accuracy_vs_high_avoidance():
    """Test that accurate attack is preferred against high avoidance."""
    from src.scoring import score_attack_py
    from src.models import create_attack

    power_attack = create_attack('melee_dg', ['power_attack'], [])
    accurate_attack = create_attack('melee_dg', ['accurate_attack'], [])

    # Normal avoidance
    situation_normal = {
        'num_enemies_alive': 1,
        'avg_enemy_hp_percent': 1.0,
        'num_wounded_enemies': 0,
        'enemy_has_high_avoidance': 0,
        'enemy_has_high_durability': 0
    }

    power_score = score_attack_py(power_attack, situation_normal)
    accurate_score = score_attack_py(accurate_attack, situation_normal)

    # High avoidance
    situation_high_avoid = {
        'num_enemies_alive': 1,
        'avg_enemy_hp_percent': 1.0,
        'num_wounded_enemies': 0,
        'enemy_has_high_avoidance': 1,
        'enemy_has_high_durability': 0
    }

    power_score_avoid = score_attack_py(power_attack, situation_high_avoid)
    accurate_score_avoid = score_attack_py(accurate_attack, situation_high_avoid)

    assert accurate_score_avoid > power_score_avoid, "Accurate attack should be better vs high avoidance"


def test_bleed_vs_high_hp():
    """Test that bleed is preferred against high HP enemies."""
    from src.scoring import score_attack_py
    from src.models import create_attack

    normal_attack = create_attack('melee_dg', ['power_attack'], [])
    bleed_attack = create_attack('melee_dg', ['bleed'], [])

    # Low HP enemy
    situation_low_hp = {
        'num_enemies_alive': 1,
        'avg_enemy_hp_percent': 0.3,
        'num_wounded_enemies': 1,
        'enemy_has_high_avoidance': 0,
        'enemy_has_high_durability': 0
    }

    bleed_score_low = score_attack_py(bleed_attack, situation_low_hp)

    # High HP enemy
    situation_high_hp = {
        'num_enemies_alive': 1,
        'avg_enemy_hp_percent': 1.0,
        'num_wounded_enemies': 0,
        'enemy_has_high_avoidance': 0,
        'enemy_has_high_durability': 0
    }

    bleed_score_high = score_attack_py(bleed_attack, situation_high_hp)

    assert bleed_score_high > bleed_score_low, "Bleed should score higher against full HP enemies"


def test_compare_attacks():
    """Test attack comparison function."""
    from src.scoring import compare_attacks
    from src.models import create_attack

    attack1 = create_attack('melee_dg', ['power_attack'], [])
    attack2 = create_attack('area', [], [])

    situation = {
        'num_enemies_alive': 5,
        'avg_enemy_hp_percent': 1.0,
        'num_wounded_enemies': 0,
        'enemy_has_high_avoidance': 0,
        'enemy_has_high_durability': 0
    }

    score1, score2, best_index = compare_attacks(attack1, attack2, situation)

    assert isinstance(score1, float)
    assert isinstance(score2, float)
    assert best_index in [0, 1]
    assert best_index == 1, "AOE (attack2) should be better against 5 enemies"


def test_score_many_attacks():
    """Test scoring multiple attacks."""
    from src.scoring import score_many_attacks
    from src.models import create_attack

    attacks = [
        create_attack('melee_dg', ['power_attack'], []),
        create_attack('area', [], []),
        create_attack('melee_dg', ['accurate_attack'], []),
    ]

    situation = {
        'num_enemies_alive': 5,
        'avg_enemy_hp_percent': 1.0,
        'num_wounded_enemies': 0,
        'enemy_has_high_avoidance': 0,
        'enemy_has_high_durability': 0
    }

    results = score_many_attacks(attacks, situation)

    assert len(results) == 3
    assert all(isinstance(score, float) and isinstance(idx, int) for score, idx in results)

    # Should be sorted by score descending
    scores = [score for score, idx in results]
    assert scores == sorted(scores, reverse=True)

    # AOE (index 1) should be best against 5 enemies
    best_score, best_idx = results[0]
    assert best_idx == 1, "AOE should be ranked first"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
