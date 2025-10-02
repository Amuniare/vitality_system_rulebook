# ScriptCards v6.0 Implementation Guide

**File:** `scriptcards_v6/Scriptcards_Attacks_Library_v6.0.txt`
**Base:** `scriptcards_v5.5_backup/Scripcards Attacks Library Neopunk 3.7.3.txt` (825 lines)
**Status:** Requires manual implementation and testing in Roll20

---

## Overview

The ScriptCards macro requires extensive updates to match the v6.0 rules. Due to the file's size (825 lines) and complexity, this guide provides detailed instructions for each change section. Test each change incrementally in Roll20 before proceeding to the next.

**Recommendation:** Work through this guide section by section, testing each change in Roll20 after implementation.

---

## Section 1: Header Comments (Lines 1-100)

### Change 1.1: Add Version Header

**Location:** Line 1-2
**Action:** Add v6.0 header after `!scriptcard {{`

```javascript
!scriptcard {{
  --/| ==========VITALITY SYSTEM v6.0 SCRIPTCARDS==========
  --/| Updated: 2025-10-01
  --/| Changes: 8 attack types, 7 conditions, new upgrades, limits system
```

### Change 1.2: Update Attack Type Comments

**Location:** Line 91
**OLD:**
```
--/| Attack Type                        0 is Melee (Bonus to AC), 1 is Melee (Bonus to DG/CN), 2 is Ranged, 3 is Direct, 4 is AOE, 5 is AOE Direct
```

**NEW:**
```
--/| Attack Type                        0=Melee(AC), 1=Melee(DG/CN), 2=Ranged, 3=Area, 4=DirectCN, 5=DirectAreaCN, 6=DirectDG, 7=DirectAreaDG
```

### Change 1.3: Update Effect Type Comments

**Location:** Line 93
**OLD:**
```
--/| EffectType                         If you have a CN Roll, 1 is Disarm, 2 is Grab, 3 is Shove, 4 is Daze, 5 is Blind, 6 is Taunt, 7 is Setup, 8 is Control, 9 is Stun, 10 is Weaken, 11 is DisableSpecials
```

**NEW:**
```
--/| EffectType                         0=None, 1=Brawl, 2=Frighten, 3=Taunt, 4=Charm, 5=Weaken, 6=Stun, 7=Control
```

---

## Section 2: Variable Declarations (Lines 101-193)

### Change 2.1: Remove Deprecated Upgrade Variables

**Location:** Lines 122-127, 133, 145-146
**Action:** REMOVE these variable declarations:

```javascript
// REMOVE THESE:
--=SplashDamage| [*R:SplashDamage]
--=Whirlwind| [*R:Whirlwind]
--=ScatterShot| [*R:ScatterShot]
--=ConsistentEffect| [*R:ConsistentEffect]
--=MassEffect| [*R:MassEffect]
--=EnhancedCondition| [*R:EnhancedCondition]
--=AccurateAttack| [*R:AccurateAttack]
--=Blitz| [*R:Blitz]  // Moved to Limits
```

### Change 2.2: Add New Upgrade Variables

**Location:** After line 193
**Action:** ADD new upgrade declarations:

```javascript
--/| ==========NEW v6.0 UPGRADES==========
--=CriticalAccuracy| [*R:CriticalAccuracy]
--=ExtendedRange| [*R:ExtendedRange]
--=LongRange| [*R:LongRange]
--=PerceptionRange| [*R:PerceptionRange]
--=EnhancedScale| [*R:EnhancedScale]
--=Precise| [*R:Precise]
--=RangedArea| [*R:RangedArea]
--=Concentration| [*R:Concentration]
--=PowerfulConditionCritical| [*R:PowerfulConditionCritical]
--=IntimidatingPresence| [*R:IntimidatingPresence]
--=TerrifyingDisplay| [*R:TerrifyingDisplay]
```

### Change 2.3: Add Limits System Variables

**Location:** After new upgrades
**Action:** ADD all limits declarations:

