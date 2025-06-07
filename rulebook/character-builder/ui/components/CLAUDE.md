# UI Components Directory - CLAUDE.md

This directory contains modular UI components that handle specific functionality within the character builder.

## Purpose
Reusable, focused components that encapsulate specific UI logic while maintaining independence from each other and delegation to parent containers.

## Architecture Pattern
- **Single Responsibility**: Each component handles one specific UI concern
- **Event Delegation**: Components use data-action attributes, parents handle events
- **Stateless Rendering**: Components generate HTML based on passed data
- **Granular Updates**: Components can update specific elements without full re-renders

## Component Categories

### Special Attack Components
- **AttackBasicsForm.js**: Attack name, types, conditional fields
- **LimitSelection.js**: Limit selection and management
- **UpgradeSelection.js**: Upgrade purchasing interface

### Main Pool Components  
- **ActionUpgradeSection.js**: Action upgrade purchases
- **BoonPurchaseSection.js**: Simple boon purchases
- **FlawPurchaseSection.js**: Flaw selection with reversed economics
- **TraitPurchaseSection.js**: Complex trait purchases with tier conditions
- **UniqueAbilitySection.js**: Major ability purchases
- **SimpleBoonSection.js**: Straightforward beneficial purchases

### Infrastructure Components
- **CharacterLibrary.js**: Character save/load/management
- **CharacterTree.js**: Hierarchical character organization
- **PointPoolDisplay.js**: Real-time point calculations
- **ValidationDisplay.js**: Build order and error reporting

## Component Interface Pattern

### Standard Component Structure
```javascript
export class ComponentName {
    constructor(parentTab) {
        this.parentTab = parentTab;
        // Component-specific initialization
    }

    render(primaryData, character) {
        // Validate inputs
        if (!primaryData || !character) {
            return this.renderErrorState();
        }
        
        // Generate HTML
        return `<div class="component-container">
            ${this.renderContent(primaryData, character)}
        </div>`;
    }

    // Granular update methods
    updateSpecificSection(data) {
        const element = document.querySelector('.specific-section');
        if (element) {
            element.innerHTML = this.renderSpecificContent(data);
        }
    }

    // Error handling
    renderErrorState(message = 'Component unavailable') {
        return `<div class="error-state">${message}</div>`;
    }
}
```

### Event Handling Pattern
Components never handle events directly:
```javascript
// CORRECT: Use data-action attributes
renderButton(action, data) {
    return `<button data-action="${action}" data-item-id="${data.id}">
        ${data.label}
    </button>`;
}

// WRONG: Direct event handling in components
renderButton(action, data) {
    return `<button onclick="this.handleClick()">
        ${data.label}
    </button>`;
}
```

## Critical Component Guidelines

### Data Dependency Management
Always verify data availability:
```javascript
render(attack, character) {
    // Verify required systems are available
    const attackTypes = AttackTypeSystem.getAttackTypeDefinitions?.();
    if (!attackTypes) {
        console.error(`[${this.constructor.name}] AttackTypeSystem not available`);
        return this.renderErrorState('Attack types not loaded');
    }

    // Verify data structure
    if (!attack || !character) {
        console.error(`[${this.constructor.name}] Missing required data`, {
            hasAttack: !!attack,
            hasCharacter: !!character
        });
        return this.renderErrorState('Required data not available');
    }

    // Continue with rendering
}
```

### Robust HTML Generation
Handle missing or malformed data gracefully:
```javascript
renderItemList(items = []) {
    if (!Array.isArray(items)) {
        console.warn(`[${this.constructor.name}] Items is not an array:`, items);
        items = [];
    }

    return items.map(item => {
        const name = item?.name || 'Unknown Item';
        const cost = item?.cost || 0;
        const id = item?.id || `fallback-${Date.now()}`;
        
        return `<div class="item" data-action="select-item" data-item-id="${id}">
            <span class="item-name">${name}</span>
            <span class="item-cost">${cost}p</span>
        </div>`;
    }).join('');
}
```

### Error Boundary Implementation
Wrap complex operations in try-catch blocks:
```javascript
render(data, character) {
    try {
        console.log(`[${this.constructor.name}] Starting render`, {
            dataType: typeof data,
            characterName: character?.name,
            timestamp: new Date().toISOString()
        });

        const html = this.generateComplexHTML(data, character);
        
        console.log(`[${this.constructor.name}] Render completed successfully`);
        return html;
        
    } catch (error) {
        console.error(`[${this.constructor.name}] Render failed:`, {
            error: error.message,
            stack: error.stack,
            data,
            character: character?.name
        });
        
        return this.renderErrorState(`Render failed: ${error.message}`);
    }
}
```

## Specific Component Considerations

### AttackBasicsForm.js
**Purpose**: Attack name, type selection, conditional fields
**Critical Issues**:
- Must verify AttackTypeSystem methods exist before calling
- Selected types should display as removable tags
- Conditional fields (hybrid order, conditions) appear based on effect types
- Dropdown clearing after selections

