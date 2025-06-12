# Automated Workflow Protocol: Spec to Tested Implementation

## GOAL
The objective of this automated workflow is to transform the approved feature specification located in `spec.md` into a highly detailed implementation plan (`roadmap.md`), and then to execute that plan by implementing each task, verifying it with a test run, and updating the roadmap.

---

## **Phase 1: Detailed Roadmap Generation (The Plan)**

This phase is triggered when you are asked to process the `.claude/spec.md` file. The goal is to demonstrate a comprehensive understanding of the spec by creating a granular, verifiable implementation plan before any code is written.

**PROCESS (Strictly follow these steps):**

1.  **Read and Confirm:** Read the entire `.claude/spec.md` file. Announce that you have read it and are beginning the detailed roadmap generation process.

2.  **Generate Detailed Roadmap:** Create a file-by-file implementation plan based on the specification. The plan **MUST** break down the work for each file into a specific checklist. The plan will be a Markdown table in the new `.claude/roadmap.md` file.

3.  **Roadmap Structure:** The generated Markdown table MUST contain the following columns:
    *   `Status`: Default to `[ ]` (To-Do).
    *   `File`: The full, relative path to the file (e.g., `rulebook/character-builder/features/summary/components/AttributesSummary.js`).
    *   `Priority`: (e.g., CRITICAL, HIGH, MEDIUM, LOW).
    *   `Dependencies`: A comma-separated list of other files in the plan that must be completed first.
    *   `Implementation Details`: A detailed, multi-point checklist of the specific changes or logic to be implemented in this file. This **MUST** be a bulleted list.
    *   `Progress Notes`: Leave this column empty.

4.  **Example of `Implementation Details` Column:**
    For a file like `AttributesSummary.js` based on the v4 spec, the `Implementation Details` column would look like this:
    ```markdown
    - The `render` method must accept `character` and `statsBreakdown` objects as arguments.
    - Render a "Core Attributes" card using the new `summary-item` pattern for each attribute.
    - Render a "Calculated Stats" card.
    - For each calculated stat, render a `stat-item-detailed` block.
    - Populate the `stat-breakdown` element by formatting the data from the `statsBreakdown` object (e.g., "10 (Base) + 4 (Tier)...").
    - **MUST NOT** perform any calculations internally.
    ```

5.  **Completion of Phase 1:** After generating the detailed `.claude/roadmap.md` file, announce that the process is complete and you are awaiting the next instruction (which will be to start building the files from the roadmap). Do not proceed with coding until explicitly told to do so.

---

## **Phase 2: Task Implementation (The Build)**

This phase is triggered when you are instructed to implement a task (e.g., "implement the next task").

**PROCESS (Strictly follow these steps for each task):**

1.  **Acknowledge Task:** Identify the next task to be implemented from `.claude/roadmap.md`.

2.  **Write/Modify Production Code:** Implement the required changes in the file specified in the `File` column, following the checklist in the `Implementation Details` column.

3.  **Run Tests:** After implementing the code, you **MUST** run the existing test suite to ensure your change has not introduced any regressions. The assumed command is `npm test`. You must report whether the tests passed or failed. If they fail, you must stop and report the failure.

4.  **Update Roadmap:**
    *   Read the `.claude/roadmap.md` file.
    *   Locate the row for the task you just completed.
    *   Change its `Status` from `[ ]` to `[x]`.
    *   In the `Progress Notes` column for that row, add a concise (max 10 words) summary of what was implemented or fixed.

5.  **Report Completion:** Announce that the task is complete. Present all modified files (the production code and the updated `roadmap.md` file) and await the next instruction.