# WORKPLAN.md
## ModernApp Development Workplan

### Current State Assessment

**Working Features**:
- Basic component architecture established
- TabNavigation renders but clicks don't work
- Character list displays but selection broken  
- Basic Info tab partially functional
- Data migration to unified format started

**Critical Issues**:
- Tab navigation event handlers not firing
- Character selection has undefined actions
- State updates not propagating to UI
- Component lifecycle issues (circular dependencies)
- Missing StateManager.loadCharacter method

**Architecture Status**:
- ✅ Component base class implemented
- ✅ EventBus system working
- ✅ RenderQueue implemented
- ⚠️ StateConnector partially working
- ❌ Tab click handlers broken
- ❌ Character switching broken

### Immediate Fixes (Steps 1-3)

#### Step 1: Fix TabNavigation Event Handling (COMPLETED)
**Goal**: Make tab buttons clickable and functional

**Tasks**:
1. Debug why click handler isn't firing in TabNavigation
2. Check event listener attachment in `attachEventListeners()`
3. Verify event delegation to tab buttons
4. Ensure `handleTabClick` emits correct events
5. Connect TAB_CHANGED events to app state

**Success Criteria**:
- Clicking tabs logs events
- Tab visual state updates
- Content switches correctly

#### Step 2: Fix Character List Panel (COMPLETED)
**Goal**: Enable character selection and loading

**Tasks**:
1. Define click action handlers in CharacterListPanel
2. Implement character selection logic
3. Add StateManager.loadCharacter() method
4. Emit CHARACTER_LOADED event
5. Update UI to reflect selected character

**Success Criteria**:
- Clicking character loads it
- UI updates with character data
- Current character highlighted

#### Step 3: Fix State Propagation
**Goal**: Ensure state changes update all components

**Tasks**:
1. Complete StateConnector implementation
2. Remove circular dependencies (updateProps calls)
3. Implement proper props flow
4. Fix component re-render triggers
5. Add state change logging

**Success Criteria**:
- State changes reflect immediately
- No "p is undefined" errors
- Components update without tab switch

### Core Infrastructure (Steps 4-6)

#### Step 4: Component Lifecycle Fixes
**Goal**: Standardize component patterns

**Tasks**:
1. Audit all components for lifecycle compliance
2. Fix components overriding render()
3. Ensure proper mount/unmount
4. Standardize event cleanup
5. Add lifecycle debugging

**Key Components to Fix**:
- PurchaseCard (undefined reference)
- AttributeControl
- All tab components

#### Step 5: Unified Data Layer
**Goal**: Complete data consolidation

**Tasks**:
1. Finish unified-game-data.json
2. Migrate all entity types:
   - Archetypes (all 7 types)
   - Flaws & Traits  
   - Boons
   - Unique Abilities
   - Action Upgrades
   - Utility Features
3. Add UI metadata to all entities
4. Implement data validation
5. Create data access utilities

**Data Schema Requirements**:
- Consistent ID patterns
- Type field for filtering
- UI rendering instructions
- Cost calculations
- Requirements/prerequisites

#### Step 6: Template System Enhancement
**Goal**: Centralize HTML generation

**Tasks**:
1. Create templates for all card types
2. Implement template caching
3. Add template composition
4. Security hardening (XSS prevention)
5. Performance optimization

**Templates Needed**:
- PurchaseCard
- AttributeControl  
- TabButton
- StatDisplay
- ListItem

### Feature Completion (Steps 7-10)

#### Step 7: Complete Main Pool Tab
**Goal**: Full purchase functionality

**Tasks**:
1. Fix PurchaseCard component
2. Implement all purchase types:
   - Flaws (30 points, +tier bonus)
   - Traits (30 points, conditional)
   - Boons (variable cost)
   - Unique Abilities (multi-stage)
   - Action Upgrades
3. Add filtering/search
4. Purchase/remove functionality
5. Point tracking display
6. Custom ability creation

**Success Criteria**:
- All purchases working
- Points calculate correctly
- UI updates immediately
- Search/filter functional

#### Step 8: Implement Special Attacks Tab
**Goal**: Complete attack creation system

**Tasks**:
1. Create SpecialAttackTab component
2. Attack creation interface
3. Limit selection system
4. Point calculation from archetype
5. Upgrade purchase system
6. Attack management (clone/delete)
7. Efficiency calculations

**Components Needed**:
- AttackCreator
- LimitSelector
- UpgradeGrid
- AttackList

#### Step 9: Build Remaining Tabs
**Goal**: Complete all character builder tabs

**Utility Tab**:
1. Talent text fields
2. Archetype skill selection
3. Expertise display grid
4. Feature/Sense/Movement purchases  
5. Descriptor management
6. Custom utility creation

**Base Attacks Tab**:
1. Physical attack config
2. Energy attack config  
3. Type/range selection
4. Default conditions
5. Upgrade application

**Identity Tab**:
1. Portrait upload
2. Rich text editor
3. Background fields
4. Auto-save drafts

#### Step 10: Summary & Export
**Goal**: Complete character management

**Tasks**:
1. Summary tab layout
2. Character sheet generation
3. Export formats:
   - JSON (native format)
   - Roll20 compatible
   - PDF character sheet
   - Plain text
4. Import functionality  
5. Print styling
6. Validation warnings display

**Success Criteria**:
- Complete character overview
- All export formats working
- Import preserves all data
- Warnings never block export

### Testing & Polish

#### Component Testing
- Unit tests for each component
- Props validation testing
- Event handling verification
- Lifecycle testing

#### Integration Testing  
- Complete character creation flow
- Tab switching under load
- Multi-character management
- Import/export round trip

#### Performance Testing
- Tab switch benchmarks
- Search performance
- Render optimization
- Memory leak detection

#### UI/UX Polish
- Consistent styling
- Loading states
- Error messages
- Help tooltips
- Mobile optimization

### Architecture Validation Checklist

Before marking any step complete, verify:

1. **Component Standards**:
   - Extends Component base class
   - Props validation implemented
   - Event delegation used
   - Proper cleanup in destroy

2. **Data Flow**:
   - State → Props → Component
   - Events flow up only
   - No direct state access
   - No circular updates

3. **Performance**:
   - Uses RenderQueue
   - Batches DOM updates
   - No unnecessary renders
   - Events properly throttled

4. **Code Quality**:
   - Clear naming conventions
   - Comprehensive logging
   - Error handling
   - Documentation updated

### Success Metrics

**Phase 1 (Steps 1-3)**: Basic functionality restored
- Tab navigation works
- Characters load correctly  
- State updates propagate

**Phase 2 (Steps 4-6)**: Infrastructure complete
- All components follow patterns
- Data fully migrated
- Templates implemented

**Phase 3 (Steps 7-10)**: Features complete
- All tabs functional
- Full character creation works
- Export/import working

**Final**: Production ready
- 50%+ code reduction achieved
- Performance targets met
- No critical bugs
- Documentation complete
