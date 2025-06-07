# UI Directory - CLAUDE.md

This directory contains all user interface components and management for the character builder.

## Purpose
Frontend presentation layer that handles user interactions, displays character data, and coordinates between user actions and business logic systems.

## Architecture Pattern
- **Component-Based**: Modular UI components with specific responsibilities
- **Event Delegation**: Centralized event handling using data-action attributes
- **State Management**: Character state flows down, events bubble up
- **Separation of Concerns**: UI handles presentation, systems handle business logic

## Directory Structure

### Root Level
- **CharacterBuilder.js**: Main application controller and state manager

### components/
Reusable UI components for specific functionality:
- **AttackBasicsForm.js**: Special attack name, types, and conditional fields
- **LimitSelection.js**: Special attack limit selection and management
- **UpgradeSelection.js**: Special attack upgrade purchasing
- **ActionUpgradeSection.js**: Action purchase UI for main pool
- **BoonPurchaseSection.js**: Simple boon purchases
- **FlawPurchaseSection.js**: Flaw selection with economics reversal
- **TraitPurchaseSection.js**: Complex trait purchases with tier conditions
- **UniqueAbilitySection.js**: Major ability purchases
- **SimpleBoonSection.js**: Straightforward beneficial purchases
- **CharacterLibrary.js**: Character save/load/management
- **CharacterTree.js**: Hierarchical character organization
- **PointPoolDisplay.js**: Real-time point calculation display
- **ValidationDisplay.js**: Build order and error reporting

### shared/
Utility components used across the application:
- **EventManager.js**: Centralized event delegation system
- **RenderUtils.js**: Common HTML generation utilities
- **UpdateManager.js**: Character state update coordination

### tabs/
Main application tabs representing build phases:
- **BasicInfoTab.js**: Character name, tier, basic information
- **ArchetypeTab.js**: 7 archetype category selections
- **AttributeTab.js**: Combat and utility attribute allocation
- **MainPoolTab.js**: Boons, traits, flaws, unique abilities, actions
- **SpecialAttackTab.js**: Complex special attack builder
- **UtilityTab.js**: Final utility purchases (expertise, features, etc.)
- **SummaryTab.js**: Character overview and export

## Key UI Patterns

### Event Handling
All interactive elements use data-action attributes:
```html
<button data-action="purchase-item" data-item-id="some_id">Purchase</button>
<select data-action="add-attack-type">...</select>
<input data-action="update-character-name">
```

Event delegation happens in parent components:
```javascript
EventManager.delegateEvents(container, {
    click: { '[data-action]': (e, el) => this.handleEvent(e, el) },
    change: { 'select[data-action]': (e, el) => this.handleEvent(e, el) }
});
```

### State Management Pattern
1. **User Action** → UI component event handler
2. **Validation** → System class validates the action
3. **State Update** → System class modifies character
4. **Notification** → `this.builder.updateCharacter()` triggers updates
5. **Re-render** → UI components refresh based on new state

### Component Lifecycle
```javascript
class SomeComponent {
    render(data, character) {
        // Generate HTML based on current state
        return htmlString;
    }
    
    onCharacterUpdate() {
        // Granular updates without full re-render
        this.updateSpecificElements();
    }
}
```

## Critical Issues and Solutions

### Event Delegation Problems
**Issue**: Event handlers using camelCase while HTML uses kebab-case
**Solution**: Always match action names exactly between HTML and handlers:
```javascript
// HTML: data-action="create-attack"
// Handler: 'create-attack': () => this.createAttack()
```

### Component Independence
**Issue**: Child components trying to handle their own events
**Solution**: All event handling delegated to parent tabs:
```javascript
// WRONG: Child component adds event listeners
// RIGHT: Child component uses data-action, parent handles events
```

### Data Loading Verification
**Issue**: Assuming data methods exist without verification
**Solution**: Always check method availability and data structure:
```javascript
const attackTypes = AttackTypeSystem.getAttackTypeDefinitions?.() || {};
if (!attackTypes || Object.keys(attackTypes).length === 0) {
    console.error('Attack type definitions not loaded');
    return fallbackHTML;
}
```

