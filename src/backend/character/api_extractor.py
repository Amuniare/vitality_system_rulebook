"""
Handout-based Character extraction - bypasses chat limits
"""
import logging
import time
import json
from typing import Dict, List, Any, Optional
from pathlib import Path
from playwright.sync_api import Page

from ..api.chat_interface import ChatInterface
from ..utils.json_utils import save_json
from ..utils.scriptcards_templates import ScriptCardsTemplateManager

logger = logging.getLogger(__name__)

# Template sheets to skip
TEMPLATE_SHEETS = ["MacroMule", "ScriptCards_TemplateMule"]


class CharacterExtractor:
    """Character extractor using handout-based data transfer"""
    
    def __init__(self, chat_interface: ChatInterface, page: Page):
        self.chat = chat_interface
        self.page = page
        self.template_manager = ScriptCardsTemplateManager() 
        self.handout_name = "CharacterExtractor_Data"
        self.extraction_state_file = Path("extraction_state.json")
        
    def _test_api(self) -> bool:
        """Test if our custom API is available with retry mechanism"""
        max_retries = 3
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                logger.debug(f"Testing custom API availability (attempt {attempt + 1}/{max_retries})...")
                
                self.chat.send_command("!extract-test")
                response = self.chat.wait_for_response(timeout=10)
                
                if response:
                    # Check for actual API responses
                    api_indicators = [
                        "CharacterExtractor API is working correctly",
                        "Found",
                        "total characters in campaign",
                        "Test character:",
                        "attributes."
                    ]
                    
                    if any(indicator in response for indicator in api_indicators):
                        logger.info("[OK] Custom API is available")
                        return True
                
                if attempt < max_retries - 1:
                    logger.warning(f"API test failed, retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    
            except Exception as e:
                logger.error(f"API test attempt {attempt + 1} failed: {e}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
        
        logger.error("Custom API test failed after all retries")
        return False
    
    def _load_extraction_state(self) -> Dict[str, Any]:
        """Load saved extraction state for resume capability"""
        try:
            if self.extraction_state_file.exists():
                with open(self.extraction_state_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.debug(f"Could not load extraction state: {e}")
        
        return {"extracted_characters": [], "last_batch": 0}
    
    def _save_extraction_state(self, state: Dict[str, Any]):
        """Save extraction state for resume capability"""
        try:
            with open(self.extraction_state_file, 'w', encoding='utf-8') as f:
                json.dump(state, f, indent=2)
        except Exception as e:
            logger.warning(f"Could not save extraction state: {e}")
    
    def _should_skip_character(self, char_name: str) -> bool:
        """Check if character should be skipped (template sheets)"""
        return char_name in TEMPLATE_SHEETS
    
    def _wait_for_extraction_completion(self, timeout: int = 300) -> bool:
        """Wait for extraction completion signal in chat"""
        logger.info("Waiting for extraction to complete...")
        
        start_time = time.time()
        last_progress_time = start_time
        
        while time.time() - start_time < timeout:
            try:
                response = self.chat.wait_for_response(timeout=10)
                
                if response:
                    logger.debug(f"Chat response: {response[:100]}...")
                    
                    # Check for completion signal
                    if "EXTRACTION_COMPLETE" in response:
                        logger.info("[OK] Extraction completed successfully")
                        return True
                    
                    # Check for progress updates
                    if "Processed" in response and "characters" in response:
                        logger.info(f"Progress update: {response}")
                        last_progress_time = time.time()
                    
                    # Check for errors
                    if "error" in response.lower() or "failed" in response.lower():
                        logger.error(f"Extraction error: {response}")
                        return False
                
                # If no progress for 60 seconds, something might be wrong
                if time.time() - last_progress_time > 60:
                    logger.warning("No progress updates for 60 seconds, but continuing to wait...")
                    last_progress_time = time.time()
                
                time.sleep(2)  # Check every 2 seconds
                
            except Exception as e:
                logger.debug(f"Error waiting for completion: {e}")
                time.sleep(5)
        
        logger.error(f"Timeout waiting for extraction completion after {timeout} seconds")
        return False
    
    def extract_all_characters(self) -> Dict[str, Any]:
        """Extract all characters using hybrid handout + browser approach"""
        logger.info("Starting character extraction via hybrid handout method...")
        
        try:
            # Test API availability first
            if not self._test_api():
                logger.error("Custom API not available!")
                return {}
            
            # Use hybrid extraction
            character_data = self.extract_all_characters_hybrid()
            
            if character_data:
                # Clean up extraction state after successful completion
                if self.extraction_state_file.exists():
                    self.extraction_state_file.unlink()
                return character_data
            else:
                logger.error("Hybrid extraction failed")
                return {}
                
        except Exception as e:
            logger.error(f"Character extraction error: {e}")
            return {}

    def extract_all_characters_hybrid(self) -> Dict[str, Any]:
        """Hybrid approach: Use API to create handouts, then browser automation to read them"""
        logger.info("Starting hybrid handout + browser extraction...")
        
        try:
            # Load extraction state for resume capability
            state = self._load_extraction_state()
            start_batch = state.get("last_batch", 0)
            
            # Step 1: Use API to extract all characters to handouts
            logger.info("Sending bulk extraction command...")
            self.chat.send_command("!extract-all-handout")
            
            # Step 2: Wait for completion signal in chat
            if not self._wait_for_extraction_completion():
                logger.error("Extraction did not complete successfully")
                return {}
            
            # Step 3: Navigate to journal to read handouts
            logger.info("Switching to journal to read handouts...")
            self._navigate_to_journal()
            
            # Step 4: Read data from all handout dialogs
            all_character_data = {}
            
            # If resuming, load previously extracted data
            if state.get("extracted_characters"):
                logger.info(f"Resuming from batch {start_batch + 1}")
                for char_name in state["extracted_characters"]:
                    # Reload from saved files
                    try:
                        safe_name = self._create_safe_filename(char_name)
                        char_file = Path("extracted_characters") / f"{safe_name}.json"
                        if char_file.exists():
                            with open(char_file, 'r', encoding='utf-8') as f:
                                all_character_data[char_name] = json.load(f)
                    except Exception as e:
                        logger.warning(f"Could not reload {char_name}: {e}")
            
            for handout_num in range(start_batch + 1, 11):  # Resume from last batch
                handout_name = f"CharacterExtractor_Data_{handout_num}"
                
                logger.info(f"Reading {handout_name}...")
                handout_data = self._read_handout_via_dialog(handout_name)
                
                if handout_data:
                    # Filter out template sheets and add to results
                    batch_count = 0
                    for char_name, char_info in handout_data.items():
                        if not self._should_skip_character(char_name):
                            all_character_data[char_name] = char_info
                            batch_count += 1
                        else:
                            logger.info(f"Skipping template sheet: {char_name}")
                    
                    logger.info(f"[OK] Successfully read {batch_count} characters from {handout_name}")
                    
                    # Update extraction state
                    state["last_batch"] = handout_num
                    state["extracted_characters"] = list(all_character_data.keys())
                    self._save_extraction_state(state)
                else:
                    if handout_num == 1:
                        logger.error(f"Could not read {handout_name} - this suggests a problem")
                        return {}
                    else:
                        logger.info(f"No more handouts found after {handout_name}")
                        break
            
            # Step 5: Navigate back to chat
            self._navigate_to_chat()
            time.sleep(1)
            
            # Step 6: Cleanup handouts
            self.chat.send_command("!handout-cleanup")
            
            logger.info(f"[OK] Hybrid extraction complete! Read {len(all_character_data)} characters from handouts")
            return all_character_data
            
        except Exception as e:
            logger.error(f"Hybrid extraction failed: {e}")
            return {}

    def _navigate_to_journal(self):
        """Navigate to the journal tab"""
        try:
            # Try multiple selectors for journal tab
            journal_selectors = [
                "a[href='#journal']",
                ".ui-tabs-anchor:has-text('Journal')",
                "#ui-tabs-nav li a:has-text('Journal')",
                ".tab:has-text('Journal')"
            ]
            
            for selector in journal_selectors:
                journal_tab = self.page.locator(selector).first
                if journal_tab.count() > 0:
                    journal_tab.click()
                    time.sleep(2)  # Wait for journal to load
                    logger.debug("Successfully navigated to journal tab")
                    return True
            
            logger.error("Could not find journal tab")
            return False
            
        except Exception as e:
            logger.error(f"Failed to navigate to journal: {e}")
            return False

    def _navigate_to_chat(self):
        """Navigate back to the chat tab"""
        try:
            chat_selectors = [
                "a[href='#textchat']", 
                ".ui-tabs-anchor:has-text('Chat')",
                "#ui-tabs-nav li a:has-text('Chat')"
            ]
            
            for selector in chat_selectors:
                chat_tab = self.page.locator(selector).first
                if chat_tab.count() > 0:
                    chat_tab.click()
                    time.sleep(1)
                    logger.debug("Successfully navigated back to chat tab")
                    return True
                    
            logger.warning("Could not find chat tab")
            return False
            
        except Exception as e:
            logger.error(f"Failed to navigate to chat: {e}")
            return False

    def _read_handout_via_dialog(self, handout_name: str) -> Optional[Dict[str, Any]]:
        """Open a handout dialog and extract JSON data"""
        try:
            # Find the handout in journal
            handout_selector = f".journalitem.handout .namecontainer:has-text('{handout_name}')"
            handout_element = self.page.locator(handout_selector).first
            
            if handout_element.count() == 0:
                logger.warning(f"Handout {handout_name} not found in journal")
                return None
            
            # Double-click to open handout dialog
            logger.debug(f"Opening {handout_name} dialog...")
            handout_element.dblclick()
            
            # Wait for dialog to open
            time.sleep(3)
            
            # Extract content from handout dialog
            content_text = self._extract_handout_dialog_content()
            
            if not content_text:
                logger.error(f"Could not extract content from {handout_name} dialog")
                self._close_handout_dialog()
                return None
            
            # Parse JSON from between markers
            character_data = self._parse_json_from_handout_content(content_text)
            
            # Close the dialog
            self._close_handout_dialog()
            
            return character_data
            
        except Exception as e:
            logger.error(f"Failed to read {handout_name}: {e}")
            # Try to close dialog in case it's still open
            self._close_handout_dialog()
            return None

    def _close_handout_dialog(self):
        """Close the currently open handout dialog"""
        try:
            # Try multiple selectors for close button
            close_selectors = [
                ".ui-dialog-titlebar-close",
                ".ui-dialog .ui-dialog-titlebar button",
                ".ui-dialog .close",
                ".dialog-close",
                "button.ui-dialog-titlebar-close"
            ]
            
            for selector in close_selectors:
                close_button = self.page.locator(selector).first
                if close_button.count() > 0:
                    close_button.click()
                    time.sleep(1)
                    logger.debug("Successfully closed handout dialog")
                    return
            
            # If no close button found, try pressing Escape
            logger.debug("No close button found, trying Escape key")
            self.page.keyboard.press("Escape")
            time.sleep(1)
            
        except Exception as e:
            logger.warning(f"Could not close handout dialog: {e}")

    def _extract_handout_dialog_content(self) -> Optional[str]:
        """Extract text content from the currently open handout dialog"""
        try:
            # Try multiple selectors for handout content
            content_selectors = [
                # The specific selector that works
                "body > div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-draggable.ui-resizable > div.dialog.ui-dialog-content.ui-widget-content > div > div > div:nth-child(1) > div > div.content.note-editor.notes",
                
                # More flexible versions
                ".ui-dialog .content.note-editor.notes",
                ".ui-dialog .note-editor.notes",
                ".ui-dialog .notes.content",
                
                # Other potential selectors as fallbacks
                ".ui-dialog .handout textarea[name*='notes']",
                ".ui-dialog .handout .notes textarea",
                ".ui-dialog .handout-notes textarea",
                ".ui-dialog textarea[name='notes']",
                ".ui-dialog .handout .content textarea",
                ".handout-dialog textarea"
            ]
            
            for selector in content_selectors:
                try:
                    content_element = self.page.locator(selector).first
                    if content_element.count() > 0:
                        # Try different methods to get the text content
                        content_text = None
                        
                        # Method 1: input_value() for textarea elements
                        try:
                            content_text = content_element.input_value()
                        except:
                            pass
                        
                        # Method 2: text_content() for div elements
                        if not content_text:
                            try:
                                content_text = content_element.text_content()
                            except:
                                pass
                        
                        # Method 3: inner_text() as another option
                        if not content_text:
                            try:
                                content_text = content_element.inner_text()
                            except:
                                pass
                        
                        if content_text and content_text.strip():
                            logger.debug(f"Successfully extracted content using selector: {selector}")
                            logger.debug(f"Content length: {len(content_text)} characters")
                            return content_text
                            
                except Exception as e:
                    logger.debug(f"Selector {selector} failed: {e}")
                    continue
            
            logger.error("Could not find handout content in dialog")
            return None
            
        except Exception as e:
            logger.error(f"Failed to extract handout dialog content: {e}")
            return None

    def _parse_json_from_handout_content(self, content_text: str) -> Optional[Dict[str, Any]]:
        """Parse JSON data from handout content between markers and compress abilities"""
        try:
            if "EXTRACTION_START" in content_text and "EXTRACTION_END" in content_text:
                start_marker = "EXTRACTION_START\n"
                end_marker = "\nEXTRACTION_END"
                
                start_idx = content_text.find(start_marker)
                end_idx = content_text.find(end_marker)
                
                if start_idx != -1 and end_idx != -1:
                    json_str = content_text[start_idx + len(start_marker):end_idx]
                    
                    try:
                        character_data = json.loads(json_str)
                        
                        # Initialize template manager if needed
                        if not hasattr(self, 'template_manager'):
                            from ..utils.scriptcards_templates import ScriptCardsTemplateManager
                            self.template_manager = ScriptCardsTemplateManager()
                        
                        # Compress abilities in each character (with filtering)
                        for char_name, char_info in character_data.items():
                            if "abilities" in char_info and not self._should_skip_character(char_name):
                                char_info["abilities"] = self._compress_character_abilities(
                                    char_info["abilities"], char_name
                                )
                        
                        logger.debug(f"Successfully parsed {len(character_data)} characters from JSON")
                        return character_data
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse JSON: {e}")
                        return None
            
            logger.error("Could not find extraction markers in handout content")
            return None
            
        except Exception as e:
            logger.error(f"Failed to parse JSON from handout: {e}")
            return None

    def _compress_character_abilities(self, abilities: List[Dict[str, Any]], character_name: str) -> List[Dict[str, Any]]:
        """Compress abilities using ScriptCards templates - Fixed for array format"""
        compressed_abilities = []
        compression_errors = []
        
        try:
            # Skip compression for template sheets
            if self._should_skip_character(character_name):
                logger.debug(f"Skipping compression for template sheet: {character_name}")
                return abilities
            
            for ability_data in abilities:  # Now correctly iterating over array
                try:
                    ability_name = ability_data.get("name", "")
                    if not ability_name:
                        logger.warning("Ability missing name, skipping")
                        continue
                        
                    if "content" in ability_data:
                        # Compress the ability content
                        compressed = self.template_manager.compress_ability_content(
                            ability_name, ability_data["content"], character_name
                        )
                        
                        compressed_ability = {
                            "name": ability_name,
                            "type": compressed.get("type", "full"),
                            "content": compressed.get("content", ability_data["content"]),
                            "showInMacroBar": ability_data.get("showInMacroBar", False),
                            "isTokenAction": ability_data.get("isTokenAction", False)
                        }
                        
                        # Add template metadata if compressed
                        if compressed.get("type") == "indexed":
                            compressed_ability["template_ref"] = compressed.get("template_ref")
                            if compressed.get("compression_ratio"):
                                compressed_ability["compression_ratio"] = compressed.get("compression_ratio")
                                
                        compressed_abilities.append(compressed_ability)
                        logger.debug(f"Processed ability {ability_name}: {compressed.get('type', 'full')}")
                        
                    else:
                        # Keep non-standard ability data as-is
                        compressed_abilities.append(ability_data)
                        logger.debug(f"Kept ability {ability_name} as-is (non-standard format)")
                        
                except Exception as e:
                    logger.error(f"Failed to compress ability {ability_data.get('name', 'unknown')}: {e}")
                    compression_errors.append(ability_data.get('name', 'unknown'))
                    # Fallback: keep original data
                    compressed_abilities.append(ability_data)
                    
        except Exception as e:
            logger.error(f"Ability compression failed completely: {e}")
            return abilities  # Return original if everything fails
        
        # Log summary only at the very end of ALL extraction
        if compression_errors:
            logger.warning(f"Failed to compress {len(compression_errors)} abilities: {', '.join(compression_errors)}")
            
        return compressed_abilities


    def _create_safe_filename(self, char_name: str) -> str:
        """Create a safe filename from character name"""
        safe_name = char_name.replace(" ", "_").replace("/", "_").replace("*", "_")
        safe_name = safe_name.replace("\\", "_").replace(":", "_").replace("?", "_")
        safe_name = safe_name.replace("<", "_").replace(">", "_").replace("|", "_")
        safe_name = safe_name.replace('"', "_")
        
        # Keep only alphanumeric and safe punctuation
        safe_name = "".join(c for c in safe_name if c.isalnum() or c in "._-")
        
        # Limit length and ensure it's not empty
        safe_name = safe_name[:100] if safe_name else "unnamed_character"
        
        return safe_name
    



    