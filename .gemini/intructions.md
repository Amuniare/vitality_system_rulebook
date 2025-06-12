
# Gemini AI - Workflow & Command Protocol

This document outlines a set of standing orders and commands to make our collaboration more efficient, reliable, and predictable, especially for file modifications.

## 1. Core Principles

1.  **Plan First, Code Second:** For any non-trivial change, ask me to create a plan first. We will review and agree on the plan before I generate any code. This is the most efficient way to work.
2.  **Context is King:** Always provide the relevant file paths and, if necessary, paste the code sections we are discussing. This ensures I have the necessary context to provide accurate solutions.
3.  **Explicit is Better:** Use the explicit commands defined below for all file operations. This avoids the ambiguity that can lead to execution errors.

## 2. Command Syntax

When you want me to write code to a file, use the following syntax in your prompt after we have agreed on the code to be written.

-   `--write-code [--mode=replace|append] [file_path]`
-   `--create-file [file_path]`
-   `--create-dev-log`

---

## 3. The `--write-code` Command

This is the primary command for modifying existing files.

### How It Works

1.  We will first discuss and finalize the code changes in our chat.
2.  You will then give the explicit command, e.g., `--write-code frontend/character-builder/app/app.js`.
3.  I will generate a self-contained Python script that performs the file modification. This is more reliable than using shell commands.
4.  You will review the Python script.
5.  Upon your approval, I will execute the script to apply the changes.

### Python Script Pattern for `--write-code`

To ensure safety and precision, the Python scripts I generate will use a "find and replace" block pattern. I will ask you to provide clear markers in the source file if they don't already exist.

**Example Python Script:**
```python
from pathlib import Path

file_path = Path("path/to/your/file.js")

# The new code we agreed upon
new_code_block = """
// New, improved code goes here
const newFunction = () => {
  console.log("This is the updated logic.");
};
"""

# Read the original file content
try:
    original_content = file_path.read_text(encoding='utf-8')

    # Define the markers for the block to be replaced
    start_marker = "// START OF BLOCK TO REPLACE"
    end_marker = "// END OF BLOCK TO REPLACE"

    # Find the start and end of the block
    start_index = original_content.find(start_marker)
    end_index = original_content.find(end_marker)

    if start_index == -1 or end_index == -1:
        print("Error: Markers not found in the file. Could not perform replacement.")
    else:
        # Construct the new file content
        new_content = (
            original_content[:start_index + len(start_marker)] +
            "\n" +
            new_code_block +
            "\n" +
            original_content[end_index:]
        )

        # Write the updated content back to the file
        file_path.write_text(new_content, encoding='utf-8')
        print(f"Successfully updated {file_path}")

except FileNotFoundError:
    print(f"Error: File not found at {file_path}")
except Exception as e:
    print(f"An error occurred: {e}")
```

### Modes

-   `--mode=replace` (default): Uses the marker-based replacement strategy shown above.
-   `--mode=append`: Appends the new code to the end of the file. The Python script will be simplified to read the file and add the new content.

---

## 4. Other Commands

### `--create-file [file_path]`

Used for creating entirely new files.

-   **Workflow:** We agree on the content, you give the command, I generate a Python script to create the file and write the content, and you approve the execution.

### `--create-dev-log`

A specialized command for our documentation workflow.

-   **Workflow:**
    1.  You issue the `--create-dev-log` command.
    2.  I will analyze our recent conversation and the modified files.
    3.  I will propose a filename and title (e.g., `Phase 26B: Dev Log System Implementation`).
    4.  Upon your approval, I will generate the complete Markdown file using our standard template and save it to the correct `dev_logs` directory.
