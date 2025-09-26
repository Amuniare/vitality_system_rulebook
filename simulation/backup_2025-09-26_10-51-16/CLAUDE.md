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

## Architecture and Core Systems

### Character System
- **Character class**: Represents both attackers and defenders with stats (focus, power, mobility, endurance, tier)
- **Derived stats**: Avoidance (5 + tier + mobility), Durability (tier + endurance)

### Combat Resolution
1. **Limit checks**: Roll d20 vs DC for unreliable upgrades
2. **Accuracy check**: 1d20 + tier + focus vs target avoidance (skipped for direct attacks)
3. **Damage calculation**: 3d6 + tier + power + modifiers - durability
4. **Special effects**: Exploding dice, flat damage, triple attacks, bleed, brutal
5. **Multi-target handling**: AOE attacks use shared damage dice but individual accuracy rolls per target

### Attack Build System
- **Attack Build class**: Combines attack type, upgrades, and limits
- **Cost validation**: Ensures builds stay within point budgets (60 points for Tier 3)
- **Modular upgrades**: Each upgrade modifies accuracy, damage, or adds special effects

### Key Game Mechanics Implemented
- **Exploding dice**: 6s explode normally, 5-6s explode with Critical Effect
- **Bleed condition**: Target takes same damage for 2 additional turns (replaces existing bleed)
- **Triple attacks**: Quick Strikes make 3 attacks with penalties
- **Armor Piercing**: Ignores endurance portion of durability, -Tier/2 accuracy penalty
- **Brutal**: Extra damage when exceeding DR by 10+ (50% of excess damage)
- **Critical hits**: Natural 20 or 15-20 with Critical Accuracy, on a critical hit, increase damage by tier
- **Advantage**: Reliable Accuracy grants advantage but with -4 accuracy penalty
- **Slayer bonuses**: Conditional accuracy/damage bonuses based on target HP thresholds

## Data Structures

### Attack Types
```python
ATTACK_TYPES = {
    'melee_ac': melee with +Tier accuracy bonus, adjacent only
    'melee_dg': melee with +Tier damage bonus, adjacent only
    'ranged': no bonuses, -Tier if adjacent
    'area': -Tier accuracy penalty
    'direct_damage': flat (13-Tier) damage, no roll
    'direct_area_damage': flat (13-2�Tier) damage, no roll
}
```

### All Upgrades (with costs and mechanics)

#### Core Combat Upgrades
- **Power Attack** (10p): +Tier damage, -Tier accuracy
- **High Impact** (20p): Flat 15 damage instead of 3d6 roll
- **Critical Effect** (20p): Dice explode on 5-6 instead of just 6, -2 damage penalty
- **Armor Piercing** (20p): Ignore endurance portion of durability
- **Brutal** (40p): Extra damage when exceeding DR by 10+ (50% of excess)
- **Accurate Attack** (10p): +Tier accuracy, -Tier damage

#### Multi-Attack Upgrades
- **Quick Strikes** (60p): Attack 3 times (non-AOE attacks only), -Tier accuracy and damage per attack
- **Extra Attack** (50p): Make identical attack when hit + effect succeeds
- **Double Tap** (30p): Make identical attack on critical hit (15-20 with Critical Accuracy)

#### Condition & Effect Upgrades
- **Bleed** (40p): Target takes same damage for next 2 turns (replaces existing bleed)
- **Critical Accuracy** (30p): Critical hit on 15-20 instead of just 20
- **Powerful Condition Critical** (20p): +Tier bonus to Damage and Condition rolls on critical hits (requires Critical Accuracy)
- **Reliable Accuracy** (20p): Roll with advantage, -3 penalty to all Accuracy rolls
- **Overhit** (30p): +1 damage per 2 points exceeding avoidance by 5+

#### Finishing Blow Upgrades
- **Finishing Blow**: If attack reduces enemy to (5 × rank) HP or below, enemy is defeated instead. Cannot apply to AOE attacks.
  - **Rank 1** (20p): ≤5 HP threshold
  - **Rank 2** (30p): ≤10 HP threshold
  - **Rank 3** (40p): ≤15 HP threshold

#### Slayer Upgrades
- **Minion Slayer** (20p): +Tier to chosen roll type vs targets ≤10 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Captain Slayer** (20p): +Tier to chosen roll type vs targets ≤25 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Elite Slayer** (20p): +Tier to chosen roll type vs targets ≤50 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Boss Slayer** (20p): +Tier to chosen roll type vs targets ≤100 HP (choose Accuracy, Damage, or Conditions when purchasing)

### Limits (Unreliable Upgrades)
- **Unreliable 1** (30p): +Tier to Accuracy and Damage, DC 5 activation
- **Unreliable 2** (20p): +2×Tier to Accuracy and Damage, DC 10 activation
- **Unreliable 3** (20p): +4×Tier to Accuracy and Damage, DC 15 activation - attack fails entirely on missed rolls


