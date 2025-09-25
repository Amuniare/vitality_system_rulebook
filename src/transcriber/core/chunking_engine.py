"""
Utilities for intelligently chunking large sessions for AI processing
"""
from typing import List, Dict, Tuple, Optional, Callable
import re
import logging
import time

class ChunkingTimeoutError(Exception):
    """Raised when chunking operation exceeds timeout"""
    pass

class ChunkingProgressError(Exception):
    """Raised when chunking fails to make progress"""
    pass

class SessionChunker:
    """Handles intelligent chunking of large session transcripts with progress tracking and timeout protection"""
    
    def __init__(self, max_chunk_size: int = 12000, overlap_size: int = 300, 
                 timeout_seconds: int = 600, progress_callback=None, adaptive_sizing: bool = True):
        self.max_chunk_size = max_chunk_size  # words
        self.overlap_size = overlap_size      # words
        self.timeout_seconds = timeout_seconds  # maximum time for chunking operation
        self.progress_callback = progress_callback  # optional progress reporting callback
        self.adaptive_sizing = adaptive_sizing  # use adaptive chunk sizing
        self.logger = logging.getLogger(__name__)
        
        # Efficiency improvements
        self.min_chunk_efficiency = 0.7  # minimum chunk size as fraction of max
        self.semantic_break_bonus = 1000  # extra words allowed for semantic breaks
    
    def should_chunk_session(self, text: str) -> bool:
        """Determine if a session needs to be chunked"""
        word_count = len(text.split())
        return word_count > self.max_chunk_size
    
    def detect_natural_breaks(self, text: str) -> List[int]:
        """Find natural break points in the session text"""
        lines = text.split('\n')
        break_points = []
        
        # Patterns that indicate natural breaks
        break_patterns = [
            r'---+',  # Horizontal rules
            r'\[Session Break\]',
            r'\[Time Skip\]',
            r'\[Scene Change\]',
            r'GM/Cinder:\s*(?:Okay|All right|So|Well),?\s*(?:let\'s|we\'re|time)',  # GM transition phrases
        ]
        
        for i, line in enumerate(lines):
            line_clean = line.strip()
            
            # Check for explicit break markers
            for pattern in break_patterns:
                if re.search(pattern, line_clean, re.IGNORECASE):
                    break_points.append(i)
                    break
            
            # Look for time gaps (empty lines followed by speaker change)
            if i > 0 and i < len(lines) - 1:
                if not line_clean and lines[i-1].strip() and lines[i+1].strip():
                    # Check if speaker changes after gap
                    prev_speaker = self._extract_speaker(lines[i-1])
                    next_speaker = self._extract_speaker(lines[i+1])
                    if prev_speaker and next_speaker and prev_speaker != next_speaker:
                        break_points.append(i)
        
        return sorted(break_points)
    
    def _extract_speaker(self, line: str) -> str:
        """Extract speaker name from a line"""
        match = re.match(r'^([^:]+):', line.strip())
        return match.group(1).strip() if match else ""
    
    def chunk_session_intelligently(self, text: str, session_number: int) -> List[Dict]:
        """Create optimized chunks with adaptive sizing and semantic awareness"""
        return self._chunk_with_adaptive_sizing(text, session_number)
    
    def _chunk_with_adaptive_sizing(self, text: str, session_number: int) -> List[Dict]:
        """Split session into overlapping chunks with adaptive sizing and efficiency optimization"""
        if not text or not text.strip():
            raise ValueError(f"Cannot chunk empty or whitespace-only text for session {session_number}")
        
        start_time = time.time()
        words = text.split()
        total_words = len(words)
        
        # Calculate optimal chunk size for this session
        optimal_chunk_size = self._calculate_optimal_chunk_size(total_words)
        
        if total_words <= optimal_chunk_size:
            return [{'content': text, 'chunk_id': 0, 'start_context': '', 'end_context': ''}]
        
        self.logger.info(f"Chunking session {session_number}: {total_words} words into ~{optimal_chunk_size} word chunks with {self.timeout_seconds}s timeout")
        
        # Find natural break points and pre-calculate line word positions for efficiency
        natural_breaks = self.detect_natural_breaks(text)
        lines = text.split('\n')
        line_word_positions = self._precalculate_line_positions(lines)
        
        chunks = []
        current_word_pos = 0
        chunk_id = 0
        max_iterations = max(50, (total_words // (optimal_chunk_size - self.overlap_size)) + 10)  # More generous safety limit
        iteration_count = 0
        
        while current_word_pos < total_words and iteration_count < max_iterations:
            iteration_count += 1
            prev_word_pos = current_word_pos  # Track for infinite loop detection
            
            # Calculate chunk boundaries with adaptive sizing
            overlap = self._calculate_adaptive_overlap(chunk_id, total_words)
            chunk_start = max(0, current_word_pos - overlap if chunk_id > 0 else 0)
            chunk_end = min(total_words, current_word_pos + optimal_chunk_size)
            
            # Adjust chunk_end to natural break if possible (with safety checks)
            chunk_end = self._adjust_to_natural_break_safe(chunk_end, natural_breaks, line_word_positions, current_word_pos)
            
            # CRITICAL: Ensure progress is made to prevent infinite loops
            min_advance = max(overlap, optimal_chunk_size // 10)  # More reasonable minimum
            if chunk_end <= current_word_pos + min_advance:
                # Force advancement if natural break adjustment stalls progress
                chunk_end = min(total_words, current_word_pos + optimal_chunk_size // 2)
                self.logger.warning(f"Forced chunk advancement at position {current_word_pos} to prevent stall")
            
            # Extract chunk content
            chunk_words = words[chunk_start:chunk_end]
            chunk_content = ' '.join(chunk_words)
            
            # Generate context for AI processing
            start_context = self._generate_context(words, chunk_start, before=True)
            end_context = self._generate_context(words, chunk_end, before=False)
            
            chunks.append({
                'content': chunk_content,
                'chunk_id': chunk_id,
                'word_range': (chunk_start, chunk_end),
                'start_context': start_context,
                'end_context': end_context,
                'overlap_start': chunk_start < current_word_pos,
                'overlap_end': chunk_end > current_word_pos + optimal_chunk_size,
                'actual_size': len(chunk_words),
                'efficiency_ratio': len(chunk_words) / optimal_chunk_size
            })
            
            # Calculate next position with guaranteed advancement
            next_pos = chunk_end - overlap
            if next_pos <= prev_word_pos:
                # Force reasonable advancement if overlap causes stall
                next_pos = prev_word_pos + max(1, overlap // 2)
                self.logger.warning(f"Forced minimal advancement at chunk {chunk_id} to ensure progress")
            
            current_word_pos = next_pos
            chunk_id += 1
            
            # Progress logging and timeout checking for large sessions
            if chunk_id % 10 == 0 or (chunk_id % 5 == 0 and total_words > 20000):
                elapsed_time = time.time() - start_time
                progress = (current_word_pos / total_words) * 100
                
                # Check for timeout
                if elapsed_time > self.timeout_seconds:
                    error_msg = f"Chunking timeout after {elapsed_time:.1f}s (limit: {self.timeout_seconds}s) at {progress:.1f}% completion"
                    self.logger.error(error_msg)
                    raise ChunkingTimeoutError(error_msg)
                
                # Progress reporting
                est_remaining = (elapsed_time / progress * 100) - elapsed_time if progress > 0 else 0
                self.logger.info(f"Chunking progress: {progress:.1f}% ({current_word_pos}/{total_words} words, {chunk_id} chunks, {elapsed_time:.1f}s elapsed, ~{est_remaining:.1f}s remaining)")
                
                # Call progress callback if provided
                if self.progress_callback:
                    self.progress_callback(progress, chunk_id, current_word_pos, total_words, elapsed_time)
        
        # Final safety and timing checks
        total_time = time.time() - start_time
        
        if iteration_count >= max_iterations:
            error_msg = f"Chunking terminated after {max_iterations} iterations to prevent infinite loop (took {total_time:.2f}s)"
            self.logger.error(error_msg)
            raise ChunkingProgressError(error_msg)
        
        if total_time > self.timeout_seconds:
            error_msg = f"Chunking completed but exceeded timeout: {total_time:.2f}s > {self.timeout_seconds}s"
            self.logger.warning(error_msg)
        
        # Calculate efficiency metrics
        avg_chunk_size = sum(len(chunk['content'].split()) for chunk in chunks) / len(chunks)
        efficiency = avg_chunk_size / optimal_chunk_size
        api_calls_saved = max(0, self._estimate_naive_chunks(total_words) - len(chunks))
        
        self.logger.info(f"Successfully created {len(chunks)} optimized chunks for session {session_number} in {total_time:.2f}s")
        self.logger.info(f"Chunk efficiency: {efficiency:.1%}, estimated API calls saved: {api_calls_saved}")
        
        return chunks
    
    def _calculate_optimal_chunk_size(self, total_words: int) -> int:
        """Calculate optimal chunk size based on session length"""
        if not self.adaptive_sizing:
            return self.max_chunk_size
        
        # Scale chunk size based on total content to reduce API calls
        if total_words <= 15000:
            return self.max_chunk_size
        elif total_words <= 30000:
            return int(self.max_chunk_size * 1.3)  # 30% larger chunks
        elif total_words <= 50000:
            return int(self.max_chunk_size * 1.6)  # 60% larger chunks
        else:
            return int(self.max_chunk_size * 2.0)  # Double size for very large sessions
    
    def _calculate_adaptive_overlap(self, chunk_id: int, total_words: int) -> int:
        """Calculate adaptive overlap based on position and session size"""
        base_overlap = self.overlap_size
        
        # Reduce overlap for middle chunks to increase efficiency
        if chunk_id > 2 and total_words > 20000:
            return int(base_overlap * 0.7)  # 30% less overlap
        
        return base_overlap
    
    def _estimate_naive_chunks(self, total_words: int) -> int:
        """Estimate how many chunks a naive algorithm would create"""
        return max(1, (total_words + self.max_chunk_size - 1) // self.max_chunk_size)
    
    def _precalculate_line_positions(self, lines: List[str]) -> List[int]:
        """Pre-calculate cumulative word positions for each line for efficient lookups"""
        line_word_positions = [0]  # Start with 0 for the first line
        cumulative_words = 0
        
        for line in lines:
            line_words = len(line.split())
            cumulative_words += line_words
            line_word_positions.append(cumulative_words)
        
        return line_word_positions
    
    def _adjust_to_natural_break_safe(self, target_pos: int, break_points: List[int], 
                                     line_word_positions: List[int], current_word_pos: int) -> int:
        """Safely adjust chunk boundary to align with natural breaks"""
        if not break_points or not line_word_positions:
            return target_pos
        
        # Convert word position to line position using pre-calculated positions
        target_line = 0
        for i, word_pos in enumerate(line_word_positions):
            if word_pos >= target_pos:
                target_line = i
                break
        
        # Find closest natural break within reasonable distance
        closest_break = None
        min_distance = float('inf')
        
        for break_point in break_points:
            distance = abs(break_point - target_line)
            if distance < min_distance and distance <= 20:  # Within 20 lines
                min_distance = distance
                closest_break = break_point
        
        if closest_break is not None and closest_break < len(line_word_positions) - 1:
            # Get word position for the natural break
            break_word_pos = line_word_positions[closest_break]
            
            # Safety check: ensure the break doesn't cause progress stall
            # Allow natural breaks as long as they provide some advancement
            min_advance = current_word_pos + self.overlap_size
            if break_word_pos > min_advance and break_word_pos <= target_pos + (self.max_chunk_size // 4):
                return min(break_word_pos, len(line_word_positions) - 1)
        
        return target_pos
    
    def _adjust_to_natural_break(self, target_pos: int, break_points: List[int], lines: List[str], words: List[str]) -> int:
        """Legacy method - kept for backwards compatibility"""
        # Use the new safe method with on-the-fly line position calculation
        line_word_positions = self._precalculate_line_positions(lines)
        return self._adjust_to_natural_break_safe(target_pos, break_points, line_word_positions, 0)
    
    def _generate_context(self, words: List[str], position: int, before: bool = True, context_size: int = 50) -> str:
        """Generate context text around a position"""
        if before:
            start = max(0, position - context_size)
            end = position
        else:
            start = position
            end = min(len(words), position + context_size)
        
        context_words = words[start:end]
        return ' '.join(context_words)
    
    def stitch_chunks_together(self, processed_chunks: List[str]) -> str:
        """Combine processed chunks back into complete session"""
        if not processed_chunks:
            return ""
        
        if len(processed_chunks) == 1:
            return processed_chunks[0]
        
        # Remove overlap regions when stitching
        stitched = processed_chunks[0]
        
        for i in range(1, len(processed_chunks)):
            chunk = processed_chunks[i]
            
            # Find best merge point by looking for common content
            merge_point = self._find_merge_point(stitched, chunk)
            
            if merge_point > 0:
                # Remove overlapping content from the beginning of current chunk
                chunk_lines = chunk.split('\n')
                merged_chunk = '\n'.join(chunk_lines[merge_point:])
                stitched += '\n' + merged_chunk
            else:
                # No overlap found, just concatenate
                stitched += '\n' + chunk
        
        return stitched
    
    def _find_merge_point(self, existing_content: str, new_chunk: str) -> int:
        """Find the best point to merge two chunks by detecting overlap"""
        existing_lines = existing_content.split('\n')
        new_lines = new_chunk.split('\n')
        
        # Look for matching lines in the last part of existing content
        # and the first part of new chunk
        search_range = min(20, len(existing_lines), len(new_lines))
        
        for i in range(search_range):
            for j in range(search_range):
                if (existing_lines[-(i+1)].strip() == new_lines[j].strip() and 
                    len(existing_lines[-(i+1)].strip()) > 10):  # Meaningful line length
                    return j + 1  # Return position after the match
        
        return 0  # No overlap found
    
    def validate_chunk_completeness(self, original: str, stitched: str) -> Dict:
        """Ensure no content lost in chunking/stitching process with enhanced diagnostics"""
        original_words = len(original.split())
        stitched_words = len(stitched.split())
        
        original_speakers = len(set(re.findall(r'^([^:]+):', original, re.MULTILINE)))
        stitched_speakers = len(set(re.findall(r'^([^:]+):', stitched, re.MULTILINE)))
        
        # Calculate loss metrics
        content_loss = max(0, (original_words - stitched_words) / original_words) if original_words > 0 else 0
        speaker_loss = max(0, (original_speakers - stitched_speakers) / original_speakers) if original_speakers > 0 else 0
        
        # Enhanced quality thresholds
        content_acceptable = content_loss < 0.1  # Less than 10% content loss
        speaker_acceptable = speaker_loss < 0.15  # Less than 15% speaker loss (more lenient)
        word_retention_good = (stitched_words / original_words) >= 0.85 if original_words > 0 else True
        
        validation_result = {
            'original_words': original_words,
            'stitched_words': stitched_words,
            'original_speakers': original_speakers,
            'stitched_speakers': stitched_speakers,
            'content_loss': content_loss,
            'speaker_loss': speaker_loss,
            'word_retention': (stitched_words / original_words) if original_words > 0 else 0,
            'speaker_retention': (stitched_speakers / original_speakers) if original_speakers > 0 else 0,
            'content_acceptable': content_acceptable,
            'speaker_acceptable': speaker_acceptable,
            'word_retention_good': word_retention_good,
            'quality_acceptable': content_acceptable and speaker_acceptable and word_retention_good,
            'warnings': []
        }
        
        # Add specific warnings
        if not content_acceptable:
            validation_result['warnings'].append(f"High content loss: {content_loss:.1%}")
        if not speaker_acceptable:
            validation_result['warnings'].append(f"High speaker loss: {speaker_loss:.1%}")
        if not word_retention_good:
            validation_result['warnings'].append(f"Poor word retention: {validation_result['word_retention']:.1%}")
        
        return validation_result
    
    def validate_chunks_before_processing(self, chunks: List[Dict]) -> Dict:
        """Validate chunks before AI processing to catch issues early"""
        if not chunks:
            return {'valid': False, 'error': 'No chunks generated'}
        
        total_chunk_words = sum(len(chunk['content'].split()) for chunk in chunks)
        word_ranges = [chunk['word_range'] for chunk in chunks]
        
        # Check for overlaps and gaps
        issues = []
        
        for i in range(len(word_ranges) - 1):
            current_end = word_ranges[i][1]
            next_start = word_ranges[i + 1][0]
            
            if next_start > current_end:
                gap_size = next_start - current_end
                issues.append(f"Gap of {gap_size} words between chunks {i} and {i+1}")
        
        # Check chunk sizes
        for i, chunk in enumerate(chunks):
            chunk_words = len(chunk['content'].split())
            if chunk_words == 0:
                issues.append(f"Chunk {i} is empty")
            elif chunk_words > self.max_chunk_size * 1.5:  # Allow 50% tolerance
                issues.append(f"Chunk {i} is oversized: {chunk_words} words (max: {self.max_chunk_size})")
        
        return {
            'valid': len(issues) == 0,
            'chunk_count': len(chunks),
            'total_chunk_words': total_chunk_words,
            'issues': issues,
            'warnings': issues  # Compatibility with existing code
        }