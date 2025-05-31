Based on my analysis of the rulebook.md and your clarifications, I can see the fundamental issues with the current character builder. Let me outline a proper architecture redesign that correctly implements the Vitality System rules.

## Character Creation Flow Analysis

### Correct Order of Operations:

1. **Basic Info** (Name, Tier)
2. **Choose 7 Archetypes** (affects all subsequent calculations)
3. **Assign Attributes** (using appropriate point pools)
4. **Main Pool Purchases** (Boons, Traits, Flaws)
5. **Special Attacks** (Limits → Points → Upgrades)
6. **Utility Purchases** (Expertise, Features, Senses, Descriptors)

## Architecture Redesign

### Core Data Structure
```javascript
class VitalityCharacter {
    constructor() {
        this.basicInfo = {
            name: "",
            realName: "",
            tier: 4
        };
        
        this.archetypes = {
            movement: null,
            attackType: null,
            effectType: null,
            uniqueAbility: null,
            defensive: null,
            specialAttack: null,
            utility: null
        };
        
        this.attributes = {
            // Combat (max: Tier)
            focus: 0,
            mobility: 0,
            power: 0,
            endurance: 0,
            // Utility (max: Tier)
            awareness: 0,
            communication: 0,
            intelligence: 0
        };
        
        this.mainPoolPurchases = {
            boons: [],      // Various costs
            traits: [],     // 30p each, +Tier to 2 stats conditionally
            flaws: [],      // Give 30p each, impose restrictions
            primaryActionUpgrades: [] // 30p to make Primary Quick
        };
        
        this.specialAttacks = [
            // Each special attack has its own limits and upgrades
            {
                name: "",
                attackType: "",  // From archetype or purchased
                effectType: "",  // From archetype or purchased
                limits: [],      // Generate points for THIS attack
                upgrades: [],    // Purchased with points from limits
                totalLimitPoints: 0,
                upgradePointsAvailable: 0
            }
        ];
        
        this.utilityPurchases = {
            expertise: {
                activities: [],    // 2p basic, 6p mastered
                situational: []    // 1p basic, 3p mastered
            },
            features: [],         // 1p/3p/5p/10p
            senses: [],          // 1p/3p/5p/10p
            descriptors: []      // 5p/10p
        };
        
        // Calculated values
        this.calculatedStats = {};
        this.pointPools = {};
    }
}
```

### Point Pool Calculation Service

```javascript
class PointPoolCalculator {
    static calculatePools(character) {
        const tier = character.basicInfo.tier;
        const archetypes = character.archetypes;
        
        let pools = {
            // Base calculations
            combatAttributes: tier * 2,
            utilityAttributes: tier,
            main: Math.max(0, (tier - 2) * 15),
            utility: this.calculateUtilityPool(tier, archetypes.utility),
            
            // Special attacks handled differently
            specialAttackBase: this.getSpecialAttackBase(tier, archetypes.specialAttack)
        };
        
        // Apply archetype modifiers
        if (archetypes.uniqueAbility === 'extraordinary') {
            pools.main += Math.max(0, (tier - 2) * 15); // Double main pool
        }
        
        return pools;
    }
    
    static calculateUtilityPool(tier, utilityArchetype) {
        switch(utilityArchetype) {
            case 'specialized':
            case 'jackOfAllTrades':
                return 5 * Math.max(1, tier - 2);
            case 'practical':
            default:
                return 5 * Math.max(1, tier - 1);
        }
    }
    
    static getSpecialAttackBase(tier, specialAttackArchetype) {
        // This is just the BASE - actual points come from limits
        switch(specialAttackArchetype) {
            case 'normal':
                return 'limits'; // Points × (Tier ÷ 6)
            case 'specialist':
                return 'limits'; // Points × (Tier ÷ 3)
            case 'paragon':
                return tier * 10; // No limits allowed
            case 'oneTrick':
                return tier * 20; // No limits allowed
            case 'straightforward':
                return 'limits'; // Points × (Tier ÷ 2)
            case 'sharedUses':
                return 'special'; // Complex calculation
            case 'dualNatured':
                return tier * 15; // Per attack, 2 attacks
            case 'basic':
                return tier * 10; // For base attack only
            default:
                return 'limits';
        }
    }
}
```

