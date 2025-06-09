### **`/.claude/spec.md`**

# Feature Specification: Non-Blocking "Advisory" Budget System

## 1. Objective

To universally remove all validation that **prevents** a user from spending points they don't have. The character builder will be changed from a "strict enforcer" to a "silent advisor."

-   **Old Behavior:** Buttons are disabled, and system logic throws errors, blocking any purchase that would result in a negative point balance.
-   **New Behavior:** All purchase actions are always enabled (unless a hard game rule, like a prerequisite, is not met). If a purchase results in a negative balance, the action is **still completed**, and a single, transient warning notification is shown to the user. The main point pool display will be the only persistent indicator of an over-budget status.

## 2. Guiding Principles

-   **Trust the User:** The user is capable of managing their own points. The UI should not prevent them from experimenting or planning a build that is temporarily over budget.
-   **Minimal UI Intrusion:** There will be **no** special warning text, icons, or highlighting on individual purchase items. The items will appear as if they are affordable at all times.
-   **Advise, Don't Block:** The only feedback for an over-budget purchase will be a one-time pop-up notification. The persistent red text in the main point pool displays is sufficient ongoing feedback.
-   **No Confirmation Dialogs:** Do not ask the user "Are you sure?". The action should be performed immediately upon click.

---

## 3. System-Level Changes: Remove All Affordability Checks

The `System` classes must be made "point-agnostic." Their only job is to validate game rules (conflicts, prerequisites) and perform state changes. They should not know or care about point totals.

-   **Action:** Go through every `validate...` method in the `systems/` directory.
-   **Requirement:** **Delete all code blocks** that check for point affordability. This includes any logic similar to `if (cost > availablePoints) { errors.push(...) }`.
-   **Affected Files and Methods:**
    -   `systems/ActionSystem.js` -> `validateActionUpgrade`
    -   `systems/AttributeSystem.js` -> `validatePointPoolsWithChange`
    -   `systems/SimpleBoonsSystem.js` -> `validateBoonPurchase`
    -   `systems/SpecialAttackSystem.js` -> `validateUpgradeAddition`
    -   `systems/TraitFlawSystem.js` -> `validateFlawPurchase`, `validateTraitPurchase`
    -   `systems/UniqueAbilitySystem.js` -> `validateUniqueAbilityPurchase`
    -   `systems/UtilitySystem.js` -> `validateUtilityPurchase`
    -   `systems/WealthSystem.js` -> `validateWealthSelection`

**Result:** The `System` validation will now only fail if a hard game rule is broken (e.g., purchasing a conflicting item), never because of insufficient points.

---

## 4. UI Handler Changes: Implement "Check, Notify, Then Do"

The responsibility for advising the user about overspending now falls entirely on the UI event handlers in the `Tab` components.

-   **Action:** Go through every purchase-related event handler in the `features/` directory (mostly within the various `Tab.js` and `Section.js` files).
-   **Requirement:** Before calling the `System` to execute the purchase, insert a check.

**Standard Implementation Pattern:**

```javascript
// Example in a handler like MainPoolTab.js -> handleFlawPurchase(flawId)

// 1. Get current point balance
const pools = PointPoolCalculator.calculateAllPools(this.builder.currentCharacter);
const remainingPoints = pools.remaining.mainPool;

// 2. Get the cost of the item
const flaw = TraitFlawSystem.getAvailableFlaws().find(f => f.id === flawId);
const itemCost = flaw ? flaw.cost : 0;

// 3. Check if this purchase will go over budget
if (itemCost > remainingPoints) {
    // 4. Show a non-blocking notification
    this.builder.showNotification("This purchase puts you over budget.", "warning");
}

// 5. Proceed with the purchase REGARDLESS of the check.
try {
    TraitFlawSystem.purchaseFlaw(this.builder.currentCharacter, flawId, ...);
    this.builder.updateCharacter();
    // A success notification can still be shown here if desired.
} catch (error) {
    // This will now only catch hard rule validation errors.
    this.builder.showNotification(`Purchase failed: ${error.message}`, 'error');
}
```

---

## 5. UI Rendering Changes: Remove All Affordability-Based `disabled` States

All UI elements must be rendered as if they are always affordable.

-   **Action:** Go through every `render...` method in the `features/` directory.
-   **Requirement:** Find all instances where a `disabled` attribute, a `.disabled` class, or a `clickable` property is being determined by an `canAfford` variable. **Remove the affordability check from the condition.**
-   **Example:**
    -   **Before:** `disabled: !canAfford || isPurchased`
    -   **After:** `disabled: isPurchased`
-   **Requirement:** Remove any logic that adds a special class like `status-unaffordable` to a rendered item. The item should look the same whether the user has 0 points or 1000 points.
-   **Note on AttributeTab:** The `+` button should only be disabled if the attribute's value has reached the tier maximum. The check against the point pool must be removed.
-   **Affected Files:**
    -   `features/main-pool/components/ActionUpgradeSection.js`
    -   `features/main-pool/components/FlawPurchaseSection.js`
    -   `features/main-pool/components/SimpleBoonSection.js`
    -   `features/main-pool/components/TraitPurchaseSection.js`
    -   `features/main-pool/components/UniqueAbilitySection.js`
    -   `features/special-attacks/components/UpgradeSelection.js`
    -   `features/utility/UtilityTab.js`
    -   `features/attributes/AttributeTab.js`

---

## 6. Final Visual State

-   **Point Pool Displays:** Will correctly show negative numbers and be styled with the `.over-budget` class (red text). This is the only persistent indicator of a negative balance.
-   **Purchase Buttons/Cards:** Will always be active and clickable, unless an item is already purchased or conflicts with a hard game rule. They will have no special styling to indicate affordability.
-   **Notifications:** A yellow warning notification will appear for 3 seconds when an over-budget purchase is made, and then disappear. The user is not required to interact with it.