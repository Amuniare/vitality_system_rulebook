"""
Roll20 API Automation Tool
Main entry point
"""
import logging
from pathlib import Path
import sys
import time
import argparse

from src.utils.logging import setup_logging
from src.api.connection import Roll20Connection
from src.api.chat_interface import ChatInterface
from src.character.updater import CharacterUpdater
from src.character.api_extractor import CharacterExtractor
from src.utils.json_utils import save_json

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



def extract_all_characters(auto_close=False):
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
        
        # Create extractor - use the new API-based extractor
        extractor = CharacterExtractor(chat, page)
        
        # Extract all character data
        logger.info("Starting character extraction process...")
        all_characters = extractor.extract_all_characters()
        
        if not all_characters:
            logger.error("No character data extracted!")
            return
        
        if not all_characters:
            logger.error("No character data extracted!")
            return
        
        # Save extracted data
        output_dir = Path("extracted_characters")
        output_dir.mkdir(exist_ok=True)
        
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
        
        # Handle browser close
        if auto_close:
            logger.info("Auto-closing browser in 3 seconds...")
            time.sleep(3)
        else:
            print(f"\nExtraction complete! Files saved to {output_dir}")
            print("Press Enter to close browser...")
            input()

    except Exception as e:
        logger.error(f"Extraction error: {e}")
        sys.exit(1)
    finally:
        connection.disconnect()

def update_character(auto_close=False):
    """Update a character from template"""
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
        
        # Example: Update a character from template
        template_path = Path('templates') / "characters" / "fred.json"
        if template_path.exists():
            logger.info(f"Updating character from template: {template_path}")
            success = updater.update_character_from_json(template_path)
            
            if success:
                logger.info("Character update completed successfully!")
            else:
                logger.error("Character update failed!")
        else:
            logger.error(f"Template not found: {template_path}")
        
        # Handle browser close
        if auto_close:
            logger.info("Auto-closing browser in 3 seconds...")
            time.sleep(3)
        else:
            print("Press Enter to close browser...")
            input()
        
    except Exception as e:
        logger.error(f"Application error: {e}")
        sys.exit(1)
    finally:
        connection.disconnect()

def create_character(auto_close=False):
    """Create a new character from template"""
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
        
        # Example: Create a character from template
        template_path = Path('templates') / "characters" / "fred.json"
        if template_path.exists():
            logger.info(f"Creating character from template: {template_path}")
            success = updater.create_character_from_json(template_path)
            
            if success:
                logger.info("Character creation completed successfully!")
            else:
                logger.error("Character creation failed!")
        else:
            logger.error(f"Template not found: {template_path}")
        
        # Handle browser close
        if auto_close:
            logger.info("Auto-closing browser in 3 seconds...")
            time.sleep(3)
        else:
            print("Press Enter to close browser...")
            input()
        
    except Exception as e:
        logger.error(f"Application error: {e}")
        sys.exit(1)
    finally:
        connection.disconnect()

def color_macros(auto_close=False):
    """Color macro buttons for characters"""
    logger.info("Macro coloring functionality will be implemented in Phase 3")
    print("Macro coloring system not yet implemented.")
    print("This will be available after Phase 2 completion.")

def main():
    """Main application entry with enhanced argument parsing"""
    parser = argparse.ArgumentParser(description="Roll20 API Automation Tool")
    parser.add_argument("action", choices=["extract", "update", "create", "color-macros"], 
                       help="Action to perform: extract all characters, update from template, create from template, or color macro buttons")
    parser.add_argument("--auto-close", action="store_true", 
                       help="Automatically close browser after operation (default: manual close)")
    parser.add_argument("--manual-close", action="store_true", 
                       help="Manually close browser after operation (default behavior)")
    
    args = parser.parse_args()
    
    # Determine close behavior (default is manual close for backward compatibility)
    auto_close = args.auto_close and not args.manual_close
    
    if auto_close:
        logger.info("Browser will auto-close after operation")
    else:
        logger.info("Browser will require manual close after operation")
    
    # Execute requested action
    if args.action == "extract":
        extract_all_characters(auto_close=auto_close)
    elif args.action == "update":
        update_character(auto_close=auto_close)
    elif args.action == "create":
        create_character(auto_close=auto_close)
    elif args.action == "color-macros":
        color_macros(auto_close=auto_close)

if __name__ == "__main__":
    main()