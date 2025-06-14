## COMPLETE ATTRIBUTE LIST

Based on reviewing the HTML character sheet (`rpgSheet_v5.5.html`) and example attributes, here are **ALL possible attributes** in your RPG system:

### Basic Character Information
- `character_name` - Hero name
- `character_realname` - Real name  
- `char_tier` - Character tier (default: 4)
- `char_efforts` - Current efforts (default: 2)

### Core Stats (Attributes)
- `char_focus` - Focus attribute score
- `char_mobility` - Mobility attribute score  
- `char_power` - Power attribute score
- `char_endurance` - Endurance attribute score
- `char_awareness` - Awareness attribute score
- `char_communication` - Communication attribute score
- `char_intelligence` - Intelligence attribute score

### Attribute Totals (Calculated from expertises)
- `awarenessTotal` - Total awareness bonus from expertises
- `communicationTotal` - Total communication bonus from expertises
- `intelligenceTotal` - Total intelligence bonus from expertises
- `focusTotal` - Total focus bonus from expertises
- `mobilityTotal` - Total mobility bonus from expertises
- `enduranceTotal` - Total endurance bonus from expertises
- `powerTotal` - Total power bonus from expertises

### Defense Stats (Calculated + Manual Modifiers)
- `char_avoidance` - Calculated avoidance defense
- `display_avoidance` - Display value for avoidance
- `char_avMod` - Manual modifier for avoidance
- `char_avPrimaryAction` - Checkbox for primary action bonus

- `char_durability` - Calculated durability defense
- `display_durability` - Display value for durability
- `char_drMod` - Manual modifier for durability  
- `char_drPrimaryAction` - Checkbox for primary action bonus

- `char_resolve` - Calculated resolve defense
- `display_resolve` - Display value for resolve
- `char_rsMod` - Manual modifier for resolve
- `char_rsPrimaryAction` - Checkbox for primary action bonus

- `char_stability` - Calculated stability defense
- `display_stability` - Display value for stability
- `char_sbMod` - Manual modifier for stability
- `char_sbPrimaryAction` - Checkbox for primary action bonus

- `char_vitality` - Calculated vitality defense
- `display_vitality` - Display value for vitality
- `char_vtMod` - Manual modifier for vitality
- `char_vtPrimaryAction` - Checkbox for primary action bonus

### Combat Stats (Calculated + Manual Modifiers)
- `char_movement` - Calculated movement
- `display_movement` - Display value for movement
- `char_movementMod` - Manual modifier for movement
- `char_movementPrimaryAction` - Checkbox for primary action bonus

- `char_accuracy` - Calculated accuracy
- `display_accuracy` - Display value for accuracy
- `char_acMod` - Manual modifier for accuracy
- `char_acPrimaryAction` - Checkbox for primary action bonus

- `char_damage` - Calculated damage
- `display_damage` - Display value for damage
- `char_dgMod` - Manual modifier for damage
- `char_dgPrimaryAction` - Checkbox for primary action bonus

- `char_conditions` - Calculated conditions
- `display_conditions` - Display value for conditions
- `char_cnMod` - Manual modifier for conditions
- `char_cnPrimaryAction` - Checkbox for primary action bonus

- `char_initiative` - Calculated initiative
- `display_initiative` - Display value for initiative
- `char_initiativeMod` - Manual modifier for initiative
- `char_initiativePrimaryAction` - Checkbox for primary action bonus

### Hit Points
- `char_hp` - Current hit points
- `char_hp_max` - Maximum hit points

### Sheet Navigation
- `sheet_tab` - Current active tab (character/combat/utility/other/notes)

### Repeating Section: Traits
- `repeating_traits_[ID]_traitActive` - Checkbox if trait is active
- `repeating_traits_[ID]_traitName` - Name of the trait
- `repeating_traits_[ID]_traitAcBonus` - Accuracy bonus from trait
- `repeating_traits_[ID]_traitDgBonus` - Damage bonus from trait
- `repeating_traits_[ID]_traitCnBonus` - Conditions bonus from trait
- `repeating_traits_[ID]_traitAvBonus` - Avoidance bonus from trait
- `repeating_traits_[ID]_traitDrBonus` - Durability bonus from trait
- `repeating_traits_[ID]_traitRsBonus` - Resolve bonus from trait
- `repeating_traits_[ID]_traitSbBonus` - Stability bonus from trait
- `repeating_traits_[ID]_traitVtBonus` - Vitality bonus from trait
- `repeating_traits_[ID]_traitMBonus` - Movement bonus from trait

### Repeating Section: Unique Abilities
- `repeating_uniqueAbilities_[ID]_char_uniqueAbilities` - Name of unique ability
- `repeating_uniqueAbilities_[ID]_uniqueAbilitiesDesc` - Description of unique ability

