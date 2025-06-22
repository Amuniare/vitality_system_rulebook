// modernApp/tabs/ArchetypeTab.js
import { Logger } from '../utils/Logger.js';
import { StateManager } from '../core/StateManager.js';
import { EntityLoader } from '../core/EntityLoader.js';
import { EventBus } from '../core/EventBus.js';

export class ArchetypeTab {
    constructor() {
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
    }
    
    async init() {
        Logger.info('[ArchetypeTab] Initializing...');
        
        // Load archetype data
        await this.loadArchetypeData();
        
        // Load current character's archetypes
        this.loadCharacterArchetypes();
        
        Logger.info('[ArchetypeTab] Initialized.');
    }
    
    async loadArchetypeData() {
        try {
            // Get all archetypes from EntityLoader
            const allEntities = Array.from(EntityLoader.entities.values());
            
            // Filter and organize archetypes by category
            this.archetypeCategories.forEach(category => {
                this.archetypeData[category.key] = allEntities.filter(entity => 
                    entity.type === 'archetype' && 
                    entity.category === category.key
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
    }
    
    render() {
        Logger.info('[ArchetypeTab] Rendering...');
        
        const container = document.getElementById('archetypes-tab');
        if (!container) {
            Logger.error('[ArchetypeTab] Container not found');
            return;
        }
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'tab-header';
        header.innerHTML = `
            <h2>Archetype Selection</h2>
            <p>Select one archetype from each category. Archetypes define your character's core capabilities, statistical bonuses, and how some systems (like Special Attacks) function.</p>
        `;
        container.appendChild(header);
        
        // Create archetype selections
        const selectionsContainer = document.createElement('div');
        selectionsContainer.className = 'archetype-selections';
        
        this.archetypeCategories.forEach(category => {
            const selection = this.createArchetypeSelection(category);
            selectionsContainer.appendChild(selection);
        });
        
        container.appendChild(selectionsContainer);
        
        // Create details panel
        const detailsPanel = document.createElement('div');
        detailsPanel.className = 'archetype-details-panel';
        detailsPanel.id = 'archetype-details';
        detailsPanel.innerHTML = `
            <h3>Selected Archetype Details:</h3>
            <p>Select archetypes from the dropdowns above to see their details.</p>
        `;
        container.appendChild(detailsPanel);
        
        // Update details based on current selections
        this.updateDetailsPanel();
        
        Logger.debug('[ArchetypeTab] Rendered.');
    }
    
    createArchetypeSelection(category) {
        const container = document.createElement('div');
        container.className = 'archetype-selection';
        
        const label = document.createElement('label');
        label.textContent = category.label + ':';
        label.htmlFor = `archetype-${category.key}`;
        
        const select = document.createElement('select');
        select.id = `archetype-${category.key}`;
        select.className = 'archetype-select';
        select.dataset.category = category.key;
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Select --';
        select.appendChild(defaultOption);
        
        // Add archetype options
        const archetypes = this.archetypeData[category.key] || [];
        archetypes.forEach(archetype => {
            const option = document.createElement('option');
            option.value = archetype.id;
            option.textContent = archetype.name;
            
            // Set selected if this is the current archetype
            if (this.selectedArchetypes[category.key] === archetype.id) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        // Add change listener
        select.addEventListener('change', this.handleArchetypeChange);
        
        container.appendChild(label);
        container.appendChild(select);
        
        return container;
    }
    
    handleArchetypeChange(event) {
        const select = event.target;
        const category = select.dataset.category;
        const archetypeId = select.value;
        
        Logger.info(`[ArchetypeTab] Archetype changed: ${category} = ${archetypeId}`);
        
        // Update selected archetypes
        if (archetypeId) {
            this.selectedArchetypes[category] = archetypeId;
        } else {
            delete this.selectedArchetypes[category];
        }
        
        // Update state
        StateManager.updateArchetypes(this.selectedArchetypes);
        
        // Update details panel
        this.updateDetailsPanel();
        
        // Emit event
        EventBus.emit('ARCHETYPE_CHANGED', {
            category,
            archetypeId,
            allArchetypes: this.selectedArchetypes
        });
    }
    
    updateDetailsPanel() {
        const panel = document.getElementById('archetype-details');
        if (!panel) return;
        
        // Clear existing content
        panel.innerHTML = '<h3>Selected Archetype Details:</h3>';
        
        // Check if any archetypes are selected
        const hasSelections = Object.keys(this.selectedArchetypes).length > 0;
        
        if (!hasSelections) {
            panel.innerHTML += '<p>Select archetypes from the dropdowns above to see their details.</p>';
            return;
        }
        
        // Display details for each selected archetype
        this.archetypeCategories.forEach(category => {
            const archetypeId = this.selectedArchetypes[category.key];
            if (!archetypeId) return;
            
            const archetype = this.archetypeData[category.key]?.find(a => a.id === archetypeId);
            if (!archetype) return;
            
            const details = document.createElement('div');
            details.className = 'archetype-detail';
            details.innerHTML = `
                <h4>${category.label}: ${archetype.name}</h4>
                <p class="description">${archetype.description || 'No description available.'}</p>
                ${this.renderArchetypeEffects(archetype)}
            `;
            
            panel.appendChild(details);
        });
    }
    
    renderArchetypeEffects(archetype) {
        if (!archetype.effects || archetype.effects.length === 0) {
            return '';
        }
        
        let html = '<div class="archetype-effects"><strong>Effects:</strong><ul>';
        
        archetype.effects.forEach(effect => {
            html += '<li>';
            
            switch (effect.type) {
                case 'bonus':
                    html += `+${effect.value} ${effect.target}`;
                    break;
                case 'feature':
                    html += effect.display || effect.value || 'Special Feature';
                    break;
                case 'ability':
                    html += effect.display || effect.value || 'Special Ability';
                    break;
                default:
                    html += effect.display || JSON.stringify(effect);
            }
            
            html += '</li>';
        });
        
        html += '</ul></div>';
        return html;
    }
    
    cleanup() {
        // Remove event listeners
        document.querySelectorAll('.archetype-select').forEach(select => {
            select.removeEventListener('change', this.handleArchetypeChange);
        });
    }
}