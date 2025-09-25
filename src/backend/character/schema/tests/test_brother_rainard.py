"""
Test Brother Rainard Conversion

Test the complete conversion of Brother Rainard from web builder JSON
to Roll20 schema format.
"""

import json
import os
import sys
from pathlib import Path

# Add parent directories to path for imports
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent.parent))

from schema_mapper import SchemaMapper
from schema_validator import SchemaValidator


def test_brother_rainard_conversion():
    """Test Brother Rainard conversion from JSON to schema."""
    
    # Path to Brother Rainard JSON file
    rainard_path = Path(__file__).parent.parent.parent.parent.parent / "Brother_Rainard_character.json"
    
    if not rainard_path.exists():
        print(f"? Brother Rainard JSON not found at: {rainard_path}")
        return False
    
    print(f"? Loading Brother Rainard from: {rainard_path}")
    
    try:
        # Load and convert
        schema = SchemaMapper.map_from_file(str(rainard_path))
        
        print(f"? Conversion successful!")
        print(f"   Character: {schema.character_name}")
        print(f"   Tier: {schema.char_tier}")
        print(f"   Attacks: {len(schema.repeating_attacks)}")
        print(f"   Features: {len(schema.repeating_features)}")
        print(f"   Unique Abilities: {len(schema.repeating_uniqueabilities)}")
        
        # Validate the result
        validator = SchemaValidator()
        is_valid, errors, warnings = validator.validate_schema(schema)
        
        print(f"\n?? Validation Results:")
        print(f"   Valid: {is_valid}")
        print(f"   Errors: {len(errors)}")
        print(f"   Warnings: {len(warnings)}")
        
        if errors:
            print("\n? Errors:")
            for error in errors:
                print(f"     {error}")
        
        if warnings:
            print("\n??  Warnings:")
            for warning in warnings:
                print(f"     {warning}")
        
        # Save the schema for inspection
        output_path = Path(__file__).parent / "brother_rainard_schema.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(schema.to_json())
        
        print(f"\n?? Schema saved to: {output_path}")
        
        # Test specific mappings
        print(f"\n?? Testing Specific Mappings:")
        
        # Check attacks
        if schema.repeating_attacks:
            first_attack = list(schema.repeating_attacks.values())[0]
            print(f"   First attack: {first_attack.get('AttackName', 'Unknown')}")
            
            # Check for Heavy Strike mapping
            if first_attack.get('HeavyStrike') == '1':
                print(f"   ? Heavy Strike correctly mapped")
            else:
                print(f"   ? Heavy Strike not found")
        
        # Check unique abilities (Shield should be here)
        shield_found = False
        for ability in schema.repeating_uniqueabilities.values():
            if 'shield' in ability.get('char_uniqueAbilities', '').lower():
                shield_found = True
                print(f"   ? Shield found in unique abilities")
                break
        
        if not shield_found:
            print(f"   ? Shield not found in unique abilities")
        
        return is_valid
        
    except Exception as e:
        print(f"? Conversion failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("?? Testing Brother Rainard Conversion")
    print("=" * 50)
    
    success = test_brother_rainard_conversion()
    
    print("\n" + "=" * 50)
    if success:
        print("?? Test completed successfully!")
    else:
        print("?? Test failed!")
