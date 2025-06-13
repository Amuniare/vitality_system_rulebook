# Talent Expertise System Specification

## Overview

The Talent Expertise System replaces the previous "Situational Expertise" system with a more flexible, player-driven approach to character specialization. This system allows players to create custom "Talent Sets" that represent their character's unique areas of expertise.

## System Goals

1. **Player Agency**: Allow players to define their character's specializations rather than choosing from pre-defined lists
2. **Narrative Flexibility**: Support character concepts that don't fit into traditional skill categories
3. **Mechanical Clarity**: Provide clear, consistent rules for custom talent creation
4. **Balanced Limitations**: Maintain game balance through point costs and quantity limits

## Rules & Mechanics

### Core Concept
- Players create up to **3 Talent Sets** per character
- Each Talent Set contains **3 custom talents** defined by the player
- Each Talent Set is associated with one of the 7 core attributes
- Talent Sets can be purchased at **Basic** (1 point) or **Mastered** (3 points total) levels

### Cost Structure
- **Basic Level**: 1 utility point
  - Effect: Add your Tier to relevant checks when talents apply
- **Mastered Level**: 3 utility points total (2 additional points to upgrade from Basic)
  - Effect: Add 2 × your Tier to relevant checks when talents apply

### Limitations
- **Maximum 3 Talent Sets** per character
- Each talent must be a specific, discrete capability
- Talents should be situational/contextual rather than universal

### Attribute Association
Each Talent Set must be associated with one core attribute:
- **Mobility**: Movement, positioning, terrain navigation
- **Power**: Physical force, strength-based activities
- **Endurance**: Stamina, resistance, persistence
- **Focus**: Precision tasks, crafting, technical skills
- **Awareness**: Perception, investigation, tracking
- **Communication**: Social interaction, deception, leadership
- **Intelligence**: Analysis, planning, knowledge application

## Data Structure

### Character Data Model
```javascript
character.utilityPurchases.expertise = {
    situational: [
        {
            id: "unique_timestamp_id",
            attribute: "focus",
            level: "basic" | "mastered" | "none",
            talents: ["Lock Picking", "Safe Cracking", "Alarm Bypassing"],
            purchaseDate: timestamp
        }
    ]
}
```

### Game Data (expertise.json)
```json
{
    "Expertises": {
        "description": "Players create custom 'Talent Sets'...",
        "mechanics": {
            "costs": {
                "situational": {
                    "basic": { "cost": 1, "effect": "Add your Tier to relevant checks when context matches" },
                    "mastered": { "cost": 3, "effect": "Add 2 × your Tier to relevant checks when context matches" }
                }
            }
        },
        "types": {
            "situational": {
                "name": "Talent Sets",
                "maxCount": 3,
                "talentsPerExpertise": 3,
                "categories": {
                    // Reference examples by attribute for inspiration
                }
            }
        }
    }
}
```

## User Interface Flow

### Creation Process
1. **Navigate to Utility Tab → Situational Expertise**
2. **Click "Create New Talent Set" card**
3. **Fill in 3 talent text inputs** (e.g., "Lock Picking", "Safe Cracking", "Alarm Bypassing")
4. **Select base attribute** from dropdown (Focus, Awareness, etc.)
5. **Choose purchase level**: Basic (1p) or Mastered (3p)
6. **Confirm purchase** - talent set is created and purchased

### Management
- **Edit talents**: Click in talent text fields to modify names
- **Upgrade level**: Purchase "Mastered" upgrade for existing Basic sets
- **Remove sets**: Delete entire talent sets with remove button
- **View summary**: All talent sets appear on Summary tab with individual talent tags

### Validation Rules
- Minimum 1 talent required before purchase
- Maximum 3 talent sets per character
- Each talent set must have a selected attribute
- Budget warnings (non-blocking) when exceeding utility points

## Technical Implementation

