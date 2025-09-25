"""
Logging utilities for the transcriber system
Provides structured logging configuration and utilities
"""
import logging
import logging.handlers
from pathlib import Path
from typing import Optional
import sys


class TranscriberLogger:
    """Centralized logging configuration for the transcriber system"""
    
    @staticmethod
    def setup_logging(
        level: int = logging.INFO,
        log_file: Optional[Path] = None,
        max_bytes: int = 10 * 1024 * 1024,  # 10MB
        backup_count: int = 5,
        console_output: bool = True
    ):
        """Set up structured logging for the transcriber system"""
        
        # Create root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(level)
        
        # Clear existing handlers
        for handler in root_logger.handlers[:]:
            root_logger.removeHandler(handler)
        
        # Create formatter
        formatter = logging.Formatter(
            fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # Console handler
        if console_output:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(level)
            console_handler.setFormatter(formatter)
            root_logger.addHandler(console_handler)
        
        # File handler (rotating)
        if log_file:
            log_file.parent.mkdir(parents=True, exist_ok=True)
            file_handler = logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=max_bytes,
                backupCount=backup_count,
                encoding='utf-8'
            )
            file_handler.setLevel(level)
            file_handler.setFormatter(formatter)
            root_logger.addHandler(file_handler)
        
        # Set specific logger levels
        TranscriberLogger._configure_module_loggers(level)
        
        logging.info("Logging system initialized successfully")
    
    @staticmethod
    def _configure_module_loggers(base_level: int):
        """Configure logging levels for specific modules"""
        
        # Discord library can be verbose
        logging.getLogger('discord').setLevel(logging.WARNING)
        logging.getLogger('discord.client').setLevel(logging.WARNING)
        logging.getLogger('discord.gateway').setLevel(logging.WARNING)
        
        # Google API can be verbose
        logging.getLogger('google').setLevel(logging.WARNING)
        logging.getLogger('google.generativeai').setLevel(logging.WARNING)
        
        # Set transcriber module levels
        transcriber_modules = [
            'core',
            'processing', 
            'ai',
            'utils'
        ]
        
        for module in transcriber_modules:
            logging.getLogger(module).setLevel(base_level)
    
    @staticmethod
    def create_session_logger(session_number: int, log_dir: Path) -> logging.Logger:
        """Create a dedicated logger for a specific session"""
        logger_name = f"session_{session_number}"
        logger = logging.getLogger(logger_name)
        
        # Don't propagate to root logger to avoid duplication
        logger.propagate = False
        logger.setLevel(logging.DEBUG)
        
        # Create session-specific file handler
        log_file = log_dir / f"session_{session_number:02d}.log"
        log_file.parent.mkdir(parents=True, exist_ok=True)
        
        handler = logging.FileHandler(log_file, encoding='utf-8')
        handler.setLevel(logging.DEBUG)
        
        formatter = logging.Formatter(
            fmt='%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%H:%M:%S'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        return logger


class ProcessingProgressLogger:
    """Specialized logger for tracking processing progress"""
    
    def __init__(self, logger_name: str = "progress"):
        self.logger = logging.getLogger(logger_name)
        self.current_stage = None
        self.stage_start_time = None
    
    def start_stage(self, stage_name: str, details: str = ""):
        """Log the start of a processing stage"""
        import time
        
        self.current_stage = stage_name
        self.stage_start_time = time.time()
        
        message = f"🔄 Starting {stage_name}"
        if details:
            message += f" - {details}"
        
        self.logger.info(message)
    
    def update_progress(self, progress: float, message: str = ""):
        """Log progress update"""
        if self.current_stage:
            stage_info = f"[{self.current_stage}] "
        else:
            stage_info = ""
        
        log_message = f"📊 {stage_info}{progress:.1f}%"
        if message:
            log_message += f" - {message}"
        
        self.logger.info(log_message)
    
    def complete_stage(self, success: bool = True, message: str = ""):
        """Log the completion of a processing stage"""
        if not self.current_stage:
            return
        
        import time
        
        elapsed = time.time() - self.stage_start_time if self.stage_start_time else 0
        status = "✅" if success else "❌"
        
        log_message = f"{status} Completed {self.current_stage} in {elapsed:.1f}s"
        if message:
            log_message += f" - {message}"
        
        self.logger.info(log_message)
        
        self.current_stage = None
        self.stage_start_time = None
    
    def log_warning(self, message: str):
        """Log a warning message"""
        self.logger.warning(f"⚠️  {message}")
    
    def log_error(self, message: str):
        """Log an error message"""
        self.logger.error(f"❌ {message}")
    
    def log_success(self, message: str):
        """Log a success message"""
        self.logger.info(f"✅ {message}")


class SessionMetricsLogger:
    """Logger for session processing metrics and statistics"""
    
    def __init__(self, logger_name: str = "metrics"):
        self.logger = logging.getLogger(logger_name)
    
    def log_input_metrics(self, session_number: int, raw_content: str):
        """Log input session metrics"""
        lines = len(raw_content.split('\n'))
        words = len(raw_content.split())
        
        # Count speakers
        import re
        speakers = len(set(re.findall(r'^([^:]+):', raw_content, re.MULTILINE)))
        
        self.logger.info(
            f"📈 INPUT METRICS - Session {session_number}: "
            f"{lines} lines, {words} words, {speakers} speakers"
        )
    
    def log_output_metrics(self, session_number: int, processed_content: str, stage: str):
        """Log output metrics for a processing stage"""
        lines = len(processed_content.split('\n'))
        words = len(processed_content.split())
        
        self.logger.info(
            f"📊 OUTPUT METRICS - Session {session_number} ({stage}): "
            f"{lines} lines, {words} words"
        )
    
    def log_quality_metrics(self, session_number: int, retention_rate: float, 
                           speaker_retention: float, quality_score: float):
        """Log quality assessment metrics"""
        quality_status = "Good" if quality_score >= 70 else "Check" if quality_score >= 50 else "Poor"
        
        self.logger.info(
            f"🎯 QUALITY METRICS - Session {session_number}: "
            f"{retention_rate:.1f}% content, {speaker_retention:.1f}% speakers, "
            f"Score: {quality_score:.1f} ({quality_status})"
        )
    
    def log_processing_summary(self, session_number: int, stages_completed: list, 
                              total_time: float, success: bool):
        """Log overall processing summary"""
        status = "✅ SUCCESS" if success else "❌ FAILED"
        stages_str = ", ".join(stages_completed)
        
        self.logger.info(
            f"📋 PROCESSING SUMMARY - Session {session_number}: "
            f"{status} - Stages: [{stages_str}] - Time: {total_time:.1f}s"
        )


def get_logger(name: str) -> logging.Logger:
    """Get a configured logger instance"""
    return logging.getLogger(name)


def set_debug_mode(enabled: bool = True):
    """Enable or disable debug mode logging"""
    level = logging.DEBUG if enabled else logging.INFO
    logging.getLogger().setLevel(level)
    
    if enabled:
        logging.info("Debug mode enabled")
    else:
        logging.info("Debug mode disabled")