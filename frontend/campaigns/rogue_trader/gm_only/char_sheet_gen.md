# **The Complete Character Creation Guide: A Comprehensive Journey (Updated)**

## **The Foundation: Understanding the Problem Space**

We began with your Arc 2 plan for Fenris Tertius - a complex multi-faction conflict involving Necrons, Space Wolves, Grey Knights, and various beastmen tribes. You needed character sheets created in JSON format for about 15 different enemy types, ranging from basic infantry to elite commanders and vehicles. The key insight came when you said: "review my other characters to get a feel for your building style" - this established that character creation isn't arbitrary but follows consistent, learnable patterns.

## **Breakthrough #1: The Template Discovery**

By analyzing your existing character JSONs (Sister Inés, Vale, Primus, Purestrain Genestealers, Hormagaunts, Lightning Psyker, etc.), I identified 6 distinct character templates you consistently use:

### **Template 1: Basic Infantry**
- **Power Level**: Tier 3-4, 10-25 HP
- **Role**: Rank-and-file troops, cannon fodder, basic threats
- **Combat**: 1-2 simple attacks, moderate accuracy/damage
- **Defenses**: Basic survivability, relies on numbers rather than individual power
- **Special Abilities**: Minimal unique abilities, often just basic traits
- **Optimization**: Often uses "Peaked" or simple conditional traits for stat bonuses
- **Examples**: PDF troopers, basic cultists, tribal warriors

### **Template 2: Elite Infantry**
- **Power Level**: Tier 4-5, 25-50 HP  
- **Role**: Experienced soldiers, specialists, mid-tier threats
- **Combat**: 2-3 attacks with meaningful special modifiers
- **Defenses**: Good survivability in specialized areas
- **Special Abilities**: 1-2 significant unique abilities
- **Optimization**: Strategic use of flaws like "Balanced" to boost key stats
- **Examples**: Space Marine squads, elite cultists, veteran troops

### **Template 3: Heavy Elite/Monster**
- **Power Level**: Tier 5-6, 50-100 HP
- **Role**: Leaders, champions, major threats requiring coordination to defeat
- **Combat**: Multiple specialized attacks with extensive modifiers
- **Defenses**: High across the board or specialized resistances
- **Special Abilities**: Multiple unique abilities creating complex tactical challenges
- **Optimization**: Minimal flaws, relies on high base stats and expensive abilities
- **Examples**: Space Marine Captains, Chaos Champions, major xenos

### **Template 4: Psyker/Caster**
- **Power Level**: Variable tier, moderate HP
- **Role**: Battlefield control, condition application, support/disruption
- **Combat**: Direct/Ranged attacks focused on condition effects rather than raw damage
- **Defenses**: High mental resistances, moderate physical protection
- **Special Abilities**: Psyker abilities, condition-based effects, area control
- **Optimization**: Physical limitations accepted for mental/magical bonuses
- **Examples**: Chaos Sorcerers, Imperial Psykers, xenos mind-controllers

### **Template 5: Support/Specialist**
- **Power Level**: Mid-tier, moderate HP
- **Role**: Healing, utility, battlefield support, technical specialists
- **Combat**: Limited but effective attacks, not primary combat role
- **Defenses**: Good survivability but not front-line durability
- **Special Abilities**: Healing, utility abilities, expertise bonuses
- **Optimization**: Combat limitations accepted for utility bonuses
- **Examples**: Medics, tech-priests, support characters

### **Template 6: Vehicle/Construct**
- **Power Level**: High tier, 50+ HP
- **Role**: Heavy weapons platforms, mobile artillery, armored threats
- **Combat**: Multiple weapon systems, often heavy weapons with different roles
- **Defenses**: Excellent durability, may have special resistances or immunities
- **Special Abilities**: Vehicle-specific abilities like overwatch, targeting systems
- **Optimization**: Mobility or targeting limitations balanced against firepower
- **Examples**: Tanks, walkers, large constructs

