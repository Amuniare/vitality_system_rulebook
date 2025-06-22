#!/usr/bin/env python3
import os
import re
from pathlib import Path

# Configuration
INPUT_FILE = 'modernApp/css/modern-app.css'
OUTPUT_DIR = 'modernApp/css/partials'

def ensure_directory_exists(directory):
    """Create directory if it doesn't exist"""
    Path(directory).mkdir(parents=True, exist_ok=True)

def read_css_file(file_path):
    """Read CSS file content"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        raise FileNotFoundError(f"CSS file not found: {file_path}")
    except Exception as e:
        raise Exception(f"Error reading CSS file: {e}")

def find_section_boundaries(content):
    """Find exact section boundaries using string matching"""
    
    # Define the exact section markers we're looking for
    section_markers = [
        {
            'name': '01-header-and-reset.css',
            'start_marker': '/* ==========================================================================\n   modernApp/css/modern-app.css',
            'keywords': ['modernApp/css/modern-app.css']
        },
        {
            'name': '02-variables.css',
            'start_marker': '/* =====================================================\n   CSS CUSTOM PROPERTIES (THEME VARIABLES)',
            'keywords': ['CSS CUSTOM PROPERTIES']
        },
        {
            'name': '03-global-styles.css',
            'start_marker': '/* =====================================================\n   GLOBAL STYLES',
            'keywords': ['GLOBAL STYLES']
        },
        {
            'name': '04-layout-structure.css',
            'start_marker': '/* =====================================================\n   LAYOUT STRUCTURE',
            'keywords': ['LAYOUT STRUCTURE']
        },
        {
            'name': '05-navigation-tabs.css',
            'start_marker': '/* =====================================================\n   NAVIGATION & TABS',
            'keywords': ['NAVIGATION', 'TABS']
        },
        {
            'name': '06-tab-content.css',
            'start_marker': '/* =====================================================\n   TAB CONTENT',
            'keywords': ['TAB CONTENT']
        },
        {
            'name': '07-pool-header.css',
            'start_marker': '/* =====================================================\n   POOL HEADER & INFO',
            'keywords': ['POOL HEADER']
        },
        {
            'name': '08-section-content.css',
            'start_marker': '/* =====================================================\n   SECTION CONTENT',
            'keywords': ['SECTION CONTENT']
        },
        {
            'name': '09-purchase-cards.css',
            'start_marker': '/* =====================================================\n   PURCHASE GRID & CARDS',
            'keywords': ['PURCHASE GRID', 'CARDS']
        },
        {
            'name': '10-buttons.css',
            'start_marker': '/* =====================================================\n   BUTTONS',
            'keywords': ['BUTTONS']
        },
        {
            'name': '11-summary.css',
            'start_marker': '/* =====================================================\n   SUMMARY SECTION',
            'keywords': ['SUMMARY SECTION']
        },
        {
            'name': '12-utilities.css',
            'start_marker': '/* =====================================================\n   UTILITY CLASSES',
            'keywords': ['UTILITY CLASSES']
        },
        {
            'name': '13-loading-states.css',
            'start_marker': '/* =====================================================\n   LOADING STATES',
            'keywords': ['LOADING STATES']
        },
        {
            'name': '14-scrollbar.css',
            'start_marker': '/* =====================================================\n   SCROLLBAR STYLING',
            'keywords': ['SCROLLBAR STYLING']
        },
        {
            'name': '15-components.css',
            'start_marker': '/* ==========================================================================\n   CONSOLIDATED COMPONENT-SPECIFIC STYLES',
            'keywords': ['CONSOLIDATED COMPONENT']
        },
        {
            'name': '16-notifications.css',
            'start_marker': '/* =====================================================\n   NOTIFICATION SYSTEM',
            'keywords': ['NOTIFICATION SYSTEM']
        },
        {
            'name': '17-responsive.css',
            'start_marker': '/* =====================================================\n   RESPONSIVE DESIGN',
            'keywords': ['RESPONSIVE DESIGN']
        },
        {
            'name': '18-print.css',
            'start_marker': '/* =====================================================\n   PRINT STYLES',
            'keywords': ['PRINT STYLES']
        }
    ]
    
    # Find all section positions
    sections = []
    for section in section_markers:
        # Try exact marker first
        pos = content.find(section['start_marker'])
        if pos != -1:
            sections.append({
                'name': section['name'],
                'position': pos,
                'found_by': 'exact_marker'
            })
            print(f"Found {section['name']} at position {pos} (exact marker)")
        else:
            # Fall back to keyword search
            for keyword in section['keywords']:
                # Look for the keyword in section headers
                pattern = r'/\*[^*]*' + re.escape(keyword) + r'[^*]*\*/'
                match = re.search(pattern, content, re.IGNORECASE | re.MULTILINE | re.DOTALL)
                if match:
                    sections.append({
                        'name': section['name'],
                        'position': match.start(),
                        'found_by': f'keyword: {keyword}'
                    })
                    print(f"Found {section['name']} at position {match.start()} (keyword: {keyword})")
                    break
    
    # Sort by position
    sections.sort(key=lambda x: x['position'])
    
    return sections

def extract_section_content(content, sections):
    """Extract content for each section"""
    section_contents = {}
    
    for i, section in enumerate(sections):
        start_pos = section['position']
        
        # Find the actual start of content (after the comment block)
        comment_end = content.find('*/', start_pos) + 2
        content_start = comment_end
        
        # Skip any immediate whitespace
        while content_start < len(content) and content[content_start] in ' \t\n\r':
            content_start += 1
        
        # Find end position
        if i + 1 < len(sections):
            end_pos = sections[i + 1]['position']
        else:
            end_pos = len(content)
        
        # Extract content
        section_content = content[content_start:end_pos].rstrip()
        
        if section_content:
            section_contents[section['name']] = section_content
            print(f"Extracted {len(section_content)} characters for {section['name']}")
        else:
            print(f"No content found for {section['name']}")
    
    return section_contents

def save_section(filename, content, output_dir):
    """Save section content to file"""
    if not content or not content.strip():
        print(f"Skipped: {filename} (no content)")
        return False
    
    file_path = Path(output_dir) / filename
    
    # Clean up content - remove excessive whitespace at start/end
    lines = content.split('\n')
    
    # Remove empty lines at start
    while lines and not lines[0].strip():
        lines.pop(0)
    
    # Remove empty lines at end
    while lines and not lines[-1].strip():
        lines.pop()
    
    if lines:
        file_content = '\n'.join(lines)
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(file_content + '\n')
        print(f"✅ Created: {file_path} ({len(lines)} lines)")
        return True
    else:
        print(f"❌ Skipped: {filename} (no content after cleaning)")
        return False

def create_index_file(output_dir):
    """Create index file for easy importing"""
    filenames = [
        '01-header-and-reset.css',
        '02-variables.css',
        '03-global-styles.css',
        '04-layout-structure.css',
        '05-navigation-tabs.css',
        '06-tab-content.css',
        '07-pool-header.css',
        '08-section-content.css',
        '09-purchase-cards.css',
        '10-buttons.css',
        '11-summary.css',
        '12-utilities.css',
        '13-loading-states.css',
        '14-scrollbar.css',
        '15-components.css',
        '16-notifications.css',
        '17-responsive.css',
        '18-print.css'
    ]
    
    index_content = """/* ==========================================================================
   modernApp/css/partials/_index.css
   
   Import all CSS partials in correct order
   ========================================================================== */

