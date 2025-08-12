#!/usr/bin/env python3
"""
Test script to isolate core import issues
"""
import sys
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

print("Testing core imports...")

try:
    print("1. Testing core.text_processor...")
    from core.text_processor import TextProcessor
    print("   ✅ TextProcessor imported successfully")
except Exception as e:
    print(f"   ❌ TextProcessor import failed: {e}")

try:
    print("2. Testing core.chunking_engine...")
    from core.chunking_engine import SessionChunker
    print("   ✅ SessionChunker imported successfully")
except Exception as e:
    print(f"   ❌ SessionChunker import failed: {e}")

try:
    print("3. Testing core.session_loader...")
    from core.session_loader import SessionLoader
    print("   ✅ SessionLoader imported successfully")
except Exception as e:
    print(f"   ❌ SessionLoader import failed: {e}")

try:
    print("4. Testing ai.template_manager...")
    from ai.template_manager import TemplateManager
    print("   ✅ TemplateManager imported successfully")
except Exception as e:
    print(f"   ❌ TemplateManager import failed: {e}")

try:
    print("5. Testing ai.api_client...")
    from ai.api_client import APIClient
    print("   ✅ APIClient imported successfully")
except Exception as e:
    print(f"   ❌ APIClient import failed: {e}")

print("Core import testing complete!")