**Critical Insight**: These templates aren't just guidelines - they represent fundamental tactical roles in your combat encounters. Each template fills a specific battlefield niche and has characteristic strengths/weaknesses that create interesting tactical decisions for players.

## **Breakthrough #2: The Archetype System Crisis and Resolution**

This was our most important learning experience. I repeatedly confused the different archetype categories, leading to the critical correction: **"Why do you keep putting effect type as direct???"**

### **The Seven Archetype Categories (COMPREHENSIVE)**

#### **1. MOVEMENT ARCHETYPES** - *How you move around the battlefield*
- **Swift**: Movement speed increased by half your Tier (rounded up)
  - **Tier 3-4**: +2 movement, **Tier 5-6**: +3 movement, etc.
  - **Use Case**: Fast skirmishers, scouts, hit-and-run specialists
- **Skirmisher**: No punish attacks for moving + +1 space melee reach
  - **Use Case**: Mobile fighters who weave through enemy lines
- **Behemoth**: Immune to Grabbed, Moved, Prone, Stunned
  - **Use Case**: Heavy units that maintain positioning regardless of enemy interference
- **Vanguard**: Enemies adjacent start turn with halved movement + punish attack movement
  - **Use Case**: Zone control specialists who lock down areas
- **Alternative Movement**: Flight, Teleportation, Portal, etc.
  - **Use Case**: Specialized movement for unique tactical roles
  - **Flight Example**: Anti-gravity vehicles, phase-shifting constructs

#### **2. ATTACK TYPE ARCHETYPES** - *How you deliver attacks*
- **Single Target**: Gain Melee AND Ranged attack types for 0p
  - **Most versatile combat approach** - can engage at any range
  - **Use Case**: 90% of characters - provides maximum tactical flexibility
- **AOE Specialist**: Gain AOE attack type for 0p
  - **Crowd control focus** - hits multiple enemies but weaker individual damage
  - **Use Case**: Swarm clearers, area denial, explosives specialists
- **Direct Specialist**: Gain Direct attack type for 0p
  - **Reliable delivery** - cannot be dodged, perfect for consistent effects
  - **Use Case**: Psykers, condition applicators, support characters
  - **CRITICAL**: Direct attacks ignore accuracy entirely - accuracy bonuses are useless

#### **3. EFFECT TYPE ARCHETYPES** - *What your attacks accomplish*
- **Damage Specialist**: Focus purely on dealing damage
  - **Maximum damage potential** against single targets
  - **Can still use Basic Conditions as separate attacks**
  - **Use Case**: 70% of combat characters - straightforward damage dealers
- **Hybrid Specialist**: All attacks MUST combine damage and conditions
  - **Mandatory Hybrid Attacks** - versatile but less powerful in each aspect
  - **Use Case**: Characters who need to do damage AND apply effects
  - **Technical**: Requires `"Hybrid": "2"` and `"RollCN": "3"` in JSON
- **Crowd Control**: Free access to 2 Advanced condition effects (chosen at selection)
  - **Trade-off**: -Tier to all Damage rolls
  - **Use Case**: Pure support/control characters, debuffers

#### **4. DEFENSIVE ARCHETYPES** - *How you survive*
- **Stalwart**: Subtract Tier from Avoidance Score + choose Physical OR Non-Physical half damage
  - **Use Case**: Tanks with damage type specialization
- **Fortress**: Add Tier again to Durability
  - **Use Case**: Most common - consistent protection against all damage
  - **INCOMPATIBILITY**: Cannot meaningfully stack with Shield unique ability
- **Resilient**: Add Tier to all three Secondary Resistances (Resolve, Stability, Vitality)
  - **Use Case**: Condition-resistant characters, chaos-corrupted beings
  - **COMPATIBILITY**: Works well with Regeneration
- **Immutable**: Choose one Secondary Resistance type for complete immunity
  - **Use Case**: Highly specialized defensive builds
- **Juggernaut**: Increase maximum Health Pool by 5 × Tier
  - **Use Case**: High-HP tanks, regenerating creatures
  - **CRITICAL INCOMPATIBILITY**: Cannot be combined with Regeneration ability

