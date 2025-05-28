# VITALITY SYSTEM RULES DICTIONARY
*Developer Implementation Reference*

## CORE MECHANICS

### Dice Rolling
- **D20 Rolls**: Accuracy, Conditions, Skill Checks vs NPCs
- **3D6 Rolls**: Damage, Skill Checks
- **Natural 20 on d20**: Auto-success + add Tier again to Damage/Condition rolls
- **6 on d6**: Roll additional d6 and add to total (exploding dice)

### Tier System
- **Range**: 0-10 (0=civilian, 5=professional, 10=world-class)
- **Effects**: Bonus to all actions, max attribute ranks, point pools, reduces randomness

### Combat Resolution Sequence
1. **Accuracy Check**: 1d20 + Tier + Focus vs Avoidance
2. **Effect Roll**: 
   - Damage: 3d6 + Tier + (Power × 1.5) vs Durability
   - Condition: 1d20 + (Tier × 2) vs appropriate Resistance
3. **Apply Results**: Reduce HP or apply condition effect

---

## ATTACK TYPES

### Base Attack Types
- **Melee**: Adjacent targets only, add Tier to either Accuracy OR Damage/Condition (chosen at creation)
- **Ranged**: Up to 15sp, -Tier Accuracy if adjacent to hostile
- **Direct**: Auto-hit within 30sp, Condition rolls only, -Tier to Effect rolls
- **AOE**: Hits area (3sp radius/6sp cone/12sp line), -Tier to Accuracy rolls

### Attack Type Modifiers
- **Hybrid**: Apply Condition AND Damage, -Tier to both rolls
- **Extended Range**: Ranged 15sp→30sp
- **Long Range**: Ranged 15sp→100sp  
- **Precise (AOE)**: Select who is affected
- **Enhanced Scale (AOE)**: Double area size
- **Ranged (AOE)**: Originate from designated point

---

## CONDITIONS SYSTEM

### Basic Conditions
**Duration**: Until end of next turn (unless specified)

#### Stability Conditions
- **Disarm**: Drop held item, can launch (Condition roll - Resistance) spaces
- **Grab**: Cannot move unless dragging grabber, contested Capacity to break/drag
- **Shove**: Push/pull (Condition roll - Resistance) spaces, 5 spaces = Prone
- **Prone**: Adjacent attacks +5 Accuracy, Ranged attacks -5 Accuracy, costs 3 Movement to stand

#### Vitality Conditions  
- **Blind**: Treat all others as Hidden, Hidden attackers ignore base Tier Avoidance bonus
- **Daze**: Lose Quick Actions and Reactions

#### Resolve Conditions
- **Misdirect**: Cannot attack the caster
- **Setup**: Next Accuracy roll vs target gains double Tier bonus
- **Taunt**: -2×Tier Accuracy against anyone except caster

### Advanced Conditions
**Acquisition Cost**: 15p-40p for Normal/Special Attacks
**Permanence Rule**: When defeating affected enemy, can make condition permanent (8 hours)

#### Advanced Condition Effects
- **Control (40p)**: Take over target's next turn completely
- **Capture (25p)**: Prevent all movement, Avoidance reduced to 10
- **Weaken (15p)**: Reduce chosen stat by Tier (Accuracy/Damage/Conditions/Avoidance/Durability/Resistances)
- **Stun (30p)**: No actions, Avoidance = 0, all attacks auto-hit and crit
- **Disable Specials (15p)**: Cannot use Special Attacks
  - **Mimic (+15p)**: Gain use of disabled Special Attacks
- **Frighten (15p)**: Move away, defensive actions only
- **Enthrall (15p)**: Must defend caster
- **Frenzy (15p)**: Attack nearest character randomly

---

## UPGRADE SYSTEM

### Accuracy Upgrades

#### Core Accuracy Bonuses
- **Accurate Attack (10p)**: +Tier Accuracy, -Tier Damage/Condition
- **Reliable Accuracy (20p)**: Advantage on attack rolls, -4 to attack rolls
- **Overhit (30p)**: When Accuracy exceeds Avoidance by 5+, add half difference to Effect roll

#### Critical Hit System
- **Base Critical**: Natural 20 on d20
- **Critical Accuracy (30p)**: Crit on 15+ (no AOE)
- **Powerful Critical (20p)**: Add Tier again to Effect roll on crit
- **Critical Effect (50p)**: Effect dice explode on 5-6

