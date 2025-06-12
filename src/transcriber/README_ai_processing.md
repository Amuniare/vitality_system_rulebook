# AI-Enhanced Session Processing System

## Overview

The AI-Enhanced Session Processing System transforms raw Discord transcripts into structured session documentation using Google's Gemini API. The system provides a 5-stage processing pipeline that creates multiple output formats optimized for different use cases.

## Features

- **5-Stage Processing Pipeline**: From raw transcripts to narrative summaries
- **Context-Aware Processing**: Uses campaign and character information for accurate interpretation
- **Batch Processing**: Process multiple sessions with continuity between them
- **Quality Validation**: Automated checks to ensure output meets standards
- **Flexible Configuration**: Customizable prompts and processing stages
- **Rate Limiting**: Built-in API management and retry logic

## Pipeline Stages

### Stage 1: Enhanced Transcription
- **Input**: Raw Discord chat logs
- **Process**: Discord formatting cleanup and initial processing
- **Output**: `session-XX-raw.txt` files in `sessions/raw/`

### Stage 2: AI-Powered Cleanup
- **Input**: Raw session transcripts
- **Process**: Gemini API cleaning with campaign context
- **Output**: `session-XX-cleaned.txt` files in `sessions/cleaned/`
- **Features**:
  - Remove Discord artifacts (timestamps, user IDs, bot messages)
  - Convert abbreviated names to full character names
  - Add context for game mechanics and references
  - Preserve all meaningful dialogue and actions

### Stage 3: Comprehensive Timeline Generation
- **Input**: Cleaned session transcripts
- **Process**: Detailed event breakdown (50-150 bullet points)
- **Output**: `session-XX-timeline.md` files in `sessions/timelines/`
- **Coverage**:
  - Character actions and decisions
  - NPC interactions and dialogue
  - Combat sequences and power usage
  - Plot developments and revelations
  - Game mechanics and environmental details

### Stage 4: Session Notes Generation
- **Input**: Comprehensive timeline
- **Process**: GM-friendly summarization (5-10 key points)
- **Output**: `session-XX-notes.md` files in `sessions/notes/`
- **Focus Areas**:
  - Critical plot points
  - Character development moments
  - Important NPC interactions
  - Unresolved threads and future hooks

### Stage 5: Narrative Summary Generation
- **Input**: Session notes + timeline
- **Process**: 3-paragraph narrative prose
- **Output**: `session-XX-summary.md` files in `sessions/summaries/`
- **Structure**:
  - Paragraph 1: Session opening and main events
  - Paragraph 2: Character interactions and development
  - Paragraph 3: Resolution and setup for next session

## Installation and Setup

### Prerequisites

1. **Python Dependencies**:
   ```bash
   pip install google-generativeai>=0.3.0 python-dotenv>=1.0.0 discord.py
   ```

2. **API Key Configuration**:
   Create a `.env` file in your project root:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Campaign Configuration**:
   The system uses two main configuration files:
   - `campaign_context.json`: Character and world information
   - `processing_templates.json`: AI prompt templates

### Directory Structure

The system creates the following directory structure:
```
rulebook/tools/mutants/sessions/
├── raw/          # Original transcripts
├── cleaned/      # AI-cleaned versions
├── timelines/    # Detailed breakdowns
├── notes/        # Concise bullet points
└── summaries/    # Narrative prose
```

## Usage

### Command Line Interface

The enhanced transcriber supports multiple processing modes:

#### Basic Transcription
```bash
python transcriber.py
```

#### Historical Import
```bash
python transcriber.py --historical
```

#### AI Processing Options

**Process all sessions through full pipeline:**
```bash
python transcriber.py --process-all --no-transcribe
```

**Process specific sessions:**
```bash
python transcriber.py --process-all --sessions "1,3,5-8" --no-transcribe
```

**Stage-specific processing:**
```bash
python transcriber.py --clean-only --sessions "10-12" --no-transcribe
python transcriber.py --timeline-only --sessions "10-12" --no-transcribe
python transcriber.py --notes-only --sessions "10-12" --no-transcribe
python transcriber.py --summary-only --sessions "10-12" --no-transcribe
```

**Combined transcription and processing:**
```bash
python transcriber.py --historical --process-all
```

### Programmatic Usage

