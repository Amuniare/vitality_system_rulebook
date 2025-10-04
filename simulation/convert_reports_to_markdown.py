#!/usr/bin/env python3
"""
Convert all .txt report files to proper markdown format with tables.

This script reads existing .txt report files and converts them to .md files
with proper markdown table formatting.
"""

import os
import re
from pathlib import Path


def convert_box_table_to_markdown(content):
    """Convert box-drawing character tables to markdown tables"""
    lines = content.split('\n')
    markdown_lines = []
    in_table = False
    headers_found = False

    for line in lines:
        # Check if this is a table line (contains box-drawing chars or │)
        if '│' in line or '┼' in line or '─' in line:
            # Clean the line
            clean_line = line.replace('│', '|').replace('─', '-').replace('┼', '|')

            # If it's a separator line
            if all(c in ' -|' for c in clean_line.strip()):
                if not headers_found:
                    # This is the header separator
                    markdown_lines.append(clean_line)
                    headers_found = True
                    in_table = True
                # Skip other separator lines
                continue
            elif in_table or '|' in clean_line:
                # This is a data or header row
                markdown_lines.append(clean_line)
                in_table = True
        else:
            # Not a table line
            if in_table:
                in_table = False
                headers_found = False
            markdown_lines.append(line)

    return '\n'.join(markdown_lines)


def convert_fixed_width_table_to_markdown(content):
    """Convert fixed-width tables to markdown tables"""
    lines = content.split('\n')
    markdown_lines = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Check if this looks like a fixed-width table header
        # (has multiple columns separated by spaces)
        if re.search(r'\w+\s{2,}\w+\s{2,}\w+', line) and not line.startswith('#'):
            # Found potential table start
            header = line
            # Look for data rows below
            data_rows = []
            j = i + 1

            # Skip separator lines like "===" or "---"
            while j < len(lines) and re.match(r'^[=\-\s]+$', lines[j]):
                j += 1

            # Collect data rows
            while j < len(lines) and lines[j].strip():
                if not re.match(r'^[=\-\s#]+$', lines[j]):
                    data_rows.append(lines[j])
                    j += 1
                else:
                    break

            # If we found data rows, convert to markdown table
            if data_rows and len(data_rows) > 0:
                # Split header into columns (split on 2+ spaces)
                header_cols = [col.strip() for col in re.split(r'\s{2,}', header.strip())]

                # Create markdown table
                markdown_lines.append('| ' + ' | '.join(header_cols) + ' |')
                markdown_lines.append('|' + '|'.join(['---'] * len(header_cols)) + '|')

                # Convert data rows
                for row in data_rows[:50]:  # Limit to top 50 rows
                    # Split on 2+ spaces
                    cols = [col.strip() for col in re.split(r'\s{2,}', row.strip())]
                    # Pad with empty cells if needed
                    while len(cols) < len(header_cols):
                        cols.append('')
                    markdown_lines.append('| ' + ' | '.join(cols[:len(header_cols)]) + ' |')

                i = j
                continue

        # Not part of a table, keep as-is
        markdown_lines.append(line)
        i += 1

    return '\n'.join(markdown_lines)


def convert_report_to_markdown(input_path, output_path):
    """Convert a single report file to markdown"""
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add markdown header if missing
    if not content.startswith('#'):
        # Extract title from first line
        lines = content.split('\n')
        title = lines[0].strip().strip('=').strip()
        content = f"# {title}\n\n" + '\n'.join(lines[1:])

    # Convert tables
    if '│' in content or '┼' in content:
        content = convert_box_table_to_markdown(content)
    else:
        content = convert_fixed_width_table_to_markdown(content)

    # Replace section separators with markdown headers
    content = re.sub(r'^([A-Z][A-Z\s]+):?\s*$', r'## \1', content, flags=re.MULTILINE)
    content = re.sub(r'^={3,}\s*$', '', content, flags=re.MULTILINE)
    content = re.sub(r'^-{3,}\s*$', '', content, flags=re.MULTILINE)

    # Clean up multiple blank lines
    content = re.sub(r'\n{3,}', '\n\n', content)

    # Write to output
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Converted: {input_path.name} -> {output_path.name}")


def main():
    """Convert all .txt files with tables in the simulation folder"""
    simulation_dir = Path(__file__).parent

    print(f"Scanning for .txt files in: {simulation_dir}")

    # Find all .txt files recursively in simulation folder
    txt_files = list(simulation_dir.glob('**/*.txt'))

    print(f"Found {len(txt_files)} .txt files")

    converted_count = 0
    for txt_file in txt_files:
        md_file = txt_file.with_suffix('.md')
        try:
            convert_report_to_markdown(txt_file, md_file)
            # Delete the original .txt file after successful conversion
            txt_file.unlink()
            print(f"  Deleted: {txt_file.relative_to(simulation_dir)}")
            converted_count += 1
        except Exception as e:
            print(f"  Error converting {txt_file.relative_to(simulation_dir)}: {e}")

    print(f"\nConverted and deleted {converted_count} files")


if __name__ == '__main__':
    main()
