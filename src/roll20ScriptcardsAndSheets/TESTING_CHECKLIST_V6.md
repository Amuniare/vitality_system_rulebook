# Roll20 v6.0 Testing Checklist

**Date Started:** ___________
**Tester:** Trent
**Version:** 6.0
**Campaign:** Roll20 Vitality System Campaign

---

## Pre-Testing Setup

### Files to Upload to Roll20

- [ ] **Character Sheet HTML:** `char_sheet_v6/rpgSheet_v6.0.html`
- [ ] **Character Sheet CSS:** `char_sheet_v6/rpgsheet_warrant_6.0.css` (if separate)
- [ ] **ScriptCards Macro:** `scriptcards_v6/Scriptcards_Attacks_Library_v6.0.txt`

### Test Character Setup

- [ ] Create new test character named "V6 Test Character"
- [ ] Set Tier to 4
- [ ] Set base attributes:
  - Focus: 2
  - Mobility: 3
  - Power: 4
  - Endurance: 5
  - Awareness: 1
  - Communication: 1
  - Intelligence: 1
- [ ] Note: Do NOT copy existing v5.5 character (stat formulas have changed)

---

## Phase 1: Character Sheet - Core Stats Testing

### Test 1.1: Avoidance Calculation

**Expected:** 5 + Tier + Mobility = 5 + 4 + 3 = **12**
**v5.5 Would Be:** 10 + 4 + 3 = 17

- [ ] Avoidance displays as 12
- [ ] Changing Mobility to 5 updates to 14
- [ ] Changing Tier to 6 updates to 13 (with Mobility 3)
- [ ] Avoidance Mod field adds correctly (+2 = 14)
- [ ] Avoidance does NOT change when clicking non-existent Primary Action checkbox

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 1.2: Durability Calculation

**Expected:** Tier + Endurance = 4 + 5 = **9**
**v5.5 Would Be:** 4 + (5 × 1.5) = 12 (with 1.5× multiplier)

- [ ] Durability displays as 9
- [ ] Changing Endurance to 6 updates to 10
- [ ] No multiplier effect (should be straight addition)
- [ ] Durability Mod field adds correctly (+3 = 12)

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 1.3: Movement Calculation

**Expected:** Mobility + (2 × Tier) = 3 + (2 × 4) = **11**
**v5.5 Would Be:** max(4, 6) + 3 = 9 (with min tier 6)

- [ ] Movement displays as 11
- [ ] Changing Tier to 2 updates to 7 (3 + 4, not 3 + 6)
- [ ] Changing Mobility to 5 updates to 13 (with Tier 4)
- [ ] Movement Mod field adds correctly (+2 = 13)

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 1.4: Damage Calculation

**Expected:** Tier + Power = 4 + 4 = **8**
**v5.5 Would Be:** 4 + (4 × 1.5) = 10 (with 1.5× multiplier)

- [ ] Damage displays as 8
- [ ] Changing Power to 6 updates to 10
- [ ] No multiplier effect (should be straight addition)
- [ ] Damage Mod field adds correctly (+2 = 10)

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 1.5: Swift Archetype Test

**Setup:** Tier 4, Mobility 3
**Expected:** 11 + ⌈4/2⌉ = 11 + 2 = **13**

- [ ] Enable Swift checkbox
- [ ] Movement updates to 13
- [ ] Disable Swift checkbox
- [ ] Movement returns to 11
- [ ] Change Tier to 5 with Swift enabled
- [ ] Movement = 3 + 10 + 3 = 16 (⌈5/2⌉ = 3)

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 1.6: Primary Action Removal Verification

- [ ] NO checkboxes appear next to Avoidance
- [ ] NO checkboxes appear next to Durability
- [ ] NO checkboxes appear next to Resolve/Stability/Vitality
- [ ] NO checkboxes appear next to Accuracy/Damage/Conditions
- [ ] NO checkboxes appear next to Movement
- [ ] NO checkboxes appear next to Initiative

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

---

## Phase 2: Character Sheet - Attack Builder Testing

### Test 2.1: Attack Type Dropdown

