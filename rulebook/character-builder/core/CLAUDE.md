# Core Layer - AI Foundation Protocol

## Golden Rule #1: `GameDataManager.init()` is Sacred

-   This method loads all game data from the `/data/` JSON files.
-   It **MUST** be `await`-ed in `app.js` *before* the `CharacterBuilder` is initialized. The application cannot function without this data.
-   All systems and components **MUST** get game data (lists of flaws, archetypes, etc.) by calling `gameDataManager.getXxx()`. Do not hardcode this data anywhere else.

## Golden Rule #2: `VitalityCharacter.js` is for Data, not Logic

-   This file defines the **structure** of the character object.
-   It should only contain properties and simple, internal state methods like `touch()` (to update the last modified date) or `updateBuildState()`.
-   Complex game logic, like how to purchase a trait or what an archetype's effect is, **MUST** be in a `systems/` class, not in `VitalityCharacter.js`.
