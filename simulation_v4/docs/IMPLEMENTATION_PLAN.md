# Simulation V4 Cython Implementation Plan

## Executive Summary

This document provides a detailed, step-by-step plan to rewrite Simulation V3 in Cython, achieving 10-50x performance improvements. Estimated total time: **1-2 weeks** (40-80 hours).

## Why Cython?

### Performance Characteristics

| Approach | Speed | Ease | GIL | Multi-core |
|----------|-------|------|-----|------------|
| Pure Python | 1x | Easy | Yes | Limited |
| Numba JIT | 5-10x | Easy | Partial | Good |
| **Cython** | **10-50x** | **Medium** | **No** | **Excellent** |
| Rust | 50-100x | Hard | No | Excellent |

**Cython wins because:**
- 10-50x speedup with moderate effort
- Gradual migration (can mix Python/Cython)
- `nogil` + `prange` for true parallelism
- Mature ecosystem, good debugging tools

## Phase-by-Phase Implementation

### Phase 0: Setup and Preparation (2-4 hours)

**Goal:** Get build system working, create scaffolding

**Tasks:**

1. **Install Cython build tools**
   ```bash
   pip install cython numpy
   # Windows: Install Visual Studio Build Tools
   # Linux: sudo apt install build-essential
   # Mac: xcode-select --install
   ```

2. **Create `setup.py`**
   ```python
   from setuptools import setup, Extension
   from Cython.Build import cythonize
   import numpy as np

   extensions = [
       Extension(
           "src.combat_core",
           ["src/combat_core.pyx"],
           include_dirs=[np.get_include()],
           extra_compile_args=["/openmp"],  # Windows MSVC
           # extra_compile_args=["-fopenmp"],  # Linux/Mac GCC
           extra_link_args=["/openmp"],
       ),
   ]

   setup(
       name="simulation_v4",
       ext_modules=cythonize(extensions, annotate=True),
   )
   ```

3. **Create minimal test to verify build**
   ```python
   # src/combat_core.pyx
   def hello():
       return "Cython works!"
   ```

   ```bash
   python setup.py build_ext --inplace
   python -c "from src.combat_core import hello; print(hello())"
   ```

**Deliverable:** Working Cython build system

---

### Phase 1: Dice Rolling Engine (4-6 hours)

**Goal:** Implement dice rolling in pure C with nogil

**Why start here:**
- Simplest component
- Huge performance impact (called thousands of times)
- Good learning exercise for Cython

**Implementation:**

```cython
# src/dice.pyx
from libc.stdlib cimport rand, srand, RAND_MAX
from libc.time cimport time
from libc.math cimport floor

# Initialize RNG once
srand(time(NULL))

cdef inline int roll_d20_c() nogil:
    """Roll 1d20 in pure C with no GIL."""
    return 1 + (rand() % 20)

cdef inline int roll_d6_c() nogil:
    """Roll 1d6 in pure C with no GIL."""
    return 1 + (rand() % 6)

cdef inline int roll_3d6_exploding_c() nogil:
    """Roll 3d6 with exploding dice."""
    cdef int total = 0
    cdef int i, roll

    for i in range(3):
        roll = roll_d6_c()
        total += roll
        while roll == 6:  # Explode on 6
            roll = roll_d6_c()
            total += roll

    return total

# Python-accessible wrappers (for testing)
def roll_d20():
    return roll_d20_c()

def roll_d6():
    return roll_d6_c()

def roll_3d6_exploding():
    return roll_3d6_exploding_c()
```

**Testing:**

```python
# tests/test_dice.py
from src.dice import roll_d20, roll_d6, roll_3d6_exploding

def test_d20_range():
    for _ in range(1000):
        result = roll_d20()
        assert 1 <= result <= 20

def test_3d6_min():
    for _ in range(1000):
        result = roll_3d6_exploding()
        assert result >= 3  # Minimum is 3
```

**Benchmark:**

```python
# Expected: 50-100x faster than Python
import timeit

python_time = timeit.timeit("random.randint(1, 20)", setup="import random", number=100000)
cython_time = timeit.timeit("roll_d20()", setup="from src.dice import roll_d20", number=100000)

print(f"Speedup: {python_time / cython_time:.1f}x")
```

**Deliverable:** Dice rolling 50-100x faster than Python

---

