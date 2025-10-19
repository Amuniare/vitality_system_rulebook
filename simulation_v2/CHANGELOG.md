# Changelog

All notable changes to the Vitality System Simulation V2 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2025-10-19] - Direct Damage Formula Update

### Changed
- **Direct damage base values updated for game balance**:
  - `direct_damage`: Base damage increased to **10 flat** (no tier scaling)
    - Formula: `10 + flat_bonuses` (tier, power, upgrades, limits, slayer)
  - `direct_area_damage`: Base damage increased to **10**, formula is now **10 - Tier**
    - Formula: `(10 - Tier) + flat_bonuses`
- **Rationale**: Adjusted for better game balance and clearer damage progression across tiers

### Technical Details
- Modified `src/game_data.py:15-16` - Updated `direct_damage_base` from 8 to 10 for both attack types
- Modified `verify_rules.py` - Updated test assertions to match new base values
- Updated all documentation files (README.md, RULES.md, rulebook.md) to reflect new formulas

---

## [2025-10-19] - Direct Damage Fixes

### Fixed
- **CRITICAL BUG**: Direct damage attacks were not receiving flat bonuses (power, upgrades, limits, slayer bonuses, tier bonuses)
  - Direct attacks now properly calculate: `base_damage + flat_bonus + slayer_bonus + tier_bonus`
  - This caused `direct_damage` and `direct_area_damage` to be severely underpowered and non-competitive
  - After fix, direct attacks now appear in top builds (46.8% of top 1000 for `direct_damage`, 2.8% for `direct_area_damage`)

### Changed
- **Direct damage formulas updated**:
  - `direct_damage`: 13 flat → **13 - Tier** (now scales with tier)
  - `direct_area_damage`: 13 - Tier → **13 - 2×Tier** (now scales 2x with tier)

### Added
- **Attack type restrictions for direct attacks** (17 upgrades now restricted):
  - Cannot use accuracy modifiers: `power_attack`, `accurate_attack`, `reliable_accuracy`, `overhit`, all `slayer_acc` upgrades
  - Cannot use dice modifiers: `high_impact`, `critical_effect`
  - Cannot use critical effects: `critical_accuracy`, `powerful_critical`, `explosive_critical`, `double_tap`, `ricochet`, `splinter`
  - Cannot use special mechanics: `armor_piercing`, `combo_move`
  - Rationale: Direct attacks auto-hit and use flat damage (no accuracy rolls, no dice, no crits)
  - Result: Build count reduced by 43-45%, eliminating all invalid combinations

### Technical Details
- Modified `src/combat.py:560-718` - Restructured damage calculation to compute flat bonuses for both direct and dice-based attacks
- Modified `src/game_data.py:15-16` - Updated direct damage base values
- Modified `src/game_data.py:109-135` - Added comprehensive attack type restrictions
- Updated `RULES.md` - Added Direct Attack Restrictions section
- Updated `README.md` - Clarified direct attack mechanics and restrictions

### Impact
- Direct attacks are now competitive and properly balanced
- `direct_area_damage` with limit-based builds now ranks #1 overall (5.85 avg turns for tier 4)
- Simulation accuracy improved by eliminating ~80,000+ invalid build combinations
