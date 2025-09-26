"""
Upgrade definitions for the Vitality System.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from core.models import Upgrade

# Key damage-focused upgrades
UPGRADES = {
    'power_attack': Upgrade('power_attack', 10, damage_mod=1, accuracy_penalty=1),
    'high_impact': Upgrade('high_impact', 20, special_effect="flat_15"),
    'critical_effect': Upgrade('critical_effect', 20, damage_penalty=2, special_effect="explode_5_6"),
    'armor_piercing': Upgrade('armor_piercing', 20, special_effect="ignore_endurance"),
    'brutal': Upgrade('brutal', 40, special_effect="brutal_10"),
    'quick_strikes': Upgrade('quick_strikes', 60, special_effect="triple_attack", damage_penalty=1, accuracy_penalty=1),
    'bleed': Upgrade('bleed', 80, special_effect="bleed_2_turns", damage_penalty=1),
    'critical_accuracy': Upgrade('critical_accuracy', 30, special_effect="crit_15_20"),
    'powerful_critical': Upgrade('powerful_critical', 20, special_effect="powerful_crit"),
    'double_tap': Upgrade('double_tap', 30, special_effect="double_tap"),
    'finishing_blow_1': Upgrade('finishing_blow_1', 20, special_effect="finishing_5"),
    'finishing_blow_2': Upgrade('finishing_blow_2', 30, special_effect="finishing_10"),
    'finishing_blow_3': Upgrade('finishing_blow_3', 40, special_effect="finishing_15"),
    'extra_attack': Upgrade('extra_attack', 70, special_effect="extra_attack"),
    'minion_slayer_acc': Upgrade('minion_slayer_acc', 20, special_effect="slayer_minion_acc"),
    'minion_slayer_dmg': Upgrade('minion_slayer_dmg', 20, special_effect="slayer_minion_dmg"),
    'captain_slayer_acc': Upgrade('captain_slayer_acc', 20, special_effect="slayer_captain_acc"),
    'captain_slayer_dmg': Upgrade('captain_slayer_dmg', 20, special_effect="slayer_captain_dmg"),
    'elite_slayer_acc': Upgrade('elite_slayer_acc', 20, special_effect="slayer_elite_acc"),
    'elite_slayer_dmg': Upgrade('elite_slayer_dmg', 20, special_effect="slayer_elite_dmg"),
    'boss_slayer_acc': Upgrade('boss_slayer_acc', 20, special_effect="slayer_boss_acc"),
    'boss_slayer_dmg': Upgrade('boss_slayer_dmg', 20, special_effect="slayer_boss_dmg"),
    'accurate_attack': Upgrade('accurate_attack', 10, accuracy_mod=1, damage_penalty=1),
    'reliable_accuracy': Upgrade('reliable_accuracy', 20, accuracy_penalty=3, special_effect="advantage"),
    'overhit': Upgrade('overhit', 30, special_effect="overhit"),
}