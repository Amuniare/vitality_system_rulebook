# Data Formats Documentation

This document provides comprehensive documentation of all character data formats used in the Vitality System project, including JSON schemas, field mappings, and conversion specifications.

## Table of Contents

1. [Web Builder Character Format](#web-builder-character-format)
2. [Roll20 Character Format](#roll20-character-format)
3. [Character Mapping System](#character-mapping-system)
4. [Data Validation](#data-validation)
5. [Examples](#examples)

---

## Web Builder Character Format

The web builder uses a hierarchical JSON structure optimized for character creation workflow and data organization.

### Core Schema

```json
{
  "id": "string",                     // Unique identifier (timestamp-based)
  "name": "string",                   // Character display name
  "realName": "string",               // Character's real/civilian name
  "playerName": "string",             // Player's name
  "characterType": "string",          // "player_character" | "npc" 
  "characterSubType": "string|null",  // NPC faction/group
  "tier": "number",                   // 1-10 power level
  "folderId": "string|null",          // Folder organization
  "version": "string",                // Builder version "2.2-action-rework"
  "created": "string",                // ISO timestamp
  "lastModified": "string",           // ISO timestamp
  "biographyDetails": {},             // Character background
  "archetypes": {},                   // Character build archetypes
  "talents": [],                      // Character talents/skills  
  "attributes": {},                   // Core attributes
  "mainPoolPurchases": {},            // Major character features
  "specialAttacks": [],               // Custom attacks
  "utilityPurchases": {},             // Minor features and abilities
  "calculatedStats": {},              // Derived combat stats
  "pointPools": {},                   // Point spending tracking
  "validationResults": {},            // Build validation state
  "buildState": {}                    // UI completion tracking
}
```

### Biography Details

```json
"biographyDetails": {
  "player_name": "string",
  "heir_ambition": "string",         // Character motivation
  "mandate_focus": "string",         // Campaign role
  "background_motivation": "string", // Character origin
  "authority_handling": "string",    // Personality trait
  "others_perception": "string",     // Social standing
  "bond_with_trader": "string",      // Relationship dynamic
  "character_bio": "string",         // Free-form biography
  "gm_notes": "string"              // GM-only information
}
```

### Archetypes System

```json
"archetypes": {
  "movement": "string",              // "behemoth" | "swift" | "skirmisher"
  "attackType": "string",            // "singleTarget" | "areaOfEffect" 
  "effectType": "string",            // "damageSpecialist" | "crowdControl"
  "uniqueAbility": "string",         // "extraordinary" | "practical"
  "defensive": "string",             // "juggernaut" | "resilient" | "evasive"
  "specialAttack": "string",         // "dualNatured" | "versatile"
  "utility": "string"               // "jackOfAllTrades" | "versatileMaster"
}
```

### Core Attributes

```json
"attributes": {
  "focus": "number",        // 0-10, mental precision
  "mobility": "number",     // 0-10, speed and agility  
  "power": "number",        // 0-10, raw strength
  "endurance": "number",    // 0-10, resilience
  "awareness": "number",    // 0-10, perception
  "communication": "number", // 0-10, social skills
  "intelligence": "number"  // 0-10, reasoning ability
}
```

### Special Attacks Structure

```json
"specialAttacks": [
  {
    "id": "string",                    // Unique identifier
    "name": "string",                  // Attack name
    "description": "string",           // Attack description
    "subtitle": "string",              // Attack type summary
    "attackTypes": ["string"],         // ["melee_ac", "ranged", etc.]
    "effectTypes": ["string"],         // ["damage", "control", etc.]
    "isHybrid": "boolean",             // Multi-type attack flag
    "limits": [],                      // Attack limitations
    "limitPointsTotal": "number",      // Limit constraint value
    "upgradePointsFromLimits": "number", // Points gained from limits
    "upgradePointsFromArchetype": "number", // Base archetype points
    "upgradePointsAvailable": "number", // Total available points
    "upgradePointsSpent": "number",    // Points currently used
    "upgrades": [                      // Attack enhancements
      {
        "id": "string",                // Upgrade identifier
        "name": "string",              // Upgrade name
        "cost": "number",              // Point cost
        "category": "string",          // Upgrade category
        "subcategory": "string",       // Upgrade subcategory
        "effect": "string",            // Rules text
        "originalCost": "number",      // Base cost before modifiers
        "isSpecialty": "boolean"       // Specialty upgrade flag
      }
    ],
    "basicConditions": [],             // Basic status effects
    "advancedConditions": [],          // Advanced status effects
    "properties": {                    // Attack properties
      "range": "string|null",
      "area": "string|null", 
      "requirements": [],
      "restrictions": []
    },
    "archetypeData": {}               // Archetype-specific data
  }
]
```

### Main Pool Purchases

```json
"mainPoolPurchases": {
  "boons": [                         // Major character features
    {
      "boonId": "string",            // Feature identifier
      "name": "string",              // Feature name
      "cost": "number",              // Point cost
      "category": "string",          // "defensive" | "offensive" | etc.
      "type": "string",              // "unique" | "simple"
      "baseCost": "number",          // Base cost before upgrades
      "upgrades": [                  // Feature modifications
        {
          "id": "string",            // Upgrade identifier
          "quantity": "number"       // Number purchased
        }
      ],
      "purchased": "string"          // ISO timestamp
    }
  ],
  "traits": [],                     // Custom character traits
  "flaws": [],                      // Character disadvantages
  "primaryActionUpgrades": []       // Basic action enhancements
}
```

### Utility Purchases

```json
"utilityPurchases": {
  "features": [                     // Minor abilities
    {
      "id": "string",               // Feature identifier
      "name": "string",             // Feature name
      "cost": "number",             // Point cost
      "purchased": "string"         // ISO timestamp
    }
  ],
  "senses": [],                     // Enhanced senses
  "movement": [],                   // Movement abilities
  "descriptors": []                 // Character descriptors
}
```

---

## Roll20 Character Format

Roll20 uses a completely flat structure with specific naming conventions and string-only values.

### Core Schema

```json
{
  "metadata": {
    "characterId": "string",         // Roll20 character ID
    "extractedAt": "string",         // ISO timestamp
    "name": "string",                // Character name
    "attributeCount": "number"       // Total attribute count
  },
  "attributes": {},                  // Flat key-value pairs (all strings)
  "repeating_sections": {            // Repeating data sections
    "attacks": {},                   // Character attacks
    "traits": {},                    // Character traits
    "features": {},                  // Character features
    "uniqueabilities": {},           // Special abilities
    "awarenessexpertises": {},       // Awareness skills
    "communicationexpertises": {},   // Communication skills
    "intelligenceexpertises": {},    // Intelligence skills
    "focusexpertises": {},           // Focus skills
    "mobilityexpertises": {},        // Mobility skills
    "enduranceexpertises": {},       // Endurance skills
    "powerexpertises": {}            // Power skills
  },
  "abilities": [],                   // Macro abilities
  "permissions": {                   // Access permissions
    "see_by": "string",              // "all" | "player"
    "edit_by": "string"              // "all" | "player"
  }
}
```

### Core Attributes (All String Values)

```json
"attributes": {
  "character_name": "string",        // Character display name
  "character_realname": "string",    // Real name
  "char_tier": "string",             // "1" through "10"
  
  // Core Attributes
  "char_focus": "string",            // "0" through "10"
  "char_mobility": "string",         // "0" through "10"
  "char_power": "string",            // "0" through "10"
  "char_endurance": "string",        // "0" through "10"
  "char_awareness": "string",        // "0" through "10"
  "char_communication": "string",    // "0" through "10"
  "char_intelligence": "string",     // "0" through "10"
  
  // Derived Combat Stats
  "char_avoidance": "string",        // 10 + tier + mobility
  "char_durability": "string",       // tier + ceil(endurance * 1.5)
  "char_resolve": "string",          // 10 + tier + focus
  "char_stability": "string",        // 10 + tier + power
  "char_vitality": "string",         // 10 + tier + endurance
  "char_accuracy": "string",         // tier + focus
  "char_damage": "string",           // tier + ceil(power * 1.5)
  "char_conditions": "string",       // tier * 2
  "char_movement": "string",         // max(mobility + 6, mobility + tier)
  "char_initiative": "string",       // tier + mobility + focus + awareness
  "char_hp": "string",               // "100/100" format
  
  // Archetype Fields
  "char_archetype_movement": "string",
  "char_archetype_attackType": "string",
  "char_archetype_effectType": "string",
  "char_archetype_uniqueAbility": "string",
  "char_archetype_defensive": "string",
  "char_archetype_specialAttack": "string",
  "char_archetype_utility": "string",
  
  // Biography
  "char_bio": "string"               // Formatted biography text
}
```

### Repeating Sections Structure

Each repeating section uses unique row IDs following Roll20's pattern:

#### Row ID Format
```
"-{prefix}{random_alphanumeric}"
Example: "-ON2ciXkBZk7HHKt4WqX"
```

#### Attacks Section
```json
"repeating_attacks": {
  "-ON2ciXkBZk7HHKt4WqX": {
    "AttackName": "string",          // Attack name
    "leftsub": "string",             // "Melee" | "Ranged"
    "AttackType": "string",          // "1" (melee) | "2" (ranged)
    "ArmorPiercing": "string",       // "1" if has armor piercing
    "Brutal": "string",              // "1" if has brutal
    "ReliableEffect": "string",      // "2" if enhanced effect
    "Bleed": "string"                // "1" if causes bleed
  }
}
```

#### Traits Section
```json
"repeating_traits": {
  "-ON2kGOKa4ZrdCEXte-g": {
    "traitName": "string",           // Trait name and conditions
    "traitDrBonus": "string",        // Damage reduction bonus
    "traitDgBonus": "string",        // Damage bonus  
    "traitAcBonus": "string",        // Accuracy bonus
    "traitActive": "string"          // "1" if active
  }
}
```

#### Features Section
```json
"repeating_features": {
  "-ON2fG8kBZk7HHKt4WqX": {
    "char_features": "string",       // Feature name
    "featuresDesc": "string"         // Feature description
  }
}
```

#### Expertise Sections
```json
"repeating_focusexpertises": {
  "-ON2n6VyZs2-20E31M9G": {
    "focusExpertiseActive": "string", // "@{char_tier}" | "on"
    "focusExpertiseName": "string"    // Skill name (optional)
  }
}
```

---

## Character Mapping System

The mapping system converts between web builder and Roll20 formats using specialized converters.

### Conversion Architecture

```
Web Builder JSON → Character Mapper → Roll20 JSON → ChatSetAttr Commands
```

### Core Mapping Rules

1. **All Roll20 values must be strings** - Convert all numbers to strings
2. **Flatten nested structures** - Convert hierarchical data to flat key-value pairs  
3. **Generate unique row IDs** - Use Roll20-compatible ID format for repeating sections
4. **Calculate derived stats** - Compute all combat statistics from base attributes
5. **Preserve data integrity** - Ensure no data loss during conversion

### Field Mapping Table

| Web Builder Field | Roll20 Field | Conversion |
|---|---|---|
| `name` | `character_name` | Direct copy |
| `realName` | `character_realname` | Direct copy |
| `tier` | `char_tier` | Number → String |
| `attributes.focus` | `char_focus` | Number → String |
| `attributes.mobility` | `char_mobility` | Number → String |
| `attributes.power` | `char_power` | Number → String |
| `attributes.endurance` | `char_endurance` | Number → String |
| `attributes.awareness` | `char_awareness` | Number → String |
| `attributes.communication` | `char_communication` | Number → String |
| `attributes.intelligence` | `char_intelligence` | Number → String |
| `archetypes.movement` | `char_archetype_movement` | Direct copy |
| `archetypes.attackType` | `char_archetype_attackType` | Direct copy |
| `archetypes.effectType` | `char_archetype_effectType` | Direct copy |
| `specialAttacks[]` | `repeating_attacks` | Custom converter |
| `mainPoolPurchases.traits[]` | `repeating_traits` | Custom converter |
| `utilityPurchases.features[]` | `repeating_features` | Custom converter |

### Derived Statistics Formulas

```javascript
// Combat Statistics
avoidance = 10 + tier + mobility
durability = tier + Math.ceil(endurance * 1.5)
resolve = 10 + tier + focus  
stability = 10 + tier + power
vitality = 10 + tier + endurance
accuracy = tier + focus
damage = tier + Math.ceil(power * 1.5)
conditions = tier * 2
movement = Math.max(mobility + 6, mobility + tier)
initiative = tier + mobility + focus + awareness
```

### Special Attack Conversion

```javascript
// Web Builder → Roll20 Attack Mapping
{
  "name": "Mastercrafted chainsword",
  "attackTypes": ["melee_ac"],
  "upgrades": [
    {"id": "Heavy_Strike"},
    {"id": "Accurate_Attack"},
    {"id": "High_Impact"}
  ]
}

// Converts to:
{
  "AttackName": "Mastercrafted chainsword",
  "leftsub": "Melee",
  "AttackType": "1",
  "ArmorPiercing": "1",    // from Heavy_Strike
  "Brutal": "1"            // from High_Impact
}
```

### ID Generation System

Roll20 requires unique IDs for repeating section rows:

```javascript
// Format: -{prefix}{random}
// Prefix: N + last 4 digits of timestamp
// Random: 12 character alphanumeric string

generateRowID() {
  const prefix = "N" + String(Date.now()).slice(-4);
  const random = generateRandomString(12);
  return `-${prefix}${random}`;
}

// Example: "-N2056kH8mP3qX9wR"
```

---

## Data Validation

### Web Builder Validation

```json
"validationResults": {
  "isValid": "boolean",             // Overall validation state
  "errors": ["string"],             // Critical validation failures
  "warnings": ["string"],           // Non-critical issues
  "completionStatus": {             // Build completion tracking
    "archetypesComplete": "boolean",
    "attributesComplete": "boolean", 
    "mainPoolComplete": "boolean",
    "specialAttacksComplete": "boolean",
    "utilityComplete": "boolean"
  }
}
```

### Roll20 Validation

```javascript
// Required Roll20 fields
const requiredFields = [
  "char_tier",
  "char_accuracy", 
  "char_damage",
  "char_avoidance",
  "char_durability",
  "char_resolve",
  "char_stability", 
  "char_vitality"
];

// All values must be strings
function validateRoll20Data(data) {
  for (const [key, value] of Object.entries(data.attributes)) {
    if (typeof value !== 'string') {
      throw new Error(`Invalid type for ${key}: expected string, got ${typeof value}`);
    }
  }
}
```

---

## Examples

### Complete Web Builder Character (Brother Rainard)

```json
{
  "id": "1750197836202",
  "name": "Brother Rainard",
  "realName": "",
  "playerName": "Nick",
  "tier": 4,
  "attributes": {
    "focus": 0,
    "mobility": 0, 
    "power": 4,
    "endurance": 4,
    "awareness": 4,
    "communication": 0,
    "intelligence": 0
  },
  "archetypes": {
    "movement": "behemoth",
    "attackType": "singleTarget",
    "effectType": "damageSpecialist",
    "defensive": "juggernaut"
  },
  "specialAttacks": [
    {
      "id": "17502052664680.5885271753907905",
      "name": "Mastercrafted chainsword",
      "attackTypes": ["melee_ac"],
      "effectTypes": ["damage"],
      "upgrades": [
        {
          "id": "Specialized_Combat_Melee_Specialization_Heavy_Strike",
          "name": "Heavy Strike",
          "cost": 40
        }
      ]
    }
  ]
}
```

### Corresponding Roll20 Format (Converted)

```json
{
  "metadata": {
    "characterId": "1750197836202",
    "name": "Brother Rainard",
    "attributeCount": 25
  },
  "attributes": {
    "character_name": "Brother Rainard",
    "char_tier": "4",
    "char_focus": "0",
    "char_mobility": "0",
    "char_power": "4", 
    "char_endurance": "4",
    "char_awareness": "4",
    "char_communication": "0",
    "char_intelligence": "0",
    "char_avoidance": "14",
    "char_durability": "10",
    "char_resolve": "14",
    "char_stability": "14",
    "char_vitality": "14",
    "char_accuracy": "4",
    "char_damage": "10",
    "char_conditions": "8",
    "char_movement": "10",
    "char_initiative": "8",
    "char_archetype_movement": "behemoth",
    "char_archetype_attackType": "singleTarget",
    "char_archetype_effectType": "damageSpecialist",
    "char_archetype_defensive": "juggernaut"
  },
  "repeating_sections": {
    "attacks": {
      "-N2056kH8mP3qX9wR": {
        "AttackName": "Mastercrafted chainsword",
        "leftsub": "Melee",
        "AttackType": "1",
        "ArmorPiercing": "1"
      }
    },
    "traits": {},
    "features": {}
  }
}
```

### ChatSetAttr Command Format

```javascript
// Final flattened format for Roll20 upload
{
  "character_name": "Brother Rainard",
  "char_tier": "4",
  "char_power": "4",
  "repeating_attacks_-N2056kH8mP3qX9wR_AttackName": "Mastercrafted chainsword",
  "repeating_attacks_-N2056kH8mP3qX9wR_leftsub": "Melee",
  "repeating_attacks_-N2056kH8mP3qX9wR_AttackType": "1"
}
```

---

## Version History

- **v2.2-action-rework**: Current web builder format with enhanced special attacks
- **v2.0**: Core character builder implementation
- **v1.0**: Initial Roll20 integration

## Related Documentation

- `roll20_character_sheet_attribute_list.md` - Complete Roll20 field reference
- `roll20-integration.md` - Integration architecture and API documentation
- `development-guide.md` - Development patterns and best practices