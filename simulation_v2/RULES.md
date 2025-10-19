# VITALITY SYSTEM - SIMULATION V2 RULES REFERENCE

*Aligned with Section 6: Attacks (06_section_6_attacks.md)*

---

## Architecture and Core Systems

### Character System
- **Character class**: Represents both attackers and defenders with stats (focus, power, mobility, endurance, tier)
- **Derived stats**: Avoidance (10 + tier + mobility), Durability (5 + tier + endurance), Resistance (10 + tier + secondary defense)

### Combat Resolution
1. **Declare Attack** → Attack Type and target/s
2. **Accuracy Check** → 1d20 + Tier + Focus vs target's Avoidance Score (skipped for direct attacks)
3. **Effect Check** → Damage Roll vs target's Durability Score or Condition Check vs target's Resistance Score
   - **Damage Roll**: 3d6 + Tier + Power - Target's Durability
   - **Condition Check**: 1d20 + Tier + Power vs Target's Resistance
4. **Apply Results** → Reduce HP by damage taken or apply condition effect
5. **Enemy Retaliation** → In multi-enemy scenarios, the attacker is attacked by at most 2 enemies per turn (even if more enemies are alive)

### Attack Build System
- **Attack Build class**: Combines attack type, upgrades, and limits
- **Cost validation**: Ensures builds stay within point budgets based on tier and archetype
- **Modular upgrades**: Each upgrade modifies accuracy, damage, or adds special effects
- **AOE cost multiplier**: Area and Direct Area attacks pay 2× for all upgrades and limits

### Archetype System

Point budgets per attack based on tier and archetype:

| Tier | Focused | Dual Natured | Versatile Master |
|------|---------|--------------|------------------|
| 3    | 6       | 4            | 2                |
| 4    | 8       | 6            | 4                |
| 5    | 10      | 8            | 6                |

- **Focused**: 1 attack, highest point budget per attack
- **Dual Natured**: 2 attacks, moderate point budget per attack
- **Versatile Master**: 3 attacks, lowest point budget per attack

### Key Game Mechanics
- **Exploding dice**: 6s explode normally, 5-6s explode with Critical Effect upgrade
- **Critical hits**: Natural 20 (or 15-20 with critical upgrades) adds +Tier to damage
- **Multi-target handling**: AOE attacks use shared damage dice but individual accuracy rolls per target

---

## ATTACK TYPES

### **MELEE ATTACK (Accuracy)**
- **Type Code**: `melee_ac`
- **Range**: Adjacent targets only
- **Benefit**: Add Tier to Melee Accuracy rolls

### **MELEE ATTACK (Damage & Conditions)**
- **Type Code**: `melee_dg`
- **Range**: Adjacent targets only
- **Benefit**: Add Tier to Melee Damage and Conditions rolls

### **RANGED ATTACK**
- **Type Code**: `ranged`
- **Range**: 15 spaces base
- **Penalty**: -Tier to Accuracy if adjacent to hostile character

### **AREA ATTACK**
- **Type Code**: `area`
- **Range**: Originates from your position
- **Area Options**: 2sp Radius Burst, 4sp Cone, 8sp Line (choose one at purchase)
- **Penalty**: -Tier to Accuracy checks
- **Cost Modifier**: All upgrades / limits cost 2× as much



### **DIRECT DAMAGE ATTACK**
- **Type Code**: `direct_damage`
- **Range**: 15 spaces, auto-hit (no Accuracy roll needed)
- **Restriction**: Must be Damage Effect
- **Damage**: Flat 10

### **DIRECT AREA DAMAGE ATTACK**
- **Type Code**: `direct_area_damage`
- **Range**: Originates from your position, auto-hit (no Accuracy roll needed)
- **Area Options**: 2sp Radius Burst, 4sp Cone, 8sp Line (choose one at purchase)
- **Restriction**: Must be Damage Effect
- **Damage**: Flat 10 - Tier
- **Cost Modifier**: All upgrades / limits cost 2× as much

