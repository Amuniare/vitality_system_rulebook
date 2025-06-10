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

unique abilities
    increased radius increases by 3 at a time


upgrades weren't opening, then i clicked create new attack and 8 attacks were created

Notification (success): Purchased unique ability! CharacterBuilder.js:446:17
Notification (warning): This purchase puts you over budget. CharacterBuilder.js:446:17
Notification (error): Purchase failed: Unique ability already purchased CharacterBuilder.js:446:17
Notification (warning): This purchase puts you over budget. CharacterBuilder.js:446:17
Notification (error): Purchase failed: Unique ability already purchased CharacterBuilder.js:446:17
Notification (warning): This purchase puts you over budget. CharacterBuilder.js:446:17
updateCharacter called CharacterBuilder.js:344:17
🔄 Calculating point pools (cache miss) PointPoolCalculator.js:18:17
✅ MainPoolTab event listeners attached ONCE. MainPoolTab.js:440:17
✅ Saved library with 1 characters CharacterLibrary.js:64:21
✅ Saved character: New Character CharacterLibrary.js:81:17
Notification (success): Purchased action upgrade for 30p! CharacterBuilder.js:446:17
Notification (warning): This purchase puts you over budget. CharacterBuilder.js:446:17
Notification (error): Purchase failed: Action upgrade already purchased CharacterBuilder.js:446:17
Notification (warning): This purchase puts you over budget. CharacterBuilder.js:446:17
Notification (error): Purchase failed: Action upgrade already purchased CharacterBuilder.js:446:17
Notification (warning): This purchase puts you over budget. CharacterBuilder.js:446:17
Notification (error): Purchase failed: Action upgrade already purchased CharacterBuilder.js:446:17
switchTab called with: specialAttacks CharacterBuilder.js:256:17
Current character: 
Object { id: "1749506613896", name: "New Character", realName: "", playerName: "", characterType: "Player Character", tier: 10, folderId: null, version: "2.0", created: "2025-06-09T22:03:33.896Z", lastModified: "2025-06-10T01:00:43.634Z", … }
CharacterBuilder.js:257:17
Tab content element for tab-specialAttacks: 
<div id="tab-specialAttacks" class="tab-content active">
CharacterBuilder.js:277:17
✅ Tab content shown for specialAttacks. Classes: tab-content active CharacterBuilder.js:281:21
Rendering specialAttacks tab... CharacterBuilder.js:294:21
✅ SpecialAttackTab event listeners attached ONCE. SpecialAttackTab.js:126:17
✅ specialAttacks tab rendered CharacterBuilder.js:296:21
updateCharacter called CharacterBuilder.js:344:17
✅ SpecialAttackTab event listeners attached ONCE. SpecialAttackTab.js:126:17
✅ Saved library with 1 characters CharacterLibrary.js:64:21
✅ Saved character: New Character CharacterLibrary.js:81:17
✅ Saved library with 1 characters CharacterLibrary.js:64:21
✅ Saved character: New Character CharacterLibrary.js:81:17
✅ Saved library with 1 characters CharacterLibrary.js:64:21
✅ Saved character: New Character CharacterLibrary.js:81:17
updateCharacter called CharacterBuilder.js:344:17
✅ SpecialAttackTab event listeners attached ONCE. SpecialAttackTab.js:126:17
✅ Saved library with 1 characters CharacterLibrary.js:64:21
✅ Saved character: New Character CharacterLibrary.js:81:17

then i clikced create attack again a few times, then 25 attacks were created






## Feature Add List

### NPCs Type
- Fix so more types
- Fix so health works
- Add second drop down, if PC then list player names, if NPC then list factions
- this tells it what folder it goes in


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



