
### Attack Types
```python
ATTACK_TYPES = {
    'melee_ac': melee with +Tier accuracy bonus, adjacent only
    'melee_dg': melee with +Tier damage bonus, adjacent only
    'ranged': no bonuses
    'area': -Tier accuracy and damage penalty
    'direct_damage': flat (14-Tier) damage, no roll
    'direct_area_damage': flat (14-3×Tier) damage, no roll
}
```

### All Upgrades (with costs and mechanics)

#### Core Combat Upgrades
- **Power Attack** (10p): +Tier damage, -Tier accuracy
- **High Impact** (20p): Flat 15 damage instead of 3d6 roll
- **Critical Effect** (20p): Dice explode on 5-6 instead of just 6, -2 damage penalty
- **Armor Piercing** (20p): Ignore endurance portion of durability
- **Brutal** (20p): Extra damage when exceeding DR by 10+ (50% of excess)
- **Accurate Attack** (10p): +Tier accuracy, -Tier damage

#### Multi-Attack Upgrades
- **Quick Strikes** (40p): Attack 2 times (non-AOE attacks only), -Tier accuracy and damage per attack
- **Extra Attack** (40p): Make identical attack when hit + effect succeeds
- **Barrage** (60p): Chain attacks - hit + effect on each attack enables the next attack, up to 3 attacks total, -Tier accuracy and damage per attack (non-AOE attacks only)
- **Double Tap** (30p): Make identical attack on critical hit (15-20 with Critical Accuracy)

#### Condition & Effect Upgrades
- **Bleed** (20p): Target takes same damage for next 2 turns (replaces existing bleed)
- **Critical Accuracy** (20p): Critical hit on 15-20 instead of just 20
- **Powerful Critical** (20p): +Tier bonus to Damage and Condition rolls on critical hits (requires Critical Accuracy)
- **Reliable Accuracy** (20p): Roll with advantage, -3 penalty to all Accuracy rolls
- **Overhit** (30p): +1 damage per 2 points exceeding avoidance by 5+

#### Finishing Blow Upgrades
- **Finishing Blow**: If attack reduces enemy to (5 × rank) HP or below, enemy is defeated instead. Cannot apply to AOE attacks.
  - **Rank 1** (20p): ≤5 HP threshold
  - **Rank 2** (40p): ≤10 HP threshold
  - **Rank 3** (60p): ≤15 HP threshold

#### Slayer Upgrades
- **Minion Slayer** (20p): +Tier to chosen roll type vs targets ≤10 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Captain Slayer** (20p): +Tier to chosen roll type vs targets ≤25 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Elite Slayer** (20p): +Tier to chosen roll type vs targets ≤50 HP (choose Accuracy, Damage, or Conditions when purchasing)
- **Boss Slayer** (20p): +Tier to chosen roll type vs targets ≤100 HP (choose Accuracy, Damage, or Conditions when purchasing)

### Limits (Unreliable Upgrades)
- **Unreliable 1** (20p): +1×Tier to Accuracy and Damage, DC 5 activation
- **Unreliable 2** (20p): +3×Tier to Accuracy and Damage, DC 10 activation
- **Unreliable 3** (20p): +5×Tier to Accuracy and Damage, DC 15 activation - attack fails entirely on missed rolls


#### Turn-Based Limit Upgrades
- **Quickdraw** (20p): +2×Tier to Accuracy and Damage, turns 1-2 only
- **Steady** (20p): +1×Tier to Accuracy and Damage, turn 3 or later
- **Patient** (20p): +1×Tier to Accuracy and Damage, turn 5 or later
- **Finale** (10p): +3×Tier to Accuracy and Damage, turn 8 or later
- **Charge Up** (10p): +2×Tier to Accuracy and Damage, spend action on previous turn
- **Charge Up 2** (10p): +3×Tier to Accuracy and Damage, spend actions on previous two turns
