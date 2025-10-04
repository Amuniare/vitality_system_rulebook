# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Combat Simulation Engine** for the Vitality System RPG. It performs exhaustive testing of attack builds to analyze game balance, damage optimization, and tactical effectiveness across multiple combat scenarios.

The simulation system generates thousands of valid attack combinations, tests them against various enemy configurations, and produces detailed analytical reports to inform game design decisions.

## Running the Simulation

```bash
# From the simulation directory
python main.py

# This will:
# - Take 2-5 minutes to complete (depending on configuration)
# - Test thousands of build combinations
# - Generate timestamped reports in reports/YYYY-MM-DD_HH-MM-SS/
# - Create separate reports for different archetypes (focused, dual_natured, etc.)
```

**WARNING**: The simulation is computationally intensive. Default configurations test 10,000+ build combinations with multiprocessing enabled.

## Configuration

All simulation parameters are controlled via [config.json](config.json):

### Key Configuration Sections

- **execution_mode**: `"individual"`, `"build"`, or `"both"`
  - `individual`: Test individual upgrades/limits in isolation
  - `build`: Test all valid build combinations
  - `both`: Run both modes (most comprehensive)

- **archetypes**: List of character build types to test
  - `"focused"`: Single-stat specialists (e.g., max Focus, max Power)
  - `"dual_natured"`: Balanced dual-stat builds
  - `"versatile_master"`: Multi-stat generalists

- **tier**: Character power level (1-5). Tier 3 = 60 point budget

- **fight_scenarios**: Different enemy configurations to test against
  - Single boss (1×100 HP)
  - Mixed encounters (1×50 + 5×10 HP)
  - Swarm fights (10×10 HP)

- **simulation_runs**: Number of iterations per test (higher = more accurate but slower)

- **use_threading**: Enable multiprocessing (significant speed improvement)

## Architecture

### Core Data Flow

```
game_data.py (Rules) → build_generator.py → damage_optimizer.py
                                                    ↓
                                      simulation.py (Combat Resolution)
                                                    ↓
                                        reporting/ (Analysis & Output)
```

### Module Responsibilities

**[src/game_data.py](src/game_data.py)** - Source of truth for all game mechanics
- Attack types, upgrades, limits with costs and effects
- Rule validation (mutual exclusions, prerequisites, restrictions)
- Comments include update dates for tracking balance changes

**[src/models.py](src/models.py)** - Core data structures
- `Character`: Stats, avoidance, durability calculations
- `AttackBuild`: Attack type + upgrades + limits combination
- `SimulationConfig`: Configuration data class

**[src/combat.py](src/combat.py)** - Combat mechanics implementation
- Dice rolling (d20, 3d6 with exploding mechanics)
- Attack resolution (accuracy checks, damage calculation)
- Special effects (bleed, brutal, critical hits, AOE)
- Includes dice cache for performance

**[src/build_generator.py](src/build_generator.py)** - Build generation
- Creates all valid upgrade/limit combinations
- Enforces point budgets and rule restrictions
- Generator-based to reduce memory usage
- Supports archetype-specific generation

**[src/damage_optimizer.py](src/damage_optimizer.py)** - Main orchestration
- Multiprocessing coordination
- Build testing across scenarios
- Performance tracking and optimization
- Entry point called by [main.py](main.py)

**[src/simulation.py](src/simulation.py)** - Combat simulation
- Turn-by-turn combat execution
- Scenario management (single/multiple enemies)
- Statistics collection (avg turns, DPT, win rate)

**[src/reporting/](src/reporting/)** - Analysis and output generation
- Generates markdown tables and detailed reports
- Build rankings, upgrade effectiveness, tactical analysis
- Separate reports per archetype and testing mode

## Key Game Mechanics

### Combat Resolution Sequence
1. **Limit activation check** (if unreliable/conditional upgrades)
2. **Accuracy roll**: 1d20 + tier + focus + modifiers vs target avoidance
3. **Damage roll**: 3d6 + tier + power + modifiers - durability
4. **Special effects**: Exploding dice, bleed, critical hits, etc.
5. **Multi-target handling**: AOE attacks roll accuracy per target, shared damage dice

### Character Stats (Tier 3 example: 12 points distributed)
- **Focus**: Accuracy bonus
- **Power**: Damage bonus
- **Mobility**: Avoidance = 10 + tier + mobility
- **Endurance**: Durability = 5 + tier + endurance
- **Tier**: Power level (1-5), affects bonuses and point budget

