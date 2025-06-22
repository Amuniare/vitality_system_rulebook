// modernApp/tabs/ArchetypeTab.js
// PurchaseCard is not directly used here for archetypes as they are selections, not typical purchases.
import { Logger } from '../utils/Logger.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { EventBus } from '../core/EventBus.js';
import { Formatters } from '../utils/Formatters.js'; // For display

export class ArchetypeTab {
    constructor(container, stateManager) { // StateManager passed for direct access if needed
        this.container = container;
        this.stateManager = stateManager; // Storing StateManager instance
        
        this.selectedArchetypes = {}; // Local cache of character's selected archetypes
        this.eventBusListener = null; // To store the listener for later removal if needed
    }

    async init() {
        // Data is globally loaded by EntityLoader.init() in app.js.
        // Subscribe to character updates.
        this.eventBusListener = (characterData) => {
            // Only re-render if this tab is visible or if archetype data changed.
            const currentCharacterArchetypes = JSON.stringify(characterData.archetypes || {});
            const cachedArchetypes = JSON.stringify(this.selectedArchetypes || {});

            if (this.container.querySelector('.archetype-tab') && currentCharacterArchetypes !== cachedArchetypes) {
                Logger.debug('[ArchetypeTab] Character archetypes changed, re-rendering.');
                this.selectedArchetypes = { ...(characterData.archetypes || {}) };
                this.render(); // Re-render the tab content
            }
        };
        EventBus.on('character-updated', this.eventBusListener);
        
        // Initialize local cache with current character state
        const character = this.stateManager.getCharacter();
        this.selectedArchetypes = { ...(character.archetypes || {}) };

        Logger.info('[ArchetypeTab] Initialized.');
    }

    render() {
        const character = this.stateManager.getCharacter();
        this.selectedArchetypes = { ...(character.archetypes || {}) }; // Ensure local cache is up-to-date

        // Define the categories for archetypes as per your game rules
        // The `type` field in your archetype entities should distinguish them.
        // The `ui.category` field in your archetype entities defines which dropdown they belong to.
        const archetypeCategoriesConfig = [
            { key: 'movement', name: 'Movement Archetype', type: 'archetype' },
            { key: 'attackType', name: 'Attack Type Archetype', type: 'archetype' },
            { key: 'effectType', name: 'Effect Type Archetype', type: 'archetype' },
            { key: 'uniqueAbility', name: 'Unique Ability Focus', type: 'archetype' }, // Matches ui.category in data
            { key: 'defensive', name: 'Defensive Method', type: 'archetype' }, // Matches ui.category in data
            { key: 'specialAttack', name: 'Special Attack Method', type: 'archetype' }, // Matches ui.category
            { key: 'utility', name: 'Utility Method', type: 'archetype' } // Matches ui.category
        ];

        this.container.innerHTML = `
            <div class="tab-content archetype-tab">
                <div class="archetype-header section-header"> <!-- Using section-header for consistent styling -->
                    <h2>Archetype Selection</h2>
                    <p>Select one archetype from each category. Archetypes define your character's core capabilities, statistical bonuses, and how some systems (like Special Attacks) function.</p>
                </div>
                
                <div class="archetype-categories-grid">
                    ${archetypeCategoriesConfig.map(catConfig => 
                        this.renderArchetypeCategorySelector(catConfig.key, catConfig.name, catConfig.type)
                    ).join('')}
                </div>

                <div id="archetype-details-section" class="archetype-details-section section-content">
                    ${this.renderSelectedArchetypeDetails()}
                </div>
            </div>
        `;
        this.setupEventListeners(); // Re-attach listeners after DOM update
        Logger.debug('[ArchetypeTab] Rendered.');
    }

