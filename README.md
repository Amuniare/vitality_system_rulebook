# Vitality System - RPG Campaign Management

Personal campaign management system for the Vitality System RPG, featuring web-based character builder and Roll20 integration.

## Quick Start
- **Character Building**: Open `rulebook/character-builder/character-builder.html`
- **Roll20 Upload**: Run `python main.py` for character upload workflow
- **Rules Reference**: See `rulebook/rules/` for complete game mechanics


## Current Status
- ✅ Vitality System rules complete
- ✅ Roll20 character upload working
- ✅ Web character builder (all 7 tabs fully functional)
- 🚧 UI Polish & Final Bug Fixes



## Commands for Claude Code
wsl -d Ubuntu

claude


## Start Server
python -m http.server

http://localhost:8000/

## Documentation

- **Core Concepts & Guides**
  - [Development Guide](docs/development-guide.md) - Setup, common tasks, troubleshooting.
  - [Rules for AI Collaboration](docs/rulesForAI.md) - Guidelines for AI-assisted development.
  - [Data Formats](docs/data-formats.md) - JSON structures and character data flow.

- **Application Architecture**
  - [Web Character Builder](docs/web-character-builder.md) - Overview of the frontend application.
  - [Roll20 Integration](docs/roll20-integration.md) - Backend character upload/download workflows.
  - [ScriptCards System](docs/scriptcards-system.md) - Macro template compression and management.

- **Development Logs**
  - [Frontend Development Logs](docs/web_dev_logs/) - Phase-by-phase history of the web character builder.
  - [Backend Development Logs](docs/src_dev_logs/) - Session-by-session history of the Roll20 integration system.
