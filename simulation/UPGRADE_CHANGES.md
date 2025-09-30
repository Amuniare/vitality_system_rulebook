# Upgrade and Limit Changes: Old Simulation → New Rules

This document comprehensively tracks all cost and mechanical differences between the old simulation system (backup_2025-09-26) and the new rules (06_section_6_attacks.md).

**Last Updated:** 2025-09-29

---

## SUMMARY

### Changes Overview
- **Upgrade Cost Changes:** 20 upgrades modified (most doubled)
- **Limit Cost Changes:** 10 limits modified
- **Mechanical Changes:** 4 upgrades with functional differences
- **New Content:** 40+ new limits, multiple new upgrades (not yet implemented)

### Cost Philosophy
The new rules system appears to follow a rebalancing philosophy where:
- Most upgrades doubled in cost (2x multiplier)
- Some high-impact upgrades increased more (Double-Tap 3x, Extra Attack 2.67x)
- Turn-based limits significantly increased (Steady 3x)
- High-risk limits became cheaper (Unreliable 3 reduced by 50%)

---

## PART 1: UPGRADE COST CHANGES

### Category: Accuracy Modifiers

| Upgrade | Old Cost | New Cost | Multiplier | Notes |
|---------|----------|----------|------------|-------|
| **Accurate Attack** | 5p | 10p | 2x | +Tier accuracy, -Tier damage |
| **Reliable Accuracy** | 10p | 20p | 2x | Advantage with -3 accuracy penalty |
| **Overhit** | 20p | 40p | 2x | Bonus damage when exceeding avoidance by 5+ |

### Category: Damage Modifiers

| Upgrade | Old Cost | New Cost | Multiplier | Notes |
|---------|----------|----------|------------|-------|
| **Power Attack** | 5p | 10p | 2x | +Tier damage, -Tier accuracy |
| **High Impact** | 10p | 20p | 2x | Flat 15 damage instead of 3d6 |
| **Critical Effect** | 10p | 20p | 2x | Dice explode on 5-6, -2 damage penalty |
| **Brutal** | 20p | 40p | 2x | Extra damage when exceeding DR by 10+ |
| **Armor Piercing** | 30p | 60p | 2x | Ignore endurance portion of durability |

### Category: Critical Hit Mechanics

| Upgrade | Old Cost | New Cost | Multiplier | Notes |
|---------|----------|----------|------------|-------|
| **Critical Accuracy** | 10p | 20p | 2x | Crit range 15-20 |
| **Powerful Critical** | 20p | 40p | 2x | Crit range 15-20 + extra Tier bonus |
| **Double-Tap** | 20p | 60p | 3x ⚠️ | Attack again on crit (highest increase) |
| **Explosive Critical** | 60p | 60p | 1x | UNCHANGED - AOE on crit |

### Category: Multi-Attack

| Upgrade | Old Cost | New Cost | Multiplier | Notes |
|---------|----------|----------|------------|-------|
| **Quick Strikes** | 20p | 40p | 2x | ⚠️ MECHANIC CHANGE: 3→2 attacks |
| **Barrage** | 30p | 60p | 2x | Chain 3 attacks |
| **Extra Attack** | 30p | 80p | 2.67x ⚠️ | Attack again on hit+effect |

### Category: Damage Over Time

| Upgrade | Old Cost | New Cost | Multiplier | Notes |
|---------|----------|----------|------------|-------|
| **Bleed** | 30p | 60p | 2x | Damage repeats for 2 turns, -Tier damage |

### Category: Instant Defeat

| Upgrade | Old Cost | New Cost | Multiplier | Notes |
|---------|----------|----------|------------|-------|
| **Finishing Blow 1** | 10p | 20p | 2x | Defeat if ≤5 HP |
| **Finishing Blow 2** | 20p | 40p | 2x | Defeat if ≤10 HP |
| **Finishing Blow 3** | 40p | 80p | 2x | Defeat if ≤15 HP |
| **Culling Strike** | 10p | 20p | 2x | Defeat if ≤1/5 max HP |

### Category: Specialized Combat

| Upgrade | Old Cost | New Cost | Multiplier | Notes |
|---------|----------|----------|------------|-------|
| **Splinter** | 40p | 80p | 2x | Attack again on enemy defeat |

### Category: Enemy Type (Slayer Series)

