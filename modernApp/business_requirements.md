
# BUSINESS_REQUIREMENTS.md
## Vitality System Character Builder - Business Requirements

### Project Vision

Create a modern, data-driven character builder for the Vitality System RPG that consolidates game content into a unified data structure, implements reusable universal components for 50%+ code reduction, maintains 100% rulebook accuracy, and provides a superior user experience with features like multi-character management and Roll20 export.

### Core Principles

1. **No Validation Blocking**: The system provides advisory warnings only. Players can exceed point limits, violate requirements, or make "illegal" choices - the system warns but never prevents.

2. **100% Rulebook Accuracy**: All text, formulas, and rules must exactly match the official rulebook. No paraphrasing or simplification of game content.

3. **Data-Driven Architecture**: All game content lives in JSON. Adding new content means editing data files, not writing code.

4. **Universal Components**: Reusable components that adapt to data, reducing code duplication by 50% or more.

### Functional Requirements by Tab

#### 1. Basic Info Tab
**Purpose**: Foundation character information

**Features**:
- Character name (text input)
- Player name (text input)
- Tier selection (1-10 dropdown)
- Character type selection:
  - Hero (protector/defender)
  - Villain (antagonist)
  - Rogue (anti-hero)
  - Custom (text input)
- Auto-save on every change
- Character avatar upload (future)

**Business Rules**:
- Default tier is 4 (Competent)
- Character name required for save
- Type affects no mechanics (roleplay only)

#### 2. Archetypes Tab
**Purpose**: Select one archetype from each of 7 categories

**Categories & Options**:

**Movement**: Swift, Skirmisher, Behemoth, Vanguard, Mole, Alternative Movement (Flight/Teleportation/Portal/Swinging/Super Jump)

**Attack Type**: Area Specialist, Direct Specialist, No Preference

**Effect Type**: Damage Dealer, Buffer/Debuffer, Damage & Effect Hybrid, Effect Focused

**Unique Ability**: Versatile Master, Extraordinary, Cut Above

**Defensive**: Stalwart, Fortress, Resilient, Immutable, Juggernaut

**Special Attack**: Normal, Specialist, Paragon, One Trick, Straightforward, Shared Uses, Dual-Natured, Basic

**Utility**: Practical, Specialized, Jack of All Trades

**Business Rules**:
- Must select exactly one per category
- No point cost for archetypes
- Some archetypes modify point pools
- Selections affect other tab options

#### 3. Attributes Tab
**Purpose**: Allocate attribute points

**Combat Attributes** (Tier × 2 points total):
- **Focus**: Accuracy, Initiative, Resolve
- **Power**: Damage (×1.5), Conditions, Stability  
- **Mobility**: Movement, Avoidance, Initiative
- **Endurance**: Durability (×1.5), Vitality, Survival

**Utility Attributes** (Tier points total):
- **Awareness**: Initiative, perception checks
- **Communication**: Social interactions
- **Intelligence**: Knowledge, problem-solving

**Features**:
- +/- buttons for allocation
- Real-time point tracking
- Derived stat calculations
- Visual indicators at limits

**Business Rules**:
- Cannot exceed Tier in any attribute
- Minimum 0 per attribute
- Auto-calculate derived stats
- Warning if points unspent

#### 4. Main Pool Tab
**Purpose**: Spend (Tier - 2) × 15 points

**Purchase Categories**:

**Flaws** (Cost 30 points each):
- Provide +Tier bonus to chosen stat
- Examples: Slow, Predictable, Fragile

**Traits** (Cost 30 points each):
- Conditional +Tier bonuses
- Examples: Berserker, Precise Striker

**Boons** (Variable costs):
- Simple abilities like Aquatic, Perfect Balance
- Costs range from 5-40 points

**Unique Abilities** (Variable costs):
- Complex multi-stage purchases
- Examples: Duplication, Shapeshifting
- Upgrade trees with prerequisites

**Action Upgrades** (Variable costs):
- Enhance base actions
- Examples: Multi-Attack, Improved Heal

**Custom Abilities**:
- Player-created content
- Name, description, cost fields

**Features**:
- Dynamic purchase cards
- Filtering by category
- Search functionality  
- Running point total
- Purchase/remove buttons
- Expandable descriptions

