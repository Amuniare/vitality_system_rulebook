# Phase 13-D: Unique Ability Upgrade Display Fix

## Objective
To fix a UI bug where the list of purchased items in the MainPoolTab overview box was not correctly displaying the details of a Unique Ability's selected upgrades.

## Outcome
-   Modified the enderSelectedMainPoolItem method in MainPoolTab.js.
-   The method now correctly identifies unique abilities, accesses their upgrades array, and renders a detailed cost breakdown including the base cost and the cost of each selected upgrade.
-   **Result:** The overview box now provides a clear and accurate summary of complex unique ability purchases.
