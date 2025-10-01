"""
Script to split the rulebook.md file into separate section files.
Reads the main rulebook and splits it by H1 headers (# SECTION).
"""

import re
from pathlib import Path

# Source and destination paths
SOURCE_FILE = Path(r"C:\Users\Trent\OneDrive\Documents\GitHub\vitality_system_rulebook\frontend\rules\rulebook.md")
OUTPUT_DIR = Path(r"C:\Users\Trent\OneDrive\Documents\GitHub\vitality_system_rulebook\src\roll20ScriptcardsAndSheets\rulebook")

def split_rulebook():
    """Split the rulebook into separate section files."""

    # Read the source file
    print(f"Reading {SOURCE_FILE}...")
    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by H1 headers (lines starting with "# SECTION" or "# " at start of line)
    # Keep the header with each section
    sections = []
    current_section = []
    section_header = None

    for line in content.split('\n'):
        # Check if this is an H1 header
        if line.startswith('# '):
            # Save previous section if it exists
            if section_header and current_section:
                sections.append((section_header, '\n'.join(current_section)))

            # Start new section
            section_header = line
            current_section = [line]
        else:
            if section_header:  # Only add lines after we've found the first header
                current_section.append(line)

    # Don't forget the last section
    if section_header and current_section:
        sections.append((section_header, '\n'.join(current_section)))

    print(f"Found {len(sections)} sections")

    # Create output directory if it doesn't exist
    OUTPUT_DIR.mkdir(exist_ok=True)

    # Write each section to a file
    for idx, (header, section_content) in enumerate(sections, start=1):
        # Extract section name from header
        # Example: "# SECTION 1: BASIC RULES" -> "section_1_basic_rules"
        section_match = re.search(r'# SECTION (\d+):\s*(.+)', header)

        if section_match:
            section_num = section_match.group(1)
            section_name = section_match.group(2).strip().lower().replace(' ', '_').replace('&', 'and')
            # Remove special characters and trailing underscores
            section_name = re.sub(r'[^\w_]', '', section_name).strip('_')

            filename = f"{section_num.zfill(2)}_section_{section_num}_{section_name}.md"
        else:
            # Fallback naming
            filename = f"{str(idx).zfill(2)}_section_{idx}.md"

        output_path = OUTPUT_DIR / filename

        print(f"Writing {filename}...")
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(section_content)

    print(f"\nSuccessfully split rulebook into {len(sections)} files in {OUTPUT_DIR}")

if __name__ == "__main__":
    split_rulebook()