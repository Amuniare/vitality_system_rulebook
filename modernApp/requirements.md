I'll help you review your project and create a comprehensive business requirements document and implementation plan. Let me start by examining the key components you've mentioned.Based on my review of your project, I now have a comprehensive understanding of the Vitality System Character Builder. Let me create a detailed Business Requirements Document and Implementation Plan for rebuilding your web app.

# Business Requirements Document & Implementation Plan
## Vitality System Character Builder v3.0

### Executive Summary

The project aims to rebuild the existing Vitality Character Builder with a modern, data-driven architecture that consolidates 15+ JSON files into a single source of truth, implements universal components for 50%+ code reduction, and ensures 100% rules accuracy while adding new features like character management and Roll20 export.

### Current State Analysis

**Working System (frontend/character-builder):**
- ✅ Fully functional with 7 tabs
- ✅ Correct rule implementation  
- ❌ 15+ scattered JSON files
- ❌ Repeated UI patterns
- ❌ Mixed architectural patterns
- ❌ Event handling issues causing button failures

**New System (modernApp):**
- ✅ Modern architecture foundation
- ✅ Universal component structure started
- ❌ Fundamental rule errors (flaws giving points instead of costing)
- ✅ Completed unverified data migration
- ❌ Missing most functionality

### Business Requirements

#### 1. Core Functional Requirements

**1.1 Character Creation Flow**
- Basic Information (name, tier 1-10, character type)
- 7 Archetype selections (Combat, Defensive, Movement, Expertise, Social, Supernatural, Wealth)
- Attribute allocation (Combat: tier×2 points, Utility: tier points)
- Main Pool purchases (250-350 points based on tier)
- Special Attacks creation
- Utility purchases
- Base Attacks configuration (NEW)
- Summary and export

**1.2 Point Economy Rules (CRITICAL CORRECTIONS)**
- Main Pool: 250 points + (tier × 10)
- Flaws: COST 30 points, give +tier stat bonus
- Traits: COST 30 points, give conditional +tier bonuses
- Boons: Variable costs as per rulebook
- Advisory validation only - warn but never prevent

**1.3 Data Architecture**
- Single unified-game-data.json containing ALL game content
- Exact rulebook text preservation
- Display metadata included in JSON
- No game content in JavaScript files

**1.4 New Features**
- Character management system (multiple characters)
- Import/Export functionality
- Base Attacks tab
- Roll20 JSON export format
- Session tracking for wealth expenditures

### Technical Requirements

#### 2. Architecture Specifications

**2.1 Core Systems**
```javascript
// Unified data structure example
{
  "schemaVersion": "3.0",
  "gameData": {
    "flaws": [{
      "id": "slow",
      "name": "Slow",
      "cost": 30,
      "description": "Your reflexes are slow...[exact rulebook text]",
      "statBonus": {
        "type": "choice",
        "options": ["power", "endurance", "focus"],
        "value": "tier"
      },
      "restrictions": ["movement_archetype"],
      "ui": {
        "component": "card",
        "size": "medium",
        "warningText": "Incompatible with movement archetype"
      }
    }],
    // ... all other game content
  }
}
```

**2.2 Component Architecture**
- UniversalCard: Renders any game entity
- UniversalForm: Dynamic form generation
- UniversalList: Filterable/sortable lists
- NotificationSystem: Advisory warnings
- CharacterManager: Multi-character support

**2.3 State Management**
- Single source of truth in StateManager
- Event-driven updates via EventBus
- Automatic persistence to localStorage
- Undo/redo capability

### Implementation Plan

#### Phase 1: Foundation Correction (Week 1)
**Priority: Fix fundamental rule errors**

1. **Day 1-2: Data Schema Design**
   - Create comprehensive unified-game-data.json schema
   - Include all entity types with proper cost structures
   - Add display metadata for UI rendering

2. **Day 3-4: Core System Updates**
   - Fix PoolCalculator with correct flaw/trait economics
   - Implement RequirementSystem for prerequisites
   - Complete EffectSystem for stat modifications
   - Correct Errors with Archetypes Tab

3. **Day 5-7: Data Migration**
   - Migrate all 15+ JSON files to unified format
   - Preserve exact rulebook text
   - Validate data integrity

#### Phase 2: Universal Components (Week 2)
**Priority: Build reusable UI system**

1. **Day 1-3: Component Development**
   - Complete UniversalCard with all variants
   - Implement UniversalForm with validation
   - Build UniversalList with filtering

2. **Day 4-5: Tab Reconstruction**
   - Rebuild existing tabs using universal components
   - Implement Base Attacks tab (new)
   - Ensure data-driven rendering

3. **Day 6-7: Integration Testing**
   - Test all character creation flows
   - Verify point calculations
   - Validate UI responsiveness

#### Phase 3: Advanced Features (Week 3)
**Priority: Character management and export**

1. **Day 1-2: Character Manager**
   - Multi-character support
   - Character folders/organization
   - Search and filtering

2. **Day 3-4: Import/Export System**
   - JSON export with schema version
   - Import with validation
   - Roll20 format transformation

3. **Day 5-7: Polish and Testing**
   - Advisory validation throughout
   - Performance optimization
   - Cross-browser testing

### Success Metrics

1. **Code Reduction**: Achieve 50%+ reduction in codebase size
2. **Data Consolidation**: Single unified JSON file under 500KB
3. **Rules Accuracy**: 100% compliance with rulebook.md
4. **Performance**: Page load < 2 seconds, interactions < 100ms
5. **Compatibility**: Works on Chrome, Firefox, Safari, Edge

### Risk Mitigation

**Risk 1: Data Migration Errors**
- Mitigation: Automated validation scripts comparing old vs new data

**Risk 2: Rule Implementation Mistakes**
- Mitigation: Side-by-side testing with old system

**Risk 3: Performance Issues**
- Mitigation: Lazy loading, virtual scrolling for large lists

### Deliverables

1. **Unified Game Data JSON** with all content
2. **Universal Component Library** (Card, Form, List)
3. **Complete Character Builder** with 8 tabs
4. **Character Manager** with import/export
5. **Documentation** for maintenance and updates

### Next Steps

1. Review and approve this requirements document
2. Begin Phase 1 with data schema design
3. Set up development environment with hot reload
4. Create test character scenarios for validation

Would you like me to proceed with any specific phase or would you like to discuss any modifications to this plan?