```javascript
--/| ==========LIMITS SYSTEM (v6.0 NEW)==========
--/| Usage Limits
--=Charges1| [*R:Charges1]
--=Charges2| [*R:Charges2]

--/| HP-Based Limits
--=Timid| [*R:Timid]
--=NearDeath| [*R:NearDeath]
--=Bloodied| [*R:Bloodied]

--/| Conditional Limits
--=Vengeful| [*R:Vengeful]
--=RevengeLimit| [*R:RevengeLimit]
--=Unbreakable| [*R:Unbreakable]
--=Untouchable| [*R:Untouchable]
--=AvengerLimit| [*R:AvengerLimit]
--=PassiveLimit| [*R:PassiveLimit]
--=Careful| [*R:Careful]

--/| Sequential Limits
--=ComboMove| [*R:ComboMove]
--=InfectedLimit| [*R:InfectedLimit]
--=Relentless| [*R:Relentless]
--=Slaughter| [*R:Slaughter]

--/| Positioning Limits
--=Rooted| [*R:Rooted]
--=BlitzLimit| [*R:BlitzLimit]
--=LongDistanceFighter| [*R:LongDistanceFighter]
--=DangerousLimit| [*R:DangerousLimit]

--/| Random Limits
--=Unreliable1| [*R:Unreliable1]
--=Unreliable2| [*R:Unreliable2]
--=Unreliable3| [*R:Unreliable3]

--/| Time-Based Limits
--=Quickdraw| [*R:Quickdraw]
--=Steady| [*R:Steady]
--=PatienceLimit| [*R:PatienceLimit]
--=Finale| [*R:Finale]

--/| Other Limits
--=ChargeUp| [*R:ChargeUp]
--=ChargeUp2| [*R:ChargeUp2]
--=Exhausting| [*R:Exhausting]
--=Cooldown| [*R:Cooldown]
--=Attrition| [*R:Attrition]
--=DrainReserves| [*R:DrainReserves]
--=TowerDefenseLimit| [*R:TowerDefenseLimit]
--=CompressedReleaseLimit| [*R:CompressedReleaseLimit]
--=DomainLimit| [*R:DomainLimit]
--=GrapplerLimit| [*R:GrapplerLimit]
--=ExploitLimit| [*R:ExploitLimit]

--/| Sacrifice Limits
--=SacrificeMinion| [*R:SacrificeMinion]
--=SacrificeCaptain| [*R:SacrificeCaptain]
--=SacrificeVanguard| [*R:SacrificeVanguard]
--=SacrificeBoss| [*R:SacrificeBoss]

--=LimitBonus| 0  // Total bonus from active limits
--=LimitActive| 0  // Track if any limit is active
```

---

## Section 3: Attack Type Resolution (Lines 224-232)

### Change 3.1: Update Direct Attack Handling

**Location:** Lines 224-232
**OLD:**
```javascript
--?[$AttackType] -eq 3|=RollAC; 0  // Direct = no accuracy roll
--?[$AttackType] -eq 5|=RollAC; 0  // AOE Direct = no accuracy roll

--?[$AttackType] -eq 3|=RollDG; 0  // Direct = no damage roll
--?[$AttackType] -eq 5|=RollDG; 0  // AOE Direct = no damage roll
```

**NEW:**
```javascript
--/| v6.0: Updated attack type handling for 8 types
--/| Type 0-3: Standard (Melee AC, Melee DG/CN, Ranged, Area)
--/| Type 4-5: Direct Condition types (no AC roll, condition only)
--/| Type 6-7: Direct Damage types (no AC roll, damage only)

--?[$AttackType] -eq 4|=RollAC; 0  // Direct Condition = no accuracy roll
--?[$AttackType] -eq 5|=RollAC; 0  // Direct Area Condition = no accuracy roll
--?[$AttackType] -eq 6|=RollAC; 0  // Direct Damage = no accuracy roll
--?[$AttackType] -eq 7|=RollAC; 0  // Direct Area Damage = no accuracy roll

--?[$AttackType] -eq 4|=RollDG; 0  // Direct Condition = no damage roll
--?[$AttackType] -eq 5|=RollDG; 0  // Direct Area Condition = no damage roll
--?[$AttackType] -eq 6|=RollCN; 0  // Direct Damage = no condition roll
--?[$AttackType] -eq 7|=RollCN; 0  // Direct Area Damage = no condition roll
```

---

## Section 4: Attack Type Bonuses/Penalties (Lines 271-291)

### Change 4.1: Update Attack Type Modifiers

