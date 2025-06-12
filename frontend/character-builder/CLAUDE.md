# **`frontend/character-builder/CLAUDE.md`**

This document is the **Architectural Constitution** for the Vitality Character Builder. It defines the roles, responsibilities, and boundaries of each layer of the application. Adherence to these principles is mandatory to maintain a scalable, debuggable, and stable codebase.

---

### **The Golden Rule: The Unbreakable Data Flow**

All character modifications **MUST** follow this exact sequence. There are no exceptions. This ensures a predictable, one-way data flow and a single source of truth.

1.  **UI Event:** A user interacts with a UI element (e.g., a button with a `data-action="purchase-flaw"` attribute).
2.  **Event Delegation:** The top-level event listener in `CharacterBuilder.js` catches the event and delegates it to the currently active `Tab` component (e.g., `MainPoolTab`).
3.  **Controller Logic:** The `Tab` component's handler method receives the event. It gathers the necessary information.
4.  **System Call:** The `Tab` handler calls a `static` method on the appropriate `System` class (e.g., `TraitFlawSystem.purchaseFlaw(...)`), passing the current character object.
5.  **Business Logic:** The `System` class performs all business logic and validation. It modifies the character object it received.
6.  **Centralized Update:** The `Tab` handler calls `this.builder.updateCharacter()`. This is the **only** way to commit changes.
7.  **Re-render:** The `CharacterBuilder` saves the new character state and triggers a re-render of the necessary UI components.

> **FORBIDDEN:** A component or tab **MUST NEVER** modify the character object directly (e.g., `this.builder.currentCharacter.tier = 5`). All modifications must be executed through a `System` class.

---

### **The Layers of Responsibility & Their Contracts**

Each directory has a strict, non-negotiable role.

#### `app/` - The Orchestrator
*   **Role:** To initialize and coordinate the application.
*   **Forbidden:** `CharacterBuilder.js` **MUST NOT** contain business logic for any specific feature. Its event handlers should be one-line delegations to the appropriate tab controller.

#### `features/` - The Feature Controllers
*   **Role:** To manage self-contained "vertical slices" of the UI (one per tab).
*   **Contract:** Must adhere to the **Component Re-render Contract** to prevent stale event listeners. This involves a full `removeEventListeners` -> `renderHTML` -> `setupEventListeners` cycle on each render.
*   **Forbidden:** A `Tab.js` file **MUST NOT** import or call another `Tab.js` file directly.

#### `systems/` - The Brains (Business Logic)
*   **Role:** To encapsulate the rules of the game.
*   **Contract:** All methods **MUST** be `static`. Systems are stateless collections of functions and must not have a `constructor`.
*   **Forbidden:** Systems **MUST NOT** know about or interact with the DOM or any UI components.

#### `calculators/` - The Math Engine
*   **Role:** To perform pure, stateless calculations.
*   **Contract:** All methods **MUST** be `static` pure functions (same input always yields same output).
*   **Forbidden:** Calculators **MUST NOT** have side effects or modify any objects passed to them.

#### `core/` - The Foundation
*   **Role:** To manage the game's foundational data and data structures.
*   **`GameDataManager.js`:** Must be initialized first.
*   **`VitalityCharacter.js`:** Defines the data **structure** only.

#### `data/` - The Library (Game Rules)
*   **Role:** To store all game rules, options, and content in JSON format.
*   **Contract:** UI should be data-driven from these files.

#### `shared/` - The Reusable Toolkit
*   **Role:** To provide generic, reusable UI components and utilities.
*   **Contract:** Code must be generic and not contain feature-specific logic.

---

### **Collaboration & Debugging**

When a bug occurs or a feature needs to be implemented, please describe the issue in detail. I will analyze the relevant files based on these architectural contracts and propose a solution. Instead of using rigid commands, let's collaborate on a plan, which I can then execute.