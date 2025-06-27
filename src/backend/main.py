"""
Roll20 API Automation Tool
Main entry point - unified schema system and Roll20 automation
"""
import logging
from pathlib import Path
import sys
import time
import argparse
from typing import Dict, Any, List

# Import both schema system and Roll20 automation components
try:
    from src.backend.character.schema.schema_mapper import SchemaMapper
    from src.backend.character.schema.schema_uploader import SchemaUploader
    from src.backend.character.schema.schema_validator import SchemaValidator
    from src.backend.utils.logging import setup_logging
    from src.backend.utils.json_utils import load_json, save_json
    from src.backend.api.connection import Roll20Connection
    from src.backend.api.chat_interface import ChatInterface
    from src.backend.character.updater import CharacterUpdater
    from src.backend.character.api_extractor import CharacterExtractor
    from src.backend.utils.file_utils import process_downloaded_characters
except ImportError as e:
    print(f"Import error: {e}")
    print("Please ensure the project is properly structured and dependencies are installed")
    sys.exit(1)

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

def handle_login(page):
    """Handle Roll20 login if needed"""
    try:
        # Check if we're on login page
        if "welcome" in page.url or "login" in page.url:
            logger.info("Login required - please log in manually")
            
            # Wait for user to login manually
            print("Please log in to Roll20 in the browser...")
            print("Press Enter once you're logged in and in your campaign...")
            input()
            
            # Verify we're in a campaign
            if "editor" not in page.url:
                logger.error("Please navigate to your campaign editor")
                return False
                
        return True
        
    except Exception as e:
        logger.error(f"Login handling failed: {e}")
        return False

def extract_all_characters():
    """Extract all character data from Roll20"""
    connection = Roll20Connection()
    
    try:
        # Connect to Roll20
        page = connection.connect()
        
        # Handle login
        if not handle_login(page):
            logger.error("Login failed")
            return
        
        # Create interfaces
        chat = ChatInterface(page)
        
        # Navigate to chat
        chat.navigate_to_chat()
        
        # Wait for Roll20 to fully load
        logger.info("Waiting for Roll20 to fully load...")
        time.sleep(5)
        
        # Create extractor
        extractor = CharacterExtractor(chat, page)
        
        # Extract all character data
        logger.info("Starting character extraction process...")
        all_characters = extractor.extract_all_characters()
        
        if not all_characters:
            logger.error("No character data extracted!")
            return
        
        # Save extracted data to data/characters/extracted
        output_dir = Path("all_data") / "characters" / "extracted"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Saving extracted data to {output_dir}")
        
        for char_name, char_data in all_characters.items():
            # Create safe filename
            safe_name = char_name.replace(" ", "_").replace("/", "_").replace("*", "_")
            safe_name = "".join(c for c in safe_name if c.isalnum() or c in "._-")
            
            output_file = output_dir / f"{safe_name}.json"
            save_json(char_data, output_file)
            logger.info(f"Saved {char_name} to {output_file}")
        
        # Also save a combined file
        combined_file = output_dir / "all_characters.json"
        save_json(all_characters, combined_file)
        logger.info(f"Saved combined data to {combined_file}")
        
        logger.info(f"Extraction complete! Successfully extracted {len(all_characters)} characters")
        
        # Clean up combined file after extraction
        try:
            combined_file.unlink()
            logger.info(f"Deleted temporary file: {combined_file}")
        except Exception as e:
            logger.warning(f"Could not delete {combined_file}: {e}")

    except Exception as e:
        logger.error(f"Extraction error: {e}")
        sys.exit(1)
    finally:
        logger.info("Closing browser...")
        connection.disconnect()

