## Architecture and Core Systems

### Character System
- **Character class**: Represents both attackers and defenders with stats (focus, power, mobility, endurance, tier)
- **Derived stats**: Avoidance (10 + tier + mobility), Durability (5 + tier + endurance)

### Combat Resolution
1. **Limit checks**: Roll d20 vs DC for unreliable upgrades
2. **Accuracy check**: 1d20 + tier + focus vs target avoidance (skipped for direct attacks)
3. **Damage calculation**: 3d6 + tier + power + modifiers - durability
4. **Special effects**: Exploding dice, flat damage, triple attacks, bleed, brutal
5. **Multi-target handling**: AOE attacks use shared damage dice but individual accuracy rolls per target

### Attack Build System
- **Attack Build class**: Combines attack type, upgrades, and limits
- **Cost validation**: Ensures builds stay within point budgets based on tier and archetype
- **Modular upgrades**: Each upgrade modifies accuracy, damage, or adds special effects

### Archetype Level System 
Point budgets per attack based on tier and archetype:

| Tier | Versatile Master | Dual Natured | Focused |
|------|---------|--------------|------------------|
| 3    | 2       | 4            | 6                |
| 4    | 4       | 6            | 8                |
| 5    | 6       | 8            | 10               |

- **Focused**: 1 attack, highest point budget
- **Dual Natured**: 2 attacks, moderate point budget per attack
- **Versatile Master**: 5 attacks, low point budget per attack

### Key Game Mechanics Implemented
- **Exploding dice**: 6s explode normally, 5-6s explode with Critical Effect
- **Critical hits**: Natural 20 or 15-20 with Critical Accuracy, on a critical hit, increase damage by tier

### Cost
- Area and Direct Area Damage attacks, upgrades cost double.

### Attack Types
```python
ATTACK_TYPES = {
    'melee_ac': melee with +Tier accuracy bonus, adjacent only
    'melee_dg': melee with +Tier damage bonus, adjacent only
    'ranged': no bonuses
    'area': -Tier accuracy and damage penalty
    'direct_damage': flat (15-Tier) damage, no roll
    'direct_area_damage': flat (15-2×Tier) damage, no roll
}
```

### All Upgrades (with costs and mechanics)

#### Core Combat Upgrades
- **Power Attack** (1p): +Tier damage, -Tier accuracy
- **High Impact** (2p): Flat 15 damage instead of 3d6 roll
- **Critical Effect** (1p): Dice explode on 5-6 instead of just 6, -2 damage penalty
- **Armor Piercing** (3p): Ignore endurance portion of durability
- **Brutal** (2p): Extra damage when exceeding DR by 10+ (50% of excess)
- **Accurate Attack** (1p): +Tier accuracy, -Tier damage

#### Multi-Attack Upgrades
- **Quick Strikes** (2p): Attack 2 times (non-AOE attacks only), -Tier accuracy and damage per attack
- **Extra Attack** (3p): Make identical attack when hit + effect succeeds
- **Barrage** (2p): Chain attacks - hit + effect on each attack enables the next attack, up to 3 attacks total, -Tier accuracy and damage per attack (non-AOE attacks only)

#### Condition & Effect Upgrades
- **Bleed** (3p): Target takes same damage for next 2 turns (replaces existing bleed)
- **Critical Accuracy** (1p): Critical hit on 15-20 instead of just 20
- **Powerful Critical** (2p): Critical hit on 15-20 instead of just 20; +Tier bonus to Damage and Condition rolls on critical hits
- **Double Tap** (3p): Critical hit on 15-20 instead of just 20; if crit, attack again, effect only occurs once.
- **Explosive Critical** (3p): Critical hit on 15-20 instead of just 20; on critical hit, attack triggers against all enemies in range (AOE Burst 2sp effect)
- **Reliable Accuracy** (1p): Roll with advantage, -3 penalty to all Accuracy rolls
- **Overhit** (2p): +1 damage per 2 points exceeding avoidance by 5+
- **Culling Strike** (1p): If target is at or below 1/5 of their maximum HP after attack, they are immediately defeated
- **Splinter** (4p): If this attack defeats an enemy, make the same attack with new rolls against another target in range (max Tier/2 rounded up follow-up attacks)

