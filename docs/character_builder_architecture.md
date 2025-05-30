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