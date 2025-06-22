# Phase 23A: Main Pool Tab Event Listener Refactoring

**Date:** 2025-06-10
**Status:** ✅ Completed 
**Objective:** Eliminate stale event listeners in Main Pool Tab that prevented section tabs and trait card interactions from working after character updates.

---

## Technical Debug Log: 23A - Complete Success

**Problem Statement:**
The Main Pool Tab's section navigation tabs (Flaws, Traits, Boons, etc.) and interactive elements within the Traits tab would stop responding to clicks after any character update operation. Users could no longer switch between sections or select trait cards, making the interface effectively broken after the first interaction.

**Initial Hypothesis:**
The issue was identified as a classic "stale event listener" problem caused by the anti-pattern of using a simple boolean flag (`this.listenersAttached = false`) to manage event listener lifecycle. This approach failed to properly clean up old listeners when components re-rendered, resulting in multiple ghost listeners that interfered with proper event handling.

**Investigation & Action (The Staged Approach):**

*   **Action 23A.1 (Architecture Analysis):** Consulted the refactoring cookbook's Section-to-Filepath Mapping to identify `rulebook/character-builder/features/main-pool/MainPoolTab.js` as the entry point for the Main Pool Tab functionality.

*   **Action 23A.2 (Code Review):** Analyzed the existing event handling pattern in `MainPoolTab.js` and confirmed it violated the mandatory Component Re-render Contract defined in `features/CLAUDE.md` by using the forbidden boolean flag pattern.

*   **Action 23A.3 (Lifecycle Redesign):** Applied the STALE_EVENT_LISTENERS recipe by replacing the boolean flag with proper handler references. Changed constructor to initialize `this.clickHandler = null`, `this.changeHandler = null`, and `this.containerElement = null`.

*   **Action 23A.4 (Cleanup Implementation):** Created a dedicated `removeEventListeners()` method that properly detaches both click and change event listeners using `removeEventListener()` and nullifies all handler references to prevent memory leaks.

*   **Action 23A.5 (Setup Refactoring):** Completely rewrote `setupEventListeners()` to call `this.removeEventListeners()` first, then create new handler functions stored as class properties before attaching them to the container element.

*   **Action 23A.6 (Event Logic Consolidation):** Replaced the complex `EventManager.delegateEvents()` pattern with a simpler manual event delegation approach using `e.target.closest()` and switch statements for better control and debugging visibility.

**Result:**
The Main Pool Tab now properly manages its event listener lifecycle. Section tabs and trait card interactions work consistently after character updates. The new implementation follows the mandatory architectural pattern defined in the codebase constitution, ensuring no stale listeners accumulate during component re-renders.

**Conclusion & Lesson Learned:**
The root cause was violating the Component Re-render Contract by using insufficient lifecycle management. The lesson reinforced that proper event listener cleanup is mandatory for any component that re-renders itself. This architectural principle must be applied consistently across all tab components to prevent similar issues. The STALE_EVENT_LISTENERS recipe proved effective and should be the standard approach for fixing event handling bugs in the character builder.
---