# Roll20 v6.0 Update - Quick Start Guide

**Status:** ✅ Implementation Complete - Ready for Testing
**Date:** 2025-10-01
**Version:** 6.0

---

## 📋 Quick Navigation

| Document | Size | Purpose |
|----------|------|---------|
| **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** | 14KB | **START HERE** - Overview of what was done |
| **[ROLL20_UPDATE_ROADMAP.md](ROLL20_UPDATE_ROADMAP.md)** | 48KB | Detailed roadmap with all changes and comparisons |
| **[SCRIPTCARDS_V6_IMPLEMENTATION_GUIDE.md](SCRIPTCARDS_V6_IMPLEMENTATION_GUIDE.md)** | 24KB | Step-by-step ScriptCards implementation |
| **[TESTING_CHECKLIST_V6.md](TESTING_CHECKLIST_V6.md)** | 28KB | 70+ test cases for validation |

---

## 🚀 Getting Started (5 Steps)

### 1. Read the Summary (10 min)
Open [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) to understand what changed.

### 2. Upload Character Sheet (10 min)
Upload `char_sheet_v6/rpgSheet_v6.0.html` to your Roll20 campaign.

### 3. Implement ScriptCards (4-6 hours)
Follow [SCRIPTCARDS_V6_IMPLEMENTATION_GUIDE.md](SCRIPTCARDS_V6_IMPLEMENTATION_GUIDE.md) section by section.

### 4. Test Everything (4-6 hours)
Work through [TESTING_CHECKLIST_V6.md](TESTING_CHECKLIST_V6.md) systematically.

### 5. Migrate Characters (optional)
Update existing characters using migration notes in the Roadmap.

---

## 📦 Deliverables

### ✅ Character Sheet v6.0
**File:** `char_sheet_v6/rpgSheet_v6.0.html`

**Changes:**
- New stat formulas (Avoidance, Movement, Durability, Damage)
- Removed Primary Action checkboxes
- Updated attack types (6 → 8)
- Updated conditions (11 → 7)
- Reorganized upgrades (removed 15, added 10)
- Added Limits system (35+ limits)
- Updated sheet workers

### ✅ ScriptCards Implementation Guide
**File:** `SCRIPTCARDS_V6_IMPLEMENTATION_GUIDE.md`

**Contents:**
- 7 implementation sections
- Old vs New code comparisons
- Testing recommendations
- Known challenges documented

### ✅ Comprehensive Documentation
- **Roadmap:** Complete rule changes with comparison tables
- **Testing Checklist:** 70+ test cases organized in 9 phases
- **Implementation Summary:** Executive overview
- **CLAUDE.md:** Directory structure guide

### ✅ Backups
- `char_sheet_v5.5_backup/` - Original character sheet
- `scriptcards_v5.5_backup/` - Original ScriptCards
- Original directories untouched

---

## ⚡ Key Changes At A Glance

### Core Stats
- **Avoidance:** 10+Tier+Mobility → **5+Tier+Mobility** (-5)
- **Movement:** max(Tier,6)+Mobility → **Mobility+(2×Tier)** (varies)
- **Durability:** Removed 1.5× multiplier (decrease)
- **Damage:** Removed 1.5× multiplier (decrease)
- **Primary Actions:** Removed entirely

### Combat System
- **Attack Types:** 6 → **8 types** (split Direct types)
- **Conditions:** 11 → **7 conditions** (simplified)
- **Upgrades:** 15 removed, 10 added, 12 updated
- **Limits:** Entirely new system (35+ limit types)

---

## 📊 Testing Status

**Pre-Testing:** ☐ Not Started
**Phase 1 (Core Stats):** ☐ Not Started
**Phase 2 (Attack Builder):** ☐ Not Started
**Phase 3 (Attack Types):** ☐ Not Started
**Phase 4 (Conditions):** ☐ Not Started
**Phase 5 (Upgrades):** ☐ Not Started
**Phase 6 (Limits):** ☐ Not Started
**Phase 7 (Integration):** ☐ Not Started
**Phase 8 (Migration):** ☐ Not Started
**Phase 9 (Performance):** ☐ Not Started

**Overall Status:** ☐ Pending

---

## 🔧 Rollback Plan

If issues occur:

1. Restore from `char_sheet_v5.5_backup/`
2. Restore from `scriptcards_v5.5_backup/`
3. Original files in `char_sheet/` and `scriptcards/` are unchanged

---

## ⏱️ Time Estimates

- **Documentation Review:** 1-2 hours
- **Character Sheet Upload:** 1 hour
- **ScriptCards Implementation:** 4-6 hours
- **Testing:** 4-6 hours
- **Migration (per character):** 1-2 hours

**Total:** 11-17 hours

---

## 🎯 Success Metrics

✅ Character sheet loads without errors
✅ Stats calculate correctly
✅ All 8 attack types work
✅ All 7 conditions apply
✅ Upgrades function properly
✅ Limits trigger correctly
✅ 90%+ test pass rate

---

## 📞 Support

**Documents:**
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Overview
- [ROLL20_UPDATE_ROADMAP.md](ROLL20_UPDATE_ROADMAP.md) - Details
- [SCRIPTCARDS_V6_IMPLEMENTATION_GUIDE.md](SCRIPTCARDS_V6_IMPLEMENTATION_GUIDE.md) - Implementation
- [TESTING_CHECKLIST_V6.md](TESTING_CHECKLIST_V6.md) - Testing

**Rollback:**
- `char_sheet_v5.5_backup/` - Original sheet
- `scriptcards_v5.5_backup/` - Original ScriptCards

---

## ✅ Implementation Checklist

### Pre-Implementation
- [X] Backups created
- [X] Character sheet updated
- [X] Documentation created
- [ ] Documentation reviewed

### Your Tasks
- [ ] Read IMPLEMENTATION_SUMMARY.md
- [ ] Upload character sheet to Roll20
- [ ] Implement ScriptCards updates
- [ ] Run testing checklist
- [ ] Migrate existing characters (optional)

---

**Ready to begin? Start with [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)**