### Phase 2: Combat Calculations (8-12 hours)

**Goal:** Implement accuracy/damage calculations in Cython

**Components:**

1. **Character struct**
   ```cython
   # src/models.pxd (header file)
   cdef struct Character:
       int focus
       int power
       int mobility
       int endurance
       int tier
       int max_hp

   cdef inline int get_accuracy(Character* char) nogil
   cdef inline int get_avoidance(Character* char) nogil
   cdef inline int get_damage(Character* char) nogil
   cdef inline int get_durability(Character* char) nogil
   ```

   ```cython
   # src/models.pyx
   cdef inline int get_accuracy(Character* char) nogil:
       return 10 + char.tier + char.focus

   cdef inline int get_avoidance(Character* char) nogil:
       return 10 + char.tier + char.mobility

   cdef inline int get_damage(Character* char) nogil:
       return char.tier + char.power

   cdef inline int get_durability(Character* char) nogil:
       return 5 + char.tier + char.endurance
   ```

2. **Attack struct**
   ```cython
   # src/models.pxd
   cdef struct Attack:
       int attack_type  # 0=melee_dg, 1=melee_ac, 2=ranged, 3=area, etc.
       unsigned char upgrades[32]  # Bit flags for upgrades
       unsigned char limits[16]    # Bit flags for limits

   # Upgrade bit flags
   cdef enum Upgrade:
       POWER_ATTACK = 1
       ACCURATE_ATTACK = 2
       ARMOR_PIERCING = 4
       BRUTAL = 8
       # ... etc
   ```

3. **Hit calculation**
   ```cython
   # src/combat_core.pyx
   from src.dice cimport roll_d20_c, roll_3d6_exploding_c
   from src.models cimport Character, Attack, get_accuracy, get_avoidance, get_damage, get_durability

   cdef int calculate_hit(Character* attacker, Character* defender, Attack* attack) nogil:
       """
       Calculate if attack hits (1) or misses (0).
       Returns: 1 if hit, 0 if miss
       """
       cdef int accuracy = get_accuracy(attacker)
       cdef int avoidance = get_avoidance(defender)

       # Apply attack modifiers
       if attack.upgrades & POWER_ATTACK:
           accuracy -= 2
       if attack.upgrades & ACCURATE_ATTACK:
           accuracy += 2

       # Roll to hit
       cdef int roll = roll_d20_c()
       cdef int total = accuracy + roll

       return 1 if total >= avoidance else 0

   cdef int calculate_damage(Character* attacker, Character* defender, Attack* attack) nogil:
       """Calculate damage dealt by an attack."""
       cdef int base_damage = get_damage(attacker)
       cdef int durability = get_durability(defender)

       # Apply attack modifiers
       if attack.upgrades & POWER_ATTACK:
           base_damage += 2
       if attack.upgrades & BRUTAL:
           base_damage += 1

       # Roll damage
       cdef int damage_roll = roll_3d6_exploding_c()
       cdef int total_damage = base_damage + damage_roll

       # Apply armor piercing
       if attack.upgrades & ARMOR_PIERCING:
           durability = durability // 2

       # Final damage
       cdef int final_damage = total_damage - durability
       return final_damage if final_damage > 0 else 0
   ```

**Testing:**

```python
# tests/test_combat.py
from src.combat_core import calculate_hit_py, calculate_damage_py
from src.models import create_character, create_attack

def test_hit_calculation():
    attacker = create_character(2, 2, 2, 2, 4)
    defender = create_character(2, 2, 2, 2, 4)
    attack = create_attack("melee_dg", ["power_attack"], [])

    # Should hit sometimes but not always
    hits = sum(calculate_hit_py(attacker, defender, attack) for _ in range(100))
    assert 20 < hits < 80  # Probabilistic test
```

**Deliverable:** Combat calculations 20-30x faster than Python

---

### Phase 3: Combat Simulation Loop (12-16 hours)

**Goal:** Full combat simulation with turn-by-turn logic

**Implementation:**