#### Finishing Blow Upgrades
- **Finishing Blow**: If attack reduces enemy to (5 × rank) HP or below, enemy is defeated instead. Cannot apply to AOE attacks.
  - **Rank 1** (1p): ≤5 HP threshold
  - **Rank 2** (2p): ≤10 HP threshold
  - **Rank 3** (4p): ≤15 HP threshold

#### Slayer Upgrades
- **Minion Slayer** (1p): +Tier to chosen roll type vs targets ≤10 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Captain Slayer** (1p): +Tier to chosen roll type vs targets ≤25 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Elite Slayer** (1p): +Tier to chosen roll type vs targets ≤50 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Boss Slayer** (1p): +Tier to chosen roll type vs targets ≤100 HP (choose Accuracy, Damage, or Conditions when purchasing)

#### New Upgrades
- **Ricochet** (1p): Critical hit on 15-20; on critical hit, make additional attack against different target within range (cannot combine with Double Tap/Powerful Critical/Explosive Critical)
- **Channeled** (2p): Starts at -2xTier penalty to Accuracy/Damage/Conditions, gains +Tier to Accuracy/Damage/Conditions per consecutive turn using same attack (max +5×Tier total), note: the attack does not need to hit, you just need to have used the attack. Resets if different attack is used.
- **Leech** (3p): Recover HP equal to half damage dealt, -Tier to Accuracy/Damage/Conditions

### Limits (Unreliable Upgrades)
- **Unreliable 1** (2p): +Tier to Accuracy and Damage, DC 5 activation
- **Unreliable 2** (3p): +3×Tier to Accuracy and Damage, DC 10 activation
- **Unreliable 3** (2p): +6×Tier to Accuracy and Damage, DC 15 activation - attack fails entirely on missed rolls


#### Turn-Based Limit Upgrades
- **Quickdraw** (2p): +3×Tier to Accuracy and Damage, turn 1 only
- **Patient** (4p): +1×Tier to Accuracy and Damage, turn 5 or later
- **Finale** (4p): +2×Tier to Accuracy and Damage, turn 8 or later
- **Charge Up** (4p): +3×Tier to Accuracy and Damage, spend action on previous turn
- **Charge Up 2** (4p): +5×Tier to Accuracy and Damage, spend actions on previous two turns
- **Cooldown** (1p): +3×Tier to Accuracy and Damage, cannot be used again for 3 turns after activation

#### HP-Based Limits
- **Charges 1** (1p): +5×Tier to Accuracy/Damage/Conditions, 1 use per rest (combat)
- **Charges 2** (2p): +2×Tier to Accuracy/Damage/Conditions, 2 uses per rest (combat)
- **Near Death** (3p): +2×Tier to Accuracy/Damage/Conditions, only at ≤25 HP
- **Bloodied** (3p): +Tier to Accuracy/Damage/Conditions, only at ≤50 HP
- **Timid** (1p): +2×Tier to Accuracy/Damage/Conditions, only at max HP (no damage taken)
- **Attrition** (2p): +2×Tier to Accuracy/Damage/Conditions, costs 20 HP per use
  *Mutually exclusive: Near Death, Bloodied, and Timid cannot be combined*

#### Turn-Tracking Limits
**Offensive State Limits** (mutually exclusive):
- **Slaughter** (2p): +5×Tier to Accuracy/Damage/Conditions, only if defeated enemy last turn
- **Relentless** (4p): +2×Tier to Accuracy/Damage/Conditions, only if dealt damage last turn
- **Combo Move** (4p): +Tier to Accuracy/Damage/Conditions, only if hit same target last turn

**Defensive State Limits** (mutually exclusive):
- **Revenge** (3p): +Tier to Accuracy/Damage/Conditions, only if took damage last turn
- **Vengeful** (4p): +Tier to Accuracy/Damage/Conditions, only if was hit last turn
- **Untouchable** (2p): +2×Tier to Accuracy/Damage/Conditions, only if all enemy attacks missed last turn
- **Unbreakable** (1p): +4×Tier to Accuracy/Damage/Conditions, only if was hit but took no damage last turn
- **Passive** (2p): +2×Tier to Accuracy/Damage/Conditions, only if not attacked last turn
- **Careful** (3p): +2×Tier to Accuracy/Damage/Conditions, only if took no damage last turn




