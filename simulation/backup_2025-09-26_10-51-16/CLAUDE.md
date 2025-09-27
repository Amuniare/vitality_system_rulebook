# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a combat damage optimization simulator for the Vitality System TTRPG. The project focuses on finding optimal attack builds by simulating turn-by-turn combat scenarios and measuring damage per turn (DPT) and turns to kill (TTK) metrics.

**Key Feature**: The simulator now tests builds against **three different enemy configurations** per simulation:
- Fight 1: 1×100 HP Boss (traditional single-target)
- Fight 2: 2×50 HP Enemies (medium group)
- Fight 3: 4×25 HP Enemies (large group)
- Fight 4: 10×10 HP Enemies (swarm)

This provides realistic performance analysis showing how builds perform across different tactical scenarios, with AOE attacks demonstrating clear advantages against multiple enemies.

## Common Development Tasks

### Running the Simulator
IMPORTANT: Running the simulator takes more than 2+ minutes so claude code will timeout.
```bash
python damage_optimizer.py
```

This generates detailed combat logs in `combat_log.txt` showing turn-by-turn combat resolution with dice rolls, damage calculations, and special effects.

### Testing Different Builds
The simulator generates and tests all valid build combinations within the 60-point limit, including:
- All attack types (melee, ranged, area, direct_damage, direct_area_damage)
- Single upgrades, two-upgrade combinations, and three-upgrade combinations
- All slayer upgrade variants
- All limit (unreliable) combinations including unreliable activation checks and turn-based limits
- Mixed upgrade/limit combinations optimized for point efficiency

Each build is tested with 50 simulation runs across 4 different attacker/defender stat configurations. Each simulation run includes all four enemy scenarios (1×100, 2×50, 4×25, 10×10 HP), with the final DPT being the average performance across all scenarios. This comprehensive approach reveals tactical strengths and weaknesses of different build types, limit risk/reward ratios, and multi-target effectiveness.

**For complete game rules and data structures, see [RULES.md](RULES.md)** which contains:
- Attack types and mechanics
- Complete upgrade and limit definitions with costs
- Combat resolution procedures
- Character system specifications

## Current Implementation Status

### Completed Features
- ✅ **Multi-Enemy Combat System**: Four fight scenarios per simulation (1v1, 1v2, 1v4, 1v10)
- ✅ **Enhanced AOE Mechanics**: Shared damage dice, individual accuracy rolls per target
- ✅ **Individual Enemy Tracking**: Separate HP, conditions, and status per enemy
- ✅ **Turn-by-turn combat simulation with detailed logging
- ✅ **All core attack types and upgrade mechanics
- ✅ **Bleed condition tracking with proper replacement rules (per enemy)
- ✅ **Multi-attack handling (Quick Strikes)
- ✅ **Comprehensive dice rolling with explosion mechanics
- ✅ **Individual upgrade and limit performance analysis reports
- ✅ **Limit performance analysis with risk/reward metrics across all scenarios
- ✅ **Turn-based limit activation (Quickdraw, Steady, Patient, Finale)
- ✅ **Unreliable limit DC checks and failure handling

### Known Issues


## File Structure

**Core System:**
- `damage_optimizer.py`: Main simulator orchestrator
- `models.py`: Character, AttackBuild, and configuration data structures
- `simulation.py`: Multi-enemy combat simulation engine
- `combat.py`: Attack resolution and AOE mechanics
- `game_data.py`: All upgrade, limit, and attack type definitions
- `build_generator.py`: Automated build generation and validation
- `reporting.py`: Performance analysis and report generation

**Output Files:**
- 30+ comprehensive analysis reports (see REPORTING.md for complete documentation)
- Core reports: build rankings, enhancement analysis, diagnostic verification
- NEW: Turn-based analysis reports alongside DPT metrics
- NEW: Enhancement comparison between builds and individual performance

**Configuration:**
- `config.json`: Simulation parameters and test case configurations
- `README.md`: Project documentation and rules reference

## Reports Generated

The simulator produces 30+ comprehensive analytical reports covering build performance, enhancement analysis, diagnostic verification, and tactical insights.

**For complete reporting documentation, see [REPORTING.md](REPORTING.md)** which covers:
- All report types and their purposes
- Usage workflows for different objectives
- Configuration options and technical details
- New turn-based analysis features
- Enhancement comparison capabilities

