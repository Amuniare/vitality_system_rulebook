"""
Persistent job queue system for AI processing stages
Handles queuing, prioritization, and resume capability for transcription jobs
"""
import json
import time
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
from dataclasses import dataclass, asdict


class JobStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"


class JobPriority(Enum):
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4


@dataclass
class ProcessingJob:
    """Represents a single AI processing job"""
    job_id: str
    session_id: int
    stage: str  # cleanup, timeline, notes, summary
    priority: JobPriority
    status: JobStatus
    content_hash: str
    created_at: datetime
    updated_at: datetime
    attempts: int = 0
    max_attempts: int = 3
    error_message: Optional[str] = None
    result: Optional[str] = None
    chunk_index: Optional[int] = None
    total_chunks: Optional[int] = None
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data['priority'] = self.priority.value
        data['status'] = self.status.value
        data['created_at'] = self.created_at.isoformat()
        data['updated_at'] = self.updated_at.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'ProcessingJob':
        """Create from dictionary loaded from JSON"""
        data['priority'] = JobPriority(data['priority'])
        data['status'] = JobStatus(data['status'])
        data['created_at'] = datetime.fromisoformat(data['created_at'])
        data['updated_at'] = datetime.fromisoformat(data['updated_at'])
        return cls(**data)


class JobQueue:
    """Persistent job queue for AI processing tasks"""
    
    def __init__(self, queue_file: Path):
        self.queue_file = queue_file
        self.logger = logging.getLogger(__name__)
        self.jobs: Dict[str, ProcessingJob] = {}
        self.load_queue()
    
    def load_queue(self):
        """Load job queue from persistent storage"""
        if self.queue_file.exists():
            try:
                with open(self.queue_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                self.jobs = {}
                for job_data in data.get('jobs', []):
                    job = ProcessingJob.from_dict(job_data)
                    self.jobs[job.job_id] = job
                
                self.logger.info(f"Loaded {len(self.jobs)} jobs from queue")
                
            except Exception as e:
                self.logger.error(f"Failed to load job queue: {e}")
                self.jobs = {}
    
    def save_queue(self):
        """Save job queue to persistent storage"""
        try:
            # Create directory if it doesn't exist
            self.queue_file.parent.mkdir(parents=True, exist_ok=True)
            
            data = {
                'updated_at': datetime.now().isoformat(),
                'jobs': [job.to_dict() for job in self.jobs.values()]
            }
            
            with open(self.queue_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            self.logger.error(f"Failed to save job queue: {e}")
    
    def add_job(self, session_id: int, stage: str, content_hash: str, 
                priority: JobPriority = JobPriority.NORMAL,
                chunk_index: Optional[int] = None,
                total_chunks: Optional[int] = None) -> str:
        """Add a new job to the queue"""
        
        # Generate unique job ID
        job_id = f"{session_id}_{stage}"
        if chunk_index is not None:
            job_id += f"_chunk_{chunk_index}"
        
        # Check if job already exists
        if job_id in self.jobs:
            existing_job = self.jobs[job_id]
            if existing_job.status in [JobStatus.COMPLETED, JobStatus.IN_PROGRESS]:
                self.logger.info(f"Job {job_id} already exists with status {existing_job.status}")
                return job_id
        
        # Create new job
        now = datetime.now()
        job = ProcessingJob(
            job_id=job_id,
            session_id=session_id,
            stage=stage,
            priority=priority,
            status=JobStatus.PENDING,
            content_hash=content_hash,
            created_at=now,
            updated_at=now,
            chunk_index=chunk_index,
            total_chunks=total_chunks
        )
        
        self.jobs[job_id] = job
        self.save_queue()
        
        self.logger.info(f"Added job {job_id} to queue (priority: {priority.name})")
        return job_id
    
    def get_next_job(self) -> Optional[ProcessingJob]:
        """Get the next job to process based on priority and creation time"""
        pending_jobs = [
            job for job in self.jobs.values() 
            if job.status == JobStatus.PENDING and job.attempts < job.max_attempts
        ]
        
        if not pending_jobs:
            return None
        
        # Sort by priority (highest first), then by creation time (oldest first)
        pending_jobs.sort(key=lambda j: (-j.priority.value, j.created_at))
        return pending_jobs[0]
    
    def start_job(self, job_id: str) -> bool:
        """Mark a job as in progress"""
        if job_id not in self.jobs:
            return False
        
        job = self.jobs[job_id]
        if job.status != JobStatus.PENDING:
            return False
        
        job.status = JobStatus.IN_PROGRESS
        job.updated_at = datetime.now()
        job.attempts += 1
        
        self.save_queue()
        self.logger.info(f"Started job {job_id} (attempt {job.attempts})")
        return True
    
    def complete_job(self, job_id: str, result: str) -> bool:
        """Mark a job as completed with result"""
        if job_id not in self.jobs:
            return False
        
        job = self.jobs[job_id]
        job.status = JobStatus.COMPLETED
        job.result = result
        job.updated_at = datetime.now()
        job.error_message = None
        
        self.save_queue()
        self.logger.info(f"Completed job {job_id}")
        return True
    
    def fail_job(self, job_id: str, error_message: str) -> bool:
        """Mark a job as failed"""
        if job_id not in self.jobs:
            return False
        
        job = self.jobs[job_id]
        job.error_message = error_message
        job.updated_at = datetime.now()
        
        # Check if we should retry or mark as permanently failed
        if job.attempts >= job.max_attempts:
            job.status = JobStatus.FAILED
            self.logger.error(f"Job {job_id} permanently failed after {job.attempts} attempts: {error_message}")
        else:
            job.status = JobStatus.PENDING  # Will be retried
            self.logger.warning(f"Job {job_id} failed (attempt {job.attempts}), will retry: {error_message}")
        
        self.save_queue()
        return True
    
    def pause_job(self, job_id: str) -> bool:
        """Pause a job (e.g., due to quota limits)"""
        if job_id not in self.jobs:
            return False
        
        job = self.jobs[job_id]
        if job.status == JobStatus.IN_PROGRESS:
            job.status = JobStatus.PAUSED
            job.updated_at = datetime.now()
            self.save_queue()
            self.logger.info(f"Paused job {job_id}")
            return True
        
        return False
    
    def resume_paused_jobs(self) -> int:
        """Resume all paused jobs"""
        resumed_count = 0
        for job in self.jobs.values():
            if job.status == JobStatus.PAUSED:
                job.status = JobStatus.PENDING
                job.updated_at = datetime.now()
                resumed_count += 1
        
        if resumed_count > 0:
            self.save_queue()
            self.logger.info(f"Resumed {resumed_count} paused jobs")
        
        return resumed_count
    
    def get_job_status(self, job_id: str) -> Optional[Dict]:
        """Get detailed status of a specific job"""
        if job_id not in self.jobs:
            return None
        
        job = self.jobs[job_id]
        return {
            'job_id': job.job_id,
            'session_id': job.session_id,
            'stage': job.stage,
            'status': job.status.value,
            'priority': job.priority.name,
            'attempts': job.attempts,
            'max_attempts': job.max_attempts,
            'created_at': job.created_at.isoformat(),
            'updated_at': job.updated_at.isoformat(),
            'error_message': job.error_message,
            'has_result': job.result is not None,
            'chunk_info': f"{job.chunk_index}/{job.total_chunks}" if job.chunk_index is not None else None
        }
    
    def get_queue_summary(self) -> Dict:
        """Get summary of queue status"""
        status_counts = {}
        for status in JobStatus:
            status_counts[status.value] = sum(1 for job in self.jobs.values() if job.status == status)
        
        priority_counts = {}
        for priority in JobPriority:
            priority_counts[priority.name] = sum(1 for job in self.jobs.values() if job.priority == priority)
        
        # Get session statistics
        session_stats = {}
        for job in self.jobs.values():
            session_id = job.session_id
            if session_id not in session_stats:
                session_stats[session_id] = {'total': 0, 'completed': 0, 'failed': 0}
            
            session_stats[session_id]['total'] += 1
            if job.status == JobStatus.COMPLETED:
                session_stats[session_id]['completed'] += 1
            elif job.status == JobStatus.FAILED:
                session_stats[session_id]['failed'] += 1
        
        return {
            'total_jobs': len(self.jobs),
            'status_breakdown': status_counts,
            'priority_breakdown': priority_counts,
            'session_stats': session_stats,
            'next_job_available': self.get_next_job() is not None
        }
    
    def cleanup_old_jobs(self, days_old: int = 30):
        """Remove completed/failed jobs older than specified days"""
        cutoff_date = datetime.now() - timedelta(days=days_old)
        jobs_to_remove = []
        
        for job_id, job in self.jobs.items():
            if (job.status in [JobStatus.COMPLETED, JobStatus.FAILED] and 
                job.updated_at < cutoff_date):
                jobs_to_remove.append(job_id)
        
        for job_id in jobs_to_remove:
            del self.jobs[job_id]
        
        if jobs_to_remove:
            self.save_queue()
            self.logger.info(f"Cleaned up {len(jobs_to_remove)} old jobs")
        
        return len(jobs_to_remove)
    
    def retry_failed_jobs(self) -> int:
        """Retry all failed jobs that haven't exceeded max attempts"""
        retried_count = 0
        
        for job in self.jobs.values():
            if job.status == JobStatus.FAILED and job.attempts < job.max_attempts:
                job.status = JobStatus.PENDING
                job.error_message = None
                job.updated_at = datetime.now()
                retried_count += 1
        
        if retried_count > 0:
            self.save_queue()
            self.logger.info(f"Retrying {retried_count} failed jobs")
        
        return retried_count


class JobProcessor:
    """Processes jobs from the queue using the AI client"""
    
    def __init__(self, queue: JobQueue, api_client, ai_pipeline):
        self.queue = queue
        self.api_client = api_client
        self.ai_pipeline = ai_pipeline
        self.logger = logging.getLogger(__name__)
        self.is_processing = False
    
    def process_next_job(self) -> bool:
        """Process the next available job"""
        if self.is_processing:
            return False
        
        # Check if we can make API requests
        if not self.api_client.can_make_request():
            quota_status = self.api_client.get_quota_status()
            wait_time = quota_status['time_until_next_request']
            self.logger.info(f"Cannot process jobs: quota limits. Wait time: {wait_time:.0f}s")
            return False
        
        # Get next job
        job = self.queue.get_next_job()
        if not job:
            return False
        
        self.is_processing = True
        success = False
        
        try:
            # Start the job
            if not self.queue.start_job(job.job_id):
                return False
            
            self.logger.info(f"Processing job {job.job_id} (session {job.session_id}, stage {job.stage})")
            
            # Process the job using AI pipeline
            result = self._process_job_content(job)
            
            if result:
                self.queue.complete_job(job.job_id, result)
                success = True
            else:
                self.queue.fail_job(job.job_id, "Processing returned no result")
            
        except Exception as e:
            error_msg = str(e)
            self.logger.error(f"Job {job.job_id} failed with error: {error_msg}")
            
            # Check if it's a quota error
            if "quota" in error_msg.lower() or "429" in error_msg:
                self.queue.pause_job(job.job_id)
                self.logger.info(f"Paused job {job.job_id} due to quota limits")
            else:
                self.queue.fail_job(job.job_id, error_msg)
        
        finally:
            self.is_processing = False
        
        return success
    
    def _process_job_content(self, job: ProcessingJob) -> Optional[str]:
        """Process job content using the appropriate AI pipeline stage"""
        try:
            # Load session content based on job details
            # This would integrate with your existing session loading logic
            
            # For now, this is a placeholder that would call the appropriate
            # AI pipeline method based on the job stage
            if job.stage == "cleanup":
                return self.ai_pipeline.process_cleanup_stage(job.session_id, job.chunk_index)
            elif job.stage == "timeline":
                return self.ai_pipeline.process_timeline_stage(job.session_id)
            elif job.stage == "notes":
                return self.ai_pipeline.process_notes_stage(job.session_id)
            elif job.stage == "summary":
                return self.ai_pipeline.process_summary_stage(job.session_id)
            else:
                raise ValueError(f"Unknown job stage: {job.stage}")
                
        except Exception as e:
            self.logger.error(f"Failed to process job content: {e}")
            raise
    
    def process_available_jobs(self, max_jobs: int = 10) -> int:
        """Process multiple jobs up to the specified limit"""
        processed_count = 0
        
        for _ in range(max_jobs):
            if not self.process_next_job():
                break
            processed_count += 1
            
            # Small delay between jobs to be gentle on API
            time.sleep(1)
        
        if processed_count > 0:
            self.logger.info(f"Processed {processed_count} jobs")
        
        return processed_count