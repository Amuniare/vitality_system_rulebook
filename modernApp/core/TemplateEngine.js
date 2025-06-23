// modernApp/core/TemplateEngine.js
import { Logger } from '../utils/Logger.js';

/**
 * Simple template engine for ensuring HTML/JS consistency
 * Generates DOM structures from JavaScript definitions
 */
export class TemplateEngine {
    constructor() {
        this.templates = new Map();
        this.helpers = new Map();
        
        // Register default helpers
        this.registerHelper('if', (condition, content) => condition ? content : '');
        this.registerHelper('unless', (condition, content) => !condition ? content : '');
        this.registerHelper('each', (array, itemTemplate) => {
            return array.map(item => this.render(itemTemplate, item)).join('');
        });
    }

    /**
     * Register a template
     * @param {string} name - Template name
     * @param {Function|string} template - Template function or string
     */
    registerTemplate(name, template) {
        this.templates.set(name, template);
    }

    /**
     * Register a helper function
     */
    registerHelper(name, fn) {
        this.helpers.set(name, fn);
    }

    /**
     * Render a template with data
     * @param {string} templateName - Name of the template
     * @param {Object} data - Data to render
     * @returns {string} Rendered HTML
     */
    render(templateName, data = {}) {
        const template = this.templates.get(templateName);
        
        if (!template) {
            Logger.error(`[TemplateEngine] Template not found: ${templateName}`);
            return '';
        }

        if (typeof template === 'function') {
            return template(data, this.helpers);
        }

        // Simple string interpolation for string templates
        return this.interpolate(template, data);
    }

    /**
     * Simple string interpolation
     */
    interpolate(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : match;
        });
    }

    /**
     * Create DOM element from template
     */
    createElement(templateName, data = {}) {
        const html = this.render(templateName, data);
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        return div.firstChild;
    }
}

// Application-specific templates
export const AppTemplates = {
    // Character list item template
    characterListItem: (data) => `
        <li class="character-list-item ${data.isActive ? 'active' : ''}" 
            data-character-id="${data.id}">
            <span class="char-name">${data.name}</span>
            <span class="char-tier">T${data.tier}</span>
            <div class="char-actions">
                <button class="btn-icon btn-edit" title="Edit">
                    <i class="icon-edit">✏️</i>
                </button>
                <button class="btn-icon btn-delete btn-danger" title="Delete">
                    <i class="icon-delete">🗑️</i>
                </button>
            </div>
        </li>
    `,

    // Tab button template
    tabButton: (data) => `
        <button class="tab-btn ${data.isActive ? 'active' : ''}" 
                data-tab="${data.id}"
                ${data.disabled ? 'disabled' : ''}>
            ${data.icon ? `<i class="${data.icon}"></i>` : ''}
            ${data.label}
            ${data.badge ? `<span class="tab-badge">${data.badge}</span>` : ''}
        </button>
    `,

    // Notification template
    notification: (data) => `
        <div class="notification notification-${data.type} ${data.className || ''}"
             data-notification-id="${data.id}">
            <div class="notification-content">
                ${data.title ? `<div class="notification-title">${data.title}</div>` : ''}
                <div class="notification-message">${data.message}</div>
            </div>
            <button class="notification-close" data-notification-close="${data.id}">×</button>
        </div>
    `,

    // Purchase card template  
    purchaseCard: (data) => `
        <div class="purchase-card ${data.purchased ? 'purchased' : ''} 
                    ${data.disabled ? 'disabled' : ''}"
             data-entity-id="${data.id}"
             data-entity-type="${data.type}">
            <div class="card-header">
                <h4 class="card-title">${data.name}</h4>
                <span class="card-cost">${data.cost.display}</span>
            </div>
            <div class="card-body">
                <p class="card-description">${data.description}</p>
                ${data.requirements ? `
                    <div class="card-requirements">
                        <strong>Requires:</strong> ${data.requirements}
                    </div>
                ` : ''}
            </div>
            <div class="card-footer">
                <button class="btn btn-purchase ${data.purchased ? 'btn-remove' : ''}"
                        data-action="${data.purchased ? 'remove' : 'purchase'}">
                    ${data.purchased ? 'Remove' : 'Purchase'}
                </button>
            </div>
        </div>
    `
};