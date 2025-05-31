# Character Building Guide

## Overview

This guide explains how to build characters for the Vitality System using the JSON format compatible with Roll20. Characters are built according to the rules in `rulebook.md` and structured as JSON files for import.

## Building Process

### 1. Character Concept & Tier
- Determine character concept and appropriate **Tier** (1-10)
- Higher tiers have more attribute points and special attack points
- Tier determines base attributes and HP calculation

### 2. Attribute Distribution
- Distribute points **realistically** across **8 core attributes**: Awareness, Communication, Intelligence, Focus, Mobility, Endurance, Power
- **AVOID** putting all points in 1-2 stats - spread them for survivability and versatility
- Calculate **derived stats** from core attributes using proper formulas:
  - **Avoidance** = 10 + Focus + Mobility + tier + modifiers
  - **Durability** = 10 + Power × 1.5 + Endurance + tier + modifiers  
  - **Resolve** = 10 + Intelligence + Communication + tier + modifiers
  - **Stability** = 10 + Power + Intelligence + tier + modifiers
  - **Vitality** = 10 + Endurance + Awareness + tier + modifiers
  - **Accuracy** = Focus + Power + tier + modifiers
  - **Damage** = Power × 1.5 + tier + modifiers
  - **Conditions** = tier × 2 + modifiers
  - **Movement** = tier + Mobility + modifiers
  - **Initiative** = tier + Focus + Mobility + Awareness + modifiers

### 3. Archetypes Selection
Choose **5 archetypes** from different categories and **implement their mechanical effects**:
- **Movement**: Swift (+4 movement), Teleportation (-2 movement), etc.
- **Attack**: Single Target, AOE Specialist, etc.
- **Effect**: Damage Specialist, Hybrid Specialist, etc.
- **Special Attack**: Straightforward, Paragon, etc.
- **Defensive**: Resilient (+6 Durability), Stalwart, Juggernaut (+50 HP), etc.

**CRITICAL**: Add archetype bonuses to the `traits` repeating section, not just the calculations!

### 4. Attack Design Philosophy
- **Choose a coherent theme** for all attacks (technology, elements, martial arts, etc.)
- **Vary attack types** to create tactical options (ranged, melee, AOE, direct)
- **Balance offensive focus** - avoid defensive abilities unless core to concept
- **Create clear tactical roles** for each attack in combat

### 5. Special Attacks Implementation
- Design attacks using **Special Attack Points** (varies by tier)
- Choose **Attack Types** using correct codes:
  - `0` = Melee (AC)
  - `1` = Melee (DG/CN) 
  - `2` = Ranged
  - `3` = Direct
  - `4` = AOE
  - `5` = AOE Direct
- **Use specific upgrade fields** instead of string descriptions:
  - `"Brutal": "1"` - NOT `"DamageStringModifiers": "+ [Brutal]"`
  - `"ReliableEffect": "1"` - NOT `"ConditionsStringModifiers": "+ [Reliable]"`
  - `"Overhit": "1"`, `"ArmorPiercing": "1"`, `"Cursed": "1"`, etc.

### 6. String Modifiers - When NOT to Use
**Leave string modifier fields EMPTY** for mechanical upgrades:
```json
"AccuracyStringModifiers": "",  // Don't put upgrade names here
"DamageStringModifiers": "",    // Don't put upgrade names here  
"ConditionsStringModifiers": "" // Don't put upgrade names here
```

**Only use string modifiers for:**
- Unique effects not covered by upgrade fields
- Descriptive flavor text that doesn't affect mechanics
- Special interactions ("+[Long Range]", "+[Barrage x3]")

### 7. Hybrid System Implementation
For damage + condition attacks:
- Set `"Hybrid": "1"` (damage → condition) or `"Hybrid": "2"` (condition → damage)
- Set appropriate `"RollCN"` value for condition target:
  - `"1"` = Resolve
  - `"2"` = Stability  
  - `"3"` = Vitality
- Set proper `"EffectType"` for the condition

