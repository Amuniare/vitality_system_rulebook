
// modernApp/core/PropsManager.js
import { Logger } from '../utils/Logger.js';

/**
 * PropsManager - A utility class for managing component properties.
 * It provides functionalities for validating props against a schema,
 * applying default values, and comparing prop objects.
 */
export class PropsManager {

    /**
     * Processes incoming props against a defined schema for a component.
     * This includes:
     *  - Applying default values for props not explicitly provided.
     *  - Validating required props.
     *  - Validating prop types.
     * 
     * @param {string} componentName - The name of the component (for logging purposes).
     * @param {Object} actualProps - The props object passed to the component instance.
     * @param {Object} propSchema - The schema defining expected props, their types, defaults, and requirements.
     *                              Example: 
     *                              static propSchema = {
     *                                  title: { type: 'string', required: true, default: 'Default Title' },
     *                                  count: { type: 'number', default: 0 },
     *                                  items: { type: 'array' } 
     *                              };
     * @returns {Object} A new props object with defaults applied and validated.
     */
    static processProps(componentName, actualProps, propSchema) {
        Logger.debug(`[PropsManager] Processing props for ${componentName}`);
        Logger.debug(`[PropsManager] Actual props:`, actualProps);
        Logger.debug(`[PropsManager] Prop schema:`, propSchema);
        
        if (!propSchema || typeof propSchema !== 'object') {
            // If no schema is defined, return a shallow copy of actualProps.
            Logger.debug(`[PropsManager] No schema defined, returning shallow copy of actual props`);
            const result = { ...(actualProps || {}) };
            Logger.debug(`[PropsManager] Result:`, result);
            return result;
        }

        const processedProps = {};
        Logger.debug(`[PropsManager] Starting prop processing with schema`);
        
        // Special handling for TabNavigation tabs array
        if (componentName === 'TabNavigation') {
            Logger.debug(`[PropsManager] TabNavigation component detected!`);
            Logger.debug(`[PropsManager] TabNavigation actualProps:`, actualProps);
            Logger.debug(`[PropsManager] TabNavigation actualProps.tabs:`, actualProps.tabs);
            Logger.debug(`[PropsManager] TabNavigation tabs exists:`, !!actualProps.tabs);
            if (actualProps.tabs) {
                Logger.debug(`[PropsManager] TabNavigation tabs length:`, actualProps.tabs.length);
                Logger.debug(`[PropsManager] TabNavigation tabs type:`, typeof actualProps.tabs);
                Logger.debug(`[PropsManager] TabNavigation tabs is Array:`, Array.isArray(actualProps.tabs));
                Logger.debug(`[PropsManager] TabNavigation first tab:`, actualProps.tabs[0]);
            } else {
                Logger.error(`[PropsManager] CRITICAL: TabNavigation actualProps.tabs is missing or falsy!`);
            }
        }

        // Iterate over the schema to ensure all defined props are considered.
        for (const propName in propSchema) {
            if (Object.prototype.hasOwnProperty.call(propSchema, propName)) {
                const schemaEntry = propSchema[propName];
                let propValue;

                if (Object.prototype.hasOwnProperty.call(actualProps, propName)) {
                    propValue = actualProps[propName];
                } else if (Object.prototype.hasOwnProperty.call(schemaEntry, 'default')) {
                    propValue = typeof schemaEntry.default === 'function'
                        ? schemaEntry.default() // For dynamic defaults
                        : schemaEntry.default;
                    Logger.debug(`[PropsManager][${componentName}] Applied default for prop "${propName}":`, propValue);
                }
                // If neither actual prop nor default exists, propValue remains undefined here.

                // Validation: Required
                if (schemaEntry.required && typeof propValue === 'undefined') {
                    Logger.warn(`[PropsManager][${componentName}] Missing required prop: "${propName}". Component might not function as expected.`);
                    // In a very strict mode, one might throw an error here.
                    // For advisory system, logging is often sufficient.
                }

                // Validation: Type (only if a value is present and type is defined in schema)
                if (typeof schemaEntry.type === 'string' && typeof propValue !== 'undefined') {
                    const expectedType = schemaEntry.type.toLowerCase();
                    let actualType = typeof propValue;
                    if (actualType === 'object') {
                        actualType = Array.isArray(propValue) ? 'array' : 'object';
                    }
                    
                    if (actualType !== expectedType) {
                        Logger.warn(`[PropsManager][${componentName}] Invalid type for prop "${propName}". Expected ${expectedType}, got ${actualType}. Value:`, propValue);
                    }
                }
                
                // Assign the processed value (actual or default)
                if (typeof propValue !== 'undefined') {
                    processedProps[propName] = propValue;
                }
            }
        }
        
        // Add any props that were passed in but not defined in the schema.
        // This allows for flexible props but might be warned against in stricter setups.
        for (const propName in actualProps) {
            if (Object.prototype.hasOwnProperty.call(actualProps, propName) && !Object.prototype.hasOwnProperty.call(propSchema, propName)) {
                Logger.debug(`[PropsManager][${componentName}] Prop "${propName}" was passed but is not defined in propSchema.`);
                processedProps[propName] = actualProps[propName];
            }
        }
        
        Logger.debug(`[PropsManager] Final processed props for ${componentName}:`, processedProps);
        
        // Special validation for TabNavigation
        if (componentName === 'TabNavigation') {
            Logger.debug(`[PropsManager] TabNavigation final tabs:`, processedProps.tabs);
            Logger.debug(`[PropsManager] TabNavigation final tabs length:`, processedProps.tabs?.length);
            Logger.debug(`[PropsManager] TabNavigation final tabs type:`, typeof processedProps.tabs);
            Logger.debug(`[PropsManager] TabNavigation final tabs is Array:`, Array.isArray(processedProps.tabs));
        }
        
        return processedProps;
    }

    /**
     * Performs a shallow comparison of two objects (typically props objects).
     * Returns true if all top-level properties are strictly equal (===).
     * @param {Object} objA - The first object.
     * @param {Object} objB - The second object.
     * @returns {boolean} True if the objects are shallowly equal, false otherwise.
     */
    static shallowCompare(objA, objB) {
        if (objA === objB) {
            return true; // Same reference
        }

        if (!objA || !objB || typeof objA !== 'object' || typeof objB !== 'object') {
            return false; // One or both are not objects or are null
        }

        const keysA = Object.keys(objA);
        const keysB = Object.keys(objB);

        if (keysA.length !== keysB.length) {
            return false; // Different number of keys
        }

        for (const key of keysA) {
            if (!Object.prototype.hasOwnProperty.call(objB, key) || objA[key] !== objB[key]) {
                return false; // Key missing in B or values are different
            }
        }

        return true;
    }
}
