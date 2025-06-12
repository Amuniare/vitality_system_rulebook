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


*   `--diagnose [section] [subsection] "[description of issue]"`: This directive initiates a structured debugging workflow. You are to follow the steps below to diagnose and propose a fix for the described issue.


*   **`--refactor "[Section]" "[Problem Description]" [Recipe]`:** This directive initiates a guided refactoring process. You WILL:
    1.  Consult the **Section-to-Filepath Mapping** (Section 5.1) to find the `Entry Point File` for the given `[Section]`.
    2.  Analyze the `[Problem Description]` in the context of the entry point file to pinpoint the specific component file that needs modification.
    3.  Look up the `[Recipe]` in the **Recipe Book** (Section 5.2).
    4.  Apply the recipe's implementation steps to the file identified in step 2.
    5.  Present the modified file(s) for review.
    *   *Example: `--refactor "Special Attacks Tab" "The upgrade category headers are not clickable" STALE_EVENT_LISTENERS`*





## 5.The Refactoring Cookbook

### 5.1. Section-to-Filepath Mapping

This table maps a high-level application area to its main entry point file. The AI should use this as a starting point for analysis.

| Section | Entry Point File |
|---|---|
| "Utility Tab" | `frontend/character-builder/features/utility/UtilityTab.js` |
| "Main Pool Tab" | `frontend/character-builder/features/main-pool/MainPoolTab.js` |
| "Special Attacks Tab"| `frontend/character-builder/features/special-attacks/SpecialAttackTab.js` |
| "Archetypes Tab" | `frontend/character-builder/features/archetypes/ArchetypeTab.js` |
| "Attributes Tab" | `frontend/character-builder/features/attributes/AttributeTab.js` |
| "Basic Info Tab" | `frontend/character-builder/features/basic-info/BasicInfoTab.js` |
| "Summary Tab" | `frontend/character-builder/features/summary/SummaryTab.js` |

### 5.2. Recipe Book

#### DATA_INTEGRITY_BUGS

This section addresses bugs caused by mismatches between a component's expectations and the data it receives.

**Recipe: `DATA_CONTRACT_VIOLATION`**

*   **Problem:** A component or an entire tab renders as a blank white screen. The developer console shows a `TypeError`, often "Cannot read properties of undefined". This is caused by a component expecting data in one shape (e.g., `character.basicInfo.name`) when the actual data model provides it in another shape (e.g., `character.name`). This breaks the component's `render()` method, halting all subsequent HTML rendering.
*   **Solution:** Synchronize the component's data access logic with the authoritative data model. The component must be updated to read properties from the correct paths.
*   **Implementation Steps:** For the target file(s) identified from the mapping table and problem description, you WILL perform the following changes:
    1.  **Identify the Data Provider:** In the parent component (usually the `...Tab.js` file), locate the line where the failing component's `render()` method is called. Examine exactly which object is being passed as an argument.
    2.  **Identify the Data Model:** Determine the "source of truth" for the data's structure.
        *   For character data, this is `frontend/character-builder/core/VitalityCharacter.js`.
        *   For game rule data (archetypes, flaws, etc.), this is the relevant JSON file in `frontend/character-builder/data/`.
    3.  **Find the Mismatch:** Compare the property access in the failing component's `render()` method (e.g., `character.basicInfo.tier`) with the actual property definitions in the data model file (e.g., `this.tier` in `VitalityCharacter.js`).
    4.  **Correct the Component:** Modify the failing component's `render()` method to use the correct property access paths, removing any incorrect nesting.
    5.  **Present the Fix:** Provide the complete, corrected file.

#### LIFECYCLE_BUGS

This section addresses bugs related to component state and event handling during re-renders.

**Recipe: `STALE_EVENT_LISTENERS`**

