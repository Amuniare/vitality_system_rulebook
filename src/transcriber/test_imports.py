#!/usr/bin/env python3
"""
Test script to isolate import issues
"""
import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

print("Testing imports...")

try:
    print("1. Testing processing.python_pipeline...")
    from processing.python_pipeline import PythonPipeline
    print("   ✅ PythonPipeline imported successfully")
except Exception as e:
    print(f"   ❌ PythonPipeline import failed: {e}")

try:
    print("2. Testing processing.speaker_mapper...")
    from processing.speaker_mapper import CharacterMapper
    print("   ✅ CharacterMapper imported successfully")
except Exception as e:
    print(f"   ❌ CharacterMapper import failed: {e}")

try:
    print("3. Testing processing.content_analyzer...")
    from processing.content_analyzer import ContentAnalyzer
    print("   ✅ ContentAnalyzer imported successfully")
except Exception as e:
    print(f"   ❌ ContentAnalyzer import failed: {e}")

try:
    print("4. Testing tests.test_utils...")
    from tests.test_utils import SessionTester
    print("   ✅ SessionTester imported successfully")
except Exception as e:
    print(f"   ❌ SessionTester import failed: {e}")

try:
    print("5. Testing ai.ai_pipeline...")
    from ai.ai_pipeline import AIPipeline
    print("   ✅ AIPipeline imported successfully")
except Exception as e:
    print(f"   ❌ AIPipeline import failed: {e}")

print("Import testing complete!")