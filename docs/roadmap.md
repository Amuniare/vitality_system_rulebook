Understood. You want to streamline the execution of the roadmap by removing the explicit approval gates, allowing the AI to proceed with each step more autonomously. The process will still be transparent, as the AI will state its intent before acting, but it won't pause and wait for a "go" command for every single change.

Here is the revised `roadmap.md` designed for this more automated workflow.

---
### **`docs/roadmap.md` (Autonomous Execution Version)**

# Roadmap: Talent Expertise System Implementation

**Objective:** To replace the existing "Situational Expertise" system with a new, player-driven "Talent Expertise" system. This roadmap outlines the granular, step-by-step tasks to be executed in a streamlined, automated fashion.

---

## **Phase 1: Data Model & System Logic Foundation**

**Goal:** Update the core data structures and business logic to support the new system.

*   [ ] **Step 1.1: Analyze Character Data Model**
    *   **Action:** Read the contents of `frontend/character-builder/core/VitalityCharacter.js`.
    *   **Goal:** Understand the current structure of the `utilityPurchases.expertise` object.

*   [ ] **Step 1.2: Implement Data Model Changes**
    *   **Action:** Modify `VitalityCharacter.js` to replace the attribute-keyed `expertise` object with a simple `situational: []` array for Talent Sets. Add the `createSituationalExpertise` helper method to the class.
    *   **AI Instruction:** Generate and execute the `--write-code` command to apply the changes.

*   [ ] **Step 1.3: Stage Changes**
    *   **Action:** Run `git add .` to stage the updated `VitalityCharacter.js`.

*   [ ] **Step 1.4: Analyze Game Data**
    *   **Action:** Read the contents of `frontend/character-builder/data/expertise.json`.
    *   **Goal:** Understand the current structure and identify the sections to be removed.

*   [ ] **Step 1.5: Implement Game Data Changes**
    *   **Action:** Update `expertise.json` to remove the old situational definitions and add the new metadata (`maxCount: 3`, `talentsPerExpertise: 3`).
    *   **AI Instruction:** Generate and execute the `--write-code` command.

*   [ ] **Step 1.6: Stage Changes**
    *   **Action:** Run `git add .` to stage the updated `expertise.json`.

*   [ ] **Step 1.7: Analyze System Logic**
    *   **Action:** Read the contents of `frontend/character-builder/systems/UtilitySystem.js`.
    *   **Goal:** Identify all methods related to the old situational expertise system that need to be removed or refactored.

*   [ ] **Step 1.8: Implement System Logic Changes**
    *   **Action:** Implement the new methods in `UtilitySystem.js`: `addSituationalExpertise`, `updateSituationalTalent`, `purchaseSituationalExpertise`, and `removeSituationalExpertise`. Update `calculateUtilityPointsSpent` to handle the new data structure.
    *   **AI Instruction:** Generate and execute the `--write-code` command.

*   [ ] **Step 1.9: Stage Changes**
    *   **Action:** Run `git add .` to stage the updated `UtilitySystem.js`.

---

## **Phase 2: User Interface Implementation**

**Goal:** Build the new user interface in the Utility tab for creating and managing Talent Sets.

*   [ ] **Step 2.1: Analyze UI Components**
    *   **Action:** Read `frontend/character-builder/features/utility/components/ExpertiseSection.js` and `frontend/character-builder/features/utility/UtilityTab.js`.
    *   **Goal:** Understand how the current expertise UI is rendered and how events are handled.

*   [ ] **Step 2.2: Implement UI Rendering Logic**
    *   **Action:** Rewrite the `renderSituationalExpertise` and related methods in `ExpertiseSection.js` to display a counter (`X/3`), cards for purchased sets with editable text inputs, and a "Create New" card if under the limit.
    *   **AI Instruction:** Generate and execute the `--write-code` command.

*   [ ] **Step 2.3: Stage Changes**
    *   **Action:** Run `git add .` to stage the updated `ExpertiseSection.js`.

*   [ ] **Step 2.4: Implement Event Handling**
    *   **Action:** Add new event handlers in `UtilityTab.js` to manage the new UI, including creation, updates, upgrades, and removal of Talent Sets.
    *   **AI Instruction:** Generate and execute the `--write-code` command.

*   [ ] **Step 2.5: Stage Changes**
    *   **Action:** Run `git add .` to stage the updated `UtilityTab.js`.

*   [ ] **Step 2.6: Implement CSS**
    *   **Action:** Add new CSS rules to `frontend/character-builder/assets/css/tabs/_utility.css` for the `.talent-inputs` class to ensure proper spacing and alignment.
    *   **AI Instruction:** Generate and execute the `--write-code` command.

*   [ ] **Step 2.7: Build and Stage CSS**
    *   **Action:** Run the CSS build script (`node tools/build-css.js`).
    *   **Action:** Run `git add .` to stage the updated CSS files.

---

## **Phase 3: Integration & Finalization**

**Goal:** Ensure the new system works with the rest of the application and is properly documented.

*   [ ] **Step 3.1: Analyze Summary Component**
    *   **Action:** Read `frontend/character-builder/features/summary/components/UtilityAbilitiesSummary.js`.
    *   **Goal:** Understand how utility purchases are currently displayed.

*   [ ] **Step 3.2: Implement Summary Display**
    *   **Action:** Modify `UtilityAbilitiesSummary.js` to correctly read the new `talentSets` array and display the custom talents on the summary screen.
    *   **AI Instruction:** Generate and execute the `--write-code` command.

*   [ ] **Step 3.3: Stage Changes**
    *   **Action:** Run `git add .` to stage the updated `UtilityAbilitiesSummary.js`.

*   [ ] **Step 3.4: Create Specification Document**
    *   **Action:** Generate and write the content for a new file: `docs/spec_situational_expertise_redesign.md`, detailing the new rules, data structures, and UI flow.
    *   **AI Instruction:** Generate and execute the `--create-file` command.

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