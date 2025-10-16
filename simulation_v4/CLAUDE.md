# CLAUDE.md - Simulation V4 Developer Guide

This file provides guidance to Claude Code when working with Simulation V4, a Cython-powered rewrite of the combat simulation engine.

## Project Overview

Simulation V4 is a **high-performance combat simulation engine** written in Cython, designed to achieve **10-50x speedup** over the pure Python V3 implementation. The goal is to process 50M+ attack pairs in hours instead of days by:

1. **Compiling hot-path code to C** - No Python bytecode overhead
2. **Releasing the GIL** - True multi-core parallelism
3. **Using C data structures** - Minimal memory overhead
4. **Parallelizing with prange** - No multiprocessing overhead

## Key Performance Targets

| Metric | V3 (Python) | V4 (Cython) Target |
|--------|-------------|-------------------|
| Time per pair | 0.676s | 0.014-0.068s (10-50x faster) |
| CPU Utilization | 20-30% | 80-95% |
| 50M pairs runtime | 78 hours | 1.5-8 hours |

## Architecture Overview

### Core Modules (Cython - `.pyx` files)

1. **src/dice.pyx** - Dice rolling in pure C with nogil
   - 50-100x faster than Python's `random.randint()`
   - Uses C stdlib `rand()` directly
   - No GIL, can run in parallel threads

2. **src/models.pyx** - Character and attack data structures
   - C structs instead of Python objects
   - Bit flags for upgrades/limits (fast checking)
   - Inline accessor functions for stats

3. **src/combat_core.pyx** - Hit/damage calculations
   - Pure C with nogil
   - 20-30x faster than Python
   - All hot-path combat logic

4. **src/simulation.pyx** - Combat simulation loop
   - Uses `prange` for true parallelism
   - No Python interpreter lock
   - 10-50x faster than multiprocessing

5. **src/scoring.pyx** - Attack selection scoring
   - Compiled to C for speed
   - 10-20x faster than Python

### Header Files (`.pxd` files)

- **src/models.pxd** - C struct definitions shared across modules
- Allows modules to use each other's C functions directly
- No Python API overhead between modules

### Python Wrappers (`.py` files)

- Thin Python layer for I/O, config, reporting
- Calls Cython core for computation
- Maintains API compatibility with V3

## Development Workflow

### 1. Making Changes to Cython Code

```bash
# Edit .pyx file
vim src/dice.pyx

# Rebuild
python setup.py build_ext --inplace

# Test
pytest tests/test_dice.py
```

### 2. Profiling Cython Code

```bash
# Build with profiling
python setup.py build_ext --inplace --define CYTHON_TRACE

# Generate annotated HTML
cython -a src/dice.pyx

# Open src/dice.html in browser
# Yellow lines = Python overhead (optimize these!)
# White lines = Pure C (optimal)
```

### 3. Benchmarking

```bash
# Quick benchmark
python tests/benchmark.py

# Full V3 vs V4 comparison (once implemented)
python benchmarks/profile_v3_vs_v4.py
```

### 4. Running Tests

```bash
# All tests
pytest tests/ -v

# Specific module
pytest tests/test_dice.py -v

# With coverage
pytest tests/ --cov=src
```

## Implementation Status

### Phase 0: Setup ✓
- [x] Build system configured
- [x] Dependencies installed
- [x] Basic module structure created

### Phase 1: Dice Rolling (READY TO IMPLEMENT)
- [x] `src/dice.pyx` stub created
- [ ] Implement `roll_d20_c()` with nogil
- [ ] Implement `roll_d6_c()` with nogil
- [ ] Implement `roll_3d6_exploding_c()` with nogil
- [ ] Add tests
- [ ] Benchmark (target: 50-100x faster)

### Phase 2: Combat Calculations (NEXT)
- [x] `src/models.pyx` stub created
- [x] `src/combat_core.pyx` stub created
- [ ] Implement character/attack structs
- [ ] Implement hit calculation
- [ ] Implement damage calculation
- [ ] Add tests
- [ ] Benchmark (target: 20-30x faster)

### Phase 3: Simulation Loop (FUTURE)
- [x] `src/simulation.pyx` stub created
- [ ] Implement combat simulation
- [ ] Implement parallel batch processing with prange
- [ ] Add tests
- [ ] Benchmark (target: 80-95% CPU)