## Debugging Guidelines

### Essential Debug Logging
Add comprehensive logging to every component:
```javascript
handleEvent(e, element) {
    const action = element.dataset.action;
    console.log(`[${this.constructor.name}] Handling action: ${action}`, {
        element,
        dataset: element.dataset,
        character: this.builder?.currentCharacter
    });
    
    // Handler logic here
    
    console.log(`[${this.constructor.name}] Action ${action} completed`);
}
```

### Data Validation Checks
Before using any data, verify its structure:
```javascript
render(attack, character) {
    console.log(`[${this.constructor.name}] Rendering with:`, {
        attack,
        character: character?.name,
        hasAttackTypes: !!attack?.attackTypes,
        attackTypeCount: attack?.attackTypes?.length || 0
    });
    
    if (!attack || !character) {
        console.error(`[${this.constructor.name}] Missing required data`);
        return '<div class="error">Data not available</div>';
    }
    
    // Render logic here
}
```

### Error Boundary Pattern
Wrap complex rendering in try-catch:
```javascript
render(data) {
    try {
        return this.generateComplexHTML(data);
    } catch (error) {
        console.error(`[${this.constructor.name}] Render error:`, error);
        return `<div class="error">Component failed to render: ${error.message}</div>`;
    }
}
```

## Common Anti-Patterns to Avoid

### 1. Breaking Component Independence
```javascript
// WRONG: Child component directly modifying parent
this.parentTab.selectedAttackIndex = newIndex;

// RIGHT: Child uses events, parent handles state
<button data-action="select-attack" data-index="${index}">
```

### 2. Assuming Data Availability
```javascript
// WRONG: Assuming method exists
const data = SomeSystem.getData();

// RIGHT: Checking method availability
const data = SomeSystem.getData?.() || [];
```

### 3. Silent Failures
```javascript
// WRONG: Failing silently
if (!isValid) return;

// RIGHT: Logging failures
if (!isValid) {
    console.error('Validation failed:', errors);
    this.showNotification('Action failed: ' + errors[0], 'error');
    return;
}
```

### 4. Massive Re-renders
```javascript
// WRONG: Re-rendering entire component
this.render();

// RIGHT: Granular updates
this.updateSpecificSection(changedData);
```

## Testing and Verification

### Manual Testing Checklist
1. **Open browser console** - Check for JavaScript errors
2. **Verify data loading** - Confirm GameDataManager initialization
3. **Test each interaction** - Click every button, try every dropdown
4. **Check state persistence** - Verify changes are saved and loaded
5. **Validate error handling** - Test invalid inputs and edge cases

### Debug Mode Features
Enable comprehensive debugging:
```javascript
const DEBUG_MODE = true;

if (DEBUG_MODE) {
    // Log all event delegations
    // Show data loading progress
    // Highlight interactive elements
    // Display state change notifications
}
```

### Performance Monitoring
Track expensive operations:
```javascript
console.time('Special Attack Render');
const html = this.renderSpecialAttackBuilder(character);
console.timeEnd('Special Attack Render');
```

## Integration with Other Systems

### With Business Logic Systems
- UI never directly modifies character data
- All changes go through system validation
- UI displays validation results to users
- System errors are caught and displayed gracefully

### With Data Layer
- Components always check data availability
- Fallback content for missing or loading data
- Error states for data loading failures
- Cache-friendly data access patterns

### With Core Infrastructure
- EventManager handles all interaction delegation
- RenderUtils provides consistent HTML generation
- UpdateManager coordinates state changes
- CharacterBuilder orchestrates everything

## Future Improvements
- Consider moving to a reactive framework for complex state management
- Implement virtual DOM for performance optimization
- Add comprehensive accessibility support
- Create automated UI testing suite
- Develop component documentation with examples