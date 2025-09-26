# Combat Simulator Enhancement Roadmap

## Overview
This roadmap addresses the key issues identified in the combat damage optimization simulator and implements comprehensive improvements for better analysis and reporting. The current monolithic `damage_optimizer.py` file (1400+ lines) needs to be refactored into maintainable modules.

## Phase 0: Code Architecture Refactoring ⚡ CRITICAL

### 0.1 Split Monolithic File into Modules
- **Goal**: Break down the massive 1400+ line file into manageable, focused modules
- **Implementation**:
  - `models/character.py` - Character, AttackType, Upgrade, Limit dataclasses
  - `models/build.py` - AttackBuild class and build validation
  - `combat/engine.py` - Core combat simulation functions
  - `combat/dice.py` - Dice rolling and damage calculation functions
  - `analysis/performance.py` - Individual upgrade/limit performance analysis
  - `analysis/synergy.py` - Upgrade synergy analysis
  - `analysis/reporting.py` - Report generation functions
  - `config/settings.py` - Configuration management
  - `utils/validation.py` - Rule validation system
  - `utils/build_generation.py` - Build generation algorithms
  - `main.py` - Main execution and orchestration
- **Benefits**: Better maintainability, easier testing, clearer separation of concerns

### 0.2 Create Proper Package Structure
- **Goal**: Organize code into logical Python packages
- **Implementation**:
  ```
  simulation/
  ├── __init__.py
  ├── models/
  │   ├── __init__.py
  │   ├── character.py
  │   └── build.py
  ├── combat/
  │   ├── __init__.py
  │   ├── engine.py
  │   └── dice.py
  ├── analysis/
  │   ├── __init__.py
  │   ├── performance.py
  │   ├── synergy.py
  │   └── reporting.py
  ├── config/
  │   ├── __init__.py
  │   └── settings.py
  └── utils/
      ├── __init__.py
      ├── validation.py
      └── build_generation.py
  ```

### 0.3 Implement Proper Import System
- **Goal**: Clean up imports and dependencies between modules
- **Implementation**:
  - Remove circular imports
  - Use relative imports within packages
  - Create clear public APIs for each module
  - Add `__all__` declarations where appropriate

### 0.4 Detailed Refactoring Plan

#### Step 1: Create Package Structure
```bash
mkdir -p simulation/{models,combat,analysis,config,utils}
touch simulation/__init__.py
touch simulation/{models,combat,analysis,config,utils}/__init__.py
```

#### Step 2: Extract Core Models (lines 13-104)
- **File**: `models/character.py`
- **Content**: Character, AttackType dataclasses and properties
- **File**: `models/upgrade.py`
- **Content**: Upgrade, Limit dataclasses and all upgrade/limit definitions
- **File**: `models/build.py`
- **Content**: AttackBuild class and build creation logic

#### Step 3: Extract Combat System (lines 208-661)
- **File**: `combat/dice.py`
- **Content**: `roll_d20()`, `roll_3d6_exploding()`, `roll_3d6_exploding_5_6()`
- **File**: `combat/engine.py`
- **Content**: `make_attack()`, `make_single_attack_damage()`, `simulate_combat_verbose()`

#### Step 4: Extract Validation System (lines 132-207)
- **File**: `utils/validation.py`
- **Content**: `RuleValidator` class and all validation logic

#### Step 5: Extract Build Generation (lines 662-849)
- **File**: `utils/build_generation.py`
- **Content**: `BuildGenerator` class and `generate_valid_builds()` function

#### Step 6: Extract Configuration System (lines 851-952)
- **File**: `config/settings.py`
- **Content**: `SimulationConfig`, `load_config()`, `save_config()` functions

#### Step 7: Extract Analysis Systems (lines 1040-1410)
- **File**: `analysis/performance.py`
- **Content**: Individual upgrade/limit performance analysis functions
- **File**: `analysis/synergy.py`
- **Content**: Upgrade synergy analysis functions (to be implemented)
- **File**: `analysis/reporting.py`
- **Content**: All report generation and writing functions