### Limit Point Calculator

```javascript
class LimitPointCalculator {
    static calculatePointsFromLimits(limitPoints, tier, specialAttackArchetype) {
        // Apply scaling formula
        let upgradePoints = 0;
        
        const firstTier = tier * 10;
        const secondTier = tier * 20;
        
        if (limitPoints <= firstTier) {
            upgradePoints = limitPoints;
        } else if (limitPoints <= firstTier + secondTier) {
            upgradePoints = firstTier + (limitPoints - firstTier) * 0.5;
        } else {
            upgradePoints = firstTier + secondTier * 0.5 + (limitPoints - firstTier - secondTier) * 0.25;
        }
        
        // Apply archetype multiplier
        switch(specialAttackArchetype) {
            case 'normal':
                return upgradePoints * (tier / 6);
            case 'specialist':
                return upgradePoints * (tier / 3);
            case 'straightforward':
                return upgradePoints * (tier / 2);
            default:
                return upgradePoints;
        }
    }
}
```

### Character Builder Flow Components

```javascript
class CharacterBuilderFlow {
    constructor() {
        this.currentStep = 1;
        this.character = new VitalityCharacter();
        this.validators = new ValidationService();
    }
    
    // Step 1: Basic Info
    setBasicInfo(name, realName, tier) {
        this.character.basicInfo = { name, realName, tier };
        this.recalculateAllPools();
    }
    
    // Step 2: Archetypes (MUST be before attributes)
    selectArchetype(category, archetypeId) {
        this.character.archetypes[category] = archetypeId;
        this.recalculateAllPools();
        this.applyArchetypeEffects(category, archetypeId);
    }
    
    // Step 3: Attributes
    assignAttribute(attribute, value) {
        const max = this.character.basicInfo.tier;
        if (value <= max) {
            this.character.attributes[attribute] = value;
            this.updateSpentPoints();
        }
    }
    
    // Step 4: Main Pool Purchases
    purchaseFromMainPool(type, itemId) {
        const cost = this.getItemCost(type, itemId);
        const available = this.getAvailableMainPoints();
        
        if (type === 'flaws') {
            // Flaws GIVE points
            this.character.mainPoolPurchases.flaws.push(itemId);
            this.updateSpentPoints();
        } else if (cost <= available) {
            this.character.mainPoolPurchases[type].push(itemId);
            this.updateSpentPoints();
        }
    }
    
    // Step 5: Special Attacks (each with own limits)
    createSpecialAttack() {
        const archetype = this.character.archetypes.specialAttack;
        
        // Check if archetype allows special attacks
        if (archetype === 'basic') return; // No special attacks
        
        const attack = {
            name: "",
            attackType: this.getDefaultAttackType(),
            effectType: this.getDefaultEffectType(),
            limits: [],
            upgrades: [],
            totalLimitPoints: 0,
            upgradePointsAvailable: 0
        };
        
        this.character.specialAttacks.push(attack);
    }
    
    addLimitToAttack(attackIndex, limitId) {
        const attack = this.character.specialAttacks[attackIndex];
        const archetype = this.character.archetypes.specialAttack;
        
        // Check if archetype allows limits
        if (['paragon', 'oneTrick', 'dualNatured', 'basic'].includes(archetype)) {
            return; // These archetypes don't use limits
        }
        
        attack.limits.push(limitId);
        this.recalculateAttackPoints(attackIndex);
    }
    
    // Step 6: Utility Purchases
    purchaseUtility(category, itemId, level = 'basic') {
        const cost = this.getUtilityCost(category, itemId, level);
        const available = this.getAvailableUtilityPoints();
        
        if (cost <= available) {
            if (category === 'expertise') {
                this.character.utilityPurchases.expertise[level].push(itemId);
            } else {
                this.character.utilityPurchases[category].push(itemId);
            }
            this.updateSpentPoints();
        }
    }
}
```

### Key Architecture Improvements

1. **Separated Concerns**
   - Each point pool has its own calculation logic
   - Limits are per-special-attack, not global
   - Traits (abilities) vs trait bonuses (from limits) are clearly separated

