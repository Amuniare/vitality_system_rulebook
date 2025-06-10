# Notes

## Bug Fix List



can't buy traits when over points, no validation
sometimes it seizes up and the visuals don't update after building the first trait

updateCharacter called CharacterBuilder.js:344:17
🔄 Calculating point pools (cache miss) PointPoolCalculator.js:18:17
✅ MainPoolTab event listeners attached ONCE. MainPoolTab.js:436:17
✅ TraitPurchaseSection: Event delegation active, no direct listeners needed TraitPurchaseSection.js:262:17
✅ Saved library with 1 characters CharacterLibrary.js:64:21
✅ Saved character: New Character CharacterLibrary.js:81:17
🔍 MainPoolTab caught trait-condition-toggle event 
<div class="card trait-condition-card clickable  " data-action="trait-condition-toggle" data-condition-id="unhealthy2" data-tier-cost="2" data-selected="false">
MainPoolTab.js:398:29
🔍 Condition card clicked: unhealthy2 cost: 2 currently selected: false TraitPurchaseSection.js:298:17
✅ Added condition: unhealthy2 Current conditions: 
Array [ "unhealthy2" ]
 Total cost: 2 TraitPurchaseSection.js:308:25
🔍 MainPoolTab caught trait-condition-toggle event 
<div class="card trait-condition-card clickable  " data-action="trait-condition-toggle" data-condition-id="unhealthy2" data-tier-cost="2" data-selected="true">
MainPoolTab.js:398:29
🔍 Condition card clicked: unhealthy2 cost: 2 currently selected: true TraitPurchaseSection.js:298:17
✅ Removed condition: unhealthy2 Current conditions: 
Array []
 Total cost: 0 TraitPurchaseSection.js:323:21
🔍 MainPoolTab caught trait-condition-toggle event 
<div class="card trait-condition-card clickable  " data-action="trait-condition-toggle" data-condition-id="unhealthy2" data-tier-cost="2" data-selected="false">
MainPoolTab.js:398:29
🔍 Condition card clicked: unhealthy2 cost: 2 currently selected: false TraitPurchaseSection.js:298:17
✅ Added condition: unhealthy2 Current conditions: 
Array [ "unhealthy2" ]
 Total cost: 2 TraitPurchaseSection.js:308:25
🔍 MainPoolTab caught trait-condition-toggle event 
<div class="card trait-condition-card clickable  " data-action="trait-condition-toggle" data-condition-id="unhealthy2" data-tier-cost="2" data-selected="true">
MainPoolTab.js:398:29
🔍 Condition card clicked: unhealthy2 cost: 2 currently selected: true TraitPurchaseSection.js:298:17
✅ Removed condition: unhealthy2 Current conditions: 
Array []
 Total cost: 0




costs of advanced conditions added to special attacks

utility section
    Selected Utilities (16)
    Purchased Items (16)
    remove one of these
    also, turn it into 2 column



## Feature Add List

### Bug Report Tool
- top right corner, submits bug reports, sends 
- might be worth doing its own file, should probs exist in top right corner
- need to store data or receive data somehow

### Basic Attacks
- each character should get base attacks according to their attack type and effect archetype
    - for basic achetype, they'll be able to add upgrades to these

## Summary Tab Refactor
- move calculated stats to row 2, 
- move break it into Offense, Defense and other box
- then show a breakdown of how we got to that number. Avoidance = 10 (Base) + 5 (Tier Bonus) + 5 (Primary Action Bonus) + 5 Trait Bonus =  25
- and then the things that aren't always active the player can click them on and off to toggle them
- then in the next row:
    - we need a section which is all purchased main pool abilities
    - and a section that is all utility abilities
- then in the next row:
    - all special attacks, with details

- in the archetypes box instead of just the name, include the description too

- generally, its just text strings, given that this is a character sheet, im thinking a table within each box makes the most sense for a more structured look; right now, a good start would be to replace ":" and "/" and "(" with as columns within the boxes that they're in



