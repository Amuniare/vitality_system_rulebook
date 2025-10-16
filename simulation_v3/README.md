# Simulation V3 - Dual-Natured Attack Pairing with Intelligent Selection

A specialized simulation engine for analyzing optimal dual-natured attack pairs in the Vitality System RPG. Tests attacks across multiple defensive profiles and uses intelligent selection to determine which attack to use in each combat situation.

## Key Features

✅ **Two-Stage Pipeline** - Prune attacks → Test pairs with intelligent selection
✅ **Defensive Profile Testing** - Tests against Balanced, Evasive, Tanky, and Elite enemies
✅ **Passive Buff Support** - Simulates offensive/defensive buffs from party members or conditions
✅ **Intelligent Attack Selection** - Dynamically chooses optimal attack based on combat state
✅ **Usage Analytics** - Shows which attack gets used in each situation
✅ **Synergy Analysis** - Identifies truly complementary attack pairs

## Quick Start

```bash
# Run full simulation (both stages)
python main.py

# Run only Stage 1 (attack pruning)
python main.py --stage 1

# Run only Stage 2 (requires Stage 1 cache)
python main.py --stage 2

# Use custom config
python main.py --config my_config.json

# Results will be in: reports/stage1/ and reports/stage2/
```

## Configuration

Edit [config.json](config.json) to customize simulation parameters:

### Key Settings

**Basic Configuration:**
- `tier`: Character tier (default: 4)
- `archetype`: Must be `"dual_natured"`
- `points_per_attack`: Point budget per attack (default: 6 for tier 4)

**Stage 1 (Pruning):**
- `simulation_runs`: Simulations per test (default: 3)
- `top_percent`: Keep top X% overall (default: 0.20 = 20%)
- `specialist_percent`: Keep top X% per profile (default: 0.10 = 10%)

**Stage 2 (Pairing):**
- `simulation_runs`: Simulations per test (default: 10)
- `max_turns`: Maximum combat turns (default: 100)

**Defensive Profiles:**
- `Balanced`: [2, 2, 2, 2, 4] - Standard enemy (Avoidance: 16, Durability: 11)
- `Evasive`: [2, 2, 4, 2, 4] - High mobility (Avoidance: 18, Durability: 11)
- `Tanky`: [2, 2, 2, 4, 4] - High endurance (Avoidance: 16, Durability: 13)
- `Elite`: [2, 2, 4, 4, 4] - Both high (Avoidance: 18, Durability: 13)

**Buff Configurations:**
- `No Buffs`: Baseline combat
- `Offensive Buff`: +1 accuracy for attacker
- `Defensive Buff (Avoidance)`: +1 avoidance for defender
- `Defensive Buff (Durability)`: +1 durability for defender

**Combat Scenarios:**
- `Boss`: 1 enemy × 100 HP (single high-HP target)
- `Mixed`: Mixed group (50 + 25 + 25 HP)
- `Swarm`: 7 enemies (25 + 25 + 10×5 HP)

### Total Test Matrix

Each attack is tested across:
- 4 defensive profiles × 4 buff configs × 3 scenarios = **48 test cases**
- Stage 1: ~5,000 attacks × 48 tests × 3 runs = **~720,000 simulations** (~10-15 minutes)
- Stage 2: ~20,000 pairs × 48 tests × 10 runs = **~9.6M simulations** (~60-90 minutes)

## How It Works

### Stage 1: Attack Pruning

1. **Generate Attacks**: Create all valid AttackBuilds within point budget
2. **Test Across Profiles**: Simulate each attack vs all defensive profiles and scenarios
3. **Calculate Performance**: Aggregate average turns to kill across all test cases
4. **Prune**: Keep top 20% overall + top 10% per defensive profile
5. **Output**: `pruned_attacks.json` cache file + `stage1_pruning_report.md`

**Pruning Strategy:**
- Keeps generalists (perform well everywhere)
- Keeps specialists (excel against specific profiles)
- Ensures diversity for Stage 2 pairing

### Stage 2: Intelligent Pairing

1. **Load Pruned Attacks**: Read cache from Stage 1 (~200 attacks)
2. **Generate Pairs**: Create all combinations (200 × 199 / 2 = ~20,000 pairs)
3. **Test with Selection**: For each pair:
   - On each turn, score both attacks based on:
     - Current enemy count and HP distribution
     - Defensive profile (Evasive/Tanky/Elite)
     - Active buff configuration
     - Upgrade synergies with situation
   - Use attack with higher score
   - Track which attack was used
