# Vitality System Web App Update Roadmap

## Executive Summary

The Vitality System rulebook has been updated and the web application needs comprehensive updates to match the latest rules. This roadmap prioritizes updates based on impact, complexity, and user experience to ensure a smooth transition from the current implementation to the updated rulebook.

## Current State Analysis

### ✅ Already Implemented Features
- **Core Architecture**: Sophisticated component-based system with proper separation of concerns
- **8-Tab Character Builder**: Complete progression system (Basic Info → Identity → Archetypes → Attributes → Main Pool → Special Attacks → Utility → Summary)
- **7 Archetype Categories**: Movement, Attack Type, Effect Type, Unique Ability, Defensive, Special Attack, Utility
- **Point Pool System**: Complex multi-pool calculation system with real-time validation
- **Special Attack System**: Comprehensive attack creation with limits, upgrades, and conditions
- **Data-Driven Design**: All game content loaded from JSON files
- **Export System**: JSON export compatible with Roll20 automation
- **Character Library**: Local storage with save/load functionality

### ⚠️ Partially Implemented Features
- **Action System**: Basic framework exists but needs expansion
- **Unique Abilities**: Some complex abilities implemented but incomplete
- **Traits System**: Framework exists but missing newer traits
- **Limits System**: Core system present but needs modernization

### ❌ Missing Features (Based on Rulebook Updates)
- **Updated Archetype Effects**: Some archetype descriptions and mechanics need updating
- **Modern Action Economy**: Enhanced action system with new primary actions
- **Advanced Special Attack Variants**: New archetype-specific special attack systems
- **Updated Point Calculations**: Some archetype point multipliers may need adjustment
- **New Conditions**: Additional basic and advanced conditions
- **Enhanced Upgrade System**: New upgrade categories and effects

## Priority Roadmap

### Phase 1: Critical Foundation Updates (Week 1-2)
**Goal**: Ensure core systems match updated rulebook mechanics

#### 1.1 Archetype System Modernization 🔴 HIGH PRIORITY
- **Update archetype descriptions** to match latest rulebook text
- **Verify point calculation formulas** for Special Attack archetypes
- **Update Unique Ability archetype effects** (Versatile Master, Extraordinary, Cut Above)
- **Test archetype interactions** with special attack point systems

#### 1.2 Action System Enhancement 🔴 HIGH PRIORITY
- **Expand actions.json** with any missing primary actions
- **Verify action costs and descriptions** match rulebook
- **Update Versatile Master integration** with Quick Action system
- **Test action upgrade purchasing flow**

#### 1.3 Point Pool Calculation Verification 🔴 HIGH PRIORITY
- **Audit PointPoolCalculator.js** against rulebook formulas
- **Update tier-based bonuses** for special attack archetypes
- **Verify attribute point allocation** rules
- **Test edge cases** with different archetype combinations

### Phase 2: Content Expansion (Week 3-4)
**Goal**: Add missing content and enhance existing systems

#### 2.1 Special Attack System Enhancements 🟡 MEDIUM PRIORITY
- **Update upgrades.json** with any new upgrade options
- **Verify upgrade costs and effects** match rulebook
- **Add missing upgrade categories** if any exist
- **Update banned combinations** list if changed

#### 2.2 Limits System Modernization 🟡 MEDIUM PRIORITY
- **Review limits.json** against latest rulebook
- **Update limit descriptions** and point values
- **Add any new limit variants** or modifiers
- **Verify limit point calculations** in LimitCalculator.js

#### 2.3 Conditions and Effects Update 🟡 MEDIUM PRIORITY
- **Review conditions_basic.json** and **conditions_advanced.json**
- **Add any new conditions** from rulebook updates
- **Update condition descriptions** for clarity
- **Verify condition mechanics** in attack system

### Phase 3: User Experience Improvements (Week 5-6)
**Goal**: Polish interface and improve validation

#### 3.1 Validation System Enhancement 🟢 LOW PRIORITY
- **Update validation messages** to reflect rule changes
- **Improve error messaging** for new restrictions
- **Add helpful tooltips** for complex mechanics
- **Test build order enforcement** with new rules

#### 3.2 Interface Polish 🟢 LOW PRIORITY
- **Update help text** throughout the application
- **Improve archetype selection** interface clarity
- **Enhance special attack creation** workflow
- **Add better progress indicators** for complex builds

#### 3.3 Export System Updates 🟢 LOW PRIORITY
- **Verify Roll20 export format** compatibility
- **Add any new export fields** needed for automation
- **Test export with complex character builds**
- **Document export format** changes

### Phase 4: Testing and Validation (Week 7)
**Goal**: Comprehensive testing and bug fixes

#### 4.1 System Integration Testing 🔴 HIGH PRIORITY
- **Test all archetype combinations** with point calculations
- **Verify special attack creation** with different archetypes
- **Test character save/load** with new data structures
- **Validate export functionality** with complex builds

#### 4.2 Edge Case Testing 🟡 MEDIUM PRIORITY
- **Test maximum tier characters** (Tier 8+)
- **Verify minimum viable builds** (early tiers)
- **Test archetype restriction enforcement**
- **Validate point pool overflow scenarios**

#### 4.3 User Acceptance Testing 🟢 LOW PRIORITY
- **Test with actual rulebook scenarios**
- **Verify character creation workflows**
- **Test export integration** with Roll20
- **Gather feedback** on usability improvements

## Implementation Strategy

### Technical Approach
1. **Data-First Updates**: Start with JSON file updates to ensure content accuracy
2. **Calculator Verification**: Audit all calculation systems against rulebook formulas
3. **Component Testing**: Test each major component independently
4. **Integration Testing**: Verify system interactions work correctly
5. **User Testing**: Validate complete character creation workflows

### Risk Mitigation
- **Backup Current State**: Create branch with current working version
- **Incremental Updates**: Update one system at a time
- **Regression Testing**: Ensure existing functionality still works
- **User Communication**: Document any breaking changes clearly

### Quality Assurance
- **Rulebook Cross-Reference**: Each update verified against official rules
- **Point Calculation Audits**: Mathematical verification of all formulas
- **Character Build Testing**: Test with various archetype combinations
- **Export Validation**: Ensure exported characters work with automation

## Success Metrics

### Functional Metrics
- ✅ All archetype point calculations match rulebook exactly
- ✅ Character export format compatible with existing automation
- ✅ No regression in existing character creation workflows
- ✅ All new rulebook content properly implemented

### User Experience Metrics
- ✅ Character creation time remains reasonable
- ✅ Validation messages are clear and helpful
- ✅ Complex builds can be created without confusion
- ✅ Export process works smoothly for Roll20 integration

## Timeline Summary

**Total Estimated Time**: 7 weeks
- **Phase 1** (Critical): 2 weeks
- **Phase 2** (Content): 2 weeks
- **Phase 3** (Polish): 2 weeks
- **Phase 4** (Testing): 1 week

## Next Steps

1. **Create detailed tickets** for each roadmap item
2. **Set up development branch** for rulebook updates
3. **Begin Phase 1** with archetype system modernization
4. **Establish testing protocols** for validation
5. **Plan user communication** for any breaking changes

This roadmap ensures the web application stays true to the updated Vitality System rulebook while maintaining the sophisticated architecture and user experience that already exists.