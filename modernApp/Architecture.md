# ARCHITECTURE.md
## Universal Components Framework for Vitality System Character Builder

### Executive Summary

The modernApp represents a complete architectural rebuild of the Vitality System character builder, transitioning from 15+ scattered JSON files and duplicated UI code to a unified, data-driven component architecture. This framework enables 50%+ code reduction through reusable universal components while maintaining 100% rulebook accuracy and improving maintainability.

### Core Architecture Patterns

#### Component Lifecycle
Every component follows a predictable lifecycle managed through the base Component class:
```
Constructor → Init → Mount → Render → Update → Destroy
```

Components must override only designated extension points (`onInit`, `onRender`, `onMount`, `onDestroy`) rather than core lifecycle methods. This ensures proper integration with the RenderQueue and event systems.

#### Data Flow (Unidirectional)
```
State (StateManager) → Props (StateConnector) → Components → Events → State
```

Data flows downward through props, while user actions flow upward through events. Components never directly modify state or access global data.

#### Event System Architecture
Two complementary event systems work together:
- **Component Events**: Scoped to component instances for UI interactions
- **Global EventBus**: Application-wide events for state changes and cross-component communication

#### Render Queue Optimization
All renders are batched and optimized through the RenderQueue system:
- Deduplicates render requests
- Batches DOM updates
- Provides performance metrics
- Ensures consistent render order

### System Layers

#### Data Layer
**Unified JSON Schema**: All game content in a single source of truth
```javascript
{
  "schemaVersion": "3.0",
  "entities": {
    "flaw_slow": {
      "id": "flaw_slow",
      "type": "flaw",
      "name": "Slow",
      "cost": 30,
      "description": "[exact rulebook text]",
      "effects": {...},
      "ui": { "component": "card", "category": "flaw" }
    }
  }
}
```

**Key Principles**:
- Every entity has consistent structure
- Display configuration included in data
- Exact rulebook text preserved
- No game content in JavaScript

#### State Management Layer
**StateManager**: Central state repository
- Single source of truth for character data
- Dispatches state change events
- Handles persistence to localStorage
- Supports undo/redo operations

**StateConnector**: Props mapping system
- Maps global state to component props
- Automatic re-render on state changes
- Prevents circular dependencies
- Ensures data immutability

#### Component Layer
**Base Component Class**: Foundation for all UI components
- Lifecycle management
- Event handling utilities
- Container management
- Props validation
- Render scheduling

**Component Types**:
- **Data Components**: Display game entities (UniversalCard, PurchaseCard)
- **Layout Components**: Structure UI (TabNavigation, CollapsibleSection)
- **Form Components**: Handle user input (UniversalForm, AttributeControl)
- **Display Components**: Show calculated values (PointPoolDisplay, StatDisplay)

#### Event Layer
**EventBus**: Global event system
- STATE_CHANGED: State updates
- CHARACTER_LOADED: New character loaded
- ENTITY_PURCHASED: Purchase made
- TAB_CHANGED: Navigation events

**Component Events**: Instance-scoped events
- click, change, submit: User interactions
- component-mounted, component-destroyed: Lifecycle
- Custom events per component type

#### Render Layer
**RenderQueue**: Optimized rendering pipeline
- Batches multiple render requests
- Prevents render thrashing
- Provides performance metrics
- Handles render prioritization

**Template Engine**: Consistent HTML generation
- Centralized templates
- Prevents XSS vulnerabilities
- Consistent styling hooks
- Performance optimized

### Component Architecture

#### Universal Component API
Every component implements:
```javascript
class MyComponent extends Component {
  static propSchema = {
    // Props validation schema
  };
  
  async onInit() {
    // Setup logic
  }
  
  onRender() {
    // Generate HTML
  }
  
  onMount() {
    // Post-render setup
  }
  
  onDestroy() {
    // Cleanup
  }
}
```

#### Props Validation
Components declare expected props:
```javascript
static propSchema = {
  items: { type: 'array', required: true },
  selectedId: { type: 'string', default: null },
  onSelect: { type: 'function', required: true }
}
```

#### Self-Contained Components
Components manage their own:
- DOM containers (create if missing)
- Event listeners (attach/detach)
- Child components (lifecycle)
- State subscriptions (cleanup)

#### Event Delegation
Use stable event delegation patterns:
```javascript
// Attach to container, not individual elements
this.addEventListener(this.container, 'click', (e) => {
  const button = e.target.closest('[data-action]');
  if (button) this.handleAction(button.dataset.action);
});
```

### Data Architecture

#### Unified Purchase Schema
All purchasable entities follow consistent structure:
```javascript
{
  "id": "unique_identifier",
  "type": "flaw|trait|boon|upgrade|ability",
  "name": "Display Name",
  "cost": 30,
  "description": "Exact rulebook text",
  "requirements": [...],
  "effects": [...],
  "ui": {
    "component": "card",
    "size": "medium",
    "category": "main_pool"
  }
}
```

#### Display Configuration
UI rendering instructions in data:
- Component type to use
- Visual size/style
- Category for filtering
- Warning text
- Help tooltips

#### Validation as Data
Rules expressed declaratively:
```javascript
"requirements": [
  { "type": "archetype", "value": "movement_swift", "not": true },
  { "type": "attribute", "target": "mobility", "min": 3 }
]
```

### Key Design Decisions

#### Why Universal Components?
- **Code Reuse**: One PurchaseCard handles all entity types
- **Consistency**: Same interaction patterns everywhere
- **Maintainability**: Fix once, works everywhere
- **Extensibility**: New content = new JSON, not new code

#### Why Props-Based State?
- **Predictability**: Components can't corrupt global state
- **Testability**: Components are pure functions of props
- **Debugging**: Clear data flow path
- **Performance**: Targeted updates only

#### Why RenderQueue?
- **Performance**: Batch DOM updates
- **Consistency**: Predictable render order
- **Debugging**: Render performance metrics
- **Control**: Pause/resume rendering

#### Why Template Engine?
- **Security**: Prevent XSS attacks
- **Performance**: Template caching
- **Consistency**: Standardized HTML structure
- **Maintainability**: Central template updates

### Implementation Standards

#### Component Creation Checklist
1. Extend Component base class
2. Define propSchema for validation
3. Implement required lifecycle methods
4. Use event delegation for interactions
5. Clean up in onDestroy
6. Document public API

#### State Connection Pattern
```javascript
// Map state to props
const mapStateToProps = (state) => ({
  characterName: state.character.name,
  tier: state.character.tier
});

// Create connected component
const ConnectedComponent = connectToState(mapStateToProps)(MyComponent);
```

#### Event Handling Best Practices
- Use data attributes for actions
- Delegate events to container
- Prevent default when needed
- Stop propagation judiciously
- Clean up listeners on destroy

#### Performance Rules
- Never query DOM in loops
- Batch DOM updates through RenderQueue
- Use requestAnimationFrame for animations
- Implement virtual scrolling for long lists
- Cache expensive calculations
