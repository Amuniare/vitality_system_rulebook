

new report, which looks at the 100 top builds of each upgrade




# FINAL IMPLEMENTED VALUES (as of current version)
Steady: 40p and turn 4 or later
Critical Effect: 20p and -2
Quick Strikes: 60p
Brutal: 40p 
Charge_up 2 costs 10p but gives 2 x tier to damage and accuracy
Unreliable 3 but costs 20p gives 3 x tier to damage and accuracy
Bleed: 80p, includes -tier to damage
Armor piercing has no -1/2 tier
Finishing blow rank 1 costs 20p, rank 2 costs 30p and rank 3 costs 40p
Reliable accuracy to -3 and costs 20p
Quickdraw works on turn 1 and 2

Remove barrage, quick strikes are melee and ranged only


## Changes v2
bleed to 40p
unreliable 1 to 1x tier to accuracy and damage
unreliable 2 to 2x tier to accuracy and damage
unreliable 3 to 4x tier to accuracy and damage

charge up 1 to 2x tier to accuracy and damage
charge up 2 to 3x tier to accuracy and damage

steady, patient to 1x tier to accuracy and damage
finale to 2x tier to accuracy and damage
Quickdraw works on turn 1 and 2 and 2x tier to accuracy and damage

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




