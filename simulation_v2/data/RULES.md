# VITALITY SYSTEM - GAME RULES REFERENCE

*Auto-generated from game_data.py*

---

## ATTACK TYPES

### Melee (Accuracy Choice)
- **Name**: `melee_ac`
- **Cost**: 0 points
- **Bonus**: +Tier to accuracy
- **Description**: Melee attack choosing accuracy bonus

### Melee (Damage Choice)
- **Name**: `melee_dg`
- **Cost**: 0 points
- **Bonus**: +Tier to damage
- **Description**: Melee attack choosing damage bonus

### Ranged
- **Name**: `ranged`
- **Cost**: 0 points
- **Description**: Standard ranged attack

### Area Attack
- **Name**: `area`
- **Cost**: 0 points
- **Modifiers**: -1 accuracy, -1 damage
- **Special**: Hits all enemies in area
- **Note**: Upgrades and limits cost 2× for AOE attacks

### Direct Damage
- **Name**: `direct_damage`
- **Cost**: 0 points
- **Base Damage**: 15 (auto-hit)
- **Description**: Bypasses accuracy rolls, deals fixed damage

### Direct Area Damage
- **Name**: `direct_area_damage`
- **Cost**: 0 points
- **Base Damage**: 15 (auto-hit)
- **Special**: Hits all enemies in area
- **Note**: Upgrades and limits cost 2× for AOE attacks

---

## UPGRADES

### 1-Point Upgrades

#### Power Attack
- **Cost**: 1 point
- **Effect**: +1 damage, -1 accuracy
- **Updated**: 2025-10-04 (was 10p)

#### Critical Effect
- **Cost**: 1 point
- **Effect**: -2 damage, dice explode on 5-6
- **Updated**: 2025-10-04 (was 10p)

#### Critical Accuracy
- **Cost**: 1 point
- **Effect**: Critical hits on 15-20 (instead of 20)
- **Updated**: 2025-10-04 (was 20p)

#### Finishing Blow I
- **Cost**: 1 point
- **Effect**: Instantly defeat enemies at ≤5 HP
- **Updated**: 2025-10-04 (was 20p)
- **Restriction**: Cannot use with AOE attacks

#### Minion Slayer (Accuracy)
- **Cost**: 1 point
- **Effect**: +Tier accuracy vs minions (≤25 HP)
- **Updated**: 2025-10-04 (was 20p)

#### Minion Slayer (Damage)
- **Cost**: 1 point
- **Effect**: +Tier damage vs minions (≤25 HP)
- **Updated**: 2025-10-04 (was 20p)

#### Captain Slayer (Accuracy)
- **Cost**: 1 point
- **Effect**: +Tier accuracy vs captains (26-50 HP)
- **Updated**: 2025-10-04 (was 20p)

#### Captain Slayer (Damage)
- **Cost**: 1 point
- **Effect**: +Tier damage vs captains (26-50 HP)
- **Updated**: 2025-10-04 (was 20p)

#### Elite Slayer (Accuracy)
- **Cost**: 1 point
- **Effect**: +Tier accuracy vs elites (51-75 HP)
- **Updated**: 2025-10-04 (was 20p)

#### Elite Slayer (Damage)
- **Cost**: 1 point
- **Effect**: +Tier damage vs elites (51-75 HP)
- **Updated**: 2025-10-04 (was 20p)

#### Boss Slayer (Accuracy)
- **Cost**: 1 point
- **Effect**: +Tier accuracy vs bosses (76+ HP)
- **Updated**: 2025-10-04 (was 20p)

#### Boss Slayer (Damage)
- **Cost**: 1 point
- **Effect**: +Tier damage vs bosses (76+ HP)
- **Updated**: 2025-10-04 (was 20p)

#### Accurate Attack
- **Cost**: 1 point
- **Effect**: +1 accuracy, -1 damage
- **Updated**: 2025-10-04 (was 10p)

#### Reliable Accuracy
- **Cost**: 1 point
- **Effect**: Roll twice, take higher (advantage), -3 accuracy
- **Updated**: 2025-10-04 (was 20p)

#### Culling Strike
- **Cost**: 1 point
- **Effect**: Instantly defeat enemies at ≤20% max HP
- **Updated**: 2025-10-04 (was 20p)
- **Restriction**: Cannot use with AOE attacks

