# Phase 41: Archetype Discount System Fixes for Special Attack and Effect Types

**Date:** 2025-01-18
**Status:** ✅ Completed
**Objective:** Fix archetype discount logic for special attack types and remove restrictive effect type filtering to enable proper cost calculation and purchase flexibility.

---

## 1. Problem Analysis

The special attack system had two critical issues with archetype integration:

1. **Missing Archetype Discounts**: Special attack types with defined archetype discounts (like `area_direct` costing 60p normally but 30p for direct/AOE specialists) were not being applied in the UI cost display.

2. **Restrictive Effect Type Filtering**: Effect type archetypes were incorrectly **blocking** access to other effect types instead of providing free/discounted access. For example, damage specialists could only select "damage" effect type and couldn't purchase "hybrid" (30p) or "condition" effect types.

### Root Cause

**Attack Type Discounts**: The `AttackTypeSystem.getAttackTypeDefinition()` method supported character-aware discount calculation, but the UI was calling `getAttackTypeDefinitions()` without passing the character parameter, so discount logic was never executed.

**Effect Type Restrictions**: The `AttackBasicsForm.filterEffectTypesByArchetype()` method was using restrictive filtering that limited available options instead of implementing a free/discount system like attack types use.

---

## 2. Solution Implemented

Implemented a comprehensive fix that aligns effect type archetype behavior with attack type archetype behavior, and ensured archetype discounts are properly applied throughout the UI.

### Key Changes:

*   **AttackTypeSystem.js:** Added character parameter support to `getAttackTypeDefinition()` for archetype discount calculation and implemented `getFreeEffectTypesFromArchetype()` method.
*   **AttackBasicsForm.js:** Removed restrictive effect type filtering and integrated free effect type support with proper cost display.
*   **Cost Calculation:** Updated all cost calculation methods to account for free effect types from archetypes.

```javascript
// BEFORE: Attack type definitions called without character context
${this.renderIntegratedSelector(attack, character, 'Attack Types', 'attackTypes', AttackTypeSystem.getAttackTypeDefinitions(), false)}

// AFTER: Character passed for archetype discount calculation
${this.renderIntegratedSelector(attack, character, 'Attack Types', 'attackTypes', AttackTypeSystem.getAttackTypeDefinitions(character), false)}
```

```javascript
// BEFORE: Restrictive effect type filtering
filterEffectTypesByArchetype(effectTypes, archetypeId) {
    switch (archetypeId) {
        case 'damageSpecialist':
            // Only allow damage type
            return effectTypes.filter(type => type.id === 'damage');
        // ... other restrictive cases
    }
}

// AFTER: Free effect type system (non-restrictive)
static getFreeEffectTypesFromArchetype(character) {
    switch (character.archetypes.effectType) {
        case 'damageSpecialist':
            return ['damage']; // Free, but can buy others
        case 'hybridSpecialist':
            return ['hybrid']; // Free hybrid
        case 'crowdControl':
            return ['condition']; // Free condition
        default:
            return [];
    }
}
```

```javascript
// BEFORE: Cost calculation ignored effect type discounts
attack.effectTypes.forEach(typeId => {
    const effectTypeDef = this.getEffectTypeDefinition(typeId);
    if (effectTypeDef) totalCost += effectTypeDef.cost;
});

// AFTER: Accounts for free effect types from archetype
const freeEffectTypes = this.getFreeEffectTypesFromArchetype(character);
attack.effectTypes.forEach(typeId => {
    if (!freeEffectTypes.includes(typeId)) {
        const effectTypeDef = this.getEffectTypeDefinition(typeId);
        if (effectTypeDef) totalCost += effectTypeDef.cost;
    }
});
```

---

## 3. Results and Impact

### Attack Type Discounts Now Working:
- **Direct Specialists**: `area_direct` attacks now cost 30p (was 60p)
- **AOE Specialists**: `area_direct` attacks now cost 30p (was 60p)
- **Regular Characters**: Still pay full 60p cost

### Effect Type System Now Flexible:
- **Damage Specialists**: Get "damage" effect type FREE, can buy "hybrid" for 30p, can buy "condition" for 0p
- **Hybrid Specialists**: Get "hybrid" effect type FREE (normally 30p), can buy others
- **Crowd Control**: Get "condition" effect type FREE, can buy others with normal costs

### UI Improvements:
- Cost display accurately shows discounted prices for archetype specialists
- Dropdown options show "Free" for archetype-provided types
- No more artificial restrictions on effect type selection

---

## 4. Files Modified

- `frontend/character-builder/systems/AttackTypeSystem.js` - Core archetype discount logic and free effect type system
- `frontend/character-builder/features/special-attacks/components/AttackBasicsForm.js` - UI integration for proper cost display and effect type selection

---

## 5. Testing Notes

**Successful Tests:**
- Attack type archetype discounts applied correctly in UI
- Effect type selection no longer restricted by archetype
- Cost calculations account for free types from archetypes
- Both attack and effect type "Free" display working

**Outstanding Issue:**
- Conditions dropdown functionality still needs fixing (separate issue)

---

## 6. Future Considerations

This fix establishes a consistent pattern for archetype bonuses across the special attack system. The same approach should be applied to any future archetype-related features:

1. **Free Access**: Archetypes provide free access to their specialty
2. **No Restrictions**: Archetypes don't block purchasing other options
3. **Cost Integration**: All cost calculations must account for archetype bonuses
4. **UI Consistency**: Cost display should show "Free" for archetype-provided items

The conditions dropdown issue is a separate UI problem that doesn't affect the core archetype discount logic implemented here.