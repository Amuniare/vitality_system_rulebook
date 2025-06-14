
# Phase 12-A: Iterative Character Generation & Schema Correction

**Date:** 2025-06-13
**Status:** ✅ Completed
**Objective:** To collaboratively design and generate a complete, rule-compliant character JSON file for a high-tier character named "Luke Harbin" by iteratively refining concepts and correcting AI-driven errors.

---

## 1. Problem Analysis

The task was to create a complex, high-tier character from a high-level concept ("AI with a nanite body"). The initial AI-generated build contained several critical errors that violated the game's rules and data schemas:

1.  **Rule Misinterpretation:** The AI incorrectly implemented the `Counterattack` upgrade, triggering on any hit instead of only on a *failed* enemy attack as specified in the rulebook.
2.  **Data Contract Violation (Major):** The AI hallucinated the `Regeneration` and `Invisibility` abilities as low-cost `Features` instead of correctly identifying them as expensive `Unique Abilities` from the `unique_abilities_complex.json` data file.
3.  **Schema Mismatch:** The first generated JSON file used the web character builder's export format, which was incompatible with the Python `updater.py` script's expectation of the flat Roll20 character sheet schema, causing a `KeyError: 'metadata'`.
4.  **ID Uniqueness Violation:** The second generated JSON used static, non-unique repeating section row IDs (e.g., `-N01_trait_0`), which would have caused data corruption and conflicts when uploaded to a Roll20 campaign with existing characters.

### Root Cause

The root cause of these issues was a combination of AI fallibility and the complexity of the project's multi-layered data schemas. The AI demonstrated an ability to generate thematic concepts but failed on the precise implementation details without iterative human correction. The distinct data schemas for the web builder and the backend updater created a "translation" step that the AI initially missed, leading to the schema mismatch.

---

## 2. Solution Implemented

The character was successfully generated through a multi-step, iterative process of AI generation and human-driven correction.

### Key Changes:

*   **Iterative Refinement:** Started with a high-level concept and progressively added layers of detail: Archetypes -> Attributes -> Special Attacks -> Flaws/Traits -> Utility Abilities.
*   **Rule Correction:** The user identified the incorrect implementation of the `Counterattack` rule. The AI corrected the build to reflect that the ability triggers on an enemy's *missed* attack.
*   **Data Contract Correction:** The user pointed out that `Regeneration` and `Invisibility` were not Features. The AI corrected this by moving them from the Utility Pool to the Main Pool and purchasing them as expensive Unique Abilities, which is compliant with `unique_abilities_complex.json`.
*   **Schema Transformation:** After the `KeyError`, the AI was instructed to use the `CharacterMapper` logic to transform the character data from the web builder format into the required Roll20 schema, resolving the `metadata` error.
*   **Unique ID Generation:** After the final review, the AI regenerated the JSON with unique, timestamp-based row IDs for all repeating sections (e.g., `-N1718305200001_trait_0`), ensuring no conflicts upon upload.

```json
// BEFORE: Non-unique, static row ID
"uniqueabilities": {
  "-N01_unique_0": { "char_uniqueAbilities": "Regeneration" }
}

// AFTER: Unique, timestamp-based row ID
"uniqueabilities": {
  "-N1718305200011_unique_0": { "char_uniqueAbilities": "Regeneration" }
}

3. Architectural Impact & Lessons Learned

Impact: This session validated the collaborative AI development model. It demonstrated that while the AI can rapidly generate complex data structures, it requires human oversight and precise feedback to ensure correctness and adherence to established schemas and rules.

Lessons:

AI as a "Junior Developer": The AI is highly effective at generating boilerplate and first drafts but must be "code-reviewed" by a human expert to catch subtle but critical errors.

The Importance of Schemas: The existence of multiple, distinct data schemas (web builder vs. Roll20) is a potential point of failure. The CharacterMapper is a critical piece of infrastructure that must be used to bridge this gap.

Specificity is Key: Vague prompts lead to plausible but incorrect outputs. Precise feedback ("This rule is wrong," "This ID is not unique") leads to immediate and accurate corrections.

New Patterns: This session established a successful "Generate, Review, Correct, Finalize" workflow for creating complex game assets with AI assistance.

4. Files Modified

src/docs/dev_logs/12_A_Iterative_Character_Generation.md: This dev log was created.

(Resulting File) data/characters/input/Luke_Harbin.json: The final, corrected character JSON was generated and is ready for upload.

