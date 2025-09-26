# Vitality System TTRPG - Combat Simulation Rules

This document contains the consolidated, authoritative rule definitions for the Vitality System combat damage optimization simulator.

## Project Overview

This is a combat damage optimization simulator for the Vitality System TTRPG. The project focuses on finding optimal attack builds by simulating turn-by-turn combat scenarios and measuring damage per turn (DPT) and turns to kill (TTK) metrics.

**Key Feature**: The simulator tests builds against **four different enemy configurations** per simulation:
- Fight 1: 1×100 HP Boss (traditional single-target)
- Fight 2: 2×50 HP Enemies (medium group)
- Fight 3: 4×25 HP Enemies (large group)
- Fight 4: 10×10 HP Enemies (swarm)

This provides realistic performance analysis showing how builds perform across different tactical scenarios, with AOE attacks demonstrating clear advantages against multiple enemies.

## Core Game Mechanics

### Character System
- **Character stats**: focus, power, mobility, endurance, tier
- **Derived stats**:
  - Avoidance = 5 + tier + mobility
  - Durability = tier + endurance

### Combat Resolution
1. **Limit checks**: Roll d20 vs DC for unreliable upgrades
2. **Accuracy check**: 1d20 + tier + focus vs target avoidance (skipped for direct attacks)
3. **Damage calculation**: 3d6 + tier + power + modifiers - durability
4. **Special effects**: Exploding dice, flat damage, triple attacks, bleed, brutal
5. **Multi-target handling**: AOE attacks use shared damage dice but individual accuracy rolls per target

### Key Mechanics Implemented
- **Exploding dice**: 6s explode normally, 5-6s explode with Critical Effect
- **Bleed condition**: Target takes same damage for 2 additional turns (replaces existing bleed)
- **Triple attacks**: Quick Strikes make 3 attacks with penalties
- **Armor Piercing**: Ignores endurance portion of durability
- **Brutal**: Extra damage when exceeding DR by 10+ (50% of excess damage)
- **Critical hits**: Natural 20 or 15-20 with Critical Accuracy, +tier damage on crit
- **Advantage**: Reliable Accuracy grants advantage but with -3 accuracy penalty
- **Slayer bonuses**: Conditional accuracy/damage bonuses based on target HP thresholds

## Attack Types

### Attack Type Definitions
- **melee_ac**: Melee with +Tier accuracy bonus, adjacent only
- **melee_dg**: Melee with +Tier damage bonus, adjacent only
- **ranged**: No bonuses, -Tier if adjacent
- **area**: -Tier accuracy penalty
- **direct_damage**: Flat (13-Tier) damage, no roll
- **direct_area_damage**: Flat (13-2×Tier) damage, no roll

## Upgrades (with costs and mechanics)

### Core Combat Upgrades
- **Power Attack** (10p): +Tier damage, -Tier accuracy
- **High Impact** (20p): Flat 15 damage instead of 3d6 roll
- **Critical Effect** (20p): Dice explode on 5-6 instead of just 6, -2 damage penalty
- **Armor Piercing** (20p): Ignore endurance portion of durability
- **Brutal** (40p): Extra damage when exceeding DR by 10+ (50% of excess)
- **Accurate Attack** (10p): +Tier accuracy, -Tier damage

### Multi-Attack Upgrades
- **Quick Strikes** (60p): Attack 3 times (non-AOE attacks only), -Tier accuracy and damage per attack
- **Extra Attack** (70p): Make identical attack when hit + effect succeeds
- **Double Tap** (30p): Make identical attack on critical hit (15-20 with Critical Accuracy)

### Condition & Effect Upgrades
- **Bleed** (80p): Target takes same damage for next 2 turns (replaces existing bleed), -Tier damage penalty
- **Critical Accuracy** (30p): Critical hit on 15-20 instead of just 20
- **Powerful Condition Critical** (20p): +Tier bonus to Damage and Condition rolls on critical hits (requires Critical Accuracy)
- **Reliable Accuracy** (20p): Roll with advantage, -3 penalty to all Accuracy rolls
- **Overhit** (30p): +1 damage per 2 points exceeding avoidance by 5+

### Finishing Blow Upgrades
- **Finishing Blow Rank 1** (20p): If attack reduces enemy to ≤5 HP, enemy is defeated instead. Cannot apply to AOE attacks.
- **Finishing Blow Rank 2** (30p): If attack reduces enemy to ≤10 HP, enemy is defeated instead. Cannot apply to AOE attacks.
- **Finishing Blow Rank 3** (40p): If attack reduces enemy to ≤15 HP, enemy is defeated instead. Cannot apply to AOE attacks.

