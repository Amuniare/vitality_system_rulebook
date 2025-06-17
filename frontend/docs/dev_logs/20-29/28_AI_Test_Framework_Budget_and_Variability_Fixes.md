# Phase 28: AI Test Framework Budget and Variability Fixes

**Date:** 2025-06-11
**Status:** ? Completed (Analysis & Plan)
**Objective:** Diagnose and create a plan to fix the AI test framework failures caused by budget overspending and lack of AI creativity.

---

## Technical Debug Log: 28A - Budget and Variability Analysis

**Problem Statement:**
The AI-driven test suite is failing every run with a "mainPool over budget by 30 points" error. A secondary issue is that the AI makes highly repetitive choices across different test runs (e.g., always picking the same archetypes), which reduces the effectiveness of the stress test.

**Initial Hypothesis:**
1.  **Budget Error:** The AI is not making a mistake. The test script itself (Journey.js) contains flawed logic that instructs the AI to make two 30-point purchases (a Flaw and a Trait) when the character only has a 30-point budget, guaranteeing failure.
2.  **Repetitiveness:** The AI's creative prompts are too open-ended. Without a unique "seed" or "goal" for each test run, the model defaults to the most statistically probable or generic "best" choices, leading to low test variability.

**Investigation & Action (The Staged Approach):**

*   **Action 28.1 (Analysis):** Reviewed the test failure logs, which confirmed the mainPool over budget by 30 points error.
*   **Action 28.2 (Code Review):** Inspected 	ests/framework/Journey.js and confirmed that the  uyMainPoolItems method unconditionally calls both purchaseFlaw() and purchaseTrait().
*   **Action 28.3 (Budget Calculation):** Verified in 
ulebook/character-builder/calculators/PointPoolCalculator.js that a Tier 4 character receives (4 - 2) * 15 = 30 main pool points.
*   **Action 28.4 (Cost Verification):** Verified in 
ulebook/character-builder/systems/TraitFlawSystem.js that both Flaws and Traits cost 30 points each.
*   **Action 28.5 (Prompt Review):** Analyzed 	ests/prompts/01_generate_build_concept.txt and confirmed it lacked constraints to encourage diverse outputs.

**Result:**
The investigation confirmed that the test failures are due to a bug in the test script's logic, not the AI's decision-making. The lack of test variability is due to a weak initial prompt.

**Conclusion & Lesson Learned:**
The AI test framework is only as robust as the journey script that directs it. A logical flaw in the test steps will lead to consistent, predictable failures. The key lesson is that **the test script must provide the AI with a valid sequence of actions and a budget-aware plan.** To improve creativity, the AI must be given unique constraints or goals for each run to guide its decision-making process away from generic defaults.
---