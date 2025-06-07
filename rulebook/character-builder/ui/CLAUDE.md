# UI Layer - AI Development Contract

## Golden Rule #1: The `data-action` Contract (Non-Negotiable)

This is the most common source of bugs. Follow it perfectly.
-   All interactive elements in HTML **MUST** use a `data-action` attribute.
-   The value of `data-action` **MUST** be in `kebab-case` (e.g., `create-new-attack`).
-   The event handler key in `EventManager.delegateEvents` **MUST** match the `data-action` string *exactly*.

    **Correct:**
    ```html
    <button data-action="create-new-attack"></button>
    ```
    ```javascript
    EventManager.delegateEvents(container, {
        click: {
            '[data-action="create-new-attack"]': () => this.handleCreateAttack()
        }
    });
    ```

    **WRONG:** `data-action="createNewAttack"` or a handler key of `'createNewAttack'`.

## Golden Rule #2: Parents Handle Events ("Smart Tabs, Dumb Components")

-   **`tabs/` are SMART.** They contain all event handling logic using `EventManager`. They manage the state of their section.
-   **`components/` are DUMB.** They only contain a `render()` method. They **MUST NOT** have `setupEventListeners()` or handle their own events. They render HTML with `data-action` attributes for their parent Tab to handle.

## Golden Rule #3: UI Reads, Systems Write

-   The UI's job is to **read** the `character` object and display it.
-   To **modify** the character, the UI event handler **MUST** call a `System` class method.
-   **NEVER** write code like `this.builder.currentCharacter.name = 'new name'` inside the UI layer. Always use the system, e.g., `this.builder.setCharacterName('new name')` which then calls the system.

## Debugging Checklist: UI Not Responding?

1.  **Check `data-action` casing.** Is it `kebab-case` in the HTML?
2.  **Check handler key.** Does the string in `EventManager` in the parent Tab *exactly* match the HTML?
3.  **Check the handler.** Is a `console.log` at the top of the handler function firing? If not, the event is not being caught.