### System Methods (UtilitySystem.js)
- `addSituationalExpertise(character, attribute)` - Create new talent set
- `updateSituationalTalent(character, expertiseId, talentIndex, talentValue)` - Edit talent names
- `purchaseSituationalExpertise(character, expertiseId, level)` - Buy/upgrade talent set
- `removeSituationalExpertise(character, expertiseId)` - Delete talent set

### UI Components (ExpertiseSection.js)
- `renderSituationalExpertise()` - Main talent set interface
- `renderCreateNewTalentSetCard()` - Creation form with attribute selector
- `renderTalentSetCard()` - Display existing talent sets with edit capabilities

### Event Handlers (UtilityTab.js)
- `handleCreateAndPurchaseSituationalExpertise()` - Process new talent set creation
- `handleUpdateSituationalTalent()` - Real-time talent name updates
- `handlePurchaseSituationalExpertise()` - Level upgrades
- `handleRemoveSituationalExpertise()` - Deletion with confirmation

### Summary Display (UtilityAbilitiesSummary.js)
- `renderTalentSets()` - Summary section for all talent sets
- `renderTalentSet()` - Individual talent set with attribute and level info
- Visual talent tags showing individual talent names

## Examples

### Example 1: Urban Infiltrator
- **Attribute**: Focus
- **Talents**: ["Lock Picking", "Security Systems", "Silent Entry"]
- **Level**: Mastered (3 points)
- **Usage**: When infiltrating buildings, add 2 × Tier to relevant Focus checks

### Example 2: Wilderness Tracker
- **Attribute**: Awareness
- **Talents**: ["Animal Signs", "Weather Reading", "Trail Following"]
- **Level**: Basic (1 point)
- **Usage**: When tracking in wilderness, add Tier to relevant Awareness checks

### Example 3: Social Manipulator
- **Attribute**: Communication
- **Talents**: ["Reading Body Language", "Emotional Leverage", "Information Gathering"]
- **Level**: Basic (1 point)
- **Usage**: When manipulating people, add Tier to relevant Communication checks

## Migration from Old System

### Data Migration
- Old activity-based expertise: Removed entirely
- Old situational expertise: Preserved if using new format
- Characters with old data: Gracefully handle missing properties

### UI Changes
- Activity-based expertise tab: Shows deprecation message
- Situational expertise: Complete redesign with unified interface
- Summary display: Updated to show custom talent names

### Backward Compatibility
- Old save files: Don't crash, show migration notice
- Missing data: Initialize empty arrays properly
- Validation: Handle both old and new data structures during transition

## Testing Checklist

### Core Functionality
- [ ] Can create new Talent Set at Basic level (1 point)
- [ ] Can create new Talent Set at Mastered level (3 points)
- [ ] Three talent text inputs are editable
- [ ] Attribute selector works correctly
- [ ] Maximum 3 Talent Sets enforced

### Level Management
- [ ] Can upgrade Basic to Mastered (2 additional points)
- [ ] Cannot downgrade from Mastered to Basic
- [ ] Level display updates correctly in UI

### Data Persistence
- [ ] Talent name changes save automatically
- [ ] Character data persists across page refreshes
- [ ] Summary tab displays custom talent names
- [ ] Point calculations include talent set costs

### Edge Cases
- [ ] Can create talent set with only 1 talent filled
- [ ] Can remove talent sets and get point refund
- [ ] Budget warnings appear but don't block purchases
- [ ] Old characters without new data structure don't crash

## Future Enhancements

### Potential Additions
- **Talent Categories**: Group talents by theme or profession
- **Shared Talent Libraries**: Common talent collections for inspiration
- **Import/Export**: Share talent sets between characters
- **Advanced Validation**: Check for overpowered or inappropriate talents

### Balance Considerations
- **Point Cost Adjustment**: Monitor if 1p/3p costs are appropriate
- **Talent Scope**: Guidelines for appropriate talent breadth
- **Stacking Rules**: Clarify how multiple talent sets interact
- **GM Tools**: Interface for reviewing and approving custom talents