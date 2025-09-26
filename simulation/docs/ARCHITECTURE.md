# Vitality System Simulation - Architecture Documentation

## Overview

This document describes the refactored architecture of the Vitality System combat damage optimization simulator, reorganized for better maintainability and clarity.

## Directory Structure

```
simulation/
├── core/                    # Core simulation engine
│   ├── __init__.py
│   ├── game_rules.py       # Consolidated rule definitions and validation
│   ├── models.py           # Character, AttackBuild, and data classes
│   ├── combat_engine.py    # Combat simulation logic (from simulation.py)
│   └── dice_mechanics.py   # Dice rolling and combat mechanics (from combat.py)
├── data/                   # Game data and configuration
│   ├── __init__.py
│   ├── attacks.py          # Attack type definitions
│   ├── upgrades.py         # Upgrade definitions
│   ├── limits.py           # Limit definitions
│   └── config.py           # Configuration management
├── analysis/               # Analysis and optimization
│   ├── __init__.py
│   ├── optimizer.py        # Main optimization logic (from damage_optimizer.py)
│   ├── build_generator.py  # Build generation logic
│   └── balance_analysis.py # Balance analysis tools
├── reporting/              # Report generation
│   ├── __init__.py
│   ├── base.py             # Base reporting utilities
│   └── legacy_reporting.py # Legacy reporting functions (to be split further)
├── utils/                  # Utilities and helpers
│   ├── __init__.py
│   └── logging_manager.py  # Logging management
├── docs/                   # Documentation
│   ├── RULES.md            # Consolidated game rules reference
│   ├── ARCHITECTURE.md     # This file - system architecture
│   └── CHANGELOG.md        # Version history (to be created)
├── config/                 # Configuration files
│   └── simulation.json     # Simulation configuration
├── reports/                # Output directory for generated reports
├── backup_YYYY-MM-DD_HH-MM-SS/  # Automated backup from refactoring
├── main.py                 # Main entry point
└── test_refactor.py        # Validation tests for refactored structure
```

## Module Responsibilities

### Core Modules

#### `core/game_rules.py`
- **Purpose**: Authoritative source for all game rules and mechanics
- **Contents**:
  - Game mechanics constants (dice, damage formulas, etc.)
  - Attack type rules and restrictions
  - Upgrade and limit definitions with costs and effects
  - Rule validation logic (prerequisites, mutual exclusions, compatibility)
  - Combat scenario definitions
- **Benefits**: Single source of truth for all rule changes

#### `core/models.py`
- **Purpose**: Core data structures for the simulation
- **Contents**:
  - Character class with stat calculations
  - AttackType, Upgrade, Limit data classes
  - AttackBuild class with validation logic
  - SimulationConfig class
- **Dependencies**: Uses game_rules for validation

#### `core/combat_engine.py`
- **Purpose**: Multi-enemy combat simulation logic
- **Contents**: Combat resolution across different enemy scenarios
- **Note**: Renamed from simulation.py

#### `core/dice_mechanics.py`
- **Purpose**: Dice rolling and damage calculation mechanics
- **Contents**: Attack resolution, special effects, condition tracking
- **Note**: Renamed from combat.py

### Data Modules

#### `data/attacks.py`, `data/upgrades.py`, `data/limits.py`
- **Purpose**: Game data definitions separated by type
- **Benefits**: Modular organization, easier to find and update specific data
- **Dependencies**: Import base classes from core.models

#### `data/config.py`
- **Purpose**: Configuration file management
- **Contents**: Load/save functions, default configurations
- **Benefits**: Centralized config handling with validation

### Analysis Modules

#### `analysis/optimizer.py`
- **Purpose**: Main simulation orchestrator
- **Contents**: Build testing, performance analysis, multi-threading coordination
- **Note**: Renamed from damage_optimizer.py

#### `analysis/build_generator.py`
- **Purpose**: Systematic build generation with rule compliance
- **Benefits**: Efficient build enumeration with validation

#### `analysis/balance_analysis.py`
- **Purpose**: Game balance analysis tools
- **Benefits**: Separate module for balance-specific analysis

### Reporting Modules

#### `reporting/base.py`
- **Purpose**: Common reporting utilities and formatting
- **Benefits**: Reusable report generation functions

#### `reporting/legacy_reporting.py`
- **Purpose**: Existing reporting functions (temporary)
- **Note**: Large file that should be split further in future iterations

### Utility Modules

#### `utils/logging_manager.py`
- **Purpose**: Centralized logging management
- **Benefits**: Consistent logging across all modules

## Key Architectural Improvements

### 1. Separation of Concerns
- **Rules**: Centralized in `core/game_rules.py`
- **Data**: Organized by type in `data/` modules
- **Logic**: Combat and analysis logic separated
- **Configuration**: Dedicated config management

### 2. Dependency Management
- Clear import hierarchy: core → data → analysis/reporting
- Reduced circular dependencies
- Explicit path management for imports

### 3. Modularity
- Each module has a single, clear responsibility
- Easy to test individual components
- Simplified adding new features

### 4. Maintainability
- Smaller, focused files instead of monolithic code
- Clear module boundaries
- Comprehensive documentation

## Migration Notes

### Files Moved/Renamed
- `damage_optimizer.py` → `analysis/optimizer.py`
- `simulation.py` → `core/combat_engine.py`
- `combat.py` → `core/dice_mechanics.py`
- `models.py` → `core/models.py`
- `game_data.py` → Split into `data/` modules + `core/game_rules.py`
- `build_generator.py` → `analysis/build_generator.py`
- `balance_analysis.py` → `analysis/balance_analysis.py`
- `logging_manager.py` → `utils/logging_manager.py`
- `reporting.py` → `reporting/legacy_reporting.py` (to be split further)
- `config.json` → `config/simulation.json`

### Rule Consolidation
- Scattered rule definitions from `CLAUDE.md`, `notes.md`, and `game_data.py` consolidated into:
  - `core/game_rules.py` (implementation)
  - `docs/RULES.md` (documentation)

### Backup Strategy
- Complete backup created in `backup_YYYY-MM-DD_HH-MM-SS/`
- Git commit created before refactoring
- All original functionality preserved

## Testing and Validation

### Test Coverage
- Import validation for all modules
- Basic functionality testing
- Rule validation system testing
- Configuration system testing

### Validation Results
```
=== Test Results: 4/4 tests passed ===
SUCCESS: All tests passed! Refactoring structure is working correctly.
```

## Future Improvements

### Next Steps
1. **Split reporting module**: Break down `legacy_reporting.py` into focused modules
2. **Enhanced testing**: Add unit tests for individual modules
3. **Performance optimization**: Profile and optimize hot paths
4. **Documentation**: Add docstrings and type hints consistently
5. **CLI improvements**: Enhanced command-line interface with better error handling

### Potential Enhancements
- **Plugin system**: For adding new attack types or upgrades
- **Web interface**: For easier configuration and result viewing
- **Database integration**: For persistent result storage
- **Parallel processing**: Enhanced multi-core utilization

## Benefits Achieved

1. **Maintainability**: Code is now organized into logical, focused modules
2. **Extensibility**: Easy to add new features without breaking existing code
3. **Testability**: Individual modules can be tested in isolation
4. **Documentation**: Clear, consolidated rule definitions
5. **Performance**: Better organization enables future optimizations
6. **Collaboration**: Multiple developers can work on different modules simultaneously

This refactored architecture provides a solid foundation for continued development and enhancement of the Vitality System combat simulator.