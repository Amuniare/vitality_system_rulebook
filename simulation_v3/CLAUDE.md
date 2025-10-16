# CLAUDE.md - Simulation V3 Developer Guide

This file provides guidance to Claude Code (claude.ai/code) when working with Simulation V3.

## Project Overview

Simulation V3 is a specialized combat simulation engine focused exclusively on **dual-natured archetype optimization** for the Vitality System RPG. It uses a two-stage pipeline:

1. **Stage 1**: Generate all possible attacks, test across multiple defensive profiles, prune to top performers
2. **Stage 2**: Generate pairs from pruned attacks, test with intelligent selection that chooses optimal attack each turn

## Key Innovations

**Defensive Profile Testing**: Tests builds against 4 enemy types (Balanced, Evasive, Tanky, Elite) × 4 buff configurations (No Buffs, Offensive Buff, Defensive Buffs) = 16 defensive scenarios per scenario type

**Intelligent Attack Selection**: On each combat turn, scores both attacks based on current situation and selects the better one. Tracks which attack gets used when.

**Synergy Analysis**: Compares paired performance vs individual averages to identify truly complementary combinations (positive synergy) vs redundant pairs (negative synergy).

## Common Development Commands

```bash
# Run full simulation
python main.py

# Run only Stage 1 (attack pruning)
python main.py --stage 1

# Run only Stage 2 (pairing - requires Stage 1 cache)
python main.py --stage 2

# Use custom config
python main.py --config configs/fast_test.json

# Output locations:
# - Stage 1 cache: cache/pruned_attacks.json
# - Stage 1 report: reports/stage1/stage1_pruning_report.md
# - Stage 2 report: reports/stage2/stage2_pairing_report.md
```

## High-Level Architecture

### Two-Stage Pipeline

**Stage 1: Attack Pruning ([stage1_pruning.py](stage1_pruning.py))**
1. Generate all valid AttackBuilds within point budget
2. Test each attack across 4 profiles × 4 buffs × 3 scenarios (48 test cases)
3. Calculate overall average and per-profile averages
4. Keep top 20% overall + top 10% per profile (ensures diversity)
5. Save pruned attacks to `cache/pruned_attacks.json`

**Stage 2: Intelligent Pairing ([stage2_pairing.py](stage2_pairing.py))**
1. Load pruned attacks from Stage 1 cache
2. Generate all pairs (combinations of 2)
3. For each pair, simulate combat with intelligent selection:
   - On each turn, score both attacks based on current state
   - Select attack with higher score
   - Track which attack was used
4. Calculate performance metrics and usage patterns
5. Generate report with top 50 pairs

### Module Structure

**[combat_with_buffs.py](combat_with_buffs.py)**: Extends base combat system with passive buff support
- `BuffConfig`: Dataclass for buff configurations
- `apply_defender_buffs()`: Modify defender stats for avoidance/durability buffs
- `simulate_combat_with_buffs()`: Wrapper for combat simulation with buffs
- `run_simulation_batch_with_buffs()`: Batch simulation with buffs

**[stage1_pruning.py](stage1_pruning.py)**: Attack generation and pruning
- `Stage1Config`: Configuration loader
- `AttackTestResult`: Results from testing single attack across profiles
- `generate_all_attacks()`: Create all valid AttackBuilds
- `test_attack_across_profiles()`: Test attack vs all defensive scenarios
- `prune_attacks()`: Keep top performers + specialists
- `generate_stage1_report()`: Markdown report generation

**[stage2_pairing.py](stage2_pairing.py)**: Pairing with intelligent selection
- `Stage2Config`: Configuration loader
- `score_attack_for_situation()`: **Core algorithm** - scores attack for current state
- `simulate_pair_with_intelligent_selection()`: Combat sim with dynamic attack choice
- `test_pair_across_profiles()`: Test pair vs all defensive scenarios
- `generate_stage2_report()`: Markdown report with usage analytics

**[main.py](main.py)**: Orchestration and CLI
- Argument parsing for stage selection
- Runs Stage 1 and/or Stage 2
- Error handling and timing

### Import Dependencies

Imports from parent simulation engine (`simulation_v2/src/`):
- `models.py` - Character, AttackBuild, MultiAttackBuild
- `build_generator.py` - `generate_valid_builds_chunked()`
- `combat.py` - `make_attack()`, `make_aoe_attack()`
- `simulation.py` - `simulate_combat_verbose()`

