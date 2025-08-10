
## CLAUDE.md (AI Collaboration Guide)

```markdown
# **Discord Transcriber - AI Collaboration Guide**

## **Project Context & Purpose**

The Discord Session Transcriber transforms raw Discord chat logs into structured campaign documentation through a 3-stage processing pipeline. This system converts chaotic conversations into professional timelines, notes, and summaries for tabletop RPG sessions.

## **🏗️ Architectural Principles**

### **Core Design Philosophy**
1. **Separation of Concerns**: Python processing (Stage 2) handles deterministic tasks, AI processing (Stage 3) handles creative/interpretive tasks
2. **Modularity**: Each component has a single, well-defined responsibility  
3. **Performance**: Linear time complexity, streaming processing for memory efficiency
4. **Reliability**: Graceful handling of large sessions with checkpoint/resume capability

### **Critical Constraints**
- **Rate Limits**: Google Gemini free tier allows 1 request/minute maximum
- **Memory**: Must handle 34k+ word sessions without excessive memory usage
- **Content Fidelity**: Maintain >90% content retention and >95% speaker accuracy
- **Progress Tracking**: All long operations must provide real-time feedback

## **📋 AI Collaboration Commands**

### **`--analyze-architecture`**
Review the current modular structure and identify architectural improvements.

**Usage**: `--analyze-architecture [component]`
- `--analyze-architecture chunking` - Review chunking algorithm efficiency
- `--analyze-architecture pipeline` - Assess overall pipeline design
- `--analyze-architecture ai-processing` - Evaluate AI interaction patterns

### **`--fix-performance-issue [component]`**
Diagnose and fix specific performance problems.

**Usage**: `--fix-performance-issue [component]`
- `--fix-performance-issue memory` - Address memory usage issues
- `--fix-performance-issue rate-limits` - Optimize API usage patterns
- `--fix-performance-issue chunking` - Fix chunking algorithm problems

### **`--implement-feature [feature]`**
Add new functionality following architectural principles.

**Usage**: `--implement-feature [feature]`
- `--implement-feature queue-system` - Add background job processing
- `--implement-feature caching` - Implement intelligent caching
- `--implement-feature resume-capability` - Add checkpoint/resume functionality

## **🔧 Module-Specific Guidelines**

### **Core Modules (No AI Dependencies)**
```
src/transcriber/core/
├── session_loader.py      # Raw file loading and validation
├── text_processor.py      # Discord artifact removal  
└── chunking_engine.py     # Session segmentation
```

**Rules**:
- Must work without any API calls
- Focus on deterministic text processing
- Optimize for speed and memory efficiency
- Comprehensive error handling required

### **Processing Modules (Python Only)**
```
src/transcriber/processing/
├── speaker_mapper.py      # Character identification
├── content_analyzer.py    # Metrics and validation
└── python_pipeline.py    # Stage 2 coordination
```

**Rules**:
- No AI API calls allowed
- Use existing campaign context for character mapping
- Generate immediate feedback and validation
- Prepare data optimally for AI processing

### **AI Modules (Rate-Limited)**
```
src/transcriber/ai/
├── template_manager.py    # Centralized prompt management
├── api_client.py          # Gemini API wrapper
└── ai_pipeline.py         # Stage 3 coordination  
```

**Rules**:
- Respect 1 request/minute rate limits
- Implement retry logic with exponential backoff
- Cache expensive operations
- Provide progress feedback for long operations

## **📊 Quality Standards**

### **Code Quality Requirements**
- **File Size Limit**: Maximum 300 lines per file
- **Function Complexity**: Maximum 50 lines per function
- **Error Handling**: All exceptions must be caught and logged appropriately
- **Type Hints**: Required for all public functions
- **Documentation**: Docstrings required for all classes and public methods

### **Performance Requirements**
- **Python Processing**: Must complete in <30 seconds for any session size
- **Memory Usage**: Peak memory <2GB for largest sessions
- **AI Processing**: Must handle rate limits gracefully with queue system
- **Progress Tracking**: Updates at least every 10 seconds for long operations

### **Testing Requirements**
```python
# Required test coverage
def test_small_session():     # <1000 words
def test_medium_session():    # 5000-10000 words  
def test_large_session():     # 30000+ words
def test_edge_cases():        # Empty, malformed, unicode issues
def test_error_recovery():    # API failures, timeouts, interruptions
```

## **🚨 Common Anti-Patterns to Avoid**

### **Architectural Violations**
- ❌ **AI calls in Python processing stages**
- ❌ **Monolithic functions doing multiple responsibilities**  
- ❌ **Synchronous processing of multiple AI requests**
- ❌ **Loading templates/context multiple times**
- ❌ **Missing progress indicators for long operations**

### **Performance Problems**
- ❌ **Processing entire large sessions in memory**
- ❌ **Nested loops in chunking algorithms**
- ❌ **Redundant speaker detection operations**
- ❌ **Missing timeout protection**
- ❌ **No caching for expensive operations**

## **🔄 Development Workflow**

### **Testing New Features**
```bash
# 1. Unit tests for isolated components
python -m pytest src/transcriber/tests/test_[component].py

