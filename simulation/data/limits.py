"""
Limit (unreliable) upgrade definitions for the Vitality System.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from core.models import Limit

LIMITS = {
    'unreliable_1': Limit('unreliable_1', 30, 1, 5),   # Cost 30p, +Tier bonus, DC 5
    'unreliable_2': Limit('unreliable_2', 20, 2, 10),  # Cost 20p, +2×Tier bonus, DC 10
    'unreliable_3': Limit('unreliable_3', 20, 3, 15),  # Cost 20p, +3×Tier to Accuracy and Damage, DC 15+
    'quickdraw': Limit('quickdraw', 10, 1, 0),          # Cost 10p, +Tier bonus, first round only
    'steady': Limit('steady', 40, 1, 0),                # Cost 40p, +Tier bonus, turn 4 or later
    'patient': Limit('patient', 20, 1, 0),              # Cost 20p, +Tier bonus, turn 5 or later
    'finale': Limit('finale', 10, 1, 0),                # Cost 10p, +Tier bonus, turn 8 or later
    'charge_up': Limit('charge_up', 10, 1, 0),          # Cost 10p, +Tier bonus, spend action on previous turn
    'charge_up_2': Limit('charge_up_2', 10, 2, 0),     # Cost 10p, +2×Tier bonus, spend actions on previous two turns
}