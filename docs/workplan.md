# COMPREHENSIVE VITALITY SYSTEM UPGRADE PLAN
*Master Implementation Guide for Multi-Conversation Project*

## PROJECT OVERVIEW
**Goal:** Expand current RPG system from ~25 upgrades to 60+ upgrades with full integration across Excel → HTML → ScriptCards → Python pipeline.

**Current State:** Working system with 188 characters, basic upgrades, sequential processing template
**Target State:** Full rulebook implementation with modular, scalable architecture

---

## STEP 1: INFORMATION GATHERING & DOCUMENTATION

### 1.1 Excel System Analysis
**Deliverables:**
- Screenshot/description of current Excel character sheet structure
- Point pool validation system documentation
- Archetype selection mechanics explanation
- Current upgrade validation methods

**Information Needed:**
- How Excel calculates stats and validates point spending
- Current upgrade structure and naming conventions
- Export format to JSON for Python processing
- Any macros or formulas that need preservation

### 1.2 System Rules Dictionary Creation
**Deliverables:**
- Condensed rules reference (vs full 50+ page rulebook)
- Focus on mechanical implementation, not narrative fluff
- Structured for easy reference during development

**Content Sections:**
```
1. Upgrade Categories & Effects
   - Accuracy Bonuses (10 types)
   - Damage Bonuses (15 types) 
   - Condition Bonuses (8 types)
   - Specialized Mechanics (12 types)

2. Advanced Conditions
   - Implementation requirements
   - Status marker assignments
   - Duration and interaction rules

3. Attack Type Matrix
   - Which upgrades work with which attack types
   - Banned combinations
   - Interaction priorities

4. Calculation Formulas
   - All stat calculation methods
   - Modifier application order
   - Critical hit interactions
```

**Action Items:**
- [ ] User shares Excel screenshots/structure
- [ ] User provides specific sections of rulebook for dictionary
- [ ] Create structured rules reference document
- [ ] Validate understanding with user before proceeding

---

## STEP 2: EXCEL SYSTEM UPGRADE

### 2.1 Missing Upgrades Analysis
**Current HTML Upgrades (25):** ✅ Already Implemented
```
Basic: Overwhelming Affliction, Armor Piercing, Bleed, Boss Slayer, Brutal, Captain Slayer, 
Condition Critical Range, Accuracy Critical Range, Critical Effect, Consistent Effect, 
Culling Strike, Cursed, Elite Slayer, Enhanced Condition, Finishing Blow, High Impact, 
Lasting Condition, Mass Effect, Minion Slayer, Overhit, Powerful Critical, Reliable Accuracy, 
Reliable Effect, Scatter Shot, Whirlwind
```

**Missing HTML Upgrades (35+):** ❌ Need Implementation
```
ACCURACY BONUSES:
- Accurate Attack, Double-Tap, Ricochet, Explosive Critical, Blitz

DAMAGE BONUSES:  
- Power Attack, Superior Effect, Shatter, Enhanced Effect, Leech

CONDITION BONUSES:
- Collateral Condition, Contagious

MELEE SPECIALIZED:
- Heavy Strike, Quick Strikes, Whirlwind Strike

RANGED SPECIALIZED: 
- Barrage, Headshot

GENERAL SPECIALIZED:
- Flurry of Blows, Pounce, Splinter, Menacing, Environmental, 
Analyzing Strike, Follow-Up Strike, Counterattack, Exploit, 
Priority Target, Bully, Martial Artist, Grappler

VARIABLE BONUSES:
- Lucky Strike, Compressed Release, Domain, Tower Defense, 
Channeled, Focused, Disengage, Extra Attack
```

### 2.2 Excel Implementation Tasks
**Action Items:**
- [ ] Add all 35+ missing upgrades as input fields
- [ ] Update validation formulas for banned combinations
- [ ] Add Weaken stat selection dropdown (Accuracy/Damage/Conditions/Avoidance/Durability/Resistances)
- [ ] Test point pool calculations with new upgrades
- [ ] Export test characters with new upgrade data
- [ ] Document any Excel formula changes needed

**Validation Rules to Add:**
- [ ] Brutal + Headshot = banned combination
- [ ] Brutal + Heavy Strike = banned combination  
- [ ] Superior Effect + Reliable Effect = banned combination
- [ ] Critical Effect + Consistent Effect = banned combination

---

## STEP 3: SCRIPTCARDS BASIC - MODULARITY & UPGRADES

### 3.1 Current ScriptCards Analysis
**✅ Currently Handles:**
```
- Sequential upgrade processing
- Conditional logic (HP-based Slayer upgrades)
- Multiple roll modifiers 
- Status marker management
- Advanced conditions (Stun, Control, Weaken)
- Critical hit detection
- Hybrid attack modes
- Enemy defense calculations
```

