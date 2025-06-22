// modernApp/core/SchemaSystem.js
import { Logger } from '../utils/Logger.js';

export class SchemaSystem {
    static schemas = new Map();
    static validators = new Map();

    static async init() {
        // Define sub-schemas first
        this.defineSchema('effectObject', {
            // A generic schema for objects inside an 'effects' array
            // This can be expanded with a 'oneOf' for specific effect types if the validator is enhanced
            required: ['type'],
            properties: {
                type: { type: 'string' },
                target: { type: ['string', 'array'], optional: true, items: { type: 'string' } }, // target can be a string or array of strings
                value: { type: ['string', 'number', 'boolean', 'object', 'array'], optional: true }, // value can be various types
                display: { type: 'string', optional: true },
                options: { type: 'array', optional: true, items: { type: 'string' } },
                subType: { type: 'string', optional: true },
                count: { type: 'number', optional: true },
                radius: { type: 'number', optional: true },
                activation: { type: 'string', optional: true },
                maintenance: { type: 'string', optional: true },
                uses: { type: 'number', optional: true },
                reset: { type: 'string', optional: true },
                trigger: { type: 'string', optional: true },
                // Add other common or generic fields found in effect objects
            }
        });

        this.defineSchema('requirementObject', {
            // A generic schema for objects inside a 'requirements' array
            required: ['type'],
            properties: {
                type: { type: 'string' },
                value: { type: ['string', 'number', 'boolean'], optional: true }, // value can be various types
                display: { type: 'string', optional: true },
                category: { type: 'string', optional: true },
                min: { type: 'number', optional: true },
                options: { type: 'array', optional: true, items: { type: 'string' } }, // For choice requirements
                count: { type: 'number', optional: true }, // For requirements needing a count
                // Add other common fields found in requirement objects
            }
        });

        this.defineSchema('pointSystemObject', {
            required: ['method'],
            properties: {
                method: { type: 'string' }, // e.g., "limits", "fixed", "shared_resource"
                multiplier: { type: 'string', optional: true }, // e.g., "tier/6"
                value: { type: ['string', 'number'], optional: true }, // e.g., "tier*10" or fixed number
                per: { type: 'string', optional: true }, // e.g., "attack"
                target: { type: 'string', optional: true }, // e.g., "base_attack"
                uses: { type: 'number', optional: true },
                regen: { type: 'number', optional: true },
                point_discount_per_use: { type: ['string', 'number'], optional: true },
            }
        });

        // Define core entity schema
        this.defineSchema('entity', {
            required: ['id', 'schemaType', 'type', 'name', 'description', 'cost', 'ui', 'sourceFile'],
            properties: {
                id: { type: 'string', pattern: /^[a-z0-9_.\-]+$/i }, // Allow hyphens and numbers, case-insensitive flag for pattern
                schemaType: { type: 'string', enum: ['entity'] }, // Ensure it's always 'entity'
                type: { type: 'string' }, // e.g., "archetype", "flaw", "trait", "unique_ability", "upgrade"
                name: { type: 'string' },
                description: { type: 'string' }, // Made non-optional
                cost: { // Made non-optional
                    type: 'object',
                    required: ['value', 'pool'],
                    properties: {
                        value: { type: ['number', 'function', 'null'], optional: true }, // null for variable/choice
                        pool: { type: 'string' },
                        display: { type: 'string', optional: true },
                        per: { type: 'string', optional: true }, // For stackable costs, e.g., "per purchase", "per space"
                        stackable: { type: 'boolean', optional: true, default: false },
                        isVariable: { type: 'boolean', optional: true, default: false },
                        isNegative: { type: 'boolean', optional: true, default: false }, // For costs that give points (like some limits)
                    }
                },
                requirements: { type: 'array', optional: true, items: { $ref: 'requirementObject' } },
                effects: { type: 'array', optional: true, items: { $ref: 'effectObject' } },
                ui: { // Made non-optional
                    type: 'object',
                    required: ['component', 'category'],
                    properties: {
                        component: { type: 'string', default: 'card' },
                        category: { type: 'string' }, // e.g., "movement", "Flaws", "Unique Abilities"
                        tags: { type: 'array', optional: true, items: { type: 'string' }, default: [] },
                        size: { type: 'string', default: 'medium', optional: true },
                        interactive: { type: 'boolean', default: true, optional: true }
                    }
                },
                sourceFile: { type: 'string' }, // Made non-optional
                parentId: { type: ['string', 'null'], optional: true, default: null },
                pointSystem: { type: 'object', optional: true, $ref: 'pointSystemObject' } // For archetypes that define point generation
                // Add other common optional fields like 'maxStacks' for stackable items
            }
        });
        
        // Example of a more specific schema for 'archetype' type entities
        this.defineSchema('archetypeEntity', {
            allOf: [{ $ref: 'entity' }], // Inherits from base entity
            required: ['ui'], // ui is already required in entity, but we might make ui.category specifically required for archetypes
            properties: {
                type: { type: 'string', enum: ['archetype'] }, // Restrict type to 'archetype'
                pointSystem: { type: 'object', optional: true, $ref: 'pointSystemObject' }, // Archetypes can have point systems
                ui: {
                    type: 'object',
                    required: ['component', 'category'], // Ensure category is always present for archetypes
                    properties: {
                         // Inherits component, tags, size, interactive from base entity's ui
                         category: { type: 'string' }, // Make category mandatory for archetypes
                    }
                }
            }
        });


        // ... (character schema remains the same for now, but could also be refined) ...
        this.defineSchema('character', {
            required: ['id', 'name', 'tier', 'schemaVersion'],
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                tier: { type: 'number', min: 1, max: 10, default: 4 },
                schemaVersion: { type: 'string'},
                archetypes: { 
                    type: 'object',
                    default: {},
                    properties: { // These are categories of archetypes
                        movement: { type: 'string', optional: true },
                        attackType: { type: 'string', optional: true },
                        effectType: { type: 'string', optional: true },
                        uniqueAbility: { type: 'string', optional: true }, // Added from data
                        defensive: { type: 'string', optional: true },     // Added from data
                        specialAttack: { type: 'string', optional: true }, // Renamed from attackMethod for clarity
                        utility: { type: 'string', optional: true }        // Renamed from utilityMethod for clarity
                    }
                },
                // Purchase arrays: flaws, traits, boons, unique_abilities, special_attacks, action_upgrades, features, senses, movement_features, descriptors etc.
                // These should store objects like { id: "entity_id", purchaseId: "unique_purchase_instance_id", configuration?: {} }
                flaws: { type: 'array', default: [], items: {type: 'object'} },
                traits: { type: 'array', default: [], items: {type: 'object'} },
                boons: { type: 'array', default: [], items: {type: 'object'} },
                action_upgrades: { type: 'array', default: [], items: {type: 'object'} }, // Assuming this type
                features: { type: 'array', default: [], items: {type: 'object'} },
                senses: { type: 'array', default: [], items: {type: 'object'} },
                descriptors: { type: 'array', default: [], items: {type: 'object'} },
                movement_features: { type: 'array', default: [], items: {type: 'object'} },
                unique_abilities_purchased: { type: 'array', default: [], items: {type: 'object'} }, // To distinguish from archetype choice
                special_attacks_created: { type: 'array', default: [], items: {type: 'object'} }, // For actual created attacks

                // Attributes would be an object
                attributes: {
                    type: 'object',
                    default: {},
                    properties: {
                        focus: { type: 'number', default: 0 },
                        mobility: { type: 'number', default: 0 },
                        power: { type: 'number', default: 0 },
                        endurance: { type: 'number', default: 0 },
                        awareness: { type: 'number', default: 0 },
                        communication: { type: 'number', default: 0 },
                        intelligence: { type: 'number', default: 0 }
                    }
                },
                pools: { // This would likely be calculated, not stored directly, or only store base values if modified
                    type: 'object',
                    default: {},
                }
                // ... other character specific fields
            }
        });
        Logger.info('[SchemaSystem] All schemas initialized.');
    }
    
    static defineSchema(name, definition) {
        this.schemas.set(name, definition);
        // Validator creation is deferred to when validate is called, or could be eager here
        // this.validators.set(name, this.createValidator(definition)); 
    }
    
    static createValidator(schemaDefinition, schemaName = 'anonymous') {
        return (data, path = '') => {
            const errors = [];
            let validatedData = typeof data === 'object' && data !== null ? { ...data } : data;
    
            if (schemaDefinition.$ref) {
                const refSchemaName = schemaDefinition.$ref;
                const refSchema = this.schemas.get(refSchemaName);
                if (!refSchema) {
                    errors.push(`${path || schemaName}: Referenced schema "${refSchemaName}" not found.`);
                    return { isValid: errors.length === 0, errors, data: validatedData };
                }
                // Validate against the referenced schema
                const refValidation = this.validate(refSchemaName, data);
                errors.push(...refValidation.errors.map(e => `${path}${e}`));
                validatedData = refValidation.data;
                return { isValid: errors.length === 0, errors, data: validatedData };
            }
    
            if (schemaDefinition.allOf) {
                for (const subSchema of schemaDefinition.allOf) {
                    const subValidation = this.createValidator(subSchema, schemaName)(data, path);
                    errors.push(...subValidation.errors);
                    if (typeof validatedData === 'object' && typeof subValidation.data === 'object') {
                        validatedData = { ...validatedData, ...subValidation.data };
                    } else {
                        validatedData = subValidation.data;
                    }
                }
                // After allOf, re-validate against the current schema's own properties if any (besides allOf)
                // This simple version doesn't separately validate non-allOf properties, assumes they are part of subSchemas
            }
    
            // Type check
            if (schemaDefinition.type) {
                if (!this.validateType(data, schemaDefinition.type)) {
                    errors.push(`${path || schemaName}: Invalid type. Expected ${schemaDefinition.type}, got ${typeof data}.`);
                    // If type is wrong, further property/item validation might be irrelevant or cause more errors
                    return { isValid: errors.length === 0, errors, data: validatedData };
                }
            }
    
            if (schemaDefinition.enum && !schemaDefinition.enum.includes(data)) {
                errors.push(`${path || schemaName}: Value "${data}" is not one of the allowed enum values: ${schemaDefinition.enum.join(', ')}.`);
            }
    
            if (schemaDefinition.pattern && typeof data === 'string' && !new RegExp(schemaDefinition.pattern).test(data)) {
                errors.push(`${path || schemaName}: Value "${data}" does not match pattern ${schemaDefinition.pattern}.`);
            }
    
            if (schemaDefinition.required && typeof data === 'object' && data !== null) {
                for (const field of schemaDefinition.required) {
                    if (!(field in data) || data[field] === undefined) {
                        errors.push(`${path || schemaName}: Missing required field "${field}".`);
                    }
                }
            }
    
            if (schemaDefinition.properties && typeof data === 'object' && data !== null) {
                for (const [field, rules] of Object.entries(schemaDefinition.properties)) {
                    const value = data[field];
                    const fieldPath = path ? `${path}.${field}` : field;
    
                    if (value === undefined) {
                        if ('default' in rules && !(field in validatedData)) { // Apply default only if not already present
                            validatedData[field] = typeof rules.default === 'function'
                                ? rules.default()
                                : JSON.parse(JSON.stringify(rules.default)); // Deep copy default
                        } else if (!rules.optional && !schemaDefinition.required?.includes(field)) {
                            // If not optional and not explicitly required (already checked),
                            // it implies it should exist if its parent object exists.
                            // This logic might need refinement based on strictness desired.
                            // For now, if not in required list, and not optional, it's an issue if parent object is present.
                        }
                    } else {
                        const propValidation = this.createValidator(rules, field)(value, fieldPath);
                        errors.push(...propValidation.errors);
                        if (validatedData && typeof validatedData === 'object') {
                             validatedData[field] = propValidation.data;
                        }
                    }
                }
            }
    
            if (schemaDefinition.items && Array.isArray(data)) {
                for (let i = 0; i < data.length; i++) {
                    const itemPath = `${path || schemaName}[${i}]`;
                    const itemValidation = this.createValidator(schemaDefinition.items, `item_in_${schemaName}`)(data[i], itemPath);
                    errors.push(...itemValidation.errors);
                    if (Array.isArray(validatedData)) {
                        validatedData[i] = itemValidation.data;
                    }
                }
            }
    
            if (schemaDefinition.min !== undefined && typeof data === 'number' && data < schemaDefinition.min) {
                errors.push(`${path || schemaName}: Value ${data} is less than minimum ${schemaDefinition.min}.`);
            }
            if (schemaDefinition.max !== undefined && typeof data === 'number' && data > schemaDefinition.max) {
                errors.push(`${path || schemaName}: Value ${data} is greater than maximum ${schemaDefinition.max}.`);
            }
    
            return { isValid: errors.length === 0, errors, data: validatedData };
        };
    }
    
    static validateType(value, typeOrTypes) {
        const types = Array.isArray(typeOrTypes) ? typeOrTypes : [typeOrTypes];
        for (const type of types) {
            switch (type) {
                case 'string': if (typeof value === 'string') return true; break;
                case 'number': if (typeof value === 'number' && !isNaN(value)) return true; break;
                case 'boolean': if (typeof value === 'boolean') return true; break;
                case 'function': if (typeof value === 'function') return true; break;
                case 'array': if (Array.isArray(value)) return true; break;
                case 'object': if (value !== null && typeof value === 'object' && !Array.isArray(value)) return true; break;
                case 'null': if (value === null) return true; break;
                default: Logger.warn(`[SchemaSystem] Unknown type specified in schema: ${type}`); return true; // Be lenient with unknown types
            }
        }
        return false; // None of the specified types matched
    }
    
    static validate(schemaName, data) {
        const schemaDefinition = this.schemas.get(schemaName);
        if (!schemaDefinition) {
            Logger.error(`[SchemaSystem] Unknown schema: ${schemaName}`);
            // Return a structure indicating failure, but don't throw to halt everything
            return { isValid: false, errors: [`Unknown schema: ${schemaName}`], data };
        }
        
        // Lazily create and cache validator if not already done
        if (!this.validators.has(schemaName)) {
            this.validators.set(schemaName, this.createValidator(schemaDefinition, schemaName));
        }
        const validator = this.validators.get(schemaName);
        return validator(data);
    }

    /**
     * Validates an entity from unified-game-data.json.
     * It first tries to use a type-specific schema (e.g., 'archetypeEntity')
     * and falls back to the generic 'entity' schema.
     */
    static validateGameEntity(entityData) {
        if (!entityData || !entityData.type) {
            return { isValid: false, errors: ['Entity data or entity type is missing.'], data: entityData };
        }

        const specificSchemaName = `${entityData.type}Entity`; // e.g., archetypeEntity
        if (this.schemas.has(specificSchemaName)) {
            Logger.debug(`[SchemaSystem] Validating game entity ID "${entityData.id}" against specific schema: ${specificSchemaName}`);
            return this.validate(specificSchemaName, entityData);
        } else {
            Logger.debug(`[SchemaSystem] Validating game entity ID "${entityData.id}" against generic "entity" schema (no specific schema found for type "${entityData.type}").`);
            return this.validate('entity', entityData);
        }
    }
}