# Phase 41: Special Attack Condition Dropdown Fix

**Date:** 2025-01-18
**Status:** ✅ Completed
**Objective:** Fix condition dropdown behavior in Special Attacks tab to match the consistent UI pattern used by attack type and effect type dropdowns.

---

## 1. Problem Analysis

The basic and advanced condition dropdowns in the Special Attacks tab were not behaving like standard dropdowns. When a user selected a condition from the dropdown, it would immediately reset to empty instead of showing the selected value, making it appear broken or unresponsive. This inconsistent behavior differed from the attack type and effect type dropdowns, which properly displayed their selected values.

### Root Cause

The condition selectors were implemented using a custom `renderConditionSelector` method that always set the dropdown value to empty (`value: ''`) and used "add-" actions instead of "set-" actions. This caused the dropdowns to reset immediately after selection, rather than displaying the selected value like other dropdowns in the interface.

The attack type and effect type dropdowns used the `renderIntegratedSelector` method with `allowMultiple = false`, which properly shows the selected value and uses "set-" actions for single-selection behavior.

---

## 2. Solution Implemented

Replaced the custom condition selector implementation with the existing integrated selector pattern to ensure consistent behavior across all dropdown interfaces in the Special Attacks tab.

### Key Changes:
*   **AttackBasicsForm.js:** Replaced custom `renderConditionSelector` method calls with `renderIntegratedSelector` method calls, using `allowMultiple = false` to match attack type behavior.
*   **SpecialAttackTab.js:** Added `setCondition` method and updated event handlers to use "set-" actions instead of "add-" actions for consistent single-selection behavior.

```javascript
// BEFORE: Custom condition selector with empty value
dropdownHtml = RenderUtils.renderSelect({
    id: `${propertyKey}-select-${this.parentTab.selectedAttackIndex}`,
    options: availableOptions,
    value: '', // Always empty - causes reset behavior
    dataAttributes: { action: `add-${propertyKey.slice(0, -1)}` },
    placeholder: `Add a ${label.slice(0, -1)}...`
});

// AFTER: Integrated selector showing selected value
${this.renderIntegratedSelector(attack, character, 'Basic Conditions', 'basicConditions', AttackTypeSystem.getBasicConditions(), false)}
```

```javascript
// BEFORE: Add-based action that appends to array
'add-basicCondition': () => this.addCondition(element.value, false),

// AFTER: Set-based action that replaces current selection
'set-basicCondition': () => this.setCondition(element.value, false),
```

---

## 3. Verification

✅ **Dropdown Selection:** Condition dropdowns now properly show the selected value instead of resetting to empty
✅ **Consistent Behavior:** All dropdowns in Special Attacks tab (attack types, effect types, conditions) now behave identically
✅ **Single Selection:** Conditions use single-selection behavior matching attack/effect types
✅ **Visual Consistency:** UI appearance matches other integrated selectors in the interface

---

## 4. Impact

This fix eliminates user confusion and provides a consistent, professional interface experience across all dropdown selectors in the Special Attacks system. Users can now clearly see their condition selections and interact with the dropdowns as expected.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>