#### **5. SPECIAL ATTACK ARCHETYPES** - *How you develop unique combat abilities*
- **Normal**: Select 3 Specialty Upgrades at half cost + Limits provide Points × (Tier ÷ 6)
  - **Maximum customization flexibility**
- **Paragon**: Each special attack receives 10 × Tier points, cannot take Limits
  - **Consistent performance without drawbacks**
  - **Use Case**: Elite characters with reliable, powerful attacks
- **One Trick**: Single attack with Tier × 20 points, cannot take Limits
  - **High-risk, high-reward specialization**
  - **Use Case**: Specialists with one devastating ability
- **Dual-Natured**: Two distinct Special Attacks, each gets 15 × Tier points, cannot take Limits
  - **Balanced versatility**
  - **Use Case**: Most common for NPCs - provides tactical variety
- **Basic**: Tier × 10 points for base attack improvements only, no special attacks
  - **CRITICAL RULE**: Only use with Versatile Master unique ability
  - **Why**: Base attack improvements only shine with extra quick actions

#### **6. UNIQUE ABILITY ARCHETYPES** - *Special capabilities beyond standard actions*
- **Versatile Master**: Gain 2 Quick Actions per turn + convert Primary Actions to Quick Actions
  - **Use Case**: Characters who need to act frequently or use Basic special attacks
- **Extraordinary**: Additional points: (Tier - 2) × 15 added to main pool
  - **Restriction**: Can only spend up to (Tier - 2) × 15 points on Flaws or Traits
  - **Use Case**: Most common for NPCs - provides points for abilities and traits
- **Cut Above**: Universal stat bonuses to all core stats
  - **Tiers 1-4**: +1 to all, **Tiers 5-7**: +2 to all, **Tiers 8+**: +3 to all
  - **Use Case**: Straightforward characters who don't need special abilities
  - **OPTIMIZATION**: Often preferred over Extraordinary for vehicles/constructs

#### **7. UTILITY ARCHETYPES** - *Non-combat capabilities*
- **Practical**: Select 3 skills, add Tier twice to skill checks using those skills
  - **Use Case**: Player characters with specific skill focuses
- **Specialized**: Choose an Attribute, add Tier twice to skill checks using that Attribute
  - **Use Case**: Most common for NPCs - simple and effective
- **Jack of All Trades**: Add Tier once to all skill checks
  - **Use Case**: Versatile characters, leaders, generalists
  - **RESTRICTION**: Only use Jack of All Trades or Specialized for generated characters

### **Critical Archetype Combination Rules**
1. **Regeneration + Juggernaut**: Cannot be combined (learned through correction)
2. **Basic Special Attack**: Only use with Versatile Master (learned through correction)
3. **Effect Type**: Determines what attacks DO, not how they're delivered
4. **Attack Type**: Determines delivery method, not effect type
5. **Fortress + Shield**: Redundant/incompatible - don't stack defensive bonuses
6. **Direct Attacks + Accuracy**: Accuracy bonuses are useless for Direct attack builds

## **Breakthrough #3: Attack Modifier Rules and Restrictions (EXPANDED)**

Through multiple corrections, we discovered critical rules about attack modifiers:

### **Mandatory Pairings**
- **Double Tap**: Must always be paired with **Crit AC** (Critical Accuracy)
- **Powerful Critical**: Must always be paired with **Crit AC** (Critical Accuracy)
- **Explosive Critical**: Must be paired with **Crit AC**, but avoid in most contexts
- **Reasoning**: These abilities enhance critical hits, so you need the ability to crit more often

### **Incompatible Combinations**
- **High Impact**: Cannot be paired with **Critical Effect** or **Reliable Effect**
- **Enhanced Effect**: Cannot be paired with **High Impact**
- **Reasoning**: These represent different approaches to damage enhancement
- **Solution**: Choose one damage enhancement approach per attack

### **Valid Damage Enhancement Combinations**
- **Enhanced Effect + Reliable Effect + Critical Effect**: All compatible
- **High Impact + Armor Piercing + Brutal**: All compatible
- **Crit AC + Powerful Critical + Double Tap**: All compatible