```cython
# src/simulation.pyx
from src.combat_core cimport calculate_hit, calculate_damage
from src.models cimport Character, Attack

cdef struct CombatState:
    int turn_number
    int attacker_hp
    int defender_hp
    int bleed_stacks
    # ... other state

cdef int simulate_combat_c(Character* attacker, Character* defender,
                           Attack* attack, int max_turns) nogil:
    """
    Simulate full combat until victory or timeout.

    Returns: Number of turns to victory (or max_turns if timeout)
    """
    cdef CombatState state
    state.turn_number = 0
    state.attacker_hp = attacker.max_hp
    state.defender_hp = 100  # Enemy HP
    state.bleed_stacks = 0

    cdef int hit, damage

    while state.defender_hp > 0 and state.turn_number < max_turns:
        state.turn_number += 1

        # Attacker's turn
        hit = calculate_hit(attacker, defender, attack)
        if hit:
            damage = calculate_damage(attacker, defender, attack)
            state.defender_hp -= damage

            # Check for bleed
            if attack.upgrades & BLEED:
                state.bleed_stacks += 1

        # Apply bleed damage
        if state.bleed_stacks > 0:
            state.defender_hp -= state.bleed_stacks
            state.bleed_stacks = state.bleed_stacks // 2  # Decay

        # Defender's turn (simplified - can skip for benchmarking)
        # ...

    return state.turn_number
```

**Parallel simulation:**

```cython
from cython.parallel cimport prange

def simulate_many_combats(attacker_dict, defender_dict, attack_dict,
                         int num_simulations, int max_turns):
    """
    Simulate many combats in parallel with no GIL.

    Returns: List of turn counts
    """
    # Convert Python dicts to C structs
    cdef Character attacker = dict_to_character(attacker_dict)
    cdef Character defender = dict_to_character(defender_dict)
    cdef Attack attack = dict_to_attack(attack_dict)

    # Allocate results array
    cdef int[10000] results  # Or use malloc for dynamic size
    cdef int i

    # Parallel loop with NO GIL
    with nogil:
        for i in prange(num_simulations, schedule='dynamic', num_threads=12):
            results[i] = simulate_combat_c(&attacker, &defender, &attack, max_turns)

    # Convert back to Python list
    return [results[i] for i in range(num_simulations)]
```

**Testing:**

```python
def test_parallel_simulation():
    attacker = {"focus": 2, "power": 2, "mobility": 2, "endurance": 2, "tier": 4}
    defender = {"focus": 2, "power": 2, "mobility": 2, "endurance": 2, "tier": 4}
    attack = {"type": "melee_dg", "upgrades": ["power_attack"], "limits": []}

    results = simulate_many_combats(attacker, defender, attack, 1000, 100)

    # Check results are reasonable
    assert len(results) == 1000
    assert all(1 <= r <= 100 for r in results)
    assert 5 < statistics.mean(results) < 50
```

**Deliverable:** Parallel combat simulation with 80-95% CPU usage

---

### Phase 4: Attack Scoring System (6-8 hours)

**Goal:** Port intelligent attack selection scoring to Cython

**Implementation:**

```cython
# src/scoring.pyx
cdef struct AttackCharacteristics:
    unsigned char is_aoe
    float evasive_bonus
    float tanky_bonus
    float elite_bonus
    unsigned char power_attack
    unsigned char accurate_attack
    # ... all other characteristics as bytes/floats

cdef inline float score_attack_c(AttackCharacteristics* attack_chars,
                                 int num_alive,
                                 float avg_hp,
                                 int max_hp,
                                 int wounded_count,
                                 int profile_idx,
                                 int buff_idx,
                                 unsigned char buff_avoidance,
                                 unsigned char buff_durability) nogil:
    """
    Score attack for situation (pure C, no GIL).

    Returns: Score as float
    """
    cdef float score = 0.0

    # Attack type scoring
    if num_alive >= 5:
        score += 100.0 if attack_chars.is_aoe else -50.0
    elif num_alive >= 3:
        score += 50.0 if attack_chars.is_aoe else 0.0
    # ... rest of scoring logic

    return score
```

**Deliverable:** Attack scoring 10-20x faster than Python

---

### Phase 5: Pair Testing System (8-12 hours)

**Goal:** Implement pair testing with parallel workers

**Implementation:**

