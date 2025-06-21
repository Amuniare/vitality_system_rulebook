import json
from pathlib import Path
import datetime

def build_unified_data():
    """
    Scans the modernApp/data/partials/ directory, merges all JSON files,
    and creates the final unified-game-data.json file.
    """
    root_dir = Path(__file__).parent.parent
    partials_dir = root_dir / 'modernApp' / 'data' / 'partials'
    output_path = root_dir / 'modernApp' / 'data' / 'unified-game-data.json'
    
    if not partials_dir.exists():
        print(f"Error: Partials directory not found at {partials_dir}")
        return

    # Initialize the master data structure
    unified_data = {
        "schemaVersion": "3.1",
        "metadata": {
            "lastUpdated": datetime.datetime.now().isoformat(),
            "source": "Generated from partials"
        },
        "entities": {}
        # We can add complexSystems or other top-level keys here if needed later
    }

    print(f"Scanning for partials in: {partials_dir}")

    # Iterate through all .json files in the partials directory
    for partial_file in partials_dir.glob('*.json'):
        try:
            with open(partial_file, 'r', encoding='utf-8') as f:
                partial_data = json.load(f)
                
                # The partial file is expected to be a dictionary of entities
                if isinstance(partial_data, dict):
                    print(f"  Merging {len(partial_data)} entities from {partial_file.name}...")
                    # Check for key collisions
                    for key in partial_data:
                        if key in unified_data["entities"]:
                            print(f"    [WARNING] Duplicate key '{key}' found. Overwriting with data from {partial_file.name}.")
                    
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
    except Exception as e:
        print(f"\n❌ Failed to write unified data file: {e}")

if __name__ == '__main__':
    build_unified_data()