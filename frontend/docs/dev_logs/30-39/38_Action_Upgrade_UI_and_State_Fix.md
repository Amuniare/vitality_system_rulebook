# Phase 38: Action Upgrade UI and State Fix

**Date:** 2025-06-17
**Status:** ✅ Completed
**Objective:** To fix multiple cascading bugs in the Action Upgrade system related to the Versatile Master archetype, including incorrect price rendering and failure to display freely selected items.

---

## 1. Problem Analysis

Following a previous fix, the Action Upgrade system exhibited several critical UI and state management bugs:
1.  **Incorrect Pricing:** The cost displayed on upgrade cards was always "Free," regardless of the actual point cost.
2.  **Missing Items:** When a player with the "Versatile Master" archetype selected their free Quick Action upgrades, these selections did not appear in the "Purchased Items" list, causing confusion.
3.  **Flawed Logic:** The combination of these bugs made it impossible for users to correctly purchase or track action upgrades.

### Root Cause

The issues stemmed from two distinct problems:
1.  **Data Type Mismatch:** The ActionUpgradeSection.js component was passing a pre-formatted *string* (e.g., "30p") to the cost property of the RenderUtils.renderCard function. The rendering utility expected a 
umber and defaulted to displaying "Free" when it received a non-numeric value it couldn't parse correctly.
2.  **Incomplete Data Sourcing:** The MainPoolTab.js component, which is responsible for displaying all purchased items, was only reading from the character.mainPoolPurchases.primaryActionUpgrades array. It was completely unaware of the free selections stored in the character.versatileMasterSelections array, hence they were never rendered.

---

## 2. Solution Implemented

A two-part solution was implemented to address both the data type and data sourcing issues.

### Key Changes:

*   **ActionUpgradeSection.js Refactor:**
    *   A new private helper method, _getActionCardState, was created to centralize all the logic for determining an upgrade card's state (its cost, ownership status, and the correct action to perform).
    *   This method now correctly returns a numeric cost property. The enderActionUpgradeCard method was simplified to use this state object, ensuring the RenderUtils.renderCard function receives the correct data type.

    `javascript
    // BEFORE: Logic was mixed in the render method, passing a string.
    // costText = '0p (Free Selection)';
    // ... RenderUtils.renderCard({ cost: costText, ... })

    // AFTER: Centralized logic returns a clean state object.
    _getActionCardState(upgrade, character) {
        // ... complex logic ...
        return {
            isOwned: false,
            cost: 0, // CORRECT: Returns a number
            statusText: 'Click to Select for Free',
            action: 'purchase-action-upgrade'
        };
    }
    `

*   **MainPoolTab.js Data Aggregation:**
    *   The enderSelectedMainPoolItems method was updated to be a comprehensive data aggregator.
    *   It now gathers items from **both** the paid purchases array (primaryActionUpgrades) and the free selections array (ersatileMasterSelections).
    *   For free selections, it looks up the full upgrade details from ActionSystem to ensure it can display the correct name and description. This creates a unified list of all acquired upgrades, regardless of how they were obtained.

    `javascript
    // BEFORE: Only read from one source.
    // allPurchases.push(...character.mainPoolPurchases.primaryActionUpgrades.map(...));

    // AFTER: Reads from both paid and free sources.
    // Paid Action Upgrades
    allPurchases.push(...character.mainPoolPurchases.primaryActionUpgrades.map(...));
    
    // Free Versatile Master Selections
    const versatileMasterSelections = character.versatileMasterSelections || [];
    versatileMasterSelections.forEach(baseActionId => {
        const upgrade = allActionUpgrades.find(u => u.baseActionId === baseActionId && u.isQuickActionUpgrade);
        if (upgrade) {
            allPurchases.push({
                // ... full item details ...
            });
        }
    });
    `
---

## 3. Outcome

The refactoring was successful. All three reported bugs have been resolved. The UI now correctly displays the cost of action upgrades, and the "Purchased Items" list accurately reflects all acquired upgrades, whether they were purchased with points or selected for free via the Versatile Master archetype. The system is now behaving as designed.