**Location:** Lines 271-291
**OLD:**
```javascript
--?[$AttackType] -eq 0|&AccuracyStringModifiers;+ + [*S:char_tier] [Melee]
--?[$AttackType] -eq 1|&DamageStringModifiers;+ + [*S:char_tier] [Melee]
--?[$AttackType] -eq 1|&ConditionsStringModifiers;+ + [*S:char_tier] [Melee]

--?[$AttackType] -eq 3 -and [$EffectPenaltyApplied] -eq 0|&DamageStringModifiers;+ - [*S:char_tier] [Direct]
--?[$AttackType] -eq 3 -and [$EffectPenaltyApplied] -eq 0|&ConditionsStringModifiers;+ - [*S:char_tier] [Direct]
--?[$AttackType] -eq 3|=EffectPenaltyApplied; 1

--?[$AttackType] -eq 4 -and [$EffectPenaltyApplied] -eq 0|&AccuracyStringModifiers;+ - [*S:char_tier] [AOE]
--?[$AttackType] -eq 4|=EffectPenaltyApplied; 1

--?[$AttackType] -eq 5 -and [$EffectPenaltyApplied] -eq 0|&DamageStringModifiers;+ - [*S:char_tier] [AOE Direct]
--?[$AttackType] -eq 5 -and [$EffectPenaltyApplied] -eq 0|&ConditionsStringModifiers;+ - [*S:char_tier] [AOE Direct]
--?[$AttackType] -eq 5|=EffectPenaltyApplied; 1
```

**NEW:**
```javascript
--/| v6.0: Updated type bonuses/penalties
--?[$AttackType] -eq 0|&AccuracyStringModifiers;+ + [*S:char_tier] [Melee AC]
--?[$AttackType] -eq 1|&DamageStringModifiers;+ + [*S:char_tier] [Melee DG/CN]
--?[$AttackType] -eq 1|&ConditionsStringModifiers;+ + [*S:char_tier] [Melee DG/CN]

--/| Type 3: Area - penalty to Accuracy only
--?[$AttackType] -eq 3|&AccuracyStringModifiers;+ - [*S:char_tier] [Area]

--/| Type 4: Direct Condition - penalty to Condition
--?[$AttackType] -eq 4|&ConditionsStringModifiers;+ - [*S:char_tier] [Direct CN]

--/| Type 5: Direct Area Condition - penalty to Condition (doubled)
--=DirectAreaConditionPenalty| [*S:char_tier]*2
--?[$AttackType] -eq 5|&ConditionsStringModifiers;+ - [$DirectAreaConditionPenalty] [Direct Area CN]

--/| Type 6: Direct Damage - flat damage penalty
--=DirectDamagePenalty| 15-[*S:char_tier]
--?[$AttackType] -eq 6|&DamageStringModifiers;+ [$DirectDamagePenalty] [Direct DG Base]

--/| Type 7: Direct Area Damage - flat damage penalty (doubled)
--=DirectAreaDamagePenalty| 15-([*S:char_tier]*2)
--?[$AttackType] -eq 7|&DamageStringModifiers;+ [$DirectAreaDamagePenalty] [Direct Area DG Base]
```

---

## Section 5: Condition Application (Lines 632-769)

### Change 5.1: Update Condition System

**Location:** Lines 632-769
**Action:** REPLACE entire condition block with new v6.0 conditions

**REMOVE OLD CONDITIONS:**
- Disarm (1)
- Grab (2)
- Shove (3)
- Daze (4)
- Blind (5)
- Setup (7)
- DisableSpecials (11)

**ADD NEW CONDITIONS:**

