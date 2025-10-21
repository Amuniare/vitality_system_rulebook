# Enhancement Balance Analysis Guide v2.1
## Production Edition with Critical Report Assessment

**Purpose:** Systematic framework for analyzing saturation heatmaps and recommending balance changes for any TTRPG enhancement system.

**Target Goal:** Move all enhancements toward **medium saturation (1-6%)** across all performance tiers while maintaining meaningful choices.

---

## Report Priority & Usage

### 🥇 Essential Report: Saturation Heatmap (REQUIRED)

**File:** `{archetype}_saturation_summary_heatmap.md`

**Why it's essential:**
- **Balance IS saturation** - you're trying to get enhancements into 1-6% range
- Shows pattern types at a glance (Top-Heavy, Universal Appeal, Inverted)
- Contains all 6 saturation data points (Top 10, 50, 100, 200, 500, 1000)
- Includes distribution statistics (High/Medium/Low counts)
- Single source of truth for identifying balance problems

**What I can diagnose from just the heatmap:**
- Which enhancements need nerfs/buffs (saturation too high/low)
- Pattern classification (Top-Heavy vs Universal vs Inverted)
- Priority ranking (🔴🟠🟡🟢❌)
- Whether to adjust price or bonus/penalty
- Price tier distribution (count enhancements at each cost)

**90% of balance decisions can be made from the heatmap alone.**

---

### 🥈 Optional Report: Enhancement Ranking (HELPFUL CONTEXT)

**File:** `enhancement_ranking_{archetype}.md`

**Why it's optional:**
- Adds performance context to popularity data
- Helps catch noob traps (popular but bad)
- Identifies hidden gems (unpopular but good)
- Shows attack type compatibility

**When to include this report:**
- Investigating why an enhancement has weird saturation
- Need to verify if high saturation = high performance
- Want to understand dual_natured combat behavior
- Cross-referencing edge cases

**What's useful from ranking report:**
- **Avg Turns** - overall performance baseline
- **Top20% vs Med** - performance in good builds
- **Med Rank** - where builds with this typically rank
- **Attack Type Breakdown** - compatibility check

**What's overkill from ranking report:**
- Top0.02% through Top5% metrics (too granular)
- Slot1/Slot2, Used1/Used2 (interesting but not actionable)

---

### ❌ Skip This Report: Cost Analysis (REDUNDANT)

**File:** `cost_analysis_{archetype}.md`

**Why to skip it:**
- Just the Ranking Report reorganized by cost
- Same columns, same data, different sort order
- Cost is already visible in both other reports
- No unique insights or new information
- "Cost distribution" is trivial (just counts)

**Everything useful in Cost Analysis can be derived from the Heatmap:**
- Count enhancements at each price tier manually
- Compare options within a price tier by scanning
- Check price distribution health from heatmap

---

## Updated Saturation Thresholds

**Recommended Thresholds:**
- **Low:** <1% (truly dead/unused content)
- **Medium:** 1-6% (target range, healthy balance)
- **High:** >6% (too popular, needs rebalancing)

**Target Distribution Goals:**
- Low (<1%): < 10% of enhancements
- Medium (1-6%): > 50% of enhancements
- High (>6%): < 40% of enhancements

**What Saturation Means:**
- 1% = 1-in-100 builds (niche)
- 3% = 1-in-33 builds (healthy option)
- 6% = 1-in-17 builds (popular, threshold for concern)
- 10% = 1-in-10 builds (very popular, needs nerf)
- 20% = 1-in-5 builds (dominant, critical priority)

---

## Available Balance Levers

### Price (Both Upgrades & Limits)
- **Range:** 1p, 2p, or 3p only
- **Goal:** Somewhat even distribution across all three price tiers
- **Sensitivity:** ⚠️ **CRITICAL** - Changing by 1p can move an enhancement from top to bottom or vice versa

