# `src/backend/utils` - The Generic Utilities Layer

## 1. Core Purpose

This directory contains reusable helper functions and classes that are **not specific to the application's core domain** (i.e., they don't know about "characters" or "Roll20").

## 2. Component Responsibilities

*   `file_utils.py`: Handles generic file operations, like sanitizing filenames. Contains the logic for the `process-downloads` command.
*   `json_utils.py`: Simple, reusable functions for loading and saving JSON files.
*   `logging.py`: A one-time setup script for the application's logger.
*   `scriptcards_templates.py`: A self-contained system for compressing and expanding the large ScriptCards macros used in abilities.

## 3. Golden Rules

1.  **Generality is Key:** Code in this directory should be generic enough that it could be copied to another Python project with minimal changes.
2.  **No Business Logic:** Do not add character-specific or Roll20-specific logic here. For example, `file_utils.py` can sanitize any filename, not just a character's.