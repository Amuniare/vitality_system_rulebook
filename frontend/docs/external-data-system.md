# External Data System

The character builder uses a comprehensive external JSON data system managed by GameDataManager.

## Data Files (15 files, 832 lines)
- `actions.json` - Primary actions (14 entries)
- `archetypes.json` - 7 archetype categories with variants
- `attack_types_definitions.json` - Attack type mechanics
- `boons.json` - Simple boon abilities (8 entries)
- `conditions_basic.json` - Basic conditions (9 entries)  
- `descriptors.json` - Reality manipulation descriptors
- `effect_types_definitions.json` - Effect type mechanics
- `expertise_categories.json` - Expertise by attribute (7 categories)
- `features.json` - Supernatural features (4 tiers, 50+ entries)
- `flaws.json` - Character flaws (11 entries)
- `movement_features.json` - Enhanced movement (2 tiers)
- `senses.json` - Enhanced senses (4 tiers, 25+ entries)
- `stat_options_generic.json` - Stat bonus options (7 entries)
- `trait_conditions.json` - Trait conditions (3 tiers, 30+ entries)
- `unique_abilities_complex.json` - Complex abilities with upgrades (5 abilities)

## GameDataManager Architecture
- Async initialization with Promise-based loading
- Centralized data caching with Map storage
- Error handling for missing files
- Reference resolution (resolves GameConstants keys)