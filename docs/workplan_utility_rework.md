Of course. Based on a detailed analysis of the `frontend/character-builder/` directory, its dev logs, and project documentation, here is a comprehensive to-do list of everything that needs to be done on the frontend.

The tasks are broken down into categories: Critical Bug Fixes, UI/UX Improvements, New Feature Implementation, and Data/System Architecture Refinements.

---

### **Frontend Character Builder To-Do List**

#### 1. High-Priority Bug Fixes
These issues are actively breaking core functionality and should be addressed first.

*   **Fix Situational Expertise Purchase Validation:**
    *   **Problem:** The system crashes with a `TypeError: category.basic is undefined` when purchasing any expertise, because the validation logic in `PointPoolCalculator.js` doesn't account for the new "Talent Set" (situational) array format. This is the most critical bug.
    *   **File(s) to Fix:** `frontend/character-builder/calculators/PointPoolCalculator.js`, `frontend/character-builder/systems/UtilitySystem.js`.
    *   **Reference:** Dev Log `32_Data_Contract_Violation_Fix_for_Hybrid_Expertise.md` indicates this was thought to be fixed, but `30_Situational_Expertise_Custom_Talents_Implementation.md` notes it's still an outstanding issue.

*   **Fix "Jack of All Trades" Archetype Bug:**
    *   **Problem:** As noted in `docs/notes.md`, the "Jack of All Trades" utility archetype is incorrectly preventing the purchase of Tier 2 expertise levels.
    *   **File(s) to Fix:** `frontend/character-builder/systems/UtilitySystem.js` (in the `validateUtilityPurchase` method).

*   **Fix Non-Functional "Create Custom Sense" Button:**
    *   **Problem:** The button to create a custom sense in the Utility tab is not working. This is likely due to an event handler issue or a problem in the `CustomUtilityForm.js` component logic.
    *   **File(s) to Fix:** `frontend/character-builder/features/utility/UtilityTab.js`, `frontend/character-builder/features/utility/components/CustomUtilityForm.js`.

*   **Fix Unresponsive Special Attack Inputs:**
    *   **Problem:** Text `input` and `textarea` fields in the Special Attacks tab lose focus or don't update correctly because of the tab's re-rendering logic.
    *   **File(s) to Fix:** `frontend/character-builder/features/special-attacks/SpecialAttackTab.js` needs to refine its event handling to avoid full re-renders on simple text input.

#### 2. UI/UX Improvements
These are quality-of-life improvements to make the application more intuitive and user-friendly.

*   **Integrate Rulebook Content:**
    *   **Problem:** The application lacks descriptive text from the rulebook. Users need more in-app guidance.
    *   **Action:** Add tooltips, info icons, or expandable sections to cards and form groups that display detailed rule descriptions from `frontend/rules/rulebook.md`. This is a large-scale content integration task.

*   **Improve Situational Expertise (Talent Set) UI:**
    *   **Problem:** The "Create Custom Limit" section in the Special Attacks tab is not expandable, which is inconsistent with the rest of the UI in that section.
    *   **Action:** Refactor the custom limit creation UI in `LimitSelection.js` to be an expandable section, similar to the main limit categories.
    *   **Reference:** Dev Logs `22B` and `22C`.

*   **Polish Custom Talent UI:**
    *   **Problem:** The UI for creating custom talents in the Utility tab needs better alignment and spacing.
    *   **Action:** Adjust the CSS in `frontend/character-builder/assets/css/tabs/_utility.css` for the `.talent-inputs` and `.talent-input` classes.
    *   **Reference:** `docs/projects.md` (Project 3).

#### 3. New Feature Implementation
These are major features outlined in `docs/projects.md` that need to be built.

*   **Implement "Identity" Tab:**
    *   **Feature:** Create a new tab for character identity and biography, driven by `frontend/character-builder/data/bio.json`.
    *   **Action:**
        1.  Create a new `IdentityTab.js` in the `features/` directory.
        2.  Update `CharacterBuilder.js` to include the new tab in the navigation.
        3.  The tab should dynamically render the questionnaire from `bio.json`, including dropdowns and text areas.
        4.  Implement logic for conditional "Other" text fields.

*   **Implement Dedicated "Base Attack" System:**
    *   **Feature:** The current method of upgrading the base attack by using a Special Attack slot is a workaround. A dedicated system is needed.
    *   **Action:**
        1.  Create a new "Base Attack" tab.
        2.  Develop a `BaseAttackSystem.js` to manage its logic and point costs.
        3.  Modify the "Basic" Special Attack archetype to once again block the creation of any special attacks, as its points will be used by this new system.
    *   **Reference:** `docs/projects.md` (Project 8).