**Business Rules**:
- Can spend into negative (warning only)
- Some items have prerequisites
- Flaws may have stat requirements
- Custom abilities GM-approved

#### 5. Special Attacks Tab
**Purpose**: Create and configure special attacks

**Features**:
- Create multiple attacks
- Per-attack configuration:
  - Name & description
  - Attack type (Melee/Ranged/Emanation/etc.)
  - Effect type selection
  - Condition application
  - Range/area options
- Limits system:
  - Select limits for bonus points
  - Points = Tier × multiplier
  - Examples: Ammo, Charge-Up, Situational
- Upgrade purchases:
  - Spend points on improvements
  - Damage increases
  - Condition improvements
  - Special properties
- Attack cloning
- Efficiency calculations

**Business Rules**:
- Points from archetype selection
- First (Tier × 10) at full value
- Next (Tier × 20) at half value
- Remainder at quarter value
- Some archetypes restrict limits

#### 6. Utility Tab  
**Purpose**: Non-combat abilities using 5 × (Tier - 2) points

**Sections**:

**Talents** (Free):
- Two text fields for narrative talents
- Examples: "Expert Chef", "Military History"

**Archetype Configuration**:
- **Practical**: Select 3 skills for expertise
- **Specialized**: Choose attribute for bonus
- **Jack of All Trades**: Automatic

**Expertise Display**:
- Visual skill list with bonuses
- Calculated from archetype + purchases

**Purchasable Options**:
- **Expertise**: Additional skill bonuses (5 points)
- **Features**: Ambidextrous, Perfect Memory (5-10 points)
- **Senses**: Darkvision, Tremorsense (5-15 points)
- **Movement**: Wall-Crawling, Phasing (10-20 points)
- **Descriptors**: Power sources/types (variable)

**Custom Utilities**:
- Create custom features
- Name, description, cost

**Business Rules**:
- Cannot purchase if archetype restricts
- Descriptors affect Special Attacks
- Some features have prerequisites

#### 7. Base Attacks Tab
**Purpose**: Configure default attack options

**Features**:
- Physical base attack config
- Energy base attack config
- Attack type selection
- Range settings
- Default conditions
- Upgrade applications

**Business Rules**:
- Uses Focus for accuracy
- Uses Power for damage/conditions
- Upgrades from Main Pool apply

#### 8. Identity Tab
**Purpose**: Character background and roleplay

**Features**:
- Character portrait upload
- Background story (rich text)
- Personality traits
- Goals & motivations
- Fears & secrets
- Costume description
- Notable relationships

**Business Rules**:
- No mechanical impact
- Supports markdown formatting
- Image size limits
- Auto-save drafts

#### 9. Summary Tab
**Purpose**: Complete overview and export

**Features**:
- Character sheet view:
  - All stats calculated
  - Combat values
  - Defenses
  - Attacks summary
  - Abilities list
- Point totals summary
- Validation warnings
- Export options:
  - JSON format
  - PDF character sheet
  - Roll20 compatible JSON
  - Plain text summary
- Import character function
- Print-friendly view

**Business Rules**:
- Shows all warnings
- Never blocks export
- Version in export data
- Backwards compatibility

### Non-Functional Requirements

#### Performance
- Tab switches < 100ms
- Search results instant
- Auto-save < 50ms
- Support 10+ characters

#### Accessibility  
- Full keyboard navigation
- Screen reader support
- High contrast mode
- Mobile responsive

#### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

#### Data Management
- localStorage primary
- Import/export backup
- Corruption recovery
- Migration support

### Data Requirements

#### Unified Schema
All game entities follow consistent structure with required fields: id, type, name, cost, description, effects, requirements, ui configuration.

#### Content Sources
- Flaws & Traits
- Boons  
- Unique Abilities
- Action Upgrades
- Attack Upgrades
- Utility Features
- Archetypes
- Skills

#### Validation Rules
Expressed as data, not code. Requirements checked but never enforced. Warnings provided for guide.

### Success Metrics

1. **Code Reduction**: 50%+ fewer lines vs old system
2. **Consistency**: All entities use same components  
3. **Accuracy**: 100% rulebook compliance
4. **Performance**: All operations < 100ms
5. **Reliability**: No data loss, corruption recovery
6. **Usability**: Complete character in < 10 minutes
