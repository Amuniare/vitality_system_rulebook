Of course. Here is a detailed specification document to address all the identified issues, including the UI/UX improvements for the condition selectors.

---

## Project Spec: Special Attack System Integrity & UI Refinement

**Objective:** To resolve critical data contract violations, implement missing features, and enhance the user interface within the Special Attacks tab of the character builder.

### 1. Problem Identification

The current implementation of the Special Attacks tab suffers from several issues that prevent it from functioning as intended by the rulebook:

1.  **Data Integrity Issues:**
    *   **Free Advanced Conditions:** All Advanced Conditions are incorrectly priced at 0 points due to a data contract violation.
    *   **Free Direct Area Attack:** The "Direct Area" attack type is incorrectly priced at 0 points for the same reason.
    *   **Missing Generic Upgrades:** The entire category of "Generic Attack Upgrades" (e.g., Extended Range, Precise) is absent from the UI.

2.  **Logic & UI Deficiencies:**
    *   **Archetype Rules Not Enforced:** The "Effect Type" dropdown does not dynamically update or restrict options based on the character's selected `effectType` archetype.
    *   **Poor Condition UI:** The use of two separate, static dropdowns for Basic and Advanced conditions is confusing, clutters the interface, and does not prevent users from selecting both, which is an invalid state.

### 2. Root Cause Analysis

*   **Data Contract Violations:** The systems (`AttackTypeSystem.js`) are programmed to read a `cost` property from `data/conditions_advanced.json` and a `costKey` from `data/attack_types_definitions.json`. These properties are either missing or named incorrectly in the data files, causing the system to default their cost to 0.
*   **Incomplete Data:** The `data/upgrades.json` file is missing the entire "Generic Attack Upgrades" category and its associated items, leaving the data-driven UI with nothing to render.
*   **Logic Gap:** The `AttackBasicsForm.js` component lacks the necessary logic to check the character's archetype and filter the "Effect Type" options accordingly.
*   **Poor UI Design:** The condition selection was implemented with a simple, non-dynamic approach that does not provide a good user experience or enforce game rules effectively.

### 3. Implementation Plan

This plan is broken into three phases: correcting the data layer, implementing the UI/UX overhaul, and finally, updating the system logic to use the corrected data and UI.

---

#### **Phase 1: Data Layer Correction**

*   **Step 1.1: Add Costs to Advanced Conditions**
    *   **File:** `frontend/character-builder/data/conditions_advanced.json`
    *   **Action:** Add a `"cost": [value]` property to each condition object, using the values from the rulebook.
    *   **Example Snippet:**
        ```json
        // BEFORE
        {
            "id": "control",
            "name": "Control",
            "resistance": "resolve",
            ...
        }

        // AFTER
        {
            "id": "control",
            "name": "Control",
            "cost": 30, // Add this line
            "resistance": "resolve",
            ...
        }
        ```
    *   **Verification:** The `addCondition` logic in `AttackTypeSystem.js` will now correctly read this cost.

*   **Step 1.2: Fix Direct Area Attack Cost Key**
    *   **File:** `frontend/character-builder/data/attack_types_definitions.json`
    *   **Action:** In the `area_direct` object, rename the `baseCostKey` property to `costKey`.
    *   **Example Snippet:**
        ```json
        // BEFORE
        "area_direct": {
            "id": "area_direct",
            "name": "Direct Area Attack",
            "baseCostKey": "direct_area", // Incorrect key
            ...
        }

        // AFTER
        "area_direct": {
            "id": "area_direct",
            "name": "Direct Area Attack",
            "costKey": "direct_area", // Correct key
            ...
        }
        ```

*   **Step 1.3: Implement Generic Attack Upgrades**
    *   **File:** `frontend/character-builder/data/upgrades.json`
    *   **Action:** Add a new top-level category named `"Generic Attack Upgrades"` to the JSON file and populate it with the missing upgrades from the rulebook.
    *   **Example Snippet (to be added):**
        ```json
        {
          "Upgrades": {
            // ... existing categories ...
            "Generic Attack Upgrades": [
              {
                "id": "extended_range",
                "name": "Extended Range",
                "cost": 10,
                "effect": "Ranged attacks reach 30 spaces instead of 15.",
                "category": "Generic Attack Upgrades"
              },
              {
                "id": "precise_aoe",
                "name": "Precise",
                "cost": 30,
                "effect": "Choose which targets are affected by Area attacks.",
                "category": "Generic Attack Upgrades"
              },
              {
                "id": "hybrid_attack",
                "name": "Hybrid",
                "cost": 30,
                "effect": "Attack becomes Hybrid, inflicting both a Condition and Damage with a -Tier penalty to both rolls.",
                "category": "Generic Attack Upgrades"
              }
              // ... add other generic upgrades ...
            ]
          },
          "bannedCombinations": [ /* ... */ ]
        }
        ```