# 2. Integration test with small session
python test_chunking_simple.py

# 3. Stress test with large session  
python test_ai_processing.py --test-session 1

# 4. Full pipeline validation
python discord_transcriber.py --test-mode --test-session 1
```

### **Performance Validation**
```bash
# Memory profiling
python stats_analyzer.py --memory-profile --session 1

# Timing benchmarks
python stats_analyzer.py --benchmark --sessions "1-5"

# Quality metrics
python diagnostic_utils.py --analyze-quality --session 1
```

## **📝 Implementation Patterns**

### **Error Handling Pattern**
```python
try:
    result = process_component(data)
    validate_result(result)
    return result
except ComponentSpecificError as e:
    logger.warning(f"Component processing failed: {e}")
    return fallback_result()
except Exception as e:
    logger.error(f"Unexpected error in component: {e}")
    raise ProcessingError(f"Component failed: {str(e)}") from e
```

### **Progress Tracking Pattern**
```python
def long_operation(data, progress_callback=None):
    total_items = len(data)
    
    for i, item in enumerate(data):
        # Process item
        result = process_item(item)
        
        # Report progress
        if progress_callback:
            progress = (i + 1) / total_items * 100
            progress_callback(progress, f"Processing item {i+1}/{total_items}")
    
    return results
```

### **Caching Pattern**
```python
@lru_cache(maxsize=128)
def expensive_operation(input_hash):
    """Cache expensive operations by input hash"""
    return compute_expensive_result(input_hash)

def cache_key_generator(session_content):
    """Generate stable cache keys for session content"""
    return hashlib.md5(session_content.encode()).hexdigest()
```

## **🎯 Current Priorities**

### **High Priority**
1. **Queue System**: Implement persistent job queue for AI processing
2. **Resume Capability**: Add checkpoint system for interrupted sessions  
3. **Enhanced Caching**: Cache speaker detection and expensive operations

### **Medium Priority**
1. **Performance Monitoring**: Detailed metrics and benchmarking
2. **Web Interface**: Real-time progress monitoring
3. **Multi-provider Support**: Add alternative AI providers

### **Low Priority**
1. **Advanced Analytics**: Cross-session narrative tracking
2. **Integration Features**: Export to other campaign management tools
3. **UI Enhancements**: Rich text editing and formatting

---

**Remember**: The transcriber's strength lies in its clear separation between fast Python processing and queued AI processing. Maintain this architectural boundary at all costs.
```

These updated markdown files now reflect:

1. **New 3-stage architecture** with clear separation between Python and AI processing
2. **Updated directory structure** with modular organization  
3. **Fixed command structure** that matches the new pipeline design
4. **Resolved architectural problems** from the original monolithic design
5. **Clear development priorities** focusing on production readiness
6. **Comprehensive guidelines** for maintaining the new architecture

The documentation now accurately represents the system you should build, with Python processing handling deterministic tasks quickly and AI processing running separately when rate limits allow.