```javascript
--/| v6.0: NEW CONDITION SYSTEM (7 conditions)
--?[$RollCN] -lt 1|SkipTheConditionsBlock

  --/| Brawl (1) - Player/GM chooses: Push, Prone, or Grab
  --?[$EffectType] -ne 1|PassBrawl
    --?[$EnemyCnFailAmount] -lt 0|PassBrawl
    --+Applying | Brawl to [*[&testvar]:character_name] - GM/Player: Choose Push, Prone, or Grab
    --&AttackDetails|+ Brawl effect applied (manual implementation),
  --:PassBrawl|

  --/| Frighten (2) - Target moves away
  --?[$EffectType] -ne 2|PassFrighten
    --?[$EnemyCnFailAmount] -lt 0|PassFrighten
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];aura-target;1
    --+Applying | Frighten to [*[&testvar]:character_name] - Must move away from you
    --&AttackDetails|+ Frighten applied,
  --:PassFrighten|

  --/| Taunt (3) - Must include you in attacks
  --?[$EffectType] -ne 3|PassTaunt
    --?[$EnemyCnFailAmount] -lt 0|PassTaunt
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];screaming;1
    --+Applying | Taunt to [*[&testvar]:character_name] - Must include you in attacks
    --&AttackDetails|+ Taunt applied,
  --:PassTaunt|

  --/| Charm (4) - Cannot attack you
  --?[$EffectType] -ne 4|PassCharm
    --?[$EnemyCnFailAmount] -lt 0|PassCharm
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];heart;1
    --+Applying | Charm to [*[&testvar]:character_name] - Cannot attack you
    --&AttackDetails|+ Charm applied,
  --:PassCharm|

  --/| Weaken (5) - Reduce specific stat by 2×Tier
  --?[$EffectType] -ne 5|PassWeaken
    --?[$EnemyCnFailAmount] -lt 0|PassWeaken
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];radioactive;1
    --=WeakenAmount| [*S:char_tier]*2
    --+Applying | Weaken ([$WeakenAmount]) to [*[&testvar]:character_name] - Specify which stat
    --&AttackDetails|+ Weaken applied (choose stat to reduce),
  --:PassWeaken|

  --/| Stun (6) - Target adds 1/5 HP to resistance
  --?[$EffectType] -ne 6|PassStun
    --?[$EnemyCnFailAmount] -lt 0|PassStun
    --=StunResistanceBonus| [*[&testvar]:t-bar3_value]/5 {CEIL}
    --+Stun | Target adds [$StunResistanceBonus] to Resistance (1/5 HP)
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];lightning-helix;1
    --+Applying | Stun to [*[&testvar]:character_name]
    --&AttackDetails|+ Stun applied (+1/5 HP to resistance),
  --:PassStun|

  --/| Control (7) - Target adds 1/5 HP to resistance
  --?[$EffectType] -ne 7|PassControl
    --?[$EnemyCnFailAmount] -lt 0|PassControl
    --=ControlResistanceBonus| [*[&testvar]:t-bar3_value]/5 {CEIL}
    --+Control | Target adds [$ControlResistanceBonus] to Resistance (1/5 HP)
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];broken-skull;1
    --+Applying | Control to [*[&testvar]:character_name]
    --&AttackDetails|+ Control applied (+1/5 HP to resistance),
  --:PassControl|

--:SkipTheConditionsBlock|
```

---

## Section 6: Upgrade Updates

### Change 6.1: Update Reliable Accuracy

**Location:** Search for ReliableAccuracy implementation
**OLD:**
```javascript
--?[$ReliableAccuracy] -eq 1|&AccuracyDice; 2d20kh1 - 4
```

**NEW:**
```javascript
--?[$ReliableAccuracy] -eq 1|&AccuracyDice; 2d20kh1 - 3
```

### Change 6.2: Update Bleed Penalty

**Location:** Search for Bleed implementation
**ADD penalty before damage application:**
```javascript
--?[$Bleed] -eq 0|PassBleed
    --?[$DamageAmount] -lt 1|PassBleed
    --&DamageStringModifiers;+ - [*S:char_tier] [Bleed Penalty]
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];red;2
    --+Applying | Bleed (2 turns) to [*[&testvar]:character_name]
    --&AttackDetails|+ Bleed applied (-Tier to Damage),
--:PassBleed|
```

### Change 6.3: Update Leech Penalty

**Location:** Search for Leech implementation
**ADD penalties:**
```javascript
--?[$Leech] -ne 1|PassLeechNote
    --&AccuracyStringModifiers;+ - [*S:char_tier] [Leech Penalty]
    --&DamageStringModifiers;+ - [*S:char_tier] [Leech Penalty]
    --&ConditionsStringModifiers;+ - [*S:char_tier] [Leech Penalty]
    --=LeechAmount| [$DamageRoll]/2 {CEIL}
    --&AttackDetails|+ Leech [$LeechAmount] HP (-Tier to all),
--:PassLeechNote|
```

### Change 6.4: Update Channeled

**Location:** Search for Channeled implementation
**REPLACE with:**
```javascript
--=Channeled| [*R:Channeled]
--?[$Channeled] -ne 1|PassChanneledNote
    --=ChanneledPenalty| [*S:char_tier]*2
    --&AccuracyStringModifiers;+ - [$ChanneledPenalty] [Channeled Start]
    --&DamageStringModifiers;+ - [$ChanneledPenalty] [Channeled Start]
    --&ConditionsStringModifiers;+ - [$ChanneledPenalty] [Channeled Start]
    --&AttackDetails|+ Channeled (+Tier per turn, max 5×Tier, start -2×Tier),
--:PassChanneledNote|
```

