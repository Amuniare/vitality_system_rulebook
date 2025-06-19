import random
import string
import time

class Roll20IDGenerator:
    """Generates Roll20-compatible unique IDs for repeating sections"""
    
    @staticmethod
    def generate_row_id():
        """Generate ID matching Roll20's format: -[prefix][random_alphanumeric]"""
        # Roll20 uses patterns like: -ON2ciXkBZk7HHKt4WqX
        prefix = "N" + str(int(time.time() * 1000))[-4:]  # Last 4 digits of timestamp
        random_part = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        return f"-{prefix}{random_part}"
    
    @staticmethod  
    def generate_unique_id(existing_ids=None):
        """Generate unique ID, checking against existing ones if provided"""
        if existing_ids is None:
            existing_ids = set()
        
        while True:
            new_id = Roll20IDGenerator.generate_row_id()
            if new_id not in existing_ids:
                return new_id