# UI Shared Directory - CLAUDE.md

This directory contains utility classes and shared infrastructure used across all UI components.

## Purpose
Common functionality that multiple UI components need, providing consistency and reducing code duplication across the character builder interface.

## Architecture Pattern
- **Utility Classes**: Static methods providing common functionality
- **Service Classes**: Singleton-like classes managing shared concerns
- **No UI Dependencies**: Shared utilities should not depend on specific components
- **Framework Independence**: Utilities should work regardless of UI framework changes

## Files Overview

### EventManager.js
**Purpose**: Centralized event delegation system
**Responsibilities**:
- Handles event delegation for data-action attributes
- Provides consistent event handling patterns across components
- Manages event bubbling and propagation
- Supports complex event selector patterns

### RenderUtils.js
**Purpose**: Common HTML generation utilities
**Responsibilities**:
- Standardized HTML element generation
- Form controls with consistent styling
- Button and input components with data attributes
- Card layouts and common UI patterns

### UpdateManager.js
**Purpose**: Character state update coordination
**Responsibilities**:
- Manages update lifecycle and sequencing
- Coordinates granular updates across components
- Handles update batching and debouncing
- Provides update hooks for components

## Critical Implementation Details

### EventManager.js Usage
The EventManager provides the core event delegation system:

```javascript
// Standard delegation setup in tabs/components
EventManager.delegateEvents(container, {
    click: { 
        '[data-action]': (e, el) => this.handleEvent(e, el),
        '.some-specific-class': (e, el) => this.handleSpecificEvent(e, el)
    },
    change: { 
        'select[data-action]': (e, el) => this.handleEvent(e, el),
        'input[data-action]': (e, el) => this.handleEvent(e, el)
    },
    input: {
        'input[data-action="live-update"]': (e, el) => this.handleLiveUpdate(e, el)
    }
});
```

**Critical Requirements**:
- All interactive elements must use `data-action` attributes
- Event handlers must match the exact action names in HTML
- Parent components handle all events from child components
- No direct event listeners in child components

### RenderUtils.js Patterns
Standardized HTML generation for consistency:

```javascript
// Standard button generation
RenderUtils.renderButton({
    text: 'Click Me',
    variant: 'primary', // primary, secondary, danger
    size: 'medium',     // small, medium, large
    disabled: false,
    dataAttributes: { action: 'do-something', itemId: 'item123' },
    title: 'Tooltip text'
})

// Form group with label and input
RenderUtils.renderFormGroup({
    label: 'Field Label',
    inputId: 'unique-input-id',
    inputHtml: '<input type="text" id="unique-input-id" data-action="update-field">'
})

// Select dropdown
RenderUtils.renderSelect({
    id: 'select-id',
    options: [
        { value: 'option1', label: 'Option 1', disabled: false },
        { value: 'option2', label: 'Option 2', disabled: true }
    ],
    value: 'option1',
    placeholder: 'Choose option...',
    dataAttributes: { action: 'selection-changed' }
})

// Card layout
RenderUtils.renderCard({
    title: 'Card Title',
    cost: 25,
    description: 'Card description text',
    clickable: true,
    disabled: false,
    selected: false,
    dataAttributes: { action: 'select-card', cardId: 'card123' }
}, { cardClass: 'custom-card-class', showStatus: true })
```

### UpdateManager.js Coordination
Manages the update lifecycle across components:

```javascript
// Component registration for updates
UpdateManager.registerComponent('specialAttacks', this.specialAttackTab);

// Triggering coordinated updates
UpdateManager.updateCharacter(character, {
    recalculatePoints: true,
    validateBuildOrder: true,
    notifyComponents: ['specialAttacks', 'mainPool']
});

// Component-specific update handling
onCharacterUpdate(character, updateContext) {
    if (updateContext.pointsChanged) {
        this.updatePointDisplays();
    }
    if (updateContext.archetypesChanged) {
        this.refreshAvailableOptions();
    }
}
```

## Usage Guidelines

### When Working with Shared Utilities:

#### EventManager:
1. **Always use delegation** - Never add direct event listeners to generated HTML
2. **Match action names exactly** - kebab-case in HTML, kebab-case in handlers
3. **Handle event propagation** - Use `e.stopPropagation()` when appropriate
4. **Debug event flows** - Add logging to track event delegation paths

#### RenderUtils:
1. **Use consistent patterns** - Don't hand-write HTML that RenderUtils can generate
2. **Pass data attributes properly** - All interactive elements need data-action
3. **Handle missing data gracefully** - Provide fallbacks for undefined values
4. **Maintain accessibility** - Include proper labels, titles, and ARIA attributes

#### UpdateManager:
1. **Register components properly** - Components must register for update notifications
2. **Batch related updates** - Don't trigger multiple updates for related changes
3. **Provide update context** - Help components understand what changed
4. **Handle update failures** - Gracefully handle components that fail to update

## Critical Debugging Guidelines

### EventManager Debugging
Add comprehensive event logging:

