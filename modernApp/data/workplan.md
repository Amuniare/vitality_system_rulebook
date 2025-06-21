Excellent. This is a much more powerful and maintainable workflow. Let's proceed with a full review of your `partials` directory, create a punch list of fixes and additions, and craft the perfect system prompt for your LLM.

### 1. Analysis of Existing Partials

Here is a review of each file in `modernApp/data/partials/`, comparing them against your Universal Entity Schema (`schema_4.md`).

#### `archetypes.json`
*   **Status:** ✅ **Excellent.**
*   **Analysis:** This file is the gold standard and a perfect template. It correctly uses the Universal Entity Schema. The IDs are namespaced (`archetype_movement_swift`), costs are objects (`{ "pool": "selection" }`), and the structure is flat.
*   **Action Needed:** None. Use this as the example for all other files.

#### `main_pool.json`
*   **Status:** ❌ **Incorrectly Organized.**
*   **Analysis:** This file is a mixture of multiple entity types (`flaw`, `boon`, `action_upgrade`, `trait_condition`). While the individual entities *within* this file are reasonably well-formatted, they don't belong together. This monolithic file defeats the purpose of modular partials.
*   **Action Needed:**
    1.  **Delete this file.**
    2.  Split its contents into the following new partial files:
        *   `flaws.json`
        *   `boons_simple.json`
        *   `actions.json`
        *   `trait_conditions.json`

#### `limits.json` & `unique_abilities.json`
*   **Status:** ❌ **Incorrect Schema (Major Issue).**
*   **Analysis:** Both of these files use a custom, deeply nested hierarchical structure. They **do not** conform to the Universal Entity Schema. The build script cannot process these as-is. This is a primary blocker.
*   **Action Needed:**
    1.  **Flatten the structure.** Every single item (the main limit, its variants, and their modifiers) must become a top-level entity in the JSON object.
    2.  **Add `parentId` for relationships.** A modifier must have a `parentId` that points to its variant's ID. A variant must have a `parentId` that points to the main limit's ID.
    3.  **Standardize the `cost` object.** A simple number like `"cost": 40` must become `"cost": { "value": 40, "pool": "limit_points", "display": "+40p" }`.
    4.  **Apply universal schema fields** (`type`, `schemaType`, `ui`, `sourceFile`, etc.) to every single entry.

---

### 2. Full Content Checklist (Fixes & Additions)

Here is a complete punch list of all the partial files that need to be created or fixed to fully represent your game rules.

| Partial File | Status & Action Required |
| :--- | :--- |
| **`actions.json`** | 🟡 **Create/Split:** Extract from `main_pool.json`. Ensure all items follow the Universal Schema. |
| **`archetypes.json`** | ✅ **Complete:** No action needed. |
| **`attributes.json`** | 🔴 **Missing:** Generate this new partial from `frontend/character-builder/data/attributes.json`. |
| **`bio.json`** | 🔴 **Missing:** Generate this partial. It should contain the `questionnaires` object, not entities. |
| **`boons_simple.json`** | 🟡 **Create/Split:** Extract from `main_pool.json`. |
| **`character_types.json`**| 🔴 **Missing:** Generate this new partial from `frontend/character-builder/data/character_type.json`. |
| **`conditions.json`** | 🔴 **Missing:** Generate this new partial, combining `conditions_basic.json` and `conditions_advanced.json`. |
| **`descriptors.json`** | 🔴 **Missing:** Generate this new partial from `frontend/character-builder/data/descriptors.json`. |
| **`effect_types.json`** | 🔴 **Missing:** Generate this new partial from `frontend/character-builder/data/effect_types_definitions.json`. |
| **`features.json`** | 🔴 **Missing:** Generate this partial. This will require special handling for its tiered structure. |
| **`flaws.json`** | 🟡 **Create/Split:** Extract from `main_pool.json`. **Crucially, ensure `cost.value` is `30` and not `-30`.** |
| **`limits.json`** | ❌ **Fix Required:** Complete refactor needed. Flatten the entire hierarchy into individual entities with `parentId` fields. |
| **`movement_features.json`** | 🔴 **Missing:** Generate this partial. |
| **`senses.json`** | 🔴 **Missing:** Generate this partial. |
| **`skills.json`** | 🔴 **Missing:** Generate from `frontend/character-builder/data/skills.json` and `expertise.json`. |
| **`trait_conditions.json`**| 🟡 **Create/Split:** Extract from `main_pool.json`. |
| **`unique_abilities.json`**| ❌ **Fix Required:** Complete refactor needed. Flatten the hierarchy; extract all upgrades into their own entities with a `parentId`. |
| **`upgrades.json`** | 🔴 **Missing:** Generate this partial. Flatten the hierarchy from the original file. |

