## Architecture and Core Systems

### Character System
- **Character class**: Represents both attackers and defenders with stats (focus, power, mobility, endurance, tier)
- **Derived stats**: Avoidance (5 + tier + mobility), Durability (tier + endurance)

### Combat Resolution
1. **Limit checks**: Roll d20 vs DC for unreliable upgrades
2. **Accuracy check**: 1d20 + tier + focus vs target avoidance (skipped for direct attacks)
3. **Damage calculation**: 3d6 + tier + power + modifiers - durability
4. **Special effects**: Exploding dice, flat damage, triple attacks, bleed, brutal
5. **Multi-target handling**: AOE attacks use shared damage dice but individual accuracy rolls per target

### Attack Build System
- **Attack Build class**: Combines attack type, upgrades, and limits
- **Cost validation**: Ensures builds stay within point budgets (60 points for Tier 3)
- **Modular upgrades**: Each upgrade modifies accuracy, damage, or adds special effects

### Key Game Mechanics Implemented
- **Exploding dice**: 6s explode normally, 5-6s explode with Critical Effect
- **Bleed condition**: Target takes same damage for 2 additional turns (replaces existing bleed)
- **Triple attacks**: Quick Strikes make 3 attacks with penalties
- **Armor Piercing**: Ignores endurance portion of durability, -Tier/2 accuracy penalty
- **Brutal**: Extra damage when exceeding DR by 10+ (50% of excess damage)
- **Critical hits**: Natural 20 or 15-20 with Critical Accuracy, on a critical hit, increase damage by tier
- **Advantage**: Reliable Accuracy grants advantage but with -4 accuracy penalty
- **Slayer bonuses**: Conditional accuracy/damage bonuses based on target HP thresholds

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

#### Core Combat Upgrades - COSTS UPDATED 2025-09-29
- **Power Attack** (10p): +Tier damage, -Tier accuracy
- **High Impact** (20p): Flat 15 damage instead of 3d6 roll
- **Critical Effect** (20p): Dice explode on 5-6 instead of just 6, -2 damage penalty
- **Armor Piercing** (60p): Ignore endurance portion of durability
- **Brutal** (40p): Extra damage when exceeding DR by 10+ (50% of excess)
- **Accurate Attack** (10p): +Tier accuracy, -Tier damage

#### Multi-Attack Upgrades - COSTS UPDATED 2025-09-29
- **Quick Strikes** (40p): Attack 2 times (non-AOE attacks only), -Tier accuracy and damage per attack
- **Extra Attack** (80p): Make identical attack when hit + effect succeeds
- **Barrage** (60p): Chain attacks - hit + effect on each attack enables the next attack, up to 3 attacks total, -Tier accuracy and damage per attack (non-AOE attacks only)
- **Double Tap** (60p): Make identical attack on critical hit (15-20 with Critical Accuracy)

#### Condition & Effect Upgrades - COSTS UPDATED 2025-09-29
- **Bleed** (60p): Target takes same damage for next 2 turns (replaces existing bleed)
- **Critical Accuracy** (20p): Critical hit on 15-20 instead of just 20
- **Powerful Critical** (40p): Critical hit on 15-20 instead of just 20; +Tier bonus to Damage and Condition rolls on critical hits
- **Double Tap** (60p): Critical hit on 15-20 instead of just 20; if crit, attack again, effect only occurs once.
- **Explosive Critical** (60p): Critical hit on 15-20 instead of just 20; on critical hit, attack triggers against all enemies in range, 2sp (AOE effect)
- **Reliable Accuracy** (20p): Roll with advantage, -3 penalty to all Accuracy rolls
- **Overhit** (40p): +1 damage per 2 points exceeding avoidance by 5+
- **Culling Strike** (20p): If target is at or below 1/5 of their maximum HP after attack, they are immediately defeated
- **Splinter** (80p): If this attack defeats an enemy, immediately make an identical attack against another target in range

#### Finishing Blow Upgrades - COSTS UPDATED 2025-09-29
- **Finishing Blow**: If attack reduces enemy to (5 × rank) HP or below, enemy is defeated instead. Cannot apply to AOE attacks.
  - **Rank 1** (20p): ≤5 HP threshold
  - **Rank 2** (40p): ≤10 HP threshold
  - **Rank 3** (80p): ≤15 HP threshold

#### Slayer Upgrades - COSTS UNCHANGED
- **Minion Slayer** (10p): +Tier to chosen roll type vs targets ≤10 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Captain Slayer** (10p): +Tier to chosen roll type vs targets ≤25 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Elite Slayer** (10p): +Tier to chosen roll type vs targets ≤50 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Boss Slayer** (10p): +Tier to chosen roll type vs targets ≤100 HP (choose Accuracy, Damage, or Conditions when purchasing)

### Limits (Unreliable Upgrades) - COSTS & MECHANICS UPDATED 2025-09-29
- **Unreliable 1** (40p): +1×Tier to Accuracy and Damage, DC 5 activation
- **Unreliable 2** (20p): +3×Tier to Accuracy and Damage, DC 10 activation (UNCHANGED)
- **Unreliable 3** (10p): +5×Tier to Accuracy and Damage, DC 15 activation - attack fails entirely on missed rolls (NOW CHEAPER!)


#### Turn-Based Limit Upgrades - COSTS & MECHANICS UPDATED 2025-09-29
- **Quickdraw** (40p): +2×Tier to Accuracy and Damage, turn 1 only (was turns 1-2)
- **Steady** (60p): +1×Tier to Accuracy and Damage, turn 3 or later
- **Patient** (40p): +1×Tier to Accuracy and Damage, turn 5 or later
- **Finale** (20p): +2×Tier to Accuracy and Damage, turn 7 or later (was turn 8+)
- **Charge Up** (40p): +2×Tier to Accuracy and Damage, spend action on previous turn
- **Charge Up 2** (40p): +4×Tier to Accuracy and Damage, spend actions on previous two turns (was +3×Tier)
- **Cooldown** (40p): +1×Tier to Accuracy and Damage, cannot be used again for 3 turns after activation




