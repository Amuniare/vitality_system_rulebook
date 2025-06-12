"""
Simple Codebase Collector - Config Edition
Just lists of files/folders to include. That's it.
NO SYMBOLS - Plain text only
"""
import os
from pathlib import Path
import datetime

# ============================================================================
# DEFAULT PRESET (when run without arguments)
# ============================================================================
DEFAULT_PRESET = 'everything'

# ============================================================================
# SIMPLE PRESETS - Just lists of files/folders to include
# ============================================================================

PRESETS = {
    'web_builder_core': [
        'frontend/character-builder/character-builder.html',
        'frontend/character-builder/app/',
        'frontend/character-builder/core/',
        'frontend/character-builder/shared/',
        'frontend/character-builder/systems/',
        'frontend/character-builder/assets/css/',
        'frontend/character-builder/calculators/',

        'CLAUDE.md',

        'frontend/docs/',
        'README.md'
    ],



    'web_builder_all': [
        'frontend/character-builder/',
        'frontend/rules/',

        'simulation/package-lock.json',
        'simulation/package.json',
        'simulation/playwright.config.js',

        'frontend/docs/',
        'CLAUDE.md',
        'docs_planning/',
        'README.md'],

    'tools_transcriber': [
        'src/transcriber/',
        'README.md'
    ],

    'web_builder_most': [
        'frontend/character-builder/character-builder.html',
        'frontend/character-builder/app/',
        'frontend/character-builder/core/',
        'frontend/character-builder/shared/',
        'frontend/character-builder/systems/',
        'frontend/character-builder/assets/css/',
        'frontend/character-builder/calculators/',

        'CLAUDE.md',

        'frontend/docs/',
        'README.md'
    ],

    'web_builder_rules_updater': [
        'frontend/character-builder/core/',
        'frontend/character-builder/calculators/',
        'frontend/character-builder/data/',

        'frontend/rules/rulebook.md',

        'frontend/docs/',
        'README.md'
    ],

    'web_builder_main_points': [
    'frontend/character-builder/character-builder.html',
    'frontend/character-builder/assets/css/character-builder.css',
    'frontend/character-builder/app/app.js',
    'frontend/character-builder/app/CharacterBuilder.js',
    'frontend/character-builder/shared/utils/RenderUtils.js',
    'frontend/character-builder/shared/utils/EventManager.js',
    'frontend/character-builder/shared/utils/UpdateManager.js',
    'frontend/character-builder/shared/ui/CharacterLibrary.js',
    'frontend/character-builder/shared/ui/CharacterTree.js',
    'frontend/character-builder/shared/ui/PointPoolDisplay.js',
    'frontend/character-builder/shared/ui/ValidationDisplay.js',
    'frontend/character-builder/features/main-pool/MainPoolTab.js',
    'frontend/character-builder/features/main-pool/components/FlawPurchaseSection.js',
    'frontend/character-builder/features/main-pool/components/TraitPurchaseSection.js',
    'frontend/character-builder/features/main-pool/components/SimpleBoonSection.js',
    'frontend/character-builder/features/main-pool/components/UniqueAbilitySection.js',
    'frontend/character-builder/features/main-pool/components/ActionUpgradeSection.js',
    'frontend/character-builder/systems/TraitFlawSystem.js',
    'frontend/character-builder/systems/SimpleBoonsSystem.js',
    'frontend/character-builder/systems/UniqueAbilitySystem.js',
    'frontend/character-builder/systems/ActionSystem.js',
    'frontend/character-builder/calculators/PointPoolCalculator.js',
    'frontend/character-builder/core/VitalityCharacter.js',
    'frontend/character-builder/core/GameConstants.js',
    'frontend/character-builder/core/GameDataManager.js',
    'frontend/character-builder/core/TierSystem.js',
    'frontend/character-builder/features/basic-info/BasicInfoTab.js',
    'frontend/character-builder/features/archetypes/ArchetypeTab.js',
    'frontend/character-builder/features/attributes/AttributeTab.js',
    'frontend/character-builder/systems/ArchetypeSystem.js',
    'frontend/character-builder/systems/AttributeSystem.js',
    'frontend/character-builder/calculators/StatCalculator.js',
    'frontend/character-builder/data/actions.json',
    'frontend/character-builder/data/archetypes.json',
    'frontend/character-builder/data/attack_types_definitions.json',
    'frontend/character-builder/data/boons_simple.json',
    'frontend/character-builder/data/conditions_advanced.json',
    'frontend/character-builder/data/conditions_basic.json',
    'frontend/character-builder/data/descriptors.json',
    'frontend/character-builder/data/effect_types_definitions.json',
    'frontend/character-builder/data/expertise.json',
    'frontend/character-builder/data/features.json',
    'frontend/character-builder/data/flaws.json',
    'frontend/character-builder/data/movement_features.json',
    'frontend/character-builder/data/senses.json',
    'frontend/character-builder/data/stat_options_generic.json',
    'frontend/character-builder/data/trait_conditions.json',
    'frontend/character-builder/data/unique_abilities_complex.json',

],



    'backend': [
        'src/',
        'README.md',
        'CLAUDE.md',
        'logs.md'
    ],



    'story': [
        'frontend/campaigns/',
        
        'frontend/rules/rulebook.md',

        'README.md'
        ],

    'src': [
        'src/',
        'README.md',
        'CLAUDE.md',
        'src/docs/',

    ],


    'testing_minimum': [
        # Tier 1: Absolutely Necessary (Bare Minimum)
        # The web application itself, the test framework, and the rules the AI needs.
        'frontend/character-builder/',
        'frontend/rules/rulebook.md',
        'simulation/playwright.config.js',
        'simulation/package.json',
        'simulation/package-lock.json',
    ],

    'testing_recommended': [
        # Tier 1.5: The recommended preset for most testing tasks.
        # Includes the bare minimum code plus the most critical architectural
        # and specification documents for better context-aware solutions.
        
        # Core App & Test Framework
        'frontend/character-builder/',
        'frontend/rules/rulebook.md',
        'simulation/playwright.config.js',
        'simulation/package.json',
        'simulation/package-lock.json',

        # High-Value Documentation
        'frontend/docs/specs_and_notes/',
        'docs_planning/',
        'CLAUDE.md',
        'README.md',
    ],

    'testing_recommended_with_logs': [
        # Tier 1.6: The recommended preset for most testing tasks.
        # Includes the bare minimum code plus the most critical architectural
        # and specification documents for better context-aware solutions.
        # and some web dev logs
        
        # Core App & Test Framework
        'frontend/character-builder/',
        'frontend/rules/rulebook.md',
        'simulation/playwright.config.js',
        'simulation/package.json',
        'simulation/package-lock.json',

        # High-Value Documentation
        'frontend/docs/specs_and_notes/',
        'docs_planning/',
        'CLAUDE.md',
        'README.md',

        # Logs
        'frontend/docs/dev_logs/20-29_Phase_Testing_and_Integration/',
    ],



    'testing_core': [
        # Tier 1 + Tier 2: Core files plus architectural guides.
        # This is the recommended preset for most web builder testing tasks.
        
        # Tier 1 Files
        'frontend/character-builder/',
        'frontend/rules/rulebook.md',
        'simulation/playwright.config.js',
        'simulation/package.json',
        'simulation/package-lock.json',

        # Tier 2 Files (Guides & Specs)
        'frontend/docs/',
        'docs_planning/',
        'CLAUDE.md',
        'README.md'
    ],

    # ============================================================================
    # NEW REQUESTED PRESETS
    # ============================================================================

    'root_files_planning_all_docs_claude': [
        # Root files + planning + all docs / claude files
        'CLAUDE.md',
        'README.md',
        'requirements.txt',
        'docs_planning/',
        
        # Planning
        'docs_planning/',
        
        # All docs and claude files
        'frontend/docs/',
        'src/docs/',
        'simulation/docs/',
        'frontend/character-builder/CLAUDE.md',
        'frontend/character-builder/app/CLAUDE.md',
        'frontend/character-builder/assets/css/CLAUDE.md',
        'frontend/character-builder/calculators/CLAUDE.md',
        'frontend/character-builder/core/CLAUDE.md',
        'frontend/character-builder/features/CLAUDE.md',
        'frontend/character-builder/shared/CLAUDE.md',
        'frontend/character-builder/systems/CLAUDE.md',
        'src/CLAUDE.md',
        'src/backend/api/CLAUDE.md',
        'src/backend/character/CLAUDE.md',
        'src/backend/utils/CLAUDE.md',
        'src/roll20_api/CLAUDE.md',
    ],

    'root_simulation': [
        # Root files + simulation
        'CLAUDE.md',
        'README.md',
        'requirements.txt',
        'docs_planning/',        
        'simulation/',
    ],

    'root_src': [
        # Root files + src
        'CLAUDE.md',
        'README.md',
        'requirements.txt',
        'docs_planning/',
        'src/',
    ],

    'root_frontend': [
        # Root files + frontend
        'CLAUDE.md',
        'README.md',
        'requirements.txt',
        'docs_planning/',
        
        'frontend/',
    ],

    'root_character_builder': [
        # Root files + character-builder
        'CLAUDE.md',
        'README.md',
        'requirements.txt',
        'docs_planning/',
        'frontend/character-builder/',
    ],

    'root_character_builder_minus_data': [
        # Root files + character-builder minus data
        'CLAUDE.md',
        'README.md',
        'requirements.txt',
        'docs_planning/',
        'frontend/character-builder/character-builder.html',
        'frontend/character-builder/CLAUDE.md',
        'frontend/character-builder/app/',
        'frontend/character-builder/assets/',
        'frontend/character-builder/calculators/',
        'frontend/character-builder/core/',
        'frontend/character-builder/features/',
        'frontend/character-builder/shared/',
        'frontend/character-builder/systems/',
    ],

    'root_backend': [
        # Root files + backend
        'CLAUDE.md',
        'README.md',
        'requirements.txt',
        'docs_planning/',
        'src/backend/',
    ],

    'root_backend_scriptcards_api': [
        # Root files + backend + scriptcards + api
        'CLAUDE.md',
        'README.md',
        'requirements.txt',
        'docs_planning/',
        'src/backend/',
        'src/scriptcards/',
        'src/roll20_api/',
    ],



    'everything': [
        # Complete codebase collection - includes everything
        'frontend/',
        'src/',
        'simulation/',

        'CLAUDE.md',
        'README.md',
        'docs_planning/',
        
        'requirements.txt',
        '.gitignore'
    ],

    'overview': [
        # High-level overview - excludes deep nested files and less critical content
        # Core application files
        'frontend/character-builder/character-builder.html',
        'frontend/character-builder/app/',
        'frontend/character-builder/core/',
        'frontend/character-builder/systems/',
        'frontend/character-builder/calculators/',
        'frontend/character-builder/data/archetypes.json',
        'frontend/character-builder/data/attributes.json',
        'frontend/character-builder/data/flaws.json',
        'frontend/character-builder/data/features.json',
        'frontend/character-builder/data/tiers.json',
        
        # Main rules and docs
        'frontend/rules/rulebook.md',
        'frontend/index.html',
        
        # Core Python files
        'src/backend/api/',
        'src/backend/character/',
        'src/backend/utils/',
        
        # Simulation core
        'simulation/engine/core/',
        'simulation/engine/main.py',
        'simulation/scenarios/',
        
        # Key documentation
        'simulation/docs/simulation-engine.md',
        'docs_planning/',
        'CLAUDE.md',
        'README.md',
        
        # Project config
        'requirements.txt',
        'simulation/package.json',
        'simulation/playwright.config.js'
    ],

    'sim_testing': [
        # Everything related to simulation, simulator, and testing
        'simulation/',
        'rulebook/',
        'requirements.txt',
        'simulation/package.json',
        'simulation/package-lock.json',
        'simulation/playwright.config.js',
        'simulation/docs/simulation-engine.md',
        'frontend/docs/specs_and_notes/ai_testing_plan.md',
        'frontend/docs/specs_and_notes/notes-testing.md',
        'CLAUDE.md',
        'README.md'
    ],







}

