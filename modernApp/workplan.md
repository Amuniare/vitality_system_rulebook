Okay, here's an ordered list of changes, prioritizing critical fixes and foundational elements first. This list aims to stabilize the application and ensure core rules are correctly implemented before moving on to new features or significant enhancements.

**Phase 1: Critical Core Fixes & Foundational Integrity**
*(These are the absolute first things to tackle as they affect the fundamental correctness and usability of the app.)*

1.  **Ensure Correct Rule Economics (Flaws & Traits Costing Points):**
    *   **Action:** While `PoolCalculator.js` seems to have the correct logic (Flaws/Traits cost 30 points, Main Pool is `(tier-2)*15`), you need to **verify and ensure all systems and UI tabs that interact with purchasing or displaying these entities correctly reflect this.**
    *   **Files to Check/Update:**
        *   `StateManager.js`: Ensure `_purchaseEntity` doesn't have old logic if it calculates costs (though it seems to just store).
        *   `UnifiedPurchaseSystem.js`: Confirm it doesn't apply incorrect cost logic before dispatching.
        *   `modernApp/tabs/MainPoolTab.js`: Ensure the UI correctly displays these as costs and that purchase actions use the correct cost values from `unified-game-data.json`.
        *   `modernApp/components/PurchaseCard.js` and `UniversalCard.js`: Ensure they correctly display the cost from the entity data (which *should* be `30` for Flaws/Traits).
    *   **Why First:** This is a fundamental rule error identified in `modernApp/README.md` and `modernApp/workplan.md`. The app cannot function correctly until this is fixed.

2.  **Fix Archetypes Tab Data Linking & Functionality:**
    *   **Action:** Debug and repair the `modernApp/tabs/ArchetypeTab.js` to correctly load, display, select, and persist archetype choices.
    *   **Files to Check/Update:** `modernApp/tabs/ArchetypeTab.js`, `StateManager.js` (ensure `UPDATE_ARCHETYPES` action works and persists), `EntityLoader.js` (confirm archetypes are loaded correctly).
    *   **Why Second:** Archetype selection is a core early step in character creation. If this is broken, the user journey halts.

3.  **Fix Main Pool Tab Data Display & Basic Functionality:**
    *   **Action:** Ensure `modernApp/tabs/MainPoolTab.js` correctly displays available entities (Flaws, Traits, Boons, Action Upgrades) from `unified-game-data.json` and that basic purchase/remove actions work with the corrected cost logic.
    *   **Files to Check/Update:** `modernApp/tabs/MainPoolTab.js`, `EntityLoader.js` (ensure all main pool categories are loaded), `UnifiedPurchaseSystem.js`.
    *   **Why Third:** The Main Pool is where a significant portion of character customization happens.

**Phase 2: Implement Missing Core Systems & Essential Components**
*(These are foundational systems and components required for broader application functionality and to support other tabs.)*

4.  **Implement `core/CharacterManager.js`:**
    *   **Action:** Create the `CharacterManager.js` as outlined in `Architecture.md` to handle basic CRUD for multiple characters (even if the UI for selection comes later). This is crucial for the "Character select system" mentioned as missing in `modernApp/README.md`.
    *   **Files to Create/Update:** `modernApp/core/CharacterManager.js`.
    *   **Why:** This is a core architectural piece for future expansion and addresses a key missing feature.

5.  **Implement `core/ValidationSystem.js`:**
    *   **Action:** Create `ValidationSystem.js` to provide advisory warnings (e.g., point budget overruns) as per `Architecture.md`. This system should not block actions.
    *   **Files to Create/Update:** `modernApp/core/ValidationSystem.js`.
    *   **Why:** Fulfills the "Advisory Validation" core principle.

6.  **Implement `components/PointPoolDisplay.js`:**
    *   **Action:** Flesh out the empty `PointPoolDisplay.js` stub. This component will be needed by multiple tabs (Attributes, Summary, etc.) to show point totals.
    *   **Files to Create/Update:** `modernApp/components/PointPoolDisplay.js`.
    *   **Why:** A frequently needed UI element for resource tracking.

7.  **Implement `components/Modal.js`:**
    *   **Action:** Implement the `Modal.js` component for dialogs, confirmations, etc.
    *   **Files to Create/Update:** `modernApp/components/Modal.js`.
    *   **Why:** A common UI utility that will be needed for various interactions (e.g., delete confirmations from `CharacterManager`).

**Phase 3: Complete Remaining Tabs & UI Functionality**
*(With core systems and components in place, flesh out the remaining UI sections.)*

8.  **Fix/Complete `modernApp/tabs/SpecialAttacksTab.js`:**
    *   **Action:** Address the navigation and functionality issues mentioned in `modernApp/workplan.md`. Ensure it can create, edit, and display special attacks.
    *   **Files to Check/Update:** `modernApp/tabs/SpecialAttacksTab.js`, potentially `AttackSystem.js` (if it exists or needs creation).

9.  **Implement Remaining Tabs (as per `Architecture.md` and `modernApp/README.md`):**
    *   **Action:**
        *   `modernApp/tabs/AttributesTab.js` (likely uses `PointPoolDisplay`).
        *   `modernApp/tabs/BaseAttacksTab.js` (new feature).
        *   `modernApp/tabs/IdentityTab.js` (Bio/Identity).
        *   `modernApp/tabs/UtilityTab.js`.
        *   `modernApp/tabs/SummaryTab.js`.
    *   **Why:** To achieve full character creation functionality.

**Phase 4: Advanced Features & Architectural Refinements**
*(Once the app is functionally complete and correct, address these.)*

10. **Implement Import/Export System (using `CharacterManager`):**
    *   **Action:** Create `ExportSystem.js` and integrate it with `CharacterManager.js`.
    *   **Files to Create/Update:** `modernApp/systems/ExportSystem.js`, `modernApp/core/CharacterManager.js`.
    *   **Why:** Key feature mentioned in `modernApp/README.md` and `Architecture.md`.

11. **Implement Roll20 JSON Export Format:**
    *   **Action:** Extend the `ExportSystem.js` to support Roll20-specific JSON output.
    *   **Files to Update:** `modernApp/systems/ExportSystem.js`.
    *   **Why:** A primary end-goal of the application.

12. **Standardize CSS Handling:**
    *   **Action:** Refactor components (`CollapsibleSection.js`, `UniversalForm.js`, `UniversalList.js`) that inject CSS. Move all component-specific styles to `modernApp/css/modern-app.css`.
    *   **Why:** Improves maintainability, performance, and avoids style conflicts.

13. **Enhance Universal Components (`UniversalForm`, `UniversalList`):**
    *   **Action:** Add features like real-time validation to `UniversalForm.js` and virtual scrolling to `UniversalList.js` as outlined in `Architecture.md`.
    *   **Why:** Improves UX and performance for more complex scenarios.

14. **Review and Implement Remaining Enhancements from `Architecture.md`:**
    *   **Action:** Go through `Architecture.md` section by section for `core/`, `components/`, and `utils/` and implement any remaining planned enhancements (e.g., `DataLoader` retry logic, more robust schema validation in `EntityLoader`).
    *   **Why:** To fully realize the architectural vision.

This order prioritizes fixing what's broken and essential, then building out the core systems and components, followed by completing the UI, and finally adding advanced features and refinements.