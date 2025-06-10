# Vitality System - AI Development Guide (SRC)

## 1. Core Purpose & Architecture

This directory (`src/`) contains the **Python-based backend automation system** for the Vitality RPG project. Its sole purpose is to interact with a live Roll20 campaign to upload and download character data.

**This system is entirely separate from the JavaScript web character builder located in `rulebook/`.**

The core architecture relies on:
*   **Python 3:** The primary programming language.
*   **Playwright:** For browser automation to control a Chrome instance.
*   **Custom Roll20 API Script:** A JavaScript file (`src/roll20_api/CharacterExtractor.js`) that must be installed in the target Roll20 campaign to enable communication.
*   **Handout-Based Data Transfer:** The primary method for moving large amounts of JSON data into and out of Roll20 to bypass chat limitations.

## 2. Golden Rules of Collaboration

1.  **Summarize Your Plan First.** Before modifying any code in `src/`, state which files you intend to change and provide a brief, high-level overview of your approach.
2.  **Acknowledge This Guide.** Begin your response by confirming you have read and understood the relevant `CLAUDE.md` file for the directory you are working in.
3.  **Provide Complete, Working Files.** Do not provide partial snippets. Always return the full, ready-to-use file content.

## 3. Directory Structure & Responsibilities

This is your map to the `src` directory. Before starting any task, identify the relevant directory and consult its local `CLAUDE.md` guide.

*   `src/`
    *   `api/`: **Browser & Chat Interface.** Handles the direct connection to the browser and communication with the Roll20 chat log. This is the **only** layer that should use Playwright.
    *   `char_sheet/`: **Static Assets.** Contains the HTML/CSS of the Roll20 character sheet for reference.
    *   `character/`: **Business Logic.** Contains the Python classes that process character data (e.g., transforming, comparing, updating). This layer is browser-agnostic.
    *   `excel/`: **Legacy Tools.** Contains the old Excel-based character sheet and its Python analyzer. Primarily for reference and archival.
    *   `roll20_api/`: **Server-Side JavaScript.** Contains the `CharacterExtractor.js` script that runs *inside* the Roll20 API sandbox.
    *   `scriptcards/`: **Static Assets.** Contains the master text template for ScriptCards macros.
    *   `utils/`: **Generic Utilities.** Contains reusable Python helper functions (file I/O, JSON processing, logging) that are not specific to characters or Roll20.

## 4. Primary Data Flow (Character Upload)

1.  A user runs `main.py` with an action (e.g., `sync`).
2.  **`src/character/updater.py`** reads a character JSON file from `characters/input/`.
3.  **`src/utils/scriptcards_templates.py`** may be used to expand compressed ability macros.
4.  The character data is passed to **`src/api/`** classes.
5.  **`src/api/connection.py`** ensures a connection to a debug-enabled Chrome instance.
6.  **`src/character/updater.py`** uses browser automation to create a temporary handout in the Roll20 journal containing the character's JSON data.
7.  **`src/api/chat_interface.py`** sends a command (e.g., `!update-character`) to the Roll20 chat.
8.  **`src/roll20_api/CharacterExtractor.js`** receives the command, reads the data from the handout, and uses the Roll20 API to create or update the character sheet.
9.  The process is complete, and temporary handouts are cleaned up.