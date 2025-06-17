

| System Feature | Rulebook Specification (The Truth) | Current Code Implementation (The Problem) |
| :--- | :--- | :--- |
| **Practical Archetype** | "Select 3 skills, you add your Tier twice to any skill checks made using those skills." | A generic "practical" option with no skill selection. It simply provides a larger Utility Point pool (`5 * (Tier - 1)`). |
| **Specialized Archetype**| "Choose an Attribute, you add your Tier twice to any skill checks made using that Attribute." | Gives a double Tier bonus to a *core stat* (e.g., +Tier to Power itself), not to *skill checks* using that stat. It also incorrectly blocks Expertise purchases. |
| **Jack of All Trades** | "You add your Tier once to all skill checks." | This is the only one implemented somewhat correctly, but it's part of the wrong overall system (it also incorrectly blocks expertise). |
| **Utility Points** | "You have 5 × (Tier - 2) Utility Points to purchase Features, Senses, Movement Abilities, Descriptors, and Wealth." | The code has **different point formulas for each archetype**, which is incorrect. The rulebook implies this is a universal pool, separate from the archetype's direct benefit. |
| **Talents** | "Each character also has 2 Talents... add your Tier twice to skill checks made regarding your Talent." | This system **does not exist at all** in the current code. The "Situational Expertise / Talent Sets" feature is a different, more complex implementation and does not match this simple "2 Talents" rule. |

The current `UtilityTab` and its underlying systems are built on a flawed interpretation. The entire feature needs to be scrapped and rebuilt according to the rules you've provided.

---

## **Revised Roadmap: Aligning the Utility System with the Rulebook**

This new roadmap replaces the previous plan for the Utility system. The objective is to build the system as described in the official rules.

| Phase | Task ID | Action (What to Do) | File(s) to Modify | Verification (How We Know It's Done) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Deprecation & Cleanup** | 1.1 | **Remove Old Logic:** Delete the incorrect Utility Pool point calculation logic from `PointPoolCalculator.js`. | `calculators/PointPoolCalculator.js` | The "Utility Pool" no longer appears in the Point Pool Display. | `[ ]` |
| | 1.2 | **Remove Old Archetype Effects:** Remove the current effects of the 'Specialized' and 'Practical' archetypes from `StatCalculator.js` and `UtilitySystem.js`. | `calculators/StatCalculator.js`<br>`systems/UtilitySystem.js` | Selecting 'Specialized' or 'Practical' archetypes no longer changes point pools or base stats. | `[ ]` |
| **2. Implement Core "Talent" System** | 2.1 | **Update Character Model:** Add a `talents: []` array (max 2 items) to `VitalityCharacter.js` to store the two custom talent strings. | `core/VitalityCharacter.js` | The character object now has a `talents` property. | `[ ]` |
| | 2.2 | **Create Talent UI:** Add a new section in `UtilityTab.js` with two text input fields for the user to define their two Talents. | `features/utility/UtilityTab.js` | The Utility Tab displays two text boxes for entering custom talents. | `[ ]` |
| | 2.3 | **Implement Talent Bonus:** The game master will adjudicate when the +Tier x 2 bonus applies during gameplay based on the narrative. No calculation logic needed. | N/A (GM Adjudication) | The character sheet or summary tab correctly displays the two chosen talents. | `[ ]` |
| **3. Implement New Archetype Logic** | 3.1 | **Create Skill Data File:** Create a new `data/skills.json` file that lists all available skills a player can choose for the "Practical" archetype. | `data/skills.json` | The JSON file exists and `GameDataManager` can load it. | `[ ]` |
| | 3.2 | **Implement "Practical" UI:** In `UtilityTab.js`, create a UI that allows a player with the "Practical" archetype to select exactly 3 skills from the list in `skills.json`. | `features/utility/UtilityTab.js` | A character with the "Practical" archetype sees a checklist or multi-select dropdown for choosing 3 skills. | `[ ]` |
| | 3.3 | **Implement "Specialized" UI:** In `UtilityTab.js`, create a UI that allows a player with the "Specialized" archetype to select one core Attribute. | `features/utility/UtilityTab.js` | A character with the "Specialized" archetype sees a dropdown to select one attribute (Focus, Power, etc.). | `[ ]` |
| | 3.4 | **Implement New Bonuses:** The game master will adjudicate when the "Practical", "Specialized", and "Jack of All Trades" bonuses apply to skill checks. No calculation logic needed. | N/A (GM Adjudication) | The character sheet or summary tab correctly displays the chosen archetype and its selections (e.g., "Practical: Climbing, Stealth, Crafting"). | `[ ]` |
| **4. Implement True Utility Pool** | 4.1 | **Implement Universal Pool:** Add the correct `5 * (Tier - 2)` Utility Points calculation to `PointPoolCalculator.js`. This pool is now independent of the archetype choice. | `calculators/PointPoolCalculator.js` | The Point Pool Display correctly shows the Utility Pool points based on the universal formula. | `[ ]` |
| | 4.2 | **Verify Spending:** Ensure that purchasing Features, Senses, Movement, Descriptors, and Wealth correctly deducts points from this new, universal Utility Pool. | All `purchase` methods in `UtilitySystem.js` and `WealthSystem.js` | Purchasing a Feature correctly reduces the Utility Pool total. | `[ ]` |