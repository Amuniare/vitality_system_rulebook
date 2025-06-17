

### **Project 4: 'Charon' Roll20 Synchronization Fix & Folder Management**

#### **Problem Statement**
The character updater is failing to correctly upload JSON data to Roll20 and ignores the hierarchical folder structure (`PCs/[Player Name]`, `NPCs/[Faction]/[Group]`).

#### **Root Cause**
A data contract violation exists in the upload pipeline, and the system lacks any logic for managing Roll20's folder hierarchy.

#### **Implementation Steps**

1.  **Update Data Model:** Add a `folderPath: "PCs/Player Name"` field to the character JSON metadata schema.
2.  **Enhance Roll20 API (Extraction):** The `!extract-all-handout` command will be updated to traverse a character's folder hierarchy and save the full path to the new `folderPath` property.
3.  **Enhance Roll20 API (Upload):** A new `!update-character-in-folder` command will be created. It will parse the `folderPath`, recursively create any missing folders, and then place the character in the correct final folder.
4.  **Update Python Updater:** The `updater.py` script will be modified to call this new, more robust API command, passing the `folderPath` from the JSON file.
5.  **Debug Data Mapping:** Perform a systematic debug of the entire pipeline to resolve the underlying data upload failures.

---

### **Project 5: The 'Crucible' Combat Simulator (Phase 1: Melee)**

#### **Problem Statement**
There is no way to test the mathematical balance of the game's combat rules.

#### **Root Cause**
The project lacks a "runtime" or "engine" for executing the game's rules.

#### **Implementation Steps**

1.  **Create Simulation Directory:** Create a new top-level `simulation/` directory.
2.  **Develop Character Loader:** Create `simulation/character_loader.py` to parse character JSONs into a standard `SimulationCharacter` class.
3.  **Implement Rule Engine:** Create `simulation/rule_engine.py` with pure functions for core combat math (accuracy, damage, etc.), focusing initially on melee attacks and associated upgrades.
4.  **Build Combat State Machine:** Create `simulation/combat_manager.py` to manage the state of a combat encounter between two loaded characters.
5.  **Create CLI:** Create `simulation/main.py` with `argparse` to run a simulation via the command line.
6.  **Produce Output:** The simulation will output a summary JSON with combat results.

---

### **Project 6: The 'Sentinel' UI Integrity Tester**

#### **Problem Statement**
Manually testing the UI for regressions is inefficient and error-prone.

#### **Root Cause**
The project lacks an E2E testing framework capable of interacting with the live UI.

#### **Implementation Steps**

1.  **Set Up Playwright Framework:** Create a `tests/` directory and configure Playwright to run against the local character builder.
2.  **Create Navigation & Screenshot Test:** Implement a test script that launches the builder, creates a new character, and navigates through all 7 tabs, taking a screenshot of each to serve as a visual baseline.
3.  **Implement "Button Click" Test:** Add a test case that finds all clickable elements on each tab and performs a `.click()` action, passing if no JavaScript exceptions are thrown.
4.  **Create Runner Script:** Add a `"test:ui": "npx playwright test"` script to `package.json` for easy execution.

---

### **Project 7: The 'Genesis' AI Character Generator**

#### **Problem Statement**
Comprehensive testing requires a large and diverse set of valid character builds.

#### **Root Cause**
No system exists for the procedural generation of character data.

#### **Implementation Steps**

1.  **Phase 1 (Schema Compliance):** Develop a script that generates structurally valid character JSON files, even if the choices are random and not rule-compliant.
2.  **Phase 2 (Rule Compliance):** Enhance the generator to use the `systems` and `calculators` to make choices that are 100% legal according to game rules (respecting budgets, prerequisites, etc.).
3.  **Phase 3 (Heuristic Optimization):** Add an AI-driven "brain" that creates characters based on a high-level concept (e.g., "fast glass cannon"), ensuring thematic coherence.
4.  **Phase 4 (Full-Loop Integration):** Connect the generator to the 'Crucible' and 'Sentinel' projects to automate testing with a large batch of generated characters.

---

### **Project 8: Dedicated Base Attack System**

#### **Problem Statement**
The current workaround of using a "Special Attack" slot for the base attack is not an intuitive or permanent solution.

#### **Root Cause**
The application was not designed with a separate system for modifying the default "Base Attack" action.

#### **Implementation Steps**

1.  **Create "Base Attack" Tab:** Add a new UI tab dedicated to upgrading the base attack.
2.  **Update Data Model:** Add a `baseAttackUpgrades: []` property to `VitalityCharacter.js`.
3.  **Develop `BaseAttackSystem.js`:** Create a new system to manage the logic and point-spending for base attack upgrades, using points from the "Basic" archetype.
4.  **Deprecate Workaround:** Revert the change from Project 1 so the "Basic" archetype once again blocks the creation of any special attacks.

---

### **Project 9: The 'Chronicler' Automated Scribe System**

#### **Problem Statement**
Manually transcribing and summarizing session audio is inefficient and lacks the deep context of the campaign world.

#### **Root Cause**
There is no automated pipeline connecting voice chat to transcription and context-aware AI summarization.

#### **Implementation Steps**

1.  **Discord Bot Development:** Create a Python bot to join voice channels and record session audio to a local file.
2.  **Transcription Pipeline:** Integrate a speech-to-text service (e.g., Whisper API) to convert the saved audio file into a raw text transcript.
3.  **Contextual AI Processing:** Develop a script that loads all campaign context (rulebook, backstories, previous summaries) and sends it to an LLM along with the raw transcript. The first prompt will be to *correct* the transcript; the second will be to *summarize* the corrected text.
4.  **File Output Management:** The system will save all generated files (audio, raw transcript, corrected transcript, notes, summary) into the appropriate directories within `data/mutants/sessions/`.

---

### **Project 10: Advanced Combat Mechanics & Economic Rebalance**

#### **Problem Statement**
The special attack system is unbalanced, allowing free access to powerful Advanced Conditions and lacking options for generic upgrades like improving range.

#### **Root Cause**
The system lacks conditional cost logic based on archetype, and the data files for upgrades are incomplete.

#### **Implementation Steps**

1.  **Advanced Condition Costs:**
    *   **Action (Data):** Add a `"cost"` property to each object in `data/conditions_advanced.json`.
    *   **Action (Logic):** Modify `SpecialAttackSystem.js` to check if the character's archetype is `'crowdControl'`. If not, deduct the condition's cost from the attack's available points.
    *   **Action (UI):** Update `AttackBasicsForm.js` to display the cost next to each advanced condition in the dropdown.

2.  **Generic Attack Upgrades:**
    *   **Action (Data):** Add a new top-level category, `"Generic Attack Upgrades"`, to `data/upgrades.json` and populate it with objects for `Extended Range`, `Hybrid`, `Precise`, etc., each with its own cost.
    *   **Action (Verification):** Confirm that the existing data-driven UI in `UpgradeSelection.js` automatically renders this new category of upgrades without requiring code changes. Test the purchase flow to ensure points are deducted correctly.