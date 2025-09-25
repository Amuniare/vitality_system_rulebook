# CLAUDE.md (modernApp)
## AI Collaboration Guide for ModernApp Development

### Project Context

This is version 3 of the Vitality System character builder, rebuilt from scratch using a universal components architecture. The goal is 50%+ code reduction through reusability while maintaining 100% rulebook accuracy. 

**Key Facts**:
- 9 tabs total (Basic Info, Archetypes, Attributes, Main Pool, Special Attacks, Utility, Base Attacks, Identity, Summary)
- Tier system: 1-10, default is 4
- No validation blocking - warnings only
- All game data in unified JSON format

### Architecture Principles

#### 1. Always Use Component Base Class
Every UI component MUST extend the Component class:
```javascript
class MyComponent extends Component {
  static propSchema = { /* validation */ };
  async onInit() { /* setup */ }
  onRender() { /* generate HTML */ }
  onMount() { /* post-render */ }
  onDestroy() { /* cleanup */ }
}
```

Never override `render()`, `init()`, `mount()`, or `destroy()` - only the `on*` versions.

#### 2. State Flows Down, Events Flow Up
- Components receive data through props (never access state directly)
- User actions emit events that bubble up
- State changes flow back down as new props
- Break this rule = break the architecture

#### 3. Never Access DOM Directly
- Use component containers and utility methods
- Event delegation on containers, not elements
- Let RenderQueue handle DOM updates
- Query selectors only in initialization

#### 4. All Renders Through RenderQueue
- Use `this._requestRender()` not manual render
- Never call `onRender()` directly
- Trust the batching system
- Check render metrics for performance

#### 5. Data Defines UI, Not Code
- UI configuration lives in JSON
- Components adapt to data shape
- New content = edit JSON, not JavaScript
- Universal components handle all entity types

### Code Standards

#### Component Creation Pattern
```javascript
// Always follow this structure
export class MyComponent extends Component {
  static propSchema = {
    items: { type: 'array', required: true },
    selected: { type: 'string', default: null }
  };
  
  async onInit() {
    // Setup, event listeners
    this.attachEventListeners();
  }
  
  onRender() {
    // Return HTML string
    return `<div class="my-component">...</div>`;
  }
  
  onMount() {
    // Post-render DOM work
  }
  
  onDestroy() {
    // Cleanup
    super.onDestroy(); // Always call parent
  }
  
  attachEventListeners() {
    // Use event delegation
    this.addEventListener(this.container, 'click', (e) => {
      const action = e.target.closest('[data-action]');
      if (action) this.handleAction(action.dataset.action);
    });
  }
}
```

#### Event Naming Conventions
- Component events: `component-action` (e.g., `tab-selected`, `item-purchased`)
- Global events: `ENTITY_ACTION` (e.g., `CHARACTER_LOADED`, `STATE_CHANGED`)
- Always past tense for completed actions
- Include relevant data in event payload

#### Props Validation Requirements
- Define all expected props in `propSchema`
- Include type, required, default
- Validate in Component base class
- Log warnings for invalid props
- Never throw on validation errors

#### Error Handling Patterns
```javascript
try {
  // Risky operation
} catch (error) {
  Logger.error(`[ComponentName] Operation failed:`, error);
  // Graceful fallback
  this.showError('Something went wrong');
}
```

#### Logging Standards
- Prefix with `[ComponentName]`
- Debug: Detailed flow information
- Info: Important state changes
- Warn: Recoverable issues
- Error: Failures needing attention

### Common Pitfalls

#### Don't Override render()
```javascript
// ❌ WRONG
render() {
  this.container.innerHTML = this.generateHTML();
}

// ✅ CORRECT  
onRender() {
  return this.generateHTML();
}
```

#### Don't Call mount() Before init()
```javascript
// ❌ WRONG
const comp = new MyComponent(props, container);
comp.mount(); // Will fail

// ✅ CORRECT
const comp = new MyComponent(props, container);
await comp.init();
comp.mount();
```

#### Don't Forget Cleanup
```javascript
// ❌ WRONG
onDestroy() {
  // Custom cleanup only
}

// ✅ CORRECT
onDestroy() {
  // Custom cleanup first
  super.onDestroy(); // Parent cleanup
}
```

#### Don't Access State Directly
```javascript
// ❌ WRONG  
onRender() {
  const name = StateManager.getState().character.name;
}

// ✅ CORRECT
onRender() {
  const name = this.props.characterName;
}
```

#### Don't Attach Listeners Every Render
```javascript
// ❌ WRONG
onRender() {
  const btn = this.container.querySelector('.btn');
  btn.addEventListener('click', () => {});
}

// ✅ CORRECT
onInit() {
  this.addEventListener(this.container, 'click', (e) => {
    if (e.target.matches('.btn')) { /* handle */ }
  });
}
```

### Development Workflow

#### How to Add a New Component
1. Create file in `components/` directory
2. Extend Component base class
3. Define propSchema
4. Implement lifecycle methods
5. Add to component registry
6. Create any needed templates
7. Document public API

#### How to Connect to State
1. Define mapStateToProps function
2. Use connectToState higher-order component
3. Export connected version
4. Component auto-updates on state change

```javascript
const mapStateToProps = (state) => ({
  tier: state.character.tier,
  points: state.character.mainPool
});

export default connectToState(mapStateToProps)(MyComponent);
```

#### How to Add New Data Types
1. Add to unified-game-data.json
2. Follow entity schema structure
3. Include UI configuration
4. Add any new effect types
5. Update relevant systems
6. Test with UniversalCard

#### How to Debug Issues
1. Enable debug logging: `Logger.setLevel('debug')`
2. Check component lifecycle logs
3. Verify props passed correctly
4. Trace event flow
5. Monitor RenderQueue metrics
6. Use breakpoints in lifecycle methods

#### How to Test Components
1. Test props validation
2. Test lifecycle methods
3. Test event handling
4. Test state updates
5. Test error cases
6. Test performance

### Key Files Reference

#### Core Systems
- `core/Component.js` - Base class for all components
- `core/StateManager.js` - Central state management
- `core/EventBus.js` - Global event system
- `core/RenderQueue.js` - Render optimization
- `core/StateConnector.js` - Props mapping system

#### Important Components  
- `components/UniversalCard.js` - Renders any entity
- `components/TabNavigation.js` - Main navigation
- `components/PointPoolDisplay.js` - Point tracking
- `components/PurchaseCard.js` - Purchase UI

#### Data Schemas
- `data/unified-game-data.json` - All game content
- `data/schemas/` - JSON schemas for validation

#### Configuration
- `config/DOMConfig.js` - DOM structure
- `config/constants.js` - App constants

### Rules to Never Break

1. **Never prevent user actions** - Warn but allow
2. **Never paraphrase rulebook text** - Use exact wording
3. **Never put game content in code** - Use JSON data
4. **Never access global state directly** - Use props
5. **Never skip the RenderQueue** - Trust the system
6. **Never create tight coupling** - Components stay independent
7. **Never ignore cleanup** - Memory leaks kill apps

### Getting Started Checklist

When starting work on this project:
1. Review current workplan.md status
2. Check modernApp/dev_logs/ for recent fixes
3. Run the app and check console for errors
4. Verify which tabs are currently working
5. Read the specific tab's implementation
6. Follow the component patterns exactly
7. Test thoroughly before calling complete