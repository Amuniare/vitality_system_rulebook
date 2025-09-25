"""
Modular Discord Session Transcriber
A 3-stage processing system for converting Discord chat logs into structured campaign documentation
"""

__version__ = "2.0.0"

# Core modules (no AI dependencies)
from . import core

# Processing modules (Python-only processing)
from . import processing

# AI modules (AI-dependent processing)  
from . import ai

# Utility modules
from . import utils

__all__ = [
    'core',
    'processing', 
    'ai',
    'utils'
]