---



---



### Core Combat Upgrades

**Accurate Attack** (1p)
- **Effect**: +Tier to Accuracy rolls
- **Penalty**: -Tier to Damage and Condition rolls
- **Restriction**: Melee, Ranged, Area attacks only

**Power Attack** (1p)
- **Effect**: +Tier to Damage rolls
- **Penalty**: -Tier to Accuracy rolls
- **Restriction**: Melee, Ranged, Area attacks only

**Reliable Accuracy** (2p)
- **Effect**: Advantage (roll 2d20, take higher roll) on Accuracy rolls
- **Penalty**: -3 penalty to all Accuracy rolls

**Overhit** (2p)
- **Effect**: For every 2 points your Accuracy roll exceeds the target's Avoidance, add +1 to the effect roll
- **Restriction**: Only occurs if your Accuracy roll exceeds target Avoidance by 15+

**High Impact** (3p)
- **Effect**: Replace 3d6 damage roll with flat 15 damage
- **Restriction**: Damage effects only

**Critical Effect** (1p)
- **Effect**: All dice explode on a 5-6, cumulatively
- **Penalty**: -2 penalty to all Damage rolls
- **Restriction**: Damage effects only

**Armor Piercing** (3p)
- **Effect**: Ignore target's Durability Endurance bonus
- **Penalty**: -1 to Accuracy rolls (flat penalty, not tier-based)
- **Restriction**: Cannot take with Direct or Direct Area Attacks, Damage effects only

**Brutal** (2p)
- **Effect**: When Damage roll exceeds target Durability by 20+, deal extra damage equal to half the difference
- **Restriction**: Damage effects only

### Multi-Attack Upgrades

**Barrage** (1p)
- **Effect**: Make same attack three times against single target
- **Penalty**: -2×Tier to Accuracy, Damage, and Condition rolls

**Extra Attack** (1p)
- **Effect**: Successful hit with successful effect allows identical attack against same target
- **Usage**: Must hit and succeed on both Accuracy and Effect
- **Penalty**: -Tier to Accuracy, Damage, and Condition rolls
- **Frequency**: Once per turn maximum

### Critical Hit Upgrades

**Critical Accuracy** (1p)
- **Effect**: Critical hit range expanded to 15-20 on d20

**Powerful Critical** (2p)
- **Effect**: Critical hit range expanded to 15-20 on d20, add Tier bonus again to Damage and Conditions rolls on a Critical Accuracy roll

**Ricochet** (2p)
- **Effect**: Critical hit range expanded to 15-20 on d20, trigger an additional attack against a different target within range
- **Restriction**: Cannot apply to AOE attacks
- **Exclusion**: Cannot trigger from Double-Tap, Explosive Critical, or other Ricochet

**Double Tap** (3p)
- **Effect**: Critical hit range expanded to 15-20 on d20, hit rolls of 15-20 trigger same attack again against same target
- **Restriction**: Cannot apply to AOE attacks
- **Exclusion**: Cannot trigger from Ricochet, Explosive Critical, or other Double Tap

**Explosive Critical** (2p)
- **Effect**: Critical hit range expanded to 15-20 on d20, hit rolls of 15-20 trigger attack against all enemies within 2 spaces of target if it would also hit them
- **Penalty**: -Tier to Accuracy, Damage and Condition Rolls
- **Restriction**: Cannot apply to AOE attacks
- **Exclusion**: Cannot trigger from Double Tap, Ricochet, or other Explosive Critical


### Damage Over Time Upgrades

**Bleed** (3p)
- **Effect**: Target takes identical damage again at end of your next 2 turns
- **Penalty**: -Tier to Damage
- **Duration**: 2 additional damage instances
- **Restriction**: Target can only be affected by one instance of bleed at a time, Damage only



### Instant Defeat Upgrades