### **Attack Type Classifications**
- **AttackType "0"**: Melee attacks
- **AttackType "1"**: AOE attacks  
- **AttackType "2"**: Ranged attacks
- **AttackType "3"**: Direct attacks

### **Effect Type Classifications**
- **EffectType "0"**: Pure damage
- **EffectType "4"**: Hybrid (damage + conditions)
- **EffectType "9"**: Pure conditions

### **Hybrid Attack Requirements**
- **Hybrid "2"**: Must specify **RollCN "3"** (roll for conditions)
- **Purpose**: Indicates the attack does both damage and applies conditions
- **Example**: Twin Tesla Cannon with electrical stun effects

## **Breakthrough #4: Point Allocation and Spending Patterns (UPDATED)**

### **Main Pool Calculation**
- **Formula**: (Tier - 2) × 15 points
- **Tier 3**: 15 points, **Tier 4**: 30 points, **Tier 5**: 45 points, **Tier 6**: 60 points

### **Extraordinary Bonus**
- **Additional Points**: Same as base main pool
- **Tier 3**: +15 points (30 total), **Tier 4**: +30 points (60 total), etc.

### **Common Spending Patterns**
- **Regeneration**: Always costs 60 points regardless of tier
- **Shield**: Variable cost, typically 60-90 points for meaningful protection
- **Traits**: Always cost 30 points each
- **Features**: DON'T MAKE THEM UP - stick to descriptions only

### **Regeneration Amounts by Tier**
- **Tiers 1-4**: 20 HP per turn
- **Tiers 5-6**: 30 HP per turn  
- **Tiers 7-8**: 40 HP per turn
- **Tiers 9-10**: 50 HP per turn

### **Critical Spending Rules**
1. **NEVER INVENT FEATURES NOT IN THE RULES** (most important lesson)
2. **It's okay to leave points unused** rather than force bad spending
3. **Shield points should be specified** in the unique ability description
4. **Regeneration + Resilient** is a strong defensive combination
5. **Cut Above** often better than Extraordinary for high-tier vehicles

### **Point Spending Optimization Patterns**
- **Basic Infantry (30-45 points)**: Usually Peaked trait + leftover points
- **Elite Infantry (60-90 points)**: Regeneration + Peaked, or Shield + abilities
- **Heavy Elite/Vehicles (120+ points)**: Regeneration + Cut Above, or multiple abilities

## **BREAKTHROUGH #5: The "STOP MAKING UP ABILITIES" Crisis**

**THIS WAS THE MOST CRITICAL CORRECTION IN THE ENTIRE PROCESS**

### **The Problem**
I repeatedly invented abilities that don't exist in the system:
- **"Wraith Form"** (made up completely)
- **"Fire Overwatch"** (not a real unique ability)
- **"Power Armor"** (not a feature in the rules)
- **"Astartes Physiology"** (completely invented)
- **"Living Metal"**, **"Mindless"** (not real features)
- **"Command Presence"** (sometimes real, sometimes made up)

### **The Corrections**
- **"WTF, stop making up abilities"**
- **"HOLY FUCK STOP MAKING UP ABILITIES"**
- **"FUCKING INSANE"**
- **"idk where you're getting this from, stop making shit up"**

### **The Real Abilities (VERIFIED)**
- **Regeneration**: Real ability, costs 60 points, HP amount varies by tier
- **Shield**: Real ability, variable cost, must specify what kind of protection
- **Invisibility**: Real ability (30 points)
- **Boost**: Real ability (60 points)
- **Base Summon**: Real ability system (10p per summon)

### **The Lesson**
- **ONLY USE ABILITIES EXPLICITLY MENTIONED IN THE RULES**
- **When in doubt, use Regeneration or Shield - they're always valid**
- **Features are for DESCRIPTIONS, not mechanical abilities**
- **Don't try to be creative - stick to the system**