2. **Correct Flow Enforcement**
   - Archetypes must be selected before attributes
   - Special attacks are created individually with their own limits
   - Point calculations update dynamically based on choices

3. **Archetype-Aware Calculations**
   - Special attack archetypes properly modify point calculations
   - Unique ability archetypes modify main pool
   - Utility archetypes modify utility pool

4. **Proper Limit System**
   - Limits apply per special attack
   - Point scaling formula correctly implemented
   - Archetype multipliers properly applied

5. **Clear Separation of Concepts**
   - Traits (30p abilities) vs Trait Bonuses (from limits)
   - Flaws give points vs everything else costs points
   - Attack/Effect types from archetypes vs purchased

Would you like me to detail any specific part of this architecture or help implement the validation rules?












Based on my analysis of the rulebook.md and your clarifications, I can see the fundamental issues with the current character builder. Let me outline a proper architecture redesign that correctly implements the Vitality System rules.

## Character Creation Flow Analysis

### Correct Order of Operations:

1. **Basic Info** (Name, Tier)
2. **Choose 7 Archetypes** (affects all subsequent calculations)
3. **Assign Attributes** (using appropriate point pools)
4. **Main Pool Purchases** (Boons, Traits, Flaws)
5. **Special Attacks** (Limits → Points → Upgrades)
6. **Utility Purchases** (Expertise, Features, Senses, Descriptors)

## Architecture Redesign

### Core Data Structure
```javascript
class VitalityCharacter {
    constructor() {
        this.basicInfo = {
            name: "",
            realName: "",
            tier: 4
        };
        
        this.archetypes = {
            movement: null,
            attackType: null,
            effectType: null,
            uniqueAbility: null,
            defensive: null,
            specialAttack: null,
            utility: null
        };
        
        this.attributes = {
            // Combat (max: Tier)
            focus: 0,
            mobility: 0,
            power: 0,
            endurance: 0,
            // Utility (max: Tier)
            awareness: 0,
            communication: 0,
            intelligence: 0
        };
        
        this.mainPoolPurchases = {
            boons: [],      // Various costs
            traits: [],     // 30p each, +Tier to 2 stats conditionally
            flaws: [],      // Give 30p each, impose restrictions
            primaryActionUpgrades: [] // 30p to make Primary Quick
        };
        
        this.specialAttacks = [
            // Each special attack has its own limits and upgrades
            {
                name: "",
                attackType: "",  // From archetype or purchased
                effectType: "",  // From archetype or purchased
                limits: [],      // Generate points for THIS attack
                upgrades: [],    // Purchased with points from limits
                totalLimitPoints: 0,
                upgradePointsAvailable: 0
            }
        ];
        
        this.utilityPurchases = {
            expertise: {
                activities: [],    // 2p basic, 6p mastered
                situational: []    // 1p basic, 3p mastered
            },
            features: [],         // 1p/3p/5p/10p
            senses: [],          // 1p/3p/5p/10p
            descriptors: []      // 5p/10p
        };
        
        // Calculated values
        this.calculatedStats = {};
        this.pointPools = {};
    }
}
```

### Point Pool Calculation Service

```javascript
class PointPoolCalculator {
    static calculatePools(character) {
        const tier = character.basicInfo.tier;
        const archetypes = character.archetypes;
        
        let pools = {
            // Base calculations
            combatAttributes: tier * 2,
            utilityAttributes: tier,
            main: Math.max(0, (tier - 2) * 15),
            utility: this.calculateUtilityPool(tier, archetypes.utility),
            
            // Special attacks handled differently
            specialAttackBase: this.getSpecialAttackBase(tier, archetypes.specialAttack)
        };
        
        // Apply archetype modifiers
        if (archetypes.uniqueAbility === 'extraordinary') {
            pools.main += Math.max(0, (tier - 2) * 15); // Double main pool
        }
        
        return pools;
    }
    
    static calculateUtilityPool(tier, utilityArchetype) {
        switch(utilityArchetype) {
            case 'specialized':
            case 'jackOfAllTrades':
                return 5 * Math.max(1, tier - 2);
            case 'practical':
            default:
                return 5 * Math.max(1, tier - 1);
        }
    }
    
    static getSpecialAttackBase(tier, specialAttackArchetype) {
        // This is just the BASE - actual points come from limits
        switch(specialAttackArchetype) {
            case 'normal':
                return 'limits'; // Points × (Tier ÷ 6)
            case 'specialist':
                return 'limits'; // Points × (Tier ÷ 3)
            case 'paragon':
                return tier * 10; // No limits allowed
            case 'oneTrick':
                return tier * 20; // No limits allowed
            case 'straightforward':
                return 'limits'; // Points × (Tier ÷ 2)
            case 'sharedUses':
                return 'special'; // Complex calculation
            case 'dualNatured':
                return tier * 15; // Per attack, 2 attacks
            case 'basic':
                return tier * 10; // For base attack only
            default:
                return 'limits';
        }
    }
}
```

