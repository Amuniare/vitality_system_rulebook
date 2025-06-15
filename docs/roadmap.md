Excellent. That clarification is crucial. You're right, the user must first commit to the attack's "cost" in uses, which in turn determines their "budget" for upgrades.

Here is the plan to implement this specific workflow for the **Shared Uses** archetype.

### The Plan: "Shared Uses" Archetype Workflow

This plan ensures that when a user selects the `sharedUses` archetype, the UI for creating special attacks adapts to a resource-cost model instead of a limit-based one.

#### 1. UI/UX Transformation in the Special Attacks Tab

The `SpecialAttackTab` will conditionally render its content based on the active archetype.

*   **If `archetype !== 'sharedUses'`:** The current UI with the "Limits" and "Upgrades" columns will be displayed as it is now.
*   **If `archetype === 'sharedUses'`:**
    1.  The **"Limits" column will be completely hidden or replaced.** Since this archetype cannot take limits, showing that section would be confusing.
    2.  In its place, a new, simple **"Use Cost"** section will appear. This section will contain:
        *   A clear instruction: "Select the cost for this attack (1-3 uses)."
        *   A set of radio buttons or a dropdown menu for the user to select **1, 2, or 3**.
    3.  The **"Upgrades" column will be disabled by default.** It will only become active *after* the user has selected a Use Cost of 1, 2, or 3.

#### 2. Data Model Modification

To support this, we need to add a new property to the special attack object within `VitalityCharacter.js`.

*   Each object inside the `character.specialAttacks` array will get a new property:
    *   `useCost: {number | null}` (e.g., `useCost: 2`)

This will store the player's selection for that specific attack. It will be `null` or `0` by default.

#### 3. System Logic and Calculation Update

The core calculation logic in `SpecialAttackSystem.js` will be updated.

*   The `recalculateAttackPoints(character, attack)` method will be modified:
    *   It will first check `character.archetypes.specialAttack`.
    *   If the archetype is `sharedUses`:
        *   It will ignore any limits.
        *   It will calculate `upgradePointsAvailable` using the new formula:
            > `upgradePointsAvailable = character.tier * 5 * attack.useCost`
    *   If the archetype is anything else, it will use the existing limit-based calculation.

#### 4. The User Workflow

This is how the complete process will function for a user with the `sharedUses` archetype:

1.  User navigates to the "Special Attacks" tab and clicks "Create Attack".
2.  The UI appears with the "Limits" section replaced by the "Use Cost" selector. The "Upgrades" section is grayed out.
3.  The user selects a cost, for example, **"2 Uses"**.
4.  An event fires, updating the `attack.useCost` property on the character model to `2`.
5.  `builder.updateCharacter()` is called, triggering a recalculation.
6.  The `SpecialAttackSystem` calculates the available points for this attack: `Tier * 5 * 2`. Let's say for a Tier 4 character, this is `4 * 5 * 2 = 40` points.
7.  The UI refreshes. The "Upgrade Points" display now shows "0 / 40", and the "Upgrades" section becomes enabled, allowing the user to purchase up to 40 points worth of upgrades for that attack.



# Roadmap: "Shared Uses" Archetype Implementation

**Objective:** To correctly implement the `sharedUses` special attack archetype, replacing the limit-based point generation system with a resource-cost model that determines the upgrade budget for each attack.