**Price Distribution Tracking:**
```
Target Distribution:
- 1p enhancements: ~33% of total
- 2p enhancements: ~33% of total  
- 3p enhancements: ~33% of total

Check after each change:
- Count enhancements at each price tier (from heatmap)
- Flag if any tier has >40% or <25% of total
```

---

### Limits: Tier Bonus Multiplier
- **Preferred Range:** 1×Tier to 4×Tier
- **Maximum:** 6×Tier (use only for extremely restrictive limits)
- **Increments:** ±0.5×Tier or ±1×Tier
- **Sensitivity:** ⚠️ **CRITICAL** - Changing by 1×Tier can completely flip saturation

**Common Tier Bonus Values:**
```
+1×Tier  = Mild bonus (for lenient limits)
+2×Tier  = Standard bonus (most common)
+3×Tier  = Strong bonus (restrictive limits)
+4×Tier  = Very strong bonus (very restrictive limits)
+5×Tier  = Extreme bonus (rarely used)
+6×Tier  = Maximum bonus (only for near-impossible conditions)
```

---

### Upgrades: Penalties & Effects

**Accuracy Penalties (in order of severity):**
```
Tier 0: No penalty
Tier 1: -1 flat to accuracy
Tier 2: -2 flat to accuracy
Tier 3: -3 flat to accuracy
Tier 4: -Tier to accuracy
Tier 5: -Tier to accuracy and damage
Tier 6: -2×Tier to accuracy and damage
```

**Damage Penalties (common patterns):**
```
-1 flat to damage
-2 flat to damage
-3 flat to damage
-Tier to damage
-2×Tier to damage
```

**Effect Adjustments:**
- Chain limits (max chains: Tier/2, Tier/3, Tier/4)
- Duration changes (1 turn, 2 turns, 3 turns)
- Trigger conditions (tighten or loosen requirements)
- Cooldown durations (2 turns, 3 turns, 4 turns)

---

### Banning Specific Combinations

**When to use:**
- A single enhancement is balanced across most builds
- But becomes dominant when combined with specific enhancement(s)
- Nerfing either enhancement individually would make them too weak

**Format:**
```
BAN: [enhancement_A] + [enhancement_B]
Reason: [Specific synergy that breaks balance]
Alternative: Allow A or B individually, just not together
```

---

## Reading Saturation Patterns

### Pattern Types

| Pattern Name | Example Curve | What It Means | Typical Fix |
|--------------|---------------|---------------|-------------|
| **Top-Heavy Exploit** | 50% → 20% → 5% → 2% | Optimized by skilled builders, ignored by others | **Reduce Bonus** |
| **Universal Appeal** | 25% → 23% → 20% → 18% | Everyone wants it at all skill levels | **Increase Price** |
| **Inverted Curve** | 5% → 10% → 15% → 20% | Weaker builds over-rely on it | **Reduce Bonus or Increase Price** |
| **Dead Enhancement** | 0% → 0% → 1% → 2% | Nobody uses it | **Buff (reduce price or increase bonus)** |
| **Volatile Spike** | 5% → 30% → 8% → 5% | Powerful in specific niche | **Add restrictions or increase cost** |
| **Already Balanced** | 4% → 5% → 6% → 5% | Flat curve in target range | **No change needed** |

---

## Diagnostic Framework

### Step 1: Calculate Pattern Metrics

For each enhancement, calculate:

```
Drop Severity = (Top 10 saturation - Top 1000 saturation) / Top 10 saturation

Flatness Score = Standard deviation of all saturation values

Average Saturation = Mean across all Top N tiers

Price Tier Balance = Count(enhancements at this price) / Total enhancements
```

**Thresholds:**
- **Drop Severity > 0.6** = Top-Heavy Exploit
- **Flatness Score < 3** = Universal Appeal  
- **Inverted** = Top 1000 > Top 10
- **Dead** = Average Saturation < 1%
- **Volatile** = Large spikes in middle tiers

---

### Step 2: Identify Root Cause & Select Appropriate Lever

#### For High Saturation (>6% average):

