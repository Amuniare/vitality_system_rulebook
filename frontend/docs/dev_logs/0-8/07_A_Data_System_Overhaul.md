# PHASE 7: DATA SYSTEM OVERHAUL & SPECIAL ATTACK FIXES *(December 6, 2025)*

### **EXTERNAL DATA INTEGRATION COMPLETIONS**

#### **Problem**: Incomplete JSON Integration & UI Issues
- Expertise section showing "undefined" values due to renamed JSON file
- Special Attack tab blank screen from upgrade system method conflicts
- Browse Available Upgrades button needed replacement with inline display
- New limits.json and upgrades.json files needed integration

#### **Root Cause Analysis**
**1. File Naming Mismatch**: GameDataManager looking for `expertise_categories.json` but file renamed to `expertise.json`
**2. JSON Structure Mismatch**: New expertise.json has nested structure incompatible with existing UI expectations
**3. Method Signature Conflicts**: `SpecialAttackSystem.getAvailableUpgrades()` called with parameters but accepts none
**4. Data Transformation Gap**: New JSON structures needed parsing logic to match UI expectations

### **SOLUTIONS IMPLEMENTED**

#### **1. Expertise System Complete Overhaul**
```javascript
// BEFORE: Hardcoded/undefined expertise values
expertiseCategories: 'data/expertise_categories.json'

// AFTER: Dynamic JSON transformation
expertiseCategories: 'data/expertise.json'
static getExpertiseCategories() {
    // Transform nested structure to expected format
    ['Mobility', 'Power', 'Endurance', 'Focus', 'Awareness', 'Communication', 'Intelligence'].forEach(attr => {
        transformed[attr] = {
            activities: types.activityBased?.categories?.[attr] || [],
            situational: types.situational?.categories?.[attr] || []
        };
    });
}
```
**Files**: `GameDataManager.js`, `UtilitySystem.js`, `UtilityTab.js`
**Impact**: 47 total expertises now properly loaded (25 activity-based + 22 situational)

#### **2. Expertise 4-Corner Card Layout Implementation**
```javascript
// NEW: Card-based layout replacing checkbox lists
<div class="expertise-card">
    <div class="expertise-card-header">
        <div class="expertise-name">${expertise.name}</div>           // Top Left
        <div class="expertise-description">${expertise.description}</div> // Top Right
    </div>
    <div class="expertise-card-footer">
        <div class="expertise-basic-section">
            <div class="expertise-cost-value">${basicCost}p</div>      // Bottom Left
            ${purchaseButton}
        </div>
        <div class="expertise-mastered-section">
            <div class="expertise-cost-value">${masteredCost}p</div>   // Bottom Right
            ${masterButton}
        </div>
    </div>
</div>
```
**Files**: `UtilityTab.js`, `character-builder.css`
**Impact**: Professional card-based expertise selection with clear cost display and purchase states

#### **3. Special Attack Upgrade System Integration**
```javascript
// BEFORE: Method conflict causing blank screen
const upgradeCategories = SpecialAttackSystem.getAvailableUpgrades(character, attack);

// AFTER: Proper method usage with grouping
const allUpgrades = SpecialAttackSystem.getAvailableUpgrades();
const upgradeCategories = {};
allUpgrades.forEach(upgrade => {
    upgradeCategories[upgrade.category] = upgradeCategories[upgrade.category] || [];
    upgradeCategories[upgrade.category].push(upgrade);
});
```
**Files**: `SpecialAttackSystem.js`, `SpecialAttackTab.js`, `CharacterBuilder.js`
**Impact**: 24 upgrades now properly loaded (9 Accuracy + 15 Damage) with inline display replacing modal button

#### **4. Limits System JSON Integration**
```javascript
// NEW: Complete limits.json integration
static getAvailableLimits() {
    // Parse hierarchical structure: main â†’ variants â†’ modifiers
    Object.entries(limitsData).forEach(([mainCategory, categoryData]) => {
        // Add main categories, variants, and modifiers with proper IDs
    });
}
```
**Files**: `SpecialAttackSystem.js`, `GameDataManager.js`
**Impact**: 139 total limits available (6 main categories with full hierarchy)
