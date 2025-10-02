# Roll20 Character Sheet & ScriptCards Update Roadmap
## Version 5.5 → Version 6.0

**Last Updated:** 2025-10-01
**Status:** In Progress
**Tester:** User (Trent)

---

## Executive Summary

This document tracks the complete update of the Vitality System Roll20 character sheets and ScriptCards macros from version 5.5 to version 6.0, aligning them with the current rulebook. The update includes significant changes to core combat mechanics, attack types, conditions, and the addition of an entirely new Limits system.

**Key Changes:**
- Core stat formulas updated (Avoidance, Movement)
- Attack types expanded from 6 to 8 types
- Condition system simplified from 11 to 7 conditions
- Attack upgrades: 15 removed, 10 added, 12 updated
- New Limits system added (35+ limit types)
- All "Primary Action" permanent bonuses removed

**Implementation Approach:**
Given Roll20 limitations, we focus on:
- **Character sheet:** Input fields for all mechanics
- **ScriptCards:** Automated resolution of attacks
- **Manual tracking:** Point costs, archetype selection (cannot be automated in Roll20)

---

## Rule Changes Comparison Table

### Core Stats & Formulas

| Stat | v5.5 Formula | v6.0 Formula | Notes |
|------|--------------|--------------|-------|
| **Avoidance** | 10 + Tier + Mobility | **5 + Tier + Mobility** | Base reduced from 10 to 5 |
| **Durability** | Tier + (Endurance × 1.5) | **Tier + Endurance** | Removed 1.5× multiplier |
| **Movement** | max(Tier, 6) + Mobility + Mods | **Mobility + (2 × Tier) + Mods** | Removed minimum tier 6, changed formula |
| **Resolve** | 10 + Tier + Focus | 10 + Tier + Focus | No change |
| **Stability** | 10 + Tier + Power | 10 + Tier + Power | No change |
| **Vitality** | 10 + Tier + Endurance | 10 + Tier + Endurance | No change |
| **Accuracy** | Tier + Focus + Mods | Tier + Focus + Mods | No change (base was 0) |
| **Damage** | Tier + (Power × 1.5) + Mods | **Tier + Power + Mods** | Removed 1.5× multiplier |
| **Conditions** | Tier + Power + Mods | Tier + Power + Mods | No change |
| **Initiative** | Tier + Mobility + Focus + Awareness | Tier + Mobility + Focus + Awareness | No change |

**Primary Action Bonuses:** REMOVED entirely. Dodge/Brace/Fortify actions in v6.0 grant temporary bonuses only (not tracked on sheet).

### Attack Types

| v5.5 Code | v5.5 Type | v6.0 Code | v6.0 Type | Changes |
|-----------|-----------|-----------|-----------|---------|
| 0 | Melee (AC bonus) | 0 | Melee Attack (Accuracy) | Same mechanics, renamed |
| 1 | Melee (DG/CN bonus) | 1 | Melee Attack (Damage & Conditions) | Same mechanics, renamed |
| 2 | Ranged | 2 | Ranged Attack | No change |
| 3 | Direct | — | — | **REMOVED** |
| 4 | AOE | 3 | Area Attack | Renumbered, -Tier to Accuracy only |
| 5 | AOE Direct | — | — | **REMOVED** (split into 3 new types) |
| — | — | 4 | Direct Condition Attack | **NEW**: No ACC roll, -Tier to Condition |
| — | — | 5 | Direct Area Condition Attack | **NEW**: No ACC roll, -2×Tier to Condition |
| — | — | 6 | Direct Damage Attack | **NEW**: No ACC roll, flat 15-Tier damage |
| — | — | 7 | Direct Area Damage Attack | **NEW**: No ACC roll, flat 15-2×Tier damage |

**Critical Change:** The old "Direct" and "AOE Direct" hybrid types have been split into separate damage-only and condition-only variants for clearer mechanics.

### Condition System

| v5.5 Conditions | v6.0 Conditions | Point Cost | Notes |
|-----------------|-----------------|------------|-------|
| Disarm | — | — | REMOVED (merged into Brawl) |
| Grab | — | — | REMOVED (merged into Brawl) |
| Shove | — | — | REMOVED (merged into Brawl) |
| — | **Brawl** | **20p** | NEW: Choose Push/Prone/Grab |
| Daze | — | — | REMOVED |
| Blind | — | — | REMOVED |
| Taunt | Taunt | **10p** | Kept, now has cost |
| — | **Charm** | **10p** | NEW: Target cannot attack you |
| — | **Frighten** | **10p** | NEW: Target moves away |
| Setup | — | — | REMOVED |
| Control | Control | **50p** | Kept, now adds 1/5 HP to resistance |
| Stun | Stun | **30p** | Kept, now adds 1/5 HP to resistance |
| Weaken | Weaken | **20p** | Updated: Choose specific stat |
| DisableSpecials | — | — | REMOVED |

**Total:** Reduced from 11 conditions to 7 conditions. Point costs are for reference only (manual tracking).

---

## Character Sheet Implementation Plan

### Part 1: HTML Field Changes

#### 1. Core Stats Section Updates

**Avoidance (lines ~58-62):**
```html
<!-- OLD v5.5 -->
<input type="number" name="attr_display_avoidance" value="@{char_avoidance}" disabled="true">
<!-- Calculation: base 10 + tier + mobility -->

<!-- NEW v6.0 -->
<input type="number" name="attr_display_avoidance" value="@{char_avoidance}" disabled="true">
<!-- Calculation: base 5 + tier + mobility -->
```
**Change:** Update sheet worker base value from 10 to 5.

**Movement (lines ~102-105):**
```html
<!-- OLD v5.5 -->
<!-- Calculation: max(tier, 6) + mobility + mods -->

<!-- NEW v6.0 -->
<!-- Calculation: mobility + (2 × tier) + mods -->
```
**Change:** Remove minimum tier 6 logic, change to `mobility + (2 × tier)`.

**Remove: Primary Action Checkboxes (lines ~61, 66, 71, 76, 81, etc.):**
```html
<!-- REMOVE these from all defense/attack stats -->
<input type="checkbox" name="attr_char_avPrimaryAction">
<input type="checkbox" name="attr_char_drPrimaryAction">
<input type="checkbox" name="attr_char_rsPrimaryAction">
<input type="checkbox" name="attr_char_sbPrimaryAction">
<input type="checkbox" name="attr_char_vtPrimaryAction">
<input type="checkbox" name="attr_char_acPrimaryAction">
<input type="checkbox" name="attr_char_dgPrimaryAction">
<input type="checkbox" name="attr_char_cnPrimaryAction">
<input type="checkbox" name="attr_char_movementPrimaryAction">
<input type="checkbox" name="attr_char_initiativePrimaryAction">
```