*   **Implement Advanced Condition Costs:**
    *   **Feature:** Special attacks should only get free access to Advanced Conditions if the character has the 'Crowd Control' archetype. Otherwise, they must pay points.
    *   **Action:**
        1.  Update `data/conditions_advanced.json` to include a `"cost"` property for each condition.
        2.  Modify `SpecialAttackSystem.js` to deduct points if the archetype is not 'Crowd Control'.
        3.  Update the UI in `AttackBasicsForm.js` to display these costs.
    *   **Reference:** `docs/projects.md` (Project 10).

#### 4. Data & System Architecture Refinements

*   **Externalize Limit Purchase Rules:**
    *   **Problem:** The logic for whether an archetype can purchase limits is hardcoded in `SpecialAttackSystem.js`.
    *   **Action:** Add a boolean flag (e.g., `"canUseLimits": false`) to each archetype definition in `frontend/character-builder/data/archetypes.json` and have the system read from this flag.

*   **Implement Automated Basic Attacks:**
    *   **Problem:** Characters should have default attacks generated automatically based on their archetypes.
    *   **Action:** Create a `BasicAttackSystem.js` that automatically adds default "Base Attack" objects to a character's `specialAttacks` array based on their selected `attackType` and `effectType` archetypes.
    *   **Reference:** `docs/projects.md` (Project 3).

*   **Add Generic Attack Upgrades:**
    *   **Problem:** The system lacks generic upgrades for things like improving range.
    *   **Action:**
        1.  Add a new top-level category `"Generic Attack Upgrades"` to `data/upgrades.json`.
        2.  Populate it with new upgrades like `Extended Range` and `Precise`.
        3.  Verify that `UpgradeSelection.js` automatically renders this new category without code changes.
    *   **Reference:** `docs/projects.md` (Project 10).


Of course. Here is a comprehensive, granular roadmap for all the pending work on the `frontend/character-builder/`.

The roadmap is broken down into five logical phases, starting with critical bug fixes and progressively moving toward new feature implementation and architectural refinements. Each task includes the specific files to be modified and a clear verification step to confirm completion.

---

# Frontend Character Builder: Development Roadmap

**Objective:** To provide a clear, step-by-step plan for resolving all outstanding bugs, implementing new features, and improving the architecture of the Character Builder application.