**Finishing Blow** (3p)
- **Effect**: If attack reduces enemy to 10 HP or below, enemy is defeated instead

**Culling Strike** (3p)
- **Effect**: If attack reduces enemy below 1/5 maximum HP, enemy is defeated instead

**Splinter** (3p)
- **Effect**: Defeating enemy triggers another attack against new target before turn ends
- **Penalty**: -Tier to accuracy and damage
- **Chain Penalty**: Maximum Tier/2 additional attacks (rounded up)
- **Restriction**: Cannot apply to AOE attacks

### Enemy Type Bonuses

**Minion Slayer** (2p)
- **Effect**: +Tier to chosen roll type (choose Accuracy, Damage, or Conditions when purchasing)
- **Usage**: Bonus applies against 10 maximum HP enemies
- **Restriction**: Can only have 1 Slayer bonus per attack

**Captain Slayer** (2p)
- **Effect**: +Tier to chosen roll type (choose Accuracy, Damage, or Conditions when purchasing)
- **Usage**: Bonus applies against 25 maximum HP enemies
- **Restriction**: Can only have 1 Slayer bonus per attack

**Elite Slayer** (2p)
- **Effect**: +Tier to chosen roll type (choose Accuracy, Damage, or Conditions when purchasing)
- **Usage**: Bonus applies against 50 maximum HP enemies
- **Restriction**: Can only have 1 Slayer bonus per attack

**Boss Slayer** (2p)
- **Effect**: +Tier to chosen roll type (choose Accuracy, Damage, or Conditions when purchasing)
- **Usage**: Bonus applies against 100 maximum HP enemies
- **Restriction**: Can only have 1 Slayer bonus per attack

### Sustained Attack Upgrades

**Channeled** (3p)
- **Effect**: +Tier to Accuracy, Damage, and Condition rolls for each consecutive turn making the same channeled attack
- **Penalty**: -2×Tier to Accuracy, Damage, and Condition rolls
- **Usage**: If you don't make the channeled attack on a turn, you lose your bonus
- **Restriction**: This enhancement cannot give you more than 5×Tier bonus

### Utility Combat Upgrades



## LIMITS

### Random Activation Limits

**Unreliable 1** (2p)
- **Effect**: +Tier to Accuracy, Damage, and Conditions
- **Limit**: Roll d20, DC 5 to activate each turn

**Unreliable 2** (2p)
- **Effect**: +2×Tier to Accuracy, Damage, and Conditions
- **Limit**: Roll d20, DC 10 to activate each turn

**Unreliable 3** (1p)
- **Effect**: +5×Tier to Accuracy, Damage, and Conditions
- **Limit**: Must roll 15+ or attack fails

### Turn-Based Limits

**Quickdraw** (2p)
- **Effect**: +3×Tier to Accuracy, Damage, and Conditions
- **Limit**: First round of combat

**Patient** (3p)
- **Effect**: +2×Tier to Accuracy, Damage, and Conditions
- **Limit**: Turn 5 or later

**Finale** (2p)
- **Effect**: +3×Tier to Accuracy, Damage, and Conditions
- **Limit**: Turn 8 or later

**Charge Up** (1p)
- **Effect**: +2×Tier to Accuracy, Damage, and Conditions
- **Limit**: Spend an action on your previous turn

**Charge Up 2** (2p)
- **Effect**: +4×Tier to Accuracy, Damage, and Conditions
- **Limit**: Spend actions on your previous two turns

**Cooldown** (1p)
- **Effect**: +2×Tier to Accuracy, Damage, and Conditions
- **Limit**: Cannot use again for 3 turns after use

### HP-Based Limits

**Timid** (2p)
- **Effect**: +3×Tier to Accuracy, Damage, and Conditions
- **Limit**: At max HP with no conditions

**Near Death** (2p)
- **Effect**: +2×Tier to Accuracy, Damage, and Conditions
- **Limit**: At 25 Hit Points or less

