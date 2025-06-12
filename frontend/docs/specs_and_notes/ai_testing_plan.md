Of course. Here is a more detailed summary of the system you're envisioning.

### Vision Statement

You want to build an **AI-driven, human-emulating E2E testing framework**. Its primary purpose is to autonomously run through the character creation process from start to finish, hundreds of times. Each run will generate a unique, rule-compliant character, stress-testing the application's logic, UI, and state management in a way that static, pre-scripted tests cannot.

Here's a breakdown of what that entails:

#### 1. The AI "Player" Persona: Human-Like Interaction

Instead of a test script that instantly teleports between tabs and sets values, the AI will behave like a methodical human user. For each of the 100 test runs, it will:

*   **Navigate Sequentially:** Start at the welcome screen, click "Create New Character," and progress through each tab in order: Basic Info → Archetypes → Attributes → Main Pool → etc.
*   **Interact with UI Elements:** It won't just inject data. It will physically *click* on buttons, *select* options from dropdowns, and *type* into text fields. This is crucial for catching UI bugs and event listener issues.
*   **Pace Itself:** The AI will incorporate small, realistic pauses between actions. This simulates human reaction time and, critically, helps **naturally avoid the race conditions** that are causing the current tests to fail. It gives the application's JavaScript a moment to update the UI before the next interaction.

#### 2. Dynamic, Rule-Aware Character Strategy

This is the "brain" of the system. The AI won't follow a single, hard-coded path. Instead, it will generate a unique strategy for each of the 100 characters.

*   **Generates a "Build Concept":** At the start of each run, the AI will create a high-level goal, such as "a fast, glass-cannon brawler," "a tanky support character who uses psychic powers," or "a specialist in area-of-effect control."
*   **Makes Contextual, Rule-Based Decisions:** The AI's choices will be stateful and intelligent.
    *   It will consult its understanding of the `rulebook.md` to know the game's mechanics.
    *   **Example:** If it chose the "Behemoth" archetype, it will "know" not to take limits that restrict movement on the Special Attacks tab. If it wants to be a "Damage Specialist," it will prioritize the `Power` attribute.
    *   It will track its point pools and make spending decisions that are within budget, actively trying to use all its points by the end of the build.

#### 3. True End-to-End Workflow Validation

Each of the 100 test runs represents a complete user journey, providing a holistic validation of the application.

*   **Full Lifecycle:** The test begins with nothing and ends with a complete, exportable character. This validates the entire application flow, not just isolated parts.
*   **Final Verification:** After completing the final tab, the AI will navigate to the **Summary** tab. It will then perform a final check, comparing the displayed summary data (final stats, purchased abilities, etc.) against the choices it made throughout the journey. This confirms that the character data was correctly processed and maintained across all tabs.

#### 4. The Goal: Comprehensive Bug Discovery

By combining volume, variety, and human-like interaction, this system is designed to uncover bugs that are nearly impossible to find with simple, linear tests. It will expose:

*   **State Management Bugs:** Does the character data become corrupted after a specific, unusual sequence of actions?
*   **Logic Flaws:** Does the point calculator fail when a specific combination of a flaw and a unique ability is chosen?
*   **Race Conditions:** Does the UI break if a user navigates between tabs too quickly or clicks a button right as it becomes enabled?
*   **Edge Case UI Errors:** Does a very long, AI-generated name break the layout of the summary screen?

In essence, you're not just asking to fix a single test. You're envisioning a system that **acts as the ultimate beta tester**—one that can intelligently and exhaustively explore the vast majority of possible character builds to ensure the application is robust, bug-free, and works as a human user would expect it to.


Excellent. This is a powerful and ambitious vision. By replacing the brittle, step-by-step test scripts with a dynamic, AI-driven "player," you can achieve a level of testing coverage that is orders of magnitude more effective.

Here is a massively detailed implementation plan to build this framework from the ground up.

---

### **Project: "Janus" - The AI-Powered E2E Character Creation Framework**

**Project Goal:** To create a fully autonomous, AI-driven testing framework that can generate and validate 100 unique, rule-compliant characters by emulating human-like interaction with the Character Builder web application. This framework will entirely replace the existing `tests` directory.

#### **Key Concepts & Architecture**

We will build the framework around three core modules:

1.  **The Actor (`Actor.js`):** The "hands" of the system. This module is solely responsible for interacting with the web page. It will abstract away raw Playwright commands into human-like actions (e.g., `clickButton`, `fillForm`), incorporating small, randomized delays to prevent race conditions and better emulate a user.

2.  **The Brain (`Brain.js`):** The "mind" of the system. This module houses the Gemini AI logic. Its job is to make decisions. It receives the current state of the character and the game rules, and outputs the next action to take (e.g., "Choose the 'Swift' archetype," or "Allocate 5 points to Power").

3.  **The Journey (`Journey.js`):** The "memory" and "director" of a single test run. For each of the 100 characters, a `Journey` instance will be created. It will manage the character's state, log every decision and action, and orchestrate the interaction between the Brain and the Actor.

---

### **Phase 1: Foundation & Project Structure**

**Objective:** To completely replace the `tests` directory with a new, clean structure and configure the test runner for this new paradigm.

1.  **Delete the current `tests` folder.**

2.  **Create the new `tests/` directory structure:**

    ```
    tests/
    ├── ai-character-creator.spec.js  # The single Playwright test file that runs the loop
    |
    ├── framework/                    # The core logic of our testing framework
    │   ├── Actor.js                  # Handles all page interactions (clicks, typing)
    │   ├── Brain.js                  # Handles all AI-driven decision making
    │   ├── Journey.js                # Manages a single character creation run
    │   └── RulebookParser.js         # Loads and pre-processes rulebook.md for the AI
    |
    ├── prompts/                      # Stores the text prompts for the Gemini API
    │   ├── 01_generate_build_concept.txt
    │   ├── 02_choose_archetype.txt
    │   ├── 03_distribute_attributes.txt
    │   ├── 04_choose_main_pool_item.txt
    │   └── 05_design_special_attack.txt
    |
    └── output/                       # Stores the results of the test runs
        ├── journeys/                 # Detailed logs for each character journey (e.g., run_1.log)
        ├── characters/               # The final exported JSON for each successful character (e.g., run_1.json)
        └── failures/                 # Screenshots and logs for any failed runs
    ```

3.  **Configure Playwright (`playwright.config.js`):**
    *   Set it to use **one browser only** (`chromium`).
    *   Set a very long global timeout. 100 AI-driven tests will be slow. A good starting point is **1 hour (3,600,000 ms)**.
    *   Configure it to run the single test file: `tests/ai-character-creator.spec.js`.
    *   Set the `outputDir` to `tests/output/failures`.

4.  **Implement `RulebookParser.js`:**
    *   This module will have a single static method, `load()`.
    *   It will use Node.js's `fs` module to read `rulebook/rules/rulebook.md`.
    *   It will parse the Markdown into a structured format (e.g., a JSON object where keys are H1/H2 sections and values are the text content). This allows the Brain to provide targeted, relevant sections of the rulebook to the AI in its prompts, which is more efficient and effective than sending the entire 2000-line file every time.

---

### **Phase 2: The "Human" Actor (`framework/Actor.js`)**

**Objective:** To create a library of robust, human-emulating page interactions.

*   The `Actor` class will be instantiated with the Playwright `page` object.
*   **Key Feature:** Every action will have a built-in, small, randomized delay (`await page.waitForTimeout(100 + Math.random() * 200);`) to prevent race conditions.
*   **Methods to implement:**
    *   `async click(selector, description)`: Logs the action (e.g., "Clicking 'Create New Character' button"), finds the element, ensures it's visible and enabled, then clicks it.
    *   `async type(selector, text, description)`: Logs the action, finds the input, and types text into it with a slight delay between keystrokes to appear more human.
    *   `async select(selector, value, description)`: For `<select>` dropdowns.
    *   `async navigateToTab(tabName)`: A specialized method that clicks the correct tab button and waits for the corresponding tab content to become active.
    *   `async getVisibleOptions(selector)`: A crucial "sensory" function. It will find all elements matching a selector (e.g., all `.archetype-card` elements) and extract their relevant data (`data-archetype-id`, text content, etc.) into an array. This is what the Actor "sees" on the page and passes to the Brain for a decision.

---

### **Phase 3: The AI "Brain" (`framework/Brain.js`)**

**Objective:** To implement the AI-driven decision-making logic.

