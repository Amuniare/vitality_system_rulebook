#!/usr/bin/env python3
"""
Main entry point for the Vitality System damage optimizer
"""

import multiprocessing
from src.damage_optimizer import main

if __name__ == "__main__":
    # Required for multiprocessing on Windows
    multiprocessing.freeze_support()
    main()