

does diagnostic include different senarios
does diagnostic include limits
will likely need to break diagnostic into a subfolder, with each file being 1 upgrade with 





this doesn't make sense, it's likely still going by HP, not by max hP:
14   minion_slayer_dmg          10002.8      47.8% 2215   19 20888
15   minion_slayer_acc          10004.0      47.9% 2215   14 20881
16   captain_slayer_dmg         10015.6      47.9% 2215   20 20898
17   captain_slayer_acc         10018.2      47.9% 2215   15 20893
18   elite_slayer_dmg           10019.4      47.9% 2215   16 20904
19   elite_slayer_acc           10020.5      47.9% 2215   18 20901




when looking at diagnostics, i noticed this:
POWERFUL_CONDITION_CRITICAL (20 points)
    Making melee attack with ['double_tap']


this also seems like a mistake:
9    finishing_blow_2            40p      0.1 melee (+0.6)   
10   elite_slayer_dmg            20p      0.1 melee (+0.2)   
11   elite_slayer_acc            20p      0.0 melee (+0.3)   
12   double_tap                  30p      0.0 melee (+0.2)   
13   finishing_blow_3            60p      0.0 ranged (+0.1)  