#### Ricochet
- **Cost**: 1 point
- **Effect**: On critical hit, bounce to another enemy
- **Updated**: 2025-10-04 (was 30p)
- **Restriction**: Cannot use with AOE attacks or other crit effects

### 2-Point Upgrades

#### High Impact
- **Cost**: 2 points
- **Effect**: +15 flat damage
- **Updated**: 2025-10-05 (was 20p → 2p)

#### Brutal
- **Cost**: 2 points
- **Effect**: Reroll damage dice showing 1-10
- **Updated**: 2025-10-04 (was 40p)

#### Quick Strikes
- **Cost**: 2 points
- **Effect**: Attack twice with -1 damage, -1 accuracy each
- **Restriction**: melee_ac, melee_dg, ranged, direct_damage only
- **Updated**: 2025-10-04 (was 40p)

#### Powerful Critical
- **Cost**: 2 points
- **Effect**: Critical hits deal double damage
- **Updated**: 2025-10-04 (was 40p)
- **Mutual Exclusion**: Cannot combine with double_tap, explosive_critical, ricochet

#### Finishing Blow II
- **Cost**: 2 points
- **Effect**: Instantly defeat enemies at ≤10 HP
- **Updated**: 2025-10-04 (was 40p)
- **Restriction**: Cannot use with AOE attacks

#### Overhit
- **Cost**: 2 points
- **Effect**: Excess damage carries to another enemy
- **Updated**: 2025-10-04 (was 40p)

#### Channeled
- **Cost**: 2 points
- **Effect**: -1 accuracy, -1 damage, charge to multiply damage
- **Updated**: 2025-10-05 (penalties reduced)

### 3-Point Upgrades

#### Armor Piercing
- **Cost**: 3 points
- **Effect**: Ignore enemy endurance (durability)
- **Updated**: 2025-10-04 (was 70p)

#### Bleed
- **Cost**: 3 points
- **Effect**: Apply bleed for 2 turns (damage - tier)
- **Updated**: 2025-10-04 (was 60p)

#### Double Tap
- **Cost**: 3 points
- **Effect**: Critical hits trigger extra attack
- **Updated**: 2025-10-04 (was 60p)
- **Mutual Exclusion**: Cannot combine with powerful_critical, explosive_critical, ricochet

#### Barrage
- **Cost**: 3 points
- **Effect**: Chain attacks while hitting, -1 accuracy, -1 damage
- **Restriction**: melee_ac, melee_dg, ranged, direct_damage only
- **Updated**: 2025-10-04 (was 60p)

#### Explosive Critical
- **Cost**: 3 points
- **Effect**: Critical hits create AOE explosion
- **Restriction**: Cannot use with AOE attacks
- **Updated**: 2025-10-04 (was 60p)
- **Mutual Exclusion**: Cannot combine with double_tap, powerful_critical, ricochet

#### Leech
- **Cost**: 3 points
- **Effect**: Heal for damage dealt, -1 accuracy, -1 damage
- **Updated**: 2025-10-04 (was 60p)
- **Restriction**: Cannot use with AOE attacks

### 4-Point Upgrades

#### Extra Attack
- **Cost**: 4 points
- **Effect**: Make an additional attack each turn
- **Restriction**: melee_ac, melee_dg, ranged, direct_damage only
- **Updated**: 2025-10-04 (was 80p)

### 5-Point Upgrades

#### Finishing Blow III
- **Cost**: 5 points
- **Effect**: Instantly defeat enemies at ≤15 HP
- **Updated**: 2025-10-05 (was 90p → 5p)
- **Restriction**: Cannot use with AOE attacks

#### Splinter
- **Cost**: 5 points
- **Effect**: On kill, make free attack on another enemy (Tier/2 times)
- **Restriction**: Cannot use with AOE attacks
- **Updated**: 2025-10-05 (was 80p → 5p)

---

## LIMITS

### 1-Point Limits

#### Charges I
- **Cost**: 1 point
- **Bonus**: +3×Tier accuracy & damage
- **Condition**: 1 use per rest
- **Updated**: 2025-10-05

#### Slaughter
- **Cost**: 1 point
- **Bonus**: +3×Tier accuracy & damage
- **Condition**: Defeated enemy last turn
- **Updated**: 2025-10-04 (was 10p)
- **Mutual Exclusion**: relentless, combo_move

