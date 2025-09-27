# Rogue Trader Project Instructions for Claude

## Project Overview

This is the **Vitality System - Rogue Trader Campaign Management** project, a comprehensive RPG system featuring:

- **Core System:** Custom Vitality System RPG rules with digital character builder
- **Active Campaign:** Ongoing Rogue Trader (Warhammer 40K) campaign management

---

## Project-Specific Context

**Campaign Materials Location:**
- `frontend/campaigns/rogue_trader/briefing` - Campaign content 
- `frontend/campaigns/rogue_trader/campaign_log` - Campaign content 
- `frontend/campaigns/rogue_trader/gm_only` - Campaign content 

**Key Campaign Elements:**
- Dynasty management and resources
- Multi-arc storyline with detailed scene breakdowns
- Rich NPC and faction systems
- Session summaries and player tracking


## Common Tasks

### 1. Character Data Workflow

**Primary Data Flow:**
```
Raw Character Concepts → JSON Templates → Character Builder → Roll20 Export
```

**Key Files:**
- `all_data/characters/testing/template.json` - Character template structure
- `frontend/campaigns/rogue_trader/gm_only/char_sheet_gen.md` - Character generation guidelines
- `frontend/rules/rulebook.md` - Complete Vitality System rules
s
### 2. Campaign Summary Generation

**Campaign Materials Location:**
- `all_data\rogue_trader\sessions\raw` - Session transcript 
- `frontend\campaigns\rogue_trader\campaign_log\session-summaries.md` - Session summaries 
- Review previous session summaries, and campaign content before creating a transcript summary

**GM vs Player Content:**
- `gm_only/` directories contain sensitive campaign information
- `briefing/` and `campaign_log/` contain player-visible content
- Maintain this separation strictly

### 3. Prestige Class Design

**Workflow:**
- Review the relevant sessions context, where the prestige was earned
- Review the other prestige abilities for template and context regarding what is permissible
- Reivew the rulebook to understand the system
- Present me with 3 custom combat abilities and 3 custom utility abilities


**Key Files:**
- `frontend\campaigns\rogue_trader\gm_only\prestige_classes.md` - Existing prestiges
- `frontend\campaigns\rogue_trader\campaign_log\session-summaries.md` - Session summaries 
- `frontend/rules/rulebook.md` - Complete Vitality System rules

### 4. Arc & Session Planning

**Planning Process:**
- Review current campaign state and player progression
- Analyze unresolved plot threads and faction dynamics
- Design encounter sequences with narrative flow
- Balance combat, exploration, and roleplay elements

**Key Files:**
- `frontend\campaigns\rogue_trader\campaign_log\session-summaries.md` - Previous session context
- `frontend\campaigns\rogue_trader\gm_only\` - GM-only campaign materials and faction notes
- `frontend\campaigns\rogue_trader\briefing\` - Player-accessible campaign information
- `all_data\rogue_trader\sessions\raw` - Session transcripts for continuity

**Planning Outputs:**
- Session outline with 3-5 scene breakdowns
- NPC preparation and faction status updates
- Encounter design with Vitality System mechanics
- Hook connections to ongoing story arcs


