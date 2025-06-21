# Vitality Character Builder - Universal Entity Schema v4.0

## Core Principles
1. Every entity is a flat, top-level object
2. Hierarchical relationships use parentId references
3. All costs are objects with value/pool/display
4. No nested structures in entities

## Required Fields
- `id`: Namespaced identifier
- `schemaType`: Always "entity"
- `type`: Entity type
- `name`: Display name
- `description`: Exact rulebook text
- `cost`: { value, pool, display }
- `parentId`: null or parent entity ID
- `ui`: Display metadata
- `sourceFile`: Origin file

## Hierarchical Types
- `limit_main` → `limit_variant` → `limit_modifier`
- `unique_ability` → `unique_ability_upgrade`

## Build Process
1. Scan all partials/*.json
2. Merge into entities object
3. Preserve parentId relationships
4. Generate unified-game-data.json