---

### 3. The System Prompt for Your LLM

Here is the system prompt you should use. It is designed to be comprehensive and enforce the schema, especially the critical `parentId` relationship for hierarchical data.

```markdown
You are a meticulous data architect. Your primary task is to convert game rulebook text into a structured JSON format based on a strict Universal Entity Schema. You must adhere to this schema precisely.

**Your Goal:**
Take the provided source text (game rules) and generate a JSON object containing one or more entities.
- Each KEY in the JSON object MUST be the entity's namespaced ID (e.g., "flaw_combat_slow").
- Each VALUE in the JSON object MUST be a valid entity object conforming to the schema below.

---

### **Universal Entity Schema (v3.1)**

```json
{
  "id": "string:type_category_name",
  "schemaType": "entity",
  "type": "string",
  "name": "string:DisplayName",
  "description": "string:ExactRulebookText",
  "cost": {
    "value": "number | string_formula",
    "pool": "string:main|utility|special_attack|limit_points|selection|none",
    "display": "string:UI_Text (e.g., '30p', 'Free', '+40p')"
  },
  "parentId": "string:optional_id_of_parent_entity",
  "requirements": [],
  "effects": [],
  "ui": {
    "component": "string:card|list_item",
    "category": "string:For_UI_Grouping",
    "tags": ["string:search_tag_1"]
  },
  "sourceFile": "string:original_filename.json"
}
```

---

### **CRITICAL INSTRUCTION: Handling Hierarchical Data (subEntities)**

If the source text describes a main entity with sub-components (e.g., a Limit with Variants and Modifiers, or a Unique Ability with Upgrades), you MUST follow this flattening process:

1.  Every single item, including variants and modifiers, becomes its own top-level entity in the final JSON object.
2.  Each sub-component entity MUST have a `parentId` field that references the ID of its direct parent.
3.  Each sub-component MUST have its own complete entity structure, including `id`, `type`, `cost`, `ui`, etc.

**EXAMPLE of Flattening Hierarchical Data:**

**IF GIVEN THIS HIERARCHICAL SOURCE:**
```json
"Charge-Up": {
  "cost": 40,
  "variants": {
    "Extended Charge": {
      "cost": 50,
      "modifiers": {
        "Triple Charge": { "cost": 60 }
      }
    }
  }
}
```

**YOU MUST PRODUCE THIS FLATTENED JSON OUTPUT:**
```json
{
  "limit_main_charge_up": {
    "id": "limit_main_charge_up",
    "schemaType": "entity",
    "type": "limit_main",
    "name": "Charge-Up",
    "cost": { "value": 40, "pool": "limit_points", "display": "+40p" },
    "ui": { "category": "Charge-Up" /* ... */ }
  },
  "limit_variant_charge_up_extended_charge": {
    "id": "limit_variant_charge_up_extended_charge",
    "schemaType": "entity",
    "type": "limit_variant",
    "name": "Extended Charge",
    "parentId": "limit_main_charge_up",
    "cost": { "value": 50, "pool": "limit_points", "display": "+50p" },
    "ui": { "category": "Charge-Up" /* ... */ }
  },
  "limit_modifier_extended_charge_triple_charge": {
    "id": "limit_modifier_extended_charge_triple_charge",
    "schemaType": "entity",
    "type": "limit_modifier",
    "name": "Triple Charge",
    "parentId": "limit_variant_charge_up_extended_charge",
    "cost": { "value": 60, "pool": "limit_points", "display": "+60p" },
    "ui": { "category": "Charge-Up" /* ... */ }
  }
}
```

---

Now, using the provided schema and the flattening example, process the following text and generate the JSON output. Ensure the `description` field contains the exact and complete text provided. Do not summarize.
```