**Bloodied** (1p)
- **Effect**: +Tier to Accuracy, Damage, and Conditions
- **Limit**: At 50 Hit Points or less

**Attrition** (3p)
- **Effect**: +2×Tier to Accuracy, Damage, and Conditions
- **Limit**: Each use costs 20 HP
- **Restriction**: Can't have regeneration, healing or any other ability that restores HP

**Charges 1** (1p)
- **Effect**: +5×Tier to Accuracy, Damage, and Conditions
- **Limit**: Single use, recharges after 1 minute rest

**Charges 2** (1p)
- **Effect**: +2×Tier to Accuracy, Damage, and Conditions
- **Limit**: 2 uses, recharges after 1 minute rest

### Conditional Limits

**Vengeful** (2p)
- **Effect**: +2×Tier to Accuracy, Damage, and Conditions
- **Limit**: Been hit since last turn

**Revenge** (3p)
- **Effect**: +2×Tier to Accuracy, Damage, and Conditions
- **Limit**: Been damaged since last turn

**Unbreakable** (1p)
- **Effect**: +4×Tier to Accuracy, Damage, and Conditions
- **Limit**: Been hit but took no damage since last turn

**Untouchable** (2p)
- **Effect**: +2×Tier to Accuracy, Damage, and Conditions
- **Limit**: All attacks missed since last turn, must have been attacked


**Passive** (2p)
- **Effect**: +3×Tier to Accuracy, Damage, and Conditions
- **Limit**: Not attacked since last turn

**Careful** (2p)
- **Effect**: +2×Tier to Accuracy, Damage, and Conditions
- **Limit**: Not damaged since last turn

### Sequential Action Limits

**Combo Move** (2p)
- **Effect**: +Tier to Accuracy, Damage, and Conditions
- **Limit**: Hit same enemy last turn

**Relentless** (2p)
- **Effect**: +Tier to Accuracy, Damage, and Conditions
- **Limit**: Dealt damage to enemy last turn

**Slaughter** (1p)
- **Effect**: +4×Tier to Accuracy, Damage, and Conditions
- **Limit**: Defeated enemy last turn




### Special Ability Limits





## COMPATIBILITY RULES

### Attack Type Restrictions

Some upgrades only work with specific attack types:

#### Direct Attack Restrictions

The following upgrades **cannot** be used with **direct attacks** (direct_damage, direct_area_damage) because they auto-hit and use flat damage:

**Accuracy Modifiers** (no accuracy roll):
- power_attack, accurate_attack, reliable_accuracy, overhit
- minion_slayer_acc, captain_slayer_acc, elite_slayer_acc, boss_slayer_acc

**Dice Modifiers** (flat damage, no dice):
- high_impact, critical_effect

**Critical Effects** (no accuracy rolls or crits):
- critical_accuracy, powerful_critical
- explosive_critical, double_tap, ricochet, splinter

**Special Mechanics**:
- armor_piercing (not needed for direct damage)
- combo_move (hit tracking incompatible)

#### AOE Restrictions

The following upgrades **cannot** be used with AOE attacks (area, direct_area_damage):

- double_tap
- explosive_critical
- ricochet
- splinter

### Mutual Exclusions

**Critical Effect Upgrades** (pick only one):
- double_tap ⊗ powerful_critical ⊗ explosive_critical ⊗ ricochet

**Unreliable Limits** (pick only one):
- unreliable_1 ⊗ unreliable_2 ⊗ unreliable_3

**Turn-Based Limits** (pick only one):
- quickdraw ⊗ patient ⊗ finale ⊗ cooldown

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
When using **area** or **direct_area_damage** or **direct_area_condition** attacks:
- All upgrade costs are **doubled**
- All limit costs are **doubled**

### Example
- Power Attack (1pt) on melee attack = 1 point
- Power Attack (1pt) on area attack = 2 points