#### Secondary Attack Triggers
- **Ricochet (20p)**: Crit allows attack vs another target in range
- **Double-Tap (30p)**: Crit allows same attack again  
- **Explosive Critical (40p)**: Crit hits all enemies within 3sp (no AOE)
- **Blitz (20p)**: +1 Accuracy per 6 spaces moved toward target

### Damage Upgrades

#### Core Damage Bonuses
- **Power Attack (10p)**: +Tier Damage, -Tier Accuracy
- **High Impact (20p)**: Deal flat 15 instead of 3d6
- **Enhanced Effect (50p)**: Gain extra damage die

#### Dice Manipulation
- **Reliable Effect (10p)**: Roll extra die, drop lowest (no Superior Effect)
- **Superior Effect (60p)**: Roll 3 extra dice, drop lowest (no Reliable Effect)
- **Consistent Effect (20p)**: Reroll 1s on damage dice (no Superior Effect)

#### Armor/Defense Bypassing
- **Armor Piercing (30p)**: -Tier Attack Roll, ignore target's DR Endurance bonus
- **Brutal (40p)**: When Damage > Durability by 10+, deal half difference as extra damage
- **Shatter (20p)**: Double damage to structures/vehicles

#### Damage Over Time & Area
- **Bleed (50p)**: Target takes same damage at end of next 2 turns
- **Splash Damage (20p)**: Adjacent targets take Tier+1d6 if attack roll hits them
- **Environmental (50p)**: Hit hexes become hazardous, deal Damage/Condition to entrants

#### Instant Defeat Mechanics
- **Finishing Blow (20p/x)**: If attack brings enemy to 5×x HP or below, defeat instead (max 3x, no AOE)
- **Culling Strike (20p)**: If attack brings enemy below 1/5 max HP, defeat instead (no AOE)
- **Leech (80p)**: Regain HP = half damage dealt (no AOE)

### Condition Upgrades

#### Condition Enhancement
- **Critical Condition (30p)**: Condition crits on 15+ (no AOE)
- **Lasting Condition (20p)**: If Condition roll exceeds Resistance by 10, lasts extra turn
- **Mass Effect (60p)**: Single Direct attack vs multiple targets (up to Tier), -Tier Condition roll

#### Condition Spreading
- **Collateral Condition (60p)**: Success triggers attack vs all targets in 3sp Burst (no AOE, once only)
- **Contagious (40p)**: Success triggers attack vs nearest enemy (Tier/2 times, no AOE)

#### Permanence Effects
- **Cursed (30p)**: If 2×(roll-defense) ≥ enemy remaining HP, condition permanent
- **Overwhelming Affliction (40p)**: If roll exceeds defense by 3×Tier, permanent regardless of HP

### Specialized Combat Upgrades

#### Melee Specialization
- **Heavy Strike (40p)**: Use all Movement + Quick Action to charge, +3×Tier Damage/Condition, -Tier Accuracy
- **Quick Strikes (40p)**: Use all Movement + Quick Action to charge, attack 3 times vs single target, -Tier Accuracy  
- **Whirlwind Strike (30p)**: Single attack vs multiple targets (up to Tier), -Tier Accuracy

#### Ranged Specialization
- **Headshot (60p)**: Use all Movement + Quick Action to charge, +3×Tier Damage/Condition, -Tier Accuracy
- **Barrage (60p)**: Use all Movement + Quick Action to charge, attack 3 times vs single target, -Tier Accuracy
- **Scatter Shot (60p)**: Single attack vs multiple targets (up to Tier), -Tier Accuracy

#### Universal Combat
- **Flurry of Blows (40p)**: Attack 3 times vs single target, -Tier to all rolls
- **Pounce (20p)**: Move 6 spaces straight toward target as part of attack
- **Splinter (40p)**: Defeat triggers another attack, chain up to half Tier times (no AOE)

#### Tactical & Environmental
- **Menacing (30p)**: Defeating enemy intimidates all within 3sp, surrender if HP ≤ Intimidation bonus
- **Disengage (30p)**: Hit prevents opportunity attacks from hit targets until end of turn

