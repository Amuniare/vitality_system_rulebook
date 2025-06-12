# Phase 14: Special Attacks Input Fix

## Objective
To fix an issue where input fields in the Special Attacks tab (e.g., Attack Name, Description) were losing focus and resetting on every character update, making them unusable.

## Outcome
-   Identified that the onCharacterUpdate method was triggering a full re-render of the tab.
-   Modified the event handlers for these inputs to update the character model directly without triggering a full re-render, only calling character.touch() to update the timestamp for auto-saving.
-   **Result:** The input fields are now stable and usable.
