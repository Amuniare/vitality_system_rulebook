# `src/backend` - Roll20 Automation Backend

## 1. Core Purpose

This backend system provides automated character data extraction and synchronization with Roll20 campaigns. It handles the complete workflow of downloading character data from Roll20, processing it, and uploading modified characters back to the platform.

## 2. Architecture Overview

The backend is organized into three main layers:

- **`api/`**: Browser automation and Roll20 interface layer
- **`character/`**: Business logic for character data processing
- **`utils/`**: Generic utility functions and helpers

## 3. Running the Backend

The backend must be run as a Python module from the project root directory:

```bash
# Extract all characters from Roll20 to data/characters
python -m src.backend.main extract

# Sync characters from characters/input to Roll20
python -m src.backend.main sync

# Process downloaded characters from Downloads folder
python -m src.backend.main process-downloads

# Color macro buttons (Phase 3 feature)
python -m src.backend.main color-macros
```

**Important**: Always run from the project root, not from within the `src/backend` directory.

## 4. Data Flow

### Character Extraction
1. **Input**: Roll20 campaign (via browser automation)
2. **Processing**: Character data extracted using hybrid handout + browser approach
3. **Output**: Individual JSON files saved to `data/characters/`

### Character Synchronization
1. **Input**: JSON files from `characters/input/`
2. **Processing**: Data transformed to Roll20 schema and uploaded
3. **Output**: Characters created/updated in Roll20 campaign

### Downloads Processing
1. **Input**: Recent JSON files from user's Downloads folder
2. **Processing**: Web builder format converted to Roll20 schema
3. **Output**: Processed files moved to `characters/input/`

## 5. Key Components

- **`main.py`**: Entry point and command routing
- **`api_extractor.py`**: Character extraction from Roll20
- **`updater.py`**: Character upload/sync to Roll20
- **`mapper.py`**: Data format transformation
- **`connection.py`**: Browser automation setup
- **`chat_interface.py`**: Roll20 chat interaction

## 6. Requirements

- Python 3.8+
- Playwright browser automation
- Roll20 account with campaign access
- See `requirements.txt` for full dependencies

## 7. Logging

All operations are logged to `logs/automation_YYYYMMDD-HHMMSS.log` with detailed information for debugging and monitoring.