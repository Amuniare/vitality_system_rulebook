# Vitality System - Project Workplan & Roadmap

This document outlines the development priorities and long-term vision for the Vitality System.

---

## Part 1: Active Feature Roadmap (Short-Term Goals)

This is the prioritized list of features and fixes for the Character Builder and related tools.

### P1 - Critical Bug Fixes & UI Polish
- [ ] **Testing:** Expand test coverage to ensure the AI can complete the entire character creation process without logical errors.

### P2 - Core Feature Enhancements
- [ ] **NPCs:**
    - [ ] Implement a secondary dropdown to assign NPCs to factions or PCs to players, which will determine their save folder. This will use data from `names.json`.
- [ ] **Character Bio:**
    - [ ] Add a dedicated section or tab for entering a character's biography.
    - [ ] Consider adding fields for campaign-specific information.

### P3 - New Feature Development
- [ ] **Basic Attacks:** Implement a system where characters automatically gain basic attacks based on their selected Attack Type and Effect Type archetypes.
-   **Image Management:**
    -   [ ] Add functionality to upload and associate a token image.
    -   [ ] Add functionality for a larger character bio image.
    -   [ ] Implement a token setup feature, potentially for multiple tokens per character.


---

## Part 2: Long-Term Vision - The Simulation & Optimization Engine

This is the ultimate goal for the project: a closed-loop system for game balancing.

-   **Phase 1: The Character Foundry (Data Generation & Validation)**
    -   **Objective:** To perfect and scale the character generation process, creating a large, validated dataset of character JSON files.

-   **Phase 2: The Crucible (Combat Simulation Engine)**
    -   **Objective:** To build a headless, scriptable combat simulator in Python that can execute a fight based on the rules defined in `rulebook.md`.

-   **Phase 3: The Gauntlet (Running Mass Simulations)**
    -   **Objective:** To automate the process of running every generated character through every defined combat scenario and logging the results.

-   **Phase 4: The Oracle (Analysis and Balance Insights)**
    -   **Objective:** To analyze the simulation data to answer the core question: "What makes a character good?"

-   **Phase 5: The Golem (AI-Driven Optimization)**
    -   **Objective:** To use the insights from the analysis to train a machine learning model that can intelligently design optimized characters.