#### 2. Attack Type Dropdown Update (lines ~354-362)

**OLD v5.5:**
```html
<select name="attr_AttackType">
    <option value="0">Melee (AC)</option>
    <option value="1">Melee (DG/CN)</option>
    <option value="2">Ranged</option>
    <option value="3">Direct</option>
    <option value="4">AOE</option>
    <option value="5">AOE Direct</option>
</select>
```

**NEW v6.0:**
```html
<select name="attr_AttackType">
    <option value="0">Melee (Accuracy)</option>
    <option value="1">Melee (Damage & Conditions)</option>
    <option value="2">Ranged</option>
    <option value="3">Area</option>
    <option value="4">Direct Condition</option>
    <option value="5">Direct Area Condition</option>
    <option value="6">Direct Damage</option>
    <option value="7">Direct Area Damage</option>
</select>
```

#### 3. Condition Effect Dropdown Update (lines ~373-388)

**OLD v5.5:**
```html
<select name="attr_EffectType">
    <option value="0">None</option>
    <option value="1">Disarm</option>
    <option value="2">Grab</option>
    <option value="3">Shove</option>
    <option value="4">Daze</option>
    <option value="5">Blind</option>
    <option value="6">Taunt</option>
    <option value="7">Setup</option>
    <option value="8">Control</option>
    <option value="9">Stun</option>
    <option value="10">Weaken</option>
    <option value="11">Disable Specials</option>
</select>
```

**NEW v6.0:**
```html
<select name="attr_EffectType">
    <option value="0">None (Damage Only)</option>
    <option value="1">Brawl (Push/Prone/Grab)</option>
    <option value="2">Frighten</option>
    <option value="3">Taunt</option>
    <option value="4">Charm</option>
    <option value="5">Weaken</option>
    <option value="6">Stun</option>
    <option value="7">Control</option>
</select>
```

#### 4. Attack Upgrades Section Updates

**REMOVE These Upgrades (delete from lines ~402-492):**

From ACCURACY BONUSES:
```html
<label>Blitz <input type="number" name="attr_Blitz" value="0"></label>
<!-- Moved to Limits section -->
```

From DAMAGE BONUSES:
```html
<label>Enhanced Effect <input type="number" name="attr_EnhancedEffect" value="0"></label>
<label>Consistent <input type="number" name="attr_ConsistentEffect" value="0"></label>
<label>Splash <input type="number" name="attr_SplashDamage" value="0"></label>
```

From CONDITION BONUSES:
```html
<label>Mass Effect <input type="number" name="attr_MassEffect" value="0"></label>
<label>Collateral <input type="number" name="attr_CollateralCondition" value="0"></label>
<label>Crit CN <input type="number" name="attr_ConditionCriticalRange" value="0"></label>
<!-- Note: Crit CN replaced by new system -->
```

From MELEE SPECIALIZED:
```html
<label>Heavy Strike <input type="number" name="attr_HeavyStrike" value="0"></label>
<label>Whirlwind Strike <input type="number" name="attr_WhirlwindStrike" value="0"></label>
```

From RANGED SPECIALIZED:
```html
<label>Scatter Shot <input type="number" name="attr_ScatterShot" value="0"></label>
```

From GENERAL SPECIALIZED:
```html
<label>Analyzing <input type="number" name="attr_AnalyzingStrike" value="0"></label>
<label>Follow-Up <input type="number" name="attr_FollowUpStrike" value="0"></label>
<label>Counter <input type="number" name="attr_Counterattack" value="0"></label>
```

**ADD New Generic Upgrades Section (add after line ~412):**
```html
<!-- GENERIC ATTACK UPGRADES -->
<div class="attacks-grid-compact">
    <h6>Generic Attack Upgrades</h6>
    <label>Extended Range <input type="number" name="attr_ExtendedRange" value="0"></label>
    <label>Long Range <input type="number" name="attr_LongRange" value="0"></label>
    <label>Perception Range <input type="number" name="attr_PerceptionRange" value="0"></label>
    <label>Enhanced Scale <input type="number" name="attr_EnhancedScale" value="0"></label>
    <label>Precise <input type="number" name="attr_Precise" value="0"></label>
    <label>Ranged Area <input type="number" name="attr_RangedArea" value="0"></label>
</div>
```

**UPDATE Critical Upgrades Section:**
```html
<!-- CRITICAL BONUSES (updated) -->
<div class="attacks-grid-compact">
    <h6>Critical Bonuses</h6>
    <label>Critical Accuracy <input type="number" name="attr_CriticalAccuracy" value="0"></label>
    <label>Powerful Critical <input type="number" name="attr_PowerfulCritical" value="0"></label>
    <label>Ricochet <input type="number" name="attr_Ricochet" value="0"></label>
    <label>Double-Tap <input type="number" name="attr_DoubleTap" value="0"></label>
    <label>Explosive Critical <input type="number" name="attr_ExplosiveCritical" value="0"></label>
    <label>Martial Artist <input type="number" name="attr_MartialArtist" value="0"></label>
</div>
```

**ADD New Condition Upgrades:**
```html
<!-- CONDITION BONUSES (updated) -->
<div class="attacks-grid-compact">
    <h6>Condition Upgrades</h6>
    <label>Lasting Condition <input type="number" name="attr_LastingCondition" value="0"></label>
    <label>Contagious <input type="number" name="attr_Contagious" value="0"></label>
    <label>Cursed <input type="number" name="attr_Cursed" value="0"></label>
    <label>Overwhelming <input type="number" name="attr_OverwhelmingAffliction" value="0"></label>
    <label>Concentration <input type="number" name="attr_Concentration" value="0"></label>
    <label>Critical Condition <input type="number" name="attr_CriticalCondition" value="0"></label>
    <label>Powerful Condition Critical <input type="number" name="attr_PowerfulConditionCritical" value="0"></label>
</div>
```

**ADD New Combat Upgrades:**
```html
<!-- NEW COMBAT UPGRADES -->
<div class="attacks-grid-compact">
    <h6>Special Combat Upgrades</h6>
    <label>Intimidating Presence <input type="number" name="attr_IntimidatingPresence" value="0"></label>
    <label>Terrifying Display <input type="number" name="attr_TerrifyingDisplay" value="0"></label>
</div>
```

#### 5. NEW: Limits Section (add entirely new section after upgrades ~492)

