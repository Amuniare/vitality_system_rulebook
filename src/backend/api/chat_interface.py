"""
Roll20 Chat Interface via Browser
"""
import logging
import time
from typing import Optional
from playwright.sync_api import Page

logger = logging.getLogger(__name__)

class ChatInterface:
    """Handles Roll20 chat interaction via browser"""
    
    def __init__(self, page: Page):
        self.page = page
        self.chat_input_selector = "#textchat-input textarea"
        self.chat_log_selector = ".content"
        
    def send_command(self, command: str, wait_for_response: bool = True) -> Optional[str]:
        """Send a command through Roll20 chat"""
        try:
            logger.info(f"Sending command: {command}")
            
            # Find chat input
            chat_input = self.page.locator(self.chat_input_selector).first
            if chat_input.count() == 0:
                logger.error("Chat input not found")
                return None
            
            # Clear and type command
            chat_input.clear()
            chat_input.type(command)
            
            # Press Enter to send
            chat_input.press("Enter")
            
            if wait_for_response:
                return self.wait_for_response()
            
            return "Command sent"
            
        except Exception as e:
            logger.error(f"Failed to send command: {e}")
            return None
    
    def navigate_to_chat(self) -> bool:
        """Ensure chat tab is active"""
        try:
            # Look for chat tab and click it
            chat_tab = self.page.locator("a[href='#textchat'], .ui-tabs-anchor:has-text('Chat')").first
            if chat_tab.count() > 0:
                chat_tab.click()
                time.sleep(1)
                return True
            
            logger.warning("Chat tab not found")
            return False
            
        except Exception as e:
            logger.error(f"Failed to navigate to chat: {e}")
            return False
        

    def get_character_data_via_api(self, char_name: str) -> Optional[str]:
        """Get character data using the new API command"""
        try:
            logger.debug(f"Getting character data via API: {char_name}")
            
            self.send_command(f"!get-character-data {char_name}")
            response = self.wait_for_response(timeout=15)
            
            if response and "CURRENT_DATA_START" in response:
                logger.debug("Successfully received character data from API")
                return response
            else:
                logger.warning("No valid response from character data API command")
                return None
                
        except Exception as e:
            logger.error(f"Failed to get character data via API: {e}")
            return None


    def wait_for_response(self, timeout: int = 5, capture_all: bool = False) -> Optional[str]:
        """Wait for and capture chat response - enhanced for long API responses"""
        try:
            # Wait a moment for response
            time.sleep(2)
            
            if capture_all:
                # For API commands that return long responses, capture more messages
                chat_messages = self.page.locator(f"{self.chat_log_selector} .message").all()
                
                if chat_messages:
                    # Get the last 50 messages to capture full API responses
                    recent_messages = []
                    for msg in chat_messages[-50:]:  # Increased from 3 to 50
                        text = msg.text_content()
                        if text:
                            recent_messages.append(text)
                    
                    # Join all messages to reconstruct the full response
                    full_response = "\n".join(recent_messages)
                    logger.debug(f"Captured {len(recent_messages)} chat messages")
                    return full_response
            else:
                # Standard behavior for short responses
                chat_messages = self.page.locator(f"{self.chat_log_selector} .message").all()
                
                if chat_messages:
                    # Get the last few messages
                    recent_messages = []
                    for msg in chat_messages[-3:]:  # Keep original behavior
                        text = msg.text_content()
                        if text:
                            recent_messages.append(text)
                    
                    logger.info(f"Recent chat: {recent_messages}")
                    return "\n".join(recent_messages)
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get chat response: {e}")
            return None
        

