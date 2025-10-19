# CHANGELOG

## 2025-10-19 - Balance Update

### Cost Reductions
- **Unreliable 1**: Reduced from 2p to 1p
- **Explosive Critical**: Reduced from 2p to 1p
- **Patient**: Reduced from 3p to 1p
- **Finale**: Reduced from 2p to 1p



### Base Damage Increase
- **Direct Damage**: Base damage increased from 11 to 12
- **Direct Area Damage**: Base damage increased from 11 to 12

### Bonus Adjustments
- **Patient**: Reduced from +2×Tier to +1×Tier
- **Finale**: Reduced from +3×Tier to +2×Tier
- **Timid**: Reduced from +3×Tier to +2×Tier

### Turn Requirement Changes
- **Patient**: Now activates on Turn 4+ (previously Turn 5+)
- **Finale**: Now activates on Turn 7+ (previously Turn 8+)

### Compatibility Rules
- **Quickdraw**: Added mutual exclusions with:
  - Charges 1
  - Charges 2
  - Combo Move
  - Relentless
  - Slaughter
- **Careful**: Added mutual exclusions with:
  - Untouchable
  - Unbreakable
  - Revenge
  - Vengeful

### Files Updated
- `src/game_data.py`: Updated costs, bonuses, direct_area_damage base, and MUTUAL_EXCLUSIONS
- `src/combat.py`: Updated turn requirement checks for Patient and Finale
- `RULES.md`: Updated all upgrade/limit costs, bonuses, turn requirements, and restriction documentation
- `CHANGELOG.md`: Documented all changes
- `verify_rules.py`: Updated expected costs, bonuses, and validations
