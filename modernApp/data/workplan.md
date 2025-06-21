I'll help you review your schema development and create a comprehensive plan. Let me first search for and review all the relevant documents you mentioned.Based on my review of your schema evolution and current implementation, here are my recommendations:

## 1. Schema Decision: Use Schema 4 (Universal Entity Schema) with Modifications

**Why Schema 4 is the right choice:**
- ✅ Flat structure enables fast lookups and simple state management
- ✅ `parentId` elegantly handles hierarchical relationships without nesting
- ✅ Universal structure allows one component to render any entity type
- ✅ Supports your goal of 50%+ code reduction

**Necessary modifications:**
```json
{
  "schemaVersion": "4.0",
  "metadata": {
    "gameVersion": "5.5",
    "lastUpdated": "2024-01-20"
  },
  "entities": {
    // All flat entities here
  },
  "questionnaires": {
    // Bio questionnaires (not entities)
  },
  "bannedCombinations": [
    // Incompatible upgrade pairs
  ],
  "calculationFormulas": {
    // Centralized formulas for complex calculations
  }
}
```

## 2. Limits/Unique Abilities: Flat with ParentId

**Current Problem:** Your limits.json uses deeply nested structure:
```json
{
  "charge_up": {
    "variants": {
      "extended_charge": {
        "modifiers": {
          "triple_charge": {...}
        }
      }
    }
  }
}
```

**Solution:** Flatten completely with parentId references:
```json
{
  "limit_charge_up": {
    "id": "limit_charge_up",
    "type": "limit",
    "name": "Charge-Up",
    "cost": { "value": 40, "pool": "limit_points", "display": "+40p" },
    "parentId": null
  },
  "limit_charge_up_extended": {
    "id": "limit_charge_up_extended",
    "type": "limit_variant",
    "name": "Extended Charge",
    "cost": { "value": 50, "pool": "limit_points", "display": "+50p" },
    "parentId": "limit_charge_up"
  },
  "limit_charge_up_extended_triple": {
    "id": "limit_charge_up_extended_triple",
    "type": "limit_modifier",
    "name": "Triple Charge",
    "cost": { "value": 60, "pool": "limit_points", "display": "+60p" },
    "parentId": "limit_charge_up_extended"
  }
}
```

**Benefits:**
- UI can reconstruct hierarchy by following parentId chains
- Each item is independently purchasable/validatable
- Supports your existing SpecialAttackSystem logic

## 3. Critical Changes to Partials

### High Priority Fixes:
1. **Split main_pool.json** into:
   - `flaws.json` (with CORRECT 30pt cost)
   - `boons_simple.json`
   - `actions.json`
   - `trait_conditions.json`

2. **Flatten limits.json** - Every limit/variant/modifier as top-level entity
3. **Flatten unique_abilities.json** - Main abilities and upgrades separate
4. **Fix cost economics** - Flaws COST 30 points, not give them

### Missing Files to Create:
- `bio.json` - Questionnaire data (not entities)
- `expertise.json` - Skill categories
- `movement_features.json` - Movement-related abilities

## 4. Final Schema Document

Create `modernApp/data/schema_final.md`:

```markdown
# Vitality Character Builder - Final Data Schema v4.0

## Overview
Single source of truth using flat entity structure with parentId relationships.

## Entity Schema
Every entity MUST have:
- `id`: Namespaced identifier (type_category_name)
- `schemaType`: Always "entity"
- `type`: Entity type (flaw, trait, limit, etc.)
- `name`: Display name
- `description`: Exact rulebook text
- `cost`: Object with value/pool/display
- `parentId`: Reference to parent entity (null if none)
- `requirements`: Array of prerequisite conditions
- `effects`: Array of mechanical effects
- `ui`: Display metadata
- `sourceFile`: Original filename

## File Structure
```
unified-game-data.json
├── schemaVersion
├── metadata
├── entities (flat list)
├── questionnaires
├── bannedCombinations
└── calculationFormulas
```

## Implementation Rules
1. NO nested structures in entities
2. Use parentId for ALL hierarchical relationships
3. Costs are ALWAYS objects, never raw numbers
4. Effects use declarative format for automation
5. UI metadata drives component rendering
```



### Success Metrics
- ✅ Single JSON file < 500KB
- ✅ 50%+ code reduction achieved
- ✅ All rules correctly implemented
- ✅ < 2s page load, < 100ms interactions
- ✅ Roll20 export working

---


## Files That Are Perfect (No Changes Needed) ✅
- **archetypes.json** - Already using universal schema perfectly
- **flaws.json** - Correctly shows cost: 30p 
- **boons_simple.json** - Proper flat structure
- **actions.json** - Well-formatted entities
- **trait_conditions.json** - Correct schema
- **bio.json** - Has questionnaires object as expected
- **attributes.json** - Good structure
- **character_types.json** - Proper entities
- **conditions.json** - Well-formatted
- **descriptors.json** - Correct schema
- **effect_types.json** - Good structure
- **skills.json** - Proper entities
- **upgrades.json** - Already flat with correct schema!
- **features.json** - Perfect flat structure
- **senses.json** - Correct schema implementation
- **movement_features.json** - Well-formatted

## Files That Need Major Work ❌

### 1. **limits.json**
**Current Problem:** Uses nested hierarchical structure with `subEntities`
**Required Changes:**
- Flatten completely - every limit, variant, and modifier becomes a top-level entity
- Add `parentId` field to link relationships
- Fix cost format from `"cost": 40` to `"cost": { "value": 40, "pool": "limit_points", "display": "+40p" }`
- Add all universal schema fields

### 2. **unique_abilities.json**
**Current Problem:** Uses nested structure with `subEntities` 
**Required Changes:**
- Flatten all abilities and their upgrades into separate entities
- Add `parentId` to link upgrades to their main ability
- Standardize cost objects
- Add all universal schema fields

## Updated Workplan

Since most files are already correct, here's the focused plan:

### Phase 1: Fix Hierarchical Files (2 days)

**Day 1: Flatten limits.json**
```json
// FROM THIS:
{
  "charge_up": {
    "subEntities": {
      "variants": [...]
    }
  }
}

// TO THIS:
{
  "limit_main_charge_up": {
    "id": "limit_main_charge_up",
    "type": "limit_main",
    "parentId": null,
    "cost": { "value": 40, "pool": "limit_points", "display": "+40p" }
  },
  "limit_variant_charge_up_extended": {
    "id": "limit_variant_charge_up_extended", 
    "type": "limit_variant",
    "parentId": "limit_main_charge_up",
    "cost": { "value": 50, "pool": "limit_points", "display": "+50p" }
  }
}
```

**Day 2: Flatten unique_abilities.json**
```json
// FROM THIS:
{
  "unique_ability_aura": {
    "subEntities": {
      "upgrades": [...]
    }
  }
}

// TO THIS:
{
  "unique_ability_aura": {
    "id": "unique_ability_aura",
    "type": "unique_ability",
    "parentId": null
  },
  "upgrade_aura_increased_radius": {
    "id": "upgrade_aura_increased_radius",
    "type": "unique_ability_upgrade",
    "parentId": "unique_ability_aura"
  }
}
```

### Phase 2: Build & Validation (1 day)
- Run build_game_data.py to generate unified-game-data.json
- Create validation script to verify parentId relationships
- Test that hierarchical data can be reconstructed from flat structure

### Phase 3: Frontend Implementation (1 week)
- Complete EntityLoader with parentId traversal
- Build HierarchicalDisplay component for limits/abilities
- Implement remaining tabs

