# Phase 27: AI Test Framework Bug Fixes and Variability Enhancement

**Date:** 2025-06-11
**Status:** ? Completed
**Objective:** To diagnose and create a plan to fix two critical issues in the AI testing framework: file-not-found errors breaking test runs, and repetitive AI behavior reducing test coverage.

---

## Technical Debug Log: 27A - AI Test Framework Stability

**Problem Statement:**
The expanded E2E test suite is failing. The test runner logs show two distinct problems:
1.  **Fatal Error:** Test runs are immediately crashing with an ENOENT: no such file or directory error, specifically for 	ests/prompts/04_design_trait.txt. This indicates a missing file in the test infrastructure.
2.  **Low Test Quality:** Analysis of the successful first run and the logs from the failed runs shows that the AI is making nearly identical choices for each character (e.g., always picking the 'flight' archetype). This lack of variability severely limits the effectiveness of the stress test, as it's not exploring different character build paths.

**Initial Hypothesis:**
1.  The ENOENT error is a simple but critical issue where the  4_design_trait.txt prompt file was defined in the Brain.js logic but never actually created in the 	ests/prompts/ directory.
2.  The repetitive AI behavior is caused by a lack of a unique "seed" or "goal" for each test run. The AI prompts are too generic, causing the model to default to the most common or statistically probable answers without a specific character concept to guide its choices.

**Investigation & Action (The Staged Approach):**

*   **Action 27A.1 (Fix File Error):** Create the missing prompt file at 	ests/prompts/04_design_trait.txt. This file will contain the instructions for the AI on how to select stats and conditions for a custom trait, resolving the fatal file-not-found error.

*   **Action 27A.2 (Introduce Variability):** The generateBuildConcept() method in Brain.js already creates a unique concept for each run. This concept must be threaded through every subsequent AI decision. The prompts for choosing archetypes, distributing attributes, selecting flaws, and designing special attacks must all be updated to include the {{concept}} variable in their context.

*   **Action 27A.3 (Update AI Brain):** Modify the methods in 	ests/framework/Brain.js to accept the concept object as a parameter and pass it into the context for every AI call. This will force the AI to make choices that are thematically consistent with the unique goal of each test run, rather than making generic "best" choices.

*   **Action 27A.4 (Update Special Attack Prompt):** Specifically enhance the prompt for designSimpleSpecialAttack to use the concept to generate a more thematic name and description, further increasing variability.

**Result:**
Once these actions are implemented, the ENOENT error will be resolved, allowing all test journeys to run to completion. The AI's decisions will become significantly more varied from run to run, as each choice will be influenced by the unique, randomly generated character concept, leading to more robust and comprehensive testing of the character builder.

**Conclusion & Lesson Learned:**
This investigation highlights two key principles for AI-driven testing:
1.  **Test Infrastructure as Code:** All components of the test framework, including AI prompts, must be treated as code and be correctly versioned and deployed.
2.  **Seeding Variability:** To achieve effective, non-deterministic testing with an AI, each test run must be "seeded" with a unique, high-level goal or concept. This concept must then be a core part of the context for all subsequent AI decisions to prevent the model from falling into repetitive patterns.
---