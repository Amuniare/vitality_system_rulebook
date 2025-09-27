# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the `frontend-dev` development environment for the Vitality System - a comprehensive RPG character builder web application. This directory contains a sophisticated frontend-only character builder with advanced validation, point pool management, and export capabilities.

## Development Commands

### Local Development
```bash
# Serve the application locally from frontend-dev directory
python -m http.server 8080
# Access at: http://localhost:8080/character-builder/character-builder.html
```

### File Structure
- **Entry Point**: `character-builder/character-builder.html` - Main application interface
- **Hub**: `index.html` - Landing page with navigation to all tools
- **Rules**: `rules/index.html` - RPG rulebook viewer
- **Campaigns**: `campaigns/` - Campaign-specific content and lore

## High-Level Architecture

### Component-Based Architecture with Strict Separation of Concerns

The character builder follows a sophisticated layered architecture with strict contracts between components:

#### Core Architecture Layers

**`app/` - The Orchestrator**
- `app.js` - Application entry point, initializes `GameDataManager` first
- `CharacterBuilder.js` - Central controller managing character state and coordinating all tabs
- Handles top-level event delegation and state management
- **Rule**: Must NOT contain business logic for specific features

**`core/` - The Foundation**
- `GameDataManager.js` - Loads all game data from JSON files, must be initialized first
- `VitalityCharacter.js` - Character data model (structure only, no complex logic)
- `TierSystem.js`, `DiceSystem.js` - Core game mechanics
- Foundation layer that all other components depend on

**`features/` - Tab Controllers (Vertical Slices)**
- Each subdirectory represents a complete feature/tab (e.g., `archetypes/`, `special-attacks/`)
- Each tab manages its own UI rendering and user interactions
- Follows the **Component Re-render Contract** to prevent stale event listeners
- **Rule**: Tabs must delegate business logic to `systems/` classes

**`systems/` - Business Logic Engine**
- Stateless classes with static methods containing all game rules
- Examples: `ArchetypeSystem.js`, `SpecialAttackSystem.js`, `BoonsSystem.js`
- **Rule**: All methods must be static, no DOM interaction allowed
- Single source of truth for all game mechanics calculations

**`calculators/` - Pure Math Engine**
- Stateless pure functions for all calculations
- `PointPoolCalculator.js`, `StatCalculator.js`, `LimitCalculator.js`
- **Rule**: Pure functions only - same input always yields same output

**`data/` - Game Content Library**
- JSON files containing all game rules, archetypes, abilities, etc.
- Data-driven UI configuration
- All game content must be loaded through `GameDataManager`

**`shared/` - Reusable Components**
- Generic UI components and utilities
- `RenderUtils.js` - Standardized HTML generation with `data-action` attributes
- `EventManager.js` - Event delegation system
- **Rule**: Must be completely feature-agnostic

### Critical Architectural Contracts

#### 1. The Unbreakable Data Flow
All character modifications MUST follow this exact sequence:
1. **UI Event** → 2. **Event Delegation** → 3. **Tab Controller** → 4. **System Call** → 5. **Character Modification** → 6. **Centralized Update** → 7. **Re-render**

**FORBIDDEN**: Direct character object modification (e.g., `this.character.tier = 5`)

#### 2. Component Re-render Contract
To prevent stale event listeners:
- Each component must have `removeEventListeners()` and `setupEventListeners()` methods
- `render()` must call `removeEventListeners()` before attaching new ones
- Use scoped DOM queries, never global `getElementById` in multi-instance components

#### 3. Event Delegation Pattern
- All user interactions use `data-action` attributes
- Central event delegation in `CharacterBuilder.js` routes events to appropriate tab handlers
- Example: `<button data-action="purchase-flaw" data-flaw-id="weak">Purchase</button>`

#### 4. Data-Driven Design
- All game content loaded from `data/*.json` files
- UI components are configured by data, not hardcoded
- Single source of truth through `GameDataManager`

### Key System Interactions

#### Character State Management
- `CharacterBuilder.currentCharacter` - Single source of truth
- All modifications go through `CharacterBuilder.updateCharacter()`
- Automatic localStorage saving and validation on every change

#### Point Pool System
- Complex point allocation across multiple pools (Combat Attributes, Main Pool, Special Attacks, etc.)
- Real-time validation with advisory warnings (non-blocking)
- Calculated by `PointPoolCalculator` based on tier, archetypes, and purchases

#### Tab Navigation & Validation
- 8-tab progression system with build order enforcement
- Each tab validates prerequisites but allows access (advisory model)
- Real-time validation feedback without blocking user actions

### Development Patterns

#### Creating New Features
1. Add data structure to `core/VitalityCharacter.js`
2. Create JSON data file in `data/`
3. Add business logic to appropriate `systems/` class
4. Create tab controller in `features/`
5. Update `CharacterBuilder.js` event delegation map

#### Component Communication
- Parent-to-child: Pass prepared data as parameters
- Child-to-parent: Emit events via `data-action` attributes
- No direct cross-component communication

#### Error Handling
- Non-blocking validation model - show warnings but allow actions
- All errors logged to console with context
- Graceful degradation for missing data

## Important Notes

### Character Builder Specific Rules
- **Build Order**: Archetypes → Attributes → Main Pool → Special Attacks → Utility
- **Point Pools**: Multiple interconnected pools with complex calculations
- **Real-time Validation**: Advisory warnings without blocking user progress
- **Export System**: JSON export compatible with Roll20 automation

### File Organization
- Feature directories are self-contained vertical slices
- Shared utilities must remain feature-agnostic
- Data files drive UI configuration and game rules

### Testing & Debugging
- Use browser console for debugging - extensive logging implemented
- Character state accessible via `window.characterBuilder.currentCharacter`
- Validation results available in character object

This architecture supports complex RPG character creation with sophisticated validation while maintaining clean separation of concerns and preventing common web application pitfalls like stale event listeners and tight coupling.