### Limit Point Calculator

```javascript
class LimitPointCalculator {
    static calculatePointsFromLimits(limitPoints, tier, specialAttackArchetype) {
        // Apply scaling formula
        let upgradePoints = 0;
        
        const firstTier = tier * 10;
        const secondTier = tier * 20;
        
        if (limitPoints <= firstTier) {
            upgradePoints = limitPoints;
        } else if (limitPoints <= firstTier + secondTier) {
            upgradePoints = firstTier + (limitPoints - firstTier) * 0.5;
        } else {
            upgradePoints = firstTier + secondTier * 0.5 + (limitPoints - firstTier - secondTier) * 0.25;
        }
        
        // Apply archetype multiplier
        switch(specialAttackArchetype) {
            case 'normal':
                return upgradePoints * (tier / 6);
            case 'specialist':
                return upgradePoints * (tier / 3);
            case 'straightforward':
                return upgradePoints * (tier / 2);
            default:
                return upgradePoints;
        }
    }
}
```

### Character Builder Flow Components

```javascript
class CharacterBuilderFlow {
    constructor() {
        this.currentStep = 1;
        this.character = new VitalityCharacter();
        this.validators = new ValidationService();
    }
    
    // Step 1: Basic Info
    setBasicInfo(name, realName, tier) {
        this.character.basicInfo = { name, realName, tier };
        this.recalculateAllPools();
    }
    
    // Step 2: Archetypes (MUST be before attributes)
    selectArchetype(category, archetypeId) {
        this.character.archetypes[category] = archetypeId;
        this.recalculateAllPools();
        this.applyArchetypeEffects(category, archetypeId);
    }
    
    // Step 3: Attributes
    assignAttribute(attribute, value) {
        const max = this.character.basicInfo.tier;
        if (value <= max) {
            this.character.attributes[attribute] = value;
            this.updateSpentPoints();
        }
    }
    
    // Step 4: Main Pool Purchases
    purchaseFromMainPool(type, itemId) {
        const cost = this.getItemCost(type, itemId);
        const available = this.getAvailableMainPoints();
        
        if (type === 'flaws') {
            // Flaws GIVE points
            this.character.mainPoolPurchases.flaws.push(itemId);
            this.updateSpentPoints();
        } else if (cost <= available) {
            this.character.mainPoolPurchases[type].push(itemId);
            this.updateSpentPoints();
        }
    }
    
    // Step 5: Special Attacks (each with own limits)
    createSpecialAttack() {
        const archetype = this.character.archetypes.specialAttack;
        
        // Check if archetype allows special attacks
        if (archetype === 'basic') return; // No special attacks
        
        const attack = {
            name: "",
            attackType: this.getDefaultAttackType(),
            effectType: this.getDefaultEffectType(),
            limits: [],
            upgrades: [],
            totalLimitPoints: 0,
            upgradePointsAvailable: 0
        };
        
        this.character.specialAttacks.push(attack);
    }
    
    addLimitToAttack(attackIndex, limitId) {
        const attack = this.character.specialAttacks[attackIndex];
        const archetype = this.character.archetypes.specialAttack;
        
        // Check if archetype allows limits
        if (['paragon', 'oneTrick', 'dualNatured', 'basic'].includes(archetype)) {
            return; // These archetypes don't use limits
        }
        
        attack.limits.push(limitId);
        this.recalculateAttackPoints(attackIndex);
    }
    
    // Step 6: Utility Purchases
    purchaseUtility(category, itemId, level = 'basic') {
        const cost = this.getUtilityCost(category, itemId, level);
        const available = this.getAvailableUtilityPoints();
        
        if (cost <= available) {
            if (category === 'expertise') {
                this.character.utilityPurchases.expertise[level].push(itemId);
            } else {
                this.character.utilityPurchases[category].push(itemId);
            }
            this.updateSpentPoints();
        }
    }
}
```

