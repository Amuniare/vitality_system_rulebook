export class SchemaSystem {
    static schemas = new Map();
    static validators = new Map();
    
    static async init() {
        // Define core schemas
        this.defineSchema('entity', {
            required: ['id', 'schemaType', 'type', 'name'],
            properties: {
                id: { type: 'string', pattern: /^[a-z_]+$/ },
                schemaType: { type: 'string' },
                type: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string', optional: true },
                cost: { 
                    type: 'object',
                    optional: true,
                    properties: {
                        value: { type: ['number', 'function'] },
                        pool: { type: 'string' },
                        display: { type: 'string', optional: true }
                    }
                },
                requirements: { type: 'array', optional: true },
                effects: { type: 'array', optional: true },
                ui: {
                    type: 'object',
                    optional: true,
                    properties: {
                        component: { type: 'string', default: 'card' },
                        size: { type: 'string', default: 'medium' },
                        interactive: { type: 'boolean', default: true }
                    }
                }
            }
        });
        
        this.defineSchema('character', {
            required: ['id', 'name', 'tier'],
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                tier: { type: 'number', min: 1, max: 10, default: 4 },
                archetypes: { 
                    type: 'object',
                    default: {},
                    properties: {
                        movement: { type: 'string', optional: true },
                        attackType: { type: 'string', optional: true },
                        effectType: { type: 'string', optional: true },
                        attackMethod: { type: 'string', optional: true },
                        defenseMethod: { type: 'string', optional: true },
                        utilityMethod: { type: 'string', optional: true },
                        defensive: { type: 'string', optional: true }
                    }
                },
                traits: { type: 'array', default: [] },
                flaws: { type: 'array', default: [] },
                boons: { type: 'array', default: [] },
                pools: {
                    type: 'object',
                    default: {},
                    properties: {
                        main: { type: 'object' },
                        utility: { type: 'object' },
                        special: { type: 'object' }
                    }
                }
            }
        });
    }
    
    static defineSchema(name, definition) {
        this.schemas.set(name, definition);
        this.validators.set(name, this.createValidator(definition));
    }
    
    static createValidator(schema) {
        return (data) => {
            const errors = [];
            const validated = {};
            
            // Check required fields
            if (schema.required) {
                for (const field of schema.required) {
                    if (!(field in data)) {
                        errors.push(`Missing required field: ${field}`);
                    }
                }
            }
            
            // Validate and process properties
            if (schema.properties) {
                for (const [field, rules] of Object.entries(schema.properties)) {
                    const value = data[field];
                    
                    // Apply defaults
                    if (value === undefined && 'default' in rules) {
                        validated[field] = typeof rules.default === 'function' 
                            ? rules.default() 
                            : rules.default;
                        continue;
                    }
                    
                    // Skip optional fields
                    if (value === undefined && rules.optional) {
                        continue;
                    }
                    
                    // Validate type
                    if (value !== undefined) {
                        const valid = this.validateType(value, rules.type);
                        if (!valid) {
                            errors.push(`Invalid type for ${field}: expected ${rules.type}`);
                        } else {
                            validated[field] = value;
                        }
                    }
                }
            }
            
            return {
                isValid: errors.length === 0,
                errors,
                data: { ...data, ...validated }
            };
        };
    }
    
    static validateType(value, type) {
        if (Array.isArray(type)) {
            return type.some(t => this.validateType(value, t));
        }
        
        switch (type) {
            case 'string': return typeof value === 'string';
            case 'number': return typeof value === 'number';
            case 'boolean': return typeof value === 'boolean';
            case 'function': return typeof value === 'function';
            case 'array': return Array.isArray(value);
            case 'object': return value !== null && typeof value === 'object';
            default: return true;
        }
    }
    
    static validate(schemaName, data) {
        const validator = this.validators.get(schemaName);
        if (!validator) {
            throw new Error(`Unknown schema: ${schemaName}`);
        }
        return validator(data);
    }
}