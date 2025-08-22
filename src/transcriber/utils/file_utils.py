"""
File system utilities for the transcriber
Handles file operations, path management, and I/O
"""
from pathlib import Path
from typing import Dict, List, Optional, Any
import json
import logging


class FileManager:
    """Manages file operations for the transcriber system"""
    
    def __init__(self, base_dir: Path):
        self.base_dir = Path(base_dir)
        self.logger = logging.getLogger(__name__)
    
    def ensure_directories(self, directories: List[Path]):
        """Ensure all directories exist"""
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            self.logger.debug(f"Ensured directory exists: {directory}")
    
    def save_session_result(self, session_number: int, stage: str, content: str, 
                           subdirectory: str = "sessions") -> bool:
        """Save session processing result to appropriate file"""
        try:
            # Directory mapping for different stages
            stage_dirs = {
                'cleaned': 'cleaned',
                'timeline': 'ai-processed', 
                'notes': 'ai-processed',
                'summary': 'ai-processed'
            }
            
            # Determine file extension and header based on stage
            if stage in ['timeline', 'notes', 'summary']:
                ext = '.md'
                header = self._generate_markdown_header(session_number, stage)
                full_content = header + content
            else:
                ext = '.txt'
                full_content = content
            
            # Generate filename and path
            filename = f"session-{session_number:02d}-{stage}{ext}"
            stage_dir = stage_dirs.get(stage, stage)
            file_path = self.base_dir / subdirectory / stage_dir / filename
            
            # Ensure directory exists
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(full_content)
            
            self.logger.info(f"Saved {stage}: {file_path.name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save {stage} for session {session_number}: {e}")
            return False
    
    def _generate_markdown_header(self, session_number: int, stage: str) -> str:
        """Generate markdown header for session files"""
        stage_titles = {
            'timeline': 'Timeline',
            'notes': 'GM Notes', 
            'summary': 'Summary'
        }
        
        title = stage_titles.get(stage, stage.title())
        header = f"# Session {session_number} {title}\n\n"
        
        if stage == 'notes':
            header += "## Key Developments\n\n"
        
        return header
    
    def load_session_file(self, session_number: int, stage: str, 
                         subdirectory: str = "sessions") -> Optional[str]:
        """Load session file content"""
        try:
            # Directory mapping for different stages
            stage_dirs = {
                'cleaned': 'cleaned',
                'timeline': 'ai-processed', 
                'notes': 'ai-processed',
                'summary': 'ai-processed',
                'raw': 'raw'
            }
            
            # Determine file extension
            ext = '.md' if stage in ['timeline', 'notes', 'summary'] else '.txt'
            filename = f"session-{session_number:02d}-{stage}{ext}"
            stage_subdir = stage_dirs.get(stage, stage)
            file_path = self.base_dir / subdirectory / stage_subdir / filename
            
            if not file_path.exists():
                self.logger.warning(f"Session file not found: {file_path}")
                return None
            
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
                
        except Exception as e:
            self.logger.error(f"Failed to load {stage} for session {session_number}: {e}")
            return None
    
    def list_available_sessions(self, stage: str = "raw", 
                               subdirectory: str = "sessions") -> List[int]:
        """List available session numbers for a given stage"""
        try:
            # Directory mapping for different stages
            stage_dirs = {
                'cleaned': 'cleaned',
                'timeline': 'ai-processed', 
                'notes': 'ai-processed',
                'summary': 'ai-processed',
                'raw': 'raw'
            }
            
            stage_subdir = stage_dirs.get(stage, stage)
            stage_dir = self.base_dir / subdirectory / stage_subdir
            
            if not stage_dir.exists():
                return []
            
            session_numbers = []
            pattern = f"session-*-{stage}.*" if stage != "raw" else "session-*-raw.txt"
            
            for file_path in stage_dir.glob(pattern):
                try:
                    # Extract session number from filename
                    parts = file_path.stem.split('-')
                    if len(parts) >= 2:
                        session_numbers.append(int(parts[1]))
                except (ValueError, IndexError):
                    continue
            
            return sorted(session_numbers)
            
        except Exception as e:
            self.logger.error(f"Failed to list sessions for stage {stage}: {e}")
            return []
    
    def save_json(self, data: Dict[str, Any], filename: str, 
                 subdirectory: str = "") -> bool:
        """Save data as JSON file"""
        try:
            file_path = self.base_dir / subdirectory / filename if subdirectory else self.base_dir / filename
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            self.logger.debug(f"Saved JSON: {file_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save JSON {filename}: {e}")
            return False
    
    def load_json(self, filename: str, subdirectory: str = "") -> Optional[Dict[str, Any]]:
        """Load data from JSON file"""
        try:
            file_path = self.base_dir / subdirectory / filename if subdirectory else self.base_dir / filename
            
            if not file_path.exists():
                return None
            
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
                
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in {filename}: {e}")
            return None
        except Exception as e:
            self.logger.error(f"Failed to load JSON {filename}: {e}")
            return None
    
    def archive_old_files(self, stage: str, keep_recent: int = 10) -> int:
        """Archive old session files, keeping only recent ones"""
        try:
            stage_dir = self.base_dir / "sessions" / (stage + "s" if stage != "raw" else stage)
            archive_dir = self.base_dir / "archive" / stage
            
            if not stage_dir.exists():
                return 0
            
            # Get all session files
            sessions = self.list_available_sessions(stage)
            if len(sessions) <= keep_recent:
                return 0  # Nothing to archive
            
            # Archive older sessions
            sessions_to_archive = sessions[:-keep_recent]
            archive_dir.mkdir(parents=True, exist_ok=True)
            archived_count = 0
            
            for session_num in sessions_to_archive:
                try:
                    # Find the file
                    ext = '.md' if stage in ['timeline', 'notes', 'summary'] else '.txt'
                    filename = f"session-{session_num:02d}-{stage}{ext}"
                    source_path = stage_dir / filename
                    dest_path = archive_dir / filename
                    
                    if source_path.exists():
                        source_path.rename(dest_path)
                        archived_count += 1
                        self.logger.info(f"Archived {filename}")
                        
                except Exception as e:
                    self.logger.error(f"Failed to archive session {session_num}: {e}")
            
            return archived_count
            
        except Exception as e:
            self.logger.error(f"Archive operation failed for {stage}: {e}")
            return 0
    
    def get_file_stats(self) -> Dict[str, Any]:
        """Get statistics about stored files"""
        stats = {
            'sessions_by_stage': {},
            'total_files': 0,
            'disk_usage_mb': 0
        }
        
        try:
            stages = ['raw', 'cleaned', 'timeline', 'notes', 'summary']
            
            for stage in stages:
                sessions = self.list_available_sessions(stage)
                stats['sessions_by_stage'][stage] = len(sessions)
                stats['total_files'] += len(sessions)
            
            # Calculate approximate disk usage
            if self.base_dir.exists():
                total_size = sum(f.stat().st_size for f in self.base_dir.rglob('*') if f.is_file())
                stats['disk_usage_mb'] = total_size / (1024 * 1024)
            
        except Exception as e:
            self.logger.error(f"Failed to get file stats: {e}")
        
        return stats