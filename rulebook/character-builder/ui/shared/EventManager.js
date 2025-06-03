// EventManager.js - Standardized event handling patterns
export class EventManager {
    // Setup standard event listeners using ArchetypeTab pattern
    static setupStandardListeners(container, config) {
        const {
            clickHandlers = {},
            changeHandlers = {},
            inputHandlers = {},
            customHandlers = {}
        } = config;
        
        console.log('🔍 Setting up standard listeners, clickHandlers:', Object.keys(clickHandlers));
        
        // Click events with data attribute delegation
        Object.entries(clickHandlers).forEach(([selector, handler]) => {
            const elements = container.querySelectorAll(selector);
            console.log(`🔍 Found ${elements.length} elements for selector: ${selector}`);
            elements.forEach(element => {
                element.addEventListener('click', (e) => {
                    console.log(`🎯 Click detected on selector: ${selector}`, element);
                    try {
                        handler.call(this, e, element);
                    } catch (error) {
                        console.error(`❌ Click handler error for ${selector}:`, error);
                    }
                });
            });
        });
        

        
        // Change events (selects, checkboxes, etc.)
        Object.entries(changeHandlers).forEach(([selector, handler]) => {
            const elements = container.querySelectorAll(selector);
            elements.forEach(element => {
                element.addEventListener('change', (e) => {
                    try {
                        handler.call(this, e, element);
                    } catch (error) {
                        console.error(`❌ Change handler error for ${selector}:`, error);
                    }
                });
            });
        });
        
        // Input events (text inputs, sliders, etc.)
        Object.entries(inputHandlers).forEach(([selector, handler]) => {
            const elements = container.querySelectorAll(selector);
            elements.forEach(element => {
                element.addEventListener('input', (e) => {
                    try {
                        handler.call(this, e, element);
                    } catch (error) {
                        console.error(`❌ Input handler error for ${selector}:`, error);
                    }
                });
            });
        });
        
        // Custom event types
        Object.entries(customHandlers).forEach(([eventType, handlers]) => {
            Object.entries(handlers).forEach(([selector, handler]) => {
                const elements = container.querySelectorAll(selector);
                elements.forEach(element => {
                    element.addEventListener(eventType, (e) => {
                        try {
                            handler.call(this, e, element);
                        } catch (error) {
                            console.error(`❌ ${eventType} handler error for ${selector}:`, error);
                        }
                    });
                });
            });
        });
        
        console.log(`✅ Event listeners setup for ${container.className || 'container'}`);
    }
    
    // Event delegation for dynamic content
    static delegateEvents(container, eventMap) {
        Object.entries(eventMap).forEach(([eventType, handlers]) => {
            container.addEventListener(eventType, (e) => {
                Object.entries(handlers).forEach(([selector, handler]) => {
                    // Find the actual element that matches the selector
                    let matchingElement = null;
                    
                    if (e.target.matches(selector)) {
                        matchingElement = e.target;
                    } else {
                        matchingElement = e.target.closest(selector);
                    }
                    
                    if (matchingElement) {
                        try {
                            // Pass the matching element, not e.target
                            handler.call(this, e, matchingElement);
                        } catch (error) {
                            console.error(`❌ Delegated ${eventType} error for ${selector}:`, error);
                        }
                    }
                });
            });
        });
    }
    
    // Bind form events with validation
    static bindFormEvents(form, handlers) {
        const {
            onSubmit,
            onValidate,
            onFieldChange,
            validationRules = {}
        } = handlers;
        
        // Submit handler
        if (onSubmit) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Validate before submit
                const validation = this.validateForm(form, validationRules);
                if (validation.isValid) {
                    onSubmit.call(this, e, form, validation.data);
                } else {
                    console.warn('⚠️ Form validation failed:', validation.errors);
                    if (onValidate) {
                        onValidate.call(this, validation);
                    }
                }
            });
        }
        
        // Field change handlers
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            field.addEventListener('change', (e) => {
                if (onFieldChange) {
                    onFieldChange.call(this, e, field);
                }
                
                // Real-time validation
                if (validationRules[field.name]) {
                    this.validateField(field, validationRules[field.name]);
                }
            });
        });
    }
    
    // Form validation utility
    static validateForm(form, rules) {
        const data = new FormData(form);
        const errors = [];
        const values = {};
        
        // Convert FormData to object
        for (const [key, value] of data.entries()) {
            values[key] = value;
        }
        
        // Apply validation rules
        Object.entries(rules).forEach(([fieldName, rule]) => {
            const value = values[fieldName];
            const fieldErrors = this.validateField(form.querySelector(`[name="${fieldName}"]`), rule, value);
            if (fieldErrors.length > 0) {
                errors.push(...fieldErrors);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors,
            data: values
        };
    }
    
    // Validate individual field
    static validateField(field, rule, value) {
        const errors = [];
        const val = value || field.value;
        
        if (rule.required && (!val || val.trim() === '')) {
            errors.push(`${field.name} is required`);
        }
        
        if (rule.min && val.length < rule.min) {
            errors.push(`${field.name} must be at least ${rule.min} characters`);
        }
        
        if (rule.max && val.length > rule.max) {
            errors.push(`${field.name} must be no more than ${rule.max} characters`);
        }
        
        if (rule.pattern && !rule.pattern.test(val)) {
            errors.push(rule.message || `${field.name} format is invalid`);
        }
        
        if (rule.custom && typeof rule.custom === 'function') {
            const customResult = rule.custom(val, field);
            if (customResult !== true) {
                errors.push(customResult || `${field.name} validation failed`);
            }
        }
        
        // Update field UI
        this.updateFieldValidation(field, errors);
        
        return errors;
    }
    
    // Update field validation UI
    static updateFieldValidation(field, errors) {
        const fieldGroup = field.closest('.form-group');
        if (!fieldGroup) return;
        
        // Remove existing error state
        fieldGroup.classList.remove('has-error');
        const existingError = fieldGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error state if needed
        if (errors.length > 0) {
            fieldGroup.classList.add('has-error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = errors[0]; // Show first error
            fieldGroup.appendChild(errorDiv);
        }
    }
    
    // Remove all event listeners from container
    static clearEvents(container) {
        const newContainer = container.cloneNode(true);
        container.parentNode.replaceChild(newContainer, container);
        console.log(`🗑️ Events cleared for ${container.className || 'container'}`);
        return newContainer;
    }
    
    // Debounce utility for event handlers
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Throttle utility for event handlers
    static throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function executedFunction(...args) {
            if (!lastRan) {
                func.apply(this, args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(this, args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }
}