- [ ] Dropdown shows exactly 8 options
- [ ] Option 0: "Melee (Accuracy)"
- [ ] Option 1: "Melee (Damage & Conditions)"
- [ ] Option 2: "Ranged"
- [ ] Option 3: "Area"
- [ ] Option 4: "Direct Condition"
- [ ] Option 5: "Direct Area Condition"
- [ ] Option 6: "Direct Damage"
- [ ] Option 7: "Direct Area Damage"
- [ ] NO option for old "Direct" type
- [ ] NO option for old "AOE Direct" type

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 2.2: Condition Effect Dropdown

- [ ] Dropdown shows exactly 8 options (including "None")
- [ ] Option 0: "None (Damage Only)"
- [ ] Option 1: "Brawl (Push/Prone/Grab)"
- [ ] Option 2: "Frighten"
- [ ] Option 3: "Taunt"
- [ ] Option 4: "Charm"
- [ ] Option 5: "Weaken"
- [ ] Option 6: "Stun"
- [ ] Option 7: "Control"
- [ ] NO options for: Disarm, Grab, Shove, Daze, Blind, Setup, Disable Specials

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 2.3: Upgrades Section Organization

**Critical Bonuses section exists:**
- [ ] Critical Accuracy
- [ ] Powerful Critical
- [ ] Ricochet
- [ ] Double-Tap
- [ ] Explosive Critical
- [ ] Martial Artist

**Accuracy Upgrades section exists:**
- [ ] Reliable Accuracy
- [ ] Overhit
- [ ] NO "Blitz" (moved to Limits)
- [ ] NO "Accurate Attack"

**Damage Upgrades section exists:**
- [ ] Power Attack
- [ ] High Impact
- [ ] Reliable Effect
- [ ] Critical Effect
- [ ] Armor Piercing
- [ ] Brutal
- [ ] Bleed
- [ ] Shatter
- [ ] Leech
- [ ] Finishing Blow (1-3)
- [ ] Culling Strike
- [ ] NO "Enhanced Effect"
- [ ] NO "Consistent Effect"
- [ ] NO "Splash Damage"

**Condition Upgrades section exists:**
- [ ] Lasting Condition
- [ ] Contagious
- [ ] Cursed
- [ ] Overwhelming
- [ ] Concentration
- [ ] Critical Condition
- [ ] Powerful Condition Critical
- [ ] NO "Mass Effect"
- [ ] NO "Collateral"
- [ ] NO "Crit CN"

**Generic Attack Upgrades section exists:**
- [ ] Extended Range
- [ ] Long Range
- [ ] Perception Range
- [ ] Enhanced Scale
- [ ] Precise
- [ ] Ranged Area

**Melee Specialized section exists:**
- [ ] Quick Strikes ONLY
- [ ] NO "Heavy Strike"
- [ ] NO "Whirlwind Strike"

**Ranged Specialized section exists:**
- [ ] Headshot
- [ ] Barrage
- [ ] NO "Scatter Shot"

**General Specialized Combat section exists:**
- [ ] Flurry
- [ ] Pounce
- [ ] Splinter
- [ ] Priority Target
- [ ] Bully
- [ ] Menacing
- [ ] Disengage
- [ ] Extra Attack
- [ ] Intimidating Presence
- [ ] Terrifying Display
- [ ] NO "Analyzing Strike"
- [ ] NO "Follow-Up Strike"
- [ ] NO "Counterattack"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 2.4: Limits Section Exists

**Section should be collapsible/expandable:**
- [ ] Limits section exists as `<details>` tag
- [ ] Section is labeled "Attack Limits (NEW v6.0)"
- [ ] Description mentions bonuses apply to Accuracy, Damage, AND Conditions

**Usage Limits subsection:**
- [ ] Charges 1
- [ ] Charges 2

**HP-Based Limits subsection:**
- [ ] Timid
- [ ] Near Death
- [ ] Bloodied

**Conditional Limits subsection:**
- [ ] Vengeful
- [ ] Revenge
- [ ] Unbreakable
- [ ] Untouchable
- [ ] Avenger
- [ ] Passive
- [ ] Careful

**Sequential Limits subsection:**
- [ ] Combo Move
- [ ] Infected
- [ ] Relentless
- [ ] Slaughter

