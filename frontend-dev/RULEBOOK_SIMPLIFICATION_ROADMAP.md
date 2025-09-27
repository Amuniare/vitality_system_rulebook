# Vitality System Simplification Roadmap

## Executive Summary

The Vitality System has undergone **massive simplification** from the complex archive version to the streamlined current rulebook. The web application currently implements the complex archive system and needs fundamental restructuring to match the simplified rules.

## Critical Architectural Changes Required

### ❌ **SYSTEMS TO REMOVE ENTIRELY**

#### 1. Complex Archetype Categories → Simple 4-Category System
**ARCHIVE (Complex - 7 Categories):**
- Movement, Attack Type, Effect Type, Unique Ability, Defensive, Special Attack, Utility

**CURRENT (Simple - 4 Categories):**
- Movement, Attack, Defensive, Utility

**Impact:** Entire archetype system needs restructuring, UI redesign, and data model changes.

#### 2. Special Attack System → Basic Attack Only
**ARCHIVE:** Complex special attack creation with limits, upgrades, points, multiple attacks
**CURRENT:** Single special attack system for specific archetypes only
**Impact:** Remove entire special attack builder, limits system, upgrade system.

#### 3. Main Pool Points System → Simple Boon Selection
**ARCHIVE:** Complex point-based purchasing (Traits 30p, Flaws 30p, Actions 30p, Boons variable)
**CURRENT:** Simple boon selection equal to character level (1-5 boons)
**Impact:** Remove point pool calculations, trait/flaw purchasing, action upgrades.

#### 4. Complex Tier System → Simplified Level System
**ARCHIVE:** Tier 0-10 with complex calculations
**CURRENT:** Level 1-5 with simple +3/+4/+5 tier bonuses and boon counts
**Impact:** Recalculate all formulas, update tier displays.

### 🔄 **SYSTEMS TO COMPLETELY REPLACE**

#### 1. Formula Simplification
**ARCHIVE:**
- Damage: `3d6 + Tier + (Power × 1.5) - Target's Durability`
- Avoidance: `10 + Tier + Mobility`
- Durability: `Tier + (Endurance × 1.5)`

**CURRENT:**
- Damage: `3d6 + Tier + Power - Target's Durability`
- Avoidance: `5 + Tier + Mobility`
- Durability: `Tier + Endurance`

#### 2. Action System Overhaul
**ARCHIVE:** Primary + Quick + Free + Movement + Reaction
**CURRENT:** Primary + Free + Movement + Reaction (NO Quick Actions)
**Impact:** Remove Quick Action concept entirely, update action tabs.

#### 3. Attack Types Simplification
**ARCHIVE:** Melee, Ranged, Direct, Area, plus Hybrid variants
**CURRENT:** Melee, Ranged, Area, Direct (condition only), Direct Area (condition only), Direct Damage, Direct Area Damage
**Impact:** Simplified attack type selection, updated mechanics.

### 🗑️ **MAJOR FEATURES TO DELETE**

1. **Entire Special Attack Tab** - No longer exists in new system
2. **Action Upgrade System** - Quick actions removed
3. **Point Pool Management** - Replaced with simple boon selection
4. **Complex Limits System** - No longer exists
5. **Upgrade Point Calculations** - No longer exists
6. **Trait/Flaw Purchasing** - Now boons only
7. **Complex Unique Abilities** - Simplified to basic traits

## Detailed Migration Plan

### Phase 1: Data Model Overhaul (Week 1-2) 🔴 CRITICAL
**Goal:** Replace complex data structures with simplified ones

#### 1.1 Archetype System Rebuild
- **Remove:** Attack Type, Effect Type, Unique Ability, Special Attack archetypes
- **Simplify:** Movement → simple choices, Defensive → 3 simple options
- **Add:** Attack archetype (4 options), Utility archetype (3 options)
- **Update:** All archetype JSON files and selection logic

#### 1.2 Character Data Model Simplification
- **Remove:** `specialAttacks[]`, `mainPoolPurchases.traits[]`, `mainPoolPurchases.flaws[]`, `primaryActionUpgrades[]`
- **Replace:** With `boons[]` array (1-5 boons based on level)
- **Simplify:** Point pool system to simple boon count
- **Update:** VitalityCharacter.js structure

