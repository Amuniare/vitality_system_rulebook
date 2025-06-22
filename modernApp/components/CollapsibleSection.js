
// modernApp/components/CollapsibleSection.js
import { Logger } from '../utils/Logger.js';

/**
 * A reusable component for creating a collapsible content section.
 */
export class CollapsibleSection {
    /**
     * @param {HTMLElement} container - The parent element to append this section to.
     * @param {Object} options - Configuration for the section.
     * @param {string} options.id - A unique ID for this section.
     * @param {string} options.title - The title to display in the header.
     * @param {string|Function} options.content - The HTML content or a function that returns HTML content.
     * @param {boolean} [options.isOpen=false] - Whether the section should be open initially.
     */
    constructor(container, { id, title, content, isOpen = false }) {
        this.container = container;
        this.id = id;
        this.title = title;
        this.content = content;
        this.isOpen = isOpen;
        this.sectionEl = null;

        this.render();
        Logger.info(`[CollapsibleSection] Section "${this.title}" initialized.`);
    }

    render() {
        const section = document.createElement('div');
        section.className = `collapsible-section ${this.isOpen ? 'open' : ''}`;
        section.id = this.id;

        const contentHtml = typeof this.content === 'function' ? this.content() : this.content;

        section.innerHTML = `
            <div class="collapsible-header" data-action="toggle-collapse">
                <h3 class="collapsible-title">${this.title}</h3>
                <span class="collapsible-toggle-icon">${this.isOpen ? '−' : '+'}</span>
            </div>
            <div class="collapsible-content">
                ${contentHtml}
            </div>
        `;

        this.container.appendChild(section);
        this.sectionEl = section;
        this.contentEl = this.sectionEl.querySelector('.collapsible-content');
        this.iconEl = this.sectionEl.querySelector('.collapsible-toggle-icon');

        if (!this.isOpen) {
            this.contentEl.style.display = 'none';
        }

        this.attachEventListeners();
    }

    attachEventListeners() {
        const header = this.sectionEl.querySelector('.collapsible-header');
        header.addEventListener('click', () => this.toggle());
        Logger.debug(`[CollapsibleSection] Event listener attached for "${this.title}".`);
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.sectionEl.classList.add('open');
        this.contentEl.style.display = 'block';
        this.iconEl.textContent = '−';
        Logger.debug(`[CollapsibleSection] Section "${this.title}" opened.`);
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.sectionEl.classList.remove('open');
        this.contentEl.style.display = 'none';
        this.iconEl.textContent = '+';
        Logger.debug(`[CollapsibleSection] Section "${this.title}" closed.`);
    }
    
    // Static method to inject necessary CSS for this component to work.
    static injectStyles() {
        const styleId = 'collapsible-section-styles';
        if (document.getElementById(styleId)) return;

        const styles = `
            .collapsible-section {
                border: 1px solid var(--color-border-primary);
                border-radius: var(--radius-md);
                margin-bottom: var(--spacing-md);
                background-color: var(--color-bg-secondary);
                overflow: hidden;
            }
            .collapsible-header {
                padding: var(--spacing-md) var(--spacing-lg);
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                user-select: none;
                transition: background-color var(--transition-fast);
            }
            .collapsible-header:hover {
                background-color: var(--color-bg-hover);
            }
            .collapsible-title {
                margin: 0;
                font-size: var(--font-size-lg);
                color: var(--color-accent-primary);
            }
            .collapsible-toggle-icon {
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--color-text-secondary);
            }
            .collapsible-content {
                padding: var(--spacing-lg);
                border-top: 1px solid var(--color-border-primary);
                background-color: var(--color-bg-card);
            }
        `;
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
        Logger.info('[CollapsibleSection] Injected required CSS styles.');
    }
}

// Automatically inject styles when the script is loaded.
CollapsibleSection.injectStyles();
