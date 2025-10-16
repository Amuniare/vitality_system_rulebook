# Simulation V4 Quick Start Guide

## Prerequisites

- **Python 3.8+** installed
- **C Compiler:**
  - **Windows:** Visual Studio Build Tools (download from Microsoft)
  - **Linux:** GCC (`sudo apt install build-essential`)
  - **Mac:** Xcode Command Line Tools (`xcode-select --install`)

## Step-by-Step Setup (15 minutes)

### 1. Install Dependencies

```bash
cd simulation_v4
pip install -r requirements.txt
```

Expected output:
```
Successfully installed cython-3.0.x numpy-1.22.x ...
```

### 2. Build Cython Extensions

```bash
python setup.py build_ext --inplace
```

**First time:** This will take 30-60 seconds to compile all modules.

Expected output:
```
Compiling src/dice.pyx ...
Compiling src/models.pyx ...
Compiling src/combat_core.pyx ...
...
BUILD SUCCESSFUL!
```

### 3. Verify Build

```bash
python -c "from src.dice import roll_d20; print(f'Roll: {roll_d20()}')"
```

Expected output:
```
Roll: 14
```

(Your roll will vary!)

### 4. Run Tests

```bash
pytest tests/ -v
```

Expected output:
```
tests/test_dice.py::test_d20_range PASSED
tests/test_dice.py::test_d6_range PASSED
tests/test_dice.py::test_3d6_minimum PASSED
...
5 passed in 0.15s
```

## Quick Performance Test

```bash
python tests/benchmark.py
```

Expected output:
```
Benchmarking dice rolling...
Python random.randint(1, 20): 0.523s per 100K rolls
Cython roll_d20(): 0.005s per 100K rolls
Speedup: 104.6x FASTER!
```

## Development Workflow

### After Making Changes to .pyx Files

```bash
# Rebuild (fast incremental build)
python setup.py build_ext --inplace

# Rebuild everything (slower, use if issues)
python setup.py build_ext --inplace --force

# Clean and rebuild
python setup.py clean --all
python setup.py build_ext --inplace
```

### Viewing Performance Profile

After building, Cython generates `.html` files showing where Python overhead remains:

```bash
# Open in browser
src/combat_core.html
src/dice.html
```

- **White lines** = Pure C (FAST)
- **Yellow lines** = Python interaction (SLOW)

**Goal:** All hot-path code should be white!

## Common Issues

### Issue: "fatal error: Python.h: No such file or directory"

**Solution:** Install Python development headers:
- **Windows:** Reinstall Python with "Include test suite" option
- **Linux:** `sudo apt install python3-dev`
- **Mac:** Should be included with Python

### Issue: "error: Microsoft Visual C++ 14.0 or greater is required"

**Solution (Windows):**
1. Download Visual Studio Build Tools: https://visualstudio.microsoft.com/downloads/
2. Install "Desktop development with C++"
3. Restart terminal and retry build

### Issue: "ImportError: No module named 'src.dice'"

**Solution:** You forgot to build! Run:
```bash
python setup.py build_ext --inplace
```

### Issue: Build works but tests fail

**Solution:** Check Python path:
```bash
python -c "import sys; print(sys.path)"
```

Make sure current directory is in path. If not:
```bash
export PYTHONPATH="${PYTHONPATH}:."  # Linux/Mac
set PYTHONPATH=%PYTHONPATH%;.         # Windows
```

## Next Steps

Now that you have a working build:

1. **Read the implementation plan:** [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
2. **Follow Phase 1:** Implement dice rolling (already done!)
3. **Follow Phase 2:** Implement combat calculations
4. **Follow Phase 3:** Implement simulation loop
5. **Benchmark progress:** Compare to V3 frequently

## Performance Targets

| Component | Target Speedup vs V3 |
|-----------|---------------------|
| Dice rolling | 50-100x |
| Combat calculations | 20-30x |
| Full simulation | 10-50x |

## Getting Help

- Review [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for detailed steps
- Check Cython documentation: https://cython.readthedocs.io/
- Look at generated .html files for optimization hints

---

**You're ready to go! Start with Phase 1 in the implementation plan.**