### Change 6.5: Update Finishing Blow Thresholds

**Location:** Search for Finishing Blow implementation
**UPDATE thresholds:**
```javascript
--/| v6.0: Updated Finishing Blow thresholds (5, 10, 15 HP)
--?[$RemainingHP] -ge 6 -or [$FinishingBlow] -ne 1|PassDeadFinishingAuto1
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];dead
    --&AttackDetails|+ Finishing Blow 1 (5 HP threshold),
--:PassDeadFinishingAuto1|

--?[$RemainingHP] -ge 11 -or [$FinishingBlow] -ne 2|PassDeadFinishingAuto2
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];dead
    --&AttackDetails|+ Finishing Blow 2 (10 HP threshold),
--:PassDeadFinishingAuto2|

--?[$RemainingHP] -ge 16 -or [$FinishingBlow] -ne 3|PassDeadFinishingAuto3
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];dead
    --&AttackDetails|+ Finishing Blow 3 (15 HP threshold),
--:PassDeadFinishingAuto3|
```

### Change 6.6: Add New Generic Upgrades

**Location:** After existing upgrade implementations
**ADD:**
```javascript
--/| ==========NEW v6.0 GENERIC UPGRADES==========

--/| Extended Range (20p)
--=ExtendedRange| [*R:ExtendedRange]
--?[$ExtendedRange] -ne 1|PassExtendedRange
    --&AttackDetails|+ Extended Range (30sp),
--:PassExtendedRange|

--/| Long Range (30p)
--=LongRange| [*R:LongRange]
--?[$LongRange] -ne 1|PassLongRange
    --&AttackDetails|+ Long Range (100sp),
--:PassLongRange|

--/| Perception Range (20p)
--=PerceptionRange| [*R:PerceptionRange]
--?[$PerceptionRange] -ne 1|PassPerceptionRange
    --&AttackDetails|+ Perception Range (Unlimited),
--:PassPerceptionRange|

--/| Enhanced Scale (20p)
--=EnhancedScale| [*R:EnhancedScale]
--?[$EnhancedScale] -ne 1|PassEnhancedScale
    --&AttackDetails|+ Enhanced Scale (+2sp burst / +4sp cone / +8sp line),
--:PassEnhancedScale|

--/| Precise (40p)
--=Precise| [*R:Precise]
--?[$Precise] -ne 1|PassPrecise
    --&AttackDetails|+ Precise (Select targets in AOE),
--:PassPrecise|

--/| Ranged Area (20p)
--=RangedArea| [*R:RangedArea]
--?[$RangedArea] -ne 1|PassRangedArea
    --&AttackDetails|+ Ranged Area (Origin 15sp away),
--:PassRangedArea|

--/| Concentration (40p)
--=Concentration| [*R:Concentration]
--?[$Concentration] -ne 1|PassConcentration
    --&AttackDetails|+ Concentration (Free action repeat, no other attacks),
--:PassConcentration|

--/| Powerful Condition Critical (40p)
--=PowerfulConditionCritical| [*R:PowerfulConditionCritical]
--?[$PowerfulConditionCritical] -ne 1|PassPowerfulConditionCritical
    --=ConditionCriticalRange| 15
    --?[$ConditionsDice] -ge 15 -and [$RollCN] -ge 1|&ConditionsRollString;+  +[*S:char_tier] [POWERFUL CRIT CN]
    --&AttackDetails|+ Powerful Condition Critical (15-20, +Tier again),
--:PassPowerfulConditionCritical|

--/| Intimidating Presence (40p)
--=IntimidatingPresence| [*R:IntimidatingPresence]
--?[$IntimidatingPresence] -ne 1|PassIntimidatingPresence
    --&AttackDetails|+ Intimidating Presence (2sp burst Taunt on defeat),
--:PassIntimidatingPresence|

--/| Terrifying Display (40p)
--=TerrifyingDisplay| [*R:TerrifyingDisplay]
--?[$TerrifyingDisplay] -ne 1|PassTerrifyingDisplay
    --&AttackDetails|+ Terrifying Display (2sp burst Frighten on defeat),
--:PassTerrifyingDisplay|
```

---

## Section 7: Limits System Implementation

### Change 7.1: Add Limits Checking Section

**Location:** After all upgrade declarations, before attack dice setup
**ADD entire limits checking system:**

