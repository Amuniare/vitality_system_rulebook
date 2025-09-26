"""
Base reporting functionality for the Vitality System combat simulator.
"""

import os
from datetime import datetime
from typing import Dict, List, Tuple


def create_timestamped_reports_directory() -> str:
    """Create and return a timestamped directory path for reports"""
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    reports_dir = f"reports/{timestamp}"

    # Create the main timestamped directory
    os.makedirs(reports_dir, exist_ok=True)

    # Create subdirectories that might be needed
    os.makedirs(f"{reports_dir}/individual_builds", exist_ok=True)

    return reports_dir


def write_report(content: str, filename: str, reports_dir: str = "reports") -> None:
    """Write report content to a file"""
    os.makedirs(reports_dir, exist_ok=True)
    filepath = os.path.join(reports_dir, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)


def format_build_name(build) -> str:
    """Format a build name for display"""
    parts = [build.attack_type]
    if build.upgrades:
        parts.append(f"[{'+'.join(build.upgrades)}]")
    if build.limits:
        parts.append(f"({'+'.join(build.limits)})")
    return " ".join(parts)


def format_dpt(dpt: float) -> str:
    """Format DPT value for display"""
    return f"{dpt:.2f}"


def format_percentage(value: float) -> str:
    """Format percentage value for display"""
    return f"{value:.1f}%"