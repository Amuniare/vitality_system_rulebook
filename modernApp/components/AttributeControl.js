// modernApp/components/AttributeControl.js
import { Logger } from '../utils/Logger.js';

export class AttributeControl {
    /**
     * Renders an attribute control with +/- buttons
     * @param {Object} options
     * @param {string} options.attributeId - The attribute identifier
     * @param {string} options.label - Display label
     * @param {number} options.value - Current value
     * @param {number} options.min - Minimum value
     * @param {number} options.max - Maximum value
     * @param {string} options.pool - Pool type (combat/utility)
     * @param {boolean} options.disabled - Whether controls are disabled
     * @returns {string} HTML string
     */
    static render(options) {
        const {
            attributeId,
            label,
            value = 0,
            min = 0,
            max = 10,
            pool = 'combat',
            disabled = false
        } = options;
        
        const canDecrease = value > min && !disabled;
        const canIncrease = value < max && !disabled;
        
        return `
            <div class="attribute-control" data-attribute="${attributeId}" data-pool="${pool}">
                <div class="attribute-label">${label}</div>
                <div class="attribute-value-controls">
                    <button 
                        class="attribute-btn decrease-btn ${!canDecrease ? 'disabled' : ''}"
                        data-action="decrease-attribute"
                        data-attribute="${attributeId}"
                        ${!canDecrease ? 'disabled' : ''}
                        aria-label="Decrease ${label}"
                    >
                        <span class="btn-icon">−</span>
                    </button>
                    <div class="attribute-value">${value}</div>
                    <button 
                        class="attribute-btn increase-btn ${!canIncrease ? 'disabled' : ''}"
                        data-action="increase-attribute"
                        data-attribute="${attributeId}"
                        ${!canIncrease ? 'disabled' : ''}
                        aria-label="Increase ${label}"
                    >
                        <span class="btn-icon">+</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * Attaches event handlers for attribute controls
     * @param {HTMLElement} container - Container element
     * @param {Function} onChange - Callback when value changes
     */
    static attachHandlers(container, onChange) {
        container.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action^="crease-attribute"]');
            if (!button || button.disabled) return;
            
            const action = button.dataset.action;
            const attributeId = button.dataset.attribute;
            const control = button.closest('.attribute-control');
            const currentValue = parseInt(control.querySelector('.attribute-value').textContent);
            
            let newValue = currentValue;
            if (action === 'increase-attribute') {
                newValue = currentValue + 1;
            } else if (action === 'decrease-attribute') {
                newValue = currentValue - 1;
            }
            
            if (onChange) {
                onChange(attributeId, newValue, currentValue);
            }
        });
    }
}