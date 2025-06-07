# Calculators Layer - AI Purity Contract

## Golden Rule #1: Pure Functions Only

-   All methods **MUST** be `static`.
-   A calculator method **MUST ALWAYS** return the same output for the same input.
-   Methods **MUST NOT** modify the character object or have any other side effects.

## Golden Rule #2: No Dependencies

-   Calculators **MUST NOT** `import` any files from the `ui/` or `systems/` directories.
-   Allowed imports: `GameConstants.js` and `TierSystem.js` for formulas.

## Golden Rule #3: Return Breakdowns

-   Complex calculations (e.g., `calculateAllStats`, `calculateAllPools`) **MUST** return a result object that includes both the final calculated value and a `breakdown` object showing how the value was derived. This is critical for debugging.