### **Safe Fallback Pattern**
When you want special abilities but aren't sure what's legal:
1. **Regeneration** (60p) - always works, specify HP amount
2. **Shield** (60-90p) - always works, describe the protection type
3. **Cut Above** - simple stat bonuses, no special abilities needed
4. **Peaked Trait** - simple accuracy/damage bonus

## **Breakthrough #6: Technical JSON Requirements (EXPANDED)**

### **Calculated vs. Manual Fields**
**CRITICAL DISCOVERY**: "Changing these numbers doesn't do anything... you have to change the strings, the numbers are auto-calculated"

#### **Auto-Calculated Fields (Set to 0)**:
```json
"awarenessTotal": 0,
"communicationTotal": 0,
"intelligenceTotal": 0,
"focusTotal": 0,
"mobilityTotal": 0,
"enduranceTotal": 0,
"powerTotal": 0,
"char_avoidance": 0,
"char_durability": 0,
"char_resolve": 0,
"char_stability": 0,
"char_vitality": 0,
"char_accuracy": 0,
"char_damage": 0,
"char_conditions": 0,
"char_movement": 0,
"char_initiative": 0
```

#### **Manual Control Fields**:
```json
"char_focus": "3",           // Controls Focus attribute
"char_power": "4",           // Controls Power attribute  
"char_mobility": "2",        // Controls Mobility attribute
"char_endurance": "1",       // Controls Endurance attribute
"char_awareness": "2",       // Controls Awareness attribute
"char_communication": "0",   // Controls Communication attribute
"char_intelligence": "1",    // Controls Intelligence attribute
"char_tier": "5",           // Controls character tier
"char_hp": "50/50"          // Controls hit points
```

### **Primary Action Defaults**
**Default all to "off" unless specifically needed**:
```json
"char_avPrimaryAction": "off",
"char_drPrimaryAction": "off",
"char_rsPrimaryAction": "off",
"char_sbPrimaryAction": "off",
"char_vtPrimaryAction": "off",
"char_movementPrimaryAction": "off",
"char_acPrimaryAction": "off",
"char_dgPrimaryAction": "off",
"char_cnPrimaryAction": "off"
```

**Exception**: Turn "on" only for characters with specific quick action abilities:
- **Khorne Shaman**: `"char_cnPrimaryAction": "on"` (conditions quick action from Versatile Master)

### **ID Naming Conventions**
- **No underscores in repeating section IDs**: Use `-CHAOSAttack1` not `-CHAOS_Attack1`
- **Descriptive prefixes**: `-BJORNAttack1`, `-NECRONWARRIORSUnique1`
- **Consistent numbering**: Attack1, Attack2, Feature1, Feature2, etc.

### **Feature Descriptions**
**Always include `featuresDesc` field**:
```json
"features": {
  "-CHAOSFeature1": {
    "char_features": "Chaos Mutations",
    "featuresDesc": "Physical corruption grants enhanced strength and resilience"
  }
}
```

### **Hybrid Attack JSON Structure**
```json
{
  "AttackName": "Twin Tesla Cannon",
  "leftsub": "Ranged",
  "AttackType": "2",
  "RollCN": "3",           // Must be 3 for hybrid
  "EffectType": "4",       // Must be 4 for hybrid
  "Hybrid": "2",           // Must be 2 for hybrid
  "ConditionsStringModifiers": "Stun"  // Specify the condition
}
```

## **Breakthrough #7: Individual vs. Unit Design Philosophy**

**Critical Correction**: When I created "Lascannon Team" and "Lasgun Volley," you corrected: **"Each is just one guy making the attack, not teams. So just Lascannon is fine."**

### **Design Philosophy**
- **Individual Combatants**: NPCs represent single fighters, not abstract units
- **Tactical Flexibility**: Each character should have both ranged and melee options when possible
- **Personal Scale**: Combat is personal and tactical, not strategic unit management

### **Attack Naming Conventions**
- **Good**: "Lascannon", "Bolt Pistol", "Chainsword", "Feral Claws"
- **Bad**: "Lascannon Team", "Coordinated Volley", "Squad Tactics"

