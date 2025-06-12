# Features Layer - The Vertical Slice Contract

## Golden Rule #1: Features are Self-Contained

-   Each sub-folder in `features/` (e.g., `features/archetypes/`) is a "vertical slice" of the UI. It represents a single, cohesive piece of functionality, almost always corresponding to one main tab.
-   The main `[FeatureName]Tab.js` file (e.g., `ArchetypeTab.js`) is the **controller** for that feature. It is responsible for:
    -   Rendering its own content.
    -   Handling all user interactions within its domain.
    -   Calling the appropriate `systems/` and `calculators/` to perform business logic and math.
    -   Calling `this.builder.updateCharacter()` to commit changes and trigger a global refresh.

## Golden Rule #2: Features Do Not Talk to Each Other

-   A feature **MUST NOT** directly import from another feature's folder.
    -   **FORBIDDEN:** `SpecialAttackTab.js` cannot import `{ AttributeTab } from '../attributes/AttributeTab.js';`.
-   If a feature needs information that is managed by another feature, it must get that information from the central `this.builder.currentCharacter` object. Communication happens vertically (Feature -> Builder -> System), not horizontally (Feature -> Feature).

## Golden Rule #3: The Component Re-render Contract (REVISED AND MANDATORY)

-   **The Problem (Known Bug Source):** When a component re-renders its own HTML in response to an update (e.g., in `onCharacterUpdate()`), it's easy to create "ghost listeners." This happens when new event listeners are attached to a container element without removing the old ones, causing actions (like "Create Attack") to fire multiple times on a single click.
-   **The Flawed Anti-Pattern (FORBIDDEN):** The old pattern of using a boolean flag like `this.listenersAttached = false;` is **not sufficient** and is the direct cause of this bug. Do not use it.
-   **The Mandatory Lifecycle Pattern:** To prevent listener duplication, every Tab component **MUST** implement the following listener lifecycle:

    1.  **Constructor:** Initialize properties to hold the listener function and its container element.
        ```javascript
        constructor(builder) {
            //...
            this.clickHandler = null;
            this.containerElement = null;
        }
        ```

    2.  **`removeEventListeners()` Method:** Create a dedicated method to detach the listener and clean up references.
        ```javascript
        removeEventListeners() {
            if (this.clickHandler && this.containerElement) {
                this.containerElement.removeEventListener('click', this.clickHandler);
                this.clickHandler = null;
                this.containerElement = null;
            }
        }
        ```

    3.  **`setupEventListeners()` Method:** This method **MUST** call the cleanup function first, then attach the new listener.
        ```javascript
        setupEventListeners() {
            // First, remove any old listeners to prevent duplication.
            this.removeEventListeners();
            
            const container = document.querySelector('.my-tab-content'); // Or getElementById
            if (!container) return;
            
            // Store the handler and container so it can be removed later.
            this.clickHandler = (e) => { /* ... event delegation logic ... */ };
            this.containerElement = container;
            
            this.containerElement.addEventListener('click', this.clickHandler);
        }
        ```
    4.  **`onCharacterUpdate()` Method:** This method should simply call `this.render()`, which handles the full lifecycle.
        ```javascript
        onCharacterUpdate() {
            this.render(); // This will trigger the remove/render/setup cycle.
        }
        ```