#### Step 8: Create Main Orchestrator
- **File**: `main.py`
- **Content**: Main execution logic, imports all modules, orchestrates analysis
- **Size**: ~200 lines (down from 1400+)

#### Step 9: Update Dependencies
- Each module declares its dependencies clearly
- Remove tight coupling between modules
- Use dependency injection for shared resources (config, test cases)

#### Step 10: Add Module Tests
- **File**: `tests/test_models.py` - Test character stats and build validation
- **File**: `tests/test_combat.py` - Test dice rolling and combat simulation
- **File**: `tests/test_analysis.py` - Test performance analysis functions
- **File**: `tests/test_integration.py` - End-to-end testing

### 0.5 Migration Strategy
- **Phase 0A**: Create new package structure alongside existing file
- **Phase 0B**: Extract models and basic functions (non-breaking changes)
- **Phase 0C**: Extract combat and analysis systems
- **Phase 0D**: Update main execution flow and remove old file
- **Phase 0E**: Add comprehensive tests for all modules

## Phase 1: Individual Upgrade Performance Analysis System

### 1.1 Create Dedicated Individual Upgrade Summary Report
- **Goal**: Generate a comprehensive report showing each upgrade's performance in isolation
- **Implementation**:
  - Create `generate_upgrade_performance_report()` function
  - Test each upgrade individually against base attacks of same type
  - Calculate improvement percentages (DPT increase, TTK decrease)
  - Rank upgrades by cost-effectiveness (improvement per point cost)
  - Include statistical significance testing across multiple runs
- **Output**: `upgrade_performance_summary.txt` with rankings and detailed comparisons

### 1.2 Individual Limit Performance Analysis
- **Goal**: Analyze each limit's effectiveness separately
- **Implementation**:
  - Test each unreliable/turn-based limit individually
  - Calculate success rates and average performance improvements
  - Compare risk/reward ratios for different DC levels
  - Analyze turn-based limit effectiveness across combat durations
- **Output**: `limit_performance_summary.txt` with risk/reward analysis

### 1.3 Upgrade Synergy Analysis Matrix
- **Goal**: Identify which upgrades work best together
- **Implementation**:
  - Test all valid 2-upgrade combinations
  - Calculate synergy scores (actual performance vs. sum of individual performances)
  - Create synergy matrix showing positive/negative interactions
  - Identify optimal upgrade pairs for different strategies
- **Output**: `upgrade_synergy_matrix.txt` with combination rankings

## Phase 2: Configuration System Fixes

### 2.1 Fix Attack Type Filtering
- **Goal**: Ensure config.json attack_types setting is properly respected
- **Implementation**:
  - Modify `generate_valid_builds()` to use `config.attack_types` instead of hardcoded list
  - Update `BuildGenerator.generate_all_valid_builds()` to respect config filters
  - Add validation that selected attack types are valid
  - Ensure individual testing also respects attack type filters
- **Files**: `damage_optimizer.py` lines 769, 846, 998-1004

### 2.2 Enhanced Configuration Options
- **Goal**: Add more granular control over simulation parameters
- **Implementation**:
  - Add `upgrade_filter` option to test only specific upgrades
  - Add `limit_filter` option to test only specific limits
  - Add `max_combination_size` to control build complexity
  - Add `focus_builds` list for targeted testing of specific builds
- **Files**: `SimulationConfig` class enhancement

## Phase 3: Extensive Combat Logging System

### 3.1 Detailed Damage Calculation Logging
- **Goal**: Provide granular breakdown of every damage calculation step
- **Implementation**:
  - Expand `make_attack()` logging to show each modifier source
  - Add before/after comparisons for each upgrade effect
  - Log probability calculations for critical hits, slayer bonuses
  - Show exact dice roll sequences and explosion chains
  - Include durability reduction explanations
