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
│   ├── DiceSystem.js         # Dice rolling mechanics
│   └── TierSystem.js         # Tier progression calculations
├── systems/                  # Game system implementations
│   ├── ArchetypeSystem.js    # 7 archetype categories
│   ├── AttributeSystem.js    # Attributes & defenses
│   ├── ActionSystem.js       # Action economy
│   └── [others...]           # Additional game systems
├── calculators/              # Point pool & stat calculations
├── validators/               # Build validation & error checking
├── ui/                       # User interface components
│   ├── CharacterBuilder.js   # Main UI controller
│   ├── tabs/                 # Individual tab implementations
│   └── components/           # Reusable UI components


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
