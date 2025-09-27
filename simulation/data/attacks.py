"""
Attack type definitions for the Vitality System.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from core.models import AttackType

# Attack Types
ATTACK_TYPES = {
    'melee_ac': AttackType('melee_ac', 0),  # Melee with +Tier accuracy bonus
    'melee_dg': AttackType('melee_dg', 0),  # Melee with +Tier damage bonus
    'ranged': AttackType('ranged', 0),
    'area': AttackType('area', 0, accuracy_mod=-1),
    'direct_damage': AttackType('direct_damage', 0, is_direct=True, direct_damage_base=14),
    'direct_area_damage': AttackType('direct_area_damage', 0, is_direct=True, direct_damage_base=14)
}