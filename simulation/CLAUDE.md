# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a combat damage optimization simulator for the Vitality System TTRPG. The project focuses on finding optimal attack builds by simulating turn-by-turn combat scenarios and measuring damage per turn (DPT) and turns to kill (TTK) metrics.

**Key Feature**: The simulator now tests builds against **three different enemy configurations** per simulation:
- Fight 1: 1×100 HP Boss (traditional single-target)
- Fight 2: 2×50 HP Enemies (medium group)
- Fight 3: 4×25 HP Enemies (large group)

This provides realistic performance analysis showing how builds perform across different tactical scenarios, with AOE attacks demonstrating clear advantages against multiple enemies.

## Common Development Tasks

### Running the Simulator
```bash
python damage_optimizer.py
```

This generates detailed combat logs in `combat_log.txt` showing turn-by-turn combat resolution with dice rolls, damage calculations, and special effects.

### Testing Different Builds
The simulator generates and tests all valid build combinations within the 60-point limit, including:
- All attack types (melee, ranged, area, direct_damage, direct_area_damage)
- Single upgrades, two-upgrade combinations, and three-upgrade combinations
- All slayer upgrade variants
- Various limit (unreliable) combinations

Each build is tested with 10 simulation runs across 4 different attacker/defender stat configurations. Each simulation run includes all three enemy scenarios, with the final DPT being the average performance across all scenarios. This comprehensive approach reveals tactical strengths and weaknesses of different build types.

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
- **Triple attacks**: Quick Strikes (any attack type) and Barrage (ranged only) make 3 attacks with penalties
- **Armor Piercing**: Ignores endurance portion of durability, -Tier/2 accuracy penalty
- **Brutal**: Extra damage when exceeding DR by 10+ (50% of excess damage)
- **Critical hits**: Natural 20 or 15-20 with Critical Accuracy
- **Advantage**: Reliable Accuracy grants advantage but with -4 accuracy penalty
- **Slayer bonuses**: Conditional accuracy/damage bonuses based on target HP thresholds

## Data Structures