#### Timid
- **Cost**: 1 point
- **Bonus**: +2×Tier accuracy & damage
- **Condition**: At maximum HP
- **Updated**: 2025-10-04 (was 30p)
- **Mutual Exclusion**: near_death, bloodied

#### Attrition
- **Cost**: 1 point
- **Bonus**: +2×Tier accuracy & damage
- **Cost**: Costs 20 HP per use
- **Updated**: 2025-10-04 (was 30p)

#### Untouchable
- **Cost**: 1 point
- **Bonus**: +2×Tier accuracy & damage
- **Condition**: All attacks missed last turn
- **Updated**: 2025-10-04 (was 30p)
- **Mutual Exclusion**: revenge, vengeful, unbreakable, passive, careful

#### Unbreakable
- **Cost**: 1 point
- **Bonus**: +4×Tier accuracy & damage
- **Condition**: Hit but took no damage last turn
- **Updated**: 2025-10-05
- **Mutual Exclusion**: revenge, vengeful, untouchable, passive, careful

### 2-Point Limits

#### Unreliable I
- **Cost**: 2 points
- **Bonus**: +Tier accuracy & damage
- **Condition**: DC 5 reliability check (fail = wasted turn)
- **Updated**: 2025-10-04 (was 40p)
- **Mutual Exclusion**: unreliable_2, unreliable_3

#### Unreliable III
- **Cost**: 2 points
- **Bonus**: +6×Tier accuracy & damage
- **Condition**: DC 15+ reliability check (fail = wasted turn)
- **Updated**: 2025-10-05
- **Mutual Exclusion**: unreliable_1, unreliable_2

#### Quickdraw
- **Cost**: 2 points
- **Bonus**: +3×Tier accuracy & damage
- **Condition**: First round only
- **Updated**: 2025-10-05
- **Mutual Exclusion**: steady, patient, finale, cooldown

#### Cooldown
- **Cost**: 2 points
- **Bonus**: +4×Tier accuracy & damage
- **Condition**: Cannot use again for 3 turns after use
- **Updated**: 2025-10-05
- **Mutual Exclusion**: quickdraw, steady, patient, finale

#### Charges II
- **Cost**: 2 points
- **Bonus**: +2×Tier accuracy & damage
- **Condition**: 2 uses per rest
- **Updated**: 2025-10-04 (was 50p)
- **Mutual Exclusion**: charges_1

#### Near Death
- **Cost**: 2 points
- **Bonus**: +2×Tier accuracy & damage
- **Condition**: At ≤25 HP
- **Updated**: 2025-10-05
- **Mutual Exclusion**: bloodied, timid

#### Relentless
- **Cost**: 2 points
- **Bonus**: +2×Tier accuracy & damage
- **Condition**: Dealt damage last turn
- **Updated**: 2025-10-05
- **Mutual Exclusion**: slaughter, combo_move

#### Passive
- **Cost**: 2 points
- **Bonus**: +2×Tier accuracy & damage
- **Condition**: Not attacked since last turn
- **Updated**: 2025-10-04 (was 50p)
- **Mutual Exclusion**: revenge, vengeful, untouchable, unbreakable, careful

### 3-Point Limits

#### Unreliable II
- **Cost**: 3 points
- **Bonus**: +3×Tier accuracy & damage
- **Condition**: DC 10 reliability check (fail = wasted turn)
- **Updated**: 2025-10-05
- **Mutual Exclusion**: unreliable_1, unreliable_3

#### Bloodied
- **Cost**: 3 points
- **Bonus**: +Tier accuracy & damage
- **Condition**: At ≤50 HP
- **Updated**: 2025-10-05
- **Mutual Exclusion**: near_death, timid

#### Charge Up
- **Cost**: 3 points
- **Bonus**: +5×Tier accuracy & damage
- **Condition**: Spend action on previous turn charging
- **Updated**: 2025-10-05
- **Mutual Exclusion**: charge_up_2

#### Revenge
- **Cost**: 3 points
- **Bonus**: +Tier accuracy & damage
- **Condition**: Been damaged since last turn
- **Updated**: 2025-10-05
- **Mutual Exclusion**: vengeful, untouchable, unbreakable, passive, careful

#### Careful
- **Cost**: 3 points
- **Bonus**: +2×Tier accuracy & damage
- **Condition**: Not damaged since last turn
- **Updated**: 2025-10-05
- **Mutual Exclusion**: revenge, vengeful, untouchable, unbreakable, passive