| Upgrade | Old Cost | New Cost | Multiplier | Notes |
|---------|----------|----------|------------|-------|
| **Minion Slayer (Acc/Dmg)** | 10p | 10p | 1x | UNCHANGED |
| **Captain Slayer (Acc/Dmg)** | 10p | 10p | 1x | UNCHANGED |
| **Elite Slayer (Acc/Dmg)** | 10p | 10p | 1x | UNCHANGED |
| **Boss Slayer (Acc/Dmg)** | 10p | 10p | 1x | UNCHANGED |

**Note:** Slayer upgrades retained their costs, likely due to their conditional nature.

---

## PART 2: LIMIT COST CHANGES

### Category: Unreliable (Random Activation)

| Limit | Old Cost | New Cost | Multiplier | Effect | DC | Notes |
|-------|----------|----------|------------|--------|----|----|
| **Unreliable 1** | 20p | 40p | 2x | +1×Tier | 5 | Low risk, low reward |
| **Unreliable 2** | 20p | 20p | 1x | +3×Tier | 10 | UNCHANGED |
| **Unreliable 3** | 20p | 10p | 0.5x ⚠️ | +5×Tier | 15 | CHEAPER - high risk, high reward |

**Philosophy:** Higher-risk limits became more cost-efficient.

### Category: Turn-Based

| Limit | Old Cost | New Cost | Multiplier | Old Timing | New Timing | Old Effect | New Effect | Notes |
|-------|----------|----------|------------|------------|------------|------------|------------|-------|
| **Quickdraw** | 30p | 40p | 1.33x | Turns 1-2 | First round | +2×Tier | +2×Tier | ⚠️ Wording change |
| **Steady** | 20p | 60p | 3x ⚠️ | Turn 3+ | Turn 3+ | +1×Tier | +1×Tier | Largest cost increase |
| **Patient** | 20p | 40p | 2x | Turn 5+ | Turn 5+ | +1×Tier | +1×Tier | - |
| **Finale** | 10p | 20p | 2x | Turn 8+ | Turn 7+ | +3×Tier | +2×Tier | ⚠️ Earlier but weaker |

### Category: Charge/Cooldown

| Limit | Old Cost | New Cost | Multiplier | Old Effect | New Effect | Notes |
|-------|----------|----------|------------|------------|------------|-------|
| **Charge Up** | 20p | 40p | 2x | +2×Tier | +2×Tier | - |
| **Charge Up 2** | 20p | 40p | 2x | +3×Tier | +4×Tier | ⚠️ Effect buffed |
| **Cooldown** | 20p | 40p | 2x | +1×Tier | +1×Tier | 3-turn cooldown |

---

## PART 3: MECHANICAL CHANGES

### 1. Quick Strikes - MAJOR CHANGE ⚠️

**Old Implementation:**
- Cost: 20p
- Effect: Make **3 attacks** against single target
- Penalty: -Tier to Accuracy, Damage, and Condition rolls
- Implementation: Makes all 3 attacks regardless of hit/miss

**New Rules:**
- Cost: 40p
- Effect: Make **2 attacks** against single target
- Penalty: -Tier to Accuracy, Damage, and Condition rolls
- Implementation: TBD (likely same - all attacks regardless of outcome)

**Impact:**
- Cost doubled (20p → 40p)
- Attacks reduced from 3 to 2
- Overall nerf: Costs 2x more for fewer attacks

**Files to Update:**
- `combat.py`: Change attack loop from 3 to 2
- `RULES.md`: Update description

---

### 2. Quickdraw - Wording Change ⚠️

**Old Wording:**
- "turns 1-2 only"
- Activates on Turns 1 and 2

**New Wording:**
- "First round of combat"
- Unclear if this means Turn 1 only or Turns 1-2

**Recommendation:**
Interpret "first round" as Turn 1 only for consistency with typical game terminology.

**Files to Update:**
- `simulation.py` or combat activation logic (verify behavior)
- `RULES.md`: Clarify wording

---

### 3. Finale - Cost + Timing + Effect Changes ⚠️

**Old Implementation:**
- Cost: 10p
- Activation: Turn 8 or later
- Effect: +3×Tier to Accuracy and Damage

**New Rules:**
- Cost: 20p
- Activation: Turn 7 or later
- Effect: +2×Tier to Accuracy and Damage