- **Enhancement**: Current logging at lines 494-527

### 3.2 Turn-by-Turn Combat State Logging
- **Goal**: Track complete combat state evolution
- **Implementation**:
  - Log HP changes, condition applications/removals
  - Track bleed stack management with detailed timing
  - Show turn-based limit activation/failure explanations
  - Log multi-attack sequence breakdowns
  - Record finishing blow threshold checks
- **Enhancement**: `simulate_combat_verbose()` at lines 598-661

### 3.3 Statistical Analysis Logging
- **Goal**: Provide comprehensive statistical breakdowns
- **Implementation**:
  - Log variance analysis across simulation runs
  - Track success/failure rates for unreliable effects
  - Calculate confidence intervals for DPT/TTK estimates
  - Show distribution histograms for combat duration
  - Include outlier analysis and explanation
- **Output**: Enhanced summary files with statistical rigor

## Phase 4: Performance Optimization & Build Strategy

### 4.1 Intelligent Build Generation
- **Goal**: Generate strategic build sets instead of brute force combinations
- **Implementation**:
  - Create build archetypes (burst, sustained, utility, etc.)
  - Implement heuristic filtering to skip obviously inferior builds
  - Add progressive complexity testing (1 upgrade → 2 upgrades → 3 upgrades)
  - Focus on promising upgrade combinations based on synergy analysis
- **Files**: `BuildGenerator` class overhaul

### 4.2 Parallel Processing Implementation
- **Goal**: Reduce simulation runtime through parallelization
- **Implementation**:
  - Implement multiprocessing for independent simulations
  - Parallelize individual upgrade testing
  - Add progress reporting during long-running tests
  - Include estimated time remaining calculations
- **Dependencies**: Add multiprocessing support

## Phase 5: Advanced Analysis Features

### 5.1 Scenario-Specific Build Recommendations
- **Goal**: Recommend optimal builds for different combat scenarios
- **Implementation**:
  - Analyze build performance across different defender configurations
  - Identify builds that excel against high-avoidance vs high-durability targets
  - Create recommendation engine based on expected opposition
  - Generate "meta" analysis of build ecosystem
- **Output**: `build_recommendations.txt` with scenario-based advice

### 5.2 Interactive Configuration Generator
- **Goal**: Help users create custom simulation configurations
- **Implementation**:
  - Command-line interface for config generation
  - Preset configurations for common analysis types
  - Validation and suggestion system for config parameters
  - Export/import system for shared configurations
- **Files**: New `config_generator.py` utility

## Implementation Priority

### CRITICAL Priority (Must Fix First) ⚡
1. **Phase 7.1** - Fix Slayer Upgrade Logic Bug (using current HP instead of max HP)
2. **Phase 7.2** - Fix Powerful Condition Critical Compatibility Bug (requires Critical Accuracy)
3. **Phase 7.3** - Enhance Diagnostic Reports (add scenarios and limits coverage)
4. **Phase 0.1-0.3** - Code Architecture Refactoring (addresses technical debt)
5. **Phase 2.1** - Fix Attack Type Filtering (critical bug fix)

### High Priority (Core Features)
3. **Phase 1.1** ✅ - Individual Upgrade Summary Report (COMPLETED)
4. **Phase 1.2** ✅ - Limit Performance Analysis (COMPLETED)
5. **Phase 6** ✅ - Multi-Enemy Combat System (COMPLETED)
6. **Phase 3.1** - Enhanced Combat Logging (core requested feature)
7. **Phase 2.2** - Enhanced Configuration Options

### Medium Priority
8. **Phase 1.3** - Upgrade Synergy Analysis Matrix
9. **Phase 3.2** - Turn-by-Turn State Logging
10. **Phase 4.1** - Intelligent Build Generation
11. **Phase 3.3** - Statistical Analysis Logging

