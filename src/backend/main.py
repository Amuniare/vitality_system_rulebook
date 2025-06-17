"""
Roll20 API Automation Tool
Main entry point
"""
import logging
from pathlib import Path
import sys
import time
import argparse

from .utils.logging import setup_logging
from .api.connection import Roll20Connection
from .api.chat_interface import ChatInterface
from .character.updater import CharacterUpdater
from .character.api_extractor import CharacterExtractor
from .utils.json_utils import save_json
from .utils.file_utils import process_downloaded_characters # New Import

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

def main():
    """Main application entry"""
    parser = argparse.ArgumentParser(description="Roll20 API Automation Tool")
    parser.add_argument("action", choices=["extract", "sync", "color-macros", "process-downloads"], 
                       help="Action to perform: extract all characters, sync characters from input, color macro buttons, or process downloaded characters")
    
    args = parser.parse_args()
    
    # Execute requested action
    if args.action == "extract":
        extract_all_characters()
    elif args.action == "sync":
        sync_characters()
    elif args.action == "color-macros":
        color_macros()
    elif args.action == "process-downloads":
        process_downloads_and_prepare_for_sync()

if __name__ == "__main__":
    main()