```javascript
--/| ==========LIMITS SYSTEM IMPLEMENTATION (v6.0 NEW)==========
--/| This section checks limit conditions and applies bonuses if met

--=LimitBonus| 0  // Total bonus from limits
--=LimitActive| 0  // Track if any limit is active

--/| HP-Based Limits
--?[$Timid] -ne 1|PassTimidCheck
    --?[*S:t-bar1_value] -ne [*S:t-bar1_max]|PassTimidCheck
    --=LimitBonus| [$LimitBonus]+[*S:char_tier]
    --=LimitActive| 1
    --&AttackDetails|+ Timid Limit Active (+Tier),
--:PassTimidCheck|

--?[$NearDeath] -ne 1|PassNearDeathCheck
    --?[*S:t-bar1_value] -gt 25|PassNearDeathCheck
    --=NearDeathBonus| [*S:char_tier]*2
    --=LimitBonus| [$LimitBonus]+[$NearDeathBonus]
    --=LimitActive| 1
    --&AttackDetails|+ Near Death Limit Active (+2×Tier),
--:PassNearDeathCheck|

--?[$Bloodied] -ne 1|PassBloodiedCheck
    --?[*S:t-bar1_value] -gt 50|PassBloodiedCheck
    --=LimitBonus| [$LimitBonus]+[*S:char_tier]
    --=LimitActive| 1
    --&AttackDetails|+ Bloodied Limit Active (+Tier),
--:PassBloodiedCheck|

--/| Random Limits
--?[$Unreliable1] -ne 1|PassUnreliable1Check
    --=UnreliableRoll| 1d20
    --?[$UnreliableRoll] -lt 5|PassUnreliable1Check
    --=LimitBonus| [$LimitBonus]+[*S:char_tier]
    --=LimitActive| 1
    --&AttackDetails|+ Unreliable 1 Passed (rolled [$UnreliableRoll], +Tier),
--:PassUnreliable1Check|

--?[$Unreliable2] -ne 1|PassUnreliable2Check
    --=UnreliableRoll| 1d20
    --?[$UnreliableRoll] -lt 10|PassUnreliable2Check
    --=Unreliable2Bonus| [*S:char_tier]*3
    --=LimitBonus| [$LimitBonus]+[$Unreliable2Bonus]
    --=LimitActive| 1
    --&AttackDetails|+ Unreliable 2 Passed (rolled [$UnreliableRoll], +3×Tier),
--:PassUnreliable2Check|

--?[$Unreliable3] -ne 1|PassUnreliable3Check
    --=UnreliableRoll| 1d20
    --?[$UnreliableRoll] -lt 15|PassUnreliable3Check
    --=Unreliable3Bonus| [*S:char_tier]*5
    --=LimitBonus| [$LimitBonus]+[$Unreliable3Bonus]
    --=LimitActive| 1
    --&AttackDetails|+ Unreliable 3 Passed (rolled [$UnreliableRoll], +5×Tier),
--:PassUnreliable3Check|

--/| NOTE: Many limits require manual GM tracking
--/| (Turn count, hit status, positioning, previous actions, etc.)
--/| Display notes for GM verification:

--?[$Rooted] -ne 1|PassRootedNote
    --&AttackDetails|+ Rooted Limit (GM verify: Haven't moved),
--:PassRootedNote|

--?[$BlitzLimit] -ne 1|PassBlitzLimitNote
    --&AttackDetails|+ Blitz Limit (GM verify: First attack this turn),
--:PassBlitzLimitNote|

--?[$ComboMove] -ne 1|PassComboNote
    --&AttackDetails|+ Combo Move Limit (GM verify: Different attack last turn),
--:PassComboNote|

--?[$Quickdraw] -ne 1|PassQuickdrawNote
    --&AttackDetails|+ Quickdraw Limit (GM verify: First turn of combat),
--:PassQuickdrawNote|

--/| Apply limit bonus to all three stats if any limit is active
--?[$LimitBonus] -le 0|PassLimitBonusApplication
    --&AccuracyStringModifiers|+ +[$LimitBonus] [Limits]
    --&DamageStringModifiers|+ +[$LimitBonus] [Limits]
    --&ConditionsStringModifiers|+ +[$LimitBonus] [Limits]
--:PassLimitBonusApplication|
```

---

## Testing Checklist

After implementing each section, test in Roll20:

