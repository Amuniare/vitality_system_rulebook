# REPORTING.md

Comprehensive documentation for the Vitality System Combat Simulator reporting capabilities.

## Overview

The Vitality System Combat Simulator generates over 30 different reports analyzing build performance, upgrade effectiveness, and tactical insights. Reports use both **Damage Per Turn (DPT)** and **Average Turns to Complete** metrics to provide comprehensive combat analysis across multiple enemy scenarios.

### Key Features
- **Multi-Scenario Analysis**: All builds tested against 4 enemy configurations (1×100, 2×50, 4×25, 10×10 HP)
- **Turn-Based Analysis**: NEW - Comprehensive turn efficiency analysis alongside DPT metrics
- **Enhancement Tracking**: Individual and combined upgrade/limit performance analysis
- **Tactical Insights**: Archetype analysis, synergy detection, and strategic recommendations
- **Comparative Analysis**: Build vs individual enhancement performance

## Quick Start Guide

### Running Reports
```bash
# Run full simulation (generates all reports)
python damage_optimizer.py

# Configuration options in config.json:
# - execution_mode: "individual", "build", or "both"
# - various report enablement flags
```

### Understanding Output
- **Lower Turns** = Better Performance (faster combat resolution)
- **Higher DPT** = Better Performance (more damage efficiency)
- **Percentile Rankings**: 0-25% = Top quartile, 75-100% = Bottom quartile
- **Multi-scenario averages** provide realistic tactical effectiveness

## Report Categories

### 1. Build Performance Reports (8 reports)
Core build analysis and ranking reports.

#### `build_summary.txt` ⭐
**Purpose**: Top 50 builds ranked by average DPT across all scenarios
**Content**:
- Build descriptions with attack types, upgrades, and limits
- Average DPT performance across all test configurations
- Attack type performance summary and rankings
- Build cost analysis and point efficiency

#### `build_turns_table.txt` ⭐ **NEW**
**Purpose**: Top 50 builds ranked by average turns (ascending - lower is better)
**Content**:
- Builds sorted by combat completion speed
- Turn efficiency vs DPT comparison
- Original DPT ranking for reference
- Summary statistics (best/worst/average/median turns)

#### `upgrade_pairing_analysis.txt`
**Purpose**: Analysis of upgrade combinations and synergies
**Content**:
- Top 3 builds for each upgrade
- Most common upgrade pairings in high-performing builds
- Synergy analysis within top-performing builds

#### `enhanced_ranking_report.txt`
**Purpose**: Comprehensive percentile-based performance analysis
**Content**:
- Upgrade/limit rankings by average build positions
- Percentile performance analysis (e.g., 20th percentile = top 20% of builds)
- Attack type effectiveness analysis
- Risk/reward ratio analysis

### 2. Enhancement Analysis Reports (6 reports)

#### `enhancement_ranking_report.txt` ⭐ **ENHANCED**
**Purpose**: Enhancement rankings with comprehensive turn analysis
**Content**:
- **PRIMARY RANKING**: By average turns (lower = better)
- **Average turns column**: Overall turn efficiency for each enhancement
- **Top 10% median**: Median turns of top 10% builds using each enhancement
- **Top 50% median**: Median turns of top 50% builds using each enhancement
- **Attack type columns**: Individual turn averages for melee_ac, melee_dg, ranged, area, direct_damage
- Usage statistics and median rank reference

#### `enhancement_comparison.txt` ⭐ **NEW**
**Purpose**: Comparative analysis of enhancement performance in builds vs individual testing
**Content**:
- **6 columns**: Overall average + 5 individual attack type columns
- **Values**: avg_turns_in_builds - avg_turns_individual
- **Negative values**: Enhancement performs better in builds (synergy benefits)
- **Positive values**: Enhancement performs worse in builds (anti-synergy)
- Summary analysis of synergistic vs problematic enhancements

#### `enhancement_performance_summary.txt`
**Purpose**: Individual upgrade and limit effectiveness analysis
**Generated when**: `test_single_upgrades` enabled in config
**Content**:
- Cost-effectiveness rankings (DPT improvement per point cost)
- Absolute DPT improvement rankings
- Detailed per-upgrade analysis across all scenarios
- Best attack type pairings for each enhancement

