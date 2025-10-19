# Simulation V2 - Streamlined Combat Simulation

A cleaner, more focused version of the Vitality System combat simulation engine for analyzing attack build performance.

## Key Improvements

✅ **Simplified Configuration** - Clean JSON with essential parameters (tier, archetypes, attack_types, etc.)
✅ **Clear Data Flow** - Individual testing → Build testing → Top 50 logs → Reports
✅ **4 Report Types** - Enhancement ranking, Cost analysis, Individual logs, Top 50 logs
✅ **Enhanced Metrics** - vs Median columns, Top10%/Top50% efficiency metrics, Med Rank positioning
✅ **Multi-Archetype Support** - Test focused, dual_natured, and versatile_master builds
✅ **Performance Optimizations** - Progressive elimination, pruning, GPU acceleration, attack type filtering
✅ **Local Game Logic** - Complete `src/` directory with 30+ upgrades, 20+ limits, 6 attack types
✅ **Automatic Cleanup** - Keeps only 5 most recent report folders
✅ **Configurable Testing** - Filter attack types, customize dual_natured fallback attacks
✅ **Clean Codebase** - No legacy bloat, easier to understand and maintain

## Quick Start

```bash
# Run with default config (tier 4, dual_natured and focused archetypes)
python main.py

# Run with specific config
python main.py configs/tier3_focused.json

# Enable GPU acceleration (20x faster dice generation)
pip install torch-directml
# Then set "use_gpu": true in config.json

# Results will be in: reports/{timestamp}/{archetype}/
```

## Configuration

Config files are stored in `configs/` directory:
- `config.json` - Default config (tier 4, dual_natured and focused archetypes)

### Example Configuration

```json
{
  "tier": 4,
  "archetypes": ["dual_natured", "focused"],
  "attack_types": ["melee_dg", "area", "direct_damage", "direct_area_damage"],
  "simulation_runs": 5,
  "use_threading": true,
  "use_gpu": false,
  "build_chunk_size": 5000,

  "character_config": {
    "attacker": [2, 2, 2, 2, 4],
    "defender": [2, 2, 2, 2, 4]
  },

  "dual_natured": {
    "fallback_attacks": ["ranged", "area"],
    "fallback_tier_bonus": 1
  },

  "pruning": {
    "enabled": true,
    "top_percent": 0.1,
    "simulation_runs": 1
  },

  "progressive_elimination": {
    "enabled": false,
    "rounds": [
      {"simulation_runs": 5, "keep_percent": 0.20},
      {"simulation_runs": -1, "keep_percent": 1.0}
    ]
  },

  "scenarios": [
    {"name": "Boss", "num_enemies": 1, "enemy_hp": 100},
    {"name": "Mixed", "enemy_hp_list": [50, 25, 25]},
    {"name": "Swarm 1", "enemy_hp_list": [25, 25, 10, 10, 10, 10, 10]},
    {"name": "Swarm 2", "enemy_hp_list": [50, 10, 10, 10, 10, 10]}
  ]
}
```

### Configuration Options

**Core Settings:**
- **tier**: Character tier (1-5), determines point budgets (default: 4)
- **archetypes**: List of archetypes to test (default: `["dual_natured", "focused"]`)
  - Available: `"focused"`, `"dual_natured"`, `"versatile_master"`
- **attack_types**: Which attack types to include in testing (default: 4 types for faster testing)
  - Default: `["melee_dg", "area", "direct_damage", "direct_area_damage"]`
  - Available: `"melee_ac"`, `"melee_dg"`, `"ranged"`, `"area"`, `"direct_damage"`, `"direct_area_damage"`
  - **Tip:** Test fewer attack types to dramatically reduce build count (e.g., just `["melee_dg", "area"]`)
- **simulation_runs**: Number of iterations per combat test (default: 5, recommended: 10+ for production)
- **use_threading**: Enable multiprocessing (default: true, may have issues on Windows)
- **use_gpu**: Enable GPU acceleration for dice generation (default: false, requires `torch-directml`)
- **build_chunk_size**: Number of builds to process per chunk when threading enabled (default: 5000)
- **character_config**: Stats for attacker and defender `[focus, power, mobility, endurance, tier]`
  - Default: `[2, 2, 2, 2, 4]` - balanced tier 4 character
