# Requirements
- This requires a Pro Roll20 subscription, which I have.



# Goals of the Codebase
- Extract Character Data
- Modify Character Data
- Manage the interactions between:
    - the custom RPG character sheet in Roll20
    - the excel character sheet
    - the roll20 custom API
    - the Scriptcards API
    - the ChatSetAttribute API
    - the TokenMod API
    - The PlayerCharacters API


# Plan
1. Develop Custom Roll20 API (DONE)
    - This will enable us to get a list of available attributes from each character
    - Then pull every attribute from a character at once
    - Once we have these two things, we can sucessfully extract all character data
2. Testing  (DONE)

    - Extraction
        - It isn't correctly reading if it is a token action or in macro bar

    - Update
        - Would be cool to be able to put in macro bar then set colours, Add field into json, allows you to set a colour to a character, then it colours the macro bar in that would (or random would also be cool)

    - Creation
        - If character already exists, reports failure in creation
        - can't properly add to macro bar
    

    - Thoughts from testing
        - Might be a good idea, to run extraction fully, then check extracted characters to see if its different from the characters we're about to upload, then only upload the ones that have changed.
        - close browser at system end, and don't use input
            Press Enter to close browser...
            2025-05-26 13:31:08,605 - src.api.connection - INFO - Disconnected (browser remains open)
        
        - create fails if the character exists, perhaps switch to update at that point rather than failing
        - can't properly add to macro bar


    After refactor
        - autoclose still isn't new default



3. Pull from excel data, convert to json, then upload.

4. Further Automation
    - Be able to change character image, bio
    - Able to create, delete, modify abilities
    - Able to create and set tokens


5. Need to update system rules in both HTML and excel
    - HTML Sheet fixes:
        - Could use more of the upgrades
        - upgrade effort so that it subtracts the right attributes
        - update rules calculations
        - Add point costing and totaling
        - Add archetypes
    Where to store rules data? Is there a better more clear storage format?


6. Need to update scriptcards
    - identify connections between system, html sheet, and scriptcards
    - determine if new features need to be added, rules need to be updated, ect
    - plan to make it modular
    - once all of the above have been identified and planned for, we can rewrite the whole thing.