### **Equipment Approach**
- Characters have individual weapons and gear
- Attacks represent personal combat abilities
- Avoid team-based or coordinated attack names

## **Breakthrough #8: Trait and Ability Optimization Patterns (EXPANDED)**

### **Common Trait Patterns**
- **"Peaked"**: Most common, +Tier to chosen stat, cannot use Efforts
  - **Cost**: 30 points
  - **Use Case**: Simple stat boost for NPCs who don't need Efforts
  - **Stat Options**: Accuracy (most common), Avoidance, Damage, Conditions
- **Conditional Traits**: Bonus when specific conditions met
  - **"Pack Fighter"**: +Tier bonus when adjacent to allies
  - **"Pack Hunter"**: +Tier bonus vs isolated enemies, must have adjacent allies
  - **"Frenzy"**: +Tier bonus when below half HP or when enemy damaged

### **Ability Cost Standards**
- **Regeneration**: 60 points, amount varies by tier
- **Shield**: 60-90 points depending on protection level
- **Command Presence Aura**: 45 points for leadership abilities (when it exists)

### **Unique Ability Descriptions (MUST BE SPECIFIC)**
- **Regeneration**: "Regains X HP at start of each turn (Tier Y) - Living metal self-repair"
- **Shield**: "Power armor energy barriers and reinforced ceramite plating"
- **DON'T INVENT**: Stick to describing real mechanical effects

### **Vehicle/Construct Optimization Patterns**
- **High Tier (6+)**: Cut Above + Regeneration is often optimal
- **Defensive**: Fortress OR Resilient, not both with Shield
- **Movement**: Flight for anti-grav vehicles, Behemoth for heavy ground units
- **Weapons**: Always dual-natured for tactical variety

## **Breakthrough #9: Direct Attack Build Optimization**

### **Critical Insight**: Direct Attacks Don't Need Accuracy
- **Direct attacks cannot miss** - they automatically hit
- **Accuracy bonuses are completely wasted** on Direct attack builds
- **Focus bonuses should go to other stats** like Avoidance or Conditions
- **Peaked trait should target useful stats** not Accuracy

### **Direct Attack Archetype Optimization**
- **Attack Type**: Direct Specialist (0p for Direct attacks)
- **Traits**: Peaked with Avoidance bonus, not Accuracy
- **Attributes**: Lower Focus, higher Mobility for Avoidance
- **Unique Abilities**: Cut Above for universal bonuses

### **Direct Attack Examples Done Right**
- **Canoptek Wraiths**: Direct attacks + Peaked Avoidance bonus
- **Khorne Shaman**: Direct attacks + Peaked Conditions bonus
- **Phase/Psychic units**: Direct delivery + condition focus

## **Evolution of Understanding: Learning Through Iteration (UPDATED)**

### **Phase 1: Template Recognition**
- Started with random stat assignment
- Learned to identify consistent patterns in existing characters
- Developed template system for systematic character creation

### **Phase 2: Archetype Mastery**
- Initially confused different archetype categories
- Learned precise definitions and use cases for each archetype
- Discovered mandatory combinations and restrictions

### **Phase 3: Technical Precision**
- Understood JSON structure and calculation system
- Learned which fields to modify vs. which are auto-calculated
- Mastered ID conventions and structural requirements

### **Phase 4: Mechanical Optimization**
- Learned specific rules about attack modifier combinations
- Understood point costs and spending optimization
- Discovered restrictions like Regeneration + Juggernaut incompatibility

### **Phase 5: Design Philosophy**
- Understood individual vs. unit design approach
- Learned narrative consistency requirements
- Developed systematic approach to ability descriptions

### **Phase 6: The "Stop Making Up Abilities" Crisis**
- **Most important lesson**: Only use abilities that exist in the rules
- Learned to resist creative impulses and stick to system constraints
- Developed safe fallback patterns for when unsure

### **Phase 7: Advanced Build Optimization**
- Direct attack build optimization (accuracy is useless)
- Defensive archetype compatibility rules
- Point spending efficiency patterns
- Vehicle/construct specialization techniques

