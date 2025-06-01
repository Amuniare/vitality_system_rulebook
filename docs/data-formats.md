

# **docs/data-formats.md**

```markdown
# Data Formats

Character data structures and JSON formats used throughout the Vitality System.

## Character JSON Structure

### **Complete Character Format**
```json
{
  "metadata": {
    "characterId": "unique-id-string",
    "extractedAt": "2025-01-XX...",
    "name": "Character Name",
    "attributeCount": 95
  },
  "attributes": {
    "character_name": "Hero Name",
    "character_realname": "Civilian Name", 
    "char_tier": "4",
    "char_efforts": "2",
    "char_focus": "3",
    "char_mobility": "2",
    "char_power": "4",
    "char_endurance": "3",
    "char_awareness": "2",
    "char_communication": "1", 
    "char_intelligence": "2",
    "char_hp": "100/100"
  },
  "repeating_sections": {
    "traits": {
      "row_id_1": {
        "traitActive": "1",
        "traitName": "Trait Name",
        "traitAcBonus": "0",
        "traitDgBonus": "2"
      }
    },
    "attacks": {
      "row_id_2": {
        "AttackName": "Special Attack",
        "AttackType": "2",
        "Brutal": "1",
        "ArmorPiercing": "1"
      }
    }
  },
  "abilities": [
    {
      "name": "Attack Name",
      "type": "indexed",
      "content": 5,
      "showInMacroBar": true,
      "isTokenAction": false
    }
  ],
  "permissions": {
    "see_by": "player1,player2",
    "edit_by": "player1"
  }
}
```

## Attribute Structure

### **Core Attributes**
```json
"attributes": {
  // Character basics
  "character_name": "Hero Name",
  "character_realname": "Real Name",
  "char_tier": "4",
  "char_efforts": "2",
  
  // Core stats (0 to tier maximum)
  "char_focus": "3",       // Combat: accuracy, initiative, resolve
  "char_mobility": "2",    // Combat: movement, initiative, avoidance  
  "char_power": "4",       // Combat: damage, conditions, stability
  "char_endurance": "3",   // Combat: vitality, durability
  "char_awareness": "2",   // Utility: notice things, initiative
  "char_communication": "1", // Utility: social skills
  "char_intelligence": "2",  // Utility: knowledge, reasoning
  
  // Calculated defenses (auto-computed)
  "char_avoidance": "19",     // 10 + tier + mobility + mods
  "char_durability": "21",    // tier + (endurance × 1.5) + mods
  "char_resolve": "17",       // 10 + tier + focus + mods
  "char_stability": "18",     // 10 + tier + power + mods  
  "char_vitality": "17",      // 10 + tier + endurance + mods
  
  // Combat stats (auto-computed)
  "char_accuracy": "7",       // tier + focus + mods
  "char_damage": "10",        // tier + (power × 1.5) + mods
  "char_conditions": "8",     // tier × 2 + mods
  "char_movement": "6",       // max(mobility + 6, mobility + tier) + mods
  "char_initiative": "11",    // tier + mobility + focus + awareness + mods
  
  // Health
  "char_hp": "100/100"        // current/maximum
}
```

### **Modifier Attributes** 
```json
// Manual modifiers for each stat
"char_avMod": "0",           // Avoidance modifier
"char_drMod": "0",           // Durability modifier
"char_acMod": "0",           // Accuracy modifier
// ... (mod for each stat)

// Primary action bonuses (checkboxes)
"char_avPrimaryAction": "on", // +tier when using primary action
"char_drPrimaryAction": "",   // (empty = not checked)
// ... (primary action for each stat)
```

## Repeating Sections

### **Traits Section**
```json
"traits": {
  "unique_row_id": {
    "traitActive": "1",        // 0/1 checkbox
    "traitName": "Swift",      // Text name
    "traitAcBonus": "2",       // Accuracy bonus
    "traitDgBonus": "0",       // Damage bonus  
    "traitCnBonus": "0",       // Condition bonus
    "traitAvBonus": "0",       // Avoidance bonus
    "traitDrBonus": "0",       // Durability bonus
    "traitRsBonus": "0",       // Resolve bonus
    "traitSbBonus": "0",       // Stability bonus
    "traitVtBonus": "0",       // Vitality bonus
    "traitMBonus": "4"         // Movement bonus
  }
}
```

### **Attacks Section**
```json
"attacks": {
  "attack_row_id": {
    "AttackName": "Plasma Cannon",
    "leftsub": "Ranged energy attack",
    "AttackType": "2",         // 0=Melee(AC), 1=Melee(DG/CN), 2=Ranged, 3=Direct, 4=AOE, 5=AOE Direct
    "RollCN": "0",            // 0=OFF, 1=Resolve, 2=Stability, 3=Vitality
    "EffectType": "0",        // 0=None, 1=Disarm, 2=Grab, ... 11=Disable Specials
    "Hybrid": "0",            // 0=OFF, 1=Damage→CN, 2=CN→Damage
    
    // Upgrade values (0/1 for most, numbers for tiers)
    "Brutal": "1",            // 0 or 1
    "ArmorPiercing": "1",     // 0 or 1
    "FinishingBlow": "2",     // Number of tiers (0-3)
    "MinionSlayer": "1",      // 1=AC, 2=DG, 3=CN bonus type
    
    // String modifiers (usually empty for mechanical upgrades)
    "AccuracyStringModifiers": "",
    "DamageStringModifiers": "", 
    "ConditionsStringModifiers": ""
  }
}
```

### **Other Repeating Sections**
```json
// Unique Abilities
"uniqueAbilities": {
  "ability_id": {
    "char_uniqueAbilities": "Telekinesis",
    "uniqueAbilitiesDesc": "Move objects with mind"
  }
}

