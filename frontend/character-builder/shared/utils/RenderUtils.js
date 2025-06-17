// frontend/character-builder/shared/utils/RenderUtils.js
export class RenderUtils {
    // Render a standard card with consistent styling
    static renderCard(data, options = {}) {
        const {
            title,
            cost,
            description,
            status, // e.g., 'purchased', 'unaffordable', 'available', or custom
            clickable = false,
            disabled = false,
            selected = false, // Added default value
            dataAttributes = {},
            additionalContent = ''
        } = data;

        const {
            cardClass = '', // Modifier class like 'flaw-card', 'archetype-card'
            showCost = true,
            showStatus = true,
            titleTag = 'h5' // Allow customizing title tag, e.g. h4, h5
        } = options;

        const dataAttrs = Object.entries(dataAttributes)
            .map(([key, value]) => `data-${key}="${value}"`)
            .join(' ');

        const baseCardClass = 'card';
        const statusClass = status ? `status-${status}` : '';

        // THE FIX IS HERE: The 'selected' class is now added conditionally.
        const classes = [
            baseCardClass,
            cardClass,
            clickable && !disabled ? 'clickable' : '',
            disabled ? 'disabled' : '',
            selected ? 'selected' : '', // <-- THIS LINE WAS MISSING
            statusClass
        ].filter(Boolean).join(' ');

        let costHtml = '';
        if (showCost && cost !== undefined) {
            let costBadgeClass = '';
            if (status === 'unaffordable') costBadgeClass = 'unaffordable';
            else if (cost === 0) costBadgeClass = 'free';
            costHtml = `<span class="card-cost ${costBadgeClass}">${cost > 0 ? cost + 'p' : 'Free'}</span>`;
        }
        
        let statusIndicatorHtml = '';
        if (showStatus && status) {
            statusIndicatorHtml = this.renderStatusIndicator(status, this.getStatusText(status), { absolutePosition: false });
        }


        return `
            <div class="${classes}" ${dataAttrs}>
                ${title || costHtml ? `
                    <div class="card-header">
                        ${title ? `<${titleTag} class="card-title">${title}</${titleTag}>` : ''}
                        ${costHtml}
                    </div>
                ` : ''}
                ${description ? `<div class="card-description">${description}</div>` : ''}
                ${additionalContent}
                ${statusIndicatorHtml}
            </div>
        `;
    }

    // Render a grid of items
    static renderGrid(items, renderItem, options = {}) {
        const {
            gridContainerClass = 'grid-layout', // Base class for grid display
            gridSpecificClass = '', // For specific column configurations e.g., grid-columns-auto-fit-250
            emptyMessage = 'No items available'
        } = options;

        if (!items || items.length === 0) {
            return `<div class="empty-state">${emptyMessage}</div>`;
        }

        const fullGridClass = [gridContainerClass, gridSpecificClass].filter(Boolean).join(' ');

        return `
            <div class="${fullGridClass}">
                ${items.map(renderItem).join('')}
            </div>
        `;
    }

    // Render a standard button (uses data-action attributes only, no inline handlers)
    static renderButton(config) {
        const {
            text,
            type = 'button',
            variant = 'primary', // e.g., primary, secondary, danger
            size = '', // e.g., 'small'
            disabled = false,
            dataAttributes = {},
            classes = [], // Additional custom classes
            title = '' // For tooltip
        } = config;

        const dataAttrs = Object.entries(dataAttributes)
            .map(([key, value]) => `data-${key}="${value}"`)
            .join(' ');

        const buttonClasses = [
            'btn', // Base button class
            `btn-${variant}`,
            size ? `btn-${size}` : '',
            ...classes,
            disabled ? 'disabled' : ''
        ].filter(Boolean).join(' ');

        return `
            <button type="${type}"
                    class="${buttonClasses}"
                    ${disabled ? 'disabled' : ''}
                    ${title ? `title="${title}"` : ''}
                    ${dataAttrs}>
                ${text}
            </button>
        `;
    }

    // Render status indicator (replaces status-badge)
    static renderStatusIndicator(statusType, text, options = {}) {
        const { absolutePosition = true, additionalClasses = [] } = options;
        
        const indicatorClasses = [
            'status-indicator',
            `status-indicator-${statusType}`, // e.g., status-indicator-success, status-indicator-error
            absolutePosition ? 'absolute-badge' : '', // Optional class for positioning
            ...additionalClasses
        ].filter(Boolean).join(' ');

        return `<div class="${indicatorClasses}">${text || this.getStatusText(statusType)}</div>`;
    }


    // Render point display
    static renderPointDisplay(current, max, label, options = {}) {
        const {
            showRemaining = true,
            showPercentage = false,
            variant = 'default' // e.g., 'error', 'warning', 'compact' for specific styling
        } = options;

        const remaining = max - current;
        const percentage = max > 0 ? ((current / max) * 100).toFixed(1) : 0;

        let statusClass = variant; // Use variant for main class
        if (variant === 'default') { // Apply specific status only if default
            if (remaining < 0) statusClass = 'over-budget';
            else if (remaining === 0 && current > 0) statusClass = 'fully-used'; // only if some points were spent
        }


        return `
            <div class="point-display ${statusClass}">
                <div class="point-label">${label}</div>
                <div class="point-values">
                    <span class="current">${current}</span>
                    <span class="separator">/</span>
                    <span class="max">${max}</span>
                    ${showRemaining ? `<span class="remaining">(${remaining >= 0 ? remaining : 'OVER ' + Math.abs(remaining)})</span>` : ''}
                    ${showPercentage ? `<span class="percentage">${percentage}%</span>` : ''}
                </div>
            </div>
        `;
    }

