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


## 3.  Commands

### `--create-dev-log`

A specialized command for our documentation workflow.

-   **Workflow:**
    1.  You issue the `--create-dev-log` command.
    2.  I will analyze our recent conversation and the modified files.
    3.  I will propose a filename and title (e.g., `Phase 26B: Dev Log System Implementation`).
    4.  Upon your approval, I will generate the complete Markdown file using our standard template and save it to the correct `dev_logs` directory.



---

## 4. Bugfix Workflow Command

When we encounter a recurring bug in a specific part of the codebase, we will use the following command to initiate a structured debugging process based on our documented architectural patterns.

### Command Syntax

`--bugfix [recipe_name]: "[problem_description]"`

*   **`[recipe_name]`**: The name of the solution pattern to apply (e.g., `Data-Contract-Violation`, `Stale-Listener-Lifecycle`).
*   **`"[problem_description]"`**: A concise description of the bug's symptoms (e.g., "Situational expertise purchase fails with 'category.basic is undefined'").

### Workflow

When I receive this command, my first action will be to open **`frontend/character-builder/CLAUDE.md`** and locate the specified recipe. I will then use that recipe's principles to analyze the problem and propose a step-by-step plan for the fix.

**Example Usage:**
`--bugfix Data-Contract-Violation: "Situational expertise purchase fails with 'category.basic is undefined'"`