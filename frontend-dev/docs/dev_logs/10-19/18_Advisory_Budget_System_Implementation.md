# Phase 18: Advisory Budget System Implementation

## Objective
To transition the application from a "blocking" budget system (where users cannot purchase unaffordable items) to a "non-blocking advisory" system, where they can go over budget but receive clear warnings.

## Outcome
-   Removed all disabled logic from purchase buttons that was based on point affordability.
-   Implemented a showNotification method in CharacterBuilder.js to display non-blocking warning messages.
-   All purchase handlers were updated to check the budget, show a warning if exceeded, but proceed with the purchase regardless.
-   **Result:** A more flexible user experience that trusts the user while still providing necessary guidance.