| Phase | Task ID | Action (What to Do) | Verification (How We Know It's Done) | AI Command (for `claude-code`) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Analysis** | 1.1 | **Analyze `SpecialAttackTab.js`:** Identify the `renderAttackBuilder` method and the logic that renders the "Limits" and "Upgrades" columns. | The exact line numbers for the two-column layout are noted. | `read file frontend/character-builder/features/special-attacks/SpecialAttackTab.js` | `[ ]` |
| | 1.2 | **Analyze `SpecialAttackSystem.js`:** Locate the `recalculateAttackPoints` method to identify where the limit-based point calculation occurs. | The section calculating `upgradePointsFromLimits` is identified. | `read file frontend/character-builder/systems/SpecialAttackSystem.js` | `[ ]` |
| | 1.3 | **Analyze `VitalityCharacter.js`:** Review the structure of an object within the `specialAttacks` array. | The current properties of a special attack object are confirmed. | `read file frontend/character-builder/core/VitalityCharacter.js` | `[ ]` |
| **Data Model** | 2.1 | **Add `useCost` Property:** Modify `VitalityCharacter.js` to add `useCost: null` to the special attack object structure. | `git diff` shows the new `useCost` property in the `createSpecialAttack` method. | `--write-code frontend/character-builder/core/VitalityCharacter.js` | `[ ]` |
| **System Logic** | 3.1 | **Implement Conditional Logic:** In `SpecialAttackSystem.js`, modify `recalculateAttackPoints` to check the character's archetype. If it's `sharedUses`, use the formula `tier * 5 * useCost` to calculate `upgradePointsAvailable`. Otherwise, use the existing limit logic. | The `recalculateAttackPoints` method contains an `if (archetype === 'sharedUses')` block with the correct formula. | `--write-code frontend/character-builder/systems/SpecialAttackSystem.js` | `[ ]` |
| **UI Implementation** | 4.1 | **Create Conditional UI:** In `SpecialAttackTab.js`, refactor `renderAttackBuilder` to call one of two new helper methods: `_renderDefaultAttackUI()` or `_renderSharedUsesAttackUI()` based on the character's archetype. | The `renderAttackBuilder` method now contains an `if/else` block that directs rendering. | `--write-code frontend/character-builder/features/special-attacks/SpecialAttackTab.js` | `[ ]` |
| | 4.2 | **Build "Use Cost" Selector:** Create the `_renderSharedUsesAttackUI()` method. This method will render a "Use Cost" selector (e.g., a dropdown with options 1, 2, 3) and an initially **disabled** "Upgrades" section. It will **not** render the "Limits" section. | When a character has the `sharedUses` archetype, the UI displays the new "Use Cost" selector and a disabled Upgrades column. | `--write-code frontend/character-builder/features/special-attacks/SpecialAttackTab.js` | `[ ]` |
| | 4.3 | **Implement Event Handling:** In `SpecialAttackTab.js`, add a new event handler for the "Use Cost" selector. On change, it should call a new method in `SpecialAttackSystem` to update `attack.useCost` on the character model and then trigger a full `builder.updateCharacter()` cycle. | Changing the "Use Cost" selector updates the character data and re-renders the tab. | `--write-code frontend/character-builder/features/special-attacks/SpecialAttackTab.js` | `[ ]` |
| **Verification** | 5.1 | **Manual Test 1 (Regression):** Create a character with the `normal` archetype. | The special attack builder for the `normal` archetype works exactly as it did before, using the Limits system. | N/A (Director Action) | `[ ]` |
| | 5.2 | **Manual Test 2 (New Feature):** Create a character with the `sharedUses` archetype. | The "Use Cost" selector appears. Selecting a cost (e.g., "2") correctly calculates the upgrade points (e.g., `Tier * 5 * 2`) and enables the Upgrades section. | N/A (Director Action) | `[ ]` |
| **Cleanup** | 6.1 | **Review & Stage Changes:** Review all modified files with `git diff`. | All changes are confirmed to be correct and intentional. | `git diff` | `[ ]` |
| | 6.2 | **Commit Changes:** Stage and commit the completed feature. | `git status` shows no uncommitted changes related to this feature. | `git add .` | `[ ]` |
| | 6.3 | **Log Session:** Create a new dev log summarizing the work. | A new log file exists in the `dev_logs` directory. | `--create-dev-log "Implemented Shared Uses archetype workflow."` | `[ ]` |

---

To begin, I will execute **Task 1.1**. I will read the contents of `frontend/character-builder/features/special-attacks/SpecialAttackTab.js` to analyze its current structure.