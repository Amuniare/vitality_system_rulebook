"""
AI API client wrapper for Google Gemini
Handles rate limiting, retries, and API interaction
"""
import google.generativeai as genai
import os
import time
import logging
from typing import Optional, Dict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class APIClient:
    """Wrapper for Google Gemini API with rate limiting and retry logic"""
    
    def __init__(self, api_key: Optional[str] = None, model_name: str = 'gemini-1.5-pro'):
        self.logger = logging.getLogger(__name__)
        self.model_name = model_name
        
        # Initialize API
        try:
            api_key = api_key or os.getenv('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
            
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel(model_name)
            self.logger.info(f"Initialized Gemini API client with model: {model_name}")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Gemini API: {e}")
            raise
        
        # Rate limiting configuration
        self.rate_limit_delay = 60  # 60 seconds between requests (free tier)
        self.last_request_time = 0
        
        # Retry configuration
        self.max_retries = 3
        self.base_retry_delay = 1.0
    
    def make_request(self, prompt: str, system_prompt: str = "") -> Optional[str]:
        """Make a rate-limited API request with retries"""
        self._enforce_rate_limit()
        
        for attempt in range(self.max_retries):
            try:
                # Prepare the full prompt
                if system_prompt:
                    full_prompt = f"{system_prompt}\n\n{prompt}"
                else:
                    full_prompt = prompt
                
                self.logger.info(f"Making API request (attempt {attempt + 1}/{self.max_retries})")
                
                # Make the API call
                response = self.model.generate_content(full_prompt)
                
                if response.text:
                    self.logger.info("API request successful")
                    self.last_request_time = time.time()
                    return response.text.strip()
                else:
                    self.logger.warning(f"Empty response on attempt {attempt + 1}")
                    
            except Exception as e:
                self.logger.warning(f"API request failed on attempt {attempt + 1}: {e}")
                
                if attempt < self.max_retries - 1:
                    retry_delay = self.base_retry_delay * (2 ** attempt)  # Exponential backoff
                    self.logger.info(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
        
        self.logger.error(f"All {self.max_retries} API request attempts failed")
        return None
    
    def _enforce_rate_limit(self):
        """Enforce rate limiting between API calls"""
        time_since_last = time.time() - self.last_request_time
        
        if time_since_last < self.rate_limit_delay:
            sleep_time = self.rate_limit_delay - time_since_last
            self.logger.info(f"Rate limiting: waiting {sleep_time:.1f} seconds...")
            time.sleep(sleep_time)
    
    def test_connection(self) -> bool:
        """Test API connection with a simple request"""
        try:
            test_prompt = "Respond with exactly: 'Connection test successful'"
            response = self.make_request(test_prompt)
            
            if response and "Connection test successful" in response:
                self.logger.info("API connection test successful")
                return True
            else:
                self.logger.warning(f"API connection test failed: {response}")
                return False
                
        except Exception as e:
            self.logger.error(f"API connection test error: {e}")
            return False
    
    def get_rate_limit_status(self) -> Dict:
        """Get current rate limiting status"""
        time_since_last = time.time() - self.last_request_time
        time_until_next = max(0, self.rate_limit_delay - time_since_last)
        
        return {
            'rate_limit_delay': self.rate_limit_delay,
            'time_since_last_request': time_since_last,
            'time_until_next_allowed': time_until_next,
            'can_make_request': time_until_next == 0,
            'last_request_time': self.last_request_time
        }
    
    def estimate_processing_time(self, num_requests: int) -> float:
        """Estimate total processing time for multiple requests"""
        # Account for rate limiting between requests
        rate_limit_overhead = (num_requests - 1) * self.rate_limit_delay
        
        # Estimate average request processing time (conservative)
        avg_processing_time = 30  # 30 seconds per request
        total_processing_time = num_requests * avg_processing_time
        
        return rate_limit_overhead + total_processing_time
    
    def set_rate_limit(self, delay_seconds: float):
        """Update rate limit delay"""
        self.rate_limit_delay = delay_seconds
        self.logger.info(f"Rate limit updated to {delay_seconds} seconds")
    
    def get_model_info(self) -> Dict:
        """Get information about the current model"""
        return {
            'model_name': self.model_name,
            'rate_limit_delay': self.rate_limit_delay,
            'max_retries': self.max_retries,
            'base_retry_delay': self.base_retry_delay
        }