### LimitSelection.js  
**Purpose**: Limit selection for special attacks
**Critical Issues**:
- Avoid confusing modal interfaces - show limits inline
- Make limit cards directly clickable
- Show validation errors on cards that can't be selected
- Display hierarchical limit categories properly

### TraitPurchaseSection.js
**Purpose**: Complex trait purchases with tier conditions
**Critical Issues**:
- Three-tier trait system with complex validation
- Must handle tier-based availability correctly
- Show clear purchase paths and requirements
- Handle trait removal with dependency checking

## Debugging Component Issues

### Essential Debug Information
Add this logging to every component:
```javascript
render(data, character) {
    const debugInfo = {
        component: this.constructor.name,
        timestamp: new Date().toISOString(),
        dataKeys: data ? Object.keys(data) : 'null',
        characterName: character?.name || 'unknown',
        parentTab: this.parentTab?.constructor.name || 'unknown'
    };
    
    console.log(`[COMPONENT DEBUG]`, debugInfo);
    
    // Rest of render method
}
```

### Data Validation Checks
Verify all assumptions about data structure:
```javascript
validateInputData(data, character) {
    const errors = [];
    
    if (!data) errors.push('Primary data is null/undefined');
    if (!character) errors.push('Character is null/undefined');
    if (character && !character.name) errors.push('Character missing name property');
    
    // Component-specific validations
    if (this.constructor.name === 'AttackBasicsForm') {
        if (!data.attackTypes) errors.push('Attack missing attackTypes array');
        if (!data.effectTypes) errors.push('Attack missing effectTypes array');
    }
    
    if (errors.length > 0) {
        console.error(`[${this.constructor.name}] Input validation failed:`, errors);
        return false;
    }
    
    return true;
}
```

### Method Availability Checks
Before calling any system methods:
```javascript
getRequiredData() {
    const systemChecks = {
        AttackTypeSystem: !!AttackTypeSystem.getAttackTypeDefinitions,
        SpecialAttackSystem: !!SpecialAttackSystem.getAvailableLimits,
        GameDataManager: !!gameDataManager.isInitialized
    };
    
    console.log(`[${this.constructor.name}] System availability:`, systemChecks);
    
    const missingMethods = Object.entries(systemChecks)
        .filter(([system, available]) => !available)
        .map(([system]) => system);
    
    if (missingMethods.length > 0) {
        console.error(`[${this.constructor.name}] Missing required systems:`, missingMethods);
        return null;
    }
    
    // Proceed with data retrieval
}
```

## Common Component Anti-Patterns

### 1. Direct State Modification
```javascript
// WRONG: Modifying parent state directly
this.parentTab.selectedIndex = newIndex;

// RIGHT: Using events for state changes
<button data-action="select-item" data-index="${newIndex}">
```

### 2. Assuming Method Existence
```javascript
// WRONG: Calling methods without checking
const data = SomeSystem.getData();

// RIGHT: Checking method availability first
const data = SomeSystem.getData?.() || [];
```

### 3. Silent Error Handling
```javascript
// WRONG: Failing silently
if (!data) return '';

// RIGHT: Logging and providing fallbacks
if (!data) {
    console.error(`[${this.constructor.name}] No data provided`);
    return this.renderErrorState('Data not available');
}
```

### 4. Mixing UI and Business Logic
```javascript
// WRONG: Business logic in component
calculateCost(item) {
    return item.baseCost * this.parentTab.character.tier;
}

// RIGHT: Delegating to systems
const cost = SomeSystem.calculateItemCost(item, character);
```

## Performance Optimization

### Selective Updates
Instead of full re-renders, update specific elements:
```javascript
updateItemList(newItems) {
    const container = document.querySelector('.item-list');
    if (container) {
        container.innerHTML = this.renderItemList(newItems);
    }
}
```

### Debounced Updates
For frequently changing data:
```javascript
constructor(parentTab) {
    this.parentTab = parentTab;
    this.updateDebounced = this.debounce(this.update.bind(this), 100);
}

debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
```

### Memory Management
Clean up references when components are destroyed:
```javascript
destroy() {
    this.parentTab = null;
    // Clear any timeouts or intervals
    // Remove any cached data
}
```

## Testing Component Functionality

### Manual Component Testing
1. **Isolation Testing**: Test component with mock data
2. **Integration Testing**: Test component within parent tab
3. **Error State Testing**: Test with invalid/missing data
4. **Event Testing**: Verify all interactive elements trigger correct events
5. **Update Testing**: Verify granular updates work correctly

### Debug Mode Features
Enable detailed component debugging:
```javascript
const COMPONENT_DEBUG = true;

if (COMPONENT_DEBUG) {
    // Highlight component boundaries
    // Log all data transformations
    // Show event delegation paths
    // Display performance metrics
}
```