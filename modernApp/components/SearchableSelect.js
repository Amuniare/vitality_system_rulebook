
// modernApp/components/SearchableSelect.js
import { Logger } from '../utils/Logger.js';

/**
 * A custom searchable select/dropdown component.
 * Replaces a standard <select> with a more user-friendly, searchable interface.
 */
export class SearchableSelect {
    /**
     * @param {HTMLElement} container - The DOM element to render the component into.
     * @param {Object} options - Configuration options.
     * @param {string} options.id - A unique ID for the component.
     * @param {Array<{value: string, label: string}>} options.items - The list of options to display.
     * @param {string} [options.placeholder='Select an option...'] - The placeholder text.
     * @param {function(string)} options.onSelect - Callback function executed when an option is selected. It receives the selected value.
     */
    constructor(container, { id, items, placeholder = 'Select an option...', onSelect }) {
        this.container = container;
        this.id = id;
        this.items = items;
        this.placeholder = placeholder;
        this.onSelect = onSelect;
        this.isOpen = false;
        this.componentEl = null;

        this.render();
        Logger.info(`[SearchableSelect] Component "${this.id}" initialized.`);
    }

    render() {
        this.container.innerHTML = `
            <div class="searchable-select" id="${this.id}">
                <div class="select-display" data-action="toggle">
                    <span class="selected-value">${this.placeholder}</span>
                    <span class="arrow">▼</span>
                </div>
                <div class="options-container" style="display: none;">
                    <input type="text" class="search-input" placeholder="Search...">
                    <ul class="options-list">
                        ${this.items.map(item => `<li data-value="${item.value}">${item.label}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
        this.componentEl = this.container.querySelector(`#${this.id}`);
        this.attachEventListeners();
    }

    attachEventListeners() {
        const display = this.componentEl.querySelector('.select-display');
        const searchInput = this.componentEl.querySelector('.search-input');
        const optionsList = this.componentEl.querySelector('.options-list');

        display.addEventListener('click', () => this.toggleDropdown());
        searchInput.addEventListener('input', (e) => this.filterOptions(e.target.value));
        optionsList.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                this.selectOption(e.target);
            }
        });

        // Close dropdown if clicked outside
        document.addEventListener('click', (e) => {
            if (!this.componentEl.contains(e.target)) {
                this.closeDropdown();
            }
        });
        Logger.debug(`[SearchableSelect] Event listeners attached for "${this.id}".`);
    }

    toggleDropdown() {
        this.isOpen ? this.closeDropdown() : this.openDropdown();
    }

    openDropdown() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.componentEl.classList.add('open');
        this.componentEl.querySelector('.options-container').style.display = 'block';
        this.componentEl.querySelector('.search-input').focus();
        Logger.debug(`[SearchableSelect] "${this.id}" dropdown opened.`);
    }

    closeDropdown() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.componentEl.classList.remove('open');
        this.componentEl.querySelector('.options-container').style.display = 'none';
        Logger.debug(`[SearchableSelect] "${this.id}" dropdown closed.`);
    }

    filterOptions(searchTerm) {
        const term = searchTerm.toLowerCase();
        const options = this.componentEl.querySelectorAll('.options-list li');
        options.forEach(option => {
            const label = option.textContent.toLowerCase();
            option.style.display = label.includes(term) ? '' : 'none';
        });
        Logger.debug(`[SearchableSelect] Filtering options with term: "${searchTerm}".`);
    }

    selectOption(optionElement) {
        const value = optionElement.dataset.value;
        const label = optionElement.textContent;

        this.componentEl.querySelector('.selected-value').textContent = label;
        this.closeDropdown();

        if (typeof this.onSelect === 'function') {
            this.onSelect(value);
            Logger.info(`[SearchableSelect] Option selected: { value: "${value}", label: "${label}" }`);
        }
    }

    destroy() {
        // In a more complex app with SPA navigation, you'd clean up listeners here.
        // For this app's structure, it's less critical but good practice.
        Logger.info(`[SearchableSelect] Component "${this.id}" destroyed.`);
    }
}