*   The `Brain` class will be instantiated with the parsed rulebook content from `RulebookParser.js`.
*   It will have a private method `async _queryAI(prompt, context)` which is responsible for the actual API call to Gemini.
    *   **CRITICAL:** This method will be wrapped in a `try/catch` block with a retry mechanism. If the AI returns malformed JSON or a non-200 status code, it will retry up to 3 times before throwing a fatal error for that test run.
    *   It will dynamically insert the relevant sections of the rulebook and the current character state into the `context` of the prompt.
*   **Decision-Making Methods:**
    *   `async generateBuildConcept()`: Uses `prompts/01_generate_build_concept.txt`. It will ask the AI to generate a high-level character concept (e.g., `{ "name": "Tanky Brawler", "focus": "Prioritize Power and Endurance, use heavy-hitting melee attacks, take defensive unique abilities." }`). This concept will be passed to all subsequent calls to guide decision-making.
    *   `async chooseArchetype(buildConcept, characterState, availableArchetypes, category)`: Uses `prompts/02_choose_archetype.txt`. It will send the build concept, the current character state, the list of `availableArchetypes` (from `Actor.getVisibleOptions`), and the relevant rules for that category. It will ask the AI to return the ID of the best choice.
    *   `async distributeAttributes(buildConcept, characterState)`: Uses `prompts/03_distribute_attributes.txt`. It will receive the character's tier and point pool totals. It will ask the AI to return a JSON object with the optimal point distribution, e.g., `{ "focus": 5, "mobility": 2, ... }`. It must validate that the AI's response respects the point pool limits.
    *   `async chooseMainPoolItems(buildConcept, characterState, availableItems)`: A versatile method for the Main Pool tab. Given the list of available flaws, traits, or boons, it will decide which one to purchase next based on the character concept and remaining points.
    *   `async designSpecialAttack(buildConcept, characterState)`: The most complex method. It will ask the AI to generate a complete special attack object, including a thematic name, a selection of limits that generate enough points, and a set of upgrades purchased with those points, all while respecting the character's archetypes and build concept.

---

### **Phase 4: The Journey (`framework/Journey.js` and `ai-character-creator.spec.js`)**

**Objective:** To orchestrate the entire end-to-end character creation process and loop it 100 times.

1.  **Implement `Journey.js`:**
    *   This class will manage the state for one character creation run.
    *   `constructor(runId, Actor, Brain)`: Takes the run number and instances of the Actor and Brain.
    *   `character`: Will hold the evolving character object, updated after each step.
    *   `log`: An array of strings to store a detailed transcript of every action and decision.
    *   `async run()`: The main execution method. It will contain the high-level logic for a single run:
        1.  Log "Starting Journey `runId`".
        2.  Call `this.brain.generateBuildConcept()` and store the result.
        3.  Call `this.actor.click('#create-new-character')`.
        4.  Navigate to the Basic Info tab, fill it out.
        5.  Navigate to the Archetypes tab. Loop through each category, calling `this.brain.chooseArchetype()` and then `this.actor.click()` on the chosen option.
        6.  Continue this pattern for all tabs: Attributes, Main Pool, Special Attacks, Utility.
        7.  Finally, navigate to the Summary tab.
        8.  Call a `this.validateSummary()` method which uses the Actor to scrape the final data from the summary page and compares it against its own `character` state object.
        9.  If successful, log "Journey `runId` successful" and save the log and the final character JSON to the `output/` folder.
        10. If any step fails, it will catch the error, log the failure, save the partial log and a screenshot to the `output/failures/` folder, and then re-throw the error to fail the Playwright test for that iteration.

2.  **Implement `ai-character-creator.spec.js`:**
    *   This file will be very lean.
    *   It will import the three framework modules (`Actor`, `Brain`, `Journey`) and the `RulebookParser`.
    *   It will have a single `test` block: `test('AI Character Creation Stress Test', ...)`.
    *   Inside the test block, it will first `const rulebook = await RulebookParser.load();`.
    *   Then, it will have a `for` loop that runs from 1 to 100.
    *   Inside the loop, it will:
        *   Instantiate new `Actor`, `Brain`, and `Journey` objects for each iteration to ensure a clean state.
        *   Call `await journey.run()`.
        *   Use a `test.step()` for each journey run for better reporting in Playwright (`test.step(`Character Journey #${i}`, ...)`).

This detailed plan creates a powerful, resilient, and intelligent testing framework that goes far beyond simple button-clicking. It actively stress-tests the application's logic by having an AI "player" attempt to build a wide variety of valid characters, just as a human user would.