# ============================================================================
# DIRECTORY TREE EXCLUSIONS
# ============================================================================
TREE_EXCLUDE_DIRS = {
    '.git', '__pycache__', 'node_modules', '.venv', 'logs', 
    'browser_profile', '.pytest_cache', 'dist', 'build'
}

# ============================================================================
# DIRECTORY TREE BUILDER
# ============================================================================

def build_directory_tree():
    """Build directory tree representation."""
    # Determine root path (go up one level since we're in tools/ or src/transcriber/)
    if Path.cwd().name == 'tools':
        root_path = Path.cwd().parent
    elif Path.cwd().name == 'transcriber' and Path.cwd().parent.name == 'src':
        root_path = Path.cwd().parent.parent
    else:
        root_path = Path.cwd()
    
    output = [str(root_path.name)]
    
    def add_tree_items(path, prefix="", is_last=True):
        if not path.is_dir():
            return
        
        try:
            items = sorted(path.iterdir())
            
            # Filter out excluded directories and files
            filtered_items = []
            for item in items:
                if item.is_dir():
                    if item.name not in TREE_EXCLUDE_DIRS:
                        filtered_items.append((item, item.name, True))  # True = is_dir
                elif item.is_file():
                    if not item.name.startswith('.') and not item.name.endswith(('.pyc', '.tmp', '.log')):
                        filtered_items.append((item, item.name, False))  # False = is_file
            
            # Add items to tree
            for i, (item_path, item_name, is_dir) in enumerate(filtered_items):
                is_last_item = i == len(filtered_items) - 1
                connector = "└── " if is_last_item else "├── "
                
                output.append(f"{prefix}{connector}{item_name}")
                
                if is_dir:
                    new_prefix = prefix + ("    " if is_last_item else "│   ")
                    add_tree_items(item_path, new_prefix, is_last_item)
                    
        except PermissionError:
            output.append(f"{prefix}[Permission denied]")
    
    add_tree_items(root_path)
    return "\n".join(output)