```javascript
// Enable event debugging
const EVENT_DEBUG = true;

EventManager.delegateEvents(container, {
    click: { 
        '[data-action]': (e, el) => {
            if (EVENT_DEBUG) {
                console.log(`[EVENT] Click on ${el.tagName}`, {
                    action: el.dataset.action,
                    element: el,
                    dataset: el.dataset,
                    parent: this.constructor.name
                });
            }
            this.handleEvent(e, el);
        }
    }
});
```

### RenderUtils Error Handling
Validate all inputs to render methods:

```javascript
static renderButton(options = {}) {
    // Validate required options
    if (!options.text) {
        console.error('[RenderUtils] renderButton: text is required', options);
        return '<span class="error">Invalid button configuration</span>';
    }
    
    // Provide safe defaults
    const {
        text,
        variant = 'secondary',
        size = 'medium',
        disabled = false,
        dataAttributes = {},
        title = ''
    } = options;
    
    // Log complex configurations
    if (Object.keys(dataAttributes).length > 3) {
        console.log('[RenderUtils] Complex button config:', options);
    }
    
    // Generate HTML with error boundaries
    try {
        return this.generateButtonHTML(text, variant, size, disabled, dataAttributes, title);
    } catch (error) {
        console.error('[RenderUtils] Button generation failed:', error);
        return `<span class="error">Button render failed: ${error.message}</span>`;
    }
}
```

### UpdateManager Flow Tracking
Monitor update cascades:

```javascript
static updateCharacter(character, context = {}) {
    const updateId = Date.now();
    console.log(`[UPDATE ${updateId}] Starting character update`, {
        characterName: character.name,
        context,
        registeredComponents: Object.keys(this.components)
    });
    
    // Perform updates
    const results = {};
    for (const [name, component] of Object.entries(this.components)) {
        try {
            console.log(`[UPDATE ${updateId}] Updating component: ${name}`);
            const result = component.onCharacterUpdate?.(character, context);
            results[name] = { success: true, result };
        } catch (error) {
            console.error(`[UPDATE ${updateId}] Component ${name} update failed:`, error);
            results[name] = { success: false, error: error.message };
        }
    }
    
    console.log(`[UPDATE ${updateId}] Update completed`, results);
    return results;
}
```

## Common Anti-Patterns to Avoid

### 1. Bypassing Shared Utilities
```javascript
// WRONG: Hand-writing HTML that utilities can generate
const html = `<button onclick="handleClick()">${text}</button>`;

// RIGHT: Using RenderUtils for consistency
const html = RenderUtils.renderButton({
    text,
    dataAttributes: { action: 'handle-click' }
});
```

### 2. Direct Event Binding
```javascript
// WRONG: Adding direct event listeners
element.addEventListener('click', this.handleClick.bind(this));

// RIGHT: Using EventManager delegation
EventManager.delegateEvents(container, {
    click: { '[data-action="handle-click"]': (e, el) => this.handleClick(e, el) }
});
```

### 3. Uncoordinated Updates
```javascript
// WRONG: Direct component updates
this.someComponent.render();
this.otherComponent.update();

// RIGHT: Coordinated updates through UpdateManager
UpdateManager.updateCharacter(character, { triggerSource: 'user-action' });
```

### 4. Ignoring Error States
```javascript
// WRONG: Assuming utilities always succeed
const html = RenderUtils.renderComplexCard(data);

// RIGHT: Handling potential failures
const html = RenderUtils.renderComplexCard(data) || '<div class="error">Card unavailable</div>';
```

## Performance Considerations

### Event Delegation Efficiency
- Use specific selectors to reduce event matching overhead
- Avoid overly broad delegation that catches unintended events
- Consider event frequency for performance-critical interactions

### Render Optimization
- Cache frequently used render results when appropriate
- Avoid generating complex HTML in loops without batching
- Profile render performance for components with many items

### Update Batching
- Batch related character updates to avoid cascade effects
- Debounce high-frequency updates like text input
- Use requestAnimationFrame for DOM-heavy update operations

## Integration Points

### With Core Systems
- Shared utilities should not directly depend on business logic systems
- Pass system-generated data to utilities rather than calling systems from utilities
- Handle system failures gracefully in utility methods

### With Components
- Components should prefer shared utilities over custom implementations
- Report utility failures back to components for graceful degradation
- Provide component-specific customization through configuration options

### With External Libraries
- Wrap external dependencies in utility classes for easier replacement
- Provide fallbacks for missing or failed external libraries
- Document external library versions and compatibility requirements

## Testing Guidelines

### Utility Testing
- Test all render utilities with valid, invalid, and edge case inputs
- Verify event delegation works across different DOM structures
- Test update coordination with various component configurations

### Integration Testing
- Test utilities within real component contexts
- Verify error handling doesn't break component functionality
- Test performance with realistic data volumes

### Manual Verification
- Check that all generated HTML is valid and accessible
- Verify event delegation works in all supported browsers
- Confirm update flows work correctly across tab switches