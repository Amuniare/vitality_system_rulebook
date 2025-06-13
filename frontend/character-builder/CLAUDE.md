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



---

### **Architectural Contracts (Learned from Dev Logs)**

These are core principles that have been established to prevent common bugs. Adherence is mandatory.

**1. The Component Re-render Contract (Stale Listener Fix)**
- **Problem:** Event listeners were duplicating on re-renders, causing UI freezes and multiple action firings.
- **Rule:** A simple `listenersAttached` flag is not enough. The mandatory pattern is to have dedicated `removeEventListeners()` and `setupEventListeners()` methods. The `render()` or `onCharacterUpdate()` method **must** call `removeEventListeners()` *before* attaching new ones.
- *Reference: Dev Logs 22E, 23A, 23B*

**2. The Non-Blocking Advisory Budget System**
- **Problem:** The app was initially blocking users from making purchases they couldn't afford.
- **Rule:** The UI should *advise, not block*. Show a warning if a user goes over budget but always allow the action to proceed.
- *Reference: Dev Logs 18, 20A*

**3. Scoped DOM Queries**
- **Problem:** Using global queries like `document.getElementById` caused conflicts between multiple instances of the same component.
- **Rule:** Components must use scoped queries (e.g., `container.querySelector(...)` or `element.closest(...)`) to ensure they only interact with their own DOM elements.
- *Reference: Dev Log 22D*

**4. Data-Driven Design (Single Source of Truth)**
- **Problem:** Hardcoded data (like character types) led to inconsistencies.
- **Rule:** All game data must be loaded from the JSON files via the `GameDataManager`. UI components should not contain hardcoded game rules.
- *Reference: Dev Log 23C*

**5. One-Way Data Flow & "Dumb" Components**
- **Problem:** The failed Summary Tab reconstructions happened because components were trying to do their own complex calculations.
- **Rule:** Parent components (like a `Tab`) are responsible for fetching and processing all data. They then pass that prepared data down to "dumb" child components that only handle rendering.
- *Reference: Dev Logs 19, 24A, 25B*


---

## 4. Bugfix Recipes & Architectural Patterns

This section serves as a living document and a playbook for solving common, recurring bugs. When a problem matches one of these patterns, we can apply the established solution to resolve it quickly and consistently.

### Recipe 1: The Data-Contract Violation

*   **Problem:** A feature suddenly stops working or a tab displays as a blank screen after a seemingly unrelated change. The console often shows a `TypeError`, such as `Cannot read properties of undefined (reading 'basic')`.
*   **Root Cause:** A generic, shared system was not updated to handle a new, specialized data structure. The system's code expects data in an old format but receives it in a new one, causing a crash.
*   **Solution Pattern (Bypass or Update):**
    1.  **Immediate Fix (Bypass and Specialize):** Modify the *calling code* to bypass the old, generic validator and instead use a new, specialized function that understands the new data structure.
    2.  **Long-Term Fix (Update the Consumer):** Update the generic function itself with conditional logic to detect the data structure and route to the correct logic path.
*   **Reference Dev Logs:** `07_A`, `25B`, `30`

### Recipe 2: The Stale Listener Lifecycle

*   **Problem:** An action fires multiple times from a single click ("Ghost Listeners"), or buttons on a tab become unresponsive after navigating away and returning ("Dead Tabs").
*   **Root Cause:** Improper event listener lifecycle management. On re-render, new listeners are attached without removing the old ones, leading to duplicates, or a flag incorrectly prevents new listeners from ever being attached.
*   **Solution Pattern (The Mandatory Lifecycle):**
    1.  **Store Handler References:** The component's `constructor` must initialize properties to hold the listener functions and the container element (e.g., `this.clickHandler = null`).
    2.  **Implement `removeEventListeners()`:** Create a dedicated method to explicitly call `removeEventListener()` for each event type and nullify the stored references.
    3.  **Call Cleanup Before Setup:** The `setupEventListeners()` method **must** call `removeEventListeners()` at the very beginning, before creating and attaching any new listeners.
*   **Reference Dev Logs:** `06_B`, `10_C`, `22E`, `23A`, `23B`

### Recipe 3: The Big Bang Refactor (Anti-Pattern)

*   **Problem:** A major feature is completely broken and unusable after a large-scale refactoring attempt. The new version is significantly worse than the old one.
*   **Root Cause:** A process failure. Attempting to solve too many complex architectural and UX problems in a single, massive change introduces too many variables to debug effectively.
*   **Solution Pattern (Revert and Decompose):**
    1.  **Immediately Revert:** Abandon the failing branch and restore the last known-good version.
    2.  **Decompose the Problem:** Break the original large objective down into the smallest possible, independent, and testable tasks.
    3.  **Implement Incrementally:** Tackle one small task at a time, validating that the application is fully functional after each step before proceeding.
*   **Reference Dev Logs:** `07_B`, `19`, `20`

### Recipe 4: State & Scope Integrity

*   **Problem:** Input fields lose focus while typing; UI controls only work for the first of several components; or a component's internal state is lost after an action.
*   **Root Cause:** A violation of component encapsulation. Either a child component is trying to manage state that should belong to its parent, or it's using global DOM queries (`getElementById`) in a multi-instance environment.
*   **Solution Pattern (Elevate State, Scope Down Queries):**
    1.  **Elevate Persistent State:** Any state that needs to survive a re-render must be "lifted up" to the parent component that orchestrates the re-render.
    2.  **Use Scoped DOM Queries:** Never use global queries. Event handlers should receive the clicked element as a parameter and use `element.closest('.component-wrapper').querySelector('.target-input')` to find elements *only within that specific component instance*.
*   **Reference Dev Logs:** `14`, `22D`, `22F`