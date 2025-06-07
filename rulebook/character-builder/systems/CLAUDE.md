# Systems Directory - CLAUDE.md

This directory contains business logic classes that manage specific domains of character creation and validation.

## Purpose
Domain-specific business logic separated from UI concerns. Each system handles one aspect of character building with methods for validation, calculation, and data manipulation.

## Architecture Pattern
- **Single Responsibility**: Each system manages one domain (archetypes, attacks, etc.)
- **Static Methods**: Pure functions that don't maintain state
- **Data Validation**: Comprehensive validation with detailed error messages
- **Integration Layer**: Bridge between UI components and core data/calculations

## Files Overview

### Character Foundation Systems
- **ArchetypeSystem.js**: Manages 7 archetype categories and their interdependencies
- **AttributeSystem.js**: Handles attribute allocation and tier-based limits
- **WealthSystem.js**: Manages character resources and economic calculations

### Purchase and Upgrade Systems
- **TraitFlawSystem.js**: Complex trait purchases with tier conditions and flaw economics
- **SimpleBoonsSystem.js**: Straightforward beneficial purchases
- **UniqueAbilitySystem.js**: Major character-defining abilities
- **ActionSystem.js**: Action upgrade purchases and effects

### Special Attack System
- **SpecialAttackSystem.js**: Complete special attack creation and management
- **AttackTypeSystem.js**: Attack and effect type definitions and validation
- **UtilitySystem.js**: 5-category utility purchases (expertise, features, senses, movement, descriptors)

## System Responsibilities

### Validation Patterns
All systems follow this validation pattern:
```javascript
static validateSomeAction(character, ...params) {
    const errors = [];
    const warnings = [];
    
    // Validation logic here
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
```

### Data Manipulation
Systems provide methods to:
- Add/remove items from character
- Calculate costs and point expenditures
- Validate prerequisites and restrictions
- Handle cascading updates (removing prerequisites removes dependents)

### Integration Points
- **UI Components** call system methods for user actions
- **Calculators** use system data for computations
- **GameDataManager** provides data consumed by systems
- **VitalityCharacter** model is modified through system methods

## Key System Details

### ArchetypeSystem.js
- **Purpose**: Manages the 7 required archetype selections
- **Complexity**: High - archetypes affect all other systems
- **Key Methods**: `validateArchetypeSelection()`, `getFreeAttackTypes()`, `getSpecialAttackPointMethod()`
- **Dependencies**: All other systems depend on archetype selections

### SpecialAttackSystem.js
- **Purpose**: Complete special attack creation workflow
- **Complexity**: Highest - most complex system with limits, upgrades, and validation
- **Key Methods**: `createSpecialAttack()`, `addLimitToAttack()`, `addUpgradeToAttack()`
- **Sub-systems**: Works closely with AttackTypeSystem for type definitions

### TraitFlawSystem.js
- **Purpose**: Main pool trait purchases with complex tier conditions
- **Complexity**: High - three-tier system with conditional requirements
- **Key Methods**: `validateTraitPurchase()`, `calculateFlawBenefits()`
- **Special Logic**: Flaw economics (flaws cost points but provide attribute bonuses)

### UtilitySystem.js
- **Purpose**: 5-category utility purchases (final character building step)
- **Complexity**: Medium - multiple categories but simpler individual logic
- **Key Methods**: `purchaseUtilityItem()`, `validateUtilityPurchase()`
- **Categories**: Expertise, Features, Senses, Movement, Descriptors

## Usage Guidelines

### When Working on Systems:

#### Adding New Methods:
1. **Follow validation patterns** - always return structured validation objects
2. **Handle edge cases** - validate all inputs and character state
3. **Provide detailed errors** - help users understand what went wrong
4. **Log complex operations** - aid debugging for intricate business logic

#### Modifying Existing Logic:
1. **Test all dependent systems** - changes ripple through other domains
2. **Preserve backward compatibility** - existing characters must still load
3. **Update related calculators** - ensure point calculations remain accurate
4. **Verify UI integration** - system changes may require UI updates

#### Error Handling:
1. **Validate character state** - systems assume valid character objects
2. **Check data dependencies** - ensure required data files are loaded
3. **Handle missing references** - gracefully handle deleted or renamed items
4. **Provide user-friendly messages** - avoid technical error details in UI

### Common Patterns

#### Purchase Validation:
```javascript
// Check affordability
const cost = this.calculateItemCost(item, character);
const available = this.getAvailablePoints(character);
if (cost > available) {
    errors.push(`Insufficient points (need ${cost}, have ${available})`);
}

// Check prerequisites
const prereqCheck = this.validatePrerequisites(item, character);
errors.push(...prereqCheck.errors);
```

#### Cascading Updates:
```javascript
// When removing an item, also remove dependents
static removeItemFromCharacter(character, itemId) {
    const dependents = this.findDependentItems(character, itemId);
    dependents.forEach(dependent => {
        this.removeItemFromCharacter(character, dependent.id);
    });
    // Remove the main item last
    this.removeMainItem(character, itemId);
}
```

#### Data Access:
```javascript
// Always get data through GameDataManager
static getAvailableItems() {
    const items = gameDataManager.getItemsForCategory(this.CATEGORY);
    return items.map(item => this.enrichItemData(item));
}
```

### Integration Guidelines

#### With UI Components:
- UI calls system methods for all character modifications
- Systems never directly manipulate DOM or trigger UI updates
- Validation results guide UI feedback (error messages, disabled states)
- Systems provide data formatting methods for display

#### With Calculators:
- Calculators consume system data for point calculations
- Systems provide methods to get current purchases and costs
- Complex calculations (like tier scaling) may be delegated to systems
- Systems handle business rules, calculators handle math

#### With Core Systems:
- All systems depend on GameDataManager for data
- Systems modify VitalityCharacter through documented interfaces
- GameConstants provide configuration values used by systems
- TierSystem provides scaling calculations used across multiple systems

## Testing Guidelines

### System Testing Priorities:
1. **Validation Logic**: Test all error conditions and edge cases
2. **Character State**: Verify systems don't corrupt character data
3. **Integration**: Test interactions between related systems
4. **Performance**: Profile complex operations like special attack creation

### Mock Dependencies:
- Mock GameDataManager for isolated testing
- Use test character objects with known states
- Mock UI components when testing system integration
- Simulate edge cases like missing data or corrupted state

## Performance Considerations

### Optimization Strategies:
- Cache expensive data transformations
- Avoid redundant validation calls during bulk operations
- Use lazy loading for complex system initialization
- Profile validation performance for large item catalogs

### Memory Management:
- Systems are stateless - no memory leaks from retained state
- Large data sets from GameDataManager should be accessed on-demand
- Avoid creating unnecessary object copies during validation
- Clean up temporary objects in complex calculations