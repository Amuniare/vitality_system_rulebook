# CSS Directory - CLAUDE.md

This directory contains the styling for the Vitality System character builder application.

## Purpose
Centralized styling that provides a cohesive visual design, responsive layout, and consistent user experience across all character builder components.

## Architecture Pattern
- **Component-Based Styling**: CSS classes organized by UI component and functionality
- **Design System**: Consistent color scheme, typography, and spacing variables
- **Responsive Design**: Mobile-first approach with breakpoints for larger screens
- **Accessibility**: High contrast ratios, keyboard navigation support, screen reader compatibility

## File Overview

### character-builder.css
**Single CSS File**: All styles consolidated for simplicity and performance
**Size**: ~651 lines (as noted in development logs)
**Organization**: Hierarchical structure from layout to specific components

## CSS Architecture

### CSS Custom Properties (Variables)
The design system uses CSS custom properties for consistency:

```css
:root {
    /* Color Palette */
    --primary-color: #007bff;
    --secondary-color: #6c757d;
    --success-color: #28a745;
    --danger-color: #dc3545;
    --warning-color: #ffc107;
    --info-color: #17a2b8;
    
    /* Background Colors */
    --bg-primary: #ffffff;
    --bg-secondary: #f8f9fa;
    --bg-dark: #343a40;
    
    /* Text Colors */
    --text-primary: #212529;
    --text-secondary: #6c757d;
    --text-light: #ffffff;
    
    /* Spacing System */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 3rem;
    
    /* Typography */
    --font-family-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    
    /* Borders and Shadows */
    --border-radius: 0.25rem;
    --border-color: #dee2e6;
    --box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
```

### Layout Structure
```css
/* Main Application Layout */
.character-builder {
    display: grid;
    grid-template-rows: auto 1fr;
    min-height: 100vh;
}

.character-header {
    /* Header with character name, tier, navigation */
}

.tab-navigation {
    /* Tab switching interface */
}

.tab-content {
    /* Individual tab content areas */
}

/* Two-column layout for complex tabs */
.attack-builder-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-lg);
}

@media (max-width: 768px) {
    .attack-builder-columns {
        grid-template-columns: 1fr;
    }
}
```

## Component Styling Patterns

### Card Components
```css
.card {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: var(--spacing-md);
    box-shadow: var(--box-shadow);
}

.card-header {
    border-bottom: 1px solid var(--border-color);
    padding-bottom: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
}

.card-title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
}

/* Interactive cards */
.card.clickable {
    cursor: pointer;
    transition: all 0.2s ease;
}

.card.clickable:hover {
    border-color: var(--primary-color);
    box-shadow: 0 0.25rem 0.5rem rgba(0, 123, 255, 0.15);
}

.card.selected {
    border-color: var(--primary-color);
    background-color: rgba(0, 123, 255, 0.05);
}

.card.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
```

### Button System
```css
.btn {
    display: inline-block;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid transparent;
    border-radius: var(--border-radius);
    font-size: var(--font-size-base);
    font-weight: 400;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-primary {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    color: var(--text-light);
}

.btn-secondary {
    background-color: var(--secondary-color);
    border-color: var(--secondary-color);
    color: var(--text-light);
}

.btn-danger {
    background-color: var(--danger-color);
    border-color: var(--danger-color);
    color: var(--text-light);
}

/* Button sizes */
.btn-small {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-sm);
}

.btn-large {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: var(--font-size-lg);
}

/* Button states */
.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
}
```

### Form Elements
```css
.form-group {
    margin-bottom: var(--spacing-md);
}

.form-group label {
    display: block;
    margin-bottom: var(--spacing-xs);
    font-weight: 500;
    color: var(--text-primary);
}

.form-control {
    width: 100%;
    padding: var(--spacing-sm);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    font-size: var(--font-size-base);
    transition: border-color 0.2s ease;
}

.form-control:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.125rem rgba(0, 123, 255, 0.25);
}

.form-control:invalid {
    border-color: var(--danger-color);
}

/* Select dropdowns */
select.form-control {
    background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3E%3Cpath fill='%23666' d='m2 0-2 2h4zm0 5 2-2h-4z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 8px 10px;
    padding-right: 2rem;
}
```

### Tab System
```css
.tab-navigation {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
}

.tab-btn {
    flex: 1;
    padding: var(--spacing-md);
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 3px solid transparent;
}

.tab-btn:hover {
    background: rgba(0, 123, 255, 0.1);
}

.tab-btn.active {
    background: var(--bg-primary);
    border-bottom-color: var(--primary-color);
    color: var(--primary-color);
}

.tab-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.tab-content {
    padding: var(--spacing-lg);
}

.tab-content.hidden {
    display: none;
}
```

### Utility Classes
```css
/* Visibility */
.hidden { display: none !important; }
.visible { display: block !important; }

/* Text utilities */
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-primary { color: var(--primary-color); }
.text-secondary { color: var(--text-secondary); }
.text-success { color: var(--success-color); }
.text-danger { color: var(--danger-color); }
.text-warning { color: var(--warning-color); }

/* Spacing utilities */
.mt-0 { margin-top: 0; }
.mt-1 { margin-top: var(--spacing-xs); }
.mt-2 { margin-top: var(--spacing-sm); }
.mt-3 { margin-top: var(--spacing-md); }
.mt-4 { margin-top: var(--spacing-lg); }

.mb-0 { margin-bottom: 0; }
.mb-1 { margin-bottom: var(--spacing-xs); }
.mb-2 { margin-bottom: var(--spacing-sm); }
.mb-3 { margin-bottom: var(--spacing-md); }
.mb-4 { margin-bottom: var(--spacing-lg); }

/* Flexbox utilities */
.d-flex { display: flex; }
.justify-content-center { justify-content: center; }
.justify-content-between { justify-content: space-between; }
.align-items-center { align-items: center; }
.flex-column { flex-direction: column; }
.flex-grow-1 { flex-grow: 1; }
```

