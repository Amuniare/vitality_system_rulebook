// file: modernApp/components/UniversalList.js
import { UniversalCard } from './UniversalCard.js';
// EntityLoader might not be needed here if items are always passed in.
// import { EntityLoader } from '../core/EntityLoader.js';
import { Logger } from '../utils/Logger.js';


export class UniversalList {

    /**
     * Renders a filterable and searchable list of entities.
     * @param {Object} options
     * @param {string} options.id - A unique ID for the list container.
     * @param {Array<Object>} options.items - The array of entity objects to display.
     * @param {Object} [options.cardContext={}] - The context to pass to UniversalCard.render.
     * @param {string} [options.entityType='unknown'] - The type of entities in the list, used for card rendering context.
     * @param {boolean} [options.showSearch=true] - Whether to show the search bar.
     * @param {Array<Object>} [options.filters=[]] - An array of filter definitions.
     * @returns {string} - The HTML string for the list component.
     */
    static render({ id, items, cardContext = {}, entityType = 'unknown', showSearch = true, filters = [] }) {
        const cardsHtml = items.map(item => {
            // Construct a basic context if not fully provided, ensuring entityType is passed
            const individualCardContext = {
                entityType: entityType, // Ensure entityType is part of the context
                isPurchased: cardContext.isPurchased !== undefined ? cardContext.isPurchased(item.id) : false,
                isAffordable: cardContext.isAffordable !== undefined ? cardContext.isAffordable(item.id) : true,
                areRequirementsMet: cardContext.areRequirementsMet !== undefined ? cardContext.areRequirementsMet(item.id) : true,
                unmetRequirements: cardContext.unmetRequirements !== undefined ? cardContext.unmetRequirements(item.id) : [],
                ...cardContext // Allow overriding with more specific context
            };
            return UniversalCard.render(item, individualCardContext);
        }).join('');
        
        return `
            <div id="${id}" class="universal-list-container">
                <div class="list-controls">
                    ${showSearch ? this.renderSearch(id) : ''}
                    <div class="list-filters">
                        ${filters.map(filter => this.renderFilter(filter, id)).join('')}
                    </div>
                </div>
                <div class="entity-grid list-items">
                    ${cardsHtml || '<p class="no-items">No items match your criteria.</p>'}
                </div>
            </div>
        `;
    }

    /**
     * Renders the search input.
     * @param {string} listId - The ID of the parent list for unique search input ID.
     * @returns {string}
     */
    static renderSearch(listId) {
        return `
            <div class="list-search">
                <label for="search-${listId}" class="sr-only">Search list</label>
                <input type="search" id="search-${listId}" class="form-input" placeholder="Search..." data-action="search-list">
            </div>
        `;
    }
    
    /**
     * Renders a single filter dropdown.
     * @param {Object} filter - The filter definition.
     * @param {string} listId - The ID of the parent list for unique filter ID.
     * @returns {string}
     */
    static renderFilter(filter, listId) {
        const filterId = `filter-${listId}-${filter.key || filter.id}`;
        return `
            <div class="list-filter-group">
                <label for="${filterId}" class="form-label sr-only">${filter.label}</label>
                <select id="${filterId}" class="form-select" data-action="filter-list" data-filter-key="${filter.key || filter.id}">
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
        if (!container) {
            Logger.warn(`[UniversalList] Container with id "${id}" not found for event setup.`);
            return;
        }

        // Using a single delegated event listener for efficiency
        if (container._universalListListener) {
            container.removeEventListener('input', container._universalListListener);
            container.removeEventListener('change', container._universalListListener);
        }

        container._universalListListener = (e) => {
            if (e.target.matches('[data-action="search-list"]') && e.type === 'input') {
                this.triggerUpdate(container, onUpdate);
            } else if (e.target.matches('[data-action="filter-list"]') && e.type === 'change') {
                this.triggerUpdate(container, onUpdate);
            }
        };
        
        container.addEventListener('input', container._universalListListener);
        container.addEventListener('change', container._universalListListener);
        Logger.debug(`[UniversalList] Event listeners set up for list "${id}".`);
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
            if (select.value) { // Only include if a filter option is selected
                activeFilters[select.dataset.filterKey] = select.value;
            }
        });

        if (typeof onUpdate === 'function') {
            onUpdate({ searchTerm, activeFilters });
        } else {
            Logger.warn('[UniversalList] onUpdate callback is not a function.');
        }
    }
}

// REMOVED listStyles constant and the style injection logic.