## **The Comprehensive Character Creation Process (UPDATED)**

### **Step 1: Template Identification**
1. **Determine Role**: What battlefield function does this character serve?
2. **Assign Template**: Basic Infantry, Elite Infantry, Heavy Elite, Psyker, Support, or Vehicle
3. **Set Stats**: Tier, HP, and attribute point allocation based on template

### **Step 2: Archetype Selection (Systematic Approach)**

#### **Movement Archetype** - *Based on tactical role*
- **Swift**: Fast skirmishers, scouts, mobile threats
- **Skirmisher**: Mobile fighters who weave through lines  
- **Behemoth**: Heavy units that hold ground
- **Vanguard**: Area control specialists
- **Flight**: Anti-gravity vehicles, phase-shifting units

#### **Attack Type Archetype** - *Based on engagement method*
- **Single Target**: 90% of characters - maximum flexibility
- **AOE Specialist**: Crowd control, swarm clearers
- **Direct Specialist**: Psykers, reliable effect delivery, phase attacks

#### **Effect Type Archetype** - *Based on combat goal*
- **Damage Specialist**: 70% of characters - straightforward damage
- **Hybrid Specialist**: Damage + conditions combined (vehicles with special weapons)
- **Crowd Control**: Pure condition application (-Tier to damage)

