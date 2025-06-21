#### **Immediate Actions (Critical Fixes)**

1. **Fix the Economic Model**
```javascript
// CORRECT implementation
"slow": {
    "id": "slow",
    "type": "flaw",
    "name": "Slow",
    "cost": {
        "value": 30,        // Flaws COST 30 points
        "pool": "main",
        "display": "30p"
    },
    "effects": [{
        "type": "stat_choice",
        "bonus": "tier",    // Gives +tier to chosen stat
        "choices": ["accuracy", "damage", "conditions", "avoidance", "durability", "speed", "allResistances"]
    }]
}
```

2. **Implement Hierarchical Schema for Limits**
```javascript
"limits": {
    "charge_up": {
        "id": "charge_up",
        "type": "limit",
        "name": "Charge-Up",
        "cost": 40,
        "variants": {
            "extended_charge": {
                "id": "extended_charge",
                "name": "Extended Charge",
                "cost": 50,
                "parent": "charge_up",
                "modifiers": {
                    "triple_charge": {
                        "id": "triple_charge",
                        "name": "Triple Charge",
                        "cost": 60,
                        "parent": "extended_charge"
                    }
                }
            }
        }
    }
}
```

3. **Add Missing Complex Abilities**
```javascript
"aura": {
    "id": "aura",
    "type": "unique_ability",
    "name": "Aura",
    "baseCost": 30,
    "auraTypes": [
        {
            "id": "attack_aura",
            "name": "Attack Aura",
            "effects": ["melee_attack", "-tier_accuracy"]
        }
    ],
    "upgrades": {
        "increased_radius": {
            "cost": 5,
            "per": "space",
            "stackable": true
        }
    }
}
```

#### **Schema Redesign**

Create a **hybrid schema** that supports both flat lookups and complex relationships:

```javascript
{
    "schemaVersion": "3.0",
    "entities": {
        // Flat entities for simple lookups
    },
    "complexSystems": {
        "limits": {
            // Hierarchical structure preserved
        },
        "uniqueAbilities": {
            // Complex abilities with upgrades
        },
        "utilityFeatures": {
            // Tiered features by category
        }
    },
    "questionnaires": {
        "bio": {
            // Dynamic questionnaire data
        }
    }
}
```

#### **Migration Strategy**

1. **Phase 1: Complete the Migration**
   - Re-migrate all missing files
   - Preserve hierarchical structures
   - Validate against source files

2. **Phase 2: Fix Schema Violations**
   - Correct flaw/trait economics
   - Add missing fields for complex systems
   - Implement proper cost calculations

3. **Phase 3: Implement Validation**
   ```javascript
   class DataValidator {
       static validateMigration() {
           // Check all source files are represented
           // Verify hierarchical relationships
           // Validate cost calculations
           // Ensure rulebook text is preserved
       }
   }
   ```

#### **Specific Files to Re-Migrate**

1. **limits.json** - Preserve full hierarchy
2. **unique_abilities_complex.json** - All abilities with upgrades
3. **features.json** - Tiered utility features
4. **senses.json** - Tiered senses
5. **movement_features.json** - Movement abilities
6. **expertise.json** - Expertise categories
7. **skills.json** - Skill definitions
8. **bio.json** - Complete questionnaire system

