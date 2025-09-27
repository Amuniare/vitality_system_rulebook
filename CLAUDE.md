# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Vitality System is a comprehensive RPG campaign management system with three main components:

1. **Python Backend** (`src/backend/`) - Roll20 automation for character data extraction and synchronization
2. **Frontend Web Applications** (`frontend/`, `modernApp/`) - Character builders and campaign tools
3. **Combat Simulation Engine** (`simulation/`) - Damage optimization and game balance analysis

The project uses a unified JSON-based character data format across all components, enabling seamless integration between web builders, Roll20, and simulation tools.

## Common Development Commands

### Python Backend (Roll20 Automation)
```bash
# Run all commands from project root directory

# Extract characters from Roll20 to local files
python -m src.backend.main extract

# Upload characters from input directory to Roll20
python -m src.backend.main sync

# Process downloaded character files from browser Downloads folder
python -m src.backend.main process-downloads

# Convert character files using schema system
python -m src.backend.main convert

# Update only scriptcard macros for characters
python -m src.backend.main sync-scriptcards
```

### Frontend Development
```bash
# Serve character builder locally (from project root)
python -m http.server 8080
# Access at: http://localhost:8080/frontend/character-builder/character-builder.html

# ModernApp (v3 character builder)
cd modernApp
npm install
npm run dev
# Access at: http://localhost:5000

# Deploy to Firebase
./deploy.sh    # Linux/Mac
./deploy.ps1   # Windows PowerShell
```

### Combat Simulation
```bash
# Run damage optimization analysis (WARNING: Takes 2+ minutes)
cd simulation
python damage_optimizer.py

# Quick diagnostic test
python -c "from game_data import UPGRADES; print(UPGRADES['power_attack'].cost)"
```

### Testing
```bash
# Frontend tests (Playwright)
cd tests
npm test
npm run test:headed  # Run with visible browser
npm run report       # View test report
```

## High-Level Architecture

### Data Flow Architecture
The project uses a **unified character data schema** that flows between all components:

```
Web Builder (JSON) → Schema Mapper → Roll20 Format → Upload to Roll20
     ↓                                     ↓
Simulation Engine ←────────────── Character Data ←──── Roll20 Extractor
```

### Component Interaction
- **Frontend applications** create character data in standardized JSON format
- **Schema system** (`src/backend/character/schema/`) handles all data transformations
- **Roll20 automation** (`src/backend/api/`) manages browser-based character sync
- **Simulation engine** uses character data for combat optimization analysis

### Key Architectural Principles

1. **Component Independence**: Frontend, backend, and simulation operate independently
2. **Data-Driven Configuration**: Game rules and UI configuration stored in JSON files
3. **Schema-Based Validation**: All character data validated against unified schemas
4. **Event-Driven UI**: Frontend uses component-based architecture with event delegation

## Module-Specific Guidance

### Working with Python Backend (`src/backend/`)
- **Entry Point**: Always run commands via `src.backend.main` from project root
- **Browser Automation**: Uses Playwright for Roll20 interaction, requires manual login
- **Schema System**: Character data transformation handled by `schema/` module
- **Logging**: All operations logged to `logs/automation_YYYYMMDD-HHMMSS.log`

Key files:
- `main.py` - Command router and main entry point
- `character/schema/schema_mapper.py` - Data format conversion
- `api/connection.py` - Roll20 browser automation setup
- `character/updater.py` - Character upload/sync logic

### Working with ModernApp Frontend (`modernApp/`)
- **Architecture**: Component-based system with universal data-driven components
- **Base Class**: All UI components must extend `core/Component.js`
- **State Management**: Centralized state with `StateManager.js`, components receive props
- **Render System**: Uses `RenderQueue.js` for optimized DOM updates

**Critical Rules**:
- Never override `render()`, `init()`, `mount()`, or `destroy()` - only the `on*` versions
- State flows down, events flow up - never access global state directly
- All renders go through RenderQueue - use `this._requestRender()`
- UI configuration lives in JSON data, not code

### Working with Combat Simulation (`simulation/`)
- **Main Entry**: `damage_optimizer.py` (WARNING: 2+ minute runtime)
- **Game Data**: All rules in `game_data.py` - costs, mechanics, turn timing
- **Multi-Enemy System**: Tests builds against 4 scenarios (1×100, 2×50, 4×25, 10×10 HP)
- **Reports**: Generates detailed analysis in multiple txt files

**Rule Update Process**:
1. Update `simulation/CLAUDE.md` (source of truth)
2. Update `game_data.py` (implementation)
3. Update `combat.py` (mechanics logic)
4. Update `CHANGELOG.md` (document changes)
5. Search-verify no old references remain

### Working with Legacy Frontend (`frontend/`)
- **Character Builder**: `frontend/character-builder/` - Original working implementation
- **Campaign Tools**: `frontend/campaigns/` - Campaign-specific interfaces
- **Static Files**: HTML/CSS/JS served via simple HTTP server
- **Data Storage**: Uses localStorage and JSON file export/import

## File Structure Patterns

### Configuration Files
- `config.json` - Simulation parameters and test configurations
- `firebase.json` - Firebase hosting and deployment configuration
- `requirements.txt` - Python dependencies
- `modernApp/package.json` - Node.js dependencies for modern frontend

### Data Directories
- `all_data/characters/input/` - Character files to be uploaded to Roll20
- `all_data/characters/extracted/` - Character files downloaded from Roll20
- `logs/` - Automation and error logs
- `cache/` - Temporary processing files

### Development Support
- `.claude/CLAUDE.md` - Project-specific AI collaboration guidance
- `tests/` - Playwright-based frontend testing framework
- `tools/` - Build and utility scripts
- `docs/` - Project documentation and guides

## Important Development Notes

### Python Backend Requirements
- **Python 3.8+** required
- **Playwright browser** for Roll20 automation
- **Roll20 account** with campaign access
- Must run from project root directory (not from within `src/backend/`)

### Frontend Dependencies
- **Node.js 18+** for ModernApp
- **Firebase CLI** for deployment
- **Modern browser** for testing and development

### Character Data Schema
The project uses a **unified character schema** that supports:
- **Web Builder Format**: Human-readable JSON with nested structures
- **Roll20 Format**: Flattened attribute structure for Roll20 API
- **Simulation Format**: Combat-optimized data for damage analysis

Schema validation and transformation handled automatically by the backend schema system.

### Combat System Integration
All character data can be used with the combat simulation system for:
- **Build Optimization**: Testing attack combinations for effectiveness
- **Balance Analysis**: Comparing upgrade and limit performance
- **Multi-Target Scenarios**: Testing effectiveness against different enemy configurations

The simulation system provides detailed reports on build performance, upgrade effectiveness, and tactical analysis for game balance purposes.