```html
<!-- LIMITS SECTION -->
<details>
    <summary><h5>Attack Limits</h5></summary>
    <p>Limits grant bonuses when conditions are met but prevent the attack if conditions aren't met.</p>

    <!-- Usage Limits -->
    <div class="attacks-grid-compact">
        <h6>Usage Limits</h6>
        <label>Charges 1 <input type="number" name="attr_Charges1" value="0"></label>
        <label>Charges 2 <input type="number" name="attr_Charges2" value="0"></label>
    </div>

    <!-- HP-Based Limits -->
    <div class="attacks-grid-compact">
        <h6>HP-Based Limits</h6>
        <label>Timid <input type="number" name="attr_Timid" value="0"></label>
        <label>Near Death <input type="number" name="attr_NearDeath" value="0"></label>
        <label>Bloodied <input type="number" name="attr_Bloodied" value="0"></label>
    </div>

    <!-- Conditional Limits -->
    <div class="attacks-grid-compact">
        <h6>Conditional Limits</h6>
        <label>Vengeful <input type="number" name="attr_Vengeful" value="0"></label>
        <label>Revenge <input type="number" name="attr_RevengeLimit" value="0"></label>
        <label>Unbreakable <input type="number" name="attr_Unbreakable" value="0"></label>
        <label>Untouchable <input type="number" name="attr_Untouchable" value="0"></label>
        <label>Avenger <input type="number" name="attr_AvengerLimit" value="0"></label>
        <label>Passive <input type="number" name="attr_PassiveLimit" value="0"></label>
        <label>Careful <input type="number" name="attr_Careful" value="0"></label>
    </div>

    <!-- Sequential Limits -->
    <div class="attacks-grid-compact">
        <h6>Sequential Limits</h6>
        <label>Combo Move <input type="number" name="attr_ComboMove" value="0"></label>
        <label>Infected <input type="number" name="attr_InfectedLimit" value="0"></label>
        <label>Relentless <input type="number" name="attr_Relentless" value="0"></label>
        <label>Slaughter <input type="number" name="attr_Slaughter" value="0"></label>
    </div>

    <!-- Positioning Limits -->
    <div class="attacks-grid-compact">
        <h6>Positioning Limits</h6>
        <label>Rooted <input type="number" name="attr_Rooted" value="0"></label>
        <label>Blitz <input type="number" name="attr_BlitzLimit" value="0"></label>
        <label>Long Distance Fighter <input type="number" name="attr_LongDistanceFighter" value="0"></label>
        <label>Dangerous <input type="number" name="attr_DangerousLimit" value="0"></label>
    </div>

    <!-- Random Limits -->
    <div class="attacks-grid-compact">
        <h6>Random Limits</h6>
        <label>Unreliable 1 <input type="number" name="attr_Unreliable1" value="0"></label>
        <label>Unreliable 2 <input type="number" name="attr_Unreliable2" value="0"></label>
        <label>Unreliable 3 <input type="number" name="attr_Unreliable3" value="0"></label>
    </div>

    <!-- Time-Based Limits -->
    <div class="attacks-grid-compact">
        <h6>Time-Based Limits</h6>
        <label>Quickdraw <input type="number" name="attr_Quickdraw" value="0"></label>
        <label>Steady <input type="number" name="attr_Steady" value="0"></label>
        <label>Patience <input type="number" name="attr_PatienceLimit" value="0"></label>
        <label>Finale <input type="number" name="attr_Finale" value="0"></label>
    </div>

    <!-- Other Limits -->
    <div class="attacks-grid-compact">
        <h6>Other Limits</h6>
        <label>Charge Up <input type="number" name="attr_ChargeUp" value="0"></label>
        <label>Charge Up 2 <input type="number" name="attr_ChargeUp2" value="0"></label>
        <label>Exhausting <input type="number" name="attr_Exhausting" value="0"></label>
        <label>Cooldown <input type="number" name="attr_Cooldown" value="0"></label>
        <label>Attrition <input type="number" name="attr_Attrition" value="0"></label>
        <label>Drain Reserves <input type="number" name="attr_DrainReserves" value="0"></label>
        <label>Tower Defense <input type="number" name="attr_TowerDefenseLimit" value="0"></label>
        <label>Compressed Release <input type="number" name="attr_CompressedReleaseLimit" value="0"></label>
        <label>Domain <input type="number" name="attr_DomainLimit" value="0"></label>
        <label>Grappler <input type="number" name="attr_GrapplerLimit" value="0"></label>
        <label>Exploit <input type="number" name="attr_ExploitLimit" value="0"></label>
    </div>

    <!-- Sacrifice Limits -->
    <div class="attacks-grid-compact">
        <h6>Sacrifice Limits</h6>
        <label>Sacrifice Minion <input type="number" name="attr_SacrificeMinion" value="0"></label>
        <label>Sacrifice Captain <input type="number" name="attr_SacrificeCaptain" value="0"></label>
        <label>Sacrifice Vanguard <input type="number" name="attr_SacrificeVanguard" value="0"></label>
        <label>Sacrifice Boss <input type="number" name="attr_SacrificeBoss" value="0"></label>
    </div>
</details>
```

### Part 2: Sheet Worker Script Changes

**Location:** Lines ~632-824 (autocalculate script section)

#### Change 1: Update Avoidance Base Value
```javascript
// OLD v5.5 (line ~637)
char_avoidance: {
    base: 10,
    keys: ["char_tier", "char_avMod", "char_mobility"],
    // ...
}

// NEW v6.0
char_avoidance: {
    base: 5,  // Changed from 10 to 5
    keys: ["char_tier", "char_avMod", "char_mobility"],
    // ...
}
```

#### Change 2: Remove Durability Multiplier
```javascript
// OLD v5.5 (line ~644)
char_durability: {
    base: 0,
    keys: ["char_tier", "char_drMod", "char_endurance"],
    weakenKey: "char_weakenDurability",
    multiplier: 1.5,  // REMOVE THIS
    specificKey: "char_endurance",  // REMOVE THIS
    // ...
}

// NEW v6.0
char_durability: {
    base: 0,
    keys: ["char_tier", "char_drMod", "char_endurance"],
    weakenKey: "char_weakenDurability",
    primaryCheckbox: "char_drPrimaryAction",
    bonusField: "traitDrBonus"
}
```

#### Change 3: Remove Damage Multiplier
```javascript
// OLD v5.5 (line ~682)
char_damage: {
    base: 0,
    keys: ["char_tier", "char_dgMod", "char_power"],
    weakenKey: "char_weakenDamage",
    multiplier: 1.5,  // REMOVE THIS
    specificKey: "char_power",  // REMOVE THIS
    // ...
}

// NEW v6.0
char_damage: {
    base: 0,
    keys: ["char_tier", "char_dgMod", "char_power"],
    weakenKey: "char_weakenDamage",
    primaryCheckbox: "char_dgPrimaryAction",
    bonusField: "traitDgBonus"
}
```

