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
        this.contentEl = null; // Added for clarity
        this.iconEl = null;    // Added for clarity

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
        this.contentEl.style.display = 'block'; // Or any other display type like 'flex', 'grid' if needed
        if (this.iconEl) this.iconEl.textContent = '−'; // Check if iconEl exists
        Logger.debug(`[CollapsibleSection] Section "${this.title}" opened.`);
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.sectionEl.classList.remove('open');
        this.contentEl.style.display = 'none';
        if (this.iconEl) this.iconEl.textContent = '+'; // Check if iconEl exists
        Logger.debug(`[CollapsibleSection] Section "${this.title}" closed.`);
    }
    
    // REMOVED static injectStyles() method and the call to it.
}

// REMOVED CollapsibleSection.injectStyles();