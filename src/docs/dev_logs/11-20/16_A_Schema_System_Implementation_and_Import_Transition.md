# Phase 16A: Schema System Implementation and Import Transition

**Date:** 2025-06-19
**Status:** 🔄 In Progress  
**Objective:** Replace direct field mapping approach with schema-based system for Roll20 integration, ensuring data integrity and maintainability.

---

## 1. Problem Analysis

The existing direct mapping system suffered from critical data loss and maintainability issues. Brother Rainard testing revealed only ~60% data preservation due to incorrect field mappings and missing converters.

### Root Cause

The old system used ad-hoc direct field conversion without a unified schema:
- **Attack upgrades mapped to wrong fields:** Heavy_Strike → ArmorPiercing (should be HeavyStrike)
- **Missing data converters:** Talents, senses, main pool purchases not converted
- **No validation layer:** Data contract violations went undetected
- **Maintenance nightmare:** Conversion logic scattered across multiple files

---

## 2. Solution Implemented

Implemented complete schema-based approach with clean separation of concerns:

### Key Changes:

**Schema System (src/backend/character/schema/):**
- **roll20_schema.py:** Complete Roll20 character sheet definition with all fields
- **schema_mapper.py:** JSON→Schema converter with proper upgrade mapping  
- **schema_uploader.py:** Schema→Roll20 uploader with validation
- **schema_validator.py:** Comprehensive validation and conflict detection

**Data Flow Transformation:**
```
OLD: Web Builder JSON → Direct Field Mapping → Roll20 (60% data loss)
NEW: Web Builder JSON → Schema Mapper → Roll20 Schema → Roll20 Upload (95% preservation)
```

**Attack Upgrade Mapping Fixes:**
```python
# Correct mappings implemented:
"Heavy_Strike": "HeavyStrike",           # was: ArmorPiercing  
"Enhanced_Effect": "EnhancedEffect",     # was: ReliableEffect
"High_Impact": "HighImpact",             # was: Brutal
"Pounce": "Pounce",                      # was: missing
"Bully": "Bully",                        # was: missing
```

**Missing Data Converters Added:**
- Talents → Expertise repeating sections
- Senses → Features repeating sections
- Main pool purchases → Unique abilities
- Trait bonuses → Trait stat modifiers

**Validation Framework:**
- Schema validation before upload
- Attack upgrade conflict detection
- Data consistency checks across sections
- Brother Rainard test infrastructure

---

## 3. Current Status & Next Steps

**✅ Completed:**
- Complete schema system implementation
- All core files generated and ready
- Test infrastructure for Brother Rainard
- Template files and documentation

**❌ Current Issue:**
```
ModuleNotFoundError: No module named 'src.backend.character.mapper'
```

**🔄 Immediate Next Steps:**
1. Update main.py imports to use new schema system
2. Replace CharacterMapper references with SchemaMapper
3. Test Brother Rainard conversion with schema system
4. Validate 95% data preservation target

---

## 4. Impact Assessment

**Data Preservation:** 60% → 95% (estimated)
**Maintainability:** Significantly improved with single source of truth
**Debugging:** Clear separation enables easy troubleshooting
**Extensibility:** Easy to add new fields or upgrade types

**Files Modified:**
- ✅ Created: src/backend/character/schema/ (complete system)
- ✅ Removed: src/backend/character/mapper.py  
- ✅ Removed: src/backend/character/converters/
- ❌ Broken: src/backend/main.py (needs import updates)

---

## 5. Verification Plan

1. **Import Fix:** Update main.py to use SchemaMapper
2. **Brother Rainard Test:** Run conversion and validate all data preserved
3. **Field Mapping Verification:** Confirm HeavyStrike, Pounce, etc. correctly mapped
4. **Expertise Conversion:** Verify "Inspiring loyalty" → communication expertise
5. **Unique Abilities:** Confirm Shield appears in unique abilities section