#### Change 4: Update Movement Formula
```javascript
// OLD v5.5 (line ~768-819)
on('change:char_tier change:char_mobility change:char_movementMod change:char_swift change:char_weakenMovement change:char_movementPrimaryAction sheet:opened change:repeating_traits remove:repeating_traits', function () {
    const requiredKeys = ["char_tier", "char_mobility", "char_movementMod", "char_swift", "char_weakenMovement", "char_movementPrimaryAction"];

    getAttrs(requiredKeys, function (values) {
        const tier = parseInt(values.char_tier) || 0;
        const mobility = parseInt(values.char_mobility) || 0;

        // OLD: Base movement: Tier + Mobility, but minimum tier of 6
        let total = Math.max(tier, 6) + mobility;

        // ...rest of calculation
    });
});

// NEW v6.0
on('change:char_tier change:char_mobility change:char_movementMod change:char_swift change:char_weakenMovement change:char_movementPrimaryAction sheet:opened change:repeating_traits remove:repeating_traits', function () {
    const requiredKeys = ["char_tier", "char_mobility", "char_movementMod", "char_swift", "char_weakenMovement", "char_movementPrimaryAction"];

    getAttrs(requiredKeys, function (values) {
        const tier = parseInt(values.char_tier) || 0;
        const mobility = parseInt(values.char_mobility) || 0;

        // NEW: Base movement: Mobility + (2 × Tier)
        let total = mobility + (2 * tier);

        // ...rest of calculation (same)
    });
});
```

#### Change 5: Remove Primary Action Handling
```javascript
// In each attribute calculation (lines ~709-765), REMOVE these sections:

// REMOVE from event triggers:
`change:${config.primaryCheckbox}`,

// REMOVE from requiredKeys:
config.primaryCheckbox

// REMOVE from calculation:
if (values[config.primaryCheckbox] === "on") {
    total += parseInt(values.char_tier) || 0;
}
```

**Note:** Since Primary Actions are removed, all the primaryCheckbox references should be deleted from the calculation config and the event handlers.

---

## ScriptCards Implementation Plan

### Part 1: Attack Type Resolution Changes

**Location:** Lines ~224-232 (attack type conditionals)

#### Update Attack Type Logic

**OLD v5.5:**
```javascript
--?[$AttackType] -eq 3|=RollAC; 0  // Direct = no accuracy roll
--?[$AttackType] -eq 5|=RollAC; 0  // AOE Direct = no accuracy roll

--?[$AttackType] -eq 3|=RollDG; 0  // Direct = no damage roll
--?[$AttackType] -eq 5|=RollDG; 0  // AOE Direct = no damage roll
```

**NEW v6.0:**
```javascript
// Type 0: Melee (Accuracy) - no changes
// Type 1: Melee (Damage & Conditions) - no changes
// Type 2: Ranged - no changes
// Type 3: Area - no changes (was type 4)

// Type 4: Direct Condition - no accuracy roll, condition only
--?[$AttackType] -eq 4|=RollAC; 0
--?[$AttackType] -eq 4|=RollDG; 0

// Type 5: Direct Area Condition - no accuracy roll, condition only
--?[$AttackType] -eq 5|=RollAC; 0
--?[$AttackType] -eq 5|=RollDG; 0

// Type 6: Direct Damage - no accuracy roll, damage only
--?[$AttackType] -eq 6|=RollAC; 0
--?[$AttackType] -eq 6|=RollCN; 0

// Type 7: Direct Area Damage - no accuracy roll, damage only
--?[$AttackType] -eq 7|=RollAC; 0
--?[$AttackType] -eq 7|=RollCN; 0
```

#### Update Attack Type Bonuses/Penalties

**Location:** Lines ~271-291

**OLD v5.5:**
```javascript
--?[$AttackType] -eq 0|&AccuracyStringModifiers;+ + [*S:char_tier] [Melee]
--?[$AttackType] -eq 1|&DamageStringModifiers;+ + [*S:char_tier] [Melee]
--?[$AttackType] -eq 1|&ConditionsStringModifiers;+ + [*S:char_tier] [Melee]

--?[$AttackType] -eq 3 -and [$EffectPenaltyApplied] -eq 0|&DamageStringModifiers;+ - [*S:char_tier] [Direct]
--?[$AttackType] -eq 3 -and [$EffectPenaltyApplied] -eq 0|&ConditionsStringModifiers;+ - [*S:char_tier] [Direct]

--?[$AttackType] -eq 4 -and [$EffectPenaltyApplied] -eq 0|&AccuracyStringModifiers;+ - [*S:char_tier] [AOE]

--?[$AttackType] -eq 5 -and [$EffectPenaltyApplied] -eq 0|&DamageStringModifiers;+ - [*S:char_tier] [AOE Direct]
--?[$AttackType] -eq 5 -and [$EffectPenaltyApplied] -eq 0|&ConditionsStringModifiers;+ - [*S:char_tier] [AOE Direct]
```

**NEW v6.0:**
```javascript
// Melee bonuses (unchanged)
--?[$AttackType] -eq 0|&AccuracyStringModifiers;+ + [*S:char_tier] [Melee]
--?[$AttackType] -eq 1|&DamageStringModifiers;+ + [*S:char_tier] [Melee]
--?[$AttackType] -eq 1|&ConditionsStringModifiers;+ + [*S:char_tier] [Melee]

// Type 3: Area - penalty to Accuracy only
--?[$AttackType] -eq 3|&AccuracyStringModifiers;+ - [*S:char_tier] [Area]

// Type 4: Direct Condition - penalty to Condition
--?[$AttackType] -eq 4|&ConditionsStringModifiers;+ - [*S:char_tier] [Direct Condition]

// Type 5: Direct Area Condition - penalty to Condition (doubled)
--=DirectAreaConditionPenalty| [*S:char_tier]*2
--?[$AttackType] -eq 5|&ConditionsStringModifiers;+ - [$DirectAreaConditionPenalty] [Direct Area Condition]

// Type 6: Direct Damage - flat damage penalty
--=DirectDamagePenalty| 15-[*S:char_tier]
--?[$AttackType] -eq 6|&DamageStringModifiers;+ - [$DirectDamagePenalty] [Direct Damage]

// Type 7: Direct Area Damage - flat damage penalty (doubled)
--=DirectAreaDamagePenalty| 15-([*S:char_tier]*2)
--?[$AttackType] -eq 7|&DamageStringModifiers;+ - [$DirectAreaDamagePenalty] [Direct Area Damage]

// Remove all EffectPenaltyApplied logic (no longer needed with clearer types)
```

### Part 2: Condition Application Updates

**Location:** Lines ~632-769 (condition application block)

#### Map Old Conditions to New

**REMOVE:**
```javascript
--?[$EffectType] -ne 1|PassDisarm  // Disarm - REMOVED
--?[$EffectType] -ne 2|PassGrab    // Grab - REMOVED
--?[$EffectType] -ne 3|PassShove   // Shove - REMOVED
--?[$EffectType] -ne 4|PassDaze    // Daze - REMOVED
--?[$EffectType] -ne 5|PassBlind   // Blind - REMOVED
--?[$EffectType] -ne 7|PassSetup   // Setup - REMOVED
--?[$EffectType] -ne 11|PassDisableSpecials  // Disable Specials - REMOVED
```

