# 11_Utility_Expertise_Card_Styling.md

## Issue: Expertise Display Lacks Visual Polish

**Problem:** The expertise options in the utility section were displaying in plain columns without proper visual separation or styling. Each expertise option appeared as unstyled text, making it difficult to distinguish between different options and lacking the professional appearance of other components in the character builder.

**User Request:** "Can you look at the expertises in the utility section, right now they just appear in columns, can we put each expertise in its own box, and make it look clean like the rest of our codebase"

## Investigation

### Current State Analysis
- Examined `UtilityTab.js` (lines 94-117) where `renderSingleExpertiseOption()` creates expertise cards
- Found that the method generates proper HTML structure with classes like `.expertise-card`, `.expertise-card-header`, etc.
- Discovered that `assets/css/tabs/_utility.css` contained no styling rules - just placeholder comment
- Identified that expertise options were appearing without visual separation or consistent styling

### Architecture Review
- Confirmed the CSS build system using concatenation approach per `assets/css/CLAUDE.md`
- Verified the modular CSS structure with partials in various directories
- Found that the build script needed path corrections for the current directory structure

## Solution Implementation

### 1. CSS Styling Addition
Added comprehensive styling to `assets/css/tabs/_utility.css`:

```css
/* Expertise Cards */
.expertise-card {
    background: var(--bg-primary);
    border: 1px solid var(--accent-secondary);
    border-radius: var(--border-radius-medium);
    padding: var(--padding-medium);
    margin-bottom: var(--gap-medium);
    transition: all 0.3s ease;
}

.expertise-card:hover {
    border-color: var(--accent-primary);
    background: rgba(0, 255, 255, 0.05);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 255, 255, 0.15);
}
```

### 2. Design System Consistency
- **Visual Hierarchy:** Clear separation between expertise name/description and purchase options
- **Color Scheme:** Used existing CSS variables for consistent theming
- **Interactive Elements:** Hover effects matching other cards in the codebase
- **Layout Structure:** Flexbox layout for Basic/Mastered sections with equal spacing

### 3. Component Structure Enhancement
- **Header Section:** Styled expertise name with accent color and clear description text
- **Footer Section:** Two equal-width sections for Basic and Mastered purchase options
- **Cost Indicators:** Consistent styling matching existing `card-cost` patterns
- **Grid Layout:** Responsive grid for expertise cards with proper gap spacing

### 4. Build System Maintenance
- Updated CSS build script path from `rulebook\character-builder\css` to `rulebook\character-builder\assets\css`
- Added missing `base/_typography.css` to build order
- Created bash equivalent of PowerShell build script for cross-platform compatibility
- Successfully rebuilt `character-builder.css` with new expertise styling

## Key Design Decisions

### 1. Consistent Visual Language
- Used same hover effects as other interactive cards (`transform: translateY(-1px)`, box shadows)
- Applied existing color variables for borders, backgrounds, and accents
- Maintained consistent spacing using CSS custom properties

### 2. Dual-Level Purchase UI
- Created equal-width sections for Basic and Mastered options
- Clear cost indicators with consistent styling
- Proper button placement and sizing for both purchase levels

### 3. Responsive Design
- Grid layout adapts to available space with `minmax(280px, 1fr)`
- Proper gap spacing between cards
- Maintains readability across different screen sizes

## Files Modified

1. **`assets/css/tabs/_utility.css`** - Added complete expertise card styling system
2. **`tools/build-css.ps1`** - Fixed path and added missing typography import
3. **`tools/build-css.sh`** - Created cross-platform build script
4. **`assets/css/character-builder.css`** - Rebuilt with new styles included

## Technical Notes

- All styling follows the existing CSS architecture with modular partials
- Uses CSS custom properties for maintainable theming
- Hover effects provide immediate visual feedback
- Grid system ensures consistent layout across different content amounts
- Maintains accessibility with proper contrast and interactive states

## Result

Expertise options in the utility section now appear as clean, professional boxes that match the design language of the rest of the character builder. Each expertise has clear visual separation, consistent styling, and intuitive purchase interfaces for both Basic and Mastered levels.

The implementation follows the established CSS architecture patterns and maintains visual consistency with other card-based components throughout the application.