### Repeating Section: Features
- `repeating_features_[ID]_char_features` - Name of feature
- `repeating_features_[ID]_featuresDesc` - Description of feature

### Repeating Section: Notes
- `repeating_notes_[ID]_char_notes` - Note title
- `repeating_notes_[ID]_notesDesc` - Note description

### Repeating Section: Expertise Systems (7 different attribute types)
**Awareness Expertises:**
- `repeating_awarenessExpertises_[ID]_awarenessExpertiseActive` - Checkbox if expertise is active
- `repeating_awarenessExpertises_[ID]_awarenessExpertiseName` - Name of expertise

**Communication Expertises:**
- `repeating_communicationExpertises_[ID]_communicationExpertiseActive` - Checkbox if expertise is active  
- `repeating_communicationExpertises_[ID]_communicationExpertise` - Name of expertise

**Intelligence Expertises:**
- `repeating_intelligenceExpertises_[ID]_intelligenceExpertiseActive` - Checkbox if expertise is active
- `repeating_intelligenceExpertises_[ID]_intelligenceExpertise` - Name of expertise

**Focus Expertises:**
- `repeating_focusExpertises_[ID]_focusExpertiseActive` - Checkbox if expertise is active
- `repeating_focusExpertises_[ID]_focusExpertise` - Name of expertise

**Mobility Expertises:**
- `repeating_mobilityExpertises_[ID]_mobilityExpertiseActive` - Checkbox if expertise is active
- `repeating_mobilityExpertises_[ID]_mobilityExpertise` - Name of expertise

**Endurance Expertises:**
- `repeating_enduranceExpertises_[ID]_enduranceExpertiseActive` - Checkbox if expertise is active
- `repeating_enduranceExpertises_[ID]_enduranceExpertise` - Name of expertise

**Power Expertises:**
- `repeating_powerExpertises_[ID]_powerExpertiseActive` - Checkbox if expertise is active
- `repeating_powerExpertises_[ID]_powerExpertise` - Name of expertise

### Repeating Section: Attacks (Most Complex)
**Basic Attack Info:**
- `repeating_attacks_[ID]_AttackName` - Name of attack
- `repeating_attacks_[ID]_leftsub` - Short description
- `repeating_attacks_[ID]_AttackType` - Type (0=Melee AC, 1=Melee DG/CN, 2=Ranged, 3=Direct, 4=AOE, 5=AOE Direct)
- `repeating_attacks_[ID]_RollCN` - Roll type (0=OFF, 1=Resolve, 2=Stability, 3=Vitality)
- `repeating_attacks_[ID]_EffectType` - Effect type (0=None, 1=Disarm, 2=Grab, etc.)
- `repeating_attacks_[ID]_Hybrid` - Hybrid mode (0=OFF, 1=Damage→CN, 2=CN→Damage)

**Attack Properties (Numeric):**
- `repeating_attacks_[ID]_OverwhelmingAffliction`
- `repeating_attacks_[ID]_ArmorPiercing`
- `repeating_attacks_[ID]_Bleed`
- `repeating_attacks_[ID]_BossSlayer`
- `repeating_attacks_[ID]_Brutal`
- `repeating_attacks_[ID]_CaptainSlayer`
- `repeating_attacks_[ID]_ConditionCriticalRange`
- `repeating_attacks_[ID]_AccuracyCriticalRange`
- `repeating_attacks_[ID]_CriticalEffect`
- `repeating_attacks_[ID]_ConsistentEffect`
- `repeating_attacks_[ID]_CullingStrike`
- `repeating_attacks_[ID]_Cursed`
- `repeating_attacks_[ID]_EliteSlayer`
- `repeating_attacks_[ID]_EnhancedCondition`
- `repeating_attacks_[ID]_FinishingBlow`
- `repeating_attacks_[ID]_HighImpact`
- `repeating_attacks_[ID]_LastingCondition`
- `repeating_attacks_[ID]_MassEffect`
- `repeating_attacks_[ID]_MinionSlayer`
- `repeating_attacks_[ID]_Overhit`
- `repeating_attacks_[ID]_PowerfulCritical`
- `repeating_attacks_[ID]_ReliableAccuracy`
- `repeating_attacks_[ID]_ReliableEffect`
- `repeating_attacks_[ID]_ScatterShot`
- `repeating_attacks_[ID]_SplashDamage`
- `repeating_attacks_[ID]_Whirlwind`

**Attack String Modifiers:**
- `repeating_attacks_[ID]_AttackDetails` - Additional attack details
- `repeating_attacks_[ID]_AccuracyStringModifiers` - Text modifiers for accuracy
- `repeating_attacks_[ID]_DamageStringModifiers` - Text modifiers for damage  
- `repeating_attacks_[ID]_ConditionsStringModifiers` - Text modifiers for conditions