```python
from ai_processors import ProcessingPipeline
from transcriber import SessionTranscriber

# Initialize components
transcriber = SessionTranscriber()
pipeline = ProcessingPipeline("path/to/config")

# Process a single session
raw_transcript = "session content here"
results = pipeline.process_session(
    raw_transcript, 
    session_number=5,
    stages=['cleanup', 'timeline', 'notes', 'summary']
)

# Batch process multiple sessions
session_numbers = [1, 2, 3, 4, 5]
batch_results = transcriber.batch_process_sessions(
    session_numbers, 
    stages=['cleanup', 'timeline', 'notes', 'summary']
)
```

## Configuration

### Campaign Context (`campaign_context.json`)

This file provides essential information about your campaign:

```json
{
  "campaign_info": {
    "name": "Your Campaign Name",
    "setting": "Campaign Setting and Time Period",
    "themes": ["Theme 1", "Theme 2"]
  },
  "player_characters": {
    "active": [
      {
        "name": "Character Name",
        "codename": "Hero Name", 
        "powers": "Character abilities",
        "background": "Character background"
      }
    ]
  },
  "major_npcs": {
    "faction_name": [
      {
        "name": "NPC Name",
        "role": "NPC Role",
        "status": "Current status"
      }
    ]
  }
}
```

### Processing Templates (`processing_templates.json`)

Customize AI prompts for each processing stage. Each processor has:
- `system_prompt`: Instructions for the AI model
- `user_prompt_template`: Template with variable placeholders
- `variables`: List of required template variables

## Quality Validation

The system includes automated quality checks:

- **Timeline Validation**: Ensures 50-150 bullet points
- **Notes Validation**: Confirms 5-10 key points
- **Summary Validation**: Verifies 3-paragraph structure
- **Content Validation**: Checks for required elements in each stage

## API Cost Management

### Rate Limiting
- Built-in 1-second minimum delay between API calls
- Exponential backoff on failures
- Automatic retry logic (3 attempts by default)

### Usage Optimization
- Process only changed sessions with `--sessions` flag
- Use stage-specific flags to process only needed outputs
- Monitor API usage through Google Cloud Console

### Cost Estimates
- **Cleanup Stage**: ~1,000-2,000 tokens per session
- **Timeline Stage**: ~2,000-3,000 tokens per session
- **Notes Stage**: ~500-1,000 tokens per session
- **Summary Stage**: ~800-1,200 tokens per session

**Total per session**: ~4,300-7,200 tokens (~$0.02-$0.04 per session at current Gemini pricing)

## Troubleshooting

### Common Issues

#### "google-generativeai not installed" Error
```bash
pip install google-generativeai>=0.3.0
```

#### "API key not found" Error
1. Verify `.env` file exists in the correct location
2. Check that `GEMINI_API_KEY` is properly set
3. Ensure no extra spaces or quotes around the key

#### Empty or Failed Processing Results
1. Check API key permissions and quota
2. Verify input transcript has sufficient content
3. Review character names in campaign context for mismatches
4. Check network connectivity

#### Rate Limiting Issues
1. The system automatically handles rate limits
2. For persistent issues, increase `rate_limit_delay` in `AIProcessor`
3. Consider processing sessions in smaller batches

### Validation Failures

If validation fails, check:
- **Timeline**: Should have 50-150 bullet points starting with '•'
- **Notes**: Should have 5-10 bullet points with category markers
- **Summary**: Should have 3 distinct paragraphs separated by blank lines

### File Permission Issues
Ensure the process has write permissions to:
- `sessions/` directory and all subdirectories
- Configuration files for reading

## Testing

Run the test suite to verify functionality:

```bash
python test_ai_processing.py
```

The test suite covers:
- Configuration loading and validation
- API call simulation and error handling
- Rate limiting and retry logic
- Processing pipeline functionality
- Quality validation

## Integration with Existing Workflow

The system maintains backward compatibility:
- Original session files remain in `sessions/` directory
- New structured files are created in subdirectories
- Existing tools continue to work with legacy format
- AI-processed files provide enhanced documentation

## Future Enhancements

Planned improvements include:
- **Multi-Campaign Support**: Extend beyond single campaign
- **Interactive Queries**: Chat interface for session questions  
- **Character Builder Integration**: Connect with stat tracking
- **Analytics Dashboard**: Campaign statistics and trends
- **Export Options**: PDF, HTML, and other formats
- **Custom Processors**: User-defined processing stages

## Support

For issues, questions, or feature requests:
1. Check this documentation for common solutions
2. Review the test suite for examples
3. Examine configuration files for proper formatting
4. Verify API key and permissions
5. Check system logs for detailed error messages