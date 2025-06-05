# Rules for AI Collaboration
Guidelines for AI assistance on the Vitality System project.

## PROJECT CONTEXT

### **System Overview**
This is a personal RPG campaign management system with three major components:
1. **Vitality System RPG**: Complete custom superhero RPG with 10 tiers, 7 archetypes, complex combat
2. **Web Character Builder**: JavaScript browser app for character creation (`rulebook/character-builder/`)
3. **Roll20 Integration**: Python automation for uploading characters to Roll20 campaigns (`src/`)


### **Primary Development Goals**
- Complete web character builder (main pool, special attacks, utility tabs)
- Build ScriptCards bulk update tool (standalone script)
- Maintain Roll20 integration reliability
- Add character art/bio upload features
- Implement macro button creation and coloring

## MANDATORY WORKFLOW

### **1. DOCUMENTATION REVIEW**
- Read ALL provided documentation files before coding
- Pay attention to existing patterns and architectures
- Understand the ScriptCards compression system
- Review Roll20 API script capabilities

### **2. CODE ANALYSIS REQUIREMENTS**
- Review EVERY provided file completely before responding
- Identify existing utility functions and classes
- Understand data flow: Web Builder ↔ JSON ↔ Roll20
- Respect the modular architecture patterns

### **3. RESPONSE STRUCTURE**
- Begin by summarizing what you analyzed
- Ask clarifying questions BEFORE writing code
- Provide complete working solutions, not partial fixes
- Include error handling and logging

## TECHNICAL GUIDELINES

### **Python Development**
- Use existing logging patterns (`from src.utils.logging import setup_logging`)
- Follow the modular class structure in `src/character/`
- Leverage existing utilities in `src/utils/`
- Handle template sheets exclusion (MacroMule, ScriptCards_TemplateMule)
- Use pathlib.Path for file operations

### **JavaScript Development**
- Follow ES6+ module patterns in `rulebook/character-builder/`
- Use existing validation and calculation systems
- Maintain the modular component architecture
- Respect the character creation flow order
- Update localStorage character library appropriately

### **Roll20 Integration**
- Understand handout-based data transfer approach
- Use existing ChatInterface and Roll20Connection classes
- Leverage the custom Roll20 API script (`src/roll20_api/CharacterExtractor.js`)
- Handle browser automation gracefully with retries

### **Data Handling**
- Understand compressed vs expanded ability formats
- Use ScriptCardsTemplateManager for template operations
- Respect the flat JSON format for Roll20 compatibility
- Handle character data validation and normalization

## CODING STANDARDS

### **Error Handling Philosophy**
- Fail fast with clear error messages
- Log extensively using appropriate levels (DEBUG/INFO/WARNING/ERROR/CRITICAL)
- Don't over-engineer recovery mechanisms
- Provide specific error context, not generic messages

### **Code Organization**
- Keep functions focused and single-purpose
- Reuse existing utility functions when possible
- Follow the established class structure patterns
- Extract common patterns into utility modules

### **File Management**
- Use sanitized filenames for character exports
- Respect existing directory structure (`characters/extracted/`, etc.)
- Create necessary directories automatically
- Handle Unicode characters appropriately (avoid symbols in logs)

### **Performance Considerations**
- Batch operations when dealing with multiple characters
- Use resume capability for long-running operations
- Monitor memory usage with large character sets
- Leverage template compression for efficiency

## PROJECT-SPECIFIC RULES

### **Character Data Integrity**
- Never modify character stats when updating ScriptCards
- Preserve all character attributes and repeating sections
- Maintain ability `showInMacroBar` and `isTokenAction` flags
- Validate JSON structure before and after operations

### **ScriptCards System**
- Always use the master template from `src/scriptcards/Scripcards Attacks Library Neopunk 3.7.3.txt`
- Understand indexed vs full ability types
- Preserve attack indices when updating templates
- Skip compression for template sheets (MacroMule, ScriptCards_TemplateMule)

### **Web Builder Development**
- Follow the established tab order: Basic Info → Archetypes → Attributes → Main Pool → Special Attacks → Utility
- Implement real-time validation and point pool tracking
- Use the existing VitalityCharacter class structure
- Maintain character library organization

### **Roll20 Automation**
- Start Chrome with debugging flags (`--remote-debugging-port=9222`)
- Navigate to campaign editor before operations
- Use handout-based data transfer for large operations
- Clean up temporary handouts after completion
- Handle API availability checks with retries

## RESPONSE REQUIREMENTS

### **Code Solutions**
- Provide complete, working implementations
- Include all necessary imports and dependencies
- Add appropriate error handling and logging
- Test logic mentally before sharing
- Include usage examples when helpful

### **Architecture Changes**
- Explain impact on existing systems
- Provide migration steps if needed
- Maintain backward compatibility when possible
- Document new patterns for future reference

### **File Operations**
- Always specify complete file paths
- Indicate whether to ADD, REPLACE, or MODIFY existing code
- Provide clear installation/setup instructions
- Include any required configuration changes

## FORBIDDEN PRACTICES

### **Never Do This**
- Don't use Unicode symbols in log messages (Windows encoding issues)
- Don't modify character stats when updating ScriptCards only
- Don't process template sheets as regular characters
- Don't use chat-based extraction for large data sets (Roll20 limits)
- Don't assume method existence without verification

### **Always Do This**
- Verify existing methods before referencing them
- Provide complete file locations for modifications
- Include error handling for network/file operations
- Test with small datasets before scaling up
- Maintain existing logging patterns and levels

## COLLABORATION APPROACH

### **Question Everything**
- If uncertain about implementation details, ASK
- Clarify requirements before writing code
- Understand the user's workflow and priorities
- Propose alternatives when appropriate

### **Documentation Focus**
- Keep documentation current with code changes
- Provide clear usage examples
- Include troubleshooting for common issues
- Explain architectural decisions and trade-offs

### **Iterative Development**
- Start with working minimal implementations
- Build incrementally with testing at each stage
- Provide refactoring suggestions for improvements
- Maintain backward compatibility during changes

This codebase represents significant personal investment in a custom RPG system. Treat it with appropriate care and respect the established patterns while helping to extend and improve the functionality.