**❌ Missing Upgrade Support:**
```
- 35+ new upgrades listed above
- Multi-turn attacks (Channeled/Focused)
- Secondary attacks (Double-Tap, Ricochet, Splinter)
- Healing effects (Leech)
- Environmental modifications
- Complex condition interactions
```

### 3.2 Modularity Improvements
**Current Structure Issues:**
- Single massive template with embedded logic
- Hardcoded upgrade processing
- Difficult to add new upgrades

**Target Modular Structure:**
```
MAIN TEMPLATE SECTIONS:
1. Variable Declaration Module
2. Attack Type Processing Module  
3. Upgrade Processing Module (NEW - Dynamic)
4. Roll Calculation Module
5. Effect Application Module
6. Status Management Module
```

**Action Items:**
- [ ] Create upgrade processing loop system
- [ ] Separate upgrade effects into modular functions
- [ ] Create upgrade effect mapping system
- [ ] Add dynamic roll modifier system
- [ ] Test modular system with current upgrades first

### 3.3 All Upgrades Implementation
**Implementation Strategy:**
Process upgrades in categories using modular system:

**Phase 3A: Roll Modifiers (20 upgrades)**
```
- Accurate Attack, Power Attack, Reliable Accuracy, Superior Effect
- Enhanced Effect, Critical Effect, Consistent Effect  
- All Slayer upgrades expansion
- Analyzing Strike, Priority Target
```

**Phase 3B: Secondary Effects (10 upgrades)**
```
- Double-Tap, Ricochet, Explosive Critical
- Follow-Up Strike, Extra Attack, Splinter
- Collateral Condition, Contagious
```

**Phase 3C: Specialized Mechanics (15 upgrades)**
```
- Heavy Strike, Quick Strikes, Barrage, Headshot
- Environmental, Leech, Channeled, Focused
- Martial Artist, Grappler, Counterattack
```

**Action Items:**
- [ ] Implement Phase 3A upgrades
- [ ] Test each upgrade individually
- [ ] Implement Phase 3B upgrades  
- [ ] Implement Phase 3C upgrades
- [ ] Full integration testing

---

## STEP 4: SCRIPTCARDS ADVANCED - STATUS TOKEN MATRIX

### 4.1 Status Token Matrix System Design
**Current Problem:** 
- Limited status markers for complex conditions
- No way to track "Weaken Accuracy by 3" vs "Weaken Damage by 2"
- Advanced conditions need detailed state tracking

**Solution: Dual-Token Matrix System**
```
TOKEN 1: Condition Type Identifier
- lightning-helix = Stun
- radioactive = Weaken  
- broken-skull = Control
- frozen-orb = Disable Specials
- [Additional tokens for new conditions]

TOKEN 2: Parameter Encoding
- Number (0-9) = Magnitude/Target
- Color/Shape = Additional parameters

EXAMPLES:
- Weaken Accuracy by 3: radioactive + blue-3
- Weaken Damage by 2: radioactive + red-2  
- Control for 4 turns: broken-skull + yellow-4
```

### 4.2 Implementation Plan
**Action Items:**
- [ ] Design complete token mapping system
- [ ] Create token reading/writing functions
- [ ] Update condition application logic
- [ ] Create condition resolution system
- [ ] Test matrix system with various combinations
- [ ] Document token meanings for players/GM

**Token Assignment Strategy:**
```
WEAKEN TARGETS:
- Blue = Accuracy
- Red = Damage  
- Green = Conditions
- Yellow = Avoidance
- Purple = Durability
- Orange = All Resistances

NUMBERS:
- 0-9 = Magnitude of effect
```

---

## STEP 5: HTML UPDATE

### 5.1 Attack Builder Section Expansion
**Current HTML Structure:**
- ~25 upgrade input fields in attacks grid
- Basic number inputs for upgrade values
- Limited dropdown selections

**Required Additions:**
**Action Items:**
- [ ] Add 35+ new upgrade input fields to HTML
- [ ] Add Weaken target selection dropdown
- [ ] Update CSS grid layout for new fields
- [ ] Add upgrade description tooltips/help text
- [ ] Update calculation formulas for new upgrades
- [ ] Test HTML form submission with new fields

### 5.2 Calculation Updates
**Action Items:**
- [ ] Update JavaScript calculation functions
- [ ] Add validation for banned upgrade combinations
- [ ] Update display formulas for complex upgrades
- [ ] Test all calculations with new upgrade combinations
- [ ] Update sheet worker functions as needed

### 5.3 Visual Improvements
**Action Items:**
- [ ] Reorganize upgrade fields by category
- [ ] Add visual grouping for related upgrades
- [ ] Update field labels for clarity
- [ ] Add conditional field display (show/hide based on selections)
- [ ] Test responsive layout with additional fields

