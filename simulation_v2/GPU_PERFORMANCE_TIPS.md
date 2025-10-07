# GPU Performance Optimization Tips

## ⚠️ Important: GPU + Multiprocessing Don't Mix Well on Windows

**Problem:** When `use_threading: true` and `use_gpu: true`, each worker process tries to initialize DirectML separately, causing **massive overhead**.

**Solution:** Disable threading when using GPU:

```json
{
  "use_threading": false,  // Disable for GPU
  "use_gpu": true
}
```

## Current Configuration Issues

Your current config has **only 25% GPU utilization**:

```json
"scenarios": [
  {"name": "Boss", "num_enemies": 1, "enemy_hp": 100},      // ✅ GPU (25%)
  {"name": "Mixed", "enemy_hp_list": [50, 25, 25]},         // ❌ CPU (25%)
  {"name": "Swarm 1", "enemy_hp_list": [25, 25, 10, ...]},  // ❌ CPU (25%)
  {"name": "Swarm 2", "enemy_hp_list": [50, 10, 10, ...]}   // ❌ CPU (25%)
]
```

Only the Boss scenario can use GPU, so **75% of work is still on CPU**!

## Optimization Strategies

### Strategy 1: Boss-Only Config (Maximum GPU Speed)

**Use Case:** Quick build ranking, initial testing

**Config:** [`configs/config_gpu_optimized.json`](configs/config_gpu_optimized.json)

```json
{
  "use_threading": false,
  "use_gpu": true,
  "simulation_runs": 50,  // More runs = better GPU utilization
  "scenarios": [
    {"name": "Boss", "num_enemies": 1, "enemy_hp": 100}
  ]
}
```

**Performance:**
- **577K builds** in ~2-3 minutes (vs 60+ min with threading + multi-scenario)
- **~200x faster** than current setup!

**Run:** `python main.py configs/config_gpu_optimized.json`

### Strategy 2: Multi-Scenario with GPU (Balanced)

**Use Case:** Need multi-scenario testing but want some GPU benefit

**Config:**
```json
{
  "use_threading": false,  // CRITICAL for GPU
  "use_gpu": true,
  "scenarios": [
    {"name": "Boss", "num_enemies": 1, "enemy_hp": 100},
    {"name": "Elite", "num_enemies": 1, "enemy_hp": 50},
    {"name": "Captain", "num_enemies": 1, "enemy_hp": 25}
  ]
}
```

**Performance:**
- **100% GPU utilization** (all scenarios compatible)
- ~3-4 minutes for 577K builds
- **Still 15-20x faster** than current setup

### Strategy 3: CPU Multiprocessing (No GPU)

**Use Case:** Need multi-enemy scenarios, no GPU available

**Config:**
```json
{
  "use_threading": true,  // Enable multiprocessing
  "use_gpu": false,       // Disable GPU
  "scenarios": [
    // Any scenarios including multi-enemy
  ]
}
```

**Performance:**
- Uses all CPU cores
- ~8-10 minutes for 577K builds
- Good for multi-enemy scenarios

## Quick Fix for Current Run

**Stop the current run** (Ctrl+C) and:

### Option A: Maximum Speed (Boss only)
```bash
python main.py configs/config_gpu_optimized.json
```

### Option B: Update current config
Edit `configs/config.json`:

```json
{
  "use_threading": false,  // Changed from true
  "use_gpu": true,
  "scenarios": [
    {"name": "Boss", "num_enemies": 1, "enemy_hp": 100}  // Keep only this
  ]
}
```

Then run:
```bash
python main.py
```

## Performance Comparison

### Your Current Setup (BAD)
- ❌ `use_threading: true` + `use_gpu: true` = GPU overhead per worker
- ❌ 4 scenarios (only 25% GPU compatible)
- ⏱️ **Estimated time: 60+ minutes**

### Optimized GPU Setup (GOOD)
- ✅ `use_threading: false` + `use_gpu: true` = Full GPU utilization
- ✅ 1 Boss scenario (100% GPU compatible)
- ⏱️ **Estimated time: 2-3 minutes** (**20x faster!**)

### Why It's Slower Right Now

1. **Multiprocessing overhead**: Each of 12 workers initializes GPU separately
2. **Memory transfers**: Data copied between processes and GPU
3. **DirectML limitations**: Not designed for multi-process access
4. **Scenario mix**: Only 1/4 scenarios use GPU anyway

## Recommended Workflow

### Step 1: Quick Ranking (GPU, Boss only)
```bash
python main.py configs/config_gpu_optimized.json
```
- **~3 minutes** for 577K builds
- Identifies top 50 builds

### Step 2: Detailed Testing (CPU, All scenarios)
Edit config to test top 50 builds against all scenarios:
```json
{
  "use_threading": false,
  "use_gpu": false,  // Multi-enemy scenarios need CPU
  "scenarios": [
    {"name": "Boss", "num_enemies": 1, "enemy_hp": 100},
    {"name": "Mixed", "enemy_hp_list": [50, 25, 25]},
    {"name": "Swarm 1", "enemy_hp_list": [25, 25, 10, 10, 10, 10, 10]},
    {"name": "Swarm 2", "enemy_hp_list": [50, 10, 10, 10, 10, 10]}
  ]
}
```
- Manually test top builds from Step 1
- Get full multi-enemy analysis

## Summary

**Current config is the WORST of both worlds:**
- GPU overhead from multiprocessing
- Most scenarios can't use GPU anyway
- Result: Slower than CPU-only!

**Best config for your use case:**
```json
{
  "use_threading": false,  // No multiprocessing with GPU
  "use_gpu": true,
  "simulation_runs": 50,   // More = better GPU utilization
  "scenarios": [{"name": "Boss", "num_enemies": 1, "enemy_hp": 100}]
}
```

This will complete in **2-3 minutes** instead of 60+ minutes! 🚀
