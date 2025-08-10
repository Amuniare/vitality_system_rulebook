#!/usr/bin/env python3
"""
Simple test to verify chunking fixes work for real-world scenarios
"""
import time
from chunking_utils import SessionChunker, ChunkingTimeoutError, ChunkingProgressError


def test_large_realistic_session():
    """Test with a realistic large session similar to the 34k word issue"""
    print("🧪 Testing large realistic session...")
    
    # Create chunker similar to production settings
    chunker = SessionChunker(
        max_chunk_size=8000,
        overlap_size=200,
        timeout_seconds=30
    )
    
    # Create realistic session content
    speakers = ["GM/Cinder", "emperor's favorite princess", ".phan10m", "burn baby burn", "bipolarfrenchie", "roathus", "jubb"]
    session_parts = []
    
    # Simulate a very large session
    for i in range(2000):  # This should create ~30-40k words
        speaker = speakers[i % len(speakers)]
        # Vary content length to simulate real conversation
        content_length = 10 + (i % 20)  # 10-30 words per message
        content = " ".join([f"word{j}" for j in range(content_length)])
        
        # Add some natural breaks
        if i % 100 == 0:
            session_parts.append("\n[Scene Change]\n")
        elif i % 50 == 0:
            session_parts.append("\n---\n")
        
        session_parts.append(f"{speaker}: {content}")
    
    large_session = "\n".join(session_parts)
    word_count = len(large_session.split())
    
    print(f"📊 Created test session with {word_count:,} words")
    
    # Test chunking
    start_time = time.time()
    try:
        chunks = chunker.chunk_session_intelligently(large_session, 1)
        elapsed_time = time.time() - start_time
        
        print(f"✅ SUCCESS: Chunked {word_count:,} words into {len(chunks)} chunks in {elapsed_time:.2f}s")
        
        # Validate chunks
        validation = chunker.validate_chunks_before_processing(chunks)
        if validation['valid']:
            print(f"✅ Chunk validation passed")
        else:
            print(f"⚠️ Chunk validation issues: {validation['issues']}")
        
        # Test stitching
        chunk_contents = [chunk['content'] for chunk in chunks]
        stitched = chunker.stitch_chunks_together(chunk_contents)
        
        # Validate completeness
        completeness = chunker.validate_chunk_completeness(large_session, stitched)
        retention = completeness['word_retention']
        
        if completeness['quality_acceptable']:
            print(f"✅ Content retention acceptable: {retention:.1%}")
        else:
            print(f"⚠️ Content retention warning: {retention:.1%}")
            if completeness['warnings']:
                for warning in completeness['warnings']:
                    print(f"   - {warning}")
        
        return True
        
    except (ChunkingTimeoutError, ChunkingProgressError) as e:
        print(f"❌ FAILED: {e}")
        return False
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_pathological_cases():
    """Test edge cases that might cause infinite loops"""
    print("\n🧪 Testing pathological cases...")
    
    chunker = SessionChunker(
        max_chunk_size=200,
        overlap_size=20,
        timeout_seconds=10
    )
    
    # Test 1: Highly repetitive content
    print("📋 Test 1: Highly repetitive content")
    repetitive_content = "speaker: This is the same line.\n" * 500
    try:
        chunks = chunker.chunk_session_intelligently(repetitive_content, 1)
        print(f"✅ Handled repetitive content: {len(chunks)} chunks")
    except Exception as e:
        print(f"❌ Failed on repetitive content: {e}")
        return False
    
    # Test 2: Very long lines
    print("📋 Test 2: Very long lines")
    long_lines = []
    for i in range(100):
        long_line = f"speaker{i}: " + " ".join([f"word{j}" for j in range(100)])  # 100 words per line
        long_lines.append(long_line)
    long_content = "\n".join(long_lines)
    
    try:
        chunks = chunker.chunk_session_intelligently(long_content, 1)
        print(f"✅ Handled long lines: {len(chunks)} chunks")
    except Exception as e:
        print(f"❌ Failed on long lines: {e}")
        return False
    
    # Test 3: Many empty lines
    print("📋 Test 3: Content with many empty lines")
    sparse_content = []
    for i in range(200):
        if i % 3 == 0:
            sparse_content.append(f"speaker: Message {i}")
        else:
            sparse_content.append("")  # Empty line
    sparse_text = "\n".join(sparse_content)
    
    try:
        chunks = chunker.chunk_session_intelligently(sparse_text, 1)
        print(f"✅ Handled sparse content: {len(chunks)} chunks")
    except Exception as e:
        print(f"❌ Failed on sparse content: {e}")
        return False
    
    return True


def main():
    """Run comprehensive real-world tests"""
    print("🚀 Running real-world chunking tests...")
    
    success1 = test_large_realistic_session()
    success2 = test_pathological_cases()
    
    if success1 and success2:
        print("\n🎉 All real-world tests passed!")
        print("✅ The chunking fix should resolve the 34k+ word session hang issue")
        return True
    else:
        print("\n❌ Some tests failed")
        return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)