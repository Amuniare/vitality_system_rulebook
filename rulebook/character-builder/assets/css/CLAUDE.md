# CSS Layer - AI Styling & Build Protocol

## Golden Rule #1: The Browser Loads ONE File

The web page (character-builder.html) **MUST** only load a single, combined stylesheet: ssets/css/character-builder.css. This is a non-negotiable performance requirement.

-   **FORBIDDEN:** Adding @import rules to any CSS file that the browser loads. This creates multiple network requests, which drastically slows down page rendering and was the cause of the previous "white page" error.
-   **FORBIDDEN:** Adding multiple <link rel="stylesheet" ...> tags to the HTML file for the same reason.

> **The Analogy:** We give the browser one master recipe that has everything in it. We do not give it a list of 20 different recipe cards it has to go find itself.

## Golden Rule #2: Partials Are For Organization Only

The modular CSS files in the ssets/css/base/, ssets/css/components/, and ssets/css/tabs/ directories (e.g., _buttons.css, _cards.css) are for **developer organization only**.

-   These files **are not** and **should not** be loaded directly by the browser.
-   Their purpose is to make it easy for us to find and edit styles related to a specific component or section.
-   All styles for a given component (including its responsive @media queries) should be co-located within its partial file.

## Golden Rule #3: The Build Script is the Source of Truth

The ssets/css/character-builder.css file is a **generated file**. It is not meant to be edited directly.

-   The PowerShell script (	ools/build-css.ps1) acts as our "build tool."
-   Its only job is to **read** all the small partial files and **concatenate** (combine) them, in the correct order, into the single ssets/css/character-builder.css file.
-   Any manual edits made to ssets/css/character-builder.css will be **deleted** the next time the build script is run.

---

## **The Mandatory CSS Development Workflow**

To make any change to the styles of the Character Builder, you **MUST** follow these steps:

1.  **Identify the Correct Partial File.**
    -   Want to change a button's color? Open ssets/css/components/_buttons.css.
    -   Want to change the layout of the attributes tab? Open ssets/css/tabs/_attributes.css.
    -   Want to change a global color variable? Open ssets/css/base/_variables.css.

2.  **Make Your Changes.**
    -   Edit the CSS rules within the appropriate partial file.

3.  **Run the Build Script.**
    -   Open a PowerShell terminal at the project root.
    -   Run the final concatenation script (v4 or later) to rebuild the main ssets/css/character-builder.css file.

4.  **Refresh the Browser.**
    -   Hard-refresh the character builder page (Ctrl+F5 or Cmd+Shift+R) to see your changes applied.

---

### Forbidden Actions (To Prevent Errors)

-   **NEVER** edit ulebook/character-builder/assets/css/character-builder.css by hand.
-   **NEVER** add @import to character-builder.css.
-   **NEVER** add a new <link> tag for a stylesheet in character-builder.html. If you create a new partial, add it to the build script's import order instead.

---

### Build Script Location

The CSS build script is located at: `tools/build-css.ps1`

To run it from PowerShell at the project root:
```
. 'C:\Users\Trent\OneDrive\Documents\GitHub\vitality_system_rulebook\tools\build-css.ps1'
```

This script concatenates all partial CSS files in the correct order to rebuild `assets/css/character-builder.css`.
