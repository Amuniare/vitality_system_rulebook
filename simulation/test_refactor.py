#!/usr/bin/env python3
"""
Quick test to verify the refactored structure works correctly.
"""

import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test that all refactored modules can be imported"""
    print("Testing refactored module imports...")

    try:
        from core.game_rules import GAME_MECHANICS, UPGRADE_RULES, LIMIT_RULES
        print("+ Core game rules imported successfully")
    except Exception as e:
        print(f"- Core game rules import failed: {e}")
        return False

    try:
        from core.models import Character, AttackBuild, SimulationConfig
        print("+ Core models imported successfully")
    except Exception as e:
        print(f"- Core models import failed: {e}")
        return False

    try:
        from data.attacks import ATTACK_TYPES
        from data.upgrades import UPGRADES
        from data.limits import LIMITS
        print("+ Data modules imported successfully")
    except Exception as e:
        print(f"- Data modules import failed: {e}")
        return False

    try:
        from data.config import load_config, get_default_config
        print("+ Config management imported successfully")
    except Exception as e:
        print(f"- Config management import failed: {e}")
        return False

    try:
        from reporting.base import create_timestamped_reports_directory
        print("+ Reporting base imported successfully")
    except Exception as e:
        print(f"- Reporting base import failed: {e}")
        return False

    return True


def test_basic_functionality():
    """Test basic functionality of refactored modules"""
    print("\nTesting basic functionality...")

    try:
        from core.models import Character, AttackBuild
        from data.attacks import ATTACK_TYPES

        # Test character creation
        char = Character(focus=3, power=3, mobility=3, endurance=3, tier=3)
        print(f"+ Character created: avoidance={char.avoidance}, durability={char.durability}")

        # Test build creation
        build = AttackBuild('melee_ac', ['power_attack'], ['unreliable_1'])
        print(f"+ Build created: {build.attack_type} with {len(build.upgrades)} upgrades, {len(build.limits)} limits")
        print(f"  Total cost: {build.total_cost}")

        return True
    except Exception as e:
        print(f"- Basic functionality test failed: {e}")
        return False


def test_rule_validation():
    """Test rule validation system"""
    print("\nTesting rule validation...")

    try:
        from core.game_rules import RULE_VALIDATION

        # Test valid combination
        valid, errors = RULE_VALIDATION.validate_combination('melee_ac', ['power_attack'])
        print(f"+ Valid combination test: valid={valid}, errors={errors}")

        # Test invalid combination (mutual exclusion)
        invalid, errors = RULE_VALIDATION.validate_combination('melee_ac', ['unreliable_1', 'unreliable_2'])
        print(f"+ Invalid combination test: valid={invalid}, errors={errors}")

        return True
    except Exception as e:
        print(f"- Rule validation test failed: {e}")
        return False


def test_config_system():
    """Test configuration system"""
    print("\nTesting configuration system...")

    try:
        from data.config import get_default_config

        config = get_default_config()
        print(f"+ Default config created: num_runs={config.num_runs}, max_points={config.max_points}")

        return True
    except Exception as e:
        print(f"- Configuration test failed: {e}")
        return False


def main():
    """Run all tests"""
    print("=== Refactored Structure Validation Tests ===\n")

    tests = [
        test_imports,
        test_basic_functionality,
        test_rule_validation,
        test_config_system
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1
        print()

    print(f"=== Test Results: {passed}/{total} tests passed ===")

    if passed == total:
        print("SUCCESS: All tests passed! Refactoring structure is working correctly.")
        return 0
    else:
        print("FAILED: Some tests failed. Check the errors above.")
        return 1


if __name__ == "__main__":
    exit(main())