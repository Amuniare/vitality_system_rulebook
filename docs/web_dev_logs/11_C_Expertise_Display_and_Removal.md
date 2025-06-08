# Web Dev Log 11: Expertise Display and Removal Implementation

**Date:** December 7, 2024  
**Focus:** Adding selected expertise display and removal functionality to match Features/Senses UX  
**Files Modified:** `UtilityTab.js`, `UtilitySystem.js`

## Problem Statement

The expertise system in the Utility tab was missing key UX features that other utility categories (Features, Senses) already had:
- No display of selected/purchased expertises 
- No ability to remove purchased expertises
- Users had to remember what they had already purchased

This created an inconsistent and frustrating user experience compared to other utility categories.

## Technical Challenges

### 1. Complex Expertise Data Structure
Unlike Features/Senses which are simple arrays, expertises have a nested structure:
```javascript
expertise: {
  awareness: { basic: [], mastered: [] },
  communication: { basic: [], mastered: [] },
  // ... for each attribute
}
```

### 2. Dual-Level System
Expertises have Basic and Mastered levels with interdependency:
- Mastered requires Basic to be purchased first
- Removing Mastered should also remove Basic
- Different costs for Basic vs Mastered

### 3. Missing System Method
`UtilitySystem` had `purchaseExpertise()` but no corresponding `removeExpertise()` method.

## Implementation Details

### Phase 1: UI Display System

**Modified `UtilityTab.renderExpertiseSection()`:**
- Added wrapper structure with selected expertises section
- Restructured to show selected items above available options

**Added `renderSelectedExpertises()` method:**
- Iterates through all expertise attributes
- Counts total expertises across all attributes/levels
- Shows empty state when no expertises selected
- Groups display by attribute for clarity

**Added `renderAttributeExpertiseList()` method:**
- Displays expertises grouped by attribute (Awareness, Communication, etc.)
- Shows total count per attribute
- Renders individual expertise items with level indicators

**Added `renderSelectedExpertiseItem()` method:**
- Displays expertise name, level (Basic/Mastered), and cost
- Includes Remove button with proper data attributes
- Follows same visual pattern as Features/Senses

### Phase 2: Removal Functionality

**Enhanced Event Handling:**
- Added specific `remove-expertise` action handler
- Prevents event bubbling conflicts with generic remove handlers
- Extracts attribute, expertise ID, and level from data attributes

**Added `handleExpertiseRemoval()` method:**
- Shows confirmation dialog before removal
- Calls UtilitySystem.removeExpertise() 
- Provides user feedback via notifications
- Handles errors gracefully

**Created `UtilitySystem.removeExpertise()` method:**
- Validates expertise exists before removal
- Handles Basic/Mastered interdependency logic
- If removing Mastered, also removes Basic level
- Updates character object and returns it
- Throws descriptive errors for invalid operations

### Phase 3: Limit Category Toggle Fix (Bonus)

**Fixed Special Attack Limit Buttons:**
- Simplified `LimitSelection.toggleCategory()` to only update state
- Removed problematic DOM manipulation code
- Added proper `toggleLimitCategory()` method in SpecialAttackTab
- Fixed event handler to prevent double render calls

## Code Examples

### Selected Expertise Display
```javascript
renderSelectedExpertises(character) {
    const expertises = character.utilityPurchases.expertise;
    // Count and organize expertises by attribute
    let totalExpertises = 0;
    let expertisesByAttribute = {};
    
    Object.entries(expertises).forEach(([attribute, levels]) => {
        const totalForAttr = levels.basic.length + levels.mastered.length;
        if (totalForAttr > 0) {
            expertisesByAttribute[attribute] = {
                basic: levels.basic,
                mastered: levels.mastered,
                total: totalForAttr
            };
            totalExpertises += totalForAttr;
        }
    });
    // Render organized expertise display...
}
```

### Expertise Removal Logic
```javascript
static removeExpertise(character, attribute, expertiseId, level) {
    // Validate expertise exists
    const targetArray = character.utilityPurchases.expertise[attribute][level];
    if (!targetArray?.includes(expertiseId)) {
        throw new Error(`${expertiseId} (${level}) not found`);
    }
    
    // If removing mastered, also remove basic
    if (level === 'mastered') {
        const basicArray = character.utilityPurchases.expertise[attribute].basic;
        const basicIndex = basicArray.indexOf(expertiseId);
        if (basicIndex > -1) {
            basicArray.splice(basicIndex, 1);
        }
    }
    
    // Remove from target level
    const index = targetArray.indexOf(expertiseId);
    targetArray.splice(index, 1);
    return character;
}
```

## User Experience Improvements

### Before:
- ❌ No way to see selected expertises
- ❌ No way to remove unwanted expertises  
- ❌ Had to remember previous purchases
- ❌ Inconsistent with other utility categories

### After:
- ✅ Clear display of all selected expertises
- ✅ Organized by attribute with counts
- ✅ Level indicators (Basic/Mastered)
- ✅ Remove buttons with confirmation
- ✅ Consistent UX with Features/Senses
- ✅ Automatic point pool updates
- ✅ Error handling and user feedback

## Technical Validation

### Data Flow Compliance
- ✅ Follows architectural golden rule: UI → Tab → System → Character
- ✅ No direct character modification in UI components
- ✅ Proper error handling and validation
- ✅ Stateless System methods

### Event Management
- ✅ Uses EventManager delegation pattern
- ✅ Proper event bubbling prevention
- ✅ Clean separation of concerns

### UX Consistency
- ✅ Matches Features/Senses display pattern
- ✅ Same visual styling and interaction patterns
- ✅ Consistent error messaging and notifications

## Lessons Learned

1. **Complex Data Structures Need Careful Planning:** The nested expertise structure required more thought than simple arrays
2. **Interdependent Systems Need Special Logic:** Basic/Mastered relationship needed careful handling in removal
3. **Consistency is Key:** Following established patterns (Features/Senses) made implementation smoother
4. **User Feedback is Essential:** Confirmation dialogs and notifications improve user confidence

## Future Considerations

- Consider adding bulk remove functionality for multiple expertises
- Potential for expertise respec/swap functionality 
- Could add expertise filtering/search for large lists
- Consider adding expertise recommendations based on attributes

## Files Changed
- `rulebook/character-builder/features/utility/UtilityTab.js` - Added display and removal UI
- `rulebook/character-builder/systems/UtilitySystem.js` - Added removeExpertise method
- `rulebook/character-builder/features/special-attacks/components/LimitSelection.js` - Fixed toggle logic
- `rulebook/character-builder/features/special-attacks/SpecialAttackTab.js` - Fixed limit category handlers

**Result:** Expertise system now has full CRUD functionality with consistent UX patterns matching the rest of the application.