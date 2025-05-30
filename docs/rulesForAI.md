# Rules for the AI to Follow
These are the rules which the AI must obey.

## MANDATORY DOCUMENTATION RE-REVIEW BEFORE WRITING CODE

Before writing a single line of code, I will:
1. Extract ALL coding standards from your documentation 
2. Create a compliance checklist for each standard
3. Explicitly verify EACH standard is followed in my code
4. If I'm uncertain about ANY standard, I will ASK before proceeding


## Review ALL Documentation 
Throughly review all documentation, obey structure, policies, procedures and guidelines when writing code. Defer to the structure in the docs over what you would consider doing.

1. Always review the documentation thoroughly before providing any code or suggestions
2. Pay close attention to the exact field names in configuration files
3. Don't add default values in code that duplicate configuration
4. Respect the "fail fast" philosophy when it's been established
5. Keep configuration sources centralized in a single location
6. Highlight when I'm uncertain about a detail rather than making assumptions
7. Use the functions within logging_utils.py when generating code


# Don't Overcomplicate
When Roll20 API extraction fails, try the simplest possible approach first
Focus on one working method rather than mixing multiple approaches
Prefer simple solutions, but don't avoid elegant approaches that are actually simpler.

## PRIORITIZE SIMPLICITY
Always provide the simplest solution possible. Avoid complex approaches when a straightforward one will work. Keep code concise, readable, and focused on solving the immediate problem without overengineering. 

## EMBRACE FAIL-FAST
Minimize excessive error checking and validation. Code should fail early and visibly when problems occur rather than attempting elaborate recovery. Since this is for personal use, prioritize development speed over bulletproof validation.

## MAXIMIZE CODE REUSE 
Leverage existing utility functions whenever possible. Break solutions into small, modular functions that can be reused across the codebase. Identify opportunities to extract common patterns into utility modules rather than duplicating logic.



## Logs
These are the logging policies and procedures which must be followed. Additionally, use the logging utils.

### Logging Levels
1. **DEBUG**: Use for diagnostic information, variable values, every function entry/exit.
2. **INFO**: General operational information about normal program execution. Use for startup/shutdown events, configuration settings and state changes. Use at the start of any important opertation.
3. **WARNING**: Potential issues that don't prevent the program from working but might indicate problems. Examples include deprecated features or unexpected but recoverable conditions. They should be the minimum in an except block. Warnings are best for except statments within a loop.
4. **ERROR**: Errors that prevent a specific operation from running. Used within except statments that prevent an operation from moving forward
5. **CRITICAL**: Errors that might cause complete failure, use for failures at the stage level, if an event causes the main pipeline to fail that's a critical error and should be accompanied by a system exit.


### Don't use symbols
Symbols like this ✓ mess up the log, don't use them



**MANDATORY METHOD VERIFICATION AND LOCATION SPECIFICATION:**

Before writing any code or referencing any methods, I will:

1. **VERIFY EXISTENCE**: Explicitly state "Looking at your existing code..." and only reference methods/classes that I can see in the provided files
2. **ASSUME NOTHING**: If I haven't seen a method in the provided code, I will explicitly state "This method doesn't exist yet - you need to ADD it"
3. **COMPLETE LOCATIONS**: Always provide:
   - Full file path (e.g., `src/character/api_extractor.py`)
   - Specific method/class name if modifying existing code
   - Line numbers or context when possible
   - Whether to ADD, REPLACE, or MODIFY
4. **EXPLICIT INSTRUCTIONS**: Format as:
   ```
   **ACTION**: ADD new method
   **LOCATION**: src/character/api_extractor.py
   **WHERE**: After line 150 (after the `_close_handout_dialog` method)
   **METHOD NAME**: `_compress_character_abilities`
   ```

# MANDATORY RULES FOR FUTURE CONVERSATIONS

## SIMPLICITY FIRST
- Always provide the simplest solution that works
- Maximum file size limits when specified (400 lines = hard limit)
- Test code logic before sharing (don't reference non-existent methods)

## COMPLETE SOLUTIONS
- Provide working code in one response, not incremental fixes
- Include all required methods/imports
- Test the logic flow mentally before sharing

## FOCUS ON REQUIREMENTS  
- Extract only what's explicitly needed
- If user says "simple and focused" - mean it
- Size reduction is critical - bigger output = failure

## ERROR PREVENTION
- Check all method references exist
- Handle None values in string operations
- Verify all imports and dependencies


# NO SYMBOLS
NO SYMBOLS - Plain text only