**Positioning Limits subsection:**
- [ ] Rooted
- [ ] Blitz
- [ ] Long Distance Fighter
- [ ] Dangerous

**Random Limits subsection:**
- [ ] Unreliable 1 (DC 5)
- [ ] Unreliable 2 (DC 10)
- [ ] Unreliable 3 (DC 15)

**Time-Based Limits subsection:**
- [ ] Quickdraw
- [ ] Steady
- [ ] Patience
- [ ] Finale

**Other Limits subsection:**
- [ ] Charge Up
- [ ] Charge Up 2
- [ ] Exhausting
- [ ] Cooldown
- [ ] Attrition
- [ ] Drain Reserves
- [ ] Tower Defense
- [ ] Compressed Release
- [ ] Domain
- [ ] Grappler
- [ ] Exploit

**Sacrifice Limits subsection:**
- [ ] Sacrifice Minion
- [ ] Sacrifice Captain
- [ ] Sacrifice Vanguard
- [ ] Sacrifice Boss

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

---

## Phase 3: ScriptCards - Attack Type Testing

### Setup for ScriptCards Tests

**Create Test Attacks:**
1. **"Type 0 Test"** - Melee (Accuracy), no upgrades, no limits
2. **"Type 1 Test"** - Melee (Damage & Conditions), Roll CN = Resolve, Effect = Taunt
3. **"Type 2 Test"** - Ranged, no upgrades
4. **"Type 3 Test"** - Area, no upgrades
5. **"Type 4 Test"** - Direct Condition, Roll CN = Stability, Effect = Weaken
6. **"Type 5 Test"** - Direct Area Condition, Roll CN = Vitality, Effect = Stun
7. **"Type 6 Test"** - Direct Damage, no condition
8. **"Type 7 Test"** - Direct Area Damage, no condition

**Create Test Dummy Enemy Token:**
- HP: 50
- Avoidance: 15
- Resolve: 15
- Stability: 15
- Vitality: 15

### Test 3.1: Type 0 - Melee (Accuracy)

**Expected:** Accuracy roll gets +Tier bonus

- [ ] Run attack on dummy token
- [ ] ScriptCards output shows accuracy roll
- [ ] Accuracy modifier string shows "+ 4 [Melee AC]" or similar
- [ ] Damage and Condition rolls work normally

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 3.2: Type 1 - Melee (Damage & Conditions)

**Expected:** Damage and Condition rolls get +Tier bonus

- [ ] Run attack on dummy token
- [ ] ScriptCards output shows damage roll
- [ ] Damage modifier string shows "+ 4 [Melee DG/CN]"
- [ ] Condition roll occurs
- [ ] Condition modifier string shows "+ 4 [Melee DG/CN]"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 3.3: Type 2 - Ranged

**Expected:** Normal attack resolution, no special modifiers

- [ ] Run attack on dummy token
- [ ] Accuracy roll occurs
- [ ] Damage roll occurs
- [ ] No unusual modifiers applied

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 3.4: Type 3 - Area

**Expected:** Accuracy gets -Tier penalty

- [ ] Run attack on dummy token
- [ ] ScriptCards output shows accuracy roll
- [ ] Accuracy modifier string shows "- 4 [Area]"
- [ ] Damage and Condition rolls NOT penalized

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 3.5: Type 4 - Direct Condition

**Expected:** NO accuracy roll, condition gets -Tier penalty

- [ ] Run attack on dummy token
- [ ] NO accuracy roll occurs (automatic hit)
- [ ] NO damage roll occurs
- [ ] Condition roll occurs
- [ ] Condition modifier shows "- 4 [Direct CN]"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 3.6: Type 5 - Direct Area Condition

**Expected:** NO accuracy roll, condition gets -2×Tier penalty

- [ ] Run attack on dummy token
- [ ] NO accuracy roll occurs
- [ ] NO damage roll occurs
- [ ] Condition roll occurs
- [ ] Condition modifier shows "- 8 [Direct Area CN]" (2×4)

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 3.7: Type 6 - Direct Damage

**Expected:** NO accuracy roll, flat damage of 15-Tier