- **scenarios**: Combat scenarios to test (single boss, mixed enemies, swarms)
  - Default: 4 scenarios (Boss, Mixed, Swarm 1, Swarm 2)

**Archetype-Specific Settings:**
- **dual_natured**: Configuration for dual_natured archetype fallback attack system
  - `fallback_attacks`: List of attack types to use for second attack (e.g., `["ranged", "area"]`)
  - `fallback_tier_bonus`: Bonus point budget for fallback attack (typically 1)

**Performance Optimizations:**
- **pruning**: Pre-filter versatile_master builds to top performers before full testing
  - `enabled`: Enable/disable pruning
  - `top_percent`: Keep top X% of builds after pruning phase
  - `simulation_runs`: Number of runs for pruning phase
- **progressive_elimination**: Multi-round elimination system for all archetypes
  - `enabled`: Enable/disable progressive elimination
  - `rounds`: List of elimination rounds with `simulation_runs` and `keep_percent`
  - Use `-1` for simulation_runs in final round to use main config value

## Reports Generated

### 1. Individual Enhancement Combat Logs
**Location:** `reports/{timestamp}/{archetype}/combat_logs/{enhancement}_combat.txt`

Detailed turn-by-turn combat logs for each upgrade and limit tested individually:
- One log file per enhancement (upgrade or limit)
- Uses first configured scenario
- Shows exact dice rolls, damage calculations, condition triggers
- Useful for understanding how specific enhancements work in practice

### 2. Top 50 Build Combat Logs
**Location:** `reports/{timestamp}/{archetype}/top50_logs/rank{N}_*.txt`

Detailed mechanics for the 50 best performing builds:
- Shows full build description and average turns to kill
- Tests across all scenarios (Boss, Mixed, Swarm, etc.)
- Turn-by-turn combat sequence with dice rolls and damage
- Helps understand why top builds perform well

### 3. Enhancement Ranking Report
**Location:** `reports/{timestamp}/{archetype}/enhancement_ranking_{archetype}.md`

Overall performance ranking for all upgrades and limits.

**Columns:**
- **Rank** - Performance ranking (1 = best)
- **Enhancement** - Upgrade or limit name
- **Cost** - Point cost
- **Avg Turns** - Average turns to kill across all builds with this enhancement
- **vs Median** - Deviation from median (negative = better than median)
- **Top10% Turns** - Median turns for top 10% of builds
- **Top10% vs Median** - Top 10% deviation from overall median
- **Top10% Eff** - (Top10% vs Median) / cost - efficiency in best builds
- **Top50% Turns** - Median turns for top 50% of builds
- **Top50% vs Median** - Top 50% deviation from overall median
- **Top50% Eff** - (Top50% vs Median) / cost - efficiency in above-average builds
- **Melee_AC/DG/Ranged/Area/Direct** - Avg turns by attack type (0 = not compatible)
- **Uses** - Number of builds containing this enhancement
- **Med Rank** - Median rank position of builds with this enhancement

### 4. Cost Analysis Report
**Location:** `reports/{timestamp}/{archetype}/cost_analysis_{archetype}.md`

Enhancements grouped by point cost with efficiency analysis.

**Section 1: Cost Distribution**
- Shows count of enhancements at each cost tier (1pt, 2pt, 3pt, 4pt, 5pt)

**Section 2: Enhancements by Cost**
- Groups enhancements by cost tier
- Shows efficiency metrics (performance / cost)
- Includes Top10% and Top50% performance data

**Columns:**
- **Enhancement** - Upgrade or limit name
- **Cost** - Point cost
- **Avg Turns** - Average turns across all builds
- **vs Median** - Deviation from median
- **Efficiency** - (vs Median) / cost (lower = better)
- **Top10%** - Median turns for top performing builds
- **Top10% vs Med** - Top 10% deviation
- **Top10% Eff** - Top 10% efficiency
- **Top50%** - Median turns for above-average builds
- **Top50% vs Med** - Top 50% deviation
- **Top50% Eff** - Top 50% efficiency

