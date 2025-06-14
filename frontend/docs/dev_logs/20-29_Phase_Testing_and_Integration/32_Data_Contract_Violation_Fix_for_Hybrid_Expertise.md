
# Phase 32: Data Contract Violation Fix for Hybrid Expertise System

**Date:** 2025-06-13
**Status:** ✅ Completed
**Objective:** To resolve the `TypeError: category.basic is undefined` crash by consolidating the correct calculation logic into `PointPoolCalculator.js` and removing the duplicated, incorrect logic from `UtilitySystem.js`.

---

## 1. Problem Analysis

After the introduction of the new "Talent Set" (situational) expertise system, any attempt to purchase *any* type of expertise (both old activity-based and new situational) would result in a hard crash. The console log showed a `TypeError: category.basic is undefined` originating from `PointPoolCalculator.js`. This indicated that the calculator was not designed to handle the hybrid data structure now present in `character.utilityPurchases.expertise`.

### Root Cause

This was a classic **Data-Contract Violation**. The `PointPoolCalculator.js` file contained outdated logic that assumed every property within the `expertise` object was another object with a `.basic` property (e.g., `expertise.power.basic`). However, the new `situational` expertise is an array (`expertise.situational: []`), which does not have this property.

Further investigation revealed that a more robust, correct version of the calculation logic already existed in `UtilitySystem.js`, creating a dangerous code duplication and violating the architectural principle that all calculations must reside in the `calculators/` directory.

---

## 2. Solution Implemented

The solution involved a two-step consolidation process to enforce a single source of truth for the calculation logic, directly following the "Data-Contract Violation" bugfix recipe.

### Key Changes:
*   **Consolidated Logic:** The robust calculation logic from `UtilitySystem.js`, which correctly handles both object and array types within the expertise data, was moved into `PointPoolCalculator.js`, replacing the old, brittle implementation.
*   **Removed Duplication:** The now-redundant `calculateUtilityPointsSpent` method was completely deleted from `UtilitySystem.js`, ensuring that all utility point calculations now originate from a single, correct source.

```javascript
// BEFORE (in PointPoolCalculator.js): This code crashed on the 'situational' array.
Object.values(character.utilityPurchases.expertise).forEach(category => {
    spent += category.basic.length * GameConstants.EXPERTISE_ACTIVITY_BASIC; // CRASHES HERE
    spent += category.mastered.length * GameConstants.EXPERTISE_ACTIVITY_MASTERED;
});

// AFTER (in PointPoolCalculator.js): This robust logic handles both data structures.
Object.entries(character.utilityPurchases.expertise).forEach(([attrKey, category]) => {
    if (attrKey === 'situational') { // Correctly handles the array case
        (category || []).forEach(expertise => {
            if (expertise.level === 'basic') spent += costs.situational.basic.cost;
            else if (expertise.level === 'mastered') spent += costs.situational.mastered.cost;
        });
        return;
    }
    // ... handles the object case for activity-based expertise
});

3. Architectural Impact & Lessons Learned

Impact: This fix reinforces the architectural separation of concerns by ensuring that all calculation logic resides exclusively in the calculators/ directory. It makes the PointPoolCalculator more resilient to future data structure changes and eliminates a source of code rot by removing duplicated logic.

Lessons Learned: This was a textbook example of the "Data-Contract Violation" pattern. It highlights the critical importance of ensuring that shared systems (like calculators) are updated to handle any changes to the core data models they consume. It also underscores the danger of duplicated logic, as one part of the code was correct while the other was stale and causing crashes.

4. Files Modified

frontend/character-builder/calculators/PointPoolCalculator.js: Replaced the buggy calculateUtilityPoolSpent method with the correct, robust logic.

frontend/character-builder/systems/UtilitySystem.js: Deleted the redundant calculateUtilityPointsSpent method.
