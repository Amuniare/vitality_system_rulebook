#!/usr/bin/env python3
"""
Resume processing script for failed sessions
This script will resume AI processing for sessions that failed due to chunking issues
"""
import sys
import logging
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from ai.ai_pipeline import AIPipeline
from utils.config_manager import ConfigManager

def setup_logging():
    """Set up logging"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

def load_session_data(session_id: int) -> dict:
    """Load session data from cleaned file"""
    session_file = Path(f'session-{session_id:02d}-cleaned.txt')
    
    if not session_file.exists():
        print(f"❌ Session file not found: {session_file}")
        return None
    
    try:
        with open(session_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return {
            'session_number': session_id,
            'cleaned_content': content,
            'speaker_mapping': '',  # Would need to be loaded from processing results
            'previous_session_summary': ''
        }
    except Exception as e:
        print(f"❌ Failed to load session {session_id}: {e}")
        return None

def check_existing_outputs(session_id: int) -> dict:
    """Check which outputs already exist for a session"""
    outputs = {
        'timeline': Path(f'session-{session_id:02d}-timeline.md').exists(),
        'notes': Path(f'session-{session_id:02d}-notes.md').exists(),
        'summary': Path(f'session-{session_id:02d}-summary.md').exists()
    }
    return outputs

def main():
    """Resume processing for failed sessions"""
    setup_logging()
    
    print("🔄 Resume Processing Script")
    print("=" * 50)
    
    # Initialize AI pipeline with queue enabled
    try:
        config = ConfigManager()
        config.print_config_summary()
        
        pipeline = AIPipeline(enable_queue=True)
        
        # Check system status
        status = pipeline.get_processing_status()
        print(f"Current Model: {status['current_model']}")
        print(f"Can Process: {status['can_process']}")
        
        if not status['can_process']:
            quota_status = status['quota_status']
            wait_time = quota_status['time_until_next_request']
            print(f"⏳ Waiting for quota reset: {wait_time:.0f} seconds")
            
            if wait_time > 300:  # More than 5 minutes
                print("⚠️  Long wait time detected. Consider:")
                print("   1. Using job queue: pipeline.process_session(data, use_queue=True)")
                print("   2. Running resume_processing() when quota resets")
                print("   3. Switching to alternative model if available")
        
    except Exception as e:
        print(f"❌ Failed to initialize pipeline: {e}")
        return False
    
    # Check sessions that need processing
    sessions_to_process = []
    
    for session_id in [1, 3, 4, 5]:  # Session 2 was successful
        session_data = load_session_data(session_id)
        if session_data:
            existing_outputs = check_existing_outputs(session_id)
            
            # Determine what stages are missing
            missing_stages = []
            if not existing_outputs['timeline']:
                missing_stages.extend(['cleanup', 'timeline'])
            if not existing_outputs['notes']:
                missing_stages.append('notes')
            if not existing_outputs['summary']:
                missing_stages.append('summary')
            
            if missing_stages:
                sessions_to_process.append({
                    'session_id': session_id,
                    'data': session_data,
                    'missing_stages': list(set(missing_stages)),  # Remove duplicates
                    'word_count': len(session_data['cleaned_content'].split())
                })
                
                print(f"📋 Session {session_id}: {len(session_data['cleaned_content'].split())} words")
                print(f"   Missing: {', '.join(missing_stages)}")
    
    if not sessions_to_process:
        print("✅ All sessions appear to be fully processed!")
        return True
    
    print(f"\n🎯 Found {len(sessions_to_process)} sessions needing processing")
    
    # Process sessions
    for session_info in sessions_to_process:
        session_id = session_info['session_id']
        session_data = session_info['data']
        stages = session_info['missing_stages']
        
        print(f"\n🔄 Processing Session {session_id}")
        print(f"   Stages: {', '.join(stages)}")
        print(f"   Content: {session_info['word_count']} words")
        
        try:
            # Check if we should queue or process immediately
            if status['can_process']:
                print("   ⚡ Processing immediately...")
                results = pipeline.process_session(session_data, stages=stages, use_queue=False)
            else:
                print("   📋 Adding to job queue...")
                results = pipeline.process_session(session_data, stages=stages, use_queue=True)
            
            # Report results
            success_count = sum(1 for stage in stages if results.get(stage) is not None)
            
            if results.get('_queued'):
                print(f"   📋 Queued {len(results.get('_job_ids', []))} jobs")
            else:
                print(f"   ✅ Completed {success_count}/{len(stages)} stages")
                
                if success_count < len(stages):
                    failed_stages = [stage for stage in stages if results.get(stage) is None]
                    print(f"   ❌ Failed stages: {', '.join(failed_stages)}")
        
        except Exception as e:
            print(f"   ❌ Processing failed: {e}")
    
    # Final status
    if pipeline.enable_queue:
        queue_status = pipeline.get_queue_status()
        pending_jobs = queue_status['status_breakdown'].get('pending', 0)
        
        if pending_jobs > 0:
            print(f"\n📋 Job Queue Status: {pending_jobs} pending jobs")
            print("💡 To process queued jobs when quota resets:")
            print("   processed = pipeline.resume_processing()")
    
    print("\n🏁 Resume processing complete!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)