**UPDATE NEW CONDITION MAPPING:**
```javascript
// New EffectType values:
// 0 = None (Damage Only)
// 1 = Brawl
// 2 = Frighten
// 3 = Taunt
// 4 = Charm
// 5 = Weaken
// 6 = Stun
// 7 = Control

--?[$EffectType] -ne 1|PassBrawl
    --?[$EnemyCnFailAmount] -lt 0|PassBrawl
    --+Applying | Brawl to [*[&testvar]:character_name] - Choose: Push/Prone/Grab
    // Note: Manual implementation by GM/Player - cannot automate choice in Roll20
--:PassBrawl|

--?[$EffectType] -ne 2|PassFrighten
    --?[$EnemyCnFailAmount] -lt 0|PassFrighten
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];aura-target;1  // Using "aura-target" marker
    --+Applying | Frighten to [*[&testvar]:character_name] - Must move away from you
--:PassFrighten|

--?[$EffectType] -ne 3|PassTaunt
    --?[$EnemyCnFailAmount] -lt 0|PassTaunt
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];screaming;1
    --+Applying | Taunt to [*[&testvar]:character_name] - Must include you in attacks
--:PassTaunt|

--?[$EffectType] -ne 4|PassCharm
    --?[$EnemyCnFailAmount] -lt 0|PassCharm
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];heart;1  // Using "heart" marker
    --+Applying | Charm to [*[&testvar]:character_name] - Cannot attack you
--:PassCharm|

--?[$EffectType] -ne 5|PassWeaken
    --?[$EnemyCnFailAmount] -lt 0|PassWeaken
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];radioactive;1
    --=WeakenAmount| [*S:char_tier]*2
    --+Applying | Weaken ([$WeakenAmount]) to [*[&testvar]:character_name]
--:PassWeaken|

--?[$EffectType] -ne 6|PassStun
    --?[$EnemyCnFailAmount] -lt 0|PassStun
    --=StunResistanceBonus| [*[&testvar]:t-bar3_value]/5 {CEIL}
    --+Stun | Target adds [$StunResistanceBonus] to Resistance (1/5 HP)
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar]:lightning-helix;1
    --+Applying | Stun to [*[&testvar]:character_name]
--:PassStun|

--?[$EffectType] -ne 7|PassControl
    --?[$EnemyCnFailAmount] -lt 0|PassControl
    --=ControlResistanceBonus| [*[&testvar]:t-bar3_value]/5 {CEIL}
    --+Control | Target adds [$ControlResistanceBonus] to Resistance (1/5 HP)
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar]:broken-skull;1
    --+Applying | Control to [*[&testvar]:character_name]
--:PassControl|
```

### Part 3: Upgrade Implementation Changes

#### REMOVE These Upgrade Implementations

**Location:** Scattered throughout lines ~149-193, ~296-329, ~386-392, ~406-410, etc.

```javascript
// REMOVE all references to:
--=Blitz| [*R:Blitz]  // Moved to Limits
--=EnhancedEffect| [*R:EnhancedEffect]
--=ConsistentEffect| [*R:ConsistentEffect]
--=SplashDamage| [*R:SplashDamage]
--=MassEffect| [*R:MassEffect]
--=CollateralCondition| [*R:CollateralCondition]
--=ConditionCriticalRange| [*R:ConditionCriticalRange]
--=HeavyStrike| [*R:HeavyStrike]
--=WhirlwindStrike| [*R:WhirlwindStrike]
--=Headshot| [*R:Headshot]  // Keep but update
--=ScatterShot| [*R:ScatterShot]
--=AnalyzingStrike| [*R:AnalyzingStrike]
--=FollowUpStrike| [*R:FollowUpStrike]
--=Counterattack| [*R:Counterattack]
```

#### ADD New Generic Upgrade Implementations

```javascript
// Extended Range (20p) - Ranged and Direct attacks: 15sp → 30sp
--=ExtendedRange| [*R:ExtendedRange]
--?[$ExtendedRange] -eq 1|&AttackNotes;+ Extended Range (30sp),

// Long Range (30p) - Ranged only: 30sp → 100sp
--=LongRange| [*R:LongRange]
--?[$LongRange] -eq 1|&AttackNotes;+ Long Range (100sp),

// Perception Range (20p) - Direct only: 15sp → unlimited
--=PerceptionRange| [*R:PerceptionRange]
--?[$PerceptionRange] -eq 1|&AttackNotes;+ Perception Range (Unlimited),

// Enhanced Scale (20p) - AOE: +2sp burst, +4sp cone, +8sp line
--=EnhancedScale| [*R:EnhancedScale]
--?[$EnhancedScale] -eq 1|&AttackNotes;+ Enhanced Scale (Area Increased),

// Precise (40p) - AOE: Choose targets
--=Precise| [*R:Precise]
--?[$Precise] -eq 1|&AttackNotes;+ Precise (Select Targets),

// Ranged Area (20p) - AOE Burst: Origin can be 15sp away
--=RangedArea| [*R:RangedArea]
--?[$RangedArea] -eq 1|&AttackNotes;+ Ranged Area (15sp Origin),
```

#### UPDATE Existing Upgrade Implementations

**Reliable Accuracy:**
```javascript
// OLD v5.5
--?[$ReliableAccuracy] -eq 1|&AccuracyDice; 2d20kh1 - 4

// NEW v6.0
--?[$ReliableAccuracy] -eq 1|&AccuracyDice; 2d20kh1 - 3
```

**Bleed:**
```javascript
// OLD v5.5
--?[$Bleed] -eq 0|PassBleed
    --?[$DamageAmount] -lt 1|PassBleed
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];red;2
    --+Applying | Bleed to [*[&testvar]:character_name]
--:PassBleed|

// NEW v6.0
--?[$Bleed] -eq 0|PassBleed
    --?[$DamageAmount] -lt 1|PassBleed
    --&DamageStringModifiers;+ - [*S:char_tier] [Bleed Penalty]  // ADD PENALTY
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];red;2
    --+Applying | Bleed (2 turns) to [*[&testvar]:character_name]
--:PassBleed|
```