# ============================================================================
# SIMPLE COLLECTOR
# ============================================================================

def collect_files(preset_name):
    """Collect files based on preset."""
    if preset_name not in PRESETS:
        print(f"Unknown preset: {preset_name}")
        print(f"Available: {', '.join(PRESETS.keys())}")
        return None
    
    # Determine root path (go up one level since we're in tools/ or src/transcriber/)
    if Path.cwd().name == 'tools':
        root_path = Path.cwd().parent
    elif Path.cwd().name == 'transcriber' and Path.cwd().parent.name == 'src':
        root_path = Path.cwd().parent.parent
    else:
        root_path = Path.cwd()
    os.chdir(root_path)  # Change to root directory
    
    paths_to_include = PRESETS[preset_name]
    collected_files = set()
    
    print(f"Using preset: {preset_name}")
    print(f"Root path: {root_path}")
    print(f"Including: {paths_to_include}")
    
    for path_str in paths_to_include:
        path = Path(path_str)
        
        # Handle regular files
        if path.is_file():
            collected_files.add(path)
            print(f"  Added file: {path}")
            
        # Handle directories
        elif path.is_dir():
            print(f"  Adding directory: {path}")
            for root, dirs, files in os.walk(path):
                # Skip excluded directories
                dirs[:] = [d for d in dirs if d not in TREE_EXCLUDE_DIRS]
                
                for file in files:
                    file_path = Path(root) / file
                    # Skip junk files
                    if not any(file.endswith(ext) for ext in {'.pyc', '.tmp', '.log'}):
                        collected_files.add(file_path)
        else:
            print(f"  Not found: {path_str}")
    
    return sorted(collected_files)

