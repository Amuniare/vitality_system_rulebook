class MappingValidator:
    """Validates completeness of web builder to Roll20 mapping"""
    
    @staticmethod
    def validate_character_mapping(web_data, roll20_data):
        """Check if all important web builder data was mapped to Roll20"""
        issues = []
        
        # Check special attacks
        web_attacks = web_data.get("specialAttacks", [])
        roll20_attacks = roll20_data.get("repeating_sections", {}).get("attacks", {})
        
        if len(web_attacks) != len(roll20_attacks):
            issues.append(f"Attack count mismatch: {len(web_attacks)} web vs {len(roll20_attacks)} Roll20")
        
        # Check attributes
        web_attrs = web_data.get("attributes", {})
        for attr_name in web_attrs.keys():
            expected_r20_name = f"char_{attr_name}"
            if expected_r20_name not in roll20_data.get("attributes", {}):
                issues.append(f"Missing Roll20 attribute: {expected_r20_name}")
        
        # Check required Roll20 fields
        required_fields = [
            "char_tier", "char_accuracy", "char_damage", "char_avoidance",
            "char_durability", "char_resolve", "char_stability", "char_vitality"
        ]
        for field in required_fields:
            if field not in roll20_data.get("attributes", {}):
                issues.append(f"Missing required Roll20 field: {field}")
        
        return issues