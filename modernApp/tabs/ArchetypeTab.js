// modernApp/tabs/ArchetypeTab.js
import { Logger } from '../utils/Logger.js';
import { StateManager } from '../core/StateManager.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { EventBus } from '../core/EventBus.js';

export class ArchetypeTab {
    constructor(container) { // Accept container
        this.container = container; // Store it
        this.archetypeCategories = [
            { key: 'movement', label: 'Movement Archetype' },
            { key: 'attackType', label: 'Attack Type Archetype' },
            { key: 'effectType', label: 'Effect Type Archetype' },
            { key: 'uniqueAbility', label: 'Unique Ability Focus' },
            { key: 'defensive', label: 'Defensive Method' },
            { key: 'specialAttack', label: 'Special Attack Method' },
            { key: 'utility', label: 'Utility Method' }
        ];
        
        this.selectedArchetypes = {};
        this.archetypeData = {};
        
        // Bind methods
        this.handleArchetypeChange = this.handleArchetypeChange.bind(this);
        
        // Listen for character changes to update selections if needed
        EventBus.on('CHARACTER_LOADED', (data) => this.onCharacterUpdate(data.character));
        EventBus.on('CHARACTER_CHANGED', (data) => this.onCharacterUpdate(data.character));
    }
    
    async init() {
        Logger.info('[ArchetypeTab] Initializing...');
        await this.loadArchetypeData();
        this.loadCharacterArchetypes(); // Load initial selections
        // Render will be called by app.js when tab is active
        Logger.info('[ArchetypeTab] Initialized.');
    }
    
    async loadArchetypeData() {
        try {
            const allEntities = Array.from(EntityLoader.entities.values());
            this.archetypeCategories.forEach(category => {
                this.archetypeData[category.key] = allEntities.filter(entity => 
                    entity.type === 'archetype' && 
                    entity.ui?.category === category.key // Match against ui.category
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
            const currentSelections = JSON.stringify(this.selectedArchetypes);
            const newSelections = JSON.stringify(character.archetypes);
            if (currentSelections !== newSelections) {
                this.selectedArchetypes = { ...character.archetypes };
                if (this.container && this.container.style.display !== 'none') { // If tab is active
                    this.render(); // Re-render if selections changed externally
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
        
        this.loadCharacterArchetypes(); // Ensure selections are fresh before rendering

        this.container.innerHTML = ''; // Clear existing content from the passed container
        
        const header = document.createElement('div');
        header.className = 'tab-header';
        header.innerHTML = `
            <h2>Archetype Selection</h2>
            <p>Select one archetype from each category. Archetypes define your character's core capabilities, statistical bonuses, and how some systems (like Special Attacks) function.</p>
        `;
        this.container.appendChild(header);
        
        const selectionsContainer = document.createElement('div');
        selectionsContainer.className = 'archetype-selections';
        
        this.archetypeCategories.forEach(category => {
            const selection = this.createArchetypeSelection(category);
            selectionsContainer.appendChild(selection);
        });
        
        this.container.appendChild(selectionsContainer);
        
        const detailsPanel = document.createElement('div');
        detailsPanel.className = 'archetype-details-panel';
        detailsPanel.id = 'archetype-details-panel-content'; // Unique ID for the content area
        this.container.appendChild(detailsPanel);
        
        this.updateDetailsPanel(); // Populate details
        
        Logger.debug('[ArchetypeTab] Rendered.');
    }
    
    createArchetypeSelection(category) {
        const container = document.createElement('div');
        container.className = 'archetype-selection form-group'; // Added form-group for styling
        
        const label = document.createElement('label');
        label.textContent = category.label + ':';
        label.htmlFor = `archetype-${category.key}`;
        label.className = 'form-label';
        
        const select = document.createElement('select');
        select.id = `archetype-${category.key}`;
        select.className = 'archetype-select form-select'; // Added form-select
        select.dataset.category = category.key;
        
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Select --';
        select.appendChild(defaultOption);
        
        const archetypes = this.archetypeData[category.key] || [];
        if (archetypes.length === 0) {
            Logger.warn(`[ArchetypeTab] No archetypes found for category: ${category.key}`);
        }
        archetypes.forEach(archetype => {
            const option = document.createElement('option');
            option.value = archetype.id;
            option.textContent = archetype.name;
            if (this.selectedArchetypes[category.key] === archetype.id) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        select.addEventListener('change', this.handleArchetypeChange);
        
        container.appendChild(label);
        container.appendChild(select);
        
        return container;
    }
    
    handleArchetypeChange(event) {
        const select = event.target;
        const categoryKey = select.dataset.category;
        const archetypeId = select.value;
        
        Logger.info(`[ArchetypeTab] Archetype changed: ${categoryKey} = ${archetypeId}`);
        
        if (archetypeId) {
            this.selectedArchetypes[categoryKey] = archetypeId;
        } else {
            delete this.selectedArchetypes[categoryKey];
        }
        
        // Use StateManager.dispatch for archetype updates
        StateManager.dispatch('UPDATE_ARCHETYPES', { ...this.selectedArchetypes });
        
        this.updateDetailsPanel();
    }
    
    updateDetailsPanel() {
        const panel = this.container.querySelector('#archetype-details-panel-content');
        if (!panel) {
            Logger.warn('[ArchetypeTab] Details panel content area not found.');
            return;
        }
        
        panel.innerHTML = '<h3>Selected Archetype Details:</h3>';
        
        const hasSelections = Object.values(this.selectedArchetypes).some(id => id);
        
        if (!hasSelections) {
            panel.innerHTML += '<p>Select archetypes from the dropdowns above to see their details.</p>';
            return;
        }
        
        this.archetypeCategories.forEach(category => {
            const archetypeId = this.selectedArchetypes[category.key];
            if (!archetypeId) return;
            
            const archetype = this.archetypeData[category.key]?.find(a => a.id === archetypeId);
            if (!archetype) return;
            
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'archetype-detail';
            detailsDiv.innerHTML = `
                <h4>${category.label}: ${archetype.name}</h4>
                <p class="description">${archetype.description || 'No description available.'}</p>
                ${this.renderArchetypeEffects(archetype)}
            `;
            panel.appendChild(detailsDiv);
        });
    }
    
    renderArchetypeEffects(archetype) {
        if (!archetype.effects || archetype.effects.length === 0) {
            return '';
        }
        let html = '<div class="archetype-effects"><strong>Effects:</strong><ul>';
        archetype.effects.forEach(effect => {
            html += `<li>${effect.display || effect.type || JSON.stringify(effect)}</li>`;
        });
        html += '</ul></div>';
        return html;
    }
    
    cleanup() {
        // Remove event listeners from selects if they were not re-created on each render
        // Since we rebuild innerHTML on render, specific listeners on selects are implicitly removed.
        // Global EventBus listeners might need explicit removal if this tab instance is destroyed.
        EventBus.off('CHARACTER_LOADED', (data) => this.onCharacterUpdate(data.character));
        EventBus.off('CHARACTER_CHANGED', (data) => this.onCharacterUpdate(data.character));
        Logger.info('[ArchetypeTab] Cleanup called.');
    }
}