**Leech:**
```javascript
// OLD v5.5
--?[$Leech] -eq 1|=LeechAmount; [$DamageRoll]/2 {CEIL}
--?[$Leech] -ne 1|PassLeechNote
    --&AttackNotes|+ Leech [$LeechAmount] HP,
--:PassLeechNote|

// NEW v6.0
--?[$Leech] -ne 1|PassLeechNote
    --&AccuracyStringModifiers;+ - [*S:char_tier] [Leech Penalty]  // ADD PENALTY
    --&DamageStringModifiers;+ - [*S:char_tier] [Leech Penalty]
    --&ConditionsStringModifiers;+ - [*S:char_tier] [Leech Penalty]
    --=LeechAmount| [$DamageRoll]/2 {CEIL}
    --&AttackNotes|+ Leech [$LeechAmount] HP,
--:PassLeechNote|
```

**Barrage:**
```javascript
// OLD v5.5
--?[$Barrage] -eq 1|&AttackNotes;+ Barrage (3 attacks),

// NEW v6.0
--?[$Barrage] -ne 1|PassBarrageNote
    --&AttackNotes|+ Barrage (3 attacks, must hit+effect to continue),
--:PassBarrageNote|
// Note: Full implementation requires tracking hit+effect success for each attack
```

**Extra Attack:**
```javascript
// OLD v5.5
--?[$ExtraAttack] -ne 1|PassExtraAttackNote
    --&AttackNotes|+ Extra Attack available on successful hit and effect,
--:PassExtraAttackNote|

// NEW v6.0
--?[$ExtraAttack] -ne 1|PassExtraAttackNote
    --&AttackNotes|+ Extra Attack (requires both hit AND effect, once per turn),
--:PassExtraAttackNote|
```

**Channeled:**
```javascript
// OLD v5.5
--?[$Channeled] -eq 1|&AttackNotes;+ Channeled (bonus builds each turn),

// NEW v6.0
--=Channeled| [*R:Channeled]
--?[$Channeled] -ne 1|PassChanneledNote
    --=ChanneledPenalty| [*S:char_tier]*2
    --&AccuracyStringModifiers;+ - [$ChanneledPenalty] [Channeled Start Penalty]
    --&DamageStringModifiers;+ - [$ChanneledPenalty] [Channeled Start Penalty]
    --&ConditionsStringModifiers;+ - [$ChanneledPenalty] [Channeled Start Penalty]
    --&AttackNotes|+ Channeled (+Tier per turn, max 5×Tier),
--:PassChanneledNote|
```

**Finishing Blow:**
```javascript
// OLD v5.5
--?[$FinishingBlow] -eq 1|&AttackNotes|+ Finishing Blow Applied,
--?[$FinishingBlow] -eq 2|&AttackNotes|+ Finishing Blow Applied,
--?[$FinishingBlow] -eq 3|&AttackNotes|+ Finishing Blow Applied,

// NEW v6.0 (updated thresholds)
--?[$RemainingHP] -ge 6 -or [$FinishingBlow] -ne 1|PassDeadFinishingAuto1
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];dead
    --&AttackNotes|+ Finishing Blow 1 Applied (5 HP threshold),
--:PassDeadFinishingAuto1|

--?[$RemainingHP] -ge 11 -or [$FinishingBlow] -ne 2|PassDeadFinishingAuto2
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];dead
    --&AttackNotes|+ Finishing Blow 2 Applied (10 HP threshold),
--:PassDeadFinishingAuto2|

--?[$RemainingHP] -ge 16 -or [$FinishingBlow] -ne 3|PassDeadFinishingAuto3
    -->LibSN_ADD_STATUS_MARKER_SET|[&testvar];dead
    --&AttackNotes|+ Finishing Blow 3 Applied (15 HP threshold),
--:PassDeadFinishingAuto3|
```

#### ADD New Upgrade Implementations

**Concentration (40p):**
```javascript
--=Concentration| [*R:Concentration]
--?[$Concentration] -ne 1|PassConcentrationNote
    --&AttackNotes|+ Concentration (Free action repeat, cannot make other attacks),
--:PassConcentrationNote|
```

**Powerful Condition Critical (40p):**
```javascript
--=PowerfulConditionCritical| [*R:PowerfulConditionCritical]
--?[$PowerfulConditionCritical] -ne 1|PassPowerfulConditionCriticalNote
    --=ConditionCriticalRange| 15  // Critical on 15-20
    --?[$ConditionsDice] -ge 15 -and [$RollCN] -ge 1|&ConditionsRollString;+  +[*S:char_tier] [POWERFUL CRIT CN]
    --&AttackNotes|+ Powerful Condition Critical (15-20, +Tier again on crit),
--:PassPowerfulConditionCriticalNote|
```

**Intimidating Presence (40p):**
```javascript
--=IntimidatingPresence| [*R:IntimidatingPresence]
--?[$IntimidatingPresence] -ne 1|PassIntimidatingPresenceNote
    --&AttackNotes|+ Intimidating Presence (2sp burst Taunt on defeat),
--:PassIntimidatingPresenceNote|
// Note: Trigger implementation when enemy HP reaches 0
```

**Terrifying Display (40p):**
```javascript
--=TerrifyingDisplay| [*R:TerrifyingDisplay]
--?[$TerrifyingDisplay] -ne 1|PassTerrifyingDisplayNote
    --&AttackNotes|+ Terrifying Display (2sp burst Frighten on defeat),
--:PassTerrifyingDisplayNote|
// Note: Trigger implementation when enemy HP reaches 0
```

### Part 4: Limits System Implementation

**Location:** NEW section to add after upgrade declarations (~193)

