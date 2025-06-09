# **`rulebook/character-builder/CLAUDE.md`**

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
*   **Contract: The Component Re-render Contract:** Any method that re-renders its own HTML (e.g., `render()`, `onCharacterUpdate()`) **MUST** ensure that its event listeners are not duplicated. The standard pattern is `this.listenersAttached = false;` at the start of the update method, with a guard in `setupEventListeners()`.
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