**CRITICAL**: V3 expects to import from `../simulation_v2/src/`. The code adds this to `sys.path` at runtime. Verify directory structure if imports fail.

## Key Algorithms

### Intelligent Attack Selection ([stage2_pairing.py:score_attack_for_situation](stage2_pairing.py))

**Inputs:**
- `attack`: AttackBuild to score
- `enemies`: List of enemy dicts with HP info
- `defensive_profile`: Current defensive profile being tested
- `buff_config`: Current buff configuration

**Scoring Logic:**

1. **Scenario-Based Scoring**:
   - Swarm (5+ enemies): AOE +100, single-target -50
   - Multi-target (3-4): AOE +50
   - Boss (1): Single-target +50, AOE -30
   - 2 enemies: Single-target +20, AOE +10

2. **Defensive Profile Adaptation**:
   - **Evasive** (high avoidance): `accurate_attack` +30, `reliable_accuracy` +40, `power_attack` -20
   - **Tanky** (high durability): `armor_piercing` +50, `power_attack` +30, `brutal` +25
   - **Elite** (both): `armor_piercing` +40, `accurate_attack` +25, balanced approach

3. **Buff Configuration Response**:
   - **Offensive Buff**: `power_attack` +15 (leverage accuracy bonus)
   - **Defensive Buff (Avoidance)**: `reliable_accuracy` +20, `accurate_attack` +15
   - **Defensive Buff (Durability)**: `armor_piercing` +20, `brutal` +15

4. **Upgrade Synergies**:
   - Boss slayer: +40 for 1 enemy with 80+ HP, -10 for 3+ enemies
   - Culling strike: +30 for 3+ enemies with low avg HP
   - Finishing blow: +25 if multiple wounded enemies
   - Channeled: +25 for single target, -15 for 3+ enemies
   - Splinter/ricochet: +20 for 3+ enemies

5. **Limit Penalties**:
   - Charge limits: -20 in swarms (need fast action)
   - HP-based limits: -5 (unreliable activation)

**Output**: Float score (higher = better for current situation)

The highest-scoring attack is selected for that turn.

### Pruning Strategy ([stage1_pruning.py:prune_attacks](stage1_pruning.py))

**Inputs:**
- List of all AttackTestResults (one per attack)
- `config.top_percent` (e.g., 0.20 = 20%)
- `config.specialist_percent` (e.g., 0.10 = 10%)

**Algorithm:**

1. Sort all attacks by overall average performance
2. Keep top N% overall (e.g., top 20%)
3. For each defensive profile:
   - Sort by performance on that profile
   - Keep top M% as specialists (e.g., top 10%)
4. Union of all kept attacks (overall + all specialists)
5. Result: ~22-25% of attacks kept (some overlap between categories)

**Why This Works:**
- Ensures generalists (perform well everywhere) are kept
- Ensures specialists (excel in specific situations) are kept
- Provides diversity for Stage 2 pairing

## Configuration System

### Config File Structure ([config.json](config.json))

```json
{
  "tier": 4,                       // Character power level
  "archetype": "dual_natured",     // Only dual_natured supported in V3
  "points_per_attack": 6,          // Point budget per attack

  "stage1": {
    "simulation_runs": 3,          // Runs per test in Stage 1
    "top_percent": 0.20,           // Keep top 20% overall
    "specialist_percent": 0.10     // Keep top 10% per profile
  },

  "stage2": {
    "simulation_runs": 10,         // Runs per test in Stage 2
    "max_turns": 100               // Combat timeout
  },

  "character_config": {
    "attacker": [2, 2, 2, 2, 4]    // [focus, power, mobility, endurance, tier]
  },

  "defensive_profiles": [          // Enemy stat configurations
    {
      "name": "Balanced",
      "stats": [2, 2, 2, 2, 4],
      "description": "Standard enemy"
    }
    // ... more profiles
  ],

  "buff_configurations": [         // Passive buff scenarios
    {
      "name": "Offensive Buff",
      "attacker_accuracy_bonus": 1,
      "defender_avoidance_bonus": 0,
      "defender_durability_bonus": 0
    }
    // ... more buffs
  ],

  "scenarios": [                   // Combat scenarios
    {"name": "Boss", "num_enemies": 1, "enemy_hp": 100},
    {"name": "Mixed", "enemy_hp_list": [50, 25, 25]}
    // ... more scenarios
  ]
}
```

