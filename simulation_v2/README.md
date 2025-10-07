# Simulation V2 - Streamlined Combat Simulation

A cleaner, more focused version of the Vitality System combat simulation engine.

## Key Improvements

✅ **Simplified Configuration** - Only essential parameters in `config_v2.json`
✅ **Clear Data Flow** - Individual testing → Build testing → Reports
✅ **2 Focused Reports** - Enhancement ranking + Cost analysis (the most valuable)
✅ **Enhanced Metrics** - vs Median columns, efficiency metrics for better analysis
✅ **Per-Archetype Execution** - Run focused and dual_natured separately
✅ **Reuses Optimized Code** - Imports game_data, combat, simulation from parent `/simulation` directory
✅ **Clean Codebase** - No legacy bloat, easier to understand and maintain

## Quick Start

```bash
# Run with default config (tier 4 dual_natured)
python main.py

# Run with specific config
python main.py configs/tier3_focused.json

# Results will be in: reports/{timestamp}/{archetype}/
```

## Configuration

Config files are stored in `configs/` directory:
- `tier3_focused.json` - Quick test config (tier 3, focused archetype)
- `config.json` - Default config (tier 4, dual_natured archetype)

### Example Configuration

```json
{
  "tier": 4,
  "archetypes": ["focused", "dual_natured"],
  "simulation_runs": 10,
  "use_threading": false,
  "build_chunk_size": 4000,

  "character_config": {
    "attacker": [2, 2, 2, 2, 4],
    "defender": [2, 2, 2, 2, 4]
  },

  "scenarios": [
    {"name": "Boss", "num_enemies": 1, "enemy_hp": 100},
    {"name": "Mixed", "enemy_hp_list": [50, 25, 25]},
    {"name": "Swarm", "enemy_hp_list": [25, 25, 10, 10, 10, 10, 10]}
  ]
}
```

### Configuration Options

- **tier**: Character tier (1-5), determines point budgets
- **archetypes**: List of archetypes to test (`"focused"`, `"dual_natured"`, `"versatile_master"`)
- **simulation_runs**: Number of iterations per combat test (higher = more accurate, slower)
- **use_threading**: Enable multiprocessing (faster but may have issues on Windows)
- **build_chunk_size**: Number of builds to process per chunk when threading enabled
- **character_config**: Stats for attacker and defender `[focus, power, mobility, endurance, tier]`
- **scenarios**: Combat scenarios to test (single boss, mixed enemies, swarms)

## Reports Generated

### Combat Logs (Individual Enhancements)
`reports/{timestamp}/{archetype}/combat_logs/{enhancement}_combat.txt`

Detailed turn-by-turn combat logs for each upgrade and limit tested individually:
- One log file per enhancement (upgrade or limit)
- Uses first configured scenario
- Shows exact dice rolls, damage calculations, condition triggers
- Useful for understanding how specific enhancements work in practice

### Enhancement Ranking Report
`reports/{timestamp}/{archetype}/enhancement_ranking_{archetype}.md`

**Columns:**
- **Rank** - Performance ranking (1 = best)
- **Enhancement** - Upgrade or limit name
- **Cost** - Point cost
- **Avg Turns** - Average turns to kill across all builds with this enhancement
- **vs Median** - Deviation from median (negative = better than median)
- **Top10% Turns** - Median turns for top 10% of builds
- **Top10% vs Median** - Top 10% deviation from overall median
- **Top10% Eff** - (Top10% vs Median) / cost
- **Top50% Turns** - Median turns for top 50% of builds
- **Top50% vs Median** - Top 50% deviation from overall median
- **Top50% Eff** - (Top50% vs Median) / cost
- **Melee_AC/DG/Ranged/Area/Direct** - Avg turns by attack type (0 = not compatible)
- **Uses** - Number of builds containing this enhancement
- **Med Rank** - Median rank position of builds with this enhancement

### Cost Analysis Report
`reports/{timestamp}/{archetype}/cost_analysis_{archetype}.md`

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

## Architecture

### Directory Structure
```
simulation_v2/
├── configs/                   # Configuration files
│   ├── tier3_focused.json     # Test config
│   └── config.json        # Default config
├── data/                      # Game rules documentation
│   └── RULES.md               # Complete rules reference
├── src/                       # Core simulation engine
│   ├── game_data.py           # Game rules (upgrades, limits, etc)
│   ├── models.py              # Data models (Character, AttackBuild, etc)
│   ├── combat.py              # Combat simulation with dice cache
│   ├── simulation.py          # Simulation batch logic
│   └── build_generator.py    # Build generation algorithms
├── core/                      # Simulation V2 logic
│   ├── config.py              # Config loader
│   ├── individual_tester.py   # Test enhancements individually
│   ├── build_tester.py        # Test build combinations
│   └── reporter.py            # Generate reports
├── reports/                   # Output directory
│   └── {timestamp}/
│       └── {archetype}/
│           ├── combat_logs/
│           │   └── {enhancement}_combat.txt
│           ├── enhancement_ranking_{archetype}.md
│           └── cost_analysis_{archetype}.md
├── main.py                    # Entry point
└── README.md                  # This file
```

### Data Flow
1. **Load Config** - Parse `config_v2.json`
2. **For Each Archetype**:
   - **Build Generation** - Generate all valid builds using `generate_archetype_builds_chunked()`
   - **Build Testing** - Test each build across all scenarios
   - **Report Generation** - Calculate enhancement stats and generate 2 reports

### Code Imports
Simulation V2 reuses the optimized simulation engine:
- `simulation/src/game_data.py` - Game rules and data
- `simulation/src/combat.py` - Combat simulation (with dice cache)
- `simulation/src/simulation.py` - Simulation batch logic
- `simulation/src/models.py` - Data structures
- `simulation/src/build_generator.py` - Build generation

## Performance Notes

- **Threading disabled by default** - Multiprocessing has issues on Windows, set `use_threading: false`
- **Expected runtime**: 2-10 minutes depending on tier and simulation_runs
- **Tier 4 focused archetype**: ~300,000+ builds to test
- **Reduce simulation_runs** for faster testing (5 runs is usually sufficient)

## Differences from Original Simulation

### What's Removed
- ❌ Individual testing reports (redundant with build testing)
- ❌ Tactical analysis reports (interesting but not essential)
- ❌ Archetype-specific reports (single target, multi-target, etc.)
- ❌ Upgrade pairing analysis (nice-to-have but bloats output)
- ❌ Combat logs (verbose and rarely used)
- ❌ Build recommendation engine (can be derived from ranking reports)

### What's Enhanced
- ✅ **vs Median columns** - Better than "vs Mean" for understanding relative performance
- ✅ **Efficiency metrics** - (performance / cost) for all percentiles
- ✅ **Cleaner output** - Only 2 focused reports per archetype
- ✅ **Simplified config** - No nested report enable/disable flags
- ✅ **Better column labels** - Clear, consistent naming

## Troubleshooting

### "ImportError: cannot import name X"
- Make sure you're running from the parent directory that contains both `/simulation` and `/simulation_v2`
- The code expects to import from `../simulation/src/`

### Multiprocessing errors on Windows
- Set `"use_threading": false` in config_v2.json
- Sequential processing is slower but more reliable

### Simulation takes too long
- Reduce `"simulation_runs"` (5 is usually sufficient)
- Test only one archetype at a time
- Lower the tier (tier 3 has fewer builds than tier 4)

## Future Enhancements

Potential improvements for V3:
- Support for custom scenario weights (boss fights matter more)
- Statistical significance testing (are differences meaningful?)
- CSV export for external analysis
- Interactive report viewer (web UI)
- Parallel archetype processing