## Specific Component Styles

### Special Attack Builder
```css
.attack-builder {
    background: var(--bg-primary);
    border-radius: var(--border-radius);
    overflow: hidden;
}

.attack-basics-form {
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--border-color);
}

.attack-basics-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-lg);
}

.limits-section, .upgrades-section {
    padding: var(--spacing-lg);
}

.limit-categories-hierarchy {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
}

.limit-category-header {
    background: var(--bg-secondary);
    padding: var(--spacing-sm) var(--spacing-md);
    cursor: pointer;
    border-bottom: 1px solid var(--border-color);
}

.limit-category-header:hover {
    background: rgba(0, 123, 255, 0.1);
}
```

### Point Pool Display
```css
.point-pool-display {
    background: var(--bg-secondary);
    border-radius: var(--border-radius);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.pool-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
}

.pool-item {
    text-align: center;
}

.pool-label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xs);
}

.pool-value {
    font-size: var(--font-size-xl);
    font-weight: 600;
}

.pool-value.negative {
    color: var(--danger-color);
}
```

### Error and Status States
```css
.error-state {
    background: rgba(220, 53, 69, 0.1);
    border: 1px solid var(--danger-color);
    color: var(--danger-color);
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
    text-align: center;
}

.empty-state {
    background: var(--bg-secondary);
    border: 2px dashed var(--border-color);
    padding: var(--spacing-xl);
    border-radius: var(--border-radius);
    text-align: center;
    color: var(--text-secondary);
}

.loading-state {
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--text-secondary);
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: var(--spacing-md);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    z-index: 1000;
    max-width: 300px;
}

.notification.success {
    background: var(--success-color);
    color: var(--text-light);
}

.notification.error {
    background: var(--danger-color);
    color: var(--text-light);
}

.notification.info {
    background: var(--info-color);
    color: var(--text-light);
}
```

## Responsive Design Patterns

### Mobile-First Approach
```css
/* Mobile styles (default) */
.container {
    padding: var(--spacing-sm);
}

.attack-builder-columns {
    grid-template-columns: 1fr;
}

/* Tablet styles */
@media (min-width: 768px) {
    .container {
        padding: var(--spacing-md);
    }
    
    .attack-builder-columns {
        grid-template-columns: 1fr 1fr;
    }
}

/* Desktop styles */
@media (min-width: 1024px) {
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--spacing-lg);
    }
    
    .attack-builder-columns {
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-xl);
    }
}
```

### Touch-Friendly Interactions
```css
/* Minimum touch target size */
.btn, .card.clickable, .tab-btn {
    min-height: 44px;
    min-width: 44px;
}

/* Larger spacing on touch devices */
@media (hover: none) and (pointer: coarse) {
    .form-control {
        padding: var(--spacing-md);
        font-size: 16px; /* Prevents zoom on iOS */
    }
    
    .btn {
        padding: var(--spacing-md) var(--spacing-lg);
    }
}
```

## Accessibility Features

### Focus Management
```css
/* Visible focus indicators */
:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
}

/* Skip to content link */
.skip-to-content {
    position: absolute;
    top: -40px;
    left: 6px;
    background: var(--primary-color);
    color: var(--text-light);
    padding: 8px;
    text-decoration: none;
    z-index: 1000;
}

.skip-to-content:focus {
    top: 6px;
}
```

### High Contrast Support
```css
/* High contrast mode support */
@media (prefers-contrast: high) {
    :root {
        --border-color: #000000;
        --text-secondary: #000000;
    }
    
    .card {
        border-width: 2px;
    }
    
    .btn {
        border-width: 2px;
    }
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

## Performance Considerations

### CSS Organization
- Group related styles together
- Use efficient selectors (avoid deep nesting)
- Minimize use of `!important`
- Leverage browser caching with consistent class names

### Critical CSS
- Inline critical above-the-fold styles
- Load non-critical styles asynchronously
- Use CSS custom properties for dynamic theming

### Print Styles
```css
@media print {
    .tab-navigation,
    .btn,
    .interactive-elements {
        display: none;
    }
    
    .tab-content {
        display: block !important;
    }
    
    body {
        background: white;
        color: black;
    }
}
```

## Maintenance Guidelines

### Adding New Styles
1. **Use existing variables** - Leverage the design system
2. **Follow naming conventions** - Use BEM methodology where appropriate
3. **Test responsiveness** - Verify on multiple screen sizes
4. **Check accessibility** - Ensure adequate contrast and focus indicators
5. **Validate compatibility** - Test in supported browsers

### Modifying Existing Styles
1. **Impact assessment** - Check what components use the styles
2. **Backward compatibility** - Ensure existing layouts don't break
3. **Performance testing** - Verify changes don't impact render performance
4. **Cross-browser testing** - Check in all supported browsers

### Dark Mode Preparation
```css
/* Future dark mode support */
@media (prefers-color-scheme: dark) {
    :root {
        --bg-primary: #1a1a1a;
        --bg-secondary: #2d2d2d;
        --text-primary: #ffffff;
        --text-secondary: #cccccc;
        --border-color: #404040;
    }
}
```