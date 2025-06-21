I'll help you create an updated workplan by first reviewing the existing documentation and both web applications. Let me search through your project files to understand the current state and what's been completed.# Updated Detailed Workplan - Vitality Character Builder v3.0

Based on my review of the current state, here's a comprehensive workplan for completing the modernApp.

## Current Status Summary

### ✅ Completed:
- **Data Migration**: unified-game-data.json created (447.6 KB)
- **Core Architecture**: SchemaSystem, StateManager, EventBus, EntityLoader
- **Basic Tabs**: BasicInfo, Archetype, partial MainPool
- **Most partial JSON files** correctly formatted

### ❌ Remaining Work:
- Fix 2 hierarchical JSON files
- Fix fundamental rule errors (flaws cost)
- Complete 5 missing tabs
- Implement 3 empty systems
- Build 2 empty components
- Add character management & export features

## Phase 1: Critical Data Fixes (2 days)

### Day 1: Fix Hierarchical JSON Files
**Goal**: Flatten limits.json and unique_abilities.json

1. **Fix limits.json** (Morning)
   - Flatten all nested structures
   - Convert every limit/variant/modifier to top-level entity
   - Add parentId relationships
   - Fix cost format: `"cost": 40` → `"cost": { "value": 40, "pool": "limit_points", "display": "+40p" }`

2. **Fix unique_abilities.json** (Afternoon)
   - Flatten abilities and upgrades
   - Add parentId links
   - Standardize cost objects
   - Add all required schema fields

### Day 2: Fix Rule Economics & Validation
**Goal**: Correct fundamental rule errors

1. **Fix Flaw Economics** (Morning)
   - Update PoolCalculator: flaws COST 30 points
   - Fix MainPoolTab display logic
   - Ensure traits also cost 30 points

2. **Run Build & Validate** (Afternoon)
   - Execute build_game_data.py
   - Create validation script for parentId relationships
   - Verify all data integrity
   - Test pool calculations

## Phase 2: Core Systems Implementation (3 days)

### Day 3: RequirementSystem
**Goal**: Complete prerequisite checking

```javascript
// Implement:
- checkRequirements(entity, character)
- getUnmetRequirements(entity, character)
- validatePurchase(entity, character)
- Support for: tier, archetype, stat, entity dependencies
```

### Day 4: EffectSystem
**Goal**: Handle all stat modifications

```javascript
// Implement:
- applyEffects(effects, character)
- calculateModifiers(character)
- getActiveEffects(character)
- Support for: stat bonuses, conditional modifiers, stacking rules
```

### Day 5: UnifiedPurchaseSystem
**Goal**: Centralized purchase logic

```javascript
// Implement:
- purchaseEntity(entityId, character)
- removeEntity(purchaseId, character)
- validatePurchase(entity, character)
- Integration with pools, requirements, effects
```

## Phase 3: Universal Components (2 days)

### Day 6: Component Development

1. **UniversalForm** (Morning)
   - Dynamic form generation from JSON schema
   - Field validation with advisory warnings
   - Support for all input types
   - Integration with StateManager

2. **UniversalList** (Afternoon)
   - Filterable/sortable entity lists
   - Search functionality
   - Pagination for large datasets
   - Category grouping

### Day 7: Component Polish
- Complete UniversalCard variants
- Add loading states
- Implement error boundaries
- Performance optimization

## Phase 4: Tab Implementation (5 days)

### Day 8: Complete MainPoolTab
- Fix flaw/trait purchase logic
- Implement boons section
- Add action purchases
- Complete UI interactions

### Day 9: Special Attacks Tab
- Attack creation interface
- Type/effect selection
- Limit system integration
- Upgrade management
- Cost calculation

### Day 10: Utility Tab
- Expertise system (activity/situational)
- Features selection
- Senses management
- Movement features
- Skills interface

### Day 11: Bio/Identity Tab
- Character background form
- Questionnaire system
- Character portrait upload
- Notes/description fields
- Export bio data

### Day 12: Base Attacks Tab (New Feature)
- Base attack configuration
- Quick action upgrades
- Attribute selection
- Damage calculation display
- Integration with combat stats

## Phase 5: Advanced Features (3 days)

### Day 13: Character Management
```javascript
// Features:
- Multi-character support
- Character list/grid view
- Folders/categories
- Quick duplicate
- Character search
- Recently used
```

### Day 14: Import/Export System
```javascript
// Features:
- JSON export with schema version
- Import with validation
- Backwards compatibility
- Export profiles (full/summary)
- Roll20 format conversion
```

### Day 15: Summary Tab & Polish
- Complete character summary
- Validation warnings display
- Print-friendly view
- Quick actions panel
- Performance optimization

## Phase 6: Testing & Documentation (2 days)

### Day 16: Integration Testing
- End-to-end character creation
- Cross-tab data sync
- Pool calculations
- Export/import cycle
- Browser compatibility

### Day 17: Documentation & Deployment
- User guide creation
- Developer documentation
- Deployment scripts
- Performance benchmarks
- Bug fixes from testing

## Success Metrics

1. **Code Reduction**: Target 50%+ reduction achieved
2. **Performance**: < 2s load, < 100ms interactions
3. **Data Size**: unified-game-data.json < 500KB ✅
4. **Rules Accuracy**: 100% compliance with rulebook
5. **Features**: All 8 tabs + character management

## Risk Mitigation

**Risk**: Complex hierarchical UI for limits/abilities
- **Mitigation**: Build HierarchicalDisplay component with expand/collapse

**Risk**: Performance with large character lists
- **Mitigation**: Virtual scrolling, lazy loading, indexedDB for storage

**Risk**: Roll20 export compatibility
- **Mitigation**: Test with actual Roll20 API, maintain mapping documentation

## Next Immediate Steps

1. **Today**: Fix limits.json and unique_abilities.json structure
2. **Tomorrow**: Correct flaw economics in PoolCalculator
3. **This Week**: Complete core systems (Requirement, Effect, Purchase)
4. **Next Week**: Implement all remaining tabs

## Additional Features for Future Consideration

- Campaign management (multiple characters per campaign)
- Shared character templates
- Combat tracker integration
- Automated character advancement
- Mobile app version
- Real-time collaboration