#### **Defensive Archetype** - *Based on survival method*
- **Fortress**: Most common - consistent protection (don't combine with Shield)
- **Resilient**: Condition resistance, chaos corruption (works with Regeneration)
- **Stalwart**: Specialized damage resistance
- **Juggernaut**: High HP tanks (NEVER with Regeneration)

#### **Special Attack Archetype** - *Based on complexity needs*
- **Dual-Natured**: Most common for NPCs - tactical variety
- **One Trick**: Specialists with signature abilities
- **Paragon**: Elite characters with reliable power
- **Basic**: Only with Versatile Master unique ability

#### **Unique Ability Archetype** - *Based on special needs*
- **Extraordinary**: Most common for NPCs - extra points for abilities
- **Cut Above**: Straightforward stat bonuses (great for vehicles)
- **Versatile Master**: Multiple actions, condition specialists

#### **Utility Archetype** - *Based on skill needs*
- **Specialized**: Most common for NPCs - simple and effective
- **Jack of All Trades**: Only use Jack or Specialized for generated characters

### **Step 3: Point Allocation and Spending (SAFE PATTERNS)**
1. **Calculate Main Pool**: (Tier - 2) × 15
2. **Add Extraordinary Bonus**: Same amount again if using Extraordinary
3. **Safe Major Purchases**: 
   - **Regeneration** (60p) - always legal, specify HP amount by tier
   - **Shield** (60-90p) - always legal, describe protection type
   - **Peaked Trait** (30p) - always legal, choose useful stat
4. **NEVER INVENT ABILITIES** - stick to confirmed legal options

### **Step 4: Attack Design (UPDATED RULES)**
1. **Choose Attack Types**: Usually one ranged, one melee for flexibility
2. **Select Modifiers**: Follow combination rules 
   - **Double Tap + Crit AC** (mandatory pairing)
   - **Enhanced Effect + Reliable Effect + Critical Effect** (compatible)
   - **High Impact + Armor Piercing + Brutal** (compatible)
   - **NEVER**: High Impact + Enhanced Effect
   - **NEVER**: High Impact + Critical Effect/Reliable Effect
3. **Direct Attack Builds**: Don't waste points on accuracy bonuses
4. **Name Appropriately**: Individual weapons, not team abilities

### **Step 5: Technical Implementation**
1. **Set Attributes**: Only modify base strings like `"char_focus": "3"`
2. **Leave Calculated Fields**: Set totals and derived stats to 0
3. **Configure Primary Actions**: Default to "off", enable only if needed
4. **Use Proper IDs**: No underscores, descriptive prefixes
5. **Add Descriptions**: Feature descriptions, ability details
6. **Hybrid Attacks**: Use proper JSON structure with RollCN "3", EffectType "4", Hybrid "2"

### **Step 6: Quality Assurance (EXPANDED)**
1. **Verify Template Consistency**: Stats match expected template pattern
2. **Check Archetype Logic**: Combinations make sense for character concept
3. **Validate Restrictions**: No incompatible combinations or invented features
4. **Test Narrative Fit**: Character makes sense in setting and role
5. **Ability Verification**: Are all abilities confirmed to exist in the rules?
6. **Point Efficiency**: Are points spent optimally or reasonably left unused?

## **Common Mistakes and How to Avoid Them (UPDATED)**

### **Making Up Abilities (MOST CRITICAL)**
- **Mistake**: Inventing features like "Power Armor", "Fire Overwatch", "Wraith Form"
- **Solution**: ONLY use confirmed abilities like Regeneration, Shield, real traits
- **Safe Pattern**: When in doubt, use Regeneration + Peaked trait

### **Archetype Confusion**
- **Mistake**: Mixing up Attack Type and Effect Type
- **Solution**: Attack Type = delivery method, Effect Type = what it accomplishes

### **Attack Modifier Violations**
- **Mistake**: High Impact + Enhanced Effect, Double Tap without Crit AC
- **Solution**: Learn mandatory pairings and incompatible combinations

### **Defensive Redundancy**
- **Mistake**: Fortress + Shield, Regeneration + Juggernaut
- **Solution**: Choose one primary defensive approach per character

### **Direct Attack Accuracy Waste**
- **Mistake**: Putting accuracy bonuses on Direct attack builds
- **Solution**: Direct attacks auto-hit, focus bonuses elsewhere

### **JSON Technical Errors**
- **Mistake**: Modifying calculated fields, using underscores in IDs
- **Solution**: Only modify base attribute strings, follow naming conventions

### **Template Inconsistencies**
- **Mistake**: Tier 3 character with 100 HP, Tier 6 character with 10 HP
- **Solution**: Follow template HP and stat guidelines consistently

## **Advanced Optimization Strategies (UPDATED)**

### **Point Efficiency**
- **Extraordinary + Regeneration + Peaked**: Most reliable combination
- **Cut Above + Regeneration**: Great for high-tier vehicles
- **It's okay to leave points unused** rather than invent bad abilities

### **Defensive Optimization**
- **Resilient + Regeneration**: Maximum survivability with condition resistance
- **Fortress + High HP**: Traditional tank approach
- **Stalwart + Specialized resistance**: Situational but powerful

### **Offensive Optimization**
- **Crit AC + Powerful Critical + Double Tap**: Maximum critical potential
- **Enhanced Effect + Reliable Effect**: Consistent damage
- **Hybrid Attacks**: Damage and conditions efficiently combined

### **Vehicle/Construct Patterns**
- **Movement**: Flight for anti-grav, Behemoth for heavy ground units
- **Defense**: Cut Above + Regeneration often optimal
- **Weapons**: Always dual-natured for tactical variety
- **Attributes**: High Power + Focus, moderate everything else

## **The Complete Reference Framework (FINAL)**

This guide captures not just the mechanical rules but the design philosophy, optimization patterns, and systematic approach needed to create characters that fit seamlessly into your established universe. Every rule learned through correction, every pattern discovered through analysis, and every optimization technique developed through iteration is documented here.

**The most critical lesson**: Character creation is systematic engineering following established patterns and verified abilities. NEVER INVENT ABILITIES - stick to confirmed options like Regeneration, Shield, and basic traits. When in doubt, use safe fallback patterns rather than creative solutions.

**Use this guide as both rulebook and emergency reference** - when facing uncertainty, return to the verified abilities, check the archetype combinations, follow the proven patterns, and resist the urge to invent new mechanics. Master these constraints, and you can create any character concept while maintaining mechanical consistency and narrative coherence.

**The key insight**: Creativity comes from clever combinations of existing elements, not from inventing new ones. Work within the system's constraints to achieve your design goals.