    // Render form group
    static renderFormGroup(config) {
        const {
            label,
            inputId, // Added for linking label to input
            inputHtml, // Changed from 'input' to avoid clash, expects full input HTML string
            description,
            error,
            required = false,
            formGroupClass = ''
        } = config;

        return `
            <div class="form-group ${error ? 'has-error' : ''} ${formGroupClass}">
                ${label ? `<label class="form-label ${required ? 'required' : ''}" ${inputId ? `for="${inputId}"` : ''}>${label}</label>` : ''}
                ${inputHtml}
                ${description ? `<small class="form-description">${description}</small>` : ''}
                ${error ? `<div class="form-error">${error}</div>` : ''}
            </div>
        `;
    }

    // Render select dropdown
    static renderSelect(config) {
        const {
            id,
            name, // Added for forms
            value = '',
            options = [], // Expected: [{value: 'val', label: 'Label', disabled: false}]
            placeholder = 'Select...',
            dataAttributes = {},
            classes = [],
            disabled = false
        } = config;

        const dataAttrs = Object.entries(dataAttributes)
            .map(([key, val]) => `data-${key}="${val}"`)
            .join(' ');

        const selectClasses = ['form-select', ...classes].filter(Boolean).join(' '); // form-select might be part of general input styling

        return `
            <select id="${id}" name="${name || id}" class="${selectClasses}" ${disabled ? 'disabled' : ''} ${dataAttrs}>
                ${placeholder ? `<option value="">${placeholder}</option>` : ''}
                ${options.map(opt => `
                    <option value="${opt.value}" ${opt.value === value ? 'selected' : ''} ${opt.disabled ? 'disabled' : ''}>
                        ${opt.label}
                    </option>
                `).join('')}
            </select>
        `;
    }

    static getStatusText(status) {
        const statusTexts = {
            success: 'Available',
            error: 'Unavailable',
            warning: 'Warning',
            info: 'Info',
            purchased: 'Owned',
            unaffordable: "Can't Afford",
            available: 'Purchase' // Default for clickable available items
        };
        return statusTexts[status.toLowerCase()] || status;
    }

    // Render purchased item list
    static renderPurchasedList(items, renderItemFn, options = {}) {
        const {
            title = 'Purchased Items',
            listContainerClass = 'purchased-list',
            emptyMessage = 'No items purchased',
            showCount = true,
            itemWrapperClass = '' // Class for each item's wrapper if needed
        } = options;

        const count = items ? items.length : 0;

        return `
            <div class="purchased-section">
                <h4>${title} ${showCount ? `(${count})` : ''}</h4>
                ${count > 0 ? `
                    <div class="${listContainerClass}">
                        ${items.map((item, index) => 
                            itemWrapperClass ? `<div class="${itemWrapperClass}">${renderItemFn(item, index)}</div>` : renderItemFn(item, index)
                        ).join('')}
                    </div>
                ` : `<div class="empty-state">${emptyMessage}</div>`}
            </div>
        `;
    }

    // Render tabs navigation (generic)
    static renderTabs(tabsConfig, activeTabId, options = {}) {
        const { navClass = 'tab-navigation', tabButtonClass = 'tab-btn' } = options;
        return `
            <div class="${navClass}">
                ${tabsConfig.map(tab => `
                    <button class="${tabButtonClass} ${activeTabId === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}"
                            data-tab="${tab.id}"
                            ${tab.disabled ? 'disabled' : ''}>
                        ${tab.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    // Render an info icon with tooltip
    static renderInfoIcon(text, options = {}) {
        const {
            iconClass = 'info-icon',
            tooltipClass = 'tooltip-content',
            size = 'small'
        } = options;

        return `
            <span class="tooltip-wrapper">
                <i class="${iconClass} ${iconClass}--${size}" data-tooltip="${this.escapeHtml(text)}">ℹ</i>
                <div class="${tooltipClass}">${text}</div>
            </span>
        `;
    }

    // Escape HTML for safe attribute values
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/"/g, '"');
    }

    // Get tooltip text for common concepts
    static getTooltipText(concept) {
        const tooltips = {
            'archetypes': 'Archetypes define your character\'s fundamental approach and provide point modifiers and restrictions. Select one from each of the 7 categories.',
            'attributes': 'Attributes represent what type of things your character is good at in combat and utility situations.',
            'focus': 'Your character\'s precision, fighting skill, and mental fortitude. Adds to your Accuracy Checks, Initiative Checks, and Resolve Score.',
            'power': 'Your character\'s strength both physically and/or with their powers. Adds to your Damage Rolls, Condition Checks, Capacity Score, and Stability Score.',
            'mobility': 'Your character\'s speed and reflexes. Adds to your Movement Speed, Initiative, and Avoidance Score.',
            'endurance': 'Your character\'s physical toughness and fortitude. Adds to your Survival Checks, Vitality Score, and Durability Score.',
            'awareness': 'Your character\'s ability to notice things in the world. Also adds to your Initiative. Awareness players will have an easier time picking up on things already set in the narrative.',
            'communication': 'Your character\'s social skills. Communication players are able to better shape the narrative to their goals such as persuading a truce between two warring factions.',
            'intelligence': 'Your character\'s knowledge and reasoning. Intelligence players are able to unlock paths previously inaccessible such as hacking into a database.'
        };
        return tooltips[concept.toLowerCase()] || '';
    }
}