### Phase 1: Basic Tests
- [ ] ScriptCards macro loads without errors
- [ ] Character stats read correctly from sheet
- [ ] Attack name and description display

### Phase 2: Attack Type Tests
- [ ] Type 0: Melee (Accuracy) - Verify +Tier to AC
- [ ] Type 1: Melee (Damage & Conditions) - Verify +Tier to DG/CN
- [ ] Type 2: Ranged - Verify normal function
- [ ] Type 3: Area - Verify -Tier to AC only
- [ ] Type 4: Direct Condition - Verify no AC roll, -Tier to CN
- [ ] Type 5: Direct Area Condition - Verify no AC roll, -2×Tier to CN
- [ ] Type 6: Direct Damage - Verify no AC roll, flat 15-Tier damage
- [ ] Type 7: Direct Area Damage - Verify no AC roll, flat 15-2×Tier damage

### Phase 3: Condition Tests
- [ ] Brawl - Verify prompt for choice
- [ ] Frighten - Verify aura-target marker
- [ ] Taunt - Verify screaming marker
- [ ] Charm - Verify heart marker
- [ ] Weaken - Verify radioactive marker, 2×Tier reduction
- [ ] Stun - Verify lightning-helix marker, 1/5 HP resistance
- [ ] Control - Verify broken-skull marker, 1/5 HP resistance

### Phase 4: Upgrade Tests
- [ ] Reliable Accuracy - Verify 2d20kh1-3
- [ ] Bleed - Verify -Tier penalty
- [ ] Leech - Verify -Tier to all stats
- [ ] Channeled - Verify -2×Tier start penalty
- [ ] Finishing Blow - Verify thresholds (5, 10, 15 HP)
- [ ] New generic upgrades - Verify all display correctly

### Phase 5: Limits Tests
- [ ] Timid - Verify bonus when at max HP with no conditions
- [ ] Near Death - Verify +2×Tier when ≤25 HP
- [ ] Bloodied - Verify +Tier when ≤50 HP
- [ ] Unreliable 1-3 - Verify d20 rolls and appropriate bonuses
- [ ] Manual limits - Verify notes display for GM

### Phase 6: Integration Tests
- [ ] Attack with both upgrades and limits active
- [ ] Multiple targets
- [ ] Critical hits
- [ ] Status marker application/removal
- [ ] Damage/HP tracking

---

## Known Implementation Challenges

1. **Limits Requiring Manual Tracking:**
   - Turn count (Cooldown, Finale, Quickdraw, Steady, Patience)
   - Previous turn actions (Combo Move, Infected, Relentless)
   - Positioning (Rooted, Blitz, Long Distance Fighter, Dangerous)
   - Hit tracking (Revenge, Vengeful, Avenger, Unbreakable, Untouchable)

   **Solution:** Display notes in AttackDetails for GM manual verification.

2. **Condition Choices (Brawl):**
   - Cannot automatically prompt for Push/Prone/Grab choice

   **Solution:** Display note for GM/Player to manually apply chosen effect.

3. **AOE Target Selection (Precise):**
   - Cannot selectively target within AOE automatically

   **Solution:** Display note for GM to manually apply to selected targets.

4. **Barrage/Extra Attack Verification:**
   - Cannot enforce "must hit+effect to continue" automatically

   **Solution:** Player honor system with GM oversight.

---

## File Locations

**Original v5.5:** `scriptcards_v5.5_backup/Scripcards Attacks Library Neopunk 3.7.3.txt`
**Working v6.0:** `scriptcards_v6/Scriptcards_Attacks_Library_v6.0.txt`
**This Guide:** `SCRIPTCARDS_V6_IMPLEMENTATION_GUIDE.md`

---

## Implementation Order Recommendation

1. Complete Section 1 (Header Comments) - Test
2. Complete Section 2 (Variable Declarations) - Test
3. Complete Section 3 (Attack Type Resolution) - Test thoroughly
4. Complete Section 4 (Attack Type Modifiers) - Test thoroughly
5. Complete Section 5 (Condition System) - Test each condition
6. Complete Section 6.1-6.5 (Upgrade Updates) - Test each update
7. Complete Section 6.6 (New Upgrades) - Test each new upgrade
8. Complete Section 7 (Limits System) - Test incrementally
9. Full integration testing
10. Edge case testing

**Estimated Time:** 4-6 hours of implementation + 2-4 hours of testing

---

**End of Implementation Guide**
