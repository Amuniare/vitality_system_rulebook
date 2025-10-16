"""
Enhanced character updater using custom Roll20 API
"""
import logging
from typing import Any, Optional, Dict, List
from pathlib import Path
import json

from ..api.chat_interface import ChatInterface
from ..utils.json_utils import load_json, save_json
from ..utils.scriptcards_templates import ScriptCardsTemplateManager, expand_character_abilities
from .differ import CharacterDiffer

logger = logging.getLogger(__name__)

# Template sheets to skip
TEMPLATE_SHEETS = ["MacroMule", "ScriptCards_TemplateMule"]


class CharacterUpdater:
    """Handles character updates via custom Roll20 API"""
    
    def __init__(self, chat_interface: ChatInterface):
        self.chat = chat_interface
        self.template_manager = ScriptCardsTemplateManager()
        self.update_state_file = Path("update_state.json")
        
    def _should_skip_character(self, char_name: str) -> bool:
        """Check if character should be skipped (template sheets)"""
        return char_name in TEMPLATE_SHEETS
    
    def _load_update_state(self) -> Dict[str, Any]:
        """Load saved update state for resume capability"""
        try:
            if self.update_state_file.exists():
                return load_json(self.update_state_file)
        except Exception as e:
            logger.debug(f"Could not load update state: {e}")
        
        return {"updated_characters": [], "failed_characters": []}
    
    def _save_update_state(self, state: Dict[str, Any]):
        """Save update state for resume capability"""
        try:
            save_json(state, self.update_state_file)
        except Exception as e:
            logger.warning(f"Could not save update state: {e}")
    
    def bulk_update_characters(self, character_data_dict: Dict[str, Any]) -> bool:
        """Update multiple characters at once with resume capability"""
        try:
            # Load update state
            state = self._load_update_state()
            already_updated = set(state.get("updated_characters", []))
            
            # Filter out already updated and template sheets
            characters_to_update = {}
            for char_name, char_data in character_data_dict.items():
                if char_name not in already_updated and not self._should_skip_character(char_name):
                    characters_to_update[char_name] = char_data
                elif self._should_skip_character(char_name):
                    logger.info(f"Skipping template sheet: {char_name}")
            
            if not characters_to_update:
                logger.info("No characters need updating")
                return True
            
            logger.info(f"Starting bulk update of {len(characters_to_update)} characters")
            
            # Expand all character data
            expanded_data = {}
            for char_name, char_data in characters_to_update.items():
                expanded_data[char_name] = self._expand_character_data(char_data)
            
            # Create bulk handout
            if not self._create_bulk_handout(expanded_data):
                logger.error("Failed to create bulk data handout")
                return False
            
            # Send bulk update command
            self.chat.send_command("!bulk-update")
            
            # Wait for completion
            response = self._wait_for_bulk_completion(timeout=300)
            
            if response and "BULK_UPDATE_COMPLETE" in response:
                logger.info("Bulk update completed successfully")
                
                # Update state
                state["updated_characters"].extend(list(characters_to_update.keys()))
                self._save_update_state(state)
                
                # Clean up
                self._cleanup_bulk_handout()
                
                # Remove state file after successful completion
                if self.update_state_file.exists():
                    self.update_state_file.unlink()
                    
                return True
            else:
                logger.error("Bulk update failed")
                if response:
                    logger.error(f"Response: {response}")
                return False
                
        except Exception as e:
            logger.error(f"Bulk update failed: {e}")
            return False
    
    def _expand_character_data(self, character_data: Dict[str, Any]) -> Dict[str, Any]:
        """Expand compressed abilities in character data"""
        try:
            # Skip expansion for template sheets
            char_name = character_data.get('metadata', {}).get('name', 'unknown')
            if self._should_skip_character(char_name):
                logger.debug(f"Skipping expansion for template sheet: {char_name}")
                return character_data
            
            # Use the utility function to expand abilities
            expanded_data = expand_character_abilities(character_data, self.template_manager)
            logger.debug(f"Expanded character data for {char_name}")
            return expanded_data
            
        except Exception as e:
            logger.error(f"Failed to expand character data: {e}")
            return character_data
    
    def _wait_for_bulk_completion(self, timeout: int = 300) -> Optional[str]:
        """Wait for bulk update completion"""
        import time
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            response = self.chat.wait_for_response(timeout=10)
            
            if response:
                logger.debug(f"Bulk update progress: {response[:100]}...")
                
                if "BULK_UPDATE_COMPLETE" in response:
                    return response
                    
                if "error" in response.lower() or "failed" in response.lower():
                    return response
            
            time.sleep(5)
        
        logger.error(f"Bulk update timeout after {timeout} seconds")
        return None
    
    def _create_character_handout(self, char_name: str, character_data: Dict[str, Any]) -> bool:
        """Create a handout with character data for the API to read"""
        try:
            logger.info(f"Creating handout for character: {char_name}")
            
            # Navigate to journal to create handout
            if not self._navigate_to_journal():
                return False
            
            # Format data for handout
            json_data = json.dumps(character_data, indent=2)
            handout_content = f"CHARACTER_DATA_START\n{json_data}\nCHARACTER_DATA_END"
            handout_name = f"CharacterUpdater_{char_name}"
            
            # Create the handout
            if self._create_handout_with_content(handout_name, handout_content):
                logger.info(f"Successfully created handout: {handout_name}")
                return True
            else:
                logger.error(f"Failed to create handout: {handout_name}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to create character handout: {e}")
            return False

    def _create_bulk_handout(self, bulk_data: Dict[str, Any]) -> bool:
        """Create bulk update handout"""
        try:
            logger.info("Creating bulk update handout...")
            
            # Navigate to journal
            if not self._navigate_to_journal():
                return False
            
            # Format data for handout
            json_data = json.dumps(bulk_data, indent=2)
            handout_content = f"BULK_UPDATE_START\n{json_data}\nBULK_UPDATE_END"
            handout_name = "CharacterUpdater_BulkData"
            
            # Create the handout
            if self._create_handout_with_content(handout_name, handout_content):
                logger.info("Successfully created bulk update handout")
                return True
            else:
                logger.error("Failed to create bulk update handout")
                return False
                
        except Exception as e:
            logger.error(f"Failed to create bulk handout: {e}")
            return False

    def _navigate_to_journal(self) -> bool:
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
                journal_tab = self.chat.page.locator(selector).first
                if journal_tab.count() > 0:
                    journal_tab.click()
                    import time
                    time.sleep(2)  # Wait for journal to load
                    logger.debug("Successfully navigated to journal tab")
                    return True
            
            logger.error("Could not find journal tab")
            return False
            
        except Exception as e:
            logger.error(f"Failed to navigate to journal: {e}")
            return False

    def _navigate_back_to_chat(self):
        """Navigate back to the chat tab"""
        try:
            chat_selectors = [
                "a[href='#textchat']", 
                ".ui-tabs-anchor:has-text('Chat')",
                "#ui-tabs-nav li a:has-text('Chat')"
            ]
            
            for selector in chat_selectors:
                chat_tab = self.chat.page.locator(selector).first
                if chat_tab.count() > 0:
                    chat_tab.click()
                    import time
                    time.sleep(1)
                    logger.debug("Successfully navigated back to chat tab")
                    return True
                    
            logger.warning("Could not find chat tab")
            return False
            
        except Exception as e:
            logger.error(f"Failed to navigate to chat: {e}")
            return False

    def _create_handout_with_content(self, handout_name: str, content: str) -> bool:
        """Create a handout with the given name and content using improved method"""
        try:
            import time
            
            logger.info(f"Creating handout: {handout_name}")
            
            # Step 1: Click "Add Handout" button
            add_handout_button = self.chat.page.locator("#addnewhandout").first
            if add_handout_button.count() == 0:
                logger.error("Add handout button not found")
                return False
            
            add_handout_button.click()
            time.sleep(3)  # Wait for handout dialog to open
            
            # Step 2: Set handout name
            name_input = self.chat.page.locator(".ui-dialog input.name").first
            if name_input.count() == 0:
                logger.error("Handout name input not found")
                return False
            
            name_input.clear()
            name_input.type(handout_name)
            time.sleep(0.5)
            
            # Step 3: Try clipboard method first
            try:
                # Check if clipboard API is available
                clipboard_available = self.chat.page.evaluate("""
                    () => {
                        return typeof navigator.clipboard !== 'undefined' && 
                               typeof navigator.clipboard.writeText === 'function';
                    }
                """)
                
                if clipboard_available:
                    # Copy content to clipboard
                    self.chat.page.evaluate(f"navigator.clipboard.writeText({repr(content)})")
                    time.sleep(0.5)
                    
                    # Focus the notes area and paste
                    notes_editor = self.chat.page.locator(".ui-dialog .note-editable[contenteditable='true']").first
                    if notes_editor.count() > 0:
                        notes_editor.click()
                        time.sleep(0.5)
                        self.chat.page.keyboard.press("Control+a")
                        time.sleep(0.2)
                        self.chat.page.keyboard.press("Control+v")
                        time.sleep(1)
                        logger.info("Successfully set content via clipboard")
                    else:
                        raise Exception("Notes editor not found for clipboard method")
                else:
                    raise Exception("Clipboard API not available")
                    
            except Exception as clipboard_error:
                logger.warning(f"Clipboard method failed: {clipboard_error}")
                
                # Fallback: Direct JavaScript injection with proper function wrapper
                try:
                    js_code = f"""
                    (function() {{
                        const notesArea = document.querySelector('.ui-dialog .handout .notes textarea') ||
                                        document.querySelector('.ui-dialog textarea[name*="notes"]') ||
                                        document.querySelector('.ui-dialog .note-editable');
                        
                        if (notesArea) {{
                            if (notesArea.tagName === 'TEXTAREA') {{
                                notesArea.value = {repr(content)};
                                notesArea.dispatchEvent(new Event('change', {{bubbles: true}}));
                            }} else {{
                                notesArea.textContent = {repr(content)};
                                notesArea.dispatchEvent(new Event('input', {{bubbles: true}}));
                            }}
                            return 'success';
                        }} else {{
                            return 'not_found';
                        }}
                    }})();
                    """
                    
                    result = self.chat.page.evaluate(js_code)
                    
                    if result == 'success':
                        logger.info("Successfully set handout content via JavaScript")
                    else:
                        logger.error("Could not find notes area in handout dialog")
                        return False
                        
                except Exception as js_error:
                    logger.error(f"JavaScript injection also failed: {js_error}")
                    return False
            
            time.sleep(1)  # Give time for content to be processed
            
            # Step 4: Save the handout
            save_button = self.chat.page.locator(".ui-dialog button.ui-button:has-text('Save Changes')").first
            if save_button.count() == 0:
                logger.error("Save button not found")
                return False
            
            save_button.click()
            time.sleep(2)  # Wait for save to complete
            
            # Step 5: Close the handout dialog
            self._close_handout_dialog()
            
            logger.info(f"Successfully created handout: {handout_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create handout: {e}")
            return False

    def _close_handout_dialog(self):
        """Close the currently open handout dialog"""
        try:
            import time
            
            # Try multiple selectors for close button
            close_selectors = [
                ".ui-dialog-titlebar-close",
                ".ui-dialog .ui-dialog-titlebar button",
                ".ui-dialog .close",
                ".dialog-close",
                "button.ui-dialog-titlebar-close"
            ]
            
            for selector in close_selectors:
                close_button = self.chat.page.locator(selector).first
                if close_button.count() > 0:
                    close_button.click()
                    time.sleep(1)
                    logger.debug("Successfully closed handout dialog")
                    return
            
            # If no close button found, try pressing Escape
            logger.debug("No close button found, trying Escape key")
            self.chat.page.keyboard.press("Escape")
            time.sleep(1)
            
        except Exception as e:
            logger.warning(f"Could not close handout dialog: {e}")

    def _cleanup_character_handout(self, char_name: str):
        """Clean up character data handout"""
        handout_name = f"CharacterUpdater_{char_name}"
        self.chat.send_command(f"!handout-delete {handout_name}")
        
    def _cleanup_bulk_handout(self):
        """Clean up bulk data handout"""
        self.chat.send_command("!handout-delete CharacterUpdater_BulkData")

    def create_character_from_json(self, json_path: Path) -> bool:
        """Create a new character from JSON template"""
        try:
            # Load and expand character data
            data = load_json(json_path)
            char_name = data["metadata"]["name"]
            
            # Skip template sheets
            if self._should_skip_character(char_name):
                logger.info(f"Skipping template sheet: {char_name}")
                return True
            
            logger.info(f"Creating character: {char_name}")
            
            # Expand compressed abilities using ScriptCards template
            expanded_data = self._expand_character_data(data)
            
            # Create handout with character data
            if not self._create_character_handout(char_name, expanded_data):
                logger.error(f"Failed to create data handout for {char_name}")
                return False
            
            # Navigate back to chat for API commands
            self._navigate_back_to_chat()
            
            # Send create command
            self.chat.send_command(f"!create-character {char_name}")
            response = self.chat.wait_for_response(timeout=30)
            
            success = response and "Successfully created character" in response
            
            if success:
                logger.info(f"Successfully created character: {char_name}")
            else:
                logger.error(f"Failed to create character: {char_name}")
                if response:
                    logger.error(f"Response: {response}")
            
            # Always cleanup the handout
            self._cleanup_character_handout(char_name)
            
            return success
                    
        except Exception as e:
            logger.error(f"Failed to create character from {json_path}: {e}")
            return False

    def update_character_from_json(self, json_path: Path) -> bool:
        """Update a single character from JSON template"""
        try:
            # Load template data
            template_data = load_json(json_path)
            char_name = template_data["metadata"]["name"]
            
            # Skip template sheets
            if self._should_skip_character(char_name):
                logger.info(f"Skipping template sheet: {char_name}")
                return True
            
            logger.info(f"Starting update for: {char_name}")
            
            # Skip change detection for now - just do full update
            # (Change detection via chat is unreliable)
            return self._perform_full_update(json_path)
            
        except Exception as e:
            logger.error(f"Update failed for {json_path}: {e}")
            return False

    def _perform_full_update(self, json_path: Path) -> bool:
        """Perform full character update with automatic creation if character doesn't exist"""
        logger.info("Performing full character update")
        
        try:
            # Load and expand character data
            data = load_json(json_path)
            char_name = data["metadata"]["name"]
            
            logger.info(f"Full update for character: {char_name}")
            
            # Expand compressed abilities using ScriptCards template
            expanded_data = self._expand_character_data(data)
            
            # Create handout with character data
            if not self._create_character_handout(char_name, expanded_data):
                logger.error(f"Failed to create data handout for {char_name}")
                return False
            
            # Navigate back to chat for API commands
            self._navigate_back_to_chat()
            
            # Send update command
            self.chat.send_command(f"!update-character {char_name}")
            response = self.chat.wait_for_response(timeout=30)
            logger.info(f"DEBUG: Raw response for {char_name}: '{response}'")
            logger.info(f"DEBUG: Response type: {type(response)}")
            logger.info(f"DEBUG: Contains 'not found': {'not found' in response if response else 'None response'}")
            
            # Check if character was found and updated successfully
            if response and f"Successfully updated character: {char_name}" in response:
                logger.info(f"Full update completed successfully for: {char_name}")
                self._cleanup_character_handout(char_name)
                return True
            elif response and f'Character "{char_name}" not found' in response:
                # Character doesn't exist, try to create it first
                logger.info(f"Character '{char_name}' not found, attempting to create it")
                
                # Send create command
                self.chat.send_command(f"!create-character {char_name}")
                create_response = self.chat.wait_for_response(timeout=30)
                
                if create_response and "Successfully created character" in create_response:
                    logger.info(f"Successfully created character: {char_name}")
                    
                    # Now try to update the newly created character
                    self.chat.send_command(f"!update-character {char_name}")
                    update_response = self.chat.wait_for_response(timeout=30)
                    
                    if update_response and "Successfully updated character" in update_response:
                        logger.info(f"Successfully updated newly created character: {char_name}")
                        self._cleanup_character_handout(char_name)
                        return True
                    else:
                        logger.error(f"Failed to update newly created character: {char_name}")
                        if update_response:
                            logger.error(f"Update response: {update_response}")
                        self._cleanup_character_handout(char_name)
                        return False
                else:
                    logger.error(f"Failed to create character: {char_name}")
                    if create_response:
                        logger.error(f"Create response: {create_response}")
                    self._cleanup_character_handout(char_name)
                    return False
            else:
                logger.error(f"Full update failed for: {char_name}")
                if response:
                    logger.error(f"Response: {response}")
                self._cleanup_character_handout(char_name)
                return False
                    
        except Exception as e:
            logger.error(f"Full update failed: {e}")
            return False

    def update_character_scriptcards_only(self, json_path: Path) -> bool:
        """Update only the scriptcards/abilities for a character from JSON template"""
        try:
            # Load template data
            template_data = load_json(json_path)
            char_name = template_data["metadata"]["name"]
            
            # Skip template sheets
            if self._should_skip_character(char_name):
                logger.info(f"Skipping template sheet: {char_name}")
                return True
            
            logger.info(f"Starting scriptcards-only update for: {char_name}")
            
            # Extract only abilities data from the character
            abilities_data = self._extract_abilities_only(template_data)
            if not abilities_data:
                logger.error(f"No abilities found for character: {char_name}")
                return False
            
            # Create handout with just abilities data
            if not self._create_scriptcards_handout(char_name, abilities_data):
                logger.error(f"Failed to create scriptcards handout for {char_name}")
                return False
            
            # Navigate back to chat for API commands
            self._navigate_back_to_chat()
            
            # Send scriptcards-only update command
            self.chat.send_command(f"!update-scriptcards {char_name}")
            response = self.chat.wait_for_response(timeout=30)
            
            success = response and f"Successfully updated scriptcards for: {char_name}" in response
            
            if success:
                logger.info(f"Successfully updated scriptcards for: {char_name}")
            else:
                logger.error(f"Failed to update scriptcards for: {char_name}")
                if response:
                    logger.error(f"Response: {response}")
            
            # Always cleanup the handout
            self._cleanup_scriptcards_handout(char_name)
            
            return success
            
        except Exception as e:
            logger.error(f"Scriptcards update failed for {json_path}: {e}")
            return False

    def _extract_abilities_only(self, character_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract only abilities from character data and expand them with new scriptcards template"""
        try:
            char_name = character_data.get('metadata', {}).get('name', 'unknown')
            
            # Skip expansion for template sheets
            if self._should_skip_character(char_name):
                logger.debug(f"Skipping abilities extraction for template sheet: {char_name}")
                return None
            
            # Load the new scriptcards template
            template_path = Path("src/roll20ScriptcardsAndSheets/scriptcards_v6/Scriptcards_Attacks_Library_v6.1.txt")
            if not template_path.exists():
                logger.error(f"Scriptcards template not found: {template_path}")
                return None
            
            with open(template_path, 'r', encoding='utf-8') as f:
                new_template_content = f.read()
            
            # Extract abilities from character data
            abilities = character_data.get('abilities', [])
            if not abilities:
                logger.warning(f"No abilities found for character: {char_name}")
                return None
            
            # Create abilities-only data structure with new template content
            abilities_only_data = {
                'metadata': {
                    'name': char_name,
                    'type': 'abilities_only'
                },
                'abilities': []
            }
            
            # Process each ability and replace with new template content
            for ability in abilities:
                content = ability.get('content', '')
                ability_type = ability.get('type', '')
                
                # Handle both indexed and expanded ability formats
                if isinstance(content, int) and ability_type == 'indexed':
                    # This is an indexed ability - replace with new template using the index
                    attack_index = content
                    attack_index_str = str(attack_index)
                    
                    logger.debug(f"Processing indexed ability '{ability.get('name', 'unknown')}' with index {attack_index} (type: {type(attack_index)})")
                    
                    # Validate attack index
                    if attack_index < 0:
                        logger.error(f"Invalid negative attack index {attack_index} for ability '{ability.get('name', 'unknown')}'")
                        abilities_only_data['abilities'].append(ability)
                        continue
                    
                    new_content = new_template_content.replace('{number}', attack_index_str)
                    
                    # Create new ability with updated content
                    new_ability = ability.copy()
                    new_ability['content'] = new_content
                    new_ability['type'] = 'expanded'  # Mark as expanded since we're replacing with full content
                    abilities_only_data['abilities'].append(new_ability)
                    
                    logger.debug(f"Successfully updated indexed ability '{ability.get('name', 'unknown')}' (index {attack_index} -> '{attack_index_str}') with new scriptcards template")
                    
                elif isinstance(content, str) and '!scriptcard' in content:
                    # This is already expanded scriptcard content - extract index and replace
                    import re
                    index_match = re.search(r'--Rbyindex\|.*?;repeating_attacks;(\d+)', content)
                    
                    if index_match:
                        attack_index_str = index_match.group(1)
                        attack_index = int(attack_index_str)
                        
                        logger.debug(f"Processing expanded ability '{ability.get('name', 'unknown')}' with extracted index {attack_index} ('{attack_index_str}')")
                        
                        # Validate attack index
                        if attack_index < 0:
                            logger.error(f"Invalid negative attack index {attack_index} for ability '{ability.get('name', 'unknown')}'")
                            abilities_only_data['abilities'].append(ability)
                            continue
                        
                        # Replace {number} placeholder with the actual index
                        new_content = new_template_content.replace('{number}', attack_index_str)
                        
                        # Create new ability with updated content
                        new_ability = ability.copy()
                        new_ability['content'] = new_content
                        abilities_only_data['abilities'].append(new_ability)
                        
                        logger.debug(f"Successfully updated expanded ability '{ability.get('name', 'unknown')}' (index {attack_index}) with new scriptcards template")
                    else:
                        # If no index found, keep original content
                        abilities_only_data['abilities'].append(ability)
                        logger.warning(f"Could not find attack index in ability '{ability.get('name', 'unknown')}'")
                else:
                    # Non-scriptcard abilities (or other types), keep as-is
                    abilities_only_data['abilities'].append(ability)
                    logger.debug(f"Keeping non-scriptcard ability '{ability.get('name', 'unknown')}' unchanged")
            
            logger.info(f"Extracted {len(abilities_only_data['abilities'])} abilities for {char_name}")
            return abilities_only_data
            
        except Exception as e:
            logger.error(f"Failed to extract abilities: {e}")
            return None

    def _create_scriptcards_handout(self, char_name: str, abilities_data: Dict[str, Any]) -> bool:
        """Create a handout with abilities data only for the API to read"""
        try:
            logger.info(f"Creating scriptcards handout for character: {char_name}")
            
            # Navigate to journal to create handout
            if not self._navigate_to_journal():
                return False
            
            # Format data for handout
            json_data = json.dumps(abilities_data, indent=2)
            handout_content = f"SCRIPTCARDS_DATA_START\n{json_data}\nSCRIPTCARDS_DATA_END"
            handout_name = f"ScriptcardsUpdater_{char_name}"
            
            # Create the handout
            if self._create_handout_with_content(handout_name, handout_content):
                logger.info(f"Successfully created scriptcards handout: {handout_name}")
                return True
            else:
                logger.error(f"Failed to create scriptcards handout: {handout_name}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to create scriptcards handout: {e}")
            return False

    def _cleanup_scriptcards_handout(self, char_name: str):
        """Clean up scriptcards data handout"""
        handout_name = f"ScriptcardsUpdater_{char_name}"
        self.chat.send_command(f"!handout-delete {handout_name}")

    def cleanup_all_update_handouts(self):
        """Clean up all character update handouts"""
        try:
            logger.info("Cleaning up all update handouts...")
            
            # Use API command for cleanup
            self.chat.send_command("!handout-cleanup-updates")
            
            # Navigate back to chat
            self._navigate_back_to_chat()
            
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")





            