### Low Priority (Future Enhancements)
12. **Phase 4.2** - Parallel Processing
13. **Phase 5.1** - Scenario-Specific Recommendations
14. **Phase 5.2** - Interactive Configuration

## Phase 7: Critical Bug Fixes ⚡ URGENT

### 7.1 Fix Slayer Upgrade Logic Bug
- **Goal**: Fix slayer upgrades to check against max HP instead of current HP
- **Problem**: Slayer upgrades (Minion/Captain/Elite/Boss Slayer) are incorrectly checking against current HP instead of max HP
- **Evidence**: Performance analysis shows identical rankings for all slayer variants, suggesting logic error
- **Implementation**:
  - Review slayer upgrade logic in combat resolution
  - Change HP threshold checks from `target.current_hp` to `target.max_hp`
  - Verify slayer bonuses apply correctly at combat start
  - Update all slayer upgrade tests to use max HP thresholds
- **Files**: Combat resolution functions, slayer upgrade definitions
- **Impact**: This bug significantly affects slayer upgrade effectiveness rankings

### 7.2 Fix Powerful Condition Critical Compatibility Bug
- **Goal**: Fix Powerful Condition Critical to require Critical Accuracy upgrade
- **Problem**: Powerful Condition Critical is appearing in builds without Critical Accuracy
- **Evidence**: Diagnostic shows "Making melee attack with ['double_tap']" instead of required critical accuracy
- **Implementation**:
  - Update Powerful Condition Critical prerequisites to require Critical Accuracy
  - Add validation to prevent builds with Powerful Condition Critical without Critical Accuracy
  - Review all upgrade compatibility checks for similar issues
  - Update build generation to respect upgrade prerequisites
- **Files**: Upgrade definition validation, build generation logic
- **Impact**: This bug allows invalid builds that shouldn't be possible per game rules

### 7.3 Enhance Diagnostic Reports Structure
- **Goal**: Improve diagnostic report organization and coverage
- **Problem**: Current diagnostic reports need better organization and coverage of scenarios/limits
- **Implementation**:
  - **Phase 7.3a**: Verify diagnostic reports include all four enemy scenarios (1×100, 2×50, 4×25, 10x10)
  - **Phase 7.3b**: Verify diagnostic reports include all limit types (unreliable and turn-based)
  - **Phase 7.3c**: Create diagnostic subfolder structure:
    ```
    diagnostics/
    ├── base_attacks/
    │   ├── melee_diagnostic.txt
    │   ├── ranged_diagnostic.txt
    │   ├── area_diagnostic.txt
    │   ├── direct_damage_diagnostic.txt
    │   └── direct_area_damage_diagnostic.txt
    ├── upgrades/
    │   ├── power_attack_diagnostic.txt
    │   ├── high_impact_diagnostic.txt
    │   ├── critical_effect_diagnostic.txt
    │   └── [one file per upgrade...]
    ├── limits/
    │   ├── unreliable_1_diagnostic.txt
    │   ├── unreliable_2_diagnostic.txt
    │   ├── unreliable_3_diagnostic.txt
    │   ├── quickdraw_diagnostic.txt
    │   └── [one file per limit...]
    └── combinations/
        ├── critical_synergy_diagnostic.txt
        ├── multi_attack_synergy_diagnostic.txt
        └── [key combination diagnostics...]
    ```
  - **Phase 7.3d**: Each diagnostic file should contain:
    - Detailed mechanic explanation
    - Combat resolution examples across all scenarios
    - Dice roll sequences and calculations
    - Performance comparison with/without the upgrade/limit
- **Benefits**: Easier debugging, better understanding of individual mechanics

