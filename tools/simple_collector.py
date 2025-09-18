"""
Simple Codebase Collector - Config Edition
Gathers files based on presets. Supports including and excluding paths.
- To include a path: 'path/to/include'
- To exclude a path: '!path/to/exclude'
Exclusions are processed after all inclusions.
"""
import os
from pathlib import Path
import datetime
import sys

# ============================================================================
# SKIP DIRECTORY TREE OPTION
# ============================================================================
SKIP_DIRECTORY_TREE = True  # Set to True to skip directory tree generation

# ============================================================================
# DEFAULT PRESET (when run without arguments)
# ============================================================================
DEFAULT_PRESET = 'rogue_trader_character_builder'

# ============================================================================
# PRESETS - Define what to include and exclude
# ============================================================================

PRESETS = {

    'root': [
        # Base root files that are commonly included
        'CLAUDE.md',
        '.claude/',
        'README.md',
        'requirements.txt',
        'docs/',
        '.gemini/'        
    ],
    
    'root_modern_app': [
        '--root',
        'modernApp/',
        'tools/build_game_data.py'
    ],
    
    'data_transfer': [
        'frontend/rules/rulebook.md',
        'modernApp/',
    ],
    'root_backend': [
        '--root',
        'src/backend/',
    ],
    'front_back_end': [
        '--root',
        'modernApp/',
        'src/',
    ],
    'everything': [
        '--root',
        'modernApp/',
        'src/',
        'simulation/',
    ],
    'overview': [
        'modernApp/app.js',
        'modernApp/core/',
        'modernApp/systems/',
        'modernApp/data/unified-game-data.json',
        'src/backend/api/',
        'src/backend/character/',
        'simulation/engine/main.py',
        'CLAUDE.md',
        'README.md',
        'requirements.txt',
    ],

    'rogue_trader': [
        'frontend/campaigns/rogue_trader/briefing/campaign_overview.md',
        'frontend/campaigns/rogue_trader/campaign_log/dynasty-resources.md ',
        'frontend/campaigns/rogue_trader/gm_only/arc_2_overview.md',
        'frontend/campaigns/rogue_trader/campaign_log/session-summaries.md ',
        'frontend/campaigns/rogue_trader/gm_only/scene_breakdown.md',
        'frontend/campaigns/rogue_trader/campaign_log/player-characters.md',
        'frontend/campaigns/rogue_trader/campaign_log/npcs.md',
        'frontend/campaigns/rogue_trader/gm_only/worldbuilding.md',
        'frontend/campaigns/rogue_trader/lore/factions.md'
    ],

    'rogue_trader_and_rules': [
        '--rogue_trader',
        'frontend/rules/rulebook.md',
    ],

    'rogue_trader_character_builder': [
        'all_data/characters/extracted/',
        'frontend/rules/rulebook.md',
        'all_data/characters/testing/template.json',
        'frontend/campaigns/rogue_trader/gm_only/char_sheet_gen.md',
        
    ],


    'scriptcards': [
        'src/scriptcards',
    ],

    'discord_bot': [
        'src/transcriber/',
        '--root',
    ],
    ''
    
    'discord_bot_data': [
        'all_data/rogue_trader/sessions/cleaned/',
        '--rogue_trader',
        '--root',
    ]

}

# ============================================================================
# EXCLUSION CONFIG
# ============================================================================
# Directories to always exclude from any search
ALWAYS_EXCLUDE_DIRS = {
    '.git', '__pycache__', 'node_modules', '.venv', 'logs', 
    'browser_profile', '.pytest_cache', 'dist', 'build',
    # We can now formally exclude the old frontend builder here
    'frontend' 
}
# Files to always exclude
ALWAYS_EXCLUDE_FILES = {
    'codebase.txt' # Exclude the output file itself
}

# ============================================================================
# DIRECTORY TREE BUILDER
# ============================================================================
def build_directory_tree():
    """Build directory tree representation, respecting exclusions."""
    root_path = Path.cwd()
    output = [f"{root_path.name}"]
    
    def add_tree_items(path, prefix=""):
        try:
            # Get items, filter, and sort: dirs first, then files
            items = list(path.iterdir())
            dirs = sorted([p for p in items if p.is_dir() and p.name not in ALWAYS_EXCLUDE_DIRS])
            files = sorted([p for p in items if p.is_file() and p.name not in ALWAYS_EXCLUDE_FILES])
            filtered_items = dirs + files
            
            for i, item_path in enumerate(filtered_items):
                is_last_item = i == len(filtered_items) - 1
                connector = "└── " if is_last_item else "├── "
                
                output.append(f"{prefix}{connector}{item_path.name}")
                
                if item_path.is_dir():
                    new_prefix = prefix + ("    " if is_last_item else "│   ")
                    add_tree_items(item_path, new_prefix)
                    
        except PermissionError:
            output.append(f"{prefix}└── [Permission denied]")
            
    add_tree_items(root_path)
    return "\n".join(output)

# ============================================================================
# PRESET REFERENCE RESOLVER
# ============================================================================
def resolve_preset_references(preset_name, visited=None):
    """Resolve preset references recursively, expanding --preset_name entries."""
    if visited is None:
        visited = set()
    
    if preset_name in visited:
        raise ValueError(f"Circular preset reference detected: {preset_name}")
    
    if preset_name not in PRESETS:
        raise ValueError(f"Unknown preset: {preset_name}")
    
    visited.add(preset_name)
    resolved_paths = []
    
    for item in PRESETS[preset_name]:
        if item.startswith('--'):
            referenced_preset = item[2:]
            resolved_paths.extend(resolve_preset_references(referenced_preset, visited.copy()))
        else:
            resolved_paths.append(item)
    
    return resolved_paths

