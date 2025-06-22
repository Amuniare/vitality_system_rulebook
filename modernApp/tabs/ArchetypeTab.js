// modernApp/tabs/ArchetypeTab.js
import { Logger } from '../utils/Logger.js';
import { StateManager } from '../core/StateManager.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { EventBus } from '../core/EventBus.js';
import { UniversalCard } from '../components/UniversalCard.js'; // Import UniversalCard
import { RequirementSystem } from '../systems/RequirementSystem.js'; // Import RequirementSystem

export class ArchetypeTab {
    constructor(container) {
        this.container = container;
        this.archetypeCategories = [
            { key: 'movement', label: 'Movement Archetype' },
            { key: 'attackType', label: 'Attack Type Archetype' },
            { key: 'effectType', label: 'Effect Type Archetype' },
            { key: 'uniqueAbility', label: 'Unique Ability Focus' },
            { key: 'defensive', label: 'Defensive Method' },
            { key: 'specialAttack', label: 'Special Attack Method' },
            { key: 'utility', label: 'Utility Method' }
        ];
        
        this.selectedArchetypes = {}; // This will hold { categoryKey: archetypeId }
        this.archetypeData = {}; // This will hold { categoryKey: [archetypeEntities] }
        
        // Bind methods
        this.handleArchetypeSelection = this.handleArchetypeSelection.bind(this);
        this._boundOnCharacterUpdate = this.onCharacterUpdate.bind(this); // Store bound reference
        
        EventBus.on('CHARACTER_LOADED', this._boundOnCharacterUpdate);
        EventBus.on('CHARACTER_CHANGED', this._boundOnCharacterUpdate);
    }
    
    async init() {
        Logger.info('[ArchetypeTab] Initializing...');
        await this.loadArchetypeData();
        this.loadCharacterArchetypes(); 
        // Render will be called by app.js when tab is active
        Logger.info('[ArchetypeTab] Initialized.');
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
        const character = StateManager.getCharacter();
        if (character && character.archetypes) {
            this.selectedArchetypes = { ...character.archetypes };
        } else {
            this.selectedArchetypes = {};
        }
        Logger.debug('[ArchetypeTab] Character archetypes loaded/reloaded:', this.selectedArchetypes);
    }

    onCharacterUpdate(character) {
        if (character && character.archetypes) {
            const currentSelectionsJSON = JSON.stringify(this.selectedArchetypes);
            const newSelectionsJSON = JSON.stringify(character.archetypes);
            
            if (currentSelectionsJSON !== newSelectionsJSON) {
                this.selectedArchetypes = { ...character.archetypes };
                if (this.container && this.container.style.display !== 'none') {
                    this.render(); 
                    Logger.debug('[ArchetypeTab] Re-rendered due to external character archetype update.');
                }
            }
        }
    }
    
    render() {
        if (!this.container) {
            Logger.error('[ArchetypeTab] Container not found for rendering.');
            return;
        }
        Logger.info('[ArchetypeTab] Rendering...');
        
        this.loadCharacterArchetypes(); // Ensure selections are fresh

        this.container.innerHTML = ''; 
        
        const header = document.createElement('div');
        header.className = 'tab-header';
        header.innerHTML = `
            <h2>Archetype Selection</h2>
            <p>Select one archetype from each category. Archetypes define your character's core capabilities, statistical bonuses, and how some systems (like Special Attacks) function.</p>
        `;
        this.container.appendChild(header);
        
        const selectionsContainer = document.createElement('div');
        selectionsContainer.className = 'archetype-selections-container'; // Main container for all categories
        
        this.archetypeCategories.forEach(category => {
            const categorySection = this.createArchetypeCategorySection(category);
            selectionsContainer.appendChild(categorySection);
        });
        
        this.container.appendChild(selectionsContainer);
        this.setupEventListeners(); // Setup delegated listener
        
        Logger.debug('[ArchetypeTab] Rendered.');
    }
    
    createArchetypeCategorySection(category) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'archetype-category-section section-content'; // Use section-content for styling
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'section-header';
        headerDiv.innerHTML = `<h3>${category.label}</h3>`;
        sectionDiv.appendChild(headerDiv);

        const gridDiv = document.createElement('div');
        gridDiv.className = 'purchase-grid archetype-grid'; // Use purchase-grid for card layout
        gridDiv.dataset.categoryKey = category.key; // For event delegation
        
        const archetypesForCategory = this.archetypeData[category.key] || [];
        if (archetypesForCategory.length === 0) {
            Logger.warn(`[ArchetypeTab] No archetypes found for category: ${category.key}`);
            gridDiv.innerHTML = '<p class="no-items">No archetypes available for this category.</p>';
        } else {
            const character = StateManager.getCharacter();
            gridDiv.innerHTML = archetypesForCategory.map(archetypeEntity => {
                const isCurrentlySelected = this.selectedArchetypes[category.key] === archetypeEntity.id;
                const reqCheck = RequirementSystem.check(archetypeEntity.requirements, character);

                const cardContext = {
                    isPurchased: isCurrentlySelected,
                    isAffordable: true, 
                    areRequirementsMet: reqCheck.areMet,
                    unmetRequirements: reqCheck.unmet,
                    entityType: 'archetype',
                    interactionType: 'select',
                    categoryKey: category.key
                };
                return UniversalCard.render(archetypeEntity, cardContext);
            }).join('');
        }
        sectionDiv.appendChild(gridDiv);
        return sectionDiv;
    }

    setupEventListeners() {
        // Use event delegation on the main container for all archetype card interactions
        if (this.container._archetypeClickListener) {
            this.container.removeEventListener('click', this.container._archetypeClickListener);
        }

        this.container._archetypeClickListener = (event) => {
            const button = event.target.closest('button[data-action="select_archetype"]');
            if (button) {
                const entityId = button.dataset.entityId;
                const categoryKey = button.dataset.categoryKey; // Get category from button
                if (entityId && categoryKey) {
                    this.handleArchetypeSelection(categoryKey, entityId);
                }
            }
        };
        this.container.addEventListener('click', this.container._archetypeClickListener);
    }
    
    handleArchetypeSelection(categoryKey, archetypeId) {
        Logger.info(`[ArchetypeTab] Archetype selected: ${categoryKey} = ${archetypeId}`);
        
        // Update local state
        this.selectedArchetypes[categoryKey] = archetypeId;
        
        // Dispatch to StateManager
        StateManager.dispatch('UPDATE_ARCHETYPES', { ...this.selectedArchetypes });
        
        // The CHARACTER_CHANGED event will trigger a re-render if the tab is active.
        // If not active, the render will happen when it becomes active.
        // For immediate feedback within the tab even if CHARACTER_CHANGED doesn't cause a full re-render (e.g., due to same object ref),
        // we can specifically re-render the affected category or the whole tab.
        // However, with `onCharacterUpdate` triggering render, this should be handled.
    }
    
    // updateDetailsPanel is no longer needed as details are part of the cards.
    // renderArchetypeEffects is also part of UniversalCard now.
    
    cleanup() {
        if (this._boundOnCharacterUpdate) {
            EventBus.off('CHARACTER_LOADED', this._boundOnCharacterUpdate);
            EventBus.off('CHARACTER_CHANGED', this._boundOnCharacterUpdate);
        }
        if (this.container && this.container._archetypeClickListener) {
            this.container.removeEventListener('click', this.container._archetypeClickListener);
            delete this.container._archetypeClickListener;
        }
        Logger.info('[ArchetypeTab] Cleanup called.');
    }
}