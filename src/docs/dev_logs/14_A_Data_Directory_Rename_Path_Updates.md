# Phase 14-A: Data Directory Rename Path Updates

**Date:** 2025-01-17
**Status:** ✅ Completed
**Objective:** Update all hardcoded references from the old `data` folder to the renamed `all_data` folder across backend and transcriber modules.

---

## 1. Problem Analysis

The root-level `data` directory was renamed to `all_data`, but the Python modules in the `src` directory still contained hardcoded references to the old `data` folder name. This would cause runtime errors when the modules attempted to access directories that no longer existed.

### Root Cause

When the directory was renamed at the filesystem level, the corresponding string literals in the Python code were not updated to match the new folder structure.

---

## 2. Solution Implemented

Systematically identified and updated all hardcoded string references to the `data` folder across three Python modules, replacing them with `all_data` to match the new directory structure.

### Key Changes:
- **Backend Main Module:** Updated character input/output directory paths to use `all_data`
- **Stats Analyzer:** Fixed directory detection logic and campaign path construction 
- **Discord Transcriber:** Updated campaign directory path building

```python
# BEFORE: Hardcoded references to old directory
output_dir = Path("data") / "characters" / "extracted"
input_dir = Path("data") / "characters" / "input"
if (current_dir / "data").exists():
self.campaign_dir = base_dir / "data" / CAMPAIGN_NAME

# AFTER: Updated to use renamed directory
output_dir = Path("all_data") / "characters" / "extracted"
input_dir = Path("all_data") / "characters" / "input"
if (current_dir / "all_data").exists():
self.campaign_dir = base_dir / "all_data" / CAMPAIGN_NAME
```

---

## 3. Architectural Impact & Lessons Learned

- **Impact:** This change ensures all Python modules can correctly locate and access the data directories after the filesystem restructuring. No functional changes were made to the logic, only path string updates.

- **Lessons:** When renaming directories that are referenced in code, it's essential to perform a comprehensive search across all modules to identify hardcoded path references that need updating.

- **New Patterns:** N/A - This was a straightforward maintenance update to maintain consistency between filesystem structure and code references.

---

## 4. Files Modified

- `src/backend/main.py`
- `src/transcriber/stats_analyzer.py`
- `src/transcriber/discord_transcriber.py`
---