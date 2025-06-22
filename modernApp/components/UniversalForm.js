// file: modernApp/components/UniversalForm.js
// Note: Logger would be beneficial here too if more complex logic is added.
// import { Logger } from '../utils/Logger.js'; 

export class UniversalForm {
    /**
     * Renders a complete form based on a schema.
     * @param {Object} options - The configuration for the form.
     * @param {string} options.id - A unique ID for the form element.
     * @param {Array<Object>} options.schema - An array of field definitions.
     * @param {Object} [options.initialData={}] - Initial data to populate the form fields.
     * @param {string} options.submitText - The text for the submit button.
     * @returns {string} - The HTML string for the form.
     */
    static render({ id, schema, initialData = {}, submitText = 'Submit' }) {
        return `
            <form id="${id}" class="universal-form" novalidate>
                ${schema.map(field => this.renderField(field, initialData[field.id])).join('')}
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">${submitText}</button>
                </div>
            </form>
        `;
    }

    /**
     * Renders a single form field based on its schema definition.
     * @param {Object} field - The schema for the field.
     * @param {*} [value] - The initial value for the field.
     * @returns {string} - The HTML string for the form field.
     */
    static renderField(field, value) {
        const fieldValue = value ?? field.default ?? '';
        const required = field.required ? 'required aria-required="true"' : ''; // Added aria-required
        const describedBy = `error-${field.id}`; // For ARIA

        const fieldHtml = (() => {
            switch (field.type) {
                case 'text':
                case 'number':
                case 'email':
                case 'password':
                    return `<input type="${field.type}" id="${field.id}" name="${field.id}" class="form-input" value="${fieldValue}" placeholder="${field.placeholder || ''}" ${required} aria-describedby="${describedBy}">`;
                
                case 'textarea':
                    return `<textarea id="${field.id}" name="${field.id}" class="form-textarea" placeholder="${field.placeholder || ''}" ${required} aria-describedby="${describedBy}">${fieldValue}</textarea>`;

                case 'select':
                    return `
                        <select id="${field.id}" name="${field.id}" class="form-select" ${required} aria-describedby="${describedBy}">
                            ${field.options.map(opt => `<option value="${opt.value}" ${opt.value === fieldValue ? 'selected' : ''}>${opt.label}</option>`).join('')}
                        </select>
                    `;
                
                case 'checkbox':
                    // Label wraps input for better accessibility with checkboxes
                    return `
                        <label class="form-checkbox-label">
                            <input type="checkbox" id="${field.id}" name="${field.id}" class="form-checkbox" ${fieldValue ? 'checked' : ''} ${required} aria-describedby="${describedBy}">
                            ${field.label} 
                        </label>
                    `;
                     // Note: The main label for the group is handled outside for checkboxes usually

                default:
                    return `<input type="text" id="${field.id}" name="${field.id}" class="form-input" value="${fieldValue}" placeholder="Unsupported field type: ${field.type}" disabled aria-describedby="${describedBy}">`;
            }
        })();

        // For checkboxes, the label is part of the input group.
        // For other types, we provide a separate label.
        if (field.type === 'checkbox') {
            // The field.label is already part of the checkbox's label element.
            // A surrounding .form-group might still be useful for consistent spacing and error message placement.
            return `<div class="form-group form-group-checkbox">${fieldHtml}<div class="form-error-message" id="${describedBy}"></div></div>`;
        }

        return `
            <div class="form-group">
                <label for="${field.id}" class="form-label">${field.label}${field.required ? ' <span aria-hidden="true">*</span>' : ''}</label>
                ${fieldHtml}
                <div class="form-error-message" id="${describedBy}"></div>
            </div>
        `;
    }

    /**
     * Attaches event listeners and retrieves form data on submit.
     * @param {string} formId - The ID of the form to attach to.
     * @param {function} onSubmit - The callback function to execute on successful submission. It receives the form data as an object.
     * @param {function} [onValidate] - Optional callback for real-time validation on field change. Receives field name and value.
     */
    static handleSubmit(formId, onSubmit, onValidate) {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`[UniversalForm] Form with id "${formId}" not found.`);
            return;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {};

            for (let [key, value] of formData.entries()) {
                const fieldElement = form.elements[key];
                if (fieldElement.type === 'checkbox') {
                    data[key] = fieldElement.checked;
                } else if (fieldElement.type === 'number') {
                    data[key] = parseFloat(value);
                } 
                else {
                    data[key] = value;
                }
            }
            
            // Ensure unchecked checkboxes are explicitly false
            form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                if (!data.hasOwnProperty(cb.name)) { // If not in formData (meaning it was unchecked)
                    data[cb.name] = false;
                }
            });
            
            onSubmit(data);
        });

        if (typeof onValidate === 'function') {
            form.addEventListener('input', (e) => {
                const target = e.target;
                if (target.name) {
                    const value = target.type === 'checkbox' ? target.checked : target.value;
                    onValidate(target.name, value, target); // Pass target for direct DOM manipulation if needed
                }
            });
        }
    }
}

// REMOVED formStyles constant and the style injection logic.