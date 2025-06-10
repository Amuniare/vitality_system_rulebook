# Notes

## Bug Fix List






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

### Summary Tab Refactor
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



### BIO
- able to add character bio
- maybe some campaign specific options

### Images
- Token image
- Bio image
- Token Setup
- Multiple token Setup


## AI Builder