| Phase | Task ID | Action (What to Do) | File(s) to Modify | Verification (How We Know It's Done) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Foundation & Critical Bug Fixes** | 1.1 | **Fix Expertise Purchase Crash:** Consolidate the correct utility point calculation logic from `UtilitySystem.js` into `PointPoolCalculator.js` to handle the new hybrid (activity/situational) expertise data structure. | `calculators/PointPoolCalculator.js`<br>`systems/UtilitySystem.js` | Purchasing any type of Expertise no longer causes a `TypeError`. | `[ ]` |
| | 1.2 | **Fix Jack of All Trades Bug:** Modify the validation logic to allow the "Jack of All Trades" archetype to correctly purchase Tier 2 expertise levels. | `systems/UtilitySystem.js` | A character with "Jack of All Trades" can purchase a "Mastered" level expertise. | `[ ]` |
| | 1.3 | **Fix Custom Sense Button:** Implement the event handler and system logic for the "Create Custom Sense" button in the Utility tab. | `features/utility/UtilityTab.js`<br>`features/utility/components/CustomUtilityForm.js` | Clicking the button opens the form, and submitting it successfully creates and purchases a custom sense. | `[ ]` |
| | 1.4 | **Fix Special Attack Input Focus:** Refactor the `SpecialAttackTab.js` event handlers for text inputs to update the model without a full re-render, preventing the fields from losing focus. | `features/special-attacks/SpecialAttackTab.js` | Typing in the Attack Name or Description fields is smooth and does not lose focus. | `[ ]` |
| **2. UI/UX Polish & Refinements** | 2.1 | **Implement Expandable Custom Limit Form:** Refactor the "Create Custom Limit" UI to be an expandable/collapsible section, consistent with other limit categories. | `features/special-attacks/components/LimitSelection.js` | The "Create Custom Limit" section can be toggled open and closed. | `[ ]` |
| | 2.2 | **Polish Custom Talent UI:** Adjust the CSS for `.talent-inputs` to improve the alignment, spacing, and visual presentation of the custom talent textboxes. | `assets/css/tabs/_utility.css` | The three talent input fields in the Utility tab are neatly aligned with consistent spacing. | `[ ]` |
| | 2.3 | **Integrate Rulebook Content (Phase 1):** Add info icons (`<i>`) with tooltips next to key concepts (e.g., Archetypes, Attributes) that display descriptions from `rulebook.md` on hover. | `features/archetypes/ArchetypeTab.js`<br>`features/attributes/AttributeTab.js` | Hovering over an info icon next to an Archetype name displays its full description. | `[ ]` |
| **3. Core Feature: Identity Tab** | 3.1 | **Create Bio Data File:** Create the `data/bio.json` file with a structured questionnaire format (questions, types, options). | `data/bio.json` | The `bio.json` file exists and is populated with the questionnaire structure. | `[ ]` |
| | 3.2 | **Integrate Bio Data:** Add `bio.json` to the `GameDataManager.js` manifest and create a `getBioQuestions()` getter method. | `core/GameDataManager.js` | `gameDataManager.getBioQuestions()` returns the array of questions from the JSON file. | `[ ]` |
| | 3.3 | **Update Character Model:** Add a `biographyDetails: {}` object to the `VitalityCharacter.js` data model to store answers. | `core/VitalityCharacter.js` | The `VitalityCharacter` class includes the new `biographyDetails` property. | `[ ]` |
| | 3.4 | **Create Identity Tab:** Create `features/identity/IdentityTab.js` and add it to the main navigation in `CharacterBuilder.js`. The tab should dynamically render the questionnaire. | `features/identity/IdentityTab.js`<br>`app/CharacterBuilder.js` | A new "Identity" tab appears in the UI and displays the questions from `bio.json`. | `[ ]` |
| | 3.5 | **Implement Conditional "Other" Field:** Add event listeners in `IdentityTab.js` to show/hide a text input field when the "Other" option is selected in a dropdown. | `features/identity/IdentityTab.js` | Selecting "Other" in a bio dropdown reveals a text box for custom input. | `[ ]` |
| **4. Advanced Feature: New Systems**| 4.1 | **Implement Advanced Condition Costs:** Add a `"cost"` property to `data/conditions_advanced.json`. Modify `SpecialAttackSystem.js` to deduct this cost if the character's archetype is not 'Crowd Control'. | `data/conditions_advanced.json`<br>`systems/SpecialAttackSystem.js` | Purchasing an advanced condition for a non-Crowd Control character correctly deducts points. | `[ ]` |
| | 4.2 | **Implement Dedicated Base Attack System:** Create a new "Base Attack" tab and `BaseAttackSystem.js`. Logic should allow spending points from the "Basic" Special Attack archetype to upgrade the default attack. | `features/base-attack/BaseAttackTab.js`<br>`systems/BaseAttackSystem.js` | The new tab appears, and points from the "Basic" archetype can be spent on base attack upgrades. | `[ ]` |
| | 4.3 | **Deprecate Base Attack Workaround:** Once the dedicated system is in place, modify the "Basic" archetype in `data/archetypes.json` to once again block the creation of any special attacks. | `data/archetypes.json` | A character with the "Basic" archetype can no longer create any special attacks from the Special Attacks tab. | `[ ]` |
| **5. Architecture & Data Refinements** | 5.1 | **Externalize Limit Rules:** Add a `"canUseLimits": boolean` property to each special attack archetype in `data/archetypes.json`. | `data/archetypes.json` | The JSON file contains the new property for each special attack archetype. | `[ ]` |
| | 5.2 | **Refactor Limit Validation:** Modify `SpecialAttackSystem.js` to read the new `canUseLimits` flag from the data file instead of using a hardcoded list of archetypes. | `systems/SpecialAttackSystem.js` | The UI correctly enables/disables the Limits section based on the JSON flag. | `[ ]` |
| | 5.3 | **Add Generic Attack Upgrades:** Add a new `"Generic Attack Upgrades"` category to `data/upgrades.json` with items like `Extended Range`. | `data/upgrades.json` | The new category and its upgrades appear for purchase in the Special Attacks tab. | `[ ]` |
| | 5.4 | **Implement Automated Basic Attacks:** Create a `BasicAttackSystem.js` that automatically adds a default "Base Attack" object to a new character's `specialAttacks` array. | `systems/BasicAttackSystem.js`<br>`app/CharacterBuilder.js` | Creating a new character automatically gives them a pre-configured "Base Attack" in the Special Attacks tab. | `[ ]` |

---

### **How to Use This Roadmap**

1.  **Work Sequentially:** Start with Phase 1 and proceed in order. The phases are designed to build upon each other, ensuring a stable foundation before adding new features.
2.  **Verify Each Step:** After completing each task, use the "Verification" column to confirm that the functionality works as expected. This prevents regressions and ensures progress.
3.  **Update Status:** Mark tasks as complete (`[x]`) to track progress.