### 4-Point Limits

#### Patient
- **Cost**: 4 points
- **Bonus**: +Tier accuracy & damage
- **Condition**: Turn 5 or later
- **Updated**: 2025-10-05
- **Mutual Exclusion**: quickdraw, steady, finale, cooldown

#### Finale
- **Cost**: 4 points
- **Bonus**: +2×Tier accuracy & damage
- **Condition**: Turn 7 or later
- **Updated**: 2025-10-05
- **Mutual Exclusion**: quickdraw, steady, patient, cooldown

#### Charge Up II
- **Cost**: 4 points
- **Bonus**: +7×Tier accuracy & damage
- **Condition**: Spend actions on previous TWO turns charging
- **Updated**: 2025-10-05
- **Mutual Exclusion**: charge_up

#### Combo Move
- **Cost**: 4 points
- **Bonus**: +Tier accuracy & damage
- **Condition**: Hit same enemy last turn
- **Updated**: 2025-10-05
- **Mutual Exclusion**: slaughter, relentless

#### Vengeful
- **Cost**: 4 points
- **Bonus**: +Tier accuracy & damage
- **Condition**: Been hit since last turn
- **Updated**: 2025-10-05
- **Mutual Exclusion**: revenge, untouchable, unbreakable, passive, careful

### 5-Point Limits

#### Steady
- **Cost**: 5 points
- **Bonus**: +Tier accuracy & damage
- **Condition**: Turn 3 or later
- **Updated**: 2025-10-05
- **Mutual Exclusion**: quickdraw, patient, finale, cooldown

---

## COMPATIBILITY RULES

### Attack Type Restrictions

Some upgrades only work with specific attack types:

- **quick_strikes, barrage, extra_attack**: melee_ac, melee_dg, ranged, direct_damage only
- **explosive_critical, splinter, ricochet**: melee_ac, melee_dg, ranged, direct_damage only (no AOE)

### AOE Restrictions

The following upgrades **cannot** be used with AOE attacks (area, direct_area_damage):

- finishing_blow_1, finishing_blow_2, finishing_blow_3
- culling_strike
- leech
- critical_accuracy
- explosive_critical
- splinter
- ricochet

### Mutual Exclusions

**Critical Effect Upgrades** (pick only one):
- double_tap ⊗ powerful_critical ⊗ explosive_critical ⊗ ricochet

**Unreliable Limits** (pick only one):
- unreliable_1 ⊗ unreliable_2 ⊗ unreliable_3

**Turn-Based Limits** (pick only one):
- quickdraw ⊗ steady ⊗ patient ⊗ finale ⊗ cooldown

**Charge Limits** (pick only one):
- charge_up ⊗ charge_up_2
- charges_1 ⊗ charges_2

**Slayer Exclusions** (pick accuracy OR damage per tier):
- minion_slayer_acc ⊗ minion_slayer_dmg
- captain_slayer_acc ⊗ captain_slayer_dmg
- elite_slayer_acc ⊗ elite_slayer_dmg
- boss_slayer_acc ⊗ boss_slayer_dmg

**HP-Based Limits** (pick only one):
- near_death ⊗ bloodied ⊗ timid

**Offensive Turn Tracking** (pick only one):
- slaughter ⊗ relentless ⊗ combo_move

**Defensive Turn Tracking** (pick only one):
- revenge ⊗ vengeful ⊗ untouchable ⊗ unbreakable ⊗ passive ⊗ careful

---

## COST MULTIPLIERS

### AOE Attack Cost Multiplier
When using **area** or **direct_area_damage** attacks:
- All upgrade costs are **doubled**
- All limit costs are **doubled**

### Example
- Power Attack (1pt) on melee attack = 1 point
- Power Attack (1pt) on area attack = 2 points

---

## ARCHETYPE POINT BUDGETS

Points available per attack based on archetype and tier:

| Tier | Focused | Dual Natured | Versatile Master |
|------|---------|--------------|------------------|
| 3    | 2       | 4            | 6                |
| 4    | 4       | 6            | 8                |
| 5    | 6       | 8            | 10               |

### Archetype Attack Counts
- **Focused**: 1 attack
- **Dual Natured**: 2 attacks
- **Versatile Master**: 5 attacks

---

*Last Updated: 2025-10-05*
*Source: simulation_v2/src/game_data.py*