## Multi-Enemy Combat Implementation

### AOE Attack Mechanics
- **Shared Damage Roll**: All AOE targets use the same 3d6 roll for consistency
- **Individual Accuracy**: Each target gets its own accuracy check (as per game rules)
- **Dynamic Targeting**: AOE attacks automatically hit all alive enemies
- **Condition Tracking**: Bleed and other effects tracked separately per enemy

### Enemy Configuration Details
```python
# Fight scenarios per simulation:
scenarios = [
    ("1×100 HP Boss", 1, 100),      # Traditional single-target
    ("2×50 HP Enemies", 2, 50),     # Medium group tactical
    ("4×25 HP Enemies", 4, 25),     # Large group tactical
    ("10×10 HP Enemies", 10, 10)    # Swarm scenario
]
```

### Performance Impact Examples
Real test results showing tactical differences:
- **Melee vs 1×100**: 10.2 DPT | **vs 2×50**: 11.4 DPT | **vs 4×25**: 9.6 DPT | **vs 10×10**: 8.8 DPT
- **Area vs 1×100**: 8.1 DPT | **vs 2×50**: 13.2 DPT | **vs 4×25**: 17.9 DPT | **vs 10×10**: 22.1 DPT
- **Area+Bleed vs 1×100**: 13.9 DPT | **vs 2×50**: 26.3 DPT | **vs 4×25**: 29.4 DPT | **vs 10×10**: 35.2 DPT

## Development Notes

When modifying combat mechanics, ensure changes maintain consistency with the Vitality System rules as documented in RULES.md. The multi-enemy system is designed to be modular - new enemy configurations can be added easily.

**Key Implementation Notes:**
- Single-target attacks automatically target the first alive enemy
- AOE attacks use `make_aoe_attack()` function for proper shared dice mechanics
- Enemy defeat is handled dynamically during combat resolution
- DPT calculations account for total HP pool across all enemies in the scenario

The current architecture supports easy extension - new attack types, upgrades, or limits can be added by updating the respective dictionaries and implementing any special effect logic in the attack resolution functions.

## Rule Update Checklist

When making rule changes (costs, mechanics, turn timing, etc.), ensure ALL locations are updated to maintain consistency:

### 1. Primary Implementation Files (REQUIRED)
- **game_data.py**: Main definitions - UPGRADES and LIMITS dictionaries
- **combat.py**: Combat mechanics logic, turn timing, damage calculations
- **RULES.md**: Authoritative game rules and mechanics specification

### 2. Documentation Files (REQUIRED)
- **CLAUDE.md**: This file - development guidance and implementation notes
- **notes.md**: DO NOT TOUCH THIS FILE

### 3. Files That May Contain References (CHECK)
- **build_generator.py**: Cost calculations, build validation
- **reporting.py**: Performance analysis, cost-effectiveness calculations
- **models.py**: Cost calculation methods
- **simulation.py**: Combat resolution, limit applications
- **damage_optimizer.py**: Main simulation orchestrator

### 4. Systematic Update Process
1. **Update RULES.md first** (authoritative source of truth)
2. **Update game_data.py** (implementation)
3. **Update combat.py** (mechanics logic)
4. **Update CHANGELOG.md** (document changes)
5. **Search-verify remaining files** using grep patterns
6. **Test changes** with quick diagnostic runs

### 5. Common Grep Patterns for Verification
```bash
# Check for old cost values
grep -r "upgrade_name.*old_cost" .

# Check for turn timing references
grep -r "turn.*old_number" .

# Check for mechanic references
grep -r "old_mechanic_name" .
```

### 6. Critical Warning Signs
- Multiple "Changes v1, v2, v3" sections in notes.md
- Conflicting costs/mechanics between files
- Old references in comments or documentation
- Test failures after rule changes

### 7. Example: Complete Update Process
```bash
# 1. Make changes to RULES.md specifications
# 2. Update game_data.py
# 3. Update combat.py logic
# 4. Verify no old values remain:
grep -r "critical_effect.*20" .  # Should return nothing if 10p update complete
grep -r "steady.*turn.*4" .      # Should return nothing if turn 3+ update complete
# 5. Test with quick diagnostic
python -c "from game_data import UPGRADES; print(UPGRADES['critical_effect'].cost)"
```

This systematic approach prevents incomplete updates and ensures consistency across all files.