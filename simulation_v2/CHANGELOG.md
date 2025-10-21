# Changelog

## 2025-10-21 (CRITICAL: Dual Natured Limit Activation Bug Fix)

### Critical Bug Fix: charge_up, charge_up_2, slaughter Completely Broken in dual_natured Archetype

**The Problem**:
- **charge_up/charge_up_2**: NEVER charged in dual_natured builds - always switched to fallback attack instead
- **slaughter**: Could NOT activate in dual_natured builds - switched to fallback before defeating enemies
- **Other conditional limits**: Likely underperforming in dual_natured due to premature fallback switching

**Root Cause**:
The dual_natured archetype used `can_activate_limit()` to determine whether to use primary or fallback build. When a limit condition wasn't met (e.g., charge_up needs to charge), `can_activate_limit()` returned False, causing the code to switch to fallback instead of using the primary build that would handle charging/conditional activation.

**Location**: [simulation.py:285-323](simulation.py#L285-L323)

**The Fix**:
Replaced the `can_activate_limit()` check with a test attack using `make_attack()`, matching the pattern used by versatile_master archetype:

```python
# OLD (BROKEN) CODE:
can_use_primary = all(
    can_activate_limit(limit, turns, ...) for limit in primary_build.limits
)
if can_use_primary:
    # Use primary
else:
    # Use fallback  ← BUG: switches to fallback when charging needed!

# NEW (FIXED) CODE:
test_damage, test_conditions, _ = make_attack(
    attacker, defender, primary_build, ...
)
if test_damage == 0 and 'charge' in test_conditions:
    # Primary needs to charge - use it  ← Now charges correctly!
elif test_damage > 0 or len(test_conditions) > 0:
    # Primary can attack - compare expected damage
else:
    # Primary failed completely - use fallback
```

**Impact**:
- **charge_up/charge_up_2**: Now properly charge in dual_natured builds (verified: 4 charges/8 charges detected in test)
- **slaughter**: Can now activate after defeating first enemy in dual_natured builds (verified: primary used 16/16 turns)
- **Other conditional limits**: Should perform significantly better in dual_natured archetype

**Why Other Archetypes Weren't Affected**:
- **focused**: Goes straight to `make_attack()`, which correctly returns 'charge' condition
- **versatile_master**: Already had correct logic checking for 'charge' in test_conditions

**Test Coverage**:
Added `test_charge_fix.py` to verify charge_up, charge_up_2, and slaughter work correctly in dual_natured archetype.

**Expected Result**:
These limits should now appear in top 1000 builds for dual_natured archetype. Previous 0% saturation was caused by complete non-functionality, not balance issues.

## 2025-10-21 (Unbreakable Bug Fix + Charge/Slaughter Rebalance)

### Critical Bug Fix: Unbreakable Limit
- **Fixed**: `was_hit_no_damage_last_turn` was never set to True, causing unbreakable to never activate
- **Changes**:
  - Modified `make_attack()` to return hit status: `(damage, conditions, did_hit)`
  - Simulation now tracks defender hits separately from damage dealt
  - Properly sets `was_hit_no_damage_last_turn = True` when attack hits but durability absorbs all damage
- **Impact**: Unbreakable can now properly activate with its +6×Tier bonus when hit without taking damage

### Slaughter Mechanic Change
- **slaughter**: Changed activation from "defeated enemy last turn" to **"defeated enemy this turn"**
- **Rationale**: Previous mechanic required defeating an enemy on one turn to boost attacks on the NEXT turn. This made it only useful in prolonged multi-enemy fights and useless after the final kill. New mechanic allows slaughter to activate on subsequent attacks within the SAME turn after defeating an enemy, making it viable with multi-attack builds and splash damage.
- **Implementation**: Tracks `defeated_enemy_this_turn` flag that resets each turn and activates after first kill

### Charge Limit Cost Reductions
- **charge_up**: Reduced cost from 3p to **2p** (kept +4×Tier bonus)
- **charge_up_2**: Reduced cost from 2p to **1p** (kept +5×Tier bonus)
- **Rationale**: Mathematical analysis showed charge limits had poor value proposition - losing turns to charge provided minimal net benefit. Cost reduction makes them competitive with other limits while maintaining the high-risk/high-reward setup mechanic.

### Defender Attack Scaling
- **Changed**: Defenders now make 0-3 attacks per turn based on alive enemy count
  - 1 enemy: 1 attack
  - 2 enemies: 2 attacks
  - 3+ enemies: 3 attacks (max)
- **Rationale**: Makes multi-enemy scenarios more challenging and realistic, especially benefits HP-threshold limits (bloodied, near_death) and conditional limits (unbreakable, revenge, vengeful)

## 2025-10-21 (Low-Saturation Limits Power Increase)

### Power Increases for Underperforming Limits

Based on saturation analysis showing these limits had 0% appearance in top builds, increased tier bonuses by +1×Tier each:

- **bloodied**: +2×Tier → **+3×Tier**
- **charge_up**: +3×Tier → **+4×Tier**
- **charge_up_2**: +4×Tier → **+5×Tier**
- **near_death**: +4×Tier → **+5×Tier**
- **slaughter**: +5×Tier → **+6×Tier**
- **timid**: +2×Tier → **+3×Tier**
- **unbreakable**: +5×Tier → **+6×Tier**

**Rationale**: Saturation analysis revealed these 7 limits had 0% appearance across all top builds (Top 10, 50, 100, 200, 500, 1000), indicating severe underperformance despite recent rebalancing efforts. While their conditions are restrictive, they were providing insufficient reward to justify inclusion in competitive builds. Increasing each by +1×Tier provides a uniform boost to bring them into viability:

- **HP-Based Limits** (bloodied, near_death, timid): Now provide stronger rewards for their risky HP thresholds. Bloodied and timid reach +3×Tier (+12 at tier 4) for moderate conditions, while near_death reaches +5×Tier (+20 at tier 4) for critical wounding.

- **Charge Limits** (charge_up, charge_up_2): Now reward the setup time investment more generously. Charge_up provides +4×Tier (+16 at tier 4) for 1-turn setup, while charge_up_2 provides +5×Tier (+20 at tier 4) for 2-turn setup.

- **Extreme Conditional Limits** (slaughter, unbreakable): Now reach +6×Tier (+24 at tier 4), making them the highest-power limits in the game. This exceptional power is justified by their extremely restrictive conditions - slaughter requires defeating enemies consistently, unbreakable requires being hit without taking damage.

This uniform +1×Tier increase maintains relative power balance between limits while elevating their absolute power to competitive levels. Further tuning may be needed based on updated saturation data.

## 2025-10-21 (HP-Based and Conditional Limits Rebalance)

### Near Death Rebalance
- **near_death**: Reduced cost from 2p to **1p**, increased tier bonus from +2×Tier to **+4×Tier**

**Rationale**: Near Death's restrictive condition (25 HP or less) was undervalued at 2p for only +2×Tier. The 25 HP threshold means this limit only activates when seriously wounded, making it highly situational and risky - players must survive at critically low HP to gain the benefit. At 2p/+2×Tier, it was overshadowed by safer options like charges_1 (1p, +3×Tier, single use) or revenge (2p, +2×Tier, easier trigger). Reducing cost to 1p while increasing power to +4×Tier repositions it as a high-risk/high-reward "desperation power" option. The +4×Tier bonus (+16 at tier 4) rewards players who can survive and fight effectively while critically wounded, creating exciting clutch-play opportunities. This makes it competitive with bloodied (1p, +2×Tier, 50 HP threshold) by offering double the power at a much more dangerous threshold.

### Bloodied Power Increase
- **bloodied**: Increased tier bonus from +1×Tier to **+2×Tier**

**Rationale**: At +1×Tier, bloodied was one of the weakest 1p limits despite having a relatively restrictive 50 HP threshold. While 50 HP is easier to reach than near_death's 25 HP, it still requires taking significant damage and maintaining combat effectiveness while wounded. The +1×Tier bonus (+4 at tier 4) provided minimal impact compared to other 1p options like charges_1 (+3×Tier), combo_move (+1×Tier but easier trigger), or passive (+1×Tier with no HP risk). Increasing to +2×Tier creates meaningful differentiation - bloodied now rewards moderate wounding with a solid bonus (+8 at tier 4), while near_death (1p, +4×Tier, 25 HP) rewards critical wounding with extreme power. This creates a clear HP-based limit progression: bloodied for moderate damage, near_death for desperate situations.

### Slaughter Power Increase
- **slaughter**: Increased tier bonus from +4×Tier to **+5×Tier**

**Rationale**: Slaughter's "defeated enemy last turn" condition is extremely restrictive - it only activates after successfully killing an enemy, making it useless in the first turn and against single high-HP targets. At +4×Tier, it wasn't providing enough reward for this high barrier to entry. Many combats involve bosses or elites where defeating an enemy every turn is impossible, making slaughter completely inactive. Increasing to +5×Tier (+20 at tier 4) makes it a devastating "momentum" limit that rewards successful kills with overwhelming power on the next attack. This positions it as the premier offensive snowball limit - when you can trigger it (multi-enemy scenarios where you're defeating targets consistently), it provides massive burst damage to continue the kill chain. The +5×Tier bonus is justified by how difficult and situational the trigger condition is.

### Unbreakable Power Increase
- **unbreakable**: Increased tier bonus from +4×Tier to **+5×Tier**

**Rationale**: Unbreakable's condition "been hit but took no damage" is one of the most restrictive in the game, requiring both defensive success (avoiding damage through dodging, durability, or immunity) AND being targeted by enemies. This creates a narrow activation window that depends heavily on luck and defensive builds. At +4×Tier, it wasn't rewarding enough for such a difficult condition - most builds can't reliably trigger it, and when it does activate, the bonus wasn't exceptional enough to build around. Increasing to +5×Tier (+20 at tier 4) makes it a powerful niche option for high-durability/high-mobility builds that can consistently avoid damage while drawing attacks. This positions it alongside slaughter (+5×Tier, defeat enemy) as an extreme conditional limit - both require very specific circumstances but deliver massive power when triggered.

## 2025-10-21 (Explosive Critical and Splinter Cost Reduction)

### Explosive Critical Cost Reduction
- **explosive_critical**: Reduced cost from 2p to **1p**

**Rationale**: At 2p with -2×Tier penalties to both accuracy and damage, explosive_critical was overcosted for its splash potential. While extremely powerful in multi-enemy scenarios (splashing critical hits on 15-20 rolls to all enemies within 2 spaces), the dual -2×Tier penalties (-8 accuracy and -8 damage at tier 4) create severe build requirements to overcome. Players must invest heavily in accuracy and damage boosters just to make the upgrade functional, significantly limiting build options. Reducing to 1p makes it an accessible high-risk/high-reward option for multi-target specialists, while the harsh penalties ensure it remains balanced mechanically. This positions explosive_critical as a swarm-clearing specialist at a fair cost, competing with other multi-target options like ricochet (2p, no penalties but limited targets) by trading cost for mechanical difficulty.

### Splinter Cost Reduction
- **splinter**: Reduced cost from 2p to **1p**

**Rationale**: At 2p with -2×Tier penalties to both accuracy and damage, splinter was similarly overcosted for its chain attack mechanic. The "defeat enemy to trigger chain" condition is highly situational - it only provides value when fighting multiple enemies AND when you can actually defeat them with the penalized attacks (-8 accuracy, -8 damage at tier 4). Against high-HP targets or when the initial attack misses/doesn't kill, the upgrade provides no benefit while imposing harsh penalties. Reducing to 1p makes it a viable swarm-clearing option that rewards builds designed to finish off weakened enemies. The dual penalties ensure it's not overpowered, while the 1p cost makes it accessible for specialized anti-swarm builds. This creates parity with explosive_critical (1p, splash on crit) as different approaches to multi-enemy scenarios.

## 2025-10-21 (Cooldown Power Reduction)

### Cooldown Power Reduction
- **cooldown**: Reduced tier bonus from +4×Tier to **+3×Tier**

**Rationale**: At +4×Tier for 1p with a 3-turn reuse restriction, cooldown was providing too much burst power for builds that could work around the cooldown timer. While the 3-turn restriction is significant (25% uptime in extended combats), the +4×Tier bonus (+16 at tier 4) was overshadowing many 2p and even some 3p limits on the turns when it was available. Reducing to +3×Tier (+12 at tier 4) maintains its identity as a powerful periodic spike while creating better balance with other timing-based limits like charges_1 (1p, +3×Tier, single use) and charge_up (3p, +3×Tier, 1-turn charge). This positions cooldown as a 1p option for builds that can capitalize on periodic power spikes rather than a dominant must-pick for its cost.

## 2025-10-21 (Finale Cost Increase)

### Finale Cost Increase
- **finale**: Increased cost from 1p to **2p**

**Rationale**: At 1p, finale was too efficient for its +2×Tier bonus on turn 7+. While the late-game restriction (turn 7+) is significant, many combats extend past 7 turns, especially against high-HP enemies. At 1p, finale was outperforming other turn-timing limits like patient (2p, +1×Tier, turn 4+) and cooldown (1p, +4×Tier but 3-turn reuse restriction). Increasing to 2p better reflects its value as a reliable late-game power spike that activates once and remains active for the rest of combat. It now sits alongside patient (2p, +1×Tier, turn 4+) as a mid-cost turn-timing option, differentiated by finale's later activation but stronger bonus.

## 2025-10-21 (Direct Damage Formula Update)

### Direct Damage Base Increase
- **direct_damage**: Changed damage formula from flat 12 to **15 - Tier**
- **direct_area_damage**: Changed damage formula from 12 - Tier to **15 - 2×Tier**

**Rationale**: The previous flat damage values made direct attacks scale poorly across tiers. At tier 3, direct_damage dealt 12 damage while dice-based attacks could deal significantly more with proper build investment. Tier 5 direct_area_damage dealt only 7 damage (12 - 5), making it nearly worthless despite being an auto-hit AOE. The new formulas create better balance:

**Direct Damage (15 - Tier)**:
- Tier 3: 12 damage (same as before)
- Tier 4: 11 damage (was 12, slight nerf)
- Tier 5: 10 damage (was 12, nerf at high tier)

**Direct Area Damage (15 - 2×Tier)**:
- Tier 3: 9 damage (was 9, same)
- Tier 4: 7 damage (was 8, slight nerf)
- Tier 5: 5 damage (was 7, nerf at high tier)

The new formulas maintain the auto-hit advantage while creating a meaningful tradeoff - direct attacks are consistent and reliable but scale down at higher tiers, encouraging builds to invest in dice-based attacks for maximum damage potential. This prevents direct damage from dominating at high tiers while preserving their role as consistent, no-miss options at lower tiers.

## 2025-10-21 (Major Cost Rebalance)

### Splinter Cost Reduction
- **splinter**: Reduced cost from 3p to **2p**

**Rationale**: At 3p with -2×Tier penalties to both accuracy and damage, splinter was too expensive for its situational chain attack mechanic. While powerful in swarm scenarios when defeating enemies triggers chains, the dual penalties make it difficult to land hits consistently. Reducing to 2p makes it competitive with other multi-target options like ricochet (2p) and explosive_critical (2p), all of which offer different multi-enemy approaches with significant penalties. This positions splinter as the "chain on kill" specialist at a fair cost.

### Timid Cost Reduction
- **timid**: Reduced cost from 2p to **1p**

**Rationale**: At 2p for +2×Tier with the "max HP, no conditions" restriction, timid was overcosted for a defensive limit that only works at the start of combat or when untouched. The condition becomes increasingly difficult to maintain as combat progresses. Reducing to 1p makes it an attractive opening-turn option similar to quickdraw (3p, +4×Tier, turn 1-2) but at lower cost and power. It rewards cautious positioning but doesn't demand premium pricing.

### Explosive Critical Cost Reduction
- **explosive_critical**: Reduced cost from 3p to **2p**

**Rationale**: At 3p with -2×Tier penalties to both accuracy and damage, explosive_critical was overcosted despite its powerful splash mechanic. The dual penalties already create significant build investment requirements to overcome the -8 accuracy and -8 damage at tier 4. Reducing to 2p aligns it with ricochet (2p, critical splash to 2 targets) while maintaining differentiation through its "hit all within 2 spaces" effect and harsher penalties. This makes it a viable multi-enemy specialist option.

### Extra Attack Cost Reduction
- **extra_attack**: Reduced cost from 2p to **1p**

**Rationale**: At 2p with -Tier penalties and requiring both hit AND effect success, extra_attack was too expensive for its conditional nature. The requirement to succeed on both rolls (accuracy and effect) makes it unreliable compared to guaranteed upgrades. Reducing to 1p positions it as an accessible tactical option that rewards accuracy/damage investment. It's now competitive with barrage (1p, 3 attacks with -2×Tier) as different approaches to multiple hits.

### Slayer System Cost Reduction
- **All Slayer upgrades**: Reduced cost from 3p to **2p** (minion_slayer, captain_slayer, elite_slayer, boss_slayer)

**Rationale**: At 3p for +Tier to both accuracy and damage against specific enemy HP values, slayers were overcosted for their narrow applicability. Unlike universal upgrades that work in all scenarios, slayers only provide value against their designated enemy type. While powerful when applicable (+4 accuracy, +4 damage at tier 4), they're dead weight against other enemy types. Reducing to 2p makes them competitive specialization choices rather than expensive niche picks. Players can now justify taking a slayer for expected enemy types without breaking their point budget.

### Revenge Cost Reduction
- **revenge**: Reduced cost from 3p to **2p**

**Rationale**: At 3p for +2×Tier (after the previous power reduction from +3×Tier), revenge was severely overcosted compared to vengeful (2p, +2×Tier, "been hit"). The "been damaged" condition is only slightly more restrictive than "been hit," not enough to justify a 1p cost premium. Reducing to 2p creates proper parity - both revenge and vengeful now cost 2p with +2×Tier bonuses, differentiated only by their trigger conditions (damage taken vs hit taken). This gives players a meaningful choice based on expected combat patterns.

## 2025-10-21 (Defensive Limits Rebalance)

### Charges 1 Power Reduction
- **charges_1**: Reduced tier bonus from +4×Tier to **+3×Tier**

**Rationale**: At +4×Tier for 1p, charges_1 was providing too much burst power for its cost. A single-use +16 bonus at tier 4 was overshadowing many 2p and even some 3p limits. Reducing to +3×Tier (+12 at tier 4) maintains its identity as a powerful one-shot ability while creating better balance with other charge options like cooldown (1p, +4×Tier but 3-turn restriction) and charges_2 (2p, +2×Tier but 2 uses). This positions charges_1 as a solid 1p burst option rather than a dominant must-pick.

### Untouchable Power Reduction
- **untouchable**: Reduced tier bonus from +2×Tier to **+1×Tier**

**Rationale**: At +2×Tier, untouchable was too rewarding for a 1p limit with a very specific trigger condition (all attacks must miss). The condition is difficult to control and highly situational, making it unreliable for consistent builds. Reducing to +1×Tier acknowledges this unreliability while maintaining its niche as a defensive evasion reward. It now sits alongside other 1p conditional limits like passive (+1×Tier) and bloodied (+1×Tier) with appropriately modest bonuses.

### Revenge Power Reduction
- **revenge**: Reduced tier bonus from +3×Tier to **+2×Tier**

**Rationale**: At +3×Tier for 3p, revenge was competing directly with other premium offensive limits but with a relatively easy trigger condition ("been damaged" occurs frequently in combat). Reducing to +2×Tier creates better separation from vengeful (2p, +2×Tier, "been hit" trigger) - revenge now costs 1p more but has the same power level with a slightly more restrictive condition (damage taken vs just being hit). This makes the cost increase harder to justify, repositioning revenge as a more balanced 3p option that rewards aggressive trading rather than being an auto-include for high-cost builds.

### Careful Power and Cost Reduction
- **careful**: Reduced cost from 2p to **1p**, reduced tier bonus from +2×Tier to **+1×Tier**

**Rationale**: At 2p for +2×Tier, careful was competing with stronger defensive limits like vengeful (2p, +2×Tier, "been hit" trigger) but with a harder-to-maintain condition ("not damaged" is stricter than "been hit"). The "not damaged" condition requires successful dodging or damage mitigation, making it less reliable than simple hit tracking. Reducing to 1p/+1×Tier repositions careful as an accessible defensive limit for cautious playstyles, similar to passive (1p, +1×Tier, "no attack last turn") and bloodied (1p, +1×Tier, HP threshold). It rewards defensive positioning and damage avoidance without demanding the premium cost of stronger conditional limits.

## 2025-10-21 (Culling Strike Cost Increase)

### Culling Strike Cost Increase
- **culling_strike**: Increased cost from 1p to **2p**

**Rationale**: At 1p, culling strike was too efficient for its power level. The ability to instantly defeat enemies below 20% HP provides significant value in longer fights and against high-HP targets by eliminating the need to "finish off" wounded enemies. While situational, 1p undervalued this cleanup capability - especially when paired with high-damage builds that can consistently reduce enemies to execution range. Increasing to 2p better reflects its utility as a combat accelerator while maintaining its identity as a specialist finisher upgrade. It remains restricted from AOE attacks and chain effects (splinter, explosive_critical) to prevent degenerate instant-kill cascades.

## 2025-10-21 (Explosive Critical Penalty Increase)

### Explosive Critical Penalty Increase
- **explosive_critical**: Increased penalty from -Tier to **-2×Tier** (both accuracy and damage)

**Rationale**: After the previous rebalancing efforts (cost increase to 3p, damage penalty addition), explosive_critical has proven to be extremely powerful in multi-enemy scenarios. The -Tier penalty to both accuracy and damage was insufficient to balance its devastating splash potential when landing critical hits (15-20 range). In swarm and squad scenarios, a single critical hit can cascade into massive damage across multiple enemies, often ending combat in a single turn. Increasing the penalty to -2×Tier creates a more meaningful tradeoff - you now sacrifice significant accuracy and damage for the explosive splash capability. This brings it in line with similar high-penalty upgrades like splinter (-2×Tier) and channeled (-3×Tier initial). The upgrade remains extremely powerful for multi-enemy scenarios but now requires substantial investment in accuracy and damage boosters to overcome the dual -2×Tier penalties.

## 2025-10-21 (Channeled Rebalance)

### Channeled Starting Penalty Increase
- **channeled**: Increased starting penalty from -2×Tier to **-3×Tier**

**New Progression** (Tier 4 example):
- Turn 1: -12 (channeled_turns=0, min(0-3, 5)×4)
- Turn 2: -8 (channeled_turns=1, min(1-3, 5)×4)
- Turn 3: -4 (channeled_turns=2, min(2-3, 5)×4)
- Turn 4: 0 (channeled_turns=3, min(3-3, 5)×4)
- Turn 5: +4 (channeled_turns=4, min(4-3, 5)×4)
- Turn 6: +8 (channeled_turns=5, min(5-3, 5)×4)
- Turn 7: +12 (channeled_turns=6, min(6-3, 5)×4)
- Turn 8: +16 (channeled_turns=7, min(7-3, 5)×4)
- Turn 9+: +20 (channeled_turns=8+, capped at 5×Tier)

**Rationale**: After fixing the double penalty bug (see below), channeled became functional but required further tuning. The -2×Tier starting penalty was too lenient for a 3p upgrade that scales to +5×Tier maximum bonus. Increasing the starting penalty to -3×Tier creates a steeper ramp-up curve - the first few turns are now significantly weaker, requiring more commitment before reaching neutral (turn 4) and then powerful territory (turn 5+). This change:
- Increases the risk/reward dynamic - you must commit longer to overcome the initial weakness
- Delays the breakeven point by one turn (turn 4 instead of turn 3)
- Maintains the same +5×Tier cap, preserving endgame power
- Better justifies the 3p cost by making it a true long-term investment

The upgrade remains excellent for extended combats where you can afford to ramp up, but is now less attractive for short encounters.

### Channeled Charge Mechanics Restriction
- **channeled**: Added mutual exclusion with Charge Up, Charge Up 2, Charges 1, and Charges 2

**Rationale**: Channeled requires making the same attack on consecutive turns to build up its bonus. Charge mechanics (charge_up, charge_up_2, charges_1, charges_2) fundamentally conflict with this - charging consumes turns without making the attack, breaking the consecutive turn requirement. Additionally, the combination would create awkward interactions where players might try to charge while channeled, leading to confusion about whether the channeled counter resets or continues. This restriction clarifies that channeled is designed for sustained, consecutive attack patterns, not burst/charged attacks.

### CRITICAL BUGFIX: Channeled + Unreliable Interaction
- **channeled**: Fixed bug where channeled counter didn't reset when unreliable attacks failed

**Bug Description**: When an attack with both channeled and unreliable failed the unreliable DC check, the channeled counter was incorrectly incrementing instead of resetting. This meant players could build up large channeled bonuses even though many attacks were failing and not being made.

**Example of Bug** (Tier 4, unreliable_2):
- Turn 10: Attack succeeds → channeled_turns=9, bonus +20
- Turn 11: Attack fails (unreliable DC 10) → channeled_turns should reset to 0
- Turn 12: Attack succeeds → channeled_turns=11 (WRONG!), bonus +20

**Fix Implementation**:
- Added check in `simulation.py` (line 546) to detect unreliable failures (`damage=0, conditions=[]`)
- When unreliable fails, don't set `made_channeled_attack_this_turn=True`, allowing counter to reset properly

**Correct Behavior After Fix**:
- Turn 10: Attack succeeds → channeled_turns=0, bonus -12 (starting fresh)
- Turn 11: Attack fails (unreliable) → counter resets
- Turn 12: Attack succeeds → channeled_turns=0, bonus -12 ✓ (properly reset!)
- Turn 13: Attack succeeds → channeled_turns=1, bonus -8 ✓ (incrementing correctly!)

**Rationale**: This was a critical bug that made channeled + unreliable combinations overpowered. The channeled bonus is designed to reward consecutive successful attacks, but the bug was allowing the bonus to accumulate even when attacks failed. With the fix, channeled now correctly resets whenever an attack isn't made (whether due to unreliable failure, limit conditions not being met, or any other reason).

**Test Coverage**: Added `test_channeled_unreliable.py` to validate the fix and prevent regression.

## 2025-10-21 (Channeled Double Penalty Bugfix)

### CRITICAL BUGFIX: Channeled Double Penalty
- **channeled**: Removed static `accuracy_penalty=2, damage_penalty=2` from upgrade definition

**Bug Description**: The channeled enhancement was applying penalties/bonuses twice - once from the static upgrade definition and once from the dynamic consecutive-turn tracking system. This meant channeled was applying double the intended penalties at all stages:
- Turn 1: -16 penalty instead of -8
- Turn 2: -12 penalty instead of -4
- Turn 3: -8 penalty instead of 0
- Turn 4: -4 penalty instead of +4
- Turn 7+: +12 bonus instead of +20 (capped)

**Fix Implementation**:
- Removed `accuracy_penalty=2, damage_penalty=2` from channeled upgrade definition in `game_data.py`
- The dynamic calculation in `combat.py` (lines 515-520 and 665-674) correctly implements the full progression

**Original Intended Behavior** (Tier 4 example with -2×Tier start):
- Turn 1: -8 (channeled_turns=0, min(0-2, 5)×4)
- Turn 2: -4 (channeled_turns=1, min(1-2, 5)×4)
- Turn 3: 0 (channeled_turns=2, min(2-2, 5)×4)
- Turn 4: +4 (channeled_turns=3, min(3-2, 5)×4)
- Turn 5: +8 (channeled_turns=4, min(4-2, 5)×4)
- Turn 6: +12 (channeled_turns=5, min(5-2, 5)×4)
- Turn 7: +16 (channeled_turns=6, min(6-2, 5)×4)
- Turn 8+: +20 (channeled_turns=7+, capped at 5×Tier)

**Rationale**: This was a critical implementation bug that made channeled significantly underperform. The double penalty meant channeled attacks were severely handicapped in the first few turns and never reached their full potential bonus even after many consecutive turns. With the fix, channeled now works as designed - starting with a meaningful penalty that converts to a powerful bonus as you commit to using the same attack consecutively.

**Test Coverage**: Added `test_channeled.py` to validate the fix and prevent regression.

## 2025-10-21 (Explosive Critical Cost Increase)

### Explosive Critical Cost Increase
- **explosive_critical**: Increased cost from 1p to **3p**

**Rationale**: Even with the -Tier penalties to both accuracy and damage, explosive_critical remains an extremely powerful upgrade in multi-enemy scenarios. The ability to splash critical hits (on 15-20 rolls) to all enemies within 2 spaces provides massive value that scales exponentially with enemy count. At 1p, it was dramatically undercosted compared to similar critical effect upgrades: double_tap (3p), ricochet (2p), and splinter (3p). Increasing the cost to 3p properly reflects its devastating multi-target potential while maintaining its identity as the premier splash damage upgrade. The dual -Tier penalties ensure it remains balanced mechanically, while the 3p cost ensures it's balanced economically within point budgets.

## 2025-10-21 (Explosive Critical Bugfix and Nerf)

### Explosive Critical Damage Penalty Addition
- **explosive_critical**: Added -Tier damage penalty (now has -Tier to both accuracy and damage)

**Rationale**: After fixing the explosive critical implementation bug (see below), the upgrade proved to be extremely powerful in multi-enemy scenarios - capable of wiping entire groups with a single critical hit. At only -Tier accuracy penalty, it was dramatically overperforming for a 1p upgrade. Adding -Tier damage penalty creates meaningful tradeoff: you sacrifice both accuracy and damage output for the devastating splash potential. This brings it in line with similar high-risk/high-reward upgrades like splinter (-2×Tier accuracy and damage) and channeled (-2×Tier accuracy and damage). The upgrade remains excellent for multi-enemy scenarios but now requires builds to compensate for the dual penalties through accuracy and damage boosters.

### CRITICAL BUGFIX: Explosive Critical Implementation
- **explosive_critical**: Fixed completely non-functional implementation that was preventing splash damage from occurring

**Bug Description**: Explosive critical was triggering on 15-20 rolls (critical hit range worked correctly) but was not applying splash damage to other enemies. The code would log "Explosive Critical triggered! (explosive attacks not implemented in single-target context)" and then do nothing. This meant the upgrade was only providing the -Tier accuracy penalty without any of the benefit of splashing to other enemies.

**Fix Implementation**:
1. **combat.py**: Changed explosive_critical handling to return 'explosive_critical' condition instead of just logging
2. **simulation.py**: Added handler for 'explosive_critical' condition that makes splash attacks against all other alive enemies

**Performance Impact Before Nerf**:
- **Boss (1×100)**: No change (no other enemies to splash)
- **Pairs (2×50)**: ~40-60% faster (splashes to 2nd enemy on 15-20 rolls)
- **Squad (4×25)**: ~50% faster (splashes to 3-4 enemies on crits)
- **Swarm (10×10)**: ~70-80% faster (splashes to up to 9 enemies on crits)

**Rationale**: This was a critical implementation bug that made explosive_critical completely non-functional. The upgrade was designed to be a 1p multi-enemy specialist upgrade - trading accuracy for the ability to splash critical hits to all enemies in range. Without the splash mechanic working, it was just an accuracy penalty with no upside, making it one of the worst performing upgrades. With the fix, it became functional but too powerful, necessitating the damage penalty addition above.

**Test Coverage**: Added `tests/test_explosive_critical.py` to validate the fix and prevent regression.

## 2025-10-21 (Timid and Splinter Rebalance)

### Timid Power Reduction
- **timid**: Reduced tier bonus from +3×Tier to **+2×Tier**

**Rationale**: At +3×Tier, timid was providing too much value for a defensive limit that's easy to maintain in the opening turns of combat. Characters starting at max HP with no conditions get a strong offensive bonus with minimal risk. Reducing to +2×Tier maintains timid's identity as a cautious opener while preventing it from overshadowing other 2p limits. It still rewards defensive play but no longer dominates the early-game meta.

### Splinter Penalty Increase
- **splinter**: Increased accuracy and damage penalty from -Tier to **-2×Tier**

**Rationale**: Splinter's ability to chain attacks when defeating enemies is extremely powerful in swarm scenarios (fighting multiple weak enemies). The -Tier penalty was insufficient to balance its snowball potential - once the first enemy falls, subsequent attacks can cascade through entire groups. Increasing to -2×Tier makes the initial hit more difficult to land, creating meaningful tradeoff: you sacrifice accuracy for devastating chain potential. This preserves splinter's identity as a high-risk/high-reward swarm-clearing upgrade while preventing degenerate "unstoppable chain" builds.

## 2025-10-21 (Tier-Scaling Thresholds and Limit Rebalance)

### Overhit Threshold Tier-Scaling
- **overhit**: Changed threshold from fixed 15 to **3×Tier**

**Rationale**: Tier-scaling the overhit threshold ensures the upgrade remains balanced across all tiers. At tier 3 (threshold 9), it triggers more reliably for moderate accuracy builds. At tier 5 (threshold 15), it maintains appropriate power gating for high-tier play. This prevents the upgrade from being too weak at low tiers or too easy to trigger at high tiers.

### Brutal Threshold Tier-Scaling
- **brutal**: Changed threshold from fixed 20 to **5×Tier**

**Rationale**: Similar to overhit, tier-scaling brutal's damage threshold creates more consistent performance across tiers. At tier 3 (threshold 15), it activates on moderately strong hits. At tier 4 (threshold 20), it maintains the original power gating. At tier 5 (threshold 25), it requires truly overwhelming damage to trigger. This scaling ensures brutal remains a reward for exceptional damage rolls across all tiers without being trivial to trigger at high tiers.

### Charge Up Power and Cost Increase
- **charge_up**: Increased cost from 1p to **3p**, increased tier bonus from +2×Tier to **+3×Tier**

**Rationale**: Charge Up at 1p was undercosted for its flexibility - spending one action to charge, then attacking with +2×Tier bonus on the next turn provided excellent value with minimal risk. Increasing to 3p/+3×Tier makes it a premium power spike option that competes with charge_up_2 (2p/+4×Tier over 2 turns). This creates a meaningful choice: charge_up for one strong turn (3p/+3×Tier) vs charge_up_2 for an even stronger turn (2p/+4×Tier but requires 2 charge turns).

### Unreliable 3 Cost Increase
- **unreliable_3**: Increased cost from 1p to **2p**

**Rationale**: At 1p, Unreliable 3 (+5×Tier on 70% success rate) provided too much expected value compared to safer limits. A 70% chance (roll 15+ on d20) for +5×Tier bonus was stronger than many 2p limits. Increasing to 2p maintains its high-risk/high-reward identity while preventing it from dominating build optimization at the 1p cost tier.

### Quickdraw Cost Increase
- **quickdraw**: Increased cost from 2p to **3p**, tier bonus remains **+4×Tier**

**Rationale**: Quickdraw provides a massive early-game power spike (+4×Tier on turns 1-2), which is extremely valuable for opening burst damage and killing priority targets before they act. The 3p cost reflects its premium positioning as a high-impact opener that can decisively shift early combat. While expensive, it competes with charge_up (3p, +3×Tier) by trading setup time for immediate availability, making it ideal for alpha-strike builds.

### Charges 2 Cost Increase
- **charges_2**: Increased cost from 1p to **2p**

**Rationale**: At 1p, Charges 2 (+2×Tier, 2 uses per combat) provided better value than many alternatives. With two charges at +2×Tier each, it offered more total bonus than charges_1 (1p, +4×Tier, single use) across a typical combat. Increasing to 2p creates clearer differentiation: charges_1 (1p) for nova damage vs charges_2 (2p) for sustained flexibility.

### Culling Strike Cost Reduction and Restrictions
- **culling_strike**: Reduced cost from 3p to **1p**, added restrictions: cannot apply to Area or Direct Area attacks, cannot be paired with Splinter or Explosive Critical

**Rationale**: At 3p, Culling Strike was too expensive for its niche utility (only triggers when reducing enemies below 20% max HP). While powerful against high-HP targets, it provides no benefit against low-HP enemies or when overkilling. Reducing to 1p makes it an accessible "cleanup" option for finishing wounded targets. The new restrictions prevent abuse cases: AOE culling would be too strong for swarm clearing, and pairing with chain/splash effects (splinter, explosive_critical) would create degenerate multi-kill cascades.

### Timid Charge Incompatibility
- **timid**: Added restrictions: cannot be paired with Charges 1 or Charges 2

**Rationale**: Timid requires being at max HP with no conditions, which creates a defensive playstyle focused on avoiding damage. This conflicts philosophically with charge-based limits, which encourage aggressive, decisive strikes at key moments. The combination would create builds that hoard charges while staying at max HP, leading to overly passive gameplay patterns. Preventing this pairing enforces clearer build archetypes: timid for cautious, consistent damage vs charges for aggressive burst windows.

### Explosive Critical Penalty Reduction
- **explosive_critical**: Reduced accuracy penalty from -2 to **-1**

**Rationale**: At -2 penalty, explosive_critical was underperforming despite its unique splash critical mechanic. The flat -2 penalty made it difficult to land the initial hit, preventing the chain reaction from ever triggering. Reducing to -1 improves reliability while maintaining meaningful risk/reward - you still sacrifice accuracy for the potential to crit-splash multiple enemies, but the penalty is no longer crippling.

### Slayer System Unification
- **All Slayer upgrades**: Redesigned to give +Tier to BOTH Accuracy and Damage rolls (no longer choose), increased cost from 2p to **3p**

**Rationale**: The old slayer system forced players to choose between accuracy or damage variants, creating analysis paralysis and build confusion. Most players defaulted to damage variants, making accuracy variants nearly unused. The new unified system gives both bonuses for 3p, simplifying decision-making while maintaining power balance (2p for one bonus → 3p for both bonuses). This also reduces build space complexity while preserving slayers' identity as specialized anti-enemy-type upgrades.

## 2025-10-20 (Balance Pass Based on Saturation Analysis)

### Cooldown Power Increase
- **cooldown**: Increased tier bonus from 3×Tier to **4×Tier**

**Rationale**: Saturation analysis showed cooldown at 0.3% (rank 46/46, worst performing enhancement). With only 25% uptime (use every 4 turns), it needs significantly stronger per-use impact to justify the severe restriction.

### Explosive Critical Penalty Reduction
- **explosive_critical**: Changed accuracy penalty from -Tier to **-2 flat**

**Rationale**: Saturation analysis showed 0.9% (very low adoption). The -Tier penalty scaled too harshly at higher tiers (e.g., -4 at tier 4), making the upgrade unviable despite the 1p cost. Fixed penalty makes it predictable and more viable.

### Extra Attack Cost Increase
- **extra_attack**: Increased cost from 1p to **2p**

**Rationale**: Saturation analysis showed 19.6% (rank 2/46, extremely overperforming). Too strong at 1p cost despite requiring both hit AND effect success. Increasing cost brings it in line with other tactical upgrades.

### Charge Up Rebalance
- **charge_up**: Reduced tier bonus from 3×Tier to **2×Tier** AND reduced cost from 3p to **1p**

**Rationale**: Saturation at 11.8%. Making it highly accessible (1p) while reducing power (2×Tier instead of 3×Tier) provides better balance with charge_up_2 and makes single-charge builds more viable. Now competitive with finale (1p, +2×Tier, turn 7+) by trading turn restriction for charge requirement.

### Vengeful Cost Reduction
- **vengeful**: Reduced cost from 3p to **2p**

**Rationale**: Saturation analysis showed 0.4% (rank 45/46, second worst performing enhancement). At 3p for only +2×Tier with the "been hit" condition, it was completely overshadowed by revenge (3p, +3×Tier, "been damaged"). Reducing to 2p makes it a viable alternative for builds that want conditional bonuses at lower cost.

## 2025-10-20

### Cooldown Power Increase
- **cooldown**: Increased tier bonus from 2×Tier to 3×Tier (making it more competitive with other limits)

**Rationale**: Cooldown's 3-turn restriction is a significant downside. The increased power makes it a more attractive option for burst damage builds.

### Extra Attack Cost Reduction
- **extra_attack**: Reduced cost from 2pt to 1pt (making this tactical upgrade more accessible)

**Rationale**: Extra Attack requires both hitting AND succeeding on the effect roll, making it relatively unreliable. The reduced cost makes it more attractive despite its conditional nature.

### Charge Limits Power Reduction
- **charges_1**: Reduced tier bonus from 6×Tier to 4×Tier (lowering single-charge power ceiling)
- **charges_2**: Reduced tier bonus from 3×Tier to 2×Tier (keeping proportional power difference)

**Rationale**: Reducing the power scaling of charge-based abilities to bring them more in line with other limit options. The 2:1 power ratio between charges_1 and charges_2 is maintained (4×Tier vs 2×Tier).

### Timid Cost Increase
- **timid**: Increased cost from 1pt to 2pt (balancing max-HP conditional)

**Rationale**: Timid provides a strong 3×Tier bonus with a relatively easy condition to maintain early in combat. The increased cost reflects its defensive advantage compared to other conditional limits.

## 2025-10-20

### Charge Limit Rebalance
- **charges_1**: Reduced tier bonus from 10×Tier to 6×Tier, reduced cost from 2pt to 1pt (making single-charge option more powerful per use)
- **charges_2**: Reduced tier bonus from 4×Tier to 3×Tier, cost remains 1pt (reducing per-charge power but gaining extra use)

**Rationale**: This change makes charges_1 the more powerful per-charge option (6×Tier vs 3×Tier), emphasizing its single high-impact use. Charges_2 trades power for flexibility with two weaker charges. Both at 1pt makes them equally accessible with different tactical profiles.

## 2025-10-20

### Limit Cost Changes
- **charges_2**: Reduced cost from 2pt to 1pt (making both charge options same cost for balance)
- **unreliable_1**: Increased cost from 1pt to 2pt (balancing low-risk unreliable option)
- **charges_1**: Increased cost from 1pt to 2pt (balancing powerful single-use ability)

### Limit Tier Changes
- **charges_1**: Increased tier bonus from 6×Tier to 10×Tier (making it a premier one-shot ability)

## 2025-10-20

### Critical Bug Fix

#### Mutual Exclusion Rules (charges_1, charges_2)
**Bug**: Charges were incorrectly restricted from pairing with combo_move, relentless, and slaughter
- **Issue**: game_data.py had overly broad mutual exclusions not specified in RULES.md
- **Fix**: Removed incorrect exclusions - charges now only exclude each other, cooldown, and quickdraw (per RULES.md)
- **Impact**: Opens up ~40,000+ new valid build combinations, significantly increasing charges' appearance in builds

**Technical Details**:
- Updated `game_data.py`: Fixed MUTUAL_EXCLUSIONS line 107 to match RULES.md specifications
- **Note**: Charges are single-use per combat (recharge between encounters, not during combat)

### Upgrade Cost Changes
- **bleed**: Reduced cost from 3pt to 2pt, then increased back to 3pt (final balance adjustment for DOT effect)

### Limit Cost Changes
- **untouchable**: Reduced cost from 2pt to 1pt
- **careful**: Reduced cost from 3pt to 2pt (evening out defensive limit costs)
- **revenge**: Increased cost from 2pt to 3pt (balancing offensive conditional limits)
- **quickdraw**: Increased cost from 1pt to 2pt (high-impact early game limit)
- **charge_up**: Increased cost from 1pt to 2pt to 3pt (premium cost for flexible strong bonus)
- **charges_2**: Increased cost from 1pt to 2pt (stronger tier bonus justifies higher cost)

### Limit Tier Changes
- **revenge**: Increased tier from 2 to 3
- **vengeful**: Increased tier from 2 to 3, then reduced back to 2 (keeping in line with easier trigger condition)
- **charge_up**: Increased tier from 2 to 3 (better scaling for delayed attacks)
- **charges_2**: Increased tier from 2 to 3 to 4 (making 2-charge option more attractive)

### Limit Mechanic Changes
- **quickdraw**: Changed from "turn 1 only" to "turn 1 or 2", tier reduced from 5 back to 4 (extended window with balanced power)
- **charges_1**: Tier reduced from 7 back to 6 (rebalanced single-use power)