### Key Architecture Improvements

1. **Separated Concerns**
   - Each point pool has its own calculation logic
   - Limits are per-special-attack, not global
   - Traits (abilities) vs trait bonuses (from limits) are clearly separated

2. **Correct Flow Enforcement**
   - Archetypes must be selected before attributes
   - Special attacks are created individually with their own limits
   - Point calculations update dynamically based on choices

3. **Archetype-Aware Calculations**
   - Special attack archetypes properly modify point calculations
   - Unique ability archetypes modify main pool
   - Utility archetypes modify utility pool

4. **Proper Limit System**
   - Limits apply per special attack
   - Point scaling formula correctly implemented
   - Archetype multipliers properly applied

5. **Clear Separation of Concepts**
   - Traits (30p abilities) vs Trait Bonuses (from limits)
   - Flaws give points vs everything else costs points
   - Attack/Effect types from archetypes vs purchased

Would you like me to detail any specific part of this architecture or help implement the validation rules?




## COMPLETE REFACTOR PLAN - VITALITY SYSTEM CHARACTER BUILDER

After reviewing the entire rulebook, here's a comprehensive refactor plan that follows EVERY rule to the letter:

### FILE STRUCTURE BREAKDOWN

```
character-builder/
├── core/
│   ├── VitalityCharacter.js        # Character data model
│   ├── GameConstants.js            # All constants from rulebook
│   ├── DiceSystem.js               # Section 1: Dice mechanics
│   └── TierSystem.js               # Section 1: Tier calculations
│
├── systems/
│   ├── AttributeSystem.js          # Section 1: Attributes & Defenses
│   ├── ActionSystem.js             # Section 2: Action Economy
│   ├── ArchetypeSystem.js          # Section 3: All 7 archetype categories
│   ├── AttackTypeSystem.js         # Section 4: Attack & Effect Types
│   ├── TraitFlawSystem.js          # Section 5: Traits & Flaws
│   ├── UniqueAbilitySystem.js      # Section 6: Boons & Unique Abilities
│   ├── SpecialAttackSystem.js      # Section 7: Special Attacks & Limits
│   ├── UtilitySystem.js            # Section 8: Expertise/Features/Senses
│   └── WealthSystem.js             # Section 8: Wealth tiers
│
├── calculators/
│   ├── PointPoolCalculator.js      # All point pool calculations
│   ├── LimitCalculator.js          # Limit scaling formulas
│   ├── StatCalculator.js           # Derived stat calculations
│   └── CombatCalculator.js         # Combat formulas
│
├── validators/
│   ├── CharacterValidator.js       # Master validation
│   ├── ArchetypeValidator.js       # Archetype conflicts
│   ├── AttributeValidator.js       # Attribute maximums
│   ├── SpecialAttackValidator.js   # Attack restrictions
│   └── BuildOrderValidator.js      # Enforce creation order
│
├── ui/
│   ├── CharacterBuilder.js         # Main UI controller
│   ├── tabs/
│   │   ├── BasicInfoTab.js         # Name, Tier
│   │   ├── ArchetypeTab.js         # 7 archetype selections
│   │   ├── AttributeTab.js         # Attribute assignment
│   │   ├── MainPoolTab.js          # Boons, Traits, Flaws
│   │   ├── SpecialAttackTab.js     # Attack builder
│   │   ├── UtilityTab.js           # Expertise, Features, etc
│   │   └── SummaryTab.js           # Final character sheet
│   └── components/
│       ├── PointPoolDisplay.js     # Point tracking
│       ├── ValidationDisplay.js     # Error/warning display
│       └── CharacterTree.js         # Character list
│
└── app.js                          # Main application entry
```

### DETAILED FILE RESPONSIBILITIES

#### **Core Files**