### How to Use Reports

**Enhancement Ranking Report** - Best for:
- Identifying strongest upgrades and limits overall
- Understanding which enhancements work well across many builds
- Comparing performance by attack type (see columns: Melee_AC, Ranged, Area, etc.)
- Finding versatile enhancements (low Med Rank = appears in top builds)

**Cost Analysis Report** - Best for:
- Finding best value enhancements at each cost tier
- Comparing efficiency (performance/cost) across tiers
- Building budget-conscious attack builds
- Understanding diminishing returns at higher costs

**Individual Enhancement Logs** - Best for:
- Understanding exactly how a specific upgrade/limit works
- Seeing turn-by-turn mechanics and special effect triggers
- Debugging unexpected behavior
- Learning combat mechanics through examples

**Top 50 Build Combat Logs** - Best for:
- Understanding why top builds perform well
- Seeing complete builds in action across all scenarios
- Learning optimal build patterns and synergies
- Comparing performance across different enemy configurations

## Architecture

### Directory Structure
```
simulation_v2/
├── configs/                   # Configuration files
│   └── config.json            # Default config (tier 4, dual_natured + focused)
├── core/                      # Simulation V2 orchestration layer
│   ├── config.py              # Config loader with archetype point budgets
│   ├── individual_tester.py   # Test enhancements in isolation
│   ├── build_tester.py        # Test all build combinations
│   └── reporter.py            # Generate ranking and cost analysis reports
├── src/                       # Core game logic (local copies, can override ../simulation)
│   ├── game_data.py           # Attack types, upgrades, limits, validation rules
│   ├── models.py              # Data classes (Character, AttackBuild, MultiAttackBuild)
│   ├── combat.py              # Attack resolution, dice rolling, condition tracking
│   ├── combat_gpu.py          # Optional GPU acceleration via DirectML
│   ├── simulation.py          # Combat simulation loop
│   ├── build_generator.py    # Build combination generation algorithms
│   └── damage_calculator.py   # Damage calculation utilities
├── reports/                   # Output directory (timestamped)
│   └── {timestamp}/
│       └── {archetype}/
│           ├── combat_logs/              # Individual enhancement logs
│           │   └── {enhancement}_combat.txt
│           ├── top50_logs/               # Top 50 build combat logs
│           │   └── rank{N}_*.txt
│           ├── enhancement_ranking_{archetype}.md
│           └── cost_analysis_{archetype}.md
├── main.py                    # Entry point and orchestration
├── CLAUDE.md                  # Developer guidance (detailed)
└── README.md                  # This file
```

**Note:** Core game logic is in the `src/` directory. These are local copies that can be customized for simulation_v2. The original versions are in `../simulation/src/`.

### Data Flow
1. **Load Config** - Parse JSON config from `configs/` directory
2. **For Each Archetype**:
   - **Individual Testing** - Generate combat logs for each enhancement tested alone
   - **Build Generation** - Generate all valid builds using `generate_archetype_builds_chunked()`
   - **Build Testing** - Test each build across all scenarios (with optional pruning/progressive elimination)
   - **Top 50 Logging** - Generate detailed combat logs for best 50 builds
   - **Report Generation** - Calculate enhancement stats and generate ranking + cost analysis reports

### Code Organization
Simulation V2 uses local copies of game logic in the `src/` directory:

**Core game logic** (`src/`):
- `game_data.py` - Attack types, upgrades, limits, validation rules (30+ upgrades, 20+ limits)
- `models.py` - Data classes (Character, AttackBuild, MultiAttackBuild)
- `combat.py` - Attack resolution, dice rolling, condition tracking
- `combat_gpu.py` - Optional GPU acceleration via DirectML (20x faster dice cache)
- `simulation.py` - Combat simulation loop
- `build_generator.py` - Build combination generation algorithms
- `damage_calculator.py` - Damage calculation utilities

