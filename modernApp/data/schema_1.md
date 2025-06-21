Let me analyze the current data structure and design a comprehensive schema that will work across all scenarios.Looking at the current data structures, yes, we need a new unified schema design. The existing system has 15+ JSON files with inconsistent structures, and the modernApp's attempt has fundamental errors.

## Proposed Unified Schema Design

### Core Principles
1. **Every entity follows the same base structure**
2. **Display information is embedded with data**
3. **Costs are always explicit and consistent**
4. **Relationships use ID references**
5. **Validation rules are declarative**

### Base Entity Schema
```javascript
{
  "schemaVersion": "3.0",
  "metadata": {
    "lastUpdated": "2024-01-20",
    "gameVersion": "5.2"
  },
  "entities": {
    // All game entities organized by type
  }
}
```

### Universal Entity Structure
Every entity (flaw, trait, boon, archetype, etc.) follows this pattern:

```javascript
{
  "id": "string",
  "type": "entityType",
  "name": "Display Name",
  "description": "Exact rulebook text...",
  "cost": {
    "value": 30,        // or function: "5*tier"
    "pool": "main",     // which pool it draws from
    "display": "30p"    // how to show it in UI
  },
  "requirements": [     // prerequisites
    {
      "type": "archetype",
      "category": "movement",
      "value": "none",
      "display": "Cannot have movement archetype"
    }
  ],
  "effects": [          // what it does
    {
      "type": "statBonus",
      "target": "power",
      "value": "tier",
      "conditions": []  // when it applies
    }
  ],
  "ui": {              // how to render
    "component": "card",
    "size": "medium",
    "category": "flaws",
    "sortOrder": 1,
    "tags": ["defensive", "physical"]
  }
}
```

## Schema in Different Scenarios

### Scenario 1: Flaws
```javascript
"flaws": {
  "slow": {
    "id": "slow",
    "type": "flaw",
    "name": "Slow",
    "description": "Your reflexes are slow, you can't dodge, and you move sluggishly. This will affect your ability to get around, and avoid damage.",
    "cost": {
      "value": 30,
      "pool": "main",
      "display": "30p"
    },
    "requirements": [
      {
        "type": "archetype",
        "category": "movement",
        "value": "none",
        "inverse": true,
        "display": "Warning: Incompatible with movement archetype"
      }
    ],
    "effects": [
      {
        "type": "statBonus",
        "target": "choice",
        "options": ["power", "endurance", "focus"],
        "value": "tier",
        "display": "+Tier to chosen stat"
      },
      {
        "type": "statPenalty",
        "target": "mobility",
        "value": -2,
        "display": "-2 Mobility"
      }
    ],
    "ui": {
      "component": "card",
      "size": "medium",
      "category": "flaws",
      "icon": "🐌",
      "warningLevel": "advisory"
    }
  }
}
```

### Scenario 2: Traits
```javascript
"traits": {
  "rooted_warrior": {
    "id": "rooted_warrior",
    "type": "trait",
    "name": "Rooted Warrior",
    "description": "Custom trait with selected conditions",
    "cost": {
      "value": 30,
      "pool": "main",
      "display": "30p"
    },
    "configuration": {
      "conditions": {
        "selected": ["rooted", "long_distance"],
        "totalTier": 2,
        "display": "Rooted + Long Distance Fighter"
      },
      "statBonuses": {
        "selected": ["accuracy", "damage"],
        "value": "tier",
        "display": "+Tier to Accuracy and Damage"
      }
    },
    "ui": {
      "component": "trait-builder",
      "showConditions": true,
      "showStats": true
    }
  }
}
```

### Scenario 3: Special Attacks
```javascript
"specialAttacks": {
  "player_fire_blast": {
    "id": "player_fire_blast", 
    "type": "specialAttack",
    "name": "Fire Blast",
    "description": "Custom special attack",
    "cost": {
      "value": "calculated",
      "pool": "limit",
      "display": "45p"
    },
    "limits": [
      {
        "type": "cooldown",
        "tier": 1,
        "upgrades": ["cooldown_2", "failure_extension"]
      }
    ],
    "configuration": {
      "attackType": "ranged",
      "effectType": "energy",
      "upgrades": {
        "cooldown_2": {
          "cost": 20,
          "stacks": 1
        },
        "range_increase": {
          "cost": 5,
          "stacks": 3
        }
      }
    },
    "ui": {
      "component": "attack-builder",
      "editable": true
    }
  }
}
```

### Scenario 4: Archetypes
```javascript
"archetypes": {
  "movement": {
    "swift": {
      "id": "swift",
      "type": "archetype",
      "category": "movement",
      "name": "Swift",
      "description": "You have incredible speed and agility...",
      "cost": {
        "value": 0,
        "pool": "none",
        "display": "Free"
      },
      "effects": [
        {
          "type": "movement",
          "base": 6,
          "bonus": "ceil(tier/2)",
          "display": "Movement: 6 + ⌈Tier/2⌉"
        },
        {
          "type": "statBonus",
          "target": "mobility",
          "value": 1,
          "display": "+1 Mobility"
        }
      ],
      "requirements": [],
      "ui": {
        "component": "radio-card",
        "category": "movement",
        "sortOrder": 1
      }
    }
  }
}
```

### Scenario 5: Complex Boons
```javascript
"boons": {
  "indomitable": {
    "id": "indomitable",
    "type": "boon",
    "subtype": "complex",
    "name": "Indomitable",
    "description": "Regain all HP when survival check beats DC by 10+. Can only trigger 1/session.",
    "cost": {
      "value": 60,
      "pool": "main",
      "display": "60p"
    },
    "upgrades": {
      "frequency": {
        "id": "frequency",
        "name": "Increased Frequency",
        "description": "Can trigger once per rest instead",
        "cost": {
          "value": 30,
          "display": "+30p"
        }
      }
    },
    "ui": {
      "component": "upgradeable-card",
      "category": "defensive"
    }
  }
}
```

## Benefits of This Schema

### 1. **Consistency**
- Every entity follows the same pattern
- Makes it easy to build universal components
- Reduces code by 50%+ as promised

### 2. **Flexibility**
- Supports simple costs (30p) and formulas ("5*tier")
- Handles complex requirements and effects
- Allows for future extensions

### 3. **UI-Driven**
- Each entity knows how it should be displayed
- Components can be truly universal
- Adding new content = adding JSON, not code

### 4. **Validation-Friendly**
- Requirements are declarative
- Easy to implement advisory warnings
- Clear relationships between entities

### 5. **Export-Ready**
- Clean structure for Roll20 export
- All data in one place
- Version tracking built-in

Would you like me to start implementing this schema by migrating the existing data files?