**VitalityCharacter.js**
- Character data model matching EXACT rulebook structure
- NO calculations, just data storage
- Version tracking for migrations

**GameConstants.js**
- EVERY constant from rulebook (Tier ranges, point costs, etc.)
- Attack type costs, upgrade costs, archetype restrictions
- Status effect durations, condition resistances

**DiceSystem.js**
- D20 rolls for Accuracy/Conditions/Skills
- 3D6 rolls for Damage
- Natural 20 handling (+Tier to damage/condition)
- Exploding 6s on damage dice

**TierSystem.js**
- Tier 0-10 validation
- Starting tier 4 enforcement
- Tier-based bonuses to all actions

#### **System Files**

**AttributeSystem.js**
- Combat Attributes: Focus, Mobility, Power, Endurance
- Utility Attributes: Awareness, Communication, Intelligence
- Point allocation: Combat (Tier × 2), Utility (Tier)
- Maximum per attribute = Tier
- Defense calculations:
  - Avoidance: 10 + Tier + Mobility
  - Durability: Tier + (Endurance × 1.5)
  - Resolve: 10 + Tier + Focus
  - Stability: 10 + Tier + Power
  - Vitality: 10 + Tier + Endurance

**ActionSystem.js**
- Primary/Quick/Free/Movement/Reaction tracking
- Base movement: (Mobility + 6) or (Mobility + Tier), whichever higher
- All primary actions from Section 2
- 30p upgrade to make any Primary → Quick

**ArchetypeSystem.js**
- ENFORCE selection order (must be before attributes)
- Movement: Swift, Skirmisher, Behemoth, Bulwark, Vanguard, Mole, Flight, Teleportation, Portal, Swinging, Super Jump
- Attack Type: AOE Specialist, Direct Specialist, Single Target
- Effect Type: Damage Specialist, Hybrid Specialist, Crowd Control
- Unique Ability: Versatile Master, Extraordinary, Cut Above
- Defensive: Stalwart, Resilient, Fortress, Immutable, Juggernaut
- Special Attack: Normal, Specialist, Paragon, One Trick, Straightforward, Shared Uses, Dual-Natured, Basic
- Utility: Specialized, Practical, Jack of All Trades

**AttackTypeSystem.js**
- Melee: Adjacent, +Tier to Accuracy OR Damage
- Ranged: 15 spaces, -Tier if adjacent to hostile
- Direct: 30 spaces, auto-hit, Condition only, -Tier to rolls
- Area: 3sp Radius/6sp Cone/12sp Line, -Tier to rolls
- Hybrid: Damage AND Condition, -Tier to rolls
- Basic Conditions: Disarm, Grab, Shove, Prone, Blind, Daze, Misdirect, Setup, Taunt
- Advanced Conditions: Control, Capture, Stun, Weaken, Disable Specials, Frighten, Enthrall, Frenzy

**TraitFlawSystem.js**
- Flaws: 30p each, +Tier to ONE stat, stacking reduces by 1
- Available Flaws: Balanced, Slow, Combat Focused, Sickly, Unresponsive, Peaked, Weak, Power Loss, Single Target Specialist, Equipment Dependent, Stubborn
- Traits: 30p each, +Tier to TWO stats when conditions met
- Trait Conditions: Tier 1-3 conditions, up to 3 tiers total

**UniqueAbilitySystem.js**
- Boons: Variable costs from main pool
- Psychic (0p), Robot (30p), Telekinetic (0p), Biohacker (0p), Utilitarian (15p), Speed of Thought (15p), Perfectionist (15p), Combat Reflexes (15p)
- Aura (30p + upgrades)
- Barrier (30p + upgrades)
- Create Wall (30p + upgrades)
- Shield (30p + upgrades)
- Backlash (30p + upgrades)
- Boost (60p)
- Summon (10p per + upgrades)
- Invisibility (30p)
- Regeneration (60p)
- Heal (30p + upgrades)
- Counter (varies)

