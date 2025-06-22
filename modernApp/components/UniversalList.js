// file: modernApp/components/UniversalList.js
import { UniversalCard } from './UniversalCard.js';
import { EntityLoader } from '../core/EntityLoader.js';

export class UniversalList {

    /**
     * Renders a filterable and searchable list of entities.
     * @param {Object} options
     * @param {string} options.id - A unique ID for the list container.
     * @param {Array<Object>} options.items - The array of entity objects to display.
     * @param {Object} [options.cardContext={}] - The context to pass to UniversalCard.render.
     * @param {boolean} [options.showSearch=true] - Whether to show the search bar.
     * @param {Array<Object>} [options.filters=[]] - An array of filter definitions.
     * @returns {string} - The HTML string for the list component.
     */
    static render({ id, items, cardContext = {}, showSearch = true, filters = [] }) {
        return `
            <div id="${id}" class="universal-list-container">
                <div class="list-controls">
                    ${showSearch ? this.renderSearch() : ''}
                    <div class="list-filters">
                        ${filters.map(filter => this.renderFilter(filter)).join('')}
                    </div>
                </div>
                <div class="entity-grid list-items">
                    ${items.map(item => UniversalCard.render(item, cardContext)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Renders the search input.
     * @returns {string}
     */
    static renderSearch() {
        return `
            <div class="list-search">
                <input type="search" class="form-input" placeholder="Search..." data-action="search-list">
            </div>
        `;
    }
    
    /**
     * Renders a single filter dropdown.
     * @param {Object} filter - The filter definition.
     * @returns {string}
     */
    static renderFilter(filter) {
        return `
            <div class="list-filter-group">
                <label for="filter-${filter.id}" class="form-label sr-only">${filter.label}</label>
                <select id="filter-${filter.id}" class="form-select" data-action="filter-list" data-filter-key="${filter.key}">
                    <option value="">${filter.label}</option>
                    ${filter.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
                </select>
            </div>
        `;
    }

    /**
     * Attaches event listeners to handle searching and filtering.
     * @param {string} id - The ID of the list container.
     * @param {function} onUpdate - Callback function executed when the list is filtered or searched. 
     *                              It receives an object with the current search term and active filters.
     */
    static setup(id, onUpdate) {
        const container = document.getElementById(id);
        if (!container) return;

        container.addEventListener('input', (e) => {
            if (e.target.matches('[data-action="search-list"]')) {
                this.triggerUpdate(container, onUpdate);
            }
        });
        
        container.addEventListener('change', (e) => {
            if (e.target.matches('[data-action="filter-list"]')) {
                this.triggerUpdate(container, onUpdate);
            }
        });
    }

    /**
     * Gathers current filter/search values and calls the update callback.
     * @param {HTMLElement} container - The list container element.
     * @param {function} onUpdate - The update callback.
     */
    static triggerUpdate(container, onUpdate) {
        const searchInput = container.querySelector('[data-action="search-list"]');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        const activeFilters = {};
        container.querySelectorAll('[data-action="filter-list"]').forEach(select => {
            if (select.value) {
                activeFilters[select.dataset.filterKey] = select.value;
            }
        });

        onUpdate({ searchTerm, activeFilters });
    }
}

// Add some basic styles for the new list controls to modern-app.css
const listStyles = `
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}

.list-controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
}

.list-search {
    flex-grow: 1;
}

.list-filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
}
`;

const styleEl = document.createElement('style');
styleEl.textContent = listStyles;
document.head.appendChild(styleEl);