#### 1.3 Calculator System Replacement
- **Replace:** All formula calculations in calculators
- **Remove:** Special attack point calculations
- **Simplify:** Stat calculations to match new formulas

### Phase 2: UI Reconstruction (Week 3-4) 🔴 CRITICAL
**Goal:** Rebuild user interface for simplified system

#### 2.1 Tab Structure Overhaul
- **Remove:** Special Attacks tab entirely
- **Simplify:** Main Pool tab → Boons selection tab
- **Merge:** Identity and Basic Info tabs
- **Update:** Tab navigation and validation

#### 2.2 Archetype Selection Redesign
- **Remove:** 7-category selection interface
- **Replace:** With 4-category simple selection
- **Update:** Archetype descriptions and effects
- **Test:** New archetype selection flow

#### 2.3 Boon Selection Interface
- **Replace:** Complex point-based purchasing
- **Create:** Simple list-based boon selection
- **Implement:** Level-based boon count (1-5)
- **Remove:** Point pool displays and calculations

### Phase 3: System Integration (Week 5) 🟡 MEDIUM
**Goal:** Ensure all systems work with new simplified model

#### 3.1 Validation System Update
- **Remove:** Point pool validation
- **Simplify:** Build order validation
- **Update:** Error messages for new system
- **Test:** All validation scenarios

#### 3.2 Export System Adaptation
- **Update:** Roll20 export format
- **Remove:** Special attack export data
- **Simplify:** Character data export
- **Test:** Export compatibility

### Phase 4: Testing & Cleanup (Week 6) 🟢 LOW
**Goal:** Remove legacy code and validate new system

#### 4.1 Legacy Code Removal
- **Delete:** Unused calculator files
- **Remove:** Special attack components
- **Clean:** Point pool management code
- **Update:** Documentation

#### 4.2 Comprehensive Testing
- **Test:** All simplified workflows
- **Validate:** Character creation end-to-end
- **Verify:** Export functionality
- **Document:** Breaking changes

## Breaking Changes Impact

### 🚨 **CRITICAL USER IMPACT**
- **All existing characters** become incompatible
- **Character creation workflow** completely changes
- **Export format** changes significantly
- **Roll20 automation** needs updates

### 📊 **Technical Debt Elimination**
- **Remove ~60% of codebase** (special attacks, complex point pools)
- **Simplify architecture** dramatically
- **Reduce complexity** by orders of magnitude
- **Improve maintainability** significantly

## Migration Strategy

### Option A: Clean Slate (RECOMMENDED)
1. **Archive current system** as "legacy branch"
2. **Build new simplified system** from scratch
3. **Provide character conversion tool** for existing users
4. **Update Roll20 automation** for new format

### Option B: Gradual Migration
1. **Implement simplified system alongside complex one**
2. **Provide migration path** for existing characters
3. **Phase out complex system** over time
4. **Maintain both systems** temporarily

## Success Criteria

### Functional Requirements
- ✅ 4-archetype selection system works perfectly
- ✅ Simple boon selection replaces complex point system
- ✅ New formulas implemented correctly
- ✅ Character export works with simplified data

### User Experience Requirements
- ✅ Character creation is intuitive and fast
- ✅ No complex point calculations confuse users
- ✅ Simple progression system (levels 1-5)
- ✅ Clear archetype choices and effects

### Technical Requirements
- ✅ Codebase reduced by ~60%
- ✅ All legacy complexity removed
- ✅ New architecture is maintainable
- ✅ Performance improved significantly

## Timeline Summary

**Total Estimated Time: 6 weeks**
- **Phase 1** (Data Model): 2 weeks - Complete system restructure
- **Phase 2** (UI Rebuild): 2 weeks - New interface construction
- **Phase 3** (Integration): 1 week - System coordination
- **Phase 4** (Cleanup): 1 week - Legacy removal and testing

## Next Steps

1. **Decision required:** Clean slate vs gradual migration approach
2. **Archive current system** before starting changes
3. **Communication plan** for users about breaking changes
4. **Roll20 automation updates** coordination
5. **Character conversion tool** development if needed

**This is not an update - this is a complete system replacement.** The complexity reduction is so significant that treating this as incremental changes would be a mistake. The new system is fundamentally different and much simpler.