```javascript
--/| ==========LIMITS SYSTEM==========

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

--/| ==========LIMIT CHECKING AND BONUS APPLICATION==========
--/| This section needs to check each limit's conditions and apply bonuses

--=LimitBonus| 0  // Total bonus from limits
--=LimitActive| 0  // Track if any limit is active

--/| HP-Based Limits
--?[$Timid] -eq 1|CheckTimid
--?[$NearDeath] -eq 1|CheckNearDeath
--?[$Bloodied] -eq 1|CheckBloodied

--:CheckTimid|
    --?[*S:t-bar1_value] -ne [*S:t-bar1_max]|PassTimid
    --=LimitBonus| [$LimitBonus]+[*S:char_tier]
    --=LimitActive| 1
    --&AttackNotes|+ Timid Limit Active (+Tier),
--:PassTimid|

--:CheckNearDeath|
    --?[*S:t-bar1_value] -gt 25|PassNearDeath
    --=NearDeathBonus| [*S:char_tier]*2
    --=LimitBonus| [$LimitBonus]+[$NearDeathBonus]
    --=LimitActive| 1
    --&AttackNotes|+ Near Death Limit Active (+2×Tier),
--:PassNearDeath|

--:CheckBloodied|
    --?[*S:t-bar1_value] -gt 50|PassBloodied
    --=LimitBonus| [$LimitBonus]+[*S:char_tier]
    --=LimitActive| 1
    --&AttackNotes|+ Bloodied Limit Active (+Tier),
--:PassBloodied|

--/| Random Limits
--?[$Unreliable1] -eq 1|CheckUnreliable1
--?[$Unreliable2] -eq 1|CheckUnreliable2
--?[$Unreliable3] -eq 1|CheckUnreliable3

--:CheckUnreliable1|
    --=UnreliableRoll| 1d20
    --?[$UnreliableRoll] -lt 5|PassUnreliable1
    --=LimitBonus| [$LimitBonus]+[*S:char_tier]
    --=LimitActive| 1
    --&AttackNotes|+ Unreliable 1 Passed (rolled [$UnreliableRoll], +Tier),
--:PassUnreliable1|

--:CheckUnreliable2|
    --=UnreliableRoll| 1d20
    --?[$UnreliableRoll] -lt 10|PassUnreliable2
    --=Unreliable2Bonus| [*S:char_tier]*3
    --=LimitBonus| [$LimitBonus]+[$Unreliable2Bonus]
    --=LimitActive| 1
    --&AttackNotes|+ Unreliable 2 Passed (rolled [$UnreliableRoll], +3×Tier),
--:PassUnreliable2|

--:CheckUnreliable3|
    --=UnreliableRoll| 1d20
    --?[$UnreliableRoll] -lt 15|PassUnreliable3
    --=Unreliable3Bonus| [*S:char_tier]*5
    --=LimitBonus| [$LimitBonus]+[$Unreliable3Bonus]
    --=LimitActive| 1
    --&AttackNotes|+ Unreliable 3 Passed (rolled [$UnreliableRoll], +5×Tier),
--:PassUnreliable3|

--/| NOTE: Many limits require manual GM tracking (turn count, hit status, etc.)
--/| These will be noted in AttackNotes for GM to verify

--/| Apply limit bonus to all three stats if any limit is active
--?[$LimitBonus] -le 0|PassLimitBonus
    --&AccuracyStringModifiers|+ +[$LimitBonus] [Limits]
    --&DamageStringModifiers|+ +[$LimitBonus] [Limits]
    --&ConditionsStringModifiers|+ +[$LimitBonus] [Limits]
--:PassLimitBonus|
```

**Note:** Many limits require manual tracking by the GM/Player (turn count, previous turn actions, positioning, etc.). The ScriptCards will note which limits are active and their bonuses, but verification is manual.

---

## Testing Checklist (For User)

### Phase 1: Character Sheet Testing

#### Core Stats Verification
- [ ] Create new test character with Tier 4
- [ ] Set Mobility to 3
- [ ] **Verify Avoidance** = 5 + 4 + 3 = **12** (was 17 in v5.5)
- [ ] **Verify Movement** = 3 + (2 × 4) = **11** (was 10 in v5.5)
- [ ] Set Endurance to 5
- [ ] **Verify Durability** = 4 + 5 = **9** (was 12 in v5.5 with 1.5× multiplier)
- [ ] Set Power to 4
- [ ] **Verify Damage** = 4 + 4 = **8** (was 10 in v5.5 with 1.5× multiplier)

#### Primary Action Removal Verification
- [ ] Verify NO checkboxes exist next to stats (should all be removed)
- [ ] Stats should calculate without Primary Action bonuses

#### Swift Archetype Verification
- [ ] Enable Swift checkbox
- [ ] With Tier 4, **verify Movement** = base 11 + ⌈4/2⌉ = **13** (adds +2 from Swift)

### Phase 2: Attack Type Testing

#### Test Each Attack Type
- [ ] **Type 0: Melee (Accuracy)** - Verify +Tier to Accuracy roll
- [ ] **Type 1: Melee (Damage & Conditions)** - Verify +Tier to Damage and Conditions rolls
- [ ] **Type 2: Ranged** - Verify normal functionality
- [ ] **Type 3: Area** - Verify -Tier to Accuracy only
- [ ] **Type 4: Direct Condition** - Verify NO accuracy roll, -Tier to Condition
- [ ] **Type 5: Direct Area Condition** - Verify NO accuracy roll, -2×Tier to Condition
- [ ] **Type 6: Direct Damage** - Verify NO accuracy roll, flat damage 15-Tier
- [ ] **Type 7: Direct Area Damage** - Verify NO accuracy roll, flat damage 15-2×Tier

### Phase 3: Condition Testing

- [ ] **Brawl** - Verify prompts for Push/Prone/Grab choice
- [ ] **Frighten** - Verify applies aura-target marker
- [ ] **Taunt** - Verify applies screaming marker
- [ ] **Charm** - Verify applies heart marker
- [ ] **Weaken** - Verify applies radioactive marker, calculates 2×Tier reduction
- [ ] **Stun** - Verify adds 1/5 HP to resistance, applies lightning-helix marker
- [ ] **Control** - Verify adds 1/5 HP to resistance, applies broken-skull marker

### Phase 4: Upgrade Testing

#### New Generic Upgrades
- [ ] **Extended Range** - Verify range becomes 30sp
- [ ] **Long Range** - Verify range becomes 100sp (ranged only)
- [ ] **Perception Range** - Verify unlimited range (direct only)
- [ ] **Enhanced Scale** - Verify AOE size increase
- [ ] **Precise** - Verify target selection prompt
- [ ] **Ranged Area** - Verify origin point selection

#### Updated Upgrades
- [ ] **Reliable Accuracy** - Verify 2d20kh1 with -3 penalty (was -4)
- [ ] **Bleed** - Verify -Tier penalty applied, 2-turn duration
- [ ] **Leech** - Verify -Tier to Accuracy, Damage, Conditions, half damage healed
- [ ] **Channeled** - Verify -2×Tier start penalty, +Tier per turn (max 5×Tier)

#### New Critical Upgrades
- [ ] **Critical Accuracy** - Verify critical range 15-20
- [ ] **Powerful Critical** - Verify critical range 15-20, +Tier again on crit
- [ ] **Powerful Condition Critical** - Verify condition crit 15-20, +Tier again
- [ ] **Intimidating Presence** - Verify 2sp burst Taunt on enemy defeat
- [ ] **Terrifying Display** - Verify 2sp burst Frighten on enemy defeat

### Phase 5: Limits Testing

#### HP-Based Limits
- [ ] **Timid** (max HP, no conditions) - Verify +Tier when active
- [ ] **Near Death** (≤25 HP) - Verify +2×Tier when active
- [ ] **Bloodied** (≤50 HP) - Verify +Tier when active

#### Random Limits
- [ ] **Unreliable 1** (DC 5) - Verify d20 roll, +Tier if ≥5
- [ ] **Unreliable 2** (DC 10) - Verify d20 roll, +3×Tier if ≥10
- [ ] **Unreliable 3** (DC 15) - Verify d20 roll, +5×Tier if ≥15

#### Manual Tracking Limits
- [ ] Verify limits requiring manual tracking display notes correctly
- [ ] **Rooted**, **Careful**, **Passive**, etc. - Verify bonus notes appear