- [ ] Run attack on dummy token
- [ ] NO accuracy roll occurs
- [ ] NO condition roll occurs
- [ ] Damage applied = 15 - 4 = 11 (flat, not rolled)
- [ ] Damage modifier shows something like "11 [Direct DG Base]"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 3.8: Type 7 - Direct Area Damage

**Expected:** NO accuracy roll, flat damage of 15-2×Tier

- [ ] Run attack on dummy token
- [ ] NO accuracy roll occurs
- [ ] NO condition roll occurs
- [ ] Damage applied = 15 - (2×4) = 7 (flat, not rolled)
- [ ] Damage modifier shows something like "7 [Direct Area DG Base]"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

---

## Phase 4: ScriptCards - Condition Testing

### Setup
Create attack: Type 1 (Melee DG/CN), Roll CN = varies, Effect Type = varies

### Test 4.1: Brawl Condition

**Setup:** Effect Type = 1 (Brawl)

- [ ] Run attack, pass condition roll
- [ ] ScriptCards output shows "Brawl" application
- [ ] Output prompts: "Choose Push, Prone, or Grab"
- [ ] No automatic marker applied (requires manual choice)

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 4.2: Frighten Condition

**Setup:** Effect Type = 2 (Frighten)

- [ ] Run attack, pass condition roll
- [ ] ScriptCards output shows "Frighten" application
- [ ] Token gets "aura-target" status marker (or similar)
- [ ] Output notes "Must move away from you"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 4.3: Taunt Condition

**Setup:** Effect Type = 3 (Taunt)

- [ ] Run attack, pass condition roll
- [ ] ScriptCards output shows "Taunt" application
- [ ] Token gets "screaming" status marker
- [ ] Output notes "Must include you in attacks"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 4.4: Charm Condition

**Setup:** Effect Type = 4 (Charm)

- [ ] Run attack, pass condition roll
- [ ] ScriptCards output shows "Charm" application
- [ ] Token gets "heart" status marker
- [ ] Output notes "Cannot attack you"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 4.5: Weaken Condition

**Setup:** Effect Type = 5 (Weaken), Tier = 4

**Expected:** Weaken amount = 2×Tier = 8

- [ ] Run attack, pass condition roll
- [ ] ScriptCards output shows "Weaken" application
- [ ] Token gets "radioactive" status marker
- [ ] Output shows "Weaken (8)" or similar
- [ ] Output notes to specify which stat

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 4.6: Stun Condition

**Setup:** Effect Type = 6 (Stun), Target with 50 HP

**Expected:** Resistance bonus = ⌈50/5⌉ = 10

- [ ] Run attack, pass condition roll (account for 1/5 HP bonus)
- [ ] ScriptCards output shows "Stun" application
- [ ] Token gets "lightning-helix" status marker
- [ ] Output shows "adds 10 to Resistance (1/5 HP)"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 4.7: Control Condition

**Setup:** Effect Type = 7 (Control), Target with 50 HP

**Expected:** Resistance bonus = ⌈50/5⌉ = 10

- [ ] Run attack, pass condition roll (account for 1/5 HP bonus)
- [ ] ScriptCards output shows "Control" application
- [ ] Token gets "broken-skull" status marker
- [ ] Output shows "adds 10 to Resistance (1/5 HP)"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

---

## Phase 5: ScriptCards - Upgrade Testing

### Test 5.1: Reliable Accuracy Update

**Setup:** Attack with Reliable Accuracy = 1

**Expected:** 2d20kh1 - 3 (was -4 in v5.5)

- [ ] Run attack
- [ ] ScriptCards shows "2d20kh1" in accuracy dice
- [ ] Modifier shows "-3" penalty
- [ ] NOT "-4" penalty

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 5.2: Bleed Penalty

**Setup:** Attack with Bleed = 1, Tier = 4

**Expected:** -4 to Damage, applies Bleed for 2 turns

- [ ] Run attack that hits
- [ ] Damage modifier shows "- 4 [Bleed Penalty]"
- [ ] Token gets "red" status marker
- [ ] Output shows "Bleed (2 turns)"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 5.3: Leech Penalty

