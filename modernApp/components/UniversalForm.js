// file: modernApp/components/UniversalForm.js
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
        const required = field.required ? 'required' : '';

        const fieldHtml = (() => {
            switch (field.type) {
                case 'text':
                case 'number':
                case 'email':
                case 'password':
                    return `<input type="${field.type}" id="${field.id}" name="${field.id}" class="form-input" value="${fieldValue}" placeholder="${field.placeholder || ''}" ${required}>`;
                
                case 'textarea':
                    return `<textarea id="${field.id}" name="${field.id}" class="form-textarea" placeholder="${field.placeholder || ''}" ${required}>${fieldValue}</textarea>`;

                case 'select':
                    return `
                        <select id="${field.id}" name="${field.id}" class="form-select" ${required}>
                            ${field.options.map(opt => `<option value="${opt.value}" ${opt.value === fieldValue ? 'selected' : ''}>${opt.label}</option>`).join('')}
                        </select>
                    `;
                
                case 'checkbox':
                    return `
                        <label class="form-checkbox-label">
                            <input type="checkbox" id="${field.id}" name="${field.id}" class="form-checkbox" ${fieldValue ? 'checked' : ''}>
                            ${field.label}
                        </label>
                    `;

                default:
                    return `<input type="text" id="${field.id}" name="${field.id}" class="form-input" value="${fieldValue}" placeholder="Unsupported field type: ${field.type}" disabled>`;
            }
        })();

        // Don't render a label for checkbox, as it's part of the input group itself.
        if (field.type === 'checkbox') {
            return `<div class="form-group form-group-checkbox">${fieldHtml}</div>`;
        }

        return `
            <div class="form-group">
                <label for="${field.id}" class="form-label">${field.label}</label>
                ${fieldHtml}
                <div class="form-error-message" id="error-${field.id}"></div>
            </div>
        `;
    }

    /**
     * Attaches event listeners and retrieves form data on submit.
     * @param {string} formId - The ID of the form to attach to.
     * @param {function} onSubmit - The callback function to execute on successful submission. It receives the form data as an object.
     */
    static handleSubmit(formId, onSubmit) {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`Form with id "${formId}" not found.`);
            return;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {};

            // Convert FormData to a plain object
            for (let [key, value] of formData.entries()) {
                // Handle checkboxes, which are only present in FormData if checked
                const field = form.querySelector(`[name="${key}"]`);
                if (field.type === 'checkbox') {
                    data[key] = field.checked;
                } else {
                    data[key] = value;
                }
            }
            
            // For any unchecked checkboxes, we need to add them manually as false
            form.querySelectorAll('input[type="checkbox"]:not(:checked)').forEach(cb => {
                data[cb.name] = false;
            });
            
            onSubmit(data);
        });
    }
}

// Add some basic styles for the new form elements to modern-app.css
const formStyles = `
.universal-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.form-textarea {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-bg-tertiary);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: 1rem;
    min-height: 100px;
    resize: vertical;
}

.form-group-checkbox {
    display: flex;
    align-items: center;
}

.form-checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    cursor: pointer;
}

.form-actions {
    margin-top: var(--spacing-lg);
}
`;

// It's not ideal to inject CSS from JS, but for this exercise it's the simplest way
// without asking you to manually edit the CSS file.
const styleEl = document.createElement('style');
styleEl.textContent = formStyles;
document.head.appendChild(styleEl);