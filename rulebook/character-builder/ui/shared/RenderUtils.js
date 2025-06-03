// RenderUtils.js - Shared HTML rendering utilities
export class RenderUtils {
    // Render a standard card with consistent styling
    static renderCard(data, options = {}) {
        const {
            title,
            cost,
            description,
            status,
            clickable = false,
            disabled = false,
            dataAttributes = {},
            additionalContent = ''
        } = data;
        
        const {
            cardClass = '',
            showCost = true,
            showStatus = true
        } = options;
        
        const dataAttrs = Object.entries(dataAttributes)
            .map(([key, value]) => `data-${key}="${value}"`)
            .join(' ');
            
        const classes = [
            'card',
            cardClass,
            clickable ? 'clickable' : '',
            disabled ? 'disabled' : '',
            status ? `status-${status}` : ''
        ].filter(Boolean).join(' ');
        
        return `
            <div class="${classes}" ${dataAttrs}>
                <div class="card-header">
                    <h5 class="card-title">${title}</h5>
                    ${showCost && cost !== undefined ? `<span class="card-cost ${!cost ? 'free' : ''}">${cost > 0 ? cost + 'p' : 'Free'}</span>` : ''}
                </div>
                ${description ? `<div class="card-description">${description}</div>` : ''}
                ${additionalContent}
                ${showStatus && status ? `<div class="status-badge ${status}">${this.getStatusText(status)}</div>` : ''}
            </div>
        `;
    }
    
    // Render a grid of items
    static renderGrid(items, renderItem, options = {}) {
        const {
            gridClass = 'item-grid',
            emptyMessage = 'No items available',
            columns = 'auto-fit',
            minWidth = '250px'
        } = options;
        
        if (!items || items.length === 0) {
            return `<div class="empty-state">${emptyMessage}</div>`;
        }
        
        const gridStyle = `grid-template-columns: repeat(${columns}, minmax(${minWidth}, 1fr))`;
        
        return `
            <div class="${gridClass}" style="${gridStyle}">
                ${items.map(renderItem).join('')}
            </div>
        `;
    }
    
    // Render a standard button
    static renderButton(config) {
        const {
            text,
            type = 'button',
            variant = 'primary',
            disabled = false,
            dataAttributes = {},
            classes = [],
            onClick = ''
        } = config;
        
        const dataAttrs = Object.entries(dataAttributes)
            .map(([key, value]) => `data-${key}="${value}"`)
            .join(' ');
            
        const buttonClasses = [
            `btn-${variant}`,
            ...classes,
            disabled ? 'disabled' : ''
        ].filter(Boolean).join(' ');
        
        return `
            <button type="${type}" 
                    class="${buttonClasses}" 
                    ${disabled ? 'disabled' : ''} 
                    ${dataAttrs}
                    ${onClick ? `onclick="${onClick}"` : ''}>
                ${text}
            </button>
        `;
    }
    
    // Render status badge
    static renderStatusBadge(status, text) {
        const statusClasses = {
            success: 'success',
            error: 'error',
            warning: 'warning',
            info: 'info',
            purchased: 'success',
            unaffordable: 'error',
            available: 'success'
        };
        
        const badgeClass = statusClasses[status] || 'info';
        
        return `<div class="status-badge ${badgeClass}">${text || this.getStatusText(status)}</div>`;
    }
    
    // Render point display
    static renderPointDisplay(current, max, label, options = {}) {
        const {
            showRemaining = true,
            showPercentage = false,
            variant = 'default'
        } = options;
        
        const remaining = max - current;
        const percentage = max > 0 ? (current / max * 100).toFixed(1) : 0;
        
        let statusClass = '';
        if (remaining < 0) statusClass = 'over-budget';
        else if (remaining === 0) statusClass = 'fully-used';
        
        return `
            <div class="point-display ${statusClass} ${variant}">
                <div class="point-label">${label}</div>
                <div class="point-values">
                    <span class="current">${current}</span>
                    <span class="separator">/</span>
                    <span class="max">${max}</span>
                    ${showRemaining ? `<span class="remaining">(${remaining >= 0 ? remaining : 'OVER'} remaining)</span>` : ''}
                    ${showPercentage ? `<span class="percentage">${percentage}%</span>` : ''}
                </div>
            </div>
        `;
    }
    
    // Render form group
    static renderFormGroup(config) {
        const {
            label,
            input,
            description,
            error,
            required = false
        } = config;
        
        return `
            <div class="form-group ${error ? 'has-error' : ''}">
                ${label ? `<label class="form-label ${required ? 'required' : ''}">${label}</label>` : ''}
                ${input}
                ${description ? `<small class="form-description">${description}</small>` : ''}
                ${error ? `<div class="form-error">${error}</div>` : ''}
            </div>
        `;
    }
    
    // Render select dropdown
    static renderSelect(config) {
        const {
            id,
            value = '',
            options = [],
            placeholder = 'Select...',
            dataAttributes = {},
            classes = [],
            disabled = false
        } = config;
        
        const dataAttrs = Object.entries(dataAttributes)
            .map(([key, val]) => `data-${key}="${val}"`)
            .join(' ');
            
        const selectClasses = ['form-select', ...classes].join(' ');
        
        return `
            <select id="${id}" class="${selectClasses}" ${disabled ? 'disabled' : ''} ${dataAttrs}>
                <option value="">${placeholder}</option>
                ${options.map(opt => `
                    <option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>
                        ${opt.label}
                    </option>
                `).join('')}
            </select>
        `;
    }
    
    // Get status text for common statuses
    static getStatusText(status) {
        const statusTexts = {
            success: '✓ Available',
            error: '✗ Unavailable',
            warning: '⚠ Warning',
            info: 'ℹ Info',
            purchased: '✓ Owned',
            unaffordable: '✗ Can\'t Afford',
            available: 'Click to Purchase'
        };
        
        return statusTexts[status] || status;
    }
    
    // Render purchased item list
    static renderPurchasedList(items, renderItem, options = {}) {
        const {
            title = 'Purchased Items',
            emptyMessage = 'No items purchased',
            showCount = true
        } = options;
        
        const count = items ? items.length : 0;
        
        return `
            <div class="purchased-section">
                <h4>${title} ${showCount ? `(${count})` : ''}</h4>
                ${count > 0 ? `
                    <div class="purchased-list">
                        ${items.map(renderItem).join('')}
                    </div>
                ` : `<div class="empty-state">${emptyMessage}</div>`}
            </div>
        `;
    }
    
    // Render tabs navigation
    static renderTabs(tabs, activeTab) {
        return `
            <div class="tab-navigation">
                ${tabs.map(tab => `
                    <button class="tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}" 
                            data-tab="${tab.id}" 
                            ${tab.disabled ? 'disabled' : ''}>
                        ${tab.label}
                    </button>
                `).join('')}
            </div>
        `;
    }
}