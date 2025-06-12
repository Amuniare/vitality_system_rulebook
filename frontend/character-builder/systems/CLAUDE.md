# Systems Layer - AI Business Logic Contract

## Golden Rule #1: Stateless is Law

-   All methods in a System class **MUST** be `static`.
-   A System class **MUST NOT** have a `constructor` or store any data on `this`. It is a collection of pure business logic functions.

## Golden Rule #2: No DOM Allowed

-   System classes **MUST NOT** interact with or know about HTML or the DOM in any way.
-   **FORBIDDEN:** `document.querySelector`, `element.innerHTML`, etc.

## Golden Rule #3: The System Workflow

-   Every action that modifies the character should have a `validate...()` method and a `perform...()` method (e.g., `validatePurchase()` and `purchase()`).
-   Validation methods **MUST** return a structured object: `{ isValid: boolean, errors: string[], warnings: string[] }`.
-   "Write" methods **MUST** take the `character` object as an argument and return the modified `character` object.

### The Business Logic Contract

- **Role:** To encapsulate the rules of the game.
- **Contract: Stateless is Law:** All methods **MUST** be `static`. Systems are stateless collections of functions and must not have a `constructor`.
- **The System Workflow:** Every action should have a `validate...()` method and a `perform...()` method. "Write" methods must take the `character` object as an argument.
- **Forbidden:** Systems **MUST NOT** interact with the DOM. They **MUST NOT** import from other `System` classes.
