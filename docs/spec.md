Of course. I will focus exclusively on Project 2: Character Identity & Presentation.

Based on my analysis of `docs/projects.md` and the provided codebase, here is a breakdown of the problems we need to solve and a step-by-step plan to implement the feature.

### 1. Problem Identification

The core issue is that the character builder currently lacks a dedicated system for capturing structured, narrative-focused character information. It relies on a few simple text fields in the `BasicInfoTab`, which is insufficient for the rich backstories required by the campaign.

This breaks down into several technical problems:

1.  **Missing Data Source:** The application has no data file to define the campaign-specific biography questions. The planned `frontend/character-builder/data/bio.json` exists in the codebase but is not yet integrated.
2.  **Data Loading Gap:** The `GameDataManager` in `frontend/character-builder/core/GameDataManager.js` is unaware of `bio.json` and has no method to load or provide its content to the application.
3.  **Inadequate Character Model:** The `VitalityCharacter` class in `frontend/character-builder/core/VitalityCharacter.js` lacks a dedicated property to store the structured answers to the new questionnaire. A simple text field won't work.
4.  **No UI Feature:** There is no "Identity" tab. The existing `BasicInfoTab` is for mechanical data (name, tier) and is the wrong place for this new, dynamic form. A new feature module needs to be created.
5.  **Lack of Dynamic Rendering:** The new tab must be ableto build a form dynamically from the loaded `bio.json` data, creating different input types (dropdowns, text areas) as specified.
6.  **State Management Deficiency:** There is no mechanism to capture user input from this new dynamic form and save it to the character object in a structured way.
7.  **Navigation and Integration:** The new tab is not integrated into the main application's navigation (`character-builder.html`) or the central controller (`CharacterBuilder.js`).

### 2. Implementation Plan

To solve these problems, we will follow the implementation steps outlined in `projects.md`, but with more specific technical details.

---

#### **Phase 1: Data Layer Foundation**

This phase establishes the data contract for the new feature.

*   **Step 1.1: Integrate `bio.json` into the Data Manager**
    *   **File:** `frontend/character-builder/core/GameDataManager.js`
    *   **Action:**
        1.  Add `'bio': 'data/bio.json'` to the `this.dataFiles` object.
        2.  Create a new getter method: `getBio() { return this._getData('bio', { questionnaire: [] }); }`. This will provide the questionnaire data to the rest of the application.

*   **Step 1.2: Update the Character Model**
    *   **File:** `frontend/character-builder/core/VitalityCharacter.js`
    *   **Action:** In the `constructor`, add a new property to hold the structured answers: `this.biographyDetails = {};`. This will store answers keyed by the question `id` from `bio.json`.

---

#### **Phase 2: UI and Feature Implementation**

This phase builds the new user-facing tab.

*   **Step 2.1: Create the New "Identity" Tab**
    *   **Action:** Create a new file: `frontend/character-builder/features/identity/IdentityTab.js`.
    *   **Content:** This file will contain the `IdentityTab` class, which will be responsible for rendering the questionnaire and handling user input. It will follow the standard tab structure with `constructor`, `render`, and `setupEventListeners` methods.

*   **Step 2.2: Implement Dynamic Form Rendering in `IdentityTab.js`**
    *   **File:** `frontend/character-builder/features/identity/IdentityTab.js`
    *   **Action:** Implement the `render()` method.
        1.  It will call `gameDataManager.getBio()` to get the questions.
        2.  It will iterate through the `questionnaire` array.
        3.  For each question, it will use a `switch` statement on `question.type` to dynamically generate the correct HTML using `RenderUtils` (e.g., `RenderUtils.renderSelect` for `dropdown`, a standard `textarea` for `textarea`).
        4.  It will handle the `gmOnly` flag by adding a specific class or data attribute to the form group for potential future styling.
        5.  For dropdowns, it will render a corresponding hidden text input for the "Other..." option.

*   **Step 2.3: Implement Event Handling in `IdentityTab.js`**
    *   **File:** `frontend/character-builder/features/identity/IdentityTab.js`
    *   **Action:** Implement `setupEventListeners()` using `EventManager.delegateEvents`.
        1.  Listen for `change` on dropdowns. If the selected value is "Other", it will un-hide the associated text input. Otherwise, it will hide it.
        2.  Listen for `input` on all form elements (`select`, `textarea`, `input[type=text]`). This event will trigger the state update.

---

#### **Phase 3: Integration and State Management**

This phase connects the new feature to the core application.

*   **Step 3.1: Implement State Update Logic**
    *   **File:** `frontend/character-builder/features/identity/IdentityTab.js`
    *   **Action:** Create a handler method `handleBioUpdate(element)` that is called by the event listener.
        1.  It will extract the question `id` and the `value` from the input element.
        2.  It will call a new method on the main builder: `this.builder.setBiographyDetail(questionId, value)`.

*   **Step 3.2: Centralize State Modification**
    *   **File:** `frontend/character-builder/app/CharacterBuilder.js`
    *   **Action:** Create the new method `setBiographyDetail(questionId, value)`.
        1.  This method will update the character object: `this.currentCharacter.biographyDetails[questionId] = value;`.
        2.  It will then call `this.updateCharacter()` to persist the change and trigger a re-render of any necessary components, adhering to our one-way data flow architecture.

*   **Step 3.3: Integrate the Tab into the Application**
    *   **File 1:** `frontend/character-builder/character-builder.html`
        *   **Action:** Add a new button to the `.tab-navigation` div: `<button class="tab-btn" data-tab="identity">Identity</button>`. I will place it after "Basic Info".
    *   **File 2:** `frontend/character-builder/app/CharacterBuilder.js`
        *   **Action:**
            1.  `import { IdentityTab } from '../features/identity/IdentityTab.js';`
            2.  In `initializeTabs()`, add `'identity': new IdentityTab(this)` to the `this.tabs` object.
    *   **File 3:** `frontend/character-builder/assets/css/character-builder.css`
        *   **Action:** We will need to add an empty partial `_identity.css` and add it to the `build-css.js` script to ensure our CSS architecture remains consistent, even if no new styles are immediately needed.