// Features  
"features": {
  "feature_id": {
    "char_features": "Night Vision",
    "featuresDesc": "See in complete darkness"
  }
}

// Expertise sections (one per attribute)
"awarenessExpertises": {
  "expertise_id": {
    "awarenessExpertiseActive": "on",    // on/off checkbox
    "awarenessExpertiseName": "Tracking" // Text name
  }
}
```

## Abilities Structure

### **Compressed Abilities** (Storage Format)
```json
"abilities": [
  {
    "name": "Attack 1",
    "type": "indexed",             // Indicates compressed
    "content": 1,                  // Attack index number  
    "showInMacroBar": true,        // Macro bar visibility
    "isTokenAction": false,        // Token action flag
    "template_ref": "scriptcards", // Template reference
    "compression_ratio": 0.001     // Optional: compression stats
  },
  {
    "name": "Utility Ability", 
    "type": "full",                // Not compressed
    "content": "!scriptcard {{ ... }}", // Full macro content
    "showInMacroBar": false,
    "isTokenAction": true
  }
]
```

### **Expanded Abilities** (Runtime Format)
```json
"abilities": [
  {
    "name": "Attack 1",
    "content": "!scriptcard {{ --Rbyindex|...; }}", // Full 26KB+ content
    "showInMacroBar": true,
    "isTokenAction": false
  }
]
```

## Data Flow Formats

### **Web Builder → Export**
```json
{
  "id": "timestamp_string",
  "name": "Character Name", 
  "tier": 4,
  "archetypes": {
    "movement": "swift",
    "attackType": "singleTarget",
    // ... other archetypes
  },
  "attributes": {
    "focus": 3,
    "mobility": 2,
    // ... other attributes  
  },
  "specialAttacks": [],
  "utilityPurchases": {}
}
```

### **Roll20 Flat Format** (ChatSetAttr)
```json
{
  "char_tier": "4",
  "char_focus": "3", 
  "repeating_attacks_row1_AttackName": "Plasma Cannon",
  "repeating_attacks_row1_AttackType": "2",
  "repeating_attacks_row1_Brutal": "1"
}
```

## Validation Rules

### **Required Fields**
```javascript
// Minimum viable character
{
  "metadata": { "name": "string" },
  "attributes": { 
    "char_tier": "1-10",
    "character_name": "string" 
  },
  "repeating_sections": {},
  "abilities": [],
  "permissions": {}
}
```

### **Attribute Constraints**
- `char_tier`: Integer 1-10 (usually starts at 4)
- Core stats: Integer 0 to tier value
- Calculated stats: Auto-computed, don't set manually
- HP format: "current/max" (e.g. "75/100")

### **Attack Type Values**
- `0`: Melee (Accuracy) - adjacent, +tier to accuracy OR damage
- `1`: Melee (Damage/Condition) - adjacent, +tier to damage/condition  
- `2`: Ranged - 15 spaces, -tier if adjacent to enemy
- `3`: Direct - 30 spaces, auto-hit, condition only, -tier to rolls
- `4`: AOE - 3sp radius/6sp cone/12sp line, -tier to rolls
- `5`: AOE Direct - Area + auto-hit, condition only

### **Condition Target Values**
- `0`: No condition
- `1`: Resolve resistance
- `2`: Stability resistance  
- `3`: Vitality resistance

## File Organization

### **Directory Structure**
```
characters/
├── extracted/           # From Roll20 (flat JSON format)
├── web_exports/        # From web builder (nested format)  
├── input/              # Test/template characters
└── compressed/         # Backup of compressed versions
```

### **Naming Conventions**
- **Extracted**: `Character_Name_tier4_timestamp.json`
- **Web Export**: `character_name_id.json`
- **Template**: `template_archetype_tier4.json`

## Migration Between Formats

### **Web Builder → Roll20 Format**
```python
from src.character.mapper import CharacterMapper

# Convert nested to flat
flat_data = CharacterMapper.flatten_for_chatsetattr(web_builder_data)
```

### **Old Format → New Format** 
```python
# Migrate legacy character data
new_data = CharacterMapper.convert_old_format_to_new(old_data)
```

## Common Data Issues

### **Troubleshooting**
- **Missing attributes**: Check required fields exist
- **Invalid tier**: Ensure 1-10 range, usually start at 4
- **Repeating section errors**: Verify row IDs are unique
- **Ability expansion fails**: Check ScriptCards template exists
- **Upload failures**: Validate JSON structure before upload

### **Data Cleanup**
```python
# Validate character data
from src.utils.json_utils import load_json
char = load_json("character.json")

# Check required fields
assert "metadata" in char
assert "name" in char["metadata"] 
assert "attributes" in char
assert "char_tier" in char["attributes"]
```