#### `enhancement_ranking_by_attack_type.txt`
**Purpose**: Enhancement rankings broken down by specific attack types
**Content**:
- Separate rankings for each attack type (melee_ac, melee_dg, ranged, area, direct_damage)
- Three ranking methods per attack type:
  - Rankings by average position
  - Cost-effectiveness rankings
  - Absolute DPT improvement rankings


### 3. Diagnostic & Verification Reports (5 reports)
Technical verification and mechanics testing reports.

#### `diagnostic_base_attacks_report.txt`
**Purpose**: Base attack type mechanics verification
**Content**:
- Turn-by-turn combat resolution for all attack types
- Testing across all enemy configurations (1×100, 2×50, 4×25, 10×10 HP)
- Dice rolls, accuracy checks, and damage calculations

#### `diagnostic_upgrades_report.txt`
**Purpose**: Individual upgrade mechanics demonstration
**Content**:
- Combat resolution showing upgrade effects in action
- Compatibility testing with different attack types
- Special effect verification (exploding dice, bleed, etc.)

#### `diagnostic_limits_report.txt`
**Purpose**: Limit activation and mechanics verification
**Content**:
- Turn-based and unreliable limit activation mechanics
- DC check results and failure handling
- Performance across different combat lengths

#### `scenario_breakdown_upgrades_report.txt`
**Purpose**: Upgrade performance breakdown by individual scenarios
**Content**:
- Performance breakdown for each scenario (1×100, 2×50, 4×25, 10×10 HP)
- Attack type compatibility within each scenario
- Tactical effectiveness identification

#### `scenario_breakdown_limits_report.txt`
**Purpose**: Limit performance breakdown by individual scenarios
**Content**:
- Risk/reward analysis across different tactical situations
- Turn-based limit effectiveness in various combat lengths
- Comprehensive tactical analysis



### 5. Individual & Comparative Reports (4+ reports)

#### `individual_attack_type_table.txt`
**Purpose**: Attack type performance comparison table
**Content**:
- DPT and percentage improvements across all scenarios
- Individual attack type baseline performance

#### `individual_attack_type_turns_table.txt`
**Purpose**: Attack type turns performance analysis
**Content**:
- Turn efficiency comparison across attack types
- Performance sorted by average turns (lowest to highest)

#### `individual_upgrade_limit_turns_[attack_type]_table.txt` (5 files)
**Purpose**: Attack-type-specific upgrade/limit performance tables
**Generated when**: `upgrade_limit_table` enabled in individual_reports config
**Files**:
- `individual_upgrade_limit_turns_melee_ac_table.txt`
- `individual_upgrade_limit_turns_melee_dg_table.txt`
- `individual_upgrade_limit_turns_ranged_table.txt`
- `individual_upgrade_limit_turns_area_table.txt`
- `individual_upgrade_limit_turns_direct_damage_table.txt`

**Content**:
- Turn reduction efficiency per point cost for specific attack types
- Performance across all 4 scenarios
- Top 5 recommendations per attack type
- Only shows compatible upgrades/limits



#### `build_comparison_tool.txt`
**Purpose**: Side-by-side build analysis
**Content**:
- AOE vs Single-Target specialist comparisons
- Reliable vs Unreliable power trade-offs
- Point efficiency comparisons across cost ranges

#### Individual Build Reports
**Purpose**: Deep-dive analysis of specific builds
**Generated when**: `generate_individual_logs` enabled
**Content**:
- Detailed performance across all test configurations
- Individual simulation results and turn-by-turn breakdowns

## Usage Workflows

### Build Optimization Workflow
1. **Start with** `build_summary.txt` or `build_turns_table.txt` to see top performers
2. **Use** `build_recommendation_engine.txt` to find builds matching your playstyle
3. **Check** archetype reports (`archetype_multi_target_specialists.txt` or `archetype_single_target_specialists.txt`) based on expected encounters
4. **Review** attack-type-specific tables for detailed upgrade recommendations
5. **Use** `enhancement_ranking_report.txt` to understand which upgrades consistently perform well
6. **Check** `tactical_point_efficiency_analysis.txt` for optimal spending at your budget

### Game Balance Analysis Workflow
1. **Review** attack type performance in `tactical_attack_type_viability.txt`
2. **Analyze** upgrade percentile rankings in `enhancement_ranking_report.txt`
3. **Use** `archetype_risk_reward_analysis.txt` to understand risk/reward balance
4. **Check** `tactical_upgrade_synergy_matrix.txt` for problematic combinations
5. **Examine** `enhancement_comparison.txt` for synergy vs anti-synergy patterns

