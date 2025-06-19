"""
Roll20 Connection via Existing Browser Session
"""
import logging
import time
import subprocess
from playwright.sync_api import sync_playwright, Page

logger = logging.getLogger(__name__)

class Roll20Connection:
    """Connect to existing browser session to bypass Cloudflare"""
    
    def __init__(self, campaign_id: str = "19776221"):
        self.playwright = None
        self.browser = None
        self.page = None
        self.campaign_id = campaign_id
        
    def connect(self, campaign_url: str = None) -> Page:
        """Connect to existing Chrome instance and navigate to campaign editor"""
        try:
            # Start Chrome with remote debugging if not already running
            self._start_chrome_with_debugging()
            
            self.playwright = sync_playwright().start()
            
            # Connect to existing browser on debug port (USE IPv4!)
            logger.info("Connecting to existing browser on 127.0.0.1:9222...")
            self.browser = self.playwright.chromium.connect_over_cdp("http://127.0.0.1:9222")
            
            # Get existing context and page
            if self.browser.contexts:
                context = self.browser.contexts[0]
                if context.pages:
                    self.page = context.pages[0]
                    logger.info(f"Connected to existing page: {self.page.url}")
                else:
                    self.page = context.new_page()
                    logger.info("Created new page in existing context")
            else:
                context = self.browser.new_context()
                self.page = context.new_page()
                logger.info("Created new context and page")
            
            # Step 1: Navigate to Roll20 homepage if needed
            current_url = self.page.url
            if "roll20" not in current_url.lower():
                logger.info("Navigating to Roll20 welcome page...")
                self.page.goto("https://roll20.net/welcome")
                self.page.wait_for_load_state("networkidle")
                logger.info("Successfully navigated to Roll20 welcome page")
            
            # Step 2: Navigate to campaign editor
            editor_url = campaign_url or f"https://app.roll20.net/editor/setcampaign/{self.campaign_id}"
            logger.info(f"Navigating to campaign editor: {editor_url}")
            
            self.page.goto(editor_url)
            self.page.wait_for_load_state("networkidle")
            
            # Wait a moment for the editor to fully load
            time.sleep(3)
            
            # Verify we're in the campaign editor
            if "editor" in self.page.url:
                logger.info("Successfully navigated to campaign editor")
            else:
                logger.warning(f"May not be in campaign editor. Current URL: {self.page.url}")
            
            logger.info("Roll20 connection and navigation completed successfully")
            return self.page
            
        except Exception as e:
            logger.error(f"Failed to connect to existing browser: {e}")
            raise
    
    def _start_chrome_with_debugging(self):
        """Start Chrome with remote debugging enabled"""
        try:
            chrome_cmd = [
                r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                "--remote-debugging-port=9222",
                "--user-data-dir=C:\\temp\\chrome-debug"
            ]
            
            logger.info("Starting Chrome with remote debugging...")
            subprocess.Popen(chrome_cmd, shell=False)
            
            # Wait a moment for Chrome to start
            time.sleep(3)
            logger.info("Chrome started successfully")
            
        except Exception as e:
            logger.warning(f"Could not start Chrome (may already be running): {e}")
    
    def disconnect(self):
        """Clean up resources (don't close the browser)"""
        try:
            if self.playwright:
                self.playwright.stop()
            logger.info("Disconnected (browser remains open)")
        except Exception as e:
            logger.warning(f"Error during disconnect: {e}")