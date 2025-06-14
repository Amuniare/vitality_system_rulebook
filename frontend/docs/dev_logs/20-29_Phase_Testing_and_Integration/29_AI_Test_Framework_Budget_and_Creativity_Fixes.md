# Phase 29: AI Test Framework Budget & Creativity Fixes

**Date:** 2025-06-11
**Status:** ✅ Completed
**Objective:** To fix the consistent budget overspending errors in the AI test suite and improve the variety of AI-generated character concepts to ensure more robust testing.

---

## Technical Debug Log: 29A - Resolving Budget Overspending and Enhancing AI Test Variability

**Problem Statement:**
The AI-driven test suite was consistently failing with a "mainPool over budget by 30 points" error. This was caused by a logical flaw in the test script that instructed the AI to purchase two 30-point items when the character only had a 30-point budget. A secondary problem was that the AI generated repetitive character concepts, which limited the test's ability to explore different build paths.

**Initial Hypothesis:**
The budget error was not a failure of the AI's reasoning but a flaw in the test script's instructions (`Journey.js`). The lack of creativity was due to an overly generic initial prompt that needed more constraints to guide the AI toward diverse outputs.

**Investigation & Action (The Staged Approach):**

*   **Action 29.1 (Fix Budget Logic):** In `tests/framework/Journey.js`, the `buyMainPoolItems` method was refactored. Instead of purchasing both a Flaw and a Trait, the script now randomly chooses to purchase *either* a Flaw *or* a Trait, ensuring the 30-point budget is not exceeded.

*   **Action 29.2 (Enhance Creativity Prompt):** In `tests/prompts/01_generate_build_concept.txt`, the prompt was completely rewritten. It now provides the AI with a curated list of 30 evocative, sentence-long character premises and instructs it to choose one as a seed for its build concept.

*   **Action 29.3 (Test Execution):** The full test suite was executed with the new changes.

**Result:**
All 3 test journeys passed successfully without any validation errors. The test logs confirm that the budget overspending issue is resolved. The AI generated three distinct character concepts ("The Blur", "Arcane Archer", "The Kinetic Weaver"), demonstrating that the new prompt successfully encourages variability in the test runs.

**Conclusion & Lesson Learned:**
This session reinforces two critical principles for AI-driven testing. First, the test script's logic is paramount; the AI will execute its instructions faithfully, so the script itself must be logically sound and budget-aware. Second, to achieve meaningful test diversity, AI creativity must be guided by well-defined constraints and seeds (like the list of premises), rather than relying on vague instructions to be "creative" or "unconventional". This approach provides the ideal balance of randomness and control.
---