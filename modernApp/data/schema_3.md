# Data Schema Design v3.0

**Objective:** To create a single, unified, and authoritative data schema for the Vitality Character Builder. This schema will consolidate all game data, support complex relationships, and drive a component-based UI, ensuring consistency and maintainability.

### Core Design Principles

1.  **Single Source of Truth:** All game data (rules, items, text) resides in **one file**: `unified-game-data.json`.
2.  **Hybrid Structure:** The schema uses a hybrid model:
    *   A flat `entities` object for fast, direct lookups of most items.
    *   A `complexSystems` object to preserve the necessary hierarchical data for systems like Limits.
3.  **UI-Driven:** Entities contain metadata (`ui` property) to inform the frontend how they should be rendered.
4.  **Declarative Rules:** Requirements and effects are structured data, not just descriptive text, allowing the system to understand and validate them.
5.  **Economic Accuracy:** The `cost` object is standardized to accurately reflect the game's point economy, correcting previous errors.

---

### Top-Level JSON Structure

```json
{
  "schemaVersion": "3.0",
  "metadata": {
    "gameVersion": "5.5",
    "lastUpdated": "YYYY-MM-DD"
  },
  "entities": {
    "entity_id_1": { ... },
    "entity_id_2": { ... }
  },
  "complexSystems": {
    "limits": { ... },
    "uniqueAbilities": { ... },
    "utilityItems": { ... }
  },
  "questionnaires": {
    "pc": { ... },
    "npc": { ... }
  },
  "bannedCombinations": [
    ["upgrade_id_1", "upgrade_id_2"]
  ]
}
```

---

### Universal Sub-Schemas

These are common object structures used across multiple entity types.

#### `costObject`
Defines the cost of an entity.
```json
"cost": {
  "value": 30,             // Can be a number or a string formula like "5 * tier"
  "pool": "main",          // 'main', 'utility', 'special_attack', 'selection', 'none'
  "display": "30p"         // Optional: How to display in the UI
}
```

#### `effectObject`
Defines a mechanical effect of an entity.
```json
"effects": [
  {
    "type": "stat_bonus",      // 'stat_bonus', 'stat_penalty', 'immunity', 'grant', 'pool_mod'
    "target": "power",         // The stat or property affected
    "value": "tier",           // Can be a number or string formula
    "conditions": ["rooted"],  // Optional: Array of condition IDs that must be active
    "display": "+Tier to Power"// Optional: UI display text
  }
]
```

#### `requirementObject`
Defines a prerequisite for purchasing or using an entity.
```json
"requirements": [
  {
    "type": "archetype",        // 'archetype', 'tier', 'attribute', 'entity'
    "category": "movement",     // e.g., for archetype requirements
    "value": "swift",           // The required ID or value
    "inverse": false,           // If true, the requirement is "must NOT have"
    "display": "Requires Swift" // UI error/info text
  }
]
```

---

### Detailed Entity Schemas

#### Core Entities

**`attribute`**
```json
"combat_focus": {
  "id": "combat_focus",
  "type": "attribute",
  "name": "Focus",
  "category": "combat", // 'combat' or 'utility'
  "flavor": "Aim true, act fast.",
  "description": "Represents your character's precision...",
  "mechanics": ["Improves `Accuracy`...", "Boosts `Resolve`..."]
}
```

**`character_type`**
```json
"npc_ally": {
  "id": "npc_ally",
  "type": "character_type",
  "name": "NPC Ally",
  "description": "A friendly non-player character...",
  "hp": 50,
  "subTypes": [] // Array of sub-type objects if applicable
}
```

#### Main Pool Entities

**`flaw`** (Corrected Economics)
```json
"slow": {
  "id": "slow",
  "type": "flaw",
  "name": "Slow",
  "description": "You cannot select a Movement Archetype.",
  "cost": { "value": 30, "pool": "main", "display": "30p" },
  "effects": [
    {
      "type": "stat_choice",
      "value": "tier",
      "options": ["accuracy", "damage", "conditions", "..."],
      "display": "+Tier to one chosen stat"
    }
  ]
}
```

**`trait`**
*Note: Traits are constructed by the player, so there's no entity. This defines the building blocks.*
**`trait_condition`**
```json
"rooted": {
  "id": "rooted",
  "type": "trait_condition",
  "name": "Rooted",
  "description": "Cannot move this turn",
  "tierCost": 1,
  "category": "tier1"
}
```

**`boon`** (Simple Boons)
```json
"psychic": {
  "id": "psychic",
  "type": "boon",
  "name": "Psychic",
  "description": "All conditions you inflict target Resolve resistance.",
  "cost": { "value": 0, "pool": "main", "display": "Free" },
  "effects": [{ "type": "condition_targeting", "value": "resolve" }]
}
```

#### `complexSystems` Schema

**`limits` (Hierarchical)**
*This structure will reside inside `complexSystems.limits`.*
```json
"charge_up": {
  "id": "charge_up",
  "name": "Charge-Up",
  "cost": 40,
  "description": "Must use Primary Action...",
  "variants": {
    "extended_charge": {
      "id": "extended_charge",
      "name": "Extended Charge",
      "cost": 50,
      "description": "Must charge for two turns...",
      "modifiers": {
        "triple_charge": {
          "id": "triple_charge",
          "name": "Triple Charge",
          "cost": 60,
          "description": "Must charge three turns..."
        }
      }
    }
  }
}
```

**`uniqueAbilities` (Complex Boons)**
*This structure will reside inside `complexSystems.uniqueAbilities`.*
```json
"aura": {
  "id": "aura",
  "name": "Aura",
  "baseCost": 30,
  "description": "A passive field around you...",
  "auraTypes": [
    { "id": "attack_aura", "name": "Attack Aura", "description": "..." }
  ],
  "upgrades": [
    {
      "id": "increased_radius",
      "name": "Increased Radius",
      "cost": 5,
      "per": "space",
      "stackable": true
    }
  ]
}
```

**`utilityItems` (Tiered)**
*This structure will reside inside `complexSystems.utilityItems`.*
```json
"features": {
  "tier1": {
    "cost": 1,
    "items": [
      { "id": "aquatic", "name": "Aquatic", "description": "..." }
    ]
  },
  "tier3": {
    "cost": 3,
    "items": [
      { "id": "familiar", "name": "Familiar", "description": "..." }
    ]
  }
}
```

#### `questionnaires` Schema

*This structure will reside inside `questionnaires`.*
```json
"pc": {
  "title": "Player Character Creation",
  "description": "Essential questions for creating your Player Character...",
  "questions": [
    {
      "id": "player_name",
      "question": "Player Name?",
      "type": "dropdown",
      "options": ["Diego", "Emmanuel", "Phantom", "..."]
    },
    {
      "id": "character_bio",
      "question": "Additional Character Background & Biography",
      "type": "textarea",
      "placeholder": "Describe your character's history..."
    }
  ]
}
```