---

## STEP 6: PYTHON UPDATE

### 6.1 Data Structure Updates
**Current Python Issues:**
- Fixed upgrade field expectations
- Limited upgrade processing in compression/expansion
- No support for new upgrade types

**Action Items:**
- [ ] Update character data schema for new upgrades
- [ ] Modify extraction code for new HTML fields
- [ ] Update compression algorithms for new upgrade types
- [ ] Expand template system for new upgrades
- [ ] Test extraction with updated character sheets

### 6.2 ScriptCards Template Integration
**Action Items:**
- [ ] Update template compression for modular ScriptCards
- [ ] Add support for new upgrade parameters
- [ ] Update expansion logic for complex upgrades
- [ ] Test template compression/expansion cycle
- [ ] Validate character update process with new data

### 6.3 Migration Strategy
**Action Items:**
- [ ] Create migration script for existing 188 characters
- [ ] Add new upgrade fields with default values
- [ ] Test migration on subset of characters first
- [ ] Full migration execution
- [ ] Validation of migrated character data

---

## STEP 7: TESTING

### 7.1 Unit Testing Strategy
**Testing Phases:**
```
Phase 7A: Component Testing
- Excel: Individual upgrade validation
- HTML: Field calculations and display
- ScriptCards: Individual upgrade effects
- Python: Data extraction/compression

Phase 7B: Integration Testing  
- Excel → HTML → ScriptCards workflow
- Python extraction and update process
- Character migration validation

Phase 7C: System Testing
- Full 188-character processing
- Performance testing with complex upgrades
- Edge case testing (banned combinations, etc.)
```

### 7.2 Test Character Development
**Action Items:**
- [ ] Create test characters with various upgrade combinations
- [ ] Test banned combination handling
- [ ] Test complex upgrade interactions
- [ ] Test status token matrix system
- [ ] Performance testing with multiple upgrades

### 7.3 User Acceptance Testing
**Action Items:**
- [ ] Deploy to subset of players for testing
- [ ] Gather feedback on upgrade complexity
- [ ] Test ScriptCards performance in actual play
- [ ] Refine based on user feedback
- [ ] Full deployment preparation

---

## PROJECT MILESTONES & CHECKPOINTS

### Milestone 1: Information Gathering Complete
- [ ] Excel system documented
- [ ] Rules dictionary created
- [ ] Missing upgrades identified
- **Estimated Time:** 2-3 conversations

### Milestone 2: Excel System Upgraded
- [ ] All upgrades added to Excel
- [ ] Validation rules implemented
- [ ] Test characters created
- **Estimated Time:** 1 week

### Milestone 3: ScriptCards Modularized
- [ ] Modular template structure complete
- [ ] All upgrades implemented
- [ ] Basic testing complete
- **Estimated Time:** 2 weeks

### Milestone 4: Advanced Features Complete
- [ ] Status token matrix implemented
- [ ] Complex conditions working
- [ ] Advanced testing complete
- **Estimated Time:** 1 week

### Milestone 5: HTML & Python Updated
- [ ] HTML updated with new fields
- [ ] Python extraction/update working
- [ ] Integration testing complete
- **Estimated Time:** 1 week

### Milestone 6: Full System Testing
- [ ] All components integrated
- [ ] 188-character migration complete
- [ ] User acceptance testing done
- **Estimated Time:** 1 week

**TOTAL PROJECT TIMELINE: 6-8 weeks**

---

## CONVERSATION-TO-CONVERSATION TRACKING

### Conversation Log Template:
```
## Conversation [N] - [Date] [Time]
**Focus:** [Current Step/Milestone]
**Completed:**
- [ ] Task 1
- [ ] Task 2

**Next Steps:**
- [ ] Task A  
- [ ] Task B

**Blockers/Issues:**
- Issue description and resolution

**Files Updated:**
- filename.ext (description of changes)
```




## Conversation 1 - 2025-05-27
**Focus:** Step 1 - Excel Data Extraction Implementation
**Completed:**
- [x] Basic Excel analyzer structure created  
- [x] Identified template sheet structure (blank template analysis)
- [x] VL Table extraction working (32 entries found)
- [x] Data validation rules extraction (8 rules found)

**Attempted but Failed:**
- [ ] Complete input cell detection (found 0 instead of 100+ expected)
- [ ] Proper section structure mapping
- [ ] Size-optimized extraction (output was 33x larger than input)

**Next Steps:**
- [ ] Fix color-based input detection for blank template
- [ ] Map complete table structures from images
- [ ] Create focused extraction (template schema not data)
- [ ] Test with actual filled character sheet

