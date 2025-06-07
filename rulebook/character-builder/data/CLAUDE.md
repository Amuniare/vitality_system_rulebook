# Data Directory - CLAUDE.md

This directory contains all static game data in JSON format. These files define the rules, options, and content available in the character builder.

## Purpose
Externalized game data that can be modified without changing code. Provides the content that drives the character builder's options and calculations.

## Architecture Pattern
- **Data-Driven Design**: All game content comes from JSON files, not hardcoded values
- **Structured Hierarchies**: Complex nested objects for categorized content
- **Validation Ready**: Consistent formats that can be validated against schemas
- **Localization Ready**: Text content separated for potential translation

## Files Overview

### Character Foundation
- **archetypes.json**: 7 archetype categories defining character build paths
- **attributes.json**: Combat and utility attributes with descriptions
- **stat_options_generic.json**: Attribute allocation options and recommendations

### Main Pool Content
- **boons_simple.json**: Straightforward beneficial purchases
- **flaws.json**: Character limitations that provide bonus points
- **unique_abilities_complex.json**: Major character-defining abilities
- **trait_conditions.json**: Trait purchase requirements and restrictions

### Special Attacks
- **attack_types_definitions.json**: Melee, ranged, direct, area attack types
- **effect_types_definitions.json**: Damage, condition, hybrid effect types
- **limits.json**: Restrictions that generate upgrade points
- **upgrades.json**: Enhancements purchasable with upgrade points
- **conditions_basic.json**: Simple status effects
- **conditions_advanced.json**: Complex status effects requiring purchase

### Utility Systems
- **actions.json**: Action upgrade options and effects
- **expertise.json**: Skill specializations and bonuses
- **features.json**: General character features and abilities
- **senses.json**: Enhanced sensory capabilities
- **movement_features.json**: Locomotion and mobility options
- **descriptors.json**: Cosmetic character descriptors

## Data Structure Patterns

### Standard Item Format
```json
{
  "id": "unique_identifier",
  "name": "Display Name",
  "description": "Detailed description",
  "cost": 10,
  "category": "group_name",
  "requirements": ["prerequisite_ids"],
  "restrictions": ["limitation_descriptions"]
}
```

### Hierarchical Categories
```json
{
  "CategoryName": {
    "description": "Category explanation",
    "items": [...],
    "subcategories": {
      "SubcategoryName": {
        "items": [...]
      }
    }
  }
}
```

### Variable Costs
```json
{
  "cost": "20 per tier",
  "costKey": "VARIABLE_COST_MULTIPLIER"
}
```

## Usage Guidelines

### When Modifying Data Files:

#### JSON Structure Rules:
1. **Never break existing IDs** - other files may reference them
2. **Validate JSON syntax** - malformed JSON crashes the entire app
3. **Maintain consistent schemas** - use the same field names across similar items
4. **Document complex structures** - add comments in separate documentation

#### Content Guidelines:
1. **Keep descriptions concise** - UI space is limited
2. **Use consistent terminology** - match existing game vocabulary
3. **Balance cost structures** - verify new items fit the tier scaling system
4. **Test requirement chains** - ensure prerequisite items exist and are accessible

#### Performance Considerations:
1. **Minimize file size** - large JSON files slow initial loading
2. **Avoid deep nesting** - complex structures impact parsing performance
3. **Group related content** - reduce the number of separate files when possible
4. **Consider caching** - frequently accessed data should be easily cached

### Integration Points

#### GameDataManager Loading:
- All files are loaded asynchronously at app startup
- Missing files cause initialization failures
- Corrupted JSON prevents the entire app from loading
- File naming must match GameDataManager expectations

#### System Class Access:
- ArchetypeSystem reads archetypes.json
- SpecialAttackSystem reads limits.json and upgrades.json
- TraitFlawSystem reads flaws.json and trait_conditions.json
- Each system expects specific data formats

#### UI Component Display:
- Components loop through data to generate options
- Dropdowns, cards, and lists are populated from these files
- Search and filtering operations work on this data
- Validation systems check against these requirements

## Common Data Patterns

### Cost Structures:
- Fixed costs: `"cost": 30`
- Tier-based: `"cost": "10 per tier"`
- Variable: `"cost": "Variable"`
- Free: `"cost": 0`

### Requirement Types:
- Item prerequisites: `"requirements": ["item_id_1", "item_id_2"]`
- Attribute minimums: `"requirements": ["strength >= 3"]`
- Archetype restrictions: `"archetype_requirements": ["specialist", "normal"]`
- Tier limits: `"tier_minimum": 2, "tier_maximum": 6`

### Effect Descriptions:
- Mechanical effects: `"effect": "+2 to all combat attributes"`
- Narrative effects: `"description": "Character has enhanced night vision"`
- Restrictions: `"restrictions": ["Cannot be combined with Enhanced Hearing"]`

## Validation Guidelines

### Before Committing Changes:
1. **Validate JSON syntax** - use a JSON validator
2. **Check ID uniqueness** - no duplicate IDs within categories
3. **Verify references** - all requirement IDs must exist
4. **Test cost calculations** - ensure costs work with tier scaling
5. **Preview in UI** - load the character builder to verify display

### Common Errors to Avoid:
- Trailing commas in JSON objects
- Missing quotes around string values
- Circular reference chains in requirements
- Costs that don't match GameConstants patterns
- Descriptions that are too long for UI display

## Backup and Recovery
- Keep backups of working data files before major changes
- Use version control to track content changes over time
- Test data changes in isolation before committing
- Document the reasoning behind balance changes

## Future Expansion
- New categories can be added by updating GameDataManager
- Existing files can be extended with additional fields
- Consider splitting large files if they become unwieldy
- Plan for potential localization of text content