**Q1: Is the curve flat or steep?**
- **Flat (stays 15-20% across tiers)** → Universal Appeal
  - ✅ **Increase Price** (1p→2p or 2p→3p)
  - ⚠️ Check if target price tier is crowded
  
- **Steep (drops from 30%→5%)** → Top-Heavy Exploit
  - For **Limits**: **Reduce Tier Bonus** by 0.5×Tier or 1×Tier
  - For **Upgrades**: **Increase Penalty** by one tier on the scale
  - Alternative: Check if it's only strong with specific combos → **Ban combination**

**Q2: Is it a specific combination problem?**
- Does saturation spike only when paired with specific enhancement(s)?
  - ✅ **Ban the combination** instead of nerfing individual pieces
  - Check pairing data if available

**Q3: Will price change help or hurt price distribution?**
- Check current distribution at target price tier
  - If target tier already has >40% of enhancements → **Use bonus/penalty adjustment instead**
  - If target tier has <30% of enhancements → **Price change is safe**

---

#### For Low Saturation (<1% average):

**Q4: Is the cost too high for the benefit?**
- **Yes** (high cost, weak effect)
  - For **Limits**: Increase tier bonus by 0.5×Tier or 1×Tier
  - For **Upgrades**: Reduce penalty by one tier
  - Alternative: **Reduce Price** (3p→2p or 2p→1p) if price tier allows
  
**Q5: Does it have overly severe restrictions?**
- **Yes** → Can't reduce restrictions without redesign
  - For **Limits**: Increase tier bonus compensation
  - For **Upgrades**: Reduce penalty or add secondary benefit

**Q6: Will price change create distribution problems?**
- Lowering price might overcrowd the 1p tier
  - If 1p already has >40% of enhancements → **Buff bonus/reduce penalty instead**

---

### Step 3: Sensitivity Check

**Before recommending changes:**

⚠️ **Small changes have MASSIVE effects**

**For Limits (Tier Bonus):**
- Changing +3×Tier → +2×Tier can move saturation from 20% → 5%
- Changing +2×Tier → +3×Tier can move saturation from 5% → 20%
- **Default recommendation:** ±1×Tier adjustments only
- **Extreme cases only:** ±2×Tier adjustments

**For Upgrades (Penalties):**
- Moving from "no penalty" to "-1 flat" can halve saturation
- Moving from "-Tier" to "-Tier acc/dmg" can move saturation from 15% → 3%
- **Default recommendation:** One tier shift on penalty scale
- **Extreme cases only:** Two tier shifts

**For Price:**
- 1p → 2p can move saturation from 25% → 8%
- 2p → 1p can move saturation from 3% → 15%
- **Always check:** Price tier distribution before recommending

---

## Decision Matrix

```
START: Enhancement has wrong saturation
│
├─ Check price tier distribution first
│  └─ Is target price tier crowded (>40%)?
│     ├─ YES → Use bonus/penalty adjustments only
│     └─ NO → Price change is an option
│
├─ Average Saturation > 6%?
│  │
│  ├─ YES → Is curve steep (Top 10 > 2× Top 1000)?
│  │  │
│  │  ├─ YES → TOP-HEAVY EXPLOIT
│  │  │        │
│  │  │        ├─ Is it a limit?
│  │  │        │  └─ Reduce tier bonus by 1×Tier (or 0.5×Tier for mild fix)
│  │  │        │
│  │  │        ├─ Is it an upgrade?
│  │  │        │  └─ Increase penalty by one tier on scale
│  │  │        │
│  │  │        └─ Is it only strong in specific combos?
│  │  │           └─ Ban that combination instead
│  │  │
│  │  └─ NO → UNIVERSAL APPEAL
│  │           │
│  │           ├─ Target price tier not crowded?
│  │           │  └─ Increase price by 1p
│  │           │
│  │           └─ Target price tier crowded?
│  │              ├─ Limit: Reduce tier bonus by 1×Tier
│  │              └─ Upgrade: Increase penalty by one tier
│  │
│  └─ NO → Average Saturation < 1%?
│     │
│     ├─ YES → DEAD ENHANCEMENT
│     │        │
│     │        ├─ Is 1p tier not crowded?
│     │        │  └─ Reduce price by 1p
│     │        │
│     │        ├─ Is it a limit?
│     │        │  └─ Increase tier bonus by 1×Tier (or 0.5×Tier)
│     │        │
│     │        └─ Is it an upgrade?
│     │           └─ Reduce penalty by one tier
│     │
│     └─ NO → Check for Inverted Pattern or Volatility
│              │
│              ├─ Top 1000 > Top 10? → INVERTED CURVE
│              │                        └─ Same as Top-Heavy fixes
│              │
│              └─ Volatile spikes? → NICHE/VOLATILE
│                                    └─ Consider banning problem combos
```

