"""
File utilities for processing downloaded characters.
"""

import json
import os
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging

from ..character.schema.schema_mapper import SchemaMapper

logger = logging.getLogger(__name__)

def process_downloaded_characters() -> None:
    """
    Process recently downloaded character JSON files and prepare them for sync.
    """
    downloads_dir = Path.home() / "Downloads"
    logger.info(f"Scanning for recent JSON files in: {downloads_dir}")
    
    # Find JSON files modified in the last 24 hours
    recent_files = find_recent_json_files(downloads_dir)
    logger.info(f"Found {len(recent_files)} recent JSON files to process.")
    
    success_count = 0
    failed_count = 0
    
    for file_path in recent_files:
        try:
            logger.info(f"Processing file: {file_path.name}")
            
            # Load web builder JSON
            with open(file_path, 'r', encoding='utf-8') as f:
                web_data = json.load(f)
            
            # Convert using schema system
            mapper = SchemaMapper()
            schema = mapper.map_character(web_data)
            roll20_data = schema.to_dict()
            
            # Save to input directory
            input_dir = Path("all_data/characters/input")
            input_dir.mkdir(parents=True, exist_ok=True)
            
            output_path = input_dir / file_path.name
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(roll20_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Successfully processed and saved to: {output_path}")
            success_count += 1
            
        except Exception as e:
            logger.error(f"Failed to process {file_path.name}: {e}")
            failed_count += 1
    
    logger.info(f"Processing complete. Prepared {success_count} characters. Failed to process {failed_count} files.")
    
    return success_count, failed_count

def find_recent_json_files(directory: Path, hours: int = 24) -> List[Path]:
    """Find JSON files modified within the specified number of hours."""
    if not directory.exists():
        return []
    
    cutoff_time = datetime.now() - timedelta(hours=hours)
    recent_files = []
    
    for file_path in directory.glob("*.json"):
        if file_path.is_file():
            mod_time = datetime.fromtimestamp(file_path.stat().st_mtime)
            if mod_time > cutoff_time:
                recent_files.append(file_path)
    
    return sorted(recent_files, key=lambda x: x.stat().st_mtime, reverse=True)

