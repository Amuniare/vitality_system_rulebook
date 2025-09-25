"""
Utility modules for the transcriber system
Contains shared utilities and helper functions
"""

# Direct imports (may fail with missing dependencies like dotenv)
try:
    from .file_utils import FileManager
    from .logging_utils import TranscriberLogger, ProcessingProgressLogger, get_logger
    from .config_manager import ConfigManager, get_config
    
    __all__ = [
        'FileManager',
        'TranscriberLogger',
        'ProcessingProgressLogger', 
        'get_logger',
        'ConfigManager',
        'get_config'
    ]
except ImportError:
    __all__ = []
    
    def get_file_manager():
        from .file_utils import FileManager
        return FileManager
    
    def get_transcriber_logger():
        from .logging_utils import TranscriberLogger
        return TranscriberLogger
    
    def get_config_manager():
        from .config_manager import ConfigManager
        return ConfigManager