**Impact:**
- Cost doubled (10p → 20p)
- Activates 1 turn earlier (Turn 7 vs Turn 8)
- Weaker bonus (+2×Tier vs +3×Tier)
- Mixed: Earlier but weaker, costs more

**Files to Update:**
- `game_data.py`: Change cost, tier multiplier
- `simulation.py`: Change turn activation from 8 to 7

---

### 4. Charge Up 2 - Effect Buff ⚠️

**Old Implementation:**
- Cost: 20p
- Effect: +3×Tier to Accuracy and Damage

**New Rules:**
- Cost: 40p
- Effect: +4×Tier to Accuracy and Damage

**Impact:**
- Cost doubled (20p → 40p)
- Effect buffed (+3×Tier → +4×Tier)
- Net: Slightly better relative value despite cost increase

**Files to Update:**
- `game_data.py`: Change cost and tier multiplier

---

## PART 4: NEW CONTENT (Not Yet Implemented)

### New Limits (40+ total)

#### HP-Based Limits
- **Timid** (40p): +Tier at max HP with no conditions
- **Near Death** (20p): +2×Tier at ≤25 HP
- **Bloodied** (20p): +Tier at ≤50 HP
- **Unhealthy** (60p): +Tier at 50+ points below max HP

#### Conditional Limits
- **Vengeful** (60p): +Tier when hit since last turn
- **Revenge** (40p): +Tier when damaged since last turn
- **Unbreakable** (40p): +Tier when hit but no damage since last turn
- **Untouchable** (40p): +Tier when all attacks missed since last turn
- **Avenger** (10p): +2×Tier when ally unconscious/great peril
- **Passive** (60p): +Tier when not attacked since last turn
- **Careful** (60p): +Tier when not damaged since last turn

#### Sequential Limits
- **Combo Move** (60p): +Tier when hit same enemy last turn
- **Infected** (40p): +Tier when applied condition last turn
- **Relentless** (40p): +Tier when dealt damage last turn
- **Slaughter** (20p): +Tier when defeated enemy last turn

#### Positioning Limits
- **Rooted** (40p): +Tier when cannot move this turn
- **Blitz** (40p): +Tier when moved half movement toward target
- **Long Distance Fighter** (60p): +Tier when no enemies within 5 spaces
- **Dangerous** (10p): +Tier when no allies within 15sp, no civilians within 30sp

#### Charges System
- **Charges 1** (30p): +Tier, single use, recharges after rest
- **Charges 2** (60p): +Tier, 2 uses, recharges after rest

#### Sacrifice Limits
- **Sacrifice Minion** (40p): +Tier when 10 HP summon killed
- **Sacrifice Captain** (20p): +Tier when 25 HP summon killed
- **Sacrifice Vanguard** (40p): +2×Tier when 50 HP summon killed
- **Sacrifice Boss** (20p): +2×Tier when 100 HP summon killed

#### Ability-Dependent Limits
- **Drain Reserves** (40p): +Tier, lose healing charge
- **Tower Defense** (40p): +Tier vs targets adjacent to wall
- **Compressed Release** (40p): +Tier, disable aura until next turn
- **Domain** (40p): +Tier vs targets within barrier
- **Grappler** (40p): +Tier vs grabbed targets
- **Exploit** (40p): +Tier vs conditioned targets

#### Other Limits
- **Exhausting** (20p): +2×Tier, costs an effort
- **Attrition** (60p): +Tier, costs 20 HP per use

### New Upgrades (Not Yet Implemented)

#### Range Extensions
- **Extended Range** (20p): 30sp range instead of 15sp
- **Long Range** (30p): 100sp range instead of 30sp
- **Perception Range** (20p): Target anyone you can see (Direct attacks)

#### AOE Modifications
- **Enhanced Scale** (20p): Increase AOE size
- **Precise** (40p): Choose targets in AOE
- **Ranged Area** (20p): Place AOE at range

#### Condition-Focused
- **Lasting Condition** (40p): Extend condition duration
- **Contagious** (60p): Condition spreads to nearby target
- **Cursed** (30p): Make condition permanent based on HP
- **Overwhelming Affliction** (40p): Make condition permanent based on roll
- **Concentration** (40p): Repeat condition attack as free action
- **Critical Condition** (40p): Condition crit range 15-20
- **Powerful Condition Critical** (40p): Condition crit + extra bonus

