# Phase 33: Situational Expertise Attribute Selector Removal

**Date:** 2025-06-13
**Status:** ✅ Completed
**Objective:** Fix "Could not find attribute selector. UI may be out of sync" error in situational expertise talent set creation by removing inappropriate attribute selector logic.

---

## 1. Problem Analysis

When attempting to purchase a talent set in situational expertises, users encountered a critical error: "Could not find attribute selector. UI may be out of sync." This prevented any talent set creation and blocked the situational expertise system functionality.

The error occurred during talent set creation when the system tried to find an attribute selector dropdown that should not exist for situational expertises, since they are context-based rather than attribute-based.

### Root Cause

This was a classic **Data-Contract Violation** (Recipe 1) where the UI rendering code and event handler code had mismatched expectations:

- **Handler Code Expectation**: `UtilityTab.js:337` expected to find a `[data-create-attribute]` selector to determine which attribute the talent set should be associated with
- **UI Reality**: `ExpertiseSection.js` rendered talent set creation UI without any attribute selector, as situational expertises don't use attributes
- **Contract Violation**: The handler assumed attribute selection was required, but the UI correctly omitted it for situational context

The fundamental architectural issue was that situational expertises were being processed with attribute-based logic inherited from activity-based expertises.

---

## 2. Solution Implemented

Applied the Data-Contract-Violation bugfix recipe by removing the inappropriate attribute selector logic and replacing it with situational-specific handling.

### Key Changes:
*   **UtilityTab.js**: Removed attribute selector search and validation, replaced with direct 'situational' assignment
*   **ExpertiseSection.js**: Confirmed removal of attribute selector dropdown from talent set creation template

```javascript
// BEFORE: Searching for non-existent attribute selector
const attributeSelector = card.querySelector('[data-create-attribute]');
if (!attributeSelector) {
    this.builder.showNotification('Could not find attribute selector. UI may be out of sync.', 'error');
    element.disabled = false;
    return;
}
const selectedAttribute = attributeSelector ? attributeSelector.value : 'focus';

// AFTER: Direct assignment for situational expertises
// Situational expertises don't use attributes - they are situational
const selectedAttribute = 'situational';
```

---

## 3. Technical Details

### Error Pattern
This followed the exact Data-Contract-Violation pattern:
1. **UI Component**: Correctly rendered situational expertise form without attribute selection
2. **Handler Logic**: Incorrectly assumed attribute selector would exist
3. **Contract Mismatch**: Handler expected DOM element that UI didn't provide

### Files Modified
- `frontend/character-builder/features/utility/UtilityTab.js:336-343` - Removed attribute selector logic and error handling
- `frontend/character-builder/features/utility/components/ExpertiseSection.js` - Confirmed attribute selector was already absent from template

### Architectural Alignment
This fix aligns with the core principle that situational expertises are context-based rather than attribute-based, ensuring the system behavior matches the conceptual design.

---

## 4. Testing Results

✅ **Talent Set Creation**: Users can now successfully create and purchase talent sets in situational expertises without errors
✅ **Error Resolution**: "Could not find attribute selector" error no longer appears
✅ **System Consistency**: Situational expertises now properly use 'situational' as their attribute designation

---

## 5. Lessons Learned

This bug reinforced the importance of ensuring that shared handler logic is updated when new system variants are introduced. The situational expertise system required different handling than activity-based expertises, but initially inherited inappropriate logic patterns.

The Data-Contract-Violation recipe proved effective for quickly identifying and resolving the UI/handler mismatch.

---

**Notes:** This fix completes the separation of situational and activity-based expertise handling, ensuring each system operates according to its intended design patterns.