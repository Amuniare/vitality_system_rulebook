"""Simple logging setup"""
import logging
from pathlib import Path
import time

LOGS_DIR = Path("logs")

def setup_logging():
    """Setup logging configuration - deletes previous log file first"""
    LOGS_DIR.mkdir(exist_ok=True)
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    log_file = LOGS_DIR / f"automation_{timestamp}.log"

    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    logger = logging.getLogger(__name__)
    logger.info("Logging setup complete: %s", log_file)
    return logger