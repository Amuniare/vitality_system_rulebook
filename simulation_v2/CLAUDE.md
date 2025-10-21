# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Simulation V2 is a streamlined combat simulation engine for the Vitality System RPG. It generates comprehensive analysis reports on attack build performance across multiple combat scenarios. This is a focused rewrite that imports core game logic from the parent `/simulation` directory while providing cleaner configuration and reporting.

## CRITICAL: Rule Update Workflow

**When the user asks to "update rules", you MUST update ALL THREE files together:**

1. **RULES.md** - Source of truth documentation for game mechanics
2. **src/game_data.py** - Implementation of all game rules (upgrades, limits, costs, mechanics)
3. **CHANGELOG.md** - Documentation of what changed and why

**RULES.md and game_data.py must ALWAYS be in complete alignment.**

### Rule Update Process

When updating game rules, follow this exact workflow:

1. **Update RULES.md** - Document the rule change in human-readable format
2. **Update src/game_data.py** - Implement the rule change in code (UPGRADES, LIMITS, RuleValidator, etc.)
3. **Update CHANGELOG.md** - Record the change with date and rationale
4. **Verify alignment** - Search the codebase for old references and ensure consistency

**Never update just one or two of these files. All three must be updated together to maintain system integrity.**

## Common Development Commands

```bash
# Run simulation with default config (tier 4, dual_natured archetype)
python main.py

# Run with specific configuration file
python main.py configs/tier3_focused.json

# Enable GPU acceleration (recommended for AMD/NVIDIA/Intel GPUs)
pip install torch-directml
# Then set "use_gpu": true in config.json

# Results saved to: reports/{timestamp}/{archetype}/
```

## High-Level Architecture

### Code Organization Pattern

The codebase follows a **modular import strategy** - core game mechanics are imported from the parent simulation engine, while V2 provides simplified orchestration:

- **Core game logic** (`src/`) - Imported from `../simulation/src/`
  - `game_data.py` - Attack types, upgrades, limits, validation rules
  - `models.py` - Data classes (Character, AttackBuild, MultiAttackBuild)
  - `combat.py` - Attack resolution, dice rolling, condition tracking
  - `simulation.py` - Combat simulation loop
  - `build_generator.py` - Build combination generation algorithms

- **V2 orchestration layer** (`core/`) - Simulation V2 specific
  - `config.py` - Configuration loader with per-archetype point budgets
  - `individual_tester.py` - Tests each enhancement in isolation
  - `build_tester.py` - Tests all valid build combinations
  - `reporter.py` - Generates ranking and cost analysis reports

- **GPU acceleration** (`src/combat_gpu.py`) - Optional GPU acceleration via DirectML
  - Accelerated dice cache generation (10K+ rolls)
  - DirectML support for AMD, NVIDIA, Intel GPUs on Windows
  - Automatic fallback to CPU if GPU unavailable

- **Entry point** (`main.py`) - Coordinates the full pipeline

### Data Flow Architecture

1. **Configuration Loading** - Parse JSON config from `configs/` directory
2. **Per-Archetype Processing Loop**:
   - Individual enhancement testing → Generate combat logs for each upgrade/limit
   - Build generation → Generate all valid builds within point budget
   - Build testing → Simulate each build across all scenarios
   - Top 50 logging → Generate detailed combat logs for best builds
   - Report generation → Calculate statistics and write markdown reports
3. **Output** - Timestamped reports in `reports/{timestamp}/{archetype}/`

### Archetype System

Characters can specialize in different attack patterns with varying point budgets:

- **Focused** (Tier 3: 2pt, Tier 4: 4pt, Tier 5: 6pt) - Single specialized attack
- **Dual Natured** (Tier 3: 4pt, Tier 4: 6pt, Tier 5: 8pt) - Two complementary attacks
- **Versatile Master** (Tier 3: 6pt, Tier 4: 8pt, Tier 5: 10pt) - Three diverse attacks

Point budgets are per-attack, with MultiAttackBuilds intelligently selecting the optimal attack for each scenario.

### Combat Simulation Mechanics

Combat is simulated turn-by-turn with full tracking of:

- **Attack resolution** - d20 accuracy vs avoidance, 3d6 exploding damage vs durability
- **Special effects** - Critical hits, bleeding, conditional damage bonuses
- **Limit activation** - Turn timing, HP thresholds, charge tracking
- **Multi-target logic** - Area attacks, target prioritization, overkill handling
- **Performance optimization** - Pre-generated dice cache (10,000 rolls)

Each build is tested across multiple scenarios (boss fights, mixed groups, swarms) with configurable simulation runs for statistical reliability.

## Configuration System

Config files in `configs/` define simulation parameters:

### Critical Configuration Fields

- **tier** (1-5) - Character power level, determines point budgets
- **archetypes** (array) - Which specializations to test (`"focused"`, `"dual_natured"`, `"versatile_master"`)
- **simulation_runs** (int) - Iterations per test (higher = more accurate, slower)
- **use_threading** (bool) - Enable multiprocessing (WARNING: unreliable on Windows)
- **build_chunk_size** (int) - Builds per chunk when threading enabled
- **character_config** - Attacker/defender stats: `[focus, power, mobility, endurance, tier]`
- **scenarios** (array) - Combat situations to test

### Scenario Types

Scenarios can be homogeneous or mixed enemy groups:

```json
{"name": "Boss", "num_enemies": 1, "enemy_hp": 100}
{"name": "Mixed", "enemy_hp_list": [50, 25, 25]}
```

### Progressive Elimination

Progressive elimination is a performance optimization that tests builds in multiple rounds with increasing simulation counts, eliminating bottom performers after each round. This dramatically reduces testing time by avoiding expensive full simulations on clearly inferior builds.

