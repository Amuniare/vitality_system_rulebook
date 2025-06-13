# Vitality Simulation & Optimization Engine

## Overview

The Vitality Simulation & Optimization Engine is a comprehensive system for automated character generation, combat simulation, and game balance analysis for the Vitality RPG. The engine operates in a closed-loop cycle of generation, simulation, analysis, and optimization to provide deep insights into game mechanics and balance.

## Architecture

The engine consists of four modular components that form a data pipeline:

```
+------------------+     +-----------------+     +-------------------+     +-----------------+
|                  |     |                 |     |                   |     |                 |
|   1. The Foundry | --> |  2. The Crucible| --> |   3. The Oracle   | --> |  4. The Golem   |
| (Plan Generation)|     | (Simulation)    |     | (Data Analysis)   |     | (ML Optimization)|
|                  |     |                 |     |                   |     |                 |
+------------------+     +-----------------+     +-------------------+     +-----------------+
        |                        |                       |                       |
        v                        v                       v                       v
  [Plan Files] ----> [Character JSONs] ----> [Performance Logs] ----> [Balance Insights &
   (JSON)             (from UI test)          (CSV / Database)         Trained Models]
```

### 1. The Foundry (Character Plan Generator)

**Purpose:** Mass-produces diverse, rule-aware character creation plans using AI.

**Components:**
- `tools/Brain.js` - LLM API wrapper with error handling and retry logic
- `tools/generate_plans.js` - Main plan generation script
- `tests/prompts/01_generate_build_concept.txt` - Character concept prompts

**Usage:**
```bash
# Generate 10 plans (default)
npm run generate-plans

# Generate specific number
node tools/generate_plans.js 100

# With custom count
node tools/generate_plans.js --count 50
```

### 2. The Crucible (Combat Simulation Engine)

**Purpose:** Executes deterministic, repeatable combat simulations based on game rules.

**Components:**
- `simulation/engine/core/rule_engine.py` - Pure functions for combat math
- `simulation/engine/core/character_loader.py` - Character JSON parsing and validation
- `simulation/engine/core/combat_state.py` - Combat state machine and turn management
- `simulation/engine/ai/opponent_ai.py` - Deterministic enemy AI
- `simulation/engine/main.py` - Command-line interface for single simulations

**Usage:**
```bash
# Single simulation
npm run simulate -- --character characters/gen/char_001.json --scenario simulation/scenarios/duel.json

# With verbose output
python3 simulation/engine/main.py -c char.json -s scenario.json --verbose

# Validation only
python3 simulation/engine/main.py -c char.json -s scenario.json --validate-only
```

### 3. The Oracle (Performance Analyzer)

**Purpose:** Processes simulation results to generate game balance insights and identify outliers.

**Components:**
- `tools/run_gauntlet.py` - Mass simulation orchestrator
- `simulation/analysis/analyzer.py` - Statistical analysis and reporting
- `simulation/analysis/reports/` - Generated reports and visualizations

**Usage:**
```bash
# Run all characters against all scenarios
npm run run-gauntlet

# Parallel processing with custom workers
python3 tools/run_gauntlet.py --workers 8 --verbose

# Generate analysis report
npm run analyze -- --input simulation/analysis/gauntlet_results_20250611_123456.csv --visualizations
```

### 4. The Golem (ML Optimization) - *Future Phase*

**Purpose:** Train machine learning models to generate optimized characters.

*Note: This component is planned for future implementation using reinforcement learning.*

## Data Formats

### Plan Files (`tests/plans/plan_XXX.json`)

```json
{
  "metadata": {
    "id": "001",
    "generatedAt": "2025-06-11T00:00:00.000Z",
    "concept": {
      "name": "The Architect",
      "focus": "A brilliant inventor who uses custom-built drones for battlefield control"
    },
    "stepCount": 6,
    "generator": "PlanGenerator v1.0"
  },
  "steps": [
    {
      "action": "choose_archetypes",
      "payload": {
        "movement": "swift",
        "utility": "analyst",
        "combat": "specialist"
      }
    },
    {
      "action": "distribute_attributes",
      "payload": {
        "combat": { "accuracy": 2, "damage": 1, "defense": 1 },
        "utility": { "focus": 3, "intelligence": 4, "perception": 2 }
      }
    }
  ]
}
```

### Character Files (`characters/gen/char_XXX.json`)

Character files follow the VitalityCharacter.js data model:

```json
{
  "basicInfo": {
    "name": "The Architect",
    "tier": 1,
    "characterType": "hero"
  },
  "archetypes": {
    "movement": "swift",
    "utility": "analyst",
    "combat": "specialist"
  },
  "attributes": {
    "combat": { "accuracy": 2, "damage": 1, "defense": 1 },
    "utility": { "focus": 3, "intelligence": 4, "perception": 2 }
  },
  "specialAttacks": [...],
  "utilityAbilities": [...]
}
```

### Scenario Files (`simulation/scenarios/scenario_name.json`)

```json
{
  "name": "Elite Duel",
  "description": "Single powerful enemy test",
  "difficulty": "high",
  "victory_conditions": {
    "player_victory": "Defeat the elite enemy",
    "enemy_victory": "Defeat all player characters"
  },
  "enemies": [
    {
      "type": "elite",
      "name": "Corporate Enforcer",
      "tier": 2,
      "stats": { "accuracy": 4, "damage": 3, "defense": 3 },
      "hp": 35,
      "ai_personality": "tactical"
    }
  ]
}
```

