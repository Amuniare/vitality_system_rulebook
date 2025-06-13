# Phase 8: Dropdown Visibility Improvements *(January 7, 2025)*
**Problem**: User requested dropdown behavior improvements in Special Attacks
- Attack type dropdowns remained visible after selection, causing UI clutter
- Condition selectors (basic/advanced) also remained visible after selection
- User wanted dropdowns to disappear once selections were made

**Investigation**: Research into condition system architecture
- âœ… **Analysis completed**: Basic and advanced conditions serve different purposes
  - **Basic Conditions**: Free, universally available, simple effects
  - **Advanced Conditions**: Cost upgrade points, specialized abilities, more powerful
- âŒ **Cannot merge**: Different cost models and game balance implications require separation
- âœ… **Dropdown hiding feasible**: Both types can use the same visibility logic

**Solution**: Modified dropdown visibility logic in AttackBasicsForm.js
- âœ… **Attack Types**: Changed from `(allowMultiple || selectedIds.length === 0)` to `selectedIds.length === 0`
- âœ… **Effect Types**: Already had correct behavior, maintained existing logic
- âœ… **Basic Conditions**: Applied same visibility logic `selectedIds.length === 0`
- âœ… **Advanced Conditions**: Applied same visibility logic `selectedIds.length === 0`

**Technical Implementation**:
```javascript
// OLD: Dropdown always visible for attack types (allowMultiple = true)
if (allowMultiple || selectedIds.length === 0) {

// NEW: Dropdown only visible when no selections made
if (selectedIds.length === 0) {
```

**Result**: âœ… **Successful UX improvement**
- All dropdowns now disappear after first selection
- UI is cleaner and less cluttered
- Users can still change selections by removing tags (Ã— button)
- Maintains separation between basic/advanced conditions for game balance