#### Turn-Based Limit Upgrades
- **Quickdraw** (10p): +2×Tier to Accuracy and Damage, turns 1-2 only
- **Steady** (40p): +Tier to Accuracy and Damage, turn 4 or later
- **Patient** (20p): +Tier to Accuracy and Damage, turn 5 or later
- **Finale** (10p): +2×Tier to Accuracy and Damage, turn 8 or later
- **Charge Up** (10p): +2×Tier to Accuracy and Damage, spend action on previous turn
- **Charge Up 2** (10p): +3×Tier to Accuracy and Damage, spend actions on previous two turns


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
- `combat_log.txt`: Detailed turn-by-turn combat logs with multi-enemy scenarios
- `build_summary.txt`: Top 50 builds ranked by average DPT
- `upgrade_performance_summary.txt`: Individual upgrade and limit analysis and rankings
- `upgrade_ranking_report.txt`: Upgrade, limit, and attack type percentile rankings
- `enhanced_ranking_report.txt`: Comprehensive percentile-based performance analysis with average build positions
- `diagnostic_base_attacks_report.txt`: Base attack type mechanics across all scenarios
- `diagnostic_upgrades_report.txt`: Individual upgrade mechanics across all scenarios
- `diagnostic_limits_report.txt`: Individual limit mechanics across all scenarios

**Configuration:**
- `config.json`: Simulation parameters and test case configurations
- `README.md`: Project documentation and rules reference

## Reports Generated

The simulator produces comprehensive analytical reports to help understand build performance and optimization patterns:

### 1. Combat Log (`combat_log.txt`)
**Purpose**: Detailed turn-by-turn combat simulation logs
**Content**:
- Individual build testing results with full combat resolution
- Dice rolls, damage calculations, and special effects activation
- Multi-enemy scenario breakdowns (1×100, 2×50, 4×25, 10×10 HP fights)
- Average performance across test configurations
- Top performing builds summary

### 2. Build Summary Report (`build_summary.txt`)
**Purpose**: Top 50 builds ranked by performance
**Content**:
- **Top 50 builds ranked by average DPT across all test configurations**
- Build details including attack type, upgrades, and limits
- Average DPT performance for each build
- **Attack Type Performance Summary**:
  - Average DPT by attack type
  - Best and worst DPT for each attack type
  - Count of builds using each attack type
  - Ranked by overall performance

### 3. Upgrade & Limit Performance Analysis (`upgrade_performance_summary.txt`)
**Purpose**: Individual upgrade and limit effectiveness analysis across all enemy scenarios
**Generated when**: `test_single_upgrades` is enabled in config
**Content**:
- **Upgrade Cost-Effectiveness Ranking**: Upgrades ranked by DPT improvement per point cost
- **Limit Cost-Effectiveness Ranking**: Limits ranked by DPT improvement per point cost
- **Absolute DPT Improvement Rankings**: Upgrades and limits ranked by raw DPT increase
- **Detailed Per-Upgrade Analysis**:
  - Performance with each compatible attack type across all scenarios (1v1, 1v2, 1v4, 1v10)
  - Base vs upgraded DPT comparisons
  - Percentage improvements
  - Best attack type pairings for each upgrade
- **Detailed Per-Limit Analysis**:
  - Performance across all attack types and scenarios
  - Risk/reward analysis for unreliable limits
  - Turn-based activation effectiveness

### 4. Upgrade, Limit & Attack Type Ranking Report (`upgrade_ranking_report.txt`)
**Purpose**: Percentile-based upgrade, limit, and attack type rankings
**Content**:
- **Upgrade Rankings by Average Position**:
  - Every upgrade ranked by average build ranking position
  - Percentile scores (lower percentiles = better performance)
  - Usage frequency and best/worst rankings
- **Limit Rankings by Average Position**:
  - Every limit ranked by average build ranking position
  - Percentile performance analysis showing reliability vs. power trade-offs
  - Usage statistics and performance ranges
- **Attack Type Rankings by Average Position**:
  - Attack types ranked by average build ranking position
  - Percentile performance analysis
  - Usage statistics and performance ranges
- **Percentile Explanation**:
  - 0-25%: Top quartile (excellent performance)
  - 25-50%: Above average performance
  - 50-75%: Below average performance
  - 75-100%: Bottom quartile (poor performance)

### 5. Enhanced Build Performance Ranking Report (`enhanced_ranking_report.txt`)
**Purpose**: Comprehensive upgrade, limit, and attack type performance analysis with percentile rankings based on average build positions
**Content**:
- **Upgrade Performance Rankings**:
  - Every upgrade ranked by their average build ranking position across all builds that use them
  - Percentile scores showing where each upgrade typically places (e.g., 20th percentile = top 20% of builds)
  - For example: If 40,000 total builds exist and an upgrade's average ranking is 20,000, that's 50th percentile (middle performance)
  - If average ranking is 10,000, that's 75th percentile (top 25% performance)
  - Usage statistics and performance consistency metrics