---

#### **Phase 2: UI/UX Refinement - Integrated Condition Selector**

*   **Step 2.1: Redesign the Condition Selection UI**
    *   **File:** `frontend/character-builder/features/special-attacks/components/AttackBasicsForm.js`
    *   **Action:**
        1.  Create a new method, `renderConditionSelectors`, that replaces the two separate dropdowns with a single, integrated component.
        2.  This component will display currently selected conditions (basic or advanced) as "tags" with a remove button.
        3.  If no conditions are selected, it will display dropdowns for *both* Basic and Advanced conditions.
        4.  Crucially, once a Basic condition is selected, the Advanced condition dropdown **must be hidden or disabled**, and vice versa. This enforces the rule that an attack can have one type or the other, but not both.
    *   **Logic:** The `renderConditionSelectors` method will check `attack.basicConditions.length` and `attack.advancedConditions.length` to decide which UI elements to render.

*   **Step 2.2: Add Supporting CSS**
    *   **File:** `frontend/character-builder/assets/css/tabs/_special-attacks.css`
    *   **Action:** Add new CSS rules to style the tag-based UI.
    *   **Example CSS:**
        ```css
        .integrated-selector { /* Container for tags and dropdown */ }
        .selected-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem; }
        .tag { background: var(--accent-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; display: flex; align-items: center; }
        .tag button { background: none; border: none; color: white; cursor: pointer; margin-left: 0.5rem; }
        ```

---

#### **Phase 3: System Logic Implementation**

*   **Step 3.1: Enforce Effect Type Archetype Rules**
    *   **File:** `frontend/character-builder/features/special-attacks/components/AttackBasicsForm.js`
    *   **Action:** Modify the method that renders the "Effect Type" selector.
        1.  Before rendering, get the character's `effectType` archetype (`character.archetypes.effectType`).
        2.  Filter the list of available effect types based on the archetype.
        3.  If archetype is `damageSpecialist`, only pass the "Damage Only" option to `RenderUtils.renderSelect`.
        4.  If archetype is `hybridSpecialist`, pre-select "Hybrid" and make the dropdown `disabled`.
        5.  If archetype is `crowdControl`, all options are available, but this is a good place to add a UI warning about the damage penalty if needed.

*   **Step 3.2: Ensure Advanced Condition Costs are Deducted**
    *   **File:** `frontend/character-builder/systems/AttackTypeSystem.js`
    *   **Action:** Review and update the `addConditionToAttack` method.
    *   **Logic Check:** Ensure that when `isAdvanced` is true, the code correctly reads `condition.cost` from the definition object (which will now exist thanks to Phase 1) and subtracts it from the attack's available upgrade points.

---

### 4. Verification Plan

After implementation, the following manual tests must pass to confirm the fixes:

1.  **Advanced Condition Cost:**
    *   Create a special attack and give it upgrade points via limits.
    *   Select an Advanced Condition (e.g., "Stun").
    *   **Expected Result:** 20 points should be deducted from the attack's available upgrade points.

2.  **Generic Upgrades:**
    *   Navigate to the "Upgrades" section for a special attack.
    *   **Expected Result:** A new category, "Generic Attack Upgrades," should be visible, containing "Extended Range," "Precise," etc. Purchasing one should deduct the correct point cost.

3.  **Direct Area Attack Cost:**
    *   Create a special attack.
    *   Select the "Direct Area" attack type from the dropdown.
    *   **Expected Result:** The attack's point cost should increase by 60 points.

4.  **Effect Type Archetype Enforcement:**
    *   Create a new character and select the "Damage Specialist" `effectType` archetype.
    *   Navigate to the Special Attacks tab and create an attack.
    *   **Expected Result:** The "Effect Type" selector should either be locked to "Damage Only" or only present that as an option.

5.  **Condition UI/UX:**
    *   Create a special attack.
    *   **Expected Result:** See both "Add Basic Condition" and "Add Advanced Condition" dropdowns.
    *   Select a Basic Condition (e.g., "Daze").
    *   **Expected Result:** The selected