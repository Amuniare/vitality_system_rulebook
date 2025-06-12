# App Layer - The Orchestrator's Contract

## Golden Rule #1: The App is the "Glue"

-   The pp directory's sole purpose is to initialize and orchestrate the major parts of the application.
-   pp.js is the single entry point. Its only jobs are to ensure the DOM is ready and to sequence the initialization of core services (GameDataManager) and the main controller (CharacterBuilder).
-   CharacterBuilder.js is the central controller. It is responsible for:
    -   Owning and managing the single source of truth: 	his.currentCharacter.
    -   Initializing all Tab components from the eatures/ layer.
    -   Setting up the main event delegation listeners that are then handled by the individual tabs.
    -   Providing a unified updateCharacter() method that Tab components call to trigger a re-render.

## Golden Rule #2: No Feature Logic Here

-   The CharacterBuilder.js file **MUST NOT** contain business logic specific to any one feature.
-   **FORBIDDEN:** A method like handleFlawPurchase() inside CharacterBuilder.js.
-   **THE RULE:** If you are adding logic specific to a feature (like "what happens when I purchase a flaw"), that logic belongs in that feature's Tab.js file (e.g., MainPoolTab.js). The CharacterBuilder's event map should simply delegate the event to the appropriate tab handler.
-   The CharacterBuilder should be kept as lean as possible. Its job is to connect the features, not to *be* the features.
### The Orchestrator's Contract

- **Role:** To initialize and coordinate the application.
- **Responsibilities:**
    - `app.js`: The single entry point. Ensures `GameDataManager` loads before anything else.
    - `CharacterBuilder.js`: The central controller. Owns the single source of truth (`this.currentCharacter`). Initializes all `Tab` components. Manages the top-level event delegation map.
- **Forbidden:** `CharacterBuilder.js` **MUST NOT** contain business logic for any specific feature. Its event handlers should be one-line delegations to the appropriate tab controller.