- **Limit Performance Rankings**:
  - Every limit ranked by their average build ranking position across all builds that use them
  - Percentile analysis showing typical performance placement
  - Risk/reward analysis comparing unreliable vs turn-based limits
  - Performance consistency across different build configurations
- **Attack Type Performance Rankings**:
  - Attack types ranked by their average build ranking position
  - Percentile performance showing which attack types typically produce higher-ranking builds
  - Performance analysis across different enemy scenarios (1v1, 1v2, 1v4, 1v10)
  - Synergy analysis with different upgrade categories

### 6. Diagnostic Mechanics Reports
**Purpose**: Detailed combat mechanics verification across all scenarios
**Generated**: Automatically with each run
**Content**:

#### Base Attacks Report (`diagnostic_base_attacks_report.txt`)
- Turn-by-turn combat resolution for all attack types
- Testing across 1×100, 2×50, 4×25, and 10×10 HP enemy configurations
- Dice rolls, accuracy checks, and damage calculations

#### Upgrades Report (`diagnostic_upgrades_report.txt`)
- Individual upgrade mechanics demonstration
- Combat resolution showing upgrade effects in action
- Compatibility testing with different attack types

#### Limits Report (`diagnostic_limits_report.txt`)
- Turn-based and unreliable limit activation mechanics
- DC check results and failure handling
- Performance across different combat lengths and scenarios

#### Scenario Breakdown Reports (NEW)
- **Upgrade Scenario Breakdown** (`scenario_breakdown_upgrades_report.txt`):
  - Performance of each upgrade broken down by individual scenario (1×100, 2×50, 4×25, 10×10 HP)
  - Performance broken down by attack type within each scenario
  - Shows tactical effectiveness across different enemy configurations
  - Ideal for identifying upgrades that excel in specific situations (single-target vs multi-target)

- **Limit Scenario Breakdown** (`scenario_breakdown_limits_report.txt`):
  - Performance of each limit broken down by individual scenario and attack type
  - Risk/reward analysis for unreliable limits across different tactical situations
  - Turn-based limit effectiveness in different combat length scenarios
  - Comprehensive tactical analysis showing when each limit provides maximum benefit

### 7. Individual Build Reports
**Purpose**: Deep-dive analysis of specific builds
**Generated when**: `generate_individual_logs` is enabled in config
**Content**:
- Detailed performance across all test configurations
- Individual simulation results
- Turn-by-turn breakdowns for specific builds

### Report Usage Guide

**For Build Optimization**:
1. Start with `build_summary.txt` to see top-performing builds
2. Use `upgrade_ranking_report.txt` to understand which upgrades consistently perform well
3. Check `upgrade_performance_summary.txt` for cost-effectiveness analysis

**For Game Balance**:
1. Review attack type performance in both summary reports
2. Analyze upgrade percentile rankings to identify over/under-powered options
3. Use combat logs to understand mechanical interactions

**For Tactical Analysis**:
1. Compare multi-enemy scenario performance in combat logs
2. Identify AOE vs single-target build effectiveness
3. Analyze upgrade synergies through detailed performance reports

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

When modifying combat mechanics, ensure changes maintain consistency with the Vitality System rules as documented in the README. The multi-enemy system is designed to be modular - new enemy configurations can be added easily.

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
- **CLAUDE.md**: This file - the authoritative specification document

### 2. Documentation Files (REQUIRED)
- **CHANGELOG.md**: Add version entry with rationale for changes
- **notes.md**: Update or clean up conflicting change records

### 3. Files That May Contain References (CHECK)
- **build_generator.py**: Cost calculations, build validation
- **reporting.py**: Performance analysis, cost-effectiveness calculations
- **models.py**: Cost calculation methods
- **simulation.py**: Combat resolution, limit applications
- **damage_optimizer.py**: Main simulation orchestrator

### 4. Systematic Update Process
1. **Update CLAUDE.md first** (source of truth)
2. **Update game_data.py** (implementation)
3. **Update combat.py** (mechanics logic)
4. **Update CHANGELOG.md** (document changes)
5. **Clean notes.md** (remove conflicting records)
6. **Search-verify remaining files** using grep patterns
7. **Test changes** with quick diagnostic runs

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
# 1. Make changes to CLAUDE.md specifications
# 2. Update game_data.py
# 3. Update combat.py logic
# 4. Verify no old values remain:
grep -r "critical_effect.*20" .  # Should return nothing if 10p update complete
grep -r "steady.*turn.*4" .      # Should return nothing if turn 3+ update complete
# 5. Test with quick diagnostic
python -c "from game_data import UPGRADES; print(UPGRADES['critical_effect'].cost)"
```

This systematic approach prevents incomplete updates and ensures consistency across all files.