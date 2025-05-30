# Character Building Guide

## Overview

This guide explains how to build characters for the Vitality System using the JSON format compatible with Roll20. Characters are built according to the rules in `rulebook.md` and structured as JSON files for import.

## Building Process

### 1. Character Concept & Tier
- Determine character concept and appropriate **Tier** (1-10)
- Higher tiers have more attribute points and special attack points
- Tier determines base attributes and HP calculation

### 2. Attribute Distribution
- Distribute points across **8 core attributes**: Awareness, Communication, Intelligence, Focus, Mobility, Endurance, Power
- Calculate **derived stats** from core attributes:
  - **Avoidance** = 10 + Focus + Mobility + modifiers
  - **Durability** = 10 + Power + Endurance + modifiers  
  - **Resolve** = 10 + Intelligence + Communication + modifiers
  - **Stability** = 10 + Power + Intelligence + modifiers
  - **Vitality** = 10 + Endurance + Awareness + modifiers

### 3. Archetypes Selection
Choose **5 archetypes** from different categories:
- **Movement**: Swift, Teleportation, etc.
- **Attack**: Single Target, AOE Specialist, etc.
- **Effect**: Damage Specialist, Hybrid Specialist, etc.
- **Special Attack**: Straightforward, Paragon, etc.
- **Defensive**: Resilient, Stalwart, Juggernaut, etc.

### 4. Special Attacks Design
- Design attacks using **Special Attack Points** (varies by tier)
- Choose **Attack Types**: Melee, Ranged, Direct, AOE
- Add **Modifiers**: Brutal, Critical Effect, Reliable Effect, etc.
- Balance **damage vs conditions vs utility**

### 5. JSON Structure Requirements

#### Essential Fields
```json
{
  "metadata": {
    "characterId": "unique-id",
    "name": "Character Name",
    "attributeCount": 95
  },
  "attributes": {
    "char_tier": "8",
    "char_hp": "100/100",
    "focusTotal": 8,
    "powerTotal": 8,
    // ... all other attributes
  },
  "repeating_sections": {
    "attacks": { /* attack definitions */ },
    "traits": { /* archetype traits */ },
    "focusexpertises": { /* expertises */ }
  }
}
```

#### Attack Structure
```json
"-UniqueAttackID": {
  "AttackName": "Attack Name",
  "leftsub": "Attack Type",
  "AttackType": "1-4", // 1=Melee, 2=Ranged, 3=Direct, 4=AOE
  "Brutal": "0/1",
  "ReliableEffect": "0/1",
  "EffectType": "6/8", // 6=Damage+Condition, 8=Advanced
  "AccuracyStringModifiers": "descriptive text",
  "DamageStringModifiers": "descriptive text"
}
```

## Best Practices

### Unique IDs
- All IDs must be **globally unique** across the entire system
- Use pattern: `-OZ[Letter][Number][Letter][Number]...` for new characters
- Check existing extracted characters to avoid conflicts

### Attribute Calculations
- **Always verify** derived stats match core attributes + modifiers
- Include archetype bonuses in final calculations
- HP = (Tier × 10) + Endurance + archetype bonuses

### Attack Balance
- **Tier 8**: ~80 points per attack (Paragon archetype)
- **Tier 10**: ~100 points per attack (Paragon archetype)
- Balance **accuracy, damage, and conditions**

### Documentation
- Use **descriptive attack names** and subtitles
- Include **tactical notes** for complex abilities
- Reference **source material** when adapting existing characters

## Examples

See the extracted character files in the input directory for working examples:
- `Element_Prime.json` - Tier 8 elemental master
- `Golden_Sentinel.json` - Tier 10 idealized hero  
- `Override_Sentinel.json` - Tier 8 balanced multi-element

## Common Issues

1. **ID Conflicts**: Always generate new unique IDs
2. **Attribute Mismatches**: Double-check derived stat calculations
3. **Missing Fields**: Ensure all required JSON fields are present
4. **Attack Point Overflow**: Verify special attacks don't exceed point budgets
5. **Archetype Stacking**: Some archetype bonuses don't stack properly

## Reference Files

- `rulebook.md` - Complete Vitality System rules
- `input/` directory - Extracted character examples
- Character build specifications in session documents