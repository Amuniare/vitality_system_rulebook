#!/usr/bin/env python3
import os
from pathlib import Path
from datetime import datetime

# Configuration
PARTIALS_DIR = 'modernApp/css/partials'
OUTPUT_FILE = 'modernApp/css/modern-app.css'

def get_partial_files(partials_dir):
    """Get all CSS files in partials directory, sorted by name"""
    try:
        partials_path = Path(partials_dir)
        if not partials_path.exists():
            raise FileNotFoundError(f"Partials directory not found: {partials_dir}")
        
        files = [
            f.name for f in partials_path.iterdir() 
            if f.is_file() and f.suffix == '.css' and not f.name.startswith('_')
        ]
        
        return sorted(files)  # This will sort them by filename (01-, 02-, etc.)
        
    except Exception as error:
        raise Exception(f"Cannot read partials directory: {error}")

def get_section_header(filename):
    """Generate appropriate section header based on filename"""
    section_headers = {
        '01-header-and-reset.css': {
            'title': 'modernApp/css/modern-app.css',
            'subtitle': 'Original Base + Consolidated Component Styles',
            'format': 'main'
        },
        '02-variables.css': {
            'title': 'CSS CUSTOM PROPERTIES (THEME VARIABLES)',
            'subtitle': 'Original',
            'format': 'standard'
        },
        '03-global-styles.css': {
            'title': 'GLOBAL STYLES',
            'subtitle': 'Original',
            'format': 'standard'
        },
        '04-layout-structure.css': {
            'title': 'LAYOUT STRUCTURE',
            'subtitle': 'Original',
            'format': 'standard'
        },
        '05-navigation-tabs.css': {
            'title': 'NAVIGATION & TABS',
            'subtitle': 'Original',
            'format': 'standard'
        },
        '06-tab-content.css': {
            'title': 'TAB CONTENT',
            'subtitle': 'Original & Enhanced',
            'format': 'standard'
        },
        '07-pool-header.css': {
            'title': 'POOL HEADER & INFO',
            'subtitle': 'Original',
            'format': 'standard'
        },
        '08-section-content.css': {
            'title': 'SECTION CONTENT',
            'subtitle': 'Original',
            'format': 'standard'
        },
        '09-purchase-cards.css': {
            'title': 'PURCHASE GRID & CARDS',
            'subtitle': 'Original',
            'format': 'standard'
        },
        '10-buttons.css': {
            'title': 'BUTTONS',
            'subtitle': 'Original & Enhanced',
            'format': 'standard'
        },
        '11-summary.css': {
            'title': 'SUMMARY SECTION',
            'subtitle': 'Original',
            'format': 'standard'
        },
        '12-utilities.css': {
            'title': 'UTILITY CLASSES',
            'subtitle': 'Original',
            'format': 'standard'
        },
        '13-loading-states.css': {
            'title': 'LOADING STATES',
            'subtitle': 'Original',
            'format': 'standard'
        },
        '14-scrollbar.css': {
            'title': 'SCROLLBAR STYLING',
            'subtitle': 'Original',
            'format': 'standard'
        },
        '15-components.css': {
            'title': 'CONSOLIDATED COMPONENT-SPECIFIC STYLES',
            'subtitle': 'Styles extracted from JS components are placed below',
            'format': 'components'
        },
        '16-notifications.css': {
            'title': 'NOTIFICATION SYSTEM',
            'subtitle': 'If not already styled globally',
            'format': 'standard'
        },
        '17-responsive.css': {
            'title': 'RESPONSIVE DESIGN',
            'subtitle': 'Original - ensure this is at the end',
            'format': 'standard'
        },
        '18-print.css': {
            'title': 'PRINT STYLES',
            'subtitle': 'Original',
            'format': 'standard'
        },
        '19-attribute-controls.css': {
            'title': 'ATTRIBUTE CONTROLS',
            'subtitle': 'Original',
            'format': 'standard'
        }
    }
    
    if filename not in section_headers:
        return None
    
    header_info = section_headers[filename]
    title = header_info['title']
    subtitle = header_info['subtitle']
    format_type = header_info['format']
    
    if format_type == 'main':
        return f"""/* ==========================================================================
   {title}
   
   {subtitle}
   ========================================================================== */"""
    elif format_type == 'components':
        return f"""/* ==========================================================================
   {title}
   ({subtitle})
   ========================================================================== */"""
    else:  # standard
        return f"""/* =====================================================
   {title} ({subtitle})
   ===================================================== */"""

def clean_content(content):
    """Clean content to avoid duplicating END OF FILE comments"""
    # Remove any existing END OF FILE comments from partial content
    lines = content.split('\n')
    cleaned_lines = []
    
    skip_end_block = False
    for line in lines:
        # Check if we're starting an END OF FILE block
        if '/* ==========' in line and 'END OF FILE' in line:
            skip_end_block = True
            continue
        # Check if we're ending the block
        elif skip_end_block and '========== */' in line:
            skip_end_block = False
            continue
        # Skip lines that are part of the END OF FILE block
        elif skip_end_block:
            continue
        else:
            cleaned_lines.append(line)
    
    # Remove trailing empty lines
    while cleaned_lines and not cleaned_lines[-1].strip():
        cleaned_lines.pop()
    
    return '\n'.join(cleaned_lines)

