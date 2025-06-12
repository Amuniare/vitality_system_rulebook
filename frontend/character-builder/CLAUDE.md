# **`frontend/character-builder/CLAUDE.md`**

This document is the **Architectural Constitution** for the Vitality Character Builder. It defines the roles, responsibilities, and boundaries of each layer of the application. Adherence to these principles is mandatory to maintain a scalable, debuggable, and stable codebase.

---

### **The Golden Rule: The Unbreakable Data Flow**

All character modifications **MUST** follow this exact sequence. There are no exceptions. This ensures a predictable, one-way data flow and a single source of truth.

1.  **UI Event:** A user interacts with a UI element (e.g., a button with a `data-action="purchase-flaw"` attribute).

2.  **Event Delegation:** The top-level event listener in `CharacterBuilder.js` catches the event and delegates it to the currently active `Tab` component (e.g., `MainPoolTab`).

3.  **Controller Logic:** The `Tab` component's handler method receives the event. It gathers the necessary information (e.g., the flaw ID from the `data-` attribute).

4.  **System Call:** The `Tab` handler calls a `static` method on the appropriate `System` class (e.g., `TraitFlawSystem.purchaseFlaw(character, flawId, ...)`), passing the current character object and any other required data.

5.  **Business Logic:** The `System` class performs all business logic and validation. It modifies the character object it received.

6.  **Centralized Update:** The `Tab` handler calls `this.builder.updateCharacter()`. This is the **only** way to commit changes.

7.  **Re-render:** The `CharacterBuilder` saves the new character state and triggers a re-render of the necessary UI components, ensuring the interface reflects the new data.

<br>

> **FORBIDDEN:** A component or tab **MUST NEVER** modify the character object directly (e.g., `this.builder.currentCharacter.tier = 5`). All modifications must be executed through a `System` class.

---

### **The Layers of Responsibility & Their Contracts**

Each directory has a strict, non-negotiable role.

#### `app/` - The Orchestrator
*   **Role:** To initialize and coordinate the application.
*   **Responsibilities:**
    *   `app.js`: The single entry point. Ensures `GameDataManager` loads before anything else.
    *   `CharacterBuilder.js`: The central controller. Owns the single source of truth (`this.currentCharacter`). Initializes all `Tab` components. Manages the top-level event delegation map.
*   **Forbidden:** `CharacterBuilder.js` **MUST NOT** contain business logic for any specific feature. Its event handlers should be one-line delegations to the appropriate tab controller.

#### `features/` - The Feature Controllers
*   **Role:** To manage self-contained "vertical slices" of the UI (one per tab).
*   **Contract: The Component Re-render Contract (Revised):**
    *   **Problem:** Re-rendering a component's HTML without properly cleaning up old event listeners will create "ghost listeners," causing actions to fire multiple times. Simple boolean flags like `listenersAttached` are insufficient and are the source of this bug.
    *   **The Mandatory Pattern:** To prevent this, every component that re-renders itself (e.g., a Tab) **MUST** implement a full listener lifecycle:
        1.  In the `constructor`, initialize properties to hold the listener function and its container element (e.g., `this.clickHandler = null; this.containerElement = null;`).
        2.  Create a dedicated `removeEventListeners()` method that uses `this.containerElement.removeEventListener('click', this.clickHandler);` and then nullifies `this.clickHandler` and `this.containerElement`.
        3.  The `setupEventListeners()` method **MUST** call `this.removeEventListeners()` at the very beginning, before attaching any new listeners.
        4.  The `onCharacterUpdate()` method should simply call `this.render()`, which in turn handles the full `removeEventListeners` -> `renderHTML` -> `setupEventListeners` cycle.
*   **Forbidden:** A `Tab.js` file **MUST NOT** import or call another `Tab.js` file directly.

#### `systems/` - The Brains (Business Logic)
*   **Role:** To encapsulate the rules of the game.
*   **Contract: Stateless is Law:** All methods **MUST** be `static`. Systems are stateless collections of functions and must not have a `constructor`.
*   **Forbidden:** Systems **MUST NOT** know about or interact with the DOM or any UI components. They **MUST NOT** import from other `System` classes.

#### `calculators/` - The Math Engine
*   **Role:** To perform pure, stateless calculations.
*   **Contract: The Purity Contract:** All methods **MUST** be `static` pure functions (same input always yields same output). They calculate derived stats and point pool totals.
*   **Forbidden:** Calculators **MUST NOT** have side effects, modify any objects passed to them, or import from `systems/` or `features/`.

#### `core/` - The Foundation
*   **Role:** To manage the game's foundational data and data structures.
*   **Responsibilities:**
    *   `GameDataManager.js`: Loads all game rules from the `/data/` JSON files. Must be initialized first.
    *   `VitalityCharacter.js`: Defines the data **structure** of the character object. It is a blueprint, not a logic container.
*   **Forbidden:** `VitalityCharacter.js` **MUST NOT** contain complex game logic (e.g., `purchaseTrait()`). That belongs in a `System`.

#### `data/` - The Library (Game Rules)
*   **Role:** To store all game rules, options, and content.
*   **Contract: Data-Driven Design:** The UI should be capable of rendering content directly from these files. Avoid hardcoding game rules in the UI layer. This allows content changes without code changes.
*   **Forbidden:** This directory **MUST NOT** contain any executable JavaScript code.

#### `shared/` - The Reusable Toolkit
*   **Role:** To provide generic, reusable UI components and utilities.
*   **Contract: Standardize with `RenderUtils`:** Common UI elements (`cards`, `buttons`, `form groups`) **MUST** be generated using `shared/utils/RenderUtils.js` to ensure consistency and proper event handling via `data-action` attributes.
*   **Forbidden:** Shared code **MUST NOT** contain logic specific to any one feature.

---

## **Special Directives and Automated Workflows**

This section defines special commands that trigger automated, multi-step processes specific to the frontend character builder.

*   **`--refactor "[Section]" "[Problem Description]" [Recipe]`:** This directive initiates a guided refactoring process. You WILL:
    1.  Consult the **Section-to-Filepath Mapping** (Section below) to find the `Entry Point File` for the given `[Section]`.
    2.  Analyze the `[Problem Description]` in the context of the entry point file to pinpoint the specific component file that needs modification.
    3.  Look up the `[Recipe]` in the **Recipe Book** (Section below).
    4.  Apply the recipe's implementation steps to the file identified in step 2.
    5.  Present the modified file(s) for review.
    *   *Example: `--refactor "Special Attacks Tab" "The upgrade category headers are not clickable" STALE_EVENT_LISTENERS`*

*   `--diagnose [section] [subsection] "[description of issue]"`: This directive initiates a structured debugging workflow. Follow the steps in the **Diagnosis Protocol** section below.

---

## **The Refactoring Cookbook**

### **Section-to-Filepath Mapping**

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

### **Recipe Book**

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

---

## **Diagnosis Protocol: `--diagnose`**

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