**Configuration:**
```json
"progressive_elimination": {
  "enabled": true,
  "rounds": [
    {"simulation_runs": 1, "keep_percent": 0.40},   // Round 1: 1 run, keep top 40%
    {"simulation_runs": 3, "keep_percent": 0.50},   // Round 2: 3 runs, keep top 50%
    {"simulation_runs": -1, "keep_percent": 1.0}    // Round 3: full runs, keep all
  ]
}
```

**How it works:**
1. **Round 1**: Test all builds with 1 simulation run across all scenarios → eliminate bottom 60%
2. **Round 2**: Test remaining 40% with 3 simulation runs → eliminate bottom 50%
3. **Round 3**: Test remaining 20% with full `simulation_runs` (e.g., 10) → final results

**Performance impact:**
- Without: 20,000 builds × 10 runs × 4 scenarios = **800,000 simulations**
- With: (20,000×1×4) + (8,000×3×4) + (4,000×10×4) = **336,000 simulations** (58% reduction)

**Benefits:**
- Applies to all archetypes (focused, dual_natured, versatile_master)
- Maintains result quality (gradually increases confidence)
- Configurable aggressiveness via rounds and percentages
- Each round tests across ALL scenarios (balanced elimination)

**Notes:**
- Use `-1` for `simulation_runs` in final round to use `config.simulation_runs`
- Recommended for large build sets (>5,000 builds)
- Can be disabled by setting `"enabled": false`

## Report Architecture

### Generated Report Types

1. **Individual Enhancement Combat Logs** (`combat_logs/{enhancement}_combat.txt`)
   - Turn-by-turn simulation for each upgrade/limit tested alone
   - Shows dice rolls, damage calculations, special effect triggers
   - Uses first configured scenario

2. **Top 50 Build Combat Logs** (`top50_logs/rank{N}_*.txt`)
   - Detailed mechanics for best performing builds
   - Tests across all scenarios
   - Shows build description, average turns, full combat sequence

3. **Enhancement Ranking Report** (`enhancement_ranking_{archetype}.md`)
   - Overall performance ranking for all upgrades/limits
   - Columns: Rank, Cost, Avg Turns, vs Median, Top10%/Top50% metrics
   - Attack type breakdown (melee_ac, ranged, area, etc.)
   - Median rank position across all builds containing the enhancement

4. **Cost Analysis Report** (`cost_analysis_{archetype}.md`)
   - Enhancements grouped by point cost (1pt, 2pt, 3pt, etc.)
   - Efficiency metrics: (performance / cost)
   - Identifies best value enhancements at each cost tier

### Key Metrics Explained

- **Avg Turns** - Mean turns to kill across all builds using this enhancement
- **vs Median** - Deviation from median (negative = better than median)
- **Top10% Turns** - Median turns for top 10% of builds with this enhancement
- **Top10% Eff** - (Top10% vs Median) / cost - efficiency in best builds
- **Top50% Eff** - (Top50% vs Median) / cost - efficiency in above-average builds
- **Med Rank** - Median rank position of builds containing this enhancement

## Important Development Notes

### Import Path Requirements

**CRITICAL**: This project imports from `../simulation/src/` - you must run from a directory containing both `simulation/` and `simulation_v2/` folders. If imports fail, verify parent directory structure.

### Performance Considerations

- **Tier 4 dual_natured**: ~300,000+ builds to test
- **Expected runtime**: 2-10 minutes depending on tier and simulation_runs
- **Progressive elimination**: Enabled by default, reduces testing time by 40-60%
- **Reduce simulation_runs** to 5 for faster testing (10+ for production analysis)
- **Threading disabled by default** - multiprocessing has Windows compatibility issues
- **GPU acceleration available** - Install `torch-directml` for 20x faster dice generation (see `GPU_SETUP.md`)

**Optimization recommendations:**
- Use progressive elimination for archetypes with >5,000 builds
- For versatile_master, pruning + progressive elimination work together
- Enable GPU acceleration for maximum performance
- Disable threading on Windows to avoid stability issues

### Build Generation Algorithm

Builds are generated exhaustively within point budget constraints:

1. For each attack type (melee_ac, ranged, area, etc.)
2. Generate upgrade combinations (0-3 upgrades max)
3. Validate against mutual exclusion rules (e.g., can't combine double_tap + powerful_critical)
4. For each valid upgrade set, generate all limit combinations
5. Filter by total cost <= max_points_per_attack
6. Validate complete build against all game rules

Multi-attack builds are generated by combining individual AttackBuilds based on archetype requirements.

### Rule Validation System

The RuleValidator in `game_data.py` enforces:

- **Mutual exclusions** - Incompatible upgrade pairs (critical effects, unreliable levels)
- **Attack type restrictions** - Some upgrades only work with specific attack types
- **AOE cost multiplier** - Area/direct_area attacks pay 2x for upgrades and limits
- **Prerequisite chains** - Some upgrades require others first

## Differences from Original Simulation

### Removed Features
- Individual testing reports (redundant with build testing)
- Tactical analysis reports
- Archetype-specific scenario reports
- Upgrade pairing analysis
- Build recommendation engine

### Enhanced Features
- **vs Median columns** instead of vs Mean (better for understanding relative performance)
- **Efficiency metrics** at multiple percentiles (Top10%, Top50%)
- **Streamlined output** - only 2 core reports per archetype
- **Top 50 combat logs** - detailed mechanics for best builds
- **Simplified configuration** - no nested enable/disable flags

### What's Preserved
- All core combat mechanics from original simulation
- Build generation algorithms
- Multi-scenario testing
- Character data models
- Game rules and validation
