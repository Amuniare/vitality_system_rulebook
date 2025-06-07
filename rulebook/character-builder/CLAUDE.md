# Web Character Builder - AI Architecture Guide

## 1. Web App Architecture

The character builder follows a strict, multi-layer architecture. Understanding this is not optional.

-   `app.js` -> **Initializes the application.**
-   `core/` -> **Foundation.** Manages data loading (`GameDataManager`) and the character object (`VitalityCharacter`).
-   `data/` -> **Game Content.** All game rules (archetypes, flaws, etc.) are in JSON files here.
-   `calculators/` -> **The Math Engine.** Pure, stateless functions for all calculations.
-   `systems/` -> **The Brains.** The business logic for *how* the game rules work.
-   `ui/` -> **The Face.** The visual components and user interaction handlers.

## 2. The Unbreakable Data Flow (MANDATORY)

This is the **ONLY** allowed pattern for modifying character data. Violating this pattern is the primary source of bugs.

1.  **UI Event:** User clicks a button with a `data-action` attribute.
2.  **Tab Handler:** A `Tab` class in `/ui/tabs/` catches the delegated event.
3.  **System Call:** The handler calls a `static` method in a `/systems/` class (e.g., `TraitFlawSystem.purchaseFlaw(...)`).
4.  **Character Update:** The `System` modifies the character object and returns it.
5.  **Centralized Refresh:** The `Tab` handler calls `this.builder.updateCharacter()`.
6.  **UI Re-render:** The `updateCharacter` method saves the character and triggers a re-render of the UI to reflect the new state.

**Under no circumstances should the UI modify the character object directly.**

## 3. Guide to the Layers (MANDATORY)

Before working on a file, read the guide for its architectural layer.

-   ### To change **what the user sees or interacts with**:
    > Go to `/ui/`. You **MUST** obey the rules in **`rulebook/character-builder/ui/CLAUDE.md`**.

-   ### To change **the game rules and logic**:
    > Go to `/systems/`. You **MUST** obey the rules in **`rulebook/character-builder/systems/CLAUDE.md`**.

-   ### To change **how stats or points are calculated**:
    > Go to `/calculators/`. You **MUST** obey the rules in **`rulebook/character-builder/calculators/CLAUDE.md`**.

-   ### To change **data loading or the core character object**:
    > Go to `/core/`. You **MUST** obey the rules in **`rulebook/character-builder/core/CLAUDE.md`**.