### Results CSV (`simulation/analysis/gauntlet_results_TIMESTAMP.csv`)

```csv
character_id,character_name,scenario_name,victory_result,rounds_completed,total_damage_dealt,total_damage_taken,...
char_001,The Architect,Elite Duel,player_victory,6,28,15,...
char_002,Tank Specialist,Minion Swarm,player_victory,4,35,8,...
```

## Installation & Setup

### Prerequisites

- **Node.js** 16.0.0 or higher
- **Python** 3.8.0 or higher
- **Google AI API Key** (for plan generation)

### Installation

1. **Install Node.js dependencies:**
```bash
npm install
```

2. **Install Python dependencies:**
```bash
pip install -r simulation/requirements.txt
```

3. **Set up environment variables:**
```bash
# Create .env file
echo "GEMINI_API_KEY=your-api-key-here" > .env
```

4. **Verify installation:**
```bash
# Test character builder
npm test

# Test simulator
python3 simulation/engine/main.py --help
```

## Workflow Examples

### Complete Analysis Pipeline

```bash
# 1. Generate character plans
npm run generate-plans 100

# 2. Execute plans to create characters (via Playwright tests)
npm test

# 3. Run mass simulations
npm run run-gauntlet

# 4. Analyze results
npm run analyze -- --input simulation/analysis/gauntlet_results_*.csv --visualizations
```

### Custom Simulation

```bash
# Create a specific character build manually, then test against scenarios
python3 simulation/engine/main.py \
  --character characters/gen/custom_character.json \
  --scenario simulation/scenarios/captain_and_crew.json \
  --verbose \
  --output custom_results.json
```

### Targeted Analysis

```bash
# Analyze only high-tier characters
python3 tools/run_gauntlet.py \
  --characters-dir characters/tier2 \
  --verbose

python3 simulation/analysis/analyzer.py \
  --input simulation/analysis/gauntlet_results_*.csv \
  --outlier-threshold 1.5 \
  --visualizations
```

## Performance Tuning

### Parallel Processing

The gauntlet runner supports parallel execution:

```bash
# Use 8 parallel workers
python3 tools/run_gauntlet.py --workers 8

# Force sequential processing (for debugging)
python3 tools/run_gauntlet.py --sequential
```

### Memory Management

For large datasets:

```bash
# Process in smaller batches
python3 tools/run_gauntlet.py --batch-size 50

# Limit character count
node tools/generate_plans.js 25
```

### API Rate Limiting

Plan generation respects API limits:

- Default: 500ms delay between requests
- Exponential backoff on failures
- Configurable retry attempts

## Troubleshooting

### Common Issues

**1. Plan Generation Fails**
```bash
# Check API key
echo $GEMINI_API_KEY

# Test with single plan
node tools/generate_plans.js 1 --verbose
```

**2. Character Creation Fails**
```bash
# Validate character builder
npm test

# Check specific plan
python3 simulation/engine/main.py --validate-only -c char.json -s scenario.json
```

**3. Simulation Errors**
```bash
# Enable detailed logging
python3 simulation/engine/main.py -c char.json -s scenario.json --verbose

# Check character and scenario files
python3 -c "import json; print(json.load(open('char.json')))"
```

**4. Analysis Issues**
```bash
# Verify CSV format
head -5 simulation/analysis/gauntlet_results_*.csv

# Test with smaller dataset
python3 simulation/analysis/analyzer.py --input small_results.csv --verbose
```

### Debugging Tools

**Validation Mode:**
```bash
python3 simulation/engine/main.py --validate-only -c char.json -s scenario.json
```

**Verbose Logging:**
```bash
python3 tools/run_gauntlet.py --verbose --sequential
```

**Partial Analysis:**
```bash
python3 simulation/analysis/analyzer.py --report-only -i results.csv
```

## Success Metrics

### Phase 1 (Foundry)
- ✅ Generate 100+ unique, valid plan files
- ✅ Execute all plans via Playwright to produce character JSONs

### Phase 2 (Crucible)  
- ✅ Load characters and scenarios successfully
- ✅ Produce deterministic, repeatable simulation results

### Phase 3 (Gauntlet)
- ✅ Run 100 characters × 3 scenarios with no errors
- ✅ Generate well-formatted CSV results

### Phase 4 (Oracle)
- ✅ Identify top 3 most/least effective archetypes per scenario
- ✅ Generate data visualizations and balance reports

## Future Development

### Planned Features

1. **Enhanced AI Personalities** - More sophisticated enemy behavior patterns
2. **Dynamic Scenarios** - Procedurally generated encounter variations  
3. **Machine Learning Integration** - The Golem optimization component
4. **Real-time Analysis** - Live balance monitoring during development
5. **Web Dashboard** - Interactive visualization and reporting interface

### Extension Points

The system is designed for extensibility:

- **New Scenarios:** Add JSON files to `simulation/scenarios/`
- **Custom AI:** Extend `OpponentAI` class with new personalities
- **Analysis Metrics:** Add new calculations to `simulation/analysis/analyzer.py`
- **Export Formats:** Extend `run_gauntlet.py` output options

## Contributing

When extending the system:

1. **Follow Data Contracts** - Maintain JSON schema compatibility
2. **Add Tests** - Include validation for new components
3. **Update Documentation** - Document new features and usage
4. **Performance Testing** - Verify scalability with large datasets

## License

This simulation engine is part of the Vitality RPG system. See project root for licensing information.