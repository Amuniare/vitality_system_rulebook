"""
Pytest configuration for simulation_v4 tests.
"""
import sys
from pathlib import Path

# Add parent directory to path so we can import src module
test_dir = Path(__file__).parent
project_root = test_dir.parent
sys.path.insert(0, str(project_root))