**Setup:** Attack with Leech = 1, Tier = 4, deals 20 damage

**Expected:** -4 to Accuracy, Damage, Conditions; heal ⌈20/2⌉ = 10 HP

- [ ] Run attack
- [ ] Accuracy modifier shows "- 4 [Leech Penalty]"
- [ ] Damage modifier shows "- 4 [Leech Penalty]"
- [ ] Condition modifier shows "- 4 [Leech Penalty]"
- [ ] Output shows "Leech 10 HP" (half damage rounded up)

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 5.4: Channeled Update

**Setup:** Attack with Channeled = 1, Tier = 4

**Expected:** -2×Tier = -8 to start, builds +Tier per turn (max 5×Tier = 20)

- [ ] Run attack (first use)
- [ ] Accuracy modifier shows "- 8 [Channeled Start]"
- [ ] Damage modifier shows "- 8 [Channeled Start]"
- [ ] Condition modifier shows "- 8 [Channeled Start]"
- [ ] Output shows "+Tier per turn, max 5×Tier"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 5.5: Finishing Blow Thresholds

**Setup:** Three attacks with Finishing Blow 1, 2, and 3
**Target:** Enemy with varying HP

**Tier 1 (5 HP threshold):**
- [ ] Enemy at 6 HP: NOT killed
- [ ] Enemy at 5 HP: Killed, "dead" marker applied
- [ ] Output shows "Finishing Blow 1 (5 HP threshold)"

**Tier 2 (10 HP threshold):**
- [ ] Enemy at 11 HP: NOT killed
- [ ] Enemy at 10 HP: Killed, "dead" marker applied
- [ ] Output shows "Finishing Blow 2 (10 HP threshold)"

**Tier 3 (15 HP threshold):**
- [ ] Enemy at 16 HP: NOT killed
- [ ] Enemy at 15 HP: Killed, "dead" marker applied
- [ ] Output shows "Finishing Blow 3 (15 HP threshold)"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 5.6: New Generic Upgrades Display

**Setup:** Create attack with each new generic upgrade enabled

- [ ] Extended Range: Output shows "Extended Range (30sp)"
- [ ] Long Range: Output shows "Long Range (100sp)"
- [ ] Perception Range: Output shows "Perception Range (Unlimited)"
- [ ] Enhanced Scale: Output shows size increase info
- [ ] Precise: Output shows "Select targets in AOE"
- [ ] Ranged Area: Output shows "Origin 15sp away"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 5.7: New Condition Upgrades Display

**Setup:** Create attack with new condition upgrades

- [ ] Concentration: Output shows "Free action repeat, no other attacks"
- [ ] Critical Condition: Critical range changes
- [ ] Powerful Condition Critical: Output shows "15-20, +Tier again"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 5.8: New Combat Upgrades Display

**Setup:** Create attack with new combat upgrades

- [ ] Intimidating Presence: Output shows "2sp burst Taunt on defeat"
- [ ] Terrifying Display: Output shows "2sp burst Frighten on defeat"

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

---

## Phase 6: ScriptCards - Limits Testing

### Test 6.1: Timid Limit

**Setup:**
- Character at max HP (100/100) with NO conditions
- Attack with Timid = 1, Tier = 4

**Expected:** +4 to Accuracy, Damage, Conditions

- [ ] Run attack
- [ ] Accuracy modifier shows "+ 4 [Limits]"
- [ ] Damage modifier shows "+ 4 [Limits]"
- [ ] Condition modifier shows "+ 4 [Limits]"
- [ ] Output shows "Timid Limit Active (+Tier)"

**Negative Test:**
- [ ] Reduce HP to 99
- [ ] Run same attack
- [ ] NO limit bonus appears

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 6.2: Near Death Limit

**Setup:**
- Character at 25 HP or less
- Attack with Near Death = 1, Tier = 4

**Expected:** +8 to all (2×Tier)

- [ ] Run attack at 25 HP
- [ ] All modifiers show "+ 8 [Limits]"
- [ ] Output shows "Near Death Limit Active (+2×Tier)"

**Negative Test:**
- [ ] Set HP to 26
- [ ] Run same attack
- [ ] NO limit bonus appears

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 6.3: Bloodied Limit

