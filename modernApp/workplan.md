I'll provide a detailed implementation plan to transform your system into a more robust, predictable architecture.## Detailed Implementation Plan

Based on your errors and architecture analysis, here's a comprehensive plan to fix the systemic issues:

### **Phase 1: Core Infrastructure Changes**

#### **1. Create a New Component Base Class**
**File:** `modernApp/core/Component.js` (NEW)
```
Purpose: Standardize component lifecycle and state management
Changes:
- Define lifecycle methods: constructor, init, render, update, destroy
- Automatic state subscription management
- Props validation and default handling
- Event listener tracking and cleanup
- Render queue to prevent unnecessary re-renders
```

#### **2. Implement a Props System**
**File:** `modernApp/core/PropsManager.js` (NEW)
```
Purpose: Manage data flow to components
Changes:
- Define how components declare their data needs
- Automatic prop extraction from state
- Prop validation before render
- Change detection to trigger updates
```

#### **3. Refactor StateManager**
**File:** `modernApp/core/StateManager.js`
```
Changes:
- Add getState() method that returns immutable state
- Add subscribe(path, callback) for granular subscriptions
- Add unsubscribe(subscriptionId) for cleanup
- Implement state path watching (e.g., 'character.purchases.flaws')
- Add state transaction support for atomic updates
- Remove direct character property access pattern
- Implement proper state cloning before mutations
```

#### **4. Create RenderQueue System**
**File:** `modernApp/core/RenderQueue.js` (NEW)
```
Purpose: Batch renders and prevent cascading updates
Changes:
- Queue component updates
- Deduplicate render requests
- Use requestAnimationFrame for batching
- Priority-based rendering
```

### **Phase 2: Component Architecture Refactoring**

#### **5. Refactor EventBus**
**File:** `modernApp/core/EventBus.js`
```
Changes:
- Add subscription tracking by component ID
- Implement automatic cleanup on component destroy
- Add event namespacing
- Reduce redundant events (merge CHARACTER_CHANGED and ENTITY_PURCHASED)
- Add event payload validation
```

#### **6. Update All Tab Base Classes**
**Files:** All files in `modernApp/tabs/`
```
Common Changes for Each Tab:
- Extend from new Component base class
- Remove manual event listener management
- Implement proper lifecycle methods
- Use props instead of direct state access
- Separate data fetching from rendering
- Add proper cleanup methods
```

#### **7. Fix PurchaseCard Component**
**File:** `modernApp/components/PurchaseCard.js`
```
Specific Changes:
- Accept all required data as constructor parameters
- Remove direct StateManager access
- Implement proper isPurchased check with defensive coding
- Use event delegation from parent container
- Add prop validation
```

### **Phase 3: Specific File Changes**

#### **8. MainPoolTab.js**
**File:** `modernApp/tabs/MainPoolTab.js`
```
Changes:
- Extend Component base class
- Declare required state paths: ['character.purchases', 'character.tier']
- Move event listeners to init() method
- Use event delegation on container, not individual cards
- Pass complete purchase data to PurchaseCard
- Implement proper state subscription
- Remove re-rendering on every event
```

#### **9. ArchetypeTab.js**
**File:** `modernApp/tabs/ArchetypeTab.js`
```
Changes:
- Store selected archetypes in component state
- Implement optimistic UI updates
- Batch state updates
- Use proper event delegation
- Add loading states
```

#### **10. AttributesTab.js**
**File:** `modernApp/tabs/AttributesTab.js`
```
Changes:
- Implement proper event delegation for +/- buttons
- Store attribute values locally during interaction
- Batch updates to state
- Add proper input validation
- Implement debounced saves
```

#### **11. App.js**
**File:** `modernApp/app.js`
```
Changes:
- Implement proper tab lifecycle management
- Call destroy() on previous tab before switching
- Pass props to tabs instead of stateManager instance
- Implement global error boundary
- Add component registry for debugging
```

### **Phase 4: Data Flow Standardization**

#### **12. Create StateConnector**
**File:** `modernApp/core/StateConnector.js` (NEW)
```
Purpose: Connect components to state slices
Changes:
- High-order function to wrap components
- Automatic prop mapping from state
- Subscription management
- Memoization of props
```

#### **13. Update CharacterManager**
**File:** `modernApp/core/CharacterManager.js`
```
Changes:
- Ensure it always returns complete character objects
- Add validation before saving
- Implement proper change detection
- Add migration support for old data
```

### **Phase 5: Implementation Strategy**

#### **Execution Order:**

1. **Week 1: Core Infrastructure**
   - Create Component.js base class
   - Create PropsManager.js
   - Refactor StateManager.js
   - Create RenderQueue.js

2. **Week 2: Event System & State Connection**
   - Refactor EventBus.js
   - Create StateConnector.js
   - Update CharacterManager.js

3. **Week 3: Component Migration**
   - Migrate PurchaseCard.js first (smallest component)
   - Migrate MainPoolTab.js
   - Fix the "p is undefined" error

4. **Week 4: Remaining Tabs**
   - Migrate ArchetypeTab.js
   - Migrate AttributesTab.js
   - Update App.js

### **Testing Strategy:**

1. **Unit Tests for Core Systems**
   - Test Component lifecycle
   - Test state subscriptions
   - Test event propagation

2. **Integration Tests**
   - Test tab switching
   - Test purchase flow
   - Test state persistence

3. **Manual Testing Checklist**
   - Can purchase without errors
   - Buttons remain functional after tab switch
   - UI updates immediately without tab change
   - No console errors during normal use

### **Migration Path:**

1. **Parallel Implementation**
   - Build new system alongside old
   - Migrate one component at a time
   - Keep old system functional during migration

2. **Feature Flags**
   - Use flags to switch between old/new components
   - Test thoroughly before switching

3. **Gradual Rollout**
   - Start with least critical components
   - Monitor for issues
   - Complete migration tab by tab

This plan addresses all three of your core issues by:
- Ensuring consistent state access (fixes "p is undefined")
- Properly managing event listeners (fixes buttons not working)
- Implementing proper change detection (fixes need to switch tabs for updates)