    renderArchetypeCategorySelector(categoryKey, categoryName, entityType) {
        // Get all entities of type 'archetype', then filter by their 'ui.category'
        const archetypesForCategory = EntityLoader.getEntitiesByType(entityType)
            .filter(arch => arch.ui?.category === categoryKey);
            
        const currentSelectionId = this.selectedArchetypes[categoryKey];

        if (!archetypesForCategory || archetypesForCategory.length === 0) {
            return `
                <div class="archetype-category-selector form-group">
                    <h4>${categoryName}</h4>
                    <p class="text-muted">No archetypes defined for this category (key: ${categoryKey}, type: ${entityType}).</p>
                </div>`;
        }
        
        return `
            <div class="archetype-category-selector form-group">
                <label for="archetype-select-${categoryKey}" class="form-label">${categoryName}:</label>
                <select id="archetype-select-${categoryKey}" class="archetype-dropdown form-select" data-category-key="${categoryKey}">
                    <option value="">-- Select --</option>
                    ${archetypesForCategory.map(arch => `
                        <option value="${arch.id}" ${currentSelectionId === arch.id ? 'selected' : ''}>
                            ${arch.name}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    renderSelectedArchetypeDetails() {
        let detailsHtml = '<h4>Selected Archetype Details:</h4><div class="details-grid purchase-grid">'; // Use purchase-grid for card layout
        let hasSelection = false;

        for (const categoryKey in this.selectedArchetypes) {
            const archetypeId = this.selectedArchetypes[categoryKey];
            if (archetypeId) {
                const archetype = EntityLoader.getEntity(archetypeId);
                if (archetype) {
                    hasSelection = true;
                    // Using a simplified card structure for now. Could use UniversalCard if context is built.
                    detailsHtml += `
                        <div class="purchase-card archetype-detail-card"> <!-- Mimic purchase-card styling -->
                            <div class="card-header">
                                <h4>${Formatters.camelToTitle(categoryKey)}: ${archetype.name}</h4>
                                <span class="cost">${archetype.cost?.display || 'N/A'}</span>
                            </div>
                            <p class="card-description">${archetype.description || 'No description available.'}</p>
                            ${archetype.effects && archetype.effects.length > 0 ? `
                                <div class="card-effects">
                                    <strong>Effects:</strong>
                                    <ul>${archetype.effects.map(eff => `<li>${eff.display || eff.type}</li>`).join('')}</ul>
                                </div>
                            ` : ''}
                             ${archetype.requirements && archetype.requirements.length > 0 ? `
                                <div class="card-requirements">
                                    <strong>Requirements/Rules:</strong>
                                    <ul>${archetype.requirements.map(req => `<li>${req.display || req.value}</li>`).join('')}</ul>
                                </div>
                            ` : ''}
                            ${archetype.pointSystem ? `
                                <div class="card-effects"> <!-- Reusing class for styling -->
                                    <strong>Point System:</strong>
                                    <p>Method: ${archetype.pointSystem.method}</p>
                                    ${archetype.pointSystem.multiplier ? `<p>Multiplier: ${archetype.pointSystem.multiplier}</p>` : ''}
                                    ${archetype.pointSystem.value ? `<p>Value: ${archetype.pointSystem.value}</p>` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }
            }
        }
        if (!hasSelection) {
            detailsHtml += '<p class="text-muted">Select archetypes from the dropdowns above to see their details.</p>';
        }
        detailsHtml += '</div>';
        return detailsHtml;
    }
    
    setupEventListeners() {
        this.container.querySelectorAll('.archetype-dropdown').forEach(dropdown => {
            // Simple way to avoid duplicate listeners if render is called often:
            // Store the handler, or use a flag. For now, direct re-attachment.
            // A more robust way is to have one persistent listener on the container (event delegation).
            const categoryKey = dropdown.dataset.categoryKey;
            if (!dropdown.hasAttribute('data-listener-attached')) {
                dropdown.addEventListener('change', (e) => {
                    this.handleArchetypeChange(categoryKey, e.target.value);
                });
                dropdown.setAttribute('data-listener-attached', 'true');
            }
        });
        Logger.debug('[ArchetypeTab] Event listeners set up for dropdowns.');
    }

    handleArchetypeChange(category, archetypeId) {
        Logger.info(`[ArchetypeTab] Archetype selection changed: Category - ${category}, ID - ${archetypeId}`);
        this.stateManager.dispatch('UPDATE_ARCHETYPES', { category, archetypeId: archetypeId || null });
        // The EventBus 'character-updated' listener in init() will handle re-rendering.
    }

    destroy() {
        if (this.eventBusListener) {
            EventBus.off('character-updated', this.eventBusListener);
            this.eventBusListener = null;
            Logger.info('[ArchetypeTab] Unsubscribed from character-updated event.');
        }
    }
}