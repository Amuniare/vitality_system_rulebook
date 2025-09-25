"""
AI API client wrapper for Google Gemini
Handles rate limiting, retries, and API interaction
"""
import os
import time
import logging
import json
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, List

try:
    import google.generativeai as genai
    from dotenv import load_dotenv
    GOOGLE_AI_AVAILABLE = True
    load_dotenv()
except ImportError:
    GOOGLE_AI_AVAILABLE = False
    genai = None


class APIClient:
    """Wrapper for Google Gemini API with intelligent quota management and rate limiting"""
    
    def __init__(self, api_key: Optional[str] = None, model_name: str = 'gemini-1.5-pro', cache_dir: Optional[Path] = None):
        self.logger = logging.getLogger(__name__)
        self.model_name = model_name
        self.model = None
        
        # Set up cache directory
        self.cache_dir = cache_dir or Path('cache')
        self.cache_dir.mkdir(exist_ok=True)
        
        # Quota tracking
        self.quota_file = self.cache_dir / 'quota_status.json'
        self.quota_status = self._load_quota_status()
        
        # Check if Google AI is available
        if not GOOGLE_AI_AVAILABLE:
            self.logger.error("Google Generative AI library not installed. Install with: pip install google-generativeai python-dotenv")
            return
        
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
        
        # Quota management (will be set by model config)
        self.daily_request_limit = 50
        self.minute_request_limit = 1
        self.quota_reset_time = None
        
        # Model alternatives with quota settings
        self.model_configs = {
            'gemini-1.5-pro': {
                'daily_limit': 50,
                'minute_limit': 1,
                'rate_delay': 60,
                'fallback': 'gemini-1.5-flash',
                'quality': 'high'
            },
            'gemini-1.5-flash': {
                'daily_limit': 150,
                'minute_limit': 2,
                'rate_delay': 30,
                'fallback': 'gemini-1.0-pro',
                'quality': 'medium'
            },
            'gemini-1.0-pro': {
                'daily_limit': 100,
                'minute_limit': 1,
                'rate_delay': 60,
                'fallback': None,
                'quality': 'medium'
            }
        }
        
        # Apply model-specific settings
        self._apply_model_config(model_name)
        
        # Initialize quota management attributes
        if not hasattr(self, 'daily_request_limit'):
            self.daily_request_limit = 50
        if not hasattr(self, 'minute_request_limit'):
            self.minute_request_limit = 1
    
    def _load_quota_status(self) -> Dict:
        """Load quota status from cache file"""
        if self.quota_file.exists():
            try:
                with open(self.quota_file, 'r') as f:
                    data = json.load(f)
                # Convert ISO strings back to datetime objects
                if 'reset_time' in data and data['reset_time']:
                    data['reset_time'] = datetime.fromisoformat(data['reset_time'])
                return data
            except Exception as e:
                self.logger.warning(f"Failed to load quota status: {e}")
        
        return {
            'daily_requests': 0,
            'minute_requests': 0,
            'last_request_day': None,
            'last_request_minute': None,
            'reset_time': None,
            'quota_exceeded': False
        }
    
    def _save_quota_status(self):
        """Save quota status to cache file"""
        try:
            data = self.quota_status.copy()
            # Convert datetime objects to ISO strings for JSON serialization
            if data.get('reset_time'):
                data['reset_time'] = data['reset_time'].isoformat()
            
            with open(self.quota_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            self.logger.warning(f"Failed to save quota status: {e}")
    
    def _check_quota_limits(self) -> bool:
        """Check if we're within quota limits"""
        now = datetime.now()
        current_day = now.date().isoformat()
        current_minute = now.replace(second=0, microsecond=0)
        
        # Reset daily counter if it's a new day
        if self.quota_status.get('last_request_day') != current_day:
            self.quota_status['daily_requests'] = 0
            self.quota_status['last_request_day'] = current_day
            self.quota_status['quota_exceeded'] = False
        
        # Reset minute counter if it's a new minute
        if self.quota_status.get('last_request_minute') != current_minute.isoformat():
            self.quota_status['minute_requests'] = 0
            self.quota_status['last_request_minute'] = current_minute.isoformat()
        
        # Check if quota reset time has passed
        if self.quota_status.get('reset_time') and now > self.quota_status['reset_time']:
            self.quota_status['quota_exceeded'] = False
            self.quota_status['reset_time'] = None
            self.logger.info("Quota reset time passed, clearing quota exceeded flag")
        
        # Check limits
        if self.quota_status['quota_exceeded']:
            return False
        
        if self.quota_status['daily_requests'] >= self.daily_request_limit:
            self.logger.warning("Daily request limit reached")
            return False
        
        if self.quota_status['minute_requests'] >= self.minute_request_limit:
            self.logger.warning("Per-minute request limit reached")
            return False
        
        return True
    
    def _update_quota_counters(self):
        """Update quota counters after successful request"""
        self.quota_status['daily_requests'] += 1
        self.quota_status['minute_requests'] += 1
        self._save_quota_status()
    
    def _handle_quota_error(self, error_message: str):
        """Handle quota exceeded errors and set appropriate reset times"""
        self.quota_status['quota_exceeded'] = True
        
        # Parse retry delay from error message if available
        if 'retry_delay' in error_message:
            try:
                # Extract seconds from error message
                import re
                match = re.search(r'retry_delay.*?seconds: (\d+)', error_message)
                if match:
                    delay_seconds = int(match.group(1))
                    self.quota_status['reset_time'] = datetime.now() + timedelta(seconds=delay_seconds)
                    self.logger.info(f"Quota reset time set to: {self.quota_status['reset_time']}")
            except Exception as e:
                self.logger.warning(f"Failed to parse retry delay: {e}")
        
        # Default reset time if not specified (24 hours for daily quota)
        if not self.quota_status.get('reset_time'):
            self.quota_status['reset_time'] = datetime.now() + timedelta(hours=24)
        
        self._save_quota_status()
    
    def get_cache_key(self, prompt: str, system_prompt: str = "") -> str:
        """Generate cache key for request"""
        content = f"{system_prompt}\n{prompt}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _get_cached_response(self, cache_key: str) -> Optional[str]:
        """Get cached response if available"""
        cache_file = self.cache_dir / f"{cache_key}.json"
        if cache_file.exists():
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Check if cache is still valid (24 hours)
                    cached_time = datetime.fromisoformat(data['timestamp'])
                    if datetime.now() - cached_time < timedelta(hours=24):
                        self.logger.info("Using cached response")
                        return data['response']
            except Exception as e:
                self.logger.warning(f"Failed to load cached response: {e}")
        return None
    
    def _cache_response(self, cache_key: str, response: str):
        """Cache successful response"""
        cache_file = self.cache_dir / f"{cache_key}.json"
        try:
            data = {
                'timestamp': datetime.now().isoformat(),
                'response': response,
                'model': self.model_name
            }
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            self.logger.warning(f"Failed to cache response: {e}")
    
    def make_request(self, prompt: str, system_prompt: str = "", use_cache: bool = True) -> Optional[str]:
        """Make a rate-limited API request with intelligent quota management and caching"""
        
        # Check if Google AI is available and model is initialized
        if not GOOGLE_AI_AVAILABLE or self.model is None:
            self.logger.error("Cannot make API request: Google Generative AI not available or model not initialized")
            return None
        
        # Check cache first
        cache_key = self.get_cache_key(prompt, system_prompt)
        if use_cache:
            cached_response = self._get_cached_response(cache_key)
            if cached_response:
                return cached_response
        
        # Check quota limits
        if not self._check_quota_limits():
            self.logger.error("Request blocked due to quota limits")
            return None
        
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
                    result = response.text.strip()
                    
                    # Update quota counters and cache response
                    self._update_quota_counters()
                    if use_cache:
                        self._cache_response(cache_key, result)
                    
                    return result
                else:
                    self.logger.warning(f"Empty response on attempt {attempt + 1}")
                    
            except Exception as e:
                error_str = str(e)
                self.logger.warning(f"API request failed on attempt {attempt + 1}: {e}")
                
                # Handle quota errors specifically
                if "quota" in error_str.lower() or "429" in error_str:
                    self._handle_quota_error(error_str)
                    self.logger.error("Quota exceeded, request blocked")
                    return None
                
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
    
    def can_make_request(self) -> bool:
        """Check if we can make a request right now"""
        return self._check_quota_limits() and self._can_make_request_now()
    
    def _can_make_request_now(self) -> bool:
        """Check rate limiting constraints"""
        time_since_last = time.time() - self.last_request_time
        return time_since_last >= self.rate_limit_delay
    
    def time_until_next_request(self) -> float:
        """Get seconds until next request is allowed"""
        if self.quota_status['quota_exceeded']:
            if self.quota_status.get('reset_time'):
                return max(0, (self.quota_status['reset_time'] - datetime.now()).total_seconds())
            return 86400  # 24 hours default
        
        time_since_last = time.time() - self.last_request_time
        return max(0, self.rate_limit_delay - time_since_last)
    
    def get_quota_status(self) -> Dict:
        """Get comprehensive quota and rate limiting status"""
        return {
            'quota_exceeded': self.quota_status['quota_exceeded'],
            'daily_requests': self.quota_status['daily_requests'],
            'daily_limit': self.daily_request_limit,
            'minute_requests': self.quota_status['minute_requests'],
            'minute_limit': self.minute_request_limit,
            'reset_time': self.quota_status.get('reset_time'),
            'time_until_next_request': self.time_until_next_request(),
            'can_make_request': self.can_make_request()
        }
    
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
        """Estimate total processing time for multiple requests with quota constraints"""
        if self.quota_status['quota_exceeded']:
            return self.time_until_next_request() + self.estimate_processing_time(num_requests)
        
        # Account for rate limiting between requests
        rate_limit_overhead = (num_requests - 1) * self.rate_limit_delay
        
        # Estimate average request processing time (conservative)
        avg_processing_time = 30  # 30 seconds per request
        total_processing_time = num_requests * avg_processing_time
        
        # Consider daily quota limits
        remaining_daily = self.daily_request_limit - self.quota_status['daily_requests']
        if num_requests > remaining_daily:
            # Will need to wait for quota reset
            overflow_requests = num_requests - remaining_daily
            quota_wait_time = 86400  # 24 hours
            return rate_limit_overhead + total_processing_time + quota_wait_time
        
        return rate_limit_overhead + total_processing_time
    
    def set_rate_limit(self, delay_seconds: float):
        """Update rate limit delay"""
        self.rate_limit_delay = delay_seconds
        self.logger.info(f"Rate limit updated to {delay_seconds} seconds")
    
    def _apply_model_config(self, model_name: str):
        """Apply model-specific configuration settings"""
        if model_name in self.model_configs:
            config = self.model_configs[model_name]
            self.daily_request_limit = config['daily_limit']
            self.minute_request_limit = config['minute_limit']
            self.rate_limit_delay = config['rate_delay']
            self.logger.info(f"Applied config for {model_name}: {config['daily_limit']} daily, {config['minute_limit']}/min")
        else:
            # Set defaults if model not found
            self.daily_request_limit = 50
            self.minute_request_limit = 1
            self.rate_limit_delay = 60
            self.logger.warning(f"Unknown model {model_name}, using default limits")
    
    def try_alternative_model(self) -> bool:
        """Try switching to an alternative model if available"""
        current_config = self.model_configs.get(self.model_name)
        if not current_config or not current_config['fallback']:
            self.logger.warning(f"No fallback model available for {self.model_name}")
            return False
        
        alt_model = current_config['fallback']
        try:
            self.model = genai.GenerativeModel(alt_model)
            old_model = self.model_name
            self.model_name = alt_model
            
            # Apply new model configuration
            self._apply_model_config(alt_model)
            
            self.logger.info(f"Switched from {old_model} to {alt_model}")
            
            # Reset quota for new model
            self.quota_status['quota_exceeded'] = False
            self.quota_status['daily_requests'] = 0
            self.quota_status['model_name'] = alt_model
            self._save_quota_status()
            
            return True
        except Exception as e:
            self.logger.error(f"Failed to switch to alternative model {alt_model}: {e}")
            return False
    
    def get_model_quality(self) -> str:
        """Get quality rating of current model"""
        config = self.model_configs.get(self.model_name, {})
        return config.get('quality', 'unknown')
    
    def get_available_models(self) -> List[str]:
        """Get list of available models"""
        return list(self.model_configs.keys())
    
    def switch_to_model(self, model_name: str) -> bool:
        """Manually switch to a specific model"""
        if model_name not in self.model_configs:
            self.logger.error(f"Unknown model: {model_name}")
            return False
        
        if model_name == self.model_name:
            self.logger.info(f"Already using model {model_name}")
            return True
        
        try:
            self.model = genai.GenerativeModel(model_name)
            old_model = self.model_name
            self.model_name = model_name
            
            # Apply new model configuration
            self._apply_model_config(model_name)
            
            self.logger.info(f"Manually switched from {old_model} to {model_name}")
            
            # Update quota tracking
            self.quota_status['model_name'] = model_name
            self._save_quota_status()
            
            return True
        except Exception as e:
            self.logger.error(f"Failed to switch to model {model_name}: {e}")
            return False
    
    def suggest_optimal_model(self, content_length: int, priority: str = 'balanced') -> str:
        """Suggest optimal model based on content and requirements"""
        
        # For short content, use faster models
        if content_length < 5000:
            if priority == 'speed':
                return 'gemini-1.5-flash'
            elif priority == 'quality':
                return 'gemini-1.5-pro'
        
        # For medium content, balance speed and quality
        elif content_length < 20000:
            if priority == 'speed':
                return 'gemini-1.5-flash'
            else:
                return 'gemini-1.5-pro'
        
        # For large content, prefer models with higher limits
        else:
            if priority == 'speed':
                return 'gemini-1.5-flash'  # Higher rate limits
            else:
                return 'gemini-1.5-pro'
        
        return 'gemini-1.5-pro'  # Default
    
    def get_model_info(self) -> Dict:
        """Get comprehensive information about the current model and status"""
        return {
            'model_name': self.model_name,
            'rate_limit_delay': self.rate_limit_delay,
            'max_retries': self.max_retries,
            'base_retry_delay': self.base_retry_delay,
            'quota_status': self.get_quota_status(),
            'available_models': self.get_available_models(),
            'model_quality': self.get_model_quality(),
            'model_config': self.model_configs.get(self.model_name, {}),
            'cache_dir': str(self.cache_dir)
        }