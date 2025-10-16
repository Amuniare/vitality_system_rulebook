"""
Unit tests for dice rolling module.

Run with: pytest tests/test_dice.py
"""

import pytest


def test_dice_import():
    """Test that dice module can be imported (requires build)."""
    try:
        from src.dice import roll_d20, roll_d6, roll_3d6_exploding
    except ImportError as e:
        pytest.skip(f"Cython modules not built yet: {e}")


def test_d20_range():
    """Test that d20 rolls are in valid range."""
    try:
        from src.dice import roll_d20
    except ImportError:
        pytest.skip("Cython modules not built yet")

    for _ in range(1000):
        result = roll_d20()
        assert 1 <= result <= 20, f"d20 roll out of range: {result}"


def test_d6_range():
    """Test that d6 rolls are in valid range."""
    try:
        from src.dice import roll_d6
    except ImportError:
        pytest.skip("Cython modules not built yet")

    for _ in range(1000):
        result = roll_d6()
        assert 1 <= result <= 6, f"d6 roll out of range: {result}"


def test_3d6_minimum():
    """Test that 3d6 exploding has minimum of 3."""
    try:
        from src.dice import roll_3d6_exploding
    except ImportError:
        pytest.skip("Cython modules not built yet")

    for _ in range(1000):
        result = roll_3d6_exploding()
        assert result >= 3, f"3d6 roll too low: {result}"


def test_dice_distribution():
    """Test that d20 has roughly uniform distribution."""
    try:
        from src.dice import roll_d20
    except ImportError:
        pytest.skip("Cython modules not built yet")

    rolls = [roll_d20() for _ in range(10000)]

    # Each value should appear roughly 500 times (10000/20)
    for value in range(1, 21):
        count = rolls.count(value)
        # Allow 20% variance
        assert 400 < count < 600, f"d20 value {value} appeared {count} times (expected ~500)"


def test_roll_many():
    """Test batch rolling function."""
    try:
        from src.dice import roll_many_d20
    except ImportError:
        pytest.skip("Cython modules not built yet")

    results = roll_many_d20(100)
    assert len(results) == 100
    assert all(1 <= r <= 20 for r in results)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
