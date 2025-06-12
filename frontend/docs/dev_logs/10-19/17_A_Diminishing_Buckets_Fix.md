# Phase 17-A: Diminishing Buckets Fix

## Objective
To correct the formula for calculating upgrade points from Special Attack limits, ensuring it correctly implements the three-tiered diminishing returns buckets.

## Outcome
-   Refactored the calculateLimitScaling method in TierSystem.js.
-   The logic now correctly applies 100%, 50%, and 25% value based on thresholds relative to the character's tier.
-   Updated the LimitSelection.js component to display a detailed breakdown of this calculation.
-   **Result:** The limit point conversion is now accurate and transparent to the user.