### Total Test Matrix

**Stage 1**: Each attack tested across:
- 4 defensive profiles × 4 buff configs × 3 scenarios = **48 test cases**
- Example: 5,000 attacks × 48 tests × 3 runs = **720,000 simulations**

**Stage 2**: Each pair tested across:
- Same 48 test cases × 10 runs = **480 simulations per pair**
- Example: 20,000 pairs × 480 sims = **9.6M simulations**

## Performance Considerations

### Expected Runtimes

**With Default Config (tier 4, dual_natured, 6 points/attack):**
- Stage 1: 10-20 minutes (~5,000 attacks)
- Stage 2: 60-120 minutes (~20,000 pairs)
- Total: 70-140 minutes

**Factors Affecting Runtime:**
- Number of attacks generated (depends on point budget and tier)
- Simulation runs (linear scaling)
- Number of defensive profiles (linear scaling)
- Number of buff configs (linear scaling)
- Number of scenarios (linear scaling)

### Optimization Strategies

**Reduce Stage 1 Time:**
- Lower `simulation_runs` from 3 to 1 (3x faster, less accurate)
- Increase `top_percent` from 0.20 to 0.30 (same Stage 1 time, but fewer pairs in Stage 2)
- Remove a defensive profile (25% faster)
- Remove buff configs (25% faster per removed config)

**Reduce Stage 2 Time:**
- Lower `simulation_runs` from 10 to 5 (2x faster, less accurate)
- Increase Stage 1 `top_percent` to reduce pruned attacks (quadratic effect on pairs)
- Remove scenarios (33% faster per removed scenario)

**Recommended Fast Config:**
```json
"stage1": {"simulation_runs": 1, "top_percent": 0.30},
"stage2": {"simulation_runs": 5}
```
Result: Stage 1 ~5 min, Stage 2 ~30 min, less accurate but fast iteration

## Common Development Tasks

### Adding a New Defensive Profile

1. Edit `config.json` → `defensive_profiles` array
2. Add new profile with stats: `[focus, power, mobility, endurance, tier]`
3. Re-run Stage 1 (cache will be regenerated)
4. Stage 2 will automatically test against new profile

### Modifying Intelligent Selection Logic

Edit [stage2_pairing.py:score_attack_for_situation](stage2_pairing.py):
- Add new scoring rules based on upgrades, limits, or combat state
- Test with a few pairs first to verify behavior
- Consider both buff configs and defensive profiles when adding rules

### Adjusting Pruning Thresholds

Edit `config.json` → `stage1` settings:
- `top_percent`: Higher = more attacks kept (more pairs in Stage 2)
- `specialist_percent`: Higher = more specialists kept
- Recommended: 0.15-0.30 for `top_percent`, 0.05-0.15 for `specialist_percent`

### Generating Detailed Combat Logs

Currently not implemented in V3 for performance reasons.

To add:
1. Extend `simulate_pair_with_intelligent_selection()` to accept `log_file` parameter
2. Pass `log_file` to `make_attack()` and `make_aoe_attack()` calls
3. Generate logs for top N pairs in `generate_stage2_report()`

Similar to V2's `generate_combat_log_for_build()` function.

### Testing Changes Quickly

Use a minimal test config:
```json
{
  "stage1": {"simulation_runs": 1, "top_percent": 0.50},
  "stage2": {"simulation_runs": 1},
  "defensive_profiles": [{"name": "Balanced", "stats": [2,2,2,2,4]}],
  "buff_configurations": [{"name": "No Buffs", ...}],
  "scenarios": [{"name": "Boss", "num_enemies": 1, "enemy_hp": 100}]
}
```
Result: Stage 1 ~2 min, Stage 2 ~5 min, very fast iteration

## Important Development Notes

### Import Path Dependencies

**CRITICAL**: V3 imports from `../simulation_v2/src/`. This requires:
- `/simulation_v2/` directory exists as sibling to `/simulation_v3/`
- `/simulation_v2/src/` contains: `models.py`, `combat.py`, `simulation.py`, `build_generator.py`, `game_data.py`

If imports fail, verify directory structure:
```
vitality_system_rulebook/
├── simulation_v2/
│   └── src/
│       ├── models.py
│       ├── combat.py
│       ├── simulation.py
│       ├── build_generator.py
│       └── game_data.py
└── simulation_v3/
    ├── main.py
    ├── stage1_pruning.py
    └── stage2_pairing.py
```

