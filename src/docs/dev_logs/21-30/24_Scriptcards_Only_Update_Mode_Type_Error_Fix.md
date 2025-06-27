# Phase 24: Scriptcards-Only Update Mode Type Error Fix

**Date:** 2025-06-27
**Status:** ✅ Completed
**Objective:** Fix critical type error in the new scriptcards-only update mode that prevented processing of indexed abilities.

---

## 1. Problem Analysis

The newly implemented scriptcards-only update mode (`python -m src.backend.main sync-scriptcards`) was failing with the error:

```
ERROR - Failed to extract abilities: argument of type 'int' is not iterable
```

### Root Cause

The character JSON files use a compressed abilities format where:
- `content` field contains an integer (0, 1, 2, etc.) representing an attack index
- `type` field is set to "indexed"
- The actual scriptcard content is referenced by index, not stored directly

However, the `_extract_abilities_only()` method was written assuming `content` would always be a string containing scriptcard text:

```python
# PROBLEMATIC CODE:
if 'content' in ability and '!scriptcard' in ability.get('content', ''):
```

When `ability.get('content', '')` returned an integer like `0`, Python threw "argument of type 'int' is not iterable" because the `in` operator cannot search for a substring within an integer.

### Character Data Structure Example
```json
{
  "name": "Bolt Pistol",
  "type": "indexed", 
  "content": 0,          // <- INTEGER, not string!
  "showInMacroBar": false,
  "isTokenAction": false
}
```

---

## 2. Solution Implemented

### Key Changes:
- **Added proper type checking** to handle both indexed and expanded ability formats
- **Enhanced logic** to process integer indices correctly
- **Maintained backward compatibility** with already-expanded abilities

```python
# FIXED CODE:
content = ability.get('content', '')
ability_type = ability.get('type', '')

# Handle both indexed and expanded ability formats
if isinstance(content, int) and ability_type == 'indexed':
    # Process indexed ability using the integer as attack index
    attack_index = str(content)
    new_content = new_template_content.replace('{number}', attack_index)
    
elif isinstance(content, str) and '!scriptcard' in content:
    # Process already-expanded scriptcard content
    # Extract index from existing content and replace
```

### Enhanced Processing Logic:
1. **Indexed Abilities (content is int)**: Use the integer directly as the attack index
2. **Expanded Abilities (content is string)**: Extract the index from existing scriptcard content
3. **Other Abilities**: Keep unchanged (non-scriptcard abilities)

---

## 3. Architectural Impact & Lessons Learned

- **Impact:** Fixed the critical blocking issue that prevented scriptcards-only updates from working at all

- **Lessons:** Always validate data types when working with JSON data structures, especially when the same field can contain different types (int vs string) depending on the processing state

- **New Pattern:** The fix establishes a robust pattern for handling both compressed and expanded ability formats, making the system more resilient to different data states

---

## 4. Files Modified

- `src/backend/character/updater.py` - Enhanced `_extract_abilities_only()` method with proper type checking and dual-format support

---

## 5. Testing Results

After the fix:
- ✅ Successfully processes indexed abilities (content as integer)
- ✅ Successfully processes expanded abilities (content as string) 
- ✅ Maintains backward compatibility
- ✅ Correctly replaces {number} placeholders with attack indices
- ✅ Updates abilities with new Neopunk 3.7.3 scriptcards template

The scriptcards-only update mode now works as intended, updating only the abilities section of characters while leaving all other character data untouched.