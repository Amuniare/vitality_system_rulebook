"""
Configuration management for the transcriber system
Handles environment variables, config files, and system settings
"""
import os
from pathlib import Path
from typing import Dict, Any, Optional, Union
import json
import logging

try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False


class ConfigManager:
    """Manages configuration for the transcriber system"""
    
    def __init__(self, config_dir: Optional[Path] = None):
        self.logger = logging.getLogger(__name__)
        
        # Load environment variables if dotenv is available
        if DOTENV_AVAILABLE:
            load_dotenv()
        else:
            self.logger.warning("python-dotenv not available - using system environment variables only")
        
        # Set up config directory
        if config_dir:
            self.config_dir = Path(config_dir)
        else:
            self.config_dir = Path(__file__).parent.parent
        
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        # Load default configuration
        self.config = self._load_default_config()
        
        # Load user configuration if it exists
        self._load_user_config()
        
        self.logger.info(f"Configuration loaded from: {self.config_dir}")
    
    def _load_default_config(self) -> Dict[str, Any]:
        """Load default configuration settings"""
        return {
            'discord': {
                'token_env_var': 'DISCORD_TOKEN',
                'channel_id_env_var': 'DISCORD_CHANNEL_ID',
                'session_gap_hours': 12,
                'message_batch_size': 1000
            },
            'ai': {
                'api_key_env_var': 'GEMINI_API_KEY',
                'default_model': 'gemini-1.5-flash',  # Start with fastest model
                'preferred_model': 'gemini-1.5-pro',   # Upgrade to this when possible
                'enable_model_switching': True,
                'enable_caching': True,
                'cache_duration_hours': 24,
                'max_retries': 3,
                'retry_base_delay': 1.0,
                'quota_management': {
                    'enable_adaptive_limits': True,
                    'fallback_on_quota': True,
                    'queue_on_quota_exceeded': True
                }
            },
            'processing': {
                'max_chunk_size': 12000,  # words (increased for efficiency)
                'chunk_overlap_size': 300,  # words
                'adaptive_chunking': True,  # Enable adaptive sizing
                'chunking_timeout': 600,  # seconds
                'quality_threshold': 50,  # minimum quality score
                'speaker_retention_threshold': 80,  # minimum speaker retention %
                'enable_job_queue': True,
                'job_queue_file': 'job_queue.json',
                'auto_resume_jobs': True
            },
            'files': {
                'campaign_name': 'rogue_trader',
                'session_directory_structure': {
                    'raw': 'sessions/raw',
                    'cleaned': 'sessions/cleaned',
                    'timelines': 'sessions/timelines',
                    'notes': 'sessions/notes',
                    'summaries': 'sessions/summaries'
                },
                'cache_directory': 'cache',
                'queue_directory': 'queue',
                'archive_after_sessions': 20,
                'cleanup_old_jobs_days': 30,
                'max_log_size_mb': 10,
                'log_backup_count': 5
            },
            'logging': {
                'level': 'INFO',
                'console_output': True,
                'file_output': True,
                'session_logs': True
            }
        }
    
    def _load_user_config(self):
        """Load user configuration overrides"""
        config_file = self.config_dir / 'transcriber_config.json'
        
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    user_config = json.load(f)
                
                # Merge user config with defaults
                self._deep_update(self.config, user_config)
                self.logger.info("User configuration loaded successfully")
                
            except Exception as e:
                self.logger.error(f"Failed to load user config: {e}")
    
    def _deep_update(self, base_dict: Dict, update_dict: Dict):
        """Recursively update nested dictionary"""
        for key, value in update_dict.items():
            if key in base_dict and isinstance(base_dict[key], dict) and isinstance(value, dict):
                self._deep_update(base_dict[key], value)
            else:
                base_dict[key] = value
    
    def get(self, key_path: str, default: Any = None) -> Any:
        """Get configuration value using dot notation (e.g., 'ai.model_name')"""
        try:
            keys = key_path.split('.')
            value = self.config
            
            for key in keys:
                value = value[key]
            
            return value
            
        except (KeyError, TypeError):
            if default is not None:
                return default
            raise KeyError(f"Configuration key not found: {key_path}")
    
    def set(self, key_path: str, value: Any):
        """Set configuration value using dot notation"""
        keys = key_path.split('.')
        config = self.config
        
        # Navigate to the parent dictionary
        for key in keys[:-1]:
            if key not in config:
                config[key] = {}
            config = config[key]
        
        # Set the value
        config[keys[-1]] = value
        self.logger.debug(f"Configuration updated: {key_path} = {value}")
    
    def get_env_var(self, var_name: str, default: Optional[str] = None) -> Optional[str]:
        """Get environment variable with optional default"""
        value = os.getenv(var_name, default)
        if not value and default is None:
            self.logger.warning(f"Environment variable not set: {var_name}")
        return value
    
    def get_required_env_var(self, var_name: str) -> str:
        """Get required environment variable, raise error if not found"""
        value = os.getenv(var_name)
        if not value:
            raise ValueError(f"Required environment variable not found: {var_name}")
        return value
    
    def validate_discord_config(self) -> bool:
        """Validate Discord configuration"""
        try:
            token_var = self.get('discord.token_env_var')
            token = self.get_env_var(token_var)
            
            if not token:
                self.logger.error(f"Discord token not found in environment variable: {token_var}")
                return False
            
            channel_id_var = self.get('discord.channel_id_env_var')
            channel_id_str = self.get_env_var(channel_id_var)
            
            if not channel_id_str:
                self.logger.error(f"Discord channel ID not found in environment variable: {channel_id_var}")
                return False
            
            try:
                channel_id = int(channel_id_str)
            except ValueError:
                self.logger.error(f"Discord channel ID must be a valid integer: {channel_id_str}")
                return False
            
            return True
            
        except Exception as e:
            self.logger.error(f"Discord configuration validation failed: {e}")
            return False
    
    def validate_ai_config(self) -> bool:
        """Validate AI configuration"""
        try:
            api_key_var = self.get('ai.api_key_env_var')
            api_key = self.get_env_var(api_key_var)
            
            if not api_key:
                self.logger.error(f"AI API key not found in environment variable: {api_key_var}")
                return False
            
            model_name = self.get('ai.model_name')
            if not model_name:
                self.logger.error("AI model name not configured")
                return False
            
            return True
            
        except Exception as e:
            self.logger.error(f"AI configuration validation failed: {e}")
            return False
    
    def setup_data_directories(self, base_path: Path) -> Dict[str, Path]:
        """Set up data directory structure and return paths"""
        campaign_name = self.get('files.campaign_name')
        structure = self.get('files.session_directory_structure')
        
        data_dir = base_path / 'all_data' / campaign_name
        
        directories = {}
        for stage, relative_path in structure.items():
            full_path = data_dir / relative_path
            full_path.mkdir(parents=True, exist_ok=True)
            directories[stage] = full_path
        
        # Additional directories
        additional_dirs = ['logs', 'archive', 'temp']
        for dir_name in additional_dirs:
            dir_path = data_dir / dir_name
            dir_path.mkdir(parents=True, exist_ok=True)
            directories[dir_name] = dir_path
        
        self.logger.info(f"Data directories set up in: {data_dir}")
        return directories
    
    def save_user_config(self):
        """Save current configuration to user config file"""
        config_file = self.config_dir / 'transcriber_config.json'
        
        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"Configuration saved to: {config_file}")
            
        except Exception as e:
            self.logger.error(f"Failed to save configuration: {e}")
    
    def reset_to_defaults(self):
        """Reset configuration to defaults"""
        self.config = self._load_default_config()
        self.logger.info("Configuration reset to defaults")
    
    def get_processing_config(self) -> Dict[str, Any]:
        """Get processing-specific configuration"""
        return {
            'max_chunk_size': self.get('processing.max_chunk_size'),
            'chunk_overlap_size': self.get('processing.chunk_overlap_size'),
            'adaptive_chunking': self.get('processing.adaptive_chunking'),
            'chunking_timeout': self.get('processing.chunking_timeout'),
            'quality_threshold': self.get('processing.quality_threshold'),
            'speaker_retention_threshold': self.get('processing.speaker_retention_threshold'),
            'enable_job_queue': self.get('processing.enable_job_queue'),
            'job_queue_file': self.get('processing.job_queue_file'),
            'auto_resume_jobs': self.get('processing.auto_resume_jobs')
        }
    
    def get_ai_config(self) -> Dict[str, Any]:
        """Get AI-specific configuration"""
        return {
            'api_key': self.get_env_var(self.get('ai.api_key_env_var')),
            'default_model': self.get('ai.default_model'),
            'preferred_model': self.get('ai.preferred_model'),
            'enable_model_switching': self.get('ai.enable_model_switching'),
            'enable_caching': self.get('ai.enable_caching'),
            'cache_duration_hours': self.get('ai.cache_duration_hours'),
            'max_retries': self.get('ai.max_retries'),
            'retry_base_delay': self.get('ai.retry_base_delay'),
            'quota_management': self.get('ai.quota_management')
        }
    
    def get_discord_config(self) -> Dict[str, Any]:
        """Get Discord-specific configuration"""
        # Get channel_id from environment variable and convert to int
        channel_id_str = self.get_env_var(self.get('discord.channel_id_env_var'))
        channel_id = int(channel_id_str) if channel_id_str else None
        
        return {
            'token': self.get_env_var(self.get('discord.token_env_var')),
            'channel_id': channel_id,
            'session_gap_hours': self.get('discord.session_gap_hours'),
            'message_batch_size': self.get('discord.message_batch_size')
        }
    
    def print_config_summary(self):
        """Print a summary of current configuration"""
        print("\n=== TRANSCRIBER CONFIGURATION SUMMARY ===")
        print(f"Campaign: {self.get('files.campaign_name')}")
        print(f"Default AI Model: {self.get('ai.default_model')}")
        print(f"Preferred AI Model: {self.get('ai.preferred_model')}")
        print(f"Model Switching: {'✅ Enabled' if self.get('ai.enable_model_switching') else '❌ Disabled'}")
        print(f"Caching: {'✅ Enabled' if self.get('ai.enable_caching') else '❌ Disabled'}")
        print(f"Job Queue: {'✅ Enabled' if self.get('processing.enable_job_queue') else '❌ Disabled'}")
        print(f"Adaptive Chunking: {'✅ Enabled' if self.get('processing.adaptive_chunking') else '❌ Disabled'}")
        print(f"Chunk Size: {self.get('processing.max_chunk_size')} words")
        print(f"Quality Threshold: {self.get('processing.quality_threshold')}%")
        
        # Check environment variables
        discord_token = bool(self.get_env_var(self.get('discord.token_env_var')))
        ai_key = bool(self.get_env_var(self.get('ai.api_key_env_var')))
        
        print(f"Discord Token: {'✅ Set' if discord_token else '❌ Missing'}")
        print(f"AI API Key: {'✅ Set' if ai_key else '❌ Missing'}")
        print("==========================================\n")
    
    def get_cache_config(self) -> Dict[str, Any]:
        """Get caching configuration"""
        return {
            'cache_directory': self.get('files.cache_directory'),
            'enable_caching': self.get('ai.enable_caching'),
            'cache_duration_hours': self.get('ai.cache_duration_hours')
        }
    
    def get_queue_config(self) -> Dict[str, Any]:
        """Get job queue configuration"""
        return {
            'enable_job_queue': self.get('processing.enable_job_queue'),
            'job_queue_file': self.get('processing.job_queue_file'),
            'auto_resume_jobs': self.get('processing.auto_resume_jobs'),
            'cleanup_old_jobs_days': self.get('files.cleanup_old_jobs_days')
        }
    
    def validate_enhanced_config(self) -> Dict[str, bool]:
        """Validate enhanced configuration settings"""
        validation = {
            'basic_config': self.validate_discord_config() and self.validate_ai_config(),
            'model_switching': self.get('ai.enable_model_switching'),
            'caching_setup': self.get('ai.enable_caching'),
            'job_queue_setup': self.get('processing.enable_job_queue'),
            'adaptive_chunking': self.get('processing.adaptive_chunking')
        }
        
        return validation


# Global config instance
_config_instance = None

def get_config(config_dir: Optional[Path] = None) -> ConfigManager:
    """Get global configuration instance"""
    global _config_instance
    if _config_instance is None:
        _config_instance = ConfigManager(config_dir)
    return _config_instance

def create_optimal_config() -> Dict[str, Any]:
    """Create optimized configuration for quota-aware processing"""
    return {
        'ai': {
            'default_model': 'gemini-1.5-flash',
            'preferred_model': 'gemini-1.5-pro',
            'enable_model_switching': True,
            'enable_caching': True,
            'quota_management': {
                'enable_adaptive_limits': True,
                'fallback_on_quota': True,
                'queue_on_quota_exceeded': True
            }
        },
        'processing': {
            'max_chunk_size': 15000,  # Larger chunks for efficiency
            'adaptive_chunking': True,
            'enable_job_queue': True,
            'auto_resume_jobs': True
        }
    }