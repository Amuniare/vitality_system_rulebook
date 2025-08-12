#!/usr/bin/env python3
"""
Comprehensive test suite for chunking functionality
Tests edge cases, infinite loop prevention, and performance
"""
import unittest
import time
import logging
from unittest.mock import MagicMock
from ..core.chunking_engine import SessionChunker, ChunkingTimeoutError, ChunkingProgressError


class TestChunkingEdgeCases(unittest.TestCase):
    """Test suite for chunking edge cases and safety features"""
    
    def setUp(self):
        """Set up test fixtures"""
        # Configure logging for tests
        logging.basicConfig(level=logging.WARNING)  # Reduce noise during tests
        
        # Create chunker with short timeout for testing
        self.chunker = SessionChunker(
            max_chunk_size=100,  # Small chunks for testing
            overlap_size=10,
            timeout_seconds=5    # Short timeout for testing
        )
        
        # Mock progress callback for testing
        self.progress_calls = []
        def mock_progress_callback(progress, chunk_id, current_pos, total_words, elapsed_time):
            self.progress_calls.append({
                'progress': progress,
                'chunk_id': chunk_id,
                'current_pos': current_pos,
                'total_words': total_words,
                'elapsed_time': elapsed_time
            })
        
        self.chunker.progress_callback = mock_progress_callback
    
    def test_empty_text(self):
        """Test handling of empty input"""
        with self.assertRaises((ValueError, IndexError)):
            self.chunker.chunk_session_intelligently("", 1)
    
    def test_single_word(self):
        """Test handling of very short input"""
        text = "hello"
        chunks = self.chunker.chunk_session_intelligently(text, 1)
        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0]['content'], text)
    
    def test_small_session_no_chunking(self):
        """Test that small sessions don't get chunked"""
        text = " ".join(["word"] * 50)  # 50 words, less than max_chunk_size
        chunks = self.chunker.chunk_session_intelligently(text, 1)
        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0]['content'], text)
    
    def test_large_session_gets_chunked(self):
        """Test that large sessions get properly chunked"""
        # Create text with 300 words (3x our chunk size)
        text = " ".join([f"word{i}" for i in range(300)])
        chunks = self.chunker.chunk_session_intelligently(text, 1)
        
        # Should create multiple chunks
        self.assertGreater(len(chunks), 1)
        
        # Each chunk should be reasonable size
        for chunk in chunks:
            words_in_chunk = len(chunk['content'].split())
            self.assertLessEqual(words_in_chunk, self.chunker.max_chunk_size * 1.5)  # Allow 50% tolerance
            self.assertGreater(words_in_chunk, 0)
    
    def test_infinite_loop_prevention(self):
        """Test that infinite loops are prevented"""
        # Create pathological case that might cause infinite loops
        # Text with many repeated patterns that could confuse break detection
        problematic_text = ""
        for i in range(200):  # Create 200 identical lines
            problematic_text += f"speaker{i % 3}: This is line {i} with repeated content.\n"
        
        # Should complete without hanging
        start_time = time.time()
        chunks = self.chunker.chunk_session_intelligently(problematic_text, 1)
        elapsed_time = time.time() - start_time
        
        # Should complete quickly (well under timeout)
        self.assertLess(elapsed_time, 3.0)  # Should complete in under 3 seconds
        
        # Should produce valid chunks
        self.assertGreater(len(chunks), 0)
        
        # Validate chunks have reasonable progression
        word_positions = [chunk['word_range'][0] for chunk in chunks]
        for i in range(1, len(word_positions)):
            self.assertGreater(word_positions[i], word_positions[i-1])  # Should always advance
    
    def test_timeout_protection(self):
        """Test that timeout protection works"""
        # Create chunker with very short timeout
        quick_chunker = SessionChunker(
            max_chunk_size=100,
            overlap_size=10,
            timeout_seconds=0.001  # 1ms timeout - should trigger immediately
        )
        
        # Large text should trigger timeout
        large_text = " ".join([f"word{i}" for i in range(1000)])
        
        with self.assertRaises(ChunkingTimeoutError):
            quick_chunker.chunk_session_intelligently(large_text, 1)
    
    def test_progress_callback_called(self):
        """Test that progress callbacks are triggered"""
        # Create text large enough to trigger progress reporting
        text = " ".join([f"word{i}" for i in range(500)])
        
        # Clear previous progress calls
        self.progress_calls = []
        
        # Run chunking
        chunks = self.chunker.chunk_session_intelligently(text, 1)
        
        # Progress should have been reported at least once for large sessions
        if len(chunks) >= 10:  # Only if we created enough chunks to trigger reporting
            self.assertGreater(len(self.progress_calls), 0)
        
        # Verify progress calls have expected structure
        for call in self.progress_calls:
            self.assertIn('progress', call)
            self.assertIn('chunk_id', call)
            self.assertIn('current_pos', call)
            self.assertIn('total_words', call)
            self.assertIn('elapsed_time', call)
            
            # Progress should be between 0 and 100
            self.assertGreaterEqual(call['progress'], 0)
            self.assertLessEqual(call['progress'], 100)
    
    def test_chunk_validation(self):
        """Test chunk validation functionality"""
        # Create valid chunks
        text = " ".join([f"word{i}" for i in range(300)])
        chunks = self.chunker.chunk_session_intelligently(text, 1)
        
        # Validate the generated chunks
        validation = self.chunker.validate_chunks_before_processing(chunks)
        
        self.assertTrue(validation['valid'])
        self.assertEqual(validation['chunk_count'], len(chunks))
        self.assertGreater(validation['total_chunk_words'], 0)
        self.assertEqual(len(validation['issues']), 0)
    
    def test_natural_break_detection(self):
        """Test natural break point detection"""
        text_with_breaks = """speaker1: Hello there.
speaker2: Hi back.

[Scene Change]

speaker1: Now we're in a new scene.
speaker3: This is different content.

---

speaker1: Another natural break here.
"""
        
        # Should detect the breaks
        breaks = self.chunker.detect_natural_breaks(text_with_breaks)
        self.assertGreater(len(breaks), 0)
        
        # Test chunking respects breaks when possible
        chunks = self.chunker.chunk_session_intelligently(text_with_breaks, 1)
        self.assertGreater(len(chunks), 0)
    
    def test_completeness_validation(self):
        """Test content completeness validation"""
        original_text = "This is the original text with many words and speakers."
        stitched_text = "This is the text with many words and speakers."  # Missing 'original'
        
        validation = self.chunker.validate_chunk_completeness(original_text, stitched_text)
        
        # Should detect some content loss
        self.assertLess(validation['word_retention'], 1.0)
        self.assertGreater(validation['content_loss'], 0)
        
        # But should still be mostly complete
        self.assertGreater(validation['word_retention'], 0.8)
    
    def test_precalculated_line_positions(self):
        """Test efficiency improvement with pre-calculated line positions"""
        lines = [
            "speaker1: First line with several words here",
            "speaker2: Second line with different content",
            "",  # Empty line
            "speaker1: Third line after gap",
            "speaker3: Final line to complete test"
        ]
        
        positions = self.chunker._precalculate_line_positions(lines)
        
        # Should start with 0
        self.assertEqual(positions[0], 0)
        
        # Should be monotonically increasing
        for i in range(1, len(positions)):
            self.assertGreaterEqual(positions[i], positions[i-1])
        
        # Final position should equal total words
        total_words = sum(len(line.split()) for line in lines)
        self.assertEqual(positions[-1], total_words)


