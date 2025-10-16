# Simulation V4: Cython-Powered High-Performance Combat Simulation

## Overview

Simulation V4 is a complete rewrite of the combat simulation engine in Cython, designed to achieve 10-50x performance improvements over the pure Python V3 implementation. This enables testing of 50M+ attack pairs in hours instead of days.

## Performance Goals

| Metric | V3 (Python) | V4 (Cython) Goal |
|--------|-------------|------------------|
| Time per pair | 0.676s | 0.014-0.068s (10-50x faster) |
| CPU Utilization | 20-30% | 80-95% |
| 50M pairs runtime | 78 hours | 1.5-8 hours |
| Memory usage | 8GB | 4-8GB |

## Architecture

### Core Components (Cython)

1. **Combat Engine** (`src/combat_core.pyx`)
   - Dice rolling with nogil
   - Attack/defense calculations
   - Condition checking
   - All hot-path code compiled to C

2. **Scoring System** (`src/scoring.pyx`)
   - Attack situation scoring
   - Pre-computed characteristics
   - Pure C speed with nogil

3. **Simulation Loop** (`src/simulation.pyx`)
   - Parallel combat simulation
   - Uses `prange` for parallelization
   - No GIL, true multi-core

4. **Data Models** (`src/models.pyx`)
   - C structs for characters, attacks
   - Minimal Python object overhead
   - Fast memory access

### Python Wrappers (`src/`)

- Thin Python layer for compatibility
- Config loading, I/O, reporting
- Calls Cython core for computation

### Build System

- `setup.py` - Cython compilation
- `pyproject.toml` - Modern Python packaging
- C compiler required (MSVC on Windows)

## Directory Structure

```
simulation_v4/
├── src/
│   ├── combat_core.pyx          # Core combat engine (Cython)
│   ├── combat_core.pxd          # Cython header file
│   ├── scoring.pyx              # Attack scoring (Cython)
│   ├── simulation.pyx           # Simulation loop (Cython)
│   ├── models.pyx               # Data structures (Cython)
│   ├── game_data.py             # Game rules (Python)
│   ├── stage1_pruning.py        # Stage 1 wrapper (Python)
│   ├── stage2_pairing.py        # Stage 2 wrapper (Python)
│   └── utils.py                 # Utilities (Python)
├── tests/
│   ├── test_combat.py           # Combat engine tests
│   ├── test_scoring.py          # Scoring tests
│   └── benchmark.py             # Performance benchmarks
├── benchmarks/
│   ├── profile_v3_vs_v4.py     # Comparison benchmarks
│   └── results/                 # Benchmark results
├── docs/
│   ├── IMPLEMENTATION_PLAN.md   # Detailed implementation plan
│   ├── CYTHON_GUIDE.md         # Cython best practices
│   └── MIGRATION_GUIDE.md      # V3 → V4 migration
├── setup.py                     # Cython build configuration
├── pyproject.toml              # Python project metadata
├── requirements.txt            # Dependencies
├── config.json                 # Simulation configuration
└── README.md                   # This file
```

## Installation

```bash
cd simulation_v4

# Install dependencies
pip install -r requirements.txt

# Build Cython extensions
python setup.py build_ext --inplace

# Verify build
python -c "import src.combat_core; print('Build successful!')"
```

## Usage

Same interface as V3:

```bash
# Run full simulation
python main.py

# Stage 1 only
python main.py --stage 1

# Stage 2 only
python main.py --stage 2
```

## Development Workflow

### 1. Writing Cython Code

```python
# File: src/combat_core.pyx
from libc.stdlib cimport rand, RAND_MAX
from cython.parallel cimport prange

cdef int roll_d20() nogil:
    """Roll a d20 with no GIL."""
    return 1 + (rand() % 20)

def simulate_combat_parallel(int num_simulations):
    cdef int i
    cdef int[1000] results

    with nogil:
        for i in prange(num_simulations, schedule='dynamic'):
            results[i] = roll_d20()

    return results[:num_simulations]
```

### 2. Building

```bash
# During development (fast)
python setup.py build_ext --inplace

# For profiling (with line tracing)
python setup.py build_ext --inplace --force --define CYTHON_TRACE

# For production (optimized)
python setup.py build_ext --inplace --force
```

### 3. Testing

```bash
# Run tests
pytest tests/

# Run benchmarks
python tests/benchmark.py

# Compare V3 vs V4
python benchmarks/profile_v3_vs_v4.py
```

## Migration from V3

See [docs/MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md) for detailed migration steps.

**High-level process:**

1. Keep V3 as reference implementation
2. Implement V4 Cython core modules one at a time
3. Test each module against V3 for correctness
4. Benchmark each module for performance
5. Switch to V4 when all modules complete

## Performance Optimization Checklist

- [ ] Use `cdef` for all internal functions
- [ ] Use `nogil` for compute-heavy functions
- [ ] Use C types (`int`, `float`, `double`) instead of Python objects
- [ ] Use typed memoryviews for arrays
- [ ] Use `prange` for parallel loops
- [ ] Avoid Python API calls in hot loops
- [ ] Profile with `cython -a` to find yellow lines (Python overhead)
- [ ] Use C stdlib functions (`math.h`, `stdlib.h`) directly

## Benchmarking

Run benchmarks before and after changes:

```bash
python benchmarks/profile_v3_vs_v4.py
```

Expected results:
- Combat simulation: 10-20x faster
- Attack scoring: 5-10x faster
- Full pair test: 10-50x faster overall

## Dependencies

- Python 3.8+
- Cython 3.0+
- NumPy (for array handling)
- C compiler (MSVC on Windows, GCC/Clang on Linux/Mac)
- OpenMP (for parallel processing)

## Known Limitations

1. **Build complexity** - Requires C compiler, more complex than pure Python
2. **Debugging** - Harder to debug than Python (use `cython -a` for profiling)
3. **Platform-specific** - Need to compile for each platform
4. **Development speed** - Slower iteration than Python (need to rebuild)

## Future Enhancements

- [ ] GPU acceleration for dice rolling (CUDA/OpenCL)
- [ ] Distributed computing support (MPI)
- [ ] Rust rewrite of hottest paths
- [ ] SIMD vectorization for parallel dice rolls
- [ ] Memory pool for combat state allocation

## Contributing

See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for implementation details.

## License

Same as parent project.
