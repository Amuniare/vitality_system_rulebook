

# **docs/scriptcards-system.md**

```markdown
# ScriptCards System

Template compression and ability management system for Roll20 ScriptCards macros.

## Overview

The ScriptCards system manages large macro templates used for character attacks in Roll20. It provides compression for storage efficiency and expansion for runtime execution.

## Core Concept

**Problem**: ScriptCards attack macros are large (~26KB each) and mostly identical
**Solution**: Store master template once, compress abilities to just attack indices
**Result**: 99%+ compression ratio while maintaining full functionality

## System Architecture

```
Master Template (26KB)
    ↓ compression
Attack Index (2-3 chars)
    ↓ expansion  
Full ScriptCards Macro (26KB)
```

### **Template Structure**
```javascript
// Master template with placeholder
--Rbyindex|...;repeating_attacks;{number}

// Compressed ability (stored)
{ "type": "indexed", "content": 5 }

// Expanded ability (runtime)
--Rbyindex|...;repeating_attacks;5
```

## File Locations

### **Master Template**
- **Location**: `src/scriptcards/Scripcards Attacks Library Neopunk 3.7.3.txt`
- **Size**: ~26,000 characters
- **Format**: ScriptCards macro with `{number}` placeholder

### **Compressed Data**
```json
{
  "abilities": [
    {
      "name": "Attack Name",
      "type": "indexed",
      "content": 5,
      "showInMacroBar": true,
      "isTokenAction": false
    }
  ]
}
```

### **Expanded Data**
```json
{
  "abilities": [
    {
      "name": "Attack Name", 
      "content": "[full 26KB ScriptCards macro]",
      "showInMacroBar": true,
      "isTokenAction": false
    }
  ]
}
```

## ScriptCardsTemplateManager Class

### **Core Methods**

```python
from src.utils.scriptcards_templates import ScriptCardsTemplateManager

# Initialize
tm = ScriptCardsTemplateManager()

# Compress ability content
compressed = tm.compress_ability_content(
    ability_name="Attack Name",
    ability_content="[full scriptcards content]", 
    character_name="Character"
)

# Expand compressed ability
expanded = tm.expand_compressed_ability({
    "type": "indexed",
    "content": 5
})

# Get compression statistics
stats = tm.get_compression_stats()
```

### **Compression Process**
1. **Extract Attack Index**: Find `--Rbyindex|...;repeating_attacks;(\d+)` pattern
2. **Create Master Template**: Replace index with `{number}` placeholder
3. **Store Index Only**: Save just the attack index number
4. **Track Statistics**: Monitor compression ratios and success rates

### **Expansion Process**
1. **Load Master Template**: Read from ScriptCards file
2. **Replace Placeholder**: Substitute `{number}` with attack index
3. **Return Full Content**: Complete ScriptCards macro ready for Roll20

## Character Processing

### **During Extraction (Roll20 → JSON)**
```python
# Automatically compresses ScriptCards abilities
character_data = extract_character_data(character)
# abilities with type="indexed" and content=number
```

### **During Upload (JSON → Roll20)**
```python
# Automatically expands before upload
expanded_data = expand_character_abilities(character_data, template_manager)
# abilities with full ScriptCards content
```

## Template Management

### **Template Updates**
When ScriptCards template changes:
1. Update `src/scriptcards/Scripcards Attacks Library Neopunk 3.7.3.txt`
2. Run update script to regenerate all character abilities
3. All compressed abilities automatically use new template

### **Attack Index System**
- **Attack 0**: Base attack (character default)
- **Attack 1-N**: Special attacks in order created
- **Index Stability**: Indices should remain stable once assigned

## Performance Benefits

### **Storage Compression**
```
Original: 26,000+ characters per ability
Compressed: 1-2 characters per ability  
Savings: ~99%+ compression ratio
```

### **Network Transfer**
- Faster character uploads to Roll20
- Smaller JSON file sizes
- Reduced handout size limits

### **Maintenance**
- Single template update affects all characters
- Consistent macro behavior across characters
- Easier debugging and development

## Debugging

### **Compression Issues**
```python
# Check if ability was compressed
if ability_data.get("type") == "indexed":
    print(f"Compressed to index: {ability_data['content']}")
else:
    print("Not compressed (no attack index found)")
```

### **Expansion Issues**
```python
# Verify template loaded
tm = ScriptCardsTemplateManager()
if tm.scriptcards_template:
    print(f"Template loaded: {len(tm.scriptcards_template)} chars")
else:
    print("Template not found!")
```

### **Statistics Monitoring**
```python
stats = tm.get_compression_stats()
print(f"Success rate: {stats['success_rate']:.1%}")
print(f"Space saved: {stats['space_saved']:,} bytes")
print(f"Compression ratio: {stats['compression_ratio']:.3f}")
```

## Error Handling

### **Missing Template**
- **Fallback**: Abilities remain uncompressed
- **Warning**: Logged but non-fatal
- **Solution**: Ensure ScriptCards template file exists

### **Invalid Attack Index**
- **Detection**: Regex pattern matching
- **Fallback**: Store as full content
- **Logging**: Track compression failures

### **Expansion Failures**
- **Fallback**: Return original content
- **Safety**: Never lose ability data
- **Debugging**: Log expansion errors with details

## Template Sheet Handling

### **Excluded Characters**
- `MacroMule`: Template management character
- `ScriptCards_TemplateMule`: ScriptCards template storage
- **Behavior**: Always skip compression for these characters

### **Safety Measures**
- Template sheets never processed during compression
- Prevents corruption of master template data
- Maintains system integrity

## Future Enhancements

### **Planned Features**
- Multiple template support (different attack types)
- Template versioning and migration
- Automatic template validation
- Enhanced compression algorithms

### **Monitoring Tools**
- Compression ratio tracking over time
- Template usage statistics
- Performance impact analysis
- Automated health checks
```

---