def calculate_file_stats(files):
    """Calculate statistics about the collected files."""
    total_lines = 0
    total_size = 0
    file_count = len(files)
    
    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
                lines = content.count('\n') + (1 if content and not content.endswith('\n') else 0)
                total_lines += lines
                total_size += len(content.encode('utf-8'))
        except:
            pass
    
    return {
        'file_count': file_count,
        'total_lines': total_lines,
        'total_size_kb': total_size / 1024
    }

def generate_output(files, preset_name, output_file='codebase.txt'):
    """Generate the output file."""
    stats = calculate_file_stats(files)
    tree = build_directory_tree()
    
    output = []
    
    # Header with stats
    output.append("=" * 60)
    output.append("CODEBASE COLLECTION")
    output.append("=" * 60)
    output.append(f"Preset: {preset_name}")
    output.append(f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    output.append(f"Total files: {stats['file_count']}")
    output.append(f"Total lines: {stats['total_lines']}")
    output.append(f"Total size: {stats['total_size_kb']:.1f} KB")
    output.append("")
    
    # Directory tree
    output.append("=" * 60)
    output.append("DIRECTORY STRUCTURE")
    output.append("=" * 60)
    output.append(tree)
    output.append("")
    
    # File list with stats
    output.append("=" * 60)
    output.append("FILE LIST")
    output.append("=" * 60)
    
    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
                lines = content.count('\n') + (1 if content and not content.endswith('\n') else 0)
                size_kb = len(content.encode('utf-8')) / 1024
            
            output.append(f"FILE: {file_path} ({lines} lines, {size_kb:.1f} KB)")
            
        except Exception as e:
            output.append(f"ERROR: {file_path} ({e})")
    
    output.append("")
    
    # File contents
    output.append("=" * 60)
    output.append("FILE CONTENTS")
    output.append("=" * 60)
    
    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            
            output.append("")
            output.append("=" * 60)
            output.append(f"FILE: {file_path}")
            output.append("=" * 60)
            output.append(content)
            
        except Exception as e:
            output.append(f"ERROR reading {file_path}: {e}")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output))
    
    print(f"\nSaved {stats['file_count']} files to {output_file}")
    print(f"Total: {stats['total_lines']} lines, {stats['total_size_kb']:.1f} KB")

def main():
    """Main function."""
    import sys
    
    # Use argument if provided, otherwise use default
    if len(sys.argv) >= 2:
        preset_name = sys.argv[1]
    else:
        preset_name = DEFAULT_PRESET
        print(f"No preset specified, using default: {preset_name}")
        print(f"Available presets: {', '.join(PRESETS.keys())}")
        print()
    
    files = collect_files(preset_name)
    
    if files:
        generate_output(files, preset_name)
    else:
        print("No files collected!")

if __name__ == "__main__":
    main()