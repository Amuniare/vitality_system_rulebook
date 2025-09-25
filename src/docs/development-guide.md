

# **docs/development-guide.md**

```markdown
# Development Guide

Setup instructions, common development tasks, and troubleshooting for the Vitality System codebase.

## Development Setup

### **Prerequisites**
- Python 3.8+ with pip
- Google Chrome browser
- Roll20 account with GM access to campaign
- Git (optional, for version control)

### **Installation**
```bash
# Clone/download project
git clone [repository] vitality-system

# Create Python virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies  
pip install -r requirements.txt

# Verify setup
python main.py --help
```

### **Chrome Setup for Roll20 Automation**
```bash
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=C:\temp\chrome-debug

# Mac
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug

# Linux  
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

## Project Structure

```
vitality-system/
├── main.py                   # Main entry point
├── requirements.txt          # Python dependencies
├── rulebook/                 # Web character builder & rules
├── src/                      # Python automation system
├── characters/               # Character data storage
│   ├── extracted/           # Character JSON files
│   └── web_exports/         # Web builder exports
├── docs/                    # Documentation
├── logs/                    # Automation logs
└── tools/                   # Development utilities
```

## Common Development Tasks

### **Character Upload to Roll20**
```bash
# Start Chrome with debugging
[chrome command from above]

# Navigate to Roll20 campaign in Chrome
# Open: https://app.roll20.net/editor/setcampaign/YOUR_CAMPAIGN_ID

# Run upload automation
python main.py

# Follow prompts to select characters for upload
```

### **Web Character Builder Development**
```bash
# Open character builder in browser
# File → Open: rulebook/character-builder/character-builder.html

# For development with live reload (optional)
python -m http.server 8000
# Open: http://localhost:8000/rulebook/character-builder/
```

### **Run Character Extraction (Legacy)**
```bash
# Only needed for one-time migration or backup
python -c "from src.character.api_extractor import CharacterExtractor; # [extraction code]"
```

### **Testing ScriptCards Template System**
```bash
# Test template compression/expansion
python -c "from src.utils.scriptcards_templates import ScriptCardsTemplateManager; tm = ScriptCardsTemplateManager(); print(tm.get_compression_stats())"
```

## File Organization

### **Character JSON Storage**
- `characters/extracted/` - Characters downloaded from Roll20
- `characters/web_exports/` - Characters created in web builder  
- `characters/input/` - Template/test characters for development

### **Templates & Assets**
- `src/scriptcards/` - Master ScriptCards template for compression
- `src/char_sheet/` - Roll20 character sheet HTML/CSS
- `rulebook/` - Complete game rules and web builder

### **Logs & State**
- `logs/` - Automation execution logs (timestamped)
- `*_state.json` - Resume state for interrupted operations (auto-generated)

## Development Workflow

### **Typical Development Cycle**
1. **Character Creation**: Use web builder or edit JSON directly
2. **Local Testing**: Validate JSON structure and data
3. **Upload to Roll20**: Use automation system to deploy
4. **Game Testing**: Test in actual Roll20 session
5. **Iteration**: Refine and repeat

### **Adding New Features**
1. **Game Rules**: Update `rulebook/rules/rulebook.md` 
2. **Web Builder**: Add UI components in `rulebook/character-builder/`
3. **Data Processing**: Update Python classes in `src/character/`
4. **Roll20 Integration**: Modify `src/roll20_api/CharacterExtractor.js`

## Debugging

### **Web Builder Issues**
- **F12 Console**: Check for JavaScript errors
- **localStorage**: May need clearing for character library issues
- **Point Calculations**: Verify archetype selections completed

### **Roll20 Automation Issues**
- **Chrome Debug**: Ensure port 9222 accessible
- **Roll20 API**: Check API script console for errors
- **Handout Creation**: Verify campaign permissions
- **Character Upload**: Check logs in `logs/` directory

### **Common Error Messages**

**"Custom API not available"**
- Solution: Install Roll20 API script in campaign settings

**"Failed to connect to existing browser"**  
- Solution: Start Chrome with debugging flags, ensure no other Chrome instances

**"Character creation failed"**
- Solution: Check Roll20 campaign permissions, verify handout created

**"Template expansion errors"**
- Solution: Verify `src/scriptcards/Scripcards Attacks Library Neopunk 3.7.3.txt` exists

## Performance Tips

### **Large Character Sets**
- Upload characters in batches (system handles 25+ characters efficiently)
- Use bulk operations when possible
- Monitor `logs/` for performance bottlenecks

### **Development Speed**
- Use JSON file editing for rapid iteration
- Test character builds in web builder before upload
- Keep Chrome debugging session open between runs

## Useful Development Scripts

### **Quick Character Validation**
```python
from src.utils.json_utils import load_json
char = load_json("characters/extracted/CHARACTER_NAME.json")
print(f"Character: {char['metadata']['name']} (Tier {char['attributes']['char_tier']})")
```

### **Template Compression Stats**
```python
from src.utils.scriptcards_templates import ScriptCardsTemplateManager
tm = ScriptCardsTemplateManager()
print(tm.get_compression_stats())
```

### **Character Library Reset**
```javascript
// In web builder console
localStorage.removeItem('vitality-character-library-v2');
location.reload();
```



## External Data Management

### Data File Structure
The character builder loads game data from `rulebook/character-builder/data/*.json`:
- Files are loaded asynchronously during app initialization
- GameDataManager provides centralized access to all game data
- Missing files are handled gracefully with fallbacks

### Adding New Game Data
1. Create/edit JSON file in `data/` directory
2. Add file path to GameDataManager.dataFiles
3. Create getter method in GameDataManager
4. Update relevant system to use gameDataManager.getXxx()

### Local Development
- No build process required - direct JSON file editing
- Changes take effect on browser refresh
- Validate JSON syntax before testing


## Contributing Guidelines

### **Code Style**
- Python: Follow existing patterns, use logging extensively
- JavaScript: ES6+ modules, consistent naming conventions
- Documentation: Update relevant docs for any changes

### **Testing**
- Test character upload/download cycles
- Verify web builder functionality after changes
- Check Roll20 integration with small character sets first


