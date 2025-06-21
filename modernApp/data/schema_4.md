### The Universal Entity Schema (v3.1)

Here is a proposed universal structure that all your "flat" entities can follow. This will be the standard format for every item inside the `entities` object of your final `unified-game-data.json`.

```json
{
  "id": "string:type_category_name",
  "schemaType": "entity",
  "type": "string",
  "name": "string:DisplayName",
  "description": "string:ExactRulebookText",
  "cost": {
    "value": "number | string_formula",
    "pool": "string:main|utility|special_attack|selection|none",
    "display": "string:UI_Text"
  },
  "requirements": [
    {
      "type": "string:archetype|tier|attribute|entity",
      "value": "string|number",
      "category": "string:optional",
      "inverse": "boolean:optional",
      "display": "string:UI_ErrorText"
    }
  ],
  "effects": [
    {
      "type": "string:stat_bonus|pool_mod|grant_ability|custom",
      "target": "string:stat_id|pool_id",
      "value": "number|string_formula",
      "display": "string:UI_EffectText"
    }
  ],
  "ui": {
    "component": "string:card|list_item",
    "category": "string:For_UI_Grouping",
    "tags": ["string:search_tag_1", "string:search_tag_2"]
  },
  "sourceFile": "string:original_filename.json"
}
```

#### Detailed Breakdown:

*   **`id` (string, required):** The globally unique, namespaced identifier. **Convention: `{type}_{category}_{name}`**. Example: `"flaw_combat_slow"`, `"archetype_movement_swift"`.
*   **`schemaType` (string, required):** Always `"entity"` for items in this list. This helps distinguish them from other objects in the data file.
*   **`type` (string, required):** The primary entity type. Examples: `"flaw"`, `"trait_condition"`, `"archetype"`, `"upgrade"`, `"boon"`.
*   **`name` (string, required):** The human-readable name for the UI. Example: `"Slow"`.
*   **`description` (string, required):** The **exact, complete text** from the rulebook or source document.
*   **`cost` (object, required):**
    *   `value`: The numeric cost or a string formula (e.g., `"5 * tier"`). For Flaws, this is `30`. For free items, this is `0`.
    *   `pool`: Which point pool this cost is drawn from (`main`, `utility`, `special_attack`, `selection`, `none`).
    *   `display`: (Optional) How the cost should be formatted in the UI (e.g., `"30p"`, `"Free"`).
*   **`requirements` (array, optional):** A list of conditions that must be met to purchase this entity.
*   **`effects` (array, optional):** A list of mechanical effects this entity provides.
*   **`ui` (object, required):**
    *   `component`: The suggested UI component to render this entity (e.g., `"card"`).
    *   `category`: The primary grouping for UI display. Example: `"movement"`, `"defensive"`, `"Damage Bonuses"`.
    *   `tags`: An array of keywords for searching and filtering.
*   **`sourceFile` (string, required):** The original partial file this data came from (e.g., `"flaws.json"`). This is invaluable for debugging the build process.

---

### Concrete Examples

Here is how different entities from your old system would look in this new universal schema.

#### Example 1: A Flaw (`flaw_combat_slow`)

```json
"flaw_combat_slow": {
  "id": "flaw_combat_slow",
  "schemaType": "entity",
  "type": "flaw",
  "name": "Slow",
  "description": "You cannot select a Movement Archetype.",
  "cost": {
    "value": 30,
    "pool": "main",
    "display": "30p"
  },
  "effects": [
    {
      "type": "stat_choice",
      "value": "tier",
      "options": ["accuracy", "damage", "conditions", "avoidance", "durability", "speed", "allResistances"],
      "display": "+Tier bonus to one chosen stat"
    }
  ],
  "requirements": [],
  "ui": {
    "component": "card",
    "category": "General Flaws",
    "tags": ["combat", "archetype_restriction"]
  },
  "sourceFile": "flaws.json"
}
```

#### Example 2: An Archetype (`archetype_movement_swift`)

```json
"archetype_movement_swift": {
  "id": "archetype_movement_swift",
  "schemaType": "entity",
  "type": "archetype",
  "name": "Swift",
  "description": "Movement speed increased by half your Tier (rounded up). Traverse the battlefield quicker.",
  "cost": {
    "value": 0,
    "pool": "selection",
    "display": "Choice"
  },
  "effects": [
    {
      "type": "stat_bonus",
      "target": "movement",
      "value": "ceil(tier/2)",
      "display": "+⌈Tier/2⌉ Movement"
    }
  ],
  "requirements": [],
  "ui": {
    "component": "card",
    "category": "movement",
    "tags": ["speed", "positioning"]
  },
  "sourceFile": "archetypes.json"
}
```

#### Example 3: An Action Upgrade (`action_upgrade_base_attack_quick`)

```json
"action_upgrade_base_attack_quick": {
    "id": "action_upgrade_base_attack_quick",
    "schemaType": "entity",
    "type": "action_upgrade",
    "name": "Quick Base Attack",
    "description": "Allows the Base Attack action to be used as a Quick Action instead of a Primary Action.",
    "cost": { "value": 30, "pool": "main", "display": "30p" },
    "effects": [{ "type": "action_conversion", "baseActionId": "base_attack", "newType": "quick" }],
    "requirements": [],
    "ui": {
      "component": "card",
      "category": "Action Upgrades",
      "tags": ["action_economy", "combat"]
    },
    "sourceFile": "actions.json"
}
```

### Why this Universal Schema is Better

1.  **One Component to Rule Them All:** You can build a single `UniversalCard.js` component that takes any entity from this structure and renders it perfectly without needing `if/else` logic for different types.
2.  **Simplified System Logic:** Your `StateManager`'s `purchaseEntity` function becomes incredibly simple. It just adds the entity ID to the character's purchased list and deducts the cost from the specified pool. No special cases needed.
3.  **Future-Proof:** Want to add "Gadgets" to the game? Just create a `gadgets.json` partial, add it to your build script with `type: "gadget"`, and your existing components will render them automatically.
4.  **Self-Documenting:** The namespaced IDs and clear structure make the data file itself a readable reference for how the game works.

This schema is the blueprint. The next logical step is to implement the **`tools/build-unified-data.js`** script to generate a `unified-game-data.json` file based on this structure from your existing partials.