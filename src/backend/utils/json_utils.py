# src/utils/json_utils.py
"""JSON utility functions"""
import json
from pathlib import Path
from typing import Dict, Any


def load_json(file_path: Path) -> Dict[str, Any]:
    """Load JSON file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(data: Dict[str, Any], file_path: Path):
    """Save JSON file"""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)