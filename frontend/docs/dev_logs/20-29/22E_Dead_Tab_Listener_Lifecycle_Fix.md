# Phase 22E: Dead Tab Listener Lifecycle Fix

**Date:** 2025-01-09
**Status:** ✅ Completed
**Objective:** Fix the "dead tab" bug where event listeners would not re-attach when returning to a previously visited tab, causing buttons to become unresponsive.

---

## Technical Debug Log: 22E - Dead Tab Listener Lifecycle Fix

**Problem Statement:**
After fixing the UI freeze by preventing duplicate event listeners, a new "dead tab" bug emerged where event listeners would not re-attach if you left and returned to a tab. The `listenersAttached` flag correctly prevented duplication but was never reset when tabs were re-activated, causing listener setup to be permanently skipped and making buttons unresponsive.

**Initial Hypothesis:**
The `listenersAttached` flag was preventing listeners from being re-attached on subsequent tab visits. The tab-switching logic needed to ensure that components reset their listener state and properly re-bind events to fresh DOM content every time they're activated.

**Investigation & Action (The Staged Approach):**

*   **Action 22E.1 (Core Architecture Review):** Examined `CharacterBuilder.js` `switchTab()` method and confirmed it already calls `this.tabs[tabName].render()` on every tab activation, ensuring fresh DOM rendering.

*   **Action 22E.2 (UtilityTab Lifecycle Fix):** In `UtilityTab.js`, added `this.listenersAttached = false;` at the beginning of the `render()` method to reset listener state on every render cycle.

*   **Action 22E.3 (UtilityTab Update Method):** In `UtilityTab.js`, simplified `onCharacterUpdate()` method from complex cleanup logic to simply calling `this.render()`, consolidating all DOM manipulation into a single path.

*   **Action 22E.4 (MainPoolTab Lifecycle Fix):** In `MainPoolTab.js`, applied the same pattern by adding `this.listenersAttached = false;` at the beginning of the `render()` method to ensure consistent behavior across tabs.

*   **Action 22E.5 (MainPoolTab Update Method):** In `MainPoolTab.js`, simplified `onCharacterUpdate()` method to just call `this.render()`, matching the unified lifecycle approach.

**Result:**
The dead tab bug is completely resolved. Users can now navigate between tabs freely and all buttons remain responsive on every return visit. The listener guard clause `if (this.listenersAttached) return;` still prevents duplication within the same render cycle while allowing proper re-attachment on fresh renders.

**Conclusion & Lesson Learned:**
The root cause was mixing listener cleanup responsibilities between multiple methods instead of centralizing them in the render lifecycle. The key insight is that the `render()` method should be the single source of truth for both DOM structure and event listener state - it should reset the listener flag, build the HTML, and set up listeners in one predictable sequence. This creates a reliable "fresh start" pattern that prevents both duplication and dead listeners while maintaining clean separation of concerns.
---