**V2-specific orchestration** (`core/`):
- `config.py` - Configuration management with archetype point budgets
- `individual_tester.py` - Enhancement isolation testing
- `build_tester.py` - Build combination testing with progressive elimination
- `reporter.py` - Report generation (enhancement ranking, cost analysis)
- `main.py` - Pipeline coordination and orchestration

## Performance Notes

### Expected Runtimes
- **Tier 3 focused**: ~30 seconds - 2 minutes
- **Tier 4 dual_natured**: 2-5 minutes (300,000+ builds)
- **Tier 4 versatile_master**: 5-15 minutes (can generate millions of builds)
- **Tier 5 versatile_master**: 20+ minutes without optimizations

### Performance Optimizations

**Progressive Elimination** (recommended for all archetypes):
- Tests builds in multiple rounds with increasing accuracy
- Eliminates poor performers early to save time
- Example: 20K builds with 10 runs → 336K simulations instead of 800K (58% reduction)
- Enable in config: `"progressive_elimination": {"enabled": true}`

**Pruning** (for versatile_master only):
- Pre-filters builds to top performers before full testing
- Keep top 10% in initial quick pass, then run full simulations
- Dramatically reduces testing time for archetypes with millions of builds
- Enable in config: `"pruning": {"enabled": true, "top_percent": 0.1}`

**GPU Acceleration** (optional):
- 20x faster dice cache generation (10,000+ rolls)
- Requires `torch-directml` installation
- Supports AMD, NVIDIA, Intel GPUs on Windows
- Enable in config: `"use_gpu": true`

**Threading** (use with caution):
- Can speed up testing by 2-4x on multi-core systems
- May have stability issues on Windows
- Default: `"use_threading": true` (try disabling if issues occur)

### Tuning Recommendations
- **Quick testing**: Set `simulation_runs: 3`, enable progressive elimination
- **Production analysis**: Set `simulation_runs: 10+`, enable all optimizations
- **Tier 5 versatile_master**: Enable pruning + progressive elimination + GPU
- **Memory constrained**: Disable threading, reduce `build_chunk_size` to 500-1000

## Archetype System

Characters can specialize in different attack patterns with varying point budgets:

| Archetype | Tier 3 | Tier 4 | Tier 5 | Description |
|-----------|--------|--------|--------|-------------|
| **Focused** | 2pt | 4pt | 6pt | Single specialized attack |
| **Dual Natured** | 4pt | 6pt | 8pt | Two complementary attacks |
| **Versatile Master** | 6pt | 8pt | 10pt | Three diverse attacks |

Point budgets are **per-attack**. MultiAttackBuilds intelligently select the optimal attack for each scenario.

## Attack Types & Game Mechanics

### Available Attack Types

The simulation tests 6 different attack types, each with unique mechanics:

| Attack Type | Base Cost | Accuracy Mod | Damage Mod | Special Features |
|-------------|-----------|--------------|------------|------------------|
| **melee_ac** | 0 | +Tier | 0 | Melee with accuracy bonus |
| **melee_dg** | 0 | 0 | +Tier | Melee with damage bonus |
| **ranged** | 0 | 0 | 0 | Standard ranged attack |
| **area** | 0 | -1 | 0 | Hits multiple targets |
| **direct_damage** | 0 | 0 | 0 | 10 flat damage (auto-hit, no dice) |
| **direct_area_damage** | 0 | 0 | -1 | 10 - Tier flat damage to area (auto-hit, no dice) |

**Notes:**
- Area attacks (`area`, `direct_area_damage`) pay **2x cost** for all upgrades and limits due to their multi-target capability.
- Direct attacks (`direct_damage`, `direct_area_damage`) **auto-hit** and cannot use accuracy-based upgrades (power_attack, slayer_acc, critical effects, etc.).

### Enhancement System

