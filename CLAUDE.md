# Vitality System - AI Development Guide (ROOT)

## 1. Project Overview

This is a personal RPG management system with two main, independent parts:
1.  **JavaScript Web Character Builder:** A browser-based application for creating characters for the Vitality RPG system. Located in `rulebook/character-builder/`.
2.  **Python Roll20 Automation:** A backend system for uploading/downloading character data to and from a Roll20 campaign. Located in `src/`.

These two systems only interact through the character JSON files stored in `characters/`.

## 2. Golden Rules of Collaboration

This project has a mature, specific architecture. To be effective, you **MUST** follow these rules:

1.  **Summarize Your Plan First.** Before writing any code, state which files you will modify and briefly explain your approach.
2.  **Ask Clarifying Questions.** If a request is ambiguous or seems to violate a rule in a guide, ask for clarification.
3.  **Provide Complete, Working Files.** Do not provide partial snippets or diffs. Always provide the full, ready-to-use file content.

## 3. Development Guide Index (MANDATORY)

**This is your entry point for any task.** Before you begin, identify which part of the project you are working on and read its master guide.

-   ### For the **JavaScript Web Character Builder**:
    > Your master guide is **`rulebook/character-builder/CLAUDE.md`**.
    > You must read it to understand the web app's architecture and data flow before touching any JS file.

-   ### For the **Python Roll20 Automation**:
    > Your guide is **`src/CLAUDE.md`**. (Note: This file should be created when work on the Python part begins).