---

## Priority Ranking System

### 🔴 Critical Priority (Fix Immediately)

**Criteria:**
- Top 10 saturation > 20% AND drops to < 5% in Top 1000
- Average saturation > 15%
- Drop Severity > 0.7

**Recommended Approach:**
- Use conservative fixes (1×Tier or one penalty tier)
- Avoid price changes if price tier would become crowded
- Consider combination bans if pattern suggests synergy abuse

---

### 🟠 High Priority (Fix Soon)

**Criteria:**
- Flat curve with average saturation 8-15%
- Top 10 saturation 15-20% with moderate drop-off
- Flatness Score < 3

**Recommended Approach:**
- Price changes preferred (if tier distribution allows)
- Otherwise use bonus/penalty adjustments
- Monitor for cascade effects after changes

---

### 🟡 Medium Priority (Monitor and Adjust)

**Criteria:**
- Inverted patterns (Top 1000 > Top 10)
- Average saturation 6-8% but uneven
- Volatile spikes

**Recommended Approach:**
- Conservative adjustments (0.5×Tier or partial penalty tier)
- May resolve naturally after higher priority fixes
- Watch for pattern changes

---

### 🟢 Low Priority (Nice to Fix)

**Criteria:**
- Average saturation 1-2% or 7-8%
- Minor optimization exploits
- Close to target but slightly off

**Recommended Approach:**
- Smallest possible adjustments
- May not need fixing if price distribution is healthy
- Address only after all higher priorities resolved

---

### ❌ Buff Required (Dead Content)

**Criteria:**
- Average saturation < 1%
- Never appears in Top 50
- Completely unused

**Recommended Approach:**
- Start with 0.5×Tier or one penalty tier reduction
- Test before further buffs
- High risk of over-correction

---

## Recommended Fix Templates

### Template 1: Top-Heavy Exploit (Limit)

```
Enhancement: [NAME]
Type: Limit
Current: [COST]p, +[MULTIPLIER]×Tier bonus, [CONDITION]
Pattern: [TOP_10]% → [TOP_50]% → [TOP_100]% → [TOP_1000]%

Diagnosis: Top-Heavy Exploit
- Drop Severity: [CALC] (>0.6 threshold)
- Optimized by skilled builders, ignored by casual players
- Skilled players exploit [SPECIFIC MECHANIC]

Recommended Fix:
REDUCE TIER BONUS: +[OLD]×Tier → +[NEW]×Tier
Keep cost at [COST]p

⚠️ Sensitivity Warning:
- 1×Tier change can move saturation by 10-15%
- Monitor closely after implementation
- Consider 0.5×Tier adjustment if pattern is moderate

Reasoning:
[Explain why bonus reduction targets optimization while 
preserving accessibility]

Expected Outcome:
- Top 10: [OLD]% → [TARGET_LOW]-[TARGET_HIGH]% (±5% uncertainty)
- Top 1000: [OLD]% → [TARGET_LOW]-[TARGET_HIGH]% (±3% uncertainty)
- Flattened curve toward 1-6% range

Price Tier Check:
- Current [COST]p tier: [COUNT] enhancements ([PERCENT]%)
- No price change needed (within 25-40% acceptable range)
```

---

