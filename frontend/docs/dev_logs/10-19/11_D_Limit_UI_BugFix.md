# Phase 11-D: Limit UI BugFix

## Objective
To fix a visual bug where selecting a limit in the Special Attacks tab would not consistently update the UI to show it as "selected."

## Outcome
-   Traced the issue to a state management problem in LimitSelection.js.
-   Ensured that after a limit is added to the character model, the component re-renders correctly, applying the .selected class to the appropriate card.
-   **Result:** The UI state now reliably matches the character's data state for limits.