class TestChunkingPerformance(unittest.TestCase):
    """Performance tests for chunking algorithms"""
    
    def setUp(self):
        self.chunker = SessionChunker(
            max_chunk_size=8000,
            overlap_size=200,
            timeout_seconds=60  # Generous timeout for performance tests
        )
    
    def test_large_session_performance(self):
        """Test performance on large sessions (simulating 34k+ words)"""
        # Create a large realistic session
        large_session_parts = []
        speakers = ["GM/Cinder", "emperor's favorite princess", ".phan10m", "burn baby burn", "bipolarfrenchie"]
        
        # Simulate a large session transcript
        for i in range(1000):  # Create ~20-40k words
            speaker = speakers[i % len(speakers)]
            content = f"This is message {i} with various content and dialogue that would be typical in a gaming session. " * (3 + i % 7)
            large_session_parts.append(f"{speaker}: {content}")
        
        large_text = "\n".join(large_session_parts)
        word_count = len(large_text.split())
        
        print(f"Performance test: Processing {word_count:,} words...")
        
        # Should complete within reasonable time
        start_time = time.time()
        chunks = self.chunker.chunk_session_intelligently(large_text, 1)
        elapsed_time = time.time() - start_time
        
        print(f"Completed in {elapsed_time:.2f}s, created {len(chunks)} chunks")
        
        # Performance assertions
        self.assertLess(elapsed_time, 30.0)  # Should complete in under 30 seconds
        self.assertGreater(len(chunks), 1)   # Should create multiple chunks
        
        # Validate quality
        validation = self.chunker.validate_chunks_before_processing(chunks)
        self.assertTrue(validation['valid'], f"Chunk validation failed: {validation['issues']}")


def run_chunking_tests():
    """Run all chunking tests"""
    # Create test suite
    suite = unittest.TestSuite()
    
    # Add edge case tests
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestChunkingEdgeCases))
    
    # Add performance tests
    suite.addTests(unittest.TestLoader().loadTestsFromTestCase(TestChunkingPerformance))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()


if __name__ == "__main__":
    print("🧪 Running comprehensive chunking tests...")
    success = run_chunking_tests()
    
    if success:
        print("\n✅ All chunking tests passed!")
    else:
        print("\n❌ Some chunking tests failed!")
    
    exit(0 if success else 1)