### Template 2: Top-Heavy Exploit (Upgrade)

```
Enhancement: [NAME]
Type: Upgrade
Current: [COST]p, [CURRENT_PENALTY], [EFFECT]
Pattern: [TOP_10]% → [TOP_50]% → [TOP_100]% → [TOP_1000]%

Diagnosis: Top-Heavy Exploit
- Drop Severity: [CALC] (>0.6 threshold)
- Optimized by skilled builders for specific scenarios
- [EXPLAIN WHY IT'S STRONG IN TOP BUILDS]

Recommended Fix:
INCREASE PENALTY: [OLD_PENALTY] → [NEW_PENALTY]
(Moving from Tier [X] to Tier [Y] on penalty scale)

Alternative Fix (if combo-specific):
BAN COMBINATION: [NAME] + [PROBLEMATIC_PAIR]
Keep penalty at [CURRENT_PENALTY]

⚠️ Sensitivity Warning:
- One tier penalty shift can move saturation by 10-15%
- Test incremental changes
- Consider combo ban if only strong in specific builds

Reasoning:
[Explain why penalty increase or ban addresses the issue]

Expected Outcome:
- Top 10: [OLD]% → [TARGET]% (±5% uncertainty)
- Overall more balanced usage across skill levels

Price Tier Check:
- Current [COST]p tier: [COUNT] enhancements ([PERCENT]%)
- No price change needed
```

---

### Template 3: Universal Appeal

```
Enhancement: [NAME]
Type: [Upgrade/Limit]
Current: [COST]p, [BONUS/PENALTY]
Pattern: [TOP_10]% → [TOP_50]% → [TOP_100]% → [TOP_1000]%

Diagnosis: Universal Appeal
- Flatness Score: [CALC] (<3 threshold)
- Popular at all skill levels
- No special optimization required

Recommended Fix - OPTION A (Price Adjustment):
INCREASE COST: [OLD_COST]p → [NEW_COST]p

Price Tier Check - BEFORE:
- [OLD_COST]p tier: [COUNT] enhancements ([PERCENT]%)
- [NEW_COST]p tier: [COUNT] enhancements ([PERCENT]%)

Price Tier Check - AFTER:
- [NEW_COST]p tier will have: [NEW_COUNT] ([NEW_PERCENT]%)
- ⚠️ CONCERN if >40%, proceed with Option B instead

Recommended Fix - OPTION B (if price tier would be crowded):
[If Limit]: REDUCE TIER BONUS: +[OLD]×Tier → +[NEW]×Tier  
[If Upgrade]: INCREASE PENALTY: [OLD] → [NEW]

⚠️ Sensitivity Warning:
- 1p price change can move saturation by 15-20%
- Largest lever available, use cautiously

Reasoning:
[Explain why this makes sense at new price/penalty tier]

Expected Outcome:
- Proportional saturation drop across all tiers
- [OLD_AVG]% average → 1-6% target range
- More meaningful build choices at [NEW_COST]p tier
```

---

### Template 4: Dead Enhancement

```
Enhancement: [NAME]
Type: [Upgrade/Limit]
Current: [COST]p, [BONUS/PENALTY]
Pattern: [TOP_10]% → [TOP_50]% → [TOP_100]% → [TOP_1000]%

Diagnosis: Dead Enhancement
- Average saturation: [VALUE]% (target: 1-6%)
- Reason: [Cost too high / Penalty too severe / Bonus too weak]

Recommended Fix - OPTION A (Price Reduction):
REDUCE COST: [OLD_COST]p → [NEW_COST]p

Price Tier Check:
- [NEW_COST]p tier currently: [COUNT] enhancements ([PERCENT]%)
- ⚠️ Will become: [NEW_COUNT] ([NEW_PERCENT]%)
- CONCERN if >40%, proceed with Option B instead

Recommended Fix - OPTION B (Bonus/Penalty Adjustment):
[If Limit]: INCREASE TIER BONUS: +[OLD]×Tier → +[NEW]×Tier
[If Upgrade]: REDUCE PENALTY: [OLD] → [NEW]
(Moving from Tier [X] to Tier [Y] on penalty scale)

⚠️ Sensitivity Warning:
- Small buffs can over-correct (dead → dominant)
- Start with conservative adjustment
- 1p price reduction can move 0.5% → 8%
- 1×Tier bonus increase can move 1% → 10%

Reasoning:
[Explain what makes this unappealing and how fix addresses it]

Expected Outcome:
- Becomes viable option in appropriate builds
- Target: 1-6% saturation
- Monitor closely for over-correction
```

