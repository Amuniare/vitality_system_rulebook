

new report, which looks at the 100 top builds of each upgrade




# FINAL IMPLEMENTED VALUES (as of current version)

direct_damage, move to 14-tier instead of 13-tier
direct_area_damage 14-3x Tier, instead of 13-2xTier
aoe penalty to - tier to accuracy AND Damage and 


Critical Effect: 20p and -2
Brutal: 20p 

Armor piercing has no -1/2 tier
Reliable accuracy to -3 and costs 20p

charge up 1 to 2x tier to accuracy and damage and 
charge up 2 to 20p and 3x tier to accuracy and damage and 

Quickdraw 20p works on turn 1 and 2, 2x tier to accuracy and damage and 
steady to 40p and 1x tier to accuracy and damage and 
patient and 20p and 1x tier to accuracy and damage and 
finale to 20p and 3x tier to accuracy and damage and 
Critical Accuracy 20p



Bleed: 20p and -tier to damage and 

unreliable 1 to 20p and 1x tier to accuracy and damage and 
unreliable 2 to 20p and 3x tier to accuracy and damage and 
unreliable 3 to 20p but 5x tier to accuracy and damage and 




### Future
quick strikes
- 40p
- 2 attack, not 3 attacks
- -tier to accuracy and damage rolls
- no aoe
extra attack, 
- need to hit and effect in order to make a second attack
- 40p
- no aoe

barrage
- -tier to accuracy and damage rolls
- need to hit and effect in order to make a second attack
- 60p
- need to hit and effect on second attack in order to make a third attack
- no aoe

all 3 above, must alway attack the same target, if that target dies, then no more attacks.




powerful critical and double tap, neither is extra attack aren't occuring in combat log, why?


### Futre

new metric, turns per fight (max 20 turns)
- new table with that guiding us
    reports/2025-09-26_15-56-32/individual_attack_type_table.txt
    reports/2025-09-26_15-56-32/individual_upgrade_limit_table.txt



need to bring in cooldown, explosive crit, splinter



**Explosive Critical**  
Cost: 40p
Effect: Hit rolls of 15-20 trigger attack against all enemies within 2 spaces of target if it would also hit them  
Restriction: Must take **Critical Accuracy**
Exclusion: Cannot trigger from Double-Tap, Ricochet, or other Explosive Critical  

**Culling Strike**  
Cost: 20p
Effect: If attack reduces enemy below 1/5 maximum HP, enemy is defeated instead  
Restriction: Cannot apply to AOE attacks  

**Splinter**  
Cost: 40p
Effect: Defeating enemy triggers another attack against new target before turn ends  
Chain Limit: Maximum Tier/2 additional attacks (rounded up)  
Restriction: Cannot apply to AOE attacks  


**Cooldown** 
Cost: 20p
Limit: Cannot use again for 3 turns after use
Effect: +Tier to chosen roll type (choose Accuracy, Damage, or Conditions when purchasing)



# Itteration
multiple runs to test varience in pricing


rework of reporting and config

for each
- ability to run 1, the other or both
- always
    - tested against all 4 senarios, 
    - tested with all available attack types

two types of reports
- individual
    - only tests all limits and upgrades individually  (crit accuracy tested on its own), powerful critical and double tap tested with crit accuracy
    - for individual, i want a combat log, only 1 run for each
        - table 1: attack type (20 columns total, 6 rows)
            - Rows: list of all attack types
            - Columns  
                - avg of all senario
                    - Avg DPT+ (no upgrades/limits),  
                    - Avg %+ (no upgrades/limits), 
                    - Avg DPT+ (with upgrades/limits),  
                    - Avg %+ (with upgrades/limits), 
                - For each senario
                    - Avg DPT+ (no upgrades/limits),  
                    - Avg %+ (no upgrades/limits), 
                    - Avg DPT+ (with upgrades/limits),  
                    - Avg %+ (with upgrades/limits), 

         - table 2: attack type (23 columns total, X rows, where X is all the limits and upgrades)
            - Rows: list of all limits and upgrades (in the same table)
            - Columns  
                - avg of all attack types and senarios
                    - Avg DPT/Cost 
                    - Avg DPT+
                    - Avg %+
                - For each attack type
                    - Avg DPT+
                    - For each senario
                        - Avg DPT+


- build
    - tests builds, so it tries to build every possible attack and tests that.
    - no logs
    - not sure yet what tables i want, but i want 1 report with good data