#### Other Combat
- **Ricochet** (30p): Attack another target on crit
- **Martial Artist** (40p): Apply brawl effect on crit
- **Environmental** (40p per rank): Create hazardous terrain
- **Shatter** (20p): 2x damage vs structures
- **Leech** (60p): Regain HP equal to half damage
- **Pounce** (20p): Move 6sp toward target
- **Menacing** (80p): Intimidate on enemy defeat
- **Disengage** (20p): Prevent opportunity attacks
- **Priority Target** (40p): Mark target for ally bonuses
- **Bully** (20p): Forced movement vs lower Power
- **Intimidating Presence** (40p): Taunt AOE on defeat
- **Terrifying Display** (40p): Frighten AOE on defeat
- **Channeled** (60p): Build bonus over consecutive turns

---

## PART 5: IMPLEMENTATION STATUS

### ✅ Implemented in This Update
1. All upgrade cost changes (20 upgrades)
2. All limit cost changes (10 limits)
3. Quick Strikes mechanical change (3→2 attacks)
4. Finale timing and effect change
5. Charge Up 2 effect buff
6. Quickdraw wording clarification

### ❌ Not Implemented (Future Work)
1. 40+ new limits (requires extensive combat state tracking)
2. 30+ new upgrades (condition-focused, range, etc.)
3. New systems: Charges, HP costs, Effort costs
4. Ability-dependent mechanics (Wall, Aura, Barrier integration)

**Rationale:** The new limits and upgrades require substantial combat engine overhaul to track:
- Turn-by-turn state (what happened last turn)
- Position tracking (distance from enemies/allies)
- HP thresholds and changes
- Condition application history
- Summon tracking
- Active ability state

These are deferred to future updates when the simulation architecture can support comprehensive state tracking.

---

## PART 6: VALIDATION CHECKLIST

### Pre-Implementation Validation
- [ ] Backup current simulation files
- [ ] Document all current costs
- [ ] Verify new costs from 06_section_6_attacks.md

### Post-Implementation Validation
- [ ] `python -c "from game_data import UPGRADES; print(UPGRADES['power_attack'].cost)"` → Should output 10
- [ ] `python -c "from game_data import UPGRADES; print(UPGRADES['double_tap'].cost)"` → Should output 60
- [ ] `python -c "from game_data import LIMITS; print(LIMITS['unreliable_1'].cost)"` → Should output 40
- [ ] `python -c "from game_data import LIMITS; print(LIMITS['steady'].cost)"` → Should output 60
- [ ] Test Quick Strikes build → Should make 2 attacks, not 3
- [ ] Test Finale build → Should activate Turn 7, not Turn 8
- [ ] Run full simulation → Should complete without errors

---

## PART 7: NOTES FOR FUTURE UPDATES

### Design Philosophy Observations
1. **Cost Doubling Pattern:** Most upgrades exactly doubled, suggesting a global rebalancing
2. **High-Impact Exceptions:** Double-Tap (3x), Extra Attack (2.67x), Steady (3x) got special treatment
3. **Risk/Reward Adjustment:** Unreliable 3 became cheaper, encouraging high-risk builds
4. **Turn-Based Rebalancing:** Late-game limits (Steady, Patient, Finale) became more expensive
5. **Slayer Stability:** Conditional bonuses kept same cost, likely due to limited applicability

### Future Simulation Goals
When implementing new limits, prioritize by implementation complexity:

**Tier 1 (Easiest):**
- HP-based limits (Timid, Near Death, Bloodied, Unhealthy)
- Random limits (already implemented pattern)
- Charges system (usage tracking)

**Tier 2 (Moderate):**
- Sequential limits (require previous turn state)
- Conditional limits (require damage/hit tracking)
- Time-based extensions

**Tier 3 (Complex):**
- Positioning limits (require spatial tracking)
- Ability-dependent limits (require feature detection)
- Sacrifice limits (require summon system)

---

## CHANGELOG

### 2025-09-29 - Initial Document
- Created comprehensive comparison between old simulation and new rules
- Documented all 30 cost changes
- Documented 4 mechanical changes
- Listed 40+ new limits for future implementation
- Listed 30+ new upgrades for future implementation

---

**End of Document**