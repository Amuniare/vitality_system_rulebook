# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vitality System RPG campaign management tool with two main components:
1. **Python Roll20 Automation Backend** - Automates character upload/download to/from Roll20 via browser automation
2. **Web Character Builder** - JavaScript-based browser application for creating and editing characters

## Key Commands

### Python Backend (Roll20 Integration)
```bash
# Install dependencies
pip install -r requirements.txt

# Extract all characters from Roll20 to JSON
python main.py extract

# Upload characters from input directory to Roll20
python main.py sync

# Setup Chrome for browser automation (required before running main.py)
# Windows:
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=C:\temp\chrome-debug
# Linux/Mac: 
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

### Web Character Builder
```bash
# No build process - open directly in browser
# File: rulebook/character-builder/character-builder.html

# Or serve locally for development
python -m http.server 8000
# Then open: http://localhost:8000/rulebook/character-builder/
```

## Architecture Overview

### Python Backend (`src/`)
- **main.py** - Entry point with extract/sync commands
- **api/** - Roll20 browser automation using Playwright
  - `connection.py` - Browser connection management
  - `chat_interface.py` - Roll20 chat window automation
  - `commands.py` - Roll20 API command execution
- **character/** - Character data processing
  - `updater.py` - Upload characters to Roll20
  - `api_extractor.py` - Download characters from Roll20
  - `mapper.py` - Convert between JSON formats
- **utils/** - Shared utilities (logging, JSON handling, ScriptCards templates)

### Web Character Builder (`rulebook/character-builder/`)
- **Modular ES6 Architecture** - No build process, uses native ES6 modules
- **app.js** - Main application entry point and initialization
- **core/** - Core game logic and data models
  - `VitalityCharacter.js` - Main character data model with build state tracking
  - `GameDataManager.js` - Centralized data loading from JSON files
  - `TierSystem.js`, `DiceSystem.js` - Game mechanics
- **systems/** - Feature-specific logic (archetypes, traits, abilities, etc.)
- **ui/** - User interface components organized by tabs and sections
- **data/** - Static JSON files with game rules data (archetypes, boons, etc.)

### Character Data Flow
1. **Web Builder** creates characters → saves to localStorage + optional JSON export
2. **Python Backend** reads JSON files from `characters/input/` → uploads to Roll20
3. **Roll20** stores characters → can be extracted back to JSON via `main.py extract`

### Build Order Enforcement
The character builder enforces a specific build order via `buildState` tracking:
1. Archetypes (movement, attack type, etc.) - must be completed first
2. Attributes - unlocked after archetypes
3. Main Pool purchases - unlocked after attributes  
4. Special Attacks - unlocked after main pool
5. Utility purchases - final step

## Data Management

### Character Storage Locations
- `characters/extracted/` - Characters downloaded from Roll20
- `characters/input/` - Characters ready for Roll20 upload
- Web builder localStorage - Browser-based character library

### Game Data Files
All game rules data is stored as JSON in `rulebook/character-builder/data/`:
- Loaded asynchronously by GameDataManager during app initialization
- No build process - direct file editing takes effect on browser refresh
- Files include: archetypes.json, boons_simple.json, features.json, etc.

## Development Notes

### Roll20 Integration Requirements
- Chrome browser with debugging port enabled
- Roll20 campaign with GM access
- API script installation required for full functionality

### Web Builder Development
- Pure JavaScript ES6 modules - no transpilation or bundling
- Character validation happens real-time with detailed error reporting
- Point pool calculations are dynamic based on tier and archetype selections
- Component-based UI architecture with event-driven updates

### Character JSON Structure
Characters use a structured format with:
- Core metadata (name, tier, version)
- Archetypes (movement, attack types, abilities)
- Attributes (combat + utility stats)
- Purchases (boons, traits, flaws, special attacks)
- Calculated stats and validation results

## Development History & Lessons Learned

**IMPORTANT**: Before working on the web character builder, review both:

1. **`docs/rulesForAI.md`** - Critical AI development guidelines including:
   - Code style requirements and restrictions  
   - File modification policies
   - Documentation creation rules
   - UI/UX design principles specific to this project

2. **`docs/web_dev_logs.md`** - Technical implementation insights including:
   - Critical architectural insights and lessons learned
   - Known issues and their solutions
   - Event handling patterns that work vs. those that don't
   - UI consistency guidelines
   - Browser caching issues and debugging strategies
   - Successful implementation patterns to follow
   - Common pitfalls to avoid

The combination of AI rules and development logs provides comprehensive guidance for maintaining code quality, following project conventions, and avoiding both technical and procedural mistakes.