### Attack Types
```python
ATTACK_TYPES = {
    'melee': choose either +Tier accuracy OR +Tier damage/condition when attacking, adjacent only
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
- **Critical Effect** (20p): Dice explode on 5-6 instead of just 6, -3 damage penalty
- **Armor Piercing** (20p): Ignore endurance portion of durability, -Tier/2 accuracy penalty (rounded up)
- **Brutal** (40p): Extra damage when exceeding DR by 10+ (50% of excess)
- **Accurate Attack** (10p): +Tier accuracy, -Tier damage

#### Multi-Attack Upgrades
- **Quick Strikes** (40p): Attack 3 times, -Tier accuracy and damage per attack
- **Barrage** (60p): Attack 3 times (ranged only), -Tier accuracy and damage per attack
- **Extra Attack** (50p): Make identical attack when hit + effect succeeds
- **Double Tap** (30p): Make identical attack on critical hit (15-20 with Critical Accuracy)

#### Condition & Effect Upgrades
- **Bleed** (60p): Target takes same damage for next 2 turns (replaces existing bleed)
- **Critical Accuracy** (30p): Critical hit on 15-20 instead of just 20
- **Powerful Condition Critical** (20p): +Tier bonus to Damage and Condition rolls on critical hits (requires Critical Accuracy)
- **Reliable Accuracy** (20p): Roll with advantage, -4 penalty to all Accuracy rolls
- **Overhit** (30p): +1 damage per 2 points exceeding avoidance by 5+

#### Finishing Blow Upgrades
- **Finishing Blow** (20p per rank): If attack reduces enemy to (5 × rank) HP or below, enemy is defeated instead. Maximum 3 ranks purchasable. Cannot apply to AOE attacks.

#### Slayer Upgrades
- **Minion Slayer** (20p): +Tier to chosen roll type vs targets ≤10 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Captain Slayer** (20p): +Tier to chosen roll type vs targets ≤25 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Elite Slayer** (20p): +Tier to chosen roll type vs targets ≤50 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Boss Slayer** (20p): +Tier to chosen roll type vs targets ≤100 HP (choose Accuracy, Damage, or Conditions when purchasing)

### Limits (Unreliable Upgrades)
- **Unreliable 1** (30p): +Tier to chosen roll type, DC 5 activation (choose Accuracy, Damage, or Conditions when purchasing)
- **Unreliable 2** (20p): +2×Tier to chosen roll type, DC 10 activation (choose Accuracy, Damage, or Conditions when purchasing)
- **Unreliable 3** (10p): +3×Tier to chosen roll type, DC 15 activation - attack fails entirely on missed rolls (choose Accuracy, Damage, or Conditions when purchasing)


#### Turn-Based Limit Upgrades
- **Quickdraw** (10p): +Tier to chosen roll type (Accuracy, Damage, or Conditions), first round of combat only
- **Steady** (30p): +Tier to chosen roll type (Accuracy, Damage, or Conditions), turn 3 or later
- **Patient** (20p): +Tier to chosen roll type (Accuracy, Damage, or Conditions), turn 5 or later  
- **Finale** (10p): +Tier to chosen roll type (Accuracy, Damage, or Conditions), turn 8 or later
- **Charge Up** (10p): +Tier to chosen roll type (Accuracy, Damage, or Conditions), spend action on previous turn
- **Charge Up 2** (10p): +2×Tier to chosen roll type (Accuracy, Damage, or Conditions), spend actions on previous two turns


## Current Implementation Status

### Completed Features
- ✅ **Multi-Enemy Combat System**: Three fight scenarios per simulation (1v1, 1v2, 1v4)
- ✅ **Enhanced AOE Mechanics**: Shared damage dice, individual accuracy rolls per target
- ✅ **Individual Enemy Tracking**: Separate HP, conditions, and status per enemy
- ✅ **Turn-by-turn combat simulation with detailed logging
- ✅ **All core attack types and upgrade mechanics
- ✅ **Bleed condition tracking with proper replacement rules (per enemy)
- ✅ **Multi-attack handling (Quick Strikes/Barrage)
- ✅ **Comprehensive dice rolling with explosion mechanics
- ✅ **Individual upgrade performance analysis reports
- ✅ **Limit performance analysis with risk/reward metrics

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
- `build_summary.txt`: Top-performing builds ranked by average DPT
- `upgrade_performance_summary.txt`: Individual upgrade analysis and rankings
- `upgrade_ranking_report.txt`: Upgrade and attack type percentile rankings

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
- Multi-enemy scenario breakdowns (1×100, 2×50, 4×25 HP fights)
- Average performance across test configurations
- Top performing builds summary

### 2. Build Summary Report (`build_summary.txt`)
**Purpose**: Top 50 builds ranked by performance
**Content**:
- Top 50 builds ranked by average DPT across all test configurations
- Build details including attack type, upgrades, and limits
- Average DPT performance for each build
- **Attack Type Performance Summary**:
  - Average DPT by attack type
  - Best and worst DPT for each attack type
  - Count of builds using each attack type
  - Ranked by overall performance

### 3. Upgrade Performance Analysis (`upgrade_performance_summary.txt`)
**Purpose**: Individual upgrade effectiveness analysis
**Generated when**: `test_single_upgrades` is enabled in config
**Content**:
- **Cost-Effectiveness Ranking**: Upgrades ranked by DPT improvement per point cost
- **Absolute DPT Improvement Ranking**: Upgrades ranked by raw DPT increase
- **Detailed Per-Upgrade Analysis**:
  - Performance with each compatible attack type
  - Base vs upgraded DPT comparisons
  - Percentage improvements
  - Best attack type pairings for each upgrade

### 4. Upgrade Ranking Report (`upgrade_ranking_report.txt`)
**Purpose**: Percentile-based upgrade and attack type rankings
**Content**:
- **Upgrade Rankings by Average Position**:
  - Every upgrade ranked by average build ranking position
  - Percentile scores (lower percentiles = better performance)
  - Usage frequency and best/worst rankings
- **Attack Type Rankings by Average Position**:
  - Attack types ranked by average build ranking position
  - Percentile performance analysis
  - Usage statistics and performance ranges
- **Percentile Explanation**:
  - 0-25%: Top quartile (excellent performance)
  - 25-50%: Above average performance
  - 50-75%: Below average performance
  - 75-100%: Bottom quartile (poor performance)

### 5. Individual Build Reports (Optional)
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
    ("4×25 HP Enemies", 4, 25)      # Large group tactical
]
```

### Performance Impact Examples
Real test results showing tactical differences:
- **Melee vs 1×100**: 10.2 DPT | **vs 2×50**: 11.4 DPT | **vs 4×25**: 9.6 DPT
- **Area vs 1×100**: 8.1 DPT | **vs 2×50**: 13.2 DPT | **vs 4×25**: 17.9 DPT
- **Area+Bleed vs 1×100**: 13.9 DPT | **vs 2×50**: 26.3 DPT | **vs 4×25**: 29.4 DPT

## Development Notes

When modifying combat mechanics, ensure changes maintain consistency with the Vitality System rules as documented in the README. The multi-enemy system is designed to be modular - new enemy configurations can be added easily.

**Key Implementation Notes:**
- Single-target attacks automatically target the first alive enemy
- AOE attacks use `make_aoe_attack()` function for proper shared dice mechanics
- Enemy defeat is handled dynamically during combat resolution
- DPT calculations account for total HP pool across all enemies in the scenario

The current architecture supports easy extension - new attack types, upgrades, or limits can be added by updating the respective dictionaries and implementing any special effect logic in the attack resolution functions.