### 7.4 Performance Analysis Accuracy Issues
- **Goal**: Investigate anomalies in upgrade performance rankings
- **Problem**: Some upgrades showing suspiciously similar or low performance improvements
- **Evidence**: Multiple finishing blow ranks showing 0.0 or 0.1 DPT improvements
- **Implementation**:
  - Review finishing blow logic for correct threshold calculations
  - Verify DPT calculations account for instant defeats properly
  - Check for floating-point precision issues in performance calculations
  - Add validation that performance improvements make logical sense
- **Files**: Performance analysis functions, finishing blow upgrade logic
- **Impact**: Ensures accurate build recommendations and upgrade rankings

## Phase 6: Multi-Enemy Combat System ✅ COMPLETED

### 6.1 Multiple Enemy Configurations
- **Goal**: Test builds against different enemy group compositions for realistic tactical analysis
- **Implementation**: ✅ COMPLETED
  - Fight 1: 1×100 HP Boss (traditional single-target scenario)
  - Fight 2: 2×50 HP Enemies (medium group scenario)
  - Fight 3: 4×25 HP Enemies (large group scenario)
  - Each simulation averages DPT across all three fights
  - Individual enemy HP tracking with separate condition management
- **Benefits**: Provides realistic performance metrics for AOE vs single-target builds

### 6.2 Enhanced AOE Attack Mechanics
- **Goal**: Implement proper AOE mechanics with shared damage dice but individual accuracy rolls
- **Implementation**: ✅ COMPLETED
  - Shared damage dice rolls across all AOE targets (as per game rules)
  - Individual accuracy checks for each target
  - Separate bleed condition tracking per enemy
  - Proper multi-target combat resolution logging
- **Files**: `combat.py`, `simulation.py` - Enhanced `make_aoe_attack()` function

### 6.3 Dynamic Target Management
- **Goal**: Handle enemies being defeated during combat and adjust targeting
- **Implementation**: ✅ COMPLETED
  - Single-target attacks automatically target first alive enemy
  - AOE attacks hit all alive enemies dynamically
  - Proper combat termination when all enemies defeated
  - Individual enemy status tracking and logging
- **Benefits**: Accurate simulation of multi-enemy tactical scenarios

## Current Status
- ✅ **Phase 2.1** - Attack type filtering bug fixed
- ✅ **Phase 1.1** - Upgrade performance analysis implemented
- ✅ **Phase 1.2** - Limit performance analysis implemented
- ✅ **Phase 6** - Multi-enemy combat system implemented
- 🚨 **Phase 7.1** - CRITICAL: Slayer upgrade logic bug (using current HP instead of max HP)
- 🚨 **Phase 7.2** - CRITICAL: Powerful Condition Critical compatibility bug (missing Critical Accuracy requirement)
- 🚨 **Phase 7.3** - URGENT: Diagnostic reports need enhanced structure and coverage
- 🚨 **Phase 7.4** - URGENT: Performance analysis accuracy issues (finishing blow anomalies)
- 🔄 **Phase 0** - Architecture refactoring needed (blocking further development)
- 🔄 **Phase 1.3** - Synergy analysis partially implemented

## Success Metrics

### Functionality
- [ ] Individual upgrade reports show clear performance rankings
- [ ] Config attack type filtering works correctly
- [ ] Combat logs provide detailed step-by-step explanations
- [ ] Simulation runtime reduced by at least 50%

### Usability
- [ ] Reports are easy to read and interpret
- [ ] Configuration system is intuitive and well-documented
- [ ] Logging level can be adjusted for different use cases
- [ ] Build recommendations are actionable and accurate

### Accuracy
- [ ] Statistical analysis includes confidence intervals
- [ ] Upgrade synergies are correctly identified
- [ ] Build rankings are consistent across multiple runs
- [ ] Performance metrics match manual calculations



# Other

- need the build summary report to show the top 50 builds
- need another report produce, which lists every upgrade and limit and ranks them by their average build rank, giving their avg ranking, then 50% would be the middle, so if 40k attacks, and the avg is 20k, then that's 50%, 10k would be 75%
- also, need both of to have sections which do the same for attack types
