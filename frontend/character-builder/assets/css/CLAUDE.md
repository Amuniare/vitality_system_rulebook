# CSS Layer - AI Styling & Build Protocol

## Golden Rule #1: The Browser Loads ONE File

The web page (`character-builder.html`) **MUST** only load a single, combined stylesheet: `assets/css/character-builder.css`. This is a non-negotiable performance requirement.

## Golden Rule #2: Partials Are For Organization Only

The modular CSS files in the `assets/css/base/`, `assets/css/components/`, and `assets/css/tabs/` directories (e.g., `_buttons.css`, `_cards.css`) are for **developer organization only**. Their purpose is to make it easy for us to find and edit styles related to a specific component or section.

## Golden Rule #3: The Build Script is the Source of Truth

The `assets/css/character-builder.css` file is a **generated file**. It is not meant to be edited directly. The build script is the single source of truth for its contents. Any manual edits will be **deleted** the next time the build script is run.

---

## **The Mandatory CSS Development Workflow**

To make any change to the styles of the Character Builder, you **MUST** follow these steps:

1.  **Identify the Correct Partial File.**
    *   Want to change a button's color? Open `assets/css/components/_buttons.css`.
    *   Want to change a global color variable? Open `assets/css/base/_variables.css`.

2.  **Make Your Changes.**
    *   Edit the CSS rules within the appropriate partial file.

3.  **Run the Build Script.**
    *   Open a terminal at the project root.
    *   Run the command: `node tools/build-css.js`
    *   **(Recommended):** Add a script to your `package.json` like `"build:css": "node tools/build-css.js"` and run `npm run build:css`.

4.  **Refresh the Browser.**
    *   Hard-refresh the character builder page (Ctrl+F5 or Cmd+Shift+R) to see your changes applied.

---

### Forbidden Actions (To Prevent Errors)

-   **NEVER** edit `character-builder.css` by hand.
-   **NEVER** add `@import` to any CSS file.
-   **NEVER** add a new `<link>` tag for a stylesheet in `character-builder.html`. If you create a new partial, add it to the `cssPartials` array in `tools/build-css.js` instead.

---

## **Architectural Notes**

### **Architectural Note 1: Adopt a Component-First Styling Principle**

*   **Observation:** There are similar UI blocks that are styled with unique, tab-specific classes. For example, the overview boxes in `MainPoolTab.js` and `UtilityTab.js` have nearly identical layouts but are likely styled with separate classes like `.main-pool-overview-box` and `.utility-overview-box`.
*   **Problem:** This leads to code duplication and makes global style changes difficult. If we want to change the border on all overview boxes, we have to edit multiple classes.
*   **Principle:** **Style by component, not by location.** We should create a single, reusable class for common UI patterns and apply it wherever that pattern is used.
*   **Example:**
    *   **Instead of:** `.main-pool-overview-box { ... }` and `.utility-overview-box { ... }`
    *   **We should use:** A single `.overview-box { ... }` class applied to both divs in their respective HTML templates. This ensures they always look the same and can be updated from one central place.

### **Architectural Note 2: Standardize Naming with a BEM-like Convention**

*   **Observation:** Selector naming is inconsistent. We have flat names (`.btn-primary`), chained names (`.purchased-item .item-name`), and complex descendant selectors.
*   **Problem:** This makes it hard to understand the relationship between elements and can lead to high-specificity selectors that are difficult to override.
*   **Principle:** **Adopt a consistent naming convention like BEM (Block__Element--Modifier).** This makes the structure of our components clear directly from the CSS and HTML.
*   **Example:**
    *   **Block:** The standalone component, e.g., `.card`.
    *   **Element:** A part of the block, e.g., `.card__header`, `.card__title`.
    *   **Modifier:** A different state or version, e.g., `.card--selected`, `.card--disabled`.
    *   **Instead of:** `.purchased-item .item-name`
    *   **We would use:** `.purchased-item__name`

### **Architectural Note 3: Mandate Spacing Variables (The "Spacing Scale")**

*   **Observation:** While variables like `--gap-medium` are used, there are likely still hardcoded values (`margin-bottom: 2rem`, `padding: 1.5rem`) in some places.
*   **Problem:** Hardcoded pixel or rem values create an inconsistent visual rhythm and make global spacing adjustments impossible.
*   **Principle:** **All margins, paddings, and gaps MUST use the established spacing variables from `_variables.css`.** This creates a "spacing scale" that ensures all components are aligned to the same grid, resulting in a more professional and harmonious layout.
*   **Example:**
    *   **Instead of:** `margin-bottom: 2rem;`
    *   **We must use:** `margin-bottom: var(--gap-large);` (Assuming `2rem` should correspond to `--gap-large`). This allows us to change the "large" gap size in one place and have it update everywhere.