### Player Guidance Workflow
1. **Start with** `build_recommendation_engine.txt` for playstyle-specific recommendations
2. **Use** `build_comparison_tool.txt` to understand trade-offs between builds
3. **Check** `tactical_attack_type_viability.txt` for situational attack type selection
4. **Review** scenario deep dive reports for tactical tips and common mistakes

### Developer Testing Workflow
1. **Use** diagnostic reports to verify mechanics are working correctly
2. **Check** scenario breakdown reports to understand performance across different situations
3. **Review** enhancement comparison reports to identify unintended synergies or anti-synergies
4. **Analyze** point efficiency reports to identify cost imbalances

## Technical Configuration

### Report Generation Control
Configuration options in `config.json`:

```json
{
  "execution_mode": "both",  // "individual", "build", or "both"
  "reports": {
    "individual_reports": {
      "enabled": true,
      "upgrade_limit_table": true,
      "enhanced_analysis": true
    },
    "build_reports": {
      "enabled": true,
      "archetype_analysis": true,
      "tactical_analysis": true
    }
  }
}
```

### Performance Considerations
- **Full simulation**: 2+ minutes for complete build testing
- **Individual reports only**: < 30 seconds
- **Memory usage**: Large builds datasets require adequate RAM
- **Parallel processing**: Configurable worker threads for build testing

## Key Metrics Explained

### Damage Per Turn (DPT)
- **Higher is better**
- Calculated as: Total HP Pool ÷ Average Turns
- Accounts for multi-enemy scenarios (e.g., 4×25 HP = 100 total HP)

### Average Turns
- **Lower is better**
- Average number of turns to defeat all enemies in a scenario
- New primary ranking metric for turn-based analysis

### Percentile Rankings
- **0-25%**: Top quartile (excellent performance)
- **25-50%**: Above average performance
- **50-75%**: Below average performance
- **75-100%**: Bottom quartile (poor performance)

### Multi-Scenario Averaging
All builds tested against 4 scenarios:
- **1×100 HP Boss**: Traditional single-target
- **2×50 HP Enemies**: Medium group tactical
- **4×25 HP Enemies**: Large group tactical
- **10×10 HP Enemies**: Swarm scenario

Final metrics are averages across all scenarios to provide realistic tactical effectiveness.

## Troubleshooting

### Common Issues

**Q: Reports are missing or incomplete**
A: Check `config.json` execution_mode and report enablement flags

**Q: Performance seems incorrect**
A: Verify test configurations in config.json and check diagnostic reports

**Q: Turn analysis shows unexpected results**
A: Compare with DPT metrics in build_summary.txt - some builds optimize for different metrics

**Q: Enhancement comparison shows zeros**
A: Ensure both individual and build testing are enabled (`execution_mode: "both"`)

### Report Dependencies
- **Enhancement comparison**: Requires both individual and build testing
- **Attack-type-specific tables**: Requires individual reports enabled
- **Archetype analysis**: Requires build testing with sufficient data
- **Tactical reports**: Require comprehensive build datasets

## Report File Locations

All reports are generated in timestamped directories:
```
reports/
├── reports_YYYYMMDD-HHMMSS/
│   ├── build_summary.txt
│   ├── build_turns_table.txt          # NEW
│   ├── enhancement_ranking_report.txt  # ENHANCED
│   ├── enhancement_comparison.txt      # NEW
│   ├── diagnostic_*.txt
│   ├── archetype_*.txt
│   ├── tactical_*.txt
│   └── individual_*.txt
```

## Performance Analysis Tips

### Interpreting Turn vs DPT Rankings
- **Turn rankings**: Emphasize combat speed and efficiency
- **DPT rankings**: Emphasize damage output potential
- **Best builds**: Often excel in both metrics
- **Situational builds**: May rank differently in each metric

### Understanding Enhancement Synergies
- **Negative values** in enhancement_comparison.txt indicate synergy benefits
- **Positive values** indicate builds perform worse than individual testing
- **Large differences** (>1.0 turns) indicate significant synergy/anti-synergy effects

### Multi-Scenario Performance
- **Balanced builds**: Perform consistently across all scenarios
- **Specialist builds**: Excel in specific scenarios but may underperform in others
- **AOE builds**: Typically improve performance as enemy count increases
- **Single-target builds**: Often best against 1×100 HP scenarios

---

*For development guidance and implementation details, see CLAUDE.md*