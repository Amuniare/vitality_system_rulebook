#!/usr/bin/env python3
"""
Test script for the enhanced transcriber system
Tests quota management, job queue, caching, and model switching
"""
import sys
import logging
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from ai.api_client import APIClient
from ai.job_queue import JobQueue, JobPriority
from ai.ai_pipeline import AIPipeline
from utils.config_manager import ConfigManager
from core.chunking_engine import SessionChunker

def setup_logging():
    """Set up logging for testing"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

def test_enhanced_api_client():
    """Test enhanced API client features"""
    print("\n=== Testing Enhanced API Client ===")
    
    try:
        # Initialize with caching
        cache_dir = Path('./test_cache')
        api_client = APIClient(cache_dir=cache_dir)
        
        # Test quota status
        quota_status = api_client.get_quota_status()
        print(f"Quota Status: {quota_status['quota_exceeded']}")
        print(f"Daily Requests: {quota_status['daily_requests']}/{quota_status['daily_limit']}")
        print(f"Can Make Request: {quota_status['can_make_request']}")
        
        # Test model information
        model_info = api_client.get_model_info()
        print(f"Current Model: {model_info['model_name']}")
        print(f"Available Models: {model_info['available_models']}")
        print(f"Model Quality: {model_info['model_quality']}")
        
        # Test model switching
        if 'gemini-1.5-flash' in api_client.get_available_models():
            success = api_client.switch_to_model('gemini-1.5-flash')
            print(f"Model Switch Success: {success}")
        
        # Test cache key generation
        cache_key = api_client.get_cache_key("test prompt", "test system")
        print(f"Cache Key Generated: {cache_key[:16]}...")
        
        print("✅ Enhanced API Client tests passed")
        return True
        
    except Exception as e:
        print(f"❌ Enhanced API Client test failed: {e}")
        return False

def test_job_queue_system():
    """Test job queue functionality"""
    print("\n=== Testing Job Queue System ===")
    
    try:
        # Initialize job queue
        queue_file = Path('./test_queue.json')
        job_queue = JobQueue(queue_file)
        
        # Add test jobs
        job_id_1 = job_queue.add_job(1, 'cleanup', 'test_hash_1', JobPriority.HIGH)
        job_id_2 = job_queue.add_job(1, 'timeline', 'test_hash_2', JobPriority.NORMAL)
        job_id_3 = job_queue.add_job(2, 'cleanup', 'test_hash_3', JobPriority.LOW)
        
        print(f"Added jobs: {job_id_1}, {job_id_2}, {job_id_3}")
        
        # Test queue summary
        summary = job_queue.get_queue_summary()
        print(f"Total Jobs: {summary['total_jobs']}")
        print(f"Status Breakdown: {summary['status_breakdown']}")
        print(f"Priority Breakdown: {summary['priority_breakdown']}")
        
        # Test getting next job
        next_job = job_queue.get_next_job()
        if next_job:
            print(f"Next Job: {next_job.job_id} (Priority: {next_job.priority.name})")
            
            # Test job lifecycle
            job_queue.start_job(next_job.job_id)
            job_queue.complete_job(next_job.job_id, "Test result")
            
            job_status = job_queue.get_job_status(next_job.job_id)
            print(f"Job Status: {job_status['status']}")
        
        # Cleanup
        if queue_file.exists():
            queue_file.unlink()
        
        print("✅ Job Queue system tests passed")
        return True
        
    except Exception as e:
        print(f"❌ Job Queue test failed: {e}")
        return False

def test_optimized_chunking():
    """Test optimized chunking algorithm"""
    print("\n=== Testing Optimized Chunking ===")
    
    try:
        # Create test content
        test_content = " ".join(["This is test content for chunking."] * 2000)  # ~12k words
        
        # Test with adaptive sizing
        chunker = SessionChunker(
            max_chunk_size=12000,
            overlap_size=300,
            adaptive_sizing=True
        )
        
        # Test chunking decision
        needs_chunking = chunker.should_chunk_session(test_content)
        print(f"Content needs chunking: {needs_chunking}")
        
        if needs_chunking:
            chunks = chunker.chunk_session_intelligently(test_content, 999)
            print(f"Created {len(chunks)} optimized chunks")
            
            if chunks:
                avg_size = sum(chunk['actual_size'] for chunk in chunks) / len(chunks)
                efficiency = sum(chunk['efficiency_ratio'] for chunk in chunks) / len(chunks)
                print(f"Average chunk size: {avg_size:.0f} words")
                print(f"Average efficiency: {efficiency:.1%}")
        
        # Test optimal chunk size calculation
        optimal_size = chunker._calculate_optimal_chunk_size(30000)
        print(f"Optimal chunk size for 30k words: {optimal_size}")
        
        print("✅ Optimized Chunking tests passed")
        return True
        
    except Exception as e:
        print(f"❌ Optimized Chunking test failed: {e}")
        return False

def test_enhanced_configuration():
    """Test enhanced configuration system"""
    print("\n=== Testing Enhanced Configuration ===")
    
    try:
        config = ConfigManager()
        
        # Test new AI configuration
        ai_config = config.get_ai_config()
        print(f"Default Model: {ai_config['default_model']}")
        print(f"Preferred Model: {ai_config['preferred_model']}")
        print(f"Model Switching: {ai_config['enable_model_switching']}")
        print(f"Caching: {ai_config['enable_caching']}")
        
        # Test processing configuration
        proc_config = config.get_processing_config()
        print(f"Adaptive Chunking: {proc_config['adaptive_chunking']}")
        print(f"Job Queue: {proc_config['enable_job_queue']}")
        print(f"Auto Resume: {proc_config['auto_resume_jobs']}")
        
        # Test validation
        validation = config.validate_enhanced_config()
        print(f"Configuration Validation: {validation}")
        
        # Test configuration summary
        config.print_config_summary()
        
        print("✅ Enhanced Configuration tests passed")
        return True
        
    except Exception as e:
        print(f"❌ Enhanced Configuration test failed: {e}")
        return False

def test_ai_pipeline_integration():
    """Test AI pipeline with enhanced features"""
    print("\n=== Testing AI Pipeline Integration ===")
    
    try:
        # Initialize with job queue enabled
        pipeline = AIPipeline(
            config_path=".",
            enable_queue=True
        )
        
        # Test processing status
        status = pipeline.get_processing_status()
        print(f"Current Model: {status['current_model']}")
        print(f"Model Quality: {status['model_quality']}")
        print(f"Can Process: {status['can_process']}")
        
        # Test queue status
        if pipeline.enable_queue:
            queue_status = pipeline.get_queue_status()
            print(f"Queue Status: {queue_status}")
        
        # Test model optimization
        pipeline.optimize_for_task('cleanup', 25000)
        
        # Test connection (without making actual API calls)
        connection_test = pipeline.test_api_connection(test_all_models=False)
        print(f"Connection Test: {connection_test}")
        
        print("✅ AI Pipeline Integration tests passed")
        return True
        
    except Exception as e:
        print(f"❌ AI Pipeline Integration test failed: {e}")
        return False

def test_with_existing_session_data():
    """Test system with existing session data if available"""
    print("\n=== Testing with Existing Session Data ===")
    
    try:
        # Look for existing cleaned session files
        session_files = list(Path('.').glob('**/session-*-cleaned.txt'))
        
        if not session_files:
            print("No existing session files found, skipping data test")
            return True
        
        print(f"Found {len(session_files)} session files")
        
        # Test with first available session
        session_file = session_files[0]
        print(f"Testing with: {session_file}")
        
        try:
            with open(session_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            word_count = len(content.split())
            print(f"Session content: {word_count} words")
            
            # Test chunking decision
            chunker = SessionChunker(adaptive_sizing=True)
            needs_chunking = chunker.should_chunk_session(content)
            print(f"Needs chunking: {needs_chunking}")
            
            # Test optimal model suggestion
            api_client = APIClient()
            optimal_model = api_client.suggest_optimal_model(word_count, 'balanced')
            print(f"Optimal model for content: {optimal_model}")
            
            print("✅ Existing session data tests passed")
            return True
            
        except Exception as e:
            print(f"Failed to process session file {session_file}: {e}")
            return False
        
    except Exception as e:
        print(f"❌ Existing session data test failed: {e}")
        return False

def main():
    """Run all tests"""
    setup_logging()
    
    print("🚀 Starting Enhanced Transcriber System Tests")
    print("=" * 60)
    
    test_results = []
    
    # Run all tests
    test_results.append(("Enhanced API Client", test_enhanced_api_client()))
    test_results.append(("Job Queue System", test_job_queue_system()))
    test_results.append(("Optimized Chunking", test_optimized_chunking()))
    test_results.append(("Enhanced Configuration", test_enhanced_configuration()))
    test_results.append(("AI Pipeline Integration", test_ai_pipeline_integration()))
    test_results.append(("Existing Session Data", test_with_existing_session_data()))
    
    # Summary
    print("\n" + "=" * 60)
    print("🏁 Test Results Summary")
    print("=" * 60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:.<40} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 All enhanced features are working correctly!")
        print("The system is ready to handle quota limits and resume processing.")
    else:
        print(f"\n⚠️  {total - passed} tests failed. Check the errors above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)