---

### Template 5: Combination Ban

```
Problematic Combination Detected

Enhancement A: [NAME_A] ([COST]p, [SPECS])
Enhancement B: [NAME_B] ([COST]p, [SPECS])

Issue:
- Individual saturations: A=[X]%, B=[Y]%  
- When paired together: [Z]% (or anecdotally dominant)
- Synergy: [EXPLAIN MECHANICAL INTERACTION]

Recommended Fix:
BAN COMBINATION: [NAME_A] + [NAME_B]
- Keep both enhancements unchanged individually
- Prevent selection of both in same build

Alternative Fix (if ban system not available):
- Nerf Enhancement A: [SPECIFIC CHANGE]
- Nerf Enhancement B: [SPECIFIC CHANGE]
- ⚠️ Warning: Will weaken both in non-combo scenarios

Reasoning:
[Explain why the combination is problematic but 
individual pieces are fine]

Implementation:
- Add mutual exclusion rule to build validator
- Document in compatibility rules
- Monitor other potential problematic pairs
```

---

## Testing Protocol

### Phase 1: Critical Fixes Only (Conservative)
1. Implement 🔴 Critical Priority changes
2. **Use minimum adjustments:** 1×Tier or one penalty tier
3. Run simulation with standard settings
4. Generate new heatmap
5. **Check for overcorrection** (did 20%→5% become 5%→20%?)
6. Document actual vs expected outcomes

### Phase 2: Adjust Overcorrections
1. Identify any overcorrections from Phase 1
2. **Reverse half the change** (if went too far)
3. Run simulation again
4. Verify corrections

### Phase 3: High Priority Fixes
1. Implement 🟠 High Priority changes
2. **Check price tier distribution** after each change
3. Run simulation
4. Verify cascade effects (did fixing X affect Y?)

### Phase 4: Medium/Low Priority & Buffs
1. Implement remaining changes
2. Run final simulation
3. Calculate system-wide metrics
4. Document final price tier distribution

---

## System Health Metrics

Track these after each balance pass:

```
1. Overall Balance Score:
   = (Count of Medium 1-6% enhancements) / (Total enhancements)
   Target: > 0.60

2. Price Tier Distribution:
   1p: [PERCENT]% (target: 25-40%)
   2p: [PERCENT]% (target: 25-40%)
   3p: [PERCENT]% (target: 25-40%)

3. Average Saturation Variance:
   = Std Dev of all average saturations
   Target: < 5.0

4. Top-Heavy Ratio:
   = (Avg Top 10 saturation) / (Avg Top 1000 saturation)
   Target: 0.8 - 1.2

5. Dead Enhancement Count:
   = Count of enhancements < 1% average saturation
   Target: < 10% of total

6. Dominant Enhancement Count:
   = Count of enhancements > 15% average saturation
   Target: 0
```

---

## Input Format for Future Analysis

```markdown
## Dataset Information
- Archetype(s): [focused / dual_natured / combined]
- Tier: [3/4/5]
- Total Enhancements: [NUMBER]
- Target Saturation Range: [1-6% default]

## Heatmap Data (REQUIRED)
[Paste full table: Rank, Enhancement, Type, Cost, Top 10, Top 50, Top 100, Top 200, Top 500, Top 1000, Avg]

## Optional: Enhancement Ranking Report
[Include if investigating specific enhancements or need performance context]
[Most useful columns: Avg Turns, Top20% vs Med, Med Rank, Attack Type Breakdown]

## Known Problematic Combinations (if any)
- [Enhancement A] + [Enhancement B]: [Issue description]

## Recent Changes (if any)
- [Enhancement]: Changed from [OLD] to [NEW]
- [Enhancement]: Changed from [OLD] to [NEW]

## Optional Context
- Specific concerns: [if any]
- Custom goals: [if different from defaults]
```

