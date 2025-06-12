Of course. This is an excellent feature request that touches on multiple layers of the system: the frontend character builder, the data model, the backend updater, and the Roll20 character sheet itself. A deep dive is required to ensure we implement this robustly.

Here is a detailed, phased plan to implement the "Character Identity & Presentation" feature.

### **Project Vision: Character Identity & Presentation**

The goal is to enhance the character creation and representation process by adding a dedicated space for biography and imagery in the web builder, and ensuring this information is seamlessly uploaded and displayed on the Roll20 character sheet. This will make characters feel more complete and visually engaging both during creation and in-game.

---

### **Phase 1: Foundation - Expanding the Data Model**

**Objective:** Before we build any UI, we must update our core data structures to support the new information. This ensures the entire system, from frontend to backend, speaks the same language.

**Plan:**

1.  **Update the Web Builder Data Model (`frontend/character-builder/core/VitalityCharacter.js`):**
    *   We will add new properties to the `VitalityCharacter` class to store the new information.
        *   `bio`: A string for the character's biography.
        *   `imageUrl`: A string for the main character image URL.
        *   `tokenUrl`: A string for the character's token image URL.

2.  **Update the Backend Data Mapper (`src/backend/character/mapper.py`):**
    *   We will modify the `web_builder_to_roll20` method. This function is the "translator" that converts the web builder's JSON format into the flat attribute format that Roll20's character sheet understands.
    *   It will be updated to map the new fields:
        *   `bio` -> `character_bio`
        *   `imageUrl` -> `character_image_url`
        *   `tokenUrl` -> `token_avatar_url` (This is a special name Roll20 uses to automatically set the token image).
    *   It will also be updated to create a new attribute, `archetype_summary`, which will be a formatted string of the character's selected archetypes (e.g., "Movement: Swift, Attack Type: Single Target...").

---
### **Phase 2: Frontend - The New "Identity" Tab**

**Objective:** Create a dedicated, user-friendly interface in the web character builder for managing the character's bio and images.

**Plan:**

1.  **Create a New Tab:** We will add a new tab to the main navigation, positioned right after "Basic Info".

    > **Decision Point 1: Tab Name**
    >
    > *   **Option A: "Identity"** - A broad term that covers bio, appearance, and personality.
    > *   **Option B: "Bio & Image"** - More direct and descriptive of the content.
    >
    > **Recommendation:** I recommend **"Identity"**. It's more evocative for an RPG and gives us room to add more personality-related features in the future without renaming the tab.

2.  **Implement the `IdentityTab.js` Component (`frontend/character-builder/features/identity/`):**
    *   This new component will contain the UI for the tab.
    *   It will feature:
        *   A large `<textarea>` for the character's biography.
        *   An `<input type="text">` for the main image URL.
        *   An `<input type="text">` for the token image URL.
        *   Live preview areas that display the images as the user types the URLs.

3.  **Integrate the New Tab:**
    *   Add `IdentityTab` to the `CharacterBuilder.js` initialization.
    *   Update the main HTML (`character-builder.html`) to include the new tab button and content container.
    *   Implement event handlers in `IdentityTab.js` to call the appropriate `builder.setCharacter...` methods, ensuring changes are saved to the character model.

---

### **Phase 3: Roll20 - Preparing the Destination**

**Objective:** Modify the Roll20 character sheet and its controlling API script to accept and display the new bio and archetype data.

**Plan:**

1.  **Update the Character Sheet HTML (`src/backend/char_sheet/rpgSheet_v5.5.html`):**
    *   We will add a new "Bio" tab to the sheet's internal navigation.
    *   Inside this new tab, we will add:
        *   A large, read-only `<textarea name="attr_character_bio"></textarea>` to display the biography.
        *   An `<img src="" name="attr_character_image_url">` tag. Roll20 will automatically use the value of the `character_image_url` attribute as the `src` for this image.
    *   We will add a new field on the main "Character" tab to display the archetype summary, using a simple `<input type="text" name="attr_archetype_summary" disabled="true">`.

2.  **Update the Roll20 API Script (`src/roll20_api/CharacterExtractor.js`):**
    *   The `updateCharacterWithData` function already handles setting attributes. Since our `mapper.py` will have prepared `character_bio`, `character_image_url`, and `archetype_summary` as standard attributes, no major changes are needed here for those fields.
    *   **Crucially**, we need to handle the token image. We will add logic to the `updateCharacterWithData` function that, after setting attributes, sends a `TokenMod` command to update the default token of the character.
        *   `!token-mod --set defaulttoken|@{selected|token_id} --set-image-to "@{character_name}|token_avatar_url"`

---

### **Phase 4: Backend - Final Integration**

**Objective:** Connect all the pieces by ensuring the Python updater script correctly processes the new data and sends the right commands to Roll20.

**Plan:**

1.  **Verify the `updater.py` Logic:**
    *   The main update loop in `updater.py` will be reviewed to ensure it correctly calls the `mapper` and passes the full, transformed character data to the Roll20 API script.
    *   Since the `TokenMod` command will be handled inside the Roll20 API script, the Python updater doesn't need to be aware of it, which keeps our architecture clean.

2.  **End-to-End Testing:**
    *   Perform a full sync operation with a character that has a bio, images, and archetypes filled out.
    *   Verify that:
        *   The character is created/updated in Roll20.
        *   The bio and archetype summary appear correctly on the character sheet.
        *   The main image is displayed in the Bio tab.
        *   Dragging the character onto the VTT creates a token with the correct image.

---

### **Phase 5: Documentation**

**Objective:** Update all relevant documentation to reflect the new features and data structures.

**Plan:**

1.  Update `src/docs/roll20_character_sheet_attribute_list.md` with the new attributes:
    *   `character_bio`
    *   `character_image_url`
    *   `token_avatar_url`
    *   `archetype_summary`
2.  Update `src/docs/data-formats.md` to reflect the changes in the web builder JSON and the Roll20 sheet structure.
3.  Create a new dev log summarizing the successful implementation of this entire feature.

---

### **Summary of the Plan**

| Phase | Area | Key Task |
| :---- | :--- | :--- |
| **1** | **Foundation** | Expand the core data model in both JS and Python. |
| **2** | **Frontend** | Build the new "Identity" tab in the web character builder. |
| **3** | **Roll20** | Update the character sheet HTML and the server-side API script. |
| **4** | **Backend** | Verify the Python updater correctly handles the new data flow. |
| **5** | **Docs** | Update all relevant project documentation. |

This phased approach minimizes risk by building from the data foundation up to the UI and final integration.

**To begin, please confirm your choice for Decision Point 1: Should the new tab be named "Identity" or "Bio & Image"?** Once you decide, I will start with Phase 1.