# ============================================================================
# FILE COLLECTOR
# ============================================================================
def collect_files(preset_name):
    """Collect files based on preset, handling inclusions and exclusions."""
    if preset_name not in PRESETS:
        print(f"Unknown preset: {preset_name}")
        print(f"Available: {', '.join(PRESETS.keys())}")
        return None
    
    os.chdir(Path(__file__).parent.parent)
    root_path = Path.cwd()
    
    try:
        resolved_paths = resolve_preset_references(preset_name)
    except ValueError as e:
        print(f"Error: {e}")
        return None

    # Separate include and exclude patterns
    include_patterns = [p for p in resolved_paths if not p.startswith('!')]
    exclude_patterns = [p[1:] for p in resolved_paths if p.startswith('!')]

    print(f"Using preset: '{preset_name}'")
    print(f"Root path: {root_path}")
    print(f"Including: {include_patterns}")
    print(f"Excluding: {exclude_patterns}")

    # 1. Collect all files based on inclusion patterns
    included_files = set()
    for path_str in include_patterns:
        path = Path(path_str)
        if path.is_file():
            included_files.add(path)
        elif path.is_dir():
            for root, dirs, files in os.walk(path):
                dirs[:] = [d for d in dirs if d not in ALWAYS_EXCLUDE_DIRS]
                for file in files:
                    file_path = Path(root) / file
                    if file_path.name not in ALWAYS_EXCLUDE_FILES:
                        included_files.add(file_path)

    # 2. Filter out files based on exclusion patterns
    final_files = set()
    exclude_paths = [Path(p) for p in exclude_patterns]

    for file_path in included_files:
        is_excluded = False
        for excluded_path in exclude_paths:
            if excluded_path.is_dir() and file_path.is_relative_to(excluded_path):
                is_excluded = True
                break
            elif file_path == excluded_path:
                is_excluded = True
                break
        if not is_excluded:
            final_files.add(file_path)
            
    return sorted(list(final_files))

# ============================================================================
# STATS & OUTPUT GENERATION
# ============================================================================
def calculate_file_stats(files):
    """Calculate statistics about the collected files."""
    total_lines, total_size = 0, 0
    for file_path in files:
        try:
            with file_path.open('r', encoding='utf-8', errors='replace') as f:
                content = f.read()
                total_lines += content.count('\n') + 1
                total_size += len(content.encode('utf-8'))
        except Exception:
            pass
    return {
        'file_count': len(files),
        'total_lines': total_lines,
        'total_size_kb': total_size / 1024
    }

def generate_output(files, preset_name, output_file='codebase.txt'):
    """Generate the output file."""
    stats = calculate_file_stats(files)
    if not SKIP_DIRECTORY_TREE:
        tree = build_directory_tree()
    
    output_lines = []
    
    def write_section(title, content):
        output_lines.append("=" * 60)
        output_lines.append(title)
        output_lines.append("=" * 60)
        output_lines.append(content)
        output_lines.append("")

    # Header
    header_content = (
        f"Preset: {preset_name}\n"
        f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"Total files: {stats['file_count']}\n"
        f"Total lines: {stats['total_lines']}\n"
        f"Total size: {stats['total_size_kb']:.1f} KB"
    )
    write_section("CODEBASE COLLECTION", header_content)
    
    # Directory tree and File list
    if not SKIP_DIRECTORY_TREE:
        write_section("DIRECTORY STRUCTURE", tree)
    
    file_list_content = []
    for file_path in files:
        try:
            with file_path.open('r', encoding='utf-8', errors='replace') as f:
                content = f.read()
                lines = content.count('\n') + 1
                size_kb = len(content.encode('utf-8')) / 1024
            file_list_content.append(f"FILE: {file_path.as_posix()} ({lines} lines, {size_kb:.1f} KB)")
        except Exception as e:
            file_list_content.append(f"ERROR: {file_path.as_posix()} ({e})")
    write_section("FILE LIST", "\n".join(file_list_content))

    # File contents
    output_lines.append("=" * 60)
    output_lines.append("FILE CONTENTS")
    output_lines.append("=" * 60)
    for file_path in files:
        try:
            with file_path.open('r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            output_lines.append("\n" + "=" * 60)
            output_lines.append(f"FILE: {file_path.as_posix()}")
            output_lines.append("=" * 60)
            output_lines.append(content)
        except Exception as e:
            output_lines.append(f"ERROR reading {file_path.as_posix()}: {e}")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))
    
    print(f"\nSaved {stats['file_count']} files to {output_file}")
    print(f"Total: {stats['total_lines']} lines, {stats['total_size_kb']:.1f} KB")

# ============================================================================
# MAIN EXECUTION
# ============================================================================
def main():
    """Main function to run the collector."""
    preset_name = DEFAULT_PRESET
    if len(sys.argv) > 1:
        preset_name = sys.argv[1]
    else:
        print(f"No preset specified, using default: '{preset_name}'")
        print(f"Available presets: {', '.join(PRESETS.keys())}")
        print()
    
    files = collect_files(preset_name)
    
    if files:
        generate_output(files, preset_name)
    else:
        print("No files collected for this preset.")

if __name__ == "__main__":
    main()