4. **Analyze Results**: Calculate performance, usage patterns, synergy scores
5. **Output**: `stage2_pairing_report.md` with top 50 pairs

**Intelligent Selection Algorithm:**
- **Scenario Matching**: AOE for swarms, single-target for bosses
- **Profile Adaptation**: Accuracy vs Evasive, armor piercing vs Tanky
- **Buff Response**: Leverage offensive buffs, counter defensive buffs
- **Upgrade Synergy**: Boss slayer for single targets, culling for cleanup

## Reports Generated

### Stage 1 Report ([stage1_pruning_report.md](reports/stage1/stage1_pruning_report.md))

**Contents:**
- Summary of pruning (total tested, total kept, cutoff values)
- Top 50 attacks overall (ranked by average performance)
- Top attacks per defensive profile (Balanced, Evasive, Tanky, Elite)
- Performance by buff configuration (No Buffs, Offensive, Defensive)

**Key Metrics:**
- **Avg Turns**: Average turns to kill across all test cases
- **vs Profile**: Performance against specific defensive profiles
- **Specialization**: Generalist (low variance) vs Specialist (high variance)

### Stage 2 Report ([stage2_pairing_report.md](reports/stage2/stage2_pairing_report.md))

**Contents:**
- Top 50 attack pairs ranked by overall performance
- For each pair:
  - Attack descriptions and costs
  - Overall average turns to kill
  - Synergy score (% improvement over individual averages)
  - Usage split by defensive profile
  - Usage split by combat scenario
  - Performance breakdown by profile

**Key Metrics:**
- **Overall Avg**: Average turns across all 48 test cases
- **Synergy Score**: % improvement when paired vs individual performance
  - Positive = Complementary (pair performs better)
  - Negative = Redundant (individuals perform better separately)
- **Usage Split**: % of turns each attack was selected
  - High variance = Attacks are specialized for different situations
  - Low variance = Attacks are similar in application

## Understanding the Results

### What Makes a Good Pair?

**High Synergy Score (>10%)**
- Attacks cover different enemy types (e.g., AOE + single-target)
- Complementary specializations (e.g., anti-evasive + anti-tanky)
- Different upgrade focuses (e.g., accuracy + armor piercing)

**Balanced Usage Split (40/60 to 60/40)**
- Both attacks see meaningful use
- Not dominated by one attack
- True tactical flexibility

**Low Variance Across Profiles**
- Consistent performance against all enemy types
- Robust to different combat situations
- Reliable for general use

### Interpreting Usage Patterns

**Attack 1: 80% vs Boss, 20% vs Swarm**
- Specialized for single high-HP targets
- Likely has boss slayer, channeled, or high single-target damage
- Falls back to Attack 2 for multi-target

**Attack 2: 20% vs Boss, 80% vs Swarm**
- Specialized for multiple enemies
- Likely AOE, splinter, or culling strike
- Falls back to Attack 1 for bosses

**Attack 1: 70% vs Evasive, 30% vs Tanky**
- Good accuracy bonuses (accurate_attack, reliable_accuracy)
- Selected when hitting is the challenge

**Attack 2: 30% vs Evasive, 70% vs Tanky**
- High damage or armor piercing (power_attack, brutal, armor_piercing)
- Selected when penetrating defense is the challenge

## Performance Optimization

### Expected Runtimes

- **Stage 1**: 10-20 minutes (~5,000 attacks × 48 tests × 3 runs)
- **Stage 2**: 60-120 minutes (~20,000 pairs × 48 tests × 10 runs)
- **Total**: ~1.5-2.5 hours for full analysis

### Speed vs Accuracy Trade-offs

**Fast Testing (Quick Analysis):**
```json
"stage1": {"simulation_runs": 1, "top_percent": 0.30},
"stage2": {"simulation_runs": 3}
```
- Stage 1: ~5 minutes
- Stage 2: ~20 minutes
- Less accurate, more variance in results

**Balanced Testing (Recommended):**
```json
"stage1": {"simulation_runs": 3, "top_percent": 0.20},
"stage2": {"simulation_runs": 10}
```
- Stage 1: ~15 minutes
- Stage 2: ~90 minutes
- Good accuracy, reasonable runtime

