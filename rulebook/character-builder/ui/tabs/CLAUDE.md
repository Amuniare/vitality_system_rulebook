# UI Tabs Directory - CLAUDE.md

This directory contains the main application tabs that represent the different phases of character creation in the Vitality System.

## Purpose
Top-level UI orchestrators that manage entire character building phases, coordinate child components, and handle the flow between different aspects of character creation.

## Architecture Pattern
- **Phase Management**: Each tab represents a distinct phase in character building
- **Component Orchestration**: Tabs coordinate multiple child components
- **Event Centralization**: All events from child components are handled by tabs
- **Build Order Enforcement**: Tabs enforce the proper sequence of character creation

## Tab Overview and Build Order

### 1. BasicInfoTab.js
**Purpose**: Character name, tier selection, basic information
**Build Phase**: Foundation (always accessible)
**Dependencies**: None
**Unlocks**: All other tabs

### 2. ArchetypeTab.js  
**Purpose**: 7 archetype category selections
**Build Phase**: Foundation (must complete before attributes)
**Dependencies**: Basic info
**Unlocks**: Attribute allocation, affects all other systems

### 3. AttributeTab.js
**Purpose**: Combat and utility attribute allocation  
**Build Phase**: Core stats (unlocked after archetypes)
**Dependencies**: Archetypes selected
**Unlocks**: Main pool purchases

### 4. MainPoolTab.js
**Purpose**: Boons, traits, flaws, unique abilities, actions
**Build Phase**: Character specialization
**Dependencies**: Attributes allocated  
**Unlocks**: Special attacks

### 5. SpecialAttackTab.js
**Purpose**: Complex special attack builder with limits and upgrades
**Build Phase**: Combat abilities
**Dependencies**: Main pool purchases
**Unlocks**: Utility purchases

### 6. UtilityTab.js
**Purpose**: Expertise, features, senses, movement, descriptors
**Build Phase**: Final character details
**Dependencies**: Special attacks created
**Unlocks**: Character completion

### 7. SummaryTab.js
**Purpose**: Character overview, validation, export
**Build Phase**: Review and finalization
**Dependencies**: All previous tabs
**Unlocks**: Character export/save

## Critical Tab Implementation Patterns

### Standard Tab Structure
```javascript
export class SomeTab {
    constructor(characterBuilder) {
        this.builder = characterBuilder;
        this.selectedIndex = 0; // For tabs with multiple items
        this.expandedCategories = new Set(); // For collapsible content
        
        // Initialize child components
        this.childComponent1 = new ChildComponent1(this);
        this.childComponent2 = new ChildComponent2(this);
    }

    render() {
        const character = this.builder.currentCharacter;
        if (!character) {
            return this.renderNoCharacterState();
        }
        
        const tabContent = document.getElementById(`tab-${this.tabName}`);
        if (!tabContent) {
            console.error(`Tab content element not found: tab-${this.tabName}`);
            return;
        }

        try {
            tabContent.innerHTML = this.generateTabHTML(character);
            this.setupEventListeners();
        } catch (error) {
            console.error(`[${this.constructor.name}] Render failed:`, error);
            tabContent.innerHTML = this.renderErrorState(error);
        }
    }

    setupEventListeners() {
        EventManager.delegateEvents(document.getElementById(`tab-${this.tabName}`), {
            click: { '[data-action]': (e, el) => this.handleEvent(e, el) },
            change: { 'select[data-action]': (e, el) => this.handleEvent(e, el) },
            input: { 'input[data-action]': (e, el) => this.handleEvent(e, el) }
        });
    }

    handleEvent(e, element) {
        const { action, ...data } = element.dataset;
        e.stopPropagation();

        console.log(`[${this.constructor.name}] Handling action: ${action}`, {
            element,
            dataset: element.dataset
        });

        const handlers = {
            'kebab-case-action': () => this.handleSpecificAction(data),
            // More handlers...
        };

        const handler = handlers[action];
        if (handler) {
            try {
                handler();
            } catch (error) {
                console.error(`[${this.constructor.name}] Action ${action} failed:`, error);
                this.builder.showNotification(`Action failed: ${error.message}`, 'error');
            }
        } else {
            console.warn(`[${this.constructor.name}] No handler found for action: ${action}`);
        }
    }

    onCharacterUpdate() {
        // Granular updates without full re-render
        this.updateSpecificSections();
    }
}
```