```cython
# src/pair_testing.pyx
from cython.parallel cimport prange

cdef struct PairTestResult:
    float overall_avg
    float profile_avgs[4]
    float synergy_score

cdef PairTestResult test_pair_c(Attack* attack1, Attack* attack2,
                                Character* attacker, Character* defender,
                                int num_simulations) nogil:
    """
    Test a pair of attacks across all scenarios.

    Returns: PairTestResult struct
    """
    cdef PairTestResult result
    cdef int total_turns = 0
    cdef int i, turns
    cdef float score1, score2
    cdef Attack* selected_attack

    for i in range(num_simulations):
        # Intelligent attack selection
        score1 = score_attack_c(&attack1_chars, ...)
        score2 = score_attack_c(&attack2_chars, ...)

        selected_attack = attack1 if score1 >= score2 else attack2

        # Simulate combat
        turns = simulate_combat_c(attacker, defender, selected_attack, 100)
        total_turns += turns

    result.overall_avg = <float>total_turns / num_simulations
    return result

def test_all_pairs_parallel(pairs_list, config, int num_workers=12):
    """
    Test all pairs in parallel with true multi-core.

    This is the main entry point that replaces V3's multiprocessing pool.
    """
    cdef int num_pairs = len(pairs_list)
    cdef int i

    # Allocate results
    results = [None] * num_pairs

    # Convert Python data to C structs (do this once outside nogil)
    cdef Character attacker = ...
    cdef Character defender = ...

    # Process pairs in parallel with NO GIL
    with nogil:
        for i in prange(num_pairs, schedule='dynamic', num_threads=num_workers):
            # Each iteration processes one pair
            results[i] = test_pair_c(&pairs[i].attack1, &pairs[i].attack2,
                                    &attacker, &defender, 16)

    return results
```

**Key insight:** No need for Python multiprocessing! Cython's `prange` handles everything.

**Deliverable:** Pair testing with 80-95% CPU, 10-50x faster than V3

---

### Phase 6: Integration and Optimization (8-12 hours)

**Goal:** Connect all pieces, optimize, benchmark

**Tasks:**

1. **Create Python wrappers** for easy use
   ```python
   # src/stage2_pairing.py
   from src.pair_testing import test_all_pairs_parallel

   def run_stage2(config_path):
       # Load config (Python)
       config = load_config(config_path)

       # Load attacks (Python)
       attacks = load_pruned_attacks()

       # Generate pairs (Python)
       pairs = generate_pairs(attacks)

       # TEST PAIRS (Cython - this is where 90% of time is spent)
       results = test_all_pairs_parallel(pairs, config)

       # Generate reports (Python)
       generate_reports(results)
   ```

2. **Profile with `cython -a`**
   ```bash
   cython -a src/combat_core.pyx
   # Opens HTML file showing Python interaction (yellow lines)
   # Goal: All hot paths should be white (pure C)
   ```

3. **Benchmark against V3**
   ```python
   # benchmarks/compare_v3_v4.py
   import time
   from simulation_v3.performance_test import test_one_pair as v3_test
   from simulation_v4.performance_test import test_one_pair as v4_test

   v3_time = timeit.timeit(v3_test, number=100)
   v4_time = timeit.timeit(v4_test, number=100)

   print(f"V3: {v3_time:.3f}s")
   print(f"V4: {v4_time:.3f}s")
   print(f"Speedup: {v3_time / v4_time:.1f}x")
   ```

4. **Optimize based on profiling**
   - Add `inline` to small functions
   - Use `nogil` everywhere possible
   - Replace Python objects with C types
   - Use memoryviews for arrays

**Deliverable:** Complete V4 implementation, 10-50x faster than V3

---

## Implementation Checklist

### Phase 0: Setup ✓
- [ ] Install Cython and C compiler
- [ ] Create `setup.py` with OpenMP support
- [ ] Create basic Cython module
- [ ] Verify build with simple test

### Phase 1: Dice Rolling ✓
- [ ] Implement `roll_d20_c()` with nogil
- [ ] Implement `roll_d6_c()` with nogil
- [ ] Implement `roll_3d6_exploding_c()` with nogil
- [ ] Create Python wrappers for testing
- [ ] Write unit tests
- [ ] Benchmark (should be 50-100x faster)

### Phase 2: Combat Calculations ✓
- [ ] Define `Character` struct in `.pxd`
- [ ] Define `Attack` struct with bit flags
- [ ] Implement `calculate_hit()` with nogil
- [ ] Implement `calculate_damage()` with nogil
- [ ] Implement upgrade/limit checking
- [ ] Write unit tests
- [ ] Benchmark (should be 20-30x faster)

