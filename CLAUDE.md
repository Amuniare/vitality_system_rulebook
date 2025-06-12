# Vitality System - AI Development Guide (ROOT)

This guide outlines the principles for our collaboration on the Vitality System project. It favors a flexible, interactive workflow over rigid commands.

## 1. Project Overview

This is a personal RPG management system with two main, independent parts:
1.  **JavaScript Web Character Builder:** A browser-based application for creating characters for the Vitality RPG system. Located in `frontend/character-builder/`.
2.  **Python Roll20 Automation:** A backend system for uploading/downloading character data to and from a Roll20 campaign. Located in `src/`.

These two systems only interact through the character JSON files.

## 2. Collaboration Principles

Let's work together as a team. To be most effective, please follow these guidelines:

-   **Be an Active Collaborator:** Instead of just giving commands, guide my approach. Ask me to make a plan, think through alternatives, or explain my reasoning. Course-correct me early if I'm on the wrong path.
-   **Provide Context:** Mention relevant files, business goals, or even paste in error messages. The more context I have, the better my solutions will be.
-   **Use Checklists for Complex Tasks:** For multi-step work, ask me to generate a plan with Markdown checkboxes (`- [ ]`). We can track our progress together, ensuring no steps are missed.

## 3. Project Architecture & Local Guides

The codebase is organized into distinct sections, each with its own architectural rules. To understand these rules, **always refer to the `CLAUDE.md` file within the relevant directory.** These are your entry points for any task.

-   ### For the **JavaScript Web Character Builder**:
    > Your master guide is **`frontend/character-builder/CLAUDE.md`**.
    > It contains the architectural constitution for the entire frontend application.

-   ### For the **Python Roll20 Automation**:
    > Your guide is **`src/CLAUDE.md`**.
    > It outlines the architecture of the backend system and points to further documentation in `src/docs/`.

## 4. Common Commands

Here are some essential commands for managing the project:

-   **Run the Web Character Builder:**
    -   Start a local server: `python -m http.server`
    -   Open: `http://localhost:8000/frontend/character-builder/character-builder.html`

-   **Upload Characters to Roll20:**
    -   `python main.py sync`

-   **Run Frontend Tests (Once Implemented):**
    -   `npm test`