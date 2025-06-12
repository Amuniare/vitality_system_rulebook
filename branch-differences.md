# Branch Differences Analysis

This document lists all differences between local branches and the main branch.

## Branch Summary

**Local Branches Found:**
- `backup-branch`
- `backup-main` 
- `feature/refactor-ui-structure`
- `main` (current)

## Branch Comparisons

### 1. backup-branch vs main

**Status:** Contains 3 unique commits ahead of main

**Unique Commits:**
- `5d22486` - feat: Remove hardcoded token from transcriber configuration
- `c8f0062` - feat: Update .gitignore to include transcriber directory  
- `0afb285` - feat: Add stats analyzer for session transcripts with player mapping and engagement stats

**File Changes:**
- **Modified:** `.gitignore` - Changed `mutants` to `transcriber` in ignore list
- **Modified:** `README.md` - Removed "test" line from Testing section
- **Added:** `src/transcriber/mutants/session_tracker.json` - Session tracking data file

**Key Content:**
- Session tracker JSON with last_session: 16, total_sessions: 16
- Timestamp: 2025-06-11T22:30:14.893771+00:00

---

### 2. backup-main vs main

**Status:** Contains 2 unique commits ahead of main

**Unique Commits:**
- `c8f0062` - feat: Update .gitignore to include transcriber directory
- `0afb285` - feat: Add stats analyzer for session transcripts with player mapping and engagement stats

**File Changes:**
- **Modified:** `.gitignore` - Changed `mutants` to `transcriber` in ignore list
- **Modified:** `README.md` - Removed "test" line from Testing section  
- **Modified:** `src/transcriber/transcriber.py` - **⚠️ CONTAINS HARDCODED TOKEN**
- **Added:** `src/transcriber/mutants/session_tracker.json` - Session tracking data file

**Security Note:** The `backup-main` branch contains a hardcoded Discord token in `transcriber.py` that should not be committed.

---

### 3. feature/refactor-ui-structure vs main

**Status:** Contains deletions (files removed from main)

**Unique Commits:** None (no commits ahead of main)

**File Changes:**
- **Modified:** `.gitignore` - Changes to ignore patterns
- **Deleted:** Multiple transcriber-related files:
  - `src/transcriber/README_ai_processing.md`
  - `src/transcriber/ai_processors.py`
  - `src/transcriber/campaign_context.json`
  - `src/transcriber/processing_templates.json`
  - `src/transcriber/stats_analyzer.py`
  - `src/transcriber/test_ai_processing.py`
  - `src/transcriber/transcriber.py`

**Note:** This branch appears to be a cleanup branch that removes transcriber functionality from the main codebase.

## Summary

- **backup-branch**: Most complete version with transcriber features and security fix (token removed)
- **backup-main**: Similar to backup-branch but with security vulnerability (hardcoded token)
- **feature/refactor-ui-structure**: Cleanup branch that removes transcriber components entirely

## Recommendations

1. **Security:** Never merge `backup-main` due to hardcoded token
2. **Features:** `backup-branch` contains the cleanest implementation of transcriber features
3. **Cleanup:** `feature/refactor-ui-structure` may be intended for removing transcriber functionality entirely

## Files That Exist Only in Backup Branches

- `src/transcriber/mutants/session_tracker.json` - Session tracking data
- Various transcriber Python modules (removed in refactor branch)