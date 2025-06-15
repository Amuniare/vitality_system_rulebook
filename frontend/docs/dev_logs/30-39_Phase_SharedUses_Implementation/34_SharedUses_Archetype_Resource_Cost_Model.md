# Phase 34: SharedUses Archetype Resource-Cost Model Implementation

**Date:** 2025-01-15
**Status:** ✅ Completed
**Objective:** Implement complete SharedUses archetype workflow replacing the limit-based point generation system with a resource-cost model that determines upgrade budget for each attack.

---

## 1. Problem Analysis

The SharedUses special attack archetype required a fundamentally different point generation mechanism from other archetypes. While most archetypes generate upgrade points through limits (applying restrictions to gain power), the SharedUses archetype operates on a resource-cost model where players must first commit to an attack's "cost" in uses (1-3), which then determines their upgrade point budget using the formula `tier * 5 * useCost`.

The existing system had no support for this workflow, requiring users to select use costs before accessing upgrades, and no data model to store the use cost selection.

### Root Cause

The special attack system was designed exclusively around the limit-based paradigm. The UI always rendered both Limits and Upgrades columns simultaneously, the data model lacked a `useCost` property, and the point calculation system (`SpecialAttackSystem.recalculateAttackPoints`) had no conditional logic to handle alternative point generation methods.

---

## 2. Solution Implemented

Implemented a complete conditional rendering and calculation system that preserves existing functionality while adding SharedUses support. The solution follows the established architectural patterns with clean separation between data model, business logic, and UI presentation.

### Key Changes:

*   **VitalityCharacter.js:** Added `useCost: null` property to special attack data model for storing player's use cost selection (1-3).

*   **SpecialAttackSystem.js:** Implemented conditional calculation logic in `recalculateAttackPoints()` that detects SharedUses archetype and applies resource-cost formula instead of limit-based calculation.

*   **SpecialAttackTab.js:** Created conditional UI rendering system with separate helper methods for default vs SharedUses interfaces, including card-based use cost selector and proper event handling.

```javascript
// BEFORE: Single rendering path for all archetypes
renderAttackBuilder(character) {
    return `
        <div class="attack-builder-columns">
            <div class="limits-column">
                ${this.limitSelection.render(attack, character)}
            </div>
            <div class="upgrades-column">
                ${this.upgradeSelection.render(attack, character)}
            </div>
        </div>
    `;
}

// AFTER: Conditional rendering based on archetype
renderAttackBuilder(character) {
    const archetype = character.archetypes.specialAttack;
    return `
        <div class="attack-builder-columns">
            ${archetype === 'sharedUses' ? 
                this._renderSharedUsesAttackUI(attack, character) : 
                this._renderDefaultAttackUI(attack, character)
            }
        </div>
    `;
}
```

```javascript
// BEFORE: Only limit-based point calculation
static recalculateAttackPoints(character, attack) {
    const pointMethod = ArchetypeSystem.getSpecialAttackPointMethod(character);
    if (pointMethod.method === 'limits') {
        const calculationResult = TierSystem.calculateLimitScaling(attack.limitPointsTotal, character.tier, archetype);
        attack.upgradePointsFromLimits = calculationResult.finalPoints;
    }
    attack.upgradePointsAvailable = attack.upgradePointsFromLimits + attack.upgradePointsFromArchetype;
}

// AFTER: Conditional logic supporting both paradigms
static recalculateAttackPoints(character, attack) {
    const archetype = character.archetypes.specialAttack;
    
    if (archetype === 'sharedUses') {
        attack.upgradePointsFromLimits = 0;
        attack.upgradePointsFromArchetype = 0;
        if (attack.useCost && attack.useCost > 0) {
            attack.upgradePointsAvailable = character.tier * 5 * attack.useCost;
        } else {
            attack.upgradePointsAvailable = 0;
        }
    } else {
        // Original logic for all other archetypes
        const pointMethod = ArchetypeSystem.getSpecialAttackPointMethod(character);
        // ... existing calculation logic
    }
}
```

*   **Card-Based UI Design:** Implemented proper selectable card styling using existing CSS classes (`card clickable selected`) with intuitive visual feedback and descriptive content for each use cost option.

*   **Event Handling Improvements:** Fixed radio button event delegation and added immediate point recalculation to ensure real-time UI updates when selecting use costs.

---

## 3. Technical Implementation Details

**Data Flow:** Use cost selection → `selectUseCost()` → direct system recalculation → `builder.updateCharacter()` → full UI refresh

**Backward Compatibility:** All existing archetypes continue to use the original limit-based system without modification.

**UI States:** SharedUses attacks properly disable upgrade section until use cost is selected, providing clear workflow guidance.

**Event Handling Fix:** Resolved issue where points didn't update immediately by improving event delegation for radio buttons and adding explicit recalculation call.

---

## 4. Verification Results

**Regression Testing:** Existing archetypes (normal, paragon, etc.) continue to function identically with no changes to their limit-based workflow.

**New Feature Testing:** SharedUses archetype correctly displays use cost selector, calculates points using `tier * 5 * useCost` formula, and enables upgrades section after selection.

**UI/UX Testing:** Card-based selector provides consistent visual experience with other selectable elements, immediate feedback on selection, and clear point calculation display.

---

## 5. Files Modified

- `frontend/character-builder/core/VitalityCharacter.js` - Added useCost property
- `frontend/character-builder/systems/SpecialAttackSystem.js` - Conditional calculation logic  
- `frontend/character-builder/features/special-attacks/SpecialAttackTab.js` - Conditional UI rendering and event handling

**Lines of Code:** ~100 lines added across 3 files
**Complexity:** Medium - Required architectural understanding but followed existing patterns
**Risk Level:** Low - Changes are isolated and backward compatible