### 8. JSON Structure Requirements

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
    // Include ALL calculated derived stats
    "char_avoidance": 26,
    "char_durability": 34,
    // etc.
  }
}
```

#### Attack Structure with Proper Upgrades
```json
"-UniqueAttackID": {
  "AttackName": "Attack Name",
  "leftsub": "Attack Description", 
  "AttackType": "0-5",
  "Brutal": "0/1",
  "ReliableEffect": "0/1", 
  "Overhit": "0/1",
  "ArmorPiercing": "0/1",
  "Hybrid": "0/1/2",
  "RollCN": "1/2/3",
  "EffectType": "0-10",
  // Leave these EMPTY unless special case
  "AccuracyStringModifiers": "",
  "DamageStringModifiers": "",
  "ConditionsStringModifiers": ""
}
```

## Critical Lessons Learned

### ❌ **DON'T DO THIS:**
- Put all attribute points in 1-2 stats (breaks survivability)
- Use string descriptions for mechanical upgrades (`"+ [Brutal]"`)
- Ignore archetype trait implementation
- Calculate derived stats incorrectly
- Use wrong attack type codes
- Mix incoherent attack themes

### ✅ **DO THIS:**
- Spread attributes realistically across multiple stats
- Use specific upgrade fields (`"Brutal": "1"`, `"Overhit": "1"`, etc.)
- Implement archetype traits in the `traits` repeating section
- Double-check all derived stat calculations
- Verify attack types match intended mechanics
- Test hybrid system implementation
- Keep attack themes cohesive and focused
- Leave string modifiers empty for mechanical effects

## Best Practices

### Unique IDs
- All IDs must be **globally unique** across the entire system
- Use pattern: `-OZ[Letter][Number][Letter][Number]...` for new characters
- Check existing extracted characters to avoid conflicts

### Attribute Balance
- **Survivability**: Need some Endurance and defensive stats
- **Offense**: Balance accuracy, damage, and conditions
- **Utility**: Consider Mobility for positioning, Awareness for initiative

### Attack Design
- **Thematic Coherence**: All attacks should fit the character concept
- **Tactical Variety**: Mix of ranges, types, and effects
- **Clear Purpose**: Each attack should have a distinct combat role
- **Upgrade Implementation**: Use actual upgrade fields, not descriptions

### String Modifier Guidelines
- **Mechanical Effects**: Use upgrade fields (`"Brutal": "1"`)
- **Special Cases Only**: Use strings for unique interactions
- **Flavor Text**: Minimal descriptive text if needed
- **Default State**: Leave empty (`""`) for most attacks

## Examples

See the character files for proper implementation:
- `Element_Prime.json` - Proper upgrade field usage and elemental theme
- `Golden_Sentinel.json` - Heroic theme with realistic attributes
- `Override_Sentinel.json` - Technology theme with cohesive attack design

## Common Pitfalls

1. **Attribute Min-Maxing**: Putting all points in 2 stats makes fragile characters
2. **String Modifier Abuse**: Using descriptions instead of upgrade fields breaks mechanics
3. **Missing Archetype Traits**: Characters won't get archetype bonuses without proper traits
4. **Hybrid System Errors**: Must set both `"Hybrid"` and `"RollCN"` values correctly
5. **Calculation Mistakes**: Derived stats must match the exact formulas
6. **Attack Type Confusion**: Wrong codes break targeting mechanics entirely
7. **Thematic Inconsistency**: Random attack mix confuses tactical purpose
8. **Defensive Focus**: Most characters should focus on offensive capabilities

## Attack Design Examples

### Good Attack Set (Technology Theme):
1. **Plasma Cannon** (Ranged precision)
2. **Restraint Protocol** (Melee hybrid grab)
3. **Targeting Laser** (Ranged accuracy)
4. **Shock Wave** (AOE damage)
5. **Neural Override** (Direct stun)
6. **System Overload** (Ultimate AOE hybrid)

### Bad Attack Set (No Theme):
1. Fire Blast
2. Ice Shield
3. Lightning Strike  
4. Healing Light
5. Earth Wall
6. Wind Sword

## Reference Files

- `rulebook.md` - Complete Vitality System rules
- `input/` directory - Corrected character examples
- `src/char_sheet/rpgSheet_v5.5.html` - All available upgrade field names