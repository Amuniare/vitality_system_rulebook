# **docs/web-character-builder.md**

# Web Character Builder

Browser-based character creation tool for the Vitality System RPG. Built with vanilla JavaScript in a modular architecture.

## Architecture Overview

rulebook/character-builder/
├── app.js                    # Main application entry point
├── character-builder.html   # Main HTML interface
├── core/                     # Core game mechanics
│   ├── VitalityCharacter.js  # Character data model
│   ├── GameConstants.js      # All game constants/formulas
│   ├── GameDataManager.js    # External data loading system
│   ├── DiceSystem.js         # Dice rolling mechanics
│   └── TierSystem.js         # Tier progression calculations
├── data/                     # External JSON data files (15 files, 832 lines)
│   ├── actions.json          # Primary actions (14 entries)
│   ├── archetypes.json       # 7 archetype categories with variants
│   ├── attack_types_definitions.json # Attack type mechanics
│   ├── boons_simple.json     # Simple boon abilities (8 entries)
│   ├── conditions_basic.json # Basic conditions (9 entries)
│   ├── descriptors.json      # Reality manipulation descriptors
│   ├── effect_types_definitions.json # Effect type mechanics
│   ├── expertise_categories.json # Expertise by attribute (7 categories)
│   ├── features.json         # Supernatural features (4 tiers, 50+ entries)
│   ├── flaws.json           # Character flaws (11 entries)
│   ├── movement_features.json # Enhanced movement (2 tiers)
│   ├── senses.json          # Enhanced senses (4 tiers, 25+ entries)
│   ├── stat_options_generic.json # Stat bonus options (7 entries)
│   ├── trait_conditions.json # Trait conditions (3 tiers, 30+ entries)
│   └── unique_abilities_complex.json # Complex abilities with upgrades
├── systems/                  # Game system implementations (10 systems)
│   ├── ActionSystem.js       # Action economy & upgrades
│   ├── ArchetypeSystem.js    # 7 archetype categories
│   ├── AttackTypeSystem.js   # Attack & effect type management
│   ├── AttributeSystem.js    # Attributes & defenses
│   ├── SimpleBoonsSystem.js  # Simple boon purchases
│   ├── SpecialAttackSystem.js # Special attack creation
│   ├── TraitFlawSystem.js    # Trait & flaw management
│   ├── UniqueAbilitySystem.js # Complex unique abilities
│   ├── UtilitySystem.js      # Utility abilities & expertise
│   └── WealthSystem.js       # Wealth levels & purchasing
├── calculators/              # Point pool & stat calculations
│   ├── CombatCalculator.js   # Combat stat calculations
│   ├── LimitCalculator.js    # Special attack limit scaling
│   ├── PointPoolCalculator.js # Unified point pool system
│   └── StatCalculator.js     # Final stat calculations
├── validators/               # Build validation & error checking (MARKED FOR REMOVAL)
│   ├── ArchetypeValidator.js
│   ├── AttributeValidator.js
│   ├── BuildOrderValidator.js
│   ├── CharacterValidator.js
│   └── SpecialAttackValidator.js
├── ui/                       # User interface components
│   ├── CharacterBuilder.js   # Main UI controller
│   ├── components/           # Reusable UI components (10 components)
│   │   ├── ActionUpgradeSection.js    # Primary action upgrades
│   │   ├── BoonPurchaseSection.js     # Simple & complex boons
│   │   ├── CharacterLibrary.js        # localStorage management
│   │   ├── CharacterTree.js           # Hierarchical organization
│   │   ├── FlawPurchaseSection.js     # Flaw economics system
│   │   ├── PointPoolDisplay.js        # Real-time calculations
│   │   ├── SimpleBoonSection.js       # Simple boon purchases
│   │   ├── TraitPurchaseSection.js    # Complex trait builder
│   │   ├── UniqueAbilitySection.js    # Complex ability upgrades
│   │   └── ValidationDisplay.js       # Build order enforcement
│   ├── shared/               # Shared utilities (3 utilities)
│   │   ├── EventManager.js   # Standardized event handling
│   │   ├── RenderUtils.js    # Consistent UI rendering
│   │   └── UpdateManager.js  # Component update lifecycle
│   └── tabs/                 # Individual tab implementations (7 tabs)
│       ├── ArchetypeTab.js   # 7-category archetype selection
│       ├── AttributeTab.js   # Attribute point allocation
│       ├── BasicInfoTab.js   # Character name & tier selection
│       ├── MainPoolTab.js    # 5-section modular system
│       ├── SpecialAttackTab.js # Complex attack builder with modals
│       ├── SummaryTab.js     # Character overview & export
│       └── UtilityTab.js     # 5-category utility system
└── css/
    └── character-builder.css # Complete design system (651 lines)


## Current Status

### ✅ **Complete and Functional**
- **All 7 Tabs**: BasicInfo, Archetypes, Attributes, MainPool, SpecialAttacks, Utility, Summary
- **External Data System**: 15 JSON files via GameDataManager
- **Modular Architecture**: EventManager, UpdateManager, RenderUtils, Component system
- **5-Section Main Pool**: Flaws, Traits, Simple Boons, Unique Abilities, Action Upgrades
- **Complete Special Attack Builder**: Limits, upgrades, attack types with modal interfaces
- **Full Utility System**: Expertise, features, senses, movement, descriptors
- **Character Library**: localStorage with folders, search, import/export

### 🚧 **In Development** 
- **UI Polish**: Resolving interface responsiveness issues
- **Performance**: Optimizing update cycles and event handling
- **Code Quality**: Modularization and cleanup

### 📋 **Planned Features**
- JSON export/import
- Roll20 character upload integration
- Character templates and presets

## Key Features

### **Character Creation Flow**
1. Basic info (name, tier)
2. Choose 7 archetypes (affects all calculations)
3. Assign attributes (combat: tier×2, utility: tier points)
4. Main pool purchases (traits, flaws, boons)
5. Special attacks (limits → points → upgrades)
6. Utility purchases (expertise, features, etc.)

### **Real-time Validation**
- Build order enforcement (archetypes before attributes, etc.)
- Point pool budget tracking
- Archetype compatibility checking
- Attribute maximum limits (tier-based)

### **Character Library**
- localStorage persistence
- Folder organization
- Character search and filtering
- Import/export capabilities

## Development Notes

### **Point Pool System**
```javascript
// Combat attributes: tier × 2 points
// Utility attributes: tier points  
// Main pool: (tier - 2) × 15 points
// Utility pool: 5 × (tier - 1) points
```

### **Archetype Dependencies**
- Must be selected before attribute assignment
- Affects point pool calculations
- Provides bonuses and restrictions
- 7 categories: Movement, Attack Type, Effect Type, Unique Ability, Defensive, Special Attack, Utility

### **Validation Rules**
- No attribute can exceed tier value
- Point pools cannot be overspent
- Certain archetype combinations are restricted
- Build order must be followed

## Usage

1. Open `character-builder.html` in browser
2. Click "New Character" 
3. Fill basic info → select archetypes → assign attributes
4. Save character to library when complete
5. Export JSON for Roll20 upload

## Troubleshooting

**Character not saving**: Check browser localStorage limits
**Point calculations wrong**: Verify archetype selections are complete
**Tabs disabled**: Ensure previous steps are completed (build order enforcement)
