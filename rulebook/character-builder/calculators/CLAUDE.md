# Calculators Directory - CLAUDE.md

This directory contains calculation engines for the Vitality System character builder.

## Purpose
Pure calculation logic separated from UI concerns. These calculators process character data and return computed values without side effects.

## Architecture Pattern
- **Pure Functions**: All calculators are stateless and side-effect free
- **Single Responsibility**: Each calculator handles one domain of calculations
- **Consistent Interface**: All return structured objects with breakdown details

## Files

### CombatCalculator.js
- **Purpose**: Combat statistics and derived values
- **Inputs**: Character attributes, archetypes, purchased items
- **Outputs**: Final combat stats with calculation breakdowns
- **Key Methods**: `calculateCombatStats()`, `calculateAttackBonuses()`, `calculateDefenseValues()`

### LimitCalculator.js
- **Purpose**: Special attack limit point calculations with diminishing returns
- **Inputs**: Limit selections, character tier, archetype modifiers
- **Outputs**: Final upgrade points from limits with scaling breakdowns
- **Key Methods**: `calculateLimitScaling()`, `applyDiminishingReturns()`

### PointPoolCalculator.js
- **Purpose**: Available and spent point calculations across all character systems
- **Inputs**: Character tier, archetypes, purchases, allocations
- **Outputs**: Point totals for attributes, main pool, utility, special attacks
- **Key Methods**: `calculateAllPools()`, `calculateRemainingPoints()`

### StatCalculator.js
- **Purpose**: Final character statistics after all modifiers
- **Inputs**: Base attributes, archetype bonuses, item effects, conditions
- **Outputs**: Final stats with step-by-step calculation breakdowns
- **Key Methods**: `calculateAllStats()`, `calculateStatModifiers()`

## Usage Guidelines

### When Working on Calculators:
1. **Never add UI dependencies** - calculators should not import React, DOM manipulation, or UI components
2. **Always return breakdowns** - provide step-by-step calculation details for debugging
3. **Handle edge cases gracefully** - validate inputs and provide meaningful defaults
4. **Keep functions pure** - no side effects, same input always produces same output
5. **Document complex formulas** - explain tier scaling, diminishing returns, etc.

### Common Patterns:
```javascript
// Standard calculator return pattern
return {
    final: finalValue,
    breakdown: {
        base: baseValue,
        modifiers: [
            { source: 'archetype', value: bonus, description: 'Archetype bonus' },
            { source: 'items', value: itemBonus, description: 'Equipment bonus' }
        ],
        total: finalValue
    }
};
```

### Integration Points:
- Called by UI components for display calculations
- Used by UpdateManager for character state recalculation
- Referenced by validation systems for constraint checking

## Debugging Guidelines
- All calculators should log intermediate steps when `debug` flag is enabled
- Use consistent error messages for invalid inputs
- Return error objects instead of throwing exceptions when possible

## Performance Considerations
- Calculators may be called frequently during UI updates
- Cache expensive calculations when input dependencies haven't changed
- Profile calculation performance for complex tier scaling operations