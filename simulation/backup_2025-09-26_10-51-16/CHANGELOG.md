# CHANGELOG

## Version 2.6.0 - 2025-09-26 (Latest)

### Multi-Attack Balance Update

#### Cost Adjustments
- **Quick Strikes**: Reduced cost from 80p to 40p, reduced from 3 attacks to 2 attacks
  - *Rationale*: The 80p cost was prohibitively expensive, making this upgrade rarely viable. Reducing to 2 attacks with lower cost creates better balance.

- **Extra Attack**: Reduced cost from 70p to 40p
  - *Rationale*: 70p cost was too high for a conditional multi-attack that requires both hit and effect success.

#### New Upgrade Added
- **Barrage** (60p): Chain attacks where hit + effect on each attack enables the next attack
  - Up to 3 attacks total if all succeed
  - -Tier accuracy and damage penalty per attack
  - Cannot apply to AOE attacks
  - Must always attack the same target (if target dies, chain stops)
  - *Rationale*: Provides a middle ground between Quick Strikes (guaranteed multi-attack) and Extra Attack (conditional single extra attack).

#### Technical Implementation
- Modified `game_data.py`: Updated costs and added Barrage upgrade definition
- Modified `combat.py`: Updated Quick Strikes logic and implemented Barrage chain mechanics
- Updated `CLAUDE.md`: Documentation reflects new costs and mechanics

#### Prerequisites and Testing
- Double Tap and Powerful Critical testing already configured properly with Critical Accuracy prerequisites
- All multi-attack upgrades restricted to non-AOE attacks as intended
- Testing configurations support proper combination testing

## Version 2.5.0 - 2025-09-26

### Balance Adjustments

#### Limit Rebalancing
- **Unreliable 1**: Cost reduced from 30p to 20p, bonus reduced from +2×Tier to +Tier (accuracy and damage)
  - Rationale: Make entry-level unreliable limits more accessible while reducing power
- **Unreliable 2**: Bonus reduced from +4×Tier to +3×Tier (accuracy and damage), cost unchanged at 20p
  - Rationale: Maintain cost-effectiveness while reducing overwhelming power spikes
- **Unreliable 3**: Cost increased from 20p to 40p, bonus reduced from +8×Tier to +5×Tier (accuracy and damage)
  - Rationale: High-risk limits should have appropriate cost reflecting their potential impact
- **Steady**: Cost reduced from 40p to 20p, bonus reduced from +2×Tier to +Tier (accuracy and damage)
  - Rationale: Improve accessibility of turn-based limits while maintaining balance

#### Upgrade Cost Adjustments
- **Bleed**: Cost reduced from 40p to 20p
  - Rationale: Improve accessibility of condition-based combat strategy

## Version 2.4.0 - 2025-09-26

### Rule Balance Updates

#### Attack Type Changes
- **Area Attacks**: Now apply -Tier penalty to BOTH accuracy and damage (previously only accuracy)
  - Rationale: Reduce AOE dominance while maintaining tactical effectiveness
- **Direct Area Damage**: Penalty increased from -2×Tier to -3×Tier
  - Rationale: Balance direct damage attacks across single-target and area variants
- **Direct Damage Base**: Increased from 13 to 14 for both direct_damage and direct_area_damage
  - Rationale: Improve base power level of direct damage attacks

#### Upgrade Cost Changes
- **Quick Strikes**: Cost increased from 60p to 80p
  - Rationale: Premium upgrade due to powerful multi-attack capability
- **Brutal**: Cost reduced from 40p to 20p
  - Rationale: Improve accessibility of situational upgrade
- **Critical Accuracy**: Cost reduced from 30p to 20p
  - Rationale: Better point efficiency for critical hit builds

#### Limit Power Increases
All limit bonuses doubled or increased to improve risk/reward ratios:
- **Steady**: +Tier → +2×Tier to accuracy and damage (turn 4+)
- **Unreliable 1**: +Tier → +2×Tier to accuracy and damage (DC 5)
- **Unreliable 2**: +2×Tier → +4×Tier to accuracy and damage (DC 10)
- **Unreliable 3**: +4×Tier → +8×Tier to accuracy and damage (DC 15)
- **Finale**: +2×Tier → +3×Tier to accuracy and damage (turn 8+)

### Technical Implementation
- Updated `game_data.py` with new costs and limit multipliers
- Modified `combat.py` direct_area_damage calculation
- Added area damage penalty through AttackType damage_mod
- Updated `CLAUDE.md` specifications for consistency

### Impact Assessment
- Area attacks become more balanced between single-target and multi-target scenarios
- Quick Strikes becomes premium high-investment option
- Brutal and Critical Accuracy become more accessible
- All limits provide significantly more power, improving limit viability
- Direct area damage attacks receive appropriate power scaling