/* Import all partials in order */
"""
    
    for filename in filenames:
        index_content += f"@import './{filename}';\n"
    
    index_path = Path(output_dir) / '_index.css'
    with open(index_path, 'w', encoding='utf-8') as file:
        file.write(index_content)
    
    print('✅ Created: _index.css file for importing all partials')

def main():
    """Main execution function"""
    try:
        print('🔄 Splitting CSS file...\n')
        
        # Ensure output directory exists
        ensure_directory_exists(OUTPUT_DIR)
        
        # Read CSS content
        css_content = read_css_file(INPUT_FILE)
        print(f"📖 Read CSS file: {len(css_content):,} characters\n")
        
        # Find section boundaries
        sections = find_section_boundaries(css_content)
        print(f"\n📍 Found {len(sections)} sections\n")
        
        if not sections:
            print("❌ No sections found! Check the CSS file format.")
            return
        
        # Extract content for each section
        section_contents = extract_section_content(css_content, sections)
        print(f"\n📦 Extracted content for {len(section_contents)} sections\n")
        
        # Save each section
        created_count = 0
        for filename, content in section_contents.items():
            if save_section(filename, content, OUTPUT_DIR):
                created_count += 1
        
        # Create index file
        create_index_file(OUTPUT_DIR)
        
        print(f'\n🎉 CSS file successfully split into {created_count} partials!')
        print(f'📁 Partials saved to: {OUTPUT_DIR}')
        
    except Exception as error:
        print(f'❌ Error splitting CSS file: {error}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()