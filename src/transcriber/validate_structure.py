#!/usr/bin/env python3
"""
Validation script for the new modular transcriber structure
Tests that all modules can be imported and key functionality is accessible
"""

import sys
from pathlib import Path

def test_import(module_name, description):
    """Test importing a module and report results"""
    try:
        exec(f"import {module_name}")
        print(f"✅ {description}: SUCCESS")
        return True
    except ImportError as e:
        print(f"❌ {description}: FAILED - {e}")
        return False
    except Exception as e:
        print(f"⚠️  {description}: WARNING - {e}")
        return False

def test_from_import(from_module, import_names, description):
    """Test importing specific items from a module"""
    try:
        for name in import_names:
            exec(f"from {from_module} import {name}")
        print(f"✅ {description}: SUCCESS")
        return True
    except ImportError as e:
        print(f"❌ {description}: FAILED - {e}")
        return False
    except Exception as e:
        print(f"⚠️  {description}: WARNING - {e}")
        return False

def main():
    print("🔍 Validating Modular Transcriber Structure")
    print("=" * 50)
    
    success_count = 0
    total_tests = 0
    
    # Test core module structure
    print("\n📦 Testing Core Modules:")
    tests = [
        ("processing.speaker_mapper", "Speaker Mapper"),
        ("processing.content_analyzer", "Content Analyzer"), 
        ("utils.config_manager", "Config Manager"),
        ("utils.file_utils", "File Utils"),
        ("utils.logging_utils", "Logging Utils"),
    ]
    
    for module, desc in tests:
        total_tests += 1
        if test_import(module, desc):
            success_count += 1
    
    # Test specific imports
    print("\n🎯 Testing Specific Imports:")
    specific_tests = [
        ("processing.speaker_mapper", ["CharacterMapper", "ROGUE_TRADER_PLAYER_MAPPING"], "Character Mapping Classes"),
        ("processing.content_analyzer", ["ContentAnalyzer"], "Content Analysis Classes"),
        ("utils.config_manager", ["ConfigManager", "get_config"], "Configuration Classes"),
        ("utils.file_utils", ["FileManager"], "File Management Classes"),
        ("utils.logging_utils", ["TranscriberLogger", "get_logger"], "Logging Classes"),
    ]
    
    for from_mod, imports, desc in specific_tests:
        total_tests += 1
        if test_from_import(from_mod, imports, desc):
            success_count += 1
    
    # Test data integrity
    print("\n📊 Testing Data Integrity:")
    try:
        from processing.speaker_mapper import ROGUE_TRADER_PLAYER_MAPPING
        mapping_count = len(ROGUE_TRADER_PLAYER_MAPPING)
        print(f"✅ Character Mapping Data: {mapping_count} characters loaded")
        success_count += 1
    except Exception as e:
        print(f"❌ Character Mapping Data: FAILED - {e}")
    total_tests += 1
    
    # Test file structure
    print("\n📁 Testing File Structure:")
    required_dirs = [
        Path("core"),
        Path("processing"), 
        Path("ai"),
        Path("utils"),
        Path("tests")
    ]
    
    for dir_path in required_dirs:
        total_tests += 1
        if dir_path.exists():
            print(f"✅ Directory {dir_path}: EXISTS")
            success_count += 1
        else:
            print(f"❌ Directory {dir_path}: MISSING")
    
    # Summary
    print("\n" + "=" * 50)
    print(f"📈 VALIDATION SUMMARY:")
    print(f"   Tests Passed: {success_count}/{total_tests}")
    print(f"   Success Rate: {(success_count/total_tests)*100:.1f}%")
    
    if success_count == total_tests:
        print("🎉 ALL TESTS PASSED - Structure is valid!")
        return 0
    elif success_count >= total_tests * 0.8:
        print("⚠️  MOSTLY SUCCESSFUL - Minor issues detected")
        return 1
    else:
        print("❌ VALIDATION FAILED - Major issues detected") 
        return 2

if __name__ == "__main__":
    sys.exit(main())