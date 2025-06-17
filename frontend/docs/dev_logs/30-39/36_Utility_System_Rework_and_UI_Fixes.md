# Phase 36: Utility System Rework and UI Fixes

**Date:** 2025-06-17
**Status:** ? Completed
**Objective:** To refactor the entire Utility system to align with the simplified rules in workplan_rework.md, replacing the old expertise system with a new model for Talents and Utility Archetypes, and fixing subsequent UI bugs.

---

## 1. Problem Analysis

The original UtilityTab and its backing systems were built on a flawed interpretation of the game rules. It featured a complex, multi-layered expertise system that was confusing, difficult to maintain, and did not match the intended design outlined in the rulebook.

Subsequent attempts to fix this system resulted in new UI bugs. The most persistent issue was that the "Practical" archetype's skill cards would not visually update upon selection, even though the underlying data was being correctly modified. This created a confusing and broken user experience.

### Root Cause

The foundational issue was a divergence between the code's logic and the rulebook's specification. The final UI bug was caused by a specific omission in the RenderUtils.js enderCard function; it was correctly receiving the selected: true property but was failing to add the corresponding .selected CSS class to the card's HTML class list.

---

## 2. Solution Implemented

The solution was a complete, multi-phase refactoring of the entire utility system, from the data model up to the UI.

### Key Changes:

*   **System Overhaul**: The old expertise logic was removed from UtilitySystem.js and PointPoolCalculator.js. The character data model in VitalityCharacter.js was updated to remove the complex expertise object and add a simple 	alents: [] array and a utilityArchetypeSelections: {} object.

*   **UI Rewrite**: UtilityTab.js was completely rewritten. The new design presents a clear, three-part interface:
    1.  Two simple text inputs for defining the character's two Talents.
    2.  A conditional configuration section that automatically displays UI specific to the user's pre-selected Utility Archetype (e.g., skill cards for "Practical", an attribute dropdown for "Specialized").
    3.  A generic purchase area for spending points from the new, universal Utility Pool.

*   **UI Enhancement**: The "Practical" archetype's skill selection was changed from a simple checklist to a grid of interactive cards, each displaying the skill's name and full description, providing a richer user experience.

*   **Final Bug Fix**: The enderCard function in RenderUtils.js was corrected to properly apply the .selected CSS class when its selected property is true. This ensures immediate visual feedback when a user selects a skill card.

    // BEFORE (in RenderUtils.js): The 'selected' property was ignored.
    const classes = [
        baseCardClass,
        cardClass,
        clickable && !disabled ? 'clickable' : '',
        disabled ? 'disabled' : '',
        statusClass
    ].filter(Boolean).join(' ');

    // AFTER: The '.selected' class is now correctly added.
    const classes = [
        baseCardClass,
        cardClass,
        clickable && !disabled ? 'clickable' : '',
        disabled ? 'disabled' : '',
        selected ? 'selected' : '', // <-- FIX
        statusClass
    ].filter(Boolean).join(' ');