### Phase 3: Combat Simulation ✓
- [ ] Implement `simulate_combat_c()` with nogil
- [ ] Implement `simulate_many_combats()` with prange
- [ ] Handle bleed, conditions, combat state
- [ ] Write unit tests comparing to V3
- [ ] Benchmark parallel performance
- [ ] Verify 80-95% CPU usage

### Phase 4: Attack Scoring ✓
- [ ] Define `AttackCharacteristics` struct
- [ ] Implement `score_attack_c()` with nogil
- [ ] Port all scoring logic from V3
- [ ] Write unit tests
- [ ] Benchmark (should be 10-20x faster)

### Phase 5: Pair Testing ✓
- [ ] Implement `test_pair_c()` with nogil
- [ ] Implement `test_all_pairs_parallel()` with prange
- [ ] Handle all defensive profiles and buffs
- [ ] Write integration tests
- [ ] Benchmark full pair test
- [ ] Compare memory usage to V3

### Phase 6: Integration ✓
- [ ] Create Python wrapper API
- [ ] Port Stage 1 pruning (can stay Python)
- [ ] Port Stage 2 pairing (use Cython core)
- [ ] Profile with `cython -a`
- [ ] Optimize yellow lines
- [ ] Run full 50M pair test
- [ ] Document performance gains

## Expected Timeline

| Phase | Time | Dependencies |
|-------|------|--------------|
| Phase 0: Setup | 2-4 hours | None |
| Phase 1: Dice | 4-6 hours | Phase 0 |
| Phase 2: Combat | 8-12 hours | Phase 1 |
| Phase 3: Simulation | 12-16 hours | Phase 2 |
| Phase 4: Scoring | 6-8 hours | Phase 2 |
| Phase 5: Pair Testing | 8-12 hours | Phase 3, 4 |
| Phase 6: Integration | 8-12 hours | Phase 5 |
| **TOTAL** | **48-70 hours** | **(1-2 weeks)** |

## Performance Targets

| Component | V3 Time | V4 Target | Speedup |
|-----------|---------|-----------|---------|
| Dice roll (1M) | 0.5s | 0.005s | 100x |
| Hit calculation (1M) | 2.0s | 0.1s | 20x |
| Damage calculation (1M) | 3.0s | 0.15s | 20x |
| Combat simulation (1K) | 5.0s | 0.5s | 10x |
| Attack scoring (1M) | 1.0s | 0.05s | 20x |
| Full pair test | 0.676s | 0.014-0.068s | 10-50x |
| **50M pairs** | **78 hours** | **1.5-8 hours** | **10-50x** |

## Risk Mitigation

### Risk: Cython compilation errors
**Mitigation:** Start with simple modules (dice), build incrementally

### Risk: Performance doesn't meet targets
**Mitigation:** Profile early and often with `cython -a`, optimize hot paths

### Risk: Bugs introduced during rewrite
**Mitigation:** Extensive unit tests, compare all results to V3

### Risk: Build issues on different platforms
**Mitigation:** Test on Windows/Linux/Mac, provide detailed build docs

## Success Criteria

1. ✓ V4 produces identical results to V3 (within floating point error)
2. ✓ V4 is 10-50x faster than V3 for full pair tests
3. ✓ V4 achieves 80-95% CPU utilization
4. ✓ V4 can process 50M pairs in < 8 hours
5. ✓ V4 has comprehensive test coverage
6. ✓ V4 is documented and maintainable

## Next Steps After Implementation

1. **Run production tests** - Process full 50M pair dataset
2. **Optimize further** - Use profiling to find remaining bottlenecks
3. **Consider GPU** - Port dice rolling to CUDA for 1000x speedup
4. **Consider Rust** - If even more performance needed
5. **Distribute** - Use MPI for multi-machine scaling

## Resources

- [Cython Documentation](https://cython.readthedocs.io/)
- [Cython Parallel Guide](https://cython.readthedocs.io/en/latest/src/userguide/parallelism.html)
- [High-Performance Python Book](https://www.oreilly.com/library/view/high-performance-python/9781492055013/)
- [Cython Best Practices](https://github.com/cython/cython/wiki/enhancements-type_inference)

---

**Ready to begin? Start with Phase 0: Setup!**