def sync_scriptcards_only():
    """Sync scriptcards only for all characters from input directory - update only abilities"""
    connection = Roll20Connection()
    
    try:
        # Connect to Roll20
        page = connection.connect()
        
        # Handle login
        if not handle_login(page):
            logger.error("Login failed")
            return
        
        # Create interfaces
        chat = ChatInterface(page)
        
        # Navigate to chat
        chat.navigate_to_chat()
        
        # Create updater
        updater = CharacterUpdater(chat)
        
        # Get all JSON files from characters\input
        input_dir = Path("all_data") / "characters" / "input"
        if not input_dir.exists():
            logger.error(f"Input directory not found: {input_dir}")
            return
        
        json_files = list(input_dir.glob("*.json"))
        if not json_files:
            logger.error(f"No JSON files found in {input_dir}")
            return
        
        logger.info(f"Found {len(json_files)} character files to update scriptcards for")
        
        # Process each character file
        successful = 0
        failed = 0
        
        for json_file in json_files:
            try:
                logger.info(f"Updating scriptcards for: {json_file.name}")
                
                # Use the new scriptcards-only update method
                success = updater.update_character_scriptcards_only(json_file)
                
                if success:
                    successful += 1
                    logger.info(f"Successfully updated scriptcards for: {json_file.name}")
                else:
                    failed += 1
                    logger.error(f"Failed to update scriptcards for: {json_file.name}")
                    
            except Exception as e:
                failed += 1
                logger.error(f"Error updating scriptcards for {json_file.name}: {e}")
        
        logger.info(f"Scriptcards sync complete! {successful} successful, {failed} failed")
        
    except Exception as e:
        logger.error(f"Scriptcards sync error: {e}")
        sys.exit(1)
    finally:
        logger.info("Closing browser...")
        connection.disconnect()

def convert_character(input_path: Path, output_path: Path) -> bool:
    """Convert single character using complete schema system"""
    try:
        logger.info(f"Converting character: {input_path.name}")
        
        # Load web builder character data
        web_data = load_json(input_path)
        if not web_data:
            logger.error(f"Failed to load character data from {input_path}")
            return False
        
        # Initialize complete schema system
        mapper = SchemaMapper()
        validator = SchemaValidator()
        
        # Convert using complete schema system
        roll20_data = mapper.web_builder_to_roll20(web_data)
        if not roll20_data:
            logger.error(f"Failed to convert character data for {input_path.name}")
            return False
        
        # Validate converted data
        is_valid, errors, warnings = validator.validate_character(roll20_data)
        
        if errors:
            logger.error(f"Validation errors for {input_path.name}: {errors}")
            return False
        
        if warnings:
            logger.warning(f"Validation warnings for {input_path.name}: {warnings}")
        
        # Get field coverage analysis
        coverage = validator.validate_field_coverage(roll20_data)
        logger.info(f"Field coverage: {coverage['actual_count']}/{coverage['expected_total']} "
                   f"({coverage['coverage_ratio']:.1%})")
        
        # Save converted character
        save_json(output_path, roll20_data)
        
        logger.info(f"Successfully converted {input_path.name} -> {output_path.name}")
        logger.info(f"Generated {coverage['actual_count']} total fields")
        
        return True
        
    except Exception as e:
        logger.error(f"Error converting character {input_path.name}: {e}", exc_info=True)
        return False

def convert_all_characters():
    """Convert all characters using complete schema system"""
    input_dir = Path("all_data") / "characters" / "input"
    output_dir = Path("all_data") / "characters" / "extracted"
    
    if not input_dir.exists():
        logger.error(f"Input directory not found: {input_dir}")
        return False
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Find all character JSON files
    input_files = list(input_dir.glob("*.json"))
    
    if not input_files:
        logger.warning(f"No character files found in {input_dir}")
        return False
    
    logger.info(f"Converting {len(input_files)} characters using complete schema system")
    
    # Process each character
    successful = 0
    failed = 0
    
    for input_file in input_files:
        output_file = output_dir / input_file.name
        
        if convert_character(input_file, output_file):
            successful += 1
        else:
            failed += 1
    
    logger.info(f"Conversion complete: {successful} successful, {failed} failed")
    
    # Test Brother Rainard specifically if it exists
    brother_rainard_input = input_dir / "Brother_Rainard.json"
    if brother_rainard_input.exists():
        logger.info("Testing Brother Rainard conversion specifically...")
        brother_rainard_output = output_dir / "Brother_Rainard.json"
        
        if convert_character(brother_rainard_input, brother_rainard_output):
            # Load and analyze the result
            result_data = load_json(brother_rainard_output)
            if result_data:
                attributes = result_data.get('attributes', {})
                
                # Check critical stats
                critical_stats = {
                    'char_avoidance': attributes.get('char_avoidance', '0'),
                    'char_durability': attributes.get('char_durability', '0'),
                    'char_resolve': attributes.get('char_resolve', '0'),
                    'char_accuracy': attributes.get('char_accuracy', '0'),
                    'char_damage': attributes.get('char_damage', '0')
                }
                
                logger.info(f"Brother Rainard critical stats: {critical_stats}")
                
                # Check if stats are no longer zero
                non_zero_stats = {k: v for k, v in critical_stats.items() if v != "0"}
                logger.info(f"Non-zero stats: {non_zero_stats}")
                
                if len(non_zero_stats) >= 4:
                    logger.info("✅ Brother Rainard conversion SUCCESS - Combat stats calculated correctly!")
                else:
                    logger.error("❌ Brother Rainard conversion FAILED - Combat stats still zero")
    
    return successful > 0

