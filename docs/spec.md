## 2-3 Hour Fix Plan: Implement Complete Roll20 Specification

### **File 1: `src/backend/character/schema/roll20_schema.py`**
**Time: 45 minutes**
**Task: Add the missing 38+ fields**

```python
# ADD these missing field groups to the schema class:

# Defense Stats - Complete 4-field pattern for each
char_avoidance: str = "0"
display_avoidance: str = "0" 
char_avMod: str = "0"
char_avPrimaryAction: str = ""

char_durability: str = "0"
display_durability: str = "0"
char_drMod: str = "0" 
char_drPrimaryAction: str = ""

# Repeat for: resolve, stability, vitality (15 more fields)

# Combat Stats - Complete 4-field pattern for each  
char_movement: str = "0"
display_movement: str = "0"
char_movementMod: str = "0"
char_movementPrimaryAction: str = ""

# Repeat for: accuracy, damage, conditions, initiative (16 more fields)

# Core Attributes (7 fields - probably exist already)
# Archetype fields (7 fields - probably exist already)  
# Biography field (1 field - probably exists already)
```

**Action**: Copy every field from `roll20_character_sheet_attribute_list.md` sections:
- Core Stats (7 fields)
- Defense Stats (20 fields) 
- Combat Stats (20 fields)
- Archetype Fields (7 fields)
- Biography (1 field)

### **File 2: `src/backend/character/schema/schema_mapper.py`**
**Time: 90 minutes**
**Task: Implement mapping logic for all field patterns**

```python
def _map_calculated_stats(self, character_json: Dict[str, Any]) -> None:
    # Get base values
    tier = int(character_json.get("tier", 1))
    focus = int(character_json.get("attributes", {}).get("focus", 0))
    mobility = int(character_json.get("attributes", {}).get("mobility", 0))
    power = int(character_json.get("attributes", {}).get("power", 0))
    endurance = int(character_json.get("attributes", {}).get("endurance", 0))
    awareness = int(character_json.get("attributes", {}).get("awareness", 0))
    
    # Defense Stats - Calculate + Set 4-field pattern
    avoidance = 10 + tier + mobility
    self.schema.char_avoidance = str(avoidance)
    self.schema.display_avoidance = str(avoidance)  # Same as calculated
    self.schema.char_avMod = "0"  # Default modifier
    self.schema.char_avPrimaryAction = ""  # Default unchecked
    
    durability = tier + math.ceil(endurance * 1.5)
    self.schema.char_durability = str(durability)
    self.schema.display_durability = str(durability)
    self.schema.char_drMod = "0"
    self.schema.char_drPrimaryAction = ""
    
    # Repeat for ALL 5 defense stats
    # Repeat for ALL 5 combat stats
```

**Action**: Implement the 4-field pattern for each of the 12 stats using the formulas from the documentation.

### **File 3: Test Verification**
**Time: 15 minutes**
**Task: Verify Brother Rainard generates all fields**

```bash
# Run the conversion
python -m src.backend.main sync

# Check output has 48+ fields instead of 10
```

## **The Complete Implementation Checklist**

**Step 1**: Count fields in documentation (should be 48+)
**Step 2**: Update `roll20_schema.py` to define all 48+ fields  
**Step 3**: Update `schema_mapper.py` to populate all 48+ fields
**Step 4**: Test Brother Rainard conversion
**Step 5**: Verify output has 48+ fields with correct calculated values

## **Success Criteria**
- Brother Rainard conversion generates 48+ Roll20 fields
- All combat stats have proper calculated values (not zero)
- Character should be fully functional in Roll20

**This is mechanical implementation work. No debugging. No problem-solving. Just implement what's already documented.**