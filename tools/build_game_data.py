import json
from pathlib import Path
import datetime

def build_unified_data():
    """
    Scans the modernApp/data/partials/ directory, intelligently merges all 
    JSON files into a unified data structure, and creates the final 
    unified-game-data.json file according to the v4.0 schema.
    """
    root_dir = Path(__file__).parent.parent
    partials_dir = root_dir / 'modernApp' / 'data' / 'partials'
    output_path = root_dir / 'modernApp' / 'data' / 'unified-game-data.json'
    
    if not partials_dir.exists():
        print(f"Error: Partials directory not found at {partials_dir}")
        return

    # Initialize the master data structure based on schema_final.md
    unified_data = {
        "schemaVersion": "4.0",
        "metadata": {
            "lastUpdated": datetime.datetime.now().isoformat(),
            "source": "Generated from partials"
        },
        "entities": {},
        "questionnaires": {},
        "bannedCombinations": [],
        "calculationFormulas": {} # Placeholder for future use
    }

    print(f"Scanning for partials in: {partials_dir}")

    # Iterate through all .json files in the partials directory
    for partial_file in sorted(partials_dir.glob('*.json')):
        try:
            with open(partial_file, 'r', encoding='utf-8') as f:
                content = f.read()
                if not content.strip():
                    print(f"  [INFO] Skipping empty file: {partial_file.name}")
                    continue
                partial_data = json.loads(content)
            
            # --- Special File Handling ---
            if partial_file.name == 'bio.json':
                print(f"  Processing special file: {partial_file.name} for questionnaires...")
                unified_data['questionnaires'] = partial_data.get('questionnaires', {})
                continue # Skip entity processing for this file

            # --- Generic File Processing ---
            
            # Check for and extract top-level 'bannedCombinations' array
            if 'bannedCombinations' in partial_data and isinstance(partial_data['bannedCombinations'], list):
                print(f"  Found 'bannedCombinations' in {partial_file.name}")
                unified_data['bannedCombinations'].extend(partial_data['bannedCombinations'])
                del partial_data['bannedCombinations'] # Remove so it's not treated as an entity

            # The rest of the file is assumed to be a dictionary of entities
            if isinstance(partial_data, dict):
                print(f"  Merging {len(partial_data)} entities from {partial_file.name}...")
                # Check for key collisions
                for key in partial_data:
                    if key in unified_data["entities"]:
                        print(f"    [WARNING] Duplicate entity key '{key}' found. Overwriting with data from {partial_file.name}.")
                
                unified_data["entities"].update(partial_data)
            else:
                print(f"  [WARNING] Skipping {partial_file.name}: Not a valid dictionary of entities.")

        except json.JSONDecodeError:
            print(f"  [ERROR] Failed to decode JSON from {partial_file.name}. Skipping.")
        except Exception as e:
            print(f"  [ERROR] An unexpected error occurred with {partial_file.name}: {e}")

    # Write the final unified data file
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(unified_data, f, indent=4)
        print(f"\n✅ Successfully created unified data file at: {output_path}")
        print(f"   Total entities: {len(unified_data['entities'])}")
        print(f"   Total banned combinations: {len(unified_data['bannedCombinations'])}")
        print(f"   Questionnaires loaded: {'Yes' if unified_data['questionnaires'] else 'No'}")
    except Exception as e:
        print(f"\n❌ Failed to write unified data file: {e}")

if __name__ == '__main__':
    build_unified_data()