**Setup:**
- Character at 50 HP
- Attack with Bloodied = 1, Tier = 4

**Expected:** +4 to all

- [ ] Run attack at 50 HP
- [ ] All modifiers show "+ 4 [Limits]"
- [ ] Output shows "Bloodied Limit Active (+Tier)"

**Negative Test:**
- [ ] Set HP to 51
- [ ] Run same attack
- [ ] NO limit bonus appears

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 6.4: Unreliable 1 Limit

**Setup:** Attack with Unreliable 1 = 1, Tier = 4

**Expected:** Roll d20, if ≥5 then +4 to all

- [ ] Run attack 5+ times
- [ ] Observe d20 roll in output
- [ ] When roll ≥5: All modifiers show "+ 4 [Limits]"
- [ ] When roll <5: NO bonus appears
- [ ] Output shows "Unreliable 1 Passed (rolled X, +Tier)" when applicable

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 6.5: Unreliable 2 Limit

**Setup:** Attack with Unreliable 2 = 1, Tier = 4

**Expected:** Roll d20, if ≥10 then +12 to all (3×Tier)

- [ ] Run attack 5+ times
- [ ] When roll ≥10: All modifiers show "+ 12 [Limits]"
- [ ] When roll <10: NO bonus appears
- [ ] Output shows "Unreliable 2 Passed (rolled X, +3×Tier)" when applicable

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 6.6: Unreliable 3 Limit

**Setup:** Attack with Unreliable 3 = 1, Tier = 4

**Expected:** Roll d20, if ≥15 then +20 to all (5×Tier)

- [ ] Run attack 5+ times
- [ ] When roll ≥15: All modifiers show "+ 20 [Limits]"
- [ ] When roll <15: NO bonus appears
- [ ] Output shows "Unreliable 3 Passed (rolled X, +5×Tier)" when applicable

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 6.7: Manual Tracking Limits Display

**Setup:** Create attacks with limits that require GM tracking

- [ ] Rooted: Output shows "GM verify: Haven't moved"
- [ ] Blitz: Output shows "GM verify: First attack this turn"
- [ ] Combo Move: Output shows "GM verify: Different attack last turn"
- [ ] Quickdraw: Output shows "GM verify: First turn of combat"
- [ ] (Test at least 4 different manual limits)

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

---

## Phase 7: Integration & Edge Case Testing

### Test 7.1: Multiple Upgrades + Limit

**Setup:** Attack with:
- Reliable Accuracy
- Power Attack
- Bloodied Limit (active)
- Tier 4

**Expected:** All bonuses stack correctly

- [ ] Run attack at ≤50 HP
- [ ] Accuracy shows 2d20kh1-3 AND +4 from Bloodied
- [ ] Damage shows Power Attack bonus AND +4 from Bloodied
- [ ] All bonuses appear in output

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 7.2: Multiple Targets

**Setup:** Area attack (Type 3) with 3 dummy tokens

- [ ] Run attack selecting all 3 targets
- [ ] ScriptCards processes each target
- [ ] Each target gets individual roll results
- [ ] Status markers apply to each target individually

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 7.3: Critical Hit with Upgrades

**Setup:** Attack with:
- Critical Accuracy (range 15-20)
- Powerful Critical
- Critical Condition

- [ ] Run attack multiple times until crit occurs
- [ ] Verify crit triggers on rolls 15-20
- [ ] Verify Powerful Critical adds +Tier again
- [ ] Verify condition crit adds +Tier to condition

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 7.4: Damage + Condition Hybrid

**Setup:** Attack with:
- Hybrid = 1 (Must pass damage for condition to roll)
- Type 1 (Melee DG/CN)
- Effect = Taunt

- [ ] Run attack that misses damage roll
- [ ] Verify condition roll does NOT occur
- [ ] Run attack that hits damage roll
- [ ] Verify condition roll DOES occur

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 7.5: Zero Limits Stacking

**Setup:** Attack with 3 different limits active simultaneously
- Bloodied (+4)
- Unreliable 1 (if passes, +4)
- Manual limit (Rooted, GM verifies)

