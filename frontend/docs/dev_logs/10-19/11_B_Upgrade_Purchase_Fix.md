# Phase 11-B: Upgrade Purchase Fix

## Objective
To correct a bug where purchasing a Unique Ability upgrade was not correctly calculating its cost or adding it to the character's data model.

## Outcome
-   Debugged the UniqueAbilitySection.js component and the UniqueAbilitySystem.
-   Ensured that upgrade costs (both fixed and variable) are correctly summed with the base ability cost.
-   Fixed the data model to properly store purchased upgrades with the boon.
-   **Result:** Users can now purchase unique abilities with upgrades, and the cost is calculated correctly.
