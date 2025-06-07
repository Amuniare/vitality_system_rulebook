# Features Layer - The Vertical Slice Contract

## Golden Rule #1: Features are Self-Contained

-   Each sub-folder in eatures/ (e.g., eatures/archetypes/) is a "vertical slice" of the UI. It represents a single, cohesive piece of functionality, almost always corresponding to one main tab.
-   The main [FeatureName]Tab.js file (e.g., ArchetypeTab.js) is the **controller** for that feature. It is responsible for:
    -   Rendering its own content.
    -   Handling all user interactions within its domain.
    -   Calling the appropriate systems/ and calculators/ to perform business logic and math.
    -   Calling 	his.builder.updateCharacter() to commit changes and trigger a global refresh.

## Golden Rule #2: Features Do Not Talk to Each Other

-   A feature **MUST NOT** directly import from another feature's folder.
    -   **FORBIDDEN:** SpecialAttackTab.js cannot import { AttributeTab } from '../attributes/AttributeTab.js';.
-   If a feature needs information that is managed by another feature, it must get that information from the central 	his.builder.currentCharacter object. Communication happens vertically (Feature -> Builder -> System), not horizontally (Feature -> Feature).

## Golden Rule #3: Components Stay Local (Unless They Can't)

-   A feature **MAY** have its own components/ sub-folder (e.g., eatures/special-attacks/components/).
-   Components in this local folder are for that feature **only**. They are not designed to be reused elsewhere.
-   If you find yourself needing to use a component from one feature in another, that component must be refactored to be more generic and moved to the shared/ui/ directory.