Of course. You are correct to pause and ensure the architectural guide is flawless before proceeding. An inaccurate or outdated guide is worse than no guide at all.

Based on my analysis of the codebase and your feedback, the existing `rulebook/character-builder/CLAUDE.md` was a good start but lacked the clarity, prescriptive rules, and practical examples needed for a robust architectural "constitution."

Here is the complete, rewritten `rulebook/character-builder/CLAUDE.md`. This version is meticulously aligned with your current file structure and establishes a clear, authoritative set of rules to govern all future development.

***

# **`rulebook/character-builder/CLAUDE.md`**

This document is the **Architectural Constitution** for the Vitality Character Builder. It defines the roles, responsibilities, and boundaries of each layer of the application. Adherence to these principles is mandatory to maintain a scalable, debuggable, and stable codebase.

---

### **The Golden Rule: The Unbreakable Data Flow**

All character modifications **MUST** follow this exact sequence. There are no exceptions. This ensures a predictable, one-way data flow and a single source of truth.

1.  **UI Event:** A user interacts with a UI element (e.g., a button with a `data-action="purchase-flaw"` attribute).

2.  **Event Delegation:** The top-level event listener in `CharacterBuilder.js` catches the event and delegates it to the currently active `Tab` component (e.g., `MainPoolTab`).

3.  **Controller Logic:** The `Tab` component's handler method receives the event. It gathers the necessary information (e.g., the flaw ID from the `data-` attribute).

4.  **System Call:** The `Tab` handler calls a `static` method on the appropriate `System` class (e.g., `TraitFlawSystem.purchaseFlaw(character, flawId, ...)`), passing the current character object and any other required data.

5.  **Business Logic:** The `System` class performs all business logic and validation. It modifies the character object it received and returns the *newly modified character object*.

6.  **Centralized Update:** The `Tab` handler receives the modified character and calls `this.builder.updateCharacter()`. This is the **only** way to commit changes.

7.  **Re-render:** The `CharacterBuilder` saves the new character state and triggers a re-render of the necessary UI components, ensuring the interface reflects the new data.

<br>

> **FORBIDDEN:** A component or tab **MUST NEVER** modify the character object directly (e.g., `this.builder.currentCharacter.tier = 5`). All modifications must be executed through a `System` class.

---

### **The Layers of Responsibility**

Each directory has a strict, non-negotiable role.

#### `app/` - The Orchestrator
*   **Role:** To initialize and coordinate the application.
*   **Responsibilities:**
    *   `app.js`: The single entry point. Ensures `GameDataManager` loads before anything else.
    *   `CharacterBuilder.js`: The central controller. Owns the single source of truth (`this.currentCharacter`). Initializes all `Tab` components. Manages the top-level event delegation map.
*   **Forbidden:** `CharacterBuilder.js` **MUST NOT** contain business logic for any specific feature. Its event handlers should be one-line delegations to the appropriate tab controller.

#### `features/` - The Feature Controllers
*   **Role:** To manage self-contained "vertical slices" of the UI (one per tab).
*   **Responsibilities:**
    *   Each `Tab.js` file is the controller for its feature.
    *   It renders its own UI and the UI of its local components.
    *   It handles all user interaction logic for its feature.
    *   It calls `System` classes to perform actions and `this.builder.updateCharacter()` to save state.
*   **Forbidden:** A `Tab.js` file **MUST NOT** import or call another `Tab.js` file directly. All cross-feature communication happens via the central `character` object.

#### `systems/` - The Brains (Business Logic)
*   **Role:** To encapsulate the rules of the game.
*   **Responsibilities:**
    *   All methods **MUST** be `static`. Systems are stateless collections of functions.
    *   Methods take the `character` object as an argument, perform logic, and return the modified `character` object.
    *   They are the only layer allowed to directly modify the character data structure.
*   **Forbidden:** Systems **MUST NOT** know about or interact with the DOM or any UI components.

#### `calculators/` - The Math Engine
*   **Role:** To perform pure, stateless calculations.
*   **Responsibilities:**
    *   All methods **MUST** be `static` pure functions (same input always yields same output).
    *   They calculate derived stats, point pool totals, and combat values.
    *   They take data (like the `character` object) and return a calculated value or object.
*   **Forbidden:** Calculators **MUST NOT** have side effects or modify any objects passed to them. They **MUST NOT** import from `systems/` or `features/`.

#### `core/` - The Foundation
*   **Role:** To manage the game's foundational data and data structures.
*   **Responsibilities:**
    *   `GameDataManager.js`: Loads all game rules from the `/data/` JSON files. Must be initialized first.
    *   `VitalityCharacter.js`: Defines the data **structure** of the character object. It is a blueprint, not a logic container.
*   **Forbidden:** `VitalityCharacter.js` **MUST NOT** contain complex game logic (e.g., `purchaseTrait()`). That belongs in a `System`.

#### `data/` - The Library (Game Rules)
*   **Role:** To store all game rules, options, and content.
*   **Responsibilities:**
    *   To be well-structured, valid JSON files.
*   **Forbidden:** This directory **MUST NOT** contain any executable JavaScript code.

#### `shared/` - The Reusable Toolkit
*   **Role:** To provide generic, reusable UI components and utilities.
*   **Responsibilities:**
    *   `shared/ui/`: "Dumb" UI components that render data they are given.
    *   `shared/utils/`: Application-agnostic utilities (`RenderUtils`, `EventManager`).
*   **Forbidden:** Shared code **MUST NOT** contain logic specific to any one feature. A shared `Card` component doesn't know what a "flaw" is; it only knows how to render a title and description.

---

### **How to Add a Feature (A Practical Example)**

To add a "Purchase Trait" button, you would:

1.  **UI (`features/main-pool/components/TraitPurchaseSection.js`):**
    *   Use `RenderUtils.renderButton()` to create a button with `data-action="purchase-trait"`.

2.  **Controller (`features/main-pool/MainPoolTab.js`):**
    *   In `setupEventListeners()`, add an entry for `'[data-action="purchase-trait"]'` that calls a new method, `this.handleTraitPurchase()`.

3.  **System (`systems/TraitFlawSystem.js`):**
    *   Create a `static purchaseTrait(character, traitData)` method that contains all the logic for adding the trait to the `character.mainPoolPurchases` array.

4.  **Connect the Layers (`features/main-pool/MainPoolTab.js`):**
    *   The `handleTraitPurchase()` method gathers the necessary `traitData` from the UI and then calls `TraitFlawSystem.purchaseTrait(this.builder.currentCharacter, traitData)`.

5.  **Update State (`features/main-pool/MainPoolTab.js`):**
    *   After the System call, invoke `this.builder.updateCharacter()` to save the changes and trigger a UI refresh.