#### Counter-Attack System
- **Follow-Up Strike (30p)**: Hit + successful effect allows Base Attack vs same target (once per turn)
- **Counterattack (40p)**: Using vs target that missed/failed effect adds Tier to chosen roll
- **Analyzing Strike (20p)**: +1 to chosen roll per previous Analyzing Strike vs target (max Tier, resets if skip turn)

#### Target Marking & Exploitation  
- **Priority Target (20p)**: Hit marks target, others gain half Tier to Accuracy vs marked target until your next turn (once per turn)
- **Exploit (40p)**: +Tier Effect rolls vs targets with Conditions
- **Bully (10p)**: Damage target of your Power or less, move them 1 space
- **Martial Artist (20p)**: Crit allows Grab, 3-space move, or Prone
- **Grappler (30p)**: +Tier damage vs Grabbed targets

### Variable Bonus Upgrades

#### Enemy Type Bonuses (20p each)
Apply chosen bonus (Accuracy/Damage/Condition) when attacking:
- **Minion Slayer**: vs 10 max HP enemies
- **Captain Slayer**: vs 25 max HP enemies  
- **Elite Slayer**: vs 50 max HP enemies
- **Boss Slayer**: vs 100 max HP enemies

#### Situational Bonuses
- **Lucky Strike (20p)**: Extra die when using Luck on this attack
- **Compressed Release (20p)**: Disable Aura until next turn, +Tier Accuracy/Effects
- **Domain (30p)**: +Tier to chosen roll when attacking target within your Barrier
- **Tower Defense (30p)**: +Tier to chosen roll when attacking target on opposite side of your Wall

#### Sustained Attack Systems
- **Channeled (40p)**: Continue spending Primary Action + Movement to repeat Ranged/AOE attack, +1 Tier per turn (max 5)
- **Focused (20p)**: Continue spending Primary Action + Movement to repeat Melee attack, +1 Tier per turn (max 5)
- **Extra Attack (60p)**: Hit + successful effect allows repeat vs same target

---

## LIMIT SYSTEM

### Resource Management Limits
- **Reload (20p)**: Requires action before reuse
- **Stockpile (40p)**: Must use action previous turn to charge
  - **+Rooted (10p)**: Can't move between charge and release
  - **+Concentration (20p)**: Damage/conditions lose charge
- **Cooldown 2/3 (20p/30p)**: Unusable for 2/3 turns after use
- **Reserves 1/2/3 (40p/20p/10p)**: Usable 1/2/3 times per combat

### Conditional Limits
- **Movement Requirements**: Charger (10p), Slowed (10p)
- **Health States**: Vulture (30p), Unhealthy (30p), Healthy (20p), Timid (50p)
- **Combat States**: Focused (30p), Rooted (20p), various positional requirements
- **Sequential Requirements**: Combo chains, Relentless chains, etc.

### Reliability Limits
- **Unreliable X (varies)**: Roll d20, fail if under X (5=20p, 10=40p, 15=80p, 20=200p)
- **Equipment (6p)**: Requires specific item, +2p discount per shared item, +1p if noticeable


---

## ARCHETYPES SUMMARY

### Attack Type Archetypes
- **AOE Specialist**: Free AOE attack type
- **Direct Specialist**: Free Direct attack type  
- **Single Target**: Free Melee + Ranged attack types

### Effect Type Archetypes
- **Damage**: Focus on damage, Basic Conditions as separate attacks
- **Hybrid**: All attacks must be Hybrid (Damage + Condition)
- **Crowd Control**: Free 2 Advanced conditions, -Tier to all Damage

### Special Attack Archetypes
- **Normal**: 3 Specialty Upgrades at half cost, Limits = Points × (Tier/6)
- **Specialist**: Choose 3 Limits for all attacks, Limits = Points × (Tier/3)
- **Paragon**: 10×Tier points per attack, no Limits
- **One Trick**: Single attack with Tier×20 points, no Limits
- **Straightforward**: Single Limit for all attacks, Points × (Tier/2)
- **Shared Uses**: 10 uses shared among attacks, 1-3 cost each, Tier×5 discount per use, Regenrate 1 Use Per Turn
- **Dual-Natured**: 2 attacks with 15×Tier points each, no Limits
- **Basic**: Tier×10 points for base attack improvements only

---

This dictionary provides the mechanical foundation for implementing all 60+ upgrades across the Excel→HTML→ScriptCards→Python pipeline. Each section focuses on functional effects and interactions needed for development rather than point costs or narrative descriptions.