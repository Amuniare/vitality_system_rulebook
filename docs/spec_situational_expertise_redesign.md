# Situational Expertise System Redesign Specification

## Overview

This specification defines the redesign of the situational expertise system to support player-defined custom talents with enforced limits.

## Current System Analysis

### Existing Implementation
- **Structure**: Predefined situational expertises organized by 7 attributes
- **Costs**: Basic (1 point), Mastered (2-3 points) - cost discrepancy exists
- **Limits**: No current limit on number of situational expertises
- **Content**: Fixed expertise names and descriptions from JSON data

### Key Files
- `frontend/character-builder/data/expertise.json` - Data definitions
- `frontend/character-builder/features/utility/components/ExpertiseSection.js` - UI component
- `frontend/character-builder/systems/UtilitySystem.js` - Business logic
- `frontend/character-builder/core/VitalityCharacter.js` - Character data model

## New System Requirements

### Core Rules
1. **Maximum Limit**: Players can purchase up to 3 situational expertises total
2. **Custom Talents**: Each situational expertise contains 3 player-defined talents
3. **Talent Format**: Each talent is 1-2 words describing a situation the character excels in
4. **Player Input**: Players write their own talent descriptions during purchase

### Example
```
Situational Expertise #1: Combat Situations
- Talents: "Ambush", "Flanking", "Retreating"

Situational Expertise #2: Social Encounters  
- Talents: "Negotiation", "Intimidation", "Deception"

Situational Expertise #3: Exploration
- Talents: "Tracking", "Climbing", "Stealth"
```

## Technical Specifications

### Data Structure Changes

#### Character Data Model
```javascript
this.utilityPurchases = {
  expertise: {
    situational: [
      {
        id: "situational_1",
        level: "basic", // or "mastered"
        talents: ["Ambush", "Flanking", "Retreating"],
        attribute: "power", // which attribute category this falls under
        purchaseDate: timestamp
      },
      // ... up to 3 total
    ],
    // Keep existing activity-based structure unchanged
    awareness: { basic: [], mastered: [] },
    // ... other attributes
  }
}
```

#### JSON Data Updates
```json
{
  "Expertises": {
    "types": {
      "situational": {
        "maxCount": 3,
        "talentsPerExpertise": 3,
        "categories": {
          // Keep existing attribute categories for organization
        }
      }
    }
  }
}
```

### UI Implementation

#### New Components
1. **SituationalExpertiseManager**
   - Shows count: "2/3 Situational Expertises"
   - Lists purchased expertises with custom talents
   - "Create New" button (disabled when at limit)

2. **SituationalExpertiseCreator** (Modal/Form)
   - Attribute selection dropdown
   - 3 talent input fields with validation
   - Basic/Mastered level selection
   - Cost display and purchase confirmation

3. **SituationalExpertiseCard**
   - Shows custom talents
   - Edit functionality (if enabled)
   - Remove/refund option

#### User Flow
1. Player clicks "Create New Situational Expertise"
2. Modal opens with form:
   - Select attribute category (Mobility, Power, etc.)
   - Enter 3 talent names
   - Choose basic or mastered level
   - Confirm purchase
3. System validates and creates expertise
4. UI updates to show new expertise and remaining count

### Validation Rules

#### Hard Constraints
1. **Expertise Limit**: Maximum 3 situational expertises per character
2. **Talent Count**: Exactly 3 talents required per expertise
3. **Archetype Restrictions**: Maintain existing restrictions

#### Advisory Warnings
1. **Budget**: Warn if purchase exceeds utility pool

### Cost Resolution

#### Decision Required
Current discrepancy between JSON and constants:
- JSON: Basic (1), Mastered (2)
- Constants: Basic (1), Mastered (3)

**Recommendation**: Use JSON values (1/2) for consistency with documentation.

### Migration Strategy

#### Existing Characters
1. **Legacy Support**: Keep existing predefined situational expertises functional
2. **Migration Option**: Provide tool to convert existing to new format
3. **Grandfathering**: Existing characters can exceed 3-expertise limit until they modify

#### Data Migration
```javascript
// Convert existing purchases to new format
const migrateSituationalExpertise = (oldPurchases) => {
  return oldPurchases.map(expertise => ({
    id: generateId(),
    level: expertise.level,
    talents: [expertise.name, "General", "Applicable"], // Default conversion
    attribute: expertise.attribute,
    purchaseDate: Date.now()
  }));
};
```

## Implementation Phases

### Phase 1: Data Foundation
- [ ] Update character data model to support custom talents
- [ ] Resolve cost discrepancy between JSON and constants
- [ ] Update expertise.json with new structure

### Phase 2: UI Development
- [ ] Replace predefined situational cards with editable talent textboxes
- [ ] Add 3-expertise limit counter display
- [ ] Implement refund functionality (same as existing system)
- [ ] Show "Add New Situational Expertise" button when under limit

### Phase 3: Integration
- [ ] Update summary displays to show custom talents
- [ ] Modify export/import to handle custom talent data
- [ ] Ensure archetype restrictions still apply

### Phase 4: Testing & Polish
- [ ] Test with existing characters
- [ ] Verify refund system works
- [ ] Edge case testing (empty talents, etc.)

## Open Questions

1. **Edit Functionality**: Should players be able to modify talent names after purchase? Yes, leave them as open textboxes
2. **Refund Policy**: Can situational expertises be sold back? yes, just like everything else
3. **Duplicate Prevention**: Should system prevent similar talent names? no
4. **Attribute Enforcement**: Must talents relate to the selected attribute category? no relation, they just have the same point cost at situational expertises, also the same name
5. **Character Limits**: Any restrictions on special characters or profanity? no

## Success Criteria

1. Players can create exactly 3 situational expertises with custom talents
2. Only enforce 3-expertise limit (no additional validation rules needed)
3. Existing characters continue to function without breaking
4. UI clearly shows limits and provides good user experience
5. System maintains performance with custom data storage

## Technical Risks

1. **Simple Text Storage**: Custom talents are just text fields with no special validation needed
2. **Storage Size**: Custom text increases character data size 
3. **Migration Complexity**: Converting existing data without loss
4. **UI Complexity**: Managing dynamic content vs. static cards
5. **Export Format**: Ensuring custom data survives import/export cycles