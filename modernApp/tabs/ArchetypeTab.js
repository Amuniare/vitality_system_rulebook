// modernApp/tabs/ArchetypeTab.js
import { Component } from '../core/Component.js';
import { connectToState } from '../core/StateConnector.js';
import { StateManager } from '../core/StateManager.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { UniversalCard } from '../components/UniversalCard.js';
import { RequirementSystem } from '../systems/RequirementSystem.js';
import { Logger } from '../utils/Logger.js';

class ArchetypeTab extends Component {
    static propSchema = {
        character: { type: 'object', default: () => ({}) },
        archetypes: { type: 'object', default: () => ({}) }
    };

    constructor(container, initialProps = {}) {
        super(initialProps, container);
        
        // Store selected archetypes in component state
        this.state = {
            selectedArchetypes: {},
            loading: false,
            pendingUpdates: new Set()
        };

        this.archetypeCategories = [
            { key: 'movement', label: 'Movement Archetype' },
            { key: 'attackType', label: 'Attack Type Archetype' },
            { key: 'effectType', label: 'Effect Type Archetype' },
            { key: 'uniqueAbility', label: 'Unique Ability Focus' },
            { key: 'defensive', label: 'Defensive Method' },
            { key: 'specialAttack', label: 'Special Attack Method' },
            { key: 'utility', label: 'Utility Method' }
        ];
        
        this.archetypeData = {};
        this.handleArchetypeSelection = this.handleArchetypeSelection.bind(this);
    }

    async init() {
        this.componentId = `archetype-tab-${Date.now()}`;
        
        // Add loading states
        this.setState({ loading: true });
        
        await this.loadArchetypeData();
        this.loadCharacterArchetypes();
        
        // Use proper event delegation
        this._addEventListener(this.container, 'click', this.handleContainerClick.bind(this));
        
        this.setState({ loading: false });
        Logger.info('[ArchetypeTab] Initialized with proper Component pattern');
    }

    async loadArchetypeData() {
        try {
            const allEntities = Array.from(EntityLoader.entities.values());
            this.archetypeCategories.forEach(category => {
                this.archetypeData[category.key] = allEntities.filter(entity => 
                    entity.type === 'archetype' && 
                    entity.ui?.category === category.key
                );
                Logger.debug(`[ArchetypeTab] Loaded ${this.archetypeData[category.key].length} ${category.key} archetypes`);
            });
        } catch (error) {
            Logger.error('[ArchetypeTab] Failed to load archetype data:', error);
        }
    }

    loadCharacterArchetypes() {
        const { character } = this.props;
        if (character && character.archetypes) {
            this.setState({ 
                selectedArchetypes: { ...character.archetypes } 
            });
        }
        Logger.debug('[ArchetypeTab] Character archetypes loaded:', this.state.selectedArchetypes);
    }

    // Use proper event delegation
    handleContainerClick(e) {
        const archetypeCard = e.target.closest('.selectable-card');
        if (!archetypeCard) return;

        const action = archetypeCard.dataset.action;
        const entityId = archetypeCard.dataset.entityId;
        const categoryKey = archetypeCard.dataset.categoryKey;

        if (action === 'select_archetype' && entityId && categoryKey) {
            this.handleArchetypeSelection(categoryKey, entityId);
        }
    }

    // Implement optimistic UI updates and batch state updates
    async handleArchetypeSelection(categoryKey, archetypeId) {
        Logger.info(`[ArchetypeTab] Selecting archetype: ${archetypeId} for category: ${categoryKey}`);
        
        // Optimistic UI update - update local state immediately
        const newSelectedArchetypes = { ...this.state.selectedArchetypes };
        newSelectedArchetypes[categoryKey] = archetypeId;
        
        this.setState({ 
            selectedArchetypes: newSelectedArchetypes,
            pendingUpdates: new Set([...this.state.pendingUpdates, categoryKey])
        });

        // Batch state updates - debounce multiple rapid changes
        this.debouncedStateUpdate = this.debouncedStateUpdate || this.debounce(() => {
            const updates = Array.from(this.state.pendingUpdates);
            if (updates.length > 0) {
                StateManager.dispatch('SET_ARCHETYPE_SELECTIONS', {
                    archetypes: this.state.selectedArchetypes
                });
                this.setState({ pendingUpdates: new Set() });
            }
        }, 300);

        this.debouncedStateUpdate();
    }

    // Helper method for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    render() {
        if (!this.container) return;

        const { character } = this.props;
        const { loading, selectedArchetypes } = this.state;

        if (loading) {
            this.container.innerHTML = '<div class="loading">Loading archetypes...</div>';
            return;
        }

        this.container.innerHTML = `
            <div class="tab-header">
                <h2>Archetype Selection</h2>
                <p>Select one archetype from each category. Archetypes define your character's core capabilities, statistical bonuses, and how some systems (like Special Attacks) function.</p>
            </div>
            <div class="archetype-selections-container">
                ${this.archetypeCategories.map(category => this.renderArchetypeCategory(category, character)).join('')}
            </div>
        `;
    }

    renderArchetypeCategory(category, character) {
        const archetypesForCategory = this.archetypeData[category.key] || [];
        const selectedArchetypeId = this.state.selectedArchetypes[category.key];
        
        if (archetypesForCategory.length === 0) {
            return `
                <div class="archetype-category-section section-content">
                    <div class="section-header">
                        <h3>${category.label}</h3>
                    </div>
                    <p class="no-items">No archetypes available for this category.</p>
                </div>
            `;
        }

        const cardsHtml = archetypesForCategory.map(archetype => {
            const isSelected = selectedArchetypeId === archetype.id;
            const reqCheck = RequirementSystem.check(archetype.requirements, character);
            
            const context = {
                isPurchased: isSelected,
                areRequirementsMet: reqCheck.areMet,
                unmetRequirements: reqCheck.unmet,
                entityType: 'archetype',
                interactionType: 'select',
                categoryKey: category.key
            };

            return UniversalCard.render(archetype, context);
        }).join('');

        return `
            <div class="archetype-category-section section-content">
                <div class="section-header">
                    <h3>${category.label}</h3>
                </div>
                <div class="purchase-grid archetype-grid" data-category-key="${category.key}">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }

    // Override update to sync component state with props
    update(newProps) {
        super.update(newProps);
        
        // Sync selected archetypes when props change
        if (newProps.character && newProps.character.archetypes) {
            const propArchetypes = newProps.character.archetypes;
            if (JSON.stringify(propArchetypes) !== JSON.stringify(this.state.selectedArchetypes)) {
                this.setState({ 
                    selectedArchetypes: { ...propArchetypes },
                    pendingUpdates: new Set() // Clear pending updates since props updated
                });
            }
        }
    }
}

const mapStateToProps = (state) => ({
    character: state,
    archetypes: state.archetypes || {}
});

const ConnectedArchetypeTab = connectToState(mapStateToProps)(ArchetypeTab);
export { ConnectedArchetypeTab as ArchetypeTab };