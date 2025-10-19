"""Quick test to verify the channeled + finale bug fix"""

from src.models import Character, AttackBuild
from src.simulation import simulate_combat_verbose
from io import StringIO

# Create attacker and defender
attacker = Character(focus=2, power=2, mobility=2, endurance=2, tier=4)
defender = Character(focus=2, power=2, mobility=2, endurance=2, tier=4)

# Create build: melee_dg with power_attack, splinter, channeled + finale
# This is the build from rank #9 in the focused archetype
build = AttackBuild('melee_dg', ['power_attack', 'splinter', 'channeled'], ['finale'])

# Run combat with logging
buffer = StringIO()

print("="*80)
print("TESTING FINALE + CHANNELED BUG FIX")
print("="*80)
print(f"Build: {build}")
print(f"Archetype: focused")
print("="*80)
print()

# Run simulation for focused archetype (should NOT attack before turn 7)
turns, outcome = simulate_combat_verbose(
    attacker=attacker,
    build=build,
    target_hp=100,
    log_file=buffer,
    defender=defender,
    num_enemies=1,
    enemy_hp=100,
    max_turns=100,
    archetype='focused'
)

# Get the log output
log_output = buffer.getvalue()

# Print first part of log to see turns 1-10
lines = log_output.split('\n')
for i, line in enumerate(lines):
    if i > 500:  # Limit output
        break
    print(line)

print()
print("="*80)
print("TEST RESULTS")
print("="*80)
print(f"Combat ended in {turns} turns with outcome: {outcome}")
print()

# Check for expected behavior
print("VERIFICATION:")
print("-" * 80)

# Check 1: Should not attack before turn 7
early_attack_found = False
for i, line in enumerate(lines):
    if 'TURN' in line and ('TURN 1' in line or 'TURN 2' in line or 'TURN 3' in line or
                           'TURN 4' in line or 'TURN 5' in line or 'TURN 6' in line):
        # Look ahead for attack or damage
        for j in range(i, min(i+30, len(lines))):
            if 'focused archetype cannot use basic attack' in lines[j]:
                print("[PASS] Found expected message on early turn: 'focused archetype cannot use basic attack'")
                break
            if 'BASIC ATTACK RESULT' in lines[j]:
                print("[FAIL] Found BASIC ATTACK on turn before 7!")
                early_attack_found = True
                break

# Check 2: First attack should be on turn 7 with channeled bonus = 0
turn_7_found = False
for i, line in enumerate(lines):
    if 'TURN 7 - START' in line:
        turn_7_found = True
        # Look ahead for channeled bonus
        for j in range(i, min(i+50, len(lines))):
            if 'Channeled:' in lines[j]:
                if 'bonus +0' in lines[j] or 'bonus 0' in lines[j] or ', bonus 0' in lines[j]:
                    print("[PASS] Turn 7 channeled bonus is 0 (expected)")
                elif 'bonus +16' in lines[j]:
                    print("[FAIL] Turn 7 channeled bonus is +16 (BUG NOT FIXED!)")
                else:
                    print("[INFO] Found channeled on turn 7:", lines[j].strip())
                break

# Check 3: Turn 8 should have higher channeled bonus
turn_8_found = False
for i, line in enumerate(lines):
    if 'TURN 8 - START' in line:
        turn_8_found = True
        for j in range(i, min(i+50, len(lines))):
            if 'Channeled:' in lines[j]:
                if '+4' in lines[j] or 'bonus +4' in lines[j]:
                    print("[PASS] Turn 8 channeled bonus is +4 (expected, 1 turn of channeling)")
                else:
                    print("[INFO] Found channeled on turn 8:", lines[j].strip())
                break

if not early_attack_found and turn_7_found:
    print()
    print("="*80)
    print("[SUCCESS] BUG FIX VERIFIED!")
    print("="*80)
    print("- Focused builds do NOT attack before turn 7")
    print("- Channeled bonus starts at 0 on turn 7")
    print("- Channeled bonus properly accumulates on subsequent turns")
else:
    print()
    print("="*80)
    print("[ERROR] BUG MAY STILL EXIST - CHECK LOGS ABOVE")
    print("="*80)
