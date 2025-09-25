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
    logger.info("=== DEBUGGING: file_utils.process_downloaded_characters() called ===")
    logger.info("=== DEBUGGING: This function DOES use the schema system ===")
    
    downloads_dir = Path.home() / "Downloads"
    logger.info(f"=== DEBUGGING: Scanning for recent JSON files in: {downloads_dir} ===")
    
    # Find JSON files modified in the last 24 hours
    recent_files = find_recent_json_files(downloads_dir)
    logger.info(f"=== DEBUGGING: Found {len(recent_files)} recent JSON files to process ===")
    
    success_count = 0
    failed_count = 0
    
    for file_path in recent_files:
        try:
            logger.info(f"=== DEBUGGING: Processing file: {file_path.name} ===")
            logger.info(f"=== DEBUGGING: File size: {file_path.stat().st_size} bytes ===")
            
            # Load web builder JSON
            logger.info(f"=== DEBUGGING: Loading web builder JSON from {file_path} ===")
            with open(file_path, 'r', encoding='utf-8') as f:
                web_data = json.load(f)
            
            logger.info(f"=== DEBUGGING: Web data loaded successfully ===")
            logger.info(f"=== DEBUGGING: Web data keys: {list(web_data.keys()) if web_data else 'NONE'} ===")
            logger.info(f"=== DEBUGGING: Character name: {web_data.get('name', 'UNKNOWN') if web_data else 'NO_DATA'} ===")
            
            # Convert using schema system
            logger.info(f"=== DEBUGGING: Initializing SchemaMapper ===")
            mapper = SchemaMapper()
            logger.info(f"=== DEBUGGING: Calling mapper.map_character() ===")
            
            # Note: The function calls map_character but the actual method is web_builder_to_roll20
            logger.info(f"=== DEBUGGING: ERROR - map_character method doesn't exist! Using web_builder_to_roll20 ===")
            roll20_data = mapper.web_builder_to_roll20(web_data)
            
            if roll20_data is None:
                logger.error(f"=== DEBUGGING: Schema transformation returned None! ===")
                failed_count += 1
                continue
            
            logger.info(f"=== DEBUGGING: Schema transformation completed successfully ===")
            logger.info(f"=== DEBUGGING: Roll20 data structure: {type(roll20_data)} ===")
            logger.info(f"=== DEBUGGING: Roll20 data keys: {list(roll20_data.keys()) if isinstance(roll20_data, dict) else 'NOT_DICT'} ===")
            
            # Save to input directory
            input_dir = Path("all_data/characters/input")
            input_dir.mkdir(parents=True, exist_ok=True)
            
            output_path = input_dir / file_path.name
            logger.info(f"=== DEBUGGING: Saving transformed data to: {output_path} ===")
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(roll20_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"=== DEBUGGING: File saved successfully ===")
            logger.info(f"=== DEBUGGING: Output file size: {output_path.stat().st_size} bytes ===")
            logger.info(f"Successfully processed and saved to: {output_path}")
            success_count += 1
            
        except Exception as e:
            logger.error(f"=== DEBUGGING: Exception occurred processing {file_path.name}: {e} ===")
            logger.error(f"=== DEBUGGING: Exception type: {type(e)} ===")
            import traceback
            logger.error(f"=== DEBUGGING: Full traceback: {traceback.format_exc()} ===")
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

