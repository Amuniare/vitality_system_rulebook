import random
import string
import time

class Roll20IDGenerator:
    """Generates Roll20-compatible unique IDs for repeating sections"""
    
    @staticmethod
    def generate_row_id():
        """Generate ID matching Roll20's format: -[random_alphanumeric]"""
        # Generate 16-character random string (no underscores or spaces)
        random_part = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
        return f"-{random_part}"
    
    @staticmethod  
    def generate_unique_id(existing_ids=None):
        """Generate unique ID, checking against existing ones if provided"""
        if existing_ids is None:
            existing_ids = set()
        
        while True:
            new_id = Roll20IDGenerator.generate_row_id()
            if new_id not in existing_ids:
                return new_id