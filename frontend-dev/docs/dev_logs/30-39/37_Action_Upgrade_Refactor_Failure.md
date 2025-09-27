# Phase 37: Action Upgrade System Refactor (Partial Failure & Revert)

**Date:** 2025-06-17
**Status:** ? Failed
**Objective:** To refactor the Action Upgrade system to support multiple, independent upgrades per action and correctly handle the Versatile Master archetype's free selections.

---

## 1. Problem Analysis

Following the successful refactoring of the data and system layers for Action Upgrades, an attempt was made to implement the corresponding UI changes. The goal was to replace the old upgrade list with a new design featuring individual, clickable cards for each purchasable upgrade.

However, upon implementing the new ActionUpgradeSection.js and updating the event handlers in MainPoolTab.js, the entire "Main Pool" tab became non-functional. The primary symptom was that clicking on an action upgrade card did nothing, and the console reported errors related to an undefined upgradeId being passed to the purchase logic.

### Root Cause

The root cause was a failure in the event delegation logic within MainPoolTab.js. The event handler was designed for the old DOM structure where the data-upgrade-id was on a button. The refactored ActionUpgradeSection.js moved this data attribute to the main card div. The event handler was not correctly adjusted to find this attribute on the new, clickable card element, resulting in the upgradeId being undefined when the purchase function was called.

---

## 2. Solution Implemented

Given the critical failure of the tab, the decision was made to revert the UI-layer changes to restore application stability.

*   **Reverted:** The changes to rontend/character-builder/features/main-pool/components/ActionUpgradeSection.js and rontend/character-builder/features/main-pool/MainPoolTab.js were reverted to their last known-good state.
*   **Kept:** The successful refactoring of the data and system layers was preserved.

The project is now in a stable, half-finished state where the backend logic and data support the new system, but the frontend UI does not yet reflect it.

### Key Changes (Kept):
*   **ctions.json:** Successfully flattened into a single array of upgrade objects, each with full context.
*   **VitalityCharacter.js:** Correctly updated with the ersatileMasterSelections property to track free archetype choices.
*   **ActionSystem.js:** Successfully refactored to handle the new data structure and the "first X are free" logic for Versatile Master.

### Key Changes (Reverted):
*   **ActionUpgradeSection.js:** The attempt to render individual clickable cards was reverted. The component is now out of sync with the new data structure.
*   **MainPoolTab.js:** The event handler changes that attempted to support the new card structure were reverted.
