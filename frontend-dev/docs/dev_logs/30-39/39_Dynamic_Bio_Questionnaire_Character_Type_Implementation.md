# Phase 39: Dynamic Bio Questionnaire Character Type Implementation

**Date:** 2025-01-17
**Status:** ✅ Completed
**Objective:** Enable the IdentityTab to dynamically select and display the correct questionnaire based on character type from the structured bio.json data.

---

## 1. Problem Analysis

The IdentityTab was loading a hardcoded questionnaire structure that did not account for the different character types (PC, NPC, Other) that had been implemented in the bio.json file. Users selecting "NPC Ally" character type were still seeing the Player Character questionnaire, while the "Other" type worked correctly.

### Root Cause

The IdentityTab was using a legacy data access pattern (`bioData.questionnaire`) that predated the restructured bio.json format with separate questionnaires for different character types. Additionally, there was a character type ID mismatch: the character_type.json file used `npc_ally` as the ID, but the mapping function was looking for `npc`.

---

## 2. Solution Implemented

Updated the IdentityTab to dynamically select questionnaires based on character type and implemented proper character type ID mapping to handle the data contract differences between files.

### Key Changes:
*   **IdentityTab.js:** Modified questionnaire loading logic to use the new structured format with character-type-specific sections.
*   **Character Type Mapping:** Added `getQuestionnaireType()` method to correctly map character type IDs to questionnaire sections.
*   **Dynamic UI Content:** Updated title and description rendering to use questionnaire-specific content from bio.json.

```javascript
// BEFORE: Legacy hardcoded questionnaire access
const bioData = gameDataManager.getBio();
const questionnaire = bioData.questionnaire || [];

// AFTER: Dynamic character-type-based questionnaire selection
const bioData = gameDataManager.getBio();
const questionnaireType = this.getQuestionnaireType(character.characterType);
const questionnaireData = bioData.questionnaires?.[questionnaireType];
const questionnaire = questionnaireData?.questions || [];
```

```javascript
// Character type mapping with proper ID handling
getQuestionnaireType(characterType) {
    switch (characterType) {
        case 'player_character':
            return 'pc';
        case 'npc_ally':  // Fixed: was 'npc'
            return 'npc';
        case 'other':
            return 'other';
        default:
            return 'pc'; // Default fallback
    }
}
```

---

## 3. Validation & Testing

*   **Player Character Type:** Confirmed displays PC-specific questionnaire with Rogue Trader campaign questions.
*   **NPC Ally Type:** Verified now correctly shows NPC creation questionnaire for crew member creation.
*   **Other Type:** Confirmed continues to work with faction-based questionnaire for contacts and rivals.
*   **Dynamic Content:** Verified titles and descriptions update appropriately for each character type.

---

## 4. Impact & Next Steps

This implementation successfully completes the character type-specific questionnaire system, enabling proper character creation workflows for all supported character types. The bio.json structure now fully supports the campaign's character creation needs with appropriate context for PCs, NPCs, and other character types.

**Future Enhancements:** Could extend to support campaign-specific questionnaire variants or additional character sub-types as needed.