def sync_characters():
    """Sync all characters from input directory - create new or update existing"""
    connection = Roll20Connection()
    
    try:
        # Connect to Roll20
        page = connection.connect()
        
        # Handle login
        if not handle_login(page):
            logger.error("Login failed")
            return
        
        # Create interfaces
        chat = ChatInterface(page)
        
        # Navigate to chat
        chat.navigate_to_chat()
        
        # Create updater
        updater = CharacterUpdater(chat)
        
        # Get all JSON files from characters\input
        input_dir = Path("all_data") / "characters" / "input"
        if not input_dir.exists():
            logger.error(f"Input directory not found: {input_dir}")
            return
        
        json_files = list(input_dir.glob("*.json"))
        if not json_files:
            logger.error(f"No JSON files found in {input_dir}")
            return
        
        logger.info(f"Found {len(json_files)} character files to process")
        
        # Process each character file
        successful = 0
        failed = 0
        
        for json_file in json_files:
            try:
                logger.info(f"Processing: {json_file.name}")
                
                # The updater will automatically check if character exists
                # and either create or update accordingly
                success = updater.update_character_from_json(json_file)
                
                if success:
                    successful += 1
                    logger.info(f"Successfully synced: {json_file.name}")
                else:
                    failed += 1
                    logger.error(f"Failed to sync: {json_file.name}")
                    
            except Exception as e:
                failed += 1
                logger.error(f"Error processing {json_file.name}: {e}")
        
        logger.info(f"Sync complete! {successful} successful, {failed} failed")
        
    except Exception as e:
        logger.error(f"Sync error: {e}")
        sys.exit(1)
    finally:
        logger.info("Closing browser...")
        connection.disconnect()

def upload_characters():
    """Upload characters using complete schema system"""
    extracted_dir = Path("all_data") / "characters" / "extracted"
    
    if not extracted_dir.exists():
        logger.error(f"Extracted directory not found: {extracted_dir}")
        return False
    
    # Find all converted character files
    character_files = list(extracted_dir.glob("*.json"))
    
    if not character_files:
        logger.warning(f"No character files found in {extracted_dir}")
        return False
    
    logger.info(f"Preparing {len(character_files)} characters for upload")
    
    # Initialize uploader
    uploader = SchemaUploader()
    
    # Load all character data
    characters_data = {}
    for char_file in character_files:
        char_data = load_json(char_file)
        if char_data:
            char_name = char_data.get('metadata', {}).get('name', char_file.stem)
            characters_data[char_name] = char_data
        else:
            logger.warning(f"Failed to load character file: {char_file}")
    
    # Upload characters
    results = uploader.bulk_upload_characters(characters_data)
    
    # Report results
    successful = sum(1 for success in results.values() if success)
    failed = len(results) - successful
    
    logger.info(f"Upload preparation complete: {successful} successful, {failed} failed")
    
    # Get validation summary
    validation_summary = uploader.get_validation_summary()
    if validation_summary['total_errors'] > 0:
        logger.warning(f"Validation issues: {validation_summary}")
    
    return successful > 0

def color_macros():
    """Color macro buttons for characters"""
    logger.info("Macro coloring functionality will be implemented in Phase 3")
    print("Macro coloring system not yet implemented.")
    print("This will be available after Phase 2 completion.")

def process_downloads_and_prepare_for_sync():
    """Process downloaded character files and prepare them for Roll20 sync."""
    logger.info("Starting process to prepare downloaded characters for sync...")
    try:
        processed_count, failed_count = process_downloaded_characters()
        logger.info(f"Processing complete. Prepared {processed_count} characters. Failed to process {failed_count} files.")
        if processed_count > 0:
            logger.info(f"You can now run 'python main.py sync' to upload them to Roll20.")
    except Exception as e:
        logger.error(f"An error occurred during download processing: {e}", exc_info=True)