**SpecialAttackSystem.js**
- Points from Archetype OR Limits
- Limit scaling: First Tier×10 = full, Next Tier×20 = half, Rest = quarter
- Archetype modifiers:
  - Normal: Points × (Tier ÷ 6)
  - Specialist: Points × (Tier ÷ 3)
  - Paragon: Tier × 10 (NO limits)
  - One Trick: Tier × 20 (NO limits, ONE attack)
  - Straightforward: Points × (Tier ÷ 2)
  - Shared Uses: 10 uses, Tier×5 discount per use
  - Dual-Natured: Tier × 15 per attack (TWO attacks)
  - Basic: Tier × 10 (base attack only)
- Attack Type costs: Melee/Ranged (20p), Direct/Area (30p)
- All upgrades from Section 7

**UtilitySystem.js**
- Points: 5 × (Tier - 1), modified by archetype
- Expertise: Activity (2p/6p), Situational (1p/3p)
- Features: 1p/3p/5p/10p tiers
- Senses: 1p/3p/5p/10p tiers
- Movement: 5p/10p options
- Descriptors: 5p/10p options

#### **Calculator Files**

**PointPoolCalculator.js**
- Combat Attributes: Tier × 2
- Utility Attributes: Tier
- Main Pool: (Tier - 2) × 15
- Utility Pool: 5 × (Tier - 1) OR 5 × (Tier - 2) based on archetype
- Extraordinary doubles main pool
- Special Attack points per archetype

**LimitCalculator.js**
- EXACT scaling from rulebook:
  - First Tier×10 points = 100% value
  - Next Tier×20 points = 50% value
  - Remaining = 25% value
- Apply archetype multipliers AFTER scaling
- Trait bonuses: 2 per 15 limit points

**StatCalculator.js**
- Movement: Tier + Mobility (+ archetype bonuses)
- Accuracy: Tier + Focus
- Damage: Tier + (Power × 1.5)
- Conditions: Tier × 2
- Initiative: Tier + Mobility + Focus + Awareness
- HP: 100 + (Tier × 5)
- All archetype bonuses applied

#### **Validator Files**

**CharacterValidator.js**
- Master validation orchestrator
- Checks all subsystems
- Generates error/warning lists

**ArchetypeValidator.js**
- Behemoth can't have movement-restricting limits
- One Trick = 1 attack only
- Dual-Natured = 2 attacks only
- Basic = no special attacks
- Paragon/One Trick/Dual-Natured = no limits

**AttributeValidator.js**
- No attribute > Tier
- Combat pool spent ≤ Tier × 2
- Utility pool spent ≤ Tier
- Balanced flaw enforcement

**SpecialAttackValidator.js**
- Banned combinations (Brutal + Heavy Strike, etc.)
- Limit restrictions by archetype
- Point spending validation
- Attack type requirements

**BuildOrderValidator.js**
- ENFORCE: Archetypes → Attributes → Main Pool → Special Attacks → Utility
- Lock tabs until prerequisites met
- Clear error messages for order violations

### CRITICAL RULES TO ENFORCE

1. **Character Creation Order IS MANDATORY**
   - Cannot assign attributes without archetypes
   - Cannot buy abilities without attributes
   - Lock UI elements until prerequisites met

2. **Point Pools Are SEPARATE**
   - Combat attributes ONLY from combat pool
   - Utility attributes ONLY from utility pool
   - Main pool for Boons/Traits/Flaws ONLY
   - Special attack points ONLY for that attack

3. **Limit System**
   - Limits are PER ATTACK, not global
   - Scaling formula MUST be exact
   - Some archetypes CANNOT use limits

4. **Trait vs Trait Bonus**
   - Traits cost 30p from main pool
   - Trait bonuses come from limits (2 per 15 points)
   - These are DIFFERENT systems

5. **Archetype Restrictions**
   - Behemoth + movement limits = INVALID
   - One Trick = EXACTLY 1 attack
   - Basic = NO special attacks
   - Specialized/Jack of All Trades = different utility pools

6. **Combat Formulas**
   - Accuracy: 1d20 + Tier + Focus
   - Damage: 3d6 + Tier + (Power × 1.5) - Durability
   - Conditions: 1d20 + Tier + Power vs Resistance

7. **Stacking Rules**
   - Multiple bonuses to same stat reduce by 1
   - Specific > General
   - Most restrictive applies

This refactor ensures EVERY SINGLE RULE from the rulebook is properly implemented and enforced. Each file has a specific responsibility, making it easier to maintain and debug.