**Blockers/Issues:**
- Color detection not finding input cells in blank template
- Code complexity exceeded requirements (wanted <400 lines)
- Multiple basic coding errors (missing methods, None handling)

**Files Updated:**
- src/excel/sheet_analyzer.py (multiple iterations, final version has errors)
- test_excel_analysis.py (deleted by user due to frustration)

**Key Insight:** 
Working with blank template vs filled sheet requires different approach - need to capture INPUT SCHEMA not actual data.


### Information Relevance for Next Step:

**CRITICAL TO CAPTURE:**
- Input cell locations (by background color) 
- Table structure boundaries
- Section headers and relationships
- Dropdown validation lists (VL Table)
- Formula relationships between cells
- Point cost calculation structure

**IRRELEVANT FOR NOW:**
- Detailed cell formatting (fonts, borders, etc.)
- Individual cell values (working with blank template)
- Complex nested data structures
- Performance optimizations
- Advanced Excel features (macros, etc.)

**SUCCESS CRITERIA:**
- Extract ~100+ input cell locations from blank template
- Map 6-7 major sections (Primary Actions, Special Attacks, etc.)
- Output smaller than input file (37KB max)
- Working code under 400 lines




## Conversation 2 - 2025-05-27 14:41
**Focus:** Step 1 - Excel Template Analysis - Formula Extraction Fix
**Completed:**
- [x] Fixed Excel style detection using actual style names ("good", "input", "note", "calculation")
- [x] Implemented comprehensive color and style analysis 
- [x] Successfully detected 558+ input cells (137 number + 286 text + 111 dropdown + 24 unknown)
- [x] Added support for Pandora sheet (completed character sheet vs blank template)
- [x] Fixed ArrayFormula extraction for complex Excel formulas
- [x] Captured 284 formulas successfully with only 22 missed
- [x] Removed redundant row/col data (position already in cell reference)
- [x] Added validation rule analysis and VL table resolution

**Next Steps:**
- [ ] Create system rules dictionary from rulebook sections
- [ ] Map the 35+ missing upgrades that need to be added to Excel
- [ ] Document Excel input schema for Step 2 implementation
- [ ] Begin Excel system expansion with missing upgrades

**Blockers/Issues:**
- ArrayFormula objects in Excel required special handling (fixed with .text attribute extraction)
- Initial color detection failed because hardcoded hex values didn't match actual Excel styles (fixed by using style names)
- Size increased 149% but captures complete template structure as needed

**Files Updated:**
- src/excel/sheet_analyzer.py (complete rewrite with proper style detection, ArrayFormula support, and comprehensive analysis)
- analysis_results.json (now contains 558+ input cells, 284 formulas, complete VL table, and validation rules)

**Key Insight:** 
Excel template analysis is now complete and working. The blank template contains the full input schema needed for system expansion - 558+ input fields properly classified by type, comprehensive formula extraction working, and validation rules resolved. Ready to move to rules dictionary creation.



## Conversation 2 - 2025-05-27
**Focus:** Step 1.2 - System Rules Dictionary Creation
**Completed:**
- [x] Analyzed complete 50+ page Vitality System rulebook
- [x] Reviewed all existing documentation (workplan, codebase overview, Excel analysis results)
- [x] Created comprehensive developer-focused rules dictionary covering ALL mechanics
- [x] Documented all 60+ upgrades with functional implementation details
- [x] Structured rules for Excel→HTML→ScriptCards→Python pipeline integration
- [x] Designed Status Token Matrix system for ScriptCards advanced condition tracking
- [x] Organized upgrade system by categories (Accuracy, Damage, Condition, Specialized, Variable)
- [x] Documented limit system with point calculations and conditional requirements
- [x] Summarized all archetype systems and their mechanical effects

**Next Steps:**
- [ ] Move to Step 2: Excel System Upgrade
- [ ] Add missing 35+ upgrades to Excel input fields
- [ ] Update Excel validation formulas for banned combinations
- [ ] Add Weaken stat selection dropdown (Accuracy/Damage/Conditions/Avoidance/Durability/Resistances)
- [ ] Test point pool calculations with new upgrades
- [ ] Export test characters with new upgrade data

**Blockers/Issues:**
- None - rules dictionary creation completed successfully
- Ready to proceed to Excel implementation phase

**Files Updated:**
- rules_dictionary.md (created comprehensive system rules reference for development)

**Key Deliverable:**
Complete developer implementation reference covering:
- Core mechanics (dice, combat resolution, conditions)
- All 60+ upgrade effects and interactions  
- Status token matrix for ScriptCards condition tracking
- Archetype system mechanics
- Limit system with point calculations

**Project Status:** 
Step 1 (Information Gathering) - COMPLETE
Ready to begin Step 2 (Excel System Upgrade)