def process_downloads():
    """Process JSON files from Downloads folder and move to input directory"""
    import os
    from pathlib import Path
    
    logger.info("=== DEBUGGING: main.py process_downloads() function called ===")
    logger.info("=== DEBUGGING: This is the OLD process_downloads that DOES NOT use schema system ===")
    
    # Common downloads locations
    downloads_paths = [
        Path.home() / "Downloads",
        Path("/mnt/c/Users") / os.environ.get('USERNAME', '') / "Downloads" if os.name == 'nt' else None
    ]
    
    # Filter valid paths
    downloads_paths = [p for p in downloads_paths if p and p.exists()]
    
    if not downloads_paths:
        logger.error("No Downloads directory found")
        return False
    
    downloads_dir = downloads_paths[0]
    logger.info(f"=== DEBUGGING: Processing downloads from: {downloads_dir} ===")
    logger.info(f"=== DEBUGGING: This function will NOT transform data - it only moves files ===")
    
    # Find recent JSON files
    json_files = []
    for json_file in downloads_dir.glob("*.json"):
        # Check if it's a recent file (last 24 hours or newer than existing)
        if json_file.stat().st_mtime > (Path().cwd() / "processed_timestamp").stat().st_mtime if (Path().cwd() / "processed_timestamp").exists() else True:
            json_files.append(json_file)
    
    if not json_files:
        logger.info("No new JSON files found in Downloads")
        return True
    
    # Create input directory
    input_dir = Path("all_data") / "characters" / "input"
    input_dir.mkdir(parents=True, exist_ok=True)
    
    processed_count = 0
    for json_file in json_files:
        try:
            logger.info(f"=== DEBUGGING: Processing file {json_file.name} ===")
            logger.info(f"=== DEBUGGING: File size: {json_file.stat().st_size} bytes ===")
            
            # Load and validate it's a character file
            data = load_json(json_file)
            logger.info(f"=== DEBUGGING: Data loaded successfully: {data is not None} ===")
            if data:
                logger.info(f"=== DEBUGGING: Data keys: {list(data.keys())} ===")
                logger.info(f"=== DEBUGGING: Has characterData: {'characterData' in data} ===")
                logger.info(f"=== DEBUGGING: Has name: {'name' in data} ===")
            
            if data and ('characterData' in data or 'name' in data):
                # Move to input directory
                target_path = input_dir / json_file.name
                logger.info(f"=== DEBUGGING: Moving file to: {target_path} ===")
                logger.info(f"=== DEBUGGING: WARNING - No schema transformation will occur! ===")
                json_file.rename(target_path)
                logger.info(f"Moved {json_file.name} to input directory")
                processed_count += 1
            else:
                logger.warning(f"Skipped {json_file.name} - not a character file")
        except Exception as e:
            logger.error(f"Error processing {json_file.name}: {e}")
    
    # Update timestamp
    (Path().cwd() / "processed_timestamp").touch()
    
    logger.info(f"=== DEBUGGING: main.py process_downloads completed ===")
    logger.info(f"Processed {processed_count} character files from Downloads")
    return processed_count > 0

def main():
    """Main application entry"""
    parser = argparse.ArgumentParser(description="Roll20 API Automation Tool")
    parser.add_argument("action", choices=["extract", "sync", "sync-scriptcards", "convert", "upload", "color-macros", "process-downloads", "test"], 
                       help="Action to perform: extract/sync for Roll20 automation, sync-scriptcards for scriptcards-only updates, convert/upload for schema system, color-macros, process-downloads, or test")
    
    args = parser.parse_args()
    
    # Execute requested action
    if args.action == "extract":
        extract_all_characters()
    elif args.action == "sync":
        sync_characters()
    elif args.action == "sync-scriptcards":
        sync_scriptcards_only()
    elif args.action == "convert":
        return convert_all_characters()
    elif args.action == "upload":
        return upload_characters()
    elif args.action == "color-macros":
        color_macros()
    elif args.action == "process-downloads":
        process_downloads_and_prepare_for_sync()
    elif args.action == "test":
        # Test Brother Rainard conversion specifically
        input_file = Path("all_data") / "characters" / "input" / "Brother_Rainard.json"
        output_file = Path("all_data") / "characters" / "extracted" / "Brother_Rainard.json"
        
        if input_file.exists():
            return convert_character(input_file, output_file)
        else:
            logger.error(f"Brother Rainard test file not found: {input_file}")
            return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)