"""
AI modules for the transcriber system
Contains AI-dependent processing components
"""

# Direct imports (may fail with missing AI dependencies)
try:
    from .template_manager import TemplateManager
    from .api_client import APIClient
    from .ai_pipeline import AIPipeline
    
    __all__ = ['TemplateManager', 'APIClient', 'AIPipeline']
except ImportError as e:
    # Fallback for missing dependencies
    __all__ = []
    
    def get_template_manager():
        from .template_manager import TemplateManager
        return TemplateManager
    
    def get_api_client():
        from .api_client import APIClient
        return APIClient
        
    def get_ai_pipeline():
        from .ai_pipeline import AIPipeline
        return AIPipeline