**Accurate Testing (Production):**
```json
"stage1": {"simulation_runs": 5, "top_percent": 0.15},
"stage2": {"simulation_runs": 20}
```
- Stage 1: ~25 minutes
- Stage 2: ~180 minutes
- High accuracy, low variance

### Reducing Runtime

1. **Lower simulation runs** (trades accuracy for speed)
2. **Increase top_percent** in Stage 1 (fewer pruned attacks = fewer pairs in Stage 2)
3. **Run stages separately** (use `--stage 1` then `--stage 2` to split work)
4. **Reduce defensive profiles** (remove Elite to cut tests by 25%)
5. **Reduce buff configs** (remove defensive buffs to cut tests by 50%)

## Troubleshooting

### "ImportError: cannot import name X from src.models"
**Problem**: Cannot import from parent simulation directory
**Solution**: Ensure `/simulation` and `/simulation_v2` exist as siblings of `/simulation_v3`

### "FileNotFoundError: pruned_attacks.json"
**Problem**: Stage 2 can't find Stage 1 cache
**Solution**: Run Stage 1 first: `python main.py --stage 1`

### Stage 1 takes too long
**Solutions:**
- Reduce `simulation_runs` from 3 to 1
- Increase `top_percent` from 0.20 to 0.30
- Remove a defensive profile or buff configuration
- Accept longer runtime (it's a one-time cost for Stage 1 cache)

### Stage 2 takes too long
**Solutions:**
- Reduce `simulation_runs` from 10 to 5
- Increase Stage 1 `top_percent` to reduce pruned attacks (fewer pairs)
- Remove scenarios (Boss + Swarm only, skip Mixed)
- Run overnight or split into multiple sessions

### Results show no synergy (scores near 0%)
**Possible causes:**
- Attacks are too similar (both single-target or both AOE)
- Point budget too low (can't specialize enough)
- Need more diverse pruned attacks (increase `specialist_percent` in Stage 1)

### One attack dominates (90%+ usage)
**Possible causes:**
- One attack is strictly better (higher overall performance)
- Attacks aren't complementary (similar specializations)
- Consider other pairs lower in ranking with more balanced usage

## Architecture

### Directory Structure
```
simulation_v3/
├── config.json                    # Configuration file
├── main.py                        # Entry point
├── stage1_pruning.py             # Attack generation and pruning
├── stage2_pairing.py             # Pairing with intelligent selection
├── combat_with_buffs.py          # Buff support wrapper
├── cache/                        # Stage 1 → Stage 2 data
│   └── pruned_attacks.json       # Pruned attacks from Stage 1
├── reports/
│   ├── stage1/
│   │   └── stage1_pruning_report.md
│   └── stage2/
│       └── stage2_pairing_report.md
├── README.md                     # This file
└── CLAUDE.md                     # Developer documentation
```

### Import Dependencies

**From simulation_v2/src/:**
- `models.py` - Character, AttackBuild, MultiAttackBuild
- `build_generator.py` - Build generation algorithms
- `combat.py` - Attack resolution, dice rolling
- `simulation.py` - Combat simulation loop

**V3-specific modules:**
- `combat_with_buffs.py` - Extends combat with passive buff support
- `stage1_pruning.py` - Attack pruning logic
- `stage2_pairing.py` - Pairing with intelligent selection

## Differences from Simulation V2

### What's New in V3

✅ **Defensive Profile Testing** - Tests against 4 enemy types × 4 buff configs
✅ **Intelligent Attack Selection** - Dynamically chooses attack based on situation
✅ **Usage Analytics** - Shows which attack is used when
✅ **Synergy Analysis** - Quantifies complementarity of pairs
✅ **Two-Stage Pipeline** - Efficient pruning before expensive pairing tests
✅ **Dual-Natured Focus** - Specialized for 2-attack builds only

### What's Different

- **Scope**: V3 only tests dual-natured (V2 tests focused/dual/versatile)
- **Selection**: V3 uses intelligent selection (V2 uses fixed attack priority)
- **Profiles**: V3 tests 4 defensive profiles (V2 uses single balanced profile)
- **Buffs**: V3 simulates passive buffs (V2 doesn't model buffs)
- **Pipeline**: V3 uses two-stage pruning (V2 tests all builds directly)
- **Reports**: V3 shows usage patterns (V2 doesn't track attack selection)

## Credits

Built on the Vitality System combat engine from simulation_v2.
Designed for dual-natured archetype optimization and tactical analysis.
