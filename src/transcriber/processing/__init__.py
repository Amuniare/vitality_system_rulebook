"""
Processing modules for the transcriber system
Contains Python-only processing logic
"""

# Import individual modules as needed to avoid dependency issues
def get_character_mapper():
    from .speaker_mapper import CharacterMapper
    return CharacterMapper

def get_content_analyzer():
    from .content_analyzer import ContentAnalyzer
    return ContentAnalyzer

def get_python_pipeline():
    from .python_pipeline import PythonPipeline
    return PythonPipeline

__all__ = [
    'get_character_mapper',
    'get_content_analyzer', 
    'get_python_pipeline'
]