// modernApp/tabs/ArchetypeTab.js
import { Component } from '../core/Component.js';
import { connectToState } from '../core/StateConnector.js';
import { UniversalCard } from '../components/UniversalCard.js';
import { Logger } from '../utils/Logger.js';
import { StateManager } from '../core/StateManager.js';

/**
 * Enhanced ArchetypeTab with component-driven architecture
 * Handles archetype selection using Universal components
 */
class ArchetypeTab extends Component {
    static propSchema = {
        character: { type: 'object', default: () => ({}) },
        gameData: { type: 'object', default: () => ({}) },
        archetypes: { type: 'object', default: () => ({}) }
    };

    constructor(container, initialProps = {}) {
        super(initialProps, container);
        this.archetypeCards = new Map();
        this.archetypeCategories = [
            'movement',
            'attackType', 
            'effectType',
            'uniqueAbility',
            'defensive',
            'specialAttack',
            'utility'
        ];
        Logger.info('[ArchetypeTab] Constructed with props:', this.props);
    }

    async init() {
        Logger.info('[ArchetypeTab] Initializing...');
        this.setupEventListeners();
        Logger.info('[ArchetypeTab] Initialization complete');
    }

    onRender() {
        if (!this.container) {
            Logger.warn('[ArchetypeTab] No container available for render');
            return;
        }

        Logger.debug('[ArchetypeTab] Rendering for character:', this.props.character?.name);

        this.container.innerHTML = `
            <div class="archetype-tab">
                <div class="tab-header">
                    <h2>Character Archetypes</h2>
                    <p class="tab-description">
                        Select exactly 7 archetypes that define your character's core abilities and approach to challenges.
                        Each category must have exactly one archetype selected.
                    </p>
                    <div class="selection-progress">
                        ${this.renderSelectionProgress()}
                    </div>
                </div>
                
                <div class="archetype-categories">
                    ${this.renderArchetypeCategories()}
                </div>
            </div>
        `;

        Logger.debug('[ArchetypeTab] Render complete');
    }

    renderSelectionProgress() {
        const selectedCount = this.getSelectedArchetypesCount();
        const progressClass = selectedCount === 7 ? 'complete' : selectedCount > 7 ? 'over' : 'incomplete';
        
        return `
            <div class="progress-indicator ${progressClass}">
                <span class="progress-text">Selected: ${selectedCount}/7</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(selectedCount / 7 * 100, 100)}%"></div>
                </div>
            </div>
        `;
    }

