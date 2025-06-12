# Shared Layer - The Reusability Contract

## Golden Rule #1: Shared Code Must Be Generic

-   All code within the shared/ directory must be decoupled from any specific game feature or business logic. It provides common tools and UI patterns for the rest of the application.
-   **THE RULE:** If a component or utility needs to know about the specifics of a single feature (e.g., it has hardcoded logic about "Special Attack Limits"), it does not belong in shared/.

## Golden Rule #2: Know Your Sub-Directory

The shared/ layer has two distinct parts with their own rules:

### shared/ui/ (The "Dumb" Components)

-   UI components in this directory (e.g., PointPoolDisplay.js) must be "dumb."
-   They **receive data** and **render HTML**. That's it.
-   They **MUST NOT** contain complex business logic from the systems/ layer.
-   They should emit generic events via data-action attributes rather than performing specific, hardcoded actions themselves. For example, a generic list component should have a data-action="item-clicked" event, not a data-action="purchase-flaw" event.

### shared/utils/ (The Application-Agnostic Tools)

-   Utilities in this directory (e.g., RenderUtils.js, EventManager.js) must be completely application-agnostic.
-   RenderUtils.js should not know what a "flaw" or "trait" is; it just knows how to render a generic "card" with a title, description, and cost. It is up to the *calling feature* to provide that data.
-   EventManager.js just knows how to delegate events; it doesn't know what the events do.
### The Reusability Contract

- **Role:** To provide generic, reusable UI components and utilities.
- **Generic Code Only:** All code in `shared/` must be decoupled from any specific game feature. A `Card` component doesn't know what a "flaw" is, only that it has a title and description.
- **Standardize with `RenderUtils`:** Common UI elements (`cards`, `buttons`, `form groups`) **MUST** be generated using `shared/utils/RenderUtils.js` to ensure consistency and proper event handling via `data-action` attributes.