---

## Response Format (What I Will Provide)

When you provide a heatmap, I will respond with:

### 1. System Health Check
```
Overall Balance Score: [VALUE] (target: >0.60)
Price Tier Distribution:
  - 1p: [COUNT] ([PERCENT]%) [STATUS: OK/CROWDED/SPARSE]
  - 2p: [COUNT] ([PERCENT]%) [STATUS: OK/CROWDED/SPARSE]
  - 3p: [COUNT] ([PERCENT]%) [STATUS: OK/CROWDED/SPARSE]

Enhancement Distribution:
  - High (>6%): [COUNT] ([PERCENT]%)
  - Medium (1-6%): [COUNT] ([PERCENT]%)  
  - Low (<1%): [COUNT] ([PERCENT]%)
```

### 2. Prioritized Recommendations

For each priority tier (🔴🟠🟡🟢❌), I'll provide:
- Enhancement name and current stats
- Pattern classification
- Specific fix using appropriate template
- Sensitivity warnings
- Price tier impact analysis
- Expected outcome ranges

### 3. Combination Ban Suggestions (if applicable)

List of problematic combinations that should be banned instead of nerfing individual pieces.

### 4. Testing Phase Recommendations

Suggested order of implementation:
- Phase 1: [List of critical fixes with conservative adjustments]
- Phase 2: [Overcorrection checks]
- Phase 3: [High priority fixes]
- Phase 4: [Remaining changes]

### 5. Projected Outcomes

```
Expected System Health After Changes:
- Balance Score: [CURRENT] → [PROJECTED]
- Price Distribution: [PROJECTED COUNTS]
- Estimated enhancements in 1-6% range: [PROJECTED]%
```

---

## Quick Reference: What Data Answers What Question

| Question | Best Report | Why |
|----------|-------------|-----|
| Which enhancements need nerfs/buffs? | **Heatmap** | Shows saturation directly |
| Is my price distribution healthy? | **Heatmap** | Count by cost, check 25-40% range |
| Is this enhancement popular? | **Heatmap** | That's what saturation measures |
| What pattern type is this? | **Heatmap** | Compare Top 10 vs Top 1000 |
| How do top builds perform with this? | Ranking Report | Top20% vs Med column |
| Does this enhancement actually work well? | Ranking Report | Avg Turns, Med Rank |
| What attack types use this? | Ranking Report | Attack type breakdown |
| What should I prioritize fixing? | **Heatmap** | High saturation = priority |
| Should I change price or bonus? | **Heatmap** | Pattern type determines fix |

---

## Special Notes

### On Sensitivity
- **Every recommendation will include:** ⚠️ Sensitivity warnings
- **All adjustments default to:** Smallest possible increment
- **Expectations set with:** ±5-10% uncertainty ranges
- **Overcorrection monitoring:** Built into testing phases

### On Price Distribution
- **Calculated from heatmap** by counting enhancements at each cost
- **Checked before every price change recommendation**
- **Alternative fixes provided** if target tier crowded
- **Preference given to** bonus/penalty adjustments when distribution fragile

### On Combination Bans
- **Suggested when:** Individual enhancements balanced but problematic together
- **Format provided** for implementation
- **Alternative nerfs** included if ban system unavailable

### On Using Ranking Report
- **Include when:** Investigating why saturation doesn't match expectations
- **Skip when:** Just doing routine balance check
- **Most useful for:** Catching noob traps and hidden gems

---

**END OF GUIDE v2.1**

This guide is production-ready and reflects the reality that saturation IS balance, and the heatmap is your primary diagnostic tool.