**Upgrades** (30+ available):
- Modify attack accuracy, damage, or add special effects
- Cost: 1-3 points each
- Examples: `power_attack` (+1 damage, -1 accuracy, 1pt), `brutal` (brutal_20 effect, 2pt), `armor_piercing` (ignore endurance, -2 accuracy, 3pt)
- Some upgrades are mutually exclusive (e.g., can't combine `double_tap` + `powerful_critical`)
- Some upgrades restricted to specific attack types (e.g., `explosive_critical` can't apply to AOE)

**Limits** (20+ available):
- Restrict when/how an attack can be used for point refunds
- Gain: 1-3 points each
- Examples: `unreliable_1` (50% chance, +2pt), `quickdraw` (turn 1-3 only, +3pt), `bloodied` (when HP < 50%, +1pt)
- Mutually exclusive within categories (e.g., can only have one HP condition limit)

### Rule Validation

The simulation enforces strict game rules:
- **Mutual exclusions** - Incompatible upgrade/limit combinations
- **Prerequisites** - Some upgrades require others first
- **Attack type restrictions** - Certain upgrades only work with specific attack types
- **AOE cost multiplier** - Area attacks pay double for enhancements
- **Max 3 upgrades** - Per attack build (enforced by generation algorithm)

## Differences from Original Simulation

### What's Removed
- ❌ Tactical analysis reports (interesting but not actionable)
- ❌ Archetype-specific scenario reports (single target, multi-target, etc.)
- ❌ Upgrade pairing analysis (can be derived from build testing)
- ❌ Build recommendation engine (top 50 logs serve this purpose)
- ❌ Legacy report configuration (complex nested enable/disable flags)

### What's Enhanced
- ✅ **vs Median columns** - Better than "vs Mean" for understanding relative performance
- ✅ **Efficiency metrics** - (performance / cost) at Top10%, Top50%, and overall levels
- ✅ **Top 50 combat logs** - Detailed turn-by-turn mechanics for best builds across ALL scenarios
- ✅ **Individual enhancement logs** - Isolated testing shows exactly how each upgrade/limit works
- ✅ **Simplified config** - Clean JSON with no nested flags, just essential parameters
- ✅ **Progressive elimination** - Multi-round testing system that works for all archetypes
- ✅ **GPU acceleration** - Optional DirectML support (20x faster dice cache generation)
- ✅ **Attack type filtering** - Choose which attack types to test (reduces build count)
- ✅ **Dual natured fallback system** - Configurable fallback attacks for second attack slot
- ✅ **Automatic report cleanup** - Keeps only 5 most recent report folders

### What's Preserved
- ✅ All core combat mechanics (attack resolution, special effects, conditions)
- ✅ Build generation algorithms with full rule validation (mutual exclusions, prerequisites)
- ✅ Multi-scenario testing (boss fights, mixed enemy groups, swarms)
- ✅ Character data models and all 6 attack types
- ✅ Dice cache optimization (10,000 pre-generated rolls)
- ✅ All 30+ upgrades and 20+ limits from game_data.py

## Troubleshooting

### Missing dependencies
**Problem:** `ModuleNotFoundError` when running simulation
**Solution:** Install dependencies: `pip install -r requirements.txt` (if available) or manually install needed packages

### Multiprocessing errors on Windows
**Problem:** Crashes or hangs with threading enabled
**Solution:** Set `"use_threading": false` in config.json

### Simulation takes too long
**Solutions:**
- Reduce `"simulation_runs"` to 3-5 for quick testing
- Enable progressive elimination for faster convergence
- Enable pruning for versatile_master archetype
- Test only one archetype at a time
- Lower the tier (tier 3 has ~10x fewer builds than tier 4)
- Install GPU acceleration: `pip install torch-directml` and set `"use_gpu": true`

### Out of memory errors
**Solutions:**
- Disable threading: `"use_threading": false`
- Reduce chunk size: `"build_chunk_size": 500`
- Test archetypes separately instead of all at once
- Enable progressive elimination to reduce active builds

### GPU not being used
**Solutions:**
- Install DirectML: `pip install torch-directml`
- Set `"use_gpu": true` in config.json
- Check console output for "GPU initialized successfully" message
- Verify you have a compatible GPU (AMD, NVIDIA, Intel)
