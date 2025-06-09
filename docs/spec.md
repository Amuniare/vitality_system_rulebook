### **`/.claude/spec.md`**

# Feature Specification: Interactive Summary Tab Refactor

## 1. Overview & Objective

The current Summary tab is a static data-dump. The objective is to transform it into an interactive, comprehensive, and well-structured "live" character sheet. This refactor will introduce detailed calculation breakdowns, toggleable bonuses, and a more organized presentation of all character data, making it the most useful tab for at-a-glance information and in-session play.

---

## 2. Core Architectural Changes & Dependencies

### 2.1. **Prerequisite: `StatCalculator.js` Enhancement**

This entire feature is dependent on a significant enhancement to the `StatCalculator`. It must be refactored to provide a much more detailed breakdown for each calculated stat.

**Current `calculateAllStats` Output (Simplified):**
```javascript
{
  final: { avoidance: 19 },
  breakdown: { avoidance: { /* high-level sources */ } }
}
```

**Required NEW `calculateAllStats` Output Structure:**
The `breakdown` for each stat **MUST** be an object containing specific, named sources and their values. This is the new data contract the UI will rely on.

```javascript
{
  final: { avoidance: 25 },
  breakdown: {
    avoidance: {
      base: 10,
      tier: 5,
      attributes: [
          { name: "Mobility", value: 4 }
      ],
      archetypes: [
          { name: "Swift", value: 1 }
      ],
      traits: [
          { name: "Dodge Expertise", value: 2 },
          { name: "Combat Reflexes", value: 3 }
      ],
      // This source is for bonuses that can be toggled in the UI
      toggleable: [
          { id: "primaryAction", name: "Primary Action Bonus", value: 5, active: true },
          { id: "someConditionalTrait", name: "Trait: Elusive", value: 2, active: false }
      ]
    }
  }
}
```

### 2.2. **`SummaryTab.js`: Local State Management**

The `SummaryTab` will become the first tab to manage its own internal, temporary UI state for the toggleable bonuses.

-   It will have a property, e.g., `this.toggledBonuses = {}`, to track the on/off state of bonuses like "Primary Action".
-   This state will **not** modify the core `VitalityCharacter` object. It is for display purposes only.
-   Clicking a toggle button will update this local state and trigger a re-render *of the calculated stats section only*, not the entire character.

---

## 3. UI Refactor: `features/summary/SummaryTab.js`

The `render()` method will be completely rewritten to produce a new four-row layout.

### **Row 1: Character & Archetype Overview**

-   **Structure:** A two-column layout.
-   **Left Column (`Basic Info`):** A table displaying `Name`, `Real Name`, `Tier`, etc., using `<tr>`s to structure the data.
-   **Right Column (`Archetypes`):**
    -   This card will be refactored.
    -   For each of the 7 archetypes, it will display both the **Name** and the **Description**.
    -   The `ArchetypeSystem.getArchetypesForCategory()` method will be used to fetch the full archetype object to access its `description`.

### **Row 2: Interactive Calculated Stats**

-   **Structure:** A three-column layout, each column being a styled card or box.
-   **Column 1: `Offense`**
    -   Contains a table for: `Accuracy`, `Damage`, `Conditions`, `Initiative`.
-   **Column 2: `Defense`**
    -   Contains a table for: `Avoidance`, `Durability`, `Resolve`, `Stability`, `Vitality`.
-   **Column 3: `Other`**
    -   Contains a table for: `Movement`, `HP`.
-   **Table Structure (for all three columns):** Each row in these tables will have three columns:
    1.  **Stat Name:** (e.g., "Avoidance")
    2.  **Final Value:** The total, recalculated value based on which toggles are active.
    3.  **Breakdown:** The detailed formula, rendered from the new `StatCalculator` breakdown object. This will be an interactive string of elements.

-   **Breakdown Display & Interactivity:**
    -   The breakdown string will be constructed like: `10 (Base) + 5 (Tier) + ...`
    -   Each component of the breakdown will be a `<span>` or similar element.
    -   Bonuses from the `toggleable` array in the breakdown will be rendered as clickable `<button>` or `<span>` elements with a `data-action="toggle-stat-bonus"` attribute.
    -   The button's appearance (e.g., class `active` or `inactive`) will reflect its state in `this.toggledBonuses`.
    -   Clicking a toggle will call a handler in `SummaryTab.js` that updates the local state and re-renders this section.

### **Row 3: Purchased Abilities Overview**

-   **Structure:** A two-column layout.
-   **Column 1: `Main Pool Purchases`**
    -   A comprehensive list of all purchased Flaws, Traits, Boons, Unique Abilities, and Action Upgrades.
    -   This can re-use the rendering logic and patterns from the `MainPoolTab`'s overview box.
    -   A table structure is recommended for clarity.
-   **Column 2: `Utility Pool Purchases`**
    -   A comprehensive list of all purchased Expertise, Features, Senses, Movement, and Descriptors.
    -   This can re-use the rendering logic from the `UtilityTab`'s overview box.

### **Row 4: Special Attacks Details**

-   **Structure:** A single-column layout containing a card for each special attack.
-   **For each Special Attack:**
    -   Display `Name` and `Description`.
    -   Display `Attack Types` and `Effect Types` selected.
    -   List all purchased `Limits` with their point values.
    -   List all purchased `Upgrades` with their costs.
    -   Display the `Upgrade Points` summary (`spent / available`).

---

## 4. CSS Changes (`assets/css/tabs/_summary.css`)

This file will need significant additions to support the new layout:

-   Styles for the multi-row, multi-column grid layout of the tab.
-   Table styles (`table`, `tr`, `th`, `td`) for a clean, structured look within the cards.
-   Styles for the interactive `toggleable` bonus buttons, including `active` and `inactive` states.
-   Potentially new card variants for `Offense`, `Defense`, etc.

---

## 5. Implementation Plan

1.  **Phase 1: `StatCalculator.js` Refactor (BLOCKER)**
    -   Modify `calculateAllStats` and its helpers to produce the new, detailed `breakdown` object structure defined in Section 2.1. This is the highest priority and blocks all other UI work.

2.  **Phase 2: `SummaryTab.js` Scaffolding**
    -   Rewrite the `render()` method to create the new four-row layout using placeholder content.
    -   Implement the `Archetypes` card enhancement (Row 1).

3.  **Phase 3: Calculated Stats Display (Static)**
    -   Integrate the new data from the refactored `StatCalculator`.
    -   Render the three stat boxes (`Offense`, `Defense`, `Other`) with the detailed breakdown string, but without interactivity for now.

4.  **Phase 4: Interactive Toggles**
    -   Implement the local state management (`this.toggledBonuses`).
    -   Add event handlers in `SummaryTab.js` for `toggle-stat-bonus`.
    -   Write the logic to recalculate a stat's final value on the fly based on the toggled state.
    -   Implement a partial re-render of just the calculated stats section to reflect changes.

5.  **Phase 5: Remaining Sections**
    -   Implement the "Purchased Abilities" row by adapting the overview box logic from other tabs.
    -   Implement the "Special Attacks" row by iterating through the character's attacks.

6.  **Phase 6: CSS & Final Polish**
    -   Write all necessary CSS in `_summary.css` to achieve the desired table-based, structured layout.
    -   Ensure responsiveness and visual consistency.