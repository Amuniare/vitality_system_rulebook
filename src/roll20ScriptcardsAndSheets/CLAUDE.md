# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Directory Overview

This directory contains Roll20 assets for the Vitality System RPG, including character sheets, ScriptCards macros, visual themes, and rulebook documentation split into sections.

## Directory Structure

- **char_sheet/** - Roll20 custom character sheet HTML and CSS
- **scriptcards/** - ScriptCards macro library for automated attack resolution
  - **themes/** - Visual theme configurations for ScriptCards output
    - **rogue_trader/** - Character-specific themed variants
- **rulebook/** - Markdown documentation split by section from the main rulebook
- **split_rulebook.py** - Utility script to split the main rulebook into sections

## Key Components

### Character Sheet (char_sheet/)

The Roll20 character sheet (`rpgSheet_v5.5.html`) is a fully automated HTML character sheet with embedded JavaScript workers for the Vitality System.

**Architecture:**
- **HTML Structure**: Uses Roll20's sheet worker syntax (`attr_`, `repeating_`, etc.)
- **Auto-calculation**: JavaScript workers automatically calculate derived stats from base attributes
- **Repeating Sections**: Traits, attacks, unique abilities, features, and expertise use repeating fieldsets
- **Tab System**: Four main tabs (Combat, Utility, Attack Building, Notes) managed via sheet workers

**Core Stats System:**
- **Base Attributes**: Focus, Mobility, Power, Endurance, Awareness, Communication, Intelligence
- **Derived Stats**: Avoidance, Durability, Resolve, Stability, Vitality, Movement, Accuracy, Damage, Conditions, Initiative
- **Formula Pattern**: Most stats = Base (10 or 0) + Tier + Attribute + Modifier + TraitBonuses + PrimaryActionBonus - Weaken
- **Movement Special Case**: Uses `max(Tier, 6) + Mobility` with optional Swift bonus (+½ Tier)

**Attack Building System:**
- **Attack Types**: Melee (AC/DG variants), Ranged, Direct, AOE, AOE Direct
- **Upgrade Categories**: Accuracy (11 upgrades), Damage (15 upgrades), Condition (7 upgrades), Specialized Combat (13 upgrades), Slayer variants (4 types), Variable bonuses (6 types)
- **String Modifiers**: Freeform text fields for custom bonuses using Roll20 attribute reference syntax (`[*S:char_tier]`)

**Sheet Workers:**
- Expertise totals calculated per skill (Awareness, Communication, etc.) based on active checkboxes
- Defense and offense stats recalculated on attribute changes, trait updates, or checkbox toggles
- Trait bonuses aggregated from repeating_traits section based on traitActive checkbox

### ScriptCards Attack Library (scriptcards/)

The main attack script (`Scripcards Attacks Library Neopunk 3.7.3.txt`) is a comprehensive Roll20 ScriptCards macro that reads character sheet attack data and resolves combat automatically.

**Architecture Pattern:**
```
1. Declarations → Load character/attack data from sheet
2. Formatting → Apply visual theme
3. Player Input → Read attack configuration from repeating_attacks
4. Attack Dice Setup → Configure d20/3d6 with modifiers
5. Roll Modifiers → Apply upgrades (Reliable, Enhanced, Consistent, Critical, High Impact)
6. Attack Modifiers → Apply attack type penalties and upgrade bonuses
7. For Loop → Iterate through selected targets
   ├─ Load enemy defenses
   ├─ Check enemy status markers (Setup, Stunned, Prone)
   ├─ Roll accuracy vs avoidance
   ├─ Roll damage vs durability
   ├─ Roll condition vs resistance
   ├─ Apply damage and status markers
   └─ Check for death/culling/finishing blow
8. Attack Details → Output notes about special effects
```

**Key Variables:**
- `AttackType`: 0=Melee(AC), 1=Melee(DG/CN), 2=Ranged, 3=Direct, 4=AOE, 5=AOE Direct
- `RollCN`: 0=OFF, 1=Resolve, 2=Stability, 3=Vitality
- `EffectType`: 0=None, 1=Disarm, 2=Grab, 3=Shove, 4=Daze, 5=Blind, 6=Taunt, 7=Setup, 8=Control, 9=Stun, 10=Weaken, 11=DisableSpecials
- `Hybrid`: 0=OFF, 1=Damage→CN, 2=CN→Damage
- Slayer Upgrades: 0=OFF, 1=Accuracy, 2=Damage, 3=Conditions

**Status Markers:**
Uses Roll20's status markers and the ScriptCards `LibSN_` library functions:
- `LibSN_ADD_STATUS_MARKER_SET` - Add marker to token
- `LibSN_INCREMENT_STATUS_MARKER` - Increase marker counter
- `LibSN_CHECK_STATUS_MARKER` - Read marker state
- `LibSN_REMOVE_STATUS_MARKER_SET` - Remove marker
- `LibSN_APPLY_DAMAGE_OR_HEALING` - Modify token HP bar

**Critical System:**
- Base critical range: 20 (d20 natural 20)
- Upgrades can reduce to 15
- Stunned enemies: Auto-crit (range becomes 2)
- Critical effects add Tier bonus to damage and/or conditions

### Visual Themes (scriptcards/themes/)

ScriptCards theme files define the visual presentation of macro output.

**Theme Structure:**
- `boxcode` - Container styling
- `titlecode` - Main title styling
- `textcode` - Body text styling
- `buttonwrapper` - Button container layout
- `buttonstyle` - Individual button styling
- `subtitlestyle` - Subtitle text styling
- `footer` - Optional footer content

**Character Themes (rogue_trader/):**
Each PC has a custom theme matching their aesthetic:
- `cinder_flame.txt` - Fire/heat aesthetic
- `faust_cyber.txt` - Cyberpunk aesthetic
- `ines_sacred.txt` - Holy/sacred aesthetic
- `rainard_grimdark.txt` - Dark/grim aesthetic
- `vale_harlequin.txt` - Colorful/chaotic aesthetic
- `venecia_warrant.txt` - Official/authoritative aesthetic

### Rulebook Sections (rulebook/)

The rulebook is split into 8 markdown sections numbered `01_` through `08_`.

**Section Organization:**
1. Basic Rules - Dice system, tier system, attributes, combat formulas
2. Character Basics - Character creation fundamentals
3. Core Character Archetypes - Class/role definitions
4. Passive and Conditional Bonuses - Trait system
5. Unique Abilities - Special powers
6. Attacks - Attack building and combat mechanics
7. Utility Abilities - Non-combat skills
8. Appendix - Reference tables and additional rules

### Split Rulebook Script (split_rulebook.py)

Python utility that splits the main rulebook markdown file into individual section files.

**Usage:**
```bash
python split_rulebook.py
```

**Behavior:**
- Reads from `frontend/rules/rulebook.md`
- Splits on H1 headers (`# SECTION`)
- Outputs to `rulebook/` directory
- Naming pattern: `{section_num}_section_{section_num}_{section_name}.md`

**Path Configuration:**
Update `SOURCE_FILE` and `OUTPUT_DIR` constants if file locations change.

## Common Development Tasks

### Updating Character Sheet

1. Edit `char_sheet/rpgSheet_v5.5.html`
2. Test changes in Roll20 campaign
3. Character sheet workers trigger on:
   - `change:attr_name` - When attribute changes
   - `sheet:opened` - When sheet opens
   - `change:repeating_section` - When repeating section item changes
   - `remove:repeating_section` - When repeating section item deleted

**Important:** Always test autocalc formulas after changes. Sheet workers use Roll20's `getAttrs()`, `setAttrs()`, and `getSectionIDs()` API.

### Modifying Attack Resolution

1. Edit `scriptcards/Scripcards Attacks Library Neopunk 3.7.3.txt`
2. Follow the existing pattern for upgrades:
   ```
   --=UpgradeName| [*R:UpgradeName]  # Read from sheet
   --?[$UpgradeName] -eq 1|&TargetString;+ + [bonus] [UpgradeName]  # Apply if active
   ```
3. Test with multiple target scenarios (1 target, multiple targets)
4. Verify status marker application/removal

**Critical Rules:**
- Always use `--?` conditional checks before applying effects
- String concatenation uses `--&variable|+ text` pattern
- Calculations use `--=variable| formula` pattern
- Roll syntax: `[$DamageDice]` displays dice, `[$DamageRoll]` shows total

### Creating New Themes

1. Copy an existing theme from `scriptcards/themes/`
2. Modify CSS-like styling codes
3. Update color values (hex colors like `#00ffff`)
4. Update font families and sizes
5. Test by setting `--#overridetemplate| themename` in ScriptCards macro

**Theme Application:**
In ScriptCards, use: `--#overridetemplate| paper` (or other theme name without .txt extension)

### Regenerating Rulebook Sections

When the main rulebook in `frontend/rules/rulebook.md` is updated:

```bash
cd src/roll20ScriptcardsAndSheets
python split_rulebook.py
```

This ensures Roll20 assets stay synchronized with the latest rules.

## Integration Notes

### Data Flow with Other Project Components

- **Frontend Character Builder** → Exports JSON → (Manual) → Roll20 character sheet input
- **Roll20 Character Sheet** → Used by → ScriptCards macros for attack resolution
- **Rulebook Sections** ← Split from ← `frontend/rules/rulebook.md` (source of truth)

### Character Sheet ↔ ScriptCards Communication

ScriptCards reads character sheet attributes using Roll20 attribute reference syntax:
- `[*S:char_accuracy]` - Source token's accuracy attribute
- `[*R:AttackName]` - Current repeating section row's AttackName field
- `[*[&testvar]:character_name]` - Target token's character name (variable reference)

The character sheet must maintain attribute names that match ScriptCards expectations.

## Important Conventions

### Naming Patterns

- **Character Sheet Attributes**: `attr_char_statname` (base stats), `attr_display_statname` (derived/calculated)
- **Repeating Section Fields**: `repeating_sectionname_rowid_fieldname`
- **ScriptCards Variables**: Roll values use `[$variable]`, strings use `[&variable]`, calculations use `--=variable|`
- **Status Markers**: Match Roll20's built-in marker names (e.g., `lightning-helix`, `archery-target`, `dead`)

### Upgrade System Pattern

All combat upgrades follow this pattern in both sheet and ScriptCards:
1. Binary on/off (0 or 1) for most upgrades
2. Multi-tier for Finishing Blow, Slayer variants (0-3)
3. String modifiers for domain/channeled/variable effects (freeform text with attribute references)

### Roll20 Sheet Worker Patterns

Always structure autocalculation sheet workers like this:
```javascript
on('change:dependency1 change:dependency2 sheet:opened', function() {
    getAttrs(['dependency1', 'dependency2'], function(values) {
        const result = calculate(values);
        setAttrs({ result_attribute: result });
    });
});
```

For repeating sections, add: `change:repeating_section remove:repeating_section`
