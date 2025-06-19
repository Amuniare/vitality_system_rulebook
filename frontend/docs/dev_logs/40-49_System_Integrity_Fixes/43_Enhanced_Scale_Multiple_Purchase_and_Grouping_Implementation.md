# Dev Log 43: Enhanced Scale Multiple Purchase and Grouping Implementation

**Date:** 2025-01-19  
**Type:** Feature Implementation  
**Status:** ✅ Success  
**Complexity:** Medium  

## Objective

Implement Enhanced Scale as a stackable upgrade that can be purchased multiple times, with proper UI controls, area size calculations, and specialty upgrade handling for all instances.

## Problem Statement

The Enhanced Scale upgrade in the Special Attacks system was limited to single purchase like other upgrades, but game rules require it to be stackable with multiplicative effects (2x, 4x, 8x area size). Users needed:

1. **Multiple Purchase Capability** - Ability to buy Enhanced Scale multiple times
2. **Quantity Controls** - +/- buttons for easy purchase/removal
3. **Stacking Area Calculations** - Automatic area size scaling display
4. **Grouped Specialty Handling** - Making one Enhanced Scale specialty should affect all instances
5. **Consolidated Display** - Show multiple Enhanced Scale as grouped items in purchased upgrades

## Technical Approach

### 1. Multiple Purchase Validation System

**File:** `SpecialAttackSystem.js`

Modified validation logic to allow Enhanced Scale multiple purchases:

```javascript
// Allow Enhanced Scale to be purchased multiple times
if (upgradeData.name !== 'Enhanced Scale' && attack.upgrades.some(upgrade => upgrade.id === upgradeData.id)) {
    errors.push('Already purchased');
}
```

**Key Changes:**
- Used upgrade name comparison instead of ID to handle system's ID transformation
- Maintained single-purchase restriction for all other upgrades
- Preserved existing validation architecture

### 2. Quantity Control UI Implementation

**File:** `UpgradeSelection.js`

Added specialized UI for Enhanced Scale with quantity controls:

```javascript
if (isEnhancedScale) {
    quantityControls = `
        <div class="quantity-controls">
            <button type="button" class="quantity-btn quantity-decrease" 
                    data-action="remove-upgrade" data-upgrade-id="${upgrade.id}"
                    ${enhancedScaleCount === 0 ? 'disabled' : ''}>-</button>
            <span class="quantity-display">${enhancedScaleCount}</span>
            <button type="button" class="quantity-btn quantity-increase" 
                    data-action="purchase-upgrade" data-upgrade-id="${upgrade.id}"
                    ${shouldDisable ? 'disabled' : ''}>+</button>
        </div>
    `;
}
```

**Key Features:**
- Integrated with existing event handling system (`purchase-upgrade`/`remove-upgrade` actions)
- Disabled states for unavailable actions (no instances to remove, conflicts, etc.)
- Live count display showing current Enhanced Scale instances

### 3. Area Size Calculation System

**File:** `AttackTypeSystem.js`

Implemented multiplicative stacking area size calculation:

```javascript
// Calculate enhanced area size based on Enhanced Scale upgrades
static calculateEnhancedAreaSize(attack, baseSize) {
    const enhancedScaleCount = attack.upgrades?.filter(u => u.name === 'Enhanced Scale').length || 0;
    return baseSize * Math.pow(2, enhancedScaleCount);
}
```

**Integration with Attack Summary:**
- Enhanced `getAttackSummary()` to include calculated area sizes
- Applied to all area attacks (radius, cone, line)
- Results: 1 Enhanced Scale = 2x, 2 = 4x, 3 = 8x area size

### 4. Specialty Upgrade Group Handling

**File:** `SpecialAttackSystem.js`

Modified specialty toggle to affect all Enhanced Scale instances:

```javascript
// Special handling for Enhanced Scale - toggle ALL instances
if (upgrade.name === 'Enhanced Scale') {
    const newSpecialtyStatus = !upgrade.isSpecialty;
    attack.upgrades.forEach(u => {
        if (u.name === 'Enhanced Scale') {
            u.isSpecialty = newSpecialtyStatus;
        }
    });
}
```

**Result:** Clicking specialty on any Enhanced Scale instance toggles all instances simultaneously.

### 5. Upgrade Grouping Display System

**File:** `UpgradeSelection.js`

Created grouping system for purchased upgrades display:

```javascript
groupPurchasedUpgrades(upgrades) {
    const grouped = [];
    const enhancedScales = upgrades.filter(u => u.name === 'Enhanced Scale');
    const otherUpgrades = upgrades.filter(u => u.name !== 'Enhanced Scale');
    
    // Add Enhanced Scale as a single grouped item if any exist
    if (enhancedScales.length > 0) {
        const firstEnhancedScale = enhancedScales[0];
        grouped.push({
            ...firstEnhancedScale,
            isGrouped: true,
            groupCount: enhancedScales.length,
            isSpecialty: firstEnhancedScale.isSpecialty
        });
    }
    
    // Add all other upgrades individually
    grouped.push(...otherUpgrades);
    
    return grouped;
}
```

**Display Features:**
- Consolidated display: "Enhanced Scale (3)" instead of three separate entries
- Total cost calculation for all instances
- Single specialty toggle affecting all instances
- Single remove button (removes one instance)

### 6. Enhanced Summary Display

**File:** `SpecialAttacksSummary.js`

Updated attack summary to show enhanced area sizes:

```javascript
// Show enhanced area sizes
const areaInfo = def.areaOptions.map(option => {
    const enhancedSize = AttackTypeSystem.calculateEnhancedAreaSize(attack, option.size);
    return `${enhancedSize}${option.unit || 'sp'} ${option.shape || ''}`;
}).join(', ');

return `${def.name} (${areaInfo})`;
```

**Result:** Attack types now display actual enhanced areas (e.g., "Area (12sp radius, 24sp cone, 48sp line)")

## Technical Challenges Resolved

### Challenge 1: ID Transformation Issue
**Problem:** System transforms upgrade IDs from `enhanced_scale` to `Generic_Attack_Upgrades_Enhanced_Scale`
**Solution:** Switched to using upgrade names for identification instead of IDs

### Challenge 2: CSS Styling Integration
**Problem:** Quantity controls needed proper styling
**Solution:** Leveraged existing CSS build system with pre-defined quantity control styles

### Challenge 3: Event Handling Integration
**Problem:** New UI elements needed to integrate with existing event delegation
**Solution:** Used existing `data-action` attributes with current upgrade IDs

### Challenge 4: Specialty Toggle Scope
**Problem:** Individual specialty toggles on multiple instances created inconsistent state
**Solution:** Group-aware specialty toggle affecting all Enhanced Scale instances simultaneously

## File Modifications Summary

| File | Lines Changed | Type | Description |
|------|---------------|------|-------------|
| `SpecialAttackSystem.js` | ~25 | Modified | Validation logic and specialty toggle updates |
| `UpgradeSelection.js` | ~50 | Major | UI rendering, grouping logic, quantity controls |
| `AttackTypeSystem.js` | ~15 | Added | Area size calculation method and integration |
| `SpecialAttacksSummary.js` | ~20 | Modified | Enhanced area display in attack summaries |

## Testing Results

✅ **Enhanced Scale Multiple Purchase** - Users can purchase Enhanced Scale multiple times  
✅ **Quantity Controls** - +/- buttons work correctly with disable states  
✅ **Area Size Calculation** - Stacking effects display properly (2x, 4x, 8x)  
✅ **Specialty Toggle** - Making Enhanced Scale specialty affects all instances  
✅ **Grouped Display** - Multiple Enhanced Scale shown as "Enhanced Scale (3)" with total cost  
✅ **Summary Integration** - Attack summaries show calculated enhanced area sizes  

## Impact Assessment

**Positive Impacts:**
- Enhanced Scale now functions according to game rules
- Improved UX with quantity controls and grouped display
- Automatic area size calculations reduce manual computation
- Consistent specialty upgrade behavior across all instances

**Architecture Benefits:**
- Maintained existing event handling patterns
- Leveraged current CSS build system
- Preserved single-purchase logic for other upgrades
- Clean separation between Enhanced Scale special handling and general upgrade logic

**Performance:**
- Minimal impact - calculations performed on-demand
- Efficient grouping algorithm with O(n) complexity
- No additional network requests or data loading

## Lessons Learned

1. **ID vs Name Identification:** System ID transformations require careful consideration when implementing upgrade-specific logic
2. **CSS Build Integration:** Existing CSS infrastructure simplified styling implementation
3. **Group-Aware Operations:** Stackable upgrades require special handling for operations that should affect all instances
4. **Display Consolidation:** UI grouping significantly improves user experience for multiple identical items

## Future Considerations

1. **Other Stackable Upgrades:** This implementation provides a pattern for future stackable upgrades
2. **Quantity Input Fields:** Could add direct quantity input in addition to +/- buttons
3. **Stacking Effects Visualization:** Consider adding visual indicators for stacking effects
4. **Performance Optimization:** For large numbers of stackable upgrades, consider optimization strategies

---

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>