**Expected:** All active limit bonuses stack

- [ ] Run attack at ≤50 HP
- [ ] Roll Unreliable 1 and pass (≥5)
- [ ] Verify manual limit note appears
- [ ] Verify bonus = +8 [Limits] (or +4 if Unreliable failed)

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 7.6: Status Marker Accumulation

**Setup:** Hit same target with multiple conditions

- [ ] Apply Taunt (screaming marker)
- [ ] Apply Frighten (aura-target marker)
- [ ] Apply Weaken (radioactive marker)
- [ ] Verify all 3 markers visible on token
- [ ] Verify markers can be removed individually

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 7.7: HP Tracking with Damage

**Setup:** Target with 50 HP, attack deals 20 damage

- [ ] Verify damage applied reduces HP bar
- [ ] Verify HP bar shows 30/50
- [ ] Verify Bloodied limit triggers at ≤50 HP
- [ ] Verify Near Death limit triggers at ≤25 HP

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

---

## Phase 8: Migration from v5.5

### Test 8.1: Load Old Character

**Setup:** Load existing v5.5 character into v6.0 sheet

**Expected Changes:**
- Avoidance will DECREASE by 5 (base change)
- Movement will CHANGE based on new formula
- Durability will DECREASE (no 1.5× multiplier)
- Damage will DECREASE (no 1.5× multiplier)

- [ ] Load character
- [ ] Note Avoidance change: _______ (expected: -5)
- [ ] Note Movement change: _______ (varies by stats)
- [ ] Note Durability change: _______ (expected: decrease)
- [ ] Note Damage change: _______ (expected: decrease)
- [ ] All stats recalculate without errors

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 8.2: Update Attack Types

**Setup:** Old character with Type 3 (Direct) attack

- [ ] Update attack to Type 4 (Direct Condition) or Type 6 (Direct Damage)
- [ ] Attack still functions
- [ ] New type modifiers apply correctly

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 8.3: Update Conditions

**Setup:** Old character with Disarm condition attack

- [ ] Update to Brawl condition
- [ ] Attack still functions
- [ ] New condition applies correctly

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 8.4: Remove Deprecated Upgrades

**Setup:** Old character with Blitz upgrade

- [ ] Note Blitz value: _______
- [ ] Remove Blitz from upgrades
- [ ] Add Blitz to Limits section (if desired)
- [ ] Attack still functions

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

---

## Phase 9: Performance & Stability

### Test 9.1: ScriptCards Load Time

- [ ] Run simple attack (Type 0, no upgrades)
- [ ] Note execution time: _______ seconds
- [ ] Run complex attack (Type 1, 5 upgrades, 2 limits)
- [ ] Note execution time: _______ seconds
- [ ] Execution completes without timeout

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 9.2: Error Handling

**Intentional Errors:**
- [ ] Run attack with no targets selected
- [ ] ScriptCards displays appropriate error message
- [ ] Run attack with invalid token reference
- [ ] ScriptCards handles gracefully
- [ ] Run attack with missing attribute
- [ ] ScriptCards uses default value or displays error

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

### Test 9.3: Repeated Execution

- [ ] Run same attack 10 times in a row
- [ ] No errors occur
- [ ] Results are consistent (within expected randomness)
- [ ] No memory leaks or slowdowns observed

**Test Result:** ☐ Pass ☐ Fail
**Notes:** _________________________________

---

## Final Sign-Off

### Overall Test Summary

**Total Tests:** _______
**Passed:** _______
**Failed:** _______
**Pass Rate:** _______%

### Critical Issues Found

1. _________________________________
2. _________________________________
3. _________________________________

### Minor Issues Found

1. _________________________________
2. _________________________________
3. _________________________________

### Recommendations

☐ **APPROVED FOR USE** - All critical tests passed, minor issues documented
☐ **APPROVED WITH RESERVATIONS** - Some failures, but usable with workarounds
☐ **NOT APPROVED** - Critical failures, requires fixes before use

### Tester Notes

_________________________________
_________________________________
_________________________________
_________________________________

### Date Completed

_________________________________

### Tester Signature

_________________________________

---

**End of Testing Checklist**
