## Complete Tab Analysis: Old Character Builder

### 1. **Basic Info Tab**
**Purpose:** Character foundation and identity setup
**Components:**
- Character name and player name
- Tier selection (1-10)
- Character type selection (Hero, Villain, Extra, Other, Custom)
- Description fields

**Systems Used:**
- `VitalityCharacter` class for data model
- `TierSystem` for tier-related calculations
- Direct form inputs with event listeners

**Key Features:**
- Simple form-based interface
- Real-time character header updates
- Character creation/loading triggers

---

### 2. **Identity Tab**
**Purpose:** Character background, personality, and roleplay elements
**Components:**
- Physical description (appearance, distinguishing features)
- Personality traits
- Background story
- Goals and motivations
- Secrets and fears
- Character portrait upload

**Systems Used:**
- Character data persistence
- Image upload handling
- Text area management

**Key Features:**
- Rich text areas for narrative content
- Portrait image management
- No mechanical impact (pure roleplay)

---

### 3. **Archetypes Tab**
**Purpose:** Select 7 core character archetypes that define abilities
**Components:**
Seven archetype categories:
1. **Movement** - Speed, jumping, flying capabilities
2. **Attack Type** - Area, direct, single target specialization
3. **Effect Type** - Buffs, debuffs, damage over time
4. **Unique Ability** - Complex powers, extraordinary abilities
5. **Defensive** - Damage reduction, regeneration, shields
6. **Special Attack** - Point calculation methods for attacks
7. **Utility** - Skill expertise approach

**Systems Used:**
- `ArchetypeSystem` - Manages archetype bonuses and effects
- `PointPoolCalculator` - Calculates pool changes from archetypes
- Event delegation for selection handling

**Key Features:**
- Radio button selection per category
- Real-time point pool updates
- Archetype bonuses display
- Prerequisite validation

---

### 4. **Attributes Tab**
**Purpose:** Allocate attribute points between combat and utility
**Components:**
- **Combat Attributes:** Power, Endurance, Dexterity, Focus
- **Utility Attributes:** Mobility, Communication, Awareness, Intelligence
- Point allocation interface with +/- buttons
- Pool tracking displays

**Systems Used:**
- `AttributeSystem` - Attribute definitions and validation
- `PointPoolCalculator` - Pool calculations
- `StatCalculator` - Derived stat calculations

**Key Features:**
- Real-time point tracking
- Tier-based maximum limits
- Automatic pool updates
- Visual feedback for limits

---

### 5. **Main Pool Tab**
**Purpose:** Spend main pool points on character enhancements
**Components:**
Six purchase sections:
1. **Flaws** - Cost 30 points, provide +tier stat bonus
2. **Traits** - Cost 30 points, conditional +tier bonuses
3. **Boons** - Basic abilities with fixed costs
4. **Unique Abilities** - Complex multi-stage purchases
5. **Action Upgrades** - Enhance base actions
6. **Custom Abilities** - Player-created content

**Systems Used:**
- `TraitFlawSystem` - Trait/flaw mechanics
- `BoonsSystem` - Boon management
- `UniqueAbilitySystem` - Complex ability handling
- `ActionSystem` - Action upgrade logic
- `PointPoolCalculator` - Main pool tracking

**Key Features:**
- Dynamic trait builder with stat/condition selection
- Unique ability upgrade trees
- Purchase/remove functionality
- Real-time cost calculations
- Custom ability creation forms

---

### 6. **Special Attacks Tab**
**Purpose:** Create and configure special attacks
**Components:**
- Attack list management
- Attack creation interface:
  - Name and description
  - Attack type selection (melee, ranged, area, etc.)
  - Effect type selection
  - Condition application
  - Limit selection for point generation
  - Upgrade purchases
- Point pool tracking per attack

**Systems Used:**
- `SpecialAttackSystem` - Core attack logic
- `AttackTypeSystem` - Attack type definitions
- `LimitCalculator` - Limit point calculations
- `UpgradeCalculator` - Upgrade cost/effect calculations

**Key Features:**
- Multiple attack management
- Complex limit/upgrade interactions
- Attack cloning functionality
- Efficiency calculations
- Per-attack point pools

---

### 7. **Utility Tab**
**Purpose:** Non-combat abilities and skill expertise
**Components:**
Five main sections:
1. **Talents** - Two innate character abilities (text fields)
2. **Utility Archetype Configuration**:
   - Practical: Select 3 skills for expertise
   - Specialized: Choose attribute for double expertise
   - Jack of All Trades: Automatic configuration
3. **Expertise Overview** - Visual skill expertise display
4. **Utility Pool Purchases**:
   - **Features** - Special abilities (e.g., Ambidextrous, Perfect Memory)
   - **Senses** - Enhanced perceptions (e.g., Darkvision, Tremor Sense)
   - **Movement** - Movement abilities (e.g., Wall Crawling, Phasing)
   - **Descriptors** - Power sources/types
5. **Custom Utility Creation**

**Systems Used:**
- `UtilitySystem` - Core utility logic
- `PointPoolCalculator` - Utility pool tracking
- Expertise calculation system

**Key Features:**
- Tabbed purchase interface
- Skill selection for archetypes
- Visual expertise indicators
- Custom utility creation
- Descriptor management

---

### 8. **Summary Tab**
**Purpose:** Complete character overview and export
**Components:**
- Character header with tier/type
- Point pool summary
- Attribute summary with derived stats
- Archetype summary
- Special attacks overview
- Utility abilities summary
- Export/Import functions

**Systems Used:**
- All calculation systems for final totals
- Export system for JSON generation
- Character validation

**Key Features:**
- Comprehensive character sheet view
- Export to JSON
- Import character data
- Print-friendly layout
- Validation indicators

---

## Common Systems Used Across Tabs

### Core Systems:
1. **GameDataManager** - Loads and manages all game data JSON files
2. **VitalityCharacter** - Character data model class
3. **EventManager** - Event delegation and handling
4. **UpdateManager** - Coordinates character updates
5. **RenderUtils** - UI component rendering helpers

### Calculation Systems:
1. **PointPoolCalculator** - All point pool calculations
2. **StatCalculator** - Derived stat calculations
3. **TierSystem** - Tier-based scaling

### Validation:
1. **CharacterValidator** - Rule enforcement
2. **ValidationDisplay** - Warning/error display

### UI Components:
1. **CharacterLibrary** - Character management
2. **PointPoolDisplay** - Pool visualization
3. **CharacterTree** - Hierarchical character view

### Data Files (15+ JSON files):
- archetypes.json
- attributes.json
- character_types.json
- flaws.json
- traits.json
- trait_conditions.json
- boons.json
- unique_abilities.json
- upgrades.json
- features.json
- senses.json
- movement_features.json
- descriptors.json
- skills.json
- actions.json
- limits.json
- conditions.json
- attack_types.json
- effect_types.json

This structure reveals the need for consolidation into a unified data system while maintaining all the complex interactions and rules that make the character builder functional.