### Buff Implementation

**How Buffs Work:**
- **Attacker accuracy bonus**: Add to `focus` stat (accuracy = 10 + tier + focus)
- **Defender avoidance bonus**: Add to `mobility` stat (avoidance = 10 + tier + mobility)
- **Defender durability bonus**: Add to `endurance` stat (durability = 5 + tier + endurance)

**Why this approach:**
- Simplest to implement with existing combat code
- Doesn't require modifying core combat functions
- Mathematically equivalent to adding bonuses to derived stats

### Cache Management

**Stage 1 → Stage 2 Data Flow:**
- Stage 1 saves: `cache/pruned_attacks.json`
- Stage 2 loads: `cache/pruned_attacks.json`
- If Stage 1 is re-run, cache is overwritten
- Stage 2 will fail if cache doesn't exist

**Cache Format:**
```json
[
  {
    "attack_type": "melee_dg",
    "upgrades": ["power_attack", "brutal"],
    "limits": ["unreliable_1"],
    "cost": 3,
    "overall_avg": 7.8,
    "profile_avgs": {"Balanced": 7.5, "Evasive": 8.2, ...},
    "buff_avgs": {...},
    "scenario_avgs": {...},
    "specialization_variance": 0.42
  },
  ...
]
```

### Synergy Score Calculation

**Formula:**
```
synergy_score = (avg_individual - paired_performance) / avg_individual * 100
```

Where:
- `avg_individual = (attack1_overall_avg + attack2_overall_avg) / 2`
- `paired_performance = overall_avg from pairing test`

**Interpretation:**
- **Positive (>5%)**: Pair is complementary, performs better together
- **Near Zero (-5% to +5%)**: Pair is neutral, similar to individuals
- **Negative (<-5%)**: Pair is redundant, individuals perform better alone

**Why synergy matters:**
- High synergy indicates truly complementary specializations
- Negative synergy suggests attacks overlap in coverage
- Best pairs typically have 10-20% synergy

## Differences from Simulation V2

### Architecture Differences

**V2**: Single-stage testing of all builds
**V3**: Two-stage pipeline with pruning between stages

**V2**: Tests focused, dual_natured, versatile_master
**V3**: Only tests dual_natured

**V2**: Fixed attack selection (predefined priority)
**V3**: Intelligent attack selection (dynamic based on state)

**V2**: Single balanced defensive profile
**V3**: Multiple defensive profiles (Balanced, Evasive, Tanky, Elite)

**V2**: No buff modeling
**V3**: Tests with offensive/defensive buffs

### Report Differences

**V2 Reports:**
- Enhancement ranking (all upgrades/limits)
- Cost analysis (efficiency by cost tier)
- Top 50 combat logs
- Individual enhancement logs

**V3 Reports:**
- Stage 1: Attack pruning by profile
- Stage 2: Top pairs with usage analytics and synergy scores
- No per-enhancement reports (focus is on pairs)

### Code Reuse

**What V3 Reuses from V2:**
- All core combat mechanics (`combat.py`, `simulation.py`)
- Character and build data models (`models.py`)
- Build generation algorithms (`build_generator.py`)
- Game data and rules (`game_data.py`)

**What V3 Adds:**
- Buff support (`combat_with_buffs.py`)
- Intelligent attack scoring (`stage2_pairing.py:score_attack_for_situation`)
- Two-stage pipeline (`stage1_pruning.py`, `stage2_pairing.py`)
- Usage analytics and synergy calculations

## Future Enhancements

**Potential Improvements:**

1. **Detailed Combat Logs**: Generate turn-by-turn logs for top 10 pairs
2. **GPU Acceleration**: Use V2's GPU support for faster dice generation
3. **Progressive Elimination**: Apply V2's progressive elimination to Stage 2
4. **Multi-Archetype**: Extend to versatile_master (3 attacks with intelligent selection)
5. **Defensive Rotation**: Model enemies switching defensive stances
6. **Conditional Buffs**: Model situational buffs (e.g., flanking only vs certain enemies)

**Not Planned:**
- Support for focused archetype (single attack, no selection needed)
- Web UI (CLI-focused tool)
- Real-time simulation (batch processing only)