    renderArchetypeCategories() {
        return this.archetypeCategories.map(category => {
            return `
                <div class="archetype-category" data-category="${category}">
                    <div class="category-header">
                        <h3 class="category-title">${this.formatCategoryTitle(category)}</h3>
                        <div class="category-status">
                            ${this.renderCategoryStatus(category)}
                        </div>
                    </div>
                    <div class="category-description">
                        ${this.getCategoryDescription(category)}
                    </div>
                    <div class="category-archetypes" data-category="${category}">
                        ${this.renderCategoryArchetypes(category)}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCategoryStatus(category) {
        const selectedArchetype = this.getSelectedArchetypeForCategory(category);
        
        if (selectedArchetype) {
            return `<span class="status-selected">✓ ${selectedArchetype.name}</span>`;
        } else {
            return `<span class="status-empty">Not selected</span>`;
        }
    }

    renderCategoryArchetypes(category) {
        const archetypes = this.getArchetypesForCategory(category);
        
        if (!archetypes || archetypes.length === 0) {
            return '<p class="no-archetypes">No archetypes available for this category.</p>';
        }

        const container = document.createElement('div');
        container.className = 'archetypes-grid';

        archetypes.forEach(archetype => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'archetype-card-container';
            cardContainer.dataset.archetypeId = archetype.id;
            cardContainer.dataset.category = category;
            
            // Check if this archetype is selected
            const isSelected = this.isArchetypeSelected(archetype.id);
            
            // Create card component
            const card = new UniversalCard(cardContainer, {
                entity: archetype,
                entityType: 'archetype',
                isSelected,
                canPurchase: true,
                canRemove: isSelected,
                size: 'medium',
                showDescription: true,
                showCost: false, // Archetypes don't have point costs
                showEffects: true,
                showRequirements: false
            });

            card.init();
            container.appendChild(cardContainer);
            
            // Store card reference
            this.archetypeCards.set(archetype.id, card);
        });

        return container.outerHTML;
    }

    setupEventListeners() {
        if (!this.container) {
            Logger.error('[ArchetypeTab] Cannot setup event listeners - no container');
            return;
        }

        // Listen for archetype selection from cards
        this._addEventListener(this.container, 'card-purchase-action', this.handleArchetypeAction);
        
        Logger.debug('[ArchetypeTab] Event listeners setup complete');
    }

    async handleArchetypeAction(event) {
        const { action, entity, entityType } = event.detail;
        
        if (entityType !== 'archetype') {
            Logger.debug('[ArchetypeTab] Ignoring non-archetype action');
            return;
        }

        Logger.info(`[ArchetypeTab] Handling archetype action: ${action} for:`, entity.id);

        try {
            let success = false;

            switch (action) {
                case 'select':
                case 'purchase': // Treat purchase as select for archetypes
                    success = await this.handleArchetypeSelect(entity);
                    break;
                case 'remove':
                    success = await this.handleArchetypeDeselect(entity);
                    break;
                default:
                    Logger.error(`[ArchetypeTab] Unknown archetype action: ${action}`);
                    return;
            }

            if (success) {
                Logger.info(`[ArchetypeTab] Archetype ${action} successful:`, entity.name);
            } else {
                Logger.warn(`[ArchetypeTab] Archetype ${action} failed:`, entity.name);
            }

        } catch (error) {
            Logger.error(`[ArchetypeTab] Error handling archetype ${action}:`, error);
        }
    }

    async handleArchetypeSelect(archetype) {
        Logger.debug('[ArchetypeTab] Selecting archetype:', archetype.id);

        try {
            const category = this.getCategoryForArchetype(archetype.id);
            if (!category) {
                Logger.error('[ArchetypeTab] Cannot determine category for archetype:', archetype.id);
                return false;
            }

            // Get current character state
            const character = { ...this.props.character };
            
            // Initialize archetypes object if it doesn't exist
            if (!character.archetypes) {
                character.archetypes = {};
            }

            // Check if another archetype is already selected in this category
            const currentSelection = character.archetypes[category];
            if (currentSelection && currentSelection !== archetype.id) {
                Logger.info(`[ArchetypeTab] Replacing ${category} archetype ${currentSelection} with ${archetype.id}`);
            }

            // Set the new archetype for this category
            character.archetypes[category] = archetype.id;

            // Update state
            await StateManager.updateState(character, `Selected ${archetype.name} archetype for ${category}`);

            Logger.info(`[ArchetypeTab] Archetype selection successful: ${archetype.name}`);
            return true;

        } catch (error) {
            Logger.error('[ArchetypeTab] Error selecting archetype:', error);
            return false;
        }
    }

    async handleArchetypeDeselect(archetype) {
        Logger.debug('[ArchetypeTab] Deselecting archetype:', archetype.id);

        try {
            const category = this.getCategoryForArchetype(archetype.id);
            if (!category) {
                Logger.error('[ArchetypeTab] Cannot determine category for archetype:', archetype.id);
                return false;
            }

            // Get current character state
            const character = { ...this.props.character };
            
            // Remove the archetype selection
            if (character.archetypes && character.archetypes[category] === archetype.id) {
                delete character.archetypes[category];
                
                // Update state
                await StateManager.updateState(character, `Deselected ${archetype.name} archetype from ${category}`);
                
                Logger.info(`[ArchetypeTab] Archetype deselection successful: ${archetype.name}`);
                return true;
            } else {
                Logger.warn('[ArchetypeTab] Archetype was not selected:', archetype.id);
                return false;
            }

        } catch (error) {
            Logger.error('[ArchetypeTab] Error deselecting archetype:', error);
            return false;
        }
    }

    // Helper methods
    getSelectedArchetypesCount() {
        const character = this.props.character;
        if (!character || !character.archetypes) return 0;
        
        return Object.keys(character.archetypes).length;
    }

    getSelectedArchetypeForCategory(category) {
        const character = this.props.character;
        if (!character || !character.archetypes || !character.archetypes[category]) {
            return null;
        }

        const archetypeId = character.archetypes[category];
        return this.findArchetypeById(archetypeId);
    }

    isArchetypeSelected(archetypeId) {
        const character = this.props.character;
        if (!character || !character.archetypes) return false;
        
        return Object.values(character.archetypes).includes(archetypeId);
    }

    getArchetypesForCategory(category) {
        const gameData = this.props.gameData;
        if (!gameData || !gameData.archetypes) {
            Logger.warn(`[ArchetypeTab] No archetype data available`);
            return [];
        }

        return gameData.archetypes.filter(archetype => archetype.category === category) || [];
    }

    getCategoryForArchetype(archetypeId) {
        const gameData = this.props.gameData;
        if (!gameData || !gameData.archetypes) return null;

        const archetype = gameData.archetypes.find(a => a.id === archetypeId);
        return archetype ? archetype.category : null;
    }

    findArchetypeById(archetypeId) {
        const gameData = this.props.gameData;
        if (!gameData || !gameData.archetypes) return null;

        return gameData.archetypes.find(a => a.id === archetypeId) || null;
    }

    formatCategoryTitle(category) {
        // Convert camelCase to Title Case
        return category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    getCategoryDescription(category) {
        const descriptions = {
            movement: 'How your character moves and traverses the environment.',
            attackType: 'The primary method and range of your character\'s attacks.',
            effectType: 'The types of effects your character specializes in applying.',
            uniqueAbility: 'Special powers or abilities that set your character apart.',
            defensive: 'How your character protects themselves and others.',
            specialAttack: 'Advanced attack techniques and combat specializations.',
            utility: 'Non-combat abilities and problem-solving approaches.'
        };
        
        return descriptions[category] || 'Character specialization category.';
    }

    // Update method called by StateConnector
    update(nextProps, prevProps) {
        Logger.debug('[ArchetypeTab] Update called with new props:', nextProps);

        // Check if character archetypes changed
        const archetypesChanged = !prevProps || 
            JSON.stringify(prevProps.character?.archetypes) !== JSON.stringify(nextProps.character?.archetypes);

        if (archetypesChanged) {
            Logger.info('[ArchetypeTab] Character archetypes changed, re-rendering');
            
            // Update props
            this.props = nextProps;
            
            // Re-render everything
            this._requestRender();
        } else {
            Logger.debug('[ArchetypeTab] No archetype changes, skipping re-render');
        }
    }

    // Debug information
    getDebugInfo() {
        return {
            characterId: this.props.character?.id,
            characterName: this.props.character?.name,
            selectedArchetypes: this.props.character?.archetypes || {},
            selectedCount: this.getSelectedArchetypesCount(),
            cardsCount: this.archetypeCards.size
        };
    }

    destroy() {
        Logger.info('[ArchetypeTab] Destroying...');

        // Clean up archetype cards
        this.archetypeCards.forEach(card => {
            if (card && typeof card.destroy === 'function') {
                card.destroy();
            }
        });
        this.archetypeCards.clear();

        // Call parent destroy
        super.destroy();

        Logger.info('[ArchetypeTab] Destroyed');
    }
}

// State mapping function
const mapStateToProps = (state) => {
    if (!state) {
        Logger.debug('[ArchetypeTab] mapStateToProps: No state available');
        return {
            character: {},
            gameData: {},
            archetypes: {}
        };
    }

    Logger.debug('[ArchetypeTab] mapStateToProps: Mapping state to props', {
        characterName: state.name,
        archetypesCount: Object.keys(state.archetypes || {}).length
    });

    return {
        character: state,
        gameData: window.gameData || {},
        archetypes: state.archetypes || {}
    };
};

// Connect to state with debugging
const ConnectedArchetypeTab = connectToState(mapStateToProps, {
    displayName: 'ConnectedArchetypeTab',
    debugMode: true
})(ArchetypeTab);

export { ConnectedArchetypeTab as ArchetypeTab };