### Attack Types
- `melee_ac`: +Tier accuracy
- `melee_dg`: +Tier damage
- `ranged`: No bonuses or penalties
- `area`: -Tier accuracy/damage, hits multiple targets
- `direct_damage`: Flat 15-Tier damage, no roll
- `direct_area_damage`: Flat 15-2×Tier damage, AOE

### Cost System
- Tier 3 = 60 point budget
- Area and direct area attacks: upgrades cost double
- Limits provide points back (reduce total cost)

### Critical Mechanics
All builds with these upgrades have critical ranges and effects:
- **critical_accuracy**: Crit on 15-20 (vs natural 20)
- **powerful_critical**: Crit on 15-20, +Tier to damage/conditions on crit
- **double_tap**: Crit on 15-20, make second attack on crit
- **explosive_critical**: Crit on 15-20, hit all enemies in range on crit
- Natural 20 or crit range: increase damage by tier

## Rule Update Process

When game rules change (costs, mechanics, etc.):

1. **Update [RULES.md](RULES.md)** - Document the rule change with date
2. **Update [src/game_data.py](src/game_data.py)** - Modify costs/mechanics (add comment with date)
3. **Update [src/combat.py](src/combat.py)** - Implement mechanic changes if needed
4. **Search codebase** - Verify no old references remain
5. **Run simulation** - Verify mechanics work correctly
6. **Review reports** - Check that changes produce expected balance results

**IMPORTANT**: game_data.py includes update dates in comments (e.g., "COSTS UPDATED 2025-09-29"). When updating costs or mechanics, add similar date comments.

## Report Structure

Reports are generated in `reports/YYYY-MM-DD_HH-MM-SS/` with subdirectories per archetype:

### Individual Testing Reports
- `individual_attack_type_turns_table.md` - Base attack type performance
- `individual_upgrade_limit_table.md` - Individual upgrade/limit effectiveness
- `individual_detailed_combat_logs.md` - Turn-by-turn combat breakdowns
- `individual_builds/` - Separate tables per attack type

### Build Testing Reports (per archetype)
- `build_summary.md` - Top performing builds ranked by DPT
- `builds_turns_table.md` - Performance metrics table
- `enhancement_ranking_report.md` - Upgrade effectiveness analysis
- `upgrade_pairing_analysis.md` - Synergy between upgrades
- `tactical_*.md` - Various tactical analysis reports
- `archetype_*.md` - Archetype-specific analyses
- `top_builds_combat_log.md` - Detailed logs for top builds

## Development Notes

### Performance Optimization
- Uses multiprocessing (configure with `use_threading`)
- Pre-generated dice cache in combat.py for faster rolling
- Generator-based build generation to reduce memory usage
- Chunked processing to enable progress tracking

### Common Development Tasks

**Test a specific upgrade combination:**
```python
# In config.json, set:
{
  "individual_testing": {
    "enabled": true,
    "test_specific_combinations": [
      "critical_accuracy + powerful_critical",
      "power_attack + accurate_attack"
    ]
  }
}
```

**Modify scenarios tested:**
```python
# In config.json, edit fight_scenarios
{
  "fight_scenarios": {
    "enabled": true,
    "scenarios": [
      {"name": "Boss Fight", "num_enemies": 1, "enemy_hp": 100},
      {"name": "Mixed", "enemy_hp_list": [50, 25, 25], ...}
    ]
  }
}
```

**Quick diagnostic test:**
```bash
# Test that game data is loading correctly
python -c "from src.game_data import UPGRADES; print(UPGRADES['power_attack'].cost)"

# Test combat mechanics
python -c "from src.combat import roll_3d6_exploding; print(roll_3d6_exploding())"
```

### Code Structure Patterns

**Build validation** is centralized in RuleValidator class:
- Prerequisite checks
- Mutual exclusion enforcement
- Attack type compatibility
- AOE restrictions

**Special effects** are string-based identifiers checked in combat.py:
- `"flat_15"` - High Impact
- `"explode_5_6"` - Critical Effect
- `"bleed_2_turns"` - Bleed
- `"crit_15_20"` - Critical Accuracy
- See combat.py for complete list

**Multiprocessing compatibility**: Worker processes cannot share logger objects, so detailed logging is disabled in worker functions (test_single_build, test_multi_attack_build).

## Utility Scripts

**[convert_reports_to_markdown.py](convert_reports_to_markdown.py)** - Convert legacy .txt reports to .md format

**[split_rulebook.py](split_rulebook.py)** - Split main rulebook.md into section files
```bash
python split_rulebook.py
# Reads from: frontend/rules/rulebook.md
# Outputs to: simulation/rulebook/*.md
```
