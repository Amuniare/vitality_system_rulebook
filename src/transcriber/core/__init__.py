"""
Core modules for the transcriber system
Contains fundamental components with no AI dependencies
"""

# Import modules individually to handle missing dependencies gracefully
def get_session_loader():
    from .session_loader import SessionLoader
    return SessionLoader

def get_text_processor():
    from .text_processor import TextProcessor
    return TextProcessor

def get_session_chunker():
    from .chunking_engine import SessionChunker
    return SessionChunker

# Direct imports for backwards compatibility (may fail with missing dependencies)
try:
    from .session_loader import SessionLoader
    from .text_processor import TextProcessor
    from .chunking_engine import SessionChunker
    
    __all__ = ['SessionLoader', 'TextProcessor', 'SessionChunker']
except ImportError:
    __all__ = ['get_session_loader', 'get_text_processor', 'get_session_chunker']