### Phase 4: Attack Scoring (FUTURE)
- [x] `src/scoring.pyx` stub created
- [ ] Port scoring logic from V3
- [ ] Add tests
- [ ] Benchmark (target: 10-20x faster)

### Phase 5: Pair Testing (FUTURE)
- [ ] Implement pair testing with prange
- [ ] Replace V3's multiprocessing
- [ ] Add integration tests
- [ ] Full benchmark

### Phase 6: Integration (FUTURE)
- [ ] Python wrapper API
- [ ] Port Stage 1/Stage 2 logic
- [ ] Production testing
- [ ] Documentation

## Cython Best Practices

### Use `cdef` for Internal Functions

```cython
# Good: C function, very fast
cdef int my_function(int x) nogil:
    return x * 2

# Bad: Python function, slow
def my_function(x):
    return x * 2
```

### Use `nogil` for Compute-Heavy Code

```cython
# Releases GIL, can run in parallel
cdef int compute() nogil:
    cdef int result = 0
    for i in range(1000):
        result += i
    return result
```

### Use C Types, Not Python Objects

```cython
# Good: C integers, fast
cdef int x = 10
cdef float y = 3.14

# Bad: Python objects, slow
x = 10
y = 3.14
```

### Use Structs Instead of Classes

```cython
# Good: C struct, fast
cdef struct Point:
    int x
    int y

# Bad: Python class, slow
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
```

### Use `inline` for Small Functions

```cython
# Inlined at compile time, no function call overhead
cdef inline int add(int a, int b) nogil:
    return a + b
```

### Use Typed Memory Views for Arrays

```cython
# Good: Typed memoryview, fast
def process(int[:] data):
    cdef int i
    for i in range(data.shape[0]):
        data[i] *= 2

# Bad: Python list, slow
def process(data):
    for i in range(len(data)):
        data[i] *= 2
```

## Common Pitfalls

### 1. Forgetting to Rebuild After Changes

**Problem:** Made changes to `.pyx` file but Python still uses old code

**Solution:**
```bash
python setup.py build_ext --inplace --force
```

### 2. Using Python Objects in `nogil` Code

**Problem:** Can't access Python objects when GIL is released

```cython
# ERROR: Can't use Python dict in nogil
cdef void process() nogil:
    my_dict = {}  # ERROR!
```

**Solution:** Use C types only in nogil code

### 3. Not Checking Build Errors

**Problem:** Build has warnings/errors but continues anyway

**Solution:** Read build output carefully, fix all warnings

### 4. Mixing Python and C Too Much

**Problem:** Calling Python from C frequently kills performance

**Solution:** Keep hot paths pure C, only use Python at boundaries

## Debugging Tips

### 1. Print Debugging in Cython

```cython
# Use printf for debugging in nogil code
from libc.stdio cimport printf

cdef void debug() nogil:
    printf("Debug value: %d\n", 42)
```

### 2. Use GDB for C-level Debugging

```bash
# Build with debug symbols
python setup.py build_ext --inplace --debug

# Run with GDB
gdb python
(gdb) run my_script.py
```

### 3. Check Generated C Code

```bash
# Look at generated C (advanced)
cython src/dice.pyx
less src/dice.c
```

## Performance Optimization Checklist

When optimizing a Cython module:

- [ ] All hot-path functions use `cdef`
- [ ] All compute-heavy functions use `nogil`
- [ ] Using C types (`int`, `float`, `double`) not Python objects
- [ ] Using structs not classes
- [ ] Using typed memoryviews for arrays
- [ ] Using `prange` for parallel loops
- [ ] No Python API calls in hot loops
- [ ] Profiled with `cython -a` - all hot paths are white
- [ ] Benchmarked - achieving target speedup

## Resources

- **Cython Documentation:** https://cython.readthedocs.io/
- **Implementation Plan:** [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
- **Quick Start:** [QUICKSTART.md](QUICKSTART.md)
- **Main README:** [README.md](README.md)

## Next Steps

1. **Read QUICKSTART.md** - Get build system working
2. **Read docs/IMPLEMENTATION_PLAN.md** - Understand full plan
3. **Start Phase 1** - Implement dice rolling
4. **Benchmark frequently** - Verify speedups
5. **Iterate through phases** - Build incrementally

---

**Ready to start? Begin with Phase 1 in docs/IMPLEMENTATION_PLAN.md!**
