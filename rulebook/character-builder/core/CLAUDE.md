# Core Directory - CLAUDE.md

This directory contains the fundamental system classes that form the backbone of the character builder.

## Purpose
Core game logic, constants, data management, and the primary character model. These are the most critical files that other systems depend on.

## Architecture Pattern
- **Singleton Services**: GameDataManager is a singleton for centralized data access
- **Data Models**: VitalityCharacter is the primary data model with methods
- **Constants**: GameConstants provides immutable configuration values
- **System Logic**: Core game mechanics like dice rolling and tier scaling

## Files

### GameDataManager.js
- **Purpose**: Centralized loading and access to all JSON data files
- **Responsibilities**: 
  - Async loading of 15+ JSON data files at startup
  - Caching loaded data for performance
  - Providing typed access methods for each data category
- **Key Methods**: `init()`, `getArchetypes()`, `getBoons()`, `getLimits()`, etc.
- **Critical**: Must be initialized before any other systems

### VitalityCharacter.js
- **Purpose**: Primary character data model with business logic
- **Responsibilities**:
  - Character state management and validation
  - Build order enforcement (archetypes → attributes → main pool → special attacks → utility)
  - Automatic save/load with localStorage integration
  - Touch/timestamp tracking for library management
- **Key Methods**: `updateBuildState()`, `touch()`, `validate()`
- **Pattern**: Combines data model with domain logic methods

### GameConstants.js
- **Purpose**: Immutable game configuration and lookup tables
- **Contents**:
  - Point costs for all purchasable items
  - Tier scaling formulas and breakpoints
  - Banned upgrade combinations
  - Default values and limits
- **Usage**: Import as needed, never modify at runtime

### TierSystem.js
- **Purpose**: Tier-based scaling calculations and limits
- **Responsibilities**:
  - Character tier progression rules
  - Point pool scaling by tier
  - Limit point diminishing returns calculations
  - Archetype-specific tier modifiers
- **Key Methods**: `calculateTierLimits()`, `calculateLimitScaling()`

### DiceSystem.js
- **Purpose**: Dice rolling mechanics and probability calculations
- **Responsibilities**:
  - Standard dice notation parsing (2d6+3)
  - Statistical analysis of dice combinations
  - Expected value calculations for game balance
- **Key Methods**: `roll()`, `calculateExpectedValue()`, `parseDiceNotation()`

## Critical Dependencies

### Initialization Order:
1. **GameConstants** - Available immediately (static imports)
2. **GameDataManager** - Must be initialized with `await init()` before app start
3. **VitalityCharacter** - Depends on GameConstants for defaults
4. **TierSystem** - Depends on GameConstants for scaling formulas
5. **DiceSystem** - Independent, can be used anytime

### External Dependencies:
- GameDataManager loads from `../data/` directory
- VitalityCharacter uses localStorage for persistence
- All core files may be imported by systems/ and ui/ directories

## Usage Guidelines

### When Working on Core Files:

#### GameDataManager:
- **Never modify during runtime** - data should be immutable after loading
- **Always check initialization** - verify `isInitialized` before data access
- **Handle loading failures gracefully** - provide fallbacks for missing data files
- **Add new data categories carefully** - update both loading and access methods

#### VitalityCharacter:
- **Maintain build state integrity** - use `updateBuildState()` after major changes
- **Preserve data model purity** - avoid UI-specific properties
- **Handle version migration** - support loading older character formats
- **Never bypass validation** - use domain methods instead of direct property access

#### GameConstants:
- **Keep values immutable** - use Object.freeze() for nested objects
- **Document all formulas** - explain the reasoning behind magic numbers
- **Group related constants** - use nested objects for logical organization
- **Version constants carefully** - changes affect existing characters

## Error Handling
- Core systems should fail gracefully with meaningful error messages
- Log initialization failures at startup for debugging
- Provide fallback values for missing or corrupted data
- Never throw unhandled exceptions that could crash the entire app

## Performance Considerations
- GameDataManager caches all data after initial load
- VitalityCharacter methods should be efficient for frequent UI updates
- Use lazy loading for expensive calculations in TierSystem
- Profile GameDataManager initialization time for large data sets

## Testing Guidelines
- Core files should have the highest test coverage
- Test all edge cases for tier scaling and character validation
- Mock GameDataManager for isolated unit tests
- Verify character serialization/deserialization round-trips correctly