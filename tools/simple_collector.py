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
DEFAULT_PRESET = 'backend'

# ============================================================================
# SIMPLE PRESETS - Just lists of files/folders to include
# ============================================================================

PRESETS = {
    'web_builder_core': [
        'rulebook/character-builder/character-builder.html',
        'rulebook/character-builder/app.js',
        'rulebook/character-builder/core/',
        'rulebook/character-builder/ui/',
        'rulebook/character-builder/systems/',
        'rulebook/character-builder/css/',
        'rulebook/character-builder/calculators/',

        'CLAUDE.md',

        'docs/',
        'README.md'
    ],



    'web_builder_all': [
        'rulebook/character-builder/',
        'rulebook/rules/',

        'tests/',
        'package-lock.json',
        'package.json',
        'playwright.config.js',

        'docs/',
        'CLAUDE.md',
        '.claude/',
        'README.md'],

    'tools_transcriber': [
        'src/transcriber/',
        'README.md'
    ],

    'web_builder_most': [
        'rulebook/character-builder/character-builder.html',
        'rulebook/character-builder/app.js',
        'rulebook/character-builder/core/',
        'rulebook/character-builder/ui/',
        'rulebook/character-builder/systems/',
        'rulebook/character-builder/css/',
        'rulebook/character-builder/calculators/',

        'CLAUDE.md',

        'docs/',
        'README.md'
    ],

    'web_builder_rules_updater': [
        'rulebook/character-builder/core/',
        'rulebook/character-builder/calculators/',
        'rulebook/character-builder/data/',

        'rulebook/rules/rulebook.md',

        'docs/',
        'README.md'
    ],

    'web_builder_main_points': [
    'rulebook/character-builder/character-builder.html',
    'rulebook/character-builder/css/character-builder.css',
    'rulebook/character-builder/app.js',
    'rulebook/character-builder/ui/CharacterBuilder.js',
    'rulebook/character-builder/ui/shared/RenderUtils.js',
    'rulebook/character-builder/ui/shared/EventManager.js',
    'rulebook/character-builder/ui/shared/UpdateManager.js',
    'rulebook/character-builder/ui/components/CharacterLibrary.js',
    'rulebook/character-builder/ui/components/CharacterTree.js',
    'rulebook/character-builder/ui/components/PointPoolDisplay.js',
    'rulebook/character-builder/ui/components/ValidationDisplay.js',
    'rulebook/character-builder/ui/tabs/MainPoolTab.js',
    'rulebook/character-builder/ui/components/FlawPurchaseSection.js',
    'rulebook/character-builder/ui/components/TraitPurchaseSection.js',
    'rulebook/character-builder/ui/components/SimpleBoonSection.js',
    'rulebook/character-builder/ui/components/UniqueAbilitySection.js',
    'rulebook/character-builder/ui/components/ActionUpgradeSection.js',
    'rulebook/character-builder/systems/TraitFlawSystem.js',
    'rulebook/character-builder/systems/SimpleBoonsSystem.js',
    'rulebook/character-builder/systems/UniqueAbilitySystem.js',
    'rulebook/character-builder/systems/ActionSystem.js',
    'rulebook/character-builder/calculators/PointPoolCalculator.js',
    'rulebook/character-builder/core/VitalityCharacter.js',
    'rulebook/character-builder/core/GameConstants.js',
    'rulebook/character-builder/core/GameDataManager.js',
    'rulebook/character-builder/core/TierSystem.js',
    'rulebook/character-builder/validators/CharacterValidator.js',
    'rulebook/character-builder/ui/tabs/BasicInfoTab.js',
    'rulebook/character-builder/ui/tabs/ArchetypeTab.js',
    'rulebook/character-builder/ui/tabs/AttributeTab.js',
    'rulebook/character-builder/systems/ArchetypeSystem.js',
    'rulebook/character-builder/systems/AttributeSystem.js',
    'rulebook/character-builder/calculators/StatCalculator.js',
    'rulebook/character-builder/data/actions.json',
    'rulebook/character-builder/data/archetypes.json',
    'rulebook/character-builder/data/attack_types_definitions.json',
    'rulebook/character-builder/data/boons_simple.json',
    'rulebook/character-builder/data/conditions_advanced.json',
    'rulebook/character-builder/data/conditions_basic.json',
    'rulebook/character-builder/data/descriptors.json',
    'rulebook/character-builder/data/effect_types_definitions.json',
    'rulebook/character-builder/data/expertise_categories.json',
    'rulebook/character-builder/data/features.json',
    'rulebook/character-builder/data/flaws.json',
    'rulebook/character-builder/data/movement_features.json',
    'rulebook/character-builder/data/senses.json',
    'rulebook/character-builder/data/stat_options_generic.json',
    'rulebook/character-builder/data/trait_conditions.json',
    'rulebook/character-builder/data/unique_abilities_complex.json',

],







    'story': [
        'rulebook/campaign-overview/',
        
        'rulebook/rules/rulebook.md',

        'characters/schema/',
        'README.md'
        ],

    'src': [
        'src/',
        'README.md',
        'CLAUDE.md',
        'docs/',
        'main.py',
        'characters/schema/',
        'characters/'

    ],


    'testing_minimum': [
        # Tier 1: Absolutely Necessary (Bare Minimum)
        # The web application itself, the test framework, and the rules the AI needs.
        'rulebook/character-builder/',
        'rulebook/rules/rulebook.md',
        'tests/',
        'playwright.config.js',
        'package.json',
        'package-lock.json',
    ],

    'testing_recommended': [
        # Tier 1.5: The recommended preset for most testing tasks.
        # Includes the bare minimum code plus the most critical architectural
        # and specification documents for better context-aware solutions.
        
        # Core App & Test Framework
        'rulebook/character-builder/',
        'rulebook/rules/rulebook.md',
        'tests/',
        'playwright.config.js',
        'package.json',
        'package-lock.json',

        # High-Value Documentation
        'docs/architecture/',
        'docs/specs_and_notes/',
        '.claude/',
        'CLAUDE.md',
        'README.md',
    ],

    'testing_recommended_with_logs': [
        # Tier 1.6: The recommended preset for most testing tasks.
        # Includes the bare minimum code plus the most critical architectural
        # and specification documents for better context-aware solutions.
        # and some web dev logs
        
        # Core App & Test Framework
        'rulebook/character-builder/',
        'rulebook/rules/rulebook.md',
        'tests/',
        'playwright.config.js',
        'package.json',
        'package-lock.json',

        # High-Value Documentation
        'docs/architecture/',
        'docs/specs_and_notes/',
        '.claude/',
        'CLAUDE.md',
        'README.md',

        # Logs
        'docs/dev_logs/web_dev_logs/20-29_Phase_Testing_and_Integration',
    ],



    'testing_core': [
        # Tier 1 + Tier 2: Core files plus architectural guides.
        # This is the recommended preset for most web builder testing tasks.
        
        # Tier 1 Files
        'rulebook/character-builder/',
        'rulebook/rules/rulebook.md',
        'tests/',
        'playwright.config.js',
        'package.json',
        'package-lock.json',

        # Tier 2 Files (Guides & Specs)
        'docs/',
        '.claude/',
        'CLAUDE.md',
        'README.md'
    ],

    'everything': [
        # Complete codebase collection - includes everything
        'rulebook/',
        'src/',
        'simulator/',
        'sim/',
        'tests/',
        'docs/',
        'characters/',
        'analysis/',
        '.claude/',
        'CLAUDE.md',
        'README.md',
        'main.py',
        'requirements.txt',
        'sim_requirements.txt',
        'package.json',
        'package-lock.json',
        'playwright.config.js',
        '.gitignore'
    ],

    'overview': [
        # High-level overview - excludes deep nested files and less critical content
        # Core application files
        'rulebook/character-builder/character-builder.html',
        'rulebook/character-builder/app.js',
        'rulebook/character-builder/core/',
        'rulebook/character-builder/systems/',
        'rulebook/character-builder/calculators/',
        'rulebook/character-builder/data/archetypes.json',
        'rulebook/character-builder/data/attributes.json',
        'rulebook/character-builder/data/flaws.json',
        'rulebook/character-builder/data/features.json',
        'rulebook/character-builder/data/tiers.json',
        
        # Main rules and docs
        'rulebook/rules/rulebook.md',
        'rulebook/index.html',
        
        # Core Python files
        'src/api/',
        'src/character/',
        'src/utils/',
        'main.py',
        
        # Simulation core
        'simulator/core/',
        'simulator/main.py',
        'sim/scenarios/',
        
        # Key documentation
        'docs/architecture/',
        'docs/simulation-engine.md',
        '.claude/',
        'CLAUDE.md',
        'README.md',
        
        # Project config
        'requirements.txt',
        'package.json',
        'playwright.config.js'
    ],

    'sim_testing': [
        # Everything related to simulation, simulator, and testing
        'simulator/',
        'sim/',
        'tests/',
        'analysis/',
        'main.py',
        'requirements.txt',
        'sim_requirements.txt',
        'package.json',
        'package-lock.json',
        'playwright.config.js',
        'docs/simulation-engine.md',
        'docs/specs_and_notes/ai_testing_plan.md',
        'docs/specs_and_notes/notes-testing.md',
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