### Phase 6: Edge Cases

- [ ] Test attack with BOTH upgrades and limits active
- [ ] Verify bonuses stack correctly
- [ ] Test Melee + Area attack types
- [ ] Test Direct Damage + Direct Condition combinations
- [ ] Verify critical hits work with new system
- [ ] Test Finishing Blow thresholds (5, 10, 15 HP)
- [ ] Verify Culling Strike (1/5 max HP threshold)

### Phase 7: Migration Testing

- [ ] Load existing v5.5 character
- [ ] Verify stats calculate differently (expected)
- [ ] Update attack types to new numbering
- [ ] Update conditions to new system
- [ ] Remove deprecated upgrades
- [ ] Add limits as appropriate
- [ ] Verify character still functions correctly

---

## Known Limitations & Workarounds

### What Roll20 CANNOT Do

1. **Point Cost Calculations**
   - Cannot auto-calculate upgrade/limit costs
   - Cannot enforce point budgets
   - **Workaround:** Manual tracking on paper/spreadsheet

2. **Archetype Selection**
   - Cannot enforce "choose one" archetype rules
   - Cannot auto-apply archetype bonuses beyond basic stats
   - **Workaround:** Manual selection, use checkboxes/fields as reminders

3. **Complex Limit Tracking**
   - Cannot track "last turn" status automatically
   - Cannot track turn count in combat
   - Cannot track "hit since last turn" automatically
   - **Workaround:** GM/Player manual verification, ScriptCards shows limit notes

4. **Condition Choices**
   - Brawl condition cannot auto-prompt for Push/Prone/Grab choice
   - **Workaround:** GM/Player manually applies chosen effect

5. **AOE Target Selection**
   - "Precise" upgrade cannot selectively target within AOE automatically
   - **Workaround:** GM manually applies damage/conditions to selected targets

6. **Combo/Chain Attack Tracking**
   - Barrage "must hit to continue" cannot be enforced
   - Extra Attack "once per turn" cannot be enforced
   - **Workaround:** Player honor system, GM verification

### What Roll20 CAN Do

1. **Stat Calculations** - All derived stats auto-calculate ✓
2. **Attack Resolution** - Dice rolls, bonuses, comparisons ✓
3. **Status Markers** - Apply/remove markers for conditions ✓
4. **Damage Application** - Auto-apply damage to HP bars ✓
5. **Simple Conditionals** - HP thresholds, random rolls ✓
6. **Notes & Reminders** - Display limit requirements, upgrade effects ✓

---

## Migration Notes

### Converting v5.5 Characters to v6.0

#### Step 1: Stats Will Change Automatically
- **Avoidance** will decrease by 5 (base change from 10 to 5)
- **Movement** will change based on new formula (likely increase for most characters)
- **Durability** will decrease (no more 1.5× Endurance)
- **Damage** will decrease (no more 1.5× Power)
- **Verify all stats** after loading character in v6.0 sheet

#### Step 2: Update Attack Types
| If attack was | Change to |
|---------------|-----------|
| Type 3 (Direct) | Type 4 (Direct Condition) OR Type 6 (Direct Damage) |
| Type 4 (AOE) | Type 3 (Area) |
| Type 5 (AOE Direct) | Type 5 (Direct Area Condition) OR Type 7 (Direct Area Damage) |

#### Step 3: Update Conditions
| If condition was | Change to |
|------------------|-----------|
| Disarm, Grab, or Shove | Brawl (choose effect when applied) |
| Daze or Blind | Remove (no equivalent) OR change to Frighten/Charm |
| Setup | Remove (no equivalent) OR add Exploit limit |
| DisableSpecials | Remove (no equivalent) |

#### Step 4: Remove Deprecated Upgrades
Remove these from all attacks:
- Blitz (add as Limit instead if desired)
- Enhanced Effect
- Consistent Effect
- Splash Damage
- Mass Effect
- Collateral Condition
- Crit CN (use Critical Condition or Powerful Condition Critical instead)
- Heavy Strike
- Whirlwind Strike
- Scatter Shot
- Analyzing Strike
- Follow-Up Strike
- Counterattack

#### Step 5: Add Limits (Optional)
Review attack builds and add appropriate Limits for:
- Charges 1/2 for limited-use attacks
- HP-based limits for "desperation" attacks
- Positioning limits for tactical attacks
- Time-based limits for "finisher" attacks

#### Step 6: Test Everything
Run through Testing Checklist above to verify:
- Stats calculate correctly
- Attacks resolve properly
- Conditions apply correctly
- Upgrades and limits work as expected

---

## Version History

**v6.0 (2025-10-01)** - Current Development Version
- Updated core stat formulas (Avoidance, Movement, Durability, Damage)
- Expanded attack types from 6 to 8
- Simplified conditions from 11 to 7
- Updated 12 existing upgrades
- Added 10 new generic upgrades
- Added 6 new critical upgrades
- Removed 15 deprecated upgrades
- Added complete Limits system (35+ limit types)
- Removed Primary Action permanent bonuses

**v5.5 (Previous)** - Last Stable Version
- Backup preserved in `char_sheet_v5.5_backup/` and `scriptcards_v5.5_backup/`

---

## Implementation Status

### Character Sheet (char_sheet_v6/)
- [ ] Core stat formula updates
- [ ] Attack type dropdown updates
- [ ] Condition dropdown updates
- [ ] Upgrade section updates (remove/add/update)
- [ ] Limits section creation
- [ ] Sheet worker script updates

### ScriptCards (scriptcards_v6/)
- [ ] Attack type resolution updates
- [ ] Condition application updates
- [ ] Upgrade implementations (remove/add/update)
- [ ] Limits system implementation

### Documentation
- [X] Comprehensive roadmap document
- [ ] Testing checklist
- [ ] Migration guide

---

## Next Steps

1. ✅ Create backup directories
2. ✅ Create comprehensive roadmap (this document)
3. ⏳ Update character sheet HTML
4. ⏳ Update character sheet worker scripts
5. ⏳ Update ScriptCards macro
6. ⏳ Create testing checklist
7. ⏳ Hand off to user for Roll20 testing
8. ⏳ Iterate based on test feedback

---

## Contact & Feedback

**Tester:** Trent (User)
**Implementation:** Claude Code AI
**Testing Environment:** Roll20 Campaign

Report issues or provide feedback by updating the "Testing Notes" section below after each test session.

---

## Testing Notes

### Test Session 1 (Date: ____)
**Tester:** ____
**Components Tested:** ____
**Results:** ____
**Issues Found:** ____

### Test Session 2 (Date: ____)
**Tester:** ____
**Components Tested:** ____
**Results:** ____
**Issues Found:** ____

---

**End of Roadmap Document**