### Slayer Upgrades
All slayer upgrades cost 20p and provide +Tier bonus to chosen roll type vs targets within HP threshold:

- **Minion Slayer** (20p): +Tier to chosen roll type vs targets ≤10 HP
- **Captain Slayer** (20p): +Tier to chosen roll type vs targets ≤25 HP
- **Elite Slayer** (20p): +Tier to chosen roll type vs targets ≤50 HP
- **Boss Slayer** (20p): +Tier to chosen roll type vs targets ≤100 HP

Each slayer upgrade has two variants:
- **_acc**: Bonus applies to accuracy rolls
- **_dmg**: Bonus applies to damage rolls

## Limits (Unreliable Upgrades)

### Unreliable Limits (DC-based activation)
- **Unreliable 1** (30p): +Tier to chosen roll type, DC 5 activation
- **Unreliable 2** (20p): +2×Tier to chosen roll type, DC 10 activation
- **Unreliable 3** (20p): +3×Tier to Accuracy and Damage, DC 15 activation - attack fails entirely on missed rolls

### Turn-Based Limit Upgrades
- **Quickdraw** (10p): +Tier to chosen roll type, turns 1-2 only
- **Steady** (40p): +Tier to chosen roll type, turn 4 or later
- **Patient** (20p): +Tier to chosen roll type, turn 5 or later
- **Finale** (10p): +Tier to chosen roll type, turn 8 or later
- **Charge Up** (10p): +Tier to chosen roll type, spend action on previous turn
- **Charge Up 2** (10p): +2×Tier to Accuracy and Damage, spend actions on previous two turns

## Rule Validation System

### Prerequisites
- **Powerful Condition Critical** requires **Critical Accuracy**

### Mutual Exclusions
- **Double Tap**, **Ricochet**, **Explosive Critical** (mutually exclusive)
- **Unreliable 1**, **Unreliable 2**, **Unreliable 3** (mutually exclusive)
- **Quickdraw**, **Steady**, **Patient**, **Finale** (mutually exclusive)
- **Charge Up**, **Charge Up 2** (mutually exclusive)
- Slayer upgrades: Can only pick one type (acc/dmg) per slayer level

### Attack Type Restrictions
- **Quick Strikes**: Only compatible with melee_ac, melee_dg, ranged, direct_damage

### AOE Restrictions
These upgrades cannot apply to AOE attacks (area, direct_area_damage):
- **Finishing Blow** (all ranks)
- **Culling Strike**
- **Leech**
- **Critical Accuracy**
- **Critical Condition**

## Multi-Enemy Combat System

### Combat Scenarios
Each simulation includes four fight scenarios:
1. **1×100 HP Boss**: Traditional single-target combat
2. **2×50 HP Enemies**: Medium group tactical scenario
3. **4×25 HP Enemies**: Large group tactical scenario
4. **10×10 HP Enemies**: Swarm scenario

### AOE Attack Mechanics
- **Shared Damage Roll**: All AOE targets use the same 3d6 roll for consistency
- **Individual Accuracy**: Each target gets its own accuracy check
- **Dynamic Targeting**: AOE attacks automatically hit all alive enemies
- **Condition Tracking**: Bleed and other effects tracked separately per enemy

## Final Implemented Values (Current Version)

- **Steady**: 40p, turn 4 or later
- **Critical Effect**: 20p, -2 damage penalty
- **Quick Strikes**: 60p
- **Brutal**: 40p
- **Charge Up 2**: 10p, +2×Tier to damage and accuracy
- **Unreliable 3**: 20p, +3×Tier to damage and accuracy
- **Bleed**: 80p, includes -Tier damage penalty
- **Armor Piercing**: No additional accuracy penalty beyond base mechanics
- **Finishing Blow**: Rank 1 (20p), Rank 2 (30p), Rank 3 (40p)
- **Reliable Accuracy**: -3 accuracy penalty, 20p cost
- **Quickdraw**: Works on turns 1 and 2

## Development Notes

When modifying combat mechanics, ensure changes maintain consistency with these rules. The multi-enemy system is designed to be modular - new enemy configurations can be added easily.

**Key Implementation Notes:**
- Single-target attacks automatically target the first alive enemy
- AOE attacks use shared dice mechanics for damage consistency
- Enemy defeat is handled dynamically during combat resolution
- DPT calculations account for total HP pool across all enemies in the scenario

The current architecture supports easy extension - new attack types, upgrades, or limits can be added by updating the respective data modules and implementing any special effect logic in the combat resolution functions.