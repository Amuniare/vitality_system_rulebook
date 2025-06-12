# Vitality System - AI Development Guide (ROOT)

## 1. Project Overview

This is a personal RPG management system with two main, independent parts:
1.  **JavaScript Web Character Builder:** A browser-based application for creating characters for the Vitality RPG system. Located in `frontend/character-builder/`.
2.  **Python Roll20 Automation:** A backend system for uploading/downloading character data to and from a Roll20 campaign. Located in `src/backend/`.

These two systems only interact through the character JSON files stored in `characters/`.

## 2. Golden Rules of Collaboration

This project has a mature, specific architecture. To be effective, you **MUST** follow these rules:

1.  **Summarize Your Plan First.** Before writing any code, state which files you will modify and briefly explain your approach.
2.  **Ask Clarifying Questions.** If a request is ambiguous or seems to violate a rule in a guide, ask for clarification.
3.  **Provide Complete, Working Files.** Do not provide partial snippets or diffs. Always provide the full, ready-to-use file content.

## 3. Development Guide Index (MANDATORY)

**This is your entry point for any task.** Before you begin, identify which part of the project you are working on and read its master guide.

-   ### For the **JavaScript Web Character Builder**:
    > Your master guide is **`frontend/character-builder/CLAUDE.md`**.
    > You must read it to understand the web app's architecture and data flow before touching any JS file.

-   ### For the **Python Roll20 Automation**:
    > Your guide is **`src/CLAUDE.md`**. 
    > Additional documentation in **`src/docs/`** covers Roll20 integration, API references, and data formats.

## 3.1. Documentation Structure

Documentation is organized by project area:

-   **`frontend/docs/`** - Web character builder documentation:
    *   `web-character-builder.md` - Architecture overview and usage guide
    *   `external-data-system.md` - JSON data system documentation
    *   `specs_and_notes/` - Feature specifications and development notes

-   **`src/docs/`** - Backend system documentation:
    *   `roll20-integration.md` - Roll20 automation system overview
    *   `development-guide.md` - Setup and development instructions
    *   `data-formats.md` - Character JSON format specifications
    *   `roll20_api_list.md` - Roll20 API command reference
    *   `roll20_character_sheet_attribute_list.md` - Character sheet mappings
    *   `scriptcards-system.md` - ScriptCards integration documentation

## 4. Special Directives and Automated Workflows

This section defines special commands that trigger automated, multi-step processes.

*   `--process-notes [filename]`: When you see this directive, your task is to read the specified notes file, analyze its contents, and generate a detailed feature specification in `.claude/spec.md`. Ask clarifying questions if the notes are ambiguous.

*   `--build-from-spec`: When you see this directive, you MUST first read and then strictly follow the instructions outlined in the `.claude/CLAUDE.md` file. That file contains the protocol for transforming the `spec.md` into a full implementation plan. Do not perform any other actions until you have read and understood that protocol.

*   `--log [src|web] [PhaseID] "[Degree of Sucess or Failure]"`: This directive initiates the standard process for creating a new development log. The first argument specifies the project area:
    *   `web`: Create logs in `frontend/docs/dev_logs/` following web development logging protocol.
    *   `src`: Create logs in `src/docs/dev_logs/` following backend development logging protocol.

## 5. Important Development Reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
