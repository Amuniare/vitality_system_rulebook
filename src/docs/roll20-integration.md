

---

# **docs/roll20-integration.md**

```markdown
# Roll20 Integration System

Python-based system for bidirectional character data flow between local JSON files and Roll20 campaigns.

## System Overview

Two main workflows:
- **Character Upload**: JSON files → Roll20 campaign (primary use)
- **Character Extraction**: Roll20 campaign → JSON files (legacy/maintenance)

## Architecture

```
src/
├── api/                      # Browser automation & Roll20 interface
│   ├── connection.py         # Chrome debugging connection
│   ├── chat_interface.py     # Roll20 chat interaction
│   └── commands.py           # Roll20 API command builders
├── character/                # Character data processing
│   ├── api_extractor.py      # Extract from Roll20 (legacy)
│   ├── updater.py           # Upload to Roll20 (primary)
│   ├── differ.py            # Change detection
│   └── mapper.py            # Data format conversion
├── roll20_api/              # Roll20 server-side script
│   └── CharacterExtractor.js # Custom API script (install in Roll20)
└── utils/                   # Supporting utilities
    └── scriptcards_templates.py # Template compression system
```

## Primary Workflow: Character Upload

### **Setup Requirements**
1. **Chrome Setup**: Browser with remote debugging enabled
2. **Roll20 Campaign**: Access to target campaign with API scripts enabled
3. **Python Environment**: Dependencies installed via `requirements.txt`

### **Upload Process**
```bash
python main.py
```

**Internal Steps**:
1. Connect to Chrome debugging port (9222)
2. Navigate to Roll20 campaign editor
3. Read character JSON files from `characters/extracted/`
4. Expand compressed ScriptCards abilities
5. Create handouts with character data
6. Use Roll20 API to import characters
7. Clean up temporary handouts

### **File Locations**
- **Input**: `characters/extracted/*.json`
- **Templates**: `src/scriptcards/Scripcards Attacks Library Neopunk 3.7.3.txt`
- **Logs**: `logs/automation_TIMESTAMP.log`

## Roll20 API Script Setup

### **Installation** 
1. Copy contents of `src/roll20_api/CharacterExtractor.js`
2. Paste into Roll20 campaign → Settings → API Scripts
3. Save script (should show "CharacterExtractor API loaded")

### **Available Commands**
- `!update-character CharacterName` - Update existing character
- `!create-character CharacterName` - Create new character  
- `!bulk-update` - Update multiple characters at once
- `!extract-character CharacterName` - Extract single character (legacy)
- `!handout-cleanup` - Remove temporary handouts

## Legacy: Character Extraction

**Status**: Maintenance only, used for one-time migration of 188 characters

### **Extraction Process**
1. Connects to Roll20 via browser automation
2. Uses custom API to extract all character data
3. Saves to multiple handouts (batch processing)
4. Downloads and processes character data
5. Compresses ScriptCards abilities using templates
6. Saves individual JSON files

### **Template Compression**
- Identifies ScriptCards abilities with attack indices
- Compresses repeated template code to just index numbers
- Reduces file sizes significantly
- Maintains full functionality through expansion system

## Data Flow

```
Web Builder → JSON files → Roll20 Campaign
     ↑                           ↓
Character Library ←← (extraction - legacy)
```

## Troubleshooting

### **Upload Issues**
- **"API not available"**: Check Roll20 API script is installed and loaded
- **Browser connection failed**: Ensure Chrome started with `--remote-debugging-port=9222`
- **Character creation failed**: Verify handout was created successfully
- **Template expansion errors**: Check ScriptCards template file exists

### **Common Fixes**
- Restart Chrome with debugging flags
- Refresh Roll20 page and retry
- Check campaign permissions (need to be GM)
- Verify character JSON format is valid

### **Browser Setup**
```bash
# Start Chrome with debugging (Windows)
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=C:\temp\chrome-debug
```

## API Script Functions

### **Character Management**
- Creates/updates characters from handout data
- Handles attributes, repeating sections, abilities
- Sets macro bar and token actions
- Manages character permissions

### **Handout Processing** 
- Reads JSON data from handout notes
- Handles HTML cleaning and parsing
- Supports bulk operations via single handout
- Automatic cleanup after operations

### **Error Handling**
- Template sheet filtering (skips MacroMule, ScriptCards_TemplateMule)
- Graceful failure with detailed logging
- Resume capability for interrupted operations
- Progress reporting for large batches
```

---