*   **Problem:** Event listeners are re-attached on every render without removing old ones, causing actions to fire multiple times. This happens when listeners are attached to a long-lived container element whose inner HTML is rebuilt.
*   **Solution:** Implement a proper cleanup lifecycle. The component must explicitly remove its old event listeners *before* re-attaching new ones. This ensures only one listener is active at any time.
*   **Implementation Steps:** For the target file(s) identified from the mapping table and problem description, you WILL perform the following changes:
    1.  **Locate the `render()` method.** Add `this.listenersAttached = false;` to the beginning of the method.
    2.  **Locate `onCharacterUpdate()`** and change its implementation to be:
        ```javascript
        onCharacterUpdate() {
            // Just call render - it will handle the state reset
            this.render();
        }
        ```
    3.  **Create `removeEventListeners()`:** Add a new method to the class. This method will be responsible for detaching the old listener. It must check if the handler and container properties exist before trying to remove the listener.
        ```javascript
        removeEventListeners() {
            if (this.clickHandler && this.containerElement) {
                this.containerElement.removeEventListener('click', this.clickHandler); // or the specific event type used
                this.clickHandler = null;
                this.containerElement = null; // Important to nullify
            }
        }
        ```
    4.  **Modify `setupEventListeners()`:**
        *   At the very beginning of the method, call `this.removeEventListeners();` to clean up old listeners.
        *   The method must find its container element (e.g., `document.querySelector('.utility-tab-content')`).
        *   It must define its event handling logic as a class property (e.g., `this.clickHandler = (e) => { ... };`).
        *   It must store the container element as a class property (e.g., `this.containerElement = container;`).
        *   It must attach the listener using the stored properties: `this.containerElement.addEventListener('click', this.clickHandler);`.
        *   Set `this.listenersAttached = true;` at the end.





## 6. **Protocol: `--diagnose`**

**PROCESS (Strictly follow these steps):**

1.  **Acknowledge & Locate:**
    *   Acknowledge the command and repeat the `section`, `subsection`, and `description of issue`.
    *   Based on the `[section]` and `[subsection]` arguments, identify the primary files involved. This typically includes:
        *   The feature controller (`features/[section]/[Section]Tab.js`).
        *   The relevant component (`features/[section]/components/[Subsection].js`).
        *   The business logic handler (`systems/[SystemName]System.js`).
        *   The central orchestrator (`app/CharacterBuilder.js`).
        *   Any relevant data file (`data/[datafile].json`).

2.  **Review Architectural Contracts:**
    *   Read the `CLAUDE.md` file for the relevant layer (e.g., `features/CLAUDE.md`, `systems/CLAUDE.md`).
    *   State whether the current implementation appears to violate any of the architectural rules laid out in the contract.

3.  **Analyze & Cross-Reference:**
    *   Examine the identified files, focusing on the data flow for the described issue.
    *   Trace the sequence: UI Rendering -> Event Listener -> Central Orchestrator Delegation (`CharacterBuilder.js`) -> `Tab.js` Handler -> `System.js` Logic Call.
    *   Check for common failure points:
        *   **UI/HTML:** Is the `data-action` attribute correct and present? Are `data-` attributes for IDs correct?
        *   **Event Handling:** Is the event delegated correctly in `CharacterBuilder.js`? Is it handled correctly in the `Tab.js` file?
        *   **Data Flow:** Is the `character` object being passed correctly? Is data from a `.json` file missing or malformed?
        *   **System Logic:** Is the `System.js` file performing the correct validation and modification?
        *   **State Update:** Is `this.builder.updateCharacter()` being called at the end of the operation?

4.  **Formulate Diagnosis Report:**
    *   Present a clear, concise diagnosis in a "Diagnosis Report" block. This report **MUST** include:
        *   **`Hypothesis:`** A single sentence stating the most likely cause of the bug.
        *   **`Reasoning:`** A brief explanation of why you believe this is the cause, citing specific code snippets or architectural violations.
        *   **`Affected Files:`** A list of files that are part of the problem.

5.  **Propose a Fix:**
    *   Based on the diagnosis, propose a high-level plan of action (e.g., "I will modify the event handler in `MainPoolTab.js` and correct the cost calculation in `TraitFlawSystem.js`.").
    *   **Do not write the full code yet.**

6.  **Await Confirmation:**
    *   State that you are awaiting confirmation before implementing the fix. Do not proceed until you receive a "go-ahead" command.