def combine_css(partials_dir, output_file):
    """Combine all partial files with proper section headers"""
    files = get_partial_files(partials_dir)
    
    if not files:
        raise Exception('No CSS files found in partials directory')
    
    print('📋 Found CSS partials:')
    for file in files:
        print(f'  📄 {file}')
    print()
    
    combined_content = []
    processed_files = 0
    total_chars = 0
    
    for i, file in enumerate(files):
        file_path = Path(partials_dir) / file
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
            
            if not content:
                print(f'⚠️  Skipping empty file: {file}')
                continue
            
            # Clean content to remove any existing END OF FILE comments
            content = clean_content(content)
            
            if not content.strip():
                print(f'⚠️  Skipping file with no content after cleaning: {file}')
                continue
            
            # Add section header for better organization
            section_header = get_section_header(file)
            if section_header:
                combined_content.append(section_header)
            
            # Add the actual content
            combined_content.append(content)
            
            # Add spacing between sections (except for the last file)
            if i < len(files) - 1:
                combined_content.append('')  # Empty line between sections
            
            processed_files += 1
            total_chars += len(content)
            print(f'✅ Added: {file} ({len(content):,} characters)')
            
        except Exception as error:
            print(f'❌ Error reading {file}: {error}')
            continue
    
    if not combined_content:
        raise Exception('No content was successfully combined')
    
    # Add final comment (only once)
    combined_content.append('')
    combined_content.append('/* ==========================================================================')
    combined_content.append('   END OF FILE')
    combined_content.append('   ========================================================================== */')
    
    # Write combined content to output file
    final_content = '\n'.join(combined_content) + '\n'
    
    # Ensure output directory exists
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_content)
    
    print(f'\n✅ Successfully combined {processed_files} files into: {output_file}')
    print(f'📊 Content size: {total_chars:,} characters')
    print(f'📊 Final size: {len(final_content):,} characters ({len(final_content) / 1024:.2f} KB)')
    
    return processed_files

def validate_output(output_file):
    """Validate that the combined file matches original structure"""
    try:
        with open(output_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = len(content.split('\n'))
        size = len(content) / 1024
        
        print('\n📋 Output validation:')
        print(f'   📏 Lines: {lines:,}')
        print(f'   📦 Size: {size:.2f} KB')
        
        # Check for key sections
        required_sections = [
            'CSS CUSTOM PROPERTIES',
            'GLOBAL STYLES', 
            'LAYOUT STRUCTURE',
            'NAVIGATION & TABS',
            'PURCHASE GRID & CARDS',
            'BUTTONS',
            'RESPONSIVE DESIGN',
            'CONSOLIDATED COMPONENT-SPECIFIC STYLES'
        ]
        
        # Check for component sections
        component_sections = [
            'CollapsibleSection.js',
            'Modal.js',
            'PointPoolDisplay.js',
            'UniversalForm.js',
            'SearchableSelect.js'
        ]
        
        missing_sections = []
        found_sections = []
        
        for section in required_sections:
            if section in content:
                found_sections.append(section)
            else:
                missing_sections.append(section)
        
        found_components = [comp for comp in component_sections if comp in content]
        
        print(f'   ✅ Found sections: {len(found_sections)}/{len(required_sections)}')
        print(f'   🧩 Found components: {len(found_components)}/{len(component_sections)}')
        
        if missing_sections:
            print(f'   ⚠️  Missing sections: {", ".join(missing_sections)}')
        
        # Check for duplicate END OF FILE comments
        end_of_file_count = content.count('END OF FILE')
        if end_of_file_count > 1:
            print(f'   ⚠️  Found {end_of_file_count} END OF FILE comments (should be 1)')
        else:
            print(f'   ✅ Single END OF FILE comment found')
        
        # Check structure
        has_variables = ':root {' in content
        has_media_queries = '@media' in content
        has_keyframes = '@keyframes' in content
        
        print(f'   🎨 Has CSS variables: {"✅" if has_variables else "❌"}')
        print(f'   📱 Has media queries: {"✅" if has_media_queries else "❌"}')
        print(f'   🎬 Has keyframes: {"✅" if has_keyframes else "❌"}')
        
        # Syntax validation (basic)
        open_braces = content.count('{')
        close_braces = content.count('}')
        
        if open_braces == close_braces:
            print(f'   🔧 Syntax check: ✅ Balanced braces ({open_braces} pairs)')
        else:
            print(f'   🔧 Syntax check: ⚠️  Unbalanced braces (open: {open_braces}, close: {close_braces})')
        
        return len(missing_sections) == 0 and end_of_file_count == 1
            
    except Exception as error:
        print(f'❌ Could not validate output: {error}')
        return False

def backup_existing_file(output_file):
    """Create a backup of existing file if it exists"""
    output_path = Path(output_file)
    if output_path.exists():
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_name = f"{output_path.stem}_backup_{timestamp}{output_path.suffix}"
        backup_path = output_path.parent / backup_name
        
        output_path.rename(backup_path)
        print(f'📋 Created backup: {backup_name}')
        return str(backup_path)
    return None

def main():
    """Main execution function"""
    try:
        print('🔄 Combining CSS partials...')
        print(f'📂 Source: {PARTIALS_DIR}')
        print(f'📄 Output: {OUTPUT_FILE}')
        print(f'⏰ Started: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')
        
        # Create backup if file exists
        backup_file = backup_existing_file(OUTPUT_FILE)
        
        # Combine files
        file_count = combine_css(PARTIALS_DIR, OUTPUT_FILE)
        
        # Validate output
        is_valid = validate_output(OUTPUT_FILE)
        
        print(f'\n🎉 CSS combination complete!')
        print(f'   📊 Combined {file_count} files')
        print(f'   {'✅' if is_valid else '⚠️ '} Validation: {'Passed' if is_valid else 'Issues found'}')
        
        if backup_file:
            print(f'   📋 Backup saved: {Path(backup_file).name}')
        
        print(f'   ⏰ Completed: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
        
    except Exception as error:
        print(f'❌ Error combining CSS files: {error}')
        exit(1)

if __name__ == '__main__':
    main()