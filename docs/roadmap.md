# Roadmap: Talent Expertise System Implementation

**Objective:** To replace the existing "Situational Expertise" system with a new, player-driven "Talent Expertise" system. This roadmap outlines the granular, step-by-step tasks required for a successful implementation, designed to be executed by an AI assistant under human supervision.

---

## **Phase 1: Data Model & System Logic Foundation**

**Goal:** Update the core data structures and business logic to support the new system.

*   [ ] **Step 1.1: Analyze Character Data Model**
    *   **Action:** Read the contents of `frontend/character-builder/core/VitalityCharacter.js`.
    *   **Goal:** Understand the current structure of the `utilityPurchases.expertise` object.

*   [ ] **Step 1.2: Propose & Implement Data Model Changes**
    *   **Action:** Propose changes to `VitalityCharacter.js` to replace the attribute-keyed `expertise` object with a simple `situational: []` array for Talent Sets. Also, add the `createSituationalExpertise` helper method to the class.
    *   **AI Instruction:** After I approve the changes, generate the `--write-code` command to apply them.

*   [ ] **Step 1.3: Stage Changes**
    *   **Action:** Run `git add .` to stage the updated `VitalityCharacter.js`.

*   [ ] **Step 1.4: Analyze Game Data**
    *   **Action:** Read the contents of `frontend/character-builder/data/expertise.json`.
    *   **Goal:** Understand the current structure and identify the sections to be removed.

*   [ ] **Step 1.5: Propose & Implement Game Data Changes**
    *   **Action:** Propose an updated `expertise.json` that removes the old situational definitions and adds the new metadata (`maxCount: 3`, `talentsPerExpertise: 3`).
    *   **AI Instruction:** After I approve, generate the `--write-code` command.

*   [ ] **Step 1.6: Stage Changes**
    *   **Action:** Run `git add .` to stage the updated `expertise.json`.

*   [ ] **Step 1.7: Analyze System Logic**
    *   **Action:** Read the contents of `frontend/character-builder/systems/UtilitySystem.js`.
    *   **Goal:** Identify all methods related to the old situational expertise system that need to be removed or refactored.

*   [ ] **Step 1.8: Propose & Implement System Logic Changes**
    *   **Action:** Propose the new methods for `UtilitySystem.js`: `addSituationalExpertise`, `updateSituationalTalent`, `purchaseSituationalExpertise`, and `removeSituationalExpertise`. Also, update `calculateUtilityPointsSpent` to handle the new data structure.
    *   **AI Instruction:** After I approve, generate the `--write-code` command.

*   [ ] **Step 1.9: Stage Changes**
    *   **Action:** Run `git add .` to stage the updated `UtilitySystem.js`.

---

## **Phase 2: User Interface Implementation**

**Goal:** Build the new user interface in the Utility tab for creating and managing Talent Sets.

*   [ ] **Step 2.1: Analyze UI Components**
    *   **Action:** Read `frontend/character-builder/features/utility/components/ExpertiseSection.js` and `frontend/character-builder/features/utility/UtilityTab.js`.
    *   **Goal:** Understand how the current expertise UI is rendered and how events are handled.

*   [ ] **Step 2.2: Propose & Implement UI Rendering Logic**
    *   **Action:** Propose a complete rewrite of the `renderSituationalExpertise` and related methods in `ExpertiseSection.js`. The new UI should display a counter (`X/3`), cards for purchased sets with editable text inputs, and a "Create New" card if under the limit.
    *   **AI Instruction:** This will be a large change. We will review it carefully. After approval, generate the `--write-code` command.

*   [ ] **Step 2.3: Stage Changes**
    *   **Action:** Run `git add .` to stage the updated `ExpertiseSection.js`.

*   [ ] **Step 2.4: Propose & Implement Event Handling**
    *   **Action:** Propose the addition of new event handlers in `UtilityTab.js` to manage the new UI. This includes handlers for `create-and-purchase-situational-expertise`, `update-situational-talent` (on input), `purchase-situational-expertise` (for upgrades), and `remove-situational-expertise`.
    *   **AI Instruction:** After I approve, generate the `--write-code` command.

*   [ ] **Step 2.5: Stage Changes**
    *   **Action:** Run `git add .` to stage the updated `UtilityTab.js`.

*   [ ] **Step 2.6: Propose & Implement CSS**
    *   **Action:** Propose new CSS rules in `frontend/character-builder/assets/css/tabs/_utility.css` for the `.talent-inputs` class to ensure proper spacing and alignment of the new textboxes.
    *   **AI Instruction:** After I approve, generate the `--write-code` command.

*   [ ] **Step 2.7: Build and Stage CSS**
    *   **Action:** Run the CSS build script (`node tools/build-css.js`).
    *   **Action:** Run `git add .` to stage the updated CSS files.

---

## **Phase 3: Integration & Finalization**

**Goal:** Ensure the new system works with the rest of the application and is properly documented.

*   [ ] **Step 3.1: Analyze Summary Component**
    *   **Action:** Read `frontend/character-builder/features/summary/components/UtilityAbilitiesSummary.js`.
    *   **Goal:** Understand how utility purchases are currently displayed.

*   [ ] **Step 3.2: Propose & Implement Summary Display**
    *   **Action:** Propose changes to `UtilityAbilitiesSummary.js` to correctly read the new `talentSets` array from the character object and display the custom talents on the summary screen.
    *   **AI Instruction:** After approval, generate the `--write-code` command.

*   [ ] **Step 3.3: Stage Changes**
    *   **Action:** Run `git add .` to stage the updated `UtilityAbilitiesSummary.js`.

*   [ ] **Step 3.4: Create Specification Document**
    *   **Action:** Generate the content for a new file: `docs/spec_situational_expertise_redesign.md`. The document should detail the new rules, data structures, and UI flow for the Talent Expertise system.
    *   **AI Instruction:** After I approve the content, generate the `--create-file` command.

*   [ ] **Step 3.5: Stage Changes**
    *   **Action:** Run `git add .` to stage the new specification document.

*   [ ] **Step 3.6: Manual Testing & Verification**
    *   **Action:** I will manually test the feature against the following checklist.
        *   [ ] Can a new Talent Set be purchased at the "Basic" level for 1 point?
        *   [ ] Are the three talent textboxes editable?
        *   [ ] Does the UI prevent purchasing more than 3 Talent Sets?
        *   [ ] Can a "Basic" set be upgraded to "Mastered" for 2 additional points?
        *   [ ] Does removing a set correctly refund the points (1 for basic, 3 for mastered)?
        *   [ ] Does the Summary Tab correctly display the custom talent names?
        *   [ ] Does loading an old character without the new data structure cause any errors?