### Event Handling Requirements
**Critical**: All interactive elements must use data-action attributes with kebab-case names:

```html
<!-- CORRECT: kebab-case action names -->
<button data-action="create-attack" data-index="0">Create Attack</button>
<select data-action="add-effect-type">...</select>
<input data-action="update-character-name">

<!-- WRONG: camelCase or other formats -->
<button data-action="createAttack">Create Attack</button>
<button onclick="createAttack()">Create Attack</button>
```

Handler objects must match exactly:
```javascript
const handlers = {
    'create-attack': () => this.createAttack(),  // Matches data-action="create-attack"
    'add-effect-type': () => this.addEffectType(element.value),
    'update-character-name': () => this.updateCharacterName(element.value)
};
```

## Specific Tab Considerations

### SpecialAttackTab.js - High Complexity
**Most Complex Tab**: Handles special attack creation with multiple child components
**Critical Issues**:
- Must coordinate AttackBasicsForm, LimitSelection, and UpgradeSelection components
- Event handling for multiple data types (attack types, effect types, limits, upgrades)
- Complex state management with selectedAttackIndex tracking
- Integration with SpecialAttackSystem for business logic

**Previous Problems**:
- Event handler action name mismatches (camelCase vs kebab-case)
- Missing data validation for AttackTypeSystem methods
- Modal interfaces causing UX confusion
- Component lifecycle issues during updates

### MainPoolTab.js - Multiple Systems
**Complex Coordination**: Manages 5 different purchase systems
**Critical Issues**:
- Coordinates ActionUpgradeSection, BoonPurchaseSection, FlawPurchaseSection, TraitPurchaseSection, UniqueAbilitySection
- Different point pools and validation rules for each section
- Complex trait purchase system with tier conditions
- Flaw economics reversal (flaws cost points but provide attribute bonuses)

### ArchetypeTab.js - Foundation Dependencies
**Critical Dependencies**: All other systems depend on archetype selections
**Critical Issues**:
- Must enforce completion of all 7 archetype categories before proceeding
- Archetype changes invalidate downstream purchases
- Each archetype affects point calculations and available options
- Build order validation prevents access to later tabs until complete

## Debugging Tab Issues

### Essential Debug Logging
Add comprehensive logging to every tab:

```javascript
handleEvent(e, element) {
    const { action, ...data } = element.dataset;
    
    console.log(`[${this.constructor.name}] Event Debug:`, {
        action,
        element: element.tagName,
        dataset: element.dataset,
        character: this.builder?.currentCharacter?.name,
        timestamp: new Date().toISOString()
    });
    
    e.stopPropagation();
    
    // Handler logic...
    
    console.log(`[${this.constructor.name}] Action ${action} completed successfully`);
}
```

### Data Validation Before Use
Always verify data availability and structure:

```javascript
render() {
    const character = this.builder.currentCharacter;
    
    console.log(`[${this.constructor.name}] Render started:`, {
        hasCharacter: !!character,
        characterName: character?.name,
        hasRequiredSystems: this.validateRequiredSystems()
    });
    
    if (!character) {
        console.error(`[${this.constructor.name}] No character available for rendering`);
        return this.renderNoCharacterState();
    }
    
    // Validate required systems
    if (!this.validateRequiredSystems()) {
        console.error(`[${this.constructor.name}] Required systems not available`);
        return this.renderSystemsUnavailableState();
    }
    
    // Continue with render...
}

validateRequiredSystems() {
    const requiredSystems = this.getRequiredSystems();
    const unavailableSystems = [];
    
    for (const [systemName, system] of Object.entries(requiredSystems)) {
        if (!system || typeof system !== 'object') {
            unavailableSystems.push(systemName);
        }
    }
    
    if (unavailableSystems.length > 0) {
        console.error(`[${this.constructor.name}] Missing systems:`, unavailableSystems);
        return false;
    }
    
    return true;
}
```

### Child Component Integration
Monitor child component rendering and updates:

```javascript
generateTabHTML(character) {
    console.log(`[${this.constructor.name}] Generating HTML with child components`);
    
    const components = [];
    
    // Render each child component with error handling
    if (this.childComponent1) {
        try {
            const html = this.childComponent1.render(this.getDataForChild1(character), character);
            components.push({ name: 'childComponent1', success: true, html });
        } catch (error) {
            console.error(`[${this.constructor.name}] childComponent1 render failed:`, error);
            components.push({ 
                name: 'childComponent1', 
                success: false, 
                html: `<div class="error">Component failed: ${error.message}</div>` 
            });
        }
    }
    
    console.log(`[${this.constructor.name}] Component render results:`, 
        components.map(c => ({ name: c.name, success: c.success }))
    );
    
    return this.combineComponentHTML(components);
}
```

## State Management Patterns

### Character Modification Flow
All character changes must follow this pattern:

```javascript
handleCharacterModification(action, data) {
    try {
        // 1. Validate the action
        const validation = SomeSystem.validateAction(this.builder.currentCharacter, data);
        if (!validation.isValid) {
            this.builder.showNotification(validation.errors[0], 'error');
            return;
        }
        
        // 2. Perform the system operation
        SomeSystem.performAction(this.builder.currentCharacter, data);
        
        // 3. Update character and trigger UI refresh
        this.builder.updateCharacter();
        
        // 4. Provide user feedback
        this.builder.showNotification('Action completed successfully', 'success');
        
    } catch (error) {
        console.error(`[${this.constructor.name}] Character modification failed:`, error);
        this.builder.showNotification(`Action failed: ${error.message}`, 'error');
    }
}
```

### Build Order Enforcement
Tabs must respect and enforce build order:

```javascript
checkBuildOrderRequirements() {
    const character = this.builder.currentCharacter;
    const buildState = character.buildState;
    
    // Define requirements for this tab
    const requirements = {
        archetypesComplete: this.requiresArchetypes,
        attributesAssigned: this.requiresAttributes,
        mainPoolPurchases: this.requiresMainPool,
        // etc.
    };
    
    const unmetRequirements = [];
    for (const [requirement, required] of Object.entries(requirements)) {
        if (required && !buildState[requirement]) {
            unmetRequirements.push(requirement);
        }
    }
    
    if (unmetRequirements.length > 0) {
        console.warn(`[${this.constructor.name}] Build order requirements not met:`, unmetRequirements);
        return false;
    }
    
    return true;
}
```

## Performance Optimization

### Selective Re-rendering
Avoid full tab re-renders when possible:

```javascript
onCharacterUpdate() {
    // Instead of full re-render
    // this.render();
    
    // Use selective updates
    this.updatePointDisplays();
    this.updateValidationStatus();
    this.refreshAvailableOptions();
    
    // Update child components granularly
    if (this.childComponent1) {
        this.childComponent1.onCharacterUpdate?.();
    }
}
```

### Event Handler Optimization
Cache frequently accessed elements and data:

```javascript
constructor(characterBuilder) {
    this.builder = characterBuilder;
    this.cachedElements = {};
    this.cachedData = {};
}

getCachedElement(selector) {
    if (!this.cachedElements[selector]) {
        this.cachedElements[selector] = document.querySelector(selector);
    }
    return this.cachedElements[selector];
}

clearElementCache() {
    this.cachedElements = {};
}

render() {
    // Clear cache before re-render
    this.clearElementCache();
    
    // Continue with render...
}
```

## Testing Tab Functionality

### Manual Testing Checklist
For each tab:
1. **Render Test**: Tab renders without JavaScript errors
2. **Data Test**: All required data loads correctly
3. **Interaction Test**: Every button, dropdown, and input works
4. **Validation Test**: Invalid actions show appropriate errors
5. **Integration Test**: Changes affect other tabs correctly
6. **Build Order Test**: Tab respects prerequisite requirements

### Automated Testing Considerations
- Mock child components for isolated tab testing
- Test event delegation with various DOM structures
- Verify error handling doesn't break tab functionality
- Test performance with large data sets

### Debug Mode Features
Enable comprehensive tab debugging:

```javascript
const TAB_DEBUG = true;

if (TAB_DEBUG) {
    // Log all event delegations
    // Highlight interactive elements
    // Show component render times
    // Display state changes
    // Track build order progression
}
```